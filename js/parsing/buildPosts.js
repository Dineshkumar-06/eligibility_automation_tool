/* Eligibility Code Generator — module: parsing/buildPosts.js — turn spreadsheet rows into the post/condition tree
   Part of the namespaced App.* module set. Logic is unchanged from the
   original single-file version; only wrapped for modular loading. */
(function(App){
  // ── imports from App ──
  var EDU = App.EDU;
  var lookupMarkOp = App.lookupMarkOp;
  var S = App.S;
  var defaultPostVar = App.defaultPostVar;
  var deriveField = App.deriveField;
  var isRadioQuestion = App.isRadioQuestion;
  var disambiguateRadioNames = App.disambiguateRadioNames;
  var detectCols = App.detectCols;
  var isCat = App.isCat;
  var isPostQuali = App.isPostQuali;
  var matchLevel = App.matchLevel;
  var normGrade = App.normGrade;
  var normMark = App.normMark;
  var parseSubs = App.parseSubs;
  var parseWE = App.parseWE;

function parseFile(buf){
  var wb=XLSX.read(buf,{type:'array'});
  var ws=wb.Sheets[wb.SheetNames[0]];
  var rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
  return buildPosts(rows);
}

// Public wrapper — single-section path. Calls buildPostsRange on the full rows
// and returns the same shape as before. Backward-compatible with all callers.
function buildPosts(rows){
  return buildPostsRange(rows);
}

// Core parser. Accepts a slice of rows (may be the full sheet, or just one
// section). Detects the header inside the slice, builds the post/condition tree,
// and returns {posts, errors, warnings, rawRows}. Also updates S.colMap,
// S.dimensions, S.weHeader, S.weMode as side effects (callers needing context
// isolation must snapshot/restore via snapCtx/withCtx).
function buildPostsRange(rows){
  var posts=[],errors=[],warnings=[],cur=null,grp=null;
  var CI=detectCols(rows); S.colMap=CI;
  function get(r,ci){return ci>=0&&ci<r.length?String(r[ci]==null?'':r[ci]).trim():'';}
  // Parse a Subject/Stream- or Degree-axis cell into {vals, any}. `enabled` is the
  // level's hasStream/hasDegree flag; a disabled axis (or absent column) yields none.
  // "Any value" collapses to {vals:[], any:true} exactly like the stream axis.
  function parseAxis(enabled,cell){
    if(!enabled||!cell) return {vals:[],any:false};
    var raw=parseSubs(cell);
    var isAny=raw.length===1&&raw[0]==='__ANY__';
    return {vals:isAny?[]:raw, any:isAny};
  }

  // ── Work-Experience mode (drives work_exp_details_validations.php) ─────────
  // The "Post Qualification" wording lives in the COLUMN HEADER, not the per-post
  // cell (cells hold "04 YEARS" etc.). Decide from the header via substring match:
  //   header has "post qualification", no "/"  -> Case 1: ALL posts participate
  //   header has "post qualification" AND "/"  -> Case 3: per-post (inspect each cell)
  //   header has no "post qualification"       -> Case 2: none participate
  var weHeader=CI.workexp>=0?get(rows[CI._hdrRow]||[],CI.workexp):'';
  var weHdr=weHeader.toLowerCase().replace(/\s+/g,' ');
  var weHdrPQ=/post[\s_-]*qualification/.test(weHdr);
  var weMixed=weHdrPQ && weHdr.indexOf('/')>=0;     // both plain & post-qual offered
  S.weHeader=weHeader; S.weMode=weHdrPQ?(weMixed?3:1):2;
  // postQuali for a post given its work-exp cell text G
  function postQualiOf(G){ return weMixed ? isPostQuali(G) : weHdrPQ; }

  // ── Dimension schema + per-dimension value→code registry ───────────────────
  // CI.dims is the ordered list of dimension columns ([{columnName,col}]). Build
  // the S.dimensions schema (with default POST-variable names; the user can
  // override these in Step 2 without re-parsing) and a per-column registry that
  // assigns a stable zero-padded code to each distinct value, first-seen order.
  var DIMS=(CI.dims&&CI.dims.length)?CI.dims:[{columnName:'Post',col:CI.post}];
  // A single dimension is ALWAYS the post and ALWAYS keys on 'postcode' (legacy
  // byte-identical path), regardless of the column's header text. Only multi-
  // dimension sheets derive per-column variable names from their headers.
  var singleDim=DIMS.length===1;
  S.dimensions=DIMS.map(function(d){return {columnName:d.columnName, postVariable:singleDim?'postcode':defaultPostVar(d.columnName)};});
  var dimReg=DIMS.map(function(){return {map:{},next:1};});  // per-dim value->code
  function dimCode(di,value){
    var reg=dimReg[di];
    if(reg.map[value]===undefined){reg.map[value]=String(reg.next).padStart(2,'0');reg.next++;}
    return reg.map[value];
  }
  // Raw dimension cell values for a row (post col is dim 0).
  function rowDimCells(r){return DIMS.map(function(d){return get(r,d.col);});}
  // True when this row opens a new post (a new dimension COMBINATION). A post's
  // dimension cells appear ONLY on its first row; continuation rows (AND/OR
  // separators, extra edu/radio conditions) leave every dimension cell blank.
  // Therefore a row that carries a non-blank value in ANY dimension column — not
  // only the first/Post column — marks a fresh combination.
  //
  // This matters for real 2-D sheets where the distinguishing axis is NOT the
  // post name: e.g. "Name of Post | Trade | …" repeats the post name only on its
  // first trade and leaves it blank for the rest (the Trade cell carries the new
  // value), or "Sr.No | Post | Functional Area | …" leaves the Post cell blank
  // for later posts (a fresh Sr.No / Functional Area marks them). Keying solely on
  // dimension 0 collapsed all those combinations into the previous post.
  //
  // The matchLevel/AND-OR/radio guard disambiguates ONLY the layout where the Post
  // column coincides with the Field column (legacy single-column sheets): there a
  // cell like "Graduation" or "OR" is a level/separator, not a post. When Post is a
  // DISTINCT column from Field, a non-blank dimension cell is unambiguously a new
  // combination — continuation rows leave it blank — so the guard must NOT fire.
  // Otherwise a real post name that merely contains an education keyword (e.g.
  // "Post Graduate Insolvency Programme" → matchLevel = "Post Graduation") is
  // wrongly skipped and the sheet yields zero posts.
  var postIsOwnColumn = (CI.post!==undefined && CI.field!==undefined && CI.post!==CI.field);
  function isDimHeaderRow(cells, numSrno){
    // Legacy single-column layout (Post col == Field col): dimension 0 carries the
    // education level / separator text, so apply the original guard against dim 0.
    if(!postIsOwnColumn){
      var pv=cells[0];
      if(!pv) return false;
      if(matchLevel(pv)||/^(AND|OR)$/i.test(pv)||isRadioQuestion(pv)) return false;
      return pv.length>2 || (!isNaN(+pv)&&+pv>0);   // a name, or a numeric srno
    }
    // Multi-/own-column layout: a new combination is signalled by a non-blank value
    // in ANY dimension column, or by a fresh numeric Sr.No (covers sheets whose
    // Post cell is merged-blank for later posts but whose Sr.No still advances).
    for(var i=0;i<cells.length;i++) if(cells[i]) return true;
    return !!numSrno;
  }

  var curWeMonths=0;
  var hasGradeCol=CI.grade>=0;
  var hasMarksCol=CI.marks>=0;
  for(var ri=CI._hdrRow+1;ri<rows.length;ri++){
    var r=rows[ri];
    var A=get(r,CI.srno),B=get(r,CI.post),C=get(r,CI.field);
    var D=get(r,CI.subject),E=get(r,CI.marks),F=get(r,CI.grade);
    var DG=(CI.degree!==undefined&&CI.degree>=0)?get(r,CI.degree):'';
    var G=CI.workexp>=0?get(r,CI.workexp):'';

    var dimCells=rowDimCells(r);
    var isNumSrno=A&&!isNaN(+A)&&+A>0&&+A===Math.floor(+A);
    // A new post is signalled by a non-blank cell in ANY dimension column (or a
    // fresh numeric Sr.No). Repeated post names with differing later-dimension
    // values are therefore each treated as a separate post (the N-dimensional
    // case), unlike the legacy name-dedup.
    var isNewPost=isDimHeaderRow(dimCells, isNumSrno);

    // Work-exp months. A NEW post resets the running value from ITS OWN cell
    // (0 when the cell holds no duration) so it never inherits the previous
    // post's work experience. Continuation rows (AND/OR) keep inheriting the
    // post's value, only updating when their own cell carries a duration.
    if(isNewPost) curWeMonths=(G?parseWE(G):null)||0;
    else if(G){var gv=parseWE(G);if(gv) curWeMonths=gv;}

    if(isNewPost){
      if(cur) posts.push(cur);
      grp={conditions:[],workExp:curWeMonths};
      // Per-dimension value codes for this combination. The FIRST dimension (post)
      // honours a numeric Sr.No. when present (legacy behaviour: postcode == srno);
      // otherwise it is sequenced like the others. Later dimensions always use the
      // per-column first-seen sequence (Promotion=01, Nomination=02, …).
      var dimValues=[];
      for(var dvi=0;dvi<DIMS.length;dvi++){
        var raw=dimCells[dvi];
        if(dvi===0 && DIMS.length===1 && isNumSrno){
          // legacy: single dimension and a numeric Sr.No. — post code == Sr.No.
          dimValues.push(String(Math.round(+A)).padStart(2,'0'));
        } else {
          // blank dimension cell still needs a stable code; key it on the row so
          // distinct blank rows don't collapse into one combination.
          dimValues.push(dimCode(dvi, raw!==''?raw:'__blank'+dvi+'_'+ri));
        }
      }
      // post NAME: when the Sr.No. column is numeric and the post column differs,
      // the readable name lives in the post column (B); otherwise it's dim 0's cell.
      // When that cell is blank (a merged post name shared across several rows, e.g.
      // a "Name of Post | Trade" sheet whose later trades leave the name blank), fall
      // back to the first non-blank dimension cell so the row still has a label.
      var postNameVal=(isNumSrno&&CI.post!==CI.srno)?(B||''):dimCells[0];
      if(!postNameVal){ for(var dni=0;dni<dimCells.length;dni++){ if(dimCells[dni]){ postNameVal=dimCells[dni]; break; } } }
      cur={
        dimensions:dimValues,
        postcode:dimValues[0],
        postName:postNameVal,
        workExp:curWeMonths,workExpRaw:G,postQuali:postQualiOf(G),orGroups:[grp],ri:ri
      };
      // A post whose Field cell is itself a radio question (e.g. "...? Select
      // Yes / No Should be Yes") has NO inline education condition — handle the
      // radio here, mirroring the continuation-row logic below. Checking this
      // before matchLevel() prevents question text that happens to contain an
      // education keyword (e.g. "Certificate", "degree") from being misread as
      // a degree/edu condition.
      if(C&&isRadioQuestion(C)){
        var fdI=deriveField(C);
        if(fdI.amb) warnings.push({ri:ri,pc:cur.postcode,msg:'Radio field name may need review: "'+fdI.fn+'"'});
        grp.conditions.push({type:'radio',question:C,fieldName:fdI.fn,langKey:fdI.lk,shouldBe:fdI.shouldBe,ri:ri,status:fdI.amb?'warn':'ok',words:fdI.words});
        continue;
      }
      var inlineLvl=matchLevel(C);
      if(inlineLvl){
        var mk=normMark(E),gk=hasGradeCol?normGrade(F):null;
        if(mk&&!isCat(mk)&&!lookupMarkOp(mk))
          errors.push({ri:ri,pc:cur.postcode,msg:'Unknown mark operator "'+E+'"'});
        else {
          var rawSubsI=EDU[inlineLvl].hasStream?parseSubs(D):[];
          var isAnyI=rawSubsI.length===1&&rawSubsI[0]==='__ANY__';
          var degI=parseAxis(EDU[inlineLvl].hasDegree,DG);
          grp.conditions.push({type:'edu',level:inlineLvl,subjects:isAnyI?[]:rawSubsI,anyStream:isAnyI,degrees:degI.vals,anyDegree:degI.any,markRaw:mk,markRawOrig:E,gradeRaw:gk,hasMarksCol:hasMarksCol,ri:ri,status:'ok',condName:'',degreeCondName:''});
        }
      }
      continue;
    }
    if(!cur) continue;
    if(!C){
      // A radio question is sometimes typed into the Subject/Stream column (D) on a
      // continuation row whose Field cell (C) was left blank/merged. Detect that here
      // so the question is not silently dropped — it is the same radio condition,
      // just authored in the wrong column. (Field-column radios are handled below.)
      if(isRadioQuestion(D)){
        var fdD=deriveField(D);
        if(fdD.amb) warnings.push({ri:ri,pc:cur.postcode,msg:'Radio field name may need review: "'+fdD.fn+'"'});
        if(grp) grp.conditions.push({type:'radio',question:D,fieldName:fdD.fn,langKey:fdD.lk,shouldBe:fdD.shouldBe,ri:ri,status:fdD.amb?'warn':'ok',words:fdD.words});
        continue;
      }
      // Merged-cell continuation: the Field cell is blank because the education
      // level was merged across rows in the sheet, but this row still carries a
      // marks cell (E) — typically the "for All other category" half of a
      // category-split mark whose "for SC/ST" half sat on the previous row.
      // Merge the two single-threshold marks into one CAT: mark on the previous
      // edu condition. (No marks cell -> truly empty row, skip.)
      if(E&&grp&&grp.conditions.length){
        var prev=grp.conditions[grp.conditions.length-1];
        if(prev&&prev.type==='edu'&&prev.markRawOrig){
          var combined=normMark(prev.markRawOrig+', '+E);
          if(isCat(combined)){
            prev.markRaw=combined;
            prev.markRawOrig=prev.markRawOrig+', '+E;
          }
        }
      }
      continue;
    }
    var Cup=C.toUpperCase().trim();
    if(Cup==='OR'){grp={conditions:[],workExp:curWeMonths};cur.orGroups.push(grp);continue;}
    if(Cup==='AND') continue;
    if(grp) grp.workExp=curWeMonths;
    if(isRadioQuestion(C)){
      var fd=deriveField(C);
      if(fd.amb) warnings.push({ri:ri,pc:cur.postcode,msg:'Radio field name may need review: "'+fd.fn+'"'});
      grp.conditions.push({type:'radio',question:C,fieldName:fd.fn,langKey:fd.lk,shouldBe:fd.shouldBe,ri:ri,status:fd.amb?'warn':'ok',words:fd.words});
      continue;
    }
    var lvl=matchLevel(C);
    if(lvl){
      var mk=normMark(E),gk=hasGradeCol?normGrade(F):null;
      if(mk&&!isCat(mk)&&!lookupMarkOp(mk)){
        errors.push({ri:ri,pc:cur.postcode,msg:'Unknown mark operator "'+E+'"'});
        grp.conditions.push({type:'edu',level:lvl,subjects:[],anyStream:false,degrees:[],anyDegree:false,markRaw:mk,gradeRaw:gk,hasMarksCol:hasMarksCol,ri:ri,status:'error',condName:'',degreeCondName:''});
      } else {
        var rawSubs=EDU[lvl].hasStream?parseSubs(D):[];
        var isAny=rawSubs.length===1&&rawSubs[0]==='__ANY__';
        var deg=parseAxis(EDU[lvl].hasDegree,DG);
        grp.conditions.push({type:'edu',level:lvl,subjects:isAny?[]:rawSubs,anyStream:isAny,degrees:deg.vals,anyDegree:deg.any,markRaw:mk,markRawOrig:E,gradeRaw:gk,hasMarksCol:hasMarksCol,ri:ri,status:'ok',condName:'',degreeCondName:''});
      }
      continue;
    }
    if(C.length>3&&!/^[-\s]+$/.test(C)&&!/^\d+$/.test(C))
      errors.push({ri:ri,pc:cur?cur.postcode:'?',msg:'Unknown value in Field column: "'+C+'"'});
  }
  if(cur) posts.push(cur);
  disambiguateRadioNames(posts);
  return{posts:posts,errors:errors,warnings:warnings,rawRows:rows};
}

  // ── exports to App ──
  App.buildPosts = buildPosts;
  App.buildPostsRange = buildPostsRange;
  App.parseFile = parseFile;
})(window.App = window.App || {});
