import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('tda_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Don't log out on network error, keep token
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (userId, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, password })
      });

      const contentType = res.headers.get("content-type");
      let data = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Server returned error status ${res.status}`);
      }

      if (!res.ok) {
        return { 
          success: false, 
          error: data.message || 'Login failed.', 
          unverified: data.unverified,
          email: data.email 
        };
      }

      if (data.isFirstLogin) {
        return {
          success: true,
          isFirstLogin: true,
          userId: data.userId
        };
      }

      localStorage.setItem('tda_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (userId, tempPassword, newPassword) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, tempPassword, newPassword })
      });

      const contentType = res.headers.get("content-type");
      let data = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Server returned error status ${res.status}`);
      }

      if (!res.ok) {
        return { success: false, error: data.message || 'Password reset failed.' };
      }

      localStorage.setItem('tda_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password, domains) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, domains })
      });

      const contentType = res.headers.get("content-type");
      let data = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Server returned error status ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('tda_token');
    setToken(null);
    setUser(null);
  };

  const verifyEmailWithOtp = async (email, otp) => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'OTP verification failed.');
      }

      localStorage.setItem('tda_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const verifyEmailWithToken = async (tokenVal) => {
    try {
      const res = await fetch('/api/auth/verify-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: tokenVal })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Link verification failed.');
      }

      localStorage.setItem('tda_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, resetPassword, register, logout, verifyEmailWithOtp, verifyEmailWithToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
