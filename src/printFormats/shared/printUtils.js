import { api } from "../../config";

export const FALLBACK_MEMO_CONDITIONS =
  "The diamonds invoiced herein are purchased from legitimate sources, not involved in funding conflict & in compliance with the United Nations resolutions. The seller hereby agrees the assurances are based on personal knowledge and /or written assurances given by the supplier of these diamonds";

/** MVC USA Memorandum Session["Information"] default body (between address boxes and meta table). */
export const FALLBACK_USA_MEMO_INFORMATION =
  "The goods described and valued as below are delivered to you for examination and inspection only and remain our property and shall be returned to us on demand and in any event, such merchandise, until returned to us and actually received by us, is at your risk from all hazards, no right or power is given to you to sell, pledge, hypothetical or otherwise dispose of this merchandise regardless of prior transactions. A sale of this merchandise can only be effected and title will pass only if as and when we the said owners shall agree to such sale in writing and shall have billed you for the merchandise. All money received by you on the sale of the merchandise shall be held in trust for us until the full amount invoiced has been paid to us. The undersigned personally guarantee the below obligations on behalf of the company.";

export const getVal = (row, ...keys) => {
  if (!row) return "";
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    if (row[camel] !== undefined && row[camel] !== null && row[camel] !== "") return row[camel];
    if (row[pascal] !== undefined && row[pascal] !== null && row[pascal] !== "") return row[pascal];
  }
  return "";
};

export const fmt = (v, d = 2) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(d) : (0).toFixed(d);
};

/** MVC MixSalePrint_USA N2 with thousands separator (e.g. 153,000.00). */
export const fmtNum = (v, d = 2) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return (0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
};

export const fmtDate = (val) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
  } catch {
    return val;
  }
};

export const normalizeFormatName = (value) => String(value || "").trim();

export const fmtDateMMM = (val) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
  } catch {
    return val;
  }
};

export const fmtDateSlash = (val) => {
  if (!val) return "";
  try {
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return "";
      return `${String(val.getMonth() + 1).padStart(2, "0")}/${String(val.getDate()).padStart(2, "0")}/${val.getFullYear()}`;
    }
    const text = String(val).trim();
    // Drop time: "24-01-2026 12:00:00 AM" → "24-01-2026"
    const dateOnly = text.replace(/\s+\d{1,2}:\d{2}(:\d{2})?(\s*[AaPp][Mm])?$/, "").split("T")[0].trim();

    const d = new Date(dateOnly);
    if (!isNaN(d.getTime())) {
      return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
    }

    // Fallback DD-MM-YYYY (GetMemoReportData) when JS Date cannot parse
    const dmy = dateOnly.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmy) {
      const day = Number(dmy[1]);
      const month = Number(dmy[2]);
      const year = Number(dmy[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
      }
    }
    return dateOnly;
  } catch {
    return String(val).split(/[\sT]/)[0] || "";
  }
};

export const paginateFixed = (items, pageSize) => {
  const list = items || [];
  const size = pageSize || 30;
  const pages = [];
  if (!list.length) return [[]];
  for (let i = 0; i < list.length; i += size) pages.push(list.slice(i, i + size));
  return pages;
};

export const paginateVariable = (items, sizes) => {
  const list = items || [];
  const single = sizes.single ?? 20;
  const first = sizes.first ?? 30;
  const middle = sizes.middle ?? 30;
  const last = sizes.last ?? 20;
  if (list.length <= single) return [list];
  const pages = [list.slice(0, first)];
  let idx = first;
  while (idx < list.length) {
    const remaining = list.length - idx;
    if (remaining <= last) {
      pages.push(list.slice(idx));
      break;
    }
    pages.push(list.slice(idx, idx + middle));
    idx += middle;
  }
  return pages;
};

/** MixMemoUSA_Stella: 25 rows on full pages, last page capped at 21 (also used as the single-page cap). */
export const paginateStella = (items, pageSize = 25, lastCap = 21) => {
  const list = items || [];
  if (!list.length) return [[]];
  let fullPages = Math.floor((list.length - lastCap) / pageSize);
  if (fullPages < 0) fullPages = 0;
  let lastCount = list.length - fullPages * pageSize;
  if (lastCount > lastCap) {
    fullPages += 1;
    lastCount = list.length - fullPages * pageSize;
  }
  const pages = [];
  for (let p = 0; p < fullPages; p += 1) {
    pages.push(list.slice(p * pageSize, (p + 1) * pageSize));
  }
  pages.push(list.slice(fullPages * pageSize));
  return pages;
};

/**
 * Purchase NOTE style:
 * - ≤ lastCap: 1 page with Totals
 * - else: full/middle pages of pageSize; last page ≤ lastCap with records + Totals
 * Example (24 / 25): 49 items → Page1: 24 | Page2: 25 + Totals
 */
export const paginateWithLastCap = (items, pageSize = 25, lastCap = 21) => {
  const list = items || [];
  if (!list.length) return [[]];

  // Single page: allow up to max(pageSize, lastCap)
  // Sale Format1: 25/21 → ≤25 = 1 page; Purchase: 24/25 → ≤25 = 1 page
  const singleMax = Math.max(pageSize, lastCap);
  if (list.length <= singleMax) return [list];

  const pages = [];
  let start = 0;

  while (list.length - start > lastCap) {
    const remaining = list.length - start;
    let take = pageSize;
    if (remaining - take <= 0) {
      take = remaining - lastCap;
    }
    if (take < 1) take = Math.min(pageSize, remaining - 1);
    pages.push(list.slice(start, start + take));
    start += take;
  }
  pages.push(list.slice(start));
  return pages;
};

