import mongoose from 'mongoose';

// Uploaded image bytes. Stored in MongoDB because serverless hosts (Vercel) have a read-only filesystem.
const imageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    originalName: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

export default mongoose.model('Image', imageSchema);
