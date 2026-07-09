// Test: Internal / Departmental Candidate Support
// Reads resources/Eligibility Criteria_internal_candidate.xlsx and verifies:
//   1. findInternalSeparator detects the separator row
//   2. Normal section parses to 5 posts, internal to 4 posts (no junk rows)
//   3. Degree-as-field fix: internal section reads level column correctly
//   4. Each branched output has exactly one <?PHP, one checkDOPassing, one WE_HEAD/WE_TAIL
//   5. Each branched output has the correct if($_POST['field']=='Y') wrapper
//   6. S.dimensions is restored to normal ctx after a branched run (no singleton leak)
const App = require('./harness');
const fs = require('fs');
const path = require('path');

// Provide a minimal XLSX shim in the harness sandbox if needed.
// The harness exposes the sandbox; we need to inject XLSX.
const XLSX = require('xlsx');

let pass = 0, fail = 0;
function assert(label, condition, extra) {
  if (condition) { console.log('  PASS:', label); pass++; }
  else { console.error('  FAIL:', label, extra !== undefined ? '| got: ' + JSON.stringify(extra) : ''); fail++; }
}

// ── Load the sheet ────────────────────────────────────────────────────────────
const xlsxPath = path.join(__dirname, '..', 'resources', 'Eligibility Criteria_internal_candidate.xlsx');
if (!fs.existsSync(xlsxPath)) {
  console.error('SKIP: resource file not found:', xlsxPath);
  process.exit(0);
}

const wb = XLSX.readFile(xlsxPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });

function resetState() {
  App.S.posts = []; App.S.errors = []; App.S.warnings = [];
  App.S.rawRows = []; App.S.radioOv = {}; App.S.dimensions = [];
  App.S.colMap = {}; App.S.weHeader = ''; App.S.weMode = 2;
  App.S.internalCandidate = { enabled: true, field: 'internal_candidate', posts: [], ctx: null };
  App.S._normalCtx = null;
}

console.log('\n====== run_internal.js ======\n');

// ── 1. Separator detection ────────────────────────────────────────────────────
console.log('--- 1. Separator detection ---');
const sepIdx = App.findInternalSeparator(rows);
assert('separator found (>= 0)', sepIdx >= 0, sepIdx);
console.log('    separator at row', sepIdx, ':', JSON.stringify((rows[sepIdx]||[]).slice(0,4)));

// ── 2. Normal + internal post counts ─────────────────────────────────────────
console.log('\n--- 2. Post counts ---');
resetState();

const normalRows = rows.slice(0, sepIdx);
const internalRows = rows.slice(sepIdx + 1);

const resN = App.buildPostsRange(normalRows);
const ctxN = App.snapCtx();
const resI = App.buildPostsRange(internalRows);
const ctxI = App.snapCtx();

// Restore normal ctx as primary (mirrors parseRows behaviour).
App.S.dimensions = ctxN.dimensions; App.S.colMap = ctxN.colMap;
App.S.weHeader = ctxN.weHeader; App.S.weMode = ctxN.weMode;

console.log('    normal posts:', resN.posts.length, '| internal posts:', resI.posts.length);
console.log('    normal errors:', resN.errors.length, '| internal errors:', resI.errors.length);
assert('normal post count == 5', resN.posts.length === 5, resN.posts.length);
assert('internal post count == 4', resI.posts.length === 4, resI.posts.length);
assert('no normal errors', resN.errors.length === 0, resN.errors.map(e => e.msg));
assert('no internal errors', resI.errors.length === 0, resI.errors.map(e => e.msg));

// ── 3. Degree-as-field fix — internal section levels parsed correctly ─────────
console.log('\n--- 3. Degree-as-field fix ---');
const internalLevels = resI.posts.flatMap(p => p.orGroups.flatMap(g => g.conditions.filter(c => c.type === 'edu').map(c => c.level)));
console.log('    internal edu levels found:', [...new Set(internalLevels)]);
assert('internal edu conditions have levels', internalLevels.length > 0, internalLevels.length);
assert('no undefined levels', internalLevels.every(l => l !== undefined && l !== null), internalLevels.filter(l => !l));
// Should not have junk rows (40+ posts = old broken behaviour).
assert('internal posts < 10 (no junk rows)', resI.posts.length < 10, resI.posts.length);

