/* Eligibility Code Generator — module: generators/internalBranch.js
   Branched generators for Internal / Departmental Candidate Support.
   Each branched generator wraps the per-post chains in:
     if($_POST['<field>'] == 'Y') { internal conditions }
     else                          { normal conditions }
   Shared scaffolding (assignDeclares, global $arr..., neededTs decls,
   dependents/radios tail) is emitted once, outside the if/else. */
(function(App){
  var S = App.S;
  var ind = App.ind;
  var assignDeclares = App.assignDeclares;
  var withCtx = App.withCtx;
  var intField = App.intField;
  var emitPostChain = App.emitPostChain;
  var emitValChain = App.emitValChain;
  var collectGlobalVars = App.collectGlobalVars;
  var emitWEChain = App.emitWEChain;
  var emitAxisArrays = App.emitAxisArrays;
  var emitDependentsAndRadios = App.emitDependentsAndRadios;
  var annotateCondNames = App.annotateCondNames;
  var getStreamData = App.getStreamData;
  var STREAM_AXIS = App.STREAM_AXIS;
  var DEGREE_AXIS = App.DEGREE_AXIS;
  var WE_HEAD = App.WE_HEAD;
  var WE_TAIL = App.WE_TAIL;
  var genLangFile = App.genLangFile;
  var genEduQrySql = App.genEduQrySql;

// When combined post count > 1, both branches use single=false so array refs
// consistently use [$postcode] and assignDeclares is emitted once at the top.
function combinedSingle(normal, internal){
  return (normal.length + internal.length) === 1;
}

// ── eligibity_validation.php ────────────────────────────────────────────────
function genEligibilityBranched(normal, internal, ctxN, ctxI, field){
  var single=combinedSingle(normal,internal);
  var o='<?PHP \n'+ind(1)+'/***********************************************Eligibility Validation ***************************************************************/\t\n\n';
  if(!single) o+=assignDeclares(1)+'\n';

  // Annotate both branches under their own contexts before emitting chains.
  withCtx(ctxN, function(){
    annotateCondNames(normal,getStreamData(normal,DEGREE_AXIS),DEGREE_AXIS);
    annotateCondNames(normal,getStreamData(normal,STREAM_AXIS),STREAM_AXIS);
  });
  withCtx(ctxI, function(){
    annotateCondNames(internal,getStreamData(internal,DEGREE_AXIS),DEGREE_AXIS);
    annotateCondNames(internal,getStreamData(internal,STREAM_AXIS),STREAM_AXIS);
  });

  o+=ind(1)+"if($_POST['"+field+"'] == 'Y') {\n";
  o+=withCtx(ctxI, function(){ return emitPostChain(internal, single, '_internal'); });
  o+=ind(1)+'} else {\n';
  o+=withCtx(ctxN, function(){ return emitPostChain(normal, single); });
  o+=ind(1)+'}\n';
  o+='?>';
  return o;
}

// ── edu_validations.php ──────────────────────────────────────────────────────
function genEduValidationsBranched(normal, internal, ctxN, ctxI, field){
  var single=combinedSingle(normal,internal);
  var allPosts=normal.concat(internal);

  // Annotate both branches.
  withCtx(ctxN, function(){
    annotateCondNames(normal,getStreamData(normal,DEGREE_AXIS),DEGREE_AXIS);
    annotateCondNames(normal,getStreamData(normal,STREAM_AXIS),STREAM_AXIS);
  });
  withCtx(ctxI, function(){
    annotateCondNames(internal,getStreamData(internal,DEGREE_AXIS),DEGREE_AXIS);
    annotateCondNames(internal,getStreamData(internal,STREAM_AXIS),STREAM_AXIS);
  });

  // Union global vars from both branches — include both unsuffixed and _internal variants.
  var globalVars=collectGlobalVars(allPosts, ['', '_internal']);

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

  if(!single) o+=assignDeclares(1)+'\n';

  o+=ind(1)+"if($_POST['"+field+"'] == 'Y') {\n";
  o+=withCtx(ctxI, function(){ return emitValChain(internal, single, '_internal'); });
  o+=ind(1)+'} else {\n';
  o+=withCtx(ctxN, function(){ return emitValChain(normal, single); });
  o+=ind(1)+'}\n';

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

// ── work_exp_details_validations.php ─────────────────────────────────────────
function genWorkExpBranched(normal, internal, ctxN, ctxI, field){
  var single=combinedSingle(normal,internal);

  // Annotate both branches.
  withCtx(ctxN, function(){
    annotateCondNames(normal,getStreamData(normal,DEGREE_AXIS),DEGREE_AXIS);
    annotateCondNames(normal,getStreamData(normal,STREAM_AXIS),STREAM_AXIS);
  });
  withCtx(ctxI, function(){
    annotateCondNames(internal,getStreamData(internal,DEGREE_AXIS),DEGREE_AXIS);
    annotateCondNames(internal,getStreamData(internal,STREAM_AXIS),STREAM_AXIS);
  });

  var resN=withCtx(ctxN, function(){ return emitWEChain(normal, single); });
  var resI=withCtx(ctxI, function(){ return emitWEChain(internal, single, '_internal'); });

  // Union neededTs from both branches.
  var neededTs={};
  var k;
  for(k in resN.neededTs) neededTs[k]=resN.neededTs[k];
  for(k in resI.neededTs) if(neededTs[k]===undefined) neededTs[k]=resI.neededTs[k];

  if(!Object.keys(neededTs).length) return '';

  var decls='';
  var ordered=Object.keys(neededTs).sort(function(a,b){return neededTs[a]-neededTs[b];});
  for(var i=0;i<ordered.length;i++){
    var idx=neededTs[ordered[i]];
    decls+=ind(1)+ordered[i]+" = strtotime($_POST['selyr"+idx+"'].'-'.$_POST['selmonth"+idx+"'].'-'.$_POST['selday"+idx+"']);\n";
  }

  var dyn='';
  if(!single) dyn+=assignDeclares(1);
  dyn+=decls+'\n';

  dyn+=ind(1)+"if($_POST['"+field+"'] == 'Y') {\n";
  dyn+=resI.blocks;
  dyn+=ind(1)+'} else {\n';
  dyn+=resN.blocks;
  dyn+=ind(1)+'}\n';

  return WE_HEAD+dyn+WE_TAIL;
}

// ── edu_config.php ────────────────────────────────────────────────────────────
// Normal and internal arrays are emitted as separate static arrays (no if/else).
// Internal arrays use the '_internal' suffix:
//   $arrGraduation_Stream       <- normal candidates
//   $arrGraduation_Stream_internal  <- internal candidates
//   $arrPostBasedRadioCond          <- normal candidates
//   $arrPostBasedRadioCond_internal <- internal candidates
// Keys are identical across both sets; only the array name differs.
function genEduConfigBranched(normal, internal, ctxN, ctxI, field){
  var singleN=(normal.length===1), singleI=(internal.length===1);
  var o='<?PHP\n'+ind(1)+'/***********************************************Edu Config ***************************************************************/\n\n';

  // Normal candidate arrays (no suffix).
  o+=withCtx(ctxN, function(){
    return emitAxisArrays(normal,DEGREE_AXIS,singleN) + emitAxisArrays(normal,STREAM_AXIS,singleN);
  });

  // Internal candidate arrays (_internal suffix, identical key structure).
  o+=withCtx(ctxI, function(){
    return emitAxisArrays(internal,DEGREE_AXIS,singleI,'_internal') + emitAxisArrays(internal,STREAM_AXIS,singleI,'_internal');
  });

  // $eligibilityDependents, $arrPostBasedRadioCond, arrAdditionSection, and '?>' are
  // emitted once over the union of all posts — they are shared config, not branched.
  var allPosts=normal.concat(internal);
  o+=withCtx(ctxN, function(){ return emitDependentsAndRadios(allPosts, singleN); });
  return o;
}

// ── union generators (lang + SQL) ─────────────────────────────────────────────
// These are called over the combined post list unchanged. Expose as pass-throughs
// so the UI can call them uniformly regardless of branch mode.
function genLangFileBranched(normal, internal){
  return genLangFile(normal.concat(internal));
}
function genEduQrySqlBranched(normal, internal){
  return genEduQrySql(normal.concat(internal));
}

  // ── exports to App ──
  App.genEligibilityBranched = genEligibilityBranched;
  App.genEduValidationsBranched = genEduValidationsBranched;
  App.genWorkExpBranched = genWorkExpBranched;
  App.genEduConfigBranched = genEduConfigBranched;
  App.genLangFileBranched = genLangFileBranched;
  App.genEduQrySqlBranched = genEduQrySqlBranched;
})(window.App = window.App || {});
