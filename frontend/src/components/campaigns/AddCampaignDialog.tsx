import React, { useState } from 'react';
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
  Alert,
  FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { campaignsAPI } from '../../services/api';
import { MaturityModel } from '../../models/types';

interface AddCampaignDialogProps {
  open: boolean;
  onClose: () => void;
  onCampaignAdded: () => void;
  maturityModels: MaturityModel[];
  userId: number;
  isLoading: boolean;
}

interface CampaignFormValues {
  name: string;
  maturity_model_id: number;
  start_date: Date | null;
  end_date: Date | null;
  created_by: number;
}

const CampaignSchema = Yup.object().shape({
  name: Yup.string().required('Campaign name is required'),
  maturity_model_id: Yup.number().required('Maturity model is required'),
  start_date: Yup.date().nullable(),
  end_date: Yup.date().nullable()
    .min(Yup.ref('start_date'), 'End date must be after start date')
});

const AddCampaignDialog: React.FC<AddCampaignDialogProps> = ({ 
  open, 
  onClose, 
  onCampaignAdded, 
  maturityModels,
  userId,
  isLoading 
}): React.ReactElement => {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const initialValues: CampaignFormValues = {
    name: '',
    maturity_model_id: 0,
    start_date: new Date(),
    end_date: null,
    created_by: userId
  };

  const handleSubmit = async (
    values: CampaignFormValues,
    { resetForm }: FormikHelpers<CampaignFormValues>
  ) => {
    try {
      setError(null);
      setSubmitting(true);
      
      // Format dates for API
      const formattedValues = {
        ...values,
        start_date: values.start_date ? values.start_date.toISOString() : null,
        end_date: values.end_date ? values.end_date.toISOString() : null
      };
      
      await campaignsAPI.create(formattedValues);
      
      resetForm();
      onCampaignAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Campaign</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={CampaignSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, handleChange, setFieldValue }) => (
          <Form>
            <DialogContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <DialogContentText>
                Create a new campaign by providing the details below.
              </DialogContentText>
              
              <Field
                as={TextField}
                margin="normal"
                fullWidth
                id="name"
                label="Campaign Name"
                name="name"
                autoFocus
                error={touched.name && Boolean(errors.name)}
                helperText={touched.name && errors.name}
              />
              
              <FormControl fullWidth margin="normal" error={touched.maturity_model_id && Boolean(errors.maturity_model_id)}>
                <InputLabel id="maturity-model-label">Maturity Model</InputLabel>
                <Select
                  labelId="maturity-model-label"
                  id="maturity_model_id"
                  name="maturity_model_id"
                  value={values.maturity_model_id}
                  label="Maturity Model"
                  onChange={handleChange}
                >
                  <MenuItem value={0} disabled>
                    <em>Select a maturity model</em>
                  </MenuItem>
                  {isLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} />
                    </MenuItem>
                  ) : (
                    maturityModels.map((model) => (
                      <MenuItem key={model.id} value={model.id}>
                        {model.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {touched.maturity_model_id && errors.maturity_model_id && (
                  <FormHelperText>{errors.maturity_model_id as string}</FormHelperText>
                )}
              </FormControl>
              
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <DatePicker
                    label="Start Date"
                    value={values.start_date}
                    onChange={(date) => setFieldValue('start_date', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: 'normal',
                        error: touched.start_date && Boolean(errors.start_date),
                        helperText: touched.start_date && errors.start_date as string
                      }
                    }}
                  />
                  
                  <DatePicker
                    label="End Date"
                    value={values.end_date}
                    onChange={(date) => setFieldValue('end_date', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: 'normal',
                        error: touched.end_date && Boolean(errors.end_date),
                        helperText: touched.end_date && errors.end_date as string
                      }
                    }}
                  />
                </Box>
              </LocalizationProvider>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={onClose}>Cancel</Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : null}
              >
                {submitting ? 'Creating...' : 'Create Campaign'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default AddCampaignDialog;