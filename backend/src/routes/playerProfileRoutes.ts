import { Router } from 'express';
import * as profileController from '../controllers/playerProfileController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as profileValidation from '../validations/playerProfileValidation';
import { UserRole } from '../models/User';

const router = Router();

// ── Public (any authenticated user) ───────────────────────────────────────────
// NOTE: must be registered BEFORE the player-only middleware below,
// but AFTER the specific /my-organization path to avoid wildcard conflict.
// Since /my-organization is a static segment and /:profileId is dynamic,
// Express will NOT match /my-organization as a profileId when both are registered here —
// it only does so when the wildcard is the FIRST registered route.
// We register specific paths first, wildcard last.

// Player's own organization — player-only, registered BEFORE /:profileId wildcard
router.get(
    '/my-organization',
    authenticate,
    authorize(UserRole.PLAYER),
    profileController.getMyOrganization
);
router.delete(
    '/my-organization',
    authenticate,
    authorize(UserRole.PLAYER),
    profileController.leaveOrganization
);

// Any authenticated user can view a player's public profile (wildcard — LAST)
router.get('/:profileId', authenticate, profileController.getPlayerById);

// ── Player-only routes ─────────────────────────────────────────────────────────
router.use(authenticate, authorize(UserRole.PLAYER));

router.post('/', validate(profileValidation.createProfileSchema), profileController.createProfile);
router.get('/', profileController.getProfile);
router.put('/', validate(profileValidation.updateProfileSchema), profileController.updateProfile);
router.delete('/', profileController.deleteProfile);

export default router;
