import React from "react";
import {
  fmt,
  fmtDateMMM,
  fmtNum,
  getVal,
  paginateWithLastCap
} from "../shared/printUtils";

/**
 * MVC: SoSalePrintInv_USA.cshtml
 * - ≤20 records → 1 page (header + rows + totals + payment)
 * - Multi-page: full pages 20 rows; last page ≤11 rows + totals + payment footer
 * Fonts match MVC print: body 13, table 10, zoom 0.9
 */
const PAGE_SIZE = 20;
const LAST_PAGE_SIZE = 11;
const COL_COUNT = 16;
const FONT = "Verdana, Arial, sans-serif";

const HEADERS = [
  "Sr No", "StoneID", "MemoNo", "Lab", "CertNo", "Shp", "Col", "Cla",
  "Cut", "Pol", "Sym", "FL", "Cts", "Rate", "Back", "Amt"
];

const COL_WIDTHS = [
  "6%", "9%", "9%", "6%", "10%", "5%", "5%", "5%",
  "5%", "5%", "5%", "4%", "6%", "7%", "6%", "10%"
];

const cell = {
  border: "2px solid #A2A1A1",
  padding: "0 6px",
  textAlign: "center",
  verticalAlign: "middle",
  height: 24,
  fontSize: 10,
  fontFamily: FONT,
  color: "#000"
};

const th = {
  ...cell,
  background: "#BFBFBF",
  padding: "6px 0",
  fontWeight: "bold",
  height: 29,
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact"
};

