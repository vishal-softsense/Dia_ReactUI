import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getSolitairePurchasePrintView } from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";
import {
  fmtDateSlash,
  fmtNum,
  getPrintAmountHeader,
  getVal,
  paginateStella
} from "../../../../printFormats/shared/printUtils";

// SoftSense /Purchase/PrintInvView (PURCHASE NOTE) — API data unchanged
const ITEMS_PER_PAGE = 29;
const LAST_PAGE_ITEMS = 27;
const COL_COUNT = 7;
const ITEM_COL_WIDTHS = ["6%", "12%", "34%", "8%", "10%", "14%", "16%"];

const th = {
  background: "#c0c0c0",
  border: "1px solid #000",
  padding: "6px 0",
  textAlign: "center",
  fontWeight: "bold"
};

const topCell = {
  border: "1px solid #000",
  padding: "0 6px",
  textAlign: "center",
  verticalAlign: "middle",
  height: 28
};

const itemCell = {
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  borderTop: "none",
  borderBottom: "none",
  padding: "0 6px",
  textAlign: "center",
  verticalAlign: "middle",
  height: 24
};

const computeDueDate = (trnDate, dueDays) => {
  if (!trnDate && trnDate !== 0) return "";
  const days = Number(dueDays);
  if (!Number.isFinite(days) || days < 0) return fmtDateSlash(trnDate);
  try {
    const raw = String(trnDate).trim();
    let d;
    const mdy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (mdy) {
      d = new Date(Number(mdy[3]), Number(mdy[1]) - 1, Number(mdy[2]));
    } else {
      d = new Date(trnDate);
    }
    if (isNaN(d.getTime())) return fmtDateSlash(trnDate);
    d.setDate(d.getDate() + days);
    return fmtDateSlash(d);
  } catch {
    return "";
  }
};