/** Sanitize party / name segment for print PDF filenames (MVC style). */
export const sanitizePrintNamePart = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[\\/:*?"<>|]+/g, "");

/**
 * e.g. MemoIn_129_Sahil / Purchase_264_Arjunrajpassaround
 * Uses InvNo (invoice #) + PartyName — not the URL transaction ID.
 */
export const buildPrintFileName = (prefix, invNo, partyName) => {
  const inv = sanitizePrintNamePart(invNo);
  const party = sanitizePrintNamePart(partyName);
  if (inv && party) return `${prefix}_${inv}_${party}`;
  if (inv) return `${prefix}_${inv}`;
  return prefix;
};

/** Set document title so browser Print → Save as PDF uses this filename. */
export const applyPrintDocumentTitle = (fileName) => {
  if (!fileName) return;
  document.title = fileName;
  const titleEl = document.querySelector("head title");
  if (titleEl) titleEl.textContent = fileName;
};

/**
 * Print a DOM element in a dedicated window so Microsoft Print to PDF /
 * Save-as dialog picks up fileName (e.g. MemoIn_129_Sahil) as the default name.
 */
export const printElementWithFileName = (elementId, fileName) => {
  const safeName = sanitizePrintNamePart(fileName) ? fileName : "print";
  applyPrintDocumentTitle(safeName);

  const source = document.getElementById(elementId);
  if (!source) {
    window.print();
    return;
  }

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!printWindow) {
    // Popup blocked — fall back to same-window print
    setTimeout(() => window.print(), 50);
    return;
  }

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join("\n");

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${safeName.replace(/</g, "")}</title>
  ${styles}
  <style>
    html, body { margin: 0; padding: 0; background: #fff !important; }
    @page { size: Letter portrait; margin: 8mm; }
    .d-print-none { display: none !important; }
  </style>
</head>
<body>${source.outerHTML}</body>
</html>`);
  printWindow.document.close();
  printWindow.document.title = safeName;

  const triggerPrint = () => {
    try {
      printWindow.document.title = safeName;
      printWindow.focus();
      printWindow.print();
    } catch (err) {
      console.error(err);
      window.print();
    }
  };

  // Allow images/styles to settle before opening the print dialog
  setTimeout(triggerPrint, 300);
};

export const PRINT_SETTING_NAMES = {
  solitaireMemo: "DEFAULT MEMO PRINT FORMAT SOLITAIRE",
  parcelMemo: "DEFAULT MEMO PRINT FORMAT PARCEL",
  solitaireSale: "DEFAULT SALE INVOICE  PRINT FORMAT SOLITAIRE",
  parcelSale: "DEFAULT SALE INVOICE  PRINT FORMAT PARCEL",
  mixMemo: "DEFAULT MIX MEMO PRINT FORMAT"
};

export const normalizeMediaPath = (path) => {
  if (!path || typeof path !== "string") return "";
  let trimmed = path.trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return "";
  return trimmed.replace(/\\/g, "/").replace(/^~\//, "/");
};

export const resolveMediaUrl = (path) => {
  const trimmed = normalizeMediaPath(path);
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  const baseUrl = (api.IMAGE_URL || api.API_URL || "").replace(/\/$/, "");
  const clean = trimmed.replace(/^(\.\.\/)+/, "");
  if (clean.startsWith("/")) return `${baseUrl}${clean}`;
  return `${baseUrl}/${clean}`;
};

export const getItemImageUrl = (item) =>
  resolveMediaUrl(
    getVal(item, "ImagePath", "imagePath", "AssetImagePath", "assetImagePath", "Image", "image")
  );

/** MVC jewsale/JewSaleprintinv — ImageFullPath byte[] → data:image/png;base64,... */
export const resolveImageFullPath = (item) => {
  const raw = item?.ImageFullPath ?? item?.imageFullPath;
  if (!raw) return "";

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.toLowerCase() === "null") return "";
    if (trimmed.startsWith("data:")) return trimmed;
    return `data:image/png;base64,${trimmed}`;
  }

  if (Array.isArray(raw) && raw.length > 0) {
    const bytes = new Uint8Array(raw);
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return `data:image/png;base64,${btoa(binary)}`;
  }

  return "";
};

/**
 * MVC print amount column heading (MixPurchasePrint_USA, PrintInvoice, etc.):
 * When invoice currency is stock → "Amount US {SSymbol}"; else → "Amount {MSymbol}".
 */
export const getPrintAmountHeader = (data, company = {}) => {
  let auth = {};
  try {
    auth = JSON.parse(
      sessionStorage.getItem("authUser") || localStorage.getItem("authUser") || "{}"
    );
  } catch {
    /* ignore */
  }
  const authRoot = auth?.data || auth || {};

  const stockSymbol =
    getVal(data, "StockSymbol", "stockSymbol") ||
    company?.stockSymbol ||
    authRoot.SSymbol ||
    authRoot.sSymbol ||
    auth?.SSymbol ||
    "USD";
  const masterSymbol =
    getVal(data, "MasterSymbol", "masterSymbol") ||
    company?.masterSymbol ||
    authRoot.MSymbol ||
    authRoot.mSymbol ||
    auth?.MSymbol ||
    "INR";

  const currency = String(getVal(data, "Currency", "currency") || stockSymbol).trim();

  // MVC: Session["SSymbol"] == Model.Currency → Amount US {SSymbol}
  if (currency === stockSymbol) {
    return `Amount US ${stockSymbol}`;
  }
  return `Amount ${masterSymbol}`;
};
