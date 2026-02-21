import { Router } from 'express';
import * as scoutingController from '../controllers/scoutingController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as scoutingValidation from '../validations/scoutingValidation';
import { UserRole } from '../models/User';

const router = Router();

router.get('/active', authenticate, scoutingController.listActiveScoutings);
router.get('/:scoutingId', authenticate, scoutingController.getScouting);

router.use(authenticate, authorize(UserRole.ORGANIZATION));

router.post('/', validate(scoutingValidation.createScoutingSchema), scoutingController.createScouting);
router.get('/my/active', scoutingController.getMyActiveScouting);
router.put('/:scoutingId', validate(scoutingValidation.updateScoutingSchema), scoutingController.updateScouting);
router.delete('/:scoutingId', scoutingController.cancelScouting);

export default router;
