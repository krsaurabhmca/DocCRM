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
$payload = [
    "from" => $from,
    "to" => $to,
    "templateName" => "greeting",
    "type" => "template",
    "components" => [
        "body" => ["params" => ["Test Patient", "Debug Message", "DocCRM Clinic"]]
    ],
    "campaignName" => "Debug_Test"
];

$ch = curl_init("https://api.aoc-portal.com/v1/whatsapp");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'apikey: ' . $apiKey
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";
echo "Final Status: " . (($httpCode >= 200 && $httpCode < 300) ? "Success" : "Failed") . "\n";
?>
