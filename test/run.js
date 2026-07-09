const App = require('./harness');
const fs = require('fs');
const path = require('path');

let rows = JSON.parse(fs.readFileSync(path.join(__dirname, 'rows.json'), 'utf8').replace(/^﻿/, ''));
// PowerShell ConvertTo-Json wraps each inner array as {value:[...],Count:n}; unwrap.
rows = rows.map(r => (r && r.value) ? r.value : r);

function gen(label, rows, mappingOverride) {
  // reset state
  App.S.posts = []; App.S.errors = []; App.S.warnings = []; App.S.radioOv = {}; App.S.dimensions = [];
  const res = App.buildPosts(rows);
  App.S.posts = res.posts; App.S.errors = res.errors; App.S.warnings = res.warnings;
  if (mappingOverride) mappingOverride(App.S.dimensions);
  console.log('\n===================== ' + label + ' =====================');
  console.log('dimensions:', JSON.stringify(App.S.dimensions));
  console.log('posts:', res.posts.length, '| errors:', res.errors.length, '| warnings:', res.warnings.length);
  console.log('first 6 posts dims/name:');
  res.posts.slice(0, 6).forEach(p => console.log('   ', JSON.stringify(p.dimensions), p.postcode, '|', p.postName));
  return {
    edu: App.genEduConfig(res.posts),
    eli: App.genEligibility(res.posts),
    eduval: App.genEduValidations(res.posts),
    workexp: App.genWorkExpDetails(res.posts),
  };
}

// ---- 2-D real sheet ----
const out = gen('REAL 2-D SHEET (POST + Method of Recruitement)', rows, (dims) => {
  // simulate user mapping override for dim 2
  if (dims[1]) dims[1].postVariable = 'recrtmnt_mode';
});
fs.writeFileSync(path.join(__dirname, 'out_edu.php'), out.edu);
fs.writeFileSync(path.join(__dirname, 'out_eli.php'), out.eli);
fs.writeFileSync(path.join(__dirname, 'out_eduval.php'), out.eduval);
fs.writeFileSync(path.join(__dirname, 'out_workexp.php'), out.workexp);

console.log('\n--- eligibity_validation.php HEAD ---');
console.log(out.eli.split('\n').slice(0, 30).join('\n'));
console.log('\n--- edu_config.php (Graduation block excerpt) ---');
console.log(out.edu.split('\n').slice(0, 40).join('\n'));
console.log('\n--- edu_config.php (arrPostBasedRadioCond excerpt) ---');
const idx = out.edu.indexOf('arrPostBasedRadioCond');
console.log(out.edu.slice(idx - 5, idx + 600));
