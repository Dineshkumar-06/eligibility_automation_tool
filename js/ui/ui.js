/* Eligibility Code Generator — module: ui.js — steps 1-3 rendering, preview, download, navigation
   Part of the namespaced App.* module set. Logic is unchanged from the
   original single-file version; only wrapped for modular loading. */
(function(App){
  // ── imports from App ──
  var EDU = App.EDU;
  var EDU_ORDER = App.EDU_ORDER;
  var POSTQUAL_TS = App.POSTQUAL_TS;
  var S = App.S;
  var escA = App.escA;
  var escH = App.escH;
  var genEduConfig = App.genEduConfig;
  var genEduValidations = App.genEduValidations;
  var genEligibility = App.genEligibility;
  var genLangFile = App.genLangFile;
  var genWorkExpDetails = App.genWorkExpDetails;
  var genEduQrySql = App.genEduQrySql;
  var getAllRadios = App.getAllRadios;
  var getOv = App.getOv;
  var parseFile = App.parseFile;
  var buildPostsRange = App.buildPostsRange;
  var extractRedFilter = App.extractRedFilter;
  var applyRedFilter = App.applyRedFilter;
  var findInternalSeparator = App.findInternalSeparator;
  var intEnabled = App.intEnabled;
  var intField = App.intField;
  var snapCtx = App.snapCtx;
  var withCtx = App.withCtx;
  var genEligibilityBranched = App.genEligibilityBranched;
  var genEduValidationsBranched = App.genEduValidationsBranched;
  var genWorkExpBranched = App.genWorkExpBranched;
  var genEduConfigBranched = App.genEduConfigBranched;
  var genLangFileBranched = App.genLangFileBranched;
  var genEduQrySqlBranched = App.genEduQrySqlBranched;
  var detectClarifications = App.detectClarifications;

function onFileChange(e){
  var inp=e.target;
  var file=inp.files[0]; if(!file) return;
  S.fileName=file.name;
  // Show a loading state — XLSX.read + parseRows are synchronous and can briefly
  // freeze the UI on large workbooks, so we surface feedback while it runs.
  // NOTE: toggle a separate overlay element rather than rewriting the upload
  // area's innerHTML — the file <input> lives inside it and rewriting would
  // destroy the node (and its change listener), breaking subsequent uploads.
  var ua=document.getElementById('upload-area');
  var ov=document.getElementById('upload-overlay');
  var title=document.getElementById('upload-overlay-title');
  if(title) title.textContent='Parsing '+file.name+'…';
  if(ua) ua.classList.add('loading');
  if(ov) ov.classList.remove('hidden');
  var reader=new FileReader();
  reader.onload=function(ev){
    // Defer the heavy parse one frame so the spinner actually paints first.
    var buf=ev.target.result;
    // Read the workbook VALUES with SheetJS, then strip RED (= "removed")
    // content using the colour map from extractRedFilter before building the
    // tree. Red whole-cells are blanked; partially-red cells keep only their
    // black text — the downstream parser never sees the removed items.
    var doParse=function(rf){
      try{
        var wb=XLSX.read(buf,{type:'array'});
        var ws=wb.Sheets[wb.SheetNames[0]];
        var rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
        if(rf && rf.count){
          var range=XLSX.utils.decode_range(ws['!ref']||'A1');
          applyRedFilter(rows, rf, {r0:range.s.r, c0:range.s.c});
        }
        S.redRemovedCount = rf ? rf.count : 0;
        S.rawRows=rows;
        parseRows(rows);
      } finally {
        if(ua) ua.classList.remove('loading');
        if(ov) ov.classList.add('hidden');
        // Allow re-selecting the same file again (change won't fire otherwise).
        inp.value='';
      }
      renderS1();
    };
    // extractRedFilter is async (JSZip). On any failure, fall back to a plain,
    // colour-blind parse so a malformed/odd file never blocks upload.
    var run=function(){
      if(extractRedFilter) extractRedFilter(buf).then(doParse, function(){ doParse(null); });
      else doParse(null);
    };
    if(window.requestAnimationFrame) requestAnimationFrame(function(){requestAnimationFrame(run);});
    else setTimeout(run,32);
  };
  reader.readAsArrayBuffer(file);
}

// Parse rows into normal posts (and optionally internal posts when the toggle
// is on and a separator is found). Updates S.posts, S.errors, S.warnings,
// S.internalCandidate.posts, S._normalCtx, S.internalCandidate.ctx.
// Does NOT wipe S.radioOv so user overrides are preserved across re-parses.
function parseRows(rows){
  var sepIdx=(intEnabled())?findInternalSeparator(rows):-1;
  if(intEnabled() && sepIdx>=0){
    // Split at separator. Normal section = rows before sepIdx; internal = rows
    // from sepIdx+1 onward (buildPostsRange re-detects the header inside each slice).
    var normalRows=rows.slice(0, sepIdx);
    var internalRows=rows.slice(sepIdx+1);
    var resN=buildPostsRange(normalRows);
    var ctxN=snapCtx();
    var resI=buildPostsRange(internalRows);
    var ctxI=snapCtx();
    // Restore normal context as the primary schema (for dimension cfg display).
    S.dimensions=ctxN.dimensions; S.colMap=ctxN.colMap; S.weHeader=ctxN.weHeader; S.weMode=ctxN.weMode;
    S.posts=resN.posts;
    S.errors=resN.errors.concat(resI.errors);
    S.warnings=resN.warnings.concat(resI.warnings);
    S._normalCtx=ctxN;
    S.internalCandidate.posts=resI.posts;
    S.internalCandidate.ctx=ctxI;
  } else {
    // Single-section path — byte-identical to before.
    var res=buildPostsRange(rows);
    S.posts=res.posts; S.errors=res.errors; S.warnings=res.warnings;
    S._normalCtx=snapCtx();
    S.internalCandidate.posts=[];
    S.internalCandidate.ctx=null;
  }
  S.clarifications=detectClarifications(S.posts,S.internalCandidate.posts);
}

// Re-parse using the already-loaded rawRows (e.g. when the toggle changes).
// Preserves S.radioOv so user-edited field names survive the reparse.
function reparse(){
  if(!S.rawRows||!S.rawRows.length) return;
  parseRows(S.rawRows);
  renderS1();
  renderS2();
}

function renderS1(){
  document.getElementById('s1-results').classList.remove('hidden');
  var fn=document.getElementById('file-name');
  if(fn){
    if(S.fileName){fn.innerHTML='<span class="fn-icon">📄</span><span class="fn-text">'+escH(S.fileName)+'</span>';fn.classList.remove('hidden');}
    else fn.classList.add('hidden');
  }
  var ac=document.getElementById('alerts-box'); ac.innerHTML='';
  if(S.errors.length)
    ac.innerHTML+='<div class="alert alert-err"><strong>'+S.errors.length+' error(s)</strong><br>'+S.errors.map(function(e){return'Row '+(e.ri+1)+' (Post '+e.pc+'): '+escH(e.msg);}).join('<br>')+'</div>';
  if(S.warnings.length)
    ac.innerHTML+='<div class="alert alert-warn"><strong>'+S.warnings.length+' warning(s)</strong><br>'+S.warnings.map(function(w){return'Post '+w.pc+': '+escH(w.msg);}).join('<br>')+'</div>';
  if(S.redRemovedCount)
    ac.innerHTML+='<div class="alert alert-warn"><strong>'+S.redRemovedCount+' red cell(s)/segment(s) ignored</strong><br>Red-colored content is treated as removed and excluded from parsing.</div>';
  if(S.posts.length===0){
    var sample=S.rawRows.slice(0,8).map(function(r,i){return'Row '+i+': '+r.slice(0,8).map(function(v,ci){return'['+ci+']="'+escH(String(v||''))+'"';}).join(' ');}).join('<br>');
    ac.innerHTML+='<div class="alert alert-warn">No posts detected. Col map: '+JSON.stringify(S.colMap)+'<br><code style="font-size:11px;line-height:1.9">'+sample+'</code></div>';
  } else if(!S.errors.length&&!S.warnings.length){
    ac.innerHTML='<div class="alert alert-ok">Parsed — '+S.posts.length+' post(s), no issues.</div>';
  } else if(!S.errors.length){
    ac.innerHTML+='<div class="alert alert-ok">No blocking errors — proceed.</div>';
  }
  var cb=document.getElementById('clarify-box');
  if(cb){
    cb.innerHTML='';
    var cl=S.clarifications||{stream:[],degree:[],radio:[]};
    // One card per duplicate group: a small axis tag, then the competing spellings as
    // chips (each carrying the postcode(s) it was found under, so the user can jump
    // straight to that post in the table instead of hunting through the sheet).
    var axisCard=function(axisTag,g){
      var chips=g.map(function(v){
        var pcs=(g.postcodes&&g.postcodes[v])||[];
        var pcTags=pcs.map(function(pc){return '<span class="clarify-chip-pc">'+escH(pc)+'</span>';}).join('');
        return '<span class="clarify-chip">"'+escH(v)+'"'+pcTags+'</span>';
      }).join('<span class="clarify-chip-sep">≈</span>');
      return '<div class="clarify-card"><span class="bd bd-grey clarify-axis-tag">'+axisTag+'</span>'+
        '<div class="clarify-chipset">'+chips+'</div></div>';
    };
    var boxes='';
    // Subject/Stream + Degree: values that LOOK like duplicates but were left as-is —
    // purely a "please review" flag, kept in the original blue info box.
    var axisCards=(cl.stream||[]).map(function(g){return axisCard('Stream',g);}).join('')+
      (cl.degree||[]).map(function(g){return axisCard('Degree',g);}).join('');
    if(axisCards){
      var axisCount=(cl.stream||[]).length+(cl.degree||[]).length;
      boxes+='<div class="alert alert-info clarify-panel">'+
        '<div class="clarify-panel-hdr"><span class="bd bd-b">VALUES</span> <strong>Possible duplicate Subject/Stream &amp; Degree values</strong> '+
        '<span class="clarify-count">'+axisCount+'</span></div>'+
        '<div class="clarify-cards">'+axisCards+'</div>'+
        '<div class="clarify-hint">These may be the same value spelled differently. This is informational only and does not block code generation — review and align spelling in the sheet if intentional.</div>'+
        '</div>';
    }
    // Radio-button duplicates get their own visually distinct box (amber, RADIO badge):
    // unlike the values above, these were ACTIVELY merged into ONE field name during
    // parsing (see disambiguateRadioNames), so the note reads as a resolution, not just
    // a heads-up, and must not be mistaken for the Subject/Stream/Degree review notice.
    if(cl.radio&&cl.radio.length){
      var radioCards=cl.radio.map(function(g){
        var chips=g.texts.map(function(v){return '<span class="clarify-chip">"'+escH(v)+'"</span>';}).join('<span class="clarify-chip-sep">≈</span>');
        return '<div class="clarify-card"><div class="clarify-chipset">'+chips+'</div>'+
          '<div class="clarify-hint">Merged into one field: <code>'+escH(g.fieldName)+'</code></div></div>';
      }).join('');
      boxes+='<div class="alert alert-warn clarify-panel">'+
        '<div class="clarify-panel-hdr"><span class="bd bd-o">RADIO</span> <strong>Duplicate radio button question(s) detected</strong> '+
        '<span class="clarify-count">'+cl.radio.length+'</span></div>'+
        '<div class="clarify-cards">'+radioCards+'</div>'+
        '<div class="clarify-hint">These are formatting-only variants of the same question — merged automatically. This is informational only and does not block code generation.</div>'+
        '</div>';
    }
    if(boxes) cb.innerHTML=boxes;
  }
  var totalC=S.posts.reduce(function(s,p){return s+p.orGroups.reduce(function(s2,g){return s2+g.conditions.length;},0);},0);
  document.getElementById('stats-row').innerHTML=
    '<div class="stat"><div class="stat-n">'+S.posts.length+'</div><div class="stat-l">Posts</div></div>'+
    '<div class="stat"><div class="stat-n">'+totalC+'</div><div class="stat-l">Conditions</div></div>'+
    '<div class="stat"><div class="stat-n">'+S.posts.reduce(function(s,p){return s+getAllRadios(p).length;},0)+'</div><div class="stat-l">Radio Questions</div></div>'+
    '<div class="stat"><div class="stat-n">'+S.posts.filter(function(p){return p.workExp;}).length+'</div><div class="stat-l">With Work Exp</div></div>'+
    '<div class="stat"><div class="stat-n">'+(S.errors.length||'0')+'</div><div class="stat-l">Errors</div></div>';
  // Show a dedicated Degree column only when the sheet actually carried a separate
  // Degree column (the parser sets S.colMap.degree only then). Stream-only sheets keep
  // the original 10-column layout unchanged. Column counts adjust accordingly:
  //   colSpanAll  — full table width (post-header / OR-separator rows)
  //   colSpanQ    — width of the radio question cell (everything between Type and Work Exp)
  var hasDegreeCol=(S.colMap&&S.colMap.degree!==undefined&&S.colMap.degree>=0);
  var colSpanAll=hasDegreeCol?11:10, colSpanQ=hasDegreeCol?5:4;
  // Toggle the Degree header column's visibility.
  var degHdr=document.querySelector('.ptbl th.col-degree');
  if(degHdr) degHdr.style.display=hasDegreeCol?'':'none';
  // The Degree <td> for an EDU row (empty string when the column is hidden).
  function degCell(cond){
    if(!hasDegreeCol) return '';
    var txt=(cond.degrees&&cond.degrees.length)?escH(cond.degrees.join(', ')):(cond.anyDegree?'<em>Any</em>':'<em>—</em>');
    return '<td class="dim" style="font-size:12px">'+txt+'</td>';
  }
  var tbody=document.getElementById('ptbl-body'); tbody.innerHTML='';
  // When Internal Candidate support is active and both sections have posts, render a
  // two-section tree: a "Normal Candidates" section header row, all normal posts, then
  // an "Internal Candidates" section header row, all internal posts.
  var isIntBranch=intEnabled()&&S.internalCandidate.posts&&S.internalCandidate.posts.length>0;
  function renderPostsIntoTbody(posts,sectionLabel){
    if(sectionLabel){
      var secRow=tbody.insertRow(); secRow.className='r-section';
      secRow.innerHTML='<td colspan="'+colSpanAll+'" style="background:#1a2940;color:#7dd3fc;font-weight:700;font-size:13px;padding:8px 12px;letter-spacing:.04em">'+escH(sectionLabel)+'</td>';
    }
    for(var pi=0;pi<posts.length;pi++){
      var post=posts[pi];
      var hr=tbody.insertRow(); hr.className='r-hdr';
      hr.innerHTML='<td colspan="'+colSpanAll+'">Post <strong>'+post.postcode+'</strong>: '+escH(post.postName)+(post.workExp?' <span class="bd bd-b">Work Exp: '+post.workExp/12+'yr</span>':'')+'</td>';
      for(var gi=0;gi<post.orGroups.length;gi++){
        if(gi>0){var sr=tbody.insertRow();sr.className='r-sep';sr.innerHTML='<td colspan="'+colSpanAll+'">── OR ──</td>';}
        var conds=post.orGroups[gi].conditions;
        for(var ci=0;ci<conds.length;ci++){
          var cond=conds[ci],tr=tbody.insertRow();
          tr.className=cond.status==='error'?'r-err':cond.status==='warn'?'r-warn':'r-ok';
          var sb=cond.status==='error'?'<span class="bd bd-r">Error</span>':cond.status==='warn'?'<span class="bd bd-o">Review</span>':'<span class="bd bd-g">OK</span>';
          var grpWe=post.orGroups[gi].workExp;
          if(cond.type==='edu'){
            var subTxt=cond.subjects.length?escH(cond.subjects.join(', ')):(cond.anyStream?'<em>Any</em>':'<em>—</em>');
            tr.innerHTML='<td>'+escH(post.postName)+'</td><td class="mono">'+post.postcode+'</td><td>'+(gi+1)+'</td><td><span class="bd bd-grey">EDU</span></td><td>'+escH(cond.level)+'</td>'+degCell(cond)+'<td class="dim" style="font-size:12px">'+subTxt+'</td><td class="mono">'+(cond.markRaw||'—')+'</td><td>'+escH(cond.gradeRaw||'—')+'</td><td>'+(grpWe?grpWe/12+'yr':'—')+'</td><td>'+sb+'</td>';
          }
          else
            tr.innerHTML='<td>'+escH(post.postName)+'</td><td class="mono">'+post.postcode+'</td><td>'+(gi+1)+'</td><td><span class="bd bd-o">RADIO</span></td><td colspan="'+colSpanQ+'" class="dim" style="font-size:12px">'+escH(cond.question)+'</td><td>'+(grpWe?grpWe/12+'yr':'—')+'</td><td>'+sb+'</td>';
        }
      }
    }
  }
  if(isIntBranch){
    renderPostsIntoTbody(S.posts,'Normal Candidates');
    renderPostsIntoTbody(S.internalCandidate.posts,'Internal Candidates');
  } else {
    renderPostsIntoTbody(S.posts,null);
  }
  document.getElementById('btn-s2').disabled=S.errors.length>0;
}

// ── UI STEP 2 — DIMENSION → POST-VARIABLE MAPPINGS ──────────────────────────
// Show every detected eligibility dimension (the columns before "Exam Passed")
// and let the user confirm/override the PHP $_POST variable name used for it.
// These names drive ALL generated conditions and array keys.
function renderDimCfg(){
  var con=document.getElementById('dim-cfg'); if(!con) return; con.innerHTML='';
  var dims=S.dimensions||[];
  if(dims.length<=1){
    // Single dimension (legacy POST-only sheet) — one editable POST-variable input,
    // pre-filled with 'postcode'. Editing it flows through updDimVar like the
    // multi-dimension inputs below.
    var d0=dims.length?dims[0]:{columnName:'Post',postVariable:'postcode'};
    con.innerHTML='<div class="sec-title">Eligibility Dimension → POST Variable</div>'
      +'<p class="dim" style="font-size:13px;margin-bottom:14px">Single eligibility dimension detected. Confirm the PHP <code>$_POST</code> variable name (standard postcode keying).</p>'
      +'<div class="radio-sec"><div class="f-row" style="align-items:flex-end">'
      +'<div class="f-grp"><label>Dimension 1 (column)</label><input type="text" value="'+escA(d0.columnName||'Post')+'" disabled style="opacity:.7"></div>'
      +'<div class="f-grp"><label>POST variable</label><input type="text" value="'+escA(d0.postVariable||'postcode')+'" data-di="0" oninput="updDimVar(this)"></div>'
      +'</div></div>';
    return;
  }
  con.innerHTML='<div class="sec-title">Eligibility Dimensions → POST Variables</div>'
    +'<p class="dim" style="font-size:13px;margin-bottom:14px">'+dims.length
    +' dimensions detected (in sheet order). Confirm the PHP <code>$_POST</code> variable name for each — these are used in every generated condition and array key.</p>';
  for(var i=0;i<dims.length;i++){
    var d=dims[i],row=document.createElement('div');row.className='radio-sec';
    row.innerHTML='<div class="f-row" style="align-items:flex-end">'
      +'<div class="f-grp"><label>Dimension '+(i+1)+' (column)</label><input type="text" value="'+escA(d.columnName)+'" disabled style="opacity:.7"></div>'
      +'<div class="f-grp"><label>POST variable</label><input type="text" value="'+escA(d.postVariable)+'" data-di="'+i+'" oninput="updDimVar(this)"></div>'
      +'</div>';
    con.appendChild(row);
  }
}
function updDimVar(el){
  var i=+el.dataset.di;
  if(S.dimensions[i]) S.dimensions[i].postVariable=el.value.trim()||S.dimensions[i].postVariable;
  updatePreview();
}

function markDupFieldNames(){
  var con=document.getElementById('radio-cfg');
  var inputs=con?con.querySelectorAll('input[data-f="fieldName"]'):[];
  var counts={};
  for(var i=0;i<inputs.length;i++){var v=inputs[i].value.trim();counts[v]=(counts[v]||0)+1;}
  for(var i=0;i<inputs.length;i++){
    var v=inputs[i].value.trim(),isDup=counts[v]>1;
    var grp=inputs[i].parentNode;
    var existing=grp.querySelector('.dup-warn');
    if(isDup&&!existing){
      var w=document.createElement('span');
      w.className='dup-warn';
      w.style.cssText='color:#c0392b;font-size:11px;display:block;margin-top:2px';
      w.textContent='⚠ Duplicate field name — enter a more specific name';
      grp.appendChild(w);
    } else if(!isDup&&existing){
      grp.removeChild(existing);
    }
  }
}
function renderS2(){
  renderDimCfg();
  var con=document.getElementById('radio-cfg'); con.innerHTML='';
  var rPosts=S.posts.filter(function(p){return getAllRadios(p).length>0;});
  if(rPosts.length){
    con.innerHTML='<div class="sec-title">Radio Question Field Names</div><p class="dim" style="font-size:13px;margin-bottom:14px">Review auto-derived field names below.</p>';
    for(var pi=0;pi<rPosts.length;pi++){
      var post=rPosts[pi],sec=document.createElement('div');sec.className='radio-sec';
      sec.innerHTML='<h4>Post '+escH(post.postcode)+': '+escH(post.postName)+'</h4>';
      var radios=getAllRadios(post);
      for(var ri=0;ri<radios.length;ri++){
        var r=radios[ri],ov=getOv(post.postcode,r.question);
        if(!ov.fieldName) ov.fieldName=r.fieldName;
        if(!ov.langKey)   ov.langKey=r.langKey;
        var row=document.createElement('div');
        row.innerHTML='<div class="q-text">Q: '+escH(r.question)+'</div>'
          +'<div class="f-row">'
          +'<div class="f-grp"><label>PHP Field Name</label><input type="text" value="'+escA(ov.fieldName)+'" data-pc="'+escA(post.postcode)+'" data-q="'+escA(r.question)+'" data-f="fieldName" oninput="updOv(this)"></div>'
          +'<div class="f-grp"><label>Lang Key</label><input type="text" value="'+escA(ov.langKey)+'" data-pc="'+escA(post.postcode)+'" data-q="'+escA(r.question)+'" data-f="langKey" oninput="updOv(this)"></div>'
          +'</div>';
        sec.appendChild(row);
      }
      con.appendChild(sec);
    }
    markDupFieldNames();
  } else {
    con.innerHTML='<div class="alert alert-info">No radio questions — nothing to configure.</div>';
  }
  var bc=document.getElementById('bilingual-chk'); if(bc) bc.checked=S.bilingual;
  renderApCfg();
  renderIntCfg();
  updatePreview();
}
function updOv(el){getOv(el.dataset.pc,el.dataset.q)[el.dataset.f]=el.value;if(el.dataset.f==='fieldName')markDupFieldNames();updatePreview();}
function updBilingual(el){S.bilingual=el.checked;updatePreview();}

// ── APPEARED / PASSED CONFIG (Step 2) ───────────────────────────────────────
// Distinct edu levels actually present across all posts' conditions, ordered by the
// canonical EDU_ORDER so the list is stable and reads top→bottom by qualification.
function apDistinctLevels(){
  var seen={};
  for(var pi=0;pi<S.posts.length;pi++){
    var grps=S.posts[pi].orGroups||[];
    for(var gi=0;gi<grps.length;gi++){
      var conds=grps[gi].conditions||[];
      for(var ci=0;ci<conds.length;ci++)
        if(conds[ci].type==='edu' && EDU[conds[ci].level]) seen[conds[ci].level]=true;
    }
  }
  return EDU_ORDER.filter(function(l){return seen[l];});
}
// Human hint about a level's place in the hierarchy (drives suppression behaviour).
function apRankHint(level){
  var def=EDU[level], info=def&&POSTQUAL_TS[def.idx];
  if(info&&info.acad>0) return 'academic rank '+info.acad;
  return 'special (no hierarchy precedence)';
}
function renderApCfg(){
  var con=document.getElementById('ap-cfg'); if(!con) return;
  con.innerHTML='';
  var levels=apDistinctLevels();
  S.appearedPassed=S.appearedPassed||{enabled:false,fields:{}};
  var ap=S.appearedPassed;

  var head=document.createElement('div');
  head.innerHTML='<div class="sec-title" style="margin-top:18px">Appeared / Passed Support</div>'
    +'<label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;margin-bottom:6px">'
    +'<input type="checkbox" id="ap-enable-chk" '+(ap.enabled?'checked':'')+' onchange="updApEnable(this)">'
    +'Enable Appeared / Passed Support</label>'
    +'<p class="dim" style="font-size:13px;margin-bottom:12px">When a candidate has only <b>Appeared</b> (A), marks &amp; grade are not required for that level; <b>Passed</b> (P) requires them as today. Appeared/Passed applies only to the <b>highest qualification</b> required by each post: if a post requires Graduation <b>and</b> Post Graduation, Graduation stays a normal check and only Post Graduation is treated as Appeared/Passed. Enable it on every level of a ladder so each post gates its own top qualification.</p>';
  con.appendChild(head);

  if(!ap.enabled) return;
  if(!levels.length){ con.innerHTML+='<div class="alert alert-info">No Exam Passed levels detected — nothing to configure.</div>'; return; }

  var sec=document.createElement('div'); sec.className='radio-sec';
  for(var i=0;i<levels.length;i++){
    var lvl=levels[i], selected=(ap.fields[lvl]!=null), fv=selected?ap.fields[lvl]:'';
    var row=document.createElement('div');
    row.innerHTML='<div class="f-row" style="align-items:flex-end">'
      +'<div class="f-grp" style="flex:0 0 auto"><label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;margin:0">'
        +'<input type="checkbox" data-level="'+escA(lvl)+'" '+(selected?'checked':'')+' onchange="updApLevel(this)">'
        +escH(lvl)+'</label><span class="dim" style="font-size:11px">'+escH(apRankHint(lvl))+'</span></div>'
      +'<div class="f-grp" style="flex:1">'+(selected
        ? '<label>$_POST field name</label><input type="text" value="'+escA(fv)+'" placeholder="e.g. '+escA(apSuggest(lvl))+'" data-level="'+escA(lvl)+'" data-apf="1" oninput="updApField(this)">'
        : '')+'</div>'
      +'</div>';
    sec.appendChild(row);
  }
  con.appendChild(sec);
  markApFieldIssues();
}
// Suggest a sane default field name from the level (purely a placeholder hint).
function apSuggest(level){
  var def=EDU[level];
  return (def&&def.lang?def.lang.replace(/^edu_lbl_/,''):'qual')+'_appeared';
}
// Warn on blank / whitespace / quote-bearing / duplicate AP field names — any of which
// would break the generated PHP string literal or make suppression ambiguous.
function markApFieldIssues(){
  var con=document.getElementById('ap-cfg'); if(!con) return;
  var inputs=con.querySelectorAll('input[data-apf="1"]');
  var counts={};
  for(var i=0;i<inputs.length;i++){var v=inputs[i].value.trim();if(v)counts[v]=(counts[v]||0)+1;}
  for(var i=0;i<inputs.length;i++){
    var raw=inputs[i].value, v=raw.trim(), msg='';
    if(!v) msg='⚠ Field name is required for a selected level';
    else if(/[\s'"\\]/.test(raw)) msg='⚠ Avoid spaces / quotes / backslashes in the field name';
    else if(counts[v]>1) msg='⚠ Duplicate field name — use a distinct name per level';
    var grp=inputs[i].parentNode, existing=grp.querySelector('.ap-warn');
    if(msg){
      if(!existing){var w=document.createElement('span');w.className='ap-warn';w.style.cssText='color:#c0392b;font-size:11px;display:block;margin-top:2px';grp.appendChild(w);existing=w;}
      existing.textContent=msg;
    } else if(existing){ grp.removeChild(existing); }
  }
}
function updApEnable(el){ S.appearedPassed.enabled=el.checked; renderApCfg(); updatePreview(); }
function updApLevel(el){
  var l=el.dataset.level;
  if(el.checked){ if(S.appearedPassed.fields[l]==null) S.appearedPassed.fields[l]=apSuggest(l); }
  else delete S.appearedPassed.fields[l];
  renderApCfg(); updatePreview();
}
function updApField(el){ S.appearedPassed.fields[el.dataset.level]=el.value; markApFieldIssues(); updatePreview(); }

// ── INTERNAL CANDIDATE CONFIG (Step 2) ──────────────────────────────────────
function renderIntCfg(){
  var con=document.getElementById('int-cfg'); if(!con) return;
  con.innerHTML='';
  S.internalCandidate=S.internalCandidate||{enabled:false,field:'internal_candidate',posts:[],ctx:null};
  var ic=S.internalCandidate;

  var sepDetected=(S.rawRows&&S.rawRows.length&&findInternalSeparator(S.rawRows)>=0);

  var head=document.createElement('div');
  head.innerHTML='<div class="sec-title" style="margin-top:18px">Internal / Departmental Candidate Support</div>'
    +'<label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;margin-bottom:6px">'
    +'<input type="checkbox" id="int-enable-chk" '+(ic.enabled?'checked':'')+' onchange="updIntEnable(this)">'
    +'Enable Internal Candidate Support</label>'
    +(sepDetected&&!ic.enabled?'<div class="alert alert-info" style="margin:6px 0 8px">Internal-candidate section detected in sheet — enable support to generate branched code.</div>':'')
    +'<p class="dim" style="font-size:13px;margin-bottom:12px">When enabled, the sheet is split at the separator row (e.g. "For Internal Candidates"). A runtime <code>if($_POST[\'field\']==\'Y\')</code> wraps the internal conditions; the else branch holds normal conditions.</p>';
  con.appendChild(head);

  if(!ic.enabled) return;

  var sec=document.createElement('div'); sec.className='radio-sec';
  sec.innerHTML='<div class="f-row" style="align-items:flex-end">'
    +'<div class="f-grp" style="flex:1"><label>Internal Candidate $_POST Field Name</label>'
    +'<input type="text" id="int-field-inp" value="'+escA(ic.field||'internal_candidate')+'" '
    +'placeholder="e.g. internal_candidate, is_departmental" oninput="updIntField(this)"></div>'
    +'</div>';
  con.appendChild(sec);

  // Show parse summary for the internal section.
  if(ic.posts&&ic.posts.length){
    con.innerHTML+='<div class="alert alert-ok" style="margin-top:8px">Internal section: '+ic.posts.length+' post(s) parsed.</div>';
  } else if(sepDetected){
    con.innerHTML+='<div class="alert alert-warn" style="margin-top:8px">Separator found but internal section yielded 0 posts — check sheet structure.</div>';
  } else {
    con.innerHTML+='<div class="alert alert-warn" style="margin-top:8px">No internal-candidate separator detected in the uploaded sheet.</div>';
  }
  markIntFieldIssues();
}
function markIntFieldIssues(){
  var inp=document.getElementById('int-field-inp'); if(!inp) return;
  var raw=inp.value, v=raw.trim(), msg='';
  if(!v) msg='⚠ Field name is required';
  else if(/[\s'"\\]/.test(raw)) msg='⚠ Avoid spaces / quotes / backslashes in the field name';
  var grp=inp.parentNode, existing=grp?grp.querySelector('.int-warn'):null;
  if(msg){
    if(!existing){var w=document.createElement('span');w.className='int-warn';w.style.cssText='color:#c0392b;font-size:11px;display:block;margin-top:2px';grp.appendChild(w);existing=w;}
    existing.textContent=msg;
  } else if(existing){ grp.removeChild(existing); }
}
function updIntEnable(el){
  S.internalCandidate.enabled=el.checked;
  reparse();  // toggle requires re-parse to split/unsplit the sheet
}
function updIntField(el){
  S.internalCandidate.field=el.value;
  markIntFieldIssues();
  updatePreview();  // field name change is generation-time only
}

function weNone(){
  var h=S.weHeader?(' (header: "'+S.weHeader+'")'):'';
  return '// work_exp_details_validations.php is NOT generated.\n'+
         '// The Work Experience column does not indicate Post-Qualification experience'+h+'.';
}
function isBranchMode(){
  return intEnabled() && S.internalCandidate.posts&&S.internalCandidate.posts.length>0 && S._normalCtx && S.internalCandidate.ctx;
}
function updatePreview(){
  var f=intField();
  if(isBranchMode()){
    var n=S.posts, ic=S.internalCandidate.posts, cN=S._normalCtx, cI=S.internalCandidate.ctx;
    setCode('pv-edu-code',   genEduConfigBranched(n,ic,cN,cI,f));
    setCode('pv-eli-code',   genEligibilityBranched(n,ic,cN,cI,f));
    setCode('pv-lang-code',  genLangFileBranched(n,ic));
    setCode('pv-eduval-code',genEduValidationsBranched(n,ic,cN,cI,f));
    setCode('pv-workexp-code',genWorkExpBranched(n,ic,cN,cI,f)||weNone());
    setCode('pv-qrysql-code',genEduQrySqlBranched(n,ic)||qrySqlNone());
  } else {
    setCode('pv-edu-code',genEduConfig(S.posts));
    setCode('pv-eli-code',genEligibility(S.posts));
    setCode('pv-lang-code',genLangFile(S.posts));
    setCode('pv-eduval-code',genEduValidations(S.posts));
    setCode('pv-workexp-code',genWorkExpDetails(S.posts)||weNone());
    setCode('pv-qrysql-code',genEduQrySql(S.posts)||qrySqlNone());
  }
}
function setCode(id,code){var el=document.getElementById(id);el.textContent=code;delete el.dataset.highlighted;try{hljs.highlightElement(el);}catch(e){}}
function switchTab(t){
  var tabs=['edu','eli','lang','eduval','workexp','qrysql'];
  for(var i=0;i<tabs.length;i++){
    document.getElementById('tab-'+tabs[i]).classList.toggle('on',t===tabs[i]);
    document.getElementById('pv-'+tabs[i]).classList.toggle('hidden',t!==tabs[i]);
  }
}

// ── UI STEP 3 ─────────────────────────────────────────────────────────────
// which -> {code, file}. work_exp content may be '' (not generated for this sheet).
function fileInfo(which){
  switch(which){
    case 'edu':     return {code:S._edu,     file:'edu_config.php'};
    case 'eli':     return {code:S._eli,     file:'eligibity_validation.php'};
    case 'eduval':  return {code:S._eduval,  file:'edu_validations.php'};
    case 'workexp': return {code:S._workexp, file:'work_exp_details_validations.php'};
    case 'qrysql': return {code:S._qrysql,  file:'eligibility_radio_fields.sql'};
    default:        // 'lang' falls here — same file returned either way
                    return {code:S._lang,    file:'edu_details_lang.php'};
  }
}
function renderS3(){
  var f=intField();
  if(isBranchMode()){
    var n=S.posts, ic=S.internalCandidate.posts, cN=S._normalCtx, cI=S.internalCandidate.ctx;
    S._edu=genEduConfigBranched(n,ic,cN,cI,f);
    S._eli=genEligibilityBranched(n,ic,cN,cI,f);
    S._lang=genLangFileBranched(n,ic);
    S._eduval=genEduValidationsBranched(n,ic,cN,cI,f);
    S._workexp=genWorkExpBranched(n,ic,cN,cI,f);
    S._qrysql=genEduQrySqlBranched(n,ic);
  } else {
    S._edu=genEduConfig(S.posts);S._eli=genEligibility(S.posts);S._lang=genLangFile(S.posts);
    S._eduval=genEduValidations(S.posts);S._workexp=genWorkExpDetails(S.posts);
    S._qrysql=genEduQrySql(S.posts);
  }
  setCode('out-edu',S._edu);setCode('out-eli',S._eli);setCode('out-lang',S._lang);
  setCode('out-eduval',S._eduval);setCode('out-workexp',S._workexp||weNone());
  setCode('out-qrysql',S._qrysql||qrySqlNone());
}
function qrySqlNone(){
  return '-- eligibility_radio_fields.sql is NOT generated.\n'+
         '-- No eligibility radio-button fields were detected, so there are no\n'+
         '-- educational_details columns to add. ($arrAdditionSection in edu_config.php\n'+
         '-- still contains "revision".)';
}
function copyCode(which,btn){
  var code=fileInfo(which).code||'';
  var ta=document.createElement('textarea');
  ta.value=code;ta.style.cssText='position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(ta);ta.focus();ta.select();
  try{document.execCommand('copy');}catch(e){}
  document.body.removeChild(ta);
  var orig=btn.innerHTML;btn.innerHTML='Copied!';
  btn.style.cssText='background:#238636;color:#fff;border:none';
  setTimeout(function(){btn.innerHTML=orig;btn.style.cssText='';},2000);
}
function dlFile(which){
  var fi=fileInfo(which);
  if(!fi.code){alert(fi.file+' is not generated for this sheet.');return;}
  var url=URL.createObjectURL(new Blob([fi.code],{type:'application/octet-stream'}));
  var a=document.createElement('a');a.href=url;a.download=fi.file;
  document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},100);
}
function dlZip(){
  if(typeof JSZip==='undefined'){alert('JSZip not loaded');return;}
  var zip=new JSZip();zip.file('edu_config.php',S._edu);zip.file('eligibity_validation.php',S._eli);zip.file('edu_details_lang.php',S._lang);zip.file('edu_validations.php',S._eduval);
  if(S._workexp) zip.file('work_exp_details_validations.php',S._workexp);
  if(S._qrysql) zip.file('eligibility_radio_fields.sql',S._qrysql);
  zip.generateAsync({type:'blob'}).then(function(blob){
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download='eligibility_code.zip';
    document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},100);
  });
}

// ── NAVIGATION ────────────────────────────────────────────────────────────
function goStep(n){
  [1,2,3].forEach(function(i){
    document.getElementById('step-'+i).classList.toggle('hidden',i!==n);
    var si=document.getElementById('si-'+i);
    si.classList.toggle('active',i===n);si.classList.toggle('done',i<n);
  });
  if(n===2) renderS2();
  if(n===3) renderS3();
}

  // ── exports to App ──
  App.copyCode = copyCode;
  App.dlFile = dlFile;
  App.dlZip = dlZip;
  App.fileInfo = fileInfo;
  App.goStep = goStep;
  App.onFileChange = onFileChange;
  App.renderDimCfg = renderDimCfg;
  App.updDimVar = updDimVar;
  App.renderS1 = renderS1;
  App.renderS2 = renderS2;
  App.renderS3 = renderS3;
  App.setCode = setCode;
  App.switchTab = switchTab;
  App.updOv = updOv;
  App.updBilingual = updBilingual;
  App.renderApCfg = renderApCfg;
  App.updApEnable = updApEnable;
  App.updApLevel = updApLevel;
  App.updApField = updApField;
  App.updatePreview = updatePreview;
  App.weNone = weNone;
  App.renderIntCfg = renderIntCfg;
  App.parseRows = parseRows;
  App.reparse = reparse;
  App.updIntEnable = updIntEnable;
  App.updIntField = updIntField;
})(window.App = window.App || {});
