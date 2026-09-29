import React from "react";
import { fmtDateSlash, fmtNum, getPrintAmountHeader, getVal, paginateStella } from "../shared/printUtils";

// MVC Views/MixPurchase/MixPurchasePrint_USA.cshtml + SoftSense GENERAL PURCHASE NOTE layout
const ITEMS_PER_PAGE = 29;
const LAST_PAGE_ITEMS = 26;
const COL_COUNT = 7;

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

const ITEM_COL_WIDTHS = ["6%", "12%", "34%", "8%", "10%", "14%", "16%"];

/** Due Date = TrnDate + DueDays (matches SoftSense MixPur NOTE sample). */
const computeDueDate = (trnDate, dueDays) => {
  if (!trnDate && trnDate !== 0) return "";
  const days = Number(dueDays);
  if (!Number.isFinite(days) || days < 0) {
    return fmtDateSlash(trnDate);
  }
  try {
    const raw = String(trnDate).trim();
    let d;
    const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
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

const MixPurPrintUsaFormat = ({
  data,
  items,
  totals,
  company,
  logoUrl,
  heading = "GENERAL PURCHASE",
  /** "note" = MVC MixPurchasePrint_USA (GENERAL PURCHASE NOTE). Default keeps Return USA layout. */
  variant = "usa"
}) => {
  const isNote = variant === "note";
  const pages = paginateStella(items, ITEMS_PER_PAGE, LAST_PAGE_ITEMS);
  const trnDate = getVal(data, "TrnDate", "trnDate");
  const dueDays = getVal(data, "DueDays", "dueDays");
  const dueDateDisplay =
    getVal(data, "DueDate", "dueDate") || computeDueDate(trnDate, dueDays);
  // MixPurPrint NOTE: Purchase # = InvNo, CUSTOMER INVOICE NO = BillNo
  const customerInvoiceNo = getVal(data, "BillNo", "billNo");
  const purchaseNo = isNote
    ? getVal(data, "InvNo", "invNo")
    : getVal(data, "BillNo", "billNo");
  // MVC MixPurchasePrint_USA: RECEIVED VIA cell is blank
  const receivedVia = isNote ? "" : getVal(data, "ShipVia", "shipVia", "ReceivedVia", "receivedVia");
  // MVC: Amount US {SSymbol} | Amount {MSymbol}
  const amountHeader = getPrintAmountHeader(data, company);

  const getPageCapacity = (pageIdx) => {
    const isLastPage = pageIdx === pages.length - 1;
    return isLastPage ? LAST_PAGE_ITEMS : ITEMS_PER_PAGE;
  };

  const renderMetaTable = () => {
    if (isNote) {
      return (
        <div style={{ margin: "15px 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 16, fontFamily: "Calibri" }}>
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
                <td style={topCell}>{receivedVia || ""}</td>
                <td style={topCell}>{customerInvoiceNo}</td>
                <td style={topCell}>{dueDays ?? ""}</td>
                <td style={topCell}>{dueDateDisplay}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div style={{ margin: "15px 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 16, fontFamily: "Calibri" }}>
          <thead>
            <tr>
              {["RECEIVED VIA", "INVOICE #", "TERMS"].map((h, i) => (
                <th key={h} style={{ ...th, width: i === 2 ? "34%" : "33%" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={topCell} />
              <td style={topCell}>{getVal(data, "InvNo", "invNo")}</td>
              <td style={topCell}>{getVal(data, "DueDays", "dueDays")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderTotals = () => {
    if (isNote) {
      // MVC MixPurchasePrint_USA: Sub Total / Charges / TOTAL with amount twice
      return (
        <tr style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000", fontSize: 14 }}>
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
      );
    }

    return (
      <tr style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000", fontSize: 14 }}>
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
    );
  };

  const renderHeader = () => (
    <>
      <table style={{ width: "100%", paddingBottom: isNote ? 6 : 10 }}>
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
                  fontSize: isNote ? 18 : 24,
                  paddingTop: 5,
                  lineHeight: 1.15
                }}
              >
                {heading}
              </div>
              <table style={{ width: "100%", fontSize: 13, marginTop: 10 }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "5px 0", whiteSpace: "nowrap", width: 90 }}>
                      <b>Date :</b>
                    </td>
                    <td>{fmtDateSlash(trnDate)}</td>
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

      {renderMetaTable()}
    </>
  );

  const fontFamily = "Verdana, Arial, sans-serif";

  return (
    <div style={{ fontFamily, fontSize: 13, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        const pageCapacity = getPageCapacity(pageIdx);
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
                {pageItems.map((item, idx) => (
                  <tr key={idx} style={{ fontSize: 12 }}>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[0] }}>{srNo++}</td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[1], textAlign: "left" }}>
                      {getVal(item, "StockNo", "stockNo", "Lotno", "lotno", "LotNo", "lotNo")}
                    </td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[2], textAlign: "left" }}>
                      {getVal(item, "Description", "description", "ItemName", "itemName")}
                    </td>
                    <td
                      style={{
                        ...itemCell,
                        width: ITEM_COL_WIDTHS[3],
                        textAlign: "right"
                      }}
                    >
                      {getVal(item, "Qty", "qty", "Pcs", "pcs")}
                    </td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[4], textAlign: "right" }}>
                      {fmtNum(getVal(item, "Weight", "weight", "Carats", "carats"), 2)}
                    </td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[5], textAlign: "right" }}>
                      {(() => {
                        const n = Number(getVal(item, "PricePerCarat", "pricePerCarat", "Rate", "rate"));
                        return Number.isFinite(n) ? n.toFixed(2) : "0.00";
                      })()}
                    </td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[6], textAlign: "right" }}>
                      {fmtNum(
                        getVal(item, "Amount", "amount", "MasterCurrencyAmount", "masterCurrencyAmount"),
                        2
                      )}
                    </td>
                  </tr>
                ))}

                {Array.from({ length: Math.max(0, pageCapacity - pageItems.length) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    {Array.from({ length: COL_COUNT }).map((__, col) => (
                      <td
                        key={col}
                        style={{
                          ...itemCell,
                          width: ITEM_COL_WIDTHS[col],
                          borderLeft: "1px solid #000",
                          borderRight: "1px solid #000",
                          borderTop: "none",
                          borderBottom: "none"
                        }}
                      >
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

                {isLastPage && renderTotals()}
              </tbody>
            </table>

            <div style={{ marginTop: 15 }}>
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
  );
};

export default MixPurPrintUsaFormat;
