import express from 'express';
import path from 'path';
import cors from 'cors';
import { initializeDatabase } from './database/db';
import authRoutes from './routes/authRoutes';
import teamRoutes from './routes/teamRoutes';
import serviceRoutes from './routes/serviceRoutes';
import maturityModelRoutes from './routes/maturityModelRoutes';
import campaignRoutes from './routes/campaignRoutes';
import evaluationRoutes from './routes/evaluationRoutes';

const app = express();
const PORT = process.env.PORT || 5001; // Using port 5001

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initializeDatabase();

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/maturity-models', maturityModelRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/evaluations', evaluationRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../frontend/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;