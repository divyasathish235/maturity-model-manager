import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Alert
} from '@mui/material';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { servicesAPI, teamsAPI } from '../../services/api';
import { User, Team, ServiceType } from '../../models/types';

interface AddServiceDialogProps {
  open: boolean;
  onClose: () => void;
  onServiceAdded: () => void;
  users: User[];
  teams: Team[];
  isLoading: boolean;
}

interface ServiceFormValues {
  name: string;
  owner_id: number;
  team_id: number;
  description: string;
  service_type: ServiceType;
  resource_location: string;
}

const ServiceSchema = Yup.object().shape({
  name: Yup.string().required('Service name is required'),
  owner_id: Yup.number().required('Service owner is required'),
  team_id: Yup.number().required('Team is required'),
  description: Yup.string(),
  service_type: Yup.string().required('Service type is required'),
  resource_location: Yup.string()
});

const AddServiceDialog: React.FC<AddServiceDialogProps> = ({ 
  open, 
  onClose, 
  onServiceAdded, 
  users, 
  teams,
  isLoading 
}): React.ReactElement => {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const initialValues: ServiceFormValues = {
    name: '',
    owner_id: 0,
    team_id: 0,
    description: '',
    service_type: ServiceType.API_SERVICE,
    resource_location: ''
  };

  const handleSubmit = async (
    values: ServiceFormValues,
    { resetForm }: FormikHelpers<ServiceFormValues>
  ) => {
    try {
      setError(null);
      setSubmitting(true);
      
      await servicesAPI.create(values);
      
      resetForm();
      onServiceAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Service</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={ServiceSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, handleChange }) => (
          <Form>
            <DialogContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <DialogContentText>
                Create a new service by providing the details below.
              </DialogContentText>
              
              <Field
                as={TextField}
                margin="normal"
                fullWidth
                id="name"
                label="Service Name"
                name="name"
                autoFocus
                error={touched.name && Boolean(errors.name)}
                helperText={touched.name && errors.name}
              />
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="owner-label">Service Owner</InputLabel>
                <Select
                  labelId="owner-label"
                  id="owner_id"
                  name="owner_id"
                  value={values.owner_id}
                  label="Service Owner"
                  onChange={handleChange}
                  error={touched.owner_id && Boolean(errors.owner_id)}
                >
                  <MenuItem value={0} disabled>
                    <em>Select a service owner</em>
                  </MenuItem>
                  {isLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} />
                    </MenuItem>
                  ) : (
                    users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.username}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="team-label">Team</InputLabel>
                <Select
                  labelId="team-label"
                  id="team_id"
                  name="team_id"
                  value={values.team_id}
                  label="Team"
                  onChange={handleChange}
                  error={touched.team_id && Boolean(errors.team_id)}
                >
                  <MenuItem value={0} disabled>
                    <em>Select a team</em>
                  </MenuItem>
                  {isLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} />
                    </MenuItem>
                  ) : (
                    teams.map((team) => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="service-type-label">Service Type</InputLabel>
                <Select
                  labelId="service-type-label"
                  id="service_type"
                  name="service_type"
                  value={values.service_type}
                  label="Service Type"
                  onChange={handleChange}
                  error={touched.service_type && Boolean(errors.service_type)}
                >
                  {Object.values(ServiceType).map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Field
                as={TextField}
                margin="normal"
                fullWidth
                id="description"
                label="Description"
                name="description"
                multiline
                rows={3}
                error={touched.description && Boolean(errors.description)}
                helperText={touched.description && errors.description}
              />
              
              <Field
                as={TextField}
                margin="normal"
                fullWidth
                id="resource_location"
                label="Resource Location (URL)"
                name="resource_location"
                placeholder="https://github.com/example/service"
                error={touched.resource_location && Boolean(errors.resource_location)}
                helperText={touched.resource_location && errors.resource_location}
              />
            </DialogContent>
            
            <DialogActions>
              <Button onClick={onClose}>Cancel</Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : null}
              >
                {submitting ? 'Creating...' : 'Create Service'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default AddServiceDialog;