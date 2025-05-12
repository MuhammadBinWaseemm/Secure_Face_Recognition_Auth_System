<?php
/**
 * User login processing script
 * Handles password and face login
 * Verifies passwords using salt and pepper from passwords table
 */

session_start();
require_once 'db.php';
error_log("login.php: Script started");

function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

function compareFaceData($storedData, $currentData) {
    // Unpack stored binary data to float array
    $storedFloats = unpack('f*', $storedData);
    $storedArray = array_values($storedFloats);
    
    // Ensure arrays are same length
    if (count($storedArray) !== count($currentData)) {
        return false;
    }
    
    // Calculate Euclidean distance
    $distance = 0;
    for ($i = 0; $i < count($storedArray); $i++) {
        $distance += pow($storedArray[$i] - $currentData[$i], 2);
    }
    $distance = sqrt($distance);
    
    // Threshold for match (adjust as needed)
    return $distance < 10.0; // Example threshold
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    header('Content-Type: application/json');
    
    $json_input = json_decode(file_get_contents('php://input'), true);
    if (isset($json_input['faceLogin']) && isset($json_input['face_data'])) {
        error_log("login.php: Face login requested");
        $face_data = $json_input['face_data'];
        
        if (!$face_data) {
            error_log("login.php: Missing face data");
            echo json_encode(['success' => false, 'message' => 'Face data required']);
            exit;
        }
        
        try {
            // Fetch all face data from face_auth
            $stmt = $conn->prepare("SELECT user_id, face_data FROM face_auth");
            $stmt->execute();
            $face_records = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (!$face_records) {
                error_log("login.php: No face data found in database");
                echo json_encode(['success' => false, 'message' => 'No face data found']);
                exit;
            }
            
            $user_id = null;
            foreach ($face_records as $record) {
                if (compareFaceData($record['face_data'], $face_data)) {
                    $user_id = $record['user_id'];
                    break;
                }
            }
            
            if ($user_id) {
                // Fetch user details
                $stmt = $conn->prepare("SELECT id, email FROM users WHERE id = :user_id");
                $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                $stmt->execute();
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($user) {
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['email'] = $user['email'];
                    error_log("login.php: Face login successful for user_id: $user_id");
                    echo json_encode(['success' => true, 'message' => 'Face login successful']);
                } else {
                    error_log("login.php: User not found for user_id: $user_id");
                    echo json_encode(['success' => false, 'message' => 'User not found']);
                }
            } else {
                error_log("login.php: Face data does not match any user");
                echo json_encode(['success' => false, 'message' => 'Face ID not matched or doesn’t exist']);
            }
        } catch (PDOException $e) {
            error_log("login.php: Database error: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
        exit;
    }
    
    $email = isset($_POST['email']) ? sanitize_input($_POST['email']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    error_log("login.php: Password login requested for email: $email");
    
    if (empty($email) || empty($password)) {
        error_log("login.php: Missing email or password");
        echo json_encode(['success' => false, 'message' => 'Email and password are required']);
        exit;
    }
    
    try {
        // Fetch user and password data
        $stmt = $conn->prepare("SELECT u.id, u.email, p.salt, p.pepper, p.key, p.password_hash 
                              FROM users u 
                              LEFT JOIN passwords p ON u.id = p.user_id 
                              WHERE u.email = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            error_log("login.php: User found for email: $email");
            // Reconstruct the combined input for verification
            $combined = $user['salt'] . $password . $user['pepper'];
            $key = hash('sha256', $combined);
            
            // Verify key and password hash
            if ($key === $user['key'] && password_verify($combined, $user['password_hash'])) {
                error_log("login.php: Password verified for email: $email");
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['email'] = $user['email'];
                echo json_encode(['success' => true, 'message' => 'Login successful']);
                exit;
            } else {
                error_log("login.php: Invalid password for email: $email");
                echo json_encode(['success' => false, 'message' => 'Invalid password']);
                exit;
            }
        } else {
            error_log("login.php: User not found for email: $email");
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }
    } catch (PDOException $e) {
        error_log("login.php: Database error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
} else {
    error_log("login.php: Invalid request method");
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}
?>