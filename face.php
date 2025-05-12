<?php
/**
 * Save face authentication data
 */

session_start();
header('Content-Type: application/json'); // Set JSON header early

// Enable error reporting for debugging
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

// Log all errors to file
ini_set('log_errors', '1');
ini_set('error_log', 'php_errors.log');

require 'db.php';
error_log("face.php: Script started");

function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Debug incoming request
$raw_input = file_get_contents('php://input');
error_log("face.php: Request method: " . $_SERVER["REQUEST_METHOD"]);
error_log("face.php: Raw input: " . $raw_input);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    error_log("face.php: Invalid request method: " . $_SERVER["REQUEST_METHOD"]);
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

try {
    $json_input = json_decode($raw_input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("face.php: JSON decode error: " . json_last_error_msg());
        echo json_encode(['success' => false, 'message' => 'Invalid JSON input: ' . json_last_error_msg()]);
        exit;
    }
    
    $action = isset($json_input['action']) ? sanitize_input($json_input['action']) : null;
    $raw_email = isset($json_input['email']) ? $json_input['email'] : null;
    $email = $raw_email ? sanitize_input(trim(strtolower($raw_email))) : null;
    $face_data = isset($json_input['face_data']) ? $json_input['face_data'] : null;
    
    error_log("face.php: Received action: $action, raw_email: $raw_email, processed_email: $email, face_data_type: " . gettype($face_data) . ", face_data: " . json_encode($face_data));
    
    // Verify database connection
    if (!isset($conn) || !$conn instanceof PDO) {
        error_log("face.php: Database connection is not available");
        throw new Exception('Database connection is not available');
    }
    
    // Debug DB connection
    try {
        $test = $conn->query("SELECT 1");
        error_log("face.php: Database connection test successful");
    } catch (PDOException $e) {
        error_log("face.php: Database connection test failed: " . $e->getMessage());
        throw new Exception('Database connection test failed: ' + $e->getMessage());
    }
    
    // Handle actions
    if ($action === 'get_user_id') {
        if (!$email) {
            error_log("face.php: Missing email for get_user_id");
            echo json_encode(['success' => false, 'message' => 'Email is required']);
            exit;
        }
        
        // Fetch user ID (case-insensitive)
        $stmt = $conn->prepare("SELECT id FROM users WHERE LOWER(email) = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            error_log("face.php: Found user_id: {$user['id']} for email: $email");
            echo json_encode(['success' => true, 'user_id' => $user['id']]);
        } else {
            error_log("face.php: User not found for email: $email");
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }
        exit;
    }
    
    if ($action === 'save') {
        // Validate inputs
        if (!$email) {
            error_log("face.php: Missing email for save action");
            echo json_encode(['success' => false, 'message' => 'Email is required']);
            exit;
        }
        
        if (!is_array($face_data) || empty($face_data)) {
            error_log("face.php: Invalid or empty face_data: " . json_encode($face_data));
            echo json_encode(['success' => false, 'message' => 'Valid face data is required']);
            exit;
        }
        
        // Validate face_data contains numbers
        foreach ($face_data as $value) {
            if (!is_numeric($value)) {
                error_log("face.php: Invalid face_data value: " . json_encode($value));
                echo json_encode(['success' => false, 'message' => 'Face data must contain only numbers']);
                exit;
            }
        }
        
        // Debug: Log all users
        $stmt = $conn->prepare("SELECT id, email, LOWER(email) AS lower_email FROM users");
        $stmt->execute();
        $all_users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        error_log("face.php: All users in users table: " . json_encode($all_users));
        
        // Fetch user ID
        $stmt = $conn->prepare("SELECT id FROM users WHERE LOWER(email) = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            error_log("face.php: User not found for save action, email: $email");
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }
        
        $user_id = $user['id'];
        error_log("face.php: Found user_id: $user_id for email: $email");
        
        // Normalize and save the face data as JSON
        $normalized_face_data = array_values($face_data); // Ensure sequential array
        $json_face_data = json_encode($normalized_face_data);
        
        if ($json_face_data === false) {
            error_log("face.php: Failed to encode face data to JSON");
            throw new Exception('Failed to encode face data');
        }
        
        error_log("face.php: Normalized face data: " . $json_face_data);
        
        // Insert or update face_auth record
        try {
            $stmt = $conn->prepare("
                INSERT INTO face_auth (id, face_data, created_at) 
                VALUES (:id, :face_data, CURRENT_TIMESTAMP)
                ON CONFLICT (id) DO UPDATE 
                SET face_data = :face_data, 
                    created_at = CURRENT_TIMESTAMP
            ");
            $stmt->bindParam(':id', $user_id, PDO::PARAM_INT);
            $stmt->bindParam(':face_data', $json_face_data);
            $result = $stmt->execute();
            
            if (!$result) {
                error_log("face.php: Query execution failed: " . implode(', ', $stmt->errorInfo()));
                throw new Exception('Failed to save face data');
            }
            
            error_log("face.php: Face data saved for id: $user_id");
            echo json_encode(['success' => true, 'message' => 'Face data saved successfully']);
        } catch (PDOException $e) {
            error_log("face.php: Database error: " . $e->getMessage());
            throw new Exception('Database error: ' + $e->getMessage());
        }
    } else {
        error_log("face.php: Invalid action: $action");
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    error_log("face.php: Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
exit;
?>