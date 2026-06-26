import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getLabMasters, saveLabMaster, deleteLabMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";

const LabMasterList = () => {
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [labToDelete, setLabToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchLabs();
    }, []);

    const fetchLabs = async () => {
        setLoading(true);
        try {
            const response = await getLabMasters();
            if (response.success || response.Success) {
                setLabs(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch LAB Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch LAB Master data");
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
    const handleEditClick = (lab) => {
        setIsEdit(true);
        validation.setValues({
            id: lab.id || lab.ID || 0,
            certID: lab.certID || lab.CertID || "",
            certName: lab.certName || lab.CertName || "",
            certPriority: lab.certPriority !== undefined ? lab.certPriority : (lab.CertPriority !== undefined ? lab.CertPriority : ""),
            certGroupName: lab.certGroupName || lab.CertGroupName || "",
            certGroupPriority: lab.certGroupPriority !== undefined ? lab.certGroupPriority : (lab.CertGroupPriority !== undefined ? lab.CertGroupPriority : ""),
            pricingCertID: lab.pricingCertID || lab.PricingCertID || ""
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (lab) => {
        setLabToDelete(lab);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (labToDelete) {
            const id = labToDelete.id || labToDelete.ID;
            try {
                const response = await deleteLabMaster(id);
                if (response.success || response.Success) {
                    toast.success("LAB Deleted Successfully");
                    fetchLabs();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete LAB. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete LAB");
            }
            setDeleteModal(false);
            setLabToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            certID: "",
            certName: "",
            certPriority: "",
            certGroupName: "",
            certGroupPriority: "",
            pricingCertID: ""
        },
        validationSchema: Yup.object({
            certID: Yup.string()
                .max(30, "LAB ID cannot exceed 30 characters")
                .required("Please Enter LAB ID"),
            certName: Yup.string()
                .max(30, "LAB Name cannot exceed 30 characters")
                .required("Please Enter LAB Name"),
            certPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter LAB Priority"),
            certGroupName: Yup.string()
                .nullable()
                .max(50, "Group Name cannot exceed 50 characters"),
            certGroupPriority: Yup.number()
                .nullable()
                .typeError("Group Priority must be a number"),
            pricingCertID: Yup.string()
                .nullable()
                .max(30, "Pricing LAB ID cannot exceed 30 characters")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    certID: values.certID,
                    certName: values.certName,
                    certPriority: parseFloat(values.certPriority || 0),
                    certGroupName: values.certGroupName || "",
                    certGroupPriority: parseFloat(values.certGroupPriority || 0),
                    pricingCertID: values.pricingCertID || ""
                };

                const response = await saveLabMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`LAB Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchLabs();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save LAB record");
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
            const parsed = await parseExcelFile(file);
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

                const certID = String(row[0] || "").trim();
                const certName = String(row[1] || "").trim();

                if (!certID || !certName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing LAB ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing LAB ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const certPriority = parseFloat(row[2] || 0);
                const certGroupName = String(row[3] || "").trim();
                const certGroupPriority = parseFloat(row[4] || 0);
                const pricingCertID = String(row[5] || "").trim();

                const payload = {
                    id: 0,
                    certID,
                    certName,
                    certPriority,
                    certGroupName,
                    certGroupPriority,
                    pricingCertID
                };

                try {
                    const response = await saveLabMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} labs.`);
            }
            
            fetchLabs();
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
        if (labs.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["LAB ID", "LAB Name", "LAB Priority", "LAB Group Name", "LAB Group Priority", "Pricing LAB ID"];
        const rows = labs.map(item => [
            item.certID || item.CertID || "",
            item.certName || item.CertName || "",
            item.certPriority !== undefined ? item.certPriority : (item.CertPriority !== undefined ? item.CertPriority : ""),
            item.certGroupName || item.CertGroupName || "",
            item.certGroupPriority !== undefined ? item.certGroupPriority : (item.CertGroupPriority !== undefined ? item.CertGroupPriority : ""),
            item.pricingCertID || item.PricingCertID || ""
        ]);

        const result = await exportToExcel(headers, rows, "LABs", "LABMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["LAB ID", "LAB Name", "LAB Priority", "LAB Group Name", "LAB Group Priority", "Pricing LAB ID"];
        const sampleRow = ["GIA", "GIA", "1", "GIA", "1", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "LABMasterTemplate");
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
                                title="Edit LAB"
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
                                title="Delete LAB"
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: "ID",
                accessorKey: "certID",
                accessorFn: (row) => row.certID || row.CertID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Name",
                accessorKey: "certName",
                accessorFn: (row) => row.certName || row.CertName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Priority",
                accessorKey: "certPriority",
                accessorFn: (row) => row.certPriority !== undefined ? row.certPriority : row.CertPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Group Name",
                accessorKey: "certGroupName",
                accessorFn: (row) => row.certGroupName || row.CertGroupName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Group Priority",
                accessorKey: "certGroupPriority",
                accessorFn: (row) => row.certGroupPriority !== undefined ? row.certGroupPriority : row.CertGroupPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Pricing ID",
                accessorKey: "pricingCertID",
                accessorFn: (row) => row.pricingCertID || row.PricingCertID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        []
    );

    document.title = "LAB Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="LAB Master" pageTitle="Masters" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">LAB Master List</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> Add LAB
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
                                            data={labs}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder="Search LABs..."
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
                    {isEdit ? "Edit LAB Master" : "Add LAB Master"}
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
                                    <Label htmlFor="certID" className="form-label">LAB ID <span className="text-danger">*</span></Label>
                                    <Input
                                        name="certID"
                                        type="text"
                                        className="form-control"
                                        id="certID"
                                        placeholder="Enter LAB ID"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.certID || ""}
                                        invalid={validation.touched.certID && validation.errors.certID ? true : false}
                                    />
                                    {validation.touched.certID && validation.errors.certID ? (
                                        <FormFeedback type="invalid">{validation.errors.certID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="certName" className="form-label">LAB Name <span className="text-danger">*</span></Label>
                                    <Input
                                        name="certName"
                                        type="text"
                                        className="form-control"
                                        id="certName"
                                        placeholder="Enter LAB Name"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.certName || ""}
                                        invalid={validation.touched.certName && validation.errors.certName ? true : false}
                                    />
                                    {validation.touched.certName && validation.errors.certName ? (
                                        <FormFeedback type="invalid">{validation.errors.certName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="certPriority" className="form-label">LAB Priority <span className="text-danger">*</span></Label>
                                    <Input
                                        name="certPriority"
                                        type="text"
                                        className="form-control"
                                        id="certPriority"
                                        placeholder="Enter LAB Priority"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.certPriority !== undefined ? validation.values.certPriority : ""}
                                        invalid={validation.touched.certPriority && validation.errors.certPriority ? true : false}
                                    />
                                    {validation.touched.certPriority && validation.errors.certPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.certPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="certGroupName" className="form-label">Group Name</Label>
                                    <Input
                                        name="certGroupName"
                                        type="text"
                                        className="form-control"
                                        id="certGroupName"
                                        placeholder="Enter LAB Group Name"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.certGroupName || ""}
                                        invalid={validation.touched.certGroupName && validation.errors.certGroupName ? true : false}
                                    />
                                    {validation.touched.certGroupName && validation.errors.certGroupName ? (
                                        <FormFeedback type="invalid">{validation.errors.certGroupName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="certGroupPriority" className="form-label">Group Priority</Label>
                                    <Input
                                        name="certGroupPriority"
                                        type="text"
                                        className="form-control"
                                        id="certGroupPriority"
                                        placeholder="Enter LAB Group Priority"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.certGroupPriority !== undefined ? validation.values.certGroupPriority : ""}
                                        invalid={validation.touched.certGroupPriority && validation.errors.certGroupPriority ? true : false}
                                    />
                                    {validation.touched.certGroupPriority && validation.errors.certGroupPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.certGroupPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="pricingCertID" className="form-label">Pricing ID</Label>
                                    <Input
                                        name="pricingCertID"
                                        type="text"
                                        className="form-control"
                                        id="pricingCertID"
                                        placeholder="Enter Pricing LAB ID"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.pricingCertID || ""}
                                        invalid={validation.touched.pricingCertID && validation.errors.pricingCertID ? true : false}
                                    />
                                    {validation.touched.pricingCertID && validation.errors.pricingCertID ? (
                                        <FormFeedback type="invalid">{validation.errors.pricingCertID}</FormFeedback>
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
                                Are you sure you want to delete LAB <strong>{labToDelete?.certName || labToDelete?.CertName}</strong>?
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
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>Import LAB Master Excel</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">Download LABMaster File Template Format</Label>
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

export default LabMasterList;
