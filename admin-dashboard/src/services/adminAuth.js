import api from '../utils/api';

/**
 * Handles initial login step.
 * Returns { requires2FA: true, email: '...' } if 2FA is needed,
 * or { success: true, token: '...', email: '...' } if logged in directly.
 */
export async function loginAdmin(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  
  if (data.token) {
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminAuth', 'true');
    localStorage.setItem('adminEmail', data.email);
  }
  
  return data;
}

/**
 * Verifies the 2FA OTP.
 */
export async function verifyAdminOtp(email, otp) {
  const { data } = await api.post('/auth/verify-otp', { email, otp });
  
  if (data.token) {
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminAuth', 'true');
    localStorage.setItem('adminEmail', data.email);
  }
  
  return data;
}

/**
 * Logs out the admin.
 */
export async function logoutAdmin() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminAuth');
  localStorage.removeItem('adminEmail');
}

/**
 * Fetches the admin profile from our backend.
 */
export async function getAdminProfile() {
  const token = localStorage.getItem('adminToken');
  if (!token) return null;
  
  try {
    const { data } = await api.get('/auth/profile');
    return data; // { profile: { id, email, role } }
  } catch (error) {
    console.error('Failed to fetch admin profile:', error);
    // If token is invalid, clear it
    if (error.response?.status === 401) {
      logoutAdmin();
    }
    throw error;
  }
}
