<?php
ob_start();
$page_title = 'Medical Team Management';
require_once 'components/header.php';

// Handle deletion
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    mysqli_query($conn, "DELETE FROM doctors WHERE id = $id AND clinic_id = $clinic_id");
    header("Location: doctors.php");
    exit;
}

$query = "SELECT * FROM doctors WHERE clinic_id = $clinic_id ORDER BY name ASC";
$doctors = mysqli_query($conn, $query);
?>

<div class="d-flex justify-between align-center mb-4">
    <div>
        <h2 class="mb-1">Doctor Profiles</h2>
        <p class="text-muted" style="font-size: 12px;">Manage clinical staff, specializations, and availability</p>
    </div>
    <a href="doctor_form.php" class="btn btn-primary" style="padding: 10px 20px; border-radius: 10px;"><i class="fas fa-user-md"></i> Add New Doctor</a>
</div>

<div class="card" style="border-radius: 16px; overflow: hidden;">
    <div class="table-responsive">
        <table style="border-collapse: separate; border-spacing: 0;">
            <thead>
                <tr>
                    <th style="padding: 15px 24px;">Doctor Information</th>
                    <th>Specialization</th>
                    <th>Experience</th>
                    <th>Status</th>
                    <th style="text-align: right; padding: 15px 24px;">Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php while($row = mysqli_fetch_assoc($doctors)): 
                    $initials = strtoupper(substr($row['name'], 0, 1));
                    $status_badge = $row['is_active'] ? 'success' : 'overdue';
                    $status_text = $row['is_active'] ? 'Active' : 'On Leave';
                ?>
                <tr>
                    <td style="padding: 15px 24px;">
                        <div class="d-flex align-center" style="gap: 12px;">
                            <div style="width: 40px; height: 40px; border-radius: 12px; background: #E0F2FE; color: #0369A1; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                                <?= $initials ?>
                            </div>
                            <div>
                                <div style="font-weight: 700; color: var(--secondary); font-size: 14px;"><?= htmlspecialchars($row['name']) ?></div>
                                <div style="font-size: 11px; color: var(--text-muted);"><?= htmlspecialchars($row['qualification']) ?></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge badge-scheduled" style="background: #F1F5F9; color: #475569; border: none;"><?= htmlspecialchars($row['specialization']) ?></span>
                    </td>
                    <td><div style="font-weight: 600;"><?= $row['experience'] ?> Years</div></td>
                    <td><span class="badge badge-<?= $status_badge ?>"><?= $status_text ?></span></td>
                    <td style="text-align: right; padding: 15px 24px;">
                        <div class="d-flex justify-end" style="gap: 8px;">
                            <a href="doctor_form.php?id=<?= $row['id'] ?>" class="btn btn-sm btn-secondary" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px;" title="Edit Profile"><i class="fas fa-edit"></i></a>
                            <a href="doctors.php?delete=<?= $row['id'] ?>" class="btn btn-sm btn-danger" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px;" onclick="return confirm('Are you sure you want to delete this doctor profile?')" title="Delete Record"><i class="fas fa-trash"></i></a>
                        </div>
                    </td>
                </tr>
                <?php endwhile; ?>
                <?php if(mysqli_num_rows($doctors) == 0): ?>
                <tr><td colspan="5" style="text-align: center; padding: 60px;">
                    <i class="fas fa-user-md-slash" style="font-size: 40px; color: #CBD5E1; margin-bottom: 15px; display: block;"></i>
                    <p class="text-muted">No doctor profiles found. Add your first doctor to get started.</p>
                </td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once 'components/footer.php'; 
ob_end_flush();
?>
