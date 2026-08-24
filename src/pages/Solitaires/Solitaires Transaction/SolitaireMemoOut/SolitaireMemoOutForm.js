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
  Row,
  Table
} from "reactstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import {
  addSolitaireMemoOut,
  editSolitaireMemoOut,
  getAccGrpMasters,
  getCurrencyRates,
  getSolitaireLots,
  getSolitaireMemoOutDetail,
  getSolitaireMemoOutItemFromList,
  getSolitaireMemoOutLotDetail,
  getSolitaireMemoOutPageData,
  getSolitaireMemoOutShipVia,
  refreshSolitaireMemoOutBack
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
  returnCarats: ""
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
  returnCarats: getNumVal(r, "ReturnCarats")
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
    Status: r.status || "",
    SpCarats: toNum(r.spCarats),
    ReturnCarats: toNum(r.returnCarats)
  }));

const getRowStatusStyle = (status) => {
  const s = String(status || "").trim();
  if (s === "Return") return { color: "red" };
  if (s === "Sold") return { color: "purple" };
  if (s === "Sold+Return") return { color: "green" };
  return {};
};

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
  { key: "status", label: "Status" },
  { key: "spCarats", label: "SpCarats", align: "end", decimals: 3 },
  { key: "returnCarats", label: "ReturnCarats", align: "end", decimals: 3 }
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

