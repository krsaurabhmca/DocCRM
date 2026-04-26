<?php
$page_title = 'Clinic Data Reset';
require_once 'components/header.php';

$error = "";
$success = "";

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['confirm_reset'])) {
    $password = $_POST['password'];
    $confirm_text = $_POST['confirm_text'];
    
    // Verify Admin Password
    $admin_id = $_SESSION['admin_id'];
    $admin_res = mysqli_query($conn, "SELECT password FROM admins WHERE id = $admin_id");
    $admin = mysqli_fetch_assoc($admin_res);

    if ($confirm_text !== 'RESET') {
        $error = "Please type 'RESET' exactly to confirm.";
    } elseif (!password_verify($password, $admin['password'])) {
        $error = "Incorrect password. Authorization failed.";
    } else {
        // Start Reset Process
        mysqli_begin_transaction($conn);
        try {
            // 1. Tables to wipe completely (filtered by clinic_id)
            $tables = [
                'patient_categories', // Dependency first
                'patient_diseases',   // Dependency
                'campaign_categories', // Dependency
                'patients',
                'categories',
                'diseases',
                'doctors',
                'templates',
                'campaigns',
                'message_logs',
                'message_queue',
                'reminders',
                'followups',
                'login_otps',
                'app_settings'
            ];

            foreach ($tables as $table) {
                // For tables that don't have clinic_id directly, we handle them via subqueries or joins if needed
                // But in our current schema, almost all have clinic_id.
                
                if ($table == 'patient_categories' || $table == 'patient_diseases') {
                    mysqli_query($conn, "DELETE FROM $table WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id = $clinic_id)");
                } elseif ($table == 'campaign_categories') {
                    mysqli_query($conn, "DELETE FROM $table WHERE campaign_id IN (SELECT id FROM campaigns WHERE clinic_id = $clinic_id)");
                } else {
                    mysqli_query($conn, "DELETE FROM $table WHERE clinic_id = $clinic_id");
                }
            }

            // 2. Re-seed default settings so the clinic remains functional
            $clinic_res = mysqli_query($conn, "SELECT * FROM clinics WHERE id = $clinic_id");
            $clinic = mysqli_fetch_assoc($clinic_res);
            $c_name = mysqli_real_escape_string($conn, $clinic['name']);
            $c_email = mysqli_real_escape_string($conn, $clinic['email']);
            $c_phone = mysqli_real_escape_string($conn, $clinic['phone']);
            $c_addr = mysqli_real_escape_string($conn, $clinic['address']);

            mysqli_query($conn, "INSERT INTO app_settings (clinic_id, setting_key, setting_value) VALUES 
                ($clinic_id, 'clinic_name', '$c_name'),
                ($clinic_id, 'whatsapp_enabled', '0'),
                ($clinic_id, 'clinic_address', '$c_addr'),
                ($clinic_id, 'clinic_phone', '$c_phone'),
                ($clinic_id, 'clinic_email', '$c_email'),
                ($clinic_id, 'clinic_timings', '10:00 AM - 08:00 PM'),
                ($clinic_id, 'max_new_patients', '0'),
                ($clinic_id, 'max_old_patients', '0'),
                ($clinic_id, 'welcome_template', 'welcome_msg'),
                ($clinic_id, 'reminder_template', 'appointment_reminder')");

            mysqli_commit($conn);
            $success = "Clinic data has been completely reset to factory defaults.";
        } catch (Exception $e) {
            mysqli_rollback($conn);
            $error = "Reset failed: " . $e->getMessage();
        }
    }
}
?>

<div style="max-width: 600px; margin: 40px auto;">
    <div class="card" style="border: 2px solid #FECDD3; border-radius: 20px; overflow: hidden;">
        <div style="background: #FFF1F2; padding: 30px; text-align: center; border-bottom: 1px solid #FECDD3;">
            <div style="width: 80px; height: 80px; background: #FB7185; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; margin: 0 auto 20px;">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h2 style="color: #9F1239; margin-bottom: 10px;">Danger Zone: Factory Reset</h2>
            <p style="color: #BE123C; font-size: 14px; line-height: 1.6;">You are about to permanently delete ALL patients, medical records, campaign logs, and settings for this clinic. This action <strong>cannot be undone</strong>.</p>
        </div>

        <div style="padding: 40px;">
            <?php if($error): ?>
                <div class="badge badge-overdue mb-4" style="width: 100%; padding: 15px; font-size: 14px; background: #FFE4E6; color: #E11D48; border: 1px solid #FECDD3;">
                    <i class="fas fa-times-circle"></i> <?= $error ?>
                </div>
            <?php endif; ?>

            <?php if($success): ?>
                <div class="badge badge-submitted mb-4" style="width: 100%; padding: 20px; font-size: 15px; display: block; text-align: center;">
                    <i class="fas fa-check-circle"></i> <?= $success ?><br>
                    <a href="index.php" class="btn btn-sm btn-primary mt-3">Go to Dashboard</a>
                </div>
            <?php else: ?>
                <form method="POST">
                    <div class="form-group">
                        <label class="form-label" style="font-weight: 700; color: #475569;">To confirm, please type <span style="color: #E11D48;">RESET</span> below:</label>
                        <input type="text" name="confirm_text" class="form-control" placeholder="Type RESET here" required style="border-color: #FECDD3; padding: 15px; font-weight: 800; text-align: center; font-size: 18px; letter-spacing: 5px;">
                    </div>

                    <div class="form-group mt-4">
                        <label class="form-label">Enter Admin Password to Authorize:</label>
                        <input type="password" name="password" class="form-control" placeholder="••••••••" required style="padding: 12px; border-radius: 10px;">
                    </div>

                    <div style="margin-top: 30px;">
                        <button type="submit" name="confirm_reset" class="btn" style="width: 100%; background: #E11D48; color: white; padding: 15px; border-radius: 12px; font-weight: 800; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.3);" onclick="return confirm('FINAL WARNING: This will destroy ALL data. Continue?')">
                            <i class="fas fa-trash-alt"></i> Wipe All Data & Restart
                        </button>
                        <a href="branding.php" class="btn btn-secondary mt-3" style="width: 100%; justify-content: center; padding: 12px;">Cancel & Go Back</a>
                    </div>
                </form>
            <?php endif; ?>
        </div>
    </div>

    <div style="text-align: center; margin-top: 24px; color: #94A3B8; font-size: 12px;">
        <i class="fas fa-shield-alt"></i> Secure Reset Protocol v2.0
    </div>
</div>

<?php require_once 'components/footer.php'; ?>
