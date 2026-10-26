/* Eligibility Code Generator — module: parsing/keyOverrides.js — user-supplied key arrays
   When the Step-2 "use my own keys" toggle is on, the user pastes the PHP arrays already
   declared in their config.php (one per dimension, plus the stream/degree arrays). Sheet
   labels are matched against the pasted labels and the pasted KEYS are used instead of the
   sequential ones. Toggle off (default) => every lookup returns null => legacy output. */
(function(App){
  var S = App.S;
  S.keyOverrides = S.keyOverrides || {enabled:false, dimCount:0, dimText:[], streamText:'', streamMap:{}, unmatchedDims:[]};

  // Same recipe as normPost / normS elsewhere (trim, collapse whitespace, lowercase), plus
  // typographic folding: Excel / Word turn 'A' into ‘A’ and - into – , config.php has the
  // plain ASCII forms, so those must compare equal.
  function norm(s){
    return String(s==null?'':s)
      .replace(/[‘’‚‛′´`]/g,"'")
      .replace(/[“”„‟″]/g,'"')
      .replace(/[‐-―−]/g,'-')
      .replace(/[\s ​]+/g,' ').trim().toLowerCase();
  }

  // ── PHP array literal parser ──────────────────────────────────────────────
  // Returns {arrayName: {key: label}}. Name is the variable before the first subscript
  // (`$a['01']['02'] = array(` -> "a"); same-named arrays (chained LHS, repeated) merge.
  function stripComments(t){
    var o='', i=0, q=null, n=t.length;
    while(i<n){
      var c=t[i];
      if(q){
        o+=c;
        if(c==='\\'&&i+1<n){ o+=t[i+1]; i+=2; continue; }
        if(c===q) q=null;
        i++; continue;
      }
      if(c==="'"||c==='"'){ q=c; o+=c; i++; continue; }
      if(c==='/'&&t[i+1]==='/' || c==='#'){ while(i<n&&t[i]!=='\n') i++; continue; }
      if(c==='/'&&t[i+1]==='*'){ var e=t.indexOf('*/',i+2); i=e<0?n:e+2; continue; }
      o+=c; i++;
    }
    return o;
  }
  function unq(s){   // s includes its quotes
    var q=s[0], b=s.slice(1,-1);
    return q==="'" ? b.replace(/\\(['\\])/g,'$1') : b.replace(/\\(["\\])/g,'$1');
  }
  // Parse an array literal starting at the `array(` / `[` at pos. Returns {entries,end}.
  function parseLit(t, pos){
    var m=/^(array\s*\(|\[)/.exec(t.slice(pos));
    var close=m[1]==='['?']':')';
    var i=pos+m[0].length, n=t.length, entries=[], auto=0;
    function ws(){ while(i<n&&/\s/.test(t[i])) i++; }
    // read one scalar/array value; returns {str:string|null}
    function readVal(){
      ws();
      var c=t[i];
      if(c==="'"||c==='"'){
        var j=i+1; while(j<n&&t[j]!==c){ if(t[j]==='\\') j++; j++; }
        var s=t.slice(i,j+1); i=j+1; return {str:unq(s)};
      }
      if(/^(array\s*\(|\[)/.test(t.slice(i))){ var r=parseLit(t,i); i=r.end; return {str:null}; }
      var st=i; while(i<n&&t[i]!==','&&t[i]!==close&&t[i]!=='=') i++;
      return {str:null, raw:t.slice(st,i).trim()};
    }
    while(i<n){
      ws();
      if(t[i]===close){ i++; break; }
      if(t[i]===','){ i++; continue; }
      var a=readVal(), key, val;
      ws();
      if(t[i]==='='&&t[i+1]==='>'){
        i+=2;
        key=a.str!=null?a.str:a.raw;
        val=readVal();
      } else { key=String(auto); val=a; }
      if(/^\d+$/.test(key) && +key>=auto) auto=+key+1;
      if(val.str!=null) entries.push({key:key,val:val.str});
    }
    return {entries:entries,end:i};
  }
  function parsePhpArrays(text){
    var t=stripComments(String(text||'')), out={}, order=[];
    var re=/\$([A-Za-z_]\w*)((?:\s*\[[^\]]*\])*)\s*=\s*(?=array\s*\(|\[)/g, m;
    while((m=re.exec(t))){
      var lit=parseLit(t, re.lastIndex);
      var name=m[1];
      if(!out[name]){ out[name]={}; order.push(name); }
      for(var k=0;k<lit.entries.length;k++){
        var e=lit.entries[k];
        if(out[name][e.key]===undefined) out[name][e.key]=e.val;
      }
      re.lastIndex=lit.end;
    }
    out._order=order;
    return out;
  }

  // ── label -> key indexes ──────────────────────────────────────────────────
  // Memoised on the source text so getStreamData (runs on every preview) stays cheap.
  var cache={};
  function parsedFor(text){
    if(!cache[text]) cache[text]=parsePhpArrays(text);
    return cache[text];
  }
  // Merge arrays -> {map:{normLabel:key}, max:Number, dup:[labels with >1 key]}.
  function indexOf(arrs){
    var map=Object.create(null), max=0, dup=[];
    for(var a=0;a<arrs.length;a++){
      for(var k in arrs[a]){
        if(k==='_order') continue;
        if(/^\d+$/.test(k) && +k<99 && +k>max) max=+k;
        var nl=norm(arrs[a][k]);
        if(map[nl]===undefined) map[nl]=k;
        else if(map[nl]!==k) dup.push(arrs[a][k]);
      }
    }
    return {map:map,max:max,dup:dup};
  }
  var idxCache={};
  function cachedIndex(sig, build){
    if(!idxCache[sig]) idxCache[sig]=indexOf(build());
    return idxCache[sig];
  }

  function enabled(){ var k=S.keyOverrides; return !!(k&&k.enabled); }

  // Dimension di (0 = Post) -> {map,max} or null when off / box empty.
  function dimLookup(di){
    if(!enabled()) return null;
    var txt=S.keyOverrides.dimText[di];
    if(!txt||!txt.trim()) return null;
    var ix=cachedIndex('d|'+txt, function(){
      var p=parsedFor(txt), arrs=[];
      for(var i=0;i<p._order.length;i++) arrs.push(p[p._order[i]]);
      return arrs;
    });
    return Object.keys(ix.map).length?ix:null;
  }

  // ── stream / degree arrays ────────────────────────────────────────────────
  // Strip the generator suffixes so $arrX, $arrX_cond2, $arrX_internal_cond1 all belong to $arrX.
  function baseName(n){ return n.replace(/(_internal)?(_cond\d+)?$/,''); }
  // Array name -> 'Level|axis' by the EDU names the generator emits; user can override via streamMap.
  function autoTarget(base){
    for(var lv in App.EDU){
      var d=App.EDU[lv];
      if(d.stream===base) return lv+'|stream';
      if(d.degree===base) return lv+'|degree';
    }
    return '';
  }
  function streamArrays(){
    var txt=S.keyOverrides.streamText||'';
    var p=parsedFor(txt), res=[];
    for(var i=0;i<p._order.length;i++){
      var raw=p._order[i], b=baseName(raw);
      var target=(S.keyOverrides.streamMap&&S.keyOverrides.streamMap[b])||autoTarget(b);
      res.push({name:raw, base:b, target:target, arr:p[raw]});
    }
    return res;
  }
  // Distinct base names + effective targets, for the UI mapping table.
  function streamTargets(){
    var seen={}, res=[], a=streamArrays();
    for(var i=0;i<a.length;i++){
      if(seen[a[i].base]) { seen[a[i].base].count+=Object.keys(a[i].arr).length; continue; }
      seen[a[i].base]={base:a[i].base,target:a[i].target,count:Object.keys(a[i].arr).length};
      res.push(seen[a[i].base]);
    }
    return res;
  }
  // (level, axisKey 'stream'|'degree') -> {map,max} or null.
  function axisLookup(level, axisKey){
    if(!enabled()) return null;
    var txt=S.keyOverrides.streamText;
    if(!txt||!txt.trim()) return null;
    var want=level+'|'+axisKey, arrs=[], all=streamArrays();
    for(var i=0;i<all.length;i++) if(all[i].target===want) arrs.push(all[i].arr);
    if(!arrs.length) return null;
    var sig='s|'+want+'|'+txt+'|'+JSON.stringify(S.keyOverrides.streamMap||{});
    return cachedIndex(sig, function(){ return arrs; });
  }

  // Unmatched tracking for the UI (dimensions are recorded during parse).
  function resetUnmatched(){ S.keyOverrides.unmatchedDims=[]; }
  function noteUnmatchedDim(di,value){
    var u=S.keyOverrides.unmatchedDims;
    if(!u[di]) u[di]=[];
    if(u[di].indexOf(value)<0) u[di].push(value);
  }
  // Stream/degree sheet values with no pasted label: [{level,axis,value}].
  function streamUnmatched(posts){
    var out=[], seen={};
    if(!enabled()) return out;
    var axes=[{key:'stream',vals:'subjects'},{key:'degree',vals:'degrees'}];
    for(var pi=0;pi<posts.length;pi++) for(var gi=0;gi<posts[pi].orGroups.length;gi++){
      var cs=posts[pi].orGroups[gi].conditions;
      for(var ci=0;ci<cs.length;ci++){
        var c=cs[ci]; if(c.type!=='edu') continue;
        for(var ai=0;ai<axes.length;ai++){
          var vals=c[axes[ai].vals]; if(!vals||!vals.length) continue;
          var ix=axisLookup(c.level, axes[ai].key); if(!ix) continue;
          for(var vi=0;vi<vals.length;vi++){
            var nl=norm(vals[vi]);
            if(/^(others?|equivalent)$/.test(nl)) continue;
            var id=c.level+'|'+axes[ai].key+'|'+nl;
            if(ix.map[nl]===undefined && !seen[id]){ seen[id]=1; out.push({level:c.level,axis:axes[ai].key,value:vals[vi]}); }
          }
        }
      }
    }
    return out;
  }

  App.KO = {
    norm:norm, parsePhpArrays:parsePhpArrays, enabled:enabled,
    dimLookup:dimLookup, axisLookup:axisLookup, streamTargets:streamTargets,
    resetUnmatched:resetUnmatched, noteUnmatchedDim:noteUnmatchedDim, streamUnmatched:streamUnmatched,
    dimIndex:function(txt){ var p=parsedFor(txt), a=[]; for(var i=0;i<p._order.length;i++) a.push(p[p._order[i]]); return indexOf(a); }
  };
})(window.App = window.App || {});
