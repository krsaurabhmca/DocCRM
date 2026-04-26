<?php
$page_title = 'Daily Task Reminders';
require_once 'components/header.php';

// Handle AJAX Status Update
if (isset($_POST['update_followup'])) {
    $fid = (int)$_POST['followup_id'];
    $status = mysqli_real_escape_string($conn, $_POST['status']);
    $notes = mysqli_real_escape_string($conn, $_POST['notes']);
    
    $sql = "UPDATE followups SET status='$status', notes='$notes' WHERE id=$fid AND clinic_id=$clinic_id";
    if (mysqli_query($conn, $sql)) {
        echo "<script>window.location.href='daily_reminders.php?date=" . $_POST['current_date'] . "&success=1';</script>";
        exit;
    }
}

$selected_date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
$query = "SELECT f.*, p.name as patient_name, p.phone FROM followups f 
          JOIN patients p ON f.patient_id = p.id 
          WHERE f.followup_date = '$selected_date' AND f.clinic_id = $clinic_id
          ORDER BY f.id DESC";
$reminders = mysqli_query($conn, $query);
?>

<div class="d-flex justify-between align-center mb-4">
    <h2>Daily Follow-up Reminders</h2>
    <form method="GET" class="d-flex align-center" style="gap: 10px;">
        <label class="form-label mb-0" style="white-space: nowrap;">Filter Date:</label>
        <input type="date" name="date" class="form-control" value="<?= $selected_date ?>" onchange="this.form.submit()">
    </form>
</div>

<?php if(isset($_GET['success'])): ?>
    <div class="badge badge-submitted mb-4" style="width: 100%; padding: 12px; font-size: 14px;">
        <i class="fas fa-check-circle"></i> Follow-up updated successfully!
    </div>
<?php endif; ?>

<div class="card">
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Patient</th>
                    <th>Type</th>
                    <th>Notes</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php while($row = mysqli_fetch_assoc($reminders)): 
                    $status_class = strtolower($row['status']);
                ?>
                <tr>
                    <td>
                        <strong><?= htmlspecialchars($row['patient_name']) ?></strong><br>
                        <span class="text-muted" style="font-size: 11px;"><?= htmlspecialchars($row['phone']) ?></span>
                    </td>
                    <td><?= htmlspecialchars($row['followup_type']) ?></td>
                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="<?= htmlspecialchars($row['notes']) ?>">
                        <?= $row['notes'] ? htmlspecialchars($row['notes']) : '<span class="text-muted">No notes</span>' ?>
                    </td>
                    <td><span class="badge badge-<?= $status_class ?>"><?= $row['status'] ?></span></td>
                    <td>
                        <button class="btn btn-sm btn-primary open-modal" 
                                data-id="<?= $row['id'] ?>" 
                                data-name="<?= htmlspecialchars($row['patient_name']) ?>"
                                data-status="<?= $row['status'] ?>"
                                data-notes="<?= htmlspecialchars($row['notes']) ?>">
                            <i class="fas fa-edit"></i> Update
                        </button>
                    </td>
                </tr>
                <?php endwhile; ?>
                <?php if(mysqli_num_rows($reminders) == 0): ?>
                <tr><td colspan="5" style="text-align: center; padding: 40px;">No follow-ups scheduled for this date.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Modal Structure -->
<div id="followupModal" class="modal-overlay">
    <div class="modal-card animate-fade-in">
        <div class="modal-header">
            <h3>Update Follow-up: <span id="modal_patient_name"></span></h3>
            <button class="close-modal">&times;</button>
        </div>
        <form method="POST">
            <div style="padding: 24px;">
                <input type="hidden" name="followup_id" id="modal_followup_id">
                <input type="hidden" name="current_date" value="<?= $selected_date ?>">
                
                <div class="form-group">
                    <label class="form-label">Update Status</label>
                    <select name="status" id="modal_status" class="form-control">
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Notes / Remarks</label>
                    <textarea name="notes" id="modal_notes" class="form-control" rows="4" placeholder="Enter follow-up outcome..."></textarea>
                </div>
                
                <div class="d-flex justify-end" style="gap: 10px; margin-top: 20px;">
                    <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                    <button type="submit" name="update_followup" class="btn btn-primary">Save Changes</button>
                </div>
            </div>
        </form>
    </div>
</div>

<style>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}
.modal-card {
    background: white;
    width: 100%;
    max-width: 500px;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
.modal-header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.modal-header h3 { font-size: 18px; margin: 0; }
.close-modal { 
    background: none; 
    border: none; 
    font-size: 24px; 
    color: var(--text-muted); 
    cursor: pointer; 
}
.justify-end { justify-content: flex-end; }
</style>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('followupModal');
    const openBtns = document.querySelectorAll('.open-modal');
    const closeBtns = document.querySelectorAll('.close-modal');
    
    openBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            const status = btn.getAttribute('data-status');
            const notes = btn.getAttribute('data-notes');
            
            document.getElementById('modal_followup_id').value = id;
            document.getElementById('modal_patient_name').innerText = name;
            document.getElementById('modal_status').value = status;
            document.getElementById('modal_notes').value = notes;
            
            modal.style.display = 'flex';
        });
    });
    
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
});
</script>

<?php require_once 'components/footer.php'; ?>
