import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getMixPurchaseCurrentStatus } from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";

/**
 * Mix Purchase Current Status — MVC MixPurCurStatusPrintInv layout.
 * 25 records per page so each Letter sheet fits without Chrome
 * mid-page splits (which only repeat table thead, not logo/header).
 */

const ITEMS_PER_PAGE = 25;

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

export const buildCurStatusPages = (items) => {
  const list = items || [];
  const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE) || 1);
  const pages = [];
  for (let page = 0; page < totalPages; page++) {
    const skip = page * ITEMS_PER_PAGE;
    pages.push({
      pageItems: list.slice(skip, skip + ITEMS_PER_PAGE),
      isLastPage: page === totalPages - 1,
      pageIndex: page,
      totalPages
    });
  }
  return pages;
};

const MixPurchaseCurStatus = () => {
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
        const res = await getMixPurchaseCurrentStatus(invNo);
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

  document.title = `MixPurCurStatus_${invNo || getVal(data, "InvNo", "invNo") || "Print"}`;

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
      <div className="page-content mix-pur-curstatus-page">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <Link to="/MixPurchase/Mix-PurchaseList" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={() => window.print()}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div ref={printRef} id="purchase-curstatus-print-area" className="mix-pur-curstatus-host">
            <style>{`
              .mix-pur-curstatus-host {
                font-family: Verdana, Arial, sans-serif;
                font-size: 13px;
                color: #000;
                background: transparent;
              }
              @media screen {
                .mix-pur-curstatus-host {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  background: #e9eef2;
                  padding: 16px 12px 28px;
                  border-radius: 4px;
                }
                .mix-pur-curstatus-host .mpc-sheet {
                  width: 8.5in;
                  min-height: 11in;
                  max-width: 100%;
                  margin: 0 auto 24px;
                  padding: 10mm 10mm 14mm 10mm;
                  border: 1px solid #888;
                  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
                  box-sizing: border-box;
                  background: #fff;
                  position: relative;
                  padding-bottom: 48px;
                }
              }
              @media print {
                .mix-pur-curstatus-host {
                  background: #fff !important;
                  padding: 0 !important;
                }
                .mix-pur-curstatus-host .mpc-sheet {
                  width: 100% !important;
                  min-height: 0 !important;
                  max-height: none !important;
                  margin: 0 !important;
                  padding: 0 0 32px 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  position: relative !important;
                  page-break-after: always !important;
                  break-after: page !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid-page !important;
                  overflow: visible !important;
                }
                .mix-pur-curstatus-host .mpc-sheet-last {
                  page-break-after: avoid !important;
                  break-after: avoid !important;
                }
                /* Compact print so logo+header+25 rows fit one Letter page */
                .mix-pur-curstatus-host .mpc-logo {
                  width: 72px !important;
                  height: 86px !important;
                }
                .mix-pur-curstatus-host .outer-table {
                  margin-top: 14px !important;
                }
                .mix-pur-curstatus-host .title {
                  font-size: 12px !important;
                  margin-bottom: 3px !important;
                }
                .mix-pur-curstatus-host .addr-text {
                  font-size: 12px !important;
                  line-height: 1.3 !important;
                }
                .mix-pur-curstatus-host .ref-table {
                  font-size: 12px !important;
                }
                .mix-pur-curstatus-host .invoice-item-table {
                  margin-top: 10px !important;
                  font-size: 11px !important;
                }
                .mix-pur-curstatus-host .invoice-item-table th,
                .mix-pur-curstatus-host .invoice-item-table td {
                  padding: 2px 3px !important;
                }
                .mix-pur-curstatus-host .invoice-item-table th,
                .mix-pur-curstatus-host .invoice-item-table tbody tr:nth-child(even) {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .mix-pur-curstatus-host .invoice-item-table thead {
                  display: table-row-group !important;
                }
                .mix-pur-curstatus-host .footer-section {
                  position: relative !important;
                  margin-top: 16px !important;
                  margin-bottom: 24px !important;
                  padding: 10px 8px 16px 8px !important;
                  bottom: auto !important;
                }
                .mix-pur-curstatus-host .footer-section td {
                  padding: 4px 6px !important;
                }
                .mix-pur-curstatus-host .footer-powered {
                  padding-left: 4px !important;
                  padding-top: 4px !important;
                  padding-bottom: 4px !important;
                }
              }
              .mix-pur-curstatus-host .outer-table {
                margin-top: 28px;
                width: 100%;
                border-collapse: collapse;
              }
              .mix-pur-curstatus-host .inner-table {
                width: 100%;
                border-collapse: collapse;
                font-family: Helvetica, Verdana, sans-serif;
              }
              .mix-pur-curstatus-host .title {
                width: 90%;
                font-weight: bold;
                border-bottom: 2px solid gray;
                margin-bottom: 5px;
                padding-bottom: 2px;
                color: gray;
                font-family: Helvetica, Verdana, sans-serif;
                font-size: 14px;
              }
              .mix-pur-curstatus-host .ref-table {
                width: 95%;
                font-size: 13px;
                margin-top: 4px;
                font-family: Helvetica, sans-serif;
              }
              .mix-pur-curstatus-host .ref-table td {
                padding: 1px 0;
              }
              .mix-pur-curstatus-host .addr-text {
                font-size: 14px;
                line-height: 1.35;
              }
              .mix-pur-curstatus-host .invoice-item-table {
                width: 100%;
                border-collapse: collapse;
                font-family: Verdana, sans-serif;
                font-size: 12px;
                border-top: 2px solid black;
                margin-top: 14px;
                table-layout: fixed;
              }
              .mix-pur-curstatus-host .invoice-item-table th {
                border-left: 2px solid #666;
                border-right: 2px solid #666;
                border-bottom: 2px solid #666;
                padding: 3px;
                background: #e6e6e6;
                text-align: center;
                font-size: 11px;
              }
              .mix-pur-curstatus-host .invoice-item-table td {
                border-left: 2px solid #666;
                border-right: 2px solid #666;
                padding: 2px 3px;
                border-top: none;
                border-bottom: none;
                line-height: 1.25;
              }
              .mix-pur-curstatus-host .invoice-item-table tbody tr:last-child td {
                border-bottom: 2px solid #666;
              }
              .mix-pur-curstatus-host .invoice-item-table tbody tr:nth-child(even) {
                background-color: #f0f0f0;
              }
              .mix-pur-curstatus-host .balance-row td {
                height: 28px;
                border-top: 2px solid #666 !important;
                background: white !important;
              }
              .mix-pur-curstatus-host .balance-label {
                text-align: right;
                padding: 5px;
                font-weight: bold;
              }
              .mix-pur-curstatus-host .balance-value {
                font-weight: bold;
                text-align: right;
                padding: 5px;
              }
              .mix-pur-curstatus-host .footer-section {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                font-size: 11px;
                padding: 10px 8px 16px 8px;
                box-sizing: border-box;
                border-top: 1px solid #ccc;
              }
              .mix-pur-curstatus-host .footer-section td {
                padding: 4px 6px;
                vertical-align: middle;
              }
              .mix-pur-curstatus-host .footer-powered {
                padding-left: 4px;
                padding-top: 4px;
                padding-bottom: 4px;
              }
            `}</style>

            {pages.map((pg) => {
              const { pageItems, isLastPage, pageIndex, totalPages } = pg;

              return (
                <div
                  key={pageIndex}
                  className={`mpc-sheet${isLastPage ? " mpc-sheet-last" : ""}`}
                >
                  {/* FULL HEADER — every sheet */}
                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
                    <tbody>
                      <tr>
                        <td style={{ width: "13%", verticalAlign: "top" }}>
                          {logoUrl ? (
                            <img
                              className="mpc-logo"
                              src={logoUrl}
                              alt="logo"
                              style={{ width: 90, height: 108, objectFit: "contain" }}
                            />
                          ) : null}
                        </td>
                        <td style={{ width: "50%", verticalAlign: "top", fontSize: 12 }}>
                          <div style={{ fontWeight: "bold", fontSize: 14 }}>{company.companyName}</div>
                          <div style={{ marginTop: 2 }}>{company.companyAddress}</div>
                          <div style={{ marginTop: 2 }}>{company.companyAddress1}</div>
                          <div style={{ marginTop: 2 }}>{company.companyAddress2}</div>
                          <div style={{ marginTop: 8 }}>
                            <b>Tel:</b>&nbsp;&nbsp;{company.companyPhone}
                          </div>
                          <div>
                            <b>Email:</b>&nbsp;&nbsp;{company.companyEmail}
                          </div>
                        </td>
                        <td style={{ width: "37%", verticalAlign: "top" }}>
                          <span
                            style={{
                              fontWeight: "bold",
                              fontSize: 20,
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
                              fontSize: 15,
                              marginTop: 8,
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
                                <td style={{ padding: "4px 0", letterSpacing: "0.9px" }}>
                                  <b>Invoice Date:</b>
                                </td>
                                <td style={{ padding: "4px 0", textAlign: "right" }}>
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

                  <table className="outer-table">
                    <tbody>
                      <tr>
                        <td style={{ width: "63%" }}>
                          <table className="inner-table">
                            <tbody>
                              <tr>
                                <td style={{ width: "50%", verticalAlign: "top" }}>
                                  <div className="title">BILLING ADDRESS</div>
                                  <div className="addr-text">
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
                                  <div className="addr-text">
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

                  <table className="invoice-item-table">
                    <colgroup>
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "6%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "32%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "6%" }} />
                      <col style={{ width: "16%" }} />
                    </colgroup>
                    <thead>
                      <tr style={{ background: "#d3d3d3" }}>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Qty</th>
                        <th>Wt.</th>
                        <th>Description</th>
                        <th>Unit$</th>
                        <th>Tax</th>
                        <th>Total</th>
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
                            <td style={{ textAlign: "left", paddingLeft: 6 }}>
                              {getVal(item, "Type", "type")}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {fmtDate(getVal(item, "Date", "date"))}
                            </td>
                            <td style={{ textAlign: "right", paddingRight: 6 }}>
                              {qtyRaw !== "" && qtyRaw != null ? String(qtyRaw) : ""}
                            </td>
                            <td style={{ textAlign: "right", paddingRight: 6 }}>
                              {wtRaw !== "" && wtRaw != null
                                ? Number(wtRaw).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })
                                : ""}
                            </td>
                            <td style={{ textAlign: "left" }}>
                              {getVal(item, "Description", "description")}
                            </td>
                            <td style={{ textAlign: "right", paddingRight: 6 }}>
                              {rateRaw !== "" && rateRaw != null ? `$${fmtMoney(rateRaw)}` : ""}
                            </td>
                            <td />
                            <td style={{ textAlign: "right", paddingRight: 6 }}>{amtStr}</td>
                          </tr>
                        );
                      })}
                      {isLastPage && (
                        <tr className="balance-row">
                          <td colSpan={5} style={{ border: "none" }} />
                          <td colSpan={2} className="balance-label">
                            Invoice Balance
                          </td>
                          <td className="balance-value">${fmtMoney(balance)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

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
              margin: 8mm;
            }
            html, body {
              background: #fff !important;
              height: auto !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * { visibility: hidden !important; }
            #purchase-curstatus-print-area,
            #purchase-curstatus-print-area * {
              visibility: visible !important;
            }
            #purchase-curstatus-print-area {
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
            #purchase-curstatus-print-area,
            #purchase-curstatus-print-area * {
              scrollbar-width: none !important;
            }
            #purchase-curstatus-print-area::-webkit-scrollbar,
            #purchase-curstatus-print-area *::-webkit-scrollbar {
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
            .mix-pur-curstatus-page,
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

export default MixPurchaseCurStatus;
