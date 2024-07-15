import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/ProteoInsight.png';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { useAuth } from '../AuthContext'; // 导入 useAuth

function NavBar() {
  const { isAuthenticated, logout } = useAuth(); // 获取认证状态和登出功能
  const navigate = useNavigate();
  const location = useLocation();

  const logoStyle = {
    display: 'block',
    height: '40px',
    marginRight: '20px',
    cursor: 'pointer',
  };

  const linkStyle = {
    textDecoration: 'none',
    color: 'inherit',
    marginRight: '30px',
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ height: '80px', backgroundColor: '#6EA8DD' }}>
      <Toolbar sx={{ height: '100px', display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/">
            <img
              src={logo}
              alt="Logo"
              style={logoStyle}
            />
          </Link>
        </Box>
        <Box>
          {isAuthenticated && location.pathname === '/pipeline' ? (
            <Button color="inherit" onClick={handleLogout}><b>Logout</b></Button>
          ) : (
            <>
              {location.pathname !== '/login' && (
                <Link to="/login" style={linkStyle}>
                  <Button color="inherit"><b>Login</b></Button>
                </Link>
              )}
              {location.pathname !== '/register' && (
                <Link to="/register" style={linkStyle}>
                  <Button color="inherit"><b>Register</b></Button>
                </Link>
              )}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;