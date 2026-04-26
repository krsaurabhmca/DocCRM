<?php
ob_start();
$page_title = 'Create Campaign';
require_once 'components/header.php';

$title = $content_type = $content = $media_url = $schedule_type = $scheduled_at = '';
$campaign_category_ids = [];

// Fetch categories for targeting (isolated by clinic)
$categories = mysqli_query($conn, "SELECT * FROM categories WHERE clinic_id = $clinic_id ORDER BY name ASC");

// Fetch templates (isolated by clinic)
$templates_res = mysqli_query($conn, "SELECT * FROM templates WHERE clinic_id = $clinic_id ORDER BY name ASC");
$templates = [];
while($t = mysqli_fetch_assoc($templates_res)) {
    $templates[] = $t;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $title = mysqli_real_escape_string($conn, $_POST['title']);
    $content_type = mysqli_real_escape_string($conn, $_POST['content_type']);
    $content = mysqli_real_escape_string($conn, $_POST['content']);
    $schedule_type = $_POST['schedule_type'];
    
    if ($schedule_type == 'schedule') {
        $scheduled_at = mysqli_real_escape_string($conn, $_POST['scheduled_at']);
    } else {
        $scheduled_at = date('Y-m-d H:i:s');
    }
    
    // File Upload handling
    if (isset($_FILES['media_file']) && $_FILES['media_file']['error'] == UPLOAD_ERR_OK) {
        $upload_dir = 'uploads/';
        if(!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
        $extension = pathinfo($_FILES['media_file']['name'], PATHINFO_EXTENSION);
        $filename = 'campaign_' . uniqid() . '_' . time() . '.' . $extension;
        $target_path = $upload_dir . $filename;
        if(move_uploaded_file($_FILES['media_file']['tmp_name'], $target_path)) {
            $media_url = $target_path;
        }
    }

    $status = ($schedule_type == 'schedule' && strtotime($scheduled_at) > time()) ? 'Scheduled' : 'Processing';

    $sql = "INSERT INTO campaigns (clinic_id, title, content_type, content, media_url, scheduled_at, status) VALUES ($clinic_id, '$title', '$content_type', '$content', '$media_url', '$scheduled_at', '$status')";
    
    if (mysqli_query($conn, $sql)) {
        $campaign_id = mysqli_insert_id($conn);
        
        // Handle categories mapping
        $selected_cats = [];
        if (isset($_POST['categories']) && is_array($_POST['categories'])) {
            foreach ($_POST['categories'] as $c_id) {
                $c_id = (int)$c_id;
                $selected_cats[] = $c_id;
                mysqli_query($conn, "INSERT INTO campaign_categories (campaign_id, category_id) VALUES ($campaign_id, $c_id)");
            }
        }
        
        // Queue Messages
        if (!empty($selected_cats)) {
            $cat_in = implode(',', $selected_cats);
            $patients_sql = "SELECT DISTINCT p.id, p.phone FROM patients p JOIN patient_categories pc ON p.id = pc.patient_id WHERE pc.category_id IN ($cat_in) AND p.clinic_id = $clinic_id";
            $p_result = mysqli_query($conn, $patients_sql);
            
            while ($p_row = mysqli_fetch_assoc($p_result)) {
                $p_id = $p_row['id'];
                $msg = mysqli_real_escape_string($conn, $content);
                mysqli_query($conn, "INSERT INTO message_queue (clinic_id, campaign_id, patient_id, message, media_url, scheduled_for, status) VALUES ($clinic_id, $campaign_id, $p_id, '$msg', '$media_url', '$scheduled_at', 'Pending')");
            }
        }

        header("Location: campaigns.php");
        exit;
    } else {
        $error = "Error: " . mysqli_error($conn);
    }
}
?>

<div style="max-width: 800px; margin: 0 auto;">
    <div class="d-flex justify-between align-center mb-4">
        <h2><?= $page_title ?></h2>
        <a href="campaigns.php" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back</a>
    </div>

    <div class="card">
        <div style="padding: 24px;">
            <?php if(isset($error)): ?>
                <div style="color: var(--danger); margin-bottom: 16px;"><?= $error ?></div>
            <?php endif; ?>
            
            <form method="POST" enctype="multipart/form-data">
                <div class="form-group">
                    <label class="form-label">Target Patient Categories <span style="color:red">*</span></label>
                    <div style="max-height: 150px; overflow-y: auto; border: 1px solid var(--border); padding: 10px; border-radius: 6px; background: #fff;">
                        <?php while($c = mysqli_fetch_assoc($categories)): ?>
                            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; cursor: pointer;">
                                <input type="checkbox" name="categories[]" value="<?= $c['id'] ?>">
                                <span style="font-size: 13px;"><?= htmlspecialchars($c['name']) ?></span>
                            </label>
                        <?php endwhile; ?>
                        <?php if(mysqli_num_rows($categories) == 0): ?>
                            <span class="text-muted" style="font-size:12px;">No categories available.</span>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Select Template (Optional)</label>
                    <select class="form-control" id="template_selector" onchange="applyTemplate()">
                        <option value="">-- Choose a Template --</option>
                        <?php foreach($templates as $t): ?>
                            <option value="<?= $t['id'] ?>" data-content="<?= htmlspecialchars($t['content']) ?>" data-type="<?= $t['content_type'] ?>"><?= htmlspecialchars($t['name']) ?> (<?= $t['content_type'] ?>)</option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Campaign Title <span style="color:red">*</span></label>
                    <input type="text" name="title" class="form-control" placeholder="e.g. Health Checkup Camp" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Message Type</label>
                    <select name="content_type" class="form-control" id="content_type" onchange="toggleMedia()">
                        <option value="Text">Text Only</option>
                        <option value="Image">Image w/ Text</option>
                        <option value="Video">Video w/ Text</option>
                    </select>
                </div>

                <div class="form-group" id="media_upload_div" style="display: none;">
                    <label class="form-label">Upload Media (Image / Video)</label>
                    <input type="file" name="media_file" class="form-control" accept="image/*,video/*">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Message Content</label>
                    <textarea name="content" class="form-control" rows="6" placeholder="Write your WhatsApp message here..." required></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Send Options</label>
                    <select name="schedule_type" class="form-control" id="schedule_type" onchange="toggleSchedule()">
                        <option value="now">Send Now</option>
                        <option value="schedule">Schedule for Later</option>
                    </select>
                </div>

                <div class="form-group" id="scheduled_at_div" style="display: none;">
                    <label class="form-label">Scheduled Date & Time <span style="color:red">*</span></label>
                    <input type="datetime-local" name="scheduled_at" class="form-control">
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                    <i class="fas fa-paper-plane"></i> Process Campaign
                </button>
            </form>
        </div>
    </div>
</div>

<script>
function toggleMedia() {
    var type = document.getElementById('content_type').value;
    document.getElementById('media_upload_div').style.display = (type == 'Image' || type == 'Video') ? 'block' : 'none';
}
function toggleSchedule() {
    var type = document.getElementById('schedule_type').value;
    document.getElementById('scheduled_at_div').style.display = (type == 'schedule') ? 'block' : 'none';
}
function applyTemplate() {
    var selector = document.getElementById('template_selector');
    var selected = selector.options[selector.selectedIndex];
    if (selected.value) {
        document.getElementsByName('content')[0].value = selected.getAttribute('data-content');
        document.getElementById('content_type').value = selected.getAttribute('data-type');
        toggleMedia();
    }
}
</script>

<?php require_once 'components/footer.php'; 
ob_end_flush();
?>
