import mongoose from 'mongoose';

// Single document that drives the look and content of the storefront.
const settingSchema = new mongoose.Schema(
  {
    siteName: { type: String, trim: true, default: 'Mamta Jewellers' },
    logo: { type: String, trim: true, default: '' },
    announcement: { type: String, trim: true, default: '' }, // thin bar above the navbar; empty hides it

    hero: {
      title: { type: String, trim: true, default: 'Timeless jewellery & handcrafted décor' },
      subtitle: { type: String, trim: true, default: 'Certified gold, diamonds and artisan home pieces.' },
      image: { type: String, trim: true, default: '' },
      ctaText: { type: String, trim: true, default: 'Shop now' },
      ctaLink: { type: String, trim: true, default: '' },
    },

    theme: {
      primaryColor: { type: String, trim: true, default: '#b8892f' },
      primaryDark: { type: String, trim: true, default: '#8f6a1f' },
    },

    // Checkout pricing
    currency: { type: String, trim: true, default: 'INR' },
    gstRate: { type: Number, min: 0, max: 100, default: 3 },
    shippingFee: { type: Number, min: 0, default: 199 },
    freeShippingThreshold: { type: Number, min: 0, default: 10000 },
    paymentMethods: {
      card: { type: Boolean, default: true },
      upi: { type: Boolean, default: true },
      cod: { type: Boolean, default: true },
    },

    // Contact & footer
    contact: {
      email: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      whatsapp: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '' },
    },
    social: {
      instagram: { type: String, trim: true, default: '' },
      facebook: { type: String, trim: true, default: '' },
      youtube: { type: String, trim: true, default: '' },
    },
    footerText: { type: String, trim: true, default: 'BIS Hallmarked Gold' },
  },
  { timestamps: true },
);

settingSchema.statics.getSingleton = async function getSingleton() {
  return (await this.findOne()) ?? this.create({});
};

export default mongoose.model('Setting', settingSchema);
