/**
 * Face ID setup functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const cameraFeed = document.getElementById('camera-feed');
  const scanStatus = document.getElementById('scan-status');
  const startScanBtn = document.getElementById('start-scan-btn');
  const completeSetupBtn = document.getElementById('complete-setup-btn');
  const backBtn = document.getElementById('back-btn');
  const scanOverlay = document.querySelector('.face-scan-overlay');
  
  // Variables
  let isSetupComplete = false;
  
  // Event Listeners
  if (startScanBtn) {
    startScanBtn.addEventListener('click', startFaceScan);
  }
  
  if (completeSetupBtn) {
    completeSetupBtn.addEventListener('click', completeSetup);
  }
  
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Stop face recognition
      faceRecognition.stopCamera();
      faceRecognition.stopScan();
      
      // Redirect to login
      window.location.href = 'login.html';
    });
  }
  
  // Initialize
  initFaceSetup();
  
  // Initialize face setup
  async function initFaceSetup() {
    if (!cameraFeed) return;
    
    scanStatus.textContent = 'Initializing camera...';
    
    // Initialize face recognition
    const initialized = await faceRecognition.initialize(cameraFeed);
    
    if (initialized) {
      scanStatus.textContent = 'Camera ready. Click "Start Face Scan" to begin.';
      startScanBtn.disabled = false;
    } else {
      scanStatus.textContent = 'Failed to initialize camera. Please check camera permissions.';
      startScanBtn.disabled = true;
      utils.showNotification('Please allow camera access for Face ID setup', 'error');
    }
  }
  
  // Start face scan
  async function startFaceScan() {
    if (!scanOverlay) return;
    
    // Update UI
    scanStatus.textContent = 'Looking for face...';
    scanOverlay.classList.add('scanning');
    startScanBtn.disabled = true;
    
    // Get email from localStorage
    const rawEmail = localStorage.getItem('registeredEmail');
    const email = rawEmail ? rawEmail.trim().toLowerCase() : null;
    console.log('face-setup.js: Raw registeredEmail:', rawEmail);
    console.log('face-setup.js: Processed email:', email);
    
    // Validate email
    if (!email) {
      console.log('face-setup.js: No registeredEmail found');
      scanStatus.textContent = 'No registration email found. Please register again.';
      startScanBtn.disabled = true;
      utils.showNotification('No registration email found. Please register again.', 'error');
      setTimeout(() => {
        window.location.href = 'registration.html';
      }, 2000);
      return;
    }
    
    // Fetch user ID from face.php
    let userId;
    try {
      const response = await fetch('face.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_user_id', email })
      });
      const data = await response.json();
      console.log('face-setup.js: Response from face.php (get_user_id):', data);
      
      if (data.success && data.user_id) {
        userId = data.user_id;
        console.log('face-setup.js: Retrieved userId:', userId);
      } else {
        throw new Error(data.message || 'Failed to retrieve user ID');
      }
    } catch (error) {
      console.error('face-setup.js: Error fetching userId:', error);
      scanStatus.textContent = 'Failed to verify user. Please try again.';
      startScanBtn.disabled = false;
      utils.showNotification('Failed to verify user: ' + error.message, 'error');
      return;
    }
    
    // Start face scanning
    faceRecognition.startScan(
      // On face detected
      (faceData) => {
        console.log('face-setup.js: Face detected, faceData:', faceData);
        scanStatus.textContent = 'Face detected! Keep your face in the frame...';
        visualizeFacePoints(faceData);
      },
      // On scan complete
      async (faceData) => {
        console.log('face-setup.js: onScanComplete faceData:', faceData, 'type:', typeof faceData);
        
        // Handle Blazeface faceData
        let faceDataArray;
        if (!faceData) {
          console.error('face-setup.js: faceData is null or undefined');
          scanStatus.textContent = 'No face data detected. Please try again.';
          startScanBtn.disabled = false;
          scanOverlay.classList.remove('scanning');
          utils.showNotification('No face data detected. Please try again.', 'error');
          return;
        }
        
        // Extract landmarks and flatten to numeric array
        if (faceData.landmarks && Array.isArray(faceData.landmarks)) {
          // landmarks is [[x1, y1], [x2, y2], ...] (6 points)
          faceDataArray = faceData.landmarks.flat(); // [x1, y1, x2, y2, ...]
          console.log('face-setup.js: Extracted landmarks:', faceDataArray);
        } else {
          console.error('face-setup.js: No valid landmarks in faceData:', faceData);
          scanStatus.textContent = 'Invalid face data detected. Please try again.';
          startScanBtn.disabled = false;
          scanOverlay.classList.remove('scanning');
          utils.showNotification('Invalid face data detected. Please try again.', 'error');
          return;
        }
        
        // Validate faceDataArray
        if (faceDataArray.length === 0) {
          console.error('face-setup.js: Empty faceData array:', faceDataArray);
          scanStatus.textContent = 'No face data captured. Please try again.';
          startScanBtn.disabled = false;
          scanOverlay.classList.remove('scanning');
          utils.showNotification('No face data captured. Please try again.', 'error');
          return;
        }
        
        // Ensure numeric values
        if (!faceDataArray.every(val => typeof val === 'number' && isFinite(val))) {
          console.error('face-setup.js: faceData contains non-numeric values:', faceDataArray);
          scanStatus.textContent = 'Invalid face data values. Please try again.';
          startScanBtn.disabled = false;
          scanOverlay.classList.remove('scanning');
          utils.showNotification('Invalid face data values. Please try again.', 'error');
          return;
        }
        
        scanStatus.textContent = 'Face scan complete!';
        scanOverlay.classList.remove('scanning');
        scanOverlay.classList.add('scan-complete');
        
        // Store face data
        console.log('face-setup.js: Attempting to store face data for userId:', userId, 'email:', email, 'faceData:', faceDataArray);
        try {
          const result = await auth.storeFaceData(userId, faceDataArray, email);
          console.log('face-setup.js: auth.storeFaceData result:', result);
          
          if (result.success) {
            isSetupComplete = true;
            startScanBtn.style.display = 'none';
            completeSetupBtn.style.display = 'block';
            utils.showNotification('Face ID setup successful!', 'success');
          } else {
            scanStatus.textContent = 'Failed to save Face ID data: ' + result.message;
            startScanBtn.disabled = false;
            scanOverlay.classList.remove('scan-complete');
            utils.showNotification('Failed to save Face ID data: ' + result.message, 'error');
          }
        } catch (error) {
          console.error('face-setup.js: Error in auth.storeFaceData:', error);
          scanStatus.textContent = 'Failed to save Face ID data';
          startScanBtn.disabled = false;
          scanOverlay.classList.remove('scan-complete');
          utils.showNotification('Error saving Face ID data: ' + error.message, 'error');
        }
      },
      // On scan error
      (error) => {
        console.error('face-setup.js: Face scan error:', error);
        scanStatus.textContent = 'Face scan failed. Please try again.';
        scanOverlay.classList.remove('scanning');
        scanOverlay.classList.add('scan-error');
        startScanBtn.disabled = false;
        utils.showNotification('Face scan failed: ' + error, 'error');
        
        // Reset scan overlay
        setTimeout(() => {
          scanOverlay.classList.remove('scan-error');
        }, 1000);
      }
    );
  }
  
  // Complete setup
  function completeSetup() {
    if (!isSetupComplete) return;
    
    // Stop face recognition
    faceRecognition.stopCamera();
    faceRecognition.stopScan();
    
    // Show success message
    utils.showNotification('Face ID setup complete! You can now use Face ID to log in.', 'success');
    
    // Redirect to login
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
  }
  
  // Visualize face detection points
  function visualizeFacePoints(faceData) {
    // Clear existing points
    const existingPoints = document.querySelectorAll('.scan-points');
    existingPoints.forEach(point => point.remove());
    
    // Use landmarks for visualization
    const scanFrame = document.querySelector('.scan-frame');
    if (!scanFrame || !faceData.landmarks) return;
    
    const frameRect = scanFrame.getBoundingClientRect();
    const overlayRect = scanOverlay.getBoundingClientRect();
    
    faceData.landmarks.forEach(([x, y]) => {
      const point = document.createElement('div');
      point.classList.add('scan-points');
      
      // Map landmark coordinates to overlay
      const left = x - overlayRect.left;
      const top = y - overlayRect.top;
      
      point.style.left = `${left}px`;
      point.style.top = `${top}px`;
      
      scanOverlay.appendChild(point);
    });
  }
});