<?php
require_once __DIR__ . '/api/config.php';
date_default_timezone_set('Asia/Kolkata');

// First connect without database to create it if it doesn't exist
$conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS);

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

// Create database if not exists
$sql = "CREATE DATABASE IF NOT EXISTS " . DB_NAME;
if (!mysqli_query($conn, $sql)) {
    // If we can't create DB, we assume it exists or we don't have permissions
}

// Now connect to the database
$conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

// Create tables if they don't exist
$tables = [
    "CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS diseases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS patients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        gender ENUM('Male', 'Female', 'Other') DEFAULT 'Male',
        father_name VARCHAR(255),
        dob DATE,
        age INT NULL,
        age_unit ENUM('Y', 'M', 'D') DEFAULT 'Y',
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS patient_categories (
        patient_id INT NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (patient_id, category_id),
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS patient_diseases (
        patient_id INT NOT NULL,
        disease_id INT NOT NULL,
        PRIMARY KEY (patient_id, disease_id),
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content_type ENUM('Text', 'Image', 'Video') DEFAULT 'Text',
        content TEXT,
        media_url VARCHAR(255) NULL,
        scheduled_at DATETIME NULL,
        status ENUM('Draft', 'Scheduled', 'Processing', 'Completed') DEFAULT 'Draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS campaign_categories (
        campaign_id INT NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (campaign_id, category_id),
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS message_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        message TEXT,
        status ENUM('Sent', 'Failed') NOT NULL,
        error_msg TEXT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        document_name VARCHAR(255) NOT NULL,
        due_date DATE NOT NULL,
        status ENUM('Pending', 'Submitted', 'Overdue') DEFAULT 'Pending',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS followups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        followup_date DATE NOT NULL,
        followup_type VARCHAR(100),
        fee DECIMAL(10,2) DEFAULT 0.00,
        notes TEXT,
        status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS templates (" .
    "id INT AUTO_INCREMENT PRIMARY KEY, " .
    "slug VARCHAR(50) UNIQUE NULL, " .
    "name VARCHAR(255) NOT NULL, " .
    "content_type ENUM('Text', 'Image') DEFAULT 'Text', " .
    "content_part1 TEXT NOT NULL, " .
    "content_part2 TEXT NULL, " .
    "content_part3 TEXT NULL, " .
    "media_url VARCHAR(255) NULL, " .
    "is_default TINYINT(1) DEFAULT 0, " .
    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" .
    ")",
    "CREATE TABLE IF NOT EXISTS message_queue (" .
    "id INT AUTO_INCREMENT PRIMARY KEY, " .
    "to_number VARCHAR(20) NOT NULL, " .
    "template_name VARCHAR(100) NOT NULL, " .
    "variables TEXT NOT NULL, " .
    "header_type VARCHAR(20) DEFAULT 'none', " .
    "media_url TEXT NULL, " .
    "status ENUM('Pending', 'Processing', 'Sent', 'Failed') DEFAULT 'Pending', " .
    "error_message TEXT NULL, " .
    "scheduled_at DATETIME NOT NULL, " .
    "processed_at DATETIME NULL, " .
    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" .
    ")",
    "CREATE TABLE IF NOT EXISTS app_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS doctors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        specialization VARCHAR(255),
        qualification VARCHAR(255),
        experience INT DEFAULT 0,
        phone VARCHAR(20),
        email VARCHAR(255),
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )"
];

// Seed App Settings if empty
$check_settings = mysqli_query($conn, "SELECT setting_key FROM app_settings LIMIT 1");
if (mysqli_num_rows($check_settings) == 0) {
    mysqli_query($conn, "INSERT INTO app_settings (setting_key, setting_value) VALUES 
        ('clinic_name', 'DocCRM Clinic'),
        ('whatsapp_enabled', '0'),
        ('whatsapp_api_key', ''),
        ('whatsapp_from_number', ''),
        ('clinic_address', ''),
        ('clinic_phone', ''),
        ('clinic_email', ''),
        ('clinic_timings', '10:00 AM - 08:00 PM'),
        ('working_hours', '{}'),
        ('clinic_logo', ''),
        ('clinic_cover', 'http://192.168.1.15/doccrm/uploads/clinic_banner_default.png'),
        ('whatsapp_header_image', 'http://192.168.1.15/doccrm/uploads/clinic_banner_default.png'),
        ('working_days', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'),
        ('max_new_patients', '0'),
        ('max_old_patients', '0'),
        ('welcome_template', 'welcome_msg'),
        ('reminder_template', 'appointment_reminder')");
}

foreach ($tables as $sql) {
    if (!mysqli_query($conn, $sql)) {
        die("Error creating table: " . mysqli_error($conn));
    }
}

// Seed Default Templates if empty
$check_templates = mysqli_query($conn, "SELECT id FROM templates LIMIT 1");
if (mysqli_num_rows($check_templates) == 0) {
    mysqli_query($conn, "INSERT INTO templates (name, content_type, content_part1, content_part2) VALUES 
        ('Regular Checkup Reminder', 'Text', 'Hello [Patient Name], this is a reminder for your regular health checkup.', 'Please visit us between 10 AM to 5 PM.'),
        ('Holiday Clinic Notice', 'Image', 'Dear Patients, please note that our clinic will be closed on [Date] due to [Holiday].', 'We will resume on [Next Date].')");
}

// Add missing columns to campaigns if it was created previously
mysqli_query($conn, "ALTER TABLE campaigns MODIFY COLUMN content_type ENUM('Text', 'Image', 'Video') DEFAULT 'Text'");

// Add age column to patients if missing
$check_age = mysqli_query($conn, "SHOW COLUMNS FROM patients LIKE 'age'");
if ($check_age && mysqli_num_rows($check_age) == 0) {
    mysqli_query($conn, "ALTER TABLE patients ADD COLUMN age INT NULL AFTER dob");
}

// Add fee column to followups if missing
$check_fee = mysqli_query($conn, "SHOW COLUMNS FROM followups LIKE 'fee'");
if ($check_fee && mysqli_num_rows($check_fee) == 0) {
    mysqli_query($conn, "ALTER TABLE followups ADD COLUMN fee DECIMAL(10,2) DEFAULT 0.00 AFTER followup_type");
}

// Add gender column to patients if missing
$check_gender = mysqli_query($conn, "SHOW COLUMNS FROM patients LIKE 'gender'");
if ($check_gender && mysqli_num_rows($check_gender) == 0) {
    mysqli_query($conn, "ALTER TABLE patients ADD COLUMN gender ENUM('Male', 'Female', 'Other') DEFAULT 'Male' AFTER email");
}

// Add father_name column to patients if missing
$check_father = mysqli_query($conn, "SHOW COLUMNS FROM patients LIKE 'father_name'");
if ($check_father && mysqli_num_rows($check_father) == 0) {
    mysqli_query($conn, "ALTER TABLE patients ADD COLUMN father_name VARCHAR(255) AFTER gender");
}

// Add doctor_id to patients if missing
$check_doc_p = mysqli_query($conn, "SHOW COLUMNS FROM patients LIKE 'doctor_id'");
if ($check_doc_p && mysqli_num_rows($check_doc_p) == 0) {
    mysqli_query($conn, "ALTER TABLE patients ADD COLUMN doctor_id INT NULL AFTER id");
}

// Add patient_uid column to patients if missing
$check_uid = mysqli_query($conn, "SHOW COLUMNS FROM patients LIKE 'patient_uid'");
if ($check_uid && mysqli_num_rows($check_uid) == 0) {
    mysqli_query($conn, "ALTER TABLE patients ADD COLUMN patient_uid VARCHAR(100) UNIQUE NULL AFTER id");
}

// Add is_default column to templates if missing
$check_def = mysqli_query($conn, "SHOW COLUMNS FROM templates LIKE 'is_default'");
if ($check_def && mysqli_num_rows($check_def) == 0) {
    mysqli_query($conn, "ALTER TABLE templates ADD COLUMN is_default TINYINT(1) DEFAULT 0 AFTER media_url");
}

// Migration for message_queue system
$check_mq = mysqli_query($conn, "SHOW COLUMNS FROM message_queue LIKE 'to_number'");
if ($check_mq && mysqli_num_rows($check_mq) == 0) {
    mysqli_query($conn, "DROP TABLE IF EXISTS message_queue");
    mysqli_query($conn, "CREATE TABLE message_queue (
        id INT AUTO_INCREMENT PRIMARY KEY, 
        to_number VARCHAR(20) NOT NULL, 
        template_name VARCHAR(100) NOT NULL, 
        variables TEXT NOT NULL, 
        header_type VARCHAR(20) DEFAULT 'none', 
        media_url TEXT NULL, 
        status ENUM('Pending', 'Processing', 'Sent', 'Failed') DEFAULT 'Pending', 
        error_message TEXT NULL, 
        scheduled_at DATETIME NOT NULL, 
        processed_at DATETIME NULL, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
}
$check_slug = mysqli_query($conn, "SHOW COLUMNS FROM templates LIKE 'slug'");
if ($check_slug && mysqli_num_rows($check_slug) > 0) {
    mysqli_query($conn, "ALTER TABLE templates CHANGE COLUMN slug aoc_template_name VARCHAR(50) NULL");
} else {
    $check_aoc = mysqli_query($conn, "SHOW COLUMNS FROM templates LIKE 'aoc_template_name'");
    if ($check_aoc && mysqli_num_rows($check_aoc) == 0) {
        mysqli_query($conn, "ALTER TABLE templates ADD COLUMN aoc_template_name VARCHAR(50) NULL AFTER id");
    }
}

// Safer check for settings
$clinic_name = "Our Clinic";
$clinic_addr = "";
$check_settings_table = mysqli_query($conn, "SHOW TABLES LIKE 'app_settings'");
if ($check_settings_table && mysqli_num_rows($check_settings_table) > 0) {
    $cn_res = mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE setting_key = 'clinic_name'");
    if ($cn_res) {
        $cn_row = mysqli_fetch_assoc($cn_res);
        if ($cn_row) $clinic_name = $cn_row['setting_value'];
    }
    $ca_res = mysqli_query($conn, "SELECT setting_value FROM app_settings WHERE setting_key = 'clinic_address'");
    if ($ca_res) {
        $ca_row = mysqli_fetch_assoc($ca_res);
        if ($ca_row) $clinic_addr = $ca_row['setting_value'];
    }
}
$part3_default = "*$clinic_name*\n$clinic_addr";

// 1. Greeting Message
$check_greet = mysqli_query($conn, "SELECT id FROM templates WHERE aoc_template_name = 'greeting'");
if ($check_greet && mysqli_num_rows($check_greet) == 0) {
    mysqli_query($conn, "INSERT INTO templates (aoc_template_name, name, content_type, content_part1, content_part2, content_part3, is_default) 
    VALUES ('greeting', 'New Patient Greeting', 'Image', 'Dear #Patient Name#', 'Welcome to our clinic. We are happy to serve you.', '$part3_default', 1)");
}

// 2. Appointment Message
$check_app = mysqli_query($conn, "SELECT id FROM templates WHERE aoc_template_name = 'appointment'");
if ($check_app && mysqli_num_rows($check_app) == 0) {
    mysqli_query($conn, "INSERT INTO templates (aoc_template_name, name, content_type, content_part1, content_part2, content_part3, is_default) 
    VALUES ('appointment', 'Appointment Confirmation', 'Image', 'Dear #Patient Name#', 'Your appointment has been confirmed. Please visit on time.', '$part3_default', 0)");
}

// Migration for 3-part content system
$check_p1 = mysqli_query($conn, "SHOW COLUMNS FROM templates LIKE 'content_part1'");
if ($check_p1 && mysqli_num_rows($check_p1) == 0) {
    // Rename old content to content_part1
    @mysqli_query($conn, "ALTER TABLE templates CHANGE content content_part1 TEXT NOT NULL");
    // Add part 2 and 3
    @mysqli_query($conn, "ALTER TABLE templates ADD COLUMN content_part2 TEXT NULL AFTER content_part1");
    @mysqli_query($conn, "ALTER TABLE templates ADD COLUMN content_part3 TEXT NULL AFTER content_part2");
    // Remove Video from ENUM
    @mysqli_query($conn, "ALTER TABLE templates MODIFY content_type ENUM('Text', 'Image') DEFAULT 'Text'");
}

// Add age_unit column to patients if missing
$check_unit = mysqli_query($conn, "SHOW COLUMNS FROM patients LIKE 'age_unit'");
if ($check_unit && mysqli_num_rows($check_unit) == 0) {
    mysqli_query($conn, "ALTER TABLE patients ADD COLUMN age_unit ENUM('Y', 'M', 'D') DEFAULT 'Y' AFTER age");
} else if ($check_unit) {
    // If it exists, update the enum definition to Y, M, D
    mysqli_query($conn, "ALTER TABLE patients MODIFY COLUMN age_unit ENUM('Y', 'M', 'D') DEFAULT 'Y'");
}

// Add doctor_id to patients if missing
$check_doc_p = mysqli_query($conn, "SHOW COLUMNS FROM patients LIKE 'doctor_id'");
if ($check_doc_p && mysqli_num_rows($check_doc_p) == 0) {
    mysqli_query($conn, "ALTER TABLE patients ADD COLUMN doctor_id INT NULL AFTER id");
}

// Insert default admin if none exists
$admin_check = mysqli_query($conn, "SELECT id FROM admins");
if (mysqli_num_rows($admin_check) == 0) {
    $pass = password_hash('admin123', PASSWORD_DEFAULT);
    mysqli_query($conn, "INSERT INTO admins (username, password) VALUES ('admin', '$pass')");
}
// Add qualification and experience to doctors if missing
@$check_doc_q = mysqli_query($conn, "SHOW COLUMNS FROM doctors LIKE 'qualification'");
if ($check_doc_q && mysqli_num_rows($check_doc_q) == 0) {
    @mysqli_query($conn, "ALTER TABLE doctors ADD COLUMN qualification VARCHAR(255) AFTER specialization");
    @mysqli_query($conn, "ALTER TABLE doctors ADD COLUMN experience INT DEFAULT 0 AFTER qualification");
}

// Helper for safe fetching
function safe_fetch_assoc($query_result) {
    if (!$query_result) return null;
    return mysqli_fetch_assoc($query_result);
}
