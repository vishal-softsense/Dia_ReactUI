import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody, Col, Container, Row, Spinner } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import {
    getMonthExpenseReport,
    getMonthExpenseReportPermission
} from "../../../helpers/fakebackend_helper";
import {
    getCachedReportCompany,
    getReportCompanySettings,
    resolveCompanyLogoUrl
} from "../../../helpers/reportCompanyDefaults";
import MonthExpensePivotView from "./MonthExpensePivotView";

const MonthExpenseReport = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(true);
    const [reportData, setReportData] = useState([]);
    const [companyInfo, setCompanyInfo] = useState(() => getCachedReportCompany());
    const [reportDate, setReportDate] = useState("");

    const loadReport = useCallback(async () => {
        setLoading(true);
        try {
            const permission = await getMonthExpenseReportPermission();
            if (permission?.success === false) {
                setAuthorized(false);
                toast.error(permission?.message || t("You are not authorized to perform this task."));
                return;
            }

            const company = await getReportCompanySettings({ forceRefresh: true });
            if (company) setCompanyInfo(company);

            const response = await getMonthExpenseReport();
            if (response?.success === false) {
                toast.error(response?.message || t("Error fetching month expense report."));
                setReportData([]);
                return;
            }

            const list = response?.data || response?.Data || [];
            setReportData(Array.isArray(list) ? list : []);
            setAuthorized(true);

            const today = new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
            setReportDate(`Date: ${today}`);
        } catch (err) {
            console.error(err);
            const status = err?.response?.status || err?.status;
            if (status === 403) {
                setAuthorized(false);
                toast.error(t("You are not authorized to perform this task."));
            } else {
                toast.error(err?.message || t("Error fetching month expense report."));
            }
            setReportData([]);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    document.title = `${t("Month Expense Report")} | ${t("Account Report")}`;

    const logoUrl = resolveCompanyLogoUrl(companyInfo?.companyLogo);

    return (
        <React.Fragment>
            <ToastContainer position="top-right" autoClose={2500} />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Month Expense Report")} pageTitle={t("Account Report")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <i className="ri-pie-chart-2-line fs-20 text-primary" />
                            {t("Month Expense Report")}
                        </h5>
                    </div>

                    {!authorized ? (
                        <Card className="shadow-sm border-0">
                            <CardBody className="text-center text-danger py-5">
                                {t("You are not authorized to perform this task.")}
                            </CardBody>
                        </Card>
                    ) : (
                        <Card className="shadow-lg border-0 rounded-3 mb-4">
                            <CardBody>
                                <div
                                    id="company-info"
                                    className="container-fluid mb-3 border-bottom pb-2"
                                >
                                    <Row className="align-items-center">
                                        <Col md={4} className="text-start">
                                            <div className="d-flex align-items-end mb-2 gap-2">
                                                {logoUrl ? (
                                                    <img
                                                        src={logoUrl}
                                                        alt="Company Logo"
                                                        style={{ maxHeight: 70 }}
                                                    />
                                                ) : null}
                                                <span style={{ fontSize: 18, fontWeight: "bold" }}>
                                                    {companyInfo?.companyName}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 14 }}>{companyInfo?.companyAddress}</div>
                                            <div style={{ fontSize: 14 }}>{companyInfo?.companyAddress1}</div>
                                            <div style={{ fontSize: 14 }}>{companyInfo?.companyAddress2}</div>
                                        </Col>
                                        <Col md={4} className="text-center" />
                                        <Col md={4} className="text-end">
                                            <div style={{ fontSize: 18, fontWeight: "bold" }}>
                                                {t("Month Expense Report")}
                                            </div>
                                            <div style={{ fontSize: 14 }} id="report-date">
                                                {reportDate}
                                            </div>
                                            <div style={{ fontSize: 14 }}>
                                                ✉ {companyInfo?.companyEmail}
                                            </div>
                                        </Col>
                                    </Row>
                                </div>

                                {loading ? (
                                    <div className="text-center py-5">
                                        <Spinner color="primary" />
                                    </div>
                                ) : (
                                    <MonthExpensePivotView data={reportData} />
                                )}

                                {companyInfo?.companyFooter ? (
                                    <div className="mt-3" id="cpny-footer">
                                        {companyInfo.companyFooter}
                                    </div>
                                ) : null}
                            </CardBody>
                        </Card>
                    )}
                </Container>
            </div>
        </React.Fragment>
    );
};

export default MonthExpenseReport;
