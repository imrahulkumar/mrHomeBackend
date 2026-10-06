import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required.'], trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required.'] },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', default: null },
    material: { type: String, trim: true, default: '' },
    price: { type: Number, required: [true, 'Price is required.'], min: [0, 'Price cannot be negative.'] },
    mrp: { type: Number, min: 0, default: null }, // original price, shown struck-through when higher than price
    images: [{ type: String, trim: true }],
    stock: { type: Number, min: 0, default: 10 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    tags: [{ type: String, trim: true, lowercase: true }],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ category: 1, subCategory: 1, isActive: 1 });
productSchema.index({ isFeatured: -1, createdAt: -1 });
productSchema.index({ price: 1 });

export default mongoose.model('Product', productSchema);
