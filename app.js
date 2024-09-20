import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import db from './config/db.js'

dotenv.config();

db()

const app = express();

app.use(express.json());
app.get('/',(re,res)=>{res.json({"success":true})})
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

export default app;
