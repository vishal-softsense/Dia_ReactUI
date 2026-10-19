/**
 * Google Drive media helpers — ported from MVC google-drive-media.js / JewDesign.js.
 * File stays on Drive; ImagePath/VideoPath store file names or view links.
 */
import { api } from "../config";
import { getJewDriveFindByName, getJewDriveListStockImages, getJewDriveListStockVideos } from "./fakebackend_helper";

export function parseMediaPaths(value) {
  const val = String(value || "").trim();
  if (!val) return [];
  return val
    .split(/[|;]+|\r?\n/)
    .map((p) => (p || "").trim())
    .filter(Boolean);
}

export function getPrimaryMediaPath(value) {
  const parts = parseMediaPaths(value);
  return parts.length ? parts[0] : "";
}

export function joinMediaPaths(paths) {
  return (paths || []).map((p) => String(p || "").trim()).filter(Boolean).join("|");
}

export function extractGoogleDriveFileId(value) {
  if (!value) return null;
  const val = String(value).trim();
  if (!val) return null;

  const proxyMatch = val.match(/[?&]id=([a-zA-Z0-9_-]{20,})/i);
  if (val.indexOf("jew-drive-image") >= 0 && proxyMatch) {
    return proxyMatch[1];
  }

  const idMatch = val.match(/(?:\/d\/|id=|open\?id=|thumbnail\?id=)([a-zA-Z0-9_-]{20,})/i);
  if (idMatch) return idMatch[1];

  if (/^[a-zA-Z0-9_-]{20,}$/.test(val) && val.indexOf("http") !== 0 && val.indexOf(".") < 0) {
    return val;
  }
  return null;
}

/** True if value looks like a Drive file name: Test.png / KJB23115-3.00CT.jpg */
export function isGoogleDriveFileName(value) {
  if (!value) return false;
  const val = String(value).trim();
  if (!val || val.indexOf("http") === 0 || val.indexOf("/") >= 0) return false;
  if (extractGoogleDriveFileId(val)) return false;
  return /\.(png|jpe?g|gif|bmp|webp|mp4|mov|avi|mkv|webm|pdf)$/i.test(val);
}

function driveApiBase() {
  return (api.API_URL || "").replace(/\/$/, "");
}

/** Proxy URL (requires auth — prefer CDN URLs for <img>; use for axios blob fetch). */
export function toJewDriveImageProxyUrl(value, mediaType = "image") {
  const val = getPrimaryMediaPath(value);
  if (!val) return "";
  const base = driveApiBase();
  if (isGoogleDriveFileName(val)) {
    return `${base}/api/JewelleryStockMaster/jew-drive-image?name=${encodeURIComponent(val)}&mediaType=${encodeURIComponent(mediaType || "image")}`;
  }
  const fileId = extractGoogleDriveFileId(val);
  if (fileId) {
    const mt = encodeURIComponent(mediaType || "image");
    return `${base}/api/JewelleryStockMaster/jew-drive-image?id=${encodeURIComponent(fileId)}&mediaType=${mt}`;
  }
  return "";
}

export function toGoogleDriveImageSrcFallbacks(value) {
  const val = getPrimaryMediaPath(value);
  if (!val) return [];
  if (isGoogleDriveFileName(val)) {
    // Resolved later via find-by-name; keep proxy as last resort
    const proxy = toJewDriveImageProxyUrl(val, "image");
    return proxy ? [proxy] : [];
  }
  const fileId = extractGoogleDriveFileId(val);
  if (!fileId) return [];
  return [
    `https://lh3.googleusercontent.com/d/${fileId}=w1000`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
    toJewDriveImageProxyUrl(fileId),
  ].filter(Boolean);
}

/** Shareable Drive view link (same format as Drive "Copy link"). */
export function toGoogleDriveShareLink(fileId) {
  if (!fileId) return "";
  return `https://drive.google.com/file/d/${fileId}/view?usp=drive_link`;
}

export function toGoogleDriveImagePath(value) {
  if (!value) return "";
  const val = String(value).trim();
  if (!val) return "";
  if (isGoogleDriveFileName(val)) return val;
  const fileId = extractGoogleDriveFileId(val);
  if (fileId) return toGoogleDriveShareLink(fileId);
  return val;
}

export function toGoogleDriveVideoPath(value) {
  return toGoogleDriveImagePath(value);
}

/** Image CDN only (API imageDriveLinks). Never use for video. */
export function toGoogleDriveCdnLink(fileId) {
  if (!fileId) return "";
  return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
}

