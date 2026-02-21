import mongoose, { Schema, Document } from 'mongoose';

export enum ApplicationStatus {
  PENDING = 'PENDING',
  SELECTED = 'SELECTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface IApplication extends Document {
  scoutingId: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  appliedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    scoutingId: { type: Schema.Types.ObjectId, ref: 'Scouting', required: true },
    playerId: { type: Schema.Types.ObjectId, ref: 'PlayerProfile', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    status: { type: String, enum: Object.values(ApplicationStatus), default: ApplicationStatus.PENDING },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

applicationSchema.index({ scoutingId: 1, playerId: 1 }, { unique: true });

export default mongoose.model<IApplication>('Application', applicationSchema);
