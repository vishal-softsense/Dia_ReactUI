import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getSubTypeMasters, saveSubTypeMaster, deleteSubTypeMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";

const SubTypeMasterList = () => {
    const { t } = useTranslation();
    const [subTypes, setSubTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [subTypeToDelete, setSubTypeToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchSubTypes();
    }, []);

    const fetchSubTypes = async () => {
        setLoading(true);
        try {
            const response = await getSubTypeMasters();
            if (response.success || response.Success) {
                setSubTypes(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch SubType Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch SubType Master data");
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
    const handleEditClick = (subTypeVal) => {
        setIsEdit(true);
        validation.setValues({
            id: subTypeVal.id || subTypeVal.ID || 0,
            subTypeID: subTypeVal.subTypeID || subTypeVal.SubTypeID || "",
            subTypeName: subTypeVal.subTypeName || subTypeVal.SubTypeName || "",
            subTypePriority: subTypeVal.subTypePriority !== undefined ? subTypeVal.subTypePriority : (subTypeVal.SubTypePriority !== undefined ? subTypeVal.SubTypePriority : "")
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (subTypeVal) => {
        setSubTypeToDelete(subTypeVal);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (subTypeToDelete) {
            const id = subTypeToDelete.id || subTypeToDelete.ID;
            try {
                const response = await deleteSubTypeMaster(id);
                if (response.success || response.Success) {
                    toast.success("SubType Deleted Successfully");
                    fetchSubTypes();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete subType. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete subType");
            }
            setDeleteModal(false);
            setSubTypeToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            subTypeID: "",
            subTypeName: "",
            subTypePriority: ""
        },
        validationSchema: Yup.object({
            subTypeID: Yup.string()
                .max(30, "SubType ID cannot exceed 30 characters")
                .required("Please Enter SubType ID"),
            subTypeName: Yup.string()
                .max(30, "SubType Name cannot exceed 30 characters")
                .required("Please Enter SubType Name"),
            subTypePriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter SubType Priority")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    subTypeID: values.subTypeID,
                    subTypeName: values.subTypeName,
                    subTypePriority: parseFloat(values.subTypePriority || 0)
                };

                const response = await saveSubTypeMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`SubType Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchSubTypes();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save subType record");
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
            const expectedHeaders = ["SubType ID", "SubType Name", "SubType Priority"];
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

                const subTypeID = String(row[0] || "").trim();
                const subTypeName = String(row[1] || "").trim();

                if (!subTypeID || !subTypeName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing SubType ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing SubType ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const subTypePriority = parseFloat(row[2] || 0);

                const existing = subTypes.find(t => String(t.subTypeID || t.SubTypeID).toLowerCase() === subTypeID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    subTypeID,
                    subTypeName,
                    subTypePriority
                };

                try {
                    const response = await saveSubTypeMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} subTypes.`);
            }
            
            fetchSubTypes();
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
        if (subTypes.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["SubType ID", "SubType Name", "SubType Priority"];
        const rows = subTypes.map(item => [
            item.subTypeID || item.SubTypeID || "",
            item.subTypeName || item.SubTypeName || "",
            item.subTypePriority !== undefined ? item.subTypePriority : (item.SubTypePriority !== undefined ? item.SubTypePriority : "")
        ]);

        const result = await exportToExcel(headers, rows, "SubTypes", "SubTypeMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["SubType ID", "SubType Name", "SubType Priority"];
        const sampleRow = ["R", "RING", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "SubTypeMasterTemplate");
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
                accessorKey: "subTypeID",
                accessorFn: (row) => row.subTypeID || row.SubTypeID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Name"),
                accessorKey: "subTypeName",
                accessorFn: (row) => row.subTypeName || row.SubTypeName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Priority"),
                accessorKey: "subTypePriority",
                accessorFn: (row) => row.subTypePriority !== undefined ? row.subTypePriority : row.SubTypePriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ], [t]);

    document.title = `${t("SubType Master")} | ${t("Admin")}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("SubType Master")} pageTitle={t("Masters")} />

                    <Row>
                        <Col lg={12}>
                            <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                                <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
                                    <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary d-flex align-items-center gap-2">
                                        <i className="ri-file-list-3-line fs-20 text-primary"></i>
                                        {t("SubType Master List")}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn rounded-3 d-inline-flex align-items-center gap-1" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom"></i> {t("Add SubType")}
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
                                            data={subTypes}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Search SubTypes...")}
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
                <ModalHeader toggle={() => setFormModal(false)} className="bg-primary p-3 border-0">
                    <span className="text-white fw-bold">{isEdit ? t("Edit SubType Master") : t("Add SubType Master")}</span>
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
                                    <Label htmlFor="subTypeID" className="form-label">{t("SubType ID")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="subTypeID"
                                        type="text"
                                        className="form-control"
                                        id="subTypeID"
                                        placeholder={t("Enter SubType ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.subTypeID || ""}
                                        invalid={validation.touched.subTypeID && validation.errors.subTypeID ? true : false}
                                    />
                                    {validation.touched.subTypeID && validation.errors.subTypeID ? (
                                        <FormFeedback type="invalid">{validation.errors.subTypeID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="subTypeName" className="form-label">{t("SubType Name")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="subTypeName"
                                        type="text"
                                        className="form-control"
                                        id="subTypeName"
                                        placeholder={t("Enter SubType Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.subTypeName || ""}
                                        invalid={validation.touched.subTypeName && validation.errors.subTypeName ? true : false}
                                    />
                                    {validation.touched.subTypeName && validation.errors.subTypeName ? (
                                        <FormFeedback type="invalid">{validation.errors.subTypeName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="subTypePriority" className="form-label">{t("SubType Priority")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="subTypePriority"
                                        type="text"
                                        className="form-control"
                                        id="subTypePriority"
                                        placeholder={t("Enter SubType Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.subTypePriority !== undefined ? validation.values.subTypePriority : ""}
                                        invalid={validation.touched.subTypePriority && validation.errors.subTypePriority ? true : false}
                                    />
                                    {validation.touched.subTypePriority && validation.errors.subTypePriority ? (
                                        <FormFeedback type="invalid">{validation.errors.subTypePriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button type="button" color="light" className="rounded-3" onClick={() => setFormModal(false)}>{t("Cancel")}</Button>
                        <Button type="submit" color="primary" className="rounded-3">{isEdit ? t("Update") : t("Save")}</Button>
                    </ModalFooter>
                </Form>
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
                                {t("Are you sure you want to delete subType")} <strong>{subTypeToDelete?.subTypeName || subTypeToDelete?.SubTypeName}</strong>?
                            </p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <Button type="button" color="light" className="w-sm rounded-3" onClick={() => setDeleteModal(false)}>{t("Cancel")}</Button>
                        <Button type="button" color="danger" className="w-sm rounded-3" onClick={handleDeleteConfirm}>{t("Yes, Delete It!")}</Button>
                    </div>
                </ModalBody>
            </Modal>

            {/* Import Excel Modal */}
            <Modal isOpen={importModal} toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }} centered>
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }} className="bg-primary p-3 border-0">
                    <span className="text-white fw-bold">{t("Import SubType Master Excel")}</span>
                </ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download SubTypeMaster File Template Format")}</Label>
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
            <ToastContainer autoClose={2000} />
        </React.Fragment>
    );
};

export default SubTypeMasterList;
