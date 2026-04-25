<?php
function sendWhatsAppTemplate()
{
    $apiUrl = "https://api.aoc-portal.com/v1/whatsapp";
    $apiKey = "3z10SlLux0yUF3lG5JbH7JP0FM08FO";
    $mediaUrl = "https://offerplant.com/img/hero-img-1.png";
    $payload = [
        "from" => "+919162941999",
        "campaignName" => "api-test2",
        "to" => "+919431426600",
        "templateName" => "info_update_43",
        "components" => [
            "body" => [
                "params" => ["Patient", "Test Message", "DocCRM Clinic"]
            ]
        ],
        "type" => "template"
    ];

    // Add header image if provided
    if (!empty($mediaUrl)) {
        $payload["components"]["header"] = [
            "type" => "image",
            "image" => [
                "link" => "https://offerplant.com/img/hero-img-1.png"
            ]
        ];
    }

    $ch = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL => $apiUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "apikey: $apiKey"
        ],
    ]);

    $response = curl_exec($ch);

    if (curl_errno($ch)) {
        return [
            "status" => false,
            "error" => curl_error($ch)
        ];
    }

    curl_close($ch);

    return [
        "status" => true,
        "response" => json_decode($response, true)
    ];
}

print_r(sendWhatsAppTemplate());