import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import { getMountingStockList, deleteMountingStock } from "../../../helpers/fakebackend_helper";
import { exportToExcel } from "../../../helpers/excel_helper";
import { toast, ToastContainer } from "react-toastify";

const MountingStockList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [mountingStock, setMountingStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [stockId, setStockId] = useState("");

    useEffect(() => {
        if (location.state?.successMessage) {
            toast.success(location.state.successMessage);
            window.history.replaceState({}, document.title);
        }
        fetchMountingStock();
    }, [location.state]);

    const fetchMountingStock = async () => {
        setLoading(true);
        try {
            const response = await getMountingStockList();
            if (response.success || response.Success) {
                const data = response.data || response.Data || [];
                setMountingStock(Array.isArray(data) ? [...data].reverse() : []);
            } else {
                toast.error(
                    response.message ||
                    response.Message ||
                    response.data?.Message ||
                    "Failed to fetch mounting stock."
                );
            }
        } catch (error) {
            const errMsg =
                typeof error === "string"
                    ? error
                    : error.response?.data?.message ||
                      error.response?.data?.Message ||
                      "Failed to fetch mounting stock.";
            toast.error(errMsg);
        }
        setLoading(false);
    };

    const handleDeleteClick = (jewCode, stockId) => {
        setItemToDelete(jewCode);
        setStockId(stockId);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            try {
                const response = await deleteMountingStock(itemToDelete);
                if (response.success || response.Success) {
                    toast.success(response.message || response.Message || "Mounting stock deleted successfully");
                    fetchMountingStock();
                } else {
                    toast.error(response.message || response.Message || "Failed to delete mounting stock");
                }
            } catch (error) {
                const errMsg = typeof error === 'string' ? error : (error.response?.data?.message || error.response?.data?.Message || "Failed to delete mounting stock");
                toast.error(errMsg);
            }
            setDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const handleExportExcel = async () => {
        if (mountingStock.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = [
            "Stock ID",
            "JewelleryPcs",
            "Jewellery Category",
            "Metal Type",
            "Purity",
            "Diamond Weight",
            "Gross Weight",
            "Net Weight",
            "Metal Amount"
        ];

        const rows = mountingStock.map((item) => [
            item.stock_ID || item.Stock_ID || "",
            item.pcs ?? item.Pcs ?? 0,
            item.mountCategory || item.MountCategory || item.designName || "",
            item.metalType || item.MetalType || "",
            item.purity || item.Purity || "",
            item.totalDiamondCarat || item.TotalDiamondCarat || 0,
            Number(item.grossWeight || item.GrossWeight || 0).toFixed(3),
            Number(item.netWeight || item.NetWeight || 0).toFixed(3),
            Number(item.totalMetalAmount || item.TotalMetalAmount || 0).toFixed(2)
        ]);

        const result = await exportToExcel(
            headers,
            rows,
            "MountingStock",
            "MountingStockMasterList"
        );

        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    const columns = useMemo(
        () => [
            {
                header: t("Action"),
                id: "action",
                enableColumnFilter: false,
                cell: (cellProps) => {
                    const id = cellProps.row.original.jewCode || cellProps.row.original.JewCode;
                    return (
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-soft-primary btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px", padding: "0" }}
                                onClick={() => navigate(`/master/edit-Mounting-stock?id=${id}`)}
                                title={t("Edit")}
                            >
                                <i className="ri-pencil-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                            <button
                                className="btn btn-soft-danger btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px", padding: "0" }}
                                onClick={() => handleDeleteClick(id,
                                    cellProps.row.original.stock_ID || cellProps.row.original.Stock_ID
                                )}
                                title={t("Delete")}
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: t("StockID"),
                accessorKey: "stock_ID",
                accessorFn: (row) => row.stock_ID || row.Stock_ID,
                enableColumnFilter: true,
            },
            {
                header: t("JewelleryPcs"),
                accessorKey: "pcs",
                accessorFn: (row) => row.pcs ?? row.Pcs ?? 0,
                enableColumnFilter: true,
            },
            {
                header: t("JewelleryCategory"),
                accessorKey: "mountCategory",
                accessorFn: (row) => row.mountCategory || row.MountCategory || row.designName || "",
                enableColumnFilter: true,
            },
            {
                header: t("MetalType"),
                accessorKey: "metalType",
                accessorFn: (row) => row.metalType || row.MetalType,
                enableColumnFilter: true,
            },
            {
                header: t("Purity"),
                accessorKey: "purity",
                accessorFn: (row) => row.purity || row.Purity,
                enableColumnFilter: true,
            },
            {
                header: t("DiamondWeight"),
                accessorKey: "totalDiamondCarat",
                accessorFn: (row) => row.totalDiamondCarat || row.TotalDiamondCarat,
                enableColumnFilter: true,
            },
            {
                header: t("GrossWeight"),
                accessorKey: "grossWeight",
                accessorFn: (row) => row.grossWeight || row.GrossWeight,
                enableColumnFilter: true,
                cell: (cellProps) => {
                    const val = cellProps.getValue();
                    return typeof val === "number" ? val.toFixed(3) : val || "0.000";
                }
            },
            {
                header: t("NetWeight"),
                accessorKey: "netWeight",
                accessorFn: (row) => row.netWeight || row.NetWeight,
                enableColumnFilter: true,
                cell: (cellProps) => {
                    const val = cellProps.getValue();
                    return typeof val === "number" ? val.toFixed(3) : val || "0.000";
                }
            },
            {
                header: t("MetalAmount"),
                accessorKey: "totalMetalAmount",
                accessorFn: (row) => row.totalMetalAmount || row.TotalMetalAmount,
                enableColumnFilter: true,
                cell: (cellProps) => {
                    const val = cellProps.getValue();
                    return typeof val === "number" ? val.toFixed(2) : val || "0.00";
                }
            }
        ],
        [navigate, t]
    );

    document.title = `${t("Mounting Stock Master")} | ${t("Admin")}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Mounting Stock Master")} pageTitle={t("Stock & Account")} />
                    <Row>
                        <Col lg={12}>
                            <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                                <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
                                    <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary d-flex align-items-center gap-2">
                                        <i className="ri-archive-line fs-20 text-primary"></i>
                                        {t("Mounting Stock Master")}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <Link
                                            to="/master/add-stock-Mounting"
                                            className="btn btn-primary add-btn rounded-3 d-inline-flex align-items-center gap-1"
                                        >
                                            <i className="ri-add-line align-bottom"></i> {t("Add Mounting Stock")}
                                        </Link>
                                        <Button
                                            className="btn-soft-success rounded-3"
                                            onClick={handleExportExcel}
                                            title={t("Export to Excel")}
                                            style={{
                                                height: "37.5px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >
                                            <i className="ri-file-excel-2-line fs-18"></i>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {loading ? (
                                        <div className="text-center my-3">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <TableContainer
                                            columns={columns}
                                            data={mountingStock}
                                            isGlobalFilter={true}
                                            customPageSize={500}
                                            customPageSizes={[500, 1000, 1500]}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Filter items...")}
                                        />
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
            <ToastContainer autoClose={2000} />
            <DeleteModal
                show={deleteModal}
                onDeleteClick={handleDeleteConfirm}
                onCloseClick={() => setDeleteModal(false)}
                stockId={stockId}
            />
        </React.Fragment>
    );
};

export default MountingStockList;
