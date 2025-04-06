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
import { teamsAPI } from '../../services/api';
import { User } from '../../models/types';

interface AddTeamDialogProps {
  open: boolean;
  onClose: () => void;
  onTeamAdded: () => void;
  users: User[];
  isLoading: boolean;
}

interface TeamFormValues {
  name: string;
  owner_id: number;
  description: string;
}

const TeamSchema = Yup.object().shape({
  name: Yup.string().required('Team name is required'),
  owner_id: Yup.number().required('Team owner is required'),
  description: Yup.string()
});

const AddTeamDialog: React.FC<AddTeamDialogProps> = ({ 
  open, 
  onClose, 
  onTeamAdded, 
  users, 
  isLoading 
}) => {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const initialValues: TeamFormValues = {
    name: '',
    owner_id: 0,
    description: ''
  };

  const handleSubmit = async (
    values: TeamFormValues,
    { resetForm }: FormikHelpers<TeamFormValues>
  ) => {
    try {
      setError(null);
      setSubmitting(true);
      
      await teamsAPI.create(values);
      
      resetForm();
      onTeamAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Team</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={TeamSchema}
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
                Create a new team by providing the details below.
              </DialogContentText>
              
              <Field
                as={TextField}
                margin="normal"
                fullWidth
                id="name"
                label="Team Name"
                name="name"
                autoFocus
                error={touched.name && Boolean(errors.name)}
                helperText={touched.name && errors.name}
              />
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="owner-label">Team Owner</InputLabel>
                <Select
                  labelId="owner-label"
                  id="owner_id"
                  name="owner_id"
                  value={values.owner_id}
                  label="Team Owner"
                  onChange={handleChange}
                  error={touched.owner_id && Boolean(errors.owner_id)}
                >
                  <MenuItem value={0} disabled>
                    <em>Select a team owner</em>
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
              
              <Field
                as={TextField}
                margin="normal"
                fullWidth
                id="description"
                label="Description"
                name="description"
                multiline
                rows={4}
                error={touched.description && Boolean(errors.description)}
                helperText={touched.description && errors.description}
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
                {submitting ? 'Creating...' : 'Create Team'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default AddTeamDialog;