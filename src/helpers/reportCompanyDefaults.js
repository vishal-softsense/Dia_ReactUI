import { filterSettingData, getPrintFormatData, getSettingData } from "./fakebackend_helper";
import { api } from "../config";
import { PRINT_SETTING_NAMES } from "../printFormats/shared/printUtils";

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
  stockSymbol: "reportStockSymbol",
  masterSymbol: "reportMasterSymbol",
  companyGSTNo: "reportCompanyGSTNo",
  companyHSNCode: "reportCompanyHSNCode",
  memoConditions: "reportMemoConditions",
  rapUsername: "reportRapUsername",
  companySkype: "reportCompanySkype",
  memoPrintFormat: "reportMemoPrintFormat",
  salePrintFormat: "reportSalePrintFormat",
  parcelMemoPrintFormat: "reportParcelMemoPrintFormat",
  parcelSalePrintFormat: "reportParcelSalePrintFormat",
  mixMemoPrintFormat: "reportMixMemoPrintFormat",
  saleConditions: "reportSaleConditions",
  information: "reportInformation"
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
  stockSymbol: "",
  masterSymbol: "",
  companyGSTNo: "",
  companyHSNCode: "",
  memoConditions: "",
  rapUsername: "",
  companySkype: "",
  memoPrintFormat: "",
  salePrintFormat: "",
  parcelMemoPrintFormat: "",
  parcelSalePrintFormat: "",
  mixMemoPrintFormat: "",
  saleConditions: "",
  information: ""
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
    stockSymbol: localStorage.getItem(STORAGE_KEYS.stockSymbol) || DEFAULT_COMPANY.stockSymbol,
    masterSymbol: localStorage.getItem(STORAGE_KEYS.masterSymbol) || DEFAULT_COMPANY.masterSymbol,
    companyGSTNo: localStorage.getItem(STORAGE_KEYS.companyGSTNo) || DEFAULT_COMPANY.companyGSTNo,
    companyHSNCode: localStorage.getItem(STORAGE_KEYS.companyHSNCode) || DEFAULT_COMPANY.companyHSNCode,
    memoConditions: localStorage.getItem(STORAGE_KEYS.memoConditions) || DEFAULT_COMPANY.memoConditions,
    rapUsername: localStorage.getItem(STORAGE_KEYS.rapUsername) || DEFAULT_COMPANY.rapUsername,
    companySkype: localStorage.getItem(STORAGE_KEYS.companySkype) || DEFAULT_COMPANY.companySkype,
    memoPrintFormat: localStorage.getItem(STORAGE_KEYS.memoPrintFormat) || DEFAULT_COMPANY.memoPrintFormat,
    salePrintFormat: localStorage.getItem(STORAGE_KEYS.salePrintFormat) || DEFAULT_COMPANY.salePrintFormat,
    parcelMemoPrintFormat: localStorage.getItem(STORAGE_KEYS.parcelMemoPrintFormat) || DEFAULT_COMPANY.parcelMemoPrintFormat,
    parcelSalePrintFormat: localStorage.getItem(STORAGE_KEYS.parcelSalePrintFormat) || DEFAULT_COMPANY.parcelSalePrintFormat,
    mixMemoPrintFormat: localStorage.getItem(STORAGE_KEYS.mixMemoPrintFormat) || DEFAULT_COMPANY.mixMemoPrintFormat,
    saleConditions: localStorage.getItem(STORAGE_KEYS.saleConditions) || DEFAULT_COMPANY.saleConditions,
    information: localStorage.getItem(STORAGE_KEYS.information) || DEFAULT_COMPANY.information
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
  localStorage.setItem(STORAGE_KEYS.masterSymbol, merged.masterSymbol || "");
  localStorage.setItem(STORAGE_KEYS.companyGSTNo, merged.companyGSTNo || "");
  localStorage.setItem(STORAGE_KEYS.companyHSNCode, merged.companyHSNCode || "");
  localStorage.setItem(STORAGE_KEYS.memoConditions, merged.memoConditions || "");
  localStorage.setItem(STORAGE_KEYS.rapUsername, merged.rapUsername || "");
  localStorage.setItem(STORAGE_KEYS.companySkype, merged.companySkype || "");
  localStorage.setItem(STORAGE_KEYS.memoPrintFormat, merged.memoPrintFormat || "");
  localStorage.setItem(STORAGE_KEYS.salePrintFormat, merged.salePrintFormat || "");
  localStorage.setItem(STORAGE_KEYS.parcelMemoPrintFormat, merged.parcelMemoPrintFormat || "");
  localStorage.setItem(STORAGE_KEYS.parcelSalePrintFormat, merged.parcelSalePrintFormat || "");
  localStorage.setItem(STORAGE_KEYS.mixMemoPrintFormat, merged.mixMemoPrintFormat || "");
  localStorage.setItem(STORAGE_KEYS.saleConditions, merged.saleConditions || "");
  localStorage.setItem(STORAGE_KEYS.information, merged.information || "");
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
    let rows = response?.data || response?.Data || [];

    try {
      const printRes = await getPrintFormatData();
      const printRows = printRes?.data || printRes?.Data || [];
      if (printRows.length) {
        rows = [...rows, ...printRows];
      }
    } catch {
      /* PRINT FORMAT group is optional if already in setting list */
    }

    let companyEmail = pickSettingValue(rows, "CompanyEmail");
    if (!companyEmail) {
      try {
        const emailRes = await filterSettingData("EMAIL SETTINGS");
        const emailRows = emailRes?.data || emailRes?.Data || [];
        companyEmail =
          pickSettingValue(emailRows, "CompanyEmail") ||
          pickSettingValue(emailRows, "Email") ||
          pickSettingValue(emailRows, "Company Email");
      } catch {
        /* ignore */
      }
    }

    const company = {
      companyName: pickSettingValue(rows, "Company") || fallback.companyName,
      companyAddress: pickSettingValue(rows, "CompanyAddress") || fallback.companyAddress,
      companyAddress1: pickSettingValue(rows, "CompanyAddress1") || fallback.companyAddress1,
      companyAddress2: pickSettingValue(rows, "CompanyAddress2") || fallback.companyAddress2,
      companyPhone: pickSettingValue(rows, "CompanyTeleph") || fallback.companyPhone,
      companyEmail: companyEmail || fallback.companyEmail,
      companyFooter: pickSettingValue(rows, "ReportFooterDesc") || fallback.companyFooter,
      companyLogo: pickSettingValue(rows, "CompanyLoginLogo") || fallback.companyLogo,
      stockSymbol: pickSettingValue(rows, "SSymbol") || fallback.stockSymbol,
      masterSymbol: pickSettingValue(rows, "MSymbol") || fallback.masterSymbol,
      companyGSTNo: pickSettingValue(rows, "CompanyGSTNo") || fallback.companyGSTNo,
      companyHSNCode: pickSettingValue(rows, "CompanyHSNCode") || fallback.companyHSNCode,
      memoConditions: pickSettingValue(rows, "MemoConditions") || fallback.memoConditions,
      rapUsername: pickSettingValue(rows, "RapUsername") || fallback.rapUsername,
      companySkype: pickSettingValue(rows, "CompanySkype") || fallback.companySkype,
      memoPrintFormat: pickSettingValue(rows, PRINT_SETTING_NAMES.solitaireMemo) || fallback.memoPrintFormat,
      salePrintFormat: pickSettingValue(rows, PRINT_SETTING_NAMES.solitaireSale) || fallback.salePrintFormat,
      parcelMemoPrintFormat: pickSettingValue(rows, PRINT_SETTING_NAMES.parcelMemo) || fallback.parcelMemoPrintFormat,
      parcelSalePrintFormat: pickSettingValue(rows, PRINT_SETTING_NAMES.parcelSale) || fallback.parcelSalePrintFormat,
      mixMemoPrintFormat: pickSettingValue(rows, PRINT_SETTING_NAMES.mixMemo) || fallback.mixMemoPrintFormat,
      saleConditions: pickSettingValue(rows, "SaleConditions") || fallback.saleConditions,
      information: pickSettingValue(rows, "Information") || fallback.information
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
