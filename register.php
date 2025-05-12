<?php
/**
 * User registration processing script
 * Saves user data to database and handles email and phone availability checks
 * Stores password credentials in a separate passwords table with salt and pepper
 */

session_start();
require_once 'db.php';
error_log("register.php: Script started");

function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Check if this is an email availability check
if (isset($_POST['check_email']) && isset($_POST['email'])) {
    error_log("register.php: Email check requested for " . $_POST['email']);
    header('Content-Type: application/json');
    $email = sanitize_input($_POST['email']);
    
    if (empty($email)) {
        echo json_encode(['exists' => false, 'error' => 'Email is required']);
        exit;
    }
    
    try {
        $stmt = $conn->prepare("SELECT email FROM users WHERE email = :email");
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        
        $exists = $stmt->rowCount() > 0;
        echo json_encode(['exists' => $exists, 'error '

 => null]);
    } catch (PDOException $e) {
        error_log("register.php: Email check error - " . $e->getMessage());
        echo json_encode(['exists' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
    
    $conn = null;
    exit;
}

// Check if this is a phone availability check
if (isset($_POST['check_phone']) && isset($_POST['phone'])) {
    error_log("register.php: Phone check requested for " . $_POST['phone']);
    header('Content-Type: application/json');
    $phone = sanitize_input($_POST['phone']);
    
    if (empty($phone)) {
        echo json_encode(['exists' => false, 'error' => 'Phone number is required']);
        exit;
    }
    
    try {
        $stmt = $conn->prepare("SELECT phone FROM users WHERE phone = :phone");
        $stmt->bindParam(":phone", $phone);
        $stmt->execute();
        
        $exists = $stmt->rowCount() > 0;
        echo json_encode(['exists' => $exists, 'error' => null]);
    } catch (PDOException $e) {
        error_log("register.php: Phone check error - " . $e->getMessage());
        echo json_encode(['exists' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
    
    $conn = null;
    exit;
}

// Process form data when submitted
if ($_SERVER["REQUEST_METHOD"] == "POST" && !isset($_POST['check_email']) && !isset($_POST['check_phone'])) {
    error_log("register.php: Form submission received");
    
    // Get and sanitize form data
    $firstname = isset($_POST['firstname']) ? sanitize_input($_POST['firstname']) : '';
    $lastname = isset($_POST['lastname']) ? sanitize_input($_POST['lastname']) : '';
    $dob = isset($_POST['dob']) ? sanitize_input($_POST['dob']) : '';
    $phone = isset($_POST['phone']) ? sanitize_input($_POST['phone']) : '';
    $email = isset($_POST['email']) ? sanitize_input($_POST['email']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    error_log("register.php: Form data - Firstname: $firstname, Lastname: $lastname, DOB: $dob, Phone: $phone, Email: $email");
    
    // Basic validation
    $errors = [];
    
    if (empty($firstname)) {
        $errors[] = "First name is required";
    }
    
    if (empty($lastname)) {
        $errors[] = "Last name is required";
    }
    
    if (empty($dob)) {
        $errors[] = "Date of birth is required";
    } else {
        $dobDate = new DateTime($dob);
        $today = new DateTime();
        $age = $today->diff($dobDate)->y;
        
        if ($age < 18) {
            $errors[] = "You must be at least 18 years old to register";
        }
    }
    
    if (empty($phone)) {
        $errors[] = "Phone number is required";
    } elseif (strlen($phone) < 10) {
        $errors[] = "Please enter a valid phone number";
    }
    
    if (empty($email)) {
        $errors[] = "Email address is required";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Please enter a valid email address";
    }
    
    if (empty($password)) {
        $errors[] = "Password is required";
    } elseif (strlen($password) < 8) {
        $errors[] = "Password must be at least 8 characters long";
    }
    
    // Check email uniqueness
    try {
        $stmt = $conn->prepare("SELECT email FROM users WHERE email = :email");
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        if ($stmt->rowCount() > 0) {
            $errors[] = "Email is already registered";
        }
    } catch (PDOException $e) {
        error_log("register.php: Email uniqueness check error - " . $e->getMessage());
        $errors[] = "Database error during email check";
    }
    
    // Check phone uniqueness
    try {
        $stmt = $conn->prepare("SELECT phone FROM users WHERE phone = :phone");
        $stmt->bindParam(":phone", $phone);
        $stmt->execute();
        if ($stmt->rowCount() > 0) {
            $errors[] = "Phone number is already registered";
        }
    } catch (PDOException $e) {
        error_log("register.php: Phone uniqueness check error - " . $e->getMessage());
        $errors[] = "Database error during phone check";
    }
    
    if (!empty($errors)) {
        error_log("register.php: Validation errors - " . implode(", ", $errors));
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => implode(", ", $errors)]);
        exit();
    }
    
    // Proceed with registration
    try {
        error_log("register.php: Attempting to insert user data");
        
        // Generate salt and pepper
        $salt = bin2hex(random_bytes(16)); // 32-char random salt
        $pepper = "my_secure_pepper_123"; // In production, store securely
        $combined = $salt . $password . $pepper;
        
        // Generate key (intermediate hash, e.g., using SHA-256 for simplicity)
        $key = hash('sha256', $combined);
        
        // Generate final password hash
        $password_hash = password_hash($combined, PASSWORD_DEFAULT);
        
        // Start transaction
        $conn->beginTransaction();
        
        // Insert user data into users table
        $stmt = $conn->prepare("INSERT INTO users (firstname, lastname, dob, phone, email, created_at) 
                              VALUES (:firstname, :lastname, :dob, :phone, :email, CURRENT_TIMESTAMP)");
        $stmt->bindParam(":firstname", $firstname);
        $stmt->bindParam(":lastname", $lastname);
        $stmt->bindParam(":dob", $dob);
        $stmt->bindParam(":phone", $phone);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        
        // Get the inserted user ID
        $user_id = $conn->lastInsertId();
        
        // Insert password data into passwords table
        $stmt = $conn->prepare("INSERT INTO passwords (user_id, salt, pepper, key, password_hash, timestamp) 
                              VALUES (:user_id, :salt, :pepper, :key, :password_hash, CURRENT_TIMESTAMP)");
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":salt", $salt);
        $stmt->bindParam(":pepper", $pepper);
        $stmt->bindParam(":key", $key);
        $stmt->bindParam(":password_hash", $password_hash);
        $stmt->execute();
        
        // Commit transaction
        $conn->commit();
        
        error_log("register.php: User registered successfully: $email");
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'email' => $email]);
        exit();
    } catch (PDOException $e) {
        $conn->rollBack();
        error_log("register.php: Registration error for $email: " . $e->getMessage());
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit();
    }
} else {
    error_log("register.php: Invalid request method or missing check_email/check_phone");
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
    exit();
}
?>