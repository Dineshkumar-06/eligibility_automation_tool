// Mixed work-exp requirement across a post's OR-groups: some branches require no
// post-qualification experience (blank/dash WE cell) while others require N years,
// gated on their own "do you have N years experience?" radio. genEligibility must
// wrap the totexp check in `if($_POST['<radio>']=='Y')` for that branch — it must
// NOT be skipped just because the post's FIRST OR-group carries no requirement, and
// it must NOT run unconditionally for the branch that carries none.
// Also guards the pre-existing behaviour: when EVERY branch shares the same WE
// requirement, the check stays unconditional (byte-identical to before this fix).
const App = require('./harness');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  -> ' + detail : '')); }
}

function reset(){ App.S.posts=[]; App.S.errors=[]; App.S.warnings=[]; App.S.radioOv={}; App.S.dimensions=[]; }

console.log('===================== Mixed work-exp requirement across OR-groups =====================');
{
  const rows = [
    ['POST', 'Exam Passed', 'Degree /Subject / Stream', 'Percentage', 'Post Qualification Experience'],
    ['Asst Officer', 'Graduation Degree', 'Engineering', '>0%', '-'],
    ['', 'Do you have valid license? Should be YES', '', '', ''],
    ['', 'OR', '', '', ''],
    ['', 'Graduation Degree', 'Engineering', '>0%', '3 Years'],
    ['', 'Do you have minimum 3 years post qualification experience? Should be YES', '', '', ''],
  ];
  reset();
  const posts = App.buildPosts(rows).posts;
  App.S.posts = posts;

  ok('one post parsed', posts.length === 1, posts.length);
  const post = posts[0];
  if (post) {
    ok('post-level workExp reflects first OR-group (0)', post.workExp === 0, post.workExp);
    ok('first OR-group carries no work-exp requirement', post.orGroups[0].workExp === 0, post.orGroups[0].workExp);
    ok('second OR-group requires 3 years (36 months)', post.orGroups[1].workExp === 36, post.orGroups[1].workExp);

    const eli = App.genEligibility(posts);
    const radioField = post.orGroups[1].conditions.find(c => c.type === 'radio' && /3 years/i.test(c.question)).fieldName;

    ok('totexp check is gated behind the matching experience radio',
      new RegExp("if\\(\\$_POST\\['" + radioField + "'\\] == 'Y'\\) \\{\\s*\\n\\s*if\\(WORK_EXP_ROW_COUNT").test(eli),
      eli.match(/if\(\$_POST\[.*== 'Y'\) \{[\s\S]{0,60}/)?.[0]);
    ok('totexp minimum is 36 (3 years) inside that gate', /totexp'\]>=36/.test(eli));
    ok('no unconditional totexp check leaks outside the gate',
      !/^\s*if\(WORK_EXP_ROW_COUNT/m.test(eli.replace(new RegExp("if\\(\\$_POST\\['" + radioField + "'\\] == 'Y'\\) \\{[\\s\\S]*?\\n\\t\\t\\}\\n"), '')));
  }
}

console.log('\n===================== Uniform work-exp requirement stays unconditional (regression) =====================');
{
  const rows = [
    ['POST', 'Exam Passed', 'Degree /Subject / Stream', 'Percentage', 'Post Qualification Experience'],
    ['Chief Officer', 'Graduation Degree', 'Engineering', '>0%', '9 Years'],
    ['', 'Do you have minimum 9 years post qualification experience? Should be YES', '', '', ''],
    ['', 'OR', '', '', ''],
    ['', 'Graduation Degree', 'Arts', '>0%', '9 Years'],
    ['', 'Do you have minimum 9 years post qualification experience? Should be YES', '', '', ''],
  ];
  reset();
  const posts = App.buildPosts(rows).posts;
  App.S.posts = posts;

  ok('one post parsed', posts.length === 1, posts.length);
  const post = posts[0];
  if (post) {
    ok('both OR-groups require 9 years (108 months)',
      post.orGroups[0].workExp === 108 && post.orGroups[1].workExp === 108);

    const eli = App.genEligibility(posts);
    ok('totexp check is unconditional (no radio-gated if-wrapper)',
      /\tif\(WORK_EXP_ROW_COUNT/.test(eli) && !/== 'Y'\) \{\s*\n\s*if\(WORK_EXP_ROW_COUNT/.test(eli));
    ok('totexp minimum is 108 (9 years)', /totexp'\]>=108/.test(eli));
  }
}

console.log('\nMIXED WORK-EXP: ' + (fail === 0 ? 'ALL PASS' : fail + ' FAILED') + ' (' + pass + ' passed)');
process.exit(fail === 0 ? 0 : 1);
