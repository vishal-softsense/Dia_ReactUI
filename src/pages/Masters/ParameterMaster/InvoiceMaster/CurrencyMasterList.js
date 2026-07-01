import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button } from "reactstrap";
import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { getCurrencyMasters } from "../../../../helpers/fakebackend_helper";
import { exportToExcel } from "../../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';
import { useTranslation } from "react-i18next";

const CurrencyMasterList = () => {
    const { t } = useTranslation();
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCurrencies();
    }, []);

    const fetchCurrencies = async () => {
        setLoading(true);
        try {
            const response = await getCurrencyMasters();
            if (response.success || response.Success) {
                setCurrencies(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch Currency Master data");
            }
        } catch (error) {
            toast.error("Failed to fetch Currency Master data");
        }
        setLoading(false);
    };

    // Client-side Excel Exporter
    const handleExportData = async () => {
        if (currencies.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = [
            "ID", 
            "Name", 
            "Symbol", 
            "Master Currency Operator", 
            "Stock Currency Operator", 
            "Master Currency Rate", 
            "Stock Currency Rate"
        ];
        const rows = currencies.map(item => [
            item.id || item.ID || "",
            item.name || item.Name || "",
            item.symbol || item.Symbol || "",
            item.masterCurrencyOperator || item.MasterCurrencyOperator || "",
            item.stockCurrencyOperator || item.StockCurrencyOperator || "",
            item.masterCurrencyRate !== undefined ? item.masterCurrencyRate : (item.MasterCurrencyRate !== undefined ? item.MasterCurrencyRate : ""),
            item.stockCurrencyRate !== undefined ? item.stockCurrencyRate : (item.StockCurrencyRate !== undefined ? item.StockCurrencyRate : "")
        ]);

        const result = await exportToExcel(headers, rows, "Currencies", "CurrencyMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    // Table Columns Configuration
    const columns = useMemo(
        () => [
            {
                header: "ID",
                accessorKey: "id",
                accessorFn: (row) => row.id || row.ID,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Name",
                accessorKey: "name",
                accessorFn: (row) => row.name || row.Name,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Symbol",
                accessorKey: "symbol",
                accessorFn: (row) => row.symbol || row.Symbol,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Master Currency Operator",
                accessorKey: "masterCurrencyOperator",
                accessorFn: (row) => row.masterCurrencyOperator || row.MasterCurrencyOperator,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Stock Currency Operator",
                accessorKey: "stockCurrencyOperator",
                accessorFn: (row) => row.stockCurrencyOperator || row.StockCurrencyOperator,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Master Currency Rate",
                accessorKey: "masterCurrencyRate",
                accessorFn: (row) => row.masterCurrencyRate !== undefined ? row.masterCurrencyRate : row.MasterCurrencyRate,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Stock Currency Rate",
                accessorKey: "stockCurrencyRate",
                accessorFn: (row) => row.stockCurrencyRate !== undefined ? row.stockCurrencyRate : row.StockCurrencyRate,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const val = row.getValue(id);
                    return val ? String(val).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            }
        ],
        []
    );

    document.title = "Currency Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Currency Master")} pageTitle="Masters" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">{t("Currency Master List")}</h5>
                                    <div className="d-flex gap-2">
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
                                            data={currencies}
                                            isGlobalFilter={true}
                                            customPageSize={50}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Search Currencies...")}
                                        />
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
            <ToastContainer closeButton={false} limit={1} />
        </React.Fragment>
    );
};

export default CurrencyMasterList;
