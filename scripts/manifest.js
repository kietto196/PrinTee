'use strict';
/**
 * Quét public/data/*.json + public/media/<danh-muc>/<id-san-pham>/
 * và gộp lại thành 1 object duy nhất (manifest) cho trang web đọc.
 *
 *  - Mỗi file JSON trong public/data  = 1 tab / danh mục.
 *    (File bắt đầu bằng "_" hoặc "." sẽ bị bỏ qua, ví dụ _TEMPLATE.json)
 *  - Ảnh/video của sản phẩm nằm ở  public/media/<tên-file-json>/<id>/
 *    và được sắp theo số đầu tên file: 1.mp4, 2.jpg, 3.jpg, 10.jpg ...
 */
const fs = require('fs');
const path = require('path');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogv']);

function slugify(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function typeOf(name) {
  const ext = path.extname(String(name).split('?')[0]).toLowerCase();
  if (IMAGE_EXT.has(ext)) return 'image';
  if (VIDEO_EXT.has(ext)) return 'video';
  return null;
}

const isUrl = (s) => /^(https?:)?\/\//i.test(s) || s.startsWith('/');

/** Ghép đường dẫn web, mã hoá từng đoạn (an toàn với dấu cách, tiếng Việt) */
function toWebPath(...parts) {
  return parts.join('/').split('/').filter(Boolean).map(encodeURIComponent).join('/');
}

function leadNum(n) {
  const m = /^(\d+)/.exec(n);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}
function naturalCompare(a, b) {
  const d = leadNum(a) - leadNum(b);
  if (d !== 0) return d;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function readJson(file, label) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`File ${label} bị lỗi cú pháp JSON: ${e.message}`);
  }
}

function listDir(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
}

function scanMedia(publicDir, catKey, folder) {
  const rel = ['media', catKey, folder];
  return listDir(path.join(publicDir, ...rel))
    .filter((d) => d.isFile() && !d.name.startsWith('.') && typeOf(d.name))
    .map((d) => d.name)
    .sort(naturalCompare)
    .map((name) => ({ type: typeOf(name), src: toWebPath(...rel, name) }));
}

function resolveMedia(item, catKey, folder) {
  const src = typeof item === 'string' ? item : item && item.src;
  if (!src) return null;
  const type = (item && item.type) || typeOf(src) || 'image';
  const out = { type, src: isUrl(src) ? src : toWebPath('media', catKey, folder, src) };
  if (item && item.poster) out.poster = isUrl(item.poster) ? item.poster : toWebPath('media', catKey, folder, item.poster);
  return out;
}

function arrayify(v) {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function buildManifest(publicDir) {
  const warnings = [];
  const sitePath = path.join(publicDir, 'site.json');
  const site = fs.existsSync(sitePath) ? readJson(sitePath, 'public/site.json') : {};

  const dataDir = path.join(publicDir, 'data');
  const files = listDir(dataDir)
    .filter((d) => d.isFile() && /\.json$/i.test(d.name) && !/^[_.]/.test(d.name))
    .map((d) => d.name)
    .sort(naturalCompare);

  const categories = [];
  for (const file of files) {
    const key = file.replace(/\.json$/i, '');
    const label = `public/data/${file}`;
    const data = readJson(path.join(dataDir, file), label);
    const meta = Array.isArray(data) ? {} : data || {};
    const list = Array.isArray(data) ? data : meta.products || [];
    if (!Array.isArray(list)) throw new Error(`${label}: "products" phải là một mảng [ ... ]`);

    const seen = new Set();
    const products = [];
    list.forEach((p, i) => {
      if (!p || typeof p !== 'object') {
        warnings.push(`${label}: sản phẩm thứ ${i + 1} không hợp lệ, đã bỏ qua`);
        return;
      }
      if (p.hidden) return;
      const title = String(p.title || p.name || '').trim() || `Sản phẩm ${i + 1}`;
      const id = String(p.id || '').trim() || slugify(title) || `sp-${i + 1}`;
      if (seen.has(id)) {
        warnings.push(`${label}: trùng id "${id}", sản phẩm phía sau đã bị bỏ qua`);
        return;
      }
      seen.add(id);
      const folder = String(p.folder || id);

      let media = Array.isArray(p.media) && p.media.length
        ? p.media.map((m) => resolveMedia(m, key, folder)).filter(Boolean)
        : scanMedia(publicDir, key, folder);
      if (!media.length) warnings.push(`Chưa có ảnh/video cho "${title}", hãy thêm vào public/media/${key}/${folder}/`);

      const firstImage = media.find((m) => m.type === 'image');
      media = media.map((m) => (m.type === 'video' && !m.poster && firstImage ? { ...m, poster: firstImage.src } : m));
      const cover = p.cover ? resolveMedia(p.cover, key, folder).src : firstImage ? firstImage.src : null;
      const description = Array.isArray(p.description) ? p.description.join('\n') : String(p.description || '');

      products.push({ ...p, id, folder, title, description, tags: arrayify(p.tags), media, cover });
    });

    // Cảnh báo thư mục ảnh không khớp với sản phẩm nào (thường do gõ sai id)
    listDir(path.join(publicDir, 'media', key))
      .filter((d) => d.isDirectory())
      .forEach((d) => {
        const used = list.some((p) => p && String(p.folder || p.id || slugify(p.title || p.name)) === d.name);
        if (!used) warnings.push(`Thư mục public/media/${key}/${d.name}/ không khớp id sản phẩm nào trong ${label}`);
      });

    const order = Number(meta.order);
    categories.push({
      key,
      name: meta.name || key,
      icon: meta.icon || '',
      description: meta.description || '',
      order: Number.isFinite(order) && meta.order !== null && meta.order !== '' ? order : 999,
      cover: meta.cover ? resolveMedia(meta.cover, key, '').src : undefined,
      products,
    });
  }

  categories.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'vi'));
  return { generatedAt: new Date().toISOString(), site, categories, warnings };
}

module.exports = { buildManifest };
