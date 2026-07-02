import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Spinner,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from "reactstrap";
import classnames from "classnames";
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { getSyncSettings, saveSyncSettings } from "../../../helpers/fakebackend_helper";

const Sync = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("Nivoda");

  // Show/Hide password states
  const [showApiPass, setShowApiPass] = useState({});
  const [showFtpPass, setShowFtpPass] = useState({});

  // Default provider schema
  const defaultProviderState = {
    provider: "",
    enabled: false,
    mode: "API", // "API" or "FTP"
    apiUser: "",
    apiPass: "",
    apiLink: "",
    ftpUser: "",
    ftpPass: "",
    ftpHost: "",
    ftpPort: "",
    ftpAmt: 0
  };

  const [providers, setProviders] = useState({
    Nivoda: { ...defaultProviderState, provider: "Nivoda" },
    RapNet: { ...defaultProviderState, provider: "RapNet" },
    DiaSense: { ...defaultProviderState, provider: "DiaSense" },
    Parallel: { ...defaultProviderState, provider: "Parallel" },
    R2Net: { ...defaultProviderState, provider: "R2Net" },
    VDB: { ...defaultProviderState, provider: "VDB" }
  });

  // Validation errors state
  const [errors, setErrors] = useState({});

  // Retrieve companyId from local session
  const getCompanyId = () => {
    const auth = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
    if (auth) {
      const obj = JSON.parse(auth);
      const u = obj.user || obj.User || obj;
      return u.companyid || u.CompanyID || u.CompanyId || 1;
    }
    return 1;
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      const response = await getSyncSettings(companyId);
      if (response && (response.Success || response.success)) {
        const data = response.Data || response.data || [];
        const updatedProviders = {
          Nivoda: { ...defaultProviderState, provider: "Nivoda" },
          RapNet: { ...defaultProviderState, provider: "RapNet" },
          DiaSense: { ...defaultProviderState, provider: "DiaSense" },
          Parallel: { ...defaultProviderState, provider: "Parallel" },
          R2Net: { ...defaultProviderState, provider: "R2Net" },
          VDB: { ...defaultProviderState, provider: "VDB" }
        };

        data.forEach(row => {
          const platform = row.SyncPlatform || row.syncPlatform;
          if (updatedProviders[platform]) {
            updatedProviders[platform] = {
              provider: platform,
              enabled: row.Enable === true || row.Enable === 1 || row.enable === true || row.enable === 1,
              mode: row.UploadType || row.uploadType || "API",
              apiUser: row.ApiUserName || row.apiUserName || "",
              apiPass: row.ApiPassword || row.apiPassword || "",
              apiLink: row.ApiUrl || row.apiUrl || "",
              ftpUser: row.FtpUsername || row.ftpUsername || "",
              ftpPass: row.FtpPassword || row.ftpPassword || "",
              ftpHost: row.FtpHost || row.ftpHost || "",
              ftpPort: row.Port || row.port || "",
              ftpAmt: parseFloat(row.AmtPercent || row.amtPercent || 0)
            };
          }
        });
        setProviders(updatedProviders);
      } else {
        toast.error(t("Failed to load sync configurations"));
      }
    } catch (error) {
      toast.error(t("Error loading sync configurations: ") + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (providerName, field, value) => {
    setProviders(prev => ({
      ...prev,
      [providerName]: {
        ...prev[providerName],
        [field]: value
      }
    }));
    // Clear validation error when editing
    if (errors[providerName]?.[field]) {
      setErrors(prev => ({
        ...prev,
        [providerName]: {
          ...prev[providerName],
          [field]: null
        }
      }));
    }
  };

  const togglePasswordVisibility = (providerName, type) => {
    if (type === "API") {
      setShowApiPass(prev => ({ ...prev, [providerName]: !prev[providerName] }));
    } else {
      setShowFtpPass(prev => ({ ...prev, [providerName]: !prev[providerName] }));
    }
  };

  const validateForm = (providerName) => {
    const current = providers[providerName];
    const newErrors = {};

    if (current.enabled) {
      if (current.mode === "API") {
        if (!current.apiUser.trim()) newErrors.apiUser = t("API Username is required");
        if (!current.apiPass.trim()) newErrors.apiPass = t("API Password is required");
        if (!current.apiLink.trim()) newErrors.apiLink = t("API Endpoint URL is required");
      } else {
        if (!current.ftpUser.trim()) newErrors.ftpUser = t("FTP Username is required");
        if (!current.ftpPass.trim()) newErrors.ftpPass = t("FTP Password is required");
        if (!current.ftpHost.trim()) newErrors.ftpHost = t("FTP Host is required");
        if (!current.ftpPort.toString().trim()) newErrors.ftpPort = t("FTP Port is required");
      }
    }

    setErrors(prev => ({
      ...prev,
      [providerName]: newErrors
    }));

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (providerName) => {
    if (!validateForm(providerName)) {
      toast.warning(t("Please fill in all required settings"));
      return;
    }

    setSaving(true);
    try {
      const current = providers[providerName];
      const response = await saveSyncSettings(current, current.enabled);
      if (response && (response.Success || response.success)) {
        toast.success(`${providerName} ${t("settings saved successfully!")}`);
        loadSettings();
      } else {
        toast.error(response?.Message || response?.message || t("Failed to save settings"));
      }
    } catch (error) {
      toast.error(t("Error saving configurations: ") + (error.message || error));
    } finally {
      setSaving(false);
    }
  };

  const toggleTab = tab => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  // Helper colors for different providers to make UI feel very premium
  const getProviderColor = (name) => {
    switch (name) {
      case "Nivoda": return "#2970FF";
      case "RapNet": return "#EF4444";
      case "DiaSense": return "#06B6D4";
      case "Parallel": return "#6366F1";
      case "R2Net": return "#14B8A6";
      case "VDB": return "#10B981";
      default: return "#4A5568";
    }
  };

  document.title = `${t("Sync Master")} | Velzon`;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Sync Master")} pageTitle={t("Masters")} />
          <ToastContainer closeButton={false} limit={1} />

          <Row>
            <Col lg={12}>
              <Card className="shadow-lg border-0 overflow-hidden">
                <CardHeader className="bg-transparent border-bottom d-flex align-items-center justify-content-between py-3">
                  <h5 className="card-title mb-0 fs-16 fw-semibold text-primary d-flex align-items-center gap-2">
                    <i className="ri-exchange-line align-middle text-primary fs-20"></i>
                    {t("Stock Sync Configuration Manager")}
                  </h5>
                  <Button
                    color="soft-secondary"
                    size="sm"
                    className="btn-icon"
                    onClick={loadSettings}
                    disabled={loading}
                    title={t("Refresh Data")}
                  >
                    <i className="ri-refresh-line"></i>
                  </Button>
                </CardHeader>
                <CardBody className="p-0">
                  {loading ? (
                    <div className="d-flex justify-content-center align-items-center py-5">
                      <Spinner color="primary" />
                      <span className="ms-2 fw-medium text-muted">{t("Loading Sync Settings...")}</span>
                    </div>
                  ) : (
                    <Row className="g-0">
                      {/* Left Sidebar for Platforms selection */}
                      <Col md={3} className="bg-light border-end">
                        <div className="p-3">
                          <p className="text-muted text-uppercase fs-11 fw-semibold mb-3">{t("Select Provider")}</p>
                          <Nav pills className="flex-column gap-2">
                            {Object.keys(providers).map(name => {
                              const p = providers[name];
                              const color = getProviderColor(name);
                              return (
                                <NavItem key={name}>
                                  <NavLink
                                    className={classnames("d-flex justify-content-between align-items-center py-3 border-0 rounded-3 cursor-pointer transition-all", {
                                      "bg-white shadow text-dark border-start-3": activeTab === name,
                                      "text-muted": activeTab !== name
                                    })}
                                    onClick={() => toggleTab(name)}
                                    style={activeTab === name ? { borderLeft: `4px solid ${color}` } : {}}
                                  >
                                    <div className="d-flex align-items-center gap-2">
                                      <div
                                        className="rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: "28px", height: "28px", backgroundColor: `${color}15`, color: color }}
                                      >
                                        <i className="ri-cloud-line fs-14"></i>
                                      </div>
                                      <span className="fw-semibold fs-13">{t(name)}</span>
                                    </div>
                                    <span className={classnames("badge rounded-pill px-2 py-1 fs-10", {
                                      "bg-success-subtle text-success": p.enabled,
                                      "bg-secondary-subtle text-secondary": !p.enabled
                                    })}>
                                      {p.enabled ? t("Active") : t("Disabled")}
                                    </span>
                                  </NavLink>
                                </NavItem>
                              );
                            })}
                          </Nav>
                        </div>
                      </Col>

                      {/* Right Panel for Selected Platform Configuration */}
                      <Col md={9}>
                        <TabContent activeTab={activeTab} className="p-4">
                          {Object.keys(providers).map(name => {
                            const p = providers[name];
                            const pErrors = errors[name] || {};
                            const color = getProviderColor(name);
                            return (
                              <TabPane tabId={name} key={name}>
                                <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3 pb-3 border-bottom">
                                  <div>
                                    <h4 className="fw-bold mb-1" style={{ color: color }}>
                                      {t(name)} {t("Sync Configurations")}
                                    </h4>
                                    <p className="text-muted mb-0 fs-12">
                                      {t("Configure and authenticate connection settings for your API and FTP transfers.")}
                                    </p>
                                  </div>
                                  {/* Enable Switch */}
                                  <div className="form-check form-switch form-switch-lg d-flex align-items-center gap-2">
                                    <Input
                                      type="switch"
                                      className="form-check-input cursor-pointer"
                                      id={`switch-${name}`}
                                      checked={p.enabled}
                                      onChange={e => handleInputChange(name, "enabled", e.target.checked)}
                                    />
                                    <Label className="form-check-label fw-semibold text-muted mb-0 cursor-pointer" htmlFor={`switch-${name}`}>
                                      {p.enabled ? t("Enabled") : t("Disabled")}
                                    </Label>
                                  </div>
                                </div>

                                <Form onSubmit={e => { e.preventDefault(); handleSave(name); }}>
                                  {/* Render configurations if enabled */}
                                  <div className={classnames("transition-all", { "opacity-50 pointer-events-none": !p.enabled })}>
                                    <Row className="mb-4 align-items-center">
                                      <Col lg={4}>
                                        <Label className="form-label fw-semibold text-muted mb-0">{t("Transfer Method Mode")}</Label>
                                      </Col>
                                      <Col lg={8}>
                                        <div className="btn-group" role="group">
                                          <button
                                            type="button"
                                            className={classnames("btn px-4 py-2 fw-medium", {
                                              "btn-primary": p.mode === "API",
                                              "btn-outline-primary": p.mode !== "API"
                                            })}
                                            style={p.mode === "API" ? { backgroundColor: color, borderColor: color } : { color: color, borderColor: color }}
                                            onClick={() => handleInputChange(name, "mode", "API")}
                                            disabled={!p.enabled}
                                          >
                                            <i className="ri-api-line align-middle me-1"></i> API
                                          </button>
                                          <button
                                            type="button"
                                            className={classnames("btn px-4 py-2 fw-medium", {
                                              "btn-primary": p.mode === "FTP",
                                              "btn-outline-primary": p.mode !== "FTP"
                                            })}
                                            style={p.mode === "FTP" ? { backgroundColor: color, borderColor: color } : { color: color, borderColor: color }}
                                            onClick={() => handleInputChange(name, "mode", "FTP")}
                                            disabled={!p.enabled}
                                          >
                                            <i className="ri-folder-transfer-line align-middle me-1"></i> FTP
                                          </button>
                                        </div>
                                      </Col>
                                    </Row>

                                    {/* Conditional Form Inputs */}
                                    {p.mode === "API" ? (
                                      <div className="api-section animate-fade-in">
                                        <Row className="mb-3">
                                          <Col md={6}>
                                            <FormGroup>
                                              <Label className="form-label fw-medium">{t("API Username")}</Label>
                                              <Input
                                                type="text"
                                                placeholder={t("Enter API Username")}
                                                value={p.apiUser}
                                                onChange={e => handleInputChange(name, "apiUser", e.target.value)}
                                                invalid={!!pErrors.apiUser}
                                                disabled={!p.enabled}
                                              />
                                              {pErrors.apiUser && <FormFeedback>{pErrors.apiUser}</FormFeedback>}
                                            </FormGroup>
                                          </Col>
                                          <Col md={6}>
                                            <FormGroup>
                                              <Label className="form-label fw-medium">{t("API Password")}</Label>
                                              <div className="input-group">
                                                <Input
                                                  type={showApiPass[name] ? "text" : "password"}
                                                  placeholder={t("Enter API Password")}
                                                  value={p.apiPass}
                                                  onChange={e => handleInputChange(name, "apiPass", e.target.value)}
                                                  invalid={!!pErrors.apiPass}
                                                  disabled={!p.enabled}
                                                />
                                                <Button
                                                  color="light"
                                                  type="button"
                                                  onClick={() => togglePasswordVisibility(name, "API")}
                                                  disabled={!p.enabled}
                                                  className="border"
                                                >
                                                  <i className={showApiPass[name] ? "ri-eye-off-line" : "ri-eye-line"}></i>
                                                </Button>
                                                {pErrors.apiPass && <FormFeedback className="d-block">{pErrors.apiPass}</FormFeedback>}
                                              </div>
                                            </FormGroup>
                                          </Col>
                                        </Row>
                                        <Row className="mb-3">
                                          <Col md={12}>
                                            <FormGroup>
                                              <Label className="form-label fw-medium">{t("API Endpoint Link")}</Label>
                                              <Input
                                                type="url"
                                                placeholder="https://api.example.com/endpoint"
                                                value={p.apiLink}
                                                onChange={e => handleInputChange(name, "apiLink", e.target.value)}
                                                invalid={!!pErrors.apiLink}
                                                disabled={!p.enabled}
                                              />
                                              {pErrors.apiLink && <FormFeedback>{pErrors.apiLink}</FormFeedback>}
                                            </FormGroup>
                                          </Col>
                                        </Row>
                                      </div>
                                    ) : (
                                      <div className="ftp-section animate-fade-in">
                                        <Row className="mb-3">
                                          <Col md={6}>
                                            <FormGroup>
                                              <Label className="form-label fw-medium">{t("FTP Username")}</Label>
                                              <Input
                                                type="text"
                                                placeholder={t("Enter FTP Username")}
                                                value={p.ftpUser}
                                                onChange={e => handleInputChange(name, "ftpUser", e.target.value)}
                                                invalid={!!pErrors.ftpUser}
                                                disabled={!p.enabled}
                                              />
                                              {pErrors.ftpUser && <FormFeedback>{pErrors.ftpUser}</FormFeedback>}
                                            </FormGroup>
                                          </Col>
                                          <Col md={6}>
                                            <FormGroup>
                                              <Label className="form-label fw-medium">{t("FTP Password")}</Label>
                                              <div className="input-group">
                                                <Input
                                                  type={showFtpPass[name] ? "text" : "password"}
                                                  placeholder={t("Enter FTP Password")}
                                                  value={p.ftpPass}
                                                  onChange={e => handleInputChange(name, "ftpPass", e.target.value)}
                                                  invalid={!!pErrors.ftpPass}
                                                  disabled={!p.enabled}
                                                />
                                                <Button
                                                  color="light"
                                                  type="button"
                                                  onClick={() => togglePasswordVisibility(name, "FTP")}
                                                  disabled={!p.enabled}
                                                  className="border"
                                                >
                                                  <i className={showFtpPass[name] ? "ri-eye-off-line" : "ri-eye-line"}></i>
                                                </Button>
                                                {pErrors.ftpPass && <FormFeedback className="d-block">{pErrors.ftpPass}</FormFeedback>}
                                              </div>
                                            </FormGroup>
                                          </Col>
                                        </Row>
                                        <Row className="mb-3">
                                          <Col md={8}>
                                            <FormGroup>
                                              <Label className="form-label fw-medium">{t("FTP Host")}</Label>
                                              <Input
                                                type="text"
                                                placeholder="ftp.yourdomain.com"
                                                value={p.ftpHost}
                                                onChange={e => handleInputChange(name, "ftpHost", e.target.value)}
                                                invalid={!!pErrors.ftpHost}
                                                disabled={!p.enabled}
                                              />
                                              {pErrors.ftpHost && <FormFeedback>{pErrors.ftpHost}</FormFeedback>}
                                            </FormGroup>
                                          </Col>
                                          <Col md={4}>
                                            <FormGroup>
                                              <Label className="form-label fw-medium">{t("FTP Port")}</Label>
                                              <Input
                                                type="number"
                                                placeholder="21"
                                                value={p.ftpPort}
                                                onChange={e => handleInputChange(name, "ftpPort", e.target.value)}
                                                invalid={!!pErrors.ftpPort}
                                                disabled={!p.enabled}
                                              />
                                              {pErrors.ftpPort && <FormFeedback>{pErrors.ftpPort}</FormFeedback>}
                                            </FormGroup>
                                          </Col>
                                        </Row>
                                        <Row className="mb-3">
                                          <Col md={6}>
                                            <FormGroup>
                                              <Label className="form-label fw-medium">{t("Amount (Amount % for markup adjustment)")}</Label>
                                              <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={p.ftpAmt}
                                                onChange={e => handleInputChange(name, "ftpAmt", e.target.value)}
                                                disabled={!p.enabled}
                                              />
                                            </FormGroup>
                                          </Col>
                                        </Row>
                                      </div>
                                    )}
                                  </div>

                                  <div className="mt-4 pt-3 border-top d-flex gap-2">
                                    <Button
                                      type="submit"
                                      color="primary"
                                      style={{ backgroundColor: color, borderColor: color }}
                                      disabled={saving}
                                      className="px-4 py-2"
                                    >
                                      {saving ? (
                                        <>
                                          <Spinner size="sm" className="me-1" />
                                          {t("Saving...")}
                                        </>
                                      ) : (
                                        <>
                                          <i className="ri-save-2-fill me-1 align-middle"></i>
                                          {t("Save Settings")}
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      type="button"
                                      color="light"
                                      onClick={loadSettings}
                                      disabled={saving}
                                      className="px-4 py-2"
                                    >
                                      {t("Reset")}
                                    </Button>
                                  </div>
                                </Form>
                              </TabPane>
                            );
                          })}
                        </TabContent>
                      </Col>
                    </Row>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Sync;
