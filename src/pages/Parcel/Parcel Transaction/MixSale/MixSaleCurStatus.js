import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getMixSaleCurrentStatus } from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";

/**
 * Same-to-same as MVC:
 * Views/Mix/MixSaleCurStatusPrintInv.cshtml
 * Columns: Type, Date, Qty, Wt., Stock#, Description, Unit$, Tax, Total, Status
 * Paging: single 28 / first 30 / middle 30 / last 28
 */

const SINGLE_PAGE_ITEMS = 28;
const FIRST_PAGE_ITEMS = 30;
const MIDDLE_PAGE_ITEMS = 30;
const LAST_PAGE_ITEMS = 28;

const getVal = (row, ...keys) => {
  if (!row) return "";
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    if (row[camel] !== undefined && row[camel] !== null && row[camel] !== "") return row[camel];
    if (row[pascal] !== undefined && row[pascal] !== null && row[pascal] !== "") return row[pascal];
  }
  return "";
};

const fmtMoney = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
};

/** Exact MVC page-count + skip/take from MixSaleCurStatusPrintInv.cshtml */
export const buildCurStatusPages = (items) => {
  const list = items || [];
  const totalItems = list.length;

  let totalPages;
  if (totalItems <= SINGLE_PAGE_ITEMS) {
    totalPages = 1;
  } else {
    const remainingAfterFirst = totalItems - FIRST_PAGE_ITEMS;
    if (remainingAfterFirst <= LAST_PAGE_ITEMS) {
      totalPages = 2;
    } else {
      const middlePages = Math.ceil((remainingAfterFirst - LAST_PAGE_ITEMS) / MIDDLE_PAGE_ITEMS);
      totalPages = 1 + middlePages + 1;
    }
  }
  if (totalPages < 1) totalPages = 1;

  const pages = [];
  for (let page = 0; page < totalPages; page++) {
    const isFirstPage = page === 0;
    const isLastPage = page === totalPages - 1;

    let itemsPerPage;
    if (isFirstPage && isLastPage) itemsPerPage = SINGLE_PAGE_ITEMS;
    else if (isFirstPage) itemsPerPage = FIRST_PAGE_ITEMS;
    else if (isLastPage) itemsPerPage = LAST_PAGE_ITEMS;
    else itemsPerPage = MIDDLE_PAGE_ITEMS;

    const skip = isFirstPage ? 0 : FIRST_PAGE_ITEMS + (page - 1) * MIDDLE_PAGE_ITEMS;
    pages.push({
      pageItems: list.slice(skip, skip + Math.max(0, itemsPerPage)),
      isLastPage,
      pageIndex: page,
      totalPages
    });
  }
  return pages;
};

