import { Router } from 'express';
import * as orgController from '../controllers/organizationController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as orgValidation from '../validations/organizationValidation';
import { UserRole } from '../models/User';

const router = Router();

router.use(authenticate, authorize(UserRole.ORGANIZATION));

router.post('/', validate(orgValidation.createOrganizationSchema), orgController.createOrganization);
router.get('/', orgController.getOrganization);
router.put('/', validate(orgValidation.updateOrganizationSchema), orgController.updateOrganization);
router.get('/roster', orgController.getRoster);
router.delete('/roster/:playerId', orgController.removePlayer);

export default router;
