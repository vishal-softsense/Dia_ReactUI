import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  FormGroup,
  Label,
  Input,
  Spinner
} from "reactstrap";
import Select from "react-select";

import { toast, ToastContainer } from "react-toastify";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import {
  getMonthAnalysisReport,
  getMonthAnalysisDropdowns,
  getAccGrpMasters
} from "../../helpers/fakebackend_helper";
import MonthAnalysisPivotView from "./MonthAnalysisPivotView";

const MonthAnalysisReport = () => {
  const { t } = useTranslation();

  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState(new Date().toISOString().substring(0, 10));
  const [fromDateDue, setFromDateDue] = useState("2025-01-01");
  const [toDateDue, setToDateDue] = useState(new Date().toISOString().substring(0, 10));
  const [dueChkBox, setDueChkBox] = useState(false);

  const [currency, setCurrency] = useState("");
  const [dispCurrency, setDispCurrency] = useState("");
  const [type, setType] = useState("");
  const [subType, setSubType] = useState("");
  const [category, setCategory] = useState("");
  const [groupBy, setGroupBy] = useState("Party");

  const [chkPurchase, setChkPurchase] = useState(true);
  const [chkSale, setChkSale] = useState(false);
  const [chkPayable, setChkPayable] = useState(false);
  const [chkReceivable, setChkReceivable] = useState(false);

  const [dropdownOptions, setDropdownOptions] = useState({
    type: [],
    subType: [],
    category: [],
    currency: []
  });

  const [partyInput, setPartyInput] = useState("");
  const [partyOptions, setPartyOptions] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [loadingParties, setLoadingParties] = useState(false);

  const [brokerInput, setBrokerInput] = useState("");
  const [brokerOptions, setBrokerOptions] = useState([]);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [loadingBrokers, setLoadingBrokers] = useState(false);

  const [commissionInput, setCommissionInput] = useState("");
  const [commissionOptions, setCommissionOptions] = useState([]);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [loadingCommissions, setLoadingCommissions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [searched, setSearched] = useState(false);
  const [activeReportType, setActiveReportType] = useState("");
  // MVC-style: filters open by default; collapse after Generate, reopen via chevron
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const response = await getMonthAnalysisDropdowns();
        if (response.success || response.Success) {
          const data = response.data || response.Data || {};
          setDropdownOptions({
            type: data.type || [],
            subType: data.subType || [],
            category: data.category || [],
            currency: data.currency || []
          });
        }
      } catch (err) {
        toast.error("Failed to load dropdown filters");
      }
    };
    fetchDropdowns();
  }, []);

  const handleAccountSearch = async (term, setOptions, setLoadingState) => {
    if (!term || term.length < 2) {
      setOptions([]);
      return;
    }
    setLoadingState(true);
    try {
      const response = await getAccGrpMasters(term);
      if (response.success || response.Success) {
        const data = response.data || response.Data || [];
        setOptions(
          data.map((item) => ({
            value: item.accGrpCode || item.AccGrpCode,
            label: item.accGrpName || item.AccGrpName
          }))
        );
      }
    } catch (err) {
      console.error("Account search error", err);
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleAccountSearch(partyInput, setPartyOptions, setLoadingParties);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [partyInput]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleAccountSearch(brokerInput, setBrokerOptions, setLoadingBrokers);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [brokerInput]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleAccountSearch(commissionInput, setCommissionOptions, setLoadingCommissions);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [commissionInput]);

  const handleCheckChange = (mode, checked) => {
    if (mode === "purchase") {
      setChkPurchase(checked);
      if (checked) {
        setChkPayable(false);
        setChkReceivable(false);
      }
    } else if (mode === "sale") {
      setChkSale(checked);
      if (checked) {
        setChkPayable(false);
        setChkReceivable(false);
      }
    } else if (mode === "payable") {
      setChkPayable(checked);
      if (checked) {
        setChkPurchase(false);
        setChkSale(false);
      }
    } else if (mode === "receivable") {
      setChkReceivable(checked);
      if (checked) {
        setChkPurchase(false);
        setChkSale(false);
      }
    }
  };

  const getReportTypeParam = () => {
    if (chkPurchase && chkSale) return "BothPurchaseSale";
    if (chkPurchase) return "Pur";
    if (chkSale) return "Sale";
    if (chkPayable && chkReceivable) return "BothReceivablePayable";
    if (chkPayable) return "Payable";
    if (chkReceivable) return "Receivable";
    return "";
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    const reportType = getReportTypeParam();
    if (!reportType) {
      toast.warning(
        "Please select at least one analysis mode (Purchase, Sale, Payable, or Receivable)"
      );
      return;
    }

    setLoading(true);
    setSearched(true);

    const payload = {
      fromDate,
      toDate,
      fromDueDate: fromDateDue,
      toDueDate: toDateDue,
      currency,
      type,
      subType,
      dispCurrency,
      party: selectedParty ? String(selectedParty.value) : "",
      broker: selectedBroker ? String(selectedBroker.value) : "",
      commission: selectedCommission ? String(selectedCommission.value) : "",
      category,
      groupBy,
      reportType,
      fromDueChkBox: dueChkBox
    };

    try {
      const response = await getMonthAnalysisReport(payload);
      if (response.success || response.Success) {
        const rawList = response.data || response.Data || [];
        const mappedList = rawList.map((item) => ({
          Year: item.Year ?? item.year,
          Month: item.Month ?? item.month,
          PartyName: item.PartyName ?? item.partyName,
          SortKey: item.SortKey ?? item.sortKey,
          TotalPayable: item.TotalPayable ?? item.totalPayable,
          TotalReceivable: item.TotalReceivable ?? item.totalReceivable,
          Pcs: item.Pcs ?? item.pcs,
          Cts: item.Cts ?? item.cts,
          Amt: item.Amt ?? item.amt,
          Disc: item.Disc ?? item.disc,
          Rate: item.Rate ?? item.rate,
          YearMonth: item.YearMonth ?? item.yearMonth,
          PurData: item.PurData ?? item.purData,
          SaleData: item.SaleData ?? item.saleData
        }));
        setReportData(mappedList);
        setActiveReportType(reportType);
        setShowFilterPanel(false); // collapse filters, show report (MVC SetSearchDiv report)
        if (!mappedList.length) {
          toast.info("No record found matching the configurations");
        }
      } else {
        toast.error(response.message || "Failed to load report data");
        setReportData([]);
        setShowFilterPanel(true);
      }
    } catch (err) {
      toast.error("Error generating report");
      setReportData([]);
      setShowFilterPanel(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFromDate("2025-01-01");
    setToDate("2025-12-31");
    setFromDateDue("2025-01-01");
    setToDateDue("2025-12-31");
    setDueChkBox(false);
    setCurrency("");
    setDispCurrency("");
    setType("");
    setSubType("");
    setCategory("");
    setGroupBy("Party");
    setChkPurchase(true);
    setChkSale(false);
    setChkPayable(false);
    setChkReceivable(false);
    setSelectedParty(null);
    setSelectedBroker(null);
    setSelectedCommission(null);
    setReportData([]);
    setSearched(false);
    setActiveReportType("");
    setShowFilterPanel(true);
  };

  /** MVC SetSearchDiv('search') — hide report, show filter card again */
  const openFilterPanel = () => {
    setShowFilterPanel(true);
  };

  document.title = `${t("Month Analysis Report")} | ${t("Admin")}`;

  const showReport = searched && !showFilterPanel;

  return (
    <React.Fragment>
      <style>{`
        [data-layout-mode="dark"] .card {
          background-color: #1b1c21 !important;
          border-color: #2b2c32 !important;
        }
        [data-layout-mode="dark"] .text-muted {
          color: #adb5bd !important;
        }
        [data-layout-mode="dark"] label,
        [data-layout-mode="dark"] h5 {
          color: #e9ecef !important;
        }
        .e-license-banner,
        .e-js-licensing,
        .e-license {
          display: none !important;
          visibility: hidden !important;
        }
        .mar-page-header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 8px;
          border-bottom: none !important;
          box-shadow: none !important;
          padding-bottom: 0.75rem;
        }
        .mar-page-header::after {
          display: none !important;
        }
        .mar-page-header .mar-chevron-btn {
          border: none;
          background: transparent;
          color: #74788d;
          padding: 0 8px;
          line-height: 1;
          cursor: pointer;
          justify-self: center;
        }
        .mar-page-header .mar-chevron-btn:hover {
          color: #405189;
        }
        .par-chevron-btn {
          border: 1px solid var(--vz-border-color, #e9ebec);
          background: transparent;
          color: var(--vz-body-color, #212529);
          padding: 4px 10px;
          border-radius: 4px;
          cursor: pointer;
          line-height: 1;
        }
        .par-chevron-btn:hover {
          color: var(--vz-primary, #405189);
          border-color: var(--vz-primary, #405189);
        }
        .par-chevron-btn i {
          font-size: 20px;
        }
      `}</style>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Month Analysis Report")} pageTitle={t("Dashboard")} />

          {/* Top Control Bar */}
          <div className="card d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-3">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className="ri-calendar-todo-line fs-20 text-primary"></i>
              {t("Month Analysis Report")}
            </h5>

            <div className="d-flex align-items-center flex-wrap gap-2">
              {showFilterPanel && (
                <>
                  <Button
                    color="primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    type="submit"
                    form="month-analysis-form"
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : t("Report")}
                  </Button>
                  <Button
                    color="soft-secondary"
                    className="btn-sm rounded-2 px-3 py-1"
                    type="button"
                    onClick={handleClear}
                  >
                    {t("Clear")}
                  </Button>
                </>
              )}
              <button
                type="button"
                className="par-chevron-btn"
                title={showFilterPanel ? t("Collapse filters") : t("Expand filters")}
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                aria-label={showFilterPanel ? t("Collapse filters") : t("Expand filters")}
              >
                <i className={showFilterPanel ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
              </button>
            </div>
          </div>

          {showFilterPanel && (
            <Card className="shadow-lg border-0 rounded-3 mb-3">
              <CardBody className="bg-light-subtle py-2">
                <form id="month-analysis-form" onSubmit={handleSearch}>
                  <Row className="g-3 mb-3">
                    <Col md={12}>
                      <div className="d-flex flex-wrap gap-3 align-items-center">
                        <FormGroup check inline className="mb-0">
                          <Input
                            type="checkbox"
                            id="chkPurchase"
                            checked={chkPurchase}
                            disabled={chkPayable || chkReceivable}
                            onChange={(e) => handleCheckChange("purchase", e.target.checked)}
                          />
                          <Label check htmlFor="chkPurchase" className="ms-1">
                            {t("Purchase")}
                          </Label>
                        </FormGroup>
                        <FormGroup check inline className="mb-0">
                          <Input
                            type="checkbox"
                            id="chkSale"
                            checked={chkSale}
                            disabled={chkPayable || chkReceivable}
                            onChange={(e) => handleCheckChange("sale", e.target.checked)}
                          />
                          <Label check htmlFor="chkSale" className="ms-1">
                            {t("Sale")}
                          </Label>
                        </FormGroup>
                        <FormGroup check inline className="mb-0">
                          <Input
                            type="checkbox"
                            id="chkPayable"
                            checked={chkPayable}
                            disabled={chkPurchase || chkSale}
                            onChange={(e) => handleCheckChange("payable", e.target.checked)}
                          />
                          <Label check htmlFor="chkPayable" className="ms-1">
                            {t("Payable")}
                          </Label>
                        </FormGroup>
                        <FormGroup check inline className="mb-0">
                          <Input
                            type="checkbox"
                            id="chkReceivable"
                            checked={chkReceivable}
                            disabled={chkPurchase || chkSale}
                            onChange={(e) => handleCheckChange("receivable", e.target.checked)}
                          />
                          <Label check htmlFor="chkReceivable" className="ms-1">
                            {t("Receivable")}
                          </Label>
                        </FormGroup>
                      </div>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col md={2}>
                      <FormGroup>
                        <Label className="fw-medium">{t("From Date")}</Label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          style={{ height: "35px" }}
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={2}>
                      <FormGroup>
                        <Label className="fw-medium">{t("To Date")}</Label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          style={{ height: "35px" }}
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Input
                            type="checkbox"
                            id="dueChkBox"
                            checked={dueChkBox}
                            onChange={(e) => setDueChkBox(e.target.checked)}
                          />
                          <Label htmlFor="dueChkBox" className="mb-0 fw-medium">
                            {t("Due Date Range")}
                          </Label>
                        </div>
                        <div className="d-flex gap-2">
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={fromDateDue}
                            disabled={!dueChkBox}
                            onChange={(e) => setFromDateDue(e.target.value)}
                          />
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={toDateDue}
                            disabled={!dueChkBox}
                            onChange={(e) => setToDateDue(e.target.value)}
                          />
                        </div>
                      </FormGroup>
                    </Col>
                    <Col md={2}>
                      <FormGroup>
                        <Label className="fw-medium">{t("Group By")}</Label>
                        <select
                          className="form-select"
                          value={groupBy}
                          onChange={(e) => setGroupBy(e.target.value)}
                        >
                          <option value="Party">{t("Party")}</option>
                          <option value="Broker">{t("Broker")}</option>
                          <option value="Commission">{t("Commission Party")}</option>
                          <option value="Category">{t("Category")}</option>
                        </select>
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col md={4}>
                      <FormGroup>
                        <Label className="fw-medium">{t("Party")}</Label>
                        <Select
                          isClearable
                          isLoading={loadingParties}
                          options={partyOptions}
                          value={selectedParty}
                          onInputChange={(val) => setPartyInput(val)}
                          onChange={setSelectedParty}
                          placeholder={t("Type to search...")}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label className="fw-medium">{t("Broker")}</Label>
                        <Select
                          isClearable
                          isLoading={loadingBrokers}
                          options={brokerOptions}
                          value={selectedBroker}
                          onInputChange={(val) => setBrokerInput(val)}
                          onChange={setSelectedBroker}
                          placeholder={t("Type to search...")}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label className="fw-medium">{t("Commission Party")}</Label>
                        <Select
                          isClearable
                          isLoading={loadingCommissions}
                          options={commissionOptions}
                          value={selectedCommission}
                          onInputChange={(val) => setCommissionInput(val)}
                          onChange={setSelectedCommission}
                          placeholder={t("Type to search...")}
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col md={2}>
                      <FormGroup>
                        <Label className="fw-medium">{t("Category")}</Label>
                        <select
                          className="form-select"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="">{t("All...")}</option>
                          {dropdownOptions.category.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>
                    <Col md={2}>
                      <FormGroup>
                        <Label className="fw-medium">{t("Type")}</Label>
                        <select
                          className="form-select"
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                        >
                          <option value="">{t("All...")}</option>
                          {dropdownOptions.type.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>
                    <Col md={2}>
                      <FormGroup>
                        <Label className="fw-medium">{t("Sub Type")}</Label>
                        <select
                          className="form-select"
                          value={subType}
                          onChange={(e) => setSubType(e.target.value)}
                        >
                          <option value="">{t("All...")}</option>
                          {dropdownOptions.subType.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>
                    <Col md={2}>
                      <FormGroup>
                        <Label className="fw-medium">{t("Base Currency")}</Label>
                        <select
                          className="form-select"
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                        >
                          <option value="">{t("Default")}</option>
                          {dropdownOptions.currency.map((curr) => (
                            <option key={curr.id} value={curr.id}>
                              {curr.name}
                            </option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>
                    <Col md={2}>
                      <FormGroup>
                        <Label className="fw-medium">{t("Display Currency")}</Label>
                        <select
                          className="form-select"
                          value={dispCurrency}
                          onChange={(e) => setDispCurrency(e.target.value)}
                        >
                          <option value="">{t("Default")}</option>
                          {dropdownOptions.currency.map((curr) => (
                            <option key={curr.id} value={curr.id}>
                              {curr.name}
                            </option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>
                  </Row>
                </form>
              </CardBody>
            </Card>
          )}

          {showReport && (
            <Card className="shadow-lg border-0 rounded-3 mb-3">
              <CardBody className="p-3" style={{ minHeight: "calc(100vh - 310px)" }}>
                {loading ? (
                  <div className="text-center p-5">
                    <Spinner color="success" className="mb-2" />
                    <p className="text-muted mb-0">{t("Aggregating Month Analysis Matrix...")}</p>
                  </div>
                ) : reportData.length === 0 ? (
                  <div className="text-center p-5">
                    <h5 className="text-muted">{t("No record found matching the configurations")}</h5>
                  </div>
                ) : (
                  <MonthAnalysisPivotView
                    data={reportData}
                    reportType={activeReportType}
                    groupBy={groupBy}
                    chkPayable={chkPayable}
                    chkReceivable={chkReceivable}
                  />
                )}
              </CardBody>
            </Card>
          )}
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default MonthAnalysisReport;
