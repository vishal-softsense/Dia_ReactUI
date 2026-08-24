import React from "react";
import { fmt, fmtDateMMM, getVal, paginateFixed } from "../shared/printUtils";

const cell = { border: "2px solid #A2A1A1", padding: "0 6px", textAlign: "center", height: 24 };
const th = { ...cell, background: "#BFBFBF", padding: "6px 0" };

const SaleUsaFormat = ({ data, items, totals, company, logoUrl }) => {
  const pages = paginateFixed(items, 30);
  const plusMinus = (Number(getVal(data, "PlusMinusAmount", "plusMinusAmount")) || 0) *
    (Number(getVal(data, "BaseRate", "baseRate")) || 0);
  const finalAmount = Number(getVal(data, "FinalAmount", "finalAmount")) || totals.amount;

  const renderHeader = () => (
    <>
      <table style={{ width: "100%", marginBottom: 10 }}>
        <tbody>
          <tr>
            <td style={{ width: "55%", verticalAlign: "top" }}>
              {logoUrl ? <img src={logoUrl} alt="Logo" style={{ height: 100, width: 110, objectFit: "contain" }} /> : null}
              <div style={{ fontFamily: "Verdana", marginTop: 6, fontSize: 12, fontWeight: "bold" }}>
                <div style={{ fontSize: 14 }}>{company.companyName}</div>
                <div style={{ fontFamily: "Arial", letterSpacing: 1, fontWeight: "normal" }}>{company.companyAddress}</div>
                <div style={{ fontFamily: "Arial", letterSpacing: 1, fontWeight: "normal" }}>{company.companyAddress1}</div>
                <div style={{ fontFamily: "Arial", letterSpacing: 1, fontWeight: "normal" }}>{company.companyAddress2}</div>
                <div><b>Phone :</b> {company.companyPhone}</div>
                <div><b>E-Mail :</b> {company.companyEmail}</div>
              </div>
            </td>
            <td style={{ width: "45%", verticalAlign: "top", textAlign: "right" }}>
              <div style={{ fontWeight: "bold", fontSize: 22, marginBottom: 5 }}>INVOICE</div>
              <table style={{ width: 350, borderCollapse: "collapse", fontSize: 15, marginLeft: "auto", marginTop: 5 }}>
                <tbody>
                  {[
                    ["Date", fmtDateMMM(getVal(data, "TrnDate", "trnDate"))],
                    ["Invoice #", getVal(data, "InvNo", "invNo")],
                    ["Printed on", fmtDateMMM(getVal(data, "RoundDate", "roundDate") || new Date())]
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ border: "2px solid #A2A1A1", padding: "6px 0 6px 50px", fontWeight: "bold", textAlign: "left" }}>{k}</td>
                      <td style={{ border: "2px solid #A2A1A1", padding: "6px 10px", textAlign: "center" }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
        <tbody>
          <tr>
            {["Bill To", "Ship To"].map((label, i) => (
              <React.Fragment key={label}>
                {i === 1 && <td style={{ width: "12%" }} />}
                <td style={{ width: "44%", border: "2px solid #A2A1A1", verticalAlign: "top" }}>
                  <div style={{ fontSize: 14, background: "#BFBFBF", textAlign: "center", fontWeight: "bold", padding: 4, borderBottom: "1px solid #8f8f8f" }}>{label}</div>
                  <div style={{ padding: "3px 5px", fontSize: 13, minHeight: 120 }}>
                    <div style={{ fontSize: 15, fontWeight: "bold", padding: "10px 0" }}>{getVal(data, "PartyName", "partyName")}</div>
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
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: 35 }}>
            <td style={cell}>{getVal(data, "SalesPersons", "salesPersons")}</td>
            <td style={cell}>{getVal(data, "DueDays", "dueDays")}</td>
            <td style={cell}>{fmtDateMMM(getVal(data, "DueDate", "dueDate"))}</td>
            <td style={cell}>{getVal(data, "ShipVia", "shipVia")}</td>
            <td style={cell}></td>
            <td style={cell}>{getVal(data, "Tracking", "tracking")}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  return (
    <div style={{ fontFamily: "Verdana, Arial, sans-serif", fontSize: 13, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        let srNo = pageIdx * 30 + 1;
        return (
          <div key={pageIdx} className={isLastPage ? "" : "page-break"} style={{ position: "relative", minHeight: 1050 }}>
            {renderHeader()}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr style={{ height: 29 }}>
                  {["Sr No", "StoneID", "MemoNo", "Lab", "CertNo", "Shp", "Col", "Cla", "Cut", "Pol", "Sym", "FL", "Cts", "Rate", "Back", "Amt"].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => (
                  <tr key={idx}>
                    <td style={cell}>{srNo++}</td>
                    <td style={cell}>{getVal(item, "Lotno", "lotNo")}</td>
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
                    <td style={cell}>{fmt(getVal(item, "Carats", "carats"), 2)}</td>
                    <td style={cell}>{fmt(getVal(item, "Rate", "rate"), 2)}</td>
                    <td style={cell}>{fmt(getVal(item, "Back", "back"), 2)}</td>
                    <td style={cell}>{fmt(getVal(item, "MasterCurrencyAmount", "Amount", "amount"), 2)}</td>
                  </tr>
                ))}
                {isLastPage && (
                  <>
                    <tr>
                      <td colSpan="13" style={{ ...cell, fontWeight: "bold" }}>
                        <span style={{ float: "left", paddingLeft: 20 }}>Total Carats :</span>
                        <span style={{ float: "right", fontSize: 13 }}>{fmt(totals.wt, 2)}</span>
                      </td>
                      <td colSpan="3" style={{ ...cell, fontWeight: "bold" }}>
                        <span style={{ float: "left", paddingLeft: 20, fontSize: 9 }}>US $ :</span>
                        <span style={{ float: "right", fontSize: 11 }}>{fmt(totals.amount, 2)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="14" style={{ borderBottom: "none" }}></td>
                      <td colSpan="2" style={cell}>
                        <span style={{ float: "left", fontSize: 8, fontWeight: "bold" }}>+/- Amt</span>
                        <span style={{ float: "right", fontSize: 11, fontWeight: "bold" }}>{fmt(plusMinus, 2)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="14" style={{ borderTop: "none" }}></td>
                      <td colSpan="2" style={{ ...cell, fontWeight: "bold", fontSize: 12, textAlign: "right" }}>{fmt(finalAmount, 2)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            {isLastPage && (
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "60%" }}>
                      <table style={{ fontFamily: "Verdana", fontSize: 13, marginTop: 60 }}>
                        <tbody>
                          <tr><td colSpan="2" style={{ fontWeight: "bold", fontSize: 15, paddingBottom: 15 }}>Payment Instruction:</td></tr>
                          <tr><td style={{ width: 200, fontWeight: "bold" }}>Bank Name :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "bnm", "BankName")}</td></tr>
                          <tr><td style={{ fontWeight: "bold" }}>Account No :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "BankAccNo", "bankAccNo")}</td></tr>
                          <tr><td style={{ fontWeight: "bold" }}>ABA Routing Number :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "ABARoutingNumber")}</td></tr>
                          <tr><td style={{ fontWeight: "bold", padding: "4px 0" }}>Swift Code :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "SwiftCode")}</td></tr>
                          <tr><td style={{ fontWeight: "bold" }}>ZELLE Id :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "ZelleID", "zelleID")}</td></tr>
                        </tbody>
                      </table>
                    </td>
                    <td style={{ width: "40%", textAlign: "right", verticalAlign: "bottom" }}>
                      <div style={{ marginTop: 90, fontWeight: "bold" }}>
                        <span style={{ fontSize: 15 }}>Signature</span>
                        <span style={{ display: "inline-block", borderBottom: "1px solid #000", width: 220, marginLeft: 15 }} />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
            <div style={{ float: "right", fontSize: 15, marginTop: 5 }}>Page {pageIdx + 1} of {pages.length}</div>
          </div>
        );
      })}
    </div>
  );
};

export default SaleUsaFormat;
