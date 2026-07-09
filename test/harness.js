// Node test harness: loads the browser App.* modules (core + parsing + generators)
// without a DOM, so we can run buildPosts + generators on row arrays directly.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const files = [
  'js/core/constants.js',
  'js/core/state.js',
  'js/core/dimensions.js',
  'js/parsing/helpers.js',
  'js/parsing/buildPosts.js',
  'js/parsing/streams.js',
  'js/generators/emit.js',
  'js/generators/eduQryArrays.js',
  'js/generators/eduConfig.js',
  'js/generators/eligibility.js',
  'js/generators/eduValidations.js',
  'js/generators/workExp.js',
  'js/generators/internalBranch.js',
];

const sandbox = { window: {}, atob: (b) => Buffer.from(b, 'base64').toString('binary'), XLSX: {}, console };
sandbox.global = sandbox;
vm.createContext(sandbox);
for (const f of files) {
  const code = fs.readFileSync(path.join(root, f), 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
}
module.exports = sandbox.window.App;
