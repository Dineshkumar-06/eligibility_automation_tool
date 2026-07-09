/* Eligibility Code Generator — module: core/dimensions.js — N-dimensional eligibility helpers
   Part of the namespaced App.* module set.

   The generator used to key everything on a single "postcode". This module
   generalises that to N ordered dimensions (Post, Recruitment Mode, Discipline,
   …) detected from the columns BEFORE "Exam Passed" in the sheet.

   The shared dimension SCHEMA lives at S.dimensions:
       [ {columnName:'POST', postVariable:'postcode'},
         {columnName:'Method of Recruitement', postVariable:'recrtmnt_mode'}, … ]
   Order is the column order from the sheet and is preserved everywhere.

   Each post carries post.dimensions — an ordered array of value codes that lines
   up 1:1 with S.dimensions, e.g. ['01','02']. post.postcode stays as an alias of
   the FIRST dimension value so legacy sorting / single-dim paths keep working.

   BACKWARD COMPATIBILITY: when there is exactly one dimension and its post
   variable is 'postcode', every helper here emits byte-for-byte what the old
   single-post code emitted ($postcode variable, if($postcode == "01"),
   arr[$postcode]). Only multi-dimension sheets take the new inline form. */
(function(App){
  var S = App.S;
  var ind = App.ind;

  // ── schema queries ─────────────────────────────────────────────────────────
  function dims(){ return S.dimensions || []; }
  function dimCount(){ return dims().length; }
  // True for the legacy layout: a single dimension whose POST variable is the
  // classic 'postcode'. Drives byte-identical output for old single-post sheets.
  function isLegacy(){ var d=dims(); return d.length===1 && d[0].postVariable==='postcode'; }

  // Ordered value codes for a post, aligned with S.dimensions.
  // Falls back to [post.postcode] so code paths that run before dimensions are
  // assigned (or on legacy posts) still work.
  function dimVals(post){
    if(post && post.dimensions && post.dimensions.length) return post.dimensions;
    return [post && post.postcode!=null ? post.postcode : ''];
  }

  // Stable join of a value list — used as a map key for dedup / grouping.
  function comboKey(vals){ return vals.join('|'); }

  // ── PHP emission ────────────────────────────────────────────────────────────

  // The "$postcode = $_POST['postcode']; …" assignment block emitted once near
  // the top of a generated file. Returns '' when there are no dimensions.
  // indentLvl defaults to 1 (one tab), matching the legacy single line.
  function assignDeclares(indentLvl){
    var d=dims(); if(!d.length) return '';
    var lvl=indentLvl==null?1:indentLvl, o='';
    for(var i=0;i<d.length;i++)
      o+=ind(lvl)+'$'+d[i].postVariable+" = $_POST['"+d[i].postVariable+"'];\n";
    return o;
  }

  // Boolean PHP expression that tests this post's full dimension combination.
  //   legacy (1 dim, postcode): uses the $postcode VARIABLE, single-line, double
  //     quotes — exactly the old `$postcode == "01"`.
  //   N dims: multi-line, &&-joined `$_POST['var'] == '01'` (matches the spec).
  // opts.useVar (default true for legacy, false otherwise): compare against the
  //   assigned $var instead of $_POST['var'].
  // opts.indent: base indent for the multi-line N-dim form.
  function dimCond(post, opts){
    opts=opts||{};
    var vals=dimVals(post), d=dims();
    if(isLegacy() && !opts.postArr){
      // byte-identical to the old code: if($postcode == "01")
      return '$'+d[0].postVariable+' == "'+vals[0]+'"';
    }
    var useVar=opts.useVar===true && !opts.postArr;
    var base=opts.indent==null?0:opts.indent;
    var parts=[];
    for(var i=0;i<d.length;i++){
      var lhs=useVar ? '$'+d[i].postVariable : "$_POST['"+d[i].postVariable+"']";
      parts.push(lhs+" == '"+vals[i]+"'");
    }
    if(opts.inline) return parts.join(' && ');
    // multi-line, parenthesised — the spec's preferred shape
    var o='(\n';
    for(var j=0;j<parts.length;j++) o+=ind(base+1)+parts[j]+(j<parts.length-1?' &&':'')+'\n';
    o+=ind(base)+')';
    return o;
  }

  // Nested-array subscript string for a value list: ['01']['02']…['0N'].
  function dimPath(vals){
    var o=''; for(var i=0;i<vals.length;i++) o+="['"+vals[i]+"']"; return o;
  }
  // Convenience: subscript string for a post.
  function dimPathOf(post){ return dimPath(dimVals(post)); }

  // Variable-based subscript string for array access in generated conditions:
  //   legacy (1 dim/postcode) -> [$postcode]
  //   N dimensions            -> [$postcode][$recrtmnt_mode]…
  // This is the correct form for runtime array lookups in eligibility conditions
  // because the variables are declared at the top of the generated file by
  // assignDeclares() and hold the submitted form values.
  function dimPathVars(){
    var d=dims(), o='';
    for(var i=0;i<d.length;i++) o+='[$'+d[i].postVariable+']';
    return o;
  }

  // ── nested PHP array construction ────────────────────────────────────────────
  // Build a deeply-nested PHP array literal from a map keyed by comboKey.
  //   entries: [{vals:['01','02'], render:function(indentLvl)->string}]
  // Produces:  ['01'=>array('02'=>array( <render> )))  with proper indentation.
  // Used by arrPostBasedRadioCond. Honours dimension order via the vals arrays.
  function buildNested(varName, entries, indentLvl){
    var lvl=indentLvl==null?1:indentLvl;
    // group recursively by successive dimension value
    function group(list, depth){
      var order=[], buckets={};
      for(var i=0;i<list.length;i++){
        var k=list[i].vals[depth];
        if(buckets[k]===undefined){buckets[k]=[];order.push(k);}
        buckets[k].push(list[i]);
      }
      return {order:order, buckets:buckets};
    }
    function emit(list, depth, curLvl){
      // leaf level: every item's vals are fully consumed
      var isLeaf = list[0].vals.length===depth;
      if(isLeaf) return list[0].render(curLvl);
      var g=group(list, depth), o='array(\n';
      for(var i=0;i<g.order.length;i++){
        var k=g.order[i];
        o+=ind(curLvl+1)+"'"+k+"' => "+emit(g.buckets[k], depth+1, curLvl+1);
        // trailing comma after EVERY entry (matches the original emit convention)
        o+=',\n';
      }
      o+=ind(curLvl)+')';
      return o;
    }
    if(!entries.length) return '';
    return ind(lvl)+'$'+varName+' = '+emit(entries,0,lvl)+';\n';
  }

  // ── identical-array deduplication ────────────────────────────────────────────
  // Given items [{vals, hash, lhs, literal}], emit each distinct hash once as a
  // literal and subsequent identical ones as a reference to the first.
  //   lhs(vals)      -> left-hand side string e.g. "$arr['02']['01']"
  //   literal(vals)  -> the full "$arr[…] = array(...);\n" assignment string
  // Returns the concatenated PHP. The FIRST occurrence (sheet order) is the
  // canonical literal; later identical combos become `$arr[b] = $arr[a];`.
  function emitWithDedup(items, lhsFn, literalFn){
    var seen={}, o='';
    for(var i=0;i<items.length;i++){
      var it=items[i];
      if(seen[it.hash]!==undefined){
        o+=ind(1)+lhsFn(it.vals)+' = '+seen[it.hash]+';\n';
      } else {
        seen[it.hash]=lhsFn(it.vals);   // remember canonical LHS for references
        o+=literalFn(it.vals);
      }
    }
    return o;
  }

  // ── exports ──────────────────────────────────────────────────────────────────
  App.dims = dims;
  App.dimCount = dimCount;
  App.isLegacyDims = isLegacy;
  App.dimVals = dimVals;
  App.comboKey = comboKey;
  App.assignDeclares = assignDeclares;
  App.dimCond = dimCond;
  App.dimPath = dimPath;
  App.dimPathOf = dimPathOf;
  App.dimPathVars = dimPathVars;
  App.buildNested = buildNested;
  App.emitWithDedup = emitWithDedup;
})(window.App = window.App || {});
