import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  FormGroup,
  Input,
  Label,
  Row
} from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";
import {
  getSolitaireConsumptionReport,
  getSolitaireConsumptionDropdowns
} from "../../../helpers/fakebackend_helper";
import SolitaireConsumptionPivotView from "./SolitaireConsumptionPivotView";

const toSelectOptions = (list = []) =>
  (list || []).map((item) => ({
    value: item.id ?? item.ID ?? item.name ?? item.Name,
    label: item.name ?? item.Name ?? item.id ?? item.ID
  }));

const SolitaireConsumptionReport = () => {
  const { t } = useTranslation();
  document.title = `${t("Stock Consumption Report")} | ${t("Reports")}`;

  const { fromDate: settingFrom, toDate: settingTo, getDates, mergeDates } = useSettingReportDates({
    includeDueDates: true
  });

  const [filters, setFilters] = useState({
    toDate: settingTo,
    fromDateDue: settingFrom,
    toDateDue: settingTo,
    fromDueChkBox: false,
    lotNo: "",
    shape: [],
    color: [],
    clarity: [],
    size: [],
    proportion: [],
    polish: [],
    symmetry: []
  });

  const [dropdowns, setDropdowns] = useState({
    shape: [],
    color: [],
    clarity: [],
    size: [],
    proportion: [],
    polish: [],
    symmetry: []
  });
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    setFilters((prev) => mergeDates({ ...prev }));
  }, [settingFrom, settingTo, mergeDates]);

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const response = await getSolitaireConsumptionDropdowns();
        if (response.success || response.Success) {
          const data = response.data || response.Data || {};
          setDropdowns({
            shape: toSelectOptions(data.shape),
            color: toSelectOptions(data.color),
            clarity: toSelectOptions(data.clarity),
            size: toSelectOptions(data.size),
            proportion: toSelectOptions(data.proportion),
            polish: toSelectOptions(data.polish),
            symmetry: toSelectOptions(data.symmetry)
          });
        }
      } catch (err) {
        toast.error(t("Failed to load dropdown filters"));
      } finally {
        setLoadingDropdowns(false);
      }
    };
    loadDropdowns();
  }, [t]);

  const multiValue = (selected) => (selected || []).map((o) => o.value);

  const handleSelectChange = (key, selected) => {
    setFilters((prev) => ({ ...prev, [key]: selected || [] }));
  };

  const handleClear = async () => {
    const d = await getDates();
    setFilters({
      toDate: d.toDate,
      fromDateDue: d.fromDate,
      toDateDue: d.toDate,
      fromDueChkBox: false,
      lotNo: "",
      shape: [],
      color: [],
      clarity: [],
      size: [],
      proportion: [],
      polish: [],
      symmetry: []
    });
    setReportData([]);
    setHasSearched(false);
  };

  const handleReport = async () => {
    setLoading(true);
    const payload = {
      toDate: filters.toDate,
      fromDateDue: filters.fromDateDue,
      toDateDue: filters.toDateDue,
      fromDueChkBox: filters.fromDueChkBox,
      lotNo: filters.lotNo,
      shape: multiValue(filters.shape),
      color: multiValue(filters.color),
      clarity: multiValue(filters.clarity),
      size: multiValue(filters.size),
      proportion: multiValue(filters.proportion),
      polish: multiValue(filters.polish),
      symmetry: multiValue(filters.symmetry)
    };

    try {
      const response = await getSolitaireConsumptionReport(payload);
      const ok = response?.success || response?.Success;
      if (ok) {
        const list = response.Data || response.data || [];
        setReportData(Array.isArray(list) ? list : []);
        setHasSearched(true);
        // Clear any previously saved broken pivot layout so default Clarity x Col loads
        try {
          localStorage.removeItem("pivotviewReports_StockConsumption");
        } catch (e) {
          /* ignore */
        }
        if (!list.length) {
          toast.info(t("No record found matching the configurations"));
        } else {
          toast.success(t("Report loaded successfully."));
        }
      } else {
        toast.warning(response?.message || response?.Message || t("Failed to load report data"));
        setReportData([]);
      }
    } catch (err) {
      console.error("Stock consumption report failed:", err);
      const msg =
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err?.response?.data?.Message || null;
      toast.error(msg || t("Server Connection Problem.."));
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const selectProps = useMemo(
    () => ({
      classNamePrefix: "react-select",
      isMulti: true,
      isClearable: true,
      isLoading: loadingDropdowns,
      menuPortalTarget: typeof document !== "undefined" ? document.body : null,
      styles: {
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        control: (provided) => ({
          ...provided,
          backgroundColor: "var(--vz-secondary-bg, #fff)",
          borderColor: "var(--vz-border-color, #ced4da)",
          color: "var(--vz-body-color, #495057)",
          height: "auto",
          minHeight: "35px"
        }),
        valueContainer: (provided) => ({
          ...provided,
          height: "auto",
          minHeight: "35px",
          padding: "0 6px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center"
        }),
        input: (provided) => ({ ...provided, margin: "0px", padding: "0px" }),
        indicatorSeparator: () => ({ display: "none" }),
        indicatorsContainer: (provided) => ({ ...provided, height: "33px" }),
        menu: (provided) => ({
          ...provided,
          backgroundColor: "var(--vz-secondary-bg, #fff)",
          color: "var(--vz-body-color, #495057)",
          border: "1px solid var(--vz-border-color, #dee2e6)",
          zIndex: 20
        }),
        option: (provided, state) => ({
          ...provided,
          backgroundColor: state.isFocused ? "#3b5de7" : "transparent",
          color: state.isFocused ? "#ffffff" : "var(--vz-body-color, #495057)",
          cursor: "pointer",
          padding: "4px 10px",
          fontSize: "11px",
          ":active": { backgroundColor: "#3b5de7" }
        }),
        placeholder: (provided) => ({
          ...provided,
          color: "var(--vz-secondary-color, #878a99)",
          fontSize: "11px"
        }),
        singleValue: (provided) => ({
          ...provided,
          color: "var(--vz-body-color, #495057)",
          fontSize: "11px"
        }),
        multiValue: (provided) => ({
          ...provided,
          backgroundColor: "rgba(59, 93, 231, 0.15)",
          color: "var(--vz-body-color, #495057)"
        }),
        multiValueLabel: (provided) => ({
          ...provided,
          color: "var(--vz-body-color, #495057)"
        }),
        multiValueRemove: (provided) => ({
          ...provided,
          color: "var(--vz-body-color, #495057)",
          ":hover": {
            backgroundColor: "#3b5de7",
            color: "#ffffff"
          }
        })
      }
    }),
    [loadingDropdowns]
  );

  return (
    <React.Fragment>
      <ToastContainer />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Stock Consumption Report")} pageTitle={t("Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i
                className={
                  hasSearched
                    ? "ri-database-2-line fs-20 text-primary"
                    : "ri-search-eye-line fs-20 text-primary"
                }
              ></i>
              {hasSearched
                ? t("Stock Consumption Report Results")
                : t("Stock Consumption Report Filters")}
            </h5>
            <div className="d-flex gap-2 flex-wrap">
              {!hasSearched ? (
                <>
                  <Button
                    color="primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={handleReport}
                    disabled={loading}
                  >
                    {loading ? t("Loading...") : t("Report")}
                  </Button>
                  <Button
                    color="soft-secondary"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={handleClear}
                    disabled={loading}
                  >
                    {t("Clear")}
                  </Button>
                </>
              ) : (
                <Button
                  color="primary"
                  className="btn-sm rounded-2 px-3 py-1"
                  onClick={() => {
                    setHasSearched(false);
                    setReportData([]);
                  }}
                >
                  {t("New Search")}
                </Button>
              )}
            </div>
          </div>

          {!hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody className="bg-light-subtle">
                <Row className="g-3">
                  <Col lg={10}>
                    <Row className="g-3">
                      <Col md={4} sm={6} xl={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Stock Till Date")}</Label>
                          <Input
                            type="date"
                            className="form-control-sm"
                            value={filters.toDate || ""}
                            onChange={(e) =>
                              setFilters((prev) => ({ ...prev, toDate: e.target.value }))
                            }
                          />
                        </FormGroup>
                      </Col>

                      <Col md={4} sm={6} xl={2}>
                        <FormGroup className="mb-0">
                          <div className="form-check mb-1">
                            <Input
                              type="checkbox"
                              className="form-check-input"
                              id="FromDueChkBox"
                              checked={filters.fromDueChkBox}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  fromDueChkBox: e.target.checked
                                }))
                              }
                            />
                            <Label className="form-check-label fw-semibold small" htmlFor="FromDueChkBox">
                              {t("From Sale Date")}
                            </Label>
                          </div>
                          <Input
                            type="date"
                            className="form-control-sm"
                            value={filters.fromDateDue || ""}
                            disabled={!filters.fromDueChkBox}
                            onChange={(e) =>
                              setFilters((prev) => ({ ...prev, fromDateDue: e.target.value }))
                            }
                          />
                        </FormGroup>
                      </Col>

                      <Col md={4} sm={6} xl={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("To Sale Date")}</Label>
                          <Input
                            type="date"
                            className="form-control-sm"
                            value={filters.toDateDue || ""}
                            disabled={!filters.fromDueChkBox}
                            onChange={(e) =>
                              setFilters((prev) => ({ ...prev, toDateDue: e.target.value }))
                            }
                          />
                        </FormGroup>
                      </Col>

                      <Col md={4} sm={6} xl={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Shape")}</Label>
                          <Select
                            {...selectProps}
                            options={dropdowns.shape}
                            value={filters.shape}
                            onChange={(sel) => handleSelectChange("shape", sel)}
                            placeholder={t("Shape")}
                          />
                        </FormGroup>
                      </Col>

                      <Col md={4} sm={6} xl={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Color")}</Label>
                          <Select
                            {...selectProps}
                            options={dropdowns.color}
                            value={filters.color}
                            onChange={(sel) => handleSelectChange("color", sel)}
                            placeholder={t("Color")}
                          />
                        </FormGroup>
                      </Col>

                      <Col md={4} sm={6} xl={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Clarity")}</Label>
                          <Select
                            {...selectProps}
                            options={dropdowns.clarity}
                            value={filters.clarity}
                            onChange={(sel) => handleSelectChange("clarity", sel)}
                            placeholder={t("Clarity")}
                          />
                        </FormGroup>
                      </Col>

                      <Col md={4} sm={6} xl={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Size")}</Label>
                          <Select
                            {...selectProps}
                            options={dropdowns.size}
                            value={filters.size}
                            onChange={(sel) => handleSelectChange("size", sel)}
                            placeholder={t("Size")}
                          />
                        </FormGroup>
                      </Col>

                      <Col md={4} sm={6} xl={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Prop.")}</Label>
                          <Select
                            {...selectProps}
                            options={dropdowns.proportion}
                            value={filters.proportion}
                            onChange={(sel) => handleSelectChange("proportion", sel)}
                            placeholder={t("Proportion")}
                          />
                        </FormGroup>
                      </Col>

                      <Col md={4} sm={6} xl={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Polish")}</Label>
                          <Select
                            {...selectProps}
                            options={dropdowns.polish}
                            value={filters.polish}
                            onChange={(sel) => handleSelectChange("polish", sel)}
                            placeholder={t("Polish")}
                          />
                        </FormGroup>
                      </Col>

                      <Col md={4} sm={6} xl={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Sym.")}</Label>
                          <Select
                            {...selectProps}
                            options={dropdowns.symmetry}
                            value={filters.symmetry}
                            onChange={(sel) => handleSelectChange("symmetry", sel)}
                            placeholder={t("Symmetry")}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>

                  <Col lg={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Enter Lot No")}</Label>
                      <Input
                        type="textarea"
                        value={filters.lotNo}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, lotNo: e.target.value }))
                        }
                        placeholder={t("Search by lot no")}
                        className="form-control-sm"
                        style={{ height: "140px", resize: "none" }}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          )}

          {hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="small text-muted">
                    {t("Stock Consumption")} · {reportData.length} {t("records")}
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-5 text-muted">{t("Loading...")}</div>
                ) : reportData.length === 0 ? (
                  <div className="text-center py-5 text-muted">{t("No data available.")}</div>
                ) : (
                  <SolitaireConsumptionPivotView data={reportData} />
                )}
              </CardBody>
            </Card>
          )}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default SolitaireConsumptionReport;
