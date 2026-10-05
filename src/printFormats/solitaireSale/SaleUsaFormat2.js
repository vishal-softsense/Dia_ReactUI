import React from "react";
import {
  FALLBACK_MEMO_CONDITIONS,
  fmt,
  fmtDateSlash,
  fmtNum,
  getVal,
  paginateWithLastCap
} from "../shared/printUtils";

/**
 * MVC: SoSalePrintInv_USA_F2.cshtml
 * - ≤30 records → 1 page (header + rows + totals + payment)
 * - Multi-page: full pages 30 rows; last page ≤21 rows + totals + payment
 */
const PAGE_SIZE = 30;
const LAST_PAGE_SIZE = 21;
const COL_COUNT = 8;
const COL_WIDTHS = ["6%", "12%", "11%", "9%", "10%", "24%", "14%", "14%"];
const HEADERS = ["Sr No", "MemoNo", "Stock #", "QTY", "WT.", "DESCRIPTION", "Price/Carat", "Amount US $"];

const FONT = "Verdana, Arial, sans-serif";

const th = {
  background: "#BFBFBF",
  border: "1px solid #000",
  padding: "5px 0",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: 12,
  fontFamily: FONT,
  color: "#000",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact"
};

const td = {
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  borderTop: "none",
  borderBottom: "none",
  padding: "0 5px",
  textAlign: "center",
  verticalAlign: "middle",
  height: 20,
  fontSize: 11,
  fontFamily: FONT,
  color: "#000"
};

const topTd = {
  border: "1px solid #000",
  padding: "3px 5px",
  textAlign: "center",
  verticalAlign: "middle",
  height: 22,
  fontSize: 11,
  fontFamily: FONT,
  color: "#000"
};

