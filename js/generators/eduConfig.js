/* Eligibility Code Generator — module: generators/eduConfig.js — edu_config.php
   Part of the namespaced App.* module set. Logic is unchanged from the
   original single-file version; only wrapped for modular loading. */
(function(App){
  // ── imports from App ──
  var EDU = App.EDU;
  var EDU_ORDER = App.EDU_ORDER;
  var annotateCondNames = App.annotateCondNames;
  var buildMergedSM = App.buildMergedSM;
  var mergedOrder = App.mergedOrder;
  var emitArr = App.emitArr;
  var getAllRadios = App.getAllRadios;
  var getStreamData = App.getStreamData;
  var postAxisOrder = App.postAxisOrder;
  var STREAM_AXIS = App.STREAM_AXIS;
  var DEGREE_AXIS = App.DEGREE_AXIS;
  var ind = App.ind;
  var rFn = App.rFn;
  var rLk = App.rLk;
  var sbYes = App.sbYes;
  var sbYesNo = App.sbYesNo;
  var sbNo = App.sbNo;
  var dimVals = App.dimVals;
  var dimPath = App.dimPath;
  var comboKey = App.comboKey;
  var isLegacyDims = App.isLegacyDims;
  var buildNested = App.buildNested;
  var arrAdditionSection = App.arrAdditionSection;

// Emit one stream array (sm) assigned to every combination in `combos`.
//   single post           -> "$arrX = array(...);"
//   single post           -> "$arrX = array(...);"
//   legacy / 1-dim        -> "$arrX['01'] = $arrX['02'] = array(...);" (chained, byte-compatible)
//   N dimensions          -> every sharing combination chained into ONE declaration,
//                            one LHS per line, then the array literal:
//                            "$arrX['01']['02']
//                            \t= $arrX['02']['02']
//                            \t= $arrX['03']['02'] = array(...);"
// All combinations that share the same stream values are emitted together in a
// single declaration — no later reassignment / reference statements are produced.
// `combos` is a list of dimension-value arrays; they are sorted by the caller.
// `order` (optional) is the subject-value sequence from the requirement; entries
// are emitted in that order so the array mirrors the sheet's listed subject order.
function emitForCombos(base, combos, sm, single, order){
  if(single) return emitArr(base, sm, order);
  if(isLegacyDims()){
    var lhs=combos.map(function(c){return base+dimPath(c);}).join(' = ');
    return emitArr(lhs, sm, order);
  }
  // N-dimensional: chain all sharing combinations into one declaration. The first
  // LHS sits inline; each subsequent LHS goes on its own continuation line.
  var lhsN=base+dimPath(combos[0]);
  for(var i=1;i<combos.length;i++) lhsN+='\n'+ind(2)+'= '+base+dimPath(combos[i]);
  return emitArr(lhsN, sm, order);
}
// Sort a list of dimension-value combos by each dimension value in order.
function sortCombos(combos){
  return combos.slice().sort(function(a,b){
    for(var i=0;i<Math.max(a.length,b.length);i++){
      var d=(+a[i]||0)-(+b[i]||0); if(d) return d;
    }
    return 0;
  });
}
// Post whose dimension combination equals `combo` (first match, deterministic).
// Legacy combos are [postcode] and dimVals of a legacy post is [postcode], so
// this works for both the legacy and N-dim paths.
function postForCombo(posts, combo){
  var ck=comboKey(combo);
  for(var pi=0;pi<posts.length;pi++)
    if(comboKey(dimVals(posts[pi]))===ck) return posts[pi];
  return null;
}

function genEduConfig(posts){
  var single=posts.length===1;
  var o='<?PHP\n'+ind(1)+'/***********************************************Edu Config ***************************************************************/\n\n';

  // Emit every value array for ONE axis (Degree or Subject/Stream). Identical code
  // path for both; only the axis descriptor (which condition values, which EDU array
  // name, which _condN suffix, which comment label) differs. Degree is emitted first
  // and Stream second, mirroring the sheet's column order (Degree, then Stream).
  // The Stream axis reproduces the legacy output verbatim, so a Degree-less sheet is
  // byte-identical to before.
  o+=emitAxisArrays(posts,DEGREE_AXIS,single);
  o+=emitAxisArrays(posts,STREAM_AXIS,single);

  return o+emitDependentsAndRadios(posts,single);
}

// The axis label shown in the `// <Level> Stream` / `// <Level> Degree` comments.
var AXIS_LABEL={stream:'Stream', degree:'Degree'};

// suffix: optional string appended to each array name (e.g. '_internal').
// When omitted (or ''), behaviour is identical to before.
function emitAxisArrays(posts,AX,single,suffix){
  var sfx=suffix||'';
  var sd=getStreamData(posts,AX);
  annotateCondNames(posts,sd,AX);
  var o='';
  for(var li=0;li<EDU_ORDER.length;li++){
    var lvl=EDU_ORDER[li];
    if(!sd[lvl]) continue;
    var def=EDU[lvl];
    if(!def[AX.has]) continue;
    var slots=sd[lvl];
    o+=ind(1)+'// '+lvl+' '+AXIS_LABEL[AX.key]+'\n';

    var condSlots=[],plainSlots=[];
    for(var si=0;si<slots.length;si++){
      slots[si].combos=sortCombos(slots[si].combos);
      if(slots[si].condName) condSlots.push(slots[si]);
      else plainSlots.push(slots[si]);
    }
    // sort slots by their first (lowest) combination
    function firstCombo(s){return s.combos[0]||[];}
    function cmpCombo(a,b){
      for(var i=0;i<Math.max(a.length,b.length);i++){var d=(+a[i]||0)-(+b[i]||0);if(d)return d;}
      return 0;
    }
    condSlots.sort(function(a,b){return cmpCombo(firstCombo(a),firstCombo(b));});
    plainSlots.sort(function(a,b){return cmpCombo(firstCombo(a),firstCombo(b));});

    var base='$'+def[AX.arr]+sfx;

    // emit _condN arrays
    for(var si=0;si<condSlots.length;si++){
      var sl=condSlots[si];
      o+=emitForCombos('$'+def[AX.arr]+sfx+sl.condName, sl.combos, sl.sm, single, sl.subjects);
    }

    // emit merged base array for combinations with _condN (union of their subjects).
    if(condSlots.length>0){
      if(isLegacyDims()){
        // Legacy single-dimension path — reproduced verbatim from the original
        // (object-keyed) algorithm, including its reliance on JS for-in key order
        // (canonical integer keys like '10' are visited before zero-padded ones
        // like '09'), so the emitted chaining order is byte-identical.
        var condPcs={};
        for(var si=0;si<condSlots.length;si++)
          for(var j=0;j<condSlots[si].combos.length;j++) condPcs[condSlots[si].combos[j][0]]=true;
        var mGroups=[];
        for(var pc in condPcs){
          var mySl=condSlots.filter(function(s){return s.combos.some(function(c){return c[0]===pc;});});
          var msm=buildMergedSM(mySl),mnk=JSON.stringify(msm);
          var found=false;
          for(var j=0;j<mGroups.length;j++) if(mGroups[j].mnk===mnk){mGroups[j].pcs.push(pc);found=true;break;}
          if(!found) mGroups.push({mnk:mnk,sm:msm,order:mergedOrder(mySl),pcs:[pc]});
        }
        mGroups.sort(function(a,b){return +a.pcs[0] - +b.pcs[0];});
        for(var j=0;j<mGroups.length;j++){
          var lowPc=mGroups[j].pcs.slice().sort(function(a,b){return +a-+b;})[0];
          var lp=postForCombo(posts,[lowPc]);
          var ord=lp?postAxisOrder(lp,lvl,AX):mGroups[j].order;
          o+=emitForCombos(base, mGroups[j].pcs.map(function(p){return [p];}), mGroups[j].sm, single, ord);
        }
      } else {
        // N-dimensional path — collect combinations in slot order, then sort each
        // merged group for deterministic nested output.
        var condCombos=[], condSeen={};
        for(var si=0;si<condSlots.length;si++)
          for(var j=0;j<condSlots[si].combos.length;j++){
            var cc=condSlots[si].combos[j], ck=comboKey(cc);
            if(!condSeen[ck]){condSeen[ck]=true; condCombos.push(cc);}
          }
        var mGroups=[];
        for(var ci2=0;ci2<condCombos.length;ci2++){
          var cmb=condCombos[ci2], ckey=comboKey(cmb);
          var mySl=condSlots.filter(function(s){return s.combos.some(function(c){return comboKey(c)===ckey;});});
          var msm=buildMergedSM(mySl),mnk=JSON.stringify(msm);
          var found=false;
          for(var j=0;j<mGroups.length;j++) if(mGroups[j].mnk===mnk){mGroups[j].combos.push(cmb);found=true;break;}
          if(!found) mGroups.push({mnk:mnk,sm:msm,order:mergedOrder(mySl),combos:[cmb]});
        }
        for(var j=0;j<mGroups.length;j++) mGroups[j].combos=sortCombos(mGroups[j].combos);
        mGroups.sort(function(a,b){return cmpCombo(a.combos[0],b.combos[0]);});
        for(var j=0;j<mGroups.length;j++){
          var np=postForCombo(posts, mGroups[j].combos[0]);
          var ord=np?postAxisOrder(np,lvl,AX):mGroups[j].order;
          o+=emitForCombos(base, mGroups[j].combos, mGroups[j].sm, single, ord);
        }
      }
    }

    // emit plain slots
    for(var si=0;si<plainSlots.length;si++){
      var sl=plainSlots[si];
      o+=emitForCombos(base, sl.combos, sl.sm, single, sl.subjects);
    }

    // Others placeholder: combinations that DON'T require this level still need an
    // entry for it (the form offers this exam to everyone), so emit
    // array("01"=>"Others") for every dimension combination not already covered.
    if(!single){
      var covered={};
      for(var si=0;si<slots.length;si++)
        for(var j=0;j<slots[si].combos.length;j++) covered[comboKey(slots[si].combos[j])]=true;
      var missing=posts.map(function(p){return dimVals(p);})
        .filter(function(c){return !covered[comboKey(c)];});
      // de-dup combinations (a combo can repeat across posts only on data error)
      var seenM={},missU=[];
      for(var mi=0;mi<missing.length;mi++){var k=comboKey(missing[mi]);if(!seenM[k]){seenM[k]=true;missU.push(missing[mi]);}}
      missU=sortCombos(missU);
      if(missU.length) o+=emitForCombos(base, missU, {'01':'Others'}, single);
    }
    o+='\n';
  }
  return o;
}

// suffix: optional string appended to $arrPostBasedRadioCond (e.g. '_internal').
// When omitted (or ''), behaviour is identical to before.
function emitDependentsAndRadios(posts,single,suffix){
  var sfx=suffix||'';
  var o='';
  // $eligibilityDependents — one entry per variable referenced in eligibility conditions.
  // Order: postcode, then per-level (degree?, subjects?, percentage, grade) in EDU_ORDER
  // sequence, then totexp if any post needs work-exp, then radio field names. Degree
  // precedes subjects, matching the sheet column order and the condition emit order.
  var EDU_PREFIX = {
    'SSC/10th':                         'ssc',
    'HSC/12th':                         'hsc',
    'Graduation':                       'graduation',
    'Post Graduation':                  'postgraduation',
    'Professional Qualification':       'prof',
    'Post Graduation Diploma':          'pgdiploma',
    'Certification':                    'cert',
    'Diploma':                          'diploma',
    'Ph.D':                             'phd',
    'Integrated Dual Degree':           'idd',
    'Others':                           'others'
  };
  var depVars=['postcode'];
  // collect levels actually used across all posts (in EDU_ORDER sequence), and track
  // which levels actually carry Degree values so a Degree dep-var is added only when
  // present (keeps Stream-only sheets' dependents list byte-identical).
  var usedLevels={}, degLevels={};
  for(var pi=0;pi<posts.length;pi++)
    for(var gi=0;gi<posts[pi].orGroups.length;gi++)
      for(var ci=0;ci<posts[pi].orGroups[gi].conditions.length;ci++){
        var dc=posts[pi].orGroups[gi].conditions[ci];
        if(dc.type==='edu'){
          usedLevels[dc.level]=true;
          if((dc.degrees&&dc.degrees.length)||dc.anyDegree) degLevels[dc.level]=true;
        }
      }
  for(var li=0;li<EDU_ORDER.length;li++){
    var lvl=EDU_ORDER[li];
    if(!usedLevels[lvl]) continue;
    var pfx=EDU_PREFIX[lvl]||lvl.toLowerCase().replace(/\s+/g,'');
    var def=EDU[lvl];
    if(def&&def.hasDegree&&degLevels[lvl]) depVars.push(pfx+'degree');
    if(def&&def.hasStream) depVars.push(pfx+'subjects');
    depVars.push(pfx+'percentage');
    depVars.push(pfx+'grade');
  }
  // totexp if any OR-group carries a work-exp requirement
  var needsWE=posts.some(function(p){return p.orGroups.some(function(g){return g.workExp>0;});});
  if(needsWE) depVars.push('totexp');
  // radio field names (de-duped, across all posts)
  var radioSeen={};
  for(var pi=0;pi<posts.length;pi++){
    var radios=getAllRadios(posts[pi]);
    for(var ri=0;ri<radios.length;ri++){
      var fn=rFn(radios[ri],posts[pi].postcode);
      if(!radioSeen[fn]){radioSeen[fn]=true;depVars.push(fn);}
    }
  }
  o+='      // config.php\n';
  o+=ind(1)+'$eligibilityDependents = array('+depVars.map(function(v){return"'"+v+"'";}).join(', ')+');\n\n';

  var rPosts=posts.filter(function(p){return getAllRadios(p).length>0;});
  if(rPosts.length>0){
    // Build the radio-spec entry string for one post.
    function radioEnts(post){
      // A radio is "optional" (Yes or No) when the post has multiple OR groups and
      // the radio does not appear in every one of them — i.e. whether it's required
      // depends on which OR branch the candidate satisfies. Radios present in all
      // groups stay mandatory ('Y' / 'Should be Yes').
      var grpsWithConds=post.orGroups.filter(function(g){return g.conditions.length>0;});
      // Matched by fieldName, not raw question text — duplicate questions that differ
      // only in spacing/punctuation share one fieldName (disambiguateRadioNames) and
      // must still be recognised as "the same radio" in every OR-group.
      function radioInEveryGroup(fn){
        return grpsWithConds.every(function(g){
          return g.conditions.some(function(c){return c.type==='radio'&&c.fieldName===fn;});
        });
      }
      return getAllRadios(post).map(function(r){
        var shouldbe, msg;
        if(r.shouldBe==='N'){
          // Explicit "Should be No" — must be answered N (overrides the optional path).
          shouldbe='N'; msg=sbNo();
        } else {
          var optional=grpsWithConds.length>1&&!radioInEveryGroup(r.fieldName);
          shouldbe=optional?'Y,N':'Y';
          msg=optional?sbYesNo():sbYes();
        }
        return "array('label' => '"+rLk(r,post.postcode)+"', 'field' => '"+rFn(r,post.postcode)+"', 'shouldbe' => '"+shouldbe+"', 'validate_msg' => '"+msg+"')";
      }).join(', ');
    }
    // $arrPostBasedRadioCond is ALWAYS emitted as ONE complete nested array literal,
    // nested by the full dimension combination in sheet order. It is never split into
    // per-combination assignments or reference chains, at any dimensionality.
    var items=[];
    for(var pi=0;pi<rPosts.length;pi++){
      var post=rPosts[pi];
      items.push({vals:dimVals(post), ents:radioEnts(post)});
    }
    // N-dim: sort by combination for stable, ordered nesting. Legacy keeps post order
    // (already ascending by postcode) to stay byte-identical with the original.
    if(!isLegacyDims()) items.sort(function(a,b){
      for(var i=0;i<Math.max(a.vals.length,b.vals.length);i++){
        var d=(+a.vals[i]||0)-(+b.vals[i]||0); if(d) return d;
      }
      return 0;
    });

    var entries=items.map(function(it){
      return {vals:it.vals, render:function(){return 'array('+it.ents+')';}};
    });
    o+=buildNested('arrPostBasedRadioCond'+sfx, entries, 1);
    o+='\n';
  }
  o+='      // edu_qry_arrays.php\n';
  o+=arrAdditionSection(posts)+'\n';
  o+='?>';
  return o;
}

  // ── exports to App ──
  App.emitAxisArrays = emitAxisArrays;
  App.emitDependentsAndRadios = emitDependentsAndRadios;
  App.genEduConfig = genEduConfig;
})(window.App = window.App || {});
