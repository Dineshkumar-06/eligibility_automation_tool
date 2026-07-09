# Eligibility Code Generator

A browser-based tool that parses an Eligibility Criteria Excel file and generates the
corresponding PHP files (`edu_config.php`, `eligibity_validation.php`,
`edu_details_lang.php`, `edu_validations.php`, `work_exp_details_validations.php`).

This was originally a single self-contained `test.html`. It has been split into a
conventional static-site layout, then the JavaScript was further organised into
functional modules — with **no changes to the logic**. Every function body is
byte-for-byte identical to the original; the code was only wrapped so each file
attaches its functions to a shared global `App` object.

## Project structure

```
.
├── index.html              # Page markup; loads css + the js modules in order
├── css/
│   └── styles.css          # Styles (was the inline <style> block)
├── js/
│   ├── core/
│   │   ├── constants.js     # EDU levels, mark/grade ops, post-qual timestamp map
│   │   ├── state.js         # shared state object `S` + tiny utils (ind/escH/getOv…)
│   │   └── dimensions.js    # dimension/axis descriptors (Stream, Degree, …)
│   ├── parsing/
│   │   ├── helpers.js       # column detection, level/mark/grade/subject parsing
│   │   ├── buildPosts.js    # rows -> post/condition tree (parseFile, buildPosts)
│   │   ├── streams.js       # stream-key registry, condition-name annotation
│   │   └── colorFilter.js   # cell-color based row filtering
│   ├── generators/
│   │   ├── emit.js          # array-emit helpers + edu_details_lang.php
│   │   ├── eduConfig.js     # edu_config.php
│   │   ├── eligibility.js   # eligibity_validation.php + cond/error builders
│   │   ├── eduValidations.js# edu_validations.php
│   │   ├── eduQryArrays.js  # SQL query array generation
│   │   ├── internalBranch.js# internal-candidate branch logic
│   │   └── workExp.js       # work_exp_details_validations.php
│   ├── ui/
│   │   └── ui.js            # steps 1-3 rendering, preview, download, navigation
│   ├── main.js              # bootstrap: window.* handlers + event listeners (load last)
│   └── app.legacy.js        # pre-split single-IIFE version (reference only, not loaded)
```

### How the modules fit together

All files share one global object, `window.App`. Each module:

1. opens with `(function(App){ … })(window.App = window.App || {})`,
2. pulls the names it needs into locals (`var EDU = App.EDU;` …),
3. contains the original function bodies unchanged,
4. exports the functions it defines (`App.genEduConfig = genEduConfig;` …).

`index.html` loads them in dependency order (constants → state → parsing →
generators → ui → main). `main.js` runs last and re-publishes the click/input
handlers to `window` so the inline `onclick=`/`oninput=` attributes keep working.

The split was verified by an equivalence test: parsing the same rows and running
all five generators through both the original and the modular code produced
byte-identical output (including the base64-embedded `work_exp_details_validations.php`
template).

## Running

Open `index.html` in a browser. The third-party libraries (SheetJS/xlsx,
highlight.js, JSZip) are loaded from CDN, so an internet connection is required.

Because the page references `css/` and `js/` via relative paths, opening it directly
from the filesystem works in most browsers. If your browser blocks local file access,
serve the folder over HTTP, e.g.:

```
python -m http.server 8000
```

then visit <http://localhost:8000/>.
