import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
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
import AsyncSelect from "react-select/async";
import CreatableSelect from "react-select/creatable";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import {
  addMixSale,
  editMixSale,
  getAccGrpMasters,
  getCurrencyRates,
  getMixMemoOutShipVia,
  getMixSaleLots,
  getMixSaleConsignment,
  getMixSaleDetail,
  getMixSaleLotDetail,
  getMixSalePageData
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
      const stockType =
        item.stockType ??
        item.StockType ??
        (isJewelleryLot(value || label) ? "Jewellery" : "Diamond");
      return { value: value || label, label: label || value, stockType };
    })
    .filter(Boolean);

const isJewelleryLot = (lotNo) => /^jew_/i.test(String(lotNo || "").trim());

const resolveStockType = (lotNo, stockType) =>
  String(stockType || "").toLowerCase() === "jewellery" || isJewelleryLot(lotNo)
    ? "Jewellery"
    : (stockType || "Diamond");

const toNum = (v, d = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : d;
};

const fmt = (v, decimals = 2) => toNum(v).toFixed(decimals);

/** MVC CaratFormatNew: N3 or truncate last digit when format is not 0.000 */
const formatCaratWeight = (weight, caratFormat = "0.000") => {
  const weight3D = toNum(weight).toFixed(3);
  if (caratFormat === "0.000") return toNum(weight3D);
  return toNum(weight3D.slice(0, -1));
};

const PURCHASE_ITEM_COLUMNS = [
  { key: "lotNo", label: "LotNo" },
  { key: "itemName", label: "ItemName" },
  { key: "shape", label: "SHAPE" },
  { key: "color", label: "COLOR" },
  { key: "sieve", label: "SIEVE" },
  { key: "size", label: "SIZE" },
  { key: "clarity", label: "CLARITY" },
  { key: "pcs", label: "Pcs", align: "end", footer: "pcs" },
  { key: "issueCarats", label: "Issue Carats", align: "end", decimals: 3 },
  { key: "back", label: "RejP %", align: "end", decimals: 2 },
  { key: "rtnCarats", label: "Rejection", align: "end", decimals: 3, footer: "rejection" },
  { key: "weight", label: "Selection Carats", align: "end", decimals: 3, footer: "weight" },
  { key: "cogs", label: "COGS", align: "end", decimals: 2 },
  { key: "rate", label: "Rate", align: "end", decimals: 2, footer: "avgRate" },
  { key: "sRate", label: "$Rate", align: "end", decimals: 2 },
  { key: "less1", label: "Less1", align: "end", decimals: 2 },
  { key: "less2", label: "Less2", align: "end", decimals: 2 },
  { key: "less3", label: "Less3", align: "end", decimals: 2 },
  { key: "amount", label: "Amount", align: "end", decimals: 2, footer: "totAmount" },
  { key: "exportNo", label: "ExportNo" },
  { key: "memoTransCode", label: "MemoTrnCode", align: "end" },
  { key: "stockType", label: "StockType" },
  { key: "rtnCts", label: "RtnCts", align: "end", decimals: 3 },
  { key: "sRtnStatus", label: "Status" },
  { key: "sRtnStatus", label: "SRtnStatus" },
  { key: "invDescription", label: "ItemDescription" }
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

/** Unique row id so duplicate LotNo entries stay separate in React state/DOM. */
let mixSaleRowSeq = 0;
const nextRowId = () => `sale-row-${Date.now()}-${++mixSaleRowSeq}`;

const mapItemFromApi = (r, idx) => ({
  rowId: getStrVal(r, "rowId", "RowId") || nextRowId(),
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
  stockType: resolveStockType(getStrVal(r, "LotNo", "lotNo"), getStrVal(r, "StockType")),
  stockType: getStrVal(r, "StockType") || "Diamond",
  invDescription: getStrVal(r, "InvDescription", "invDescription"),
  suppLotNo: getStrVal(r, "SuppLotNo"),
  askingRate: getNumVal(r, "AskingRate"),
  actualRate: getNumVal(r, "ActualRate"),
  groupId: getStrVal(r, "GroupId", "ItemGroup"),
  stoneType: getStrVal(r, "StoneType"),
  rmk: getStrVal(r, "RMK", "MemberRemarks"),
  memoTransCode: getNumVal(r, "MemoTransCode", "memoTransCode", "MemoTranCode", "memoTranCode", "MemoTrnCode"),
  rtnCarats: getNumVal(r, "RtnCarats", "ReturnCarats"),
  cogs: getNumVal(r, "COGS", "cogs"),
  exportNo: getStrVal(r, "ExportNo", "exportNo"),
  sRate: getNumVal(r, "SRate", "sRate", "StockRate"),
  rtnCts: getNumVal(r, "RtnCts", "RtnCarats", "ReturnCarats"),
  sRtnStatus: getStrVal(r, "SRtnStatus", "sRtnStatus", "SRtnstatus", "Status", "status")
});

const emptyItem = () => ({
  rowId: nextRowId(),
  lotNo: "",
  itemName: "",
  weight: "",
  issueCarats: "",
  // First load / Clearall: empty — do not show 0/1 until LotNo fill or user entry
  pcs: "",
  mrp: "",
  back: "",
  rate: "",
  sRate: "",
  less1: "",
  less2: "",
  less3: "",
  amount: "",
  shape: "",
  color: "",
  clarity: "",
  size: "",
  sieve: "",
  stockType: "",
  invDescription: "",
  suppLotNo: "",
  askingRate: "",
  actualRate: "",
  groupId: "",
  stoneType: "",
  rmk: "",
  memoTransCode: "",
  rtnCarats: "",
  cogs: "",
  exportNo: "",
  rtnCts: "",
  sRtnStatus: ""
});

const renderItemCell = (row, col) => {
  if (col.key === "sRtnStatus") {
    const status = String(row.sRtnStatus || row.status || "").trim();
    return status === "Sale-rtn" ? status : "";
  }
  const v = row[col.key];
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
    case "rejection":
      return fmt(totals.totRejection, 3);
    default:
      return "";
  }
};

