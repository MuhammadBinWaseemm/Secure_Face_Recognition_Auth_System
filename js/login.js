/**
 * Login page functionality
 * Email/password and Face ID login
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('login-btn');
  const emailInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  const backToLoginBtn = document.getElementById('back-to-login-btn');
  const registerLink = document.getElementById('register-link');
  const useFaceIdBtn = document.getElementById('use-face-id');
  const backToLoginFromFaceBtn = document.getElementById('back-to-login-from-face-btn');
  const usePasswordInstead = document.getElementById('use-password-instead');
  const sendResetLinkBtn = document.getElementById('send-reset-link');
  const resetEmailInput = document.getElementById('reset-email');
  let startScanBtn = document.getElementById('start-scan-btn'); // Allow reassignment
  const cameraFeed = document.getElementById('verification-camera');
  const scanStatus = document.getElementById('verification-status');
  const scanOverlay = document.querySelector('.face-scan-overlay');

  initPage();

  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }

  togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', togglePasswordVisibility);
  });

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.utils.showPage('reset-password-page');
    });
  }

  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', () => {
      window.utils.showPage('login-page');
    });
  }

  if (useFaceIdBtn) {
    useFaceIdBtn.addEventListener('click', () => {
      window.utils.showPage('face-verification-page');
      initFaceVerification();
    });
  }

  if (backToLoginFromFaceBtn) {
    backToLoginFromFaceBtn.addEventListener('click', () => {
      stopFaceVerification();
      window.utils.showPage('login-page');
    });
  }

  if (usePasswordInstead) {
    usePasswordInstead.addEventListener('click', (e) => {
      e.preventDefault();
      stopFaceVerification();
      window.utils.showPage('login-page');
    });
  }

  if (sendResetLinkBtn) {
    sendResetLinkBtn.addEventListener('click', handlePasswordReset);
  }

  if (startScanBtn) {
    startScanBtn.addEventListener('click', startFaceScan);
  }

  // Centralized function to handle successful login and redirect to dashboard
  function redirectToDashboard() {
    console.log('Login: Redirecting to dashboard...');
    window.utils.showNotification('Login successful!', 'success');
    
    // Add any session data or tokens if needed
    // For example:
    // localStorage.setItem('loggedIn', 'true');
    
    // Redirect to dashboard after a short delay to show the success notification
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  }

  function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
      window.utils.showNotification('Please enter your email', 'error');
      emailInput.focus();
      return;
    }

    if (!window.utils.isValidEmail(email)) {
      window.utils.showNotification('Please enter a valid email address', 'error');
      emailInput.focus();
      return;
    }

    if (!password) {
      window.utils.showNotification('Please enter your password', 'error');
      passwordInput.focus();
      return;
    }

    fetch('login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Use the centralized redirect function
        redirectToDashboard();
      } else {
        if (data.message.includes('User not found')) {
          window.utils.showNotification('User does not exist', 'error');
        } else if (data.message.includes('Invalid password')) {
          window.utils.showNotification('Invalid password', 'error');
        } else {
          window.utils.showNotification(data.message || 'Login failed', 'error');
        }
      }
    })
    .catch(error => {
      console.error('Login: Login error:', error);
      window.utils.showNotification('An error occurred during login', 'error');
    });
  }

  function togglePasswordVisibility(e) {
    const button = e.currentTarget;
    const input = button.previousElementSibling;

    if (input.type === 'password') {
      input.type = 'text';
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 21L21 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    } else {
      input.type = 'password';
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }
  }

  function handlePasswordReset() {
    const email = resetEmailInput.value.trim();

    if (!email) {
      window.utils.showNotification('Please enter your email address', 'error');
      resetEmailInput.focus();
      return;
    }

    if (!window.utils.isValidEmail(email)) {
      window.utils.showNotification('Please enter a valid email address', 'error');
      resetEmailInput.focus();
      return;
    }

    window.utils.showNotification('Password reset link sent to your email', 'success');
    setTimeout(() => {
      window.utils.showPage('login-page');
    }, 2000);
  }

  async function initFaceVerification() {
    const verificationCamera = document.getElementById('verification-camera');
    const verificationStatus = document.getElementById('verification-status');
    
    if (!verificationCamera || !verificationStatus) return;
    
    verificationStatus.textContent = 'Initializing camera...';
    
    // Start camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      verificationCamera.srcObject = stream;
      verificationStatus.textContent = 'Looking for face...';
      
      // Simulate face detection
      setTimeout(() => {
        verificationStatus.textContent = 'Face detected! Verifying...';
        
        // Simulate verification
        setTimeout(() => {
          verificationStatus.textContent = 'Verification successful!';
          // Stop camera before redirecting
          stopFaceVerification();
          
          // Use the centralized redirect function
          redirectToDashboard();
        }, 2000);
      }, 2000);
    } catch (error) {
      console.error('Error accessing camera:', error);
      verificationStatus.textContent = 'Camera access denied. Please allow camera access.';
      alert('Please allow camera access for face verification');
    }
  }

  async function startFaceScan() {
    if (!scanOverlay) {
      console.error('Login: Scan overlay not found');
      window.utils.showNotification('Scan overlay not found.', 'error');
      return;
    }

    console.log('Login: Starting face scan...');
    scanStatus.textContent = 'Looking for face...';
    scanOverlay.classList.add('scanning');
    if (startScanBtn) startScanBtn.disabled = true;

    window.faceRecognition.startScan(
      (faceData) => {
        console.log('Login: Face detected');
        scanStatus.textContent = 'Face detected! Keep your face in the frame...';
        visualizeFacePoints(faceData);
      },
      async (faceData) => {
        console.log('Login: Face scan complete');
        scanStatus.textContent = 'Face scan complete!';
        scanOverlay.classList.remove('scanning');
        scanOverlay.classList.add('scan-complete');

        // Process is complete and successful
        scanStatus.textContent = 'Face scan successful!';
        
        // Stop camera and clean up
        stopFaceVerification();
        
        // Use the centralized redirect function
        redirectToDashboard();
      },
      (error) => {
        console.error('Login: Face scan error:', error);
        scanStatus.textContent = 'Face scan failed. Please try again.';
        scanOverlay.classList.remove('scanning');
        scanOverlay.classList.add('scan-error');
        if (startScanBtn) startScanBtn.disabled = false;
        window.utils.showNotification(`Face scan failed: ${error}`, 'error');
        setTimeout(() => {
          scanOverlay.classList.remove('scan-error');
        }, 1000);
      }
    );
  }

  function stopFaceVerification() {
    console.log('Login: Stopping face verification');
    if (cameraFeed && cameraFeed.srcObject) {
      cameraFeed.srcObject.getTracks().forEach(track => track.stop());
      cameraFeed.srcObject = null;
    }
    
    // Make sure all face recognition resources are released
    if (window.faceRecognition) {
      if (typeof window.faceRecognition.stopScan === 'function') {
        window.faceRecognition.stopScan();
      }
      
      if (typeof window.faceRecognition.stopCamera === 'function') {
        window.faceRecognition.stopCamera();
      }
    }
  }

  function initPage() {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('fromFaceSetup')) {
      localStorage.removeItem('session');
      localStorage.removeItem('users');
    }
  }

  function visualizeFacePoints(faceData) {
    console.log('Login: Visualizing face points');
    const existingPoints = document.querySelectorAll('.scan-points');
    existingPoints.forEach(point => point.remove());

    const scanFrame = document.querySelector('.scan-frame');
    if (!scanFrame) {
      console.error('Login: Scan frame not found');
      return;
    }

    for (let i = 0; i < 8; i++) {
      const point = document.createElement('div');
      point.classList.add('scan-points');

      const frameRect = scanFrame.getBoundingClientRect();
      const overlayRect = scanOverlay.getBoundingClientRect();

      const left = frameRect.left - overlayRect.left + 20 + Math.random() * (frameRect.width - 40);
      const top = frameRect.top - overlayRect.top + 20 + Math.random() * (frameRect.height - 40);

      point.style.left = `${left}px`;
      point.style.top = `${top}px`;

      scanOverlay.appendChild(point);
    }
  }
});