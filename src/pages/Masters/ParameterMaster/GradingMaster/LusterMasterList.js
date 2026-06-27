import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, CardHeader, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getLusterMasters, saveLusterMaster, deleteLusterMaster } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";

const LusterMasterList = () => {

    document.title = "Luster Master";

    const [lusterList, setLusterList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formModal, setFormModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [deleteModal, setDeleteModal] = useState(false);
    const [lusterToDelete, setLusterToDelete] = useState(null);

    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchLusterMaster();
    }, []);

    const fetchLusterMaster = async () => {
        setLoading(true);
        try {
            const response = await getLusterMasters();
            if (response.success || response.Success) {
                setLusterList(response.data || response.Data || []);
            } else {
                toast.error(response.message || "Failed to load Luster Master");
            }
        } catch (e) {
            toast.error("Unable to load Luster Master");
        }
        setLoading(false);
    };

    const handleAddClick = () => {
        setIsEdit(false);
        validation.resetForm();
        setFormModal(true);
    };

    const handleEditClick = (luster) => {
        setIsEdit(true);
        validation.setValues({
            id: luster.id || luster.ID || 0,
            lusterID: luster.lusterID || luster.LusterID || "",
            lusterName: luster.lusterName || luster.LusterName || "",
            lusterPriority: luster.lusterPriority !== undefined ? luster.lusterPriority : luster.LusterPriority,
            lusterGroupName: luster.lusterGroupName || luster.LusterGroupName || "",
            lusterGroupPriority: luster.lusterGroupPriority !== undefined ? luster.lusterGroupPriority : luster.LusterGroupPriority,
            pricingLusterID: luster.pricingLusterID || luster.PricingLusterID || ""
        });
        setFormModal(true);
    };

    const handleDeleteClick = (luster) => {
        setLusterToDelete(luster);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!lusterToDelete) return;
        const id = lusterToDelete.id || lusterToDelete.ID;
        try {
            const response = await deleteLusterMaster(id);
            if (response.success || response.Success) {
                toast.success("Luster Deleted Successfully");
                fetchLusterMaster();
            } else {
                toast.error(
                    response.message ||
                    response.Message ||
                    "Unable to delete Luster."
                );
            }
        } catch (e) {
            toast.error("Unable to delete Luster.");
        }
        setDeleteModal(false);
        setLusterToDelete(null);
    };

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: 0,
            lusterID: "",
            lusterName: "",
            lusterPriority: "",
            lusterGroupName: "",
            lusterGroupPriority: "",
            pricingLusterID: ""
        },
        validationSchema: Yup.object({
            lusterID: Yup.string().required("Please Enter Luster ID"),
            lusterName: Yup.string().required("Please Enter Luster Name"),
            lusterPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Luster Priority"),
            lusterGroupName: Yup.string(),
            lusterGroupPriority: Yup.number().nullable(),
            pricingLusterID: Yup.string()
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    lusterID: values.lusterID,
                    lusterName: values.lusterName,
                    lusterPriority: Number(values.lusterPriority),
                    lusterGroupName: values.lusterGroupName,
                    lusterGroupPriority: Number(values.lusterGroupPriority || 0),
                    pricingLusterID: values.pricingLusterID
                };

                const response = await saveLusterMaster(payload);
                if (response.success || response.Success) {
                    toast.success("Luster Master Saved Successfully");
                    setFormModal(false);
                    validation.resetForm();
                    fetchLusterMaster();
                } else {
                    toast.error(
                        response.message ||
                        response.Message ||
                        "Unable to save Luster Master"
                    );
                }
            } catch {
                toast.error("Unable to save Luster Master");
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
            const expectedHeaders = ["Luster ID", "Luster Name", "Luster Priority", "Luster Group Name", "Luster Group Priority", "Pricing Luster ID"];
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

                const lusterID = String(row[0] || "").trim();
                const lusterName = String(row[1] || "").trim();

                if (!lusterID || !lusterName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Luster ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Luster ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const lusterPriority = parseFloat(row[2] || 0);
                const lusterGroupName = String(row[3] || "").trim();
                const lusterGroupPriority = parseFloat(row[4] || 0);
                const pricingLusterID = String(row[5] || "").trim();

                const existing = lusterList.find(x => String(x.lusterID || x.LusterID).toLowerCase() === lusterID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    lusterID,
                    lusterName,
                    lusterPriority,
                    lusterGroupName,
                    lusterGroupPriority,
                    pricingLusterID
                };

                try {
                    const response = await saveLusterMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} Luster.`);
            }
            
            fetchLusterMaster();
            setImportModal(false);
            setSelectedFile(null);
        } catch (error) {
            toast.error("Failed to parse file: " + error.message);
        } finally {
            setImporting(false);
        }
    };

    const handleExport = async () => {
        if (lusterList.length === 0) {
            toast.warning("No data found.");
            return;
        }

        const headers = [
            "Luster ID",
            "Luster Name",
            "Luster Priority",
            "Luster Group Name",
            "Luster Group Priority",
            "Pricing Luster ID"
        ];

        const rows = lusterList.map(x => [
            x.lusterID || x.LusterID,
            x.lusterName || x.LusterName,
            x.lusterPriority || x.LusterPriority,
            x.lusterGroupName || x.LusterGroupName,
            x.lusterGroupPriority || x.LusterGroupPriority,
            x.pricingLusterID || x.PricingLusterID
        ]);

        await exportToExcel(
            headers,
            rows,
            "LusterMaster",
            "LusterMasterList"
        );
    };

    const handleDownloadTemplate = async () => {
        const headers = [
            "Luster ID",
            "Luster Name",
            "Luster Priority",
            "Luster Group Name",
            "Luster Group Priority",
            "Pricing Luster ID"
        ];

        const sampleRow = [
            "L001",
            "EXCELLENT",
            "1",
            "LUSTER GROUP",
            "1",
            "PL001"
        ];

        const result = await exportToExcel(
            headers,
            [sampleRow],
            "Template",
            "LusterMasterTemplate"
        );

        if (!result.success) {
            toast.error("Failed to download template.");
        }
    };

    const columns = useMemo(() => [
        {
            header: "Actions",
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
                            title="Edit Luster"
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
                            title="Delete Luster"
                        >
                            <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                        </button>
                    </div>
                );
            }
        },
        {
            header: "ID",
            accessorFn: row => row.lusterID || row.LusterID
        },
        {
            header: "Name",
            accessorFn: row => row.lusterName || row.LusterName
        },
        {
            header: "Priority",
            accessorFn: row => row.lusterPriority || row.LusterPriority
        },
        {
            header: "Group Name",
            accessorFn: row => row.lusterGroupName || row.LusterGroupName
        },
        {
            header: "Group Priority",
            accessorFn: row => row.lusterGroupPriority || row.LusterGroupPriority
        },
        {
            header: "Pricing ID",
            accessorFn: row => row.pricingLusterID || row.PricingLusterID
        }
    ], [lusterList]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Luster Master" pageTitle="Masters" />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center justify-content-between">
                                    <h5 className="card-title mb-0 flex-grow-1">Luster List</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" className="add-btn" onClick={handleAddClick}>
                                            <i className="ri-add-line align-bottom me-1"></i> Add Luster
                                        </Button>
                                        <Button color="soft-success" onClick={() => setImportModal(true)}>
                                            Import Excel
                                        </Button>
                                        <Button
                                            className="btn-soft-success"
                                            onClick={handleExport}
                                            title="Export Excel"
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
                                            data={lusterList}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            SearchPlaceholder="Search Luster..."
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
                        {isEdit ? "Edit Luster Master" : "Add Luster Master"}
                    </ModalHeader>
                    <ModalBody>
                        <Row className="gy-3">
                            <Col md={12}>
                                <Label className="form-label">Luster ID <span className="text-danger">*</span></Label>
                                <Input
                                    name="lusterID"
                                    type="text"
                                    placeholder="Enter Luster ID"
                                    value={validation.values.lusterID}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.lusterID && validation.errors.lusterID ? true : false}
                                />
                                <FormFeedback>{validation.errors.lusterID}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">Luster Name <span className="text-danger">*</span></Label>
                                <Input
                                    name="lusterName"
                                    type="text"
                                    placeholder="Enter Luster Name"
                                    value={validation.values.lusterName}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.lusterName && validation.errors.lusterName ? true : false}
                                />
                                <FormFeedback>{validation.errors.lusterName}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">Luster Priority <span className="text-danger">*</span></Label>
                                <Input
                                    name="lusterPriority"
                                    type="number"
                                    placeholder="Enter Luster Priority"
                                    value={validation.values.lusterPriority}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.lusterPriority && validation.errors.lusterPriority ? true : false}
                                />
                                <FormFeedback>{validation.errors.lusterPriority}</FormFeedback>
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">Luster Group Name</Label>
                                <Input
                                    name="lusterGroupName"
                                    type="text"
                                    placeholder="Enter Luster Group Name"
                                    value={validation.values.lusterGroupName}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">Luster Group Priority</Label>
                                <Input
                                    name="lusterGroupPriority"
                                    type="number"
                                    placeholder="Enter Luster Group Priority"
                                    value={validation.values.lusterGroupPriority}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                            <Col md={12}>
                                <Label className="form-label">Pricing Luster ID</Label>
                                <Input
                                    name="pricingLusterID"
                                    type="text"
                                    placeholder="Enter Pricing Luster ID"
                                    value={validation.values.pricingLusterID}
                                    onChange={validation.handleChange}
                                />
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" type="button" onClick={() => setFormModal(false)}>Cancel</Button>
                        <Button color="primary" type="submit">Save</Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Import Excel Modal */}
            <Modal isOpen={importModal} toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }} centered>
                <ModalHeader toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>Import Luster Master Excel</ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label className="form-label">Download Luster Master File Template Format</Label>
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
                                Are you sure you want to delete Luster <strong>{lusterToDelete?.lusterID || lusterToDelete?.lusterName}</strong>?
                            </p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <Button type="button" color="light" className="w-sm" onClick={() => setDeleteModal(false)}>Cancel</Button>
                        <Button type="button" color="danger" className="w-sm" onClick={handleDeleteConfirm}>Yes, Delete It!</Button>
                    </div>
                </ModalBody>
            </Modal>
            <ToastContainer closeButton={false} limit={1} />
        </React.Fragment>
    );
};

export default LusterMasterList;
