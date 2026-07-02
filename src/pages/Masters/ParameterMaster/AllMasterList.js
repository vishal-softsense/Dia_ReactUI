import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, TabContent, TabPane, Nav, NavItem, NavLink } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { getAllMasterList } from "../../../helpers/fakebackend_helper";
import { toast } from 'react-toastify';
import classnames from "classnames";
import { useTranslation } from "react-i18next";

const AllMasterList = () => {
    const { t } = useTranslation();
    const [allMasters, setAllMasters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Main");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        setLoading(true);
        try {
            const response = await getAllMasterList();
            if (response.success || response.Success) {
                setAllMasters(response.data || response.Data || []);
            } else {
                toast.error(response.data || response.Data || "Failed to fetch master list");
            }
        } catch (error) {
            toast.error("Failed to fetch master list");
        }
        setLoading(false);
    };

    const toggleTab = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
            setSearchQuery("");
        }
    };

    const getTabColor = (id) => {
        switch (id) {
            case "Main": return "#2970FF";
            case "Grading": return "#10B981";
            case "Location": return "#EF4444";
            case "Invoice": return "#8B5CF6";
            case "Origin": return "#F59E0B";
            case "Jewellery": return "#EC4899";
            default: return "#4A5568";
        }
    };

    const columns = useMemo(() => [
            {
                header: t("Name"),
                id: "name",
                accessorFn: (row) => row.name || row.Name,
                enableColumnFilter: false,
                cell: (cellProps) => {
                    const name = cellProps.row.original.name || cellProps.row.original.Name || "";
                    return (
                        <span className="fw-medium text-body" style={{ fontSize: "13px" }}>
                            {name}
                        </span>
                    );
                }
            },
            {
                header: t("Count"),
                id: "count",
                accessorFn: (row) => row.count || row.Count,
                enableColumnFilter: false,   // Change 2: removed column filter
                cell: (cellProps) => {
                    const count = cellProps.row.original.count ?? cellProps.row.original.Count ?? 0;
                    // Change 1: count as colored badge (user can cancel this cell block to revert to plain number)
                    return (
                        <span style={{
                            backgroundColor: "#e5f1ff",
                            color: "#299cdb",
                            borderRadius: "20px",
                            padding: "2px 10px",
                            fontSize: "12px",
                            fontWeight: "600",
                            display: "inline-block"
                        }}>
                            {count}
                        </span>
                    );
                }
            },
            {
                header: t("Actions"),
                id: "actions",
                enableColumnFilter: false,
                cell: (cellProps) => {
                    const rawUrl = cellProps.row.original.url || cellProps.row.original.URL || "";
                    const targetUrl = rawUrl;
                    const activeColor = getTabColor(activeTab);
                    return (
                        <div className="d-flex gap-2">
                            <a
                                href={targetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn"
                                style={{
                                    backgroundColor: `${activeColor}15`,
                                    color: activeColor,
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    padding: "0.467rem 1.5rem",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            ><i className="ri-settings-2-line me-1"></i> {t("Manage")}
                            </a>
                        </div>
                    );
                }
            }
        ], [t, activeTab]);

    document.title = `${t("All Master List")} | ${t("Admin")}`;

    // Filtering data by Type (case-insensitive and handles PascalCase/camelCase) and Search Query
    const getFilteredData = (type) => {
        return allMasters.filter(item => {
            const itemType = item.type || item.Type;
            const matchesType = itemType && itemType.toString().trim().toLowerCase() === type.toLowerCase();
            if (!matchesType) return false;
            if (!searchQuery) return true;
            const name = item.name || item.Name || "";
            return name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    };

    const tabs = [
        { id: "Main", label: "4'C MASTER", icon: "ri-focus-3-line" },
        { id: "Grading", label: "GRADING", icon: "ri-medal-line" },
        { id: "Location", label: "LOCATION", icon: "ri-map-pin-2-line" },
        { id: "Invoice", label: "INVOICE", icon: "ri-file-list-3-line" },
        { id: "Origin", label: "DIAMOND ORIGIN", icon: "ri-vip-diamond-line" },
        { id: "Jewellery", label: "JEWELLERY", icon: "ri-sparkling-2-line" }
    ];

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("All Master List")} pageTitle="Masters" />

                    <Row>
                        <Col lg={12}>
                            <Card className="shadow-lg border-0 overflow-hidden">
                                <CardHeader className="bg-transparent border-bottom d-flex align-items-center justify-content-between py-3">
                                    <h5 className="card-title mb-0 fs-16 fw-semibold text-primary d-flex align-items-center gap-2">
                                        <i className="ri-focus-3-line align-middle text-primary fs-20"></i>
                                        {t("All Master List")}
                                    </h5>
                                    <div className="search-box">
                                        <input
                                            type="text"
                                            className="form-control search"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder={t("Search masters...")}
                                        />
                                        <i className="bx bx-search-alt search-icon"></i>
                                    </div>
                                </CardHeader>
                                <CardBody className="p-0">
                                    <Row className="g-0">
                                        <Col md={3} className="bg-light border-end">
                                            <div className="p-3">
                                                <p className="text-muted text-uppercase fs-11 fw-semibold mb-3">{t("Select Category")}</p>
                                                <Nav pills className="flex-column gap-2">
                                                    {tabs.map((tab) => {
                                                        const color = getTabColor(tab.id);
                                                        return (
                                                            <NavItem key={tab.id}>
                                                                <NavLink
                                                                    className={classnames("d-flex justify-content-between align-items-center py-3 border-0 rounded-3 cursor-pointer transition-all", { 
                                                                        "bg-white shadow text-dark border-start-3": activeTab === tab.id,
                                                                        "text-muted": activeTab !== tab.id
                                                                    })}
                                                                    onClick={() => toggleTab(tab.id)}
                                                                    style={activeTab === tab.id ? { borderLeft: `4px solid ${color}` } : {}}
                                                                >
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <div
                                                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                                                            style={{ width: "28px", height: "28px", backgroundColor: `${color}15`, color: color }}
                                                                        >
                                                                            <i className={classnames(tab.icon, "fs-14")}></i>
                                                                        </div>
                                                                        <span className="fw-semibold fs-13">{t(tab.label)}</span>
                                                                    </div>
                                                                </NavLink>
                                                            </NavItem>
                                                        );
                                                    })}
                                                </Nav>
                                            </div>
                                        </Col>
                                        <Col md={9}>
                                            <div className="p-4">
                                                <TabContent activeTab={activeTab}>
                                                    {tabs.map((tab) => {
                                                        const filteredData = getFilteredData(tab.id);
                                                        const color = getTabColor(tab.id);
                                                        return (
                                                            <TabPane tabId={tab.id} key={tab.id}>
                                                                <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3 pb-3 border-bottom">
                                                                    <div>
                                                                        <h4 className="fw-bold mb-1" style={{ color: color }}>
                                                                            {t(tab.label)} {t("Masters")}
                                                                        </h4>
                                                                        <p className="text-muted mb-0 fs-12">
                                                                            {t("View and configure parameters under the")} {t(tab.label)} {t("group.")}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {loading ? (
                                                                    <div className="d-flex justify-content-center align-items-center py-5">
                                                                        <div className="spinner-border text-primary" role="status">
                                                                            <span className="visually-hidden">{t("Loading...")}</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <TableContainer
                                                                            columns={columns}
                                                                            data={filteredData}
                                                                            isGlobalFilter={false}
                                                                            customPageSize={9999}
                                                                            isPagination={false}
                                                                            isShowEntries={false}
                                                                            divClass="table-responsive table-card mb-3"
                                                                            tableClass="align-middle table-nowrap mb-0"
                                                                            theadClass="table-light"
                                                                        />
                                                                        {/* Summary footer */}
                                                                        <div className="p-3 bg-light text-muted border-top rounded-bottom fs-13 d-flex align-items-center gap-1">
                                                                            <i className="ri-list-check me-1 text-primary fs-16"></i>
                                                                            <span>
                                                                                {t("Total of")} <strong className="text-primary">{filteredData.length}</strong> {t("sub-masters in this category")}
                                                                            </span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </TabPane>
                                                        );
                                                    })}
                                                </TabContent>
                                            </div>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default AllMasterList;
