import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Route handlers
import sitesRoutes from './routes/sites.js';
import healthRoutes from './routes/health.js';
import githubRoutes from './routes/github.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS) for dashboard frontend clients
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// API Routes
app.use('/api/sites', sitesRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/github-status', githubRoutes);

// Root health/info route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'PowerProx Health Dashboard Backend',
    endpoints: [
      '/api/sites',
      '/api/health',
      '/api/github-status'
    ]
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`PowerProx Health Dashboard server running on port ${PORT}`);
});
