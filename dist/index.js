import fs from 'node:fs';
import path from 'node:path';
const filename = process.argv[2];
const basename = path.basename(filename);
const outputname = basename + '-urls.txt';
const content = fs.readFileSync(filename, { encoding: 'utf-8' });
const plj = JSON.parse(content);
const fd = fs.openSync(outputname, 'w');
Object.keys(plj.packages).forEach(packageName => {
    if (plj.packages[packageName].resolved) {
        console.log(plj.packages[packageName].resolved);
        fs.writeFileSync(fd, plj.packages[packageName].resolved + '\n');
    }
});
fs.closeSync(fd);
