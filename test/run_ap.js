// Appeared / Passed (AP) "highest qualification only" tests. Verifies that when AP is
// enabled per level, the mark/grade relaxation is applied ONLY to the highest academic
// qualification within each eligibility branch (OR-group). A post that requires a ladder
// (e.g. Graduation AND Post Graduation) must keep Graduation a hard/normal check and gate
// only Post Graduation on the A/P field. Specials (Diploma/Certification/… — no ladder
// precedence) keep their own AP setting. Also guards backward compat: AP off ⇒ no gating.
const App = require('./harness');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  -> ' + detail : '')); }
}

function parse(file) {
  const p = path.join(__dirname, '..', 'resources', file);
  if (!fs.existsSync(p)) {          // resources/ is gitignored — skip the fixture-backed blocks
    console.log('\nSKIP (resource not found): ' + file);
    console.log('\nAPPEARED/PASSED HIGHEST-ONLY: ' + (fail === 0 ? 'ALL PASS' : fail + ' FAILED') + ' (' + pass + ' passed, remaining fixture tests skipped)');
    process.exit(fail === 0 ? 0 : 1);
  }
  const wb = XLSX.readFile(p);
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

// ── Unit: apRank — user-arranged hierarchy overrides the default ranks ───────
// The hierarchy is no longer hardcoded: S.appearedPassed.hierarchy (lowest → highest)
// and .generic (no precedence) are what the Step-2 drag & drop writes. Both unset ⇒
// the default POSTQUAL_TS ranks, so every pre-existing expectation is untouched.
console.log('\n===================== apRank hierarchy configuration =====================');
{
  App.S.appearedPassed = { enabled: true, fields: {}, hierarchy: null, generic: null };
  let allDefault = true, detail = '';
  for (const lvl of Object.keys(App.EDU)) {
    if (App.apRank(lvl) !== App.defaultAcadRank(lvl)) { allDefault = false; detail = lvl; }
  }
  ok('no config ⇒ apRank == defaultAcadRank for every EDU level', allDefault, detail);
  ok('default: Graduation(3) < Post Graduation(4)', App.apRank('Graduation') === 3 && App.apRank('Post Graduation') === 4);
  ok('default: Diploma is generic (rank 0)', App.apRank('Diploma') === 0);
  ok('unknown level ⇒ rank 0', App.apRank('No Such Level') === 0);

  // Custom ladder that promotes Diploma above HSC — position in the list is the rank.
  const hsc = { type: 'edu', level: 'HSC/12th' };
  const dip = { type: 'edu', level: 'Diploma' };
  const grad = { type: 'edu', level: 'Graduation' };
  App.S.appearedPassed = {
    enabled: true,
    fields: { 'HSC/12th': 'hsc_ap', Diploma: 'dip_ap', Graduation: 'grad_ap' },
    hierarchy: ['SSC/10th', 'HSC/12th', 'Diploma', 'Graduation'],
    generic: ['Certification']
  };
  ok('custom: rank == position in the list', App.apRank('SSC/10th') === 1 && App.apRank('HSC/12th') === 2
    && App.apRank('Diploma') === 3 && App.apRank('Graduation') === 4);
  ok('custom: Diploma now outranks HSC ⇒ HSC is a normal check', App.effectiveApField(hsc, [hsc, dip]) === null);
  ok('custom: Diploma is the highest of the pair ⇒ keeps its AP field', App.effectiveApField(dip, [hsc, dip]) === 'dip_ap');
  ok('custom: Graduation still tops the ladder', App.effectiveApField(grad, [hsc, dip, grad]) === 'grad_ap');
  ok('custom: level in generic list ⇒ rank 0', App.apRank('Certification') === 0);
  // Under the highest-only rule the lower levels are no longer AP-active, so there is
  // nothing to waive — same invariant as the default ladder, now on the custom order.
  ok('custom: lowerAppearedFields(Graduation) is empty (lower levels are hard checks)',
    App.lowerAppearedFields([hsc, dip, grad], grad).length === 0,
    JSON.stringify(App.lowerAppearedFields([hsc, dip, grad], grad)));

  // A level moved into the generic group has no precedence either way.
  App.S.appearedPassed = {
    enabled: true, fields: { Graduation: 'grad_ap', 'Post Graduation': 'pg_ap' },
    hierarchy: ['Graduation'], generic: ['Post Graduation']
  };
  const pg = { type: 'edu', level: 'Post Graduation' };
  ok('generic PG: keeps its own AP field under a hierarchical Graduation',
    App.effectiveApField(pg, [grad, pg]) === 'pg_ap');
  ok('generic PG: no longer suppresses Graduation', App.effectiveApField(grad, [grad, pg]) === 'grad_ap');
  ok('generic PG: never a suppressor', App.lowerAppearedFields([grad, pg], grad).length === 0);

  // A level in NEITHER list falls back to its default rank (defensive — the UI keeps
  // every detected level in one of the two groups).
  App.S.appearedPassed = { enabled: true, fields: {}, hierarchy: ['Graduation'], generic: [] };
  ok('level in neither list ⇒ default rank', App.apRank('Post Graduation') === App.defaultAcadRank('Post Graduation'));

  App.S.appearedPassed = { enabled: false, fields: {}, hierarchy: null, generic: null };
}

// ── End-to-end: configured hierarchy flips which level is AP-gated ───────────
// Built from in-memory rows so it runs without the (gitignored) resources/ fixtures.
console.log('\n===================== configured hierarchy end-to-end =====================');
{
  const rows = [
    ['POST', 'Exam Passed', 'Degree /Subject / Stream', 'Percentage', 'Class', 'Post Qualification Experience'],
    ['Officer', 'Graduation Degree', 'Engineering', '>=60%', 'Any Class', '-'],
    ['', 'Post Graduation Degree', 'Engineering', '>=55%', 'Any Class', '-'],
  ];
  App.S.posts = []; App.S.errors = []; App.S.warnings = []; App.S.radioOv = {}; App.S.dimensions = [];
  App.S.appearedPassed = { enabled: false, fields: {}, hierarchy: null, generic: null };
  const posts = App.buildPosts(rows).posts;
  App.S.posts = posts;
  const single = posts.length === 1;
  const fields = { Graduation: 'grad_appeared', 'Post Graduation': 'pg_appeared' };
  const ladder = findGroup(posts, ['Graduation', 'Post Graduation']);
  ok('found a Graduation+Post Graduation group', !!ladder);
  if (ladder) {
    // Reversed ladder: Post Graduation below Graduation ⇒ Graduation becomes the top.
    App.S.appearedPassed = { enabled: true, fields,
      hierarchy: ['Post Graduation', 'Graduation'], generic: [] };
    App.genEligibility(posts);
    let gradLine = App.buildCondGroupLine(cond(ladder.grp, 'Graduation'), ladder.post, single, ladder.grp.conditions);
    let pgLine = App.buildCondGroupLine(cond(ladder.grp, 'Post Graduation'), ladder.post, single, ladder.grp.conditions);
    ok('reversed: Graduation is now the AP-gated top', /grad_appeared'\]==\s*'A'/.test(gradLine), gradLine);
    ok('reversed: Post Graduation is now a NORMAL check', !/_appeared/.test(pgLine), pgLine);
    ok('reversed: Graduation line carries no stray pg_appeared reference', !/pg_appeared/.test(gradLine), gradLine);

    // Reset to default ⇒ byte-identical to the unconfigured expectation.
    App.S.appearedPassed = { enabled: true, fields, hierarchy: null, generic: null };
    App.genEligibility(posts);
    gradLine = App.buildCondGroupLine(cond(ladder.grp, 'Graduation'), ladder.post, single, ladder.grp.conditions);
    pgLine = App.buildCondGroupLine(cond(ladder.grp, 'Post Graduation'), ladder.post, single, ladder.grp.conditions);
    ok('reset: Graduation back to a NORMAL check', !/_appeared/.test(gradLine), gradLine);
    ok('reset: Post Graduation back to AP-gated', /pg_appeared'\]==\s*'A'/.test(pgLine), pgLine);
  }
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

// ── checkDOPassing: gates on Passed only, never Appeared-OR-Passed ──────────
// checkDOPassing picks a branch's date cutoff, not eligibility acceptance — an
// Appeared-only candidate (result pending) must NOT match here, so it must fall
// through to the today's-date default instead of getting this branch's cutoff.
console.log('\n===================== checkDOPassing Passed-only gate =====================');
{
  const posts = parse('Eligibility Criteria_ap_diff_2d_null.xlsx');
  App.S.appearedPassed = { enabled: true, fields: { Graduation: 'grad_appeared', 'Post Graduation': 'pg_appeared' } };
  App.genEligibility(posts); // annotates cond names before eduval generation

  const eduval = App.genEduValidations(posts);
  ok('checkDOPassing: PG gated on Passed (contains pg_appeared==\'P\')', /pg_appeared'\]==\s*'P'/.test(eduval));
  ok('checkDOPassing: no Appeared alternative anywhere (no _appeared==\'A\')', !/_appeared'\]==\s*'A'/.test(eduval), eduval.match(/.*_appeared'\]==\s*'A'.*/)?.[0]);

  // The real eligibility validation must still accept Appeared candidates —
  // only checkDOPassing's date-cutoff gate changes.
  const eli = App.genEligibility(posts);
  ok('genEligibility unaffected: still gates PG on Appeared-OR-Passed', /pg_appeared'\]==\s*'A'/.test(eli) && /pg_appeared'\]==\s*'P'/.test(eli));

  // Backward compat: AP off ⇒ checkDOPassing still has no _appeared at all.
  App.S.appearedPassed = { enabled: false, fields: {} };
  ok('AP off ⇒ checkDOPassing has no _appeared', !/_appeared/.test(App.genEduValidations(posts)));
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
