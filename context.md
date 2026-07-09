# Eligibility Code Generator — Dev Context

## Project
Single HTML file tool: `test.html`  
Reads an `.xlsx` eligibility criteria file → generates 3 PHP files:
- `edu_config.php` — stream/subject arrays per post
- `eligibity_validation.php` — PHP eligibility condition checks
- `edu_details_lang.php` — language label keys

---

## Key Concepts

**Post** = a job post (postcode e.g. `'01'`, postName)  
**OR Groups** = a post can have multiple OR-separated condition groups  
**Condition types:**
- `edu` — education level (Graduation, HSC, etc.) with optional subjects, mark, grade
- `radio` — yes/no question field

**Stream array** = PHP associative array mapping numeric keys → subject names  
e.g. `$arrGraduation_Stream['01'] = array('02'=>'B.Tech', '03'=>'B.Sc', '01'=>'Others');`

**Subject keys:** `'01'`=Others always, `'99'`=Equivalent always, `'02'`+ = sequential first-seen

---

## Code Flow (brief)

1. **Parse Excel** → `buildPosts()` → array of post objects
2. **`parseSubs()`** → splits subject column into array of subject strings
3. **`getStreamData(posts)`** → builds slot registry: which posts share which subject sets per level
4. **`genEduConfig(posts)`** → emits `edu_config.php` stream arrays
5. **`genEligibility(posts)`** → emits validation PHP conditions
6. **`genLangFile(posts)`** → emits lang keys for radio questions

---

## Changes Made (this session)

### Fix 2 — "Any value" in subjects column ✅ DONE
**Problem:** "Any value" in subjects column should mean "any stream accepted" — no array in edu_config, just `$_POST['selstreamN']!=''` check in validation, "Please enter" in error (not "Please select").  
**Files changed:** `parseSubs`, `buildPosts` (2 places), `buildCondLine`, `buildErrLine`

**parseSubs** (`~line 356`):
```js
if(/^any(\s+(value|stream|streams|subject|subjects|values))?$/i.test(s.trim())) return ['__ANY__'];
```

**buildPosts** — when `parseSubs` returns `['__ANY__']`:
- `subjects: []`, `anyStream: true` on the condition object
- Normal path: `anyStream: false`

**buildCondLine** — if `cond.anyStream`:
```js
var sc = "$_POST['" + def.ss + "']!=''";
return '(' + (inner ? sc + ' && ' + inner : sc) + ')';
```

**buildErrLine** — if `cond.anyStream`:
```js
return "\"Please enter \".$LANG['" + def.lang + "'].\"" + markPart + gradePart;
```

---

### Fix 3 — Subject delimiter & quoted values ✅ DONE
**Problem:** `parseSubs` was splitting on both `,` and `/`. Subjects are `/`-separated; commas appear *inside* a single subject value. Also subjects can be wrapped in `"..."` double quotes — quotes must be stripped.

**parseSubs** (`~line 356`) — current state:
```js
function parseSubs(s){
  if(!s||s==='-') return [];
  if(/^any(\s+(value|stream|streams|subject|subjects|values))?$/i.test(s.trim())) return ['__ANY__'];
  return s.split('/').map(function(x){
    x=x.trim();
    if(x.charAt(0)==='"'&&x.charAt(x.length-1)==='"') x=x.slice(1,-1).trim();
    return x;
  }).filter(function(x){return x&&x!=='-';});
}
```

---

### Fix 1 — Default "Others" array for posts with no subjects ❌ NOT DONE (reverted)
**Problem:** If posts 1,3,5 have Graduation subjects but posts 2,4 have Graduation with no subjects, posts 2,4 get no `$arrGraduation_Stream` entry at all. Should emit `array('01'=>'Others')` for them.

**Root cause:** `getStreamData` Step 2 skips conditions with empty subjects → no slot created → no array emitted.  
**Status:** Multiple attempts failed / reverted. User wants a fresh approach after clarification.  
**Need to clarify:** Exact Excel structure for the no-subject case before coding.

---

## Important Decisions / Rules
- Subjects always separated by `/` not `,`
- Content in `"..."` quotes = single subject value (commas inside are not delimiters)
- "Any value" subjects → no stream array + `!= ''` check (not `array_key_exists`)
- Blank/empty subjects → should get `array('01'=>'Others')` (Fix 1, not yet done)
- "Any value" in marks column is NOT handled (only subjects)
- `anyStream: true` conditions are excluded from the Others-default fix

---

## Pending / Next Steps
- [ ] Fix 1: Generate default `array('01'=>'Others')` for posts with empty subjects for a level where other posts DO have subjects. Need user to clarify exact Excel layout before implementing.
