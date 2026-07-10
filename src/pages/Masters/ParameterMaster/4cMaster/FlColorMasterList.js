import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getFLColorMasters, saveFLColorMaster, deleteFLColorMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";

const FlColorMasterList = () => {
    const { t } = useTranslation();
    const [flColors, setFlColors] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [flColorToDelete, setFlColorToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchFlColors();
    }, []);

    const fetchFlColors = async () => {
        setLoading(true);
        try {
            const response = await getFLColorMasters();
            if (response.success || response.Success) {
                setFlColors(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Fluorescence Color Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch Fluorescence Color Master data");
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
    const handleEditClick = (flColor) => {
        setIsEdit(true);
        validation.setValues({
            id: flColor.id || flColor.ID || 0,
            flColorID: flColor.flColorID || flColor.FLColorID || "",
            flColorName: flColor.flColorName || flColor.FLColorName || "",
            flColorPriority: flColor.flColorPriority !== undefined ? flColor.flColorPriority : (flColor.FLColorPriority !== undefined ? flColor.FLColorPriority : ""),
            flColorGroupName: flColor.flColorGroupName || flColor.FLColorGroupName || "",
            flColorGroupPriority: flColor.flColorGroupPriority !== undefined ? flColor.flColorGroupPriority : (flColor.FLColorGroupPriority !== undefined ? flColor.FLColorGroupPriority : ""),
            pricingFLColorID: flColor.pricingFLColorID || flColor.PricingFLColorID || ""
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (flColor) => {
        setFlColorToDelete(flColor);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (flColorToDelete) {
            const id = flColorToDelete.id || flColorToDelete.ID;
            try {
                const response = await deleteFLColorMaster(id);
                if (response.success || response.Success) {
                    toast.success("Fluorescence Color Deleted Successfully");
                    fetchFlColors();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete fluorescence color. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete fluorescence color");
            }
            setDeleteModal(false);
            setFlColorToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            flColorID: "",
            flColorName: "",
            flColorPriority: "",
            flColorGroupName: "",
            flColorGroupPriority: "",
            pricingFLColorID: ""
        },
        validationSchema: Yup.object({
            flColorID: Yup.string()
                .max(30, "Fluorescence Color ID cannot exceed 30 characters")
                .required("Please Enter Fluorescence Color ID"),
            flColorName: Yup.string()
                .max(30, "Fluorescence Color Name cannot exceed 30 characters")
                .required("Please Enter Fluorescence Color Name"),
            flColorPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Fluorescence Color Priority"),
            flColorGroupName: Yup.string()
                .nullable()
                .max(50, "Group Name cannot exceed 50 characters"),
            flColorGroupPriority: Yup.number()
                .nullable()
                .typeError("Group Priority must be a number"),
            pricingFLColorID: Yup.string()
                .nullable()
                .max(30, "Pricing Fluorescence Color ID cannot exceed 30 characters")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    flColorID: values.flColorID,
                    flColorName: values.flColorName,
                    flColorPriority: parseFloat(values.flColorPriority || 0),
                    flColorGroupName: values.flColorGroupName || "",
                    flColorGroupPriority: parseFloat(values.flColorGroupPriority || 0),
                    pricingFLColorID: values.pricingFLColorID || ""
                };

                const response = await saveFLColorMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Fluorescence Color Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchFlColors();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save fluorescence color record");
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
            const expectedHeaders = ["Fluorescence Color ID", "Fluorescence Color Name", "Fluorescence Color Priority", "Fluorescence Color Group Name", "Fluorescence Color Group Priority", "Pricing Fluorescence Color ID"];
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

                const flColorID = String(row[0] || "").trim();
                const flColorName = String(row[1] || "").trim();

                if (!flColorID || !flColorName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Fluorescence Color ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Fluorescence Color ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const flColorPriority = parseFloat(row[2] || 0);
                const flColorGroupName = String(row[3] || "").trim();
                const flColorGroupPriority = parseFloat(row[4] || 0);
                const pricingFLColorID = String(row[5] || "").trim();

                const existing = flColors.find(f => String(f.flColorID || f.FLColorID).toLowerCase() === flColorID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    flColorID,
                    flColorName,
                    flColorPriority,
                    flColorGroupName,
                    flColorGroupPriority,
                    pricingFLColorID
                };

                try {
                    const response = await saveFLColorMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} fluorescence colors.`);
            }
            
            fetchFlColors();
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
        if (flColors.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Fluorescence Color ID", "Fluorescence Color Name", "Fluorescence Color Priority", "Fluorescence Color Group Name", "Fluorescence Color Group Priority", "Pricing Fluorescence Color ID"];
        const rows = flColors.map(item => [
            item.flColorID || item.FLColorID || "",
            item.flColorName || item.FLColorName || "",
            item.flColorPriority !== undefined ? item.flColorPriority : (item.FLColorPriority !== undefined ? item.FLColorPriority : ""),
            item.flColorGroupName || item.FLColorGroupName || "",
            item.flColorGroupPriority !== undefined ? item.flColorGroupPriority : (item.FLColorGroupPriority !== undefined ? item.FLColorGroupPriority : ""),
            item.pricingFLColorID || item.PricingFLColorID || ""
        ]);

        const result = await exportToExcel(headers, rows, "FluorescenceColors", "FlColorMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["Fluorescence Color ID", "Fluorescence Color Name", "Fluorescence Color Priority", "Fluorescence Color Group Name", "Fluorescence Color Group Priority", "Pricing Fluorescence Color ID"];
        const sampleRow = ["BL", "BLUE", "1", "BL", "1", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "FlColorMasterTemplate");
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
                accessorKey: "flColorID",
                accessorFn: (row) => row.flColorID || row.FLColorID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Name"),
                accessorKey: "flColorName",
                accessorFn: (row) => row.flColorName || row.FLColorName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Priority"),
                accessorKey: "flColorPriority",
                accessorFn: (row) => row.flColorPriority !== undefined ? row.flColorPriority : row.FLColorPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Group Name"),
                accessorKey: "flColorGroupName",
                accessorFn: (row) => row.flColorGroupName || row.FLColorGroupName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Group Priority"),
                accessorKey: "flColorGroupPriority",
                accessorFn: (row) => row.flColorGroupPriority !== undefined ? row.flColorGroupPriority : row.FLColorGroupPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Pricing ID"),
                accessorKey: "pricingFLColorID",
                accessorFn: (row) => row.pricingFLColorID || row.PricingFLColorID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        [t]
    );

    document.title = "Fluorescence Color Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Fluorescence Color Master")} pageTitle={t("Masters")} />

                    <Row>
                        <Col lg={12}>
                            <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                                <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
                                    <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary d-flex align-items-center gap-2">
                                        <i className="ri-palette-line fs-20 text-primary"></i>
                                        {t("Fluorescence Color Master List")}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> Add Fluorescence Color
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
                                            data={flColors}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Search Fluorescence Colors...")}
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
                    {isEdit ? "Edit Fluorescence Color Master" : "Add Fluorescence Color Master"}
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
                                    <Label htmlFor="flColorID" className="form-label">{t("Fluorescence Color ID")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="flColorID"
                                        type="text"
                                        className="form-control"
                                        id="flColorID"
                                        placeholder={t("Enter Fluorescence Color ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.flColorID || ""}
                                        invalid={validation.touched.flColorID && validation.errors.flColorID ? true : false}
                                    />
                                    {validation.touched.flColorID && validation.errors.flColorID ? (
                                        <FormFeedback type="invalid">{validation.errors.flColorID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="flColorName" className="form-label">{t("Fluorescence Color Name")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="flColorName"
                                        type="text"
                                        className="form-control"
                                        id="flColorName"
                                        placeholder={t("Enter Fluorescence Color Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.flColorName || ""}
                                        invalid={validation.touched.flColorName && validation.errors.flColorName ? true : false}
                                    />
                                    {validation.touched.flColorName && validation.errors.flColorName ? (
                                        <FormFeedback type="invalid">{validation.errors.flColorName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="flColorPriority" className="form-label">{t("Fluorescence Color Priority")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="flColorPriority"
                                        type="text"
                                        className="form-control"
                                        id="flColorPriority"
                                        placeholder={t("Enter Fluorescence Color Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.flColorPriority !== undefined ? validation.values.flColorPriority : ""}
                                        invalid={validation.touched.flColorPriority && validation.errors.flColorPriority ? true : false}
                                    />
                                    {validation.touched.flColorPriority && validation.errors.flColorPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.flColorPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="flColorGroupName" className="form-label">{t("Group Name")}</Label>
                                    <Input
                                        name="flColorGroupName"
                                        type="text"
                                        className="form-control"
                                        id="flColorGroupName"
                                        placeholder={t("Enter Fluorescence Color Group Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.flColorGroupName || ""}
                                        invalid={validation.touched.flColorGroupName && validation.errors.flColorGroupName ? true : false}
                                    />
                                    {validation.touched.flColorGroupName && validation.errors.flColorGroupName ? (
                                        <FormFeedback type="invalid">{validation.errors.flColorGroupName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="flColorGroupPriority" className="form-label">{t("Group Priority")}</Label>
                                    <Input
                                        name="flColorGroupPriority"
                                        type="text"
                                        className="form-control"
                                        id="flColorGroupPriority"
                                        placeholder={t("Enter Fluorescence Color Group Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.flColorGroupPriority !== undefined ? validation.values.flColorGroupPriority : ""}
                                        invalid={validation.touched.flColorGroupPriority && validation.errors.flColorGroupPriority ? true : false}
                                    />
                                    {validation.touched.flColorGroupPriority && validation.errors.flColorGroupPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.flColorGroupPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="pricingFLColorID" className="form-label">{t("Pricing ID")}</Label>
                                    <Input
                                        name="pricingFLColorID"
                                        type="text"
                                        className="form-control"
                                        id="pricingFLColorID"
                                        placeholder={t("Enter Pricing Fluorescence Color ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.pricingFLColorID || ""}
                                        invalid={validation.touched.pricingFLColorID && validation.errors.pricingFLColorID ? true : false}
                                    />
                                    {validation.touched.pricingFLColorID && validation.errors.pricingFLColorID ? (
                                        <FormFeedback type="invalid">{validation.errors.pricingFLColorID}</FormFeedback>
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
                                Are you sure you want to delete fluorescence color <strong>{flColorToDelete?.flColorName || flColorToDelete?.FLColorName}</strong>?
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
                <ModalHeader className="bg-success pb-3 text-white" toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>{t("Import Fluorescence Color Master Excel")}</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download FLColorMaster File Template Format")}</Label>
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
            <ToastContainer autoClose={2000} />
        </React.Fragment>
    );
};

export default FlColorMasterList;
