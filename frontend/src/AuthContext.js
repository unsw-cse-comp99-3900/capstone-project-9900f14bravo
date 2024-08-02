// src/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    // console.log("useEffect called"); // check useEffect is called or not
    const accessToken = localStorage.getItem('accessToken');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    const now = new Date().getTime();

    if (accessToken && tokenExpiry && now < parseInt(tokenExpiry, 10)) {
      setIsAuthenticated(true);
      setToken(accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenExpiry');
      setIsAuthenticated(false);
      setToken(null);
    }
    setLoading(false); // check loading status，set loading status to false
  }, []);

  const login = (accessToken) => {
    const now = new Date();
    const expiryTime = now.getTime() + 24 * 60 * 60 * 1000; 
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('tokenExpiry', expiryTime.toString());
    setIsAuthenticated(true);
    setToken(accessToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenExpiry');
    setIsAuthenticated(false);
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);