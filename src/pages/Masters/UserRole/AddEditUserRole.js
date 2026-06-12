import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, FormFeedback, Input, Label, Form } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import * as Yup from "yup";
import { useFormik } from "formik";
import { getUserRoleDetail, addNewUserRole, updateUserRole, getUserRoleDropdown } from "../../../helpers/fakebackend_helper";
import { toast } from 'react-toastify';

const AddEditUserRole = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    useEffect(() => {
        if (isEditMode) {
            fetchRoleData(id);
        }
    }, [id]);

    const fetchRoleData = async (roleId) => {
        try {
            const response = await getUserRoleDetail(roleId);
            if (response.success && response.data) {
                validation.setValues({
                    userTypeID: response.data.userTypeID || 0,
                    userType: response.data.userType || "",
                    description: response.data.description || "",
                    underUser: response.data.underUserTypeID || 0,
                });
            } else {
                toast.error("Role not found");
                navigate("/user-role");
            }
        } catch (error) {
            toast.error("Failed to fetch role data");
            navigate("/user-role");
        }
    };

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            userTypeID: 0,
            userType: "",
            description: "",
            companyID: 0 // handled by backend mostly
        },
        validationSchema: Yup.object({
            userType: Yup.string().required("Please Enter Role Name"),
            description: Yup.string().required("Please Enter Description"),
        }),
        onSubmit: async (values) => {
            try {
                const payload = { ...values };
                let response;
                if (isEditMode) {
                    response = await updateUserRole(payload);
                } else {
                    response = await addNewUserRole(payload);
                }

                if (response.success) {
                    toast.success(`Role ${isEditMode ? "Updated" : "Added"} Successfully`);
                    navigate("/user-role");
                } else {
                    toast.error(response.data || "Something went wrong");
                }
            } catch (error) {
                toast.error("Failed to save role");
            }
        }
    });

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={isEditMode ? "Edit User Role" : "Add User Role"} pageTitle="Masters" />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h5 className="card-title mb-0">{isEditMode ? "Edit Role Details" : "New Role Details"}</h5>
                                </CardHeader>
                                <CardBody>
                                    <Form onSubmit={(e) => {
                                        e.preventDefault();
                                        validation.handleSubmit();
                                        return false;
                                    }}>
                                        <Row className="gy-4">
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="userType" className="form-label">Role Name <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="userType"
                                                        type="text"
                                                        className="form-control"
                                                        id="userType"
                                                        placeholder="Enter Role Name"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.userType || ""}
                                                        invalid={
                                                            validation.touched.userType && validation.errors.userType ? true : false
                                                        }
                                                    />
                                                    {validation.touched.userType && validation.errors.userType ? (
                                                        <FormFeedback type="invalid">{validation.errors.userType}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>



                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label htmlFor="description" className="form-label">Description <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="description"
                                                        type="textarea"
                                                        className="form-control"
                                                        id="description"
                                                        placeholder="Enter Description"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.description || ""}
                                                        invalid={
                                                            validation.touched.description && validation.errors.description ? true : false
                                                        }
                                                    />
                                                    {validation.touched.description && validation.errors.description ? (
                                                        <FormFeedback type="invalid">{validation.errors.description}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                        </Row>

                                        <div className="hstack gap-2 justify-content-end mt-4">
                                            <Link to="/user-role" className="btn btn-light">Cancel</Link>
                                            <Button type="submit" color="primary">
                                                {isEditMode ? "Update Role" : "Add Role"}
                                            </Button>
                                        </div>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default AddEditUserRole;
