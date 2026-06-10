import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody } from "reactstrap";
import { useSelector, useDispatch } from "react-redux";
import { getUsers, deleteUser, fetchUserDropdown } from "../../../slices/thunks";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";

const ListUser = () => {
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
                header: "ID",
                accessorKey: "userID",
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    return String(row.getValue(id)).toLowerCase().includes(String(filterValue).toLowerCase());
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
                    return (
                        <span className={`badge ${cellProps.getValue() === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                            {cellProps.getValue()}
                        </span>
                    );
                }
            },
            {
                header: "Edit",
                id: "edit",
                enableColumnFilter: false,
                cell: (cellProps) => {
                    return (
                        <Link
                            to={`/user-edit/${cellProps.row.original.userID}`}
                            className="text-primary d-inline-block"
                        >
                            <i className="bx bxs-edit-alt fs-16"></i>
                        </Link>
                    );
                },
            },
            {
                header: "Delete",
                id: "delete",
                enableColumnFilter: false,
                cell: (cellProps) => {
                    return (
                        <Button
                            color="link"
                            className="text-danger p-0 d-inline-block"
                            onClick={() => handleDeleteClick(cellProps.row.original.userID)}
                        >
                            <i className="bx bxs-trash fs-16"></i>
                        </Button>
                    );
                },
            },
        ],
        []
    );

    document.title = "User Management | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="User Management" pageTitle="Masters" />

                    <Card>
                        <CardBody>
                            <Row className="g-3">
                                <Col lg={4}>
                                    <div>
                                        <label className="form-label mb-0">Users</label>
                                        <select
                                            className="form-select"
                                            value={selectedUserFilter}
                                            onChange={(e) => setSelectedUserFilter(e.target.value)}
                                        >
                                            <option value="All">All</option>
                                            {userDropdown && userDropdown.map(item => (
                                                <option key={item.userID} value={item.userID}>{item.userName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </Col>
                                <Col lg={2} className="d-flex align-items-end">
                                    <Button color="primary" className="w-100" onClick={handleSearch}>Search</Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
                                    <h4 className="card-title mb-0">User Master</h4>
                                    <div className="flex-shrink-0">
                                        <Link to="/user-add" className="btn btn-primary add-btn">
                                            Add User
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {loading ? (
                                        <div className="text-center">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="sr-only">Loading...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <TableContainer
                                            columns={columns}
                                            data={filteredUsers || []}
                                            isGlobalFilter={true}
                                            isAddUserList={false}
                                            customPageSize={10}
                                            className="custom-header-css"
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap"
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
            <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
                <ModalHeader toggle={() => setDeleteModal(false)}></ModalHeader>
                <ModalBody>
                    <div className="mt-2 text-center">
                        <lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style={{ width: "100px", height: "100px" }}></lord-icon>
                        <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            <h4>Are you sure ?</h4>
                            <p className="text-muted mx-4 mb-0">Are you sure you want to remove this user?</p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <button type="button" className="btn w-sm btn-light" onClick={() => setDeleteModal(false)}>Close</button>
                        <button type="button" className="btn w-sm btn-danger " id="delete-record" onClick={handleDeleteConfirm}>Yes, Delete It!</button>
                    </div>
                </ModalBody>
            </Modal>
        </React.Fragment>
    );
};

export default ListUser;
