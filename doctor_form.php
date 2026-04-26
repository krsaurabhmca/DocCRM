<?php
ob_start();
$page_title = isset($_GET['id']) ? 'Edit Doctor Profile' : 'Add New Doctor';
require_once 'components/header.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$name = $specialization = $qualification = $experience = $phone = '';
$is_active = 1;

if ($id > 0) {
    $result = mysqli_query($conn, "SELECT * FROM doctors WHERE id = $id AND clinic_id = $clinic_id");
    if ($row = mysqli_fetch_assoc($result)) {
        $name = $row['name'];
        $specialization = $row['specialization'];
        $qualification = $row['qualification'];
        $experience = $row['experience'];
        $phone = $row['phone'];
        $is_active = $row['is_active'];
    } else {
        header("Location: doctors.php");
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $name = mysqli_real_escape_string($conn, $_POST['name']);
    $specialization = mysqli_real_escape_string($conn, $_POST['specialization']);
    $qualification = mysqli_real_escape_string($conn, $_POST['qualification']);
    $experience = (int)$_POST['experience'];
    $phone = mysqli_real_escape_string($conn, $_POST['phone']);
    $is_active = isset($_POST['is_active']) ? 1 : 0;

    if ($id > 0) {
        $sql = "UPDATE doctors SET name='$name', specialization='$specialization', qualification='$qualification', experience=$experience, phone='$phone', is_active=$is_active WHERE id=$id AND clinic_id=$clinic_id";
    } else {
        $sql = "INSERT INTO doctors (clinic_id, name, specialization, qualification, experience, phone, is_active) VALUES ($clinic_id, '$name', '$specialization', '$qualification', $experience, '$phone', $is_active)";
    }

    if (mysqli_query($conn, $sql)) {
        header("Location: doctors.php");
        exit;
    } else {
        $error = "Error: " . mysqli_error($conn);
    }
}
?>

<div style="max-width: 600px; margin: 0 auto;">
    <div class="d-flex justify-between align-center mb-4">
        <div>
            <h2 class="mb-1"><?= $page_title ?></h2>
            <p class="text-muted" style="font-size: 12px;">Enter the professional details for the medical staff</p>
        </div>
        <a href="doctors.php" class="btn btn-secondary" style="border-radius: 10px;"><i class="fas fa-times"></i> Cancel</a>
    </div>

    <?php if(isset($error)): ?>
        <div class="badge badge-overdue mb-4" style="width: 100%; padding: 12px; font-size: 14px; text-align: center;">
            <i class="fas fa-exclamation-triangle"></i> <?= $error ?>
        </div>
    <?php endif; ?>

    <form method="POST">
        <div class="card" style="border-radius: 16px;">
            <div style="padding: 24px;">
                <div class="form-group">
                    <label class="form-label">Doctor Name <span style="color:var(--danger)">*</span></label>
                    <input type="text" name="name" class="form-control" value="<?= htmlspecialchars($name) ?>" placeholder="e.g. Dr. John Smith" required style="border-radius: 8px;">
                </div>

                <div class="form-group">
                    <label class="form-label">Specialization <span style="color:var(--danger)">*</span></label>
                    <input type="text" name="specialization" class="form-control" value="<?= htmlspecialchars($specialization) ?>" placeholder="e.g. Cardiology, Pediatrics" required style="border-radius: 8px;">
                </div>

                <div class="form-group">
                    <label class="form-label">Qualification</label>
                    <input type="text" name="qualification" class="form-control" value="<?= htmlspecialchars($qualification) ?>" placeholder="e.g. MBBS, MD" style="border-radius: 8px;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="form-group">
                        <label class="form-label">Years of Experience</label>
                        <input type="number" name="experience" class="form-control" value="<?= htmlspecialchars($experience) ?>" placeholder="e.g. 10" style="border-radius: 8px;">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contact Phone</label>
                        <input type="text" name="phone" class="form-control" value="<?= htmlspecialchars($phone) ?>" placeholder="+91 00000 00000" style="border-radius: 8px;">
                    </div>
                </div>

                <div class="form-group mt-3">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; background: #F8FAFC; padding: 15px; border-radius: 12px; border: 1px solid var(--border);">
                        <input type="checkbox" name="is_active" value="1" <?= $is_active ? 'checked' : '' ?> style="accent-color: var(--primary); width: 18px; height: 18px;">
                        <div>
                            <span style="font-weight: 700; color: var(--secondary); display: block;">Active Status</span>
                            <span style="font-size: 11px; color: var(--text-muted);">Is this doctor currently available for appointments?</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>

        <div class="d-flex justify-end mt-4" style="padding-bottom: 50px;">
            <button type="submit" class="btn btn-primary" style="padding: 12px 40px; border-radius: 12px; font-weight: 700; font-size: 15px;">
                <i class="fas fa-save"></i> <?= $id > 0 ? 'Update Profile' : 'Save Profile' ?>
            </button>
        </div>
    </form>
</div>

<?php require_once 'components/footer.php'; 
ob_end_flush();
?>
