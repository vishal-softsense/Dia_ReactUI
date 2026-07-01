import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "reactstrap";
import SimpleBar from "simplebar-react";
import axios from "axios";
import { api } from "../../config";


const SearchOption = () => {

    const [value, setValue] = useState("");
    const [menuList, setMenuList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const onChangeData = async (e) => {

        const text = e.target.value;

        setValue(text);

        if (text.trim() === "") {
            setMenuList([]);
            setShowDropdown(false);
            return;
        }

        setLoading(true);

        try {

            let authUserStr = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
            let token = null;
            if (authUserStr) {
                const obj = JSON.parse(authUserStr);
                token = obj.token || obj.Token;
            }

            const response = await axios.get(
                `${api.API_URL}/api/common/get-menu-list`,
                {
                    params: {
                        searchby: text
                    },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log("Response :", response);

            let result = [];

            if (Array.isArray(response)) {
                result = response;
            }
            else if (Array.isArray(response?.data)) {
                result = response.data;
            }
            else if (Array.isArray(response?.Data)) {
                result = response.Data;
            }

            setMenuList(result);
            setShowDropdown(true);


        }
        catch (err) {

            console.error(err);

            setMenuList([]);
            setShowDropdown(true);

        }
        finally {

            setLoading(false);

        }

    };

    const clearSearch = () => {

        setValue("");
        setMenuList([]);
        setShowDropdown(false);

    };

    return (

        <form className="app-search d-none d-md-block">

            <div className="position-relative">

                <Input
                    type="text"
                    className="form-control"
                    placeholder="Search Menu..."
                    autoComplete="off"
                    value={value}
                    onChange={onChangeData}
                />

                <span className="mdi mdi-magnify search-widget-icon"></span>

                {
                    value !== "" &&

                    <span
                        className="mdi mdi-close-circle search-widget-icon search-widget-icon-close"
                        style={{ cursor: "pointer" }}
                        onClick={clearSearch}
                    ></span>

                }

            </div>

            {
                showDropdown &&

                <div
                    className="dropdown-menu show"
                    style={{
                        display: "block",
                        width: "100%",
                        zIndex: 9999
                    }}
                >

                    <SimpleBar style={{ maxHeight: 300 }}>

                        {
                            loading ?

                                <div className="dropdown-item text-center">
                                    Loading...
                                </div>

                                :

                                menuList.length > 0 ?

                                    menuList.map((item, index) => (

                                        <Link
                                            key={index}
                                            to={item.id ? item.id.replace("../", "/") : "#"}
                                            className="dropdown-item notify-item"
                                            onClick={clearSearch}
                                        >

                                            <div className="fw-semibold">
                                                {item.text}
                                            </div>

                                            <small className="text-muted">
                                                {item.group}
                                            </small>

                                        </Link>

                                    ))

                                    :

                                    <div className="dropdown-item text-center">
                                        No Menu Found
                                    </div>

                        }

                    </SimpleBar>

                </div>

            }

        </form>

    );

};

export default SearchOption;