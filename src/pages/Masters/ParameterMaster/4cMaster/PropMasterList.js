import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getPropMasters, savePropMaster, deletePropMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";

const PropMasterList = () => {
    const { t } = useTranslation();
    const [props, setProps] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [propToDelete, setPropToDelete] = useState(null);

    // Import Modal State
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchProps();
    }, []);

    const fetchProps = async () => {
        setLoading(true);
        try {
            const response = await getPropMasters();
            if (response.success || response.Success) {
                setProps(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Proportion Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch Proportion Master data");
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
    const handleEditClick = (prop) => {
        setIsEdit(true);
        validation.setValues({
            id: prop.id || prop.ID || 0,
            propID: prop.propID || prop.PropID || "",
            propName: prop.propName || prop.PropName || "",
            propPriority: prop.propPriority !== undefined ? prop.propPriority : (prop.PropPriority !== undefined ? prop.PropPriority : ""),
            propGroupName: prop.propGroupName || prop.PropGroupName || "",
            propGroupPriority: prop.propGroupPriority !== undefined ? prop.propGroupPriority : (prop.PropGroupPriority !== undefined ? prop.PropGroupPriority : ""),
            pricingPropID: prop.pricingPropID || prop.PricingPropID || ""
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (prop) => {
        setPropToDelete(prop);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (propToDelete) {
            const id = propToDelete.id || propToDelete.ID;
            try {
                const response = await deletePropMaster(id);
                if (response.success || response.Success) {
                    toast.success("Proportion Deleted Successfully");
                    fetchProps();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete proportion. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete proportion");
            }
            setDeleteModal(false);
            setPropToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            propID: "",
            propName: "",
            propPriority: "",
            propGroupName: "",
            propGroupPriority: "",
            pricingPropID: ""
        },
        validationSchema: Yup.object({
            propID: Yup.string()
                .max(30, "Proportion ID cannot exceed 30 characters")
                .required("Please Enter Proportion ID"),
            propName: Yup.string()
                .max(30, "Proportion Name cannot exceed 30 characters")
                .required("Please Enter Proportion Name"),
            propPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Proportion Priority"),
            propGroupName: Yup.string()
                .nullable()
                .max(50, "Group Name cannot exceed 50 characters"),
            propGroupPriority: Yup.number()
                .nullable()
                .typeError("Group Priority must be a number"),
            pricingPropID: Yup.string()
                .nullable()
                .max(30, "Pricing Proportion ID cannot exceed 30 characters")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    propID: values.propID,
                    propName: values.propName,
                    propPriority: parseFloat(values.propPriority || 0),
                    propGroupName: values.propGroupName || "",
                    propGroupPriority: parseFloat(values.propGroupPriority || 0),
                    pricingPropID: values.pricingPropID || ""
                };

                const response = await savePropMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Proportion Master ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchProps();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save proportion record");
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
            const expectedHeaders = ["Proportion ID", "Proportion Name", "Proportion Priority", "Proportion Group Name", "Proportion Group Priority", "Pricing Proportion ID"];
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

                const propID = String(row[0] || "").trim();
                const propName = String(row[1] || "").trim();

                if (!propID || !propName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Proportion ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Proportion ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const propPriority = parseFloat(row[2] || 0);
                const propGroupName = String(row[3] || "").trim();
                const propGroupPriority = parseFloat(row[4] || 0);
                const pricingPropID = String(row[5] || "").trim();

                const existing = props.find(p => String(p.propID || p.PropID).toLowerCase() === propID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    propID,
                    propName,
                    propPriority,
                    propGroupName,
                    propGroupPriority,
                    pricingPropID
                };

                try {
                    const response = await savePropMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} proportions.`);
            }
            
            fetchProps();
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
        if (props.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Proportion ID", "Proportion Name", "Proportion Priority", "Proportion Group Name", "Proportion Group Priority", "Pricing Proportion ID"];
        const rows = props.map(item => [
            item.propID || item.PropID || "",
            item.propName || item.PropName || "",
            item.propPriority !== undefined ? item.propPriority : (item.PropPriority !== undefined ? item.PropPriority : ""),
            item.propGroupName || item.PropGroupName || "",
            item.propGroupPriority !== undefined ? item.propGroupPriority : (item.PropGroupPriority !== undefined ? item.PropGroupPriority : ""),
            item.pricingPropID || item.PricingPropID || ""
        ]);

        const result = await exportToExcel(headers, rows, "Proportions", "PropMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["Proportion ID", "Proportion Name", "Proportion Priority", "Proportion Group Name", "Proportion Group Priority", "Pricing Proportion ID"];
        const sampleRow = ["EX", "EXCELLENT", "1", "EX", "1", "1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "PropMasterTemplate");
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
                                title={t("Edit Proportion")}
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
                                title={t("Delete Proportion")}
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: t("ID"),
                accessorKey: "propID",
                accessorFn: (row) => row.propID || row.PropID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Name"),
                accessorKey: "propName",
                accessorFn: (row) => row.propName || row.PropName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Priority"),
                accessorKey: "propPriority",
                accessorFn: (row) => row.propPriority !== undefined ? row.propPriority : row.PropPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Group Name"),
                accessorKey: "propGroupName",
                accessorFn: (row) => row.propGroupName || row.PropGroupName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Group Priority"),
                accessorKey: "propGroupPriority",
                accessorFn: (row) => row.propGroupPriority !== undefined ? row.propGroupPriority : row.PropGroupPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Pricing ID"),
                accessorKey: "pricingPropID",
                accessorFn: (row) => row.pricingPropID || row.PricingPropID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        [t]
    );

    document.title = "Proportion Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Proportion Master")} pageTitle={t("Masters")} />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">{t("Proportion Master List")}</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> {t("Add Prop")}ortion
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
                                            data={props}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Search Proportions...")}
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
                    {isEdit ? "Edit Proportion Master" : "Add Proportion Master"}
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
                                    <Label htmlFor="propID" className="form-label">{t("Proportion ID")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="propID"
                                        type="text"
                                        className="form-control"
                                        id="propID"
                                        placeholder={t("Enter Proportion ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.propID || ""}
                                        invalid={validation.touched.propID && validation.errors.propID ? true : false}
                                    />
                                    {validation.touched.propID && validation.errors.propID ? (
                                        <FormFeedback type="invalid">{validation.errors.propID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="propName" className="form-label">{t("Proportion Name")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="propName"
                                        type="text"
                                        className="form-control"
                                        id="propName"
                                        placeholder={t("Enter Proportion Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.propName || ""}
                                        invalid={validation.touched.propName && validation.errors.propName ? true : false}
                                    />
                                    {validation.touched.propName && validation.errors.propName ? (
                                        <FormFeedback type="invalid">{validation.errors.propName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="propPriority" className="form-label">{t("Proportion Priority")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="propPriority"
                                        type="text"
                                        className="form-control"
                                        id="propPriority"
                                        placeholder={t("Enter Proportion Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.propPriority !== undefined ? validation.values.propPriority : ""}
                                        invalid={validation.touched.propPriority && validation.errors.propPriority ? true : false}
                                    />
                                    {validation.touched.propPriority && validation.errors.propPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.propPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="propGroupName" className="form-label">{t("Group Name")}</Label>
                                    <Input
                                        name="propGroupName"
                                        type="text"
                                        className="form-control"
                                        id="propGroupName"
                                        placeholder={t("Enter Proportion Group Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.propGroupName || ""}
                                        invalid={validation.touched.propGroupName && validation.errors.propGroupName ? true : false}
                                    />
                                    {validation.touched.propGroupName && validation.errors.propGroupName ? (
                                        <FormFeedback type="invalid">{validation.errors.propGroupName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="propGroupPriority" className="form-label">{t("Group Priority")}</Label>
                                    <Input
                                        name="propGroupPriority"
                                        type="text"
                                        className="form-control"
                                        id="propGroupPriority"
                                        placeholder={t("Enter Proportion Group Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.propGroupPriority !== undefined ? validation.values.propGroupPriority : ""}
                                        invalid={validation.touched.propGroupPriority && validation.errors.propGroupPriority ? true : false}
                                    />
                                    {validation.touched.propGroupPriority && validation.errors.propGroupPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.propGroupPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="pricingPropID" className="form-label">{t("Pricing ID")}</Label>
                                    <Input
                                        name="pricingPropID"
                                        type="text"
                                        className="form-control"
                                        id="pricingPropID"
                                        placeholder={t("Enter Pricing Proportion ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.pricingPropID || ""}
                                        invalid={validation.touched.pricingPropID && validation.errors.pricingPropID ? true : false}
                                    />
                                    {validation.touched.pricingPropID && validation.errors.pricingPropID ? (
                                        <FormFeedback type="invalid">{validation.errors.pricingPropID}</FormFeedback>
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
                                Are you sure you want to delete proportion <strong>{propToDelete?.propName || propToDelete?.PropName}</strong>?
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
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>{t("Import Proportion Master Excel")}</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download PropMaster File Template Format")}</Label>
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

export default PropMasterList;
