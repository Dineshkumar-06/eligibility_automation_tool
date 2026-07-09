/* Eligibility Code Generator — module: parsing/colorFilter.js — treat RED content as "removed"
   ---------------------------------------------------------------------------
   Reviewers mark REMOVED requirements by coloring them RED — a red cell fill, a
   red font (often bold + strikethrough), or (within a cell) only PART of the
   text via a red rich-text run (e.g. striking out one subject in a "/"-list).
   SheetJS reads text only and is blind to color, so this module reads the color
   itself and produces a cleanup map the UI applies to the flattened rows BEFORE
   the normal parse runs. The downstream pipeline never sees the removed items.

   An .xlsx is a ZIP; JSZip is already loaded on the page. We read the raw parts
   (styles / theme / sharedStrings / worksheet XML) and compute red cells + the
   black-only text for partially-red cells. XML is parsed with small regexes (not
   DOMParser) so the same code runs unchanged in the browser AND in Node tests —
   Excel's machine-generated XML is regular enough for this to be reliable.

   Exports:
     App.extractRedFilter(arrayBuffer) -> Promise<{redCells:Set, cleanText:Map, count}>
     App.applyRedFilter(rows, rf, range)  -> void  (mutates rows in place)
   Both are pure w.r.t. app state; the UI (ui.js onFileChange) wires them in. */
