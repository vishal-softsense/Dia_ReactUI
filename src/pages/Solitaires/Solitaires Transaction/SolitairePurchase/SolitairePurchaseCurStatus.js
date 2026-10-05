import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getSolitairePurchaseCurrentStatus } from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";

const SINGLE_PAGE_ITEMS = 20; // 1 page only: 20 + Invoice Balance
const FIRST_PAGE_ITEMS = 20; // page 1: 20 records
const MIDDLE_PAGE_ITEMS = 20; // page 2+: 20 records
const LAST_PAGE_ITEMS = 15; // last page: 15 records + Invoice Balance + footer

const FONT_BODY = "Verdana, Arial, sans-serif";
const FONT_UI = "Helvetica, Verdana, Arial, sans-serif";

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
  if (v === null || v === undefined || v === "") return "";
  const raw = String(v).replace(/[$,\s]/g, "");
  const n = Number(raw);
  if (!Number.isFinite(n)) return "";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
};

/** Page1/Page2 = 20 each (fill forward); last page = up to 15 + Invoice Balance. */
const buildPageSlices = (items) => {
  const n = items.length;
  if (n === 0) return [[]];
  // Single page: all rows + total (max 20)
  if (n <= SINGLE_PAGE_ITEMS) return [items];

  const slices = [];
  let i = 0;

  while (i < n) {
    const left = n - i;

    // Remaining fits on last page (max 15) → done
    if (left <= LAST_PAGE_ITEMS) {
      slices.push(items.slice(i));
      break;
    }

    // Next chunk: if leftover after a full 20-page is <= 15, take 20 then last gets rest
    // Otherwise take full 20 (first or middle page)
    const pageSize = slices.length === 0 ? FIRST_PAGE_ITEMS : MIDDLE_PAGE_ITEMS;

    if (left <= pageSize + LAST_PAGE_ITEMS) {
      slices.push(items.slice(i, i + pageSize));
      i += pageSize;
      if (i < n) slices.push(items.slice(i)); // last page with remaining (<=15)
      break;
    }

    slices.push(items.slice(i, i + pageSize));
    i += pageSize;
  }

  return slices.filter((s) => s.length > 0);
};

