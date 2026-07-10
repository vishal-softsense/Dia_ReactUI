import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getTermMasters, saveTermMaster, deleteTermMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";

const TermMasterList = () => {
    const { t } = useTranslation();
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [termToDelete, setTermToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchTerms();
    }, []);

    const fetchTerms = async () => {
        setLoading(true);
        try {
            const response = await getTermMasters();
            if (response.success || response.Success) {
                setTerms(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Term Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch Term Master data");
        }
        setLoading(false);
    };

    // Open Modal for Add
    const handleAddClick = () => {
        setIsEdit(false);
        validation.resetForm();
        setFormModal(true);
    };

    // Open Modal for Edit
    const handleEditClick = (term) => {
        setIsEdit(true);
        validation.setValues({
            id: term.id || term.ID || 0,
            termID: term.termID || term.TermID || "",
            termName: term.termName || term.TermName || "",
            termPriority: term.termPriority !== undefined ? term.termPriority : (term.TermPriority !== undefined ? term.TermPriority : "")
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (term) => {
        setTermToDelete(term);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (termToDelete) {
            const id = termToDelete.id || termToDelete.ID;
            try {
                const response = await deleteTermMaster(id);
                if (response.success || response.Success) {
                    toast.success("Term Deleted Successfully");
                    fetchTerms();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete term. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete term");
            }
            setDeleteModal(false);
            setTermToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            termID: "",
            termName: "",
            termPriority: ""
        },
        validationSchema: Yup.object({
            termID: Yup.string()
                .max(30, "Term ID cannot exceed 30 characters")
                .required("Please Enter Term ID"),
            termName: Yup.string()
                .max(30, "Term Name cannot exceed 30 characters")
                .required("Please Enter Term Name"),
            termPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Term Priority")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    termID: values.termID,
                    termName: values.termName,
                    termPriority: parseFloat(values.termPriority || 0)
                };

                const response = await saveTermMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Term Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchTerms();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save term record");
            }
        }
    });

    // Client-side Excel/CSV parsing and importing
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
            const expectedHeaders = ["Term ID", "Term Name", "Term Priority"];
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

                const termID = String(row[0] || "").trim();
                const termName = String(row[1] || "").trim();

                if (!termID || !termName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Term ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Term ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const termPriority = parseFloat(row[2] || 0);

                const existing = terms.find(t => String(t.termID || t.TermID).toLowerCase() === termID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    termID,
                    termName,
                    termPriority
                };

                try {
                    const response = await saveTermMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} terms.`);
            }
            
            fetchTerms();
            setImportModal(false);
            setSelectedFile(null);
        } catch (error) {
            toast.error("Failed to parse file: " + error.message);
        } finally {
            setImporting(false);
        }
    };

    // Client-side Excel Exporter
    const handleExportData = async () => {
        if (terms.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Term ID", "Term Name", "Term Priority"];
        const rows = terms.map(item => [
            item.termID || item.TermID || "",
            item.termName || item.TermName || "",
            item.termPriority !== undefined ? item.termPriority : (item.TermPriority !== undefined ? item.TermPriority : "")
        ]);

        const result = await exportToExcel(headers, rows, "Terms", "TermMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["Term ID", "Term Name", "Term Priority"];
        const sampleRow = ["COD", "CASH ON DELIVERY", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "TermMasterTemplate");
        if (!result.success) {
            toast.error("Failed to download template.");
        }
    };

    // Table Columns Configuration
    const columns = useMemo(() => [
            {
                header: t("Actions"),
                id: "actions",
                enableColumnFilter: false,
                cell: (cellProps) => {
                    const rowData = cellProps.row.original;
                    return (
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-soft-primary btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    padding: "0"
                                }}
                                onClick={() => handleEditClick(rowData)}
                                title={t("Edit")}
                            >
                                <i className="ri-pencil-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                            <button
                                className="btn btn-soft-danger btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    padding: "0"
                                }}
                                onClick={() => handleDeleteClick(rowData)}
                                title={t("Delete")}
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: t("ID"),
                accessorKey: "termID",
                accessorFn: (row) => row.termID || row.TermID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Name"),
                accessorKey: "termName",
                accessorFn: (row) => row.termName || row.TermName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Priority"),
                accessorKey: "termPriority",
                accessorFn: (row) => row.termPriority !== undefined ? row.termPriority : row.TermPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ], [t]);

    document.title = `${t("Term Master")} | ${t("Admin")}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Term Master")} pageTitle={t("Masters")} />

                    <Row>
                        <Col lg={12}>
                            <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                                <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
                                    <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary d-flex align-items-center gap-2">
                                        <i className="ri-file-list-3-line fs-20 text-primary"></i>
                                        {t("Term Master List")}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn rounded-3 d-inline-flex align-items-center gap-1" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom"></i> {t("Add Term")}
                                        </Button>
                                        <Button color="soft-success" className="btn-soft-success rounded-3 d-inline-flex align-items-center gap-1" onClick={() => setImportModal(true)} title={t("Import Excel")}>
                                            <i className="ri-file-excel-line"></i> {t("Import Excel")}
                                        </Button>
                                        <Button className="btn-soft-success rounded-3" onClick={handleExportData} title={t("Export to Excel")} style={{ height: "37.5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                            <i className="ri-file-excel-2-line fs-18"></i>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {loading ? (
                                        <div className="text-center my-3">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">{t("Loading...")}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <TableContainer
                                            columns={columns}
                                            data={terms}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Search Terms...")}
                                        />
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Add / Edit Form Modal */}
            <Modal isOpen={formModal} toggle={() => setFormModal(false)} className="modal-dialog-centered">
                <ModalHeader className="bg-primary pb-3 text-white" toggle={() => setFormModal(false)}>
                    {isEdit ? t("Edit Term Master") : t("Add Term Master")}
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    validation.handleSubmit();
                    return false;
                }}>
                    <ModalBody>
                        <Row className="gy-3">
                            <Col md={12}>
                                <div>
                                    <Label htmlFor="termID" className="form-label">{t("Term ID")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="termID"
                                        type="text"
                                        className="form-control"
                                        id="termID"
                                        placeholder={t("Enter Term ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.termID || ""}
                                        invalid={validation.touched.termID && validation.errors.termID ? true : false}
                                    />
                                    {validation.touched.termID && validation.errors.termID ? (
                                        <FormFeedback type="invalid">{validation.errors.termID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="termName" className="form-label">{t("Term Name")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="termName"
                                        type="text"
                                        className="form-control"
                                        id="termName"
                                        placeholder={t("Enter Term Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.termName || ""}
                                        invalid={validation.touched.termName && validation.errors.termName ? true : false}
                                    />
                                    {validation.touched.termName && validation.errors.termName ? (
                                        <FormFeedback type="invalid">{validation.errors.termName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="termPriority" className="form-label">{t("Term Priority")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="termPriority"
                                        type="text"
                                        className="form-control"
                                        id="termPriority"
                                        placeholder={t("Enter Term Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.termPriority !== undefined ? validation.values.termPriority : ""}
                                        invalid={validation.touched.termPriority && validation.errors.termPriority ? true : false}
                                    />
                                    {validation.touched.termPriority && validation.errors.termPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.termPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button type="button" color="light" onClick={() => setFormModal(false)}>{t("Cancel")}</Button>
                        <Button type="submit" color="primary">{isEdit ? t("Update") : t("Save")}</Button>
                    </ModalFooter>
                </Form>
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
                                {t("Are you sure you want to delete term")} <strong>{termToDelete?.termName || termToDelete?.TermName}</strong>?
                            </p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <Button type="button" color="light" className="w-sm" onClick={() => setDeleteModal(false)}>{t("Cancel")}</Button>
                        <Button type="button" color="danger" className="w-sm" onClick={handleDeleteConfirm}>{t("Yes, Delete It!")}</Button>
                    </div>
                </ModalBody>
            </Modal>

            {/* Import Excel Modal */}
            <Modal isOpen={importModal} toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }} className="modal-dialog-centered">
                <ModalHeader className="bg-success pb-3 text-white" toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>{t("Import Term Master Excel")}</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download TermMaster File Template Format")}</Label>
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
            <ToastContainer autoClose={2000} />
        </React.Fragment>
    );
};

export default TermMasterList;
