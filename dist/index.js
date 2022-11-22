import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
const pathname = process.argv[2];
const basedir = path.dirname(pathname);
const basename = path.basename(pathname, '.json');
const basenameWithSlash = basename.replace('%', '/');
const content = fs.readFileSync(pathname, { encoding: 'utf-8' });
const plj = JSON.parse(content);
// download tar balls
Object.keys(plj.packages).forEach(packageName => {
    if (plj.packages[packageName].resolved) {
        const url = plj.packages[packageName].resolved;
        downloadByUrl(url, basename);
    }
});
// resolve dependencies
const resolveTree = resolveDeps(plj.dependencies, basenameWithSlash, {});
fs.writeFileSync(basedir + '/' + basename + '-resolved.txt', JSON.stringify(resolveTree, null, 2));
// sort dependencies
const leveledTree = levelDeps(plj.dependencies, basenameWithSlash, []);
leveledTree.sort((a, b) => b.level - a.level);
const myWritableStream = fs.createWriteStream(path.join(basedir, basename + '-sorted.txt'));
myWritableStream.write(makeDepsTree(leveledTree, '../../npm_packages/'));
function resolveDeps(data, parent, tree) {
    var _a;
    const key = data[parent].resolved;
    const value = {};
    if ((_a = data[parent]) === null || _a === void 0 ? void 0 : _a.requires) {
        Object.keys(data[parent].requires).forEach((dep) => {
            resolveDeps(data, dep, value);
        });
    }
    tree[key] = value;
    return tree;
}
function makeDepsTree(leveledTree, basedir) {
    const dependencies = {};
    leveledTree.forEach(item => {
        dependencies[item.name] = 'file:' + basedir + item.url;
    });
    return JSON.stringify(dependencies, null, 2);
}
function levelDeps(data, parent, list, level = 1) {
    var _a;
    const url = path.basename(data[parent].resolved);
    const item = { level, name: parent, url };
    list.push(item);
    if ((_a = data[parent]) === null || _a === void 0 ? void 0 : _a.requires) {
        Object.keys(data[parent].requires).forEach((dep) => {
            levelDeps(data, dep, list, level + 1);
        });
    }
    return list;
}
function downloadByUrl(url, saveDir) {
    const filename = path.basename(url);
    if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir);
    }
    const outfile = fs.createWriteStream(path.join(saveDir, filename));
    https.get(url, res => {
        res.pipe(outfile);
        res.on('end', () => {
            outfile.close();
        });
    });
}
