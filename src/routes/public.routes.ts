import express from 'express';
const router = express.Router();
import {
  getContact,
  getAbout,
  getFAQ,
  getCareers
} from '../controllers/public.controller';

// Public pages
router.get('/contact', getContact);
router.get('/about', getAbout);
router.get('/faq', getFAQ);
router.get('/careers', getCareers);

export default router;
