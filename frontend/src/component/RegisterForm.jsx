import React, { useState } from 'react';
import NavBar from './NavBar';
import { TextField, Button, Box, Container, Typography, MenuItem, IconButton, InputAdornment, Alert, LinearProgress } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const securityQuestions = [
  { id: 1, text: 'What was your childhood nickname?' },
  { id: 2, text: 'What is the name of your favorite childhood friend?' },
  { id: 3, text: 'What was your favorite place to visit as a child?' },
  { id: 4, text: 'What was your dream job as a child?' },
];

const checkPasswordStrength = (password) => {
  if (password.length < 8) {
    return 'weak';
  } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[\W_]/.test(password)) {
    return 'medium';
  } else {
    return 'strong';
  }
};


const RegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    question_id: '',
    answer: ''
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleFieldErrors = (error) => {
    const newErrors = { username: '', password: '', confirmPassword: '', question_id: '', answer: '', general: '' };
    if (error.response) {
      const { message, code } = error.response.data.error;
      if (code === 'USERNAME_EXISTS') {
        newErrors.username = message;
      } else if (code === 'INVALID_PASSWORD_FORMAT') {
        newErrors.password = message;
      } else if (code === 'PASSWORDS_DO_NOT_MATCH') {
        newErrors.confirmPassword = message;
      } else if (code === 'MISSING_FIELDS') {
        newErrors.general = message;
      } else {
        newErrors.general = message;
      }
    } else {
      newErrors.general = 'An error occurred while submitting your registration. Please try again.';
    }
    setErrors(newErrors);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const { username, password, confirmPassword, question_id, answer } = formData;

    // 清除所有错误提示
    setErrors({});
    setGeneralError('');

    // 表单验证
    let isValid = true;
    const newErrors = {};

    if (!username) {
      newErrors.username = 'Username is required';
      isValid = false;
    }
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    if (!question_id) {
      newErrors.question_id = 'Security question is required';
      isValid = false;
    }
    if (!answer) {
      newErrors.answer = 'Answer is required';
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }


    axios.post('http://localhost:8000/api/register/', {
      username: username,
      password: password,
      confirm_password: confirmPassword,
      question_id: question_id,
      answer: answer
    })
    .then(function (response) {
      if (response.status === 201) {
        navigate('/login'); 
      } else {
        setErrors({ username: 'Username already exists or another error occurred.' });
      }
    })
    .catch(function (error) {
      handleFieldErrors(error);
    });
  };

  return (
    <>
      <NavBar />
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 15,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5">
            Register
          </Typography>
          {generalError && (
            <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
              {generalError}
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
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={Boolean(errors.password)}
              helperText={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {formData.password && (
              <>
                <Box display="flex" alignItems="center" sx={{ mt: 1, width: '100%' }}>
                  <Box width="33%">
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength === 'weak' ? 100 : 0}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          backgroundColor: passwordStrength === 'weak' ? 'red' : '#e0e0e0',
                        },
                      }}
                    />
                  </Box>
                  <Box width="33%" sx={{ ml: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength === 'medium' ? 100 : 0}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          backgroundColor: passwordStrength === 'medium' ? 'orange' : '#e0e0e0',
                        },
                      }}
                    />
                  </Box>
                  <Box width="33%" sx={{ ml: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength === 'strong' ? 100 : 0}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          backgroundColor: passwordStrength === 'strong' ? 'green' : '#e0e0e0',
                        },
                      }}
                    />
                  </Box>
                </Box>
                <Box display="flex" justifyContent="space-between" width="100%" sx={{ mt: 1 }}>
                  <Typography
                    variant="body2"
                    color={passwordStrength === 'weak' ? 'red' : 'textSecondary'}
                  >
                    Weak
                  </Typography>
                  <Typography
                    variant="body2"
                    color={passwordStrength === 'medium' ? 'orange' : 'textSecondary'}
                  >
                    Medium
                  </Typography>
                  <Typography
                    variant="body2"
                    color={passwordStrength === 'strong' ? 'green' : 'textSecondary'}
                  >
                    Strong
                  </Typography>
                </Box>
              </>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="securityQuestion"
              select
              label="Security Question"
              name="question_id"
              autoComplete="security-question"
              value={formData.question_id}
              onChange={handleChange}
              error={Boolean(errors.question_id)}
              helperText={errors.question_id}
            >
              {securityQuestions.map((question) => (
                <MenuItem key={question.id} value={question.id}>
                  {question.text}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              margin="normal"
              required
              fullWidth
              id="answer"
              label="Answer"
              name="answer"
              autoComplete="answer"
              value={formData.answer}
              onChange={handleChange}
              error={Boolean(errors.answer)}
              helperText={errors.answer}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, backgroundColor: '#6EA8DD' }}
            >
              Register
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default RegisterForm;