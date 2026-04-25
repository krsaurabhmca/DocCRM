<?php
/**
 * DocCRM - API & System Diagnostic Tool
 * This tool helps verify the backend health, database connectivity, and API responsiveness.
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

$results = [
    'system' => [],
    'database' => [],
    'api' => []
];

// 1. System Checks
$results['system'][] = ['name' => 'PHP Version', 'status' => PHP_VERSION >= '7.4' ? 'pass' : 'warn', 'msg' => PHP_VERSION];
$results['system'][] = ['name' => 'Display Errors', 'status' => ini_get('display_errors') ? 'pass' : 'warn', 'msg' => ini_get('display_errors') ? 'On' : 'Off (Harder to debug)'];
$results['system'][] = ['name' => 'Uploads Directory', 'status' => is_writable(__DIR__ . '/uploads') ? 'pass' : 'fail', 'msg' => is_writable(__DIR__ . '/uploads') ? 'Writable' : 'Not Writable'];

// 2. Database Connection Check
try {
    if (file_exists(__DIR__ . '/api/config.php')) {
        require_once __DIR__ . '/api/config.php';
        $conn = @mysqli_connect(DB_HOST, DB_USER, DB_PASS);
        if ($conn) {
            $results['database'][] = ['name' => 'MySQL Connection', 'status' => 'pass', 'msg' => 'Connected to ' . DB_HOST];
            
            if (mysqli_select_db($conn, DB_NAME)) {
                $results['database'][] = ['name' => 'Database Selection', 'status' => 'pass', 'msg' => 'Selected ' . DB_NAME];
                
                // Check essential tables
                $tables = ['patients', 'followups', 'templates', 'app_settings'];
                foreach ($tables as $table) {
                    $res = mysqli_query($conn, "SHOW TABLES LIKE '$table'");
                    $exists = mysqli_num_rows($res) > 0;
                    $results['database'][] = ['name' => "Table: $table", 'status' => $exists ? 'pass' : 'fail', 'msg' => $exists ? 'Exists' : 'Missing'];
                }
            } else {
                $results['database'][] = ['name' => 'Database Selection', 'status' => 'fail', 'msg' => 'Could not select ' . DB_NAME . ': ' . mysqli_error($conn)];
            }
            mysqli_close($conn);
        } else {
            $results['database'][] = ['name' => 'MySQL Connection', 'status' => 'fail', 'msg' => mysqli_connect_error()];
        }
    } else {
        $results['database'][] = ['name' => 'Config File', 'status' => 'fail', 'msg' => 'api/config.php not found'];
    }
} catch (Exception $e) {
    $results['database'][] = ['name' => 'Exception', 'status' => 'fail', 'msg' => $e->getMessage()];
}

// 3. API Action Tests
function test_api_action($action) {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];
    $path = str_replace('api_check.php', 'api/index.php', $_SERVER['SCRIPT_NAME']);
    $url = "$protocol://$host$path?action=$action";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['X-API-KEY: DOC_CRM_API_SECRET_2026']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'body' => $response,
        'url' => $url
    ];
}

$api_tests = ['get_dashboard_stats', 'get_patients', 'get_app_settings'];
foreach ($api_tests as $test) {
    $res = test_api_action($test);
    $json = json_decode($res['body'], true);
    $status = ($res['code'] == 200 && isset($json['success']) && $json['success']) ? 'pass' : 'fail';
    $results['api'][] = [
        'name' => "Action: $test",
        'status' => $status,
        'msg' => "HTTP {$res['code']}" . ($json ? "" : " | Invalid JSON Response"),
        'raw' => $res['body']
    ];
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DocCRM API Diagnostic Hub</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0284C7;
            --success: #059669;
            --warning: #EA580C;
            --danger: #E11D48;
            --bg: #F8FAFC;
            --card: #FFFFFF;
            --text: #1E293B;
            --text-light: #64748B;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 40px 20px;
            line-height: 1.5;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 40px;
        }

        h1 {
            font-weight: 800;
            font-size: 2.5rem;
            margin: 0;
            color: var(--primary);
            letter-spacing: -0.05em;
        }

        p.subtitle {
            color: var(--text-light);
            margin-top: 5px;
        }

        .card {
            background: var(--card);
            border-radius: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid #E2E8F0;
        }

        .section-title {
            font-weight: 700;
            font-size: 1.25rem;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 2px solid #F1F5F9;
            padding-bottom: 10px;
        }

        .check-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #F1F5F9;
        }

        .check-item:last-child {
            border-bottom: none;
        }

        .check-name {
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
        }

        .status-pass { background: #DCFCE7; color: var(--success); }
        .status-warn { background: #FFEDD5; color: var(--warning); }
        .status-fail { background: #FFE4E6; color: var(--danger); }

        .check-msg {
            font-size: 0.9rem;
            color: var(--text-light);
            text-align: right;
            max-width: 50%;
            word-break: break-all;
        }

        .raw-response {
            margin-top: 10px;
            background: #1E293B;
            color: #E2E8F0;
            padding: 15px;
            border-radius: 10px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.8rem;
            overflow-x: auto;
            display: none;
        }

        .toggle-raw {
            cursor: pointer;
            color: var(--primary);
            font-size: 0.8rem;
            font-weight: 600;
            text-decoration: underline;
        }

        .refresh-btn {
            display: inline-block;
            background: var(--primary);
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 700;
            margin-top: 20px;
            transition: transform 0.2s;
        }

        .refresh-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(2, 132, 199, 0.3);
        }

        .footer {
            text-align: center;
            color: var(--text-light);
            font-size: 0.85rem;
            margin-top: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>DocCRM Diagnostic</h1>
            <p class="subtitle">System Health & API Verification Hub</p>
        </header>

        <!-- System Information -->
        <div class="card">
            <div class="section-title">
                <span>💻</span> System Environment
            </div>
            <?php foreach ($results['system'] as $item): ?>
                <div class="check-item">
                    <div class="check-name"><?php echo $item['name']; ?></div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div class="check-msg"><?php echo $item['msg']; ?></div>
                        <span class="status-badge status-<?php echo $item['status']; ?>"><?php echo $item['status']; ?></span>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- Database Health -->
        <div class="card">
            <div class="section-title">
                <span>🗄️</span> Database Health
            </div>
            <?php foreach ($results['database'] as $item): ?>
                <div class="check-item">
                    <div class="check-name"><?php echo $item['name']; ?></div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div class="check-msg"><?php echo $item['msg']; ?></div>
                        <span class="status-badge status-<?php echo $item['status']; ?>"><?php echo $item['status']; ?></span>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- API Responsiveness -->
        <div class="card">
            <div class="section-title">
                <span>🚀</span> API Integration Tests
            </div>
            <?php foreach ($results['api'] as $index => $item): ?>
                <div class="check-item" style="flex-direction: column; align-items: flex-start;">
                    <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                        <div class="check-name"><?php echo $item['name']; ?></div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div class="check-msg"><?php echo $item['msg']; ?></div>
                            <span class="status-badge status-<?php echo $item['status']; ?>"><?php echo $item['status']; ?></span>
                        </div>
                    </div>
                    <div class="toggle-raw" onclick="toggleRaw('raw-<?php echo $index; ?>')">View Raw Response</div>
                    <div id="raw-<?php echo $index; ?>" class="raw-response">
                        <?php echo htmlspecialchars($item['raw']); ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <div style="text-align: center;">
            <a href="?" class="refresh-btn">Run Diagnostic Again</a>
        </div>

        <div class="footer">
            &copy; 2026 DocCRM Pro | Diagnostic Tool v1.2
        </div>
    </div>

    <script>
        function toggleRaw(id) {
            const el = document.getElementById(id);
            el.style.display = el.style.display === 'block' ? 'none' : 'block';
        }
    </script>
</body>
</html>
