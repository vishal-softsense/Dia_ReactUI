import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import { getSettingData } from '../../helpers/fakebackend_helper';

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
    const [displayCompanyName, setDisplayCompanyName] = useState(localStorage.getItem("companySettingName") || "Admin");

    useEffect(() => {
        let authUserStr = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
        if (authUserStr) {
            const obj = JSON.parse(authUserStr);
            const u = obj.user || obj.User || obj;
            setUserName(u.UserName || u.userName || u.username || "Admin");
            setCompanyName(obj.CompanyName || obj.companyName || "");
            setUserRole(u.UserRole || u.userRole || "Founder");
            setFullName(u.FullName || u.firstName || u.FirstName || "");
        }
    }, [user]);

    useEffect(() => {
        const fetchCompanySetting = async () => {
            try {
                const response = await getSettingData();
                if (response && (response.success || response.Success)) {
                    const data = response.data || response.Data || [];
                    const companySetting = data.find(item => (item.Name || item.name || "").toLowerCase() === "company");
                    if (companySetting) {
                        const val = companySetting.Value ?? companySetting.value ?? "Admin";
                        setDisplayCompanyName(val);
                        localStorage.setItem("companySettingName", val);
                    }
                }
            } catch (error) {
                console.error("Error fetching company setting in header:", error);
            }
        };

        fetchCompanySetting();

        const handleUpdate = () => {
            const val = localStorage.getItem("companySettingName");
            if (val) {
                setDisplayCompanyName(val);
            }
        };

        window.addEventListener("companyNameUpdated", handleUpdate);
        return () => {
            window.removeEventListener("companyNameUpdated", handleUpdate);
        };
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
                            <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">{displayCompanyName}</span>
                            <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text">
                                {companyName ? `${companyName} (${userRole})` : userRole}
                            </span>
                        </span>
                    </span>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end">
                    <h6 className="dropdown-header">Welcome {userName}!</h6>


                    <DropdownItem className='p-0'>
                        <Link to="/company-settings" className="dropdown-item">
                            <i className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">Settings</span>
                        </Link>
                    </DropdownItem>

                    <DropdownItem className='p-0'>
                        <Link to="/all-master-list" className="dropdown-item">
                            <i className="mdi mdi-format-list-bulleted text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">Parameters</span>
                        </Link>
                    </DropdownItem>

                    <DropdownItem className='p-0'>
                        <Link to="/user-role" className="dropdown-item">
                            <i className="mdi mdi-account-multiple-outline text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">Role</span>
                        </Link>
                    </DropdownItem>

                    <DropdownItem className='p-0'>
                        <Link to="/user-list" className="dropdown-item">
                            <i className="mdi mdi-account-outline text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">User</span>
                        </Link>
                    </DropdownItem>

                    <DropdownItem className='p-0'>
                        <Link to="/Sync/list-sync" className="dropdown-item">
                            <i className="mdi mdi-sync text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">Sync</span>
                        </Link>
                    </DropdownItem>

                    <div className="dropdown-divider"></div>

                    <DropdownItem className='p-0'>
                        <Link to="/logout" className="dropdown-item">
                            <i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle" data-key="t-logout">Logout</span>
                        </Link>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default ProfileDropdown;