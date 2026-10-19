import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  clearStockDriveImageCache,
  clearStockDriveVideoCache,
  isAutoStockImageName,
  isAutoStockVideoName,
  isGoogleDriveFileName,
  joinMediaPaths,
  listStockDriveImages,
  listStockDriveVideos,
  normalizeGoogleDrivePath,
  parseMediaPaths,
  pickNextUnusedStockImage,
  resolveDriveShareLinksFromPaths,
  showGoogleDriveMediaWarning,
} from "../../../helpers/googleDriveMedia";

/**
 * Images Details: Image Path (multi-row + Add Image), Video Path, Cert Path.
 * Matches MVC AddMountingStock / EditMountingStock Google Drive behavior.
 */
export default function JewStockDrivePathFields({
  stockId = "",
  imagePath = "",
  videoPath = "",
  certPath = "",
  onImagePathChange,
  onVideoPathChange,
  onCertPathChange,
  inputCls = "form-control",
  readOnly = false,
  FieldRow,
}) {
  const [imageRows, setImageRows] = useState(() => {
    const parts = parseMediaPaths(imagePath);
    return parts.length ? parts : [""];
  });
  const lastAutoStockRef = useRef("");
  const skipNextSyncRef = useRef(false);
  const addBusyRef = useRef(false);
  /** Skip first stockId effect so Edit load / Add mount do not race empty state. */
  const stockSuggestReadyRef = useRef(false);
  const [debouncedStockId, setDebouncedStockId] = useState(stockId);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedStockId(stockId), 450);
    return () => clearTimeout(t);
  }, [stockId]);

  // Sync rows when parent imagePath changes from outside (edit load / reset)
  useEffect(() => {
    const joined = joinMediaPaths(imageRows);
    if (joined === (imagePath || "").trim()) return;
    const parts = parseMediaPaths(imagePath);
    skipNextSyncRef.current = true;
    setImageRows(parts.length ? parts : [""]);
  }, [imagePath]);

  // Console: full Drive share links for saved file names (DB stays names-only)
  useEffect(() => {
    if (imagePath) resolveDriveShareLinksFromPaths(imagePath, "image");
  }, [imagePath]);

  useEffect(() => {
    if (videoPath) resolveDriveShareLinksFromPaths(videoPath, "video");
  }, [videoPath]);

  // Push joined paths to parent
  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    const joined = joinMediaPaths(imageRows);
    if (joined !== (imagePath || "").trim()) {
      onImagePathChange?.(joined);
    }
  }, [imageRows, imagePath, onImagePathChange]);

  const setRowValue = useCallback((index, value) => {
    setImageRows((prev) => {
      const next = prev.slice();
      next[index] = value;
      return next.length ? next : [""];
    });
  }, []);

  const removeRow = useCallback((index) => {
    setImageRows((prev) => {
      if (prev.length <= 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleImageBlur = useCallback(
    async (index, raw) => {
      if (readOnly) return;
      const val = (raw || "").trim();
      if (!val) return;
      if (!isGoogleDriveFileName(val) && !val.match(/(?:\/d\/|id=)/i) && !/^[a-zA-Z0-9_-]{20,}$/.test(val)) {
        return;
      }
      const result = await normalizeGoogleDrivePath(val, "image", { showWarning: true });
      if (!result.ok) {
        if (imageRows.length > 1) removeRow(index);
        else setRowValue(index, "");
        return;
      }
      if (result.value !== val) setRowValue(index, result.value);
    },
    [readOnly, imageRows.length, removeRow, setRowValue]
  );

  const handleVideoBlur = useCallback(async () => {
    if (readOnly) return;
    const val = (videoPath || "").trim();
    if (!val) return;
    if (!isGoogleDriveFileName(val) && !val.match(/(?:\/d\/|id=)/i) && !/^[a-zA-Z0-9_-]{20,}$/.test(val)) {
      return;
    }
    const result = await normalizeGoogleDrivePath(val, "video", { showWarning: true });
    if (!result.ok) {
      onVideoPathChange?.("");
      return;
    }
    if (result.value !== val) onVideoPathChange?.(result.value);
  }, [readOnly, videoPath, onVideoPathChange]);

  // Stock ID → auto-fill first Drive image + video (MVC ApplyStockIdToMedia)
  useEffect(() => {
    if (readOnly) return;
    const sid = (debouncedStockId || "").trim();
    const prevStock = lastAutoStockRef.current || "";

    const canAutoFillImage = (val) => {
      val = (val || "").trim();
      return !val || isAutoStockImageName(val, sid) || (prevStock && isAutoStockImageName(val, prevStock));
    };
    const canAutoFillVideo = (val) => {
      val = (val || "").trim();
      return !val || isAutoStockVideoName(val, sid) || (prevStock && isAutoStockVideoName(val, prevStock));
    };

    let cancelled = false;

    async function run() {
      // First run: remember current stock (edit hydrate) without auto-filling
      if (!stockSuggestReadyRef.current) {
        stockSuggestReadyRef.current = true;
        lastAutoStockRef.current = sid;
        return;
      }

      if (!sid) {
        clearStockDriveImageCache();
        clearStockDriveVideoCache();
        setImageRows((prev) => {
          const kept = prev.filter((v) => !canAutoFillImage(v));
          return kept.length ? kept : [""];
        });
        if (canAutoFillVideo(videoPath)) onVideoPathChange?.("");
        lastAutoStockRef.current = "";
        return;
      }

      const stockChanged = !prevStock || prevStock.toLowerCase() !== sid.toLowerCase();
      if (stockChanged) {
        clearStockDriveImageCache();
        clearStockDriveVideoCache();
      }

      // Video — first Drive video for Stock ID (same as images: list → pick first)
      const currentVideo = (videoPath || "").trim();
      if (canAutoFillVideo(currentVideo)) {
        const sameStockKeep =
          currentVideo &&
          isAutoStockVideoName(currentVideo, sid) &&
          prevStock &&
          prevStock.toLowerCase() === sid.toLowerCase();
        if (!sameStockKeep) {
          const videoFiles = await listStockDriveVideos(sid);
          if (cancelled) return;
          const found = videoFiles && videoFiles.length ? videoFiles[0] : null;
          if (!found) {
            onVideoPathChange?.("");
            showGoogleDriveMediaWarning("video");
          } else if (found !== currentVideo) {
            // DB stores file name only (e.g. STD1001.mp4); API adds VideoDriveLinks on read
            onVideoPathChange?.(found);
          }
        }
      }

      // Images — first available only
      const firstVal = (imageRows[0] || "").trim();
      if (!stockChanged && firstVal && isAutoStockImageName(firstVal, sid)) {
        lastAutoStockRef.current = sid;
        return;
      }
      if (firstVal && !canAutoFillImage(firstVal)) {
        lastAutoStockRef.current = sid;
        return;
      }

      const files = await listStockDriveImages(sid);
      if (cancelled) return;
      const mainName = files && files.length ? files[0] : null;
      const keptCustom = imageRows
        .map((v) => (v || "").trim())
        .filter((v) => v && !canAutoFillImage(v));

      skipNextSyncRef.current = false;
      setImageRows(mainName ? [mainName, ...keptCustom] : keptCustom.length ? keptCustom : [""]);
      if (!mainName) showGoogleDriveMediaWarning("image");
      lastAutoStockRef.current = sid;
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedStockId, readOnly]);

  const handleAddImage = async () => {
    if (readOnly || addBusyRef.current) return;
    const sid = (stockId || debouncedStockId || "").trim();
    if (!sid) {
      setImageRows((prev) => [...prev, ""]);
      return;
    }
    addBusyRef.current = true;
    try {
      const files = await listStockDriveImages(sid);
      const nextName = pickNextUnusedStockImage(imageRows, files);
      if (!nextName) {
        showGoogleDriveMediaWarning("image");
        return;
      }
      const fillFirstEmpty = imageRows.length === 1 && !(imageRows[0] || "").trim();
      if (fillFirstEmpty) setImageRows([nextName]);
      else setImageRows((prev) => [...prev, nextName]);
      lastAutoStockRef.current = sid;
    } finally {
      addBusyRef.current = false;
    }
  };

  const Row = FieldRow || (({ label, children, wide }) => (
    <div className={`mb-2 ${wide ? "" : ""}`}>
      <label className="form-label mb-1">{label}</label>
      {children}
    </div>
  ));

  return (
    <>
      <Row label="Image Path" wide>
        <div className="design-image-paths">
          {imageRows.map((row, index) => (
            <div key={`img-row-${index}`} className="d-flex gap-1 mb-1 align-items-center">
              <input
                type="text"
                className={inputCls}
                placeholder="Drive file name (ex: Test.png)"
                value={row}
                readOnly={readOnly}
                onChange={(e) => setRowValue(index, e.target.value)}
                onBlur={(e) => handleImageBlur(index, e.target.value)}
              />
              {!readOnly && imageRows.length > 1 && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  title="Remove"
                  onClick={() => removeRow(index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {!readOnly && (
            <div className="mt-1">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                title="Add another design image"
                onClick={handleAddImage}
              >
                <span className="me-1">+</span>Add Image
              </button>
            </div>
          )}
        </div>
      </Row>
      <Row label="Video Path" wide>
        <input
          type="text"
          className={inputCls}
          placeholder="Drive file name (ex: Test.mp4)"
          value={videoPath}
          readOnly={readOnly}
          onChange={(e) => onVideoPathChange?.(e.target.value)}
          onBlur={handleVideoBlur}
        />
      </Row>
      <Row label="Cert Path" wide>
        <input
          type="text"
          className={inputCls}
          placeholder="Cert Path"
          value={certPath}
          readOnly={readOnly}
          onChange={(e) => onCertPathChange?.(e.target.value)}
        />
      </Row>
    </>
  );
}
