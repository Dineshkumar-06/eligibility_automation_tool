/* Eligibility Code Generator — module: postCompare.js
   Standalone "Post Order Comparison" validation utility. Independent of the
   parsing/generator pipeline: reads two Excel-pasted post lists (SOW vs
   Eligibility Criteria sheet) and reports a sequence-aligned diff. Never
   touches App.S or any parsed data. */
(function(App){
  // ── imports from App ──
  var escH = App.escH;

  // Extracts post names in order from an Excel paste: each row's first
  // non-empty tab-separated cell is the post name; blank rows are dropped.
  function parsePastedPosts(text){
    var lines=String(text||'').split(/\r\n|\r|\n/);
    var out=[];
    for(var i=0;i<lines.length;i++){
      var cells=lines[i].split('\t');
      var name='';
      for(var c=0;c<cells.length;c++){
        var v=cells[c].replace(/\s+/g,' ').trim();
        if(v){name=v;break;}
      }
      if(name) out.push(name);
    }
    return out;
  }

  function normPost(name){
    return String(name||'').trim().replace(/\s+/g,' ').toLowerCase();
  }

  // Longest-common-subsequence alignment (same idea as a text diff): finds the
  // largest set of posts that appear in BOTH lists in the SAME relative order.
  // A naive index-by-index compare treats one inserted/deleted/reordered post as
  // an avalanche of "mismatches" for everything after it — LCS instead pins down
  // exactly what moved, and leaves everything else alone.
  function lcsScript(normS,normE){
    var n=normS.length,m=normE.length;
    var dp=new Array(n+1);
    for(var a=0;a<=n;a++) dp[a]=new Array(m+1).fill(0);
    for(var i=n-1;i>=0;i--){
      for(var j=m-1;j>=0;j--){
        dp[i][j]=normS[i]===normE[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
      }
    }
    var script=[]; i=0; var j=0;
    while(i<n&&j<m){
      if(normS[i]===normE[j]){script.push({type:'match',sowIdx:i,eliIdx:j});i++;j++;}
      else if(dp[i+1][j]>=dp[i][j+1]){script.push({type:'delete',sowIdx:i});i++;}
      else {script.push({type:'insert',eliIdx:j});j++;}
    }
    while(i<n){script.push({type:'delete',sowIdx:i});i++;}
    while(j<m){script.push({type:'insert',eliIdx:j});j++;}
    return script;
  }

  // Sequence-aligned comparison. Classifies every post as:
  //   match    — same name, same relative order in both lists
  //   mismatch — same position, different name (renamed in place)
  //   moved    — same name, present in both, but out of relative order
  //   missing  — in SOW only
  //   extra    — in Eligibility only
  // Returns {totals, counts, rows, identical}.
  function comparePostOrder(sowText,eliText){
    var sow=parsePastedPosts(sowText);
    var eli=parsePastedPosts(eliText);
    var normS=sow.map(normPost),normE=eli.map(normPost);
    var script=lcsScript(normS,normE);

    // Pair up leftover deletes/inserts that share a normalized name -> "moved".
    var insertsByNorm={};
    script.forEach(function(e,idx){
      if(e.type==='insert'){
        var k=normE[e.eliIdx];
        (insertsByNorm[k]=insertsByNorm[k]||[]).push(idx);
      }
    });
    var consumedInsert={};
    var moveTarget={};
    script.forEach(function(e,idx){
      if(e.type!=='delete') return;
      var queue=insertsByNorm[normS[e.sowIdx]];
      if(!queue) return;
      for(var qi=0;qi<queue.length;qi++){
        var insIdx=queue[qi];
        if(consumedInsert[insIdx]) continue;
        consumedInsert[insIdx]=true;
        moveTarget[idx]=insIdx;
        break;
      }
    });

    var rows=[];
    script.forEach(function(e,idx){
      if(e.type==='match'){
        rows.push({kind:'match',sowPos:e.sowIdx+1,eliPos:e.eliIdx+1,sowName:sow[e.sowIdx],eliName:eli[e.eliIdx]});
      } else if(e.type==='delete'){
        if(moveTarget[idx]!==undefined){
          var ins=script[moveTarget[idx]];
          rows.push({kind:'moved',sowPos:e.sowIdx+1,eliPos:ins.eliIdx+1,sowName:sow[e.sowIdx],eliName:eli[ins.eliIdx]});
        } else {
          rows.push({kind:'missing',sowPos:e.sowIdx+1,sowName:sow[e.sowIdx]});
        }
      } else if(e.type==='insert'){
        if(consumedInsert[idx]) return; // already rendered as part of a 'moved' row
        rows.push({kind:'extra',eliPos:e.eliIdx+1,eliName:eli[e.eliIdx]});
      }
    });

    // Adjacent missing+extra (no match between them) usually means one post was
    // simply renamed in place, not that two unrelated posts were deleted/added —
    // merge those pairs into a single 'mismatch' row for a clearer report.
    var merged=[];
    for(var k=0;k<rows.length;k++){
      var cur=rows[k],next=rows[k+1];
      if(cur.kind==='missing'&&next&&next.kind==='extra'){
        merged.push({kind:'mismatch',sowPos:cur.sowPos,eliPos:next.eliPos,sowName:cur.sowName,eliName:next.eliName});
        k++;
      } else if(cur.kind==='extra'&&next&&next.kind==='missing'){
        merged.push({kind:'mismatch',sowPos:next.sowPos,eliPos:cur.eliPos,sowName:next.sowName,eliName:cur.eliName});
        k++;
      } else {
        merged.push(cur);
      }
    }

    var counts={match:0,mismatch:0,moved:0,missing:0,extra:0};
    merged.forEach(function(r){counts[r.kind]++;});
    var identical=sow.length===eli.length&&counts.match===merged.length;

    return {totals:{sow:sow.length,eli:eli.length},counts:counts,rows:merged,identical:identical};
  }

  var KIND_META={
    match:   {label:'Match',    icon:'✓', chip:'pc-chip-g', row:'pc-row-match'},
    mismatch:{label:'Renamed',  icon:'✎', chip:'pc-chip-r', row:'pc-row-mismatch'},
    moved:   {label:'Moved',    icon:'⇄', chip:'pc-chip-b', row:'pc-row-moved'},
    missing: {label:'Missing',  icon:'−', chip:'pc-chip-o', row:'pc-row-missing'},
    extra:   {label:'Extra',    icon:'+', chip:'pc-chip-o', row:'pc-row-extra'}
  };

  function posLabel(pos,side){
    return pos?('<span class="pc-pos">'+side+' #'+pos+'</span>'):'';
  }

  function renderRow(r){
    var meta=KIND_META[r.kind];
    var title='',body='';
    if(r.kind==='match'){
      title=posLabel(r.sowPos,'SOW')+posLabel(r.eliPos,'Eligibility')+' '+escH(r.sowName);
    } else if(r.kind==='mismatch'){
      title='Different name at the same position — '+posLabel(r.sowPos,'SOW')+posLabel(r.eliPos,'Eligibility');
      body='<div class="pc-row-diff"><div class="pc-diff-old"><span class="pc-diff-tag">SOW</span>'+escH(r.sowName)+'</div>'+
        '<div class="pc-diff-new"><span class="pc-diff-tag">Eligibility</span>'+escH(r.eliName)+'</div></div>';
    } else if(r.kind==='moved'){
      title='"'+escH(r.sowName)+'" moved — '+posLabel(r.sowPos,'SOW')+' → '+posLabel(r.eliPos,'Eligibility');
    } else if(r.kind==='missing'){
      title='Missing from Eligibility Sheet — '+posLabel(r.sowPos,'SOW');
      body='<div class="pc-row-diff"><div class="pc-diff-old"><span class="pc-diff-tag">SOW</span>'+escH(r.sowName)+'</div></div>';
    } else { // extra
      title='Extra in Eligibility Sheet — '+posLabel(r.eliPos,'Eligibility');
      body='<div class="pc-row-diff"><div class="pc-diff-new"><span class="pc-diff-tag">Eligibility</span>'+escH(r.eliName)+'</div></div>';
    }
    return '<div class="pc-row '+meta.row+'">'+
      '<div class="pc-row-icon" aria-hidden="true">'+meta.icon+'</div>'+
      '<div class="pc-row-body"><div class="pc-row-title"><span class="bd '+meta.chip+'">'+meta.label+'</span> '+title+'</div>'+body+'</div>'+
    '</div>';
  }

  function renderSummary(result){
    var c=result.counts;
    var chips=[
      {label:'SOW posts',value:result.totals.sow,cls:'pc-chip-neutral'},
      {label:'Eligibility posts',value:result.totals.eli,cls:'pc-chip-neutral'},
      {label:'Match',value:c.match,cls:'pc-chip-g'},
      {label:'Renamed',value:c.mismatch,cls:'pc-chip-r'},
      {label:'Moved',value:c.moved,cls:'pc-chip-b'},
      {label:'Missing',value:c.missing,cls:'pc-chip-o'},
      {label:'Extra',value:c.extra,cls:'pc-chip-o'}
    ];
    return '<div class="pc-summary">'+chips.map(function(ch){
      return '<div class="pc-chip '+ch.cls+'"><span class="pc-chip-n">'+ch.value+'</span><span class="pc-chip-l">'+ch.label+'</span></div>';
    }).join('')+'</div>';
  }

  function renderResult(result){
    var out=document.getElementById('pc-result');
    if(!out) return;
    var html=renderSummary(result);
    if(result.identical){
      html+='<div class="pc-identical"><span class="bd pc-chip-g">✓</span> Post order is identical.</div>';
    } else {
      html+='<div class="pc-rowlist">'+result.rows.map(renderRow).join('')+'</div>';
    }
    out.innerHTML=html;
  }

  function openPostCompare(){
    var ov=document.getElementById('pc-overlay');
    if(ov) ov.classList.remove('hidden');
  }

  function closePostCompare(){
    var ov=document.getElementById('pc-overlay');
    if(ov) ov.classList.add('hidden');
  }

  function runPostCompare(){
    var sowEl=document.getElementById('pc-sow');
    var eliEl=document.getElementById('pc-eli');
    var result=comparePostOrder(sowEl?sowEl.value:'',eliEl?eliEl.value:'');
    renderResult(result);
  }

  // ── exports ──
  App.parsePastedPosts = parsePastedPosts;
  App.normPost = normPost;
  App.comparePostOrder = comparePostOrder;
  App.openPostCompare = openPostCompare;
  App.closePostCompare = closePostCompare;
  App.runPostCompare = runPostCompare;
})(window.App = window.App || {});
