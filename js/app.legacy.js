/* Eligibility Code Generator — application logic
   Extracted verbatim from the original test.html <script> block.
   Depends on global libraries loaded via CDN in index.html: XLSX, hljs, JSZip. */
(function(){

// ── CONSTANTS ─────────────────────────────────────────────────────────────
var EDU = {
  'SSC/10th':                        {idx:1,  stream:'arrSSC_Stream',        ss:'selstream1', sm:'selmark1', sg:'selgrade1', lang:'edu_lbl_ssc',        hasStream:false},
  'HSC/12th':                        {idx:2,  stream:'arrHSC_Stream',        ss:'selstream2', sm:'selmark2', sg:'selgrade2', lang:'edu_lbl_hsc',        hasStream:true},
  'Graduation':                      {idx:3,  stream:'arrGraduation_Stream', ss:'selstream3', sm:'selmark3', sg:'selgrade3', lang:'edu_lbl_graduation', hasStream:true},
  'Post Graduation':                 {idx:4,  stream:'arrPG_Stream',         ss:'selstream4', sm:'selmark4', sg:'selgrade4', lang:'edu_lbl_pg',         hasStream:true},
  'Professional Qualification':      {idx:5,  stream:'arrProf_Stream',       ss:'selstream5', sm:'selmark5', sg:'selgrade5', lang:'edu_lbl_proff',      hasStream:true},
  'Post Graduation Diploma':         {idx:6,  stream:'arrPgDipolma_Stream',  ss:'selstream6', sm:'selmark6', sg:'selgrade6', lang:'edu_lbl_pg_diploma', hasStream:true},
  'Certification':                   {idx:7,  stream:'arrCert_Stream',       ss:'selstream7', sm:'selmark7', sg:'selgrade7', lang:'edu_lbl_certif',     hasStream:true},
  'Diploma':                         {idx:8,  stream:'arrDiploma_Stream',    ss:'selstream8', sm:'selmark8', sg:'selgrade8', lang:'edu_lbl_diploma',    hasStream:true},
  'Ph.D':                            {idx:9,  stream:'arrPhD_Stream',        ss:'selstream9', sm:'selmark9', sg:'selgrade9', lang:'edu_lbl_phd',        hasStream:true},
  'Integrated Post Graduate Diploma':{idx:10, stream:'arrIDD_Stream', ss:'selstream10',sm:'selmark10',sg:'selgrade10',lang:'edu_lbl_idd',  hasStream:true},
  'Others':                          {idx:11, stream:'arrOthers_Stream',     ss:'selstream11',sm:'selmark11',sg:'selgrade11',lang:'edu_lbl_others',     hasStream:true}
};
var EDU_ALIASES = {
  'ug':'Graduation','pg':'Post Graduation','pg diploma':'Post Graduation Diploma',
  'pgd':'Post Graduation Diploma','graduation degree':'Graduation','ug degree':'Graduation',
  'post graduation degree':'Post Graduation','pg degree':'Post Graduation',
  'post graduate diploma':'Post Graduation Diploma','p.g. diploma':'Post Graduation Diploma',
  'integrated dual degree':'Integrated Post Graduate Diploma',
  'certificate':'Certification','certificate course':'Certification',
  'phd':'Ph.D','ph.d.':'Ph.D','doctorate':'Ph.D',
  'ssc':'SSC/10th','10th':'SSC/10th','10th std':'SSC/10th',
  'hsc':'HSC/12th','12th':'HSC/12th','12th std':'HSC/12th','10+2':'HSC/12th','senior secondary school':'HSC/12th','diploma degree':'Diploma'
};
// keyword-contains rules, most specific first
var EDU_KW = [
  {level:'Integrated Post Graduate Diploma', kw:['integrated post graduate','integrated pg','integrated dual']},
  {level:'Post Graduation Diploma',          kw:['post graduation diploma','post graduate diploma','pg diploma','pgd']},
  {level:'Post Graduation',                  kw:['post graduation','post graduate','p.g.','m.tech','m.e.','m.b.a','mba','m.c.a','mca','m.sc','msc','m.com','mcom','m.a.']},
  {level:'Professional Qualification',       kw:['professional qualification','professional']},
  {level:'Ph.D',                             kw:['ph.d','phd','doctorate','d.phil']},
  {level:'Certification',                    kw:['certification','certificate']},
  {level:'Diploma',                          kw:['diploma']},
  {level:'Graduation',                       kw:['graduation','graduate','b.tech','b.e.','b.sc','bsc','b.com','bcom','b.a.','bca','b.c.a','bachelor','degree']},
  {level:'HSC/12th',                         kw:['hsc','12th','class xii','class 12','higher secondary','intermediate','10+2']},
  {level:'SSC/10th',                         kw:['ssc','10th','class x','class 10','matriculation','secondary school']}
];
var EDU_ORDER = ['SSC/10th','HSC/12th','Diploma','Graduation','Post Graduation',
  'Post Graduation Diploma','Integrated Post Graduate Diploma','Certification',
  'Professional Qualification','Ph.D','Others'];
var MARK_OPS = {
  '>0%':   {php:'> 0',   err:'> 0 %'},
  '>=35%': {php:'>= 35', err:'>= 35 %'},
  '>=40%': {php:'>= 40', err:'>= 40 %'},
  '>=45%': {php:'>= 45', err:'>= 45 %'},
  '>=50%': {php:'>= 50', err:'>= 50 %'},
  '>=55%': {php:'>= 55', err:'>= 55 %'},
  '>=60%': {php:'>= 60', err:'>= 60 %'},
  '>=65%': {php:'>= 65', err:'>= 65 %'},
  '>=70%': {php:'>= 70', err:'>= 70 %'}
};
function lookupMarkOp(mk){
  if(!mk) return null;
  if(MARK_OPS[mk]) return MARK_OPS[mk];
  var m=mk.match(/^(>=|>)?(\d{1,3})%$/);
  if(!m) return null;
  var op=m[1]||'>=';
  var n=m[2];
  return {php: op+' '+n, err: op+' '+n+' %'};
}
var GRADE_OPS = {
  'Any Class':   {php:"!=''",             err:'Any Class'},
  'First Class': {php:"=='First Class'",  err:'First Class'},
  'Second Class':{php:"=='Second Class'", err:'Second Class'},
  'Pass Class':  {php:"=='Pass Class'",   err:'Pass Class'}
};
// Grade hierarchy (higher rank = better). When a grade threshold is required, every
// HIGHER grade must also be accepted — e.g. "Second Class" allows First Class too.
var GRADE_RANK = {'Pass Class':1, 'Second Class':2, 'First Class':3};
// Returns the PHP grade test for a field, expanding a threshold into "this grade OR
// any higher grade". 'Any Class' stays a non-empty check.
function gradeCheck(field, gradeRaw){
  if(!gradeRaw) return null;
  if(gradeRaw==='Any Class') return field+" !=''";
  var r=GRADE_RANK[gradeRaw];
  if(r===undefined){ var go=GRADE_OPS[gradeRaw]; return go?field+' '+go.php:null; }
  var allowed=Object.keys(GRADE_RANK).filter(function(k){return GRADE_RANK[k]>=r;})
                .sort(function(a,b){return GRADE_RANK[a]-GRADE_RANK[b];});  // required grade, then higher
  var eqs=allowed.map(function(k){return field+" =='"+k+"'";});
  return eqs.length>1?'('+eqs.join(' || ')+')':eqs[0];
}

// ── POST-QUALIFICATION TIMESTAMP MAP ──────────────────────────────────────
// Maps EDU.idx -> the strtotime() variable used in work_exp_details_validations.php
// and the academic-hierarchy rank used to pick the "highest academic qualification".
//   acad > 0 : academic qualification, larger rank = higher.
//             SSC(1) < HSC(2) < Graduation(3) < (PG | PG Diploma)(4) < PhD(5)
//   acad = 0 : special qualification (Diploma / Certification / Professional / IDD)
//             — no precedence among themselves, compared against the highest academic.
var POSTQUAL_TS = {
  1: {v:'$ssctimeStr',                acad:1},
  2: {v:'$hsctimeStr',                acad:2},
  3: {v:'$graduationtimeStr',         acad:3},
  4: {v:'$pggraduationtimeStr',       acad:4},
  5: {v:'$proftimeStr',               acad:0},
  6: {v:'$pggraduationdiplomatimeStr',acad:4},
  7: {v:'$certtimeStr',               acad:0},
  8: {v:'$diplomatimeStr',            acad:0},
  9: {v:'$phdtimeStr',                acad:5},
  10:{v:'$iddtimeStr',                acad:0}
};

// ── STATE ─────────────────────────────────────────────────────────────────
var S = {posts:[], errors:[], warnings:[], rawRows:[], colMap:{}, radioOv:{}, _edu:'', _eli:'', _eduval:'', _workexp:''};

// ── UTILS ─────────────────────────────────────────────────────────────────
function ind(n){var s='';for(var i=0;i<n;i++)s+='\t';return s;}
function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escA(s){return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function getOv(pc,q){if(!S.radioOv[pc])S.radioOv[pc]={};if(!S.radioOv[pc][q])S.radioOv[pc][q]={};return S.radioOv[pc][q];}
function rFn(c,pc){return getOv(pc,c.question).fieldName||c.fieldName;}
function rLk(c,pc){return getOv(pc,c.question).langKey||c.langKey;}
function isCat(mk){var s=mk&&String(mk);return !!(s&&(s.indexOf('CAT:')===0||s.indexOf('MCAT:')===0));}

// ── MARK PARSING ──────────────────────────────────────────────────────────
// Detects category-based marks like "For All other >=60%, For SC/ST/OBC/EWS/PwBD >=55%"
// Returns 'CAT:lo:hi:cats' where cats is a '+'-joined list of lower-threshold category tokens
// e.g. 'CAT:55:60:SC+ST+OBC' or 'CAT:55:60:SC+ST+PwBD'
// lo = lower threshold, hi = others (always higher)
function parseCatMark(mk){
  var p=mk.split(':');
  var cats=p[3]?p[3].split('+'):['SC','ST'];  // default to SC+ST for legacy format
  return {scst:+p[1],other:+p[2],pwbd:cats.indexOf('PwBD')>=0,cats:cats};
}

// Build the PHP if-condition string for the lower-threshold category group.
// e.g. "$_POST['category_name'] == 'SC' || $_POST['category_name'] == 'ST' || $_POST['disability'] == 'Y'"
function buildCatCond(cat){
  var parts=[];
  for(var i=0;i<cat.cats.length;i++){
    if(cat.cats[i]==='PwBD') parts.push("$_POST['disability'] == 'Y'");
    else parts.push("$_POST['category_name'] == '"+cat.cats[i]+"'");
  }
  return parts.join(' || ');
}

function normMark(s){
  if(!s||s==='-') return null;

  // Space-separated two-tier format e.g. "UR/EWS/OBC/ST >=60% SC >=55%"
  var spaceClausePairs=[];
  var scRem=s.trim();
  var scClauseRe=/([A-Za-z][A-Za-z0-9\/\s\-]*?)\s*(>=|>)\s*(\d{1,3})\s*%?/g;
  var scm;
  while((scm=scClauseRe.exec(scRem))!==null){
    var label=scm[1].trim();
    if(label) spaceClausePairs.push({label:label,thr:+scm[3]});
  }
  if(spaceClausePairs.length>=2){
    var allLooksLikeCats=spaceClausePairs.every(function(p){
      return /^[A-Za-z][A-Za-z0-9\/\s\-]*$/.test(p.label)&&p.label.length<=30;
    });
    var distinctThr={};
    for(var spi=0;spi<spaceClausePairs.length;spi++) distinctThr[spaceClausePairs[spi].thr]=1;
    if(allLooksLikeCats&&Object.keys(distinctThr).length>=2){
      spaceClausePairs.sort(function(a,b){return a.thr-b.thr;});
      return 'MCAT:'+spaceClausePairs.map(function(p){
        return p.thr+'|'+p.label.split(/\s*[\/,]\s*/).map(function(c){return c.trim();}).filter(Boolean).join(',');
      }).join('~');
    }
  }

  // Strip "For all" / "for all" prefix — means universal mark, not category-split
  var str=s.replace(/^for\s+all\s*/i,'');

  // Extract SC/ST value — category name before number (normal format)
  var scstVal=null, otherVal=null;
  var m1=str.match(/sc\s*[\/,&]\s*st(?:\s*[\/,&]\s*(?:pwbd|pw|obc(?:-ncl)?|ews|disability|disabled|handicap|divyang))*\s*[^\d]*(\d+)/i);
  if(!m1) m1=str.match(/(?:sc|st)\s*[\/,&]\s*(?:st|sc)[^\d]*(\d+)/i);
  // Reversed format: number before category e.g. ">=50% for SC/ST"
  if(!m1) m1=str.match(/(\d+)[^\d\n]*for\s+sc\s*[\/,&]\s*st/i);
  if(m1) scstVal=+m1[1];

  // Extract "all other / general / open / unreserved / UR" value (normal format)
  var m2=str.match(/(?:all\s*other|general|open|unreserved|others?|\bur\b)\s*[^\d]*(\d+)/i);
  // Reversed format: number before category e.g. ">=60% for All other category"
  if(!m2) m2=str.match(/(\d+)[^\d\n]*for\s+(?:all\s+other|all\s+other\s+category|general|open|unreserved|\bur\b)/i);
  if(m2) otherVal=+m2[1];

  // If only one found, try reverse: remaining number is the other
  if(scstVal!==null && otherVal===null){
    var nums=str.match(/\d+/g);
    if(nums&&nums.length>=2){
      for(var i=0;i<nums.length;i++){
        if(+nums[i]!==scstVal){otherVal=+nums[i];break;}
      }
    }
  }
  if(otherVal!==null && scstVal===null){
    var nums=str.match(/\d+/g);
    if(nums&&nums.length>=2){
      for(var i=0;i<nums.length;i++){
        if(+nums[i]!==otherVal){scstVal=+nums[i];break;}
      }
    }
  }

  if(scstVal!==null && otherVal!==null){
    // Detect all lower-threshold categories from the segment containing SC/ST
    // Find the segment of the string that holds the SC/ST group
    var lowerSeg='';
    var segMatch=str.match(/([^,;]+(?:sc|st)[^,;]*)/i);
    if(segMatch) lowerSeg=segMatch[1];
    else lowerSeg=str;
    var lowerCats=[];
    if(/\bsc\b/i.test(lowerSeg))  lowerCats.push('SC');
    if(/\bst\b/i.test(lowerSeg))  lowerCats.push('ST');
    if(/\bobc(?:-ncl)?\b/i.test(lowerSeg)) lowerCats.push('OBC');
    if(/\bews\b/i.test(lowerSeg)) lowerCats.push('EWS');
    if(/pwbd|pw\s*bd|disability|disabled|handicap|divyang/i.test(lowerSeg)) lowerCats.push('PwBD');
    if(!lowerCats.length) lowerCats=['SC','ST']; // fallback
    var lo=Math.min(scstVal,otherVal);
    var hi=Math.max(scstVal,otherVal);
    return 'CAT:'+lo+':'+hi+':'+lowerCats.join('+');
  }

  // Normal mark: normalise whitespace and ensure % suffix
  return str.trim().replace(/>\s*=/g,'>=').replace(/>\s*0/g,'>0').replace(/\s+/g,'').replace(/percent/i,'%').replace(/([0-9])$/,'$1%');
}

// ── COLUMN DETECTION ──────────────────────────────────────────────────────
function detectCols(rows){
  var hPat={
    srno:/sr[\s._]?no|serial|^s\.?no\.?$|^no\.?$/i,
    post:/post[\s_]?name|^post$/i,
    field:/exam[\s_]?pass|^field$|education|qualif|level/i,
    subject:/degree|subject|stream/i,
    marks:/percent|marks|%/i,
    grade:/class|grade/i,
    workexp:/work[\s_]?exp|experience/i
  };
  for(var i=0;i<Math.min(rows.length,15);i++){
    var r=rows[i],m={};
    for(var ci=0;ci<r.length;ci++){
      var h=String(r[ci]==null?'':r[ci]).trim();
      for(var k in hPat) if(hPat[k].test(h)&&m[k]===undefined) m[k]=ci;
    }
    if(m.field!==undefined&&m.marks!==undefined){
      m._hdrRow=i;
      if(m.subject===undefined) m.subject=m.field+1;
      if(m.grade===undefined)   m.grade=-1;
      if(m.srno===undefined)    m.srno=0;
      // if post col same as field col, post name must be in srno col (col 0)
      if(m.post===undefined||m.post===m.field) m.post=m.srno;
      if(m.workexp===undefined) m.workexp=-1;
      return m;
    }
  }
  for(var i=0;i<Math.min(rows.length,20);i++){
    for(var ci=0;ci<rows[i].length;ci++){
      var v=String(rows[i][ci]==null?'':rows[i][ci]).trim();
      if(matchLevel(v)||/^(AND|OR)$/i.test(v))
        return{_hdrRow:i-1,srno:0,post:1,field:ci,subject:ci+1,marks:ci+2,grade:ci+3,workexp:ci+4};
    }
  }
  return{_hdrRow:0,srno:0,post:1,field:2,subject:3,marks:4,grade:5,workexp:6};
}

// ── LEVEL MATCHING ────────────────────────────────────────────────────────
function matchLevel(t){
  if(!t) return null;
  var n=t.trim().toLowerCase().replace(/\s+/g,' ');
  // exact match
  for(var k in EDU) if(k.toLowerCase().replace(/\s+/g,' ')===n) return k;
  // alias match
  if(EDU_ALIASES[n]) return EDU_ALIASES[n];
  // strip dots for abbreviated forms like S.S.C. → ssc, H.S.C. → hsc
  var nodots=n.replace(/\./g,'').replace(/\s+/g,' ').trim();
  if(nodots.indexOf('ssc')===0||nodots==='ssc'||n.indexOf('s.s.c')>=0) return 'SSC/10th';
  if(nodots.indexOf('hsc')===0||nodots==='hsc'||n.indexOf('h.s.c')>=0) return 'HSC/12th';
  // keyword-contains match
  for(var i=0;i<EDU_KW.length;i++){
    var rule=EDU_KW[i];
    for(var j=0;j<rule.kw.length;j++) if(n.indexOf(rule.kw[j])>=0) return rule.level;
  }
  return null;
}

// ── OTHER PARSERS ─────────────────────────────────────────────────────────
function normGrade(s){
  if(!s||s==='-') return null;
  var t=s.trim();
  for(var k in GRADE_OPS) if(k.toLowerCase()===t.toLowerCase()) return k;
  return t;
}
function parseSubs(s){
  if(!s||s==='-') return [];
  if(/^any(\s+(value|stream|streams|subject|subjects|values))?$/i.test(s.trim())) return ['__ANY__'];
  // Tokenise: quoted tokens ("...") are kept whole even if they contain "/";
  // unquoted segments are split on "/".
  var tokens=[];
  var rest=s;
  while(rest.length){
    var qi=rest.indexOf('"');
    if(qi===-1){
      // no more quoted sections — split remainder on "/"
      var parts=rest.split('/');
      for(var i=0;i<parts.length;i++){var v=parts[i].trim();if(v&&v!=='-')tokens.push(v);}
      break;
    }
    // handle unquoted segment before the opening quote
    if(qi>0){
      var before=rest.slice(0,qi);
      var bparts=before.split('/');
      for(var i=0;i<bparts.length;i++){
        // last segment before the quote may be empty (trailing "/") — skip
        var v=bparts[i].trim();
        if(v&&v!=='-') tokens.push(v);
      }
    }
    // find closing quote
    var closeQ=rest.indexOf('"',qi+1);
    if(closeQ===-1) closeQ=rest.length-1; // unterminated quote — treat rest as quoted
    var quoted=rest.slice(qi+1,closeQ).trim();
    if(quoted&&quoted!=='-') tokens.push(quoted);
    // advance past closing quote; skip an immediately following "/"
    rest=rest.slice(closeQ+1);
    if(rest.charAt(0)==='/') rest=rest.slice(1);
  }
  return tokens;
}
function parseWE(s){
  if(!s||s==='-') return null;
  var m=s.match(/(\d+)\s*year/i);
  return m?+m[1]*12:null;
}
// True when this post's Work-Experience cell is "Post Qualification (Work Experience)".
// Drives work_exp_details_validations.php generation:
//   "Post Qualification"                                    -> all such posts participate (Case 1)
//   "Work Experience"                                       -> does NOT participate          (Case 2)
//   "Work Experience / Post Qualification Work Experience"  -> per-post; only the rows whose
//                                                              text says Post Qualification    (Case 3)
function isPostQuali(s){ return !!(s && /post[\s_-]*qualification/i.test(s)); }
function deriveField(q){
  var stops={do:1,you:1,have:1,a:1,an:1,the:1,is:1,are:1,be:1,of:1,in:1,at:1,to:1,for:1,with:1,your:1,any:1,should:1,whether:1,that:1,this:1};
  var words=q.replace(/[^a-zA-Z0-9\s]/g,' ').toLowerCase().split(/\s+/).filter(function(w){return w&&!stops[w];});
  var sig=words.slice(0,3);
  var fn=sig.join('_').replace(/_+/g,'_').replace(/^_|_$/g,'');
  return{fn:fn||'field',lk:'edu_'+(fn||'field'),amb:sig.length<2};
}

// ── PARSER ────────────────────────────────────────────────────────────────
function parseFile(buf){
  var wb=XLSX.read(buf,{type:'array'});
  var ws=wb.Sheets[wb.SheetNames[0]];
  var rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
  return buildPosts(rows);
}

function buildPosts(rows){
  var posts=[],errors=[],warnings=[],cur=null,grp=null;
  var CI=detectCols(rows); S.colMap=CI;
  function get(r,ci){return ci>=0&&ci<r.length?String(r[ci]==null?'':r[ci]).trim():'';}

  // ── Work-Experience mode (drives work_exp_details_validations.php) ─────────
  // The "Post Qualification" wording lives in the COLUMN HEADER, not the per-post
  // cell (cells hold "04 YEARS" etc.). Decide from the header via substring match:
  //   header has "post qualification", no "/"  -> Case 1: ALL posts participate
  //   header has "post qualification" AND "/"  -> Case 3: per-post (inspect each cell)
  //   header has no "post qualification"       -> Case 2: none participate
  var weHeader=CI.workexp>=0?get(rows[CI._hdrRow]||[],CI.workexp):'';
  var weHdr=weHeader.toLowerCase().replace(/\s+/g,' ');
  var weHdrPQ=/post[\s_-]*qualification/.test(weHdr);
  var weMixed=weHdrPQ && weHdr.indexOf('/')>=0;     // both plain & post-qual offered
  S.weHeader=weHeader; S.weMode=weHdrPQ?(weMixed?3:1):2;
  // postQuali for a post given its work-exp cell text G
  function postQualiOf(G){ return weMixed ? isPostQuali(G) : weHdrPQ; }

  var curWeMonths=0;
  for(var ri=CI._hdrRow+1;ri<rows.length;ri++){
    var r=rows[ri];
    var A=get(r,CI.srno),B=get(r,CI.post),C=get(r,CI.field);
    var D=get(r,CI.subject),E=get(r,CI.marks),F=get(r,CI.grade);
    var G=CI.workexp>=0?get(r,CI.workexp):'';
    if(G){var gv=parseWE(G);if(gv) curWeMonths=gv;}

    var isNumSrno=A&&!isNaN(+A)&&+A>0&&+A===Math.floor(+A);
    var postCol=B||A;
    var isNewPost=isNumSrno||(postCol&&!matchLevel(postCol)
      &&!/^(AND|OR)$/i.test(postCol)&&postCol.indexOf('?')<0
      &&!/yes\s*[\/\\]\s*no/i.test(postCol)&&postCol.length>2
      &&(!cur||postCol!==cur.postName));

    if(isNewPost){
      if(cur) posts.push(cur);
      grp={conditions:[],workExp:curWeMonths};
      cur={
        postcode:isNumSrno?String(Math.round(+A)).padStart(2,'0'):String(posts.length+1).padStart(2,'0'),
        postName:isNumSrno?(B||''):postCol,
        workExp:curWeMonths,workExpRaw:G,postQuali:postQualiOf(G),orGroups:[grp],ri:ri
      };
      var inlineLvl=matchLevel(C);
      if(inlineLvl){
        var mk=normMark(E),gk=normGrade(F);
        if(mk&&!isCat(mk)&&!lookupMarkOp(mk))
          errors.push({ri:ri,pc:cur.postcode,msg:'Unknown mark operator "'+E+'"'});
        else {
          var rawSubsI=EDU[inlineLvl].hasStream?parseSubs(D):[];
          var isAnyI=rawSubsI.length===1&&rawSubsI[0]==='__ANY__';
          grp.conditions.push({type:'edu',level:inlineLvl,subjects:isAnyI?[]:rawSubsI,anyStream:isAnyI,markRaw:mk,gradeRaw:gk,ri:ri,status:'ok',condName:''});
        }
      }
      continue;
    }
    if(!cur||!C) continue;
    var Cup=C.toUpperCase().trim();
    if(Cup==='OR'){grp={conditions:[],workExp:curWeMonths};cur.orGroups.push(grp);continue;}
    if(Cup==='AND') continue;
    if(grp) grp.workExp=curWeMonths;
    if(C.indexOf('?')>=0||/yes\s*[\/\\]\s*no/i.test(C)){
      var fd=deriveField(C);
      if(fd.amb) warnings.push({ri:ri,pc:cur.postcode,msg:'Radio field name may need review: "'+fd.fn+'"'});
      grp.conditions.push({type:'radio',question:C,fieldName:fd.fn,langKey:fd.lk,ri:ri,status:fd.amb?'warn':'ok'});
      continue;
    }
    var lvl=matchLevel(C);
    if(lvl){
      var mk=normMark(E),gk=normGrade(F);
      if(mk&&!isCat(mk)&&!lookupMarkOp(mk)){
        errors.push({ri:ri,pc:cur.postcode,msg:'Unknown mark operator "'+E+'"'});
        grp.conditions.push({type:'edu',level:lvl,subjects:[],anyStream:false,markRaw:mk,gradeRaw:gk,ri:ri,status:'error',condName:''});
      } else {
        var rawSubs=EDU[lvl].hasStream?parseSubs(D):[];
        var isAny=rawSubs.length===1&&rawSubs[0]==='__ANY__';
        grp.conditions.push({type:'edu',level:lvl,subjects:isAny?[]:rawSubs,anyStream:isAny,markRaw:mk,gradeRaw:gk,ri:ri,status:'ok',condName:''});
      }
      continue;
    }
    if(C.length>3&&!/^[-\s]+$/.test(C)&&!/^\d+$/.test(C))
      errors.push({ri:ri,pc:cur?cur.postcode:'?',msg:'Unknown value in Field column: "'+C+'"'});
  }
  if(cur) posts.push(cur);
  return{posts:posts,errors:errors,warnings:warnings,rawRows:rows};
}

// ── STREAM DATA ───────────────────────────────────────────────────────────
function buildSM(subjects, startSeq){
  var m={}, seq=startSeq||2;
  for(var i=0;i<subjects.length;i++){
    var s=subjects[i], sl=s.toLowerCase();
    if(sl==='others')          m['01']=s;
    else if(sl==='equivalent') m['99']=s;
    else{m[String(seq).padStart(2,'0')]=s; seq++;}
  }
  m._nextSeq=seq; // carry forward for next cond
  return m;
}

function getStreamData(posts){
  var out={};

  // Step 1: build global subject→key registry per level
  // Process posts in postcode order, then OR groups in order
  var sortedPosts=posts.slice().sort(function(a,b){return +a.postcode - +b.postcode;});
  var globalKeyReg={}; // level -> {subjValue -> key, nextSeq}

  function getGlobalKey(level, subjValue){
    var sl=subjValue.toLowerCase();
    if(sl.includes('other'))          return '01';
    if(sl.includes('equivalent'))      return '99';
    if(!globalKeyReg[level])   globalKeyReg[level]={map:{},nextSeq:2};
    var reg=globalKeyReg[level];
    if(reg.map[subjValue]===undefined){
      reg.map[subjValue]=String(reg.nextSeq).padStart(2,'0');
      reg.nextSeq++;
    }
    return reg.map[subjValue];
  }

  // Pre-pass: register all subjects in post+OR-group order to lock keys
  for(var pi=0;pi<sortedPosts.length;pi++){
    var post=sortedPosts[pi];
    for(var gi=0;gi<post.orGroups.length;gi++){
      var conds=post.orGroups[gi].conditions;
      for(var ci=0;ci<conds.length;ci++){
        var c=conds[ci];
        if(c.type!=='edu') continue;
        var def=EDU[c.level];
        if(!def||!def.hasStream||!c.subjects||!c.subjects.length) continue;
        for(var si2=0;si2<c.subjects.length;si2++) getGlobalKey(c.level, c.subjects[si2]);
      }
    }
  }

  // Step 2: build stream slots using global keys
  for(var pi=0;pi<sortedPosts.length;pi++){
    var post=sortedPosts[pi];
    var levelSets={};
    for(var gi=0;gi<post.orGroups.length;gi++){
      var conds=post.orGroups[gi].conditions;
      for(var ci=0;ci<conds.length;ci++){
        var c=conds[ci];
        if(c.type!=='edu') continue;
        var def=EDU[c.level];
        if(!def||!def.hasStream||!c.subjects||!c.subjects.length) continue;
        var subjKey=c.subjects.join('|');
        if(!levelSets[c.level]) levelSets[c.level]=[];
        var found=false;
        for(var j=0;j<levelSets[c.level].length;j++) if(levelSets[c.level][j].subjKey===subjKey){found=true;break;}
        if(!found) levelSets[c.level].push({subjKey:subjKey,subjects:c.subjects});
      }
    }
    for(var level in levelSets){
      var sets=levelSets[level];
      var multi=sets.length>1;
      if(!out[level]) out[level]=[];
      for(var si=0;si<sets.length;si++){
        var cn=multi?'_cond'+(si+1):'';
        // build SM using global keys
        var sm={};
        for(var si2=0;si2<sets[si].subjects.length;si2++){
          var k=getGlobalKey(level, sets[si].subjects[si2]);
          sm[k]=sets[si].subjects[si2];
        }
        var nk=JSON.stringify(sm);
        var key=nk+'||'+cn;
        var slot=null;
        for(var j=0;j<out[level].length;j++) if(out[level][j].key===key){slot=out[level][j];break;}
        if(!slot){slot={key:key,nk:nk,sm:sm,condName:cn,postcodes:[]};out[level].push(slot);}
        if(slot.postcodes.indexOf(post.postcode)<0) slot.postcodes.push(post.postcode);
      }
    }
  }

  return out;
}

function annotateCondNames(posts,sd){
  for(var pi=0;pi<posts.length;pi++){
    var post=posts[pi];
    var levelSets={};
    for(var gi=0;gi<post.orGroups.length;gi++){
      var conds=post.orGroups[gi].conditions;
      for(var ci=0;ci<conds.length;ci++){
        var c=conds[ci];
        if(c.type!=='edu') continue;
        var def=EDU[c.level];
        if(!def||!def.hasStream||!c.subjects||!c.subjects.length){c.condName='';continue;}
        var sk=c.subjects.join('|');
        if(!levelSets[c.level]) levelSets[c.level]=[];
        if(levelSets[c.level].indexOf(sk)<0) levelSets[c.level].push(sk);
      }
    }
    for(var gi=0;gi<post.orGroups.length;gi++){
      var conds=post.orGroups[gi].conditions;
      for(var ci=0;ci<conds.length;ci++){
        var c=conds[ci];
        if(c.type!=='edu') continue;
        var def=EDU[c.level];
        if(!def||!def.hasStream||!c.subjects||!c.subjects.length){c.condName='';continue;}
        var sk=c.subjects.join('|');
        var sets=levelSets[c.level]||[];
        var idx=sets.indexOf(sk);
        c.condName=sets.length>1?'_cond'+(idx+1):'';
      }
    }
  }
}

function arrRef(def,condName,single){
  var base='$'+def.stream+(condName||'');
  return single?base:base+'[$postcode]';
}

function getAllRadios(post){
  var seen={},out=[];
  for(var gi=0;gi<post.orGroups.length;gi++){
    var conds=post.orGroups[gi].conditions;
    for(var ci=0;ci<conds.length;ci++){
      var c=conds[ci];
      if(c.type==='radio'&&!seen[c.question]){seen[c.question]=true;out.push(c);}
    }
  }
  return out;
}

function getCatValues(post){
  for(var gi=0;gi<post.orGroups.length;gi++){
    var conds=post.orGroups[gi].conditions;
    for(var ci=0;ci<conds.length;ci++) if(isCat(conds[ci].markRaw)) return parseCatMark(conds[ci].markRaw);
  }
  return null;
}

// ── ARRAY EMIT HELPER ─────────────────────────────────────────────────────
function sortEnts(ents){
  return ents.sort(function(a,b){
    if(a[0]==='01') return 1; if(b[0]==='01') return -1;
    if(a[0]==='99') return 1; if(b[0]==='99') return -1;
    return a[0].localeCompare(b[0]);
  });
}
function emitArr(lhs,sm){
  var o=ind(1)+lhs+' = array(\n';
  var ents=sortEnts(Object.entries(sm));
  for(var i=0;i<ents.length;i++) o+=ind(2)+"'"+ents[i][0]+"' => '"+ents[i][1].replace(/'/g,"\\'")+"',\n";
  return o+ind(1)+');\n';
}
function buildMergedSM(condSlots){
  // keys are already globally sequential across cond slots — just merge all entries
  var merged={};
  for(var i=0;i<condSlots.length;i++){
    var ents=Object.entries(condSlots[i].sm);
    for(var j=0;j<ents.length;j++) merged[ents[j][0]]=ents[j][1];
  }
  return merged;
}

function genLangFile(posts){
  var o='<?php\n\n';
  var seen={};
  for(var pi=0;pi<posts.length;pi++){
    var post=posts[pi];
    var radios=getAllRadios(post);
    for(var ri=0;ri<radios.length;ri++){
      var r=radios[ri];
      var lk=rLk(r,post.postcode);
      if(seen[lk]) continue;
      seen[lk]=true;
      var q=r.question
        .replace(/\s*yes\s*[\/\\]\s*no\s*(should\s*be\s*yes)?\.?/gi,'')
        .replace(/\s*select\s*yes\s*[\/\\]\s*no\s*(should\s*be\s*yes)?\.?/gi,'')
        .replace(/should\s*be\s*yes\.?/gi,'')
        .replace(/select\s*yes\s*or\s*no\.?/gi,'')
        .replace(/\s+/g,' ').trim();
      o+="$LANG['"+lk+"'] = '"+q.replace(/'/g,"\\'")+"';\n";
    }
  }
  o+='\n?>';
  return o;
}

// ── GENERATOR: edu_validations.php ──────────────────────────────────────────
function genEduValidations(posts){
  var sd=getStreamData(posts);
  annotateCondNames(posts,sd);

  // Collect unique stream array global vars in EDU_ORDER order.
  // For each level, add: base array ($arrXxx), then any _condN variants, then re-add base last
  // so order is: _cond1, _cond2, ..., base (matching PHP convention).
  var globalVarsSeen={'$errmsgarr':true,'$LANG':true};
  var globalVars=['$errmsgarr','$LANG'];
  function addGlobal(vn){if(!globalVarsSeen[vn]){globalVarsSeen[vn]=true;globalVars.push(vn);}}
  for(var li=0;li<EDU_ORDER.length;li++){
    var lvl=EDU_ORDER[li];
    var def=EDU[lvl];
    if(!def||!def.hasStream) continue;
    // Scan all conditions for this level; collect condName variants
    var condNamesSeen={};
    for(var pi=0;pi<posts.length;pi++){
      for(var gi=0;gi<posts[pi].orGroups.length;gi++){
        var conds=posts[pi].orGroups[gi].conditions;
        for(var ci=0;ci<conds.length;ci++){
          var c=conds[ci];
          if(c.type!=='edu'||c.level!==lvl) continue;
          condNamesSeen[c.condName||'']=true;
        }
      }
    }
    var condKeys=Object.keys(condNamesSeen);
    if(!condKeys.length) continue;
    // _condN variants first (sorted), then base
    var condNKeys=condKeys.filter(function(k){return k!=='';}).sort();
    for(var ki=0;ki<condNKeys.length;ki++) addGlobal('$'+def.stream+condNKeys[ki]);
    addGlobal('$'+def.stream);
  }

  var o='<?PHP\n';
  o+=ind(0)+'function checkDOPassing($field_number,$row_name,$col_name){\n';
  o+=ind(1)+'global '+globalVars.join(',')+';\n\n';
  o+=ind(1)+"$errmsg = '';\n";
  o+=ind(1)+"$field_yr = $_POST['selyr'.$field_number];\n";
  o+=ind(1)+"$field_mon = $_POST['selmonth'.$field_number];\n";
  o+=ind(1)+"$field_day = $_POST['selday'.$field_number];\t\t\n\n";
  o+=ind(1)+"if( strtotime(QUALIFICATION_AS_ON_YEAR.'-'.QUALIFICATION_AS_ON_MONTH.'-'.QUALIFICATION_AS_ON_DAY) > strtotime(date('Y-m-d')) ){\n";
  o+=ind(2)+"$QUALIFICATION_AS_ON_YEAR1 = date('Y');\n";
  o+=ind(2)+"$QUALIFICATION_AS_ON_MONTH1 = date('m');\n";
  o+=ind(2)+"$QUALIFICATION_AS_ON_DAY1 = date('d');\n";
  o+=ind(1)+'}else{\n';
  o+=ind(2)+'$QUALIFICATION_AS_ON_YEAR1 = QUALIFICATION_AS_ON_YEAR;\n';
  o+=ind(2)+'$QUALIFICATION_AS_ON_MONTH1 = QUALIFICATION_AS_ON_MONTH;\n';
  o+=ind(2)+'$QUALIFICATION_AS_ON_DAY1 = QUALIFICATION_AS_ON_DAY;\n';
  o+=ind(1)+'}\t\n\n';

  // Sort posts by postcode
  var sortedPosts=posts.slice().sort(function(a,b){return +a.postcode - +b.postcode;});
  var single=posts.length===1;

  if(!single) o+=ind(1)+"$postcode = $_POST['postcode'];\n\n";

  var anyPostBlock=false;
  for(var pi=0;pi<sortedPosts.length;pi++){
    var post=sortedPosts[pi];
    // Only include OR groups that have at least one edu condition
    var grps=post.orGroups.filter(function(g){
      return g.conditions.some(function(c){return c.type==='edu';});
    });
    if(!grps.length) continue;

    if(!single){
      o+=ind(1)+(anyPostBlock?'} else if':' if')+"($_POST['postcode'] == '"+post.postcode+"'){\n";
      anyPostBlock=true;
    }

    var d=single?1:2; // indent depth for condition blocks

    // category-based mark threshold ($GradeMarkPer) — mirrors genEligibility
    var cat=getCatValues(post);
    if(cat){
      o+=ind(d)+'if('+buildCatCond(cat)+') {\n';
      o+=ind(d+1)+'$GradeMarkPer = '+cat.scst+';\n';
      o+=ind(d)+'} else {\n';
      o+=ind(d+1)+'$GradeMarkPer = '+cat.other+';\n';
      o+=ind(d)+'}\n';
    }

    var firstGrp=true;
    for(var gi=0;gi<grps.length;gi++){
      var grp=grps[gi];
      var allConds=grp.conditions;

      // Build condition lines; single-post uses bare array refs, multi-post uses [$postcode]
      var condParts=[];
      for(var ci=0;ci<allConds.length;ci++){
        condParts.push(buildCondLine(allConds[ci],post.postcode,single));
      }

      // Collect edu field indices for $field_number check
      var idxSeen={};
      for(var ci=0;ci<allConds.length;ci++){
        var c=allConds[ci];
        if(c.type!=='edu') continue;
        var def=EDU[c.level];
        if(def) idxSeen[def.idx]=true;
      }
      var idxList=Object.keys(idxSeen).map(Number).sort(function(a,b){return a-b;});

      // if / else if opening
      o+=ind(d)+(firstGrp?'if':'} else if')+'(\n';
      for(var ci=0;ci<condParts.length;ci++){
        o+=ind(d+1)+condParts[ci]+(ci<condParts.length-1?' &&':'')+' \n';
      }
      o+=ind(d)+') {\n';

      // $field_number comparison
      if(idxList.length===1){
        o+=ind(d+1)+'if($field_number == '+idxList[0]+'){\n';
      } else if(idxList.length===2){
        o+=ind(d+1)+'if($field_number == '+idxList[0]+' || $field_number == '+idxList[1]+'){\n';
      } else {
        o+=ind(d+1)+'if(\n';
        for(var ii=0;ii<idxList.length;ii++){
          o+=ind(d+2)+'$field_number == '+idxList[ii]+(ii<idxList.length-1?' ||':'')+' \n';
        }
        o+=ind(d+1)+'){\n';
      }
      o+=ind(d+2)+'$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;\n';
      o+=ind(d+2)+'$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;\n';
      o+=ind(d+2)+'$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;\n';
      o+=ind(d+1)+'}else{ \n';
      o+=ind(d+2)+"$QUALIFICATION_AS_ON_YEAR = date('Y');\n";
      o+=ind(d+2)+"$QUALIFICATION_AS_ON_MONTH = date('m');\n";
      o+=ind(d+2)+"$QUALIFICATION_AS_ON_DAY = date('d');\n";
      o+=ind(d+1)+'}\n';

      firstGrp=false;
    }

    // default else for this postcode block
    o+=ind(d)+'} else{ \n';
    o+=ind(d+1)+"$QUALIFICATION_AS_ON_YEAR = date('Y');\n";
    o+=ind(d+1)+"$QUALIFICATION_AS_ON_MONTH = date('m');\n";
    o+=ind(d+1)+"$QUALIFICATION_AS_ON_DAY = date('d');\n";
    o+=ind(d)+'}\t\n';
  }

  // global else for multi-post (no postcode matched)
  if(!single&&anyPostBlock){
    o+=ind(1)+'} else { \n';
    o+=ind(2)+"$QUALIFICATION_AS_ON_YEAR = date('Y');\n";
    o+=ind(2)+"$QUALIFICATION_AS_ON_MONTH = date('m');\n";
    o+=ind(2)+"$QUALIFICATION_AS_ON_DAY = date('d');\n";
    o+=ind(1)+'}\t\n';
  }

  o+=' \n\t\n';
  o+=ind(1)+'if($field_yr > $QUALIFICATION_AS_ON_YEAR){\n';
  o+=ind(2)+'$errmsg .="$LANG[$row_name] $LANG[$col_name] should be as on ".$QUALIFICATION_AS_ON_DAY.".".$QUALIFICATION_AS_ON_MONTH.".".$QUALIFICATION_AS_ON_YEAR.",&nbsp;&nbsp;";\n';
  o+=ind(1)+'}\n';
  o+=ind(1)+'if($field_yr == $QUALIFICATION_AS_ON_YEAR){\n';
  o+=ind(2)+'if($field_mon > $QUALIFICATION_AS_ON_MONTH){\n';
  o+=ind(3)+'$errmsg .="$LANG[$row_name] $LANG[$col_name] should be as on ".$QUALIFICATION_AS_ON_DAY.".".$QUALIFICATION_AS_ON_MONTH.".".$QUALIFICATION_AS_ON_YEAR.",&nbsp;&nbsp;";\n';
  o+=ind(2)+'}\t\t\n';
  o+=ind(2)+'if($field_mon == $QUALIFICATION_AS_ON_MONTH && $field_day > $QUALIFICATION_AS_ON_DAY ){\n';
  o+=ind(3)+'$errmsg .="$LANG[$row_name] $LANG[$col_name] should be as on ".$QUALIFICATION_AS_ON_DAY.".".$QUALIFICATION_AS_ON_MONTH.".".$QUALIFICATION_AS_ON_YEAR.",&nbsp;&nbsp;";\n';
  o+=ind(2)+'}\t\t\t\n';
  o+=ind(1)+'}\n';
  o+=ind(1)+'return $errmsg;\n';
  o+='}'+'\n';
  o+='?>';
  return o;
}

// ── GENERATOR: edu_config.php ─────────────────────────────────────────────
function genEduConfig(posts){
  var sd=getStreamData(posts);
  annotateCondNames(posts,sd);
  var single=posts.length===1;
  var o='<?PHP\n'+ind(1)+'/***********************************************Edu Config ***************************************************************/\n\n';

  for(var li=0;li<EDU_ORDER.length;li++){
    var lvl=EDU_ORDER[li];
    if(!sd[lvl]) continue;
    var def=EDU[lvl];
    if(!def.hasStream) continue;
    var slots=sd[lvl];
    o+=ind(1)+'// '+lvl+' Stream\n';

    var condSlots=[],plainSlots=[];
    for(var si=0;si<slots.length;si++){
      slots[si].postcodes.sort(function(a,b){return +a - +b;});
      if(slots[si].condName) condSlots.push(slots[si]);
      else plainSlots.push(slots[si]);
    }
    // sort slots by their first (lowest) postcode
    condSlots.sort(function(a,b){return +a.postcodes[0] - +b.postcodes[0];});
    plainSlots.sort(function(a,b){return +a.postcodes[0] - +b.postcodes[0];});

    // emit _condN arrays
    for(var si=0;si<condSlots.length;si++){
      var sl=condSlots[si];
      var base='$'+def.stream+sl.condName;
      var lhs=single?base:sl.postcodes.map(function(p){return base+"['"+p+"']";}).join(' = ');
      o+=emitArr(lhs,sl.sm);
    }

    // emit merged base array for posts with _condN
    if(condSlots.length>0){
      var condPcs={};
      for(var si=0;si<condSlots.length;si++)
        for(var j=0;j<condSlots[si].postcodes.length;j++) condPcs[condSlots[si].postcodes[j]]=true;
      var mGroups=[];
      for(var pc in condPcs){
        var mySl=condSlots.filter(function(s){return s.postcodes.indexOf(pc)>=0;});
        var msm=buildMergedSM(mySl),mnk=JSON.stringify(msm);
        var found=false;
        for(var j=0;j<mGroups.length;j++) if(mGroups[j].mnk===mnk){mGroups[j].pcs.push(pc);found=true;break;}
        if(!found) mGroups.push({mnk:mnk,sm:msm,pcs:[pc]});
      }
      mGroups.sort(function(a,b){return +a.pcs[0] - +b.pcs[0];});
      for(var j=0;j<mGroups.length;j++){
        var base='$'+def.stream;
        var lhs=single?base:mGroups[j].pcs.map(function(p){return base+"['"+p+"']";}).join(' = ');
        o+=emitArr(lhs,mGroups[j].sm);
      }
    }

    // emit plain slots
    for(var si=0;si<plainSlots.length;si++){
      var sl=plainSlots[si];
      var base='$'+def.stream;
      var lhs=single?base:sl.postcodes.map(function(p){return base+"['"+p+"']";}).join(' = ');
      o+=emitArr(lhs,sl.sm);
    }
    o+='\n';
  }

  var rPosts=posts.filter(function(p){return getAllRadios(p).length>0;});
  if(rPosts.length>0){
    o+=ind(1)+'$arrPostBasedRadioCond = array(\n';
    for(var pi=0;pi<rPosts.length;pi++){
      var post=rPosts[pi];
      var ents=getAllRadios(post).map(function(r){
        return "array('label' => '"+rLk(r,post.postcode)+"', 'field' => '"+rFn(r,post.postcode)+"', 'shouldbe' => 'Y', 'validate_msg' => 'Should be Yes')";
      });
      o+=ind(2)+"'"+post.postcode+"' => array("+ents.join(', ')+"),\n";
    }
    o+=ind(1)+');\n\n';
  }
  o+='?>';
  return o;
}

// ── GENERATOR: eligibity_validation.php ──────────────────────────────────
function genEligibility(posts){
  var sd=getStreamData(posts);
  annotateCondNames(posts,sd);
  var single=posts.length===1;
  var o='<?PHP \n'+ind(1)+'/***********************************************Eligibility Validation ***************************************************************/\t\n\n';
  if(!single) o+=ind(1)+"$postcode = $_POST['postcode'];\n\n";

  for(var pi=0;pi<posts.length;pi++){
    var post=posts[pi];
    var grps=post.orGroups.filter(function(g){return g.conditions.length>0;});
    if(!grps.length) continue;
    var d=single?1:2;

    if(!single) o+=ind(1)+(pi===0?'if':'} else if')+'($postcode == "'+post.postcode+'") {\n';

    // category mark block
    var cat=getCatValues(post);
    if(cat){
      o+=ind(d)+'if('+buildCatCond(cat)+') {\n';
      o+=ind(d+1)+'$GradeMarkPer = '+cat.scst+';\n';
      o+=ind(d)+'} else {\n';
      o+=ind(d+1)+'$GradeMarkPer = '+cat.other+';\n';
      o+=ind(d)+'}\n';
    }

    o+=ind(d)+'if(! \n'+ind(d+1)+'(\n';
    for(var gi=0;gi<grps.length;gi++){
      var conds=grps[gi].conditions;
      o+=ind(d+2)+'(\n';
      for(var ci=0;ci<conds.length;ci++)
        o+=ind(d+3)+buildCondLine(conds[ci],post.postcode,single)+(ci<conds.length-1?' &&':'')+'\n';
      o+=ind(d+2)+')'+(gi<grps.length-1?' ||':'')+'\n';
    }
    o+=ind(d+1)+')\n'+ind(d)+')\n'+ind(d)+'{\n\n';
    o+=ind(d+1)+'$finalsubmit="N";\n\n';
    o+=buildErrMsgs(post,d+1,single);
    o+='\n'+ind(d+1)+'$errmsg.=$Elig_errmsg;\n';
    o+=ind(d+1)+"$errmsgarr[]='eligibility|'.$Elig_errmsg;\n\n";
    o+=ind(d)+'}else\n'+ind(d)+'{\n'+ind(d+1)+"$errmsgarr[]='eligibility|';\n"+ind(d)+'}\n';
    if(post.workExp){
      var tiers=weRadioTiers(post,post.postcode);
      if(tiers.length>=2){
        for(var ti=0;ti<tiers.length;ti++){
          o+=ind(d)+(ti===0?'if':'else if')+"($_POST['"+tiers[ti].field+"'] == 'Y') {\n";
          o+=buildWE(tiers[ti].months,d+1);
          o+=ind(d)+'}\n';
        }
      } else {
        o+=buildWE(post.workExp,d);
      }
    }
  }
  if(!single&&posts.length>0) o+=ind(1)+'}\n';
  o+='?>';
  return o;
}

function buildCondLine(cond,pc,single){
  if(cond.type==='radio') return "($_POST['"+rFn(cond,pc)+"']=='Y')";
  var def=EDU[cond.level];
  var cat=isCat(cond.markRaw);
  var mo=(!cat&&cond.markRaw)?lookupMarkOp(cond.markRaw):null;
  var gc=gradeCheck("$_POST['"+def.sg+"']",cond.gradeRaw);
  var checks=[];
  if(cat)     checks.push("$_POST['"+def.sm+"'] >=$GradeMarkPer");
  else if(mo) checks.push("$_POST['"+def.sm+"'] "+mo.php);
  if(gc)      checks.push(gc);
  var inner=checks.join(' && ');
  if(!def.hasStream) return'('+inner+')';
  if(cond.anyStream){
    var sc="$_POST['"+def.ss+"']!=''";
    return'('+(inner?sc+' && '+inner:sc)+')';
  }
  var aref=arrRef(def,cond.condName,single);
  var sp="$_POST['"+def.ss+"']!='' && array_key_exists($_POST['"+def.ss+"'], "+aref+")";
  return'('+(inner?sp+' && '+inner:sp)+')';
}

function buildErrMsgs(post,indLvl,single){
  var grps=post.orGroups.filter(function(g){return g.conditions.length>0;});
  var o='',first=true;
  for(var gi=0;gi<grps.length;gi++){
    var conds=grps[gi].conditions;
    for(var ci=0;ci<conds.length;ci++){
      o+=ind(indLvl)+'$Elig_errmsg'+(first?' = ':' .= ')+buildErrLine(conds[ci],post.postcode,single)+';\n';
      first=false;
      if(ci<conds.length-1) o+=ind(indLvl)+'$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";\n';
    }
    if(gi<grps.length-1) o+=ind(indLvl)+'$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";\n';
  }
  return o;
}

function buildErrLine(cond,pc,single){
  if(cond.type==='radio') return "$LANG['"+rLk(cond,pc)+"'].' Should be Yes&nbsp;&nbsp;'";
  var def=EDU[cond.level];
  var cat=isCat(cond.markRaw);
  var mo=(!cat&&cond.markRaw)?lookupMarkOp(cond.markRaw):null;
  var go=cond.gradeRaw?(GRADE_OPS[cond.gradeRaw]||null):null;
  var aref=arrRef(def,cond.condName,single);

  var markPart='';
  if(cat)     markPart=" ,&nbsp;&nbsp; \".$LANG['edu_lbl_mark'].\" >= \".$GradeMarkPer.\" % ,&nbsp;&nbsp; ";
  else if(mo) markPart=" ,&nbsp;&nbsp; \".$LANG['edu_lbl_mark'].\" "+mo.err+" ,&nbsp;&nbsp; ";
  var gradePart=go?" &nbsp;&nbsp; \".$LANG['edu_lbl_grade'].\" = "+go.err+" &nbsp;&nbsp;\"":'\"';

  if(cond.anyStream)
    return "\"Please enter \".$LANG['"+def.lang+"'].\""+markPart+gradePart;
  if(!def.hasStream||!cond.subjects||!cond.subjects.length)
    return "\"Please select \".$LANG['"+def.lang+"'].\""+markPart+gradePart;
  return "\"Please select \".$LANG['"+def.lang+"'].\" &nbsp;&nbsp; \".$LANG['edu_lbl_subject'].\" = \".implode(\" / \", "+aref+").\""+markPart+gradePart;
}

function buildWE(months,d){
  var yrs=months/12,yt=yrs===1?'1 year':yrs+' years';
  return ind(d)+"if(WORK_EXP_ROW_COUNT > 0){\n"
    +ind(d+1)+"if(!($_POST['totexp']>="+months+")){\n"
    +ind(d+2)+'$finalsubmit="N";\n'
    +ind(d+2)+'$errmsg.="Experience should be '+yt+' Or Above &nbsp;&nbsp;<br/>";\n'
    +ind(d+2)+"$errmsgarr[]='totexp_popup|Experience should be "+yt+" Or Above &nbsp;&nbsp;';\n"
    +ind(d+1)+"}else\n"+ind(d+1)+"{\n"
    +ind(d+2)+"$errmsgarr[]='totexp_popup|';\n"
    +ind(d+1)+"}\n"+ind(d)+"}\n";
}
function isWorkExpRadio(cond){
  if(cond.type!=='radio') return false;
  var q=cond.question||'';
  return /experience/i.test(q) && /\d+\s*year/i.test(q);
}
function weYears(cond){
  var m=(cond.question||'').match(/(\d+)\s*year/i);
  return m?+m[1]:0;
}
// Returns [{field, months}] sorted descending by months, or [] if no WE radios found.
// months comes from the OR group's workExp (spreadsheet WE column), not the radio text.
function weRadioTiers(post,pc){
  var map={};  // radioField -> workExp months from OR group
  for(var gi=0;gi<post.orGroups.length;gi++){
    var grp=post.orGroups[gi];
    var conds=grp.conditions;
    for(var ci=0;ci<conds.length;ci++){
      var c=conds[ci];
      if(isWorkExpRadio(c)){
        var f=rFn(c,pc);
        var m=grp.workExp||post.workExp||0;
        if(!map[f]||m>map[f]) map[f]=m;
      }
    }
  }
  var tiers=Object.keys(map).map(function(f){return{field:f,months:map[f]};});
  tiers.sort(function(a,b){return b.months-a.months;});
  return tiers;
}

// ── GENERATOR: work_exp_details_validations.php ───────────────────────────
// The file's static head/tail are preserved verbatim (base64-embedded); only the
// post-qualification date-derivation block is generated dynamically:
//   1. strtotime() declarations for the qualification timestamps actually used
//   2. per-postcode eligibility conditions (reused verbatim from eligibity_validation.php)
//   3. the qualification-date selection that feeds $eligibilityPostQualidtArr[]
// Returns '' when no post requires it (Case 2 — plain "Work Experience" only).
var WE_HEAD = atob('PD9waHAKICAJCmlmKFBPU1RfUVVBTElGSUNBVElPTl9FWFApewovKiAgc3dpdGNoKCRfUE9TVFsncG9zdGNvZGUnXSl7CgkJZGVmYXVsdDoKCQkJJGVkdWRheSA9JF9QT1NUWydzZWxkYXkzJ107CgkJICAgICRlZHVtb250aD0kX1BPU1RbJ3NlbG1vbnRoMyddOy8vLUNoYW5nZSB0aGUgdmFyaWFibGUgaW5pdGlhbGl6YXRpb24gYXMgcGVyIHRoZSByZXF1aXJlbWVudDsKCQkJJGVkdXllYXI9JF9QT1NUWydzZWx5cjMnXTsvLy1DaGFuZ2UgdGhlIHZhcmlhYmxlIGluaXRpYWxpemF0aW9uIGFzIHBlciB0aGUgcmVxdWlyZW1lbnQ7CQoJCQkkZXhwX21zZ19jb250ZW50ID0gJ0VkdWNhdGlvbmFsIHF1YWxpZmljYXRpb24gZGF0ZSBvZiBwYXNzaW5nICc7CgkJYnJlYWs7Cgl9ICovCgo=');
var WE_TAIL = atob('CglpZihpc19hcnJheSgkZWxpZ2liaWxpdHlQb3N0UXVhbGlkdEFycikpewoJCWlmKGNvdW50KCRlbGlnaWJpbGl0eVBvc3RRdWFsaWR0QXJyKSA+IDApewogICAgICAgICRwb3N0UXVhbGlmaU1pbiA9IG1pbigkZWxpZ2liaWxpdHlQb3N0UXVhbGlkdEFycik7CiAgICAgICAgJHBvc3RRdWFsaWZpTWluRHQgPSBkYXRlKCdZLW0tZCcsJHBvc3RRdWFsaWZpTWluKTsKICAgICAgICAkcG9zdFF1YWxpZmlNaW5EdEFyciA9IGV4cGxvZGUoIi0iLCRwb3N0UXVhbGlmaU1pbkR0KTsKICAgICAgICAKICAgICAgICAkZWR1ZGF5ID0gJHBvc3RRdWFsaWZpTWluRHRBcnJbMl07CiAgICAgICAgJGVkdW1vbnRoID0gJHBvc3RRdWFsaWZpTWluRHRBcnJbMV07CiAgICAgICAgJGVkdXllYXIgPSAkcG9zdFF1YWxpZmlNaW5EdEFyclswXTsKICAgICAgICAkZXhwX21zZ19jb250ZW50ID0gJ0VkdWNhdGlvbmFsIHF1YWxpZmljYXRpb24gZGF0ZSBvZiBwYXNzaW5nICc7CiAgICB9Cn0KCn1lbHNleyAKCSRlZHVtb250aCA9ICRkb2Jtb250aDsvL2RvYiBtb250aAoJJGVkdXllYXIgPSAkZG9ieWVhcjsvL2RvYiBtb250aAoJJGV4cF9tc2dfY29udGVudCA9ICdEYXRlIE9mIEJpcnRoICc7Cn0KJHRvdE1vbnRoWXIgPSAwOwokdG90RGF5c0NhbCA9IDA7CiR0b3REYXlzID0gMDsKJGVtcDFfY2hlY2s9MDsgJGVtcDJfY2hlY2s9MDsgJGVtcDNfY2hlY2s9MDsgJGVtcDRfY2hlY2s9MDsgJGVtcDVfY2hlY2s9MDsgJGVtcDZfY2hlY2s9MDsgJGVtcDdfY2hlY2s9MDsgJGVtcDhfY2hlY2s9MDsKZm9yKCRpPTE7JGk8PVdPUktfRVhQX1JPV19DT1VOVDskaSsrKXsKICAgIAogICAgICAgICRlbXBfZ2VuX2NoZWNrID0gImVtcCIuJGkuIl9jaGVjayI7CgkkJGVtcF9nZW5fY2hlY2s9IDA7CiAgICAgICAgCiAgICAgICAgJHByZXNlbnRFbXBsb3llciA9IDA7CiAgICAgICAgaWYoJGk9PTEgJiYgJF9QT1NUWyJwcmVzZW50X3dvcmtpbmciXT09IlkiKSB7CiAgICAgICAgICAgICRwcmVzZW50RW1wbG95ZXIgPSAxOwogICAgICAgICAgICAkJGVtcF9nZW5fY2hlY2s9MTsKICAgICAgICAgICAgCiAgICAgICAgICAgICRfUE9TVFsic2VsdG9kYXkiLiRpXSA9IFBSRVNFTlRFTVBfQVNfT05fREFZOwogICAgICAgICAgICAkX1BPU1RbInNlbHRvbW9uIi4kaV0gPSBQUkVTRU5URU1QX0FTX09OX01PTlRIOwogICAgICAgICAgICAkX1BPU1RbInNlbHRveXIiLiRpXSA9IFBSRVNFTlRFTVBfQVNfT05fWUVBUjsKICAgICAgICB9ZWxzZXsKCQkJJHdvcmtleHBfdG9fZGF0ZT1leHBsb2RlKCcvJyxnZXRWYWwoJF9QT1NUWyd3b3JrZXhwX3RvX2RhdGUnLiRpXSkpOwoJCQkvL3ByaW50X3IoJHdvcmtleHBfdG9fZGF0ZSk7IAoJCQlpZihXT1JLX0RBVEVfRk9STUFUX01NWVk9PTEpewoJCQkJCgkJCQlpZihjb3VudCgkd29ya2V4cF90b19kYXRlKT09Mil7CgkJCQkJJF9QT1NUWydzZWx0b21vbicuJGldID0gJHdvcmtleHBfdG9fZGF0ZVswXTsKCQkJICAgICAgICAkX1BPU1RbJ3NlbHRveXInLiRpXSA9ICR3b3JrZXhwX3RvX2RhdGVbMV07CgkJCQl9ZWxzZXsKCQkJCQkkX1BPU1RbJ3NlbHRvbW9uJy4kaV0gPSAkd29ya2V4cF90b19kYXRlWzFdOwoJCQkgICAgICAgICRfUE9TVFsnc2VsdG95cicuJGldID0gJHdvcmtleHBfdG9fZGF0ZVsyXTsKCQkJCX0KCQkKCQkJfWVsc2V7CgkJCSAgJF9QT1NUWydzZWx0b2RheScuJGldID0gJHdvcmtleHBfdG9fZGF0ZVswXTsKCQkJICAkX1BPU1RbJ3NlbHRvbW9uJy4kaV0gPSAkd29ya2V4cF90b19kYXRlWzFdOwoJCQkgICRfUE9TVFsnc2VsdG95cicuJGldID0gJHdvcmtleHBfdG9fZGF0ZVsyXTsJCgkJCX0KCQkJCgkJfQoKCS8qVG90YWwgRXhwZXJpZW5jZSBDYWxjdWxhdGlvbiBTdGFydCovCgkkY2FsY0Zvcm1hdEZuID0gIllNRCI7CgkvKiBpZihFWFBfREFURUZPUk1BVF9ERE1NWVkgPT0gMCl7CgkJJF9QT1NUWydzZWxmcm9tZGF5Jy4kaV0gPSAiMDEiOwoJCSRfUE9TVFsnc2VsdG9kYXknLiRpXSA9ICIwMSI7CgkJJGNhbGNGb3JtYXRGbiA9ICJZTSI7Cgl9ICovCglpZighZW1wdHkoJF9QT1NUWyd3b3JrZXhwX2Zyb21fZGF0ZScuJGldKSl7Cgkkd29ya2V4cF9mcm9tX2RhdGU9ZXhwbG9kZSgnLycsZ2V0VmFsKCRfUE9TVFsnd29ya2V4cF9mcm9tX2RhdGUnLiRpXSkpOwoJaWYoV09SS19EQVRFX0ZPUk1BVF9NTVlZPT0xKXsKCQkvLyRfUE9TVFsnc2VsZnJvbWRheScuJGldID0gJHdvcmtleHBfZnJvbV9kYXRlWzBdOwoJCWlmKGNvdW50KCR3b3JrZXhwX2Zyb21fZGF0ZSk9PTIpewoJCQkkX1BPU1RbJ3NlbGZyb21tb24nLiRpXSA9ICR3b3JrZXhwX2Zyb21fZGF0ZVswXTsKCQkgICAgJF9QT1NUWydzZWxmcm9teXInLiRpXSA9ICR3b3JrZXhwX2Zyb21fZGF0ZVsxXTsKCQl9ZWxzZXsKCQkJJF9QT1NUWydzZWxmcm9tbW9uJy4kaV0gPSAkd29ya2V4cF9mcm9tX2RhdGVbMV07CgkJICAgICRfUE9TVFsnc2VsZnJvbXlyJy4kaV0gPSAkd29ya2V4cF9mcm9tX2RhdGVbMl07CgkJfQoJCQoJfWVsc2V7CgkJJF9QT1NUWydzZWxmcm9tZGF5Jy4kaV0gPSAkd29ya2V4cF9mcm9tX2RhdGVbMF07CgkJJF9QT1NUWydzZWxmcm9tbW9uJy4kaV0gPSAkd29ya2V4cF9mcm9tX2RhdGVbMV07CgkJJF9QT1NUWydzZWxmcm9teXInLiRpXSA9ICR3b3JrZXhwX2Zyb21fZGF0ZVsyXTsKCX0KCS8vcHJpbnRfcigkd29ya2V4cF9mcm9tX2RhdGUpOyBleGl0OwoJCgl9ZWxzZXsKCSRfUE9TVFsnc2VsZnJvbWRheScuJGldID0gJyc7CgkkX1BPU1RbJ3NlbGZyb21tb24nLiRpXSA9ICcnOwoJJF9QT1NUWydzZWxmcm9teXInLiRpXSA9ICcnOwkKCX0KCQoJCglpZihXT1JLX0RBVEVfRk9STUFUX01NWVk9PTEpewoJCWlmKCRfUE9TVFsnc2VsZnJvbW1vbicuJGldIT0nJyAmJiAkX1BPU1RbJ3NlbGZyb215cicuJGldIT0nJyl7CgkJCSRfUE9TVFsnc2VsZnJvbWRheScuJGldPScwMSc7CgkJfQoJCWlmKCRfUE9TVFsnc2VsdG9tb24nLiRpXSE9JycgJiYgJF9QT1NUWydzZWx0b3lyJy4kaV0hPScnKQoJCXsKCQkJJF9QT1NUWydzZWx0b2RheScuJGldPWRhdGUoInQiLCBzdHJ0b3RpbWUoJF9QT1NUWydzZWx0b3lyJy4kaV0uJy0nLiRfUE9TVFsnc2VsdG9tb24nLiRpXS4nLTAxJykpOwoJCX0KCX0KCQkJCQkJCQkKCSRzdGFydERhdGUgPSAkX1BPU1RbJ3NlbGZyb215cicuJGldLiItIi4kX1BPU1RbJ3NlbGZyb21tb24nLiRpXS4iLSIuJF9QT1NUWydzZWxmcm9tZGF5Jy4kaV07CgkkZW5kRGF0ZSA9ICRfUE9TVFsnc2VsdG95cicuJGldLiItIi4kX1BPU1RbJ3NlbHRvbW9uJy4kaV0uIi0iLiRfUE9TVFsnc2VsdG9kYXknLiRpXTsKCQoJaWYoJF9QT1NUWydzZWxmcm9teXInLiRpXSE9IiIgJiYgJF9QT1NUWydzZWxmcm9tbW9uJy4kaV0hPSIiICYmICRfUE9TVFsnc2VsZnJvbWRheScuJGldIT0iIiAmJiAkX1BPU1RbJ3NlbHRveXInLiRpXSE9IiIgJiYgJF9QT1NUWydzZWx0b21vbicuJGldIT0iIiAmJiAkX1BPU1RbJ3NlbHRvZGF5Jy4kaV0hPSIiKXsKCQkkRXhwU2VydmljZUxlbiA9IEdldF9EYXRlX0RpZmZlcmVuY2UoJHN0YXJ0RGF0ZSwkZW5kRGF0ZSwkY2FsY0Zvcm1hdEZuKTsJCgkJJCRzZXJ2aWNlbGVuZ3RoID0gJEV4cFNlcnZpY2VMZW47CgkJCgkJJEV4cFNlcnZpY2VMZW5BcnIgPSBleHBsb2RlKCIvIiwkRXhwU2VydmljZUxlbik7Ly9wcmludF9yKCRzdGFydERhdGUuIjxicj4iLiRlbmREYXRlLiI8YnI+Iik7CgkJJHRvdE1vbnRoWXIgKz0gKCRFeHBTZXJ2aWNlTGVuQXJyWzBdKjEyKSskRXhwU2VydmljZUxlbkFyclsxXTsKCQkkdG90RGF5c0NhbCArPSAkRXhwU2VydmljZUxlbkFyclsyXTsKCX0KCS8qVG90YWwgRXhwZXJpZW5jZSBDYWxjdWxhdGlvbiBFbmQqLwoJCgkvLyRlbXBfZ2VuX2NoZWNrID0gImVtcCIuJGkuIl9jaGVjayI7CgkvLyQkZW1wX2dlbl9jaGVjaz0gMDsKCWlmKCRfUE9TVFsidHh0ZW1wIi4kaV0hPSIiIHx8ICRfUE9TVFsidHh0ZGVzZyIuJGldIT0iIiB8fCAkX1BPU1RbInNlbGZyb21tb24iLiRpXSE9IiIgfHwgJF9QT1NUWyJzZWxmcm9teXIiLiRpXSE9IiIgfHwgJF9QT1NUWyJzZWx0b21vbiIuJGldIT0iIiB8fCAkX1BPU1RbInNlbHRveXIiLiRpXSE9IiIgfHwgJF9QT1NUWyJ0eHRzZXJ2aWNlIi4kaV0hPSIiIHx8ICRfUE9TVFsidHh0ZHV0eSIuJGldIT0iIiB8fCAkX1BPU1RbInR4dHJlYXNvbiIuJGldIT0iIiB8fCAkX1BPU1RbInR4dHNlcnZpY2V5ciIgLiAkaV0gIT0gIiIgfHwgJF9QT1NUWyJ0eHRzZXJ2aWNlbW4iIC4gJGldICE9ICIiIHx8ICRfUE9TVFsidHh0c2VydmljZWR5IiAuICRpXSAhPSAiIiB8fCAkX1BPU1RbInR4dGluZHR5cGUiIC4gJGldICE9ICIiIHx8IChXT1JLX0RBVEVfRk9STUFUX01NWVk9PTAgJiYgJF9QT1NUWyJzZWxmcm9tZGF5Ii4kaV0hPSIiKSB8fCAoV09SS19EQVRFX0ZPUk1BVF9NTVlZPT0wICYmICRfUE9TVFsic2VsdG9kYXkiLiRpXSE9IiIpKQoJey8vIENoZWNrIHRoZSBwb3N0IHZhbHVlIGFuZCBhc3NpZ24gdGhlIHZhcmlhYmxlIGZvciBmdXRoZXIgdmFsaWRhdGlvbgoJCSQkZW1wX2dlbl9jaGVjaz0xOwoJfQoJJGVycm1zZ19jb25mID0gJyc7CglpZigkJGVtcF9nZW5fY2hlY2sgPT0gMSkKCXsJCgkJaWYoSXNOdWxsT3JFbXB0eVN0cmluZ0ZpZWxkKCRfUE9TVFsicHJlc2VudF93b3JraW5nIl0pKXsKCQkJJGVycm1zZyAuPSAiUGxlYXNlIGNob29zZSAiLiRMQU5HWydlZHVfbGJsX3ByZXNlbnRfd29ya2luZyddOwoJCQkkZXJybXNnYXJyW10gPSJwcmVzZW50X3dvcmtpbmd8UGxlYXNlIGNob29zZSAiLiRMQU5HWydlZHVfbGJsX3ByZXNlbnRfd29ya2luZyddOwoJCX0KCQkKCQkvLyBOYW1lIG9mIHRoZSBlbXBsb3llZSB2YWxpZGF0aW9uIHN0YXJ0cyBoZXJlCgkJaWYoSXNOdWxsT3JFbXB0eVN0cmluZ0ZpZWxkKCRfUE9TVFsidHh0ZW1wIi4kaV0pKQoJCXsKCQkJJGVycm1zZ19jb25mLj0iTmFtZSBvZiB0aGUgRW1wbG95ZXIgJGkgY2Fubm90IGJlIGJsYW5rLCZuYnNwOyI7CgkJfS8qZWxzZSBpZighaXNJbnRBbHBoYVNwYWNlKCRfUE9TVFsidHh0ZW1wIi4kaV0pKXsKCQkJJGVycm1zZ19jb25mLj0iSW52YWxpZCBOYW1lIG9mIHRoZSBFbXBsb3llciAkaSwmbmJzcDsiOwoJCX0qLwoJCWVsc2UgaWYoc3RybGVuKCRfUE9TVFsidHh0ZW1wIi4kaV0pPjM1KQoJCXsgCgkJCSRlcnJtc2dfY29uZi49Ik5hbWUgb2YgdGhlIEVtcGxveWVyICRpIGNhbm5vdCBiZSBtb3JlIHRoYW4gMzUgY2hhcmFjdGVycywmbmJzcDsiOwoJCX0KCQlpZighaXNJbnRBbHBoYURvdFNwYWNlQW1wKCRfUE9TVFsndHh0ZW1wJy4kaV0pKQoJCXsKCQkJJGVycm1zZ19jb25mLj0iTmFtZSBvZiB0aGUgRW1wbG95ZXIgJGkgc2hvdWxkIGhhdmUgY2hhcmFjdGVycyBhbmQgSW50ZWdlciBvbmx5LCZuYnNwOyI7CgkJfQoJCS8vIE5hbWUgb2YgdGhlIGVtcGxveWVlIHZhbGlkYXRpb24gZW5kcyBoZXJlCgkJCgkJLy9EZXNpZ25hdGlvbiB2YWxpZGF0aW9uIHN0YXJ0cyBoZXJlCgkJaWYoSXNOdWxsT3JFbXB0eVN0cmluZ0ZpZWxkKCRfUE9TVFsidHh0ZGVzZyIuJGldKSkKCQl7CgkJCSRlcnJtc2dfY29uZi49IkRlc2lnbmF0aW9uICRpIGNhbm5vdCBiZSBibGFuaywmbmJzcDsiOwoJCX0gZWxzZSBpZighaXNJbnRBbHBoYURvdFNwYWNlQW1wKCRfUE9TVFsidHh0ZGVzZyIuJGldKSl7CgkJCSRlcnJtc2dfY29uZi49Ik9ubHkgY2hhcmFjdGVycyBhbmQgSW50ZWdlciBhcmUgYWxsb3dlZCBmb3IgRGVzaWduYXRpb24gJGksJm5ic3A7IjsKCQl9IGVsc2UgaWYoc3RybGVuKCRfUE9TVFsidHh0ZGVzZyIuJGldKT4yMCkKCQl7CgkJCSRlcnJtc2dfY29uZi49IkRlc2lnbmF0aW9uICRpIGNhbm5vdCBiZSBtb3JlIHRoYW4gMjAgY2hhcmFjdGVycywmbmJzcDsiOwoJCX0KCQlpZighaXNJbnRBbHBoYURvdFNwYWNlQW1wKCRfUE9TVFsndHh0ZGVzZycuJGldKSkKCQl7CgkJCSRlcnJtc2dfY29uZi49IkRlc2lnbmF0aW9uICRpIHNob3VsZCBoYXZlIGNoYXJhY3RlcnMgYW5kIEludGVnZXIgb25seSwmbmJzcDsiOwoJCX0KCQkvL0Rlc2lnbmF0aW9uIHZhbGlkYXRpb24gZW5kcyBoZXJlCgkJCgkJLy9Gcm9tIGFuZCB0byB5ZWFyIHZhbGlkYXRpb24gc3RhcnRzIGhlcmUKCQkvL2lmKEVYUF9EQVRFRk9STUFUX0RETU1ZWSA9PTEgKXsvL3ZhbGlkYXRlIHRoZSBmcm9tIGRheSBpZiBFWFBfREFURUZPUk1BVF9ERE1NWVkgaXMgMQoJCQlpZihJc051bGxPckVtcHR5U3RyaW5nRmllbGQoJF9QT1NUWyJzZWxmcm9tZGF5Ii4kaV0pKQoJCQl7CgkJCQkkZXJybXNnX2NvbmYuPSJFbXBsb3llciAkaSBGcm9tIERheSBjYW5ub3QgYmUgYmxhbmssJm5ic3A7IjsKCQkJfSBlbHNlIHsKCQkJCWlmKCFpc0ludEN1c3RvbSgkX1BPU1RbInNlbGZyb21kYXkiLiRpXSkpIHsJCQkKCQkJCQkkZXJybXNnX2NvbmYuPSJPbmx5IG51bWJlcnMgYXJlIGFsbG93ZWQgZm9yIEVtcGxveWVyICRpIEZyb20gRGF5ICwmbmJzcDsiOwoJCQkJfSAKCQkJfQoJCS8vfQkKCQkKCQlpZihJc051bGxPckVtcHR5U3RyaW5nRmllbGQoJF9QT1NUWyJzZWxmcm9tbW9uIi4kaV0pKSB7CgkJCSRlcnJtc2dfY29uZi49IkVtcGxveWVyICRpIEZyb20gTW9udGggY2Fubm90IGJlIGJsYW5rLCZuYnNwOyI7CgkJfSBlbHNlIHsKCQkJaWYoIWlzSW50Q3VzdG9tKCRfUE9TVFsic2VsZnJvbW1vbiIuJGldKSkgewkJCQoJCQkJJGVycm1zZ19jb25mLj0iT25seSBudW1iZXJzIGFyZSBhbGxvd2VkIGZvciBFbXBsb3llciAkaSBGcm9tIE1vbnRoICwmbmJzcDsiOwoJCQl9IAoJCX0KCQlpZihJc051bGxPckVtcHR5U3RyaW5nRmllbGQoJF9QT1NUWyJzZWxmcm9teXIiLiRpXSkpIHsKCQkJJGVycm1zZ19jb25mLj0iRW1wbG95ZXIgJGkgRnJvbSBZZWFyIGNhbm5vdCBiZSBibGFuaywmbmJzcDsiOwoJCX0gZWxzZSB7CgkJCWlmKCFpc0ludEN1c3RvbSgkX1BPU1RbInNlbGZyb215ciIuJGldKSkgewkJCQoJCQkJJGVycm1zZ19jb25mLj0iT25seSBudW1iZXJzIGFyZSBhbGxvd2VkIGZvciBFbXBsb3llciAkaSBGcm9tIFllYXIgLCZuYnNwOyI7CgkJCX0KCQl9CgkJLy9pZihFWFBfREFURUZPUk1BVF9ERE1NWVkgPT0xICl7Ly92YWxpZGF0ZSB0aGUgdG8gZGF5IGlmIEVYUF9EQVRFRk9STUFUX0RETU1ZWSBpcyAxCgkJCWlmKElzTnVsbE9yRW1wdHlTdHJpbmdGaWVsZCgkX1BPU1RbInNlbHRvZGF5Ii4kaV0pKSB7CgkJCQkkZXJybXNnX2NvbmYuPSJFbXBsb3llciAkaSBUbyBEYXkgY2Fubm90IGJlIGJsYW5rLCZuYnNwOyI7CgkJCX0gZWxzZSB7CgkJCQlpZighaXNJbnRDdXN0b20oJF9QT1NUWyJzZWx0b2RheSIuJGldKSkgewkJCQoJCQkJCSRlcnJtc2dfY29uZi49Ik9ubHkgbnVtYmVycyBhcmUgYWxsb3dlZCBmb3IgRW1wbG95ZXIgJGkgVG8gRGF5ICwmbmJzcDsiOwoJCQkJfQoJCQl9CgkJLy99CgkJaWYoSXNOdWxsT3JFbXB0eVN0cmluZ0ZpZWxkKCRfUE9TVFsic2VsdG9tb24iLiRpXSkpIHsKCQkJJGVycm1zZ19jb25mLj0iRW1wbG95ZXIgJGkgVG8gTW9udGggY2Fubm90IGJlIGJsYW5rLCZuYnNwOyI7CgkJfSBlbHNlIHsKCQkJaWYoIWlzSW50Q3VzdG9tKCRfUE9TVFsic2VsdG9tb24iLiRpXSkpIHsJCQkKCQkJCSRlcnJtc2dfY29uZi49Ik9ubHkgbnVtYmVycyBhcmUgYWxsb3dlZCBmb3IgRW1wbG95ZXIgJGkgVG8gTW9udGggLCZuYnNwOyI7CgkJCX0KCQl9CgkJaWYoSXNOdWxsT3JFbXB0eVN0cmluZ0ZpZWxkKCRfUE9TVFsic2VsdG95ciIuJGldKSkgewoJCQkkZXJybXNnX2NvbmYuPSJFbXBsb3llciAkaSBUbyBZZWFyIGNhbm5vdCBiZSBibGFuaywmbmJzcDsiOwoJCX0gZWxzZSB7CgkJCWlmKCFpc0ludEN1c3RvbSgkX1BPU1RbInNlbHRveXIiLiRpXSkpIHsJCQkKCQkJCSRlcnJtc2dfY29uZi49Ik9ubHkgbnVtYmVycyBhcmUgYWxsb3dlZCBmb3IgRW1wbG95ZXIgJGkgVG8gWWVhciAsJm5ic3A7IjsKCQkJfQoJCX0KCQkKCQkvL2lmKEVYUF9EQVRFRk9STUFUX0RETU1ZWSA9PTEgKXsvL3ZhbGlkYXRlIGRhdGVmb3JtYXQgaWYgRVhQX0RBVEVGT1JNQVRfRERNTVlZIGlzIDEKCQkJaWYoIWlzVmFsaWREYXRlKCRfUE9TVFsic2VsdG95ciIuJGldLiItIi4kX1BPU1RbInNlbHRvbW9uIi4kaV0uIi0iLiRfUE9TVFsic2VsdG9kYXkiLiRpXSkpIHsJCgkJCQkkZXJybXNnX2NvbmYuPSJJbnZhbGlkIFRvIGRhdGUgZm9yIEVtcGxveWVyICRpICwmbmJzcDsmbmJzcDsiOwoJCQl9CgkJCWlmKCFpc1ZhbGlkRGF0ZSgkX1BPU1RbInNlbGZyb215ciIuJGldLiItIi4kX1BPU1RbInNlbGZyb21tb24iLiRpXS4iLSIuJF9QT1NUWyJzZWxmcm9tZGF5Ii4kaV0pKSB7CQoJCQkJJGVycm1zZ19jb25mLj0iSW52YWxpZCBGcm9tIGRhdGUgZm9yIEVtcGxveWVyICRpICwmbmJzcDsmbmJzcDsiOwoJCQl9CgkJLy99CgkJaWYoaXNWYWxpZERhdGUoJF9QT1NUWyJzZWxmcm9teXIiLiRpXS4iLSIuJF9QT1NUWyJzZWxmcm9tbW9uIi4kaV0uIi0iLiRfUE9TVFsic2VsZnJvbWRheSIuJGldKSl7CgkJCWlmKCRfUE9TVFsic2VsZnJvbXlyIi4kaV0gPD0gJGRvYnllYXJjaGspewoJCQkJJGVycm1zZ19jb25mLj0iUGVyaW9kIG9mIHNlcnZpY2Ugc2hvdWxkIGJlIDEyIHllYXJzIGdyZWF0ZXIgdGhhbiBkYXRlIG9mIGJpcnRoIHllYXIsJm5ic3A7IjsKCQkJfQoJCX0KCQlpZihpc1ZhbGlkRGF0ZSgkX1BPU1RbInNlbHRveXIiLiRpXS4iLSIuJF9QT1NUWyJzZWx0b21vbiIuJGldLiItIi4kX1BPU1RbInNlbHRvZGF5Ii4kaV0pKXsKCQkJaWYoJF9QT1NUWyJzZWx0b3lyIi4kaV0gPD0gJGRvYnllYXJjaGspewoJCQkJJGVycm1zZ19jb25mLj0iUGVyaW9kIG9mIHNlcnZpY2Ugc2hvdWxkIGJlIDEyIHllYXJzIGdyZWF0ZXIgdGhhbiBkYXRlIG9mIGJpcnRoIHllYXIsJm5ic3A7IjsKCQkJfQoJCX0KCQlpZigoJF9QT1NUWyJzZWx0b21vbiIuJGldIT0nJyAmJiAkX1BPU1RbInNlbHRveXIiLiRpXSE9JycpIHx8ICgkX1BPU1RbInNlbGZyb21tb24iLiRpXSE9JycgJiYgJF9QT1NUWyJzZWxmcm9teXIiLiRpXSE9JycpKQoJCXsvLyBDaGVjayB3aXRoIEFTX09OX0RBVEUKCQkJaWYoV09SS19FWFBfQVNPTkRBVEVfQkFTRUQgPT0gMSAmJiBXT1JLX0RBVEVfRk9STUFUX01NWVk9PTApewoJCQkJaWYoc3RydG90aW1lKEVYUEVSSUVOQ0VfQVNfT05fWUVBUi4nLScuRVhQRVJJRU5DRV9BU19PTl9NT05USC4nLScuRVhQRVJJRU5DRV9BU19PTl9EQVkpID4gc3RydG90aW1lKGRhdGUoJ1ktbS1kJykpICYmICRfUE9TVFsicHJlc2VudF93b3JraW5nIl09PSJOIil7CgkJCQkJJEVYUEVSSUVOQ0VfQVNfT05fWUVBUiA9IGRhdGUoJ1knKTsKCQkJCQkkRVhQRVJJRU5DRV9BU19PTl9NT05USCA9IGRhdGUoJ20nKTsKCQkJCQkkRVhQRVJJRU5DRV9BU19PTl9EQVkgPSBkYXRlKCdkJyk7CgkJCQl9ZWxzZXsKCQkJCQkkRVhQRVJJRU5DRV9BU19PTl9ZRUFSID0gUFJFU0VOVEVNUF9BU19PTl9ZRUFSOwogICAgICAgICAgICAgICAgICAgICRFWFBFUklFTkNFX0FTX09OX01PTlRIID0gUFJFU0VOVEVNUF9BU19PTl9NT05USDsKICAgICAgICAgICAgICAgICAgICAkRVhQRVJJRU5DRV9BU19PTl9EQVkgPSBQUkVTRU5URU1QX0FTX09OX0RBWTsKCQkJCX0KCQkJCWlmKCRfUE9TVFsic2VsdG95ciIuJGldID4kRVhQRVJJRU5DRV9BU19PTl9ZRUFSIHx8ICRfUE9TVFsic2VsZnJvbXlyIi4kaV0+JEVYUEVSSUVOQ0VfQVNfT05fWUVBUil7CgkJCQkJJGVycm1zZ19jb25mLj0iUGVyaW9kIG9mIHNlcnZpY2Ugc2hvdWxkIGJlIGFzIG9uICIuJEVYUEVSSUVOQ0VfQVNfT05fREFZLiIuIi4kRVhQRVJJRU5DRV9BU19PTl9NT05USC4iLiIuJEVYUEVSSUVOQ0VfQVNfT05fWUVBUi4iICwmbmJzcDsiOwoJCQkJfWVsc2UgaWYoKCRfUE9TVFsic2VsdG9tb24iLiRpXT4kRVhQRVJJRU5DRV9BU19PTl9NT05USCAmJiAkX1BPU1RbInNlbHRveXIiLiRpXT09JEVYUEVSSUVOQ0VfQVNfT05fWUVBUikgfHwgKCRfUE9TVFsic2VsZnJvbW1vbiIuJGldPiRFWFBFUklFTkNFX0FTX09OX01PTlRIICYmICRfUE9TVFsic2VsZnJvbXlyIi4kaV09PSRFWFBFUklFTkNFX0FTX09OX1lFQVIpKQoJCQkJewoJCQkJCSRlcnJtc2dfY29uZi49IlBlcmlvZCBvZiBzZXJ2aWNlIHNob3VsZCBiZSBhcyBvbiAiLiRFWFBFUklFTkNFX0FTX09OX0RBWS4iLiIuJEVYUEVSSUVOQ0VfQVNfT05fTU9OVEguIi4iLiRFWFBFUklFTkNFX0FTX09OX1lFQVIuIiAsJm5ic3A7IjsKCQkJCX0gZWxzZXsKCQkJCQkvL2lmKEVYUF9EQVRFRk9STUFUX0RETU1ZWSkgewoJCQkJCQlpZigoJF9QT1NUWyJzZWx0b2RheSIuJGldPiRFWFBFUklFTkNFX0FTX09OX0RBWSAmJiAkX1BPU1RbInNlbHRvbW9uIi4kaV0gPT0gJEVYUEVSSUVOQ0VfQVNfT05fTU9OVEggJiYgJF9QT1NUWyJzZWx0b3lyIi4kaV09PSRFWFBFUklFTkNFX0FTX09OX1lFQVIpIHx8ICgkX1BPU1RbInNlbGZyb21kYXkiLiRpXT4kRVhQRVJJRU5DRV9BU19PTl9EQVkgJiYgJF9QT1NUWyJzZWxmcm9tbW9uIi4kaV0gPT0gJEVYUEVSSUVOQ0VfQVNfT05fTU9OVEggJiYgJF9QT1NUWyJzZWxmcm9teXIiLiRpXT09JEVYUEVSSUVOQ0VfQVNfT05fWUVBUikpIHsKCQkJCQkJCSRlcnJtc2dfY29uZi49IlBlcmlvZCBvZiBzZXJ2aWNlIHNob3VsZCBiZSBhcyBvbiAiLiRFWFBFUklFTkNFX0FTX09OX0RBWS4iLiIuJEVYUEVSSUVOQ0VfQVNfT05fTU9OVEguIi4iLiRFWFBFUklFTkNFX0FTX09OX1lFQVIuIiAsJm5ic3A7IjsKCQkJCQkJfQoJCQkJCS8vfQoJCQkJfQoJCQl9IGVsc2V7CgkJCQkkdXB0b0RhdGVfeXIgPSBkYXRlKCdZJyk7CgkJCQkkdXB0b0RhdGVfbW4gPSBkYXRlKCdtJyk7CgkJCQkkdXB0b0RhdGVfZGQgPSBkYXRlKCdkJyk7CgkJCQkvLyRzZWxfZGF0ZSA9ICRfUE9TVFsic2VsdG95ciIuJGldLiItIi4kX1BPU1RbInNlbGZyb21tb24iLiRpXS4iLTAxIjsKCQkJCWlmKCBXT1JLX0RBVEVfRk9STUFUX01NWVk9PTApewoJCQkJaWYoJF9QT1NUWyJzZWx0b3lyIi4kaV0gPiR1cHRvRGF0ZV95ciB8fCAkX1BPU1RbInNlbGZyb215ciIuJGldPiR1cHRvRGF0ZV95cil7CQkJCQkKCQkJCQkkZXJybXNnX2NvbmYuPSJQZXJpb2Qgb2Ygc2VydmljZSBTaG91bGQgbm90IGJlIGdyZWF0ZXIgdGhhbiBjdXJyZW50IGRhdGUgLCZuYnNwOyI7CgkJCQl9ZWxzZSBpZigoJF9QT1NUWyJzZWx0b21vbiIuJGldPiR1cHRvRGF0ZV9tbiAmJiAkX1BPU1RbInNlbHRveXIiLiRpXT09JHVwdG9EYXRlX3lyICkgfHwgKCRfUE9TVFsic2VsZnJvbW1vbiIuJGldPiR1cHRvRGF0ZV9tbiAmJiAkX1BPU1RbInNlbGZyb215ciIuJGldPT0kdXB0b0RhdGVfeXIgKSkKCQkJCXsJCQkJCgkJCQkJJGVycm1zZ19jb25mLj0iUGVyaW9kIG9mIHNlcnZpY2UgU2hvdWxkIG5vdCBiZSBncmVhdGVyIHRoYW4gY3VycmVudCBkYXRlICwmbmJzcDsiOwoJCQkJfWVsc2V7CgkJCQkJLy9pZihFWFBfREFURUZPUk1BVF9ERE1NWVkpewoJCQkJCQlpZigoJF9QT1NUWyJzZWx0b2RheSIuJGldPiR1cHRvRGF0ZV9kZCAmJiAkX1BPU1RbInNlbHRvbW9uIi4kaV0gPT0gJHVwdG9EYXRlX21uICYmICRfUE9TVFsic2VsdG95ciIuJGldPT0kdXB0b0RhdGVfeXIpIHx8ICgkX1BPU1RbInNlbGZyb21kYXkiLiRpXT4kdXB0b0RhdGVfZGQgJiYgJF9QT1NUWyJzZWxmcm9tbW9uIi4kaV0gPT0gJHVwdG9EYXRlX21uICYmICRfUE9TVFsic2VsZnJvbXlyIi4kaV09PSR1cHRvRGF0ZV95cikpIHsKCQkJCQkJCSRlcnJtc2dfY29uZi49IlBlcmlvZCBvZiBzZXJ2aWNlIFNob3VsZCBub3QgYmUgZ3JlYXRlciB0aGFuIGN1cnJlbnQgZGF0ZSAsJm5ic3A7IjsKCQkJCQkJfQoJCQkJCS8vfQkKCQkJCX0KCQkJCX0KCQkJfQoJCX0JCQoJCS8vIENoZWNrIHRoZSB3aXRoIHByZXZpb3VzIHNlbGVjdGVkIHllYXIgb2YgZW1wbG95ZWUKCQlpZigkaT4xKXsKCQkJLyogJHRtcHZhbCA9ICRpLTE7CgkJCWlmKCgkX1BPU1RbInNlbHRvbW9uIi4kaV0hPScnICYmICRfUE9TVFsic2VsdG95ciIuJGldIT0nJykgJiYgKCRfUE9TVFsic2VsZnJvbW1vbiIuJGldIT0nJyAmJiAkX1BPU1RbInNlbGZyb215ciIuJGldIT0nJykpewoJCQkJaWYoKCRfUE9TVFsic2VsZnJvbXlyIi4kdG1wdmFsXT09JF9QT1NUWyJzZWx0b3lyIi4kaV0pICYmICgkX1BPU1RbInNlbHRvbW9uIi4kaV0+JF9QT1NUWyJzZWxmcm9tbW9uIi4kdG1wdmFsXSkpCgkJCQl7CgkJCQkJJGVycm1zZ19jb25mLj0iZW1wbG95ZXIgJGkgcGVyaW9kIG8JZiBzZXJ2aWNlIHNob3VsZCBiZSBsZXNzIHRoYW4gZW1wbG95ZXIgJHRtcHZhbCAsJm5ic3A7IjsKCQkJCX0KCQkJfQkgKi8KCQkJJGV4cENoayA9IDE7IAoJCQl3aGlsZSgkZXhwQ2hrPCRpKXsKCQkJCWlmKCgkX1BPU1RbInNlbHRvbW9uIi4kaV0hPScnICYmICRfUE9TVFsic2VsdG95ciIuJGldIT0nJykgJiYgKCRfUE9TVFsic2VsZnJvbW1vbiIuJGldIT0nJyAmJiAkX1BPU1RbInNlbGZyb215ciIuJGldIT0nJykpewoJCQkJCWlmKCgkX1BPU1RbInNlbGZyb215ciIuJGV4cENoa109PSRfUE9TVFsic2VsdG95ciIuJGldKSAmJiAoJF9QT1NUWyJzZWx0b21vbiIuJGldPiRfUE9TVFsic2VsZnJvbW1vbiIuJGV4cENoa10pKXsKCQkJCQkJJGVycm1zZ19jb25mLj0iZW1wbG95ZXIgJGkgcGVyaW9kIG9mIHNlcnZpY2Ugc2hvdWxkIGJlIGxlc3MgdGhhbiBlbXBsb3llciAkZXhwQ2hrICwmbmJzcDsiOwoJCQkJCX1lbHNlIGlmKCgkX1BPU1RbInNlbGZyb215ciIuJGldID4gJF9QT1NUWyJzZWx0b3lyIi4kZXhwQ2hrXSkgfHwgKCRfUE9TVFsic2VsdG95ciIuJGldID4gJF9QT1NUWyJzZWx0b3lyIi4kZXhwQ2hrXSkgfHwgKCRfUE9TVFsic2VsdG95ciIuJGldID4gJF9QT1NUWyJzZWxmcm9teXIiLiRleHBDaGtdKSl7CgkJCQkJCSRlcnJtc2dfY29uZi49ImVtcGxveWVyICRpIHBlcmlvZCBvZiBzZXJ2aWNlIHNob3VsZCBiZSBsZXNzIHRoYW4gZW1wbG95ZXIgJGV4cENoayAsJm5ic3A7IjsKCQkJCQl9CgkJCQl9CgkJCQkvL2lmKEVYUF9EQVRFRk9STUFUX0RETU1ZWSA9PTEpewoJCQkJCWlmKCgkX1BPU1RbInNlbHRvZGF5Ii4kaV0hPScnICYmICRfUE9TVFsic2VsdG9tb24iLiRpXSE9JycgJiYgJF9QT1NUWyJzZWx0b3lyIi4kaV0hPScnKSAmJiAoJF9QT1NUWyJzZWxmcm9tZGF5Ii4kaV0hPScnICYmICRfUE9TVFsic2VsZnJvbW1vbiIuJGldIT0nJyAmJiAkX1BPU1RbInNlbGZyb215ciIuJGldIT0nJykpewoJCQkJCQlpZigoJF9QT1NUWyJzZWxmcm9teXIiLiRleHBDaGtdPT0kX1BPU1RbInNlbHRveXIiLiRpXSkgJiYgKCRfUE9TVFsic2VsdG9tb24iLiRpXSA9PSAkX1BPU1RbInNlbGZyb21tb24iLiRleHBDaGtdKSAmJiAoJF9QT1NUWyJzZWx0b2RheSIuJGldID49ICRfUE9TVFsic2VsZnJvbWRheSIuJGV4cENoa10pKXsKCQkJCQkJCSRlcnJtc2dfY29uZi49ImVtcGxveWVyICRpIHBlcmlvZCBvZiBzZXJ2aWNlIHNob3VsZCBiZSBsZXNzIHRoYW4gZW1wbG95ZXIgJGV4cENoayAsJm5ic3A7IjsKCQkJCQkJfQoJCQkJCX0KCQkJCS8vfQoJCQkJJGV4cENoaysrOwoJCQl9CgkJfQoJCQoJCWlmKCRfUE9TVFsic2VsZnJvbXlyIi4kaV0gPCAkZWR1eWVhcikgewoJCQkkZXJybXNnX2NvbmYuPSJFbXBsb3llciAkaSBGcm9tIFllYXIgc2hvdWxkIG5vdCBiZSBsZXNzIHRoYW4gJGV4cF9tc2dfY29udGVudCwmbmJzcDsmbmJzcDsiOwoJCX0KCQlpZihQT1NUX1FVQUxJRklDQVRJT05fRVhQKXsKCQkJaWYoJF9QT1NUWyJzZWxmcm9teXIiLiRpXSA9PSAkZWR1eWVhciAmJiAkX1BPU1RbInNlbGZyb21tb24iLiRpXSA8ICRlZHVtb250aCl7CgkJCQkkZXJybXNnX2NvbmYuPSJFbXBsb3llciAkaSBGcm9tIE1vbnRoIHNob3VsZCBub3QgYmUgbGVzcyB0aGFuICRleHBfbXNnX2NvbnRlbnQsJm5ic3A7Jm5ic3A7IjsKCQkJfWVsc2UgaWYoJF9QT1NUWyJzZWxmcm9teXIiLiRpXSA9PSAkZWR1eWVhciAmJiAkX1BPU1RbInNlbGZyb21tb24iLiRpXSA9PSAkZWR1bW9udGggJiYgJF9QT1NUWyJzZWxmcm9tZGF5Ii4kaV0gPD0gJGVkdWRheSl7CgkJCQkkZXJybXNnX2NvbmYuPSJFbXBsb3llciAkaSBGcm9tIGRheSBzaG91bGQgYmUgZ3JlYXRlciB0aGFuICRleHBfbXNnX2NvbnRlbnQsJm5ic3A7Jm5ic3A7IjsKCQkJfQoJCX0KCQlpZigkX1BPU1RbInNlbHRveXIiLiRpXSA8ICRlZHV5ZWFyKSB7CgkJCSRlcnJtc2dfY29uZi49IkVtcGxveWVyICRpIFRvIFllYXIgc2hvdWxkIG5vdCBiZSBsZXNzIHRoYW4gJGV4cF9tc2dfY29udGVudCwmbmJzcDsmbmJzcDsiOwoJCX0KCQlpZihQT1NUX1FVQUxJRklDQVRJT05fRVhQKSB7CgkJCWlmKCRfUE9TVFsic2VsdG95ciIuJGldID09ICRlZHV5ZWFyICYmICRfUE9TVFsic2VsdG9tb24iLiRpXSA8ICRlZHVtb250aCl7CgkJCQkkZXJybXNnX2NvbmYuPSJFbXBsb3llciAkaSBUbyBNb250aCBzaG91bGQgbm90IGJlIGxlc3MgdGhhbiAkZXhwX21zZ19jb250ZW50LCZuYnNwOyZuYnNwOyI7CgkJCX1lbHNlIGlmKCRfUE9TVFsic2VsdG95ciIuJGldID09ICRlZHV5ZWFyICYmICRfUE9TVFsic2VsdG9tb24iLiRpXSA9PSAkZWR1bW9udGggJiYgJF9QT1NUWyJzZWx0b2RheSIuJGldIDw9ICRlZHVkYXkpewoJCQkJJGVycm1zZ19jb25mLj0iRW1wbG95ZXIgJGkgVG8gRGF5IHNob3VsZCBub3QgYmUgbGVzcyB0aGFuICRleHBfbXNnX2NvbnRlbnQsJm5ic3A7Jm5ic3A7IjsKCQkJfSAgCQoJCX0KCQlpZigkX1BPU1RbInNlbGZyb215ciIuJGldID4gJF9QT1NUWyJzZWx0b3lyIi4kaV0pewoJCQkkZXJybXNnX2NvbmYuPSJFbXBsb3llciAkaSBGcm9tIFllYXIgc2hvdWxkIGJlIGxlc3MgdGhhbiBFbXBsb3llciAkaSBUbyBZZWFyLCZuYnNwOyZuYnNwOyI7CgkJfQoJCQoJCWlmKCgkX1BPU1RbInNlbGZyb215ciIuJGldID09ICRfUE9TVFsic2VsdG95ciIuJGldKSAmJiAoJF9QT1NUWyJzZWxmcm9tbW9uIi4kaV0gPiAkX1BPU1RbInNlbHRvbW9uIi4kaV0pKXsKCQkJJGVycm1zZ19jb25mLj0iRW1wbG95ZXIgJGkgRnJvbSBNb250aCBzaG91bGQgYmUgbGVzcyB0aGFuIEVtcGxveWVyICRpIFRvIE1vbnRoLCZuYnNwOyZuYnNwOyI7CgkJfQoJCWlmKCgkX1BPU1RbInNlbGZyb215ciIuJGldID09ICRfUE9TVFsic2VsdG95ciIuJGldKSAmJiAoJF9QT1NUWyJzZWxmcm9tbW9uIi4kaV0gPT0gJF9QT1NUWyJzZWx0b21vbiIuJGldKSAmJiAoJF9QT1NUWyJzZWxmcm9tZGF5Ii4kaV0gPj0gJF9QT1NUWyJzZWx0b2RheSIuJGldKSl7CgkJCSRlcnJtc2dfY29uZi49IkVtcGxveWVyICRpIEZyb20gRGF5IHNob3VsZCBiZSBsZXNzIHRoYW4gRW1wbG95ZXIgJGkgVG8gRGF5LCZuYnNwOyZuYnNwOyI7CgkJfQoJCS8vRnJvbSBhbmQgdG8geWVhciB2YWxpZGF0aW9uIGVuZHMgaGVyZQoJCSR0eHRTZXIgPSAkX1BPU1RbInR4dHNlcnZpY2V5ciIgLiAkaV0gLiAiLyIgLiAkX1BPU1RbInR4dHNlcnZpY2VtbiIgLiAkaV0gLiAiLyIgLiAkX1BPU1RbInR4dHNlcnZpY2VkeSIgLiAkaV07CgkJLy95ZWFyIG9mIHNlcnZpY2UgdmFsaWRhdGlvbiBzdGFydHMgaGVyZSAKCQlpZihJc051bGxPckVtcHR5U3RyaW5nRmllbGQoJHR4dFNlcikpIHsKCQkJJGVycm1zZ19jb25mLj0iVG90YWwgUGVyaW9kIG9mIFdvcmsgRXhwZXJpZW5jZSAkaSBjYW5ub3QgYmUgYmxhbmssJm5ic3A7IjsKCQl9CgkJZWxzZSB7CgkJCWlmKFdPUktFWFBfU0VSVklDRV9JTl9NT05USCA9PSAxKXsKCQkJCWlmKCFpc0ludEN1c3RvbSgkX1BPU1RbInR4dHNlcnZpY2UiLiRpXSkpIHsKCQkJCQkkZXJybXNnX2NvbmYuPSJPbmx5IG51bWJlcnMgYXJlIGFsbG93ZWQgZm9yIEVtcGxveWVyICRpIFNlcnZpY2UgbGVuZ3RoICwmbmJzcDsiOwoJCQkJfQoJCQkgICAgaWYoIHN0cmxlbigkX1BPU1RbInR4dHNlcnZpY2UiLiRpXSkgPiAzICkgewoJCQkJCSRlcnJtc2dfY29uZi49IlRvdGFsIFBlcmlvZCBvZiBXb3JrIEV4cGVyaWVuY2UgJGkgIHllYXJzIGNhbm5vdCBiZSBncmVhdGVyIHRoYW4gMiwmbmJzcDsiOwoJCQkJfQoJCQkJaWYoJF9QT1NUWyJ0eHRzZXJ2aWNlIi4kaV0gPT0gMCB8fCAkX1BPU1RbInR4dHNlcnZpY2UiLiRpXSA9PSAwMCB8fCAkX1BPU1RbInR4dHNlcnZpY2UiLiRpXSA9PSAwMDApIHsKCQkJCQkkZXJybXNnX2NvbmYuPSJUb3RhbCBQZXJpb2Qgb2YgV29yayBFeHBlcmllbmNlICRpICB5ZWFycyBjYW5ub3QgYmUgemVybywmbmJzcDsiOwoJCQkJfQoJCQl9ZWxzZXsKCQkJCS8vY2hlY2tpbmcgd2hldGVyIHNlcnZpY2VsZW5ndGggaGF2aW5nICIvIgoJCQkJLyogaWYoc3Ryc3RyKCRfUE9TVFsidHh0c2VydmljZSIuJGldLCIvIik9PSIiKSB7CgkJCQkJJGVycm1zZ19jb25mLj0iVG90YWwgUGVyaW9kIG9mIFdvcmsgRXhwZXJpZW5jZSAkaSBzaG91bGQgaGF2ZSAvIGluIGJldHdlZW4gbW9udGhzIGFuZCB5ZWFycywmbmJzcDsiOwoJCQkJfSAqLwoJCQkJLy9FeHBsb2RpbmcgdGhlIHNlcnZpY2UgbGVuZ3RoIGFuZCBjaGVja2luZyB3aGV0aGVyIGl0IGhhcyBudW1iZXIgb3Igbm90CgkJCQkvLyR0eHRzZXJ2aWNlX2FycmF5ID0gZXhwbG9kZSgiLyIsICRfUE9TVFsidHh0c2VydmljZSIuJGldKTsKCQkJCSAkdHh0c2VydmljZV9hcnJheSA9IGV4cGxvZGUoIi8iLCAkdHh0U2VyKTsKCQkJCWlmKCghaXNJbnRDdXN0b20oJHR4dHNlcnZpY2VfYXJyYXlbMF0pKSB8fCAoIWlzSW50Q3VzdG9tKCR0eHRzZXJ2aWNlX2FycmF5WzFdKSkpIHsKCQkJCQkkZXJybXNnX2NvbmYuPSJPbmx5IG51bWJlcnMgYXJlIGFsbG93ZWQgZm9yIEVtcGxveWVyICRpIFNlcnZpY2UgbGVuZ3RoICwmbmJzcDsiOwoJCQkJfQoJCQkJaWYoIHN0cmxlbigkdHh0c2VydmljZV9hcnJheVswXSkgPiAyICkgewoJCQkJCSRlcnJtc2dfY29uZi49IlRvdGFsIFBlcmlvZCBvZiBXb3JrIEV4cGVyaWVuY2UgJGkgbW9udGhzIGNhbm5vdCBiZSBncmVhdGVyIHRoYW4gMiwmbmJzcDsiOwoJCQkJfQoJCQkJLyppZighaXNJbnRDdXN0b20oJHR4dHNlcnZpY2VfYXJyYXlbMV0pKSB7CgkJCQkJJGVycm1zZ19jb25mLj0iT25seSBudW1iZXJzIGFyZSBhbGxvd2VkIGZvciBFbXBsb3llciAkaSBTZXJ2aWNlIGxlbmd0aCAsJm5ic3A7IjsKCQkJCX0qLwoJCQkJaWYoIHN0cmxlbigkdHh0c2VydmljZV9hcnJheVsxXSkgPiAyICkgewoJCQkJCSRlcnJtc2dfY29uZi49IlRvdGFsIFBlcmlvZCBvZiBXb3JrIEV4cGVyaWVuY2UgJGkgIHllYXJzIGNhbm5vdCBiZSBncmVhdGVyIHRoYW4gMiwmbmJzcDsiOwoJCQkJfQoJCQkJaWYoV09SS19EQVRFX0ZPUk1BVF9NTVlZID09IDApewoJCQkJCWlmKCR0eHRzZXJ2aWNlX2FycmF5WzBdID09IDAgJiYgJHR4dHNlcnZpY2VfYXJyYXlbMV0gPT0gMCAmJiAkdHh0c2VydmljZV9hcnJheVsyXSA9PSAwKSB7CgkJCQkJCSRlcnJtc2dfY29uZi49IlRvdGFsIFBlcmlvZCBvZiBXb3JrIEV4cGVyaWVuY2UgJGkgIHllYXJzIGNhbm5vdCBiZSAwLzAvMCwmbmJzcDsiOwoJCQkJCX0JCgkJCQl9ZWxzZXsKCQkJCQlpZigkdHh0c2VydmljZV9hcnJheVswXSA9PSAwICYmICR0eHRzZXJ2aWNlX2FycmF5WzFdID09IDApIHsKCQkJCQkJJGVycm1zZ19jb25mLj0iVG90YWwgUGVyaW9kIG9mIFdvcmsgRXhwZXJpZW5jZSAkaSAgeWVhcnMgY2Fubm90IGJlIDAvMCwmbmJzcDsiOwoJCQkJCX0JCgkJCQl9CgkJCQkKCQkJfQoJCX0KCQkvL3llYXIgb2Ygc2VydmljZSB2YWxpZGF0aW9uIGVuZHMgaGVyZSAKCQkKCQkvL2R1dHkgdmFsaWRhdGlvbiBzdGFydHMgaGVyZQoJCWlmKElzTnVsbE9yRW1wdHlTdHJpbmdGaWVsZCgkX1BPU1RbInR4dGR1dHkiLiRpXSkpIHsKCQkJJGVycm1zZ19jb25mLj0iTmF0dXJlIG9mIER1dGllcyAkaSBjYW5ub3QgYmUgYmxhbmssJm5ic3A7IjsKCQl9IGVsc2UgaWYoc3RybGVuKCRfUE9TVFsidHh0ZHV0eSIuJGldKT4zNSkgewoJCQkkZXJybXNnX2NvbmYuPSJOYXR1cmUgb2YgRHV0aWVzICRpIGNhbm5vdCBiZSBtb3JlIHRoYW4gMzUgY2hhcmFjdGVycywmbmJzcDsiOwoJCX0KCQlpZighaXNJbnRBbHBoYURvdFNwYWNlQW1wKCRfUE9TVFsndHh0ZHV0eScuJGldKSkgewoJCQkkZXJybXNnX2NvbmYuPSJOYXR1cmUgb2YgRHV0aWVzICRpIHNob3VsZCBoYXZlIGNoYXJhY3RlcnMgYW5kIEludGVnZXIgb25seSwmbmJzcDsiOwoJCX0KCQkvL2R1dHkgdmFsaWRhdGlvbiBlbmRzIGhlcmUKCQkKCQkvL3JlYXNvbiB2YWxpZGF0aW9uIHN0YXJ0cyBoZXJlCiAgICAgICAgICAgICAgICBpZighJHByZXNlbnRFbXBsb3llcil7CiAgICAgICAgICAgICAgICAgICAgaWYoSXNOdWxsT3JFbXB0eVN0cmluZ0ZpZWxkKCRfUE9TVFsidHh0cmVhc29uIi4kaV0pKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZXJybXNnX2NvbmYuPSIgUmVhc29uIG9mIGxlYXZpbmcgJGkgY2Fubm90IGJlIGJsYW5rLCZuYnNwOyI7CiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKHN0cmxlbigkX1BPU1RbInR4dHJlYXNvbiIuJGldKT4zNSkgewogICAgICAgICAgICAgICAgICAgICAgICAgICAgJGVycm1zZ19jb25mLj0iIFJlYXNvbiBvZiBsZWF2aW5nICRpIGNhbm5vdCBiZSBtb3JlIHRoYW4gMzUgY2hhcmFjdGVycywmbmJzcDsiOwogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICBpZighaXNJbnRBbHBoYURvdFNwYWNlQW1wKCRfUE9TVFsndHh0cmVhc29uJy4kaV0pKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZXJybXNnX2NvbmYuPSIgUmVhc29uIG9mIGxlYXZpbmcgJGkgc2hvdWxkIGhhdmUgY2hhcmFjdGVycyBhbmQgSW50ZWdlciBvbmx5LCZuYnNwOyI7CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgfQoJCS8vcmVhc29uIHZhbGlkYXRpb24gZW5kcyBoZXJlCgkJCgkJLy90eHRpbmR0eXBlIHZhbGlkYXRpb24gc3RhcnRzIGhlcmUgCgkJLyogaWYoSXNOdWxsT3JFbXB0eVN0cmluZ0ZpZWxkKCRfUE9TVFsidHh0aW5kdHlwZSIuJGldKSkgewoJCQkkZXJybXNnX2NvbmYuPSJJbmR1c3RyeSBUeXBlICRpIGNhbm5vdCBiZSBibGFuaywmbmJzcDsiOwoJCX0gZWxzZSBpZihzdHJsZW4oJF9QT1NUWyJ0eHRpbmR0eXBlIi4kaV0pPjM1KSB7CgkJCSRlcnJtc2dfY29uZi49IkluZHVzdHJ5IFR5cGUgJGkgY2Fubm90IGJlIG1vcmUgdGhhbiAzNSBjaGFyYWN0ZXJzLCZuYnNwOyI7CgkJfQoJCWlmKCFpc0ludEFscGhhRG90U3BhY2VBbXAoJF9QT1NUWyd0eHRpbmR0eXBlJy4kaV0pKSB7CgkJCSRlcnJtc2dfY29uZi49IkluZHVzdHJ5IFR5cGUgJGkgc2hvdWxkIGhhdmUgY2hhcmFjdGVycyBhbmQgSW50ZWdlciBvbmx5LCZuYnNwOyI7CgkJfSAgKi8KCQkvL3R4dGluZHR5cGUgdmFsaWRhdGlvbiBlbmQgaGVyZQoJCWlmKCRlcnJtc2dfY29uZiE9IiIpewoJCQkkZmluYWxzdWJtaXQ9Ik4iOwoJCQkkZXJybXNnIC49JGVycm1zZ19jb25mOwoJCQkkZXJybXNnYXJyW109J3cnLiRpLid8Jy4kZXJybXNnX2NvbmY7CgkJfWVsc2V7CgkJCSRlcnJtc2dhcnJbXT0ndycuJGkuJ3wnOwkKCQl9Cgl9ZWxzZXsKCQkkZXJybXNnYXJyW109J3cnLiRpLid8JzsKCX0KfS8vIGZvciBsb29wIGVuZHMgaGVyZQovKlRvdGFsIEV4cGVyaWVuY2UgQ2FsY3VsYXRpb24gLSBUb3RhbCBTdGFydCovCmlmKCR0b3REYXlzQ2FsIT0iMCIgJiYgV09SS0VYUF9TRVJWSUNFX0lOX01PTlRIICE9IDEpewoJJHRvdERheXMgPSBmbG9vcigkdG90RGF5c0NhbC8zMCk7Cn0KJHRvdGV4cCA9ICR0b3REYXlzKyR0b3RNb250aFlyOwovKlRvdGFsIEV4cGVyaWVuY2UgQ2FsY3VsYXRpb24gLSBUb3RhbCBFbmQqLwoKaWYoJGVtcDFfY2hlY2s9PTEgfHwgJGVtcDJfY2hlY2s9PTEgfHwgJGVtcDNfY2hlY2s9PTEgfHwgJGVtcDRfY2hlY2s9PTEgfHwgJGVtcDVfY2hlY2s9PTEgfHwgJGVtcDZfY2hlY2s9PTEgfHwgJGVtcDdfY2hlY2s9PTEgKSB7CglpZih0cmltKCRfUE9TVFsndG90ZXhwJ10pID09ICcnKXsKCQkkZmluYWxzdWJtaXQ9Ik4iOwoJCSRlcnJtc2cuPSJUb3RhbCBFeHBlcmllbmNlIGluIG1vbnRocyBzaG91bGQgbm90IGJlIEVtcHR5LCZuYnNwOyI7CgkJJGVycm1zZ2FycltdPSd0b3RleHB8VG90YWwgRXhwZXJpZW5jZSBpbiBtb250aHMgc2hvdWxkIG5vdCBiZSBFbXB0eSc7Cgl9ZWxzZSBpZigkX1BPU1RbInRvdGV4cCJdPT0nMCcgfHwgJF9QT1NUWyJ0b3RleHAiXT09JzAwJyB8fCAkX1BPU1RbInRvdGV4cCJdPT0nMDAwJyl7CgkJJGZpbmFsc3VibWl0PSJOIjsKCQkkZXJybXNnLj0iVG90YWwgRXhwZXJpZW5jZSBpbiBtb250aHMgc2hvdWxkIG5vdCBiZSB6ZXJvKHMpLCZuYnNwOyI7CgkJJGVycm1zZ2FycltdPSd0b3RleHB8VG90YWwgRXhwZXJpZW5jZSBpbiBtb250aHMgc2hvdWxkIG5vdCBiZSB6ZXJvKHMpJzsKCX1lbHNlIGlmKCFJc051bGxPckVtcHR5U3RyaW5nRmllbGQoJF9QT1NUWyJ0b3RleHAiXSkpewoJCWlmKCRfUE9TVFsidG90ZXhwIl09PScwJyB8fCAkX1BPU1RbInRvdGV4cCJdPT0nMDAnIHx8ICRfUE9TVFsidG90ZXhwIl09PScwMDAnKXsKCQkJJGZpbmFsc3VibWl0PSJOIjsKCQkJJGVycm1zZy49IlRvdGFsIEV4cGVyaWVuY2UgaW4gbW9udGhzIHNob3VsZCBub3QgYmUgWmVybywmbmJzcDsiOwoJCQkkZXJybXNnYXJyW109J3RvdGV4cHxUb3RhbCBFeHBlcmllbmNlIGluIG1vbnRocyBzaG91bGQgbm90IGJlIFplcm8nOwoJCX1lbHNlIGlmKCFpc0ludEN1c3RvbSgkX1BPU1RbInRvdGV4cCJdKSl7CgkJCSRmaW5hbHN1Ym1pdD0iTiI7CgkJCSRlcnJtc2cuPSJPbmx5IG51bWJlcnMgYXJlIGFsbG93ZWQgZm9yIHRvdGFsIGV4cGVyaWVuY2UoaW4gbW9udGhzKTxici8+IjsKCQkJJGVycm1zZ2FycltdPSd0b3RleHB8T25seSBudW1iZXJzIGFyZSBhbGxvd2VkIGZvciB0b3RhbCBleHBlcmllbmNlKGluIG1vbnRocyknOwoJCX1lbHNlIGlmKHN0cmxlbigkX1BPU1RbInRvdGV4cCJdKT4zKXsKCQkJJGZpbmFsc3VibWl0PSJOIjsKCQkJJGVycm1zZy49Ik9ubHkgdGhyZWUgY2hhcmFjdGVycyBhcmUgYWxsb3dlZCBmb3IgdG90YWwgZXhwZXJpZW5jZShpbiBtb250aHMpPGJyLz4iOwoJCQkkZXJybXNnYXJyW109InRvdGV4cHxPbmx5IHRocmVlIGNoYXJhY3RlcnMgYXJlIGFsbG93ZWQgZm9yIHRvdGFsIGV4cGVyaWVuY2UoaW4gbW9udGhzKSZuYnNwOyI7CgkJfWVsc2UgaWYoJHRvdGV4cCAhPSAkX1BPU1RbJ3RvdGV4cCddKXsKCQkJJGZpbmFsc3VibWl0PSJOIjsKCQkJJGVycm1zZy49IkNhbGN1bGF0ZWQgVG90YWwgUGVyaW9kIG9mIHNlcnZpY2UgaXMgbWlzbWF0Y2hlZCB3aXRoIHRvdGFsIGV4cGVyaWVuY2UoaW4gbW9udGhzKTxici8+IjsKCQkJJGVycm1zZ2FycltdPSJ0b3RleHB8Q2FsY3VsYXRlZCBUb3RhbCBQZXJpb2Qgb2Ygc2VydmljZSBpcyBtaXNtYXRjaGVkIHdpdGggdG90YWwgZXhwZXJpZW5jZShpbiBtb250aHMpJm5ic3A7IjsKCQl9ZWxzZSB7CgkJCSRlcnJtc2dhcnJbXT0ndG90ZXhwfCc7CgkJfQoJfSBlbHNlIHsKCQkkZXJybXNnYXJyW109J3RvdGV4cHwnOwoJfQp9ZWxzZSB7IAoJaWYoIShJc051bGxPckVtcHR5U3RyaW5nRmllbGQoJF9QT1NUWyJ0b3RleHAiXSkpKXsKCQkkZmluYWxzdWJtaXQ9Ik4iOwoJCSRlcnJtc2cuPSJQbGVhc2UgZW50ZXIgYXRsZWFzdCBvbmUgZXhwZXJpZW5jZSBkZXRhaWwsJm5ic3A7IjsKCQkkZXJybXNnYXJyW109J3RvdGV4cHxQbGVhc2UgZW50ZXIgYXRsZWFzdCBvbmUgZXhwZXJpZW5jZSBkZXRhaWwnOwoJCQoJfWVsc2UgaWYoJF9QT1NUWyJ0b3RleHAiXT09JzAnIHx8ICRfUE9TVFsidG90ZXhwIl09PScwMCcgfHwgJF9QT1NUWyJ0b3RleHAiXT09JzAwMCcpewoJCSRmaW5hbHN1Ym1pdD0iTiI7CgkJJGVycm1zZy49IlRvdGFsIGV4cGVyaWVuY2UoaW4gbW9udGhzKSBjYW4gbm90IGJlIHplcm8iOwoJCSRlcnJtc2dhcnJbXT0ndG90ZXhwfFRvdGFsIGV4cGVyaWVuY2UoaW4gbW9udGhzKSBjYW4gbm90IGJlIHplcm8nOwkJCQoJfWVsc2UgaWYoIWlzSW50Q3VzdG9tKCRfUE9TVFsidG90ZXhwIl0pICYmICRfUE9TVFsidG90ZXhwIl0hPScnKXsKCQkkZmluYWxzdWJtaXQ9Ik4iOwoJCSRlcnJtc2cuPSJPbmx5IG51bWJlcnMgYXJlIGFsbG93ZWQgZm9yIHRvdGFsIGV4cGVyaWVuY2UoaW4gbW9udGhzKTxici8+IjsKCQkkZXJybXNnYXJyW109J3RvdGV4cHxPbmx5IG51bWJlcnMgYXJlIGFsbG93ZWQgZm9yIHRvdGFsIGV4cGVyaWVuY2UoaW4gbW9udGhzKSc7Cgl9ZWxzZSBpZigoJF9QT1NUWyJ0b3RleHAiXSE9JycpICYmICghaXNJbnRDdXN0b20oJF9QT1NUWyJ0b3RleHAiXSkpKXsKCQkkZmluYWxzdWJtaXQ9Ik4iOwoJCQkkZXJybXNnLj0iT25seSBudW1iZXJzIGFyZSBhbGxvd2VkIGZvciBUaGUgdG90YWwgZXhwZXJpZW5jZShpbiBtb250aHMpLCZuYnNwOyI7CgkJCSRlcnJtc2dhcnJbXT0ndG90ZXhwfE9ubHkgbnVtYmVycyBhcmUgYWxsb3dlZCBmb3IgVGhlIHRvdGFsIGV4cGVyaWVuY2UoaW4gbW9udGhzKSc7Cgl9ZWxzZSBpZihzdHJsZW4oJF9QT1NUWyJ0b3RleHAiXSk+Myl7CgkJCSRmaW5hbHN1Ym1pdD0iTiI7CgkJCSRlcnJtc2cuPSJPbmx5IHRocmVlIGNoYXJhY3RlcnMgYXJlIGFsbG93ZWQgZm9yIHRvdGFsIGV4cGVyaWVuY2UoaW4gbW9udGhzKTxici8+IjsKCQkJJGVycm1zZ2FycltdPSJ0b3RleHB8T25seSB0aHJlZSBjaGFyYWN0ZXJzIGFyZSBhbGxvd2VkIGZvciB0b3RhbCBleHBlcmllbmNlKGluIG1vbnRocykmbmJzcDsiOwoJfWVsc2V7CgkJJGVycm1zZ2FycltdPSd0b3RleHB8JzsKCX0gCn0KPz4=');

// Unique edu field indices in an OR group's edu conditions (ascending).
function eduIdxsOf(conds){
  var seen={},out=[];
  for(var i=0;i<conds.length;i++){
    if(conds[i].type!=='edu') continue;
    var def=EDU[conds[i].level];
    if(def&&!seen[def.idx]){seen[def.idx]=true;out.push(def.idx);}
  }
  return out.sort(function(a,b){return a-b;});
}
// Reverse lookup: timestamp variable -> EDU idx (used to order declarations).
function tsIdxOf(v){for(var k in POSTQUAL_TS) if(POSTQUAL_TS[k].v===v) return +k; return 99;}

// Reduce a set of edu indices to the timestamps that must be compared:
//   highest academic qualification (if present) + every special qualification.
// Lower academics are dropped once a higher one exists; PG / PG Diploma share rank 4.
function qualTimestamps(idxs){
  var acadIdx=null, acadRank=-1, specials=[];
  for(var i=0;i<idxs.length;i++){
    var info=POSTQUAL_TS[idxs[i]];
    if(!info) continue;                       // 'Others' etc. — no qualification date
    if(info.acad>0){ if(info.acad>acadRank){acadRank=info.acad; acadIdx=idxs[i];} }
    else specials.push(idxs[i]);
  }
  var list=[];
  if(acadIdx!==null) list.push(POSTQUAL_TS[acadIdx].v);     // base = highest academic
  specials.sort(function(a,b){return a-b;});
  for(var i=0;i<specials.length;i++) list.push(POSTQUAL_TS[specials[i]].v);
  return list;
}


// Emit the qualification-date selection for one eligibility condition block.
function genQualSel(idxs,d){
  var ts=qualTimestamps(idxs);
  if(!ts.length) return '';
  if(ts.length===1)                                          // single relevant qualification
    return ind(d)+'$eligibilityPostQualidtArr[]  = '+ts[0]+';\n';
  // 2+ timestamps -> deterministically pick the latest date.
  var o=ind(d)+'$eligibility_postquali_date2 = '+ts[0]+';\n';
  for(var i=1;i<ts.length;i++){
    // exactly 2 -> compare special vs academic; 3+ -> accumulate running max.
    var rhs=(ts.length===2)?ts[0]:'$eligibility_postquali_date2';
    o+=ind(d)+'if('+ts[i]+' > '+rhs+'){\n';
    o+=ind(d+1)+'$eligibility_postquali_date2 = '+ts[i]+';\n';
    o+=ind(d)+'}\n';
  }
  o+=ind(d)+'$eligibilityPostQualidtArr[]  = $eligibility_postquali_date2;\n';
  return o;
}

function genWorkExpDetails(posts){
  var sd=getStreamData(posts); annotateCondNames(posts,sd);
  var single=posts.length===1;

  // Only posts whose Work-Experience requirement is "Post Qualification" participate.
  var parts=posts.filter(function(p){return p.postQuali;})
                 .sort(function(a,b){return +a.postcode - +b.postcode;});
  if(!parts.length) return '';

  var neededTs={};   // tsVar -> idx (for ordered strtotime declarations)
  var blocks='', anyBlock=false;

  var pc;  // current postcode (for buildCondLine)
  function record(idxs){var ts=qualTimestamps(idxs);for(var t=0;t<ts.length;t++)neededTs[ts[t]]=tsIdxOf(ts[t]);}

  for(var pi=0;pi<parts.length;pi++){
    var post=parts[pi]; pc=post.postcode;
    // OR groups that yield a qualification date; split each into its edu/other conditions
    // and (optionally) a single work-experience radio that gates it.
    var d=single?1:2;
    var postBlocks='';

    // category-based mark threshold ($GradeMarkPer) — mirrors genEligibility
    var catBlock='';
    var cat=getCatValues(post);
    if(cat){
      catBlock+=ind(d)+'if('+buildCatCond(cat)+') {\n';
      catBlock+=ind(d+1)+'$GradeMarkPer = '+cat.scst+';\n';
      catBlock+=ind(d)+'} else {\n';
      catBlock+=ind(d+1)+'$GradeMarkPer = '+cat.other+';\n';
      catBlock+=ind(d)+'}\n';
    }

    for(var gi=0;gi<post.orGroups.length;gi++){
      var gconds=post.orGroups[gi].conditions;
      if(!gconds.length) continue;
      var gidxs=eduIdxsOf(gconds);
      if(!qualTimestamps(gidxs).length) continue;
      if(postBlocks) postBlocks+='\n';
      var s=ind(d)+'if(\n';
      for(var ci=0;ci<gconds.length;ci++)
        s+=ind(d+1)+buildCondLine(gconds[ci],pc,single)+(ci<gconds.length-1?' &&':'')+'\n';
      s+=ind(d)+') {\n';
      s+=genQualSel(gidxs,d+1);
      s+=ind(d)+'}\n';
      postBlocks+=s;
      record(gidxs);
    }
    if(!postBlocks) continue;
    if(!single) blocks+=ind(1)+(anyBlock?'else if':'if')+'($postcode == "'+post.postcode+'") {\n';
    anyBlock=true;
    blocks+=catBlock;
    blocks+=postBlocks;

    if(!single) blocks+=ind(1)+'}\n';
    if(pi<parts.length-1) blocks+='\n';
  }

  if(!Object.keys(neededTs).length) return '';

  // strtotime() declarations for required timestamps, in EDU idx order.
  var decls='';
  var ordered=Object.keys(neededTs).sort(function(a,b){return neededTs[a]-neededTs[b];});
  for(var i=0;i<ordered.length;i++){
    var idx=neededTs[ordered[i]];
    decls+=ind(1)+ordered[i]+" = strtotime($_POST['selyr"+idx+"'].'-'.$_POST['selmonth"+idx+"'].'-'.$_POST['selday"+idx+"']);\n";
  }

  var dyn='';
  if(!single) dyn+=ind(1)+"$postcode = $_POST['postcode'];\n";
  dyn+=decls+'\n'+blocks;

  return WE_HEAD+dyn+WE_TAIL;
}

// ── UI STEP 1 ─────────────────────────────────────────────────────────────
function onFileChange(e){
  var file=e.target.files[0]; if(!file) return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var res=parseFile(ev.target.result);
    S.posts=res.posts;S.errors=res.errors;S.warnings=res.warnings;S.rawRows=res.rawRows;
    renderS1();
  };
  reader.readAsArrayBuffer(file);
}

function renderS1(){
  document.getElementById('s1-results').classList.remove('hidden');
  var ac=document.getElementById('alerts-box'); ac.innerHTML='';
  if(S.errors.length)
    ac.innerHTML+='<div class="alert alert-err"><strong>'+S.errors.length+' error(s)</strong><br>'+S.errors.map(function(e){return'Row '+(e.ri+1)+' (Post '+e.pc+'): '+escH(e.msg);}).join('<br>')+'</div>';
  if(S.warnings.length)
    ac.innerHTML+='<div class="alert alert-warn"><strong>'+S.warnings.length+' warning(s)</strong><br>'+S.warnings.map(function(w){return'Post '+w.pc+': '+escH(w.msg);}).join('<br>')+'</div>';
  if(S.posts.length===0){
    var sample=S.rawRows.slice(0,8).map(function(r,i){return'Row '+i+': '+r.slice(0,8).map(function(v,ci){return'['+ci+']="'+escH(String(v||''))+'"';}).join(' ');}).join('<br>');
    ac.innerHTML+='<div class="alert alert-warn">No posts detected. Col map: '+JSON.stringify(S.colMap)+'<br><code style="font-size:11px;line-height:1.9">'+sample+'</code></div>';
  } else if(!S.errors.length&&!S.warnings.length){
    ac.innerHTML='<div class="alert alert-ok">Parsed — '+S.posts.length+' post(s), no issues.</div>';
  } else if(!S.errors.length){
    ac.innerHTML+='<div class="alert alert-ok">No blocking errors — proceed.</div>';
  }
  var totalC=S.posts.reduce(function(s,p){return s+p.orGroups.reduce(function(s2,g){return s2+g.conditions.length;},0);},0);
  document.getElementById('stats-row').innerHTML=
    '<div class="stat"><div class="stat-n">'+S.posts.length+'</div><div class="stat-l">Posts</div></div>'+
    '<div class="stat"><div class="stat-n">'+totalC+'</div><div class="stat-l">Conditions</div></div>'+
    '<div class="stat"><div class="stat-n">'+S.posts.reduce(function(s,p){return s+getAllRadios(p).length;},0)+'</div><div class="stat-l">Radio Questions</div></div>'+
    '<div class="stat"><div class="stat-n">'+S.posts.filter(function(p){return p.workExp;}).length+'</div><div class="stat-l">With Work Exp</div></div>'+
    '<div class="stat"><div class="stat-n">'+(S.errors.length||'0')+'</div><div class="stat-l">Errors</div></div>';
  var tbody=document.getElementById('ptbl-body'); tbody.innerHTML='';
  for(var pi=0;pi<S.posts.length;pi++){
    var post=S.posts[pi];
    var hr=tbody.insertRow(); hr.className='r-hdr';
    hr.innerHTML='<td colspan="10">Post <strong>'+post.postcode+'</strong>: '+escH(post.postName)+(post.workExp?' <span class="bd bd-b">Work Exp: '+post.workExp/12+'yr</span>':'')+'</td>';
    for(var gi=0;gi<post.orGroups.length;gi++){
      if(gi>0){var sr=tbody.insertRow();sr.className='r-sep';sr.innerHTML='<td colspan="10">── OR ──</td>';}
      var conds=post.orGroups[gi].conditions;
      for(var ci=0;ci<conds.length;ci++){
        var cond=conds[ci],tr=tbody.insertRow();
        tr.className=cond.status==='error'?'r-err':cond.status==='warn'?'r-warn':'r-ok';
        var sb=cond.status==='error'?'<span class="bd bd-r">Error</span>':cond.status==='warn'?'<span class="bd bd-o">Review</span>':'<span class="bd bd-g">OK</span>';
        if(cond.type==='edu')
          tr.innerHTML='<td>'+escH(post.postName)+'</td><td class="mono">'+post.postcode+'</td><td>'+(gi+1)+'</td><td><span class="bd bd-grey">EDU</span></td><td>'+escH(cond.level)+'</td><td class="dim" style="font-size:12px">'+(cond.subjects.length?escH(cond.subjects.join(', ')):'<em>—</em>')+'</td><td class="mono">'+(cond.markRaw||'—')+'</td><td>'+escH(cond.gradeRaw||'—')+'</td><td>'+(post.workExp?post.workExp/12+'yr':'—')+'</td><td>'+sb+'</td>';
        else
          tr.innerHTML='<td>'+escH(post.postName)+'</td><td class="mono">'+post.postcode+'</td><td>'+(gi+1)+'</td><td><span class="bd bd-o">RADIO</span></td><td colspan="4" class="dim" style="font-size:12px">'+escH(cond.question)+'</td><td>—</td><td>'+sb+'</td>';
      }
    }
  }
  document.getElementById('btn-s2').disabled=S.errors.length>0;
}

// ── UI STEP 2 ─────────────────────────────────────────────────────────────
function renderS2(){
  var con=document.getElementById('radio-cfg'); con.innerHTML='';
  var rPosts=S.posts.filter(function(p){return getAllRadios(p).length>0;});
  if(rPosts.length){
    con.innerHTML='<div class="sec-title">Radio Question Field Names</div><p class="dim" style="font-size:13px;margin-bottom:14px">Review auto-derived field names below.</p>';
    for(var pi=0;pi<rPosts.length;pi++){
      var post=rPosts[pi],sec=document.createElement('div');sec.className='radio-sec';
      sec.innerHTML='<h4>Post '+escH(post.postcode)+': '+escH(post.postName)+'</h4>';
      var radios=getAllRadios(post);
      for(var ri=0;ri<radios.length;ri++){
        var r=radios[ri],ov=getOv(post.postcode,r.question);
        if(!ov.fieldName) ov.fieldName=r.fieldName;
        if(!ov.langKey)   ov.langKey=r.langKey;
        var row=document.createElement('div');
        row.innerHTML='<div class="q-text">Q: '+escH(r.question)+'</div>'
          +'<div class="f-row">'
          +'<div class="f-grp"><label>PHP Field Name</label><input type="text" value="'+escA(ov.fieldName)+'" data-pc="'+escA(post.postcode)+'" data-q="'+escA(r.question)+'" data-f="fieldName" oninput="updOv(this)"></div>'
          +'<div class="f-grp"><label>Lang Key</label><input type="text" value="'+escA(ov.langKey)+'" data-pc="'+escA(post.postcode)+'" data-q="'+escA(r.question)+'" data-f="langKey" oninput="updOv(this)"></div>'
          +'</div>';
        sec.appendChild(row);
      }
      con.appendChild(sec);
    }
  } else {
    con.innerHTML='<div class="alert alert-info">No radio questions — nothing to configure.</div>';
  }
  updatePreview();
}
function updOv(el){getOv(el.dataset.pc,el.dataset.q)[el.dataset.f]=el.value;updatePreview();}
function weNone(){
  var h=S.weHeader?(' (header: "'+S.weHeader+'")'):'';
  return '// work_exp_details_validations.php is NOT generated.\n'+
         '// The Work Experience column does not indicate Post-Qualification experience'+h+'.';
}
function updatePreview(){setCode('pv-edu-code',genEduConfig(S.posts));setCode('pv-eli-code',genEligibility(S.posts));setCode('pv-eduval-code',genEduValidations(S.posts));setCode('pv-workexp-code',genWorkExpDetails(S.posts)||weNone());}
function setCode(id,code){var el=document.getElementById(id);el.textContent=code;delete el.dataset.highlighted;try{hljs.highlightElement(el);}catch(e){}}
function switchTab(t){
  var tabs=['edu','eli','eduval','workexp'];
  for(var i=0;i<tabs.length;i++){
    document.getElementById('tab-'+tabs[i]).classList.toggle('on',t===tabs[i]);
    document.getElementById('pv-'+tabs[i]).classList.toggle('hidden',t!==tabs[i]);
  }
}

// ── UI STEP 3 ─────────────────────────────────────────────────────────────
// which -> {code, file}. work_exp content may be '' (not generated for this sheet).
function fileInfo(which){
  switch(which){
    case 'edu':     return {code:S._edu,     file:'edu_config.php'};
    case 'eli':     return {code:S._eli,     file:'eligibity_validation.php'};
    case 'eduval':  return {code:S._eduval,  file:'edu_validations.php'};
    case 'workexp': return {code:S._workexp, file:'work_exp_details_validations.php'};
    default:        return {code:S._lang,    file:'edu_details_lang.php'};
  }
}
function renderS3(){
  S._edu=genEduConfig(S.posts);S._eli=genEligibility(S.posts);S._lang=genLangFile(S.posts);
  S._eduval=genEduValidations(S.posts);S._workexp=genWorkExpDetails(S.posts);
  setCode('out-edu',S._edu);setCode('out-eli',S._eli);setCode('out-lang',S._lang);
  setCode('out-eduval',S._eduval);setCode('out-workexp',S._workexp||weNone());
}
function copyCode(which,btn){
  var code=fileInfo(which).code||'';
  var ta=document.createElement('textarea');
  ta.value=code;ta.style.cssText='position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(ta);ta.focus();ta.select();
  try{document.execCommand('copy');}catch(e){}
  document.body.removeChild(ta);
  var orig=btn.innerHTML;btn.innerHTML='Copied!';
  btn.style.cssText='background:#238636;color:#fff;border:none';
  setTimeout(function(){btn.innerHTML=orig;btn.style.cssText='';},2000);
}
function dlFile(which){
  var fi=fileInfo(which);
  if(!fi.code){alert(fi.file+' is not generated for this sheet.');return;}
  var url=URL.createObjectURL(new Blob([fi.code],{type:'application/octet-stream'}));
  var a=document.createElement('a');a.href=url;a.download=fi.file;
  document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},100);
}
function dlZip(){
  if(typeof JSZip==='undefined'){alert('JSZip not loaded');return;}
  var zip=new JSZip();zip.file('edu_config.php',S._edu);zip.file('eligibity_validation.php',S._eli);zip.file('edu_details_lang.php',S._lang);zip.file('edu_validations.php',S._eduval);
  if(S._workexp) zip.file('work_exp_details_validations.php',S._workexp);
  zip.generateAsync({type:'blob'}).then(function(blob){
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download='eligibility_code.zip';
    document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},100);
  });
}

// ── NAVIGATION ────────────────────────────────────────────────────────────
function goStep(n){
  [1,2,3].forEach(function(i){
    document.getElementById('step-'+i).classList.toggle('hidden',i!==n);
    var si=document.getElementById('si-'+i);
    si.classList.toggle('active',i===n);si.classList.toggle('done',i<n);
  });
  if(n===2) renderS2();
  if(n===3) renderS3();
}
window.goStep=goStep;window.updOv=updOv;window.switchTab=switchTab;
window.copyCode=copyCode;window.dlFile=dlFile;window.dlZip=dlZip;

document.getElementById('file-in').addEventListener('change',onFileChange);
hljs.configure({ignoreUnescapedHTML:true});
var ua=document.getElementById('upload-area');
ua.addEventListener('dragover',function(e){e.preventDefault();ua.classList.add('drag');});
ua.addEventListener('dragleave',function(){ua.classList.remove('drag');});
ua.addEventListener('drop',function(e){
  e.preventDefault();ua.classList.remove('drag');
  var f=e.dataTransfer.files[0];if(f) onFileChange({target:{files:[f]}});
});
})();
