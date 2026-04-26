<?php
ob_start();
$page_title = isset($_GET['id']) ? 'Edit Reminder' : 'Add Reminder';
require_once 'components/header.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$patient_id = $document_name = $due_date = $status = $remarks = '';

if ($id > 0) {
    $result = mysqli_query($conn, "SELECT * FROM reminders WHERE id = $id AND clinic_id = $clinic_id");
    if ($row = mysqli_fetch_assoc($result)) {
        $patient_id = $row['patient_id'];
        $document_name = $row['document_name'];
        $due_date = $row['due_date'];
        $status = $row['status'];
        $remarks = $row['remarks'];
    } else {
        header("Location: reminders.php");
        exit;
    }
}

// Fetch all patients for dropdown (isolated by clinic)
$patients = mysqli_query($conn, "SELECT id, name FROM patients WHERE clinic_id = $clinic_id ORDER BY name ASC");

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $patient_id = (int)$_POST['patient_id'];
    $document_name = mysqli_real_escape_string($conn, $_POST['document_name']);
    $due_date = mysqli_real_escape_string($conn, $_POST['due_date']);
    $status = mysqli_real_escape_string($conn, $_POST['status']);
    $remarks = mysqli_real_escape_string($conn, $_POST['remarks']);

    if ($id > 0) {
        $sql = "UPDATE reminders SET patient_id=$patient_id, document_name='$document_name', due_date='$due_date', status='$status', remarks='$remarks' WHERE id=$id AND clinic_id=$clinic_id";
    } else {
        $sql = "INSERT INTO reminders (clinic_id, patient_id, document_name, due_date, status, remarks) VALUES ($clinic_id, $patient_id, '$document_name', '$due_date', '$status', '$remarks')";
    }

    if (mysqli_query($conn, $sql)) {
        header("Location: reminders.php");
        exit;
    } else {
        $error = "Error: " . mysqli_error($conn);
    }
}
?>

<div style="max-width: 600px; margin: 0 auto;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h2><?= $page_title ?></h2>
        <a href="reminders.php" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back</a>
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
                    <label class="form-label">Document Name <span style="color:red">*</span></label>
                    <input type="text" name="document_name" class="form-control" value="<?= htmlspecialchars($document_name) ?>" placeholder="e.g. Medical Report, ID Proof" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Due Date <span style="color:red">*</span></label>
                    <input type="date" name="due_date" class="form-control" value="<?= htmlspecialchars($due_date) ?>" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select name="status" class="form-control">
                        <option value="Pending" <?= $status == 'Pending' ? 'selected' : '' ?>>Pending</option>
                        <option value="Submitted" <?= $status == 'Submitted' ? 'selected' : '' ?>>Submitted</option>
                        <option value="Overdue" <?= $status == 'Overdue' ? 'selected' : '' ?>>Overdue</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Remarks / Notes</label>
                    <textarea name="remarks" class="form-control" rows="3"><?= htmlspecialchars($remarks) ?></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                    <i class="fas fa-save"></i> Save Reminder
                </button>
            </form>
        </div>
    </div>
</div>

<?php require_once 'components/footer.php'; 
ob_end_flush();
?>
