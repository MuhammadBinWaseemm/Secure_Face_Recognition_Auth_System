/**
 * Utility functions for the application
 */
window.utils = {
  /**
   * Show a specific page and hide others
   * @param {string} pageId - The ID of the page to show
   */
  showPage: (pageId) => {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.add('active');
    }
  },
  
  /**
   * Show a notification toast
   * @param {string} message - The message to display
   * @param {string} type - The type of notification (success, error, warning)
   * @param {number} duration - How long to show the notification in ms
   */
  showNotification: (message, type = 'info', duration = 3000) => {
    // Check if notification container exists, if not create it
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.className = 'notification-container';
      document.body.appendChild(notificationContainer);
      
      // Add styles for notification container
      const style = document.createElement('style');
      style.textContent = `
        .notification-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
        }
        
        .notification {
          padding: 15px 20px;
          margin-bottom: 10px;
          border-radius: 8px;
          width: 300px;
          color: white;
          animation: slideIn 0.3s ease forwards;
          display: flex;
          align-items: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .notification.info {
          background: linear-gradient(90deg, #4e6fff, #3e60ff);
        }
        
        .notification.success {
          background: linear-gradient(90deg, #28c38c, #18a36c);
        }
        
        .notification.warning {
          background: linear-gradient(90deg, #ffb84d, #ff9a22);
        }
        
        .notification.error {
          background: linear-gradient(90deg, #ff5e5e, #ff3838);
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after duration
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
  },
  
  /**
   * Validate email format
   * @param {string} email - The email to validate
   * @returns {boolean} - Whether the email is valid
   */
  isValidEmail: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  
  /**
   * Validate password strength
   * @param {string} password - The password to check
   * @returns {Object} - Password strength assessment
   */
  checkPasswordStrength: (password) => {
    let strength = 0;
    const feedback = {
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /[0-9]/.test(password),
      hasSpecialChars: /[^A-Za-z0-9]/.test(password)
    };
    
    // Calculate strength
    Object.values(feedback).forEach(criterion => {
      if (criterion) strength++;
    });
    
    let result = {
      score: strength,
      feedback: feedback,
      level: 'weak'
    };
    
    if (strength >= 4) {
      result.level = 'strong';
    } else if (strength >= 3) {
      result.level = 'medium';
    }
    
    return result;
  },
  
  /**
   * Mask email for display
   * @param {string} email - Email to mask
   * @returns {string} - Masked email
   */
  maskEmail: (email) => {
    if (!email) return '';
    
    const [username, domain] = email.split('@');
    const maskedUsername = username.slice(0, 2) + '***';
    
    return `${maskedUsername}@${domain}`;
  },
  
  /**
   * Generate a random OTP
   * @param {number} length - Length of OTP
   * @returns {string} - Generated OTP
   */
  generateOTP: (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    
    return otp;
  },
  
  /**
   * Store data in local storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  storeData: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  /**
   * Retrieve data from local storage
   * @param {string} key - Storage key
   * @returns {any} - Retrieved value
   */
  getData: (key) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  
  /**
   * Format countdown timer
   * @param {number} seconds - Total seconds
   * @returns {string} - Formatted time
   */
  formatTime: (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }


};