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
  Row,
  Table
} from "reactstrap";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import CreatableSelect from "react-select/creatable";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import {
  addMixPurchaseReturn,
  editMixPurchaseReturn,
  getAccGrpMasters,
  getCurrencyRates,
  getMixMemoOutShipVia,
  getMixPurchaseReturnDetail,
  getMixPurchaseReturnItemFromList,
  getMixPurchaseReturnLotDetail,
  getMixPurchaseReturnLots,
  getMixPurchaseReturnPageData
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
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.Data)) return res.Data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.Data)) return res.data.Data;
  if (Array.isArray(res?.data?.$values)) return res.data.$values;
  if (Array.isArray(res?.Data?.$values)) return res.Data.$values;
  return [];
};

const mapMixLotOptions = (res) =>
  extractLotList(res)
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") {
        const str = String(item);
        return { value: str, label: str };
      }
      const value = String(
        item.id ??
        item.ID ??
        item.name ??
        item.Name ??
        item.LotNo ??
        item.lotNo ??
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

const addDaysToIsoDate = (dateStr, days) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  d.setDate(d.getDate() + toNum(days, 0));
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const mapBasic = (list = []) =>
  (list || []).map((x) => ({
    value: String(getVal(x, "ID", "Id", "id") || getVal(x, "Name")),
    label: getVal(x, "Name", "TextName", "textName") || String(getVal(x, "ID")),
    id: String(getVal(x, "ID", "Id", "id") || "")
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

const optLabel = (options, raw) => {
  if (raw == null || raw === "") return "";
  const needle = String(raw).trim().toLowerCase();
  const matched = (options || []).find((o) => {
    const v = String(o?.value ?? "").trim().toLowerCase();
    const l = String(o?.label ?? "").trim().toLowerCase();
    const id = String(o?.id ?? "").trim().toLowerCase();
    return v === needle || l === needle || (id && id === needle);
  });
  return matched?.label || String(raw);
};

const calcItemAmount = (selectionCarats, rate, less1, less2, less3, pcs = 1, stockType = "Diamond") => {
  let amount =
    String(stockType).toLowerCase() === "jewellery"
      ? toNum(pcs) * toNum(rate)
      : toNum(selectionCarats) * toNum(rate);
  if (toNum(less1) !== 0) amount = (amount * (100 + toNum(less1))) / 100;
  if (toNum(less2) !== 0) amount = (amount * (100 + toNum(less2))) / 100;
  if (toNum(less3) !== 0) amount = (amount * (100 + toNum(less3))) / 100;
  return Math.round(amount * 100) / 100;
};

const emptyItem = () => ({
  lotNo: "",
  itemName: "",
  shape: "",
  color: "",
  clarity: "",
  size: "",
  sieve: "",
  issueCarats: "",
  rejP: "",
  rejection: "",
  selectionCarats: "",
  pcs: "",
  rate: "",
  sRate: "",
  cogs: "",
  less1: "",
  less2: "",
  less3: "",
  amount: "",
  exportNo: "",
  memoTransCode: "",
  stockType: "",
  invDescription: ""
});

const mapItemFromApi = (r, idx, sBaseRate = 1) => {
  const issueCarats = getNumVal(r, "IssueCarats", "IssueCarat", "IssCts", "IssueCts");
  let rejection = getNumVal(r, "ReturnCarats", "Rejection", "RejectionCarats", "RtnCarats", "ReturnCts");
  let selectionCarats = getNumVal(r, "Weight", "Carats", "SelectionCarats", "SelectedCarats", "SelectCts");
  let rejP = getNumVal(r, "Back", "RejP", "RejPer", "RejPPer", "RejectionPer", "RejPercentage");

  if (issueCarats !== 0) {
    if (rejection === 0 && selectionCarats !== 0 && issueCarats > selectionCarats) {
      rejection = Math.round((issueCarats - selectionCarats) * 1000) / 1000;
    }
    if (selectionCarats === 0 && issueCarats !== 0) {
      selectionCarats = Math.round((issueCarats - rejection) * 1000) / 1000;
    }
    if (rejP === 0 && rejection !== 0) {
      rejP = Math.round(((rejection * 100) / issueCarats) * 100) / 100;
    }
  }

  let rate = getNumVal(r, "Rate", "PurRate", "PurchaseRate", "RatePerCarat");
  let sRate = getNumVal(r, "SRate", "StockRate", "DollarRate", "USDRate");
  const sBase = toNum(sBaseRate, 1) || 1;

  if (rate === 0 && sRate > 0) {
    rate = Math.round(sRate * sBase * 100) / 100;
  } else if (sRate === 0 && rate > 0) {
    sRate = Math.round((rate / sBase) * 100) / 100;
  }

  const pcs = getNumVal(r, "Pcs") || 0;
  const less1 = getNumVal(r, "Less1", "Less1Per");
  const less2 = getNumVal(r, "Less2", "Less2Per");
  const less3 = getNumVal(r, "Less3", "Less3Per");
  const stockType = getStrVal(r, "StockType") || "Diamond";

  let amount = getNumVal(r, "Amount", "PurAmount", "PurchaseAmount", "TotalAmount");
  if (amount === 0 && (selectionCarats !== 0 || pcs !== 0) && rate !== 0) {
    amount = calcItemAmount(selectionCarats, rate, less1, less2, less3, pcs, stockType);
  }

  return {
    srNo: idx + 1,
    lotNo: getStrVal(r, "LotNo", "lotNo"),
    itemName: getStrVal(r, "ItemName", "itemName"),
    shape: getStrVal(r, "PShape", "ShapeId", "Shape", "shape"),
    color: getStrVal(r, "PColor", "ColorId", "Color", "color"),
    clarity: getStrVal(r, "PClarity", "ClarityId", "Clarity", "clarity"),
    size: getStrVal(r, "PSize", "SizeId", "Size", "size"),
    sieve: getStrVal(r, "PSieve", "SieveId", "Sieve", "sieve"),
    issueCarats,
    rejP,
    rejection,
    selectionCarats,
    pcs,
    cogs: getNumVal(r, "COGS", "cogs"),
    rate,
    sRate,
    less1,
    less2,
    less3,
    amount,
    exportNo: getStrVal(r, "ExportNo", "exportNo"),
    memoTransCode: getStrVal(r, "MemoTransCode", "memoTransCode"),
    stockType,
    invDescription: getStrVal(r, "InvDescription", "invDescription")
  };
};

// MVC Column Order: LotNo | ItemName | Shape | Color | Clarity | Size | Sieve | Pcs | IssueCarats | RejP% | Rejection | SelectedCarats | COGS | Rate | $Rate | Less1 | Less2 | Less3 | Amount | ExportNo | StockType
const ITEM_COLUMNS = [
  { key: "lotNo", label: "LotNo" },
  { key: "itemName", label: "ItemName" },
  { key: "shape", label: "Shape", lookup: "shape" },
  { key: "color", label: "Color", lookup: "color" },
  { key: "clarity", label: "Clarity", lookup: "clarity" },
  { key: "size", label: "Size", lookup: "size" },
  { key: "sieve", label: "Sieve", lookup: "sieve" },
  { key: "pcs", label: "Pcs", align: "end", footer: "pcs" },
  { key: "issueCarats", label: "IssueCarats", align: "end", decimals: 3, footer: "issueCarats" },
  { key: "rejP", label: "RejP%", align: "end", decimals: 2 },
  { key: "rejection", label: "Rejection", align: "end", decimals: 3, footer: "rejection" },
  { key: "selectionCarats", label: "SelectedCarats", align: "end", decimals: 3, footer: "selectionCarats" },
  { key: "cogs", label: "COGS", align: "end", decimals: 2 },
  { key: "rate", label: "Rate", align: "end", decimals: 2, footer: "avgRate" },
  { key: "sRate", label: "$Rate", align: "end", decimals: 2 },
  { key: "less1", label: "Less1", align: "end", decimals: 2 },
  { key: "less2", label: "Less2", align: "end", decimals: 2 },
  { key: "less3", label: "Less3", align: "end", decimals: 2 },
  { key: "amount", label: "Amount", align: "end", decimals: 2, footer: "totAmount" },
  { key: "exportNo", label: "ExportNo" },
  { key: "stockType", label: "StockType" },
  { key: "invDescription", label: "ItemDescription" }
];

const getItemFooterValue = (footerKey, totals, itemRows) => {
  switch (footerKey) {
    case "pcs":
      return itemRows.reduce((s, r) => s + toNum(r.pcs), 0);
    case "issueCarats":
      return fmt(totals.totIssueCts, 3);
    case "rejection":
      return fmt(totals.totRejection, 3);
    case "selectionCarats":
      return fmt(totals.totCts, 3);
    case "avgRate":
      return fmt(totals.avgRate, 2);
    case "totAmount":
      return fmt(totals.totAmount);
    default:
      return "";
  }
};

const renderItemCell = (row, col, lookupOpts = {}) => {
  if (col.lookup) {
    const opts = lookupOpts[col.lookup] || [];
    return optLabel(opts, row[col.key]);
  }
  const v = row[col.key];
  if (col.decimals != null) {
    if (v === "" || v == null) return v === 0 || v === "0" ? fmt(0, col.decimals) : "";
    return fmt(v, col.decimals);
  }
  if (typeof v === "number") return v === 0 ? "0" : String(v);
  return v ?? "";
};

const mapItemToPayload = (r, i) => ({
  SrNo: i + 1,
  LotNo: r.lotNo,
  ItemName: r.itemName,
  Shape: r.shape,
  ShapeId: r.shape,
  PShape: r.shape,
  Color: r.color,
  ColorId: r.color,
  PColor: r.color,
  Size: r.size,
  PSize: r.size,
  Clarity: r.clarity,
  ClarityId: r.clarity,
  PClarity: r.clarity,
  Sieve: r.sieve,
  SieveId: r.sieve,
  PSieve: r.sieve,
  Weight: toNum(r.selectionCarats),
  IssueCarats: toNum(r.issueCarats),
  ReturnCarats: toNum(r.rejection),
  Back: toNum(r.rejP),
  Pcs: toNum(r.pcs),
  Rate: toNum(r.rate),
  SRate: toNum(r.sRate),
  COGS: toNum(r.cogs),
  Less1: toNum(r.less1),
  Less2: toNum(r.less2),
  Less3: toNum(r.less3),
  Amount: toNum(r.amount),
  ExportNo: r.exportNo || "",
  MemoTransCode: toNum(r.memoTransCode),
  StockType: r.stockType || "Diamond",
  InvDescription: r.invDescription || ""
});

const MixPurchaseReturnForm = ({ mode = "add" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = mode === "edit";
  const editId = searchParams.get("Id") || searchParams.get("id") || "";
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

  // MVC mix-pur-return.js #ShipVia select2 → /saleParcel/get-shipvia (GetShipViaForDropdown)
  const [shipViaInput, setShipViaInput] = useState("");
  const [shipViaOpts, setShipViaOpts] = useState([]);
  const [shipViaLoading, setShipViaLoading] = useState(false);
  const [shipVia, setShipVia] = useState(null);

  const [lotSel, setLotSel] = useState(null);

  const [mOp, setMOp] = useState("*");
  const [sOp, setSOp] = useState("*");
  const [editIndex, setEditIndex] = useState(-1);
  const [items, setItems] = useState([]);
  const [entry, setEntry] = useState(emptyItem());
  const [clearData, setClearData] = useState(false);
  const [bulkLotNos, setBulkLotNos] = useState("");

  const [masterSymbol, setMasterSymbol] = useState("INR");
  const [stockSymbol, setStockSymbol] = useState("USD");

  const [header, setHeader] = useState({
    code: 0,
    trnDate: todayIso(),
    roundDate: todayIso(),
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
    brokerPer: 0,
    description: "",
    chkoldsale: false,
    shipVia: "",
    tracking: "",
    salesPerson: "",
    memoNo: "",
    address: "",
    plusMinusAmount: 0,
    roundAmount: 0,
    vatPer: 0,
    cgstPer: 0,
    sgstPer: 0,
    igstPer: 0
  });

  const fieldH = { height: 31 };

  const lookupOpts = useMemo(
    () => ({
      shape: shapeOpts,
      color: colorOpts,
      clarity: clarityOpts,
      size: sizeOpts,
      sieve: sieveOpts
    }),
    [shapeOpts, colorOpts, clarityOpts, sizeOpts, sieveOpts]
  );

  const customStyles = useMemo(
    () => ({
      control: (p, s) => ({
        ...p,
        backgroundColor: s.isDisabled
          ? "var(--vz-input-disabled-bg, var(--vz-secondary-bg, #212529))"
          : "var(--vz-input-bg, var(--vz-secondary-bg, #212529))",
        borderColor: "var(--vz-input-border, var(--vz-border-color, #32383e))",
        color: s.isDisabled
          ? "var(--vz-secondary-color, #878a99)"
          : "var(--vz-body-color, #ced4da)",
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
        color: "var(--vz-body-color, #ced4da)"
      }),
      menu: (p) => ({
        ...p,
        backgroundColor: "var(--vz-input-bg, var(--vz-secondary-bg, #212529))",
        color: "var(--vz-body-color, #ced4da)",
        border: "1px solid var(--vz-border-color, #32383e)",
        zIndex: 9999
      }),
      menuPortal: (p) => ({ ...p, zIndex: 9999 }),
      option: (p, s) => ({
        ...p,
        backgroundColor: s.isFocused ? "#3b5de7" : "transparent",
        color: s.isFocused ? "#fff" : "var(--vz-body-color, #ced4da)",
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
          : "var(--vz-body-color, #ced4da)"
      })
    }),
    []
  );

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

  const partyOptionsWithSelected = useMemo(() => {
    if (!party || !party.value) return partyOpts;
    return partyOpts.some((o) => String(o.value) === String(party.value))
      ? partyOpts
      : [party, ...partyOpts];
  }, [partyOpts, party]);

  const commOptionsWithSelected = useMemo(() => {
    if (!commission || !commission.value) return commOpts;
    return commOpts.some((o) => String(o.value) === String(commission.value))
      ? commOpts
      : [commission, ...commOpts];
  }, [commOpts, commission]);

  const brokerOptionsWithSelected = useMemo(() => {
    if (!broker || !broker.value) return brokerOpts;
    return brokerOpts.some((o) => String(o.value) === String(broker.value))
      ? brokerOpts
      : [broker, ...brokerOpts];
  }, [brokerOpts, broker]);

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
          (Array.isArray(raw) ? raw : []).map((item) => ({
            value: String(item.text || item.id || item.Text || item.Id || ""),
            label: String(item.text || item.id || item.Text || item.Id || "")
          })).filter((o) => o.value)
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
    if (term.length < 1) {
      callback([]);
      return;
    }
    getMixPurchaseReturnLots(term)
      .then((res) => callback(mapMixLotOptions(res)))
      .catch(() => callback([]));
  }, []);

  const applyCurrencyRates = async (curCode) => {
    if (!curCode) return;
    try {
      const res = await getCurrencyRates(curCode);
      if (res?.success || res?.Success) {
        setMOp(getVal(res, "MasterCurrencyOperator", "masterCurrencyOperator") || "*");
        setSOp(getVal(res, "StockCurrencyOperator", "stockCurrencyOperator") || "*");
        setHeader((prev) => ({
          ...prev,
          baseRate: toNum(res.baseRate ?? res.BaseRate, 1),
          sBaseRate: toNum(res.sBaseRate ?? res.SBaseRate, 1)
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPageData = async () => {
    const res = await getMixPurchaseReturnPageData();
    if (!(res?.success || res?.Success)) {
      toast.error(res?.Data || res?.data || t("Failed to load page data."));
      return null;
    }
    const d = res.Data || res.data || {};
    const types = mapBasicWithNameAsValue(d.Type || d.type);
    const subs = mapBasicWithNameAsValue(d.SubType || d.subType);
    const cats = mapBasicWithNameAsValue(d.Category || d.category);
    const curs = mapBasic(d.CurrencyList || d.currencyList);
    const shapes = mapBasic(d.Shape || d.shape);
    const colors = mapBasic(d.Color || d.color);
    const clarities = mapBasic(d.Clarity || d.clarity);
    const sizes = mapBasic(d.Size || d.size);
    const sieves = mapBasic(d.Sieve || d.sieve);
    const addresses = mapBasic(d.Address || d.address);
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
    return {
      types,
      subs,
      cats,
      curs,
      shapes,
      colors,
      clarities,
      sizes,
      sieves,
      addresses,
      defaultCurrencyCode: d.DefaultCurrencyCode || d.defaultCurrencyCode
    };
  };

  const loadDetail = async (pageData = null) => {
    if (!editId) return;
    const res = await getMixPurchaseReturnDetail(editId);
    if (!(res?.success || res?.Success)) {
      toast.error(res?.Data || res?.data || t("Mix Purchase Return not found."));
      return;
    }
    const data = res.Data || res.data || {};
    const h = data.Header || data.header || {};
    const rows = data.Items || data.items || [];

    setParty(
      getVal(h, "PartyCode", "Party", "PartyId")
        ? {
          value: String(getVal(h, "PartyCode", "Party", "PartyId")),
          label: getVal(h, "PartyName", "Party", "PartyText") || String(getVal(h, "PartyCode", "Party", "PartyId"))
        }
        : null
    );
    setCommission(
      getVal(h, "AdatCode", "Adat", "CommissionCode")
        ? {
          value: String(getVal(h, "AdatCode", "Adat", "CommissionCode")),
          label: getVal(h, "AdatName", "Adat", "CommissionName") || String(getVal(h, "AdatCode", "Adat", "CommissionCode"))
        }
        : null
    );
    setBroker(
      getVal(h, "BrokerCode", "Broker", "BrokerId")
        ? {
          value: String(getVal(h, "BrokerCode", "Broker", "BrokerId")),
          label: getVal(h, "BrokerName", "Broker", "BrokerText") || String(getVal(h, "BrokerCode", "Broker", "BrokerId"))
        }
        : null
    );
    const shipViaText = getVal(h, "ShipVia", "Shipvia");
    setShipVia(shipViaText ? { value: shipViaText, label: shipViaText } : null);

    setHeader({
      code: toNum(getVal(h, "Code"), 0),
      trnDate: toLocalDateStr(getVal(h, "TrnDate", "Date")) || todayIso(),
      roundDate: toLocalDateStr(getVal(h, "RoundDate")) || todayIso(),
      invNo: getVal(h, "InvNo"),
      billNo: getVal(h, "BillNo"),
      invType: resolveSelectValue(pageData?.types || typeOpts, getVal(h, "InvType", "Type", "TypeId", "TypeName")),
      subType: resolveSelectValue(pageData?.subs || subTypeOpts, getVal(h, "SubType", "Subtype", "SubTypeId", "SubTypeName")),
      category: resolveSelectValue(pageData?.cats || categoryOpts, getVal(h, "Category", "CategoryId", "CategoryName")),
      dueDays: toNum(getVal(h, "DueDays"), 0),
      dueDate: toLocalDateStr(getVal(h, "DueDate")) || todayIso(),
      curCode: String(getVal(h, "CurCode", "Currency") || ""),
      baseRate: toNum(getVal(h, "BaseRate"), 1),
      sBaseRate: toNum(getVal(h, "SBaseRate"), 1),
      adatPer: getNumVal(h, "AdatPer", "ComPer", "AdatPercentage", "ComPercentage"),
      adatAmount: getNumVal(h, "AdatAmount", "ComAmount", "AdatAmt", "ComAmt"),
      brokerPer: getNumVal(h, "BrokerPer", "BroPer", "BrokerPercentage", "BroPercentage"),
      brokerAmount: getNumVal(h, "BrokerAmount", "BroAmount", "BrokerAmt", "BroAmt"),
      description: getVal(h, "Description", "InvDisc"),
      chkoldsale: !!(
        getVal(h, "chkoldsale", "Chkoldsale", "Outstanding", "oldsale") === true ||
        getVal(h, "chkoldsale", "Chkoldsale", "Outstanding", "oldsale") === "true" ||
        getVal(h, "chkoldsale", "Chkoldsale", "Outstanding", "oldsale") === 1
      ),
      shipVia: getVal(h, "ShipVia", "Shipvia"),
      tracking: getVal(h, "Tracking", "TrackingNo"),
      salesPerson: getVal(h, "SalesPerson", "Salesperson"),
      memoNo: getVal(h, "MemoNo", "Memono"),
      address: String(getVal(h, "Address", "AddressId", "BankId") || ""),
      plusMinusAmount: getNumVal(h, "PlusMinusAmount"),
      roundAmount: getNumVal(h, "RoundAmount"),
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

    const sBase = toNum(getVal(h, "SBaseRate"), 1);
    setItems(rows.map((r, idx) => mapItemFromApi(r, idx, sBase)));
    const loadedCur = String(getVal(h, "CurCode") || "");
    if (loadedCur) await applyCurrencyRates(loadedCur);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
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
            address: defaultAddress
          }));
          await applyCurrencyRates(selectedCur.value);
        }
      } catch (err) {
        console.error(err);
        toast.error(typeof err === "string" ? err : t("Failed to load page data."));
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, editId]);

  useEffect(() => {
    if (!header.trnDate) return;
    const computedDue = addDaysToIsoDate(header.trnDate, header.dueDays);
    if (computedDue) {
      setHeader((prev) => (prev.dueDate === computedDue ? prev : { ...prev, dueDate: computedDue }));
    }
  }, [header.trnDate, header.dueDays]);

  const setHeaderField = (key, value) => setHeader((prev) => ({ ...prev, [key]: value }));

  const validateTrnDate = (dateVal) => {
    if (isEdit) return dateVal;
    const today = todayIso();
    if (dateVal > today) {
      toast.error(t("Invoice date cannot be greater than today."));
      return today;
    }
    return dateVal;
  };

  const onTrnDateChange = (value) => {
    setHeaderField("trnDate", validateTrnDate(value));
  };

  const recalcEntryAmount = (next, sBaseRate = header.sBaseRate) => {
    const amount = calcItemAmount(
      next.selectionCarats,
      next.rate,
      next.less1,
      next.less2,
      next.less3,
      next.pcs,
      next.stockType
    );
    const rate = toNum(next.rate);
    const sRate = rate && toNum(sBaseRate, 1) ? fmt(rate / toNum(sBaseRate, 1), 2) : next.sRate;
    return { ...next, amount: fmt(amount), sRate };
  };

  const syncRejectionFields = (next, changedKey) => {
    // MVC mix-pur-return.js:
    // RejP  -> Rejection = IssueCarats * RejP / 100 ; Selection = Issue - Rejection
    // Rejection -> RejP = Rejection * 100 / Issue ; Selection = Issue - Rejection
    // Selection -> RejP = 100 - (100 * Selection / Issue) ; Rejection = Issue * RejP / 100
    // IssueCarats -> Selection = Issue - Rejection
    const issueCarats = toNum(next.issueCarats);
    const rejPRaw = toNum(next.rejP);
    const rejectionRaw = toNum(next.rejection);
    const selectionRaw = toNum(next.selectionCarats);

    let rejP = rejPRaw;
    let rejection = rejectionRaw;
    let selectionCarats = selectionRaw;

    if (changedKey === "issueCarats") {
      selectionCarats = issueCarats - rejectionRaw;
    } else if (changedKey === "rejP") {
      rejection = (issueCarats * rejPRaw) / 100;
      selectionCarats = issueCarats - rejection;
    } else if (changedKey === "rejection") {
      rejP = issueCarats !== 0 ? (rejectionRaw * 100) / issueCarats : 0;
      selectionCarats = issueCarats - rejectionRaw;
    } else if (changedKey === "selectionCarats") {
      rejP = issueCarats !== 0 ? 100 - (100 * selectionRaw) / issueCarats : 0;
      rejection = (issueCarats * rejP) / 100;
    }

    const roundN = (n, d) => {
      if (!Number.isFinite(n)) return "0";
      const f = 10 ** d;
      return String(Math.round(n * f) / f);
    };

    return {
      ...next,
      // Keep the field the user is typing as-entered; format only calculated fields.
      rejP: changedKey === "rejP" ? next.rejP : roundN(rejP, 2),
      rejection: changedKey === "rejection" ? next.rejection : roundN(rejection, 3),
      selectionCarats:
        changedKey === "selectionCarats" ? next.selectionCarats : roundN(selectionCarats, 3)
    };
  };

  const onEntryChange = (key, value) => {
    setEntry((prev) => {
      let next = { ...prev, [key]: value };

      if (["issueCarats", "rejP", "rejection", "selectionCarats"].includes(key)) {
        next = syncRejectionFields(next, key);
      }

      if (key === "rate" || key === "pcs" || key === "less1" || key === "less2" || key === "less3") {
        next = recalcEntryAmount(next);
      }

      if (["issueCarats", "rejP", "rejection", "selectionCarats"].includes(key)) {
        next = recalcEntryAmount(next);
      }

      return next;
    });
  };

  const fillFromLot = async (lotNo) => {
    if (!lotNo) return;
    try {
      const res = await getMixPurchaseReturnLotDetail(lotNo);
      if (!(res?.success || res?.Success || res?.data || res?.Data || Array.isArray(res))) {
        toast.warning(res?.Data || res?.data || t("Lot detail not found."));
        return;
      }
      const rawData = res.Data || res.data || res;
      const lot = (Array.isArray(rawData) ? rawData[0] : rawData) || null;
      if (!lot) {
        toast.warning(t("Lot detail not found."));
        return;
      }

      const weight = getNumVal(lot, "Weight", "Carats", "IssueCarats");
      const pcs = getNumVal(lot, "Pcs");
      const rate = getNumVal(lot, "Rate", "PurRate", "PurchaseRate");
      const sBase = toNum(header.sBaseRate, 1) || 1;
      const sRate = rate ? fmt(rate / sBase, 2) : "";

      const itemName = getStrVal(lot, "ItemName", "itemName", "Name", "name");
      const shape = getStrVal(lot, "ShapeId", "Shape", "PShape", "shape");
      const color = getStrVal(lot, "ColorId", "Color", "PColor", "color");
      const clarity = getStrVal(lot, "ClarityId", "Clarity", "PClarity", "clarity");
      const size = getStrVal(lot, "SizeId", "Size", "PSize", "size");
      const sieve = getStrVal(lot, "SieveId", "Sieve", "PSieve", "sieve");
      const cogs = getNumVal(lot, "COGS", "cogs");
      const stockType = getStrVal(lot, "StockType", "stockType") || "Diamond";

      setEntry((prev) =>
        recalcEntryAmount(
          {
            ...prev,
            lotNo: getStrVal(lot, "LotNo", "lotNo") || lotNo,
            itemName: itemName || prev.itemName,
            shape: shape || prev.shape,
            color: color || prev.color,
            clarity: clarity || prev.clarity,
            size: size || prev.size,
            sieve: sieve || prev.sieve,
            issueCarats: weight,
            rejP: "0",
            rejection: "0",
            selectionCarats: weight,
            pcs: pcs || 0,
            rate,
            sRate,
            cogs,
            stockType,
            invDescription: getStrVal(lot, "InvDescription"),
            less1: prev.less1 === "" || prev.less1 == null ? "0" : prev.less1,
            less2: prev.less2 === "" || prev.less2 == null ? "0" : prev.less2,
            less3: prev.less3 === "" || prev.less3 == null ? "0" : prev.less3
          },
          header.sBaseRate
        )
      );
    } catch (err) {
      console.error("fillFromLot error:", err);
      toast.error(t("Failed to load lot detail."));
    }
  };

  const handleAddItem = () => {
    const lotNo = (lotSel?.value || entry.lotNo || "").toString().trim();
    const selectionCarats = toNum(entry.selectionCarats);
    const rate = toNum(entry.rate);

    if (!lotNo) return toast.warning(t("Lot Number is required."));
    if (!((selectionCarats !== 0 && rate !== 0) || (selectionCarats === 0 && rate === 0))) {
      return toast.warning(t("Carat or Rate can not be 0"));
    }

    const row = {
      ...entry,
      lotNo,
      itemName: entry.itemName || lotSel?.label || "",
      shape: entry.shape || "",
      color: entry.color || "",
      clarity: entry.clarity || "",
      size: entry.size || "",
      sieve: entry.sieve || "",
      issueCarats: Math.round(toNum(entry.issueCarats) * 1000) / 1000,
      rejP: Math.round(toNum(entry.rejP) * 100) / 100,
      rejection: Math.round(toNum(entry.rejection) * 1000) / 1000,
      selectionCarats: Math.round(selectionCarats * 1000) / 1000,
      pcs: toNum(entry.pcs, 0),
      cogs: toNum(entry.cogs),
      rate,
      sRate: toNum(entry.sRate),
      less1: toNum(entry.less1),
      less2: toNum(entry.less2),
      less3: toNum(entry.less3),
      amount: calcItemAmount(selectionCarats, rate, entry.less1, entry.less2, entry.less3, entry.pcs, entry.stockType),
      exportNo: entry.exportNo || "",
      memoTransCode: entry.memoTransCode || "",
      stockType: entry.stockType || "Diamond"
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
    if (clearData) {
      setLotSel(null);
      setEntry(emptyItem());
    }
  };

  const handleEditRow = (idx) => {
    const r = items[idx];
    if (!r) return;
    setEditIndex(idx);
    setLotSel({ value: r.lotNo, label: r.lotNo });
    let updatedEntry = { ...emptyItem(), ...r };
    if (toNum(updatedEntry.rate) === 0 && toNum(updatedEntry.sRate) > 0) {
      const bRate = toNum(header.sBaseRate, 1) || 1;
      updatedEntry.rate = fmt(toNum(updatedEntry.sRate) * bRate, 2);
    }
    if (toNum(updatedEntry.amount) === 0 && (toNum(updatedEntry.selectionCarats) > 0 || toNum(updatedEntry.pcs) > 0) && toNum(updatedEntry.rate) > 0) {
      updatedEntry.amount = fmt(calcItemAmount(updatedEntry.selectionCarats, updatedEntry.rate, updatedEntry.less1, updatedEntry.less2, updatedEntry.less3, updatedEntry.pcs, updatedEntry.stockType));
    }
    if (toNum(updatedEntry.rejP) === 0 && toNum(updatedEntry.issueCarats) > 0 && toNum(updatedEntry.rejection) > 0) {
      updatedEntry.rejP = fmt((toNum(updatedEntry.rejection) * 100) / toNum(updatedEntry.issueCarats), 2);
    }
    setEntry(updatedEntry);
  };

  const handleDeleteRow = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    if (editIndex === idx) {
      setEditIndex(-1);
      setEntry(emptyItem());
      setLotSel(null);
    }
  };

  const handleGetItemFromList = async () => {
    if (!bulkLotNos.trim()) {
      toast.warning(t("Please enter lot number(s)."));
      return;
    }
    try {
      const payload = {
        LotNo: bulkLotNos,
        Less1: toNum(entry.less1),
        Less2: toNum(entry.less2),
        Less3: toNum(entry.less3),
        CurCode: toNum(header.curCode),
        Items: items.map(mapItemToPayload)
      };
      const res = await getMixPurchaseReturnItemFromList(payload);
      if (!(res?.success || res?.Success)) {
        toast.warning(res?.Data || res?.data || t("Failed to load items."));
        return;
      }
      const data = res.Data || res.data || {};
      const rows = data.ExcelData || data.excelData || [];
      setItems(rows.map((r, idx) => mapItemFromApi(r, idx)));
      if (data.Alert || data.alert) toast.warning(data.Alert || data.alert);
      else toast.success(t("Items loaded."));
      setBulkLotNos("");
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load items."));
    }
  };

  const totals = useMemo(() => {
    let totCts = 0;
    let totIssueCts = 0;
    let totRejection = 0;
    let totAmount = 0;
    let totWithoutLess = 0;
    items.forEach((r) => {
      const w = toNum(r.selectionCarats);
      totCts += w;
      totIssueCts += toNum(r.issueCarats);
      totRejection += toNum(r.rejection);
      totAmount += toNum(r.amount);
      totWithoutLess += w * toNum(r.rate);
    });
    return {
      totCts: Math.round(totCts * 1000) / 1000,
      totIssueCts: Math.round(totIssueCts * 1000) / 1000,
      totRejection: Math.round(totRejection * 1000) / 1000,
      totAmount: Math.round(totAmount * 100) / 100,
      avgRate: totCts === 0 ? 0 : totWithoutLess / totCts
    };
  }, [items]);

  const summary = useMemo(() => {
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
      netAmount: fmt(taxableAmount),
      netMAmount: fmt(mCurAmount),
      vatAmt,
      cgstAmt,
      sgstAmt,
      igstAmt,
      finalMAmount: fmt(finalMAmount),
      finalSAmount: fmt(finalSAmount),
      finalMPayRecAmount: fmt(receivableAmount)
    };
  }, [totals.totAmount, header, mOp, sOp]);

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


  const buildPayload = () => ({
    SalePur: {
      Code: toNum(header.code),
      TrnDate: header.trnDate,
      RoundDate: header.roundDate,
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
      chkoldsale: !!header.chkoldsale,
      ShipVia: shipVia?.label || shipVia?.value || header.shipVia || "",
      Tracking: header.tracking,
      SalesPerson: header.salesPerson,
      MemoNo: header.memoNo,
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
    },
    Items: items.map(mapItemToPayload)
  });

  const handleSubmit = async () => {
    if (readOnly) return;
    if (!party?.value) return toast.warning(t("Please select Party."));
    if (!items.length) return toast.warning(t("Please add at least one item."));
    if (!isEdit && header.trnDate > todayIso()) {
      toast.error(t("Invoice date cannot be greater than today."));
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      const res = isEdit ? await editMixPurchaseReturn(payload) : await addMixPurchaseReturn(payload);
      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || t("Saved successfully."));
        navigate("/MixPurchaseReturn/mixpurchasereturnlist", {
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

  const pageTitle = t("Mix Purchase Return");
  const title = isView
    ? t("View Mix Purchase Return")
    : isEdit
      ? t("Edit Mix Purchase Return")
      : t("Add Mix Purchase Return");
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
          <BreadCrumb title={title} pageTitle={pageTitle} />

          <Row className="align-items-start g-3 mb-3">
            {/* Main Form Left Section (Full Width / 9 cols depending on screen) */}
            <Col xs={12} lg={9}>
              <Card className="shadow-sm border-0 rounded-3 mb-3">
                <CardHeader className="bg-transparent border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2 py-2">
                  <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2 fs-15">
                    <i className="ri-checkbox-line fs-18 text-primary" />
                    {title}
                  </h5>
                  <div className="d-flex gap-2 flex-wrap">
                    {!readOnly && (
                      <>
                        {/* <Button color="soft-primary" size="sm" className="btn-soft-primary">
                          {t("Get Lab Data")}
                        </Button> */}
                        {/* <Button color="soft-primary" size="sm" className="btn-soft-primary">
                          {t("Import Excel")}
                        </Button> */}
                      </>
                    )}
                    <Link to="/MixPurchaseReturn/mixpurchasereturnlist" className="btn btn-soft-primary btn-sm">
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
                    {/* Row 1: DATE | MEMO NUMBER | INV/BILL NO | TYPE | SUB TYPE | CATEGORY */}
                    <Row className="g-2">
                      <Col md={2} sm={4} xs={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("DATE")}</Label>
                          <Input
                            type="date"
                            className="form-control-sm"
                            style={fieldH}
                            value={header.trnDate}
                            onChange={(e) => onTrnDateChange(e.target.value)}
                            readOnly={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4} xs={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("MEMO NUMBER")}</Label>
                          <Input className="form-control-sm custom-readonly-input" style={fieldH} value={header.invNo} readOnly />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4} xs={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("INV/BILL NO")}</Label>
                          <Input className="form-control-sm" style={fieldH} value={header.billNo} onChange={(e) => setHeaderField("billNo", e.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4} xs={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("TYPE")}</Label>
                          <Select
                            styles={customStyles}
                            options={typeOpts}
                            value={typeOpts.find((o) => String(o.value) === String(header.invType) || (o.id && String(o.id) === String(header.invType))) || (header.invType ? { value: String(header.invType), label: String(header.invType) } : null)}
                            onChange={(o) => setHeaderField("invType", o?.value || "")}
                            placeholder={t("TYPE")}
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4} xs={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("SUB TYPE")}</Label>
                          <Select
                            styles={customStyles}
                            options={subTypeOpts}
                            value={subTypeOpts.find((o) => String(o.value) === String(header.subType) || (o.id && String(o.id) === String(header.subType))) || (header.subType ? { value: String(header.subType), label: String(header.subType) } : null)}
                            onChange={(o) => setHeaderField("subType", o?.value || "")}
                            placeholder={t("SUB TYPE")}
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4} xs={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("CATEGORY")}</Label>
                          <Select
                            styles={customStyles}
                            options={categoryOpts}
                            value={categoryOpts.find((o) => String(o.value) === String(header.category) || (o.id && String(o.id) === String(header.category))) || (header.category ? { value: String(header.category), label: String(header.category) } : null)}
                            onChange={(o) => setHeaderField("category", o?.value || "")}
                            placeholder={t("CATEGORY")}
                            isClearable
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    {/* Row 2: PARTY [NEW] | DUE DAYS | DUE DATE | CURRENCY | masterSymbol * | stockSymbol * */}
                    <Row className="g-2">
                      <Col md={3} sm={6} xs={12}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">
                            {t("PARTY")}{" "}
                            {!readOnly && (
                              <Link to="/account/add-accountgroup" className="badge bg-soft-primary text-primary ms-1" target="_blank">
                                NEW
                              </Link>
                            )}
                          </Label>
                          <Select
                            styles={customStyles}
                            options={partyOptionsWithSelected}
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
                            placeholder={t("Search Party")}
                            isClearable
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={1} sm={3} xs={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("DUE DAYS")}</Label>
                          <Input type="number" className="form-control-sm" style={fieldH} value={header.dueDays} onChange={(e) => setHeaderField("dueDays", e.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={3} xs={8}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("DUE DATE")}</Label>
                          <Input type="date" className="form-control-sm custom-readonly-input" style={fieldH} value={header.dueDate} readOnly />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4} xs={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("CURRENCY")}</Label>
                          <Select
                            styles={customStyles}
                            options={currencyOpts}
                            value={currencyOpts.find((o) => String(o.value) === String(header.curCode) || (o.id && String(o.id) === String(header.curCode))) || (header.curCode ? { value: String(header.curCode), label: String(header.curCode) } : null)}
                            onChange={async (o) => {
                              const code = o?.value || "";
                              setHeaderField("curCode", code);
                              await applyCurrencyRates(code);
                            }}
                            placeholder={t("CURRENCY")}
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4} xs={3}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{masterSymbol} *</Label>
                          <Input type="number" className="form-control-sm" style={fieldH} value={header.baseRate} onChange={(e) => setHeaderField("baseRate", e.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4} xs={3}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{stockSymbol} *</Label>
                          <Input type="number" className="form-control-sm" style={fieldH} value={header.sBaseRate} onChange={(e) => setHeaderField("sBaseRate", e.target.value)} />
                        </FormGroup>
                      </Col>
                    </Row>

                    {/* Row 3: COMM.AGENT | COM % | COM AMOUNT | Outstanding | DESCRIPTION */}
                    <Row className="g-2">
                      <Col md={3} sm={6} xs={12}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("COMM.AGENT")}</Label>
                          <Select
                            styles={customStyles}
                            options={commOptionsWithSelected}
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
                            placeholder={t("Search Commission")}
                            isClearable
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={1} sm={3} xs={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("COM %")}</Label>
                          <Input type="number" className="form-control-sm" style={fieldH} value={header.adatPer} onChange={(e) => setHeaderField("adatPer", e.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={3} xs={8}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("COM AMOUNT")}</Label>
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
                      <Col md={2} sm={4} xs={6} className="d-flex align-items-center pt-md-3">
                        <FormGroup className="mb-2">
                          <div className="form-check">
                            <Input
                              type="checkbox"
                              className="form-check-input"
                              id="chkoldsale"
                              checked={!!header.chkoldsale}
                              onChange={(e) => setHeaderField("chkoldsale", e.target.checked)}
                            />
                            <Label className="form-check-label text-uppercase small" htmlFor="chkoldsale">
                              {t("Outstanding")}
                            </Label>
                          </div>
                        </FormGroup>
                      </Col>
                      <Col md={4} sm={8} xs={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("DESCRIPTION")}</Label>
                          <Input className="form-control-sm" style={fieldH} value={header.description} onChange={(e) => setHeaderField("description", e.target.value)} />
                        </FormGroup>
                      </Col>
                    </Row>

                    {/* Row 4: BROKER | BRO % | BRO AMOUNT | TRACKING NUMBER | SALES PERSON */}
                    <Row className="g-2">
                      <Col md={3} sm={6} xs={12}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("BROKER")}</Label>
                          <Select
                            styles={customStyles}
                            options={brokerOptionsWithSelected}
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
                            placeholder={t("Search Broker")}
                            isClearable
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={1} sm={3} xs={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("BRO %")}</Label>
                          <Input type="number" className="form-control-sm" style={fieldH} value={header.brokerPer} onChange={(e) => setHeaderField("brokerPer", e.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={3} xs={8}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("BRO AMOUNT")}</Label>
                          <Input className="form-control-sm" style={fieldH} value={fmt(summary.broDisplay)} readOnly />
                        </FormGroup>
                      </Col>
                      <Col md={3} sm={6} xs={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("TRACKING NUMBER")}</Label>
                          <Input className="form-control-sm" style={fieldH} value={header.tracking} onChange={(e) => setHeaderField("tracking", e.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md={3} sm={6} xs={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("SALES PERSON")}</Label>
                          <Input className="form-control-sm" style={fieldH} value={header.salesPerson} onChange={(e) => setHeaderField("salesPerson", e.target.value)} />
                        </FormGroup>
                      </Col>
                    </Row>

                    {/* Row 5: SHIP VIA — MVC select2 Search ShipVia */}
                    <Row className="g-2 align-items-end">
                      <Col md={4} sm={6} xs={12}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1 text-uppercase small">{t("SHIP VIA")}</Label>
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
                    </Row>
                  </fieldset>
                </CardBody>
              </Card>

              {/* Item Entry Section */}
              <Card className="shadow-sm border-0 rounded-3 mb-3">
                <CardBody className="p-3">
                  {!readOnly && (
                    <>
                      {/* Item Entry Row 1: LOT NUMBER (col-lg-4) | ITEM NAME (col-lg-2) | SHAPE (col-lg-1) | COLOR (col-lg-1) | CLARITY (col-lg-1) | SIZE (col-lg-1) | SIEVE (col-lg-2) */}
                      <Row className="g-2 align-items-end mb-2">
                        <Col xs={12} sm={6} lg={4}>
                          <FormGroup className="mb-0">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <Label className="form-label mb-0 text-uppercase fw-semibold" style={{ fontSize: "11px", color: "#495057" }}>
                                {t("LOT NUMBER")}
                              </Label>
                              <a
                                href="/parcel/add-ParcelItemMaster"
                                target="_blank"
                                rel="noreferrer"
                                className="badge text-primary border border-primary text-decoration-none"
                                style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "4px", fontWeight: 500, backgroundColor: "transparent" }}
                              >
                                ADD ITEM
                              </a>
                              <div className="form-check m-0 p-0 d-flex align-items-center">
                                <Input
                                  type="checkbox"
                                  className="form-check-input m-0"
                                  id="cleardata"
                                  style={{ width: "14px", height: "14px", cursor: "pointer" }}
                                  checked={clearData}
                                  onChange={(e) => setClearData(e.target.checked)}
                                />
                              </div>
                            </div>
                            <AsyncSelect
                              styles={customStyles}
                              cacheOptions={false}
                              defaultOptions={false}
                              loadOptions={loadLotOptions}
                              value={lotSel}
                              onChange={(o) => {
                                setLotSel(o);
                                onEntryChange("lotNo", o?.value || "");
                                if (o?.value) fillFromLot(o.value);
                              }}
                              placeholder={t("Lot No")}
                              isClearable
                              isSearchable
                              filterOption={null}
                              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                              menuPosition="fixed"
                              loadingMessage={() => t("Searching...")}
                              noOptionsMessage={({ inputValue }) =>
                                (inputValue || "").trim()
                                  ? t("No matching lot numbers")
                                  : t("Type to search lot numbers")
                              }
                            />
                          </FormGroup>
                        </Col>

                        <Col xs={12} sm={6} lg={2}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("ITEM NAME")}
                            </Label>
                            <Input
                              className="form-control-sm"
                              style={fieldH}
                              placeholder="Name"
                              value={entry.itemName}
                              onChange={(e) => onEntryChange("itemName", e.target.value)}
                            />
                          </FormGroup>
                        </Col>

                        <Col xs={6} sm={4} lg={1}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("SHAPE")}
                            </Label>
                            <Select
                              styles={customStyles}
                              options={shapeOpts}
                              value={shapeOpts.find((o) => String(o.value) === String(entry.shape) || (o.id && String(o.id) === String(entry.shape))) || (entry.shape ? { value: String(entry.shape), label: String(entry.shape) } : null)}
                              onChange={(o) => onEntryChange("shape", o?.value || "")}
                              placeholder={t("Shape")}
                              isClearable
                            />
                          </FormGroup>
                        </Col>

                        <Col xs={6} sm={4} lg={1}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("COLOR")}
                            </Label>
                            <Select
                              styles={customStyles}
                              options={colorOpts}
                              value={colorOpts.find((o) => String(o.value) === String(entry.color) || (o.id && String(o.id) === String(entry.color))) || (entry.color ? { value: String(entry.color), label: String(entry.color) } : null)}
                              onChange={(o) => onEntryChange("color", o?.value || "")}
                              placeholder={t("Color")}
                              isClearable
                            />
                          </FormGroup>
                        </Col>

                        <Col xs={6} sm={4} lg={1}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("CLARITY")}
                            </Label>
                            <Select
                              styles={customStyles}
                              options={clarityOpts}
                              value={clarityOpts.find((o) => String(o.value) === String(entry.clarity) || (o.id && String(o.id) === String(entry.clarity))) || (entry.clarity ? { value: String(entry.clarity), label: String(entry.clarity) } : null)}
                              onChange={(o) => onEntryChange("clarity", o?.value || "")}
                              placeholder={t("Clarity")}
                              isClearable
                            />
                          </FormGroup>
                        </Col>

                        <Col xs={6} sm={4} lg={1}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("SIZE")}
                            </Label>
                            <Select
                              styles={customStyles}
                              options={sizeOpts}
                              value={sizeOpts.find((o) => String(o.value) === String(entry.size) || (o.id && String(o.id) === String(entry.size))) || (entry.size ? { value: String(entry.size), label: String(entry.size) } : null)}
                              onChange={(o) => onEntryChange("size", o?.value || "")}
                              placeholder={t("Size")}
                              isClearable
                            />
                          </FormGroup>
                        </Col>

                        <Col xs={6} sm={4} lg={2}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("SIEVE")}
                            </Label>
                            <Select
                              styles={customStyles}
                              options={sieveOpts}
                              value={sieveOpts.find((o) => String(o.value) === String(entry.sieve) || (o.id && String(o.id) === String(entry.sieve))) || (entry.sieve ? { value: String(entry.sieve), label: String(entry.sieve) } : null)}
                              onChange={(o) => onEntryChange("sieve", o?.value || "")}
                              placeholder={t("Sieve")}
                              isClearable
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      {/* Item Entry Row 2: 11 fields (PCS, ISS.CTS, REJP %, REJE, SELECT.CTS, COGS, RATE, $ RATE, LESS1, LESS2, LESS3) */}
                      <Row className="g-2 align-items-end mb-2 flex-nowrap overflow-auto" style={{ minWidth: 0 }}>
                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("PCS")}
                            </Label>
                            <Input type="number" className="form-control-sm" style={fieldH} value={entry.pcs} onChange={(e) => onEntryChange("pcs", e.target.value)} />
                          </FormGroup>
                        </Col>

                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("ISS.CTS")}
                            </Label>
                            <Input
                              type="number"
                              step="any"
                              className="form-control-sm"
                              style={fieldH}
                              value={entry.issueCarats}
                              onChange={(e) => onEntryChange("issueCarats", e.target.value)}
                            />
                          </FormGroup>
                        </Col>

                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("REJP %")}
                            </Label>
                            <Input
                              type="number"
                              step="any"
                              className="form-control-sm"
                              style={fieldH}
                              value={entry.rejP}
                              onChange={(e) => onEntryChange("rejP", e.target.value)}
                            />
                          </FormGroup>
                        </Col>

                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("REJE")}
                            </Label>
                            <Input
                              type="number"
                              step="any"
                              className="form-control-sm"
                              style={fieldH}
                              value={entry.rejection}
                              onChange={(e) => onEntryChange("rejection", e.target.value)}
                            />
                          </FormGroup>
                        </Col>

                        <Col style={{ flex: "1 0 0%", minWidth: "75px" }}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("SELECT.CTS")}
                            </Label>
                            <Input
                              type="number"
                              step="any"
                              className="form-control-sm"
                              style={fieldH}
                              value={entry.selectionCarats}
                              onChange={(e) => onEntryChange("selectionCarats", e.target.value)}
                            />
                          </FormGroup>
                        </Col>

                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("COGS")}
                            </Label>
                            <Input className="form-control-sm" style={fieldH} value={entry.cogs} onChange={(e) => onEntryChange("cogs", e.target.value)} />
                          </FormGroup>
                        </Col>

                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("RATE")}
                            </Label>
                            <Input type="number" className="form-control-sm" style={fieldH} value={entry.rate} onChange={(e) => onEntryChange("rate", e.target.value)} />
                          </FormGroup>
                        </Col>

                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("$ RATE")}
                            </Label>
                            <Input className="form-control-sm" style={fieldH} value={entry.sRate} onChange={(e) => onEntryChange("sRate", e.target.value)} />
                          </FormGroup>
                        </Col>

                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("LESS1")}
                            </Label>
                            <Input type="number" className="form-control-sm" style={fieldH} value={entry.less1} onChange={(e) => onEntryChange("less1", e.target.value)} />
                          </FormGroup>
                        </Col>

                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("LESS2")}
                            </Label>
                            <Input type="number" className="form-control-sm" style={fieldH} value={entry.less2} onChange={(e) => onEntryChange("less2", e.target.value)} />
                          </FormGroup>
                        </Col>

                        <Col style={{ flex: "1 0 0%", minWidth: "65px" }}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold text-nowrap" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("LESS3")}
                            </Label>
                            <Input type="number" className="form-control-sm" style={fieldH} value={entry.less3} onChange={(e) => onEntryChange("less3", e.target.value)} />
                          </FormGroup>
                        </Col>
                      </Row>

                      {/* Item Entry Row 3: AMOUNT (col-lg-2) | EXPORT NO (col-lg-2) | STOCKTYPE (col-lg-2) | Add Item button (col-lg-2) */}
                      <Row className="g-2 align-items-end">
                        <Col xs={6} sm={3} lg={2}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("AMOUNT")}
                            </Label>
                            <Input className="form-control-sm" style={fieldH} value={entry.amount} readOnly />
                          </FormGroup>
                        </Col>

                        <Col xs={6} sm={3} lg={2}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("EXPORT NO")}
                            </Label>
                            <Input
                              className="form-control-sm"
                              style={fieldH}
                              placeholder="ExportNo"
                              value={entry.exportNo}
                              onChange={(e) => onEntryChange("exportNo", e.target.value)}
                            />
                          </FormGroup>
                        </Col>

                        <Col xs={6} sm={3} lg={2}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("ItemDescription")}
                            </Label>
                            <Input
                              className="form-control-sm"
                              style={fieldH}
                              placeholder={t("ItemDescription")}
                              value={entry.invDescription || ""}
                              onChange={(e) => onEntryChange("invDescription", e.target.value)}
                            />
                          </FormGroup>
                        </Col>

                        <Col xs={6} sm={3} lg={2}>
                          <FormGroup className="mb-0">
                            <Label className="form-label mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px", color: "#495057" }}>
                              {t("STOCKTYPE")}
                            </Label>
                            <Input
                              className="form-control-sm custom-readonly-input"
                              style={{ ...fieldH, backgroundColor: "#eff2f7" }}
                              placeholder="StockType"
                              value={entry.stockType}
                              readOnly
                            />
                          </FormGroup>
                        </Col>

                        <Col xs={6} sm={3} lg={2}>
                          <FormGroup className="mb-0">
                            <Button
                              color="primary"
                              size="sm"
                              style={{
                                ...fieldH,
                                width: "100%",
                                maxWidth: "150px",
                                fontWeight: 500
                              }}
                              onClick={handleAddItem}
                            >
                              {editIndex >= 0 ? t("Update Item") : t("Add Item")}
                            </Button>
                          </FormGroup>
                        </Col>
                      </Row>
                    </>
                  )}

                  {/* Items Table */}
                  {items.length > 0 && (
                    <div className="table-responsive table-card mt-3 mb-0" style={{ overflowX: "auto" }}>
                      <Table className="table table-bordered table-hover table-sm align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ minWidth: 70 }}>{t("Action")}</th>
                            {ITEM_COLUMNS.map((col) => (
                              <th key={col.key} className={col.align === "end" ? "text-end" : ""} style={{ whiteSpace: "nowrap" }}>
                                {t(col.label)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((r, idx) => (
                            <tr key={`${r.lotNo}-${idx}`}>
                              <td>
                                {!readOnly ? (
                                  <div className="d-flex gap-1">
                                    <button type="button" className="btn btn-soft-primary btn-sm p-1" onClick={() => handleEditRow(idx)}>
                                      <i className="ri-pencil-line" />
                                    </button>
                                    <button type="button" className="btn btn-soft-danger btn-sm p-1" onClick={() => handleDeleteRow(idx)}>
                                      <i className="ri-delete-bin-line" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              {ITEM_COLUMNS.map((col) => (
                                <td key={col.key} className={col.align === "end" ? "text-end" : ""} style={{ whiteSpace: "nowrap" }}>
                                  {renderItemCell(r, col, lookupOpts)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-light fw-semibold">
                          <tr>
                            <td colSpan={3}>{t("Total")}</td>
                            {ITEM_COLUMNS.slice(2).map((col) => (
                              <td key={col.key} className={col.align === "end" ? "text-end text-nowrap" : "text-nowrap"} style={{ whiteSpace: "nowrap" }}>
                                {col.footer ? getItemFooterValue(col.footer, totals, items) : ""}
                              </td>
                            ))}
                          </tr>
                        </tfoot>
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

            {/* Right Side Panel (Summary & Bulk Lot Entry) */}
            <Col xs={12} lg={3}>
              {/* Summary Card */}
              <Card className="shadow-sm border-0 rounded-3 mb-3">
                <CardHeader className="bg-transparent border-bottom py-2">
                  <h6 className="mb-0 fw-bold text-uppercase small">{t("Summary")}</h6>
                </CardHeader>
                <CardBody className="pt-2 pb-3 pe-3">
                  <fieldset disabled={readOnly} className="border-0 m-0 p-0" style={{ minWidth: 0 }}>
                    <FormGroup className="mb-2">
                      <Label className="form-label mb-1 text-uppercase small">{t("+/-AMOUNT")}</Label>
                      <Input type="number" className="form-control-sm text-end" style={fieldH} value={header.plusMinusAmount} onChange={(e) => setHeaderField("plusMinusAmount", e.target.value)} />
                    </FormGroup>
                    <div className="d-flex justify-content-between mb-2 fs-13">
                      <span className="text-muted text-uppercase fw-medium small">{t("NET AMOUNT")}</span>
                      <strong>{summary.netAmount}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2 fs-13">
                      <span className="text-muted text-uppercase fw-medium small">{t("M. CURRENCY NET AMOUNT")}</span>
                      <strong>{summary.netMAmount}</strong>
                    </div>
                    <Row className="g-1 mb-2">
                      <Col xs={6}>
                        <Label className="form-label mb-1 text-uppercase small">CGST%</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={header.cgstPer} onChange={(e) => setHeaderField("cgstPer", e.target.value)} />
                      </Col>
                      <Col xs={6}>
                        <Label className="form-label mb-1 text-uppercase small">{t("CGST Amount")}</Label>
                        <Input className="form-control-sm custom-readonly-input" style={fieldH} value={fmt(summary.cgstAmt)} readOnly />
                      </Col>
                      <Col xs={6}>
                        <Label className="form-label mb-1 text-uppercase small">SGST%</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={header.sgstPer} onChange={(e) => setHeaderField("sgstPer", e.target.value)} />
                      </Col>
                      <Col xs={6}>
                        <Label className="form-label mb-1 text-uppercase small">{t("SGST Amount")}</Label>
                        <Input className="form-control-sm custom-readonly-input" style={fieldH} value={fmt(summary.sgstAmt)} readOnly />
                      </Col>
                      <Col xs={6}>
                        <Label className="form-label mb-1 text-uppercase small">IGST%</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={header.igstPer} onChange={(e) => setHeaderField("igstPer", e.target.value)} />
                      </Col>
                      <Col xs={6}>
                        <Label className="form-label mb-1 text-uppercase small">{t("IGST Amount")}</Label>
                        <Input className="form-control-sm custom-readonly-input" style={fieldH} value={fmt(summary.igstAmt)} readOnly />
                      </Col>
                    </Row>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between mb-1 gap-2">
                      <span className="text-primary fw-semibold small text-uppercase">{masterSymbol} FINAL AMOUNT</span>
                      <strong className="text-end text-primary">{summary.finalMAmount}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1 gap-2">
                      <span className="text-primary fw-semibold small text-uppercase">{stockSymbol} FINAL AMOUNT</span>
                      <strong className="text-end text-primary">{summary.finalSAmount}</strong>
                    </div>
                    <div className="d-flex justify-content-between gap-2">
                      <span className="text-primary fw-semibold small text-uppercase">{t("TRANSACTION FINAL AMOUNT")}</span>
                      <strong className="text-end text-primary">{summary.finalMPayRecAmount}</strong>
                    </div>
                  </fieldset>
                </CardBody>
              </Card>

              {/* Bulk Lot & Extra Right-Bottom Section */}
              <Card className="shadow-sm border-0 rounded-3 mb-3">
                <CardHeader className="bg-transparent border-bottom py-2">
                  <h6 className="mb-0 fw-semibold text-uppercase small">{t("ENTER LOT NO")}</h6>
                </CardHeader>
                <CardBody className="p-3">
                  {!readOnly && (
                    <>
                      <FormGroup className="mb-2">
                        <Input
                          type="textarea"
                          rows={4}
                          placeholder={t("Add by lot no")}
                          value={bulkLotNos}
                          onChange={(e) => setBulkLotNos(e.target.value)}
                        />
                      </FormGroup>
                      <Button color="primary" size="sm" className="w-100 mb-2 fw-medium" onClick={handleGetItemFromList}>
                        {t("Get Item From Lot")}
                      </Button>
                      {/* <Button color="soft-primary" size="sm" className="btn-soft-primary w-100 mb-3 fw-medium">
                        {t("Get Back from Excel")}
                      </Button> */}
                    </>
                  )}
                  <fieldset disabled={readOnly} className="border-0 m-0 p-0" style={{ minWidth: 0 }}>
                    <FormGroup className="mb-0">
                      <Label className="form-label mb-1 text-uppercase small">{t("ADDRESS")}</Label>
                      <Select
                        styles={customStyles}
                        options={addressOpts}
                        value={addressOpts.find((o) => String(o.value) === String(header.address) || (o.id && String(o.id) === String(header.address))) || (header.address ? { value: String(header.address), label: String(header.address) } : null)}
                        onChange={(o) => setHeaderField("address", o?.value || "")}
                        placeholder={t("Address")}
                        isDisabled={readOnly}
                      />
                    </FormGroup>
                  </fieldset>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default MixPurchaseReturnForm;
