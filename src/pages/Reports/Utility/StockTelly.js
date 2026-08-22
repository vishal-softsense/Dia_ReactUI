import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import {
    Button,
    Card,
    CardBody,
    Col,
    Container,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Row,
    Spinner,
    Table
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { exportToExcel } from "../../../helpers/excel_helper";
import {
    getStockTellyPermission,
    getStockTellyReport,
    importStockTellyFile,
    saveStockTelly
} from "../../../helpers/fakebackend_helper";

const TABLE_COLUMNS = [
    { key: "ItemCode", label: "Code", align: "text-start" },
    { key: "LotNo", label: "LotNo", align: "text-start" },
    { key: "Pcs", label: "Pcs", align: "text-end" },
    { key: "carats", label: "Carats", align: "text-end", decimals: 3 },
    { key: "OnHand", label: "OnHand", align: "text-end", decimals: 3 },
    { key: "Rate", label: "AskingPrice", align: "text-end", decimals: 2 },
    { key: "Amount", label: "Amount", align: "text-end", decimals: 3 }
];

const MvcSwalResult = ({ open, type, title, text, confirmText, onClose }) => {
    const isSuccess = type === "success";
    const iconColor = isSuccess ? "#0ab39c" : "#f06548";
    const iconBorder = isSuccess ? "rgba(10, 179, 156, 0.3)" : "#f06548";

    return (
        <Modal isOpen={open} toggle={onClose} centered className="modal-dialog-centered" contentClassName="border-0 shadow" style={{ maxWidth: 440 }}>
            <ModalBody className="p-4 text-center">
                <div
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        border: `4px solid ${iconBorder}`,
                        color: iconColor,
                        fontSize: isSuccess ? 42 : 48,
                        fontWeight: 600,
                        lineHeight: 1
                    }}
                    aria-hidden="true"
                >
                    {isSuccess ? "✓" : "!"}
                </div>
                <h2 className="fw-semibold mb-2" style={{ fontSize: 22, color: "#495057" }}>{title}</h2>
                {text ? <p className="text-muted mb-4 fs-16">{text}</p> : <div className="mb-4" />}
                <button type="button" className="btn btn-success" onClick={onClose}>{confirmText}</button>
            </ModalBody>
        </Modal>
    );
};

const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getRowValue = (row, key) => {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    return row?.[pascal];
};

const formatNumber = (value, decimals = 2) => {
    const num = Number(value);
    if (Number.isNaN(num)) return (0).toFixed(decimals);
    return num.toFixed(decimals);
};

const mapDropdownOptions = (items = []) =>
    items.map(item => ({
        value: item.ID ?? item.id ?? item.Name ?? item.name,
        label: item.ID ?? item.id ?? item.Name ?? item.name
    }));

const filterRows = (rows, filters) =>
    rows.filter(row =>
        TABLE_COLUMNS.every(col => {
            const filterValue = (filters[col.key] || "").trim().toLowerCase();
            if (!filterValue) return true;
            return String(getRowValue(row, col.key) ?? "").toLowerCase().includes(filterValue);
        })
    );

const computeTotals = (rows) => ({
    pcs: rows.reduce((sum, row) => sum + (Number(getRowValue(row, "Pcs")) || 0), 0),
    carats: rows.reduce((sum, row) => sum + (Number(getRowValue(row, "carats")) || 0), 0),
    onHand: rows.reduce((sum, row) => sum + (Number(getRowValue(row, "OnHand")) || 0), 0),
    amount: rows.reduce((sum, row) => sum + (Number(getRowValue(row, "Amount")) || 0), 0)
});

