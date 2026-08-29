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
  addSolitaireSaleReturn,
  editSolitaireSaleReturn,
  fillSolitaireSaleReturnSaleToSaleReturn,
  getAccGrpMasters,
  getCurrencyRates,
  getSolitaireLots,
  getSolitaireSaleReturnDetail,
  getSolitaireSaleReturnLotDetail,
  getSolitaireSaleReturnPageData,
  getSolitaireSaleReturnSaleToSaleReturn,
  refreshSolitaireSaleReturnBack
} from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  REPORT_COMPANY_SETTINGS_EVENT
} from "../../../../helpers/reportCompanyDefaults";

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
    const variants = [key, key.charAt(0).toLowerCase() + key.slice(1), key.charAt(0).toUpperCase() + key.slice(1)];
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

const toNum = (v, d = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : d;
};

const fmt = (v, decimals = 2) => toNum(v).toFixed(decimals);

const calcItemAmount = (weight, rate, less1, less2, less3) => {
  let amount = toNum(weight) * toNum(rate);
  if (toNum(less1) !== 0) amount = (amount * (100 + toNum(less1))) / 100;
  if (toNum(less2) !== 0) amount = (amount * (100 + toNum(less2))) / 100;
  if (toNum(less3) !== 0) amount = (amount * (100 + toNum(less3))) / 100;
  return Math.round(amount * 100) / 100;
};

const emptyItem = () => ({
  lotNo: "",
  itemName: "",
  exportNo: "",
  memoTransCode: "",
  weight: "",
  pcs: "",
  mrp: "",
  back: "",
  rate: "",
  less1: "0",
  less2: "0",
  less3: "0",
  amount: "",
  status: "",
  spCarats: "",
  returnCarats: "",
  sRtnStatus: ""
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
    return v === needle || l === needle;
  });
  return matched ? matched.value : String(raw);
};

const mapItemFromApi = (r, idx) => ({
  srNo: idx + 1,
  lotNo: getStrVal(r, "LotNo"),
  itemName: getStrVal(r, "ItemName"),
  exportNo: getStrVal(r, "ExportNo"),
  memoTransCode: getNumVal(r, "MemoTransCode", "MemoTranCode"),
  weight: getNumVal(r, "Weight", "Carats"),
  pcs: getNumVal(r, "Pcs") || 0,
  mrp: getNumVal(r, "MRP"),
  back: getNumVal(r, "Back", "PMRPDown"),
  rate: getNumVal(r, "Rate"),
  less1: getNumVal(r, "Less1"),
  less2: getNumVal(r, "Less2"),
  less3: getNumVal(r, "Less3"),
  amount: getNumVal(r, "Amount", "PurAmount"),
  status: getStrVal(r, "Status"),
  spCarats: getNumVal(r, "SpCarats"),
  returnCarats: getNumVal(r, "ReturnCarats", "RtnCarats"),
  sRtnStatus: getStrVal(r, "SRtnStatus")
});

const mapItemsForApi = (rows) =>
  rows.map((r, i) => ({
    SrNo: i + 1,
    LotNo: r.lotNo,
    ItemName: r.itemName,
    Weight: toNum(r.weight),
    Pcs: toNum(r.pcs),
    MRP: toNum(r.mrp),
    Back: toNum(r.back),
    Rate: toNum(r.rate),
    Less1: toNum(r.less1),
    Less2: toNum(r.less2),
    Less3: toNum(r.less3),
    Amount: toNum(r.amount),
    ExportNo: r.exportNo || "",
    MemoTransCode: toNum(r.memoTransCode),
    ReturnCarats: toNum(r.returnCarats),
    Status: r.status || "",
    SpCarats: toNum(r.spCarats),
    SRtnStatus: r.sRtnStatus || ""
  }));

const ITEM_COLUMNS = [
  { key: "lotNo", label: "LotNo" },
  { key: "itemName", label: "ItemName" },
  { key: "weight", label: "Weight", align: "end", decimals: 3, footer: "weight" },
  { key: "pcs", label: "Pcs", align: "end", footer: "pcs" },
  { key: "mrp", label: "MRP", align: "end", decimals: 2, footer: "avgMrp" },
  { key: "back", label: "Back", align: "end", decimals: 2, footer: "avgBack" },
  { key: "rate", label: "Rate", align: "end", decimals: 2, footer: "avgRate" },
  { key: "less1", label: "Less1", align: "end", decimals: 2 },
  { key: "less2", label: "Less2", align: "end", decimals: 2 },
  { key: "less3", label: "Less3", align: "end", decimals: 2 },
  { key: "amount", label: "Amount", align: "end", decimals: 2, footer: "totAmount" },
  { key: "exportNo", label: "Export No" },
  { key: "memoTransCode", label: "MemoTrnCode" }
];

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

const renderItemCell = (row, col) => {
  const v = row[col.key];
  if (col.decimals != null) {
    if (v === "" || v == null) return v === 0 || v === "0" ? fmt(0, col.decimals) : "";
    return fmt(v, col.decimals);
  }
  if (typeof v === "number") return v === 0 ? "0" : String(v);
  return v ?? "";
};

const WarningModal = ({ open, title, message, confirmText, onClose }) => (
  <Modal isOpen={open} toggle={onClose} centered contentClassName="border-0 shadow-lg" style={{ maxWidth: "400px" }}>
    <ModalBody className="py-4 px-5 text-center">
      <h3 className="mb-2 fw-semibold" style={{ color: "#495057", fontSize: "24px" }}>{title || "Warning!"}</h3>
      <p className="text-muted mb-4 fs-14">{message}</p>
      <button type="button" className="btn px-4 py-2 fw-semibold text-white" style={{ backgroundColor: "#13d17c", borderColor: "#13d17c" }} onClick={onClose}>
        {confirmText || "OK"}
      </button>
    </ModalBody>
  </Modal>
);

