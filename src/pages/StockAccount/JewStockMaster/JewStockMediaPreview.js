import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../../config";

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

/**
 * Image tab: Camera / Video / Certificate.
 * Shows media when ImagePath / VideoPath / CertPath / ImageBinary is set.
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

  const binarySrc = useMemo(() => toBinarySrc(imageBinary), [imageBinary]);

  const imageCandidates = useMemo(() => {
    const fromPath = collectJewMediaCandidates(imagePath);
    if (binarySrc) return [binarySrc, ...fromPath];
    return fromPath;
  }, [imagePath, binarySrc]);

  const videoCandidates = useMemo(() => collectJewMediaCandidates(videoPath), [videoPath]);

  const imageSrc = imageCandidates[imgIdx] || "";
  const videoSrc = videoCandidates[videoIdx] || "";

  const certHref = useMemo(() => {
    const candidates = collectJewMediaCandidates(certPath);
    return candidates[0] || "https://www.igi.org/verify-your-report/";
  }, [certPath]);

  useEffect(() => {
    setImgIdx(0);
  }, [imageCandidates]);

  useEffect(() => {
    setVideoIdx(0);
  }, [videoCandidates]);

  const emptyMsg = (label) => (
    <div className="text-center text-muted p-3">
      <i className="ri-image-line" style={{ fontSize: 40 }} />
      <div style={{ fontSize: 12, marginTop: 6 }}>No {label} set for this stock</div>
    </div>
  );

  const mediaBtnClass = (active) =>
    `btn btn-sm d-flex flex-column align-items-center justify-content-center ${active ? "btn-primary" : "btn-light"}`;

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
        }}
      >
        {mediaView === "image" ? (
          imageSrc ? (
            <img
              key={imageSrc}
              src={imageSrc}
              alt="Jewellery"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={() => setImgIdx((prev) => prev + 1)}
            />
          ) : (
            emptyMsg("image")
          )
        ) : videoSrc ? (
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
        ) : (
          emptyMsg("video")
        )}
      </div>
    </div>
  );
}
