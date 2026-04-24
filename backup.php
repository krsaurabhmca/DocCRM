<?php
require_once 'db.php';
session_start();

if (!isset($_SESSION['admin_id'])) {
    die("Unauthorized access.");
}

$filename = "doccrm_backup_" . date("Y-m-d_H-i-s") . ".sql";
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $filename . '"');

// Simple SQL Export logic
$tables = ['categories', 'diseases', 'patients', 'patient_categories', 'patient_diseases', 'campaigns', 'campaign_categories', 'message_queue', 'message_logs', 'reminders', 'followups', 'admins'];

foreach ($tables as $table) {
    // Drop table
    echo "DROP TABLE IF EXISTS `$table`;\n";
    
    // Create table
    $res = mysqli_query($conn, "SHOW CREATE TABLE `$table`");
    $row = mysqli_fetch_row($res);
    echo $row[1] . ";\n\n";
    
    // Data
    $res = mysqli_query($conn, "SELECT * FROM `$table`");
    while ($row = mysqli_fetch_assoc($res)) {
        $keys = array_keys($row);
        $values = array_values($row);
        $values = array_map(function($v) use ($conn) {
            if ($v === null) return "NULL";
            return "'" . mysqli_real_escape_string($conn, $v) . "'";
        }, $values);
        
        echo "INSERT INTO `$table` (`" . implode("`, `", $keys) . "`) VALUES (" . implode(", ", $values) . ");\n";
    }
    echo "\n\n";
}
exit;
?>
