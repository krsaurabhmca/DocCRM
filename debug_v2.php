<?php
define('INTERNAL_ACCESS', true);
require_once 'db.php';
require_once 'api/index.php';

echo "Security Bypass Active\n";

$res = mysqli_query($conn, "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('whatsapp_api_key', 'whatsapp_from_number', 'whatsapp_header_image')");
$settings = [];
while($r = mysqli_fetch_assoc($res)) $settings[$r['setting_key']] = $r['setting_value'];

$apiKey = $settings['whatsapp_api_key'] ?? '';
$from = $settings['whatsapp_from_number'] ?? '';
$headerImage = $settings['whatsapp_header_image'] ?? '';

echo "API Key length: " . strlen($apiKey) . "\n";
echo "From: $from\n";
echo "Default Header: $headerImage\n";

// Test a real number
$to = "919431426600";
$success = send_aoc_whatsapp($to, "greeting", ["Test Patient", "Debug Message", "DocCRM Clinic"]);

echo "Final Status: " . ($success ? "Success" : "Failed") . "\n";
?>