/**
 * In-app video playback proxy (API stream — slower; prefer preview iframe).
 * https://{API}/api/JewelleryStockMaster/jew-drive-image?id={fileId}&mediaType=video
 */
export function toGoogleDriveVideoStreamLink(fileId) {
  if (!fileId) return "";
  return toJewDriveImageProxyUrl(fileId, "video");
}

/**
 * Fast in-form preview (MVC parity): Google Drive hosts the stream.
 * https://drive.google.com/file/d/{fileId}/preview
 */
export function toGoogleDriveVideoPreviewEmbedUrl(fileId) {
  if (!fileId) return "";
  return `https://drive.google.com/file/d/${String(fileId).trim()}/preview`;
}

/**
 * Resolve VideoPath / Drive link / file name → Drive file id (cached via find-by-name).
 */
export async function resolveDriveVideoFileId(path) {
  const val = String(path || "").trim();
  if (!val) return "";

  const fromUrl = extractGoogleDriveFileId(val);
  if (fromUrl) return fromUrl;

  if (isGoogleDriveFileName(val)) {
    const resolved = await checkGoogleDriveFileExists(val, "video");
    if (resolved.ok && resolved.fileId) return resolved.fileId;
  }
  return "";
}

/** Image-only response helper — lh3 CDN. Do not use for videos. */
export function toGoogleDriveMediaResponseLink(value) {
  if (!value) return "";
  const val = String(value).trim();
  if (!val) return "";
  const fileId = extractGoogleDriveFileId(val);
  if (fileId) return toGoogleDriveCdnLink(fileId);
  return "";
}

/**
 * Convert any Drive path → Google Drive share link (videoDriveLinks format).
 * Example: https://drive.google.com/file/d/{fileId}/view?usp=drive_link
 */
export function toGoogleDriveVideoResponseLink(value) {
  if (!value) return "";
  const val = String(value).trim();
  if (!val) return "";
  const fileId = extractGoogleDriveFileId(val);
  if (fileId) return toGoogleDriveShareLink(fileId);
  return "";
}

/**
 * Local API proxy URL for in-app video playback.
 * Streams real video bytes via jew-drive-image (not an image thumbnail).
 */
export function toJewDriveVideoProxyUrl(value) {
  return toJewDriveImageProxyUrl(value, "video");
}

/** Embeddable Drive /preview URL from path / id / share link (sync when id known). */
export function toGoogleDriveVideoPreviewUrl(value) {
  if (!value) return "";
  const val = String(value).trim();
  if (!val) return "";
  const fileId = extractGoogleDriveFileId(val);
  if (fileId) return toGoogleDriveVideoPreviewEmbedUrl(fileId);
  return "";
}

let _lastWarnMsg = "";
let _lastWarnAt = 0;

export function showGoogleDriveMediaWarning(mediaType) {
  const isVideo = String(mediaType || "").toLowerCase() === "video";
  const msg = isVideo ? "No videos stored in Google Drive" : "No images stored in Google Drive";
  const now = Date.now();
  if (_lastWarnMsg === msg && _lastWarnAt && now - _lastWarnAt < 1500) return;
  _lastWarnMsg = msg;
  _lastWarnAt = now;
  // Lazy import toast to avoid circular deps at module load
  import("react-toastify").then(({ toast }) => {
    toast.error(msg, { toastId: `gdrive-${mediaType}` });
  }).catch(() => {
    // eslint-disable-next-line no-alert
    alert(msg);
  });
}

const _findByNameCache = new Map(); // key: mediaType|name → { at, result }

function logDriveShareLink(fileName, fileId, mediaType = "image") {
  if (!fileId) return;
  const isVideo = String(mediaType || "").toLowerCase() === "video";
  // Images → lh3 CDN; videos → Option B API HTTP stream
  const link = isVideo
    ? toGoogleDriveVideoStreamLink(fileId)
    : toGoogleDriveCdnLink(fileId);
  console.log(`[Google Drive ${mediaType}] ${fileName || fileId} → ${link}`);
  return link;
}

export async function checkGoogleDriveFileExists(fileName, mediaType = "image") {
  const name = (fileName || "").trim();
  if (!name || !isGoogleDriveFileName(name)) return { ok: false };
  const cacheKey = `${String(mediaType || "image").toLowerCase()}|${name.toLowerCase()}`;
  const cached = _findByNameCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 120000) {
    return cached.result;
  }
  try {
    const data = await getJewDriveFindByName(name, mediaType);
    if (data && (data.success || data.Success) && (data.fileId || data.FileId)) {
      const fileId = data.fileId || data.FileId;
      const resolvedName = data.fileName || data.FileName || name;
      const fileLink = toGoogleDriveShareLink(fileId);
      const result = {
        ok: true,
        fileId,
        fileName: resolvedName,
        fileLink,
        raw: data,
      };
      _findByNameCache.set(cacheKey, { at: Date.now(), result });
      return result;
    }
    const miss = { ok: false, raw: data };
    _findByNameCache.set(cacheKey, { at: Date.now(), result: miss });
    return miss;
  } catch {
    return { ok: false };
  }
}

