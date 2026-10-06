import mongoose from 'mongoose';
import { extractYouTubeId } from '../utils/helpers.js';

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Video title is required.'], trim: true, maxlength: 150 },
    youtubeUrl: { type: String, required: [true, 'YouTube link is required.'], trim: true },
    videoId: { type: String },
    description: { type: String, trim: true, default: '' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null }, // show on this product's page
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // show on this category's page
    showOnHome: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

videoSchema.pre('validate', function setVideoId() {
  if (this.isModified('youtubeUrl')) {
    this.videoId = extractYouTubeId(this.youtubeUrl);
    if (!this.videoId) this.invalidate('youtubeUrl', 'Please enter a valid YouTube link.');
  }
});

export default mongoose.model('Video', videoSchema);
