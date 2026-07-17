import React, { useState } from 'react';
import { Container, Row, Col, Card, CardBody, CardHeader, Spinner, Table, Progress, Modal, ModalHeader, ModalBody } from 'reactstrap';
import Select from 'react-select';
import CountUp from 'react-countup';
import ReactApexChart from "react-apexcharts";
import { Link } from 'react-router-dom';
import { useDashboardData } from './useDashboardData';
import { exportToExcel } from '../../helpers/excel_helper';

const Dashboard = () => {
    document.title = "Dashboard | Premium Jewellery ERP";

    const {
        filterDate,
        bestSeller,
        overdueSale,
        overduePur,
        topBrokers,
        topCustomers,
        countrySales,
        stoneAge,
        revisedAge,
        plLegend,
        loading,
        handleFilterChange
    } = useDashboardData();

    const [modal, setModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', name: '', subtitle: '', value: '' });

    const toggleModal = () => setModal(!modal);

    const exportCustomersToExcel = async () => {
        if (!topCustomers || topCustomers.length === 0) return;
        const headers = ["Rank", "Customer Name", "Total Sales", "P/L %"];
        const rows = topCustomers.map((customer, idx) => [
            `#${idx + 1}`,
            customer.customer && customer.customer.trim() ? customer.customer : '—',
            Number(customer.sales || 0),
            `${customer.plPerOnPurAmount > 0 ? '+' : ''}${customer.plPerOnPurAmount.toFixed(2)}%`
        ]);
        await exportToExcel(headers, rows, "Top Customers", "Top_10_Customers_Report");
    };

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

    // Broker Chart Configuration
    const brokerChartSeries = [{
        name: 'Sales ($)',
        data: topBrokers.map(b => b.sales)
    }];
    
    const brokerChartOptions = {
        chart: { 
            type: 'bar', 
            height: 480, 
            toolbar: { show: false },
            events: {
                dataPointSelection: (event, chartContext, config) => {
                    const dataIndex = config.dataPointIndex;
                    if (dataIndex !== undefined && dataIndex !== -1) {
                        const selectedPoints = (config.selectedDataPoints && config.selectedDataPoints[config.seriesIndex]) || [];
                        const isSelected = selectedPoints.includes(dataIndex);
                        
                        if (isSelected) {
                            // Defer the deselection to avoid recursive event loops
                            setTimeout(() => {
                                chartContext.toggleDataPointSelection(config.seriesIndex, dataIndex);
                            }, 50);
                            
                            const broker = topBrokers[dataIndex];
                            if (broker) {
                                setModalContent({
                                    title: 'Broker Details',
                                    name: broker.broker,
                                    subtitle: 'Registered Broker Performance',
                                    value: `$${broker.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                });
                                setModal(true);
                            }
                        }
                    }
                }
            }
        },
        plotOptions: { 
            bar: { 
                horizontal: true, 
                borderRadius: 6,
                barHeight: '45%'
            } 
        },
        fill: {
            type: 'solid'
        },
        colors: ['#0ab39c'],
        dataLabels: { enabled: false },
        xaxis: { categories: topBrokers.map(b => b.broker) },
        grid: { borderColor: '#f1f1f1' },
        states: {
            active: {
                filter: {
                    type: 'none'
                }
            }
        }
    };

    // Country Donut Chart Configuration
    const countryChartSeries = countrySales.map(c => c.sales);
    const countryChartOptions = {
        chart: { 
            type: 'donut', 
            height: 333,
            events: {
                dataPointSelection: (event, chartContext, config) => {
                    const dataIndex = config.dataPointIndex;
                    if (dataIndex !== undefined && dataIndex !== -1) {
                        const selectedPoints = (config.selectedDataPoints && config.selectedDataPoints[config.seriesIndex]) || [];
                        const isSelected = selectedPoints.includes(dataIndex);
                        
                        if (isSelected) {
                            // Defer the deselection to avoid recursive event loops
                            setTimeout(() => {
                                chartContext.toggleDataPointSelection(config.seriesIndex, dataIndex);
                            }, 50);
                            
                            const country = countrySales[dataIndex];
                            if (country) {
                                setModalContent({
                                    title: 'Country Details',
                                    name: country.countryName || 'Unknown',
                                    subtitle: 'Regional Sales Performance',
                                    value: `$${country.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                });
                                setModal(true);
                            }
                        }
                    }
                }
            }
        },
        labels: countrySales.map(c => c.countryName || 'Unknown'),
        colors: ['#405189', '#0ab39c', '#f7b84b', '#f06548', '#299cdb'],
        legend: { position: 'bottom' },
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                expandOnClick: false,
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total Sales',
                            color: '#878a99',
                            formatter: function (w) {
                                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                return '$' + total.toLocaleString(undefined, { maximumFractionDigits: 0 });
                            }
                        }
                    }
                }
            }
        },
        states: {
            active: {
                filter: {
                    type: 'none'
                }
            }
        }
    };    const getRankBadge = (idx) => {
        if (idx === 0) return { bg: 'bg-warning-subtle text-warning border-0 fs-13', label: '🥇' };
        if (idx === 1) return { bg: 'bg-secondary-subtle text-secondary border-0 fs-13', label: '🥈' };
        if (idx === 2) return { bg: 'border-0 fs-13', label: '🥉', style: { backgroundColor: 'rgba(160, 82, 45, 0.15)', color: '#a0522d' } };
        return { bg: 'bg-light-subtle text-muted', label: `#${idx + 1}` };
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    
                    {/* Header */}
                    <Row className="mb-3 pb-1">
                        <Col xs={12}>
                            <div className="d-flex align-items-lg-center flex-lg-row flex-column">
                                <div className="flex-grow-1">
                                    <h4 className="fs-18 mb-1 fw-semibold">Performance Dashboard</h4>
                                    <p className="text-muted mb-0">Here's what's happening with your store today.</p>
                                </div>
                                <div className="mt-3 mt-lg-0">
                                    <form action="#">
                                        <Row className="g-3 mb-0 align-items-center">
                                            <div className="col-sm-auto">
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light text-muted border-light-subtle fs-14">
                                                        <i className="ri-calendar-2-line"></i>
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
                                                                backgroundColor: 'var(--vz-light, #f8f9fa)',
                                                                borderColor: state.isFocused ? 'var(--vz-input-border-active, #405189)' : 'var(--vz-border-color, #e9ebec)',
                                                                boxShadow: 'none',
                                                                '&:hover': {
                                                                    borderColor: 'var(--vz-input-border-active, #405189)'
                                                                },
                                                                fontSize: '13px',
                                                                fontWeight: '500',
                                                                color: 'var(--vz-body-color, #495057)'
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
                                            </div>
                                            <div className="col-auto">
                                                <div className="d-flex gap-2">
                                                    <button type="button" className="btn btn-light border waves-effect waves-light shadow-none d-flex align-items-center">
                                                        <i className="ri-database-2-line me-1"></i> Stock Analysis
                                                    </button>
                                                    <button type="button" className="btn btn-light border waves-effect waves-light shadow-none d-flex align-items-center">
                                                        <i className="ri-bubble-chart-line me-1"></i> Sale Analysis
                                                    </button>
                                                    <button type="button" className="btn btn-light border waves-effect waves-light shadow-none d-flex align-items-center">
                                                        <i className="ri-shopping-bag-3-line me-1"></i> Purchase Analysis
                                                    </button>
                                                    <button type="button" className="btn btn-light border waves-effect waves-light shadow-none d-flex align-items-center">
                                                        <i className="ri-calendar-todo-line me-1"></i> Month Analysis
                                                    </button>
                                                </div>
                                            </div>
                                        </Row>
                                    </form>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* KPI Widgets */}
                    <Row>
                        {/* Best Seller Widget */}
                        <Col xl={4} md={6}>
                            <Card className="card-animate border shadow-sm" style={{ backgroundImage: "linear-gradient(135deg, rgba(64, 81, 137, 0.04) 0%, rgba(64, 81, 137, 0.01) 100%)", borderColor: "rgba(64, 81, 137, 0.12)" }}>
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-semibold text-muted text-truncate mb-0 fs-12">Best Seller of the Month</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="fs-12 mb-0 text-success fw-medium">
                                                <i className="fs-13 align-middle ri-arrow-right-up-line"></i> Top Ranked
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-3">
                                                {loading ? <Spinner size="sm" color="primary" /> : (bestSeller ? bestSeller.seller : <span className="text-muted fw-normal fs-18">—</span>)}
                                            </h4>
                                            <Link to="#" className="text-decoration-underline text-muted fs-13">View detailed report</Link>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary text-white rounded-circle fs-3 shadow">
                                                <i className="ri-award-fill"></i>
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        {/* Overdue Purchase */}
                        <Col xl={4} md={6}>
                            <Card className="card-animate border shadow-sm" style={{ backgroundImage: "linear-gradient(135deg, rgba(240, 101, 72, 0.04) 0%, rgba(240, 101, 72, 0.01) 100%)", borderColor: "rgba(240, 101, 72, 0.12)" }}>
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-semibold text-muted text-truncate mb-0 fs-12">Overdue Purchases</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="fs-12 mb-0 text-danger fw-medium">
                                                <i className="fs-13 align-middle ri-alarm-warning-fill"></i> Action Needed
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-3">
                                                {loading ? <Spinner size="sm" color="danger" /> : <CountUp start={0} end={overduePur} duration={1.5} />}
                                            </h4>
                                            <Link to="#" className="text-decoration-underline text-muted fs-13">View all invoices</Link>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger text-white rounded-circle fs-3 shadow">
                                                <i className="ri-shopping-bag-3-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        {/* Overdue Sale */}
                        <Col xl={4} md={6}>
                            <Card className="card-animate border shadow-sm" style={{ backgroundImage: "linear-gradient(135deg, rgba(247, 184, 75, 0.04) 0%, rgba(247, 184, 75, 0.01) 100%)", borderColor: "rgba(247, 184, 75, 0.12)" }}>
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-semibold text-muted text-truncate mb-0 fs-12">Overdue Sales</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="fs-12 mb-0 text-warning fw-medium">
                                                <i className="fs-13 align-middle ri-time-line"></i> Pending
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-3">
                                                {loading ? <Spinner size="sm" color="warning" /> : <CountUp start={0} end={overdueSale} duration={1.5} />}
                                            </h4>
                                            <Link to="#" className="text-decoration-underline text-muted fs-13">View all sales</Link>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning text-white rounded-circle fs-3 shadow">
                                                <i className="ri-money-dollar-circle-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Data Visualization Row */}
                    <Row>
                        <Col xl={4}>
                            <Card className="card-height-100">
                                <CardHeader className="align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Top 5 Brokers</h4>
                                </CardHeader>
                                <CardBody>
                                    {loading ? <div className="text-center p-4"><Spinner color="primary" /></div> : (
                                        <ReactApexChart 
                                            options={brokerChartOptions} 
                                            series={brokerChartSeries} 
                                            type="bar" 
                                            height={480} 
                                            className="apex-charts" 
                                        />
                                    )}
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={8}>
                            <Card className="card-height-100">
                                <CardHeader className="align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Top 10 Customers</h4>
                                    <div className="flex-shrink-0">
                                        <button type="button" className="btn btn-soft-info btn-sm" onClick={exportCustomersToExcel}>Export Report</button>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {loading ? <div className="text-center p-4"><Spinner color="success" /></div> : (
                                        <div className="table-responsive table-card">
                                            <Table className="table-hover table-borderless table-centered align-middle table-nowrap mb-0">
                                                <thead className="text-muted table-light">
                                                    <tr>
                                                        <th scope="col" style={{ width: "15%" }}>Rank</th>
                                                        <th scope="col">Customer Name</th>
                                                        <th scope="col" style={{ width: "25%", textAlign: "right" }}>Total Sales</th>
                                                        <th scope="col" style={{ width: "20%", textAlign: "right" }}>P/L %</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {topCustomers.map((customer, idx) => {
                                                        const badgeInfo = getRankBadge(idx);
                                                        return (
                                                            <tr key={idx}>
                                                                <td>
                                                                    <span 
                                                                        className={`badge ${badgeInfo.bg || ''} rounded-pill px-2 py-1 fs-12`}
                                                                        style={badgeInfo.style || {}}
                                                                    >
                                                                        {badgeInfo.label}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <h5 className="fs-14 mb-0 fw-medium">{customer.customer && customer.customer.trim() ? customer.customer : '—'}</h5>
                                                                </td>
                                                                <td className="text-end">
                                                                    <span className="text-success fw-semibold fs-14">
                                                                        ${customer.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </td>
                                                                <td className="text-end">
                                                                    <span className={`badge ${customer.plPerOnPurAmount > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2 py-1 fs-11`}>
                                                                        <i className={`${customer.plPerOnPurAmount > 0 ? 'ri-arrow-right-up-line' : 'ri-arrow-right-down-line'} align-middle me-1`}></i>
                                                                        {customer.plPerOnPurAmount > 0 ? '+' : ''}{customer.plPerOnPurAmount.toFixed(2)}%
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {topCustomers.length === 0 && (
                                                        <tr>
                                                            <td colSpan="4" className="text-center text-muted p-4">No customers found for this period.</td>
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

                    {/* Additional Analytics Row */}
                    <Row>
                        <Col xl={4}>
                            <Card className="card-height-100">
                                <CardHeader className="align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Sales by Countries</h4>
                                </CardHeader>
                                <CardBody>
                                    {loading ? <div className="text-center p-4"><Spinner color="primary" /></div> : (
                                        <ReactApexChart 
                                            options={countryChartOptions} 
                                            series={countryChartSeries} 
                                            type="donut" 
                                            height={333} 
                                            className="apex-charts" 
                                        />
                                    )}
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={4}>
                            <Card className="card-height-100">
                                <CardHeader className="align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Stone Age Overview</h4>
                                </CardHeader>
                                <CardBody>
                                    {loading ? <div className="text-center p-4"><Spinner color="info" /></div> : (
                                        <div className="live-preview">
                                            {["Dead Stock", "Fresh Stock", "Normal", "Oldage"].map((categoryName, idx) => {
                                                const foundItem = stoneAge.find(s => s.stoneAge === categoryName) || { stoneAge: categoryName, totPcs: 0 };
                                                const colors = ["danger", "success", "primary", "warning"];
                                                const color = colors[idx];
                                                return (
                                                    <div className="mb-3" key={idx}>
                                                        <div className="d-flex justify-content-between mb-1">
                                                            <span className="text-muted fw-medium">{categoryName}</span>
                                                            <span className="text-body fw-bold">{foundItem.totPcs} Pcs</span>
                                                        </div>
                                                        <Progress value={Math.min(foundItem.totPcs / 100, 100)} color={color} style={{ height: "6px" }} className={`rounded-pill bg-${color}-subtle`} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={4}>
                            <Card>
                                <CardHeader className="align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Revised Age</h4>
                                </CardHeader>
                                <CardBody>
                                    {loading ? <div className="text-center p-4"><Spinner color="primary" /></div> : (
                                        <div className="live-preview">
                                            {["Revised Before 180 Days"].map((categoryName, idx) => {
                                                const foundItem = revisedAge.find(s => s.revisedAge === categoryName) || { revisedAge: categoryName, totPcs: 0 };
                                                return (
                                                    <div className="d-flex align-items-center mb-1" key={idx}>
                                                        <div className="avatar-xs flex-shrink-0 me-3">
                                                            <span className="avatar-title bg-success-subtle text-success rounded-circle fs-16">
                                                                <i className="ri-money-dollar-circle-line"></i>
                                                            </span>
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <h5 className="fs-14 mb-0 text-muted fw-normal">{categoryName}</h5>
                                                        </div>
                                                        <div className="flex-shrink-0 text-end">
                                                            <span className="text-body fw-bold fs-15">{foundItem.totPcs}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader className="align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Sales by Profit %</h4>
                                </CardHeader>
                                <CardBody>
                                    {loading ? <div className="text-center p-4"><Spinner color="success" /></div> : (
                                        <div className="live-preview">
                                            {["Below Cost", "Profit < 5%", "Profit > 5%"].map((categoryName, idx) => {
                                                const foundItem = plLegend.find(s => s.salePLPerLegend === categoryName) || { salePLPerLegend: categoryName, totPcs: 0 };
                                                return (
                                                    <div className="mb-3" key={idx}>
                                                        <div className="d-flex justify-content-between mb-1">
                                                            <span className="text-muted fw-medium">{categoryName}</span>
                                                            <span className="text-body fw-bold">{foundItem.totPcs}</span>
                                                        </div>
                                                        <Progress value={Math.min(foundItem.totPcs / 100, 100)} color={categoryName === 'Below Cost' ? 'danger' : 'success'} style={{ height: "6px" }} className={`rounded-pill bg-soft-${categoryName === 'Below Cost' ? 'danger' : 'success'}`} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                    <Modal isOpen={modal} toggle={toggleModal} centered>
                        <ModalHeader toggle={toggleModal} className="border-bottom-0 pb-0">
                            <span className="fw-semibold text-muted text-uppercase fs-11 d-block">{modalContent.title}</span>
                        </ModalHeader>
                        <ModalBody className="p-4">
                            <div className="text-center mb-4">
                                <div className="avatar-md mx-auto mb-3">
                                    <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-24 shadow-sm">
                                        <i className={modalContent.title.includes('Broker') ? "ri-user-star-line" : "ri-global-line"}></i>
                                    </div>
                                </div>
                                <h5 className="fs-18 mb-1 text-body fw-semibold">{modalContent.name}</h5>
                                <p className="text-muted mb-0">{modalContent.subtitle}</p>
                            </div>
                            
                            <div className="p-3 bg-light rounded-3 border border-light-subtle d-flex align-items-center justify-content-between">
                                <div>
                                    <span className="text-muted fs-12 text-uppercase d-block mb-1">Total Sales Amount</span>
                                    <h4 className="fs-20 fw-bold text-success mb-0">{modalContent.value}</h4>
                                </div>
                                <div className="avatar-sm">
                                    <span className="avatar-title bg-success-subtle text-success rounded fs-3">
                                        <i className="ri-money-dollar-circle-fill"></i>
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mt-4 d-flex gap-2 justify-content-end">
                                <button type="button" className="btn btn-light btn-sm px-3" onClick={toggleModal}>Close</button>
                                <button type="button" className="btn btn-primary btn-sm px-3" onClick={toggleModal}>Okay</button>
                            </div>
                        </ModalBody>
                    </Modal>

                </Container>
            </div>
        </React.Fragment>
    );
};

export default Dashboard;
