import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getSieveMasters, saveSieveMaster, deleteSieveMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";

const SieveMasterList = () => {
    const { t } = useTranslation();
    const [sieves, setSieves] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [sieveToDelete, setSieveToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchSieves();
    }, []);

    const fetchSieves = async () => {
        setLoading(true);
        try {
            const response = await getSieveMasters();
            if (response.success || response.Success) {
                setSieves(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Sieve Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch Sieve Master data");
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
    const handleEditClick = (sieve) => {
        setIsEdit(true);
        validation.setValues({
            id: sieve.id || sieve.ID || 0,
            sieveID: sieve.sieveID || sieve.SieveID || "",
            sieveName: sieve.sieveName || sieve.SieveName || "",
            sievePriority: sieve.sievePriority !== undefined ? sieve.sievePriority : (sieve.SievePriority !== undefined ? sieve.SievePriority : "")
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (sieve) => {
        setSieveToDelete(sieve);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (sieveToDelete) {
            const id = sieveToDelete.id || sieveToDelete.ID;
            try {
                const response = await deleteSieveMaster(id);
                if (response.success || response.Success) {
                    toast.success("Sieve Deleted Successfully");
                    fetchSieves();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete sieve. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete sieve");
            }
            setDeleteModal(false);
            setSieveToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            sieveID: "",
            sieveName: "",
            sievePriority: ""
        },
        validationSchema: Yup.object({
            sieveID: Yup.string()
                .max(30, "Sieve ID cannot exceed 30 characters")
                .required("Please Enter Sieve ID"),
            sieveName: Yup.string()
                .max(30, "Sieve Name cannot exceed 30 characters")
                .required("Please Enter Sieve Name"),
            sievePriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Sieve Priority")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    sieveID: values.sieveID,
                    sieveName: values.sieveName,
                    sievePriority: parseFloat(values.sievePriority || 0)
                };

                const response = await saveSieveMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Sieve Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchSieves();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save sieve record");
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
            const expectedHeaders = ["Sieve ID", "Sieve Name", "Sieve Priority"];
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

                const sieveID = String(row[0] || "").trim();
                const sieveName = String(row[1] || "").trim();

                if (!sieveID || !sieveName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Sieve ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Sieve ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const sievePriority = parseFloat(row[2] || 0);

                const existing = sieves.find(s => String(s.sieveID || s.SieveID).toLowerCase() === sieveID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    sieveID,
                    sieveName,
                    sievePriority
                };

                try {
                    const response = await saveSieveMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} sieves.`);
            }
            
            fetchSieves();
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
        if (sieves.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Sieve ID", "Sieve Name", "Sieve Priority"];
        const rows = sieves.map(item => [
            item.sieveID || item.SieveID || "",
            item.sieveName || item.SieveName || "",
            item.sievePriority !== undefined ? item.sievePriority : (item.SievePriority !== undefined ? item.SievePriority : "")
        ]);

        const result = await exportToExcel(headers, rows, "Sieves", "SieveMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["Sieve ID", "Sieve Name", "Sieve Priority"];
        const sampleRow = ["-2", "00-0", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "SieveMasterTemplate");
        if (!result.success) {
            toast.error("Failed to download template.");
        }
    };

    // Table Columns Configuration
    const columns = useMemo(
        () => [
            {
                header: "Actions",
                id: "actions",
                enableColumnFilter: false,
                cell: (cellProps) => {
                    const rowData = cellProps.row.original;
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
                                onClick={() => handleEditClick(rowData)}
                                title={t("Edit Sieve")}
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
                                onClick={() => handleDeleteClick(rowData)}
                                title={t("Delete Sieve")}
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: "ID",
                accessorKey: "sieveID",
                accessorFn: (row) => row.sieveID || row.SieveID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Name",
                accessorKey: "sieveName",
                accessorFn: (row) => row.sieveName || row.SieveName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Priority",
                accessorKey: "sievePriority",
                accessorFn: (row) => row.sievePriority !== undefined ? row.sievePriority : row.SievePriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        []
    );

    document.title = "Sieve Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Sieve Master")} pageTitle="Masters" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">{t("Sieve Master List")}</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> Add Sieve
                                        </Button>
                                        <Button color="soft-success" onClick={() => setImportModal(true)} title={t("Import Excel")}>
                                            Import Excel
                                        </Button>
                                        <Button className="btn-soft-success" onClick={handleExportData} title={t("Export to Excel")} style={{ height: "37.5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                            <i className="ri-file-excel-2-line" style={{ fontSize: "25px" }}></i>
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
                                            data={sieves}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Search Sieves...")}
                                        />
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Add / Edit Form Modal */}
            <Modal isOpen={formModal} toggle={() => setFormModal(false)} centered>
                <ModalHeader toggle={() => setFormModal(false)}>
                    {isEdit ? "Edit Sieve Master" : "Add Sieve Master"}
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
                                    <Label htmlFor="sieveID" className="form-label">{t("Sieve ID")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="sieveID"
                                        type="text"
                                        className="form-control"
                                        id="sieveID"
                                        placeholder={t("Enter Sieve ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.sieveID || ""}
                                        invalid={validation.touched.sieveID && validation.errors.sieveID ? true : false}
                                    />
                                    {validation.touched.sieveID && validation.errors.sieveID ? (
                                        <FormFeedback type="invalid">{validation.errors.sieveID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="sieveName" className="form-label">{t("Sieve Name")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="sieveName"
                                        type="text"
                                        className="form-control"
                                        id="sieveName"
                                        placeholder={t("Enter Sieve Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.sieveName || ""}
                                        invalid={validation.touched.sieveName && validation.errors.sieveName ? true : false}
                                    />
                                    {validation.touched.sieveName && validation.errors.sieveName ? (
                                        <FormFeedback type="invalid">{validation.errors.sieveName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="sievePriority" className="form-label">{t("Sieve Priority")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="sievePriority"
                                        type="text"
                                        className="form-control"
                                        id="sievePriority"
                                        placeholder={t("Enter Sieve Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.sievePriority !== undefined ? validation.values.sievePriority : ""}
                                        invalid={validation.touched.sievePriority && validation.errors.sievePriority ? true : false}
                                    />
                                    {validation.touched.sievePriority && validation.errors.sievePriority ? (
                                        <FormFeedback type="invalid">{validation.errors.sievePriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button type="button" color="light" onClick={() => setFormModal(false)}>{t("Cancel")}</Button>
                        <Button type="submit" color="primary">{isEdit ? "Update" : "Save"}</Button>
                    </ModalFooter>
                </Form>
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
                                Are you sure you want to delete sieve <strong>{sieveToDelete?.sieveName || sieveToDelete?.SieveName}</strong>?
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
            <Modal isOpen={importModal} toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }} centered>
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>{t("Import Sieve Master Excel")}</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download SieveMaster File Template Format")}</Label>
                        <div>
                            <Button color="primary" onClick={handleDownloadTemplate} size="sm">
                                <i className="ri-download-2-line align-bottom me-1"></i> Download Format
                            </Button>
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
            <ToastContainer closeButton={false} limit={1} />
        </React.Fragment>
    );
};

export default SieveMasterList;
