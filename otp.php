<?php
/**
 * OTP verification script
 * Verifies OTP and deletes user data if verification fails
 */

// Database connection
require_once 'db.php';

// Log start of script
error_log("otp.php: Script started");

// Function to sanitize input data
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Process OTP verification
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['action'])) {
    header('Content-Type: application/json');
    
    if ($_POST['action'] === 'verify_otp') {
        $entered_otp = isset($_POST['otp']) ? sanitize_input($_POST['otp']) : '';
        $email = isset($_POST['email']) ? sanitize_input($_POST['email']) : '';
        $stored_otp = isset($_POST['stored_otp']) ? sanitize_input($_POST['stored_otp']) : '';
        $otp_expiry = isset($_POST['otp_expiry']) ? (int)$_POST['otp_expiry'] : 0;
        
        error_log("otp.php: Verifying OTP for email: $email, Entered OTP: $entered_otp");
        
        // Validate inputs
        if (empty($entered_otp) || empty($email) || empty($stored_otp)) {
            error_log("otp.php: Missing required fields");
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
            exit;
        }
        
        // Check if OTP is expired
        if (time() * 1000 > $otp_expiry) {
            error_log("otp.php: OTP expired for email: $email");
            deleteUser($conn, $email);
            echo json_encode(['success' => false, 'error' => 'OTP has expired']);
            exit;
        }
        
        // Verify OTP
        if ($entered_otp === $stored_otp) {
            error_log("otp.php: OTP verification successful for email: $email");
            echo json_encode(['success' => true]);
            exit;
        } else {
            error_log("otp.php: Invalid OTP for email: $email");
            deleteUser($conn, $email);
            echo json_encode(['success' => false, 'error' => 'Invalid OTP']);
            exit;
        }
    } elseif ($_POST['action'] === 'cancel') {
        $email = isset($_POST['email']) ? sanitize_input($_POST['email']) : '';
        
        if (empty($email)) {
            error_log("otp.php: Missing email for cancellation");
            echo json_encode(['success' => false, 'error' => 'Missing email']);
            exit;
        }
        
        error_log("otp.php: Cancelling registration for email: $email");
        deleteUser($conn, $email);
        echo json_encode(['success' => true]);
        exit;
    } else {
        error_log("otp.php: Invalid action");
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
        exit;
    }
} else {
    error_log("otp.php: Invalid request method");
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
    exit();
}

// Function to delete user data
function deleteUser($conn, $email) {
    try {
        $stmt = $conn->prepare("DELETE FROM users WHERE email = :email");
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        error_log("otp.php: Deleted user data for email: $email");
    } catch (PDOException $e) {
        error_log("otp.php: Error deleting user data for $email: " . $e->getMessage());
    }
}
?>