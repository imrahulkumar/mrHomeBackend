import mongoose from 'mongoose';

// Second-level category used as a filter inside a Category (e.g. Rings inside Jewellery).
const subCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Sub-category name is required.'], trim: true, maxlength: 60 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Parent category is required.'] },
    icon: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

subCategorySchema.index({ category: 1, slug: 1 }, { unique: true });
subCategorySchema.index({ category: 1, order: 1, name: 1 });

export default mongoose.model('SubCategory', subCategorySchema);
