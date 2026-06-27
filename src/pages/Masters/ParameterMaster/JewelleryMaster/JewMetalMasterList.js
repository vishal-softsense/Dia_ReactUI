import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getJewMetalMasters, saveJewMetalMaster, deleteJewMetalMaster, getJewColorMasters, getJewMetalMastersPurity } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";

const JewMetalMasterList = () => {
    const [metals, setMetals] = useState([]);
    const [colors, setColors] = useState([]);
    const [purities, setPurities] = useState([]); // purity options based on metal type
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [metalToDelete, setMetalToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Fetch colors
            const colResponse = await getJewColorMasters();
            if (colResponse.success || colResponse.Success) {
                setColors(colResponse.data || colResponse.Data || []);
            }

            // Fetch metals list
            const response = await getJewMetalMasters();
            if (response.success || response.Success) {
                setMetals(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Jewellery Metal data");
            }
        } catch (error) {
            toast.error("Failed to fetch initial data");
        }
        setLoading(false);
    };

    // Helper to fetch purities when MetalType changes
    const handleMetalTypeChange = async (metalType, setFieldValue) => {
        if (!metalType) {
            setPurities([]);
            if (setFieldValue) {
                setFieldValue("metalPurity", "");
            }
            return;
        }

        try {
            const response = await getJewMetalMastersPurity(metalType);
            if (response.success || response.Success) {
                setPurities(response.data || response.Data || []);
            } else {
                setPurities([]);
            }
        } catch (error) {
            console.error("Failed to load purities for " + metalType, error);
            setPurities([]);
        }
    };

    // Open Modal for Add
    const handleAddClick = () => {
        setIsEdit(false);
        setPurities([]);
        validation.resetForm();
        setFormModal(true);
    };

    // Open Modal for Edit
    const handleEditClick = async (val) => {
        setIsEdit(true);
        validation.resetForm();

        const metalType = val.metalType || val.MetalType || "";
        
        // Pre-load purity options for the metalType
        if (metalType) {
            try {
                const response = await getJewMetalMastersPurity(metalType);
                if (response.success || response.Success) {
                    setPurities(response.data || response.Data || []);
                }
            } catch (error) {
                console.error("Error loading purities in edit modal", error);
            }
        }

        validation.setValues({
            id: val.id || val.ID || 0,
            metalID: val.metalID || val.MetalID || "",
            metalName: val.metalName || val.MetalName || "",
            metalPriority: val.metalPriority !== undefined ? val.metalPriority : (val.MetalPriority !== undefined ? val.MetalPriority : ""),
            metalType: metalType,
            metalColor: val.metalColor || val.MetalColor || "",
            metalPurity: val.metalPurity || val.MetalPurity || "",
            metal24KTRatio: val.metal24KTRatio !== undefined ? val.metal24KTRatio : (val.Metal24KTRatio !== undefined ? val.Metal24KTRatio : "")
        });

        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (val) => {
        setMetalToDelete(val);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (metalToDelete) {
            const id = metalToDelete.id || metalToDelete.ID;
            try {
                const response = await deleteJewMetalMaster(id);
                if (response.success || response.Success) {
                    toast.success("Jewellery Metal Deleted Successfully");
                    fetchInitialData();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete metal. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete metal");
            }
            setDeleteModal(false);
            setMetalToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            metalID: "",
            metalName: "",
            metalPriority: "",
            metalType: "",
            metalColor: "",
            metalPurity: "",
            metal24KTRatio: ""
        },
        validationSchema: Yup.object({
            metalID: Yup.string()
                .max(30, "Metal ID cannot exceed 30 characters")
                .required("Please Enter Metal ID"),
            metalName: Yup.string()
                .max(30, "Metal Name cannot exceed 30 characters")
                .required("Please Enter Metal Name"),
            metalPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Metal Priority"),
            metalType: Yup.string().required("Please Select Metal Type"),
            metalColor: Yup.string().required("Please Select Metal Color"),
            metalPurity: Yup.string().required("Please Select Metal Purity"),
            metal24KTRatio: Yup.number()
                .typeError("24KT Ratio must be a number")
                .required("Please Enter Metal 24KT Ratio")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    metalID: values.metalID,
                    metalName: values.metalName,
                    metalPriority: parseFloat(values.metalPriority || 0),
                    metalType: values.metalType,
                    metalColor: values.metalColor,
                    metalPurity: values.metalPurity,
                    metal24KTRatio: parseFloat(values.metal24KTRatio || 0)
                };

                const response = await saveJewMetalMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Jewellery Metal ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchInitialData();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save metal record");
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
            const expectedHeaders = ["Metal ID", "Metal Name", "Metal Priority", "Metal Type", "Metal Color", "Metal Purity", "Metal 24KT Ratio"];
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

                const metalID = String(row[0] || "").trim();
                const metalName = String(row[1] || "").trim();
                const metalType = String(row[3] || "").trim(); // MetalID, MetalName, MetalPriority, MetalType, MetalColor, MetalPurity, Metal24KTRatio
                const metalColor = String(row[4] || "").trim();
                const metalPurity = String(row[5] || "").trim();

                if (!metalID || !metalName || !metalType || !metalColor || !metalPurity) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing required fields (ID, Name, Type, Color, or Purity)`);
                    console.warn(`Row ${i + 2} skipped: Missing fields. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const metalPriority = parseFloat(row[2] || 0);
                const metal24KTRatio = parseFloat(row[6] || 0);

                const existing = metals.find(m => String(m.metalID || m.MetalID).toLowerCase() === metalID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    metalID,
                    metalName,
                    metalPriority,
                    metalType,
                    metalColor,
                    metalPurity,
                    metal24KTRatio
                };

                try {
                    const response = await saveJewMetalMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} metal records.`);
            }
            
            fetchInitialData();
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
        if (metals.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Metal ID", "Metal Name", "Metal Priority", "Metal Type", "Metal Color", "Metal Purity", "Metal 24KT Ratio"];
        const rows = metals.map(item => [
            item.metalID || item.MetalID || "",
            item.metalName || item.MetalName || "",
            item.metalPriority !== undefined ? item.metalPriority : (item.MetalPriority !== undefined ? item.MetalPriority : ""),
            item.metalType || item.MetalType || "",
            item.metalColor || item.MetalColor || "",
            item.metalPurity || item.MetalPurity || "",
            item.metal24KTRatio !== undefined ? item.metal24KTRatio : (item.Metal24KTRatio !== undefined ? item.Metal24KTRatio : "")
        ]);

        const result = await exportToExcel(headers, rows, "JewMetal", "JewMetalMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["Metal ID", "Metal Name", "Metal Priority", "Metal Type", "Metal Color", "Metal Purity", "Metal 24KT Ratio"];
        const sampleRow = ["MET1", "18K Yellow Gold", "1", "Gold", colors[0]?.jewColorID || colors[0]?.JewColorID || "Yellow", "18K", "0.75"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "JewMetalMasterTemplate");
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
                                title="Edit Metal"
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
                                title="Delete Metal"
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: "ID",
                accessorKey: "metalID",
                accessorFn: (row) => row.metalID || row.MetalID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Name",
                accessorKey: "metalName",
                accessorFn: (row) => row.metalName || row.MetalName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Priority",
                accessorKey: "metalPriority",
                accessorFn: (row) => row.metalPriority !== undefined ? row.metalPriority : row.MetalPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Metal Type",
                accessorKey: "metalType",
                accessorFn: (row) => row.metalType || row.MetalType,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Metal Color",
                accessorKey: "metalColor",
                accessorFn: (row) => row.metalColor || row.MetalColor,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Metal Purity",
                accessorKey: "metalPurity",
                accessorFn: (row) => row.metalPurity || row.MetalPurity,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "24KT Ratio",
                accessorKey: "metal24KTRatio",
                accessorFn: (row) => row.metal24KTRatio !== undefined ? row.metal24KTRatio : row.Metal24KTRatio,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        [metals]
    );

    document.title = "Jewellery Metal Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Jewellery Metal Master" pageTitle="Masters" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">Jewellery Metal List</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> Add Metal
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
                                            data={metals}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder="Search Metals..."
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
                    {isEdit ? "Edit Jewellery Metal" : "Add Jewellery Metal"}
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
                                    <Label htmlFor="metalID" className="form-label">Metal ID <span className="text-danger">*</span></Label>
                                    <Input
                                        name="metalID"
                                        type="text"
                                        className="form-control"
                                        id="metalID"
                                        placeholder="Enter Metal ID"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.metalID || ""}
                                        invalid={validation.touched.metalID && validation.errors.metalID ? true : false}
                                    />
                                    {validation.touched.metalID && validation.errors.metalID ? (
                                        <FormFeedback type="invalid">{validation.errors.metalID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="metalName" className="form-label">Metal Name <span className="text-danger">*</span></Label>
                                    <Input
                                        name="metalName"
                                        type="text"
                                        className="form-control"
                                        id="metalName"
                                        placeholder="Enter Metal Name"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.metalName || ""}
                                        invalid={validation.touched.metalName && validation.errors.metalName ? true : false}
                                    />
                                    {validation.touched.metalName && validation.errors.metalName ? (
                                        <FormFeedback type="invalid">{validation.errors.metalName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="metalPriority" className="form-label">Metal Priority <span className="text-danger">*</span></Label>
                                    <Input
                                        name="metalPriority"
                                        type="text"
                                        className="form-control"
                                        id="metalPriority"
                                        placeholder="Enter Metal Priority"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.metalPriority !== undefined ? validation.values.metalPriority : ""}
                                        invalid={validation.touched.metalPriority && validation.errors.metalPriority ? true : false}
                                    />
                                    {validation.touched.metalPriority && validation.errors.metalPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.metalPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="metalType" className="form-label">Metal Type <span className="text-danger">*</span></Label>
                                    <Input
                                        name="metalType"
                                        type="select"
                                        className="form-select"
                                        id="metalType"
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            validation.setFieldValue("metalType", val);
                                            handleMetalTypeChange(val, validation.setFieldValue);
                                        }}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.metalType || ""}
                                        invalid={validation.touched.metalType && validation.errors.metalType ? true : false}
                                    >
                                        <option value="" disabled>Select Metal Type</option>
                                        <option value="Gold">Gold</option>
                                        <option value="Silver">Silver</option>
                                        <option value="Platinum">Platinum</option>
                                    </Input>
                                    {validation.touched.metalType && validation.errors.metalType ? (
                                        <FormFeedback type="invalid">{validation.errors.metalType}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="metalColor" className="form-label">Metal Color <span className="text-danger">*</span></Label>
                                    <Input
                                        name="metalColor"
                                        type="select"
                                        className="form-select"
                                        id="metalColor"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.metalColor || ""}
                                        invalid={validation.touched.metalColor && validation.errors.metalColor ? true : false}
                                    >
                                        <option value="" disabled>Select Metal Color</option>
                                        {colors.map((c) => (
                                            <option key={c.id || c.ID} value={c.jewColorID || c.JewColorID}>
                                                {c.jewColorID || c.JewColorID}
                                            </option>
                                        ))}
                                    </Input>
                                    {validation.touched.metalColor && validation.errors.metalColor ? (
                                        <FormFeedback type="invalid">{validation.errors.metalColor}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="metalPurity" className="form-label">Metal Purity <span className="text-danger">*</span></Label>
                                    <Input
                                        name="metalPurity"
                                        type="select"
                                        className="form-select"
                                        id="metalPurity"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.metalPurity || ""}
                                        disabled={!validation.values.metalType}
                                        invalid={validation.touched.metalPurity && validation.errors.metalPurity ? true : false}
                                    >
                                        <option value="" disabled>Select Metal Purity</option>
                                        {purities.map((p, idx) => (
                                            <option key={idx} value={p.metalPurityID || p.MetalPurityID}>
                                                {p.metalPurityID || p.MetalPurityID}
                                            </option>
                                        ))}
                                    </Input>
                                    {validation.touched.metalPurity && validation.errors.metalPurity ? (
                                        <FormFeedback type="invalid">{validation.errors.metalPurity}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="metal24KTRatio" className="form-label">Metal 24KT Ratio <span className="text-danger">*</span></Label>
                                    <Input
                                        name="metal24KTRatio"
                                        type="text"
                                        className="form-control"
                                        id="metal24KTRatio"
                                        placeholder="Enter Metal 24KT Ratio"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.metal24KTRatio !== undefined ? validation.values.metal24KTRatio : ""}
                                        invalid={validation.touched.metal24KTRatio && validation.errors.metal24KTRatio ? true : false}
                                    />
                                    {validation.touched.metal24KTRatio && validation.errors.metal24KTRatio ? (
                                        <FormFeedback type="invalid">{validation.errors.metal24KTRatio}</FormFeedback>
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
                                Are you sure you want to delete metal <strong>{metalToDelete?.metalName || metalToDelete?.MetalName}</strong>?
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
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>Import Jewellery Metal Excel</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">Download JewMetalMaster File Template Format</Label>
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

export default JewMetalMasterList;
