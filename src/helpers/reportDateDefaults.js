import { filterSettingData } from "./fakebackend_helper";

export const SETTING_MIN_DATE_KEY = "settingMinDate";
export const SETTING_MAX_DATE_KEY = "settingMaxDate";
export const REPORT_DATE_SETTINGS_EVENT = "reportDateSettingsUpdated";

/** Local calendar date as yyyy-MM-dd (avoids UTC shift from toISOString). */
export function formatLocalYMD(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Normalize System Setting MinDate/MaxDate values to yyyy-MM-dd.
 * Handles: yyyy-MM-dd, ISO datetime, dd-MMM-yyyy, dd/MM/yyyy, MM/dd/yyyy.
 */
export function normalizeSettingDate(raw) {
  if (raw === null || raw === undefined) return null;
  let text = String(raw).trim();
  if (!text) return null;

  // Strip time portion if present: "2026-12-31 00:00:00" / "2026-12-31T00:00:00"
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  // "31-Dec-2026" / "31 Dec 2026" / "31/Dec/2026"
  const mmm = text.match(/^(\d{1,2})[-/.\s]+([A-Za-z]{3,9})[-/.\s]+(\d{4})/);
  if (mmm) {
    const months = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, sept: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11
    };
    const month = months[mmm[2].toLowerCase()];
    if (month !== undefined) {
      const d = new Date(Number(mmm[3]), month, Number(mmm[1]));
      if (!Number.isNaN(d.getTime())) return formatLocalYMD(d);
    }
  }

  // "Dec-31-2026" / "December 31, 2026"
  const mdyText = text.match(/^([A-Za-z]{3,9})[-/.\s]+(\d{1,2}),?[-/.\s]+(\d{4})/);
  if (mdyText) {
    const months = {
      jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
      apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
      aug: 7, august: 7, sep: 8, sept: 8, september: 8,
      oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
    };
    const month = months[mdyText[1].toLowerCase()];
    if (month !== undefined) {
      const d = new Date(Number(mdyText[3]), month, Number(mdyText[2]));
      if (!Number.isNaN(d.getTime())) return formatLocalYMD(d);
    }
  }

  const dmy = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (dmy) {
    const a = Number(dmy[1]);
    const b = Number(dmy[2]);
    const y = Number(dmy[3]);
    let d;
    if (a > 12) d = new Date(y, b - 1, a); // dd/MM/yyyy
    else if (b > 12) d = new Date(y, a - 1, b); // MM/dd/yyyy
    else d = new Date(y, b - 1, a); // prefer dd/MM/yyyy
    if (!Number.isNaN(d.getTime())) return formatLocalYMD(d);
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return formatLocalYMD(parsed);
  return null;
}

export function getCachedSettingReportDates() {
  const today = formatLocalYMD();
  const fromDate = localStorage.getItem(SETTING_MIN_DATE_KEY) || "2020-01-01";
  const toDate = localStorage.getItem(SETTING_MAX_DATE_KEY) || today;
  return { fromDate, toDate };
}

export function setCachedSettingReportDates(fromDate, toDate, { dispatchEvent = true } = {}) {
  const normFrom = normalizeSettingDate(fromDate);
  const normTo = normalizeSettingDate(toDate);
  if (normFrom) localStorage.setItem(SETTING_MIN_DATE_KEY, normFrom);
  if (normTo) localStorage.setItem(SETTING_MAX_DATE_KEY, normTo);
  if (dispatchEvent && typeof window !== "undefined") {
    window.dispatchEvent(new Event(REPORT_DATE_SETTINGS_EVENT));
  }
  return {
    fromDate: normFrom || getCachedSettingReportDates().fromDate,
    toDate: normTo || getCachedSettingReportDates().toDate
  };
}

function pickSettingValue(rows, name) {
  const target = String(name).toLowerCase().replace(/\s+/g, "");
  const row = (rows || []).find((x) => {
    const n = String(x?.Name ?? x?.name ?? "").trim().toLowerCase().replace(/\s+/g, "");
    return n === target;
  });
  return row?.Value ?? row?.value ?? null;
}

/**
 * Load MinDate -> FromDate and MaxDate -> ToDate from System Settings.
 * Same mapping as MVC Session MinDate/MaxDate in _MasterLayout.
 *
 * Default forceRefresh=true so changing MaxDate in settings always updates To Date.
 */
export async function getSettingReportDates({ forceRefresh = true } = {}) {
  const today = formatLocalYMD();
  const fallback = {
    fromDate: localStorage.getItem(SETTING_MIN_DATE_KEY) || "2020-01-01",
    toDate: localStorage.getItem(SETTING_MAX_DATE_KEY) || today
  };

  if (!forceRefresh) {
    const cachedMin = localStorage.getItem(SETTING_MIN_DATE_KEY);
    const cachedMax = localStorage.getItem(SETTING_MAX_DATE_KEY);
    if (cachedMin && cachedMax) {
      return { fromDate: cachedMin, toDate: cachedMax };
    }
  }

  try {
    const res = await filterSettingData("SYSTEM SETTINGS");
    const rows = res?.data || res?.Data || [];
    const fromDate = normalizeSettingDate(pickSettingValue(rows, "MinDate")) || fallback.fromDate;
    const toDate = normalizeSettingDate(pickSettingValue(rows, "MaxDate")) || fallback.toDate;
    setCachedSettingReportDates(fromDate, toDate, { dispatchEvent: false });
    return { fromDate, toDate };
  } catch (err) {
    console.error("Failed to load MinDate/MaxDate from System Settings:", err);
    return fallback;
  }
}

export async function refreshSettingReportDates() {
  const dates = await getSettingReportDates({ forceRefresh: true });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REPORT_DATE_SETTINGS_EVENT));
  }
  return dates;
}
