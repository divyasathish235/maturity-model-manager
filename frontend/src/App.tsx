import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import TeamsPage from './pages/TeamsPage';
import ServicesPage from './pages/ServicesPage';
import CampaignsPage from './pages/CampaignsPage';
import { UserRole } from './models/types';

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Teams routes */}
                  <Route path="/teams" element={<TeamsPage />} />
                  
                  {/* Services routes */}
                  <Route path="/services" element={<ServicesPage />} />
                  
                  {/* Campaigns routes */}
                  <Route path="/campaigns" element={<CampaignsPage />} />
                  <Route path="/campaigns/:id" element={<div>Campaign Details</div>} />
                  
                  {/* Admin only routes */}
                  <Route 
                    element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}
                  >
                    <Route path="/admin" element={<div>Admin Dashboard</div>} />
                    <Route path="/maturity-models" element={<div>Maturity Models</div>} />
                  </Route>
                  
                  {/* Common routes */}
                  <Route path="/profile" element={<div>User Profile</div>} />
                  <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
                </Route>
              </Route>
              
              {/* Redirect to dashboard if logged in, otherwise to login */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Catch all route */}
              <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;