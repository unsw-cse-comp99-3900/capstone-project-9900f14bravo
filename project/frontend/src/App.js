import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginForm from './compoment/LoginForm';
import RegisterForm from './compoment/RegisterForm';
import Dashboard from './compoment/Dashboard';
import Pipeline from './compoment/Pipeline';
import PasswordReset from './compoment/PasswordReset';
import { AuthProvider } from './AuthContext';
import PrivateRoute from './PrivateRoute';

function App() {
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.documentElement.style.margin = '0';
  document.documentElement.style.padding = '0';

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='/register' element={<RegisterForm />} />
          <Route path='/login' element={<LoginForm />} />
          <Route path='/passwordreset' element={<PasswordReset />} />
          <Route element={<PrivateRoute />}>
            <Route path='/pipeline' element={<Pipeline />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;