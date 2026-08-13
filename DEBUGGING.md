# Debugging Guide — Eligibility Code Generator

This document explains the project structure from a **debugging** point of view: given
a symptom, where do you look? Read the "Big Picture" first — it lets you pin most bugs
to a single folder in seconds. The per-file tables then narrow it to a single function.

> The app is a static, dependency-light browser tool. There is **no build step** and
> **no framework**. All JavaScript files attach their functions to one shared global
> object, `window.App`, and `index.html` loads them in dependency order.

---

## The Big Picture: how data flows

The app is a **3-step pipeline**. Almost every bug falls into one of these stages, and
each stage maps to a folder:

```
  Excel file
     │
     ▼  [ parsing/ ]          ← "the tool read my sheet wrong"
  posts[]  (the condition tree: posts → OR-groups → conditions)
     │
     ▼  [ generators/ ]       ← "the PHP output is wrong"
  5 PHP strings
     │
     ▼  [ ui/ ]               ← "the screen/buttons are wrong"
  rendered tables, previews, downloads
```

`core/` is the shared vocabulary both ends depend on. `main.js` is just the ignition
switch.

**The single most useful debugging question:** *Is the `posts[]` array correct?*

- If `posts[]` is **wrong**, the bug is in `parsing/`.
- If `posts[]` is **right** but the PHP is wrong, the bug is in `generators/`.

