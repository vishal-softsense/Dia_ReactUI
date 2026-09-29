import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Table
} from "reactstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import {
  addMixConsignment,
  editMixConsignment,
  getAccGrpMasters,
  getCurrencyRates,
  getMixConsignmentLots,
  getMixConsignmentDetail,
  getMixConsignmentLotDetail,
  getMixConsignmentPageData,
  addParcelItemMaster,
  checkLotNoExists,
  getMixConsignmentMixLotNoLM
} from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  REPORT_COMPANY_SETTINGS_EVENT
} from "../../../../helpers/reportCompanyDefaults";
import { calcCommissionPerFromAmount, formatCommissionDisplay } from "../../../../helpers/commissionAmount";

const todayIso = () => new Date().toISOString().substr(0, 10);

const toLocalDateStr = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getVal = (row, ...keys) => {
  if (!row) return "";
  for (const key of keys) {
    const variants = [
      key,
      key.charAt(0).toLowerCase() + key.slice(1),
      key.charAt(0).toUpperCase() + key.slice(1),
      key.toLowerCase(),
      key.toUpperCase()
    ];
    for (const k of variants) {
      if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k];
    }
  }
  return "";
};

/** Prefer first non-zero numeric among aliases (SP may use PurchaseMRP / Carats etc.). */
const getNumVal = (row, ...keys) => {
  if (!row) return 0;
  let zero = null;
  for (const key of keys) {
    const variants = [
      key,
      key.charAt(0).toLowerCase() + key.slice(1),
      key.charAt(0).toUpperCase() + key.slice(1),
      key.toLowerCase(),
      key.toUpperCase()
    ];
    for (const k of variants) {
      if (row[k] === undefined || row[k] === null || row[k] === "") continue;
      const n = parseFloat(row[k]);
      if (!Number.isFinite(n)) continue;
      if (n !== 0) return n;
      if (zero === null) zero = 0;
    }
  }
  return zero ?? 0;
};

const getStrVal = (row, ...keys) => {
  const v = getVal(row, ...keys);
  return v == null ? "" : String(v);
};

const extractLotList = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.Data)) return res.Data;
  if (Array.isArray(res.data?.data)) return res.data.data;
  if (Array.isArray(res.data?.Data)) return res.data.Data;
  if (Array.isArray(res.Data?.data)) return res.Data.data;
  if (Array.isArray(res.Data?.Data)) return res.Data.Data;
  if (Array.isArray(res.data?.$values)) return res.data.$values;
  if (Array.isArray(res.Data?.$values)) return res.Data.$values;
  if (Array.isArray(res.$values)) return res.$values;
  return [];
};

const mapMixLotOptions = (res) =>
  extractLotList(res)
    .map((item) => {
      if (item == null) return null;
      if (typeof item === "string" || typeof item === "number") {
        const str = String(item).trim();
        return str ? { value: str, label: str } : null;
      }
      const value = String(
        item.name ??
          item.Name ??
          item.lotNo ??
          item.LotNo ??
          item.id ??
          item.ID ??
          item.value ??
          ""
      ).trim();
      const label = String(
        item.text ??
          item.Text ??
          item.textName ??
          item.TextName ??
          item.Name ??
          item.name ??
          item.LotNo ??
          item.lotNo ??
          item.label ??
          value
      ).trim();
      if (!value && !label) return null;
      return { value: value || label, label: label || value };
    })
    .filter(Boolean);

const toNum = (v, d = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : d;
};

const fmt = (v, decimals = 2) => toNum(v).toFixed(decimals);

const PURCHASE_ITEM_COLUMNS = [
  { key: "lotNo", label: "LotNo" },
  { key: "itemName", label: "ItemName" },
  { key: "shape", label: "Shape" },
  { key: "size", label: "Size" },
  { key: "color", label: "Color" },
  { key: "clarity", label: "Clarity" },
  { key: "sieve", label: "Sieve" },
  { key: "pcs", label: "Pcs", align: "end", footer: "pcs" },
  { key: "issueCarats", label: "IssueCarats", align: "end", decimals: 3 },
  { key: "back", label: "Rejection %", align: "end", decimals: 2 },
  { key: "rtnCarats", label: "Rejection", align: "end", decimals: 3 },
  { key: "weight", label: "Carats", align: "end", decimals: 3, footer: "weight" },
  { key: "rate", label: "PurchaseRate", align: "end", decimals: 2, footer: "avgRate" },
  { key: "amount", label: "PurchaseAmount", align: "end", decimals: 2, footer: "totAmount" },
  { key: "suppLotNo", label: "Supply Lot Number" },
  { key: "askingRate", label: "AskingRate", align: "end", decimals: 2 },
  { key: "actualRate", label: "ActualRate", align: "end", decimals: 2 },
  { key: "groupId", label: "Group ID" },
  { key: "stoneType", label: "StoneType" },
  { key: "rmk", label: "RMK" },
  { key: "memoTransCode", label: "MemoTransCode", align: "end" },
  { key: "stockType", label: "StockType" },
  { key: "invDescription", label: "ItemDescription" },
  { key: "status", label: "Status" },
  { key: "spCarats", label: "SpCarats", align: "end", decimals: 3 },
  { key: "returnCaratsCol", label: "ReturnCarats", align: "end", decimals: 3, valueKey: "rtnCarats" }
];

const mapGradingFromSource = (src) => ({
  cut: getStrVal(src, "Cut"),
  polish: getStrVal(src, "Polish"),
  symmetry: getStrVal(src, "Symmetry"),
  fl: getStrVal(src, "FL"),
  proportion: getStrVal(src, "Proportion"),
  lw: getNumVal(src, "LW"),
  length: getNumVal(src, "Length"),
  width: getNumVal(src, "Width"),
  depth: getNumVal(src, "Depth"),
  totDep: getNumVal(src, "TotDep"),
  tablePer: getNumVal(src, "TablePer"),
  culet: getStrVal(src, "Culet"),
  gMin: getStrVal(src, "GMin"),
  gMax: getStrVal(src, "GMax"),
  min: getNumVal(src, "Min"),
  max: getNumVal(src, "Max"),
  girdlePer: getNumVal(src, "GirdlePer"),
  brown: getStrVal(src, "Brown"),
  milky: getStrVal(src, "Milky"),
  ha: getStrVal(src, "HA"),
  natts: getStrVal(src, "Natts"),
  eyeClean: getStrVal(src, "EyeClean"),
  oit: getStrVal(src, "OIT"),
  oig: getStrVal(src, "OIG"),
  oic: getStrVal(src, "OIC"),
  oip: getStrVal(src, "OIP"),
  tabInc: getStrVal(src, "TabInc"),
  incPattern: getStrVal(src, "IncPattern"),
  lab: getStrVal(src, "LAB"),
  certificateNo: getStrVal(src, "CertificateNo"),
  inscriptionText: getStrVal(src, "InscriptionText"),
  ch: getNumVal(src, "CH"),
  ca: getNumVal(src, "CA"),
  pa: getNumVal(src, "PA"),
  ph: getNumVal(src, "PH"),
  strLn: getNumVal(src, "StrLn"),
  lrHalf: getNumVal(src, "LrHalf"),
  luster: getStrVal(src, "Luster"),
  keyToSymbols: getStrVal(src, "KeyToSymbols"),
  labComments: getStrVal(src, "LabComments"),
  reportDate: getStrVal(src, "ReportDate"),
  mfgComments: getStrVal(src, "MfgComments"),
  memberRemarks: getStrVal(src, "MemberRemarks"),
  igiCut: getStrVal(src, "IGICut"),
  hrdCut: getStrVal(src, "HRDCut"),
  girdleCondition: getStrVal(src, "GirdleCondition"),
  askingBack: getNumVal(src, "AskingBack"),
  askingRate: getNumVal(src, "AskingRate"),
  actualBack: getNumVal(src, "ActualBack", "BottomBack"),
  actualRate: getNumVal(src, "ActualRate", "BottomRate"),
  green: getStrVal(src, "Green"),
  flColor: getStrVal(src, "FLColor"),
  culetCondition: getStrVal(src, "CuletCondition"),
  shade: getStrVal(src, "Shade"),
  crownInclusion: getStrVal(src, "CrownInclusion"),
  bit: getStrVal(src, "BIT"),
  bis: getStrVal(src, "BIS"),
  fancyColor: getStrVal(src, "FancyColor"),
  fancyColorIntensity: getStrVal(src, "FancyColorIntensity"),
  fancyColorOvertone: getStrVal(src, "FancyColorOvertone"),
  rmk: getStrVal(src, "RMK"),
  itemGroup: getStrVal(src, "ItemGroup"),
  treatment: getStrVal(src, "Treatment"),
  rfid: getStrVal(src, "RFID"),
  mfgSeriesID: getStrVal(src, "MfgSeriesID"),
  mfgPacketID: getStrVal(src, "MfgPacketID"),
  status: getStrVal(src, "Status"),
  imagePath: getStrVal(src, "ImagePath"),
  videoPath: getStrVal(src, "VideoPath"),
  pagePath: getStrVal(src, "PagePath"),
  countryOfOrigin: getStrVal(src, "CountryOfOrigin"),
  countryOfMfg: getStrVal(src, "CountryOfMfg")
});

const mapItemFromApi = (r, idx) => ({
  srNo: idx + 1,
  lotNo: getStrVal(r, "LotNo"),
  itemName: getStrVal(r, "ItemName"),
  weight: getNumVal(r, "Weight", "Carats"),
  issueCarats: getNumVal(r, "IssueCarats") || getNumVal(r, "Weight", "Carats"),
  pcs: getNumVal(r, "Pcs") || 1,
  mrp: getNumVal(r, "MRP", "PurchaseMRP"),
  back: getNumVal(r, "PurchaseBack", "PMRPDown", "Back"),
  rate: getNumVal(r, "PurchaseRate", "Rate"),
  less1: getNumVal(r, "Less1"),
  less2: getNumVal(r, "Less2"),
  less3: getNumVal(r, "Less3"),
  amount: getNumVal(r, "PurAmount", "Amount"),
  shape: getStrVal(r, "Shape", "ShapeId", "PShape"),
  color: getStrVal(r, "Color", "ColorId", "PColor"),
  clarity: getStrVal(r, "Clarity", "ClarityId", "PClarity"),
  size: getStrVal(r, "Size", "SizeId", "PSize"),
  sieve: getStrVal(r, "Sieve", "SieveId", "PSieve"),
  stockType: getStrVal(r, "StockType") || "Diamond",
  invDescription: getStrVal(r, "InvDescription", "invDescription"),
  suppLotNo: getStrVal(r, "SuppLotNo"),
  askingRate: getNumVal(r, "AskingRate"),
  actualRate: getNumVal(r, "ActualRate"),
  groupId: getStrVal(r, "GroupId", "ItemGroup"),
  stoneType: getStrVal(r, "StoneType"),
  rmk: getStrVal(r, "RMK", "MemberRemarks"),
  memoTransCode: getNumVal(r, "MemoTransCode"),
  rtnCarats: getNumVal(r, "RtnCarats", "ReturnCarats"),
  status: getStrVal(r, "Status"),
  spCarats: getNumVal(r, "SpCarats", "SPCarats")
});

const resolveOptionValue = (options = [], rawValue) => {
  if (rawValue == null || rawValue === "") return "";
  const needle = String(rawValue).trim().toLowerCase();
  const matched = (options || []).find((o) => {
    const v = String(o?.value ?? "").trim().toLowerCase();
    const l = String(o?.label ?? "").trim().toLowerCase();
    const id = String(o?.id ?? "").trim().toLowerCase();
    return v === needle || l === needle || (id && id === needle);
  });
  return matched ? matched.value : String(rawValue).trim();
};

const pickSpecFromItemName = (options, itemName, used = new Set()) => {
  if (!itemName || !options?.length) return "";
  for (const token of String(itemName).split(/\s+/).filter(Boolean)) {
    const needle = token.toLowerCase();
    const matched = options.find((o) => {
      const val = String(o?.value ?? "").trim().toLowerCase();
      const lbl = String(o?.label ?? "").trim().toLowerCase();
      if (!val || used.has(val)) return false;
      return val === needle || lbl === needle;
    });
    if (matched) {
      used.add(String(matched.value).trim().toLowerCase());
      return matched.value;
    }
  }
  return "";
};

