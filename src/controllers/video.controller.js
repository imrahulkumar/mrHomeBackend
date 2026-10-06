import Video from '../models/Video.js';
import { ApiError } from '../utils/ApiError.js';
import { isAdminRequest, pick } from '../utils/helpers.js';

const FIELDS = ['title', 'youtubeUrl', 'description', 'product', 'category', 'showOnHome', 'order', 'isActive'];

const normalize = (data) => {
  if (data.product === '') data.product = null;
  if (data.category === '') data.category = null;
  return data;
};

/** GET /api/videos?home=true&product=<id>&category=<id> */
export async function listVideos(req, res) {
  const filter = {};
  if (!isAdminRequest(req)) filter.isActive = true;
  if (req.query.home === 'true') filter.showOnHome = true;
  if (req.query.product) filter.product = req.query.product;
  if (req.query.category) filter.category = req.query.category;

  const videos = await Video.find(filter)
    .populate('product', 'name slug')
    .populate('category', 'name slug')
    .sort({ order: 1, createdAt: -1 })
    .lean();
  res.json(videos);
}

export async function createVideo(req, res) {
  const video = await Video.create(normalize(pick(req.body, FIELDS)));
  res.status(201).json(video);
}

export async function updateVideo(req, res) {
  const video = await Video.findById(req.params.id);
  if (!video) throw ApiError.notFound('Video not found.');
  video.set(normalize(pick(req.body, FIELDS)));
  await video.save();
  res.json(video);
}

export async function deleteVideo(req, res) {
  const deleted = await Video.findByIdAndDelete(req.params.id);
  if (!deleted) throw ApiError.notFound('Video not found.');
  res.json({ message: 'Video deleted.' });
}
