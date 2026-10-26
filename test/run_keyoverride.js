// "Use own keys" (parsing/keyOverrides.js): pasted config.php arrays supply the post /
// dimension / subject keys. Toggle off must leave output untouched.
const App = require('./harness');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  -> ' + detail : '')); }
}
const S = App.S;
function reset() { S.posts=[]; S.errors=[]; S.warnings=[]; S.radioOv={}; S.dimensions=[];
  S.keyOverrides={enabled:false, dimCount:0, dimText:[], streamText:'', streamMap:{}, unmatchedDims:[]}; }

const rows = [
  ['POST', 'Exam Passed', 'Degree /Subject / Stream', 'Percentage', 'Post Qualification Experience'],
  ['Junior Engineer', 'Graduation', 'Civil / Mechanical', '-', '-'],
  ['Manager',         'Graduation', 'Mechanical / Others', '-', '-'],
  ['Clerk',           'Graduation', 'Arts', '-', '-'],
];
function parse() { reset(); return App.buildPosts(rows).posts; }

console.log('===================== parser =====================');
{
  const p = App.KO.parsePhpArrays(`
    // comment
    $arrPosts = array('05' => 'Manager', "03"=>'Junior \\'Eng\\'', /* x */ '09' => 'Clerk',);
    $arrG['01'] = $arrG['02'] = array('02' => 'Civil', '03' => array('nested'=>'x'), '01' => 'Others');
    $arrShort = ['a' => 'A', 'B'];
  `);
  ok('plain array', p.arrPosts['05'] === 'Manager' && p.arrPosts['09'] === 'Clerk', JSON.stringify(p.arrPosts));
  ok('escaped quote', p.arrPosts['03'] === "Junior 'Eng'", p.arrPosts['03']);
  ok('chained LHS name + nested skipped', p.arrG['02'] === 'Civil' && p.arrG['01'] === 'Others' && !('03' in p.arrG), JSON.stringify(p.arrG));
  ok('short syntax + auto index', p.arrShort.a === 'A' && p.arrShort['0'] === 'B', JSON.stringify(p.arrShort));
}

console.log('===================== toggle off = unchanged =====================');
{
  const base = parse();
  ok('sequential post keys', base.map(x => x.postcode).join() === '01,02,03', base.map(x => x.postcode).join());
  S.keyOverrides.dimText=["$a=array('05'=>'Manager');"];   // text present but toggle off
  const again = App.buildPosts(rows).posts;
  ok('text ignored while disabled', again.map(x => x.postcode).join() === '01,02,03');
}

console.log('===================== posts follow pasted array =====================');
{
  reset();
  S.keyOverrides = {enabled:true, dimCount:1, streamText:'', streamMap:{}, unmatchedDims:[],
    dimText:["$arrPosts = array('05' => 'manager',  '02' => 'Junior   Engineer');"]};
  const posts = App.buildPosts(rows).posts;
  ok('matched keys (case/space ignored)', posts[0].postcode === '02' && posts[1].postcode === '05', posts.map(x => x.postcode).join());
  ok('unmatched gets key above max', posts[2].postcode === '06', posts[2].postcode);
  ok('unmatched recorded', (S.keyOverrides.unmatchedDims[0] || []).join() === 'Clerk', JSON.stringify(S.keyOverrides.unmatchedDims));
}

console.log('===================== smart quotes / dashes =====================');
{
  reset();
  S.keyOverrides = {enabled:true, dimCount:1, streamText:'', streamMap:{}, unmatchedDims:[],
    dimText:['$arrPost=array(\n\'01\'=>"Assistant Manager Grade \'A\'",\n\'02\'=>"Manager Grade \'B\' - Tech",\n);']};
  const r2 = [['POST','Exam Passed','Degree /Subject / Stream','Percentage','Post Qualification Experience'],
    ['Manager Grade ‘B’ – Tech','Graduation','Civil','-','-'],
    ['Assistant Manager Grade ‘A’','Graduation','Civil','-','-']];
  const posts = App.buildPosts(r2).posts;
  ok('curly quotes / en dash / nbsp match', posts[0].postcode === '02' && posts[1].postcode === '01', posts.map(x => x.postcode).join());
  ok('nothing unmatched', !(S.keyOverrides.unmatchedDims[0] || []).length);
}

console.log('===================== subject keys follow pasted array =====================');
{
  reset();
  S.keyOverrides = {enabled:true, dimCount:0, dimText:[], unmatchedDims:[], streamMap:{},
    streamText:"$arrGraduation_Stream['01'] = array('07' => 'Mechanical', '04' => 'civil', '08' => 'Others');"};
  const posts = App.buildPosts(rows).posts; S.posts = posts;
  const sd = App.getStreamData(posts, App.STREAM_AXIS);
  const sm = {}; sd['Graduation'].forEach(s => Object.assign(sm, s.sm));
  ok('Mechanical=07', sm['07'] === 'Mechanical', JSON.stringify(sm));
  ok('Civil=04', sm['04'] === 'Civil', JSON.stringify(sm));
  ok('Others uses pasted key 08', sm['08'] === 'Others' && !sm['01'], JSON.stringify(sm));
  ok('unmatched Arts > max (09)', sm['09'] === 'Arts', JSON.stringify(sm));
  const um = App.KO.streamUnmatched(posts);
  ok('stream unmatched reported', um.length === 1 && um[0].value === 'Arts', JSON.stringify(um));
  ok('edu_config emits pasted keys', /'07' => 'Mechanical'/.test(App.genEduConfig(posts)));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
