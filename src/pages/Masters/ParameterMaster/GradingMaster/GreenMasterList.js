import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, CardHeader, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getGreenMasters, saveGreenMaster, deleteGreenMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";

const GreenMasterList = () => {
    const { t } = useTranslation();

    document.title = `${t("Green Master")} | ${t("Admin")}`;

    const [greenList, setGreenList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [deleteModal, setDeleteModal] = useState(false);
    const [greenToDelete, setGreenToDelete] = useState(null);

    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchGreenMaster();
    }, []);

    const fetchGreenMaster = async () => {
        setLoading(true);
        try {
            const response = await getGreenMasters();
            if (response.success || response.Success) {
                setGreenList(response.data || response.Data || []);
            } else {
                toast.error(response.message || "Failed to load Green Master");
            }
        } catch (e) {
            toast.error("Unable to load Green Master");
        }
        setLoading(false);
    };

    const handleAddClick = () => {
        setIsEdit(false);
        validation.resetForm();
        setFormModal(true);
    };

    const handleEditClick = (green) => {
        setIsEdit(true);
        validation.setValues({
            id: green.id || green.ID || 0,
            greenID: green.greenID || green.GreenID || "",
            greenName: green.greenName || green.GreenName || "",
            greenPriority: green.greenPriority !== undefined ? green.greenPriority : green.GreenPriority,
            greenGroupName: green.greenGroupName || green.GreenGroupName || "",
            greenGroupPriority: green.greenGroupPriority !== undefined ? green.greenGroupPriority : green.GreenGroupPriority,
            pricingGreenID: green.pricingGreenID || green.PricingGreenID || ""
        });
        setFormModal(true);
    };

    const handleDeleteClick = (green) => {
        setGreenToDelete(green);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!greenToDelete) return;
        const id = greenToDelete.id || greenToDelete.ID;
        try {
            const response = await deleteGreenMaster(id);
            if (response.success || response.Success) {
                toast.success("Green Deleted Successfully");
                fetchGreenMaster();
            } else {
                toast.error(
                    response.message ||
                    response.Message ||
                    "Unable to delete Green."
                );
            }
        } catch {
            toast.error("Unable to delete Green.");
        }
        setDeleteModal(false);
        setGreenToDelete(null);
    };

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            greenID: "",
            greenName: "",
            greenPriority: "",
            greenGroupName: "",
            greenGroupPriority: "",
            pricingGreenID: ""
        },
        validationSchema: Yup.object({
            greenID: Yup.string().required("Please Enter Green ID"),
            greenName: Yup.string().required("Please Enter Green Name"),
            greenPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Green Priority"),
            greenGroupName: Yup.string(),
            greenGroupPriority: Yup.number().nullable(),
            pricingGreenID: Yup.string()
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    greenID: values.greenID,
                    greenName: values.greenName,
                    greenPriority: Number(values.greenPriority),
                    greenGroupName: values.greenGroupName,
                    greenGroupPriority: Number(values.greenGroupPriority || 0),
                    pricingGreenID: values.pricingGreenID
                };

                const response = await saveGreenMaster(payload);
                if (response.success || response.Success) {
                    toast.success("Green Master Saved Successfully");
                    setFormModal(false);
                    validation.resetForm();
                    fetchGreenMaster();
                } else {
                    toast.error(
                        response.message ||
                        response.Message ||
                        "Unable to save Green Master"
                    );
                }
            } catch {
                toast.error("Unable to save Green Master");
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
            const expectedHeaders = ["Green ID", "Green Name", "Green Priority", "Green Group Name", "Green Group Priority", "Pricing Green ID"];
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

                const greenID = String(row[0] || "").trim();
                const greenName = String(row[1] || "").trim();

                if (!greenID || !greenName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Green ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Green ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const greenPriority = parseFloat(row[2] || 0);
                const greenGroupName = String(row[3] || "").trim();
                const greenGroupPriority = parseFloat(row[4] || 0);
                const pricingGreenID = String(row[5] || "").trim();

                const existing = greenList.find(x => String(x.greenID || x.GreenID).toLowerCase() === greenID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    greenID,
                    greenName,
                    greenPriority,
                    greenGroupName,
                    greenGroupPriority,
                    pricingGreenID
                };

                try {
                    const response = await saveGreenMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} Green.`);
            }
            
            fetchGreenMaster();
            setImportModal(false);
            setSelectedFile(null);
        } catch (error) {
            toast.error("Failed to parse file: " + error.message);
        } finally {
            setImporting(false);
        }
    };

    const handleExport = async () => {
        if (greenList.length === 0) {
            toast.warning("No data found.");
            return;
        }

        const headers = [
            "Green ID",
            "Green Name",
            "Green Priority",
            "Green Group Name",
            "Green Group Priority",
            "Pricing Green ID"
        ];

        const rows = greenList.map(x => [
            x.greenID || x.GreenID,
            x.greenName || x.GreenName,
            x.greenPriority || x.GreenPriority,
            x.greenGroupName || x.GreenGroupName,
            x.greenGroupPriority || x.GreenGroupPriority,
            x.pricingGreenID || x.PricingGreenID
        ]);

        await exportToExcel(
            headers,
            rows,
            "GreenMaster",
            "GreenMasterList"
        );
    };

    const handleDownloadTemplate = async () => {
        const headers = [
            "Green ID",
            "Green Name",
            "Green Priority",
            "Green Group Name",
            "Green Group Priority",
            "Pricing Green ID"
        ];

        const sampleRow = [
            "G001",
            "LIGHT GREEN",
            "1",
            "GREEN GROUP",
            "1",
            "PG001"
        ];

        const result = await exportToExcel(
            headers,
            [sampleRow],
            "Template",
            "GreenMasterTemplate"
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
                            title={t("Edit Green")}
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
                            title={t("Delete Green")}
                        >
                            <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                        </button>
                    </div>
                );
            }
        },
        {
            header: t("ID"),
            accessorFn: row => row.greenID || row.GreenID
        },
        {
            header: t("Name"),
            accessorFn: row => row.greenName || row.GreenName
        },
        {
            header: t("Priority"),
            accessorFn: row => row.greenPriority || row.GreenPriority
        },
        {
            header: t("Group Name"),
            accessorFn: row => row.greenGroupName || row.GreenGroupName
        },
        {
            header: t("Group Priority"),
            accessorFn: row => row.greenGroupPriority || row.GreenGroupPriority
        },
        {
            header: t("Pricing ID"),
            accessorFn: row => row.pricingGreenID || row.PricingGreenID
        }
    ], [greenList]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Green Master")} pageTitle={t("Masters")} />
                    <Row>
                        <Col lg={12}>
                            <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                                <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
                                    <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary d-flex align-items-center gap-2">
                                        <i className="ri-medal-line fs-20 text-primary"></i>
                                        {t("Green List")}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn rounded-3 d-inline-flex align-items-center gap-1" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> {t("Add Green")}
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
                                            data={greenList}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            SearchPlaceholder={t("Search Green...")}
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
                    <ModalHeader toggle={() => setFormModal(false)} className="bg-primary p-3 border-0">
                        <span className="text-white fw-bold">{isEdit ? t("Edit Green Master") : t("Add Green Master")}</span>
                    </ModalHeader>
                    <ModalBody>
                        <Row className="gy-3">
                            <Col md={12}>
                                <Label className="form-label">{t("Green ID")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="greenID"
                                    type="text"
                                    placeholder={t("Enter Green ID")}
                                    value={validation.values.greenID}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.greenID && validation.errors.greenID ? true : false}
                                />
                                <FormFeedback>{validation.errors.greenID}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Green Name")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="greenName"
                                    type="text"
                                    placeholder={t("Enter Green Name")}
                                    value={validation.values.greenName}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.greenName && validation.errors.greenName ? true : false}
                                />
                                <FormFeedback>{validation.errors.greenName}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Green Priority")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="greenPriority"
                                    type="number"
                                    placeholder={t("Enter Green Priority")}
                                    value={validation.values.greenPriority}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.greenPriority && validation.errors.greenPriority ? true : false}
                                />
                                <FormFeedback>{validation.errors.greenPriority}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Green Group Name")}</Label>
                                <Input
                                    name="greenGroupName"
                                    type="text"
                                    placeholder={t("Enter Green Group Name")}
                                    value={validation.values.greenGroupName}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Green Group Priority")}</Label>
                                <Input
                                    name="greenGroupPriority"
                                    type="number"
                                    placeholder={t("Enter Green Group Priority")}
                                    value={validation.values.greenGroupPriority}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Pricing Green ID")}</Label>
                                <Input
                                    name="pricingGreenID"
                                    type="text"
                                    placeholder={t("Enter Pricing Green ID")}
                                    value={validation.values.pricingGreenID}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" type="button" className="rounded-3" onClick={() => setFormModal(false)}>{t("Cancel")}</Button>
                        <Button color="primary" type="submit" className="rounded-3">{isEdit ? t("Update") : t("Save")}</Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Import Excel Modal */}
            <Modal isOpen={importModal} toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }} centered>
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }} className="bg-primary p-3 border-0">
                    <span className="text-white fw-bold">{t("Import Green Master Excel")}</span>
                </ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download Green Master File Template Format")}</Label>
                        <div>
                            <Button color="primary" onClick={handleDownloadTemplate} size="sm" className="rounded-3">
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
                    <Button color="light" className="rounded-3" onClick={() => { setImportModal(false); setSelectedFile(null); }} disabled={importing}>{t("Close")}</Button>
                    <Button color="primary" className="rounded-3" onClick={processImportFile} disabled={importing || !selectedFile}>{t("Submit")}</Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
                <ModalHeader toggle={() => setDeleteModal(false)} className="bg-danger p-3 border-0">
                    <span className="text-white fw-bold">{t("Confirm Delete")}</span>
                </ModalHeader>
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
                                {t("Are you sure you want to delete Green")} <strong>{greenToDelete?.greenID || greenToDelete?.greenName}</strong>?
                            </p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <Button type="button" color="light" className="w-sm rounded-3" onClick={() => setDeleteModal(false)}>{t("Cancel")}</Button>
                        <Button type="button" color="danger" className="w-sm rounded-3" onClick={handleDeleteConfirm}>{t("Yes, Delete It!")}</Button>
                    </div>
                </ModalBody>
            </Modal>
            <ToastContainer autoClose={2000} />
        </React.Fragment>
    );
};

export default GreenMasterList;
