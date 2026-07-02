import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, CardHeader, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getHAMasters, saveHAMaster, deleteHAMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";

const HAMasterList = () => {
    const { t } = useTranslation();

    document.title = `${t("HA Master")} | ${t("Admin")}`;

    const [haList, setHaList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [deleteModal, setDeleteModal] = useState(false);
    const [haToDelete, setHaToDelete] = useState(null);

    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchHAMaster();
    }, []);

    const fetchHAMaster = async () => {
        setLoading(true);
        try {
            const response = await getHAMasters();
            if (response.success || response.Success) {
                setHaList(response.data || response.Data || []);
            } else {
                toast.error(response.message || "Failed to load HA Master");
            }
        } catch (e) {
            toast.error("Unable to load HA Master");
        }
        setLoading(false);
    };

    const handleAddClick = () => {
        setIsEdit(false);
        validation.resetForm();
        setFormModal(true);
    };

    const handleEditClick = (ha) => {
        setIsEdit(true);
        validation.setValues({
            id: ha.id || ha.ID || 0,
            haID: ha.haID || ha.HAID || "",
            haName: ha.haName || ha.HAName || "",
            haPriority: ha.haPriority !== undefined ? ha.haPriority : ha.HAPriority,
            haGroupName: ha.haGroupName || ha.HAGroupName || "",
            haGroupPriority: ha.haGroupPriority !== undefined ? ha.haGroupPriority : ha.HAGroupPriority,
            pricingHAID: ha.pricingHAID || ha.PricingHAID || ""
        });
        setFormModal(true);
    };

    const handleDeleteClick = (ha) => {
        setHaToDelete(ha);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!haToDelete) return;
        const id = haToDelete.id || haToDelete.ID;
        try {
            const response = await deleteHAMaster(id);
            if (response.success || response.Success) {
                toast.success("HA Deleted Successfully");
                fetchHAMaster();
            } else {
                toast.error(
                    response.message ||
                    response.Message ||
                    "Unable to delete HA."
                );
            }
        } catch (e) {
            toast.error("Unable to delete HA.");
        }
        setDeleteModal(false);
        setHaToDelete(null);
    };

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            haID: "",
            haName: "",
            haPriority: "",
            haGroupName: "",
            haGroupPriority: "",
            pricingHAID: ""
        },
        validationSchema: Yup.object({
            haID: Yup.string().required("Please Enter HA ID"),
            haName: Yup.string().required("Please Enter HA Name"),
            haPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter HA Priority"),
            haGroupName: Yup.string(),
            haGroupPriority: Yup.number().nullable(),
            pricingHAID: Yup.string()
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    haID: values.haID,
                    haName: values.haName,
                    haPriority: Number(values.haPriority),
                    haGroupName: values.haGroupName,
                    haGroupPriority: Number(values.haGroupPriority || 0),
                    pricingHAID: values.pricingHAID
                };

                const response = await saveHAMaster(payload);
                if (response.success || response.Success) {
                    toast.success("HA Master Saved Successfully");
                    setFormModal(false);
                    validation.resetForm();
                    fetchHAMaster();
                } else {
                    toast.error(
                        response.message ||
                        response.Message ||
                        "Unable to save HA Master"
                    );
                }
            } catch {
                toast.error("Unable to save HA Master");
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
            const expectedHeaders = ["HA ID", "HA Name", "HA Priority", "HA Group Name", "HA Group Priority", "Pricing HA ID"];
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

                const haID = String(row[0] || "").trim();
                const haName = String(row[1] || "").trim();

                if (!haID || !haName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing HA ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing HA ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const haPriority = parseFloat(row[2] || 0);
                const haGroupName = String(row[3] || "").trim();
                const haGroupPriority = parseFloat(row[4] || 0);
                const pricingHAID = String(row[5] || "").trim();

                const existing = haList.find(x => String(x.haID || x.HAID).toLowerCase() === haID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    haID,
                    haName,
                    haPriority,
                    haGroupName,
                    haGroupPriority,
                    pricingHAID
                };

                try {
                    const response = await saveHAMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} HA.`);
            }
            
            fetchHAMaster();
            setImportModal(false);
            setSelectedFile(null);
        } catch (error) {
            toast.error("Failed to parse file: " + error.message);
        } finally {
            setImporting(false);
        }
    };

    const handleExport = async () => {
        if (haList.length === 0) {
            toast.warning("No data found.");
            return;
        }

        const headers = [
            "HA ID",
            "HA Name",
            "HA Priority",
            "HA Group Name",
            "HA Group Priority",
            "Pricing HA ID"
        ];

        const rows = haList.map(x => [
            x.haID || x.HAID,
            x.haName || x.HAName,
            x.haPriority || x.HAPriority,
            x.haGroupName || x.HAGroupName,
            x.haGroupPriority || x.HAGroupPriority,
            x.pricingHAID || x.PricingHAID
        ]);

        await exportToExcel(
            headers,
            rows,
            "HAMaster",
            "HAMasterList"
        );
    };

    const handleDownloadTemplate = async () => {
        const headers = [
            "HA ID",
            "HA Name",
            "HA Priority",
            "HA Group Name",
            "HA Group Priority",
            "Pricing HA ID"
        ];

        const sampleRow = [
            "H001",
            "HA1",
            "1",
            "HA GROUP",
            "1",
            "PH001"
        ];

        const result = await exportToExcel(
            headers,
            [sampleRow],
            "Template",
            "HAMasterTemplate"
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
                            title={t("Edit HA")}
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
                            title={t("Delete HA")}
                        >
                            <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                        </button>
                    </div>
                );
            }
        },
        {
            header: t("ID"),
            accessorFn: row => row.haID || row.HAID
        },
        {
            header: t("Name"),
            accessorFn: row => row.haName || row.HAName
        },
        {
            header: t("Priority"),
            accessorFn: row => row.haPriority || row.HAPriority
        },
        {
            header: t("Group Name"),
            accessorFn: row => row.haGroupName || row.HAGroupName
        },
        {
            header: t("Group Priority"),
            accessorFn: row => row.haGroupPriority || row.HAGroupPriority
        },
        {
            header: t("Pricing ID"),
            accessorFn: row => row.pricingHAID || row.PricingHAID
        }
    ], [haList]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("HA Master")} pageTitle={t("Masters")} />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center justify-content-between">
                                    <h5 className="card-title mb-0 flex-grow-1">{t("HA List")}</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> {t("Add HA")}
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
                                            data={haList}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            SearchPlaceholder={t("Search HA...")}
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
                        {isEdit ? t("Edit HA Master") : t("Add HA Master")}
                    </ModalHeader>
                    <ModalBody>
                        <Row className="gy-3">
                            <Col md={12}>
                                <Label className="form-label">{t("HA ID")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="haID"
                                    type="text"
                                    placeholder={t("Enter HA ID")}
                                    value={validation.values.haID}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.haID && validation.errors.haID ? true : false}
                                />
                                <FormFeedback>{validation.errors.haID}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("HA Name")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="haName"
                                    type="text"
                                    placeholder={t("Enter HA Name")}
                                    value={validation.values.haName}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.haName && validation.errors.haName ? true : false}
                                />
                                <FormFeedback>{validation.errors.haName}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("HA Priority")} <span className="text-danger">*</span></Label>
                                <Input
                                    name="haPriority"
                                    type="number"
                                    placeholder={t("Enter HA Priority")}
                                    value={validation.values.haPriority}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.haPriority && validation.errors.haPriority ? true : false}
                                />
                                <FormFeedback>{validation.errors.haPriority}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("HA Group Name")}</Label>
                                <Input
                                    name="haGroupName"
                                    type="text"
                                    placeholder={t("Enter HA Group Name")}
                                    value={validation.values.haGroupName}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("HA Group Priority")}</Label>
                                <Input
                                    name="haGroupPriority"
                                    type="number"
                                    placeholder={t("Enter HA Group Priority")}
                                    value={validation.values.haGroupPriority}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">{t("Pricing HA ID")}</Label>
                                <Input
                                    name="pricingHAID"
                                    type="text"
                                    placeholder={t("Enter Pricing HA ID")}
                                    value={validation.values.pricingHAID}
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
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>{t("Import HA Master Excel")}</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">{t("Download HA Master File Template Format")}</Label>
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
                                {t("Are you sure you want to delete HA")} <strong>{haToDelete?.haID || haToDelete?.haName}</strong>?
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

export default HAMasterList;
