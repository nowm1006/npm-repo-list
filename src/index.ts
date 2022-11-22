import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'

const pathname = process.argv[2]
const basedir = path.dirname(pathname)
const basename = path.basename(pathname,'.json')
const basenameWithSlash = basename.replace('%','/')

const content = fs.readFileSync(pathname,{encoding:'utf-8'})
const plj = JSON.parse(content)

// download tar balls
Object.keys(plj.packages).forEach(packageName => {
    if (plj.packages[packageName].resolved) {
        const url = plj.packages[packageName].resolved
        downloadByUrl(url,basename)
    }
})

// resolve dependencies
const resolveTree:Record<string,any> = resolveDeps(plj.dependencies,basenameWithSlash,{})
fs.writeFileSync(basedir + '/' + basename + '-resolved.txt',JSON.stringify(resolveTree,null,2))

// sort dependencies
const leveledTree:Record<string,any>[] = levelDeps(plj.dependencies,basenameWithSlash,[])
leveledTree.sort((a,b) =>  b.level - a.level)
const myWritableStream = fs.createWriteStream(path.join(basedir,basename+'-sorted.txt'))
myWritableStream.write(makeDepsTree(leveledTree,'../../npm_packages/'))

function resolveDeps(data:Record<string,any> ,parent:string, tree:Record<string,any>):Record<string,any> {
    const key = data[parent].resolved
    const value:Record<string,any> = {}
    if (data[parent]?.requires) {
        Object.keys(data[parent].requires).forEach((dep: string) => {
            resolveDeps(data, dep, value)
        })
    }     
    tree[key]=value

    return tree
}

function makeDepsTree(leveledTree:Record<string,any>[],basedir:string):string {
    const dependencies:Record<string,any> = {}

    leveledTree.forEach(item => {
        dependencies[item.name] = 'file:' + basedir + item.url
    })
    return JSON.stringify(dependencies,null,2)
}

function levelDeps(data:Record<string,any>, parent:string, list:Record<string,any>[], level:number=1):Record<string,any>[] {
    const url = path.basename(data[parent].resolved)
    const item = {level, name:parent, url}
    list.push(item)
    if (data[parent]?.requires) {
        Object.keys(data[parent].requires).forEach((dep:string)=>{
            levelDeps(data,dep,list,level+1)
        })
    }
    return list
}


function downloadByUrl(url:string, saveDir:string):void {
    const filename = path.basename(url)
    if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir)
    }
    const outfile = fs.createWriteStream(path.join(saveDir,filename))

    https.get(url,res => {
        res.pipe(outfile)
        res.on('end',()=>{
            outfile.close()
        })
    })

}