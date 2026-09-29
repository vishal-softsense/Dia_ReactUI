import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getJewSubCategoryMasters, saveJewSubCategoryMaster, deleteJewSubCategoryMaster, getJewCategoryMasters } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";

const JewSubCategoryMasterList = () => {
    const { t } = useTranslation();
    const [subCategories, setSubCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modals State
    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [subCategoryToDelete, setSubCategoryToDelete] = useState(null);

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
            const catResponse = await getJewCategoryMasters();
            let catList = [];
            if (catResponse.success || catResponse.Success) {
                catList = catResponse.data || catResponse.Data || [];
                setCategories(catList);
            }

            const response = await getJewSubCategoryMasters();
            if (response.success || response.Success) {
                setSubCategories(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Jewellery SubCategory data");
            }
        } catch (error) {
            toast.error("Failed to fetch initial data");
        }
        setLoading(false);
    };

    // Helper to get Category Name/ID by its DB ID
    const getCategoryCode = (catId) => {
        const cat = categories.find(c => (c.id || c.ID) === catId);
        return cat ? (cat.categoryID || cat.CategoryID) : catId;
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
            subCategoryID: val.subCategoryID || val.SubCategoryID || "",
            subCategoryName: val.subCategoryName || val.SubCategoryName || "",
            subCategoryPriority: val.subCategoryPriority !== undefined ? val.subCategoryPriority : (val.SubCategoryPriority !== undefined ? val.SubCategoryPriority : ""),
            categoryID: val.categoryID || val.CategoryID || ""
        });
        setFormModal(true);
    };

    // Open Delete Modal
    const handleDeleteClick = (val) => {
        setSubCategoryToDelete(val);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (subCategoryToDelete) {
            const id = subCategoryToDelete.id || subCategoryToDelete.ID;
            try {
                const response = await deleteJewSubCategoryMaster(id);
                if (response.success || response.Success) {
                    toast.success("Jewellery SubCategory Deleted Successfully");
                    fetchInitialData();
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to delete subcategory. It might be in use.");
                }
            } catch (error) {
                toast.error("Failed to delete subcategory");
            }
            setDeleteModal(false);
            setSubCategoryToDelete(null);
        }
    };

    // Validation configuration
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            subCategoryID: "",
            subCategoryName: "",
            subCategoryPriority: "",
            categoryID: ""
        },
        validationSchema: Yup.object({
            subCategoryID: Yup.string()
                .max(30, "SubCategory ID cannot exceed 30 characters")
                .required("Please Enter SubCategory ID"),
            subCategoryName: Yup.string()
                .max(30, "SubCategory Name cannot exceed 30 characters")
                .required("Please Enter SubCategory Name"),
            subCategoryPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter SubCategory Priority"),
            categoryID: Yup.string().required("Please Select Category")
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    subCategoryID: values.subCategoryID,
                    subCategoryName: values.subCategoryName,
                    subCategoryPriority: parseFloat(values.subCategoryPriority || 0),
                    categoryID: parseInt(values.categoryID)
                };

                const response = await saveJewSubCategoryMaster(payload);
                if (response.success || response.Success) {
                    toast.success(`Jewellery SubCategory ${isEdit ? "Updated" : "Saved"} Successfully`);
                    fetchInitialData();
                    setFormModal(false);
                } else {
                    toast.error(response.data || response.message || response.Message || "Failed to save record");
                }
            } catch (error) {
                toast.error("Failed to save subcategory record");
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
            const expectedHeaders = ["SubCategory ID", "SubCategory Name", "SubCategory Priority", "Category ID"];
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

                const subCategoryID = String(row[0] || "").trim();
                const subCategoryName = String(row[1] || "").trim();
                const categoryCode = String(row[3] || "").trim(); // Let's expect: SubCategoryID, SubCategoryName, SubCategoryPriority, CategoryID

                if (!subCategoryID || !subCategoryName || !categoryCode) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing SubCategory ID, Name or Category ID`);
                    console.warn(`Row ${i + 2} skipped: Missing fields. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const subCategoryPriority = parseFloat(row[2] || 0);

                // Find Category DB ID by Code
                const matchCategory = categories.find(c => String(c.categoryID || c.CategoryID).toLowerCase() === categoryCode.toLowerCase());
                if (!matchCategory) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Category Code '${categoryCode}' not found in Category Master`);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const categoryID = matchCategory.id || matchCategory.ID;
                const existing = subCategories.find(s => String(s.subCategoryID || s.SubCategoryID).toLowerCase() === subCategoryID.toLowerCase());
                
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    subCategoryID,
                    subCategoryName,
                    subCategoryPriority,
                    categoryID
                };

                try {
                    const response = await saveJewSubCategoryMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} subcategories.`);
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
        if (subCategories.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["SubCategory ID", "SubCategory Name", "SubCategory Priority", "Category ID"];
        const rows = subCategories.map(item => [
            item.subCategoryID || item.SubCategoryID || "",
            item.subCategoryName || item.SubCategoryName || "",
            item.subCategoryPriority !== undefined ? item.subCategoryPriority : (item.SubCategoryPriority !== undefined ? item.SubCategoryPriority : ""),
            getCategoryCode(item.categoryID || item.CategoryID)
        ]);

        const result = await exportToExcel(headers, rows, "JewSubCategory", "JewSubCategoryMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Template Download Handler
    const handleDownloadTemplate = async () => {
        const headers = ["SubCategory ID", "SubCategory Name", "SubCategory Priority", "Category ID"];
        const sampleRow = ["SUBCAT1", "SubCategory 1", "1", categories[0]?.categoryID || categories[0]?.CategoryID || "CAT1"];

        const result = await exportToExcel(headers, [sampleRow], "Template", "JewSubCategoryMasterTemplate");
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
                accessorKey: "subCategoryID",
                accessorFn: (row) => row.subCategoryID || row.SubCategoryID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Name"),
                accessorKey: "subCategoryName",
                accessorFn: (row) => row.subCategoryName || row.SubCategoryName,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: t("Priority"),
                accessorKey: "subCategoryPriority",
                accessorFn: (row) => row.subCategoryPriority !== undefined ? row.subCategoryPriority : row.SubCategoryPriority,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Category",
                accessorKey: "categoryID",
                accessorFn: (row) => getCategoryCode(row.categoryID || row.CategoryID),
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        [subCategories, categories]
    );

    document.title = `${t("Jewellery SubCategory Master")} | ${t("Admin")}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Jewellery SubCategory Master")} pageTitle={t("Masters")} />

                    <Row>
                        <Col lg={12}>
                            <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                                <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
                                    <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary d-flex align-items-center gap-2">
                                        <i className="ri-sparkling-2-line fs-20 text-primary"></i>
                                        {t("Jewellery SubCategory List")}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn rounded-3 d-inline-flex align-items-center gap-1" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom"></i> {t("Add SubCategory")}
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
                                            data={subCategories}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Search SubCategories...")}
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
                    <span className="text-white fw-bold">{isEdit ? t("Edit Jewellery SubCategory") : t("Add Jewellery SubCategory")}</span>
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
                                    <Label htmlFor="subCategoryID" className="form-label">{t("SubCategory ID")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="subCategoryID"
                                        type="text"
                                        className="form-control"
                                        id="subCategoryID"
                                        placeholder={t("Enter SubCategory ID")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.subCategoryID || ""}
                                        invalid={validation.touched.subCategoryID && validation.errors.subCategoryID ? true : false}
                                    />
                                    {validation.touched.subCategoryID && validation.errors.subCategoryID ? (
                                        <FormFeedback type="invalid">{validation.errors.subCategoryID}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="subCategoryName" className="form-label">{t("SubCategory Name")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="subCategoryName"
                                        type="text"
                                        className="form-control"
                                        id="subCategoryName"
                                        placeholder={t("Enter SubCategory Name")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.subCategoryName || ""}
                                        invalid={validation.touched.subCategoryName && validation.errors.subCategoryName ? true : false}
                                    />
                                    {validation.touched.subCategoryName && validation.errors.subCategoryName ? (
                                        <FormFeedback type="invalid">{validation.errors.subCategoryName}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="subCategoryPriority" className="form-label">{t("SubCategory Priority")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="subCategoryPriority"
                                        type="text"
                                        className="form-control"
                                        id="subCategoryPriority"
                                        placeholder={t("Enter SubCategory Priority")}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.subCategoryPriority !== undefined ? validation.values.subCategoryPriority : ""}
                                        invalid={validation.touched.subCategoryPriority && validation.errors.subCategoryPriority ? true : false}
                                    />
                                    {validation.touched.subCategoryPriority && validation.errors.subCategoryPriority ? (
                                        <FormFeedback type="invalid">{validation.errors.subCategoryPriority}</FormFeedback>
                                    ) : null}
                                </div>
                            </Col>

                            <Col md={12}>
                                <div>
                                    <Label htmlFor="categoryID" className="form-label">{t("Category")} <span className="text-danger">*</span></Label>
                                    <Input
                                        name="categoryID"
                                        type="select"
                                        className="form-select"
                                        id="categoryID"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.categoryID || ""}
                                        invalid={validation.touched.categoryID && validation.errors.categoryID ? true : false}
                                    >
                                        <option value="" disabled>{t("Select Category")}</option>
                                        {categories.map((c) => (
                                            <option key={c.id || c.ID} value={c.id || c.ID}>
                                                {c.categoryID || c.CategoryID}
                                            </option>
                                        ))}
                                    </Input>
                                    {validation.touched.categoryID && validation.errors.categoryID ? (
                                        <FormFeedback type="invalid">{validation.errors.categoryID}</FormFeedback>
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
                                {t("Are you sure you want to delete subcategory")} <strong>{subCategoryToDelete?.subCategoryName || subCategoryToDelete?.SubCategoryName}</strong>?
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
                    <span className="text-white fw-bold">{t("Import Jewellery SubCategory Excel")}</span>
                </ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download JewSubCategoryMaster File Template Format")}</Label>
                        <div>
                            <Button color="primary" onClick={handleDownloadTemplate} size="sm" className="rounded-3">
                                <i className="ri-download-2-line align-bottom me-1"></i>{t("Download Format")}</Button>
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

export default JewSubCategoryMasterList;
