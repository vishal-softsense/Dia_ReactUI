import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getCountryMasters, saveCountryMaster, deleteCountryMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";

const CountryMasterList = () => {
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [countryToDelete, setCountryToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        setLoading(true);
        try {
            const response = await getCountryMasters();
            if (response.success || response.Success) {
                setCountries(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Country Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch Country Master data");
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
    const handleEditClick = (country) => {
        setIsEdit(true);
        validation.setValues({
            id: country.id || country.ID || 0,
            countryID: country.countryID || country.CountryID || "",
            countryName: country.countryName || country.CountryName || "",
            countryPriority: country.countryPriority !== undefined ? country.countryPriority : (country.CountryPriority !== undefined ? country.CountryPriority : "")
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (country) => {
        setCountryToDelete(country);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (countryToDelete) {
            const id = countryToDelete.id || countryToDelete.ID;
            try {
                const response = await deleteCountryMaster(id);
                if (response.success || response.Success) {
                    toast.success("Country Deleted Successfully");
                    fetchCountries();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete country. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete country");
            }
            setDeleteModal(false);
            setCountryToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            countryID: "",
            countryName: "",
            countryPriority: ""
        },
        validationSchema: Yup.object({
            countryID: Yup.string()
                .max(30, "Country ID cannot exceed 30 characters")
                .required("Please Enter Country ID"),
            countryName: Yup.string()
                .max(30, "Country Name cannot exceed 30 characters")
                .required("Please Enter Country Name"),
            countryPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Country Priority")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    countryID: values.countryID,
                    countryName: values.countryName,
                    countryPriority: parseFloat(values.countryPriority || 0)
                };

                const response = await saveCountryMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Country Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchCountries();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save country record");
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

                const countryID = String(row[0] || "").trim();
                const countryName = String(row[1] || "").trim();

                if (!countryID || !countryName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Country ID or Name`);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const countryPriority = parseFloat(row[2] || 0);

                const existing = countries.find(c => String(c.countryID || c.CountryID).toLowerCase() === countryID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    countryID,
                    countryName,
                    countryPriority
                };

                try {
                    const response = await saveCountryMaster(payload);
                    if (response.success || response.Success) {
                        successCount++;
                    } else {
                        errorCount++;
                        const msg = response.data || response.message || response.Message || "Unknown error";
                        errorMessages.push(`Row ${i + 2}: ${msg}`);
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
                }

                setImportProgress(prev => ({ ...prev, current: i + 1 }));
            }

            if (errorCount > 0) {
                const firstFew = errorMessages.slice(0, 3).join(" | ");
                toast.error(`Imported ${successCount}. Failed ${errorCount}. Errors: ${firstFew}${errorCount > 3 ? "..." : ""}`, { autoClose: 8000 });
            } else {
                toast.success(`Import complete! Successfully saved ${successCount} countries.`);
            }
            
            fetchCountries();
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
        if (countries.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Country ID", "Country Name", "Country Priority"];
        const rows = countries.map(item => [
            item.countryID || item.CountryID || "",
            item.countryName || item.CountryName || "",
            item.countryPriority !== undefined ? item.countryPriority : (item.CountryPriority !== undefined ? item.CountryPriority : "")
        ]);

        const result = await exportToExcel(headers, rows, "Countries", "CountryMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["Country ID", "Country Name", "Country Priority"];
        const sampleRow = ["US", "United States", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "CountryMasterTemplate");
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
                                title="Edit Country"
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
                                title="Delete Country"
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: "Country ID",
                accessorKey: "countryID",
                accessorFn: (row) => row.countryID || row.CountryID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Country Name",
                accessorKey: "countryName",
                accessorFn: (row) => row.countryName || row.CountryName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Country Priority",
                accessorKey: "countryPriority",
                accessorFn: (row) => row.countryPriority !== undefined ? row.countryPriority : row.CountryPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        []
    );

    document.title = "Country Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Country Master" pageTitle="Masters" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">Country Master List</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> Add Country
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
                                            data={countries}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder="Search Countries..."
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
                    {isEdit ? "Edit Country Master" : "Add Country Master"}
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
                                    <Label htmlFor="countryID" className="form-label">Country ID <span className="text-danger">*</span></Label>
                                    <Input
                                        name="countryID"
                                        type="text"
                                        className="form-control"
                                        id="countryID"
                                        placeholder="Enter Country ID"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.countryID || ""}
                                        invalid={validation.touched.countryID && validation.errors.countryID ? true : false}
                                    />
                                    {validation.touched.countryID && validation.errors.countryID ? (
                                        <FormFeedback type="invalid">{validation.errors.countryID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="countryName" className="form-label">Country Name <span className="text-danger">*</span></Label>
                                    <Input
                                        name="countryName"
                                        type="text"
                                        className="form-control"
                                        id="countryName"
                                        placeholder="Enter Country Name"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.countryName || ""}
                                        invalid={validation.touched.countryName && validation.errors.countryName ? true : false}
                                    />
                                    {validation.touched.countryName && validation.errors.countryName ? (
                                        <FormFeedback type="invalid">{validation.errors.countryName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="countryPriority" className="form-label">Country Priority <span className="text-danger">*</span></Label>
                                    <Input
                                        name="countryPriority"
                                        type="text"
                                        className="form-control"
                                        id="countryPriority"
                                        placeholder="Enter Country Priority"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.countryPriority !== undefined ? validation.values.countryPriority : ""}
                                        invalid={validation.touched.countryPriority && validation.errors.countryPriority ? true : false}
                                    />
                                    {validation.touched.countryPriority && validation.errors.countryPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.countryPriority}</FormFeedback>
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
                                 Are you sure you want to delete country <strong>{countryToDelete?.countryName || countryToDelete?.CountryName}</strong>?
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
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>Import Country Master Excel</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">Download CountryMaster File Template Format</Label>
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

export default CountryMasterList;
