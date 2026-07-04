import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody, CardHeader, Button, Col, Row } from "reactstrap";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import TableContainer from "../../../Components/Common/TableContainer";
import { getMountingStock } from "../../../helpers/fakebackend_helper";
import { exportToExcel } from "../../../helpers/excel_helper";

const MountingStockList = () => {
    const { t } = useTranslation();
    useEffect(() => {

        document.title = "Mounting Stock Master | DiaJewSoft";

    }, []);
    const [mountingStock, setMountingStock] = useState([]);
    const [loading, setLoading] = useState(false);
    const handleDelete = (jewCode) => {

        console.log(jewCode);

    };
    useEffect(() => {
        getMountingStockList();
    }, []);



    const getMountingStockList = async () => {

        setLoading(true);

        try {

            const response = await getMountingStock();

            console.log("Full Response :", response);

            const success =
                response?.Success ??
                response?.success ??
                response?.data?.Success ??
                response?.data?.success;

            const data =
                response?.Data ??
                response?.data?.Data ??
                response?.data ??
                [];

            console.log("Success :", success);
            console.log("Data :", data);

            if (success) {

                setMountingStock(Array.isArray(data) ? [...data].reverse() : []);

            } else {

                toast.error(
                    response?.Message ||
                    response?.message ||
                    response?.data?.Message ||
                    response?.data?.message ||
                    "Failed to fetch mounting stock."
                );

            }

        } catch (error) {

            console.error(error);

            toast.error("Failed to fetch mounting stock.");

        } finally {

            setLoading(false);

        }

    };
    const handleExportExcel = async () => {

        if (mountingStock.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = [
            "Stock ID",
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
    const columns = useMemo(() => [

        {
            header: t("Action"),
            id: "action",
            enableColumnFilter: false,
            cell: ({ row }) => (
                <div className="d-flex gap-2">

                    <Link
                        to={`/master/edit-Mounting-stock?id=${row.original.JewCode}`}
                        className="btn btn-soft-primary btn-sm"
                    >
                        <i className="ri-pencil-fill"></i>
                    </Link>

                    <button
                        className="btn btn-soft-danger btn-sm"
                        onClick={() => handleDelete(row.original.JewCode)}
                    >
                        <i className="ri-delete-bin-fill"></i>
                    </button>

                </div>
            )
        },

        {
            header: t("StockID"),
            accessorKey: "stock_ID",
            enableColumnFilter: true,
        },

        {
            header: t("JewelleryCategory"),
            accessorKey: "mountCategory",
            enableColumnFilter: true,
        },

        {
            header: t("MetalType"),
            accessorKey: "metalType",
            enableColumnFilter: true,
        },

        {
            header: t("Purity"),
            accessorKey: "purity",
            enableColumnFilter: true,
        },

        {
            header: t("DiamondWeight"),
            accessorKey: "totalDiamondCarat",
            enableColumnFilter: true,
        },

        {
            header: t("GrossWeight"),
            accessorKey: "grossWeight",
            enableColumnFilter: true,
            cell: ({ getValue }) => {

                const value = getValue();

                return value
                    ? Number(value).toFixed(3)
                    : "0.000";
            }
        },

        {
            header: t("NetWeight"),
            accessorKey: "netWeight",
            enableColumnFilter: true,
            cell: ({ getValue }) => {

                const value = getValue();

                return value
                    ? Number(value).toFixed(3)
                    : "0.000";
            }
        },

        {
            header: t("MetalAmount"),
            accessorKey: "totalMetalAmount",
            enableColumnFilter: true,
            cell: ({ getValue }) => {

                const value = getValue();

                return value
                    ? Number(value).toFixed(3)
                    : "0.000";
            }
        }

    ], []);
    return (
        <React.Fragment>
            <div className="page-content">

                <div className="container-fluid">

                    <Row>

                        <Col lg={12}>

                            <Card>

                                <CardHeader className="border-bottom d-flex justify-content-between align-items-center">

                                    <h4 className="card-title mb-0">
                                        Mounting Stock Master
                                    </h4>

                                    <div className="d-flex gap-2">
                                        <Link to="/master/add-stock-Mounting" className="btn btn-primary add-btn rounded-3 d-inline-flex align-items-center gap-1">
                                            <i className="ri-add-line align-bottom"></i> {t("Add Mounting Stock")}
                                        </Link>
                                        <Button className="btn-soft-success rounded-3" onClick={handleExportExcel} title={t("Export to Excel")} style={{ height: "37.5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                            <i className="ri-file-excel-2-line fs-18"></i>
                                        </Button>
                                    </div>

                                </CardHeader>

                                <CardBody>
                                    {loading ? (

                                        <div className="text-center py-5">
                                            <div className="spinner-border text-primary"></div>
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

                </div>

            </div>

        </React.Fragment>
    );
};

export default MountingStockList;