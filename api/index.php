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

$action = $_GET['action'] ?? '';

// AOC Portal WhatsApp Helper
function send_aoc_whatsapp($to, $templateName, $params = [], $headerType = 'none', $mediaUrl = '') {
    global $conn;
    
    // Fetch Settings
    $res = mysqli_query($conn, "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('whatsapp_enabled', 'whatsapp_api_key', 'whatsapp_from_number', 'clinic_name', 'clinic_address', 'whatsapp_header_image')");
    $settings = [];
    while($r = mysqli_fetch_assoc($res)) $settings[$r['setting_key']] = $r['setting_value'];
    
    if (($settings['whatsapp_enabled'] ?? '0') !== '1') return false;
    
    $apiKey = $settings['whatsapp_api_key'] ?? '';
    $from = $settings['whatsapp_from_number'] ?? '';
    $clinicInfo = ($settings['clinic_name'] ?? '') . " " . ($settings['clinic_address'] ?? '');
    $headerImage = $settings['whatsapp_header_image'] ?? '';
    
    if (!$apiKey || !$from) return false;

    // Clean number (ensure +countrycode)
    $to = preg_replace('/[^0-9]/', '', $to);
    if (strlen($to) == 10) $to = '+91' . $to; // Default to India if no code
    else if (substr($to, 0, 1) !== '+') $to = '+' . $to;

    $url = "https://api.aoc-portal.com/v1/whatsapp"; // Standardized endpoint from docs
    
    // Auto-append Clinic Info as variable 3 if not already set or if params has space
    if (!is_array($params)) $params = [];
    if (count($params) < 3) {
        // Ensure params has exactly 3 elements for the new template structure
        // {{1}} = Patient, {{2}} = Message, {{3}} = Clinic
        if (count($params) == 0) {
             $params[0] = "Patient";
        }
        if (count($params) == 1) {
             // If only name provided, we need a default message for {{2}}
             $params[1] = "Greetings from our clinic."; 
        }
        $params[2] = $clinicInfo;
    }

    // Default to Image Header if set in settings and not overridden
    if ($headerType === 'none' && $headerImage) {
        $headerType = 'image';
        $mediaUrl = $headerImage;
    }

    $bodyParams = [];
    foreach ($params as $p) {
        $bodyParams[] = ["type" => "text", "text" => (string)$p];
    }

    $components = [
        [
            "type" => "body",
            "parameters" => $bodyParams
        ]
    ];

    if ($headerType !== 'none' && $mediaUrl) {
        $headerParam = ["type" => $headerType];
        if ($headerType === 'image') {
            $headerParam["image"] = ["link" => $mediaUrl];
        } else if ($headerType === 'video') {
            $headerParam["video"] = ["link" => $mediaUrl];
        } else if ($headerType === 'document') {
            $headerParam["document"] = ["link" => $mediaUrl, "filename" => "Document"];
        }
        
        $components[] = [
            "type" => "header",
            "parameters" => [$headerParam]
        ];
    }

    $payload = [
        "messaging_product" => "whatsapp",
        "to" => $to,
        "type" => "template",
        "template" => [
            "name" => $templateName,
            "language" => ["code" => "en_US"],
            "components" => $components
        ]
    ];

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

    // Log the message
    $status = ($httpCode >= 200 && $httpCode < 300) ? 'Sent' : 'Failed';
    $msg = mysqli_real_escape_string($conn, json_encode($payload));
    $err = mysqli_real_escape_string($conn, $response);
    
    // Find patient_id for logging
    $p_res = mysqli_fetch_assoc(mysqli_query($conn, "SELECT id FROM patients WHERE phone LIKE '%".substr($to, -10)."%'"));
    if ($p_res) {
        $p_id = $p_res['id'];
        mysqli_query($conn, "INSERT INTO message_logs (patient_id, message, status) VALUES ($p_id, '$msg', '$status')");
    }

    return [
        'success' => ($httpCode >= 200 && $httpCode < 300),
        'response' => $response
    ];
}

