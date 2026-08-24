import React from "react";
import { FALLBACK_MEMO_CONDITIONS, fmt, fmtDate, getVal, paginateVariable } from "../shared/printUtils";

const box = { border: "2px solid #484848" };
const cell = { border: "1px solid #484848", padding: "2px 3px", textAlign: "center", height: 24 };

const SaleUsaFormat1 = ({ data, items, totals, company, logoUrl }) => {
  const pages = paginateVariable(items, { single: 21, first: 35, middle: 45, last: 26 });
  const conditions = company.saleConditions || FALLBACK_MEMO_CONDITIONS;

  return (
    <div style={{ fontFamily: "Verdana, Arial, sans-serif", fontSize: 13, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === pages.length - 1;
        const itemsPerPage = isFirstPage && isLastPage ? 21 : isFirstPage ? 35 : isLastPage ? 26 : 45;
        let srNo = pageItems.length ? items.indexOf(pageItems[0]) + 1 : 1;
        return (
          <div key={pageIdx} className={isLastPage ? "" : "page-break"}>
            {isFirstPage && (
              <>
                <table style={{ width: "100%", borderCollapse: "collapse", ...box }}>
                  <tbody>
                    <tr style={{ height: 50 }}>
                      <td rowSpan={2} style={{ width: 110, borderRight: "2px solid #484848", textAlign: "center", verticalAlign: "middle", padding: 6 }}>
                        {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: 120, height: 90, objectFit: "contain" }} /> : null}
                      </td>
                      <td style={{ textAlign: "center", fontSize: 22, fontWeight: "bold" }}>{company.companyName}</td>
                    </tr>
                    <tr style={{ height: 50 }}>
                      <td style={{ textAlign: "center", borderTop: "2px solid #484848", fontSize: 16, fontWeight: "bold", textDecoration: "underline" }}>INVOICE</td>
                    </tr>
                  </tbody>
                </table>
                <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #484848", borderTop: "none" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "58%", padding: "2px 10px", verticalAlign: "top" }}>
                        <table>
                          <tbody>
                            <tr><td style={{ minWidth: 75, lineHeight: 1.8 }}>Party</td><td>:</td><td>{getVal(data, "PartyName", "partyName")}</td></tr>
                            <tr>
                              <td style={{ verticalAlign: "top", lineHeight: 1.8 }}>Address</td><td style={{ verticalAlign: "top" }}>:</td>
                              <td style={{ lineHeight: 1.8 }}>{company.companyAddress}<br />{company.companyAddress1}<br />{company.companyAddress2}</td>
                            </tr>
                            <tr><td style={{ lineHeight: 1.8 }}>City</td><td>:</td><td></td></tr>
                            <tr><td style={{ lineHeight: 1.8 }}>Country</td><td>:</td><td></td></tr>
                          </tbody>
                        </table>
                      </td>
                      <td style={{ width: "42%", padding: "2px 10px", verticalAlign: "top" }}>
                        <table>
                          <tbody>
                            <tr><td style={{ minWidth: 80, lineHeight: 1.8 }}>Date</td><td>:</td><td>{fmtDate(getVal(data, "RoundDate", "roundDate"))}</td></tr>
                            <tr><td style={{ lineHeight: 1.8 }}>Due</td><td>:</td><td>{fmtDate(getVal(data, "DueDate", "dueDate"))}</td></tr>
                            <tr><td style={{ lineHeight: 1.8 }}>Invoice No</td><td>:</td><td>{getVal(data, "InvNo", "invNo")}</td></tr>
                            <tr><td style={{ lineHeight: 1.8 }}>Tel/Fax</td><td>:</td><td>{company.companyPhone}</td></tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #484848", fontSize: 10, marginTop: 8 }}>
              <thead>
                <tr>
                  {["Sr No", "Item", "Shp", "Cts", "Col", "Cla", "Cut", "pol", "sym", "FL", "Rapa", "Back", "Rate", "Amt", "Lab", "CertificateNo"].map((h) => (
                    <th key={h} style={cell}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => (
                  <tr key={idx}>
                    <td style={cell}>{srNo++}</td>
                    <td style={cell}>{getVal(item, "Lotno", "lotNo")}</td>
                    <td style={cell}>{getVal(item, "ShapeId", "shapeId")}</td>
                    <td style={cell}>{fmt(getVal(item, "Carats", "carats"), 2)}</td>
                    <td style={cell}>{getVal(item, "ColorId", "colorId")}</td>
                    <td style={cell}>{getVal(item, "ClarityId", "clarityId")}</td>
                    <td style={cell}>{getVal(item, "PropId", "propId")}</td>
                    <td style={cell}>{getVal(item, "PolishId", "polishId")}</td>
                    <td style={cell}>{getVal(item, "SymId", "symId")}</td>
                    <td style={cell}>{getVal(item, "FLId", "flId")}</td>
                    <td style={cell}>{fmt(getVal(item, "Rap", "rap", "MRP", "mrp"), 2)}</td>
                    <td style={cell}>{getVal(item, "Back", "back")}</td>
                    <td style={cell}>{fmt(getVal(item, "Rate", "rate"), 2)}</td>
                    <td style={cell}>{fmt(getVal(item, "Amount", "amount"), 2)}</td>
                    <td style={cell}>{getVal(item, "CertId", "certId")}</td>
                    <td style={cell}>{getVal(item, "CertificateNo", "certificateNo")}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, itemsPerPage - pageItems.length) }).map((_, i) => (
                  <tr key={`e-${i}`} style={{ height: 20 }}><td colSpan={16}>&nbsp;</td></tr>
                ))}
                {isLastPage && (
                  <tr style={{ fontSize: 12, borderTop: "2px solid #484848", height: 27 }}>
                    <td colSpan={3} style={{ ...cell, textAlign: "center" }}><b>Total :</b></td>
                    <td style={cell}>{fmt(totals.wt, 2)}</td>
                    <td colSpan={9} style={cell}></td>
                    <td style={cell}>{fmt(totals.amount, 2)}</td>
                    <td colSpan={2} style={cell}></td>
                  </tr>
                )}
              </tbody>
            </table>
            {isLastPage && (
              <>
                <div style={{ borderTop: "2px solid black", marginTop: 10 }} />
                <div style={{ marginTop: 5, fontWeight: "bold", fontSize: 12 }}>GOODS SOLD & DELIVERED IN HONG KONG , GOODS ONCE SOLD ARE NOT RETURNABLE</div>
                <table style={{ fontFamily: "Verdana", fontSize: 14, marginTop: 10 }}>
                  <tbody>
                    <tr><td colSpan={2}>PAYMENT INFORMATION:</td></tr>
                    <tr><td>Company Name :</td><td>{company.companyName}</td></tr>
                    <tr><td>Account Number :</td><td>{getVal(data, "BankAccNo")}</td></tr>
                    <tr><td style={{ width: 140 }}>Bank Name :</td><td>{getVal(data, "bnm", "BankName")}</td></tr>
                    <tr><td>Bank Address :</td><td>{getVal(data, "BankAddress1")}</td></tr>
                  </tbody>
                </table>
                <div style={{ fontSize: 10, fontWeight: "bold", marginTop: 20, wordSpacing: 5 }}>{conditions}</div>
                <table style={{ width: "100%", marginTop: 30 }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "50%", textAlign: "center", fontWeight: "bold", fontSize: 14 }}>Buyer's Confirmation</td>
                      <td style={{ width: "50%", textAlign: "center", fontWeight: "bold", fontSize: 14 }}>{company.companyName}</td>
                    </tr>
                    <tr>
                      <td style={{ paddingTop: 35, textAlign: "center", fontWeight: "bold" }}>(Chop & Signature)</td>
                      <td style={{ paddingTop: 35, textAlign: "center", fontWeight: "bold" }}>Authorized Signature(s)</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ borderTop: "2px solid black", marginTop: 10 }} />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SaleUsaFormat1;
