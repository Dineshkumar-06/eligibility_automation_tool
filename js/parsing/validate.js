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
// across all posts. Skips empties and dash-only placeholders (mirrors parseSubs' guard).
function collectAxisValues(posts,axisKey){
  var out=[];
  if(!posts) return out;
  for(var pi=0;pi<posts.length;pi++){
    var orGroups=posts[pi].orGroups||[];
    for(var gi=0;gi<orGroups.length;gi++){
      var conds=orGroups[gi].conditions||[];
      for(var ci=0;ci<conds.length;ci++){
        var cond=conds[ci];
        if(cond.type!=='edu') continue;
        var vals=cond[axisKey]||[];
        for(var vi=0;vi<vals.length;vi++){
          var v=vals[vi];
          if(!v||/^[\s\-–—]+$/.test(v)) continue;
          out.push(v);
        }
      }
    }
  }
  return out;
}

// Group raw values by normalized form; return only groups with 2+ distinct raw spellings.
function findDupGroups(values){
  var map=new Map();
  for(var i=0;i<values.length;i++){
    var v=values[i], key=normText(v);
    if(!key) continue;
    if(!map.has(key)) map.set(key,[]);
    var arr=map.get(key);
    if(arr.indexOf(v)===-1) arr.push(v);
  }
  var groups=[];
  map.forEach(function(arr){ if(arr.length>=2) groups.push(arr); });
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
