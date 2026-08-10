import React, { useState } from 'react';
import { Container, Row, Col, Card, CardBody, CardHeader, Spinner, Table, Modal, ModalHeader, ModalBody, Badge, Input, Nav, NavItem, NavLink, TabContent, TabPane, Progress } from 'reactstrap';
import Select from 'react-select';
import CountUp from 'react-countup';
import { Link } from 'react-router-dom';
import { useParcelDashboardData } from './useParcelDashboardData';
import { exportToExcel } from '../../helpers/excel_helper';
import { toast, ToastContainer } from 'react-toastify';
import { 
    getAllBrokers, getAllCustomers, getAllOpenMemos, 
    getAllOutstandings, getAllPayables, getAllOverdueSales 
} from '../../services/ParcelDashboardService';

const getResponseData = (res) => {
    if (!res) return null;
    const hasSuccess = res.success !== undefined ? res.success : res.Success;
    if (hasSuccess) {
        const payload = res.data !== undefined ? res.data : res.Data;
        if (payload !== undefined) return payload;
    }
    if (res.data) {
        const innerSuccess = res.data.success !== undefined ? res.data.success : res.data.Success;
        if (innerSuccess) {
            const innerPayload = res.data.data !== undefined ? res.data.data : res.data.Data;
            if (innerPayload !== undefined) return innerPayload;
        }
        if (Array.isArray(res.data)) {
            return res.data;
        }
    }
    if (Array.isArray(res)) {
        return res;
    }
    return null;
};

const getInitials = (name) => {
    if (!name || name === '—') return '?';
    const cleanName = name.replace(/[^\w\s]/g, '').trim();
    const parts = cleanName.split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
};

const getAvatarColorClass = (name) => {
    if (!name) return 'bg-primary-subtle text-primary';
    const h = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
        'bg-primary-subtle text-primary',
        'bg-success-subtle text-success',
        'bg-info-subtle text-info',
        'bg-warning-subtle text-warning',
        'bg-danger-subtle text-danger',
        'bg-secondary-subtle text-secondary'
    ];
    return colors[h % colors.length];
};

