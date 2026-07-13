// Clarification feature tests. Verifies detection of likely-duplicate Subject/Stream
// and Degree values caused by case, spacing, punctuation, or parenthesis differences.
// Non-blocking: detection must never mutate posts[] or affect generated output.
const App = require('./harness');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  -> ' + detail : '')); }
}

function reset() { App.S.posts = []; App.S.errors = []; App.S.warnings = []; App.S.radioOv = {}; App.S.dimensions = []; }

// ── 1. normText unit cases — spec examples must normalize equal ─────────────
console.log('\n=== normText: spec pairs normalize equal ===');
[
  ['Arts', 'arts'],
  ['B Tech Metallurgy', 'B Tech (Metallurgy)'],
  ['Computer Science', 'Computer science'],
  ['Mechanical Engineering', 'Mechanical  Engineering'],
  ['B.Sc Chemistry', 'B.Sc. Chemistry'],
].forEach(function (pair) {
  ok('normText("' + pair[0] + '") === normText("' + pair[1] + '")',
    App.normText(pair[0]) === App.normText(pair[1]),
    JSON.stringify(App.normText(pair[0])) + ' vs ' + JSON.stringify(App.normText(pair[1])));
});

// ── 2. Subject/Stream duplicates detected across posts (single combined column) ──
console.log('\n=== detectClarifications: Subject/Stream duplicates ===');
{
  const rows = [
    ['POST', 'Exam Passed', 'Degree /Subject / Stream', 'Percentage', 'Class', 'Post Qualification Experience'],
    ['Officer', 'Graduation Degree', 'Arts', '>0%', 'Any Class', '-'],
    ['Clerk', 'Graduation Degree', 'arts', '>0%', 'Any Class', '-'],
    ['Manager', 'Graduation Degree', 'Computer Science', '>0%', 'Any Class', '-'],
    ['Supervisor', 'Graduation Degree', 'Computer science', '>0%', 'Any Class', '-'],
    ['Auditor', 'Graduation Degree', 'Commerce', '>0%', 'Any Class', '-'],
  ];
  reset();
  const res = App.buildPosts(rows);
  const cl = App.detectClarifications(res.posts, []);
  console.log('  stream groups:', JSON.stringify(cl.stream));
  ok('flags Arts/arts as a stream duplicate group',
    cl.stream.some(function (g) { return g.length === 2 && g.indexOf('Arts') >= 0 && g.indexOf('arts') >= 0; }));
  ok('flags Computer Science/Computer science as a stream duplicate group',
    cl.stream.some(function (g) { return g.indexOf('Computer Science') >= 0 && g.indexOf('Computer science') >= 0; }));
  ok('does not flag Commerce (no duplicate)',
    !cl.stream.some(function (g) { return g.indexOf('Commerce') >= 0; }));
  ok('degree groups empty (no separate Degree column)', cl.degree.length === 0);

  // ── Non-mutation guardrail ──
  ok('posts[] subjects unaffected by detection', res.posts[0].orGroups[0].conditions[0].subjects.join(',') === 'Arts');
}

// ── 3. Degree duplicates detected on the separate Degree axis ───────────────
console.log('\n=== detectClarifications: Degree duplicates (separate Degree column) ===');
{
  const rows = [
    ['POST', 'Exam Passed', 'Degree', 'Subject / Stream', 'Percentage', 'Class', 'Post Qualification Experience'],
    ['Officer', 'Graduation Degree', 'B.Sc Chemistry', 'Pure Science', '>0%', 'Any Class', '-'],
    ['Clerk', 'Graduation Degree', 'B.Sc. Chemistry', 'Pure Science', '>0%', 'Any Class', '-'],
    ['Manager', 'Graduation Degree', 'B Tech Metallurgy', 'Engineering', '>0%', 'Any Class', '-'],
    ['Supervisor', 'Graduation Degree', 'B Tech (Metallurgy)', 'Engineering', '>0%', 'Any Class', '-'],
  ];
  reset();
  const res = App.buildPosts(rows);
  ok('separate Degree column detected', App.S.colMap.degree !== undefined);
  const cl = App.detectClarifications(res.posts, []);
  console.log('  degree groups:', JSON.stringify(cl.degree));
  ok('flags B.Sc Chemistry / B.Sc. Chemistry as a degree duplicate group',
    cl.degree.some(function (g) { return g.indexOf('B.Sc Chemistry') >= 0 && g.indexOf('B.Sc. Chemistry') >= 0; }));
  ok('flags B Tech Metallurgy / B Tech (Metallurgy) as a degree duplicate group',
    cl.degree.some(function (g) { return g.indexOf('B Tech Metallurgy') >= 0 && g.indexOf('B Tech (Metallurgy)') >= 0; }));
}

// ── 4. Clean sheet (all distinct) — no false positives ───────────────────────
console.log('\n=== detectClarifications: clean sheet yields no flags ===');
{
  const rows = [
    ['POST', 'Exam Passed', 'Degree /Subject / Stream', 'Percentage', 'Class', 'Post Qualification Experience'],
    ['Officer', 'Graduation Degree', 'Arts', '>0%', 'Any Class', '-'],
    ['Clerk', 'Graduation Degree', 'Commerce', '>0%', 'Any Class', '-'],
    ['Manager', 'Graduation Degree', 'Science', '>0%', 'Any Class', '-'],
  ];
  reset();
  const res = App.buildPosts(rows);
  const cl = App.detectClarifications(res.posts, []);
  ok('no stream duplicates flagged', cl.stream.length === 0);
  ok('no degree duplicates flagged', cl.degree.length === 0);
}

console.log('\nCLARIFICATION FEATURE: ' + (fail === 0 ? 'ALL PASS' : fail + ' FAILED') + ' (' + pass + ' passed)');
process.exit(fail === 0 ? 0 : 1);
