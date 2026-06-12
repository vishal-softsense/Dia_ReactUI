import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { getUserRoles, deleteUserRole } from "../../../helpers/fakebackend_helper";
import { toast } from 'react-toastify';

const UserRoleList = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await getUserRoles();
            if (response.success) {
                setRoles(response.data);
            } else {
                setRoles(response);
            }
        } catch (error) {
            toast.error("Failed to fetch roles");
        }
        setLoading(false);
    };

    const handleDeleteClick = (id) => {
        setRoleToDelete(id);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (roleToDelete) {
            try {
                const response = await deleteUserRole(roleToDelete);
                if (response.success) {
                    toast.success("Role Deleted Successfully");
                    fetchRoles();
                } else {
                    toast.error(response.data || "Failed to delete role");
                }
            } catch (error) {
                toast.error("Failed to delete role");
            }
            setDeleteModal(false);
            setRoleToDelete(null);
        }
    };

    const columns = useMemo(
        () => [
            {
                header: "Role ID",
                accessorKey: "userTypeID",
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const rowValue = row.getValue(id);
                    return rowValue != null ? String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Role Name",
                accessorKey: "userType",
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const rowValue = row.getValue(id);
                    return rowValue != null ? String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Description",
                accessorKey: "description",
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    const rowValue = row.getValue(id);
                    return rowValue != null ? String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase()) : false;
                }
            },
            {
                header: "Actions",
                accessorKey: "actions",
                enableColumnFilter: false,
                cell: (cellProps) => {
                    return (
                        <div className="d-flex gap-2">
                            <Link to={`/edit-user-role/${cellProps.row.original.userTypeID}`} className="btn btn-sm btn-primary">
                                <i className="ri-pencil-fill align-bottom"></i>
                            </Link>
                            <Link to={`/manage-user-permission/${cellProps.row.original.userTypeID}`} className="btn btn-sm btn-info" title="Manage Permissions">
                                <i className="ri-shield-keyhole-line align-bottom"></i>
                            </Link>
                            <Button size="sm" color="danger" onClick={() => handleDeleteClick(cellProps.row.original.userTypeID)}>
                                <i className="ri-delete-bin-fill align-bottom"></i>
                            </Button>
                        </div>
                    );
                },
            },
        ],
        []
    );

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="User Role List" pageTitle="Masters" />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">User Roles</h5>
                                    <div>
                                        <Link to="/add-user-role" className="btn btn-primary add-btn me-1">
                                            <i className="ri-add-line align-bottom me-1"></i> Add New
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {loading ? (
                                        <div className="text-center my-3">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="sr-only">Loading...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <TableContainer
                                            columns={columns}
                                            data={roles || []}
                                            isGlobalFilter={true}
                                            customPageSize={10}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0"
                                            SearchPlaceholder="Search Roles..."
                                        />
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Delete Modal */}
            <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
                <ModalHeader toggle={() => setDeleteModal(false)}>Confirm Delete</ModalHeader>
                <ModalBody>
                    <div className="mt-2 text-center">
                        <lord-icon
                            src="https://cdn.lordicon.com/gsqxdxog.json"
                            trigger="loop"
                            colors="primary:#f7b84b,secondary:#f06548"
                            style={{ width: "100px", height: "100px" }}
                        ></lord-icon>
                        <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            <h4>Are you sure?</h4>
                            <p className="text-muted mx-4 mb-0">
                                Are you sure you want to remove this record?
                            </p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <button
                            type="button"
                            className="btn w-sm btn-light"
                            onClick={() => setDeleteModal(false)}
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            className="btn w-sm btn-danger"
                            onClick={handleDeleteConfirm}
                        >
                            Yes, Delete It!
                        </button>
                    </div>
                </ModalBody>
            </Modal>
        </React.Fragment>
    );
};

export default UserRoleList;
