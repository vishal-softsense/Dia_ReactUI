import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody } from "reactstrap";
import { useSelector, useDispatch } from "react-redux";
import { getUsers, deleteUser, fetchUserDropdown } from "../../../slices/thunks";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { useTranslation } from "react-i18next";

const ListUser = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const { users, userDropdown, loading } = useSelector((state) => ({
        users: state.UserManagement.users,
        userDropdown: state.UserManagement.userDropdown,
        loading: state.UserManagement.loading,
    }));

    const [selectedUserFilter, setSelectedUserFilter] = useState("All");
    const [appliedFilter, setAppliedFilter] = useState("All");

    const [deleteModal, setDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    useEffect(() => {
        dispatch(getUsers());
        dispatch(fetchUserDropdown());
    }, [dispatch]);

    // Filter users locally based on the applied filter value
    const filteredUsers = React.useMemo(() => {
        if (appliedFilter === "All") return users;
        return users.filter(u => u.userID.toString() === appliedFilter);
    }, [users, appliedFilter]);

    const handleSearch = () => {
        setAppliedFilter(selectedUserFilter);
    };

    const handleDeleteClick = (id) => {
        setUserToDelete(id);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = () => {
        if (userToDelete) {
            dispatch(deleteUser(userToDelete));
            setDeleteModal(false);
            setUserToDelete(null);
        }
    };

    const columns = React.useMemo(
        () => [
            {
                header: "Sr. No.",
                accessorKey: "userID",
                enableColumnFilter: false,
                cell: (cellProps) => {
                    return cellProps.row.index + 1;
                }
            },
            {
                header: "UserName",
                accessorKey: "userName",
                enableColumnFilter: true,
            },
            {
                header: "Name",
                accessorKey: "fullName",
                enableColumnFilter: true,
            },
            {
                header: "Role",
                accessorKey: "userType",
                enableColumnFilter: true,
            },
            {
                header: "Last Login",
                accessorKey: "lastLogin",
                enableColumnFilter: true,
                cell: (cellProps) => {
                    return cellProps.getValue() ? new Date(cellProps.getValue()).toLocaleString() : "-";
                }
            },
            {
                header: "Status",
                accessorKey: "accountStatus",
                enableColumnFilter: true,
                cell: (cellProps) => {
                    const isActive = cellProps.getValue() === 'Active';
                    return (
                        <span className={`badge rounded-pill ${isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-3 py-2 fs-12`}>
                            {cellProps.getValue()}
                        </span>
                    );
                }
            },
            {
                header: "Actions",
                accessorKey: "actions",
                enableColumnFilter: false,
                cell: (cellProps) => {
                    return (
                        <div className="d-flex gap-2">
                            <Link 
                                to={`/user-edit/${cellProps.row.original.userID}`} 
                                className="btn btn-soft-primary btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    padding: "0"
                                }}
                                title={t("Edit")}
                            >
                                <i className="ri-pencil-fill" style={{ fontSize: "14px" }}></i>
                            </Link>
                            <button 
                                className="btn btn-soft-danger btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    padding: "0"
                                }}
                                onClick={() => handleDeleteClick(cellProps.row.original.userID)}
                                title={t("Delete")}
                            >
                                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
                            </button>
                        </div>
                    );
                },
            },
        ],
        [t]
    );

    document.title = "User Management | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("User Management")} pageTitle="Masters" />

                    <Card className="shadow-sm border-0 rounded-3">
                        <CardBody className="p-3">
                            <Row className="g-3 align-items-end">
                                <Col lg={4}>
                                    <div>
                                        <label className="form-label mb-1 fw-medium text-muted">{t("Filter Users")}</label>
                                        <select
                                            className="form-select border-light-subtle rounded-3"
                                            value={selectedUserFilter}
                                            onChange={(e) => setSelectedUserFilter(e.target.value)}
                                        >
                                            <option value="All">{t("All Users")}</option>
                                            {userDropdown && userDropdown.map(item => (
                                                <option key={item.userID} value={item.userID}>{item.userName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </Col>
                                <Col lg={2}>
                                    <Button color="primary" className="w-100 rounded-3" onClick={handleSearch}>
                                        <i className="ri-search-2-line align-bottom me-1"></i>{t("Search")}
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Row>
                        <Col lg={12}>
                            <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                                <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
                                    <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary d-flex align-items-center gap-2">
                                        <i className="ri-user-settings-line fs-20 text-primary"></i>
                                        {t("User Management List")}
                                    </h5>
                                    <div>
                                        <Link to="/user-add" className="btn btn-primary add-btn rounded-3 d-inline-flex align-items-center gap-1">
                                            <i className="ri-add-line align-bottom"></i> {t("Add User")}
                                        </Link>
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
                                            data={filteredUsers || []}
                                            isGlobalFilter={true}
                                            customPageSize={10}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Search Users...")}
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
                <ModalHeader toggle={() => setDeleteModal(false)} className="bg-danger p-3 border-0">
                    <span className="text-white fw-bold">{t("Confirm Delete")}</span>
                </ModalHeader>
                <ModalBody>
                    <div className="mt-2 text-center">
                        <lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style={{ width: "100px", height: "100px" }}></lord-icon>
                        <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            <h4>{t("Are you sure ?")}</h4>
                            <p className="text-muted mx-4 mb-0">{t("Are you sure you want to remove this user?")}</p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <button type="button" className="btn w-sm btn-light rounded-3" onClick={() => setDeleteModal(false)}>{t("Close")}</button>
                        <button type="button" className="btn w-sm btn-danger rounded-3" id="delete-record" onClick={handleDeleteConfirm}>{t("Yes, Delete It!")}</button>
                    </div>
                </ModalBody>
            </Modal>
        </React.Fragment>
    );
};

export default ListUser;
