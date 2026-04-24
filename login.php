<?php
require_once 'db.php';
session_start();

if (isset($_SESSION['admin_id'])) {
    header("Location: index.php");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = mysqli_real_escape_string($conn, $_POST['username']);
    $password = $_POST['password'];

    $result = mysqli_query($conn, "SELECT * FROM admins WHERE username = '$username'");
    if ($row = mysqli_fetch_assoc($result)) {
        if (password_verify($password, $row['password'])) {
            $_SESSION['admin_id'] = $row['id'];
            $_SESSION['admin_user'] = $row['username'];
            header("Location: index.php");
            exit;
        }
    }
    $error = "Invalid username or password.";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - DocCRM</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        body { background: var(--background); display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .login-card { width: 100%; max-width: 400px; padding: 40px; }
        .login-logo { text-align: center; margin-bottom: 30px; font-size: 24px; font-weight: 700; color: var(--primary); }
    </style>
</head>
<body>
    <div class="card login-card">
        <div class="login-logo">
            <i class="fas fa-user-md"></i> DocCRM Login
        </div>
        
        <?php if(isset($error)): ?>
            <div style="color: var(--danger); margin-bottom: 16px; text-align: center;"><?= $error ?></div>
        <?php endif; ?>

        <form method="POST">
            <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" name="username" class="form-control" required autofocus>
            </div>
            <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" name="password" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 10px;">
                Login to Dashboard
            </button>
        </form>
        <p style="text-align: center; margin-top: 20px; font-size: 12px; color: var(--text-muted);">
            Default: admin / admin123
        </p>
    </div>
</body>
</html>