if ($action) {
    switch ($action) {
    case 'get_stats':
        $patients = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM patients"))['cnt'];
        $campaigns = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM campaigns WHERE status IN ('Scheduled', 'Processing')"))['cnt'];
        $followups = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM followups WHERE status = 'Scheduled'"))['cnt'];
        
        echo json_encode([
            'success' => true,
            'data' => [
                'total_patients' => (int)$patients,
                'active_campaigns' => (int)$campaigns,
                'pending_followups' => (int)$followups
            ]
        ]);
        break;

    case 'get_patients':
        $search = mysqli_real_escape_string($conn, $_GET['search'] ?? '');
        $where = "";
        if ($search) {
            $where = "WHERE name LIKE '%$search%' OR phone LIKE '%$search%' OR address LIKE '%$search%'";
        }
        $result = mysqli_query($conn, "SELECT * FROM patients $where ORDER BY name ASC LIMIT 50");
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $data]);
        break;

    case 'get_patient':
        $id = (int)$_GET['id'];
        $result = mysqli_query($conn, "SELECT * FROM patients WHERE id = $id");
        $patient = mysqli_fetch_assoc($result);
        if ($patient) {
            // Get Category IDs
            $cats_res = mysqli_query($conn, "SELECT category_id FROM patient_categories WHERE patient_id = $id");
            $patient['category_ids'] = [];
            while ($c = mysqli_fetch_assoc($cats_res)) {
                $patient['category_ids'][] = (int)$c['category_id'];
            }

            // Get Category Names (for display)
            $cats_names = mysqli_query($conn, "SELECT c.name FROM categories c JOIN patient_categories pc ON c.id = pc.category_id WHERE pc.patient_id = $id");
            $patient['categories'] = [];
            while($c = mysqli_fetch_assoc($cats_names)) $patient['categories'][] = $c['name'];

            // Get History (Followups)
            $hist_res = mysqli_query($conn, "SELECT * FROM followups WHERE patient_id = $id ORDER BY followup_date DESC");
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
        $result = mysqli_query($conn, "SELECT c.*, (SELECT COUNT(*) FROM patient_categories pc WHERE pc.category_id = c.id) as patient_count FROM categories c ORDER BY name ASC");
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $data]);
        break;

    case 'get_campaigns':
        $result = mysqli_query($conn, "SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 50");
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $data]);
        break;

    case 'get_diseases':
        $result = mysqli_query($conn, "SELECT * FROM diseases ORDER BY name ASC");
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
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            $name = mysqli_real_escape_string($conn, $input['name']);
            $phone = mysqli_real_escape_string($conn, $input['phone']);
            $email = mysqli_real_escape_string($conn, $input['email'] ?? '');
            $gender = mysqli_real_escape_string($conn, $input['gender'] ?? 'Male');
            $father = mysqli_real_escape_string($conn, $input['father_name'] ?? '');
            $age = (int)($input['age'] ?? 0);
            $age_unit = mysqli_real_escape_string($conn, $input['age_unit'] ?? 'Y');
            $address = mysqli_real_escape_string($conn, $input['address'] ?? '');
            $category_ids = $input['category_ids'] ?? [];

            if ($id == 0) {
                // Check for Unique (Name + Mobile)
                $check_unique = mysqli_query($conn, "SELECT id FROM patients WHERE name = '$name' AND phone = '$phone'");
                if (mysqli_num_rows($check_unique) > 0) {
                    echo json_encode(['success' => false, 'message' => 'Duplicate Entry: A patient with this Name and Mobile Number is already registered.']);
                    exit;
                }

                // Check New Patient Limit
                $max_new = (int)mysqli_fetch_assoc(mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE setting_key = 'max_new_patients'"))['setting_value'];
                if ($max_new > 0) {
                    $today = date('Y-m-d');
                    $current_new = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM patients WHERE DATE(created_at) = '$today'"))['cnt'];
                    if ($current_new >= $max_new) {
                        echo json_encode(['success' => false, 'message' => "Daily limit for New Patients reached ($max_new)."]);
                        exit;
                    }
                }

                // Generate Unique Patient ID (Mobile + Suffix 0-9)
                $clean_phone = preg_replace('/[^0-9]/', '', $phone);
                $check_existing = mysqli_query($conn, "SELECT COUNT(*) as cnt FROM patients WHERE phone = '$phone'");
                $count = mysqli_fetch_assoc($check_existing)['cnt'];
                
                if ($count >= 10) {
                    echo json_encode(['success' => false, 'message' => 'Limit Reached: Maximum 10 patients are allowed for a single mobile number.']);
                    exit;
                }
                
                $patient_uid = $clean_phone . $count;
                $sql = "INSERT INTO patients (patient_uid, name, phone, email, gender, father_name, age, age_unit, address) VALUES ('$patient_uid', '$name', '$phone', '$email', '$gender', '$father', $age, '$age_unit', '$address')";
            } else {
                $sql = "UPDATE patients SET name='$name', phone='$phone', email='$email', gender='$gender', father_name='$father', age=$age, age_unit='$age_unit', address='$address' WHERE id=$id";
            }

            if (mysqli_query($conn, $sql)) {
                $patient_id = $id > 0 ? $id : mysqli_insert_id($conn);
                
                // Update Categories
                mysqli_query($conn, "DELETE FROM patient_categories WHERE patient_id = $patient_id");
                foreach ($category_ids as $cat_id) {
                    $cat_id = (int)$cat_id;
                    mysqli_query($conn, "INSERT INTO patient_categories (patient_id, category_id) VALUES ($patient_id, $cat_id)");
                }

                // Auto-add consultation fee to revenue if provided (New Patient)
                $fee = isset($input['fee']) ? (float)$input['fee'] : 0;
                $is_today = isset($input['is_today']) && $input['is_today'] == 1;
                
                if ($id == 0 && ($fee > 0 || $is_today)) {
                    $today = date('Y-m-d');
                    $type = mysqli_real_escape_string($conn, $input['followup_type'] ?? ($is_today ? 'Today Visit' : 'New Visit'));
                    mysqli_query($conn, "INSERT INTO followups (patient_id, followup_date, followup_type, fee, notes, status) 
                                       VALUES ($patient_id, '$today', '$type', $fee, 'Automatic entry from registration', 'Completed')");
                }

                // AOC WhatsApp Integration: Welcome Message
                if ($id == 0) {
                    $welcome_tpl = mysqli_fetch_assoc(mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE setting_key = 'welcome_template'"))['setting_value'] ?? 'welcome_msg';
                    send_aoc_whatsapp($phone, $welcome_tpl, [$name]);
                }

                echo json_encode(['success' => true, 'id' => $patient_id]);
            } else {
                echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
            }
        }
        break;

    case 'delete_patient':
        $id = (int)$_GET['id'];
        if (mysqli_query($conn, "DELETE FROM patients WHERE id = $id")) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
        }
        break;

    case 'get_doctors':
        $result = mysqli_query($conn, "SELECT * FROM doctors ORDER BY name ASC");
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
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            $name = mysqli_real_escape_string($conn, $input['name']);
            $spec = mysqli_real_escape_string($conn, $input['specialization'] ?? '');
            $qual = mysqli_real_escape_string($conn, $input['qualification'] ?? '');
            $exp = (int)($input['experience'] ?? 0);
            $phone = mysqli_real_escape_string($conn, $input['phone'] ?? '');
            $email = mysqli_real_escape_string($conn, $input['email'] ?? '');

            if ($id > 0) {
                $sql = "UPDATE doctors SET name='$name', specialization='$spec', qualification='$qual', experience=$exp, phone='$phone', email='$email' WHERE id=$id";
            } else {
                $sql = "INSERT INTO doctors (name, specialization, qualification, experience, phone, email) VALUES ('$name', '$spec', '$qual', $exp, '$phone', '$email')";
            }

            if (mysqli_query($conn, $sql)) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
            }
        }
        break;

    case 'get_category_patients':
        $id = (int)$_GET['id'];
        $result = mysqli_query($conn, "SELECT p.* FROM patients p JOIN patient_categories pc ON p.id = pc.patient_id WHERE pc.category_id = $id ORDER BY p.name ASC");
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
        $sql = "SELECT COUNT(DISTINCT patient_id) as cnt FROM patient_categories WHERE category_id IN ($ids)";
        $res = mysqli_fetch_assoc(mysqli_query($conn, $sql));
        echo json_encode(['success' => true, 'count' => (int)$res['cnt']]);
        break;

    case 'save_category':
        $json = file_get_contents('php://input');
        $input = json_decode($json, true);
        if ($input) {
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            $name = mysqli_real_escape_string($conn, $input['name']);
            if ($id > 0) {
                $sql = "UPDATE categories SET name='$name' WHERE id=$id";
            } else {
                $sql = "INSERT INTO categories (name) VALUES ('$name')";
            }
            if (mysqli_query($conn, $sql)) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
            }
        }
        break;

    case 'save_template':
        $id = (int)($_POST['id'] ?? 0);
        $name = mysqli_real_escape_string($conn, $_POST['name'] ?? '');
        $aoc_name = mysqli_real_escape_string($conn, $_POST['aoc_template_name'] ?? '');
        $type = mysqli_real_escape_string($conn, $_POST['content_type'] ?? 'Text');
        $part1 = mysqli_real_escape_string($conn, $_POST['content_part1'] ?? '');
        $part2 = mysqli_real_escape_string($conn, $_POST['content_part2'] ?? '');
        $part3 = mysqli_real_escape_string($conn, $_POST['content_part3'] ?? '');
        $is_default = (int)($_POST['is_default'] ?? 0);
        $media_url = $_POST['existing_media'] ?? '';

        // Handle File Upload if exists
        if (isset($_FILES['media']) && $_FILES['media']['error'] == UPLOAD_ERR_OK) {
            $upload_dir = '../uploads/';
            if(!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
            $filename = 'template_' . time() . '_' . basename($_FILES['media']['name']);
            $target_path = $upload_dir . $filename;
            if(move_uploaded_file($_FILES['media']['tmp_name'], $target_path)) {
                $media_url = 'uploads/' . $filename;
            }
        }

        if ($name && $part1) {
            if ($is_default == 1) {
                mysqli_query($conn, "UPDATE templates SET is_default = 0");
            }

            if ($id > 0) {
                $sql = "UPDATE templates SET name='$name', aoc_template_name='$aoc_name', content_type='$type', content_part1='$part1', content_part2='$part2', content_part3='$part3', media_url='$media_url', is_default=$is_default WHERE id=$id";
            } else {
                $sql = "INSERT INTO templates (name, aoc_template_name, content_type, content_part1, content_part2, content_part3, media_url, is_default) VALUES ('$name', '$aoc_name', '$type', '$part1', '$part2', '$part3', '$media_url', $is_default)";
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
        $id = (int)$_GET['id'];
        if (mysqli_query($conn, "DELETE FROM categories WHERE id = $id")) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
        }
        break;

    case 'delete_campaign':
        $id = (int)$_GET['id'];
        if (mysqli_query($conn, "DELETE FROM campaigns WHERE id = $id")) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
        }
        break;

    case 'get_templates':
        $result = mysqli_query($conn, "SELECT * FROM templates ORDER BY name ASC");
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $data]);
        break;

    case 'get_template':
        $id = (int)$_GET['id'];
        $result = mysqli_query($conn, "SELECT * FROM templates WHERE id = $id");
        $template = mysqli_fetch_assoc($result);
        if ($template) {
            echo json_encode(['success' => true, 'data' => $template]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Template not found']);
        }
        break;

    case 'get_default_template':
        $result = mysqli_query($conn, "SELECT * FROM templates WHERE is_default = 1 LIMIT 1");
        $template = mysqli_fetch_assoc($result);
        if ($template) {
            echo json_encode(['success' => true, 'data' => $template]);
        } else {
            echo json_encode(['success' => false, 'message' => 'No default template set']);
        }
        break;

    case 'delete_template':
        $id = (int)$_GET['id'];
        if (mysqli_query($conn, "DELETE FROM templates WHERE id = $id")) {
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
                                       WHERE f.followup_date = '$date' 
                                       ORDER BY f.id ASC");
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $data]);
        break;

    case 'delete_followup':
        $id = (int)$_GET['id'];
        if (mysqli_query($conn, "DELETE FROM followups WHERE id = $id")) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
        }
        break;

    case 'mark_followup_done':
        $id = (int)$_GET['id'];
        if (mysqli_query($conn, "UPDATE followups SET status = 'Completed' WHERE id = $id")) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
        }
        break;

    case 'save_followup':
        $json = file_get_contents('php://input');
        $input = json_decode($json, true);
        if ($input) {
            $patient_id = (int)$input['patient_id'];
            $date = mysqli_real_escape_string($conn, $input['followup_date']);
            $type = mysqli_real_escape_string($conn, $input['followup_type']);
            $fee = (float)($input['fee'] ?? 0);
            $notes = mysqli_real_escape_string($conn, $input['notes'] ?? '');

            // Check Old Patient Limit
            $max_old = (int)mysqli_fetch_assoc(mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE setting_key = 'max_old_patients'"))['setting_value'];
            if ($max_old > 0) {
                $current_old = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM followups WHERE followup_date = '$date'"))['cnt'];
                if ($current_old >= $max_old) {
                    echo json_encode(['success' => false, 'message' => "Daily limit for Old Patients reached ($max_old) for this date."]);
                    exit;
                }
            }
            
            $sql = "INSERT INTO followups (patient_id, followup_date, followup_type, fee, notes) VALUES ($patient_id, '$date', '$type', $fee, '$notes')";
            if (mysqli_query($conn, $sql)) {
                // AOC WhatsApp Integration: Appointment Reminder
                $reminder_tpl = mysqli_fetch_assoc(mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE setting_key = 'reminder_template'"))['setting_value'] ?? 'appointment_reminder';
                $p_data = mysqli_fetch_assoc(mysqli_query($conn, "SELECT name, phone FROM patients WHERE id = $patient_id"));
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
        $result = mysqli_query($conn, "SELECT followup_date as date, COUNT(*) as count FROM followups GROUP BY followup_date");
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
        $template_id = (int)($_POST['template_id'] ?? 0);

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

        $clinic_name = safe_fetch_assoc(mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE setting_key = 'clinic_name'"))['setting_value'] ?? '';
        $clinic_address = safe_fetch_assoc(mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE setting_key = 'clinic_address'"))['setting_value'] ?? '';
        $clinic_info = "*$clinic_name*\n$clinic_address";

        $sql = "SELECT DISTINCT p.* FROM patients p 
                JOIN patient_categories pc ON p.id = pc.patient_id 
                WHERE pc.category_id IN ($category_ids)";
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
            
            $tpl_name = mysqli_real_escape_string($conn, $template['aoc_template_name'] ?: 'generic_update');
            $q_sql = "INSERT INTO message_queue (to_number, template_name, variables, header_type, media_url, scheduled_at) 
                      VALUES ('$to', '$tpl_name', '$v_esc', '$type', '$m_esc', '$scheduled_at')";
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
        $patients = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM patients"))['count'];
        $categories = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM categories"))['count'];
        $templates = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM templates"))['count'];
        
        $today = date('Y-m-d');
        $reminders = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM followups WHERE followup_date = '$today'"))['count'];
        
        // Revenue Today
        $fees_today = mysqli_fetch_assoc(mysqli_query($conn, "SELECT SUM(fee) as total FROM followups WHERE followup_date = '$today'"))['total'] ?? 0;
        
        // New vs Old (New = registered in last 7 days)
        $seven_days_ago = date('Y-m-d', strtotime('-7 days'));
        $new_patients = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM patients WHERE created_at >= '$seven_days_ago'"))['count'];
        $old_patients = $patients - $new_patients;
        
        // Patient growth (Actual data for last 7 days)
        $growth_data = [];
        $growth_labels = [];
        for ($i = 6; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-$i days"));
            $label = date('D', strtotime($d));
            $cnt = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM patients WHERE DATE(created_at) = '$d'"))['count'];
            $growth_data[] = (int)$cnt;
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
                'revenue_today' => (float)$fees_today,
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
        
        // Stats for the selected range
        $range_rev = mysqli_fetch_assoc(mysqli_query($conn, "SELECT SUM(fee) as total FROM followups WHERE followup_date BETWEEN '$from' AND '$to'"))['total'] ?? 0;
        
        // Overall context
        $month_rev = mysqli_fetch_assoc(mysqli_query($conn, "SELECT SUM(fee) as total FROM followups WHERE followup_date >= '$this_month'"))['total'] ?? 0;
        $total_rev = mysqli_fetch_assoc(mysqli_query($conn, "SELECT SUM(fee) as total FROM followups"))['total'] ?? 0;
        
        $recent = mysqli_query($conn, "SELECT f.*, p.name as patient_name, p.phone as patient_phone FROM followups f JOIN patients p ON f.patient_id = p.id WHERE f.fee > 0 AND f.followup_date BETWEEN '$from' AND '$to' ORDER BY f.followup_date DESC");
        $history = [];
        while($r = mysqli_fetch_assoc($recent)) $history[] = $r;
        
        // Revenue by type in range
        $types = mysqli_query($conn, "SELECT followup_type, SUM(fee) as total FROM followups WHERE followup_date BETWEEN '$from' AND '$to' GROUP BY followup_type");
        $type_data = [];
        while($t = mysqli_fetch_assoc($types)) $type_data[] = $t;

        echo json_encode([
            'success' => true,
            'data' => [
                'range_total' => (float)$range_rev,
                'month' => (float)$month_rev,
                'total' => (float)$total_rev,
                'history' => $history,
                'type_stats' => $type_data
            ]
        ]);
        break;

    case 'export_finance_csv':
        $from = mysqli_real_escape_string($conn, $_GET['from'] ?? date('Y-m-d'));
        $to = mysqli_real_escape_string($conn, $_GET['to'] ?? date('Y-m-d'));
        
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=DocCRM_Collections_'.$from.'_to_'.$to.'.csv');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Visit ID', 'Date', 'Patient Name', 'Phone', 'Visit Type', 'Fee (INR)', 'Notes']);
        
        $query = "SELECT f.id, f.followup_date, p.name, p.phone, f.followup_type, f.fee, f.notes 
                  FROM followups f 
                  JOIN patients p ON f.patient_id = p.id 
                  WHERE f.fee > 0 AND f.followup_date BETWEEN '$from' AND '$to' 
                  ORDER BY f.followup_date DESC";
        
        $rows = mysqli_query($conn, $query);
        while($row = mysqli_fetch_assoc($rows)) {
            fputcsv($output, $row);
        }
        fclose($output);
        exit;
        break;

    case 'get_app_settings':
        $result = mysqli_query($conn, "SELECT * FROM app_settings");
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
                mysqli_query($conn, "INSERT INTO app_settings (setting_key, setting_value) VALUES ('$key', '$value') ON DUPLICATE KEY UPDATE setting_value='$value'");
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
            $id = (int)$input['id'];
            $status = mysqli_real_escape_string($conn, $input['status']);
            $notes = mysqli_real_escape_string($conn, $input['notes'] ?? '');
            
            $sql = "UPDATE followups SET status='$status', notes='$notes' WHERE id=$id";
            if (mysqli_query($conn, $sql)) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
            }
        }
        break;

    case 'get_logs':
        $result = mysqli_query($conn, "SELECT l.*, p.name as patient_name FROM message_logs l JOIN patients p ON l.patient_id = p.id ORDER BY l.sent_at DESC LIMIT 20");
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $data]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
    }
}
if (!defined('INTERNAL_ACCESS')) {
    mysqli_close($conn);
}
