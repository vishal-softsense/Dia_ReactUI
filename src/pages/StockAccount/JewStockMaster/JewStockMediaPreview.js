import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { api } from "../../../config";
import {
  collectDriveImageCandidates,
  extractGoogleDriveFileId,
  getPrimaryMediaPath,
  isGoogleDriveFileName,
  parseMediaPaths,
  resolveDriveVideoFileId,
  toGoogleDriveVideoPreviewEmbedUrl,
} from "../../../helpers/googleDriveMedia";

function normalizeMediaPath(path) {
  if (!path || typeof path !== "string") return "";
  let trimmed = path.trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return "";
  trimmed = trimmed.replace(/\\/g, "/").replace(/^~\//, "/");
  return trimmed;
}

const API_STATIC_PREFIXES = ["/JewelleryPhotos/", "/Upload/", "/CRreport/"];

function isApiStaticPath(path) {
  return API_STATIC_PREFIXES.some((prefix) => path.toLowerCase().startsWith(prefix.toLowerCase()));
}

function isDriveProxyUrl(url) {
  return typeof url === "string" && url.indexOf("/api/JewelleryStockMaster/jew-drive-image") >= 0;
}

/** Resolve MVC-style relative paths (Jewellery reports use IMAGE_URL; API static folders use API_URL). */
export function resolveJewMediaUrl(path) {
  const trimmed = normalizeMediaPath(path);
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  const clean = trimmed.replace(/^(\.\.\/)+/, "");
  const rel = clean.startsWith("/") ? clean : `/${clean}`;
  const apiBase = (api.API_URL || "").replace(/\/$/, "");
  const imageBase = (api.IMAGE_URL || api.API_URL || "").replace(/\/$/, "");
  const baseUrl = isApiStaticPath(rel) ? apiBase : imageBase;

  if (!baseUrl) return rel;
  return clean.startsWith("/") ? `${baseUrl}${clean}` : `${baseUrl}/${clean}`;
}

/** Try API host, image host, then same-origin relative path (MVC parity). */
export function collectJewMediaCandidates(path) {
  const trimmed = normalizeMediaPath(path);
  if (!trimmed) return [];

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return [trimmed];
  }

  const clean = trimmed.replace(/^(\.\.\/)+/, "");
  const rel = clean.startsWith("/") ? clean : `/${clean}`;
  const apiBase = (api.API_URL || "").replace(/\/$/, "");
  const imageBase = (api.IMAGE_URL || api.API_URL || "").replace(/\/$/, "");
  const urls = [];

  if (isApiStaticPath(rel) && apiBase) urls.push(`${apiBase}${rel}`);
  if (imageBase) urls.push(clean.startsWith("/") ? `${imageBase}${clean}` : `${imageBase}/${clean}`);
  if (rel.startsWith("/")) urls.push(rel);

  return [...new Set(urls.filter(Boolean))];
}

function toBinarySrc(binary) {
  if (!binary) return "";
  if (typeof binary === "string") {
    const s = binary.trim();
    if (!s || s === "null") return "";
    if (s.startsWith("data:")) return s;
    return `data:image/jpeg;base64,${s}`;
  }
  return "";
}

function looksLikeDrivePath(path) {
  const val = getPrimaryMediaPath(path);
  if (!val) return false;
  return !!(isGoogleDriveFileName(val) || extractGoogleDriveFileId(val));
}

/**
 * Image tab: Camera / Video / Certificate.
 * Shows media when ImagePath / VideoPath / CertPath / ImageBinary is set.
 * Google Drive: CDN + authenticated proxy blob fallback (MVC jew-drive parity).
 */
