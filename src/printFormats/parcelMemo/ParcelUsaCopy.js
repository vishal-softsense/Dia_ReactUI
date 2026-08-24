import React from "react";
import { fmt, getVal } from "../shared/printUtils";

const border = "1px solid #A2A1A1";
const thBg = { background: "#ccc", border, padding: 4, textAlign: "center", fontWeight: "bold" };

const ParcelUsaCopy = ({
  data,
  items,
  totals,
  company,
  logoUrl,
  copyTitle,
  startRow,
  padTo,
  showAttendee,
  isLastPage
}) => {
  const plusMinus = (Number(getVal(data, "PlusMinusAmount", "plusMinusAmount")) || 0) *
    (Number(getVal(data, "BaseRate", "baseRate")) || 0);
  const finalAmount = Number(getVal(data, "FinalAmount", "finalAmount")) || totals.masterAmount || totals.amount;
  const emptyRows = Math.max(0, padTo - items.length);

  return (
    <div style={{ fontFamily: "Verdana, Arial, sans-serif", color: "#000", fontSize: 12, marginBottom: 18 }}>
      <table style={{ width: "100%", marginBottom: 8 }}>
        <tbody>
          <tr>
            <td style={{ width: "16%", verticalAlign: "top" }}>
              {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: 110, maxHeight: 114, objectFit: "contain" }} /> : null}
            </td>
            <td style={{ width: "44%", verticalAlign: "top", fontSize: 12, letterSpacing: 1 }}>
              <div>{company.companyName}</div>
              <div style={{ margin: "3px 0" }}>{company.companyAddress}</div>
              <div>{company.companyAddress1}</div>
              <div style={{ margin: "3px 0" }}>{company.companyAddress2}</div>
              <div>{company.companyPhone}</div>
              <div>{company.companyEmail}</div>
            </td>
            <td style={{ width: "40%", verticalAlign: "top", textAlign: "right" }}>
              <div style={{ fontWeight: "bold", fontSize: 22, fontFamily: "Verdana", marginTop: 10 }}>{copyTitle}</div>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 5 }}>
                <thead>
                  <tr>
                    <th style={{ ...thBg, width: "50%" }}>Date</th>
                    <th style={{ ...thBg, width: "50%" }}>Memo #</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border, padding: 4, textAlign: "center" }}>{getVal(data, "TrnDate", "trnDate")}</td>
                    <td style={{ border, padding: 4, textAlign: "center" }}>{getVal(data, "InvNo", "invNo")}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", marginBottom: 8 }}>
        <tbody>
          <tr>
            <td style={{ width: "50%", verticalAlign: "top", paddingRight: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...thBg, background: "#BFBFBF", textAlign: "left", padding: "4px 8px" }}>Memo To</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: "2px solid #A2A1A1", padding: 8, fontSize: 12 }}>
                      <div style={{ fontWeight: "bold", fontSize: 13 }}>{getVal(data, "PartyName", "partyName")}</div>
                      <div style={{ fontSize: 10 }}>{getVal(data, "AddressLine1", "addressLine1")}</div>
                      <div style={{ fontSize: 10 }}>{getVal(data, "AddressLine2", "addressLine2")}</div>
                      <div style={{ fontSize: 10 }}>{getVal(data, "AddressLine3", "addressLine3")}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
              {showAttendee && (
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
                  <tbody>
                    <tr>
                      <th style={{ width: "50%", border: "2px solid #A2A1A1", background: "#ccc", padding: 5, textAlign: "center" }}>Attendee</th>
                      <td style={{ width: "50%", border: "2px solid #A2A1A1", padding: 5, textAlign: "center" }}>{getVal(data, "Attendee", "attendee")}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </td>
            <td style={{ width: "50%", verticalAlign: "top", paddingLeft: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...thBg, width: "50%" }}>Ship Via</th>
                    <th style={{ ...thBg, width: "50%" }}>Tracking No</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border, padding: 4, textAlign: "center" }}>{getVal(data, "ShipVia", "shipVia")}</td>
                    <td style={{ border, padding: 4, textAlign: "center" }}>{getVal(data, "Tracking", "tracking")}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, tableLayout: "fixed", fontFamily: "Verdana" }}>
        <thead>
          <tr style={{ background: "#BFBFBF" }}>
            {["Sr No", "Description", "Pcs", "Carats/Qty", "Price/Carat", "Return Cts", "Kept Cts", "Amount US $"].map((h) => (
              <th key={h} style={{ border: "1px solid #999", padding: 4, textAlign: "center" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} style={{ fontSize: 11 }}>
              <td style={{ border: "1px solid #999", textAlign: "center" }}>{startRow + idx}</td>
              <td style={{ border: "1px solid #999", textAlign: "center" }}>{getVal(item, "Description", "description", "ItemName", "itemName")}</td>
              <td style={{ border: "1px solid #999", textAlign: "center" }}>{getVal(item, "Pcs", "pcs", "Qty", "qty")}</td>
              <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>{fmt(getVal(item, "Carats", "carats", "weight"), 2)}</td>
              <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>{fmt(getVal(item, "Rate", "rate"), 2)}</td>
              <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>
                {Number(getVal(item, "ReturnCarats", "returnCarats")) > 0 ? fmt(getVal(item, "ReturnCarats", "returnCarats"), 2) : ""}
              </td>
              <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>
                {Number(getVal(item, "IssueCarats", "issueCarats")) > 0 ? fmt(getVal(item, "IssueCarats", "issueCarats"), 2) : ""}
              </td>
              <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>
                {fmt(getVal(item, "MasterCurrencyAmount", "masterCurrencyAmount", "Amount", "amount"), 2)}
              </td>
            </tr>
          ))}
          {Array.from({ length: emptyRows }).map((_, idx) => (
            <tr key={`empty-${idx}`} style={{ height: 18 }}>
              {Array.from({ length: 8 }).map((__, c) => (
                <td key={c} style={{ borderLeft: c === 0 ? "1px solid #A2A1A1" : "none", borderRight: c === 7 ? "1px solid #A2A1A1" : "none" }}>&nbsp;</td>
              ))}
            </tr>
          ))}
          {isLastPage && (
            <>
              <tr style={{ fontWeight: "bold", fontSize: 11 }}>
                <td colSpan="3" style={{ border: "1px solid #999", textAlign: "left", paddingLeft: 25 }}>Total Carats :</td>
                <td style={{ border: "1px solid #999", textAlign: "center" }}>{fmt(totals.wt, 2)}</td>
                <td colSpan="3" style={{ border: "1px solid #999", textAlign: "right", paddingRight: 15 }}>US $ :</td>
                <td style={{ border: "1px solid #999", textAlign: "right" }}>{fmt(totals.masterAmount || totals.amount, 2)}</td>
              </tr>
              <tr>
                <td colSpan="7" style={{ border: "none" }}></td>
                <td style={{ border: "1px solid #999", padding: 4 }}>
                  <span> +/- Amt</span>
                  <span style={{ fontWeight: "bold", float: "right" }}>{fmt(plusMinus, 2)}</span>
                </td>
              </tr>
              <tr style={{ fontWeight: "bold", fontSize: 11 }}>
                <td colSpan="7" style={{ border: "none" }}></td>
                <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>{fmt(finalAmount, 2)}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      <table style={{ width: "100%", marginTop: 18 }}>
        <tbody>
          <tr>
            <td style={{ width: "35%" }}></td>
            <td style={{ width: "30%", textAlign: "center", color: "#777", fontSize: 10 }}>{company.companyFooter || "Powered by SoftOnCloud"}</td>
            <td style={{ width: "35%", textAlign: "right", fontWeight: "bold", fontSize: 14 }}>Signature  ______________________</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ParcelUsaCopy;
