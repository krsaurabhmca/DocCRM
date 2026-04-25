<?php
$page_title = "Clinic Branding & Settings";
require_once 'components/header.php';

// Handle Settings Update
if (isset($_POST['update_settings'])) {
    foreach ($_POST['settings'] as $key => $value) {
        $key = mysqli_real_escape_string($conn, $key);
        $value = mysqli_real_escape_string($conn, $value);
        mysqli_query($conn, "INSERT INTO app_settings (setting_key, setting_value) VALUES ('$key', '$value') ON DUPLICATE KEY UPDATE setting_value='$value'");
    }
    
    // Handle Logo Upload
    if (!empty($_FILES['clinic_logo']['name'])) {
        $target_dir = "uploads/";
        $file_ext = pathinfo($_FILES["clinic_logo"]["name"], PATHINFO_EXTENSION);
        $new_name = "clinic_logo_" . time() . "." . $file_ext;
        if (move_uploaded_file($_FILES["clinic_logo"]["tmp_name"], $target_dir . $new_name)) {
            $logo_url = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . str_replace(basename($_SERVER['SCRIPT_NAME']), '', $_SERVER['SCRIPT_NAME']) . 'uploads/' . $new_name;
            mysqli_query($conn, "INSERT INTO app_settings (setting_key, setting_value) VALUES ('clinic_logo', '$logo_url') ON DUPLICATE KEY UPDATE setting_value='$logo_url'");
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
?>

<div class="d-flex justify-between align-center mb-4">
    <div>
        <h2 class="mb-1">Clinic Branding Hub</h2>
        <p class="text-muted" style="font-size: 12px;">Customize your clinic's public profile and operational settings</p>
    </div>
</div>

<?php if(isset($_GET['success'])): ?>
    <div class="badge badge-submitted mb-4" style="width: 100%; padding: 12px; font-size: 14px;">
        <i class="fas fa-check-circle"></i> Branding and settings updated successfully!
    </div>
<?php endif; ?>

<form method="POST" enctype="multipart/form-data">
    <div class="stats-grid" style="grid-template-columns: 2fr 1fr; gap: 24px; align-items: start;">
        <!-- General Identity -->
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">General Identity</h3>
            </div>
            <div style="padding: 20px;">
                <div class="form-group">
                    <label class="form-label">Clinic / Hospital Name</label>
                    <input type="text" name="settings[clinic_name]" class="form-control" value="<?= htmlspecialchars($settings['clinic_name'] ?? '') ?>" placeholder="e.g. City Care Hospital">
                </div>
                <div class="form-group">
                    <label class="form-label">Full Address</label>
                    <textarea name="settings[clinic_address]" class="form-control" rows="3" placeholder="Enter physical location..."><?= htmlspecialchars($settings['clinic_address'] ?? '') ?></textarea>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label class="form-label">Contact Phone</label>
                        <input type="text" name="settings[clinic_phone]" class="form-control" value="<?= htmlspecialchars($settings['clinic_phone'] ?? '') ?>" placeholder="+91 9876543210">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Clinic Email</label>
                        <input type="email" name="settings[clinic_email]" class="form-control" value="<?= htmlspecialchars($settings['clinic_email'] ?? '') ?>" placeholder="contact@clinic.com">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Registration Fee (Default)</label>
                    <div style="position: relative;">
                        <span style="position: absolute; left: 12px; top: 8px; color: var(--text-muted);">₹</span>
                        <input type="number" name="settings[default_fee]" class="form-control" style="padding-left: 25px;" value="<?= htmlspecialchars($settings['default_fee'] ?? '500') ?>">
                    </div>
                </div>
            </div>
        </div>

        <!-- Assets & Logo -->
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Assets & Branding</h3>
            </div>
            <div style="padding: 20px;">
                <div class="form-group" style="text-align: center;">
                    <label class="form-label" style="text-align: left;">Clinic Logo</label>
                    <div style="width: 100px; height: 100px; border-radius: 12px; background: #f1f5f9; margin: 10px auto; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px dashed var(--border);">
                        <?php if(!empty($settings['clinic_logo'])): ?>
                            <img src="<?= $settings['clinic_logo'] ?>" style="width: 100%; height: 100%; object-fit: cover;">
                        <?php else: ?>
                            <i class="fas fa-image" style="font-size: 30px; color: #cbd5e1;"></i>
                        <?php endif; ?>
                    </div>
                    <input type="file" name="clinic_logo" class="form-control" style="font-size: 11px;">
                </div>
                <hr style="border: none; border-top: 1px solid var(--border); margin: 20px 0;">
                <div class="form-group">
                    <label class="form-label">Working Days</label>
                    <input type="text" name="settings[working_days]" class="form-control" value="<?= htmlspecialchars($settings['working_days'] ?? 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday') ?>" placeholder="Comma separated days">
                </div>
                <div class="form-group">
                    <label class="form-label">Operating Hours</label>
                    <input type="text" name="settings[clinic_timings]" class="form-control" value="<?= htmlspecialchars($settings['clinic_timings'] ?? '10:00 AM - 08:00 PM') ?>" placeholder="e.g. 10:00 AM - 08:00 PM">
                </div>
            </div>
        </div>
    </div>

    <div class="d-flex justify-end mt-4" style="padding-bottom: 50px;">
        <button type="submit" name="update_settings" class="btn btn-primary" style="padding: 12px 30px; border-radius: 10px; font-weight: 700;">
            <i class="fas fa-save"></i> Save All Changes
        </button>
    </div>
</form>

<style>
.justify-end { justify-content: flex-end; }
.mt-4 { margin-top: 24px; }
</style>

<?php require_once 'components/footer.php'; ?>
