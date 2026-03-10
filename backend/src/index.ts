import express from 'express';
import cors from 'cors';
import path from 'path';
import marketRoutes from './routes/market';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/market', marketRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`PS Terminal server running on port ${PORT}`);
});