const MixSaleCurStatus = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const invNo =
    searchParams.get("ID") ||
    searchParams.get("Id") ||
    searchParams.get("InvNo") ||
    searchParams.get("invNo") ||
    "";
  const printRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [company, setCompany] = useState(() => getCachedReportCompany());

  useEffect(() => {
    const load = async () => {
      setCompany(await getReportCompanySettings({ forceRefresh: true }));
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!invNo) {
        setLoading(false);
        toast.warning(t("Invoice number is required."));
        return;
      }
      setLoading(true);
      try {
        const res = await getMixSaleCurrentStatus(invNo);
        if (res?.success || res?.Success) {
          setData(res.Data || res.data || null);
        } else {
          toast.error(res?.Data || res?.data || t("Failed to load current status."));
        }
      } catch (err) {
        console.error(err);
        toast.error(t("Failed to load current status."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [invNo, t]);

  const items = useMemo(() => data?.items || data?.Items || [], [data]);
  const pages = useMemo(() => buildCurStatusPages(items), [items]);
  const balance = useMemo(() => {
    return items.reduce((sum, it) => {
      const amt = Number(getVal(it, "Amount", "amount")) || 0;
      const isPay = Number(getVal(it, "IsPayment", "isPayment")) === 1;
      return sum + (isPay ? -amt : amt);
    }, 0);
  }, [items]);

  const logoUrl = resolveCompanyLogoUrl(company?.companyLogo);
  const companyFooter = company?.companyFooter || "Powered by SoftOnCloud";
  const printedOn = fmtDate(new Date());

  document.title = `MixSaleCurStatus_${invNo || getVal(data, "InvNo", "invNo") || "Print"}`;

  if (loading || !company) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center text-muted py-5">{t("Loading...")}</div>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content mix-sale-curstatus-page">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <Link to="/mixform/mixformlist" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={() => window.print()}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div ref={printRef} id="mixsale-curstatus-print-area" className="mix-sale-curstatus-host">
            <style>{`
              .mix-sale-curstatus-host {
                font-family: Verdana, Arial, sans-serif;
                font-size: 13px;
                color: #000;
                background: transparent;
              }
              @media screen {
                .mix-sale-curstatus-host {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  background: #e9eef2;
                  padding: 16px 12px 28px;
                  border-radius: 4px;
                }
                .mix-sale-curstatus-host .page {
                  width: 8.5in;
                  min-height: 1190px;
                  max-width: 100%;
                  margin: 0 auto 24px;
                  padding: 10mm;
                  padding-bottom: 70px;
                  border: 1px solid #888;
                  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
                  box-sizing: border-box;
                  background: #fff;
                  position: relative;
                }
              }
              @media print {
                .mix-sale-curstatus-host {
                  background: #fff !important;
                  padding: 0 !important;
                }
                .mix-sale-curstatus-host .page {
                  width: 100% !important;
                  min-height: 0 !important;
                  margin: 0 !important;
                  padding: 0 0 40px 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  position: relative !important;
                  page-break-after: always !important;
                  break-after: page !important;
                  overflow: visible !important;
                }
                .mix-sale-curstatus-host .page-last {
                  page-break-after: avoid !important;
                  break-after: avoid !important;
                }
                .mix-sale-curstatus-host .outer-table { margin-top: 18px !important; }
                .mix-sale-curstatus-host .invoice-item-table { margin-top: 12px !important; font-size: 9px !important; border: 2px solid #666 !important; }
                .mix-sale-curstatus-host .invoice-item-table th,
                .mix-sale-curstatus-host .invoice-item-table td {
                  padding: 1px 2px !important;
                  font-size: 9px !important;
                  white-space: normal !important;
                  word-break: break-word !important;
                  overflow: visible !important;
                  border: 1px solid #666 !important;
                }
                .mix-sale-curstatus-host .invoice-item-table th {
                  white-space: nowrap !important;
                }
                .mix-sale-curstatus-host .invoice-item-table td:first-child,
                .mix-sale-curstatus-host .invoice-item-table .money-cell,
                .mix-sale-curstatus-host .invoice-item-table .balance-value,
                .mix-sale-curstatus-host .invoice-item-table .balance-label {
                  white-space: nowrap !important;
                  word-break: normal !important;
                  overflow-wrap: normal !important;
                }
                .mix-sale-curstatus-host .balance-row td.balance-spacer {
                  border: none !important;
                }
                .mix-sale-curstatus-host .invoice-item-table thead { display: table-row-group !important; }
                .mix-sale-curstatus-host .footer-section {
                  position: relative !important;
                  margin-top: 16px !important;
                  margin-bottom: 24px !important;
                  padding: 10px 8px 16px 8px !important;
                  bottom: auto !important;
                }
                .mix-sale-curstatus-host .footer-section td {
                  padding: 4px 6px !important;
                }
                .mix-sale-curstatus-host .footer-powered {
                  padding-left: 4px !important;
                  padding-top: 4px !important;
                  padding-bottom: 4px !important;
                }
                .mix-sale-curstatus-host .invoice-item-table th,
                .mix-sale-curstatus-host .invoice-item-table tbody tr:nth-child(even) {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
              .mix-sale-curstatus-host .outer-table {
                margin-top: 50px;
                width: 100%;
                border-collapse: collapse;
              }
              .mix-sale-curstatus-host .inner-table {
                width: 100%;
                border-collapse: collapse;
                font-family: Helvetica, Verdana, sans-serif;
              }
              .mix-sale-curstatus-host .title {
                width: 90%;
                font-weight: bold;
                border-bottom: 2px solid gray;
                margin-bottom: 5px;
                padding-bottom: 2px;
                color: gray;
                font-family: Helvetica, Verdana, sans-serif;
                font-size: 15px;
              }
              .mix-sale-curstatus-host .ref-table {
                width: 95%;
                font-size: 15px;
                margin-top: 5px;
                font-family: Helvetica, sans-serif;
              }
              .mix-sale-curstatus-host .ref-table td {
                padding: 2px 0;
              }
              .mix-sale-curstatus-host .invoice-item-table {
                width: 100%;
                border-collapse: collapse;
                font-family: Verdana, sans-serif;
                font-size: 10px;
                border: 2px solid #666;
                margin-top: 18px;
                table-layout: fixed;
              }
              .mix-sale-curstatus-host .invoice-item-table th {
                border: 1px solid #666;
                padding: 2px;
                background: #e6e6e6;
                text-align: center;
                font-size: 9px;
                white-space: nowrap;
              }
              .mix-sale-curstatus-host .invoice-item-table td {
                border: 1px solid #666;
                padding: 2px;
                font-size: 10px;
                white-space: normal;
                word-break: break-word;
                overflow-wrap: anywhere;
                overflow: visible;
                vertical-align: middle;
                line-height: 1.25;
              }
              .mix-sale-curstatus-host .invoice-item-table td:first-child,
              .mix-sale-curstatus-host .invoice-item-table th:first-child {
                white-space: nowrap !important;
                word-break: normal !important;
                overflow-wrap: normal !important;
              }
              .mix-sale-curstatus-host .invoice-item-table .money-cell,
              .mix-sale-curstatus-host .invoice-item-table .balance-value,
              .mix-sale-curstatus-host .invoice-item-table .balance-label {
                white-space: nowrap !important;
                word-break: normal !important;
                overflow-wrap: normal !important;
              }
              .mix-sale-curstatus-host .invoice-item-table tbody tr:nth-child(even):not(.balance-row) {
                background-color: #f0f0f0;
              }
              .mix-sale-curstatus-host .balance-row td {
                height: 33px;
                border: 1px solid #666 !important;
                background: #fff !important;
              }
              .mix-sale-curstatus-host .balance-row td.balance-spacer {
                border: none !important;
                background: transparent !important;
              }
              .mix-sale-curstatus-host .balance-label {
                text-align: right;
                padding: 6px;
                font-weight: bold;
              }
              .mix-sale-curstatus-host .balance-value {
                font-weight: bold;
                text-align: right;
                padding: 6px;
              }
              .mix-sale-curstatus-host .footer-section {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                font-size: 12px;
                padding: 10px 8px 16px 8px;
                box-sizing: border-box;
              }
              .mix-sale-curstatus-host .footer-section td {
                padding: 4px 6px;
                vertical-align: middle;
              }
              .mix-sale-curstatus-host .footer-powered {
                padding-left: 4px;
                padding-top: 4px;
                padding-bottom: 4px;
              }
            `}</style>

            {pages.map((pg) => {
              const { pageItems, isLastPage, pageIndex, totalPages } = pg;
              const pageBreakStyle =
                pageIndex < totalPages - 1
                  ? { pageBreakAfter: "always", breakAfter: "page" }
                  : undefined;

              return (
                <div
                  key={pageIndex}
                  className={`page${isLastPage ? " page-last" : ""}`}
                  style={pageBreakStyle}
                >
                  {/* HEADER — MVC */}
                  <table style={{ width: "100%", paddingBottom: 10 }}>
                    <tbody>
                      <tr>
                        <td style={{ width: "13%", verticalAlign: "top" }}>
                          {logoUrl ? (
                            <img src={logoUrl} alt="logo" style={{ width: 100, height: 120 }} />
                          ) : null}
                        </td>
                        <td style={{ width: "50%", verticalAlign: "top", fontSize: 12 }}>
                          <div style={{ fontWeight: "bold", fontSize: 14 }}>{company.companyName}</div>
                          <div style={{ marginTop: 3 }}>{company.companyAddress}</div>
                          <div style={{ marginTop: 3 }}>{company.companyAddress1}</div>
                          <div style={{ marginTop: 3 }}>{company.companyAddress2}</div>
                          <div style={{ marginTop: 10 }}>
                            <b>Tel:</b>&nbsp;&nbsp;{company.companyPhone}
                          </div>
                          <div>
                            <b>Email:</b>&nbsp;&nbsp;{company.companyEmail}
                          </div>
                        </td>
                        <td style={{ width: "37%", verticalAlign: "top" }}>
                          <span
                            style={{
                              verticalAlign: "top",
                              fontWeight: "bold",
                              fontSize: 22,
                              color: "dimgray",
                              fontFamily: "Helvetica, Verdana, sans-serif",
                              letterSpacing: "0.9px"
                            }}
                          >
                            Current Status Invoice{" "}
                          </span>
                          <table
                            style={{
                              width: "100%",
                              fontSize: 18,
                              marginTop: 10,
                              fontFamily: "Helvetica, sans-serif"
                            }}
                          >
                            <tbody>
                              <tr>
                                <td style={{ width: "70%", letterSpacing: "0.9px" }}>
                                  <b>Invoice #:</b>
                                </td>
                                <td style={{ width: "30%", textAlign: "right" }}>
                                  {getVal(data, "InvNo", "invNo") || invNo}
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: "5px 0", letterSpacing: "0.9px" }}>
                                  <b>Invoice Date:</b>
                                </td>
                                <td style={{ padding: "5px 0", textAlign: "right" }}>
                                  {fmtDate(getVal(data, "InvDate", "invDate"))}
                                </td>
                              </tr>
                              <tr>
                                <td style={{ letterSpacing: "0.9px" }}>
                                  <b>Current Status :</b>
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  {getVal(data, "Status", "status")}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* ADDRESSES — MVC */}
                  <table className="outer-table">
                    <tbody>
                      <tr>
                        <td style={{ width: "63%" }}>
                          <table className="inner-table">
                            <tbody>
                              <tr>
                                <td style={{ width: "50%", verticalAlign: "top" }}>
                                  <div className="title">BILLING ADDRESS</div>
                                  <div style={{ fontSize: 16 }}>
                                    <span>{getVal(data, "Party", "party")}</span>
                                    <br />
                                    <span>{getVal(data, "AddLine1", "addLine1")}</span>
                                    <br />
                                    <span>{getVal(data, "AddLine2", "addLine2")}</span>
                                    <br />
                                    <span>{getVal(data, "AddLine3", "addLine3")}</span>
                                    <br />
                                    Tel: {getVal(data, "Mobile", "mobile")}
                                  </div>
                                </td>
                                <td style={{ width: "50%", verticalAlign: "top" }}>
                                  <div className="title">SHIPPING ADDRESS</div>
                                  <div style={{ fontSize: 16 }}>
                                    <span>{getVal(data, "Party", "party")}</span>
                                    <br />
                                    <span>{getVal(data, "AddLine1", "addLine1")}</span>
                                    <br />
                                    <span>{getVal(data, "AddLine2", "addLine2")}</span>
                                    <br />
                                    <span>{getVal(data, "AddLine3", "addLine3")}</span>
                                    <br />
                                    Tel: {getVal(data, "Mobile", "mobile")}
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                        <td style={{ width: "37%", verticalAlign: "top" }}>
                          <div className="title" style={{ width: "100%" }}>
                            REFERENCE INFORMATION
                          </div>
                          <table className="ref-table">
                            <tbody>
                              <tr>
                                <td>Contact:</td>
                                <td style={{ textAlign: "right" }}>
                                  {getVal(data, "CPerson", "cPerson")}
                                </td>
                              </tr>
                              <tr>
                                <td>Salesperson:</td>
                                <td style={{ textAlign: "right" }}>
                                  {getVal(data, "SalesPerson", "salesPerson")}
                                </td>
                              </tr>
                              <tr>
                                <td>Ship Via:</td>
                                <td style={{ textAlign: "right" }}>
                                  {getVal(data, "ShipVia", "shipVia")}
                                </td>
                              </tr>
                              <tr>
                                <td>Customer Order #:</td>
                                <td style={{ textAlign: "right" }} />
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* ITEM TABLE — MVC: Stock# + Status */}
                  <table className="invoice-item-table">
                    <colgroup>
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "5%" }} />
                      <col style={{ width: "6%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "11%" }} />
                      <col style={{ width: "5%" }} />
                      <col style={{ width: "16%" }} />
                      <col style={{ width: "10%" }} />
                    </colgroup>
                    <thead>
                      <tr style={{ background: "#d3d3d3" }}>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Qty</th>
                        <th>Wt.</th>
                        <th>Stock#</th>
                        <th>Description</th>
                        <th>Unit$</th>
                        <th>Tax</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((item, idx) => {
                        const isPay = Number(getVal(item, "IsPayment", "isPayment")) === 1;
                        const amtRaw = getVal(item, "Amount", "amount");
                        const rateRaw = getVal(item, "Rate", "rate");
                        const wtRaw = getVal(item, "Wt", "wt");
                        const qtyRaw = getVal(item, "Qty", "qty");
                        const amtStr =
                          amtRaw === "" || amtRaw === null || amtRaw === undefined
                            ? ""
                            : isPay
                              ? `($${fmtMoney(amtRaw)})`
                              : `$${fmtMoney(amtRaw)}`;
                        return (
                          <tr key={`${pageIndex}-${idx}`}>
                            <td style={{ textAlign: "left", paddingLeft: 6, whiteSpace: "nowrap" }}>
                              {getVal(item, "Type", "type")}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {fmtDate(getVal(item, "Date", "date"))}
                            </td>
                            <td className="text-right" style={{ paddingRight: 8 }}>
                              {qtyRaw !== "" && qtyRaw != null ? String(qtyRaw) : ""}
                            </td>
                            <td className="text-right" style={{ paddingRight: 8 }}>
                              {wtRaw !== "" && wtRaw != null
                                ? Number(wtRaw).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })
                                : ""}
                            </td>
                            <td style={{ textAlign: "left", wordBreak: "break-word" }}>
                              {getVal(item, "Lotno", "lotno", "LotNo")}
                            </td>
                            <td style={{ textAlign: "left", wordBreak: "break-word" }}>
                              {getVal(item, "Description", "description")}
                            </td>
                            <td
                              className="text-right money-cell"
                              style={{ paddingRight: 6, whiteSpace: "nowrap" }}
                            >
                              {rateRaw !== "" && rateRaw != null ? `$${fmtMoney(rateRaw)}` : ""}
                            </td>
                            <td />
                            <td
                              className="text-right money-cell"
                              style={{ paddingRight: 6, whiteSpace: "nowrap" }}
                            >
                              {amtStr}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {getVal(item, "InvStatus", "invStatus")}
                            </td>
                          </tr>
                        );
                      })}
                      {isLastPage && (
                        <tr className="balance-row" style={{ background: "white" }}>
                          <td colSpan={6} className="balance-spacer" />
                          <td colSpan={2} className="balance-label">
                            Invoice Balance
                          </td>
                          <td className="balance-value">${fmtMoney(balance)}</td>
                          <td className="balance-spacer" />
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* FOOTER — every page */}
                  <div className="footer-section">
                    <table style={{ width: "100%" }}>
                      <tbody>
                        <tr>
                          <td className="footer-powered" style={{ width: "33%", textAlign: "left" }}>
                            {companyFooter}
                          </td>
                          <td style={{ width: "33%", textAlign: "center" }}>
                            Page {pageIndex + 1}&nbsp; of &nbsp;{totalPages}
                          </td>
                          <td style={{ width: "34%", textAlign: "right" }}>
                            Printed on {printedOn}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>

        <style>{`
          @media print {
            @page {
              size: Letter portrait;
              margin: 10mm 10mm 20mm 10mm;
            }
            html, body {
              background: #fff !important;
              height: auto !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * { visibility: hidden !important; }
            #mixsale-curstatus-print-area,
            #mixsale-curstatus-print-area * {
              visibility: visible !important;
            }
            #mixsale-curstatus-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: #fff !important;
              color: #000 !important;
              overflow: visible !important;
            }
            #mixsale-curstatus-print-area,
            #mixsale-curstatus-print-area * {
              scrollbar-width: none !important;
            }
            #mixsale-curstatus-print-area::-webkit-scrollbar,
            #mixsale-curstatus-print-area *::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
            .d-print-none,
            .navbar-menu,
            .app-menu,
            .navbar-header,
            .footer,
            .vertical-menu,
            #page-topbar,
            .page-title-box,
            .Toastify {
              display: none !important;
              visibility: hidden !important;
            }
            .page-content,
            .mix-sale-curstatus-page,
            .container-fluid {
              padding: 0 !important;
              margin: 0 !important;
              overflow: visible !important;
              max-height: none !important;
            }
          }
        `}</style>
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default MixSaleCurStatus;
