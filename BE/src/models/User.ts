import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  followers: string[];
  following: string[];
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  bio: { type: String, default: '' },
  followers: [{ type: String, ref: 'User' }],
  following: [{ type: String, ref: 'User' }],
});

export default mongoose.model<IUser>('User', UserSchema);