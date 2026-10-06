import Setting from '../models/Setting.js';
import { pick } from '../utils/helpers.js';

const FIELDS = [
  'siteName', 'logo', 'announcement', 'hero', 'theme', 'currency', 'gstRate', 'shippingFee',
  'freeShippingThreshold', 'paymentMethods', 'contact', 'social', 'footerText',
];

export async function getSettings(_req, res) {
  res.json(await Setting.getSingleton());
}

export async function updateSettings(req, res) {
  const settings = await Setting.getSingleton();
  settings.set(pick(req.body, FIELDS));
  await settings.save();
  res.json(settings);
}
