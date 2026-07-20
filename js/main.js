/* Eligibility Code Generator — main.js (bootstrap)
   Wires the App.* handlers to window (for inline onclick/oninput in index.html)
   and attaches the file-input / drag-and-drop listeners. Loaded last.
   Logic is unchanged from the original single-file version's tail. */
(function(App){
  // ── imports from App ──
  var goStep = App.goStep;
  var updOv = App.updOv;
  var updDimVar = App.updDimVar;
  var updBilingual = App.updBilingual;
  var updApEnable = App.updApEnable;
  var updApLevel = App.updApLevel;
  var updApField = App.updApField;
  var updIntEnable = App.updIntEnable;
  var updIntField = App.updIntField;
  var switchTab = App.switchTab;
  var copyCode = App.copyCode;
  var dlFile = App.dlFile;
  var dlZip = App.dlZip;
  var onFileChange = App.onFileChange;
  var openPostCompare = App.openPostCompare;
  var closePostCompare = App.closePostCompare;
  var runPostCompare = App.runPostCompare;
  var openExamAliasRef = App.openExamAliasRef;
  var closeExamAliasRef = App.closeExamAliasRef;
  var S = App.S;

window.goStep=goStep;window.updOv=updOv;window.updDimVar=updDimVar;window.updBilingual=updBilingual;window.switchTab=switchTab;
window.updApEnable=updApEnable;window.updApLevel=updApLevel;window.updApField=updApField;
window.updIntEnable=updIntEnable;window.updIntField=updIntField;
window.copyCode=copyCode;window.dlFile=dlFile;window.dlZip=dlZip;
window.openPostCompare=openPostCompare;window.closePostCompare=closePostCompare;window.runPostCompare=runPostCompare;
window.openExamAliasRef=openExamAliasRef;window.closeExamAliasRef=closeExamAliasRef;

document.getElementById('file-in').addEventListener('change',onFileChange);
hljs.configure({ignoreUnescapedHTML:true});
var ua=document.getElementById('upload-area');
ua.addEventListener('dragover',function(e){e.preventDefault();ua.classList.add('drag');});
ua.addEventListener('dragleave',function(){ua.classList.remove('drag');});
ua.addEventListener('drop',function(e){
  e.preventDefault();ua.classList.remove('drag');
  var f=e.dataTransfer.files[0];if(f) onFileChange({target:{files:[f]}});
});

// Warn before reload/close once a file has been parsed — everything (parsed
// posts, step-2 config, generated previews) lives only in memory and would be
// lost. Browsers show their own generic message; the string here is ignored by
// modern browsers but required to trigger the native prompt at all.
window.addEventListener('beforeunload',function(e){
  var hasWork=(S.posts&&S.posts.length)||(S.internalCandidate&&S.internalCandidate.posts&&S.internalCandidate.posts.length);
  if(!hasWork) return;
  e.preventDefault();
  e.returnValue='';
});
})(window.App = window.App || {});
