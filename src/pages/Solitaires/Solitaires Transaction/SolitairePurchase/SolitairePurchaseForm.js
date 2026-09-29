import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  addSolitairePurchase,
  editSolitairePurchase,
  getAccGrpMasters,
  getCurrencyRates,
  getSolitaireLots,
  getSolitairePurchaseConsignment,
  getSolitairePurchaseDetail,
  getSolitairePurchaseLotDetail,
  getSolitairePurchasePageData,
  getSolitairePurchaseRapRate
} from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  REPORT_COMPANY_SETTINGS_EVENT
} from "../../../../helpers/reportCompanyDefaults";
import { parseExcelFile } from "../../../../helpers/excel_helper";
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

const toNum = (v, d = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : d;
};

const fmt = (v, decimals = 2) => toNum(v).toFixed(decimals);

const PURCHASE_ITEM_COLUMNS = [
  { key: "lotNo", label: "LotNo" },
  { key: "itemName", label: "ItemName" },
  { key: "weight", label: "Weight", align: "end", decimals: 2, footer: "weight" },
  { key: "pcs", label: "Pcs", align: "end", footer: "pcs" },
  { key: "mrp", label: "MRP", align: "end", decimals: 2, footer: "avgMrp" },
  { key: "back", label: "PurchaseBack", align: "end", decimals: 2, footer: "avgBack" },
  { key: "rate", label: "PurchaseRate", align: "end", decimals: 2, footer: "avgRate" },
  { key: "less1", label: "Less1", align: "end", decimals: 2 },
  { key: "less2", label: "Less2", align: "end", decimals: 2 },
  { key: "less3", label: "Less3", align: "end", decimals: 2 },
  { key: "amount", label: "PurAmount", align: "end", decimals: 2, footer: "totAmount" },
  { key: "shape", label: "Shape" },
  { key: "color", label: "Color" },
  { key: "clarity", label: "Clarity" },
  { key: "cut", label: "Proportion" },
  { key: "polish", label: "Polish" },
  { key: "symmetry", label: "Symmetry" },
  { key: "fl", label: "FL" },
  { key: "lw", label: "LW", align: "end", decimals: 2 },
  { key: "length", label: "Length", align: "end", decimals: 2 },
  { key: "width", label: "Width", align: "end", decimals: 2 },
  { key: "depth", label: "Depth", align: "end", decimals: 2 },
  { key: "totDep", label: "TotDep", align: "end", decimals: 2 },
  { key: "tablePer", label: "TablePer", align: "end", decimals: 2 },
  { key: "culet", label: "Culet" },
  { key: "gMin", label: "GMin" },
  { key: "gMax", label: "GMax" },
  { key: "min", label: "Min", align: "end", decimals: 2 },
  { key: "max", label: "Max", align: "end", decimals: 2 },
  { key: "girdlePer", label: "GirdlePer", align: "end", decimals: 2 },
  { key: "brown", label: "Brown" },
  { key: "milky", label: "Milky" },
  { key: "ha", label: "HA" },
  { key: "natts", label: "Natts" },
  { key: "eyeClean", label: "EyeClean" },
  { key: "oit", label: "OIT" },
  { key: "oig", label: "OIG" },
  { key: "oic", label: "OIC" },
  { key: "oip", label: "OIP" },
  { key: "tabInc", label: "TabInc" },
  { key: "incPattern", label: "IncPattern" },
  { key: "lab", label: "LAB" },
  { key: "certificateNo", label: "CertificateNo" },
  { key: "inscriptionText", label: "Inscription Text" },
  { key: "ch", label: "CH", align: "end", decimals: 2 },
  { key: "ca", label: "CA", align: "end", decimals: 2 },
  { key: "pa", label: "PA", align: "end", decimals: 2 },
  { key: "ph", label: "PH", align: "end", decimals: 2 },
  { key: "strLn", label: "String Length", align: "end", decimals: 2 },
  { key: "lrHalf", label: "LR Half", align: "end", decimals: 2 },
  { key: "luster", label: "Luster" },
  { key: "keyToSymbols", label: "KeyToSymbols" },
  { key: "labComments", label: "LabComments" },
  { key: "reportDate", label: "Report Date" },
  { key: "mfgComments", label: "Manufacturing Comments" },
  { key: "memberRemarks", label: "MemberRemarks" },
  { key: "igiCut", label: "IGI Cut" },
  { key: "hrdCut", label: "HRD Cut" },
  { key: "girdleCondition", label: "GirdleCondition" },
  { key: "askingBack", label: "AskingBack", align: "end", decimals: 2 },
  { key: "askingRate", label: "AskingRate", align: "end", decimals: 2 },
  { key: "actualBack", label: "ActualBack", align: "end", decimals: 2 },
  { key: "actualRate", label: "ActualRate", align: "end", decimals: 2 },
  { key: "green", label: "Green" },
  { key: "flColor", label: "FLColor" },
  { key: "culetCondition", label: "CuletCondition" },
  { key: "shade", label: "Shade" },
  { key: "crownInclusion", label: "CrownInclusion" },
  { key: "bit", label: "BIT" },
  { key: "bis", label: "BIS" },
  { key: "fancyColor", label: "FancyColor" },
  { key: "fancyColorIntensity", label: "FancyColorIntensity" },
  { key: "fancyColorOvertone", label: "FancyColorOvertone" },
  { key: "proportion", label: "Proportion" },
  { key: "rmk", label: "RMK" },
  { key: "itemGroup", label: "Item Group" },
  { key: "treatment", label: "Treatment" },
  { key: "rfid", label: "RFID" },
  { key: "mfgSeriesID", label: "Manufacturing Series ID" },
  { key: "mfgPacketID", label: "Manufacturing Packet ID" },
  { key: "size", label: "Size" },
  { key: "status", label: "Status" },
  { key: "memoTransCode", label: "Memo Transaction Code", align: "end" },
  { key: "rtnCarats", label: "Return Carats", align: "end", decimals: 3 }
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
  pcs: getNumVal(r, "Pcs") || 1,
  mrp: getNumVal(r, "MRP", "PurchaseMRP"),
  back: getNumVal(r, "PurchaseBack", "PMRPDown", "Back"),
  rate: getNumVal(r, "PurchaseRate", "Rate"),
  less1: getNumVal(r, "Less1"),
  less2: getNumVal(r, "Less2"),
  less3: getNumVal(r, "Less3"),
  amount: getNumVal(r, "PurAmount", "Amount"),
  shape: getStrVal(r, "Shape", "ShapeId"),
  color: getStrVal(r, "Color", "ColorId"),
  clarity: getStrVal(r, "Clarity", "ClarityId"),
  size: getStrVal(r, "Size", "SizeId"),
  memoTransCode: getNumVal(r, "MemoTransCode", "memoTransCode", "MemoTranCode"),
  rtnCarats: getNumVal(r, "RtnCarats", "ReturnCarats"),
  ...mapGradingFromSource(r)
});