export default function JewStockMediaPreview({
  imagePath = "",
  videoPath = "",
  certPath = "",
  imageBinary = null,
}) {
  const [mediaView, setMediaView] = useState("image");
  const [imgIdx, setImgIdx] = useState(0);
  const [videoIdx, setVideoIdx] = useState(0);
  const [driveImageUrls, setDriveImageUrls] = useState([]);
  const [driveVideoFileId, setDriveVideoFileId] = useState("");
  const [drivePreviewSrc, setDrivePreviewSrc] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [blobSrc, setBlobSrc] = useState("");
  const [activeThumb, setActiveThumb] = useState(0);

  const binarySrc = useMemo(() => toBinarySrc(imageBinary), [imageBinary]);
  const imagePaths = useMemo(() => parseMediaPaths(imagePath), [imagePath]);
  const primaryImage = imagePaths[activeThumb] || imagePaths[0] || "";
  const hasVideoPath = !!normalizeMediaPath(videoPath);

  // Resolve Drive / local candidates for the active image
  useEffect(() => {
    let cancelled = false;
    setImgIdx(0);
    setBlobSrc("");

    async function load() {
      if (looksLikeDrivePath(primaryImage)) {
        const urls = await collectDriveImageCandidates(primaryImage);
        if (!cancelled) setDriveImageUrls(urls);
        return;
      }
      if (!cancelled) setDriveImageUrls([]);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [primaryImage]);

  // Prefetch Drive file id as soon as Video Path is set (MVC parity — ready before VIDEO click)
  useEffect(() => {
    let cancelled = false;
    setDriveVideoFileId("");
    setDrivePreviewSrc("");
    setVideoError(false);

    if (!hasVideoPath) {
      setVideoLoading(false);
      return undefined;
    }

    if (!looksLikeDrivePath(videoPath) && !extractGoogleDriveFileId(videoPath)) {
      setVideoLoading(false);
      return undefined;
    }

    // Sync id when already known (share link / bare id) — no API wait
    const syncId = extractGoogleDriveFileId(videoPath);
    if (syncId) {
      setDriveVideoFileId(syncId);
      setVideoLoading(false);
      return undefined;
    }

    setVideoLoading(true);
    (async () => {
      try {
        const fileId = await resolveDriveVideoFileId(videoPath);
        if (cancelled) return;
        if (fileId) {
          setDriveVideoFileId(fileId);
          setVideoError(false);
        } else {
          setVideoError(true);
        }
      } catch {
        if (!cancelled) setVideoError(true);
      } finally {
        if (!cancelled) setVideoLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [videoPath, hasVideoPath]);

  // Load Drive /preview iframe only when VIDEO tab is open (Google CDN — much faster than API proxy)
  useEffect(() => {
    if (mediaView !== "video" || !driveVideoFileId) {
      if (mediaView !== "video") setDrivePreviewSrc("");
      return;
    }
    const src = toGoogleDriveVideoPreviewEmbedUrl(driveVideoFileId);
    setDrivePreviewSrc(src);
    setVideoLoading(true);
  }, [mediaView, driveVideoFileId]);

  const localImageCandidates = useMemo(() => {
    if (looksLikeDrivePath(primaryImage)) return [];
    const fromPath = collectJewMediaCandidates(primaryImage);
    if (binarySrc) return [binarySrc, ...fromPath];
    return fromPath;
  }, [primaryImage, binarySrc]);

  const imageCandidates = looksLikeDrivePath(primaryImage) ? driveImageUrls : localImageCandidates;
  const imageSrc = blobSrc || imageCandidates[imgIdx] || "";

  const videoCandidates = useMemo(() => {
    if (looksLikeDrivePath(videoPath) || extractGoogleDriveFileId(videoPath)) return [];
    return collectJewMediaCandidates(videoPath);
  }, [videoPath]);
  const videoSrc = videoCandidates[videoIdx] || "";

  // Authenticated proxy: fetch as blob when CDN fails / proxy URL is current candidate
  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    const current = imageCandidates[imgIdx] || "";
    if (!isDriveProxyUrl(current)) {
      setBlobSrc("");
      return undefined;
    }

    (async () => {
      try {
        const res = await axios.get(current, { responseType: "blob" });
        if (cancelled) return;
        const blob = res instanceof Blob ? res : res?.data;
        if (blob instanceof Blob) {
          objectUrl = URL.createObjectURL(blob);
          setBlobSrc(objectUrl);
        }
      } catch {
        if (!cancelled) {
          setBlobSrc("");
          setImgIdx((prev) => prev + 1);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageCandidates, imgIdx]);

  useEffect(() => {
    setActiveThumb(0);
  }, [imagePath]);

  useEffect(() => {
    setVideoIdx(0);
  }, [videoCandidates]);

  const certHref = useMemo(() => {
    const candidates = collectJewMediaCandidates(certPath);
    return candidates[0] || "https://www.igi.org/verify-your-report/";
  }, [certPath]);

  const emptyMsg = (label) => (
    <div className="text-center text-muted p-3">
      <i className="ri-image-line" style={{ fontSize: 40 }} />
      <div style={{ fontSize: 12, marginTop: 6 }}>No {label} set for this stock</div>
    </div>
  );

  const mediaBtnClass = (active) =>
    `btn btn-sm d-flex flex-column align-items-center justify-content-center ${active ? "btn-primary" : "btn-light"}`;

  const showDriveVideo = mediaView === "video" && !!drivePreviewSrc;
  const showLocalVideo =
    mediaView === "video" && !drivePreviewSrc && !driveVideoFileId && !!videoSrc && !videoLoading;

  return (
    <div>
      <div className="d-flex justify-content-center gap-2 mb-3">
        <button
          type="button"
          title="Camera"
          className={mediaBtnClass(mediaView === "image")}
          style={{ width: 58, height: 58 }}
          onClick={() => setMediaView("image")}
        >
          <i className="ri-camera-line" style={{ fontSize: 22, lineHeight: 1 }} />
        </button>
        <button
          type="button"
          title="Video"
          className={mediaBtnClass(mediaView === "video")}
          style={{ width: 58, height: 58 }}
          onClick={() => setMediaView("video")}
        >
          <i className="ri-video-fill" style={{ fontSize: 22, lineHeight: 1 }} />
          <span style={{ marginTop: 2, fontSize: 9, fontWeight: 700 }}>VIDEO</span>
        </button>
        <a
          href={certHref}
          target="_blank"
          rel="noopener noreferrer"
          title={normalizeMediaPath(certPath) ? "Open certificate" : "Verify certificate (IGI)"}
          className={mediaBtnClass(false)}
          style={{ width: 58, height: 58, textDecoration: "none" }}
        >
          <i className="ri-file-paper-2-line" style={{ fontSize: 22, lineHeight: 1 }} />
          <span style={{ marginTop: 2, fontSize: 9, fontWeight: 700 }}>CERTIFICATE</span>
        </a>
      </div>

      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: 6,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--vz-border-color, #e9ecef)",
          background: "var(--vz-tertiary-bg, #f1f3f5)",
          position: "relative",
        }}
      >
        {mediaView === "image" ? (
          imageSrc ? (
            <img
              key={imageSrc}
              src={imageSrc}
              alt="Jewellery"
              referrerPolicy="no-referrer"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={() => {
                if (blobSrc) setBlobSrc("");
                setImgIdx((prev) => prev + 1);
              }}
            />
          ) : (
            emptyMsg("image")
          )
        ) : showDriveVideo ? (
          <>
            {videoLoading && (
              <div
                className="text-muted d-flex align-items-center justify-content-center"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 1,
                  background: "rgba(241,243,245,0.85)",
                }}
              >
                <div className="text-center">
                  <div className="spinner-border spinner-border-sm mb-2" role="status" />
                  <div style={{ fontSize: 12 }}>Loading video…</div>
                </div>
              </div>
            )}
            <iframe
              key={drivePreviewSrc}
              title="Google Drive Video"
              src={drivePreviewSrc}
              allow="autoplay; encrypted-media"
              allowFullScreen
              onLoad={() => setVideoLoading(false)}
              style={{
                width: "100%",
                height: "100%",
                border: 0,
                background: "#000",
              }}
            />
          </>
        ) : showLocalVideo ? (
          <video
            key={videoSrc}
            src={videoSrc}
            controls
            autoPlay
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
            onError={() => setVideoIdx((prev) => prev + 1)}
          >
            Your browser does not support the video tag.
          </video>
        ) : mediaView === "video" && (videoLoading || (hasVideoPath && !videoError && looksLikeDrivePath(videoPath))) ? (
          <div className="text-center text-muted p-3">
            <div className="spinner-border spinner-border-sm mb-2" role="status" />
            <div style={{ fontSize: 12 }}>Loading video…</div>
          </div>
        ) : mediaView === "video" && hasVideoPath && videoError ? (
          <div className="text-center text-muted p-3">
            <i className="ri-video-line" style={{ fontSize: 40 }} />
            <div style={{ fontSize: 12, marginTop: 6 }}>
              Unable to load video from Google Drive
            </div>
          </div>
        ) : (
          emptyMsg("video")
        )}
      </div>

      {mediaView === "image" && imagePaths.length > 1 && (
        <div
          className="d-flex gap-1 mt-2"
          style={{ overflowX: "auto", justifyContent: "center", padding: "4px 0" }}
        >
          {imagePaths.map((p, i) => (
            <button
              key={`thumb-${i}-${p}`}
              type="button"
              className="btn btn-sm p-0"
              title={p}
              onClick={() => setActiveThumb(i)}
              style={{
                width: 56,
                height: 52,
                border: i === activeThumb ? "1.5px solid #5A8DEE" : "1.5px solid #dde3ee",
                borderRadius: 5,
                overflow: "hidden",
                background: "#fff",
                flex: "0 0 56px",
              }}
            >
              <DriveThumb path={p} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DriveThumb({ path }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (looksLikeDrivePath(path)) {
        const urls = await collectDriveImageCandidates(path);
        if (!cancelled) setSrc(urls[0] || "");
      } else {
        const urls = collectJewMediaCandidates(path);
        if (!cancelled) setSrc(urls[0] || "");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path]);
  if (!src) return <span className="text-muted" style={{ fontSize: 10 }}>…</span>;
  return (
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}
