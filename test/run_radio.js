// Radio-detection robustness tests. Verifies that Yes/No-style radio questions are
// detected across varied wordings (question mark, "Should be Yes/No", "Select …",
// yes/no pairings) — including when the question is authored in the Subject/Stream
// column or the sheet has no Percentage column — and that detected radios propagate
// through every downstream generator. Also guards the predicate against classifying
// genuine education/subject cells as radios.
const App = require('./harness');
const XLSX = require('xlsx');
const path = require('path');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  -> ' + detail : '')); }
}

// ── Unit: the predicate itself ──────────────────────────────────────────────
console.log('===================== isRadioQuestion predicate =====================');
const POS = [
  'Should be Yes', 'Should be Yes or No', 'Should be No',
  'Select the appropriate option', 'Select one of the following', 'Select Yes if applicable',
  'Have you completed XYZ? Yes / No', 'Do you possess XYZ qualification?', 'Are you registered with ABC?',
  'Yes / No', 'Yes/No', 'Y/N', 'Choose Yes or No',
  '... regular service rendered in Level-7 ... in the grade ?',
  '... ? Select Yes/No Should be Yes', 'Do you have ... experience ... ? Yes/No  Should be YES',
];
const NEG = [
  'Graduation', 'SSC / 10th Standard', 'Arts / Science / Commerce / Agriculture / Management / Others',
  'B.A./B.Sc./BCA/B.E/Others', 'Computer Science / Information Technology', 'AND', 'OR', '-', '----',
  'Post Graduation Degree / Master Degree', 'Diploma', 'Economics/Finance/Others', 'Any Value', '> 0 %',
];
let unitBad = 0;
POS.forEach(s => { if (!App.isRadioQuestion(s)) { unitBad++; console.log('    MISS: ' + s); } });
NEG.forEach(s => { if (App.isRadioQuestion(s)) { unitBad++; console.log('    FALSE POS: ' + s); } });
ok('all ' + POS.length + ' positives detected, all ' + NEG.length + ' negatives rejected', unitBad === 0, unitBad + ' wrong');

// ── End-to-end on the two previously-failing sheets ─────────────────────────
function parse(file) {
  const wb = XLSX.readFile(path.join(__dirname, '..', 'resources', file));
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '', raw: false });
  App.S.posts = []; App.S.errors = []; App.S.warnings = []; App.S.radioOv = {}; App.S.dimensions = [];
  const res = App.buildPosts(rows);
  App.S.posts = res.posts;
  return res;
}
function radioFields(posts) {
  const out = [];
  posts.forEach(p => App.getAllRadios(p).forEach(r => out.push(r.fieldName)));
  return out;
}

// Sheet 1: radio question lives in the Subject/Stream column (Field cell blank).
console.log('\n===================== radio_not_detected.xlsx (Q in Subject column) =====================');
let res = parse('Eligibility Criteria_radio_not_detected.xlsx');
let radios = radioFields(res.posts);
ok('radio question in Subject column is detected', radios.length >= 1, 'fields=' + JSON.stringify(radios));
{
  const edu = App.genEduConfig(res.posts), eli = App.genEligibility(res.posts), lang = App.genLangFile(res.posts);
  ok('edu_config emits $arrPostBasedRadioCond', edu.includes('arrPostBasedRadioCond'));
  ok('eligibilityDependents includes the radio field', radios.some(f => edu.includes("'" + f + "'")));
  ok('eligibility references the radio $_POST', radios.some(f => eli.includes("_POST['" + f + "']")));
  ok('lang file has a label for the radio', radios.some(f => lang.includes("edu_" + f)));
}

// Sheet 2: questions in the Field column, sheet has NO Percentage column.
console.log('\n===================== radio_unparsed.xlsx (no Marks column) =====================');
res = parse('Eligibility Criteria_radio_unparsed.xlsx');
radios = radioFields(res.posts);
ok('header detected despite missing Marks column', App.S.colMap._hdrRow === 0,
  'colMap=' + JSON.stringify(App.S.colMap));
ok('columns not offset (field=2, subject=3)', App.S.colMap.field === 2 && App.S.colMap.subject === 3);
ok('every post that should have a radio got one', radios.length >= 3, 'fields=' + JSON.stringify(radios));
{
  const edu = App.genEduConfig(res.posts), eli = App.genEligibility(res.posts);
  ok('edu_config emits $arrPostBasedRadioCond', edu.includes('arrPostBasedRadioCond'));
  ok('every radio field flows into dependents', radios.every(f => edu.includes("'" + f + "'")));
  ok('every radio field flows into eligibility', radios.every(f => eli.includes("_POST['" + f + "']")));
}

// ── Backward compat: legacy sheet classification unchanged ───────────────────
console.log('\n===================== BACKWARD COMPAT (legacy rows.json) =====================');
const fs = require('fs');
let legacyRows = JSON.parse(fs.readFileSync(path.join(__dirname, 'rows.json'), 'utf8').replace(/^﻿/, ''));
legacyRows = legacyRows.map(r => (r && r.value) ? r.value : r);
const CI = App.detectCols(legacyRows);
function OLD(C) { return C.indexOf('?') >= 0 || /yes\s*[\/\\]\s*no/i.test(C); }
let diff = 0, checked = 0;
for (let i = CI._hdrRow + 1; i < legacyRows.length; i++) {
  const r = legacyRows[i] || [];
  [CI.field, CI.subject].forEach(ci => {
    const v = ci >= 0 && ci < r.length ? String(r[ci] == null ? '' : r[ci]).trim() : '';
    if (!v) return; checked++;
    if (OLD(v) !== App.isRadioQuestion(v)) diff++;
  });
}
ok('new predicate matches old on all ' + checked + ' legacy cells (0 diffs)', diff === 0, diff + ' diffs');

console.log('\nRADIO DETECTION: ' + (fail === 0 ? 'ALL PASS' : fail + ' FAILED') + ' (' + pass + ' passed)');
process.exit(fail === 0 ? 0 : 1);
