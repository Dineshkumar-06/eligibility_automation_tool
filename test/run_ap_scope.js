// Scoped Appeared / Passed tests. A sheet may carry a free-text note ("Appearing
// candidates are eligible to apply", "Diploma appearing candidates are eligible…") in
// an often header-less column after Work Experience. The parser tags the targeted edu
// conditions (cond.apNote / cond.apSel); with S.appearedPassed.scoped on, ONLY those
// conditions are AP-gated — not every condition of the same level across the sheet.
//   • not merged note  → the OR-branch on that row only
//   • merged note      → every branch overlapping the merged range (whole post)
//   • note names level → that level within the targeted branch(es)
// Scoped off ⇒ apSel is ignored ⇒ original global behaviour.
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
function eduConds(posts) {
  const out = [];
  posts.forEach((p, pi) => p.orGroups.forEach((g, gi) => g.conditions.forEach(c => {
    if (c.type === 'edu') out.push({ p, pi, g, gi, c });
  })));
  return out;
}

const HDR = ['Sr.No', 'Post Name', 'Exam Passed', 'Degree/Subject / Stream', '% age / Marks', 'Class Grade', 'Post Qualification Work Experience', ''];
function row(a) { const r = new Array(8).fill(''); a.forEach((v, i) => { r[i] = v; }); return r; }

// ── Synthetic: single-row (unmerged) note on the PG row of one branch ───────
console.log('===================== unmerged note → that branch only =====================');
{
  const rows = [HDR,
    row(['1', 'Officer', 'Graduation', 'Commerce', '> 0%', 'Any Class', '2 Years']),
    row(['', '', 'AND']),
    row(['', '', 'Post Graduation', 'MBA', '> 0%', 'Any Class']),
    row(['', '', 'OR']),
    row(['', '', 'Graduation', 'Arts', '> 0%', 'Any Class']),
    row(['', '', 'AND']),
    row(['', '', 'Post Graduation', 'MBA', '> 0%', 'Any Class', '', 'Appearing candidates are eligible to apply']),
    row(['2', 'Manager', 'Graduation', 'Arts', '> 0%', 'Any Class', '2 Years']),
    row(['', '', 'AND']),
    row(['', '', 'Post Graduation', 'MBA', '> 0%', 'Any Class']),
  ];
  reset();
  const posts = App.buildPosts(rows).posts;
  const noted = eduConds(posts).filter(x => x.c.apNote);
  ok('exactly one condition tagged', noted.length === 1, noted.length);
  ok('tagged = post 1, branch 2, Post Graduation', noted[0] && noted[0].pi === 0 && noted[0].gi === 1 && noted[0].c.level === 'Post Graduation');
  ok('Graduation in same branch NOT tagged', !posts[0].orGroups[1].conditions.find(c => c.level === 'Graduation').apSel);

  App.S.posts = posts;
  App.S.appearedPassed = { enabled: true, fields: { 'Post Graduation': 'pg_appeared' }, scoped: true };
  const eff = eduConds(posts).filter(x => App.effectiveApField(x.c, x.g.conditions));
  ok('scoped: only the noted PG is AP-active', eff.length === 1 && eff[0].c === noted[0].c, eff.length);
  const eli = App.genEligibility(posts);
  ok('scoped: eligibility references pg_appeared', /pg_appeared/.test(eli));

  App.S.appearedPassed.scoped = false;
  const effG = eduConds(posts).filter(x => App.effectiveApField(x.c, x.g.conditions));
  ok('global (scoped off): every PG is AP-active (3)', effG.length === 3, effG.length);
}

