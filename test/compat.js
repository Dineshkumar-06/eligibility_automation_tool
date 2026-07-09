// Backward-compatibility regression: a legacy 1-dimension (POST-only) sheet must
// produce BYTE-IDENTICAL output from the refactored modules and the pre-refactor
// app.legacy.js golden reference.
const App = require('./harness');
const Legacy = require('./harness.legacy');
const fs = require('fs');
const path = require('path');

let rows = JSON.parse(fs.readFileSync(path.join(__dirname, 'rows.json'), 'utf8').replace(/^﻿/, ''));
rows = rows.map(r => (r && r.value) ? r.value : r);

// Build a legacy 1-D sheet: remove the "Method of Recruitement" column (index 1)
// and keep only the FIRST block for each distinct post name (legacy sheets never
// repeat a post name). A block runs from a post-name row to the next one.
const hdr = rows[0];
const methodCol = 1; // "Method of Recruitement"
function dropCol(r, c) { return r.slice(0, c).concat(r.slice(c + 1)); }

// Identify post-name rows (col 0 non-empty, not AND/OR/level/question) and keep
// only the first occurrence of each name, dropping later duplicate blocks.
const seen = {};
const out = [];
let keep = true;
for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  const c0 = String(r[0] || '').trim();
  const isPostRow = i > 0 && c0 && !/^(and|or)$/i.test(c0) && c0.indexOf('?') < 0 && c0.length > 2 && !/yes\s*\/\s*no/i.test(c0);
  if (isPostRow) {
    if (seen[c0]) keep = false; else { seen[c0] = true; keep = true; }
  }
  if (i === 0 || keep) out.push(dropCol(r, methodCol));
}

function genNew(rows) {
  App.S.posts = []; App.S.errors = []; App.S.warnings = []; App.S.radioOv = {}; App.S.dimensions = [];
  const res = App.buildPosts(rows);
  return {
    posts: res.posts.length,
    edu: App.genEduConfig(res.posts),
    eli: App.genEligibility(res.posts),
    eduval: App.genEduValidations(res.posts),
    workexp: App.genWorkExpDetails(res.posts),
    dims: App.S.dimensions,
  };
}
function genOld(rows) {
  const res = Legacy.buildPosts(rows);
  return {
    posts: res.posts.length,
    edu: Legacy.genEduConfig(res.posts),
    eli: Legacy.genEligibility(res.posts),
    eduval: Legacy.genEduValidations(res.posts),
    workexp: Legacy.genWorkExpDetails(res.posts),
  };
}

const a = genNew(out);
const b = genOld(out);

// app.legacy.js predates two modular eduConfig features (see harness.legacy.js):
//   - Others-placeholder arrays  $arrX['NN'] = ... = array('01'=>'Others');
//   - optional-radio detection emitting 'Y,N' / 'Should be Yes or No'.
// Normalise both out of edu_config so the comparison isolates the N-dim refactor.
function normEdu(s) {
  const lines = s.split('\n'), out = [];
  for (let i = 0; i < lines.length; i++) {
    if (/Stream\w*(\['[0-9]+'\])+ =/.test(lines[i]) && /'01' => 'Others',/.test(lines[i + 1] || '') && (lines[i + 2] || '').trim() === ');') { i += 2; continue; }
    out.push(lines[i]);
  }
  return out.join('\n')
    .replace(/'shouldbe' => 'Y,N'/g, "'shouldbe' => 'Y'")
    .replace(/'validate_msg' => 'Should be Yes or No'/g, "'validate_msg' => 'Should be Yes'");
}
a.edu = normEdu(a.edu);
b.edu = normEdu(b.edu);

console.log('legacy sheet posts: new=' + a.posts + ' old=' + b.posts);
console.log('detected dimensions:', JSON.stringify(a.dims));

let allOk = true;
for (const k of ['edu', 'eli', 'eduval', 'workexp']) {
  const same = a[k] === b[k];
  allOk = allOk && same;
  console.log(`  ${k.padEnd(8)} : ${same ? 'IDENTICAL ✓' : 'DIFFERS ✗ (new ' + a[k].length + ' vs old ' + b[k].length + ' chars)'}`);
  if (!same) {
    const an = a[k].split('\n'), bn = b[k].split('\n');
    for (let i = 0; i < Math.max(an.length, bn.length); i++) {
      if (an[i] !== bn[i]) {
        console.log(`     first diff at line ${i + 1}:`);
        console.log(`       NEW: ${JSON.stringify(an[i])}`);
        console.log(`       OLD: ${JSON.stringify(bn[i])}`);
        break;
      }
    }
  }
}
console.log(allOk ? '\nBACKWARD COMPAT: PASS — all 4 files byte-identical.' : '\nBACKWARD COMPAT: FAIL');
process.exit(allOk ? 0 : 1);
