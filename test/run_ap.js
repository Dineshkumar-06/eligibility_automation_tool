// Appeared / Passed (AP) "highest qualification only" tests. Verifies that when AP is
// enabled per level, the mark/grade relaxation is applied ONLY to the highest academic
// qualification within each eligibility branch (OR-group). A post that requires a ladder
// (e.g. Graduation AND Post Graduation) must keep Graduation a hard/normal check and gate
// only Post Graduation on the A/P field. Specials (Diploma/Certification/… — no ladder
// precedence) keep their own AP setting. Also guards backward compat: AP off ⇒ no gating.
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
  App.S.appearedPassed = { enabled: false, fields: {} };
  const res = App.buildPosts(rows);
  App.S.posts = res.posts;
  return res.posts;
}
// A group whose edu levels include every name in `want`.
function findGroup(posts, want) {
  for (const p of posts) for (const g of p.orGroups) {
    const levels = g.conditions.filter(c => c.type === 'edu').map(c => c.level);
    if (want.every(w => levels.includes(w))) return { post: p, grp: g };
  }
  return null;
}
function cond(grp, level) { return grp.conditions.find(c => c.type === 'edu' && c.level === level); }

// ── Unit: effectiveApField — the highest-only predicate ─────────────────────
console.log('===================== effectiveApField predicate =====================');
{
  const grad = { type: 'edu', level: 'Graduation' };            // acad rank 3
  const pg = { type: 'edu', level: 'Post Graduation' };         // acad rank 4
  const pgd = { type: 'edu', level: 'Post Graduation Diploma' };// acad rank 4 (ties PG)
  const dip = { type: 'edu', level: 'Diploma' };                // special, rank 0
  App.S.appearedPassed = { enabled: true, fields: {
    Graduation: 'grad_ap', 'Post Graduation': 'pg_ap',
    'Post Graduation Diploma': 'pgd_ap', Diploma: 'dip_ap' } };

  ok('Graduation alone → its own field', App.effectiveApField(grad, [grad]) === 'grad_ap');
  ok('Graduation with higher PG present → null (normal check)', App.effectiveApField(grad, [grad, pg]) === null);
  ok('PG is highest in ladder → its own field', App.effectiveApField(pg, [grad, pg]) === 'pg_ap');
  ok('PG-Diploma is highest over Graduation → its own field', App.effectiveApField(pgd, [grad, pgd]) === 'pgd_ap');
  ok('special Diploma unaffected by higher academic → keeps AP', App.effectiveApField(dip, [dip, grad]) === 'dip_ap');
  ok('Graduation over special Diploma → still highest academic', App.effectiveApField(grad, [grad, dip]) === 'grad_ap');

  App.S.appearedPassed = { enabled: false, fields: { Graduation: 'grad_ap' } };
  ok('AP off → null', App.effectiveApField(grad, [grad]) === null);
}

