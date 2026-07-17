import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSidebarMenu } from "../helpers/fakebackend_helper";

const Navdata = () => {
    const history = useNavigate();
    const [rawData, setRawData] = useState(() => {
        const cached = sessionStorage.getItem("sidebar_menu_data") || localStorage.getItem("sidebar_menu_data");
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                console.error("Failed to parse cached sidebar menu", e);
            }
        }
        return [];
    });
    const [menuStates, setMenuStates] = useState({});
    const [iscurrentState, setIscurrentState] = useState("");

    useEffect(() => {
        const fetchMenuData = async () => {
            try {
                const response = await getSidebarMenu();
                if (response && (response.success || response.Success) && (response.data || response.Data)) {
                    const freshData = response.data || response.Data;
                    const cached = sessionStorage.getItem("sidebar_menu_data") || localStorage.getItem("sidebar_menu_data");
                    
                    if (JSON.stringify(freshData) !== cached) {
                        setRawData(freshData);
                        sessionStorage.setItem("sidebar_menu_data", JSON.stringify(freshData));
                        localStorage.setItem("sidebar_menu_data", JSON.stringify(freshData));
                    }
                }
            } catch (error) {
                console.error("Error fetching sidebar menu", error);
            }
        };

        fetchMenuData();
    }, []);

    function updateIconSidebar(e) {
        if (e && e.target && e.target.getAttribute("subitems")) {
            const ul = document.getElementById("two-column-menu");
            if (ul) {
                const iconItems = ul.querySelectorAll(".nav-icon.active");
                let activeIconItems = [...iconItems];
                activeIconItems.forEach((item) => {
                    item.classList.remove("active");
                    var id = item.getAttribute("subitems");
                    if (document.getElementById(id))
                        document.getElementById(id).classList.remove("show");
                });
            }
        }
    }

    const getIconClass = (iconName) => {
        if (!iconName) return "ri-dashboard-2-line";
        
        // Handle explicit Remix/LineAwesome classes if they exist in DB
        if (iconName.startsWith("ri-") || iconName.startsWith("la-") || iconName.startsWith("bx-") || iconName.startsWith("bx ")) {
            return iconName;
        }

        // Map legacy MVC database icon names to Velzon React icon names (Remix Icons)
        const iconMap = {
            "dashboard": "ri-dashboard-2-line",
            "shoppingcart-out": "ri-shopping-cart-2-line",
            "notebook": "ri-file-list-3-line",
            "user": "ri-user-3-line",
        };

        return iconMap[iconName.toLowerCase()] || "ri-record-circle-line";
    };

    const toggleMenu = (id, e, isRoot = false, parentId = null) => {
        e.preventDefault();

        // Fix for multiple open menus: Clear manual DOM manipulation before updating React State
        if (isRoot) {
            const ul = document.getElementById("navbar-nav");
            if (ul) {
                // Remove active classes
                const activeItems = ul.querySelectorAll("a.active");
                activeItems.forEach((item) => {
                    item.setAttribute("aria-expanded", false);
                    item.classList.remove("active");
                });

                // Remove show classes from dropdowns
                const openDropdowns = ul.querySelectorAll(".collapse.menu-dropdown.show");
                openDropdowns.forEach((dropdown) => {
                    dropdown.classList.remove("show");
                });
            }
        }

        setMenuStates(prevState => {
            if (isRoot) {
                return { [id]: !prevState[id] };
            } else if (parentId) {
                return { [parentId]: true, [id]: !prevState[id] };
            }
            return { [id]: !prevState[id] };
        });
        
        if (isRoot) {
            setIscurrentState(id);
        }
        updateIconSidebar(e);
    };

    // Calculate menuItems on every render using latest rawData and menuStates
    let menuItems = [];

    if (rawData && rawData.length > 0) {
        // 1. Find root level items (MenuLevel === "1")
        const rootItems = rawData.filter(item => item.menuLevel === "1" || item.MenuLevel === "1");

        const cleanLink = (link) => {
            if (!link || link === "#" || link === "") return "/#";
            if (link.toLowerCase().includes("parceldashboard")) return "/data/parceldashboard";
            if (link.toLowerCase().includes("dashboard")) return "/dashboard";
            let cleaned = link.replace(/\.\.\//g, ""); // Remove ../
            if (!cleaned.startsWith("/")) cleaned = "/" + cleaned;
            return cleaned;
        };

        rootItems.forEach(root => {
            const rootId = root.formName || root.FormName;
            
            // Build root object
            let rootObj = {
                id: rootId,
                label: root.menuName || root.MenuName,
                icon: getIconClass(root.menuIcon || root.MenuIcon),
                link: cleanLink(root.menuLink || root.MenuLink),
                click: function (e) {
                    toggleMenu(rootId, e, true);
                },
                stateVariables: menuStates[rootId] || false,
                subItems: []
            };

            // 2. Find Level 2 items (Children of root)
            const level2Items = rawData.filter(item => 
                (item.menuLevel === "2" || item.MenuLevel === "2") && 
                (item.form_MenuGroup === rootId || item.Form_MenuGroup === rootId)
            );

            if (level2Items.length > 0) {
                level2Items.forEach(l2 => {
                    const l2Id = l2.formName || l2.FormName;
                    
                    let l2Obj = {
                        id: l2Id,
                        label: l2.menuName || l2.MenuName,
                        icon: l2.menuIcon || l2.MenuIcon,
                        link: cleanLink(l2.menuLink || l2.MenuLink),
                        parentId: rootId,
                    };

                    // 3. Find Level 3+ items (Children of Level 2)
                    const level3Items = rawData.filter(item => 
                        (item.menuLevel !== "1" && item.MenuLevel !== "1" && item.menuLevel !== "2" && item.MenuLevel !== "2") && 
                        (item.form_MenuGroup === l2Id || item.Form_MenuGroup === l2Id)
                    );

                    if (level3Items.length > 0) {
                        l2Obj.isChildItem = true;
                        l2Obj.click = function (e) {
                            toggleMenu(l2Id, e, false, rootId);
                        };
                        l2Obj.stateVariables = menuStates[l2Id] || false;
                        l2Obj.childItems = [];

                        level3Items.forEach(l3 => {
                            l2Obj.childItems.push({
                                id: l3.formName || l3.FormName,
                                label: l3.menuName || l3.MenuName,
                                icon: l3.menuIcon || l3.MenuIcon,
                                link: cleanLink(l3.menuLink || l3.MenuLink),
                                parentId: l2Id,
                            });
                        });
                    }

                    rootObj.subItems.push(l2Obj);
                });
            } else {
                // Remove properties if there are no subItems so Velzon UI doesn't render an arrow
                delete rootObj.subItems;
                delete rootObj.stateVariables;
                delete rootObj.click;
            }

            menuItems.push(rootObj);
        });
    }

    return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;
