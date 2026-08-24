import React from "react";
import { fmt, fmtDateMMM, getVal, paginateVariable } from "../shared/printUtils";

const th = { background: "#BFBFBF", border: "2px solid #A2A1A1", padding: "6px 0", textAlign: "center" };
const td = { border: "2px solid #A2A1A1", padding: "0 6px", textAlign: "center", height: 22 };

const SaleIndiaFormat = ({ data, items, totals, company, logoUrl }) => {
  const pages = paginateVariable(items, { single: 14, first: 30, middle: 30, last: 14 });
  const information = company.information || "";

  const renderHeader = () => (
    <>
      <table style={{ width: "100%", marginBottom: 10 }}>
        <tbody>
          <tr>
            <td style={{ width: "55%", verticalAlign: "top" }}>
              {logoUrl ? <img src={logoUrl} alt="Logo" style={{ height: 100, width: 110 }} /> : null}
              <div style={{ fontFamily: "Verdana", marginTop: 6, fontSize: 13, fontWeight: "bold" }}>
                <div style={{ paddingTop: 17, fontSize: 14 }}>{company.companyName}</div>
                <div style={{ paddingBottom: 10 }}>{company.companyAddress}</div>
                <table style={{ fontSize: 13 }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "5px 0" }}>Phone :</td>
                      <td style={{ paddingRight: 40 }}>{company.companyPhone}</td>
                      <td style={{ fontWeight: "bold" }}>Pan :</td>
                      <td>{getVal(data, "CompanyPANNo") || company.companyGSTNo}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold" }}>E-Mail :</td>
                      <td style={{ paddingRight: 40 }}>{company.companyEmail}</td>
                      <td style={{ fontWeight: "bold" }}>GST :</td>
                      <td>{company.companyGSTNo}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
            <td style={{ width: "45%", verticalAlign: "top", textAlign: "right" }}>
              <div style={{ fontWeight: "bold", fontSize: 22, marginBottom: 5 }}>INVOICE</div>
              <table style={{ width: 350, borderCollapse: "collapse", fontSize: 15, marginLeft: "auto" }}>
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
                  <div style={{ fontSize: 14, background: "#BFBFBF", textAlign: "center", fontWeight: "bold", padding: 6 }}>{label}</div>
                  <div style={{ padding: 5, minHeight: 120 }}>
                    <div style={{ fontSize: 15, fontWeight: "bold", paddingBottom: 5 }}>{getVal(data, "PartyName", "partyName")}</div>
                    <div>{getVal(data, "AddressLine1", "addressLine1")}</div>
                    <div>{getVal(data, "AddressLine2", "addressLine2")}</div>
                    <div>{getVal(data, "AddressLine3", "addressLine3")}</div>
                  </div>
                  <div style={{ padding: 5, fontSize: 10 }}>PAN : {company.companyGSTNo}<br />GST : {company.companyGSTNo}</div>
                </td>
              </React.Fragment>
            ))}
          </tr>
        </tbody>
      </table>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8, fontSize: 10 }}>
        <thead>
          <tr>{["Sales Person", "Terms", "Due Date", "Ship Via", "Ship Date", "Tracking No"].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          <tr style={{ height: 35 }}>
            <td style={td}>{getVal(data, "SalesPersons")}</td>
            <td style={td}>{getVal(data, "DueDays")}</td>
            <td style={td}>{fmtDateMMM(getVal(data, "DueDate"))}</td>
            <td style={td}>{getVal(data, "ShipVia")}</td>
            <td style={td}></td>
            <td style={td}>{getVal(data, "Tracking")}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  return (
    <div style={{ fontFamily: "Verdana, Arial, sans-serif", fontSize: 13, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        let srNo = (items || []).indexOf(pageItems[0]) + 1 || 1;
        return (
          <div key={pageIdx} className={isLastPage ? "" : "page-break"} style={{ paddingTop: 5 }}>
            {renderHeader()}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr style={{ height: 29 }}>
                  {["Sr No", "StoneID", "Lab", "CertNo", "Shp", "Col", "Cla", "Cut", "Pol", "Sym", "FL", "Cts", "Rate", "Back", "Amt"].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => (
                  <tr key={idx}>
                    <td style={td}>{srNo++}</td>
                    <td style={td}>{getVal(item, "Lotno", "lotNo")}</td>
                    <td style={td}>{getVal(item, "CertId")}</td>
                    <td style={td}>{getVal(item, "CertificateNo")}</td>
                    <td style={td}>{getVal(item, "ShapeId")}</td>
                    <td style={td}>{getVal(item, "ColorId")}</td>
                    <td style={td}>{getVal(item, "ClarityId")}</td>
                    <td style={td}>{getVal(item, "PropId")}</td>
                    <td style={td}>{getVal(item, "PolishId")}</td>
                    <td style={td}>{getVal(item, "SymId")}</td>
                    <td style={td}>{getVal(item, "FLId")}</td>
                    <td style={td}>{fmt(getVal(item, "Carats"), 2)}</td>
                    <td style={td}>{fmt(getVal(item, "Rate"), 2)}</td>
                    <td style={td}>{fmt(getVal(item, "Back"), 2)}</td>
                    <td style={td}>{fmt(getVal(item, "MasterCurrencyAmount", "Amount"), 2)}</td>
                  </tr>
                ))}
                {isLastPage && (
                  <>
                    <tr>
                      <td colSpan={11} style={{ ...td, fontWeight: "bold", fontSize: 13 }}>
                        <span style={{ float: "left" }}>Total Carats :</span>
                        <span style={{ float: "right" }}>{fmt(totals.wt, 2)}</span>
                      </td>
                      <td colSpan={2} style={td}>
                        <div><b>Amt Rs.</b></div>
                        <div><b>CGST:</b> {fmt(getVal(data, "CGSTPer"), 2)}%</div>
                        <div><b>SGST:</b> {fmt(getVal(data, "SGSTPer"), 2)}%</div>
                        <div><b>IGST:</b> {fmt(getVal(data, "IGSTPer"), 2)}%</div>
                      </td>
                      <td colSpan={2} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                        <div>{fmt(totals.amount, 2)}</div>
                        <div>{fmt(getVal(data, "CGSTAmount"), 2)}</div>
                        <div>{fmt(getVal(data, "SGSTAmount"), 2)}</div>
                        <div>{fmt(getVal(data, "IGSTAmount"), 2)}</div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={13} style={{ border: "none" }}></td>
                      <td colSpan={2} style={td}>
                        <span style={{ float: "left", fontWeight: "bold" }}>+/- Amt</span>
                        <span style={{ float: "right", fontWeight: "bold" }}>{fmt((Number(getVal(data, "PlusMinusAmount")) || 0) * (Number(getVal(data, "BaseRate")) || 0), 2)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={13} style={{ border: "none" }}></td>
                      <td colSpan={2} style={{ ...td, fontWeight: "bold", fontSize: 14, textAlign: "right" }}>{fmt(getVal(data, "FinalAmount") || totals.amount, 2)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            {isLastPage && (
              <>
                <div style={{ fontSize: 12, textAlign: "justify", margin: "13px 0" }}>{information}</div>
                <table style={{ width: "100%", marginTop: 10 }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "60%" }}>
                        <table style={{ fontSize: 13 }}>
                          <tbody>
                            <tr><td colSpan={2} style={{ fontWeight: "bold", fontSize: 15, paddingBottom: 15 }}>Payment Instruction:</td></tr>
                            <tr><td style={{ width: 200, fontWeight: "bold" }}>Bank Name :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "bnm")}</td></tr>
                            <tr><td style={{ fontWeight: "bold" }}>Account No :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "BankAccNo")}</td></tr>
                            <tr><td style={{ fontWeight: "bold" }}>ABA Routing Number :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "ABARoutingNumber")}</td></tr>
                            <tr><td style={{ fontWeight: "bold" }}>Swift Code :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "SwiftCode")}</td></tr>
                            <tr><td style={{ fontWeight: "bold" }}>ZELLE Id :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "ZelleID")}</td></tr>
                          </tbody>
                        </table>
                      </td>
                      <td style={{ width: "40%", textAlign: "right", verticalAlign: "bottom" }}>
                        <div style={{ marginTop: 60, fontWeight: "bold" }}>
                          <span style={{ fontSize: 15 }}>Signature</span>
                          <span style={{ display: "inline-block", borderBottom: "1px solid #000", width: 220, marginLeft: 15 }} />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
            <div style={{ float: "right", fontSize: 15, marginTop: 5 }}>{pageIdx + 1} / {pages.length}</div>
          </div>
        );
      })}
    </div>
  );
};

export default SaleIndiaFormat;
