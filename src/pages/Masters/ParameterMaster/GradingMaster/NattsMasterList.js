import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, CardHeader, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getNattsMasters, saveNattsMaster, deleteNattsMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";

const NattsMasterList = () => {
    const { t } = useTranslation();

    document.title = `${t("Natts Master")} | ${t("Admin")}`;

    const [nattsList, setNattsList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [deleteModal, setDeleteModal] = useState(false);
    const [nattsToDelete, setNattsToDelete] = useState(null);

    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchNattsMaster();
    }, []);

    const fetchNattsMaster = async () => {
        setLoading(true);
        try {
            const response = await getNattsMasters();
            if (response.success || response.Success) {
                setNattsList(response.data || response.Data || []);
            } else {
                toast.error(response.message || "Failed to load Natts Master");
            }
        } catch (e) {
            toast.error("Unable to load Natts Master");
        }
        setLoading(false);
    };

    const handleAddClick = () => {
        setIsEdit(false);
        validation.resetForm();
        setFormModal(true);
    };

    const handleEditClick = (natts) => {
        setIsEdit(true);
        validation.setValues({
            id: natts.id || natts.ID || 0,
            nattsID: natts.nattsID || natts.NattsID || "",
            nattsName: natts.nattsName || natts.NattsName || "",
            nattsPriority: natts.nattsPriority !== undefined ? natts.nattsPriority : natts.NattsPriority,
            nattsGroupName: natts.nattsGroupName || natts.NattsGroupName || "",
            nattsGroupPriority: natts.nattsGroupPriority !== undefined ? natts.nattsGroupPriority : natts.NattsGroupPriority,
            pricingNattsID: natts.pricingNattsID || natts.PricingNattsID || ""
        });
        setFormModal(true);
    };

    const handleDeleteClick = (natts) => {
        setNattsToDelete(natts);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!nattsToDelete) return;
        const id = nattsToDelete.id || nattsToDelete.ID;
        try {
            const response = await deleteNattsMaster(id);
            if (response.success || response.Success) {
                toast.success("Natts Deleted Successfully");
                fetchNattsMaster();
            } else {
                toast.error(
                    response.message ||
                    response.Message ||
                    "Unable to delete Natts."
                );
            }
        } catch (e) {
            toast.error("Unable to delete Natts.");
        }
        setDeleteModal(false);
        setNattsToDelete(null);
    };

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            nattsID: "",
            nattsName: "",
            nattsPriority: "",
            nattsGroupName: "",
            nattsGroupPriority: "",
            pricingNattsID: ""
        },
        validationSchema: Yup.object({
            nattsID: Yup.string().required("Please Enter Natts ID"),
            nattsName: Yup.string().required("Please Enter Natts Name"),
            nattsPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Natts Priority"),
            nattsGroupName: Yup.string(),
            nattsGroupPriority: Yup.number().nullable(),
            pricingNattsID: Yup.string()
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    nattsID: values.nattsID,
                    nattsName: values.nattsName,
                    nattsPriority: Number(values.nattsPriority),
                    nattsGroupName: values.nattsGroupName,
                    nattsGroupPriority: Number(values.nattsGroupPriority || 0),
                    pricingNattsID: values.pricingNattsID
                };

                const response = await saveNattsMaster(payload);
                if (response.success || response.Success) {
                    toast.success("Natts Master Saved Successfully");
                    setFormModal(false);
                    validation.resetForm();
                    fetchNattsMaster();
                } else {
                    toast.error(
                        response.message ||
                        response.Message ||
                        "Unable to save Natts Master"
                    );
                }
            } catch {
                toast.error("Unable to save Natts Master");
            }
        }
    });

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
            const expectedHeaders = ["Natts ID", "Natts Name", "Natts Priority", "Natts Group Name", "Natts Group Priority", "Pricing Natts ID"];
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

                const nattsID = String(row[0] || "").trim();
                const nattsName = String(row[1] || "").trim();

                if (!nattsID || !nattsName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Natts ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Natts ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const nattsPriority = parseFloat(row[2] || 0);
                const nattsGroupName = String(row[3] || "").trim();
                const nattsGroupPriority = parseFloat(row[4] || 0);
                const pricingNattsID = String(row[5] || "").trim();

                const existing = nattsList.find(x => String(x.nattsID || x.NattsID).toLowerCase() === nattsID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    nattsID,
                    nattsName,
                    nattsPriority,
                    nattsGroupName,
                    nattsGroupPriority,
                    pricingNattsID
                };

                try {
                    const response = await saveNattsMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} Natts.`);
            }
            
            fetchNattsMaster();
            setImportModal(false);
            setSelectedFile(null);
        } catch (error) {
            toast.error("Failed to parse file: " + error.message);
        } finally {
            setImporting(false);
        }
    };

    const handleExport = async () => {
        if (nattsList.length === 0) {
            toast.warning("No data found.");
            return;
        }

        const headers = [
            "Natts ID",
            "Natts Name",
            "Natts Priority",
            "Natts Group Name",
            "Natts Group Priority",
            "Pricing Natts ID"
        ];

        const rows = nattsList.map(x => [
            x.nattsID || x.NattsID,
            x.nattsName || x.NattsName,
            x.nattsPriority || x.NattsPriority,
            x.nattsGroupName || x.NattsGroupName,
            x.nattsGroupPriority || x.NattsGroupPriority,
            x.pricingNattsID || x.PricingNattsID
        ]);

        await exportToExcel(
            headers,
            rows,
            "NattsMaster",
            "NattsMasterList"
        );
    };

    const handleDownloadTemplate = async () => {
        const headers = [
            "Natts ID",
            "Natts Name",
            "Natts Priority",
            "Natts Group Name",
            "Natts Group Priority",
            "Pricing Natts ID"
        ];

        const sampleRow = [
            "N001",
            "N1",
            "1",
            "NATTS GROUP",
            "1",
            "PN001"
        ];

        const result = await exportToExcel(
            headers,
            [sampleRow],
            "Template",
            "NattsMasterTemplate"
        );

        if (!result.success) {
            toast.error("Failed to download template.");
        }
    };

    const columns = useMemo(() => [
        {
            header: t("Actions"),
            id: "actions",
            enableColumnFilter: false,
            cell: (cellProps) => {
                const row = cellProps.row.original;
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
                            onClick={() => handleEditClick(row)}
                            title={t("Edit Natts")}
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
                            onClick={() => handleDeleteClick(row)}
                            title={t("Delete Natts")}
                        >
                            <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                        </button>
                    </div>
                );
            }
        },
        {
            header: t("ID"),
            accessorFn: row => row.nattsID || row.NattsID
        },
        {
            header: t("Name"),
            accessorFn: row => row.nattsName || row.NattsName
        },
        {
            header: t("Priority"),
            accessorFn: row => row.nattsPriority || row.NattsPriority
        },
        {
            header: t("Group Name"),
            accessorFn: row => row.nattsGroupName || row.NattsGroupName
        },
        {
            header: t("Group Priority"),
            accessorFn: row => row.nattsGroupPriority || row.NattsGroupPriority
        },
        {
            header: t("Pricing ID"),
            accessorFn: row => row.pricingNattsID || row.PricingNattsID
        }
    ], [nattsList]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Natts Master")} pageTitle={t("Masters")} />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center justify-content-between">
                                    <h5 className="card-title mb-0 flex-grow-1">{t("Natts List")}</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> {t("Add Natts")}
                                        </Button>
                                        <Button color="soft-success" onClick={() => setImportModal(true)}>{t("Import Excel")}</Button>
                                        <Button
                                            className="btn-soft-success"
                                            onClick={handleExport}
                                            title={t("Export Excel")}
                                            style={{
                                                height: "37.5px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >
                                            <i className="ri-file-excel-2-line" style={{ fontSize: "25px" }}></i>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {loading ? (
                                        <div className="text-center">
                                            <div className="spinner-border text-primary"></div>
                                        </div>
                                    ) : (
                                        <TableContainer
                                            columns={columns}
                                            data={nattsList}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            SearchPlaceholder={t("Search Natts...")}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                        />
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            <Modal isOpen={formModal} toggle={() => setFormModal(false)} centered>
                <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
                    <ModalHeader toggle={() => setFormModal(false)}>
                        {isEdit ? t("Edit Natts Master") : t("Add Natts Master")}
                    </ModalHeader>
                    <ModalBody>
                        <Row className="gy-3">
                            <Col md={12}>
                                <Label className="form-label">{t("Natts ID")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="nattsID"
                                    type="text"
                                    placeholder={t("Enter Natts ID")}
                                    value={validation.values.nattsID}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.nattsID && validation.errors.nattsID ? true : false}
                                />
                                <FormFeedback>{validation.errors.nattsID}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Natts Name")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="nattsName"
                                    type="text"
                                    placeholder={t("Enter Natts Name")}
                                    value={validation.values.nattsName}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.nattsName && validation.errors.nattsName ? true : false}
                                />
                                <FormFeedback>{validation.errors.nattsName}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Natts Priority")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="nattsPriority"
                                    type="number"
                                    placeholder={t("Enter Natts Priority")}
                                    value={validation.values.nattsPriority}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.nattsPriority && validation.errors.nattsPriority ? true : false}
                                />
                                <FormFeedback>{validation.errors.nattsPriority}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Natts Group Name")}</Label>
                                <Input
                                    name="nattsGroupName"
                                    type="text"
                                    placeholder={t("Enter Natts Group Name")}
                                    value={validation.values.nattsGroupName}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Natts Group Priority")}</Label>
                                <Input
                                    name="nattsGroupPriority"
                                    type="number"
                                    placeholder={t("Enter Natts Group Priority")}
                                    value={validation.values.nattsGroupPriority}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Pricing Natts ID")}</Label>
                                <Input
                                    name="pricingNattsID"
                                    type="text"
                                    placeholder={t("Enter Pricing Natts ID")}
                                    value={validation.values.pricingNattsID}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" type="button" onClick={() => setFormModal(false)}>{t("Cancel")}</Button>
                        <Button color="primary" type="submit">{t("Save")}</Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Import Excel Modal */}
            <Modal isOpen={importModal} toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }} centered>
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>{t("Import Natts Master Excel")}</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download Natts Master File Template Format")}</Label>
                        <div>
                            <Button color="primary" onClick={handleDownloadTemplate} size="sm">
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
                    <Button color="light" onClick={() => { setImportModal(false); setSelectedFile(null); }} disabled={importing}>{t("Close")}</Button>
                    <Button color="primary" onClick={processImportFile} disabled={importing || !selectedFile}>{t("Submit")}</Button>
                </ModalFooter>
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
                                {t("Are you sure you want to delete Natts")} <strong>{nattsToDelete?.nattsID || nattsToDelete?.nattsName}</strong>?
                            </p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <Button type="button" color="light" className="w-sm" onClick={() => setDeleteModal(false)}>{t("Cancel")}</Button>
                        <Button type="button" color="danger" className="w-sm" onClick={handleDeleteConfirm}>{t("Yes, Delete It!")}</Button>
                    </div>
                </ModalBody>
            </Modal>
            <ToastContainer closeButton={false} limit={1} />
        </React.Fragment>
    );
};

export default NattsMasterList;
