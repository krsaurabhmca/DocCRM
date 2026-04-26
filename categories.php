<?php
ob_start();
$page_title = 'Patient Categories';
require_once 'components/header.php';

if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    mysqli_query($conn, "DELETE FROM categories WHERE id = $id AND clinic_id = $clinic_id");
    header("Location: categories.php");
    exit;
}

$categories = mysqli_query($conn, "SELECT * FROM categories WHERE clinic_id = $clinic_id ORDER BY name ASC");
?>

<div class="d-flex justify-between align-center mb-4">
    <h2>Patient Categories</h2>
    <a href="category_form.php" class="btn btn-primary"><i class="fas fa-plus"></i> Add Category</a>
</div>

<div class="card">
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Category Name</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php while($row = mysqli_fetch_assoc($categories)): ?>
                <tr>
                    <td>#<?= $row['id'] ?></td>
                    <td><?= htmlspecialchars($row['name']) ?></td>
                    <td>
                        <a href="category_form.php?id=<?= $row['id'] ?>" class="btn btn-sm btn-secondary" title="Edit"><i class="fas fa-edit"></i></a>
                        <a href="categories.php?delete=<?= $row['id'] ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure you want to delete this category?')" title="Delete"><i class="fas fa-trash"></i></a>
                    </td>
                </tr>
                <?php endwhile; ?>
                <?php if(mysqli_num_rows($categories) == 0): ?>
                <tr><td colspan="3" style="text-align: center;">No categories found.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once 'components/footer.php'; 
ob_end_flush();
?>
