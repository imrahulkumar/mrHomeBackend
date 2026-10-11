import mongoose from 'mongoose';

// Storefront themes. Each id has a matching [data-theme] block in the store's index.css.
export const THEME_PRESETS = ['classic', 'midnight', 'minimal', 'rose', 'emerald', 'festive'];

// An image that can come from a pasted URL or an upload. Both are kept so switching back loses nothing;
// `source` decides which one the store renders.
const media = () => ({
  source: { type: String, enum: ['url', 'upload'], default: 'url' },
  url: { type: String, trim: true, default: '' },
  upload: { type: String, trim: true, default: '' },
});

// Single document that drives the look and content of the storefront.
const settingSchema = new mongoose.Schema(
  {
    siteName: { type: String, trim: true, default: 'Mamta Jewellers' },
    logo: { type: String, trim: true, default: '' }, // resolved from logoMedia on save; what the store renders
    logoMedia: media(),
    announcement: { type: String, trim: true, default: '' }, // thin bar above the navbar; empty hides it

    hero: {
      title: { type: String, trim: true, default: 'Timeless jewellery & handcrafted décor' },
      subtitle: { type: String, trim: true, default: 'Certified gold, diamonds and artisan home pieces.' },
      image: { type: String, trim: true, default: '' }, // resolved from hero.imageMedia on save
      imageMedia: media(),
      ctaText: { type: String, trim: true, default: 'Shop now' },
      ctaLink: { type: String, trim: true, default: '' },
    },

    theme: {
      preset: { type: String, enum: THEME_PRESETS, default: 'classic' },
      // true keeps primaryColor/primaryDark (and colours chosen before presets existed);
      // the admin turns it off when a preset is picked so the preset's own accent shows.
      customColors: { type: Boolean, default: true },
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

// Settings saved before logoMedia/imageMedia existed have both sources empty; leave their image alone.
const resolve = (m) => m[m.source] ?? '';
settingSchema.pre('validate', function resolveMedia() {
  if (this.isModified('logoMedia') || this.logoMedia.url || this.logoMedia.upload) this.logo = resolve(this.logoMedia);
  const hm = this.hero.imageMedia;
  if (this.isModified('hero.imageMedia') || hm.url || hm.upload) this.hero.image = resolve(hm);
});

settingSchema.statics.getSingleton = async function getSingleton() {
  return (await this.findOne()) ?? this.create({});
};

export default mongoose.model('Setting', settingSchema);
