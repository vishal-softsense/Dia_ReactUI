import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../../config";

function normalizeMediaPath(path) {
  if (!path || typeof path !== "string") return "";
  let trimmed = path.trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return "";
  trimmed = trimmed.replace(/\\/g, "/").replace(/^~\//, "/");
  return trimmed;
}

/** Resolve MVC-style relative paths against IMAGE_URL (same pattern as jewellery reports). */
export function resolveJewMediaUrl(path) {
  const trimmed = normalizeMediaPath(path);
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  const baseUrl = (api.IMAGE_URL || api.API_URL || "").replace(/\/$/, "");
  const clean = trimmed.replace(/^(\.\.\/)+/, "");
  if (!baseUrl) return clean.startsWith("/") ? clean : `/${clean}`;
  return clean.startsWith("/") ? `${baseUrl}${clean}` : `${baseUrl}/${clean}`;
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
  const [imgFailed, setImgFailed] = useState(false);

  const binarySrc = useMemo(() => toBinarySrc(imageBinary), [imageBinary]);

  const imageSrc = useMemo(() => {
    return resolveJewMediaUrl(imagePath) || binarySrc || "";
  }, [imagePath, binarySrc]);

  const videoSrc = useMemo(() => resolveJewMediaUrl(videoPath), [videoPath]);

  const certHref = useMemo(() => {
    const fromStock = resolveJewMediaUrl(certPath);
    return fromStock || "https://www.igi.org/verify-your-report/";
  }, [certPath]);

  useEffect(() => {
    setImgFailed(false);
  }, [imageSrc]);

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
          imageSrc && !imgFailed ? (
            <img
              key={imageSrc}
              src={imageSrc}
              alt="Jewellery"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={() => setImgFailed(true)}
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
