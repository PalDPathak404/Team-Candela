import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.ts';
import { seedDemoUser } from './db.ts';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('src/public'));

app.use('/api/auth', authRouter);

const PORT = process.env.PORT || 3000;
// Seed demo user on startup (idempotent)
seedDemoUser();
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
