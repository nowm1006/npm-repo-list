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
function downloadByUrl(url, saveDir) {
    const filename = path.basename(url);
    fs.mkdirSync(saveDir, { recursive: true });
    const outfile = fs.createWriteStream(saveDir + '/' + filename);
    https.get(url, res => {
        res.pipe(outfile);
        res.on('end', () => {
            outfile.close();
        });
    });
}
