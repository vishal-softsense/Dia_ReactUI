import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getShapeMasters, saveShapeMaster, deleteShapeMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";

const ShapeMasterList = () => {
    const [shapes, setShapes] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [shapeToDelete, setShapeToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchShapes();
    }, []);

    const fetchShapes = async () => {
        setLoading(true);
        try {
            const response = await getShapeMasters();
            if (response.success || response.Success) {
                setShapes(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Shape Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch Shape Master data");
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
    const handleEditClick = (shape) => {
        setIsEdit(true);
        validation.setValues({
            id: shape.id || shape.ID || 0,
            shapeID: shape.shapeID || shape.ShapeID || "",
            shapeName: shape.shapeName || shape.ShapeName || "",
            shapePriority: shape.shapePriority !== undefined ? shape.shapePriority : (shape.ShapePriority !== undefined ? shape.ShapePriority : ""),
            shapeGroupName: shape.shapeGroupName || shape.ShapeGroupName || "",
            shapeGroupPriority: shape.shapeGroupPriority !== undefined ? shape.shapeGroupPriority : (shape.ShapeGroupPriority !== undefined ? shape.ShapeGroupPriority : ""),
            pricingShapeID: shape.pricingShapeID || shape.PricingShapeID || ""
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (shape) => {
        setShapeToDelete(shape);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (shapeToDelete) {
            const id = shapeToDelete.id || shapeToDelete.ID;
            try {
                const response = await deleteShapeMaster(id);
                if (response.success || response.Success) {
                    toast.success("Shape Deleted Successfully");
                    fetchShapes();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete shape. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete shape");
            }
            setDeleteModal(false);
            setShapeToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            shapeID: "",
            shapeName: "",
            shapePriority: "",
            shapeGroupName: "",
            shapeGroupPriority: "",
            pricingShapeID: ""
        },
        validationSchema: Yup.object({
            shapeID: Yup.string()
                .max(30, "Shape ID cannot exceed 30 characters")
                .required("Please Enter Shape ID"),
            shapeName: Yup.string()
                .max(30, "Shape Name cannot exceed 30 characters")
                .required("Please Enter Shape Name"),
            shapePriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Shape Priority"),
            shapeGroupName: Yup.string()
                .nullable()
                .max(50, "Group Name cannot exceed 50 characters"),
            shapeGroupPriority: Yup.number()
                .nullable()
                .typeError("Group Priority must be a number"),
            pricingShapeID: Yup.string()
                .nullable()
                .max(30, "Pricing Shape ID cannot exceed 30 characters")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    shapeID: values.shapeID,
                    shapeName: values.shapeName,
                    shapePriority: parseFloat(values.shapePriority || 0),
                    shapeGroupName: values.shapeGroupName || "",
                    shapeGroupPriority: parseFloat(values.shapeGroupPriority || 0),
                    pricingShapeID: values.pricingShapeID || ""
                };

                const response = await saveShapeMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Shape Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchShapes();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save shape record");
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

        const fileExtension = file.name.split('.').pop().toLowerCase();

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

                const shapeID = String(row[0] || "").trim();
                const shapeName = String(row[1] || "").trim();

                if (!shapeID || !shapeName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Shape ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Shape ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const shapePriority = parseFloat(row[2] || 0);
                const shapeGroupName = String(row[3] || "").trim();
                const shapeGroupPriority = parseFloat(row[4] || 0);
                const pricingShapeID = String(row[5] || "").trim();

                const existing = shapes.find(s => String(s.shapeID || s.ShapeID).toLowerCase() === shapeID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    shapeID,
                    shapeName,
                    shapePriority,
                    shapeGroupName,
                    shapeGroupPriority,
                    pricingShapeID
                };

                try {
                    const response = await saveShapeMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} shapes.`);
            }
            
            fetchShapes();
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
        if (shapes.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Shape ID", "Shape Name", "Shape Priority", "Shape Group Name", "Shape Group Priority", "Pricing Shape ID"];
        const rows = shapes.map(item => [
            item.shapeID || item.ShapeID || "",
            item.shapeName || item.ShapeName || "",
            item.shapePriority !== undefined ? item.shapePriority : (item.ShapePriority !== undefined ? item.ShapePriority : ""),
            item.shapeGroupName || item.ShapeGroupName || "",
            item.shapeGroupPriority !== undefined ? item.shapeGroupPriority : (item.ShapeGroupPriority !== undefined ? item.ShapeGroupPriority : ""),
            item.pricingShapeID || item.PricingShapeID || ""
        ]);

        const result = await exportToExcel(headers, rows, "Shapes", "ShapeMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["Shape ID", "Shape Name", "Shape Priority", "Shape Group Name", "Shape Group Priority", "Pricing Shape ID"];
        const sampleRow = ["RND", "ROUND", "1", "ROUND", "1", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "ShapeMasterTemplate");
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
                                title="Edit Shape"
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
                                title="Delete Shape"
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: "ID",
                accessorKey: "shapeID",
                accessorFn: (row) => row.shapeID || row.ShapeID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Name",
                accessorKey: "shapeName",
                accessorFn: (row) => row.shapeName || row.ShapeName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Priority",
                accessorKey: "shapePriority",
                accessorFn: (row) => row.shapePriority !== undefined ? row.shapePriority : row.ShapePriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Group Name",
                accessorKey: "shapeGroupName",
                accessorFn: (row) => row.shapeGroupName || row.ShapeGroupName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Group Priority",
                accessorKey: "shapeGroupPriority",
                accessorFn: (row) => row.shapeGroupPriority !== undefined ? row.shapeGroupPriority : row.ShapeGroupPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Pricing ID",
                accessorKey: "pricingShapeID",
                accessorFn: (row) => row.pricingShapeID || row.PricingShapeID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        []
    );

    document.title = "Shape Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Shape Master" pageTitle="Masters" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">Shape Master List</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> Add Shape
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
                                            data={shapes}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder="Search Shapes..."
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
                    {isEdit ? "Edit Shape Master" : "Add Shape Master"}
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
                                    <Label htmlFor="shapeID" className="form-label">Shape ID <span className="text-danger">*</span></Label>
                                    <Input
                                        name="shapeID"
                                        type="text"
                                        className="form-control"
                                        id="shapeID"
                                        placeholder="Enter Shape ID"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.shapeID || ""}
                                        invalid={validation.touched.shapeID && validation.errors.shapeID ? true : false}
                                    />
                                    {validation.touched.shapeID && validation.errors.shapeID ? (
                                        <FormFeedback type="invalid">{validation.errors.shapeID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="shapeName" className="form-label">Shape Name <span className="text-danger">*</span></Label>
                                    <Input
                                        name="shapeName"
                                        type="text"
                                        className="form-control"
                                        id="shapeName"
                                        placeholder="Enter Shape Name"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.shapeName || ""}
                                        invalid={validation.touched.shapeName && validation.errors.shapeName ? true : false}
                                    />
                                    {validation.touched.shapeName && validation.errors.shapeName ? (
                                        <FormFeedback type="invalid">{validation.errors.shapeName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="shapePriority" className="form-label">Shape Priority <span className="text-danger">*</span></Label>
                                    <Input
                                        name="shapePriority"
                                        type="text"
                                        className="form-control"
                                        id="shapePriority"
                                        placeholder="Enter Shape Priority"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.shapePriority !== undefined ? validation.values.shapePriority : ""}
                                        invalid={validation.touched.shapePriority && validation.errors.shapePriority ? true : false}
                                    />
                                    {validation.touched.shapePriority && validation.errors.shapePriority ? (
                                        <FormFeedback type="invalid">{validation.errors.shapePriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="shapeGroupName" className="form-label">Group Name</Label>
                                    <Input
                                        name="shapeGroupName"
                                        type="text"
                                        className="form-control"
                                        id="shapeGroupName"
                                        placeholder="Enter Shape Group Name"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.shapeGroupName || ""}
                                        invalid={validation.touched.shapeGroupName && validation.errors.shapeGroupName ? true : false}
                                    />
                                    {validation.touched.shapeGroupName && validation.errors.shapeGroupName ? (
                                        <FormFeedback type="invalid">{validation.errors.shapeGroupName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="shapeGroupPriority" className="form-label">Group Priority</Label>
                                    <Input
                                        name="shapeGroupPriority"
                                        type="text"
                                        className="form-control"
                                        id="shapeGroupPriority"
                                        placeholder="Enter Shape Group Priority"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.shapeGroupPriority !== undefined ? validation.values.shapeGroupPriority : ""}
                                        invalid={validation.touched.shapeGroupPriority && validation.errors.shapeGroupPriority ? true : false}
                                    />
                                    {validation.touched.shapeGroupPriority && validation.errors.shapeGroupPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.shapeGroupPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="pricingShapeID" className="form-label">Pricing ID</Label>
                                    <Input
                                        name="pricingShapeID"
                                        type="text"
                                        className="form-control"
                                        id="pricingShapeID"
                                        placeholder="Enter Pricing Shape ID"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.pricingShapeID || ""}
                                        invalid={validation.touched.pricingShapeID && validation.errors.pricingShapeID ? true : false}
                                    />
                                    {validation.touched.pricingShapeID && validation.errors.pricingShapeID ? (
                                        <FormFeedback type="invalid">{validation.errors.pricingShapeID}</FormFeedback>
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
                                Are you sure you want to delete shape <strong>{shapeToDelete?.shapeName || shapeToDelete?.ShapeName}</strong>?
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
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>Import Shape Master Excel</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">Download ShapeMaster File Template Format</Label>
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

export default ShapeMasterList;
