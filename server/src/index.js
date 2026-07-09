import express from 'express';
import cors from 'cors';
import './db.js';

import authRoutes from './routes/auth.js';
import inviteRoutes from './routes/invites.js';
import visitRoutes from './routes/visits.js';
import staffRoutes from './routes/staff.js';
import serviceRequestRoutes from './routes/service-requests.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/service-requests', serviceRequestRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Society App server listening on http://localhost:${PORT}`));