// ── End-to-end: ladder sheet with Graduation + Post Graduation ──────────────
console.log('\n===================== Eligibility Criteria_ap_diff_2d_null.xlsx =====================');
{
  const posts = parse('Eligibility Criteria_ap_diff_2d_null.xlsx');
  App.S.appearedPassed = { enabled: true, fields: { Graduation: 'grad_appeared', 'Post Graduation': 'pg_appeared' } };
  const eli = App.genEligibility(posts);          // annotates cond names + exercises the full path
  const single = posts.length === 1;

  const ladder = findGroup(posts, ['Graduation', 'Post Graduation']);
  ok('found a Graduation+Post Graduation group', !!ladder);
  if (ladder) {
    const gradLine = App.buildCondGroupLine(cond(ladder.grp, 'Graduation'), ladder.post, single, ladder.grp.conditions);
    const pgLine = App.buildCondGroupLine(cond(ladder.grp, 'Post Graduation'), ladder.post, single, ladder.grp.conditions);
    ok('ladder: Graduation is a NORMAL check (no _appeared)', !/_appeared/.test(gradLine), gradLine);
    ok('ladder: Post Graduation is AP-gated', /pg_appeared'\]==\s*'A'/.test(pgLine), pgLine);
    ok('ladder: PG line carries no stray grad_appeared reference', !/grad_appeared/.test(pgLine), pgLine);
  }

  const gradOnly = (function () {
    for (const p of posts) for (const g of p.orGroups) {
      const lv = g.conditions.filter(c => c.type === 'edu').map(c => c.level);
      if (lv.includes('Graduation') && !lv.includes('Post Graduation') && !lv.includes('Post Graduation Diploma'))
        return { post: p, grp: g };
    }
    return null;
  })();
  ok('found a Graduation-only group', !!gradOnly);
  if (gradOnly) {
    const line = App.buildCondGroupLine(cond(gradOnly.grp, 'Graduation'), gradOnly.post, single, gradOnly.grp.conditions);
    ok('grad-only: Graduation IS AP-gated', /grad_appeared'\]==\s*'A'/.test(line), line);
    // Regression: the sheet's grade column ('Any Class') must still require a grade
    // to have been selected inside the Passed branch — AP must not silently drop it.
    ok('grad-only: mark AND grade both present in the Passed branch', /selmark3'\].*&&.*selgrade3'\]\s*!=/.test(line), line);
  }

  ok('generated eligibility gates PG somewhere', /pg_appeared/.test(eli));

  // Backward compat: AP off ⇒ no _appeared anywhere.
  App.S.appearedPassed = { enabled: false, fields: {} };
  ok('AP off ⇒ generated output has no _appeared', !/_appeared/.test(App.genEligibility(posts)));
}

// ── End-to-end: revised sheet with Grad+PG and Grad+PG-Diploma OR-branches ──
console.log('\n===================== Revised_Eligibility Criteria_red_ap_diff.xlsx =====================');
{
  const posts = parse('Revised_Eligibility Criteria_red_ap_diff.xlsx');
  App.S.appearedPassed = { enabled: true, fields: {
    Graduation: 'grad_appeared', 'Post Graduation': 'pg_appeared', 'Post Graduation Diploma': 'pgd_appeared' } };
  App.genEligibility(posts);
  const single = posts.length === 1;

  const g1 = findGroup(posts, ['Graduation', 'Post Graduation']);
  ok('found Grad+PG branch', !!g1);
  if (g1) {
    const gradLine = App.buildCondGroupLine(cond(g1.grp, 'Graduation'), g1.post, single, g1.grp.conditions);
    const pgLine = App.buildCondGroupLine(cond(g1.grp, 'Post Graduation'), g1.post, single, g1.grp.conditions);
    ok('Grad+PG: Graduation normal', !/_appeared/.test(gradLine), gradLine);
    ok('Grad+PG: PG AP-gated', /pg_appeared'\]==\s*'A'/.test(pgLine), pgLine);
  }

  const g2 = findGroup(posts, ['Graduation', 'Post Graduation Diploma']);
  ok('found Grad+PG-Diploma branch', !!g2);
  if (g2) {
    const gradLine = App.buildCondGroupLine(cond(g2.grp, 'Graduation'), g2.post, single, g2.grp.conditions);
    const pgdLine = App.buildCondGroupLine(cond(g2.grp, 'Post Graduation Diploma'), g2.post, single, g2.grp.conditions);
    ok('Grad+PGD: Graduation normal', !/_appeared/.test(gradLine), gradLine);
    ok('Grad+PGD: PG-Diploma AP-gated', /pgd_appeared'\]==\s*'A'/.test(pgdLine), pgdLine);
  }
}

console.log('\nAPPEARED/PASSED HIGHEST-ONLY: ' + (fail === 0 ? 'ALL PASS' : fail + ' FAILED') + ' (' + pass + ' passed)');
process.exit(fail === 0 ? 0 : 1);
