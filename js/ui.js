/**
 * UI handling for the authentication system
 */

const UIController = (function() {
  // Page elements
  const pageContainer = document.getElementById('page-container');
  
  // Current page
  let currentPage = 'login';
  
  // Templates
  const templates = {
    login: document.getElementById('login-template'),
    register: document.getElementById('register-template'),
    resetPassword: document.getElementById('reset-password-template'),
    verifyCode: document.getElementById('verify-code-template'),
    createNewPassword: document.getElementById('create-new-password-template'),
    faceSetup: document.getElementById('face-setup-template'),
    faceVerification: document.getElementById('face-verification-template')
  };
  
  // Load a page from template
  function loadPage(pageName, data = {}) {
    // Get template
    const template = templates[pageName];
    if (!template) {
      console.error('Template for page ${pageName} not found');
      return;
    }
    
    // Create page element
    const pageId = '${pageName}-page';
    let pageElement = document.getElementById(pageId);
    
    // Create the page if it doesn't exist
    if (!pageElement) {
      pageElement = document.createElement('div');
      pageElement.id = pageId;
      pageElement.className = 'page';
      pageContainer.appendChild(pageElement);
    }
    
    // Clone template content
    const content = template.content.cloneNode(true);
    
    // Clear and update page content
    pageElement.innerHTML = '';
    pageElement.appendChild(content);
    
    // Update page-specific data
    updatePageData(pageName, pageElement, data);
    
    // Hide current page and show new page
    const currentPageElement = document.querySelector('.page.active');
    if (currentPageElement) {
      currentPageElement.classList.remove('active');
    }
    
    // Set new page as active
    pageElement.classList.add('active');
    currentPage = pageName;
    
    // Attach event listeners for the page
    attachPageEventListeners(pageName, pageElement, data);
    
    return pageElement;
  }
  
  // Update page-specific data
  function updatePageData(pageName, pageElement, data) {
    switch (pageName) {
      case 'verifyCode':
        const maskedEmailEl = pageElement.querySelector('#masked-email');
        if (maskedEmailEl && data.maskedEmail) {
          maskedEmailEl.textContent = data.maskedEmail;
        }
        break;
        
      // Add other page-specific data updates here
    }
  }
  
  // Attach event listeners for the page
  function attachPageEventListeners(pageName, pageElement, data) {
    // Common back button
    const backBtn = pageElement.querySelector('#back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        history.back();
        // Default back to login page
        loadPage('login');
      });
    }
    
    // Page-specific event listeners
    switch (pageName) {
      case 'login':
        attachLoginPageListeners(pageElement);
        break;
        
      case 'register':
        attachRegisterPageListeners(pageElement);
        break;
        
      case 'resetPassword':
        attachResetPasswordListeners(pageElement);
        break;
        
      case 'verifyCode':
        attachVerifyCodeListeners(pageElement, data);
        break;
        
      case 'createNewPassword':
        attachCreateNewPasswordListeners(pageElement);
        break;
        
      case 'faceSetup':
        attachFaceSetupListeners(pageElement);
        break;
        
      case 'faceVerification':
        attachFaceVerificationListeners(pageElement, data);
        break;
    }
    
    // Password toggle visibility
    const togglePasswordBtns = pageElement.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const passwordInput = btn.parentElement.querySelector('input');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle icon (simplified for demo)
        btn.classList.toggle('showing');
      });
    });
  }
  
  // Login page event listeners
  function attachLoginPageListeners(pageElement) {
    // Register link
    const registerLink = pageElement.querySelector('#register-link');
    if (registerLink) {
      registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        loadPage('register');
      });
    }
    
    // Forgot password link
    const forgotPasswordLink = pageElement.querySelector('#forgot-password-link');
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        loadPage('resetPassword');
      });
    }
    
    // Login button
    const loginBtn = pageElement.querySelector('#login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        const usernameInput = pageElement.querySelector('#username');
        const passwordInput = pageElement.querySelector('#password');
        const rememberMe = pageElement.querySelector('#remember-me');
        
        if (!usernameInput.value || !passwordInput.value) {
          showNotification('Please enter both username and password', 'error');
          return;
        }
        
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        
        try {
          const user = await AuthService.login(usernameInput.value, passwordInput.value);
          showNotification('Login successful!', 'success');
          
          // In a real app, redirect to dashboard or home page
          setTimeout(() => {
            alert('Login successful! Welcome back, ' + user.name);
            loginBtn.disabled = false;
            loginBtn.textContent = 'Log In';
          }, 1000);
        } catch (error) {
          showNotification(error.message, 'error');
          loginBtn.disabled = false;
          loginBtn.textContent = 'Log In';
        }
      });
    }
    
    // Use Face ID button
    const useFaceIdBtn = pageElement.querySelector('#use-face-id');
    if (useFaceIdBtn) {
      useFaceIdBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Get username if entered
        const usernameInput = pageElement.querySelector('#username');
        const username = usernameInput.value;
        
        loadPage('faceVerification', { username });
      });
    }
  }
  
  // Register page event listeners
  function attachRegisterPageListeners(pageElement) {
    // Login link
    const loginLink = pageElement.querySelector('#login-link');
    if (loginLink) {
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loadPage('login');
      });
    }
    
    // Register button
    const registerBtn = pageElement.querySelector('#register-btn');
    if (registerBtn) {
      registerBtn.addEventListener('click', async () => {
        const fullnameInput = pageElement.querySelector('#fullname');
        const emailInput = pageElement.querySelector('#email');
        const passwordInput = pageElement.querySelector('#new-password');
        const confirmPasswordInput = pageElement.querySelector('#confirm-password');
        const setupFaceId = pageElement.querySelector('#setup-face-id');
        
        // Validate inputs
        if (!fullnameInput.value || !emailInput.value || !passwordInput.value || !confirmPasswordInput.value) {
          showNotification('All fields are required', 'error');
          return;
        }
        
        if (passwordInput.value !== confirmPasswordInput.value) {
          showNotification('Passwords do not match', 'error');
          return;
        }
        
        if (!isValidEmail(emailInput.value)) {
          showNotification('Please enter a valid email address', 'error');
          return;
        }
        
        const passwordCheck = getPasswordStrengthFeedback(passwordInput.value);
        if (!passwordCheck.valid) {
          showNotification(passwordCheck.message, 'error');
          return;
        }
        
        registerBtn.disabled = true;
        registerBtn.textContent = 'Registering...';
        
        try {
          const user = await AuthService.register(
            fullnameInput.value,
            emailInput.value,
            passwordInput.value
          );
          
          showNotification('Registration successful!', 'success');
          
          // If setup Face ID is checked
          if (setupFaceId.checked) {
            loadPage('faceSetup');
          } else {
            // In a real app, redirect to dashboard or verification page
            setTimeout(() => {
              alert('Registration successful! Welcome, ' + user.name);
              loadPage('login');
            }, 1000);
          }
        } catch (error) {
          showNotification(error.message, 'error');
          registerBtn.disabled = false;
          registerBtn.textContent = 'Register';
        }
      });
    }
  }
  
  // Reset password page listeners
  function attachResetPasswordListeners(pageElement) {
    // Send reset link button
    const sendResetLinkBtn = pageElement.querySelector('#send-reset-link');
    if (sendResetLinkBtn) {
      sendResetLinkBtn.addEventListener('click', async () => {
        const emailInput = pageElement.querySelector('#reset-email');
        
        if (!emailInput.value || !isValidEmail(emailInput.value)) {
          showNotification('Please enter a valid email address', 'error');
          return;
        }
        
        sendResetLinkBtn.disabled = true;
        sendResetLinkBtn.textContent = 'Sending...';
        
        try {
          const result = await AuthService.requestPasswordReset(emailInput.value);
          
          showNotification('Verification code sent to your email', 'success');
          
          // Navigate to verify code page
          loadPage('verifyCode', {
            email: emailInput.value,
            maskedEmail: result.maskedEmail,
            verificationCode: result.verificationCode // For demo only
          });
        } catch (error) {
          showNotification(error.message, 'error');
          sendResetLinkBtn.disabled = false;
          sendResetLinkBtn.textContent = 'Send Reset Password Link';
        }
      });
    }
  }
  
  // Verify code page listeners
  function attachVerifyCodeListeners(pageElement, data) {
    // Set up code input behavior
    const codeInputs = pageElement.querySelectorAll('.code-input');
    codeInputs.forEach((input, index) => {
      // Auto-focus first input
      if (index === 0) {
        setTimeout(() => input.focus(), 100);
      }
      
      // Auto-advance to next input
      input.addEventListener('input', () => {
        if (input.value.length === input.maxLength && index < codeInputs.length - 1) {
          codeInputs[index + 1].focus();
        }
      });
      
      // Handle backspace
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          codeInputs[index - 1].focus();
        }
      });
      
      // For demo: if we have a verification code, pre-fill the first two digits
      if (index === 0 && data.verificationCode) {
        input.value = data.verificationCode.charAt(0);
      }
      if (index === 1 && data.verificationCode) {
        input.value = data.verificationCode.charAt(1);
      }
    });
    
    // Verify button
    const verifyBtn = pageElement.querySelector('#verify-btn');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', async () => {
        // Collect code from all inputs
        let code = '';
        codeInputs.forEach(input => {
          code += input.value;
        });
        
        if (code.length !== 6) {
          showNotification('Please enter the complete 6-digit code', 'error');
          return;
        }
        
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';
        
        try {
          await AuthService.verifyResetCode(data.email, code);
          
          showNotification('Code verified successfully', 'success');
          
          // Navigate to create new password page
          loadPage('createNewPassword');
        } catch (error) {
          showNotification(error.message, 'error');
          verifyBtn.disabled = false;
          verifyBtn.textContent = 'Verify';
        }
      });
    }
  }
  
  // Create new password page listeners
  function attachCreateNewPasswordListeners(pageElement) {
    // Confirm changes button
    const confirmChangesBtn = pageElement.querySelector('#confirm-changes-btn');
    if (confirmChangesBtn) {
      confirmChangesBtn.addEventListener('click', async () => {
        const passwordInput = pageElement.querySelector('#new-reset-password');
        const confirmPasswordInput = pageElement.querySelector('#confirm-reset-password');
        
        if (!passwordInput.value || !confirmPasswordInput.value) {
          showNotification('Both fields are required', 'error');
          return;
        }
        
        if (passwordInput.value !== confirmPasswordInput.value) {
          showNotification('Passwords do not match', 'error');
          return;
        }
        
        const passwordCheck = getPasswordStrengthFeedback(passwordInput.value);
        if (!passwordCheck.valid) {
          showNotification(passwordCheck.message, 'error');
          return;
        }
        
        confirmChangesBtn.disabled = true;
        confirmChangesBtn.textContent = 'Updating...';
        
        try {
          await AuthService.resetPassword(passwordInput.value, confirmPasswordInput.value);
          
          showNotification('Password updated successfully', 'success');
          
          // Navigate to login page
          setTimeout(() => {
            loadPage('login');
          }, 1500);
        } catch (error) {
          showNotification(error.message, 'error');
          confirmChangesBtn.disabled = false;
          confirmChangesBtn.textContent = 'Confirm Changes';
        }
      });
    }
  }
  
  // Face setup page listeners
  function attachFaceSetupListeners(pageElement) {
    let cameraRunning = false;
    let videoElement = pageElement.querySelector('#camera-feed');
    let scanStatus = pageElement.querySelector('#scan-status');
    let startScanBtn = pageElement.querySelector('#start-scan-btn');
    let completeSetupBtn = pageElement.querySelector('#complete-setup-btn');
    let scanOverlay = pageElement.querySelector('.face-scan-overlay');
    
    // Initialize camera when page loads
    startScanBtn.addEventListener('click', async () => {
      if (!videoElement) return;
      
      try {
        await FaceRecognitionService.setupCamera(videoElement);
        cameraRunning = true;
        scanStatus.textContent = 'Position your face within the frame';
        startScanBtn.style.display = 'none';
        
        // Face detection interval
        const detectionInterval = setInterval(async () => {
          if (!cameraRunning) {
            clearInterval(detectionInterval);
            return;
          }
          
          try {
            // Create canvas from video for face detection
            const canvas = FaceRecognitionService.createCanvasFromVideo(videoElement);
            
            // Detect faces
            const faces = await FaceRecognitionService.detectFaces(canvas);
            
            if (faces.length > 0) {
              // Face detected
              scanOverlay.classList.add('face-detected');
              scanStatus.textContent = 'Face detected! Keep still...';
              
              // After a brief pause, complete the scan
              setTimeout(() => {
                // Success animation
                scanOverlay.classList.remove('face-detected');
                scanOverlay.classList.add('scan-success');
                scanStatus.textContent = 'Face scan complete!';
                
                // Show complete setup button
                completeSetupBtn.style.display = 'block';
                
                // Store the face descriptor for the current user
                const currentUser = AuthService.getCurrentUser();
                if (currentUser) {
                  // In a real app, we would use the actual face descriptor
                  const mockFaceDescriptor = Array.from({ length: 128 }, () => Math.random());
                  
                  // Store the descriptor with the user
                  currentUser.faceDescriptor = mockFaceDescriptor;
                  
                  // Set the face ID for the user
                  AuthService.setFaceId(mockFaceDescriptor)
                    .then(() => {
                      console.log('Face ID set successfully');
                    })
                    .catch(error => {
                      console.error('Error setting Face ID:', error);
                      showNotification('Error setting up Face ID', 'error');
                    });
                }
                
                clearInterval(detectionInterval);
              }, 2000);
            } else {
              // No face detected
              scanOverlay.classList.remove('face-detected');
              scanStatus.textContent = 'Position your face within the frame';
            }
          } catch (error) {
            console.error('Face detection error:', error);
            scanStatus.textContent = 'Error detecting face. Please try again.';
          }
        }, 500);
        
      } catch (error) {
        scanStatus.textContent = error.message || 'Error accessing camera';
        showNotification('Error: ' + error.message, 'error');
      }
    });
    
    // Complete setup button
    completeSetupBtn.addEventListener('click', () => {
      // Stop the camera
      if (videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      showNotification('Face ID set up successfully!', 'success');
      
      // Navigate to login page
      setTimeout(() => {
        loadPage('login');
      }, 1000);
    });
    
    // Clean up when leaving page
    return () => {
      if (videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      cameraRunning = false;
    };
  }
  
  // Face verification page listeners
  function attachFaceVerificationListeners(pageElement, data) {
    let cameraRunning = false;
    let videoElement = pageElement.querySelector('#verification-camera');
    let verificationStatus = pageElement.querySelector('#verification-status');
    let scanOverlay = pageElement.querySelector('.face-scan-overlay');
    let usePasswordLink = pageElement.querySelector('#use-password-instead');
    
    // Use password instead link
    usePasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Stop the camera
      if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      loadPage('login');
    });
    
    // Initialize camera automatically
    (async function initCamera() {
      if (!videoElement) return;
      
      try {
        await FaceRecognitionService.setupCamera(videoElement);
        cameraRunning = true;
        verificationStatus.textContent = 'Looking for your face...';
        
        // Face verification interval
        const verificationInterval = setInterval(async () => {
          if (!cameraRunning) {
            clearInterval(verificationInterval);
            return;
          }
          
          try {
            // Create canvas from video for face detection
            const canvas = FaceRecognitionService.createCanvasFromVideo(videoElement);
            
            // Detect faces
            const faces = await FaceRecognitionService.detectFaces(canvas);
            
            if (faces.length > 0) {
              // Face detected
              scanOverlay.classList.add('face-detected');
              verificationStatus.textContent = 'Face detected! Verifying...';
              
              // After a brief pause, simulate verification
              setTimeout(() => {
                // For demo, always succeed
                // In a real app, we would use face recognition logic here
                const recognized = true;
                
                if (recognized) {
                  // Success animation
                  scanOverlay.classList.remove('face-detected');
                  scanOverlay.classList.add('scan-success');
                  verificationStatus.textContent = 'Face verified! Logging you in...';
                  
                  // Simulate login with face
                  const mockFaceDescriptor = Array.from({ length: 128 }, () => Math.random());
                  AuthService.loginWithFace(mockFaceDescriptor)
                    .then(result => {
                      showNotification('Login successful!', 'success');
                      
                      // In a real app, redirect to dashboard or home page
                      setTimeout(() => {
                        alert('Login successful! Welcome back, ' + result.user.name);
                        loadPage('login');
                      }, 1500);
                    })
                    .catch(error => {
                      showNotification(error.message, 'error');
                      scanOverlay.classList.remove('scan-success');
                      scanOverlay.classList.add('scan-error');
                      verificationStatus.textContent = 'Verification failed. Please try again.';
                    });
                } else {
                  // Error animation
                  scanOverlay.classList.remove('face-detected');
                  scanOverlay.classList.add('scan-error');
                  verificationStatus.textContent = 'Face not recognized. Please try again.';
                }
                
                clearInterval(verificationInterval);
              }, 2000);
            } else {
              // No face detected
              scanOverlay.classList.remove('face-detected');
              verificationStatus.textContent = 'Position your face within the frame';
            }
          } catch (error) {
            console.error('Face verification error:', error);
            verificationStatus.textContent = 'Error verifying face. Please try again.';
          }
        }, 500);
        
      } catch (error) {
        verificationStatus.textContent = error.message || 'Error accessing camera';
        showNotification('Error: ' + error.message, 'error');
      }
    })();
    
    // Clean up when leaving page
    return () => {
      if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      cameraRunning = false;
    };
  }
  
  // Public API
  return {
    loadPage
  };
})();