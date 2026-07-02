import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getPolishMasters, savePolishMaster, deletePolishMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";

const PolishMasterList = () => {
    const { t } = useTranslation();
    const [polishes, setPolishes] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [polishToDelete, setPolishToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchPolishes();
    }, []);

    const fetchPolishes = async () => {
        setLoading(true);
        try {
            const response = await getPolishMasters();
            if (response.success || response.Success) {
                setPolishes(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Polish Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch Polish Master data");
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
    const handleEditClick = (polish) => {
        setIsEdit(true);
        validation.setValues({
            id: polish.id || polish.ID || 0,
            polishID: polish.polishID || polish.PolishID || "",
            polishName: polish.polishName || polish.PolishName || "",
            polishPriority: polish.polishPriority !== undefined ? polish.polishPriority : (polish.PolishPriority !== undefined ? polish.PolishPriority : ""),
            polishGroupName: polish.polishGroupName || polish.PolishGroupName || "",
            polishGroupPriority: polish.polishGroupPriority !== undefined ? polish.polishGroupPriority : (polish.PolishGroupPriority !== undefined ? polish.PolishGroupPriority : ""),
            pricingPolishID: polish.pricingPolishID || polish.PricingPolishID || ""
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (polish) => {
        setPolishToDelete(polish);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (polishToDelete) {
            const id = polishToDelete.id || polishToDelete.ID;
            try {
                const response = await deletePolishMaster(id);
                if (response.success || response.Success) {
                    toast.success("Polish Deleted Successfully");
                    fetchPolishes();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete polish. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete polish");
            }
            setDeleteModal(false);
            setPolishToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            polishID: "",
            polishName: "",
            polishPriority: "",
            polishGroupName: "",
            polishGroupPriority: "",
            pricingPolishID: ""
        },
        validationSchema: Yup.object({
            polishID: Yup.string()
                .max(30, "Polish ID cannot exceed 30 characters")
                .required("Please Enter Polish ID"),
            polishName: Yup.string()
                .max(30, "Polish Name cannot exceed 30 characters")
                .required("Please Enter Polish Name"),
            polishPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Polish Priority"),
            polishGroupName: Yup.string()
                .nullable()
                .max(50, "Group Name cannot exceed 50 characters"),
            polishGroupPriority: Yup.number()
                .nullable()
                .typeError("Group Priority must be a number"),
            pricingPolishID: Yup.string()
                .nullable()
                .max(30, "Pricing Polish ID cannot exceed 30 characters")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    polishID: values.polishID,
                    polishName: values.polishName,
                    polishPriority: parseFloat(values.polishPriority || 0),
                    polishGroupName: values.polishGroupName || "",
                    polishGroupPriority: parseFloat(values.polishGroupPriority || 0),
                    pricingPolishID: values.pricingPolishID || ""
                };

                const response = await savePolishMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Polish Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchPolishes();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save polish record");
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
            const expectedHeaders = ["Polish ID", "Polish Name", "Polish Priority", "Polish Group Name", "Polish Group Priority", "Pricing Polish ID"];
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

                const polishID = String(row[0] || "").trim();
                const polishName = String(row[1] || "").trim();

                if (!polishID || !polishName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Polish ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Polish ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const polishPriority = parseFloat(row[2] || 0);
                const polishGroupName = String(row[3] || "").trim();
                const polishGroupPriority = parseFloat(row[4] || 0);
                const pricingPolishID = String(row[5] || "").trim();

                const existing = polishes.find(p => String(p.polishID || p.PolishID).toLowerCase() === polishID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    polishID,
                    polishName,
                    polishPriority,
                    polishGroupName,
                    polishGroupPriority,
                    pricingPolishID
                };

                try {
                    const response = await savePolishMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} polishes.`);
            }
            
            fetchPolishes();
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
        if (polishes.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Polish ID", "Polish Name", "Polish Priority", "Polish Group Name", "Polish Group Priority", "Pricing Polish ID"];
        const rows = polishes.map(item => [
            item.polishID || item.PolishID || "",
            item.polishName || item.PolishName || "",
            item.polishPriority !== undefined ? item.polishPriority : (item.PolishPriority !== undefined ? item.PolishPriority : ""),
            item.polishGroupName || item.PolishGroupName || "",
            item.polishGroupPriority !== undefined ? item.polishGroupPriority : (item.PolishGroupPriority !== undefined ? item.PolishGroupPriority : ""),
            item.pricingPolishID || item.PricingPolishID || ""
        ]);

        const result = await exportToExcel(headers, rows, "Polishes", "PolishMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["Polish ID", "Polish Name", "Polish Priority", "Polish Group Name", "Polish Group Priority", "Pricing Polish ID"];
        const sampleRow = ["EX", "EXCELLENT", "1", "EX", "1", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "PolishMasterTemplate");
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
                                title={t("Edit Polish")}
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
                                title={t("Delete Polish")}
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: t("ID"),
                accessorKey: "polishID",
                accessorFn: (row) => row.polishID || row.PolishID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Name"),
                accessorKey: "polishName",
                accessorFn: (row) => row.polishName || row.PolishName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Priority"),
                accessorKey: "polishPriority",
                accessorFn: (row) => row.polishPriority !== undefined ? row.polishPriority : row.PolishPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Group Name"),
                accessorKey: "polishGroupName",
                accessorFn: (row) => row.polishGroupName || row.PolishGroupName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Group Priority"),
                accessorKey: "polishGroupPriority",
                accessorFn: (row) => row.polishGroupPriority !== undefined ? row.polishGroupPriority : row.PolishGroupPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Pricing ID"),
                accessorKey: "pricingPolishID",
                accessorFn: (row) => row.pricingPolishID || row.PricingPolishID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        [t]
    );

    document.title = `${t("Polish Master")} | ${t("Admin")}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Polish Master")} pageTitle={t("Masters")} />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">{t("Polish Master List")}</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> {t("Add Polish")}
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
                                            data={polishes}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Search Polishes...")}
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
                    {isEdit ? t("Edit Polish Master") : t("Add Polish Master")}
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
                                    <Label htmlFor="polishID" className="form-label">{t("Polish ID")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="polishID"
                                        type="text"
                                        className="form-control"
                                        id="polishID"
                                        placeholder={t("Enter Polish ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.polishID || ""}
                                        invalid={validation.touched.polishID && validation.errors.polishID ? true : false}
                                    />
                                    {validation.touched.polishID && validation.errors.polishID ? (
                                        <FormFeedback type="invalid">{validation.errors.polishID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="polishName" className="form-label">{t("Polish Name")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="polishName"
                                        type="text"
                                        className="form-control"
                                        id="polishName"
                                        placeholder={t("Enter Polish Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.polishName || ""}
                                        invalid={validation.touched.polishName && validation.errors.polishName ? true : false}
                                    />
                                    {validation.touched.polishName && validation.errors.polishName ? (
                                        <FormFeedback type="invalid">{validation.errors.polishName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="polishPriority" className="form-label">{t("Polish Priority")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="polishPriority"
                                        type="text"
                                        className="form-control"
                                        id="polishPriority"
                                        placeholder={t("Enter Polish Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.polishPriority !== undefined ? validation.values.polishPriority : ""}
                                        invalid={validation.touched.polishPriority && validation.errors.polishPriority ? true : false}
                                    />
                                    {validation.touched.polishPriority && validation.errors.polishPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.polishPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="polishGroupName" className="form-label">{t("Group Name")}</Label>
                                    <Input
                                        name="polishGroupName"
                                        type="text"
                                        className="form-control"
                                        id="polishGroupName"
                                        placeholder={t("Enter Polish Group Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.polishGroupName || ""}
                                        invalid={validation.touched.polishGroupName && validation.errors.polishGroupName ? true : false}
                                    />
                                    {validation.touched.polishGroupName && validation.errors.polishGroupName ? (
                                        <FormFeedback type="invalid">{validation.errors.polishGroupName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="polishGroupPriority" className="form-label">{t("Group Priority")}</Label>
                                    <Input
                                        name="polishGroupPriority"
                                        type="text"
                                        className="form-control"
                                        id="polishGroupPriority"
                                        placeholder={t("Enter Polish Group Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.polishGroupPriority !== undefined ? validation.values.polishGroupPriority : ""}
                                        invalid={validation.touched.polishGroupPriority && validation.errors.polishGroupPriority ? true : false}
                                    />
                                    {validation.touched.polishGroupPriority && validation.errors.polishGroupPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.polishGroupPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="pricingPolishID" className="form-label">{t("Pricing ID")}</Label>
                                    <Input
                                        name="pricingPolishID"
                                        type="text"
                                        className="form-control"
                                        id="pricingPolishID"
                                        placeholder={t("Enter Pricing Polish ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.pricingPolishID || ""}
                                        invalid={validation.touched.pricingPolishID && validation.errors.pricingPolishID ? true : false}
                                    />
                                    {validation.touched.pricingPolishID && validation.errors.pricingPolishID ? (
                                        <FormFeedback type="invalid">{validation.errors.pricingPolishID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button type="button" color="light" onClick={() => setFormModal(false)}>{t("Cancel")}</Button>
                        <Button type="submit" color="primary">{isEdit ? t("Update") : t("Save")}</Button>
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
                                {t("Are you sure you want to delete polish")} <strong>{polishToDelete?.polishName || polishToDelete?.PolishName}</strong>?
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
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>{t("Import Polish Master Excel")}</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download PolishMaster File Template Format")}</Label>
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

export default PolishMasterList;
