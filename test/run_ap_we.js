// Appeared/Passed-aware post-qualification date selection (work_exp_details_validations.php).
// An AP-active qualification answered "Appeared" has no date of passing, so the
// $eligibilityPostQualidtArr[] entry must not read its timestamp blindly:
//   • academic (ladder) level AP-active → fall back to the next lower academic:
//       ($_POST['pg_appeared']=='A') ? $graduationtimeStr : $pggraduationtimeStr
//   • non-ladder (special) level AP-active → skip it when Appeared:
//       (($_POST['proff_appeared']=='A') || ($graduationtimeStr >= $proftimeStr)) ? $graduationtimeStr : $proftimeStr
//   • nothing AP-active → legacy output unchanged.
// Reference sheet: resources/Revised_Eligibility_Criteria_ieb_ap_pwe.xlsx
const App = require('./harness');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  -> ' + detail : '')); }
}
function reset(merges) {
  App.S.posts = []; App.S.errors = []; App.S.warnings = []; App.S.radioOv = {}; App.S.dimensions = [];
  App.S.appearedPassed = { enabled: false, fields: {}, hierarchy: null, generic: null, scoped: false };
  App.S.sheetMerges = merges || [];
}
const has = (s, needle) => s.indexOf(needle) >= 0;

const PG_LINE = "$eligibilityPostQualidtArr[]  = ($_POST['pg_appeared']=='A') ? $graduationtimeStr : $pggraduationtimeStr;";
const PROF_LINE = "$eligibilityPostQualidtArr[]  = (($_POST['proff_appeared']=='A') || ($graduationtimeStr >= $proftimeStr)) ? $graduationtimeStr : $proftimeStr;";

const HDR = ['Sr.No', 'Post Name', 'Exam Passed', 'Degree/Subject / Stream', '% age / Marks', 'Class Grade', 'Post Qualification Work Experience'];
function row(a) { const r = new Array(7).fill(''); a.forEach((v, i) => { r[i] = v; }); return r; }
const ROWS = [HDR,
  row(['1', 'Officer', 'Graduation', 'Commerce', '> 0%', 'Any Class', '2 Years']),
  row(['', '', 'AND']),
  row(['', '', 'Post Graduation', 'MBA', '>= 60%', 'Any Class']),
  row(['2', 'Manager', 'Graduation', 'Commerce', '> 0%', 'Any Class', '2 Years']),
  row(['', '', 'AND']),
  row(['', '', 'Professional Qualification', 'CA', '> 0%', 'Any Class']),
];

console.log('===================== synthetic: Graduation + PG / Graduation + Professional =====================');
{
  reset();
  let posts = App.buildPosts(ROWS).posts;
  const legacy = App.genWorkExpDetails(posts);
  ok('AP off: PG date pushed directly (legacy)', has(legacy, '$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;'));
  ok('AP off: no _appeared reference', !/_appeared/.test(legacy));

  reset();
  posts = App.buildPosts(ROWS).posts;
  App.S.posts = posts;
  App.S.appearedPassed = { enabled: true, fields: { 'Post Graduation': 'pg_appeared', 'Professional Qualification': 'proff_appeared' }, hierarchy: null, generic: null, scoped: false };
  const we = App.genWorkExpDetails(posts);
  ok('PG appearing → falls back to Graduation date', has(we, PG_LINE));
  ok('PG date no longer pushed unconditionally', !has(we, '$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;'));
  ok('Professional (non-ladder) appearing → ternary skip', has(we, PROF_LINE));
  ok('graduation timestamp declared', has(we, '$graduationtimeStr = strtotime('));

  // Only Professional AP-active: PG branch must stay legacy.
  App.S.appearedPassed.fields = { 'Professional Qualification': 'proff_appeared' };
  const we2 = App.genWorkExpDetails(posts);
  ok('PG not AP-active → legacy PG push', has(we2, '$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;'));
  ok('Professional AP-active → ternary skip', has(we2, PROF_LINE));
}

console.log('\n===================== lone AP-active academic (no fallback) =====================');
{
  const rows = [HDR, row(['1', 'Officer', 'Post Graduation', 'MBA', '> 0%', 'Any Class', '2 Years'])];
  reset();
  const posts = App.buildPosts(rows).posts;
  App.S.posts = posts;
  App.S.appearedPassed = { enabled: true, fields: { 'Post Graduation': 'pg_appeared' }, hierarchy: null, generic: null, scoped: false };
  const we = App.genWorkExpDetails(posts);
  ok('push guarded by not-Appeared', /if\(\$_POST\['pg_appeared'\]!='A'\)\{\s*\$eligibilityPostQualidtArr\[\]  = \$pggraduationtimeStr;/.test(we));
}

console.log('\n===================== fixture: Revised_Eligibility_Criteria_ieb_ap_pwe.xlsx =====================');
const fx = path.join(__dirname, '..', 'resources', 'Revised_Eligibility_Criteria_ieb_ap_pwe.xlsx');
if (!fs.existsSync(fx)) {
  console.log('SKIP (resource not found): ' + fx);
} else {
  const wb = XLSX.readFile(fx);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
  reset(ws['!merges']);
  const posts = App.buildPosts(rows).posts;
  App.S.posts = posts;
  App.S.appearedPassed = { enabled: true, fields: { 'Post Graduation': 'pg_appeared', 'Post Graduation Diploma': 'pgd_appeared', 'Professional Qualification': 'proff_appeared' }, hierarchy: null, generic: null, scoped: false };
  const we = App.genWorkExpDetails(posts);
  ok('PG branches use Appeared fallback', has(we, PG_LINE));
  ok('PG Diploma branches use Appeared fallback', has(we, "($_POST['pgd_appeared']=='A') ? $graduationtimeStr : $pggraduationdiplomatimeStr;"));
  ok('Professional branches use Appeared-aware ternary', has(we, PROF_LINE));
  ok('no direct PG / PGD push left', !has(we, '$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;') && !has(we, '$eligibilityPostQualidtArr[]  = $pggraduationdiplomatimeStr;'));
}

console.log('\nAP WORK-EXP DATE: ' + (fail === 0 ? 'ALL PASS' : fail + ' FAILED') + ' (' + pass + ' passed)');
process.exit(fail === 0 ? 0 : 1);
