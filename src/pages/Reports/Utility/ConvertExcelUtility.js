import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    Form,
    Input,
    Label,
    Row,
    Spinner,
    Table
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import {
    getConvertExcelUtilityPermission,
    uploadConvertExcelFile
} from "../../../helpers/fakebackend_helper";
import { loadXlsx } from "../../../helpers/excel_helper";

const ConvertExcelUtility = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(true);
    const [busy, setBusy] = useState(false);
    const [file, setFile] = useState(null);
    const [originalData, setOriginalData] = useState([]);
    const [mappedData, setMappedData] = useState([]);
    const [downloadFile, setDownloadFile] = useState(null);
    const [downloadFileName, setDownloadFileName] = useState("MappedExcel.xlsx");

    const loadPermission = useCallback(async () => {
        setLoading(true);
        try {
            const permission = await getConvertExcelUtilityPermission();
            if (permission?.success === false) {
                setAuthorized(false);
                toast.error(permission?.message || t("You are not authorized to perform this task."));
                return;
            }
            setAuthorized(true);
        } catch (err) {
            const status = err?.response?.status || err?.status;
            if (status === 403) {
                setAuthorized(false);
                toast.error(t("You are not authorized to perform this task."));
            } else {
                toast.error(err?.message || t("Error loading Convert Excel Utility."));
            }
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadPermission();
    }, [loadPermission]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error(t("Please select a file"));
            return;
        }

        setBusy(true);
        try {
            const response = await uploadConvertExcelFile(file);
            const res = response?.Data || response?.data || response;

            if (res && res.originalData && res.mappedData) {
                setOriginalData(res.originalData || []);
                setMappedData(res.mappedData || []);
                setDownloadFile(res.file || null);
                setDownloadFileName(res.fileName || "MappedExcel.xlsx");
                toast.success(t("Excel uploaded and converted successfully!"));
            } else {
                toast.error(t("Invalid response from server."));
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || t("Upload failed");
            toast.error(msg);
        } finally {
            setBusy(false);
        }
    };

    const exportExcel = async () => {
        if (!mappedData || mappedData.length === 0) {
            toast.warning(t("No data to export"));
            return;
        }
        try {
            const XLSX = await loadXlsx();
            const ws = XLSX.utils.json_to_sheet(mappedData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "MappedData");
            XLSX.writeFile(wb, "MappedData.xlsx");
        } catch (err) {
            toast.error(t("Excel export failed: ") + err.message);
        }
    };

    const exportCSV = async () => {
        if (!mappedData || mappedData.length === 0) {
            toast.warning(t("No data to export"));
            return;
        }
        try {
            const XLSX = await loadXlsx();
            const ws = XLSX.utils.json_to_sheet(mappedData);
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "MappedData.csv";
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (err) {
            toast.error(t("CSV export failed: ") + err.message);
        }
    };

    const exportPDF = () => {
        if (!mappedData || mappedData.length === 0) {
            toast.warning(t("No data to export"));
            return;
        }
        window.print();
    };

    const renderDataTable = (data, title, tableId) => {
        if (!data || data.length === 0) return null;
        const headers = Object.keys(data[0]);

        return (
            <Card className="shadow-sm border-0 mb-4">
                <CardHeader className="bg-light border-0 py-3">
                    <h5 className="card-title mb-0 text-primary fw-semibold">{t(title)}</h5>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                        <Table id={tableId} bordered hover size="sm" className="align-middle text-center mb-0" style={{ fontSize: "11px", minWidth: "1800px" }}>
                            <thead className="table-light sticky-top">
                                <tr>
                                    {headers.map((key, idx) => (
                                        <th key={idx} className="fw-semibold px-2 py-2">{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, rIdx) => (
                                    <tr key={rIdx}>
                                        {headers.map((key, cIdx) => {
                                            const val = row[key];
                                            const displayVal = (val === null || val === undefined || (typeof val === "object" && Object.keys(val).length === 0)) ? "" : String(val);
                                            return <td key={cIdx} className="px-2 py-1">{displayVal}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </CardBody>
            </Card>
        );
    };

    document.title = `${t("Convert Excel Utility")} | ${t("Utility")}`;

    return (
        <React.Fragment>
            <ToastContainer position="top-right" autoClose={2500} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Convert Excel Utility")} pageTitle={t("Utility")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <i className="ri-file-excel-2-line fs-20 text-primary" />
                            {t("Convert Your Stock File to DiaSense Purchase Format")}
                        </h5>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner color="primary" />
                        </div>
                    ) : !authorized ? (
                        <Card className="shadow-sm border-0">
                            <CardBody className="text-center text-danger py-5">
                                {t("You are not authorized to perform this task.")}
                            </CardBody>
                        </Card>
                    ) : (
                        <React.Fragment>
                            <Card className="shadow-sm border-0 mb-3">
                                <CardBody>
                                    <Form onSubmit={handleUpload}>
                                        <Row className="g-3 align-items-center">
                                            <Col sm={12} md={6} lg={4}>
                                                <Label htmlFor="fileInputUnified" className="form-label fw-medium">
                                                    {t("Choose Excel File")} (.xlsx, .xls)
                                                </Label>
                                                <Input
                                                    id="fileInputUnified"
                                                    type="file"
                                                    accept=".xlsx,.xls"
                                                    required
                                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                />
                                            </Col>
                                            <Col sm={12} md={6} lg={3} className="d-flex align-items-end">
                                                <Button
                                                    type="submit"
                                                    color="primary"
                                                    className="w-100 d-flex align-items-center justify-content-center gap-2 mt-4"
                                                    disabled={busy}
                                                >
                                                    {busy ? (
                                                        <Spinner size="sm" />
                                                    ) : (
                                                        <React.Fragment>
                                                            <i className="ri-upload-2-line" />
                                                            {t("Upload & Show Both")}
                                                        </React.Fragment>
                                                    )}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>

                                    {(mappedData.length > 0 || originalData.length > 0) && (
                                        <div className="d-flex flex-wrap align-items-center justify-content-between mt-4 pt-3 border-top gap-2">
                                            <div className="btn-group" role="group" aria-label="Export options">
                                                <Button
                                                    color="light"
                                                    className="btn-icon text-success border"
                                                    title={t("Download Excel")}
                                                    onClick={exportExcel}
                                                >
                                                    <i className="ri-file-excel-line fs-16" />
                                                </Button>
                                                <Button
                                                    color="light"
                                                    className="btn-icon text-info border"
                                                    title={t("Download CSV")}
                                                    onClick={exportCSV}
                                                >
                                                    <i className="ri-file-text-line fs-16" />
                                                </Button>
                                                <Button
                                                    color="light"
                                                    className="btn-icon text-danger border"
                                                    title={t("Download PDF")}
                                                    onClick={exportPDF}
                                                >
                                                    <i className="ri-file-pdf-line fs-16" />
                                                </Button>
                                                <Button
                                                    color="light"
                                                    className="btn-icon text-dark border"
                                                    title={t("Print")}
                                                    onClick={() => window.print()}
                                                >
                                                    <i className="ri-printer-line fs-16" />
                                                </Button>
                                            </div>

                                            {downloadFile && (
                                                <div id="downloadAreaUnified">
                                                    <a
                                                        href={`data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${downloadFile}`}
                                                        download={downloadFileName}
                                                        className="btn btn-outline-success d-inline-flex align-items-center gap-2 fw-medium"
                                                    >
                                                        <i className="ri-download-2-line fs-16" />
                                                        {t("Download Mapped Excel")}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>

                            {renderDataTable(originalData, "Your Uploaded File Format", "reportTable1")}
                            {renderDataTable(mappedData, "Converted To DiaSense Purchase File Format", "reportTable2")}
                        </React.Fragment>
                    )}
                </Container>
            </div>
        </React.Fragment>
    );
};

export default ConvertExcelUtility;
