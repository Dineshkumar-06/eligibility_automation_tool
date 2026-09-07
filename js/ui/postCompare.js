/* Eligibility Code Generator — module: postCompare.js
   Standalone "Post Order Comparison" validation utility. Independent of the
   parsing/generator pipeline: reads two Excel-pasted post lists (SOW vs
   Eligibility Criteria sheet) and reports a sequence-aligned diff. Never
   touches App.S or any parsed data. */
(function(App){
  // ── imports from App ──
  var escH = App.escH;

  function normPost(name){
    return String(name||'').trim().replace(/\s+/g,' ').toLowerCase();
  }

  // Extracts posts in order from an Excel paste, honouring the same N-dimension
  // post identity as the main pipeline (App.dims — Post [+ Recruitment Mode]
  // [+ Discipline] …, S.dimensions). dimCount:
  //   1 — legacy flat list: each row's first non-empty tab-separated cell is
  //       the post name; blank rows are dropped.
  //   2/3 — each row's first N tab-separated cells are the identity columns,
  //       in sheet order. ANY of them may be a merged Excel cell that pastes
  //       as text with a value only on its first row and blank below — that's
  //       just as often "Cadre" merged down a Post column (many distinct
  //       posts sharing one Cadre) as the reverse ("Post Name" merged down a
  //       Recruitment-Mode/Discipline column). So every column's blank cell
  //       independently forward-fills from the last row where that column
  //       had a value. A row is dropped only when ALL N columns are blank
  //       (a pure spacer row) — any row with at least one value is its own
  //       post, never folded into the row above.
  // Returns [{dims:[...], key, label}]: `key` is the normalized join used for
  // matching, `label` the human-readable combined name shown in the report.
  function parsePastedPosts(text,dimCount){
    dimCount=dimCount||1;
    var lines=String(text||'').split(/\r\n|\r|\n/);
    var out=[];
    if(dimCount===1){
      for(var i=0;i<lines.length;i++){
        var cells=lines[i].split('\t');
        var name='';
        for(var c=0;c<cells.length;c++){
          var v=cells[c].replace(/\s+/g,' ').trim();
          if(v){name=v;break;}
        }
        if(name) out.push({dims:[name],key:normPost(name),label:name});
      }
      return out;
    }
    var lastVal=new Array(dimCount).fill('');
    for(var li=0;li<lines.length;li++){
      var raw=lines[li].split('\t').map(function(c){return c.replace(/\s+/g,' ').trim();});
      var blank=true;
      for(var b=0;b<dimCount;b++){ if(raw[b]){blank=false;break;} }
      if(blank) continue; // fully empty pasted line — nothing in any column
      var dims=[];
      for(var d=0;d<dimCount;d++){
        var v=raw[d]||'';
        if(v) lastVal[d]=v;
        dims.push(v||lastVal[d]);
      }
      out.push({dims:dims,key:dims.map(normPost).join('\u241F'),label:dims.join(' / ')});
    }
    return out;
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
  // sowDim/eliDim: post-identity dimension count for each side (1/2/3),
  // independent per side since the SOW and Eligibility sheets can differ in
  // layout — see parsePastedPosts.
  // Returns {totals, counts, rows, identical}.
  function comparePostOrder(sowText,eliText,sowDim,eliDim){
    var sow=parsePastedPosts(sowText,sowDim);
    var eli=parsePastedPosts(eliText,eliDim);
    var normS=sow.map(function(x){return x.key;}),normE=eli.map(function(x){return x.key;});
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
        rows.push({kind:'match',sowPos:e.sowIdx+1,eliPos:e.eliIdx+1,sowName:sow[e.sowIdx].label,eliName:eli[e.eliIdx].label});
      } else if(e.type==='delete'){
        if(moveTarget[idx]!==undefined){
          var ins=script[moveTarget[idx]];
          rows.push({kind:'moved',sowPos:e.sowIdx+1,eliPos:ins.eliIdx+1,sowName:sow[e.sowIdx].label,eliName:eli[ins.eliIdx].label});
        } else {
          rows.push({kind:'missing',sowPos:e.sowIdx+1,sowName:sow[e.sowIdx].label});
        }
      } else if(e.type==='insert'){
        if(consumedInsert[idx]) return; // already rendered as part of a 'moved' row
        rows.push({kind:'extra',eliPos:e.eliIdx+1,eliName:eli[e.eliIdx].label});
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

    // Duplicate post names (or other LCS ambiguity) can pair a delete with an
    // insert that land on the exact same absolute position — there's nothing
    // to review at "moved SOW #40 -> Eligibility #40", so treat it as a match.
    merged.forEach(function(r){
      if(r.kind==='moved'&&r.sowPos===r.eliPos) r.kind='match';
    });

    // A plain two-item swap (A takes B's slot, B takes A's) is only surfaced
    // once by the delete/insert pairing above — the other half looks like an
    // ordinary same-name 'match' even though ITS position changed too. Find
    // that reciprocal row (its SOW/Eligibility positions are this move's
    // Eligibility/SOW positions, swapped) and promote it to 'moved' as well,
    // so both displaced posts are reported.
    merged.forEach(function(m){
      if(m.kind!=='moved') return;
      for(var p=0;p<merged.length;p++){
        var r=merged[p];
        if(r.kind==='match'&&r.sowPos===m.eliPos&&r.eliPos===m.sowPos){
          r.kind='moved';
          break;
        }
      }
    });

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

  // Current result + active category filter, so a chip click can re-render
  // just the row list without re-running the comparison.
  var pcState={result:null,filter:null};

  function renderSummary(result,activeFilter){
    var c=result.counts;
    var chips=[
      {label:'SOW posts',value:result.totals.sow,cls:'pc-chip-neutral'},
      {label:'Eligibility posts',value:result.totals.eli,cls:'pc-chip-neutral'},
      {label:'Match',value:c.match,cls:'pc-chip-g',kind:'match'},
      {label:'Renamed',value:c.mismatch,cls:'pc-chip-r',kind:'mismatch'},
      {label:'Moved',value:c.moved,cls:'pc-chip-b',kind:'moved'},
      {label:'Missing',value:c.missing,cls:'pc-chip-o',kind:'missing'},
      {label:'Extra',value:c.extra,cls:'pc-chip-o',kind:'extra'}
    ];
    return '<div class="pc-summary">'+chips.map(function(ch){
      if(!ch.kind){
        return '<div class="pc-chip '+ch.cls+'"><span class="pc-chip-n">'+ch.value+'</span><span class="pc-chip-l">'+ch.label+'</span></div>';
      }
      var active=activeFilter===ch.kind;
      var cls='pc-chip pc-chip-clickable '+ch.cls+(active?' pc-chip-active':'');
      return '<div class="'+cls+'" role="button" tabindex="0" onclick="filterPostCompare(\''+ch.kind+'\')">'+
        '<span class="pc-chip-n">'+ch.value+'</span><span class="pc-chip-l">'+ch.label+'</span></div>';
    }).join('')+'</div>';
  }

  function renderResult(){
    var result=pcState.result;
    var out=document.getElementById('pc-result');
    if(!out||!result) return;
    var html=renderSummary(result,pcState.filter);
    if(pcState.filter){
      var meta=KIND_META[pcState.filter];
      var filtered=result.rows.filter(function(r){return r.kind===pcState.filter;});
      html+='<div class="pc-filter-hdr">Showing '+filtered.length+' "'+meta.label+'" post'+(filtered.length===1?'':'s')+
        ' — <a href="#" onclick="filterPostCompare(\''+pcState.filter+'\');return false;">Show all</a></div>';
      html+='<div class="pc-rowlist">'+(filtered.length?filtered.map(renderRow).join(''):'<div class="pc-empty">No posts in this category.</div>')+'</div>';
    } else if(result.identical){
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

  function dimSelVal(id){
    var el=document.getElementById(id);
    return el?(parseInt(el.value,10)||1):1;
  }

  function runPostCompare(){
    var sowEl=document.getElementById('pc-sow');
    var eliEl=document.getElementById('pc-eli');
    var sowDim=dimSelVal('pc-sow-dim'), eliDim=dimSelVal('pc-eli-dim');
    pcState.result=comparePostOrder(sowEl?sowEl.value:'',eliEl?eliEl.value:'',sowDim,eliDim);
    pcState.filter=null;
    renderResult();
  }

  // Clicking a summary chip (e.g. "Moved") filters the row list to just that
  // category; clicking the active chip again clears the filter.
  function filterPostCompare(kind){
    if(!pcState.result) return;
    pcState.filter=(pcState.filter===kind)?null:kind;
    renderResult();
  }

  // ── exports ──
  App.parsePastedPosts = parsePastedPosts;
  App.normPost = normPost;
  App.comparePostOrder = comparePostOrder;
  App.openPostCompare = openPostCompare;
  App.closePostCompare = closePostCompare;
  App.runPostCompare = runPostCompare;
  App.filterPostCompare = filterPostCompare;
})(window.App = window.App || {});
