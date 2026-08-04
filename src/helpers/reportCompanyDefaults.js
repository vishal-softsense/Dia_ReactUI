import { getSettingData } from "./fakebackend_helper";
import { api } from "../config";

export const REPORT_COMPANY_SETTINGS_EVENT = "reportCompanySettingsUpdated";

const STORAGE_KEYS = {
  companyName: "reportCompanyName",
  companyAddress: "reportCompanyAddress",
  companyAddress1: "reportCompanyAddress1",
  companyAddress2: "reportCompanyAddress2",
  companyPhone: "reportCompanyPhone",
  companyEmail: "reportCompanyEmail",
  companyFooter: "reportCompanyFooter",
  companyLogo: "companyLoginLogo",
  stockSymbol: "reportStockSymbol"
};

const DEFAULT_COMPANY = {
  companyName: "",
  companyAddress: "",
  companyAddress1: "",
  companyAddress2: "",
  companyPhone: "",
  companyEmail: "",
  companyFooter: "Powered by SoftOnCloud",
  companyLogo: "",
  stockSymbol: ""
};

export function resolveCompanyLogoUrl(path) {
  if (!path || typeof path !== "string" || !path.trim()) {
    return "";
  }
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const baseUrl = (api.API_URL || "").replace(/\/$/, "");
  if (trimmed.startsWith("/")) {
    return `${baseUrl}${trimmed}`;
  }
  return `${baseUrl}/${trimmed}`;
}

function pickSettingValue(rows, name) {
  const target = String(name).toLowerCase().replace(/\s+/g, "");
  const row = (rows || []).find((x) => {
    const n = String(x?.Name ?? x?.name ?? "").trim().toLowerCase().replace(/\s+/g, "");
    return n === target;
  });
  return row?.Value ?? row?.value ?? null;
}

export function getCachedReportCompany() {
  return {
    companyName: localStorage.getItem(STORAGE_KEYS.companyName) || DEFAULT_COMPANY.companyName,
    companyAddress: localStorage.getItem(STORAGE_KEYS.companyAddress) || DEFAULT_COMPANY.companyAddress,
    companyAddress1: localStorage.getItem(STORAGE_KEYS.companyAddress1) || DEFAULT_COMPANY.companyAddress1,
    companyAddress2: localStorage.getItem(STORAGE_KEYS.companyAddress2) || DEFAULT_COMPANY.companyAddress2,
    companyPhone: localStorage.getItem(STORAGE_KEYS.companyPhone) || DEFAULT_COMPANY.companyPhone,
    companyEmail: localStorage.getItem(STORAGE_KEYS.companyEmail) || DEFAULT_COMPANY.companyEmail,
    companyFooter: localStorage.getItem(STORAGE_KEYS.companyFooter) || DEFAULT_COMPANY.companyFooter,
    companyLogo: localStorage.getItem(STORAGE_KEYS.companyLogo) || DEFAULT_COMPANY.companyLogo,
    stockSymbol: localStorage.getItem(STORAGE_KEYS.stockSymbol) || DEFAULT_COMPANY.stockSymbol
  };
}

export function setCachedReportCompany(company, { dispatchEvent = true } = {}) {
  const merged = { ...DEFAULT_COMPANY, ...company };
  localStorage.setItem(STORAGE_KEYS.companyName, merged.companyName || "");
  localStorage.setItem(STORAGE_KEYS.companyAddress, merged.companyAddress || "");
  localStorage.setItem(STORAGE_KEYS.companyAddress1, merged.companyAddress1 || "");
  localStorage.setItem(STORAGE_KEYS.companyAddress2, merged.companyAddress2 || "");
  localStorage.setItem(STORAGE_KEYS.companyPhone, merged.companyPhone || "");
  localStorage.setItem(STORAGE_KEYS.companyEmail, merged.companyEmail || "");
  localStorage.setItem(STORAGE_KEYS.companyFooter, merged.companyFooter || DEFAULT_COMPANY.companyFooter);
  localStorage.setItem(STORAGE_KEYS.companyLogo, merged.companyLogo || "");
  localStorage.setItem(STORAGE_KEYS.stockSymbol, merged.stockSymbol || "");
  if (dispatchEvent && typeof window !== "undefined") {
    window.dispatchEvent(new Event(REPORT_COMPANY_SETTINGS_EVENT));
  }
  return merged;
}

export async function getReportCompanySettings({ forceRefresh = true } = {}) {
  const fallback = getCachedReportCompany();

  if (!forceRefresh && fallback.companyName) {
    return fallback;
  }

  try {
    const response = await getSettingData();
    const rows = response?.data || response?.Data || [];
    const company = {
      companyName: pickSettingValue(rows, "Company") || fallback.companyName,
      companyAddress: pickSettingValue(rows, "CompanyAddress") || fallback.companyAddress,
      companyAddress1: pickSettingValue(rows, "CompanyAddress1") || fallback.companyAddress1,
      companyAddress2: pickSettingValue(rows, "CompanyAddress2") || fallback.companyAddress2,
      companyPhone: pickSettingValue(rows, "CompanyTeleph") || fallback.companyPhone,
      companyEmail: pickSettingValue(rows, "CompanyEmail") || fallback.companyEmail,
      companyFooter: pickSettingValue(rows, "ReportFooterDesc") || fallback.companyFooter,
      companyLogo: pickSettingValue(rows, "CompanyLoginLogo") || fallback.companyLogo,
      stockSymbol: pickSettingValue(rows, "SSymbol") || fallback.stockSymbol
    };
    return setCachedReportCompany(company, { dispatchEvent: false });
  } catch (error) {
    console.error("Failed to load report company settings:", error);
    return fallback;
  }
}

export async function refreshReportCompanySettings() {
  const company = await getReportCompanySettings({ forceRefresh: true });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REPORT_COMPANY_SETTINGS_EVENT));
  }
  return company;
}
