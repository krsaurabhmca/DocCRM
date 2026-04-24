<?php
// CRON SCRIPT - Run this script every minute via server cron or task scheduler
// Example: * * * * * php /c/xampp/htdocs/doccrm/cron.php

require_once 'db.php';

// WhatsApp API Config (Replace with actual credentials)
$api_token = "YOUR_WHATSAPP_API_TOKEN";
$phone_id = "YOUR_PHONE_NUMBER_ID";
$api_url = "https://graph.facebook.com/v17.0/$phone_id/messages";

// Find pending messages or failed ones that need retry (max 3 retries)
$sql = "SELECT q.*, p.phone FROM message_queue q 
        JOIN patients p ON q.patient_id = p.id 
        WHERE (q.status = 'Pending' OR (q.status = 'Failed' AND q.retry_count < 3)) 
        AND q.scheduled_for <= NOW() 
        LIMIT 20";
$result = mysqli_query($conn, $sql);

while ($row = mysqli_fetch_assoc($result)) {
    $q_id = $row['id'];
    $phone = $row['phone'];
    $message = $row['message'];
    $media_url = $row['media_url'];
    $campaign_id = $row['campaign_id'];
    $patient_id = $row['patient_id'];
    $retry_count = $row['retry_count'];

    // Mark as Processing
    mysqli_query($conn, "UPDATE message_queue SET status = 'Processing' WHERE id = $q_id");

    // ==========================================
    // MODULE 5: WHATSAPP BUSINESS API INTEGRATION
    // ==========================================
    
    // Prepare Data
    $data = [
        "messaging_product" => "whatsapp",
        "to" => $phone,
        "type" => "text",
        "text" => ["body" => $message]
    ];

    // If media exists, handle based on file type (simplified for text in this example)
    // In production, you'd upload media to FB first or use a hosted URL
    if ($media_url) {
        // Logic for image/video sending would go here
    }

    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $api_token",
        "Content-Type: application/json"
    ]);

    // For simulation if credentials are placeholders
    if ($api_token == "YOUR_WHATSAPP_API_TOKEN") {
        $response = json_encode(["success" => true, "msg" => "Simulated success"]);
        $http_code = 200;
    } else {
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    }

    $res_data = json_decode($response, true);
    $api_success = ($http_code == 200);
    $error_msg = $api_success ? "" : ($res_data['error']['message'] ?? "Unknown API Error");

    if ($api_success) {
        mysqli_query($conn, "UPDATE message_queue SET status = 'Sent', last_error = NULL WHERE id = $q_id");
        $log_status = 'Sent';
    } else {
        $new_retry = $retry_count + 1;
        $err_safe = mysqli_real_escape_string($conn, $error_msg);
        mysqli_query($conn, "UPDATE message_queue SET status = 'Failed', retry_count = $new_retry, last_error = '$err_safe' WHERE id = $q_id");
        $log_status = 'Failed';
    }

    // Insert into Message Logs (Module 8)
    $camp_val = $campaign_id ? $campaign_id : "NULL";
    $msg_safe = mysqli_real_escape_string($conn, $message);
    $err_safe = mysqli_real_escape_string($conn, $error_msg);
    mysqli_query($conn, "INSERT INTO message_logs (patient_id, campaign_id, message, status, error_msg) VALUES ($patient_id, $camp_val, '$msg_safe', '$log_status', '$err_safe')");
}

// Update Campaign Status based on Queue
mysqli_query($conn, "UPDATE campaigns c SET status = 'Completed' WHERE status = 'Processing' AND NOT EXISTS (SELECT 1 FROM message_queue q WHERE q.campaign_id = c.id AND q.status IN ('Pending', 'Processing'))");

echo "Cron processed successfully at " . date('Y-m-d H:i:s');
?>
