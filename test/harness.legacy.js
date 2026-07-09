// Loads the PRE-REFACTOR app.legacy.js (golden reference) in Node, exposing its
// internal generator functions. We truncate the DOM-bootstrap tail and inject an
// export of the functions we need to compare against.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
let code = fs.readFileSync(path.join(root, 'js/app.legacy.js'), 'utf8');

// Cut everything from the window.* bootstrap onward (DOM access) and re-close the IIFE
// after exporting the functions under test.
const cut = code.indexOf('window.goStep=goStep');
code = code.slice(0, cut);

// The modular code carries two parser fixes that post-date app.legacy.js. To make
// app.legacy.js a faithful baseline for the *modular* (pre-N-dim) behaviour, apply
// the same fixes in-memory here so any remaining diff is purely the N-dim refactor:
//   (1) work-exp must RESET per new post (no inheritance from the previous post).
code = code.replace(
  "    if(G){var gv=parseWE(G);if(gv) curWeMonths=gv;}\n\n    var isNumSrno",
  "    var isNumSrno"
);
// re-insert the reset just after isNewPost is computed (mirrors modular buildPosts)
code = code.replace(
  /(var isNewPost=isNumSrno[\s\S]*?cur\.postName\)\);\n)/,
  "$1    if(isNewPost) curWeMonths=(G?parseWE(G):null)||0;\n    else if(G){var gv=parseWE(G);if(gv) curWeMonths=gv;}\n"
);
//   (2) capture an inline radio question that sits on the post's FIRST row (the
//       modular buildPosts added this; app.legacy.js routed straight to matchLevel).
code = code.replace(
  "      var inlineLvl=matchLevel(C);",
  "      if(C&&(C.indexOf('?')>=0||/yes\\s*[\\/\\\\]\\s*no/i.test(C))){\n" +
  "        var fdI=deriveField(C);\n" +
  "        grp.conditions.push({type:'radio',question:C,fieldName:fdI.fn,langKey:fdI.lk,ri:ri,status:fdI.amb?'warn':'ok'});\n" +
  "        continue;\n" +
  "      }\n" +
  "      var inlineLvl=matchLevel(C);"
);
code += '\nwindow.__legacy={buildPosts:buildPosts,getStreamData:getStreamData,genEduConfig:genEduConfig,genEligibility:genEligibility,genEduValidations:genEduValidations,genWorkExpDetails:genWorkExpDetails};\n})();\n';

// app.legacy.js embeds a slightly different WE_TAIL constant (a leading newline +
// 8-space indent) than the modular workExp.js (which re-encoded it with tabs). That
// is a pre-existing constant difference, not part of the N-dim refactor — align the
// legacy WE_TAIL to the modular one so the comparison isolates the refactor.
const modWE = fs.readFileSync(path.join(root, 'js/generators/workExp.js'), 'utf8');
const modTail = modWE.match(/WE_TAIL ?= ?atob\('([^']*)'\)/)[1];
code = code.replace(/(WE_TAIL ?= ?atob\(')[^']*(')/, '$1' + modTail + '$2');

// NOTE: app.legacy.js is an OLDER snapshot than the modular code. Two further
// modular eduConfig features post-date it and are intentionally NOT back-ported
// here, so the edu_config comparison shows a small, fully-explained residual diff:
//   (3) the Others-placeholder arrays  array('01'=>'Others') for uncovered posts;
//   (4) optional-radio detection emitting 'Y,N' / 'Should be Yes or No'.
// Both are modular features the N-dim refactor faithfully preserves; eligibility,
// edu_validations and work_exp_details_validations remain byte-identical.

const sandbox = { window: {}, atob: (b) => Buffer.from(b, 'base64').toString('binary'), XLSX: {}, console };
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'app.legacy.js' });
module.exports = sandbox.window.__legacy;
