import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, TabContent, TabPane } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { getAllMasterList } from "../../../helpers/fakebackend_helper";
import { toast } from 'react-toastify';
import classnames from "classnames";

const AllMasterList = () => {
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

    const columns = useMemo(
        () => [
            {
                header: "Name",
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
                header: "Count",
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
                header: "Actions",
                id: "actions",
                enableColumnFilter: false,
                cell: (cellProps) => {
                    const rawUrl = cellProps.row.original.url || cellProps.row.original.URL || "";
                    const targetUrl = rawUrl;
                    return (
                        <div className="d-flex gap-2">
                            <a
                                href={targetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn"
                                style={{
                                    backgroundColor: "#e5f1ff",
                                    color: "#299cdb",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    padding: "4px 10px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                <i className="ri-settings-2-line me-1"></i> Manage
                            </a>
                        </div>
                    );
                }
            }
        ],
        []
    );

    document.title = "All Master List | Admin";

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
                    <BreadCrumb title="All Master List" pageTitle="Masters" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
                                    <h4 className="card-title mb-0">All Master List</h4>
                                    <div className="search-box">
                                        <input
                                            type="text"
                                            className="form-control search"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Search masters..."
                                        />
                                        <i className="bx bx-search-alt search-icon"></i>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <Row>
                                        <Col md={3}>
                                            {/* Change 4: sidebar tabs with icons */}
                                            <div className="list-group mt-1">
                                                {tabs.map((tab) => (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        className={classnames("list-group-item list-group-item-action d-flex align-items-center gap-2", { active: activeTab === tab.id })}
                                                        onClick={() => toggleTab(tab.id)}
                                                    >
                                                        <i className={tab.icon} style={{ fontSize: "15px" }}></i>
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </Col>
                                        <Col md={9}>
                                            <TabContent activeTab={activeTab} className="text-muted mt-4">
                                                {tabs.map((tab) => {
                                                    const filteredData = getFilteredData(tab.id);
                                                    return (
                                                        <TabPane tabId={tab.id} key={tab.id}>
                                                            {loading ? (
                                                                <div className="text-center mt-3">
                                                                    <div className="spinner-border text-primary" role="status">
                                                                        <span className="visually-hidden">Loading...</span>
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
                                                                        divClass="table-responsive table-card mb-2"
                                                                        tableClass="align-middle table-nowrap mb-0"
                                                                        theadClass="table-light"
                                                                    />
                                                                    {/* Summary footer */}
                                                                    <div className="p-2 bg-light text-muted border-top rounded-bottom" style={{ fontSize: "12px" }}>
                                                                        <i className="ri-list-check me-1"></i>
                                                                        <strong>{filteredData.length}</strong> masters in this category
                                                                    </div>
                                                                </>
                                                            )}
                                                        </TabPane>
                                                    );
                                                })}
                                            </TabContent>
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
