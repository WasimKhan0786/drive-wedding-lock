import mongoose, { Schema, model, models } from 'mongoose';

const VideoSchema = new Schema({
  videoId: { // Renamed from 'id' to avoid conflict with default _id, storing public_id/youtubeId here
    type: String,
    required: true,
    unique: true,
  },
  youtubeId: {
    type: String,
    required: false,
  },
  title: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    default: "",
  },
  hidden: {
    type: Boolean,
    default: false,
  },
  format: {
    type: String,
    default: 'youtube', // 'youtube' or 'cloudinary'
  },
  secure_url: {
    type: String,
    required: false, // Optional for YouTube videos
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  folderId: {
    type: Schema.Types.ObjectId,
    ref: 'Folder',
    default: null,
  },
});

// Prevent model recompilation error in development
const Video = models.Video || model('Video', VideoSchema);

export default Video;