const SaleUsaFormat2 = ({ data, items, company, logoUrl }) => {
  const pages = paginateWithLastCap(items, PAGE_SIZE, LAST_PAGE_SIZE);
  const conditions = company.saleConditions || FALLBACK_MEMO_CONDITIONS;
  const information = company.information || "";

  const list = items || [];
  const qtyTotal = list.reduce((s, it) => s + (Number(getVal(it, "Qty", "qty", "Pcs", "pcs")) || 0), 0);
  const wtTotal = list.reduce((s, it) => s + (Number(getVal(it, "Weight", "weight", "Carats", "carats")) || 0), 0);
  const amtTotal = list.reduce(
    (s, it) => s + (Number(getVal(it, "MasterCurrencyAmount", "Amount", "amount")) || 0),
    0
  );

  return (
    <div className="sale-usa-f2-root" style={{ fontFamily: FONT, fontSize: 13, color: "#000", lineHeight: 1.3 }}>
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        // Last page leaves room for totals + payment; other pages fill to 30
        const fillTo = isLastPage ? Math.max(pageItems.length, LAST_PAGE_SIZE) : PAGE_SIZE;
        const emptyCount = Math.max(0, fillTo - pageItems.length);

        let srNo = 1;
        if (pageItems.length && items?.length) {
          const idx = items.indexOf(pageItems[0]);
          srNo = idx >= 0 ? idx + 1 : pageIdx * PAGE_SIZE + 1;
        }

        return (
          <div
            key={pageIdx}
            className={`sale-usa-f2-page${isLastPage ? "" : " page-break"}`}
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "10.4in",
              boxSizing: "border-box"
            }}
          >
            <div className="sale-usa-f2-main" style={{ flex: "1 1 auto" }}>
              {/* HEADER */}
              <table style={{ width: "100%", marginBottom: 6, borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "13%", verticalAlign: "top" }}>
                      {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: 85 }} /> : null}
                    </td>
                    <td style={{ width: "55%", verticalAlign: "top", fontSize: 12, fontFamily: FONT }}>
                      <div style={{ fontWeight: "bold", fontSize: 14 }}>{company.companyName}</div>
                      <div style={{ marginTop: 2 }}>{company.companyAddress}</div>
                      <div>{company.companyAddress1}</div>
                      <div>{company.companyAddress2}</div>
                      <div style={{ marginTop: 3 }}>
                        <b>Tel:</b>&nbsp;&nbsp;{company.companyPhone}
                      </div>
                      <div style={{ marginTop: 2 }}>
                        <b>Email:</b>&nbsp;&nbsp;{company.companyEmail}
                      </div>
                    </td>
                    <td style={{ width: "32%", verticalAlign: "top" }}>
                      <div style={{ fontWeight: "bold", fontSize: 24, paddingTop: 2, fontFamily: FONT }}>INVOICE</div>
                      <table style={{ width: "100%", fontSize: 12, marginTop: 6, fontFamily: FONT }}>
                        <tbody>
                          <tr>
                            <td style={{ width: "40%" }}>
                              <b>Date :</b>
                            </td>
                            <td>{fmtDateSlash(getVal(data, "TrnDate", "trnDate"))}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: "4px 0" }}>
                              <b>Memo # :</b>
                            </td>
                            <td style={{ padding: "4px 0" }}>{getVal(data, "InvNo", "invNo")}</td>
                          </tr>
                          <tr>
                            <td>
                              <b>Printed On :</b>
                            </td>
                            <td>{fmtDateSlash(getVal(data, "RoundDate", "roundDate") || new Date())}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* CONSIGNED TO / SHIP TO */}
              <table style={{ width: "100%", marginTop: 4, borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    {["Consigned To:", "Ship To:"].map((legend, i) => (
                      <td
                        key={legend}
                        style={{
                          width: "50%",
                          paddingRight: i === 0 ? 12 : 0,
                          paddingLeft: i === 1 ? 12 : 0,
                          verticalAlign: "top"
                        }}
                      >
                        <fieldset
                          style={{
                            border: "1px solid #000",
                            borderRadius: 10,
                            padding: "4px 10px 6px 8px",
                            height: 100,
                            margin: 0
                          }}
                        >
                          <legend style={{ fontWeight: "bold", fontSize: 12, padding: "0 8px", width: "auto", marginBottom: 0 }}>
                            {legend}
                          </legend>
                          <div style={{ fontSize: 12, lineHeight: 1.4 }}>{getVal(data, "PartyName", "partyName")}</div>
                          <div style={{ fontSize: 11, lineHeight: 1.4 }}>{getVal(data, "AddressLine1", "addressLine1")}</div>
                          <div style={{ fontSize: 11, lineHeight: 1.4 }}>{getVal(data, "AddressLine2", "addressLine2")}</div>
                          <div style={{ fontSize: 11, lineHeight: 1.4 }}>{getVal(data, "AddressLine3", "addressLine3")}</div>
                        </fieldset>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              {/* INFORMATION */}
              <div
                style={{
                  fontSize: 10,
                  textAlign: "justify",
                  minHeight: 40,
                  maxHeight: 50,
                  overflow: "hidden",
                  margin: "8px 0",
                  fontFamily: "Segoe UI, Verdana, sans-serif",
                  lineHeight: 1.35
                }}
              >
                {information}
              </div>

              {/* CONTACT / SALES TABLE */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 6, fontSize: 11 }}>
                <thead>
                  <tr>
                    {["CONTACT", "SALES PERSON", "CUST ORDER #", "SHIP VIA", "TRACKING #"].map((h) => (
                      <th key={h} style={th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={topTd} />
                    <td style={topTd}>{getVal(data, "SalesPersons", "salesPersons")}</td>
                    <td style={topTd} />
                    <td style={topTd}>{getVal(data, "ShipVia", "shipVia")}</td>
                    <td style={topTd}>{getVal(data, "Tracking", "tracking")}</td>
                  </tr>
                </tbody>
              </table>

              {/* ITEM TABLE */}
              <table className="sale-usa-f2-item-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {HEADERS.map((h, i) => (
                      <th key={h} style={{ ...th, width: COL_WIDTHS[i], fontSize: 11 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={td}>{srNo++}</td>
                      <td style={td}>{getVal(item, "MemoNo", "memoNo")}</td>
                      <td style={{ ...td, textAlign: "left", paddingLeft: 10 }}>
                        {getVal(item, "StockNo", "stockNo", "Lotno", "LotNo", "lotNo", "lotno")}
                      </td>
                      <td style={td}>{getVal(item, "Qty", "qty", "Pcs", "pcs")}</td>
                      <td style={{ ...td, textAlign: "right", paddingRight: 10 }}>
                        {fmt(getVal(item, "Weight", "weight", "Carats", "carats"), 2)}
                      </td>
                      <td style={{ ...td, textAlign: "left" }}>
                        {getVal(item, "Description", "description", "ItemName", "itemName")}
                      </td>
                      <td style={{ ...td, textAlign: "right" }}>
                        {fmtNum(getVal(item, "PricePerCarat", "pricePerCarat", "Rate", "rate"), 2)}
                      </td>
                      <td style={{ ...td, textAlign: "right" }}>
                        {fmtNum(getVal(item, "MasterCurrencyAmount", "Amount", "amount"), 2)}
                      </td>
                    </tr>
                  ))}

                  {Array.from({ length: emptyCount }).map((_, i) => (
                    <tr key={`e-${i}`} className="empty-row" style={{ height: 20 }}>
                      {Array.from({ length: COL_COUNT }).map((__, c) => (
                        <td key={c} style={{ ...td, height: 20 }}>
                          &nbsp;
                        </td>
                      ))}
                    </tr>
                  ))}

                  {!isLastPage && (
                    <tr>
                      {Array.from({ length: COL_COUNT }).map((_, c) => (
                        <td
                          key={c}
                          style={{
                            borderBottom: "1px solid #000",
                            height: 0,
                            padding: 0,
                            borderLeft: "1px solid #000",
                            borderRight: "1px solid #000"
                          }}
                        />
                      ))}
                    </tr>
                  )}

                  {isLastPage && (
                    <tr className="sale-usa-f2-totals-row" style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000" }}>
                      <td style={{ ...td, borderBottom: "1px solid #000" }} />
                      <td style={{ ...td, borderBottom: "1px solid #000" }} />
                      <td style={{ ...td, borderBottom: "1px solid #000" }} />
                      <td style={{ ...td, textAlign: "right", verticalAlign: "top", fontSize: 12, borderBottom: "1px solid #000" }}>
                        {qtyTotal}
                      </td>
                      <td style={{ ...td, textAlign: "right", verticalAlign: "top", fontSize: 12, borderBottom: "1px solid #000" }}>
                        {fmt(wtTotal, 2)}
                      </td>
                      <td style={{ ...td, fontWeight: "bold", verticalAlign: "top", fontSize: 12, borderBottom: "1px solid #000" }}>
                        Terms: Due upon receipt
                      </td>
                      <td
                        style={{
                          ...td,
                          textAlign: "left",
                          paddingLeft: 8,
                          fontSize: 11,
                          lineHeight: 1.65,
                          verticalAlign: "top",
                          borderBottom: "1px solid #000"
                        }}
                      >
                        Sub Total
                        <br />
                        Charges
                        <br />
                        Discount
                        <br />
                        <b style={{ fontSize: 14 }}>TOTAL</b>
                      </td>
                      <td
                        style={{
                          ...td,
                          textAlign: "right",
                          fontSize: 12,
                          lineHeight: 1.65,
                          verticalAlign: "top",
                          borderBottom: "1px solid #000"
                        }}
                      >
                        {fmtNum(amtTotal, 2)}
                        <br />
                        <br />
                        <br />
                        {fmtNum(amtTotal, 2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER — pinned to bottom of page (no gap) */}
            <div className="sale-usa-f2-footer-block" style={{ flex: "0 0 auto", marginTop: "auto", paddingTop: 8 }}>
              {isLastPage && (
                <table className="sale-usa-f2-payment" style={{ fontFamily: FONT, fontSize: 12, borderCollapse: "collapse", marginBottom: 6 }}>
                  <tbody>
                    <tr>
                      <td colSpan={2} style={{ fontWeight: "bold", paddingBottom: 3 }}>
                        Payment Instruction:
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>{company.companyName}</td>
                    </tr>
                    <tr>
                      <td colSpan={2}>{company.companyAddress}</td>
                    </tr>
                    <tr style={{ letterSpacing: 0.5 }}>
                      <td style={{ width: 130, paddingTop: 4 }}>Bank Name :</td>
                      <td style={{ paddingLeft: 28 }}>{getVal(data, "bnm", "BankName")}</td>
                    </tr>
                    <tr>
                      <td>Account No :</td>
                      <td style={{ paddingLeft: 28 }}>
                        <strong>{getVal(data, "BankAccNo")}</strong>
                      </td>
                    </tr>
                    <tr style={{ letterSpacing: 0.5 }}>
                      <td>Routing Number :</td>
                      <td style={{ paddingLeft: 28 }}>
                        <strong>{getVal(data, "ABARoutingNumber")}</strong>
                      </td>
                    </tr>
                    <tr style={{ letterSpacing: 0.5 }}>
                      <td>
                        <b>Swift Code :</b>
                      </td>
                      <td style={{ paddingLeft: 28 }}>
                        <strong>{getVal(data, "SwiftCode")}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>ZELLE Id :</b>
                      </td>
                      <td style={{ paddingLeft: 28 }}>
                        <strong>{getVal(data, "ZelleID")}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              <div className="sale-usa-f2-sign" style={{ marginTop: 4 }}>
                <span style={{ fontSize: 12 }}>Signature:</span>
                <span style={{ display: "inline-block", borderBottom: "1px solid #000", width: 280, marginLeft: 8 }} />
              </div>

              <div
                style={{
                  fontSize: 10,
                  textAlign: "justify",
                  margin: "8px 0 4px",
                  fontFamily: "Segoe UI, Verdana, sans-serif",
                  lineHeight: 1.35
                }}
              >
                {conditions}
              </div>

              <table style={{ width: "100%", fontSize: 11, fontFamily: FONT }}>
                <tbody>
                  <tr>
                    <td style={{ width: "50%", textAlign: "left" }}>{company.companyFooter}</td>
                    <td style={{ width: "50%", textAlign: "right" }}>{pageIdx + 1}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SaleUsaFormat2;
