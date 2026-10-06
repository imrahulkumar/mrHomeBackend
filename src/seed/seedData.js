// Sample catalogue used by `npm run seed`. Products reference categories/sub-categories by slug.
export const categories = [
  {
    name: 'Jewellery',
    slug: 'jewellery',
    icon: '💍',
    tagline: 'Certified gold, diamonds and gemstones.',
    order: 1,
    subCategories: [
      { name: 'Rings', slug: 'rings', icon: '💍' },
      { name: 'Necklaces', slug: 'necklaces', icon: '📿' },
      { name: 'Earrings', slug: 'earrings', icon: '✨' },
      { name: 'Bracelets', slug: 'bracelets', icon: '🔗' },
      { name: 'Bangles', slug: 'bangles', icon: '⭕' },
      { name: 'Pendants', slug: 'pendants', icon: '💎' },
    ],
  },
  {
    name: 'Decorative Items',
    slug: 'decorative-items',
    icon: '🏺',
    tagline: 'Handcrafted pieces to brighten every corner of your home.',
    order: 2,
    subCategories: [
      { name: 'Idols & Figurines', slug: 'idols', icon: '🪔' },
      { name: 'Vases', slug: 'vases', icon: '🏺' },
      { name: 'Wall Decor', slug: 'wall-decor', icon: '🖼️' },
      { name: 'Candle Holders', slug: 'candle-holders', icon: '🕯️' },
      { name: 'Showpieces', slug: 'showpieces', icon: '🦚' },
    ],
  },
];

const p = (category, subCategory, name, material, price, rating, description, extra = {}) => ({
  category, subCategory, name, material, price, rating, description, ...extra,
});

export const products = [
  p('jewellery', 'rings', 'Solitaire Diamond Ring', '18K White Gold', 54999, 4.8, 'A timeless round-cut solitaire set in a classic four-prong 18K white gold band.', { isFeatured: true, mrp: 59999 }),
  p('jewellery', 'rings', 'Rose Gold Floral Ring', '14K Rose Gold', 18499, 4.5, 'Delicate floral motif studded with tiny cubic zirconia stones.'),
  p('jewellery', 'rings', 'Emerald Cocktail Ring', '22K Yellow Gold', 72999, 4.7, 'A statement emerald centre stone surrounded by a halo of diamonds.'),
  p('jewellery', 'necklaces', 'Kundan Choker Necklace', '22K Gold Plated', 32999, 4.6, 'Traditional kundan work choker, perfect for weddings and festive occasions.', { isFeatured: true }),
  p('jewellery', 'necklaces', 'Pearl Strand Necklace', 'Sterling Silver', 12999, 4.4, 'Elegant single strand of freshwater pearls with a silver clasp.'),
  p('jewellery', 'necklaces', 'Temple Gold Necklace', '22K Yellow Gold', 145999, 4.9, 'Handcrafted temple jewellery featuring intricate deity motifs.', { isFeatured: true }),
  p('jewellery', 'earrings', 'Diamond Stud Earrings', '18K Yellow Gold', 28999, 4.8, 'Brilliant-cut diamond studs for everyday sparkle.'),
  p('jewellery', 'earrings', 'Jhumka Earrings', '22K Gold', 38499, 4.7, 'Classic bell-shaped jhumkas with pearl drops.', { isFeatured: true }),
  p('jewellery', 'earrings', 'Hoop Earrings', '14K Rose Gold', 9999, 4.3, 'Lightweight, polished hoops that go with everything.'),
  p('jewellery', 'bracelets', 'Tennis Bracelet', '18K White Gold', 89999, 4.9, 'A continuous line of matched diamonds in a flexible setting.'),
  p('jewellery', 'bracelets', 'Charm Bracelet', 'Sterling Silver', 6499, 4.2, 'Silver chain bracelet with five removable charms.'),
  p('jewellery', 'bangles', 'Antique Gold Bangles (Set of 2)', '22K Gold', 98999, 4.8, 'Antique-finish bangles with fine filigree detailing.'),
  p('jewellery', 'bangles', 'Diamond Kada', '18K Yellow Gold', 124999, 4.6, 'Bold kada with a row of pavé-set diamonds.'),
  p('jewellery', 'pendants', 'Heart Diamond Pendant', '18K Rose Gold', 15999, 4.5, 'Heart-shaped pendant with a diamond outline, chain included.'),
  p('jewellery', 'pendants', 'Om Gold Pendant', '22K Gold', 11499, 4.7, 'Auspicious Om pendant in polished 22K gold.'),
  p('jewellery', 'pendants', 'Ruby Drop Pendant', '18K White Gold', 26999, 4.6, 'Pear-shaped ruby suspended from a diamond bail.'),

  p('decorative-items', 'idols', 'Brass Ganesha Idol', 'Brass', 3499, 4.8, 'Hand-cast brass Ganesha with antique finish, 8 inches tall.', { isFeatured: true, mrp: 3999 }),
  p('decorative-items', 'idols', 'Silver Plated Lakshmi Idol', 'Silver Plated', 6999, 4.7, 'Silver-plated Lakshmi idol, ideal for your pooja room or gifting.'),
  p('decorative-items', 'idols', 'Marble Buddha Figurine', 'Marble', 4999, 4.6, 'Serene meditating Buddha carved from white marble.'),
  p('decorative-items', 'vases', 'Hand-painted Ceramic Vase', 'Ceramic', 1899, 4.4, 'Blue pottery-inspired vase, hand-painted by artisans.'),
  p('decorative-items', 'vases', 'Brass Etched Flower Vase', 'Brass', 2799, 4.5, 'Tall brass vase with intricate etched floral patterns.'),
  p('decorative-items', 'wall-decor', 'Peacock Metal Wall Art', 'Iron', 5499, 4.6, 'Colourful hand-painted peacock wall panel, 36 inches wide.', { isFeatured: true }),
  p('decorative-items', 'wall-decor', 'Wooden Mandala Wall Plate', 'Wood', 2299, 4.3, 'Laser-cut sheesham wood mandala for living room walls.'),
  p('decorative-items', 'candle-holders', 'Brass Diya Stand', 'Brass', 2499, 4.7, 'Five-wick traditional diya stand for festive décor.'),
  p('decorative-items', 'candle-holders', 'Glass Hurricane Candle Holder', 'Glass', 1299, 4.2, 'Clear glass hurricane with a gold-finished base.'),
  p('decorative-items', 'showpieces', 'Silver Elephant Pair', 'Silver Plated', 8999, 4.8, 'A pair of silver-plated elephants with raised trunks for good luck.', { isFeatured: true }),
  p('decorative-items', 'showpieces', 'Wooden Horse Showpiece', 'Wood', 1999, 4.4, 'Hand-carved wooden horse with brass inlay work.'),
];
