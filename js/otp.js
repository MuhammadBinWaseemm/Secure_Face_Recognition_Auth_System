/**
 * OTP verification functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  const codeInputs = document.querySelectorAll('.code-input');
  const verifyBtn = document.getElementById('verify-btn');
  const resendCodeBtn = document.getElementById('resend-code-btn');
  const maskedEmailSpan = document.getElementById('masked-email');
  const countdownElement = document.getElementById('countdown');
  const backToRegistrationBtn = document.getElementById('back-to-registration-btn');
  
  let countdownInterval;
  let timeLeft = 300; // 5 minutes
  const email = localStorage.getItem('otpEmail');
  const registeredEmail = localStorage.getItem('registeredEmail');
  
  initPage();
  
  if (verifyBtn) {
    verifyBtn.addEventListener('click', verifyOTP);
  }
  
  if (resendCodeBtn) {
    resendCodeBtn.addEventListener('click', resendOTP);
  }
  
  if (backToRegistrationBtn) {
    backToRegistrationBtn.addEventListener('click', cancelRegistration);
  }
  
  codeInputs.forEach((input, index) => {
    if (index === 0) {
      input.focus();
    }
    input.addEventListener('input', (e) => {
      const value = e.target.value;
      if (/^\d*$/.test(value)) {
        if (value && index < codeInputs.length - 1) {
          codeInputs[index + 1].focus();
        }
        if (value) {
          input.classList.add('filled');
        } else {
          input.classList.remove('filled');
        }
        checkFormCompletion();
      } else {
        e.target.value = '';
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        codeInputs[index - 1].focus();
      }
    });
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData('text');
      if (/^\d+$/.test(pasteData)) {
        for (let i = 0; i < Math.min(pasteData.length, codeInputs.length); i++) {
          codeInputs[i].value = pasteData[i];
          codeInputs[i].classList.add('filled');
          if (i < codeInputs.length - 1 && i === pasteData.length - 1) {
            codeInputs[i + 1].focus();
          } else if (i === codeInputs.length - 1) {
            codeInputs[i].blur();
          }
        }
        checkFormCompletion();
      }
    });
  });
  
  function initPage() {
    if (!email || !registeredEmail) {
      window.location.href = 'registration.html';
      return;
    }
    if (maskedEmailSpan) {
      maskedEmailSpan.textContent = utils.maskEmail(email);
    }
    startCountdown();
  }
  
  function startCountdown() {
    const expiryTime = localStorage.getItem('otpExpiry');
    if (expiryTime) {
      timeLeft = Math.max(0, Math.floor((parseInt(expiryTime) - Date.now()) / 1000));
    }
    updateCountdown();
    countdownInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        timeLeft = 0;
        if (resendCodeBtn) {
          resendCodeBtn.classList.remove('disabled');
        }
        cancelRegistration();
      }
      updateCountdown();
    }, 1000);
  }
  
  function updateCountdown() {
    if (!countdownElement) return;
    const formattedTime = utils.formatTime(timeLeft);
    countdownElement.textContent = formattedTime;
    if (timeLeft < 60) {
      countdownElement.classList.add('countdown-ending');
    } else {
      countdownElement.classList.remove('countdown-ending');
    }
  }
  
  function checkFormCompletion() {
    let allFilled = true;
    codeInputs.forEach(input => {
      if (!input.value) {
        allFilled = false;
      }
    });
    if (verifyBtn) {
      verifyBtn.disabled = !allFilled;
    }
    return allFilled;
  }
  
  function getEnteredCode() {
    let code = '';
    codeInputs.forEach(input => {
      code += input.value;
    });
    return code;
  }
  
  function verifyOTP() {
    const enteredCode = getEnteredCode();
    const storedCode = localStorage.getItem('currentOTP');
    const pendingRegistration = JSON.parse(localStorage.getItem('pendingRegistration'));
    
    fetch('otp.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=verify_otp&otp=${encodeURIComponent(enteredCode)}&email=${encodeURIComponent(registeredEmail)}&stored_otp=${encodeURIComponent(storedCode)}&otp_expiry=${encodeURIComponent(localStorage.getItem('otpExpiry'))}`
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        utils.showNotification('Email verification successful!', 'success');
        
        // Clear all except registeredEmail
        localStorage.removeItem('pendingRegistration');
        localStorage.removeItem('currentOTP');
        localStorage.removeItem('otpEmail');
        localStorage.removeItem('otpExpiry');
        
        if (pendingRegistration.setupFaceId) {
          setTimeout(() => {
            window.location.href = 'face-setup.html?from=registration';
          }, 1000);
        } else {
          localStorage.removeItem('registeredEmail'); // Clear only if not setting up Face ID
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 1000);
        }
      } else {
        showError(data.error || 'Verification failed');
        localStorage.removeItem('pendingRegistration');
        localStorage.removeItem('currentOTP');
        localStorage.removeItem('otpEmail');
        localStorage.removeItem('otpExpiry');
        localStorage.removeItem('registeredEmail');
      }
    })
    .catch(error => {
      console.error('OTP verification error:', error);
      showError('Failed to verify OTP. Please try again.');
    });
  }
  
  function cancelRegistration() {
    fetch('otp.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=cancel&email=${encodeURIComponent(registeredEmail)}`
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        utils.showNotification('Registration cancelled', 'info');
      } else {
        utils.showNotification('Failed to cancel registration', 'error');
      }
      localStorage.removeItem('pendingRegistration');
      localStorage.removeItem('currentOTP');
      localStorage.removeItem('otpEmail');
      localStorage.removeItem('otpExpiry');
      localStorage.removeItem('registeredEmail');
      setTimeout(() => {
        window.location.href = 'registration.html';
      }, 1000);
    })
    .catch(error => {
      console.error('Cancellation error:', error);
      utils.showNotification('Failed to cancel registration', 'error');
      window.location.href = 'registration.html';
    });
  }
  
  function resendOTP(e) {
    e.preventDefault();
    if (resendCodeBtn.classList.contains('disabled')) {
      return;
    }
    resendCodeBtn.classList.add('disabled');
    const email = localStorage.getItem('otpEmail');
    if (!email.endsWith('@gmail.com') && !email.endsWith('@giki.edu.pk')) {
      utils.showNotification('Only @gmail.com and @giki.edu.pk emails are supported.', 'error');
      return;
    }
    let serviceId = 'service_jdtk3x4';
    if (email.endsWith('@giki.edu.pk')) {
      serviceId = 'service_xt65nbs';
    }
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString();
    const params = {
      email: email,
      passcode: newOtp,
      time: expiry
    };
    utils.showNotification('Sending new OTP...', 'info');
    emailjs.send(serviceId, 'template_muoc1ho', params)
      .then(() => {
        utils.showNotification(`New OTP sent to ${email}. Check your inbox.`, 'success');
        localStorage.setItem('currentOTP', newOtp);
        localStorage.setItem('otpExpiry', (Date.now() + 5 * 60 * 1000).toString());
        timeLeft = 300;
        clearInterval(countdownInterval);
        startCountdown();
        codeInputs.forEach(input => {
          input.value = '';
          input.classList.remove('filled');
        });
        codeInputs[0].focus();
      })
      .catch((error) => {
        console.error('EmailJS Error:', error);
        utils.showNotification('Failed to send new OTP. Please try again later.', 'error');
        resendCodeBtn.classList.remove('disabled');
      });
  }
  
  function showError(message) {
    utils.showNotification(message, 'error');
    codeInputs.forEach(input => {
      input.classList.add('error');
    });
    setTimeout(() => {
      codeInputs.forEach(input => {
        input.classList.remove('error');
      });
    }, 800);
  }
});