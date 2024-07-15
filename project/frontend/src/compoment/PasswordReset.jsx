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

const PasswordReset = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    question_id: '',
    answer: '',
    new_password: '',
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'new_password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleFieldErrors = (error) => {
    const newErrors = { username: '', question_id: '', answer: '', new_password: '', general: '' };
    if (error.response) {
      const { message, code } = error.response.data.error;
      if (code === 'INVALID_USERNAME') {
        newErrors.username = message;
      } else if (code === 'INVALID_QUESTION') {
        newErrors.question_id = message;
      } else if (code === 'INVALID_ANSWER') {
        newErrors.answer = message;
      } else if (code === 'INVALID_PASSWORD_FORMAT') {
        newErrors.new_password = message;
      } else if (code === 'SAME_OLD_PASSWORD') {
        newErrors.new_password = message;
      } else if (code === 'MISSING_FIELDS') {
        newErrors.general = message;
      } else {
        newErrors.general = message;
      }
    } else {
      newErrors.general = 'An error occurred while resetting your password. Please try again.';
    }
    setErrors(newErrors);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const { username, question_id, answer, new_password } = formData;

    // 清除所有错误提示
    setErrors({});
    setGeneralError('');

    let isValid = true;
    const newErrors = {};

    if (!username) {
      newErrors.username = 'Username is required';
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
    if (!new_password) {
      newErrors.new_password = 'New password is required';
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    axios.post('http://localhost:8000/api/reset-password/', {
      username,
      question_id,
      answer,
      new_password,
    })
      .then((response) => {
        alert('Password reset successfully.');
        navigate('/login'); // 密码重置成功后跳转
      })
      .catch((error) => {
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
            Password Reset
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
            <TextField
              margin="normal"
              required
              fullWidth
              name="new_password"
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              id="new_password"
              autoComplete="new-password"
              value={formData.new_password}
              onChange={handleChange}
              error={Boolean(errors.new_password)}
              helperText={errors.new_password}
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
            {formData.new_password && (
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
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, backgroundColor: '#6699cc' }}
            >
              Reset Password
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default PasswordReset;