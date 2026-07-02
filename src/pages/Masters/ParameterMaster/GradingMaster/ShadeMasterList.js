import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, CardHeader, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getShadeMasters, saveShadeMaster, deleteShadeMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";

const ShadeMasterList = () => {
    const { t } = useTranslation();

    document.title = `${t("Shade Master")} | ${t("Admin")}`;

    const [shadeList, setShadeList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [deleteModal, setDeleteModal] = useState(false);
    const [shadeToDelete, setShadeToDelete] = useState(null);

    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchShadeMaster();
    }, []);

    const fetchShadeMaster = async () => {
        setLoading(true);
        try {
            const response = await getShadeMasters();
            if (response.success || response.Success) {
                setShadeList(response.data || response.Data || []);
            } else {
                toast.error(response.message || "Failed to load Shade Master");
            }
        } catch (e) {
            toast.error("Unable to load Shade Master");
        }
        setLoading(false);
    };

    const handleAddClick = () => {
        setIsEdit(false);
        validation.resetForm();
        setFormModal(true);
    };

    const handleEditClick = (shade) => {
        setIsEdit(true);
        validation.setValues({
            id: shade.id || shade.ID || 0,
            shadeID: shade.shadeID || shade.ShadeID || "",
            shadeName: shade.shadeName || shade.ShadeName || "",
            shadePriority: shade.shadePriority !== undefined ? shade.shadePriority : shade.ShadePriority,
            shadeGroupName: shade.shadeGroupName || shade.ShadeGroupName || "",
            shadeGroupPriority: shade.shadeGroupPriority !== undefined ? shade.shadeGroupPriority : shade.ShadeGroupPriority,
            pricingShadeID: shade.pricingShadeID || shade.PricingShadeID || ""
        });
        setFormModal(true);
    };

    const handleDeleteClick = (shade) => {
        setShadeToDelete(shade);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!shadeToDelete) return;
        const id = shadeToDelete.id || shadeToDelete.ID;
        try {
            const response = await deleteShadeMaster(id);
            if (response.success || response.Success) {
                toast.success("Shade Deleted Successfully");
                fetchShadeMaster();
            } else {
                toast.error(
                    response.message ||
                    response.Message ||
                    "Unable to delete Shade."
                );
            }
        } catch (e) {
            toast.error("Unable to delete Shade.");
        }
        setDeleteModal(false);
        setShadeToDelete(null);
    };

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            shadeID: "",
            shadeName: "",
            shadePriority: "",
            shadeGroupName: "",
            shadeGroupPriority: "",
            pricingShadeID: ""
        },
        validationSchema: Yup.object({
            shadeID: Yup.string().required("Please Enter Shade ID"),
            shadeName: Yup.string().required("Please Enter Shade Name"),
            shadePriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Shade Priority"),
            shadeGroupName: Yup.string(),
            shadeGroupPriority: Yup.number().nullable(),
            pricingShadeID: Yup.string()
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    shadeID: values.shadeID,
                    shadeName: values.shadeName,
                    shadePriority: Number(values.shadePriority),
                    shadeGroupName: values.shadeGroupName,
                    shadeGroupPriority: Number(values.shadeGroupPriority || 0),
                    pricingShadeID: values.pricingShadeID
                };

                const response = await saveShadeMaster(payload);
                if (response.success || response.Success) {
                    toast.success("Shade Master Saved Successfully");
                    setFormModal(false);
                    validation.resetForm();
                    fetchShadeMaster();
                } else {
                    toast.error(
                        response.message ||
                        response.Message ||
                        "Unable to save Shade Master"
                    );
                }
            } catch {
                toast.error("Unable to save Shade Master");
            }
        }
    });

    const handleFileSelect = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const processImportFile = async () => {
        const file = selectedFile;
        if (!file) {
            toast.warning("Please select a file first");
            return;
        }

        setImporting(true);
        setImportProgress({ current: 0, total: 0 });

        try {
            const expectedHeaders = ["Shade ID", "Shade Name", "Shade Priority", "Shade Group Name", "Shade Group Priority", "Pricing Shade ID"];
            const parsed = await parseExcelFile(file, expectedHeaders);
            if (!parsed.success) throw parsed.error || new Error("Failed to parse file");
            
            const rows = parsed.rows;

            if (rows.length <= 1) {
                toast.warning("The selected file contains no data.");
                setImporting(false);
                return;
            }

            // Exclude the header row
            const dataRows = rows.slice(1).filter(r => r && r.length > 0 && String(r[0] || "").trim() !== "");
            setImportProgress({ current: 0, total: dataRows.length });

            let successCount = 0;
            let errorCount = 0;
            let errorMessages = [];

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];

                const shadeID = String(row[0] || "").trim();
                const shadeName = String(row[1] || "").trim();

                if (!shadeID || !shadeName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Shade ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Shade ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const shadePriority = parseFloat(row[2] || 0);
                const shadeGroupName = String(row[3] || "").trim();
                const shadeGroupPriority = parseFloat(row[4] || 0);
                const pricingShadeID = String(row[5] || "").trim();

                const existing = shadeList.find(x => String(x.shadeID || x.ShadeID).toLowerCase() === shadeID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    shadeID,
                    shadeName,
                    shadePriority,
                    shadeGroupName,
                    shadeGroupPriority,
                    pricingShadeID
                };

                try {
                    const response = await saveShadeMaster(payload);
                    if (response.success || response.Success) {
                        successCount++;
                    } else {
                        errorCount++;
                        const msg = response.data || response.message || response.Message || "Unknown error";
                        errorMessages.push(`Row ${i + 2}: ${msg}`);
                        console.error(`Error saving row ${i + 2}:`, msg);
                    }
                } catch (err) {
                    errorCount++;
                    let msg = err.message;
                    if (err.response && err.response.data) {
                        if (typeof err.response.data === 'string') msg = err.response.data;
                        else if (err.response.data.title) msg = err.response.data.title;
                        else if (err.response.data.Message) msg = err.response.data.Message;
                    }
                    errorMessages.push(`Row ${i + 2}: ${msg}`);
                    console.error(`Exception saving row ${i + 2}:`, err);
                }

                setImportProgress(prev => ({ ...prev, current: i + 1 }));
            }

            if (errorCount > 0) {
                const firstFew = errorMessages.slice(0, 3).join(" | ");
                toast.error(`Imported ${successCount}. Failed ${errorCount}. Errors: ${firstFew}${errorCount > 3 ? "..." : ""}`, { autoClose: 8000 });
            } else {
                toast.success(`Import complete! Successfully saved ${successCount} Shade.`);
            }
            
            fetchShadeMaster();
            setImportModal(false);
            setSelectedFile(null);
        } catch (error) {
            toast.error("Failed to parse file: " + error.message);
        } finally {
            setImporting(false);
        }
    };

    const handleExport = async () => {
        if (shadeList.length === 0) {
            toast.warning("No data found.");
            return;
        }

        const headers = [
            "Shade ID",
            "Shade Name",
            "Shade Priority",
            "Shade Group Name",
            "Shade Group Priority",
            "Pricing Shade ID"
        ];

        const rows = shadeList.map(x => [
            x.shadeID || x.ShadeID,
            x.shadeName || x.ShadeName,
            x.shadePriority || x.ShadePriority,
            x.shadeGroupName || x.ShadeGroupName,
            x.shadeGroupPriority || x.ShadeGroupPriority,
            x.pricingShadeID || x.PricingShadeID
        ]);

        await exportToExcel(
            headers,
            rows,
            "ShadeMaster",
            "ShadeMasterList"
        );
    };

    const handleDownloadTemplate = async () => {
        const headers = [
            "Shade ID",
            "Shade Name",
            "Shade Priority",
            "Shade Group Name",
            "Shade Group Priority",
            "Pricing Shade ID"
        ];

        const sampleRow = [
            "S001",
            "SHADE1",
            "1",
            "SHADE GROUP",
            "1",
            "PS001"
        ];

        const result = await exportToExcel(
            headers,
            [sampleRow],
            "Template",
            "ShadeMasterTemplate"
        );

        if (!result.success) {
            toast.error("Failed to download template.");
        }
    };

    const columns = useMemo(() => [
        {
            header: t("Actions"),
            id: "actions",
            enableColumnFilter: false,
            cell: (cellProps) => {
                const row = cellProps.row.original;
                return (
                    <div className="d-flex gap-2">
                        <button
                            className="btn"
                            style={{
                                backgroundColor: "#e5f1ff",
                                color: "#299cdb",
                                border: "none",
                                borderRadius: "6px",
                                width: "30px",
                                height: "30px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0"
                            }}
                            onClick={() => handleEditClick(row)}
                            title={t("Edit Shade")}
                        >
                            <i className="ri-pencil-fill" style={{ fontSize: "14px" }}></i>
                        </button>
                        <button
                            className="btn"
                            style={{
                                backgroundColor: "#ffeded",
                                color: "#f06548",
                                border: "none",
                                borderRadius: "6px",
                                width: "30px",
                                height: "30px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0"
                            }}
                            onClick={() => handleDeleteClick(row)}
                            title={t("Delete Shade")}
                        >
                            <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                        </button>
                    </div>
                );
            }
        },
        {
            header: t("ID"),
            accessorFn: row => row.shadeID || row.ShadeID
        },
        {
            header: t("Name"),
            accessorFn: row => row.shadeName || row.ShadeName
        },
        {
            header: t("Priority"),
            accessorFn: row => row.shadePriority || row.ShadePriority
        },
        {
            header: t("Group Name"),
            accessorFn: row => row.shadeGroupName || row.ShadeGroupName
        },
        {
            header: t("Group Priority"),
            accessorFn: row => row.shadeGroupPriority || row.ShadeGroupPriority
        },
        {
            header: t("Pricing ID"),
            accessorFn: row => row.pricingShadeID || row.PricingShadeID
        }
    ], [shadeList]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Shade Master")} pageTitle={t("Masters")} />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center justify-content-between">
                                    <h5 className="card-title mb-0 flex-grow-1">{t("Shade List")}</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> {t("Add Shade")}
                                        </Button>
                                        <Button color="soft-success" onClick={() => setImportModal(true)}>{t("Import Excel")}</Button>
                                        <Button
                                            className="btn-soft-success"
                                            onClick={handleExport}
                                            title={t("Export Excel")}
                                            style={{
                                                height: "37.5px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >
                                            <i className="ri-file-excel-2-line" style={{ fontSize: "25px" }}></i>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {loading ? (
                                        <div className="text-center">
                                            <div className="spinner-border text-primary"></div>
                                        </div>
                                    ) : (
                                        <TableContainer
                                            columns={columns}
                                            data={shadeList}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            SearchPlaceholder={t("Search Shade...")}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                        />
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            <Modal isOpen={formModal} toggle={() => setFormModal(false)} centered>
                <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
                    <ModalHeader toggle={() => setFormModal(false)}>
                        {isEdit ? t("Edit Shade Master") : t("Add Shade Master")}
                    </ModalHeader>
                    <ModalBody>
                        <Row className="gy-3">
                            <Col md={12}>
                                <Label className="form-label">{t("Shade ID")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="shadeID"
                                    type="text"
                                    placeholder={t("Enter Shade ID")}
                                    value={validation.values.shadeID}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.shadeID && validation.errors.shadeID ? true : false}
                                />
                                <FormFeedback>{validation.errors.shadeID}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Shade Name")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="shadeName"
                                    type="text"
                                    placeholder={t("Enter Shade Name")}
                                    value={validation.values.shadeName}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.shadeName && validation.errors.shadeName ? true : false}
                                />
                                <FormFeedback>{validation.errors.shadeName}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Shade Priority")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="shadePriority"
                                    type="number"
                                    placeholder={t("Enter Shade Priority")}
                                    value={validation.values.shadePriority}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.shadePriority && validation.errors.shadePriority ? true : false}
                                />
                                <FormFeedback>{validation.errors.shadePriority}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Shade Group Name")}</Label>
                                <Input
                                    name="shadeGroupName"
                                    type="text"
                                    placeholder={t("Enter Shade Group Name")}
                                    value={validation.values.shadeGroupName}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Shade Group Priority")}</Label>
                                <Input
                                    name="shadeGroupPriority"
                                    type="number"
                                    placeholder={t("Enter Shade Group Priority")}
                                    value={validation.values.shadeGroupPriority}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Pricing Shade ID")}</Label>
                                <Input
                                    name="pricingShadeID"
                                    type="text"
                                    placeholder={t("Enter Pricing Shade ID")}
                                    value={validation.values.pricingShadeID}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" type="button" onClick={() => setFormModal(false)}>{t("Cancel")}</Button>
                        <Button color="primary" type="submit">{t("Save")}</Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Import Excel Modal */}
            <Modal isOpen={importModal} toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }} centered>
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>{t("Import Shade Master Excel")}</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download Shade Master File Template Format")}</Label>
                        <div>
                            <Button color="primary" onClick={handleDownloadTemplate} size="sm">
                                <i className="ri-download-2-line align-bottom me-1"></i>{t("Download Format")}</Button>
                        </div>
                    </div>
                    <hr />
                    <div className="mb-3">
                        <Label htmlFor="importFile" className="form-label">{t("Select Excel File To Import")}</Label>
                        <Input
                            type="file"
                            id="importFile"
                            accept=".xls, .xlsx"
                            onChange={handleFileSelect}
                            disabled={importing}
                        />
                    </div>
                    {importing && (
                        <div className="mt-3">
                            <div className="d-flex justify-content-between mb-1">
                                <span className="text-muted">{t("Processing rows...")}</span>
                                <span className="text-muted">{importProgress.current} / {importProgress.total}</span>
                            </div>
                            <Progress value={importProgress.total ? (importProgress.current / importProgress.total) * 100 : 0} color="primary" />
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => { setImportModal(false); setSelectedFile(null); }} disabled={importing}>{t("Close")}</Button>
                    <Button color="primary" onClick={processImportFile} disabled={importing || !selectedFile}>{t("Submit")}</Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
                <ModalHeader toggle={() => setDeleteModal(false)}>{t("Confirm Delete")}</ModalHeader>
                <ModalBody>
                    <div className="mt-2 text-center">
                        <lord-icon
                            src="https://cdn.lordicon.com/gsqxdxog.json"
                            trigger="loop"
                            colors="primary:#f7b84b,secondary:#f06548"
                            style={{ width: "100px", height: "100px" }}
                        ></lord-icon>
                        <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            <h4>{t("Are you sure?")}</h4>
                            <p className="text-muted mx-4 mb-0">
                                {t("Are you sure you want to delete Shade")} <strong>{shadeToDelete?.shadeID || shadeToDelete?.shadeName}</strong>?
                            </p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <Button type="button" color="light" className="w-sm" onClick={() => setDeleteModal(false)}>{t("Cancel")}</Button>
                        <Button type="button" color="danger" className="w-sm" onClick={handleDeleteConfirm}>{t("Yes, Delete It!")}</Button>
                    </div>
                </ModalBody>
            </Modal>
            <ToastContainer closeButton={false} limit={1} />
        </React.Fragment>
    );
};

export default ShadeMasterList;
