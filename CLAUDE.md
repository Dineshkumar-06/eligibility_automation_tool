# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A browser-based, static-site tool (no build step, no framework, no bundler) that parses an
Eligibility Criteria Excel file and generates PHP output files: `edu_config.php`,
`eligibity_validation.php`, `edu_details_lang.php`, `edu_validations.php`,
`work_exp_details_validations.php`.

It was originally a single self-contained `test.html` / `js/app.legacy.js`, later split into
`js/core|parsing|generators|ui` modules with **no logic changes** — every function body is
byte-for-byte identical to the original. `js/app.legacy.js` is kept only as a golden reference
for backward-compat regression tests; it is not loaded by `index.html`.

## Running the app

Open `index.html` directly in a browser, or serve it (some browsers block local file access):

```
python -m http.server 8000
```

Third-party libs (SheetJS/xlsx, highlight.js, JSZip) load from CDN — an internet connection is
required.

## Testing

There is no test framework (no jest/mocha) and no `npm test` script — tests are plain Node
scripts under `test/`, run directly with `node`. They print diffs/assertions to stdout and
`process.exit(1)` on failure; some also write `test/out_*.php` for manual inspection.

`test/harness.js` loads the current modular `js/*` files into a Node `vm` sandbox (no DOM) and
exports the reconstructed `window.App`. `test/harness.legacy.js` does the same for
`js/app.legacy.js` (the pre-refactor golden reference), with a couple of in-memory patches
documented inline so it's a fair baseline for backward-compat comparison.

Regression gate (run after any change to `parsing/` or `generators/`):
```
node test/run.js && node test/run3d.js && node test/run_qry.js && node test/run_issues.js
```

Other targeted suites — run individually as needed:
- `node test/compat.js` — byte-identical output vs `app.legacy.js` on a 1-D (legacy) sheet
- `node test/run_internal.js` — Internal/Departmental Candidate feature (separator detection, branched generators, singleton-leak guard)
- `node test/run_ap.js` — Appeared/Passed "highest qualification only" relaxation
- `node test/run_color.js` — `parsing/colorFilter.js` red-cell detection (unit-level, hand-built OOXML)
- `node test/run_degree.js` — separate Degree-column axis handling
- `node test/run_marks.js` — mark/grade/category condition parsing
- `node test/run_radio.js` — Yes/No radio-question detection robustness
- `node test/run_we_mixed.js` — per-OR-group work-exp requirement gated on its own radio when it differs from other branches (vs. staying unconditional when uniform)
- `node test/run_subject_other_equivalent.js` — the `01`/`99` sentinel keys in the global subject/degree registry (`streams.js` `getGlobalKey`) only match a cell whose ENTIRE value is "Others"/"Equivalent", not any longer value that merely contains that word

## Architecture

The app is a **3-step pipeline**, and almost every bug maps to one folder:

```
Excel file → [parsing/] → posts[] (condition tree) → [generators/] → 5 PHP strings → [ui/] → screen
```

`core/` holds the shared vocabulary (`EDU` levels, `MARK_OPS`, the `S` state object, `ind`/`escH`
helpers) that both parsing and generators depend on. `main.js` loads last and just wires up
`window.*` click/input handlers.

**The one debugging question that matters:** is `App.S.posts` correct? If not, the bug is in
`parsing/`; if `posts[]` is right but the PHP is wrong, the bug is in `generators/`.

`posts[]` shape: a list of **posts**, each with one or more **OR-groups**, each OR-group with a
list of **conditions** (`type: "edu"` or `type: "radio"`). See `DEBUGGING.md` ("The Big Picture")
for the full annotated shape.

### Module wiring

All files attach to one shared global, `window.App`: each opens with
`(function(App){ … })(window.App = window.App || {})`, pulls what it needs into locals, and
exports its functions back onto `App`. `index.html` loads modules in dependency order —
`core → parsing → generators → ui → main` — so import/export order in a new file must respect
that chain. `DEBUGGING.md` ("Module wiring at a glance") has the full per-file import/export
table; consult it before moving a function between files.

### Internal / Departmental Candidate feature

When enabled and the sheet has a separator row, the pipeline runs **twice**, producing two
parallel `posts[]` arrays (`S.posts` and `S.internalCandidate.posts`) plus two schema snapshots
(`ctx`). Branched generators (`generators/internalBranch.js`) must wrap every inner-emitter call
in `withCtx(ctx, fn)` to avoid schema leaking between the two branches — see
`DEBUGGING.md` § "Feature: Internal / Departmental Candidate Support" for the exact failure
signatures (duplicate boilerplate, wrong schema, junk post counts) and their fixes.

### Where to look for a given change

`DEBUGGING.md` § "Quick reference: I want to change X" maps common change requests (new edu
level, new mark threshold, subject-splitting fix, column-detection fix, new PHP output
structure, UI change) directly to the responsible file/function — check it before searching.

## Knowledge graph (graphify)

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and
cross-file relationships.

- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json`
  exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"`
  for focused concepts. These return a scoped subgraph, usually much smaller than
  `GRAPH_REPORT.md` or raw grep output.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source
  browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when
  query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API
  cost).
