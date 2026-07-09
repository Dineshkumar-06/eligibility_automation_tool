const App=require('./harness');
const fs=require('fs'),path=require('path');
let rows=JSON.parse(fs.readFileSync(path.join(__dirname,'rows.json'),'utf8').replace(/^﻿/,'')); rows=rows.map(r=>r&&r.value?r.value:r);
// Inject a 3rd dimension "Discipline" at column index 2 (before Exam Passed).
// Give it a value on each post's first row, blank on continuations.
function isPostRow(r){const c0=String(r[0]||'').trim();return c0&&!/^(and|or)$/i.test(c0)&&c0.indexOf('?')<0&&c0.length>2&&!/yes\s*\/\s*no/i.test(c0);}
const out=[]; let disc='General';
for(let i=0;i<rows.length;i++){const r=rows[i].slice();
  let val='';
  if(i===0){val='Discipline';}
  else if(isPostRow(r)){ disc = (disc==='General')?'Technical':'General'; val=disc; }
  out.push(r.slice(0,2).concat([val]).concat(r.slice(2)));
}
App.S.posts=[];App.S.errors=[];App.S.warnings=[];App.S.radioOv={};App.S.dimensions=[];
const res=App.buildPosts(out);
// user mapping
App.S.dimensions[1].postVariable='recrtmnt_mode';
App.S.dimensions[2].postVariable='discipline';
console.log('dimensions:',JSON.stringify(App.S.dimensions));
console.log('posts:',res.posts.length);
res.posts.slice(0,5).forEach(p=>console.log('  ',JSON.stringify(p.dimensions),p.postName.slice(0,25)));
const eli=App.genEligibility(res.posts), edu=App.genEduConfig(res.posts);
console.log('\n--- 3-D eligibility head ---');
console.log(eli.split('\n').slice(3,13).join('\n'));
console.log('\n--- 3-D edu_config (first nested array) ---');
const m=edu.match(/\$arr\w+(\['[0-9]+'\]){3} = [^;]+;/);
console.log(m?edu.split('\n').slice(edu.split('\n').findIndex(l=>l.indexOf("['01']['01']['01']")>=0||/\]\['0\d'\]\['0\d'\]\['0\d'\]/.test(l)),0).join('\n'):'(searching)');
edu.split('\n').forEach((l)=>{ if(/(\['0\d'\]){3} =/.test(l)){console.log(l.slice(0,80));} });
