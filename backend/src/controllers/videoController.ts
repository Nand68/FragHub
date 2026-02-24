import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Video from '../models/Video';
import cloudinary from '../config/cloudinary';
import { AppError } from '../utils/AppError';

export const uploadVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next(new AppError('No video file provided', 400));
    }
    console.log()

    const { caption } = req.body;
    const userId = (req as any).user.id;

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'esports-videos',
          chunk_size: 6000000, // 6MB chunks
          timeout: 600000, // 10 minutes
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file!.buffer);
    });

    const uploadResult = result as any;

    // Generate reel-optimized video URL
    const reelUrl = cloudinary.url(uploadResult.public_id, {
      resource_type: 'video',
      transformation: [
        { width: 1080, height: 1920, crop: 'fill', gravity: 'auto' },
        { quality: 'auto' },
        { fetch_format: 'mp4' },
      ],
    });

    // Generate thumbnail
    const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
      resource_type: 'video',
      transformation: [
        { width: 400, height: 700, crop: 'fill' },
        { start_offset: '1' },
      ],
    });

    const video = await Video.create({
      userId,
      videoUrl: reelUrl,
      cloudinaryPublicId: uploadResult.public_id,
      caption: caption || '',
      thumbnailUrl,
      duration: uploadResult.duration,
      width: uploadResult.width,
      height: uploadResult.height,
    });

    res.status(201).json({
      success: true,
      data: video,
    });
  } catch (error) {
    next(error);
  }
};

export const getRandomVideos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    
    const videos = await Video.aggregate([
      { $sample: { size: limit } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          videoUrl: 1,
          thumbnailUrl: 1,
          caption: 1,
          likes: 1,
          duration: 1,
          width: 1,
          height: 1,
          createdAt: 1,
          'user.email': 1,
          'user.role': 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserVideos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    
    const videos = await Video.find({ userId })
      .sort({ createdAt: -1 })
      .select('-likedBy');

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    next(error);
  } 
};

export const deleteVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { videoId } = req.params;
    const userId = (req as any).user.id;

    const video = await Video.findById(videoId);

    if (!video) {
      return next(new AppError('Video not found', 404));
    }

    if (video.userId.toString() !== userId) {
      return next(new AppError('Not authorized to delete this video', 403));
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: 'video' });

    await Video.findByIdAndDelete(videoId);

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const toggleLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { videoId } = req.params;
    const userId = (req as any).user.id;

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const video = await Video.findById(videoId).select('likedBy likes');
    if (!video) {
      return next(new AppError('Video not found', 404));
    }

    const hasLiked = video.likedBy.some(id => id.equals(userObjectId));

    const update = hasLiked
      ? { $pull: { likedBy: userObjectId }, $inc: { likes: -1 } }
      : { $addToSet: { likedBy: userObjectId }, $inc: { likes: 1 } };

    const updatedVideo = await Video.findByIdAndUpdate(videoId, update, {
      new: true,
      select: 'likes',
    });

    res.status(200).json({
      success: true,
      data: {
        videoId: updatedVideo!._id,
        likes: updatedVideo!.likes,
        isLiked: !hasLiked,
      },
    });
  } catch (error) {
    next(error);
  }
};