const SolitairePurchaseCurStatus = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const invNo = searchParams.get("InvNo") || searchParams.get("invNo") || "";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [company, setCompany] = useState(() => getCachedReportCompany());

  useEffect(() => {
    const load = async () => {
      const c = await getReportCompanySettings({ forceRefresh: true });
      setCompany(c);
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
        const res = await getSolitairePurchaseCurrentStatus(invNo);
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
  const balance = useMemo(() => {
    return items.reduce((sum, it) => {
      const amt = Number(getVal(it, "Amount", "amount")) || 0;
      const isPay = Number(getVal(it, "IsPayment", "isPayment")) === 1;
      return sum + (isPay ? -amt : amt);
    }, 0);
  }, [items]);

  const pages = useMemo(() => buildPageSlices(items), [items]);
  const totalPages = pages.length;

  const logoUrl = resolveCompanyLogoUrl(company?.companyLogo);
  const printedOn = fmtDate(new Date());

  document.title = `PurCurStatus_${invNo} | Admin`;

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center text-muted py-5">{t("Loading...")}</div>
        </Container>
      </div>
    );
  }

  const renderHeader = () => (
    <table className="csi-header" style={{ width: "100%", marginBottom: 10 }}>
      <tbody>
        <tr>
          <td className="csi-logo-cell">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="csi-logo-img" />
            ) : null}
          </td>
          <td className="csi-company-cell" style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#000" }}>
            <div style={{ fontWeight: "bold", fontSize: 14, lineHeight: 1.3 }}>{company.companyName}</div>
            <div style={{ marginTop: 3, fontSize: 12, lineHeight: 1.35 }}>{company.companyAddress}</div>
            <div style={{ marginTop: 3, fontSize: 12, lineHeight: 1.35 }}>{company.companyAddress1}</div>
            <div style={{ marginTop: 3, fontSize: 12, lineHeight: 1.35 }}>{company.companyAddress2}</div>
            <div style={{ marginTop: 10, fontSize: 12 }}>
              <b>Tel:</b>&nbsp;&nbsp;{company.companyPhone}
            </div>
            <div style={{ fontSize: 12 }}>
              <b>Email:</b>&nbsp;&nbsp;{company.companyEmail}
            </div>
          </td>
          <td style={{ width: "37%", verticalAlign: "top" }}>
            <div
              style={{
                fontWeight: "bold",
                fontSize: 22,
                color: "dimgray",
                fontFamily: FONT_UI,
                letterSpacing: 0.9,
                lineHeight: 1.2
              }}
            >
              Current Status Invoice
            </div>
            <table
              style={{
                width: "100%",
                fontSize: 18,
                marginTop: 10,
                fontFamily: FONT_UI,
                borderCollapse: "collapse",
                color: "#000"
              }}
            >
              <tbody>
                <tr>
                  <td style={{ width: "70%", letterSpacing: 0.9, fontSize: 18 }}>
                    <b>Invoice #:</b>
                  </td>
                  <td style={{ width: "30%", textAlign: "right", fontSize: 18 }}>
                    {getVal(data, "InvNo", "invNo")}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "5px 0", letterSpacing: 0.9, fontSize: 18 }}>
                    <b>Invoice Date:</b>
                  </td>
                  <td style={{ padding: "5px 0", textAlign: "right", fontSize: 18 }}>
                    {fmtDate(getVal(data, "InvDate", "invDate"))}
                  </td>
                </tr>
                <tr>
                  <td style={{ letterSpacing: 0.9, fontSize: 18 }}>
                    <b>Current Status :</b>
                  </td>
                  <td style={{ textAlign: "right", fontSize: 18 }}>{getVal(data, "Status", "status")}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );

  const renderAddresses = () => {
    const party = getVal(data, "Party", "party");
    const add1 = getVal(data, "AddLine1", "addLine1");
    const add2 = getVal(data, "AddLine2", "addLine2");
    const add3 = getVal(data, "AddLine3", "addLine3");
    const mobile = getVal(data, "Mobile", "mobile");

    const addressBlock = (
      <div style={{ fontSize: 16, fontFamily: FONT_UI, lineHeight: 1.4, color: "#000" }}>
        {party ? <div>{party}</div> : null}
        {add1 ? <div>{add1}</div> : null}
        {add2 ? <div>{add2}</div> : null}
        {add3 ? <div>{add3}</div> : null}
        <div>Tel: {mobile}</div>
      </div>
    );

    return (
      <table className="csi-address" style={{ marginTop: 50, width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ width: "63%", verticalAlign: "top" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "50%", verticalAlign: "top", paddingRight: 10 }}>
                      <div className="csi-section-title">BILLING ADDRESS</div>
                      {addressBlock}
                    </td>
                    <td style={{ width: "50%", verticalAlign: "top" }}>
                      <div className="csi-section-title">SHIPPING ADDRESS</div>
                      {addressBlock}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td style={{ width: "37%", verticalAlign: "top" }}>
              <div className="csi-section-title" style={{ width: "100%" }}>
                REFERENCE INFORMATION
              </div>
              <table className="csi-ref-table">
                <tbody>
                  <tr>
                    <td>Contact:</td>
                    <td style={{ textAlign: "right" }}>{getVal(data, "CPerson", "cPerson")}</td>
                  </tr>
                  <tr>
                    <td>Salesperson:</td>
                    <td style={{ textAlign: "right" }}>{getVal(data, "SalesPerson", "salesPerson")}</td>
                  </tr>
                  <tr>
                    <td>Ship Via:</td>
                    <td style={{ textAlign: "right" }}>{getVal(data, "ShipVia", "shipVia")}</td>
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
    );
  };

  const renderItemsTable = (pageItems, isLastPage) => (
    <table className="csi-item-table">
      <colgroup>
        <col style={{ width: "9%" }} />
        <col style={{ width: "11%" }} />
        <col style={{ width: "5%" }} />
        <col style={{ width: "7%" }} />
        <col style={{ width: "28%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "16%" }} />
      </colgroup>
      <thead>
        <tr>
          {["Type", "Date", "Qty", "Wt.", "Description", "Unit$", "Tax", "Total"].map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {pageItems.map((it, idx) => {
          const isPay = Number(getVal(it, "IsPayment", "isPayment")) === 1;
          const amt = getVal(it, "Amount", "amount");
          const qty = getVal(it, "Qty", "qty");
          const wt = getVal(it, "Wt", "wt");
          const rate = getVal(it, "Rate", "rate");
          const tax = getVal(it, "Tax", "tax");
          const isLastItem = idx === pageItems.length - 1;
          const moneyCell = {
            textAlign: "right",
            paddingRight: 8,
            paddingLeft: 4,
            whiteSpace: "nowrap",
            overflow: "hidden",
            verticalAlign: "middle"
          };
          return (
            <tr key={idx} className={isLastItem && !isLastPage ? "csi-last-data" : undefined}>
              <td style={{ textAlign: "left", paddingLeft: 8 }}>{getVal(it, "Type", "type")}</td>
              <td style={{ textAlign: "center" }}>{fmtDate(getVal(it, "Date", "date"))}</td>
              <td style={{ textAlign: "right", paddingRight: 8 }}>{qty !== "" ? String(qty) : ""}</td>
              <td style={{ textAlign: "right", paddingRight: 8 }}>
                {wt !== "" && Number.isFinite(Number(wt)) ? Number(wt).toFixed(2) : ""}
              </td>
              <td style={{ textAlign: "left" }}>{getVal(it, "Description", "description")}</td>
              <td style={moneyCell}>{rate !== "" ? fmtMoney(rate) : ""}</td>
              <td className="csi-tax-cell" style={moneyCell}>
                {tax !== "" && Number.isFinite(Number(String(tax).replace(/[$,\s]/g, "")))
                  ? fmtMoney(tax)
                  : ""}
              </td>
              <td style={moneyCell}>
                {amt !== "" ? (isPay ? `(${fmtMoney(amt)})` : fmtMoney(amt)) : ""}
              </td>
            </tr>
          );
        })}
        {isLastPage ? (
          <tr className="csi-balance-row">
            <td colSpan={5} className="csi-balance-spacer" />
            <td colSpan={2} className="csi-balance-label">
              Invoice Balance
            </td>
            <td className="csi-balance-value">{fmtMoney(balance)}</td>
          </tr>
        ) : (
          <tr className="csi-page-end">
            <td colSpan={8} />
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderFooter = (pageIndex) => (
    <div className="csi-footer">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ width: "33%", textAlign: "left", fontSize: 12 }}>
              {company.companyFooter || "Powered by SoftOnCloud"}
            </td>
            <td style={{ width: "34%", textAlign: "center", fontSize: 12 }}>
              Page {pageIndex + 1}&nbsp; of &nbsp;{totalPages}
            </td>
            <td style={{ width: "33%", textAlign: "right", fontSize: 12 }}>
              Printed on {printedOn}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <React.Fragment>
      <div className="page-content purchase-curstatus-page">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <Link to="/purchase/purchase-list" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={() => window.print()}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div id="purchase-curstatus-print-area">
            {pages.map((pageItems, pageIndex) => {
              const isLastPage = pageIndex === totalPages - 1;
              return (
                <div
                  key={pageIndex}
                  className={`csi-page${pageIndex < totalPages - 1 ? " csi-page-break" : ""}`}
                >
                  {renderHeader()}
                  {renderAddresses()}
                  {renderItemsTable(pageItems, isLastPage)}
                  {renderFooter(pageIndex)}
                </div>
              );
            })}
          </div>
        </Container>

        <style>{`
          .purchase-curstatus-page .csi-page {
            position: relative;
            min-height: 1190px;
            padding: 24px 28px 70px;
            margin: 0 auto 24px;
            max-width: 960px;
            box-sizing: border-box;
            background: #fff;
            color: #000;
            border: 1px solid #dee2e6;
            font-family: ${FONT_BODY};
            font-size: 13px;
          }

          /* Header — logo + 4-space gap + company (screen & print same) */
          .purchase-curstatus-page .csi-header {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
          }
          .purchase-curstatus-page .csi-logo-cell {
            width: 13%;
            min-width: 100px;
            vertical-align: top;
            padding: 4px 32px 4px 4px;
          }
          .purchase-curstatus-page .csi-logo-img {
            width: 100px;
            height: 120px;
            object-fit: contain;
            display: block;
          }
          .purchase-curstatus-page .csi-company-cell {
            width: 50%;
            vertical-align: top;
            padding: 4px 0 4px 8px;
          }

          .purchase-curstatus-page .csi-section-title {
            width: 90%;
            font-weight: bold;
            border-bottom: 2px solid gray;
            margin-bottom: 5px;
            padding-bottom: 2px;
            color: gray;
            font-family: ${FONT_UI};
            font-size: 15px;
            letter-spacing: 0.2px;
          }

          .purchase-curstatus-page .csi-ref-table {
            width: 95%;
            font-size: 15px;
            margin-top: 5px;
            font-family: Helvetica, Verdana, Arial, sans-serif;
            border-collapse: collapse;
            color: #000;
          }
          .purchase-curstatus-page .csi-ref-table td {
            padding: 2px 0;
            font-size: 15px;
            font-family: Helvetica, Verdana, Arial, sans-serif;
          }

          .purchase-curstatus-page .csi-item-table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
            font-family: Verdana, Arial, sans-serif;
            font-size: 13px;
            border-top: 2px solid #000;
            margin-top: 18px;
            table-layout: fixed;
          }
          .purchase-curstatus-page .csi-item-table th {
            border-left: 2px solid #666;
            border-right: 2px solid #666;
            border-top: none;
            border-bottom: 2px solid #666;
            padding: 3px;
            background: #e6e6e6;
            text-align: center;
            font-family: Verdana, Arial, sans-serif;
            font-size: 13px;
            font-weight: bold;
            color: #000;
          }
          .purchase-curstatus-page .csi-item-table td {
            border-left: 2px solid #666;
            border-right: 2px solid #666;
            border-top: none;
            border-bottom: none;
            padding: 3px 4px;
            font-family: Verdana, Arial, sans-serif;
            font-size: 13px;
            color: #000;
            vertical-align: middle;
            box-sizing: border-box;
          }
          /* Tax column — full side borders; header center, values right */
          .purchase-curstatus-page .csi-item-table th:nth-child(7) {
            border-left: 2px solid #666 !important;
            border-right: 2px solid #666 !important;
            text-align: center !important;
          }
          .purchase-curstatus-page .csi-item-table td.csi-tax-cell {
            border-left: 2px solid #666 !important;
            border-right: 2px solid #666 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-align: right !important;
          }
          .purchase-curstatus-page .csi-item-table tbody tr:nth-child(even):not(.csi-balance-row):not(.csi-page-end) {
            background-color: #f0f0f0;
          }
          .purchase-curstatus-page .csi-item-table tbody tr:nth-child(odd):not(.csi-balance-row):not(.csi-page-end) {
            background-color: #fff;
          }

          /* Close bottom of last data row on non-final pages */
          .purchase-curstatus-page .csi-last-data td {
            border-bottom: 2px solid #666 !important;
          }
          .purchase-curstatus-page .csi-page-end td {
            border: none !important;
            height: 0;
            padding: 0;
            line-height: 0;
            font-size: 0;
          }

          /* Invoice Balance — continuous box, no line cut */
          .purchase-curstatus-page .csi-balance-row {
            background: #fff !important;
          }
          .purchase-curstatus-page .csi-balance-row td {
            height: 33px;
            font-size: 13px;
            font-family: Verdana, Arial, sans-serif;
          }
          .purchase-curstatus-page .csi-balance-spacer {
            border: none !important;
            background: transparent !important;
          }
          .purchase-curstatus-page .csi-balance-label {
            border-top: 2px solid #666 !important;
            border-bottom: 2px solid #666 !important;
            border-left: 2px solid #666 !important;
            border-right: 2px solid #666 !important;
            text-align: right !important;
            padding: 6px !important;
            font-weight: bold !important;
            background: #fff !important;
          }
          .purchase-curstatus-page .csi-balance-value {
            border-top: 2px solid #666 !important;
            border-bottom: 2px solid #666 !important;
            border-left: 2px solid #666 !important;
            border-right: 2px solid #666 !important;
            text-align: right !important;
            padding: 6px !important;
            font-weight: bold !important;
            background: #fff !important;
            white-space: nowrap;
          }
          /* Continuous balance box across Unit$+Tax+Total */
          .purchase-curstatus-page .csi-balance-label {
            border-right: none !important;
          }
          .purchase-curstatus-page .csi-balance-value {
            border-left: 2px solid #666 !important;
          }

          /* Close left columns above balance; right columns stay open into balance box (no line cut) */
          .purchase-curstatus-page .csi-item-table tbody tr:has(+ .csi-balance-row) td:nth-child(-n + 5) {
            border-bottom: 2px solid #666 !important;
          }
          .purchase-curstatus-page .csi-item-table tbody tr:has(+ .csi-balance-row) td:nth-child(n + 6) {
            border-bottom: none !important;
          }

          .purchase-curstatus-page .csi-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            font-size: 12px;
            font-family: ${FONT_BODY};
            padding: 5px 0 8px;
            box-sizing: border-box;
            color: #000;
          }
          .purchase-curstatus-page .csi-footer table {
            width: 100%;
            border-collapse: collapse;
          }
          .purchase-curstatus-page .csi-footer td {
            font-size: 12px;
            font-family: ${FONT_BODY};
            color: #000;
            vertical-align: middle;
            padding: 0;
          }

          @media print {
            @page { size: A4 portrait; margin: 8mm 0 8mm 0; }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
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
              margin: 0 !important;
              padding: 0 !important;
            }
            #purchase-curstatus-print-area .csi-page {
              position: relative !important;
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 !important;
              border: none !important;
              padding: 8px 0 40px 0 !important;
              min-height: 100vh !important;
              box-sizing: border-box !important;
              overflow: visible !important;
            }
            #purchase-curstatus-print-area .csi-logo-cell {
              width: 13% !important;
              min-width: 100px !important;
              padding: 4px 32px 4px 4px !important;
            }
            #purchase-curstatus-print-area .csi-company-cell {
              width: 50% !important;
              padding: 4px 0 4px 8px !important;
            }
            #purchase-curstatus-print-area .csi-logo-img {
              width: 100px !important;
              height: 120px !important;
            }
            #purchase-curstatus-print-area .csi-page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
            /* Avoid browser auto-split orphan table header on next page */
            #purchase-curstatus-print-area .csi-item-table thead {
              display: table-row-group !important;
            }
            #purchase-curstatus-print-area .csi-item-table tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            /* Footer — last line: left / center / right (image 1) */
            #purchase-curstatus-print-area .csi-footer {
              position: absolute !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              font-size: 12px !important;
              color: #000 !important;
              background: #fff !important;
            }
            #purchase-curstatus-print-area .csi-footer table {
              width: 100% !important;
            }
            #purchase-curstatus-print-area .csi-footer td {
              font-size: 12px !important;
              color: #000 !important;
              padding: 0 !important;
            }
            .purchase-curstatus-page,
            .purchase-curstatus-page .container-fluid,
            .purchase-curstatus-page .page-content {
              margin: 0 !important;
              padding: 0 !important;
            }
            .d-print-none,
            .navbar-menu,
            .app-menu,
            .navbar-header,
            .footer,
            .vertical-menu,
            #page-topbar,
            .page-title-box {
              display: none !important;
            }
          }
        `}</style>
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default SolitairePurchaseCurStatus;
