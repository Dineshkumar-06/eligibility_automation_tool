// Degree-column feature tests. Verifies that a sheet carrying a separate "Degree"
// column (in addition to "Subject / Stream") generates independent Degree arrays
// and condition checks, emitted BEFORE the Stream ones, while leaving Stream-only
// sheets byte-identical. Runs against the two real sample sheets.
const App = require('./harness');
const XLSX = require('xlsx');
const path = require('path');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  -> ' + detail : '')); }
}

function parse(file) {
  const wb = XLSX.readFile(path.join(__dirname, '..', 'resources', file));
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '', raw: false });
  App.S.posts = []; App.S.errors = []; App.S.warnings = []; App.S.radioOv = {}; App.S.dimensions = [];
  const res = App.buildPosts(rows);
  App.S.posts = res.posts;
  return res;
}

function gen(posts) {
  return {
    edu: App.genEduConfig(posts),
    eli: App.genEligibility(posts),
    eduval: App.genEduValidations(posts),
  };
}

['Eligibility Criteria_degree.xls', 'Eligibility Criteria_dd.xls'].forEach(function (file) {
  console.log('\n===================== ' + file + ' =====================');
  const res = parse(file);
  const out = gen(res.posts);

  // ── Column detection: Degree and Subject/Stream are SEPARATE columns ──
  ok('Degree column detected separately from Subject/Stream',
    App.S.colMap.degree !== undefined && App.S.colMap.degree !== App.S.colMap.subject,
    'colMap=' + JSON.stringify(App.S.colMap));

  // ── Parsing: a Graduation condition carries BOTH degrees and subjects ──
  let gradCond = null;
  res.posts.forEach(p => p.orGroups.forEach(g => g.conditions.forEach(c => {
    if (!gradCond && c.type === 'edu' && c.level === 'Graduation' && c.degrees && c.degrees.length && c.subjects.length) gradCond = c;
  })));
  ok('Graduation condition has independent degrees + subjects', !!gradCond,
    gradCond ? 'degrees=' + gradCond.degrees.length + ' subjects=' + gradCond.subjects.length : 'none');

  // ── A "----" placeholder degree (SSC/HSC rows) yields NO degree ──
  let dashLeak = false;
  res.posts.forEach(p => p.orGroups.forEach(g => g.conditions.forEach(c => {
    if (c.degrees && c.degrees.some(d => /^[\s\-–—]+$/.test(d))) dashLeak = true;
  })));
  ok('"----" placeholder does not leak as a degree value', !dashLeak);

  // ── edu_config: Degree arrays present and emitted BEFORE Stream arrays ──
  const degIdx = out.edu.indexOf('arrGraduation_Degree');
  const strIdx = out.edu.indexOf('arrGraduation_Stream');
  ok('edu_config has $arrGraduation_Degree', degIdx >= 0);
  ok('edu_config has $arrGraduation_Stream', strIdx >= 0);
  ok('Degree arrays emitted BEFORE Stream arrays', degIdx >= 0 && strIdx >= 0 && degIdx < strIdx,
    'degIdx=' + degIdx + ' strIdx=' + strIdx);

  // ── Degree gets its OWN _condN suffixes, independent of Stream ──
  ok('Degree has independent _cond suffixes', out.edu.includes('arrGraduation_Degree_cond1'));

  // ── dependents: per level, <pfx>degree precedes <pfx>subjects ──
  const dep = out.edu.split('\n').find(l => l.includes('eligibilityDependents')) || '';
  ok('eligibilityDependents lists graduationdegree before graduationsubjects',
    dep.indexOf("'graduationdegree'") >= 0 &&
    dep.indexOf("'graduationdegree'") < dep.indexOf("'graduationsubjects'"));

  // ── eligibility condition: seldegree check before selstream check ──
  const condLine = out.eli.split('\n').find(l => l.includes('seldegree3') && l.includes('selstream3')) || '';
  ok('condition emits seldegree3 before selstream3',
    condLine.indexOf("seldegree3") >= 0 && condLine.indexOf("seldegree3") < condLine.indexOf("selstream3"),
    condLine.trim().slice(0, 120));
  ok('condition uses array_key_exists on arrGraduation_Degree',
    condLine.includes("array_key_exists($_POST['seldegree3'], $arrGraduation_Degree"));

  // ── eduValidations declares the Degree array globals ──
  const globalLine = out.eduval.split('\n').find(l => l.includes('global ')) || '';
  ok('eduValidations declares $arrGraduation_Degree global', globalLine.includes('$arrGraduation_Degree'));

  // ── error message mentions degree (before subject) ──
  const errLine = out.eli.split('\n').find(l => l.includes('edu_lbl_degree')) || '';
  ok('error message references edu_lbl_degree before edu_lbl_subject',
    errLine.includes('edu_lbl_degree') &&
    (errLine.indexOf('edu_lbl_degree') < errLine.indexOf('edu_lbl_subject') || !errLine.includes('edu_lbl_subject')));
});

// ── BACKWARD COMPAT: a Stream-only sheet emits NO degree artifacts ──
console.log('\n===================== BACKWARD COMPAT (Stream-only rows.json) =====================');
const fs = require('fs');
let legacyRows = JSON.parse(fs.readFileSync(path.join(__dirname, 'rows.json'), 'utf8').replace(/^﻿/, ''));
legacyRows = legacyRows.map(r => (r && r.value) ? r.value : r);
App.S.posts = []; App.S.errors = []; App.S.warnings = []; App.S.radioOv = {}; App.S.dimensions = [];
const lres = App.buildPosts(legacyRows);
App.S.posts = lres.posts;
const lout = gen(lres.posts);
ok('legacy sheet: no Degree column detected', App.S.colMap.degree === undefined);
ok('legacy edu_config has no _Degree array', !lout.edu.includes('_Degree'));
ok('legacy eligibility has no seldegree', !lout.eli.includes('seldegree'));
ok('legacy eduValidations has no _Degree global', !lout.eduval.includes('_Degree'));
ok('legacy dependents has no graduationdegree', !lout.edu.includes("'graduationdegree'"));

console.log('\nDEGREE FEATURE: ' + (fail === 0 ? 'ALL PASS' : fail + ' FAILED') + ' (' + pass + ' passed)');
process.exit(fail === 0 ? 0 : 1);
