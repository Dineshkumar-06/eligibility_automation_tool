/* Eligibility Code Generator — module: parsing/helpers.js — column detection, level/mark/grade/subject parsing
   Part of the namespaced App.* module set. Logic is unchanged from the
   original single-file version; only wrapped for modular loading. */
(function(App){
  // ── imports from App ──
  var EDU = App.EDU;
  var EDU_ALIASES = App.EDU_ALIASES;
  var EDU_KW = App.EDU_KW;
  var GRADE_OPS = App.GRADE_OPS;
  var S = App.S;

// ── MARK PARSING (redesigned) ───────────────────────────────────────────────
// A marks cell is parsed into a list of CLAUSES. Each clause is a category list
// plus an operator and a numeric value, e.g.
//   "UR/EWS/OBC >=60 %"      -> {cats:['UR','EWS','OBC'], op:'>=', val:60}
//   "SC/ST/PWD >= 55 %"      -> {cats:['SC','ST'], pwbd:true, op:'>=', val:55}
//   ">=60%"  /  "> 0"        -> {cats:[], op:'>=', val:60}    (a PLAIN mark)
// Classification then collapses the clauses into one of three normalised forms,
// all backward-compatible with the existing generators:
//   • no category anywhere          -> plain mark string  ">=60%" / ">0%"
//   • categories with ONE threshold -> CAT:lo:hi:cats      (legacy two-tier shape)
//   • categories with 2+ thresholds -> MCAT:t|c~t|c~...    (multi-tier shape)
// Operators other than ">=" are recognised (so a clause is never silently
// dropped) but the generated comparison stays ">=$GradeMarkPer" — only the value
// is carried forward. Disability is detected GENERICALLY (see isDisabilityToken)
// rather than from a hardcoded category list.

// Disability terms — any of these (as a standalone token, in any case/spacing)
// marks a category token as a disability check rather than a real category.
// NOT hardcoded categories: this is the ONLY classification that is keyword-based,
// per spec ("if the text refers to disability in any form ... Disability").
var DISABILITY_RE=/^(?:pw\s*bd|pw\s*d|pwd|pwbd|divyang|hh|vh|oh|persons?\s+with\s+benchmark\s+disabilit(?:y|ies)|persons?\s+with\s+disabilit(?:y|ies)|person\s+with\s+disabilit(?:y|ies)|benchmark\s+disabilit(?:y|ies)|disabilit(?:y|ies)|disabled|differently[\s-]*abled|physically[\s-]*(?:handicapped|challenged)|handicapped?)$/i;
function isDisabilityToken(tok){ return DISABILITY_RE.test(String(tok).trim()); }

// A clause label is a list of category tokens slash/comma/&-separated, e.g.
// "UR/EWS/OBC" or "SC, ST" or "BC-A/BC-B". Split it and tag each token.
// Returns {cats:[realCategoryTokens], pwbd:boolean}. A "<cat>-PwBD" hybrid token
// (e.g. "ST-PwBD") is kept verbatim as a category token — buildCatCond expands it.
function splitCatLabel(label){
  var raw=String(label).split(/\s*[\/,&]\s*/).map(function(t){return t.trim();}).filter(Boolean);
  var cats=[], pwbd=false;
  for(var i=0;i<raw.length;i++){
    var t=raw[i];
    if(/-\s*pw\s*b?d$/i.test(t)){ cats.push(t.replace(/\s*-\s*pw\s*b?d$/i,'-PwBD')); continue; }
    if(isDisabilityToken(t)) pwbd=true;          // bare disability token -> flag
    else cats.push(t);                           // genuine category token
  }
  return {cats:cats, pwbd:pwbd};
}

// Parse a marks cell into an array of clauses. Returns [] when no operator/value
// is present at all (i.e. not a parseable mark). Each clause:
//   {cats:[...], pwbd:bool, op:'>=|>|<=|<|=', val:Number, hasCat:bool}
// A clause's category part is the text BEFORE its operator, back to the previous
// clause boundary (newline / ';' / a number-then-space-then-category transition).
function parseMarkClauses(s){
  var text=String(s).replace(/ /g,' ').trim();
  if(!text) return [];
  // Collapse spaces INSIDE a two-char operator so "> =35" / "<  = 40" parse as the
  // intended ">=" / "<=" rather than a bare ">" followed by a stray "=35" clause.
  text=text.replace(/>\s+=/g,'>=').replace(/<\s+=/g,'<=');
  // Primary split: each line / ';' is its own clause. This handles the common
  // multi-line sheet form ("UR/EWS >=60 %\nSC >=55%").
  var segs=text.split(/\r?\n|;/).map(function(x){return x.trim();}).filter(Boolean);
  var clauses=[];
  for(var i=0;i<segs.length;i++){
    // A single line may still pack several space-separated clauses, e.g.
    // "UR/EWS/OBC/ST >=60% SC >=55%". Scan left-to-right for <label?><op><num>.
    var line=segs[i];
    var re=/([A-Za-z][A-Za-z0-9.\/,&()\s\-]*?)?\s*(>=|<=|>|<|=)\s*(\d{1,3})\s*%?/g;
    var m, found=false;
    while((m=re.exec(line))!==null){
      found=true;
      var label=(m[1]||'').trim();
      // Strip leading descriptor words ("For", "For all", "category", "marks").
      label=label.replace(/^(?:for\s+all|for|minimum|atleast|at\s+least|category|marks?|percentage|class|grade)\b\s*/i,'').trim();
      // A label of "all other"/"others"/"general"/"open"/"unreserved" denotes the
      // catch-all group rather than a named category — record it as such.
      var isOther=/^(?:all\s*others?|others?|general|open|unreserved|remaining|default|rest)$/i.test(label);
      var split=isOther?{cats:[],pwbd:false}:splitCatLabel(label);
      clauses.push({
        cats:split.cats, pwbd:split.pwbd, isOther:isOther,
        op:m[2], val:+m[3],
        hasCat:(split.cats.length>0||split.pwbd)
      });
    }
    if(!found){
      // No operator on this line. A bare number ("60", "60%") is still a value
      // (op defaults to >=); anything else contributes no clause.
      var bn=line.match(/(\d{1,3})\s*%?\s*$/);
      if(bn) clauses.push({cats:[],pwbd:false,isOther:false,op:'>=',val:+bn[1],hasCat:false});
    }
  }
  return clauses;
}

// Public: parse a marks cell into a normalised mark token (or null).
//   plain mark -> ">=60%" / ">0%" / ">55%" ...
//   category   -> "CAT:lo:hi:cats"  (one threshold) or "MCAT:..." (many)
function normMark(s){
  if(s==null) return null;
  var t=String(s).trim();
  if(!t||/^-+$/.test(t)) return null;

  var clauses=parseMarkClauses(t);
  if(!clauses.length) return null;            // not a mark we can read

  var catClauses=clauses.filter(function(c){return c.hasCat||c.isOther;});

  // ── PLAIN MARK ── no category/disability/other anywhere: a single universal
  // threshold applies to everyone. Use the FIRST clause's operator + value.
  if(!catClauses.length){
    var p=clauses[0];
    return normPlainMark(p.op,p.val);
  }

  // ── CATEGORY MARK ── one tier per distinct threshold. Each tier carries the
  // category tokens that share that threshold; an "all other" clause becomes the
  // implicit highest/last tier (the trailing else). Operators are honoured for
  // parsing but the generated check is always ">=" (per design), so we key tiers
  // purely on the numeric value.
  var byThr={};                               // val -> {val, cats:[], isOther}
  for(var i=0;i<catClauses.length;i++){
    var c=catClauses[i];
    var key=c.val;
    if(!byThr[key]) byThr[key]={val:c.val, cats:[], isOther:false};
    if(c.isOther) byThr[key].isOther=true;
    for(var j=0;j<c.cats.length;j++) byThr[key].cats.push(c.cats[j]);
    if(c.pwbd) byThr[key].cats.push('PwBD');
  }
  var tiers=Object.keys(byThr).map(function(k){return byThr[k];});

  // ── ONE THRESHOLD ──────────────────────────────────────────────────────────
  if(tiers.length===1){
    var only=tiers[0];
    // A lone "all other"/catch-all with no named category is just a universal
    // mark (everyone needs `val`).
    if(only.isOther && !only.cats.length) return normPlainMark('>=', only.val);
    // Lone named category (or set) at one threshold, no "others" specified:
    //   CAT:val:0:cats  ->  if(cat) GradeMarkPer=val; else GradeMarkPer=0;
    // The else=0 means non-listed categories are unconstrained (no invented
    // threshold), per the agreed behaviour for a single category clause.
    var hiOne = only.isOther ? only.val : 0;
    return 'CAT:'+only.val+':'+hiOne+':'+dedupCats(only.cats).join('+');
  }

  // ── TWO THRESHOLDS -> legacy CAT: shape ─────────────────────────────────────
  // Keeps the existing two-tier code path (lower-cats vs everyone-else). The
  // LOWER tier lists its categories; the HIGHER tier is the implicit `else`.
  if(tiers.length===2){
    tiers.sort(function(a,b){return a.val-b.val;});
    var lo=tiers[0], hi=tiers[1];
    // The tier carrying the explicit categories drives the `if`; the other tier's
    // value is the `else`. Normally lo names the categories and hi is "all other".
    var named = lo.cats.length ? lo : hi;
    var elseVal = (named===lo) ? hi.val : lo.val;
    return 'CAT:'+named.val+':'+elseVal+':'+dedupCats(named.cats).join('+');
  }

  // ── 3+ THRESHOLDS -> MCAT: multi-tier shape ─────────────────────────────────
  tiers.sort(function(a,b){return a.val-b.val;});
  return 'MCAT:'+tiers.map(function(tr){return tr.val+'|'+dedupCats(tr.cats).join(',');}).join('~');
}

// Normalise a plain (categoryless) mark to the legacy string form.
//   >=,>  -> ">=N%" / ">N%" ;  <=,<,= are honoured in the string but the
//   downstream lookupMarkOp only emits >= / > today, so non->= plain marks are
//   passed through verbatim (e.g. "<45%") for lookupMarkOp to accept or reject.
function normPlainMark(op,val){
  if(val===0 && op==='>') return '>0%';
  var o=(op==='>=')?'>=':(op==='>')?'>':op;   // keep <,<=,= literal
  return o+val+'%';
}

function dedupCats(arr){
  var seen={}, out=[];
  for(var i=0;i<arr.length;i++){ if(!seen[arr[i]]){seen[arr[i]]=1;out.push(arr[i]);} }
  return out;
}

// Parse a normalised CAT:/MCAT: token back into a descriptor for the generators.
//   CAT:lo:hi:cats   -> {scst:lo, other:hi, pwbd, cats:[...]}
//   MCAT:t|c~t|c...  -> {multi:true, tiers:[{thr,cats}], scst, other, cats}
function parseCatMark(mk){
  if(String(mk).indexOf('MCAT:')===0) return parseMcat(mk);
  var p=mk.split(':');
  var cats=p[3]?p[3].split('+').filter(Boolean):['SC','ST'];  // default SC+ST for legacy
  var pwbd=cats.some(function(t){return t==='PwBD'||/-PwBD$/i.test(t);});
  return {scst:+p[1],other:+p[2],pwbd:pwbd,cats:cats};
}

// Parse the MCAT: encoding into a multi-tier descriptor:
//   { multi:true, tiers:[{thr, cats:[...]}, ...] }   (sorted ascending by thr)
// `scst`/`other` are also filled (lowest / highest threshold) so any code reaching
// for the two-tier shape still gets sensible numbers.
function parseMcat(mk){
  var body=mk.slice('MCAT:'.length);
  var tiers=body.split('~').map(function(seg){
    var parts=seg.split('|');
    return {thr:+parts[0], cats:(parts[1]?parts[1].split(',').filter(Boolean):[])};
  });
  return {multi:true,tiers:tiers,scst:tiers[0].thr,other:tiers[tiers.length-1].thr,cats:tiers[0].cats};
}

// Build the PHP if-condition string for one category group (a list of category
// tokens). Disability is detected GENERICALLY: a bare disability token (PwBD,
// PWD, PwD, "disability", "persons with benchmark disability", …) becomes a
// disability check; a "<name>-PwBD" hybrid additionally constrains the category.
//   "SC"          -> $_POST['category_name'] == 'SC'
//   "PwBD"/"PWD"  -> $_POST['disability'] == 'Y'
//   "SC-PwBD"     -> ($_POST['category_name'] == 'SC' && $_POST['disability'] == 'Y')
function buildCatCond(catOrList){
  var cats=catOrList&&catOrList.cats?catOrList.cats:catOrList;   // accept {cats} or raw array
  var parts=[];
  for(var i=0;i<cats.length;i++){
    var tok=String(cats[i]).trim();
    var pm=/^(.*?)\s*-\s*pw\s*b?d$/i.exec(tok);
    if(isDisabilityToken(tok)) parts.push("$_POST['disability'] == 'Y'");
    else if(pm)                parts.push("($_POST['category_name'] == '"+pm[1].trim()+"' && $_POST['disability'] == 'Y')");
    else                       parts.push("$_POST['category_name'] == '"+tok+"'");
  }
  return parts.join(' || ');
}

// ── COLUMN DETECTION ──────────────────────────────────────────────────────
function detectCols(rows){
  // NOTE on the Degree vs Subject/Stream split:
  //   • A column whose header is the standalone word "Degree" (e.g. "Degree", but
  //     NOT a combined "Degree/Subject/Stream") is the DEGREE axis.
  //   • A column headed "Subject"/"Stream" (incl. "Subject / Stream", and the legacy
  //     combined "Degree/Subject/Stream") is the SUBJECT/STREAM axis.
  // `degreePat` matches the standalone form; `subject` matches subject/stream OR the
  // legacy combined header. The legacy header contains "degree" too, so we only treat
  // a column as the degree axis when its header does NOT also mention subject/stream
  // (guarded below) — keeping single-combined-column sheets byte-identical.
  var hPat={
    srno:/sr[\s._]?no|serial|^s\.?no\.?$|^no\.?$/i,
    post:/post[\s_]?name|name[\s_]?of[\s_]?(?:the[\s_]?)?post|^post$/i,
    field:/exam[\s_]?pass|^field$|education|qualif|level|diploma/i,
    subject:/subject|stream/i,
    marks:/percent|marks|%/i,
    grade:/class|grade/i,
    workexp:/work[\s_]?exp|experience/i
  };
  // A header is the standalone Degree axis when it mentions "degree" but NOT
  // "subject"/"stream" (the latter would make it the combined legacy column).
  function isDegreeHdr(h){ return /degree/i.test(h) && !/subject|stream|diploma/i.test(h); }
  for(var i=0;i<Math.min(rows.length,15);i++){
    var r=rows[i],m={};
    for(var ci=0;ci<r.length;ci++){
      var h=String(r[ci]==null?'':r[ci]).trim();
      for(var k in hPat) if(hPat[k].test(h)&&m[k]===undefined) m[k]=ci;
      if(m.degree===undefined && isDegreeHdr(h)) m.degree=ci;
    }
    // A header row is recognised when the Field/Exam-Passed column is present together
    // with at least one other structural column (Marks, Post, Subject/Stream, Degree
    // or Work-Experience). The Marks column is OPTIONAL: some sheets omit Percentage
    // entirely (e.g. Sr.No | Post | Exam Passed | Subject/Stream | Work Experience),
    // and requiring it would push the parser onto the fragile fallback path and offset
    // every column. When Marks is absent it defaults to -1 (no mark check emitted).
    var hasFieldHdr=m.field!==undefined;
    var hasOtherHdr=(m.marks!==undefined||m.post!==undefined||m.subject!==undefined||m.degree!==undefined||m.workexp!==undefined);
    if(hasFieldHdr&&hasOtherHdr){
      m._hdrRow=i;
      if(m.marks===undefined) m.marks=-1;
      // Degree-as-field fix: when the internal section uses "Degree" as the level
      // column (not a degree axis), detectCols wrongly matches field==workexp (both
      // grabbed by "qualif" in the work-exp header) and treats the Degree column as
      // a separate axis. Promote it: if field collided with workexp AND there is a
      // standalone degree column that is different from both, the degree column IS
      // the actual exam-passed / level column.
      if(m.field===m.workexp && m.degree!==undefined && m.degree!==m.field){
        m.field=m.degree; m.degree=undefined;
      }
      // Subject/Stream fallback: if no explicit subject/stream header was found, the
      // implied subject column is the one right after Degree (when present) or after
      // Field (legacy single-column layout). But only if that column is a REAL,
      // distinct column sitting before the marks column — otherwise there is no
      // Subject/Stream column and the Stream axis is absent (e.g. a Degree-only sheet:
      // Field | Degree | % | Class, where degree+1 IS the marks column). When Marks is
      // absent (-1), there is no column to bound against, so accept the implied column.
      if(m.subject===undefined){
        var implied=(m.degree!==undefined?m.degree:m.field)+1;
        m.subject=(m.marks<0||implied<m.marks)?implied:-1;
      }
      // A Degree column found at the subject column itself is not a separate axis.
      if(m.degree===m.subject) m.degree=undefined;
      if(m.grade===undefined)   m.grade=-1;
      var srnoExplicit=(m.srno!==undefined);
      if(m.srno===undefined)    m.srno=0;
      // if post col same as field col, post name must be in srno col (col 0)
      if(m.post===undefined||m.post===m.field) m.post=m.srno;
      // If an explicit Sr.No header was found AND post fell back to that same column
      // AND there is exactly one column between srno and field, that column is the
      // real post name (e.g. SR.NO. | Name of the Post | Field). Use it as the post
      // so the Sr.No column is excluded from dimensions automatically.
      if(srnoExplicit && m.post===m.srno && m.field-m.srno===2) m.post=m.srno+1;
      if(m.workexp===undefined) m.workexp=-1;
      m.dims=detectDims(r,m,rows);
      return m;
    }
  }
  for(var i=0;i<Math.min(rows.length,20);i++){
    for(var ci=0;ci<rows[i].length;ci++){
      var v=String(rows[i][ci]==null?'':rows[i][ci]).trim();
      if(matchLevel(v)||/^(AND|OR)$/i.test(v)){
        var fb={_hdrRow:i-1,srno:0,post:1,field:ci,subject:ci+1,marks:ci+2,grade:ci+3,workexp:ci+4};
        fb.dims=detectDims((rows[i-1]||[]),fb,rows);
        return fb;
      }
    }
  }
  var def={_hdrRow:0,srno:0,post:1,field:2,subject:3,marks:4,grade:5,workexp:6};
  def.dims=detectDims((rows[0]||[]),def,rows);
  return def;
}

// ── DIMENSION DETECTION ─────────────────────────────────────────────────────
// Eligibility dimensions are every column from the Post column up to (but not
// including) the "Exam Passed" / Field column. The first is always the post
// itself. Returns an ordered array [{columnName, col}] preserving sheet order.
// columnName comes from the header cell; a blank header still yields a generic
// "Dimension N" so the column is never silently dropped.
//   single-dimension sheets  -> [{columnName:'Post', col:<postCol>}]
//   POST + Recruitment Mode  -> [{columnName:'Post',...},{columnName:'Method…',...}]
//
// A serial-number column (header like "Sr. No" / "Serial" / "S.No" / "No.", or a
// column whose body cells are all numeric/blank) is NEVER a dimension — it carries
// no eligibility meaning. Such columns are filtered out of the [start,end) range.
// `rows` (optional) lets us inspect body cells for the all-numeric data guard.
var SRNO_RE=/sr[\s._]?no|serial|^s\.?no\.?$|^no\.?$/i;
function detectDims(hdrRow, m, rows){
  var start=m.post, end=m.field;            // [start, end) are dimension columns
  if(start===undefined||end===undefined||start>=end){
    // post column coincides with / sits after the field column (legacy layout
    // where the post name shares col 0) — exactly one dimension: the post.
    return [{columnName:hdrCell(hdrRow,m.post)||'Post', col:m.post}];
  }
  var out=[];
  for(var ci=start;ci<end;ci++){
    var name=hdrCell(hdrRow,ci);
    // Skip serial-number columns: by header pattern, by being the detected srno
    // column, or by carrying only numeric/blank body values. The Post column
    // itself is never dropped — legacy sheets key the post on a numeric Sr.No.
    if(ci!==m.post){
      if(ci===m.srno) continue;
      if(name && SRNO_RE.test(name)) continue;
      if(colIsAllNumeric(rows, ci, m._hdrRow)) continue;
    }
    if(ci===start && !name) name='Post';
    if(!name) name='Dimension '+(out.length+1);
    out.push({columnName:name, col:ci});
  }
  // Never drop every dimension — fall back to the single Post dimension.
  return out.length?out:[{columnName:hdrCell(hdrRow,m.post)||'Post', col:m.post}];
}
function hdrCell(row,ci){ return ci>=0&&row&&ci<row.length?String(row[ci]==null?'':row[ci]).trim():''; }
// True when every non-blank body cell in column `ci` (rows after `hdrRow`) is a
// pure integer — i.e. a serial/number-only column. A column with no non-blank body
// values is also treated as numeric-only (returns true) so empty filler columns are
// dropped. Returns false when `rows` is unavailable (data guard simply skipped).
function colIsAllNumeric(rows, ci, hdrRow){
  if(!rows||!rows.length||ci==null||ci<0) return false;
  var start=(hdrRow==null?0:hdrRow)+1, any=false;
  for(var ri=start;ri<rows.length;ri++){
    var r=rows[ri]; if(!r) continue;
    var v=String(r[ci]==null?'':r[ci]).trim();
    if(v==='') continue;
    any=true;
    if(!/^\d+$/.test(v)) return false;
  }
  return any;   // all non-blank cells were integers (or there were none)
}

// ── LEVEL MATCHING ────────────────────────────────────────────────────────
function matchLevel(t){
  if(!t) return null;
  var n=t.trim().toLowerCase().replace(/\s+/g,' ');
  // exact match
  for(var k in EDU) if(k.toLowerCase().replace(/\s+/g,' ')===n) return k;
  // alias match
  if(EDU_ALIASES[n]) return EDU_ALIASES[n];
  // strip dots for abbreviated forms like S.S.C. → ssc, H.S.C. → hsc
  var nodots=n.replace(/\./g,'').replace(/\s+/g,' ').trim();
  if(nodots.indexOf('ssc')===0||nodots==='ssc'||n.indexOf('s.s.c')>=0) return 'SSC/10th';
  if(nodots.indexOf('hsc')===0||nodots==='hsc'||n.indexOf('h.s.c')>=0) return 'HSC/12th';
  // keyword-contains match — also try with hyphens replaced by spaces so that
  // "Post-Graduation / Master's Degree" matches the "post graduation" keyword.
  var nh=n.replace(/-/g,' ').replace(/\s+/g,' ');
  for(var i=0;i<EDU_KW.length;i++){
    var rule=EDU_KW[i];
    for(var j=0;j<rule.kw.length;j++) if(nh.indexOf(rule.kw[j])>=0) return rule.level;
  }
  return null;
}

// ── OTHER PARSERS ─────────────────────────────────────────────────────────
function normGrade(s){
  var t=s?s.trim():'';
  if(!t||/^-+$/.test(t)) return 'Any Class';
  for(var k in GRADE_OPS) if(k.toLowerCase()===t.toLowerCase()) return k;
  return t;
}
// Collapses any run of whitespace (leading, trailing, or in-between) to a single space.
// Values that differ only in spacing are not meaningfully different subjects/degrees —
// unlike case or wording differences, which may be genuine — so this normalization is
// applied unconditionally at parse time rather than merely flagged for review.
function collapseWs(s){ return String(s||'').replace(/\s+/g,' ').trim(); }
function parseSubs(s){
  // A blank cell, or one that is only dashes/whitespace ("-", "----", "—"), is the
  // "no value" placeholder (common in the Degree column for SSC/HSC rows) and yields
  // no subjects/degrees.
  if(!s||/^[\s\-–—]+$/.test(s)) return [];
  if(/^any(\s+(value|stream|streams|subject|subjects|values))?$/i.test(s.trim())) return ['__ANY__'];
  // Tokenise: quoted tokens ("...") are kept whole even if they contain "/";
  // unquoted segments are split on "/".
  var tokens=[];
  var rest=s;
  while(rest.length){
    var qi=rest.indexOf('"');
    if(qi===-1){
      // no more quoted sections — split remainder on "/"
      var parts=rest.split('/');
      for(var i=0;i<parts.length;i++){var v=collapseWs(parts[i]);if(v&&v!=='-')tokens.push(v);}
      break;
    }
    // handle unquoted segment before the opening quote
    if(qi>0){
      var before=rest.slice(0,qi);
      var bparts=before.split('/');
      for(var i=0;i<bparts.length;i++){
        // last segment before the quote may be empty (trailing "/") — skip
        var v=collapseWs(bparts[i]);
        if(v&&v!=='-') tokens.push(v);
      }
    }
    // find closing quote
    var closeQ=rest.indexOf('"',qi+1);
    if(closeQ===-1) closeQ=rest.length-1; // unterminated quote — treat rest as quoted
    var quoted=collapseWs(rest.slice(qi+1,closeQ));
    if(quoted&&quoted!=='-') tokens.push(quoted);
    // advance past closing quote; skip an immediately following "/"
    rest=rest.slice(closeQ+1);
    if(rest.charAt(0)==='/') rest=rest.slice(1);
  }
  return tokens;
}
// Returns the work-experience duration in MONTHS. Understands both "N years"
// (×12) and "N months" (verbatim); e.g. "Minimum 2 years" -> 24,
// "Minimum 12 months" -> 12. Returns null when no duration is present.
function parseWE(s){
  if(!s||s==='-') return null;
  var y=s.match(/(\d+)\s*year/i);
  if(y) return +y[1]*12;
  var mo=s.match(/(\d+)\s*month/i);
  if(mo) return +mo[1];
  return null;
}
// True when this post's Work-Experience cell is "Post Qualification (Work Experience)".
// Drives work_exp_details_validations.php generation:
//   "Post Qualification"                                    -> all such posts participate (Case 1)
//   "Work Experience"                                       -> does NOT participate          (Case 2)
//   "Work Experience / Post Qualification Work Experience"  -> per-post; only the rows whose
//                                                              text says Post Qualification    (Case 3)
function isPostQuali(s){ return !!(s && /post[\s_-]*qualification/i.test(s)); }

// ── RADIO-QUESTION DETECTION ────────────────────────────────────────────────
// Decide whether a cell's text is a Yes/No-style radio-button question rather than
// an education level, a subject list, or a separator. Detection is intent-based and
// robust to wording/whitespace/case — it does NOT depend on the exact phrasing, so
// it works for future sheets without code changes. A cell qualifies when ANY of the
// following intent signals is present (anywhere — start, middle, end, brackets):
//   • it is phrased as a question                — contains "?"
//   • a Yes / No choice                          — "yes/no", "yes or no", "y/n",
//                                                   or both "yes" & "no" as words
//   • an explicit expected answer                — "should be yes" / "should be no"
//   • a selection instruction                    — "select" / "choose" as a verb
// To avoid misclassifying genuine education/subject cells (e.g. "Arts / Science",
// "B.Sc / Others"), a BARE "yes" or "no" alone is NOT enough — there must be a
// yes↔no pairing, a "should be …" phrase, a select/choose verb, or a question mark.
var RADIO_RE = (function(){
  return {
    q:        /\?/,                                   // any question mark
    yesno:    /\byes\b\s*(?:\/|\\|\bor\b|,|&)\s*\bno\b|\bno\b\s*(?:\/|\\|\bor\b|,|&)\s*\byes\b|\by\s*[\/\\]\s*n\b/i,
    bothYN:   /\byes\b/i,                             // paired with \bno\b below
    bothYN2:  /\bno\b/i,
    shouldBe: /should\s*be\s*(?:yes|no)\b/i,
    selVerb:  /\b(?:select|choose)\b/i
  };
})();
function isRadioQuestion(text){
  if(!text) return false;
  var t=String(text).replace(/\s+/g,' ').trim();
  if(!t) return false;
  // A pure separator / level / numeric cell is never a radio question.
  if(/^(?:and|or)$/i.test(t)) return false;
  if(RADIO_RE.q.test(t)) return true;               // it's a question
  if(RADIO_RE.shouldBe.test(t)) return true;         // "Should be Yes/No"
  if(RADIO_RE.yesno.test(t)) return true;            // explicit Yes/No choice
  if(RADIO_RE.selVerb.test(t)) return true;          // "Select …"/"Choose …"
  if(RADIO_RE.bothYN.test(t)&&RADIO_RE.bothYN2.test(t)) return true; // both words present
  return false;
}

// Normalizes a radio question for duplicate-identity comparison: lowercase, drop
// dots/commas (handles a trailing "?." / "? ." variant), collapse whitespace, then
// drop a trailing question mark (with any space before it). Pure formatting variants
// ("...experience?", "...experience ?", "...experience?.", "...experience") all
// collapse to the same key. Word content — including numbers — is left intact, so
// "3 years" and "5 years" stay distinct (deriveField() already converts digits to
// words, so this only needs to neutralize punctuation/spacing noise).
function normRadioQuestion(q){
  var t=String(q||'').toLowerCase();
  t=t.replace(/[.,]/g,'');
  t=t.replace(/\s+/g,' ').trim();
  t=t.replace(/\s*\?\s*$/,'');
  return t.trim();
}

// Words that survive as question CONTENT but carry no identifying value in a field
// name. Eligibility questions nearly all open with the same boilerplate ("Do you have
// minimum N years post qualification relevant experience …"), so a name built from the
// leading words alone says nothing — the meaning is in the domain words further in.
// Deliberately NOT filler: cert / license / trade and other domain nouns, which are
// exactly what separates valid_wireman_cert from valid_hmv_license.
var NAME_FILLER={min:1,max:1,year:1,years:1,post:1,qual:1,relevant:1,exp:1,after:1,
  passing:1,out:1,which:1,field:1,or:1,and:1,similar:1,possess:1,valid:1,industry:1,
  organization:1,roles:1,work:1,basic:1,related:1,where:1,applicable:1,used:1,
  involving:1,consolidated:1};
// Longest name deriveField() will build, and the ceiling disambiguation may grow to.
var BASE_MAX=4, NAME_MAX=5;

function deriveField(q){
  var stops={do:1,you:1,have:1,a:1,an:1,the:1,is:1,are:1,be:1,of:1,in:1,at:1,to:1,for:1,with:1,your:1,any:1,should:1,whether:1,that:1,this:1,yes:1,no:1};
  var nums={0:'zero',1:'one',2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'nine',
            10:'ten',11:'eleven',12:'twelve',13:'thirteen',14:'fourteen',15:'fifteen',
            16:'sixteen',17:'seventeen',18:'eighteen',19:'nineteen',20:'twenty'};
  // Shortened spellings for long words that recur in eligibility wording, so a name
  // stays readable once disambiguation appends extra words ("minimum 5 years
  // experience" -> min_five_years_exp rather than minimum_five_years_experience).
  var abbr={minimum:'min',maximum:'max',experience:'exp',qualification:'qual',
            certificate:'cert',required:'req',education:'edu'};
  var words=q.replace(/[^a-zA-Z0-9\s]/g,' ').toLowerCase().split(/\s+/).filter(function(w){return w&&!stops[w];})
             .map(function(w){var n=parseInt(w,10);return(!isNaN(n)&&nums[n])?nums[n]:w;})
             .map(function(w){return abbr[w]||w;});
  // Anchor on the first 2 words (keeps the requirement itself readable: min_eight,
  // valid_wireman, registered_ca), then append the salient words — the first non-filler
  // words in order, skipping repeats — until the name is BASE_MAX words long.
  var sig=words.slice(0,2);
  var picked={};
  for(var pi=0;pi<sig.length;pi++) picked[sig[pi]]=1;
  for(var wi=2;wi<words.length&&sig.length<BASE_MAX;wi++){
    var w=words[wi];
    if(!w||picked[w]||NAME_FILLER[w]) continue;
    sig.push(w); picked[w]=1;
  }
  var fn=sig.join('_').replace(/_+/g,'_').replace(/^_|_$/g,'');
  // Required answer polarity: an explicit "Should be No" means the radio must be
  // answered 'N'; everything else defaults to 'Y' ("Should be Yes" or unstated).
  var shouldBe=/should\s*be\s*no\b/i.test(q)?'N':'Y';
  return{fn:fn||'field',lk:'edu_'+(fn||'field'),amb:sig.length<2,words:words,shouldBe:shouldBe};
}

// First word of `words` that the rival question does not use and that is not already
// part of `curFn` — i.e. the smallest meaningful difference between two otherwise
// similar questions ("... in IT projects" vs "... in Banking projects" -> it/banking).
// Salient words win over filler, but a filler word the rival lacks still separates the
// two so it is taken as a second choice. Returns null when the two questions use the
// same word set (pure reordering), leaving the caller on its numeric-suffix fallback.
function distinctWord(words, rivalWords, curFn){
  var rival={},i;
  for(i=0;i<(rivalWords||[]).length;i++) rival[rivalWords[i]]=1;
  var inFn={},parts=String(curFn||'').split('_');
  for(i=0;i<parts.length;i++) inFn[parts[i]]=1;
  var fallback=null;
  for(i=0;i<(words||[]).length;i++){
    var w=words[i];
    if(!w||rival[w]||inFn[w]) continue;
    if(!NAME_FILLER[w]) return w;
    if(!fallback) fallback=w;
  }
  return fallback;
}

function disambiguateRadioNames(posts){
  var owners={};
  var allConds=[];
  for(var pi=0;pi<posts.length;pi++)
    for(var gi=0;gi<posts[pi].orGroups.length;gi++)
      for(var ci=0;ci<posts[pi].orGroups[gi].conditions.length;ci++){
        var c=posts[pi].orGroups[gi].conditions[ci];
        if(c.type==='radio') allConds.push(c);
      }
  // Collapse to one representative condition per normalized question BEFORE running
  // the collision walk below. Feeding every duplicate occurrence through the walk
  // made a duplicate's final fieldName depend on which unrelated collisions happened
  // to fall between it and its twin (each occurrence could get renamed down a
  // different path), so two identical questions could end up split into two field
  // names. Resolving only representatives — then propagating each result to its
  // duplicates afterward — keeps identical questions on one name regardless of
  // processing order.
  var repByNormQ={};
  var uniqueConds=[];
  for(var i=0;i<allConds.length;i++){
    var c=allConds[i];
    var cNormQ=normRadioQuestion(c.question);
    c._normQ=cNormQ;
    if(!repByNormQ[cNormQ]){ repByNormQ[cNormQ]=c; uniqueConds.push(c); }
  }
  // Counts per base name, for the numeric-suffix fallback of last resort.
  var numericCounters={};
  // Names a condition outgrew while being disambiguated. A later question deriving
  // the same stem must NOT reclaim it: with a family of similar questions ("… in IT
  // / Banking / Telecom projects") the first two grow past the shared stem, which
  // would otherwise leave the stem free for the third — giving it a bare, misleading
  // name while its siblings carry the distinguishing word. Keeping the vacated names
  // as tombstones (with the words of the question that vacated them) makes the third
  // and every later sibling disambiguate against that question too.
  var retired={};
  for(var i=0;i<uniqueConds.length;i++){
    var c=uniqueConds[i];
    var words=c.words||[];
    var maxIter=NAME_MAX; // safety cap
    var cNormQ=c._normQ;
    while(maxIter-->0){
      var live=owners[c.fieldName];
      var owner=(live&&live.normQ!==cNormQ)?live:null;
      var ghost=owner?null:retired[c.fieldName];
      if(ghost&&ghost.normQ===cNormQ) ghost=null;
      if(!owner&&!ghost) break;
      // Words of whichever question this name belongs to — the rival to differ from.
      var rivalWords=owner?owner.words:ghost.words;
      // Owner side — only when the name is still live; a tombstoned name's condition
      // has already moved on, so only `c` needs to grow.
      if(owner){
        var ownerFits=owner.cond.fieldName.split('_').length<NAME_MAX;
        var ownerNext=ownerFits?distinctWord(owner.words,words,owner.cond.fieldName):null;
        if(ownerNext){
          var newOwnerFn=(owner.cond.fieldName+'_'+ownerNext).replace(/_+/g,'_');
          retired[owner.cond.fieldName]={normQ:owner.normQ,words:owner.words};
          delete owners[owner.cond.fieldName];
          owner.cond.fieldName=newOwnerFn;
          owner.cond.langKey='edu_'+newOwnerFn;
          owners[newOwnerFn]={normQ:owner.normQ,cond:owner.cond,words:owner.words};
        } else {
          // Owner is stuck at the word cap and keeps its current (still valid, unique
          // so far) name — it must stay discoverable so a LATER condition that lands
          // on this same name doesn't silently reuse it. Tombstoning under its own
          // current name (rather than just deleting) keeps that guarantee.
          retired[owner.cond.fieldName]={normQ:owner.normQ,words:owner.words};
          delete owners[owner.cond.fieldName];
        }
      }
      var nextWord=(c.fieldName.split('_').length<NAME_MAX)?distinctWord(words,rivalWords,c.fieldName):null;
      if(nextWord){
        c.fieldName=(c.fieldName+'_'+nextWord).replace(/_+/g,'_');
        c.langKey='edu_'+c.fieldName;
      } else {
        // Same word set as the rival (only ordering differs) — nothing meaningful
        // left to append, so fall back to a numeric suffix on the base name.
        var base=c.fieldName.split('_').slice(0,BASE_MAX).join('_');
        numericCounters[base]=(numericCounters[base]||1)+1;
        c.fieldName=base+'_'+numericCounters[base];
        c.langKey='edu_'+c.fieldName;
        break;
      }
    }
    if(!owners[c.fieldName])
      owners[c.fieldName]={normQ:cNormQ,cond:c,words:words};
  }
  // Propagate each representative's final (possibly renamed) fieldName to its duplicates.
  for(var i=0;i<allConds.length;i++){
    var c=allConds[i];
    var rep=repByNormQ[c._normQ];
    if(c!==rep){
      c.fieldName=rep.fieldName;
      c.langKey=rep.langKey;
    }
    delete c._normQ;
  }
}

// ── INTERNAL CANDIDATE SEPARATOR DETECTION ───────────────────────────────────
// Finds the first row that is a "For Internal/Departmental Candidates" banner.
// Returns the row index (0-based) or -1 if not found.
// Detection is intent-based: the first non-blank cell in the row must match one
// of the recognised separator phrases AND the rest of the row must be blank (a
// banner has no data columns). Only rows that appear AFTER at least one normal
// data row are considered (so the sheet header itself is never a false positive).
var INT_SEP_RE=/\b(?:internal|departmental|in[\s-]*service|deputation)\b.*\bcandidate/i;
var INT_SEP_ALT=/^\s*for\s+(?:internal|departmental|in[\s-]*service)\b/i;
function findInternalSeparator(rows){
  var foundDataRow=false;
  for(var i=0;i<rows.length;i++){
    var r=rows[i];
    // Find the first non-blank cell in this row.
    var firstVal='', firstIdx=-1;
    for(var ci=0;ci<r.length;ci++){
      var v=String(r[ci]==null?'':r[ci]).trim();
      if(v){firstVal=v;firstIdx=ci;break;}
    }
    if(!firstVal){ continue; }  // fully blank row — skip
    // Check if rest of the row after the first non-blank cell is all blank.
    var restBlank=true;
    for(var ci2=firstIdx+1;ci2<r.length;ci2++){
      if(String(r[ci2]==null?'':r[ci2]).trim()){restBlank=false;break;}
    }
    if(!restBlank){
      // Row has data in multiple columns — treat as a data/header row.
      if(!matchLevel(firstVal) && !/^(AND|OR)$/i.test(firstVal)) foundDataRow=true;
      continue;
    }
    // Single-cell row — check for separator intent.
    if(foundDataRow && (INT_SEP_RE.test(firstVal)||INT_SEP_ALT.test(firstVal))) return i;
    // Not a separator banner — it's still a data marker if it looks like a post name.
    if(!matchLevel(firstVal) && !/^(AND|OR)$/i.test(firstVal)) foundDataRow=true;
  }
  return -1;
}

  // ── exports to App ──
  App.buildCatCond = buildCatCond;
  App.isDisabilityToken = isDisabilityToken;
  App.parseMarkClauses = parseMarkClauses;
  App.deriveField = deriveField;
  App.isRadioQuestion = isRadioQuestion;
  App.normRadioQuestion = normRadioQuestion;
  App.disambiguateRadioNames = disambiguateRadioNames;
  App.detectCols = detectCols;
  App.detectDims = detectDims;
  App.isPostQuali = isPostQuali;
  App.matchLevel = matchLevel;
  App.normGrade = normGrade;
  App.normMark = normMark;
  App.parseCatMark = parseCatMark;
  App.parseSubs = parseSubs;
  App.parseWE = parseWE;
  App.findInternalSeparator = findInternalSeparator;
})(window.App = window.App || {});
