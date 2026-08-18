// Verifies edu_qry_arrays outputs: $arrAdditionSection appended to edu_config.php,
// and the edu_qry_arrays.sql ALTER statements — both from the SAME radio metadata.
const App = require('./harness');
const fs = require('fs');
const path = require('path');

let rows = JSON.parse(fs.readFileSync(path.join(__dirname, 'rows.json'), 'utf8').replace(/^﻿/, ''));
rows = rows.map(r => (r && r.value) ? r.value : r);

function reset(){ App.S.posts=[]; App.S.errors=[]; App.S.warnings=[]; App.S.radioOv={}; App.S.dimensions=[]; }

function assert(cond, msg){ if(!cond){ console.error('FAIL: '+msg); process.exitCode=1; } else { console.log('ok  - '+msg); } }

// ---- real sheet ----
reset();
const res = App.buildPosts(rows);
App.S.posts=res.posts; App.S.errors=res.errors; App.S.warnings=res.warnings;
if(App.S.dimensions[1]) App.S.dimensions[1].postVariable='recrtmnt_mode';

const fields = App.collectRadioFields(res.posts);
const edu = App.genEduConfig(res.posts);
const sql = App.genEduQrySql(res.posts);

console.log('\nradio fields ('+fields.length+'):', fields.join(', '));

// $arrAdditionSection present, well-formed, revision last
const m = edu.match(/\$arrAdditionSection=array\(([\s\S]*?)\);/);
assert(!!m, '$arrAdditionSection present in edu_config.php');
const items = (m?m[1]:'').match(/"([^"]+)"/g).map(s=>s.replace(/"/g,''));
assert(items[items.length-1]==='revision', 'revision is the LAST element');
assert(items.filter(x=>x==='revision').length===1, 'revision appears exactly once');
assert(items.slice(0,-1).join('|')===fields.join('|'), '$arrAdditionSection fields match collectRadioFields, in order');
assert(new Set(items).size===items.length, 'no duplicate entries in $arrAdditionSection');
assert(!edu.includes('<?PHP') && !edu.includes('?>'), 'edu_config.php has no PHP open/close tags');
assert(edu.trim().endsWith(');'), 'edu_config.php still ends with the $arrAdditionSection array');

// SQL: one ALTER per field, none for revision, no dups
const alters = (sql.match(/ADD `([^`]+)`/g)||[]).map(s=>s.replace(/ADD `|`/g,''));
assert(alters.join('|')===fields.join('|'), 'one ALTER per radio field, same order');
assert(!alters.includes('revision'), 'no ALTER for revision');
assert(new Set(alters).size===alters.length, 'no duplicate ALTER statements');
assert((sql.match(/ALTER TABLE `educational_details`/g)||[]).length===fields.length, 'ALTER count == field count');
assert(/ENUM\('Y','N'\)\nCHARACTER SET latin1\nCOLLATE latin1_swedish_ci\nNULL DEFAULT NULL;/.test(sql), 'ALTER uses exact ENUM/charset/collate structure');

console.log('\n--- $arrAdditionSection ---\n'+(m?m[0]:'(missing)'));
console.log('\n--- edu_qry_arrays.sql (first statement) ---\n'+sql.split('\n\n')[0]);

// ---- empty case: no radios ----
reset();
const emptyEdu = App.genEduConfig([]);
const emptySql = App.genEduQrySql([]);
assert(/\$arrAdditionSection=array\(\s*"revision"\s*\);/.test(emptyEdu), 'no-radio case: $arrAdditionSection still has revision');
assert(emptySql==='', 'no-radio case: SQL is empty (file not produced)');

fs.writeFileSync(path.join(__dirname,'out_edu.php'), edu);
fs.writeFileSync(path.join(__dirname,'out_qry.sql'), sql);
