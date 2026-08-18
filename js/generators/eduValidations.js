/* Eligibility Code Generator — module: generators/eduValidations.js — edu_validations.php
   Part of the namespaced App.* module set. Logic is unchanged from the
   original single-file version; only wrapped for modular loading. */
(function(App){
  // ── imports from App ──
  var EDU = App.EDU;
  var EDU_ORDER = App.EDU_ORDER;
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

// Collect the ordered list of PHP global variable names needed by checkDOPassing
// for a given set of posts. Callers can pass combined normal+internal posts for a
// union global list. Returns array starting with ['$errmsgarr','$LANG',...].
// `suffixes` (optional array, default ['']) — emits a global declaration for each
// suffix variant of each array name. Pass ['','_internal'] from the branched generator
// so both $arrX and $arrX_internal are declared in the global list.
function collectGlobalVars(posts, suffixes){
  var sfxList=suffixes&&suffixes.length?suffixes:[''];
  var globalVarsSeen={'$errmsgarr':true,'$LANG':true};
  var globalVars=['$errmsgarr','$LANG'];
  function addGlobal(vn){if(!globalVarsSeen[vn]){globalVarsSeen[vn]=true;globalVars.push(vn);}}
  function addAxisGlobals(lvl,def,AX){
    if(!def||!def[AX.has]) return;
    var requireVals=(AX.key==='degree');
    var condNamesSeen={}, any=false;
    for(var pi=0;pi<posts.length;pi++)
      for(var gi=0;gi<posts[pi].orGroups.length;gi++){
        var conds=posts[pi].orGroups[gi].conditions;
        for(var ci=0;ci<conds.length;ci++){
          var c=conds[ci];
          if(c.type!=='edu'||c.level!==lvl) continue;
          var vals=c[AX.vals];
          if(requireVals && (!vals||!vals.length)) continue;
          condNamesSeen[c[AX.cond]||'']=true; any=true;
        }
      }
    if(!any) return;
    var condNKeys=Object.keys(condNamesSeen).filter(function(k){return k!=='';}).sort();
    for(var si=0;si<sfxList.length;si++){
      var sfx=sfxList[si];
      for(var ki=0;ki<condNKeys.length;ki++) addGlobal('$'+def[AX.arr]+sfx+condNKeys[ki]);
      addGlobal('$'+def[AX.arr]+sfx);
    }
  }
  for(var li=0;li<EDU_ORDER.length;li++){
    var lvl=EDU_ORDER[li];
    var def=EDU[lvl];
    addAxisGlobals(lvl,def,DEGREE_AXIS);
    addAxisGlobals(lvl,def,STREAM_AXIS);
  }
  return globalVars;
}

// Emit only the per-post if/else-if chain inside checkDOPassing (no function
// head/tail, no assignDeclares). `single` is explicit for branched callers.
// `arrSuffix` (optional) — forwarded to buildCondGroupLine so array references use
// the suffixed name (e.g. '_internal') in the internal-candidate branch.
function emitValChain(posts, single, arrSuffix){
  // checkDOPassing picks a branch's date cutoff, not eligibility acceptance — a
  // candidate who has only Appeared (result pending) must not match here, so AP
  // conditions are gated on Passed only (apPassedOnly), never Appeared-OR-Passed.
  var sfxOpts={apPassedOnly:true};
  if(arrSuffix) sfxOpts.arrSuffix=arrSuffix;
  var sortedPosts=posts.slice().sort(function(a,b){return +a.postcode - +b.postcode;});
  var o='';
  var anyPostBlock=false;
  for(var pi=0;pi<sortedPosts.length;pi++){
    var post=sortedPosts[pi];
    var grps=post.orGroups.filter(function(g){
      return g.conditions.some(function(c){return c.type==='edu';});
    });
    if(!grps.length) continue;

    if(!single){
      o+=ind(1)+(anyPostBlock?'} else if':' if')+'('+dimCond(post,{postArr:true,inline:true})+'){\n';
      anyPostBlock=true;
    }

    var d=single?1:2;
    var cat=getCatValues(post);
    if(cat) o+=buildGradeMarkPer(cat,d);

    var firstGrp=true;
    for(var gi=0;gi<grps.length;gi++){
      var grp=grps[gi];
      var allConds=grp.conditions;
      var condParts=[];
      for(var ci=0;ci<allConds.length;ci++){
        condParts.push(buildCondGroupLine(allConds[ci],post,single,allConds,sfxOpts));
      }
      var idxSeen={};
      for(var ci=0;ci<allConds.length;ci++){
        var c=allConds[ci];
        if(c.type!=='edu') continue;
        var def=EDU[c.level];
        if(def) idxSeen[def.idx]=true;
      }
      var idxList=Object.keys(idxSeen).map(Number).sort(function(a,b){return a-b;});

      o+=ind(d)+(firstGrp?'if':'} else if')+'(\n';
      for(var ci=0;ci<condParts.length;ci++){
        o+=ind(d+1)+condParts[ci]+(ci<condParts.length-1?' &&':'')+' \n';
      }
      o+=ind(d)+') {\n';

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

    o+=ind(d)+'} else{ \n';
    o+=ind(d+1)+"$QUALIFICATION_AS_ON_YEAR = date('Y');\n";
    o+=ind(d+1)+"$QUALIFICATION_AS_ON_MONTH = date('m');\n";
    o+=ind(d+1)+"$QUALIFICATION_AS_ON_DAY = date('d');\n";
    o+=ind(d)+'}\t\n';
  }

  if(!single&&anyPostBlock){
    o+=ind(1)+'} else { \n';
    o+=ind(2)+"$QUALIFICATION_AS_ON_YEAR = date('Y');\n";
    o+=ind(2)+"$QUALIFICATION_AS_ON_MONTH = date('m');\n";
    o+=ind(2)+"$QUALIFICATION_AS_ON_DAY = date('d');\n";
    o+=ind(1)+'}\t\n';
  }
  return o;
}

function genEduValidations(posts){
  // Annotate BOTH axes so buildCondLine can reference each axis's _condN suffix.
  annotateCondNames(posts,getStreamData(posts,DEGREE_AXIS),DEGREE_AXIS);
  annotateCondNames(posts,getStreamData(posts,STREAM_AXIS),STREAM_AXIS);

  var globalVars=collectGlobalVars(posts);
  var single=posts.length===1;

  var o=ind(0)+'function checkDOPassing($field_number,$row_name,$col_name){\n';
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

  if(!single) o+=assignDeclares(1)+'\n';

  o+=emitValChain(posts,single);

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
  return o;
}

  // ── exports to App ──
  App.collectGlobalVars = collectGlobalVars;
  App.emitValChain = emitValChain;
  App.genEduValidations = genEduValidations;
})(window.App = window.App || {});
