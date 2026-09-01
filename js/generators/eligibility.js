/* Eligibility Code Generator — module: generators/eligibility.js — eligibity_validation.php + condition/error builders
   Part of the namespaced App.* module set. Logic is unchanged from the
   original single-file version; only wrapped for modular loading. */
(function(App){
  // ── imports from App ──
  var EDU = App.EDU;
  var GRADE_OPS = App.GRADE_OPS;
  var apEnabled = App.apEnabled;
  var apField = App.apField;
  var apRank = App.apRank;
  var lookupMarkOp = App.lookupMarkOp;
  var annotateCondNames = App.annotateCondNames;
  var arrRef = App.arrRef;
  var STREAM_AXIS = App.STREAM_AXIS;
  var DEGREE_AXIS = App.DEGREE_AXIS;
  var buildCatCond = App.buildCatCond;
  var getCatValues = App.getCatValues;
  var getStreamData = App.getStreamData;
  var gradeCheck = App.gradeCheck;
  var ind = App.ind;
  var isCat = App.isCat;
  var rFn = App.rFn;
  var rLk = App.rLk;
  var sbYes = App.sbYes;
  var sbNo = App.sbNo;
  var assignDeclares = App.assignDeclares;
  var dimCond = App.dimCond;
  var isLegacyDims = App.isLegacyDims;

// PHP test for "the submitted form matches THIS post's dimension combination",
// used as the `if(...)` head of each per-post block.
//   legacy/1-dim: $postcode == "01"      (byte-identical to the old output)
//   N dimensions: $_POST['postcode'] == '01' && $_POST['recrtmnt_mode'] == '02'
function postMatch(post){ return dimCond(post,{useVar:true,inline:true}); }

// Emit the per-post if/else-if chain body (no file head/tail, no assignDeclares).
// `single` is passed explicitly so the branched caller can force single=false
// when combining normal + internal posts.
// `arrSuffix` (optional) — when set (e.g. '_internal'), every array reference in
// conditions and error messages uses the suffixed array name. Returns a string.
function emitPostChain(posts, single, arrSuffix){
  var sfxOpts=arrSuffix?{arrSuffix:arrSuffix}:undefined;
  var o='';
  for(var pi=0;pi<posts.length;pi++){
    var post=posts[pi];
    var grps=post.orGroups.filter(function(g){return g.conditions.length>0;});
    if(!grps.length) continue;
    var d=single?1:2;

    if(!single) o+=ind(1)+(pi===0?'if':'} else if')+'('+postMatch(post)+') {\n';

    // category mark block
    var cat=getCatValues(post);
    if(cat) o+=buildGradeMarkPer(cat,d);

    o+=ind(d)+'if(! \n'+ind(d+1)+'(\n';
    for(var gi=0;gi<grps.length;gi++){
      var conds=grps[gi].conditions;
      o+=ind(d+2)+'(\n';
      for(var ci=0;ci<conds.length;ci++)
        o+=ind(d+3)+buildCondGroupLine(conds[ci],post,single,conds,sfxOpts)+(ci<conds.length-1?' &&':'')+'\n';
      o+=ind(d+2)+')'+(gi<grps.length-1?' ||':'')+'\n';
    }
    o+=ind(d+1)+')\n'+ind(d)+')\n'+ind(d)+'{\n\n';
    o+=ind(d+1)+'$finalsubmit="N";\n\n';
    o+=buildErrMsgs(post,d+1,single,arrSuffix);
    o+='\n'+ind(d+1)+'$errmsg.=$Elig_errmsg;\n';
    o+=ind(d+1)+"$errmsgarr[]='eligibility|'.$Elig_errmsg;\n\n";
    o+=ind(d)+'}else\n'+ind(d)+'{\n'+ind(d+1)+"$errmsgarr[]='eligibility|';\n"+ind(d)+'}\n';
    // A post's work-exp requirement is NOT always the same across every OR-group:
    // some branches may require no experience at all (dash/blank WE cell) while
    // others require N years, gated on a "do you have N years experience?" radio
    // that's already part of that branch's eligibility conditions above. post.workExp
    // only reflects the FIRST OR-group's cell, so it must not gate this block alone —
    // any OR-group with a WE requirement means the block is needed.
    var weGroups=grps.filter(function(g){return g.workExp;});
    if(post.workExp||weGroups.length){
      var tiers=weRadioTiers(post,post.postcode);
      // Uniform when every OR-group that carries conditions shares the same WE
      // months (including groups that require none) — then the check applies
      // regardless of which branch the applicant qualifies through, so it stays
      // unconditional (byte-identical to prior behaviour). Otherwise it only
      // applies to branches gated by their own experience radio.
      var uniform=grps.every(function(g){return (g.workExp||0)===(grps[0].workExp||0);});
      if(tiers.length>=2||(tiers.length===1&&!uniform)){
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
  return o;
}

function genEligibility(posts){
  // Annotate BOTH axes so each condition carries its own per-axis _condN suffix
  // before buildCondLine / buildErrLine reference them.
  annotateCondNames(posts,getStreamData(posts,DEGREE_AXIS),DEGREE_AXIS);
  annotateCondNames(posts,getStreamData(posts,STREAM_AXIS),STREAM_AXIS);
  var single=posts.length===1;
  var o='<?PHP \n'+ind(1)+'/***********************************************Eligibility Validation ***************************************************************/\t\n\n';
  if(!single) o+=assignDeclares(1)+'\n';
  o+=emitPostChain(posts,single);
  o+='?>';
  return o;
}

// Emit the `$GradeMarkPer` selection block for a category-based mark. Handles both
// the legacy two-tier form (lower-cats threshold vs everyone-else) and the
// multi-tier MCAT form (one if/elseif per category group, highest threshold as the
// trailing else). Shared by genEligibility, eduValidations and workExp generators.
function buildGradeMarkPer(cat,d){
  var o='';
  if(cat.multi){
    var tiers=cat.tiers;
    for(var i=0;i<tiers.length-1;i++){
      o+=ind(d)+(i===0?'if':'} else if')+'('+buildCatCond(tiers[i])+') {\n';
      o+=ind(d+1)+'$GradeMarkPer = '+tiers[i].thr+';\n';
    }
    o+=ind(d)+'} else {\n';
    o+=ind(d+1)+'$GradeMarkPer = '+tiers[tiers.length-1].thr+';\n';
    o+=ind(d)+'}\n';
    return o;
  }
  o+=ind(d)+'if('+buildCatCond(cat)+') {\n';
  o+=ind(d+1)+'$GradeMarkPer = '+cat.scst+';\n';
  o+=ind(d)+'} else {\n';
  o+=ind(d+1)+'$GradeMarkPer = '+cat.other+';\n';
  o+=ind(d)+'}\n';
  return o;
}

// `post` is the post object (for its dimension combination, used by arrRef).
// A bare postcode string is still accepted for callers that only have one.
// Build the value-axis (Subject/Stream or Degree) presence clause for one edu
// condition, or '' when the level/condition carries no value on that axis.
//   "Any value"          -> $_POST['selX']!=''
//   listed values        -> $_POST['selX']!='' && array_key_exists($_POST['selX'], $arr...)
// `axis` is STREAM_AXIS or DEGREE_AXIS; it selects the EDU field names, the array
// reference and the per-axis _condN suffix — so the two axes never share anything.
// `arrSuffix` is forwarded from opts.arrSuffix — passed to arrRef so that the
// internal-candidate branch references $arrX_internal instead of $arrX.
function axisClause(cond,def,single,post,axis,arrSuffix){
  if(!def[axis.has]) return '';
  var sel=def[axis.sel];
  if(cond[axis.any]) return "$_POST['"+sel+"']!=''";
  var vals=cond[axis.vals];
  if(!vals||!vals.length) return '';
  var aref=arrRef(def,cond[axis.cond],single,post,axis,arrSuffix);
  return "$_POST['"+sel+"']!='' && array_key_exists($_POST['"+sel+"'], "+aref+")";
}

// `opts.apField`    (optional) — AP mark/grade gating (see above).
// `opts.arrSuffix`  (optional) — array name suffix for internal-candidate branch
//                                (e.g. '_internal'). Passed through to arrRef so
//                                conditions reference $arrX_internal instead of $arrX.
// Absent opts ⇒ byte-identical to the legacy output.
function buildCondLine(cond,post,single,opts){
  var pc=(post&&post.postcode!=null)?post.postcode:post;
  if(cond.type==='radio') return "($_POST['"+rFn(cond,pc)+"']=='"+(cond.shouldBe==='N'?'N':'Y')+"')";
  var def=EDU[cond.level];
  var cat=isCat(cond.markRaw);
  var mo=(!cat&&cond.markRaw)?lookupMarkOp(cond.markRaw):null;
  var gc=gradeCheck("$_POST['"+def.sg+"']",cond.gradeRaw);
  // Order matches the sheet's column order: Degree first, then Subject/Stream, then
  // the mark and grade checks. Each axis is independent; only the axes that actually
  // carry a value for this condition contribute a clause. The clauses are split into
  // the always-required structural part (degree/stream) and the mark+grade part that
  // Appeared/Passed gating may wrap.
  var sfx=opts&&opts.arrSuffix;
  var structural=[];
  var dc=axisClause(cond,def,single,post,DEGREE_AXIS,sfx); if(dc) structural.push(dc);
  var sc=axisClause(cond,def,single,post,STREAM_AXIS,sfx); if(sc) structural.push(sc);
  var markGrade=[];
  if(cat)     markGrade.push("$_POST['"+def.sm+"'] >=$GradeMarkPer");
  else if(mo) markGrade.push("$_POST['"+def.sm+"'] "+mo.php);
  if(gc)      markGrade.push(gc);

  var apf=opts&&opts.apField;
  var apPassedOnly=opts&&opts.apPassedOnly;
  // AP-active: build the P-branch gate using only requirements that are actually
  // present in the eligibility sheet for this condition.
  //   - Mark: included only when a mark threshold is specified (cat or mo).
  //   - Grade: included whenever `gc` is non-null (mirrors the non-AP `markGrade`
  //     above), so it also covers the 'Any Class' case — that still requires a grade
  //     to have been selected ($_POST['selgradeX']!=''), it just doesn't restrict
  //     which one. Nothing to gate ⇒ fall through to the legacy join.
  if(apf){
    var apMarkGrade=[];
    if(cat)     apMarkGrade.push("$_POST['"+def.sm+"'] >=$GradeMarkPer");
    else if(mo) apMarkGrade.push("$_POST['"+def.sm+"'] "+mo.php);
    if(gc)      apMarkGrade.push(gc);
    if(apPassedOnly){
      // checkDOPassing: only a candidate who has actually Passed (not merely
      // Appeared) should get this branch's date cutoff; others fall through to
      // the caller's today's-date default. No 'Appeared' alternative here.
      var pGate="($_POST['"+apf+"']=='P'"+(apMarkGrade.length?(' && '+apMarkGrade.join(' && ')):'')+")";
      return '('+structural.concat([pGate]).join(' && ')+')';
    }
    if(apMarkGrade.length){
      var apGate="( ($_POST['"+apf+"']=='A') || ($_POST['"+apf+"']=='P' && "+apMarkGrade.join(' && ')+") )";
      return '('+structural.concat([apGate]).join(' && ')+')';
    }
    // No specific mark/grade requirement → AP presence check only (structural
    // conditions still apply; the mark/grade non-AP clauses are also included).
    if(markGrade.length) return '('+structural.concat(markGrade).join(' && ')+')';
  }
  return '('+structural.concat(markGrade).join(' && ')+')';
}

// ── APPEARED / PASSED HIERARCHY ─────────────────────────────────────────────
// Academic rank of a condition's level, delegated to App.apRank so the hierarchy is
// whatever the user arranged in Step 2 (drag & drop). With no configuration apRank
// falls back to the default POSTQUAL_TS ranks (SSC1 < HSC2 < Graduation3 <
// (PG|PGDiploma)4 < PhD5). 0 = radio / 'Others' / any level in the generic
// (non-hierarchical) group — e.g. Diploma, Certification, Professional, IDD by
// default — which has no precedence either way.
function acadRank(cond){
  if(cond.type!=='edu') return 0;
  return apRank(cond.level);
}
// The AP field for `cond`, but suppressed to null when a higher-ranked ACADEMIC
// qualification also appears in the same OR-group. Appeared/Passed applies only to the
// terminal (highest) qualification of each eligibility branch: if a post requires
// Graduation AND Post Graduation, Graduation stays a hard/normal check and only Post
// Graduation is AP-gated. Specials (acadRank 0, e.g. Diploma/Certification/Professional)
// have no ladder precedence, so they keep their own AP setting and never suppress / are
// never suppressed (mirrors lowerAppearedFields). Every per-condition AP decision keys
// off this predicate, so a lower academic level is never AP-active when a higher one is
// present — and no stray $_POST['..._appeared'] reference leaks for a normal-check level.
function effectiveApField(cond,groupConds){
  var f=apField(cond.level);
  if(!f) return null;
  var r=acadRank(cond);
  if(r<=0) return f;                              // special: unaffected by the ladder
  for(var i=0;i<groupConds.length;i++){
    var L=groupConds[i]; if(L===cond||L.type!=='edu') continue;
    if(acadRank(L)>r) return null;               // a higher academic qual exists → normal
  }
  return f;
}
// Within one OR-group, the AP field names of conditions that are (a) AP-active (per
// effectiveApField, so subject to the highest-only rule) and (b) strictly LOWER in
// academic rank than C. If any of these is "Appeared", the higher condition C is
// logically impossible, so its eligibility check + alert are waived. Specials/radios
// (rank 0) are never suppressors and never suppressed. Under the highest-only rule a
// lower academic qual is no longer AP-active, so this naturally yields [] for academic
// ladders — the lower qual is a hard requirement with nothing to waive.
function lowerAppearedFields(groupConds,C){
  if(acadRank(C)<=0) return [];
  var out=[],seen={};
  for(var i=0;i<groupConds.length;i++){
    var L=groupConds[i]; if(L===C||L.type!=='edu') continue;
    var f=effectiveApField(L,groupConds);
    if(f && acadRank(L)>0 && acadRank(L)<acadRank(C) && !seen[f]){ seen[f]=true; out.push(f); }
  }
  return out;
}
// The single per-condition emitter shared by genEligibility, genEduValidations and
// genWorkExpDetails. Applies AP mark/grade gating + hierarchical suppression. When the
// feature is off it returns exactly buildCondLine(cond,post,single) (byte-identical).
// `extraOpts` (optional) — additional opts forwarded to buildCondLine (e.g. arrSuffix).
function buildCondGroupLine(cond,post,single,groupConds,extraOpts){
  var sfx=extraOpts&&extraOpts.arrSuffix;
  var passedOnly=extraOpts&&extraOpts.apPassedOnly;
  if(!apEnabled()) return buildCondLine(cond,post,single,sfx?{arrSuffix:sfx}:undefined);
  var opts=(cond.type==='edu')?{apField:effectiveApField(cond,groupConds),arrSuffix:sfx,apPassedOnly:passedOnly}:{arrSuffix:sfx};
  if(!sfx && cond.type!=='edu') opts=undefined;
  var line=buildCondLine(cond,post,single,opts);
  if(cond.type==='edu' && !passedOnly){
    var lf=lowerAppearedFields(groupConds,cond);
    if(lf.length){
      var appeared=lf.map(function(f){return "$_POST['"+f+"']=='A'";}).join(' || ');
      line='( ( '+appeared+' ) || '+line+' )';
    }
  }
  return line;
}

function buildErrMsgs(post,indLvl,single,arrSuffix){
  if(apEnabled()) return buildErrMsgsAP(post,indLvl,single,arrSuffix);
  var grps=post.orGroups.filter(function(g){return g.conditions.length>0;});
  var o='',first=true;
  for(var gi=0;gi<grps.length;gi++){
    var conds=grps[gi].conditions;
    for(var ci=0;ci<conds.length;ci++){
      var errOpts=arrSuffix?{arrSuffix:arrSuffix}:undefined;
      o+=ind(indLvl)+'$Elig_errmsg'+(first?' = ':' .= ')+buildErrLine(conds[ci],post,single,errOpts)+';\n';
      first=false;
      if(ci<conds.length-1) o+=ind(indLvl)+'$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";\n';
    }
    if(gi<grps.length-1) o+=ind(indLvl)+'$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";\n';
  }
  return o;
}

// Appeared/Passed variant of buildErrMsgs. Differs from the legacy path in three ways:
//   1. $Elig_errmsg is initialised to '' and EVERY line uses `.=` (so a guarded line
//      that doesn't fire can't leave the variable undefined).
//   2. An AP-active level's mark/grade requirement is appended only when field!='A'.
//   3. A higher-level line is suppressed (with its trailing " AND " separator) when a
//      strictly-lower AP qualification was "Appeared" — mirroring the eligibility
//      condition's hierarchical suppression so the alert matches what is checked.
function buildErrMsgsAP(post,indLvl,single,arrSuffix){
  var grps=post.orGroups.filter(function(g){return g.conditions.length>0;});
  var o=ind(indLvl)+"$Elig_errmsg = '';\n";
  for(var gi=0;gi<grps.length;gi++){
    var conds=grps[gi].conditions;
    for(var ci=0;ci<conds.length;ci++){
      var cond=conds[ci];
      var hasAnd=(ci<conds.length-1);
      var lf=(cond.type==='edu')?lowerAppearedFields(conds,cond):[];
      var apf=(cond.type==='edu')?effectiveApField(cond,conds):null;
      var errOpts=arrSuffix?{split:true,arrSuffix:arrSuffix}:{split:true};
      var parts=buildErrLine(cond,post,single,errOpts);
      var inner=indLvl+(lf.length?1:0);  // extra indent inside the suppression guard
      var body='';
      body+=ind(inner)+'$Elig_errmsg .= '+parts.base+';\n';
      if(parts.markGrade){
        if(apf) body+=ind(inner)+"if($_POST['"+apf+"']!='A'){ $Elig_errmsg .= "+parts.markGrade+'; }\n';
        else    body+=ind(inner)+'$Elig_errmsg .= '+parts.markGrade+';\n';
      }
      if(hasAnd) body+=ind(inner)+'$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";\n';
      if(lf.length){
        var guard=lf.map(function(f){return "$_POST['"+f+"']=='A'";}).join(' || ');
        o+=ind(indLvl)+'if( !( '+guard+' ) ){\n'+body+ind(indLvl)+'}\n';
      } else {
        o+=body;
      }
    }
    if(gi<grps.length-1) o+=ind(indLvl)+'$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";\n';
  }
  return o;
}

// Returns the fused error string (legacy) OR, when opts.split is set, an object
// {base, markGrade} where `base` is a complete double-quoted PHP expression for the
// "Please select <level> <degree/subject>" text and `markGrade` is a SEPARATE complete
// double-quoted expression carrying only the mark+grade requirement (or '' if none).
// The split form lets buildErrMsgs append the mark/grade fragment conditionally for
// Appeared/Passed levels. The fused form is byte-identical to the original.
function buildErrLine(cond,post,single,opts){
  var pc=(post&&post.postcode!=null)?post.postcode:post;
  if(cond.type==='radio'){
    var rl="$LANG['"+rLk(cond,pc)+"'].' "+(cond.shouldBe==='N'?sbNo():sbYes())+"&nbsp;&nbsp;'";
    return (opts&&opts.split)?{base:rl,markGrade:''}:rl;
  }
  var sfx=opts&&opts.arrSuffix;
  var def=EDU[cond.level];
  var cat=isCat(cond.markRaw);
  var mo=(!cat&&cond.markRaw)?lookupMarkOp(cond.markRaw):null;
  var go=cond.gradeRaw?(GRADE_OPS[cond.gradeRaw]||null):null;
  var aref=arrRef(def,cond.condName,single,post,STREAM_AXIS,sfx);

  var gradeSep=go?" ,&nbsp;&nbsp; ":"";
  var markPart='';
  if(cat)     markPart=" ,&nbsp;&nbsp; \".$LANG['edu_lbl_mark'].\" >= \".$GradeMarkPer.\" %"+gradeSep;
  else if(mo) markPart=" ,&nbsp;&nbsp; \".$LANG['edu_lbl_mark'].\" "+mo.err+gradeSep;
  var gradePart=go?" &nbsp;&nbsp; \".$LANG['edu_lbl_grade'].\" = "+go.err+" &nbsp;&nbsp;\"":'\"';

  // Degree / subject fragments. Each is a value-axis clause that RE-OPENS the message
  // string (the base text leaves the quote open, ending with `.\"`), prefixed by a
  // leading " &nbsp;&nbsp; " separator and closing the quote again with `.\"`. The
  // legacy subject-only path is reproduced byte-for-byte (single fragment, one leading
  // space). Degree comes first (sheet column order), then subject.
  var degPart='';
  if(def.hasDegree && cond.degrees && cond.degrees.length){
    var dref=arrRef(def,cond.degreeCondName,single,post,DEGREE_AXIS,sfx);
    degPart=" &nbsp;&nbsp; \".$LANG['edu_lbl_degree'].\" = \".implode(\" / \", "+dref+").\" ,";
  }
  var subjPart=(def.hasStream && cond.subjects && cond.subjects.length)
    ? " &nbsp;&nbsp; \".$LANG['edu_lbl_subject'].\" = \".implode(\" / \", "+aref+").\""
    : '';

  if(opts&&opts.split){
    // `base` closes its own quote after the level/degree/subject text.
    // `markGrade` carries only the mark+grade alert fragments that correspond to
    // requirements actually present in the eligibility sheet, matching what
    // buildCondLine puts in the AP P-branch (`hasGrade` mirrors `gc` there — true
    // whenever a grade requirement exists, including 'Any Class').
    var lead=cond.anyStream&&!degPart&&!subjPart ? "\"Please enter \".$LANG['"+def.lang+"'].\""
                                                 : "\"Please select \".$LANG['"+def.lang+"'].\"";
    var base=lead+degPart+subjPart+'"';
    var mg='';
    var hasMark=!!(cat||mo);
    var hasGrade=!!go;
    if(hasMark||hasGrade){
      var innerMark=hasMark?markPart:'';
      var innerGrade=hasGrade?gradePart:'"';
      mg='"'+innerMark+innerGrade;
    }
    return {base:base, markGrade:mg};
  }

  if(cond.anyStream && !degPart && !subjPart)
    return "\"Please enter \".$LANG['"+def.lang+"'].\""+markPart+gradePart;
  if(!degPart && !subjPart)
    return "\"Please select \".$LANG['"+def.lang+"'].\""+markPart+gradePart;
  return "\"Please select \".$LANG['"+def.lang+"'].\""+degPart+subjPart+markPart+gradePart;
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
  // A work-experience radio carries a year count plus an experience/service phrase.
  // "regular service" radios gate the same per-tier totexp check as "experience"
  // ones, so both must be recognised (e.g. "minimum 5 years regular service ...").
  return /\d+\s*year/i.test(q) && /experience|service/i.test(q);
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

  // ── exports to App ──
  App.emitPostChain = emitPostChain;
  App.buildCondLine = buildCondLine;
  App.buildCondGroupLine = buildCondGroupLine;
  App.effectiveApField = effectiveApField;
  App.acadRank = acadRank;
  App.lowerAppearedFields = lowerAppearedFields;
  App.buildErrLine = buildErrLine;
  App.buildErrMsgs = buildErrMsgs;
  App.buildGradeMarkPer = buildGradeMarkPer;
  App.buildWE = buildWE;
  App.genEligibility = genEligibility;
  App.isWorkExpRadio = isWorkExpRadio;
  App.weRadioTiers = weRadioTiers;
  App.weYears = weYears;
})(window.App = window.App || {});
