<?php
/**
 * Handle Face ID login
 */

session_start();
header('Content-Type: application/json'); // Set JSON header early

// Enable error reporting for debugging
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

// Log all errors to file
ini_set('log_errors', '1');
ini_set('error_log', 'php_errors.log'); // Changed to relative path for easier access

require_once 'db.php';
error_log("face_login.php: Script started");

function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Debug incoming request
$raw_input = file_get_contents('php://input');
error_log("face_login.php: Request method: " . $_SERVER["REQUEST_METHOD"]);
error_log("face_login.php: Raw input length: " . strlen($raw_input));

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    error_log("face_login.php: Invalid request method: " . $_SERVER["REQUEST_METHOD"]);
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

try {
    $decoded_input = json_decode($raw_input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("face_login.php: JSON decode error: " . json_last_error_msg());
        echo json_encode(['success' => false, 'message' => 'Invalid JSON input: ' . json_last_error_msg()]);
        exit;
    }
    
    $action = isset($decoded_input['action']) ? sanitize_input($decoded_input['action']) : null;
    $face_data = isset($decoded_input['face_data']) ? $decoded_input['face_data'] : null;
    
    error_log("face_login.php: Received action: $action, face_data_length: " . 
              (is_array($face_data) ? count($face_data) : 'null'));
    
    if ($action !== 'verify' || !is_array($face_data) || empty($face_data)) {
        error_log("face_login.php: Invalid input - action: $action, face_data: " . 
                 (is_array($face_data) ? 'array['.count($face_data).']' : 'invalid'));
        echo json_encode(['success' => false, 'message' => 'Action and valid face data are required']);
        exit;
    }
    
    // Verify database connection
    if (!isset($conn) || !$conn instanceof PDO) {
        throw new Exception('Database connection is not available');
    }
    
    // Debug DB connection
    try {
        $test = $conn->query("SELECT 1");
        error_log("face_login.php: Database connection test successful");
    } catch (PDOException $e) {
        error_log("face_login.php: Database connection test failed: " . $e->getMessage());
        throw new Exception('Database connection test failed: ' . $e->getMessage());
    }
    
    // Fetch all face data from face_auth
    $stmt = $conn->prepare("SELECT fa.id, fa.face_data, u.email 
                           FROM face_auth fa 
                           JOIN users u ON fa.id = u.id");
    $result = $stmt->execute();
    
    if (!$result) {
        error_log("face_login.php: Query execution failed: " . implode(', ', $stmt->errorInfo()));
        throw new Exception('Query execution failed');
    }
    
    $faces = $stmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("face_login.php: Fetched " . count($faces) . " face records");
    
    if (empty($faces)) {
        error_log("face_login.php: No face data found in face_auth");
        echo json_encode(['success' => false, 'message' => 'No face data found']);
        exit;
    }
    
    // Normalize input face data
    $normalized_face_data = array_values($face_data);
    
    $best_match = null;
    $min_distance = PHP_FLOAT_MAX;
    $threshold = 1.0; // Increased threshold for more tolerance
    
    foreach ($faces as $face) {
        try {
            // First, try to decode the face_data as JSON (new format)
            $stored_floats = json_decode($face['face_data'], true);
            
            // If not JSON, try to unpack as binary (old format)
            if (json_last_error() !== JSON_ERROR_NONE) {
                $stored_floats = @unpack('f*', $face['face_data']);
                if ($stored_floats === false) {
                    error_log("face_login.php: Failed to parse face data for ID {$face['id']}");
                    continue;
                }
                $stored_floats = array_values($stored_floats);
            }
            
            // Log face data lengths for debugging
            error_log("face_login.php: Comparing - input length: " . count($normalized_face_data) . 
                     ", stored length: " . count($stored_floats) . " for ID: {$face['id']}");
            
            // Compare face data (Euclidean distance)
            $distance = 0.0;
            $min_length = min(count($normalized_face_data), count($stored_floats));
            
            if ($min_length == 0) {
                error_log("face_login.php: Zero-length face data comparison for ID {$face['id']}");
                continue;
            }
            
            for ($i = 0; $i < $min_length; $i++) {
                $diff = (float)$normalized_face_data[$i] - (float)$stored_floats[$i];
                $distance += $diff * $diff;
            }
            $distance = sqrt($distance);
            
            error_log("face_login.php: Distance for id {$face['id']}: $distance");
            
            if ($distance < $min_distance) {
                $min_distance = $distance;
                $best_match = $face;
            }
        } catch (Exception $e) {
            error_log("face_login.php: Error processing face ID {$face['id']}: " . $e->getMessage());
            continue;
        }
    }
    
    error_log("face_login.php: Best match distance: $min_distance, threshold: $threshold");
    
    if (!$best_match || $min_distance > $threshold) {
        error_log("face_login.php: No matching face found, min_distance: $min_distance");
        echo json_encode([
            'success' => false, 
            'message' => 'Face ID not recognized', 
            'debug' => ['min_distance' => $min_distance, 'threshold' => $threshold]
        ]);
        exit;
    }
    
    $user_id = $best_match['id'];
    $user_email = $best_match['email'];
    error_log("face_login.php: Face verification successful for id: $user_id, email: $user_email");
    
    // Start session
    $_SESSION['user_id'] = $user_id;
    $_SESSION['email'] = $user_email;
    
    echo json_encode([
        'success' => true,
        'message' => 'Face ID login successful',
        'user' => ['id' => $user_id, 'email' => $user_email]
    ]);
} catch (Exception $e) {
    error_log("face_login.php: Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
exit;
?>