import { Schema, model, models, type Document, type Model } from 'mongoose';

export type ActivityType = 'view' | 'search' | 'click' | 'impression';

export interface IUserActivity extends Document {
  userId?: string | null;
  anonymousId?: string | null;
  type: ActivityType;
  symbol?: string | null;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const UserActivitySchema = new Schema<IUserActivity>(
  {
    userId: { type: String, required: false, index: true },
    anonymousId: { type: String, required: false, index: true },
    type: { type: String, required: true, enum: ['view', 'search', 'click', 'impression'] },
    symbol: { type: String, required: false, uppercase: true, trim: true },
    meta: { type: Schema.Types.Mixed, required: false },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// TTL for retention. Default 90 days. Use env var USER_ACTIVITY_RETENTION_DAYS to override.
const retentionDays = Number(process.env.USER_ACTIVITY_RETENTION_DAYS ?? 90);
if (retentionDays > 0) {
  // expireAfterSeconds expects seconds
  UserActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: retentionDays * 24 * 60 * 60 });
}

UserActivitySchema.index({ userId: 1, type: 1 });
UserActivitySchema.index({ anonymousId: 1, type: 1 });

export const UserActivity: Model<IUserActivity> =
  (models?.UserActivity as Model<IUserActivity>) || model<IUserActivity>('UserActivity', UserActivitySchema);
