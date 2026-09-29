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
  Row,
  Table
} from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import {
  addPayWithExDiff,
  getAccGrpMasters,
  getCurrencyRates,
  getPayWithExDiffPageData,
  getPayWithExDiffPendingInv
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

/** MVC: ExDiffINR = AdUSD × (headerBase − invBase); AdjINR = AdUSD × headerBase; RemINR = (MCur − AdjINR) + ExDiff */
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

const PayWithExDiffForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
  const [gridMode, setGridMode] = useState(null);
  const [pendingRows, setPendingRows] = useState([]);

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

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getPayWithExDiffPageData();
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
      } catch (err) {
        console.error(err);
        toast.error(t("Failed to load page data."));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  /** MVC autoAdjustAmounts */
  const autoAdjustAmounts = (rows) => {
    let totalAmount = toNum(form.rec) > 0 ? toNum(form.rec) : toNum(form.paid);
    const baserate = toNum(form.mBaseRate) || 1;
    return rows.map((r) => {
      const sCur = toNum(getVal(r, "SCurAmt", "sCurAmt"));
      let adUsd = totalAmount > sCur ? sCur : totalAmount;
      totalAmount -= adUsd;
      if (totalAmount < 0) totalAmount = 0;
      return applyExDiffCalc(r, Number(adUsd.toFixed(2)), baserate);
    });
  };

  const togglePendingGrid = async () => {
    if (gridMode === "Invoice") {
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
    setField("payType", "Payment");
    setLocked(true);
    setGridMode("Invoice");

    try {
      const res = await getPayWithExDiffPendingInv({
        Party: partyAcc.value,
        TrnType: trnType,
        Currency: toNum(form.currency),
        Mode: "Invoice"
      });
      if (res?.success || res?.Success) {
        let rows = (res.Data || res.data || []).map((r) => ({
          ...r,
          AdUSDAmount: 0,
          AdINRCurAmt: 0,
          PayINRRate: toNum(form.mBaseRate),
          ExDiffINR: 0,
          RemUSDAmount: toNum(getVal(r, "RemUSDAmount", "remUSDAmount", "SCurAmt", "sCurAmt")),
          RemINRCurAmt: toNum(getVal(r, "RemINRCurAmt", "remINRCurAmt", "MCurAmt", "mCurAmt"))
        }));
        if (form.autoAdjust) rows = autoAdjustAmounts(rows);
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
      const base = toNum(form.mBaseRate) || 1;
      if (field === "AdUSDAmount") {
        next[idx] = applyExDiffCalc(row, num, base);
      } else if (field === "AdINRCurAmt") {
        const adUsd = base ? Number((num / base).toFixed(2)) : 0;
        next[idx] = applyExDiffCalc(row, adUsd, base);
      } else {
        row[field] = num;
        next[idx] = row;
      }
      return next;
    });
  };

  const updatePendingRow = (idx, field, value) => {
    const num = toNum(value);
    const row = pendingRows[idx];
    if (!row) return;

    if (field === "AdUSDAmount") {
      const usdAmt = toNum(getVal(row, "SCurAmt", "sCurAmt"));
      if (num > usdAmt + 0.0001) {
        Swal.fire({
          title: t("Warning"),
          text: "AdjUSDAmount should not be greter than USD Amount",
          icon: "error"
        });
      }
      applyPendingRowValue(idx, field, num);
      return;
    }

    const actual = field === "AdINRCurAmt" ? toNum(getVal(row, "MCurAmt", "mCurAmt")) : 0;
    if (field === "AdINRCurAmt" && num > actual + 0.0001) {
      Swal.fire({
        title: t("Confirmation"),
        text: t("Entered amount is greater than actual. Are you sure you want to continue?"),
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: t("Yes"),
        cancelButtonText: t("No"),
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) applyPendingRowValue(idx, field, num);
        else applyPendingRowValue(idx, field, actual);
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
      if (toNum(row[field]) > 0) return prev;

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
      const base = toNum(form.mBaseRate) || 1;
      if (isUsdField) next[idx] = applyExDiffCalc(row, fillAmt, base);
      else {
        const adUsd = base ? Number((fillAmt / base).toFixed(2)) : 0;
        next[idx] = applyExDiffCalc(row, adUsd, base);
      }
      return next;
    });
  };

  const buildSavePayload = () => ({
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
    TotalExDiff: pendingRows.reduce((s, r) => s + toNum(r.ExDiffINR), 0),
    PayType: form.payType || "Payment",
    Lines: pendingRows
      .filter((r) => toNum(r.AdUSDAmount) > 0 || toNum(r.AdINRCurAmt) > 0 || toNum(r.ExDiffINR) !== 0)
      .map((r) => ({
        PDate: getVal(r, "Date", "date"),
        InvNo: getVal(r, "InvNo", "invNo"),
        InvCode: getVal(r, "InvCode", "invCode"),
        BaseRate: toNum(r.PayINRRate || form.mBaseRate),
        AdMCurAmt: toNum(r.AdINRCurAmt),
        AdSCurAmt: toNum(r.AdUSDAmount),
        ExDiff: toNum(r.ExDiffINR)
      }))
  });

  const handleSave = async () => {
    if (!mainAcc?.value || !partyAcc?.value) {
      toast.warning(t("Please select Main Account and Transaction Account."));
      return;
    }
    if (String(mainAcc.value) === String(partyAcc.value)) {
      await Swal.fire({ title: t("Error"), text: t("Not Select Same Account."), icon: "error" });
      return;
    }
    if (toNum(form.rec) > 0 && toNum(form.paid) > 0) {
      await Swal.fire({
        title: t("Warning"),
        text: "Receive Payment and Paid Payment Both are not allowed",
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
    if (!gridMode) {
      await Swal.fire({
        title: t("Warning"),
        text: t("Please open On Invoice and adjust amounts before saving."),
        icon: "error"
      });
      return;
    }

    const currencyText = (
      currencyOpts.find((c) => String(c.value) === String(form.currency))?.label || ""
    ).toUpperCase();
    const totalAmount = Number(
      ((toNum(form.rec) > 0 ? toNum(form.rec) : toNum(form.paid))).toFixed(2)
    );
    const totalAdjusted = pendingRows.reduce((s, r) => s + toNum(r.AdUSDAmount), 0);
    const totalAdjustedM = pendingRows.reduce((s, r) => s + toNum(r.AdINRCurAmt), 0);
    const entryTotal = Number((currencyText === "INR" ? totalAdjustedM : totalAdjusted).toFixed(2));

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

    setSubmitting(true);
    try {
      const res = await addPayWithExDiff(buildSavePayload());
      if (res?.success || res?.Success) {
        navigate("/payment/pay-with-exdiff-list", {
          state: { successMessage: res?.Data || res?.data || t("Payment saved successfully.") }
        });
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

  const accountSelectProps = (opts, value, setValue, input, setInput, setOpts, loadingFlag, placeholder, isDisabled) => ({
    styles: selectStyles,
    options: opts,
    value,
    onChange: (opt) => setValue(opt),
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
    isDisabled: !!isDisabled,
    inputValue: input,
    filterOption: null
  });

  const curLabel = (currencyOpts.find((c) => c.value === String(form.currency))?.label || "").toUpperCase();

  const totals = useMemo(() => {
    const carats = pendingRows.reduce((s, r) => s + toNum(getVal(r, "TotCts", "totCts")), 0);
    const usd = pendingRows.reduce((s, r) => s + toNum(getVal(r, "SCurAmt", "sCurAmt")), 0);
    const inr = pendingRows.reduce((s, r) => s + toNum(getVal(r, "MCurAmt", "mCurAmt")), 0);
    const adjUsd = pendingRows.reduce((s, r) => s + toNum(r.AdUSDAmount), 0);
    const adjInr = pendingRows.reduce((s, r) => s + toNum(r.AdINRCurAmt), 0);
    const exDiff = pendingRows.reduce((s, r) => s + toNum(r.ExDiffINR), 0);
    const remUsd = pendingRows.reduce((s, r) => s + toNum(r.RemUSDAmount), 0);
    const remInr = pendingRows.reduce((s, r) => s + toNum(r.RemINRCurAmt), 0);
    const pay = toNum(form.rec) > 0 ? toNum(form.rec) : toNum(form.paid);
    const unapplied = Number((pay - (toNum(form.sBaseRate) === 1 ? adjUsd : adjInr)).toFixed(2));
    return { carats, usd, inr, adjUsd, adjInr, exDiff, remUsd, remInr, unapplied };
  }, [pendingRows, form.rec, form.paid, form.sBaseRate]);

  const pageTitle = t("Add Payment & Receipt With ExDiff");
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
              <Button color="light" size="sm" onClick={() => navigate("/payment/pay-with-exdiff-list")}>
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
                <Col sm={1}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">
                      {t("Receive")}
                      {showRecStar && <span className="text-danger">*</span>}
                    </Label>
                    <Input
                      type="number"
                      className="form-control-sm"
                      style={fieldH}
                      value={form.rec}
                      disabled={locked}
                      onChange={(e) => onRecChange(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col sm={1}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">
                      {t("Paid")}
                      {showPaidStar && <span className="text-danger">*</span>}
                    </Label>
                    <Input
                      type="number"
                      className="form-control-sm"
                      style={fieldH}
                      value={form.paid}
                      disabled={locked}
                      onChange={(e) => onPaidChange(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col sm={2}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1 fw-semibold">{t("Currency")}</Label>
                    <Select
                      styles={selectStyles}
                      options={currencyOpts}
                      value={currencyOpts.find((c) => String(c.value) === String(form.currency)) || null}
                      onChange={(opt) => {
                        setField("currency", opt?.value || "");
                        if (opt?.value) applyCurrencyRates(opt.value);
                      }}
                      isDisabled={locked}
                      isClearable={false}
                    />
                  </FormGroup>
                </Col>
                <Col sm={1}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">
                      <span style={{ color: "cornflowerblue" }}>{masterSymbol}</span>{" "}
                      <span className="text-danger">{mOp}</span>                      
                    </Label>
                    {/* MVC AddPayWithExDiff: #BaseRate editable; readonly only while On Invoice is open */}
                    <Input
                      type="number"
                      className="form-control-sm"
                      style={fieldH}
                      value={form.mBaseRate}
                      readOnly={locked}
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
                    {/* MVC: #SBaseRate always readonly */}
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
                  <Button color="primary" size="sm" onClick={togglePendingGrid}>
                    {gridMode === "Invoice" ? t("Close Invoice") : t("On Invoice")}
                  </Button>
                  <Button color="primary" size="sm" onClick={handleSave} disabled={submitting || !gridMode}>
                    {submitting ? t("Saving...") : t("Save")}
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* MVC: pen-inv-table always in layout with totals + header row (16 cols, no Pay Rate / Unapplied) */}
          <Card className="shadow-sm border-0 rounded-3 mb-3">
            <CardBody>
              <div className="table-responsive" style={{ maxHeight: 320, overflow: "auto" }}>
                <Table className="table table-sm table-bordered table-striped align-middle mb-0" id="pen-inv-table">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th />
                      <th>
                        <Input
                          className="form-control-sm text-end"
                          style={{ color: "cornflowerblue", ...fieldH, minWidth: 100 }}
                          value={gridMode ? `${t("Total")}:` : ""}
                          readOnly
                          id="Total"
                        />
                      </th>
                      <th />
                      <th />
                      <th>
                        <Input
                          className="form-control-sm text-end"
                          style={{ color: "cornflowerblue", ...fieldH, minWidth: 80 }}
                          value={gridMode ? fmtNum(totals.carats, 3) : ""}
                          readOnly
                          id="CaratTotal"
                        />
                      </th>
                      <th />
                      <th>
                        <Input
                          className="form-control-sm text-end"
                          style={{ color: "cornflowerblue", ...fieldH, minWidth: 90 }}
                          value={gridMode ? fmtNum(totals.usd) : ""}
                          readOnly
                          id="UsdTotal"
                        />
                      </th>
                      <th>
                        <Input
                          className="form-control-sm text-end"
                          style={{ color: "cornflowerblue", ...fieldH, minWidth: 70 }}
                          value={gridMode ? (totals.usd ? fmtNum(totals.inr / totals.usd) : "0.00") : ""}
                          readOnly
                          id="InrRate"
                        />
                      </th>
                      <th>
                        <Input
                          className="form-control-sm text-end"
                          style={{ color: "cornflowerblue", ...fieldH, minWidth: 90 }}
                          value={gridMode ? fmtNum(totals.inr) : ""}
                          readOnly
                          id="InrAmt"
                        />
                      </th>
                      <th>
                        <Input
                          className="form-control-sm text-end"
                          style={{ color: "cornflowerblue", ...fieldH, minWidth: 90 }}
                          value={gridMode ? fmtNum(totals.adjUsd) : ""}
                          readOnly
                          id="AdjTotalAmt"
                        />
                      </th>
                      <th>
                        <Input
                          className="form-control-sm text-end"
                          style={{ color: "cornflowerblue", ...fieldH, minWidth: 90 }}
                          value={gridMode ? fmtNum(totals.adjInr) : ""}
                          readOnly
                          id="Adinramount"
                        />
                      </th>
                      <th>
                        <Input
                          className="form-control-sm text-end"
                          style={{ color: "cornflowerblue", ...fieldH, minWidth: 90 }}
                          value={gridMode ? fmtNum(totals.exDiff) : ""}
                          readOnly
                          id="TotExDiff"
                        />
                      </th>
                      <th>
                        <Input
                          className="form-control-sm text-end"
                          style={{ color: "cornflowerblue", ...fieldH, minWidth: 90 }}
                          value={gridMode ? fmtNum(totals.remUsd) : ""}
                          readOnly
                          id="Remusdamount"
                        />
                      </th>
                      <th>
                        <Input
                          className="form-control-sm text-end"
                          style={{ color: "cornflowerblue", ...fieldH, minWidth: 90 }}
                          value={gridMode ? fmtNum(totals.remInr) : ""}
                          readOnly
                          id="Reaminramount"
                        />
                      </th>
                      <th />
                      <th />
                    </tr>
                    <tr>
                      <th className="text-nowrap">{t("Date")}</th>
                      <th className="text-nowrap">{t("InvNo")}</th>
                      <th className="text-nowrap">{t("DueDate")}</th>
                      <th className="text-nowrap">{t("BillNo")}</th>
                      <th className="text-nowrap text-end">{t("Carats")}</th>
                      <th className="text-nowrap">{t("Inv.Cur")}</th>
                      <th className="text-nowrap text-end">{t("USD Amount")}</th>
                      <th className="text-nowrap text-end">{t("Base Rate")}</th>
                      <th className="text-nowrap text-end">{t("INR Amount")}</th>
                      <th className="text-nowrap text-end">{t("Adj USD Amt")}</th>
                      <th className="text-nowrap text-end">{t("Adj INR Amt")}</th>
                      <th className="text-nowrap text-end">{t("Ex Diff INR")}</th>
                      <th className="text-nowrap text-end">{t("Rem USD Amt")}</th>
                      <th className="text-nowrap text-end">{t("Rem INR Amt")}</th>
                      <th className="text-nowrap">{t("TrnType")}</th>
                      <th className="text-nowrap">{t("InvCode")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!gridMode || pendingRows.length === 0 ? (
                      <tr>
                        <td colSpan={16} className="text-center text-muted py-3">
                          {gridMode ? t("No data available in table") : ""}
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
                                minWidth: 70,
                                backgroundColor: toNum(form.sBaseRate) === 1 ? "#fed49c" : undefined
                              }}
                              value={fmtNum(getVal(row, "SCurAmt", "sCurAmt"))}
                              readOnly
                            />
                          </td>
                          <td>
                            <Input
                              type="text"
                              className="form-control-sm text-end"
                              style={{ ...fieldH, minWidth: 60 }}
                              value={fmtNum(getVal(row, "BaseRate", "baseRate"))}
                              readOnly
                            />
                          </td>
                          <td>
                            <Input
                              type="text"
                              className="form-control-sm text-end"
                              style={{
                                ...fieldH,
                                minWidth: 80,
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
                                minWidth: 85,
                                backgroundColor: "#98ecc2"
                              }}
                              value={row.AdUSDAmount ?? 0}
                              readOnly={curLabel === "INR"}
                              onClick={() => autoFillRow(idx, "AdUSDAmount")}
                              onChange={(e) => updatePendingRow(idx, "AdUSDAmount", e.target.value)}
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              className="form-control-sm text-end"
                              style={{ ...fieldH, minWidth: 90 }}
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
                              style={{ ...fieldH, minWidth: 90 }}
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
                                minWidth: 75,
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
                                minWidth: 90,
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
        </Container>
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default PayWithExDiffForm;
