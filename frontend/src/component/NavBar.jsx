import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Button, Box, Typography, IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home'; 
import { useAuth } from '../AuthContext'; 

function NavBar({ navBarHeight }) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const logoStyle = {
    color: '#3c2e5f',
    display: 'block',
    marginRight: '20px',
    cursor: 'pointer',
    fontSize: '30px',
    fontWeight: 'bold',
    transition: 'transform 0.3s',
  };

  const linkStyle = {
    fontSize: '15px',
    textDecoration: 'none',
    color: 'inherit',
    marginRight: '30px',
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMouseOver = (e) => {
    e.currentTarget.style.transform = 'scale(1.1)';
  };

  const handleMouseOut = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
  };

  const handleHomeClick = () => {
    navigate('/');
    window.scrollTo(0, 0); 
  };

  return (
    <AppBar position="fixed" sx={{ height: `${navBarHeight}px`, backgroundColor: 'white', transition: 'height 0.3s', }}>
      <Toolbar sx={{ height: '100%', display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            style={logoStyle}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            onClick={handleHomeClick}
          >
            ProteoInsight
          </Typography>
          <IconButton onClick={handleHomeClick} sx={{ color: '#3c2e5f', }}>
            <HomeIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box>
          {isAuthenticated ? (
            <>
              {location.pathname === '/' && (
                <Link to="/pipeline" style={linkStyle}>
                  <Button sx={{ color: '#3c2e5f', fontSize: '15px', padding: '10px 20px' }}><b>Pipeline</b></Button>
                </Link>
              )}
              <Button sx={{ color: '#3c2e5f', fontSize: '15px', padding: '10px 20px' }} onClick={handleLogout}><b>Logout</b></Button>
            </>
          ) : (
            <>
              {location.pathname !== '/login' && (
                <Link to="/login" style={linkStyle}>
                  <Button sx={{ color: '#3c2e5f', fontSize: '15px', padding: '10px 20px' }}><b>Login</b></Button>
                </Link>
              )}
              {location.pathname !== '/register' && (
                <Link to="/register" style={linkStyle}>
                  <Button sx={{ color: '#3c2e5f', fontSize: '15px', padding: '10px 20px' }}><b>Register</b></Button>
                </Link>
              )}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;