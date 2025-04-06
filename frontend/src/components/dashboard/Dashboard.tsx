import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, MaturityLevel } from '../../models/types';
import { 
  teamsAPI, 
  servicesAPI, 
  maturityModelsAPI, 
  campaignsAPI 
} from '../../services/api';
import { 
  Pie, 
  Bar 
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ActiveCampaign {
  id: number;
  name: string;
  status: string;
  progress: number;
}

interface RecentEvaluation {
  id: number;
  service: string;
  model: string;
  level: MaturityLevel;
  date: string;
}

interface DashboardStats {
  teamsCount: number;
  servicesCount: number;
  modelsCount: number;
  campaignsCount: number;
  activeCampaigns: ActiveCampaign[];
  recentEvaluations: RecentEvaluation[];
  maturityLevels: {
    level0: number;
    level1: number;
    level2: number;
    level3: number;
    level4: number;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    teamsCount: 0,
    servicesCount: 0,
    modelsCount: 0,
    campaignsCount: 0,
    activeCampaigns: [],
    recentEvaluations: [],
    maturityLevels: {
      level0: 0,
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // In a real application, we would fetch actual data from the API
        // For now, we'll simulate some data
        
        // Simulate API calls
        // const teamsResponse = await teamsAPI.getAll();
        // const servicesResponse = await servicesAPI.getAll();
        // const modelsResponse = await maturityModelsAPI.getAll();
        // const campaignsResponse = await campaignsAPI.getAll();
        
        // Simulate data
        const mockStats: DashboardStats = {
          teamsCount: 5,
          servicesCount: 12,
          modelsCount: 3,
          campaignsCount: 2,
          activeCampaigns: [
            { id: 1, name: 'Q2 2023 Operational Excellence', status: 'active', progress: 65 },
            { id: 2, name: 'Security Compliance 2023', status: 'active', progress: 42 }
          ],
          recentEvaluations: [
            { id: 1, service: 'API Gateway', model: 'Operational Excellence', level: MaturityLevel.LEVEL_3, date: '2023-05-15' },
            { id: 2, service: 'User Authentication Service', model: 'Security', level: MaturityLevel.LEVEL_2, date: '2023-05-14' },
            { id: 3, service: 'Payment Processing', model: 'Operational Excellence', level: MaturityLevel.LEVEL_4, date: '2023-05-12' }
          ],
          maturityLevels: {
            level0: 2,
            level1: 3,
            level2: 4,
            level3: 2,
            level4: 1
          }
        };
        
        setStats(mockStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Prepare chart data
  const maturityLevelData = {
    labels: ['Level 0', 'Level 1', 'Level 2', 'Level 3', 'Level 4'],
    datasets: [
      {
        label: 'Services by Maturity Level',
        data: [
          stats.maturityLevels.level0,
          stats.maturityLevels.level1,
          stats.maturityLevels.level2,
          stats.maturityLevels.level3,
          stats.maturityLevels.level4
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
          'rgb(54, 162, 235)'
        ],
        borderWidth: 1
      }
    ]
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Teams</Typography>
            <Typography variant="h3">{stats.teamsCount}</Typography>
            <Button 
              variant="text" 
              onClick={() => navigate('/teams')}
              sx={{ mt: 1 }}
            >
              View All
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Services</Typography>
            <Typography variant="h3">{stats.servicesCount}</Typography>
            <Button 
              variant="text" 
              onClick={() => navigate('/services')}
              sx={{ mt: 1 }}
            >
              View All
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Maturity Models</Typography>
            <Typography variant="h3">{stats.modelsCount}</Typography>
            <Button 
              variant="text" 
              onClick={() => navigate('/maturity-models')}
              sx={{ mt: 1 }}
            >
              View All
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Campaigns</Typography>
            <Typography variant="h3">{stats.campaignsCount}</Typography>
            <Button 
              variant="text" 
              onClick={() => navigate('/campaigns')}
              sx={{ mt: 1 }}
            >
              View All
            </Button>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Charts and Lists */}
      <Grid container spacing={3}>
        {/* Maturity Level Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Maturity Level Distribution" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Pie data={maturityLevelData} options={{ maintainAspectRatio: false }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Active Campaigns */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Active Campaigns" 
              action={
                <Button 
                  variant="text" 
                  onClick={() => navigate('/campaigns')}
                >
                  View All
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <List>
                {stats.activeCampaigns.map((campaign) => (
                  <ListItem key={campaign.id} divider>
                    <ListItemText
                      primary={campaign.name}
                      secondary={`Progress: ${campaign.progress}%`}
                    />
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      Details
                    </Button>
                  </ListItem>
                ))}
                {stats.activeCampaigns.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No active campaigns" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Evaluations */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Recent Evaluations" />
            <Divider />
            <CardContent>
              <List>
                {stats.recentEvaluations.map((evaluation) => (
                  <ListItem key={evaluation.id} divider>
                    <ListItemText
                      primary={`${evaluation.service} - ${evaluation.model}`}
                      secondary={`Level ${evaluation.level} - ${evaluation.date}`}
                    />
                  </ListItem>
                ))}
                {stats.recentEvaluations.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No recent evaluations" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;