import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import {
  editPayWithExDiff,
  getAccGrpMasters,
  getCurrencyRates,
  getPayWithExDiffDetail,
  getPayWithExDiffEditDetails,
  getPayWithExDiffPageData
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

const fmtNum = (value, decimals = 2) => {
  const n = Number(value);
  if (Number.isNaN(n)) return (0).toFixed(decimals);
  return n.toFixed(decimals);
};

const fmtDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const toLocalDateStr = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().substr(0, 10);
};

const fieldH = { height: 31 };

/** MVC: ExDiffINR = AdUSD * (headerBase - invBase); AdjINR = AdUSD * headerBase; RemINR = (MCur - AdjINR) + ExDiff */
const applyExDiffCalc = (row, adUsd, headerBase) => {
  const sCur = toNum(getVal(row, "SCurAmt", "sCurAmt"));
  const mCur = toNum(getVal(row, "MCurAmt", "mCurAmt"));
  const invBase = toNum(getVal(row, "BaseRate", "baseRate"));
  const base = toNum(headerBase) || 1;
  const ad = toNum(adUsd);
  const adInr = Number((ad * base).toFixed(2));
  const exDiff = Number((ad * (base - invBase)).toFixed(2));
  return {
    ...row,
    AdUSDAmount: ad,
    AdINRCurAmt: adInr,
    PayINRRate: base,
    ExDiffINR: exDiff,
    RemUSDAmount: Number((sCur - ad).toFixed(2)),
    RemINRCurAmt: Number((mCur - adInr + exDiff).toFixed(2))
  };
};


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
  input: (p) => ({ ...p, margin: 0, padding: 0 }),
  menu: (p) => ({ ...p, zIndex: 30 }),
  option: (p, s) => ({
    ...p,
    backgroundColor: s.isFocused ? "#3b5de7" : "transparent",
    color: s.isFocused ? "#fff" : "var(--vz-body-color, #495057)",
    fontSize: "12px"
  }),
  singleValue: (p, s) => ({
    ...p,
    fontSize: "12px",
    color: s.isDisabled ? "var(--vz-secondary-color, #878a99)" : "var(--vz-body-color, #495057)"
  })
};

const mapCurrency = (list = []) =>
  (list || [])
    .map((x) => ({
      value: String(getVal(x, "ID", "Id", "id") || getVal(x, "Name", "TextName", "textName") || "").trim(),
      label: String(getVal(x, "Name", "TextName", "textName") || getVal(x, "ID", "Id", "id") || "").trim()
    }))
    .filter((o) => o.value && o.label);

/** MVC EditPayment: select by Symbol name OR CurCode when CurCode != 0 */
const resolveCurrencyCode = (currencies, curCode, symbol) => {
  const code = String(curCode ?? "").trim();
  const sym = String(symbol ?? "").trim().toUpperCase();
  if (code && code !== "0") {
    const byId = currencies.find((o) => String(o.value) === code);
    if (byId) return byId.value;
  }
  if (sym) {
    const byName = currencies.find((o) => String(o.label).trim().toUpperCase() === sym);
    if (byName) return byName.value;
    const byContains = currencies.find((o) => String(o.label).trim().toUpperCase().includes(sym) || sym.includes(String(o.label).trim().toUpperCase()));
    if (byContains) return byContains.value;
  }
  if (code && code !== "0") return code;
  return "";
};

const normalizePending = (r) => ({
  Date: getVal(r, "Date", "date"),
  InvNo: getVal(r, "InvNo", "invNo"),
  InvCode: String(getVal(r, "InvCode", "invCode") || ""),
  DueDate: getVal(r, "DueDate", "dueDate"),
  BillNo: getVal(r, "BillNo", "billNo"),
  TotCts: toNum(getVal(r, "TotCts", "totCts")),
  Symbol: getVal(r, "Symbol", "symbol"),
  SCurAmt: toNum(getVal(r, "SCurAmt", "sCurAmt")),
  BaseRate: toNum(getVal(r, "BaseRate", "baseRate")),
  MCurAmt: toNum(getVal(r, "MCurAmt", "mCurAmt")),
  AdUSDAmount: toNum(getVal(r, "AdUSDAmount", "adUSDAmount")),
  PayINRRate: toNum(getVal(r, "PayINRRate", "payINRRate")),
  AdINRCurAmt: toNum(getVal(r, "AdINRCurAmt", "adINRCurAmt")),
  ExDiffINR: toNum(getVal(r, "ExDiffINR", "exDiffINR")),
  RemUSDAmount: toNum(getVal(r, "RemUSDAmount", "remUSDAmount")),
  RemINRCurAmt: toNum(getVal(r, "RemINRCurAmt", "remINRCurAmt")),
  TrnType: getVal(r, "TrnType", "trnType")
});

const PayWithExDiffEditForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("Id") || searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
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
    transDate: "",
    rec: "0.00",
    paid: "0.00",
    currency: "",
    mBaseRate: "0.00",
    sBaseRate: "0.00",
    desc: "",
    autoAdjust: false,
    payType: "Payment",
    vtype: ""
  });
  const [pendingRows, setPendingRows] = useState([]);
  const [snapshot, setSnapshot] = useState(null);

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
    if (!curCode || String(curCode) === "0") return null;
    try {
      const res = await getCurrencyRates(curCode);
      if (res?.success || res?.Success) {
        setMOp(getVal(res, "MasterCurrencyOperator", "masterCurrencyOperator") || "*");
        setSOp(getVal(res, "StockCurrencyOperator", "stockCurrencyOperator") || "*");
        const m = toNum(res.baseRate ?? res.BaseRate, 0);
        const s = toNum(res.sBaseRate ?? res.SBaseRate, 0);
        if (m > 0 || s > 0) {
          setForm((prev) => ({
            ...prev,
            mBaseRate: m > 0 ? fmtNum(m) : prev.mBaseRate,
            sBaseRate: s > 0 ? fmtNum(s) : prev.sBaseRate
          }));
        }
        return { m, s };
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const recalcRow = (row, field, value, mRate) => {
    const base = toNum(mRate) || toNum(row.PayINRRate) || toNum(row.BaseRate) || 1;
    if (field === "AdUSDAmount") {
      return applyExDiffCalc(row, value, base);
    }
    if (field === "AdINRCurAmt") {
      const adUsd = base ? Number((toNum(value) / base).toFixed(2)) : 0;
      return applyExDiffCalc(row, adUsd, base);
    }
    return { ...row, [field]: toNum(value) };
  };

  const totals = useMemo(() => {
    const carats = pendingRows.reduce((s, r) => s + toNum(r.TotCts), 0);
    const usd = pendingRows.reduce((s, r) => s + toNum(r.SCurAmt), 0);
    const inr = pendingRows.reduce((s, r) => s + toNum(r.MCurAmt), 0);
    const adjUsd = pendingRows.reduce((s, r) => s + toNum(r.AdUSDAmount), 0);
    const adjInr = pendingRows.reduce((s, r) => s + toNum(r.AdINRCurAmt), 0);
    const exDiff = pendingRows.reduce((s, r) => s + toNum(r.ExDiffINR), 0);
    const remUsd = pendingRows.reduce((s, r) => s + toNum(r.RemUSDAmount), 0);
    const remInr = pendingRows.reduce((s, r) => s + toNum(r.RemINRCurAmt), 0);
    const pay = toNum(form.rec) > 0 ? toNum(form.rec) : toNum(form.paid);
    const unapplied = Number((pay - adjUsd).toFixed(2));
    return { carats, usd, inr, adjUsd, adjInr, exDiff, remUsd, remInr, unapplied };
  }, [pendingRows, form.rec, form.paid]);

  useEffect(() => {
    if (!editId) {
      toast.error(t("Payment record not found."));
      navigate("/payment/pay-with-exdiff-list");
      return;
    }

    (async () => {
      setLoading(true);
      try {
        let currencies = [];
        const pageRes = await getPayWithExDiffPageData();
        if (pageRes?.success || pageRes?.Success) {
          const data = pageRes.Data || pageRes.data || {};
          currencies = mapCurrency(data.CurrencyList || data.currencyList || []);
          setCurrencyOpts(currencies);
        }

        const detailRes = await getPayWithExDiffDetail(editId);
        if (!(detailRes?.success || detailRes?.Success)) {
          toast.error(detailRes?.Data || detailRes?.data || t("Payment record not found."));
          navigate("/payment/pay-with-exdiff-list");
          return;
        }
        const d = detailRes.Data || detailRes.data || {};
        const vtype = String(getVal(d, "Vtype", "vtype") || "").toUpperCase();
        const amount = toNum(getVal(d, "Amount", "amount"));
        const adjRaw = String(getVal(d, "AdjustmentType", "adjustmentType") || "").trim();
        const adjType =
          adjRaw.toUpperCase() === "ADAT"
            ? "Adat"
            : adjRaw.toUpperCase() === "BROKERAGE"
              ? "Brokerage"
              : "Payment";
        const main = {
          value: String(getVal(d, "MainAccCode", "mainAccCode") || getVal(d, "mainacc") || ""),
          label: getVal(d, "MainAccName", "mainAccName", "Account", "account")
        };
        const party = {
          value: String(getVal(d, "PartyAccCode", "partyAccCode") || getVal(d, "trnacc") || ""),
          label: getVal(d, "PartyAccName", "partyAccName", "Party", "party")
        };
        const symbol = getVal(d, "Symbol", "symbol");
        const rawCur = getVal(d, "CurCode", "curCode");
        let cur = resolveCurrencyCode(currencies, rawCur, symbol);

        // If Symbol exists but not in list, keep a selectable option (MVC appends Symbol)
        if (!cur && symbol) {
          const synth = {
            value: String(rawCur && Number(rawCur) !== 0 ? rawCur : symbol),
            label: String(symbol)
          };
          currencies = [...currencies, synth];
          setCurrencyOpts(currencies);
          cur = String(synth.value);
        }

        // Fallback: rate=1 markers used by MVC amount logic (INR master / USD stock)
        if (!cur && currencies.length) {
          const mAmtRate = toNum(getVal(d, "MasterCurrencyRate", "masterCurrencyRate"));
          const sAmtRate = toNum(getVal(d, "StockCurrencyRate", "stockCurrencyRate"));
          if (sAmtRate === 1) {
            const usd = currencies.find((o) => String(o.label).trim().toUpperCase() === "USD");
            if (usd) cur = usd.value;
          } else if (mAmtRate === 1) {
            const inr = currencies.find((o) => String(o.label).trim().toUpperCase() === "INR");
            if (inr) cur = inr.value;
          }
        }

        // Ensure selected CurCode appears in dropdown options
        if (cur && !currencies.some((o) => String(o.value) === String(cur))) {
          currencies = [...currencies, { value: String(cur), label: String(symbol || cur) }];
          setCurrencyOpts(currencies);
        }

        let mRate = toNum(getVal(d, "MasterCurrencyRate", "masterCurrencyRate"));
        let sRate = toNum(getVal(d, "StockCurrencyRate", "stockCurrencyRate"));

        if (cur) {
          const rates = await applyCurrencyRates(cur);
          if (mRate <= 0 && rates?.m > 0) mRate = rates.m;
          if (sRate <= 0 && rates?.s > 0) sRate = rates.s;
        }

        const nextForm = {
          gcode: String(getVal(d, "GCODE", "gcode") || editId),
          transDate: toLocalDateStr(getVal(d, "Date", "date")),
          rec: vtype === "IREC" ? fmtNum(amount) : "0.00",
          paid: vtype === "IPAY" ? fmtNum(amount) : "0.00",
          currency: cur ? String(cur) : "",
          mBaseRate: fmtNum(mRate),
          sBaseRate: fmtNum(sRate),
          desc: getVal(d, "disc", "Disc") || "",
          autoAdjust: false,
          payType: adjType,
          vtype,
          symbol: symbol || ""
        };
        setMainAcc(main.value ? main : null);
        setPartyAcc(party.value ? party : null);
        setForm(nextForm);

        const gridRes = await getPayWithExDiffEditDetails(String(editId), adjType);
        let rows = [];
        if (gridRes?.success || gridRes?.Success) {
          rows = (gridRes.Data || gridRes.data || []).map(normalizePending);
          const headerRate = toNum(nextForm.mBaseRate) || 1;
          rows = rows.map((r) =>
            applyExDiffCalc({ ...r, PayINRRate: headerRate }, toNum(r.AdUSDAmount), headerRate)
          );
          setPendingRows(rows);
        } else {
          toast.warning(gridRes?.Data || gridRes?.data || t("Failed to load invoice details."));
        }

        setSnapshot({
          form: nextForm,
          mainAcc: main.value ? main : null,
          partyAcc: party.value ? party : null,
          pendingRows: rows
        });
        setEditing(false);
      } catch (err) {
        console.error(err);
        toast.error(t("Failed to load payment detail."));
      } finally {
        setLoading(false);
      }
    })();
  }, [editId, navigate, t]);

  const curLabel = (currencyOpts.find((c) => c.value === String(form.currency))?.label || "").toUpperCase();
  const isUsd = curLabel === "USD" || toNum(form.sBaseRate) === 1;
  const isInr = curLabel === "INR" || toNum(form.mBaseRate) === 1;

  const enableEdit = () => {
    setEditing(true);
  };

  const cancelEdit = () => {
    if (!snapshot) {
      window.location.reload();
      return;
    }
    setForm(snapshot.form);
    setMainAcc(snapshot.mainAcc);
    setPartyAcc(snapshot.partyAcc);
    setPendingRows(snapshot.pendingRows);
    setEditing(false);
  };

  const updatePendingRow = (idx, field, value) => {
    if (!editing) return;
    const num = toNum(value);
    const row = pendingRows[idx];
    if (!row) return;

    const actual =
      field === "AdUSDAmount" ? toNum(row.SCurAmt) : field === "AdINRCurAmt" ? toNum(row.MCurAmt) : 0;

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
        setPendingRows((prev) => {
          const next = [...prev];
          next[idx] = recalcRow(next[idx], field, result.isConfirmed ? num : actual, form.mBaseRate);
          return next;
        });
      });
      return;
    }

    setPendingRows((prev) => {
      const next = [...prev];
      next[idx] = recalcRow(next[idx], field, value, form.mBaseRate);
      return next;
    });
  };

  /** MVC AutoFillRow: click adj cell with Auto Adjust checked fills remaining payment amount */
  const autoFillRow = (idx, field) => {
    if (!form.autoAdjust || !editing) return;

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

      const invoiceMax = isUsdField ? toNum(row.SCurAmt) : toNum(row.MCurAmt);
      const fillAmt = Math.min(remaining, invoiceMax);
      if (fillAmt <= 0) return prev;

      const next = [...prev];
      next[idx] = recalcRow(row, field, fillAmt, form.mBaseRate);
      return next;
    });
  };

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

  const handleUpdateInvoice = async () => {
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

    const totalPayment = toNum(form.rec) > 0 ? toNum(form.rec) : toNum(form.paid);
    if (totalPayment <= 0) {
      await Swal.fire({
        title: t("Error"),
        text: t("Please enter a Receive or Paid amount"),
        icon: "error"
      });
      return;
    }

    const adjUsd = totals.adjUsd;
    const adjInr = totals.adjInr;
    if (adjUsd === 0 && adjInr === 0) {
      await Swal.fire({
        title: t("Error"),
        text: t("Please specified AdjUsdAmount Or InrAmount"),
        icon: "error"
      });
      return;
    }

    // MVC UpdateIncomeExpense: adj must equal header for INR or USD
    const round2 = (v) => Number(toNum(v).toFixed(2));
    const currencyText = curLabel;
    if (currencyText === "INR") {
      const adjm = round2(adjInr);
      const totm = round2(totalPayment);
      if (adjm > totm) {
        await Swal.fire({
          title: t("Error"),
          text: `Adjusted amount is greater than total (${adjm.toFixed(2)} > ${totm.toFixed(2)})`,
          icon: "error"
        });
        return;
      }
      if (adjm < totm) {
        await Swal.fire({
          title: t("Error"),
          text: `Adjusted amount is less than total (${adjm.toFixed(2)} < ${totm.toFixed(2)})`,
          icon: "error"
        });
        return;
      }
    } else if (currencyText === "USD" || toNum(form.sBaseRate) === 1) {
      const adj = round2(adjUsd);
      const tot = round2(totalPayment);
      if (adj > tot) {
        await Swal.fire({
          title: t("Error"),
          text: `Adjusted amount is greater than total (${adj.toFixed(2)} > ${tot.toFixed(2)})`,
          icon: "error"
        });
        return;
      }
      if (adj < tot) {
        await Swal.fire({
          title: t("Error"),
          text: `Adjusted amount is less than total (${adj.toFixed(2)} < ${tot.toFixed(2)})`,
          icon: "error"
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        GCODE: form.gcode,
        TransDate: form.transDate,
        mainacc: toNum(mainAcc.value),
        trnacc: toNum(partyAcc.value),
        Rec: toNum(form.rec),
        Paid: toNum(form.paid),
        CurCode: toNum(form.currency),
        BaseRate: toNum(form.mBaseRate),
        SRate: toNum(form.sBaseRate) || 1,
        Desc: form.desc || "",
        disc: form.desc || "",
        MOp: mOp || "*",
        SOp: sOp || "*",
        adjusdTotalAmt: adjUsd,
        adjinramount: adjInr,
        PayType: form.payType || "Payment",
        isJVMode: false,
        Lines: pendingRows
          .filter((r) => toNum(r.AdUSDAmount) > 0 || toNum(r.AdINRCurAmt) > 0)
          .map((r) => ({
            PDate: r.Date,
            InvNo: r.InvNo,
            InvCode: r.InvCode,
            BaseRate: toNum(r.PayINRRate || form.mBaseRate),
            AdMCurAmt: toNum(r.AdINRCurAmt),
            AdSCurAmt: toNum(r.AdUSDAmount)
          }))
      };
      const res = await editPayWithExDiff(payload);
      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || t("Payment updated successfully."));
        navigate("/payment/pay-with-exdiff-list", { state: { successMessage: res?.Data || res?.data } });
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

  const accountSelectProps = (opts, value, onChange, setInput, setOpts, loadingFlag, placeholder, disabled) => ({
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
    isClearable: false,
    isDisabled: !!disabled
  });

  document.title = `${t("Edit Payment & Receipt With ExDiff")} | ${t("Admin")}`;

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
          <BreadCrumb title={t("Edit Payment & Receipt With ExDiff")} pageTitle={t("Payment")} />

          <Card className="shadow-sm border-0 rounded-3 mb-3">
            <CardHeader className="d-flex justify-content-between align-items-center border-bottom-0 bg-transparent">
              <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                <i className="ri-bank-card-line fs-20" />
                {t("Edit Payment & Receipt With ExDiff")}
              </h5>
              <Button color="light" size="sm" onClick={() => navigate("/payment/pay-with-exdiff-list")}>
                <i className="ri-arrow-left-line me-1" />
                {t("Back to List")}
              </Button>
            </CardHeader>
            <CardBody className="pt-0">
              <Row className="g-2 mb-2">
                <Col lg={4} md={6}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1 fw-semibold">{t("Main Account")}</Label>
                    <Select
                      {...accountSelectProps(
                        mainOpts,
                        mainAcc,
                        setMainAcc,
                        setMainInput,
                        setMainOpts,
                        mainLoading,
                        t("Main Account"),
                        !editing
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
                      disabled={!editing}
                      onChange={(e) => setField("transDate", e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col sm={3}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1 fw-semibold">{t("Transaction Account")}</Label>
                    <Select
                      {...accountSelectProps(
                        partyOpts,
                        partyAcc,
                        setPartyAcc,
                        setPartyInput,
                        setPartyOpts,
                        partyLoading,
                        t("Transaction Account"),
                        true
                      )}
                    />
                  </FormGroup>
                </Col>
                <Col sm={2}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">
                      {t("Received.[Dr.]")} <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="number"
                      className="form-control-sm text-end"
                      style={fieldH}
                      value={form.rec}
                      readOnly={!editing || toNum(form.paid) > 0}
                      onChange={(e) => onRecChange(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col sm={2}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">
                      {t("Paid.[Cr.]")} <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="number"
                      className="form-control-sm text-end"
                      style={fieldH}
                      value={form.paid}
                      readOnly={!editing || toNum(form.rec) > 0}
                      onChange={(e) => onPaidChange(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col sm={1}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">{t("Currency")}</Label>
                    <Select
                      styles={selectStyles}
                      options={currencyOpts}
                      value={
                        currencyOpts.find((o) => String(o.value) === String(form.currency || "")) || null
                      }
                      placeholder={t("Select...")}
                      isDisabled={!editing}
                      onChange={async (o) => {
                        const code = o?.value || "";
                        setField("currency", code);
                        await applyCurrencyRates(code);
                      }}
                    />
                  </FormGroup>
                </Col>
                <Col sm={1}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">
                      <span style={{ color: "cornflowerblue" }}>{masterSymbol}</span>{" "}
                      <span className="text-danger">{mOp}</span>
                    </Label>
                    <Input
                      type="number"
                      className="form-control-sm"
                      style={fieldH}
                      value={form.mBaseRate}
                      readOnly={!editing}
                      onChange={(e) => setField("mBaseRate", e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col sm={1}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">
                      <span style={{ color: "cornflowerblue" }}>{stockSymbol}</span>{" "}
                      <span className="text-danger">{sOp}</span>
                    </Label>
                    <Input
                      type="number"
                      className="form-control-sm"
                      style={fieldH}
                      value={form.sBaseRate}
                      readOnly={!editing}
                      onChange={(e) => setField("sBaseRate", e.target.value)}
                    />
                  </FormGroup>
                </Col>
              </Row>

              <Row className="g-2 mt-1">
                <Col sm={4}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1 fw-semibold">{t("Description")}</Label>
                    <Input
                      type="textarea"
                      rows={3}
                      value={form.desc}
                      readOnly={!editing}
                      onChange={(e) => setField("desc", e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col sm={8} className="d-flex align-items-end flex-wrap gap-2 pb-2">
                  <div className="form-check me-2 mb-1">
                    <Input
                      type="checkbox"
                      className="form-check-input"
                      id="editAutoAdjust"
                      checked={form.autoAdjust}
                      disabled={!editing}
                      onChange={(e) => setField("autoAdjust", e.target.checked)}
                    />
                    <Label className="form-check-label" htmlFor="editAutoAdjust">
                      {t("Auto Adjust")}
                    </Label>
                  </div>
                  {!editing ? (
                    <Button color="secondary" size="sm" onClick={enableEdit}>
                      {t("Edit")}
                    </Button>
                  ) : (
                    <Button color="outline-secondary" size="sm" onClick={cancelEdit}>
                      {t("Cancel")}
                    </Button>
                  )}
                  <Button
                    color="primary"
                    size="sm"
                    disabled={!editing || submitting}
                    onClick={handleUpdateInvoice}
                  >
                    {submitting ? t("Updating...") : t("Update Invoice")}
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>

          <Card className="shadow-sm border-0 rounded-3">
            <CardBody>
              <div className="table-responsive" style={{ maxHeight: 420, overflow: "auto" }}>
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
                            totals.adjUsd ? fmtNum(totals.adjInr / totals.adjUsd) : fmtNum(form.mBaseRate)
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
                          value={fmtNum(totals.exDiff)}
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
                        {t("Ex Diff")} {masterSymbol}
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
                        <td colSpan={17} className="text-center text-muted py-3">
                          {t("No data available in table")}
                        </td>
                      </tr>
                    ) : (
                      pendingRows.map((row, idx) => (
                        <tr key={`${row.InvCode}-${idx}`}>
                          <td className="text-nowrap">{fmtDate(row.Date)}</td>
                          <td>{row.InvNo}</td>
                          <td className="text-nowrap">{fmtDate(row.DueDate)}</td>
                          <td>{row.BillNo}</td>
                          <td className="text-end">{fmtNum(row.TotCts, 3)}</td>
                          <td>{row.Symbol}</td>
                          <td>
                            <Input
                              type="text"
                              className="form-control-sm text-end"
                              style={{
                                ...fieldH,
                                backgroundColor: toNum(form.sBaseRate) === 1 ? "#fed49c" : undefined
                              }}
                              value={fmtNum(row.SCurAmt)}
                              readOnly
                            />
                          </td>
                          <td className="text-end">{fmtNum(row.BaseRate)}</td>
                          <td>
                            <Input
                              type="text"
                              className="form-control-sm text-end"
                              style={{
                                ...fieldH,
                                backgroundColor: toNum(form.mBaseRate) === 1 ? "#fed49c" : undefined
                              }}
                              value={fmtNum(row.MCurAmt)}
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
                              value={row.AdUSDAmount}
                              readOnly={!editing || isInr}
                              onClick={() => autoFillRow(idx, "AdUSDAmount")}
                              onChange={(e) => updatePendingRow(idx, "AdUSDAmount", e.target.value)}
                            />
                          </td>
                          <td className="text-end">{fmtNum(row.PayINRRate || form.mBaseRate)}</td>
                          <td>
                            <Input
                              type="number"
                              className="form-control-sm text-end"
                              style={{
                                ...fieldH,
                                backgroundColor: toNum(form.mBaseRate) === 1 ? "#98ecc2" : undefined
                              }}
                              value={row.AdINRCurAmt}
                              readOnly={!editing || isUsd}
                              onClick={() => autoFillRow(idx, "AdINRCurAmt")}
                              onChange={(e) => updatePendingRow(idx, "AdINRCurAmt", e.target.value)}
                            />
                          </td>
                          <td>
                            <Input
                              type="text"
                              className="form-control-sm text-end"
                              style={fieldH}
                              value={fmtNum(row.ExDiffINR)}
                              readOnly
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
                          <td>{row.TrnType}</td>
                          <td>{row.InvCode}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Container>
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default PayWithExDiffEditForm;
