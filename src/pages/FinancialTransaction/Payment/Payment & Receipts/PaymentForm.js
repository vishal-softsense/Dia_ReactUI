import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../../helpers/excel_helper";
import {
  addPayment,
  deletePaymentJv,
  editPaymentJv,
  getAccGrpMasters,
  getCurrencyRates,
  getPaymentJvEntries,
  getPaymentPageData,
  getPaymentPendingInv
} from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  REPORT_COMPANY_SETTINGS_EVENT
} from "../../../../helpers/reportCompanyDefaults";

const getVal = (row, ...keys) => {
  if (!row) return "";
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    if (row[camel] !== undefined && row[camel] !== null && row[camel] !== "") return row[camel];
    if (row[pascal] !== undefined && row[pascal] !== null && row[pascal] !== "") return row[pascal];
  }
  return "";
};

const toNum = (v, d = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : d;
};

const todayIso = () => new Date().toISOString().substr(0, 10);

const fmtDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const fmtNum = (value, decimals = 2) => {
  const n = Number(value);
  if (Number.isNaN(n)) return (0).toFixed(decimals);
  return n.toFixed(decimals);
};

const customStringFilterFn = (row, columnId, filterValue) => {
  const val = row.getValue(columnId);
  if (val == null) return false;
  return String(val).toLowerCase().includes(String(filterValue).toLowerCase());
};

const fieldH = { height: 31 };

const selectStyles = {
  control: (p, s) => ({
    ...p,
    backgroundColor: s.isDisabled
      ? "var(--vz-input-disabled-bg, var(--vz-secondary-bg, #eff2f7))"
      : "var(--vz-secondary-bg, #fff)",
    borderColor: "var(--vz-border-color, #ced4da)",
    color: s.isDisabled ? "var(--vz-secondary-color, #878a99)" : "var(--vz-body-color, #495057)",
    minHeight: "31px",
    height: "31px",
    opacity: s.isDisabled ? 0.85 : 1
  }),
  valueContainer: (p) => ({ ...p, padding: "0 8px", height: "31px" }),
  indicatorsContainer: (p) => ({ ...p, height: "31px" }),
  input: (p) => ({ ...p, margin: 0, padding: 0, color: "var(--vz-body-color, #495057)" }),
  menu: (p) => ({
    ...p,
    backgroundColor: "var(--vz-secondary-bg, #fff)",
    color: "var(--vz-body-color, #495057)",
    border: "1px solid var(--vz-border-color, #dee2e6)",
    zIndex: 30
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
    color: s.isDisabled ? "var(--vz-secondary-color, #878a99)" : "var(--vz-body-color, #495057)"
  })
};

const mapCurrency = (list = []) =>
  (list || []).map((x) => ({
    value: String(getVal(x, "ID", "Id", "id") || ""),
    label: getVal(x, "Name", "TextName", "textName") || String(getVal(x, "ID"))
  }));