// ── Synthetic: merged note spanning the whole post ──────────────────────────
console.log('\n===================== merged note → whole post =====================');
{
  const rows = [HDR,
    row(['1', 'Officer', 'Graduation', 'Commerce', '> 0%', 'Any Class', '2 Years', 'Appearing candidates are eligible to apply']),
    row(['', '', 'AND']),
    row(['', '', 'Post Graduation', 'MBA', '> 0%', 'Any Class']),
    row(['', '', 'OR']),
    row(['', '', 'Graduation', 'Arts', '> 0%', 'Any Class']),
    row(['2', 'Manager', 'Graduation', 'Arts', '> 0%', 'Any Class', '2 Years']),
  ];
  reset([{ s: { r: 1, c: 7 }, e: { r: 5, c: 7 } }]);
  const posts = App.buildPosts(rows).posts;
  const noted = eduConds(posts).filter(x => x.c.apNote);
  ok('branch 1 → PG (highest) tagged, Graduation not', noted.some(x => x.gi === 0 && x.c.level === 'Post Graduation') && !noted.some(x => x.gi === 0 && x.c.level === 'Graduation'));
  ok('branch 2 → Graduation tagged', noted.some(x => x.gi === 1 && x.c.level === 'Graduation'));
  ok('post 2 untouched', !noted.some(x => x.pi === 1));

  // Same note NOT merged on a non-edu-specific first row → first branch only.
  reset();
  const posts2 = App.buildPosts(rows).posts;
  const noted2 = eduConds(posts2).filter(x => x.c.apNote);
  ok('unmerged on first row → only branch 1 (its Graduation row)', noted2.length === 1 && noted2[0].gi === 0 && noted2[0].c.level === 'Graduation', JSON.stringify(noted2.map(x => [x.gi, x.c.level])));
}

// ── Synthetic: note names a level ───────────────────────────────────────────
console.log('\n===================== note names the level =====================');
{
  const rows = [HDR,
    row(['1', 'Engineer', 'Graduation', 'Engineering', '> 0%', 'Any Class', '2 Years', 'Diploma appearing candidates are eligible.\nFor Appear candidates, Month & Year of passing should be disabled']),
    row(['', '', 'AND']),
    row(['', '', 'Diploma', 'Mechanical', '> 0%', 'Any Class']),
    row(['', '', 'OR']),
    row(['', '', 'Graduation', 'Engineering', '> 0%', 'Any Class']),
  ];
  reset([{ s: { r: 1, c: 7 }, e: { r: 5, c: 7 } }]);
  const posts = App.buildPosts(rows).posts;
  const noted = eduConds(posts).filter(x => x.c.apNote);
  ok('Diploma in branch 1 tagged', noted.some(x => x.gi === 0 && x.c.level === 'Diploma'));
  ok('Graduation in branch 1 not tagged (note names Diploma)', !noted.some(x => x.gi === 0 && x.c.level === 'Graduation'));
  ok('branch 2 (no Diploma) falls back to its highest → Graduation', noted.some(x => x.gi === 1 && x.c.level === 'Graduation'));
}

// ── "Post-Graduation …" must not also name Graduation ──────────────────────
console.log('\n===================== longer level name wins =====================');
{
  const mk = note => [HDR,
    row(['1', 'Officer', 'Graduation', 'Arts', '> 0%', 'Any Class', '-', note]),
    row(['', '', 'AND']),
    row(['', '', 'Post Graduation', 'MBA', '> 0%', 'Any Class']),
    row(['', '', 'AND']),
    row(['', '', 'Post Graduation Diploma', 'PGDM', '> 0%', 'Any Class']),
  ];
  const tagged = note => {
    reset([{ s: { r: 1, c: 7 }, e: { r: 5, c: 7 } }]);
    return eduConds(App.buildPosts(mk(note)).posts).filter(x => x.c.apNote).map(x => x.c.level).sort().join(',');
  };
  ok('"Post-Graduation appearing" → PG only', tagged('Post-Graduation appearing candidates are eligible.') === 'Post Graduation', tagged('Post-Graduation appearing candidates are eligible.'));
  ok('"Post-Graduation Diploma appearing" → PGD only', tagged('Post-Graduation Diploma appearing candidates are eligible.') === 'Post Graduation Diploma');
  ok('"Post Graduation Degree appearing" → PG only', tagged('Post Graduation Degree appearing candidates are eligible.') === 'Post Graduation');
  ok('"Graduation appearing" → Graduation only', tagged('Graduation appearing candidates are eligible.') === 'Graduation');
}

// ── Unrelated text in the note column is ignored ────────────────────────────
console.log('\n===================== non-AP remark ignored =====================');
{
  const rows = [HDR,
    row(['1', 'Officer', 'Graduation', 'Commerce', '> 0%', 'Any Class', '2 Years', 'Age relaxation as per rules']),
  ];
  reset();
  const posts = App.buildPosts(rows).posts;
  ok('no condition tagged', eduConds(posts).every(x => !x.c.apNote));
}

