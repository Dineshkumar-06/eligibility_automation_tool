/* Eligibility Code Generator — module: generators/workExp.js — work_exp_details_validations.php
   Part of the namespaced App.* module set. Logic is unchanged from the
   original single-file version; only wrapped for modular loading. */
(function(App){
  // ── imports from App ──
  var EDU = App.EDU;
  var POSTQUAL_TS = App.POSTQUAL_TS;
  var annotateCondNames = App.annotateCondNames;
  var buildCatCond = App.buildCatCond;
  var buildCondLine = App.buildCondLine;
  var buildCondGroupLine = App.buildCondGroupLine;
  var buildGradeMarkPer = App.buildGradeMarkPer;
  var genEligibility = App.genEligibility;
  var getCatValues = App.getCatValues;
  var getStreamData = App.getStreamData;
  var STREAM_AXIS = App.STREAM_AXIS;
  var DEGREE_AXIS = App.DEGREE_AXIS;
  var ind = App.ind;
  var assignDeclares = App.assignDeclares;
  var dimCond = App.dimCond;

// The file's static head/tail are preserved verbatim (base64-embedded); only the
// post-qualification date-derivation block is generated dynamically:
//   1. strtotime() declarations for the qualification timestamps actually used
//   2. per-postcode eligibility conditions (reused verbatim from eligibity_validation.php)
//   3. the qualification-date selection that feeds $eligibilityPostQualidtArr[]
// Returns '' when no post requires it (Case 2 — plain "Work Experience" only).
var WE_HEAD = atob('ICAJCmlmKFBPU1RfUVVBTElGSUNBVElPTl9FWFApewovKiAgc3dpdGNoKCRfUE9TVFsncG9zdGNvZGUnXSl7CgkJZGVmYXVsdDoKCQkJJGVkdWRheSA9JF9QT1NUWydzZWxkYXkzJ107CgkJICAgICRlZHVtb250aD0kX1BPU1RbJ3NlbG1vbnRoMyddOy8vLUNoYW5nZSB0aGUgdmFyaWFibGUgaW5pdGlhbGl6YXRpb24gYXMgcGVyIHRoZSByZXF1aXJlbWVudDsKCQkJJGVkdXllYXI9JF9QT1NUWydzZWx5cjMnXTsvLy1DaGFuZ2UgdGhlIHZhcmlhYmxlIGluaXRpYWxpemF0aW9uIGFzIHBlciB0aGUgcmVxdWlyZW1lbnQ7CQoJCQkkZXhwX21zZ19jb250ZW50ID0gJ0VkdWNhdGlvbmFsIHF1YWxpZmljYXRpb24gZGF0ZSBvZiBwYXNzaW5nICc7CgkJYnJlYWs7Cgl9ICovCgo=');

var WE_TAIL = atob('aWYoaXNfYXJyYXkoJGVsaWdpYmlsaXR5UG9zdFF1YWxpZHRBcnIpKXsKCQlpZihjb3VudCgkZWxpZ2liaWxpdHlQb3N0UXVhbGlkdEFycikgPiAwKXsKCQkkcG9zdFF1YWxpZmlNaW4gPSBtaW4oJGVsaWdpYmlsaXR5UG9zdFF1YWxpZHRBcnIpOwoJCSRwb3N0UXVhbGlmaU1pbkR0ID0gZGF0ZSgnWS1tLWQnLCRwb3N0UXVhbGlmaU1pbik7CgkJJHBvc3RRdWFsaWZpTWluRHRBcnIgPSBleHBsb2RlKCItIiwkcG9zdFF1YWxpZmlNaW5EdCk7CgkJCgkJJGVkdWRheSA9ICRwb3N0UXVhbGlmaU1pbkR0QXJyWzJdOwoJCSRlZHVtb250aCA9ICRwb3N0UXVhbGlmaU1pbkR0QXJyWzFdOwoJCSRlZHV5ZWFyID0gJHBvc3RRdWFsaWZpTWluRHRBcnJbMF07CgkJJGV4cF9tc2dfY29udGVudCA9ICdFZHVjYXRpb25hbCBxdWFsaWZpY2F0aW9uIGRhdGUgb2YgcGFzc2luZyAnOwoJfQoJfQoKfWVsc2V7CgkkZWR1bW9udGggPSAkZG9ibW9udGg7Ly9kb2IgbW9udGgKCSRlZHV5ZWFyID0gJGRvYnllYXI7Ly9kb2IgbW9udGgKCSRleHBfbXNnX2NvbnRlbnQgPSAnRGF0ZSBPZiBCaXJ0aCAnOwp9');

// Unique edu field indices in an OR group's edu conditions (ascending).
function eduIdxsOf(conds){
  var seen={},out=[];
  for(var i=0;i<conds.length;i++){
    if(conds[i].type!=='edu') continue;
    var def=EDU[conds[i].level];
    if(def&&!seen[def.idx]&&!App.sowAbsent(conds[i].level,'date')){seen[def.idx]=true;out.push(def.idx);}
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


// ── Appeared/Passed-aware qualification-date selection ──────────────────────
// An AP-active qualification answered "Appeared" has no date of passing, so its
// timestamp must not feed $eligibilityPostQualidtArr[]. Plan per OR-group:
//   chain    — academic levels present, highest first (PG/PGD tie → lower idx first,
//              matching qualTimestamps). The top is the base date; when it is
//              AP-active and Appeared, fall back to the next lower academic.
//   specials — non-ladder levels (Professional, Diploma, …) compared against the base;
//              an AP-active special is skipped when Appeared.
// ap is false when no involved level is AP-active → caller keeps the legacy output.
function apFieldForIdx(idx,gconds){
  if(!gconds||!App.apEnabled||!App.apEnabled()||!App.effectiveApField) return null;
  for(var i=0;i<gconds.length;i++){
    var c=gconds[i];
    if(c.type!=='edu'||!EDU[c.level]||EDU[c.level].idx!==idx) continue;
    var f=App.effectiveApField(c,gconds);
    if(f) return f;
  }
  return null;
}
function planQual(idxs,gconds){
  var acad=[],specials=[],ap=false;
  for(var i=0;i<idxs.length;i++){
    var info=POSTQUAL_TS[idxs[i]];
    if(!info) continue;
    var f=apFieldForIdx(idxs[i],gconds);
    if(f) ap=true;
    var e={idx:idxs[i],v:info.v,f:f,acad:info.acad};
    if(info.acad>0) acad.push(e); else specials.push(e);
  }
  acad.sort(function(a,b){return (b.acad-a.acad)||(a.idx-b.idx);});
  specials.sort(function(a,b){return a.idx-b.idx;});
  // The chain only needs to reach the first academic that is not AP-gated.
  var chain=[];
  for(var i=0;i<acad.length;i++){ chain.push(acad[i]); if(!acad[i].f) break; }
  if(chain.length && !chain[0].f) ap=specials.some(function(s){return !!s.f;});
  return {chain:chain,specials:specials,ap:ap};
}
// Timestamp variables a plan references (for strtotime declarations).
function planTimestamps(plan){
  return plan.chain.concat(plan.specials).map(function(e){return e.v;});
}
function appeared(f){return "($_POST['"+f+"']=='A')";}
// Emit the AP-aware selection. Base expression: nested ternary over the chain,
//   ($_POST['pg_appeared']=='A') ? $graduationtimeStr : $pggraduationtimeStr
// If every chain level is AP-gated the base may be absent (all Appeared) → guarded.
function genQualSelAP(plan,d){
  var ARR='$eligibilityPostQualidtArr[]  = ', D2='$eligibility_postquali_date2';
  var chain=plan.chain, sp=plan.specials;
  var base=null, baseGuard=null;
  if(chain.length){
    base=chain[chain.length-1].v;
    for(var i=chain.length-2;i>=0;i--) base=appeared(chain[i].f)+' ? '+base+' : '+chain[i].v;
    if(chain[chain.length-1].f)
      baseGuard=chain.map(function(e){return "$_POST['"+e.f+"']!='A'";}).join(' || ');
  }
  var o='';
  if(!sp.length){
    if(baseGuard) return ind(d)+'if('+baseGuard+'){\n'+ind(d+1)+ARR+base+';\n'+ind(d)+'}\n';
    return ind(d)+ARR+base+';\n';
  }
  // One special against a certain base → single ternary:
  //   (($_POST['proff_appeared']=='A') || ($graduationtimeStr >= $proftimeStr)) ? $graduationtimeStr : $proftimeStr
  if(sp.length===1 && base!==null && !baseGuard){
    var s=sp[0], b=base;
    if(chain.length>1){ o+=ind(d)+D2+' = '+base+';\n'; b=D2; }
    var cmp='('+b+' >= '+s.v+')';
    return o+ind(d)+ARR+(s.f?'('+appeared(s.f)+' || '+cmp+')':cmp)+' ? '+b+' : '+s.v+';\n';
  }
  // General: running max, skipping Appeared levels; push only when a date exists.
  var maybeEmpty=(base===null||!!baseGuard);
  o+=ind(d)+D2+' = '+(base===null?"''":(baseGuard?'('+baseGuard+') ? ('+base+") : ''":base))+';\n';
  for(var i=0;i<sp.length;i++){
    var c=[];
    if(sp[i].f) c.push("$_POST['"+sp[i].f+"']!='A'");
    c.push(maybeEmpty?'('+D2+"=='' || "+sp[i].v+' > '+D2+')':sp[i].v+' > '+D2);
    o+=ind(d)+'if('+c.join(' && ')+'){\n'+ind(d+1)+D2+' = '+sp[i].v+';\n'+ind(d)+'}\n';
  }
  if(maybeEmpty) o+=ind(d)+'if('+D2+"!=''){\n"+ind(d+1)+ARR+D2+';\n'+ind(d)+'}\n';
  else o+=ind(d)+ARR+D2+';\n';
  return o;
}

// Emit the qualification-date selection for one eligibility condition block.
// `gconds` (optional) — the OR-group's conditions; enables Appeared/Passed handling.
function genQualSel(idxs,d,gconds){
  var ts=qualTimestamps(idxs);
  if(!ts.length) return '';
  var plan=planQual(idxs,gconds);
  if(plan.ap) return genQualSelAP(plan,d);
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

// Emit only the per-post blocks inside the WE dynamic section. Returns
// {blocks:string, neededTs:{tsVar->idx}} so the caller can union neededTs
// across branches and emit strtotime decls once. `single` is explicit.
// `arrSuffix` (optional) — forwarded to buildCondGroupLine for the internal branch.
function emitWEChain(posts, single, arrSuffix){
  var sfxOpts=arrSuffix?{arrSuffix:arrSuffix}:undefined;
  var parts=posts.filter(function(p){return p.postQuali;})
                 .sort(function(a,b){return +a.postcode - +b.postcode;});
  if(!parts.length) return {blocks:'', neededTs:{}};

  var neededTs={};
  var blocks='', anyBlock=false;
  function record(idxs,gconds){
    var ts=qualTimestamps(idxs), plan=planQual(idxs,gconds);
    if(plan.ap) ts=planTimestamps(plan);
    for(var t=0;t<ts.length;t++)neededTs[ts[t]]=tsIdxOf(ts[t]);
  }

  for(var pi=0;pi<parts.length;pi++){
    var post=parts[pi];
    var d=single?1:2;
    var postBlocks='';

    var catBlock='';
    var cat=getCatValues(post);
    if(cat) catBlock+=buildGradeMarkPer(cat,d);

    for(var gi=0;gi<post.orGroups.length;gi++){
      var gconds=post.orGroups[gi].conditions;
      if(!gconds.length) continue;
      var gidxs=eduIdxsOf(gconds);
      if(!qualTimestamps(gidxs).length) continue;
      if(postBlocks) postBlocks+='\n';
      var s=ind(d)+'if(\n';
      for(var ci=0;ci<gconds.length;ci++)
        s+=ind(d+1)+buildCondGroupLine(gconds[ci],post,single,gconds,sfxOpts)+(ci<gconds.length-1?' &&':'')+'\n';
      s+=ind(d)+') {\n';
      s+=genQualSel(gidxs,d+1,gconds);
      s+=ind(d)+'}\n';
      postBlocks+=s;
      record(gidxs,gconds);
    }
    if(!postBlocks) continue;
    if(!single) blocks+=ind(1)+(anyBlock?'else if':'if')+'('+dimCond(post,{useVar:true,inline:true})+') {\n';
    anyBlock=true;
    blocks+=catBlock;
    blocks+=postBlocks;
    if(!single) blocks+=ind(1)+'}\n';
    if(pi<parts.length-1) blocks+='\n';
  }
  return {blocks:blocks, neededTs:neededTs};
}

function genWorkExpDetails(posts){
  annotateCondNames(posts,getStreamData(posts,DEGREE_AXIS),DEGREE_AXIS);
  annotateCondNames(posts,getStreamData(posts,STREAM_AXIS),STREAM_AXIS);
  var single=posts.length===1;

  var result=emitWEChain(posts,single);
  if(!Object.keys(result.neededTs).length) return '';

  var decls='';
  var ordered=Object.keys(result.neededTs).sort(function(a,b){return result.neededTs[a]-result.neededTs[b];});
  for(var i=0;i<ordered.length;i++){
    var idx=result.neededTs[ordered[i]];
    decls+=ind(1)+ordered[i]+" = strtotime($_POST['selyr"+idx+"'].'-'.$_POST['selmonth"+idx+"'].'-'.$_POST['selday"+idx+"']);\n";
  }

  var dyn='';
  if(!single) dyn+=assignDeclares(1);
  dyn+=decls+'\n'+result.blocks;

  return WE_HEAD+dyn+WE_TAIL;
}

  // ── exports to App ──
  App.WE_HEAD = WE_HEAD;
  App.WE_TAIL = WE_TAIL;
  App.eduIdxsOf = eduIdxsOf;
  App.emitWEChain = emitWEChain;
  App.genQualSel = genQualSel;
  App.genWorkExpDetails = genWorkExpDetails;
  App.qualTimestamps = qualTimestamps;
  App.tsIdxOf = tsIdxOf;
})(window.App = window.App || {});