const PaymentForm = ({ mode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEditRoute = mode === "edit";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currencyOpts, setCurrencyOpts] = useState([]);
  const [masterSymbol, setMasterSymbol] = useState("INR");
  const [stockSymbol, setStockSymbol] = useState("USD");
  const [mOp, setMOp] = useState("*");
  const [sOp, setSOp] = useState("*");

  const [mainAcc, setMainAcc] = useState(null);
  const [partyAcc, setPartyAcc] = useState(null);
  const [mainInput, setMainInput] = useState("");
  const [partyInput, setPartyInput] = useState("");
  const [mainOpts, setMainOpts] = useState([]);
  const [partyOpts, setPartyOpts] = useState([]);
  const [mainLoading, setMainLoading] = useState(false);
  const [partyLoading, setPartyLoading] = useState(false);

  const [form, setForm] = useState({
    gcode: "",
    transDate: todayIso(),
    rec: "0.00",
    paid: "0.00",
    currency: "",
    mBaseRate: "0.00",
    sBaseRate: "0.00",
    desc: "",
    autoAdjust: false,
    payType: "Payment"
  });

  const [locked, setLocked] = useState(false);
  const [jvEditMode, setJvEditMode] = useState(false);
  const [gridMode, setGridMode] = useState(null); // Invoice | Adat | Brokerage | null
  const [pendingRows, setPendingRows] = useState([]);
  const [jvRows, setJvRows] = useState([]);
  const [jvLoading, setJvLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

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
    const tmr = setTimeout(() => searchAccounts(mainInput, setMainOpts, setMainLoading), 400);
    return () => clearTimeout(tmr);
  }, [mainInput, searchAccounts]);

  useEffect(() => {
    const tmr = setTimeout(() => searchAccounts(partyInput, setPartyOpts, setPartyLoading), 400);
    return () => clearTimeout(tmr);
  }, [partyInput, searchAccounts]);

  const applyCurrencyRates = async (curCode) => {
    if (!curCode) return;
    try {
      const res = await getCurrencyRates(curCode);
      if (res?.success || res?.Success) {
        setMOp(getVal(res, "MasterCurrencyOperator", "masterCurrencyOperator") || "*");
        setSOp(getVal(res, "StockCurrencyOperator", "stockCurrencyOperator") || "*");
        setForm((prev) => ({
          ...prev,
          mBaseRate: fmtNum(toNum(res.baseRate ?? res.BaseRate, toNum(prev.mBaseRate))),
          sBaseRate: fmtNum(toNum(res.sBaseRate ?? res.SBaseRate, toNum(prev.sBaseRate) || 1))
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadJvList = useCallback(async (date) => {
    setJvLoading(true);
    try {
      const res = await getPaymentJvEntries(date || form.transDate);
      if (res?.success || res?.Success) {
        setJvRows(res.Data || res.data || []);
      } else {
        toast.warning(res?.Data || res?.data || t("Failed to load JV entries."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load JV entries."));
    } finally {
      setJvLoading(false);
    }
  }, [form.transDate, t]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getPaymentPageData();
        if (!(res?.success || res?.Success)) {
          toast.error(res?.Data || res?.data || t("Failed to load page data."));
          return;
        }
        const data = res.Data || res.data || {};
        const currencies = mapCurrency(data.CurrencyList || data.currencyList || []);
        setCurrencyOpts(currencies);
        const defCode = String(data.DefaultCurrencyCode || data.defaultCurrencyCode || currencies[0]?.value || "");
        setForm((prev) => ({
          ...prev,
          currency: defCode,
          mBaseRate: fmtNum(data.MBaseRate ?? data.mBaseRate ?? 0),
          sBaseRate: fmtNum(data.SBaseRate ?? data.sBaseRate ?? 0)
        }));
        if (defCode) await applyCurrencyRates(defCode);
        await loadJvList(todayIso());
      } catch (err) {
        console.error(err);
        toast.error(t("Failed to load page data."));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading) loadJvList(form.transDate);
  }, [form.transDate]);

  const onRecChange = (val) => {
    const rec = toNum(val);
    setForm((prev) => ({
      ...prev,
      rec: val,
      paid: rec > 0 ? "0.00" : prev.paid
    }));
  };

  const onPaidChange = (val) => {
    const paid = toNum(val);
    setForm((prev) => ({
      ...prev,
      paid: val,
      rec: paid > 0 ? "0.00" : prev.rec
    }));
  };

  const showRecStar = toNum(form.rec) > 0 || toNum(form.paid) <= 0;
  const showPaidStar = toNum(form.paid) > 0 || toNum(form.rec) <= 0;

  const clearFormAmounts = () => {
    setForm((prev) => ({
      ...prev,
      gcode: "",
      rec: "0.00",
      paid: "0.00",
      desc: "",
      payType: "Payment"
    }));
    setPartyAcc(null);
    setJvEditMode(false);
    setLocked(false);
    setGridMode(null);
    setPendingRows([]);
  };

  const cancelJvEdit = () => {
    clearFormAmounts();
  };

  const togglePendingGrid = async (modeName) => {
    if (gridMode === modeName) {
      setGridMode(null);
      setPendingRows([]);
      setLocked(false);
      return;
    }

    if (!mainAcc?.value || !partyAcc?.value || (toNum(form.rec) <= 0 && toNum(form.paid) <= 0)) {
      Swal.fire({
        title: t("Warning"),
        text: t(
          "Please select Transaction Account, Main Account and enter a valid Amount before proceeding."
        ),
        icon: "error"
      });
      return;
    }

    const trnType = toNum(form.rec) > 0 ? "SALE" : "PUR";
    const payType = modeName === "Adat" ? "Adat" : modeName === "Brokerage" ? "Brokerage" : "Payment";
    setField("payType", payType);
    setLocked(true);
    setGridMode(modeName);

    try {
      const res = await getPaymentPendingInv({
        Party: partyAcc.value,
        TrnType: trnType,
        Currency: toNum(form.currency),
        Mode: modeName
      });
      if (res?.success || res?.Success) {
        const rows = (res.Data || res.data || []).map((r) => ({
          ...r,
          AdUSDAmount: 0,
          AdINRCurAmt: 0,
          PayINRRate: 0,
          RemUSDAmount: toNum(getVal(r, "RemUSDAmount", "remUSDAmount", "SCurAmt", "sCurAmt")),
          RemINRCurAmt: toNum(getVal(r, "RemINRCurAmt", "remINRCurAmt", "MCurAmt", "mCurAmt"))
        }));
        setPendingRows(rows);
      } else {
        toast.warning(res?.Data || res?.data || t("No pending invoices."));
        setPendingRows([]);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load pending invoices."));
      setGridMode(null);
      setLocked(false);
    }
  };

  const applyPendingRowValue = (idx, field, num) => {
    setPendingRows((prev) => {
      const next = [...prev];
      const row = { ...next[idx] };
      const sCur = toNum(getVal(row, "SCurAmt", "sCurAmt"));
      const mCur = toNum(getVal(row, "MCurAmt", "mCurAmt"));
      const base = toNum(form.mBaseRate) || 1;
      row.PayINRRate = base;

      if (field === "AdUSDAmount") {
        row.AdUSDAmount = num;
        row.AdINRCurAmt = Number((num * base).toFixed(2));
        row.RemUSDAmount = Number((sCur - num).toFixed(2));
        row.RemINRCurAmt = Number((mCur - row.AdINRCurAmt).toFixed(2));
      } else if (field === "AdINRCurAmt") {
        row.AdINRCurAmt = num;
        row.AdUSDAmount = base ? Number((num / base).toFixed(2)) : 0;
        row.RemINRCurAmt = Number((mCur - num).toFixed(2));
        row.RemUSDAmount = Number((sCur - row.AdUSDAmount).toFixed(2));
      } else {
        row[field] = num;
      }
      next[idx] = row;
      return next;
    });
  };

  /** MVC ValidateRowAmount: confirm when entered Adj > invoice amount */
  const updatePendingRow = (idx, field, value) => {
    const num = toNum(value);
    const row = pendingRows[idx];
    if (!row) return;

    const actual =
      field === "AdUSDAmount"
        ? toNum(getVal(row, "SCurAmt", "sCurAmt"))
        : field === "AdINRCurAmt"
          ? toNum(getVal(row, "MCurAmt", "mCurAmt"))
          : 0;

    if ((field === "AdUSDAmount" || field === "AdINRCurAmt") && num > actual + 0.0001) {
      Swal.fire({
        title: t("Confirmation"),
        text: t("Entered amount is greater than actual. Are you sure you want to continue?"),
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: t("Yes"),
        cancelButtonText: t("No"),
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) {
          applyPendingRowValue(idx, field, num);
        } else {
          applyPendingRowValue(idx, field, actual);
        }
      });
      return;
    }

    applyPendingRowValue(idx, field, num);
  };

  const autoFillRow = (idx, field) => {
    if (!form.autoAdjust) return;

    setPendingRows((prev) => {
      const row = prev[idx];
      if (!row) return prev;
      const currentVal = toNum(row[field]);
      if (currentVal > 0) return prev;

      const totalPayment = toNum(form.rec) > 0 ? toNum(form.rec) : toNum(form.paid);
      if (totalPayment <= 0) return prev;

      const isUsdField = field === "AdUSDAmount";
      const currentAdjusted = prev.reduce(
        (s, r) => s + toNum(isUsdField ? r.AdUSDAmount : r.AdINRCurAmt),
        0
      );
      const remaining = Number((totalPayment - currentAdjusted).toFixed(2));
      if (remaining <= 0) return prev;

      const invoiceMax = isUsdField
        ? toNum(getVal(row, "SCurAmt", "sCurAmt"))
        : toNum(getVal(row, "MCurAmt", "mCurAmt"));
      const fillAmt = Math.min(remaining, invoiceMax);
      if (fillAmt <= 0) return prev;

      const next = [...prev];
      const updated = { ...row };
      const sCur = toNum(getVal(updated, "SCurAmt", "sCurAmt"));
      const mCur = toNum(getVal(updated, "MCurAmt", "mCurAmt"));
      const base = toNum(form.mBaseRate) || 1;
      updated.PayINRRate = base;
      if (isUsdField) {
        updated.AdUSDAmount = fillAmt;
        updated.AdINRCurAmt = Number((fillAmt * base).toFixed(2));
        updated.RemUSDAmount = Number((sCur - fillAmt).toFixed(2));
        updated.RemINRCurAmt = Number((mCur - updated.AdINRCurAmt).toFixed(2));
      } else {
        updated.AdINRCurAmt = fillAmt;
        updated.AdUSDAmount = base ? Number((fillAmt / base).toFixed(2)) : 0;
        updated.RemINRCurAmt = Number((mCur - fillAmt).toFixed(2));
        updated.RemUSDAmount = Number((sCur - updated.AdUSDAmount).toFixed(2));
      }
      next[idx] = updated;
      return next;
    });
  };

  const buildSavePayload = (isJVMode) => ({
    GCODE: form.gcode || "",
    TransDate: form.transDate,
    mainacc: toNum(mainAcc?.value),
    trnacc: toNum(partyAcc?.value),
    Rec: toNum(form.rec),
    Paid: toNum(form.paid),
    CurCode: toNum(form.currency),
    BaseRate: toNum(form.mBaseRate),
    SRate: toNum(form.sBaseRate) || 1,
    Desc: form.desc || "",
    disc: form.desc || "",
    MOp: mOp || "*",
    SOp: sOp || "*",
    adjinramount: pendingRows.reduce((s, r) => s + toNum(r.AdINRCurAmt), 0),
    adjusdTotalAmt: pendingRows.reduce((s, r) => s + toNum(r.AdUSDAmount), 0),
    PayType: form.payType || "Payment",
    isJVMode,
    Lines: pendingRows
      .filter((r) => toNum(r.AdUSDAmount) > 0 || toNum(r.AdINRCurAmt) > 0)
      .map((r) => ({
        PDate: getVal(r, "Date", "date"),
        InvNo: getVal(r, "InvNo", "invNo"),
        InvCode: getVal(r, "InvCode", "invCode"),
        BaseRate: toNum(r.PayINRRate || form.mBaseRate),
        AdMCurAmt: toNum(r.AdINRCurAmt),
        AdSCurAmt: toNum(r.AdUSDAmount)
      }))
  });

  const doSavePayment = async (isJVMode) => {
    setSubmitting(true);
    try {
      const payload = buildSavePayload(isJVMode);
      const res = jvEditMode ? await editPaymentJv(payload) : await addPayment(payload);
      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || t("Payment saved successfully."));
        clearFormAmounts();
        await loadJvList(form.transDate);
      } else {
        toast.warning(res?.Data || res?.data || t("Save failed."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Save failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!mainAcc?.value || !partyAcc?.value) {
      toast.warning(t("Please select Main Account and Transaction Account."));
      return;
    }
    if (String(mainAcc.value) === String(partyAcc.value)) {
      await Swal.fire({
        title: t("Error"),
        text: t("Not Select Same Account."),
        icon: "error"
      });
      return;
    }
    if (toNum(form.rec) > 0 && toNum(form.paid) > 0) {
      await Swal.fire({
        title: t("Error"),
        text: t("Both Receive and Paid cannot be filled together"),
        icon: "error"
      });
      return;
    }
    if (toNum(form.rec) <= 0 && toNum(form.paid) <= 0) {
      await Swal.fire({
        title: t("Error"),
        text: t("Please enter a Receive or Paid amount"),
        icon: "error"
      });
      return;
    }

    const isJVMode = !gridMode;

    // MVC SavePayment: header vs entry validation only for On Invoice / Adat / Brokerage
    if (gridMode) {
      const currencyText = (
        currencyOpts.find((c) => String(c.value) === String(form.currency))?.label || ""
      ).toUpperCase();
      const totalAmount = Number(
        ((toNum(form.rec) > 0 ? toNum(form.rec) : toNum(form.paid))).toFixed(2)
      );
      const totalAdjusted = pendingRows.reduce((s, r) => s + toNum(r.AdUSDAmount), 0);
      const totalAdjustedM = pendingRows.reduce((s, r) => s + toNum(r.AdINRCurAmt), 0);
      const entryTotal = Number(
        (currencyText === "INR" ? totalAdjustedM : totalAdjusted).toFixed(2)
      );

      if (entryTotal > totalAmount) {
        await Swal.fire({
          title: t("Error"),
          text: t("Entry total cannot be greater than header amount"),
          icon: "error"
        });
        return;
      }

      if (entryTotal < totalAmount) {
        const result = await Swal.fire({
          title: t("Confirmation"),
          text: t("Total entry amount is less than header amount. Are you sure you want to save?"),
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: t("Yes"),
          cancelButtonText: t("No"),
          allowOutsideClick: false
        });
        if (!result.isConfirmed) return;
      }
    }

    await doSavePayment(isJVMode);
  };

  const startJvEdit = (row) => {
    const gcode = getVal(row, "GCODE", "gcode");
    const vtype = String(getVal(row, "Vtype", "vtype") || "").toUpperCase();
    const amount = toNum(getVal(row, "Amount", "amount"));
    const isPay = vtype === "JVPAY";

    const mainName = isPay ? getVal(row, "CAccount", "cAccount") : getVal(row, "DAccount", "dAccount");
    const partyName = isPay ? getVal(row, "DAccount", "dAccount") : getVal(row, "CAccount", "cAccount");
    const mainCode = String(getVal(row, "mainacc") || "");
    const partyCode = String(getVal(row, "trnacc") || "");

    // MVC GetPaymentDataForEdit swaps for JVPay
    const finalMain = isPay
      ? { value: String(getVal(row, "trnacc") || mainCode), label: mainName }
      : { value: mainCode, label: mainName };
    const finalParty = isPay
      ? { value: String(getVal(row, "mainacc") || partyCode), label: partyName }
      : { value: partyCode, label: partyName };

    setMainAcc(finalMain.value ? finalMain : null);
    setPartyAcc(finalParty.value ? finalParty : null);
    setForm((prev) => ({
      ...prev,
      gcode: String(gcode),
      transDate: (() => {
        const d = new Date(getVal(row, "Date", "date"));
        if (Number.isNaN(d.getTime())) return prev.transDate;
        return d.toISOString().substr(0, 10);
      })(),
      rec: vtype === "JVREC" ? fmtNum(amount) : "0.00",
      paid: vtype === "JVPAY" ? fmtNum(amount) : "0.00",
      currency: String(getVal(row, "CurCode", "curCode") || prev.currency),
      mBaseRate: fmtNum(getVal(row, "MasterCurrencyRate", "masterCurrencyRate") || prev.mBaseRate),
      sBaseRate: fmtNum(getVal(row, "StockCurrencyRate", "stockCurrencyRate") || prev.sBaseRate),
      desc: getVal(row, "disc", "Disc") || ""
    }));
    const cur = String(getVal(row, "CurCode", "curCode") || form.currency);
    if (cur) applyCurrencyRates(cur);
    setJvEditMode(true);
    setGridMode(null);
    setPendingRows([]);
    setLocked(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDeleteJv = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deletePaymentJv(deleteTarget.gcode);
      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || t("JV Entry Deleted Successfully."));
        loadJvList(form.transDate);
      } else {
        toast.warning(res?.Data || res?.data || t("Delete failed."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Delete failed."));
    } finally {
      setDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleExportJv = async () => {
    if (!jvRows.length) {
      toast.warning(t("No data available to export"));
      return;
    }
    const headers = [
      t("GCode"),
      t("TransDate"),
      t("Vtype"),
      t("MainAccount"),
      t("PartyAccount"),
      t("Amount"),
      t("Symbol"),
      `${masterSymbol} Amt`,
      `${stockSymbol} Amt`,
      t("Disc")
    ];
    const excelRows = jvRows.map((r) => [
      getVal(r, "GCODE", "gcode"),
      fmtDate(getVal(r, "Date", "date")),
      getVal(r, "Vtype", "vtype"),
      getVal(r, "DAccount", "dAccount"),
      getVal(r, "CAccount", "cAccount"),
      fmtNum(getVal(r, "Amount", "amount")),
      getVal(r, "Symbol", "symbol"),
      fmtNum(getVal(r, "MasterCurrencyAmount", "masterCurrencyAmount")),
      fmtNum(getVal(r, "StockCurrencyAmount", "stockCurrencyAmount")),
      getVal(r, "disc", "Disc")
    ]);
    const result = await exportToExcel(headers, excelRows, "JVPayment", "JVPayment");
    if (!result?.success) toast.error(t("Failed to generate Excel file."));
  };

  const jvColumns = useMemo(
    () => [
      {
        header: t("Action"),
        id: "actions",
        enableColumnFilter: false,
        cell: ({ row }) => {
          const gcode = getVal(row.original, "GCODE", "gcode");
          return (
            <div className="d-flex gap-1 justify-content-center">
              <button
                type="button"
                className="btn btn-soft-primary btn-sm p-1"
                title={t("Edit")}
                onClick={() => startJvEdit(row.original)}
              >
                <i className="ri-pencil-line" />
              </button>
              <button
                type="button"
                className="btn btn-soft-danger btn-sm p-1"
                title={t("Delete")}
                onClick={() => {
                  setDeleteTarget({ gcode });
                  setDeleteModal(true);
                }}
              >
                <i className="ri-delete-bin-line" />
              </button>
            </div>
          );
        }
      },
      {
        header: t("GCode"),
        accessorKey: "GCODE",
        accessorFn: (row) => getVal(row, "GCODE", "gcode"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("TransDate"),
        accessorKey: "Date",
        accessorFn: (row) => fmtDate(getVal(row, "Date", "date")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("Vtype"),
        accessorKey: "Vtype",
        accessorFn: (row) => getVal(row, "Vtype", "vtype"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("MainAccount"),
        accessorKey: "DAccount",
        accessorFn: (row) => getVal(row, "DAccount", "dAccount"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("PartyAccount"),
        accessorKey: "CAccount",
        accessorFn: (row) => getVal(row, "CAccount", "cAccount"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        accessorFn: (row) => fmtNum(getVal(row, "Amount", "amount")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        cell: ({ row }) => (
          <span className="text-end d-block">{fmtNum(getVal(row.original, "Amount", "amount"))}</span>
        )
      },
      {
        header: t("Symbol"),
        accessorKey: "Symbol",
        accessorFn: (row) => getVal(row, "Symbol", "symbol"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: `${masterSymbol} Amt`,
        accessorKey: "MasterCurrencyAmount",
        accessorFn: (row) => fmtNum(getVal(row, "MasterCurrencyAmount", "masterCurrencyAmount")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: `${stockSymbol} Amt`,
        accessorKey: "StockCurrencyAmount",
        accessorFn: (row) => fmtNum(getVal(row, "StockCurrencyAmount", "stockCurrencyAmount")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("Disc"),
        accessorKey: "disc",
        accessorFn: (row) => getVal(row, "disc", "Disc"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      }
    ],
    [t, masterSymbol, stockSymbol]
  );

  const accountSelectProps = (opts, value, onChange, input, setInput, setOpts, loadingFlag, placeholder, isDisabled) => ({
    styles: selectStyles,
    options: opts,
    value,
    onChange,
    onInputChange: (v, meta) => {
      if (meta.action === "input-change") setInput(v);
      else if (meta.action === "input-blur" || meta.action === "menu-close") {
        setInput("");
        setOpts([]);
      }
    },
    isLoading: loadingFlag,
    placeholder,
    isClearable: true,
    isDisabled: !!isDisabled
  });

  const curLabel = (currencyOpts.find((c) => c.value === String(form.currency))?.label || "").toUpperCase();

  const totals = useMemo(() => {
    const carats = pendingRows.reduce((s, r) => s + toNum(getVal(r, "TotCts", "totCts")), 0);
    const usd = pendingRows.reduce((s, r) => s + toNum(getVal(r, "SCurAmt", "sCurAmt")), 0);
    const inr = pendingRows.reduce((s, r) => s + toNum(getVal(r, "MCurAmt", "mCurAmt")), 0);
    const adjUsd = pendingRows.reduce((s, r) => s + toNum(r.AdUSDAmount), 0);
    const adjInr = pendingRows.reduce((s, r) => s + toNum(r.AdINRCurAmt), 0);
    const remUsd = pendingRows.reduce((s, r) => s + toNum(r.RemUSDAmount), 0);
    const remInr = pendingRows.reduce((s, r) => s + toNum(r.RemINRCurAmt), 0);
    const pay = toNum(form.rec) > 0 ? toNum(form.rec) : toNum(form.paid);
    const unapplied = Number((pay - (toNum(form.sBaseRate) === 1 ? adjUsd : adjInr)).toFixed(2));
    return { carats, usd, inr, adjUsd, adjInr, remUsd, remInr, unapplied };
  }, [pendingRows, form.rec, form.paid, form.sBaseRate]);

  const pageTitle = jvEditMode || isEditRoute ? t("Edit Payment & Receipt") : t("Add Payment & Receipt");
  document.title = `${pageTitle} | ${t("Admin")}`;

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center py-5 text-muted">{t("Loading...")}</div>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={pageTitle} pageTitle={t("Payment")} />

          <Card className="shadow-sm border-0 rounded-3 mb-3">
            <CardHeader className="d-flex justify-content-between align-items-center border-bottom-0 bg-transparent">
              <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                <i className="ri-bank-card-line fs-20" />
                {pageTitle}
              </h5>
              <Button color="light" size="sm" onClick={() => navigate("/payment/payment-list")}>
                <i className="ri-arrow-left-line me-1" />
                {t("Back to List")}
              </Button>
            </CardHeader>
            <CardBody className="pt-0">
              <Row className="g-2 mb-2">
                <Col lg={4} md={6}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">
                      {t("Main Account")} <span className="text-danger">*</span>
                    </Label>
                    <Select
                      {...accountSelectProps(
                        mainOpts,
                        mainAcc,
                        setMainAcc,
                        mainInput,
                        setMainInput,
                        setMainOpts,
                        mainLoading,
                        t("Main Account"),
                        locked
                      )}
                    />
                  </FormGroup>
                </Col>
              </Row>

              <Row className="g-2 align-items-end">
                <Col sm={2}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1 fw-semibold">{t("Transaction Date")}</Label>
                    <Input
                      type="date"
                      className="form-control-sm"
                      style={fieldH}
                      value={form.transDate}
                      onChange={(e) => setField("transDate", e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col sm={3}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1 fw-semibold">
                      {t("Transaction Account")} <span className="text-danger">*</span>
                    </Label>
                    <Select
                      {...accountSelectProps(
                        partyOpts,
                        partyAcc,
                        setPartyAcc,
                        partyInput,
                        setPartyInput,
                        setPartyOpts,
                        partyLoading,
                        t("Transaction Account"),
                        locked
                      )}
                    />
                  </FormGroup>
                </Col>
                <Col sm={2}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">
                      {t("Received.[Dr.]")}
                      {showRecStar && <span className="text-danger ms-1">*</span>}
                    </Label>
                    <Input
                      type="number"
                      className="form-control-sm text-end"
                      style={fieldH}
                      value={form.rec}
                      readOnly={locked}
                      onChange={(e) => onRecChange(e.target.value)}
                      onBlur={() => setField("rec", fmtNum(form.rec))}
                    />
                  </FormGroup>
                </Col>
                <Col sm={2}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">
                      {t("Paid.[Cr.]")}
                      {showPaidStar && <span className="text-danger ms-1">*</span>}
                    </Label>
                    <Input
                      type="number"
                      className="form-control-sm text-end"
                      style={fieldH}
                      value={form.paid}
                      readOnly={locked}
                      onChange={(e) => onPaidChange(e.target.value)}
                      onBlur={() => setField("paid", fmtNum(form.paid))}
                    />
                  </FormGroup>
                </Col>
                <Col sm={1}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">{t("Currency")}</Label>
                    <Select
                      styles={selectStyles}
                      options={currencyOpts}
                      value={currencyOpts.find((o) => o.value === String(form.currency)) || null}
                      isDisabled={locked}
                      onChange={async (o) => {
                        const code = o?.value || "";
                        setField("currency", code);
                        await applyCurrencyRates(code);
                      }}
                      placeholder={t("Currency")}
                    />
                  </FormGroup>
                </Col>
                <Col sm={1}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">
                      <span style={{ color: "cornflowerblue" }}>{masterSymbol}</span>{" "}
                      <span className="text-danger">{mOp}</span>
                    </Label>
                    <Input type="number" className="form-control-sm" style={fieldH} value={form.mBaseRate} readOnly />
                  </FormGroup>
                </Col>
                <Col sm={1}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">
                      <span style={{ color: "cornflowerblue" }}>{stockSymbol}</span>{" "}
                      <span className="text-danger">{sOp}</span>
                    </Label>
                    <Input type="number" className="form-control-sm" style={fieldH} value={form.sBaseRate} readOnly />
                  </FormGroup>
                </Col>
              </Row>

              <Row className="g-2 mt-1">
                <Col sm={4}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1 fw-semibold">{t("Description")}</Label>
                    <Input
                      type="textarea"
                      rows={4}
                      value={form.desc}
                      onChange={(e) => setField("desc", e.target.value)}
                      placeholder={t("Description")}
                    />
                  </FormGroup>
                </Col>
                <Col sm={8} className="d-flex align-items-end flex-wrap gap-2 pb-2">
                  <div className="form-check me-2 mb-1">
                    <Input
                      type="checkbox"
                      className="form-check-input"
                      id="autoAdjust"
                      checked={form.autoAdjust}
                      onChange={(e) => setField("autoAdjust", e.target.checked)}
                    />
                    <Label className="form-check-label" htmlFor="autoAdjust">
                      {t("Auto Adjust")}
                    </Label>
                  </div>

                  {!jvEditMode && (
                    <>
                      <Button
                        color="primary"
                        size="sm"
                        disabled={!!gridMode && gridMode !== "Invoice"}
                        onClick={() => togglePendingGrid("Invoice")}
                      >
                        {gridMode === "Invoice" ? t("Close Invoice") : t("On Invoice")}
                      </Button>
                      <Button
                        color="primary"
                        size="sm"
                        disabled={!!gridMode && gridMode !== "Adat"}
                        onClick={() => togglePendingGrid("Adat")}
                      >
                        {gridMode === "Adat" ? t("Close Adat") : t("On Adat")}
                      </Button>
                      <Button
                        color="primary"
                        size="sm"
                        disabled={!!gridMode && gridMode !== "Brokerage"}
                        onClick={() => togglePendingGrid("Brokerage")}
                      >
                        {gridMode === "Brokerage" ? t("Close Brokerage") : t("On Brokerage")}
                      </Button>
                    </>
                  )}

                  {!jvEditMode ? (
                    <Button color="primary" size="sm" onClick={handleSave} disabled={submitting}>
                      {submitting ? t("Saving...") : t("Save")}
                    </Button>
                  ) : (
                    <>
                      <Button color="primary" size="sm" onClick={handleSave} disabled={submitting}>
                        {submitting ? t("Updating...") : t("Update")}
                      </Button>
                      <Button color="danger" size="sm" onClick={cancelJvEdit}>
                        {t("Cancel")}
                      </Button>
                    </>
                  )}
                </Col>
              </Row>
            </CardBody>
          </Card>

          {gridMode && (
            <Card className="shadow-sm border-0 rounded-3 mb-3">
              <CardBody>
                <div className="table-responsive" style={{ maxHeight: 320, overflow: "auto" }}>
                  <Table className="table table-sm table-bordered table-striped align-middle mb-0">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th />
                        <th>
                          <Input
                            className="form-control-sm text-end"
                            style={{ color: "cornflowerblue", ...fieldH }}
                            value={`${t("Total")}:`}
                            readOnly
                          />
                        </th>
                        <th />
                        <th />
                        <th>
                          <Input
                            className="form-control-sm text-end"
                            style={{ color: "cornflowerblue", ...fieldH }}
                            value={fmtNum(totals.carats)}
                            readOnly
                          />
                        </th>
                        <th />
                        <th>
                          <Input
                            className="form-control-sm text-end"
                            style={{ color: "cornflowerblue", ...fieldH }}
                            value={fmtNum(totals.usd)}
                            readOnly
                          />
                        </th>
                        <th>
                          <Input
                            className="form-control-sm text-end"
                            style={{ color: "cornflowerblue", ...fieldH }}
                            value={totals.usd ? fmtNum(totals.inr / totals.usd) : "0.00"}
                            readOnly
                          />
                        </th>
                        <th>
                          <Input
                            className="form-control-sm text-end"
                            style={{ color: "cornflowerblue", ...fieldH }}
                            value={fmtNum(totals.inr)}
                            readOnly
                          />
                        </th>
                        <th>
                          <Input
                            className="form-control-sm text-end"
                            style={{ color: "cornflowerblue", ...fieldH }}
                            value={fmtNum(totals.adjUsd)}
                            readOnly
                          />
                        </th>
                        <th>
                          <Input
                            className="form-control-sm text-end"
                            style={{ color: "cornflowerblue", ...fieldH }}
                            value={
                              totals.adjUsd
                                ? fmtNum(totals.adjInr / totals.adjUsd)
                                : fmtNum(form.mBaseRate)
                            }
                            readOnly
                          />
                        </th>
                        <th>
                          <Input
                            className="form-control-sm text-end"
                            style={{ color: "cornflowerblue", ...fieldH }}
                            value={fmtNum(totals.adjInr)}
                            readOnly
                          />
                        </th>
                        <th>
                          <Input
                            className="form-control-sm text-end"
                            style={{ color: "cornflowerblue", ...fieldH }}
                            value={fmtNum(totals.remUsd)}
                            readOnly
                          />
                        </th>
                        <th>
                          <Input
                            className="form-control-sm text-end"
                            style={{ color: "cornflowerblue", ...fieldH }}
                            value={fmtNum(totals.remInr)}
                            readOnly
                          />
                        </th>
                        <th>
                          <Input
                            className="form-control-sm text-end"
                            style={{ color: "red", ...fieldH }}
                            value={fmtNum(totals.unapplied)}
                            readOnly
                          />
                        </th>
                        <th />
                      </tr>
                      <tr>
                        <th>{t("Date")}</th>
                        <th>{t("InvNo")}</th>
                        <th>{t("DueDate")}</th>
                        <th>{t("BillNo")}</th>
                        <th className="text-end">{t("Carats")}</th>
                        <th>{t("Inv.Cur")}</th>
                        <th className="text-end">
                          {stockSymbol} {t("Amount")}
                        </th>
                        <th className="text-end">{t("Base Rate")}</th>
                        <th className="text-end">
                          {masterSymbol} {t("Amount")}
                        </th>
                        <th className="text-end">
                          {t("Adj")} {stockSymbol}
                        </th>
                        <th className="text-end">
                          {t("Pay")} {masterSymbol} {t("Rate")}
                        </th>
                        <th className="text-end">
                          {t("Adj")} {masterSymbol}
                        </th>
                        <th className="text-end">
                          {t("Rem")} {stockSymbol}
                        </th>
                        <th className="text-end">
                          {t("Rem")} {masterSymbol}
                        </th>
                        <th>{t("TrnType")}</th>
                        <th>{t("InvCode")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRows.length === 0 ? (
                        <tr>
                          <td colSpan={16} className="text-center text-muted py-3">
                            {t("No data available in table")}
                          </td>
                        </tr>
                      ) : (
                        pendingRows.map((row, idx) => (
                          <tr key={`${getVal(row, "InvCode", "invCode")}-${idx}`}>
                            <td className="text-nowrap">{fmtDate(getVal(row, "Date", "date"))}</td>
                            <td>{getVal(row, "InvNo", "invNo")}</td>
                            <td className="text-nowrap">{fmtDate(getVal(row, "DueDate", "dueDate"))}</td>
                            <td>{getVal(row, "BillNo", "billNo")}</td>
                            <td className="text-end">{fmtNum(getVal(row, "TotCts", "totCts"), 3)}</td>
                            <td>{getVal(row, "Symbol", "symbol")}</td>
                            <td>
                              <Input
                                type="text"
                                className="form-control-sm text-end"
                                style={{
                                  ...fieldH,
                                  backgroundColor: toNum(form.sBaseRate) === 1 ? "#fed49c" : undefined
                                }}
                                value={fmtNum(getVal(row, "SCurAmt", "sCurAmt"))}
                                readOnly
                              />
                            </td>
                            <td className="text-end">{fmtNum(getVal(row, "BaseRate", "baseRate"))}</td>
                            <td>
                              <Input
                                type="text"
                                className="form-control-sm text-end"
                                style={{
                                  ...fieldH,
                                  backgroundColor: toNum(form.mBaseRate) === 1 ? "#fed49c" : undefined
                                }}
                                value={fmtNum(getVal(row, "MCurAmt", "mCurAmt"))}
                                readOnly
                              />
                            </td>
                            <td>
                              <Input
                                type="number"
                                className="form-control-sm text-end"
                                style={{
                                  ...fieldH,
                                  backgroundColor: toNum(form.sBaseRate) === 1 ? "#98ecc2" : undefined
                                }}
                                value={row.AdUSDAmount ?? 0}
                                readOnly={curLabel === "INR"}
                                onClick={() => autoFillRow(idx, "AdUSDAmount")}
                                onChange={(e) => updatePendingRow(idx, "AdUSDAmount", e.target.value)}
                              />
                            </td>
                            <td className="text-end">{fmtNum(row.PayINRRate)}</td>
                            <td>
                              <Input
                                type="number"
                                className="form-control-sm text-end"
                                style={{
                                  ...fieldH,
                                  backgroundColor: toNum(form.mBaseRate) === 1 ? "#98ecc2" : undefined
                                }}
                                value={row.AdINRCurAmt ?? 0}
                                readOnly={curLabel === "USD"}
                                onClick={() => autoFillRow(idx, "AdINRCurAmt")}
                                onChange={(e) => updatePendingRow(idx, "AdINRCurAmt", e.target.value)}
                              />
                            </td>
                            <td>
                              <Input
                                type="text"
                                className="form-control-sm text-end"
                                style={{
                                  ...fieldH,
                                  backgroundColor: toNum(form.sBaseRate) === 1 ? "#FFCCCB" : undefined
                                }}
                                value={fmtNum(row.RemUSDAmount)}
                                readOnly
                              />
                            </td>
                            <td>
                              <Input
                                type="text"
                                className="form-control-sm text-end"
                                style={{
                                  ...fieldH,
                                  backgroundColor: toNum(form.mBaseRate) === 1 ? "#FFCCCB" : undefined
                                }}
                                value={fmtNum(row.RemINRCurAmt)}
                                readOnly
                              />
                            </td>
                            <td>{getVal(row, "TrnType", "trnType")}</td>
                            <td>{getVal(row, "InvCode", "invCode")}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          )}

          {!gridMode && (
            <Card className="shadow-sm border-0 rounded-3">
              <CardBody>
                <div className="d-flex justify-content-end mb-2">
                  <Button color="soft-success" className="btn-sm" onClick={handleExportJv}>
                    <i className="ri-file-excel-2-line me-1" />
                    {t("Excel")}
                  </Button>
                </div>
                {jvLoading ? (
                  <div className="text-center text-muted py-4">{t("Loading...")}</div>
                ) : (
                  <TableContainer
                    columns={jvColumns}
                    data={jvRows}
                    isGlobalFilter
                    isPagination
                    customPageSize={500}
                    customPageSizes={[500, 1000, 1500]}
                    SearchPlaceholder={t("Search...")}
                    divClass="table-responsive table-card mb-0"
                    tableClass="table table-bordered table-hover table-sm align-middle mb-0"
                    theadClass="table-light"
                  />
                )}
              </CardBody>
            </Card>
          )}
        </Container>

        <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
          <div
            className="modal-header justify-content-between align-items-center py-3 px-4"
            style={{ backgroundColor: "rgb(238, 94, 70)", borderBottom: "none" }}
          >
            <h5 className="modal-title m-0 fw-medium" style={{ color: "#212529" }}>
              {t("Confirm Delete")}
            </h5>
            <button type="button" className="btn-close" onClick={() => setDeleteModal(false)} aria-label="Close" />
          </div>
          <ModalBody className="py-4">
            <div className="text-center">
              <h3 className="fw-bold mb-3" style={{ color: "#495057" }}>
                {t("Are You Sure ??")}
              </h3>
              <p className="text-muted mb-4 fs-16">
                {t("Selected Payment/Reciept Removed !!")}
                {deleteTarget?.gcode && (
                  <>
                    <br />
                    <strong>{t("GCode")} :</strong> {deleteTarget.gcode}
                  </>
                )}
              </p>
            </div>
            <div className="d-flex gap-3 justify-content-center mt-3">
              <button
                type="button"
                className="btn text-white px-4 py-2"
                style={{ backgroundColor: "#405189", minWidth: 130 }}
                onClick={confirmDeleteJv}
              >
                {t("Yes, remove it")}
              </button>
              <button
                type="button"
                className="btn text-white px-4 py-2"
                style={{ backgroundColor: "rgb(238, 94, 70)", minWidth: 130 }}
                onClick={() => setDeleteModal(false)}
              >
                {t("Cancel")}
              </button>
            </div>
          </ModalBody>
        </Modal>

        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default PaymentForm;
