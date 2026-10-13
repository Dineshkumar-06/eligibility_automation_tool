// "Field not present in SOW": when a level's Mark / Grade / Date is flagged absent
// (S.sowAbsent), no condition, alert or dependent may reference it. Default = unchanged.
const App = require('./harness');
let fails = 0;
function ok(c, m) { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails++; }

function mk() {
  return [{ postcode: '01', dimensions: ['01'], postName: 'P', workExp: 0, workExpRaw: '', postQuali: false, ri: 1,
    orGroups: [{ workExp: 0, conditions: [
      { type: 'edu', level: 'Graduation', subjects: [], anyStream: true, degrees: [], anyDegree: false, markRaw: '>=50%', gradeRaw: 'Any Class', hasMarksCol: true, status: 'ok', condName: '', degreeCondName: '' },
      { type: 'edu', level: 'Certification', subjects: [], anyStream: true, degrees: [], anyDegree: false, markRaw: null, gradeRaw: 'Any Class', hasMarksCol: true, status: 'ok', condName: '', degreeCondName: '' }
    ] }] }];
}
function gen() { const p = mk(); App.S.posts = p; return { eli: App.genEligibility(p), cfg: App.genEduConfig(p), val: App.genEduValidations(p) }; }

App.S.dimensions = [{ columnName: 'POST', postVariable: 'postcode' }];
let d = gen();
ok(/selgrade7/.test(d.eli), 'default: Certification grade check emitted');
ok(/certificationgrade|certgrade/.test(d.cfg), 'default: cert grade dependent emitted');
ok(/field_number == 7/.test(d.val), 'default: cert date branch emitted');

App.S.sowAbsent = { enabled: true, levels: { Certification: { grade: true, mark: true, date: true } } };
d = gen();
ok(!/selgrade7|selmark7/.test(d.eli), 'absent: no selgrade7/selmark7 in eligibility');
ok(/selgrade3/.test(d.eli) && /selmark3/.test(d.eli), 'absent: Graduation untouched');
ok(!/certgrade|certificationgrade|certpercentage/.test(d.cfg), 'absent: no cert grade/percentage dependent');
ok(!/field_number == 7/.test(d.val), 'absent: cert date branch dropped');
ok(/field_number == 3/.test(d.val), 'absent: Graduation date branch kept');

App.S.sowAbsent = { enabled: false, levels: { Certification: { grade: true } } };
d = gen();
ok(/selgrade7/.test(d.eli), 'master off: flags ignored');
console.log(fails ? '\nSOW ABSENT: ' + fails + ' FAILED' : '\nSOW ABSENT: ALL PASS');
process.exit(fails ? 1 : 0);
