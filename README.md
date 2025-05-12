# Face Recognition Authentication System

A secure web-based authentication system that integrates traditional email/password login with biometric facial recognition and OTP verification.
Built with PostgreSQL, PHP, JavaScript/TypeScript, EmailJS, and BlazeFace (TensorFlow.js), it features a modern, animated UI and a scalable database design.

# Features

User Registration: Validates user details (email: @gmail.com or @giki.edu.pk, age 18+), sends OTP for verification.

OTP Verification: 6-digit code with a 5-minute timer and resend option.

Login Options: Email/password and facial recognition.

Facial Recognition: Powered by BlazeFace (TensorFlow.js) for face ID setup and login.

Dashboard: Animated welcome page with logout functionality.

Security: Password strength validation, session management, database constraints.

Scalability: Partitioned login history tables, indexed queries for performance.

# Tech Stack

Frontend: HTML5, CSS3, JavaScript (ES6+), TypeScript, Tailwind CSS

Backend: PHP, PostgreSQL

Third-Party Services:

EmailJS: OTP email delivery

BlazeFace (TensorFlow.js): Facial recognition

Cloudflare: Security enhancements

Build Tools: Vite, PostCSS, ESLint

# Prerequisites

Before setting up the project, ensure you have the following installed:

Node.js and npm (or Yarn) for managing frontend dependencies.

PHP (version 7.4 or higher) for running the backend server.

PostgreSQL (version 12 or higher) for the database.

A web browser (e.g., Chrome, Firefox) for testing.

# Setup Instructions

# 1. Clone the Repository

Clone the project to your local machine:

git clone https://github.com/your-username/Face-Recognition-Auth-System.git
cd Face-Recognition-Auth-System

# 2. Set Up the Database

Start your PostgreSQL server.

Create a new database (e.g., auth_system):
CREATE DATABASE auth_system;

Import the database schema from database.sql:
psql -U your-username -d auth_system -f database.sql

Update the database connection details in db.php:
Open db.php in the root directory.

Modify the connection parameters (host, database name, username, password):

$host = 'localhost';
$db = 'auth_system';
$user = 'your-username';
$pass = 'your-password';

# 3. Install Frontend Dependencies

Navigate to the project root directory.

Install Node.js dependencies using npm:
npm install

This will install dependencies like TensorFlow.js, EmailJS, Tailwind CSS, and Vite, as defined in package.json.

# 4. Configure EmailJS for OTP (Optional)

The project uses EmailJS to send OTP emails during registration. The default configuration uses the following email accounts:

hatimwarrior6@gmail.com for @gmail.com emails (service ID: service_jdtk3x4).

u2023403@giki.edu.pk for @giki.edu.pk emails (service ID: service_xt65nbs).

Template ID: template_muoc1ho.

If you prefer to use your own EmailJS account:
Create an account on EmailJS.
Add a new service for your email provider (e.g., Gmail, Outlook).
Create a new email template for OTPs (e.g., with variables email, passcode, time).
Update the following in registration.js:
Replace service_jdtk3x4 (Gmail) and service_xt65nbs (GIKI) with your service IDs.

Replace template_muoc1ho with your template ID.

Add your EmailJS public key (user ID) in registration.js:
emailjs.init('your-public-key');

Example:

const serviceId = email.includes('@gmail.com') ? 'your-gmail-service-id' : 'your-giki-service-id';
emailjs.send(serviceId, 'your-template-id', {
  email: userData.email,
  passcode: otp,
  time: expiry
});

If you skip this step, the OTP service will use the default email accounts (hatimwarrior6@gmail.com, u2023403@giki.edu.pk), which should work as long as the service IDs and template ID remain valid.

# 5. Host the Server

Ensure you are in the project root directory (where index.html, css/, js/, and PHP files are located).

Open a terminal/command prompt in this directory.

Start a PHP development server on port 8080:

php -S localhost:8080

Open your web browser and navigate to:

http://localhost:8080

This should load the application starting from index.html.

# 6. Test the Application

Register: Navigate to the registration page, enter details, and verify via OTP.

Set Up Face ID: Optionally set up facial recognition (requires camera access).

Login: Use email/password or face ID to log in.

Dashboard: Explore the animated dashboard and log out.

# Directory Structure Notes

Ensure all files remain in their respective directories:

css/: Contains all stylesheets.
js/: Contains all JavaScript files.

Root directory: Contains HTML, PHP, and configuration files.

The PHP server (php -S) must be run from the root directory to correctly serve files and handle API requests.

# Hosting Considerations

Local Development: The php -S localhost:8080 command is for development only. For production, deploy to a proper web server (e.g., Apache, Nginx) with HTTPS.

Directory Permissions: Ensure PHP has read/write access to the project directory for logging (php_errors.log) and database connections.

CORS: If hosting on a different domain, configure CORS in PHP scripts to allow frontend requests.

# Troubleshooting

Server Not Starting: Ensure PHP is installed and the port 8080 is not in use.
EmailJS OTP Not Sending: Verify your EmailJS service/template IDs or use the default email accounts.
Face Recognition Issues: Ensure camera access is granted and TensorFlow.js loads correctly.
Database Errors: Check db.php credentials and ensure PostgreSQL is running.

# Contributing
Feel free to fork this repository, submit issues, or create pull requests to improve the project.
