import React from "react";
import { FALLBACK_MEMO_CONDITIONS, fmt, fmtDate, getVal, paginateFixed } from "../shared/printUtils";

const line = "2px solid #585858";
const th = { borderLeft: line, borderRight: line, textAlign: "center", fontSize: 14, padding: "4px 2px" };
const td = { borderLeft: line, borderRight: line, borderTop: "none", borderBottom: "none", padding: "2px 4px", textAlign: "center", fontSize: 13 };

const ParcelIndiaSingleFormat = ({ data, items, totals, company, logoUrl }) => {
  const pages = paginateFixed(items, 40);
  const conditions = company.memoConditions || FALLBACK_MEMO_CONDITIONS;

  return (
    <div style={{ fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 13, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        let rowNo = pageIdx * 40 + 1;
        return (
          <div key={pageIdx} className={isLastPage ? "" : "page-break"} style={{ width: "100%", paddingTop: 5 }}>
            <div style={{ border: line, position: "relative", padding: "8px 10px 0" }}>
              <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", background: "#fff", padding: "0 5px" }}>
                શ્રી૧<span style={{ fontSize: 10, position: "relative", top: -2 }}>।</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "20%", padding: "0 10px 10px" }}>
                      {logoUrl ? <img src={logoUrl} alt="Logo" style={{ height: 100, width: 120 }} /> : null}
                    </td>
                    <td style={{ width: "57%", textAlign: "center", paddingBottom: 10 }}>
                      <div style={{ fontSize: 22, letterSpacing: 0.9 }}>{company.companyName}</div>
                      <div style={{ fontSize: 12, fontWeight: "bold", paddingTop: 3 }}>TRUST AND QUALITY IS OUR IDENTITY</div>
                      <div style={{ fontSize: 12, fontWeight: "bold", paddingTop: 3 }}>{company.companyAddress}</div>
                      <div style={{ fontSize: 12, fontWeight: "bold", paddingTop: 15 }}>
                        Ph : {company.companyPhone}
                        <span style={{ marginLeft: 50 }}>Email : {company.companyEmail}</span>
                      </div>
                    </td>
                    <td style={{ width: "23%", fontSize: 12, verticalAlign: "top" }}>
                      <div>GST No : <b>{company.companyGSTNo}</b></div>
                      <div>HSN CODE : <b>{company.companyHSNCode}</b></div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ borderTop: line, textAlign: "center", fontWeight: "bold", fontSize: 26 }}>MEMO OUT</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ border: line, marginTop: -2 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "10px 15px 15px", borderBottom: line }}>
                      <table style={{ width: "100%" }}>
                        <tbody>
                          <tr>
                            <td style={{ width: "8%", fontWeight: "bold", fontSize: 14 }}>M/S</td>
                            <td style={{ width: "2%" }}>:</td>
                            <td style={{ width: "45%", fontSize: 14 }}>{getVal(data, "PartyName")}</td>
                            <td style={{ width: "11%", fontWeight: "bold", fontSize: 14, paddingLeft: 20 }}>Issue Date</td>
                            <td style={{ width: "2%" }}>:</td>
                            <td style={{ width: "16%", fontSize: 14 }}>{fmtDate(getVal(data, "TrnDate"))}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: "bold", fontSize: 14 }}>GST No</td>
                            <td>:</td>
                            <td style={{ fontSize: 14 }}>{company.companyGSTNo}</td>
                            <td style={{ fontWeight: "bold", fontSize: 14, paddingLeft: 20 }}>No</td>
                            <td>:</td>
                            <td style={{ fontSize: 14 }}>{getVal(data, "InvNo")}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: "bold", fontSize: 14, padding: "9px 0" }}>Broker</td>
                            <td>:</td>
                            <td style={{ fontSize: 14 }}>{getVal(data, "BrokerName")}</td>
                            <td></td><td></td><td></td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["No", "Stone Id", "Shp", "Cts", "Col", "Cla", "Cu", "Po", "Sy", "Fl", "Lab", "Rate", "Certi No", "Disc", "Amt"].map((h) => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={td}>{rowNo++}</td>
                      <td style={td}>{getVal(item, "Lotno", "lotNo", "lotno")}</td>
                      <td style={td}>{getVal(item, "ShapeId")}</td>
                      <td style={{ ...td, textAlign: "left" }}>{fmt(getVal(item, "Carats"), 2)}</td>
                      <td style={td}>{getVal(item, "ColorId")}</td>
                      <td style={td}>{getVal(item, "ClarityId")}</td>
                      <td style={td}>{getVal(item, "PropId")}</td>
                      <td style={td}>{getVal(item, "PolishId")}</td>
                      <td style={td}>{getVal(item, "SymId")}</td>
                      <td style={td}>{getVal(item, "FLId")}</td>
                      <td style={td}>{getVal(item, "CertId")}</td>
                      <td style={td}>{fmt(getVal(item, "Rate"), 2)}</td>
                      <td style={td}>{getVal(item, "CertificateNo")}</td>
                      <td style={td}>{fmt(getVal(item, "Back"), 2)}</td>
                      <td style={td}>{fmt(getVal(item, "Amount"), 2)}</td>
                    </tr>
                  ))}
                  {isLastPage && (
                    <tr style={{ fontWeight: "bold" }}>
                      <td colSpan={3} style={{ ...td, borderTop: line }}>Total</td>
                      <td style={{ ...td, borderTop: line, textAlign: "left" }}>{fmt(totals.wt, 2)}</td>
                      <td colSpan={10} style={{ ...td, borderTop: line }}></td>
                      <td style={{ ...td, borderTop: line }}>{fmt(totals.amount, 2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 10, marginTop: 12, textAlign: "justify" }}>{conditions}</div>
            <div style={{ marginTop: 8, fontSize: 11 }}>{company.companyFooter}</div>
          </div>
        );
      })}
    </div>
  );
};

export default ParcelIndiaSingleFormat;