const SolitaireSaleReturnForm = ({ mode = "add" }) => {
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

  const [partyInput, setPartyInput] = useState("");
  const [partyOpts, setPartyOpts] = useState([]);
  const [partyLoading, setPartyLoading] = useState(false);
  const [party, setParty] = useState(null);

  const [brokerInput, setBrokerInput] = useState("");
  const [brokerOpts, setBrokerOpts] = useState([]);
  const [brokerLoading, setBrokerLoading] = useState(false);
  const [broker, setBroker] = useState(null);

  const [commInput, setCommInput] = useState("");
  const [commOpts, setCommOpts] = useState([]);
  const [commLoading, setCommLoading] = useState(false);
  const [commission, setCommission] = useState(null);

  const [lotInput, setLotInput] = useState("");
  const [lotOpts, setLotOpts] = useState([]);
  const [lotLoading, setLotLoading] = useState(false);
  const [lotSel, setLotSel] = useState(null);

  const [mOp, setMOp] = useState("*");
  const [sOp, setSOp] = useState("*");
  const [editIndex, setEditIndex] = useState(-1);
  const [items, setItems] = useState([]);
  const [entry, setEntry] = useState(emptyItem());
  const [refreshBack, setRefreshBack] = useState("");
  const [refreshRate, setRefreshRate] = useState("");
  const [warningModal, setWarningModal] = useState({ open: false, message: "" });
  const showWarning = useCallback((message) => setWarningModal({ open: true, message }), []);
  const closeWarning = useCallback(() => setWarningModal({ open: false, message: "" }), []);

  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [saleRows, setSaleRows] = useState([]);
  const [saleSort, setSaleSort] = useState({ key: null, direction: "asc" });

  const [masterSymbol, setMasterSymbol] = useState("INR");
  const [stockSymbol, setStockSymbol] = useState("USD");

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
    description: "",
    plusMinusAmount: 0,
    roundAmount: 0,
    roundDate: todayIso(),
    saleInvNo: "",
    adatPer: 0,
    brokerPer: 0,
    vatPer: 0,
    cgstPer: 0,
    sgstPer: 0,
    igstPer: 0
  });

  const fieldH = { height: 31 };

  const customStyles = useMemo(
    () => ({
      control: (p, s) => ({
        ...p,
        backgroundColor: s.isDisabled ? "var(--vz-input-disabled-bg, var(--vz-secondary-bg, #eff2f7))" : "var(--vz-secondary-bg, #fff)",
        borderColor: "var(--vz-border-color, #ced4da)",
        color: s.isDisabled ? "var(--vz-secondary-color, #878a99)" : "var(--vz-body-color, #495057)",
        minHeight: "31px",
        height: "31px",
        opacity: s.isDisabled ? 0.85 : 1
      }),
      valueContainer: (p) => ({ ...p, padding: "0 8px", height: "31px" }),
      indicatorsContainer: (p) => ({ ...p, height: "31px" }),
      input: (p) => ({ ...p, margin: 0, padding: 0, color: "var(--vz-body-color, #495057)" }),
      menu: (p) => ({ ...p, backgroundColor: "var(--vz-secondary-bg, #fff)", color: "var(--vz-body-color, #495057)", border: "1px solid var(--vz-border-color, #dee2e6)", zIndex: 20 }),
      option: (p, s) => ({ ...p, backgroundColor: s.isFocused ? "#3b5de7" : "transparent", color: s.isFocused ? "#fff" : "var(--vz-body-color, #495057)", fontSize: "12px", cursor: "pointer", ":active": { backgroundColor: "#3b5de7" } }),
      placeholder: (p) => ({ ...p, color: "var(--vz-secondary-color, #878a99)", fontSize: "11px" }),
      singleValue: (p, s) => ({ ...p, fontSize: "12px", color: s.isDisabled ? "var(--vz-secondary-color, #878a99)" : "var(--vz-body-color, #495057)" })
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
        setOpts(d.map((item) => ({ value: String(item.accGrpCode || item.AccGrpCode || ""), label: item.accGrpName || item.AccGrpName || "" })));
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
    const tmr = setTimeout(() => searchAccounts(brokerInput, setBrokerOpts, setBrokerLoading), 400);
    return () => clearTimeout(tmr);
  }, [brokerInput, searchAccounts]);

  useEffect(() => {
    const tmr = setTimeout(() => searchAccounts(commInput, setCommOpts, setCommLoading), 400);
    return () => clearTimeout(tmr);
  }, [commInput, searchAccounts]);

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
        setLotOpts(raw.map((item) => {
          const val = item.name || item.Name || item.id || item.ID || item.textName || item.TextName || "";
          const lbl = item.textName || item.TextName || item.text || item.Name || item.name || item.id || item.ID || "";
          return { value: String(val), label: String(lbl).toUpperCase() };
        }));
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
    const res = await getSolitaireSaleReturnPageData();
    if (!(res?.success || res?.Success)) {
      toast.error(res?.Data || res?.data || t("Failed to load page data."));
      return null;
    }
    const d = res.Data || res.data || {};
    const types = mapBasicWithNameAsValue(d.Type || d.type);
    const subs = mapBasicWithNameAsValue(d.SubType || d.subType);
    const cats = mapBasicWithNameAsValue(d.Category || d.category);
    const curs = mapBasic(d.CurrencyList || d.currencyList);
    setTypeOpts(types);
    setSubTypeOpts(subs);
    setCategoryOpts(cats);
    setCurrencyOpts(curs);
    return { types, subs, cats, curs, defaultCurrencyCode: d.DefaultCurrencyCode || d.defaultCurrencyCode };
  };

  const loadDetail = async (pageData = null) => {
    if (!editId) return;
    const res = await getSolitaireSaleReturnDetail(editId);
    if (!(res?.success || res?.Success)) {
      toast.error(res?.Data || res?.data || t("Sale Return not found."));
      return;
    }
    const data = res.Data || res.data || {};
    const h = data.Header || data.header || {};
    const rows = data.Items || data.items || [];

    setParty(getVal(h, "PartyCode") ? { value: String(getVal(h, "PartyCode")), label: getVal(h, "PartyName") || String(getVal(h, "PartyCode")) } : null);
    setBroker(getVal(h, "BrokerCode") ? { value: String(getVal(h, "BrokerCode")), label: getVal(h, "BrokerName") || String(getVal(h, "BrokerCode")) } : null);
    setCommission(getVal(h, "AdatCode") ? { value: String(getVal(h, "AdatCode")), label: getVal(h, "AdatName") || String(getVal(h, "AdatCode")) } : null);

    setHeader({
      code: toNum(getVal(h, "Code")),
      trnDate: toLocalDateStr(getVal(h, "TrnDate")) || todayIso(),
      invNo: getVal(h, "InvNo"),
      billNo: getVal(h, "BillNo"),
      invType: resolveSelectValue(pageData?.types || typeOpts, getVal(h, "InvType")),
      subType: resolveSelectValue(pageData?.subs || subTypeOpts, getVal(h, "SubType")),
      category: resolveSelectValue(pageData?.cats || categoryOpts, getVal(h, "Category")),
      dueDays: toNum(getVal(h, "DueDays")),
      dueDate: toLocalDateStr(getVal(h, "DueDate")) || todayIso(),
      curCode: String(getVal(h, "CurCode") || ""),
      baseRate: toNum(getVal(h, "BaseRate"), 1),
      sBaseRate: toNum(getVal(h, "SBaseRate"), 1),
      description: getVal(h, "Description", "InvDisc"),
      plusMinusAmount: toNum(getVal(h, "PlusMinusAmount")),
      roundAmount: toNum(getVal(h, "RoundAmount")),
      roundDate: toLocalDateStr(getVal(h, "RoundDate")) || todayIso(),
      saleInvNo: "",
      adatPer: toNum(getVal(h, "AdatPer")),
      brokerPer: toNum(getVal(h, "BrokerPer")),
      vatPer: toNum(getVal(h, "VatPer")),
      cgstPer: toNum(getVal(h, "CGSTPer")),
      sgstPer: toNum(getVal(h, "SGSTPer")),
      igstPer: toNum(getVal(h, "IGSTPer"))
    });

    setItems(rows.map((r, idx) => mapItemFromApi(r, idx)));
    const loadedCur = String(getVal(h, "CurCode") || "");
    if (loadedCur) await applyCurrencyRates(loadedCur);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const page = await loadPageData();
      if (isEdit) {
        await loadDetail(page);
      } else if (page?.curs?.length) {
        const defaultCur = page.defaultCurrencyCode ? page.curs.find((c) => String(c.value) === String(page.defaultCurrencyCode)) : null;
        const selectedCur = defaultCur || page.curs[0];
        setHeader((prev) => ({
          ...prev,
          invType: page.types[0]?.value || "",
          subType: "",
          category: page.cats[0]?.value || "",
          curCode: selectedCur.value,
          roundDate: todayIso()
        }));
        await applyCurrencyRates(selectedCur.value);
      }
      setLoading(false);
    })();
  }, [isEdit, editId]);

  useEffect(() => {
    const days = toNum(header.dueDays, 0);
    if (!header.trnDate) return;
    const d = new Date(header.trnDate);
    if (Number.isNaN(d.getTime())) return;
    d.setDate(d.getDate() + days);
    setHeader((prev) => ({ ...prev, dueDate: d.toISOString().substr(0, 10) }));
  }, [header.trnDate, header.dueDays]);

  const setHeaderField = (key, value) => setHeader((prev) => ({ ...prev, [key]: value }));
  const recalcEntryAmount = (next) => ({ ...next, amount: fmt(calcItemAmount(next.weight, next.rate, next.less1, next.less2, next.less3)) });

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
      const res = await getSolitaireSaleReturnLotDetail({ lotNo, curCode: toNum(header.curCode), sBaseRate: toNum(header.sBaseRate, 1) });
      if (!(res?.success || res?.Success)) {
        toast.warning(res?.Data || res?.data || t("Lot detail not found."));
        return;
      }
      const lot = (Array.isArray(res.Data || res.data) ? (res.Data || res.data)[0] : res.Data || res.data) || null;
      if (!lot) return;
      const weight = getNumVal(lot, "Weight", "Carats");
      const mrp = getNumVal(lot, "MRP");
      const back = getNumVal(lot, "Back");
      const pcs = getNumVal(lot, "Pcs") || 0;
      let rate = getNumVal(lot, "Rate");
      if (rate === 0 && mrp !== 0) rate = Math.round(((100 + back) * mrp) / 100 * 10000) / 10000;
      if (weight <= 0) showWarning(t("Not enough stock in hand to make sale or memo."));
      setEntry((prev) => recalcEntryAmount({
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
        less3: prev.less3 === "" || prev.less3 == null ? "0" : prev.less3
      }));
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
    if (!lotNo) return showWarning(t("Lot Number is required."));
    if (weight <= 0) return showWarning(t("Carat or Rate can not be 0"));
    if (mrp === 0 && rate === 0) return showWarning(t("Carat or Rate can not be 0"));
    let purchaseBack = back;
    if (rate !== 0 && mrp !== 0) purchaseBack = (rate * 100) / mrp - 100;
    const row = {
      ...entry,
      lotNo,
      itemName: entry.itemName || lotSel?.label || "",
      weight: Math.round(weight * 1000) / 1000,
      pcs: toNum(entry.pcs, 0),
      mrp,
      back: Math.round(purchaseBack * 100) / 100,
      rate,
      less1: toNum(entry.less1),
      less2: toNum(entry.less2),
      less3: toNum(entry.less3),
      amount: calcItemAmount(weight, rate, entry.less1, entry.less2, entry.less3),
      exportNo: entry.exportNo || "",
      memoTransCode: toNum(entry.memoTransCode),
      status: entry.status || "",
      spCarats: toNum(entry.spCarats),
      returnCarats: toNum(entry.returnCarats)
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
      avgMrp: totCts === 0 ? 0 : totMrp / totCts,
      avgRate: totCts === 0 ? 0 : totWithoutLess / totCts,
      avgBack: totMrp === 0 ? 0 : (totWithoutLess / totMrp) * 100 - 100
    };
  }, [items]);

  const handleRefreshBack = async () => {
    if (!items.length) return toast.warning(t("Please add at least one item."));
    if (toNum(refreshBack) === 0 && toNum(refreshRate) === 0) return toast.warning(t("Enter AvgBack Or rate"));
    try {
      const res = await refreshSolitaireSaleReturnBack({
        refreshback: toNum(refreshBack),
        refreshrate: toNum(refreshRate),
        AvgBack: totals.avgBack,
        AvgRate: totals.avgRate,
        Items: mapItemsForApi(items)
      });
      if (!(res?.success || res?.Success)) {
        toast.warning(res?.Data || res?.data || t("Failed to refresh back/rate."));
        return;
      }
      const data = res.Data || res.data || {};
      const rows = data.ExcelData || data.excelData || [];
      setItems(rows.map((r, idx) => mapItemFromApi(r, idx)));
      if (data.Alert || data.alert) toast.warning(data.Alert || data.alert);
      else toast.success(t("Avg Back/Rate Updated"));
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to refresh back/rate."));
    }
  };

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
    const receivableAmount = mOp === "/" ? (mCurAmount + taxTotal + roundAmount) * baseRate : (mCurAmount + taxTotal + roundAmount) / baseRate;
    const finalSAmount = sOp === "/" ? (stockCurRate !== 0 ? receivableAmount / stockCurRate : 0) : receivableAmount * stockCurRate;
    return {
      comDisplay: Math.round(comDisplay * 100) / 100,
      broDisplay: Math.round(broDisplay * 100) / 100,
      taxableAmount,
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

  const viewInvoices = async () => {
    if (!party?.value && !header.saleInvNo) {
      toast.warning(t("Select Party or enter Invoice Number."));
      return;
    }
    try {
      const res = await getSolitaireSaleReturnSaleToSaleReturn({
        partyCode: party?.value || "",
        invNo: header.saleInvNo || "",
        memoNo: header.saleInvNo || ""
      });
      if (!(res?.success || res?.Success)) {
        toast.warning(res?.Data || res?.data || t("No invoice Found"));
        return;
      }
      const rows = (res.Data || res.data || []).map((r, i) => {
        const ctsVal = toNum(getVal(r, "carats", "BalanceCts", "MReturnCarats"));
        if (i === 0) {
          const cur = getVal(r, "CurCode");
          if (cur) {
            setHeaderField("curCode", String(cur));
            applyCurrencyRates(String(cur));
          }
        }
        return {
          key: i,
          selected: true,
          date: getVal(r, "Date"),
          invNo: getVal(r, "MemoNo", "InvNo"),
          lotNo: getVal(r, "Lotno", "LotNo"),
          itemName: getVal(r, "itemname", "ItemName"),
          cts: ctsVal,
          rtn: ctsVal,
          rate: toNum(getVal(r, "rate", "Rate")),
          mrp: toNum(getVal(r, "MRP")),
          back: toNum(getVal(r, "Back")),
          memoTransCode: toNum(getVal(r, "MemoTransCode")),
          symbol: getVal(r, "Symbol")
        };
      });
      setSaleRows(rows);
      setSaleModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load invoices."));
    }
  };

  const toggleSelectAllSale = (checked) => setSaleRows((prev) => prev.map((x) => ({ ...x, selected: checked })));

  const mergeSaleRowsClientSide = (selected) => {
    setItems((prev) => {
      const next = [...prev];
      selected.forEach((r) => {
        const lotNo = r.lotNo;
        const weight = toNum(r.rtn);
        if (weight > 0 && weight < 0.05) {
          toast.warning(t(`Lotno On Memo or Sold: ${lotNo}`));
          return;
        }
        const rate = toNum(r.rate);
        const mrp = toNum(r.mrp);
        let back = toNum(r.back);
        if (rate !== 0 && mrp !== 0) back = (rate * 100) / mrp - 100;
        const row = {
          lotNo,
          itemName: r.itemName,
          exportNo: "",
          weight,
          pcs: 1,
          mrp,
          back,
          rate,
          less1: 0,
          less2: 0,
          less3: 0,
          amount: calcItemAmount(weight, rate, 0, 0, 0),
          memoTransCode: toNum(r.memoTransCode),
          returnCarats: toNum(r.rtn),
          status: "",
          spCarats: 0,
          sRtnStatus: ""
        };
        const idx = next.findIndex((x) => String(x.lotNo).toLowerCase() === String(lotNo).toLowerCase());
        if (idx >= 0) next[idx] = row;
        else next.push(row);
      });
      return next;
    });
  };

  const saleToSaleReturn = async () => {
    const selected = saleRows.filter((r) => r.selected && toNum(r.rtn) > 0);
    if (!selected.length) {
      toast.warning(t("Select at least one invoice row."));
      return;
    }
    try {
      const payload = {
        Rows: selected.map((r) => ({
          Chk: true,
          LotNo: r.lotNo,
          ItemName: r.itemName,
          ExportNo: "",
          Weight: toNum(r.rtn),
          Pcs: 1,
          MRP: toNum(r.mrp),
          Rate: toNum(r.rate),
          Back: toNum(r.back),
          Less1: 0,
          Less2: 0,
          Less3: 0,
          MemoTransCode: toNum(r.memoTransCode),
          ReturnCarats: toNum(r.rtn)
        })),
        Items: mapItemsForApi(items)
      };
      const res = await fillSolitaireSaleReturnSaleToSaleReturn(payload);
      if (res?.success || res?.Success) {
        const data = res.Data || res.data || {};
        const rows = data.ExcelData || data.excelData || [];
        if (rows.length) {
          setItems(rows.map((r, idx) => mapItemFromApi(r, idx)));
          if (data.Alert || data.alert) toast.warning(data.Alert || data.alert);
          else toast.success(t("Sale items added."));
          setSaleModalOpen(false);
          return;
        }
      }
      mergeSaleRowsClientSide(selected);
      setSaleModalOpen(false);
      toast.success(t("Sale items added."));
    } catch (err) {
      console.error(err);
      mergeSaleRowsClientSide(selected);
      setSaleModalOpen(false);
      toast.success(t("Sale items added."));
    }
  };

  const handleSaleSort = (key) => {
    setSaleSort((prev) => {
      const direction = prev.key === key && prev.direction === "asc" ? "desc" : "asc";
      return { key, direction };
    });
  };

  const sortedSaleRows = useMemo(() => {
    if (!saleSort.key) return saleRows;
    const sorted = [...saleRows];
    sorted.sort((a, b) => {
      const aVal = a[saleSort.key];
      const bVal = b[saleSort.key];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return saleSort.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal ?? "").toLowerCase();
      const bStr = String(bVal ?? "").toLowerCase();
      if (aStr < bStr) return saleSort.direction === "asc" ? -1 : 1;
      if (aStr > bStr) return saleSort.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [saleRows, saleSort]);

  const renderSortHeader = (key, label) => {
    const isSorted = saleSort.key === key;
    const isAsc = saleSort.direction === "asc";
    return (
      <div
        onClick={() => handleSaleSort(key)}
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

  const buildPayload = () => {
    const auth = JSON.parse(sessionStorage.getItem("authUser") || localStorage.getItem("authUser") || "{}");
    const companyId = toNum(auth?.CompanyID || auth?.companyID || auth?.data?.CompanyID);
    return {
      SalePur: {
        Code: toNum(header.code),
        TrnDate: header.trnDate,
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
        TotCts: totals.totCts,
        TotAmount: totals.totAmount,
        PlusMinusAmount: toNum(header.plusMinusAmount),
        NetAmount: summary.taxableAmount,
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
        IGSTAmt: toNum(summary.igstAmt),
        RoundDate: header.roundDate,
        CompanyID: companyId
      },
      Items: mapItemsForApi(items)
    };
  };

  const handleSubmit = async () => {
    if (readOnly) return;
    if (!party?.value) return toast.warning(t("Please select Party."));
    if (!items.length) return toast.warning(t("Please add at least one item."));
    setSaving(true);
    try {
      const payload = buildPayload();
      const res = isEdit ? await editSolitaireSaleReturn(payload) : await addSolitaireSaleReturn(payload);
      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || t("Saved successfully."));
        navigate("/salereturn/salereturn-list", { state: { successMessage: res?.Data || res?.data || t("Saved successfully.") } });
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

  const title = isView ? t("View Sale Return") : isEdit ? t("Edit Sale Return") : t("Add Sale Return");
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
          <BreadCrumb title={title} pageTitle={t("Sales")} />
          <Row className="align-items-start g-3 mb-3">
            <Col xs={12}>
              <Card className="shadow-sm border-0 rounded-3 mb-0">
                <CardHeader className="bg-transparent border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                    <i className="ri-file-list-3-line fs-20" />
                    {title}
                  </h5>
                  <div className="d-flex gap-2 flex-wrap">
                    <Link to="/salereturn/salereturn-list" className="btn btn-soft-secondary btn-sm">{t("Back")}</Link>
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
                      <Col md={2} sm={4}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Date")}</Label><Input type="date" className="form-control-sm" style={fieldH} value={header.trnDate} onChange={(e) => setHeaderField("trnDate", e.target.value)} /></FormGroup></Col>
                      <Col md={2} sm={4}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Invoice Number")}</Label><Input className="form-control-sm custom-readonly-input" style={fieldH} value={header.invNo} readOnly /></FormGroup></Col>
                      <Col md={2} sm={4}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Bill No")}</Label><Input className="form-control-sm" style={fieldH} value={header.billNo} onChange={(e) => setHeaderField("billNo", e.target.value)} /></FormGroup></Col>
                      <Col md={2} sm={4}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Type")}</Label><Select styles={customStyles} options={typeOpts} value={typeOpts.find((o) => String(o.value) === String(header.invType)) || null} onChange={(o) => setHeaderField("invType", o?.value || "")} placeholder={t("Type")} isDisabled={readOnly} /></FormGroup></Col>
                      <Col md={2} sm={4}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("SubType")}</Label><Select styles={customStyles} options={subTypeOpts} value={subTypeOpts.find((o) => String(o.value) === String(header.subType)) || null} onChange={(o) => setHeaderField("subType", o?.value || "")} placeholder={t("SubType")} isDisabled={readOnly} /></FormGroup></Col>
                      <Col md={2} sm={4}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Category")}</Label><Select styles={customStyles} options={categoryOpts} value={categoryOpts.find((o) => String(o.value) === String(header.category)) || null} onChange={(o) => setHeaderField("category", o?.value || "")} placeholder={t("Category")} isClearable isDisabled={readOnly} /></FormGroup></Col>

                      <Col md={3} sm={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">
                            {t("Party")}
                            {!readOnly && <Link to="/account/add-accountgroup" className="ms-2 small text-primary" target="_blank">{t("Add Account/Group")}</Link>}
                          </Label>
                          <Select styles={customStyles} options={partyOpts} value={party} onChange={setParty} onInputChange={(v, meta) => { if (meta.action === "input-change") setPartyInput(v); else if (meta.action === "input-blur" || meta.action === "menu-close") { setPartyInput(""); setPartyOpts([]); } }} isLoading={partyLoading} placeholder={t("Search Party...")} isClearable isDisabled={readOnly} />
                        </FormGroup>
                      </Col>
                      <Col md={1} sm={3}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Due Days")}</Label><Input type="number" className="form-control-sm" style={fieldH} value={header.dueDays} onChange={(e) => setHeaderField("dueDays", e.target.value)} /></FormGroup></Col>
                      <Col md={2} sm={3}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Due Date")}</Label><Input type="date" className="form-control-sm custom-readonly-input" style={fieldH} value={header.dueDate} readOnly /></FormGroup></Col>
                      <Col md={2} sm={4}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Currency")}</Label><Select styles={customStyles} options={currencyOpts} value={currencyOpts.find((o) => o.value === String(header.curCode)) || null} onChange={async (o) => { const code = o?.value || ""; setHeaderField("curCode", code); await applyCurrencyRates(code); }} placeholder={t("Currency")} isDisabled={readOnly} /></FormGroup></Col>
                      <Col md={2} sm={4}><FormGroup className="mb-2"><Label className="form-label mb-1">{masterSymbol} Rate</Label><Input type="number" className="form-control-sm" style={fieldH} value={header.baseRate} onChange={(e) => setHeaderField("baseRate", e.target.value)} /></FormGroup></Col>
                      <Col md={2} sm={4}><FormGroup className="mb-2"><Label className="form-label mb-1">{stockSymbol} Rate</Label><Input type="number" className="form-control-sm" style={fieldH} value={header.sBaseRate} onChange={(e) => setHeaderField("sBaseRate", e.target.value)} /></FormGroup></Col>

                      <Col md={3} sm={6}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Comm Agent")}</Label><Select styles={customStyles} options={commOpts} value={commission} onChange={setCommission} onInputChange={(v, meta) => { if (meta.action === "input-change") setCommInput(v); else if (meta.action === "input-blur" || meta.action === "menu-close") { setCommInput(""); setCommOpts([]); } }} isLoading={commLoading} placeholder={t("Search Commission")} isClearable isDisabled={readOnly} /></FormGroup></Col>
                      <Col md={1} sm={3}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Com%")}</Label><Input type="number" className="form-control-sm" style={fieldH} value={header.adatPer} onChange={(e) => setHeaderField("adatPer", e.target.value)} /></FormGroup></Col>
                      <Col md={2} sm={3}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Com Amount")}</Label><Input className="form-control-sm" style={fieldH} value={fmt(summary.comDisplay)} readOnly /></FormGroup></Col>
                      <Col md={3} sm={6}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Description")}</Label><Input className="form-control-sm" style={fieldH} value={header.description} onChange={(e) => setHeaderField("description", e.target.value)} /></FormGroup></Col>

                      <Col md={3} sm={6}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Broker")}</Label><Select styles={customStyles} options={brokerOpts} value={broker} onChange={setBroker} onInputChange={(v, meta) => { if (meta.action === "input-change") setBrokerInput(v); else if (meta.action === "input-blur" || meta.action === "menu-close") { setBrokerInput(""); setBrokerOpts([]); } }} isLoading={brokerLoading} placeholder={t("Search Broker")} isClearable isDisabled={readOnly} /></FormGroup></Col>
                      <Col md={1} sm={3}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Bro%")}</Label><Input type="number" className="form-control-sm" style={fieldH} value={header.brokerPer} onChange={(e) => setHeaderField("brokerPer", e.target.value)} /></FormGroup></Col>
                      <Col md={2} sm={3}><FormGroup className="mb-2"><Label className="form-label mb-1">{t("Bro Amount")}</Label><Input className="form-control-sm" style={fieldH} value={fmt(summary.broDisplay)} readOnly /></FormGroup></Col>
                      <Col xs={12} sm={6} md={4} lg={3}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Inv No")}</Label>
                          <div className="d-flex flex-wrap flex-sm-nowrap align-items-center gap-1">
                            <Input
                              className="form-control-sm flex-grow-1"
                              style={{ ...fieldH, minWidth: 0 }}
                              value={header.saleInvNo}
                              onChange={(e) => setHeaderField("saleInvNo", e.target.value)}
                            />
                              <Button
                              color="primary"
                              size="sm"
                              className="sale-view-memo-btn flex-shrink-0"
                              onClick={viewInvoices}
                            >
                              {t("View Invoices")}
                            </Button>
                          </div>
                        </FormGroup>
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
                <CardHeader className="bg-transparent border-bottom"><h6 className="mb-0 fw-semibold">{t("Item Entry")}</h6></CardHeader>
                <CardBody>
                  {!readOnly && (
                    <div className="txn-item-entry-grid">
                      <div className="txn-item-field txn-item-field--wide">
                        <Label className="form-label mb-1">
                          {t("Lot Number")}
                          <Link to="/masters/add-solitaire-item-master" className="ms-2 small text-primary" target="_blank">{t("Add Item")}</Link>
                        </Label>
                        <CreatableSelect styles={customStyles} options={lotOpts} value={lotSel} onChange={(o) => { setLotSel(o); onEntryChange("lotNo", o?.value || ""); if (o?.value) fillFromLot(o.value); }} onInputChange={(v, meta) => { if (meta.action === "input-change") setLotInput(v); else if (meta.action === "input-blur" || meta.action === "menu-close") { setLotInput(""); setLotOpts([]); } }} isLoading={lotLoading} placeholder={t("Lot...")} isClearable />
                      </div>
                      <div className="txn-item-field txn-item-field--wide">
                        <Label className="form-label mb-1">{t("Item Name")}</Label>
                        <Input className="form-control-sm" style={fieldH} value={entry.itemName} onChange={(e) => onEntryChange("itemName", e.target.value)} />
                      </div>
                      <div className="txn-item-field">
                        <Label className="form-label mb-1" title={t("Export No")}>{t("Export No")}</Label>
                        <Input className="form-control-sm" style={fieldH} value={entry.exportNo} onChange={(e) => onEntryChange("exportNo", e.target.value)} />
                      </div>
                      <div className="txn-item-field">
                        <Label className="form-label mb-1" title={t("MemoTrnCode")}>{t("MemoTrnCode")}</Label>
                        <Input className="form-control-sm custom-readonly-input" style={fieldH} value={entry.memoTransCode} readOnly />
                      </div>
                      <div className="txn-item-field">
                        <Label className="form-label mb-1">{t("Weight")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.weight} onChange={(e) => onEntryChange("weight", e.target.value)} />
                      </div>
                      <div className="txn-item-field">
                        <Label className="form-label mb-1">{t("Pcs")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.pcs} onChange={(e) => onEntryChange("pcs", e.target.value)} />
                      </div>
                      <div className="txn-item-field">
                        <Label className="form-label mb-1">{t("MRP")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.mrp} onChange={(e) => onEntryChange("mrp", e.target.value)} />
                      </div>
                      <div className="txn-item-field">
                        <Label className="form-label mb-1">{t("Back")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.back} onChange={(e) => onEntryChange("back", e.target.value)} />
                      </div>
                      <div className="txn-item-field">
                        <Label className="form-label mb-1">{t("Rate")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.rate} onChange={(e) => onEntryChange("rate", e.target.value)} />
                      </div>
                      <div className="txn-item-field">
                        <Label className="form-label mb-1">{t("Less1")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.less1} onChange={(e) => onEntryChange("less1", e.target.value)} />
                      </div>
                      <div className="txn-item-field">
                        <Label className="form-label mb-1">{t("Less2")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.less2} onChange={(e) => onEntryChange("less2", e.target.value)} />
                      </div>
                      <div className="txn-item-field">
                        <Label className="form-label mb-1">{t("Less3")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.less3} onChange={(e) => onEntryChange("less3", e.target.value)} />
                      </div>
                      <div className="txn-item-field">
                        <Label className="form-label mb-1">{t("Amount")}</Label>
                        <Input className="form-control-sm" style={fieldH} value={entry.amount} readOnly />
                      </div>
                      <div className="txn-item-field txn-item-field--btn">
                        <Label className="form-label mb-1 d-none d-xl-block">&nbsp;</Label>
                        <Button color="primary" size="sm" className="w-100 sale-add-item-btn" onClick={handleAddItem}>
                          {editIndex >= 0 ? t("Update Item") : t("Add Item")}
                        </Button>
                      </div>
                    </div>
                  )}
                  {items.length > 0 && (
                    <div className="table-responsive table-card mt-3 mb-0" style={{ overflowX: "auto" }}>
                      <Table className="table table-bordered table-hover table-sm align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ minWidth: 70 }}>{t("Action")}</th>
                            {ITEM_COLUMNS.map((col) => <th key={col.key} className={col.align === "end" ? "text-end" : ""} style={{ whiteSpace: "nowrap" }}>{t(col.label)}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((r, idx) => (
                            <tr key={`${r.lotNo}-${idx}`}>
                              <td>
                                {!readOnly ? (
                                  <div className="d-flex gap-1">
                                    <button type="button" className="btn btn-soft-primary btn-sm p-1" onClick={() => handleEditRow(idx)}><i className="ri-pencil-line" /></button>
                                    <button type="button" className="btn btn-soft-danger btn-sm p-1" onClick={() => handleDeleteRow(idx)}><i className="ri-delete-bin-line" /></button>
                                  </div>
                                ) : <span className="text-muted">-</span>}
                              </td>
                              {ITEM_COLUMNS.map((col) => <td key={col.key} className={col.align === "end" ? "text-end" : ""} style={{ whiteSpace: "nowrap" }}>{renderItemCell(r, col)}</td>)}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-light fw-semibold">
                          <tr>
                            <td colSpan={3}>{t("Total")}</td>
                            {ITEM_COLUMNS.slice(2).map((col) => <td key={col.key} className={col.align === "end" ? "text-end" : ""}>{col.footer ? getItemFooterValue(col.footer, totals, items) : ""}</td>)}
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
            <Col xs={12} lg={3}>
              <Card className="shadow-sm border-0 rounded-3 mb-3">
                <CardHeader className="bg-transparent border-bottom"><h6 className="mb-0 fw-semibold">{t("Summary")}</h6></CardHeader>
                <CardBody className="pt-2 pb-3 pe-3">
                  <fieldset disabled={readOnly} className="border-0 m-0 p-0" style={{ minWidth: 0 }}>
                    <FormGroup className="mb-2"><Label className="form-label mb-1">{t("+/- Amount")}</Label><Input type="number" className="form-control-sm" style={fieldH} value={header.plusMinusAmount} onChange={(e) => setHeaderField("plusMinusAmount", e.target.value)} /></FormGroup>
                    <div className="d-flex justify-content-between mb-2"><span className="text-muted">{t("Net Amount")}</span><strong>{summary.netAmount}</strong></div>
                    <div className="d-flex justify-content-between mb-2"><span className="text-muted">{t("M. Currency Net Amount")}</span><strong>{summary.netMAmount}</strong></div>
                    <Row className="g-1 mb-2">
                      <Col xs={6}><Label className="form-label mb-1 small">CGST%</Label><Input type="number" className="form-control-sm" style={fieldH} value={header.cgstPer} onChange={(e) => setHeaderField("cgstPer", e.target.value)} /></Col>
                      <Col xs={6}><Label className="form-label mb-1 small">{t("Amt")}</Label><Input className="form-control-sm custom-readonly-input" style={fieldH} value={fmt(summary.cgstAmt)} readOnly /></Col>
                      <Col xs={6}><Label className="form-label mb-1 small">SGST%</Label><Input type="number" className="form-control-sm" style={fieldH} value={header.sgstPer} onChange={(e) => setHeaderField("sgstPer", e.target.value)} /></Col>
                      <Col xs={6}><Label className="form-label mb-1 small">{t("Amt")}</Label><Input className="form-control-sm custom-readonly-input" style={fieldH} value={fmt(summary.sgstAmt)} readOnly /></Col>
                      <Col xs={6}><Label className="form-label mb-1 small">IGST%</Label><Input type="number" className="form-control-sm" style={fieldH} value={header.igstPer} onChange={(e) => setHeaderField("igstPer", e.target.value)} /></Col>
                      <Col xs={6}><Label className="form-label mb-1 small">{t("Amt")}</Label><Input className="form-control-sm custom-readonly-input" style={fieldH} value={fmt(summary.igstAmt)} readOnly /></Col>
                    </Row>
                    <hr className="mb-2" />
                    <div className="d-flex justify-content-between mb-1 gap-2"><span className="text-primary fw-semibold small">{masterSymbol} FINAL AMOUNT</span><strong className="text-end">{summary.finalMAmount}</strong></div>
                    <div className="d-flex justify-content-between mb-1 gap-2"><span className="text-primary fw-semibold small">{stockSymbol} FINAL AMOUNT</span><strong className="text-end">{summary.finalSAmount}</strong></div>
                    <div className="d-flex justify-content-between gap-2"><span className="text-primary fw-semibold small">{t("TRANSACTION FINAL AMOUNT")}</span><strong className="text-end">{summary.finalMPayRecAmount}</strong></div>
                  </fieldset>
                </CardBody>
              </Card>
              {!readOnly && (
                <Card className="shadow-sm border-0 rounded-3">
                  <CardHeader className="bg-transparent border-bottom"><h6 className="mb-0 fw-semibold">{t("Avg Back / Rate")}</h6></CardHeader>
                  <CardBody>
                    <Row className="g-2 mb-2">
                      <Col xs={6}><Label className="form-label mb-1 text-danger">{t("Avg Back%")}</Label><Input className="form-control-sm" value={refreshBack} onChange={(e) => setRefreshBack(e.target.value)} /></Col>
                      <Col xs={6}><Label className="form-label mb-1 text-danger">{t("Avg Rate")}</Label><Input className="form-control-sm" value={refreshRate} onChange={(e) => setRefreshRate(e.target.value)} /></Col>
                    </Row>
                    <Button color="outline-primary" size="sm" className="w-100" onClick={handleRefreshBack}>{t("Refresh Avg Back/Rate")}</Button>
                  </CardBody>
                </Card>
              )}
            </Col>
          </Row>
        </Container>

        <Modal isOpen={saleModalOpen} toggle={() => setSaleModalOpen(false)} size="xl" centered fullscreen="sm">
          <ModalHeader toggle={() => setSaleModalOpen(false)}>{t("Sale To SaleReturn")}</ModalHeader>
          <ModalBody className="p-2 p-md-3">
            <div className="table-responsive" style={{ maxHeight: "calc(100vh - 220px)", overflow: "auto" }}>
              <Table className="table table-bordered table-sm align-middle mb-0 text-nowrap" style={{ fontSize: "11px" }}>
                <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                  <tr>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>
                      <Input type="checkbox" checked={saleRows.length > 0 && saleRows.every((r) => r.selected)} onChange={(e) => toggleSelectAllSale(e.target.checked)} />
                    </th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("date", t("Date"))}</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("invNo", t("Invoice No"))}</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("lotNo", t("LotNo"))}</th>
                    <th className="text-end" style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("cts", t("Cts"))}</th>
                    <th className="text-end" style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("rtn", t("Rtn"))}</th>
                    <th className="text-end" style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("rate", t("Rate"))}</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("symbol", t("Cur"))}</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("memoTransCode", t("MemoTrnCode"))}</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f3f3f5" }}>{renderSortHeader("itemName", t("ItemName"))}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSaleRows.map((r) => (
                    <tr key={r.key}>
                      <td><Input type="checkbox" checked={!!r.selected} onChange={(e) => { const checked = e.target.checked; setSaleRows((prev) => prev.map((x) => (x.key === r.key ? { ...x, selected: checked } : x))); }} /></td>
                      <td>{r.date}</td>
                      <td>{r.invNo}</td>
                      <td>{r.lotNo}</td>
                      <td>
                        <Input type="number" className="form-control-sm" style={{ height: 28, width: "65px", padding: "1px 5px", fontSize: "11px" }} value={r.cts} onChange={(e) => {
                          const cts = toNum(e.target.value);
                          setSaleRows((prev) => prev.map((x) => (x.key === r.key ? { ...x, cts, rtn: Math.min(toNum(x.rtn), cts) } : x)));
                        }} />
                      </td>
                      <td>
                        <Input type="number" className="form-control-sm" style={{ height: 28, width: "65px", padding: "1px 5px", fontSize: "11px" }} value={r.rtn} onChange={(e) => {
                          const rtn = toNum(e.target.value);
                          if (rtn > toNum(r.cts)) {
                            toast.warning(t("Return cts should not be greater than TotalCts"));
                            setSaleRows((prev) => prev.map((x) => (x.key === r.key ? { ...x, rtn: 0 } : x)));
                            return;
                          }
                          setSaleRows((prev) => prev.map((x) => (x.key === r.key ? { ...x, rtn } : x)));
                        }} />
                      </td>
                      <td>
                        <Input type="number" className="form-control-sm" style={{ height: 28, width: "70px", padding: "1px 5px", fontSize: "11px" }} value={r.rate} onChange={(e) => {
                          const rate = toNum(e.target.value);
                          setSaleRows((prev) => prev.map((x) => (x.key === r.key ? { ...x, rate, back: toNum(x.mrp) !== 0 ? parseFloat((((rate * 100) / toNum(x.mrp)) - 100).toFixed(2)) : 0 } : x)));
                        }} />
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
            <Button color="light" onClick={() => setSaleModalOpen(false)}>{t("Close")}</Button>
            <Button color="primary" onClick={saleToSaleReturn}>{t("Sale To SaleReturn")}</Button>
          </ModalFooter>
        </Modal>

        <WarningModal open={warningModal.open} title={t("Warning!")} message={warningModal.message} confirmText={t("OK")} onClose={closeWarning} />
        <ToastContainer autoClose={2000} />
        <style>{`
          .sale-view-memo-btn {
            min-height: 31px;
            height: auto;
            white-space: nowrap;
            line-height: 1.2;
            padding: 4px 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .sale-add-item-btn {
            min-height: 31px;
            height: auto;
            white-space: nowrap;
            line-height: 1.2;
            padding: 4px 10px;
          }
          @media (max-width: 575.98px) {
            .sale-view-memo-btn,
            .sale-add-item-btn {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </React.Fragment>
  );
};

export default SolitaireSaleReturnForm;