const buildEntryFromAddItemForm = (form, lotNo, header, opts = {}) => {
  const {
    shapeOpts = [],
    colorOpts = [],
    clarityOpts = [],
    sizeOpts = [],
    sieveOpts = []
  } = opts;

  const sRateBase = toNum(header.sBaseRate, 1) || toNum(header.baseRate, 1) || 1;
  const purchaseRate = toNum(form.purchaseRate);
  const masterRate = toNum(form.masterCurrencyRate);
  const pDollorRate = toNum(form.pDollorRate);
  const sRate = purchaseRate;
  const rate = masterRate || (purchaseRate ? purchaseRate * sRateBase : 0);
  const itemName =
    (form.itemName || "").trim() ||
    [form.shapeId, form.colorId, form.sizeId, form.clarityId].filter(Boolean).join(" ");

  const used = new Set();
  let shape = resolveOptionValue(shapeOpts, form.shapeId);
  if (shape) used.add(String(shape).trim().toLowerCase());
  else shape = pickSpecFromItemName(shapeOpts, itemName, used);

  let color = resolveOptionValue(colorOpts, form.colorId);
  if (color) used.add(String(color).trim().toLowerCase());
  else color = pickSpecFromItemName(colorOpts, itemName, used);

  let clarity = resolveOptionValue(clarityOpts, form.clarityId);
  if (clarity) used.add(String(clarity).trim().toLowerCase());
  else clarity = pickSpecFromItemName(clarityOpts, itemName, used);

  let size = resolveOptionValue(sizeOpts, form.sizeId);
  if (size) used.add(String(size).trim().toLowerCase());
  else size = pickSpecFromItemName(sizeOpts, itemName, used);

  let sieve = resolveOptionValue(sieveOpts, form.sieveId);
  if (sieve) used.add(String(sieve).trim().toLowerCase());
  else sieve = pickSpecFromItemName(sieveOpts, itemName, used);

  const entry = {
    ...emptyItem(),
    lotNo,
    itemName,
    shape,
    color,
    clarity,
    size,
    sieve,
    groupId: form.itemGroupID || "",
    stoneType: form.stoneTypes || "",
    rmk: form.publicCommnets || "",
    pcs: form.stoneTypes === "Single" ? "1" : "1",
    rate: fmt(rate, 2),
    sRate: fmt(sRate, 2),
    mrp: "0",
    back: "0",
    weight: "0",
    issueCarats: "0",
    rtnCarats: "0",
    less1: "0",
    less2: "0",
    less3: "0",
    memoTransCode: 0,
    stockType: "Diamond",
    suppLotNo: "",
    askingRate: "0",
    actualRate: "0",
    certificateNo: form.certificateNo || "",
    productType: form.productType || "",
    category: form.category || "",
    instruction: form.instruction || "",
    pDollorRate: fmt(pDollorRate, 2),
    status: "",
    spCarats: "0"
  };

  entry.amount = fmt(
    calcItemAmount(entry.weight, entry.rate, entry.less1, entry.less2, entry.less3, entry.pcs, entry.stockType)
  );
  return entry;
};

const emptyItem = () => ({
  lotNo: "",
  itemName: "",
  weight: "",
  issueCarats: "",
  pcs: "1",
  mrp: "",
  back: "0",
  rate: "",
  sRate: "",
  less1: "0",
  less2: "0",
  less3: "0",
  amount: "",
  shape: "",
  color: "",
  clarity: "",
  size: "",
  sieve: "",
  stockType: "Diamond",
  invDescription: "",
  suppLotNo: "",
  askingRate: "",
  actualRate: "",
  groupId: "",
  stoneType: "",
  rmk: "",
  memoTransCode: 0,
  rtnCarats: "0",
  status: "",
  spCarats: "0"
});

