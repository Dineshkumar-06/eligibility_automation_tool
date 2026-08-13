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

// ── Unit: content-derived field names ───────────────────────────────────────
// deriveField() + disambiguateRadioNames() must produce readable, unique names from
// the question text — never a bare "_2"-style sequential name when the questions
// actually differ in a meaningful word.
console.log('\n===================== field name derivation =====================');
function names(questions) {
  const posts = questions.map((q, i) => {
    const fd = App.deriveField(q);
    return {
      postcode: String(i + 1),
      orGroups: [{ conditions: [{ type: 'radio', question: q, fieldName: fd.fn, langKey: fd.lk,
                                  shouldBe: fd.shouldBe, words: fd.words, status: 'ok' }] }]
    };
  });
  App.disambiguateRadioNames(posts);
  return posts.map(p => p.orGroups[0].conditions[0]);
}
{
  // A long question whose opening words are pure boilerplate: the name must come from
  // the domain words further in, not from "Do you have minimum 08 years …".
  const c = names(['Do you have minimum 08 years post basic qualification experience in IT Industry/ ' +
    'BFSI or IT Vertical of an Organization out of which 04 years of experience in the field of ' +
    'cloud architecture, cloud engineering, or DevOps roles? Should be YES']);
  ok('boilerplate-heavy question gets a content-derived name',
    c[0].fieldName === 'min_eight_it_bfsi', c[0].fieldName);
  ok('"Should be YES" contributes no name material', !/_yes$/.test(c[0].fieldName), c[0].fieldName);
}
{
  // A large family sharing one 4-word base, several pairs needing a 5th word to
  // separate — reproduces a real regression where a condition stuck at the NAME_MAX
  // cap was dropped from the collision registry instead of tombstoned, letting a
  // later, unrelated question silently reuse its name.
  const fn = names([
    'Do you have a minimum 3 years regular service in Sub Regional Officers post ? Yes/No Should be Yes',
    'Do you have a minimum 3 years of regular service in Field Officer post ? Yes/No Should be Yes',
    'Do you have a minimum 3 years regular service in Assistant Systems Officer post ? Yes/No Should be Yes',
    'Do you have a minimum 3 years of regular service in Scientific Officers post ? Yes/No Should be Yes',
    'Do you have a minimum 3 years of regular service in Junior Scientific Officer post ? Yes/No Should be Yes',
    'Do you have a minimum 3 years of regular service in Junior Scientific Assistant post ? Yes/No Should be Yes',
    'Do you have a minimum 3 years of regular service in Laboratory Assistant post ? Yes/No Should be Yes',
    'Do you have a minimum 3 years of regular service in Assistant Law Officer post ? Yes/No Should be Yes',
    'Do you have a minimum 3 years of regular service in Legal Assistant post ? Yes/No Should be Yes',
    'Do you have a minimum 3 years of regular service in Junior Stenographer post ? Yes/No Should be Yes',
    'Do you have a minimum 3 years of regular service in Assistant Accounts Officer post ? Yes/No Should be Yes',
  ]).map(x => x.fieldName);
  ok('a large same-base family resolves to all-unique names', fn.length === new Set(fn).size,
    JSON.stringify(fn));
}
{
  // Similar questions: each keeps the word that actually distinguishes it.
  const c = names([
    'Minimum 5 years experience in IT projects',
    'Minimum 5 years experience in Banking projects',
    'Minimum 5 years experience in IT projects .',   // punctuation-only duplicate
    'Minimum 8 years experience in IT projects',
    'Do you have a valid driving licence?',
  ]);
  const fn = c.map(x => x.fieldName);
  ok('abbreviated, content-derived name for the IT question', fn[0] === 'min_five_it_projects', fn[0]);
  ok('rival question keeps its own distinguishing word', fn[1] === 'min_five_banking_projects', fn[1]);
  ok('punctuation-variant duplicate reuses the same name', fn[2] === fn[0], fn[2]);
  ok('numerically distinct question needs no disambiguation', fn[3] === 'min_eight_it_projects', fn[3]);
  ok('filler words are dropped from the name', fn[4] === 'valid_driving_licence', fn[4]);
  ok('no sequential "_2" style name anywhere', !fn.some(f => /_\d+$/.test(f)), JSON.stringify(fn));
  ok('lang keys mirror the field names', c.every(x => x.langKey === 'edu_' + x.fieldName),
    JSON.stringify(c.map(x => x.langKey)));
  ok('all names are lowercase identifiers', fn.every(f => /^[a-z0-9]+(_[a-z0-9]+)*$/.test(f)), JSON.stringify(fn));
}
{
  // A whole family of siblings: none may reclaim a stem another one outgrew.
  const fn = names([
    'Minimum 5 years experience in IT projects',
    'Minimum 5 years experience in Banking projects',
    'Minimum 5 years experience in Telecom projects',
    'Minimum 5 years experience in Insurance projects',
  ]).map(x => x.fieldName);
  ok('every sibling carries its distinguishing word',
    JSON.stringify(fn) === JSON.stringify(['min_five_it_projects', 'min_five_banking_projects',
      'min_five_telecom_projects', 'min_five_insurance_projects']), JSON.stringify(fn));
}
{
  // Identical word sets (pure reordering) have nothing meaningful to differ on —
  // the numeric-suffix fallback must still guarantee uniqueness.
  const fn = names(['Are you a registered CA?', 'Are you a registered CS?', 'Registered you are a CA ?'])
    .map(x => x.fieldName);
  ok('reordered-wording collision still resolves uniquely',
    fn.length === new Set(fn).size && fn[0] === 'registered_ca' && fn[1] === 'registered_cs',
    JSON.stringify(fn));
}

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
