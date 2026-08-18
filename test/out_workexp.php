  	
if(POST_QUALIFICATION_EXP){
/*  switch($_POST['postcode']){
		default:
			$eduday =$_POST['selday3'];
		    $edumonth=$_POST['selmonth3'];//-Change the variable initialization as per the requirement;
			$eduyear=$_POST['selyr3'];//-Change the variable initialization as per the requirement;	
			$exp_msg_content = 'Educational qualification date of passing ';
		break;
	} */

	$postcode = $_POST['postcode'];
	$recrtmnt_mode = $_POST['recrtmnt_mode'];
	$ssctimeStr = strtotime($_POST['selyr1'].'-'.$_POST['selmonth1'].'-'.$_POST['selday1']);
	$graduationtimeStr = strtotime($_POST['selyr3'].'-'.$_POST['selmonth3'].'-'.$_POST['selday3']);
	$pggraduationtimeStr = strtotime($_POST['selyr4'].'-'.$_POST['selmonth4'].'-'.$_POST['selday4']);
	$phdtimeStr = strtotime($_POST['selyr9'].'-'.$_POST['selmonth9'].'-'.$_POST['selday9']);

	if($postcode == '01' && $recrtmnt_mode == '01') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['min_five_regular_service_sub']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['min_five_regular_service_sub']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['min_three_regular_service_sub']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}

		if(
			($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
			($_POST['min_three_regular_service_sub']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $phdtimeStr;
		}
	}

	else if($postcode == '01' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['not_less_than_five_edu']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['not_less_than_five_edu']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}
	}

	else if($postcode == '02' && $recrtmnt_mode == '01') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['min_five_regular_service_officer']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['min_five_regular_service_officer']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['min_three_regular_service_officer']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}

		if(
			($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
			($_POST['min_three_regular_service_officer']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $phdtimeStr;
		}
	}

	else if($postcode == '02' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['not_less_than_five_environment']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['not_less_than_five_environment']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}
	}

	else if($postcode == '03' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}
	}

	else if($postcode == '04' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '05' && $recrtmnt_mode == '01') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['min_three_regular_service_assistant']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '05' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['min_five_it_managerial']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '06' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['possess_ms_cit_cert']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '07' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '08' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '09' && $recrtmnt_mode == '01') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['min_three_regular_service_scientific']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}

		if(
			($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
			($_POST['min_three_regular_service_scientific']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $phdtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['min_five_regular_service_scientific']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['min_five_regular_service_scientific']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond3[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['min_seven_regular_service_officers']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '09' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['not_less_than_five_laboratory']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}

		if(
			($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
			($_POST['not_less_than_five_laboratory']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $phdtimeStr;
		}
	}

	else if($postcode == '10' && $recrtmnt_mode == '01') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['min_three_regular_service_junior']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}

		if(
			($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') &&
			($_POST['min_three_regular_service_junior']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $phdtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['min_five_regular_service_junior']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['min_five_regular_service_junior']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond3[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['min_seven_regular_service_junior']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '10' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['not_less_than_five_laboratory']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}
	}

	else if($postcode == '11' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['not_less_than_five_qualifications']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}
	}

	else if($postcode == '12' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '13' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '14' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['three_years_practical_court']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '15' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['not_less_than_three_practical']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '16' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '17' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['possess_g_c_cert_120']=='Y') &&
			($_POST['not_less_than_five_2']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '18' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['possess_g_c_cert_80']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '19' && $recrtmnt_mode == '01') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['min_three_regular_service_5']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['min_five_regular_service_assistant']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '19' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') &&
			($_POST['min_three_supervisory_capacity']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $pggraduationtimeStr;
		}
	}

	else if($postcode == '20' && $recrtmnt_mode == '01') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['min_three_regular_service_head']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '21' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['not_less_than_three_supervisory']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '22' && $recrtmnt_mode == '01') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['possess_ms_cit_cert']=='Y') &&
			($_POST['min_three_regular_service_senior']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '23' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['possess_ms_cit_cert']=='Y') &&
			($_POST['min_three_supervisory_capacity_2']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '24' && $recrtmnt_mode == '01') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['possess_ms_cit_cert']=='Y') &&
			($_POST['min_three_regular_service_senior']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '24' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['possess_ms_cit_cert']=='Y') &&
			($_POST['min_three']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '25' && $recrtmnt_mode == '01') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['possess_ms_cit_cert']=='Y') &&
			($_POST['min_three_regular_service_6']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}

		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['min_five_regular_service_2']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '25' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['possess_ms_cit_cert']=='Y') &&
			($_POST['possess_g_c_cert_2']=='Y') &&
			($_POST['not_less_than_three_accounts']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '26' && $recrtmnt_mode == '02') {
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') &&
			($_POST['possess_ms_cit_cert']=='Y') &&
			($_POST['possess_g_c_cert_2']=='Y')
		) {
			$eligibilityPostQualidtArr[]  = $graduationtimeStr;
		}
	}

	else if($postcode == '27' && $recrtmnt_mode == '02') {
		if(
			($_POST['selmark1'] > 0 && $_POST['selgrade1'] !='')
		) {
			$eligibilityPostQualidtArr[]  = $ssctimeStr;
		}
	}
if(is_array($eligibilityPostQualidtArr)){
		if(count($eligibilityPostQualidtArr) > 0){
		$postQualifiMin = min($eligibilityPostQualidtArr);
		$postQualifiMinDt = date('Y-m-d',$postQualifiMin);
		$postQualifiMinDtArr = explode("-",$postQualifiMinDt);
		
		$eduday = $postQualifiMinDtArr[2];
		$edumonth = $postQualifiMinDtArr[1];
		$eduyear = $postQualifiMinDtArr[0];
		$exp_msg_content = 'Educational qualification date of passing ';
	}
	}

}else{
	$edumonth = $dobmonth;//dob month
	$eduyear = $dobyear;//dob month
	$exp_msg_content = 'Date Of Birth ';
}