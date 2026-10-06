import IndiaDualFormat from "./solitaireMemo/IndiaDualFormat";
import IndiaSingleFormat from "./solitaireMemo/IndiaSingleFormat";
import UsaSingleFormat from "./solitaireMemo/UsaSingleFormat";
import ClassicFormat from "./solitaireMemo/ClassicFormat";
import SinglePageFormat from "./solitaireMemo/SinglePageFormat";
import UsaUpAndDownDualFormat from "./parcelMemo/UsaUpAndDownDualFormat";
import UsaUpAndDownLongFormat from "./parcelMemo/UsaUpAndDownLongFormat";
import UsaSinglePageFormat from "./parcelMemo/UsaSinglePageFormat";
import ParcelIndiaSingleFormat from "./parcelMemo/ParcelIndiaSingleFormat";
import SaleUsaFormat from "./solitaireSale/SaleUsaFormat";
import SaleUsaFormat1 from "./solitaireSale/SaleUsaFormat1";
import SaleUsaFormat2 from "./solitaireSale/SaleUsaFormat2";
import SaleIndiaFormat from "./solitaireSale/SaleIndiaFormat";
import SaleDubaiLocalFormat from "./solitaireSale/SaleDubaiLocalFormat";
import SaleDubaiExportFormat from "./solitaireSale/SaleDubaiExportFormat";
import SaleDubaiNbfFormat from "./solitaireSale/SaleDubaiNbfFormat";
import ParcelSaleUsaFormat from "./parcelSale/ParcelSaleUsaFormat";
import ParcelSaleUsaFormat2 from "./parcelSale/ParcelSaleUsaFormat2";
import ParcelSaleDubaiLocalFormat from "./parcelSale/ParcelSaleDubaiLocalFormat";
import MixMemoUsaFormat from "./mixMemo/MixMemoUsaFormat";
import MixMemoStellaFormat from "./mixMemo/MixMemoStellaFormat";
import MixMemoDualFormat from "./mixMemo/MixMemoDualFormat";
import { PRINT_SETTING_NAMES, normalizeFormatName } from "./shared/printUtils";

export { PRINT_SETTING_NAMES };

const LANDSCAPE_FORMATS = new Set([
  "Solitaire Memo India_SideBySideDual Format",
  "Parcel Memo India_SideBySideDual Format"
]);

const SOLITAIRE_MEMO_FORMATS = {
  "Solitaire Memo India_SideBySideDual Format": IndiaDualFormat,
  "Solitaire Memo India_Single Format": IndiaSingleFormat,
  "Solitaire Memo USA_SiglePage Format": UsaSingleFormat,
  "Solitaire Memo": ClassicFormat,
  /* Internal: MVC SoMemoOutSiglePageFormat when "Solitaire Memo" && itemCount >= 11 */
  "Solitaire Memo SinglePage": SinglePageFormat
};

const PARCEL_MEMO_FORMATS = {
  "Parcel Memo USA_UpAndDownDual Format": UsaUpAndDownDualFormat,
  "Parcel Memo USA_UpAndDownDual Format_Long": UsaUpAndDownLongFormat,
  "Parcel Memo India_Single Format": ParcelIndiaSingleFormat,
  "Parcel Memo USA_SiglePage Format": UsaSinglePageFormat,
  "Parcel Memo India_SideBySideDual Format": IndiaDualFormat
};

const SOLITAIRE_SALE_FORMATS = {
  "Solitaire Sale Invoice USA_Format1": SaleUsaFormat1,
  "Solitaire Sale Invoice USA_Format2": SaleUsaFormat2,
  "Solitaire Sale Invoice Dubai Local Format": SaleDubaiLocalFormat,
  "Solitaire Sale Invoice Dubai Export Format": SaleDubaiExportFormat,
  "Solitaire Sale Invoice Dubai NBFFormat": SaleDubaiNbfFormat,
  "Solitaire Sale Invoice Dubai NBFFomat": SaleDubaiNbfFormat,
  "Solitaire Sale Invoice USA": SaleUsaFormat,
  "Solitaire Sale Invoice India": SaleIndiaFormat
};

