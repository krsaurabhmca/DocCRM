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
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0284C7;
            --primary-dark: #0369A1;
            --secondary: #0F172A;
            --bg-light: #F8FAFC;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        
        body { 
            background: var(--bg-light); 
            display: flex; 
            height: 100vh; 
            overflow: hidden;
        }

        /* Left Side - Brand Info */
        .login-brand {
            flex: 1.2;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 80px;
            color: white;
            position: relative;
        }

        .login-brand::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: url('https://www.transparenttextures.com/patterns/carbon-fibre.png');
            opacity: 0.1;
        }

        .brand-logo { font-size: 2.5rem; font-weight: 800; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; }
        .brand-logo i { background: white; color: var(--primary); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 15px; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        
        .brand-text h1 { font-size: 2.5rem; line-height: 1.2; margin-bottom: 15px; }
        .brand-text p { opacity: 0.8; font-size: 1.1rem; max-width: 450px; }

        .feature-list { margin-top: 50px; }
        .feature-item { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; opacity: 0.9; }
        .feature-item i { font-size: 1.2rem; }

        /* Right Side - Form */
        .login-form-side {
            flex: 1;
            background: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 40px;
            position: relative;
        }

        .form-card { width: 100%; max-width: 380px; }
        .form-header { margin-bottom: 35px; }
        .form-header h2 { font-size: 1.8rem; color: var(--secondary); margin-bottom: 5px; }
        .form-header p { color: #64748B; font-size: 0.9rem; }

        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--secondary); margin-bottom: 8px; }
        
        .input-group { position: relative; }
        .input-group i { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
        .input-control { 
            width: 100%; 
            padding: 14px 15px 14px 45px; 
            border: 1.5px solid #E2E8F0; 
            border-radius: 12px; 
            font-size: 0.95rem; 
            transition: all 0.3s;
        }
        .input-control:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.1); }

        .btn-login {
            width: 100%;
            background: var(--primary);
            color: white;
            border: none;
            padding: 15px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
        }
        .btn-login:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(2, 132, 199, 0.3); }

        .error-box { background: #FFF1F2; color: #E11D48; padding: 12px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 20px; text-align: center; border: 1px solid #FECDD3; }

        @media (max-width: 992px) {
            .login-brand { display: none; }
        }
    </style>
</head>
<body>
    <div class="login-brand">
        <div class="brand-logo">
            <i class="fas fa-heartbeat"></i> DocCRM
        </div>
        <div class="brand-text">
            <h1>Healthcare Management, <br> Simplified.</h1>
            <p>Empower your clinic with a high-performance CRM designed for patient engagement and operational excellence.</p>
        </div>
        <div class="feature-list">
            <div class="feature-item"><i class="fas fa-check-circle"></i> Live Queue & Token Tracking</div>
            <div class="feature-item"><i class="fas fa-check-circle"></i> Automated WhatsApp Reminders</div>
            <div class="feature-item"><i class="fas fa-check-circle"></i> Financial Revenue Dashboard</div>
        </div>
    </div>

    <div class="login-form-side">
        <div class="form-card">
            <div class="form-header">
                <h2>Welcome Back</h2>
                <p>Please enter your administrative credentials</p>
            </div>

            <?php if(isset($error)): ?>
                <div class="error-box"><i class="fas fa-exclamation-circle"></i> <?= $error ?></div>
            <?php endif; ?>

            <form method="POST">
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <div class="input-group">
                        <i class="fas fa-user"></i>
                        <input type="text" name="username" class="input-control" placeholder="Admin Username" required autofocus>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <div class="input-group">
                        <i class="fas fa-lock"></i>
                        <input type="password" name="password" class="input-control" placeholder="••••••••" required>
                    </div>
                </div>
                <button type="submit" class="btn-login">Sign In to Dashboard</button>
            </form>
            
            <p style="text-align: center; margin-top: 30px; font-size: 0.8rem; color: #94A3B8;">
                DocCRM Management Portal &copy; <?= date('Y') ?>
            </p>
        </div>
    </div>
</body>
</html>
