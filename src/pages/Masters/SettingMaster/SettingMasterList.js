import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Spinner } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { getSettingData, filterSettingData, submitSettingData } from "../../../helpers/fakebackend_helper";
import { toast, ToastContainer } from "react-toastify";
import classnames from "classnames";
import * as Yup from "yup";
import { useFormik } from "formik";

const SettingMasterList = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("COMPANY");
    const [searchQuery, setSearchQuery] = useState("");
    const [settingsList, setSettingsList] = useState([]);
    const [settingModal, setSettingModal] = useState(false);

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
        setLoading(true);
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
        setLoading(false);
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

    document.title = "Company Settings | Velzon";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Settings Master" pageTitle="Masters" />
                    <ToastContainer closeButton={false} limit={1} />
                    
                    <Row>
                        <Col lg={12}>
                            <Card className="shadow">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-transparent border-bottom">
                                    <h5 className="card-title mb-0 fs-16 fw-semibold text-primary">
                                        <i className="ri-settings-4-line align-middle me-1"></i> System & Company Settings
                                    </h5>
                                    
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="search-box">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder="Search settings..."
                                            />
                                            <i className="bx bx-search-alt search-icon"></i>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <Row>
                                        <Col md={3}>
                                            <div className="nav flex-column nav-pills list-group mt-1">
                                                {tabs.map((tab) => (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        className={classnames("list-group-item list-group-item-action d-flex align-items-center gap-2 text-start py-2 border-0 rounded-2 mb-1", { 
                                                            "bg-primary text-white shadow-sm active": activeTab === tab.id 
                                                        })}
                                                        onClick={() => handleTabChange(tab)}
                                                    >
                                                        <i className={tab.icon} style={{ fontSize: "16px" }}></i>
                                                        <span className="fw-medium">{tab.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </Col>
                                        
                                        <Col md={9} className="border-start">
                                            {loading ? (
                                                <div className="d-flex justify-content-center align-items-center py-5">
                                                    <Spinner color="primary" />
                                                    <span className="ms-2">Loading settings...</span>
                                                </div>
                                            ) : (
                                                <div className="p-3">
                                                    <div className="table-responsive table-card">
                                                        <table className="table table-hover table-striped align-middle table-nowrap mb-0">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th>Setting Name</th>
                                                                    <th>Setting Value</th>
                                                                    <th style={{ width: "100px" }}>Actions</th>
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
                                                                            <td>
                                                                                <Button 
                                                                                    color="soft-primary" 
                                                                                    size="sm" 
                                                                                    onClick={() => handleEditSetting(item)}
                                                                                    title="Edit Setting"
                                                                                >
                                                                                    <i className="ri-edit-line"></i> Edit
                                                                                </Button>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan="3" className="text-center py-4">No settings found matching your search.</td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
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
                            <span className="text-white">Edit Company Setting</span>
                        </ModalHeader>
                        <Form onSubmit={settingValidation.handleSubmit}>
                            <ModalBody>
                                <div className="mb-3">
                                    <Label className="form-label">Setting Name</Label>
                                    <Input
                                        type="text"
                                        name="name"
                                        value={settingValidation.values.name}
                                        disabled
                                        className="bg-light"
                                    />
                                </div>
                                <div className="mb-3">
                                    <Label className="form-label">Setting Value</Label>
                                    <Input
                                        type={isPasswordSetting(settingValidation.values.name) ? "password" : "text"}
                                        name="value"
                                        placeholder="Enter setting value"
                                        value={settingValidation.values.value}
                                        onChange={settingValidation.handleChange}
                                        onBlur={settingValidation.handleBlur}
                                        invalid={settingValidation.touched.value && !!settingValidation.errors.value}
                                    />
                                    {settingValidation.touched.value && settingValidation.errors.value ? (
                                        <FormFeedback type="invalid">{settingValidation.errors.value}</FormFeedback>
                                    ) : null}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button type="button" color="light" onClick={() => setSettingModal(false)}>Close</Button>
                                <Button type="submit" color="primary">Save Changes</Button>
                            </ModalFooter>
                        </Form>
                    </Modal>

                </Container>
            </div>
        </React.Fragment>
    );
};

export default SettingMasterList;
