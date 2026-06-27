import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getJewMetalPurityMasters, saveJewMetalPurityMaster, deleteJewMetalPurityMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";

const JewMetalPurityMasterList = () => {
    const [purities, setPurities] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [purityToDelete, setPurityToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchPurities();
    }, []);

    const fetchPurities = async () => {
        setLoading(true);
        try {
            const response = await getJewMetalPurityMasters();
            if (response.success || response.Success) {
                setPurities(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Jewellery Metal Purity data");
            }
        } catch (error) {
            toast.error("Failed to fetch Jewellery Metal Purity data");
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
    const handleEditClick = (val) => {
        setIsEdit(true);
        validation.setValues({
            id: val.id || val.ID || 0,
            metalPurityID: val.metalPurityID || val.MetalPurityID || "",
            metalPurityName: val.metalPurityName || val.MetalPurityName || "",
            metalPurityPriority: val.metalPurityPriority !== undefined ? val.metalPurityPriority : (val.MetalPurityPriority !== undefined ? val.MetalPurityPriority : ""),
            metal: val.metal || val.Metal || "",
            metalPurityToPureRatio: val.metalPurityToPureRatio !== undefined ? val.metalPurityToPureRatio : (val.MetalPurityToPureRatio !== undefined ? val.MetalPurityToPureRatio : "")
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (val) => {
        setPurityToDelete(val);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (purityToDelete) {
            const id = purityToDelete.id || purityToDelete.ID;
            try {
                const response = await deleteJewMetalPurityMaster(id);
                if (response.success || response.Success) {
                    toast.success("Jewellery Metal Purity Deleted Successfully");
                    fetchPurities();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete metal purity. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete metal purity");
            }
            setDeleteModal(false);
            setPurityToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            metalPurityID: "",
            metalPurityName: "",
            metalPurityPriority: "",
            metal: "",
            metalPurityToPureRatio: ""
        },
        validationSchema: Yup.object({
            metalPurityID: Yup.string()
                .max(30, "MetalPurity ID cannot exceed 30 characters")
                .required("Please Enter MetalPurity ID"),
            metalPurityName: Yup.string()
                .max(30, "MetalPurity Name cannot exceed 30 characters")
                .required("Please Enter MetalPurity Name"),
            metalPurityPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter MetalPurity Priority"),
            metal: Yup.string().required("Please Select Metal"),
            metalPurityToPureRatio: Yup.number()
                .typeError("Ratio must be a number")
                .required("Please Enter MetalPurityToPureRatio")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    metalPurityID: values.metalPurityID,
                    metalPurityName: values.metalPurityName,
                    metalPurityPriority: parseFloat(values.metalPurityPriority || 0),
                    metal: values.metal,
                    metalPurityToPureRatio: parseFloat(values.metalPurityToPureRatio || 0)
                };

                const response = await saveJewMetalPurityMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Jewellery Metal Purity ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchPurities();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save metal purity record");
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

                const metalPurityID = String(row[0] || "").trim();
                const metalPurityName = String(row[1] || "").trim();
                const metal = String(row[3] || "").trim(); // Expecting: MetalPurityID, MetalPurityName, MetalPurityPriority, Metal, MetalPurityToPureRatio

                if (!metalPurityID || !metalPurityName || !metal) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing ID, Name, or Metal`);
                    console.warn(`Row ${i + 2} skipped: Missing fields. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const metalPurityPriority = parseFloat(row[2] || 0);
                const metalPurityToPureRatio = parseFloat(row[4] || 0);

                const existing = purities.find(p => String(p.metalPurityID || p.MetalPurityID).toLowerCase() === metalPurityID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    metalPurityID,
                    metalPurityName,
                    metalPurityPriority,
                    metal,
                    metalPurityToPureRatio
                };

                try {
                    const response = await saveJewMetalPurityMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} metal purity records.`);
            }
            
            fetchPurities();
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
        if (purities.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["MetalPurity ID", "MetalPurity Name", "MetalPurity Priority", "Metal", "MetalPurityToPureRatio"];
        const rows = purities.map(item => [
            item.metalPurityID || item.MetalPurityID || "",
            item.metalPurityName || item.MetalPurityName || "",
            item.metalPurityPriority !== undefined ? item.metalPurityPriority : (item.MetalPurityPriority !== undefined ? item.MetalPurityPriority : ""),
            item.metal || item.Metal || "",
            item.metalPurityToPureRatio !== undefined ? item.metalPurityToPureRatio : (item.MetalPurityToPureRatio !== undefined ? item.MetalPurityToPureRatio : "")
        ]);

        const result = await exportToExcel(headers, rows, "JewMetalPurity", "JewMetalPurityMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["MetalPurity ID", "MetalPurity Name", "MetalPurity Priority", "Metal", "MetalPurityToPureRatio"];
        const sampleRow = ["18K", "18 Karat", "1", "Gold", "0.75"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "JewMetalPurityMasterTemplate");
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
                                title="Edit Purity"
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
                                title="Delete Purity"
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: "ID",
                accessorKey: "metalPurityID",
                accessorFn: (row) => row.metalPurityID || row.MetalPurityID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Name",
                accessorKey: "metalPurityName",
                accessorFn: (row) => row.metalPurityName || row.MetalPurityName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Priority",
                accessorKey: "metalPurityPriority",
                accessorFn: (row) => row.metalPurityPriority !== undefined ? row.metalPurityPriority : row.MetalPurityPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Metal",
                accessorKey: "metal",
                accessorFn: (row) => row.metal || row.Metal,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Pure Ratio",
                accessorKey: "metalPurityToPureRatio",
                accessorFn: (row) => row.metalPurityToPureRatio !== undefined ? row.metalPurityToPureRatio : row.MetalPurityToPureRatio,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        [purities]
    );

    document.title = "Jewellery Metal Purity Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Jewellery Metal Purity Master" pageTitle="Masters" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">Jewellery Metal Purity List</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> Add MetalPurity
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
                                            data={purities}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder="Search Purities..."
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
                    {isEdit ? "Edit Jewellery MetalPurity" : "Add Jewellery MetalPurity"}
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
                                    <Label htmlFor="metalPurityID" className="form-label">MetalPurity ID <span className="text-danger">*</span></Label>
                                    <Input
                                        name="metalPurityID"
                                        type="text"
                                        className="form-control"
                                        id="metalPurityID"
                                        placeholder="Enter MetalPurity ID"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.metalPurityID || ""}
                                        invalid={validation.touched.metalPurityID && validation.errors.metalPurityID ? true : false}
                                    />
                                    {validation.touched.metalPurityID && validation.errors.metalPurityID ? (
                                        <FormFeedback type="invalid">{validation.errors.metalPurityID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="metalPurityName" className="form-label">MetalPurity Name <span className="text-danger">*</span></Label>
                                    <Input
                                        name="metalPurityName"
                                        type="text"
                                        className="form-control"
                                        id="metalPurityName"
                                        placeholder="Enter MetalPurity Name"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.metalPurityName || ""}
                                        invalid={validation.touched.metalPurityName && validation.errors.metalPurityName ? true : false}
                                    />
                                    {validation.touched.metalPurityName && validation.errors.metalPurityName ? (
                                        <FormFeedback type="invalid">{validation.errors.metalPurityName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="metalPurityPriority" className="form-label">MetalPurity Priority <span className="text-danger">*</span></Label>
                                    <Input
                                        name="metalPurityPriority"
                                        type="text"
                                        className="form-control"
                                        id="metalPurityPriority"
                                        placeholder="Enter MetalPurity Priority"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.metalPurityPriority !== undefined ? validation.values.metalPurityPriority : ""}
                                        invalid={validation.touched.metalPurityPriority && validation.errors.metalPurityPriority ? true : false}
                                    />
                                    {validation.touched.metalPurityPriority && validation.errors.metalPurityPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.metalPurityPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="metal" className="form-label">Metal <span className="text-danger">*</span></Label>
                                    <Input
                                        name="metal"
                                        type="select"
                                        className="form-select"
                                        id="metal"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.metal || ""}
                                        invalid={validation.touched.metal && validation.errors.metal ? true : false}
                                    >
                                        <option value="" disabled>Select Metal</option>
                                        <option value="Gold">Gold</option>
                                        <option value="Silver">Silver</option>
                                        <option value="Platinum">Platinum</option>
                                    </Input>
                                    {validation.touched.metal && validation.errors.metal ? (
                                        <FormFeedback type="invalid">{validation.errors.metal}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="metalPurityToPureRatio" className="form-label">MetalPurity To Pure Ratio <span className="text-danger">*</span></Label>
                                    <Input
                                        name="metalPurityToPureRatio"
                                        type="text"
                                        className="form-control"
                                        id="metalPurityToPureRatio"
                                        placeholder="Enter MetalPurity To Pure Ratio"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.metalPurityToPureRatio !== undefined ? validation.values.metalPurityToPureRatio : ""}
                                        invalid={validation.touched.metalPurityToPureRatio && validation.errors.metalPurityToPureRatio ? true : false}
                                    />
                                    {validation.touched.metalPurityToPureRatio && validation.errors.metalPurityToPureRatio ? (
                                        <FormFeedback type="invalid">{validation.errors.metalPurityToPureRatio}</FormFeedback>
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
                                Are you sure you want to delete metal purity <strong>{purityToDelete?.metalPurityName || purityToDelete?.MetalPurityName}</strong>?
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
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>Import Jewellery MetalPurity Excel</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">Download JewMetalPurityMaster File Template Format</Label>
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

export default JewMetalPurityMasterList;
