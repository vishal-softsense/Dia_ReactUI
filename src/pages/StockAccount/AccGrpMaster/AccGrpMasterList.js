import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { getAccGrpMasters, deleteAccGrpMaster } from "../../../helpers/fakebackend_helper";
import { exportToExcel } from "../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';

const AccGrpMasterList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [accGroups, setAccGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        if (location.state?.successMessage) {
            toast.success(location.state.successMessage);
            window.history.replaceState({}, document.title);
        }
        fetchAccGroups();
    }, [location.state]);

    const fetchAccGroups = async (filter = "") => {
        setLoading(true);

        const response = await getAccGrpMasters(filter);

        console.log("API Response", response);
        console.log("Data Length", response.data?.length || response.Data?.length);
        console.table(response.data || response.Data);

        if (response.success || response.Success) {
            setAccGroups(response.data || response.Data || []);
        }

        setLoading(false);
    };

    const handleSearch = () => {
        fetchAccGroups(searchText);
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            try {
                const response = await deleteAccGrpMaster(itemToDelete);
                if (response.success || response.Success) {
                    toast.success(response.message || response.Message || "Account Group deleted successfully");
                    fetchAccGroups(searchText);
                } else {
                    toast.error(response.message || response.Message || "Problem in deleting account group");
                }
            } catch (error) {
                const errMsg = typeof error === 'string' ? error : (error.response?.data?.message || error.response?.data?.Message || "Failed to delete account group");
                toast.error(errMsg);
            }
            setDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const handleExportExcel = async () => {
        if (accGroups.length === 0) {
            toast.warning("No data available to export");
            return;
        }

        const headers = ["Code", "Account/Group Name", "Under Group Name", "Account Type", "Currency", "Credit/Debit", "Opening Balance", "Country"];
        const rows = accGroups.map((item) => [
            item.accGrpCode || item.AccGrpCode || "",
            item.accGrpName || item.AccGrpName || "",
            item.underGroupName || item.UnderGroupName || "",
            item.accountType || item.AccountType || "",
            item.currency || item.Currency || "",
            item.oBalance || item.OBalance || 0,
            item.oDrCr || item.ODrCr || "",
            item.country || item.Country || ""
        ]);

        const result = await exportToExcel(headers, rows, "AccountGroups", "AccountGroupMasterList");
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
                    const id = cellProps.row.original.accGrpCode || cellProps.row.original.AccGrpCode;
                    return (
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-soft-primary btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    padding: "0"
                                }}
                                onClick={() => navigate(`/account/Edit-accountgroup?id=${id}`)}
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
                                onClick={() => handleDeleteClick(id)}
                                title={t("Delete")}
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                }
            },
            {
                header: t("Account/Group Name"),
                accessorKey: "accGrpName",
                accessorFn: (row) => row.accGrpName || row.AccGrpName,
                enableColumnFilter: true,
            },
            {
                header: t("Under Group Name"),
                accessorKey: "underGroupName",
                accessorFn: (row) => row.underGroupName || row.UnderGroupName,
                enableColumnFilter: true,
            },
            {
                header: t("Account Type"),
                accessorKey: "accountType",
                accessorFn: (row) => row.accountType || row.AccountType,
                enableColumnFilter: true,
            },
            {
                header: t("Currency"),
                accessorKey: "currency",
                accessorFn: (row) => row.currency || row.Currency,
                enableColumnFilter: true,
            },
            {
                header: t("Credit/Debit"),
                accessorKey: "oDrCr",
                accessorFn: (row) => row.oDrCr || row.ODrCr,
                enableColumnFilter: true,
            },
            {
                header: t("Opening Balance"),
                accessorKey: "oBalance",
                accessorFn: (row) => row.oBalance || row.OBalance,
                enableColumnFilter: true,
                cell: (cellProps) => {
                    const val = cellProps.getValue();
                    return typeof val === 'number' ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val;
                }
            },

            {
                header: t("Country"),
                accessorKey: "country",
                accessorFn: (row) => row.country || row.Country,
                enableColumnFilter: true,
            }
        ],
        [navigate, t]);

    document.title = `${t("Account Group Master")} | ${t("Admin")}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Account Group Master")} pageTitle={t("Stock & Account")} />
                    <Row>
                        <Col lg={12}>
                            <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                                <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
                                    <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary d-flex align-items-center gap-2">
                                        <i className="ri-folder-user-line fs-20 text-primary"></i>
                                        {t("Account Groups")}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <Link to="/account/add-accountgroup" className="btn btn-primary add-btn rounded-3 d-inline-flex align-items-center gap-1">
                                            <i className="ri-add-line align-bottom"></i> {t("Add Account Group")}
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
                                            data={accGroups}
                                            getRowId={(row) => row.accGrpCode}
                                            isGlobalFilter={true}
                                            customPageSize={500}
                                            customPageSizes={[500, 1000, 1500]}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Filter account groups...")}
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
                        <lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style={{ width: "100px", height: "100px" }}></lord-icon>
                        <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            <h4>{t("Are you sure?")}</h4>
                            <p className="text-muted mx-4 mb-0">{t("Do you really want to delete this account group? This action cannot be undone.")}</p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <button type="button" className="btn w-sm btn-light" onClick={() => setDeleteModal(false)}>{t("Cancel")}</button>
                        <button type="button" className="btn w-sm btn-danger" id="delete-record" onClick={handleDeleteConfirm}>{t("Yes, Delete It!")}</button>
                    </div>
                </ModalBody>
            </Modal>
            <ToastContainer autoClose={2000} />
        </React.Fragment>
    );
};

export default AccGrpMasterList;