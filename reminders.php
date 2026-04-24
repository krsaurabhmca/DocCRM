<?php
$page_title = 'Documents & Reminders';
require_once 'components/header.php';

// Handle deletion
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    mysqli_query($conn, "DELETE FROM reminders WHERE id = $id");
    header("Location: reminders.php");
    exit;
}

$query = "SELECT r.*, p.name as patient_name FROM reminders r JOIN patients p ON r.patient_id = p.id ORDER BY r.due_date ASC";
$reminders = mysqli_query($conn, $query);
?>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
    <h2>Document Reminders</h2>
    <a href="reminder_form.php" class="btn btn-primary"><i class="fas fa-plus"></i> Add Reminder</a>
</div>

<div class="card">
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Patient</th>
                    <th>Document Name</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php while($row = mysqli_fetch_assoc($reminders)): 
                    $status_class = strtolower($row['status']);
                ?>
                <tr>
                    <td><?= htmlspecialchars($row['patient_name']) ?></td>
                    <td><?= htmlspecialchars($row['document_name']) ?></td>
                    <td><?= date('M d, Y', strtotime($row['due_date'])) ?></td>
                    <td><span class="badge badge-<?= $status_class ?>"><?= $row['status'] ?></span></td>
                    <td>
                        <a href="reminder_form.php?id=<?= $row['id'] ?>" class="btn btn-sm btn-secondary" title="Edit"><i class="fas fa-edit"></i></a>
                        <a href="reminders.php?delete=<?= $row['id'] ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure you want to delete this reminder?')" title="Delete"><i class="fas fa-trash"></i></a>
                    </td>
                </tr>
                <?php endwhile; ?>
                <?php if(mysqli_num_rows($reminders) == 0): ?>
                <tr><td colspan="5" style="text-align: center;">No document reminders found.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once 'components/footer.php'; ?>
