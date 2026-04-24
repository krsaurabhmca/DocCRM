<?php
$page_title = 'Patients Directory';
require_once 'components/header.php';

// Handle deletion
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    mysqli_query($conn, "DELETE FROM patients WHERE id = $id");
    header("Location: patients.php");
    exit;
}

// Handle Search & Filter
$search = isset($_GET['search']) ? mysqli_real_escape_string($conn, $_GET['search']) : '';
$category_id = isset($_GET['category_id']) ? (int)$_GET['category_id'] : 0;

$whereClause = "WHERE 1=1";
if ($search) {
    $whereClause .= " AND (p.name LIKE '%$search%' OR p.phone LIKE '%$search%' OR p.email LIKE '%$search%')";
}
if ($category_id > 0) {
    $whereClause .= " AND EXISTS (SELECT 1 FROM patient_categories pc WHERE pc.patient_id = p.id AND pc.category_id = $category_id)";
}

$query = "SELECT p.* FROM patients p $whereClause ORDER BY p.id DESC";
$patients = mysqli_query($conn, $query);

// Fetch categories for filter
$categories_list = mysqli_query($conn, "SELECT * FROM categories ORDER BY name ASC");
?>

<div class="d-flex justify-between align-center mb-4">
    <h2>Patient Directory</h2>
    <a href="patient_form.php" class="btn btn-primary"><i class="fas fa-plus"></i> Add Patient</a>
</div>

<div class="card mb-4" style="padding: 16px;">
    <form method="GET" class="d-flex align-center" style="gap: 10px; flex-wrap: wrap;">
        <input type="text" name="search" class="form-control" placeholder="Search name/phone..." value="<?= htmlspecialchars($search) ?>" style="max-width: 250px;">
        
        <select name="category_id" class="form-control" style="max-width: 200px;">
            <option value="">All Categories</option>
            <?php while($cat = mysqli_fetch_assoc($categories_list)): ?>
                <option value="<?= $cat['id'] ?>" <?= $category_id == $cat['id'] ? 'selected' : '' ?>><?= htmlspecialchars($cat['name']) ?></option>
            <?php endwhile; ?>
        </select>

        <button type="submit" class="btn btn-primary"><i class="fas fa-search"></i> Filter</button>
        <?php if($search || $category_id): ?>
            <a href="patients.php" class="btn btn-secondary">Clear</a>
        <?php endif; ?>
    </form>
</div>

<div class="card">
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Age</th>
                    <th>Categories</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php while($row = mysqli_fetch_assoc($patients)): 
                    $p_id = $row['id'];
                    $c_res = mysqli_query($conn, "SELECT c.name FROM categories c JOIN patient_categories pc ON c.id = pc.category_id WHERE pc.patient_id = $p_id");
                    $cats = [];
                    while($c = mysqli_fetch_assoc($c_res)){ $cats[] = $c['name']; }
                ?>
                <tr>
                    <td>#<?= $row['id'] ?></td>
                    <td><strong><?= htmlspecialchars($row['name']) ?></strong></td>
                    <td><?= htmlspecialchars($row['phone']) ?></td>
                    <td><?= $row['age'] ? htmlspecialchars($row['age']) . ' Yrs' : '<span class="text-muted">N/A</span>' ?></td>
                    <td><?= !empty($cats) ? implode(', ', $cats) : '<span class="text-muted">None</span>' ?></td>
                    <td>
                        <a href="patient_form.php?id=<?= $row['id'] ?>" class="btn btn-sm btn-secondary" title="Edit"><i class="fas fa-edit"></i></a>
                        <a href="patients.php?delete=<?= $row['id'] ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure you want to delete this patient?')" title="Delete"><i class="fas fa-trash"></i></a>
                    </td>
                </tr>
                <?php endwhile; ?>
                <?php if(mysqli_num_rows($patients) == 0): ?>
                <tr><td colspan="5" style="text-align: center;">No patients found.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once 'components/footer.php'; ?>
