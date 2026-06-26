import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getColorMasters, saveColorMaster, deleteColorMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";

const ColorMasterList = () => {
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [colorToDelete, setColorToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchColors();
    }, []);

    const fetchColors = async () => {
        setLoading(true);
        try {
            const response = await getColorMasters();
            if (response.success || response.Success) {
                setColors(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Color Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch Color Master data");
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
    const handleEditClick = (color) => {
        setIsEdit(true);
        validation.setValues({
            id: color.id || color.ID || 0,
            colorID: color.colorID || color.ColorID || "",
            colorName: color.colorName || color.ColorName || "",
            colorPriority: color.colorPriority !== undefined ? color.colorPriority : (color.ColorPriority !== undefined ? color.ColorPriority : ""),
            colorGroupName: color.colorGroupName || color.ColorGroupName || "",
            colorGroupPriority: color.colorGroupPriority !== undefined ? color.colorGroupPriority : (color.ColorGroupPriority !== undefined ? color.ColorGroupPriority : ""),
            pricingColorID: color.pricingColorID || color.PricingColorID || ""
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (color) => {
        setColorToDelete(color);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (colorToDelete) {
            const id = colorToDelete.id || colorToDelete.ID;
            try {
                const response = await deleteColorMaster(id);
                if (response.success || response.Success) {
                    toast.success("Color Deleted Successfully");
                    fetchColors();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete color. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete color");
            }
            setDeleteModal(false);
            setColorToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            colorID: "",
            colorName: "",
            colorPriority: "",
            colorGroupName: "",
            colorGroupPriority: "",
            pricingColorID: ""
        },
        validationSchema: Yup.object({
            colorID: Yup.string()
                .max(30, "Color ID cannot exceed 30 characters")
                .required("Please Enter Color ID"),
            colorName: Yup.string()
                .max(30, "Color Name cannot exceed 30 characters")
                .required("Please Enter Color Name"),
            colorPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Color Priority"),
            colorGroupName: Yup.string()
                .nullable()
                .max(50, "Group Name cannot exceed 50 characters"),
            colorGroupPriority: Yup.number()
                .nullable()
                .typeError("Group Priority must be a number"),
            pricingColorID: Yup.string()
                .nullable()
                .max(30, "Pricing Color ID cannot exceed 30 characters")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    colorID: values.colorID,
                    colorName: values.colorName,
                    colorPriority: parseFloat(values.colorPriority || 0),
                    colorGroupName: values.colorGroupName || "",
                    colorGroupPriority: parseFloat(values.colorGroupPriority || 0),
                    pricingColorID: values.pricingColorID || ""
                };

                const response = await saveColorMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Color Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchColors();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save color record");
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

                const colorID = String(row[0] || "").trim();
                const colorName = String(row[1] || "").trim();

                if (!colorID || !colorName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Color ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Color ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const colorPriority = parseFloat(row[2] || 0);
                const colorGroupName = String(row[3] || "").trim();
                const colorGroupPriority = parseFloat(row[4] || 0);
                const pricingColorID = String(row[5] || "").trim();

                const payload = {
                    id: 0,
                    colorID,
                    colorName,
                    colorPriority,
                    colorGroupName,
                    colorGroupPriority,
                    pricingColorID
                };

                try {
                    const response = await saveColorMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} colors.`);
            }
            
            fetchColors();
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
        if (colors.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Color ID", "Color Name", "Color Priority", "Color Group Name", "Color Group Priority", "Pricing Color ID"];
        const rows = colors.map(item => [
            item.colorID || item.ColorID || "",
            item.colorName || item.ColorName || "",
            item.colorPriority !== undefined ? item.colorPriority : (item.ColorPriority !== undefined ? item.ColorPriority : ""),
            item.colorGroupName || item.ColorGroupName || "",
            item.colorGroupPriority !== undefined ? item.colorGroupPriority : (item.ColorGroupPriority !== undefined ? item.ColorGroupPriority : ""),
            item.pricingColorID || item.PricingColorID || ""
        ]);

        const result = await exportToExcel(headers, rows, "Colors", "ColorMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["Color ID", "Color Name", "Color Priority", "Color Group Name", "Color Group Priority", "Pricing Color ID"];
        const sampleRow = ["D", "D COLOR", "1", "COLOR D-F", "1", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "ColorMasterTemplate");
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
                                title="Edit Color"
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
                                title="Delete Color"
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: "ID",
                accessorKey: "colorID",
                accessorFn: (row) => row.colorID || row.ColorID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Name",
                accessorKey: "colorName",
                accessorFn: (row) => row.colorName || row.ColorName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Priority",
                accessorKey: "colorPriority",
                accessorFn: (row) => row.colorPriority !== undefined ? row.colorPriority : row.ColorPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Group Name",
                accessorKey: "colorGroupName",
                accessorFn: (row) => row.colorGroupName || row.ColorGroupName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Group Priority",
                accessorKey: "colorGroupPriority",
                accessorFn: (row) => row.colorGroupPriority !== undefined ? row.colorGroupPriority : row.ColorGroupPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Pricing ID",
                accessorKey: "pricingColorID",
                accessorFn: (row) => row.pricingColorID || row.PricingColorID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        []
    );

    document.title = "Color Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Color Master" pageTitle="Masters" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">Color Master List</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> Add Color
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
                                            data={colors}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder="Search Colors..."
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
                    {isEdit ? "Edit Color Master" : "Add Color Master"}
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
                                    <Label htmlFor="colorID" className="form-label">Color ID <span className="text-danger">*</span></Label>
                                    <Input
                                        name="colorID"
                                        type="text"
                                        className="form-control"
                                        id="colorID"
                                        placeholder="Enter Color ID"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.colorID || ""}
                                        invalid={validation.touched.colorID && validation.errors.colorID ? true : false}
                                    />
                                    {validation.touched.colorID && validation.errors.colorID ? (
                                        <FormFeedback type="invalid">{validation.errors.colorID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="colorName" className="form-label">Color Name <span className="text-danger">*</span></Label>
                                    <Input
                                        name="colorName"
                                        type="text"
                                        className="form-control"
                                        id="colorName"
                                        placeholder="Enter Color Name"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.colorName || ""}
                                        invalid={validation.touched.colorName && validation.errors.colorName ? true : false}
                                    />
                                    {validation.touched.colorName && validation.errors.colorName ? (
                                        <FormFeedback type="invalid">{validation.errors.colorName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="colorPriority" className="form-label">Color Priority <span className="text-danger">*</span></Label>
                                    <Input
                                        name="colorPriority"
                                        type="text"
                                        className="form-control"
                                        id="colorPriority"
                                        placeholder="Enter Color Priority"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.colorPriority !== undefined ? validation.values.colorPriority : ""}
                                        invalid={validation.touched.colorPriority && validation.errors.colorPriority ? true : false}
                                    />
                                    {validation.touched.colorPriority && validation.errors.colorPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.colorPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="colorGroupName" className="form-label">Group Name</Label>
                                    <Input
                                        name="colorGroupName"
                                        type="text"
                                        className="form-control"
                                        id="colorGroupName"
                                        placeholder="Enter Color Group Name"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.colorGroupName || ""}
                                        invalid={validation.touched.colorGroupName && validation.errors.colorGroupName ? true : false}
                                    />
                                    {validation.touched.colorGroupName && validation.errors.colorGroupName ? (
                                        <FormFeedback type="invalid">{validation.errors.colorGroupName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="colorGroupPriority" className="form-label">Group Priority</Label>
                                    <Input
                                        name="colorGroupPriority"
                                        type="text"
                                        className="form-control"
                                        id="colorGroupPriority"
                                        placeholder="Enter Color Group Priority"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.colorGroupPriority !== undefined ? validation.values.colorGroupPriority : ""}
                                        invalid={validation.touched.colorGroupPriority && validation.errors.colorGroupPriority ? true : false}
                                    />
                                    {validation.touched.colorGroupPriority && validation.errors.colorGroupPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.colorGroupPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="pricingColorID" className="form-label">Pricing ID</Label>
                                    <Input
                                        name="pricingColorID"
                                        type="text"
                                        className="form-control"
                                        id="pricingColorID"
                                        placeholder="Enter Pricing Color ID"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.pricingColorID || ""}
                                        invalid={validation.touched.pricingColorID && validation.errors.pricingColorID ? true : false}
                                    />
                                    {validation.touched.pricingColorID && validation.errors.pricingColorID ? (
                                        <FormFeedback type="invalid">{validation.errors.pricingColorID}</FormFeedback>
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
                                Are you sure you want to delete color <strong>{colorToDelete?.colorName || colorToDelete?.ColorName}</strong>?
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
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>Import Color Master Excel</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">Download ColorMaster File Template Format</Label>
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

export default ColorMasterList;
