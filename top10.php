<?php	
    if ( isset($_REQUEST['get_top_10']) )
    {
		$top10array = getTop10();
		print json_encode($top10array);
		return false ;
    }		
	
    if ( isset($_POST['save_top_10']) )
    {
    	$counterFile 		= "top10.txt";
		$top10array 		= array();
		$top10array_temp 	= getTop10();
		$score 				= preg_replace("/[^A-Za-z0-9?!]/", "", $_POST['save_top_10']);
		$nick 				= preg_replace("/[^A-Za-z0-9?!]/", "", $_POST['nick']);
		$theIndex			= 0;
		
		if(strlen($nick) < 4 && strlen($score) < 4)
		{
			foreach($top10array_temp as $i => $value)
			{
				if($score > $value[1])
				{
					$theIndex++;
				}
			};
			
			$theIndex = 10 - $theIndex;
			$temp_array = array();

			foreach($top10array_temp as $a => $value)
			{		
				if($a < $theIndex) { $temp_array[$a] = $top10array_temp[$a]; }
				if($a == $theIndex){ $temp_array[$a] = array($nick, $score); }
				if($a > $theIndex) { $temp_array[$a] = $top10array_temp[$a - 1]; }	
			}
			
			$string_to_be_written = "";
			for($w = 0; $w < 10; $w++)
			{
				$string_to_be_written .= $temp_array[$w][0] . ":" . $temp_array[$w][1];
				if($w < 9) { $string_to_be_written .= "|";}
			} 
			
			if ( ( $counter = @file_get_contents($counterFile) ) === false ) die('Error : file counter does not exist') ;
			file_put_contents($counterFile, $string_to_be_written);
			print json_encode($temp_array);		
		}
	
		return false ;
    }		
	
	function getTop10()
	{
		$counterFile = "top10.txt";
		$top10array = array();
		if ( ( $counter = @file_get_contents($counterFile) ) === false ) die('Error : file counter does not exist') ;
		$top10array_temp = explode("|", $counter);
		foreach($top10array_temp as $i => $value)
		{
			array_push($top10array, explode(":", $value));
		}	
		return $top10array;
	}
?>
