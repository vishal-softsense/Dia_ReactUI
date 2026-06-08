import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';

//import images
import avatar1 from "../../assets/images/users/avatar-1.jpg";

const ProfileDropdown = () => {


    const profiledropdownData = createSelector(
        (state) => state.Profile,
        (state) => ({
            user: state.user
        })
    );
    // Inside your component
    const { user } = useSelector(profiledropdownData);

    const [userName, setUserName] = useState("Admin");
    const [companyName, setCompanyName] = useState("");
    const [userRole, setUserRole] = useState("Founder");
    const [fullName, setFullName] = useState("");

    useEffect(() => {
        if (sessionStorage.getItem("authUser")) {
            const obj = JSON.parse(sessionStorage.getItem("authUser"));
            setUserName(obj.UserName || obj.user?.username || "Admin");
            setCompanyName(obj.CompanyName || "");
            setUserRole(obj.UserRole || "Founder");
            setFullName(obj.FullName || obj.user?.first_name || "");
        }
    }, [user]);

    //Dropdown Toggle
    const [isProfileDropdown, setIsProfileDropdown] = useState(false);
    const toggleProfileDropdown = () => {
        setIsProfileDropdown(!isProfileDropdown);
    };
    return (
        <React.Fragment>
            <Dropdown isOpen={isProfileDropdown} toggle={toggleProfileDropdown} className="ms-sm-3 header-item topbar-user">
                <DropdownToggle tag="button" type="button" className="btn">
                    <span className="d-flex align-items-center">
                        <img className="rounded-circle header-profile-user" src={avatar1}
                            alt="Header Avatar" />
                        <span className="text-start ms-xl-2">
                            <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">{fullName || userName}</span>
                            <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text mb-1">{companyName}</span>
                            <span className="d-none d-xl-block ms-1 fs-12" style={{ color: "#5A8DEE" }}>{userName} <span className="text-muted">({userRole})</span></span>
                        </span>
                    </span>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end">
                    <DropdownItem className='p-0'>
                        <Link to="#" className="dropdown-item">
                            <i className="bx bx-user mr-50 text-muted fs-16 align-middle me-2"></i>
                            <span className="align-middle">Edit Profile</span>
                        </Link>
                    </DropdownItem>

                    <DropdownItem className='p-0'>
                        <Link to="#" className="dropdown-item">
                            <i className="bx bx-bar-chart-alt-2 fs-4 avatar-initial rounded-circle bg-label-primary align-middle me-2" style={{ color: "#475F7B" }}></i>
                            <span className="align-middle">Settings</span>
                        </Link>
                    </DropdownItem>

                    <DropdownItem className='p-0'>
                        <Link to="#" className="dropdown-item">
                            <i className="bx bx-cog fs-4 avatar-initial rounded-circle bg-label-primary align-middle me-2" style={{ color: "#475F7B" }}></i>
                            <span className="align-middle">Parameters</span>
                        </Link>
                    </DropdownItem>

                    <DropdownItem className='p-0'>
                        <Link to="/userrole/list-user-role" className="dropdown-item">
                            <i className="bx bx-group fs-4 avatar-initial rounded-circle bg-label-primary align-middle me-2" style={{ color: "#475F7B" }}></i>
                            <span className="align-middle">Role</span>
                        </Link>
                    </DropdownItem>

                    <DropdownItem className='p-0'>
                        <Link to="/user-list" className="dropdown-item">
                            <i className="bx bx-user fs-4 avatar-initial rounded-circle bg-label-primary align-middle me-2" style={{ color: "#475F7B" }}></i>
                            <span className="align-middle">User</span>
                        </Link>
                    </DropdownItem>

                    <DropdownItem className='p-0'>
                        <Link to="/Sync/list-sync" className="dropdown-item">
                            <i className="bx bx-cog fs-4 avatar-initial rounded-circle bg-label-primary align-middle me-2" style={{ color: "#475F7B" }}></i>
                            <span className="align-middle">Sync</span>
                        </Link>
                    </DropdownItem>

                    <div className="dropdown-divider"></div>

                    <DropdownItem className='p-0'>
                        <Link to="/logout" className="dropdown-item">
                            <i className="bx bx-power-off text-muted fs-16 align-middle me-2"></i>
                            <span className="align-middle" data-key="t-logout">Logout</span>
                        </Link>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default ProfileDropdown;