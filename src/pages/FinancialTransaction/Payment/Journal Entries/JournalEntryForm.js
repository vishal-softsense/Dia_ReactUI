import React, { useCallback, useEffect, useState } from "react";
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
  Row
} from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import {
  addJournalEntry,
  editJournalEntry,
  getAccGrpMasters,
  getCurrencyRates,
  getJournalEntryDetail,
  getJournalEntryPageData
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

const toLocalDateStr = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const mapBasic = (list = []) =>
  (list || []).map((x) => ({
    value: String(getVal(x, "ID", "Id", "id") || getVal(x, "Name")),
    label: getVal(x, "Name", "TextName", "textName") || String(getVal(x, "ID"))
  }));

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
    color: s.isDisabled ? "var(--vz-secondary-color, #878a99)" : "var(--vz-body-color, #495057)"
  })
};

const JournalEntryForm = ({ mode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("Id") || searchParams.get("id");
  const isEdit = mode === "edit" && !!editId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currencyOpts, setCurrencyOpts] = useState([]);
  const [masterSymbol, setMasterSymbol] = useState("INR");
  const [stockSymbol, setStockSymbol] = useState("USD");
  const [mOp, setMOp] = useState("");
  const [sOp, setSOp] = useState("");

  const [crAccount, setCrAccount] = useState(null);
  const [drAccount, setDrAccount] = useState(null);
  const [crInput, setCrInput] = useState("");
  const [drInput, setDrInput] = useState("");
  const [crOpts, setCrOpts] = useState([]);
  const [drOpts, setDrOpts] = useState([]);
  const [crLoading, setCrLoading] = useState(false);
  const [drLoading, setDrLoading] = useState(false);

  const [form, setForm] = useState({
    gcode: "",
    transDate: todayIso(),
    currency: "",
    baseRate: "",
    sRate: "",
    amt: "0.00",
    desc: ""
  });

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
    const tmr = setTimeout(() => searchAccounts(crInput, setCrOpts, setCrLoading), 400);
    return () => clearTimeout(tmr);
  }, [crInput, searchAccounts]);

  useEffect(() => {
    const tmr = setTimeout(() => searchAccounts(drInput, setDrOpts, setDrLoading), 400);
    return () => clearTimeout(tmr);
  }, [drInput, searchAccounts]);

  const applyCurrencyRates = async (curCode) => {
    if (!curCode) return;
    try {
      const res = await getCurrencyRates(curCode);
      if (res?.success || res?.Success) {
        setMOp(getVal(res, "MasterCurrencyOperator", "masterCurrencyOperator") || "*");
        setSOp(getVal(res, "StockCurrencyOperator", "stockCurrencyOperator") || "*");
        setForm((prev) => ({
          ...prev,
          baseRate: toNum(res.baseRate ?? res.BaseRate, prev.baseRate),
          sRate: toNum(res.sBaseRate ?? res.SBaseRate, prev.sRate)
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPageData = async () => {
    const res = await getJournalEntryPageData();
    if (!(res?.success || res?.Success)) {
      toast.error(res?.Data || res?.data || t("Failed to load page data."));
      return null;
    }
    const d = res.Data || res.data || {};
    const curs = mapBasic(d.CurrencyList || d.currencyList);
    setCurrencyOpts(curs);
    return {
      curs,
      defaultCurrencyCode: d.DefaultCurrencyCode || d.defaultCurrencyCode,
      mBaseRate: toNum(d.MBaseRate ?? d.mBaseRate, 0),
      sBaseRate: toNum(d.SBaseRate ?? d.sBaseRate, 0)
    };
  };

  const loadDetail = async () => {
    if (!editId) return;
    const res = await getJournalEntryDetail(editId);
    if (!(res?.success || res?.Success)) {
      toast.error(res?.Data || res?.data || t("Record not found."));
      return;
    }
    const d = res.Data || res.data || {};
    const vtype = String(getVal(d, "Vtype", "vtype") || "JV").toUpperCase();

    // MVC EditJournalEntries: for Vtype==JV, Cr=CAccount/mainacc, Dr=DAccount/trnacc
    const mainacc = toNum(d.mainacc);
    const trnacc = toNum(d.trnacc);
    const cName = getVal(d, "CAccount", "cAccount");
    const dName = getVal(d, "DAccount", "dAccount");

    if (vtype === "JV") {
      setCrAccount(mainacc ? { value: String(mainacc), label: cName || String(mainacc) } : null);
      setDrAccount(trnacc ? { value: String(trnacc), label: dName || String(trnacc) } : null);
    } else {
      setCrAccount(trnacc ? { value: String(trnacc), label: cName || String(trnacc) } : null);
      setDrAccount(mainacc ? { value: String(mainacc), label: dName || String(mainacc) } : null);
    }

    const curCode = String(d.CurCode ?? d.curCode ?? "");
    setForm({
      gcode: String(d.GCODE ?? d.gcode ?? editId),
      transDate: toLocalDateStr(d.Date ?? d.date) || todayIso(),
      currency: curCode,
      baseRate: toNum(d.MasterCurrencyRate ?? d.masterCurrencyRate, 0),
      sRate: toNum(d.StockCurrencyRate ?? d.stockCurrencyRate, 0),
      amt: Number(d.Amount ?? d.amount ?? 0).toFixed(2),
      desc: d.disc ?? d.Disc ?? ""
    });

    if (curCode) await applyCurrencyRates(curCode);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const page = await loadPageData();
      if (isEdit) {
        await loadDetail();
      } else if (page?.curs?.length) {
        const defaultCur = page.defaultCurrencyCode
          ? page.curs.find((c) => String(c.value) === String(page.defaultCurrencyCode))
          : page.curs[0];
        if (defaultCur) {
          setForm((prev) => ({
            ...prev,
            currency: defaultCur.value,
            baseRate: page.mBaseRate,
            sRate: page.sBaseRate
          }));
          await applyCurrencyRates(defaultCur.value);
        }
      }
      setLoading(false);
    })();
  }, [editId, isEdit]);

  const handleSubmit = async () => {
    if (!crAccount?.value) {
      toast.warning(t("Please select Recived[Cr.] Acc"));
      return;
    }
    if (!drAccount?.value) {
      toast.warning(t("Please select Paid[Dr.] Acc"));
      return;
    }
    if (String(crAccount.value) === String(drAccount.value)) {
      toast.warning(t("Not Select Same Account."));
      return;
    }
    const amt = toNum(form.amt);
    if (!(amt > 0)) {
      toast.warning(t("Please enter Amount."));
      return;
    }
    if (!form.currency) {
      toast.warning(t("Please select Currency."));
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        const payload = {
          GCODE: form.gcode,
          TransDate: form.transDate,
          mainacc: toNum(crAccount.value),
          trnacc: toNum(drAccount.value),
          CrAccount: toNum(crAccount.value),
          DrAccount: toNum(drAccount.value),
          Amt: amt,
          CurCode: toNum(form.currency),
          BaseRate: toNum(form.baseRate),
          SRate: toNum(form.sRate),
          disc: form.desc || "",
          Desc: form.desc || "",
          MOp: mOp || "*",
          SOp: sOp || "*"
        };
        const res = await editJournalEntry(payload);
        if (res?.success || res?.Success) {
          navigate("/payment/journal-entry-list", {
            state: { successMessage: res?.Data || res?.data || t("Journal Entry Updated successfully.") }
          });
        } else {
          toast.error(res?.Data || res?.data || t("Save failed."));
        }
      } else {
        // MVC SubmitJV → /payments/save-jv
        const payload = {
          CrAccount: toNum(crAccount.value),
          DrAccount: toNum(drAccount.value),
          TransDate: form.transDate,
          Amt: amt,
          CurCode: toNum(form.currency),
          BaseRate: toNum(form.baseRate),
          SRate: toNum(form.sRate),
          Desc: form.desc || "",
          MOp: mOp || "*",
          SOp: sOp || "*"
        };
        const res = await addJournalEntry(payload);
        if (res?.success || res?.Success) {
          toast.success(res?.Data || res?.data || t("Payment successfully."));
          setForm((prev) => ({
            ...prev,
            amt: "0.00",
            desc: ""
          }));
          setCrAccount(null);
          setDrAccount(null);
        } else {
          toast.error(res?.Data || res?.data || t("Save failed."));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Save failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const pageTitle = isEdit ? t("Edit Journal Entry") : t("Add Journal Entry");
  document.title = pageTitle;

  const accountSelectProps = (opts, value, onChange, input, setInput, setOpts, loading, placeholder) => ({
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
    isLoading: loading,
    placeholder,
    isClearable: true
  });

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center py-5">{t("Loading...")}</div>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <ToastContainer closeButton={false} />
      <Container fluid>
        <BreadCrumb title={pageTitle} pageTitle={t("Payment")} />

        <Card className="shadow-sm border-0 rounded-3 mb-3">
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom-0 bg-transparent">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className="ri-bank-card-line fs-20" />
              {pageTitle}
            </h5>
            <Button color="light" size="sm" onClick={() => navigate("/payment/journal-entry-list")}>
              <i className="ri-arrow-left-line me-1" />
              {t("Back to List")}
            </Button>
          </CardHeader>
          <CardBody className="pt-0">
            <Row className="g-2">
              <Col md={2} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    <b>{t("Transaction Date")}</b>
                  </Label>
                  <Input
                    type="date"
                    className="form-control-sm"
                    style={fieldH}
                    value={form.transDate}
                    onChange={(e) => setField("transDate", e.target.value)}
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={3} sm={6}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    <b>{t("Recived[Cr.] Acc")}</b>
                    <span className="text-danger ms-1">*</span>
                  </Label>
                  <Select
                    {...accountSelectProps(
                      crOpts,
                      crAccount,
                      setCrAccount,
                      crInput,
                      setCrInput,
                      setCrOpts,
                      crLoading,
                      t("Transaction Account")
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={3} sm={6}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    <b>{t("Paid[Dr.] Acc")}</b>
                    <span className="text-danger ms-1">*</span>
                  </Label>
                  <Select
                    {...accountSelectProps(
                      drOpts,
                      drAccount,
                      setDrAccount,
                      drInput,
                      setDrInput,
                      setDrOpts,
                      drLoading,
                      t("Transaction Account")
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={2} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    {t("Amount")}
                    <span className="text-danger ms-1">*</span>
                  </Label>
                  <Input
                    type="number"
                    className="form-control-sm text-end"
                    style={fieldH}
                    value={form.amt}
                    onChange={(e) => setField("amt", e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md={1} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">{t("Currency")}</Label>
                  <Select
                    styles={selectStyles}
                    options={currencyOpts}
                    value={currencyOpts.find((o) => o.value === String(form.currency)) || null}
                    onChange={async (o) => {
                      const code = o?.value || "";
                      setField("currency", code);
                      await applyCurrencyRates(code);
                    }}
                    placeholder={t("Currency")}
                  />
                </FormGroup>
              </Col>
              <Col md={1} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    <span className="text-primary">{masterSymbol}</span>
                    {mOp && <span className="text-danger ms-1">{mOp}</span>}
                  </Label>
                  <Input
                    type="number"
                    className="form-control-sm"
                    style={fieldH}
                    value={form.baseRate}
                    readOnly
                  />
                </FormGroup>
              </Col>
              <Col md={1} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    <span className="text-primary">{stockSymbol}</span>
                    {sOp && <span className="text-danger ms-1">{sOp}</span>}
                  </Label>
                  <Input
                    type="number"
                    className="form-control-sm"
                    style={fieldH}
                    value={form.sRate}
                    readOnly
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-2 align-items-end">
              <Col md={4} sm={8}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    <b>{t("Description")}</b>
                  </Label>
                  <Input
                    type="textarea"
                    rows={4}
                    value={form.desc}
                    onChange={(e) => setField("desc", e.target.value)}
                    placeholder={t("Description")}
                  />
                </FormGroup>
              </Col>
              <Col md={2} sm={4} className="mb-2">
                <Button color="primary" size="sm" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? t("Submitting...") : isEdit ? t("Update") : t("Save")}
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default JournalEntryForm;
