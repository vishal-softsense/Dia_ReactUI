import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getSymMasters, saveSymMaster, deleteSymMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";

const SymMasterList = () => {
    const { t } = useTranslation();
    const [syms, setSyms] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [symToDelete, setSymToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchSyms();
    }, []);

    const fetchSyms = async () => {
        setLoading(true);
        try {
            const response = await getSymMasters();
            if (response.success || response.Success) {
                setSyms(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Symmetry Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch Symmetry Master data");
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
    const handleEditClick = (sym) => {
        setIsEdit(true);
        validation.setValues({
            id: sym.id || sym.ID || 0,
            symID: sym.symID || sym.SymID || "",
            symName: sym.symName || sym.SymName || "",
            symPriority: sym.symPriority !== undefined ? sym.symPriority : (sym.SymPriority !== undefined ? sym.SymPriority : ""),
            symGroupName: sym.symGroupName || sym.SymGroupName || "",
            symGroupPriority: sym.symGroupPriority !== undefined ? sym.symGroupPriority : (sym.SymGroupPriority !== undefined ? sym.SymGroupPriority : ""),
            pricingSymID: sym.pricingSymID || sym.PricingSymID || ""
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (sym) => {
        setSymToDelete(sym);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (symToDelete) {
            const id = symToDelete.id || symToDelete.ID;
            try {
                const response = await deleteSymMaster(id);
                if (response.success || response.Success) {
                    toast.success("Symmetry Deleted Successfully");
                    fetchSyms();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete symmetry. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete symmetry");
            }
            setDeleteModal(false);
            setSymToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            symID: "",
            symName: "",
            symPriority: "",
            symGroupName: "",
            symGroupPriority: "",
            pricingSymID: ""
        },
        validationSchema: Yup.object({
            symID: Yup.string()
                .max(30, "Symmetry ID cannot exceed 30 characters")
                .required("Please Enter Symmetry ID"),
            symName: Yup.string()
                .max(30, "Symmetry Name cannot exceed 30 characters")
                .required("Please Enter Symmetry Name"),
            symPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Symmetry Priority"),
            symGroupName: Yup.string()
                .nullable()
                .max(50, "Group Name cannot exceed 50 characters"),
            symGroupPriority: Yup.number()
                .nullable()
                .typeError("Group Priority must be a number"),
            pricingSymID: Yup.string()
                .nullable()
                .max(30, "Pricing Symmetry ID cannot exceed 30 characters")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    symID: values.symID,
                    symName: values.symName,
                    symPriority: parseFloat(values.symPriority || 0),
                    symGroupName: values.symGroupName || "",
                    symGroupPriority: parseFloat(values.symGroupPriority || 0),
                    pricingSymID: values.pricingSymID || ""
                };

                const response = await saveSymMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Symmetry Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchSyms();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save symmetry record");
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
            const expectedHeaders = ["Symmetry ID", "Symmetry Name", "Symmetry Priority", "Symmetry Group Name", "Symmetry Group Priority", "Pricing Symmetry ID"];
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

                const symID = String(row[0] || "").trim();
                const symName = String(row[1] || "").trim();

                if (!symID || !symName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Symmetry ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Symmetry ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const symPriority = parseFloat(row[2] || 0);
                const symGroupName = String(row[3] || "").trim();
                const symGroupPriority = parseFloat(row[4] || 0);
                const pricingSymID = String(row[5] || "").trim();

                const existing = syms.find(s => String(s.symID || s.SymID).toLowerCase() === symID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    symID,
                    symName,
                    symPriority,
                    symGroupName,
                    symGroupPriority,
                    pricingSymID
                };

                try {
                    const response = await saveSymMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} symmetries.`);
            }
            
            fetchSyms();
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
        if (syms.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Symmetry ID", "Symmetry Name", "Symmetry Priority", "Symmetry Group Name", "Symmetry Group Priority", "Pricing Symmetry ID"];
        const rows = syms.map(item => [
            item.symID || item.SymID || "",
            item.symName || item.SymName || "",
            item.symPriority !== undefined ? item.symPriority : (item.SymPriority !== undefined ? item.SymPriority : ""),
            item.symGroupName || item.SymGroupName || "",
            item.symGroupPriority !== undefined ? item.symGroupPriority : (item.SymGroupPriority !== undefined ? item.SymGroupPriority : ""),
            item.pricingSymID || item.PricingSymID || ""
        ]);

        const result = await exportToExcel(headers, rows, "Symmetries", "SymMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["Symmetry ID", "Symmetry Name", "Symmetry Priority", "Symmetry Group Name", "Symmetry Group Priority", "Pricing Symmetry ID"];
        const sampleRow = ["EX", "EXCELLENT", "1", "EX", "1", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "SymMasterTemplate");
        if (!result.success) {
            toast.error("Failed to download template.");
        }
    };

    // Table Columns Configuration
    const columns = useMemo(
        () => [
            {
                header: t("Actions"),
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
                                title={t("Edit Symmetry")}
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
                                title={t("Delete Symmetry")}
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: t("ID"),
                accessorKey: "symID",
                accessorFn: (row) => row.symID || row.SymID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Name"),
                accessorKey: "symName",
                accessorFn: (row) => row.symName || row.SymName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Priority"),
                accessorKey: "symPriority",
                accessorFn: (row) => row.symPriority !== undefined ? row.symPriority : row.SymPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Group Name"),
                accessorKey: "symGroupName",
                accessorFn: (row) => row.symGroupName || row.SymGroupName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Group Priority"),
                accessorKey: "symGroupPriority",
                accessorFn: (row) => row.symGroupPriority !== undefined ? row.symGroupPriority : row.SymGroupPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Pricing ID"),
                accessorKey: "pricingSymID",
                accessorFn: (row) => row.pricingSymID || row.PricingSymID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        [t]
    );

    document.title = "Symmetry Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Symmetry Master")} pageTitle={t("Masters")} />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">{t("Symmetry Master List")}</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> {t("Add Sym")}metry
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
                                            data={syms}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Search Symmetries...")}
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
                    {isEdit ? "Edit Symmetry Master" : "Add Symmetry Master"}
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
                                    <Label htmlFor="symID" className="form-label">{t("Symmetry ID")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="symID"
                                        type="text"
                                        className="form-control"
                                        id="symID"
                                        placeholder={t("Enter Symmetry ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.symID || ""}
                                        invalid={validation.touched.symID && validation.errors.symID ? true : false}
                                    />
                                    {validation.touched.symID && validation.errors.symID ? (
                                        <FormFeedback type="invalid">{validation.errors.symID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="symName" className="form-label">{t("Symmetry Name")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="symName"
                                        type="text"
                                        className="form-control"
                                        id="symName"
                                        placeholder={t("Enter Symmetry Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.symName || ""}
                                        invalid={validation.touched.symName && validation.errors.symName ? true : false}
                                    />
                                    {validation.touched.symName && validation.errors.symName ? (
                                        <FormFeedback type="invalid">{validation.errors.symName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="symPriority" className="form-label">{t("Symmetry Priority")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="symPriority"
                                        type="text"
                                        className="form-control"
                                        id="symPriority"
                                        placeholder={t("Enter Symmetry Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.symPriority !== undefined ? validation.values.symPriority : ""}
                                        invalid={validation.touched.symPriority && validation.errors.symPriority ? true : false}
                                    />
                                    {validation.touched.symPriority && validation.errors.symPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.symPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="symGroupName" className="form-label">{t("Group Name")}</Label>
                                    <Input
                                        name="symGroupName"
                                        type="text"
                                        className="form-control"
                                        id="symGroupName"
                                        placeholder={t("Enter Symmetry Group Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.symGroupName || ""}
                                        invalid={validation.touched.symGroupName && validation.errors.symGroupName ? true : false}
                                    />
                                    {validation.touched.symGroupName && validation.errors.symGroupName ? (
                                        <FormFeedback type="invalid">{validation.errors.symGroupName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="symGroupPriority" className="form-label">{t("Group Priority")}</Label>
                                    <Input
                                        name="symGroupPriority"
                                        type="text"
                                        className="form-control"
                                        id="symGroupPriority"
                                        placeholder={t("Enter Symmetry Group Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.symGroupPriority !== undefined ? validation.values.symGroupPriority : ""}
                                        invalid={validation.touched.symGroupPriority && validation.errors.symGroupPriority ? true : false}
                                    />
                                    {validation.touched.symGroupPriority && validation.errors.symGroupPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.symGroupPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="pricingSymID" className="form-label">{t("Pricing ID")}</Label>
                                    <Input
                                        name="pricingSymID"
                                        type="text"
                                        className="form-control"
                                        id="pricingSymID"
                                        placeholder={t("Enter Pricing Symmetry ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.pricingSymID || ""}
                                        invalid={validation.touched.pricingSymID && validation.errors.pricingSymID ? true : false}
                                    />
                                    {validation.touched.pricingSymID && validation.errors.pricingSymID ? (
                                        <FormFeedback type="invalid">{validation.errors.pricingSymID}</FormFeedback>
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
                                Are you sure you want to delete symmetry <strong>{symToDelete?.symName || symToDelete?.SymName}</strong>?
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
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>{t("Import Symmetry Master Excel")}</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download SymmetryMaster File Template Format")}</Label>
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

export default SymMasterList;
