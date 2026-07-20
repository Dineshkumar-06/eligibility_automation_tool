/* Eligibility Code Generator — module: examAliasRef.js
   Standalone "Exam Passed Alias Reference" info panel. Purely informational —
   built straight from the parser's own EDU_ORDER / EDU_ALIASES tables (the same
   ones matchLevel() in parsing/helpers.js resolves against), so it can never
   drift out of sync with what the parser actually accepts. Read-only: never
   touches App.S, the parser, or the generators. */
(function(App){
  // ── imports from App ──
  var EDU_ORDER = App.EDU_ORDER;
  var EDU_ALIASES = App.EDU_ALIASES;
  var escH = App.escH;

  // EDU_ALIASES keys are lowercase match-keys (e.g. 'p.g. diploma'); title-case
  // them for display only — this has no bearing on matching, which stays
  // case-insensitive in matchLevel().
  function prettifyAlias(s){
    return String(s).replace(/\b\w/g,function(c){return c.toUpperCase();});
  }

  // Inverts EDU_ALIASES (alias -> level) into level -> [aliases], ordered per
  // EDU_ORDER. The canonical level name itself is NOT included here — it's
  // already the card title (see renderExamAliasRef) — so every chip shown is
  // an actual alternative spelling, never the name repeated back at the user.
  function buildExamAliasGroups(){
    var byLevel={};
    for(var key in EDU_ALIASES){
      var level=EDU_ALIASES[key];
      (byLevel[level]=byLevel[level]||[]).push(prettifyAlias(key));
    }
    return EDU_ORDER.map(function(level){
      return {level:level, aliases:(byLevel[level]||[]).sort()};
    });
  }

  // Cards follow the same visual language as the Post Order Comparison row list
  // (.pc-row / .pc-rowlist) — an icon, a colored accent border, and a title —
  // so the two reference utilities read as one consistent design system.
  function renderExamAliasRef(){
    var host=document.getElementById('exa-groups');
    if(!host) return;
    var groups=buildExamAliasGroups();
    host.innerHTML=groups.map(function(g,idx){
      var body=g.aliases.length
        ? '<div class="exa-aliases">'+g.aliases.map(function(a){return '<span class="exa-chip">'+escH(a)+'</span>';}).join('')+'</div>'
        : '<div class="exa-none">No additional aliases — use this exact name.</div>';
      return '<div class="pc-row exa-card">'+
        '<div class="pc-row-icon exa-card-icon">'+(idx+1)+'</div>'+
        '<div class="pc-row-body"><div class="exa-level">'+escH(g.level)+'</div>'+body+'</div>'+
      '</div>';
    }).join('');
  }

  function openExamAliasRef(){
    var ov=document.getElementById('exa-overlay');
    if(ov) ov.classList.remove('hidden');
    renderExamAliasRef();
  }

  function closeExamAliasRef(){
    var ov=document.getElementById('exa-overlay');
    if(ov) ov.classList.add('hidden');
  }

  // ── exports ──
  App.buildExamAliasGroups = buildExamAliasGroups;
  App.renderExamAliasRef = renderExamAliasRef;
  App.openExamAliasRef = openExamAliasRef;
  App.closeExamAliasRef = closeExamAliasRef;
})(window.App = window.App || {});
