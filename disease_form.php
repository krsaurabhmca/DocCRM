<?php
$page_title = isset($_GET['id']) ? 'Edit Disease' : 'Add Disease';
require_once 'components/header.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$name = '';

if ($id > 0) {
    $result = mysqli_query($conn, "SELECT * FROM diseases WHERE id = $id");
    if ($row = mysqli_fetch_assoc($result)) {
        $name = $row['name'];
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $name = mysqli_real_escape_string($conn, $_POST['name']);

    // Check for duplicate
    $check_sql = "SELECT id FROM diseases WHERE name = '$name' AND id != $id";
    $check_result = mysqli_query($conn, $check_sql);

    if (mysqli_num_rows($check_result) > 0) {
        $error = "A disease with this name already exists.";
    } else {
        if ($id > 0) {
            $sql = "UPDATE diseases SET name='$name' WHERE id=$id";
        } else {
            $sql = "INSERT INTO diseases (name) VALUES ('$name')";
        }

        if (mysqli_query($conn, $sql)) {
            header("Location: diseases.php");
            exit;
        } else {
            $error = "Error: " . mysqli_error($conn);
        }
    }
}
?>

<div style="max-width: 600px; margin: 0 auto;">
    <div class="d-flex justify-between align-center mb-4">
        <h2><?= $page_title ?></h2>
        <a href="diseases.php" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back</a>
    </div>

    <div class="card">
        <div style="padding: 24px;">
            <?php if(isset($error)): ?>
                <div style="color: var(--danger); margin-bottom: 16px;"><?= $error ?></div>
            <?php endif; ?>
            
            <form method="POST">
                <div class="form-group">
                    <label class="form-label">Disease Name <span style="color:red">*</span></label>
                    <input type="text" name="name" class="form-control" value="<?= htmlspecialchars($name) ?>" required>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                    <i class="fas fa-save"></i> Save Disease
                </button>
            </form>
        </div>
    </div>
</div>

<?php require_once 'components/footer.php'; ?>
