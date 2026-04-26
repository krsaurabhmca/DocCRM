<?php
$page_title = isset($_GET['id']) ? 'Edit Template' : 'Create Template';
require_once 'components/header.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$name = $type = $aoc_slug = $part1 = $part2 = $part3 = $media_url = '';
$is_default = 0;

if ($id > 0) {
    $result = mysqli_query($conn, "SELECT * FROM templates WHERE id = $id AND clinic_id = $clinic_id");
    if ($row = mysqli_fetch_assoc($result)) {
        $name = $row['name'];
        $type = $row['content_type'];
        $aoc_slug = $row['aoc_template_name'];
        $part1 = $row['content_part1'];
        $part2 = $row['content_part2'];
        $part3 = $row['content_part3'];
        $media_url = $row['media_url'];
        $is_default = $row['is_default'];
    } else {
        header("Location: templates.php");
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $name = mysqli_real_escape_string($conn, $_POST['name']);
    $type = mysqli_real_escape_string($conn, $_POST['content_type']);
    $aoc_slug = mysqli_real_escape_string($conn, $_POST['aoc_template_name']);
    $part1 = mysqli_real_escape_string($conn, $_POST['content_part1']);
    $part2 = mysqli_real_escape_string($conn, $_POST['content_part2']);
    $part3 = mysqli_real_escape_string($conn, $_POST['content_part3']);
    $is_default = isset($_POST['is_default']) ? 1 : 0;
    
    // File upload
    if (isset($_FILES['media']) && $_FILES['media']['error'] == UPLOAD_ERR_OK) {
        $upload_dir = 'uploads/';
        if(!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
        $ext = pathinfo($_FILES['media']['name'], PATHINFO_EXTENSION);
        $filename = 'tpl_' . uniqid() . '.' . $ext;
        if(move_uploaded_file($_FILES['media']['tmp_name'], $upload_dir . $filename)) {
            $media_url = $upload_dir . $filename;
        }
    }

    if ($is_default) {
        mysqli_query($conn, "UPDATE templates SET is_default = 0 WHERE clinic_id = $clinic_id");
    }

    if ($id > 0) {
        $sql = "UPDATE templates SET name='$name', content_type='$type', aoc_template_name='$aoc_slug', content_part1='$part1', content_part2='$part2', content_part3='$part3', media_url='$media_url', is_default=$is_default WHERE id=$id AND clinic_id=$clinic_id";
    } else {
        $sql = "INSERT INTO templates (clinic_id, name, content_type, aoc_template_name, content_part1, content_part2, content_part3, media_url, is_default) VALUES ($clinic_id, '$name', '$type', '$aoc_slug', '$part1', '$part2', '$part3', '$media_url', $is_default)";
    }

    if (mysqli_query($conn, $sql)) {
        header("Location: templates.php");
        exit;
    } else {
        $error = "Error: " . mysqli_error($conn);
    }
}
?>

<div style="max-width: 800px; margin: 0 auto;">
    <div class="d-flex justify-between align-center mb-4">
        <h2><?= $page_title ?></h2>
        <a href="templates.php" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back to Templates</a>
    </div>

    <form method="POST" enctype="multipart/form-data">
        <div class="grid" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px;">
            <!-- Main Content -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div class="card" style="padding: 24px;">
                    <div class="form-group">
                        <label class="form-label">Internal Template Name <span style="color:red">*</span></label>
                        <input type="text" name="name" class="form-control" value="<?= htmlspecialchars($name) ?>" placeholder="e.g. Greeting for New Patients" required>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label class="form-label">AOC Portal Slug</label>
                            <input type="text" name="aoc_template_name" class="form-control" value="<?= htmlspecialchars($aoc_slug) ?>" placeholder="e.g. greeting_msg_1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Content Type</label>
                            <select name="content_type" class="form-control" id="content_type" onchange="toggleMedia()">
                                <option value="Text" <?= $type == 'Text' ? 'selected' : '' ?>>Text Only</option>
                                <option value="Image" <?= $type == 'Image' ? 'selected' : '' ?>>Image w/ Text</option>
                                <option value="Video" <?= $type == 'Video' ? 'selected' : '' ?>>Video w/ Text</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="card" style="padding: 24px;">
                    <h3 class="mb-3" style="font-size: 16px;">WhatsApp Message Structure</h3>
                    <div class="form-group">
                        <label class="form-label">Header / Introduction (Part 1)</label>
                        <input type="text" name="content_part1" class="form-control" value="<?= htmlspecialchars($part1) ?>" placeholder="e.g. Dear #Patient Name#,">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Main Body Content (Part 2) <span style="color:red">*</span></label>
                        <textarea name="content_part2" class="form-control" rows="5" required placeholder="Enter the main body of your message..."><?= htmlspecialchars($part2) ?></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Footer / Clinic Info (Part 3)</label>
                        <input type="text" name="content_part3" class="form-control" value="<?= htmlspecialchars($part3) ?>" placeholder="e.g. Best regards, Your Clinic Name">
                        <p class="text-muted mt-1" style="font-size: 10px;">Leave blank to use default clinic footer.</p>
                    </div>
                </div>
            </div>

            <!-- Sidebar / Settings -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div class="card" style="padding: 20px;">
                    <h4 class="mb-3" style="font-size: 14px;">Media & Global Settings</h4>
                    
                    <div class="form-group" id="media_upload_div" style="<?= ($type == 'Image' || $type == 'Video') ? 'display:block' : 'display:none' ?>">
                        <label class="form-label">Upload Media</label>
                        <input type="file" name="media" class="form-control" accept="image/*,video/*">
                        <?php if($media_url): ?>
                            <div class="mt-2" style="font-size: 11px; color: var(--primary);">Currently: <?= basename($media_url) ?></div>
                        <?php endif; ?>
                    </div>

                    <div class="form-group mt-3">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" name="is_default" value="1" <?= $is_default ? 'checked' : '' ?> style="width: 18px; height: 18px;">
                            <span style="font-weight: 600; font-size: 13px;">Set as Default Template</span>
                        </label>
                    </div>
                </div>

                <div class="card" style="padding: 20px; background: #FFFBEB; border: 1px solid #FEF3C7;">
                    <h4 style="font-size: 13px; color: #92400E;"><i class="fas fa-lightbulb"></i> Tips</h4>
                    <p style="font-size: 12px; color: #B45309; line-height: 1.6; margin-top: 10px;">
                        Use <strong>#Patient Name#</strong> to automatically personalize messages with the patient's actual name.
                    </p>
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%; padding: 15px; border-radius: 12px; font-weight: 700;">
                    <i class="fas fa-save"></i> Save Template
                </button>
            </div>
        </div>
    </form>
</div>

<script>
function toggleMedia() {
    var type = document.getElementById('content_type').value;
    document.getElementById('media_upload_div').style.display = (type == 'Image' || type == 'Video') ? 'block' : 'none';
}
</script>

<?php require_once 'components/footer.php'; ?>
