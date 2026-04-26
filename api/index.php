<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');

date_default_timezone_set('Asia/Kolkata');

require_once dirname(__DIR__) . '/db.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

// Simple API Key security
$api_key = "DOC_CRM_API_SECRET_2026";
$received_key = $_SERVER['HTTP_X_API_KEY'] ?? $_REQUEST['api_key'] ?? '';

// Handle cases where headers might be prefixed differently in some environments
if (!$received_key) {
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $received_key = $headers['X-API-KEY'] ?? $headers['x-api-key'] ?? '';
    }
}

// Bypass security for internal scripts (like cron.php)
if (!defined('INTERNAL_ACCESS')) {
    if ($received_key !== $api_key) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized API Access']);
        exit;
    }
}

// Determine Clinic ID and Doctor ID from Token
$token = $_SERVER['HTTP_X_TOKEN'] ?? $_REQUEST['token'] ?? '';
$clinic_id = 0;
$doctor_id = 0; // If logged in as a specific doctor
if ($token) {
    $token_data = json_decode(base64_decode($token), true);
    if ($token_data) {
        $clinic_id = isset($token_data['clinic_id']) ? (int)$token_data['clinic_id'] : 0;
        $doctor_id = isset($token_data['doctor_id']) ? (int)$token_data['doctor_id'] : 0;
    }
}

// If not provided in token, check session (for web-based API calls if any)
if (!$clinic_id && isset($_SESSION['clinic_id'])) {
    $clinic_id = $_SESSION['clinic_id'];
}

$action = $_GET['action'] ?? '';

// For actions that require authentication, ensure clinic_id is set
$public_actions = ['send_otp', 'verify_otp', 'clinic_signup', 'login_password'];
if ($action && !in_array($action, $public_actions) && !$clinic_id) {
    // If it's a cron access, it might have internal access defined
    if (!defined('INTERNAL_ACCESS')) {
        echo json_encode(['success' => false, 'message' => 'Clinic identification failed. Please re-login.']);
        exit;
    }
}

