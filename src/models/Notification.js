import mongoose from 'mongoose';

export const AUDIENCES = ['all', 'registered', 'guests', 'users'];

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required.'], trim: true, maxlength: 120 },
    message: { type: String, required: [true, 'Message is required.'], trim: true, maxlength: 1000 },
    image: { type: String, trim: true, default: '' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null }, // "View" opens this product
    link: { type: String, trim: true, default: '' }, // used when no product is set; a store path (/shop/rings) or full URL
    // all = everyone · registered = logged-in customers · guests = visitors without an account · users = only `recipients`
    audience: { type: String, enum: AUDIENCES, default: 'all' },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    showAsPopup: { type: Boolean, default: false }, // also pop up once on the store, not just in the bell
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

notificationSchema.pre('validate', function checkRecipients() {
  if (this.audience === 'users' && !this.recipients?.length) {
    this.invalidate('recipients', 'Pick at least one customer to send to.');
  }
  if (this.audience !== 'users') this.recipients = [];
});

notificationSchema.index({ isActive: 1, audience: 1, createdAt: -1 });
notificationSchema.index({ recipients: 1 });

export default mongoose.model('Notification', notificationSchema);
