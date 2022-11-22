import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'

const filename = process.argv[2]
const basename = path.basename(filename,'.json')
const outputname = basename + '-urls.txt'

const content = fs.readFileSync(filename,{encoding:'utf-8'})
const plj = JSON.parse(content)

const fd = fs.openSync(outputname,'w')
fs.mkdirSync(basename,{recursive:true})
Object.keys(plj.packages).forEach(packageName => {
    if (plj.packages[packageName].resolved) {
        fs.writeFileSync(fd,plj.packages[packageName].resolved+'\n')
        
        const url = plj.packages[packageName].resolved
        const fn = path.basename(url)
        const outfile = fs.createWriteStream(basename+'/'+fn)
        https.get(url,res => {
            res.pipe(outfile)
            res.on('end',()=>{
                outfile.close()
            })
        })
    }
})
fs.closeSync(fd)

const dependencies = plj.dependencies
const basenameWithSlash = basename.replace('%','/')
const resolveTree:Record<string,any> = resolveDeps(basenameWithSlash,{})
fs.writeFileSync(basename+'-resolved.txt',JSON.stringify(resolveTree,null,2))

function resolveDeps(parent:string, tree:Record<string,any>):Record<string,any> {
    const key = dependencies[parent].resolved
    const value:Record<string,any> = {}
    if (dependencies[parent]?.requires) {
        Object.keys(dependencies[parent].requires).forEach((dep: string) => {
            resolveDeps(dep, value)
        })
    }     
    tree[key]=value

    return tree
}