const pickNonEmpty = (primary, fallback) => {
  if (primary != null && primary !== "") return primary;
  return fallback != null && fallback !== "" ? fallback : "";
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** MVC #pur-lotno change: fill entry row from get-mixconlot-detail / get-parcellot-detail */
const mapLotDetailToEntry = (lot, lotNo, opts = {}) => {
  const {
    shapeOpts = [],
    colorOpts = [],
    clarityOpts = [],
    sizeOpts = [],
    sieveOpts = []
  } = opts;

  const carats = getNumVal(lot, "Carats", "Weight");
  const caratStr = fmt(carats, 2);
  const pcs = getNumVal(lot, "Pcs") || 1;
  const mrp = getNumVal(lot, "PurchaseMRP", "MRP");
  const finalAmountRaw = getStrVal(lot, "FinalAmount");
  const finalAmount =
    finalAmountRaw ||
    (getNumVal(lot, "FinalAmount", "Amount") ? fmt(getNumVal(lot, "FinalAmount", "Amount"), 2) : "0.00");

  return {
    ...emptyItem(),
    lotNo: getStrVal(lot, "LotNo") || lotNo,
    itemName: getStrVal(lot, "ItemName"),
    shape: resolveOptionValue(shapeOpts, getStrVal(lot, "ShapeId", "Shape")),
    color: resolveOptionValue(colorOpts, getStrVal(lot, "ColorId", "Color")),
    clarity: resolveOptionValue(clarityOpts, getStrVal(lot, "ClarityId", "Clarity")),
    size: resolveOptionValue(sizeOpts, getStrVal(lot, "SizeId", "Size")),
    sieve: resolveOptionValue(sieveOpts, getStrVal(lot, "SieveId", "Sieve")),
    pcs: String(pcs),
    mrp: fmt(mrp, 2),
    back: "0",
    issueCarats: caratStr,
    weight: caratStr,
    rtnCarats: "0",
    rate: "0.00",
    sRate: "0.00",
    less1: "0",
    less2: "0",
    less3: "0",
    memoTransCode: 0,
    stockType: getStrVal(lot, "StockType") || "Diamond",
    invDescription: getStrVal(lot, "InvDescription"),
    amount: finalAmount
  };
};

const mergeEntryWithFallback = (apiEntry, fallbackEntry) => {
  if (!fallbackEntry) return apiEntry;
  return {
    ...apiEntry,
    itemName: pickNonEmpty(apiEntry.itemName, fallbackEntry.itemName),
    shape: pickNonEmpty(apiEntry.shape, fallbackEntry.shape),
    color: pickNonEmpty(apiEntry.color, fallbackEntry.color),
    clarity: pickNonEmpty(apiEntry.clarity, fallbackEntry.clarity),
    size: pickNonEmpty(apiEntry.size, fallbackEntry.size),
    sieve: pickNonEmpty(apiEntry.sieve, fallbackEntry.sieve),
    issueCarats: pickNonEmpty(apiEntry.issueCarats, fallbackEntry.issueCarats),
    weight: pickNonEmpty(apiEntry.weight, fallbackEntry.weight),
    pcs: pickNonEmpty(apiEntry.pcs, fallbackEntry.pcs),
    mrp: pickNonEmpty(apiEntry.mrp, fallbackEntry.mrp),
    amount: pickNonEmpty(apiEntry.amount, fallbackEntry.amount),
    stockType: pickNonEmpty(apiEntry.stockType, fallbackEntry.stockType)
  };
};

const renderItemCell = (row, col) => {
  const v = row[col.valueKey || col.key];
  if (col.decimals != null) {
    if (v === "" || v == null) return v === 0 || v === "0" ? fmt(0, col.decimals) : "";
    return fmt(v, col.decimals);
  }
  if (typeof v === "number") return v === 0 ? "0" : String(v);
  return v ?? "";
};

const getItemFooterValue = (footerKey, totals, itemRows) => {
  switch (footerKey) {
    case "weight":
      return fmt(totals.totCts, 3);
    case "pcs":
      return itemRows.reduce((s, r) => s + toNum(r.pcs), 0);
    case "avgMrp":
      return fmt(totals.avgMrp, 2);
    case "avgBack":
      return fmt(totals.avgBack, 3);
    case "avgRate":
      return fmt(totals.avgRate, 2);
    case "totAmount":
      return fmt(totals.totAmount);
    default:
      return "";
  }
};

const getItemRowStyle = (row) => {
  // MVC MixConsignment.js createdRow — color entire row by Status
  if (row.status === "Purchase") return { color: "Green" };
  if (row.status === "Consingment-rtn") return { color: "red" };
  if (row.status === "Pur+Return") return { color: "Purple" };
  return undefined;
};

const calcItemAmount = (weight, rate, less1, less2, less3, pcs = 1, stockType = "Diamond") => {
  let amount = String(stockType).toLowerCase() === "jewellery"
    ? toNum(pcs) * toNum(rate)
    : toNum(weight) * toNum(rate);
  const l1 = toNum(less1);
  const l2 = toNum(less2);
  const l3 = toNum(less3);
  if (l1 !== 0) amount = (amount * (100 + l1)) / 100;
  if (l2 !== 0) amount = (amount * (100 + l2)) / 100;
  if (l3 !== 0) amount = (amount * (100 + l3)) / 100;
  return Math.round(amount * 100) / 100;
};

// MVC AddMixConsignment/EditMixConsignment: fixed InvType order (not from Type master priority)
const INV_TYPE_OPTS = [
  { value: "External", label: "External" },
  { value: "Internal", label: "Internal" },
  { value: "Local", label: "Local" },
  { value: "Pend Sale", label: "Pend Sale" },
  { value: "HOLD", label: "HOLD" },
  { value: "LAB", label: "LAB" }
];

/** Round helper for calculated entry fields (keep typed field as-entered). */
const roundN = (n, d) => {
  if (!Number.isFinite(n)) return "0";
  const f = 10 ** d;
  return String(Math.round(n * f) / f);
};

/**
 * MVC MixConsignment.js rejection / selection sync:
 * IssueCarats -> Selection = Issue - Rejection
 * RejeP      -> Rejection = Issue * RejeP / 100 ; Selection = Issue - Rejection
 * Rejection  -> RejeP = Rejection * 100 / Issue ; Selection = Issue - Rejection
 * Selection  -> RejeP = 100 - (100 * Selection / Issue) ; Rejection = Issue * RejeP / 100
 * (back = RejeP / PurchaseBack, rtnCarats = Rejection, weight = SelectionCarat)
 */
const syncRejectionFields = (next, changedKey) => {
  const issueCarats = toNum(next.issueCarats);
  const rejPRaw = toNum(next.back);
  const rejectionRaw = toNum(next.rtnCarats);
  const selectionRaw = toNum(next.weight);

  let rejP = rejPRaw;
  let rejection = rejectionRaw;
  let selectionCarats = selectionRaw;

  if (changedKey === "issueCarats") {
    selectionCarats = issueCarats - rejectionRaw;
  } else if (changedKey === "back") {
    rejection = (issueCarats * rejPRaw) / 100;
    selectionCarats = issueCarats - rejection;
  } else if (changedKey === "rtnCarats") {
    rejP = issueCarats !== 0 ? (rejectionRaw * 100) / issueCarats : 0;
    selectionCarats = issueCarats - rejectionRaw;
  } else if (changedKey === "weight") {
    rejP = issueCarats !== 0 ? 100 - (100 * selectionRaw) / issueCarats : 0;
    rejection = (issueCarats * rejP) / 100;
  }

  return {
    ...next,
    back: changedKey === "back" ? next.back : roundN(rejP, 2),
    rtnCarats: changedKey === "rtnCarats" ? next.rtnCarats : roundN(rejection, 3),
    weight: changedKey === "weight" ? next.weight : roundN(selectionCarats, 3)
  };
};

const mapBasic = (list = []) =>
  (list || []).map((x) => ({
    value: String(getVal(x, "ID", "Id", "id") || getVal(x, "Name")),
    label: getVal(x, "Name", "TextName", "textName") || String(getVal(x, "ID"))
  }));

const mapBasicWithNameAsValue = (list = []) =>
  (list || []).map((x) => ({
    value: String(getVal(x, "Name", "TextName", "textName") || getVal(x, "ID")),
    label: getVal(x, "Name", "TextName", "textName") || String(getVal(x, "ID")),
    id: String(getVal(x, "ID", "Id", "id") || "")
  }));

const resolveSelectValue = (options = [], rawValue, ...fallbacks) => {
  const raw = rawValue ?? fallbacks.find((x) => x != null && x !== "");
  if (raw == null || raw === "") return "";
  const needle = String(raw).trim().toLowerCase();
  const matched = (options || []).find((o) => {
    const v = String(o?.value ?? "").trim().toLowerCase();
    const l = String(o?.label ?? "").trim().toLowerCase();
    const id = String(o?.id ?? "").trim().toLowerCase();
    return v === needle || l === needle || (id && id === needle);
  });
  return matched ? matched.value : String(raw);
};

const MixConsignmentForm = ({ mode = "add" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = mode === "edit";
  const editId = searchParams.get("Id") || searchParams.get("id") || "";
  const isView = String(searchParams.get("Mode") || searchParams.get("mode") || "").toLowerCase() === "view";
  const readOnly = isView;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subTypeOpts, setSubTypeOpts] = useState([]);
  const [categoryOpts, setCategoryOpts] = useState([]);
  const [currencyOpts, setCurrencyOpts] = useState([]);
  const [shapeOpts, setShapeOpts] = useState([]);
  const [colorOpts, setColorOpts] = useState([]);
  const [clarityOpts, setClarityOpts] = useState([]);
  const [sizeOpts, setSizeOpts] = useState([]);
  const [sieveOpts, setSieveOpts] = useState([]);
  const [groupOpts, setGroupOpts] = useState([]);
  const [productTypeOpts, setProductTypeOpts] = useState([]);

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addItemSubmitting, setAddItemSubmitting] = useState(false);
  const [addItemLotExists, setAddItemLotExists] = useState(false);
  const [addItemForm, setAddItemForm] = useState({
    lotNo: "",
    shapeId: "",
    colorId: "",
    clarityId: "",
    sizeId: "",
    sieveId: "",
    itemName: "",
    itemGroupID: "",
    publicCommnets: "",
    category: "Natural Diamond",
    instruction: "Polished",
    productType: "",
    certificateNo: "",
    pDollorRate: "0.00",
    purchaseRate: "0.00",
    masterCurrencyRate: "0.00",
    stoneTypes: "Single"
  });

  const [partyInput, setPartyInput] = useState("");
  const [partyOpts, setPartyOpts] = useState([]);
  const [partyLoading, setPartyLoading] = useState(false);
  const [party, setParty] = useState(null);

  const [commInput, setCommInput] = useState("");
  const [commOpts, setCommOpts] = useState([]);
  const [commLoading, setCommLoading] = useState(false);
  const [commission, setCommission] = useState(null);

  const [brokerInput, setBrokerInput] = useState("");
  const [brokerOpts, setBrokerOpts] = useState([]);
  const [brokerLoading, setBrokerLoading] = useState(false);
  const [broker, setBroker] = useState(null);

  const [lotInput, setLotInput] = useState("");
  const [lotOpts, setLotOpts] = useState([]);
  const [lotLoading, setLotLoading] = useState(false);
  const [lotSel, setLotSel] = useState(null);
  const fillFromLotRequestRef = useRef(0);

  const [mOp, setMOp] = useState("*");
  const [sOp, setSOp] = useState("*");
  const [editIndex, setEditIndex] = useState(-1);
  const [items, setItems] = useState([]);
  const [entry, setEntry] = useState(emptyItem());
  const [lotCheck, setLotCheck] = useState(false);

  const [excelOpen, setExcelOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [consignOpen, setConsignOpen] = useState(false);
  const [consignRows, setConsignRows] = useState([]);
  const [consignLotFilter, setConsignLotFilter] = useState("");
  const [consignSearch, setConsignSearch] = useState("");

  const [masterSymbol, setMasterSymbol] = useState("INR");
  const [stockSymbol, setStockSymbol] = useState("USD");

  useEffect(() => {
    const loadSymbols = async () => {
      const company = await getReportCompanySettings({ forceRefresh: false });
      setStockSymbol(company?.stockSymbol || getCachedReportCompany().stockSymbol || "USD");
      const auth = JSON.parse(sessionStorage.getItem("authUser") || localStorage.getItem("authUser") || "{}");
      setMasterSymbol(auth?.MSymbol || auth?.mSymbol || auth?.data?.MSymbol || "INR");
    };
    loadSymbols();
    const refresh = () => setStockSymbol(getCachedReportCompany().stockSymbol || "USD");
    window.addEventListener(REPORT_COMPANY_SETTINGS_EVENT, refresh);
    return () => window.removeEventListener(REPORT_COMPANY_SETTINGS_EVENT, refresh);
  }, []);

  const [header, setHeader] = useState({
    code: 0,
    trnDate: todayIso(),
    invNo: "",
    billNo: "",
    invType: "",
    subType: "",
    category: "",
    dueDays: 0,
    dueDate: todayIso(),
    curCode: "",
    baseRate: 1,
    sBaseRate: 1,
    adatPer: 0,
    adatAmount: 0,
    brokerPer: 0,
    brokerAmount: 0,
    description: "",
    consignmentNo: "",
    chkGrading: false,
    chkoldpur: false,
    plusMinusAmount: 0,
    roundAmount: 0,
    vatPer: 0,
    cgstPer: 0,
    sgstPer: 0,
    igstPer: 0,
    vatAmount: 0,
    cgstAmt: 0,
    sgstAmt: 0,
    igstAmt: 0,
    decimalPlaces: 2
  });

  const customStyles = useMemo(
    () => ({
      control: (p, s) => ({
        ...p,
        backgroundColor: s.isDisabled
          ? "var(--vz-input-disabled-bg, var(--vz-secondary-bg, #eff2f7))"
          : "var(--vz-secondary-bg, #fff)",
        borderColor: "var(--vz-border-color, #ced4da)",
        color: s.isDisabled
          ? "var(--vz-secondary-color, #878a99)"
          : "var(--vz-body-color, #495057)",
        minHeight: "31px",
        height: "31px",
        opacity: s.isDisabled ? 0.85 : 1
      }),
      valueContainer: (p) => ({ ...p, padding: "0 8px", height: "31px" }),
      indicatorsContainer: (p) => ({ ...p, height: "31px" }),
      input: (p) => ({ ...p, margin: 0, padding: 0 }),
      menu: (p) => ({
        ...p,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        color: "var(--vz-body-color, #495057)",
        border: "1px solid var(--vz-border-color, #dee2e6)",
        zIndex: 20
      }),
      option: (p, s) => ({
        ...p,
        backgroundColor: s.isFocused ? "#3b5de7" : "transparent",
        color: s.isFocused ? "#fff" : "var(--vz-body-color, #495057)",
        fontSize: "12px",
        cursor: "pointer",
        ":active": { backgroundColor: "#3b5de7" }
      }),
      placeholder: (p) => ({ ...p, color: "var(--vz-secondary-color, #878a99)", fontSize: "11px" }),
      singleValue: (p, s) => ({
        ...p,
        fontSize: "12px",
        color: s.isDisabled
          ? "var(--vz-secondary-color, #878a99)"
          : "var(--vz-body-color, #495057)"
      })
    }),
    []
  );

  const fieldH = { height: 31 };

  const searchAccounts = useCallback(async (term, setOpts, setLoad) => {
    if (!term || term.length < 2) {
      setOpts([]);
      return;
    }
    setLoad(true);
    try {
      const res = await getAccGrpMasters(term);
      if (res?.success || res?.Success) {
        const d = res.data || res.Data || [];
        setOpts(
          d.map((item) => ({
            value: String(item.accGrpCode || item.AccGrpCode || ""),
            label: item.accGrpName || item.AccGrpName || ""
          }))
        );
      }
    } catch {
      /* ignore */
    } finally {
      setLoad(false);
    }
  }, []);

  useEffect(() => {
    const tmr = setTimeout(() => searchAccounts(partyInput, setPartyOpts, setPartyLoading), 400);
    return () => clearTimeout(tmr);
  }, [partyInput, searchAccounts]);

  useEffect(() => {
    const tmr = setTimeout(() => searchAccounts(commInput, setCommOpts, setCommLoading), 400);
    return () => clearTimeout(tmr);
  }, [commInput, searchAccounts]);

  useEffect(() => {
    const tmr = setTimeout(() => searchAccounts(brokerInput, setBrokerOpts, setBrokerLoading), 400);
    return () => clearTimeout(tmr);
  }, [brokerInput, searchAccounts]);

  useEffect(() => {
    if (!lotInput || lotInput.trim().length < 1) {
      setLotOpts([]);
      return;
    }
    const tmr = setTimeout(async () => {
      setLotLoading(true);
      try {
        const res = await getMixConsignmentLots(lotInput);
        const opts = mapMixLotOptions(res);
        setLotOpts(opts);
      } catch (err) {
        console.error(err);
      } finally {
        setLotLoading(false);
      }
    }, 250);
    return () => clearTimeout(tmr);
  }, [lotInput]);

  const applyCurrencyRates = async (curCode, options = {}) => {
    if (!curCode) return;
    const preserveRates = !!options.preserveRates;
    try {
      const res = await getCurrencyRates(curCode);
      if (res?.success || res?.Success) {
        const base = toNum(res.baseRate ?? res.BaseRate, 1);
        const sBase = toNum(res.sBaseRate ?? res.SBaseRate, 1);
        const opM = getVal(res, "MasterCurrencyOperator", "masterCurrencyOperator") || "*";
        const opS = getVal(res, "StockCurrencyOperator", "stockCurrencyOperator") || "*";
        setMOp(opM);
        setSOp(opS);
        // On Edit, keep saved BaseRate/SBaseRate so GST amount recalculation matches MVC
        if (!preserveRates) {
          setHeader((prev) => ({ ...prev, baseRate: base, sBaseRate: sBase }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPageData = async () => {
    try {
      const res = await getMixConsignmentPageData();
      if (!(res?.success || res?.Success)) {
        toast.error(res?.Data || res?.data || t("Failed to load page data."));
        return null;
      }
      const d = res.Data || res.data || {};
      const subs = mapBasicWithNameAsValue(d.SubType || d.subType);
      const cats = mapBasicWithNameAsValue(d.Category || d.category);
      const curs = mapBasic(d.CurrencyList || d.currencyList);
      const shapes = mapBasicWithNameAsValue(d.Shape || d.shape);
      const colors = mapBasicWithNameAsValue(d.Color || d.color);
      const clarities = mapBasicWithNameAsValue(d.Clarity || d.clarity);
      const sizes = mapBasicWithNameAsValue(d.Size || d.size);
      const sieves = mapBasicWithNameAsValue(d.Sieve || d.sieve);
      const groups = mapBasicWithNameAsValue(d.ItemGroup || d.itemGroup);
      const productTypes = mapBasicWithNameAsValue(d.ProductType || d.productType);
      const defaultCurrencyCode = d.DefaultCurrencyCode || d.defaultCurrencyCode || "";
      setSubTypeOpts(subs);
      setCategoryOpts(cats);
      setCurrencyOpts(curs);
      setShapeOpts(shapes);
      setColorOpts(colors);
      setClarityOpts(clarities);
      setSizeOpts(sizes);
      setSieveOpts(sieves);
      setGroupOpts(groups);
      setProductTypeOpts(productTypes);
      return { types: INV_TYPE_OPTS, subs, cats, curs, shapes, colors, clarities, sizes, sieves, groups, productTypes, defaultCurrencyCode };
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load page data."));
      return null;
    }
  };

  const handleAddItemChange = (field, value) => {
    if (field === "stoneTypes") {
      if (value === "Parcel") {
        setAddItemForm((prev) => ({ ...prev, stoneTypes: value }));
        fetchAddItemParcelLotNo();
        return;
      }
      setAddItemForm((prev) => ({ ...prev, stoneTypes: value, lotNo: "" }));
      setAddItemLotExists(false);
      return;
    }

    setAddItemForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (["shapeId", "colorId", "clarityId", "sizeId"].includes(field)) {
        const parts = [
          updated.shapeId,
          updated.colorId,
          updated.sizeId,
          updated.clarityId
        ].filter(Boolean);
        updated.itemName = parts.join(" ");
      }
      return updated;
    });
  };

  const fetchAddItemParcelLotNo = useCallback(async () => {
    try {
      const res = await getMixConsignmentMixLotNoLM();
      const lotNo = res?.lotNo ?? res?.LotNo ?? res?.Data?.lotNo ?? res?.Data?.LotNo;
      if (lotNo) {
        setAddItemForm((prev) => ({ ...prev, lotNo }));
        setAddItemLotExists(false);
      } else {
        setAddItemForm((prev) => ({ ...prev, lotNo: "No Lot Found" }));
      }
    } catch (err) {
      console.error(err);
      setAddItemForm((prev) => ({ ...prev, lotNo: "Error fetching lot" }));
    }
  }, []);

  const openAddItemModal = () => {
    setAddItemOpen(true);
  };

  useEffect(() => {
    if (!addItemOpen) return;
    if (addItemForm.stoneTypes === "Parcel") {
      fetchAddItemParcelLotNo();
    }
  }, [addItemOpen, fetchAddItemParcelLotNo]);

  const handleAddItemLotBlur = async () => {
    if (!addItemForm.lotNo || !addItemForm.lotNo.trim()) return;
    try {
      const res = await checkLotNoExists(addItemForm.lotNo.trim());
      if (res?.success || res?.Success) {
        const exists = res.exists || res.Exists || false;
        setAddItemLotExists(exists);
        if (exists) {
          toast.warning(t("LotNo Already Exists"));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAddItem = async () => {
    if (!addItemForm.lotNo || !addItemForm.lotNo.trim()) {
      toast.error(t("Stock ID/ LotNo is required."));
      return;
    }
    if (addItemLotExists) {
      toast.error(t("LotNo Already Exists"));
      return;
    }
    setAddItemSubmitting(true);
    const savedForm = {
      ...addItemForm,
      lotNo: addItemForm.lotNo.trim()
    };
    try {
      const res = await addParcelItemMaster({
        ...savedForm,
        stoneTypes: savedForm.stoneTypes || "Single",
        weight: 0,
        pcs: 0,
        pDollorRate: toNum(savedForm.pDollorRate),
        purchaseRate: toNum(savedForm.purchaseRate),
        purchaseAmount: 0,
        masterCurrencyRate: toNum(savedForm.masterCurrencyRate),
        masterCurrencyAmount: 0
      });
      if (res?.success || res?.Success) {
        toast.success(res.message || res.Message || t("LotNo Created Successfully."));
        const newLot = savedForm.lotNo;
        const displayLabel =
          savedForm.itemName ||
          [savedForm.shapeId, savedForm.colorId, savedForm.sizeId, savedForm.clarityId].filter(Boolean).join(" ") ||
          newLot;
        const lotOption = { value: newLot, label: displayLabel };
        fillFromLotRequestRef.current += 1;
        setLotOpts((prev) => (prev.some((o) => o.value === newLot) ? prev : [lotOption, ...prev]));
        setLotSel(null);
        setEntry(emptyItem());
        setAddItemOpen(false);
        setAddItemForm({
          lotNo: "",
          shapeId: "",
          colorId: "",
          clarityId: "",
          sizeId: "",
          sieveId: "",
          itemName: "",
          itemGroupID: "",
          publicCommnets: "",
          category: "Natural Diamond",
          instruction: "Polished",
          productType: "",
          certificateNo: "",
          pDollorRate: "0.00",
          purchaseRate: "0.00",
          masterCurrencyRate: "0.00",
          stoneTypes: "Single"
        });
      } else {
        toast.error(res?.message || res?.Message || res?.data || res?.Data || t("Failed to save item."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Error saving item."));
    } finally {
      setAddItemSubmitting(false);
    }
  };

  const loadDetail = async (pageData = null) => {
    if (!editId) {
      toast.warning(t("Missing consignment Id."));
      return;
    }
    try {
      const res = await getMixConsignmentDetail(editId);
      if (!(res?.success || res?.Success)) {
        toast.error(res?.Data || res?.data || t("Consignment not found."));
        return;
      }
      const data = res.Data || res.data || {};
      const h = data.Header || data.header || {};
      const rows = data.Items || data.items || [];

      const partyOpt = getVal(h, "PartyCode")
        ? { value: String(getVal(h, "PartyCode")), label: getVal(h, "PartyName") || String(getVal(h, "PartyCode")) }
        : null;
      const commOpt = getVal(h, "AdatCode")
        ? { value: String(getVal(h, "AdatCode")), label: getVal(h, "AdatName") || String(getVal(h, "AdatCode")) }
        : null;
      const broOpt = getVal(h, "BrokerCode")
        ? { value: String(getVal(h, "BrokerCode")), label: getVal(h, "BrokerName") || String(getVal(h, "BrokerCode")) }
        : null;

      setParty(partyOpt);
      setCommission(commOpt);
      setBroker(broOpt);

      const trn = getVal(h, "TrnDate");
      const due = getVal(h, "DueDate");
      const invTypeRaw = getVal(h, "InvType", "Type", "TypeId", "TypeName");
      const subTypeRaw = getVal(h, "SubType", "SubTypeId", "SubTypeName");
      const categoryRaw = getVal(h, "Category", "CategoryId", "CategoryName");
      setHeader({
        code: toNum(getVal(h, "Code"), 0),
        trnDate: trn ? toLocalDateStr(trn) || todayIso() : todayIso(),
        invNo: getVal(h, "InvNo"),
        billNo: getVal(h, "BillNo"),
        invType: resolveSelectValue(INV_TYPE_OPTS, invTypeRaw) || "External",
        subType: resolveSelectValue(pageData?.subs || subTypeOpts, subTypeRaw),
        category: resolveSelectValue(pageData?.cats || categoryOpts, categoryRaw),
        dueDays: toNum(getVal(h, "DueDays"), 0),
        dueDate: due ? toLocalDateStr(due) || todayIso() : todayIso(),
        curCode: String(getVal(h, "CurCode") || ""),
        baseRate: toNum(getVal(h, "BaseRate"), 1),
        sBaseRate: toNum(getVal(h, "SBaseRate"), 1),
        adatPer: toNum(getVal(h, "AdatPer")),
        adatAmount: toNum(getVal(h, "AdatAmount")),
        brokerPer: toNum(getVal(h, "BrokerPer")),
        brokerAmount: toNum(getVal(h, "BrokerAmount")),
        // MVC Edit binds Description to InvDisc (#InvDisc); GetSalepurRecord also returns InvDisc
        description: getVal(h, "Description", "InvDisc"),
        consignmentNo: getVal(h, "ConsignmentNo"),
        chkGrading: !!(getVal(h, "chkGrading") === true || getVal(h, "chkGrading") === "true"),
        chkoldpur: !!(getVal(h, "chkoldpur") === true || getVal(h, "chkoldpur") === "true"),
        plusMinusAmount: toNum(getVal(h, "PlusMinusAmount")),
        roundAmount: toNum(getVal(h, "RoundAmount")),
        // Prefer getNumVal + aliases so camelCase JSON (cgstPer) and SP CGSTAmount are not read as 0
        vatPer: getNumVal(h, "VatPer", "VATPer", "Vat", "VatPercentage", "VatRate"),
        cgstPer: getNumVal(h, "CGSTPer", "CgstPer", "CGST", "CgstPercentage", "CGSTRate"),
        sgstPer: getNumVal(h, "SGSTPer", "SgstPer", "SGST", "SgstPercentage", "SGSTRate"),
        igstPer: getNumVal(h, "IGSTPer", "IgstPer", "IGST", "IgstPercentage", "IGSTRate"),
        vatAmount: getNumVal(h, "VatAmount", "VatAmt", "VATAmount"),
        cgstAmt: getNumVal(h, "CGSTAmt", "CGSTAmount", "CgstAmt"),
        sgstAmt: getNumVal(h, "SGSTAmt", "SGSTAmount", "SgstAmt"),
        igstAmt: getNumVal(h, "IGSTAmt", "IGSTAmount", "IgstAmt"),
        decimalPlaces: 2
      });

      setItems(rows.map((r, idx) => mapItemFromApi(r, idx)));

      // Only load currency operators on Edit — do not overwrite saved BaseRate/SBaseRate (or GST) with live rates
      const loadedCurCode = String(getVal(h, "CurCode") || "");
      if (loadedCurCode) {
        await applyCurrencyRates(loadedCurCode, { preserveRates: true });
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load consignment detail."));
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const page = await loadPageData();
      if (isEdit) {
        await loadDetail(page);
      } else if (page?.curs?.length) {
        const defaultCur = page.defaultCurrencyCode
          ? page.curs.find((c) => String(c.value) === String(page.defaultCurrencyCode))
          : null;
        const selectedCur = defaultCur || page.curs[0];
        setHeader((prev) => ({
          ...prev,
          invType: INV_TYPE_OPTS[0]?.value || "External",
          subType: "",
          category: page.cats[0]?.value || "",
          curCode: selectedCur.value
        }));
        await applyCurrencyRates(selectedCur.value);
      }
      setLoading(false);
    })();
  }, [isEdit, editId]);

  const setHeaderField = (key, value) => setHeader((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    const days = toNum(header.dueDays, 0);
    if (!header.trnDate) return;
    const d = new Date(header.trnDate);
    if (Number.isNaN(d.getTime())) return;
    d.setDate(d.getDate() + days);
    setHeaderField("dueDate", d.toISOString().substr(0, 10));
  }, [header.trnDate, header.dueDays]);

  const recalcEntryAmount = (next) => {
    // MVC: Amount = SelectionCarat * Rate (+ Less1/2/3); Jewellery uses Pcs * Rate
    const amount = calcItemAmount(
      next.weight,
      next.rate,
      next.less1,
      next.less2,
      next.less3,
      next.pcs,
      next.stockType
    );
    return { ...next, amount: fmt(amount) };
  };

  const onEntryChange = (key, value) => {
    setEntry((prev) => {
      let next = { ...prev, [key]: value };
      // Stock currency rate for $Rate (MVC Calculate uses SBaseRate)
      const sRateBase = toNum(header.sBaseRate, 1) || toNum(header.baseRate, 1) || 1;

      // MVC: IssueCarats / RejeP / Rejection / SelectionCarat linked calculations
      if (["issueCarats", "back", "rtnCarats", "weight"].includes(key)) {
        next = syncRejectionFields(next, key);
      }

      // MVC Calculate(): Rate -> $Rate = Rate / SBaseRate; Amount from Selection * Rate
      // Do NOT overwrite Reje% (back) from MRP — back is Rejection %, not discount.
      if (key === "rate") {
        const rate = toNum(value);
        next.sRate = rate ? fmt(rate / sRateBase, 2) : "";
      }
      if (key === "sRate") {
        const sRate = toNum(value);
        const rate = sRate * sRateBase;
        next.rate = rate ? fmt(rate, 2) : "";
      }

      if (
        ["issueCarats", "back", "rtnCarats", "weight", "rate", "sRate", "pcs", "less1", "less2", "less3"].includes(
          key
        )
      ) {
        next = recalcEntryAmount(next);
      }

      return next;
    });
  };

  const fillFromLot = async (lotNo, fallbackForm = null) => {
    if (!lotNo) return;
    const requestId = ++fillFromLotRequestRef.current;
    const opts = { shapeOpts, colorOpts, clarityOpts, sizeOpts, sieveOpts };
    const fallbackEntry = fallbackForm
      ? buildEntryFromAddItemForm(fallbackForm, lotNo, header, opts)
      : null;

    const applyEntry = (entry) => {
      if (requestId !== fillFromLotRequestRef.current) return;
      setEntry({ ...entry, lotNo });
    };

    for (let attempt = 0; attempt < 3; attempt++) {
      if (requestId !== fillFromLotRequestRef.current) return;
      try {
        const res = await getMixConsignmentLotDetail(lotNo);
        if (requestId !== fillFromLotRequestRef.current) return;
        if (res?.success || res?.Success) {
          const rows = res.Data || res.data || [];
          const lot = Array.isArray(rows) ? rows[0] : rows;
          if (lot) {
            applyEntry(mergeEntryWithFallback(mapLotDetailToEntry(lot, lotNo, opts), fallbackEntry));
            return;
          }
        } else if (!fallbackEntry && attempt === 2) {
          toast.warning(res?.Data || res?.data || t("Lot detail not found."));
          return;
        }
      } catch (err) {
        console.error(err);
        if (!fallbackEntry && attempt === 2) {
          toast.error(t("Failed to load lot detail."));
          return;
        }
      }
      if (attempt < 2) await sleep(350);
    }

    if (fallbackEntry) applyEntry(fallbackEntry);
  };

  const handleAddItem = () => {
    const lotNo = (lotSel?.value || entry.lotNo || "").toString().trim();
    const weight = toNum(entry.weight);
    const rate = toNum(entry.rate);
    const back = toNum(entry.back);
    const mrp = toNum(entry.mrp);
    const issueCarats = toNum(entry.issueCarats) || weight;
    const rtnCarats = toNum(entry.rtnCarats);

    if (!lotNo) {
      toast.warning(t("Lot Number is required."));
      return;
    }
    if (weight <= 0 && String(entry.stockType || "").toLowerCase() !== "jewellery") {
      toast.warning(t("Carat is invalid."));
      return;
    }
    if (rate === 0 && back === 0) {
      toast.warning(t("Rate and Discount both can not be 0."));
      return;
    }

    // MVC AddItem: PurchaseBack = RejeP; Weight = SelectionCarat; ReturnCarats = Reje
    const amount = calcItemAmount(weight, rate, entry.less1, entry.less2, entry.less3, entry.pcs, entry.stockType);

    const row = {
      ...entry,
      lotNo,
      itemName: entry.itemName || lotSel?.label || "",
      weight: Math.round(weight * 1000) / 1000,
      issueCarats: Math.round(issueCarats * 1000) / 1000,
      pcs: toNum(entry.pcs, 1),
      mrp,
      back: Math.round(back * 100) / 100,
      rate,
      less1: toNum(entry.less1),
      less2: toNum(entry.less2),
      less3: toNum(entry.less3),
      amount,
      sieve: entry.sieve || "",
      stockType: entry.stockType || "Diamond",
      memoTransCode: toNum(entry.memoTransCode),
      rtnCarats: Math.round(rtnCarats * 1000) / 1000,
      status: entry.status || "",
      spCarats: toNum(entry.spCarats)
    };

    setItems((prev) => {
      if (editIndex >= 0 && editIndex < prev.length) {
        const copy = [...prev];
        copy[editIndex] = row;
        return copy;
      }
      if (prev.some((x) => String(x.lotNo).toLowerCase() === lotNo.toLowerCase())) {
        toast.warning(t(`Lot number ${lotNo} already exists.`));
        return prev;
      }
      return [...prev, row];
    });
    setEditIndex(-1);
    setLotSel(null);
    setEntry(emptyItem());
  };

  const handleEditRow = (idx) => {
    const r = items[idx];
    if (!r) return;
    setEditIndex(idx);
    setLotSel({ value: r.lotNo, label: r.lotNo });
    setEntry({ ...emptyItem(), ...r });
  };

  const handleDeleteRow = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    if (editIndex === idx) {
      setEditIndex(-1);
      setEntry(emptyItem());
      setLotSel(null);
    }
  };

  const totals = useMemo(() => {
    let totCts = 0;
    let totAmount = 0;
    let totMrp = 0;
    let totWithoutLess = 0;
    items.forEach((r) => {
      const w = toNum(r.weight);
      totCts += w;
      totAmount += toNum(r.amount);
      totMrp += w * toNum(r.mrp);
      totWithoutLess += w * toNum(r.rate);
    });
    return {
      totCts: Math.round(totCts * 1000) / 1000,
      totAmount: Math.round(totAmount * 100) / 100,
      totMrp,
      totWithoutLess,
      avgMrp: totCts === 0 ? 0 : totMrp / totCts,
      avgRate: totCts === 0 ? 0 : totWithoutLess / totCts,
      avgBack: totMrp === 0 ? 0 : (totWithoutLess / totMrp) * 100 - 100
    };
  }, [items]);

  const summary = useMemo(() => {
    const deci = Math.min(4, Math.max(0, toNum(header.decimalPlaces, 2)));
    const fix = (n) => toNum(n).toFixed(deci);
    const netAmount = totals.totAmount;
    const baseRate = toNum(header.baseRate, 1) || 1;
    const stockCurRate = toNum(header.sBaseRate, 1) || 1;
    const comPer = toNum(header.adatPer);
    const broPer = toNum(header.brokerPer);

    let comAmount = 0;
    let tempAmount = netAmount;
    if (comPer !== 0) {
      comAmount = (netAmount * comPer) / 100;
      tempAmount = netAmount - comAmount;
    }
    const comDisplay = mOp === "/" ? comAmount / baseRate : comAmount * baseRate;

    let broAmount = 0;
    if (broPer !== 0) broAmount = (tempAmount * broPer) / 100;
    const broDisplay = mOp === "/" ? broAmount / baseRate : broAmount * baseRate;

    const plusMinus = toNum(header.plusMinusAmount);
    const roundAmount = toNum(header.roundAmount);
    const taxableAmount = netAmount + plusMinus;
    const mCurAmount = mOp === "/" ? taxableAmount / baseRate : taxableAmount * baseRate;

    const vatAmt = Math.round(mCurAmount * (toNum(header.vatPer) / 100) * 100) / 100;
    const cgstAmt = Math.round(mCurAmount * (toNum(header.cgstPer) / 100) * 100) / 100;
    const sgstAmt = Math.round(mCurAmount * (toNum(header.sgstPer) / 100) * 100) / 100;
    const igstAmt = Math.round(mCurAmount * (toNum(header.igstPer) / 100) * 100) / 100;
    const taxTotal = vatAmt + cgstAmt + sgstAmt + igstAmt;
    const finalMAmount = mCurAmount + taxTotal;

    let receivableAmount =
      mOp === "/"
        ? (mCurAmount + taxTotal + roundAmount) * baseRate
        : (mCurAmount + taxTotal + roundAmount) / baseRate;

    let finalSAmount = sOp === "/" ? (stockCurRate !== 0 ? receivableAmount / stockCurRate : 0) : receivableAmount * stockCurRate;

    return {
      comDisplay: formatCommissionDisplay(comDisplay, false),
      broDisplay: Math.round(broDisplay * 100) / 100,
      netAmount: fix(taxableAmount),
      netMAmount: fix(mCurAmount),
      vatAmt,
      cgstAmt,
      sgstAmt,
      igstAmt,
      finalMAmount: fix(finalMAmount),
      finalSAmount: fix(finalSAmount),
      finalMPayRecAmount: fix(receivableAmount)
    };
  }, [totals.totAmount, header, mOp, sOp, masterSymbol, stockSymbol, currencyOpts]);

  // MVC #CommissionAmount.change → reverse-calc AdatPer (Commission %)
  const [comAmtEdit, setComAmtEdit] = useState(null);
  const applyCommissionAmount = (rawValue) => {
    const adatPer = calcCommissionPerFromAmount({
      enteredComAmount: rawValue,
      netAmount: totals.totAmount,
      baseRate: header.baseRate,
      mOp
    });
    setHeaderField("adatPer", adatPer);
  };


  useEffect(() => {
    setHeader((prev) => ({
      ...prev,
      adatAmount: summary.comDisplay,
      brokerAmount: summary.broDisplay,
      vatAmount: summary.vatAmt,
      cgstAmt: summary.cgstAmt,
      sgstAmt: summary.sgstAmt,
      igstAmt: summary.igstAmt
    }));
  }, [summary.comDisplay, summary.broDisplay, summary.vatAmt, summary.cgstAmt, summary.sgstAmt, summary.igstAmt]);

  const parseCsv = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const idx = (names) => headers.findIndex((h) => names.includes(h));
    const iLot = idx(["lotno", "lot no", "lot", "stockno", "stock #"]);
    const iName = idx(["itemname", "item name", "description", "item"]);
    const iWt = idx(["weight", "carat", "cts", "wt"]);
    const iPcs = idx(["pcs", "qty", "quantity"]);
    const iMrp = idx(["mrp"]);
    const iBack = idx(["back", "purchaseback", "discount"]);
    const iRate = idx(["rate", "purchaserate", "price"]);
    const iL1 = idx(["less1"]);
    const iL2 = idx(["less2"]);
    const iL3 = idx(["less3"]);
    const iShape = idx(["shape"]);
    const iColor = idx(["color"]);
    const iClarity = idx(["clarity"]);

    const cell = (cols, i) => (i >= 0 ? (cols[i] || "").replace(/^"|"$/g, "").trim() : "");

    return lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      const weight = toNum(cell(cols, iWt));
      const rate = toNum(cell(cols, iRate));
      const less1 = toNum(cell(cols, iL1));
      const less2 = toNum(cell(cols, iL2));
      const less3 = toNum(cell(cols, iL3));
      return {
        lotNo: cell(cols, iLot),
        itemName: cell(cols, iName),
        weight,
        pcs: toNum(cell(cols, iPcs), 1),
        mrp: toNum(cell(cols, iMrp)),
        back: toNum(cell(cols, iBack)),
        rate,
        less1,
        less2,
        less3,
        amount: calcItemAmount(weight, rate, less1, less2, less3),
        shape: cell(cols, iShape),
        color: cell(cols, iColor),
        clarity: cell(cols, iClarity),
        size: "",
        polish: "",
        symmetry: "",
        fl: "",
        lab: "",
        certificateNo: "",
        memoTransCode: 0,
        rtnCarats: 0
      };
    }).filter((r) => r.lotNo);
  };

  const handleExcelAccept = () => {
    if (!excelFile) {
      toast.warning(t("Please select a file."));
      return;
    }
    const name = (excelFile.name || "").toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      toast.warning(t("XLSX not supported. Please upload CSV (SheetJS not installed)."));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCsv(String(e.target?.result || ""));
        if (!rows.length) {
          toast.warning(t("No valid rows found in CSV."));
          return;
        }
        setItems((prev) => {
          const map = new Map(prev.map((x) => [String(x.lotNo).toLowerCase(), x]));
          rows.forEach((r) => map.set(String(r.lotNo).toLowerCase(), r));
          return Array.from(map.values());
        });
        toast.success(t("Excel Import Success!"));
        setExcelOpen(false);
        setExcelFile(null);
      } catch (err) {
        console.error(err);
        toast.error(t("Failed to parse CSV."));
      }
    };
    reader.readAsText(excelFile);
  };

  const downloadTemplate = () => {
    const csv =
      "LotNo,ItemName,Weight,Pcs,MRP,Back,Rate,Less1,Less2,Less3,Shape,Color,Clarity\n" +
      "SAMPLE-001,ROUND D VS1,1.000,1,5000,-10,4500,0,0,0,ROUND,D,VS1\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MixConsignmentTemplate.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const viewConsignment = async () => {
    // MixPurchase-only: consignment-to-purchase fill is not used on MixConsignment entry.
    toast.info(t("Consignment fill is not available on Mix Consignment."));
  };

  /** MVC CtsCal: BalCts = Cts - Purchase (min 0); warn if Purchase > Cts */
  const updateConsignPurchase = (idx, purchaseRaw) => {
    setConsignRows((prev) =>
      prev.map((x, i) => {
        if (i !== idx) return x;
        const purchase = toNum(purchaseRaw);
        const total = toNum(x.cts);
        if (purchase > total) {
          toast.warning(t("PurCts should not be greater than TotalCts"));
        }
        let balance = total - purchase;
        if (balance < 0) balance = 0;
        return { ...x, purchase: purchaseRaw, balCts: Math.round(balance * 1000) / 1000 };
      })
    );
  };

  /** MVC btnCheckLot: filter/select by entered lot nos; unmatched purchase=0 */
  const showCheckLotNo = () => {
    const lotFilterList = consignLotFilter
      .split(/\r?\n/)
      .map((x) => x.trim().toUpperCase())
      .filter(Boolean);

    setConsignRows((prev) =>
      prev.map((x) => {
        const lotNo = String(x.lotNo || "").trim().toUpperCase();
        if (!lotFilterList.length) {
          return x;
        }
        if (lotFilterList.includes(lotNo)) {
          const purchase = toNum(x.originalPurchase);
          const bal = Math.max(0, toNum(x.cts) - purchase);
          return {
            ...x,
            selected: true,
            purchase,
            balCts: Math.round(bal * 1000) / 1000
          };
        }
        return {
          ...x,
          selected: false,
          purchase: 0,
          balCts: Math.round(toNum(x.cts) * 1000) / 1000
        };
      })
    );
  };

  const toggleConsignSelectAll = (checked) => {
    setConsignRows((prev) => prev.map((x) => ({ ...x, selected: checked })));
  };

  const filteredConsignRows = useMemo(() => {
    const q = consignSearch.trim().toLowerCase();
    if (!q) return consignRows.map((r, idx) => ({ ...r, _idx: idx }));
    return consignRows
      .map((r, idx) => ({ ...r, _idx: idx }))
      .filter((r) => {
        const hay = [r.date, r.memoNo, r.lotNo, r.itemName, r.symbol, r.stockType, r.memoTransCode]
          .map((v) => String(v ?? "").toLowerCase())
          .join(" ");
        return hay.includes(q);
      });
  }, [consignRows, consignSearch]);

  const consignToPurchase = () => {
    const selected = consignRows.filter((r) => r.selected && toNum(r.purchase) > 0);
    if (!selected.length) {
      toast.warning(t("Select at least one consignment row."));
      return;
    }
    setItems((prev) => {
      const next = [...prev];
      selected.forEach((r) => {
        const lotNo = r.lotNo;
        // MVC MixConsignmentToMixConsignment: IssueCarats = Weight = Purchase; Rate = PurchaseRate
        const weight = toNum(r.purchase);
        const rate = toNum(r.rate);
        const row = {
          ...emptyItem(),
          lotNo,
          itemName: r.itemName,
          weight,
          issueCarats: weight,
          pcs: 1,
          mrp: toNum(r.mrp),
          back: 0,
          rate,
          sRate: "",
          less1: 0,
          less2: 0,
          less3: 0,
          amount: calcItemAmount(weight, rate, 0, 0, 0, 1, r.stockType || "Diamond"),
          shape: "",
          color: "",
          clarity: "",
          size: "",
          sieve: "",
          stockType: r.stockType || "Diamond",
          memoTransCode: toNum(r.memoTransCode),
          rtnCarats: toNum(r.rtn)
        };
        const idx = next.findIndex((x) => String(x.lotNo).toLowerCase() === String(lotNo).toLowerCase());
        if (idx >= 0) next[idx] = row;
        else next.push(row);
      });
      return next;
    });
    setConsignOpen(false);
    toast.success(t("Consignment items added."));
  };

  const buildPayload = () => {
    const salePur = {
      Code: toNum(header.code),
      TrnDate: header.trnDate,
      Mode: "MemoIn",
      chkGrading: !!header.chkGrading,
      chkoldpur: !!header.chkoldpur,
      DueDays: toNum(header.dueDays),
      DueDate: header.dueDate,
      InvNo: header.invNo,
      BillNo: header.billNo,
      InvType: header.invType,
      SubType: header.subType,
      Category: header.category,
      CurCode: toNum(header.curCode),
      BaseRate: toNum(header.baseRate),
      SBaseRate: toNum(header.sBaseRate),
      PartyCode: toNum(party?.value),
      PartyName: party?.label || "",
      AdatCode: commission?.value ? toNum(commission.value) : null,
      AdatName: commission?.label || "",
      AdatPer: toNum(header.adatPer),
      AdatAmount: toNum(summary.comDisplay),
      BrokerCode: broker?.value ? toNum(broker.value) : null,
      BrokerName: broker?.label || "",
      BrokerPer: toNum(header.brokerPer),
      BrokerAmount: toNum(summary.broDisplay),
      // MVC save uses InvDisc (#InvDisc) for header Description
      InvDisc: header.description,
      Description: header.description,
      ConsignmentNo: header.consignmentNo,
      TotCts: totals.totCts,
      TotAmount: totals.totAmount,
      PlusMinusAmount: toNum(header.plusMinusAmount),
      NetAmount: toNum(summary.netAmount),
      NetMAmount: toNum(summary.netMAmount),
      RoundAmount: toNum(header.roundAmount),
      FinalMAmount: toNum(summary.finalMAmount),
      FinalMPayRecAmount: toNum(summary.finalMPayRecAmount),
      VatPer: toNum(header.vatPer),
      VatAmount: toNum(summary.vatAmt),
      CGSTPer: toNum(header.cgstPer),
      CGSTAmt: toNum(summary.cgstAmt),
      SGSTPer: toNum(header.sgstPer),
      SGSTAmt: toNum(summary.sgstAmt),
      IGSTPer: toNum(header.igstPer),
      IGSTAmt: toNum(summary.igstAmt)
    };

    const payloadItems = items.map((r, i) => ({
      SrNo: i + 1,
      LotNo: r.lotNo,
      ItemName: r.itemName,
      Shape: r.shape,
      ShapeId: r.shape,
      PShape: r.shape,
      Size: r.size,
      PSize: r.size,
      Color: r.color,
      ColorId: r.color,
      PColor: r.color,
      Clarity: r.clarity,
      ClarityId: r.clarity,
      PClarity: r.clarity,
      Sieve: r.sieve,
      SieveId: r.sieve,
      PSieve: r.sieve,
      Weight: toNum(r.weight),
      Carats: toNum(r.weight),
      IssueCarats: toNum(r.issueCarats) || toNum(r.weight),
      Pcs: toNum(r.pcs, 1),
      MRP: toNum(r.mrp),
      PurchaseBack: toNum(r.back),
      PurchaseRate: toNum(r.rate),
      Rate: toNum(r.rate),
      PurAmount: toNum(r.amount),
      Amount: toNum(r.amount),
      Less1: toNum(r.less1),
      Less2: toNum(r.less2),
      Less3: toNum(r.less3),
      MemoTransCode: toNum(r.memoTransCode),
      RtnCarats: toNum(r.rtnCarats),
      ReturnCarats: toNum(r.rtnCarats),
      SpCarats: toNum(r.spCarats),
      Status: r.status || "",
      StockType: r.stockType || "Diamond",
      InvDescription: r.invDescription || "",
      SuppLotNo: r.suppLotNo || "",
      AskingRate: toNum(r.askingRate),
      ActualRate: toNum(r.actualRate),
      GroupId: r.groupId || "",
      StoneType: r.stoneType || "",
      RMK: r.rmk || "",
      MemberRemarks: r.rmk || ""
    }));

    return { SalePur: salePur, Items: payloadItems };
  };

  const handleNew = () => {
    if (isEdit) {
      navigate("/MixConsignment/add-MixConsignment");
    } else {
      setHeader({
        code: 0,
        trnDate: todayIso(),
        invNo: "",
        billNo: "",
        invType: INV_TYPE_OPTS[0]?.value || "External",
        subType: subTypeOpts[0]?.value || "PURCHASE",
        category: categoryOpts[0]?.value || "",
        dueDays: 0,
        dueDate: todayIso(),
        curCode: currencyOpts[0]?.value || "1",
        baseRate: 1,
        sBaseRate: 1,
        adatPer: 0,
        brokerPer: 0,
        description: "",
        consignmentNo: "",
        plusMinusAmount: 0,
        cgstPer: 0,
        sgstPer: 0,
        igstPer: 0,
        chkGrading: false,
        chkoldpur: false
      });
      setItems([]);
      setEntry(emptyEntry);
      setParty(null);
      setCommission(null);
      setBroker(null);
      setLotSel(null);
      setEditIndex(-1);
      toast.info(t("Form reset for new transaction."));
    }
  };

  const handleSubmit = async () => {
    if (readOnly) return;
    if (!party?.value) {
      toast.warning(t("Please select Party."));
      return;
    }
    if (!items.length) {
      toast.warning(t("Please add at least one item."));
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      const res = isEdit ? await editMixConsignment(payload) : await addMixConsignment(payload);
      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || t("Saved successfully."));
        navigate("/mixconsignmentform/mixconsignmentformlist", {
          state: { successMessage: res?.Data || res?.data || t("Saved successfully.") }
        });
      } else {
        toast.warning(res?.Data || res?.data || t("Save failed."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Save failed."));
    } finally {
      setSaving(false);
    }
  };

  const title = isView ? t("View Mix Consignment") : isEdit ? t("Edit Mix Consignment") : t("Add Mix Consignment");
  document.title = `${title} | ${t("Admin")}`;

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center text-muted py-5">{t("Loading...")}</div>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={title} pageTitle={t("Mix Consignment")} />

          {/* TOP SECTION: Left (Header Fields Form Card) + Right (Summary Card) */}
          <Row className="g-3 mb-3">
            {/* LEFT: Main Purchase Header Form Card */}
            <Col xs={12} lg={9}>
              <Card className="shadow-sm border-0 rounded-3 mb-0 h-100">
                <CardHeader className="bg-transparent border-bottom d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 py-2 px-3">
                  <h5
                    className="mb-0 fw-bold text-primary text-nowrap d-flex align-items-center gap-2"
                    style={{ fontSize: "clamp(14px, 2.5vw, 16px)", lineHeight: "1.4" }}
                  >
                    <i className="ri-shopping-bag-3-line fs-18 flex-shrink-0 text-primary" />
                    <span>{title}</span>
                  </h5>
                  <div className="d-flex gap-2 flex-wrap align-items-center w-100 w-sm-auto justify-content-start justify-content-sm-end">
                    <Button
                      color="primary"
                      outline
                      size="sm"
                      className="btn-outline-primary flex-fill flex-sm-grow-0 text-nowrap"
                      onClick={() => navigate("/reports/utility/get-lab-data")}
                    >
                      {t("Get Lab Data")}
                    </Button>
                    {!readOnly && (
                      <Button
                        color="primary"
                        outline
                        size="sm"
                        className="btn-outline-primary flex-fill flex-sm-grow-0 text-nowrap"
                        onClick={() => setExcelOpen(true)}
                      >
                        {t("Import Excel")}
                      </Button>
                    )}
                    {isEdit && header.invNo && (
                      <Button
                        color="soft-info"
                        size="sm"
                        className="flex-fill flex-sm-grow-0 text-nowrap"
                        onClick={() =>
                          window.open(
                            `/MixConsignment/MixConsignmentPrintInv?ID=${encodeURIComponent(header.code || editId)}`,
                            "_blank"
                          )
                        }
                      >
                        <i className="ri-printer-line me-1" />
                        {t("Current Status Invoice")}
                      </Button>
                    )}
                    <Link to="/mixconsignmentform/mixconsignmentformlist" className="btn btn-soft-secondary btn-sm flex-fill flex-sm-grow-0 text-nowrap text-center">
                      {t("Back")}
                    </Link>
                    {!readOnly && (
                      <Button color="primary" size="sm" className="flex-fill flex-sm-grow-0 text-nowrap" disabled={saving} onClick={handleSubmit}>
                        {saving ? t("Saving...") : t("Submit")}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="pb-3 pt-3">
                  <fieldset disabled={readOnly} className="border-0 m-0 p-0" style={{ minWidth: 0 }}>
                    {/* Style block for large screen custom flex overrides */}
                    <style>{`
                      @media (min-width: 992px) {
                        .ie-r1-lot { flex: 0 0 28% !important; max-width: 28% !important; }
                        .ie-r1-name { flex: 0 0 15% !important; max-width: 15% !important; }
                        .ie-r1-spec { flex: 0 0 9% !important; max-width: 9% !important; }
                        .ie-r1-btn { flex: 0 0 12% !important; max-width: 12% !important; }

                        .ie-r2-carat { flex: 0 0 8% !important; max-width: 8% !important; }
                        .ie-r2-reje { flex: 0 0 7% !important; max-width: 7% !important; }
                        .ie-r2-rejection { flex: 0 0 8% !important; max-width: 8% !important; }
                        .ie-r2-selcarat { flex: 0 0 10% !important; max-width: 10% !important; }
                        .ie-r2-pcs { flex: 0 0 6% !important; max-width: 6% !important; }
                        .ie-r2-rate { flex: 0 0 8% !important; max-width: 8% !important; }
                        .ie-r2-srate { flex: 0 0 8% !important; max-width: 8% !important; }
                        .ie-r2-less { flex: 0 0 7% !important; max-width: 7% !important; }
                        .ie-r2-amt { flex: 0 0 24% !important; max-width: 24% !important; }

                        .ie-r3-memo { flex: 0 0 15% !important; max-width: 15% !important; }
                        .ie-r3-stock { flex: 0 0 15% !important; max-width: 15% !important; }
                      }
                    `}</style>

                    {/* Row 1: DATE, INVOICE NUMBER, BILL NO, TYPE, SUB TYPE, CATEGORY */}
                    <Row className="g-2 mb-2">
                      <Col xs={12} sm={6} md={4} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("DATE")}</Label>
                          <Input
                            type="date"
                            className="form-control-sm"
                            style={fieldH}
                            value={header.trnDate}
                            onChange={(e) => setHeaderField("trnDate", e.target.value)}
                            readOnly={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={4} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("INVOICE NUMBER")}</Label>
                          <Input
                            className="form-control-sm"
                            style={fieldH}
                            value={header.invNo}
                            readOnly={isEdit || readOnly}
                            onChange={(e) => setHeaderField("invNo", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={4} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("MEMO NUMBER")}</Label>
                          <Input
                            className="form-control-sm"
                            style={fieldH}
                            value={header.billNo}
                            onChange={(e) => setHeaderField("billNo", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={4} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("TYPE")}</Label>
                          <Select
                            styles={customStyles}
                            options={INV_TYPE_OPTS}
                            value={INV_TYPE_OPTS.find((o) => String(o.value) === String(header.invType)) || null}
                            onChange={(o) => setHeaderField("invType", o?.value || "")}
                            placeholder={t("Type")}
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={4} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("SUB TYPE")}</Label>
                          <Select
                            styles={customStyles}
                            options={subTypeOpts}
                            value={subTypeOpts.find((o) => String(o.value) === String(header.subType)) || null}
                            onChange={(o) => setHeaderField("subType", o?.value || "")}
                            placeholder={t("Select SubType")}
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={4} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("CATEGORY")}</Label>
                          <Select
                            styles={customStyles}
                            options={categoryOpts}
                            value={categoryOpts.find((o) => String(o.value) === String(header.category)) || null}
                            onChange={(o) => setHeaderField("category", o?.value || "")}
                            placeholder={t("Category")}
                            isClearable
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    {/* Row 2: PARTY [NEW], DUE DAYS, DUE DATE, CURRENCY, MasterRate (mOp), StockRate (sOp) */}
                    <Row className="g-2 mb-2">
                      <Col xs={12} sm={12} md={6} lg={4}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                            {t("PARTY")}{" "}
                            {!readOnly && (
                              <Link to="/account/add-accountgroup" className="ms-1 border border-primary text-primary px-1 rounded" style={{ fontSize: "10px", textDecoration: "none" }} target="_blank">
                                {t("NEW")}
                              </Link>
                            )}
                          </Label>
                          <Select
                            styles={customStyles}
                            options={partyOpts}
                            value={party}
                            onChange={setParty}
                            onInputChange={(v, meta) => {
                              if (meta.action === "input-change") setPartyInput(v);
                            }}
                            isLoading={partyLoading}
                            placeholder={t("Search Party")}
                            isClearable
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={3} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("DUE DAYS")}</Label>
                          <Input
                            type="number"
                            className="form-control-sm"
                            style={fieldH}
                            value={header.dueDays}
                            onChange={(e) => setHeaderField("dueDays", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={3} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("DUE DATE")}</Label>
                          <Input
                            type="date"
                            className="form-control-sm"
                            style={fieldH}
                            value={header.dueDate}
                            onChange={(e) => setHeaderField("dueDate", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={6} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("CURRENCY")}</Label>
                          <Select
                            styles={customStyles}
                            options={currencyOpts}
                            value={currencyOpts.find((o) => o.value === String(header.curCode)) || null}
                            onChange={async (o) => {
                              const code = o?.value || "";
                              setHeaderField("curCode", code);
                              await applyCurrencyRates(code);
                            }}
                            placeholder={t("Currency")}
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={3} md={3} lg={1}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                            {masterSymbol} <span className="text-danger">{mOp}</span>
                          </Label>
                          <Input
                            type="number"
                            className="form-control-sm"
                            style={fieldH}
                            value={header.baseRate}
                            onChange={(e) => setHeaderField("baseRate", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={3} md={3} lg={1}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                            {stockSymbol} <span className="text-danger">{sOp}</span>
                          </Label>
                          <Input
                            type="number"
                            className="form-control-sm"
                            style={fieldH}
                            value={header.sBaseRate}
                            onChange={(e) => setHeaderField("sBaseRate", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    {/* Row 3: COMM_AGENT, COM %, COM AMOUNT, Save Grading, Purchase of Last Year */}
                    <Row className="g-2 mb-2 align-items-end">
                      <Col xs={12} sm={12} md={6} lg={4}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("COMM_AGENT")}</Label>
                          <Select
                            styles={customStyles}
                            options={commOpts}
                            value={commission}
                            onChange={setCommission}
                            onInputChange={(v, meta) => {
                              if (meta.action === "input-change") setCommInput(v);
                            }}
                            isLoading={commLoading}
                            placeholder={t("Search Commission")}
                            isClearable
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={3} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("COM %")}</Label>
                          <Input
                            type="number"
                            className="form-control-sm"
                            style={fieldH}
                            value={header.adatPer}
                            onChange={(e) => setHeaderField("adatPer", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={3} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("COM AMOUNT")}</Label>
                          <Input
                            type="number"
                            className="form-control-sm"
                            style={fieldH}
                            value={comAmtEdit !== null ? comAmtEdit : fmt(summary.comDisplay)}
                            disabled={readOnly}
                            onFocus={() => setComAmtEdit(fmt(summary.comDisplay))}
                            onChange={(e) => setComAmtEdit(e.target.value)}
                            onBlur={() => {
                              if (comAmtEdit !== null) {
                                applyCommissionAmount(comAmtEdit);
                                setComAmtEdit(null);
                              }
                            }}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={6} lg={2} className="d-flex align-items-center mb-2 pb-1" style={{ height: "31px" }}>
                        <div className="form-check mb-0 d-flex align-items-center gap-1">
                          <Input
                            type="checkbox"
                            className="form-check-input"
                            id="chkGrading"
                            checked={!!header.chkGrading}
                            onChange={(e) => setHeaderField("chkGrading", e.target.checked)}
                            style={{ width: 16, height: 16, marginTop: 0 }}
                          />
                          <Label className="form-check-label fw-semibold text-nowrap d-flex align-items-center" htmlFor="chkGrading" style={{ fontSize: "11px", color: "#495057", marginBottom: 0, lineHeight: "1" }}>{t("Save Grading")}</Label>
                        </div>
                      </Col>
                      <Col xs={12} sm={6} md={6} lg={2} className="d-flex align-items-center mb-2 pb-1" style={{ height: "31px" }}>
                        <div className="form-check mb-0 d-flex align-items-center gap-1">
                          <Input
                            type="checkbox"
                            className="form-check-input"
                            id="chkoldpur"
                            checked={!!header.chkoldpur}
                            onChange={(e) => setHeaderField("chkoldpur", e.target.checked)}
                            style={{ width: 16, height: 16, marginTop: 0 }}
                          />
                          <Label className="form-check-label fw-semibold text-nowrap d-flex align-items-center justify-content-center" htmlFor="chkoldpur" style={{ fontSize: "11px", color: "#495057", marginBottom: 0, lineHeight: "1" }}>{t("Purchase of Last Year")}</Label>
                        </div>
                      </Col>
                    </Row>

                    {/* Row 4: BROKER, BRO %, BRO AMOUNT, DESCRIPTION */}
                    <Row className="g-2 mb-2">
                      <Col xs={12} sm={12} md={6} lg={4}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("BROKER")}</Label>
                          <Select
                            styles={customStyles}
                            options={brokerOpts}
                            value={broker}
                            onChange={setBroker}
                            onInputChange={(v, meta) => {
                              if (meta.action === "input-change") setBrokerInput(v);
                            }}
                            isLoading={brokerLoading}
                            placeholder={t("Search Broker")}
                            isClearable
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={3} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("BRO %")}</Label>
                          <Input
                            type="number"
                            className="form-control-sm"
                            style={fieldH}
                            value={header.brokerPer}
                            onChange={(e) => setHeaderField("brokerPer", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={3} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("BRO AMOUNT")}</Label>
                          <Input className="form-control-sm" style={fieldH} value={fmt(summary.broDisplay)} readOnly />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={12} md={12} lg={4}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("DESCRIPTION")}</Label>
                          <Input
                            className="form-control-sm"
                            style={fieldH}
                            value={header.description}
                            onChange={(e) => setHeaderField("description", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    {/* Description row ends above — no consignment-to-purchase fill for MixConsignment entry */}
                  </fieldset>
                </CardBody>
              </Card>
            </Col>

            {/* RIGHT: Summary Card (matching MVC top-right layout) */}
            <Col xs={12} lg={3}>
              <Card className="shadow-sm border-0 rounded-3 mb-0 h-100">
                <CardBody className="p-3">
                  <fieldset disabled={readOnly} className="border-0 m-0 p-0" style={{ minWidth: 0 }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-uppercase fw-semibold text-muted" style={{ fontSize: "11px" }}>{t("+/-AMOUNT")}</span>
                      <Input
                        type="number"
                        className="form-control-sm text-end"
                        style={{ width: "110px", height: "30px", fontSize: "12px" }}
                        value={header.plusMinusAmount}
                        onChange={(e) => setHeaderField("plusMinusAmount", e.target.value)}
                      />
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-uppercase fw-semibold text-muted" style={{ fontSize: "11px" }}>{t("NET AMOUNT")}</span>
                      <span className="fw-bold" style={{ fontSize: "13px" }}>{summary.netAmount}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="text-uppercase fw-semibold text-muted" style={{ fontSize: "11px" }}>{t("M. CURRENCY NET AMOUNT")}</span>
                      <span className="fw-bold" style={{ fontSize: "13px" }}>{summary.netMAmount}</span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2 gap-2">
                      <div className="d-flex align-items-center gap-1" style={{ flex: "1" }}>
                        <span className="text-uppercase fw-semibold text-muted" style={{ fontSize: "11px", minWidth: "45px" }}>CGST%</span>
                        <Input
                          type="number"
                          className="form-control-sm text-center"
                          style={{ height: "30px", fontSize: "12px" }}
                          value={header.cgstPer}
                          onChange={(e) => setHeaderField("cgstPer", e.target.value)}
                        />
                      </div>
                      <div className="d-flex align-items-center" style={{ flex: "1.2" }}>
                        <Input
                          className="form-control-sm text-end bg-light"
                          style={{ height: "30px", fontSize: "12px" }}
                          value={fmt(summary.cgstAmt)}
                          placeholder="CGST Amount"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2 gap-2">
                      <div className="d-flex align-items-center gap-1" style={{ flex: "1" }}>
                        <span className="text-uppercase fw-semibold text-muted" style={{ fontSize: "11px", minWidth: "45px" }}>SGST%</span>
                        <Input
                          type="number"
                          className="form-control-sm text-center"
                          style={{ height: "30px", fontSize: "12px" }}
                          value={header.sgstPer}
                          onChange={(e) => setHeaderField("sgstPer", e.target.value)}
                        />
                      </div>
                      <div className="d-flex align-items-center" style={{ flex: "1.2" }}>
                        <Input
                          className="form-control-sm text-end bg-light"
                          style={{ height: "30px", fontSize: "12px" }}
                          value={fmt(summary.sgstAmt)}
                          placeholder="SGST Amount"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
                      <div className="d-flex align-items-center gap-1" style={{ flex: "1" }}>
                        <span className="text-uppercase fw-semibold text-muted" style={{ fontSize: "11px", minWidth: "45px" }}>IGST%</span>
                        <Input
                          type="number"
                          className="form-control-sm text-center"
                          style={{ height: "30px", fontSize: "12px" }}
                          value={header.igstPer}
                          onChange={(e) => setHeaderField("igstPer", e.target.value)}
                        />
                      </div>
                      <div className="d-flex align-items-center" style={{ flex: "1.2" }}>
                        <Input
                          className="form-control-sm text-end bg-light"
                          style={{ height: "30px", fontSize: "12px" }}
                          value={fmt(summary.igstAmt)}
                          placeholder="IGST Amount"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-top">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-uppercase fw-semibold text-primary" style={{ fontSize: "11px" }}>{masterSymbol} FINAL AMOUNT</span>
                        <span className="fw-bold" style={{ fontSize: "13px" }}>{summary.finalMAmount}</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-uppercase fw-semibold text-primary" style={{ fontSize: "11px" }}>{stockSymbol} FINAL AMOUNT</span>
                        <span className="fw-bold" style={{ fontSize: "13px" }}>{summary.finalSAmount}</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="text-uppercase fw-semibold text-primary" style={{ fontSize: "11px" }}>{t("TRANSACTION FINAL AMOUNT")}</span>
                        <span className="fw-bold" style={{ fontSize: "13px" }}>{summary.finalMPayRecAmount}</span>
                      </div>
                    </div>
                  </fieldset>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* BOTTOM SECTION: Item Entry Card (Full width - Col 12) */}
          <Row className="g-3">
            <Col xs={12}>
              <Card className="shadow-sm border-0 rounded-3 mb-3">
                <CardBody className="p-3">
                  {!readOnly && (
                    <div className="mb-3">
                      {/* Item Entry Row 1: LOT NUMBER [ADD ITEM] [ ], ITEM NAME, SHAPE, COLOR, CLARITY, SIZE, SIEVE, Add Item */}
                      <Row className="g-2 align-items-end mb-2">
                        <Col xs={12} sm={6} md={4} className="ie-r1-lot">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {t("LOT NUMBER")}{" "}
                              <button
                                type="button"
                                className="ms-1 border border-primary text-primary px-1 rounded bg-transparent p-0"
                                style={{ fontSize: "10px", textDecoration: "none", cursor: "pointer" }}
                                onClick={openAddItemModal}
                              >
                                {t("ADD ITEM")}
                              </button>
                              <Input
                                type="checkbox"
                                className="form-check-input ms-2"
                                checked={lotCheck}
                                onChange={(e) => setLotCheck(e.target.checked)}
                                style={{ width: 16, height: 16, marginTop: 0, verticalAlign: "middle" }}
                              />
                            </Label>
                            <CreatableSelect
                              styles={customStyles}
                              options={lotOpts}
                              value={lotSel}
                              onChange={(o) => {
                                setLotSel(o);
                                onEntryChange("lotNo", o?.value || "");
                                if (o?.value) fillFromLot(o.value);
                              }}
                              onInputChange={(v, meta) => {
                                if (meta.action === "input-change") setLotInput(v);
                              }}
                              isLoading={lotLoading}
                              placeholder={t("Lot No")}
                              isClearable
                              isSearchable
                              filterOption={null}
                              noOptionsMessage={({ inputValue }) =>
                                lotLoading
                                  ? t("Searching...")
                                  : (inputValue || "").trim()
                                  ? t("No matching lot numbers")
                                  : t("Type to search lot numbers")
                              }
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={6} md={4} className="ie-r1-name">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("ITEM NAME")}</Label>
                            <Input
                              className="form-control-sm"
                              style={fieldH}
                              placeholder={t("Name")}
                              value={entry.itemName}
                              onChange={(e) => onEntryChange("itemName", e.target.value)}
                              readOnly
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={2} className="ie-r1-spec">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("SHAPE")}</Label>
                            <Select
                              styles={customStyles}
                              options={shapeOpts}
                              value={shapeOpts.find((o) => o.value === entry.shape) || null}
                              onChange={(o) => onEntryChange("shape", o?.value || "")}
                              placeholder={t("Shape")}
                              isClearable
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={2} className="ie-r1-spec">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("COLOR")}</Label>
                            <Select
                              styles={customStyles}
                              options={colorOpts}
                              value={colorOpts.find((o) => o.value === entry.color) || null}
                              onChange={(o) => onEntryChange("color", o?.value || "")}
                              placeholder={t("Color")}
                              isClearable
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={2} className="ie-r1-spec">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("CLARITY")}</Label>
                            <Select
                              styles={customStyles}
                              options={clarityOpts}
                              value={clarityOpts.find((o) => o.value === entry.clarity) || null}
                              onChange={(o) => onEntryChange("clarity", o?.value || "")}
                              placeholder={t("Clarity")}
                              isClearable
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={2} className="ie-r1-spec">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("SIZE")}</Label>
                            <Select
                              styles={customStyles}
                              options={sizeOpts}
                              value={sizeOpts.find((o) => o.value === entry.size) || null}
                              onChange={(o) => onEntryChange("size", o?.value || "")}
                              placeholder={t("Size")}
                              isClearable
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={2} className="ie-r1-spec">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("SIEVE")}</Label>
                            <Select
                              styles={customStyles}
                              options={sieveOpts}
                              value={sieveOpts.find((o) => o.value === entry.sieve) || null}
                              onChange={(o) => onEntryChange("sieve", o?.value || "")}
                              placeholder={t("Sieve")}
                              isClearable
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={2} className="ie-r1-btn d-none d-lg-block">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Button color="primary" size="sm" className="w-100 text-nowrap" style={fieldH} onClick={handleAddItem}>
                              {editIndex >= 0 ? t("Update Item") : t("Add Item")}
                            </Button>
                          </FormGroup>
                        </Col>
                      </Row>

                      {/* Item Entry Row 2: ISSUE CARATS, REJE%, REJECTION, SELECTED CARAT, PCS, RATE, $RATE, LESS1, LESS2, LESS3, AMOUNT */}
                      <Row className="g-2 align-items-end mb-2">
                        <Col xs={12} sm={4} md={2} className="ie-r2-carat">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("ISSUE CARATS")}</Label>
                            <Input
                              type="number"
                              className="form-control-sm"
                              style={fieldH}
                              value={entry.issueCarats}
                              onChange={(e) => onEntryChange("issueCarats", e.target.value)}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={2} className="ie-r2-reje">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("REJE%")}</Label>
                            <Input
                              type="number"
                              className="form-control-sm"
                              style={fieldH}
                              value={entry.back}
                              onChange={(e) => onEntryChange("back", e.target.value)}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={2} className="ie-r2-rejection">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("REJECTION")}</Label>
                            <Input
                              type="number"
                              className="form-control-sm"
                              style={fieldH}
                              value={entry.rtnCarats}
                              onChange={(e) => onEntryChange("rtnCarats", e.target.value)}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={3} className="ie-r2-selcarat">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("SELECTED CARAT")}</Label>
                            <Input
                              type="number"
                              className="form-control-sm"
                              style={fieldH}
                              value={entry.weight}
                              onChange={(e) => onEntryChange("weight", e.target.value)}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={1} className="ie-r2-pcs">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("PCS")}</Label>
                            <Input
                              type="number"
                              className="form-control-sm"
                              style={fieldH}
                              value={entry.pcs}
                              onChange={(e) => onEntryChange("pcs", e.target.value)}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={2} className="ie-r2-rate">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("RATE")}</Label>
                            <Input
                              type="number"
                              className="form-control-sm"
                              style={fieldH}
                              value={entry.rate}
                              onChange={(e) => onEntryChange("rate", e.target.value)}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={2} className="ie-r2-srate">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("$RATE")}</Label>
                            <Input
                              type="number"
                              className="form-control-sm"
                              style={fieldH}
                              value={entry.sRate}
                              onChange={(e) => onEntryChange("sRate", e.target.value)}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={2} className="ie-r2-less">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("LESS1")}</Label>
                            <Input
                              type="number"
                              className="form-control-sm"
                              style={fieldH}
                              value={entry.less1}
                              onChange={(e) => onEntryChange("less1", e.target.value)}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={2} className="ie-r2-less">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("LESS2")}</Label>
                            <Input
                              type="number"
                              className="form-control-sm"
                              style={fieldH}
                              value={entry.less2}
                              onChange={(e) => onEntryChange("less2", e.target.value)}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={4} md={2} className="ie-r2-less">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("LESS3")}</Label>
                            <Input
                              type="number"
                              className="form-control-sm"
                              style={fieldH}
                              value={entry.less3}
                              onChange={(e) => onEntryChange("less3", e.target.value)}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={6} md={4} className="ie-r2-amt">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("AMOUNT")}</Label>
                            <Input className="form-control-sm" style={fieldH} value={entry.amount} readOnly />
                          </FormGroup>
                        </Col>
                      </Row>

                      {/* Item Entry Row 3: ITEMDESCRIPTION, MEMOTRNCODE, STOCKTYPE + Mobile Add Item Button */}
                      <Row className="g-2 align-items-end">
                        <Col xs={12} sm={6} md={3} className="ie-r3-desc">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("ItemDescription")}</Label>
                            <Input className="form-control-sm" style={fieldH} placeholder={t("ItemDescription")} value={entry.invDescription || ""} onChange={(e) => onEntryChange("invDescription", e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={6} md={3} className="ie-r3-memo">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("MEMOTRNCODE")}</Label>
                            <Input className="form-control-sm bg-light" style={fieldH} placeholder={t("MemoTrnCode")} value={entry.memoTransCode || 0} readOnly />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={6} md={3} className="ie-r3-stock">
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("STOCKTYPE")}</Label>
                            <Input className="form-control-sm bg-light" style={fieldH} placeholder={t("StockType")} value={entry.stockType || "Diamond"} readOnly />
                          </FormGroup>
                        </Col>
                        <Col xs={12} className="d-block d-lg-none mt-2">
                          <Button color="primary" size="sm" className="w-100 text-nowrap py-2 fw-semibold" onClick={handleAddItem}>
                            <i className="ri-add-line me-1" />
                            {editIndex >= 0 ? t("Update Item") : t("Add Item")}
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {/* Grid Table */}
                  {items.length > 0 && (
                    <div className="table-responsive table-card mt-3 mb-0" style={{ overflowX: "auto" }}>
                      <Table className="table table-bordered table-hover table-sm align-middle mb-0" style={{ minWidth: 2200 }}>
                        <thead className="table-light">
                          <tr>
                            <th style={{ minWidth: 70 }}>{t("Action")}</th>
                            {PURCHASE_ITEM_COLUMNS.map((col) => (
                              <th
                                key={col.key}
                                className={col.align === "end" ? "text-end" : ""}
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {t(col.label)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((r, idx) => (
                            <tr key={`${r.lotNo}-${idx}`} style={getItemRowStyle(r)}>
                              <td>
                                {!readOnly ? (
                                  <div className="d-flex gap-1">
                                    <button
                                      type="button"
                                      className="btn btn-soft-primary btn-sm p-1"
                                      onClick={() => handleEditRow(idx)}
                                    >
                                      <i className="ri-pencil-line" />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-soft-danger btn-sm p-1"
                                      onClick={() => handleDeleteRow(idx)}
                                    >
                                      <i className="ri-delete-bin-line" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              {PURCHASE_ITEM_COLUMNS.map((col) => (
                                <td
                                  key={col.key}
                                  className={col.align === "end" ? "text-end" : ""}
                                  style={{ whiteSpace: "nowrap" }}
                                >
                                  {renderItemCell(r, col)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                        {items.length > 0 && (
                          <tfoot className="table-light fw-semibold">
                            <tr>
                              <td colSpan={3}>{t("Total")}</td>
                              {PURCHASE_ITEM_COLUMNS.slice(2).map((col) => (
                                <td
                                  key={col.key}
                                  className={col.align === "end" ? "text-end" : ""}
                                >
                                  {col.footer ? getItemFooterValue(col.footer, totals, items) : ""}
                                </td>
                              ))}
                            </tr>
                          </tfoot>
                        )}
                      </Table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>

        <Modal isOpen={excelOpen} toggle={() => setExcelOpen(false)} centered>
          <ModalHeader toggle={() => setExcelOpen(false)}>{t("Import File")}</ModalHeader>
          <ModalBody>
            <Label className="form-label">{t("Select File To Import")}</Label>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
            />
            <div className="mt-3">
              <Label className="form-label d-block">{t("Download Purchase File Format")}</Label>
              <Button color="primary" size="sm" onClick={downloadTemplate}>
                <i className="ri-download-2-line me-1" />
                {t("Download")}
              </Button>
              <div className="text-muted small mt-2">{t("CSV preferred (XLSX requires SheetJS).")}</div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="light" onClick={() => setExcelOpen(false)}>
              {t("Close")}
            </Button>
            <Button color="primary" onClick={handleExcelAccept}>
              {t("Accept")}
            </Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={consignOpen} toggle={() => setConsignOpen(false)} size="xl" centered>
          <ModalHeader toggle={() => setConsignOpen(false)}>{t("MixConsignment To MixConsignment")}</ModalHeader>
          <ModalBody>
            <Row className="g-3">
              <Col md={10}>
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <div className="text-muted small">
                    {t("Showing")} {filteredConsignRows.length} {t("of")} {consignRows.length} {t("entries")}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Input
                      type="text"
                      className="form-control form-control-sm"
                      style={{ maxWidth: 200 }}
                      placeholder={t("SEARCH:")}
                      value={consignSearch}
                      onChange={(e) => setConsignSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="table-responsive" style={{ maxHeight: "52vh", overflow: "auto" }}>
                  <Table className="table table-bordered table-sm align-middle mb-0" style={{ minWidth: 1050 }}>
                    <thead className="table-light align-middle text-nowrap">
                      <tr>
                        <th style={{ width: 36, whiteSpace: "nowrap" }}>
                          <Input
                            type="checkbox"
                            checked={consignRows.length > 0 && consignRows.every((r) => r.selected)}
                            onChange={(e) => toggleConsignSelectAll(e.target.checked)}
                          />
                        </th>
                        <th style={{ whiteSpace: "nowrap" }}>{t("Date")}</th>
                        <th style={{ whiteSpace: "nowrap" }}>{t("Consignment No")}</th>
                        <th style={{ whiteSpace: "nowrap" }}>{t("LotNo")}</th>
                        <th className="text-end" style={{ whiteSpace: "nowrap" }}>{t("Cts")}</th>
                        <th className="text-end" style={{ whiteSpace: "nowrap" }}>{t("Purchase")}</th>
                        <th className="text-end" style={{ whiteSpace: "nowrap" }}>{t("Return")}</th>
                        <th className="text-end" style={{ whiteSpace: "nowrap" }}>{t("BalCts")}</th>
                        <th className="text-end" style={{ whiteSpace: "nowrap" }}>{t("Rate")}</th>
                        <th style={{ whiteSpace: "nowrap" }}>{t("Cur")}</th>
                        <th style={{ whiteSpace: "nowrap" }}>{t("MemoTrnCode")}</th>
                        <th style={{ whiteSpace: "nowrap" }}>{t("ItemName")}</th>
                      </tr>
                    </thead>
                    <tbody className="align-middle text-nowrap">
                      {filteredConsignRows.map((r) => (
                        <tr key={r.key}>
                          <td>
                            <Input
                              type="checkbox"
                              checked={!!r.selected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setConsignRows((prev) =>
                                  prev.map((x, i) => (i === r._idx ? { ...x, selected: checked } : x))
                                );
                              }}
                            />
                          </td>
                          <td>{r.date}</td>
                          <td>{r.memoNo}</td>
                          <td>{r.lotNo}</td>
                          <td className="text-end">{fmt(r.cts, 2)}</td>
                          <td>
                            <Input
                              type="number"
                              className="form-control-sm text-end"
                              style={{ height: 28, minWidth: 75 }}
                              value={r.purchase}
                              onChange={(e) => updateConsignPurchase(r._idx, e.target.value)}
                            />
                          </td>
                          <td className="text-end">{fmt(r.rtn, 2)}</td>
                          <td className="text-end">{fmt(r.balCts, 3)}</td>
                          <td>
                            <Input
                              type="number"
                              className="form-control-sm text-end"
                              style={{ height: 28, minWidth: 85 }}
                              value={r.rate}
                              onChange={(e) =>
                                setConsignRows((prev) =>
                                  prev.map((x, i) => (i === r._idx ? { ...x, rate: e.target.value } : x))
                                )
                              }
                            />
                          </td>
                          <td>{r.symbol}</td>
                          <td>{r.memoTransCode}</td>
                          <td>{r.itemName}</td>
                        </tr>
                      ))}
                      {!filteredConsignRows.length && (
                        <tr>
                          <td colSpan={12} className="text-center text-muted py-3">
                            {t("No records")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Col>
              <Col md={2}>
                <Label className="form-label fw-bold small">{t("Enter Lot No")}</Label>
                <Input
                  type="textarea"
                  rows={8}
                  placeholder={t("Enter Lot No")}
                  value={consignLotFilter}
                  onChange={(e) => setConsignLotFilter(e.target.value)}
                />
                <Button color="primary" size="sm" className="w-100 mt-2" onClick={showCheckLotNo}>
                  {t("Show Check LotNo")}
                </Button>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="py-2">
            <Button color="light" size="sm" onClick={() => setConsignOpen(false)}>
              {t("Close")}
            </Button>
            <Button color="primary" size="sm" onClick={consignToPurchase}>
              {t("MixConsignment To MixConsignment")}
            </Button>
          </ModalFooter>
        </Modal>

        {/* Add Parcel Item Modal */}
        <Modal isOpen={addItemOpen} toggle={() => setAddItemOpen(!addItemOpen)} size="xl" centered>
          <ModalHeader toggle={() => setAddItemOpen(false)}>
            {t("Add Item")}
          </ModalHeader>
          <ModalBody>
            {/* Row 1: Stock ID / LotNo */}
            <Row className="mb-3">
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>
                    {t("STOCK ID/ LOTNO")}
                  </Label>
                  <Input
                    type="text"
                    className={`form-control ${addItemLotExists ? "is-invalid" : ""}`}
                    placeholder={t("Stock ID/ LotNo")}
                    value={addItemForm.lotNo}
                    onChange={(e) => {
                      setAddItemLotExists(false);
                      handleAddItemChange("lotNo", e.target.value);
                    }}
                    onBlur={handleAddItemLotBlur}
                  />
                  {addItemLotExists && <div className="invalid-feedback">{t("LotNo Already Exists")}</div>}
                </FormGroup>
              </Col>
            </Row>

            {/* Row 2: Shape, Color, Clarity, Size, Sieve/MM */}
            <Row className="mb-3">
              <Col md={2}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>{t("SHAPE")}</Label>
                  <select
                    className="form-select"
                    value={addItemForm.shapeId}
                    onChange={(e) => handleAddItemChange("shapeId", e.target.value)}
                  >
                    <option value="">{t("Select Shape")}</option>
                    {shapeOpts.map((opt, idx) => (
                      <option key={idx} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>{t("COLOR")}</Label>
                  <select
                    className="form-select"
                    value={addItemForm.colorId}
                    onChange={(e) => handleAddItemChange("colorId", e.target.value)}
                  >
                    <option value="">{t("Select Color")}</option>
                    {colorOpts.map((opt, idx) => (
                      <option key={idx} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>{t("CLARITY")}</Label>
                  <select
                    className="form-select"
                    value={addItemForm.clarityId}
                    onChange={(e) => handleAddItemChange("clarityId", e.target.value)}
                  >
                    <option value="">{t("Select Clarity")}</option>
                    {clarityOpts.map((opt, idx) => (
                      <option key={idx} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>{t("SIZE")}</Label>
                  <select
                    className="form-select"
                    value={addItemForm.sizeId}
                    onChange={(e) => handleAddItemChange("sizeId", e.target.value)}
                  >
                    <option value="">{t("Select Size")}</option>
                    {sizeOpts.map((opt, idx) => (
                      <option key={idx} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>{t("SIEVE / MM")}</Label>
                  <select
                    className="form-select"
                    value={addItemForm.sieveId}
                    onChange={(e) => handleAddItemChange("sieveId", e.target.value)}
                  >
                    <option value="">{t("Select Sieve")}</option>
                    {sieveOpts.map((opt, idx) => (
                      <option key={idx} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FormGroup>
              </Col>
            </Row>

            {/* Row 3: Stock Name, Stock GroupID, Description */}
            <Row className="mb-3">
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>{t("STOCK NAME")}</Label>
                  <Input
                    type="text"
                    className="form-control"
                    placeholder={t("Stock Name")}
                    value={addItemForm.itemName}
                    onChange={(e) => handleAddItemChange("itemName", e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>{t("STOCK GROUPID")}</Label>
                  <select
                    className="form-select"
                    value={addItemForm.itemGroupID}
                    onChange={(e) => handleAddItemChange("itemGroupID", e.target.value)}
                  >
                    <option value="">{t("Select GroupID")}</option>
                    {groupOpts.map((opt, idx) => (
                      <option key={idx} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>{t("DESCRIPTION")}</Label>
                  <Input
                    type="textarea"
                    rows="2"
                    className="form-control"
                    placeholder={t("Description")}
                    value={addItemForm.publicCommnets}
                    onChange={(e) => handleAddItemChange("publicCommnets", e.target.value)}
                  />
                </FormGroup>
              </Col>
            </Row>

            {/* Row 4: Stock Type, Stock SubType, Grown/Process Type, Certificate No */}
            <Row className="mb-3">
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>{t("STOCK TYPE")}</Label>
                  <select
                    className="form-select"
                    value={addItemForm.category}
                    onChange={(e) => handleAddItemChange("category", e.target.value)}
                  >
                    <option value="Natural Diamond">Natural Diamond</option>
                    <option value="Lab Grown Diamond">Lab Grown Diamond</option>
                    <option value="Gem Stone">Gem Stone</option>
                  </select>
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>{t("STOCK SUBTYPE")}</Label>
                  <select
                    className="form-select"
                    value={addItemForm.instruction}
                    onChange={(e) => handleAddItemChange("instruction", e.target.value)}
                  >
                    <option value="Polished">{t("Polished")}</option>
                    <option value="Makeble">{t("Makeble")}</option>
                    <option value="Rough">{t("Rough")}</option>
                  </select>
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>{t("GROWN/PROCESS TYPE")}</Label>
                  <select
                    className="form-select"
                    value={addItemForm.productType}
                    onChange={(e) => handleAddItemChange("productType", e.target.value)}
                  >
                    <option value="">{t("Select ProductType")}</option>
                    {productTypeOpts.map((opt, idx) => (
                      <option key={idx} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>{t("CERTIFICATE NO")}</Label>
                  <Input
                    type="text"
                    className="form-control"
                    placeholder={t("Certificate No")}
                    value={addItemForm.certificateNo}
                    onChange={(e) => handleAddItemChange("certificateNo", e.target.value)}
                  />
                </FormGroup>
              </Col>
            </Row>

            {/* Row 5: USD to INR Rate, Purchase/Cost Price USD/Carats, Purchase/Cost Price INR/Carats, Single/Parcel */}
            <Row className="mb-3">
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>
                    {t(`${stockSymbol} TO ${masterSymbol} RATE`).toUpperCase()}
                  </Label>
                  <Input
                    type="text"
                    className="form-control text-end"
                    placeholder={t("USD to INR Rate")}
                    value={addItemForm.pDollorRate}
                    onChange={(e) => handleAddItemChange("pDollorRate", e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>
                    {t(`PURCHASE/COST PRICE ${stockSymbol}/CARATS`).toUpperCase()}
                  </Label>
                  <Input
                    type="text"
                    className="form-control text-end"
                    placeholder={t("Purchase/Cost Price USD/Carats")}
                    value={addItemForm.purchaseRate}
                    onChange={(e) => handleAddItemChange("purchaseRate", e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>
                    {t(`PURCHASE/COST PRICE ${masterSymbol}/CARATS`).toUpperCase()}
                  </Label>
                  <Input
                    type="text"
                    className="form-control text-end"
                    placeholder={t("Purchase/Cost Price INR/Carats")}
                    value={addItemForm.masterCurrencyRate}
                    onChange={(e) => handleAddItemChange("masterCurrencyRate", e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label fw-semibold" style={{ fontSize: "12px" }}>{t("SINGLE / PARCEL")}</Label>
                  <select
                    className="form-select"
                    value={addItemForm.stoneTypes}
                    onChange={(e) => handleAddItemChange("stoneTypes", e.target.value)}
                  >
                    <option value="Single">{t("Single")}</option>
                    <option value="Parcel">{t("Parcel")}</option>
                  </select>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button color="light" onClick={() => setAddItemOpen(false)}>
              {t("Close")}
            </Button>
            <Button color="primary" onClick={handleSaveAddItem} disabled={addItemSubmitting}>
              {addItemSubmitting ? t("Saving...") : t("Save")}
            </Button>
          </ModalFooter>
        </Modal>

        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default MixConsignmentForm;
