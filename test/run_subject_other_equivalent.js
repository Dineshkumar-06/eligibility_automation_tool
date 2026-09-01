// Global subject/degree key registry (streams.js getGlobalKey): the '01'/'99'
// sentinel keys are reserved for a subject cell whose ENTIRE value is the
// standalone catch-all word "Others" / "Equivalent" (a real, common sheet
// convention — see the many "... / Others" trailing tokens in production
// sheets). The check must be an exact match, not a substring test: a legitimate,
// longer certification/subject name that merely CONTAINS the word "equivalent"
// or "other" (e.g. a quoted compound like "X / Equivalent Y certification") must
// keep its own key. A substring match collapses every such value onto the same
// sentinel key, and since each OR-group's subject map is built by `sm[k]=value`,
// only the LAST colliding value survives — every earlier one is silently dropped
// from edu_config.php even though it is correct in the parse tree.
const App = require('./harness');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  -> ' + detail : '')); }
}

function reset(){ App.S.posts=[]; App.S.errors=[]; App.S.warnings=[]; App.S.radioOv={}; App.S.dimensions=[]; }

console.log('===================== Compound values containing "equivalent"/"other" keep distinct keys =====================');
{
  const rows = [
    ['POST', 'Exam Passed', 'Degree /Subject / Stream', 'Percentage', 'Post Qualification Experience'],
    ['Full-Stack Engineer',
     'Certification',
     ' "Oracle Certified Professional (OCP) Java SE Programmer-21 & above/ Equivalent React js certification" / "Meta Front-End Developer Professional Certificate/Equivalent Node js certification" / MERN Stack / Other Scripting Languages',
     '-', '-'],
  ];
  reset();
  const posts = App.buildPosts(rows).posts;
  App.S.posts = posts;

  ok('one post parsed', posts.length === 1, posts.length);
  const cond = posts[0]?.orGroups[0].conditions.find(c => c.type === 'edu' && c.level === 'Certification');
  ok('parse tree keeps all 4 distinct subjects', cond && cond.subjects.length === 4, cond && JSON.stringify(cond.subjects));

  const sd = App.getStreamData(posts, App.STREAM_AXIS);
  App.annotateCondNames(posts, sd, App.STREAM_AXIS);
  const eduCfg = App.genEduConfig(posts);

  ok('generated array keeps the Oracle/React compound value',
    eduCfg.includes("Oracle Certified Professional (OCP) Java SE Programmer-21 & above/ Equivalent React js certification"), eduCfg);
  ok('generated array keeps the Meta/Node compound value',
    eduCfg.includes("Meta Front-End Developer Professional Certificate/Equivalent Node js certification"));
  ok('generated array keeps MERN Stack',
    /'MERN Stack'/.test(eduCfg));
  ok('a standalone "Other..." value (not the exact word) keeps its own key, not sentinel 01',
    /'Other Scripting Languages'/.test(eduCfg));
  ok('no PHP array key holds two of these values (no silent overwrite)',
    (eduCfg.match(/Equivalent React js certification/g) || []).length === 1
    && (eduCfg.match(/Equivalent Node js certification/g) || []).length === 1);
}

console.log('\n===================== Standalone "Others"/"Equivalent" still map to sentinel keys (regression) =====================');
{
  const rows = [
    ['POST', 'Exam Passed', 'Degree /Subject / Stream', 'Percentage', 'Post Qualification Experience'],
    ['Officer', 'Graduation Degree', 'Engineering / Arts / Others', '>0%', '-'],
  ];
  reset();
  const posts = App.buildPosts(rows).posts;
  App.S.posts = posts;
  const sd = App.getStreamData(posts, App.STREAM_AXIS);
  App.annotateCondNames(posts, sd, App.STREAM_AXIS);
  const eduCfg = App.genEduConfig(posts);
  ok('standalone "Others" still emits under key 01', /'01' => 'Others'/.test(eduCfg), eduCfg.match(/.*Others.*/)?.[0]);
}

console.log('\nSUBJECT OTHER/EQUIVALENT KEYING: ' + (fail === 0 ? 'ALL PASS' : fail + ' FAILED') + ' (' + pass + ' passed)');
process.exit(fail === 0 ? 0 : 1);
