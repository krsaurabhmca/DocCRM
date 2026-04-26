<?php
ob_start();
$page_title = isset($_GET['id']) ? 'Edit Follow-up' : 'Add Follow-up';
require_once 'components/header.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$patient_id = $followup_date = $followup_type = $status = $notes = '';
$doctor_id_val = 0;

if ($id > 0) {
    $result = mysqli_query($conn, "SELECT * FROM followups WHERE id = $id AND clinic_id = $clinic_id");
    if ($row = mysqli_fetch_assoc($result)) {
        $patient_id = $row['patient_id'];
        $followup_date = $row['followup_date'];
        $followup_type = $row['followup_type'];
        $status = $row['status'];
        $notes = $row['notes'];
        $doctor_id_val = (int)$row['doctor_id'];
    } else {
        header("Location: followups.php");
        exit;
    }
}

// Fetch all patients for dropdown (isolated by clinic)
$patients = mysqli_query($conn, "SELECT id, name FROM patients WHERE clinic_id = $clinic_id ORDER BY name ASC");
$doctors_list = mysqli_query($conn, "SELECT * FROM doctors WHERE clinic_id = $clinic_id AND is_active = 1 ORDER BY name ASC");

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $patient_id = (int)$_POST['patient_id'];
    $followup_date = mysqli_real_escape_string($conn, $_POST['followup_date']);
    $followup_type = mysqli_real_escape_string($conn, $_POST['followup_type']);
    $status = mysqli_real_escape_string($conn, $_POST['status']);
    $notes = mysqli_real_escape_string($conn, $_POST['notes']);
    $doctor_id_val = (int)$_POST['doctor_id'];

    if ($id > 0) {
        $sql = "UPDATE followups SET patient_id=$patient_id, followup_date='$followup_date', followup_type='$followup_type', status='$status', notes='$notes', doctor_id=$doctor_id_val WHERE id=$id AND clinic_id=$clinic_id";
    } else {
        $sql = "INSERT INTO followups (clinic_id, patient_id, followup_date, followup_type, status, notes, doctor_id) VALUES ($clinic_id, $patient_id, '$followup_date', '$followup_type', '$status', '$notes', $doctor_id_val)";
    }

    if (mysqli_query($conn, $sql)) {
        header("Location: followups.php");
        exit;
    } else {
        $error = "Error: " . mysqli_error($conn);
    }
}
?>

<div style="max-width: 600px; margin: 0 auto;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h2><?= $page_title ?></h2>
        <a href="followups.php" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back</a>
    </div>

    <div class="card">
        <div style="padding: 24px;">
            <?php if(isset($error)): ?>
                <div style="color: var(--danger); margin-bottom: 16px;"><?= $error ?></div>
            <?php endif; ?>
            
            <form method="POST">
                <div class="form-group">
                    <label class="form-label">Select Patient <span style="color:red">*</span></label>
                    <select name="patient_id" class="form-control" required>
                        <option value="">-- Choose Patient --</option>
                        <?php while($p = mysqli_fetch_assoc($patients)): ?>
                            <option value="<?= $p['id'] ?>" <?= $patient_id == $p['id'] ? 'selected' : '' ?>><?= htmlspecialchars($p['name']) ?></option>
                        <?php endwhile; ?>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Assign Doctor (Optional)</label>
                    <select name="doctor_id" class="form-control">
                        <option value="0">-- Choose Doctor --</option>
                        <?php while($d = mysqli_fetch_assoc($doctors_list)): ?>
                            <option value="<?= $d['id'] ?>" <?= $doctor_id_val == $d['id'] ? 'selected' : '' ?>>Dr. <?= htmlspecialchars($d['name']) ?> (<?= htmlspecialchars($d['specialization']) ?>)</option>
                        <?php endwhile; ?>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Follow-up Date <span style="color:red">*</span></label>
                    <input type="date" name="followup_date" class="form-control" value="<?= htmlspecialchars($followup_date) ?>" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Type (e.g., Call, Email, Visit) <span style="color:red">*</span></label>
                    <input type="text" name="followup_type" class="form-control" value="<?= htmlspecialchars($followup_type) ?>" placeholder="Call" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select name="status" class="form-control">
                        <option value="Scheduled" <?= $status == 'Scheduled' ? 'selected' : '' ?>>Scheduled</option>
                        <option value="Completed" <?= $status == 'Completed' ? 'selected' : '' ?>>Completed</option>
                        <option value="Cancelled" <?= $status == 'Cancelled' ? 'selected' : '' ?>>Cancelled</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea name="notes" class="form-control" rows="3"><?= htmlspecialchars($notes) ?></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                    <i class="fas fa-save"></i> Save Follow-up
                </button>
            </form>
        </div>
    </div>
</div>

<?php require_once 'components/footer.php'; 
ob_end_flush();
?>
