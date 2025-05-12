<?php
// Database Configuration
$host = "localhost"; // Change if using a remote DB
$dbname = "authentication_system"; // Your database name
$user = "postgres"; // PostgreSQL username
$pass = "deez"; // Replace with your actual password

try {
    // Establish a connection using PDO
    $conn = new PDO("pgsql:host=localhost;dbname=authentication_system;user=postgres;password=deez");

    // Set error mode to exception (helps with debugging)
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // Handle connection errors
    die("❌ Database connection failed: " . $e->getMessage());
}
?>
