// Unit tests for parsing/colorFilter.js — RED = "removed" detection.
// Loads only the colorFilter module in a vm sandbox (it depends on nothing but
// App + optional JSZip), then drives its pure core with hand-built OOXML.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sandbox = { window: {}, console, Set, Map, Promise };
sandbox.global = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/parsing/colorFilter.js'), 'utf8'),
                sandbox, { filename: 'colorFilter.js' });
const App = sandbox.window.App;

let fails = 0;
function ok(cond, msg){ console.log((cond?'  ok  ':'  FAIL') + ' — ' + msg); if(!cond) fails++; }
function eq(a, b, msg){ ok(a===b, msg + '  (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }

// ── isRedish heuristic (shade tolerance) ──────────────────────────────────
console.log('\n== isRedish ==');
ok(App._isRedish('FFFF0000'), 'pure red FFFF0000');
ok(App._isRedish('FF0000'),   'pure red FF0000');
ok(App._isRedish('FFFF3300'), 'red-orange FF3300');
ok(App._isRedish('C00000'),   'dark red C00000');
ok(!App._isRedish('FFFFFF00'),'yellow FFFF00 is NOT red');
ok(!App._isRedish('FFC000'),  'orange FFC000 is NOT red');
ok(!App._isRedish('FF000000'),'black is NOT red');
ok(!App._isRedish(null),      'null is NOT red');
ok(App._isRedish('D99694'),   'muted rose D99694 (Excel "Red, Accent 2, Lighter 40%") IS red');
ok(App._isRedish('800000'),   'dark maroon 800000 IS red');
ok(!App._isRedish('D2B48C'),  'tan D2B48C is NOT red');
ok(!App._isRedish('4F81BD'),  'theme blue 4F81BD is NOT red');
ok(!App._isRedish('FFFFFF'),  'white is NOT red');

// ── computeFilter over a hand-built workbook ───────────────────────────────
const styles =
  '<styleSheet>'+
  '<fonts count="2"><font><sz val="11"/><color theme="1"/><name val="Calibri"/></font>'+
  '<font><b/><strike/><color rgb="FFFF0000"/><name val="Calibri"/></font></fonts>'+
  '<fills count="4"><fill><patternFill patternType="none"/></fill>'+
  '<fill><patternFill patternType="gray125"/></fill>'+
  '<fill><patternFill patternType="solid"><fgColor rgb="FFFF0000"/><bgColor indexed="64"/></patternFill></fill>'+
  '<fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill></fills>'+
  '<cellXfs count="4">'+
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'+
  '<xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyFill="1"/>'+
  '<xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1"/></cellXfs>'+
  '</styleSheet>';

const shared =
  '<sst count="3" uniqueCount="3">'+
  '<si><t>Keep me</t></si>'+
  '<si><r><t>Electrical</t></r><r><rPr><strike/><color rgb="FFFF0000"/></rPr><t xml:space="preserve"> / Electronics</t></r></si>'+
  '<si><r><rPr><color rgb="FFFF0000"/></rPr><t>Deleted</t></r></si>'+
  '</sst>';

const sheet =
  '<worksheet><sheetData>'+
  '<row r="1">'+
    '<c r="A1" s="0" t="s"><v>0</v></c>'+   // normal -> keep
    '<c r="B1" s="1" t="s"><v>0</v></c>'+   // red FONT on plain str -> whole red
    '<c r="C1" s="2" t="s"><v>0</v></c>'+   // red FILL -> whole red
    '<c r="D1" s="3" t="s"><v>0</v></c>'+   // yellow fill -> keep
  '</row>'+
  '<row r="2">'+
    '<c r="A2" s="0" t="s"><v>1</v></c>'+   // partial red rich -> clean to black text
    '<c r="B2" s="0" t="s"><v>2</v></c>'+   // all-red rich -> whole red
    '<c r="C2" s="0"><v>5</v></c>'+         // numeric, no colour -> keep
  '</row>'+
  '</sheetData></worksheet>';

console.log('\n== computeFilter ==');
const rf = App._computeRedFilter(styles, '', shared, sheet);
ok(rf.redCells.has('0,1'), 'B1 red font -> removed');
ok(rf.redCells.has('0,2'), 'C1 red fill -> removed');
ok(rf.redCells.has('1,1'), 'B2 all-red rich -> removed');
ok(!rf.redCells.has('0,0'), 'A1 normal -> kept');
ok(!rf.redCells.has('0,3'), 'D1 yellow fill -> kept');
eq(rf.cleanText.get('1,0'), 'Electrical', 'A2 partial red -> keeps black "Electrical"');
ok(!rf.cleanText.has('1,1'), 'B2 not in cleanText (fully red)');
eq(rf.count, 4, 'count = 3 red cells + 1 cleaned');

// ── applyRedFilter mutates the flattened rows correctly ────────────────────
console.log('\n== applyRedFilter ==');
const rows = [
  ['Keep me', 'Keep me', 'Keep me', 'Keep me'],
  ['Electrical / Electronics', 'Deleted', '5']
];
App.applyRedFilter(rows, rf, {r0:0, c0:0});
eq(rows[0][0], 'Keep me',   'A1 untouched');
eq(rows[0][1], '',          'B1 blanked');
eq(rows[0][2], '',          'C1 blanked');
eq(rows[0][3], 'Keep me',   'D1 untouched');
eq(rows[1][0], 'Electrical','A2 cleaned to black text');
eq(rows[1][1], '',          'B2 blanked');
eq(rows[1][2], '5',         'C2 numeric untouched');

// ── origin offset (rows[0][0] maps to a non-A1 spreadsheet cell) ───────────
console.log('\n== applyRedFilter with range origin ==');
const rows2 = [['x','y']];               // rows[0][0] == spreadsheet C3 (r0=2,c0=2)
const rf2 = { redCells:new Set(['2,3']), cleanText:new Map(), count:1 }; // D3
App.applyRedFilter(rows2, rf2, {r0:2, c0:2});
eq(rows2[0][0], 'x', 'C3 untouched');
eq(rows2[0][1], '',  'D3 blanked via origin offset');

console.log('\n' + (fails ? ('FAILED: ' + fails + ' assertion(s)') : 'ALL COLOR TESTS PASSED'));
process.exit(fails ? 1 : 0);
