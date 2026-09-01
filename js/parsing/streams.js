/* Eligibility Code Generator — module: parsing/streams.js — stream-key registry + condition-name annotation
   Part of the namespaced App.* module set. Logic is unchanged from the
   original single-file version; only wrapped for modular loading. */
(function(App){
  // ── imports from App ──
  var EDU = App.EDU;
  var isCat = App.isCat;
  var parseCatMark = App.parseCatMark;
  var dimVals = App.dimVals;
  var dimPath = App.dimPath;
  var dimPathVars = App.dimPathVars;
  var comboKey = App.comboKey;
  var isLegacyDims = App.isLegacyDims;

// ── AXIS DESCRIPTORS ────────────────────────────────────────────────────────
// A qualification "axis" is one of the two independent value columns a level can
// carry: the Subject/Stream axis and the Degree axis. Both run through the SAME
// registry / cond-name / array-emit pipeline; they differ only in which condition
// property holds the values, which EDU.* fields name the PHP variable & POST field,
// and which condition property stores the computed _condN suffix.
//   STREAM_AXIS — the legacy axis. All single-arg callers default to this so existing
//                 Stream-only behaviour is byte-identical.
//   DEGREE_AXIS — the additive axis (arr<Level>_Degree / seldegree<idx>).
var STREAM_AXIS={key:'stream', vals:'subjects', any:'anyStream', has:'hasStream', arr:'stream', sel:'ss', cond:'condName'};
var DEGREE_AXIS={key:'degree', vals:'degrees',  any:'anyDegree', has:'hasDegree', arr:'degree', sel:'sd', cond:'degreeCondName'};
function axisOf(a){ return a||STREAM_AXIS; }

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

function getStreamData(posts, axis){
  var AX=axisOf(axis);
  var out={};

  // Step 1: build global subject→key registry per level
  // Process posts in postcode order, then OR groups in order
  var sortedPosts=posts.slice().sort(function(a,b){return +a.postcode - +b.postcode;});
  var globalKeyReg={}; // level -> {subjValue -> key, nextSeq}

  function getGlobalKey(level, subjValue){
    // Exact match only (mirrors buildSM below) — a subject cell whose entire
    // value IS the standalone catch-all word ("Others" / "Equivalent") gets the
    // shared sentinel key. A substring test here would also fire on any longer,
    // legitimate value that merely CONTAINS that word (e.g. a certification named
    // "... / Equivalent React JS certification"), silently colliding it with
    // every other such value onto the same key and dropping all but the last.
    var sl=subjValue.trim().toLowerCase();
    if(sl==='others'||sl==='other')   return '01';
    if(sl==='equivalent')             return '99';
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
        var vals=c[AX.vals];
        if(!def||!def[AX.has]||!vals||!vals.length) continue;
        for(var si2=0;si2<vals.length;si2++) getGlobalKey(c.level, vals[si2]);
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
        var vals=c[AX.vals];
        if(!def||!def[AX.has]||!vals||!vals.length) continue;
        var subjKey=vals.join('|');
        if(!levelSets[c.level]) levelSets[c.level]=[];
        var found=false;
        for(var j=0;j<levelSets[c.level].length;j++) if(levelSets[c.level][j].subjKey===subjKey){found=true;break;}
        if(!found) levelSets[c.level].push({subjKey:subjKey,subjects:vals});
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
        // A slot collects every dimension COMBINATION whose subject set + cond
        // name match. combos holds the full value arrays; postcodes keeps the
        // first-dimension codes for the legacy single-post sorting/grouping.
        // `subjects` keeps the exact requirement order for this array, used so the
        // emitted entries follow the sheet's listed order rather than global-key order.
        if(!slot){slot={key:key,nk:nk,sm:sm,condName:cn,subjects:sets[si].subjects.slice(),combos:[],postcodes:[]};out[level].push(slot);}
        var vals=dimVals(post), ck=comboKey(vals);
        var has=false;
        for(var jc=0;jc<slot.combos.length;jc++) if(comboKey(slot.combos[jc])===ck){has=true;break;}
        if(!has){slot.combos.push(vals); slot.postcodes.push(post.postcode);}
      }
    }
  }

  return out;
}

