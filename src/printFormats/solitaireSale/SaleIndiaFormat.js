import React from "react";
import {
  fmt,
  fmtDateMMM,
  getVal,
  paginateWithLastCap
} from "../shared/printUtils";

/**
 * MVC: SoSalePrintInv_INDIA.cshtml
 * - ≤15 records → 1 page (header + rows + GST totals + payment)
 * - Multi-page: full pages 15 rows; last page ≤15 rows + totals + payment footer
 * Fonts match MVC: Verdana/Arial body 13, table 10, zoom 0.95
 */
const PAGE_SIZE = 15;
const LAST_PAGE_SIZE = 15;
const FONT = "Verdana, Arial, sans-serif";

const HEADERS = [
  "Sr No", "StoneID", "Lab", "CertNo", "Shp", "Col", "Cla",
  "Cut", "Pol", "Sym", "FL", "Cts", "Rate", "Back", "Amt"
];

const COL_WIDTHS = [
  "6%", "9%", "6%", "10%", "5%", "5%", "5%",
  "5%", "5%", "5%", "4%", "6%", "7%", "6%", "10%"
];

const cell = {
  border: "2px solid #A2A1A1",
  padding: "0 6px",
  textAlign: "center",
  verticalAlign: "middle",
  height: 22,
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

const SaleIndiaFormat = ({ data, items, company, logoUrl }) => {
  const pages = paginateWithLastCap(items, PAGE_SIZE, LAST_PAGE_SIZE);
  const list = items || [];
  const information = company.information || "";

  const companyPan =
    getVal(data, "CompanyPANNo", "companyPANNo") || company.companyPANNo || "";
  const companyGst =
    getVal(data, "CompanyGSTNo", "companyGSTNo") || company.companyGSTNo || "";

  const totalWt = list.reduce(
    (s, it) => s + (Number(getVal(it, "Carats", "carats", "Weight", "weight")) || 0),
    0
  );
  const totalAmt = list.reduce(
    (s, it) =>
      s + (Number(getVal(it, "MasterCurrencyAmount", "masterCurrencyAmount", "Amount", "amount")) || 0),
    0
  );
  const plusMinus =
    (Number(getVal(data, "PlusMinusAmount", "plusMinusAmount")) || 0) *
    (Number(getVal(data, "BaseRate", "baseRate")) || 0);
  const finalAmount =
    Number(getVal(data, "FinalAmount", "finalAmount")) || totalAmt;

  const renderBillShip = (label) => (
    <td style={{ width: "44%", border: "2px solid #A2A1A1", verticalAlign: "top" }}>
      <div
        style={{
          fontSize: 14,
          background: "#BFBFBF",
          textAlign: "center",
          fontWeight: "bold",
          padding: 6,
          borderBottom: "2px solid #8f8f8f",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact"
        }}
      >
        {label}
      </div>
      <table style={{ width: "100%", height: 120, borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ padding: 5, verticalAlign: "top", fontSize: 14 }}>
              <div style={{ fontSize: 15, fontWeight: "bold", paddingBottom: 5 }}>
                {getVal(data, "PartyName", "partyName")}
              </div>
              <div style={{ padding: "2px 0" }}>{getVal(data, "AddressLine1", "addressLine1")}</div>
              <div>{getVal(data, "AddressLine2", "addressLine2")}</div>
              <div style={{ padding: "4px 0" }}>{getVal(data, "AddressLine3", "addressLine3")}</div>
            </td>
          </tr>
          <tr>
            <td style={{ padding: 5, fontSize: 10, verticalAlign: "bottom" }}>
              PAN : {companyPan}
              <br />
              GST : {companyGst}
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  );

  const renderHeader = () => (
    <>
      <table style={{ width: "100%", marginBottom: 10, borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ width: "55%", verticalAlign: "top" }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ height: 100, width: 110, objectFit: "contain" }} />
              ) : null}
              <div style={{ fontFamily: "Verdana, Arial, sans-serif", marginTop: 6, fontSize: 13, fontWeight: "bold" }}>
                <div style={{ paddingTop: 17, fontSize: 14 }}>{company.companyName}</div>
                <div style={{ paddingBottom: 10 }}>{company.companyAddress}</div>
                <table style={{ fontSize: 13, fontFamily: "Verdana, Arial, sans-serif", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "5px 0" }}>Phone :</td>
                      <td style={{ padding: "5px 0", paddingRight: 40 }}>{company.companyPhone}</td>
                      <td style={{ fontWeight: "bold", padding: "5px 0" }}>Pan :</td>
                      <td style={{ padding: "5px 0" }}>{companyPan}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold" }}>E-Mail :</td>
                      <td style={{ paddingRight: 40 }}>{company.companyEmail}</td>
                      <td style={{ fontWeight: "bold" }}>GST :</td>
                      <td>{companyGst}</td>
                    </tr>
                  </tbody>
                </table>
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
                      <td style={{ border: "2px solid #A2A1A1", padding: "6px 10px", textAlign: "center" }}>
                        {v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10, marginBottom: 12 }}>
        <tbody>
          <tr>
            {renderBillShip("Bill To")}
            <td style={{ width: "12%" }} />
            {renderBillShip("Ship To")}
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8, fontSize: 10, fontFamily: FONT }}>
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
            <td style={cell}>{getVal(data, "SalesPersons", "salesPersons")}</td>
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
    <div className="sale-india-root" style={{ fontFamily: FONT, fontSize: 13, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;

        let srNo = 1;
        if (pageItems.length && list.length) {
          const idx = list.indexOf(pageItems[0]);
          srNo = idx >= 0 ? idx + 1 : pageIdx * PAGE_SIZE + 1;
        }

        return (
          <div
            key={pageIdx}
            className={isLastPage ? "sale-india-page" : "sale-india-page page-break"}
            style={{ width: "100%", paddingTop: 5 }}
          >
            {renderHeader()}

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: FONT }}>
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
                    <td style={cell}>{getVal(item, "Lotno", "lotNo", "lotno")}</td>
                    <td style={cell}>{getVal(item, "CertId", "certId")}</td>
                    <td style={cell}>{getVal(item, "CertificateNo", "certificateNo")}</td>
                    <td style={cell}>{getVal(item, "ShapeId", "shapeId")}</td>
                    <td style={cell}>{getVal(item, "ColorId", "colorId")}</td>
                    <td style={cell}>{getVal(item, "ClarityId", "clarityId")}</td>
                    <td style={cell}>{getVal(item, "PropId", "propId")}</td>
                    <td style={cell}>{getVal(item, "PolishId", "polishId")}</td>
                    <td style={cell}>{getVal(item, "SymId", "symId")}</td>
                    <td style={cell}>{getVal(item, "FLId", "flId", "FlId")}</td>
                    <td style={cell}>{fmt(getVal(item, "Carats", "carats"), 2)}</td>
                    <td style={cell}>{fmt(getVal(item, "Rate", "rate"), 2)}</td>
                    <td style={cell}>{fmt(getVal(item, "Back", "back"), 2)}</td>
                    <td style={cell}>
                      {fmt(getVal(item, "MasterCurrencyAmount", "masterCurrencyAmount", "Amount", "amount"), 2)}
                    </td>
                  </tr>
                ))}

                {isLastPage && (
                  <>
                    <tr>
                      <td
                        colSpan={11}
                        style={{
                          ...cell,
                          borderRight: "none",
                          padding: "4px 12px",
                          fontWeight: "bold",
                          fontSize: 13,
                          height: "auto"
                        }}
                      >
                        <span style={{ float: "left" }}>Total Carats :</span>
                        <span style={{ float: "right" }}>{fmt(totalWt, 2)}</span>
                        <div style={{ clear: "both" }} />
                      </td>
                      <td colSpan={2} style={{ ...cell, height: "auto", padding: "4px 0" }}>
                        <table style={{ width: "70%", margin: "0 auto", borderCollapse: "collapse", fontSize: 10 }}>
                          <tbody>
                            <tr>
                              <td colSpan={2} style={{ border: "none", textAlign: "left" }}>
                                <b>Amt Rs.</b>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: "none", textAlign: "left" }}>
                                <b>CGST:</b>
                              </td>
                              <td style={{ border: "none" }}>{fmt(getVal(data, "CGSTPer", "cgstPer"), 2)}%</td>
                            </tr>
                            <tr>
                              <td style={{ border: "none", textAlign: "left" }}>
                                <b>SGST:</b>
                              </td>
                              <td style={{ border: "none" }}>{fmt(getVal(data, "SGSTPer", "sgstPer"), 2)}%</td>
                            </tr>
                            <tr>
                              <td style={{ border: "none", textAlign: "left" }}>
                                <b>IGST:</b>
                              </td>
                              <td style={{ border: "none" }}>{fmt(getVal(data, "IGSTPer", "igstPer"), 2)}%</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                      <td colSpan={2} style={{ ...cell, height: "auto", padding: "4px 6px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            {[
                              totalAmt,
                              getVal(data, "CGSTAmount", "cgstAmount"),
                              getVal(data, "SGSTAmount", "sgstAmount"),
                              getVal(data, "IGSTAmount", "igstAmount")
                            ].map((v, i) => (
                              <tr key={i}>
                                <td
                                  style={{
                                    border: "none",
                                    textAlign: "right",
                                    fontWeight: "bold",
                                    fontSize: 12,
                                    padding: "0 6px"
                                  }}
                                >
                                  {fmt(v, 2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={13} style={{ border: "none", padding: 0 }} />
                      <td colSpan={2} style={{ ...cell, padding: "0 8px", height: "auto" }}>
                        <span style={{ float: "left", fontWeight: "bold" }}>+/- Amt</span>
                        <span style={{ float: "right", fontWeight: "bold" }}>{fmt(plusMinus, 2)}</span>
                        <div style={{ clear: "both" }} />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={13} style={{ border: "none", padding: 0 }} />
                      <td
                        colSpan={2}
                        style={{
                          ...cell,
                          fontWeight: "bold",
                          fontSize: 14,
                          textAlign: "right",
                          padding: "0 8px",
                          height: "auto"
                        }}
                      >
                        {fmt(finalAmount, 2)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {isLastPage && (
              <>
                <div
                  style={{
                    fontSize: 12,
                    textAlign: "justify",
                    margin: "13px 0",
                    fontFamily: '"Segoe UI", Arial, sans-serif'
                  }}
                >
                  {information}
                </div>
                <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "60%", verticalAlign: "top" }}>
                        <table
                          style={{
                            fontFamily: "Verdana, Arial, sans-serif",
                            fontSize: 13,
                            borderCollapse: "collapse"
                          }}
                        >
                          <tbody>
                            <tr>
                              <td colSpan={2} style={{ fontWeight: "bold", fontSize: 15, paddingBottom: 15 }}>
                                Payment Instruction:
                              </td>
                            </tr>
                            <tr>
                              <td style={{ width: 200, fontWeight: "bold", whiteSpace: "nowrap" }}>Bank Name :</td>
                              <td style={{ paddingLeft: 40 }}>{getVal(data, "bnm", "Bnm")}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: "bold", whiteSpace: "nowrap", letterSpacing: 1 }}>
                                Account No :
                              </td>
                              <td style={{ paddingLeft: 40 }}>{getVal(data, "BankAccNo", "bankAccNo")}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>ABA Routing Number :</td>
                              <td style={{ paddingLeft: 40 }}>
                                {getVal(data, "ABARoutingNumber", "abaRoutingNumber")}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: "bold", whiteSpace: "nowrap", padding: "4px 0" }}>
                                Swift Code :
                              </td>
                              <td style={{ paddingLeft: 40 }}>{getVal(data, "SwiftCode", "swiftCode")}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>ZELLE Id :</td>
                              <td style={{ paddingLeft: 40 }}>{getVal(data, "ZelleID", "zelleID")}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                      <td
                        style={{
                          width: "40%",
                          textAlign: "right",
                          verticalAlign: "bottom",
                          paddingBottom: 10
                        }}
                      >
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
              </>
            )}

            <div style={{ float: "right", fontSize: 15, marginTop: 5 }}>
              {pageIdx + 1} / {pages.length}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SaleIndiaFormat;
