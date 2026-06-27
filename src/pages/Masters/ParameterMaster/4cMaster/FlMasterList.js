import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getFLMasters, saveFLMaster, deleteFLMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";

const FlMasterList = () => {
    const [fls, setFls] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [flToDelete, setFlToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchFls();
    }, []);

    const fetchFls = async () => {
        setLoading(true);
        try {
            const response = await getFLMasters();
            if (response.success || response.Success) {
                setFls(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Fluorescence Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch Fluorescence Master data");
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
    const handleEditClick = (fl) => {
        setIsEdit(true);
        validation.setValues({
            id: fl.id || fl.ID || 0,
            flid: fl.flid || fl.FLID || "",
            flName: fl.flName || fl.FLName || "",
            flPriority: fl.flPriority !== undefined ? fl.flPriority : (fl.FLPriority !== undefined ? fl.FLPriority : ""),
            flGroupName: fl.flGroupName || fl.FLGroupName || "",
            flGroupPriority: fl.flGroupPriority !== undefined ? fl.flGroupPriority : (fl.FLGroupPriority !== undefined ? fl.FLGroupPriority : ""),
            pricingFLID: fl.pricingFLID || fl.PricingFLID || ""
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (fl) => {
        setFlToDelete(fl);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (flToDelete) {
            const id = flToDelete.id || flToDelete.ID;
            try {
                const response = await deleteFLMaster(id);
                if (response.success || response.Success) {
                    toast.success("Fluorescence Deleted Successfully");
                    fetchFls();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete fluorescence. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete fluorescence");
            }
            setDeleteModal(false);
            setFlToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            flid: "",
            flName: "",
            flPriority: "",
            flGroupName: "",
            flGroupPriority: "",
            pricingFLID: ""
        },
        validationSchema: Yup.object({
            flid: Yup.string()
                .max(30, "Fluorescence ID cannot exceed 30 characters")
                .required("Please Enter Fluorescence ID"),
            flName: Yup.string()
                .max(30, "Fluorescence Name cannot exceed 30 characters")
                .required("Please Enter Fluorescence Name"),
            flPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Fluorescence Priority"),
            flGroupName: Yup.string()
                .nullable()
                .max(50, "Group Name cannot exceed 50 characters"),
            flGroupPriority: Yup.number()
                .nullable()
                .typeError("Group Priority must be a number"),
            pricingFLID: Yup.string()
                .nullable()
                .max(30, "Pricing Fluorescence ID cannot exceed 30 characters")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    flid: values.flid,
                    flName: values.flName,
                    flPriority: parseFloat(values.flPriority || 0),
                    flGroupName: values.flGroupName || "",
                    flGroupPriority: parseFloat(values.flGroupPriority || 0),
                    pricingFLID: values.pricingFLID || ""
                };

                const response = await saveFLMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Fluorescence Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchFls();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save fluorescence record");
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
            const expectedHeaders = ["Fluorescence ID", "Fluorescence Name", "Fluorescence Priority", "Fluorescence Group Name", "Fluorescence Group Priority", "Pricing Fluorescence ID"];
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

                const flid = String(row[0] || "").trim();
                const flName = String(row[1] || "").trim();

                if (!flid || !flName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Fluorescence ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Fluorescence ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const flPriority = parseFloat(row[2] || 0);
                const flGroupName = String(row[3] || "").trim();
                const flGroupPriority = parseFloat(row[4] || 0);
                const pricingFLID = String(row[5] || "").trim();

                const existing = fls.find(f => String(f.flid || f.FLID).toLowerCase() === flid.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    flid,
                    flName,
                    flPriority,
                    flGroupName,
                    flGroupPriority,
                    pricingFLID
                };

                try {
                    const response = await saveFLMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} fluorescences.`);
            }
            
            fetchFls();
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
        if (fls.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Fluorescence ID", "Fluorescence Name", "Fluorescence Priority", "Fluorescence Group Name", "Fluorescence Group Priority", "Pricing Fluorescence ID"];
        const rows = fls.map(item => [
            item.flid || item.FLID || "",
            item.flName || item.FLName || "",
            item.flPriority !== undefined ? item.flPriority : (item.FLPriority !== undefined ? item.FLPriority : ""),
            item.flGroupName || item.FLGroupName || "",
            item.flGroupPriority !== undefined ? item.flGroupPriority : (item.FLGroupPriority !== undefined ? item.FLGroupPriority : ""),
            item.pricingFLID || item.PricingFLID || ""
        ]);

        const result = await exportToExcel(headers, rows, "Fluorescences", "FlMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["Fluorescence ID", "Fluorescence Name", "Fluorescence Priority", "Fluorescence Group Name", "Fluorescence Group Priority", "Pricing Fluorescence ID"];
        const sampleRow = ["NON", "NONE", "1", "NON", "1", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "FlMasterTemplate");
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
                                title="Edit Fluorescence"
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
                                title="Delete Fluorescence"
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: "ID",
                accessorKey: "flid",
                accessorFn: (row) => row.flid || row.FLID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Name",
                accessorKey: "flName",
                accessorFn: (row) => row.flName || row.FLName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Priority",
                accessorKey: "flPriority",
                accessorFn: (row) => row.flPriority !== undefined ? row.flPriority : row.FLPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Group Name",
                accessorKey: "flGroupName",
                accessorFn: (row) => row.flGroupName || row.FLGroupName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Group Priority",
                accessorKey: "flGroupPriority",
                accessorFn: (row) => row.flGroupPriority !== undefined ? row.flGroupPriority : row.FLGroupPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Pricing ID",
                accessorKey: "pricingFLID",
                accessorFn: (row) => row.pricingFLID || row.PricingFLID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        []
    );

    document.title = "Fluorescence Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Fluorescence Master" pageTitle="Masters" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">Fluorescence Master List</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> Add Fluorescence
                                        </Button>
                                        <Button color="soft-success" onClick={() => setImportModal(true)} title="Import Excel">
                                            Import Excel
                                        </Button>
                                        <Button className="btn-soft-success" onClick={handleExportData} title="Export to Excel" style={{ height: "37.5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                            <i className="ri-file-excel-2-line" style={{ fontSize: "25px" }}></i>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {loading ? (
                                        <div className="text-center my-3">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <TableContainer
                                            columns={columns}
                                            data={fls}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder="Search Fluorescences..."
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
                    {isEdit ? "Edit Fluorescence Master" : "Add Fluorescence Master"}
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
                                    <Label htmlFor="flid" className="form-label">Fluorescence ID <span className="text-danger">*</span></Label>
                                    <Input
                                        name="flid"
                                        type="text"
                                        className="form-control"
                                        id="flid"
                                        placeholder="Enter Fluorescence ID"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.flid || ""}
                                        invalid={validation.touched.flid && validation.errors.flid ? true : false}
                                    />
                                    {validation.touched.flid && validation.errors.flid ? (
                                        <FormFeedback type="invalid">{validation.errors.flid}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="flName" className="form-label">Fluorescence Name <span className="text-danger">*</span></Label>
                                    <Input
                                        name="flName"
                                        type="text"
                                        className="form-control"
                                        id="flName"
                                        placeholder="Enter Fluorescence Name"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.flName || ""}
                                        invalid={validation.touched.flName && validation.errors.flName ? true : false}
                                    />
                                    {validation.touched.flName && validation.errors.flName ? (
                                        <FormFeedback type="invalid">{validation.errors.flName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="flPriority" className="form-label">Fluorescence Priority <span className="text-danger">*</span></Label>
                                    <Input
                                        name="flPriority"
                                        type="text"
                                        className="form-control"
                                        id="flPriority"
                                        placeholder="Enter Fluorescence Priority"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.flPriority !== undefined ? validation.values.flPriority : ""}
                                        invalid={validation.touched.flPriority && validation.errors.flPriority ? true : false}
                                    />
                                    {validation.touched.flPriority && validation.errors.flPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.flPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="flGroupName" className="form-label">Group Name</Label>
                                    <Input
                                        name="flGroupName"
                                        type="text"
                                        className="form-control"
                                        id="flGroupName"
                                        placeholder="Enter Fluorescence Group Name"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.flGroupName || ""}
                                        invalid={validation.touched.flGroupName && validation.errors.flGroupName ? true : false}
                                    />
                                    {validation.touched.flGroupName && validation.errors.flGroupName ? (
                                        <FormFeedback type="invalid">{validation.errors.flGroupName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="flGroupPriority" className="form-label">Group Priority</Label>
                                    <Input
                                        name="flGroupPriority"
                                        type="text"
                                        className="form-control"
                                        id="flGroupPriority"
                                        placeholder="Enter Fluorescence Group Priority"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.flGroupPriority !== undefined ? validation.values.flGroupPriority : ""}
                                        invalid={validation.touched.flGroupPriority && validation.errors.flGroupPriority ? true : false}
                                    />
                                    {validation.touched.flGroupPriority && validation.errors.flGroupPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.flGroupPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="pricingFLID" className="form-label">Pricing ID</Label>
                                    <Input
                                        name="pricingFLID"
                                        type="text"
                                        className="form-control"
                                        id="pricingFLID"
                                        placeholder="Enter Pricing Fluorescence ID"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.pricingFLID || ""}
                                        invalid={validation.touched.pricingFLID && validation.errors.pricingFLID ? true : false}
                                    />
                                    {validation.touched.pricingFLID && validation.errors.pricingFLID ? (
                                        <FormFeedback type="invalid">{validation.errors.pricingFLID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button type="button" color="light" onClick={() => setFormModal(false)}>Cancel</Button>
                        <Button type="submit" color="primary">{isEdit ? "Update" : "Save"}</Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
                <ModalHeader toggle={() => setDeleteModal(false)}>Confirm Delete</ModalHeader>
                <ModalBody>
                    <div className="mt-2 text-center">
                        <lord-icon
                            src="https://cdn.lordicon.com/gsqxdxog.json"
                            trigger="loop"
                            colors="primary:#f7b84b,secondary:#f06548"
                            style={{ width: "100px", height: "100px" }}
                        ></lord-icon>
                        <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            <h4>Are you sure?</h4>
                            <p className="text-muted mx-4 mb-0">
                                Are you sure you want to delete fluorescence <strong>{flToDelete?.flName || flToDelete?.FLName}</strong>?
                            </p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <Button type="button" color="light" className="w-sm" onClick={() => setDeleteModal(false)}>Cancel</Button>
                        <Button type="button" color="danger" className="w-sm" onClick={handleDeleteConfirm}>Yes, Delete It!</Button>
                    </div>
                </ModalBody>
            </Modal>

            {/* Import Excel Modal */}
            <Modal isOpen={importModal} toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }} centered>
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>Import Fluorescence Master Excel</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">Download FluorescenceMaster File Template Format</Label>
                        <div>
                            <Button color="primary" onClick={handleDownloadTemplate} size="sm">
                                <i className="ri-download-2-line align-bottom me-1"></i> Download Format
                            </Button>
                        </div>
                    </div>

                    <hr />

                    <div className="mb-3">
                        <Label htmlFor="importFile" className="form-label">Select Excel File To Import</Label>
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
                                <span className="text-muted">Processing rows...</span>
                                <span className="text-muted">{importProgress.current} / {importProgress.total}</span>
                            </div>
                            <Progress value={importProgress.total ? (importProgress.current / importProgress.total) * 100 : 0} color="primary" />
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => { setImportModal(false); setSelectedFile(null); }} disabled={importing}>Close</Button>
                    <Button color="primary" onClick={processImportFile} disabled={importing || !selectedFile}>Submit</Button>
                </ModalFooter>
            </Modal>
            <ToastContainer closeButton={false} limit={1} />
        </React.Fragment>
    );
};

export default FlMasterList;
