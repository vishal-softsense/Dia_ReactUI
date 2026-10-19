import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row
} from "reactstrap";
import Select, { components } from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";
import { exportToExcel, loadExcelJS } from "../../../helpers/excel_helper";
import { getAddMountingStockData, getAllLotNoList, getJewelleryStockIds, getJewelleryStockSearchDropdowns, getJewelleryStockSearchReport, getJewPurity, getSettingData } from "../../../helpers/fakebackend_helper";
import {
  checkGoogleDriveFileExists,
  collectDriveImageCandidates,
  extractGoogleDriveFileId,
  isGoogleDriveFileName,
  looksLikeDriveMedia,
  parseMediaPaths,
  resolveDriveShareLinksFromPaths,
  resolveDriveVideoFileId,
  showGoogleDriveMediaWarning,
  toGoogleDriveVideoPreviewEmbedUrl,
  toGoogleDriveVideoResponseLink,
} from "../../../helpers/googleDriveMedia";
import { getReportCompanySettings, resolveCompanyLogoUrl } from "../../../helpers/reportCompanyDefaults";
import {
  collectJewMediaCandidates,
  resolveJewMediaUrl
} from "../../StockAccount/JewStockMaster/JewStockMediaPreview";

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const TOTAL_COLS = 47;

const STATUS_COLOR = {
  M: "red",
  LAB: "DarkTurquoise",
  I: "blue",
  L: "green",
  PS: "limegreen",
  Sold: "DarkViolet",
  PH: "Chocolate",
  MI: "green"
};

const PRINT_HIDE_COLS = [
  "col-video", "col-lab", "col-certno", "col-subcategory",
  "col-pcs", "col-rate", "col-amount", "col-dia-lab",
  "col-stone-group", "col-stone-lotno", "col-stone-lab", "col-stone-shape",
  "col-stone-color", "col-stone-clarity", "col-stone-pcs", "col-stone-carat",
  "col-stone-price", "col-stone-amount",
  "col-totalmetal", "col-totaldiamond", "col-totalstone",
  "col-settingcharges", "col-handlingcharges", "col-certcharges",
  "col-othercharges", "col-hallmarkcharges"
];

function unwrapApiResponse(response) {
  const success =
    response?.Success ?? response?.success ??
    response?.data?.Success ?? response?.data?.success;
  const data =
    response?.Data ?? response?.data?.Data ?? response?.data ?? null;
  const message =
    response?.Message || response?.message ||
    response?.data?.Message || response?.data?.message || null;
  return { success, data, message };
}

function getItemField(item, ...keys) {
  if (!item || typeof item !== "object") return "";
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null && item[key] !== "") return item[key];
  }
  // Case-insensitive fallback (ADO.NET / Dapper dictionary keys vary)
  const entries = Object.entries(item);
  for (const key of keys) {
    const found = entries.find(([k]) => k.toLowerCase() === String(key).toLowerCase());
    if (found && found[1] !== undefined && found[1] !== null && found[1] !== "") return found[1];
  }
  return "";
}

function idOnlyOptions(arr, fieldName) {
  const camel = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
  return (Array.isArray(arr) ? arr : [])
    .map((item) => {
      const id = getItemField(item, fieldName, camel, fieldName.toLowerCase());
      return id ? { value: String(id), label: String(id) } : null;
    })
    .filter(Boolean);
}

function basicDataToOptions(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((item) => {
      const id = getItemField(item, "ID", "id", "Id", "Name", "name");
      return id ? { value: String(id), label: String(id) } : null;
    })
    .filter(Boolean);
}

function filterBasicByType(arr, typeFilter) {
  return (Array.isArray(arr) ? arr : []).filter((item) => {
    const type = String(getItemField(item, "Type", "type") || "").toUpperCase();
    return type === String(typeFilter).toUpperCase();
  });
}

const fmtNum = (value, decimals = 2) => {
  const n = Number(value);
  if (Number.isNaN(n)) return (0).toFixed(decimals);
  return n.toFixed(decimals);
};

const getJewelleryRow = (item) => item?.jewellery ?? item?.Jewellery ?? item;

/** MVC jewellery-stock-search.js: use ImagePath only (no Asset/Page fallbacks). */
const getJewelleryImagePath = (jewellery) =>
  jewellery?.imagePath ?? jewellery?.ImagePath ?? "";

/** MVC jewellery-stock-search.js: use VideoPath only. */
const getJewelleryVideoPath = (jewellery) =>
  jewellery?.videoPath ?? jewellery?.VideoPath ?? "";

/** Resolve report thumb src: Google Drive CDN/proxy first, else local/static paths. */
async function collectReportImageCandidates(rawPath) {
  const primary = String(rawPath || "").trim();
  if (!primary) return [];
  if (looksLikeDriveMedia(primary)) {
    const drive = await collectDriveImageCandidates(primary);
    if (drive.length) return drive;
  }
  return collectJewMediaCandidates(getPrimaryPathForLocal(primary));
}

function getPrimaryPathForLocal(rawPath) {
  const parts = parseMediaPaths(rawPath);
  return parts.length ? parts[0] : String(rawPath || "").trim();
}

/** MVC BuildGoogleDriveImageHtml → clickable thumb; multi-path via data-images gallery. */
const MediaImage = ({ jewellery, onOpenGallery }) => {
  const rawPath = getJewelleryImagePath(jewellery);
  const [candidates, setCandidates] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIdx(0);
    setCandidates([]);
    (async () => {
      // DB stores names (Abc.png|Abc1.png); console logs full Drive share links
      if (rawPath) await resolveDriveShareLinksFromPaths(rawPath, "image");
      const urls = await collectReportImageCandidates(rawPath);
      if (!cancelled) setCandidates(urls);
    })();
    return () => { cancelled = true; };
  }, [rawPath]);

  const openGallery = () => {
    const paths = parseMediaPaths(rawPath);
    if (!paths.length) {
      showGoogleDriveMediaWarning("image");
      return;
    }
    onOpenGallery?.(paths);
  };

  if (!rawPath || !candidates.length || idx >= candidates.length) {
    return (
      <i
        className="ri-image-line text-muted gdrive-image-empty"
        style={{ fontSize: 24 }}
        title="No image"
      />
    );
  }

  return (
    <img
      src={candidates[idx]}
      alt=""
      className="jew-thumb-img gdrive-image-button"
      referrerPolicy="no-referrer"
      title="Open image"
      style={{ cursor: "pointer" }}
      onClick={openGallery}
      onError={() => setIdx((prev) => prev + 1)}
    />
  );
};

/** Video icon → open in-app player (local proxy), same pattern as Images gallery. */
const MediaVideo = ({ jewellery, onOpenVideo }) => {
  const rawPath = getJewelleryVideoPath(jewellery);
  const apiLinks = jewellery?.videoDriveLinks || jewellery?.VideoDriveLinks || [];

  useEffect(() => {
    if (!rawPath) return;
    resolveDriveShareLinksFromPaths(rawPath, "video");
  }, [rawPath]);

  if (!rawPath && !(Array.isArray(apiLinks) && apiLinks.length)) {
    return (
      <i
        className="ri-video-line text-muted video-button-empty"
        style={{ fontSize: 16, cursor: "pointer" }}
        title="No video"
        onClick={() => showGoogleDriveMediaWarning("video")}
      />
    );
  }

  return (
    <i
      className="ri-video-line jew-video-icon video-button"
      title="Play video"
      style={{ cursor: "pointer", color: "#000" }}
      onClick={() => onOpenVideo?.(jewellery)}
    />
  );
};

/**
 * Video popup — plays inside the form via Option B API HTTP stream.
 * Uses jew-drive-image URL directly (AllowAnonymous) — no Drive redirect.
 */
