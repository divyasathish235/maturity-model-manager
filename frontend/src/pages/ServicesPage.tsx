import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { servicesAPI, teamsAPI } from '../services/api';
import { Service, Team, User } from '../models/types';
import AddServiceDialog from '../components/services/AddServiceDialog';
import { useAuth } from '../contexts/AuthContext';

const ServicesPage: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await servicesAPI.getAll();
      setServices(data);
    } catch (err: any) {
      console.error('Error fetching services:', err);
      setError(err.response?.data?.message || 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamsAndUsers = async () => {
    try {
      setDataLoading(true);
      // In a real app, you would fetch teams and users from the API
      // For now, we'll fetch teams and use a mock list with the current user
      const teamsData = await teamsAPI.getAll();
      setTeams(teamsData);
      setUsers([user!]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    fetchTeamsAndUsers();
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  const handleServiceAdded = () => {
    fetchServices();
  };

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'API Service':
        return 'primary';
      case 'UI Application':
        return 'secondary';
      case 'Workflow':
        return 'success';
      case 'Application Module':
        return 'warning';
      default:
        return 'default';
    }
  };

  const isAdmin = user?.role === 'admin';
  const isTeamOwner = user?.role === 'team_owner';
  const canAddService = isAdmin || isTeamOwner;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Services</Typography>
        {canAddService && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Add Service
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : services.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">No services found.</Typography>
          {canAddService && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
              sx={{ mt: 2 }}
            >
              Add Service
            </Button>
          )}
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{service.team.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={service.service_type} 
                      color={getServiceTypeColor(service.service_type) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{service.owner.username}</TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell align="right">
                    {(isAdmin || (isTeamOwner && service.owner.id === user?.id)) && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {isAdmin && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <AddServiceDialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        onServiceAdded={handleServiceAdded}
        users={users}
        teams={teams}
        isLoading={dataLoading}
      />
    </Box>
  );
};

export default ServicesPage;