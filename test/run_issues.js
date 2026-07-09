// Verification for the three issue fixes:
//   1. Serial-number columns are never a dimension.
//   2. Single dimension always keys on 'postcode'.
//   3. "Should be No" radios emit N everywhere.
const App = require('./harness');

function reset(){ App.S.posts=[]; App.S.errors=[]; App.S.warnings=[]; App.S.radioOv=[]; App.S.radioOv={}; App.S.dimensions=[]; App.S.bilingual=false; }
let fails=0;
function ok(cond,msg){ console.log((cond?'  PASS ':'  FAIL ')+msg); if(!cond)fails++; }

// ── Issue 1: leading "Sr. No" numeric column must NOT become a dimension ──────
console.log('\n=== Issue 1: Sr.No column excluded from dimensions ===');
{
  const rows=[
    ['Sr. No','POST','Exam Passed','Degree /Subject / Stream','Percentage','Class','Post Qualification Experience'],
    ['1','Manager','Graduation Degree','Engineering','>0%','Any Class','-'],
    ['2','Clerk','Graduation Degree','Commerce','>0%','Any Class','-'],
  ];
  reset();
  const res=App.buildPosts(rows);
  console.log('  colMap:',JSON.stringify(App.S.colMap.dims));
  console.log('  dimensions:',JSON.stringify(App.S.dimensions));
  ok(App.S.dimensions.length===1,'exactly ONE dimension (not multi)');
  ok(App.S.dimensions[0].postVariable==='postcode',"dimension keys on 'postcode'");
  ok(res.posts.length===2,'two posts parsed ('+res.posts.length+')');
  ok(res.posts[0].postName==='Manager','first post name = Manager ("'+res.posts[0].postName+'")');
}

// ── Issue 1b: an UNLABELLED all-numeric column between post and field ──────────
console.log('\n=== Issue 1b: all-numeric column (no Sr header) excluded ===');
{
  const rows=[
    ['POST','Code','Exam Passed','Degree /Subject / Stream','Percentage','Class','Post Qualification Experience'],
    ['Manager','100','Graduation Degree','Engineering','>0%','Any Class','-'],
    ['Clerk','200','Graduation Degree','Commerce','>0%','Any Class','-'],
  ];
  reset();
  App.buildPosts(rows);
  console.log('  dimensions:',JSON.stringify(App.S.dimensions));
  ok(App.S.dimensions.length===1,'numeric "Code" column dropped -> ONE dimension');
}

// ── Issue 1c: a genuine 2nd text dimension is KEPT ────────────────────────────
console.log('\n=== Issue 1c: genuine 2nd (text) dimension kept ===');
{
  const rows=[
    ['Sr. No','POST','Method of Recruitement','Exam Passed','Degree /Subject / Stream','Percentage','Class','Post Qualification Experience'],
    ['1','Manager','Promotion','Graduation Degree','Engineering','>0%','Any Class','-'],
    ['2','Manager','Nomination','Graduation Degree','Engineering','>0%','Any Class','-'],
  ];
  reset();
  App.buildPosts(rows);
  console.log('  dimensions:',JSON.stringify(App.S.dimensions));
  ok(App.S.dimensions.length===2,'Sr.No dropped, POST + Method kept -> TWO dimensions');
  ok(App.S.dimensions[0].postVariable==='postcode' && App.S.dimensions[0].columnName==='POST','dim0 = POST/postcode');
}

// ── Issue 2: single dimension whose header is NOT "Post" still -> postcode ─────
console.log('\n=== Issue 2: lone dimension always keys on postcode ===');
{
  const rows=[
    ['Designation','Exam Passed','Degree /Subject / Stream','Percentage','Class','Post Qualification Experience'],
    ['Manager','Graduation Degree','Engineering','>0%','Any Class','-'],
  ];
  reset();
  App.buildPosts(rows);
  console.log('  dimensions:',JSON.stringify(App.S.dimensions));
  ok(App.S.dimensions.length===1 && App.S.dimensions[0].postVariable==='postcode',"header 'Designation' still -> postcode");
  ok(App.isLegacyDims(),'isLegacyDims() true -> byte-identical legacy path');
}

// ── Issue 3: "Should be No" radio emits N in all three places ─────────────────
console.log('\n=== Issue 3: Should be No -> N everywhere ===');
{
  const rows=[
    ['POST','Exam Passed','Degree /Subject / Stream','Percentage','Class','Post Qualification Experience'],
    ['Auditor','Graduation Degree','Commerce','>0%','Any Class','-'],
    ['','Are you a defaulter ? Yes/No Should be No','','','','',''],
  ];
  reset();
  const res=App.buildPosts(rows);
  const radio=res.posts[0].orGroups[0].conditions.find(c=>c.type==='radio');
  console.log('  radio.shouldBe =',radio&&radio.shouldBe);
  ok(radio && radio.shouldBe==='N','condition.shouldBe === "N"');

  const cond=App.buildCondLine(radio,res.posts[0],res.posts.length===1);
  console.log('  buildCondLine:',cond);
  ok(/=='N'\)/.test(cond),"buildCondLine uses =='N'");

  const errLine=App.buildErrLine(radio,res.posts[0],res.posts.length===1);
  console.log('  buildErrLine:',errLine);
  ok(/Should be No/.test(errLine),"buildErrLine says 'Should be No'");

  const edu=App.genEduConfig(res.posts);
  const idx=edu.indexOf('arrPostBasedRadioCond');
  const snippet=edu.slice(idx,idx+300);
  console.log('  arrPostBasedRadioCond snippet:\n   ',snippet.replace(/\n/g,'\n    '));
  ok(/'shouldbe' => 'N'/.test(snippet),"arrPostBasedRadioCond has 'shouldbe' => 'N'");
  ok(/'validate_msg' => 'Should be No'/.test(snippet),"arrPostBasedRadioCond has 'validate_msg' => 'Should be No'");

  const lang=App.genLangFile(res.posts);
  console.log('  lang:',lang.split('\n').filter(l=>l.indexOf('LANG')>=0).join(' | '));
  ok(!/should\s*be\s*no/i.test(lang),'lang label strips "Should be No"');
}

// ── Issue 3b: a normal "Should be Yes" radio still emits Y ────────────────────
console.log('\n=== Issue 3b: Should be Yes unchanged (regression) ===');
{
  const rows=[
    ['POST','Exam Passed','Degree /Subject / Stream','Percentage','Class','Post Qualification Experience'],
    ['Officer','Graduation Degree','Commerce','>0%','Any Class','-'],
    ['','Do you have 3 years experience ? Yes/No Should be Yes','','','','',''],
  ];
  reset();
  const res=App.buildPosts(rows);
  const radio=res.posts[0].orGroups[0].conditions.find(c=>c.type==='radio');
  ok(radio.shouldBe==='Y','shouldBe === "Y"');
  ok(/=='Y'\)/.test(App.buildCondLine(radio,res.posts[0],true)),"buildCondLine uses =='Y'");
}

console.log('\n'+(fails?('ISSUES VERIFICATION: '+fails+' FAIL(S)'):'ISSUES VERIFICATION: ALL PASS'));
process.exit(fails?1:0);
