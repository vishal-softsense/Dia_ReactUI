import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, Spinner } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { getPrintFormatData, updatePrintFormat, getInvoiceFormatSetting } from "../../../helpers/fakebackend_helper";
import { refreshReportCompanySettings } from "../../../helpers/reportCompanyDefaults";
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";

const TEXT_VALUE_SETTING_NAMES = new Set([
    "SaleConditions",
    "MemoConditions",
    "Information",
    "Addperinother",
    "Addperinasking",
]);

const LONG_TEXT_SETTING_NAMES = new Set([
    "SaleConditions",
    "MemoConditions",
    "Information",
]);

const isTextValueSetting = (name) => TEXT_VALUE_SETTING_NAMES.has(name);
const isLongTextSetting = (name) => LONG_TEXT_SETTING_NAMES.has(name);

const PrintFormatList = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [printFormatsList, setPrintFormatsList] = useState([]);
    
    // Edit Modal States
    const [printModal, setPrintModal] = useState(false);
    const [invoiceFormatOptions, setInvoiceFormatOptions] = useState([]);
    const [selectedPrintSetting, setSelectedPrintSetting] = useState(null);
    const [printConditions, setPrintConditions] = useState("");
    const [selectedPrintFormat, setSelectedPrintFormat] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await getPrintFormatData();
            if (response.success || response.Success) {
                setPrintFormatsList(response.data || response.Data || []);
            } else {
                toast.error(response.data || response.Data || "Failed to load print formats");
            }
        } catch (error) {
            toast.error("Failed to load print formats");
        }
        setLoading(false);
    };

    const handleEditPrintSetting = async (setting) => {
        setLoading(true);
        try {
            const id = setting.Id ?? setting.id;
            const name = setting.Name || setting.name;
            const response = await getInvoiceFormatSetting(id, name);
            if (response.success || response.Success) {
                const data = response.data || response.Data;
                setSelectedPrintSetting(data);
                setInvoiceFormatOptions(response.invoiceFormat || response.InvoiceFormat || []);
                
                if (isTextValueSetting(name)) {
                    setPrintConditions(data.Value ?? data.value ?? "");
                } else {
                    setSelectedPrintFormat(data.Value ?? data.value ?? "");
                }
                setPrintModal(true);
            } else {
                toast.error(response.data || response.Data || "Failed to fetch print setting details");
            }
        } catch (error) {
            toast.error("Error fetching print setting details");
        }
        setLoading(false);
    };

    const handleSavePrintSetting = async () => {
        const settingName = selectedPrintSetting.Name ?? selectedPrintSetting.name ?? "";
        const isCondition = isTextValueSetting(settingName);
        const valToSave = isCondition ? printConditions : selectedPrintFormat;

        try {
            const payload = {
                Id: selectedPrintSetting.Id ?? selectedPrintSetting.id,
                Name: selectedPrintSetting.Name ?? selectedPrintSetting.name,
                Value: valToSave
            };
            const response = await updatePrintFormat(payload);
            if (response.success || response.Success) {
                toast.success(response.data || response.Data || "Print format updated successfully");
                setPrintModal(false);
                loadData();
                try {
                    await refreshReportCompanySettings();
                } catch {
                    /* cache refresh is best-effort; next print still force-loads */
                }
            } else {
                toast.error(response.data || response.Data || "Failed to save print format");
            }
        } catch (error) {
            toast.error("Error saving print format");
        }
    };

    const handlePrintPreview = () => {
        const name = selectedPrintSetting?.Name || selectedPrintSetting?.name || "";
        if (!name || !selectedPrintFormat) {
            toast.error("Select a print format first");
            return;
        }
        const qs = `setting=${encodeURIComponent(name)}&format=${encodeURIComponent(selectedPrintFormat)}`;
        window.open(`/PrintFormat/preview?${qs}`, "_blank");
    };

    const filteredPrintFormats = useMemo(() => {
        return printFormatsList.filter(item => {
            const name = item.Name || item.name || "";
            const value = item.Value || item.value || "";
            return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   value.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [printFormatsList, searchQuery]);

    document.title = "Print Formats | Velzon";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Print Format Settings")} pageTitle="Masters" />
                    <ToastContainer autoClose={2000} />
                    
                    <Row>
                        <Col lg={12}>
                            <Card className="shadow">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-transparent border-bottom">
                                    <h5 className="card-title mb-0 fs-16 fw-semibold text-primary">
                                        <i className="ri-printer-line align-middle me-1"></i> Print Format Settings
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
                                <CardBody>
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center py-5">
                                            <Spinner color="primary" />
                                            <span className="ms-2">{t("Loading print formats...")}</span>
                                        </div>
                                    ) : (
                                        <div className="table-responsive table-card">
                                            <table className="table table-hover table-striped align-middle table-nowrap mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>{t("Format Setting Name")}</th>
                                                        <th>{t("Active Format / Condition")}</th>
                                                        <th style={{ width: "100px" }}>{t("Actions")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredPrintFormats.length > 0 ? (
                                                        filteredPrintFormats.map((item, idx) => (
                                                            <tr key={item.Id ?? item.id ?? idx}>
                                                                <td className="fw-medium text-body">{item.Name || item.name}</td>
                                                                <td style={{ whiteSpace: "normal" }}>
                                                                    <span className="text-muted">{item.Value ?? item.value ?? ""}</span>
                                                                </td>
                                                                <td>
                                                                    <Button 
                                                                        color="soft-primary" 
                                                                        size="sm" 
                                                                        onClick={() => handleEditPrintSetting(item)}
                                                                        title={t("Edit Format Setting")}
                                                                    >
                                                                        <i className="ri-edit-line"></i> Edit
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="3" className="text-center py-4">{t("No print formats found.")}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Print Format setting Modal */}
                    <Modal isOpen={printModal} toggle={() => setPrintModal(false)} centered size="lg">
                        <ModalHeader 
                            className="bg-primary p-3" 
                            toggle={() => setPrintModal(false)}
                            close={<button className="btn-close btn-close-white" onClick={() => setPrintModal(false)}></button>}
                        >
                            <span className="text-white">{t("Edit Print Format Setting")}</span>
                        </ModalHeader>
                        <ModalBody>
                            {selectedPrintSetting && (
                                <>
                                    <div className="mb-3">
                                        <Label className="form-label">{t("Print Setting Name")}</Label>
                                        <Input
                                            type="text"
                                            value={selectedPrintSetting.Name || selectedPrintSetting.name || ""}
                                            disabled
                                            className="bg-light"
                                        />
                                    </div>

                                    {isTextValueSetting(selectedPrintSetting.Name || selectedPrintSetting.name || "") ? (
                                        <div className="mb-3">
                                            <Label className="form-label">
                                                {isLongTextSetting(selectedPrintSetting.Name || selectedPrintSetting.name || "")
                                                    ? t("Conditions / Information Content")
                                                    : t("Conditions")}
                                            </Label>
                                            {isLongTextSetting(selectedPrintSetting.Name || selectedPrintSetting.name || "") ? (
                                                <Input
                                                    type="textarea"
                                                    rows="6"
                                                    value={printConditions}
                                                    onChange={(e) => setPrintConditions(e.target.value)}
                                                    placeholder={t("Enter terms and conditions text...")}
                                                />
                                            ) : (
                                                <Input
                                                    type="text"
                                                    value={printConditions}
                                                    onChange={(e) => setPrintConditions(e.target.value)}
                                                    placeholder={t("Conditions")}
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mb-3">
                                            <Label className="form-label">{t("Select Print Format")}</Label>
                                            <Input
                                                type="select"
                                                value={selectedPrintFormat}
                                                onChange={(e) => setSelectedPrintFormat(e.target.value)}
                                            >
                                                <option value="">{t("Select Invoice format")}</option>
                                                {invoiceFormatOptions.map((opt, i) => (
                                                    <option key={i} value={opt.Value ?? opt.value}>{opt.Text ?? opt.text}</option>
                                                ))}
                                            </Input>
                                        </div>
                                    )}
                                </>
                            )}
                        </ModalBody>
                        <ModalFooter className="d-flex justify-content-between">
                            <div>
                                {selectedPrintSetting && 
                                 !isTextValueSetting(selectedPrintSetting.Name || selectedPrintSetting.name || "") &&
                                 (selectedPrintSetting.Name || selectedPrintSetting.name) !== "Inv Print Date" && 
                                 (selectedPrintSetting.Name || selectedPrintSetting.name) !== "DecimalinInvoiceAmount" && (
                                    <Button 
                                        color="info" 
                                        onClick={handlePrintPreview} 
                                        disabled={!selectedPrintFormat}
                                    >
                                        {<i className="ri-eye-line align-middle me-1"></i>} Preview Print
                                    </Button>
                                )}
                            </div>
                            <div className="d-flex gap-2">
                                <Button type="button" color="light" onClick={() => setPrintModal(false)}>{t("Close")}</Button>
                                <Button type="button" color="primary" onClick={handleSavePrintSetting}>{t("Save")}</Button>
                            </div>
                        </ModalFooter>
                    </Modal>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default PrintFormatList;