const PARCEL_SALE_FORMATS = {
  "Parcel Sale InvoiceUSA_Format": ParcelSaleUsaFormat,
  "Parcel Sale InvoiceUSA_Format2": ParcelSaleUsaFormat2,
  "Parcel Sale Invoice Dubai Local Format": ParcelSaleDubaiLocalFormat
};

const MIX_MEMO_FORMATS = {
  MixMemoUSA_Stella: MixMemoStellaFormat,
  MixMemoUSA: MixMemoUsaFormat,
  MixMemoDual: MixMemoDualFormat
};

const MODULE_FORMATS = {
  solitaireMemo: SOLITAIRE_MEMO_FORMATS,
  parcelMemo: PARCEL_MEMO_FORMATS,
  solitaireSale: SOLITAIRE_SALE_FORMATS,
  parcelSale: PARCEL_SALE_FORMATS,
  mixMemo: MIX_MEMO_FORMATS
};

const MODULE_DEFAULTS = {
  solitaireMemo: "Solitaire Memo India_Single Format",
  parcelMemo: "Parcel Memo USA_UpAndDownDual Format",
  solitaireSale: "Solitaire Sale Invoice USA_Format1",
  parcelSale: "Parcel Sale InvoiceUSA_Format",
  mixMemo: "MixMemoUSA"
};

const SETTING_TO_MODULE = {
  [PRINT_SETTING_NAMES.solitaireMemo]: "solitaireMemo",
  [PRINT_SETTING_NAMES.parcelMemo]: "parcelMemo",
  [PRINT_SETTING_NAMES.solitaireSale]: "solitaireSale",
  [PRINT_SETTING_NAMES.parcelSale]: "parcelSale",
  [PRINT_SETTING_NAMES.mixMemo]: "mixMemo"
};

export function resolvePrintModule(settingName) {
  const collapsed = String(settingName || "").toLowerCase().replace(/\s+/g, "");
  const match = Object.entries(SETTING_TO_MODULE).find(([name]) =>
    name.toLowerCase().replace(/\s+/g, "") === collapsed
  );
  return match ? match[1] : "";
}

export function resolvePrintComponent(moduleKey, formatName, options = {}) {
  const formats = MODULE_FORMATS[moduleKey] || {};
  let key = normalizeFormatName(formatName);
  if (moduleKey === "parcelMemo" && key === "Parcel Memo USA_UpAndDownDual Format") {
    const count = Number(options.itemCount) || 0;
    if (count > 11) key = "Parcel Memo USA_UpAndDownDual Format_Long";
  }
  if (moduleKey === "mixMemo" && key === "MixMemoUSA") {
    const count = Number(options.itemCount) || 0;
    if (count < 11) key = "MixMemoDual";
  }
  // MVC MemoController SoMemoOutPrintInv: "Solitaire Memo" + rows >= 11 → SoMemoOutSiglePageFormat
  if (moduleKey === "solitaireMemo" && key === "Solitaire Memo") {
    const count = Number(options.itemCount) || 0;
    if (count >= 11) key = "Solitaire Memo SinglePage";
  }
  if (formats[key]) return formats[key];

  const collapsed = key.toLowerCase().replace(/[\s_]+/g, "");
  const fuzzyKey = Object.keys(formats).find(
    (name) => name.toLowerCase().replace(/[\s_]+/g, "") === collapsed
  );
  if (fuzzyKey) return formats[fuzzyKey];

  if (moduleKey === "solitaireSale") {
    if (/usa.?format\s*1|format\s*1/i.test(key)) {
      return formats["Solitaire Sale Invoice USA_Format1"] || null;
    }
    if (/usa.?format\s*2|format\s*2/i.test(key)) {
      return formats["Solitaire Sale Invoice USA_Format2"] || null;
    }
  }

  return formats[MODULE_DEFAULTS[moduleKey]] || null;
}

export function isLandscapePrintFormat(formatName) {
  return LANDSCAPE_FORMATS.has(normalizeFormatName(formatName));
}

export function getRegisteredFormatNames(moduleKey) {
  return Object.keys(MODULE_FORMATS[moduleKey] || {}).filter(
    (k) => k !== "Solitaire Memo SinglePage" && !k.endsWith("_Long")
  );
}