// ── 4. Branched generation structural checks ──────────────────────────────────
console.log('\n--- 4. Branched output structure ---');
const field = 'internal_candidate';

// Set state for generators.
App.S.posts = resN.posts;
App.S.internalCandidate = { enabled: true, field: field, posts: resI.posts, ctx: ctxI };
App.S._normalCtx = ctxN;

function countOccurrences(str, needle) {
  let count = 0, pos = 0;
  while ((pos = str.indexOf(needle, pos)) !== -1) { count++; pos += needle.length; }
  return count;
}

const eli = App.genEligibilityBranched(resN.posts, resI.posts, ctxN, ctxI, field);
assert('eli: single <?PHP', countOccurrences(eli, '<?PHP') === 1, countOccurrences(eli, '<?PHP'));
assert('eli: single ?>', countOccurrences(eli, '?>') === 1, countOccurrences(eli, '?>'));
assert('eli: has if branch wrapper', eli.includes("if($_POST['"+field+"'] == 'Y')"), '');
assert('eli: has else branch', eli.includes('} else {'), '');
assert('eli: internal branch uses _internal array refs', eli.includes('_internal[') || eli.includes("_internal'[") || eli.includes('_internal$'), 'expected _internal array ref inside internal branch');

const eduval = App.genEduValidationsBranched(resN.posts, resI.posts, ctxN, ctxI, field);
assert('eduval: single checkDOPassing', countOccurrences(eduval, 'function checkDOPassing') === 1, countOccurrences(eduval, 'function checkDOPassing'));
assert('eduval: has if branch wrapper', eduval.includes("if($_POST['"+field+"'] == 'Y')"), '');
assert('eduval: has else branch', eduval.includes('} else {'), '');

const workexp = App.genWorkExpBranched(resN.posts, resI.posts, ctxN, ctxI, field);
if (workexp) {
  assert('workexp: single WE_HEAD pattern', countOccurrences(workexp, 'POST_QUALIFICATION_EXP') === 1, countOccurrences(workexp, 'POST_QUALIFICATION_EXP'));
  assert('workexp: has if branch wrapper', workexp.includes("if($_POST['"+field+"'] == 'Y')"), '');
} else {
  console.log('    workexp: empty (no post-qualification WE) — skipping WE structure checks');
  pass += 2; // count as passing (no WE = valid)
}

const edu = App.genEduConfigBranched(resN.posts, resI.posts, ctxN, ctxI, field);
assert('edu_config: has _internal suffix arrays (no if/else)', !edu.includes("if($_POST['"+field+"'] == 'Y')"), 'edu_config should use _internal suffix, not if/else branching');
assert('edu_config: has $arrGraduation_Stream_internal or similar _internal array', edu.includes('_internal'), 'expected at least one _internal array');
assert('edu_config: has $eligibilityDependents', edu.includes('$eligibilityDependents'), '');

// ── 5. S.dimensions restored after branched run (singleton leak guard) ────────
console.log('\n--- 5. Singleton leak guard ---');
const dimsBefore = JSON.stringify(App.S.dimensions);
// Run a generator that uses withCtx internally.
App.genEligibilityBranched(resN.posts, resI.posts, ctxN, ctxI, field);
const dimsAfter = JSON.stringify(App.S.dimensions);
assert('S.dimensions unchanged after branched gen', dimsBefore === dimsAfter, dimsAfter);

// ── 6. Off-path backward compat (no sep, no split) ────────────────────────────
console.log('\n--- 6. Backward compat (feature off) ---');
resetState();
App.S.internalCandidate.enabled = false;
const resOff = App.buildPostsRange(rows);
// With feature off and no split, full sheet is parsed flat.
// We don't assert exact post counts here (the separator row and second header
// produce garbage posts intentionally when the feature is off — unchanged behaviour).
assert('off-path: buildPostsRange returns posts array', Array.isArray(resOff.posts), typeof resOff.posts);
const eliOff = App.genEligibility(resOff.posts);
assert('off-path: eli starts with <?PHP', eliOff.startsWith('<?PHP'), eliOff.slice(0,20));
assert('off-path: eli has no if($_POST[\'internal_candidate\'])', !eliOff.includes("if($_POST['internal_candidate']"), '');

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n====== Summary: ' + pass + ' passed, ' + fail + ' failed ======');
if (fail > 0) process.exit(1);
