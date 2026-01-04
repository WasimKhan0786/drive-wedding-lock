import mongoose, { Schema, Model } from 'mongoose';

interface IDeletedVideo {
  youtubeId: string;
  deletedAt: Date;
}

const DeletedVideoSchema = new Schema<IDeletedVideo>({
  youtubeId: { type: String, required: true, unique: true },
  deletedAt: { type: Date, default: Date.now }
});

const DeletedVideo: Model<IDeletedVideo> = mongoose.models.DeletedVideo || mongoose.model<IDeletedVideo>('DeletedVideo', DeletedVideoSchema);

export default DeletedVideo;
