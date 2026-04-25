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
    <div>
        <h2 class="mb-1">Patient Directory</h2>
        <p class="text-muted" style="font-size: 12px;">Manage and browse your complete patient database</p>
    </div>
    <a href="patient_form.php" class="btn btn-primary" style="padding: 10px 20px; border-radius: 10px;"><i class="fas fa-user-plus"></i> Add New Patient</a>
</div>

<div class="card mb-4" style="padding: 20px; border-radius: 16px;">
    <form method="GET" class="d-flex align-center" style="gap: 15px; flex-wrap: wrap;">
        <div style="position: relative; flex: 1; min-width: 250px;">
            <i class="fas fa-search" style="position: absolute; left: 12px; top: 12px; color: #94A3B8;"></i>
            <input type="text" name="search" class="form-control" placeholder="Search by name, phone or email..." value="<?= htmlspecialchars($search) ?>" style="padding-left: 35px; border-radius: 10px;">
        </div>
        
        <select name="category_id" class="form-control" style="max-width: 220px; border-radius: 10px;">
            <option value="">All Categories</option>
            <?php mysqli_data_seek($categories_list, 0); while($cat = mysqli_fetch_assoc($categories_list)): ?>
                <option value="<?= $cat['id'] ?>" <?= $category_id == $cat['id'] ? 'selected' : '' ?>><?= htmlspecialchars($cat['name']) ?></option>
            <?php endwhile; ?>
        </select>

        <button type="submit" class="btn btn-primary" style="border-radius: 10px;"><i class="fas fa-filter"></i> Filter</button>
        <?php if($search || $category_id): ?>
            <a href="patients.php" class="btn btn-secondary" style="border-radius: 10px;">Clear</a>
        <?php endif; ?>
    </form>
</div>

<div class="card" style="border-radius: 16px; overflow: hidden;">
    <div class="table-responsive">
        <table style="border-collapse: separate; border-spacing: 0;">
            <thead>
                <tr>
                    <th style="padding: 15px 24px;">Patient Information</th>
                    <th>Age / Gender</th>
                    <th>Medical Categories</th>
                    <th>Joined Date</th>
                    <th style="text-align: right; padding: 15px 24px;">Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php while($row = mysqli_fetch_assoc($patients)): 
                    $p_id = $row['id'];
                    $c_res = mysqli_query($conn, "SELECT c.name FROM categories c JOIN patient_categories pc ON c.id = pc.category_id WHERE pc.patient_id = $p_id");
                    $cats = [];
                    while($c = mysqli_fetch_assoc($c_res)){ $cats[] = $c['name']; }
                    
                    $initials = strtoupper(substr($row['name'], 0, 1));
                    $gender_icon = ($row['gender'] == 'Female') ? 'venus' : 'mars';
                    $gender_color = ($row['gender'] == 'Female') ? '#DB2777' : '#0284C7';
                ?>
                <tr>
                    <td style="padding: 15px 24px;">
                        <div class="d-flex align-center" style="gap: 12px;">
                            <div style="width: 40px; height: 40px; border-radius: 12px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px;">
                                <?= $initials ?>
                            </div>
                            <div>
                                <div style="font-weight: 700; color: var(--secondary); font-size: 14px;"><?= htmlspecialchars($row['name']) ?></div>
                                <div style="font-size: 11px; color: var(--text-muted);"><i class="fas fa-phone-alt" style="font-size: 10px;"></i> <?= htmlspecialchars($row['phone']) ?></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="font-weight: 600;"><?= $row['age'] ? $row['age'] . ' ' . $row['age_unit'] : 'N/A' ?></div>
                        <div style="font-size: 11px; color: <?= $gender_color ?>; font-weight: 700;">
                            <i class="fas fa-<?= $gender_icon ?>"></i> <?= $row['gender'] ?>
                        </div>
                    </td>
                    <td>
                        <?php if(!empty($cats)): ?>
                            <?php foreach(array_slice($cats, 0, 2) as $c): ?>
                                <span class="badge badge-scheduled" style="background: #F1F5F9; color: #475569; border: none; margin-bottom: 2px;"><?= htmlspecialchars($c) ?></span>
                            <?php endforeach; ?>
                            <?php if(count($cats) > 2): ?>
                                <span class="badge" style="background: #E2E8F0; color: #64748B;">+<?= count($cats)-2 ?></span>
                            <?php endif; ?>
                        <?php else: ?>
                            <span class="text-muted" style="font-size: 11px;">General</span>
                        <?php endif; ?>
                    </td>
                    <td style="font-size: 12px; color: var(--text-muted);"><?= date('d M Y', strtotime($row['created_at'])) ?></td>
                    <td style="text-align: right; padding: 15px 24px;">
                        <div class="d-flex justify-end" style="gap: 8px;">
                            <a href="patient_form.php?id=<?= $row['id'] ?>" class="btn btn-sm btn-secondary" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px;" title="Edit Profile"><i class="fas fa-user-edit"></i></a>
                            <a href="patients.php?delete=<?= $row['id'] ?>" class="btn btn-sm btn-danger" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px;" onclick="return confirm('Are you sure you want to delete this patient?')" title="Delete Record"><i class="fas fa-trash"></i></a>
                        </div>
                    </td>
                </tr>
                <?php endwhile; ?>
                <?php if(mysqli_num_rows($patients) == 0): ?>
                <tr><td colspan="5" style="text-align: center; padding: 60px;">
                    <i class="fas fa-users-slash" style="font-size: 40px; color: #CBD5E1; margin-bottom: 15px; display: block;"></i>
                    <p class="text-muted">No patients found matching your search.</p>
                </td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once 'components/footer.php'; ?>
