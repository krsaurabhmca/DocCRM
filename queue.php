<?php
$page_title = "Today's Patient Queue";
require_once 'components/header.php';

// Handle AJAX Status Update
if (isset($_POST['update_followup'])) {
    $fid = (int)$_POST['followup_id'];
    $status = mysqli_real_escape_string($conn, $_POST['status']);
    $notes = mysqli_real_escape_string($conn, $_POST['notes']);
    
    $sql = "UPDATE followups SET status='$status', notes='$notes' WHERE id=$fid";
    if (mysqli_query($conn, $sql)) {
        echo "<script>window.location.href='queue.php?success=1';</script>";
        exit;
    }
}

$selected_date = date('Y-m-d');
// Fetch both new registrations (Completed status for today) and scheduled followups
$query = "SELECT f.*, p.name as patient_name, p.phone, p.gender FROM followups f 
          JOIN patients p ON f.patient_id = p.id 
          WHERE f.followup_date = '$selected_date' 
          ORDER BY f.id ASC";
$queue = mysqli_query($conn, $query);

// Stats
$total_queue = mysqli_num_rows($queue);
$completed_count = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM followups WHERE followup_date = '$selected_date' AND status = 'Completed'"))['cnt'];
$pending_count = $total_queue - $completed_count;
?>

<div class="d-flex justify-between align-center mb-4">
    <div>
        <h2 class="mb-1">Live Patient Queue</h2>
        <p class="text-muted" style="font-size: 12px;">Monitoring patients for <?= date('D, d M Y') ?></p>
    </div>
    <div class="d-flex gap-2">
        <div class="badge badge-scheduled" style="padding: 8px 12px;">Total: <?= $total_queue ?></div>
        <div class="badge badge-submitted" style="padding: 8px 12px;">Done: <?= $completed_count ?></div>
    </div>
</div>

<?php if(isset($_GET['success'])): ?>
    <div class="badge badge-submitted mb-4" style="width: 100%; padding: 12px; font-size: 14px;">
        <i class="fas fa-check-circle"></i> Queue status updated successfully!
    </div>
<?php endif; ?>

<div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px;">
    <div class="stat-card">
        <div class="stat-icon icon-blue"><i class="fas fa-users"></i></div>
        <div class="stat-info">
            <h3>Total Queue</h3>
            <p><?= $total_queue ?></p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon icon-green"><i class="fas fa-check-double"></i></div>
        <div class="stat-info">
            <h3>Checked In</h3>
            <p><?= $completed_count ?></p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon icon-yellow"><i class="fas fa-clock"></i></div>
        <div class="stat-info">
            <h3>Waiting</h3>
            <p><?= $pending_count ?></p>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <h3 class="card-title">Live Appointment List</h3>
    </div>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th># Token</th>
                    <th>Patient Name</th>
                    <th>Gender</th>
                    <th>Visit Type</th>
                    <th>Status</th>
                    <th style="text-align: right;">Action</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                $token = 1;
                while($row = mysqli_fetch_assoc($queue)): 
                    $status_class = strtolower($row['status']);
                    $gender_color = ($row['gender'] == 'Female') ? '#DB2777' : '#0284C7';
                ?>
                <tr <?= $row['status'] == 'Completed' ? 'style="opacity: 0.6; background: #fcfcfc;"' : '' ?>>
                    <td>
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: <?= $row['status'] == 'Completed' ? '#E2E8F0' : 'var(--primary-light)' ?>; display: flex; align-items: center; justify-content: center; font-weight: 800; color: <?= $row['status'] == 'Completed' ? '#64748B' : 'var(--primary)' ?>;">
                            <?= $token++ ?>
                        </div>
                    </td>
                    <td>
                        <strong><?= htmlspecialchars($row['patient_name']) ?></strong><br>
                        <span class="text-muted" style="font-size: 11px;"><i class="fas fa-phone-alt"></i> <?= htmlspecialchars($row['phone']) ?></span>
                    </td>
                    <td>
                        <span style="color: <?= $gender_color ?>; font-weight: 600; font-size: 12px;">
                            <i class="fas fa-<?= strtolower($row['gender']) == 'female' ? 'venus' : 'mars' ?>"></i> <?= $row['gender'] ?>
                        </span>
                    </td>
                    <td><span class="badge badge-scheduled" style="background: #F1F5F9; color: #475569; border: none;"><?= htmlspecialchars($row['followup_type']) ?></span></td>
                    <td><span class="badge badge-<?= $status_class ?>"><?= $row['status'] ?></span></td>
                    <td style="text-align: right;">
                        <?php if($row['status'] !== 'Completed'): ?>
                        <button class="btn btn-sm btn-primary open-modal" 
                                data-id="<?= $row['id'] ?>" 
                                data-name="<?= htmlspecialchars($row['patient_name']) ?>"
                                data-status="<?= $row['status'] ?>"
                                data-notes="<?= htmlspecialchars($row['notes']) ?>">
                            <i class="fas fa-stethoscope"></i> Check In
                        </button>
                        <?php else: ?>
                        <span class="text-success"><i class="fas fa-check-circle"></i> Done</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endwhile; ?>
                <?php if(mysqli_num_rows($queue) == 0): ?>
                <tr><td colspan="6" style="text-align: center; padding: 60px;">
                    <div class="text-muted">
                        <i class="fas fa-folder-open" style="font-size: 40px; margin-bottom: 15px; display: block;"></i>
                        No patients in queue for today.
                    </div>
                </td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Modal Structure -->
<div id="queueModal" class="modal-overlay">
    <div class="modal-card animate-fade-in">
        <div class="modal-header">
            <h3>Consultation Check-in: <span id="modal_patient_name"></span></h3>
            <button class="close-modal">&times;</button>
        </div>
        <form method="POST">
            <div style="padding: 24px;">
                <input type="hidden" name="followup_id" id="modal_followup_id">
                
                <div class="form-group">
                    <label class="form-label">Consultation Status</label>
                    <select name="status" id="modal_status" class="form-control">
                        <option value="Scheduled">Scheduled (Waiting)</option>
                        <option value="Completed">Completed (Checked Out)</option>
                        <option value="Cancelled">Cancelled / Absent</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Clinical Notes / Prescription Notes</label>
                    <textarea name="notes" id="modal_notes" class="form-control" rows="4" placeholder="Enter findings, instructions or diagnosis..."></textarea>
                </div>
                
                <div class="d-flex justify-end" style="gap: 10px; margin-top: 20px;">
                    <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                    <button type="submit" name="update_followup" class="btn btn-primary">Complete Consultation</button>
                </div>
            </div>
        </form>
    </div>
</div>

<style>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: white; width: 100%; max-width: 500px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
.modal-header { padding: 16px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { font-size: 18px; margin: 0; }
.close-modal { background: none; border: none; font-size: 24px; color: var(--text-muted); cursor: pointer; }
.justify-end { justify-content: flex-end; }
.gap-2 { gap: 8px; }
</style>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('queueModal');
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
});
</script>

<?php require_once 'components/footer.php'; ?>