/**
 * Resolve pipe-separated ImagePath / VideoPath file names → Drive share links.
 * DB value stays as names; returns and console.logs full Drive URLs.
 */
export async function resolveDriveShareLinksFromPaths(pathValue, mediaType = "image") {
  const paths = parseMediaPaths(pathValue);
  const links = [];
  for (const p of paths) {
    if (!p || String(p).toLowerCase() === "null") continue;
    if (isGoogleDriveFileName(p)) {
      const resolved = await checkGoogleDriveFileExists(p, mediaType);
      if (resolved.ok && resolved.fileId) {
        const link = logDriveShareLink(resolved.fileName || p, resolved.fileId, mediaType);
        links.push({
          name: resolved.fileName || p,
          fileId: resolved.fileId,
          link,
        });
      }
      continue;
    }
    const fileId = extractGoogleDriveFileId(p);
    if (fileId) {
      const link = logDriveShareLink(p, fileId, mediaType);
      links.push({ name: p, fileId, link });
    }
  }
  if (links.length > 1) {
    console.log(
      `[Google Drive ${mediaType}] all links:`,
      links.map((x) => x.link)
    );
  }
  return links;
}

export function looksLikeDriveMedia(path) {
  const val = getPrimaryMediaPath(path);
  if (!val) return false;
  return !!(isGoogleDriveFileName(val) || extractGoogleDriveFileId(val));
}

/**
 * True when URL is jew-drive-image with ?id= (AllowAnonymous — safe for &lt;video src&gt;).
 * Name-based proxies need a Bearer token and will not play in a bare video tag.
 */
export function isAnonymousDriveVideoProxyUrl(url) {
  const u = String(url || "");
  return u.indexOf("jew-drive-image") >= 0 && /[?&]id=/i.test(u);
}

/**
 * Resolve a video path / CDN / Drive /preview link to a local API proxy URL.
 * Prefer ?id=FILE_ID so &lt;video src&gt; works without auth headers.
 */
export async function resolveDriveVideoPlayProxyUrl(path) {
  const val = String(path || "").trim();
  if (!val) return "";

  // Already a local proxy — if name-only, resolve to id first
  if (val.indexOf("jew-drive-image") >= 0) {
    if (isAnonymousDriveVideoProxyUrl(val)) return val;
    const named = val.match(/[?&]name=([^&]+)/i);
    if (named) {
      try {
        const fileName = decodeURIComponent(named[1]);
        const resolved = await checkGoogleDriveFileExists(fileName, "video");
        if (resolved.ok && resolved.fileId) {
          return toJewDriveImageProxyUrl(resolved.fileId, "video");
        }
      } catch {
        /* keep name proxy for axios blob fallback */
      }
    }
    return val;
  }

  const fileId = extractGoogleDriveFileId(val);
  if (fileId) {
    return toJewDriveImageProxyUrl(fileId, "video");
  }

  if (isGoogleDriveFileName(val)) {
    const resolved = await checkGoogleDriveFileExists(val, "video");
    if (resolved.ok && resolved.fileId) {
      return toJewDriveImageProxyUrl(resolved.fileId, "video");
    }
    // Fallback: name-based proxy (axios / auth only — not for bare &lt;video src&gt;)
    return toJewDriveVideoProxyUrl(val);
  }

  // Non-Drive http(s) (e.g. local static) — allow; Drive hosts always blocked
  if (/^https?:\/\//i.test(val) && val.indexOf("drive.google.com") < 0 && val.indexOf("googleusercontent.com") < 0) {
    return val;
  }
  return "";
}

/**
 * Playable URL for in-form &lt;video&gt;: id-based proxy, or authenticated blob as last resort.
 */
export async function resolveDriveVideoPlayableUrl(path) {
  const proxy = await resolveDriveVideoPlayProxyUrl(path);
  if (!proxy) return "";
  if (proxy.indexOf("blob:") === 0) return proxy;
  if (isAnonymousDriveVideoProxyUrl(proxy)) return proxy;
  if (/^https?:\/\//i.test(proxy) && proxy.indexOf("drive.google.com") < 0 && proxy.indexOf("/api/") < 0) {
    return proxy;
  }
  // Name-based / auth-only proxy → blob URL
  return fetchDriveVideoBlobUrl(path);
}