// First-seen subject/degree VALUE order for ONE post's OR-groups at a given
// level+axis, walked in parsed sheet order. Used to order the merged base
// array independently of any other post's ordering. 'Others'/'Equivalent'
// need not be included — sortEnts forces them last.
function postAxisOrder(post, level, axis){
  var AX=axisOf(axis);
  var order=[], seen={};
  if(!post) return order;
  for(var gi=0;gi<post.orGroups.length;gi++){
    var conds=post.orGroups[gi].conditions;
    for(var ci=0;ci<conds.length;ci++){
      var c=conds[ci];
      if(c.type!=='edu'||c.level!==level) continue;
      var vals=c[AX.vals];
      if(!vals) continue;
      for(var si=0;si<vals.length;si++)
        if(!seen[vals[si]]){seen[vals[si]]=true; order.push(vals[si]);}
    }
  }
  return order;
}

function annotateCondNames(posts,sd,axis){
  var AX=axisOf(axis);
  for(var pi=0;pi<posts.length;pi++){
    var post=posts[pi];
    var levelSets={};
    for(var gi=0;gi<post.orGroups.length;gi++){
      var conds=post.orGroups[gi].conditions;
      for(var ci=0;ci<conds.length;ci++){
        var c=conds[ci];
        if(c.type!=='edu') continue;
        var def=EDU[c.level];
        var vals=c[AX.vals];
        if(!def||!def[AX.has]||!vals||!vals.length){c[AX.cond]='';continue;}
        var sk=vals.join('|');
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
        var vals=c[AX.vals];
        if(!def||!def[AX.has]||!vals||!vals.length){c[AX.cond]='';continue;}
        var sk=vals.join('|');
        var sets=levelSets[c.level]||[];
        var idx=sets.indexOf(sk);
        c[AX.cond]=sets.length>1?'_cond'+(idx+1):'';
      }
    }
  }
}

// PHP reference to a stream array for a given post's dimension combination.
//   single post           -> "$arrX"                    (no subscript)
//   legacy (1 dim/postcode)-> "$arrX[$postcode]"         (variable subscript, byte-compatible)
//   N dimensions          -> "$arrX[$postcode][$recrtmnt_mode]"  (variable subscripts)
// Variable subscripts are used for N-dim so generated conditions reference the
// PHP variables declared at the top of the file by assignDeclares(), not hardcoded
// literal keys. This means the generated array lookup correctly uses the runtime
// submitted POST values rather than a fixed combination from parse time.
// `suffix` is an optional string appended to the array name before the subscript
//   (e.g. '_internal') — used by the internal-candidate branch so conditions
//   reference $arrGraduation_Stream_internal instead of $arrGraduation_Stream.
function arrRef(def,condName,single,post,axis,suffix){
  var AX=axisOf(axis);
  var base='$'+def[AX.arr]+(suffix||'')+(condName||'');
  if(single) return base;
  if(isLegacyDims()) return base+'[$postcode]';
  return base+dimPathVars();
}

function getAllRadios(post){
  var seen={},out=[];
  for(var gi=0;gi<post.orGroups.length;gi++){
    var conds=post.orGroups[gi].conditions;
    for(var ci=0;ci<conds.length;ci++){
      var c=conds[ci];
      // De-dupe by fieldName (the generation identity), not raw question text —
      // duplicate questions that differ only in spacing/punctuation share one
      // fieldName (see disambiguateRadioNames) and must collapse to a single entry
      // here too, so downstream generators never emit them twice.
      if(c.type==='radio'&&!seen[c.fieldName]){seen[c.fieldName]=true;out.push(c);}
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

  // ── exports to App ──
  App.STREAM_AXIS = STREAM_AXIS;
  App.DEGREE_AXIS = DEGREE_AXIS;
  App.annotateCondNames = annotateCondNames;
  App.arrRef = arrRef;
  App.buildSM = buildSM;
  App.getAllRadios = getAllRadios;
  App.getCatValues = getCatValues;
  App.getStreamData = getStreamData;
  App.postAxisOrder = postAxisOrder;
})(window.App = window.App || {});
