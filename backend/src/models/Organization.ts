import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  userId: mongoose.Types.ObjectId;
  organization_name: string;
  country: string;
  description?: string;
}

const organizationSchema = new Schema<IOrganization>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    organization_name: { type: String, required: true },
    country: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IOrganization>('Organization', organizationSchema);