const WarningModal = ({ open, title, message, confirmText, onClose }) => {
  return (
    <Modal isOpen={open} toggle={onClose} centered={true} contentClassName="border-0 shadow-lg" style={{ maxWidth: "400px" }}>
      <ModalBody className="py-4 px-5 text-center">
        <div className="mt-2">
          <div className="d-flex justify-content-center align-items-center mb-4">
            <div
              className="d-flex justify-content-center align-items-center"
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                border: "4px solid #f27474",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 10L30 30"
                  stroke="#f27474"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M30 10L10 30"
                  stroke="#f27474"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <h3 className="mb-2 fw-semibold" style={{ color: "#495057", fontSize: "24px" }}>
            {title || "Warning!"}
          </h3>
          <p className="text-muted mb-4 fs-14" style={{ lineHeight: "1.6" }}>
            {message}
          </p>
          <div className="d-flex justify-content-center">
            <button
              type="button"
              className="btn px-4 py-2 fw-semibold text-white"
              style={{
                backgroundColor: "#13d17c",
                borderColor: "#13d17c",
                fontSize: "15px",
                borderRadius: "5px",
                minWidth: "90px",
              }}
              onClick={onClose}
            >
              {confirmText || "OK"}
            </button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

const SolitaireMemoOutForm = ({ mode = "add" }) => {
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

  const [shipViaInput, setShipViaInput] = useState("");
  const [shipViaOpts, setShipViaOpts] = useState([]);
  const [shipViaLoading, setShipViaLoading] = useState(false);
  const [shipVia, setShipVia] = useState(null);

  const [brokerInput, setBrokerInput] = useState("");
  const [brokerOpts, setBrokerOpts] = useState([]);
  const [brokerLoading, setBrokerLoading] = useState(false);
  const [broker, setBroker] = useState(null);

  const [lotInput, setLotInput] = useState("");
  const [lotOpts, setLotOpts] = useState([]);
  const [lotLoading, setLotLoading] = useState(false);
  const [lotSel, setLotSel] = useState(null);

  const [mOp, setMOp] = useState("*");
  const [editIndex, setEditIndex] = useState(-1);
  const [items, setItems] = useState([]);
  const [entry, setEntry] = useState(emptyItem());
  const [bulkLotNos, setBulkLotNos] = useState("");
  const [refreshBack, setRefreshBack] = useState("");
  const [refreshRate, setRefreshRate] = useState("");
  const [warningModal, setWarningModal] = useState({ open: false, message: "" });
  const showWarning = useCallback((message) => setWarningModal({ open: true, message }), []);
  const closeWarning = useCallback(() => setWarningModal({ open: false, message: "" }), []);

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
    roundDate: todayIso(),
    tracking: "",
    salesPerson: ""
  });

  const fieldH = { height: 31 };

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
    const tmr = setTimeout(() => searchAccounts(brokerInput, setBrokerOpts, setBrokerLoading), 400);
    return () => clearTimeout(tmr);
  }, [brokerInput, searchAccounts]);

  useEffect(() => {
    if (!shipViaInput || shipViaInput.trim().length < 2) {
      setShipViaOpts([]);
      return;
    }
    const tmr = setTimeout(async () => {
      setShipViaLoading(true);
      try {
        const res = await getSolitaireMemoOutShipVia(shipViaInput);
        const raw = res?.Data || res?.data || [];
        setShipViaOpts(
          (Array.isArray(raw) ? raw : []).map((item) => ({
            value: String(item.text || item.id || ""),
            label: String(item.text || item.id || "")
          }))
        );
      } catch {
        /* ignore */
      } finally {
        setShipViaLoading(false);
      }
    }, 400);
    return () => clearTimeout(tmr);
  }, [shipViaInput]);

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
        setMOp(getVal(res, "MasterCurrencyOperator", "masterCurrencyOperator") || "*");
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
    const res = await getSolitaireMemoOutPageData();
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
    const res = await getSolitaireMemoOutDetail(editId);
    if (!(res?.success || res?.Success)) {
      toast.error(res?.Data || res?.data || t("Memo Out not found."));
      return;
    }
    const data = res.Data || res.data || {};
    const h = data.Header || data.header || {};
    const rows = data.Items || data.items || [];

    setParty(
      getVal(h, "PartyCode")
        ? { value: String(getVal(h, "PartyCode")), label: getVal(h, "PartyName") || String(getVal(h, "PartyCode")) }
        : null
    );
    setBroker(
      getVal(h, "BrokerCode")
        ? { value: String(getVal(h, "BrokerCode")), label: getVal(h, "BrokerName") || String(getVal(h, "BrokerCode")) }
        : null
    );

    const shipViaText = getVal(h, "ShipVia");
    setShipVia(shipViaText ? { value: shipViaText, label: shipViaText } : null);

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
      roundDate: toLocalDateStr(getVal(h, "RoundDate")) || todayIso(),
      tracking: getVal(h, "Tracking"),
      salesPerson: getVal(h, "SalesPerson")
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
        const defaultCur = page.defaultCurrencyCode
          ? page.curs.find((c) => String(c.value) === String(page.defaultCurrencyCode))
          : null;
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
      const res = await getSolitaireMemoOutLotDetail({
        lotNo,
        curCode: toNum(header.curCode),
        sBaseRate: toNum(header.sBaseRate, 1)
      });
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

      if (weight <= 0) {
        showWarning(t("Not enough stock in hand to make sale or memo."));
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
          less3: prev.less3 === "" || prev.less3 == null ? "0" : prev.less3
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

  const handleGetItemFromList = async () => {
    if (!bulkLotNos.trim()) {
      toast.warning(t("Please enter lot number(s)."));
      return;
    }
    try {
      const payload = {
        lotNo: bulkLotNos,
        less1: toNum(entry.less1),
        less2: toNum(entry.less2),
        less3: toNum(entry.less3),
        curCode: toNum(header.curCode),
        sBaseRate: toNum(header.sBaseRate, 1)
      };
      const res = await getSolitaireMemoOutItemFromList(payload);
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

  const handleRefreshBack = async () => {
    if (!items.length) return toast.warning(t("Please add at least one item."));
    if (toNum(refreshBack) === 0 && toNum(refreshRate) === 0) {
      return toast.warning(t("Enter AvgBack Or rate"));
    }
    try {
      const payload = {
        refreshback: toNum(refreshBack),
        refreshrate: toNum(refreshRate),
        AvgBack: totals.avgBack,
        AvgRate: totals.avgRate,
        Items: mapItemsForApi(items)
      };
      const res = await refreshSolitaireMemoOutBack(payload);
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

  const summary = useMemo(() => {
    const netAmount = totals.totAmount;
    const baseRate = toNum(header.baseRate, 1) || 1;
    const plusMinus = toNum(header.plusMinusAmount);
    const taxableAmount = netAmount + plusMinus;
    const mCurAmount = mOp === "/" ? taxableAmount / baseRate : taxableAmount * baseRate;
    const finalMAmount = mCurAmount;

    return {
      taxableAmount,
      netAmount: fmt(taxableAmount),
      netMAmount: fmt(mCurAmount),
      finalMAmount: fmt(finalMAmount)
    };
  }, [totals.totAmount, header.baseRate, header.plusMinusAmount, mOp]);

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
        BrokerCode: broker?.value ? toNum(broker.value) : null,
        BrokerName: broker?.label || "",
        InvDisc: header.description,
        Description: header.description,
        TotCts: totals.totCts,
        TotAmount: totals.totAmount,
        PlusMinusAmount: toNum(header.plusMinusAmount),
        NetAmount: summary.taxableAmount,
        NetMAmount: toNum(summary.netMAmount),
        RoundAmount: 0,
        FinalMAmount: toNum(summary.finalMAmount),
        FinalMPayRecAmount: summary.taxableAmount,
        ShipVia: shipVia?.label || shipVia?.value || "",
        Tracking: header.tracking,
        SalesPerson: header.salesPerson,
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
      const res = isEdit ? await editSolitaireMemoOut(payload) : await addSolitaireMemoOut(payload);
      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || t("Saved successfully."));
        navigate("/memo/memo-list", {
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

  const handlePrintMemo = () => {
    if (!header.invNo) {
      toast.warning(t("Invoice number is required."));
      return;
    }
    navigate(`/memo/printinvview?InvNo=${encodeURIComponent(header.invNo)}`);
  };

  const title = isView ? t("View Memo Out") : isEdit ? t("Edit Memo Out") : t("Add Memo Out");
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
          <BreadCrumb title={title} pageTitle={t("Memo & Consignment")} />

          <Row className="align-items-start g-3 mb-3">
            <Col xs={12}>
              <Card className="shadow-sm border-0 rounded-3 mb-0">
                <CardHeader className="bg-transparent border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                    <i className="ri-file-list-3-line fs-20" />
                    {title}
                  </h5>
                  <div className="d-flex gap-2 flex-wrap">
                    <Link to="/memo/memo-list" className="btn btn-soft-secondary btn-sm">
                      {t("Back")}
                    </Link>
                    {isEdit && (
                      <>
                        <Link to="/memo/add-memo" className="btn btn-primary btn-sm" target="_blank">
                          {t("Create Memo")}
                        </Link>
                        <Button color="primary" size="sm" onClick={handlePrintMemo}>
                          {t("Print Memo")}
                        </Button>
                      </>
                    )}
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
                          <Input type="date" className="form-control-sm" style={fieldH} value={header.trnDate} onChange={(e) => setHeaderField("trnDate", e.target.value)} readOnly={readOnly} />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Invoice Number")}</Label>
                          <Input className="form-control-sm custom-readonly-input" style={fieldH} value={header.invNo} readOnly={true} onChange={(e) => setHeaderField("invNo", e.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Bill No")}</Label>
                          <Input className="form-control-sm" style={fieldH} value={header.billNo} onChange={(e) => setHeaderField("billNo", e.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Type")}</Label>
                          <Select styles={customStyles} options={typeOpts} value={typeOpts.find((o) => String(o.value) === String(header.invType)) || null} onChange={(o) => setHeaderField("invType", o?.value || "")} placeholder={t("Type")} isDisabled={readOnly} />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("SubType")}</Label>
                          <Select styles={customStyles} options={subTypeOpts} value={subTypeOpts.find((o) => String(o.value) === String(header.subType)) || null} onChange={(o) => setHeaderField("subType", o?.value || "")} placeholder={t("SubType")} isDisabled={readOnly} />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Category")}</Label>
                          <Select styles={customStyles} options={categoryOpts} value={categoryOpts.find((o) => String(o.value) === String(header.category)) || null} onChange={(o) => setHeaderField("category", o?.value || "")} placeholder={t("Category")} isClearable isDisabled={readOnly} />
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
                          <Select styles={customStyles} options={partyOpts} value={party} onChange={setParty} onInputChange={(v, meta) => { if (meta.action === "input-change") setPartyInput(v); else if (meta.action === "input-blur" || meta.action === "menu-close") { setPartyInput(""); setPartyOpts([]); } }} isLoading={partyLoading} placeholder={t("Search Party...")} isClearable isDisabled={readOnly} />
                        </FormGroup>
                      </Col>
                      <Col md={1} sm={3}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Due Days")}</Label>
                          <Input type="number" className="form-control-sm" style={fieldH} value={header.dueDays} onChange={(e) => setHeaderField("dueDays", e.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={3}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Due Date")}</Label>
                          <Input type="date" className="form-control-sm custom-readonly-input" style={fieldH} value={header.dueDate} readOnly={true} onChange={(e) => setHeaderField("dueDate", e.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Currency")}</Label>
                          <Select styles={customStyles} options={currencyOpts} value={currencyOpts.find((o) => o.value === String(header.curCode)) || null} onChange={async (o) => { const code = o?.value || ""; setHeaderField("curCode", code); await applyCurrencyRates(code); }} placeholder={t("Currency")} isDisabled={readOnly} />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{masterSymbol} Rate</Label>
                          <Input type="number" className="form-control-sm" style={fieldH} value={header.baseRate} onChange={(e) => setHeaderField("baseRate", e.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md={2} sm={4}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{stockSymbol} Rate</Label>
                          <Input type="number" className="form-control-sm" style={fieldH} value={header.sBaseRate} onChange={(e) => setHeaderField("sBaseRate", e.target.value)} />
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
                      <Col md={3} sm={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("ShipVia")}</Label>
                          <CreatableSelect
                            styles={customStyles}
                            options={shipViaOpts}
                            value={shipVia}
                            onChange={setShipVia}
                            onInputChange={(v, meta) => {
                              if (meta.action === "input-change") setShipViaInput(v);
                              else if (meta.action === "input-blur" || meta.action === "menu-close") {
                                setShipViaInput("");
                                setShipViaOpts([]);
                              }
                            }}
                            isLoading={shipViaLoading}
                            placeholder={t("Search ShipVia...")}
                            isClearable
                            isDisabled={readOnly}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={3} sm={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("Tracking No")}</Label>
                          <Input className="form-control-sm" style={fieldH} value={header.tracking} onChange={(e) => setHeaderField("tracking", e.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md={3} sm={6}>
                        <FormGroup className="mb-2">
                          <Label className="form-label mb-1">{t("SalesPerson")}</Label>
                          <Input className="form-control-sm" style={fieldH} value={header.salesPerson} onChange={(e) => setHeaderField("salesPerson", e.target.value)} />
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
                <CardHeader className="bg-transparent border-bottom">
                  <h6 className="mb-0 fw-semibold">{t("Item Entry")}</h6>
                </CardHeader>
                <CardBody>
                  {!readOnly && (
                    <Row className="g-2 align-items-end">
                      <Col xs={12} sm={6} md={2}>
                        <Label className="form-label mb-1">{t("Lot Number")}</Label>
                        <CreatableSelect
                          styles={customStyles}
                          options={lotOpts}
                          value={lotSel}
                          onChange={(o) => {
                            setLotSel(o);
                            onEntryChange("lotNo", o?.value || "");
                            if (o?.value) fillFromLot(o.value);
                          }}
                          onInputChange={(v, meta) => { if (meta.action === "input-change") setLotInput(v); else if (meta.action === "input-blur" || meta.action === "menu-close") { setLotInput(""); setLotOpts([]); } }}
                          isLoading={lotLoading}
                          placeholder={t("Lot...")}
                          isClearable
                        />
                      </Col>
                      <Col xs={12} sm={6} md={2}>
                        <Label className="form-label mb-1">{t("Item Name")}</Label>
                        <Input className="form-control-sm" style={fieldH} value={entry.itemName} onChange={(e) => onEntryChange("itemName", e.target.value)} />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("Weight")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.weight} onChange={(e) => onEntryChange("weight", e.target.value)} />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("Pcs")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.pcs} onChange={(e) => onEntryChange("pcs", e.target.value)} />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("MRP")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.mrp} onChange={(e) => onEntryChange("mrp", e.target.value)} />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("Back")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.back} onChange={(e) => onEntryChange("back", e.target.value)} />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("Rate")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.rate} onChange={(e) => onEntryChange("rate", e.target.value)} />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("Less1")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.less1} onChange={(e) => onEntryChange("less1", e.target.value)} />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("Less2")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.less2} onChange={(e) => onEntryChange("less2", e.target.value)} />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
                        <Label className="form-label mb-1">{t("Less3")}</Label>
                        <Input type="number" className="form-control-sm" style={fieldH} value={entry.less3} onChange={(e) => onEntryChange("less3", e.target.value)} />
                      </Col>
                      <Col xs={6} sm={4} md={1}>
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
                            <tr key={`${r.lotNo}-${idx}`} style={getRowStatusStyle(r.status)}>
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
                                  {renderItemCell(r, col)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-light fw-semibold">
                          <tr>
                            <td colSpan={3}>{t("Total")}</td>
                            {ITEM_COLUMNS.slice(2).map((col) => (
                              <td key={col.key} className={col.align === "end" ? "text-end" : ""}>
                                {col.footer ? getItemFooterValue(col.footer, totals, items) : ""}
                              </td>
                            ))}
                          </tr>
                        </tfoot>
                      </Table>
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
                      <Input type="number" className="form-control-sm" style={fieldH} value={header.plusMinusAmount} onChange={(e) => setHeaderField("plusMinusAmount", e.target.value)} />
                    </FormGroup>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">{t("Net Amount")}</span>
                      <strong>{summary.netAmount}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">{t("M.Cur Net Amount")}</span>
                      <strong>{summary.netMAmount}</strong>
                    </div>
                    <hr className="mb-2" />
                    <div className="d-flex justify-content-between mb-2 gap-2">
                      <span className="text-primary fw-semibold small">{masterSymbol} {t("Final Amount")}</span>
                      <strong className="text-end text-primary">{summary.finalMAmount}</strong>
                    </div>
                    <FormGroup className="mb-0">
                      <Label className="form-label mb-1">{t("Description")}</Label>
                      <Input className="form-control-sm" style={fieldH} value={header.description} onChange={(e) => setHeaderField("description", e.target.value)} />
                    </FormGroup>
                  </fieldset>
                </CardBody>
              </Card>

              {!readOnly && (
                <Card className="shadow-sm border-0 rounded-3">
                  <CardHeader className="bg-transparent border-bottom">
                    <h6 className="mb-0 fw-semibold text-uppercase">{t("Enter Lot No")}</h6>
                  </CardHeader>
                  <CardBody>
                    <FormGroup className="mb-2">
                      <Input type="textarea" rows={4} placeholder={t("Add by lot no")} value={bulkLotNos} onChange={(e) => setBulkLotNos(e.target.value)} />
                    </FormGroup>
                    <Button color="primary" size="sm" className="w-100 mb-3" onClick={handleGetItemFromList}>
                      {t("Get Item From List")}
                    </Button>
                    <FormGroup className="mb-2">
                      <Label className="form-label mb-1">{t("Print Inv Date")}</Label>
                      <Input type="date" className="form-control-sm" style={fieldH} value={header.roundDate} onChange={(e) => setHeaderField("roundDate", e.target.value)} />
                    </FormGroup>
                    <Row className="g-2 mb-2">
                      <Col xs={6}>
                        <Label className="form-label mb-1 text-danger">{t("Avg Back%")}</Label>
                        <Input className="form-control-sm" value={refreshBack} onChange={(e) => setRefreshBack(e.target.value)} />
                      </Col>
                      <Col xs={6}>
                        <Label className="form-label mb-1 text-danger">{t("Avg Rate")}</Label>
                        <Input className="form-control-sm" value={refreshRate} onChange={(e) => setRefreshRate(e.target.value)} />
                      </Col>
                    </Row>
                    <Button color="outline-primary" size="sm" className="w-100" onClick={handleRefreshBack}>
                      {t("Refresh Avg Back/Rate")}
                    </Button>
                  </CardBody>
                </Card>
              )}
            </Col>
          </Row>
        </Container>
        <WarningModal
          open={warningModal.open}
          title={t("Warning!")}
          message={warningModal.message}
          confirmText={t("OK")}
          onClose={closeWarning}
        />
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default SolitaireMemoOutForm;
