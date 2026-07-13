# Graph Report - .  (2026-07-10)

## Corpus Check
- 40 files · ~50,704 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 412 nodes · 705 edges · 20 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 99,202 output

## Community Hubs (Navigation)
- Core Pipeline & Generators
- Legacy Monolith (app.legacy.js)
- Query Test Harness
- UI Rendering & Step Controls
- Eligibility Rules & Stream Parsing
- Internal Candidate Tests
- Legacy Compatibility Tests
- Parsing Helper Utilities
- Shared App State
- Excel Red-Cell Color Filter
- Radio Field Tests
- Dimension Combinatorics
- 3D Combo Tests
- Color Filter Tests
- Degree Parsing Tests
- Marks Normalization Tests

## God Nodes (most connected - your core abstractions)
1. `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)` - 49 edges
2. `README.md — Project Overview & Structure` - 21 edges
3. `index.html — App Shell, Step UI & Module Load Order` - 21 edges
4. `updatePreview()` - 14 edges
5. `context.md — Dev Context Notes (legacy single-file version)` - 13 edges
6. `genEligibility()` - 12 edges
7. `genWorkExpDetails()` - 12 edges
8. `buildPosts()` - 11 edges
9. `genEduConfig()` - 11 edges
10. `ind()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)` --references--> `intEnabled()`  [EXTRACTED]
  DEBUGGING.md → js/core/state.js
- `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)` --references--> `intField()`  [EXTRACTED]
  DEBUGGING.md → js/core/state.js
- `context.md — Dev Context Notes (legacy single-file version)` --references--> `genEduConfig()`  [EXTRACTED]
  context.md → js/generators/eduConfig.js
- `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)` --references--> `emitPostChain()`  [EXTRACTED]
  DEBUGGING.md → js/generators/eligibility.js
- `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)` --references--> `buildCondLine()`  [EXTRACTED]
  DEBUGGING.md → js/generators/eligibility.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Internal Candidate branched-output family: 6 gen*Branched functions implementing the split normal/internal PHP emission pattern via withCtx** — js_generators_internalbranch_geneligibilitybranched, js_generators_internalbranch_geneduvalidationsbranched, js_generators_internalbranch_genworkexpbranched, js_generators_internalbranch_geneduconfigbranched, js_generators_internalbranch_genlangfilebranched, js_generators_internalbranch_geneduqrysqlbranched, debugging_context_snapshot_withctx, debugging_internal_candidate_feature [EXTRACTED 1.00]
- **The 3-step pipeline folders (core/parsing/generators/ui) that jointly implement Excel -> posts[] -> PHP -> UI** — js_core_state, js_parsing_buildposts, js_generators_eligibility, js_ui_ui, debugging_three_step_pipeline [EXTRACTED 1.00]
- **context.md subject-parsing fix session: Fix 1 (pending), Fix 2 ('Any value'), and Fix 3 (delimiter/quotes) all revolve around parseSubs and the downstream condition/error builders** — context_any_value_subjects_fix, context_subject_delimiter_fix, context_others_default_array_fix, js_parsing_helpers_parsesubs, js_generators_eligibility_buildcondline [EXTRACTED 1.00]

## Communities (20 total, 0 thin omitted)

### Community 0 - "Core Pipeline & Generators"
Cohesion: 0.06
Nodes (50): css/styles.css — stylesheet (was the inline <style> block of the original test.html), Context snapshot (ctx = {dimensions,colMap,weHeader,weMode}) + withCtx(ctx,fn) — rationale: buildPostsRange is called twice for the internal-candidate split and each call overwrites shared S fields, so snapCtx must capture the schema right after each call and withCtx must wrap every branched-generator emission to apply/restore the correct schema, preventing a singleton leak across branches, detectCols Degree-as-field fix — some internal sections use a 'Degree' column as the education-level column rather than a Degree axis; when field==workexp (both matched by "qualif") and a standalone degree column exists, detectCols promotes degree->field and clears the degree axis. Load-bearing: if reverted, internal sections yield 40+ junk posts, DEBUGGING.md — Debugging Guide (Eligibility Code Generator), Internal / Departmental Candidate Support — splits one sheet into two parallel posts[] arrays (normal + internal) when enabled and a separator row is found, 3-Step Pipeline: Excel -> posts[] (parsing/) -> 5 PHP strings (generators/) -> rendered UI (ui/); core/ is shared vocabulary, main.js is the ignition switch, window.App shared-global module pattern — each file is an IIFE that pulls needed names into locals and exports its own functions back onto App, loaded by index.html in dependency order, Work-exp modes (S.weMode), decided in buildPosts: Case 1 all posts participate (header says Post Qualification only), Case 2 none participate (plain Work Experience header), Case 3 per-post opt-in (header offers both) (+42 more)

### Community 1 - "Legacy Monolith (app.legacy.js)"
Cohesion: 0.08
Nodes (54): annotateCondNames(), arrRef(), buildCatCond(), buildCondLine(), buildErrLine(), buildErrMsgs(), buildMergedSM(), buildPosts() (+46 more)

### Community 2 - "Query Test Harness"
Cohesion: 0.05
Nodes (29): files, fs, path, root, sandbox, vm, App, path (+21 more)

