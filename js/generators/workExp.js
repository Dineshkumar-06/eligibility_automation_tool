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
var WE_HEAD = atob('PD9waHAKICAJCmlmKFBPU1RfUVVBTElGSUNBVElPTl9FWFApewovKiAgc3dpdGNoKCRfUE9TVFsncG9zdGNvZGUnXSl7CgkJZGVmYXVsdDoKCQkJJGVkdWRheSA9JF9QT1NUWydzZWxkYXkzJ107CgkJICAgICRlZHVtb250aD0kX1BPU1RbJ3NlbG1vbnRoMyddOy8vLUNoYW5nZSB0aGUgdmFyaWFibGUgaW5pdGlhbGl6YXRpb24gYXMgcGVyIHRoZSByZXF1aXJlbWVudDsKCQkJJGVkdXllYXI9JF9QT1NUWydzZWx5cjMnXTsvLy1DaGFuZ2UgdGhlIHZhcmlhYmxlIGluaXRpYWxpemF0aW9uIGFzIHBlciB0aGUgcmVxdWlyZW1lbnQ7CQoJCQkkZXhwX21zZ19jb250ZW50ID0gJ0VkdWNhdGlvbmFsIHF1YWxpZmljYXRpb24gZGF0ZSBvZiBwYXNzaW5nICc7CgkJYnJlYWs7Cgl9ICovCgo=');

var WE_TAIL = atob('aWYoaXNfYXJyYXkoJGVsaWdpYmlsaXR5UG9zdFF1YWxpZHRBcnIpKXsKCQlpZihjb3VudCgkZWxpZ2liaWxpdHlQb3N0UXVhbGlkdEFycikgPiAwKXsKCQkkcG9zdFF1YWxpZmlNaW4gPSBtaW4oJGVsaWdpYmlsaXR5UG9zdFF1YWxpZHRBcnIpOwoJCSRwb3N0UXVhbGlmaU1pbkR0ID0gZGF0ZSgnWS1tLWQnLCRwb3N0UXVhbGlmaU1pbik7CgkJJHBvc3RRdWFsaWZpTWluRHRBcnIgPSBleHBsb2RlKCItIiwkcG9zdFF1YWxpZmlNaW5EdCk7CgkJCgkJJGVkdWRheSA9ICRwb3N0UXVhbGlmaU1pbkR0QXJyWzJdOwoJCSRlZHVtb250aCA9ICRwb3N0UXVhbGlmaU1pbkR0QXJyWzFdOwoJCSRlZHV5ZWFyID0gJHBvc3RRdWFsaWZpTWluRHRBcnJbMF07CgkJJGV4cF9tc2dfY29udGVudCA9ICdFZHVjYXRpb25hbCBxdWFsaWZpY2F0aW9uIGRhdGUgb2YgcGFzc2luZyAnOwoJfQoJfQoKfWVsc2V7CgkkZWR1bW9udGggPSAkZG9ibW9udGg7Ly9kb2IgbW9udGgKCSRlZHV5ZWFyID0gJGRvYnllYXI7Ly9kb2IgbW9udGgKCSRleHBfbXNnX2NvbnRlbnQgPSAnRGF0ZSBPZiBCaXJ0aCAnOwp9');

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
  function record(idxs){var ts=qualTimestamps(idxs);for(var t=0;t<ts.length;t++)neededTs[ts[t]]=tsIdxOf(ts[t]);}

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
      s+=genQualSel(gidxs,d+1);
      s+=ind(d)+'}\n';
      postBlocks+=s;
      record(gidxs);
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
