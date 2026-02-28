import express from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { upload } from '../middleware/upload';
import {
  uploadVideo,
  getRandomVideos,
  getUserVideos,
  deleteVideo,
  toggleLike,
} from '../controllers/videoController';
import { uploadVideoSchema, videoIdSchema } from '../validations/videoValidation';

const router = express.Router();

router.post(
  '/upload',
  authenticate,
  upload.single('video'),
  validate(uploadVideoSchema),
  uploadVideo
);

router.get('/random', authenticate, getRandomVideos);

router.get('/my-videos', authenticate, getUserVideos);

router.delete('/:videoId', authenticate, validate(videoIdSchema, 'params'), deleteVideo);

router.post('/:videoId/like', authenticate, validate(videoIdSchema, 'params'), toggleLike);

export default router;
