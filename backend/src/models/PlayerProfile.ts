import mongoose, { Schema, Document } from 'mongoose';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum Device {
  MOBILE = 'mobile',
  TABLET = 'tablet',
}

export enum FingerSetup {
  THUMB = 'thumb',
  TWO_FINGER = '2_finger',
  THREE_FINGER = '3_finger',
  FOUR_FINGER = '4_finger',
  FIVE_FINGER = '5_finger',
  SIX_FINGER = '6_finger',
}

export enum PlayingStyle {
  AGGRESSIVE = 'aggressive',
  BALANCED = 'balanced',
  DEFENSIVE = 'defensive',
}

export interface IPlayerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  age: number;
  gender: Gender;
  country: string;
  game_id: string;
  device: Device;
  finger_setup: FingerSetup;
  kd_ratio: number;
  average_damage: number;
  roles: string[];
  playing_style: PlayingStyle;
  preferred_maps: string[];
  ban_history: boolean;
  years_experience?: number;
  youtube_url?: string;
  instagram_url?: string;
  tournaments_played?: string[];
  other_tournament_name?: string;
  bio?: string;
  previous_organization?: string;
  profile_completed: boolean;
  last_updated: Date;
  stats_verified: boolean;
  currentOrganization?: mongoose.Types.ObjectId;
}

const playerProfileSchema = new Schema<IPlayerProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: Object.values(Gender), required: true },
    country: { type: String, required: true },
    game_id: { type: String, required: true },
    device: { type: String, enum: Object.values(Device), required: true },
    finger_setup: { type: String, enum: Object.values(FingerSetup), required: true },
    kd_ratio: { type: Number, required: true },
    average_damage: { type: Number, required: true },
    roles: [{ type: String, required: true }],
    playing_style: { type: String, enum: Object.values(PlayingStyle), required: true },
    preferred_maps: [{ type: String, required: true }],
    ban_history: { type: Boolean, required: true },
    years_experience: { type: Number },
    youtube_url: { type: String },
    instagram_url: { type: String },
    tournaments_played: [{ type: String }],
    other_tournament_name: { type: String },
    bio: { type: String },
    previous_organization: { type: String },
    profile_completed: { type: Boolean, default: false },
    last_updated: { type: Date, default: Date.now },
    stats_verified: { type: Boolean, default: false },
    currentOrganization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  },
  { timestamps: true }
);

playerProfileSchema.pre('save', function (next) {
  this.last_updated = new Date();
  next();
});

export default mongoose.model<IPlayerProfile>('PlayerProfile', playerProfileSchema);
