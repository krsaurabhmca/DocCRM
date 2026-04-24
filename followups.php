<?php
$page_title = 'Follow-ups';
require_once 'components/header.php';

// Handle deletion
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    mysqli_query($conn, "DELETE FROM followups WHERE id = $id");
    header("Location: followups.php");
    exit;
}

$query = "SELECT f.*, p.name as patient_name FROM followups f JOIN patients p ON f.patient_id = p.id ORDER BY f.followup_date ASC";
$followups = mysqli_query($conn, $query);
?>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
    <h2>Follow-ups</h2>
    <a href="followup_form.php" class="btn btn-primary"><i class="fas fa-plus"></i> Add Follow-up</a>
</div>

<div class="card">
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php while($row = mysqli_fetch_assoc($followups)): 
                    $status_class = strtolower($row['status']);
                ?>
                <tr>
                    <td><?= htmlspecialchars($row['patient_name']) ?></td>
                    <td><?= date('M d, Y', strtotime($row['followup_date'])) ?></td>
                    <td><?= htmlspecialchars($row['followup_type']) ?></td>
                    <td><span class="badge badge-<?= $status_class ?>"><?= $row['status'] ?></span></td>
                    <td>
                        <a href="followup_form.php?id=<?= $row['id'] ?>" class="btn btn-sm btn-secondary" title="Edit"><i class="fas fa-edit"></i></a>
                        <a href="followups.php?delete=<?= $row['id'] ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure you want to delete this follow-up?')" title="Delete"><i class="fas fa-trash"></i></a>
                    </td>
                </tr>
                <?php endwhile; ?>
                <?php if(mysqli_num_rows($followups) == 0): ?>
                <tr><td colspan="5" style="text-align: center;">No follow-ups found.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once 'components/footer.php'; ?>