### Community 3 - "UI Rendering & Step Controls"
Cohesion: 0.12
Nodes (33): apDistinctLevels(), apRankHint(), apSuggest(), copyCode(), dlFile(), fileInfo(), goStep(), isBranchMode() (+25 more)

### Community 4 - "Eligibility Rules & Stream Parsing"
Cohesion: 0.11
Nodes (27): Fix 2 (DONE): 'Any value' in subjects column means any stream accepted — no edu_config array, just a not-empty $_POST check in validation, and "Please enter" instead of "Please select" in the error text, context.md — Dev Context Notes (legacy single-file version), Fix 1 (NOT DONE / reverted): posts with empty subjects for a level where sibling posts DO have subjects should default to array('01'=>'Others'); getStreamData currently skips empty-subject conditions so no slot/array is ever emitted — blocked pending clarification of the exact Excel layout, Fix 3 (DONE): subjects are '/'-delimited, not comma-delimited (commas can appear inside one subject value); quoted "..." subject values must have their quotes stripped, posts[] condition tree — posts -> orGroups -> conditions (edu | radio); the single most useful debugging inspection target (App.S.posts), acadRank(), axisClause(), buildCondGroupLine() (+19 more)

### Community 5 - "Internal Candidate Tests"
Cohesion: 0.07
Nodes (23): App, ctxI, ctxN, dimsAfter, dimsBefore, edu, eduval, eli (+15 more)

### Community 6 - "Legacy Compatibility Tests"
Cohesion: 0.09
Nodes (19): a, App, b, fs, genOld(), Legacy, out, path (+11 more)

### Community 7 - "Parsing Helper Utilities"
Cohesion: 0.16
Nodes (12): buildCatCond(), colIsAllNumeric(), dedupCats(), detectDims(), hdrCell(), isDisabilityToken(), normMark(), normPlainMark() (+4 more)

### Community 8 - "Shared App State"
Cohesion: 0.16
Nodes (7): apEnabled(), apField(), getOv(), intEnabled(), intField(), rFn(), rLk()

### Community 9 - "Excel Red-Cell Color Filter"
Cohesion: 0.28
Nodes (13): Red-cell removal filter — reviewers strike removed requirements in red font/fill; colorFilter.js reads OOXML color info directly (SheetJS is color-blind) and blanks/cleans rows before parseRows runs, applyTint(), attr(), buildThemePalette(), computeFilter(), decodeXml(), extractRedFilter(), firstSheetPath() (+5 more)

### Community 10 - "Radio Field Tests"
Cohesion: 0.13
Nodes (10): App, CI, fs, legacyRows, NEG, path, POS, radios (+2 more)

### Community 11 - "Dimension Combinatorics"
Cohesion: 0.27
Nodes (9): assignDeclares(), dimCond(), dimCount(), dimPath(), dimPathOf(), dimPathVars(), dims(), dimVals() (+1 more)

### Community 12 - "3D Combo Tests"
Cohesion: 0.18
Nodes (9): App, edu, eli, fs, m, out, path, res (+1 more)

### Community 13 - "Color Filter Tests"
Cohesion: 0.20
Nodes (10): eq(), fs, ok(), path, rf, rf2, rows, rows2 (+2 more)

### Community 14 - "Degree Parsing Tests"
Cohesion: 0.18
Nodes (7): App, fs, legacyRows, lout, lres, path, XLSX

### Community 15 - "Marks Normalization Tests"
Cohesion: 0.32
Nodes (7): App, eq(), ok(), parseXlsx(), path, reset(), XLSX

## Knowledge Gaps
- **109 isolated node(s):** `App`, `fs`, `path`, `rows`, `seen` (+104 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)` connect `Core Pipeline & Generators` to `Legacy Monolith (app.legacy.js)`, `UI Rendering & Step Controls`, `Eligibility Rules & Stream Parsing`, `Parsing Helper Utilities`, `Shared App State`, `Excel Red-Cell Color Filter`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **Why does `README.md — Project Overview & Structure` connect `Core Pipeline & Generators` to `Legacy Monolith (app.legacy.js)`, `UI Rendering & Step Controls`, `Eligibility Rules & Stream Parsing`, `Parsing Helper Utilities`, `Shared App State`, `Excel Red-Cell Color Filter`, `Dimension Combinatorics`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `index.html — App Shell, Step UI & Module Load Order` connect `Core Pipeline & Generators` to `UI Rendering & Step Controls`, `Eligibility Rules & Stream Parsing`, `Parsing Helper Utilities`, `Shared App State`, `Excel Red-Cell Color Filter`, `Dimension Combinatorics`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `NOTE: toggle a separate overlay element rather than rewriting the upload`, `App`, `fs` to the rest of the system?**
  _114 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Pipeline & Generators` be split into smaller, more focused modules?**
  _Cohesion score 0.05952380952380952 - nodes in this community are weakly interconnected._
- **Should `Legacy Monolith (app.legacy.js)` be split into smaller, more focused modules?**
  _Cohesion score 0.08469945355191257 - nodes in this community are weakly interconnected._
- **Should `Query Test Harness` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._