import { Router } from 'express';
import { seedDatabase } from '../../seed';

const router = Router();

router.get('/', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Seed failed', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

export default router;
