import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  FormHelperText,
  Typography,
  Box
} from '@mui/material';
import { Formik, Form, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { campaignsAPI, servicesAPI } from '../../services/api';
import { Service } from '../../models/types';

interface AddParticipantDialogProps {
  open: boolean;
  onClose: () => void;
  onParticipantAdded: () => void;
  campaignId: number;
  campaignName: string;
}

interface ParticipantFormValues {
  service_id: number;
}

const ParticipantSchema = Yup.object().shape({
  service_id: Yup.number().required('Service is required').min(1, 'Service is required')
});

const AddParticipantDialog: React.FC<AddParticipantDialogProps> = ({ 
  open, 
  onClose, 
  onParticipantAdded, 
  campaignId,
  campaignName
}): React.ReactElement => {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchServices();
    }
  }, [open]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getAll();
      setServices(response);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const initialValues: ParticipantFormValues = {
    service_id: 0
  };

  const handleSubmit = async (
    values: ParticipantFormValues,
    { resetForm }: FormikHelpers<ParticipantFormValues>
  ) => {
    try {
      setError(null);
      setSubmitting(true);
      
      await campaignsAPI.addParticipant(campaignId, values.service_id);
      
      resetForm();
      onParticipantAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add service to campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Service to Campaign</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={ParticipantSchema}
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
                Add a service to the campaign <strong>{campaignName}</strong>.
              </DialogContentText>
              
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth error={touched.service_id && Boolean(errors.service_id)}>
                  <InputLabel id="service-label">Service</InputLabel>
                  <Select
                    labelId="service-label"
                    id="service_id"
                    name="service_id"
                    value={values.service_id}
                    label="Service"
                    onChange={handleChange}
                  >
                    <MenuItem value={0} disabled>
                      <em>Select a service</em>
                    </MenuItem>
                    {loading ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} />
                      </MenuItem>
                    ) : services.length === 0 ? (
                      <MenuItem disabled>
                        <em>No services available</em>
                      </MenuItem>
                    ) : (
                      services.map((service) => (
                        <MenuItem key={service.id} value={service.id}>
                          <Box>
                            <Typography variant="body1">{service.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {service.team.name} - {service.service_type}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {touched.service_id && errors.service_id && (
                    <FormHelperText>{errors.service_id as string}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={onClose}>Cancel</Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={submitting || loading}
                startIcon={submitting ? <CircularProgress size={20} /> : null}
              >
                {submitting ? 'Adding...' : 'Add Service'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default AddParticipantDialog;