const SaleUsaFormat = ({ data, items, company, logoUrl }) => {
  const pages = paginateWithLastCap(items, PAGE_SIZE, LAST_PAGE_SIZE);
  const list = items || [];

  const plusMinus =
    (Number(getVal(data, "PlusMinusAmount", "plusMinusAmount")) || 0) *
    (Number(getVal(data, "BaseRate", "baseRate")) || 0);

  const totalWt = list.reduce(
    (s, it) => s + (Number(getVal(it, "Weight", "weight", "Carats", "carats")) || 0),
    0
  );
  const totalAmt = list.reduce(
    (s, it) =>
      s + (Number(getVal(it, "MasterCurrencyAmount", "masterCurrencyAmount", "Amount", "amount")) || 0),
    0
  );
  const finalAmount = Number(getVal(data, "FinalAmount", "finalAmount")) || totalAmt;

  const renderHeader = () => (
    <>
      <table style={{ width: "100%", marginBottom: 8, borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ width: "55%", verticalAlign: "top" }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ height: 100, width: 110, objectFit: "contain" }} />
              ) : null}
              <div style={{ fontFamily: "Verdana, Arial, sans-serif", marginTop: 6, fontSize: 12, fontWeight: "bold" }}>
                <div style={{ fontSize: 14 }}>{company.companyName}</div>
                <div style={{ fontFamily: "Arial, sans-serif", letterSpacing: 1, fontWeight: "normal" }}>
                  {company.companyAddress}
                </div>
                <div style={{ fontFamily: "Arial, sans-serif", letterSpacing: 1, fontWeight: "normal" }}>
                  {company.companyAddress1}
                </div>
                <div style={{ fontFamily: "Arial, sans-serif", letterSpacing: 1, fontWeight: "normal" }}>
                  {company.companyAddress2}
                </div>
                <div>
                  <b>Phone :</b> {company.companyPhone}
                </div>
                <div>
                  <b>E-Mail :</b> {company.companyEmail}
                </div>
              </div>
            </td>
            <td style={{ width: "45%", verticalAlign: "top", textAlign: "right" }}>
              <div style={{ fontWeight: "bold", fontSize: 22, marginBottom: 5, textAlign: "right" }}>INVOICE</div>
              <table
                style={{
                  width: 350,
                  borderCollapse: "collapse",
                  fontSize: 15,
                  marginLeft: "auto",
                  marginTop: 5,
                  fontFamily: FONT
                }}
              >
                <tbody>
                  {[
                    ["Date", fmtDateMMM(getVal(data, "TrnDate", "trnDate"))],
                    ["Invoice #", getVal(data, "InvNo", "invNo")],
                    ["Printed on", fmtDateMMM(getVal(data, "RoundDate", "roundDate") || new Date())]
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td
                        style={{
                          border: "2px solid #A2A1A1",
                          padding: "6px 0 6px 50px",
                          fontWeight: "bold",
                          textAlign: "left"
                        }}
                      >
                        {k}
                      </td>
                      <td style={{ border: "2px solid #A2A1A1", padding: "6px 10px", textAlign: "center" }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
        <tbody>
          <tr>
            {["Bill To", "Ship To"].map((label, i) => (
              <React.Fragment key={label}>
                {i === 1 && <td style={{ width: "12%" }} />}
                <td style={{ width: "44%", border: "2px solid #A2A1A1", verticalAlign: "top" }}>
                  <div
                    style={{
                      fontSize: 14,
                      background: "#BFBFBF",
                      textAlign: "center",
                      fontWeight: "bold",
                      padding: 4,
                      borderBottom: "1px solid #8f8f8f",
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact"
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ padding: "3px 5px", fontSize: 13, minHeight: 120 }}>
                    <div style={{ fontSize: 15, fontWeight: "bold", padding: "10px 0" }}>
                      {getVal(data, "PartyName", "partyName")}
                    </div>
                    <div style={{ padding: "2px 0" }}>{getVal(data, "AddressLine1", "addressLine1")}</div>
                    <div style={{ padding: "2px 0" }}>{getVal(data, "AddressLine2", "addressLine2")}</div>
                    <div style={{ padding: "2px 0" }}>{getVal(data, "AddressLine3", "addressLine3")}</div>
                  </div>
                </td>
              </React.Fragment>
            ))}
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8, fontSize: 10 }}>
        <thead>
          <tr>
            {["Sales Person", "Terms", "Due Date", "Ship Via", "Ship Date", "Tracking No"].map((h) => (
              <th key={h} style={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: 35 }}>
            <td style={cell}>{getVal(data, "SalesPersons", "salesPersons", "SalesPerson")}</td>
            <td style={cell}>{getVal(data, "DueDays", "dueDays")}</td>
            <td style={cell}>{fmtDateMMM(getVal(data, "DueDate", "dueDate"))}</td>
            <td style={cell}>{getVal(data, "ShipVia", "shipVia")}</td>
            <td style={cell} />
            <td style={cell}>{getVal(data, "Tracking", "tracking")}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  return (
    <div className="sale-usa-root" style={{ fontFamily: FONT, fontSize: 13, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
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
            className={`sale-usa-page${isLastPage ? "" : " page-break"}`}
            style={{ boxSizing: "border-box", position: "relative" }}
          >
            {renderHeader()}

            <table className="sale-usa-item-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr style={{ height: 29 }}>
                  {HEADERS.map((h, i) => (
                    <th key={h} style={{ ...th, width: COL_WIDTHS[i] }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => (
                  <tr key={idx}>
                    <td style={cell}>{srNo++}</td>
                    <td style={cell}>
                      {getVal(item, "StockNo", "stockNo", "Lotno", "LotNo", "lotNo", "lotno")}
                    </td>
                    <td style={cell}>{getVal(item, "MemoNo", "memoNo")}</td>
                    <td style={cell}>{getVal(item, "CertId", "certId")}</td>
                    <td style={cell}>{getVal(item, "CertificateNo", "certificateNo")}</td>
                    <td style={cell}>{getVal(item, "ShapeId", "shapeId")}</td>
                    <td style={cell}>{getVal(item, "ColorId", "colorId")}</td>
                    <td style={cell}>{getVal(item, "ClarityId", "clarityId")}</td>
                    <td style={cell}>{getVal(item, "PropId", "propId")}</td>
                    <td style={cell}>{getVal(item, "PolishId", "polishId")}</td>
                    <td style={cell}>{getVal(item, "SymId", "symId")}</td>
                    <td style={cell}>{getVal(item, "FLId", "flId")}</td>
                    <td style={cell}>{fmt(getVal(item, "Weight", "weight", "Carats", "carats"), 2)}</td>
                    <td style={cell}>
                      {fmtNum(getVal(item, "Rate", "rate", "PricePerCarat", "pricePerCarat"), 2)}
                    </td>
                    <td style={cell}>{fmt(getVal(item, "Back", "back"), 2)}</td>
                    <td style={cell}>
                      {fmtNum(getVal(item, "MasterCurrencyAmount", "masterCurrencyAmount", "Amount", "amount"), 2)}
                    </td>
                  </tr>
                ))}

                {Array.from({ length: emptyCount }).map((_, i) => (
                  <tr key={`e-${i}`} style={{ height: 24 }}>
                    {Array.from({ length: COL_COUNT }).map((__, c) => (
                      <td key={c} style={{ ...cell, height: 24 }}>
                        &nbsp;
                      </td>
                    ))}
                  </tr>
                ))}

                {!isLastPage && (
                  <tr style={{ height: 16 }}>
                    <td colSpan={COL_COUNT} style={{ border: "2px solid #A2A1A1" }}>
                      &nbsp;
                    </td>
                  </tr>
                )}

                {isLastPage && (
                  <>
                    <tr>
                      <td
                        colSpan={13}
                        style={{
                          ...cell,
                          borderTop: "2px solid #999",
                          fontWeight: "bold",
                          textAlign: "left"
                        }}
                      >
                        <span style={{ float: "left", paddingLeft: 16 }}>Total Carats :</span>
                        <span style={{ float: "right", fontSize: 13 }}>{fmtNum(totalWt, 2)}</span>
                      </td>
                      <td colSpan={3} style={{ ...cell, borderTop: "2px solid #999", fontWeight: "bold" }}>
                        <span style={{ float: "left", paddingLeft: 12, fontSize: 9 }}>US $ :</span>
                        <span style={{ float: "right", fontSize: 11 }}>{fmtNum(totalAmt, 2)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={14} style={{ borderBottom: "none", borderTop: "none" }} />
                      <td colSpan={2} style={cell}>
                        <span style={{ float: "left", fontSize: 8, fontWeight: "bold" }}>+/- Amt</span>
                        <span style={{ float: "right", fontSize: 11, fontWeight: "bold" }}>{fmtNum(plusMinus, 2)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={14} style={{ borderTop: "none", borderBottom: "none" }} />
                      <td
                        colSpan={2}
                        style={{
                          ...cell,
                          fontWeight: "bold",
                          fontSize: 12,
                          textAlign: "right"
                        }}
                      >
                        {fmtNum(finalAmount, 2)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {isLastPage && (
              <div className="sale-usa-footer" style={{ marginTop: 40 }}>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "60%", verticalAlign: "top" }}>
                        <table style={{ fontFamily: "Verdana, Arial, sans-serif", fontSize: 13, borderCollapse: "collapse" }}>
                          <tbody>
                            <tr>
                              <td colSpan={2} style={{ fontWeight: "bold", fontSize: 15, paddingBottom: 15 }}>
                                Payment Instruction:
                              </td>
                            </tr>
                            <tr>
                              <td style={{ width: 200, fontWeight: "bold", whiteSpace: "nowrap", padding: "2px 0" }}>
                                Bank Name :
                              </td>
                              <td style={{ paddingLeft: 40 }}>{getVal(data, "bnm", "BankName", "bankName")}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: "bold", whiteSpace: "nowrap", padding: "2px 0", letterSpacing: 1 }}>
                                Account No :
                              </td>
                              <td style={{ paddingLeft: 40 }}>{getVal(data, "BankAccNo", "bankAccNo")}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: "bold", whiteSpace: "nowrap", padding: "2px 0" }}>
                                ABA Routing Number :
                              </td>
                              <td style={{ paddingLeft: 40 }}>{getVal(data, "ABARoutingNumber", "abaRoutingNumber")}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: "bold", whiteSpace: "nowrap", padding: "4px 0" }}>
                                Swift Code :
                              </td>
                              <td style={{ paddingLeft: 40 }}>{getVal(data, "SwiftCode", "swiftCode")}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: "bold", whiteSpace: "nowrap", padding: "2px 0" }}>
                                ZELLE Id :
                              </td>
                              <td style={{ paddingLeft: 40 }}>{getVal(data, "ZelleID", "zelleID")}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                      <td style={{ width: "40%", textAlign: "right", verticalAlign: "bottom" }}>
                        <div style={{ marginTop: 60, fontWeight: "bold" }}>
                          <span style={{ fontSize: 15 }}>Signature</span>
                          <span
                            style={{
                              display: "inline-block",
                              borderBottom: "1px solid #000",
                              width: 220,
                              marginLeft: 15
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ textAlign: "right", fontSize: 15, marginTop: 8 }}>
                  Page {pageIdx + 1} of {pages.length}
                </div>
              </div>
            )}

            {!isLastPage && (
              <div style={{ textAlign: "right", fontSize: 15, marginTop: 8, clear: "both" }}>
                Page {pageIdx + 1} of {pages.length}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SaleUsaFormat;
