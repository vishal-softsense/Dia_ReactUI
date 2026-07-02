import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getClarityMasters, saveClarityMaster, deleteClarityMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";

const ClarityMaster = () => {
    const { t } = useTranslation();
    const [clarities, setClarities] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [clarityToDelete, setClarityToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchClarities();
    }, []);

    const fetchClarities = async () => {
        setLoading(true);
        try {
            const response = await getClarityMasters();
            if (response.success || response.Success) {
                setClarities(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Clarity Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch Clarity Master data");
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
    const handleEditClick = (clarity) => {
        setIsEdit(true);
        validation.setValues({
            id: clarity.id || clarity.ID || 0,
            clarityID: clarity.clarityID || clarity.ClarityID || "",
            clarityName: clarity.clarityName || clarity.ClarityName || "",
            clarityPriority: clarity.clarityPriority !== undefined ? clarity.clarityPriority : (clarity.ClarityPriority !== undefined ? clarity.ClarityPriority : ""),
            clarityGroupName: clarity.clarityGroupName || clarity.ClarityGroupName || "",
            clarityGroupPriority: clarity.clarityGroupPriority !== undefined ? clarity.clarityGroupPriority : (clarity.ClarityGroupPriority !== undefined ? clarity.ClarityGroupPriority : ""),
            pricingClarityID: clarity.pricingClarityID || clarity.PricingClarityID || ""
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (clarity) => {
        setClarityToDelete(clarity);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (clarityToDelete) {
            const id = clarityToDelete.id || clarityToDelete.ID;
            try {
                const response = await deleteClarityMaster(id);
                if (response.success || response.Success) {
                    toast.success("Clarity Deleted Successfully");
                    fetchClarities();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete clarity. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete clarity");
            }
            setDeleteModal(false);
            setClarityToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            clarityID: "",
            clarityName: "",
            clarityPriority: "",
            clarityGroupName: "",
            clarityGroupPriority: "",
            pricingClarityID: ""
        },
        validationSchema: Yup.object({
            clarityID: Yup.string()
                .max(30, "Clarity ID cannot exceed 30 characters")
                .required("Please Enter Clarity ID"),
            clarityName: Yup.string()
                .max(30, "Clarity Name cannot exceed 30 characters")
                .required("Please Enter Clarity Name"),
            clarityPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Clarity Priority"),
            clarityGroupName: Yup.string()
                .nullable()
                .max(50, "Group Name cannot exceed 50 characters"),
            clarityGroupPriority: Yup.number()
                .nullable()
                .typeError("Group Priority must be a number"),
            pricingClarityID: Yup.string()
                .nullable()
                .max(30, "Pricing Clarity ID cannot exceed 30 characters")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    clarityID: values.clarityID,
                    clarityName: values.clarityName,
                    clarityPriority: parseFloat(values.clarityPriority || 0),
                    clarityGroupName: values.clarityGroupName || "",
                    clarityGroupPriority: parseFloat(values.clarityGroupPriority || 0),
                    pricingClarityID: values.pricingClarityID || ""
                };

                const response = await saveClarityMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Clarity Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchClarities();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save clarity record");
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
            const expectedHeaders = ["Clarity ID", "Clarity Name", "Clarity Priority", "Clarity Group Name", "Clarity Group Priority", "Pricing Clarity ID"];
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

                const clarityID = String(row[0] || "").trim();
                const clarityName = String(row[1] || "").trim();

                if (!clarityID || !clarityName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Clarity ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Clarity ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const clarityPriority = parseFloat(row[2] || 0);
                const clarityGroupName = String(row[3] || "").trim();
                const clarityGroupPriority = parseFloat(row[4] || 0);
                const pricingClarityID = String(row[5] || "").trim();

                const existing = clarities.find(c => String(c.clarityID || c.ClarityID).toLowerCase() === clarityID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    clarityID,
                    clarityName,
                    clarityPriority,
                    clarityGroupName,
                    clarityGroupPriority,
                    pricingClarityID
                };

                try {
                    const response = await saveClarityMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} clarities.`);
            }
            
            fetchClarities();
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
        if (clarities.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Clarity ID", "Clarity Name", "Clarity Priority", "Clarity Group Name", "Clarity Group Priority", "Pricing Clarity ID"];
        const rows = clarities.map(item => [
            item.clarityID || item.ClarityID || "",
            item.clarityName || item.ClarityName || "",
            item.clarityPriority !== undefined ? item.clarityPriority : (item.ClarityPriority !== undefined ? item.ClarityPriority : ""),
            item.clarityGroupName || item.ClarityGroupName || "",
            item.clarityGroupPriority !== undefined ? item.clarityGroupPriority : (item.ClarityGroupPriority !== undefined ? item.ClarityGroupPriority : ""),
            item.pricingClarityID || item.PricingClarityID || ""
        ]);

        const result = await exportToExcel(headers, rows, "Clarities", "ClarityMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["Clarity ID", "Clarity Name", "Clarity Priority", "Clarity Group Name", "Clarity Group Priority", "Pricing Clarity ID"];
        const sampleRow = ["FL", "FLAWLESS", "1", "FL-IF", "1", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "ClarityMasterTemplate");
        if (!result.success) {
            toast.error("Failed to download template.");
        }
    };

    // Table Columns Configuration
    const columns = useMemo(
        () => [
            {
                header: t("Action"),
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
                                title={t("Edit Clarity")}
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
                                title={t("Delete Clarity")}
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: t("ID"),
                accessorKey: "clarityID",
                accessorFn: (row) => row.clarityID || row.ClarityID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Name"),
                accessorKey: "clarityName",
                accessorFn: (row) => row.clarityName || row.ClarityName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Priority"),
                accessorKey: "clarityPriority",
                accessorFn: (row) => row.clarityPriority !== undefined ? row.clarityPriority : row.ClarityPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            // {
            //     header: t("Group Name"),
            //     accessorKey: "clarityGroupName",
            //     accessorFn: (row) => row.clarityGroupName || row.ClarityGroupName,
            //     enableColumnFilter: true,
            //     filterFn: (row, id, filterValue) => {
            //         const val = row.getValue(id);
            //         return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
            //     }
            // },
            {
    header: t("Group Name"),
    accessorKey: "clarityGroupName",
    accessorFn: (row) => row.clarityGroupName || row.ClarityGroupName,
    enableColumnFilter: true,
    filterFn: (row, id, filterValue) => {
        const val = row.getValue(id);
        return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
    }
},
            {
                header: t("Group Priority"),
                accessorKey: "clarityGroupPriority",
                accessorFn: (row) => row.clarityGroupPriority !== undefined ? row.clarityGroupPriority : row.ClarityGroupPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Pricing ID"),
                accessorKey: "pricingClarityID",
                accessorFn: (row) => row.pricingClarityID || row.PricingClarityID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        [t]
    );

    document.title = `${t("Clarity Master")} | ${t("Admin")}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Clarity Master")} pageTitle={t("Masters")} />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">{t("Clarity Master List")}</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> {t("Add Clarity")}
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
                                            data={clarities}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Search Clarities...")}
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
                    {isEdit ? t("Edit Clarity Master") : t("Add Clarity Master")}
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
                                    <Label htmlFor="clarityID" className="form-label">{t("Clarity ID")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="clarityID"
                                        type="text"
                                        className="form-control"
                                        id="clarityID"
                                        placeholder={t("Enter Clarity ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.clarityID || ""}
                                        invalid={validation.touched.clarityID && validation.errors.clarityID ? true : false}
                                    />
                                    {validation.touched.clarityID && validation.errors.clarityID ? (
                                        <FormFeedback type="invalid">{validation.errors.clarityID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="clarityName" className="form-label">{t("Clarity Name")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="clarityName"
                                        type="text"
                                        className="form-control"
                                        id="clarityName"
                                        placeholder={t("Enter Clarity Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.clarityName || ""}
                                        invalid={validation.touched.clarityName && validation.errors.clarityName ? true : false}
                                    />
                                    {validation.touched.clarityName && validation.errors.clarityName ? (
                                        <FormFeedback type="invalid">{validation.errors.clarityName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="clarityPriority" className="form-label">{t("Clarity Priority")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="clarityPriority"
                                        type="text"
                                        className="form-control"
                                        id="clarityPriority"
                                        placeholder={t("Enter Clarity Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.clarityPriority !== undefined ? validation.values.clarityPriority : ""}
                                        invalid={validation.touched.clarityPriority && validation.errors.clarityPriority ? true : false}
                                    />
                                    {validation.touched.clarityPriority && validation.errors.clarityPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.clarityPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="clarityGroupName" className="form-label">{t("Group Name")}</Label>
                                    <Input
                                        name="clarityGroupName"
                                        type="text"
                                        className="form-control"
                                        id="clarityGroupName"
                                        placeholder={t("Enter Clarity Group Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.clarityGroupName || ""}
                                        invalid={validation.touched.clarityGroupName && validation.errors.clarityGroupName ? true : false}
                                    />
                                    {validation.touched.clarityGroupName && validation.errors.clarityGroupName ? (
                                        <FormFeedback type="invalid">{validation.errors.clarityGroupName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="clarityGroupPriority" className="form-label">{t("Group Priority")}</Label>
                                    <Input
                                        name="clarityGroupPriority"
                                        type="text"
                                        className="form-control"
                                        id="clarityGroupPriority"
                                        placeholder={t("Enter Clarity Group Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.clarityGroupPriority !== undefined ? validation.values.clarityGroupPriority : ""}
                                        invalid={validation.touched.clarityGroupPriority && validation.errors.clarityGroupPriority ? true : false}
                                    />
                                    {validation.touched.clarityGroupPriority && validation.errors.clarityGroupPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.clarityGroupPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="pricingClarityID" className="form-label">{t("Pricing ID")}</Label>
                                    <Input
                                        name="pricingClarityID"
                                        type="text"
                                        className="form-control"
                                        id="pricingClarityID"
                                        placeholder={t("Enter Pricing Clarity ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.pricingClarityID || ""}
                                        invalid={validation.touched.pricingClarityID && validation.errors.pricingClarityID ? true : false}
                                    />
                                    {validation.touched.pricingClarityID && validation.errors.pricingClarityID ? (
                                        <FormFeedback type="invalid">{validation.errors.pricingClarityID}</FormFeedback>
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
                                {t("Are you sure you want to delete clarity")} <strong>{clarityToDelete?.clarityName || clarityToDelete?.ClarityName}</strong>?
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
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>{t("Import Clarity Master Excel")}</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download ClarityMaster File Template Format")}</Label>
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

export default ClarityMaster;
