<?PHP 
	/***********************************************Eligibility Validation ***************************************************************/	

	$postcode = $_POST['postcode'];
	$recrtmnt_mode = $_POST['recrtmnt_mode'];

	if($postcode == '01' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['min_five_regular_service_sub']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['min_five_regular_service_sub']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['min_three_regular_service_sub']=='Y')
				) ||
				(
					($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
					($_POST['min_three_regular_service_sub']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_five_regular_service_sub'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_five_regular_service_sub'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_regular_service_sub'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_phd']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPhD_Stream[$postcode][$recrtmnt_mode])." &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_regular_service_sub'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['min_five_regular_service_sub'] == 'Y') {
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
		else if($_POST['min_three_regular_service_sub'] == 'Y') {
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
					($_POST['not_less_than_five_edu']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['not_less_than_five_edu']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five_edu'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five_edu'].' Should be Yes&nbsp;&nbsp;';

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
	} else if($postcode == '02' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['min_five_regular_service_officer']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['min_five_regular_service_officer']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['min_three_regular_service_officer']=='Y')
				) ||
				(
					($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
					($_POST['min_three_regular_service_officer']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_five_regular_service_officer'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_five_regular_service_officer'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_regular_service_officer'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_phd']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPhD_Stream[$postcode][$recrtmnt_mode])." &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_regular_service_officer'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['min_five_regular_service_officer'] == 'Y') {
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
		else if($_POST['min_three_regular_service_officer'] == 'Y') {
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
					($_POST['not_less_than_five_environment']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['not_less_than_five_environment']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five_environment'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five_environment'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['min_three_regular_service_assistant']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_regular_service_assistant'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['min_five_it_managerial']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_five_it_managerial'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['possess_ms_cit_cert']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms_cit_cert'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['min_three_regular_service_scientific']=='Y')
				) ||
				(
					($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
					($_POST['min_three_regular_service_scientific']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['min_five_regular_service_scientific']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['min_five_regular_service_scientific']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond3[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['min_seven_regular_service_officers']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_regular_service_scientific'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_phd']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPhD_Stream[$postcode][$recrtmnt_mode])." &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_regular_service_scientific'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_five_regular_service_scientific'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_five_regular_service_scientific'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond3[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_seven_regular_service_officers'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['min_seven_regular_service_officers'] == 'Y') {
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
		else if($_POST['min_five_regular_service_scientific'] == 'Y') {
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
		else if($_POST['min_three_regular_service_scientific'] == 'Y') {
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
					($_POST['not_less_than_five_laboratory']=='Y')
				) ||
				(
					($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
					($_POST['not_less_than_five_laboratory']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five_laboratory'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_phd']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPhD_Stream[$postcode][$recrtmnt_mode])." &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five_laboratory'].' Should be Yes&nbsp;&nbsp;';

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
	} else if($postcode == '10' && $recrtmnt_mode == '01') {
		if(! 
			(
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['min_three_regular_service_junior']=='Y')
				) ||
				(
					($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
					($_POST['min_three_regular_service_junior']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
					($_POST['min_five_regular_service_junior']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['min_five_regular_service_junior']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond3[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['min_seven_regular_service_junior']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_regular_service_junior'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_phd']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPhD_Stream[$postcode][$recrtmnt_mode])." &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_regular_service_junior'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_five_regular_service_junior'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_five_regular_service_junior'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream_cond3[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_seven_regular_service_junior'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['min_seven_regular_service_junior'] == 'Y') {
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
		else if($_POST['min_five_regular_service_junior'] == 'Y') {
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
		else if($_POST['min_three_regular_service_junior'] == 'Y') {
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
					($_POST['not_less_than_five_laboratory']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five_laboratory'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['min_three_regular_service_2']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = $LANG['edu_min_three_regular_service_2'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['not_less_than_five_qualifications']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five_qualifications'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['min_three_regular_service_laboratory']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = $LANG['edu_min_three_regular_service_laboratory'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['min_three_regular_service_3']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = $LANG['edu_min_three_regular_service_3'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['three_years_practical_court']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_three_years_practical_court'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['min_three_regular_service_legal']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = $LANG['edu_min_three_regular_service_legal'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['not_less_than_three_practical']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_three_practical'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['min_three_regular_service_4']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = $LANG['edu_min_three_regular_service_4'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['possess_g_c_cert_120']=='Y') &&
					($_POST['not_less_than_five_2']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_g_c_cert_120'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_five_2'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['possess_g_c_cert_80']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_g_c_cert_80'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['min_three_regular_service_5']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['min_five_regular_service_assistant']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_regular_service_5'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_five_regular_service_assistant'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['min_five_regular_service_assistant'] == 'Y') {
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
		else if($_POST['min_three_regular_service_5'] == 'Y') {
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
					($_POST['min_three_supervisory_capacity']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_pg']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrPG_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_supervisory_capacity'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['min_three_regular_service_head']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_regular_service_head'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['not_less_than_three_supervisory']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_three_supervisory'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['possess_ms_cit_cert']=='Y') &&
					($_POST['min_three_regular_service_senior']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms_cit_cert'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_regular_service_senior'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['possess_ms_cit_cert']=='Y') &&
					($_POST['min_three_supervisory_capacity_2']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms_cit_cert'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_supervisory_capacity_2'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['possess_ms_cit_cert']=='Y') &&
					($_POST['min_three_regular_service_senior']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms_cit_cert'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_regular_service_senior'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['possess_ms_cit_cert']=='Y') &&
					($_POST['min_three']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms_cit_cert'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['possess_ms_cit_cert']=='Y') &&
					($_POST['min_three_regular_service_6']=='Y')
				) ||
				(
					($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
					($_POST['min_five_regular_service_2']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms_cit_cert'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_three_regular_service_6'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br><br> OR <br/><br/>";
			$Elig_errmsg .= "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_min_five_regular_service_2'].' Should be Yes&nbsp;&nbsp;';

			$errmsg.=$Elig_errmsg;
			$errmsgarr[]='eligibility|'.$Elig_errmsg;

		}else
		{
			$errmsgarr[]='eligibility|';
		}
		if($_POST['min_five_regular_service_2'] == 'Y') {
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
		else if($_POST['min_three_regular_service_6'] == 'Y') {
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
					($_POST['possess_ms_cit_cert']=='Y') &&
					($_POST['possess_g_c_cert_2']=='Y') &&
					($_POST['not_less_than_three_accounts']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms_cit_cert'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_g_c_cert_2'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_not_less_than_three_accounts'].' Should be Yes&nbsp;&nbsp;';

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
					($_POST['possess_ms_cit_cert']=='Y') &&
					($_POST['possess_g_c_cert_2']=='Y')
				)
			)
		)
		{

			$finalsubmit="N";

			$Elig_errmsg = "Please select ".$LANG['edu_lbl_graduation']." &nbsp;&nbsp; ".$LANG['edu_lbl_subject']." = ".implode(" / ", $arrGraduation_Stream[$postcode][$recrtmnt_mode])." ,&nbsp;&nbsp; ".$LANG['edu_lbl_mark']." > 0 % ,&nbsp;&nbsp;  &nbsp;&nbsp; ".$LANG['edu_lbl_grade']." = Any Class &nbsp;&nbsp;";
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_ms_cit_cert'].' Should be Yes&nbsp;&nbsp;';
			$Elig_errmsg .= "&nbsp;&nbsp;<br> AND <br/>";
			$Elig_errmsg .= $LANG['edu_possess_g_c_cert_2'].' Should be Yes&nbsp;&nbsp;';

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