import React from "react";
import { FALLBACK_MEMO_CONDITIONS, fmt, fmtDateSlash, getVal, paginateVariable } from "../shared/printUtils";

const th = { background: "#BFBFBF", border: "1px solid #000", padding: "6px 0", textAlign: "center" };
const td = { border: "1px solid #000", padding: "0 6px", textAlign: "center", height: 24 };
const addressBox = { border: "1px solid #000", borderRadius: 12, padding: "8px 15px 12px 10px", height: 150 };

const MixMemoUsaFormat = ({ data, items, totals, company, logoUrl }) => {
  const pages = paginateVariable(items, { single: 24, first: 24, middle: 24, last: 24 });
  const conditions = company.saleConditions || company.memoConditions || FALLBACK_MEMO_CONDITIONS;
  const information = company.information || getVal(data, "Information") || "";

  return (
    <div style={{ fontFamily: "Verdana, Arial, sans-serif", fontSize: 13, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        const itemsPerPage = 24;
        let srNo = (items || []).indexOf(pageItems[0]) + 1 || 1;
        return (
          <div key={pageIdx} className={isLastPage ? "" : "page-break"}>
            <table style={{ width: "100%", marginBottom: 10 }}>
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
                    <div style={{ marginTop: 5 }}><b>Tel:</b>&nbsp;&nbsp;{company.companyPhone}</div>
                    <div style={{ marginTop: 5 }}><b>Email:</b>&nbsp;&nbsp;{company.companyEmail}</div>
                  </td>
                  <td style={{ width: "32%", verticalAlign: "top" }}>
                    <div style={{ fontWeight: "bold", fontSize: 24, paddingTop: 5 }}>GENERAL MEMO</div>
                    <table style={{ width: "100%", fontSize: 13, marginTop: 10 }}>
                      <tbody>
                        <tr><td style={{ width: "40%" }}><b>Date :</b></td><td>{fmtDateSlash(getVal(data, "TrnDate", "trnDate"))}</td></tr>
                        <tr><td style={{ padding: "5px 0" }}><b>Memo # :</b></td><td>{getVal(data, "InvNo", "invNo")}</td></tr>
                        <tr><td><b>Printed On :</b></td><td>{fmtDateSlash(getVal(data, "RoundDate", "roundDate") || new Date())}</td></tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <table style={{ width: "100%", marginTop: 10 }}>
              <tbody>
                <tr>
                  {["Consigned To:", "Ship To:"].map((legend, i) => (
                    <td key={legend} style={{ width: "50%", paddingRight: i === 0 ? 20 : 0, paddingLeft: i === 1 ? 20 : 0 }}>
                      <fieldset style={addressBox}>
                        <legend style={{ fontWeight: "bold", fontSize: 13, padding: "0 10px" }}>{legend}</legend>
                        <div style={{ fontSize: 13 }}>{getVal(data, "PartyName", "partyName")}</div>
                        <div>{getVal(data, "AddressLine1", "addressLine1")}</div>
                        <div>{getVal(data, "AddressLine2", "addressLine2")}</div>
                        <div>{getVal(data, "AddressLine3", "addressLine3")}</div>
                      </fieldset>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <div style={{ fontSize: 11, textAlign: "justify", margin: "7px 0", fontFamily: "Segoe UI" }}>{information}</div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10, fontSize: 11 }}>
              <thead>
                <tr>
                  {["CONTACT", "SALES PERSON", "CUST ORDER #", "SHIP VIA", "TRACKING #", "REPORT BY"].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={td}></td>
                  <td style={td}>{getVal(data, "SalesPersons", "salesPersons")}</td>
                  <td style={td}></td>
                  <td style={td}>{getVal(data, "ShipVia", "shipVia")}</td>
                  <td style={td}>{getVal(data, "Tracking", "tracking")}</td>
                  <td style={td}></td>
                </tr>
              </tbody>
            </table>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ fontSize: 12 }}>
                  {["Sr No", "Stock #", "QTY", "WT.", "DESCRIPTION", "Price/Carat", "Amount US $"].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => (
                  <tr key={idx} style={{ fontSize: 11 }}>
                    <td style={td}>{srNo++}</td>
                    <td style={{ ...td, textAlign: "left", paddingLeft: 15 }}>{getVal(item, "Lotno", "lotNo")}</td>
                    <td style={{ ...td, textAlign: "right" }}>{getVal(item, "Pcs", "pcs")}</td>
                    <td style={{ ...td, textAlign: "right" }}>{fmt(getVal(item, "Carats", "carats"), 2)}</td>
                    <td style={{ ...td, textAlign: "left" }}>{getVal(item, "ItemName", "itemName")}</td>
                    <td style={{ ...td, textAlign: "right" }}>{fmt(getVal(item, "Rate", "rate"), 2)}</td>
                    <td style={{ ...td, textAlign: "right" }}>{fmt(getVal(item, "MasterCurrencyAmount", "Amount", "amount"), 2)}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, itemsPerPage - pageItems.length) }).map((_, i) => (
                  <tr key={`e-${i}`} style={{ height: 24 }}>
                    {Array.from({ length: 7 }).map((__, c) => (
                      <td key={c} style={{ borderLeft: "1px solid #000", borderRight: "1px solid #000" }}>&nbsp;</td>
                    ))}
                  </tr>
                ))}
                {isLastPage && (
                  <tr style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000" }}>
                    <td style={td}></td>
                    <td style={td}></td>
                    <td style={{ ...td, textAlign: "right" }}>{totals.qty}</td>
                    <td style={{ ...td, textAlign: "right" }}>{fmt(totals.wt, 2)}</td>
                    <td style={td}></td>
                    <td style={{ ...td, textAlign: "right", fontSize: 12, lineHeight: 1.8 }}>
                      Sub Total<br />Charges<br />Discount<br /><b style={{ fontSize: 15 }}>TOTAL</b>
                    </td>
                    <td style={{ ...td, textAlign: "right", lineHeight: 1.8 }}>
                      {fmt(totals.amount, 2)}<br /><br /><br />{fmt(totals.amount, 2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ marginTop: 15 }}>
              <span style={{ fontSize: 13 }}>Signature:</span>
              <span style={{ display: "inline-block", borderBottom: "1px solid #000", width: 300, marginLeft: 10 }} />
            </div>
            <div style={{ fontSize: 11, textAlign: "justify", margin: "10px 0", fontFamily: "Segoe UI" }}>{conditions}</div>
            <table style={{ width: "100%" }}>
              <tbody>
                <tr>
                  <td style={{ width: "50%" }}>{company.companyFooter}</td>
                  <td style={{ width: "50%", textAlign: "right" }}>{pageIdx + 1}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default MixMemoUsaFormat;
