import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { getRolePermissions, saveRolePermissions, getUserRoleDetail } from "../../../helpers/fakebackend_helper";
import { toast } from 'react-toastify';
import RolePermissionGrid from "./RolePermissionGrid";

const ManageUserPermission = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [roleDetails, setRoleDetails] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchInitialData();
        } else {
            navigate('/user-role');
        }
    }, [id]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Fetch the role details for display
            const roleRes = await getUserRoleDetail(id);
            if (roleRes.success) {
                setRoleDetails(roleRes.data);
            }

            // Fetch existing permissions
            const permRes = await getRolePermissions(id);
            if (permRes.success) {
                // Initialize the 'all' state correctly for each row based on its values
                const processedPermissions = permRes.data.map(p => ({
                    ...p,
                    all: p.select && p.write && p.edit && p.delete && p.navigate
                }));
                setPermissions(processedPermissions);
            } else {
                toast.error("Failed to load permissions");
            }
        } catch (error) {
            toast.error("Error connecting to server");
        }
        setLoading(false);
    };

    const handleGridChange = (newData) => {
        setPermissions(newData);
    };

    const handleSavePermissions = async () => {
        try {
            // Map the grid format back to the API payload expectation (UserPermissionSaveDto)
            const payload = permissions.map(p => ({
                formID: p.formID,
                selectData: !!p.select,
                insertData: !!p.write,
                editData: !!p.edit,
                deleteData: !!p.delete,
                navigateData: !!p.navigate
            }));

            const response = await saveRolePermissions(id, payload);
            if (response.success) {
                toast.success("Permissions Saved Successfully");
                navigate("/user-role");
            } else {
                toast.error(response.data || "Failed to save permissions");
            }
        } catch (error) {
            toast.error("Failed to save permissions");
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Manage Permissions" pageTitle="Masters" />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1">
                                        Permissions for Role: <span className="text-primary">{roleDetails?.userType || "Loading..."}</span>
                                    </h5>
                                    <div>
                                        <Link to="/user-role" className="btn btn-light me-2">
                                            <i className="ri-arrow-left-line align-bottom me-1"></i> Back
                                        </Link>
                                        <Button color="success" onClick={handleSavePermissions} disabled={loading}>
                                            <i className="ri-save-line align-bottom me-1"></i> Save Permissions
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {loading ? (
                                        <div className="text-center my-4">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="sr-only">Loading...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <RolePermissionGrid 
                                            permissions={permissions} 
                                            onChange={handleGridChange} 
                                        />
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default ManageUserPermission;
