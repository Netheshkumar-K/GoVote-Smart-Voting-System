import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // In a real app, verify token and fetch user details here
      // For this demo, we'll glean role from some mocked decode or localstorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    // try {
    //   const { data } = await axios.post('/api/auth/login', { email, password });
    //   setToken(data.token);
    //   localStorage.setItem('token', data.token);
    //   setUser(data.user);
    //   localStorage.setItem('user', JSON.stringify(data.user));
    // } catch (e) { throw e; }
    
    // Mock login for frontend UI demonstration
    const mockToken = "mock_jwt_token_" + Date.now();
    const mockUser = {
      id: 1, email, role: email.includes('admin') ? 'ADMIN' : 'VOTER'
    };
    setToken(mockToken);
    localStorage.setItem('token', mockToken);
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const register = async (email, password) => {
    // await axios.post('/api/auth/register', { email, password });
    // Proceed to login or auto-login
    return login(email, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
