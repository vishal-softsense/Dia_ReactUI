import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { getParcelItemMasters, deleteParcelItemMaster } from "../../../helpers/fakebackend_helper";
import { toast } from 'react-toastify';

const ParcelItemMasterList = () => {
    const navigate = useNavigate();
    const [parcelItems, setParcelItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        fetchParcelItems();
    }, []);

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

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
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
                toast.error(error.response?.data?.message || error.response?.data?.Message || "Failed to delete parcel item");
            }
            setDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const exportToCsv = () => {
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

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ParcelItemMasterList.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns = useMemo(
        () => [
            {
                header: "Actions",
                id: "actions",
                enableColumnFilter: false,
                cell: (cellProps) => {
                    const id = cellProps.row.original.itemCode || cellProps.row.original.ItemCode;
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
                                onClick={() => navigate(`/parcel/Edit-ParcelItemMaster?id=${id}`)}
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
                                onClick={() => handleDeleteClick(id)}
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: "Lot No",
                accessorKey: "lotNo",
                accessorFn: (row) => row.lotNo || row.LotNo,
                enableColumnFilter: true,
            },
            {
                header: "Item Name",
                accessorKey: "itemName",
                accessorFn: (row) => row.itemName || row.ItemName,
                enableColumnFilter: true,
            },
            {
                header: "Shape",
                accessorKey: "shapeId",
                accessorFn: (row) => row.shapeId || row.ShapeId,
                enableColumnFilter: true,
            },
            {
                header: "Color",
                accessorKey: "colorId",
                accessorFn: (row) => row.colorId || row.ColorId,
                enableColumnFilter: true,
            },
            {
                header: "Size",
                accessorKey: "sizeId",
                accessorFn: (row) => row.sizeId || row.SizeId,
                enableColumnFilter: true,
            },
            {
                header: "Clarity",
                accessorKey: "clarityId",
                accessorFn: (row) => row.clarityId || row.ClarityId,
                enableColumnFilter: true,
            },
            {
                header: "Sieve",
                accessorKey: "sieveId",
                accessorFn: (row) => row.sieveId || row.SieveId,
                enableColumnFilter: true,
            },
            {
                header: "Weight",
                accessorKey: "weight",
                accessorFn: (row) => row.weight || row.Weight,
                enableColumnFilter: true,
                cell: (cellProps) => {
                    const val = cellProps.getValue();
                    return typeof val === 'number' ? val.toFixed(3) : val;
                }
            },
            {
                header: "Purchase Amount",
                accessorKey: "purchaseAmount",
                accessorFn: (row) => row.purchaseAmount || row.PurchaseAmount,
                enableColumnFilter: true,
                cell: (cellProps) => {
                    const val = cellProps.getValue();
                    return typeof val === 'number' ? val.toFixed(2) : val;
                }
            }

        ],
        [navigate]
    );

    document.title = "Parcel Item Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Parcel Item Master" pageTitle="Stock & Account" />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">Parcel Items</h5>
                                    <div className="d-flex gap-2">
                                        <Link to="/parcel/add-ParcelItemMaster" className="btn btn-primary add-btn">
                                            <i className="ri-add-line align-bottom me-1"></i> Add Parcel Item
                                        </Link>
                                        <Button className="btn-soft-success" onClick={exportToCsv} title="CSV Export">
                                            <i className="ri-file-excel-2-line align-bottom"></i>
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
                                            isGlobalFilter={true}
                                            customPageSize={500}
                                            customPageSizes={[500, 1000, 1500]}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder="Filter items..."
                                        />
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
                <ModalHeader toggle={() => setDeleteModal(false)}>Confirm Delete</ModalHeader>
                <ModalBody>
                    <div className="mt-2 text-center">
                        <lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style={{ width: "100px", height: "100px" }}></lord-icon>
                        <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            <h4>Are you sure?</h4>
                            <p className="text-muted mx-4 mb-0">Do you really want to delete this parcel item? This action cannot be undone.</p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <button type="button" className="btn w-sm btn-light" onClick={() => setDeleteModal(false)}>Cancel</button>
                        <button type="button" className="btn w-sm btn-danger" id="delete-record" onClick={handleDeleteConfirm}>Yes, Delete It!</button>
                    </div>
                </ModalBody>
            </Modal>
        </React.Fragment>
    );
};

export default ParcelItemMasterList;
