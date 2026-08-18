/* Eligibility Code Generator — module: core/state.js — shared app state + tiny utilities
   Part of the namespaced App.* module set. Logic is unchanged from the
   original single-file version; only wrapped for modular loading. */
(function(App){
// dimensions: ordered eligibility-dimension schema detected from the columns
//   before "Exam Passed" — [{columnName, postVariable}]. Always has at least one
//   entry (POST -> postcode) so legacy single-post sheets keep working unchanged.
// appearedPassed: optional "Appeared / Passed" support (off by default — keeps output
//   byte-identical to legacy). When enabled, `fields` maps an EDU level name to the
//   user-supplied $_POST field name carrying the candidate's A/P choice, e.g.
//   {'Graduation':'grad_appeared'}. A level is AP-active iff enabled AND it has a
//   non-empty field name (see apField below).
//   `hierarchy` / `generic` hold the qualification hierarchy the user arranges by drag &
//   drop in Step 2: `hierarchy` is a list of EDU level names ordered lowest → highest,
//   `generic` the levels with no ladder precedence. Both null = not configured ⇒ the
//   default POSTQUAL_TS ranks are used (see apRank below), so output stays legacy.
var S = {posts:[], errors:[], warnings:[], rawRows:[], colMap:{}, dimensions:[], radioOv:{}, bilingual:false, redRemovedCount:0, appearedPassed:{enabled:false, fields:{}, hierarchy:null, generic:null},
         internalCandidate:{enabled:false, field:'internal_candidate', posts:[], ctx:null},
         _normalCtx:null, clarifications:{stream:[], degree:[], radio:[]},
         _edu:'', _eli:'', _eduval:'', _workexp:'', _qrysql:'', maxStep:1};

// Derive a sane default PHP POST-variable name from a dimension column header.
// "POST" -> "postcode" (legacy name preserved); everything else -> snake_case of
// the header words. The user can override these in Step 2.
function defaultPostVar(columnName){
  var n=String(columnName||'').trim().toLowerCase();
  if(n==='post'||n==='post name'||n==='postname') return 'postcode';
  var slug=n.replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  return slug||'dim';
}

// Slugify any user-typed name into a valid PHP field/lang identifier: lowercase,
// non-alphanumerics collapsed to single underscores, no leading/trailing underscore.
function slugName(s){
  return String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
}

// ── UTILS ─────────────────────────────────────────────────────────────────
function ind(n){var s='';for(var i=0;i<n;i++)s+='\t';return s;}
function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escA(s){return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
// Per-post user overrides for a radio's field/lang name, keyed by the NORMALIZED
// question so every spelling variant of the same question ("… experience?" / "…
// experience ?.") shares one override entry. Without the normalization an edit made
// on the one variant the UI renders would not reach the other occurrences, which
// generators resolve through rFn/rLk individually. App.normRadioQuestion is looked up
// lazily because parsing/ loads after core/ (getOv only ever runs post-load).
function getOv(pc,q){
  var k=App.normRadioQuestion?App.normRadioQuestion(q):String(q||'');
  if(!S.radioOv[pc])S.radioOv[pc]={};
  if(!S.radioOv[pc][k])S.radioOv[pc][k]={};
  return S.radioOv[pc][k];
}
function rFn(c,pc){return getOv(pc,c.question).fieldName||c.fieldName;}
function rLk(c,pc){return getOv(pc,c.question).langKey||c.langKey;}
function isCat(mk){var s=mk&&String(mk);return !!(s&&(s.indexOf('CAT:')===0||s.indexOf('MCAT:')===0));}

// ── INTERNAL / DEPARTMENTAL CANDIDATE ─────────────────────────────────────────
function intEnabled(){ return !!(S.internalCandidate && S.internalCandidate.enabled); }
function intField(){
  if(!intEnabled()) return 'internal_candidate';
  var f=S.internalCandidate.field; f=(f==null)?'':String(f).trim();
  return f||'internal_candidate';
}
// Snapshot the four generation-schema fields that buildPostsRange writes as side
// effects. Used to capture the normal/internal branch schemas separately.
function snapCtx(){
  return {dimensions:S.dimensions.slice(), colMap:S.colMap, weHeader:S.weHeader, weMode:S.weMode};
}
// Temporarily apply a context snapshot around a call to fn(), then restore.
// This makes per-branch generator calls leak-free even though the generator
// functions read S.dimensions / S.weMode directly at call time.
function withCtx(ctx, fn){
  var savedDim=S.dimensions, savedColMap=S.colMap, savedWH=S.weHeader, savedWM=S.weMode;
  S.dimensions=ctx.dimensions; S.colMap=ctx.colMap; S.weHeader=ctx.weHeader; S.weMode=ctx.weMode;
  try{ return fn(); } finally {
    S.dimensions=savedDim; S.colMap=savedColMap; S.weHeader=savedWH; S.weMode=savedWM;
  }
}

// ── APPEARED / PASSED ───────────────────────────────────────────────────────
// Whether the "Appeared / Passed" feature is switched on at all.
function apEnabled(){ return !!(S.appearedPassed && S.appearedPassed.enabled); }
// The $_POST field name for a level when AP-active, else null. A level is AP-active
// iff the feature is on AND the user supplied a non-empty field name for it. Every
// AP code path keys off this single predicate, so AP-off ⇒ null ⇒ legacy output.
function apField(level){
  if(!apEnabled()) return null;
  var f=S.appearedPassed.fields[level]; f=(f==null)?'':String(f).trim();
  return f||null;
}

// Hierarchy rank of an EDU level for Appeared/Passed purposes: >0 = ladder position
// (larger = higher qualification), 0 = generic / non-hierarchical (no precedence).
// Resolution order — user-arranged hierarchy, then the generic bucket, then the default
// POSTQUAL_TS ranks (App.defaultAcadRank, looked up lazily because core/constants.js
// exports it before this file loads but callers only run post-load). Nothing here is
// hardcoded per level, so a new Exam Passed type just works once it is dragged in.
function apRank(level){
  var ap=S.appearedPassed||{}, h=ap.hierarchy, g=ap.generic;
  if(h && h.length){
    var i=h.indexOf(level);
    if(i>=0) return i+1;
    if(g && g.indexOf(level)>=0) return 0;
  } else if(g && g.length && g.indexOf(level)>=0) return 0;
  return App.defaultAcadRank?App.defaultAcadRank(level):0;
}

// Radio "Should be" prompt text. When S.bilingual is on (Marathi/Hindi content
// present — toggled by the Step-2 checkbox), emit the bilingual variants used in
// the reference config.php; otherwise the plain English text.
//   sbYes()   -> mandatory radio ('Y')      ; sbYesNo() -> optional radio ('Y,N')
function sbYes(){   return S.bilingual?'Should be YES / होय':'Should be Yes'; }
function sbYesNo(){ return S.bilingual?'Should be YES / होय or NO / नाही':'Should be Yes or No'; }
// Mandatory NO radio (an explicit "Should be No" question).
function sbNo(){    return S.bilingual?'Should be NO / नाही':'Should be No'; }

  // ── exports to App ──
  App.S = S;
  App.defaultPostVar = defaultPostVar;
  App.slugName = slugName;
  App.sbYes = sbYes;
  App.sbYesNo = sbYesNo;
  App.sbNo = sbNo;
  App.escA = escA;
  App.escH = escH;
  App.getOv = getOv;
  App.ind = ind;
  App.isCat = isCat;
  App.apEnabled = apEnabled;
  App.apField = apField;
  App.apRank = apRank;
  App.intEnabled = intEnabled;
  App.intField = intField;
  App.snapCtx = snapCtx;
  App.withCtx = withCtx;
  App.rFn = rFn;
  App.rLk = rLk;
})(window.App = window.App || {});
