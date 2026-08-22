import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Row,
    Spinner
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import {
    deleteImportDeletedRecords,
    getImportGradingPermission,
    importAskingRate,
    updateAccountData,
    updateGiaData,
    updateGraderData,
    updateHrdData,
    updateIgiData,
    updateImageVideoData,
    updateImportSizeId,
    updateParcelItemData,
    updatePurchaseData,
    updateSolitaireItemData,
    uploadImportLogo,
    uploadJewelleryFull,
    uploadJewStockDiamondData,
    uploadPurchaseData,
    uploadPurchaseDetailsData
} from "../../../helpers/fakebackend_helper";

const MvcSwalConfirm = ({ open, title, text, confirmText, cancelText, onConfirm, onCancel }) => (
    <Modal isOpen={open} toggle={onCancel} centered className="modal-dialog-centered" contentClassName="border-0 shadow" style={{ maxWidth: 440 }}>
        <ModalBody className="p-4 text-center">
            <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: 80, height: 80, borderRadius: "50%", border: "4px solid #f7b84b", color: "#f7b84b", fontSize: 48, fontWeight: 600, lineHeight: 1 }} aria-hidden="true">!</div>
            <h2 className="fw-semibold mb-2" style={{ fontSize: 22, color: "#495057" }}>{title}</h2>
            <div className="text-muted mb-4 fs-15 text-break">{text}</div>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
                <button type="button" className="btn btn-primary" onClick={onConfirm}>{confirmText}</button>
                <button type="button" className="btn btn-danger" onClick={onCancel}>{cancelText}</button>
            </div>
        </ModalBody>
    </Modal>
);

const MvcSwalResult = ({ open, type, title, text, confirmText, onClose }) => {
    const isSuccess = type === "success";
    const iconColor = isSuccess ? "#0ab39c" : "#f06548";
    const iconBorder = isSuccess ? "rgba(10, 179, 156, 0.3)" : "#f06548";
    return (
        <Modal isOpen={open} toggle={onClose} centered className="modal-dialog-centered" contentClassName="border-0 shadow" style={{ maxWidth: 440 }}>
            <ModalBody className="p-4 text-center">
                <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: 80, height: 80, borderRadius: "50%", border: `4px solid ${iconBorder}`, color: iconColor, fontSize: isSuccess ? 42 : 48, fontWeight: 600, lineHeight: 1 }} aria-hidden="true">
                    {isSuccess ? "✓" : "!"}
                </div>
                <h2 className="fw-semibold mb-2" style={{ fontSize: 22, color: "#495057" }}>{title}</h2>
                <p className="text-muted mb-4 fs-16">{text}</p>
                <button type="button" className="btn btn-success" onClick={onClose}>{confirmText}</button>
            </ModalBody>
        </Modal>
    );
};

const GRADING_ACTIONS = [
    { key: "gia", label: "Import GIA Data Format", icon: "ri-file-excel-2-line", handler: updateGiaData, template: "/excelfolder/GIAResultFormat.xlsx", downloadLabel: "Download Gia File Format", sendReplace: false },
    { key: "igi", label: "Import IGI Data Format", icon: "ri-file-excel-2-line", handler: updateIgiData, template: chkReplace => (chkReplace ? "/excelfolder/IGI_New.xlsx" : "/excelfolder/IGIResult.xlsx"), downloadLabel: "Download IGI File Format", sendReplace: true },
    { key: "hrd", label: "Import HRD Data Format", icon: "ri-file-excel-2-line", handler: updateHrdData, template: chkReplace => (chkReplace ? "/excelfolder/HRD_New.xlsx" : "/excelfolder/HRDResult.xlsx"), downloadLabel: "Download HRD File Format", sendReplace: true },
    { key: "grader", label: "Import Grader Data Format", icon: "ri-user-star-line", handler: updateGraderData, template: "/excelfolder/Grader.xlsx", downloadLabel: "Download Grading Format", sendReplace: false },
    { key: "diasense", label: "Import Diasense Purchase Grading", icon: "ri-shopping-bag-3-line", handler: updatePurchaseData, template: "/excelfolder/DiaSense.xlsx", downloadLabel: "Download Purchase Grading Format", sendReplace: true }
];

const MEDIA_ACTIONS = [
    { key: "imageVideo", label: "Import Image/Video", icon: "ri-image-line", handler: updateImageVideoData, template: "/excelfolder/ImportImageFormat.xlsx", downloadLabel: "Download Image/Video File Format", sendReplace: false }
];