const renderItemCell = (row, col) => {
  // Simple PUR: MemoTransCode is 0 — show blank (do not display SalePurTran.Code)
  if (col.key === "memoTransCode") {
    const code = toNum(row.memoTransCode);
    return code ? String(code) : "";
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
      return fmt(totals.totCts, 2);
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
  if (row.status === "Purchase") return { color: "green" };
  if (row.status === "Consingment-rtn") return { color: "red" };
  return undefined;
};

const calcItemAmount = (weight, rate, less1, less2, less3) => {
  let amount = toNum(weight) * toNum(rate);
  const l1 = toNum(less1);
  const l2 = toNum(less2);
  const l3 = toNum(less3);
  if (l1 !== 0) amount = (amount * (100 + l1)) / 100;
  if (l2 !== 0) amount = (amount * (100 + l2)) / 100;
  if (l3 !== 0) amount = (amount * (100 + l3)) / 100;
  return Math.round(amount * 100) / 100;
};

const emptyItem = () => ({
  lotNo: "",
  itemName: "",
  weight: "",
  pcs: "",
  mrp: "",
  back: "",
  rate: "",
  less1: "",
  less2: "",
  less3: "",
  amount: "",
  shape: "",
  color: "",
  clarity: "",
  size: "",
  memoTransCode: 0,
  rtnCarats: 0,
  ...mapGradingFromSource({})
});

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

const SolitairePurchaseForm = ({ mode = "add" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = mode === "edit";
  const editId = searchParams.get("Id") || searchParams.get("id") || "";
  const urlMode = String(searchParams.get("Mode") || searchParams.get("mode") || "").toLowerCase();
  const isView = urlMode === "view";
  const isConsignmentMode = urlMode === "consignment";
  const readOnly = isView;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [typeOpts, setTypeOpts] = useState([]);
  const [subTypeOpts, setSubTypeOpts] = useState([]);
  const [categoryOpts, setCategoryOpts] = useState([]);
  const [currencyOpts, setCurrencyOpts] = useState([]);

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

  const [mOp, setMOp] = useState("*");
  const [sOp, setSOp] = useState("*");
  const [editIndex, setEditIndex] = useState(-1);
  const [items, setItems] = useState([]);
  const [entry, setEntry] = useState(emptyItem());

  const [excelOpen, setExcelOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [consignOpen, setConsignOpen] = useState(false);
  const [consignRows, setConsignRows] = useState([]);
  const [consignSort, setConsignSort] = useState({ key: null, direction: 'asc' });

  const handleConsignSort = (key) => {
    setConsignSort((prev) => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  };

  const sortedConsignRows = useMemo(() => {
    if (!consignSort.key) return consignRows;
    const sorted = [...consignRows];
    sorted.sort((a, b) => {
      const aVal = a[consignSort.key];
      const bVal = b[consignSort.key];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return consignSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      if (aStr < bStr) return consignSort.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return consignSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [consignRows, consignSort]);

  const toggleSelectAllConsign = (checked) => {
    setConsignRows((prev) => prev.map((x) => ({ ...x, selected: checked })));
  };

  const renderSortHeader = (key, label) => {
    const isSorted = consignSort.key === key;
    const isAsc = consignSort.direction === 'asc';
    return (
      <div 
        onClick={() => handleConsignSort(key)} 
        style={{ cursor: "pointer", userSelect: "none" }} 
        className="d-inline-flex align-items-center"
      >
        <span>{label}</span>
        <span 
          style={{ 
            display: "inline-flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            fontSize: "8px", 
            lineHeight: "0.8", 
            marginLeft: "6px",
            width: "10px"
          }}
        >
          <span style={{ color: isSorted && isAsc ? "#405189" : "#c8c8c8" }}>▲</span>
          <span style={{ color: isSorted && !isAsc ? "#405189" : "#c8c8c8", marginTop: "-2px" }}>▼</span>
        </span>
      </div>
    );
  };


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
      input: (p) => ({
        ...p,
        margin: 0,
        padding: 0,
        color: "var(--vz-body-color, #495057)"
      }),
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
    if (!lotInput || lotInput.trim().length < 2) {
      setLotOpts([]);
      return;
    }
    const tmr = setTimeout(async () => {
      setLotLoading(true);
      try {
        const res = await getSolitaireLots(lotInput);
        const raw = Array.isArray(res) ? res : res?.data || res?.Data || [];
        setLotOpts(
          raw.map((item) => {
            const val = item.name || item.Name || item.id || item.ID || item.textName || item.TextName || "";
            const lbl = item.textName || item.TextName || item.text || item.Name || item.name || item.id || item.ID || "";
            return {
              value: String(val),
              label: String(lbl).toUpperCase()
            };
          })
        );
      } catch {
        /* ignore */
      } finally {
        setLotLoading(false);
      }
    }, 300);
    return () => clearTimeout(tmr);
  }, [lotInput]);

  const applyCurrencyRates = async (curCode) => {
    if (!curCode) return;
    try {
      const res = await getCurrencyRates(curCode);
      if (res?.success || res?.Success) {
        const base = toNum(res.baseRate ?? res.BaseRate, 1);
        const sBase = toNum(res.sBaseRate ?? res.SBaseRate, 1);
        const opM = getVal(res, "MasterCurrencyOperator", "masterCurrencyOperator") || "*";
        const opS = getVal(res, "StockCurrencyOperator", "stockCurrencyOperator") || "*";
        setMOp(opM);
        setSOp(opS);
        setHeader((prev) => ({ ...prev, baseRate: base, sBaseRate: sBase }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPageData = async () => {
    try {
      const res = await getSolitairePurchasePageData();
      if (!(res?.success || res?.Success)) {
        toast.error(res?.Data || res?.data || t("Failed to load page data."));
        return null;
      }
      const d = res.Data || res.data || {};
      const types = mapBasicWithNameAsValue(d.Type || d.type);
      const subs = mapBasicWithNameAsValue(d.SubType || d.subType);
      const cats = mapBasicWithNameAsValue(d.Category || d.category);
      const curs = mapBasic(d.CurrencyList || d.currencyList);
      const defaultCurrencyCode = d.DefaultCurrencyCode || d.defaultCurrencyCode || "";
      setTypeOpts(types);
      setSubTypeOpts(subs);
      setCategoryOpts(cats);
      setCurrencyOpts(curs);
      return { types, subs, cats, curs, defaultCurrencyCode };
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
      const res = await getSolitairePurchaseDetail(editId, isConsignmentMode ? "consignment" : undefined);
      if (!(res?.success || res?.Success)) {
        toast.error(res?.Data || res?.data || (isConsignmentMode ? t("Consignment not found.") : t("Purchase not found.")));
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
      const memoInv = getVal(h, "InvNo");
      setHeader({
        code: toNum(getVal(h, "Code"), 0),
        trnDate: trn ? toLocalDateStr(trn) || todayIso() : todayIso(),
        // New PUR invoice # is generated on save in consignment mode (MVC shows memo/blank)
        invNo: isConsignmentMode ? "" : memoInv,
        billNo: getVal(h, "BillNo"),
        invType: resolveSelectValue(pageData?.types || typeOpts, invTypeRaw),
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
        description: getVal(h, "Description", "InvDisc"),
        consignmentNo: isConsignmentMode ? memoInv : getVal(h, "ConsignmentNo"),
        chkGrading: !!(getVal(h, "chkGrading") === true || getVal(h, "chkGrading") === "true"),
        chkoldpur: !!(getVal(h, "chkoldpur") === true || getVal(h, "chkoldpur") === "true"),
        plusMinusAmount: toNum(getVal(h, "PlusMinusAmount")),
        roundAmount: toNum(getVal(h, "RoundAmount")),
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

      const loadedCurCode = String(getVal(h, "CurCode") || "");
      if (loadedCurCode) {
        await applyCurrencyRates(loadedCurCode);
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
        setHeader((prev) => ({
          ...prev,
          invType: page.types[0]?.value || "",
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
    const amount = calcItemAmount(next.weight, next.rate, next.less1, next.less2, next.less3);
    return { ...next, amount: fmt(amount) };
  };

  const onEntryChange = (key, value) => {
    setEntry((prev) => {
      let next = { ...prev, [key]: value };
      if (key === "mrp" || key === "back") {
        const mrp = toNum(key === "mrp" ? value : next.mrp);
        const back = toNum(key === "back" ? value : next.back);
        next.rate = fmt(((100 + back) * mrp) / 100);
      }
      if (key === "rate") {
        const mrp = toNum(next.mrp);
        const rate = toNum(value);
        if (mrp !== 0) next.back = fmt((rate / mrp) * 100 - 100);
      }
      return recalcEntryAmount(next);
    });
  };

  const fillFromLot = async (lotNo) => {
    if (!lotNo) return;
    try {
      const res = await getSolitairePurchaseLotDetail(lotNo);
      if (!(res?.success || res?.Success)) {
        toast.warning(res?.Data || res?.data || t("Lot detail not found."));
        return;
      }
      const rows = res.Data || res.data || [];
      const lot = Array.isArray(rows) ? rows[0] : rows;
      if (!lot) return;

      // Match MVC get-lot-detail: PurchaseMRP, Carats, PurchaseBack; Rate starts at 0 then calc from MRP+Back
      const mrp = getNumVal(lot, "PurchaseMRP", "MRP");
      const back = getNumVal(lot, "PurchaseBack", "Back");
      const weight = getNumVal(lot, "Carats", "Weight");
      const pcs = getNumVal(lot, "Pcs") || 1;
      let rate = 0;
      if (mrp !== 0) {
        rate = Math.round(((100 + back) * mrp) / 100 * 10000) / 10000;
      }

      setEntry((prev) =>
        recalcEntryAmount({
          ...prev,
          lotNo: getStrVal(lot, "LotNo") || lotNo,
          itemName: getStrVal(lot, "ItemName"),
          weight,
          pcs,
          mrp,
          back,
          rate,
          less1: prev.less1 === "" || prev.less1 == null ? "0" : prev.less1,
          less2: prev.less2 === "" || prev.less2 == null ? "0" : prev.less2,
          less3: prev.less3 === "" || prev.less3 == null ? "0" : prev.less3,
          shape: getStrVal(lot, "Shape", "ShapeId"),
          color: getStrVal(lot, "Color", "ColorId"),
          clarity: getStrVal(lot, "Clarity", "ClarityId"),
          size: getStrVal(lot, "Size", "SizeId"),
          ...mapGradingFromSource(lot)
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
    let rate = toNum(entry.rate);
    let back = toNum(entry.back);
    const mrp = toNum(entry.mrp);

    if (!lotNo) {
      toast.warning(t("Lot Number is required."));
      return;
    }
    if (weight <= 0) {
      toast.warning(t("Carat is invalid."));
      return;
    }
    // Match MVC purchase add / import-excel-data: require at least one of rate or discount,
    // then derive the other from MRP when possible.
    if (rate === 0 && back === 0) {
      toast.warning(t("Rate and Discount both can not be 0."));
      return;
    }
    if (rate !== 0 && mrp !== 0) back = (rate * 100) / mrp - 100;
    else if (mrp !== 0) rate = ((100 + back) * mrp) / 100;

    const amount = calcItemAmount(weight, rate, entry.less1, entry.less2, entry.less3);

    const row = {
      ...entry,
      lotNo,
      itemName: entry.itemName || lotSel?.label || "",
      weight: Math.round(weight * 1000) / 1000,
      pcs: toNum(entry.pcs, 1),
      mrp,
      back: Math.round(back * 100) / 100,
      rate: Math.round(rate * 100) / 100,
      less1: toNum(entry.less1),
      less2: toNum(entry.less2),
      less3: toNum(entry.less3),
      amount,
      memoTransCode: toNum(entry.memoTransCode),
      rtnCarats: toNum(entry.rtnCarats)
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

  const mapImportRows = (headers, dataRows) => {
    // Match MVC purchase/import-excel-data + DiaSense / PurchaseTransaction column names.
    const norm = (h) =>
      String(h || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
    const headersN = (headers || []).map(norm);
    // Prefer first name in the list (PurPrice over Rate, Discount over Back).
    const idx = (...names) => {
      for (const name of names.map(norm)) {
        const i = headersN.findIndex((h) => h === name);
        if (i >= 0) return i;
      }
      return -1;
    };
    // Fuzzy header match for combined labels like "Discount/Back", "USDPricePerCarat".
    const idxIncludes = (...parts) => {
      for (const part of parts.map(norm)) {
        const i = headersN.findIndex((h) => h === part || h.includes(part));
        if (i >= 0) return i;
      }
      return -1;
    };

    // MVC: LotNo = StoneID; MfgPacketID = "Lot No". If StoneID blank, fall back to Lot No (React).
    const iStone = idx("stoneid", "stone id", "stone #");
    const iLotFallback = idx("lotno", "lot no", "lot", "stockno", "stock #");
    const iPacket = idx("lot no", "lotno");
    const iWt = idx("carats", "carat", "weight", "cts", "wt", "opening carat", "openingcarat");
    const iPcs = idx("pcs", "qty", "quantity");
    const iMrp = idx("mrp", "msp", "rap", "rapa");
    const iBackExact = idx(
      "discount",
      "discount/back",
      "back",
      "purchaseback",
      "purchase back",
      "pmrpdown"
    );
    const iBack = iBackExact >= 0 ? iBackExact : idxIncludes("discount", "purchaseback");
    const iRateExact = idx(
      "purprice",
      "pur price",
      "purchaserate",
      "purchase rate",
      "usdpricepercarat",
      "usd price per carat",
      "pricepercarat",
      "cogs",
      "rate",
      "price"
    );
    const iRate = iRateExact >= 0 ? iRateExact : idxIncludes("purprice", "purchaserate", "pricepercarat");
    const iL1 = idx("less1");
    const iL2 = idx("less2");
    const iL3 = idx("less3");
    const iShape = idx("shape", "shapeid");
    const iColor = idx("color", "colorid");
    const iClarity = idx("clarity", "clarityid");
    const iSize = idx("size", "sizeid");
    // MVC: Excel Cut → Pur.Cut (grid header "Proportion"); separate Proportion column also exists.
    const iCut = idx("cut");
    const iProportion = idx("proportion");
    const iPolish = idx("polish", "polishid");
    const iSymmetry = idx("symmetry", "sym", "symid");
    const iFl = idx("fl", "fluorescence", "fluo", "flid");
    const iLab = idx("cert", "lab", "certid");
    const iCertNo = idx("certificateno", "certificate no", "cert no", "certno");
    const iLw = idx("l:w %", "lw", "l:w", "ratio");
    // MVC reads exact columns "L"/"W"/"D" (not FL / LW). Prefer full names, then exact single letters only.
    const iLength = idx("length", "l");
    const iWidth = idx("width", "w");
    const iDepth = idx("depth", "d");
    const iTotDep = idx("totdep", "totaldepth", "tdep", "totdepth");
    const iTable = idx("table", "tableper", "tab%");
    const iCulet = idx("culet");
    const iGMin = idx("g.min", "gmin", "g min");
    const iGMax = idx("g.max", "gmax", "g max");
    const iMin = idx("min");
    const iMax = idx("max");
    const iGirdlePer = idx("girdleper", "girdle per");
    const iBrown = idx("brown");
    const iMilky = idx("milky");
    const iHa = idx("h&a", "ha");
    const iNatts = idx("natts");
    const iEyeClean = idx("eyeclean", "eye clean");
    const iAskingRate = idx("askingrate", "asking rate");
    const iAskingBack = idx("askingback", "asking back");
    const iActualRate = idx("actualrate", "actual rate");
    const iActualBack = idx("actualback", "actual back");
    const iKapan = idx("kapan/inv no", "kapan", "mfgseriesid");

    const cell = (cols, i) => (i >= 0 ? String(cols[i] ?? "").replace(/^"|"$/g, "").trim() : "");

    const rows = [];
    for (const cols of dataRows) {
      const stoneVal = cell(cols, iStone);
      const packetVal = cell(cols, iPacket >= 0 ? iPacket : iLotFallback);
      // Prefer StoneID (MVC); if blank use Lot No so edited DiaSense sheets still import.
      const lotNo = stoneVal || packetVal;
      const weight = toNum(cell(cols, iWt));
      // Skip blank / trailer rows (empty stone + carat). MVC loops all rows; empty carats are noise in templates.
      if (!lotNo && weight <= 0) continue;
      if (weight <= 0) continue;
      if (!lotNo) continue;

      // MVC: PurPrice → PurRate, Discount → Back
      let rate = toNum(cell(cols, iRate));
      if (rate < 0) rate = 0;
      let back = toNum(cell(cols, iBack));
      let mrp = toNum(cell(cols, iMrp));
      // Fallback: stock-style sheets often have AskingRate when PurPrice is blank.
      if (rate === 0) {
        const ask = toNum(cell(cols, iAskingRate));
        if (ask > 0) rate = ask;
      }

      // Rate/Back vs MRP derivation happens after GetRapRate enrichment (when Excel MRP is 0).
      if (rate === 0 && back === 0) {
        return { error: t("Rate and Discount both can not be 0."), rows: [] };
      }
      if (rate !== 0 && mrp !== 0) back = (rate * 100) / mrp - 100;
      else if (mrp !== 0) rate = ((100 + back) * mrp) / 100;

      let askingRate = toNum(cell(cols, iAskingRate));
      if (askingRate < 0) askingRate = 0;
      let askingBack = toNum(cell(cols, iAskingBack));
      let actualRate = toNum(cell(cols, iActualRate));
      if (actualRate < 0) actualRate = 0;
      let actualBack = toNum(cell(cols, iActualBack));
      if (askingRate !== 0 && mrp !== 0) askingBack = (askingRate * 100) / mrp - 100;
      else if (mrp !== 0 && askingBack !== 0) askingRate = ((100 + askingBack) * mrp) / 100;
      if (actualRate !== 0 && mrp !== 0) actualBack = (actualRate * 100) / mrp - 100;
      else if (mrp !== 0 && actualBack !== 0) actualRate = ((100 + actualBack) * mrp) / 100;

      const less1 = toNum(cell(cols, iL1));
      const less2 = toNum(cell(cols, iL2));
      const less3 = toNum(cell(cols, iL3));
      const shape = cell(cols, iShape);
      const color = cell(cols, iColor);
      const clarity = cell(cols, iClarity);
      const certificateNo = cell(cols, iCertNo);
      const cutVal = cell(cols, iCut);
      const proportionVal = cell(cols, iProportion) || cutVal;
      const roundedWeight = Math.round(weight * 1000) / 1000;
      const roundedRate = Math.round(rate * 100) / 100;
      const roundedBack = Math.round(back * 100) / 100;

      // MVC: ItemName = Shape + ' ' + Color + ' ' + Clarity + ' ' + CertificateNo
      const itemName = `${shape} ${color} ${clarity} ${certificateNo}`.replace(/\s+/g, " ").trim();

      rows.push({
        lotNo,
        itemName,
        weight: roundedWeight,
        pcs: toNum(cell(cols, iPcs), 1) || 1,
        mrp,
        back: roundedBack,
        rate: roundedRate,
        less1,
        less2,
        less3,
        amount: calcItemAmount(roundedWeight, roundedRate, less1, less2, less3),
        shape,
        color,
        clarity,
        size: cell(cols, iSize),
        polish: cell(cols, iPolish),
        symmetry: cell(cols, iSymmetry),
        fl: cell(cols, iFl),
        cut: cutVal,
        proportion: proportionVal,
        lab: cell(cols, iLab),
        certificateNo,
        lw: toNum(cell(cols, iLw)),
        length: toNum(cell(cols, iLength)),
        width: toNum(cell(cols, iWidth)),
        depth: toNum(cell(cols, iDepth)),
        totDep: toNum(cell(cols, iTotDep)),
        tablePer: toNum(cell(cols, iTable)),
        culet: cell(cols, iCulet),
        gMin: cell(cols, iGMin),
        gMax: cell(cols, iGMax),
        min: toNum(cell(cols, iMin)),
        max: toNum(cell(cols, iMax)),
        girdlePer: toNum(cell(cols, iGirdlePer)),
        brown: cell(cols, iBrown),
        milky: cell(cols, iMilky),
        ha: cell(cols, iHa),
        natts: cell(cols, iNatts),
        eyeClean: cell(cols, iEyeClean),
        askingRate: Math.round(askingRate * 100) / 100,
        askingBack: Math.round(askingBack * 100) / 100,
        actualRate: Math.round(actualRate * 100) / 100,
        actualBack: Math.round(actualBack * 100) / 100,
        mfgSeriesID: cell(cols, iKapan),
        mfgPacketID: packetVal,
        memoTransCode: 0,
        rtnCarats: 0
      });
    }
    return { rows };
  };

  /** MVC GetRapRate when Excel MRP is 0/blank, then Back = (rate*100/mrp)-100 when PurPrice != 0. */
  const enrichImportRowsWithRapRate = async (rows) => {
    const list = Array.isArray(rows) ? rows : [];
    const caratKey = (c) => String(Math.round(toNum(c) * 1000) / 1000);
    const rowKey = (shape, color, clarity, carat) =>
      `${String(shape || "").trim()}|${String(color || "").trim()}|${String(clarity || "").trim()}|${caratKey(carat)}`;

    const needIdx = [];
    const unique = new Map();
    list.forEach((r, i) => {
      if (toNum(r.mrp) !== 0) return;
      if (!r.shape || !r.color || !r.clarity || toNum(r.weight) <= 0) return;
      needIdx.push(i);
      const key = rowKey(r.shape, r.color, r.clarity, r.weight);
      if (!unique.has(key)) {
        unique.set(key, {
          shape: r.shape,
          color: r.color,
          clarity: r.clarity,
          carat: toNum(r.weight)
        });
      }
    });
    if (!needIdx.length) return list;

    try {
      const res = await getSolitairePurchaseRapRate(Array.from(unique.values()));
      if (!(res?.success || res?.Success)) return list;
      const data = res.Data || res.data || [];
      const mrpByKey = new Map();
      (Array.isArray(data) ? data : []).forEach((d) => {
        const key = rowKey(getVal(d, "Shape"), getVal(d, "Color"), getVal(d, "Clarity"), getNumVal(d, "Carat"));
        mrpByKey.set(key, getNumVal(d, "MRP", "mrp"));
      });

      needIdx.forEach((i) => {
        const r = list[i];
        const key = rowKey(r.shape, r.color, r.clarity, r.weight);
        const mrp = mrpByKey.get(key);
        if (!mrp || mrp === 0) return;
        r.mrp = mrp;
        let rate = toNum(r.rate);
        let back = toNum(r.back);
        if (rate !== 0 && mrp !== 0) back = (rate * 100) / mrp - 100;
        else if (mrp !== 0) rate = ((100 + back) * mrp) / 100;
        r.rate = Math.round(rate * 100) / 100;
        r.back = Math.round(back * 100) / 100;
        r.amount = calcItemAmount(toNum(r.weight), r.rate, toNum(r.less1), toNum(r.less2), toNum(r.less3));

        let askingRate = toNum(r.askingRate);
        let askingBack = toNum(r.askingBack);
        let actualRate = toNum(r.actualRate);
        let actualBack = toNum(r.actualBack);
        if (askingRate !== 0 && mrp !== 0) askingBack = (askingRate * 100) / mrp - 100;
        else if (mrp !== 0 && askingBack !== 0) askingRate = ((100 + askingBack) * mrp) / 100;
        if (actualRate !== 0 && mrp !== 0) actualBack = (actualRate * 100) / mrp - 100;
        else if (mrp !== 0 && actualBack !== 0) actualRate = ((100 + actualBack) * mrp) / 100;
        r.askingRate = Math.round(askingRate * 100) / 100;
        r.askingBack = Math.round(askingBack * 100) / 100;
        r.actualRate = Math.round(actualRate * 100) / 100;
        r.actualBack = Math.round(actualBack * 100) / 100;
      });
    } catch (err) {
      console.error(err);
    }
    return list;
  };

  const parseCsv = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return { rows: [] };
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const dataRows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));
    return mapImportRows(headers, dataRows);
  };

  const findExcelHeaderRowIndex = (rows) => {
    const markers = [
      "stoneid",
      "purprice",
      "discount",
      "discount/back",
      "carats",
      "carat",
      "usdpricepercarat",
      "lotno"
    ];
    for (let i = 0; i < Math.min(rows.length, 10); i += 1) {
      const cells = (rows[i] || []).map((h) =>
        String(h || "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ")
      );
      if (markers.some((m) => cells.some((c) => c === m || c.includes(m)))) return i;
    }
    return 0;
  };

  const densifyExcelRows = (rows) => {
    const width = rows.reduce((max, row) => Math.max(max, (row || []).length), 0);
    return rows.map((row) => {
      const dense = Array.from({ length: width }, (_, i) => {
        const v = row?.[i];
        return v === undefined || v === null ? "" : v;
      });
      return dense.map((c) => String(c).trim());
    });
  };

  const applyImportedRows = async (result) => {
    if (result?.error) {
      toast.warning(result.error);
      return;
    }
    let rows = result?.rows || [];
    if (!rows.length) {
      toast.warning(t("No valid rows found in file."));
      return;
    }
    rows = await enrichImportRowsWithRapRate(rows);
    setItems((prev) => {
      const map = new Map(prev.map((x) => [String(x.lotNo).toLowerCase(), x]));
      rows.forEach((r) => map.set(String(r.lotNo).toLowerCase(), r));
      return Array.from(map.values());
    });
    toast.success(t("Excel Import Success!"));
    setExcelOpen(false);
    setExcelFile(null);
  };

  const handleExcelAccept = async () => {
    if (!excelFile) {
      toast.warning(t("Please select a file."));
      return;
    }
    const name = (excelFile.name || "").toLowerCase();
    try {
      if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const parsed = await parseExcelFile(excelFile);
        if (!parsed.success || !parsed.rows?.length) {
          toast.error(parsed?.error?.message || t("Failed to parse Excel file."));
          return;
        }
        // parseExcelFile returns Array<Array> via sheet_to_json({ header: 1 }) — first matching header row.
        const headerIdx = findExcelHeaderRowIndex(parsed.rows);
        const dense = densifyExcelRows(parsed.rows);
        const headers = (dense[headerIdx] || []).map((h) => String(h || "").trim().toLowerCase());
        const dataRows = dense.slice(headerIdx + 1);
        await applyImportedRows(mapImportRows(headers, dataRows));
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          await applyImportedRows(parseCsv(String(e.target?.result || "")));
        } catch (err) {
          console.error(err);
          toast.error(t("Failed to parse CSV."));
        }
      };
      reader.readAsText(excelFile);
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to parse Excel file."));
    }
  };

  const downloadTemplate = () => {
    const a = document.createElement("a");
    a.href = (process.env.PUBLIC_URL || "") + "/excelfolder/DiaSense.xlsx";
    a.download = "DiaSense.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const viewConsignment = async () => {
    if (!party?.value && !header.consignmentNo) {
      toast.warning(t("Select Party or enter Consignment No."));
      return;
    }
    try {
      const res = await getSolitairePurchaseConsignment({
        partyCode: party?.value || "",
        memoNo: header.consignmentNo || ""
      });
      if (!(res?.success || res?.Success)) {
        toast.warning(res?.Data || res?.data || t("No consignment Found"));
        return;
      }
      const rows = (res.Data || res.data || []).map((r, i) => {
        const ctsVal = toNum(getVal(r, "carats", "BalanceCts"));
        return {
          key: i,
          selected: true,
          date: getVal(r, "Date"),
          memoNo: getVal(r, "MemoNo"),
          lotNo: getVal(r, "Lotno", "LotNo"),
          itemName: getVal(r, "itemname", "ItemName"),
          cts: ctsVal,
          purchase: ctsVal,
          rtn: toNum(getVal(r, "RtnCts")),
          balCts: 0,
          mrp: toNum(getVal(r, "MRP")),
          back: toNum(getVal(r, "Back")),
          rate: toNum(getVal(r, "rate", "Rate")),
          memoTransCode: toNum(getVal(r, "MemoTransCode")),
          symbol: getVal(r, "Symbol")
        };
      });
      setConsignRows(rows);
      setConsignOpen(true);
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load consignment."));
    }
  };

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
        const weight = toNum(r.purchase);
        const rate = toNum(r.rate);
        const row = {
          lotNo,
          itemName: r.itemName,
          weight,
          pcs: 1,
          mrp: toNum(r.mrp),
          back: toNum(r.back),
          rate,
          less1: 0,
          less2: 0,
          less3: 0,
          amount: calcItemAmount(weight, rate, 0, 0, 0),
          shape: "",
          color: "",
          clarity: "",
          size: "",
          polish: "",
          symmetry: "",
          fl: "",
          lab: "",
          certificateNo: "",
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
      Mode: isConsignmentMode ? "consignment" : "PUR",
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
      Size: r.size,
      Color: r.color,
      Clarity: r.clarity,
      Weight: toNum(r.weight),
      Pcs: toNum(r.pcs, 1),
      MRP: toNum(r.mrp),
      PurchaseBack: toNum(r.back),
      PurchaseRate: toNum(r.rate),
      PurAmount: toNum(r.amount),
      Cut: r.cut,
      Polish: r.polish,
      Symmetry: r.symmetry,
      FL: r.fl,
      Proportion: r.proportion,
      LW: toNum(r.lw),
      Length: toNum(r.length),
      Width: toNum(r.width),
      Depth: toNum(r.depth),
      TotDep: toNum(r.totDep),
      TablePer: toNum(r.tablePer),
      Culet: r.culet,
      GMin: r.gMin,
      GMax: r.gMax,
      Min: toNum(r.min),
      Max: toNum(r.max),
      GirdlePer: toNum(r.girdlePer),
      GirdleCondition: r.girdleCondition,
      Brown: r.brown,
      Green: r.green,
      Milky: r.milky,
      HA: r.ha,
      Natts: r.natts,
      EyeClean: r.eyeClean,
      Shade: r.shade,
      Luster: r.luster,
      OIT: r.oit,
      OIG: r.oig,
      OIC: r.oic,
      OIP: r.oip,
      BIT: r.bit,
      BIS: r.bis,
      LAB: r.lab,
      CertificateNo: r.certificateNo,
      InscriptionText: r.inscriptionText,
      CH: toNum(r.ch),
      CA: toNum(r.ca),
      PA: toNum(r.pa),
      PH: toNum(r.ph),
      StrLn: toNum(r.strLn),
      LrHalf: toNum(r.lrHalf),
      KeyToSymbols: r.keyToSymbols,
      LabComments: r.labComments,
      ReportDate: r.reportDate,
      MemberRemarks: r.memberRemarks,
      FLColor: r.flColor,
      CuletCondition: r.culetCondition,
      FancyColor: r.fancyColor,
      FancyColorIntensity: r.fancyColorIntensity,
      FancyColorOvertone: r.fancyColorOvertone,
      ItemGroup: r.itemGroup,
      MfgSeriesID: r.mfgSeriesID,
      MfgPacketID: r.mfgPacketID,
      AskingBack: toNum(r.askingBack),
      AskingRate: toNum(r.askingRate),
      ActualBack: toNum(r.actualBack),
      ActualRate: toNum(r.actualRate),
      Less1: toNum(r.less1),
      Less2: toNum(r.less2),
      Less3: toNum(r.less3),
      MemoTransCode: toNum(r.memoTransCode),
      RtnCarats: toNum(r.rtnCarats),
      ReturnCarats: toNum(r.rtnCarats),
      ImagePath: r.imagePath,
      VideoPath: r.videoPath,
      PagePath: r.pagePath,
      CountryOfOrigin: r.countryOfOrigin,
      CountryOfMfg: r.countryOfMfg,
      Status: r.status
    }));

    return { SalePur: salePur, Items: payloadItems };
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
      const res = isEdit ? await editSolitairePurchase(payload) : await addSolitairePurchase(payload);
      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || t("Saved successfully."));
        navigate("/purchase/purchase-list", {
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

  const title = isConsignmentMode
    ? t("Consignment To Purchase")
    : isView
      ? t("View Purchase")
      : isEdit
        ? t("Edit Purchase")
        : t("Add Purchase");
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
          <BreadCrumb title={title} pageTitle={isConsignmentMode ? t("Consignment In") : t("Purchases")} />

          <Row className="align-items-start g-3 mb-3">
            <Col xs={12}>
              <Card className="shadow-sm border-0 rounded-3 mb-0">
                <CardHeader className="bg-transparent border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                    <i className="ri-shopping-bag-3-line fs-20" />
                    {title}
                  </h5>
                  <div className="d-flex gap-2 flex-wrap">
                    {isEdit && !isConsignmentMode && header.invNo && (
                      <Button
                        color="soft-info"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `/purchase/PurCurStatusPrintInv?InvNo=${encodeURIComponent(header.invNo)}`,
                            "_blank"
                          )
                        }
                      >
                        <i className="ri-file-list-3-line me-1" />
                        {t("Current Status Invoice")}
                      </Button>
                    )}
                    {!readOnly && (
                      <Button color="soft-success" size="sm" onClick={() => setExcelOpen(true)}>
                        <i className="ri-file-excel-2-line me-1" />
                        {t("Import Excel")}
                      </Button>
                    )}
                    <Link
                      to={isConsignmentMode ? "/consignment/consignment-list" : "/purchase/purchase-list"}
                      className="btn btn-soft-secondary btn-sm"
                    >
                      {t("Back")}
                    </Link>
                    {!readOnly && (
                      <Button color="primary" size="sm" disabled={saving} onClick={handleSubmit}>
                        {saving ? t("Saving...") : t("Submit")}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="pb-2">
                  <fieldset disabled={readOnly} className="border-0 m-0 p-0" style={{ minWidth: 0 }}>
                    <Row className="g-2">
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Date")}</Label>
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
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Invoice Number")}</Label>
                          <Input
                            className="form-control-sm custom-readonly-input"
                            style={fieldH}
                            value={header.invNo}
                            readOnly={true}
                            onChange={(e) => setHeaderField("invNo", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Bill No")}</Label>
                          <Input
                            className="form-control-sm"
                            style={fieldH}
                            value={header.billNo}
                            onChange={(e) => setHeaderField("billNo", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Type")}</Label>
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
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("SubType")}</Label>
                          <Select
                            styles={customStyles}
                            options={subTypeOpts}
                            value={subTypeOpts.find((o) => String(o.value) === String(header.subType)) || null}
                            onChange={(o) => setHeaderField("subType", o?.value || "")}
                            placeholder={t("SubType")}
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Category")}</Label>
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

                      <Col md={3} sm={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">
                            {t("Party")}
                            {!readOnly && (
                              <Link to="/account/add-accountgroup" className="ms-2 small text-primary" target="_blank">
                                {t("Add Account/Group")}
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
                              else if (meta.action === "input-blur" || meta.action === "menu-close") {
                                setPartyInput("");
                                setPartyOpts([]);
                              }
                            }}
                            isLoading={partyLoading}
                            placeholder={t("Search Party...")}
                            isClearable
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={1} sm={3}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Due Days")}</Label>
                          <Input
                            type="number"
                            className="form-control-sm"
                            style={fieldH}
                            value={header.dueDays}
                            onChange={(e) => setHeaderField("dueDays", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={3}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Due Date")}</Label>
                          <Input
                            type="date"
                            className="form-control-sm custom-readonly-input"
                            style={fieldH}
                            value={header.dueDate}
                            readOnly={true}
                            onChange={(e) => setHeaderField("dueDate", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Currency")}</Label>
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
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{masterSymbol} Rate</Label>
                          <Input
                            type="number"
                            className="form-control-sm"
                            style={fieldH}
                            value={header.baseRate}
                            onChange={(e) => setHeaderField("baseRate", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{stockSymbol} Rate</Label>
                          <Input
                            type="number"
                            className="form-control-sm"
                            style={fieldH}
                            value={header.sBaseRate}
                            onChange={(e) => setHeaderField("sBaseRate", e.target.value)}
                          />
                        </FormGroup>
                      </Col>

                      <Col md={3} sm={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Comm Agent")}</Label>
                          <Select
                            styles={customStyles}
                            options={commOpts}
                            value={commission}
                            onChange={setCommission}
                            onInputChange={(v, meta) => {
                              if (meta.action === "input-change") setCommInput(v);
                              else if (meta.action === "input-blur" || meta.action === "menu-close") {
                                setCommInput("");
                                setCommOpts([]);
                              }
                            }}
                            isLoading={commLoading}
                            placeholder={t("Search...")}
                            isClearable
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={1} sm={3}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Com%")}</Label>
                          <Input
                            type="number"
                            className="form-control-sm"
                            style={fieldH}
                            value={header.adatPer}
                            onChange={(e) => setHeaderField("adatPer", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={3}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Com Amount")}</Label>
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
                      <Col md={3} sm={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Broker")}</Label>
                          <Select
                            styles={customStyles}
                            options={brokerOpts}
                            value={broker}
                            onChange={setBroker}
                            onInputChange={(v, meta) => {
                              if (meta.action === "input-change") setBrokerInput(v);
                              else if (meta.action === "input-blur" || meta.action === "menu-close") {
                                setBrokerInput("");
                                setBrokerOpts([]);
                              }
                            }}
                            isLoading={brokerLoading}
                            placeholder={t("Search...")}
                            isClearable
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={1} sm={3}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Bro%")}</Label>
                          <Input
                            type="number"
                            className="form-control-sm"
                            style={fieldH}
                            value={header.brokerPer}
                            onChange={(e) => setHeaderField("brokerPer", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={3}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Bro Amount")}</Label>
                          <Input className="form-control-sm" style={fieldH} value={fmt(summary.broDisplay)} readOnly />
                        </FormGroup>
                      </Col>

                      <Col md={4} sm={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Description")}</Label>
                          <Input
                            className="form-control-sm"
                            style={fieldH}
                            value={header.description}
                            onChange={(e) => setHeaderField("description", e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={3} sm={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Consignment No")}</Label>
                          <div className="d-flex gap-1">
                            <Input
                              className="form-control-sm"
                              style={fieldH}
                              value={header.consignmentNo}
                              onChange={(e) => setHeaderField("consignmentNo", e.target.value)}
                            />
                            <Button color="primary" size="sm" style={fieldH} onClick={viewConsignment}>
                              {t("View")}
                            </Button>
                          </div>
                        </FormGroup>
                      </Col>
                      <Col xs={12} md={5} className="d-flex align-items-center gap-3 mb-2 flex-wrap pt-1">
                        <div className="form-check form-check-md mb-0 d-flex align-items-center gap-2">
                          <Input
                            type="checkbox"
                            className="form-check-input"
                            id="chkGrading"
                            checked={!!header.chkGrading}
                            onChange={(e) => setHeaderField("chkGrading", e.target.checked)}
                            style={{ width: 18, height: 18, marginTop: 0 }}
                          />
                          <Label className="form-check-label mb-0" htmlFor="chkGrading" style={{ fontSize: 13 }}>
                            {t("Save Grading")}
                          </Label>
                        </div>
                        <div className="form-check form-check-md mb-0 d-flex align-items-center gap-2">
                          <Input
                            type="checkbox"
                            className="form-check-input"
                            id="chkoldpur"
                            checked={!!header.chkoldpur}
                            onChange={(e) => setHeaderField("chkoldpur", e.target.checked)}
                            style={{ width: 18, height: 18, marginTop: 0 }}
                          />
                          <Label className="form-check-label mb-0" htmlFor="chkoldpur" style={{ fontSize: 13 }}>
                            {t("Purchase of Last Year")}
                          </Label>
                        </div>
                      </Col>
                    </Row>
                  </fieldset>
                </CardBody>
              </Card>
            </Col>

          </Row>

          <Row>
            <Col xs={12} lg={9}>
              <Card className="shadow-sm border-0 rounded-3 mb-3">
                <CardHeader className="bg-transparent border-bottom">
                  <h6 className="mb-0 fw-semibold">{t("Item Entry")}</h6>
                </CardHeader>
                <CardBody>
                  {!readOnly && (
                    <Row className="g-2 align-items-end">
                      <Col xs={12} sm={6} md={2}>
                        <Label className="form-label mb-1">
                          {t("Lot Number")}
                          <Link to="/masters/add-solitaire-item-master" className="ms-2 small text-primary" target="_blank">
                            {t("Add Item")}
                          </Link>
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
                            else if (meta.action === "input-blur" || meta.action === "menu-close") {
                              setLotInput("");
                              setLotOpts([]);
                            }
                          }}
                          isLoading={lotLoading}
                          placeholder={t("Lot...")}
                          isClearable
                        />
                      </Col>
                      <Col xs={12} sm={6} md={2}>
                        <Label className="form-label mb-1">{t("Item Name")}</Label>
                        <Input
                          className="form-control-sm"
                          style={fieldH}
                          value={entry.itemName}
                          onChange={(e) => onEntryChange("itemName", e.target.value)}
                        />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("Weight")}</Label>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={fieldH}
                          value={entry.weight}
                          onChange={(e) => onEntryChange("weight", e.target.value)}
                        />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("Pcs")}</Label>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={fieldH}
                          value={entry.pcs}
                          onChange={(e) => onEntryChange("pcs", e.target.value)}
                        />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("MRP")}</Label>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={fieldH}
                          value={entry.mrp}
                          onChange={(e) => onEntryChange("mrp", e.target.value)}
                        />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("Back")}</Label>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={fieldH}
                          value={entry.back}
                          onChange={(e) => onEntryChange("back", e.target.value)}
                        />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("Rate")}</Label>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={fieldH}
                          value={entry.rate}
                          onChange={(e) => onEntryChange("rate", e.target.value)}
                        />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("Less1")}</Label>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={fieldH}
                          value={entry.less1}
                          onChange={(e) => onEntryChange("less1", e.target.value)}
                        />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("Less2")}</Label>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={fieldH}
                          value={entry.less2}
                          onChange={(e) => onEntryChange("less2", e.target.value)}
                        />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("Less3")}</Label>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={fieldH}
                          value={entry.less3}
                          onChange={(e) => onEntryChange("less3", e.target.value)}
                        />
                      </Col>
                      <Col xs={6} sm={4} md={2}>
                        <Label className="form-label mb-1">{t("Amount")}</Label>
                        <Input className="form-control-sm" style={fieldH} value={entry.amount} readOnly />
                      </Col>
                      <Col xs={12} sm={4} md={2}>
                        <Button color="primary" size="sm" className="w-100" style={fieldH} onClick={handleAddItem}>
                          {editIndex >= 0 ? t("Update Item") : t("Add Item")}
                        </Button>
                      </Col>
                    </Row>
                  )}

                  {items.length > 0 && (
                    <div className="table-responsive table-card mt-3 mb-0" style={{ overflowX: "auto" }}>
                      <Table className="table table-bordered table-hover table-sm align-middle mb-0" style={{ minWidth: 4800 }}>
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
                          {(
                            items.map((r, idx) => (
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
                            ))
                          )}
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
                <CardHeader className="bg-transparent border-bottom">
                  <h6 className="mb-0 fw-semibold">{t("Summary")}</h6>
                </CardHeader>
                <CardBody className="pt-2 pb-3 pe-3">
                  <fieldset disabled={readOnly} className="border-0 m-0 p-0" style={{ minWidth: 0 }}>
                    <FormGroup className="mb-2">
                      <Label className="form-label mb-1">{t("+/- Amount")}</Label>
                      <Input
                        type="number"
                        className="form-control-sm"
                        style={fieldH}
                        value={header.plusMinusAmount}
                        onChange={(e) => setHeaderField("plusMinusAmount", e.target.value)}
                      />
                    </FormGroup>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">{t("Net Amount")}</span>
                      <strong>{summary.netAmount}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">{t("M. Currency Net Amount")}</span>
                      <strong>{summary.netMAmount}</strong>
                    </div>
                    <Row className="g-1 mb-2">
                      <Col xs={6}>
                        <Label className="form-label mb-1 small">CGST%</Label>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={fieldH}
                          value={header.cgstPer}
                          onChange={(e) => setHeaderField("cgstPer", e.target.value)}
                        />
                      </Col>
                      <Col xs={6}>
                        <Label className="form-label mb-1 small">{t("Amt")}</Label>
                        <Input className="form-control-sm custom-readonly-input" style={fieldH} value={fmt(summary.cgstAmt)} readOnly />
                      </Col>
                      <Col xs={6}>
                        <Label className="form-label mb-1 small">SGST%</Label>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={fieldH}
                          value={header.sgstPer}
                          onChange={(e) => setHeaderField("sgstPer", e.target.value)}
                        />
                      </Col>
                      <Col xs={6}>
                        <Label className="form-label mb-1 small">{t("Amt")}</Label>
                        <Input className="form-control-sm custom-readonly-input" style={fieldH} value={fmt(summary.sgstAmt)} readOnly />
                      </Col>
                      <Col xs={6}>
                        <Label className="form-label mb-1 small">IGST%</Label>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={fieldH}
                          value={header.igstPer}
                          onChange={(e) => setHeaderField("igstPer", e.target.value)}
                        />
                      </Col>
                      <Col xs={6}>
                        <Label className="form-label mb-1 small">{t("Amt")}</Label>
                        <Input className="form-control-sm custom-readonly-input" style={fieldH} value={fmt(summary.igstAmt)} readOnly />
                      </Col>
                    </Row>
                    <hr className="mb-2" />
                    <div className="d-flex justify-content-between mb-1 gap-2">
                      <span className="text-primary fw-semibold small">{masterSymbol} FINAL AMOUNT</span>
                      <strong className="text-end">{summary.finalMAmount}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1 gap-2">
                      <span className="text-primary fw-semibold small">{stockSymbol} FINAL AMOUNT</span>
                      <strong className="text-end">{summary.finalSAmount}</strong>
                    </div>
                    <div className="d-flex justify-content-between gap-2">
                      <span className="text-primary fw-semibold small">{t("TRANSACTION FINAL AMOUNT")}</span>
                      <strong className="text-end">{summary.finalMPayRecAmount}</strong>
                    </div>
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
              <Label className="form-label d-block">{t("Download Purchase File Format")}</Label>
              <Button color="primary" size="sm" onClick={downloadTemplate}>
                <i className="ri-download-2-line me-1" />
                {t("Download")}
              </Button>
              <div className="text-muted small mt-2">{t("Supports CSV and Excel (.xlsx / .xls).")}</div>
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
          <ModalHeader toggle={() => setConsignOpen(false)}>{t("Consignment")}</ModalHeader>
          <ModalBody>
            <div className="table-responsive" style={{ maxHeight: "calc(100vh - 260px)", overflow: "auto" }}>
              <Table className="table table-bordered table-sm align-middle mb-0 text-nowrap" style={{ fontSize: "11px" }}>
                <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                  <tr>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>
                      <Input
                        type="checkbox"
                        checked={consignRows.length > 0 && consignRows.every((r) => r.selected)}
                        onChange={(e) => toggleSelectAllConsign(e.target.checked)}
                      />
                    </th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("date", t("Date"))}</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("memoNo", t("Consignment No"))}</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("lotNo", t("LotNo"))}</th>
                    <th className="text-end" style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("cts", t("Cts"))}</th>
                    <th className="text-end" style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("purchase", t("Purchase"))}</th>
                    <th className="text-end" style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("rtn", t("Return"))}</th>
                    <th className="text-end" style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("balCts", t("BalCts"))}</th>
                    <th className="text-end" style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("mrp", t("MRP"))}</th>
                    <th className="text-end" style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("back", t("Back"))}</th>
                    <th className="text-end" style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("rate", t("Rate"))}</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("symbol", t("Cur"))}</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("memoTransCode", t("MemoTrnCode"))}</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("itemName", t("ItemName"))}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedConsignRows.map((r) => (
                    <tr key={r.key}>
                      <td>
                        <Input
                          type="checkbox"
                          checked={!!r.selected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setConsignRows((prev) =>
                              prev.map((x) => (x.key === r.key ? { ...x, selected: checked } : x))
                            );
                          }}
                        />
                      </td>
                      <td>{r.date}</td>
                      <td>{r.memoNo}</td>
                      <td>{r.lotNo}</td>
                      <td className="text-end">{fmt(r.cts, 3)}</td>
                      <td>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={{ height: 28, width: "65px", padding: "1px 5px", fontSize: "11px" }}
                          value={r.purchase}
                          onChange={(e) => {
                            const purchase = toNum(e.target.value);
                            if (purchase > toNum(r.cts)) {
                              toast.warning(t("PurCts should not be greater than TotalCts"));
                              setConsignRows((prev) =>
                                prev.map((x) =>
                                  x.key === r.key
                                    ? {
                                        ...x,
                                        purchase: 0,
                                        balCts: toNum(x.cts)
                                      }
                                    : x
                                )
                              );
                              return;
                            }
                            setConsignRows((prev) =>
                              prev.map((x) =>
                                x.key === r.key
                                  ? {
                                      ...x,
                                      purchase,
                                      balCts: toNum(x.cts) - purchase
                                    }
                                  : x
                              )
                            );
                          }}
                        />
                      </td>
                      <td className="text-end">{fmt(r.rtn, 3)}</td>
                      <td className="text-end">{fmt(r.balCts, 3)}</td>
                      <td>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={{ height: 28, width: "70px", padding: "1px 5px", fontSize: "11px" }}
                          value={r.mrp}
                          onChange={(e) =>
                            setConsignRows((prev) =>
                              prev.map((x) => (x.key === r.key ? { ...x, mrp: e.target.value } : x))
                            )
                          }
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={{ height: 28, width: "55px", padding: "1px 5px", fontSize: "11px" }}
                          value={r.back}
                          onChange={(e) => {
                            const back = toNum(e.target.value);
                            setConsignRows((prev) =>
                              prev.map((x) =>
                                x.key === r.key
                                  ? {
                                      ...x,
                                      back,
                                      rate: fmt(((100 + back) * toNum(x.mrp)) / 100)
                                    }
                                  : x
                              )
                            );
                          }}
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          className="form-control-sm"
                          style={{ height: 28, width: "70px", padding: "1px 5px", fontSize: "11px" }}
                          value={r.rate}
                          onChange={(e) => {
                            const rate = toNum(e.target.value);
                            setConsignRows((prev) =>
                              prev.map((x) =>
                                x.key === r.key
                                  ? {
                                      ...x,
                                      rate,
                                      back: toNum(x.mrp) !== 0 ? parseFloat((((rate * 100) / toNum(x.mrp)) - 100).toFixed(2)) : 0
                                    }
                                  : x
                              )
                            );
                          }}
                        />
                      </td>
                      <td>{r.symbol}</td>
                      <td>{r.memoTransCode}</td>
                      <td>{r.itemName}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="light" onClick={() => setConsignOpen(false)}>
              {t("Close")}
            </Button>
            <Button color="primary" onClick={consignToPurchase}>
              {t("Consignment To Purchase")}
            </Button>
          </ModalFooter>
        </Modal>

        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default SolitairePurchaseForm;
