import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, CardFooter, Form, Label, Input, FormFeedback, Button, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { addNewUser, updateUser, getUserDetail } from "../../../slices/thunks";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { getUserRoleDropdown } from "../../../helpers/fakebackend_helper";

const AddEditUser = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [activeTab, setActiveTab] = useState("1");
    const toggleTab = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };

    const { userDetail, loading } = useSelector((state) => ({
        userDetail: state.UserManagement.userDetail,
        loading: state.UserManagement.loading,
    }));

    const [roleDropdown, setRoleDropdown] = useState([]);

    useEffect(() => {
        const fetchRoleDropdown = async () => {
            try {
                const res = await getUserRoleDropdown();
                if (res.success) {
                    setRoleDropdown(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch roles", error);
            }
        };

        fetchRoleDropdown();

        if (isEdit) {
            dispatch(getUserDetail(id));
        }
    }, [dispatch, id, isEdit]);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            userID: (userDetail && isEdit) ? (userDetail.userID || userDetail.UserID) : 0,
            userName: (userDetail && isEdit) ? (userDetail.userName || userDetail.UserName) : "",
            password: "",
            confirmPassword: "",
            email: (userDetail && isEdit) ? (userDetail.email || userDetail.Email) : "",
            firstName: (userDetail && isEdit) ? (userDetail.firstName || userDetail.FirstName) : "",
            lastName: (userDetail && isEdit) ? (userDetail.lastName || userDetail.LastName) : "",
            mobileNo: (userDetail && isEdit) ? (userDetail.mobileNo || userDetail.MobileNo) : "",
            birthDate: (userDetail && isEdit) ? ((userDetail.birthDate || userDetail.BirthDate || userDetail.Birthday || userDetail.birthday) ? String(userDetail.birthDate || userDetail.BirthDate || userDetail.Birthday || userDetail.birthday).split('T')[0] : "") : "",
            address1: (userDetail && isEdit) ? (userDetail.address1 || userDetail.Address1 || userDetail.Address || userDetail.address) : "",
            landmark: (userDetail && isEdit) ? (userDetail.landmark || userDetail.Landmark) : "",
            city: (userDetail && isEdit) ? (userDetail.city || userDetail.City) : "",
            state: (userDetail && isEdit) ? (userDetail.state || userDetail.State) : "",
            country: (userDetail && isEdit) ? (userDetail.country || userDetail.Country) : "",
            twitter: (userDetail && isEdit) ? (userDetail.twitter || userDetail.Twitter) : "",
            facebook: (userDetail && isEdit) ? (userDetail.facebook || userDetail.Facebook) : "",
            instagram: (userDetail && isEdit) ? (userDetail.instagram || userDetail.Instagram) : "",
            linkedin: (userDetail && isEdit) ? (userDetail.linkedin || userDetail.Linkedin) : "",
            userTypeId: (userDetail && isEdit) ? (userDetail.userTypeId || userDetail.UserTypeId || userDetail.UserTypeID) : 1, // Default to 1
        },
        validationSchema: Yup.object({
            userName: Yup.string().required("Please Enter Username"),
            email: Yup.string()
                .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid professional email address")
                .required("Please Enter Email"),
            password: isEdit ? Yup.string() : Yup.string().required("Please Enter Password"),
            confirmPassword: isEdit ? Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match') 
                                    : Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').required("Please Confirm Password"),
        }),
        onSubmit: (values) => {
            if (isEdit) {
                dispatch(updateUser(values, navigate));
            } else {
                dispatch(addNewUser(values, navigate));
            }
        },
    });

    document.title = `${isEdit ? "Edit" : "Add"} User | Admin`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={`${isEdit ? "Edit" : "Add"} User`} pageTitle="User Management" />
                    
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h5 className="card-title mb-0">{isEdit ? "Edit User Details" : "Create New User"}</h5>
                                </CardHeader>
                                <Form onSubmit={formik.handleSubmit}>
                                    <CardBody>
                                        <Nav tabs className="nav-tabs mb-3" role="tablist">
                                            <NavItem>
                                                <NavLink
                                                    className={classnames({ active: activeTab === "1" })}
                                                    onClick={() => { toggleTab("1"); }}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <i className="bx bx-user me-1"></i> Account
                                                </NavLink>
                                            </NavItem>
                                            <NavItem>
                                                <NavLink
                                                    className={classnames({ active: activeTab === "2" })}
                                                    onClick={() => { toggleTab("2"); }}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <i className="bx bx-info-circle me-1"></i> Information
                                                </NavLink>
                                            </NavItem>
                                            <NavItem>
                                                <NavLink
                                                    className={classnames({ active: activeTab === "3" })}
                                                    onClick={() => { toggleTab("3"); }}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <i className="bx bx-link me-1"></i> Social Links
                                                </NavLink>
                                            </NavItem>
                                        </Nav>

                                        <TabContent activeTab={activeTab}>
                                            <TabPane tabId="1">
                                                <h5 className="mb-3"><i className="bx bx-user me-1"></i> Account Details</h5>
                                                <Row className="g-3">
                                                    <Col lg={4}>
                                                        <div>
                                                            <Label htmlFor="userName" className="form-label">Username</Label>
                                                            <Input
                                                                type="text"
                                                                id="userName"
                                                                name="userName"
                                                                className="form-control"
                                                                placeholder="Enter Username"
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                                value={formik.values.userName || ""}
                                                                invalid={formik.touched.userName && formik.errors.userName ? true : false}
                                                            />
                                                            {formik.touched.userName && formik.errors.userName ? (
                                                                <FormFeedback type="invalid">{formik.errors.userName}</FormFeedback>
                                                            ) : null}
                                                        </div>
                                                    </Col>
                                                    <Col lg={4}>
                                                        <div>
                                                            <Label htmlFor="password" className="form-label">Password {isEdit && "(Leave blank to keep current)"}</Label>
                                                            <Input
                                                                type="password"
                                                                id="password"
                                                                name="password"
                                                                className="form-control"
                                                                placeholder="Enter Password"
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                                value={formik.values.password || ""}
                                                                invalid={formik.touched.password && formik.errors.password ? true : false}
                                                            />
                                                            {formik.touched.password && formik.errors.password ? (
                                                                <FormFeedback type="invalid">{formik.errors.password}</FormFeedback>
                                                            ) : null}
                                                        </div>
                                                    </Col>
                                                    <Col lg={4}>
                                                        <div>
                                                            <Label htmlFor="confirmPassword" className="form-label">Confirm Password</Label>
                                                            <Input
                                                                type="password"
                                                                id="confirmPassword"
                                                                name="confirmPassword"
                                                                className="form-control"
                                                                placeholder="Confirm Password"
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                                value={formik.values.confirmPassword || ""}
                                                                invalid={formik.touched.confirmPassword && formik.errors.confirmPassword ? true : false}
                                                            />
                                                            {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                                                                <FormFeedback type="invalid">{formik.errors.confirmPassword}</FormFeedback>
                                                            ) : null}
                                                        </div>
                                                    </Col>

                                                    <Col lg={4}>
                                                        <div>
                                                            <Label htmlFor="email" className="form-label">Email</Label>
                                                            <Input
                                                                type="email"
                                                                id="email"
                                                                name="email"
                                                                className="form-control"
                                                                placeholder="Email Address"
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                                value={formik.values.email || ""}
                                                                invalid={formik.touched.email && formik.errors.email ? true : false}
                                                            />
                                                            {formik.touched.email && formik.errors.email ? (
                                                                <FormFeedback type="invalid">{formik.errors.email}</FormFeedback>
                                                            ) : null}
                                                        </div>
                                                    </Col>
                                                    <Col lg={4}>
                                                        <div>
                                                            <Label htmlFor="userTypeId" className="form-label">Role (User Type ID)</Label>
                                                            <Input
                                                                type="select"
                                                                id="userTypeId"
                                                                name="userTypeId"
                                                                className="form-control"
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                                value={formik.values.userTypeId || 1}
                                                            >
                                                                <option value="0">Select Role</option>
                                                                {roleDropdown.map((role) => (
                                                                    <option key={role.userTypeID} value={role.userTypeID}>
                                                                        {role.userType}
                                                                    </option>
                                                                ))}
                                                            </Input>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </TabPane>

                                            <TabPane tabId="2">
                                                <h5 className="mb-3"><i className="bx bx-info-circle me-1"></i> Personal Info</h5>
                                                <Row className="g-3">
                                                    <Col lg={3}>
                                                        <div>
                                                            <Label htmlFor="firstName" className="form-label">First Name</Label>
                                                            <Input
                                                                type="text"
                                                                id="firstName"
                                                                name="firstName"
                                                                className="form-control"
                                                                placeholder="Enter First name"
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                                value={formik.values.firstName || ""}
                                                                invalid={formik.touched.firstName && formik.errors.firstName ? true : false}
                                                            />
                                                            {formik.touched.firstName && formik.errors.firstName ? (
                                                                <FormFeedback type="invalid">{formik.errors.firstName}</FormFeedback>
                                                            ) : null}
                                                        </div>
                                                    </Col>
                                                    <Col lg={3}>
                                                        <div>
                                                            <Label htmlFor="lastName" className="form-label">Last Name</Label>
                                                            <Input type="text" id="lastName" name="lastName" className="form-control" placeholder="Enter Last Name" onChange={formik.handleChange} value={formik.values.lastName || ""} />
                                                        </div>
                                                    </Col>
                                                    <Col lg={3}>
                                                        <div>
                                                            <Label htmlFor="mobileNo" className="form-label">Mobile No</Label>
                                                            <Input type="text" id="mobileNo" name="mobileNo" className="form-control" placeholder="Enter Mobile No" onChange={formik.handleChange} value={formik.values.mobileNo || ""} />
                                                        </div>
                                                    </Col>
                                                    <Col lg={3}>
                                                        <div>
                                                            <Label htmlFor="birthDate" className="form-label">Birth Date</Label>
                                                            <Input type="date" id="birthDate" name="birthDate" className="form-control" placeholder="Enter Birth Date" onChange={formik.handleChange} value={formik.values.birthDate || ""} />
                                                        </div>
                                                    </Col>

                                                    <Col lg={4}>
                                                        <div>
                                                            <Label htmlFor="address1" className="form-label">Address line 1</Label>
                                                            <Input type="text" id="address1" name="address1" className="form-control" placeholder="Enter Your House no./ Flate no." onChange={formik.handleChange} value={formik.values.address1 || ""} />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div>
                                                            <Label htmlFor="landmark" className="form-label">Landmark</Label>
                                                            <Input type="text" id="landmark" name="landmark" className="form-control" placeholder="Enter a LandMark" onChange={formik.handleChange} value={formik.values.landmark || ""} />
                                                        </div>
                                                    </Col>
                                                    <Col lg={4}>
                                                        <div>
                                                            <Label htmlFor="city" className="form-label">City</Label>
                                                            <Input type="text" id="city" name="city" className="form-control" placeholder="Enter City" onChange={formik.handleChange} value={formik.values.city || ""} />
                                                        </div>
                                                    </Col>
                                                    <Col lg={4}>
                                                        <div>
                                                            <Label htmlFor="state" className="form-label">State</Label>
                                                            <Input type="text" id="state" name="state" className="form-control" placeholder="Enter State" onChange={formik.handleChange} value={formik.values.state || ""} />
                                                        </div>
                                                    </Col>
                                                    <Col lg={4}>
                                                        <div>
                                                            <Label htmlFor="country" className="form-label">Country</Label>
                                                            <Input type="text" id="country" name="country" className="form-control" placeholder="Enter Country" onChange={formik.handleChange} value={formik.values.country || ""} />
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </TabPane>

                                            <TabPane tabId="3">
                                                <h5 className="mb-3"><i className="bx bx-link me-1"></i> Social Links</h5>
                                                <Row className="g-3">
                                                    <Col lg={6}>
                                                        <div>
                                                            <Label htmlFor="twitter" className="form-label">Twitter</Label>
                                                            <Input type="text" id="twitter" name="twitter" className="form-control" placeholder="Twitter" onChange={formik.handleChange} value={formik.values.twitter || ""} />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div>
                                                            <Label htmlFor="facebook" className="form-label">Facebook</Label>
                                                            <Input type="text" id="facebook" name="facebook" className="form-control" placeholder="Facebook" onChange={formik.handleChange} value={formik.values.facebook || ""} />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div>
                                                            <Label htmlFor="instagram" className="form-label">Instagram</Label>
                                                            <Input type="text" id="instagram" name="instagram" className="form-control" placeholder="Instagram" onChange={formik.handleChange} value={formik.values.instagram || ""} />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div>
                                                            <Label htmlFor="linkedin" className="form-label">Linkedin</Label>
                                                            <Input type="text" id="linkedin" name="linkedin" className="form-control" placeholder="Linkedin" onChange={formik.handleChange} value={formik.values.linkedin || ""} />
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </TabPane>
                                        </TabContent>
                                    </CardBody>

                                    <CardFooter>
                                        <Row>
                                            <Col md={3} className="d-flex align-items-center">
                                                <Link to="/user-list" className="btn btn-primary w-md">Back to list</Link>
                                            </Col>
                                            <Col md={9} className="d-flex justify-content-end gap-2 mt-3 mt-md-0">
                                                <Button type="submit" color="primary" disabled={loading} className="w-md">
                                                    {loading ? "Saving..." : (isEdit ? "Update User" : "Create User")}
                                                </Button>
                                                <button type="reset" onClick={formik.handleReset} className="btn btn-light w-md">Cancel</button>
                                            </Col>
                                        </Row>
                                    </CardFooter>
                                </Form>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default AddEditUser;
