import mongoose from 'mongoose';
import { hexColor, safeUrl } from '../utils/helpers.js';

// Storefront themes. Each id has a matching [data-theme] block in the store's index.css.
export const THEME_PRESETS = ['classic', 'midnight', 'minimal', 'rose', 'emerald', 'festive'];

// Font ids the admin can pick; 'theme' keeps the preset's font. Must match FONTS in both frontends' utils/fonts.js.
export const FONT_IDS = [
  'theme', 'playfair', 'cormorant', 'marcellus', 'cinzel', 'lora', 'dm-serif',
  'inter', 'poppins', 'montserrat', 'lato', 'dm-sans', 'nunito', 'jost',
];

// Home page blocks, in their default order.
export const HOME_SECTIONS = ['hero', 'categories', 'featured', 'videos'];
const DEFAULT_SECTION_TITLES = { hero: '', categories: 'Shop by category', featured: 'Featured', videos: 'Watch our collection' };
const defaultHomeSections = () => HOME_SECTIONS.map((id) => ({ id, enabled: true, title: DEFAULT_SECTION_TITLES[id] }));

const choice = (values, value) => ({ type: String, enum: values, default: value });

// An image that can come from a pasted URL or an upload. Both are kept so switching back loses nothing;
// `source` decides which one the store renders.
const media = () => ({
  source: { type: String, enum: ['url', 'upload'], default: 'url' },
  url: { type: String, trim: true, default: '', validate: safeUrl },
  upload: { type: String, trim: true, default: '', validate: safeUrl },
});

// Single document that drives the look and content of the storefront.
const settingSchema = new mongoose.Schema(
  {
    siteName: { type: String, trim: true, default: 'Mamta Jewellers' },
    logo: { type: String, trim: true, default: '', validate: safeUrl }, // resolved from logoMedia on save; what the store renders
    logoMedia: media(),
    announcement: { type: String, trim: true, default: '' }, // thin bar above the navbar; empty hides it

    hero: {
      title: { type: String, trim: true, default: 'Timeless jewellery & handcrafted décor' },
      subtitle: { type: String, trim: true, default: 'Certified gold, diamonds and artisan home pieces.' },
      image: { type: String, trim: true, default: '', validate: safeUrl }, // resolved from hero.imageMedia on save
      imageMedia: media(),
      ctaText: { type: String, trim: true, default: 'Shop now' },
      ctaLink: { type: String, trim: true, default: '', validate: safeUrl },
      align: choice(['left', 'center'], 'left'),
      height: choice(['small', 'medium', 'large'], 'medium'),
    },

    // Order and visibility of the home page blocks; every id in HOME_SECTIONS appears exactly once.
    homeSections: {
      type: [
        {
          _id: false,
          id: { type: String, enum: HOME_SECTIONS, required: true },
          enabled: { type: Boolean, default: true },
          title: { type: String, trim: true, default: '' },
        },
      ],
      default: defaultHomeSections,
    },

    // Typography, buttons, cards and the product grid. 'theme' means "use the preset's value".
    appearance: {
      headingFont: choice(FONT_IDS, 'theme'),
      bodyFont: choice(FONT_IDS, 'theme'),
      fontSize: choice(['small', 'medium', 'large'], 'medium'),
      buttonShape: choice(['theme', 'square', 'rounded', 'pill'], 'theme'),
      cardStyle: choice(['theme', 'bordered', 'shadow', 'flat'], 'theme'),
      productColumns: { type: Number, enum: [0, 2, 3, 4, 5], default: 0 }, // 0 = fit as many as the screen allows
    },

    header: {
      style: choice(['classic', 'centered', 'compact'], 'classic'),
      sticky: { type: Boolean, default: true },
      menuStyle: choice(['underline', 'pills', 'boxed', 'plain'], 'underline'),
      menuAlign: choice(['left', 'center'], 'left'),
      menuUppercase: { type: Boolean, default: false },
      showCategoryIcons: { type: Boolean, default: true },
    },

    animation: {
      pageTransition: choice(['none', 'fade', 'slide', 'zoom'], 'fade'),
      scrollReveal: { type: Boolean, default: true },
      cardHover: choice(['none', 'lift', 'zoom', 'glow'], 'lift'),
      speed: choice(['fast', 'normal', 'slow'], 'normal'),
    },

    theme: {
      preset: { type: String, enum: THEME_PRESETS, default: 'classic' },
      // true keeps primaryColor/primaryDark (and colours chosen before presets existed);
      // the admin turns it off when a preset is picked so the preset's own accent shows.
      customColors: { type: Boolean, default: true },
      primaryColor: { type: String, trim: true, default: '#b8892f', validate: hexColor },
      primaryDark: { type: String, trim: true, default: '#8f6a1f', validate: hexColor },
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
      instagram: { type: String, trim: true, default: '', validate: safeUrl },
      facebook: { type: String, trim: true, default: '', validate: safeUrl },
      youtube: { type: String, trim: true, default: '', validate: safeUrl },
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

// Keep homeSections a complete, duplicate-free ordering: drop repeats, append any missing block.
settingSchema.pre('validate', function normalizeHomeSections() {
  const seen = new Set();
  const sections = (this.homeSections ?? []).filter((s) => s?.id && !seen.has(s.id) && seen.add(s.id));
  const missing = defaultHomeSections().filter((s) => !seen.has(s.id));
  if (missing.length || sections.length !== this.homeSections.length) this.homeSections = [...sections, ...missing];
});

settingSchema.statics.getSingleton = async function getSingleton() {
  return (await this.findOne()) ?? this.create({});
};

export default mongoose.model('Setting', settingSchema);
