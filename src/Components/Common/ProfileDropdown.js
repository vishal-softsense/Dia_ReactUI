import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import { getSettingData } from '../../helpers/fakebackend_helper';
import { api } from '../../config';

//import images
import avatar1 from "../../assets/images/users/avatar-1.jpg";

const COMPANY_LOGIN_LOGO_KEY = "companyLoginLogo";

const resolveCompanyLogoUrl = (path) => {
    if (!path || typeof path !== "string" || !path.trim()) {
        return "";
    }
    const trimmed = path.trim();
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    const baseUrl = (api.API_URL || "").replace(/\/$/, "");
    if (trimmed.startsWith("/")) {
        return `${baseUrl}${trimmed}`;
    }
    return `${baseUrl}/${trimmed}`;
};

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
    const [companyLogoUrl, setCompanyLogoUrl] = useState(() => resolveCompanyLogoUrl(localStorage.getItem(COMPANY_LOGIN_LOGO_KEY) || ""));

    const applyCompanyLogo = (rawPath, source = "settings") => {
        const resolvedUrl = resolveCompanyLogoUrl(rawPath);
        if (!rawPath || !String(rawPath).trim()) {
            console.warn("[CompanyLoginLogo] Logo path is empty.", { source, rawPath });
            setCompanyLogoUrl("");
            return;
        }
        if (!resolvedUrl) {
            console.error("[CompanyLoginLogo] Could not build logo URL.", { source, rawPath });
            setCompanyLogoUrl("");
            return;
        }
        localStorage.setItem(COMPANY_LOGIN_LOGO_KEY, String(rawPath).trim());
        setCompanyLogoUrl(resolvedUrl);
    };

    const handleLogoImageError = (event) => {
        const failedUrl = event?.target?.src || companyLogoUrl;
        const rawPath = localStorage.getItem(COMPANY_LOGIN_LOGO_KEY) || "";
        console.error("[CompanyLoginLogo] Failed to load company logo image.", {
            failedUrl,
            rawPathFromSettings: rawPath,
            apiBaseUrl: api.API_URL,
            hint: "Check that CompanyLoginLogo path exists and is reachable (e.g. /Upload/logo.png on API server)."
        });
        setCompanyLogoUrl("");
        if (event?.target) {
            event.target.onerror = null;
            event.target.src = avatar1;
        }
    };

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

                    const logoSetting = data.find(item => (item.Name || item.name || "").toLowerCase() === "companyloginlogo");
                    if (logoSetting) {
                        const logoPath = logoSetting.Value ?? logoSetting.value ?? "";
                        applyCompanyLogo(logoPath, "get-setting-data");
                    } else {
                        console.warn("[CompanyLoginLogo] Setting not found in API response.", {
                            source: "get-setting-data",
                            hint: "Ensure CompanyLoginLogo exists in Company settings."
                        });
                    }
                } else {
                    console.error("[CompanyLoginLogo] Settings API returned unsuccessful response.", {
                        source: "get-setting-data",
                        response
                    });
                }
            } catch (error) {
                console.error("[CompanyLoginLogo] Error fetching company settings in header.", {
                    source: "get-setting-data",
                    apiBaseUrl: api.API_URL,
                    error
                });
            }
        };

        fetchCompanySetting();

        const handleCompanyNameUpdate = () => {
            const val = localStorage.getItem("companySettingName");
            if (val) {
                setDisplayCompanyName(val);
            }
        };

        const handleCompanyLogoUpdate = () => {
            const logoPath = localStorage.getItem(COMPANY_LOGIN_LOGO_KEY) || "";
            applyCompanyLogo(logoPath, "companyLogoUpdated");
        };

        window.addEventListener("companyNameUpdated", handleCompanyNameUpdate);
        window.addEventListener("companyLogoUpdated", handleCompanyLogoUpdate);
        return () => {
            window.removeEventListener("companyNameUpdated", handleCompanyNameUpdate);
            window.removeEventListener("companyLogoUpdated", handleCompanyLogoUpdate);
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
                        <img
                            className="header-profile-user"
                            src={companyLogoUrl || avatar1}
                            alt="Company Logo"
                            onError={handleLogoImageError}
                            style={{
                                height: "55px",
                                width: "60px",
                                objectFit: "contain",
                                boxShadow: "none",
                                borderRadius: 0,
                                backgroundColor: "#fff"
                            }}
                        />
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