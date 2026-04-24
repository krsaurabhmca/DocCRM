<?php
$page_title = 'Direct Patient Message';
require_once 'components/header.php';

// Handle Search
$search = isset($_GET['search']) ? mysqli_real_escape_string($conn, $_GET['search']) : '';
$patients = null;
if ($search) {
    $whereClause = "WHERE name LIKE '%$search%' OR phone LIKE '%$search%'";
    $patients = mysqli_query($conn, "SELECT * FROM patients $whereClause ORDER BY name ASC");
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['patient_id'])) {
    $patient_id = (int)$_POST['patient_id'];
    $message = mysqli_real_escape_string($conn, $_POST['message']);
    
    // File Upload handling
    $media_url = '';
    if (isset($_FILES['media_file']) && $_FILES['media_file']['error'] == UPLOAD_ERR_OK) {
        $upload_dir = 'uploads/';
        if(!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
        $filename = time() . '_' . basename($_FILES['media_file']['name']);
        $target_path = $upload_dir . $filename;
        if(move_uploaded_file($_FILES['media_file']['tmp_name'], $target_path)) {
            $media_url = $target_path;
        }
    }

    $scheduled_at = date('Y-m-d H:i:s');
    
    // Add to message queue to be processed by cron
    $sql = "INSERT INTO message_queue (patient_id, message, media_url, scheduled_for, status) VALUES ($patient_id, '$message', '$media_url', '$scheduled_at', 'Pending')";
    
    if (mysqli_query($conn, $sql)) {
        $success = "Message added to queue for immediate delivery.";
    } else {
        $error = "Error: " . mysqli_error($conn);
    }
}
?>

<div style="max-width: 800px; margin: 0 auto;">
    <div class="d-flex justify-between align-center mb-4">
        <h2>Single Patient Messaging</h2>
    </div>

    <div class="card mb-4" style="padding: 16px;">
        <form method="GET" class="d-flex align-center" style="gap: 10px;">
            <input type="text" name="search" class="form-control" placeholder="Search patient by name or phone..." value="<?= htmlspecialchars($search) ?>" required style="flex:1;">
            <button type="submit" class="btn btn-primary"><i class="fas fa-search"></i> Find Patient</button>
            <?php if($search): ?>
                <a href="single_message.php" class="btn btn-secondary">Clear</a>
            <?php endif; ?>
        </form>
    </div>

    <?php if(isset($success)): ?>
        <div class="card" style="padding: 16px; background: var(--success-light); border: 1px solid var(--success); color: var(--success); margin-bottom: 24px;">
            <i class="fas fa-check-circle"></i> <?= $success ?>
        </div>
    <?php endif; ?>

    <?php if($patients && mysqli_num_rows($patients) > 0): ?>
        <?php while($p = mysqli_fetch_assoc($patients)): ?>
            <div class="card mb-4">
                <div class="card-header" style="background: var(--background); border-bottom: 1px solid var(--border);">
                    <div class="d-flex justify-between align-center" style="width:100%;">
                        <div>
                            <strong><?= htmlspecialchars($p['name']) ?></strong><br>
                            <span class="text-muted"><i class="fas fa-phone"></i> <?= htmlspecialchars($p['phone']) ?></span>
                        </div>
                    </div>
                </div>
                <div style="padding: 24px;">
                    <form method="POST" enctype="multipart/form-data">
                        <input type="hidden" name="patient_id" value="<?= $p['id'] ?>">
                        
                        <div class="form-group">
                            <label class="form-label">Attach Media (Optional)</label>
                            <input type="file" name="media_file" class="form-control" accept="image/*,video/*,application/pdf">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Message Content</label>
                            <textarea name="message" class="form-control" rows="4" placeholder="Write message..." required></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">
                            <i class="fab fa-whatsapp"></i> Send WhatsApp Message
                        </button>
                    </form>
                </div>
            </div>
        <?php endwhile; ?>
    <?php elseif($search): ?>
        <div class="card" style="padding: 24px; text-align: center;">
            <p class="text-muted">No patient found matching "<?= htmlspecialchars($search) ?>"</p>
        </div>
    <?php endif; ?>
</div>

<?php require_once 'components/footer.php'; ?>
