import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import cors from 'cors';
import express from 'express';
import {router}  from './routes/user.js'
import {expenseRouter} from './routes/expenses.js';
import { controllerRouter } from './routes/controller.js';
import connectDB from './db/mongoose.js';
import dotenv from 'dotenv';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(router);
app.use(expenseRouter);
app.use(controllerRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});