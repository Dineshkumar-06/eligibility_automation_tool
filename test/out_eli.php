<?PHP 
	/***********************************************Eligibility Validation ***************************************************************/	

	$postcode = $_POST['postcode'];
	$recrtmnt_mode = $_POST['recrtmnt_mode'];

	if($postcode == '01' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['minimum_five_years_regular']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['minimum_five']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['minimum_three_years_regular']=='Y')
				) ||
				(
					($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
					($_POST['minimum_three']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_five_years_regular'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_five'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_regular'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_phd']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPhD_Stream[$postcode][$recrtmnt_mode])." &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['minimum_five_years_regular'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_five'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_three_years_regular'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=36)){
					$finalsubmit="N";
					$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_three'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=36)){
					$finalsubmit="N";
					$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
	} else if($postcode == '01' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['not_less_than_five']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['not_less']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['not_less_than_five'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['not_less'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
	} else if($postcode == '02' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['minimum_five_years_regular_2']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['minimum_five_years_regular']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['minimum_three_years_regular_2']=='Y')
				) ||
				(
					($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
					($_POST['minimum_three_years_regular']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_five_years_regular_2'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_five_years_regular'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_regular_2'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_phd']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPhD_Stream[$postcode][$recrtmnt_mode])." &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_regular'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['minimum_five_years_regular_2'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_five_years_regular'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_three_years_regular_2'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=36)){
					$finalsubmit="N";
					$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_three_years_regular'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=36)){
					$finalsubmit="N";
					$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
	} else if($postcode == '02' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['not_less_than_five_2']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['not_less_than_five']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five_2'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['not_less_than_five_2'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['not_less_than_five'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
	} else if($postcode == '03' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
	} else if($postcode == '04' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
	} else if($postcode == '05' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['minimum_three_years_regular_3']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_regular_3'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '05' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['minimum_five_years_experience']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_five_years_experience'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=60)){
				$finalsubmit="N";
				$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '06' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['possess_ms']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
	} else if($postcode == '07' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
	} else if($postcode == '08' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
	} else if($postcode == '09' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['minimum_three_years_regular']=='Y')
				) ||
				(
					($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
					($_POST['minimum_three']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['minimum_five_years_regular']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['minimum_five']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond3[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['minimum_seven_years_regular']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_regular'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_phd']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPhD_Stream[$postcode][$recrtmnt_mode])." &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_five_years_regular'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_five'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond3[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_seven_years_regular'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['minimum_seven_years_regular'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=84)){
					$finalsubmit="N";
					$errmsg.="Experience should be 7 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 7 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_five_years_regular'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_five'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_three_years_regular'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=36)){
					$finalsubmit="N";
					$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_three'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=36)){
					$finalsubmit="N";
					$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
	} else if($postcode == '09' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['not_less_than_five_3']=='Y')
				) ||
				(
					($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
					($_POST['not_less_than_five']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five_3'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_phd']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPhD_Stream[$postcode][$recrtmnt_mode])." &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['not_less_than_five_3'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['not_less_than_five'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
	} else if($postcode == '10' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['minimum_three_years_regular_4']=='Y')
				) ||
				(
					($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
					($_POST['minimum_three_years_regular']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['minimum_five_years_regular_3']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['minimum_five_years_regular']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond3[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['minimum_seven_years_regular_2']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_regular_4'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_phd']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPhD_Stream[$postcode][$recrtmnt_mode])." &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_regular'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_five_years_regular_3'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_five_years_regular'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond3[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_seven_years_regular_2'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['minimum_seven_years_regular_2'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=84)){
					$finalsubmit="N";
					$errmsg.="Experience should be 7 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 7 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_five_years_regular_3'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_five_years_regular'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_three_years_regular_4'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=36)){
					$finalsubmit="N";
					$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_three_years_regular'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=36)){
					$finalsubmit="N";
					$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
	} else if($postcode == '10' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['not_less']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=60)){
				$finalsubmit="N";
				$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '11' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['minimum_three_years_regular_5']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = $LANG['edu_minimum_three_years_regular_5'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '11' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['not_less_than_five_4']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five_4'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=60)){
				$finalsubmit="N";
				$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '12' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['minimum_three_years_regular']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = $LANG['edu_minimum_three_years_regular'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '12' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
	} else if($postcode == '13' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
	} else if($postcode == '14' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['minimum_three_years_regular_6']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = $LANG['edu_minimum_three_years_regular_6'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '14' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['three_years']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_three_years'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '15' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['minimum_three_years_regular']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = $LANG['edu_minimum_three_years_regular'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '15' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['not_less_than_three']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_three'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '16' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
	} else if($postcode == '17' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['minimum_three_years_regular_7']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = $LANG['edu_minimum_three_years_regular_7'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '17' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['possess_g_c_certificate']=='Y') &&
					($_POST['not_less_than_five']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_g_c_certificate'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=60)){
				$finalsubmit="N";
				$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '18' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['possess_g_c_certificate_2']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_g_c_certificate_2'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
	} else if($postcode == '19' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['minimum_three_years_regular']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['minimum_five_years_regular_4']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_regular'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_five_years_regular_4'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['minimum_five_years_regular_4'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_three_years_regular'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=36)){
					$finalsubmit="N";
					$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
	} else if($postcode == '19' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['minimum_three_years_experience']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_experience'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '20' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['minimum_three_years_regular']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_regular'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '21' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['not_less_than_three']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_three'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '22' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['possess_ms']=='Y') &&
					($_POST['minimum_three_years_regular_8']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_regular_8'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '23' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['possess_ms']=='Y') &&
					($_POST['minimum_three_years_experience']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_experience'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '24' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['possess_ms']=='Y') &&
					($_POST['minimum_three_years_regular']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_regular'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '24' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['possess_ms']=='Y') &&
					($_POST['minimum_three_years_experience']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_experience'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '25' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['possess_ms']=='Y') &&
					($_POST['minimum_three_years_regular_9']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['minimum_five']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_three_years_regular_9'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_minimum_five'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['minimum_five'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=60)){
					$finalsubmit="N";
					$errmsg.="Experience should be 5 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 5 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
		else if($_POST['minimum_three_years_regular_9'] == 'Y') {
			if(WORK_EXP_ROW_COUNT > 0){
				if(!($_POST['totexp']>=36)){
					$finalsubmit="N";
					$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
					$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
				}else
				{
					$errmsgarr[]='totexp_popup|';
				}
			}
		}
	} else if($postcode == '25' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['possess_ms']=='Y') &&
					($_POST['possess_g']=='Y') &&
					($_POST['not_less_than_three_2']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_g'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_three_2'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if(WORK_EXP_ROW_COUNT > 0){
			if(!($_POST['totexp']>=36)){
				$finalsubmit="N";
				$errmsg.="Experience should be 3 years Or Above &nbsp;&nbsp;<br/>";
				$errmsgarr[]='totexp_popup|Experience should be 3 years Or Above &nbsp;&nbsp;';
			}else
			{
				$errmsgarr[]='totexp_popup|';
			}
		}
	} else if($postcode == '26' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['possess_ms']=='Y') &&
					($_POST['possess_g']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_g'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
	} else if($postcode == '27' && $recrtmnt_mode == '02') {
		if(! 
			(
				(
					($_POST['selmark1'] > 0 && $_POST['selgrade1'] !='')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_ssc']." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
	}
?>