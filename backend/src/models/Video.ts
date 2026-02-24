import mongoose, { Schema, Document } from 'mongoose';

export interface IVideo extends Document {
  userId: mongoose.Types.ObjectId;
  videoUrl: string;
  cloudinaryPublicId: string;
  caption?: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  likes: number;
  likedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    videoUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    caption: { type: String, maxlength: 500 },
    thumbnailUrl: { type: String, required: true },
    duration: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

videoSchema.index({ createdAt: -1 });
videoSchema.index({ likedBy: 1 });

export default mongoose.model<IVideo>('Video', videoSchema);
