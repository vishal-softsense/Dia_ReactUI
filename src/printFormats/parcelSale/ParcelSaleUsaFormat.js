import React from "react";
import { fmt, fmtDateMMM, getVal, paginateVariable } from "../shared/printUtils";

const th = { background: "#BFBFBF", border: "2px solid #A2A1A1", padding: "6px 0", textAlign: "center" };
const td = { border: "2px solid #A2A1A1", padding: "0 6px", textAlign: "center", height: 24 };
const itemTh = { background: "#d9d9d9", border: "1px solid #999", padding: "6px 0", textAlign: "center" };
const itemTd = { border: "1px solid #999", padding: "0 6px", textAlign: "center", height: 24 };

const ParcelSaleUsaFormat = ({ data, items, totals, company, logoUrl }) => {
  const pages = paginateVariable(items, { single: 23, first: 34, middle: 34, last: 23 });
  const plusMinus = (Number(getVal(data, "PlusMinusAmount", "plusMinusAmount")) || 0) *
    (Number(getVal(data, "BaseRate", "baseRate")) || 0);
  const finalAmount = Number(getVal(data, "FinalAmount", "finalAmount")) || totals.amount;

  const renderHeader = () => (
    <>
      <table style={{ width: "100%", marginBottom: 10 }}>
        <tbody>
          <tr>
            <td style={{ width: "55%", verticalAlign: "top" }}>
              {logoUrl ? <img src={logoUrl} alt="Logo" style={{ height: 100, width: 110 }} /> : null}
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
                  <div style={{ fontSize: 14, background: "#BFBFBF", textAlign: "center", fontWeight: "bold", padding: 4 }}>{label}</div>
                  <div style={{ padding: "3px 5px", minHeight: 120 }}>
                    <div style={{ fontSize: 15, fontWeight: "bold", padding: "10px 0" }}>{getVal(data, "PartyName", "partyName")}</div>
                    <div>{getVal(data, "AddressLine1", "addressLine1")}</div>
                    <div>{getVal(data, "AddressLine2", "addressLine2")}</div>
                    <div>{getVal(data, "AddressLine3", "addressLine3")}</div>
                  </div>
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
                  {["Sr No", "Memo No", "ItemName", "PCS", "Carats/Qty", "Price/Carat", "Amount US $"].map((h) => (
                    <th key={h} style={itemTh}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => {
                  const pcs = Number(getVal(item, "Pcs", "pcs")) || 0;
                  return (
                    <tr key={idx}>
                      <td style={itemTd}>{srNo++}</td>
                      <td style={itemTd}>{getVal(item, "MemoNo", "memoNo")}</td>
                      <td style={itemTd}>{getVal(item, "ItemName", "itemName")}</td>
                      <td style={itemTd}>{pcs === 0 ? "-" : pcs}</td>
                      <td style={{ ...itemTd, textAlign: "right" }}>{fmt(getVal(item, "Carats"), 2)}</td>
                      <td style={{ ...itemTd, textAlign: "right" }}>{fmt(getVal(item, "Rate"), 2)}</td>
                      <td style={{ ...itemTd, textAlign: "right" }}>{fmt(getVal(item, "MasterCurrencyAmount", "Amount"), 2)}</td>
                    </tr>
                  );
                })}
                {isLastPage && (
                  <>
                    <tr>
                      <td colSpan={4} style={{ ...itemTd, fontWeight: "bold", textAlign: "left", paddingLeft: 10 }}>Total Carats :</td>
                      <td style={{ ...itemTd, fontWeight: "bold", textAlign: "right", fontSize: 14 }}>{fmt(totals.wt, 2)}</td>
                      <td style={{ ...itemTd, fontWeight: "bold", fontSize: 10 }}>US $ :</td>
                      <td style={{ ...itemTd, fontWeight: "bold", textAlign: "right", fontSize: 14 }}>{fmt(totals.amount, 2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={6} style={{ border: "1px solid #999" }}></td>
                      <td style={{ ...itemTd, padding: 5 }}>
                        <span style={{ float: "left", fontSize: 8, fontWeight: "bold" }}>+/- Amt</span>
                        <span style={{ float: "right", fontSize: 11, fontWeight: "bold" }}>{fmt(plusMinus, 2)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6} style={{ border: "1px solid #999" }}></td>
                      <td style={{ ...itemTd, fontWeight: "bold", fontSize: 13, textAlign: "right", padding: 5 }}>{fmt(finalAmount, 2)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            {isLastPage && (
              <table style={{ width: "100%", marginTop: 10 }}>
                <tbody>
                  <tr>
                    <td style={{ width: "60%" }}>
                      <table style={{ fontSize: 13, marginTop: 60 }}>
                        <tbody>
                          <tr><td colSpan={2} style={{ fontWeight: "bold", fontSize: 15, paddingBottom: 15 }}>Payment Instruction:</td></tr>
                          <tr><td style={{ width: 200, fontWeight: "bold" }}>Bank Name :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "bnm", "BankName")}</td></tr>
                          <tr><td style={{ fontWeight: "bold" }}>Account No :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "BankAccNo")}</td></tr>
                          <tr><td style={{ fontWeight: "bold" }}>ABA Routing Number :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "ABARoutingNumber")}</td></tr>
                          <tr><td style={{ fontWeight: "bold" }}>Swift Code :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "SwiftCode")}</td></tr>
                          <tr><td style={{ fontWeight: "bold" }}>ZELLE Id :</td><td style={{ paddingLeft: 40 }}>{getVal(data, "ZelleID")}</td></tr>
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
            <div style={{ float: "right", fontSize: 15, marginTop: 5 }}>{pageIdx + 1} / {pages.length}</div>
          </div>
        );
      })}
    </div>
  );
};

export default ParcelSaleUsaFormat;
