import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getMinesMasters, saveMinesMaster, deleteMinesMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";

const MinesMasterList = () => {
    const { t } = useTranslation();
    const [mines, setMines] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [minesToDelete, setMinesToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchMines();
    }, []);

    const fetchMines = async () => {
        setLoading(true);
        try {
            const response = await getMinesMasters();
            if (response.success || response.Success) {
                setMines(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Mines Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch Mines Master data");
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
    const handleEditClick = (minesVal) => {
        setIsEdit(true);
        validation.setValues({
            id: minesVal.id || minesVal.ID || 0,
            minesID: minesVal.minesID || minesVal.MinesID || "",
            minesName: minesVal.minesName || minesVal.MinesName || "",
            minesPriority: minesVal.minesPriority !== undefined ? minesVal.minesPriority : (minesVal.MinesPriority !== undefined ? minesVal.MinesPriority : "")
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (minesVal) => {
        setMinesToDelete(minesVal);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (minesToDelete) {
            const id = minesToDelete.id || minesToDelete.ID;
            try {
                const response = await deleteMinesMaster(id);
                if (response.success || response.Success) {
                    toast.success("Mines Deleted Successfully");
                    fetchMines();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete mines. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete mines");
            }
            setDeleteModal(false);
            setMinesToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            minesID: "",
            minesName: "",
            minesPriority: ""
        },
        validationSchema: Yup.object({
            minesID: Yup.string()
                .max(50, "Mines ID cannot exceed 50 characters")
                .required("Please Enter Mines ID"),
            minesName: Yup.string()
                .max(50, "Mines Name cannot exceed 50 characters")
                .required("Please Enter Mines Name"),
            minesPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Mines Priority")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    minesID: values.minesID,
                    minesName: values.minesName,
                    minesPriority: parseFloat(values.minesPriority || 0)
                };

                const response = await saveMinesMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Mines Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchMines();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save mines record");
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
            const expectedHeaders = ["Mines ID", "Mines Name", "Mines Priority"];
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

                const minesID = String(row[0] || "").trim();
                const minesName = String(row[1] || "").trim();

                if (!minesID || !minesName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Mines ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Mines ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const minesPriority = parseFloat(row[2] || 0);

                const existing = mines.find(m => String(m.minesID || m.MinesID).toLowerCase() === minesID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    minesID,
                    minesName,
                    minesPriority
                };

                try {
                    const response = await saveMinesMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} mines.`);
            }
            
            fetchMines();
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
        if (mines.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Mines ID", "Mines Name", "Mines Priority"];
        const rows = mines.map(item => [
            item.minesID || item.MinesID || "",
            item.minesName || item.MinesName || "",
            item.minesPriority !== undefined ? item.minesPriority : (item.MinesPriority !== undefined ? item.MinesPriority : "")
        ]);

        const result = await exportToExcel(headers, rows, "Mines", "MinesMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["Mines ID", "Mines Name", "Mines Priority"];
        const sampleRow = ["M1", "MINE 1", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "MinesMasterTemplate");
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
                                title={t("Edit Mines")}
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
                                title={t("Delete Mines")}
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: "ID",
                accessorKey: "minesID",
                accessorFn: (row) => row.minesID || row.MinesID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Name",
                accessorKey: "minesName",
                accessorFn: (row) => row.minesName || row.MinesName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Priority",
                accessorKey: "minesPriority",
                accessorFn: (row) => row.minesPriority !== undefined ? row.minesPriority : row.MinesPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        []
    );

    document.title = "Mines Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Mines Master")} pageTitle="Masters" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">{t("Mines Master List")}</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> Add Mines
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
                                            data={mines}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Search Mines...")}
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
                    {isEdit ? "Edit Mines Master" : "Add Mines Master"}
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
                                    <Label htmlFor="minesID" className="form-label">{t("Mines ID")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="minesID"
                                        type="text"
                                        className="form-control"
                                        id="minesID"
                                        placeholder={t("Enter Mines ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.minesID || ""}
                                        invalid={validation.touched.minesID && validation.errors.minesID ? true : false}
                                    />
                                    {validation.touched.minesID && validation.errors.minesID ? (
                                        <FormFeedback type="invalid">{validation.errors.minesID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="minesName" className="form-label">{t("Mines Name")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="minesName"
                                        type="text"
                                        className="form-control"
                                        id="minesName"
                                        placeholder={t("Enter Mines Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.minesName || ""}
                                        invalid={validation.touched.minesName && validation.errors.minesName ? true : false}
                                    />
                                    {validation.touched.minesName && validation.errors.minesName ? (
                                        <FormFeedback type="invalid">{validation.errors.minesName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="minesPriority" className="form-label">{t("Mines Priority")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="minesPriority"
                                        type="text"
                                        className="form-control"
                                        id="minesPriority"
                                        placeholder={t("Enter Mines Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.minesPriority !== undefined ? validation.values.minesPriority : ""}
                                        invalid={validation.touched.minesPriority && validation.errors.minesPriority ? true : false}
                                    />
                                    {validation.touched.minesPriority && validation.errors.minesPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.minesPriority}</FormFeedback>
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
                                Are you sure you want to delete mines <strong>{minesToDelete?.minesName || minesToDelete?.MinesName}</strong>?
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
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>{t("Import Mines Master Excel")}</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download MinesMaster File Template Format")}</Label>
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

export default MinesMasterList;
