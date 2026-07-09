// Verification for the redesigned mark-condition parsing.
// Covers: plain marks, lone categories (else 0), 2-tier CAT, 3-tier MCAT,
// generic disability detection, operator parsing, and end-to-end PHP generation
// against the two real reference spreadsheets.
const App = require('./harness');
const XLSX = require('xlsx');
const path = require('path');

let fails = 0;
function ok(cond, msg) { console.log((cond ? '  PASS ' : '  FAIL ') + msg); if (!cond) fails++; }
function eq(a, b, msg) { ok(a === b, msg + (a === b ? '' : '  (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')')); }

// ── 1. normMark unit cases ───────────────────────────────────────────────────
console.log('\n=== normMark: plain marks ===');
eq(App.normMark('> 0'), '>0%', '"> 0" -> >0%');
eq(App.normMark('>0 %'), '>0%', '">0 %" -> >0%');
eq(App.normMark('> 0%'), '>0%', '"> 0%" -> >0%');
eq(App.normMark('>=60%'), '>=60%', '">=60%" stays');
eq(App.normMark('-'), null, '"-" -> null');
eq(App.normMark(''), null, 'empty -> null');

console.log('\n=== normMark: lone category (else 0) ===');
eq(App.normMark('ST>=55'), 'CAT:55:0:ST', 'ST>=55');
eq(App.normMark('ST >= 55'), 'CAT:55:0:ST', 'ST >= 55 (spaces)');
eq(App.normMark('ST  >=  55'), 'CAT:55:0:ST', 'ST  >=  55 (multi-space)');
eq(App.normMark('SC >=55 %'), 'CAT:55:0:SC', 'SC >=55 %');
eq(App.normMark('UR = 60'), 'CAT:60:0:UR', 'UR = 60');
eq(App.normMark('OBC < 45'), 'CAT:45:0:OBC', 'OBC < 45');
eq(App.normMark('EWS <= 50'), 'CAT:50:0:EWS', 'EWS <= 50');

console.log('\n=== normMark: two-tier category split ===');
eq(App.normMark('UR/EWS/OBC/ST >=60 %\r\nSC >=55%'), 'CAT:55:60:SC', 'UR.. vs SC -> CAT:55:60:SC');
eq(App.normMark('EWS >=60 %\r\nSC/ST >=55%'), 'CAT:55:60:SC+ST', 'EWS vs SC/ST');
eq(App.normMark('OBC >=60 %\r\nST >=55%'), 'CAT:55:60:ST', 'OBC vs ST');

console.log('\n=== normMark: all categories, one threshold (kept as category if/else) ===');
eq(App.normMark('UR/EWS/OBC/SC/ST >=60 %'), 'CAT:60:0:UR+EWS+OBC+SC+ST', 'all cats @60 -> CAT (named, else 0)');

console.log('\n=== normMark: three-tier MCAT + disability ===');
eq(App.normMark('OC/EWS >=65 %\r\nBC-A/BC-B >=60 %\r\nSC/ST/PWD >= 55 %'),
   'MCAT:55|SC,ST,PwBD~60|BC-A,BC-B~65|OC,EWS', '3 tiers, PWD->PwBD');

console.log('\n=== isDisabilityToken: generic detection (no hardcoded categories) ===');
['PwBD', 'PWD', 'PwD', 'pw bd', 'disability', 'Persons with Benchmark Disability',
 'person with disability', 'divyang', 'differently abled'].forEach(function (t) {
  ok(App.isDisabilityToken(t), 'disability: "' + t + '"');
});
['SC', 'ST', 'OBC', 'EWS', 'UR', 'SEBC', 'VJA', 'NTB', 'BCA', 'OC', 'BC-A'].forEach(function (t) {
  ok(!App.isDisabilityToken(t), 'NOT disability (category): "' + t + '"');
});

console.log('\n=== buildCatCond: disability vs category PHP ===');
eq(App.buildCatCond(['SC', 'ST', 'PwBD']),
   "$_POST['category_name'] == 'SC' || $_POST['category_name'] == 'ST' || $_POST['disability'] == 'Y'",
   'SC/ST/PwBD');
eq(App.buildCatCond(['SC', 'ST', 'PWD']),
   "$_POST['category_name'] == 'SC' || $_POST['category_name'] == 'ST' || $_POST['disability'] == 'Y'",
   'SC/ST/PWD (generic disability)');
eq(App.buildCatCond(['ST-PwBD']),
   "($_POST['category_name'] == 'ST' && $_POST['disability'] == 'Y')",
   'ST-PwBD hybrid');

// ── 2. End-to-end: real spreadsheets ─────────────────────────────────────────
function reset() { App.S.posts = []; App.S.errors = []; App.S.warnings = []; App.S.radioOv = {}; App.S.dimensions = []; App.S.bilingual = false; }
function parseXlsx(file) {
  const wb = XLSX.readFile(path.join(__dirname, '..', file));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
  reset();
  return App.buildPosts(rows);
}

console.log('\n=== End-to-end: Eligibility_Criteria 11.xlsx ===');
{
  const res = parseXlsx('resources/Eligibility_Criteria 11.xlsx');
  console.log('  posts:', res.posts.length, ' errors:', res.errors.length);
  ok(res.errors.length === 0, 'no parse errors (' + res.errors.map(e => e.msg).join('; ') + ')');
  const eli = App.genEligibility(res.posts);
  // Spot-check a known category post: "Officer (Finance)" PG row "UR/EWS/OBC/ST >=60\nSC >=55"
  ok(/\$GradeMarkPer = 55;/.test(eli) && /\$GradeMarkPer = 60;/.test(eli), 'emits GradeMarkPer 55 and 60');
  ok(eli.indexOf("== 'SC'") >= 0, 'category SC condition present');
  ok(eli.indexOf('CAT:') < 0 && eli.indexOf('MCAT:') < 0, 'no raw CAT/MCAT tokens leaked into PHP');
}

console.log('\n=== End-to-end: Eligibility Criteria_bca_bcb.xlsx (disability + BC-A/BC-B) ===');
{
  const res = parseXlsx('resources/Eligibility Criteria_bca_bcb.xlsx');
  console.log('  posts:', res.posts.length, ' errors:', res.errors.length);
  ok(res.errors.length === 0, 'no parse errors (' + res.errors.map(e => e.msg).join('; ') + ')');
  const eli = App.genEligibility(res.posts);
  ok(/\$_POST\['disability'\] == 'Y'/.test(eli), 'PWD -> disability check (not category PWD)');
  ok(eli.indexOf("== 'PWD'") < 0, "no bogus category_name == 'PWD'");
  ok(eli.indexOf("== 'BC-A'") >= 0 && eli.indexOf("== 'BC-B'") >= 0, 'BC-A and BC-B kept as categories');
  ok(/\$GradeMarkPer = 65;/.test(eli) && /\$GradeMarkPer = 60;/.test(eli) && /\$GradeMarkPer = 55;/.test(eli),
     'three thresholds 65/60/55 emitted');
}

console.log('\n' + (fails ? ('MARK VERIFICATION: ' + fails + ' FAIL(S)') : 'MARK VERIFICATION: ALL PASS'));
process.exit(fails ? 1 : 0);