const SolitairePurchasePrintView = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const invNo = searchParams.get("InvNo") || searchParams.get("invNo") || searchParams.get("ID") || "";
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
        const res = await getSolitairePurchasePrintView(invNo);
        if (res?.success || res?.Success) {
          setData(res.Data || res.data || null);
        } else {
          toast.error(res?.Data || res?.data || t("No data found for this Invoice."));
        }
      } catch (err) {
        console.error(err);
        toast.error(err?.response?.data?.Data || t("No data found for this Invoice."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [invNo, t]);

  const items = useMemo(() => data?.items || data?.Items || [], [data]);
  const totals = useMemo(() => {
    let qty = 0;
    let wt = 0;
    let amount = 0;
    items.forEach((it) => {
      qty += Number(getVal(it, "Qty", "qty")) || 0;
      wt += Number(getVal(it, "Weight", "weight")) || 0;
      amount += Number(getVal(it, "Amount", "amount")) || 0;
    });
    return { qty, wt, amount };
  }, [items]);

  const logoUrl = resolveCompanyLogoUrl(company?.companyLogo);
  const trnDate = getVal(data, "TrnDate", "trnDate");
  const dueDays = getVal(data, "DueDays", "dueDays");
  // MVC PrintInvoice: Purchase # = InvNo, CUSTOMER INVOICE NO = BillNo
  const purchaseNo = getVal(data, "InvNo", "invNo") || invNo;
  const customerInvoiceNo = getVal(data, "BillNo", "billNo");
  const dueDateDisplay = getVal(data, "DueDate", "dueDate") || computeDueDate(trnDate, dueDays);
  // MVC PrintInvoice: Amount US {SSymbol} | Amount {MSymbol}
  const amountHeader = getPrintAmountHeader(data, company);
  const pages = useMemo(() => paginateStella(items, ITEMS_PER_PAGE, LAST_PAGE_ITEMS), [items]);

  document.title = `Purchase_${purchaseNo || invNo} | Admin`;

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center text-muted py-5">{t("Loading...")}</div>
        </Container>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <Link to="/purchase/purchase-list" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
          </div>
          <div className="text-center text-muted py-5">{t("No data found for this Invoice.")}</div>
          <ToastContainer autoClose={2000} />
        </Container>
      </div>
    );
  }

  const renderHeader = () => (
    <>
      <table style={{ width: "100%", paddingBottom: 6 }}>
        <tbody>
          <tr>
            <td style={{ width: "13%", verticalAlign: "top" }}>
              {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: 90 }} /> : null}
            </td>
            <td style={{ width: "55%", verticalAlign: "top", fontSize: 12 }}>
              <div style={{ fontWeight: "bold", fontSize: 14 }}>{company.companyName}</div>
              <div style={{ marginTop: 3 }}>{company.companyAddress}</div>
              <div>{company.companyAddress1}</div>
              <div>{company.companyAddress2}</div>
              <div style={{ marginTop: 5 }}>
                <b>Tel:</b>&nbsp;&nbsp;{company.companyPhone}
              </div>
              <div style={{ marginTop: 5 }}>
                <b>Email:</b>&nbsp;&nbsp;{company.companyEmail}
              </div>
            </td>
            <td style={{ width: "32%", verticalAlign: "top" }}>
              <div
                style={{
                  textAlign: "left",
                  fontWeight: "bold",
                  fontSize: 24,
                  paddingTop: 5,
                  lineHeight: 1.15
                }}
              >
                PURCHASE NOTE
              </div>
              <table style={{ width: "100%", fontSize: 13, marginTop: 10 }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "5px 0", whiteSpace: "nowrap", width: 90 }}>
                      <b>Date :</b>
                    </td>
                    <td>{fmtDateSlash(trnDate) || trnDate}</td>
                  </tr>
                  <tr>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <b>Purchase #:</b>
                    </td>
                    <td>{purchaseNo}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", marginTop: 10 }}>
        <tbody>
          <tr>
            <td style={{ width: "50%", paddingRight: 20 }}>
              <fieldset
                style={{
                  border: "1px solid #000",
                  borderRadius: 12,
                  padding: "8px 15px 12px 10px",
                  height: 150,
                  margin: 0
                }}
              >
                <legend
                  style={{
                    fontWeight: "bold",
                    fontSize: 13,
                    padding: "0 10px",
                    width: "auto",
                    marginLeft: 10,
                    marginBottom: 2,
                    background: "#fff",
                    border: "none"
                  }}
                >
                  Purchase From:
                </legend>
                <div style={{ fontSize: 14, letterSpacing: "0.9px", marginBottom: 5 }}>
                  {getVal(data, "PartyName", "partyName")}
                </div>
                <div style={{ lineHeight: 1.6, fontSize: 12, marginBottom: 5 }}>
                  {getVal(data, "AddressLine1", "addressLine1")}
                </div>
                <div style={{ lineHeight: 1.6, fontSize: 12, marginBottom: 5 }}>
                  {getVal(data, "AddressLine2", "addressLine2")}
                </div>
                <div style={{ lineHeight: 1.6, fontSize: 12, marginBottom: 5 }}>
                  {getVal(data, "AddressLine3", "addressLine3")}
                </div>
              </fieldset>
            </td>
            <td style={{ width: "50%", paddingLeft: 20 }} />
          </tr>
        </tbody>
      </table>

      <div style={{ margin: "15px 0" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 16,
            fontFamily: "Calibri"
          }}
        >
          <thead>
            <tr>
              {[
                { label: "RECEIVED VIA", width: "30%" },
                { label: "CUSTOMER INVOICE NO", width: "30%" },
                { label: "TERMS", width: "20%" },
                { label: "DUE DATE", width: "30%" }
              ].map((h) => (
                <th key={h.label} style={{ ...th, width: h.width }}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={topCell} />
              <td style={topCell}>{customerInvoiceNo}</td>
              <td style={topCell}>{dueDays ?? ""}</td>
              <td style={topCell}>{dueDateDisplay}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <React.Fragment>
      <div className="page-content purchase-print-page">
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

          <div
            id="purchase-print-area"
            className="purchase-print-sheet"
            style={{
              fontFamily: "Verdana, Arial, sans-serif",
              fontSize: 13,
              color: "#000",
              background: "#fff",
              padding: 16,
              border: "1px solid #dee2e6",
              borderRadius: 8,
              width: "100%",
              maxWidth: 960,
              margin: "0 auto",
              zoom: 0.97
            }}
          >
            {pages.map((pageItems, pageIdx) => {
              const isLastPage = pageIdx === pages.length - 1;
              const pageCapacity = isLastPage ? LAST_PAGE_ITEMS : ITEMS_PER_PAGE;
              let srNo = items.indexOf(pageItems[0]) + 1 || 1;

              return (
                <div key={pageIdx} className={isLastPage ? "" : "page-break"}>
                  {renderHeader()}

                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ fontSize: 13 }}>
                        {["Sr No", "Stock #", "DESCRIPTION", "QTY", "WT.", "Price/Carat", amountHeader].map(
                          (h, col) => (
                            <th key={`${h}-${col}`} style={{ ...th, width: ITEM_COL_WIDTHS[col] }}>
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((it, idx) => (
                        <tr key={idx} style={{ fontSize: 12 }}>
                          <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[0] }}>{srNo++}</td>
                          <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[1], textAlign: "left" }}>
                            {getVal(it, "StockNo", "stockNo")}
                          </td>
                          <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[2], textAlign: "left" }}>
                            {getVal(it, "Description", "description")}
                          </td>
                          <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[3], textAlign: "right" }}>
                            {getVal(it, "Qty", "qty")}
                          </td>
                          <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[4], textAlign: "right" }}>
                            {fmtNum(getVal(it, "Weight", "weight"), 2)}
                          </td>
                          <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[5], textAlign: "right" }}>
                            {fmtNum(getVal(it, "PricePerCarat", "pricePerCarat"), 2)}
                          </td>
                          <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[6], textAlign: "right" }}>
                            {fmtNum(getVal(it, "Amount", "amount"), 2)}
                          </td>
                        </tr>
                      ))}

                      {Array.from({ length: Math.max(0, pageCapacity - pageItems.length) }).map((_, i) => (
                        <tr key={`empty-${i}`}>
                          {Array.from({ length: COL_COUNT }).map((__, col) => (
                            <td key={col} style={{ ...itemCell, width: ITEM_COL_WIDTHS[col] }}>
                              &nbsp;
                            </td>
                          ))}
                        </tr>
                      ))}

                      {!isLastPage && (
                        <tr>
                          {Array.from({ length: COL_COUNT }).map((_, col) => (
                            <td key={col} style={{ borderBottom: "1px solid #000" }} />
                          ))}
                        </tr>
                      )}

                      {isLastPage && (
                        <tr
                          style={{
                            borderTop: "1px solid #000",
                            borderBottom: "1px solid #000",
                            fontSize: 14
                          }}
                        >
                          <td style={{ borderLeft: "1px solid #000", borderRight: "1px solid #000" }} />
                          <td style={{ borderLeft: "1px solid #000", borderRight: "1px solid #000" }} />
                          <td style={{ borderLeft: "1px solid #000", borderRight: "1px solid #000" }} />
                          <td
                            style={{
                              borderLeft: "1px solid #000",
                              borderRight: "1px solid #000",
                              textAlign: "right",
                              verticalAlign: "top"
                            }}
                          >
                            {totals.qty}
                          </td>
                          <td
                            style={{
                              borderLeft: "1px solid #000",
                              borderRight: "1px solid #000",
                              textAlign: "right",
                              verticalAlign: "top"
                            }}
                          >
                            {fmtNum(totals.wt, 2)}
                          </td>
                          <td
                            style={{
                              borderLeft: "1px solid #000",
                              borderRight: "1px solid #000",
                              paddingLeft: 10,
                              verticalAlign: "top"
                            }}
                          >
                            <div>Sub Total</div>
                            <div>Charges</div>
                            <br />
                            <div style={{ fontWeight: "bold", fontSize: 14 }}>TOTAL</div>
                          </td>
                          <td
                            style={{
                              borderLeft: "1px solid #000",
                              borderRight: "1px solid #000",
                              textAlign: "right",
                              verticalAlign: "top"
                            }}
                          >
                            {fmtNum(totals.amount, 2)}
                            <br />
                            <br />
                            <br />
                            {fmtNum(totals.amount, 2)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div style={{ marginTop: 15, textAlign: "left" }}>
                    <span style={{ fontSize: 13 }}>Signature:</span>
                    <span
                      style={{
                        display: "inline-block",
                        borderBottom: "1px solid #000",
                        width: 300,
                        marginLeft: 10,
                        verticalAlign: "baseline"
                      }}
                    />
                  </div>

                  <table style={{ width: "100%", marginTop: 50 }}>
                    <tbody>
                      <tr>
                        <td style={{ width: "50%", textAlign: "left", fontSize: 12 }}>
                          {company.companyFooter || ""}
                        </td>
                        <td style={{ width: "50%", textAlign: "right", fontSize: 12 }}>{pageIdx + 1}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </Container>

        <style>{`
          .page-break { page-break-after: always; }
          @media print {
            @page { size: Letter portrait; margin: 10mm; }
            html, body {
              background: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * { visibility: hidden !important; }
            #purchase-print-area,
            #purchase-print-area * {
              visibility: visible !important;
            }
            #purchase-print-area {
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
          @media (max-width: 767px) {
            .purchase-print-sheet {
              overflow-x: auto !important;
              display: block !important;
            }
          }
        `}</style>
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default SolitairePurchasePrintView;
