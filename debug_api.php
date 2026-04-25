<?php
require_once 'db.php';
require_once 'api/index.php';

// Fetch Settings
$res = mysqli_query($conn, "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('whatsapp_api_key', 'whatsapp_from_number')");
$settings = [];
while($r = mysqli_fetch_assoc($res)) $settings[$r['setting_key']] = $r['setting_value'];

$apiKey = $settings['whatsapp_api_key'] ?? '';
$from = $settings['whatsapp_from_number'] ?? '';

$to = "919431426600"; // User's test number
$templateName = "greeting"; // Let's try greeting or generic_update
$params = ["Patient", "Test Message", "Our Clinic"];

$url = "https://api.aoc-portal.com/v1/whatsapp";

$payload = [
    "from" => $from,
    "to" => $to,
    "templateName" => $templateName,
    "type" => "template",
    "components" => [
        "body" => ["params" => $params]
    ],
    "campaignName" => "Debug_Test"
];

echo "URL: $url\n";
echo "Payload: " . json_encode($payload) . "\n";
echo "API Key: " . substr($apiKey, 0, 5) . "...\n";

$ch = curl_init($url);
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
?>
