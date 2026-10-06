import mongoose from 'mongoose';

export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
export const PAYMENT_METHODS = ['card', 'upi', 'cod'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], validate: [(v) => v.length > 0, 'Order must have at least one item.'] },
    address: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      line1: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    subtotal: { type: Number, required: true },
    gst: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true },
    payment: {
      method: { type: String, enum: PAYMENT_METHODS, required: true },
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      transactionId: { type: String, default: null },
      paidAt: { type: Date, default: null },
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
