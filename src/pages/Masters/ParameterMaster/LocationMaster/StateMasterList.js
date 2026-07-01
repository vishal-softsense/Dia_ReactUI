import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getStateMasters, saveStateMaster, deleteStateMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";

const StateMasterList = () => {
    const { t } = useTranslation();
    const [states, setStates] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [stateToDelete, setStateToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchStates();
    }, []);

    const fetchStates = async () => {
        setLoading(true);
        try {
            const response = await getStateMasters();
            if (response.success || response.Success) {
                setStates(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch State Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch State Master data");
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
    const handleEditClick = (state) => {
        setIsEdit(true);
        validation.setValues({
            id: state.id || state.ID || 0,
            stateID: state.stateID || state.StateID || "",
            stateName: state.stateName || state.StateName || "",
            statePriority: state.statePriority !== undefined ? state.statePriority : (state.StatePriority !== undefined ? state.StatePriority : "")
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (state) => {
        setStateToDelete(state);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (stateToDelete) {
            const id = stateToDelete.id || stateToDelete.ID;
            try {
                const response = await deleteStateMaster(id);
                if (response.success || response.Success) {
                    toast.success("State Deleted Successfully");
                    fetchStates();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete state. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete state");
            }
            setDeleteModal(false);
            setStateToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            stateID: "",
            stateName: "",
            statePriority: ""
        },
        validationSchema: Yup.object({
            stateID: Yup.string()
                .max(30, "State ID cannot exceed 30 characters")
                .required("Please Enter State ID"),
            stateName: Yup.string()
                .max(30, "State Name cannot exceed 30 characters")
                .required("Please Enter State Name"),
            statePriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter State Priority")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    stateID: values.stateID,
                    stateName: values.stateName,
                    statePriority: parseFloat(values.statePriority || 0)
                };

                const response = await saveStateMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`State Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchStates();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save state record");
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
            const expectedHeaders = ["State ID", "State Name", "State Priority"];
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

                const stateID = String(row[0] || "").trim();
                const stateName = String(row[1] || "").trim();

                if (!stateID || !stateName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing State ID or Name`);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const statePriority = parseFloat(row[2] || 0);

                const existing = states.find(s => String(s.stateID || s.StateID).toLowerCase() === stateID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    stateID,
                    stateName,
                    statePriority
                };

                try {
                    const response = await saveStateMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} states.`);
            }
            
            fetchStates();
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
        if (states.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["State ID", "State Name", "State Priority"];
        const rows = states.map(item => [
            item.stateID || item.StateID || "",
            item.stateName || item.StateName || "",
            item.statePriority !== undefined ? item.statePriority : (item.StatePriority !== undefined ? item.StatePriority : "")
        ]);

        const result = await exportToExcel(headers, rows, "States", "StateMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["State ID", "State Name", "State Priority"];
        const sampleRow = ["NY", "New York", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "StateMasterTemplate");
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
                                title={t("Edit State")}
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
                                title={t("Delete State")}
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: "State ID",
                accessorKey: "stateID",
                accessorFn: (row) => row.stateID || row.StateID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "State Name",
                accessorKey: "stateName",
                accessorFn: (row) => row.stateName || row.StateName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "State Priority",
                accessorKey: "statePriority",
                accessorFn: (row) => row.statePriority !== undefined ? row.statePriority : row.StatePriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        []
    );

    document.title = "State Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("State Master")} pageTitle="Masters" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">{t("State Master List")}</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> Add State
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
                                            data={states}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Search States...")}
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
                    {isEdit ? "Edit State Master" : "Add State Master"}
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
                                    <Label htmlFor="stateID" className="form-label">{t("State ID")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="stateID"
                                        type="text"
                                        className="form-control"
                                        id="stateID"
                                        placeholder={t("Enter State ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.stateID || ""}
                                        invalid={validation.touched.stateID && validation.errors.stateID ? true : false}
                                    />
                                    {validation.touched.stateID && validation.errors.stateID ? (
                                        <FormFeedback type="invalid">{validation.errors.stateID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="stateName" className="form-label">{t("State Name")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="stateName"
                                        type="text"
                                        className="form-control"
                                        id="stateName"
                                        placeholder={t("Enter State Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.stateName || ""}
                                        invalid={validation.touched.stateName && validation.errors.stateName ? true : false}
                                    />
                                    {validation.touched.stateName && validation.errors.stateName ? (
                                        <FormFeedback type="invalid">{validation.errors.stateName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="statePriority" className="form-label">{t("State Priority")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="statePriority"
                                        type="text"
                                        className="form-control"
                                        id="statePriority"
                                        placeholder={t("Enter State Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.statePriority !== undefined ? validation.values.statePriority : ""}
                                        invalid={validation.touched.statePriority && validation.errors.statePriority ? true : false}
                                    />
                                    {validation.touched.statePriority && validation.errors.statePriority ? (
                                        <FormFeedback type="invalid">{validation.errors.statePriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button type="button" color="light" onClick={() => setFormModal(false)}>{t("Cancel")}</Button>
                        <Button type="submit" color="primary">{isEdit ? "Update" : "Save"}</Button>
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
                                 Are you sure you want to delete state <strong>{stateToDelete?.stateName || stateToDelete?.StateName}</strong>?
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
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>{t("Import State Master Excel")}</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download StateMaster File Template Format")}</Label>
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

export default StateMasterList;