You can inspect it live in the browser console: after uploading a file, type
`App.S.posts` in DevTools (see [Console debugging tricks](#console-debugging-tricks)).

### The data structure you'll be staring at

`posts[]` is a tree. Each **post** has one or more **OR-groups**; each OR-group has a
list of **conditions** (a condition is either an `edu` requirement or a `radio`
question). Roughly:

```
posts: [
  {
    postcode: "01",
    postName: "Manager",
    workExp: 24,            // months
    postQuali: false,       // does work-exp require post-qualification?
    orGroups: [
      { workExp: 24, conditions: [
          { type:"edu",   level:"Graduation", subjects:[...], markRaw:">=60%",
            gradeRaw:"First Class", condName:"", status:"ok" },
          { type:"radio", question:"...", fieldName:"...", langKey:"...", status:"ok" }
      ] },
      { workExp: 0,  conditions: [ ... ] }   // a second OR-group
    ]
  },
  ...
]
```

Knowing this shape is what makes `App.S.posts` readable when you inspect it.

### When the Internal Candidate feature is enabled

When `S.internalCandidate.enabled` is true **and** the sheet contains a separator row,
the pipeline splits into two parallel `posts[]` arrays instead of one:

```
S.posts                      // normal-candidate posts (rows above the separator)
S.internalCandidate.posts    // internal-candidate posts (rows below the separator)
S._normalCtx                 // schema snapshot for the normal section
S.internalCandidate.ctx      // schema snapshot for the internal section
```

A *context snapshot* (`ctx`) captures the four side-effect fields that
`buildPostsRange` writes: `{dimensions, colMap, weHeader, weMode}`. The branched
generators use `withCtx(ctx, fn)` to apply the right schema before calling an inner
emitter, then restore the previous schema, so there is no singleton leak across the
two branches.

The same `posts[]` question still applies: **check both arrays** when the feature is
on, and confirm which branch contains the wrong data before diving into parsing or
generation.

---

## Module wiring at a glance

All files share one global object, `window.App`. Each module:

1. opens with `(function(App){ … })(window.App = window.App || {})`,
2. pulls the names it needs into locals (`var EDU = App.EDU;` …),
3. contains the original function bodies unchanged,
4. exports the functions it defines (`App.genEduConfig = genEduConfig;` …).

`index.html` loads them in dependency order (constants → state → parsing → generators
→ ui → main). `main.js` runs last and re-publishes the click/input handlers to `window`
so the inline `onclick=`/`oninput=` attributes keep working.

| File | Imports from App | Exports to App |
|------|------------------|----------------|
| `core/constants.js` | *(none)* | `EDU`, `EDU_ALIASES`, `EDU_KW`, `EDU_ORDER`, `GRADE_OPS`, `GRADE_RANK`, `MARK_OPS`, `POSTQUAL_TS`, `gradeCheck` |
| `core/state.js` | *(none)* | `S`, `escA`, `escH`, `getOv`, `ind`, `isCat`, `rFn`, `rLk`, `intEnabled`, `intField`, `snapCtx`, `withCtx` |
| `parsing/helpers.js` | `EDU`, `EDU_ALIASES`, `EDU_KW`, `GRADE_OPS`, `S` | `buildCatCond`, `deriveField`, `detectCols`, `findInternalSeparator`, `isPostQuali`, `matchLevel`, `normGrade`, `normMark`, `parseCatMark`, `parseSubs`, `parseWE` |
| `parsing/colorFilter.js` | `JSZip` (global) | `extractRedFilter`, `applyRedFilter`, `_computeRedFilter`, `_isRedish` |
| `parsing/buildPosts.js` | `EDU`, `MARK_OPS`, `S`, `deriveField`, `detectCols`, `isCat`, `isPostQuali`, `matchLevel`, `normGrade`, `normMark`, `parseSubs`, `parseWE` | `buildPosts`, `buildPostsRange`, `parseFile` |
| `parsing/streams.js` | `EDU`, `isCat`, `parseCatMark` | `annotateCondNames`, `arrRef`, `buildSM`, `getAllRadios`, `getCatValues`, `getStreamData` |
| `generators/emit.js` | `getAllRadios`, `ind`, `rLk` | `buildMergedSM`, `emitArr`, `genLangFile`, `sortEnts` |
| `generators/eduConfig.js` | `EDU`, `EDU_ORDER`, `annotateCondNames`, `buildMergedSM`, `emitArr`, `getAllRadios`, `getStreamData`, `ind`, `rFn`, `rLk` | `emitAxisArrays`, `emitDependentsAndRadios`, `genEduConfig` |
| `generators/eligibility.js` | `EDU`, `GRADE_OPS`, `MARK_OPS`, `annotateCondNames`, `arrRef`, `buildCatCond`, `getCatValues`, `getStreamData`, `gradeCheck`, `ind`, `isCat`, `rFn`, `rLk` | `buildCondLine`, `buildErrLine`, `buildErrMsgs`, `buildWE`, `emitPostChain`, `genEligibility`, `isWorkExpRadio`, `weRadioTiers`, `weYears` |
| `generators/eduValidations.js` | `EDU`, `EDU_ORDER`, `annotateCondNames`, `buildCatCond`, `buildCondLine`, `getCatValues`, `getStreamData`, `ind` | `collectGlobalVars`, `emitValChain`, `genEduValidations` |
| `generators/workExp.js` | `EDU`, `POSTQUAL_TS`, `annotateCondNames`, `buildCatCond`, `buildCondLine`, `getCatValues`, `getStreamData`, `ind` | `WE_HEAD`, `WE_TAIL`, `eduIdxsOf`, `emitWEChain`, `genQualSel`, `genWorkExpDetails`, `qualTimestamps`, `tsIdxOf` |
| `generators/internalBranch.js` | `S`, `ind`, `assignDeclares`, `withCtx`, `intField`, `emitPostChain`, `emitValChain`, `collectGlobalVars`, `emitWEChain`, `emitAxisArrays`, `emitDependentsAndRadios`, `annotateCondNames`, `getStreamData`, `WE_HEAD`, `WE_TAIL`, `genLangFile`, `genEduQrySql` | `genEligibilityBranched`, `genEduValidationsBranched`, `genWorkExpBranched`, `genEduConfigBranched`, `genLangFileBranched`, `genEduQrySqlBranched` |
| `ui/ui.js` | `EDU`, `S`, `escA`, `escH`, `genEduConfig`, `genEduValidations`, `genEligibility`, `genLangFile`, `genWorkExpDetails`, `getAllRadios`, `getOv`, `parseFile`, `buildPostsRange`, `findInternalSeparator`, `intEnabled`, `intField`, `snapCtx`, `withCtx`, `gen*Branched` | `copyCode`, `dlFile`, `dlZip`, `fileInfo`, `goStep`, `onFileChange`, `parseRows`, `reparse`, `renderIntCfg`, `renderS1`, `renderS2`, `renderS3`, `setCode`, `switchTab`, `updBilingual`, `updIntEnable`, `updIntField`, `updOv`, `updatePreview`, `weNone` |
| `main.js` | `goStep`, `updOv`, `switchTab`, `copyCode`, `dlFile`, `dlZip`, `onFileChange`, `updIntEnable`, `updIntField` | *(none)* |

> **Tip:** the Imports/Exports table above is also a dependency graph. If you change a
> function's behavior, every file that *imports* it is a potential blast radius.

---

## Folder: `core/` — shared data & primitives

Imported by almost everything; import nothing themselves (they load first).
**If a value is hardcoded/mapped, it's here.**

### `core/constants.js`

The **lookup tables**. No logic, just domain knowledge.

| Export | What it is | You edit this when… |
|--------|-----------|---------------------|
| `EDU` | Master map of each education level → its PHP variable names (`stream`, `selstream`, `selmark`, `selgrade`, `lang`, `idx`, `hasStream`) | a level maps to the wrong PHP field, or you add a new education level |
| `EDU_ALIASES` | Text aliases → canonical level (`'ug'` → `'Graduation'`) | the sheet says "UG" and it isn't recognized |
| `EDU_KW` | Keyword-contains rules, most-specific-first | a fuzzy level name (e.g. "M.Tech") matches the wrong level |
| `EDU_ORDER` | The order levels appear in generated output | the PHP arrays come out in the wrong order |
| `MARK_OPS` | Allowed mark thresholds (`>=60%`) → PHP/error text | "Unknown mark operator" errors, or a `%` renders wrong |
| `GRADE_OPS`, `GRADE_RANK` | Grade names → PHP, plus the hierarchy | grade comparisons wrong |
| `gradeCheck()` | The *only* function here — expands "Second Class" into "Second OR First Class" | a grade threshold doesn't accept higher grades |
| `POSTQUAL_TS` | Level idx → the `strtotime()` variable + academic rank | the work-exp date logic picks the wrong qualification |
| `defaultAcadRank(level)` | The **default** Appeared/Passed hierarchy rank of a level, read from `POSTQUAL_TS.acad` (`0` = generic / no precedence) | the default hierarchy (before the user arranges one) is wrong |

**Debug heuristic:** "Why did level X map to field Y?" → `EDU`. "Why wasn't my level
recognized?" → `EDU_ALIASES` / `EDU_KW` (and `matchLevel` in `parsing/helpers.js`).

### `core/state.js`

The **shared mutable state `S`** plus tiny string utilities. This is the central object
every module reads/writes.

| Export | Purpose | Debug relevance |
|--------|---------|-----------------|
| `S` | `{posts, errors, warnings, rawRows, colMap, radioOv, weHeader, weMode, internalCandidate, _normalCtx, _edu, _eli, …}` | **Your #1 inspection target.** `S.posts` = the parse tree; `S.colMap` = which columns were detected; `S.errors`/`S.warnings` = what the parser flagged; `S._edu` etc. = the last generated outputs |
| `ind(n)` | Returns `n` tabs (PHP indentation) | output indentation looks wrong |
| `escH`, `escA` | HTML/attribute escaping for the on-screen tables | XSS or garbled text in the UI table |
| `getOv(pc,q)` | Reads the per-post radio override store in `S.radioOv` | edited radio field names don't stick |
| `rFn`, `rLk` | Resolve a radio's field-name / lang-key (override OR auto-derived) | wrong radio field name in output |
| `isCat(mk)` | Is this mark a category-split (`CAT:…`)? | category-mark branch taken/not taken wrongly |
| `intEnabled()`, `intField()` | Is the Internal Candidate feature on? What is the PHP field name? | wrong branch taken / wrong `$_POST` key in output |
| `apEnabled()`, `apField(level)` | Is Appeared/Passed on? Which `$_POST` field carries this level's A/P value (`null` = not AP-active)? | `_appeared` missing / leaking for a level |
| `apRank(level)` | The level's hierarchy rank: position in `S.appearedPassed.hierarchy` (1-based, higher = higher qualification), `0` for anything in `.generic`, else `defaultAcadRank(level)` | the wrong level is treated as a post's "highest qualification" |
| `snapCtx()` | Captures `{dimensions, colMap, weHeader, weMode}` into a snapshot object | context not captured after a `buildPostsRange` call |
| `withCtx(ctx, fn)` | Applies a context snapshot around `fn()`, then restores | generation uses the wrong section's schema (singleton leak) |

**Critical mental model:** `S` is one object shared by reference across all files.
`parsing/buildPostsRange` writes `S.posts`/`S.colMap`/`S.dimensions`/`S.weMode` as side
effects; `ui/ui.js` writes `S.posts` and the `S._*` outputs; everyone reads it. There is
no other state.

When the Internal Candidate feature is on, `buildPostsRange` is called **twice** (once
per section). The second call overwrites all four S fields. `snapCtx` must be called
immediately after each call to preserve each section's schema, and `withCtx` is used by
the branched generators to restore the right schema around each branch's emission
without permanently clobbering `S`.

---

## Folder: `parsing/` — Excel → condition tree

**If the tool misread the spreadsheet, the bug is here.** This is the most likely place
for subtle bugs because input is messy human-typed Excel.

### `parsing/helpers.js`

Stateless **parsers for individual cells**. Each takes a string, returns a normalized
value. Debug these in isolation — they're pure functions.

| Export | Reads | Returns | Debug when… |
|--------|-------|---------|-------------|
| `detectCols(rows)` | the header rows | a column-index map (`{post, field, marks, grade, workexp, _hdrRow…}`) | **wrong columns picked** — the whole parse is offset. Check `S.colMap` first |
| `findInternalSeparator(rows)` | all rows | row index of the internal-section banner, or `-1` | separator not found / found at wrong row |
| `matchLevel(text)` | one cell | canonical level name or `null` | a level cell isn't recognized / matches wrong level |
| `normMark(str)` | marks cell | `'>=60%'` or `'CAT:lo:hi:cats'` or `null` | mark misread, **especially category-split marks** (this has the gnarliest regexes) |
| `parseCatMark`, `buildCatCond` | a `CAT:` string | the SC/ST vs others thresholds / the PHP `if` condition | category eligibility wrong |
| `normGrade(str)` | grade cell | canonical grade | grade misread |
| `parseSubs(str)` | subject cell | array of subjects (handles quoted `"a/b"` and `/` splits) | subjects split wrong (e.g. "Computer Science/IT" became two) |
| `parseWE(str)` | work-exp cell | months (years × 12) | work-exp duration wrong |
| `isPostQuali(str)` | work-exp text | bool — is it "Post Qualification"? | wrong work-exp *mode* |
| `deriveField(question)` | a radio question | auto field-name + lang-key | bad auto-generated radio field name |

> **`detectCols` Degree-as-field fix:** some internal sections use "Degree" as the
> education-level column (not a Degree axis). When `detectCols` sees `field == workexp`
> (both grabbed by "qualif" in the work-exp header) AND a standalone `degree` column
> exists, it promotes `degree → field` and clears the degree axis. This is the
> load-bearing change that makes internal-section parsing work. If the internal section
> produces junk posts (40+), suspect this fix has been accidentally reverted.

### `parsing/colorFilter.js`

**Red = removed.** Reviewers strike removed requirements in RED (red cell fill, red
font, or a red rich-text run inside a cell). SheetJS reads text only and is blind to
color, so this module reads the color separately and cleans the flattened `rows` array
**before** `parseRows` runs — the rest of the pipeline never sees the removed items.

An `.xlsx` is a ZIP; it reuses the already-loaded **JSZip** to read the raw OOXML parts
(`styles.xml`, `theme1.xml`, `sharedStrings.xml`, first worksheet) and parses them with
small regexes (works unchanged in the browser and in Node tests).

| Export | Purpose | Debug when… |
|--------|---------|-------------|
| `extractRedFilter(buf)` | async (JSZip) → `{redCells:Set, cleanText:Map, count}` | red content isn't being dropped / wrong cells dropped |
| `applyRedFilter(rows, rf, {r0,c0})` | mutates `rows`: blanks red cells, substitutes black-only text; `r0/c0` = sheet range origin from `decode_range(ws['!ref'])` | offset wrong (red applied to the wrong cell) |
| `_computeRedFilter(styles,theme,shared,sheet)` | the pure core (no zip/promise) — unit-testable | test a specific XML shape |
| `_isRedish(hex)` | hue-based red test — hue near 0°/360° with a chroma/brightness floor; catches muted tints (e.g. Excel's "Red, Accent 2, Lighter 40%" `#D99694`) while excluding orange/yellow/olive/blue | a shade wrongly (in/ex)cluded — tune the `RED` constant (`minChroma`, `minBrightness`, `hueMax`/`hueMin`) |

- **Whole-cell red** (red fill OR red font) → the cell is blanked (goes into `redCells`).
- **Partial red** (a rich-string with red *runs*) → keep only the black runs
  (`cleanText`); if nothing black survives, the cell is treated as whole-cell red.
- Wired in `ui.js` `onFileChange` only; on any failure it falls back to a plain
  color-blind parse. `S.redRemovedCount` drives the "N red … ignored" notice in `renderS1`.
- The `parseFile` / Node regression path stays color-blind (unchanged output).
- Test: `node test/run_color.js`.

> **Debug heuristic:** "red content still showing in the output" → check
> `App.S.redRemovedCount` after upload; if 0, the detector found nothing (verify the
> file actually uses red font/fill via its raw XML, not a look-alike theme color).

### `parsing/buildPosts.js`

The **orchestrator of parsing** — the single loop that walks every row and assembles
`posts[]`. It calls all the helpers above.

| Export | Purpose |
|--------|---------|
| `parseFile(buf)` | reads the `.xlsx` via XLSX, hands rows to `buildPosts` (single-section path, used by legacy callers) |
| `buildPosts(rows)` | thin wrapper — calls `buildPostsRange(rows)` and returns its result; backward-compatible with all existing callers |
| `buildPostsRange(rows)` | **the row-by-row state machine** — accepts a slice of rows (the full sheet or one section). Calls `detectCols(rows)` on the slice, walks rows, detects posts vs. continuation rows, OR/AND separators, radio questions, edu conditions; builds the `posts → orGroups → conditions` tree; writes `S.colMap`, `S.dimensions`, `S.weHeader`, `S.weMode` as side effects |

**Debug heuristic:** "It read the *cells* right but grouped them wrong" (a condition
attached to the wrong post, an OR-group missing, work-exp Case wrong) → `buildPostsRange`.
"It read a single *cell* wrong" → the matching helper in `helpers.js`.

> **Side-effect warning:** every call to `buildPostsRange` overwrites `S.colMap`,
> `S.dimensions`, `S.weHeader`, `S.weMode`. When called twice (internal candidate
> feature on), call `snapCtx()` immediately after each call to capture the schema before
> the next call overwrites it.

> **Work-exp modes (`S.weMode`), decided in `buildPosts`:**
> - **Case 1** — header says "Post Qualification" (no `/`): *all* posts participate in
>   `work_exp_details_validations.php`.
> - **Case 2** — header says plain "Work Experience": *none* participate (file not generated).
> - **Case 3** — header offers both (has `/`): per-post; only rows whose text says
>   "Post Qualification" participate.

### `parsing/streams.js`

**Subject/stream bookkeeping** — assigns each subject a stable numeric key and figures
out condition naming. This is post-parse analysis used by the generators.

| Export | Purpose | Debug when… |
|--------|---------|-------------|
| `getStreamData(posts)` | builds the global subject→key registry per level (the `01`, `02`… keys) | stream array keys are wrong/duplicated across posts |
| `annotateCondNames(posts, sd)` | tags conditions with `_cond1`/`_cond2` when a level appears with different subject sets | wrong `_condN` suffixes in `edu_config.php` |
| `arrRef(def, condName, single)` | builds a PHP array reference string | wrong array name referenced in conditions |
| `getAllRadios(post)` | de-duped list of a post's radio questions | radio missing/duplicated |
| `getCatValues(post)` | finds the category-mark for a post | category block missing |
| `buildSM` | builds a subject map | (helper, rarely the culprit) |

---

## Folder: `generators/` — condition tree → PHP

**If `posts[]` is correct but a generated `.php` file is wrong, find the file with the
matching name.** This is the cleanest mapping in the project: **one generator file ≈ one
output file.**

| Output file | Normal path | Internal Candidate branched path |
|-------------|-------------|----------------------------------|
| `edu_config.php` | `eduConfig.js` → `genEduConfig` | `internalBranch.js` → `genEduConfigBranched` |
| `eligibity_validation.php` | `eligibility.js` → `genEligibility` | `internalBranch.js` → `genEligibilityBranched` |
| `edu_validations.php` | `eduValidations.js` → `genEduValidations` | `internalBranch.js` → `genEduValidationsBranched` |
| `work_exp_details_validations.php` | `workExp.js` → `genWorkExpDetails` | `internalBranch.js` → `genWorkExpBranched` |
| `edu_details_lang.php` | `emit.js` → `genLangFile` | `internalBranch.js` → `genLangFileBranched` (union, not branched) |
| `eligibility_radio_fields.sql` | `eduQryArrays.js` → `genEduQrySql` | `internalBranch.js` → `genEduQrySqlBranched` (union, not branched) |

`ui.js` decides which path to call: when `intEnabled() && S.internalCandidate.posts.length > 0`, it uses the branched generators; otherwise it uses the normal generators (byte-identical to before).

### `generators/emit.js`

Low-level **output helpers** shared by generators, plus one full generator.

| Export | Purpose | Owns output file? |
|--------|---------|-------------------|
| `genLangFile(posts)` | → **`edu_details_lang.php`** (the radio question labels) | ✅ yes |
| `emitArr(lhs, sm)` | renders one PHP `array(…)` block | no (helper) |
| `sortEnts`, `buildMergedSM` | sort/merge array entries | no (helpers) |

**Debug:** lang file wrong → `genLangFile`. PHP arrays formatted/sorted wrong →
`emitArr`/`sortEnts`.

### `generators/eduConfig.js` → `edu_config.php`

`genEduConfig(posts)` — emits the stream arrays (`$arrGraduation_Stream[...]`) and the
radio-condition array. Debug when `edu_config.php` is wrong.

Also exports `emitAxisArrays(posts, AX, single)` and `emitDependentsAndRadios(posts, single)` as separately-callable sub-functions — used by `internalBranch.js` to wrap the array assignments in an `if/else` and emit the dependents/radios tail once over both branches combined.

### `generators/eligibility.js` → `eligibity_validation.php`

This is the **core eligibility logic generator** and also the home of the **shared
condition/error builders** that two other generators reuse.

| Export | Purpose | Debug when… |
|--------|---------|-------------|
| `genEligibility(posts)` | → `eligibity_validation.php` | the main validation file is wrong |
| `emitPostChain(posts, single)` | the per-post `if/else-if` chain body only (no file head/tail) | branched output has wrong per-post blocks |
| `buildCondLine(cond,…)` | builds **one** PHP boolean condition (mark/grade/stream/radio check) | **a condition expression is wrong** — used by eligibility, eduValidations AND workExp |
| `buildErrLine`, `buildErrMsgs` | build the user-facing error messages | error text wrong |
| `buildWE(months,d)` | work-exp check block | work-exp validation block wrong |
| `isWorkExpRadio`, `weYears`, `weRadioTiers` | work-exp-radio tier logic | tiered work-exp (e.g. "3yr if X, 2yr if Y") wrong |

> **Important:** `buildCondLine` is the most-reused function in the app. If the *same
> condition expression* is wrong across multiple output files, fix it once here.

### `generators/eduValidations.js` → `edu_validations.php`

`genEduValidations(posts)` — generates the `checkDOPassing()` function
(qualification-date validation). Reuses `buildCondLine` from `eligibility.js`. Debug when
`edu_validations.php` is wrong.

Also exports `collectGlobalVars(posts)` (the ordered PHP `global $arr…` list, computed
over a post array) and `emitValChain(posts, single)` (the per-post blocks only, used by
`internalBranch.js`). When debugging branched output, `collectGlobalVars` is called over
the union of both arrays so neither branch declares a global the other needs.

### `generators/workExp.js` → `work_exp_details_validations.php`

The most specialized generator.

| Export | Purpose |
|--------|---------|
| `genWorkExpDetails(posts)` | → `work_exp_details_validations.php`; returns `''` when no post needs it |
| `emitWEChain(posts, single)` | returns `{blocks, neededTs}` — the per-post blocks + the timestamps that must be declared; used by `internalBranch.js` to union `neededTs` from both branches and emit `strtotime` decls once |
| `WE_HEAD`, `WE_TAIL` | **the base64-embedded static PHP head/tail** — the giant blob. If the file's boilerplate top/bottom is wrong, it's these constants |
| `qualTimestamps`, `genQualSel`, `eduIdxsOf`, `tsIdxOf` | the "pick the latest qualification date" logic |

**Debug:** file not generated at all → check `post.postQuali` / `S.weMode` (set in
`buildPostsRange`). Wrong date-selection logic → `qualTimestamps`/`genQualSel`. Wrong
boilerplate → `WE_HEAD`/`WE_TAIL` (these decode from base64; uses `POSTQUAL_TS` from
constants).

### `generators/internalBranch.js` → branched output (Internal Candidate feature)

Only active when `intEnabled() && S.internalCandidate.posts.length > 0`. Never called
on the off path — the output is byte-identical to before when the feature is off.

| Export | Output file | What it wraps |
|--------|-------------|---------------|
| `genEligibilityBranched(normal, internal, ctxN, ctxI, field)` | `eligibity_validation.php` | `emitPostChain` for each branch inside `if($_POST['field']=='Y'){…}else{…}` |
| `genEduValidationsBranched(…)` | `edu_validations.php` | `emitValChain`; union `global $arr…` from both branches |
| `genWorkExpBranched(…)` | `work_exp_details_validations.php` | `emitWEChain`; union `neededTs`; shared `strtotime` decls |
| `genEduConfigBranched(…)` | `edu_config.php` | `emitAxisArrays` per branch; `emitDependentsAndRadios` over union |
| `genLangFileBranched(normal, internal)` | `edu_details_lang.php` | `genLangFile` over union (not branched) |
| `genEduQrySqlBranched(normal, internal)` | `eligibility_radio_fields.sql` | `genEduQrySql` over union (not branched) |

**Key design rules:**
- `single` is forced `false` for both branches when combined post count > 1, so array refs consistently use `[$postcode]`.
- `assignDeclares` is emitted once outside the `if/else` (not inside each branch).
- `withCtx(ctx, fn)` wraps every inner-emitter call so `S.dimensions` / `S.weMode` etc. reflect the correct section's schema and are restored afterwards.
- The dependents/radio tail in `edu_config.php` and the lang/SQL outputs are emitted over `normal.concat(internal)` — they are not branched because they declare variables and insert rows, not compute runtime values.

**Debug heuristic for branched output:**
- Wrong condition expression in a branch → `buildCondLine` in `eligibility.js`
- Wrong subjects/arrays in a branch → `emitAxisArrays` under the right `withCtx` call
- Duplicate `checkDOPassing` or `<?PHP` → one of the inner emitters is emitting its own head/tail (it should not); check that you're calling `emitValChain` / `emitPostChain`, not `genEduValidations` / `genEligibility`
- Singleton leak (wrong schema applied to a branch) → a `withCtx` call is missing or `snapCtx` was called before the side-effect write

---

## Folder: `ui/` — screen & user interaction

**If the *page* misbehaves (buttons, tables, previews, downloads) but the generated
strings are fine, the bug is here.**

### `ui/ui.js`

Everything you see and click. Organized by the 3 steps.

| Export | Step | Debug when… |
|--------|------|-------------|
| `onFileChange(e)` | upload | file upload does nothing / errors on load |
| `parseRows(rows)` | upload | split/single-section routing wrong; wrong post count after toggle |
| `reparse()` | toggle | toggling Internal Candidate doesn't re-split the sheet |
| `renderS1()` | step 1 | the parsed-tree table, stats, or error/warning alerts look wrong |
| `renderS2()` | step 2 | radio field-name config, AP config, or int-candidate config wrong |
| `renderIntCfg()` | step 2 | Internal Candidate checkbox / field input not rendering |
| `updIntEnable(el)` | step 2 | enabling the toggle doesn't trigger a reparse |
| `updIntField(el)` | step 2 | changing the field name doesn't update the preview |
| `updOv(el)` | step 2 | editing a radio field name doesn't update |
| `updatePreview()` | step 2 | the live code preview is stale/wrong |
| `setCode(id,code)` | both | syntax highlighting broken |
| `switchTab(t)` | step 2 | preview tabs don't switch |
| `renderS3()` | step 3 | the final output panels wrong |
| `copyCode`, `dlFile`, `dlZip`, `fileInfo` | step 3 | copy/download/zip buttons broken |
| `goStep(n)` | nav | step navigation broken |
| `weNone()` | — | the "not generated" placeholder message |

**Key:** `ui.js` is the bridge — it calls `parseRows`/`buildPostsRange` (parsing) and the
generators (normal or branched path), and it reads/writes `S`. It imports from every layer
but nothing imports from it (except `main.js`).

> **Internal Candidate routing in `ui.js`:** `parseRows` decides whether to split (calls
> `buildPostsRange` twice + `snapCtx` each time) or not (single `buildPostsRange` call).
> `updatePreview` and `renderS3` then check `isBranchMode()` — true when
> `intEnabled() && S.internalCandidate.posts.length > 0 && S._normalCtx && S.internalCandidate.ctx`
> — and call the branched or normal generators accordingly. If the preview shows the wrong
> path, start here.

### `js/main.js` — the bootstrap (loads last)

The **ignition**. Does three things, nothing more:

1. Re-publishes click/input handlers to `window.*` (so the inline `onclick="goStep(2)"`
   in `index.html` works),
2. Attaches the file-input `change` listener,
3. Wires up drag-and-drop.

**Debug when:** a button does literally nothing (handler not on `window`), upload/drag-
drop doesn't fire, or `hljs.configure` errors.

> If you add a new `onclick=` handler in the HTML, you must export it from `ui.js`
> **and** add it to `main.js`'s `window.*` list.

---

## `js/app.legacy.js`

The pre-split monolith, **not loaded** by the page. Keep it only as a reference to
compare against; ignore it during debugging. It can be deleted once you're confident in
the modular version.

---

## Your debugging decision tree

```
Something's wrong…
│
├─ Page/button/table broken, output strings are fine?
│    → ui/ui.js   (handler not firing? → main.js)
│
├─ A generated .php file is wrong?
│    │
│    ├─ Internal Candidate feature ON?
│    │    → check BOTH App.S.posts (normal) AND App.S.internalCandidate.posts
│    │    → which branch contains the wrong data?
│    │    ├─ Wrong post count/structure in a branch
│    │    │     → parsing/ (normal rows vs. internal rows after the separator)
│    │    │     → helpers.js: findInternalSeparator (right row?)
│    │    │     → helpers.js: detectCols Degree-as-field fix (internal section)
│    │    ├─ Right posts, wrong branched PHP
│    │    │     → internalBranch.js (missing withCtx? wrong inner emitter?)
│    │    └─ Duplicate <?PHP / checkDOPassing / WE_HEAD
│    │           → an inner emitter (emitPostChain/emitValChain/emitWEChain) is
│    │              being replaced with the full gen* function — fix the call site
│    │
│    └─ Internal Candidate feature OFF (normal path)
│         → first check App.S.posts in console — is the tree right?
│         ├─ Tree is WRONG → parsing/
│         │     ├─ wrong columns?            → helpers.js: detectCols (check S.colMap)
│         │     ├─ one cell misread?         → helpers.js: norm*/parse*/matchLevel
│         │     └─ cells right, grouping off?→ buildPostsRange in buildPosts.js
│         │
│         └─ Tree is RIGHT → generators/ (pick by filename)
│               ├─ edu_config.php          → eduConfig.js
│               ├─ eligibity_validation.php→ eligibility.js
│               ├─ edu_validations.php     → eduValidations.js
│               ├─ work_exp_…php           → workExp.js (+ POSTQUAL_TS in constants)
│               ├─ edu_details_lang.php    → emit.js: genLangFile
│               ├─ a condition expression  → eligibility.js: buildCondLine (shared!)
│               └─ stream array keys/order → streams.js + EDU_ORDER in constants
│
└─ A mapping/threshold/level-name is just wrong everywhere?
     → core/constants.js
```

---

## Console debugging tricks

Open the page, upload a spreadsheet, then open DevTools (F12) → Console. Because every
function lives on the global `App` object, you can inspect and re-run the whole pipeline
by hand:

```js
// 1. Inspect the parse tree — the boundary between parsing and generation.
//    If this is wrong, the bug is in parsing/. If it's right, it's in generators/.
App.S.posts                          // normal posts
App.S.internalCandidate.posts        // internal posts (empty when feature is off)

// 2. See exactly which spreadsheet columns the tool latched onto.
//    A wrong column map offsets the entire parse.
App.S.colMap           // normal section's column map (restored after parseRows)
App.S._normalCtx       // full normal-section schema snapshot {dimensions,colMap,weHeader,weMode}
App.S.internalCandidate.ctx  // internal-section schema snapshot

// 3. See what the parser flagged.
App.S.errors
App.S.warnings

// 4. See the work-exp mode that was detected (1, 2, or 3 — see buildPostsRange notes above).
App.S.weMode
App.S.weHeader

// 5. Check whether Internal Candidate is active and what field name is set.
App.intEnabled()   // → true/false
App.intField()     // → 'internal_candidate' (or whatever the user typed)

// 6. Find the separator row in the raw rows.
App.findInternalSeparator(App.S.rawRows)  // → row index, or -1 if not found

// 7. Re-run a single generator by hand against the current tree (normal path).
App.genEduConfig(App.S.posts)
App.genEligibility(App.S.posts)
App.genEduValidations(App.S.posts)
App.genWorkExpDetails(App.S.posts)
App.genLangFile(App.S.posts)

// 8. Re-run a branched generator by hand (when Internal Candidate is on).
var n=App.S.posts, ic=App.S.internalCandidate.posts;
var cN=App.S._normalCtx, cI=App.S.internalCandidate.ctx, f=App.intField();
App.genEligibilityBranched(n, ic, cN, cI, f)
App.genEduValidationsBranched(n, ic, cN, cI, f)
App.genWorkExpBranched(n, ic, cN, cI, f)
App.genEduConfigBranched(n, ic, cN, cI, f)

// 9. Test a single cell parser in isolation (pure functions, no state needed).
App.matchLevel('M.Tech')              // → 'Post Graduation'
App.normMark('For SC/ST >=50%, For All other >=60%')  // → 'CAT:50:60:SC+ST'
App.parseSubs('Engineering/"Computer Science/IT"')    // → ['Engineering','Computer Science/IT']
App.parseWE('3 years')                // → 36

// 10. Inspect a condition expression the generators would emit for a given condition.
App.buildCondLine(App.S.posts[0].orGroups[0].conditions[0], '01', App.S.posts.length===1)

// 11. Verify the singleton is not leaking after a branched run.
var dimsBefore=JSON.stringify(App.S.dimensions);
App.genEligibilityBranched(n, ic, cN, cI, f);
JSON.stringify(App.S.dimensions) === dimsBefore  // → true if withCtx restored correctly

// 12. The last generated outputs are cached on S after visiting step 3:
App.S._edu      // edu_config.php
App.S._eli      // eligibity_validation.php
App.S._eduval   // edu_validations.php
App.S._workexp  // work_exp_details_validations.php
App.S._lang     // edu_details_lang.php
```

> **Reproducing a bug from a spreadsheet without the UI:** for normal sheets, call
> `App.buildPostsRange(rows)` on the rows from `XLSX.utils.sheet_to_json`. For
> internal-candidate sheets, split at `App.findInternalSeparator(rows)`, call
> `buildPostsRange` on each slice, snapshot with `App.snapCtx()` after each call,
> then feed both arrays and snapshots to the branched generators. The generators never
> touch the DOM, so they're easy to unit-test in the console or in Node (see
> `test/run_internal.js` for the full pattern).

---

## Quick reference: "I want to change X"

| I want to… | Go to |
|------------|-------|
| Add a new education level | `core/constants.js` (`EDU`, `EDU_ORDER`, maybe `EDU_KW`/`EDU_ALIASES`) |
| Allow a new mark threshold (e.g. `>=75%`) | `core/constants.js` (`MARK_OPS`) |
| Fix a level name not being recognized | `parsing/helpers.js` (`matchLevel`) + `core/constants.js` aliases/keywords |
| Fix category-mark parsing (SC/ST vs others) | `parsing/helpers.js` (`normMark`, `parseCatMark`, `buildCatCond`) |
| Fix subject splitting | `parsing/helpers.js` (`parseSubs`) |
| Fix which columns are detected | `parsing/helpers.js` (`detectCols`) |
| Fix internal section columns being misread | `parsing/helpers.js` (`detectCols` Degree-as-field fix) |
| Add a new internal-section separator phrase | `parsing/helpers.js` (`INT_SEP_RE` / `INT_SEP_ALT` in `findInternalSeparator`) |
| Change how posts/OR-groups are assembled | `parsing/buildPosts.js` (`buildPostsRange`) |
| Change a single PHP condition expression | `generators/eligibility.js` (`buildCondLine`) |
| Change the structure of one output file (normal path) | the matching `generators/*.js` (see the output-file table) |
| Change the structure of one output file (branched path) | `generators/internalBranch.js` (the matching `gen*Branched` function) |
| Change the work-exp boilerplate (head/tail) | `generators/workExp.js` (`WE_HEAD`/`WE_TAIL`, base64) |
| Change the Internal Candidate UI (checkbox, field input) | `ui/ui.js` (`renderIntCfg`) |
| Change the Appeared/Passed hierarchy (which level is a post's "highest qualification") | it's user data, not code: the Step-2 drag & drop writes `S.appearedPassed.hierarchy` / `.generic`, resolved by `apRank` in `core/state.js`; the default comes from `defaultAcadRank` in `core/constants.js` |
| Change the Appeared/Passed UI (enable, hierarchy columns, field names) | `ui/ui.js` (`renderApCfg`, `apRenderHierarchy`, `apGroups`, `apMoveLevel`) |
| Change how the sheet is split / re-parsed on toggle | `ui/ui.js` (`parseRows`, `reparse`) |
| Change on-screen tables / previews / buttons | `ui/ui.js` |
| Add a new inline `onclick=` handler | export from `ui/ui.js` **and** add to `main.js` window list |
| Add/remove a CDN library or reorder script loading | `index.html` |

---

## Feature: Internal / Departmental Candidate Support — at a glance

A cheat-sheet for the most common support scenarios with this feature.

### "The separator isn't being detected"

1. Check `App.findInternalSeparator(App.S.rawRows)` in the console — returns a row
   index or -1.
2. The separator row must have its text only in the **first cell** (all other cells blank).
3. The text must match one of the intent patterns: `internal`, `departmental`,
   `in-service`, or `deputation` combined with `candidate`; or start with `for internal/departmental/in-service`.
4. It must appear after at least one normal data row (the first data row signals
   "normal section started"). A banner in row 0 is ignored.
5. To add a new phrase, extend `INT_SEP_RE` or `INT_SEP_ALT` in
   `parsing/helpers.js` → `findInternalSeparator`.

### "The internal section yields 0 posts / 40+ junk posts"

Almost always the **Degree-as-field** mis-detection. The internal section's "Degree"
column (col 1) holds the education level, not a degree-axis value.

Symptom: `detectCols` on the internal header returns `{field:5, workexp:5, degree:1}`
(field collides with workexp; degree is treated as its own axis). The level column is
never read.

Fix is in `parsing/helpers.js` inside `detectCols`, after the header-accept branch:
```js
if(m.field===m.workexp && m.degree!==undefined && m.degree!==m.field){
  m.field=m.degree; m.degree=undefined;
}
```
Verify this is still present. It cannot affect normal sheets (which have a real
`Exam Passed` column, so `field !== workexp`).

### "Output has duplicate `<?PHP` / `checkDOPassing` / `WE_HEAD`"

A branched generator is calling the full `gen*` function instead of the inner emitter.
| Correct (inner emitter) | Wrong (full generator) |
|-------------------------|------------------------|
| `emitPostChain(posts, single)` | `genEligibility(posts)` |
| `emitValChain(posts, single)` | `genEduValidations(posts)` |
| `emitWEChain(posts, single)` | `genWorkExpDetails(posts)` |

Fix the call site in `generators/internalBranch.js`.

### "Output uses the wrong schema for one branch (singleton leak)"

The branched generator called an inner emitter without wrapping it in `withCtx`.

Every inner-emitter call in `internalBranch.js` must look like:
```js
withCtx(ctxI, function(){ return emitPostChain(internal, single); })
withCtx(ctxN, function(){ return emitPostChain(normal,   single); })
```

If a call is missing the `withCtx` wrapper, the inner emitter reads whatever
`S.dimensions`/`S.weMode` happen to be at that moment — which may be the wrong
section's schema.

Verify with the console snippet:
```js
var dimsBefore = JSON.stringify(App.S.dimensions);
App.genEligibilityBranched(n, ic, cN, cI, f);
JSON.stringify(App.S.dimensions) === dimsBefore  // must be true
```

### "Normal-path output changed after adding this feature (backward compat break)"

1. Make sure `S.internalCandidate.enabled` is `false` (the default).
2. `updatePreview` / `renderS3` check `isBranchMode()` and must call the plain
   generators when it returns false.
3. The inner-emitter refactors (`emitPostChain`, `emitValChain`, `emitWEChain`) must
   not change the output of `genEligibility` / `genEduValidations` / `genWorkExpDetails`
   on the normal path. Run the regression gate to confirm:
   ```
   node test/run.js && node test/run3d.js && node test/run_qry.js && node test/run_issues.js
   ```

### Test file

`test/run_internal.js` — 24 assertions covering separator detection, post counts,
Degree-as-field fix, branched output structure, singleton leak guard, and backward
compat. Run with:
```
node test/run_internal.js
```
