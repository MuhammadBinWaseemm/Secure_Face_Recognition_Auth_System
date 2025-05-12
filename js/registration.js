/**
 * Registration page functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const registrationForm = document.getElementById('registration-form');
  const registerBtn = document.getElementById('register-btn');
  const firstNameInput = document.getElementById('firstname');
  const lastNameInput = document.getElementById('lastname');
  const dobInput = document.getElementById('dob');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  const setupFaceIdCheckbox = document.getElementById('setup-face-id');
  const loginLink = document.getElementById('login-link');
  const backToLoginBtn = document.getElementById('back-to-login-btn');
  
  // Add password strength indicator
  addPasswordStrengthIndicator();
  
  // Event Listeners
  if (registrationForm) {
    registrationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (validateForm()) {
        handleRegistration();
      }
    });
  }
  
  // Toggle password visibility
  togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', togglePasswordVisibility);
  });
  
  // Check password strength on input
  if (passwordInput) {
    passwordInput.addEventListener('input', updatePasswordStrength);
  }
  
  // Back to login
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }
  
  // Validate phone number on input to only allow digits
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      this.value = this.value.replace(/\D/g, '');
    });
    phoneInput.addEventListener('input', debounce(checkPhoneAvailability, 500));
  }
  
  // Set max date for DOB (no future dates)
  if (dobInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dobInput.setAttribute('max', `${year}-${month}-${day}`);
  }
  
  // Real-time email validation
  if (emailInput) {
    emailInput.addEventListener('input', debounce(checkEmailAvailability, 500));
  }
  
  // Validate form before submission
  function validateForm() {
    // Validate first name
    if (!firstNameInput.value.trim()) {
      utils.showNotification('Please enter your first name', 'error');
      firstNameInput.focus();
      return false;
    }
    
    // Validate last name
    if (!lastNameInput.value.trim()) {
      utils.showNotification('Please enter your last name', 'error');
      lastNameInput.focus();
      return false;
    }
    
    // Validate DOB
    if (!dobInput.value) {
      utils.showNotification('Please enter your date of birth', 'error');
      dobInput.focus();
      return false;
    }
    
    // Validate age (at least 18 years old)
    const dob = new Date(dobInput.value);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (age < 18 || (age === 18 && (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())))) {
      utils.showNotification('You must be at least 18 years old to register', 'error');
      dobInput.focus();
      return false;
    }
    
    // Validate phone number
    if (!phoneInput.value.trim()) {
      utils.showNotification('Please enter your phone number', 'error');
      phoneInput.focus();
      return false;
    }
    
    if (phoneInput.value.length < 10) {
      utils.showNotification('Please enter a valid phone number (at least 10 digits)', 'error');
      phoneInput.focus();
      return false;
    }
    
    // Validate email
    if (!emailInput.value.trim()) {
      utils.showNotification('Please enter your email address', 'error');
      emailInput.focus();
      return false;
    }
    
    if (!utils.isValidEmail(emailInput.value)) {
      utils.showNotification('Please enter a valid email address', 'error');
      emailInput.focus();
      return false;
    }
    
    // Validate email domain
    if (!emailInput.value.endsWith('@gmail.com') && !emailInput.value.endsWith('@giki.edu.pk')) {
      utils.showNotification('Only @gmail.com and @giki.edu.pk emails are supported', 'error');
      emailInput.focus();
      return false;
    }
    
    // Validate password
    if (!passwordInput.value) {
      utils.showNotification('Please create a password', 'error');
      passwordInput.focus();
      return false;
    }
    
    // Check password strength
    const strengthCheck = utils.checkPasswordStrength(passwordInput.value);
    if (strengthCheck.level === 'weak') {
      utils.showNotification('Please create a stronger password', 'error');
      passwordInput.focus();
      return false;
    }
    
    // Validate password confirmation
    if (passwordInput.value !== confirmPasswordInput.value) {
      utils.showNotification('Passwords do not match', 'error');
      confirmPasswordInput.focus();
      return false;
    }
    
    return true;
  }
  
  // Handle registration
  async function handleRegistration() {
    // Create user data object
    const userData = {
      firstName: firstNameInput.value.trim(),
      lastName: lastNameInput.value.trim(),
      dob: dobInput.value,
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
      setupFaceId: setupFaceIdCheckbox.checked
    };
    
    // Check phone availability before submission
    const phoneResponse = await fetch('register.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `check_phone=1&phone=${encodeURIComponent(userData.phone)}`
    });
    const phoneData = await phoneResponse.json();
    if (phoneData.exists) {
      utils.showNotification('This phone number is already registered', 'error');
      phoneInput.focus();
      return;
    } else if (phoneData.error) {
      utils.showNotification(phoneData.error, 'error');
      return;
    }
    
    // Submit to register.php
    fetch('register.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `firstname=${encodeURIComponent(userData.firstName)}&lastname=${encodeURIComponent(userData.lastName)}&dob=${encodeURIComponent(userData.dob)}&phone=${encodeURIComponent(userData.phone)}&email=${encodeURIComponent(userData.email)}&password=${encodeURIComponent(userData.password)}`
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Store user data and email for OTP verification
        localStorage.setItem('pendingRegistration', JSON.stringify(userData));
        localStorage.setItem('registeredEmail', data.email);
        
        // Send OTP
        simulateSendOTP(userData.email);
      } else {
        utils.showNotification('Registration failed: ' + (data.error || 'Unknown error'), 'error');
      }
    })
    .catch(error => {
      console.error('Registration error:', error);
      utils.showNotification('Failed to save registration data. Please try again.', 'error');
    });
  }
  
  // Toggle password visibility
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
  
  // Add password strength indicator to DOM
  function addPasswordStrengthIndicator() {
    if (!passwordInput) return;
    
    // Create password strength elements
    const strengthContainer = document.createElement('div');
    strengthContainer.classList.add('password-strength-container');
    
    const strengthBar = document.createElement('div');
    strengthBar.classList.add('password-strength');
    strengthBar.innerHTML = '<div class="strength-bar"></div>';
    
    const strengthTips = document.createElement('div');
    strengthTips.classList.add('password-tips');
    strengthTips.innerHTML = `
      <ul>
        <li id="length-check">At least 8 characters</li>
        <li id="uppercase-check">At least one uppercase letter</li>
        <li id="lowercase-check">At least one lowercase letter</li>
        <li id="number-check">At least one number</li>
        <li id="special-check">At least one special character</li>
      </ul>
    `;
    
    strengthContainer.appendChild(strengthBar);
    strengthContainer.appendChild(strengthTips);
    
    // Insert after password input
    passwordInput.parentNode.parentNode.insertBefore(
      strengthContainer,
      passwordInput.parentNode.nextSibling
    );
  }
  
  // Update password strength indicator
  function updatePasswordStrength() {
    if (!passwordInput) return;
    
    const password = passwordInput.value;
    const strengthResult = utils.checkPasswordStrength(password);
    
    // Update strength bar
    const strengthBar = document.querySelector('.strength-bar');
    if (strengthBar) {
      strengthBar.className = 'strength-bar';
      
      if (password) {
        if (strengthResult.level === 'strong') {
          strengthBar.classList.add('strong');
        } else if (strengthResult.level === 'medium') {
          strengthBar.classList.add('medium');
        } else {
          strengthBar.classList.add('weak');
        }
      }
    }
    
    // Update checklist
    updatePasswordChecklist(strengthResult.feedback);
  }
  
  // Update password requirement checklist
  function updatePasswordChecklist(feedback) {
    // Update each check item
    const lengthCheck = document.getElementById('length-check');
    const uppercaseCheck = document.getElementById('uppercase-check');
    const lowercaseCheck = document.getElementById('lowercase-check');
    const numberCheck = document.getElementById('number-check');
    const specialCheck = document.getElementById('special-check');
    
    if (lengthCheck) {
      toggleChecklistItem(lengthCheck, feedback.hasMinLength);
    }
    
    if (uppercaseCheck) {
      toggleChecklistItem(uppercaseCheck, feedback.hasUpperCase);
    }
    
    if (lowercaseCheck) {
      toggleChecklistItem(lowercaseCheck, feedback.hasLowerCase);
    }
    
    if (numberCheck) {
      toggleChecklistItem(numberCheck, feedback.hasNumbers);
    }
    
    if (specialCheck) {
      toggleChecklistItem(specialCheck, feedback.hasSpecialChars);
    }
  }
  
  // Toggle checklist item valid state
  function toggleChecklistItem(element, isValid) {
    if (isValid) {
      element.classList.add('valid');
    } else {
      element.classList.remove('valid');
    }
  }
  
  // Check email availability
  function checkEmailAvailability() {
    const email = emailInput.value.trim();
    
    // Only check if email is valid format
    if (utils.isValidEmail(email)) {
      fetch('register.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `check_email=1&email=${encodeURIComponent(email)}`
      })
      .then(response => response.json())
      .then(data => {
        if (data.exists) {
          utils.showNotification('This email is already registered', 'error');
          registerBtn.disabled = true;
        } else if (data.error) {
          utils.showNotification(data.error, 'error');
          registerBtn.disabled = true;
        } else {
          registerBtn.disabled = false;
        }
      })
      .catch(error => {
        console.error('Email check error:', error);
        utils.showNotification('Failed to verify email. Please try again.', 'error');
      });
    }
  }
  
  // Check phone availability
  function checkPhoneAvailability() {
    const phone = phoneInput.value.trim();
    
    // Only check if phone is at least 10 digits
    if (phone.length >= 10) {
      fetch('register.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `check_phone=1&phone=${encodeURIComponent(phone)}`
      })
      .then(response => response.json())
      .then(data => {
        if (data.exists) {
          utils.showNotification('This phone number is already registered', 'error');
          registerBtn.disabled = true;
        } else if (data.error) {
          utils.showNotification(data.error, 'error');
          registerBtn.disabled = true;
        } else {
          registerBtn.disabled = false;
        }
      })
      .catch(error => {
        console.error('Phone check error:', error);
        utils.showNotification('Failed to verify phone number. Please try again.', 'error');
      });
    }
  }
  
  // Debounce function to limit API calls
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Send OTP via EmailJS
  function simulateSendOTP(email) {
    // Select EmailJS service ID based on email domain
    let serviceId = 'service_jdtk3x4'; // Default for @gmail.com
    if (email.endsWith('@giki.edu.pk')) {
      serviceId = 'service_xt65nbs';
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString();

    // EmailJS parameters
    const params = {
      email: email,
      passcode: otp,
      time: expiry
    };

    // Show sending notification
    utils.showNotification('Sending OTP...', 'info');

    // Send OTP via EmailJS
    emailjs.send(serviceId, 'template_muoc1ho', params)
      .then(() => {
        utils.showNotification(`OTP sent to ${email}. Check your inbox.`, 'success');
        
        // Store OTP and related data
        localStorage.setItem('currentOTP', otp);
        localStorage.setItem('otpEmail', email);
        localStorage.setItem('otpExpiry', (Date.now() + 5 * 60 * 1000).toString());

        // Redirect to OTP verification page
        setTimeout(() => {
          window.location.href = 'verify-otp.html';
        }, 1000);
      })
      .catch((error) => {
        console.error('EmailJS Error:', error);
        utils.showNotification('Failed to send OTP. Please try again later.', 'error');
      });
  }
});