// AOC Portal WhatsApp Helper
function send_aoc_whatsapp($to, $templateName, $params = [], $headerType = 'none', $mediaUrl = '')
{
    global $conn, $clinic_id;

    // 🔹 Fetch Settings
    $res = mysqli_query($conn, "SELECT setting_key, setting_value FROM app_settings 
        WHERE clinic_id = $clinic_id AND setting_key IN (
            'whatsapp_enabled', 
            'whatsapp_api_key', 
            'whatsapp_from_number', 
            'clinic_name', 
            'clinic_address', 
            'whatsapp_header_image',
            'whatsapp_default_template'
        )");

    $settings = [];
    while ($r = mysqli_fetch_assoc($res)) {
        $settings[$r['setting_key']] = $r['setting_value'];
    }

    if (($settings['whatsapp_enabled'] ?? '0') !== '1') {
        return ['success' => false, 'error' => 'WhatsApp disabled'];
    }

    $apiKey = $settings['whatsapp_api_key'] ?? '';
    $from = $settings['whatsapp_from_number'] ?? '';
    $templateName = $settings['whatsapp_default_template'] ?? 'info_update_43';
    $clinicInfo = trim(($settings['clinic_name'] ?? '') . " " . ($settings['clinic_address'] ?? ''));
    $headerImage = $settings['whatsapp_header_image'] ?? '';

    // 🔹 Fallback to default template if none provided
    // if (empty($templateName)) {
    //     $templateName = $defaultTpl;
    // }

    if (!$apiKey || !$from) {
        return ['success' => false, 'error' => 'Missing API key or sender'];
    }

    // 🔹 Clean Phone Number
    $to = preg_replace('/[^0-9]/', '', $to);
    if (strlen($to) == 10) {
        $to = '+91' . $to;
    } else {
        $to = '+' . ltrim($to, '+');
    }

    // 🔹 Ensure Params (exact 3 variables)
    if (!is_array($params)) {
        $params = [];
    }

    $params = array_values($params);
    $params = array_pad($params, 3, '');
    $params[2] = $clinicInfo;

    // 🔹 Default Header Image
    if ($headerType === 'none' && !empty($headerImage)) {
        $headerType = 'image';
        $mediaUrl = $headerImage;
    }

    // 🔹 Build Components
    $components = [
        "body" => [
            "params" => $params
        ]
    ];

    if ($headerType !== 'none' && !empty($mediaUrl)) {

        if (!filter_var($mediaUrl, FILTER_VALIDATE_URL)) {
            return ['success' => false, 'error' => 'Invalid media URL'];
        }

        if ($headerType === 'image') {
            $components["header"] = [
                "type" => "image",
                "image" => ["link" => $mediaUrl]
            ];
        } elseif ($headerType === 'video') {
            $components["header"] = [
                "type" => "video",
                "video" => ["link" => $mediaUrl]
            ];
        } elseif ($headerType === 'document') {
            $components["header"] = [
                "type" => "document",
                "document" => [
                    "link" => $mediaUrl,
                    "filename" => "Document"
                ]
            ];
        }
    }

    // 🔹 Payload
    $payload = [
        "from" => $from,
        "to" => $to,
        "templateName" => $templateName,
        "type" => "template",
        "components" => $components,
        "campaignName" => "DocCRM_" . date('Ymd_His')
    ];

    $url = "https://api.aoc-portal.com/v1/whatsapp";

    // 🔹 CURL Request
    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "apikey: $apiKey"
        ],
        CURLOPT_TIMEOUT => 30
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    // 🔹 CURL Error Handling
    if (curl_errno($ch)) {
        return [
            'success' => false,
            'error' => curl_error($ch)
        ];
    }

    curl_close($ch);

    // 🔹 Decode Response
    $resData = json_decode($response, true);

    $success = ($httpCode >= 200 && $httpCode < 300);

    // 🔹 Debug Log (VERY IMPORTANT)
    file_put_contents(
        "whatsapp_log.txt",
        date('Y-m-d H:i:s') . "\n" .
        "Payload: " . json_encode($payload) . "\n" .
        "Response: " . $response . "\n\n",
        FILE_APPEND
    );

    // 🔹 Safe Patient Lookup
    $phone = mysqli_real_escape_string($conn, substr($to, -10));
    $p_res = mysqli_fetch_assoc(mysqli_query($conn, "SELECT id FROM patients WHERE phone LIKE '%$phone%' AND clinic_id = $clinic_id"));

    if ($p_res) {
        $p_id = $p_res['id'];
        $msg = mysqli_real_escape_string($conn, json_encode($payload));
        $status = $success ? 'Sent' : 'Failed';

        mysqli_query($conn, "INSERT INTO message_logs (clinic_id, patient_id, message, status) 
                            VALUES ($clinic_id, $p_id, '$msg', '$status')");
    }

    return [
        'success' => $success,
        'httpCode' => $httpCode,
        'response' => $resData ?: $response
    ];
}

if ($action) {
    switch ($action) {
        case 'send_otp':
            $phone = mysqli_real_escape_string($conn, $_POST['phone'] ?? '');
            if (!$phone) {
                echo json_encode(['success' => false, 'message' => 'Phone number required']);
                break;
            }

            // 🔹 Check if account exists in doctors table
            $phone_clean = substr(preg_replace('/[^0-9]/', '', $phone), -10);
            $check = mysqli_query($conn, "SELECT id, clinic_id FROM doctors WHERE phone LIKE '%$phone_clean%' LIMIT 1");

            if (mysqli_num_rows($check) == 0) {
                echo json_encode(['success' => false, 'message' => 'No Account found. Please contact administrator.']);
                break;
            }
            $doc_row = mysqli_fetch_assoc($check);
            $doc_clinic_id = $doc_row['clinic_id'];
            $doc_id = $doc_row['id'];

            $otp = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
            mysqli_query($conn, "INSERT INTO login_otps (clinic_id, doctor_id, phone, otp) VALUES ($doc_clinic_id, $doc_id, '$phone', '$otp')");

            // Send via WhatsApp
            $params = ["Login OTP", "Your login OTP for DocCRM is $otp. Please do not share it with anyone.", "DocCRM Security"];
            $res = send_aoc_whatsapp($phone, '', $params); // empty template uses default fallback

            echo json_encode(['success' => true, 'message' => 'OTP sent successfully']);
            break;

        case 'verify_otp':
            $phone = mysqli_real_escape_string($conn, $_POST['phone'] ?? '');
            $otp = mysqli_real_escape_string($conn, $_POST['otp'] ?? '');

            if (!$phone || !$otp) {
                echo json_encode(['success' => false, 'message' => 'Phone and OTP required']);
                break;
            }

            $result = mysqli_query($conn, "SELECT id, clinic_id, doctor_id FROM login_otps WHERE phone = '$phone' AND otp = '$otp' AND status = 'Pending' AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE) ORDER BY id DESC LIMIT 1");
            if ($row = mysqli_fetch_assoc($result)) {
                $id = $row['id'];
                $verified_clinic_id = $row['clinic_id'];
                $verified_doc_id = $row['doctor_id'];
                mysqli_query($conn, "UPDATE login_otps SET status = 'Verified' WHERE id = $id");

                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'token' => base64_encode(json_encode(['phone' => $phone, 'clinic_id' => $verified_clinic_id, 'doctor_id' => $verified_doc_id, 'time' => time()])),
                    'phone' => $phone,
                    'clinic_id' => $verified_clinic_id,
                    'doctor_id' => $verified_doc_id
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid or expired OTP']);
            }
            break;
        case 'get_stats':
            $p_where = "clinic_id = $clinic_id" . ($doctor_id ? " AND doctor_id = $doctor_id" : "");
            $patients = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM patients WHERE $p_where"))['cnt'];
            $campaigns = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM campaigns WHERE clinic_id = $clinic_id AND status IN ('Scheduled', 'Processing')"))['cnt'];
            $f_where = "clinic_id = $clinic_id AND status = 'Scheduled'" . ($doctor_id ? " AND doctor_id = $doctor_id" : "");
            $followups = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM followups WHERE $f_where"))['cnt'];

            echo json_encode([
                'success' => true,
                'data' => [
                    'total_patients' => (int) $patients,
                    'active_campaigns' => (int) $campaigns,
                    'pending_followups' => (int) $followups
                ]
            ]);
            break;

        case 'get_patients':
            $search = mysqli_real_escape_string($conn, $_GET['search'] ?? '');
            $where = "WHERE clinic_id = $clinic_id";
            if ($doctor_id) {
                $where .= " AND doctor_id = $doctor_id";
            }
            if ($search) {
                $where .= " AND (name LIKE '%$search%' OR phone LIKE '%$search%' OR address LIKE '%$search%')";
            }
            $result = mysqli_query($conn, "SELECT * FROM patients $where ORDER BY name ASC LIMIT 50");
            $data = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $data[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'get_patient':
            $id = (int) $_GET['id'];
            $where = "id = $id AND clinic_id = $clinic_id" . ($doctor_id ? " AND doctor_id = $doctor_id" : "");
            $result = mysqli_query($conn, "SELECT * FROM patients WHERE $where");
            $patient = mysqli_fetch_assoc($result);
            if ($patient) {
                // Get Category IDs
                $cats_res = mysqli_query($conn, "SELECT category_id FROM patient_categories WHERE patient_id = $id");
                $patient['category_ids'] = [];
                while ($c = mysqli_fetch_assoc($cats_res)) {
                    $patient['category_ids'][] = (int) $c['category_id'];
                }

                // Get Category Names (for display)
                $cats_names = mysqli_query($conn, "SELECT c.name FROM categories c JOIN patient_categories pc ON c.id = pc.category_id WHERE pc.patient_id = $id");
                $patient['categories'] = [];
                while ($c = mysqli_fetch_assoc($cats_names))
                    $patient['categories'][] = $c['name'];

                // Get History (Followups - isolated by clinic)
                $hist_res = mysqli_query($conn, "SELECT * FROM followups WHERE patient_id = $id AND clinic_id = $clinic_id ORDER BY followup_date DESC");
                $patient['history'] = [];
                while ($h = mysqli_fetch_assoc($hist_res)) {
                    $patient['history'][] = $h;
                }

                echo json_encode(['success' => true, 'data' => $patient]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Patient not found']);
            }
            break;

        case 'get_categories':
            $result = mysqli_query($conn, "SELECT c.*, (SELECT COUNT(*) FROM patient_categories pc JOIN patients p ON pc.patient_id = p.id WHERE pc.category_id = c.id AND p.clinic_id = $clinic_id) as patient_count FROM categories c WHERE c.clinic_id = $clinic_id ORDER BY name ASC");
            $data = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $data[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'get_campaigns':
            $result = mysqli_query($conn, "SELECT * FROM campaigns WHERE clinic_id = $clinic_id ORDER BY created_at DESC LIMIT 50");
            $data = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $data[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'get_diseases':
            $result = mysqli_query($conn, "SELECT * FROM diseases WHERE clinic_id = $clinic_id ORDER BY name ASC");
            $data = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $data[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'save_patient':
            $json = file_get_contents('php://input');
            $input = json_decode($json, true);
            if ($input) {
                $id = isset($input['id']) ? (int) $input['id'] : 0;
                $name = mysqli_real_escape_string($conn, $input['name']);
                $phone = mysqli_real_escape_string($conn, $input['phone']);
                $email = mysqli_real_escape_string($conn, $input['email'] ?? '');
                $gender = mysqli_real_escape_string($conn, $input['gender'] ?? 'Male');
                $father = mysqli_real_escape_string($conn, $input['father_name'] ?? '');
                $age = (int) ($input['age'] ?? 0);
                $age_unit = mysqli_real_escape_string($conn, $input['age_unit'] ?? 'Y');
                $address = mysqli_real_escape_string($conn, $input['address'] ?? '');
                $category_ids = $input['category_ids'] ?? [];

                if ($id == 0) {
                    // Check for Unique (Name + Mobile) for this clinic
                    $check_unique = mysqli_query($conn, "SELECT id FROM patients WHERE name = '$name' AND phone = '$phone' AND clinic_id = $clinic_id");
                    if (mysqli_num_rows($check_unique) > 0) {
                        echo json_encode(['success' => false, 'message' => 'Duplicate Entry: A patient with this Name and Mobile Number is already registered in your clinic.']);
                        exit;
                    }

                    // Check New Patient Limit
                    $max_new = (int) mysqli_fetch_assoc(mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE clinic_id = $clinic_id AND setting_key = 'max_new_patients'"))['setting_value'];
                    if ($max_new > 0) {
                        $today = date('Y-m-d');
                        $current_new = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM patients WHERE clinic_id = $clinic_id AND DATE(created_at) = '$today'"))['cnt'];
                        if ($current_new >= $max_new) {
                            echo json_encode(['success' => false, 'message' => "Daily limit for New Patients reached ($max_new)."]);
                            exit;
                        }
                    }

                    // Generate Unique Patient ID (Mobile + Suffix 0-9)
                    $clean_phone = preg_replace('/[^0-9]/', '', $phone);
                    $check_existing = mysqli_query($conn, "SELECT COUNT(*) as cnt FROM patients WHERE phone = '$phone' AND clinic_id = $clinic_id");
                    $count = mysqli_fetch_assoc($check_existing)['cnt'];

                    if ($count >= 10) {
                        echo json_encode(['success' => false, 'message' => 'Limit Reached: Maximum 10 patients are allowed for a single mobile number.']);
                        exit;
                    }

                    $patient_uid = $clean_phone . $count;
                    $sql = "INSERT INTO patients (clinic_id, patient_uid, name, phone, email, gender, father_name, age, age_unit, address) VALUES ($clinic_id, '$patient_uid', '$name', '$phone', '$email', '$gender', '$father', $age, '$age_unit', '$address')";
                } else {
                    $sql = "UPDATE patients SET name='$name', phone='$phone', email='$email', gender='$gender', father_name='$father', age=$age, age_unit='$age_unit', address='$address' WHERE id=$id AND clinic_id=$clinic_id";
                }

                if (mysqli_query($conn, $sql)) {
                    $patient_id = $id > 0 ? $id : mysqli_insert_id($conn);

                    // Update Categories
                    mysqli_query($conn, "DELETE FROM patient_categories WHERE patient_id = $patient_id");
                    foreach ($category_ids as $cat_id) {
                        $cat_id = (int) $cat_id;
                        mysqli_query($conn, "INSERT INTO patient_categories (patient_id, category_id) VALUES ($patient_id, $cat_id)");
                    }

                    // Auto-add consultation fee to revenue if provided (New Patient)
                    $fee = isset($input['fee']) ? (float) $input['fee'] : 0;
                    $is_today = isset($input['is_today']) && $input['is_today'] == 1;

                    if ($id == 0 && ($fee > 0 || $is_today)) {
                        $today = date('Y-m-d');
                        $type = mysqli_real_escape_string($conn, $input['followup_type'] ?? ($is_today ? 'Today Visit' : 'New Visit'));
                        mysqli_query($conn, "INSERT INTO followups (patient_id, followup_date, followup_type, fee, notes, status) 
                                       VALUES ($patient_id, '$today', '$type', $fee, 'Automatic entry from registration', 'Completed')");
                    }

                    // AOC WhatsApp Integration: Welcome Message
                    if ($id == 0) {
                        $welcome_tpl = mysqli_fetch_assoc(mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE clinic_id = $clinic_id AND setting_key = 'welcome_template'"))['setting_value'] ?? 'welcome_msg';
                        send_aoc_whatsapp($phone, $welcome_tpl, [$name]);
                    }

                    echo json_encode(['success' => true, 'id' => $patient_id]);
                } else {
                    echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
                }
            }
            break;

        case 'delete_patient':
            $id = (int) $_GET['id'];
            if (mysqli_query($conn, "DELETE FROM patients WHERE id = $id AND clinic_id = $clinic_id")) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
            }
            break;

        case 'get_doctors':
            $result = mysqli_query($conn, "SELECT * FROM doctors WHERE clinic_id = $clinic_id ORDER BY name ASC");
            $data = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $data[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'save_doctor':
            $json = file_get_contents('php://input');
            $input = json_decode($json, true);
            if ($input) {
                $id = isset($input['id']) ? (int) $input['id'] : 0;
                $name = mysqli_real_escape_string($conn, $input['name']);
                $spec = mysqli_real_escape_string($conn, $input['specialization'] ?? '');
                $qual = mysqli_real_escape_string($conn, $input['qualification'] ?? '');
                $exp = (int) ($input['experience'] ?? 0);
                $phone = mysqli_real_escape_string($conn, $input['phone'] ?? '');
                $email = mysqli_real_escape_string($conn, $input['email'] ?? '');

                if ($id > 0) {
                    $sql = "UPDATE doctors SET name='$name', specialization='$spec', qualification='$qual', experience=$exp, phone='$phone', email='$email' WHERE id=$id AND clinic_id=$clinic_id";
                } else {
                    $sql = "INSERT INTO doctors (clinic_id, name, specialization, qualification, experience, phone, email) VALUES ($clinic_id, '$name', '$spec', '$qual', $exp, '$phone', '$email')";
                }

                if (mysqli_query($conn, $sql)) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
                }
            }
            break;

        case 'get_category_patients':
            $id = (int) $_GET['id'];
            $result = mysqli_query($conn, "SELECT p.* FROM patients p JOIN patient_categories pc ON p.id = pc.patient_id WHERE pc.category_id = $id AND p.clinic_id = $clinic_id ORDER BY p.name ASC");
            $data = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $data[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'get_campaign_reach':
            $ids = mysqli_real_escape_string($conn, $_GET['category_ids'] ?? '');
            if (!$ids) {
                echo json_encode(['success' => true, 'count' => 0]);
                exit;
            }
            $sql = "SELECT COUNT(DISTINCT pc.patient_id) as cnt FROM patient_categories pc JOIN patients p ON pc.patient_id = p.id WHERE pc.category_id IN ($ids) AND p.clinic_id = $clinic_id";
            $res = mysqli_fetch_assoc(mysqli_query($conn, $sql));
            echo json_encode(['success' => true, 'count' => (int) $res['cnt']]);
            break;

        case 'save_category':
            $json = file_get_contents('php://input');
            $input = json_decode($json, true);
            if ($input) {
                $id = isset($input['id']) ? (int) $input['id'] : 0;
                $name = mysqli_real_escape_string($conn, $input['name']);
                if ($id > 0) {
                    $sql = "UPDATE categories SET name='$name' WHERE id=$id AND clinic_id=$clinic_id";
                } else {
                    $sql = "INSERT INTO categories (clinic_id, name) VALUES ($clinic_id, '$name')";
                }
                if (mysqli_query($conn, $sql)) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
                }
            }
            break;

        case 'save_template':
            $id = (int) ($_POST['id'] ?? 0);
            $name = mysqli_real_escape_string($conn, $_POST['name'] ?? '');
            $type = mysqli_real_escape_string($conn, $_POST['content_type'] ?? 'Text');
            $part1 = mysqli_real_escape_string($conn, $_POST['content_part1'] ?? '');
            $part2 = mysqli_real_escape_string($conn, $_POST['content_part2'] ?? '');
            $part3 = mysqli_real_escape_string($conn, $_POST['content_part3'] ?? '');
            $is_default = (int) ($_POST['is_default'] ?? 0);
            $media_url = $_POST['existing_media'] ?? '';

            // Handle File Upload if exists
            if (isset($_FILES['media']) && $_FILES['media']['error'] == UPLOAD_ERR_OK) {
                $upload_dir = '../uploads/';
                if (!is_dir($upload_dir))
                    mkdir($upload_dir, 0777, true);
                $extension = pathinfo($_FILES['media']['name'], PATHINFO_EXTENSION);
                $filename = 'template_' . uniqid() . '_' . time() . '.' . $extension;
                $target_path = $upload_dir . $filename;
                if (move_uploaded_file($_FILES['media']['tmp_name'], $target_path)) {
                    $media_url = 'uploads/' . $filename;
                }
            }

            if ($name && $part2) {
                if ($is_default == 1) {
                    mysqli_query($conn, "UPDATE templates SET is_default = 0 WHERE clinic_id = $clinic_id");
                }

                if ($id > 0) {
                    $sql = "UPDATE templates SET name='$name', content_type='$type', content_part1='$part1', content_part2='$part2', content_part3='$part3', media_url='$media_url', is_default=$is_default WHERE id=$id AND clinic_id=$clinic_id";
                } else {
                    $sql = "INSERT INTO templates (clinic_id, name, content_type, content_part1, content_part2, content_part3, media_url, is_default) VALUES ($clinic_id, '$name', '$type', '$part1', '$part2', '$part3', '$media_url', $is_default)";
                }

                if (mysqli_query($conn, $sql)) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Name and Content are required']);
            }
            break;

        case 'delete_category':
            $id = (int) $_GET['id'];
            if (mysqli_query($conn, "DELETE FROM categories WHERE id = $id AND clinic_id = $clinic_id")) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
            }
            break;

        case 'delete_campaign':
            $id = (int) $_GET['id'];
            if (mysqli_query($conn, "DELETE FROM campaigns WHERE id = $id AND clinic_id = $clinic_id")) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
            }
            break;

        case 'get_templates':
            $result = mysqli_query($conn, "SELECT * FROM templates WHERE clinic_id = $clinic_id ORDER BY name ASC");
            $data = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $data[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'get_template':
            $id = (int) $_GET['id'];
            $result = mysqli_query($conn, "SELECT * FROM templates WHERE id = $id AND clinic_id = $clinic_id");
            $template = mysqli_fetch_assoc($result);
            if ($template) {
                echo json_encode(['success' => true, 'data' => $template]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Template not found']);
            }
            break;

        case 'get_default_template':
            $result = mysqli_query($conn, "SELECT * FROM templates WHERE is_default = 1 AND clinic_id = $clinic_id LIMIT 1");
            $template = mysqli_fetch_assoc($result);
            if ($template) {
                echo json_encode(['success' => true, 'data' => $template]);
            } else {
                echo json_encode(['success' => false, 'message' => 'No default template set']);
            }
            break;

        case 'delete_template':
            $id = (int) $_GET['id'];
            if (mysqli_query($conn, "DELETE FROM templates WHERE id = $id AND clinic_id = $clinic_id")) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
            }
            break;

        case 'get_daily_reminders':
            $date = mysqli_real_escape_string($conn, $_GET['date'] ?? date('Y-m-d'));
            $result = mysqli_query($conn, "SELECT f.*, p.name as patient_name, p.phone, 
                                       (DATE(p.created_at) = '$date') as is_new 
                                       FROM followups f 
                                       JOIN patients p ON f.patient_id = p.id 
                                       WHERE f.followup_date = '$date' AND f.clinic_id = $clinic_id
                                       ORDER BY f.id ASC");
            $data = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $data[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'delete_followup':
            $id = (int) $_GET['id'];
            if (mysqli_query($conn, "DELETE FROM followups WHERE id = $id AND clinic_id = $clinic_id")) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
            }
            break;

        case 'mark_followup_done':
            $id = (int) $_GET['id'];
            if (mysqli_query($conn, "UPDATE followups SET status = 'Completed' WHERE id = $id AND clinic_id = $clinic_id")) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
            }
            break;

        case 'save_followup':
            $json = file_get_contents('php://input');
            $input = json_decode($json, true);
            if ($input) {
                $patient_id = (int) $input['patient_id'];
                $date = mysqli_real_escape_string($conn, $input['followup_date']);
                $type = mysqli_real_escape_string($conn, $input['followup_type']);
                $fee = (float) ($input['fee'] ?? 0);
                $notes = mysqli_real_escape_string($conn, $input['notes'] ?? '');

                // Check Old Patient Limit
                $max_old = (int) mysqli_fetch_assoc(mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE clinic_id = $clinic_id AND setting_key = 'max_old_patients'"))['setting_value'];
                if ($max_old > 0) {
                    $current_old = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM followups WHERE clinic_id = $clinic_id AND followup_date = '$date'"))['cnt'];
                    if ($current_old >= $max_old) {
                        echo json_encode(['success' => false, 'message' => "Daily limit for Old Patients reached ($max_old) for this date."]);
                        exit;
                    }
                }

                $sql = "INSERT INTO followups (clinic_id, patient_id, followup_date, followup_type, fee, notes) VALUES ($clinic_id, $patient_id, '$date', '$type', $fee, '$notes')";
                if (mysqli_query($conn, $sql)) {
                    // AOC WhatsApp Integration: Appointment Reminder
                    $reminder_tpl = mysqli_fetch_assoc(mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE clinic_id = $clinic_id AND setting_key = 'reminder_template'"))['setting_value'] ?? 'appointment_reminder';
                    $p_data = mysqli_fetch_assoc(mysqli_query($conn, "SELECT name, phone FROM patients WHERE id = $patient_id AND clinic_id = $clinic_id"));
                    if ($p_data) {
                        send_aoc_whatsapp($p_data['phone'], $reminder_tpl, [$p_data['name'], $date, $type]);
                    }

                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
                }
            }
            break;

        case 'get_reminder_counts':
            $result = mysqli_query($conn, "SELECT followup_date as date, COUNT(*) as count FROM followups WHERE clinic_id = $clinic_id GROUP BY followup_date");
            $data = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $data[$row['date']] = [
                    'marked' => true,
                    'dotColor' => '#EA580C',
                    'customStyles' => [
                        'container' => ['backgroundColor' => '#FFF7ED'],
                        'text' => ['color' => '#EA580C', 'fontWeight' => 'bold']
                    ]
                ];
            }
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'start_campaign':
            $category_ids = $_POST['category_ids'] ?? ''; // Comma separated IDs
            $template_id = (int) ($_POST['template_id'] ?? 0);

            if (!$category_ids || !$template_id) {
                echo json_encode(['success' => false, 'message' => 'Missing category or template']);
                exit;
            }

            $template_res = mysqli_query($conn, "SELECT * FROM templates WHERE id = $template_id");
            $template = mysqli_fetch_assoc($template_res);
            if (!$template) {
                echo json_encode(['success' => false, 'message' => 'Template not found']);
                exit;
            }

            $clinic_name = safe_fetch_assoc(mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE clinic_id = $clinic_id AND setting_key = 'clinic_name'"))['setting_value'] ?? '';
            $clinic_address = safe_fetch_assoc(mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE clinic_id = $clinic_id AND setting_key = 'clinic_address'"))['setting_value'] ?? '';
            $clinic_info = "*$clinic_name*\n$clinic_address";

            $sql = "SELECT DISTINCT p.* FROM patients p 
                JOIN patient_categories pc ON p.id = pc.patient_id 
                WHERE pc.category_id IN ($category_ids) AND p.clinic_id = $clinic_id";
            $res = mysqli_query($conn, $sql);
            $count = 0;

            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $base_url = "$protocol://" . $_SERVER['HTTP_HOST'] . str_replace('api/index.php', '', $_SERVER['SCRIPT_NAME']);
            $scheduled_at = date('Y-m-d H:i:s');

            while ($row = mysqli_fetch_assoc($res)) {
                $part1 = str_replace('#Patient Name#', $row['name'], $template['content_part1']);
                $variables = json_encode([
                    $part1,
                    $template['content_part2'],
                    $template['content_part3'] ?: $clinic_info
                ]);

                $mediaUrl = $template['media_url'];
                if ($mediaUrl && !filter_var($mediaUrl, FILTER_VALIDATE_URL)) {
                    $mediaUrl = $base_url . $mediaUrl;
                }

                $to = mysqli_real_escape_string($conn, $row['phone']);
                $type = mysqli_real_escape_string($conn, strtolower($template['content_type']));
                $v_esc = mysqli_real_escape_string($conn, $variables);
                $m_esc = mysqli_real_escape_string($conn, $mediaUrl);

                $defaultTpl = mysqli_fetch_assoc(mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE clinic_id = $clinic_id AND setting_key = 'whatsapp_default_template'"))['setting_value'] ?? 'info_update_43';
                $tpl_name = mysqli_real_escape_string($conn, $template['aoc_template_name'] ?: $defaultTpl);
                $q_sql = "INSERT INTO message_queue (clinic_id, to_number, template_name, variables, header_type, media_url, scheduled_at) 
                      VALUES ($clinic_id, '$to', '$tpl_name', '$v_esc', '$type', '$m_esc', '$scheduled_at')";
                mysqli_query($conn, $q_sql);
                $count++;
            }

            echo json_encode(['success' => true, 'message' => "Campaign queued for $count patients. It will be sent via cron job."]);
            break;

        case 'upload_image':
            if (!isset($_FILES['image'])) {
                echo json_encode(['success' => false, 'message' => 'No image uploaded']);
                exit;
            }

            $file = $_FILES['image'];
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $new_name = 'clinic_' . time() . '.' . $ext;
            $target = '../uploads/' . $new_name;

            if (move_uploaded_file($file['tmp_name'], $target)) {
                $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
                $url = "$protocol://" . $_SERVER['HTTP_HOST'] . str_replace('api/index.php', '', $_SERVER['SCRIPT_NAME']) . 'uploads/' . $new_name;
                echo json_encode(['success' => true, 'url' => $url]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Upload failed']);
            }
            break;

        case 'get_dashboard_stats':
            $p_where = "clinic_id = $clinic_id" . ($doctor_id ? " AND doctor_id = $doctor_id" : "");
            $patients = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM patients WHERE $p_where"))['count'];
            $categories = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM categories WHERE clinic_id = $clinic_id"))['count'];
            $templates = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM templates WHERE clinic_id = $clinic_id"))['count'];

            $today = date('Y-m-d');
            $f_where = "followup_date = '$today' AND clinic_id = $clinic_id" . ($doctor_id ? " AND doctor_id = $doctor_id" : "");
            $reminders = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM followups WHERE $f_where"))['count'];

            // Revenue Today
            $fees_today = mysqli_fetch_assoc(mysqli_query($conn, "SELECT SUM(fee) as total FROM followups WHERE $f_where"))['total'] ?? 0;

            // New vs Old (New = registered in last 7 days)
            $seven_days_ago = date('Y-m-d', strtotime('-7 days'));
            $new_patients = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM patients WHERE created_at >= '$seven_days_ago' AND clinic_id = $clinic_id"))['count'];
            $old_patients = $patients - $new_patients;

            // Patient growth (Actual data for last 7 days)
            $growth_data = [];
            $growth_labels = [];
            for ($i = 6; $i >= 0; $i--) {
                $d = date('Y-m-d', strtotime("-$i days"));
                $label = date('D', strtotime($d));
                $cnt = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM patients WHERE DATE(created_at) = '$d' AND clinic_id = $clinic_id"))['count'];
                $growth_data[] = (int) $cnt;
                $growth_labels[] = $label;
            }

            echo json_encode([
                'success' => true,
                'data' => [
                    'patients' => $patients,
                    'new_patients' => $new_patients,
                    'old_patients' => $old_patients,
                    'categories' => $categories,
                    'templates' => $templates,
                    'today_reminders' => $reminders,
                    'revenue_today' => (float) $fees_today,
                    'growth' => $growth_data,
                    'growth_labels' => $growth_labels
                ]
            ]);
            break;

        case 'get_finance_summary':
            $from = mysqli_real_escape_string($conn, $_GET['from'] ?? date('Y-m-d'));
            $to = mysqli_real_escape_string($conn, $_GET['to'] ?? date('Y-m-d'));

            $today = date('Y-m-d');
            $this_month = date('Y-m-01');

            // Stats for the selected range (isolated by clinic/doctor)
            $f_where_base = "clinic_id = $clinic_id" . ($doctor_id ? " AND doctor_id = $doctor_id" : "");
            $range_rev = mysqli_fetch_assoc(mysqli_query($conn, "SELECT SUM(fee) as total FROM followups WHERE $f_where_base AND followup_date BETWEEN '$from' AND '$to'"))['total'] ?? 0;

            // Overall context (isolated by clinic/doctor)
            $month_rev = mysqli_fetch_assoc(mysqli_query($conn, "SELECT SUM(fee) as total FROM followups WHERE $f_where_base AND followup_date >= '$this_month'"))['total'] ?? 0;
            $total_rev = mysqli_fetch_assoc(mysqli_query($conn, "SELECT SUM(fee) as total FROM followups WHERE $f_where_base"))['total'] ?? 0;

            $recent = mysqli_query($conn, "SELECT f.*, p.name as patient_name, p.phone as patient_phone FROM followups f JOIN patients p ON f.patient_id = p.id WHERE f.$f_where_base AND f.fee > 0 AND f.followup_date BETWEEN '$from' AND '$to' ORDER BY f.followup_date DESC");
            $history = [];
            while ($r = mysqli_fetch_assoc($recent))
                $history[] = $r;

            // Revenue by type in range (isolated by clinic)
            $types = mysqli_query($conn, "SELECT followup_type, SUM(fee) as total FROM followups WHERE clinic_id = $clinic_id AND followup_date BETWEEN '$from' AND '$to' GROUP BY followup_type");
            $type_data = [];
            while ($t = mysqli_fetch_assoc($types))
                $type_data[] = $t;

            echo json_encode([
                'success' => true,
                'data' => [
                    'range_total' => (float) $range_rev,
                    'month' => (float) $month_rev,
                    'total' => (float) $total_rev,
                    'history' => $history,
                    'type_stats' => $type_data
                ]
            ]);
            break;

        case 'export_finance_csv':
            $from = mysqli_real_escape_string($conn, $_GET['from'] ?? date('Y-m-d'));
            $to = mysqli_real_escape_string($conn, $_GET['to'] ?? date('Y-m-d'));

            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename=DocCRM_Collections_' . $from . '_to_' . $to . '.csv');

            $output = fopen('php://output', 'w');
            fputcsv($output, ['Visit ID', 'Date', 'Patient Name', 'Phone', 'Visit Type', 'Fee (INR)', 'Notes']);

            $query = "SELECT f.id, f.followup_date, p.name, p.phone, f.followup_type, f.fee, f.notes 
                  FROM followups f 
                  JOIN patients p ON f.patient_id = p.id 
                  WHERE f.clinic_id = $clinic_id AND f.fee > 0 AND f.followup_date BETWEEN '$from' AND '$to' 
                  ORDER BY f.followup_date DESC";

            $rows = mysqli_query($conn, $query);
            while ($row = mysqli_fetch_assoc($rows)) {
                fputcsv($output, $row);
            }
            fclose($output);
            exit;
            break;

        case 'get_app_settings':
            $result = mysqli_query($conn, "SELECT * FROM app_settings WHERE clinic_id = $clinic_id");
            $settings = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
            echo json_encode(['success' => true, 'data' => $settings]);
            break;

        case 'save_app_settings':
            $json = file_get_contents('php://input');
            $input = json_decode($json, true);
            if ($input && is_array($input)) {
                foreach ($input as $key => $value) {
                    $key = mysqli_real_escape_string($conn, $key);
                    $value = mysqli_real_escape_string($conn, $value);
                    mysqli_query($conn, "INSERT INTO app_settings (clinic_id, setting_key, setting_value) VALUES ($clinic_id, '$key', '$value') ON DUPLICATE KEY UPDATE setting_value='$value'");
                }
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid input']);
            }
            break;

        case 'update_followup':
            $json = file_get_contents('php://input');
            $input = json_decode($json, true);

            if ($input) {
                $id = (int) $input['id'];
                $status = mysqli_real_escape_string($conn, $input['status']);
                $notes = mysqli_real_escape_string($conn, $input['notes'] ?? '');

                $where = "id=$id AND clinic_id=$clinic_id" . ($doctor_id ? " AND doctor_id = $doctor_id" : "");
                $sql = "UPDATE followups SET status='$status', notes='$notes' WHERE $where";
                if (mysqli_query($conn, $sql)) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
                }
            }
            break;

        case 'get_logs':
            $result = mysqli_query($conn, "SELECT l.*, p.name as patient_name FROM message_logs l JOIN patients p ON l.patient_id = p.id WHERE l.clinic_id = $clinic_id ORDER BY l.sent_at DESC LIMIT 20");
            $data = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $data[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'clinic_signup':
            $name = mysqli_real_escape_string($conn, $_POST['name'] ?? '');
            $email = mysqli_real_escape_string($conn, $_POST['email'] ?? '');
            $phone = mysqli_real_escape_string($conn, $_POST['phone'] ?? '');
            $password = password_hash($_POST['password'] ?? '123456', PASSWORD_DEFAULT);
            $address = mysqli_real_escape_string($conn, $_POST['address'] ?? '');

            if (!$name || !$email || !$phone) {
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                break;
            }

            // Check if email/phone already exists
            $check = mysqli_query($conn, "SELECT id FROM clinics WHERE email = '$email' OR phone = '$phone'");
            if (mysqli_num_rows($check) > 0) {
                echo json_encode(['success' => false, 'message' => 'Email or Phone already registered']);
                break;
            }

            if (mysqli_query($conn, "INSERT INTO clinics (name, email, phone, password, address) VALUES ('$name', '$email', '$phone', '$password', '$address')")) {
                $new_clinic_id = mysqli_insert_id($conn);
                
                // Create admin user for this clinic
                $username = strtolower(str_replace(' ', '', $name)) . "_admin";
                mysqli_query($conn, "INSERT INTO admins (clinic_id, username, password) VALUES ($new_clinic_id, '$username', '$password')");

                echo json_encode(['success' => true, 'message' => 'Clinic registered successfully', 'clinic_id' => $new_clinic_id]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Registration failed']);
            }
            break;

        case 'login_password':
            $identity = mysqli_real_escape_string($conn, $_POST['identity'] ?? '');
            $password = $_POST['password'] ?? '';

            if (!$identity || !$password) {
                echo json_encode(['success' => false, 'message' => 'Identity and password required']);
                break;
            }

            // Check Clinics table (Primary SaaS identifier)
            $res = mysqli_query($conn, "SELECT id, name, phone, password FROM clinics WHERE email = '$identity' OR phone = '$identity'");
            $user = mysqli_fetch_assoc($res);

            if ($user && password_verify($password, $user['password'])) {
                $token = base64_encode(json_encode([
                    'clinic_id' => (int)$user['id'],
                    'name' => $user['name'],
                    'phone' => $user['phone'],
                    'doctor_id' => 0 // Admin login
                ]));
                echo json_encode(['success' => true, 'token' => $token, 'phone' => $user['phone'], 'name' => $user['name']]);
            } else {
                // Check Doctors table (Secondary SaaS identifier)
                $res = mysqli_query($conn, "SELECT id, clinic_id, name, phone, password FROM doctors WHERE email = '$identity' OR phone = '$identity'");
                $doc = mysqli_fetch_assoc($res);
                
                if ($doc && password_verify($password, $doc['password'])) {
                    $token = base64_encode(json_encode([
                        'clinic_id' => (int)$doc['clinic_id'],
                        'name' => $doc['name'],
                        'phone' => $doc['phone'],
                        'doctor_id' => (int)$doc['id']
                    ]));
                    echo json_encode(['success' => true, 'token' => $token, 'phone' => $doc['phone'], 'name' => $doc['name']]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
                }
            }
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
}
if (!defined('INTERNAL_ACCESS')) {
    mysqli_close($conn);
}