/**
 * Fetch video bytes via local API proxy → blob: URL for in-form video player.
 * Never navigates to Google Drive.
 */
export async function fetchDriveVideoBlobUrl(path) {
  const proxy = await resolveDriveVideoPlayProxyUrl(path);
  if (!proxy) return "";

  // Already a blob URL
  if (proxy.indexOf("blob:") === 0) return proxy;

  // Local proxy or same-origin URL — fetch with auth (axios interceptor)
  if (proxy.indexOf("jew-drive-image") >= 0 || proxy.indexOf("/api/") >= 0) {
    try {
      const axios = (await import("axios")).default;
      const res = await axios.get(proxy, { responseType: "blob" });
      const blob = res instanceof Blob ? res : res?.data;
      if (blob instanceof Blob && blob.size > 0) {
        // Force a video MIME when Drive/API returns octet-stream
        const typed =
          blob.type && blob.type.indexOf("video/") === 0
            ? blob
            : new Blob([blob], { type: blob.type || "video/mp4" });
        return URL.createObjectURL(typed);
      }
    } catch {
      return "";
    }
    return "";
  }

  // Direct non-Drive URL
  return proxy;
}

/**
 * Open video without Drive UI — resolves to local proxy URL (caller plays in video element).
 * Returns the playable URL string, or false if none.
 */
export async function openGoogleDriveVideo(value) {
  const val = value == null ? "" : String(value).trim();
  if (!val) {
    showGoogleDriveMediaWarning("video");
    return false;
  }

  const playable = await resolveDriveVideoPlayableUrl(val);
  if (playable) return playable;

  showGoogleDriveMediaWarning("video");
  return false;
}

export async function resolveGoogleDriveByFileName(fileName, mediaType = "image", { showWarning = true } = {}) {
  const result = await checkGoogleDriveFileExists(fileName, mediaType);
  if (!result.ok && showWarning) showGoogleDriveMediaWarning(mediaType);
  return result;
}

/** Normalize bare ID / link / keep file name (after existence check for names). */
export async function normalizeGoogleDrivePath(value, mediaType = "image", { showWarning = true } = {}) {
  const val = String(value || "").trim();
  if (!val) return { value: "", ok: true };

  if (isGoogleDriveFileName(val)) {
    const result = await resolveGoogleDriveByFileName(val, mediaType, { showWarning });
    if (!result.ok) return { value: "", ok: false };
    // Prefer storing the actual Drive file name (MVC keeps the name)
    return { value: result.fileName || val, ok: true, fileId: result.fileId, fileLink: result.fileLink };
  }

  const normalized =
    mediaType === "image" ? toGoogleDriveImagePath(val) : toGoogleDriveVideoPath(val);
  return { value: normalized, ok: true, fileId: extractGoogleDriveFileId(normalized) };
}

/**
 * Build preview candidate URLs for an image path (Drive name/ID or local).
 * For Drive file names, resolves via API then returns CDN + proxy fallbacks.
 */
export async function collectDriveImageCandidates(path) {
  const val = getPrimaryMediaPath(path);
  if (!val) return [];

  if (/^https?:\/\//i.test(val) && !extractGoogleDriveFileId(val)) {
    return [val];
  }

  if (isGoogleDriveFileName(val)) {
    const resolved = await checkGoogleDriveFileExists(val, "image");
    if (resolved.ok && resolved.fileId) {
      return [
        `https://lh3.googleusercontent.com/d/${resolved.fileId}=w1000`,
        `https://drive.google.com/uc?export=view&id=${resolved.fileId}`,
        `https://drive.google.com/thumbnail?id=${resolved.fileId}&sz=w1000`,
        toJewDriveImageProxyUrl(resolved.fileId),
      ].filter(Boolean);
    }
    const proxy = toJewDriveImageProxyUrl(val, "image");
    return proxy ? [proxy] : [];
  }

  const fileId = extractGoogleDriveFileId(val);
  if (fileId) {
    return [
      `https://lh3.googleusercontent.com/d/${fileId}=w1000`,
      `https://drive.google.com/uc?export=view&id=${fileId}`,
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
      toJewDriveImageProxyUrl(fileId),
    ].filter(Boolean);
  }

  return [];
}

/**
 * Resolve video for playback — local API proxy (same pattern as image proxy),
 * not drive.google.com /preview.
 */
