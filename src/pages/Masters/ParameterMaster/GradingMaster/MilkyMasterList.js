import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, CardHeader, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getMilkyMasters, saveMilkyMaster, deleteMilkyMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";

const MilkyMasterList = () => {
    const { t } = useTranslation();

    document.title = `${t("Milky Master")} | ${t("Admin")}`;

    const [milkyList, setMilkyList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [deleteModal, setDeleteModal] = useState(false);
    const [milkyToDelete, setMilkyToDelete] = useState(null);

    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchMilkyMaster();
    }, []);

    const fetchMilkyMaster = async () => {
        setLoading(true);
        try {
            const response = await getMilkyMasters();
            if (response.success || response.Success) {
                setMilkyList(response.data || response.Data || []);
            } else {
                toast.error(response.message || "Failed to load Milky Master");
            }
        } catch (e) {
            toast.error("Unable to load Milky Master");
        }
        setLoading(false);
    };

    const handleAddClick = () => {
        setIsEdit(false);
        validation.resetForm();
        setFormModal(true);
    };

    const handleEditClick = (milky) => {
        setIsEdit(true);
        validation.setValues({
            id: milky.id || milky.ID || 0,
            milkyID: milky.milkyID || milky.MilkyID || "",
            milkyName: milky.milkyName || milky.MilkyName || "",
            milkyPriority: milky.milkyPriority !== undefined ? milky.milkyPriority : milky.MilkyPriority,
            milkyGroupName: milky.milkyGroupName || milky.MilkyGroupName || "",
            milkyGroupPriority: milky.milkyGroupPriority !== undefined ? milky.milkyGroupPriority : milky.MilkyGroupPriority,
            pricingMilkyID: milky.pricingMilkyID || milky.PricingMilkyID || ""
        });
        setFormModal(true);
    };

    const handleDeleteClick = (milky) => {
        setMilkyToDelete(milky);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!milkyToDelete) return;
        const id = milkyToDelete.id || milkyToDelete.ID;
        try {
            const response = await deleteMilkyMaster(id);
            if (response.success || response.Success) {
                toast.success("Milky Deleted Successfully");
                fetchMilkyMaster();
            } else {
                toast.error(
                    response.message ||
                    response.Message ||
                    "Unable to delete Milky."
                );
            }
        } catch (e) {
            toast.error("Unable to delete Milky.");
        }
        setDeleteModal(false);
        setMilkyToDelete(null);
    };

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            milkyID: "",
            milkyName: "",
            milkyPriority: "",
            milkyGroupName: "",
            milkyGroupPriority: "",
            pricingMilkyID: ""
        },
        validationSchema: Yup.object({
            milkyID: Yup.string().required("Please Enter Milky ID"),
            milkyName: Yup.string().required("Please Enter Milky Name"),
            milkyPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Milky Priority"),
            milkyGroupName: Yup.string(),
            milkyGroupPriority: Yup.number().nullable(),
            pricingMilkyID: Yup.string()
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    milkyID: values.milkyID,
                    milkyName: values.milkyName,
                    milkyPriority: Number(values.milkyPriority),
                    milkyGroupName: values.milkyGroupName,
                    milkyGroupPriority: Number(values.milkyGroupPriority || 0),
                    pricingMilkyID: values.pricingMilkyID
                };

                const response = await saveMilkyMaster(payload);
                if (response.success || response.Success) {
                    toast.success("Milky Master Saved Successfully");
                    setFormModal(false);
                    validation.resetForm();
                    fetchMilkyMaster();
                } else {
                    toast.error(
                        response.message ||
                        response.Message ||
                        "Unable to save Milky Master"
                    );
                }
            } catch {
                toast.error("Unable to save Milky Master");
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
            const expectedHeaders = ["Milky ID", "Milky Name", "Milky Priority", "Milky Group Name", "Milky Group Priority", "Pricing Milky ID"];
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

                const milkyID = String(row[0] || "").trim();
                const milkyName = String(row[1] || "").trim();

                if (!milkyID || !milkyName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Milky ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Milky ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const milkyPriority = parseFloat(row[2] || 0);
                const milkyGroupName = String(row[3] || "").trim();
                const milkyGroupPriority = parseFloat(row[4] || 0);
                const pricingMilkyID = String(row[5] || "").trim();

                const existing = milkyList.find(x => String(x.milkyID || x.MilkyID).toLowerCase() === milkyID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    milkyID,
                    milkyName,
                    milkyPriority,
                    milkyGroupName,
                    milkyGroupPriority,
                    pricingMilkyID
                };

                try {
                    const response = await saveMilkyMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} Milky.`);
            }
            
            fetchMilkyMaster();
            setImportModal(false);
            setSelectedFile(null);
        } catch (error) {
            toast.error("Failed to parse file: " + error.message);
        } finally {
            setImporting(false);
        }
    };

    const handleExport = async () => {
        if (milkyList.length === 0) {
            toast.warning("No data found.");
            return;
        }

        const headers = [
            "Milky ID",
            "Milky Name",
            "Milky Priority",
            "Milky Group Name",
            "Milky Group Priority",
            "Pricing Milky ID"
        ];

        const rows = milkyList.map(x => [
            x.milkyID || x.MilkyID,
            x.milkyName || x.MilkyName,
            x.milkyPriority || x.MilkyPriority,
            x.milkyGroupName || x.MilkyGroupName,
            x.milkyGroupPriority || x.MilkyGroupPriority,
            x.pricingMilkyID || x.PricingMilkyID
        ]);

        await exportToExcel(
            headers,
            rows,
            "MilkyMaster",
            "MilkyMasterList"
        );
    };

    const handleDownloadTemplate = async () => {
        const headers = [
            "Milky ID",
            "Milky Name",
            "Milky Priority",
            "Milky Group Name",
            "Milky Group Priority",
            "Pricing Milky ID"
        ];

        const sampleRow = [
            "M001",
            "M1",
            "1",
            "MILKY GROUP",
            "1",
            "PM001"
        ];

        const result = await exportToExcel(
            headers,
            [sampleRow],
            "Template",
            "MilkyMasterTemplate"
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
                            title={t("Edit Milky")}
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
                            title={t("Delete Milky")}
                        >
                            <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                        </button>
                    </div>
                );
            }
        },
        {
            header: t("ID"),
            accessorFn: row => row.milkyID || row.MilkyID
        },
        {
            header: t("Name"),
            accessorFn: row => row.milkyName || row.MilkyName
        },
        {
            header: t("Priority"),
            accessorFn: row => row.milkyPriority || row.MilkyPriority
        },
        {
            header: t("Group Name"),
            accessorFn: row => row.milkyGroupName || row.MilkyGroupName
        },
        {
            header: t("Group Priority"),
            accessorFn: row => row.milkyGroupPriority || row.MilkyGroupPriority
        },
        {
            header: t("Pricing ID"),
            accessorFn: row => row.pricingMilkyID || row.PricingMilkyID
        }
    ], [milkyList]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Milky Master")} pageTitle={t("Masters")} />
                    <Row>
                        <Col lg={12}>
                            <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                                <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
                                    <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary d-flex align-items-center gap-2">
                                        <i className="ri-medal-line fs-20 text-primary"></i>
                                        {t("Milky List")}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> {t("Add Milky")}
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
                                            data={milkyList}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            SearchPlaceholder={t("Search Milky...")}
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
                        {isEdit ? t("Edit Milky Master") : t("Add Milky Master")}
                    </ModalHeader>
                    <ModalBody>
                        <Row className="gy-3">
                            <Col md={12}>
                                <Label className="form-label">{t("Milky ID")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="milkyID"
                                    type="text"
                                    placeholder={t("Enter Milky ID")}
                                    value={validation.values.milkyID}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.milkyID && validation.errors.milkyID ? true : false}
                                />
                                <FormFeedback>{validation.errors.milkyID}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Milky Name")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="milkyName"
                                    type="text"
                                    placeholder={t("Enter Milky Name")}
                                    value={validation.values.milkyName}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.milkyName && validation.errors.milkyName ? true : false}
                                />
                                <FormFeedback>{validation.errors.milkyName}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Milky Priority")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="milkyPriority"
                                    type="number"
                                    placeholder={t("Enter Milky Priority")}
                                    value={validation.values.milkyPriority}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.milkyPriority && validation.errors.milkyPriority ? true : false}
                                />
                                <FormFeedback>{validation.errors.milkyPriority}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Milky Group Name")}</Label>
                                <Input
                                    name="milkyGroupName"
                                    type="text"
                                    placeholder={t("Enter Milky Group Name")}
                                    value={validation.values.milkyGroupName}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Milky Group Priority")}</Label>
                                <Input
                                    name="milkyGroupPriority"
                                    type="number"
                                    placeholder={t("Enter Milky Group Priority")}
                                    value={validation.values.milkyGroupPriority}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Pricing Milky ID")}</Label>
                                <Input
                                    name="pricingMilkyID"
                                    type="text"
                                    placeholder={t("Enter Pricing Milky ID")}
                                    value={validation.values.pricingMilkyID}
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
            <Modal isOpen={importModal} toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }} className="modal-dialog-centered">
                <ModalHeader className="bg-success pb-3 text-white" toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>{t("Import Milky Master Excel")}</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download Milky Master File Template Format")}</Label>
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
            <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} className="modal-dialog-centered">
                <ModalHeader className="bg-danger pb-3 text-white" toggle={() => setDeleteModal(false)}>{t("Confirm Delete")}</ModalHeader>
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
                                {t("Are you sure you want to delete Milky")} <strong>{milkyToDelete?.milkyID || milkyToDelete?.milkyName}</strong>?
                            </p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <Button type="button" color="light" className="w-sm" onClick={() => setDeleteModal(false)}>{t("Cancel")}</Button>
                        <Button type="button" color="danger" className="w-sm" onClick={handleDeleteConfirm}>{t("Yes, Delete It!")}</Button>
                    </div>
                </ModalBody>
            </Modal>
            <ToastContainer autoClose={2000} />
        </React.Fragment>
    );
};

export default MilkyMasterList;
