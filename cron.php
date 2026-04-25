<?php
/**
 * DocCRM Background Message Processor (Cron Job)
 * Run this every minute via crontab: * * * * * php /path/to/doccrm/cron.php
 */

define('INTERNAL_ACCESS', true);
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/api/index.php'; // Reuse send_aoc_whatsapp function

// Prevent multiple cron instances
$lock_file = __DIR__ . '/cron.lock';
if (file_exists($lock_file) && (time() - filemtime($lock_file) < 60)) {
    die("Cron is already running.\n");
}
touch($lock_file);

// Fetch 5 pending messages from the queue
$now = date('Y-m-d H:i:s');
$res = mysqli_query($conn, "SELECT * FROM message_queue WHERE status = 'Pending' AND scheduled_at <= '$now' LIMIT 5");

echo "Processing queue at " . $now . "...\n";

while ($row = mysqli_fetch_assoc($res)) {
    $id = $row['id'];
    mysqli_query($conn, "UPDATE message_queue SET status = 'Processing' WHERE id = $id");

    $variables = json_decode($row['variables'], true);
    
    $result = send_aoc_whatsapp(
        $row['to_number'],
        $row['template_name'],
        $variables,
        $row['header_type'],
        $row['media_url']
    );

    if ($result['success']) {
        mysqli_query($conn, "UPDATE message_queue SET status = 'Sent', processed_at = NOW() WHERE id = $id");
        echo "Sent to " . $row['to_number'] . "\n";
    } else {
        $error = mysqli_real_escape_string($conn, $result['response']);
        mysqli_query($conn, "UPDATE message_queue SET status = 'Failed', error_message = '$error' WHERE id = $id");
        echo "Failed for " . $row['to_number'] . "\n";
    }
}

unlink($lock_file);
echo "Done.\n";
