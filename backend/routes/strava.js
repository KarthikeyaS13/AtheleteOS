import express from 'express';
import { requireAuth } from '../authMiddleware.js';
import { stravaController } from '../controllers/stravaController.js';

const router = express.Router();

router.get('/status', requireAuth, stravaController.getStatus);
router.post('/connect', requireAuth, stravaController.connect);
router.post('/disconnect', requireAuth, stravaController.disconnect);
router.post('/sync', requireAuth, stravaController.sync);
router.get('/prs/pending', requireAuth, stravaController.getPendingPRs);
router.post('/prs/accept', requireAuth, stravaController.acceptPendingPR);
router.post('/prs/reject', requireAuth, stravaController.rejectPendingPR);

export default router;
