// src/components/LoginForm.jsx
import React, { useState } from "react";
import NavBar from "./NavBar";
import { TextField, Button, Box, Container, Typography, Link, IconButton, InputAdornment, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';

function LoginForm() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({ username: '', password: '', general: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFieldErrors = (error) => {
    console.log("Error received:", error); 
    const newErrors = { username: '', password: '', general: '' };
    
    if (error.response && error.response.data && error.response.data.error) {
      const { message, code } = error.response.data.error;
      
      if (code === 'USER_NOT_FOUND') {
        newErrors.username = message;
      } else if (code === 'INVALID_PASSWORD') {
        newErrors.password = message;
      } else {
        newErrors.general = message;
      }
    } else {
      
      newErrors.general = 'Login failed due to server error.';
    }
    setErrors(newErrors);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const { username, password } = formData;

    
    setErrors({ username: '', password: '', general: '' });

    
    if (!username || !password) {
      const newErrors = {};
      if (!username) {
        newErrors.username = 'Username is required';
      }
      if (!password) {
        newErrors.password = 'Password is required';
      }
      setErrors(newErrors);
      return;
    }

    
    axios.post('http://localhost:8000/api/login/', formData)
      .then((response) => {
        const { access } = response.data;
        
        localStorage.setItem('accessToken', access);
        const now = new Date();
        const expiryTime = now.getTime() + 24 * 60 * 60 * 1000; 
        localStorage.setItem('tokenExpiry', expiryTime);
        
        login(access);
        
        navigate('/pipeline'); 
      })
      .catch((error) => {
        handleFieldErrors(error);
      });
  };

  const handlePasswordResetClick = () => {
    logout(); 
    navigate('/passwordreset');
  };

  return (
    <>
      <NavBar />
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '30vw'
          }}
        >
          <Typography component="h1" variant="h5">
            Login
          </Typography>
          {errors.general && (
            <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
              {errors.general}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              error={Boolean(errors.username)}
              helperText={errors.username}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              error={Boolean(errors.password)}
              helperText={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, backgroundColor: '#6699cc' }}
            >
              Login
            </Button>
            <Link
              component="button"
              variant="body2"
              onClick={handlePasswordResetClick}
              sx={{ mt: 2 }}
              title="Reset your password here"
            >
              Forgot your password?
            </Link>
          </Box>
        </Box>
      </Container>
    </>
  );
}

export default LoginForm;