import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getSizeMasters, saveSizeMaster, deleteSizeMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";

const SizeMasterList = () => {
    const { t } = useTranslation();
    const [sizes, setSizes] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [sizeToDelete, setSizeToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchSizes();
    }, []);

    const fetchSizes = async () => {
        setLoading(true);
        try {
            const response = await getSizeMasters();
            if (response.success || response.Success) {
                setSizes(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Size Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch Size Master data");
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
    const handleEditClick = (size) => {
        setIsEdit(true);
        validation.setValues({
            id: size.id || size.ID || 0,
            sizeID: size.sizeID || size.SizeID || "",
            sizeName: size.sizeName || size.SizeName || "",
            fCarat: size.fCarat !== undefined ? size.fCarat : (size.FCarat !== undefined ? size.FCarat : ""),
            tCarat: size.tCarat !== undefined ? size.tCarat : (size.TCarat !== undefined ? size.TCarat : ""),
            sizePriority: size.sizePriority !== undefined ? size.sizePriority : (size.SizePriority !== undefined ? size.SizePriority : ""),
            sizeGroupName: size.sizeGroupName || size.SizeGroupName || "",
            sizeGroupPriority: size.sizeGroupPriority !== undefined ? size.sizeGroupPriority : (size.SizeGroupPriority !== undefined ? size.SizeGroupPriority : "")
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (size) => {
        setSizeToDelete(size);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (sizeToDelete) {
            const id = sizeToDelete.id || sizeToDelete.ID;
            try {
                const response = await deleteSizeMaster(id);
                if (response.success || response.Success) {
                    toast.success("Size Deleted Successfully");
                    fetchSizes();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete size. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete size");
            }
            setDeleteModal(false);
            setSizeToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            sizeID: "",
            sizeName: "",
            fCarat: "",
            tCarat: "",
            sizePriority: "",
            sizeGroupName: "",
            sizeGroupPriority: ""
        },
        validationSchema: Yup.object({
            sizeID: Yup.string()
                .max(30, "Size ID cannot exceed 30 characters")
                .required("Please Enter Size ID"),
            sizeName: Yup.string()
                .max(30, "Size Name cannot exceed 30 characters")
                .required("Please Enter Size Name"),
            fCarat: Yup.string()
                .required("Please Enter From Carat"),
            tCarat: Yup.string()
                .required("Please Enter To Carat"),
            sizePriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Size Priority"),
            sizeGroupName: Yup.string()
                .max(50, "Group Name cannot exceed 50 characters")
                .required("Please Enter Size Group Name"),
            sizeGroupPriority: Yup.number()
                .typeError("Group Priority must be a number")
                .required("Please Enter Size Group Priority")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    sizeID: values.sizeID,
                    sizeName: values.sizeName,
                    fCarat: String(values.fCarat || ""),
                    tCarat: String(values.tCarat || ""),
                    sizePriority: parseFloat(values.sizePriority || 0),
                    sizeGroupName: values.sizeGroupName || "",
                    sizeGroupPriority: parseFloat(values.sizeGroupPriority || 0)
                };

                const response = await saveSizeMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Size Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchSizes();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save size record");
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
            const expectedHeaders = ["Size ID", "Size Name", "From Carat", "To Carat", "Size Priority", "Size Group Name", "Size Group Priority"];
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

                const sizeID = String(row[0] || "").trim();
                const sizeName = String(row[1] || "").trim();

                if (!sizeID || !sizeName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Size ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Size ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const fCarat = String(row[2] || "").trim();
                const tCarat = String(row[3] || "").trim();
                const sizePriority = parseFloat(row[4] || 0);
                const sizeGroupName = String(row[5] || "").trim();
                const sizeGroupPriority = parseFloat(row[6] || 0);

                const existing = sizes.find(s => String(s.sizeID || s.SizeID).toLowerCase() === sizeID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    sizeID,
                    sizeName,
                    fCarat,
                    tCarat,
                    sizePriority,
                    sizeGroupName,
                    sizeGroupPriority
                };

                try {
                    const response = await saveSizeMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} sizes.`);
            }
            
            fetchSizes();
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
        if (sizes.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Size ID", "Size Name", "From Carat", "To Carat", "Size Priority", "Size Group Name", "Size Group Priority"];
        const rows = sizes.map(item => [
            item.sizeID || item.SizeID || "",
            item.sizeName || item.SizeName || "",
            item.fCarat !== undefined ? item.fCarat : (item.FCarat !== undefined ? item.FCarat : ""),
            item.tCarat !== undefined ? item.tCarat : (item.TCarat !== undefined ? item.TCarat : ""),
            item.sizePriority !== undefined ? item.sizePriority : (item.SizePriority !== undefined ? item.SizePriority : ""),
            item.sizeGroupName || item.SizeGroupName || "",
            item.sizeGroupPriority !== undefined ? item.sizeGroupPriority : (item.SizeGroupPriority !== undefined ? item.SizeGroupPriority : "")
        ]);

        const result = await exportToExcel(headers, rows, "Sizes", "SizeMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["Size ID", "Size Name", "From Carat", "To Carat", "Size Priority", "Size Group Name", "Size Group Priority"];
        const sampleRow = ["0.30", "0.30-0.39", "0.30", "0.39", "1", "0.30-0.99", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "SizeMasterTemplate");
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
                accessorKey: "sizeID",
                accessorFn: (row) => row.sizeID || row.SizeID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Name"),
                accessorKey: "sizeName",
                accessorFn: (row) => row.sizeName || row.SizeName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "From Carat",
                accessorKey: "fCarat",
                accessorFn: (row) => row.fCarat !== undefined ? row.fCarat : row.FCarat,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "To Carat",
                accessorKey: "tCarat",
                accessorFn: (row) => row.tCarat !== undefined ? row.tCarat : row.TCarat,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Priority"),
                accessorKey: "sizePriority",
                accessorFn: (row) => row.sizePriority !== undefined ? row.sizePriority : row.SizePriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Group Name"),
                accessorKey: "sizeGroupName",
                accessorFn: (row) => row.sizeGroupName || row.SizeGroupName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Group Priority"),
                accessorKey: "sizeGroupPriority",
                accessorFn: (row) => row.sizeGroupPriority !== undefined ? row.sizeGroupPriority : row.SizeGroupPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        [t]
    );

    document.title = `${t("Size Master")} | ${t("Admin")}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Size Master")} pageTitle={t("Masters")} />

                    <Row>
                        <Col lg={12}>
                            <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                                <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
                                    <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary d-flex align-items-center gap-2">
                                        <i className="ri-focus-3-line fs-20 text-primary"></i>
                                        {t("Size Master List")}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn rounded-3 d-inline-flex align-items-center gap-1" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom"></i> {t("Add Size")}
                                        </Button>
                                        <Button color="soft-success" className="btn-soft-success rounded-3 d-inline-flex align-items-center gap-1" onClick={() => setImportModal(true)} title={t("Import Excel")}>
                                            <i className="ri-file-excel-line"></i> {t("Import Excel")}
                                        </Button>
                                        <Button className="btn-soft-success rounded-3" onClick={handleExportData} title={t("Export to Excel")} style={{ height: "37.5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                            <i className="ri-file-excel-2-line fs-18"></i>
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
                                            data={sizes}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Search Sizes...")}
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
                <ModalHeader toggle={() => setFormModal(false)} className="bg-primary p-3 border-0">
                    <span className="text-white fw-bold">{isEdit ? t("Edit Size Master") : t("Add Size Master")}</span>
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
                                    <Label htmlFor="sizeID" className="form-label">{t("Size ID")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="sizeID"
                                        type="text"
                                        className="form-control"
                                        id="sizeID"
                                        placeholder={t("Enter Size ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.sizeID || ""}
                                        invalid={validation.touched.sizeID && validation.errors.sizeID ? true : false}
                                    />
                                    {validation.touched.sizeID && validation.errors.sizeID ? (
                                        <FormFeedback type="invalid">{validation.errors.sizeID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="sizeName" className="form-label">{t("Size Name")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="sizeName"
                                        type="text"
                                        className="form-control"
                                        id="sizeName"
                                        placeholder={t("Enter Size Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.sizeName || ""}
                                        invalid={validation.touched.sizeName && validation.errors.sizeName ? true : false}
                                    />
                                    {validation.touched.sizeName && validation.errors.sizeName ? (
                                        <FormFeedback type="invalid">{validation.errors.sizeName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="fCarat" className="form-label">{t("From Carat")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="fCarat"
                                        type="text"
                                        className="form-control"
                                        id="fCarat"
                                        placeholder={t("Enter From Carat")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.fCarat || ""}
                                        invalid={validation.touched.fCarat && validation.errors.fCarat ? true : false}
                                    />
                                    {validation.touched.fCarat && validation.errors.fCarat ? (
                                        <FormFeedback type="invalid">{validation.errors.fCarat}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="tCarat" className="form-label">{t("To Carat")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="tCarat"
                                        type="text"
                                        className="form-control"
                                        id="tCarat"
                                        placeholder={t("Enter To Carat")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.tCarat || ""}
                                        invalid={validation.touched.tCarat && validation.errors.tCarat ? true : false}
                                    />
                                    {validation.touched.tCarat && validation.errors.tCarat ? (
                                        <FormFeedback type="invalid">{validation.errors.tCarat}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="sizePriority" className="form-label">{t("Size Priority")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="sizePriority"
                                        type="text"
                                        className="form-control"
                                        id="sizePriority"
                                        placeholder={t("Enter Size Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.sizePriority !== undefined ? validation.values.sizePriority : ""}
                                        invalid={validation.touched.sizePriority && validation.errors.sizePriority ? true : false}
                                    />
                                    {validation.touched.sizePriority && validation.errors.sizePriority ? (
                                        <FormFeedback type="invalid">{validation.errors.sizePriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="sizeGroupName" className="form-label">{t("Group Name")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="sizeGroupName"
                                        type="text"
                                        className="form-control"
                                        id="sizeGroupName"
                                        placeholder={t("Enter Size Group Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.sizeGroupName || ""}
                                        invalid={validation.touched.sizeGroupName && validation.errors.sizeGroupName ? true : false}
                                    />
                                    {validation.touched.sizeGroupName && validation.errors.sizeGroupName ? (
                                        <FormFeedback type="invalid">{validation.errors.sizeGroupName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="sizeGroupPriority" className="form-label">{t("Group Priority")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="sizeGroupPriority"
                                        type="text"
                                        className="form-control"
                                        id="sizeGroupPriority"
                                        placeholder={t("Enter Size Group Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.sizeGroupPriority !== undefined ? validation.values.sizeGroupPriority : ""}
                                        invalid={validation.touched.sizeGroupPriority && validation.errors.sizeGroupPriority ? true : false}
                                    />
                                    {validation.touched.sizeGroupPriority && validation.errors.sizeGroupPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.sizeGroupPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button type="button" color="light" className="rounded-3" onClick={() => setFormModal(false)}>{t("Cancel")}</Button>
                        <Button type="submit" color="primary" className="rounded-3">{isEdit ? t("Update") : t("Save")}</Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
                <ModalHeader toggle={() => setDeleteModal(false)} className="bg-danger p-3 border-0">
                    <span className="text-white fw-bold">{t("Confirm Delete")}</span>
                </ModalHeader>
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
                                {t("Are you sure you want to delete size")} <strong>{sizeToDelete?.sizeName || sizeToDelete?.SizeName}</strong>?
                            </p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <Button type="button" color="light" className="w-sm rounded-3" onClick={() => setDeleteModal(false)}>{t("Cancel")}</Button>
                        <Button type="button" color="danger" className="w-sm rounded-3" onClick={handleDeleteConfirm}>{t("Yes, Delete It!")}</Button>
                    </div>
                </ModalBody>
            </Modal>

            {/* Import Excel Modal */}
            <Modal isOpen={importModal} toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }} centered>
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }} className="bg-primary p-3 border-0">
                    <span className="text-white fw-bold">{t("Import Size Master Excel")}</span>
                </ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download SizeMaster File Template Format")}</Label>
                        <div>
                            <Button color="primary" onClick={handleDownloadTemplate} size="sm" className="rounded-3">
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
                    <Button color="light" className="rounded-3" onClick={() => { setImportModal(false); setSelectedFile(null); }} disabled={importing}>{t("Close")}</Button>
                    <Button color="primary" className="rounded-3" onClick={processImportFile} disabled={importing || !selectedFile}>{t("Submit")}</Button>
                </ModalFooter>
            </Modal>
            <ToastContainer autoClose={2000} />
        </React.Fragment>
    );
};

export default SizeMasterList;
