import express from 'express';
import asyncHandler from 'express-async-handler';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();

router.post('/test', asyncHandler(async (req, res) => {
  const { to, subject = 'Test Email', text = 'If you see this, email works!' } = req.body;
  
  if (!to) {
    res.status(400);
    throw new Error('Email "to" required');
  }

  await sendEmail({ to, subject, text });
  res.json({ message: `Test email sent to ${to}` });
}));

export default router;

