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
// the user back at where each value lives on the sheet) and the exam level the condition
// belongs to (e.g. "Graduation", "Post Graduation") — since a value like "B.Tech in CS" can
// be ambiguous without knowing which qualification level it was entered under. Skips empties
// and dash-only placeholders (mirrors parseSubs' guard).
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
          out.push({value:v,postcode:post.postcode,level:cond.level});
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

// Bucket entries by exam level (e.g. "Graduation", "Post Graduation") and find duplicate
// groups *within* each bucket — so a value is only ever compared against others entered
// under the same qualification, and the result can be rendered as one heading per exam
// level instead of tagging every mismatching value individually. Sections are ordered by
// qualification rank (EDU_ORDER); a condition with no resolvable level falls back to an
// "Unspecified" bucket, ordered last. Buckets with no duplicate groups are omitted.
function findDupGroupsByLevel(entries){
  var EDU=App.EDU, EDU_ORDER=App.EDU_ORDER||[];
  var byLevel=new Map(), order=[];
  for(var i=0;i<entries.length;i++){
    var lvl=entries[i].level||'Unspecified';
    if(!byLevel.has(lvl)){ byLevel.set(lvl,[]); order.push(lvl); }
    byLevel.get(lvl).push(entries[i]);
  }
  order.sort(function(a,b){
    var ra=(EDU&&EDU[a]&&EDU[a].idx)||EDU_ORDER.length+1;
    var rb=(EDU&&EDU[b]&&EDU[b].idx)||EDU_ORDER.length+1;
    return ra-rb;
  });
  var sections=[];
  for(var oi=0;oi<order.length;oi++){
    var lvl2=order[oi];
    var groups=findDupGroups(byLevel.get(lvl2));
    if(groups.length) sections.push({level:lvl2,groups:groups});
  }
  return sections;
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
// `stream`/`degree` are arrays of {level, groups} sections (one per exam level that has
// at least one duplicate group), so the UI/mail can group mismatches under an exam-level
// heading instead of tagging each value individually.
function detectClarifications(posts,internalPosts){
  var allPosts=(posts||[]).concat(internalPosts||[]);
  return {
    stream: findDupGroupsByLevel(collectAxisValues(allPosts,'subjects')),
    degree: findDupGroupsByLevel(collectAxisValues(allPosts,'degrees')),
    radio: findRadioDupGroups(collectRadioConds(allPosts))
  };
}

// Merge stream + degree level-sections into one ordered list, combining the groups from
// both axes when they share the same level (mail/UI don't need the stream/degree
// distinction at the heading level — only within each card).
function mergeLevelSections(streamSections,degreeSections){
  var EDU=App.EDU;
  var map={}, order=[];
  function add(sections){
    (sections||[]).forEach(function(sec){
      if(!map[sec.level]){ map[sec.level]=[]; order.push(sec.level); }
      map[sec.level]=map[sec.level].concat(sec.groups);
    });
  }
  add(streamSections); add(degreeSections);
  order.sort(function(a,b){
    var ra=(EDU&&EDU[a]&&EDU[a].idx)||999, rb=(EDU&&EDU[b]&&EDU[b].idx)||999;
    return ra-rb;
  });
  return order.map(function(lvl){ return {level:lvl,groups:map[lvl]}; });
}

// Build plain-text, copy-pasteable content for a clarification mail from a clarifications
// object (as returned by detectClarifications). `kind` selects which section to render:
// 'values' for the Subject/Stream + Degree duplicate groups (grouped under an exam-level
// heading, e.g. "Graduation:", so the recipient isn't left guessing which qualification a
// value belongs to), 'radio' for the duplicate radio-button question groups (no exam-level
// concept, so left flat). Deliberately omits postcodes — an on-screen aid for the sheet
// owner; the recipient only needs the competing spellings. Returns '' when there is
// nothing to report for that kind.
function buildClarificationMailText(kind,cl){
  cl = cl||{stream:[],degree:[],radio:[]};
  if(kind==='radio'){
    var radioGroups=(cl.radio||[]).map(function(g){return g.texts;});
    if(!radioGroups.length) return '';
    var radioLines=radioGroups.map(function(texts){
      return '- '+texts.map(function(v){return '"'+v+'"';}).join(', ');
    });
    return 'The following radio button questions in the eligibility sheet do not match. Kindly confirm which values we should use.\n'+radioLines.join('\n');
  }
  var sections=mergeLevelSections(cl.stream,cl.degree);
  if(!sections.length) return '';
  var blocks=sections.map(function(sec){
    var lines=sec.groups.map(function(g){
      return '- '+g.map(function(v){return '"'+v+'"';}).join(', ');
    });
    return sec.level+':\n'+lines.join('\n');
  });
  return 'The following values in the eligibility sheet do not match. Kindly confirm which values we should use.\n\n'+blocks.join('\n\n');
}

// ── exports to App ──
App.normText = normText;
App.detectClarifications = detectClarifications;
App.mergeLevelSections = mergeLevelSections;
App.buildClarificationMailText = buildClarificationMailText;
})(window.App = window.App || {});
