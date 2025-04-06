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
  Chip,
  LinearProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { campaignsAPI, maturityModelsAPI } from '../services/api';
import { Campaign, MaturityModel, CampaignStatus } from '../models/types';
import AddCampaignDialog from '../components/campaigns/AddCampaignDialog';
import AddParticipantDialog from '../components/campaigns/AddParticipantDialog';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CampaignsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [maturityModels, setMaturityModels] = useState<MaturityModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openAddParticipantDialog, setOpenAddParticipantDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await campaignsAPI.getAll();
      setCampaigns(data);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setError(err.response?.data?.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaturityModels = async () => {
    try {
      setDataLoading(true);
      const data = await maturityModelsAPI.getAll();
      setMaturityModels(data);
    } catch (err) {
      console.error('Error fetching maturity models:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    fetchMaturityModels();
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  const handleCampaignAdded = () => {
    fetchCampaigns();
  };

  const handleOpenAddParticipantDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setOpenAddParticipantDialog(true);
  };

  const handleCloseAddParticipantDialog = () => {
    setOpenAddParticipantDialog(false);
    setSelectedCampaign(null);
  };

  const handleParticipantAdded = () => {
    fetchCampaigns();
  };

  const handleViewCampaign = (campaignId: number) => {
    navigate(`/campaigns/${campaignId}`);
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case CampaignStatus.DRAFT:
        return 'default';
      case CampaignStatus.ACTIVE:
        return 'success';
      case CampaignStatus.COMPLETED:
        return 'primary';
      case CampaignStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const isAdmin = user?.role === 'admin';
  const isTeamOwner = user?.role === 'team_owner';
  const canAddCampaign = isAdmin || isTeamOwner;
  const canAddParticipant = isAdmin || isTeamOwner;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Campaigns</Typography>
        {canAddCampaign && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Add Campaign
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
      ) : campaigns.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">No campaigns found.</Typography>
          {canAddCampaign && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
              sx={{ mt: 2 }}
            >
              Add Campaign
            </Button>
          )}
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Maturity Model</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Participants</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{campaign.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{campaign.maturity_model.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={campaign.status} 
                      color={getCampaignStatusColor(campaign.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(campaign.start_date)}</TableCell>
                  <TableCell>{formatDate(campaign.end_date)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {campaign.participants_count}
                      </Typography>
                      {canAddParticipant && campaign.status === CampaignStatus.ACTIVE && (
                        <Tooltip title="Add Participant">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenAddParticipantDialog(campaign)}
                          >
                            <PersonAddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewCampaign(campaign.id)}
                      >
                        <AssessmentIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {(isAdmin || (isTeamOwner && campaign.created_by.id === user?.id)) && (
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

      <AddCampaignDialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        onCampaignAdded={handleCampaignAdded}
        maturityModels={maturityModels}
        userId={user?.id || 0}
        isLoading={dataLoading}
      />

      {selectedCampaign && (
        <AddParticipantDialog
          open={openAddParticipantDialog}
          onClose={handleCloseAddParticipantDialog}
          onParticipantAdded={handleParticipantAdded}
          campaignId={selectedCampaign.id}
          campaignName={selectedCampaign.name}
        />
      )}
    </Box>
  );
};

export default CampaignsPage;