const ParcelDashboard = () => {
    document.title = "Parcel Dashboard | Premium Jewellery ERP";

    const {
        filterDate,
        bestSeller,
        overdueSaleCount,
        overduePurCount,
        topBrokers,
        topCustomers,
        countrySales,
        topOpenMemo,
        topOutstanding,
        topPayable,
        topOverdue,
        loading,
        handleFilterChange
    } = useParcelDashboardData();

    const [detailsModal, setDetailsModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalData, setModalData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [reportType, setReportType] = useState('');
    const [activeTab, setActiveTab] = useState('customers');

    const dateOptions = [
        { value: 'Today', label: 'Today' },
        { value: 'Yesterday', label: 'Yesterday' },
        { value: 'Week', label: 'Week' },
        { value: 'Last Week', label: 'Last Week' },
        { value: 'Month', label: 'Month' },
        { value: 'Last Month', label: 'Last Month' },
        { value: 'Quarter', label: 'Quarter' },
        { value: 'Year', label: 'Year' }
    ];

    const openDetailsModal = async (type, title) => {
        setReportType(type);
        setModalTitle(title);
        setDetailsModal(true);
        setModalLoading(true);
        setSearchQuery('');
        
        let month = "";
        let year = "";
        let tdate = "";
        const today = new Date();

        if (filterDate.value === 'Today') {
            tdate = today.getDate().toString();
            month = (today.getMonth() + 1).toString();
            year = today.getFullYear().toString();
        } else if (filterDate.value === 'Yesterday') {
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            tdate = yesterday.getDate().toString();
            month = (yesterday.getMonth() + 1).toString();
            year = yesterday.getFullYear().toString();
        } else if (filterDate.value === 'Week') {
            let curr = new Date();
            let day = curr.getDay();
            let diffToMonday = day === 0 ? -6 : 1 - day;
            let first = new Date(curr);
            first.setDate(curr.getDate() + diffToMonday);
            let last = new Date(first);
            last.setDate(first.getDate() + 6);
            tdate = JSON.stringify({ start: first.toISOString().split('T')[0], end: last.toISOString().split('T')[0] });
        } else if (filterDate.value === 'Last Week') {
            let curr = new Date();
            let day = curr.getDay();
            let diffToMonday = day === 0 ? -6 : 1 - day;
            let thisWeekMonday = new Date(curr);
            thisWeekMonday.setDate(curr.getDate() + diffToMonday);
            let lastWeekMonday = new Date(thisWeekMonday);
            lastWeekMonday.setDate(thisWeekMonday.getDate() - 7);
            let lastWeekSunday = new Date(lastWeekMonday);
            lastWeekSunday.setDate(lastWeekMonday.getDate() + 6);
            tdate = JSON.stringify({ start: lastWeekMonday.toISOString().split('T')[0], end: lastWeekSunday.toISOString().split('T')[0] });
        } else if (filterDate.value === 'Month') {
            month = (today.getMonth() + 1).toString();
            year = today.getFullYear().toString();
        } else if (filterDate.value === 'Last Month') {
            const lastMonth = new Date();
            lastMonth.setMonth(today.getMonth() - 1);
            month = (lastMonth.getMonth() + 1).toString();
            year = lastMonth.getFullYear().toString();
        } else if (filterDate.value === 'Quarter') {
            let curr = new Date();
            let y = curr.getFullYear();
            let m = curr.getMonth() + 1;
            let startDate, endDate;
            if (m >= 1 && m <= 3) { startDate = `${y}-01-01`; endDate = `${y}-03-31`; }
            else if (m >= 4 && m <= 6) { startDate = `${y}-04-01`; endDate = `${y}-06-30`; }
            else if (m >= 7 && m <= 9) { startDate = `${y}-07-01`; endDate = `${y}-09-30`; }
            else { startDate = `${y}-10-01`; endDate = `${y}-12-31`; }
            tdate = JSON.stringify({ start: startDate, end: endDate });
        } else if (filterDate.value === 'Year') {
            year = today.getFullYear().toString();
        }

        try {
            let res;
            if (type === 'brokers') {
                res = await getAllBrokers(month, year, tdate);
            } else if (type === 'customers') {
                res = await getAllCustomers(month, year, tdate);
            } else if (type === 'openmemos') {
                res = await getAllOpenMemos(month, year, tdate);
            } else if (type === 'outstanding') {
                res = await getAllOutstandings(month, year, tdate);
            } else if (type === 'payable') {
                res = await getAllPayables(month, year, tdate);
            } else if (type === 'overdues') {
                res = await getAllOverdueSales(month, year, tdate);
            }
            
            const listData = getResponseData(res);
            if (listData) {
                setModalData(listData);
            } else {
                setModalData([]);
            }
        } catch (err) {
            console.error("Error loading modal details", err);
            setModalData([]);
        } finally {
            setModalLoading(false);
        }
    };

    const getFilteredModalData = () => {
        if (!searchQuery) return modalData;
        const q = searchQuery.toLowerCase().trim();
        return modalData.filter(item => {
            const nameField = (item.broker || item.customer || item.countryName || '').toLowerCase();
            const invNo = item.invNo ? item.invNo.toString() : '';
            return nameField.includes(q) || invNo.includes(q);
        });
    };

    const calculateTotals = (data) => {
        let totals = { cts: 0, receivableUsd: 0, receivableInr: 0, sales: 0, pl: 0, remainingAmount: 0, invoiceAmount: 0 };
        data.forEach(item => {
            totals.cts += Number(item.cts) || 0;
            totals.receivableUsd += Number(item.receivableUsd || item.receivableUSD) || 0;
            totals.receivableInr += Number(item.receivableInr || item.receivableINR) || 0;
            totals.sales += Number(item.sales) || 0;
            totals.pl += Number(item.pl || item.pL) || 0;
            totals.invoiceAmount += Number(item.invoiceAmount) || 0;
            totals.remainingAmount += Number(item.remainingAmount) || 0;
        });
        return totals;
    };

    const currentTotals = calculateTotals(getFilteredModalData());

    const handleExportExcel = async () => {
        try {
            const dataToExport = getFilteredModalData();
            if (dataToExport.length === 0) {
                toast.warning("No data available to export");
                return;
            }

            let headers = [];
            let rows = [];

            if (reportType === 'overdues') {
                headers = ["Invoice No", "Invoice Date", "Customer", "Invoice Amount", "Remaining Amount", "Overdue Days"];
                dataToExport.forEach(item => {
                    rows.push([
                        item.invNo || '',
                        item.invDate || '',
                        item.customer || '',
                        Number(item.invoiceAmount || 0),
                        Number(item.remainingAmount || 0),
                        Number(item.overdueDays || 0)
                    ]);
                });
                rows.push([
                    "TOTAL",
                    "",
                    "",
                    Number(currentTotals.invoiceAmount || 0),
                    Number(currentTotals.remainingAmount || 0),
                    ""
                ]);
            } else if (reportType === 'brokers') {
                headers = ["Broker", "Carats", "Receivable USD", "Receivable INR", "Sales", "PL"];
                dataToExport.forEach(item => {
                    rows.push([
                        item.broker || '',
                        Number(item.cts || 0),
                        Number(item.receivableUsd || item.receivableUSD || 0),
                        Number(item.receivableInr || item.receivableINR || 0),
                        Number(item.sales || 0),
                        Number(item.pl || 0)
                    ]);
                });
                rows.push([
                    "TOTAL",
                    Number(currentTotals.cts || 0),
                    Number(currentTotals.receivableUsd || 0),
                    Number(currentTotals.receivableInr || 0),
                    Number(currentTotals.sales || 0),
                    Number(currentTotals.pl || 0)
                ]);
            } else {
                headers = ["Name", "Carats", "Receivable USD", "Receivable INR"];
                dataToExport.forEach(item => {
                    rows.push([
                        item.customer || item.broker || '',
                        Number(item.cts || 0),
                        Number(item.receivableUSD || item.receivableUsd || 0),
                        Number(item.receivableINR || item.receivableInr || 0)
                    ]);
                });
                rows.push([
                    "TOTAL",
                    Number(currentTotals.cts || 0),
                    Number(currentTotals.receivableUsd || 0),
                    Number(currentTotals.receivableInr || 0)
                ]);
            }

            const sheetName = reportType.charAt(0).toUpperCase() + reportType.slice(1);
            const fileName = `${modalTitle.replace(/\s+/g, '_')}_Report`;
            const result = await exportToExcel(headers, rows, sheetName, fileName);
            if (result && result.success) {
                toast.success("Report exported to Excel successfully");
            } else {
                toast.error(result.error ? String(result.error) : "Export failed");
            }
        } catch (err) {
            toast.error("Error exporting report: " + err.message);
        }
    };

    return (
        <React.Fragment>
            <style>{`
                .parcel-glass-card {
                    background: var(--vz-card-bg);
                    border: 1px solid var(--vz-border-color);
                    transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
                    box-shadow: var(--vz-card-box-shadow);
                }
                .parcel-glass-card:hover {
                    transform: translateY(-4px) scale(1.008);
                }
                .parcel-glow-primary:hover {
                    border-color: var(--vz-primary) !important;
                    box-shadow: 0 10px 25px rgba(64, 81, 137, 0.15) !important;
                }
                .parcel-glow-danger:hover {
                    border-color: var(--vz-danger) !important;
                    box-shadow: 0 10px 25px rgba(240, 101, 72, 0.15) !important;
                }
                .parcel-glow-warning:hover {
                    border-color: var(--vz-warning) !important;
                    box-shadow: 0 10px 25px rgba(247, 184, 75, 0.15) !important;
                }
                .parcel-glow-success:hover {
                    border-color: var(--vz-success) !important;
                    box-shadow: 0 10px 25px rgba(10, 179, 156, 0.15) !important;
                }
                .text-gradient-primary {
                    background: linear-gradient(135deg, var(--vz-primary) 0%, var(--vz-info) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .parcel-hero-avatar {
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                }
                .parcel-row-card {
                    background: var(--vz-card-bg-custom, var(--vz-card-bg, var(--vz-secondary-bg, #fff)));
                    border: 1px solid var(--vz-border-color, #e9ebec);
                    border-left: 4px solid var(--vz-primary);
                    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                }
                .parcel-row-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(0,0,0,0.05);
                    border-color: var(--vz-primary-border-subtle, var(--vz-border-color, #e9ebec));
                }
                .parcel-row-card.border-left-danger {
                    border-left-color: var(--vz-danger) !important;
                }
                .parcel-row-card.border-left-warning {
                    border-left-color: var(--vz-warning) !important;
                }
                .parcel-row-card.border-left-success {
                    border-left-color: var(--vz-success) !important;
                }
                .parcel-row-card.border-left-primary {
                    border-left-color: var(--vz-primary) !important;
                }
            `}</style>
            <div className="page-content">
                <Container fluid>

                    <Row className="mb-4 pb-1">
                        <Col xs={12}>
                            <div className="d-flex align-items-lg-center flex-lg-row flex-column justify-content-between">
                                <div className="flex-grow-1">
                                    <h4 className="fs-20 mb-1 fw-bold text-gradient-primary">Parcel Performance Center</h4>
                                    <p className="text-muted mb-0">High-fidelity metrics and analytics mapping legacy MVC Parcel Dashboard endpoints.</p>
                                </div>
                                <div className="mt-3 mt-lg-0 d-flex flex-wrap gap-2 align-items-center">

                                    <div className="input-group" style={{ width: '220px' }}>
                                        <span className="input-group-text bg-light text-muted border-light-subtle fs-14">
                                            <i className="ri-calendar-event-line"></i>
                                        </span>
                                        <Select
                                            value={filterDate}
                                            onChange={handleFilterChange}
                                            options={dateOptions}
                                            classNamePrefix="select2-selection"
                                            styles={{
                                                control: (baseStyles, state) => ({
                                                    ...baseStyles,
                                                    minWidth: '150px',
                                                    borderTopLeftRadius: 0,
                                                    borderBottomLeftRadius: 0,
                                                    backgroundColor: 'var(--vz-input-bg-custom, #fff)',
                                                    borderColor: state.isFocused ? 'var(--vz-input-border-active, #405189)' : 'var(--vz-border-color, #e9ebec)',
                                                    boxShadow: 'none',
                                                    color: 'var(--vz-body-color, #495057)',
                                                    '&:hover': {
                                                        borderColor: 'var(--vz-input-border-active, #405189)'
                                                    },
                                                    fontSize: '13px',
                                                    fontWeight: '600'
                                                }),
                                                singleValue: (baseStyles) => ({
                                                    ...baseStyles,
                                                    color: 'var(--vz-body-color, #495057)'
                                                }),
                                                option: (baseStyles, state) => ({
                                                    ...baseStyles,
                                                    backgroundColor: state.isSelected 
                                                        ? 'var(--vz-primary, #405189)' 
                                                        : state.isFocused 
                                                            ? 'var(--vz-dropdown-link-hover-bg, rgba(64, 81, 137, 0.1))' 
                                                            : 'transparent',
                                                    color: state.isSelected 
                                                        ? '#fff' 
                                                        : state.isFocused 
                                                            ? 'var(--vz-dropdown-link-hover-color, #1e2125)' 
                                                            : 'var(--vz-dropdown-link-color, #212529)',
                                                    fontSize: '13px',
                                                    cursor: 'pointer'
                                                }),
                                                menu: (baseStyles) => ({
                                                    ...baseStyles,
                                                    backgroundColor: 'var(--vz-dropdown-bg, #fff)',
                                                    borderColor: 'var(--vz-dropdown-border-color, #e9ebec)',
                                                    zIndex: 9999
                                                })
                                            }}
                                        />
                                    </div>

                                    <div className="d-flex gap-2">
                                        <Link to="/dashboard/parcel-stock-analysis" className="btn btn-outline-primary border-dashed waves-effect waves-light shadow-none d-flex align-items-center fw-semibold py-2">
                                            <i className="ri-pie-chart-2-line me-1"></i> Parcel Stock Analysis
                                        </Link>
                                        <Link to="/dashboard/parcel-sale-analysis" className="btn btn-outline-success border-dashed waves-effect waves-light shadow-none d-flex align-items-center fw-semibold py-2">
                                            <i className="ri-line-chart-line me-1"></i> Parcel Sale Analysis
                                        </Link>
                                        <Link to="/dashboard/parcel-purchase-analysis" className="btn btn-outline-warning border-dashed waves-effect waves-light shadow-none d-flex align-items-center fw-semibold py-2">
                                            <i className="ri-shopping-basket-line me-1"></i> Parcel Purchase Analysis
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
 

                    <Row>

                        <Col lg={4}>
                            <Card className="parcel-glass-card parcel-glow-primary border-0 overflow-hidden shadow-lg" style={{ minHeight: '140px' }}>
                                <div className="card-body p-4 position-relative">
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <h6 className="text-uppercase text-muted fw-bold mb-0 fs-12 letter-spacing-1">Best Selling Seller</h6>
                                        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fs-11">
                                            Monthly Lead
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="avatar-md flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-28 shadow-sm">
                                                👑
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="fs-22 fw-extrabold mb-1">
                                                {loading ? <Spinner size="sm" color="primary" /> : (bestSeller ? bestSeller.seller : '—')}
                                            </h4>
                                            {bestSeller && (
                                                <p className="text-muted mb-0 fs-13">
                                                    Sales Contribution: <span className="text-success fw-semibold">${Number(bestSeller.sales).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
 

                        <Col lg={4} md={6}>
                            <Card className="parcel-glass-card parcel-glow-danger border-0 shadow-lg" style={{ minHeight: '140px' }}>
                                <CardBody className="p-4 d-flex flex-column justify-content-between">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h6 className="text-uppercase text-muted fw-bold mb-0 fs-12 letter-spacing-1">Overdue Purchase Invoice</h6>
                                        <Badge color="danger" className="bg-danger-subtle text-danger px-2 py-1 border border-danger-subtle rounded-pill">Urgent</Badge>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between mt-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="avatar-sm">
                                                <span className="avatar-title bg-danger-subtle text-danger rounded fs-20 shadow-sm">
                                                    <i className="ri-alarm-warning-line"></i>
                                                </span>
                                            </div>
                                            <h3 className="fs-24 fw-bold mb-0">
                                                {loading ? <Spinner size="sm" color="danger" /> : <CountUp start={0} end={overduePurCount} duration={1.5} />}
                                            </h3>
                                        </div>
                                        <button className="btn btn-link text-danger fw-semibold fs-13 p-0" onClick={() => openDetailsModal('payable', 'Outstanding Overdue Purchases')}>View Ledger</button>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
 

                        <Col lg={4} md={6}>
                            <Card className="parcel-glass-card parcel-glow-warning border-0 shadow-lg" style={{ minHeight: '140px' }}>
                                <CardBody className="p-4 d-flex flex-column justify-content-between">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h6 className="text-uppercase text-muted fw-bold mb-0 fs-12 letter-spacing-1">Overdue Sale Invoice</h6>
                                        <Badge color="warning" className="bg-warning-subtle text-warning px-2 py-1 border border-warning-subtle rounded-pill">Pending</Badge>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between mt-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="avatar-sm">
                                                <span className="avatar-title bg-warning-subtle text-warning rounded fs-20 shadow-sm">
                                                    <i className="ri-wallet-3-line"></i>
                                                </span>
                                            </div>
                                            <h3 className="fs-24 fw-bold mb-0">
                                                {loading ? <Spinner size="sm" color="warning" /> : <CountUp start={0} end={overdueSaleCount} duration={1.5} />}
                                            </h3>
                                        </div>
                                        <button className="btn btn-link text-warning fw-semibold fs-13 p-0" onClick={() => openDetailsModal('overdues', 'Overdue Sales Detail')}>Track Invoices</button>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>


                    <Row className="mt-3">

                        <Col lg={8} md={12}>
                            <Card style={{ minHeight: '450px' }} className="parcel-glass-card parcel-glow-primary border-0 shadow-lg">
                                <CardHeader className="d-flex align-items-center justify-content-between py-2 bg-light-subtle border-bottom border-light-subtle">
                                    <Nav tabs className="border-bottom-0 flex-nowrap" style={{ cursor: 'pointer' }}>
                                        <NavItem>
                                            <NavLink
                                                className={`fw-bold text-uppercase fs-12 px-3 py-2.5 rounded-top-2 border-0 ${activeTab === 'customers' ? 'active bg-primary text-white' : 'text-muted bg-transparent'}`}
                                                onClick={() => setActiveTab('customers')}
                                            >
                                                Top 10 Customers
                                            </NavLink>
                                        </NavItem>
                                        <NavItem className="ms-1">
                                            <NavLink
                                                className={`fw-bold text-uppercase fs-12 px-3 py-2.5 rounded-top-2 border-0 ${activeTab === 'brokers' ? 'active bg-primary text-white' : 'text-muted bg-transparent'}`}
                                                onClick={() => setActiveTab('brokers')}
                                            >
                                                Top 5 Brokers
                                            </NavLink>
                                        </NavItem>
                                    </Nav>
                                    <div>
                                        {activeTab === 'customers' ? (
                                            <button className="btn btn-soft-primary btn-sm rounded-pill fw-semibold" onClick={() => openDetailsModal('customers', 'All Customer Ledger')}>
                                                View All Customers
                                            </button>
                                        ) : (
                                            <button className="btn btn-soft-primary btn-sm rounded-pill fw-semibold" onClick={() => openDetailsModal('brokers', 'All Broker Ledger')}>
                                                View All Brokers
                                            </button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardBody className="p-0">
                                    {loading ? (
                                        <div className="text-center py-5"><Spinner color="primary" /></div>
                                    ) : (
                                        <TabContent activeTab={activeTab}>
                                            <TabPane tabId="customers">
                                                <div className="table-responsive">
                                                    <Table className="table-hover table-centered mb-0 align-middle">
                                                        <thead className="table-light text-muted">
                                                            <tr className="fs-11 text-uppercase text-muted border-bottom">
                                                                <th style={{ width: '45%' }}>Customer</th>
                                                                <th style={{ width: '20%', textAlign: 'right' }}>Carats</th>
                                                                <th style={{ width: '35%', textAlign: 'right' }}>Receivable USD</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {topCustomers.slice(0, 10).map((c, i) => (
                                                                <tr key={i} className="fs-13 border-bottom border-light-subtle">
                                                                    <td className="fw-semibold d-flex align-items-center gap-2 py-2.5">
                                                                        <div className={`avatar-xs rounded-circle d-flex align-items-center justify-content-center fw-bold fs-11 ${getAvatarColorClass(c.customer)}`} style={{ width: '28px', height: '28px', minWidth: '28px' }}>
                                                                            {getInitials(c.customer)}
                                                                        </div>
                                                                        <span className="text-truncate" style={{ maxWidth: '220px' }}>{c.customer || '—'}</span>
                                                                    </td>
                                                                    <td className="text-end text-muted">{Number(c.cts || 0).toFixed(3)}</td>
                                                                    <td className="text-end text-success fw-bold">${Number(c.recievableUSD || c.recievableUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                                </tr>
                                                            ))}
                                                            {topCustomers.length === 0 && (
                                                                <tr>
                                                                    <td colSpan="3" className="text-center text-muted py-5">No customer records.</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </TabPane>
                                            <TabPane tabId="brokers">
                                                <div className="table-responsive">
                                                    <Table className="table-hover table-centered mb-0 align-middle">
                                                        <thead className="table-light text-muted">
                                                            <tr className="fs-11 text-uppercase text-muted border-bottom">
                                                                <th style={{ width: '45%' }}>Broker</th>
                                                                <th style={{ width: '20%', textAlign: 'right' }}>Carats</th>
                                                                <th style={{ width: '35%', textAlign: 'right' }}>Receivable USD</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {topBrokers.slice(0, 5).map((b, i) => (
                                                                <tr key={i} className="fs-13 border-bottom border-light-subtle">
                                                                    <td className="fw-semibold d-flex align-items-center gap-2 py-2.5">
                                                                        <div className={`avatar-xs rounded-circle d-flex align-items-center justify-content-center fw-bold fs-11 ${getAvatarColorClass(b.broker)}`} style={{ width: '28px', height: '28px', minWidth: '28px' }}>
                                                                            {getInitials(b.broker)}
                                                                        </div>
                                                                        <span className="text-truncate" style={{ maxWidth: '220px' }}>{b.broker || '—'}</span>
                                                                    </td>
                                                                    <td className="text-end text-muted">{Number(b.cts || 0).toFixed(3)}</td>
                                                                    <td className="text-end text-success fw-bold">${Number(b.recievableUsd || b.recievableUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                                </tr>
                                                            ))}
                                                            {topBrokers.length === 0 && (
                                                                <tr>
                                                                    <td colSpan="3" className="text-center text-muted py-5">No broker records.</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </TabPane>
                                        </TabContent>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>


                        <Col lg={4} md={12}>
                            <Card style={{ minHeight: '450px' }} className="parcel-glass-card parcel-glow-success border-0 shadow-lg">
                                <CardHeader className="py-3 bg-light-subtle border-bottom border-light-subtle">
                                    <h5 className="card-title mb-0 fs-12 fw-bold text-uppercase text-muted letter-spacing-1">Sales by Countries</h5>
                                </CardHeader>
                                <CardBody className="p-3">
                                    {loading ? (
                                        <div className="text-center py-5"><Spinner color="primary" /></div>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            {countrySales.map((c, i) => {
                                                const totalSales = countrySales.reduce((acc, curr) => acc + (Number(curr.sales) || 0), 0);
                                                const pct = totalSales > 0 ? ((Number(c.sales) || 0) / totalSales) * 100 : 0;
                                                return (
                                                    <div key={i} className="mb-1">
                                                        <div className="d-flex align-items-center justify-content-between mb-1">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className="fs-15">📍</span>
                                                                <span className="fw-semibold fs-13 text-dark-emphasis">{c.countryName || 'Other'}</span>
                                                            </div>
                                                            <div className="text-end">
                                                                <span className="fw-bold fs-13 text-success">${Number(c.sales || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill ms-2 fs-10">
                                                                    {c.plPerOnPurAmount >= 0 ? '+' : ''}{Number(c.plPerOnPurAmount || 0).toFixed(1)}% P/L
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Progress value={pct} color="success" className="progress-sm bg-light" />
                                                    </div>
                                                );
                                            })}
                                            {countrySales.length === 0 && (
                                                <div className="text-center text-muted py-5">No country sales records.</div>
                                            )}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>


                    <Row className="mt-3">

                        <Col lg={4} md={6}>
                            <Card style={{ minHeight: '430px' }} className="parcel-glass-card parcel-glow-primary border-0 shadow-lg">
                                <CardHeader className="d-flex align-items-center justify-content-between py-3 bg-light-subtle border-bottom border-light-subtle">
                                    <h5 className="card-title mb-0 fs-12 fw-bold text-uppercase text-muted letter-spacing-1">Top 10 Open Memo</h5>
                                    <button className="btn btn-soft-primary btn-sm rounded-pill fw-semibold" onClick={() => openDetailsModal('openmemos', 'All Open Memo Ledger')}>View All</button>
                                </CardHeader>
                                <CardBody className="p-0">
                                    {loading ? <div className="text-center py-5"><Spinner color="primary" /></div> : (
                                        <div className="table-responsive">
                                            <Table className="table-hover table-centered mb-0 align-middle">
                                                <thead className="table-light text-muted">
                                                    <tr className="fs-11 text-uppercase text-muted border-bottom">
                                                        <th style={{ width: '45%' }}>Customer</th>
                                                        <th style={{ width: '20%', textAlign: 'right' }}>Carats</th>
                                                        <th style={{ width: '35%', textAlign: 'right' }}>Receivable USD</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {topOpenMemo.slice(0, 10).map((om, i) => (
                                                        <tr key={i} className="fs-13 border-bottom border-light-subtle">
                                                            <td className="fw-semibold d-flex align-items-center gap-2 py-2.5">
                                                                <div className={`avatar-xs rounded-circle d-flex align-items-center justify-content-center fw-bold fs-11 ${getAvatarColorClass(om.customer)}`} style={{ width: '28px', height: '28px', minWidth: '28px' }}>
                                                                    {getInitials(om.customer)}
                                                                </div>
                                                                <span className="text-truncate" style={{ maxWidth: '110px' }}>{om.customer || '—'}</span>
                                                            </td>
                                                            <td className="text-end text-muted">{Number(om.cts || 0).toFixed(3)}</td>
                                                            <td className="text-end text-success fw-bold">${Number(om.recievableUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    ))}
                                                    {topOpenMemo.length === 0 && (
                                                        <tr>
                                                            <td colSpan="3" className="text-center text-muted py-5">No open memos.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>


                        <Col lg={4} md={6}>
                            <Card style={{ minHeight: '430px' }} className="parcel-glass-card parcel-glow-primary border-0 shadow-lg">
                                <CardHeader className="d-flex align-items-center justify-content-between py-3 bg-light-subtle border-bottom border-light-subtle">
                                    <h5 className="card-title mb-0 fs-12 fw-bold text-uppercase text-muted letter-spacing-1">Top 10 Outstanding</h5>
                                    <button className="btn btn-soft-primary btn-sm rounded-pill fw-semibold" onClick={() => openDetailsModal('outstanding', 'All Outstanding Ledger')}>View All</button>
                                </CardHeader>
                                <CardBody className="p-0">
                                    {loading ? <div className="text-center py-5"><Spinner color="primary" /></div> : (
                                        <div className="table-responsive">
                                            <Table className="table-hover table-centered mb-0 align-middle">
                                                <thead className="table-light text-muted">
                                                    <tr className="fs-11 text-uppercase text-muted border-bottom">
                                                        <th style={{ width: '45%' }}>Customer</th>
                                                        <th style={{ width: '20%', textAlign: 'right' }}>Carats</th>
                                                        <th style={{ width: '35%', textAlign: 'right' }}>Receivable USD</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {topOutstanding.slice(0, 10).map((out, i) => (
                                                        <tr key={i} className="fs-13 border-bottom border-light-subtle">
                                                            <td className="fw-semibold d-flex align-items-center gap-2 py-2.5">
                                                                <div className={`avatar-xs rounded-circle d-flex align-items-center justify-content-center fw-bold fs-11 ${getAvatarColorClass(out.customer)}`} style={{ width: '28px', height: '28px', minWidth: '28px' }}>
                                                                    {getInitials(out.customer)}
                                                                </div>
                                                                <span className="text-truncate" style={{ maxWidth: '110px' }}>{out.customer || '—'}</span>
                                                            </td>
                                                            <td className="text-end text-muted">{Number(out.cts || 0).toFixed(3)}</td>
                                                            <td className="text-end text-success fw-bold">${Number(out.recievableUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    ))}
                                                    {topOutstanding.length === 0 && (
                                                        <tr>
                                                            <td colSpan="3" className="text-center text-muted py-5">No outstanding records.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>


                        <Col lg={4} md={12}>
                            <Card style={{ minHeight: '430px' }} className="parcel-glass-card parcel-glow-danger border-0 shadow-lg">
                                <CardHeader className="d-flex align-items-center justify-content-between py-3 bg-light-subtle border-bottom border-light-subtle">
                                    <h5 className="card-title mb-0 fs-12 fw-bold text-uppercase text-muted letter-spacing-1">Top 10 Payable</h5>
                                    <button className="btn btn-soft-primary btn-sm rounded-pill fw-semibold" onClick={() => openDetailsModal('payable', 'All Payable Ledger')}>View All</button>
                                </CardHeader>
                                <CardBody className="p-0">
                                    {loading ? <div className="text-center py-5"><Spinner color="primary" /></div> : (
                                        <div className="table-responsive">
                                            <Table className="table-hover table-centered mb-0 align-middle">
                                                <thead className="table-light text-muted">
                                                    <tr className="fs-11 text-uppercase text-muted border-bottom">
                                                        <th style={{ width: '45%' }}>Supplier / Customer</th>
                                                        <th style={{ width: '20%', textAlign: 'right' }}>Carats</th>
                                                        <th style={{ width: '35%', textAlign: 'right' }}>Payable USD</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {topPayable.slice(0, 10).map((pay, i) => (
                                                        <tr key={i} className="fs-13 border-bottom border-light-subtle">
                                                            <td className="fw-semibold d-flex align-items-center gap-2 py-2.5">
                                                                <div className={`avatar-xs rounded-circle d-flex align-items-center justify-content-center fw-bold fs-11 ${getAvatarColorClass(pay.customer)}`} style={{ width: '28px', height: '28px', minWidth: '28px' }}>
                                                                    {getInitials(pay.customer)}
                                                                </div>
                                                                <span className="text-truncate" style={{ maxWidth: '110px' }}>{pay.customer || '—'}</span>
                                                            </td>
                                                            <td className="text-end text-muted">{Number(pay.cts || 0).toFixed(3)}</td>
                                                            <td className="text-end text-danger fw-bold">${Number(pay.recievableUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    ))}
                                                    {topPayable.length === 0 && (
                                                        <tr>
                                                            <td colSpan="3" className="text-center text-muted py-5">No payables found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>


                    <Row className="mt-2 mb-4">
                        <Col xs={12}>
                            <Card className="parcel-glass-card parcel-glow-danger border-0 shadow-lg">
                                <CardHeader className="d-flex align-items-center justify-content-between py-3 bg-danger-subtle-op border-bottom border-danger-subtle">
                                    <h5 className="card-title mb-0 fs-14 fw-bold text-uppercase text-danger d-flex align-items-center">
                                        <i className="ri-alarm-warning-fill me-2 fs-16"></i> Top 10 Overdue Sales
                                    </h5>
                                    <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={() => openDetailsModal('overdues', 'All Overdue Sales Ledger')}>View All Reports</button>
                                </CardHeader>
                                <CardBody className="p-0">
                                    {loading ? <div className="text-center py-5"><Spinner color="danger" /></div> : (
                                        <div className="table-responsive">
                                            <Table className="table-hover table-centered mb-0 align-middle table-nowrap">
                                                <thead className="table-light text-muted">
                                                    <tr className="fs-12 text-uppercase">
                                                        <th style={{ width: '10%' }}>Inv No</th>
                                                        <th style={{ width: '15%' }}>Inv Date</th>
                                                        <th>Customer</th>
                                                        <th style={{ width: '15%', textAlign: 'right' }}>Invoice Amt</th>
                                                        <th style={{ width: '15%', textAlign: 'right' }}>Remaining Amt</th>
                                                        <th style={{ width: '15%', textAlign: 'center' }}>Overdue Days</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {topOverdue.slice(0, 10).map((od, i) => (
                                                        <tr key={i} className="fs-13">
                                                            <td className="fw-semibold">#{od.invNo}</td>
                                                            <td>{od.invDate || '—'}</td>
                                                            <td className="fw-medium">{od.customer || '—'}</td>
                                                            <td className="text-end fw-semibold">${Number(od.invoiceAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                            <td className="text-end fw-bold text-danger">${Number(od.remainingAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                            <td className="text-center">
                                                                <Badge color="danger" className="rounded-pill px-2.5 py-1 fs-11">
                                                                    {od.overdueDays} Days
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {topOverdue.length === 0 && (
                                                        <tr>
                                                            <td colSpan="6" className="text-center text-muted py-5 fs-14">No overdue sales invoices. Awesome job!</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>


                    <Modal isOpen={detailsModal} toggle={() => setDetailsModal(!detailsModal)} size="xl" centered scrollable>
                        <ModalHeader toggle={() => setDetailsModal(!detailsModal)} className="bg-light border-bottom p-3">
                            <div className="d-flex align-items-center justify-content-between w-100 me-2">
                                <h5 className="modal-title fs-15 fw-bold text-uppercase text-primary">{modalTitle}</h5>
                                {!modalLoading && modalData.length > 0 && (
                                    <button className="btn btn-success btn-sm waves-effect waves-light d-flex align-items-center ms-3" onClick={handleExportExcel}>
                                        <i className="ri-file-excel-2-line me-1"></i> Export Excel
                                    </button>
                                )}
                            </div>
                        </ModalHeader>
                        <ModalBody className="p-0">

                            <div className="p-3 border-bottom d-flex align-items-center justify-content-between" style={{ backgroundColor: 'var(--vz-light, #f3f3f9)', borderBottom: '1px solid var(--vz-border-color)' }}>
                                <div className="position-relative flex-grow-1 me-3">
                                    <Input 
                                        type="text" 
                                        placeholder="Search by name, code or invoice number..." 
                                        className="form-control"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ 
                                            backgroundColor: 'var(--vz-input-bg-custom, #fff)', 
                                            color: 'var(--vz-body-color, #495057)',
                                            borderColor: 'var(--vz-border-color, #e9ebec)'
                                        }}
                                    />
                                    <span className="position-absolute end-0 top-50 translate-middle-y me-3 text-muted">
                                        <i className="ri-search-line"></i>
                                    </span>
                                </div>
                                <span className="fs-13 fw-semibold text-muted text-nowrap badge bg-primary-subtle text-primary rounded-pill px-2.5 py-1">
                                    Records found: {getFilteredModalData().length}
                                </span>
                            </div>

                            {modalLoading ? (
                                <div className="text-center py-5"><Spinner color="primary" /> <p className="mt-2 text-muted">Loading ledger transactions...</p></div>
                            ) : (
                                <div className="table-responsive">

                                    {!modalLoading && getFilteredModalData().length > 0 && (
                                        <div className="px-4 py-2.5 text-uppercase text-muted fw-bold fs-11 d-flex align-items-center justify-content-between border-bottom" style={{ backgroundColor: 'var(--vz-light, #f3f3f9)', borderBottom: '1px solid var(--vz-border-color)' }}>
                                            {reportType === 'overdues' ? (
                                                <>
                                                    <div style={{ width: '15%' }}>Invoice</div>
                                                    <div style={{ width: '20%' }}>Customer</div>
                                                    <div style={{ width: '20%', textAlign: 'right' }}>Invoice Amt</div>
                                                    <div style={{ width: '20%', textAlign: 'right' }}>Remaining</div>
                                                    <div style={{ width: '25%', textAlign: 'center' }}>Overdue</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ width: reportType === 'brokers' ? '25%' : '35%' }}>Entity Name</div>
                                                    <div style={{ width: reportType === 'brokers' ? '15%' : '20%', textAlign: 'right' }}>Carats (Cts)</div>
                                                    <div style={{ width: reportType === 'brokers' ? '15%' : '22%', textAlign: 'right' }}>USD Value</div>
                                                    <div style={{ width: reportType === 'brokers' ? '15%' : '23%', textAlign: 'right' }}>INR Value</div>
                                                    {reportType === 'brokers' && (
                                                        <>
                                                            <div style={{ width: '15%', textAlign: 'right' }}>Sales</div>
                                                            <div style={{ width: '15%', textAlign: 'right' }}>PL</div>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}


                                    <div className="px-4 py-3 d-flex flex-column gap-2" style={{ maxHeight: '50vh', overflowY: 'auto', backgroundColor: 'var(--vz-body-bg-custom, var(--vz-body-bg, #f3f3f9))' }}>
                                        {getFilteredModalData().map((item, idx) => {
                                            let borderClass = 'border-left-primary';
                                            if (reportType === 'overdues') {
                                                borderClass = 'border-left-danger';
                                            } else if (reportType === 'payable') {
                                                borderClass = 'border-left-warning';
                                            } else if (reportType === 'outstanding') {
                                                borderClass = 'border-left-success';
                                            }
                                            
                                            return (
                                                <div key={idx} className={`parcel-row-card p-3 rounded-3 d-flex align-items-center justify-content-between ${borderClass}`}>
                                                    {reportType === 'overdues' ? (
                                                        <>

                                                            <div style={{ width: '15%' }}>
                                                                <span className="fw-extrabold text-primary fs-14">#{item.invNo}</span>
                                                                <div className="text-muted fs-11 mt-0.5">{item.invDate}</div>
                                                            </div>

                                                            <div style={{ width: '20%' }} className="d-flex align-items-center gap-2">
                                                                <div className={`avatar-xs rounded-circle d-flex align-items-center justify-content-center fw-bold fs-11 ${getAvatarColorClass(item.customer)}`} style={{ width: '30px', height: '30px', minWidth: '30px' }}>
                                                                    {getInitials(item.customer)}
                                                                </div>
                                                                <span className="fw-semibold text-truncate text-body" style={{ maxWidth: '120px' }}>{item.customer || '—'}</span>
                                                            </div>

                                                            <div style={{ width: '20%', textAlign: 'right' }} className="fw-semibold text-body">
                                                                ${Number(item.invoiceAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </div>

                                                            <div style={{ width: '20%', textAlign: 'right' }} className="fw-bold text-danger">
                                                                ${Number(item.remainingAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </div>

                                                            <div style={{ width: '25%', textAlign: 'center' }}>
                                                                <Badge color="danger" className="bg-danger-subtle text-danger px-3 py-1.5 rounded-pill fs-11 border border-danger-subtle">
                                                                    {item.overdueDays} Days
                                                                </Badge>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>

                                                            <div style={{ width: reportType === 'brokers' ? '25%' : '35%' }} className="d-flex align-items-center gap-2">
                                                                <div className={`avatar-xs rounded-circle d-flex align-items-center justify-content-center fw-bold fs-11 ${getAvatarColorClass(item.customer || item.broker || '—')}`} style={{ width: '32px', height: '32px', minWidth: '32px' }}>
                                                                    {getInitials(item.customer || item.broker)}
                                                                </div>
                                                                <span className="fw-bold text-body text-truncate" style={{ maxWidth: '180px' }}>
                                                                    {item.customer || item.broker || '—'}
                                                                </span>
                                                            </div>

                                                            <div style={{ width: reportType === 'brokers' ? '15%' : '20%', textAlign: 'right' }}>
                                                                <span className="badge bg-light text-body border border-light-subtle rounded px-2.5 py-1.5 fw-semibold">
                                                                    {Number(item.cts || 0).toFixed(3)} Cts
                                                                </span>
                                                            </div>

                                                            <div style={{ width: reportType === 'brokers' ? '15%' : '22%', textAlign: 'right' }} className="fw-extrabold text-success fs-14">
                                                                ${Number(item.receivableUSD || item.receivableUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </div>

                                                            <div style={{ width: reportType === 'brokers' ? '15%' : '23%', textAlign: 'right' }} className="fw-semibold text-muted fs-13">
                                                                ₹{Number(item.receivableINR || item.receivableInr || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </div>
                                                            {reportType === 'brokers' && (
                                                                <>

                                                                    <div style={{ width: '15%', textAlign: 'right' }} className="fw-semibold text-success">
                                                                        ${Number(item.sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                    </div>

                                                                    <div style={{ width: '15%', textAlign: 'right' }} className="fw-bold text-info">
                                                                        ${Number(item.pl || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {getFilteredModalData().length === 0 && (
                                            <div className="text-center text-muted py-5">No matching ledger details found.</div>
                                        )}
                                    </div>


                                    {!modalLoading && getFilteredModalData().length > 0 && (
                                        <div className="px-4 py-3 border-top border-2 sticky-bottom d-flex align-items-center justify-content-between text-uppercase fw-extrabold fs-13" style={{ backgroundColor: 'var(--vz-card-bg-custom, var(--vz-card-bg, var(--vz-secondary-bg, #fff)))', borderTop: '2px solid var(--vz-border-color)', zIndex: 10 }}>
                                            {reportType === 'overdues' ? (
                                                <>
                                                    <div className="text-muted" style={{ width: '15%' }}>Total</div>
                                                    <div style={{ width: '20%' }}></div>
                                                    <div className="text-body" style={{ width: '20%', textAlign: 'right' }}>${currentTotals.invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                    <div className="text-danger" style={{ width: '20%', textAlign: 'right' }}>${currentTotals.remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                    <div style={{ width: '25%' }}></div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="text-muted" style={{ width: reportType === 'brokers' ? '25%' : '35%' }}>Total</div>
                                                    <div className="text-body" style={{ width: reportType === 'brokers' ? '15%' : '20%', textAlign: 'right' }}>{currentTotals.cts.toFixed(3)} Cts</div>
                                                    <div className="text-success" style={{ width: reportType === 'brokers' ? '15%' : '22%', textAlign: 'right' }}>${currentTotals.receivableUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                    <div className="text-body" style={{ width: reportType === 'brokers' ? '15%' : '23%', textAlign: 'right' }}>₹{currentTotals.receivableInr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                    {reportType === 'brokers' && (
                                                        <>
                                                            <div className="text-success" style={{ width: '15%', textAlign: 'right' }}>${currentTotals.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                            <div className="text-info" style={{ width: '15%', textAlign: 'right' }}>${currentTotals.pl.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </ModalBody>
                    </Modal>
                    <ToastContainer />
                </Container>
            </div>
        </React.Fragment>
    );
};

export default ParcelDashboard;