(function(App){

  // ── tiny XML helpers (regex-based, environment-agnostic) ──────────────────
  function attr(tag, name){
    var m = new RegExp('\\b'+name+'="([^"]*)"').exec(tag);
    return m ? m[1] : null;
  }
  function decodeXml(s){
    if(s==null) return '';
    return String(s)
      .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
      .replace(/&quot;/g,'"').replace(/&apos;/g,"'")
      .replace(/&#(\d+);/g,function(_,d){return String.fromCharCode(+d);})
      .replace(/&#x([0-9a-fA-F]+);/g,function(_,h){return String.fromCharCode(parseInt(h,16));})
      .replace(/&amp;/g,'&'); // ampersand last so decoded entities aren't re-decoded
  }

  // ── standard 56-colour indexed palette (only the reds/basics matter here) ──
  // Indices 2 and 10 are both pure red in Excel's legacy palette.
  var INDEXED = {
    0:'000000',1:'FFFFFF',2:'FF0000',3:'00FF00',4:'0000FF',5:'FFFF00',6:'FF00FF',7:'00FFFF',
    8:'000000',9:'FFFFFF',10:'FF0000',11:'00FF00',12:'0000FF',13:'FFFF00',14:'FF00FF',15:'00FFFF',
    64:'000000' // system foreground
  };

  // ── "red-ish" heuristic — hue-based, shade-tolerant per requirement ────────
  // A simple RGB-box test can't tell a MUTED red (e.g. Excel's "Red, Accent 2,
  // Lighter 40%" = #D99694) apart from orange/olive using channel thresholds
  // alone — both have a similar R-G gap. Instead we classify by HUE: red sits
  // at 0°/360° on the color wheel; orange sits ~30-50°, yellow ~60°. Chroma
  // (saturation) and brightness floors filter out near-gray/near-black colors
  // that have no real hue. Centralised so the thresholds are easy to tune.
  var RED = { minChroma:30, minBrightness:100, hueMax:20, hueMin:345 };
  function isRedish(hex){
    if(!hex) return false;
    hex = String(hex).replace(/^#/,'');
    if(hex.length===8) hex = hex.slice(2);      // strip ARGB alpha
    if(hex.length!==6) return false;
    var r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
    if(isNaN(r)||isNaN(g)||isNaN(b)) return false;
    var max=Math.max(r,g,b), min=Math.min(r,g,b), delta=max-min;
    if(delta<RED.minChroma) return false;   // too gray/desaturated to read as a color
    if(max<RED.minBrightness) return false; // too dark to read as a meaningful mark
    if(max!==r) return false;               // green/blue-dominant colors are never "red family"
    var hue = 60*(((g-b)/delta)%6); if(hue<0) hue+=360;
    return hue<=RED.hueMax || hue>=RED.hueMin;
  }

  // ── theme-colour resolution (best-effort; reds rarely come via theme) ─────
  // clrScheme order: dk1,lt1,dk2,lt2,accent1..6,hlink,folHlink. The `theme=`
  // index used by styles swaps the first two pairs (bg/tx), giving this order.
  function buildThemePalette(themeXml){
    if(!themeXml) return [];
    var m = /<a:clrScheme\b[^>]*>([\s\S]*?)<\/a:clrScheme>/.exec(themeXml);
    if(!m) return [];
    var body = m[1], out = [];
    var re = /<a:(dk1|lt1|dk2|lt2|accent[1-6]|hlink|folHlink)>([\s\S]*?)<\/a:\1>/g, mm;
    while((mm=re.exec(body))){
      var inner = mm[2];
      var sys = /<a:sysClr\b[^>]*\blastClr="([0-9A-Fa-f]{6})"/.exec(inner);
      var srgb = /<a:srgbClr\b[^>]*\bval="([0-9A-Fa-f]{6})"/.exec(inner);
      out.push(sys ? sys[1] : (srgb ? srgb[1] : null));
    }
    // out is [dk1,lt1,dk2,lt2,accent1..]; theme index order swaps the pairs.
    if(out.length>=4){ var t=out[0]; out[0]=out[1]; out[1]=t; t=out[2]; out[2]=out[3]; out[3]=t; }
    return out;
  }
  function applyTint(hex, tint){
    if(!hex || !tint) return hex;
    var t=parseFloat(tint); if(isNaN(t)||t===0) return hex;
    function ch(v){
      if(t<0) return Math.round(v*(1+t));
      return Math.round(v*(1-t)+255*t);
    }
    var r=ch(parseInt(hex.slice(0,2),16)), g=ch(parseInt(hex.slice(2,4),16)), b=ch(parseInt(hex.slice(4,6),16));
    function hx(n){n=Math.max(0,Math.min(255,n));var s=n.toString(16);return s.length<2?'0'+s:s;}
    return (hx(r)+hx(g)+hx(b)).toUpperCase();
  }
  // Resolve a <color .../> / <fgColor .../> tag string to an RRGGBB hex, or null.
  function resolveColor(tag, palette){
    if(!tag) return null;
    var rgb = attr(tag,'rgb');
    if(rgb) return rgb.length===8 ? rgb.slice(2) : rgb;
    var idx = attr(tag,'indexed');
    if(idx!=null) return INDEXED[+idx] || null;
    var theme = attr(tag,'theme');
    if(theme!=null){
      var base = palette[+theme] || null;
      return base ? applyTint(base, attr(tag,'tint')) : null;
    }
    return null; // <color auto="1"/> or unresolved -> not red
  }

  // ── parse styles.xml into per-cellXfs red flags ───────────────────────────
  function parseStyles(stylesXml, palette){
    var fontRed=[], fillRed=[], out={fontRed:[], fillRed:[]};
    if(!stylesXml) return {styleFontRed:[], styleFillRed:[]};

    // fonts: red iff the font's (first) <color> is red-ish.
    var fb = /<fonts\b[^>]*>([\s\S]*?)<\/fonts>/.exec(stylesXml);
    if(fb){
      var fre = /<font\b[^>]*>([\s\S]*?)<\/font>|<font\s*\/>/g, fm;
      while((fm=fre.exec(fb[1]))){
        var inner = fm[1]||'';
        var cm = /<color\b[^>]*\/?>/.exec(inner);
        fontRed.push(cm ? isRedish(resolveColor(cm[0], palette)) : false);
      }
    }
    // fills: red iff a solid patternFill's fgColor is red-ish.
    var flb = /<fills\b[^>]*>([\s\S]*?)<\/fills>/.exec(stylesXml);
    if(flb){
      var lre = /<fill>([\s\S]*?)<\/fill>/g, lm;
      while((lm=lre.exec(flb[1]))){
        var pf = lm[1];
        var fg = /<fgColor\b[^>]*\/?>/.exec(pf);
        fillRed.push(fg ? isRedish(resolveColor(fg[0], palette)) : false);
      }
    }
    // cellXfs: map each style index -> {font red?, fill red?}
    var cx = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(stylesXml);
    var styleFontRed=[], styleFillRed=[];
    if(cx){
      var xre = /<xf\b([^>]*?)(?:\/>|>[\s\S]*?<\/xf>)/g, xm;
      while((xm=xre.exec(cx[1]))){
        var a = xm[1];
        var fId = parseInt(attr('<x '+a+'>','fontId'),10);
        var lId = parseInt(attr('<x '+a+'>','fillId'),10);
        styleFontRed.push(!isNaN(fId) && !!fontRed[fId]);
        styleFillRed.push(!isNaN(lId) && !!fillRed[lId]);
      }
    }
    return {styleFontRed:styleFontRed, styleFillRed:styleFillRed};
  }

  // ── parse sharedStrings.xml -> per-string {hasRedRun, blackText, plain} ────
  function parseSharedStrings(ssXml, palette){
    var out=[];
    if(!ssXml) return out;
    var sre = /<si>([\s\S]*?)<\/si>/g, sm;
    while((sm=sre.exec(ssXml))){
      var body = sm[1];
      if(body.indexOf('<r>')<0 && body.indexOf('<r ')<0){
        // plain string — colour (if any) comes from the cell's font, not here.
        out.push({hasRedRun:false, blackText:null});
        continue;
      }
      var rre = /<r>([\s\S]*?)<\/r>/g, rm, hasRed=false, black='';
      while((rm=rre.exec(body))){
        var run = rm[1];
        var rprc = /<rPr>[\s\S]*?<color\b[^>]*\/?>[\s\S]*?<\/rPr>|<color\b[^>]*\/?>/.exec(run);
        var colTag = rprc ? (/<color\b[^>]*\/?>/.exec(rprc[0])||[])[0] : null;
        var red = colTag ? isRedish(resolveColor(colTag, palette)) : false;
        var tm = /<t\b[^>]*>([\s\S]*?)<\/t>/.exec(run);
        var txt = tm ? decodeXml(tm[1]) : '';
        // Only a red run with actual visible text counts as a removal. A red
        // run that is pure whitespace (e.g. a stray red trailing space) is
        // meaningless — keep it in the black text and don't flag the cell.
        if(red && txt.trim()!=='') hasRed=true; else black += txt;
      }
      out.push({hasRedRun:hasRed, blackText:black});
    }
    return out;
  }

  // ── locate the first worksheet's XML inside the zip ───────────────────────
  function firstSheetPath(zip){
    // Prefer the relationship the workbook points to; fall back to sheet1.
    var names = Object.keys(zip.files);
    for(var i=0;i<names.length;i++){
      if(/^xl\/worksheets\/sheet1\.xml$/i.test(names[i])) return names[i];
    }
    for(var j=0;j<names.length;j++){
      if(/^xl\/worksheets\/.*\.xml$/i.test(names[j]) && !/rels/i.test(names[j])) return names[j];
    }
    return null;
  }

  // ── A1 ref -> 0-indexed {r,c} ─────────────────────────────────────────────
  function refToRC(ref){
    var m = /^([A-Z]+)(\d+)$/.exec(ref); if(!m) return null;
    var col=0, letters=m[1];
    for(var i=0;i<letters.length;i++) col = col*26 + (letters.charCodeAt(i)-64);
    return {r:parseInt(m[2],10)-1, c:col-1};
  }

  // ── main entry: read the workbook's colours, return the cleanup map ────────
  function extractRedFilter(buf){
    if(typeof JSZip==='undefined' || !JSZip.loadAsync){
      return Promise.resolve({redCells:new Set(), cleanText:new Map(), count:0});
    }
    return JSZip.loadAsync(buf).then(function(zip){
      function read(name){ var f=zip.file(name); return f ? f.async('string') : Promise.resolve(''); }
      var sheetName = firstSheetPath(zip);
      return Promise.all([
        read('xl/styles.xml'),
        read('xl/theme/theme1.xml'),
        read('xl/sharedStrings.xml'),
        sheetName ? read(sheetName) : Promise.resolve('')
      ]).then(function(parts){
        return computeFilter(parts[0], parts[1], parts[2], parts[3]);
      });
    });
  }

  // Pure core (no zip / no promises) — directly unit-testable in Node.
  function computeFilter(stylesXml, themeXml, ssXml, sheetXml){
    var redCells=new Set(), cleanText=new Map();
    var palette = buildThemePalette(themeXml);
    var st = parseStyles(stylesXml, palette);
    var ss = parseSharedStrings(ssXml, palette);
    if(sheetXml){
      var cre = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, cm;
      while((cm=cre.exec(sheetXml))){
        var a=cm[1], body=cm[2]||'';
        var ref=attr('<c '+a+'>','r'); if(!ref) continue;
        var rc=refToRC(ref); if(!rc) continue;
        var key=rc.r+','+rc.c;
        var s=parseInt(attr('<c '+a+'>','s'),10); if(isNaN(s)) s=-1;
        var t=attr('<c '+a+'>','t');
        var fillRed = s>=0 && st.styleFillRed[s];
        var fontRed = s>=0 && st.styleFontRed[s];

        // Shared-string cell with per-run colours: the runs govern, not the font.
        if(t==='s'){
          var vm=/<v>(\d+)<\/v>/.exec(body);
          var si = vm ? ss[parseInt(vm[1],10)] : null;
          if(si && si.hasRedRun){
            var black=(si.blackText||'').trim();
            if(black==='' || fillRed){ redCells.add(key); }
            else { cleanText.set(key, black); }
            continue;
          }
        }
        if(fillRed || fontRed) redCells.add(key);
      }
    }
    return {redCells:redCells, cleanText:cleanText, count:redCells.size+cleanText.size};
  }

  // ── apply the cleanup map to SheetJS's flattened rows (mutates in place) ───
  // `range` = {r0,c0} spreadsheet origin of rows[0][0] (from decode_range of
  // ws['!ref']); defaults to A1. rf keys are absolute spreadsheet coords.
  function applyRedFilter(rows, rf, range){
    if(!rf || !rows) return;
    var r0=(range&&range.r0)||0, c0=(range&&range.c0)||0;
    function set(key, val){
      var p=key.split(','), i=(+p[0])-r0, j=(+p[1])-c0;
      if(i>=0 && i<rows.length && rows[i] && j>=0 && j<rows[i].length) rows[i][j]=val;
    }
    if(rf.redCells)  rf.redCells.forEach(function(k){ set(k,''); });
    if(rf.cleanText) rf.cleanText.forEach(function(v,k){ set(k,v); });
  }

  // ── exports to App ──
  App.extractRedFilter = extractRedFilter;
  App.applyRedFilter   = applyRedFilter;
  App._computeRedFilter = computeFilter; // exposed for unit tests
  App._isRedish = isRedish;              // exposed for unit tests
})(window.App = window.App || {});
