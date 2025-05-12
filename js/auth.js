class Auth {
  constructor() {
    this.currentUser = null;
    this.checkSession();
  }

  async storeFaceData(userId, faceData, email) {
    console.log('auth.js: storeFaceData called with userId:', userId, 'email:', email, 'faceData:', faceData, 'faceData type:', typeof faceData);
    
    // Validate faceData
    if (!faceData || !Array.isArray(faceData) || faceData.length === 0) {
      console.error('auth.js: Invalid or empty faceData:', faceData);
      return { success: false, message: 'Valid face data is required' };
    }
    
    // Ensure faceData contains numbers
    if (!faceData.every(val => typeof val === 'number' && isFinite(val))) {
      console.error('auth.js: faceData contains non-numeric values:', faceData);
      return { success: false, message: 'Face data must contain only numbers' };
    }
    
    try {
      const requestBody = {
        action: 'save',
        email: email.trim().toLowerCase(),
        face_data: faceData
      };
      console.log('auth.js: Sending request to face.php:', JSON.stringify(requestBody));
      
      const response = await fetch('face.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      console.log('auth.js: face.php response:', result);
      return result;
    } catch (error) {
      console.error('auth.js: Error in storeFaceData:', error);
      return { success: false, message: 'Network error: ' + error.message };
    }
  }

  createSession(user) {
    const session = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    localStorage.setItem('session', JSON.stringify(session));
  }

  checkSession() {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session) return false;

    const expiresAt = new Date(session.expiresAt);
    if (expiresAt < new Date()) {
      localStorage.removeItem('session');
      return false;
    }

    this.currentUser = { id: session.userId, email: session.email, fullName: session.fullName };
    return true;
  }

  logout() {
    localStorage.removeItem('session');
    this.currentUser = null;
    return { success: true, message: 'Logged out successfully' };
  }
}

const auth = new Auth();
window.auth = auth;