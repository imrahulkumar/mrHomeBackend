import mongoose from 'mongoose';

// Top-level category shown in the navbar (e.g. Jewellery, Decorative Items).
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required.'], trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon: { type: String, trim: true, default: '' }, // emoji or short text
    image: { type: String, trim: true, default: '' },
    tagline: { type: String, trim: true, maxlength: 200, default: '' },
    order: { type: Number, default: 0 },
    showInNav: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ order: 1, name: 1 });

export default mongoose.model('Category', categorySchema);
