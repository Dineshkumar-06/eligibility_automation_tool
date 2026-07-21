/* Eligibility Code Generator — module: parsing/validate.js — post-parse clarification checks
   Non-blocking heuristic checks that run once after parsing completes, before code generation.
   Flags likely-duplicate Subject/Stream and Degree values (case/spacing/punctuation variants)
   for user review. Does not merge or mutate parsed data. */
(function(App){

// Tolerant text normalizer for duplicate detection: lowercase, strip parens/brackets and
// common punctuation to spaces, collapse whitespace. Mirrors the recipe already used by
// matchLevel() in parsing/helpers.js so heuristics stay consistent across the codebase.
function normText(s){
  return String(s||'')
    .toLowerCase()
    .replace(/[()\[\]{}]/g,' ')
    .replace(/[.\-–—_,/&]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

// Gather every raw value for one axis ('subjects' or 'degrees') from all edu conditions
// across all posts, paired with the postcode of the post it came from (so the UI can point
// the user back at where each value lives on the sheet). Skips empties and dash-only
// placeholders (mirrors parseSubs' guard).
function collectAxisValues(posts,axisKey){
  var out=[];
  if(!posts) return out;
  for(var pi=0;pi<posts.length;pi++){
    var post=posts[pi];
    var orGroups=post.orGroups||[];
    for(var gi=0;gi<orGroups.length;gi++){
      var conds=orGroups[gi].conditions||[];
      for(var ci=0;ci<conds.length;ci++){
        var cond=conds[ci];
        if(cond.type!=='edu') continue;
        var vals=cond[axisKey]||[];
        for(var vi=0;vi<vals.length;vi++){
          var v=vals[vi];
          if(!v||/^[\s\-–—]+$/.test(v)) continue;
          out.push({value:v,postcode:post.postcode});
        }
      }
    }
  }
  return out;
}

// Group raw values by normalized form; return only groups with 2+ distinct raw spellings.
// Each returned group is a plain array of the raw strings (unchanged shape, so existing
// consumers/tests using indexOf/length keep working) with an extra `.postcodes` property —
// a map of raw value -> the distinct postcodes it was seen under — for the UI to display.
function findDupGroups(entries){
  var map=new Map();
  for(var i=0;i<entries.length;i++){
    var v=entries[i].value, pc=entries[i].postcode, key=normText(v);
    if(!key) continue;
    if(!map.has(key)) map.set(key,{order:[],postcodes:{}});
    var g=map.get(key);
    if(g.order.indexOf(v)===-1){ g.order.push(v); g.postcodes[v]=[]; }
    if(pc!==undefined&&pc!==null&&g.postcodes[v].indexOf(pc)===-1) g.postcodes[v].push(pc);
  }
  var groups=[];
  map.forEach(function(g){
    if(g.order.length>=2){
      var arr=g.order.slice();
      arr.postcodes=g.postcodes;
      groups.push(arr);
    }
  });
  return groups;
}

// Gather every radio condition across all posts/OR-groups.
function collectRadioConds(posts){
  var out=[];
  if(!posts) return out;
  for(var pi=0;pi<posts.length;pi++){
    var orGroups=posts[pi].orGroups||[];
    for(var gi=0;gi<orGroups.length;gi++){
      var conds=orGroups[gi].conditions||[];
      for(var ci=0;ci<conds.length;ci++)
        if(conds[ci].type==='radio') out.push(conds[ci]);
    }
  }
  return out;
}

// Group radio conditions by normalized question text (App.normRadioQuestion); return
// only groups with 2+ distinct raw spellings, each carrying the fieldName they share
// (disambiguateRadioNames guarantees identical-normalized questions keep one fieldName).
function findRadioDupGroups(conds){
  var normRadioQuestion=App.normRadioQuestion;
  var map=new Map();
  for(var i=0;i<conds.length;i++){
    var c=conds[i], key=normRadioQuestion(c.question);
    if(!key) continue;
    if(!map.has(key)) map.set(key,{texts:[],fieldName:c.fieldName});
    var entry=map.get(key);
    if(entry.texts.indexOf(c.question)===-1) entry.texts.push(c.question);
  }
  var groups=[];
  map.forEach(function(entry){ if(entry.texts.length>=2) groups.push(entry); });
  return groups;
}

// Top-level entry: detect possible duplicate Subject/Stream and Degree values, and
// duplicate radio-button questions (formatting-only variants), across the
// normal-candidate posts and (if present) the internal-candidate posts.
function detectClarifications(posts,internalPosts){
  var allPosts=(posts||[]).concat(internalPosts||[]);
  return {
    stream: findDupGroups(collectAxisValues(allPosts,'subjects')),
    degree: findDupGroups(collectAxisValues(allPosts,'degrees')),
    radio: findRadioDupGroups(collectRadioConds(allPosts))
  };
}

// ── exports to App ──
App.normText = normText;
App.detectClarifications = detectClarifications;
})(window.App = window.App || {});
