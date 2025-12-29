import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface IPasswordResetToken extends Document {
  token: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    token: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// TTL index to automatically delete expired tokens
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetToken: Model<IPasswordResetToken> =
  (models?.PasswordResetToken as Model<IPasswordResetToken>) || 
  model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);
