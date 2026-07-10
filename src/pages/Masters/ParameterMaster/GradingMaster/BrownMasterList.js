import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, CardHeader, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Progress } from "reactstrap";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getBrownMasters, saveBrownMaster,deleteBrownMaster  } from "../../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";

const BrownMasterList = () => {
    const { t } = useTranslation();

    document.title = `${t("Brown Master")} | ${t("Admin")}`;

    const [brownList, setBrownList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formModal, setFormModal] = useState(false);
const [isEdit, setIsEdit] = useState(false);

const [deleteModal, setDeleteModal] = useState(false);

const [brownToDelete, setBrownToDelete] = useState(null);
    const [importModal, setImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [selectedFile, setSelectedFile] = useState(null);
    useEffect(() => {
        fetchBrownMaster();
    }, []);

    const fetchBrownMaster = async () => {

        setLoading(true);

        try {

            const response = await getBrownMasters();

            if (response.success || response.Success) {
                setBrownList(response.data || response.Data || []);
            }
            else {
                toast.error(response.message || "Failed to load Brown Master");
            }

        } catch (e) {

            toast.error("Unable to load Brown Master");

        }

        setLoading(false);
    };

    const handleAddClick = () => {
        setIsEdit(false);
        validation.resetForm();
        setFormModal(true);
    };

    const handleEditClick = (brown) => {

    setIsEdit(true);

    validation.setValues({

        id: brown.id || brown.ID || 0,

        brownID: brown.brownID || brown.BrownID || "",

        brownName: brown.brownName || brown.BrownName || "",

        brownPriority:
            brown.brownPriority !== undefined
                ? brown.brownPriority
                : brown.BrownPriority,

        brownGroupName:
            brown.brownGroupName || brown.BrownGroupName || "",

        brownGroupPriority:
            brown.brownGroupPriority !== undefined
                ? brown.brownGroupPriority
                : brown.BrownGroupPriority,

        pricingBrownID:
            brown.pricingBrownID || brown.PricingBrownID || ""

    });

    setFormModal(true);

};

const handleDeleteClick = (brown) => {

    setBrownToDelete(brown);

    setDeleteModal(true);

};

const handleDeleteConfirm = async () => {

    if (!brownToDelete) return;

    const id = brownToDelete.id || brownToDelete.ID;

    try {

        const response = await deleteBrownMaster(id);

        if (response.success || response.Success) {

            toast.success("Brown Deleted Successfully");

            fetchBrownMaster();

        }
        else {

            toast.error(
                response.message ||
                response.Message ||
                "Unable to delete Brown."
            );

        }

    } catch {

        toast.error("Unable to delete Brown.");

    }

    setDeleteModal(false);

    setBrownToDelete(null);

};

    const validation = useFormik({
        enableReinitialize: true,

        initialValues: {
            id: 0,
            brownID: "",
            brownName: "",
            brownPriority: "",
            brownGroupName: "",
            brownGroupPriority: "",
            pricingBrownID: ""
        },

        validationSchema: Yup.object({
            brownID: Yup.string()
                .required("Please Enter Brown ID"),

            brownName: Yup.string()
                .required("Please Enter Brown Name"),

            brownPriority: Yup.number()
                .typeError("Priority must be a number")
                .required("Please Enter Brown Priority"),

            brownGroupName: Yup.string(),

            brownGroupPriority: Yup.number()
                .nullable(),

            pricingBrownID: Yup.string()
        }),

        onSubmit: async (values) => {

            try {

                const payload = {

                    id: values.id,

                    brownID: values.brownID,

                    brownName: values.brownName,

                    brownPriority: Number(values.brownPriority),

                    brownGroupName: values.brownGroupName,

                    brownGroupPriority: Number(values.brownGroupPriority || 0),

                    pricingBrownID: values.pricingBrownID

                };

                const response = await saveBrownMaster(payload);

                if (response.success || response.Success) {

                    toast.success("Brown Master Saved Successfully");

                    setFormModal(false);

                    validation.resetForm();

                    fetchBrownMaster();

                }
                else {

                    toast.error(
                        response.message ||
                        response.Message ||
                        "Unable to save Brown Master"
                    );

                }

            }
            catch {

                toast.error("Unable to save Brown Master");

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

        const fileExtension = file.name.split('.').pop().toLowerCase();

        try {
            const expectedHeaders = ["Brown ID", "Brown Name", "Brown Priority", "Brown Group Name", "Brown Group Priority", "Pricing Brown ID"];
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

                const brownID = String(row[0] || "").trim();
                const brownName = String(row[1] || "").trim();

                if (!brownID || !brownName) {
                    errorCount++;
                    errorMessages.push(`Row ${i + 2}: Missing Brown ID or Name`);
                    console.warn(`Row ${i + 2} skipped: Missing Brown ID or Name. Data:`, row);
                    setImportProgress(prev => ({ ...prev, current: i + 1 }));
                    continue;
                }

                const brownPriority = parseFloat(row[2] || 0);
                const brownGroupName = String(row[3] || "").trim();
                const brownGroupPriority = parseFloat(row[4] || 0);
                const pricingBrownID = String(row[5] || "").trim();

                const existing = brownList.find(x => String(x.brownID || x.BrownID).toLowerCase() === brownID.toLowerCase());
                const payload = {
                    id: existing ? (existing.id || existing.ID) : 0,
                    brownID,
                    brownName,
                    brownPriority,
                    brownGroupName,
                    brownGroupPriority,
                    pricingBrownID
                };

                try {
                    const response = await saveBrownMaster(payload);
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
                toast.success(`Import complete! Successfully saved ${successCount} Brown.`);
            }
            
            fetchBrownMaster();
            setImportModal(false);
            setSelectedFile(null);
        } catch (error) {
            toast.error("Failed to parse file: " + error.message);
        } finally {
            setImporting(false);
        }
    };
    const handleExport = async () => {

        if (brownList.length === 0) {
            toast.warning("No data found.");
            return;
        }

        const headers = [
            "ID",
            "Name",
            "Priority",
            "Group Name",
            "Group Priority",
            "Pricing ID"
        ];

        const rows = brownList.map(x => [

            x.brownID || x.BrownID,
            x.brownName || x.BrownName,
            x.brownPriority || x.BrownPriority,
            x.brownGroupName || x.BrownGroupName,
            x.brownGroupPriority || x.BrownGroupPriority,
            x.pricingBrownID || x.PricingBrownID

        ]);

        await exportToExcel(
            headers,
            rows,
            "BrownMaster",
            "BrownMasterList"
        );
    };
const handleDownloadTemplate = async () => {
    const headers = [
        "Brown ID",
        "Brown Name",
        "Brown Priority",
        "Brown Group Name",
        "Brown Group Priority",
        "Pricing Brown ID"
    ];

    const sampleRow = [
        "B001",
        "LIGHT BROWN",
        "1",
        "BROWN GROUP",
        "1",
        "PB001"
    ];

    const result = await exportToExcel(
        headers,
        [sampleRow],
        "Template",
        "BrownMasterTemplate"
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
                    className="btn btn-sm btn-soft-primary"
                    onClick={() => handleEditClick(row)}
                >
                    <i className="ri-pencil-fill"></i>
                </button>

                <button
                    className="btn btn-sm btn-soft-danger"
                    onClick={() => handleDeleteClick(row)}
                >
                    <i className="ri-delete-bin-fill"></i>
                </button>

            </div>

        );

    }

},
        {
            header: t("ID"),
            accessorFn: row => row.brownID || row.BrownID
        },

        {
            header: t("Name"),
            accessorFn: row => row.brownName || row.BrownName
        },

        {
            header: t("Priority"),
            accessorFn: row => row.brownPriority || row.BrownPriority
        },

        {
            header: t("Group Name"),
            accessorFn: row => row.brownGroupName || row.BrownGroupName
        },

        {
            header: t("Group Priority"),
            accessorFn: row => row.brownGroupPriority || row.BrownGroupPriority
        },

        {
            header: t("Pricing ID"),
            accessorFn: row => row.pricingBrownID || row.PricingBrownID
        }

    ], [t]);

    return (

        <React.Fragment>

            <div className="page-content">

                <Container fluid>

                    <BreadCrumb
                        title={t("Brown Master")}
                        pageTitle={t("Masters")}
                    />

                    <Row>

                        <Col lg={12}>

                            <Card className="shadow-lg border-0 rounded-3 overflow-hidden">

                                <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">

                                    <h5 className="card-title mb-0">{t("Brown Master")}</h5>

                                    <div className="d-flex gap-2">

                                        <Button
                                            color="primary"
                                            className="add-btn"
                                            onClick={() => {
                                                validation.resetForm();
                                                setFormModal(true);
                                            }}
                                        >
                                            <i className="ri-add-line align-bottom me-1"></i>
                                            {t("Add Brown")}
                                        </Button>
                                        <Button
                                            color="soft-success"
                                            onClick={() => setImportModal(true)}
                                        >{t("Import Excel")}</Button>
                                        <Button
                                            color="soft-success"
                                            className="btn-icon"
                                            onClick={handleExport}
                                            title={t("Export Excel")}
                                            style={{
                                                height: "37.5px",
                                                width: "40px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >
                                            <i
                                                className="ri-file-excel-2-line"
                                                style={{ fontSize: "22px" }}
                                            ></i>
                                        </Button>

                                    </div>

                                </CardHeader>

                                <CardBody>

                                    {loading ?

                                        <div className="text-center">

                                            <div className="spinner-border text-primary"></div>

                                        </div>

                                        :

                                        <TableContainer
                                            columns={columns}
                                            data={brownList}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            SearchPlaceholder={t("Search...")}
                                            divClass="table-responsive"
                                            tableClass="align-middle table-nowrap"
                                            theadClass="table-light"
                                        />

                                    }

                                </CardBody>

                            </Card>

                        </Col>

                    </Row>

                </Container>

            </div>
            <Modal
                isOpen={formModal}
                toggle={() => setFormModal(false)}
                centered
            >
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        validation.handleSubmit();
                    }}
                >
                    <ModalHeader toggle={() => setFormModal(false)}>
                        {isEdit ? t("Edit Brown Master") : t("Add Brown Master")}
                    </ModalHeader>

                    <ModalBody>

                        <Row className="gy-3">

                            <Col md={12}>
                                <Label className="form-label">
                                    {t("Brown ID")}<span className="text-danger">*</span>
                                </Label>

                                <Input
                                    name="brownID"
                                    type="text"
                                    placeholder={t("Enter Brown ID")}
                                    value={validation.values.brownID}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={
                                        validation.touched.brownID &&
                                        validation.errors.brownID
                                    }
                                />

                                <FormFeedback>
                                    {validation.errors.brownID}
                                </FormFeedback>
                            </Col>

                            <Col md={12}>
                                <Label className="form-label">
                                    {t("Brown Name")}<span className="text-danger">*</span>
                                </Label>

                                <Input
                                    name="brownName"
                                    type="text"
                                    placeholder={t("Enter Brown Name")}
                                    value={validation.values.brownName}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={
                                        validation.touched.brownName &&
                                        validation.errors.brownName
                                    }
                                />

                                <FormFeedback>
                                    {validation.errors.brownName}
                                </FormFeedback>
                            </Col>

                            <Col md={12}>
                                <Label className="form-label">
                                    {t("Brown Priority")}<span className="text-danger">*</span>
                                </Label>

                                <Input
                                    name="brownPriority"
                                    type="number"
                                    placeholder={t("Enter Brown Priority")}
                                    value={validation.values.brownPriority}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={
                                        validation.touched.brownPriority &&
                                        validation.errors.brownPriority
                                    }
                                />

                                <FormFeedback>
                                    {validation.errors.brownPriority}
                                </FormFeedback>
                            </Col>

                            <Col md={12}>
                                <Label className="form-label">
                                    {t("Brown Group Name")}
                                </Label>

                                <Input
                                    name="brownGroupName"
                                    type="text"
                                    placeholder={t("Enter Brown Group Name")}
                                    value={validation.values.brownGroupName}
                                    onChange={validation.handleChange}
                                />
                            </Col>

                            <Col md={12}>
                                <Label className="form-label">
                                    {t("Brown Group Priority")}
                                </Label>

                                <Input
                                    name="brownGroupPriority"
                                    type="number"
                                    placeholder={t("Enter Brown Group Priority")}
                                    value={validation.values.brownGroupPriority}
                                    onChange={validation.handleChange}
                                />
                            </Col>

                            <Col md={12}>
                                <Label className="form-label">
                                    {t("Pricing Brown ID")}
                                </Label>

                                <Input
                                    name="pricingBrownID"
                                    type="text"
                                    placeholder={t("Enter Pricing Brown ID")}
                                    value={validation.values.pricingBrownID}
                                    onChange={validation.handleChange}
                                />
                            </Col>

                        </Row>

                    </ModalBody>

                    <ModalFooter>

                        <Button
                            color="light"
                            type="button"
                            onClick={() => {
                                validation.resetForm();
                                setFormModal(false);
                            }}
                        >{t("Cancel")}</Button>

                        <Button
                            color="primary"
                            type="submit"
                        >{t("Save")}</Button>

                    </ModalFooter>

                </Form>

            </Modal>

            {/* Import Excel Modal */}
                        <Modal isOpen={importModal} toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }} className="modal-dialog-centered">
                <ModalHeader className="bg-success pb-3 text-white" toggle={() => { if (!importing) { setImportModal(false); setSelectedFile(null); } }}>{t("Import Brown Master Excel")}</ModalHeader>
                            <ModalBody>
                                <div className="mb-4">
                                    <Label className="form-label">{t("Download Brown Master File Template Format")}</Label>
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

                        <Modal
    isOpen={deleteModal}
    toggle={() => setDeleteModal(false)}
    centered
>
    <ModalHeader toggle={() => setDeleteModal(false)}>
        Confirm Delete
    </ModalHeader>

    <ModalBody>

        <h5 className="text-center">
<lord-icon
                            src="https://cdn.lordicon.com/gsqxdxog.json"
                            trigger="loop"
                            colors="primary:#f7b84b,secondary:#f06548"
                            style={{ width: "100px", height: "100px" }}
                        ></lord-icon>
           <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            <h4>{t("Are you sure?")}</h4>
                            <p className="text-muted mx-4 mb-0">
                                {t("Are you sure you want to delete Brown")} <strong>{brownToDelete?.brownID || brownToDelete?.brownName}</strong>?
                            </p>
                        </div>
            <br />

            

        </h5>
<div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                                <Button type="button" color="light" className="w-sm" onClick={() => setDeleteModal(false)}>{t("Cancel")}</Button>
                                <Button type="button" color="danger" className="w-sm" onClick={handleDeleteConfirm}>{t("Yes, Delete It!")}</Button>
                            </div>
    </ModalBody>



        



</Modal>
            <ToastContainer autoClose={2000} />

        </React.Fragment>

    );
};

export default BrownMasterList;