const StockTellyTable = ({ title, rows, filters, onFilterChange, emptyText }) => {
    const { t } = useTranslation();
    const filteredRows = useMemo(() => filterRows(rows, filters), [rows, filters]);
    const totals = useMemo(() => computeTotals(filteredRows), [filteredRows]);
    const totalFiltered = filteredRows.length;
    const totalCount = rows.length;

    return (
        <div>
            {title ? <h6 className="fw-semibold text-primary mb-2">{title}</h6> : null}
            <div className="table-responsive" style={{ maxHeight: 420, overflow: "auto" }}>
                <Table bordered size="sm" className="mb-0 text-nowrap align-middle">
                    <thead className="table-light sticky-top" style={{ position: "sticky", top: 0, zIndex: 3, backgroundColor: "var(--vz-table-head-bg, var(--vz-tertiary-bg, #f3f6f9))", color: "var(--vz-table-color, inherit)" }}>
                        <tr>
                            {TABLE_COLUMNS.map(col => (
                                <th key={col.key} className={col.align} style={{ position: "sticky", top: 0, backgroundColor: "var(--vz-table-head-bg, var(--vz-tertiary-bg, #f3f6f9))", color: "var(--vz-table-color, inherit)", zIndex: 3 }}>
                                    {t(col.label)}
                                </th>
                            ))}
                        </tr>
                        <tr className="export-exclude">
                            {TABLE_COLUMNS.map(col => (
                                <th key={`filter-${col.key}`} className="p-1" style={{ position: "sticky", top: 33, backgroundColor: "var(--vz-table-head-bg, var(--vz-tertiary-bg, #f3f6f9))", color: "var(--vz-table-color, inherit)", zIndex: 3 }}>
                                    <Input
                                        bsSize="sm"
                                        placeholder={t(col.label)}
                                        value={filters[col.key] || ""}
                                        onChange={e => onFilterChange(col.key, e.target.value)}
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={TABLE_COLUMNS.length} className="text-center text-muted py-4">
                                    {emptyText}
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((row, index) => (
                                <tr key={`${getRowValue(row, "ItemCode")}-${getRowValue(row, "LotNo")}-${index}`}>
                                    {TABLE_COLUMNS.map(col => (
                                        <td key={col.key} className={col.align}>
                                            {col.decimals !== undefined
                                                ? formatNumber(getRowValue(row, col.key), col.decimals)
                                                : (getRowValue(row, col.key) ?? "")}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="table-light fw-bold" style={{ position: "sticky", bottom: 0, zIndex: 2, backgroundColor: "var(--vz-table-head-bg, var(--vz-tertiary-bg, #f3f6f9))", color: "var(--vz-table-color, inherit)" }}>
                        <tr>
                            <td className="fw-bold" style={{ position: "sticky", bottom: 0, backgroundColor: "var(--vz-table-head-bg, var(--vz-tertiary-bg, #f3f6f9))", color: "var(--vz-table-color, inherit)" }}>{t("Total:") || "Total:"}</td>
                            <td style={{ position: "sticky", bottom: 0, backgroundColor: "var(--vz-table-head-bg, var(--vz-tertiary-bg, #f3f6f9))", color: "var(--vz-table-color, inherit)" }} />
                            <td className="text-end fw-bold" style={{ position: "sticky", bottom: 0, backgroundColor: "var(--vz-table-head-bg, var(--vz-tertiary-bg, #f3f6f9))", color: "var(--vz-table-color, inherit)" }}>{totals.pcs}</td>
                            <td className="text-end fw-bold" style={{ position: "sticky", bottom: 0, backgroundColor: "var(--vz-table-head-bg, var(--vz-tertiary-bg, #f3f6f9))", color: "var(--vz-table-color, inherit)" }}>{formatNumber(totals.carats, 2)}</td>
                            <td className="text-end fw-bold" style={{ position: "sticky", bottom: 0, backgroundColor: "var(--vz-table-head-bg, var(--vz-tertiary-bg, #f3f6f9))", color: "var(--vz-table-color, inherit)" }}>{formatNumber(totals.onHand, 2)}</td>
                            <td style={{ position: "sticky", bottom: 0, backgroundColor: "var(--vz-table-head-bg, var(--vz-tertiary-bg, #f3f6f9))", color: "var(--vz-table-color, inherit)" }} />
                            <td className="text-end fw-bold" style={{ position: "sticky", bottom: 0, backgroundColor: "var(--vz-table-head-bg, var(--vz-tertiary-bg, #f3f6f9))", color: "var(--vz-table-color, inherit)" }}>{formatNumber(totals.amount, 2)}</td>
                        </tr>
                    </tfoot>
                </Table>
            </div>
            <div className="d-flex align-items-center justify-content-between mt-2 px-1">
                <div className="text-muted fs-13">
                    {t("Showing")} <span className="fw-semibold">{totalFiltered > 0 ? 1 : 0}</span> {t("to")}{" "}
                    <span className="fw-semibold">{totalFiltered}</span> {t("of")}{" "}
                    <span className="fw-semibold">{totalCount}</span> {t("entries")}
                </div>
            </div>
        </div>
    );
};

const StockTelly = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(true);
    const [busy, setBusy] = useState(false);
    const [trnDate, setTrnDate] = useState(formatLocalDate(new Date()));
    const [dropdowns, setDropdowns] = useState({ Shape: [], Color: [], Size: [], Clarity: [] });
    const [shape, setShape] = useState([]);
    const [color, setColor] = useState([]);
    const [size, setSize] = useState([]);
    const [clarity, setClarity] = useState([]);
    const [stockRows, setStockRows] = useState([]);
    const [importRows, setImportRows] = useState([]);
    const [stockFilters, setStockFilters] = useState({});
    const [importFilters, setImportFilters] = useState({});
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [resultModal, setResultModal] = useState({ open: false, type: "success", title: "", text: "" });

    const selectStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: 38,
            backgroundColor: "var(--vz-input-bg, var(--vz-secondary-bg, #fff))",
            borderColor: state.isFocused ? "#80bdff" : "var(--vz-border-color, #ced4da)",
            color: "var(--vz-body-color, #495057)",
            boxShadow: "none"
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: "0 8px"
        }),
        input: (provided) => ({
            ...provided,
            color: "var(--vz-body-color, #495057)"
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "var(--vz-body-color, #495057)"
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: "var(--vz-light, #f3f6f9)",
            color: "var(--vz-body-color, #495057)"
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: "var(--vz-body-color, #495057)"
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: "var(--vz-secondary-bg, #fff)",
            color: "var(--vz-body-color, #495057)",
            border: "1px solid var(--vz-border-color, #dee2e6)",
            zIndex: 9999
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: "13px",
            backgroundColor: state.isSelected
                ? "#405189"
                : state.isFocused
                ? "var(--vz-light, #f3f6f9)"
                : "transparent",
            color: state.isSelected
                ? "#fff"
                : "var(--vz-body-color, #495057)",
            cursor: "pointer"
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "var(--vz-secondary-color, #878a99)"
        })
    };

    const loadPage = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getStockTellyPermission();
            if (response?.success === false) {
                setAuthorized(false);
                toast.error(response?.message || t("You are not authorized to perform this task."));
                return;
            }
            setAuthorized(true);
            const pageDropdowns = response?.Dropdowns || response?.dropdowns || {};
            setDropdowns({
                Shape: pageDropdowns.Shape || pageDropdowns.shape || [],
                Color: pageDropdowns.Color || pageDropdowns.color || [],
                Size: pageDropdowns.Size || pageDropdowns.size || [],
                Clarity: pageDropdowns.Clarity || pageDropdowns.clarity || []
            });
        } catch (err) {
            const status = err?.response?.status || err?.status;
            setAuthorized(status !== 403);
            toast.error(status === 403 ? t("You are not authorized to perform this task.") : (err?.message || t("Error loading Stock Telly.")));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadPage();
    }, [loadPage]);

    const extractErrorMessage = (err, fallbackMsg) =>
        err?.Data || err?.data || err?.message || err?.response?.data?.Data || err?.response?.data?.message || fallbackMsg;

    const handleReport = async () => {
        setBusy(true);
        try {
            const payload = {
                Date: trnDate,
                Shape: shape.map(item => item.value),
                Color: color.map(item => item.value),
                Size: size.map(item => item.value),
                Clarity: clarity.map(item => item.value)
            };
            const response = await getStockTellyReport(payload);
            if (response?.success === true || response?.Success === true) {
                setStockRows(response?.Data || response?.data || []);
                setStockFilters({});
            } else {
                toast.error(extractErrorMessage(response, t("Operation failed.")));
            }
        } catch (err) {
            toast.error(extractErrorMessage(err, t("Error loading report.")));
        } finally {
            setBusy(false);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error(t("Please select an Excel file to import."));
            return;
        }
        setBusy(true);
        try {
            const response = await importStockTellyFile(file);
            if (response?.success === true || response?.Success === true) {
                setImportRows(response?.Data || response?.data || []);
                setImportFilters({});
                setImportModalOpen(false);
                setFile(null);
                setResultModal({
                    open: true,
                    type: "success",
                    title: t("Excel Import Success!"),
                    text: t("Excel Import Success!")
                });
            } else {
                setResultModal({
                    open: true,
                    type: "error",
                    title: t("Warning"),
                    text: extractErrorMessage(response, t("Import failed."))
                });
            }
        } catch (err) {
            setResultModal({
                open: true,
                type: "error",
                title: t("Warning"),
                text: extractErrorMessage(err, t("Import failed."))
            });
        } finally {
            setBusy(false);
        }
    };

    const buildSavePayload = (rows) =>
        rows.map(row => {
            const carats = Number(getRowValue(row, "carats")) || 0;
            const rate = Number(getRowValue(row, "Rate")) || 0;
            return {
                ItemCode: Number(getRowValue(row, "ItemCode")) || 0,
                Fromlotno: getRowValue(row, "LotNo"),
                Tolotno: getRowValue(row, "LotNo"),
                Pcs: Number(getRowValue(row, "Pcs")) || 0,
                Carats: carats,
                Rate: rate,
                Amount: parseFloat((carats * rate).toFixed(2)),
                FromPrice: rate,
                ToPrice: rate,
                TrnDate: trnDate
            };
        });

    const handleSubmit = async () => {
        if (!stockRows.length && !importRows.length) {
            toast.error(t("Please run report or import data first."));
            return;
        }

        setBusy(true);
        try {
            const payload = {
                spList: buildSavePayload(stockRows),
                spList1: buildSavePayload(importRows)
            };
            const response = await saveStockTelly(payload);
            if (response?.success === true || response?.Success === true) {
                setResultModal({
                    open: true,
                    type: "success",
                    title: t("Success"),
                    text: response?.message || response?.Message || t("Stock transactions saved successfully.")
                });
            } else {
                setResultModal({
                    open: true,
                    type: "error",
                    title: t("Error"),
                    text: response?.message || response?.Message || t("Operation failed.")
                });
            }
        } catch (err) {
            setResultModal({
                open: true,
                type: "error",
                title: t("Error"),
                text: extractErrorMessage(err, t("Server error occurred."))
            });
        } finally {
            setBusy(false);
        }
    };

    const handleExport = async () => {
        if (!stockRows.length) {
            toast.error(t("Please run report first."));
            return;
        }

        const filteredRows = filterRows(stockRows, stockFilters);
        const headers = ["Code", "LotNo", "Pcs", "Carats","OnHand", "AskingPrice", "Amount"];
        const rows = filteredRows.map(row => [
            getRowValue(row, "ItemCode"),
            getRowValue(row, "LotNo"),
            getRowValue(row, "Pcs"),
            formatNumber(getRowValue(row, "carats"), 3),
            formatNumber(getRowValue(row, "OnHand"), 3),
            formatNumber(getRowValue(row, "AskingPrice"), 2),
            formatNumber(getRowValue(row, "Amount"), 3)
        ]);

        const result = await exportToExcel(headers, rows, "Sheet 1", "StockTellyData");
        if (!result?.success) {
            toast.error(t("Export failed."));
        }
    };

    const downloadTemplate = async (e) => {
        e.preventDefault();
        try {
            // Generate template in-browser (public/excelfolder/ImportStockTakingData.xlsx is not bundled)
            // Columns must match MVC import: LotNo, Pcs, Carats, OnHand, Rate, Amount
            const result = await exportToExcel(
                ["LotNo", "Pcs", "Carats", "OnHand", "Rate", "Amount"],
                [],
                "ImportStockTakingData",
                "ImportStockTakingData"
            );
            if (!result?.success) {
                toast.error(t("Template download failed."));
            }
        } catch {
            toast.error(t("Template download failed."));
        }
    };

    document.title = `${t("Stock Telly")} | ${t("Utility")}`;

    return (
        <React.Fragment>
            <ToastContainer position="top-right" autoClose={2500} />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Stock Telly")} pageTitle={t("Utility")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <i className="ri-scales-3-line fs-20 text-primary" />
                            {t("Stock Tally")}
                        </h5>
                        <div className="d-flex flex-wrap gap-2">
                            <Button color="primary" outline disabled={busy || !authorized} onClick={handleExport}>
                                {t("Export Excel")}
                            </Button>
                            <Button color="primary" disabled={busy || !authorized} onClick={handleSubmit}>
                                {busy ? <Spinner size="sm" /> : t("Submit")}
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5"><Spinner color="primary" /></div>
                    ) : !authorized ? (
                        <Card className="shadow-sm border-0">
                            <CardBody className="text-center text-danger py-5">
                                {t("You are not authorized to perform this task.")}
                            </CardBody>
                        </Card>
                    ) : (
                        <Card className="shadow-sm border-0">
                            <CardBody>
                                <Row className="g-3 align-items-end mb-3">
                                    <Col lg={1} md={3} sm={6}>
                                        <Label className="form-label">{t("Date")}</Label>
                                        <Input type="date" value={trnDate} onChange={e => setTrnDate(e.target.value)} />
                                    </Col>
                                    <Col lg={2} md={3} sm={6}>
                                        <Label className="form-label fw-semibold">{t("Shape")}</Label>
                                        <Select
                                            isMulti
                                            classNamePrefix="react-select"
                                            placeholder={t("Shape")}
                                            options={mapDropdownOptions(dropdowns.Shape)}
                                            value={shape}
                                            onChange={setShape}
                                            styles={selectStyles}
                                        />
                                    </Col>
                                    <Col lg={2} md={3} sm={6}>
                                        <Label className="form-label fw-semibold">{t("Color")}</Label>
                                        <Select
                                            isMulti
                                            classNamePrefix="react-select"
                                            placeholder={t("Color")}
                                            options={mapDropdownOptions(dropdowns.Color)}
                                            value={color}
                                            onChange={setColor}
                                            styles={selectStyles}
                                        />
                                    </Col>
                                    <Col lg={2} md={3} sm={6}>
                                        <Label className="form-label fw-semibold">{t("Size")}</Label>
                                        <Select
                                            isMulti
                                            classNamePrefix="react-select"
                                            placeholder={t("Size")}
                                            options={mapDropdownOptions(dropdowns.Size)}
                                            value={size}
                                            onChange={setSize}
                                            styles={selectStyles}
                                        />
                                    </Col>
                                    <Col lg={2} md={3} sm={6}>
                                        <Label className="form-label fw-semibold">{t("Clarity")}</Label>
                                        <Select
                                            isMulti
                                            classNamePrefix="react-select"
                                            placeholder={t("Clarity")}
                                            options={mapDropdownOptions(dropdowns.Clarity)}
                                            value={clarity}
                                            onChange={setClarity}
                                            styles={selectStyles}
                                        />
                                    </Col>
                                    <Col lg={1} md={3} sm={6}>
                                        <Button color="primary" className="w-100" disabled={busy} onClick={handleReport}>
                                            {busy ? <Spinner size="sm" /> : t("Report")}
                                        </Button>
                                    </Col>
                                    <Col lg={2} md={3} sm={6}>
                                        <Button color="primary" outline className="w-100" disabled={busy} onClick={() => setImportModalOpen(true)}>
                                            {t("Import Stock Telly Data")}
                                        </Button>
                                    </Col>
                                </Row>

                                <Row className="g-3">
                                    <Col lg={6}>
                                        <StockTellyTable
                                            title={t("Stock List")}
                                            rows={stockRows}
                                            filters={stockFilters}
                                            onFilterChange={(key, value) => setStockFilters(prev => ({ ...prev, [key]: value }))}
                                            emptyText={t("Run report to load stock data.")}
                                        />
                                    </Col>
                                    <Col lg={6}>
                                        <StockTellyTable
                                            title={t("Imported Stock Telly")}
                                            rows={importRows}
                                            filters={importFilters}
                                            onFilterChange={(key, value) => setImportFilters(prev => ({ ...prev, [key]: value }))}
                                            emptyText={t("Import Excel data to compare stock.")}
                                        />
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    )}
                </Container>
            </div>

            {busy ? (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: "rgba(255,255,255,0.55)", zIndex: 1055 }}>
                    <Spinner color="primary" />
                </div>
            ) : null}

            <Modal isOpen={importModalOpen} toggle={() => setImportModalOpen(false)} centered>
                <ModalHeader toggle={() => setImportModalOpen(false)} className="bg-primary">
                    <span className="text-white">{t("Import File")}</span>
                </ModalHeader>
                <ModalBody>
                    <Label className="form-label">{t("Select File To Import")}</Label>
                    <Input
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                    {file ? <div className="text-muted fs-12 mt-1">{file.name}</div> : null}
                    <div className="mt-3">
                        <Label className="form-label d-block">{t("Download Stock Telly File Format")}</Label>
                        <Button color="primary" type="button" onClick={downloadTemplate}>
                            <i className="ri-download-cloud-2-line me-1" />
                            {t("Download")}
                        </Button>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => setImportModalOpen(false)}>{t("Close")}</Button>
                    <Button color="primary" disabled={busy} onClick={handleImport}>{t("Accept")}</Button>
                </ModalFooter>
            </Modal>

            <MvcSwalResult
                open={resultModal.open}
                type={resultModal.type}
                title={resultModal.title}
                text={resultModal.text}
                confirmText={t("OK")}
                onClose={() => setResultModal(prev => ({ ...prev, open: false }))}
            />
        </React.Fragment>
    );
};

export default StockTelly;
