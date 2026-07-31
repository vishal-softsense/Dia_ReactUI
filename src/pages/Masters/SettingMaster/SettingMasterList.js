import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Spinner, Nav, NavItem, NavLink } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { getSettingData, filterSettingData, submitSettingData, uploadCompanyLogo } from "../../../helpers/fakebackend_helper";
import {
    SETTING_MAX_DATE_KEY,
    SETTING_MIN_DATE_KEY,
    normalizeSettingDate,
    refreshSettingReportDates,
    setCachedSettingReportDates
} from "../../../helpers/reportDateDefaults";
import { toast, ToastContainer } from "react-toastify";
import classnames from "classnames";
import * as Yup from "yup";
import { useFormik } from "formik";
import { api } from "../../../config";
import { useTranslation } from "react-i18next";

const SettingMasterList = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("COMPANY");
    const [searchQuery, setSearchQuery] = useState("");
    const [settingsList, setSettingsList] = useState([]);
    const [settingModal, setSettingModal] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const resolveCompanyLogoUrl = (path) => {
        if (!path || typeof path !== "string" || !path.trim()) {
            return "";
        }
        const trimmed = path.trim();
        if (/^https?:\/\//i.test(trimmed)) {
            return trimmed;
        }
        const baseUrl = (api.API_URL || "").replace(/\/$/, "");
        if (trimmed.startsWith("/")) {
            return `${baseUrl}${trimmed}`;
        }
        return `${baseUrl}/${trimmed}`;
    };

    const handleLogoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
        if (!allowedExtensions.exec(file.name)) {
            toast.error("Only JPG, JPEG, or PNG files are allowed");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB");
            return;
        }

        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await uploadCompanyLogo(formData);
            if (response && response.success) {
                settingValidation.setFieldValue("value", response.path);
                toast.success("Logo uploaded successfully. Click Save Changes to apply.");
            } else {
                toast.error(response?.message || response?.Message || "Logo upload failed");
            }
        } catch (error) {
            toast.error("Error occurred while uploading logo: " + (error.message || error));
        } finally {
            setUploadingLogo(false);
        }
    };

    const tabs = [
        { id: "COMPANY", label: "Company", icon: "ri-building-line" },
        { id: "DEFAULT STOCK SETTING", label: "Default Stock Setting", icon: "ri-settings-3-line" },
        { id: "EMAIL SETTINGS", label: "Email Settings", icon: "ri-mail-line" },
        { id: "INVOICE AND MEMO", label: "Invoice And Memo", icon: "ri-file-list-3-line" },
        { id: "LAB", label: "Lab", icon: "ri-test-tube-line" },
        { id: "ONLINE STOCK UPLOAD", label: "Online Stock Upload", icon: "ri-upload-cloud-line" },
        { id: "PACKET", label: "Packet", icon: "ri-mail-send-line" },
        { id: "REPORT", label: "Report", icon: "ri-article-line" },
        { id: "SYSTEM SETTINGS", label: "System Settings", icon: "ri-computer-line" },
        { id: "PRINT FORMAT", label: "Print Format", icon: "ri-printer-line", isExternal: true, path: "/PrintFormat/PrintFormat" },
        { id: "COLUMN ABBR", label: "Column Abbreviations", icon: "ri-character-recognition-line", isExternal: true, path: "/ColumnAbbreviations/ColumnAbbreviations" }
    ];

    useEffect(() => {
        loadTabData(activeTab);
    }, [activeTab]);

    const loadTabData = async (tab) => {
        //setLoading(true);
        setSearchQuery("");
        try {
            let response;
            if (tab === "COMPANY") {
                response = await getSettingData();
            } else {
                response = await filterSettingData(tab);
            }
            if (response.success || response.Success) {
                setSettingsList(response.data || response.Data || []);
            } else {
                toast.error(response.data || response.Data || `Failed to load ${tab} settings`);
            }
        } catch (error) {
            toast.error("Failed to load setting data");
        }
        //setLoading(false);
    };

    const handleTabChange = (tab) => {
        if (tab.isExternal) {
            window.open(tab.path, "_blank");
        } else if (activeTab !== tab.id) {
            setActiveTab(tab.id);
        }
    };

    // Standard Setting Formik setup
    const settingValidation = useFormik({
        initialValues: {
            id: 0,
            name: "",
            value: "",
            description: "",
            comment: ""
        },
        validationSchema: Yup.object({
            value: Yup.string().required("Value is required")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    Id: values.id,
                    Name: values.name,
                    Value: values.value,
                    Description: values.description,
                    COMMENT: values.comment
                };
                const response = await submitSettingData(payload);
                if (response.success || response.Success) {
                    toast.success(response.data || response.Data || "Setting updated successfully");
                    if ((values.name || "").toLowerCase() === "company") {
                        localStorage.setItem("companySettingName", values.value);
                        window.dispatchEvent(new Event("companyNameUpdated"));
                    }
                    if ((values.name || "").toLowerCase() === "companyloginlogo") {
                        localStorage.setItem("companyLoginLogo", values.value);
                        window.dispatchEvent(new Event("companyLogoUpdated"));
                    }
                    const settingName = (values.name || "").toLowerCase().replace(/\s+/g, "");
                    if (settingName === "mindate" || settingName === "maxdate") {
                        const normalized = normalizeSettingDate(values.value);
                        if (settingName === "mindate") {
                            setCachedSettingReportDates(
                                normalized || values.value,
                                localStorage.getItem(SETTING_MAX_DATE_KEY)
                            );
                        } else {
                            // MaxDate must drive report To Date
                            setCachedSettingReportDates(
                                localStorage.getItem(SETTING_MIN_DATE_KEY),
                                normalized || values.value
                            );
                        }
                        // Re-read both from API so all open/next reports get latest Min/Max
                        await refreshSettingReportDates();
                    }
                    setSettingModal(false);
                    loadTabData(activeTab);
                } else {
                    toast.error(response.data || response.Data || "Failed to update setting");
                }
            } catch (error) {
                toast.error("Error occurred while saving setting");
            }
        }
    });

    const handleEditSetting = (setting) => {
        settingValidation.setValues({
            id: setting.Id ?? setting.id ?? 0,
            name: setting.Name || setting.name || "",
            value: setting.Value ?? setting.value ?? "",
            description: setting.Description || setting.description || "",
            comment: setting.COMMENT || setting.comment || setting.Comment || ""
        });
        setSettingModal(true);
    };

    // Table search filtering
    const filteredSettings = useMemo(() => {
        return settingsList.filter(item => {
            const name = item.Name || item.name || "";
            const value = item.Value || item.value || "";
            return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   value.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [settingsList, searchQuery]);

    const isPasswordSetting = (name) => {
        return name === "RapPassword" || name === "Password";
    };

    const getTabColor = (id) => {
        switch (id) {
            case "COMPANY": return "#2970FF";
            case "DEFAULT STOCK SETTING": return "#EF4444";
            case "EMAIL SETTINGS": return "#06B6D4";
            case "INVOICE AND MEMO": return "#6366F1";
            case "LAB": return "#14B8A6";
            case "ONLINE STOCK UPLOAD": return "#10B981";
            case "PACKET": return "#F59E0B";
            case "REPORT": return "#8B5CF6";
            case "SYSTEM SETTINGS": return "#EC4899";
            case "PRINT FORMAT": return "#10B981";
            case "COLUMN ABBR": return "#6B7280";
            default: return "#4A5568";
        }
    };

    const activeTabObj = tabs.find(t => t.id === activeTab) || {};

    document.title = "Company Settings | Velzon";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Settings Master")} pageTitle="Masters" />
                    <ToastContainer autoClose={2000} />
                    
                    <Row>
                        <Col lg={12}>
                            <Card className="shadow-lg border-0 overflow-hidden">
                                <CardHeader className="bg-transparent border-bottom d-flex align-items-center justify-content-between py-3">
                                    <h5 className="card-title mb-0 fs-16 fw-semibold text-primary d-flex align-items-center gap-2">
                                        <i className="ri-settings-4-line align-middle text-primary fs-20"></i>
                                        {t("System & Company Settings Manager")}
                                    </h5>
                                    
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="search-box">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder={t("Search settings...")}
                                            />
                                            <i className="bx bx-search-alt search-icon"></i>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardBody className="p-0">
                                    <Row className="g-0">
                                        <Col md={3} className="bg-light border-end">
                                            <div className="p-3">
                                                <p className="text-muted text-uppercase fs-11 fw-semibold mb-3">{t("Select Category")}</p>
                                                <Nav pills className="flex-column gap-2">
                                                    {tabs.map((tab) => {
                                                        const color = getTabColor(tab.id);
                                                        return (
                                                            <NavItem key={tab.id}>
                                                                <NavLink
                                                                    className={classnames("d-flex justify-content-between align-items-center py-3 border-0 rounded-3 cursor-pointer transition-all", { 
                                                                        "bg-white shadow text-dark border-start-3": activeTab === tab.id,
                                                                        "text-muted": activeTab !== tab.id
                                                                    })}
                                                                    onClick={() => handleTabChange(tab)}
                                                                    style={activeTab === tab.id ? { borderLeft: `4px solid ${color}` } : {}}
                                                                >
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <div
                                                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                                                            style={{ width: "28px", height: "28px", backgroundColor: `${color}15`, color: color }}
                                                                        >
                                                                            <i className={classnames(tab.icon, "fs-14")}></i>
                                                                        </div>
                                                                        <span className="fw-semibold fs-13">{t(tab.label)}</span>
                                                                    </div>
                                                                </NavLink>
                                                            </NavItem>
                                                        );
                                                    })}
                                                </Nav>
                                            </div>
                                        </Col>
                                        
                                        <Col md={9}>
                                            <div className="p-4">
                                                <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3 pb-3 border-bottom">
                                                    <div>
                                                        <h4 className="fw-bold mb-1" style={{ color: getTabColor(activeTab) }}>
                                                            {t(activeTabObj.label || activeTab)} {t("Settings")}
                                                        </h4>
                                                        <p className="text-muted mb-0 fs-12">
                                                            {t("Manage values and options under the")} {t(activeTabObj.label || activeTab)} {t("category.")}
                                                        </p>
                                                    </div>
                                                </div>

                                                {loading ? (
                                                    <div className="d-flex justify-content-center align-items-center py-5">
                                                        <Spinner color="primary" />
                                                        <span className="ms-2 fw-medium text-muted">{t("Loading settings...")}</span>
                                                    </div>
                                                ) : (
                                                    <div className="table-responsive table-card">
                                                        <table className="table table-hover align-middle table-nowrap mb-0">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th className="py-3 fs-12 text-uppercase text-muted fw-semibold">{t("Setting Name")}</th>
                                                                    <th className="py-3 fs-12 text-uppercase text-muted fw-semibold">{t("Setting Value")}</th>
                                                                    <th className="py-3 fs-12 text-uppercase text-muted fw-semibold text-end" style={{ width: "120px" }}>{t("Actions")}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {filteredSettings.length > 0 ? (
                                                                    filteredSettings.map((item, idx) => (
                                                                        <tr key={item.Id ?? item.id ?? idx}>
                                                                            <td className="fw-medium text-body">{item.Name || item.name}</td>
                                                                            <td>
                                                                                {isPasswordSetting(item.Name || item.name) ? (
                                                                                    <span className="badge bg-secondary-subtle text-secondary px-2">••••••••</span>
                                                                                ) : (
                                                                                    <span className="text-muted">{item.Value ?? item.value ?? ""}</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="text-end">
                                                                                <Button 
                                                                                    color="soft-primary" 
                                                                                    size="sm" 
                                                                                    onClick={() => handleEditSetting(item)}
                                                                                    title={t("Edit Setting")}
                                                                                    className="btn-soft-primary border-0"
                                                                                    style={{ color: getTabColor(activeTab), backgroundColor: `${getTabColor(activeTab)}15` }}
                                                                                >
                                                                                    <i className="ri-edit-line me-1"></i> {t("Edit")}
                                                                                </Button>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan="3" className="text-center py-4 text-muted">{t("No settings found matching your search.")}</td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Standard edit setting Modal */}
                    <Modal isOpen={settingModal} toggle={() => setSettingModal(false)} centered>
                        <ModalHeader 
                            className="bg-primary p-3" 
                            toggle={() => setSettingModal(false)}
                            close={<button className="btn-close btn-close-white" onClick={() => setSettingModal(false)}></button>}
                        >
                            <span className="text-white">{t("Edit Company Setting")}</span>
                        </ModalHeader>
                        <Form onSubmit={settingValidation.handleSubmit}>
                            <ModalBody>
                                <div className="mb-3">
                                    <Label className="form-label">{t("Setting Name")}</Label>
                                    <Input
                                        type="text"
                                        name="name"
                                        value={settingValidation.values.name}
                                        disabled
                                        className="bg-light"
                                    />
                                </div>
                                <div className="mb-3">
                                    <Label className="form-label">{t("Setting Value")}</Label>
                                    <Input
                                        type={isPasswordSetting(settingValidation.values.name) ? "password" : "text"}
                                        name="value"
                                        placeholder={t("Enter setting value")}
                                        value={settingValidation.values.value}
                                        onChange={settingValidation.handleChange}
                                        onBlur={settingValidation.handleBlur}
                                        invalid={settingValidation.touched.value && !!settingValidation.errors.value}
                                    />
                                    {settingValidation.touched.value && settingValidation.errors.value ? (
                                        <FormFeedback type="invalid">{settingValidation.errors.value}</FormFeedback>
                                    ) : null}
                                </div>

                                {(settingValidation.values.name || "").toLowerCase() === "companyloginlogo" && (
                                    <div className="mb-3">
                                        <Label className="form-label">{t("Company Logo Image")}</Label>
                                        <div className="d-flex flex-column align-items-center gap-2 p-3 border border-dashed rounded bg-light">
                                            {uploadingLogo ? (
                                                <div className="text-center py-3">
                                                    <Spinner size="sm" color="primary" className="me-2" />
                                                    <span>{t("Uploading logo...")}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    {settingValidation.values.value ? (
                                                        <img
                                                            src={resolveCompanyLogoUrl(settingValidation.values.value)}
                                                            alt="Company Logo Preview"
                                                            style={{ maxHeight: "80px", maxWidth: "150px", objectFit: "contain", borderRadius: "4px", backgroundColor: "#fff", padding: "4px" }}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = "https://placehold.co/150x80?text=No+Preview";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="text-muted fs-12">{t("No logo selected")}</div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png"
                                                        className="d-none"
                                                        id="logo-upload-input"
                                                        onChange={handleLogoUpload}
                                                    />
                                                    <Button
                                                        color="primary"
                                                        size="sm"
                                                        type="button"
                                                        className="mt-2"
                                                        onClick={() => document.getElementById("logo-upload-input").click()}
                                                    >
                                                        <i className="ri-upload-2-fill me-1"></i> Choose Logo File
                                                    </Button>
                                                    <span className="text-muted fs-11">{t("JPG, JPEG, PNG (Max 2MB)")}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button type="button" color="light" onClick={() => setSettingModal(false)}>{t("Close")}</Button>
                                <Button type="submit" color="primary">{t("Save Changes")}</Button>
                            </ModalFooter>
                        </Form>
                    </Modal>

                </Container>
            </div>
        </React.Fragment>
    );
};

export default SettingMasterList;
