<?php
$page_title = isset($_GET['id']) ? 'Edit Patient Profile' : 'New Patient Registration';
require_once 'components/header.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$name = $phone = $email = $age = $address = '';
$patient_category_ids = [];
$patient_disease_ids = [];

if ($id > 0) {
    $result = mysqli_query($conn, "SELECT * FROM patients WHERE id = $id");
    if ($row = mysqli_fetch_assoc($result)) {
        $name = $row['name'];
        $phone = $row['phone'];
        $email = $row['email'];
        $age = $row['age'];
        $address = $row['address'];
    }
    
    $c_result = mysqli_query($conn, "SELECT category_id FROM patient_categories WHERE patient_id = $id");
    while ($c_row = mysqli_fetch_assoc($c_result)) {
        $patient_category_ids[] = $c_row['category_id'];
    }

    $d_result = mysqli_query($conn, "SELECT disease_id FROM patient_diseases WHERE patient_id = $id");
    while ($d_row = mysqli_fetch_assoc($d_result)) {
        $patient_disease_ids[] = $d_row['disease_id'];
    }
}

// Fetch lookups
$categories = mysqli_query($conn, "SELECT * FROM categories ORDER BY name ASC");
$diseases = mysqli_query($conn, "SELECT * FROM diseases ORDER BY name ASC");

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $name = mysqli_real_escape_string($conn, $_POST['name']);
    $phone = mysqli_real_escape_string($conn, $_POST['phone']);
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $age = (int)$_POST['age'];
    $address = mysqli_real_escape_string($conn, $_POST['address']);

    if ($id > 0) {
        $sql = "UPDATE patients SET name='$name', phone='$phone', email='$email', age=$age, address='$address' WHERE id=$id";
    } else {
        $sql = "INSERT INTO patients (name, phone, email, age, address) VALUES ('$name', '$phone', '$email', $age, '$address')";
    }

    if (mysqli_query($conn, $sql)) {
        $patient_id = $id > 0 ? $id : mysqli_insert_id($conn);
        
        // Handle categories
        mysqli_query($conn, "DELETE FROM patient_categories WHERE patient_id = $patient_id");
        if (isset($_POST['categories']) && is_array($_POST['categories'])) {
            foreach ($_POST['categories'] as $c_id) {
                $c_id = (int)$c_id;
                mysqli_query($conn, "INSERT INTO patient_categories (patient_id, category_id) VALUES ($patient_id, $c_id)");
            }
        }

        // Handle diseases
        mysqli_query($conn, "DELETE FROM patient_diseases WHERE patient_id = $patient_id");
        if (isset($_POST['diseases']) && is_array($_POST['diseases'])) {
            foreach ($_POST['diseases'] as $d_id) {
                $d_id = (int)$d_id;
                mysqli_query($conn, "INSERT INTO patient_diseases (patient_id, disease_id) VALUES ($patient_id, $d_id)");
            }
        }
        
        header("Location: patients.php");
        exit;
    } else {
        $error = "Error: " . mysqli_error($conn);
    }
}
?>

<div style="max-width: 800px; margin: 0 auto;">
    <div class="d-flex justify-between align-center mb-4">
        <div>
            <h2 class="mb-1"><?= $page_title ?></h2>
            <p class="text-muted" style="font-size: 12px;">Fill in the medical and contact information for the patient</p>
        </div>
        <a href="patients.php" class="btn btn-secondary" style="border-radius: 10px;"><i class="fas fa-times"></i> Cancel</a>
    </div>

    <?php if(isset($error)): ?>
        <div class="badge badge-overdue mb-4" style="width: 100%; padding: 12px; font-size: 14px; text-align: center;">
            <i class="fas fa-exclamation-triangle"></i> <?= $error ?>
        </div>
    <?php endif; ?>

    <form method="POST">
        <div class="card" style="border-radius: 16px; margin-bottom: 24px;">
            <div class="card-header" style="background: #F8FAFC;">
                <h3 class="card-title"><i class="fas fa-user-circle" style="color: var(--primary);"></i> Personal Information</h3>
            </div>
            <div style="padding: 24px;">
                <div class="form-group">
                    <label class="form-label">Full Patient Name <span style="color:var(--danger)">*</span></label>
                    <input type="text" name="name" class="form-control" value="<?= htmlspecialchars($name) ?>" placeholder="e.g. John Doe" required style="border-radius: 8px;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="form-group">
                        <label class="form-label">Phone Number <span style="color:var(--danger)">*</span></label>
                        <input type="text" name="phone" class="form-control" value="<?= htmlspecialchars($phone) ?>" placeholder="+91 00000 00000" required style="border-radius: 8px;">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Age (Years)</label>
                        <input type="number" name="age" class="form-control" value="<?= htmlspecialchars($age) ?>" placeholder="e.g. 25" style="border-radius: 8px;">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Email Address (Optional)</label>
                    <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($email) ?>" placeholder="patient@example.com" style="border-radius: 8px;">
                </div>

                <div class="form-group">
                    <label class="form-label">Physical Address</label>
                    <textarea name="address" class="form-control" rows="3" placeholder="Enter complete address..." style="border-radius: 8px;"><?= htmlspecialchars($address) ?></textarea>
                </div>
            </div>
        </div>

        <div class="card" style="border-radius: 16px;">
            <div class="card-header" style="background: #F8FAFC;">
                <h3 class="card-title"><i class="fas fa-notes-medical" style="color: var(--sky);"></i> Medical Mapping</h3>
            </div>
            <div style="padding: 24px;">
                <div class="form-group">
                    <label class="form-label">Service Categories</label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; background: #F8FAFC; padding: 15px; border-radius: 12px; border: 1px solid var(--border);">
                        <?php while($c = mysqli_fetch_assoc($categories)): ?>
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; background: white; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border);">
                                <input type="checkbox" name="categories[]" value="<?= $c['id'] ?>" <?= in_array($c['id'], $patient_category_ids) ? 'checked' : '' ?> style="accent-color: var(--primary);">
                                <span style="font-size: 12px; font-weight: 500; color: var(--secondary);"><?= htmlspecialchars($c['name']) ?></span>
                            </label>
                        <?php endwhile; ?>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Pre-existing Diseases</label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; background: #F8FAFC; padding: 15px; border-radius: 12px; border: 1px solid var(--border);">
                        <?php while($d = mysqli_fetch_assoc($diseases)): ?>
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; background: white; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border);">
                                <input type="checkbox" name="diseases[]" value="<?= $d['id'] ?>" <?= in_array($d['id'], $patient_disease_ids) ? 'checked' : '' ?> style="accent-color: var(--sky);">
                                <span style="font-size: 12px; font-weight: 500; color: var(--secondary);"><?= htmlspecialchars($d['name']) ?></span>
                            </label>
                        <?php endwhile; ?>
                    </div>
                </div>
            </div>
        </div>

        <div class="d-flex justify-end mt-4" style="padding-bottom: 50px;">
            <button type="submit" class="btn btn-primary" style="padding: 12px 40px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 10px 15px -3px rgba(2, 132, 199, 0.2);">
                <i class="fas fa-save"></i> <?= $id > 0 ? 'Update Profile' : 'Complete Registration' ?>
            </button>
        </div>
    </form>
</div>

<style>
.justify-end { justify-content: flex-end; }
.mt-4 { margin-top: 24px; }
</style>

<?php require_once 'components/footer.php'; ?>

<?php require_once 'components/footer.php'; ?>
