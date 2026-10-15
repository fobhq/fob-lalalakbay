import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};vm.runInNewContext(fs.readFileSync('build/festival-data.js','utf8'),context);
const artists=context.window.LALALAKBAY_ARTISTS.map(({id,name})=>({id,name}));
const file='apps-script/LaLaLakbay_Backend_Code.gs';let source=fs.readFileSync(file,'utf8');
const block='// BEGIN GENERATED ARTIST OPTIONS — source: build/festival-data.js\nconst LL_ARTIST_OPTIONS = '+JSON.stringify(artists,null,2)+';\n// END GENERATED ARTIST OPTIONS';
source=/\/\/ BEGIN GENERATED ARTIST OPTIONS[\s\S]*?\/\/ END GENERATED ARTIST OPTIONS/.test(source)?source.replace(/\/\/ BEGIN GENERATED ARTIST OPTIONS[\s\S]*?\/\/ END GENERATED ARTIST OPTIONS/,block):block+'\n\n'+source;
fs.writeFileSync(file,source);
