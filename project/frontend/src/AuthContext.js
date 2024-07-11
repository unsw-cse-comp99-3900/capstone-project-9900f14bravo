import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios'; // 导入axios

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('accessToken') || null);

  useEffect(() => {
    // 检查localStorage以决定用户的认证状态
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      setIsAuthenticated(true);
      setToken(accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`; // 设置axios默认授权头
    }
  }, []);

  const login = (accessToken) => {
    localStorage.setItem('accessToken', accessToken);
    setIsAuthenticated(true);
    setToken(accessToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`; // 设置axios默认授权头
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
    setToken(null);
    delete axios.defaults.headers.common['Authorization']; // 移除axios默认授权头
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);