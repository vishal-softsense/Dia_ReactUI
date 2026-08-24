export const FALLBACK_MEMO_CONDITIONS =
  "The diamonds invoiced herein are purchased from legitimate sources, not involved in funding conflict & in compliance with the United Nations resolutions. The seller hereby agrees the assurances are based on personal knowledge and /or written assurances given by the supplier of these diamonds";

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
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return val;
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

export const PRINT_SETTING_NAMES = {
  solitaireMemo: "DEFAULT MEMO PRINT FORMAT SOLITAIRE",
  parcelMemo: "DEFAULT MEMO PRINT FORMAT PARCEL",
  solitaireSale: "DEFAULT SALE INVOICE  PRINT FORMAT SOLITAIRE",
  parcelSale: "DEFAULT SALE INVOICE  PRINT FORMAT PARCEL",
  mixMemo: "DEFAULT MIX MEMO PRINT FORMAT"
};
