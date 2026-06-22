import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { getAllMasterList } from "../../../helpers/fakebackend_helper";
import { toast } from 'react-toastify';
import classnames from "classnames";

const AllMasterList = () => {
    const [allMasters, setAllMasters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Main");

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
        }
    };

    const columns = useMemo(
        () => [
            {
                header: "Name",
                id: "name",
                accessorFn: (row) => row.name || row.Name,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    return String(row.getValue(id)).toLowerCase().includes(String(filterValue).toLowerCase());
                }
            },
            {
                header: "Count",
                id: "count",
                accessorFn: (row) => row.count || row.Count,
                enableColumnFilter: true,
                filterFn: (row, id, filterValue) => {
                    return String(row.getValue(id)).toLowerCase().includes(String(filterValue).toLowerCase());
                }
            },
            {
                header: "Actions",
                id: "actions",
                enableColumnFilter: false,
                cell: (cellProps) => {
                    const url = cellProps.row.original.url || cellProps.row.original.URL;
                    return (
                        <div className="d-flex gap-2">
                            <a
                                href={url}
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

    // Filtering data by Type (case-insensitive and handles PascalCase/camelCase)
    const getFilteredData = (type) => {
        return allMasters.filter(item => {
            const itemType = item.type || item.Type;
            return itemType && itemType.toString().trim().toLowerCase() === type.toLowerCase();
        });
    };

    const tabs = [
        { id: "Main", label: "4'C MASTER" },
        { id: "Grading", label: "GRADING" },
        { id: "Location", label: "LOCATION" },
        { id: "Invoice", label: "INVOICE" },
        { id: "Origin", label: "DIAMOND ORIGIN" },
        { id: "Jewellery", label: "JEWELLERY" }
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
                                </CardHeader>
                                <CardBody>
                                    <Row>
                                        <Col md={3}>
                                            <div className="list-group mt-1">
                                                {tabs.map((tab) => (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        className={classnames("list-group-item list-group-item-action", { active: activeTab === tab.id })}
                                                        onClick={() => toggleTab(tab.id)}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </Col>
                                        <Col md={9}>
                                            <TabContent activeTab={activeTab} className="text-muted">
                                                {tabs.map((tab) => (
                                                    <TabPane tabId={tab.id} key={tab.id}>
                                                        {loading ? (
                                                            <div className="text-center mt-3">
                                                                <div className="spinner-border text-primary" role="status">
                                                                    <span className="visually-hidden">Loading...</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <TableContainer
                                                                columns={columns}
                                                                data={getFilteredData(tab.id)}
                                                                isGlobalFilter={true}
                                                                customPageSize={9999}
                                                                isPagination={false}
                                                                isShowEntries={false}
                                                                divClass="table-responsive table-card mb-3"
                                                                tableClass="align-middle table-nowrap mb-0"
                                                                theadClass="table-light"
                                                                SearchPlaceholder={`Search ${tab.label}...`}
                                                            />
                                                        )}
                                                    </TabPane>
                                                ))}
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
