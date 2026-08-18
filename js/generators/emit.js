/* Eligibility Code Generator — module: generators/emit.js — array-emit helpers + edu_details_lang.php
   Part of the namespaced App.* module set. Logic is unchanged from the
   original single-file version; only wrapped for modular loading. */
(function(App){
  // ── imports from App ──
  var getAllRadios = App.getAllRadios;
  var ind = App.ind;
  var rLk = App.rLk;

// Order entries for emission. When `order` (a list of subject VALUES in requirement
// order) is given, entries follow that order; otherwise they fall back to key order.
// In both cases 'Others' (01) and 'Equivalent' (99) are forced to the end.
function sortEnts(ents,order){
  if(order&&order.length){
    var rank={}; for(var i=0;i<order.length;i++) if(rank[order[i]]===undefined) rank[order[i]]=i;
    return ents.sort(function(a,b){
      if(a[0]==='01') return 1; if(b[0]==='01') return -1;
      if(a[0]==='99') return 1; if(b[0]==='99') return -1;
      var ra=rank[a[1]], rb=rank[b[1]];
      if(ra===undefined&&rb===undefined) return a[0].localeCompare(b[0]);
      if(ra===undefined) return 1; if(rb===undefined) return -1;
      return ra-rb;
    });
  }
  return ents.sort(function(a,b){
    if(a[0]==='01') return 1; if(b[0]==='01') return -1;
    if(a[0]==='99') return 1; if(b[0]==='99') return -1;
    return a[0].localeCompare(b[0]);
  });
}
function emitArr(lhs,sm,order){
  var o=ind(1)+lhs+' = array(\n';
  var ents=sortEnts(Object.entries(sm),order);
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
// Merged subject-VALUE order across cond slots (requirement order, first-seen),
// so a merged base array follows the sheet order rather than global-key order.
function mergedOrder(condSlots){
  var order=[],seen={};
  for(var i=0;i<condSlots.length;i++){
    var subs=condSlots[i].subjects||[];
    for(var j=0;j<subs.length;j++) if(!seen[subs[j]]){seen[subs[j]]=true;order.push(subs[j]);}
  }
  return order;
}

function genLangFile(posts){
  var o='';
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
        // Strip the "Select/Choose Yes / No (Should be Yes)" instruction as ONE unit so the
        // leading verb (Select/Choose) is consumed together with the Yes/No phrase — otherwise
        // removing "Yes / No..." first leaves an orphan "Select" behind.
        .replace(/\s*(select|choose)?\s*yes\s*(\/|\\|or)\s*no\s*(should\s*be\s*(yes|no))?\.?/gi,'')
        .replace(/should\s*be\s*(yes|no)\.?/gi,'')
        // Final guard: drop a dangling trailing "Select"/"Choose" (keeps a preceding "?").
        .replace(/\s+\b(select|choose)\b\s*$/i,'')
        .replace(/\s+/g,' ').trim();
      o+="$LANG['"+lk+"'] = '"+q.replace(/'/g,"\\'")+"';\n";
    }
  }
  return o;
}

  // ── exports to App ──
  App.buildMergedSM = buildMergedSM;
  App.mergedOrder = mergedOrder;
  App.emitArr = emitArr;
  App.genLangFile = genLangFile;
  App.sortEnts = sortEnts;
})(window.App = window.App || {});
