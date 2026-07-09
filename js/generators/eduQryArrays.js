/* Eligibility Code Generator — module: generators/eduQryArrays.js
   Two outputs built from the SAME radio-button metadata every other generator uses:
     1. $arrAdditionSection  — appended to the END of edu_config.php (see eduConfig.js).
        The list of eligibility radio-button POST field names, always terminated by
        "revision" (and "revision" is present even when there are no radio fields).
     2. edu_qry_arrays.sql   — one ALTER TABLE statement per radio field, adding the
        corresponding ENUM('Y','N') column to `educational_details`. No statement for
        "revision".

   This generator does NOT re-parse the sheet. It reuses the radio-button metadata:
   each post's radio conditions (getAllRadios) resolved to their final PHP field name
   (rFn) — the very name buildCondLine emits as $_POST['<field>']. Work-experience
   radios and additional-eligibility radios are plain radio conditions too, so they
   participate automatically.
   Part of the namespaced App.* module set. */
(function(App){
  // ── imports from App ──
  var getAllRadios = App.getAllRadios;
  var rFn = App.rFn;
  var ind = App.ind;

  // Collect every generated radio-button field name across all posts, de-duplicated,
  // in deterministic first-seen order (posts in order, OR-groups in order). This mirrors
  // exactly the fields buildCondLine emits as $_POST['<field>'] — including work-exp and
  // additional-eligibility radios, since those are ordinary radio conditions. It is the
  // SINGLE source of truth shared by $arrAdditionSection and the SQL ALTER statements.
  function collectRadioFields(posts){
    var seen={},out=[];
    for(var pi=0;pi<posts.length;pi++){
      var post=posts[pi];
      var radios=getAllRadios(post);
      for(var ri=0;ri<radios.length;ri++){
        var f=rFn(radios[ri],post.postcode);
        if(!f||seen[f]) continue;
        seen[f]=true;
        out.push(f);
      }
    }
    return out;
  }

  // The $arrAdditionSection literal, appended to edu_config.php. All radio field names
  // in deterministic order, then "revision" ALWAYS last (and always present, even with
  // zero radio fields). Indented one level to match edu_config.php's body.
  function arrAdditionSection(posts){
    var fields=collectRadioFields(posts);
    var o=ind(1)+'$arrAdditionSection=array(\n';
    for(var i=0;i<fields.length;i++) o+=ind(2)+'"'+fields[i]+'",\n';
    o+=ind(2)+'"revision"\n';
    o+=ind(1)+');\n';
    return o;
  }

  // One ALTER statement per field. Structure is fixed (ENUM('Y','N'), latin1 / swedish).
  function alterStmt(field){
    return 'ALTER TABLE `educational_details`\n'
         + 'ADD `'+field+'`\n'
         + "ENUM('Y','N')\n"
         + 'CHARACTER SET latin1\n'
         + 'COLLATE latin1_swedish_ci\n'
         + 'NULL DEFAULT NULL;';
  }

  // edu_qry_arrays.sql — one ALTER per radio field, none for "revision". Returns '' when
  // there are no radio fields (no SQL file is produced in that case; see ui.js).
  function genEduQrySql(posts){
    var fields=collectRadioFields(posts);
    if(!fields.length) return '';
    var parts=[];
    for(var i=0;i<fields.length;i++) parts.push(alterStmt(fields[i]));
    return parts.join('\n\n')+'\n';
  }

  // ── exports to App ──
  App.collectRadioFields = collectRadioFields;
  App.arrAdditionSection = arrAdditionSection;
  App.genEduQrySql = genEduQrySql;
})(window.App = window.App || {});
