import { Router } from 'express';
import * as applicationController from '../controllers/applicationController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = Router();

router.use(authenticate);

router.post('/apply/:scoutingId', authorize(UserRole.PLAYER), applicationController.applyToScouting);
router.delete('/:applicationId/withdraw', authorize(UserRole.PLAYER), applicationController.withdrawApplication);
router.get('/my', authorize(UserRole.PLAYER), applicationController.getMyApplications);

router.get('/scouting/:scoutingId', authorize(UserRole.ORGANIZATION), applicationController.getScoutingApplications);
router.post('/:applicationId/select', authorize(UserRole.ORGANIZATION), applicationController.selectPlayer);
router.post('/:applicationId/reject', authorize(UserRole.ORGANIZATION), applicationController.rejectPlayer);

export default router;
