<?php
$page_title = isset($_GET['id']) ? 'Edit Patient' : 'Add Patient';
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

<div style="max-width: 600px; margin: 0 auto;">
    <div class="d-flex justify-between align-center mb-4">
        <h2><?= $page_title ?></h2>
        <a href="patients.php" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back</a>
    </div>

    <div class="card">
        <div style="padding: 24px;">
            <?php if(isset($error)): ?>
                <div style="color: var(--danger); margin-bottom: 16px;"><?= $error ?></div>
            <?php endif; ?>
            
            <form method="POST">
                <div class="form-group">
                    <label class="form-label">Full Name <span style="color:red">*</span></label>
                    <input type="text" name="name" class="form-control" value="<?= htmlspecialchars($name) ?>" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Patient Categories</label>
                    <div style="max-height: 150px; overflow-y: auto; border: 1px solid var(--border); padding: 10px; border-radius: 6px; background: #fff;">
                        <?php while($c = mysqli_fetch_assoc($categories)): ?>
                            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; cursor: pointer;">
                                <input type="checkbox" name="categories[]" value="<?= $c['id'] ?>" <?= in_array($c['id'], $patient_category_ids) ? 'checked' : '' ?>>
                                <span style="font-size: 13px;"><?= htmlspecialchars($c['name']) ?></span>
                            </label>
                        <?php endwhile; ?>
                        <?php if(mysqli_num_rows($categories) == 0): ?>
                            <span class="text-muted" style="font-size:12px;">No categories available.</span>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Popular Diseases Mapping</label>
                    <div style="max-height: 150px; overflow-y: auto; border: 1px solid var(--border); padding: 10px; border-radius: 6px; background: #fff;">
                        <?php while($d = mysqli_fetch_assoc($diseases)): ?>
                            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; cursor: pointer;">
                                <input type="checkbox" name="diseases[]" value="<?= $d['id'] ?>" <?= in_array($d['id'], $patient_disease_ids) ? 'checked' : '' ?>>
                                <span style="font-size: 13px;"><?= htmlspecialchars($d['name']) ?></span>
                            </label>
                        <?php endwhile; ?>
                        <?php if(mysqli_num_rows($diseases) == 0): ?>
                            <span class="text-muted" style="font-size:12px;">No diseases available.</span>
                        <?php endif; ?>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Phone Number <span style="color:red">*</span></label>
                    <input type="text" name="phone" class="form-control" value="<?= htmlspecialchars($phone) ?>" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($email) ?>">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Age</label>
                    <input type="number" name="age" class="form-control" value="<?= htmlspecialchars($age) ?>">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Address</label>
                    <textarea name="address" class="form-control" rows="3"><?= htmlspecialchars($address) ?></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                    <i class="fas fa-save"></i> Save Patient
                </button>
            </form>
        </div>
    </div>
</div>

<?php require_once 'components/footer.php'; ?>