const getItemRowStyle = (row) => {
  const sRtnStatus = String(row.sRtnStatus || row.status || "").trim();
  // MVC mix-data.js createdRow — only Sale-rtn rows are highlighted
  if (sRtnStatus === "Sale-rtn") return { color: "red" };
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

/** Round helper for calculated entry fields (keep typed field as-entered). */
const roundN = (n, d) => {
  if (!Number.isFinite(n)) return "0";
  const f = 10 ** d;
  return String(Math.round(n * f) / f);
};

/**
 * MVC MixSale.js rejection / selection sync:
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

const MixSaleForm = ({ mode = "add" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = mode === "edit";
  const editId =
    searchParams.get("Id") ||
    searchParams.get("id") ||
    searchParams.get("ID") ||
    "";
  const isView = String(searchParams.get("Mode") || searchParams.get("mode") || "").toLowerCase() === "view";
  const readOnly = isView;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [typeOpts, setTypeOpts] = useState([]);
  const [subTypeOpts, setSubTypeOpts] = useState([]);
  const [categoryOpts, setCategoryOpts] = useState([]);
  const [currencyOpts, setCurrencyOpts] = useState([]);
  const [shapeOpts, setShapeOpts] = useState([]);
  const [colorOpts, setColorOpts] = useState([]);
  const [clarityOpts, setClarityOpts] = useState([]);
  const [sizeOpts, setSizeOpts] = useState([]);
  const [sieveOpts, setSieveOpts] = useState([]);
  const [addressOpts, setAddressOpts] = useState([]);

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

  // MVC mix-data.js #ShipVia select2 → /saleParcel/get-shipvia (GetShipViaForDropdown)
  const [shipViaInput, setShipViaInput] = useState("");
  const [shipViaOpts, setShipViaOpts] = useState([]);
  const [shipViaLoading, setShipViaLoading] = useState(false);
  const [shipVia, setShipVia] = useState(null);

  const [lotSel, setLotSel] = useState(null);
  const lotSelectRef = useRef(null);
  /** Keep menu open while we force focus after Add Item (blocks premature onMenuClose). */
  const keepLotMenuOpenRef = useRef(false);
  /** Controlled menu — forced open after Add Item like MVC select2('open'). */
  const [lotMenuOpen, setLotMenuOpen] = useState(false);
  /** Remount AsyncSelect after Add Item so internal focus/menu state resets cleanly. */
  const [lotSelectKey, setLotSelectKey] = useState(0);
  /** Bumped after successful Add Item so focus runs after React commit (table + clear). */
  const [lotFocusToken, setLotFocusToken] = useState(0);

  /**
   * MVC mix-data.js AddItem end: $('#mix-lotno').focus(); $('#mix-lotno').select2('open');
   * Opens LotNo dropdown and focuses the search input so the next lot can be typed immediately.
   */
  const focusLotNoField = useCallback(() => {
    keepLotMenuOpenRef.current = true;
    setLotMenuOpen(true);

    const applyFocus = () => {
      setLotMenuOpen(true);
      try {
        lotSelectRef.current?.focus?.();
      } catch {
        /* ignore if select unmounted mid-remount */
      }

      // Prefer react-select search input — never the LOT NUMBER checkbox
      const root = document.querySelector(".ie-r1-lot");
      const byId = document.getElementById("mix-sale-lotno-input");
      const prefixInput =
        root?.querySelector(".mix-sale-lot__input input") ||
        root?.querySelector(".mix-sale-lot__input");
      const searchInput =
        byId ||
        (prefixInput?.tagName === "INPUT" ? prefixInput : null) ||
        [...(root?.querySelectorAll("input") || [])].find(
          (el) => el.type !== "checkbox" && !el.classList.contains("form-check-input")
        );

      if (searchInput && typeof searchInput.focus === "function") {
        searchInput.focus({ preventScroll: true });
      }
    };

    window.requestAnimationFrame(() => {
      applyFocus();
      window.setTimeout(applyFocus, 0);
      window.setTimeout(applyFocus, 50);
      window.setTimeout(applyFocus, 150);
      window.setTimeout(() => {
        keepLotMenuOpenRef.current = false;
      }, 500);
    });
  }, []);

  // After item added + fields cleared: auto-open LotNo (MVC focus + select2 open)
  useEffect(() => {
    if (!lotFocusToken) return;
    const timer = window.setTimeout(() => focusLotNoField(), 0);
    return () => window.clearTimeout(timer);
  }, [lotFocusToken, focusLotNoField]);

  const [mOp, setMOp] = useState("*");
  const [sOp, setSOp] = useState("*");
  const [editIndex, setEditIndex] = useState(-1);
  const [items, setItems] = useState([]);
  const [entry, setEntry] = useState(emptyItem());
  const [lotCheck, setLotCheck] = useState(false);
  const [bulkLotNos, setBulkLotNos] = useState("");

  const [excelOpen, setExcelOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [consignOpen, setConsignOpen] = useState(false);
  const [consignRows, setConsignRows] = useState([]);
  const [consignLotFilter, setConsignLotFilter] = useState("");
  const [consignSearch, setConsignSearch] = useState("");

  const [masterSymbol, setMasterSymbol] = useState("INR");
  const [stockSymbol, setStockSymbol] = useState("USD");
  const [caratFormat, setCaratFormat] = useState("0.000");

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
    shipVia: "",
    tracking: "",
    salesPerson: "",
    memoNo: "",
    address: "",
    printInvDate: todayIso(),
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
    decimalPlaces: 2,
    chkoldsale: false
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

  // MVC: minimumInputLength 2 → GetShipViaForDropdown
  useEffect(() => {
    if (!shipViaInput || shipViaInput.trim().length < 2) {
      setShipViaOpts([]);
      return;
    }
    const tmr = setTimeout(async () => {
      setShipViaLoading(true);
      try {
        const res = await getMixMemoOutShipVia(shipViaInput);
        const raw = res?.Data || res?.data || [];
        setShipViaOpts(
          (Array.isArray(raw) ? raw : [])
            .map((item) => ({
              value: String(item.text || item.id || item.Text || item.Id || ""),
              label: String(item.text || item.id || item.Text || item.Id || "")
            }))
            .filter((o) => o.value)
        );
      } catch {
        setShipViaOpts([]);
      } finally {
        setShipViaLoading(false);
      }
    }, 400);
    return () => clearTimeout(tmr);
  }, [shipViaInput]);

  const loadLotOptions = useCallback((inputValue, callback) => {
    const term = (inputValue || "").trim();
    if (term.length < 2) {
      callback([]);
      return;
    }
    getMixSaleLots(term)
      .then((res) => {
        if (res?.success === false) {
          callback([]);
          return;
        }
        callback(mapMixLotOptions(res));
      })
      .catch(() => callback([]));
  }, []);

  // MVC Edit: GetCurDetail loads operators/symbols only — keeps invoice BaseRate/SBaseRate.
  // Live master rates apply on Add and when the user changes Currency.
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
      const res = await getMixSalePageData();
      if (!(res?.success || res?.Success)) {
        toast.error(res?.Data || res?.data || t("Failed to load page data."));
        return null;
      }
      const d = res.Data || res.data || {};
      const types = mapBasicWithNameAsValue(d.Type || d.type);
      const subs = mapBasicWithNameAsValue(d.SubType || d.subType);
      const cats = mapBasicWithNameAsValue(d.Category || d.category);
      const curs = mapBasic(d.CurrencyList || d.currencyList);
      const shapes = mapBasicWithNameAsValue(d.Shape || d.shape);
      const colors = mapBasicWithNameAsValue(d.Color || d.color);
      const clarities = mapBasicWithNameAsValue(d.Clarity || d.clarity);
      const sizes = mapBasicWithNameAsValue(d.Size || d.size);
      const sieves = mapBasicWithNameAsValue(d.Sieve || d.sieve);
      const addresses = mapBasic(d.Address || d.address);
      const defaultCurrencyCode = d.DefaultCurrencyCode || d.defaultCurrencyCode || "";
      const loadedCaratFormat = d.CaratFormatNew || d.caratFormatNew || "0.000";
      setCaratFormat(loadedCaratFormat);
      setTypeOpts(types);
      setSubTypeOpts(subs);
      setCategoryOpts(cats);
      setCurrencyOpts(curs);
      setShapeOpts(shapes);
      setColorOpts(colors);
      setClarityOpts(clarities);
      setSizeOpts(sizes);
      setSieveOpts(sieves);
      setAddressOpts(addresses);
      return { types, subs, cats, curs, shapes, colors, clarities, sizes, sieves, addresses, defaultCurrencyCode, caratFormat: loadedCaratFormat };
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load page data."));
      return null;
    }
  };

  const loadDetail = async (pageData = null) => {
    if (!editId) {
      toast.warning(t("Missing purchase Id."));
      return;
    }
    try {
      const res = await getMixSaleDetail(editId);
      if (!(res?.success || res?.Success)) {
        toast.error(res?.Data || res?.data || t("Sale not found."));
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
      const shipViaText = getVal(h, "ShipVia", "Shipvia");
      setShipVia(shipViaText ? { value: shipViaText, label: shipViaText } : null);

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
        invType: resolveSelectValue(pageData?.types || typeOpts, invTypeRaw),
        subType: resolveSelectValue(pageData?.subs || subTypeOpts, subTypeRaw),
        category: resolveSelectValue(pageData?.cats || categoryOpts, categoryRaw),
        dueDays: toNum(getVal(h, "DueDays"), 0),
        dueDate: due ? toLocalDateStr(due) || todayIso() : todayIso(),
        curCode: String(getVal(h, "CurCode") || ""),
        // MVC Edit binds MasterCurrencyRate / StockCurrencyRate; API also exposes BaseRate / SBaseRate
        baseRate: toNum(getVal(h, "MasterCurrencyRate", "BaseRate"), 1),
        sBaseRate: toNum(getVal(h, "StockCurrencyRate", "SBaseRate"), 1),
        adatPer: toNum(getVal(h, "AdatPer")),
        adatAmount: toNum(getVal(h, "AdatAmount")),
        brokerPer: toNum(getVal(h, "BrokerPer")),
        brokerAmount: toNum(getVal(h, "BrokerAmount")),
        description: getVal(h, "Description", "InvDisc"),
        shipVia: getVal(h, "ShipVia", "Shipvia"),
        tracking: getVal(h, "Tracking", "TrackingNo"),
        salesPerson: getVal(h, "SalesPerson", "Salesperson"),
        memoNo: getVal(h, "MemoNo", "Memono", "ConsignmentNo"),
        address: String(getVal(h, "Address", "AddressId", "BankId", "BankID") || ""),
        printInvDate: getVal(h, "RoundDate")
          ? toLocalDateStr(getVal(h, "RoundDate")) || todayIso()
          : todayIso(),
        chkoldsale: !!(getVal(h, "chkoldsale") === true || getVal(h, "chkoldsale") === "true" || getVal(h, "chkoldpur") === true || getVal(h, "chkoldpur") === "true"),
        plusMinusAmount: toNum(getVal(h, "PlusMinusAmount")),
        roundAmount: toNum(getVal(h, "RoundAmount")),
        vatPer: getNumVal(h, "VatPer", "VATPer", "Vat", "VatPercentage", "VatRate"),
        cgstPer: getNumVal(h, "CGSTPer", "CgstPer", "CGST", "CgstPercentage", "CGSTRate"),
        sgstPer: getNumVal(h, "SGSTPer", "SgstPer", "SGST", "SgstPercentage", "SGSTRate"),
        igstPer: getNumVal(h, "IGSTPer", "IgstPer", "IGST", "IgstPercentage", "IGSTRate"),
        vatAmount: getNumVal(h, "VatAmount", "VatAmt", "VATAmount"),
        cgstAmt: getNumVal(h, "CGSTAmt", "CGSTAmount", "CgstAmt", "CgstAmount"),
        sgstAmt: getNumVal(h, "SGSTAmt", "SGSTAmount", "SgstAmt", "SgstAmount"),
        igstAmt: getNumVal(h, "IGSTAmt", "IGSTAmount", "IgstAmt", "IgstAmount"),
        decimalPlaces: 2
      });

      setItems(rows.map((r, idx) => mapItemFromApi(r, idx)));

      // Only load currency operators on Edit — do not overwrite saved BaseRate/SBaseRate with live master rates
      const loadedCurCode = String(getVal(h, "CurCode") || "");
      if (loadedCurCode) {
        await applyCurrencyRates(loadedCurCode, { preserveRates: true });
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load purchase detail."));
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
        const defaultAddress = page.addresses?.[0]?.value || "";
        setHeader((prev) => ({
          ...prev,
          invType: page.types[0]?.value || "",
          subType: "",
          category: page.cats[0]?.value || "",
          curCode: selectedCur.value,
          address: defaultAddress,
          printInvDate: todayIso()
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

  const fillFromLot = async (lotNo) => {
    if (!lotNo) return;
    try {
      const res = await getMixSaleLotDetail(lotNo);
      if (!(res?.success || res?.Success)) {
        toast.warning(res?.Data || res?.data || t("Lot detail not found."));
        return;
      }
      const rows = res.Data || res.data || [];
      const lot = Array.isArray(rows) ? rows[0] : rows;
      if (!lot) return;

      const resolvedStockType = resolveStockType(
        lotNo,
        getStrVal(lot, "StockType", "stockType")
      );
      const isJewellery = resolvedStockType === "Jewellery";

      const weight = getNumVal(lot, "Carats", "Weight");
      const issueCarats = weight;
      // MVC: $('#Pcs').val(jsonData[0].Pcs) — parcel lots typically return 0.
      // Do not coerce with || 1 (that forced Pcs to 1 whenever API Pcs was 0).
      const pcs = getNumVal(lot, "Pcs");
      const rate = 0;

      setEntry((prev) =>
        recalcEntryAmount({
          ...prev,
          lotNo: getStrVal(lot, "LotNo", "Stock_ID") || lotNo,
          itemName: getStrVal(lot, "ItemName"),
          weight,
          issueCarats,
          pcs,
          mrp: getNumVal(lot, "PurchaseMRP", "MRP"),
          back: "0",
          rate,
          sRate: "",
          less1: prev.less1 === "" || prev.less1 == null ? "0" : prev.less1,
          less2: prev.less2 === "" || prev.less2 == null ? "0" : prev.less2,
          less3: prev.less3 === "" || prev.less3 == null ? "0" : prev.less3,
          shape: isJewellery ? "" : getStrVal(lot, "Shape", "ShapeId"),
          color: isJewellery ? "" : getStrVal(lot, "Color", "ColorId"),
          clarity: isJewellery ? "" : getStrVal(lot, "Clarity", "ClarityId"),
          size: isJewellery ? "" : getStrVal(lot, "Size", "SizeId"),
          sieve: isJewellery ? "" : getStrVal(lot, "Sieve", "SieveId"),
          stockType: resolvedStockType,
          shape: getStrVal(lot, "Shape", "ShapeId"),
          color: getStrVal(lot, "Color", "ColorId"),
          clarity: getStrVal(lot, "Clarity", "ClarityId"),
          size: getStrVal(lot, "Size", "SizeId"),
          sieve: getStrVal(lot, "Sieve", "SieveId"),
          stockType: getStrVal(lot, "StockType") || "Diamond",
          invDescription: getStrVal(lot, "InvDescription"),
          cogs: getNumVal(lot, "COGS", "CPAVG") || "0",
          memoTransCode: 0,
          rtnCarats: "0"
        })
      );
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load lot detail."));
    }
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
    const isJewellery = resolveStockType(lotNo, entry.stockType) === "Jewellery";
    if (isJewellery) {
      if (toNum(entry.pcs) === 0 && rate !== 0) {
        toast.warning(t("Carat or Rate can not be 0"));
        return;
      }
    } else if (weight <= 0 && rate !== 0) {
      toast.warning(t("Carat is invalid."));
      return;
    }
    if (rate === 0 && back === 0 && toNum(entry.amount) === 0) {
      toast.warning(t("Rate and Discount both can not be 0."));
      return;
    }

    // MVC AddItem: PurchaseBack = RejeP; Weight = SelectionCarat; ReturnCarats = Reje
    const amount = calcItemAmount(weight, rate, entry.less1, entry.less2, entry.less3, entry.pcs, entry.stockType);

    // MVC MixSale add-single-lot: duplicate LotNo check is commented out — always append
    const row = {
      ...entry,
      rowId: editIndex >= 0 && entry.rowId ? entry.rowId : nextRowId(),
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
      cogs: toNum(entry.cogs),
      exportNo: entry.exportNo || "",
      sRate: toNum(entry.sRate),
      sieve: entry.sieve || "",
      stockType: resolveStockType(lotNo, entry.stockType),
      stockType: entry.stockType || "Diamond",
      invDescription: entry.invDescription || "",
      memoTransCode: toNum(entry.memoTransCode),
      rtnCarats: Math.round(rtnCarats * 1000) / 1000
    };

    // Commit table + clear entry before focusing LotNo (MVC runs focus/open after AddItem work)
    keepLotMenuOpenRef.current = true;
    flushSync(() => {
      setItems((prev) => {
        if (editIndex >= 0 && editIndex < prev.length) {
          const copy = [...prev];
          copy[editIndex] = row;
          return copy;
        }
        return [...prev, row];
      });

      setEditIndex(-1);
      setLotSel(null);
      setEntry(emptyItem());
      setLotMenuOpen(true);
      setLotSelectKey((k) => k + 1);
    });

    // Defer focus/open until after React commit (table + remounted select ready)
    setLotFocusToken((n) => n + 1);
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
    let totRejection = 0;
    let totMrp = 0;
    let totWithoutLess = 0;
    items.forEach((r) => {
      const w = formatCaratWeight(r.weight, caratFormat);
      totCts += w;
      totAmount += toNum(r.amount);
      totRejection += toNum(r.rtnCarats);
      totMrp += w * toNum(r.mrp);
      totWithoutLess += w * toNum(r.rate);
    });
    return {
      totCts: Math.round(totCts * 1000) / 1000,
      totAmount: Math.round(totAmount * 100) / 100,
      totRejection: Math.round(totRejection * 1000) / 1000,
      totMrp,
      totWithoutLess,
      avgMrp: totCts === 0 ? 0 : totMrp / totCts,
      avgRate: totCts === 0 ? 0 : totWithoutLess / totCts,
      avgBack: totMrp === 0 ? 0 : (totWithoutLess / totMrp) * 100 - 100
    };
  }, [items, caratFormat]);

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
      comDisplay: formatCommissionDisplay(comDisplay, true), // MVC Math.round
      broDisplay: formatCommissionDisplay(broDisplay, true), // MVC Math.round
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
    a.download = "MixSaleTemplate.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const viewMixMemo = async () => {
    const partyCode = String(party?.value ?? "").trim();
    const memoNo = String(header.memoNo ?? "").trim();
    if (!partyCode && !memoNo) {
      toast.warning(t("Select Party or enter Memo No."));
      return;
    }
    try {
      const res = await getMixSaleConsignment({
        PartyCode: partyCode,
        MemoNo: memoNo
      });
      if (!(res?.success || res?.Success)) {
        toast.warning(res?.Data || res?.data || t("No memo Found"));
        return;
      }
      const rawList = extractLotList(res.Data ?? res.data ?? res);
      if (!rawList.length) {
        toast.warning(t("No memo Found"));
        return;
      }
      const first = rawList[0];
      if (first) {
        const shipViaText = getStrVal(first, "ShipVia", "shipVia");
        const trackingText = getStrVal(first, "Tracking", "tracking");
        const salesPersonText = getStrVal(first, "SalesPerson", "salesPerson");
        const curCode = getVal(first, "CurCode", "curCode");
        if (shipViaText) {
          setShipVia({ value: shipViaText, label: shipViaText });
          setHeaderField("shipVia", shipViaText);
        }
        if (trackingText) setHeaderField("tracking", trackingText);
        if (salesPersonText) setHeaderField("salesPerson", salesPersonText);
        if (curCode) {
          setHeaderField("curCode", String(curCode));
          await applyCurrencyRates(String(curCode));
        }
      }
      // MVC FillConToPurTable: Cts=carats, Purchase=carats, Rtn=RtnCts, BalCts=BalanceCts
      const rows = rawList.map((r, i) => {
        const cts = getNumVal(r, "carats", "Carats", "Cts", "cts", "Weight", "weight");
        const purchase = cts;
        const rtn = getNumVal(r, "RtnCts", "rtnCts", "Rtn", "rtn");
        const balFromApi = getVal(r, "BalanceCts", "balanceCts", "BalCts", "balCts");
        const balCts =
          balFromApi !== "" && balFromApi != null
            ? toNum(balFromApi)
            : Math.max(0, cts - purchase);
        const rawDate = getVal(r, "Date", "date", "TrnDate", "trnDate");
        const formattedDate =
          toLocalDateStr(rawDate) ||
          (typeof rawDate === "string" ? rawDate.split("T")[0] : "") ||
          String(rawDate || "");
        return {
          key: i,
          selected: true,
          date: formattedDate,
          memoNo: getStrVal(r, "MemoNo", "memoNo", "InvNo", "invNo", "BillNo", "billNo"),
          lotNo: getStrVal(r, "Lotno", "lotno", "LotNo", "lotNo"),
          itemName: getStrVal(r, "itemname", "ItemName", "itemName"),
          cts,
          purchase,
          originalPurchase: purchase,
          rtn,
          balCts,
          rate: getNumVal(r, "rate", "Rate"),
          mrp: getNumVal(r, "MRP", "mrp", "Mrp"),
          back: getNumVal(r, "Back", "back"),
          memoTransCode: getNumVal(r, "MemoTransCode", "memoTransCode", "MemoTranCode", "memoTranCode", "MemoTrnCode"),
          symbol: getStrVal(r, "Symbol", "symbol", "Cur", "cur"),
          stockType: resolveStockType(
            getStrVal(r, "Lotno", "lotno", "LotNo", "lotNo"),
            getStrVal(r, "StockType", "stockType")
          )
        };
      });
      setConsignLotFilter("");
      setConsignSearch("");
      setConsignRows(rows);
      setConsignOpen(true);
    } catch (err) {
      console.error(err);
      const msg =
        typeof err === "string"
          ? err
          : err?.message || err?.Data || err?.data || t("Failed to load consignment.");
      toast.error(msg);
    }
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
    // MVC MixController.Meotosalefill (fill-mixmemo-to-mixsale): always SExcel.Add — never overwrite by LotNo.
    // Duplicate LotNo rows are kept as separate lines (same as MVC grid).
    let skipAlert = "";
    setItems((prev) => {
      const next = [...prev];
      selected.forEach((r) => {
        const lotNo = r.lotNo;
        // MVC: IssueCarats = Weight = Purchase; Rate = PurchaseRate
        const weight = toNum(r.purchase);
        const rate = toNum(r.rate);
        // MVC: skip tiny residual weight with "Lotno On Memo or Sold"
        if (weight > 0 && weight <= 0.001) {
          skipAlert += ` Lotno On Memo or Sold: ${lotNo}`;
          return;
        }
        const rowStockType = resolveStockType(lotNo, r.stockType);
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
          amount: calcItemAmount(weight, rate, 0, 0, 0, 1, rowStockType),
          shape: "",
          color: "",
          clarity: "",
          size: "",
          sieve: "",
          stockType: rowStockType,
          memoTransCode: toNum(r.memoTransCode),
          rtnCarats: toNum(r.rtn)
        };
        next.push(row);
      });
      return next;
    });
    setConsignOpen(false);
    if (skipAlert) toast.warning(skipAlert.trim());
    else toast.success(t("Memo items added."));
  };

  const handleGetItemFromList = async () => {
    if (!bulkLotNos.trim()) {
      toast.warning(t("Please enter lot number(s)."));
      return;
    }
    const lotList = bulkLotNos
      .split(/[\n,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!lotList.length) {
      toast.warning(t("Please enter lot number(s)."));
      return;
    }
    try {
      const loaded = [];
      let alertMsg = "";
      for (const lotNo of lotList) {
        const res = await getMixSaleLotDetail(lotNo);
        if (!(res?.success || res?.Success)) {
          alertMsg += ` ${lotNo}`;
          continue;
        }
        const rows = res.Data || res.data || [];
        const lot = Array.isArray(rows) ? rows[0] : rows;
        if (!lot) {
          alertMsg += ` ${lotNo}`;
          continue;
        }
        const weight = getNumVal(lot, "Carats", "Weight");
        const issueCarats = weight;
        const rate = getNumVal(lot, "PurchaseRate", "Rate");
        const sBase = toNum(header.sBaseRate, 1) || 1;
        const resolvedStockType = resolveStockType(
          lotNo,
          getStrVal(lot, "StockType", "stockType")
        );
        const isJewellery = resolvedStockType === "Jewellery";
        loaded.push(
          recalcEntryAmount({
            ...emptyItem(),
            lotNo: getStrVal(lot, "LotNo", "Stock_ID") || lotNo,
            itemName: getStrVal(lot, "ItemName"),
            weight,
            issueCarats,
            // MVC: $('#Pcs').val(jsonData[0].Pcs) — keep 0; do not coerce with || 1
            pcs: getNumVal(lot, "Pcs"),
            mrp: getNumVal(lot, "PurchaseMRP", "MRP"),
            back: "0",
            rtnCarats: "0",
            rate,
            sRate: rate ? fmt(rate / sBase, 2) : "",
            less1: toNum(entry.less1),
            less2: toNum(entry.less2),
            less3: toNum(entry.less3),
            shape: isJewellery ? "" : getStrVal(lot, "Shape", "ShapeId"),
            color: isJewellery ? "" : getStrVal(lot, "Color", "ColorId"),
            clarity: isJewellery ? "" : getStrVal(lot, "Clarity", "ClarityId"),
            size: isJewellery ? "" : getStrVal(lot, "Size", "SizeId"),
            sieve: isJewellery ? "" : getStrVal(lot, "Sieve", "SieveId"),
            stockType: resolvedStockType,
            shape: getStrVal(lot, "Shape", "ShapeId"),
            color: getStrVal(lot, "Color", "ColorId"),
            clarity: getStrVal(lot, "Clarity", "ClarityId"),
            size: getStrVal(lot, "Size", "SizeId"),
            sieve: getStrVal(lot, "Sieve", "SieveId"),
            stockType: getStrVal(lot, "StockType") || "Diamond",
            invDescription: getStrVal(lot, "InvDescription"),
            cogs: getNumVal(lot, "COGS", "CPAVG") || "0",
            exportNo: getStrVal(lot, "ExportNo"),
            memoTransCode: 0
          })
        );
      }
      if (!loaded.length) {
        toast.warning(t("Failed to load items."));
        return;
      }
      setItems((prev) => {
        const map = new Map(prev.map((x) => [String(x.lotNo).toLowerCase(), x]));
        loaded.forEach((r) => map.set(String(r.lotNo).toLowerCase(), r));
        return Array.from(map.values());
      });
      if (alertMsg) toast.warning(`${t("Lot not found")}:${alertMsg}`);
      else toast.success(t("Items loaded."));
      setBulkLotNos("");
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load items."));
    }
  };

  const buildPayload = () => {
    const salePur = {
      Code: toNum(header.code),
      TrnDate: header.trnDate,
      chkoldsale: !!header.chkoldsale,
      DueDays: toNum(header.dueDays),
      DueDate: header.dueDate,
      RoundDate: header.printInvDate || header.dueDate,
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
      Description: header.description,
      InvDisc: header.description,
      MemoNo: header.memoNo,
      ShipVia: shipVia?.label || shipVia?.value || header.shipVia || "",
      Tracking: header.tracking,
      SalesPerson: header.salesPerson,
      Address: toNum(header.address, 1),
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
      StockType: resolveStockType(r.lotNo, r.stockType),
      StockType: r.stockType || "Diamond",
      InvDescription: r.invDescription || "",
      SuppLotNo: r.suppLotNo || "",
      COGS: toNum(r.cogs),
      ExportNo: r.exportNo || "",
      SRate: toNum(r.sRate),
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
      navigate("/mixform/add-mixdata");
    } else {
      setHeader({
        code: 0,
        trnDate: todayIso(),
        invNo: "",
        billNo: "",
        invType: typeOpts[0]?.value || "LOCAL",
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
        shipVia: "",
        tracking: "",
        salesPerson: "",
        memoNo: "",
        address: addressOpts[0]?.value || "",
        printInvDate: todayIso(),
        plusMinusAmount: 0,
        cgstPer: 0,
        sgstPer: 0,
        igstPer: 0,
        chkoldsale: false
      });
      setItems([]);
      setEntry(emptyItem());
      setParty(null);
      setCommission(null);
      setBroker(null);
      setShipVia(null);
      setShipViaOpts([]);
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
      const res = isEdit ? await editMixSale(payload) : await addMixSale(payload);
      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || t("Saved successfully."));
        navigate("/mixform/mixformlist", {
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

  const title = isView ? t("View Mix Sale") : isEdit ? t("Edit Mix Sale") : t("Add Mix Sale");
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
          <BreadCrumb title={title} pageTitle={t("Mix Sale")} />

          {/* TOP SECTION: Left (Header Fields Form Card) + Right (Summary Card) */}
          <Row className="g-3 mb-3">
            {/* LEFT: Main Sale Header Form Card */}
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
                            className="form-control-sm bg-light"
                            style={fieldH}
                            value={header.invNo}
                            readOnly
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={4} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("BILL NO")}</Label>
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
                            options={typeOpts}
                            value={typeOpts.find((o) => String(o.value) === String(header.invType)) || null}
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
                            className="form-control-sm bg-light"
                            style={fieldH}
                            value={header.dueDate}
                            readOnly
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

                    {/* Row 3: COMM.AGENT, COM %, COM AMOUNT, Outstanding */}
                    <Row className="g-2 mb-2 align-items-end">
                      <Col xs={12} sm={12} md={6} lg={4}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("COMM.AGENT")}</Label>
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
                            id="chkoldsale"
                            checked={!!header.chkoldsale}
                            onChange={(e) => setHeaderField("chkoldsale", e.target.checked)}
                            style={{ width: 16, height: 16, marginTop: 0 }}
                          />
                          <Label className="form-check-label fw-semibold text-nowrap d-flex align-items-center" htmlFor="chkoldsale" style={{ fontSize: "11px", color: "#495057", marginBottom: 0, lineHeight: "1" }}>{t("Outstanding")}</Label>
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

                    {/* Row 5: SHIP VIA, TRACKING NUMBER, SALES PERSON, MEMO NUMBER, View Mix Memo */}
                    <Row className="g-2 align-items-end">
                      <Col xs={12} sm={6} md={4} lg={4}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("SHIP VIA")}</Label>
                          <CreatableSelect
                            styles={customStyles}
                            options={shipViaOpts}
                            value={shipVia}
                            onChange={(sel) => {
                              setShipVia(sel);
                              setHeaderField("shipVia", sel?.label || sel?.value || "");
                            }}
                            onInputChange={(v, meta) => {
                              if (meta.action === "input-change") setShipViaInput(v);
                              else if (meta.action === "input-blur" || meta.action === "menu-close") {
                                setShipViaInput("");
                                setShipViaOpts([]);
                              }
                            }}
                            isLoading={shipViaLoading}
                            placeholder={t("Search ShipVia")}
                            isClearable
                            isDisabled={readOnly}
                            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={4} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("TRACKING NUMBER")}</Label>
                          <Input
                            className="form-control-sm"
                            style={fieldH}
                            value={header.tracking}
                            onChange={(e) => setHeaderField("tracking", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={4} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("SALES PERSON")}</Label>
                          <Input
                            className="form-control-sm"
                            style={fieldH}
                            value={header.salesPerson}
                            onChange={(e) => setHeaderField("salesPerson", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={4} lg={2}>
                        <FormGroup className="mb-2 mb-sm-0">
                          <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("MEMO NUMBER")}</Label>
                          <Input
                            className="form-control-sm"
                            style={fieldH}
                            value={header.memoNo}
                            onChange={(e) => setHeaderField("memoNo", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={4} lg={2}>
                        <Button color="primary" outline size="sm" style={fieldH} className="btn-outline-primary px-3 text-nowrap w-100 w-sm-auto mb-0" onClick={viewMixMemo}>
                          {t("View Mix Memo")}
                        </Button>
                      </Col>
                    </Row>
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

          {/* BOTTOM SECTION: Item Entry (Col 9) + Bulk Lot Panel (Col 3) */}
          <Row className="g-3">
            <Col xs={12} lg={9}>
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
                              {resolveStockType(entry.lotNo || lotSel?.value, entry.stockType) !== "Jewellery" && (
                                <Link to="/parcel/add-ParcelItemMaster" className="ms-1 border border-primary text-primary px-1 rounded" style={{ fontSize: "10px", textDecoration: "none" }} target="_blank">
                                  {t("ADD ITEM")}
                                </Link>
                              )}
                              <Input
                                type="checkbox"
                                className="form-check-input ms-2"
                                checked={lotCheck}
                                onChange={(e) => setLotCheck(e.target.checked)}
                                style={{ width: 16, height: 16, marginTop: 0, verticalAlign: "middle" }}
                              />
                            </Label>
                            <AsyncSelect
                              key={lotSelectKey}
                              ref={lotSelectRef}
                              inputId="mix-sale-lotno-input"
                              classNamePrefix="mix-sale-lot"
                              openMenuOnFocus
                              menuIsOpen={lotMenuOpen}
                              styles={{
                                ...customStyles,
                                control: (base, state) => ({
                                  ...customStyles.control(base, state),
                                  borderColor:
                                    state.isFocused || lotMenuOpen
                                      ? "#3b5de7"
                                      : "var(--vz-border-color, #ced4da)",
                                  boxShadow:
                                    state.isFocused || lotMenuOpen
                                      ? "0 0 0 1px #3b5de7"
                                      : "none"
                                }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 })
                              }}
                              cacheOptions={false}
                              defaultOptions={false}
                              loadOptions={loadLotOptions}
                              value={lotSel}
                              onMenuOpen={() => setLotMenuOpen(true)}
                              onMenuClose={() => {
                                // After Add Item, react-select may fire close during clear/remount — ignore briefly
                                if (keepLotMenuOpenRef.current) {
                                  setLotMenuOpen(true);
                                  return;
                                }
                                setLotMenuOpen(false);
                              }}
                              onChange={(o) => {
                                keepLotMenuOpenRef.current = false;
                                setLotMenuOpen(false);
                                setLotSel(o);
                                if (o?.value) {
                                  const stockType = o?.stockType || resolveStockType(o.value);
                                  // Pcs = 0 immediately on LotNo select (MVC fills from lot detail Pcs, typically 0)
                                  setEntry((prev) => ({
                                    ...prev,
                                    lotNo: o.value,
                                    pcs: "0",
                                    ...(stockType ? { stockType } : {})
                                  }));
                                  fillFromLot(o.value);
                                } else {
                                  onEntryChange("lotNo", "");
                                }
                              }}
                              placeholder={t("Lot No")}
                              isClearable
                              isSearchable
                              filterOption={null}
                              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                              menuPosition="fixed"
                              loadingMessage={() => t("Searching...")}
                              noOptionsMessage={({ inputValue }) => {
                                const term = (inputValue || "").trim();
                                if (term.length < 2) return t("Type at least 2 characters");
                                return t("No matching lot numbers");
                              }}
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
                      </Row>

                      {/* Item Entry Row 2: PCS, ISS.CTS, REJP %, REJE, SELECT.CTS, COGS, RATE, $ RATE, LESS1, LESS2, LESS3 */}
                      <Row className="g-2 align-items-end mb-2 flex-nowrap overflow-auto" style={{ minWidth: 0 }}>
                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px" }}>{t("PCS")}</Label>
                            <Input type="number" className="form-control-sm" style={fieldH} value={entry.pcs} onChange={(e) => onEntryChange("pcs", e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px" }}>{t("ISS.CTS")}</Label>
                            <Input type="number" step="any" className="form-control-sm" style={fieldH} value={entry.issueCarats} onChange={(e) => onEntryChange("issueCarats", e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px" }}>{t("REJP %")}</Label>
                            <Input type="number" step="any" className="form-control-sm" style={fieldH} value={entry.back} onChange={(e) => onEntryChange("back", e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px" }}>{t("REJE")}</Label>
                            <Input type="number" step="any" className="form-control-sm" style={fieldH} value={entry.rtnCarats} onChange={(e) => onEntryChange("rtnCarats", e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col style={{ flex: "1 0 0%", minWidth: "75px" }}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px" }}>{t("SELECT.CTS")}</Label>
                            <Input type="number" step="any" className="form-control-sm" style={fieldH} value={entry.weight} onChange={(e) => onEntryChange("weight", e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px" }}>{t("COGS")}</Label>
                            <Input className="form-control-sm" style={fieldH} value={entry.cogs} onChange={(e) => onEntryChange("cogs", e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px" }}>{t("RATE")}</Label>
                            <Input type="number" className="form-control-sm" style={fieldH} value={entry.rate} onChange={(e) => onEntryChange("rate", e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px" }}>{t("$ RATE")}</Label>
                            <Input className="form-control-sm" style={fieldH} value={entry.sRate} onChange={(e) => onEntryChange("sRate", e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px" }}>{t("LESS1")}</Label>
                            <Input type="number" className="form-control-sm" style={fieldH} value={entry.less1} onChange={(e) => onEntryChange("less1", e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px" }}>{t("LESS2")}</Label>
                            <Input type="number" className="form-control-sm" style={fieldH} value={entry.less2} onChange={(e) => onEntryChange("less2", e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px" }}>{t("LESS3")}</Label>
                            <Input type="number" className="form-control-sm" style={fieldH} value={entry.less3} onChange={(e) => onEntryChange("less3", e.target.value)} />
                          </FormGroup>
                        </Col>
                      </Row>

                      {/* Item Entry Row 3: AMOUNT, EXPORT NO, MEMOTRNCODE, STOCKTYPE, Add Item */}
                      <Row className="g-2 align-items-end">
                        <Col xs={6} sm={3} lg={2}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("AMOUNT")}</Label>
                            <Input className="form-control-sm" style={fieldH} value={entry.amount} readOnly />
                          </FormGroup>
                        </Col>
                        <Col xs={6} sm={3} lg={2}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("EXPORT NO")}</Label>
                            <Input className="form-control-sm" style={fieldH} placeholder="ExportNo" value={entry.exportNo} onChange={(e) => onEntryChange("exportNo", e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col xs={6} sm={3} lg={2}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("ItemDescription")}</Label>
                            <Input className="form-control-sm" style={fieldH} placeholder={t("ItemDescription")} value={entry.invDescription || ""} onChange={(e) => onEntryChange("invDescription", e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col xs={6} sm={3} lg={2}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("MEMOTRNCODE")}</Label>
                            <Input className="form-control-sm bg-light" style={fieldH} placeholder={t("MemoTrnCode")} value={entry.memoTransCode === 0 || entry.memoTransCode === "0" ? "0" : (entry.memoTransCode ?? "")} readOnly />
                          </FormGroup>
                        </Col>
                        <Col xs={6} sm={3} lg={2}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("STOCKTYPE")}</Label>
                            <Input className="form-control-sm bg-light" style={fieldH} placeholder={t("StockType")} value={entry.stockType || ""} readOnly />
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={6} lg={2}>
                          <FormGroup className="mb-2 mb-sm-0">
                            <Button
                              type="button"
                              color="primary"
                              size="sm"
                              className="w-100 text-nowrap"
                              style={{ ...fieldH, maxWidth: 150 }}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={handleAddItem}
                            >
                              {editIndex >= 0 ? t("Update Item") : t("Add Item")}
                            </Button>
                          </FormGroup>
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
                          {items.map((r, idx) => {
                            const rowStyle = getItemRowStyle(r);
                            return (
                              <tr key={r.rowId || `${r.lotNo}-${idx}`} style={rowStyle}>
                                <td style={rowStyle}>
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
                                  style={{ ...rowStyle, whiteSpace: "nowrap" }}
                                >
                                  {renderItemCell(r, col)}
                                </td>
                              ))}
                            </tr>
                            );
                          })}
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
                  {items.length > 0 && (
                    <div className="mt-2 text-muted small">
                      {t("Showing")} 1 {t("to")} {items.length} {t("of")} {items.length} {t("entries")}
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col xs={12} lg={3}>
              <Card className="shadow-sm border-0 rounded-3 mb-3">
                <CardBody className="p-3">
                  <Label className="form-label fw-bold text-uppercase mb-2" style={{ fontSize: "12px" }}>{t("ENTER LOT NO")}</Label>
                  {!readOnly && (
                    <>
                      <FormGroup className="mb-2">
                        <Input
                          type="textarea"
                          rows={7}
                          placeholder={t("Add by lot no")}
                          value={bulkLotNos}
                          onChange={(e) => setBulkLotNos(e.target.value)}
                        />
                      </FormGroup>
                      <Button color="primary" size="sm" className="w-100 mb-2" onClick={handleGetItemFromList}>
                        {t("Get Item From List")}
                      </Button>
                      <Button color="primary" outline size="sm" className="w-100 mb-3" onClick={() => setExcelOpen(true)}>
                        {t("Get Back from Excel")}
                      </Button>
                    </>
                  )}
                  {isEdit && (header.code || editId) && (
                    <Button
                      color="primary"
                      outline
                      size="sm"
                      className="w-100 mb-3"
                      onClick={() =>
                        window.open(
                          `/mixsale/MixSaleCurStatusPrintInv?ID=${encodeURIComponent(header.code || editId)}`,
                          "_blank"
                        )
                      }
                    >
                      <i className="ri-printer-line me-1" />
                      {t("Current Status Invoice")}
                    </Button>
                  )}
                  <fieldset disabled={readOnly} className="border-0 m-0 p-0" style={{ minWidth: 0 }}>
                    <FormGroup className="mb-2">
                      <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("ADDRESS")}</Label>
                      <Select
                        styles={customStyles}
                        options={addressOpts}
                        value={
                          addressOpts.find((o) => String(o.value) === String(header.address) || (o.id && String(o.id) === String(header.address))) ||
                          (header.address ? { value: String(header.address), label: String(header.address) } : null)
                        }
                        onChange={(o) => setHeaderField("address", o?.value || "")}
                        placeholder={t("Address")}
                        isDisabled={readOnly}
                      />
                    </FormGroup>
                    <FormGroup className="mb-0">
                      <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px" }}>{t("PRINT INVOICE DATE")}</Label>
                      <Input
                        type="date"
                        className="form-control-sm"
                        style={fieldH}
                        value={header.printInvDate}
                        onChange={(e) => setHeaderField("printInvDate", e.target.value)}
                      />
                    </FormGroup>
                  </fieldset>
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
              <Label className="form-label d-block">{t("Download Sale File Format")}</Label>
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
          <ModalHeader toggle={() => setConsignOpen(false)}>{t("MixMemo To MixSale")}</ModalHeader>
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
                        <th style={{ whiteSpace: "nowrap" }}>{t("MemoNo")}</th>
                        <th style={{ whiteSpace: "nowrap" }}>{t("LotNo")}</th>
                        <th className="text-end" style={{ whiteSpace: "nowrap" }}>{t("Cts")}</th>
                        <th className="text-end" style={{ whiteSpace: "nowrap" }}>{t("Sale")}</th>
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
              {t("MMemo To MSale")}
            </Button>
          </ModalFooter>
        </Modal>

        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default MixSaleForm;
