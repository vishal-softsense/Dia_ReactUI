import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { getParcelItemMasters, deleteParcelItemMaster } from "../../../helpers/fakebackend_helper";
import { exportToExcel } from "../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';

const ParcelItemMasterList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [parcelItems, setParcelItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [lotNo, setLotNo] = useState("");

    useEffect(() => {
        if (location.state?.successMessage) {
            toast.success(location.state.successMessage);
            window.history.replaceState({}, document.title);
        }
        fetchParcelItems();
    }, [location.state]);

    const fetchParcelItems = async (filter = "") => {
        setLoading(true);
        try {
            const response = await getParcelItemMasters(filter);
            if (response.success || response.Success) {
                setParcelItems(response.data || response.Data || []);
            } else {
                toast.error(response.message || response.Message || "Failed to fetch parcel items");
            }
        } catch (error) {
            toast.error("Failed to fetch parcel items");
        }
        setLoading(false);
    };

    const handleSearch = () => {
        fetchParcelItems(searchText);
    };

    const handleDeleteClick = (id, lotNo) => {
        setItemToDelete(id);
        setLotNo(lotNo);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            try {
                const response = await deleteParcelItemMaster(itemToDelete);
                if (response.success || response.Success) {
                    toast.success(response.message || response.Message || "Parcel Item deleted successfully");
                    fetchParcelItems(searchText);
                } else {
                    toast.error(response.message || response.Message || "Problem in deleting item");
                }
            } catch (error) {
                const errMsg = typeof error === 'string' ? error : (error.response?.data?.message || error.response?.data?.Message || "Failed to delete parcel item");
                toast.error(errMsg);
            }
            setDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const handleExportExcel = async () => {
        if (parcelItems.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Lot No", "Item Name", "Shape", "Color", "Size", "Clarity", "Sieve", "Weight", "Purchase Amount"];
        const rows = parcelItems.map((item) => [
            item.lotNo || item.LotNo || "",
            item.itemName || item.ItemName || "",
            item.shapeId || item.ShapeId || "",
            item.colorId || item.ColorId || "",
            item.sizeId || item.SizeId || "",
            item.clarityId || item.ClarityId || "",
            item.sieveId || item.SieveId || "",
            item.weight || item.Weight || 0,
            item.purchaseAmount || item.PurchaseAmount || 0
        ]);

        const result = await exportToExcel(headers, rows, "ParcelItems", "ParcelItemMasterList");
        if (!result.success) {
            toast.error("Failed to generate Excel file.");
        }
    };

    const columns = useMemo(
        () => [
            {
                header: t("Actions"),
                id: "actions",
                enableColumnFilter: false,
                cell: (cellProps) => {
                    const id = cellProps.row.original.itemCode || cellProps.row.original.ItemCode;
                    return (
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-soft-primary btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    padding: "0"
                                }}
                                onClick={() => navigate(`/parcel/Edit-ParcelItemMaster?id=${id}`)}
                                title={t("Edit")}
                            >
                                <i className="ri-pencil-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                            <button
                                className="btn btn-soft-danger btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    padding: "0"
                                }}
                                onClick={() => handleDeleteClick(id,
                                    cellProps.row.original.lotNo || cellProps.row.original.LotNo)}
                                title={t("Delete")}
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: t("Lot No"),
                accessorKey: "lotNo",
                accessorFn: (row) => row.lotNo || row.LotNo,
                enableColumnFilter: true,
            },
            {
                header: t("Item Name"),
                accessorKey: "itemName",
                accessorFn: (row) => row.itemName || row.ItemName,
                enableColumnFilter: true,
            },
            {
                header: t("Shape"),
                accessorKey: "shapeId",
                accessorFn: (row) => row.shapeId || row.ShapeId,
                enableColumnFilter: true,
            },
            {
                header: t("Color"),
                accessorKey: "colorId",
                accessorFn: (row) => row.colorId || row.ColorId,
                enableColumnFilter: true,
            },
            {
                header: t("Size"),
                accessorKey: "sizeId",
                accessorFn: (row) => row.sizeId || row.SizeId,
                enableColumnFilter: true,
            },
            {
                header: t("Clarity"),
                accessorKey: "clarityId",
                accessorFn: (row) => row.clarityId || row.ClarityId,
                enableColumnFilter: true,
            },
            {
                header: t("Sieve"),
                accessorKey: "sieveId",
                accessorFn: (row) => row.sieveId || row.SieveId,
                enableColumnFilter: true,
            },
            {
                header: t("Weight"),
                accessorKey: "weight",
                accessorFn: (row) => row.weight || row.Weight,
                enableColumnFilter: true,
                cell: (cellProps) => {
                    const val = cellProps.getValue();
                    return typeof val === 'number' ? val.toFixed(3) : val;
                }
            },
            {
                header: t("Purchase Amount"),
                accessorKey: "purchaseAmount",
                accessorFn: (row) => row.purchaseAmount || row.PurchaseAmount,
                enableColumnFilter: true,
                cell: (cellProps) => {
                    const val = cellProps.getValue();
                    return typeof val === 'number' ? val.toFixed(2) : val;
                }
            }

        ],
        [navigate, t]);

    document.title = `${t("Parcel Item Master")} | ${t("Admin")}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Parcel Item Master")} pageTitle={t("Stock & Account")} />
                    <Row>
                        <Col lg={12}>
                            <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                                <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
                                    <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary d-flex align-items-center gap-2">
                                        <i className="ri-archive-line fs-20 text-primary"></i>
                                        {t("Parcel Items")}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <Link to="/parcel/add-ParcelItemMaster" className="btn btn-primary add-btn rounded-3 d-inline-flex align-items-center gap-1">
                                            <i className="ri-add-line align-bottom"></i> {t("Add Parcel Item")}
                                        </Link>
                                        <Button className="btn-soft-success rounded-3" onClick={handleExportExcel} title={t("Export to Excel")} style={{ height: "37.5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
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
                                            data={parcelItems}
                                            isGlobalFilter
                                            isPagination
                                            customPageSize={500}
                                            customPageSizes={[500, 1000, 1500]}
                                            SearchPlaceholder={t("Filter items...")}
                                            divClass="table-responsive table-card mb-0"
                                            tableClass="table table-bordered table-hover table-sm align-middle mb-0"
                                            theadClass="table-light"
                                        />
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} className="modal-dialog-centered">
                <ModalHeader className="bg-danger pb-3 text-white" toggle={() => setDeleteModal(false)}>{t("Confirm Delete")}</ModalHeader>
                <ModalBody>
                    <div className="mt-2 text-center">
                        <lord-icon
                            src="https://cdn.lordicon.com/gsqxdxog.json"
                            trigger="loop"
                            colors="primary:#f7b84b,secondary:#f06548"
                            style={{ width: "100px", height: "100px" }}
                        ></lord-icon>

                        <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            <h2 className="fw-bold">{t("Are You Sure ??")}</h2>

                            <p className="text-muted mb-1">
                                {t("Selected record will be Removed !!")}
                            </p>

                            <p className="mb-0">
                                <strong>{t("LotNo")} :</strong> {lotNo}
                            </p>
                        </div>
                    </div>

                    <div className="d-flex gap-3 justify-content-center mt-4 mb-2">
                        <button
                            type="button"
                            className="btn btn-primary px-4"
                            onClick={handleDeleteConfirm}
                        >
                            {t("Yes, remove it")}
                        </button>

                        <button
                            type="button"
                            className="btn btn-danger px-4"
                            onClick={() => setDeleteModal(false)}
                        >
                            {t("Cancel")}
                        </button>
                    </div>
                </ModalBody>
            </Modal>
            <ToastContainer autoClose={2000} />
        </React.Fragment>
    );
};

export default ParcelItemMasterList;