// ── Fixture: Revised_11_SIDBI_Eligibility.xlsx ──────────────────────────────
console.log('\n===================== SIDBI fixture =====================');
const fx = path.join(__dirname, '..', 'resources', 'Revised_11_SIDBI_Eligibility.xlsx');
if (!fs.existsSync(fx)) {
  console.log('SKIP (resource not found): ' + fx);
} else {
  const wb = XLSX.readFile(fx);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
  reset(ws['!merges']);
  const posts = App.buildPosts(rows).posts;
  App.S.posts = posts;
  const noted = eduConds(posts).filter(x => x.c.apNote);
  ok('exactly one tagged condition', noted.length === 1, noted.length);
  ok('it is post 1 PG (MBA/PGDM), last branch', noted[0] && noted[0].pi === 0 && noted[0].c.level === 'Post Graduation' && noted[0].gi === posts[0].orGroups.length - 1);

  App.S.appearedPassed = { enabled: true, fields: { 'Post Graduation': 'pg_appeared' }, scoped: true };
  const allPg = eduConds(posts).filter(x => x.c.level === 'Post Graduation');
  const active = allPg.filter(x => App.effectiveApField(x.c, x.g.conditions));
  ok('several PG conditions exist in the sheet', allPg.length > 1, allPg.length);
  ok('scoped: only 1 PG is AP-gated', active.length === 1, active.length);
  const brandingPg = allPg.find(x => /Branding/.test(x.p.postName));
  ok('Branding & Communications PG stays a normal check',
    brandingPg && !/_appeared/.test(App.buildCondGroupLine(brandingPg.c, brandingPg.p, false, brandingPg.g.conditions)));
  const eli = App.genEligibility(posts);
  ok('eligibility output generated with pg_appeared', /pg_appeared/.test(eli));
  // checkDOPassing (edu_validations) emits the SAME conditions as eligibility.
  const eduval = App.genEduValidations(posts);
  const apLines = t => (t.match(/.*_appeared.*/g) || []).map(l => l.trim().replace(/\s*(&&|\|\|)$/, ''));
  const ev = apLines(eduval), eliSet = new Set(apLines(eli));
  ok('checkDOPassing has the Appeared-OR-Passed PG gate', /pg_appeared'\]==\s*'A'/.test(eduval) && /pg_appeared'\]==\s*'P'/.test(eduval));
  ok('checkDOPassing AP lines identical to eligibility lines', ev.length > 0 && ev.every(l => eliSet.has(l)), ev.join(' | '));
}

// ── Fixture: elig_ap_diff.xlsx — one note merged across posts 1–7 ───────────
console.log('\n===================== elig_ap_diff fixture =====================');
const fx2 = path.join(__dirname, '..', 'resources', 'elig_ap_diff.xlsx');
if (!fs.existsSync(fx2)) {
  console.log('SKIP (resource not found): ' + fx2);
} else {
  const wb = XLSX.readFile(fx2);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
  reset(ws['!merges']);
  const posts = App.buildPosts(rows).posts;
  const all = eduConds(posts);
  const tag = x => !!x.c.apNote;
  ok('posts 1–7: Graduation tagged in every post (merged note)', [0, 1, 2, 3, 4, 5, 6].every(pi => all.some(x => x.pi === pi && x.c.level === 'Graduation' && tag(x))));
  const p8 = all.filter(x => x.pi === 7);
  ok('post 8 branch 1: PG tagged', p8.some(x => x.gi === 0 && x.c.level === 'Post Graduation' && tag(x)));
  ok('post 8 branch 2: PG Diploma tagged', p8.some(x => x.c.level === 'Post Graduation Diploma' && tag(x)));
  ok('post 8: Graduation NOT tagged in either branch', p8.filter(x => x.c.level === 'Graduation').every(x => !tag(x)));
}

console.log('\nAPPEARED/PASSED SCOPE: ' + (fail === 0 ? 'ALL PASS' : fail + ' FAILED') + ' (' + pass + ' passed)');
process.exit(fail === 0 ? 0 : 1);
