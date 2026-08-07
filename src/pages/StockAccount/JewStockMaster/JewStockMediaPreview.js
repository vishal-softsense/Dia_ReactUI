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

const mediaBtnStyle = (active, disabled = false) => ({
  width: 58,
  height: 58,
  borderRadius: 8,
  border: active ? "2px solid #5A8DEE" : "1px solid #dee2e6",
  background: active ? "#e8f0fe" : "#f8f9fa",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: disabled ? "not-allowed" : "pointer",
  color: disabled ? "#adb5bd" : "#5A8DEE",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 0.3,
  padding: 4,
  textDecoration: "none",
  opacity: disabled ? 0.65 : 1,
});

/**
 * Image tab: Camera / Video / Certificate.
 * Shows media ONLY when the stock has user-set ImagePath / VideoPath / CertPath (or ImageBinary).
 * No placeholder/default image, video, or certificate.
 */
export default function JewStockMediaPreview({
  imagePath = "",
  videoPath = "",
  certPath = "",
  imageBinary = null,
}) {
  const [mediaView, setMediaView] = useState("image"); // image | video
  const [imgFailed, setImgFailed] = useState(false);

  const binarySrc = useMemo(() => toBinarySrc(imageBinary), [imageBinary]);

  const imageSrc = useMemo(() => {
    return resolveJewMediaUrl(imagePath) || binarySrc || "";
  }, [imagePath, binarySrc]);

  const videoSrc = useMemo(() => resolveJewMediaUrl(videoPath), [videoPath]);

  // Prefer user Cert Path; if empty, use IGI verify (same as MVC certificate icon).
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

  return (
    <div>
      <div className="d-flex justify-content-center gap-2 mb-3">
        <button
          type="button"
          title="Camera"
          style={mediaBtnStyle(mediaView === "image")}
          onClick={() => setMediaView("image")}
        >
          <i className="ri-camera-line" style={{ fontSize: 22, lineHeight: 1 }} />
        </button>
        <button
          type="button"
          title="Video"
          style={mediaBtnStyle(mediaView === "video")}
          onClick={() => setMediaView("video")}
        >
          <i className="ri-video-fill" style={{ fontSize: 22, lineHeight: 1 }} />
          <span style={{ marginTop: 2 }}>VIDEO</span>
        </button>
        <a
          href={certHref}
          target="_blank"
          rel="noopener noreferrer"
          title={normalizeMediaPath(certPath) ? "Open certificate" : "Verify certificate (IGI)"}
          style={mediaBtnStyle(false)}
        >
          <i className="ri-file-paper-2-line" style={{ fontSize: 22, lineHeight: 1 }} />
          <span style={{ marginTop: 2 }}>CERTIFICATE</span>
        </a>
      </div>

      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          background: "#f1f3f5",
          borderRadius: 6,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #e9ecef",
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