const STOCK_ACTIONS = [
    { key: "parcel", label: "Import Parcel Stock", icon: "ri-box-3-line", handler: updateParcelItemData, template: "/excelfolder/ParcelStockData.xlsx", downloadLabel: "Download Parcel Stock Format", sendReplace: false },
    { key: "solitaire", label: "Import Solitaire Stock", icon: "ri-inbox-archive-line", handler: updateSolitaireItemData, template: "/excelfolder/SolitaireStockData.xlsx", downloadLabel: "Download Solitaire Stock Format", sendReplace: false },
    { key: "account", label: "Import Account", icon: "ri-contacts-line", handler: updateAccountData, template: "/excelfolder/AccountData.xlsx", downloadLabel: "Download Account Format", sendReplace: false },
    { key: "purchase", label: "Import Purchase", icon: "ri-bill-line", handler: uploadPurchaseData, template: "/excelfolder/PurchaseFormat.xlsx", downloadLabel: "Download Purchase Format", sendReplace: false },
    { key: "purchaseTxn", label: "Import Purchase Transaction", icon: "ri-exchange-box-line", handler: uploadPurchaseDetailsData, template: "/excelfolder/PurchaseTransaction.xlsx", downloadLabel: "Download Purchase Transaction Format", sendReplace: false },
    // Disabled: Import Sale button commented in MVC ImportGradingData.cshtml
    // { key: "sale", label: "Import Sale", icon: "ri-shopping-cart-line", handler: importSaleData, template: "/excelfolder/Sale Import.xlsx", downloadLabel: "Download Sale Data Format", sendReplace: false },
    { key: "jew", label: "Import Jewellery Stock", icon: "ri-star-smile-line", handler: uploadJewelleryFull, template: "/excelfolder/JewelleryStockUploadFinal.xlsx", downloadLabel: "Download Jewellery Stock Format", sendReplace: false },
    { key: "jewDia", label: "Import Jewellery Diamond Stock", icon: "ri-shining-2-line", handler: uploadJewStockDiamondData, template: "/excelfolder/JewDiamondData.xlsx", downloadLabel: "Download Jewellery Diamond Format", sendReplace: false },
    { key: "asking", label: "Import Asking Purchase Rate", icon: "ri-funds-line", handler: importAskingRate, template: "/excelfolder/updateaskingpurchaseratedata.xlsx", downloadLabel: "Download Asking Rate Format", sendReplace: false }
];

const ALL_ACTIONS = [...GRADING_ACTIONS, ...MEDIA_ACTIONS, ...STOCK_ACTIONS];

const ActionButton = ({ action, t, onClick, disabled }) => {
    // Some locale JSON files don't contain every key; keep a safe fallback so labels never render blank.
    const label = t(action.label, { defaultValue: action.label });
    const templateLabel = action.downloadLabel
        ? t(action.downloadLabel, { defaultValue: action.downloadLabel })
        : t("Ready to import");
    return (
        <Button
            outline
            color="primary"
            className="w-100 import-grading-action text-start"
            disabled={disabled}
            onClick={() => onClick(action.key)}
        >
            <span className="import-grading-action-main d-flex align-items-center gap-3">
                <span className="import-grading-action-icon">
                    <i className={`${action.icon} fs-18`} />
                </span>
                <span className="flex-grow-1 min-w-0">
                    <span className="d-block text-truncate import-grading-action-label">{label}</span>
                    <span className="d-block text-truncate import-grading-action-meta">{templateLabel}</span>
                </span>
                <span className="import-grading-action-arrow">
                    <i className="ri-arrow-right-up-line" />
                </span>
            </span>
        </Button>
    );
};

const ImportCard = ({ title, subtitle, icon, children }) => (
    <Card className="h-100 shadow-sm border-0 import-grading-card">
        <CardHeader className="import-grading-card-header">
            <div className="d-flex align-items-start gap-3">
                <span className="import-grading-card-badge">
                    <i className={`${icon} fs-18`} />
                </span>
                <div>
                    <h5 className="mb-1">{title}</h5>
                    {subtitle ? <p className="mb-0 text-muted import-grading-card-subtitle">{subtitle}</p> : null}
                </div>
            </div>
        </CardHeader>
        <CardBody>
            <div className="d-grid gap-3">{children}</div>
        </CardBody>
    </Card>
);

