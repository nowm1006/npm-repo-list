import fs from 'node:fs';
import path from 'node:path';
const filename = process.argv[2];
const basename = path.basename(filename, '.json');
const outputname = basename + '-urls.txt';
const content = fs.readFileSync(filename, { encoding: 'utf-8' });
const plj = JSON.parse(content);
let fd = fs.openSync(outputname, 'w');
Object.keys(plj.packages).forEach(packageName => {
    if (plj.packages[packageName].resolved) {
        fs.writeFileSync(fd, plj.packages[packageName].resolved + '\n');
    }
});
fs.closeSync(fd);
const dependencies = plj.dependencies;
const resolveTree = resolveDeps(basename, {});
fs.writeFileSync(basename + '-resolved.txt', JSON.stringify(resolveTree, null, 2));
function resolveDeps(parent, tree) {
    var _a;
    const key = dependencies[parent].resolved;
    const value = {};
    if ((_a = dependencies[parent]) === null || _a === void 0 ? void 0 : _a.requires) {
        Object.keys(dependencies[parent].requires).forEach((dep) => {
            resolveDeps(dep, value);
        });
    }
    tree[key] = value;
    return tree;
}