function JewDriveVideoModal({ isOpen, urls, toggle }) {
  const list = useMemo(
    () => (Array.isArray(urls) ? urls.filter(Boolean) : []).filter(Boolean),
    [urls]
  );
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setIndex(0);
  }, [isOpen, list]);

  const src = list[index] || "";
  const isDrivePreview = src.indexOf("drive.google.com") >= 0 && src.indexOf("/preview") >= 0;

  useEffect(() => {
    if (!isOpen || !src) {
      setLoading(false);
      return;
    }
    setLoading(true);
  }, [isOpen, src]);

  const multi = list.length > 1;

  const goPrev = () => {
    if (!list.length) return;
    setIndex((i) => (i <= 0 ? list.length - 1 : i - 1));
  };
  const goNext = () => {
    if (!list.length) return;
    setIndex((i) => (i >= list.length - 1 ? 0 : i + 1));
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg" style={{ maxWidth: 860 }}>
      <ModalHeader toggle={toggle} className="py-2">Video</ModalHeader>
      <ModalBody className="text-center">
        <div className="d-flex align-items-center justify-content-center mb-2" style={{ gap: 8 }}>
          {multi && (
            <Button type="button" color="primary" outline size="sm" title="Previous" onClick={goPrev}>
              ‹
            </Button>
          )}
          {src ? (
            <div style={{ position: "relative", width: "100%", maxWidth: 720 }}>
              {loading && (
                <div className="text-muted p-4" style={{ position: "absolute", inset: 0, zIndex: 1 }}>
                  Loading video…
                </div>
              )}
              {isDrivePreview ? (
                <iframe
                  key={src}
                  title="Google Drive Video"
                  src={src}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  onLoad={() => setLoading(false)}
                  style={{
                    width: "100%",
                    maxWidth: 720,
                    height: "65vh",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    background: "#000",
                  }}
                />
              ) : (
                <video
                  key={src}
                  src={src}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  onCanPlay={() => setLoading(false)}
                  onError={() => setLoading(false)}
                  style={{
                    width: "100%",
                    maxWidth: 720,
                    height: "65vh",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    background: "#000",
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ) : (
            <div className="text-muted p-4">No video</div>
          )}
          {multi && (
            <Button type="button" color="primary" outline size="sm" title="Next" onClick={goNext}>
              ›
            </Button>
          )}
        </div>
        {list.length > 0 && (
          <div className="text-muted small mt-1">
            {index + 1} / {list.length}
          </div>
        )}
      </ModalBody>
      <ModalFooter className="py-2">
        <Button color="secondary" size="sm" onClick={toggle}>Close</Button>
      </ModalFooter>
    </Modal>
  );
}

/** MVC #jewDriveImageGalleryModal — Images gallery with thumbs / prev / next / counter. */
function DriveGalleryThumb({ path, active, onClick }) {
  const [src, setSrc] = useState("");
  const [idx, setIdx] = useState(0);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setIdx(0);
    (async () => {
      const urls = await collectReportImageCandidates(path);
      if (!cancelled) setCandidates(urls);
    })();
    return () => { cancelled = true; };
  }, [path]);

  useEffect(() => {
    setSrc(candidates[idx] || "");
  }, [candidates, idx]);

  return (
    <img
      src={src || undefined}
      alt=""
      referrerPolicy="no-referrer"
      onClick={onClick}
      onError={() => setIdx((prev) => prev + 1)}
      style={{
        width: 56,
        height: 52,
        objectFit: "contain",
        border: active ? "1.5px solid #5A8DEE" : "1.5px solid #dde3ee",
        boxShadow: active ? "0 0 0 1px rgba(90,141,238,0.35)" : "none",
        borderRadius: 5,
        cursor: "pointer",
        background: "#fff",
        flex: "0 0 56px",
      }}
    />
  );
}

function JewDriveImageGalleryModal({ isOpen, paths, toggle }) {
  const list = useMemo(() => (Array.isArray(paths) ? paths.filter(Boolean) : []), [paths]);
  const [index, setIndex] = useState(0);
  const [mainCandidates, setMainCandidates] = useState([]);
  const [mainIdx, setMainIdx] = useState(0);

  useEffect(() => {
    if (isOpen) setIndex(0);
  }, [isOpen, list]);

  useEffect(() => {
    let cancelled = false;
    setMainIdx(0);
    setMainCandidates([]);
    const path = list[index];
    if (!path) return undefined;
    (async () => {
      const urls = await collectReportImageCandidates(path);
      if (!cancelled) setMainCandidates(urls);
    })();
    return () => { cancelled = true; };
  }, [list, index]);

  const multi = list.length > 1;
  const mainSrc = mainCandidates[mainIdx] || "";

  const goPrev = () => {
    if (!list.length) return;
    setIndex((i) => (i <= 0 ? list.length - 1 : i - 1));
  };
  const goNext = () => {
    if (!list.length) return;
    setIndex((i) => (i >= list.length - 1 ? 0 : i + 1));
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg" style={{ maxWidth: 860 }}>
      <ModalHeader toggle={toggle} className="py-2">Images</ModalHeader>
      <ModalBody className="text-center">
        <div className="d-flex align-items-center justify-content-center mb-2" style={{ gap: 8 }}>
          {multi && (
            <Button type="button" color="primary" outline size="sm" title="Previous" onClick={goPrev}>
              ‹
            </Button>
          )}
          {mainSrc ? (
            <img
              key={`${index}-${mainSrc}`}
              src={mainSrc}
              alt="Image"
              referrerPolicy="no-referrer"
              onError={() => setMainIdx((prev) => prev + 1)}
              style={{
                maxWidth: "100%",
                maxHeight: "65vh",
                objectFit: "contain",
                border: "1px solid #ddd",
                borderRadius: 4,
                background: "#fff",
              }}
            />
          ) : (
            <div className="text-muted p-4">No image</div>
          )}
          {multi && (
            <Button type="button" color="primary" outline size="sm" title="Next" onClick={goNext}>
              ›
            </Button>
          )}
        </div>
        {multi && (
          <div
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              justifyContent: "center",
              padding: "4px 0",
            }}
          >
            {list.map((p, i) => (
              <DriveGalleryThumb
                key={`gthumb-${i}-${p}`}
                path={p}
                active={i === index}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        )}
        {list.length > 0 && (
          <div className="text-muted small mt-1">
            {index + 1} / {list.length}
          </div>
        )}
      </ModalBody>
      <ModalFooter className="py-2">
        <Button color="secondary" size="sm" onClick={toggle}>Close</Button>
      </ModalFooter>
    </Modal>
  );
}

const ReportCompanyHeader = ({ companyInfo }) => (
  <div id="jew-company-info" className="jew-report-header">
    <div className="jew-report-header-inner">
      <div className="jew-company-block">
        <div className="jew-logo-wrap">
          {companyInfo?.companyLogo ? (
            <img src={resolveCompanyLogoUrl(companyInfo.companyLogo)} alt="Company Logo" className="jew-company-logo" />
          ) : (
            <div className="jew-logo-placeholder">Company Logo</div>
          )}
        </div>
        <div className="jew-company-text">
          <div className="jew-company-name">{companyInfo?.companyName || ""}</div>
          {companyInfo?.companyAddress ? <div>{companyInfo.companyAddress}</div> : null}
          {companyInfo?.companyAddress1 ? <div>{companyInfo.companyAddress1}</div> : null}
          {companyInfo?.companyAddress2 ? <div>{companyInfo.companyAddress2}</div> : null}
          {companyInfo?.companyPhone ? <div><strong>Tel:</strong> {companyInfo.companyPhone}</div> : null}
          {companyInfo?.companyEmail ? <div><strong>Email:</strong> {companyInfo.companyEmail}</div> : null}
        </div>
      </div>
      <div className="jew-report-title">Jewellery Stock Report</div>
    </div>
  </div>
);

const JewelleryStockReportTable = ({ data, onStockClick, onStockCountChange }) => {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryPaths, setGalleryPaths] = useState([]);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrls, setVideoUrls] = useState([]);

  const openImageGallery = useCallback((paths) => {
    const list = Array.isArray(paths) ? paths.filter(Boolean) : parseMediaPaths(paths);
    if (!list.length) {
      showGoogleDriveMediaWarning("image");
      return;
    }
    setGalleryPaths(list);
    setGalleryOpen(true);
  }, []);

  const openVideoModal = useCallback((jewellery) => {
    // Collect candidates → Google Drive /preview (MVC fast path, Google CDN)
    const candidates = [];
    const apiLinks = jewellery?.videoDriveLinks || jewellery?.VideoDriveLinks;
    if (Array.isArray(apiLinks) && apiLinks.length) {
      apiLinks.filter(Boolean).forEach((u) => candidates.push(u));
    }
    const rawPath = getJewelleryVideoPath(jewellery);
    if (rawPath) {
      parseMediaPaths(rawPath).forEach((p) => {
        if (p && !candidates.includes(p)) candidates.push(p);
      });
    }
    if (!candidates.length) {
      showGoogleDriveMediaWarning("video");
      return;
    }

    const previews = [];
    const needAsync = [];
    candidates.forEach((c) => {
      const id = extractGoogleDriveFileId(c);
      if (id) {
        const embed = toGoogleDriveVideoPreviewEmbedUrl(id);
        if (embed && !previews.includes(embed)) previews.push(embed);
      } else {
        needAsync.push(c);
      }
    });

    setVideoUrls(previews);
    setVideoOpen(true);

    if (!needAsync.length) {
      if (!previews.length) showGoogleDriveMediaWarning("video");
      return;
    }

    (async () => {
      const ids = await Promise.all(needAsync.map((c) => resolveDriveVideoFileId(c)));
      const extra = [];
      ids.forEach((id) => {
        if (!id) return;
        const embed = toGoogleDriveVideoPreviewEmbedUrl(id);
        if (embed && !previews.includes(embed) && !extra.includes(embed)) extra.push(embed);
      });
      if (!extra.length && !previews.length) {
        showGoogleDriveMediaWarning("video");
        setVideoOpen(false);
        return;
      }
      if (extra.length) {
        setVideoUrls((prev) => {
          const merged = [...prev];
          extra.forEach((u) => {
            if (!merged.includes(u)) merged.push(u);
          });
          return merged;
        });
      }
    })();
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    (data || []).forEach((item) => {
      const jewellery = getJewelleryRow(item);
      const key = String(jewellery?.jewCode ?? jewellery?.JewCode ?? "unknown");
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [data]);

  const totals = useMemo(() => {
    const t = {
      grandAmount: 0, grandGrossWeight: 0, grandNetWeight: 0, grandGoldAmount: 0,
      grandDiaPcs: 0, grandDiaCarat: 0, grandDiaAmt: 0,
      grandStonePcs: 0, grandStoneCarat: 0, grandStoneAmt: 0,
      grandTotalMetal: 0, grandTotalDiamond: 0, grandTotalStone: 0,
      grandMakingCharges: 0, grandSettingCharges: 0, grandHandlingCharges: 0,
      grandCertCharges: 0, grandOtherCharges: 0, grandHallmarkCharges: 0, grandFinalAmt: 0
    };

    Object.values(grouped).forEach((groupRows) => {
      groupRows.forEach((row) => {
        const j = getJewelleryRow(row);
        const diamonds = row?.diamondDetails ?? row?.DiamondDetails ?? [];
        const stones = row?.stoneDetails ?? row?.StoneDetails ?? [];

        t.grandAmount += Number(j?.amount ?? j?.Amount ?? 0);
        t.grandGrossWeight += Number(j?.grossWeight ?? j?.GrossWeight ?? 0);
        t.grandNetWeight += Number(j?.netWeight ?? j?.NetWeight ?? 0);
        t.grandGoldAmount += Number(j?.totalMetalAmount ?? j?.TotalMetalAmount ?? 0);
        t.grandTotalMetal += Number(j?.totalMetalAmount ?? j?.TotalMetalAmount ?? 0);
        t.grandTotalDiamond += Number(j?.totalDiamondAmount ?? j?.TotalDiamondAmount ?? 0);
        t.grandTotalStone += Number(j?.totalStoneAmount ?? j?.TotalStoneAmount ?? 0);
        t.grandMakingCharges += Number(j?.totalMakingCharges ?? j?.TotalMakingCharges ?? 0);
        t.grandSettingCharges += Number(j?.totalSettingCharges ?? j?.TotalSettingCharges ?? 0);
        t.grandHandlingCharges += Number(j?.totalHandlingCharges ?? j?.TotalHandlingCharges ?? 0);
        t.grandCertCharges += Number(j?.totalCertificateCharges ?? j?.TotalCertificateCharges ?? 0);
        t.grandOtherCharges += Number(j?.otherCharges ?? j?.OtherCharges ?? 0);
        t.grandHallmarkCharges += Number(j?.hallmarkCharges ?? j?.HallmarkCharges ?? 0);
        t.grandFinalAmt += Number(j?.finalJAmount ?? j?.FinalJAmount ?? 0);

        diamonds.forEach((d) => {
          t.grandDiaPcs += Number(d?.diamondPcs ?? d?.DiamondPcs ?? 0);
          t.grandDiaCarat += Number(d?.diamondCarat ?? d?.DiamondCarat ?? 0);
          t.grandDiaAmt += Number(d?.diamondAmount ?? d?.DiamondAmount ?? 0);
        });
        stones.forEach((s) => {
          t.grandStonePcs += Number(s?.diamondPcs ?? s?.DiamondPcs ?? 0);
          t.grandStoneCarat += Number(s?.diamondCarat ?? s?.DiamondCarat ?? 0);
          t.grandStoneAmt += Number(s?.diamondAmount ?? s?.DiamondAmount ?? 0);
        });
      });
    });
    return t;
  }, [grouped]);

  const stockCount = useMemo(() => Object.values(grouped).reduce((n, g) => n + g.length, 0), [grouped]);

  // Notify parent so "Showing X to Y" can sit in the fixed footer (outside horizontal scroll)
  useEffect(() => {
    if (typeof onStockCountChange === "function") {
      onStockCountChange(stockCount);
    }
  }, [stockCount, onStockCountChange]);

  const renderRows = () => {
    const rows = [];

    Object.entries(grouped).forEach(([jewCode, groupRows]) => {
      const firstLot = getJewelleryRow(groupRows[0])?.lotNo ?? getJewelleryRow(groupRows[0])?.LotNo ?? "";
      rows.push(
        <tr key={`header-${jewCode}`} className="group-header">
          <td colSpan={TOTAL_COLS} data-stockid={firstLot}>
            JewCode: {jewCode}
          </td>
        </tr>
      );

      groupRows.forEach((item, groupIndex) => {
        const jewellery = getJewelleryRow(item);
        const diamonds = item?.diamondDetails ?? item?.DiamondDetails ?? [];
        const stones = item?.stoneDetails ?? item?.StoneDetails ?? [];
        const maxRows = Math.max(diamonds.length, stones.length, 1);
        const rowColor = STATUS_COLOR[jewellery?.curStatus ?? jewellery?.CurStatus] || "";
        const stockId = jewellery?.lotNo ?? jewellery?.LotNo ?? "";
        const jewId = jewellery?.jewCode ?? jewellery?.JewCode;

        let totalDiamondPcs = 0;
        let totalDiamondCarat = 0;
        let totalDiamondAmt = 0;
        let totalStonePcs = 0;
        let totalStoneCarat = 0;
        let totalStoneAmt = 0;

        for (let i = 0; i < maxRows; i += 1) {
          const dia = diamonds[i] || {};
          const stone = stones[i] || {};
          totalDiamondPcs += Number(dia?.diamondPcs ?? dia?.DiamondPcs ?? 0);
          totalDiamondCarat += Number(dia?.diamondCarat ?? dia?.DiamondCarat ?? 0);
          totalDiamondAmt += Number(dia?.diamondAmount ?? dia?.DiamondAmount ?? 0);
          totalStonePcs += Number(stone?.diamondPcs ?? stone?.DiamondPcs ?? 0);
          totalStoneCarat += Number(stone?.diamondCarat ?? stone?.DiamondCarat ?? 0);
          totalStoneAmt += Number(stone?.diamondAmount ?? stone?.DiamondAmount ?? 0);

          rows.push(
            <tr key={`${jewCode}-${groupIndex}-${i}`} style={rowColor ? { color: rowColor } : undefined}>
              {i === 0 && (
                <>
                  <td rowSpan={maxRows} className="col-image">
                    <MediaImage jewellery={jewellery} onOpenGallery={openImageGallery} />
                  </td>
                  <td rowSpan={maxRows} className="col-video">
                    <MediaVideo jewellery={jewellery} onOpenVideo={openVideoModal} />
                  </td>
                  <td rowSpan={maxRows} className="col-lab">{jewellery?.lab ?? jewellery?.LAB ?? ""}</td>
                  <td rowSpan={maxRows} className="col-certno">{jewellery?.cNo ?? jewellery?.CNo ?? ""}</td>
                  <td rowSpan={maxRows} className="col-category">{jewellery?.category ?? jewellery?.Category ?? ""}</td>
                  <td rowSpan={maxRows} className="col-subcategory">{jewellery?.subCategory ?? jewellery?.SubCategory ?? ""}</td>
                  <td rowSpan={maxRows} className="col-status">{jewellery?.curStatus ?? jewellery?.CurStatus ?? ""}</td>
                  <td
                    rowSpan={maxRows}
                    className="col-stockid lotno-cell"
                    style={{ cursor: "pointer", color: "#0d6efd", textDecoration: "underline" }}
                    onClick={() => onStockClick?.(jewId)}
                  >
                    {stockId}
                  </td>
                  <td rowSpan={maxRows} className="col-itemname">{jewellery?.itemName ?? jewellery?.ItemName ?? ""}</td>
                  <td rowSpan={maxRows} className="col-pcs text-end">{jewellery?.pcs ?? jewellery?.Pcs ?? 0}</td>
                  <td rowSpan={maxRows} className="col-rate text-end">{fmtNum(jewellery?.rate ?? jewellery?.Rate)}</td>
                  <td rowSpan={maxRows} className="col-amount text-end">{fmtNum(jewellery?.amount ?? jewellery?.Amount)}</td>
                  <td rowSpan={maxRows} className="col-metaltype">{jewellery?.metalType ?? jewellery?.MetalType ?? ""}</td>
                  <td rowSpan={maxRows} className="col-metalcolor">{jewellery?.jewColor ?? jewellery?.JewColor ?? ""}</td>
                  <td rowSpan={maxRows} className="col-metalpurity">{jewellery?.jewPurity ?? jewellery?.JewPurity ?? ""}</td>
                  <td rowSpan={maxRows} className="col-grossweight text-end">{fmtNum(jewellery?.grossWeight ?? jewellery?.GrossWeight, 3)}</td>
                  <td rowSpan={maxRows} className="col-netweight text-end">{fmtNum(jewellery?.netWeight ?? jewellery?.NetWeight, 3)}</td>
                  <td rowSpan={maxRows} className="col-goldrate text-end">{fmtNum(jewellery?.rate ?? jewellery?.Rate, 0)}</td>
                  <td rowSpan={maxRows} className="col-goldamount text-end">{fmtNum(jewellery?.totalMetalAmount ?? jewellery?.TotalMetalAmount, 3)}</td>
                </>
              )}
              <td className="col-dia-lotno">{dia?.diamondLotNo ?? dia?.DiamondLotNo ?? ""}</td>
              <td className="col-dia-lab">{dia?.diamondLab ?? dia?.DiamondLab ?? ""}</td>
              <td className="col-dia-shape">{dia?.diamondShape ?? dia?.DiamondShape ?? ""}</td>
              <td className="col-dia-color">{dia?.diamondColor ?? dia?.DiamondColor ?? ""}</td>
              <td className="col-dia-clarity">{dia?.diamondClarity ?? dia?.DiamondClarity ?? ""}</td>
              <td className="col-dia-pcs text-end">{fmtNum(dia?.diamondPcs ?? dia?.DiamondPcs, 0)}</td>
              <td className="col-dia-carat text-end">{fmtNum(dia?.diamondCarat ?? dia?.DiamondCarat, 3)}</td>
              <td className="col-dia-price text-end">{fmtNum(dia?.diamondPrice ?? dia?.DiamondPrice)}</td>
              <td className="col-dia-amount text-end">{fmtNum(dia?.diamondAmount ?? dia?.DiamondAmount)}</td>
              <td className="col-stone-lotno">{stone?.diamondLotNo ?? stone?.DiamondLotNo ?? ""}</td>
              <td className="col-stone-lab">{stone?.diamondLab ?? stone?.DiamondLab ?? ""}</td>
              <td className="col-stone-shape">{stone?.diamondShape ?? stone?.DiamondShape ?? ""}</td>
              <td className="col-stone-color">{stone?.diamondColor ?? stone?.DiamondColor ?? ""}</td>
              <td className="col-stone-clarity">{stone?.diamondClarity ?? stone?.DiamondClarity ?? ""}</td>
              <td className="col-stone-pcs text-end">{fmtNum(stone?.diamondPcs ?? stone?.DiamondPcs, 0)}</td>
              <td className="col-stone-carat text-end">{fmtNum(stone?.diamondCarat ?? stone?.DiamondCarat, 3)}</td>
              <td className="col-stone-price text-end">{fmtNum(stone?.diamondPrice ?? stone?.DiamondPrice)}</td>
              <td className="col-stone-amount text-end">{fmtNum(stone?.diamondAmount ?? stone?.DiamondAmount)}</td>
              {i === 0 && (
                <>
                  <td rowSpan={maxRows} className="col-totalmetal text-end">{fmtNum(jewellery?.totalMetalAmount ?? jewellery?.TotalMetalAmount)}</td>
                  <td rowSpan={maxRows} className="col-totaldiamond text-end">{fmtNum(jewellery?.totalDiamondAmount ?? jewellery?.TotalDiamondAmount)}</td>
                  <td rowSpan={maxRows} className="col-totalstone text-end">{fmtNum(jewellery?.totalStoneAmount ?? jewellery?.TotalStoneAmount)}</td>
                  <td rowSpan={maxRows} className="col-makingcharges text-end">{fmtNum(jewellery?.totalMakingCharges ?? jewellery?.TotalMakingCharges)}</td>
                  <td rowSpan={maxRows} className="col-settingcharges text-end">{fmtNum(jewellery?.totalSettingCharges ?? jewellery?.TotalSettingCharges)}</td>
                  <td rowSpan={maxRows} className="col-handlingcharges text-end">{fmtNum(jewellery?.totalHandlingCharges ?? jewellery?.TotalHandlingCharges)}</td>
                  <td rowSpan={maxRows} className="col-certcharges text-end">{fmtNum(jewellery?.totalCertificateCharges ?? jewellery?.TotalCertificateCharges)}</td>
                  <td rowSpan={maxRows} className="col-othercharges text-end">{fmtNum(jewellery?.otherCharges ?? jewellery?.OtherCharges)}</td>
                  <td rowSpan={maxRows} className="col-hallmarkcharges text-end">{fmtNum(jewellery?.hallmarkCharges ?? jewellery?.HallmarkCharges)}</td>
                  <td rowSpan={maxRows} className="col-finalamount text-end">{fmtNum(jewellery?.finalJAmount ?? jewellery?.FinalJAmount)}</td>
                </>
              )}
            </tr>
          );
        }

        rows.push(
          <tr key={`subtotal-${jewCode}-${groupIndex}`} className="subtotal">
            <td className="col-image" /><td className="col-video" /><td className="col-lab" /><td className="col-certno" />
            <td className="col-category" /><td className="col-subcategory" /><td className="col-status" /><td className="col-stockid" />
            <td className="col-itemname" />
            <td className="col-pcs text-end fw-bold">Subtotal:</td>
            <td className="col-rate" /><td className="col-amount" />
            <td className="col-metaltype" /><td className="col-metalcolor" /><td className="col-metalpurity" />
            <td className="col-grossweight text-end fw-bold">{fmtNum(jewellery?.grossWeight ?? jewellery?.GrossWeight, 3)}</td>
            <td className="col-netweight text-end fw-bold">{fmtNum(jewellery?.netWeight ?? jewellery?.NetWeight, 3)}</td>
            <td className="col-goldrate" />
            <td className="col-goldamount text-end fw-bold">{fmtNum(jewellery?.totalMetalAmount ?? jewellery?.TotalMetalAmount, 3)}</td>
            <td className="col-dia-lotno" /><td className="col-dia-lab" /><td className="col-dia-shape" /><td className="col-dia-color" /><td className="col-dia-clarity" />
            <td className="col-dia-pcs text-end fw-bold">{fmtNum(totalDiamondPcs, 0)}</td>
            <td className="col-dia-carat text-end fw-bold">{fmtNum(totalDiamondCarat, 3)}</td>
            <td className="col-dia-price" />
            <td className="col-dia-amount text-end fw-bold">{fmtNum(totalDiamondAmt)}</td>
            <td className="col-stone-lotno" /><td className="col-stone-lab" /><td className="col-stone-shape" /><td className="col-stone-color" /><td className="col-stone-clarity" />
            <td className="col-stone-pcs text-end fw-bold">{fmtNum(totalStonePcs, 0)}</td>
            <td className="col-stone-carat text-end fw-bold">{fmtNum(totalStoneCarat, 3)}</td>
            <td className="col-stone-price" />
            <td className="col-stone-amount text-end fw-bold">{fmtNum(totalStoneAmt)}</td>
            <td className="col-totalmetal" /><td className="col-totaldiamond" /><td className="col-totalstone" />
            <td className="col-makingcharges" /><td className="col-settingcharges" /><td className="col-handlingcharges" />
            <td className="col-certcharges" /><td className="col-othercharges" /><td className="col-hallmarkcharges" /><td className="col-finalamount" />
          </tr>
        );
      });
    });

    rows.push(
      <tr key="grand-total" className="grand-total">
        <td className="col-image" /><td className="col-video" /><td className="col-lab" /><td className="col-certno" />
        <td className="col-category" /><td className="col-subcategory" /><td className="col-status" /><td className="col-stockid" />
        <td className="col-itemname" />
        <td className="col-pcs text-end fw-bold">Grand Total:</td>
        <td className="col-rate" />
        <td className="col-amount text-end fw-bold">{fmtNum(totals.grandAmount)}</td>
        <td className="col-metaltype" /><td className="col-metalcolor" /><td className="col-metalpurity" />
        <td className="col-grossweight text-end fw-bold">{fmtNum(totals.grandGrossWeight, 3)}</td>
        <td className="col-netweight text-end fw-bold">{fmtNum(totals.grandNetWeight, 3)}</td>
        <td className="col-goldrate" />
        <td className="col-goldamount text-end fw-bold">{fmtNum(totals.grandGoldAmount, 3)}</td>
        <td className="col-dia-lotno" /><td className="col-dia-lab" /><td className="col-dia-shape" /><td className="col-dia-color" /><td className="col-dia-clarity" />
        <td className="col-dia-pcs text-end fw-bold">{fmtNum(totals.grandDiaPcs, 0)}</td>
        <td className="col-dia-carat text-end fw-bold">{fmtNum(totals.grandDiaCarat, 3)}</td>
        <td className="col-dia-price" />
        <td className="col-dia-amount text-end fw-bold">{fmtNum(totals.grandDiaAmt)}</td>
        <td className="col-stone-lotno" /><td className="col-stone-lab" /><td className="col-stone-shape" /><td className="col-stone-color" /><td className="col-stone-clarity" />
        <td className="col-stone-pcs text-end fw-bold">{fmtNum(totals.grandStonePcs, 0)}</td>
        <td className="col-stone-carat text-end fw-bold">{fmtNum(totals.grandStoneCarat, 3)}</td>
        <td className="col-stone-price" />
        <td className="col-stone-amount text-end fw-bold">{fmtNum(totals.grandStoneAmt)}</td>
        <td className="col-totalmetal text-end fw-bold">{fmtNum(totals.grandTotalMetal)}</td>
        <td className="col-totaldiamond text-end fw-bold">{fmtNum(totals.grandTotalDiamond)}</td>
        <td className="col-totalstone text-end fw-bold">{fmtNum(totals.grandTotalStone)}</td>
        <td className="col-makingcharges text-end fw-bold">{fmtNum(totals.grandMakingCharges)}</td>
        <td className="col-settingcharges text-end fw-bold">{fmtNum(totals.grandSettingCharges)}</td>
        <td className="col-handlingcharges text-end fw-bold">{fmtNum(totals.grandHandlingCharges)}</td>
        <td className="col-certcharges text-end fw-bold">{fmtNum(totals.grandCertCharges)}</td>
        <td className="col-othercharges text-end fw-bold">{fmtNum(totals.grandOtherCharges)}</td>
        <td className="col-hallmarkcharges text-end fw-bold">{fmtNum(totals.grandHallmarkCharges)}</td>
        <td className="col-finalamount text-end fw-bold">{fmtNum(totals.grandFinalAmt)}</td>
      </tr>
    );

    return rows;
  };

  return (
    <div className="jew-table-wrap">
      <table id="jewellery-stock-report-table" className="table table-bordered table-sm text-center align-middle mb-0 jew-stock-report-table">
        <thead>
          <tr>
            <th rowSpan={2} className="col-image">Image</th>
            <th rowSpan={2} className="col-video">Video</th>
            <th rowSpan={2} className="col-lab">Lab</th>
            <th rowSpan={2} className="col-certno">Certificate No</th>
            <th rowSpan={2} className="col-category">Category</th>
            <th rowSpan={2} className="col-subcategory">Sub Category</th>
            <th rowSpan={2} className="col-status">Status</th>
            <th rowSpan={2} className="col-stockid">StockId</th>
            <th rowSpan={2} className="col-itemname">ItemName</th>
            <th rowSpan={2} className="col-pcs">Pcs</th>
            <th rowSpan={2} className="col-rate">Rate</th>
            <th rowSpan={2} className="col-amount">Amount</th>
            <th colSpan={7} className="col-metal-group">Metal Details</th>
            <th colSpan={9} className="col-diamond-group">Diamond Details</th>
            <th colSpan={9} className="col-stone-group">Stone Details</th>
            <th rowSpan={2} className="col-totalmetal">TotalMetalAmount</th>
            <th rowSpan={2} className="col-totaldiamond">Total Diamond Amount</th>
            <th rowSpan={2} className="col-totalstone">Total Stone Amount</th>
            <th rowSpan={2} className="col-makingcharges">MakingCharges</th>
            <th rowSpan={2} className="col-settingcharges">Setting Charges</th>
            <th rowSpan={2} className="col-handlingcharges">Handling Charges</th>
            <th rowSpan={2} className="col-certcharges">Certificate Charges</th>
            <th rowSpan={2} className="col-othercharges">OtherCharges</th>
            <th rowSpan={2} className="col-hallmarkcharges">HallmarkCharges</th>
            <th rowSpan={2} className="col-finalamount">Final JewAmount</th>
          </tr>
          <tr>
            <th className="col-metaltype">MetalType</th>
            <th className="col-metalcolor">MetalColor</th>
            <th className="col-metalpurity">MetalPurity</th>
            <th className="col-grossweight">Gross Weight</th>
            <th className="col-netweight">Net Weight</th>
            <th className="col-goldrate">Gold Rate/Gram</th>
            <th className="col-goldamount">Gold Amount</th>
            <th className="col-dia-lotno">LotNo</th>
            <th className="col-dia-lab">LAB</th>
            <th className="col-dia-shape">Shape</th>
            <th className="col-dia-color">Color</th>
            <th className="col-dia-clarity">Clarity</th>
            <th className="col-dia-pcs">Pcs</th>
            <th className="col-dia-carat">Carat</th>
            <th className="col-dia-price">Price</th>
            <th className="col-dia-amount">Amount</th>
            <th className="col-stone-lotno">LotNo</th>
            <th className="col-stone-lab">LAB</th>
            <th className="col-stone-shape">Shape</th>
            <th className="col-stone-color">Color</th>
            <th className="col-stone-clarity">Clarity</th>
            <th className="col-stone-pcs">Pcs</th>
            <th className="col-stone-carat">Carat</th>
            <th className="col-stone-price">Price</th>
            <th className="col-stone-amount">Amount</th>
          </tr>
        </thead>
        <tbody>{renderRows()}</tbody>
      </table>
      <JewDriveImageGalleryModal
        isOpen={galleryOpen}
        paths={galleryPaths}
        toggle={() => setGalleryOpen(false)}
      />
      <JewDriveVideoModal
        isOpen={videoOpen}
        urls={videoUrls}
        toggle={() => setVideoOpen(false)}
      />
    </div>
  );
};

const CustomOption = (props) => (
  <components.Option {...props}>
    <div className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
      <input
        type="checkbox"
        className="form-check-input mt-0"
        checked={props.isSelected}
        onChange={() => null}
        style={{ cursor: "pointer" }}
      />
      <span style={{ fontSize: "13px" }}>{props.label}</span>
    </div>
  </components.Option>
);

const CustomMenuList = (props) => {
  const { selectProps } = props;
  const { onSelectAll, isAllSelected, t } = selectProps;

  return (
    <components.MenuList {...props}>
      <div
        className="px-3 py-2 border-bottom d-flex align-items-center gap-2 select-all-row"
        style={{
          cursor: "pointer",
          background: "var(--vz-tertiary-bg, #f8f9fa)",
          borderColor: "var(--vz-border-color, #dee2e6)",
        }}
        onClick={onSelectAll}
      >
        <input
          type="checkbox"
          className="form-check-input"
          checked={isAllSelected}
          onChange={() => null}
          style={{ cursor: "pointer" }}
        />
        <span
          className="fw-semibold text-uppercase"
          style={{ fontSize: "12px", color: "var(--vz-body-color, #495057)" }}
        >
          {t("SELECT ALL")}
        </span>
      </div>
      {props.children}
    </components.MenuList>
  );
};

const CustomValueContainer = ({ children, ...props }) => {
  const { selectProps } = props;
  const numSelected = selectProps.value ? selectProps.value.length : 0;
  const showSelectedText = numSelected > 0 && !selectProps.menuIsOpen;

  return (
    <components.ValueContainer {...props}>
      {showSelectedText && (
        <div
          className="position-absolute"
          style={{
            color: "var(--vz-body-color, #495057)",
            fontSize: "13px",
            left: "10px",
            pointerEvents: "none",
          }}
        >
          {numSelected} Selected
        </div>
      )}
      {children}
    </components.ValueContainer>
  );
};

const JewelleryStockSearchReport = () => {
  const { t } = useTranslation();
  const { toDate, getDates } = useSettingReportDates();
  const reportRef = useRef(null);
  const printLock = useRef(false);

  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [stockCount, setStockCount] = useState(0);
  const [companyInfo, setCompanyInfo] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({
    category: [],
    subCategory: [],
    metal: [],
    color: [],
    shape: [],
    size: [],
    diamondColor: [],
    clarity: [],
    stoneType: []
  });
  const [purityOptions, setPurityOptions] = useState([]);
  const [lotNoOptions, setLotNoOptions] = useState([]);
  const [loadingLots, setLoadingLots] = useState(false);
  const [lotSearchValue, setLotSearchValue] = useState("");
  const [stockIdOptions, setStockIdOptions] = useState([]);
  const [loadingStockIds, setLoadingStockIds] = useState(false);
  const [stockSearchValue, setStockSearchValue] = useState("");
  const [printType, setPrintType] = useState("JewelleryStockList Print");

  const [filters, setFilters] = useState({
    date: toDate,
    show: "Unsold",
    holdUnHold: "Unhold",
    status: "All",
    jewCategory: "",
    jewSubCategory: "",
    jewSize: "",
    jewCertificate: "",
    jewCertificateNo: "",
    jewMetalType: "",
    jewColor: "",
    jewPurity: "",
    jewLotNo: "",
    diamondType: "",
    diamondShape: [],
    diamondSize: [],
    diamondColor: [],
    diamondClarity: [],
    filters: "LotNo",
    stockId: ""
  });

  useEffect(() => {
    setFilters((prev) => ({ ...prev, date: toDate }));
  }, [toDate]);

  useEffect(() => {
    const init = async () => {
      setLoadingDropdowns(true);
      try {
        const [mountingRes, reportDdRes, company] = await Promise.all([
          getAddMountingStockData(),
          getJewelleryStockSearchDropdowns(),
          getReportCompanySettings()
        ]);
        setCompanyInfo(company);

        const mounting = unwrapApiResponse(mountingRes);
        const reportDd = unwrapApiResponse(reportDdRes);
        const mData = mounting.data || {};
        const rData = reportDd.data || {};

        const masterList = rData.masterDropdowns ?? rData.MasterDropdowns ?? [];
        const itemMaster = rData.itemMasterDropdowns ?? rData.ItemMasterDropdowns ?? [];

        // Prefer mounting-stock master lists (same as JewStockMaster — proven working)
        const category = idOnlyOptions(mData.JewCategories ?? mData.jewCategories, "CategoryID");
        const subCategory = idOnlyOptions(mData.JewSubCategories ?? mData.jewSubCategories, "SubCategoryID");
        const metal = idOnlyOptions(mData.JewMetalType ?? mData.jewMetalType, "MetalID");
        const color = idOnlyOptions(mData.JewColor ?? mData.jewColor, "JewColorID");

        // Fallback: report dropdown endpoint (typed as object from ADO.NET)
        const fallbackCategory = idOnlyOptions(rData.categoryList ?? rData.CategoryList, "CategoryID");
        const fallbackSub = idOnlyOptions(rData.subCategoryList ?? rData.SubCategoryList, "SubCategoryID");
        const fallbackMetal = idOnlyOptions(rData.metalTypeList ?? rData.MetalTypeList, "MetalID");
        const fallbackColor = idOnlyOptions(rData.jewColorList ?? rData.JewColorList, "JewColorID");

        const shapeFromMount = basicDataToOptions(mData.Shape ?? mData.shape);
        const sizeFromMount = basicDataToOptions(mData.Size ?? mData.size);
        const dColorFromMount = basicDataToOptions(mData.Color ?? mData.color);
        const clarityFromMount = basicDataToOptions(mData.Clarity ?? mData.clarity);

        setDropdownOptions({
          category: category.length ? category : fallbackCategory,
          subCategory: subCategory.length ? subCategory : fallbackSub,
          metal: metal.length ? metal : fallbackMetal,
          color: color.length ? color : fallbackColor,
          shape: shapeFromMount.length ? shapeFromMount : basicDataToOptions(filterBasicByType(masterList, "Shape")),
          size: sizeFromMount.length ? sizeFromMount : basicDataToOptions(filterBasicByType(masterList, "Size")),
          diamondColor: dColorFromMount.length ? dColorFromMount : basicDataToOptions(filterBasicByType(masterList, "Color")),
          clarity: clarityFromMount.length ? clarityFromMount : basicDataToOptions(filterBasicByType(masterList, "Clarity")),
          stoneType: basicDataToOptions(filterBasicByType(itemMaster, "Category"))
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dropdown data.");
      } finally {
        setLoadingDropdowns(false);
      }
    };
    init();
  }, []);

  const loadLotOptions = useCallback(async (searchText = "") => {
    setLoadingLots(true);
    try {
      const res = await getAllLotNoList(searchText || "", "");
      const list = Array.isArray(res) ? res : res?.data ?? res?.Data ?? [];
      setLotNoOptions(
        (Array.isArray(list) ? list : [])
          .map((item) => {
            const value = String(item?.id ?? item?.ID ?? item?.name ?? item?.Name ?? "").trim();
            const label = String(item?.text ?? item?.TextName ?? item?.textName ?? value).trim();
            return value ? { value, label: label || value } : null;
          })
          .filter(Boolean)
      );
    } catch {
      setLotNoOptions([]);
    } finally {
      setLoadingLots(false);
    }
  }, []);

  const loadStockIdOptions = useCallback(async (searchText = "") => {
    setLoadingStockIds(true);
    try {
      const res = await getJewelleryStockIds(searchText || "");
      const list = Array.isArray(res) ? res : res?.data ?? res?.Data ?? [];
      setStockIdOptions(
        (Array.isArray(list) ? list : [])
          .map((item) => {
            const val = String(getItemField(item, "Name", "name", "ID", "id") || "").trim();
            const label = String(
              getItemField(item, "TextName", "textName", "Name", "name", "ID", "id") || val
            ).trim().toUpperCase();
            return val ? { value: val, label: label || val.toUpperCase() } : null;
          })
          .filter(Boolean)
      );
    } catch {
      setStockIdOptions([]);
    } finally {
      setLoadingStockIds(false);
    }
  }, []);

  const debouncedLoadLotOptions = useMemo(() => debounce(loadLotOptions, 300), [loadLotOptions]);
  const debouncedLoadStockIdOptions = useMemo(() => debounce(loadStockIdOptions, 300), [loadStockIdOptions]);

  useEffect(() => {
    loadLotOptions("");
    loadStockIdOptions("");
  }, [loadLotOptions, loadStockIdOptions]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleNativeSelect = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleMetalChange = async (value) => {
    setFilters((prev) => ({ ...prev, jewMetalType: value, jewPurity: "" }));
    if (!value) {
      setPurityOptions([]);
      return;
    }
    try {
      const response = await getJewPurity(value);
      const { success, data } = unwrapApiResponse(response);
      const list = success ? data : (data || response);
      setPurityOptions(idOnlyOptions(Array.isArray(list) ? list : [], "MetalPurityID"));
    } catch {
      setPurityOptions([]);
    }
  };

  const handleMultiSelectChange = (name, selected) => {
    setFilters((prev) => ({
      ...prev,
      [name]: selected ? selected.map((o) => o.value) : []
    }));
  };

  const selectedLotValues = useMemo(() => {
    return filters.jewLotNo
      ? filters.jewLotNo.split("\n").map((v) => v.trim()).filter(Boolean)
      : [];
  }, [filters.jewLotNo]);

  const lotSelectValue = useMemo(() => {
    return selectedLotValues.map((val) => {
      const match = lotNoOptions.find((o) => o.value === val);
      return match || { value: val, label: String(val).toUpperCase() };
    });
  }, [lotNoOptions, selectedLotValues]);

  const isAllLotSelected = useMemo(() => {
    if (lotNoOptions.length === 0) return false;
    return lotNoOptions.every((option) => selectedLotValues.includes(option.value));
  }, [lotNoOptions, selectedLotValues]);

  const handleSelectAllLots = () => {
    if (isAllLotSelected) {
      const currentOptionValues = lotNoOptions.map((o) => o.value);
      const updated = selectedLotValues.filter((v) => !currentOptionValues.includes(v));
      setFilters((prev) => ({ ...prev, jewLotNo: updated.join("\n") }));
    } else {
      const currentOptionValues = lotNoOptions.map((o) => o.value);
      const union = Array.from(new Set([...selectedLotValues, ...currentOptionValues]));
      setFilters((prev) => ({ ...prev, jewLotNo: union.join("\n") }));
    }
  };

  const handleLotDropdownChange = (selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    setFilters((prev) => ({ ...prev, jewLotNo: values.join("\n") }));
  };

  const selectedStockIds = useMemo(() => {
    return filters.stockId
      ? filters.stockId.split("\n").map((v) => v.trim()).filter(Boolean)
      : [];
  }, [filters.stockId]);

  const stockSelectValue = useMemo(() => {
    return selectedStockIds.map((val) => {
      const match = stockIdOptions.find((o) => o.value === val);
      return match || { value: val, label: String(val).toUpperCase() };
    });
  }, [stockIdOptions, selectedStockIds]);

  const isAllStockSelected = useMemo(() => {
    if (stockIdOptions.length === 0) return false;
    return stockIdOptions.every((option) => selectedStockIds.includes(option.value));
  }, [stockIdOptions, selectedStockIds]);

  const handleSelectAllStockIds = () => {
    if (isAllStockSelected) {
      const currentOptionValues = stockIdOptions.map((o) => o.value);
      const updated = selectedStockIds.filter((v) => !currentOptionValues.includes(v));
      setFilters((prev) => ({ ...prev, stockId: updated.join("\n") }));
    } else {
      const currentOptionValues = stockIdOptions.map((o) => o.value);
      const union = Array.from(new Set([...selectedStockIds, ...currentOptionValues]));
      setFilters((prev) => ({ ...prev, stockId: union.join("\n") }));
    }
  };

  const handleStockIdDropdownChange = (selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    setFilters((prev) => ({ ...prev, stockId: values.join("\n") }));
  };

  const buildPayload = () => ({
    Date: filters.date,
    Show: filters.show,
    HoldUnHold: filters.holdUnHold,
    Status: filters.status,
    JewDesign: null,
    JewCategory: filters.jewCategory || null,
    JewSubCategory: filters.jewSubCategory || null,
    JewSize: filters.jewSize ? Number(filters.jewSize) : 0,
    JewCertificate: filters.jewCertificate || null,
    JewCertificateNo: filters.jewCertificateNo || null,
    JewMetalType: filters.jewMetalType || null,
    JewColor: filters.jewColor || null,
    JewPurity: filters.jewPurity || null,
    JewLotNo: filters.jewLotNo || null,
    DiamondType: filters.diamondType || null,
    DiamondShape: filters.diamondShape,
    DiamondSize: filters.diamondSize,
    DiamondColor: filters.diamondColor,
    DiamondClarity: filters.diamondClarity,
    Filters: filters.filters,
    StockId: filters.stockId || null
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await getJewelleryStockSearchReport(buildPayload());
      const { success, data, message } = unwrapApiResponse(res);
      if (success) {
        const rows = Array.isArray(data) ? data : [];
        setReportData(rows);
        setStockCount(rows.length);
        setShowReport(true);
        if (!companyInfo?.companyName) setCompanyInfo(await getReportCompanySettings());
        toast.success(`Loaded ${rows.length} record(s).`);
      } else {
        toast.error(message || "Search failed.");
      }
    } catch (err) {
      toast.error(err?.message || "Error loading report.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    const d = await getDates();
    setFilters({
      date: d.toDate,
      show: "Unsold",
      holdUnHold: "Unhold",
      status: "All",
      jewCategory: "",
      jewSubCategory: "",
      jewSize: "",
      jewCertificate: "",
      jewCertificateNo: "",
      jewMetalType: "",
      jewColor: "",
      jewPurity: "",
      jewLotNo: "",
      diamondType: "",
      diamondShape: [],
      diamondSize: [],
      diamondColor: [],
      diamondClarity: [],
      filters: "LotNo",
      stockId: ""
    });
    setPurityOptions([]);
    setLotSearchValue("");
    setStockSearchValue("");
    loadLotOptions("");
    loadStockIdOptions("");
    setReportData([]);
    setStockCount(0);
    setShowReport(false);
    toast.success("Filters cleared.");
  };

  const handlePrint = () => {
    if (printLock.current) return;
    printLock.current = true;

    const source = reportRef.current;
    if (!source) {
      toast.warning("No data to print");
      printLock.current = false;
      return;
    }

    const clone = source.cloneNode(true);
    
    let hideCols = [];
    let groupColspan = 21;
    let diaColspan = 8;
    let stoneColspan = 0;
    
    if (printType === "BarcodePrint") {
      hideCols = [
        "col-image", "col-video", "col-lab", "col-certno", "col-category", "col-subcategory", "col-status", "col-itemname",
        "col-pcs", "col-rate", "col-amount", "col-metaltype", "col-metalcolor", "col-goldrate", "col-goldamount",
        "col-dia-lotno", "col-dia-lab", "col-dia-shape", "col-dia-color", "col-dia-clarity", "col-dia-price", "col-dia-amount",
        "col-stone-group", "col-stone-lotno", "col-stone-lab", "col-stone-shape", "col-stone-color", "col-stone-clarity",
        "col-stone-pcs", "col-stone-carat", "col-stone-price", "col-stone-amount", "col-totalmetal", "col-totaldiamond",
        "col-totalstone", "col-makingcharges", "col-settingcharges", "col-handlingcharges", "col-certcharges",
        "col-othercharges", "col-hallmarkcharges", "col-finalamount"
      ];
      groupColspan = 6;
      diaColspan = 0;
      stoneColspan = 0;
    } else if (printType === "JewelleryStockList Print") {
      hideCols = ["col-totalmetal", "col-totaldiamond", "col-totalstone"];
      groupColspan = 44;
      diaColspan = 9;
      stoneColspan = 9;
    } else {
      // JewelleryRequiredColumnPrint (Default behavior matching MVC)
      hideCols = [
        "col-video", "col-lab", "col-certno", "col-subcategory",
        "col-pcs", "col-rate", "col-amount", "col-dia-lab",
        "col-stone-group", "col-stone-lotno", "col-stone-lab", "col-stone-shape",
        "col-stone-color", "col-stone-clarity", "col-stone-pcs", "col-stone-carat",
        "col-stone-price", "col-stone-amount",
        "col-totalmetal", "col-totaldiamond", "col-totalstone",
        "col-settingcharges", "col-handlingcharges", "col-certcharges",
        "col-othercharges", "col-hallmarkcharges"
      ];
      groupColspan = 21;
      diaColspan = 8;
      stoneColspan = 0;
    }

    clone.querySelectorAll(".group-header td").forEach((td) => {
      td.setAttribute("colspan", String(groupColspan));
      const stockId = td.getAttribute("data-stockid");
      if (stockId) td.textContent = `Stock ID: ${stockId}`;
    });
    
    const diamondGroup = clone.querySelector(".col-diamond-group");
    if (diamondGroup) {
      if (diaColspan > 0) {
        diamondGroup.setAttribute("colspan", String(diaColspan));
      } else {
        diamondGroup.style.display = "none";
      }
    }
    const stoneGroup = clone.querySelector(".col-stone-group");
    if (stoneGroup) {
      if (stoneColspan > 0) {
        stoneGroup.setAttribute("colspan", String(stoneColspan));
      } else {
        stoneGroup.style.display = "none";
      }
    }
    const metalGroup = clone.querySelector(".col-metal-group");
    if (metalGroup && printType === "BarcodePrint") {
      metalGroup.style.display = "none";
    }

    const hideCss = hideCols.map((c) => `.${c}`).join(", ");
    const printWindow = window.open("", "", "height=1000,width=1200");
    if (!printWindow) {
      toast.error("Popup blocked. Allow popups to print.");
      printLock.current = false;
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Jewellery-Stock-Report-Print</title>
<style>
@media print {
  @page { size: A3 landscape; margin: 3mm; }
  body { width: 100% !important; margin: 0 !important; padding: 0 !important; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #000; zoom: 0.85; }
  
  /* Outer Container Resets for Print */
  .jew-report-shell {
    border: none !important;
    background: transparent !important;
    max-height: none !important;
    min-height: 0 !important;
    overflow: visible !important;
    display: block !important;
    box-shadow: none !important;
  }
  .jew-report-scroll {
    overflow: visible !important;
    background: transparent !important;
    display: block !important;
  }
  .jew-table-wrap, .table-responsive {
    overflow: visible !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
  }
  
  table { width: 99.5% !important; border-collapse: collapse !important; table-layout: auto !important; margin-top: 10px; border: 1px solid #444 !important; }
  th, td { border: 1px solid #444 !important; padding: 1px 2px !important; text-align: center; vertical-align: middle; word-break: break-word; white-space: normal !important; font-size: 11px !important; }
  th:last-child, td:last-child { border-right: 1px solid #444 !important; }
  th { background: #f2f2f2 !important; -webkit-print-color-adjust: exact; font-weight: bold; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  
  /* Company Header Print Styles */
  .jew-report-header { border-bottom: 1px solid #ddd; padding-bottom: 12px; margin-bottom: 10px; position: relative; }
  .jew-report-header-inner { display: flex !important; justify-content: space-between !important; align-items: flex-start !important; width: 100% !important; }
  .jew-company-block { display: flex !important; gap: 14px !important; align-items: flex-start !important; }
  .jew-logo-wrap { flex-shrink: 0 !important; }
  .jew-company-logo { max-height: 90px !important; width: 96px !important; object-fit: contain !important; }
  .jew-company-text { font-size: 13px !important; line-height: 1.6 !important; text-align: left !important; color: #000 !important; }
  .jew-company-name { font-size: 15px !important; font-weight: bold !important; color: #000 !important; margin-bottom: 2px !important; }
  .jew-report-title { position: absolute !important; right: 10px !important; top: 20px !important; font-size: 26px !important; font-weight: bold !important; color: #000 !important; text-align: right !important; white-space: nowrap !important; }
  
  /* Table Row Print Styles */
  .group-header td { font-size: 10px !important; font-weight: 700 !important; text-align: left !important; background: #e0e0e0 !important; }
  .subtotal td { font-size: 11px !important; font-weight: bold !important; }
  .grand-total td { font-size: 12px !important; font-weight: bold !important; background: #d0d0d0 !important; }
  
  /* Product Image Size in Print */
  .col-image img, .jew-thumb-img {
    width: 85px !important;
    height: 75px !important;
    object-fit: cover !important;
    border: 1px solid #ccc !important;
  }
  
  ${hideCss} { display: none !important; }
}
body { padding: 10px; font-family: Arial; font-size: 12px; }

/* Outer Container Resets for Base styles */
.jew-report-shell {
  border: none !important;
  background: transparent !important;
  max-height: none !important;
  min-height: 0 !important;
  overflow: visible !important;
  display: block !important;
  box-shadow: none !important;
}
.jew-report-scroll {
  overflow: visible !important;
  background: transparent !important;
  display: block !important;
}
.jew-table-wrap, .table-responsive {
  overflow: visible !important;
  padding: 0 !important;
  margin: 0 !important;
  display: block !important;
}

table { width: 99.5%; border-collapse: collapse; margin-bottom: 10px; border: 1px solid #ccc; }
th, td { border: 1px solid #ccc; padding: 2px; text-align: center; font-size: 11px; }
th:last-child, td:last-child { border-right: 1px solid #ccc; }
.group-header td { background: #e0e0e0; font-weight: 700; text-align: left; font-size: 10px; }
.subtotal td { font-weight: bold; font-size: 11px; }
.grand-total td { background: #d0d0d0; font-weight: 800; font-size: 12px; }

/* Company Header Base Styles */
.jew-report-header { border-bottom: 1px solid #ddd; padding-bottom: 12px; margin-bottom: 10px; position: relative; }
.jew-report-header-inner { display: flex !important; justify-content: space-between !important; align-items: flex-start !important; width: 100% !important; }
.jew-company-block { display: flex !important; gap: 14px !important; align-items: flex-start !important; }
.jew-logo-wrap { flex-shrink: 0 !important; }
.jew-company-logo { max-height: 90px !important; width: 96px !important; object-fit: contain !important; }
.jew-company-text { font-size: 13px !important; line-height: 1.6 !important; text-align: left !important; color: #000 !important; }
.jew-company-name { font-size: 15px !important; font-weight: bold !important; color: #000 !important; margin-bottom: 2px !important; }
.jew-report-title { position: absolute !important; right: 10px !important; top: 20px !important; font-size: 26px !important; font-weight: bold !important; color: #000 !important; text-align: right !important; white-space: nowrap !important; }

/* Product Image Size in Base Styles */
.col-image img, .jew-thumb-img {
  width: 85px !important;
  height: 75px !important;
  object-fit: cover !important;
  border: 1px solid #ccc !important;
}

${hideCss} { display: none; }
</style></head><body>`);
    printWindow.document.write(clone.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printLock.current = false;
    }, 800);
  };

  const getBase64FromUrl = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Failed to load image for Excel:", url, e);
      return null;
    }
  };

  const getExcelImageBase64 = async (j) => {
    // MVC Excel embeds ImagePath (Drive CDN / local). Prefer Drive candidates first.
    const candidates = await collectReportImageCandidates(getJewelleryImagePath(j));
    if (!candidates || !candidates.length) return null;
    for (const url of candidates) {
      if (!url || url.indexOf("/jew-drive-image") >= 0) continue; // skip auth proxy in Excel fetch
      const base64 = await getBase64FromUrl(url);
      if (base64) return base64;
    }
    return null;
  };

  const getExcelVideoUrl = async (j) => {
    const raw = String(getJewelleryVideoPath(j) || "").trim();
    if (!raw) return "";
    // Video /preview links (videoDriveLinks) — never image lh3 CDN
    const apiLinks = j?.videoDriveLinks || j?.VideoDriveLinks;
    if (Array.isArray(apiLinks) && apiLinks[0]) return apiLinks[0];
    const videoLink = toGoogleDriveVideoResponseLink(raw);
    if (videoLink) return videoLink;
    if (isGoogleDriveFileName(raw)) {
      const resolved = await checkGoogleDriveFileExists(raw, "video");
      if (resolved.ok && resolved.fileId) {
        return toGoogleDriveVideoResponseLink(resolved.fileId);
      }
      return "";
    }
    return resolveJewMediaUrl(raw) || raw;
  };

  const exportBarcodeExcel = async (combinedList) => {
    const ExcelJS = await loadExcelJS();
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Report");

    const thinBorder = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };

    const headers = ["GRWT", "NTWT", "GPURITY", "DCRT", "DPCS", "LOTNO"];
    const headerRow = ws.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, name: "Calibri", size: 10 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" }
      };
      cell.border = thinBorder;
    });

    for (const item of combinedList) {
      const j = item.Jewellery;
      const diaList = item.DiamondDetails || [];
      const rowDiaCrt = diaList.reduce((acc, d) => acc + Number(d?.diamondCarat ?? d?.DiamondCarat ?? 0), 0);
      const rowDiaPcs = diaList.reduce((acc, d) => acc + Number(d?.diamondPcs ?? d?.DiamondPcs ?? 0), 0);

      const r = ws.addRow([
        Number(j?.grossWeight ?? j?.GrossWeight ?? 0),
        Number(j?.netWeight ?? j?.NetWeight ?? 0),
        j?.jewPurity ?? j?.JewPurity ?? j?.purity ?? j?.Purity ?? "",
        Number(rowDiaCrt.toFixed(3)),
        rowDiaPcs,
        j?.lotNo ?? j?.LotNo ?? ""
      ]);

      r.getCell(1).numFmt = "0.000";
      r.getCell(2).numFmt = "0.000";
      r.getCell(4).numFmt = "0.000";
      
      r.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });
    }

    ws.columns.forEach((col) => {
      col.autoFit = true;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BarcodePrint.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportRequiredColumnExcel = async (combinedList) => {
    const ExcelJS = await loadExcelJS();
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("JewelleryRequiredReport");

    ws.views = [{ showGridLines: true }];
    ws.properties.defaultRowHeight = 18.75;

    let rowIdx = 1;
    const TOTAL_COLS = 23;

    ws.mergeCells(rowIdx, 1, rowIdx, TOTAL_COLS);
    const titleCell = ws.getCell(rowIdx, 1);
    titleCell.value = "Jewellery Stock Required Column Report";
    titleCell.font = { bold: true, name: "Calibri", size: 14 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(rowIdx).height = 25;

    rowIdx += 2;

    const header1 = [
      "Image", "Category", "Status", "StockId", "ItemName", "Pcs",
      "Metal Details", "", "", "", "", "", "",
      "Diamond Details", "", "", "", "", "", "", "",
      "MakingCharges", "FinalJewAmount"
    ];
    ws.getRow(rowIdx).values = header1;
    ws.getRow(rowIdx).height = 25;

    const header2 = [
      "", "", "", "", "", "",
      "MetalType", "MetalColor", "MetalPurity", "Gross Weight", "Net Weight", "Gold Rate/Gram", "Gold Amount",
      "LotNo", "Shape", "Color", "Clarity", "Pcs", "Carat", "Price/Carat", "Dia Amt",
      "", ""
    ];
    ws.getRow(rowIdx + 1).values = header2;
    ws.getRow(rowIdx + 1).height = 18.75;

    for (let i = 1; i <= 6; i++) ws.mergeCells(rowIdx, i, rowIdx + 1, i);
    ws.mergeCells(rowIdx, 7, rowIdx, 13);
    ws.mergeCells(rowIdx, 14, rowIdx, 21);
    ws.mergeCells(rowIdx, 22, rowIdx + 1, 22);
    ws.mergeCells(rowIdx, 23, rowIdx + 1, 23);

    const thinBorder = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };

    [rowIdx, rowIdx + 1].forEach((rNum) => {
      const r = ws.getRow(rNum);
      r.eachCell((cell) => {
        cell.font = { bold: true, name: "Calibri", size: 10 };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = thinBorder;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: rNum === rowIdx ? "FFD3D3D3" : "FFE6E6E6" }
        };
      });
    });

    rowIdx += 2;

    const grouped = {};
    combinedList.forEach(item => {
      const j = item.Jewellery;
      const key = String(j?.jewCode ?? j?.JewCode ?? "unknown");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    let grandGrossWt = 0, grandNetWt = 0, grandMetalAmount = 0;
    let grandDiaPcs = 0, grandDiaCrt = 0, grandDiaAmt = 0;
    let grandFinalAmt = 0;
    let grandMakingCharges = 0;

    for (const key in grouped) {
      const groupRows = grouped[key];
      let totalNetWt = 0, totalGrossWt = 0, totalMetalAmount = 0;
      let totalDiaPcs = 0, totalDiaCrt = 0, totalDiaAmt = 0;
      let totalFinalAmt = 0;
      let TotalMakingCharges = 0;

      for (const item of groupRows) {
        const j = item.Jewellery;
        const diaList = item.DiamondDetails || [];
        const maxRows = Math.max(diaList.length, 1);

        totalGrossWt += Number(j?.grossWeight ?? j?.GrossWeight ?? 0);
        totalNetWt += Number(j?.netWeight ?? j?.NetWeight ?? 0);
        totalMetalAmount += Number(j?.totalMetalAmount ?? j?.TotalMetalAmount ?? 0);
        TotalMakingCharges += Number(j?.totalMakingCharges ?? j?.TotalMakingCharges ?? j?.makingCharges ?? j?.MakingCharges ?? 0);
        totalFinalAmt += Number(j?.finalJAmount ?? j?.FinalJAmount ?? 0);

        diaList.forEach((d) => {
          totalDiaPcs += Number(d?.diamondPcs ?? d?.DiamondPcs ?? 0);
          totalDiaCrt += Number(d?.diamondCarat ?? d?.DiamondCarat ?? 0);
          totalDiaAmt += Number(d?.diamondAmount ?? d?.DiamondAmount ?? 0);
        });

        grandGrossWt += Number(j?.grossWeight ?? j?.GrossWeight ?? 0);
        grandNetWt += Number(j?.netWeight ?? j?.NetWeight ?? 0);
        grandMetalAmount += Number(j?.totalMetalAmount ?? j?.TotalMetalAmount ?? 0);
        grandMakingCharges += Number(j?.totalMakingCharges ?? j?.TotalMakingCharges ?? j?.makingCharges ?? j?.MakingCharges ?? 0);
        grandFinalAmt += Number(j?.finalJAmount ?? j?.FinalJAmount ?? 0);

        diaList.forEach((d) => {
          grandDiaPcs += Number(d?.diamondPcs ?? d?.DiamondPcs ?? 0);
          grandDiaCrt += Number(d?.diamondCarat ?? d?.DiamondCarat ?? 0);
          grandDiaAmt += Number(d?.diamondAmount ?? d?.DiamondAmount ?? 0);
        });

        for (let i = 0; i < maxRows; i++) {
          const dia = diaList[i];
          const rowData = [];

          if (i === 0) {
            rowData[1] = "";
            rowData[2] = j?.category ?? j?.Category ?? "";
            rowData[3] = j?.curStatus ?? j?.CurStatus ?? "";
            rowData[4] = j?.lotNo ?? j?.LotNo ?? "";
            rowData[5] = j?.itemName ?? j?.ItemName ?? "";
            rowData[6] = Number(j?.pcs ?? j?.Pcs ?? 0);
            rowData[7] = j?.metalType ?? j?.MetalType ?? "";
            rowData[8] = j?.jewColor ?? j?.JewColor ?? "";
            rowData[9] = j?.jewPurity ?? j?.JewPurity ?? "";
            rowData[10] = Number(j?.grossWeight ?? j?.GrossWeight ?? 0);
            rowData[11] = Number(j?.netWeight ?? j?.NetWeight ?? 0);
            rowData[12] = Number(j?.metalPriceGm ?? j?.MetalPriceGm ?? 0);
            rowData[13] = Number(j?.totalMetalAmount ?? j?.TotalMetalAmount ?? 0);
          } else {
            for (let c = 1; c <= 13; c++) rowData[c] = "";
          }

          rowData[14] = dia?.diamondLotNo ?? dia?.DiamondLotNo ?? "";
          rowData[15] = dia?.diamondShape ?? dia?.DiamondShape ?? "";
          rowData[16] = dia?.diamondColor ?? dia?.DiamondColor ?? "";
          rowData[17] = dia?.diamondClarity ?? dia?.DiamondClarity ?? "";
          rowData[18] = dia ? Number(dia?.diamondPcs ?? dia?.DiamondPcs ?? 0) : "";
          rowData[19] = dia ? Number(dia?.diamondCarat ?? dia?.DiamondCarat ?? 0) : "";
          rowData[20] = dia ? Number(dia?.diamondPrice ?? dia?.DiamondPrice ?? 0) : "";
          rowData[21] = dia ? Number(dia?.diamondAmount ?? dia?.DiamondAmount ?? 0) : "";

          if (i === 0) {
            rowData[22] = Number(j?.totalMakingCharges ?? j?.TotalMakingCharges ?? j?.makingCharges ?? j?.MakingCharges ?? 0);
            rowData[23] = Number(j?.finalJAmount ?? j?.FinalJAmount ?? 0);
          } else {
            rowData[22] = "";
            rowData[23] = "";
          }

          const excelRow = ws.addRow(rowData);
          excelRow.height = 18.75;

          excelRow.eachCell((cell) => {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
              top: { style: "hair" },
              left: { style: "hair" },
              bottom: { style: "hair" },
              right: { style: "hair" }
            };
          });

          if (i === 0) {
            excelRow.getCell(10).numFmt = "#,##0.000";
            excelRow.getCell(11).numFmt = "#,##0.000";
            excelRow.getCell(12).numFmt = "#,##0.00";
            excelRow.getCell(13).numFmt = "#,##0.00";
            excelRow.getCell(22).numFmt = "#,##0.00";
            excelRow.getCell(23).numFmt = "#,##0.00";
          }
          if (dia) {
            excelRow.getCell(19).numFmt = "#,##0.000";
            excelRow.getCell(20).numFmt = "#,##0.00";
            excelRow.getCell(21).numFmt = "#,##0.00";
          }

          if (i === 0) {
            const imgBase64 = await getExcelImageBase64(j);
            if (imgBase64) {
              try {
                const imageId = workbook.addImage({
                  base64: imgBase64,
                  extension: "jpeg"
                });
                ws.addImage(imageId, {
                  tl: { col: 0, row: rowIdx - 1 },
                  ext: { width: 56, height: 60 }
                });
                excelRow.height = 50;
              } catch (e) {
                console.error(e);
              }
            }
          }
          rowIdx++;
        }
      }

      rowIdx++;

      ws.mergeCells(rowIdx, 1, rowIdx, 9);
      ws.getCell(rowIdx, 1).value = "Subtotal:";
      
      ws.getCell(rowIdx, 10).value = totalGrossWt;
      ws.getCell(rowIdx, 10).numFmt = "#,##0.000";
      ws.getCell(rowIdx, 11).value = totalNetWt;
      ws.getCell(rowIdx, 11).numFmt = "#,##0.000";
      ws.getCell(rowIdx, 13).value = totalMetalAmount;
      ws.getCell(rowIdx, 13).numFmt = "#,##0.00";

      ws.getCell(rowIdx, 18).value = totalDiaPcs;
      ws.getCell(rowIdx, 19).value = totalDiaCrt;
      ws.getCell(rowIdx, 19).numFmt = "#,##0.000";
      ws.getCell(rowIdx, 21).value = totalDiaAmt;
      ws.getCell(rowIdx, 21).numFmt = "#,##0.00";

      ws.getCell(rowIdx, 22).value = TotalMakingCharges;
      ws.getCell(rowIdx, 22).numFmt = "#,##0.00";
      ws.getCell(rowIdx, 23).value = totalFinalAmt;
      ws.getCell(rowIdx, 23).numFmt = "#,##0.00";

      const subRow = ws.getRow(rowIdx);
      subRow.height = 18.75;
      subRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0F0F0" }
        };
        cell.border = {
          top: { style: "hair" },
          left: { style: "none" },
          bottom: { style: "none" },
          right: { style: "none" }
        };
      });

      rowIdx += 2;
    }

    ws.mergeCells(rowIdx, 1, rowIdx, 9);
    ws.getCell(rowIdx, 1).value = "Grand Total:";
    ws.getCell(rowIdx, 1).font = { bold: true, size: 12 };

    ws.getCell(rowIdx, 10).value = grandGrossWt;
    ws.getCell(rowIdx, 10).numFmt = "#,##0.000";
    ws.getCell(rowIdx, 10).font = { bold: true };
    ws.getCell(rowIdx, 11).value = grandNetWt;
    ws.getCell(rowIdx, 11).numFmt = "#,##0.000";
    ws.getCell(rowIdx, 11).font = { bold: true };
    ws.getCell(rowIdx, 13).value = grandMetalAmount;
    ws.getCell(rowIdx, 13).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 13).font = { bold: true };

    ws.getCell(rowIdx, 18).value = grandDiaPcs;
    ws.getCell(rowIdx, 18).font = { bold: true };
    ws.getCell(rowIdx, 19).value = grandDiaCrt;
    ws.getCell(rowIdx, 19).numFmt = "#,##0.000";
    ws.getCell(rowIdx, 19).font = { bold: true };
    ws.getCell(rowIdx, 21).value = grandDiaAmt;
    ws.getCell(rowIdx, 21).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 21).font = { bold: true };

    ws.getCell(rowIdx, 22).value = grandMakingCharges;
    ws.getCell(rowIdx, 22).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 22).font = { bold: true };
    ws.getCell(rowIdx, 23).value = grandFinalAmt;
    ws.getCell(rowIdx, 23).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 23).font = { bold: true };

    const grandRow = ws.getRow(rowIdx);
    grandRow.height = 22;
    grandRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD0D0D0" }
      };
    });

    ws.columns.forEach((column, i) => {
      if (i > 1) {
        column.autoFit = true;
        column.width = (column.width || 10) + 2;
      }
    });
    ws.getColumn(1).width = 10;
    ws.getColumn(2).width = 10;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `JewelleryRequiredReport.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportStockListExcel = async (combinedList) => {
    const ExcelJS = await loadExcelJS();
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("JewelleryStockReport");

    ws.views = [{ showGridLines: true }];
    ws.properties.defaultRowHeight = 18.75;

    let rowIdx = 1;
    const TOTAL_COLS = 44;

    ws.mergeCells(rowIdx, 1, rowIdx, TOTAL_COLS);
    const titleCell = ws.getCell(rowIdx, 1);
    titleCell.value = "Jewellery Stock Report";
    titleCell.font = { bold: true, name: "Calibri", size: 14 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" }
    };
    titleCell.font.color = { argb: "FFFFFFFF" };
    ws.getRow(rowIdx).height = 25;

    rowIdx += 2;

    const header1 = [
      "Image", "Video", "Lab", "CertificateNo", "Category", "Sub Category",
      "Status", "StockId", "ItemName", "Pcs", "Rate", "Amount",
      "Metal Details", "", "", "", "", "", "",
      "Diamond Details", "", "", "", "", "", "", "", "",
      "Stone Details", "", "", "", "", "", "", "", "",
      "MakingCharges", "SettingCharges", "HandlingCharges",
      "CertificateCharges", "OtherCharges", "HallmarkCharges", "FinalJewAmount"
    ];
    ws.getRow(rowIdx).values = header1;
    ws.getRow(rowIdx).height = 37;

    const header2 = [
      "", "", "", "", "", "", "", "", "", "", "", "",
      "MetalType", "MetalColor", "MetalPurity", "Gross Weight", "Net Weight", "Gold Rate/Gram", "Gold Amount",
      "LotNo", "LAB", "Shape", "Color", "Clarity", "Pcs", "Carat", "Price/Carat", "Dia. Amt",
      "LotNo", "LAB", "Shape", "Color", "Clarity", "Pcs", "Carat", "Price/Carat", "Stone Amt",
      "", "", "", "", "", "", ""
    ];
    ws.getRow(rowIdx + 1).values = header2;
    ws.getRow(rowIdx + 1).height = 18.75;

    for (let i = 1; i <= 12; i++) ws.mergeCells(rowIdx, i, rowIdx + 1, i);
    ws.mergeCells(rowIdx, 13, rowIdx, 19);
    ws.mergeCells(rowIdx, 20, rowIdx, 28);
    ws.mergeCells(rowIdx, 29, rowIdx, 37);
    for (let i = 38; i <= 44; i++) ws.mergeCells(rowIdx, i, rowIdx + 1, i);

    const thinBorder = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };

    [rowIdx, rowIdx + 1].forEach((rNum) => {
      const r = ws.getRow(rNum);
      r.eachCell((cell) => {
        cell.font = { bold: true, name: "Calibri", size: 10 };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = thinBorder;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: rNum === rowIdx ? "FFD3D3D3" : "FFE6E6E6" }
        };
      });
    });

    rowIdx += 2;

    const grouped = {};
    combinedList.forEach(item => {
      const j = item.Jewellery;
      const key = String(j?.jewCode ?? j?.JewCode ?? "unknown");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    let grandGrossWt = 0, grandNetWt = 0, grandMetalAmount = 0;
    let grandDiaPcs = 0, grandDiaCrt = 0, grandDiaAmt = 0;
    let grandStonePcs = 0, grandStoneCrt = 0, grandStoneAmt = 0;
    let grandFinalAmt = 0;
    let grandMakingCharges = 0, grandSettingCharges = 0, grandHandlingCharges = 0, grandCertCharges = 0, grandOtherCharges = 0, grandHallmarkCharges = 0;
    let grandJewPcs = 0, grandJewAmount = 0;

    for (const key in grouped) {
      const groupRows = grouped[key];
      let totalNetWt = 0, totalGrossWt = 0, totalMetalAmount = 0;
      let totalDiaPcs = 0, totalDiaCrt = 0, totalDiaAmt = 0;
      let totalStonePcs = 0, totalStoneCrt = 0, totalStoneAmt = 0;
      let totalFinalAmt = 0;
      let TotalMakingCharges = 0, TotalSettingCharges = 0, TotalHandlingCharges = 0, TotalCertificateCharges = 0, TotalOtherCharges = 0, TotalHallmarkCharges = 0;

      for (const item of groupRows) {
        const j = item.Jewellery;
        const diaList = item.DiamondDetails || [];
        const stoneList = item.StoneDetails || [];
        const maxRows = Math.max(diaList.length, stoneList.length, 1);

        totalGrossWt += Number(j?.grossWeight ?? j?.GrossWeight ?? 0);
        totalNetWt += Number(j?.netWeight ?? j?.NetWeight ?? 0);
        totalMetalAmount += Number(j?.totalMetalAmount ?? j?.TotalMetalAmount ?? 0);
        
        TotalMakingCharges += Number(j?.totalMakingCharges ?? j?.TotalMakingCharges ?? j?.makingCharges ?? j?.MakingCharges ?? 0);
        TotalSettingCharges += Number(j?.totalSettingCharges ?? j?.TotalSettingCharges ?? 0);
        TotalHandlingCharges += Number(j?.totalHandlingCharges ?? j?.TotalHandlingCharges ?? 0);
        TotalCertificateCharges += Number(j?.totalCertificateCharges ?? j?.TotalCertificateCharges ?? 0);
        TotalOtherCharges += Number(j?.otherCharges ?? j?.OtherCharges ?? 0);
        TotalHallmarkCharges += Number(j?.hallmarkCharges ?? j?.HallmarkCharges ?? 0);
        totalFinalAmt += Number(j?.finalJAmount ?? j?.FinalJAmount ?? 0);

        diaList.forEach((d) => {
          totalDiaPcs += Number(d?.diamondPcs ?? d?.DiamondPcs ?? 0);
          totalDiaCrt += Number(d?.diamondCarat ?? d?.DiamondCarat ?? 0);
          totalDiaAmt += Number(d?.diamondAmount ?? d?.DiamondAmount ?? 0);
        });
        stoneList.forEach((s) => {
          totalStonePcs += Number(s?.diamondPcs ?? s?.DiamondPcs ?? 0);
          totalStoneCrt += Number(s?.diamondCarat ?? s?.DiamondCarat ?? 0);
          totalStoneAmt += Number(s?.diamondAmount ?? s?.DiamondAmount ?? 0);
        });

        grandJewPcs += Number(j?.pcs ?? j?.Pcs ?? 0);
        grandJewAmount += Number(j?.amount ?? j?.Amount ?? 0);
        grandGrossWt += Number(j?.grossWeight ?? j?.GrossWeight ?? 0);
        grandNetWt += Number(j?.netWeight ?? j?.NetWeight ?? 0);
        grandMetalAmount += Number(j?.totalMetalAmount ?? j?.TotalMetalAmount ?? 0);
        
        grandMakingCharges += Number(j?.totalMakingCharges ?? j?.TotalMakingCharges ?? j?.makingCharges ?? j?.MakingCharges ?? 0);
        grandSettingCharges += Number(j?.totalSettingCharges ?? j?.TotalSettingCharges ?? 0);
        grandHandlingCharges += Number(j?.totalHandlingCharges ?? j?.TotalHandlingCharges ?? 0);
        grandCertCharges += Number(j?.totalCertificateCharges ?? j?.TotalCertificateCharges ?? 0);
        grandOtherCharges += Number(j?.otherCharges ?? j?.OtherCharges ?? 0);
        grandHallmarkCharges += Number(j?.hallmarkCharges ?? j?.HallmarkCharges ?? 0);
        grandFinalAmt += Number(j?.finalJAmount ?? j?.FinalJAmount ?? 0);

        diaList.forEach((d) => {
          grandDiaPcs += Number(d?.diamondPcs ?? d?.DiamondPcs ?? 0);
          grandDiaCrt += Number(d?.diamondCarat ?? d?.DiamondCarat ?? 0);
          grandDiaAmt += Number(d?.diamondAmount ?? d?.DiamondAmount ?? 0);
        });
        stoneList.forEach((s) => {
          grandStonePcs += Number(s?.diamondPcs ?? s?.DiamondPcs ?? 0);
          grandStoneCrt += Number(s?.diamondCarat ?? s?.DiamondCarat ?? 0);
          grandStoneAmt += Number(s?.diamondAmount ?? s?.DiamondAmount ?? 0);
        });

        for (let i = 0; i < maxRows; i++) {
          const dia = diaList[i];
          const stone = stoneList[i];
          const rowData = [];

          if (i === 0) {
            rowData[1] = "";
            // MVC: relative VideoPath → authority + path; absolute http(s) kept as-is
            rowData[2] = "";
            rowData[3] = j?.lab ?? j?.LAB ?? "";
            rowData[4] = j?.cNo ?? j?.CNo ?? "";
            rowData[5] = j?.category ?? j?.Category ?? "";
            rowData[6] = j?.subCategory ?? j?.SubCategory ?? "";
            rowData[7] = j?.curStatus ?? j?.CurStatus ?? "";
            rowData[8] = j?.lotNo ?? j?.LotNo ?? "";
            rowData[9] = j?.itemName ?? j?.ItemName ?? "";
            rowData[10] = Number(j?.pcs ?? j?.Pcs ?? 0);
            rowData[11] = Number(j?.rate ?? j?.Rate ?? 0);
            rowData[12] = Number(j?.amount ?? j?.Amount ?? 0);

            rowData[13] = j?.metalType ?? j?.MetalType ?? "";
            rowData[14] = j?.jewColor ?? j?.JewColor ?? "";
            rowData[15] = j?.jewPurity ?? j?.JewPurity ?? "";
            rowData[16] = Number(j?.grossWeight ?? j?.GrossWeight ?? 0);
            rowData[17] = Number(j?.netWeight ?? j?.NetWeight ?? 0);
            rowData[18] = Number(j?.metalPriceGm ?? j?.MetalPriceGm ?? 0);
            rowData[19] = Number(j?.totalMetalAmount ?? j?.TotalMetalAmount ?? 0);
          } else {
            for (let c = 1; c <= 19; c++) rowData[c] = "";
          }

          rowData[20] = dia?.diamondLotNo ?? dia?.DiamondLotNo ?? "";
          rowData[21] = dia?.diamondLab ?? dia?.DiamondLab ?? "";
          rowData[22] = dia?.diamondShape ?? dia?.DiamondShape ?? "";
          rowData[23] = dia?.diamondColor ?? dia?.DiamondColor ?? "";
          rowData[24] = dia?.diamondClarity ?? dia?.DiamondClarity ?? "";
          rowData[25] = dia ? Number(dia?.diamondPcs ?? dia?.DiamondPcs ?? 0) : "";
          rowData[26] = dia ? Number(dia?.diamondCarat ?? dia?.DiamondCarat ?? 0) : "";
          rowData[27] = dia ? Number(dia?.diamondPrice ?? dia?.DiamondPrice ?? 0) : "";
          rowData[28] = dia ? Number(dia?.diamondAmount ?? dia?.DiamondAmount ?? 0) : "";

          rowData[29] = stone?.diamondLotNo ?? stone?.DiamondLotNo ?? "";
          rowData[30] = stone?.diamondLab ?? stone?.DiamondLab ?? "";
          rowData[31] = stone?.diamondShape ?? stone?.DiamondShape ?? "";
          rowData[32] = stone?.diamondColor ?? stone?.DiamondColor ?? "";
          rowData[33] = stone?.diamondClarity ?? stone?.DiamondClarity ?? "";
          rowData[34] = stone ? Number(stone?.diamondPcs ?? stone?.DiamondPcs ?? 0) : "";
          rowData[35] = stone ? Number(stone?.diamondCarat ?? stone?.DiamondCarat ?? 0) : "";
          rowData[36] = stone ? Number(stone?.diamondPrice ?? stone?.DiamondPrice ?? 0) : "";
          rowData[37] = stone ? Number(stone?.diamondAmount ?? stone?.DiamondAmount ?? 0) : "";

          if (i === 0) {
            rowData[38] = Number(j?.totalMakingCharges ?? j?.TotalMakingCharges ?? j?.makingCharges ?? j?.MakingCharges ?? 0);
            rowData[39] = Number(j?.totalSettingCharges ?? j?.TotalSettingCharges ?? 0);
            rowData[40] = Number(j?.totalHandlingCharges ?? j?.TotalHandlingCharges ?? 0);
            rowData[41] = Number(j?.totalCertificateCharges ?? j?.TotalCertificateCharges ?? 0);
            rowData[42] = Number(j?.otherCharges ?? j?.OtherCharges ?? 0);
            rowData[43] = Number(j?.hallmarkCharges ?? j?.HallmarkCharges ?? 0);
            rowData[44] = Number(j?.finalJAmount ?? j?.FinalJAmount ?? 0);
          } else {
            for (let c = 38; c <= 44; c++) rowData[c] = "";
          }

          const excelRow = ws.addRow(rowData);
          excelRow.height = 18.75;

          excelRow.eachCell((cell) => {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
              top: { style: "hair" },
              left: { style: "hair" },
              bottom: { style: "hair" },
              right: { style: "hair" }
            };
          });

          if (i === 0) {
            excelRow.getCell(11).numFmt = "#,##0.00";
            excelRow.getCell(12).numFmt = "#,##0.00";
            excelRow.getCell(16).numFmt = "#,##0.000";
            excelRow.getCell(17).numFmt = "#,##0.000";
            excelRow.getCell(18).numFmt = "#,##0.00";
            excelRow.getCell(19).numFmt = "#,##0.00";
            for (let c = 38; c <= 44; c++) excelRow.getCell(c).numFmt = "#,##0.00";

            // MVC Excel: Video cell = "Video" hyperlink (Drive preview or absolute path)
            const videoUrl = await getExcelVideoUrl(j);
            if (videoUrl) {
              const videoCell = excelRow.getCell(2);
              videoCell.value = { text: "Video", hyperlink: videoUrl };
              videoCell.font = { color: { argb: "FF0000FF" }, underline: true };
            }
          }
          if (dia) {
            excelRow.getCell(26).numFmt = "#,##0.000";
            excelRow.getCell(27).numFmt = "#,##0.00";
            excelRow.getCell(28).numFmt = "#,##0.00";
          }
          if (stone) {
            excelRow.getCell(35).numFmt = "#,##0.000";
            excelRow.getCell(36).numFmt = "#,##0.00";
            excelRow.getCell(37).numFmt = "#,##0.00";
          }

          if (i === 0) {
            const imgBase64 = await getExcelImageBase64(j);
            if (imgBase64) {
              try {
                const imageId = workbook.addImage({
                  base64: imgBase64,
                  extension: "jpeg"
                });
                ws.addImage(imageId, {
                  tl: { col: 0, row: rowIdx - 1 },
                  ext: { width: 56, height: 60 }
                });
                excelRow.height = 50;
              } catch (e) {
                console.error(e);
              }
            }
          }
          rowIdx++;
        }
      }

      rowIdx++;

      // Subtotal Row
      ws.mergeCells(rowIdx, 1, rowIdx, 15);
      ws.getCell(rowIdx, 1).value = "Subtotal:";

      ws.getCell(rowIdx, 16).value = totalGrossWt;
      ws.getCell(rowIdx, 16).numFmt = "#,##0.000";
      ws.getCell(rowIdx, 17).value = totalNetWt;
      ws.getCell(rowIdx, 17).numFmt = "#,##0.000";
      ws.getCell(rowIdx, 19).value = totalMetalAmount;
      ws.getCell(rowIdx, 19).numFmt = "#,##0.00";

      ws.getCell(rowIdx, 25).value = totalDiaPcs;
      ws.getCell(rowIdx, 26).value = totalDiaCrt;
      ws.getCell(rowIdx, 26).numFmt = "#,##0.000";
      ws.getCell(rowIdx, 28).value = totalDiaAmt;
      ws.getCell(rowIdx, 28).numFmt = "#,##0.00";

      ws.getCell(rowIdx, 34).value = totalStonePcs;
      ws.getCell(rowIdx, 35).value = totalStoneCrt;
      ws.getCell(rowIdx, 35).numFmt = "#,##0.000";
      ws.getCell(rowIdx, 37).value = totalStoneAmt;
      ws.getCell(rowIdx, 37).numFmt = "#,##0.00";

      ws.getCell(rowIdx, 38).value = TotalMakingCharges;
      ws.getCell(rowIdx, 38).numFmt = "#,##0.00";
      ws.getCell(rowIdx, 39).value = TotalSettingCharges;
      ws.getCell(rowIdx, 39).numFmt = "#,##0.00";
      ws.getCell(rowIdx, 40).value = TotalHandlingCharges;
      ws.getCell(rowIdx, 40).numFmt = "#,##0.00";
      ws.getCell(rowIdx, 41).value = TotalCertificateCharges;
      ws.getCell(rowIdx, 41).numFmt = "#,##0.00";
      ws.getCell(rowIdx, 42).value = TotalOtherCharges;
      ws.getCell(rowIdx, 42).numFmt = "#,##0.00";
      ws.getCell(rowIdx, 43).value = TotalHallmarkCharges;
      ws.getCell(rowIdx, 43).numFmt = "#,##0.00";
      ws.getCell(rowIdx, 44).value = totalFinalAmt;
      ws.getCell(rowIdx, 44).numFmt = "#,##0.00";

      const subRow = ws.getRow(rowIdx);
      subRow.height = 18.75;
      subRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0F0F0" }
        };
        cell.border = {
          top: { style: "hair" },
          left: { style: "none" },
          bottom: { style: "none" },
          right: { style: "none" }
        };
      });

      rowIdx += 2;
    }

    // Grand Total Row
    ws.mergeCells(rowIdx, 1, rowIdx, 9);
    ws.getCell(rowIdx, 1).value = "Grand Total:";
    ws.getCell(rowIdx, 1).font = { bold: true, size: 12 };

    ws.getCell(rowIdx, 10).value = grandJewPcs;
    ws.getCell(rowIdx, 10).font = { bold: true };
    ws.getCell(rowIdx, 12).value = grandJewAmount;
    ws.getCell(rowIdx, 12).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 12).font = { bold: true };

    ws.getCell(rowIdx, 16).value = grandGrossWt;
    ws.getCell(rowIdx, 16).numFmt = "#,##0.000";
    ws.getCell(rowIdx, 16).font = { bold: true };
    ws.getCell(rowIdx, 17).value = grandNetWt;
    ws.getCell(rowIdx, 17).numFmt = "#,##0.000";
    ws.getCell(rowIdx, 17).font = { bold: true };
    ws.getCell(rowIdx, 19).value = grandMetalAmount;
    ws.getCell(rowIdx, 19).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 19).font = { bold: true };

    ws.getCell(rowIdx, 25).value = grandDiaPcs;
    ws.getCell(rowIdx, 25).font = { bold: true };
    ws.getCell(rowIdx, 26).value = grandDiaCrt;
    ws.getCell(rowIdx, 26).numFmt = "#,##0.000";
    ws.getCell(rowIdx, 26).font = { bold: true };
    ws.getCell(rowIdx, 28).value = grandDiaAmt;
    ws.getCell(rowIdx, 28).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 28).font = { bold: true };

    ws.getCell(rowIdx, 34).value = grandStonePcs;
    ws.getCell(rowIdx, 34).font = { bold: true };
    ws.getCell(rowIdx, 35).value = grandStoneCrt;
    ws.getCell(rowIdx, 35).numFmt = "#,##0.000";
    ws.getCell(rowIdx, 35).font = { bold: true };
    ws.getCell(rowIdx, 37).value = grandStoneAmt;
    ws.getCell(rowIdx, 37).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 37).font = { bold: true };

    ws.getCell(rowIdx, 38).value = grandMakingCharges;
    ws.getCell(rowIdx, 38).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 38).font = { bold: true };
    ws.getCell(rowIdx, 39).value = grandSettingCharges;
    ws.getCell(rowIdx, 39).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 39).font = { bold: true };
    ws.getCell(rowIdx, 40).value = grandHandlingCharges;
    ws.getCell(rowIdx, 40).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 40).font = { bold: true };
    ws.getCell(rowIdx, 41).value = grandCertCharges;
    ws.getCell(rowIdx, 41).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 41).font = { bold: true };
    ws.getCell(rowIdx, 42).value = grandOtherCharges;
    ws.getCell(rowIdx, 42).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 42).font = { bold: true };
    ws.getCell(rowIdx, 43).value = grandHallmarkCharges;
    ws.getCell(rowIdx, 43).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 43).font = { bold: true };
    ws.getCell(rowIdx, 44).value = grandFinalAmt;
    ws.getCell(rowIdx, 44).numFmt = "#,##0.00";
    ws.getCell(rowIdx, 44).font = { bold: true };

    const grandRow = ws.getRow(rowIdx);
    grandRow.height = 22;
    grandRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD0D0D0" }
      };
    });

    ws.columns.forEach((column, i) => {
      if (i > 1) {
        column.autoFit = true;
        column.width = (column.width || 10) + 2;
      }
    });
    ws.getColumn(1).width = 10;
    ws.getColumn(2).width = 10;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `JewelleryStockReport.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExcelExport = async () => {
    if (!reportData || reportData.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const combinedList = (reportData || []).map((item) => ({
      Jewellery: getJewelleryRow(item),
      DiamondDetails: item?.diamondDetails ?? item?.DiamondDetails ?? [],
      StoneDetails: item?.stoneDetails ?? item?.StoneDetails ?? []
    }));

    toast.info("Generating Excel sheet...");

    if (printType === "BarcodePrint") {
      await exportBarcodeExcel(combinedList);
    } else if (printType === "JewelleryRequiredColumnPrint") {
      await exportRequiredColumnExcel(combinedList);
    } else {
      await exportStockListExcel(combinedList);
    }
  };

  const selectStyles = useMemo(() => ({
    control: (provided) => ({
      ...provided,
      backgroundColor: "var(--vz-secondary-bg, #fff)",
      borderColor: "var(--vz-border-color, #ced4da)",
      color: "var(--vz-body-color, #495057)",
      minHeight: "35px",
      fontSize: 13
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "var(--vz-secondary-bg, #fff)",
      color: "var(--vz-body-color, #495057)",
      border: "1px solid var(--vz-border-color, #dee2e6)",
      zIndex: 30
    }),
    menuList: (provided) => ({
      ...provided,
      backgroundColor: "var(--vz-secondary-bg, #fff)",
      color: "var(--vz-body-color, #495057)"
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#3b5de7" : "transparent",
      color: state.isFocused ? "#ffffff" : "var(--vz-body-color, #495057)",
      cursor: "pointer",
      ":active": { backgroundColor: "#3b5de7" }
    }),
    input: (provided) => ({ ...provided, color: "var(--vz-body-color, #495057)" }),
    placeholder: (provided) => ({ ...provided, color: "var(--vz-secondary-color, #878a99)" }),
    singleValue: (provided) => ({ ...provided, color: "var(--vz-body-color, #495057)" }),
    multiValue: (provided) => ({ ...provided, backgroundColor: "transparent" }),
    indicatorsContainer: (provided) => ({ ...provided, color: "var(--vz-body-color, #495057)" }),
    clearIndicator: (provided) => ({
      ...provided,
      color: "var(--vz-secondary-color, #878a99)",
      ":hover": { color: "var(--vz-body-color, #495057)" }
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "var(--vz-secondary-color, #878a99)",
      ":hover": { color: "var(--vz-body-color, #495057)" }
    })
  }), []);

  document.title = `${t("Jewellery Stock Search")} | ${t("Reports")}`;

  const fieldLabel = (text) => (
    <Label className="fw-medium mb-1">{t(text)}</Label>
  );

  return (
    <React.Fragment>
      <ToastContainer closeButton />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Jewellery Stock Search")} pageTitle={t("Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={showReport ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"} />
              {showReport ? t("Jewellery Stock Search Results") : t("Jewellery Stock Search Filters")}
            </h5>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              {!showReport ? (
                <>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handleSearch} disabled={loading || loadingDropdowns}>
                    {loading ? t("Loading...") : t("Report")}
                  </Button>
                  <Button color="soft-secondary" className="btn-sm rounded-2 px-3 py-1" onClick={handleClear} disabled={loading}>
                    {t("Clear")}
                  </Button>
                  {reportData.length > 0 && (
                    <Button color="soft-info" className="btn-sm rounded-2 px-3 py-1" onClick={() => setShowReport(true)}>
                      {t("Prv.Record")}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={() => setShowReport(false)}>
                    {t("New Search")}
                  </Button>
                  <Button color="primary" className="btn-sm rounded-2 px-2 py-1" onClick={handlePrint} title={t("Print")}>
                    <i className="ri-printer-line" />
                  </Button>
                  <Input
                    type="select"
                    bsSize="sm"
                    className="rounded-2"
                    style={{ width: 230 }}
                    value={printType}
                    onChange={(e) => setPrintType(e.target.value)}
                  >
                    <option value="JewelleryStockList Print">JewelleryStockList Print</option>
                    <option value="BarcodePrint">Barcode Print</option>
                    <option value="JewelleryRequiredColumnPrint">JewelleryRequiredColumn Print</option>
                  </Input>
                  <Button color="success" className="btn-sm rounded-2 px-3 py-1" onClick={handleExcelExport}>
                    <i className="ri-file-excel-2-line align-middle me-1" />
                    {t("Excel")}
                  </Button>
                </>
              )}
            </div>
          </div>

          {!showReport && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody className="bg-light-subtle">
                <Row className="g-3">
                  <Col lg={10} md={9}>
                    <Row className="g-3">
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Stock Till Date")}
                          <input type="date" className="form-control form-control-sm" style={{ height: 35 }} name="date" value={filters.date || ""} onChange={handleFilterChange} />
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Show")}
                          <Input type="select" bsSize="sm" name="show" value={filters.show} onChange={handleFilterChange} style={{ height: 35 }}>
                            <option value="All">All</option>
                            <option value="Sold">Sold</option>
                            <option value="Unsold">Unsold</option>
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Hold/UnHold")}
                          <Input type="select" bsSize="sm" name="holdUnHold" value={filters.holdUnHold} onChange={handleFilterChange} style={{ height: 35 }}>
                            <option value="All">All</option>
                            <option value="Hold">Hold</option>
                            <option value="Unhold">Unhold</option>
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Status")}
                          <Input type="select" bsSize="sm" name="status" value={filters.status} onChange={handleFilterChange} style={{ height: 35 }}>
                            <option value="All">All</option>
                            <option value="OnHand">OnHand</option>
                            <option value="OnMemo">OnMemo</option>
                            <option value="OnHand&Int.Memo">OnHand&Int.Memo</option>
                            <option value="OnHand + Memo In">OnHand + Memo In</option>
                            <option value="OnHand + Party Hold">OnHand + Party Hold</option>
                            <option value="Memo In">Memo In</option>
                            <option value="Party Hold">Party Hold</option>
                            <option value="All - Party Hold">All - Party Hold</option>
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Category")}
                          <Input type="select" bsSize="sm" value={filters.jewCategory} onChange={(e) => handleNativeSelect("jewCategory", e.target.value)} style={{ height: 35 }}>
                            <option value="">Select Category</option>
                            {dropdownOptions.category.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("SubCategory")}
                          <Input type="select" bsSize="sm" value={filters.jewSubCategory} onChange={(e) => handleNativeSelect("jewSubCategory", e.target.value)} style={{ height: 35 }}>
                            <option value="">Select SubCategory</option>
                            {dropdownOptions.subCategory.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Jewellery Size")}
                          <Input type="number" bsSize="sm" name="jewSize" value={filters.jewSize} onChange={handleFilterChange} style={{ height: 35 }} />
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Jewellery Certificate")}
                          <Input type="select" bsSize="sm" name="jewCertificate" value={filters.jewCertificate} onChange={handleFilterChange} style={{ height: 35 }}>
                            <option value="">Select Certificate</option>
                            <option value="IGI">IGI</option>
                            <option value="GIA">GIA</option>
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Certificate No")}
                          <Input bsSize="sm" name="jewCertificateNo" value={filters.jewCertificateNo} onChange={handleFilterChange} style={{ height: 35 }} />
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("MetalType")}
                          <Input type="select" bsSize="sm" value={filters.jewMetalType} onChange={(e) => handleMetalChange(e.target.value)} style={{ height: 35 }}>
                            <option value="">Select MetalType</option>
                            {dropdownOptions.metal.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Color")}
                          <Input type="select" bsSize="sm" value={filters.jewColor} onChange={(e) => handleNativeSelect("jewColor", e.target.value)} style={{ height: 35 }}>
                            <option value="">Select Color</option>
                            {dropdownOptions.color.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Purity")}
                          <Input type="select" bsSize="sm" value={filters.jewPurity} onChange={(e) => handleNativeSelect("jewPurity", e.target.value)} disabled={!filters.jewMetalType} style={{ height: 35 }}>
                            <option value="">Select Metal Purity</option>
                            {purityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("LotNo")}
                          <Select
                            isMulti
                            name="showLotNo"
                            options={lotNoOptions}
                            value={lotSelectValue}
                            onChange={handleLotDropdownChange}
                            inputValue={lotSearchValue}
                            onInputChange={(newValue, actionMeta) => {
                              if (actionMeta.action === "input-change") {
                                setLotSearchValue(newValue);
                                debouncedLoadLotOptions(newValue);
                              } else if (actionMeta.action === "menu-close") {
                                setLotSearchValue("");
                                debouncedLoadLotOptions("");
                              }
                            }}
                            placeholder={t("Lot No")}
                            isLoading={loadingLots}
                            classNamePrefix="react-select"
                            closeMenuOnSelect={false}
                            components={{
                              Option: CustomOption,
                              MenuList: CustomMenuList,
                              MultiValue: () => null,
                              ValueContainer: CustomValueContainer
                            }}
                            isAllSelected={isAllLotSelected}
                            onSelectAll={handleSelectAllLots}
                            t={t}
                            isSearchable={true}
                            hideSelectedOptions={false}
                            styles={selectStyles}
                          />
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Stone Type")}
                          <Input type="select" bsSize="sm" value={filters.diamondType} onChange={(e) => handleNativeSelect("diamondType", e.target.value)} style={{ height: 35 }}>
                            <option value="">Select Stone Type</option>
                            {dropdownOptions.stoneType.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Shape")}
                          <Select isMulti placeholder="Shape" options={dropdownOptions.shape} value={dropdownOptions.shape.filter((o) => filters.diamondShape.includes(o.value))} onChange={(sel) => handleMultiSelectChange("diamondShape", sel)} styles={selectStyles} classNamePrefix="jew-select" />
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Size")}
                          <Select isMulti placeholder="Size" options={dropdownOptions.size} value={dropdownOptions.size.filter((o) => filters.diamondSize.includes(o.value))} onChange={(sel) => handleMultiSelectChange("diamondSize", sel)} styles={selectStyles} classNamePrefix="jew-select" />
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Color")}
                          <Select isMulti placeholder="Color" options={dropdownOptions.diamondColor} value={dropdownOptions.diamondColor.filter((o) => filters.diamondColor.includes(o.value))} onChange={(sel) => handleMultiSelectChange("diamondColor", sel)} styles={selectStyles} classNamePrefix="jew-select" />
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          {fieldLabel("Clarity")}
                          <Select isMulti placeholder="Clarity" options={dropdownOptions.clarity} value={dropdownOptions.clarity.filter((o) => filters.diamondClarity.includes(o.value))} onChange={(sel) => handleMultiSelectChange("diamondClarity", sel)} styles={selectStyles} classNamePrefix="jew-select" />
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>

                  <Col lg={2} md={3}>
                    <FormGroup className="mb-2">
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                        <Label className="fw-medium mb-0">{t("JewelleryStockID")}</Label>
                        <Input type="select" bsSize="sm" name="filters" value={filters.filters} onChange={handleFilterChange} style={{ maxWidth: 108, height: 30 }}>
                          <option value="LotNo">LotNo</option>
                          <option value="LotNo Not">LotNo Not</option>
                          <option value="LotNo Like">LotNo Like</option>
                          <option value="CertNo">CertNo</option>
                          <option value="CertNo Not">CertNo Not</option>
                        </Input>
                      </div>
                      <Input
                        type="textarea"
                        rows="7"
                        name="stockId"
                        value={filters.stockId}
                        onChange={handleFilterChange}
                        placeholder={t("Search by stock id")}
                        className="form-control-sm"
                        style={{ resize: "none" }}
                      />
                    </FormGroup>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1">{t("Show StockID")}</Label>
                      <Select
                        isMulti
                        name="showStockId"
                        options={stockIdOptions}
                        value={stockSelectValue}
                        onChange={handleStockIdDropdownChange}
                        inputValue={stockSearchValue}
                        onInputChange={(newValue, actionMeta) => {
                          if (actionMeta.action === "input-change") {
                            setStockSearchValue(newValue);
                            debouncedLoadStockIdOptions(newValue);
                          } else if (actionMeta.action === "menu-close") {
                            setStockSearchValue("");
                            debouncedLoadStockIdOptions("");
                          }
                        }}
                        placeholder={t("Select StockID")}
                        isLoading={loadingStockIds}
                        classNamePrefix="react-select"
                        closeMenuOnSelect={false}
                        components={{
                          Option: CustomOption,
                          MenuList: CustomMenuList,
                          MultiValue: () => null,
                          ValueContainer: CustomValueContainer
                        }}
                        isAllSelected={isAllStockSelected}
                        onSelectAll={handleSelectAllStockIds}
                        t={t}
                        isSearchable={true}
                        hideSelectedOptions={false}
                        styles={selectStyles}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          )}

          {showReport && (
            <Card className="shadow-lg border-0 rounded-3 mb-4 jew-report-card">
              <CardBody className="p-0">
                <div ref={reportRef} id="jew-report-print-root" className="jew-report-shell">
                  <ReportCompanyHeader companyInfo={companyInfo} />
                  <div className="jew-report-scroll">
                    <JewelleryStockReportTable
                      data={reportData}
                      onStockCountChange={setStockCount}
                      onStockClick={(id) => id && window.open(`/master/edit-Mounting-stock?id=${id}&mode=view`, "_blank")}
                    />
                  </div>
                  <div className="jew-report-footer-bar">
                    <div id="stock-report-table_info" className="jew-entry-info">
                      Showing {stockCount > 0 ? 1 : 0} to {stockCount} of {stockCount} entries
                    </div>
                    <div id="cpny-footer" className="jew-report-footer">
                      {companyInfo?.companyFooter || "Powered by SoftOnCloud"}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </Container>
      </div>

      <style>{`
        .jew-report-shell {
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 210px);
          min-height: 420px;
          border: 1px solid var(--vz-border-color, #dee2e6);
          border-radius: 0.5rem;
          background: var(--vz-secondary-bg, #fff);
          overflow: hidden;
        }
        .jew-report-header {
          flex: 0 0 auto;
          padding: 14px 18px 12px;
          border-bottom: 1px solid var(--vz-border-color, #dee2e6);
          background: var(--vz-secondary-bg, #fff);
        }
        .jew-report-header-inner {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .jew-company-block { display: flex; gap: 14px; align-items: flex-start; }
        .jew-logo-wrap { flex-shrink: 0; }
        .jew-company-logo { max-height: 86px; width: 92px; object-fit: contain; }
        .jew-logo-placeholder {
          width: 92px; height: 70px; display: flex; align-items: center; justify-content: center;
          border: 1px dashed var(--vz-border-color, #adb5bd); border-radius: 6px;
          font-size: 11px; color: var(--vz-secondary-color, #878a99);
          background: var(--vz-tertiary-bg, #f3f6f9);
        }
        .jew-company-text {
          font-size: 13px; line-height: 1.7; color: var(--vz-body-color, #212529);
        }
        .jew-company-name {
          font-size: 14px; font-weight: 700; color: var(--vz-body-color, #212529); margin-bottom: 2px;
        }
        .jew-report-title {
          font-size: 20px; font-weight: 700; color: var(--vz-body-color, #212529);
          padding-top: 8px; white-space: nowrap;
        }
        .jew-report-scroll {
          flex: 1 1 auto;
          min-height: 0;
          overflow: auto;
          background: var(--vz-body-bg, #f3f6f9);
        }
        .jew-report-footer-bar {
          flex: 0 0 auto;
          border-top: 1px solid var(--vz-border-color, #dee2e6);
          background: var(--vz-secondary-bg, #fff);
          padding: 8px 16px;
        }
        .jew-report-footer {
          font-size: 12px;
          color: var(--vz-secondary-color, #878a99);
          margin-top: 2px;
        }
        .jew-table-wrap { min-width: 100%; padding: 0 0px; }
        .jew-entry-info {
          font-size: 13px;
          color: var(--vz-body-color, #495057);
          font-weight: 500;
        }
        .jew-stock-report-table {
          min-width: 2200px;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 12px;
          color: var(--vz-body-color, #212529);
          background: var(--vz-secondary-bg, #fff);
          margin-bottom: 16px !important;
        }
        .jew-stock-report-table thead {
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .jew-stock-report-table th {
          background: #f1f4f8 !important;
          color: var(--vz-body-color, #212529);
          border-right: 1px solid rgba(0, 0, 0, 0.15) !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.15) !important;
          white-space: nowrap;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 8px;
          text-align: center !important;
          vertical-align: middle !important;
        }
        .jew-stock-report-table thead tr:first-child th {
          border-top: 1px solid rgba(0, 0, 0, 0.15) !important;
        }
        .jew-stock-report-table tr th:first-child,
        .jew-stock-report-table tr td:first-child {
          border-left: 1px solid rgba(0, 0, 0, 0.15) !important;
        }
        .jew-stock-report-table th[rowspan="2"],
        .jew-stock-report-table thead tr:nth-child(2) th {
          border-bottom: 2px solid rgba(0, 0, 0, 0.4) !important;
        }
        .jew-stock-report-table td {
          border-right: 1px solid rgba(0, 0, 0, 0.15) !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.15) !important;
          padding: 5px 6px;
          vertical-align: middle;
          background: var(--vz-secondary-bg, #fff);
        }
        .jew-stock-report-table tbody tr:nth-child(even) td {
          background: #f8f9fa;
        }
        .group-header td {
          background: #e8edf2 !important;
          font-weight: 700 !important;
          font-size: 14px;
          text-align: left !important;
          color: var(--vz-body-color, #212529) !important;
        }
        /* Grand Total stays fixed above the horizontal scrollbar */
        .jew-stock-report-table tbody tr.grand-total td {
          position: sticky;
          bottom: 0;
          z-index: 3;
          background: #e2e8f0 !important;
          font-weight: 800 !important;
          color: var(--vz-body-color, #212529) !important;
          border-top: 2px solid rgba(0, 0, 0, 0.25) !important;
          border-bottom: 2px solid rgba(0, 0, 0, 0.25) !important;
          box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.04);
        }
        .subtotal td { font-weight: 600; }
        .jew-thumb-img {
          width: 85px; height: 75px; object-fit: cover;
          border: 1px solid var(--vz-border-color, #ced4da);
          border-radius: 4px;
          background: var(--vz-tertiary-bg, #f3f6f9);
        }
        .jew-video-icon {
          font-size: 16px; cursor: pointer; color: var(--vz-body-color, #212529);
        }
        .jew-video-icon:hover { color: var(--vz-primary, #405189); }
        .jew-select__menu { z-index: 40 !important; }

        [data-bs-theme="dark"] .jew-report-shell,
        [data-bs-theme="dark"] .jew-report-header,
        [data-bs-theme="dark"] .jew-report-footer-bar {
          background: var(--vz-secondary-bg);
          border-color: rgba(255, 255, 255, 0.15);
        }
        [data-bs-theme="dark"] .jew-report-scroll {
          background: var(--vz-body-bg);
        }
        [data-bs-theme="dark"] .jew-stock-report-table th,
        [data-bs-theme="dark"] .jew-stock-report-table td {
          border-right-color: rgba(255, 255, 255, 0.15) !important;
          border-bottom-color: rgba(255, 255, 255, 0.15) !important;
        }
        [data-bs-theme="dark"] .jew-stock-report-table thead tr:first-child th {
          border-top-color: rgba(255, 255, 255, 0.15) !important;
        }
        [data-bs-theme="dark"] .jew-stock-report-table tr th:first-child,
        [data-bs-theme="dark"] .jew-stock-report-table tr td:first-child {
          border-left-color: rgba(255, 255, 255, 0.15) !important;
        }
        [data-bs-theme="dark"] .jew-stock-report-table th {
          background: #262a2f !important;
        }
        [data-bs-theme="dark"] .jew-stock-report-table th[rowspan="2"],
        [data-bs-theme="dark"] .jew-stock-report-table thead tr:nth-child(2) th {
          border-bottom: 2px solid rgba(255, 255, 255, 0.4) !important;
        }
        [data-bs-theme="dark"] .jew-stock-report-table tbody tr:nth-child(even) td {
          background: rgba(255, 255, 255, 0.02);
        }
        [data-bs-theme="dark"] .group-header td {
          background: #2c3238 !important;
        }
        [data-bs-theme="dark"] .jew-stock-report-table tbody tr.grand-total td {
          background: #262a2f !important;
          border-top: 2px solid rgba(255, 255, 255, 0.25) !important;
          border-bottom: 2px solid rgba(255, 255, 255, 0.25) !important;
          box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.15);
        }
        [data-bs-theme="dark"] .jew-logo-placeholder {
          background: rgba(255, 255, 255, 0.04);
        }
      `}</style>
    </React.Fragment>
  );
};

export default JewelleryStockSearchReport;
