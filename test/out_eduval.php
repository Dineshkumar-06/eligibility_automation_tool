<?PHP
function checkDOPassing($field_number,$row_name,$col_name){
	global $errmsgarr,$LANG,$arrGraduation_Stream_cond1,$arrGraduation_Stream_cond2,$arrGraduation_Stream_cond3,$arrGraduation_Stream,$arrPG_Stream_cond1,$arrPG_Stream_cond2,$arrPG_Stream,$arrPhD_Stream;

	$errmsg = '';
	$field_yr = $_POST['selyr'.$field_number];
	$field_mon = $_POST['selmonth'.$field_number];
	$field_day = $_POST['selday'.$field_number];		

	if( strtotime(QUALIFICATION_AS_ON_YEAR.'-'.QUALIFICATION_AS_ON_MONTH.'-'.QUALIFICATION_AS_ON_DAY) > strtotime(date('Y-m-d')) ){
		$QUALIFICATION_AS_ON_YEAR1 = date('Y');
		$QUALIFICATION_AS_ON_MONTH1 = date('m');
		$QUALIFICATION_AS_ON_DAY1 = date('d');
	}else{
		$QUALIFICATION_AS_ON_YEAR1 = QUALIFICATION_AS_ON_YEAR;
		$QUALIFICATION_AS_ON_MONTH1 = QUALIFICATION_AS_ON_MONTH;
		$QUALIFICATION_AS_ON_DAY1 = QUALIFICATION_AS_ON_DAY;
	}	

	$postcode = $_POST['postcode'];
	$recrtmnt_mode = $_POST['recrtmnt_mode'];

	 if($_POST['postcode'] == '01' && $_POST['recrtmnt_mode'] == '01'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['minimum_five_years_regular']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['minimum_five']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['minimum_three_years_regular']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') && 
			($_POST['minimum_three']=='Y') 
		) {
			if($field_number == 9){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '01' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['not_less_than_five']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['not_less']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '02' && $_POST['recrtmnt_mode'] == '01'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['minimum_five_years_regular_2']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['minimum_five_years_regular']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['minimum_three_years_regular_2']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') && 
			($_POST['minimum_three_years_regular']=='Y') 
		) {
			if($field_number == 9){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '02' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['not_less_than_five_2']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['not_less_than_five']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '03' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '04' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '05' && $_POST['recrtmnt_mode'] == '01'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['minimum_three_years_regular_3']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '05' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['minimum_five_years_experience']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '06' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['possess_ms']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '07' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '08' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '09' && $_POST['recrtmnt_mode'] == '01'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['minimum_three_years_regular']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') && 
			($_POST['minimum_three']=='Y') 
		) {
			if($field_number == 9){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['minimum_five_years_regular']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['minimum_five']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond3[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['minimum_seven_years_regular']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '09' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['not_less_than_five_3']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') && 
			($_POST['not_less_than_five']=='Y') 
		) {
			if($field_number == 9){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '10' && $_POST['recrtmnt_mode'] == '01'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['minimum_three_years_regular_4']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream9']!='' && array_key_exists($_POST['selstream9'], $arrPhD_Stream[$postcode][$recrtmnt_mode]) && $_POST['selgrade9'] !='') && 
			($_POST['minimum_three_years_regular']=='Y') 
		) {
			if($field_number == 9){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond1[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['minimum_five_years_regular_3']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond2[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['minimum_five_years_regular']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream_cond3[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['minimum_seven_years_regular_2']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '10' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['not_less']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '11' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['not_less_than_five_4']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '12' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '13' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '14' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['three_years']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '15' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['not_less_than_three']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '16' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '17' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['possess_g_c_certificate']=='Y') && 
			($_POST['not_less_than_five']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '18' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['possess_g_c_certificate_2']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '19' && $_POST['recrtmnt_mode'] == '01'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['minimum_three_years_regular']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['minimum_five_years_regular_4']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '19' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['selstream4']!='' && array_key_exists($_POST['selstream4'], $arrPG_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark4'] > 0 && $_POST['selgrade4'] !='') && 
			($_POST['minimum_three_years_experience']=='Y') 
		) {
			if($field_number == 3 || $field_number == 4){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '20' && $_POST['recrtmnt_mode'] == '01'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['minimum_three_years_regular']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '21' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['not_less_than_three']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '22' && $_POST['recrtmnt_mode'] == '01'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['possess_ms']=='Y') && 
			($_POST['minimum_three_years_regular_8']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '23' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['possess_ms']=='Y') && 
			($_POST['minimum_three_years_experience']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '24' && $_POST['recrtmnt_mode'] == '01'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['possess_ms']=='Y') && 
			($_POST['minimum_three_years_regular']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '24' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['possess_ms']=='Y') && 
			($_POST['minimum_three_years_experience']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '25' && $_POST['recrtmnt_mode'] == '01'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['possess_ms']=='Y') && 
			($_POST['minimum_three_years_regular_9']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['minimum_five']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '25' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['possess_ms']=='Y') && 
			($_POST['possess_g']=='Y') && 
			($_POST['not_less_than_three_2']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '26' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selstream3']!='' && array_key_exists($_POST['selstream3'], $arrGraduation_Stream[$postcode][$recrtmnt_mode]) && $_POST['selmark3'] > 0 && $_POST['selgrade3'] !='') && 
			($_POST['possess_ms']=='Y') && 
			($_POST['possess_g']=='Y') 
		) {
			if($field_number == 3){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else if($_POST['postcode'] == '27' && $_POST['recrtmnt_mode'] == '02'){
		if(
			($_POST['selmark1'] > 0 && $_POST['selgrade1'] !='') 
		) {
			if($field_number == 1){
				$QUALIFICATION_AS_ON_YEAR = $QUALIFICATION_AS_ON_YEAR1;
				$QUALIFICATION_AS_ON_MONTH = $QUALIFICATION_AS_ON_MONTH1;
				$QUALIFICATION_AS_ON_DAY = $QUALIFICATION_AS_ON_DAY1;
			}else{ 
				$QUALIFICATION_AS_ON_YEAR = date('Y');
				$QUALIFICATION_AS_ON_MONTH = date('m');
				$QUALIFICATION_AS_ON_DAY = date('d');
			}
		} else{ 
			$QUALIFICATION_AS_ON_YEAR = date('Y');
			$QUALIFICATION_AS_ON_MONTH = date('m');
			$QUALIFICATION_AS_ON_DAY = date('d');
		}	
	} else { 
		$QUALIFICATION_AS_ON_YEAR = date('Y');
		$QUALIFICATION_AS_ON_MONTH = date('m');
		$QUALIFICATION_AS_ON_DAY = date('d');
	}	
 
	
	if($field_yr > $QUALIFICATION_AS_ON_YEAR){
		$errmsg .="$LANG[$row_name] $LANG[$col_name] should be as on ".$QUALIFICATION_AS_ON_DAY.".".$QUALIFICATION_AS_ON_MONTH.".".$QUALIFICATION_AS_ON_YEAR.",&nbsp;&nbsp;";
	}
	if($field_yr == $QUALIFICATION_AS_ON_YEAR){
		if($field_mon > $QUALIFICATION_AS_ON_MONTH){
			$errmsg .="$LANG[$row_name] $LANG[$col_name] should be as on ".$QUALIFICATION_AS_ON_DAY.".".$QUALIFICATION_AS_ON_MONTH.".".$QUALIFICATION_AS_ON_YEAR.",&nbsp;&nbsp;";
		}		
		if($field_mon == $QUALIFICATION_AS_ON_MONTH && $field_day > $QUALIFICATION_AS_ON_DAY ){
			$errmsg .="$LANG[$row_name] $LANG[$col_name] should be as on ".$QUALIFICATION_AS_ON_DAY.".".$QUALIFICATION_AS_ON_MONTH.".".$QUALIFICATION_AS_ON_YEAR.",&nbsp;&nbsp;";
		}			
	}
	return $errmsg;
}
?>