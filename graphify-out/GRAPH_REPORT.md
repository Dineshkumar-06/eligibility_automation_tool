# Graph Report - eligibility_automation_tool  (2026-10-16)

## Corpus Check
- 47 files · ~62,206 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 535 nodes · 899 edges · 40 communities (36 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4236931a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DEBUGGING.md — Debugging Guide (Eligibility Code Generator)
- app.legacy.js
- run_qry.js
- ui.js
- eligibility.js
- run_internal.js
- compat.js
- helpers.js
- state.js
- colorFilter.js
- run_radio.js
- dimensions.js
- run3d.js
- run_color.js
- run_degree.js
- run_marks.js
- postCompare.js
- eduConfig.js
- CLAUDE.md
- buildPostsRange
- run_ap.js
- run.js
- validate.js
- harness.js
- examAliasRef.js
- run_clarify.js
- run_issues.js
- run_we_mixed.js
- run_subject_other_equivalent.js
- index.html — App Shell, Step UI & Module Load Order
- workExp.js
- eduValidations.js
- emit.js
- run_sow_absent.js
- eduQryArrays.js
- renderPostsIntoTbody

## God Nodes (most connected - your core abstractions)
1. `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)` - 49 edges
2. `index.html — App Shell, Step UI & Module Load Order` - 21 edges
3. `README.md — Project Overview & Structure` - 21 edges
4. `updatePreview()` - 18 edges
5. `buildPosts()` - 13 edges
6. `genWorkExpDetails()` - 13 edges
7. `context.md — Dev Context Notes (legacy single-file version)` - 13 edges
8. `genEligibility()` - 12 edges
9. `renderApCfg()` - 12 edges
10. `genEduConfig()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)` --references--> `intEnabled()`  [EXTRACTED]
  DEBUGGING.md → js/core/state.js
- `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)` --references--> `intField()`  [EXTRACTED]
  DEBUGGING.md → js/core/state.js
- `context.md — Dev Context Notes (legacy single-file version)` --references--> `genEduConfig()`  [EXTRACTED]
  context.md → js/generators/eduConfig.js
- `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)` --references--> `emitValChain()`  [EXTRACTED]
  DEBUGGING.md → js/generators/eduValidations.js
- `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)` --references--> `emitPostChain()`  [EXTRACTED]
  DEBUGGING.md → js/generators/eligibility.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **context.md subject-parsing fix session: Fix 1 (pending), Fix 2 ('Any value'), and Fix 3 (delimiter/quotes) all revolve around parseSubs and the downstream condition/error builders** — context_any_value_subjects_fix, context_subject_delimiter_fix, context_others_default_array_fix, js_parsing_helpers_parsesubs, js_generators_eligibility_buildcondline [EXTRACTED 1.00]
- **Internal Candidate branched-output family: 6 gen*Branched functions implementing the split normal/internal PHP emission pattern via withCtx** — js_generators_internalbranch_geneligibilitybranched, js_generators_internalbranch_geneduvalidationsbranched, js_generators_internalbranch_genworkexpbranched, js_generators_internalbranch_geneduconfigbranched, js_generators_internalbranch_genlangfilebranched, js_generators_internalbranch_geneduqrysqlbranched, debugging_context_snapshot_withctx, debugging_internal_candidate_feature [EXTRACTED 1.00]
- **The 3-step pipeline folders (core/parsing/generators/ui) that jointly implement Excel -> posts[] -> PHP -> UI** — js_core_state, js_parsing_buildposts, js_generators_eligibility, js_ui_ui, debugging_three_step_pipeline [EXTRACTED 1.00]

## Communities (40 total, 4 thin omitted)

### Community 0 - "DEBUGGING.md — Debugging Guide (Eligibility Code Generator)"
Cohesion: 0.16
Nodes (20): Context snapshot (ctx = {dimensions,colMap,weHeader,weMode}) + withCtx(ctx,fn) — rationale: buildPostsRange is called twice for the internal-candidate split and each call overwrites shared S fields, so snapCtx must capture the schema right after each call and withCtx must wrap every branched-generator emission to apply/restore the correct schema, preventing a singleton leak across branches, detectCols Degree-as-field fix — some internal sections use a 'Degree' column as the education-level column rather than a Degree axis; when field==workexp (both matched by "qualif") and a standalone degree column exists, detectCols promotes degree->field and clears the degree axis. Load-bearing: if reverted, internal sections yield 40+ junk posts, DEBUGGING.md — Debugging Guide (Eligibility Code Generator), Internal / Departmental Candidate Support — splits one sheet into two parallel posts[] arrays (normal + internal) when enabled and a separator row is found, 3-Step Pipeline: Excel -> posts[] (parsing/) -> 5 PHP strings (generators/) -> rendered UI (ui/); core/ is shared vocabulary, main.js is the ignition switch, Work-exp modes (S.weMode), decided in buildPosts: Case 1 all posts participate (header says Post Qualification only), Case 2 none participate (plain Work Experience header), Case 3 per-post opt-in (header offers both), snapCtx(), withCtx() (+12 more)

### Community 1 - "app.legacy.js"
Cohesion: 0.08
Nodes (58): annotateCondNames(), arrRef(), buildCatCond(), buildCondLine(), buildErrLine(), buildErrMsgs(), buildMergedSM(), buildPosts() (+50 more)

### Community 2 - "run_qry.js"
Cohesion: 0.12
Nodes (13): alters, App, edu, emptyEdu, emptySql, fields, fs, items (+5 more)

### Community 3 - "ui.js"
Cohesion: 0.09
Nodes (49): apDefaultGroups(), apDistinctLevels(), apDndCol(), apDndItem(), apGroups(), apMoveLevel(), apRankHint(), apRenderHierarchy() (+41 more)

### Community 4 - "eligibility.js"
Cohesion: 0.11
Nodes (26): Fix 2 (DONE): 'Any value' in subjects column means any stream accepted — no edu_config array, just a not-empty $_POST check in validation, and "Please enter" instead of "Please select" in the error text, context.md — Dev Context Notes (legacy single-file version), Fix 1 (NOT DONE / reverted): posts with empty subjects for a level where sibling posts DO have subjects should default to array('01'=>'Others'); getStreamData currently skips empty-subject conditions so no slot/array is ever emitted — blocked pending clarification of the exact Excel layout, Fix 3 (DONE): subjects are '/'-delimited, not comma-delimited (commas can appear inside one subject value); quoted "..." subject values must have their quotes stripped, posts[] condition tree — posts -> orGroups -> conditions (edu | radio); the single most useful debugging inspection target (App.S.posts), acadRank(), axisClause(), buildCondGroupLine() (+18 more)

### Community 5 - "run_internal.js"
Cohesion: 0.07
Nodes (23): App, ctxI, ctxN, dimsAfter, dimsBefore, edu, eduval, eli (+15 more)

### Community 6 - "compat.js"
Cohesion: 0.08
Nodes (18): a, App, b, fs, Legacy, out, path, rows (+10 more)

### Community 7 - "helpers.js"
Cohesion: 0.13
Nodes (18): buildCatCond(), colIsAllNumeric(), collapseWs(), dedupCats(), detectDims(), disambiguateRadioNames(), distinctWord(), hdrCell() (+10 more)

### Community 8 - "state.js"
Cohesion: 0.13
Nodes (7): apEnabled(), apField(), getOv(), intEnabled(), intField(), rFn(), rLk()

### Community 9 - "colorFilter.js"
Cohesion: 0.19
Nodes (14): Red-cell removal filter — reviewers strike removed requirements in red font/fill; colorFilter.js reads OOXML color info directly (SheetJS is color-blind) and blanks/cleans rows before parseRows runs, applyRedFilter(), applyTint(), attr(), buildThemePalette(), computeFilter(), decodeXml(), extractRedFilter() (+6 more)

### Community 10 - "run_radio.js"
Cohesion: 0.12
Nodes (10): App, CI, fs, legacyRows, NEG, path, POS, radios (+2 more)

### Community 11 - "dimensions.js"
Cohesion: 0.23
Nodes (12): assignDeclares(), buildNested(), emit(), group(), dimCond(), dimCount(), dimPath(), dimPathOf() (+4 more)

### Community 12 - "run3d.js"
Cohesion: 0.18
Nodes (9): App, edu, eli, fs, m, out, path, res (+1 more)

### Community 13 - "run_color.js"
Cohesion: 0.20
Nodes (10): eq(), fs, ok(), path, rf, rf2, rows, rows2 (+2 more)

### Community 14 - "run_degree.js"
Cohesion: 0.18
Nodes (7): App, fs, legacyRows, lout, lres, path, XLSX

### Community 15 - "run_marks.js"
Cohesion: 0.32
Nodes (7): App, eq(), ok(), parseXlsx(), path, reset(), XLSX

### Community 20 - "postCompare.js"
Cohesion: 0.25
Nodes (11): comparePostOrder(), dimSelVal(), filterPostCompare(), lcsScript(), normPost(), parsePastedPosts(), posLabel(), renderResult() (+3 more)

### Community 21 - "eduConfig.js"
Cohesion: 0.26
Nodes (8): emitAxisArrays(), emitDependentsAndRadios(), radioEnts(), emitForCombos(), genEduConfig(), markCatFields(), postForCombo(), sortCombos()

### Community 22 - "CLAUDE.md"
Cohesion: 0.20
Nodes (8): Architecture, Internal / Departmental Candidate feature, Knowledge graph (graphify), Module wiring, Running the app, Testing, What this is, Where to look for a given change

### Community 23 - "buildPostsRange"
Cohesion: 0.27
Nodes (5): buildPosts(), buildPostsRange(), get(), rowDimCells(), parseFile()

### Community 24 - "run_ap.js"
Cohesion: 0.22
Nodes (4): App, fs, path, XLSX

### Community 25 - "run.js"
Cohesion: 0.25
Nodes (6): App, fs, idx, out, path, rows

### Community 26 - "validate.js"
Cohesion: 0.29
Nodes (10): buildClarificationMailText(), collectAxisValues(), collectRadioConds(), detectClarifications(), findDupGroups(), findDupGroupsByLevel(), findRadioDupGroups(), fmtMailValue() (+2 more)

### Community 27 - "harness.js"
Cohesion: 0.29
Nodes (6): files, fs, path, root, sandbox, vm

### Community 28 - "examAliasRef.js"
Cohesion: 0.53
Nodes (4): buildExamAliasGroups(), openExamAliasRef(), prettifyAlias(), renderExamAliasRef()

### Community 33 - "index.html — App Shell, Step UI & Module Load Order"
Cohesion: 0.24
Nodes (6): css/styles.css — stylesheet (was the inline <style> block of the original test.html), window.App shared-global module pattern — each file is an IIFE that pulls needed names into locals and exports its own functions back onto App, loaded by index.html in dependency order, index.html — App Shell, Step UI & Module Load Order, Light/Dark theme toggle — applied pre-paint via inline <head> script to avoid FOUC, persisted to localStorage key 'ecg-theme', swaps highlight.js stylesheet to match, README.md — Project Overview & Structure, Modular split verified byte-identical — original single test.html was reorganized into functional modules with no logic changes; an equivalence test confirmed both versions produce identical output for all five generated files, including the base64-embedded work_exp template

### Community 34 - "workExp.js"
Cohesion: 0.50
Nodes (7): eduIdxsOf(), emitWEChain(), record(), genQualSel(), genWorkExpDetails(), qualTimestamps(), tsIdxOf()

### Community 35 - "eduValidations.js"
Cohesion: 0.53
Nodes (5): collectGlobalVars(), addAxisGlobals(), addGlobal(), emitValChain(), genEduValidations()

### Community 36 - "emit.js"
Cohesion: 0.40
Nodes (3): emitArr(), genLangFile(), sortEnts()

### Community 37 - "run_sow_absent.js"
Cohesion: 0.40
Nodes (4): App, d, gen(), mk()

### Community 38 - "eduQryArrays.js"
Cohesion: 0.70
Nodes (4): alterStmt(), arrAdditionSection(), collectRadioFields(), genEduQrySql()

### Community 39 - "renderPostsIntoTbody"
Cohesion: 0.57
Nodes (8): renderPostsIntoTbody(), anyRed(), cellKey(), fullRed(), mark(), normS(), partRed(), subjHtml()

## Knowledge Gaps
- **123 isolated node(s):** `App`, `Legacy`, `fs`, `path`, `rows` (+118 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)` connect `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)` to `app.legacy.js`, `index.html — App Shell, Step UI & Module Load Order`, `eduValidations.js`, `eligibility.js`, `emit.js`, `workExp.js`, `helpers.js`, `state.js`, `colorFilter.js`, `ui.js`, `eduConfig.js`, `buildPostsRange`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Why does `README.md — Project Overview & Structure` connect `index.html — App Shell, Step UI & Module Load Order` to `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)`, `app.legacy.js`, `workExp.js`, `eduValidations.js`, `eligibility.js`, `emit.js`, `eduQryArrays.js`, `helpers.js`, `state.js`, `colorFilter.js`, `ui.js`, `dimensions.js`, `eduConfig.js`, `buildPostsRange`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `index.html — App Shell, Step UI & Module Load Order` connect `index.html — App Shell, Step UI & Module Load Order` to `DEBUGGING.md — Debugging Guide (Eligibility Code Generator)`, `workExp.js`, `eduValidations.js`, `eligibility.js`, `emit.js`, `eduQryArrays.js`, `helpers.js`, `state.js`, `colorFilter.js`, `ui.js`, `dimensions.js`, `eduConfig.js`, `buildPostsRange`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `App`, `Legacy`, `fs` to the rest of the system?**
  _123 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.legacy.js` be split into smaller, more focused modules?**
  _Cohesion score 0.075990675990676 - nodes in this community are weakly interconnected._
- **Should `run_qry.js` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `ui.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08735150244584207 - nodes in this community are weakly interconnected._