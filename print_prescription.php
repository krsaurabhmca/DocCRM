<?php
require_once 'db.php';

if (!isset($_GET['id'])) {
    die("Prescription ID is required.");
}

$fid = (int)$_GET['id'];

// Fetch Followup and Patient Details
$query = "SELECT f.*, p.name as patient_name, p.phone, p.gender, p.age, p.age_unit, p.address, p.father_name 
          FROM followups f 
          JOIN patients p ON f.patient_id = p.id 
          WHERE f.id = $fid";
$res = mysqli_query($conn, $query);
$data = mysqli_fetch_assoc($res);

if (!$data) {
    die("Prescription not found.");
}

// Fetch Clinic Settings
$settings_res = mysqli_query($conn, "SELECT * FROM app_settings");
$settings = [];
while ($row = mysqli_fetch_assoc($settings_res)) {
    $settings[$row['setting_key']] = $row['setting_value'];
}

$top_margin = $settings['prescription_top_margin'] ?? '150';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prescription - <?= htmlspecialchars($data['patient_name']) ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            color: #1e293b;
            background: #fff;
        }

        .prescription-container {
            width: 210mm; /* A4 Width */
            min-height: 297mm; /* A4 Height */
            margin: 0 auto;
            padding: 20mm;
            box-sizing: border-box;
            position: relative;
        }

        .top-spacer {
            height: <?= $top_margin ?>px;
        }

        .patient-header {
            display: grid;
            grid-template-columns: 2fr 1fr;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 15px;
            margin-bottom: 25px;
        }

        .patient-info h2 {
            margin: 0 0 5px 0;
            font-size: 20px;
            color: #0f172a;
            font-weight: 800;
        }

        .patient-details-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            font-size: 13px;
            margin-top: 10px;
        }

        .detail-item strong {
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
            display: block;
            margin-bottom: 2px;
        }

        .visit-info {
            text-align: right;
            font-size: 12px;
        }

        .rx-section {
            margin-top: 30px;
            min-height: 500px;
            position: relative;
        }

        .rx-symbol {
            font-size: 60px;
            font-weight: 800;
            color: #f1f5f9;
            margin-bottom: 5px;
            font-style: italic;
            position: absolute;
            top: -20px;
            left: -10px;
            z-index: -1;
            user-select: none;
        }

        .rx-symbol-front {
            font-size: 32px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 20px;
            font-style: italic;
        }

        .notes-content {
            font-size: 16px;
            line-height: 1.8;
            white-space: pre-wrap;
            color: #1e293b;
            padding-top: 10px;
        }

        .footer-info {
            position: absolute;
            bottom: 20mm;
            left: 20mm;
            right: 20mm;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #64748b;
        }

        @media print {
            body { background: none; }
            .no-print { display: none !important; }
            .prescription-container { 
                box-shadow: none; 
                margin: 0;
                width: 100%;
            }
        }

        .print-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff;
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            display: flex;
            gap: 10px;
            z-index: 100;
        }

        .btn {
            padding: 8px 16px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .btn-primary { background: #0284c7; color: white; }
        .btn-secondary { background: #f1f5f9; color: #475569; }
    </style>
</head>
<body>

<div class="print-controls no-print">
    <button onclick="window.print()" class="btn btn-primary">
        <i class="fas fa-print"></i> Print Prescription
    </button>
    <button onclick="window.close()" class="btn btn-secondary">
        <i class="fas fa-times"></i> Close
    </button>
</div>

<div class="prescription-container">
    <div class="top-spacer"></div>

    <div class="patient-header">
        <div class="patient-info">
            <h2><?= htmlspecialchars($data['patient_name']) ?></h2>
            <div class="patient-details-grid">
                <div class="detail-item">
                    <strong>Age / Gender</strong>
                    <?= $data['age'] ? $data['age'].' '.$data['age_unit'] : 'N/A' ?> / <?= $data['gender'] ?>
                </div>
                <div class="detail-item">
                    <strong>Phone</strong>
                    <?= htmlspecialchars($data['phone']) ?>
                </div>
                <?php if($data['father_name']): ?>
                <div class="detail-item">
                    <strong>S/O, D/O, W/O</strong>
                    <?= htmlspecialchars($data['father_name']) ?>
                </div>
                <?php endif; ?>
            </div>
        </div>
        <div class="visit-info">
            <div class="detail-item">
                <strong>Date</strong>
                <?= date('d M, Y', strtotime($data['followup_date'])) ?>
            </div>
            <div class="detail-item" style="margin-top: 10px;">
                <strong>Visit ID</strong>
                #<?= str_pad($data['id'], 5, '0', STR_PAD_LEFT) ?>
            </div>
        </div>
    </div>

    <div class="rx-section">
        <div class="rx-symbol">Rx</div>
        <div class="rx-symbol-front">Rx</div>
        <div class="notes-content"><?= nl2br(htmlspecialchars($data['notes'])) ?></div>
    </div>

    <div class="footer-info">
        <div>Generated by <?= htmlspecialchars($settings['clinic_name'] ?? 'DocCRM') ?></div>
        <div>Address: <?= htmlspecialchars($settings['clinic_address'] ?? 'Clinic Address') ?></div>
    </div>
</div>

<script>
    // Auto trigger print dialog
    window.onload = function() {
        // window.print();
    };
</script>

</body>
</html>
