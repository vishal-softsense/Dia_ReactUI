import React, { useCallback, useEffect, useState } from "react";
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
  Row
} from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import {
  addLoanGiven,
  editLoanGiven,
  getAccGrpMasters,
  getCurrencyRates,
  getLoanGivenDetail,
  getLoanGivenPageData
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

const buildPayload = (form, party, broker, ftParty) => ({
  Code: toNum(form.code),
  Date: form.date,
  RenewDate: form.renewDate,
  Due_Date: form.dueDate,
  DueDays: toNum(form.dueDays),
  InvNo: toNum(form.invNo),
  Party: toNum(party?.value),
  Broker: toNum(broker?.value),
  FTParty: toNum(ftParty?.value),
  Currency: toNum(form.currency),
  MBaseRate: toNum(form.mBaseRate),
  SBaseRate: toNum(form.sBaseRate),
  Brokerper: toNum(form.brokerper),
  Amount: toNum(form.amount),
  InterestPer: toNum(form.interestPer),
  DivideDays: toNum(form.divideDays, 365),
  Disc: form.disc || "",
  OutStanding: !!form.outStanding
});

const LoanGivenForm = ({ mode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("Id");
  const isEdit = mode === "edit" && !!editId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currencyOpts, setCurrencyOpts] = useState([]);
  const [masterSymbol, setMasterSymbol] = useState("INR");
  const [stockSymbol, setStockSymbol] = useState("USD");
  const [mOp, setMOp] = useState("");
  const [sOp, setSOp] = useState("");

  const [party, setParty] = useState(null);
  const [broker, setBroker] = useState(null);
  const [ftParty, setFtParty] = useState(null);
  const [partyInput, setPartyInput] = useState("");
  const [brokerInput, setBrokerInput] = useState("");
  const [ftPartyInput, setFtPartyInput] = useState("");
  const [partyOpts, setPartyOpts] = useState([]);
  const [brokerOpts, setBrokerOpts] = useState([]);
  const [ftPartyOpts, setFtPartyOpts] = useState([]);
  const [partyLoading, setPartyLoading] = useState(false);
  const [brokerLoading, setBrokerLoading] = useState(false);
  const [ftPartyLoading, setFtPartyLoading] = useState(false);

  const [form, setForm] = useState({
    code: 0,
    invNo: "",
    date: todayIso(),
    renewDate: todayIso(),
    dueDate: todayIso(),
    dueDays: 0,
    currency: "",
    mBaseRate: 85,
    sBaseRate: 1,
    brokerper: 0,
    amount: "",
    interestPer: 0,
    divideDays: 365,
    outStanding: false,
    disc: ""
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
    const tmr = setTimeout(() => searchAccounts(partyInput, setPartyOpts, setPartyLoading), 400);
    return () => clearTimeout(tmr);
  }, [partyInput, searchAccounts]);

  useEffect(() => {
    const tmr = setTimeout(() => searchAccounts(brokerInput, setBrokerOpts, setBrokerLoading), 400);
    return () => clearTimeout(tmr);
  }, [brokerInput, searchAccounts]);

  useEffect(() => {
    const tmr = setTimeout(() => searchAccounts(ftPartyInput, setFtPartyOpts, setFtPartyLoading), 400);
    return () => clearTimeout(tmr);
  }, [ftPartyInput, searchAccounts]);

  const applyCurrencyRates = async (curCode) => {
    if (!curCode) return;
    try {
      const res = await getCurrencyRates(curCode);
      if (res?.success || res?.Success) {
        setMOp(getVal(res, "MasterCurrencyOperator", "masterCurrencyOperator") || "*");
        setSOp(getVal(res, "StockCurrencyOperator", "stockCurrencyOperator") || "*");
        setForm((prev) => ({
          ...prev,
          mBaseRate: toNum(res.baseRate ?? res.BaseRate, prev.mBaseRate),
          sBaseRate: toNum(res.sBaseRate ?? res.SBaseRate, prev.sBaseRate)
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPageData = async () => {
    const res = await getLoanGivenPageData();
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
      mBaseRate: toNum(d.MBaseRate ?? d.mBaseRate, 85),
      sBaseRate: toNum(d.SBaseRate ?? d.sBaseRate, 1)
    };
  };

  const loadDetail = async () => {
    if (!editId) return;
    const res = await getLoanGivenDetail(editId);
    if (!(res?.success || res?.Success)) {
      toast.error(res?.Data || res?.data || t("Record not found."));
      return;
    }
    const d = res.Data || res.data || {};
    setParty(
      d.Party || d.party
        ? { value: String(d.Party ?? d.party), label: d.PartyName || d.partyName || String(d.Party ?? d.party) }
        : null
    );
    setBroker(
      d.Broker || d.broker
        ? { value: String(d.Broker ?? d.broker), label: d.BrokerName || d.brokerName || String(d.Broker ?? d.broker) }
        : null
    );
    setFtParty(
      d.FTParty || d.ftParty
        ? { value: String(d.FTParty ?? d.ftParty), label: d.FTPartyName || d.ftPartyName || String(d.FTParty ?? d.ftParty) }
        : null
    );
    setForm({
      code: toNum(d.Code ?? d.code),
      invNo: String(d.InvNo ?? d.invNo ?? ""),
      date: toLocalDateStr(d.Date ?? d.date) || todayIso(),
      renewDate: toLocalDateStr(d.RenewDate ?? d.renewDate) || todayIso(),
      dueDate: toLocalDateStr(d.Due_Date ?? d.due_Date ?? d.dueDate) || todayIso(),
      dueDays: toNum(d.DueDays ?? d.dueDays),
      currency: String(d.Currency ?? d.currency ?? ""),
      mBaseRate: toNum(d.MBaseRate ?? d.mBaseRate, 85),
      sBaseRate: toNum(d.SBaseRate ?? d.sBaseRate, 1),
      brokerper: toNum(d.Brokerper ?? d.brokerper),
      amount: d.Amount ?? d.amount ?? "",
      interestPer: toNum(d.InterestPer ?? d.interestPer),
      divideDays: toNum(d.DivideDays ?? d.divideDays, 365),
      outStanding: !!(d.OutStanding ?? d.outStanding),
      disc: d.Disc ?? d.disc ?? ""
    });
    const loadedCur = String(d.Currency ?? d.currency ?? "");
    if (loadedCur) await applyCurrencyRates(loadedCur);
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
            mBaseRate: page.mBaseRate,
            sBaseRate: page.sBaseRate
          }));
          await applyCurrencyRates(defaultCur.value);
        }
      }
      setLoading(false);
    })();
  }, [editId, isEdit]);

  const handleSubmit = async () => {
    if (!party?.value) {
      toast.warning(t("Please select Party."));
      return;
    }
    if (!form.amount) {
      toast.warning(t("Please enter Amount."));
      return;
    }
    if (!form.mBaseRate || !form.sBaseRate) {
      toast.warning(t("Please enter currency rates."));
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload(form, party, broker, ftParty);
      const res = isEdit ? await editLoanGiven(payload) : await addLoanGiven(payload);
      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || t("Saved successfully."));
        if (isEdit) {
          navigate("/loan/loangiven-list", { state: { successMessage: res?.Data || res?.data } });
        } else {
          setForm({
            code: 0,
            invNo: "",
            date: todayIso(),
            renewDate: todayIso(),
            dueDate: todayIso(),
            dueDays: 0,
            currency: form.currency,
            mBaseRate: form.mBaseRate,
            sBaseRate: form.sBaseRate,
            brokerper: 0,
            amount: "",
            interestPer: 0,
            divideDays: 365,
            outStanding: false,
            disc: ""
          });
          setParty(null);
          setBroker(null);
          setFtParty(null);
        }
      } else {
        toast.error(res?.Data || res?.data || t("Save failed."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Save failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const pageTitle = isEdit ? t("Edit Loan Given") : t("Add Loan Given");
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
        <BreadCrumb title={pageTitle} pageTitle="Loans" />
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <i className="ri-bank-line align-middle me-1" />
              {pageTitle}
            </h5>
            <div className="d-flex gap-2">
              <Button color="light" size="sm" onClick={() => navigate("/loan/loangiven-list")}>
                {t("Back")}
              </Button>
              <Button color="primary" size="sm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? t("Submitting...") : t("Submit")}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <Row className="g-2">
              <Col md={2} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">{t("INV NO")}</Label>
                  <Input type="text" className="form-control-sm custom-readonly-input" style={fieldH} value={form.invNo} readOnly placeholder={t("INV No")} />
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={2} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">{t("DATE")}</Label>
                  <Input type="date" className="form-control-sm" style={fieldH} value={form.date} onChange={(e) => setField("date", e.target.value)} />
                </FormGroup>
              </Col>
              <Col md={2} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">{t("RENEW DATE")}</Label>
                  <Input type="date" className="form-control-sm" style={fieldH} value={form.renewDate} onChange={(e) => setField("renewDate", e.target.value)} />
                </FormGroup>
              </Col>
              <Col md={2} sm={4} className="d-flex align-items-end">
                <FormGroup check className="mb-2">
                  <Input type="checkbox" id="outStanding" checked={form.outStanding} onChange={(e) => setField("outStanding", e.target.checked)} />
                  <Label check htmlFor="outStanding" className="ms-1">
                    {t("Outstanding")}
                  </Label>
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={3} sm={6}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    {t("Party Name")}
                    <Link to="/account/add-accountgroup" className="ms-2 small text-primary" target="_blank">
                      {t("Add Account/Group")}
                    </Link>
                  </Label>
                  <Select {...accountSelectProps(partyOpts, party, setParty, partyInput, setPartyInput, setPartyOpts, partyLoading, t("Search Party"))} />
                </FormGroup>
              </Col>
              <Col md={2} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">{t("Due Date")}</Label>
                  <Input type="date" className="form-control-sm" style={fieldH} value={form.dueDate} onChange={(e) => setField("dueDate", e.target.value)} />
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={3} sm={6}>
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
              <Col md={2} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    <span className="text-primary">{masterSymbol}</span>
                    {mOp && <span className="text-muted ms-1">({mOp})</span>}
                    <span className="text-danger ms-1">*</span>
                  </Label>
                  <Input type="number" className="form-control-sm" style={fieldH} value={form.mBaseRate} onChange={(e) => setField("mBaseRate", e.target.value)} />
                </FormGroup>
              </Col>
              <Col md={2} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    <span className="text-primary">{stockSymbol}</span>
                    {sOp && <span className="text-muted ms-1">({sOp})</span>}
                    <span className="text-danger ms-1">*</span>
                  </Label>
                  <Input type="number" className="form-control-sm" style={fieldH} value={form.sBaseRate} onChange={(e) => setField("sBaseRate", e.target.value)} />
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={3} sm={6}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">{t("Broker")}</Label>
                  <Select {...accountSelectProps(brokerOpts, broker, setBroker, brokerInput, setBrokerInput, setBrokerOpts, brokerLoading, t("Search Broker"))} />
                </FormGroup>
              </Col>
              <Col md={2} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">{t("Broker %")}</Label>
                  <Input type="number" className="form-control-sm" style={fieldH} value={form.brokerper} onChange={(e) => setField("brokerper", e.target.value)} />
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={3} sm={6}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">{t("Amount")}</Label>
                  <Input type="number" className="form-control-sm" style={fieldH} value={form.amount} onChange={(e) => setField("amount", e.target.value)} placeholder={t("Amount")} />
                </FormGroup>
              </Col>
              <Col md={2} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">{t("Interest %")}</Label>
                  <Input type="number" className="form-control-sm" style={fieldH} value={form.interestPer} onChange={(e) => setField("interestPer", e.target.value)} placeholder={t("Interest")} />
                </FormGroup>
              </Col>
              <Col md={2} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">{t("Divide Days")}</Label>
                  <Input type="number" className="form-control-sm" style={fieldH} value={form.divideDays} onChange={(e) => setField("divideDays", e.target.value)} />
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={3} sm={6}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">{t("Rec. From Party")}</Label>
                  <Select {...accountSelectProps(ftPartyOpts, ftParty, setFtParty, ftPartyInput, setFtPartyInput, setFtPartyOpts, ftPartyLoading, t("Search From/To Party"))} />
                </FormGroup>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default LoanGivenForm;
