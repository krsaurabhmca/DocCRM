<?php
$page_title = "Clinic Branding & Settings";
require_once 'components/header.php';

// Handle Settings Update
if (isset($_POST['update_settings'])) {
    // 1. Process standard settings
    foreach ($_POST['settings'] as $key => $value) {
        $key = mysqli_real_escape_string($conn, $key);
        $value = mysqli_real_escape_string($conn, $value);
        mysqli_query($conn, "INSERT INTO app_settings (setting_key, setting_value) VALUES ('$key', '$value') ON DUPLICATE KEY UPDATE setting_value='$value'");
    }

    // 2. Process Working Days (Checkboxes to String)
    if (isset($_POST['working_days_list']) && is_array($_POST['working_days_list'])) {
        $days_str = implode(',', $_POST['working_days_list']);
        mysqli_query($conn, "INSERT INTO app_settings (setting_key, setting_value) VALUES ('working_days', '$days_str') ON DUPLICATE KEY UPDATE setting_value='$days_str'");
    }

    // 3. Process Operating Hours (Start/End Time to String)
    if (isset($_POST['time_start']) && isset($_POST['time_end'])) {
        $timings = date("h:i A", strtotime($_POST['time_start'])) . " - " . date("h:i A", strtotime($_POST['time_end']));
        mysqli_query($conn, "INSERT INTO app_settings (setting_key, setting_value) VALUES ('clinic_timings', '$timings') ON DUPLICATE KEY UPDATE setting_value='$timings'");
    }
    
    // 4. Handle Logo Upload
    if (!empty($_FILES['clinic_logo']['name'])) {
        $target_dir = "uploads/";
        $file_ext = pathinfo($_FILES["clinic_logo"]["name"], PATHINFO_EXTENSION);
        $new_name = "clinic_logo_" . time() . "." . $file_ext;
        if (move_uploaded_file($_FILES["clinic_logo"]["tmp_name"], $target_dir . $new_name)) {
            $logo_url = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . str_replace(basename($_SERVER['SCRIPT_NAME']), '', $_SERVER['SCRIPT_NAME']) . 'uploads/' . $new_name;
            mysqli_query($conn, "INSERT INTO app_settings (setting_key, setting_value) VALUES ('clinic_logo', '$logo_url') ON DUPLICATE KEY UPDATE setting_value='$logo_url'");
        }
    }

    // 5. Handle Cover Photo Upload
    if (!empty($_FILES['clinic_cover']['name'])) {
        $target_dir = "uploads/";
        $file_ext = pathinfo($_FILES["clinic_cover"]["name"], PATHINFO_EXTENSION);
        $new_name = "clinic_cover_" . time() . "." . $file_ext;
        if (move_uploaded_file($_FILES["clinic_cover"]["tmp_name"], $target_dir . $new_name)) {
            $cover_url = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . str_replace(basename($_SERVER['SCRIPT_NAME']), '', $_SERVER['SCRIPT_NAME']) . 'uploads/' . $new_name;
            mysqli_query($conn, "INSERT INTO app_settings (setting_key, setting_value) VALUES ('clinic_cover', '$cover_url') ON DUPLICATE KEY UPDATE setting_value='$cover_url'");
        }
    }

    echo "<script>window.location.href='branding.php?success=1';</script>";
    exit;
}

// Fetch Settings
$settings_res = mysqli_query($conn, "SELECT * FROM app_settings");
$settings = [];
while ($row = mysqli_fetch_assoc($settings_res)) {
    $settings[$row['setting_key']] = $row['setting_value'];
}

