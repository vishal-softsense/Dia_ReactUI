import React from "react";
import {
  fmtDateSlash,
  fmtNum,
  getPrintAmountHeader,
  getVal,
  paginateWithLastCap
} from "../shared/printUtils";

/**
 * SoftSense Views/Purchase/PrintInvoice.cshtml (PURCHASE NOTE)
 * Page 1 / middle: 24 records
 * Last page: up to 25 records + Totals
 * Example: 49 items → Page1: 24 | Page2: 25 + TOTAL
 */
const ITEMS_PER_PAGE = 24;
const LAST_PAGE_ITEMS = 25;
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
  height: 24
};

/** MVC .invoice-item-table td — height 24px = record gap like SoftSense PDF */
const itemCell = {
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  borderTop: "none",
  borderBottom: "none",
  padding: "0 6px",
  textAlign: "center",
  verticalAlign: "middle",
  height: 24,
  lineHeight: "24px"
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

const formatDueDate = (dueDate, trnDate, dueDays) => {
  const raw = dueDate;
  if (raw !== undefined && raw !== null && String(raw).trim() !== "") {
    const slash = fmtDateSlash(raw);
    if (slash && slash !== raw) return slash;
    const mdy = String(raw).trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (mdy) {
      return `${String(mdy[1]).padStart(2, "0")}/${String(mdy[2]).padStart(2, "0")}/${mdy[3]}`;
    }
    return slash || String(raw);
  }
  return computeDueDate(trnDate, dueDays);
};

const PurchaseNoteFormat = ({ data, items, totals, company, logoUrl }) => {
  const pages = paginateWithLastCap(items, ITEMS_PER_PAGE, LAST_PAGE_ITEMS);
  const trnDate = getVal(data, "TrnDate", "trnDate");
  const dueDays = getVal(data, "DueDays", "dueDays");
  const purchaseNo = getVal(data, "InvNo", "invNo");
  const customerInvoiceNo = getVal(data, "BillNo", "billNo");
  const dueDateDisplay = formatDueDate(getVal(data, "DueDate", "dueDate"), trnDate, dueDays);
  const amountHeader = getPrintAmountHeader(data, company);

  const renderHeader = () => (
    <>
      <table style={{ width: "100%", paddingBottom: 10 }}>
        <tbody>
          <tr>
            <td style={{ width: "13%", verticalAlign: "top" }}>
              {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: 90 }} /> : null}
            </td>
            <td style={{ width: "55%", verticalAlign: "top", fontSize: 12 }}>
              <div style={{ fontWeight: "bold", fontSize: 14 }}>{company?.companyName}</div>
              <div style={{ marginTop: 3 }}>{company?.companyAddress}</div>
              <div>{company?.companyAddress1}</div>
              <div>{company?.companyAddress2}</div>
              <div style={{ marginTop: 5 }}>
                <b>Tel:</b>&nbsp;&nbsp;{company?.companyPhone}
              </div>
              <div style={{ marginTop: 5 }}>
                <b>Email:</b>&nbsp;&nbsp;{company?.companyEmail}
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
            fontFamily: "Calibri, Arial, sans-serif"
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
    <div
      className="purchase-note-root"
      style={{ fontFamily: "Verdana, Arial, sans-serif", fontSize: 13, color: "#000" }}
    >
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        const pageCapacity = isLastPage ? LAST_PAGE_ITEMS : ITEMS_PER_PAGE;
        let srNo = pageIdx * ITEMS_PER_PAGE + 1;

        return (
          <div
            key={pageIdx}
            className={`purchase-note-page${isLastPage ? "" : " page-break"}`}
          >
            {renderHeader()}

            <table
              className="purchase-item-table"
              style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}
            >
              <thead>
                <tr style={{ fontSize: 12 }}>
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
                      {getVal(it, "StockNo", "stockNo", "LotNo", "lotNo")}
                    </td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[2], textAlign: "left" }}>
                      {getVal(it, "Description", "description", "ItemName", "itemName")}
                    </td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[3], textAlign: "right" }}>
                      {getVal(it, "Qty", "qty", "Pcs", "pcs")}
                    </td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[4], textAlign: "right" }}>
                      {fmtNum(getVal(it, "Weight", "weight", "Carats", "carats"), 2)}
                    </td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[5], textAlign: "right" }}>
                      {fmtNum(getVal(it, "PricePerCarat", "pricePerCarat", "Rate", "rate"), 2)}
                    </td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[6], textAlign: "right" }}>
                      {fmtNum(getVal(it, "Amount", "amount"), 2)}
                    </td>
                  </tr>
                ))}

                {Array.from({ length: Math.max(0, pageCapacity - pageItems.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="empty-row">
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
                      <td key={col} style={{ borderBottom: "1px solid #000", height: 1, padding: 0 }} />
                    ))}
                  </tr>
                )}

                {isLastPage && (
                  <tr className="purchase-totals-row" style={{ fontSize: 13 }}>
                    <td style={{ border: "1px solid #000" }} />
                    <td style={{ border: "1px solid #000" }} />
                    <td style={{ border: "1px solid #000" }} />
                    <td
                      style={{
                        border: "1px solid #000",
                        textAlign: "right",
                        verticalAlign: "top",
                        padding: "2px 6px"
                      }}
                    >
                      {totals.qty}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        textAlign: "right",
                        verticalAlign: "top",
                        padding: "2px 6px"
                      }}
                    >
                      {fmtNum(totals.wt, 2)}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        paddingLeft: 10,
                        verticalAlign: "top",
                        textAlign: "left",
                        lineHeight: 1.45
                      }}
                    >
                      <div>Sub Total</div>
                      <div>Charges</div>
                      <br />
                      <div style={{ fontWeight: "bold", fontSize: 14 }}>TOTAL</div>
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        textAlign: "right",
                        verticalAlign: "top",
                        padding: "2px 6px",
                        lineHeight: 1.45
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

            <div className="purchase-sign-block" style={{ marginTop: 28, textAlign: "left" }}>
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

            <table className="purchase-footer-block" style={{ width: "100%", marginTop: 40 }}>
              <tbody>
                <tr>
                  <td style={{ width: "50%", textAlign: "left", fontSize: 12 }}>
                    {company?.companyFooter || "Powered by SoftOnCloud"}
                  </td>
                  <td style={{ width: "50%", textAlign: "right", fontSize: 12 }}>{pageIdx + 1}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default PurchaseNoteFormat;
