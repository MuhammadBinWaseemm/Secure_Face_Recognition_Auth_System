/**
 * Main application entry point
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if the user is authenticated
  if (auth.checkSession()) {
    const currentPage = window.location.pathname;
    
    // If on login or registration page, redirect to dashboard
    if (currentPage.includes('login.html') || currentPage.includes('registration.html')) {
      // In a real app, would redirect to dashboard
      alert('You are already logged in! Redirect to dashboard would happen here.');
    }
  }
  
  console.log('Face Recognition Authentication System initialized');
});