// Helper to parse working days
$current_days = explode(',', ($settings['working_days'] ?? 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'));
$all_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper to parse timings
$timings = $settings['clinic_timings'] ?? '10:00 AM - 08:00 PM';
$time_parts = explode(' - ', $timings);
$start_time = isset($time_parts[0]) ? date("H:i", strtotime($time_parts[0])) : "10:00";
$end_time = isset($time_parts[1]) ? date("H:i", strtotime($time_parts[1])) : "20:00";
?>

<div class="d-flex justify-between align-center mb-4">
    <div>
        <h2 class="mb-1">Clinic Branding Hub</h2>
        <p class="text-muted" style="font-size: 12px;">Customize your clinic's public profile and operational settings</p>
    </div>
</div>

<?php if(isset($_GET['success'])): ?>
    <div id="successToast" class="premium-toast animate-slide-in">
        <div class="toast-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <div class="toast-content">
            <h4>Settings Updated!</h4>
            <p>Clinic branding and operational defaults have been saved successfully.</p>
        </div>
        <button onclick="document.getElementById('successToast').style.display='none'" class="toast-close">&times;</button>
    </div>
    <script>
        setTimeout(() => {
            const toast = document.getElementById('successToast');
            if(toast) {
                toast.classList.add('animate-slide-out');
                setTimeout(() => toast.style.display = 'none', 500);
            }
        }, 5000);
    </script>
<?php endif; ?>

<style>
.premium-toast {
    position: fixed;
    top: 24px;
    right: 24px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-left: 5px solid #10B981;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    padding: 16px 24px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 9999;
    max-width: 400px;
    border: 1px solid rgba(16, 185, 129, 0.1);
}
.toast-icon {
    width: 40px;
    height: 40px;
    background: #ECFDF5;
    color: #10B981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}
.toast-content h4 {
    margin: 0;
    font-size: 15px;
    color: #1E293B;
    font-weight: 700;
}
.toast-content p {
    margin: 2px 0 0;
    font-size: 13px;
    color: #64748B;
}
.toast-close {
    background: none;
    border: none;
    font-size: 20px;
    color: #94A3B8;
    cursor: pointer;
    padding: 0;
    margin-left: 10px;
}
.animate-slide-in {
    animation: slideInRight 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}
.animate-slide-out {
    animation: slideOutRight 0.5s ease-in forwards;
}
@keyframes slideInRight {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(120%); opacity: 0; }
}
</style>

<form method="POST" enctype="multipart/form-data">
    <div class="stats-grid" style="grid-template-columns: 2fr 1fr; gap: 24px; align-items: start;">
        <!-- Left Pane: General Identity -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
            <div class="card" style="border-radius: 16px;">
                <div class="card-header" style="background: #F8FAFC;">
                    <h3 class="card-title"><i class="fas fa-hospital" style="color: var(--primary);"></i> Clinic Identity</h3>
                </div>
                <div style="padding: 24px;">
                    <div class="form-group">
                        <label class="form-label">Clinic / Hospital Name</label>
                        <input type="text" name="settings[clinic_name]" class="form-control" value="<?= htmlspecialchars($settings['clinic_name'] ?? '') ?>" placeholder="e.g. City Care Hospital" style="border-radius: 8px;">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Full Address</label>
                        <textarea name="settings[clinic_address]" class="form-control" rows="3" placeholder="Enter physical location..." style="border-radius: 8px;"><?= htmlspecialchars($settings['clinic_address'] ?? '') ?></textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group">
                            <label class="form-label">Contact Phone</label>
                            <input type="text" name="settings[clinic_phone]" class="form-control" value="<?= htmlspecialchars($settings['clinic_phone'] ?? '') ?>" placeholder="+91 9876543210" style="border-radius: 8px;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Clinic Email</label>
                            <input type="email" name="settings[clinic_email]" class="form-control" value="<?= htmlspecialchars($settings['clinic_email'] ?? '') ?>" placeholder="contact@clinic.com" style="border-radius: 8px;">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Operating Hours & Schedule -->
            <div class="card" style="border-radius: 16px;">
                <div class="card-header" style="background: #F8FAFC;">
                    <h3 class="card-title"><i class="fas fa-clock" style="color: var(--warning);"></i> Operating Schedule</h3>
                </div>
                <div style="padding: 24px;">
                    <div class="form-group">
                        <label class="form-label">Working Days (Select all that apply)</label>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; background: #F8FAFC; padding: 15px; border-radius: 12px; border: 1px solid var(--border);">
                            <?php foreach($all_days as $day): ?>
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; background: white; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border);">
                                    <input type="checkbox" name="working_days_list[]" value="<?= $day ?>" <?= in_array($day, $current_days) ? 'checked' : '' ?> style="accent-color: var(--primary);">
                                    <span style="font-size: 12px; font-weight: 500; color: var(--secondary);"><?= $day ?></span>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group">
                            <label class="form-label">Opening Time</label>
                            <div style="position: relative;">
                                <i class="fas fa-sun" style="position: absolute; left: 12px; top: 12px; color: #F59E0B; z-index: 1;"></i>
                                <input type="time" name="time_start" class="form-control" value="<?= $start_time ?>" style="padding-left: 35px; border-radius: 8px;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Closing Time</label>
                            <div style="position: relative;">
                                <i class="fas fa-moon" style="position: absolute; left: 12px; top: 12px; color: #6366F1; z-index: 1;"></i>
                                <input type="time" name="time_end" class="form-control" value="<?= $end_time ?>" style="padding-left: 35px; border-radius: 8px;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Pane: Assets & Branding -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
            <div class="card" style="border-radius: 16px;">
                <div class="card-header" style="background: #F8FAFC;">
                    <h3 class="card-title"><i class="fas fa-image" style="color: var(--sky);"></i> Branding Assets</h3>
                </div>
                <div style="padding: 24px;">
                    <!-- Logo Upload -->
                    <div class="form-group">
                        <label class="form-label">Clinic Logo</label>
                        <div style="width: 100px; height: 100px; border-radius: 15px; background: #f1f5f9; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px dashed var(--border);">
                            <?php if(!empty($settings['clinic_logo'])): ?>
                                <img src="<?= $settings['clinic_logo'] ?>" style="width: 100%; height: 100%; object-fit: cover;">
                            <?php else: ?>
                                <i class="fas fa-image" style="font-size: 30px; color: #cbd5e1;"></i>
                            <?php endif; ?>
                        </div>
                        <input type="file" name="clinic_logo" class="form-control" style="font-size: 11px; border-radius: 8px;">
                    </div>

                    <hr style="border: none; border-top: 1px solid var(--border); margin: 20px 0;">

                    <!-- Cover Upload -->
                    <div class="form-group">
                        <label class="form-label">Cover Photo (Banner)</label>
                        <div style="width: 100%; height: 120px; border-radius: 12px; background: #f1f5f9; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px dashed var(--border);">
                            <?php if(!empty($settings['clinic_cover'])): ?>
                                <img src="<?= $settings['clinic_cover'] ?>" style="width: 100%; height: 100%; object-fit: cover;">
                            <?php else: ?>
                                <i class="fas fa-panorama" style="font-size: 30px; color: #cbd5e1;"></i>
                            <?php endif; ?>
                        </div>
                        <input type="file" name="clinic_cover" class="form-control" style="font-size: 11px; border-radius: 8px;">
                    </div>
                </div>
            </div>

            <div class="card" style="border-radius: 16px;">
                <div class="card-header" style="background: #F8FAFC;">
                    <h3 class="card-title"><i class="fas fa-money-bill-wave" style="color: var(--success);"></i> Financial Defaults</h3>
                </div>
                <div style="padding: 24px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group">
                            <label class="form-label">New Registration Fee</label>
                            <div style="position: relative;">
                                <span style="position: absolute; left: 12px; top: 10px; color: var(--text-muted); font-weight: 700;">₹</span>
                                <input type="number" name="settings[default_fee]" class="form-control" style="padding-left: 25px; border-radius: 8px;" value="<?= htmlspecialchars($settings['default_fee'] ?? '500') ?>">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Follow-up Fee</label>
                            <div style="position: relative;">
                                <span style="position: absolute; left: 12px; top: 10px; color: var(--text-muted); font-weight: 700;">₹</span>
                                <input type="number" name="settings[followup_fee]" class="form-control" style="padding-left: 25px; border-radius: 8px;" value="<?= htmlspecialchars($settings['followup_fee'] ?? '200') ?>">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="border-radius: 16px;">
                <div class="card-header" style="background: #F8FAFC;">
                    <h3 class="card-title"><i class="fas fa-user-shield" style="color: var(--danger);"></i> Clinical Capacity Limits</h3>
                </div>
                <div style="padding: 24px;">
                    <p class="text-muted mb-3" style="font-size: 11px;">Set daily limits for patient registrations. Use '0' for unlimited.</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group">
                            <label class="form-label">Max New Patients / Day</label>
                            <input type="number" name="settings[max_new_patients]" class="form-control" style="border-radius: 8px;" value="<?= htmlspecialchars($settings['max_new_patients'] ?? '0') ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Max Old Patients / Day</label>
                            <input type="number" name="settings[max_old_patients]" class="form-control" style="border-radius: 8px;" value="<?= htmlspecialchars($settings['max_old_patients'] ?? '0') ?>">
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="border-radius: 16px;">
                <div class="card-header" style="background: #F8FAFC;">
                    <h3 class="card-title"><i class="fas fa-print" style="color: var(--secondary);"></i> Prescription Settings</h3>
                </div>
                <div style="padding: 24px;">
                    <p class="text-muted mb-3" style="font-size: 11px;">Configure layout settings for printed prescriptions.</p>
                    <div class="form-group">
                        <label class="form-label">Top Margin (for Letterhead) - in pixels</label>
                        <div style="position: relative;">
                            <i class="fas fa-arrows-alt-v" style="position: absolute; left: 12px; top: 12px; color: var(--text-muted); z-index: 1;"></i>
                            <input type="number" name="settings[prescription_top_margin]" class="form-control" style="padding-left: 35px; border-radius: 8px;" value="<?= htmlspecialchars($settings['prescription_top_margin'] ?? '150') ?>" placeholder="e.g. 150">
                        </div>
                        <small class="text-muted" style="font-size: 10px;">Adjust this to leave space for your clinic's pre-printed letterhead.</small>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="d-flex justify-end mt-4" style="padding-bottom: 50px;">
        <button type="submit" name="update_settings" class="btn btn-primary" style="padding: 16px 48px; border-radius: 14px; font-weight: 800; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(2, 132, 199, 0.3); letter-spacing: 0.5px; transition: all 0.3s ease;">
            <i class="fas fa-save" style="margin-right: 10px;"></i> Update Clinic Branding
        </button>
    </div>
</form>

<style>
.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 20px -5px rgba(2, 132, 199, 0.4);
}
.justify-end { justify-content: flex-end; }
.mt-4 { margin-top: 24px; }
input[type="time"]::-webkit-calendar-picker-indicator {
    filter: invert(0.5);
    cursor: pointer;
}
</style>

<?php require_once 'components/footer.php'; ?>