const ImportGrading = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(true);
    const [busy, setBusy] = useState(false);
    const [chkReplace, setChkReplace] = useState(false);
    const [activeAction, setActiveAction] = useState(null);
    const [file, setFile] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [logoFileName, setLogoFileName] = useState("");
    const [confirmModal, setConfirmModal] = useState({ open: false, type: null });
    const [resultModal, setResultModal] = useState({ open: false, type: "success", title: "", text: "" });

    const actionMap = useMemo(() => {
        const map = {};
        ALL_ACTIONS.forEach(a => { map[a.key] = a; });
        return map;
    }, []);

    const loadPermission = useCallback(async () => {
        setLoading(true);
        try {
            const permission = await getImportGradingPermission();
            if (permission?.success === false) {
                setAuthorized(false);
                toast.error(permission?.message || t("You are not authorized to perform this task."));
            } else {
                setAuthorized(true);
            }
        } catch (err) {
            const status = err?.response?.status || err?.status;
            setAuthorized(status !== 403);
            toast.error(status === 403 ? t("You are not authorized to perform this task.") : (err?.message || t("Error loading Import Grading.")));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadPermission();
    }, [loadPermission]);

    const currentAction = activeAction ? actionMap[activeAction] : null;

    const getTemplatePath = useCallback((action) => {
        if (!action?.template) return "";
        return typeof action.template === "function" ? action.template(chkReplace) : action.template;
    }, [chkReplace]);

    const showResult = (success, text) => {
        setResultModal({
            open: true,
            type: success ? "success" : "error",
            title: success ? t("Success") : t("Warning!"),
            text: text || (success ? t("Success") : t("Operation failed."))
        });
    };

    const downloadTemplate = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const templatePath = getTemplatePath(currentAction);
        if (!templatePath) {
            toast.error(t("Template file not found."));
            return;
        }
        const fileName = decodeURIComponent(templatePath.split("/").pop() || "template.xlsx");
        const publicBase = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
        const fileUrl = `${publicBase}${templatePath.startsWith("/") ? templatePath : `/${templatePath}`}`;
        try {
            const response = await fetch(fileUrl, { method: "GET", cache: "no-store" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const contentType = (response.headers.get("content-type") || "").toLowerCase();
            if (contentType.includes("text/html")) throw new Error("Template file not found.");
            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(objectUrl);
        } catch (err) {
            toast.error(t("Template download failed. Please ensure the Excel file exists in public/excelfolder."));
        }
    }, [currentAction, getTemplatePath, t]);

    const closeImportModal = () => {
        setActiveAction(null);
        setFile(null);
    };

    const runAction = async () => {
        if (!currentAction) return;
        if (!file) {
            showResult(false, t("Please select an Excel file to import."));
            return;
        }
        setBusy(true);
        try {
            const payload = { ImportFile: file };
            if (currentAction.sendReplace) payload.ChkReplace = chkReplace;
            const response = await currentAction.handler(payload);
            if (response?.success || response?.Success) {
                closeImportModal();
                showResult(true, response?.Data || response?.data || t("Success"));
            } else {
                showResult(false, response?.Data || response?.data || response?.message || t("Operation failed."));
            }
        } catch (err) {
            const status = err?.response?.status || err?.status;
            showResult(
                false,
                status === 403
                    ? t("You are not authorized to perform this task.")
                    : err?.response?.data?.Data || err?.response?.data?.data || err?.message || t("Error")
            );
        } finally {
            setBusy(false);
        }
    };

    const openConfirm = (type) => setConfirmModal({ open: true, type });
    const closeConfirm = () => setConfirmModal({ open: false, type: null });
    const closeResult = () => setResultModal((prev) => ({ ...prev, open: false }));

    const handleConfirmAction = async () => {
        const { type } = confirmModal;
        closeConfirm();
        if (!type) return;
        const actionFn = type === "updateSizeId" ? updateImportSizeId : deleteImportDeletedRecords;
        setBusy(true);
        try {
            const response = await actionFn();
            if (response?.success === true || response?.Success === true) {
                showResult(true, response?.Data || response?.data || t("Success"));
            } else {
                showResult(false, response?.Data || response?.data || response?.message || t("Operation failed."));
            }
        } catch (err) {
            const status = err?.response?.status || err?.status;
            showResult(
                false,
                status === 403
                    ? t("You are not authorized to perform this task.")
                    : err?.response?.data?.Data || err?.response?.data?.data || err?.response?.data?.message || err?.message || t("Error")
            );
        } finally {
            setBusy(false);
        }
    };

    const confirmMessage =
        confirmModal.type === "updateSizeId"
            ? t("Update SizeId !!")
            : (
                <span>
                    {t("Delete Deleted Records in")}
                    <br />
                    TabSalePur,TabSalePurTran,TabMultiGrading,TabRateRevise,
                    <br />
                    TabItemMaster,TabPayRec,TabJV !!
                </span>
            );

    const submitLogo = async (e) => {
        e.preventDefault();
        if (!logoFile) {
            showResult(false, t("Please select JPG or JPEG image"));
            return;
        }
        setBusy(true);
        try {
            const response = await uploadImportLogo(logoFile);
            if (response?.success || response?.Success) {
                const savedPath = response?.path || response?.Path || "";
                if (savedPath) {
                    localStorage.setItem("companyLoginLogo", savedPath);
                    window.dispatchEvent(new Event("companyLogoUpdated"));
                }
                setLogoFile(null);
                setLogoFileName("");
                showResult(true, t("Company Logo updated successfully"));
            } else {
                showResult(false, response?.message || response?.Data || t("Upload failed"));
            }
        } catch (err) {
            showResult(false, err?.response?.data?.message || err?.message || t("Upload failed"));
        } finally {
            setBusy(false);
        }
    };

    document.title = `${t("Import Grading")} | ${t("Utility")}`;

    return (
        <React.Fragment>
            <ToastContainer position="top-right" autoClose={2500} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Import Grading")} pageTitle={t("Utility")} />

                    <div className="card stock-search-header-bar import-grading-topbar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <div>
                            <h3 className="mb-1 fw-bold text-primary d-flex align-items-center gap-2">
                                <i className="ri-upload-cloud-2-line fs-20 text-primary" />
                                {t("Import Grading")}
                            </h3>
                            <p className="mb-0 text-muted import-grading-hero-copy">
                                {t("Manage grading files, stock uploads, media imports and update tools from one place.")}
                            </p>
                        </div>
                        <div className="import-grading-hero-status">
                            <span className="import-grading-status-dot" />
                            {t("Import Center Ready")}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5"><Spinner color="primary" /></div>
                    ) : !authorized ? (
                        <Card className="shadow-sm border-0">
                            <CardBody className="text-center text-danger py-5">{t("You are not authorized to perform this task.")}</CardBody>
                        </Card>
                    ) : (
                        <>
                            <Row className="g-3">
                            <Col xxl={3} xl={6} lg={6} md={6} sm={12}>
                                <ImportCard
                                    title={t("Import Grading")}
                                    subtitle={t("Certificate and purchase grading uploads")}
                                    icon="ri-file-upload-line"
                                >
                                    {GRADING_ACTIONS.map(action => (
                                        <ActionButton key={action.key} action={action} t={t} disabled={busy} onClick={setActiveAction} />
                                    ))}
                                    <div className="import-grading-switch">
                                        <div>
                                            <div className="fw-semibold text-primary">{t("Upload New Print")}</div>
                                            <div className="text-muted import-grading-switch-note">{t("Use new print format while importing IGI or HRD files.")}</div>
                                        </div>
                                        <div className="form-check form-switch m-0">
                                            <Input id="chkReplace" type="checkbox" className="form-check-input" checked={chkReplace} onChange={e => setChkReplace(e.target.checked)} />
                                            <Label htmlFor="chkReplace" className="form-check-label visually-hidden">{t("Upload New Print")}</Label>
                                        </div>
                                    </div>
                                </ImportCard>
                            </Col>

                            <Col xxl={3} xl={6} lg={6} md={6} sm={12}>
                                <ImportCard
                                    title={t("Import Data")}
                                    subtitle={t("Upload image and video files with matching sheets")}
                                    icon="ri-image-add-line"
                                >
                                    {MEDIA_ACTIONS.map(action => (
                                        <ActionButton key={action.key} action={action} t={t} disabled={busy} onClick={setActiveAction} />
                                    ))}
                                </ImportCard>
                            </Col>

                            <Col xxl={3} xl={6} lg={6} md={6} sm={12}>
                                <ImportCard
                                    title={t("Import Parcel/Solitaire Data")}
                                    subtitle={t("Stock, account, jewellery and asking rate uploads")}
                                    icon="ri-database-2-line"
                                >
                                    {STOCK_ACTIONS.map(action => (
                                        <ActionButton key={action.key} action={action} t={t} disabled={busy} onClick={setActiveAction} />
                                    ))}
                                </ImportCard>
                            </Col>

                            <Col xxl={3} xl={6} lg={6} md={6} sm={12}>
                                <ImportCard
                                    title={t("Update Items")}
                                    subtitle={t("Run maintenance actions and update branding assets")}
                                    icon="ri-settings-3-line"
                                >
                                    <div className="import-grading-update-stack">
                                        <Button outline color="primary" className="w-100 import-grading-action text-start import-grading-action-compact" disabled={busy} onClick={() => openConfirm("updateSizeId")}>
                                            <span className="import-grading-action-main d-flex align-items-center gap-3">
                                                <span className="import-grading-action-icon"><i className="ri-ruler-line fs-18" /></span>
                                                <span className="flex-grow-1 min-w-0">
                                                    <span className="d-block text-truncate import-grading-action-label">{t("Update SizeId")}</span>
                                                    <span className="d-block text-truncate import-grading-action-meta">{t("Refresh size mapping for imported items")}</span>
                                                </span>
                                            </span>
                                        </Button>

                                        <Button outline color="primary" className="w-100 import-grading-action text-start import-grading-action-compact" disabled={busy} onClick={() => openConfirm("deleteRecords")}>
                                            <span className="import-grading-action-main d-flex align-items-center gap-3">
                                                <span className="import-grading-action-icon"><i className="ri-delete-bin-line fs-18" /></span>
                                                <span className="flex-grow-1 min-w-0">
                                                    <span className="d-block text-truncate import-grading-action-label">{t("Delete Deleted Records")}</span>
                                                    <span className="d-block text-truncate import-grading-action-meta">{t("Clean removed records from linked tables")}</span>
                                                </span>
                                            </span>
                                        </Button>

                                        <form onSubmit={submitLogo} className="import-grading-logo-panel">
                                            <Label className="form-label mb-2 fw-semibold text-primary">{t("Choose Image file")}</Label>
                                            <Input
                                                type="file"
                                                accept=".jpg,.jpeg"
                                                disabled={busy}
                                                onChange={e => {
                                                    const selected = e.target.files?.[0] || null;
                                                    setLogoFile(selected);
                                                    setLogoFileName(selected?.name || "");
                                                }}
                                            />
                                            {logoFileName ? <div className="text-muted fs-12 mt-2 text-truncate">{logoFileName}</div> : <div className="text-muted fs-12 mt-2">{t("JPG or JPEG logo file")}</div>}
                                            <Button type="submit" color="primary" className="w-100 mt-3" disabled={busy}>
                                                <i className="ri-image-edit-line me-1" />
                                                {t("Update Logo")}
                                            </Button>
                                        </form>
                                    </div>
                                </ImportCard>
                            </Col>
                            </Row>
                        </>
                    )}
                </Container>
            </div>

            {busy ? (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: "rgba(255,255,255,0.55)", zIndex: 1055 }}>
                    <Spinner color="primary" />
                </div>
            ) : null}

            <MvcSwalConfirm
                open={confirmModal.open}
                title={t("Are You Sure ??")}
                text={confirmMessage}
                confirmText={t("Yes")}
                cancelText={t("Cancel")}
                onConfirm={handleConfirmAction}
                onCancel={closeConfirm}
            />

            <MvcSwalResult
                open={resultModal.open}
                type={resultModal.type}
                title={resultModal.title}
                text={resultModal.text}
                confirmText={t("OK")}
                onClose={closeResult}
            />

            <Modal isOpen={!!currentAction} toggle={closeImportModal} centered>
                <ModalHeader toggle={closeImportModal} className="bg-primary">
                    <span className="text-white">{t("Import File")}</span>
                </ModalHeader>
                <ModalBody>
                    <Label className="form-label">{t("Select File To Import")}</Label>
                    <Input type="file" accept=".xls,.xlsx" onChange={e => setFile(e.target.files?.[0] || null)} />
                    {file ? <div className="text-muted fs-12 mt-1">{file.name}</div> : null}
                    {currentAction?.template && (
                        <div className="mt-3">
                            <Label className="form-label d-block">{t(currentAction.downloadLabel, { defaultValue: currentAction.downloadLabel })}</Label>
                            <Button color="primary" type="button" onClick={downloadTemplate}>
                                <i className="ri-download-cloud-2-line me-1" />
                                {t("Download")}
                            </Button>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={closeImportModal}>{t("Close")}</Button>
                    <Button color="primary" disabled={busy} onClick={runAction}>{t("Accept")}</Button>
                </ModalFooter>
            </Modal>
        </React.Fragment>
    );
};

export default ImportGrading;
