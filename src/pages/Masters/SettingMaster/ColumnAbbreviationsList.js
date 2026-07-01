import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, Spinner } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { getColumnAbbreviations, updateColumnAbbreviations } from "../../../helpers/fakebackend_helper";
import { exportToExcel, parseExcelFile } from "../../../helpers/excel_helper";
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";

const ColumnAbbreviationsList = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [columnAbbrList, setColumnAbbrList] = useState([]);
    
    // Import Modal
    const [importModal, setImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await getColumnAbbreviations();
            if (response.success || response.Success) {
                setColumnAbbrList(response.data || response.Data || []);
            } else {
                toast.error(response.data || response.Data || "Failed to load column abbreviations");
            }
        } catch (error) {
            toast.error("Failed to load column abbreviations");
        }
        setLoading(false);
    };

    const handleAbbrChange = (id, newValue) => {
        setColumnAbbrList(prev => prev.map(item => {
            const itemId = item.Id ?? item.id;
            return itemId === id ? { ...item, Abbreviation: newValue, abbreviation: newValue } : item;
        }));
    };

    const handleSaveAllAbbr = async () => {
        setLoading(true);
        try {
            const payload = columnAbbrList.map(item => ({
                Id: item.Id ?? item.id ?? 0,
                ColumnName: item.ColumnName ?? item.columnName ?? "",
                Abbreviation: item.Abbreviation ?? item.abbreviation ?? ""
            }));
            const response = await updateColumnAbbreviations(payload);
            if (response.success || response.Success) {
                toast.success("Column Abbreviations updated successfully");
                loadData();
            } else {
                toast.error(response.data || response.Data || "Failed to update abbreviations");
            }
        } catch (error) {
            toast.error("Error occurred while saving abbreviations");
        }
        setLoading(false);
    };

    const handleDownloadAbbrTemplate = async () => {
        const headers = ["ColumnName", "Abbreviation"];
        const rows = columnAbbrList.map(item => [item.ColumnName ?? item.columnName ?? "", item.Abbreviation ?? item.abbreviation ?? ""]);
        const result = await exportToExcel(headers, rows, "ColumnAbbreviations", "ColumnAbbreviations");
        if (result.success) {
            toast.success("Excel template downloaded successfully");
        } else {
            toast.error("Failed to download template");
        }
    };

    const handleImportAbbr = async () => {
        if (!importFile) {
            toast.warning("Please select a file first");
            return;
        }

        const res = await parseExcelFile(importFile);
        if (res.success && res.rows && res.rows.length > 0) {
            const excelRows = res.rows;
            const headerRow = excelRows[0] || [];
            const colNameIndex = headerRow.findIndex(h => h && h.toString().toLowerCase().trim() === "columnname");
            const abbrIndex = headerRow.findIndex(h => h && h.toString().toLowerCase().trim() === "abbreviation");

            if (colNameIndex === -1 || abbrIndex === -1) {
                toast.error("Excel sheet must contain 'ColumnName' and 'Abbreviation' headers.");
                return;
            }

            const parsedData = [];
            const seenColumns = new Set();
            const duplicates = [];

            for (let i = 1; i < excelRows.length; i++) {
                const row = excelRows[i];
                if (!row || row.length === 0) continue;
                const colName = (row[colNameIndex] || "").toString().trim();
                const abbr = (row[abbrIndex] || "").toString().trim();

                if (!colName) continue;

                if (seenColumns.has(colName.toLowerCase())) {
                    duplicates.push(colName);
                } else {
                    seenColumns.add(colName.toLowerCase());
                    parsedData.push({
                        ColumnName: colName,
                        Abbreviation: abbr
                    });
                }
            }

            if (duplicates.length > 0) {
                toast.error(`Duplicate ColumnNames found in excel: ${duplicates.join(", ")}`);
                return;
            }

            // Sync with existing list (merge/replace abbreviation values)
            setColumnAbbrList(prev => prev.map(existing => {
                const existingCol = existing.ColumnName ?? existing.columnName ?? "";
                const imported = parsedData.find(p => p.ColumnName.toLowerCase() === existingCol.toLowerCase());
                return imported ? { 
                    ...existing, 
                    Abbreviation: imported.Abbreviation,
                    abbreviation: imported.Abbreviation
                } : existing;
            }));

            toast.success("Column Abbreviations imported into grid! Click 'Save All' to sync with server.");
            setImportModal(false);
            setImportFile(null);
        } else {
            toast.error("Failed to parse Excel file");
        }
    };

    const filteredColumnAbbrs = useMemo(() => {
        return columnAbbrList.filter(item => {
            const name = item.ColumnName || item.columnName || "";
            const value = item.Abbreviation || item.abbreviation || "";
            return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   value.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [columnAbbrList, searchQuery]);

    document.title = "Column Abbreviations | Velzon";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Column Abbreviations")} pageTitle="Masters" />
                    <ToastContainer closeButton={false} limit={1} />
                    
                    <Row>
                        <Col lg={12}>
                            <Card className="shadow">
                                <CardHeader className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 bg-transparent border-bottom">
                                    <h5 className="card-title mb-0 fs-16 fw-semibold text-primary">
                                        <i className="ri-character-recognition-line align-middle me-1"></i> Column Abbreviations
                                    </h5>
                                    
                                    <div className="d-flex flex-wrap align-items-center gap-2">
                                        <div className="search-box me-md-2">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder={t("Search columns...")}
                                            />
                                            <i className="bx bx-search-alt search-icon"></i>
                                        </div>
                                        <Button color="outline-primary" size="sm" onClick={() => setImportModal(true)}>
                                            <i className="ri-upload-2-line align-middle me-1"></i> Import Excel
                                        </Button>
                                        <Button color="primary" size="sm" onClick={handleSaveAllAbbr}>
                                            <i className="ri-save-line align-middle me-1"></i> Save All Changes
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center py-5">
                                            <Spinner color="primary" />
                                            <span className="ms-2">{t("Loading abbreviations...")}</span>
                                        </div>
                                    ) : (
                                        <div className="table-responsive table-card" style={{ maxHeight: "600px", overflowY: "auto" }}>
                                            <table className="table table-bordered table-striped align-middle table-nowrap mb-0">
                                                <thead className="table-light sticky-top">
                                                    <tr>
                                                        <th style={{ width: "50%" }}>{t("Column Name")}</th>
                                                        <th>{t("Abbreviation Value")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredColumnAbbrs.length > 0 ? (
                                                        filteredColumnAbbrs.map((item, idx) => {
                                                            const itemId = item.Id ?? item.id ?? idx;
                                                            return (
                                                                <tr key={itemId}>
                                                                    <td className="fw-medium text-body">{item.ColumnName || item.columnName}</td>
                                                                    <td>
                                                                        <Input
                                                                            type="text"
                                                                            className="form-control form-control-sm border-light-subtle bg-transparent"
                                                                            value={item.Abbreviation ?? item.abbreviation ?? ""}
                                                                            onChange={(e) => handleAbbrChange(itemId, e.target.value)}
                                                                            placeholder={t("e.g. SHP, CRT, AMT")}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="2" className="text-center py-4">{t("No columns found.")}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Column Abbreviations Import Modal */}
                    <Modal isOpen={importModal} toggle={() => setImportModal(false)} centered>
                        <ModalHeader 
                            className="bg-primary p-3" 
                            toggle={() => setImportModal(false)}
                            close={<button className="btn-close btn-close-white" onClick={() => setImportModal(false)}></button>}
                        >
                            <span className="text-white">{t("Import File")}</span>
                        </ModalHeader>
                        <ModalBody className="p-4">
                            <div className="mb-4">
                                <Label className="form-label fw-bold text-uppercase fs-12 text-muted mb-2">{t("Select File to Import")}</Label>
                                <Input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={(e) => setImportFile(e.target.files[0])}
                                />
                                <small className="text-muted mt-2 d-block">
                                    Excel file must contain two headers: <strong>{t("ColumnName")}</strong> {t("and")} <strong>{t("Abbreviation")}</strong>.
                                </small>
                            </div>
                            
                            <div className="border-top pt-3">
                                <Label className="form-label fw-bold text-uppercase fs-12 text-muted mb-2">{t("Download Column Abbreviation Format")}</Label>
                                <div className="mt-1">
                                    <Button color="primary" onClick={handleDownloadAbbrTemplate} className="d-flex align-items-center gap-1">
                                        <i className="ri-download-cloud-2-line fs-16"></i> Download
                                    </Button>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter className="bg-light-subtle">
                            <Button color="light" onClick={() => setImportModal(false)}>{t("Close")}</Button>
                            <Button color="primary" onClick={handleImportAbbr} disabled={!importFile}>{t("Accept")}</Button>
                        </ModalFooter>
                    </Modal>

                </Container>
            </div>
        </React.Fragment>
    );
};

export default ColumnAbbreviationsList;