export async function resolveDriveVideoPreviewUrl(path) {
  return resolveDriveVideoPlayProxyUrl(path);
}

export function isAutoStockImageName(path, stockId) {
  path = (path || "").trim();
  stockId = (stockId || "").trim();
  if (!path || !stockId) return false;
  if (path.indexOf("http") === 0 || path.indexOf("/") >= 0) return false;
  const escaped = stockId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `^${escaped}(?:[_\\-]?(\\d+)|\\s+(\\d+)|\\s*\\((\\d+)\\))?\\.(png|jpe?g|gif|bmp|webp)$`,
    "i"
  );
  if (re.test(path)) return true;
  if (!/\.(png|jpe?g|gif|bmp|webp)$/i.test(path)) return false;
  if (path.toLowerCase().indexOf(stockId.toLowerCase()) !== 0) return false;
  if (path.length <= stockId.length) return false;
  const next = path.charAt(stockId.length);
  return next === "." || next === " " || next === "(" || next === "_" || next === "-" || (next >= "0" && next <= "9");
}

export function isAutoStockVideoName(path, stockId) {
  path = (path || "").trim();
  stockId = (stockId || "").trim();
  if (!path || !stockId) return false;
  if (path.indexOf("http") === 0 || path.indexOf("/") >= 0) return false;
  const escaped = stockId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `^${escaped}(?:[_\\-]?(\\d+)|\\s+(\\d+)|\\s*\\((\\d+)\\))?\\.(mp4|mov|avi|mkv|webm)$`,
    "i"
  );
  if (re.test(path)) return true;
  if (!/\.(mp4|mov|avi|mkv|webm)$/i.test(path)) return false;
  if (path.toLowerCase().indexOf(stockId.toLowerCase()) !== 0) return false;
  if (path.length <= stockId.length) return false;
  const next = path.charAt(stockId.length);
  return next === "." || next === " " || next === "(" || next === "_" || next === "-" || (next >= "0" && next <= "9");
}

const _imageListCache = { stockId: "", files: [], at: 0 };
const _videoListCache = { stockId: "", files: [], at: 0 };

export async function listStockDriveImages(stockId) {
  stockId = (stockId || "").trim();
  if (!stockId) return [];
  if (
    _imageListCache.stockId === stockId.toLowerCase() &&
    Date.now() - _imageListCache.at < 60000
  ) {
    return _imageListCache.files.slice();
  }
  try {
    const data = await getJewDriveListStockImages(stockId);
    const files =
      data && (data.success || data.Success) && Array.isArray(data.files || data.Files)
        ? data.files || data.Files
        : [];
    _imageListCache.stockId = stockId.toLowerCase();
    _imageListCache.files = files.slice();
    _imageListCache.at = Date.now();
    return files;
  } catch {
    return [];
  }
}

export function clearStockDriveImageCache() {
  _imageListCache.stockId = "";
  _imageListCache.files = [];
  _imageListCache.at = 0;
}

/** List Drive video file names for Stock ID (same pattern as listStockDriveImages). */
export async function listStockDriveVideos(stockId) {
  stockId = (stockId || "").trim();
  if (!stockId) return [];
  if (
    _videoListCache.stockId === stockId.toLowerCase() &&
    Date.now() - _videoListCache.at < 60000
  ) {
    return _videoListCache.files.slice();
  }
  try {
    const data = await getJewDriveListStockVideos(stockId);
    const files =
      data && (data.success || data.Success) && Array.isArray(data.files || data.Files)
        ? data.files || data.Files
        : [];
    _videoListCache.stockId = stockId.toLowerCase();
    _videoListCache.files = files.slice();
    _videoListCache.at = Date.now();
    return files;
  } catch {
    return [];
  }
}

export async function findFirstStockVideoFileName(stockId) {
  const files = await listStockDriveVideos(stockId);
  return files && files.length ? files[0] : null;
}

export function clearStockDriveVideoCache() {
  _videoListCache.stockId = "";
  _videoListCache.files = [];
  _videoListCache.at = 0;
}

export function pickNextUnusedStockImage(usedPaths, files) {
  const used = {};
  (usedPaths || []).forEach((p) => {
    const v = String(p || "").trim();
    if (v) used[v.toLowerCase()] = true;
  });
  for (let i = 0; i < (files || []).length; i++) {
    const name = String(files[i] || "").trim();
    if (name && !used[name.toLowerCase()]) return name;
  }
  return null;
}

export function pickNextUnusedStockVideo(usedPaths, files) {
  return pickNextUnusedStockImage(usedPaths, files);
}
