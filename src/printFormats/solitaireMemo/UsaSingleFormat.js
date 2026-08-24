import React from "react";
import { FALLBACK_MEMO_CONDITIONS, fmt, fmtDateSlash, getVal } from "../shared/printUtils";

const UsaSingleFormat = ({ data, items, totals, company, logoUrl }) => {
  const itemsPerPage = 25;
  const lastPageItems = 21;
  const totalItems = items.length;

  let fullPages = Math.floor((totalItems - lastPageItems) / itemsPerPage);
  if (fullPages < 0) fullPages = 0;

  let itemsInLastPage = totalItems - (fullPages * itemsPerPage);
  if (itemsInLastPage > lastPageItems) {
    fullPages++;
    itemsInLastPage = totalItems - (fullPages * itemsPerPage);
  }

  const totalPages = fullPages + 1;
  const cellStyle = { border: "1px solid #000", padding: "4px 6px" };
  const thStyle = { ...cellStyle, background: "#BFBFBF", textAlign: "center", fontWeight: "bold" };

  return (
    <div className="usa-single-print-container" style={{ color: "#000", fontFamily: "Verdana, Arial, sans-serif" }}>
      {Array.from({ length: totalPages }).map((_, pageIdx) => {
        const isLastPage = pageIdx === totalPages - 1;
        const thisPageSize = isLastPage ? itemsInLastPage : itemsPerPage;
        const skip = pageIdx * itemsPerPage;
        const pageItems = items.slice(skip, skip + thisPageSize);
        let rowNo = skip + 1;

        const expectedCount = isLastPage ? lastPageItems : itemsPerPage;
        const emptyRowsCount = expectedCount - pageItems.length;

        return (
          <div
            key={pageIdx}
            className={isLastPage ? "" : "page-break"}
            style={{ width: "100%", paddingTop: 5, marginBottom: 25 }}
          >
            <table style={{ width: "100%", paddingBottom: 10 }}>
              <tbody>
                <tr>
                  <td style={{ width: "13%", verticalAlign: "top" }}>
                    {logoUrl && <img src={logoUrl} alt="Logo" style={{ width: 90, objectFit: "contain" }} />}
                  </td>
                  <td style={{ width: "55%", verticalAlign: "top", fontSize: 12 }}>
                    <div style={{ fontWeight: "bold", fontSize: 14 }}>{company.companyName}</div>
                    <div style={{ marginTop: 3 }}>{company.companyAddress}</div>
                    <div>{company.companyAddress1}</div>
                    <div>{company.companyAddress2}</div>
                    <div style={{ marginTop: 5 }}><b>Tel:</b> {company.companyPhone}</div>
                    <div style={{ marginTop: 5 }}><b>Email:</b> {company.companyEmail}</div>
                  </td>
                  <td style={{ width: "32%", verticalAlign: "top" }}>
                    <div style={{ fontWeight: "bold", fontSize: 24, paddingTop: 5 }}>MEMORANDUM</div>
                    <table style={{ width: "100%", fontSize: 13, marginTop: 10 }}>
                      <tbody>
                        <tr>
                          <td style={{ width: "40%" }}><b>Date :</b></td>
                          <td style={{ width: "5%" }}></td>
                          <td>{fmtDateSlash(getVal(data, "TrnDate", "trnDate"))}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "5px 0" }}><b>Memo # :</b></td>
                          <td style={{ width: "5%" }}></td>
                          <td>{getVal(data, "InvNo", "invNo")}</td>
                        </tr>
                        <tr>
                          <td><b>Printed On :</b></td>
                          <td style={{ width: "5%" }}></td>
                          <td>{fmtDateSlash(getVal(data, "RoundDate", "roundDate") || new Date())}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <table style={{ width: "100%", marginTop: 10 }}>
              <tbody>
                <tr>
                  <td style={{ width: "50%", paddingRight: 20 }}>
                    <fieldset style={{ border: "1px solid #000", borderRadius: 12, padding: "8px 15px 12px 10px", height: 130 }}>
                      <legend style={{ fontWeight: "bold", fontSize: 13, padding: "0 10px", width: "auto", border: "none" }}>Consigned To:</legend>
                      <div style={{ fontSize: 13, fontWeight: "bold" }}>{getVal(data, "PartyName", "partyName")}</div>
                      <div style={{ fontSize: 11, marginTop: 3 }}>{getVal(data, "AddressLine1", "addressLine1")}</div>
                      <div style={{ fontSize: 11 }}>{getVal(data, "AddressLine2", "addressLine2")}</div>
                      <div style={{ fontSize: 11 }}>{getVal(data, "AddressLine3", "addressLine3")}</div>
                    </fieldset>
                  </td>
                  <td style={{ width: "50%", paddingLeft: 20 }}>
                    <fieldset style={{ border: "1px solid #000", borderRadius: 12, padding: "8px 15px 12px 10px", height: 130 }}>
                      <legend style={{ fontWeight: "bold", fontSize: 13, padding: "0 10px", width: "auto", border: "none" }}>Ship To:</legend>
                      <div style={{ fontSize: 13, fontWeight: "bold" }}>{getVal(data, "PartyName", "partyName")}</div>
                      <div style={{ fontSize: 11, marginTop: 3 }}>{getVal(data, "AddressLine1", "addressLine1")}</div>
                      <div style={{ fontSize: 11 }}>{getVal(data, "AddressLine2", "addressLine2")}</div>
                      <div style={{ fontSize: 11 }}>{getVal(data, "AddressLine3", "addressLine3")}</div>
                    </fieldset>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontSize: 11, textAlign: "justify", height: 60, margin: "13px 0", fontStyle: "italic" }}>
              {company.information || getVal(data, "Information", "information") || "Diamonds/goods described herein are delivered to you for examination and inspection only..."}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10, fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#BFBFBF", fontWeight: "bold" }}>
                  <th style={{ border: "1px solid #000", padding: 6 }}>CONTACT</th>
                  <th style={{ border: "1px solid #000", padding: 6 }}>SALES PERSON</th>
                  <th style={{ border: "1px solid #000", padding: 6 }}>CUST ORDER #</th>
                  <th style={{ border: "1px solid #000", padding: 6 }}>SHIP VIA</th>
                  <th style={{ border: "1px solid #000", padding: 6 }}>TRACKING #</th>
                  <th style={{ border: "1px solid #000", padding: 6 }}>REPORT BY</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ textAlign: "center" }}>
                  <td style={{ border: "1px solid #000", padding: 6 }}></td>
                  <td style={{ border: "1px solid #000", padding: 6 }}>{getVal(data, "SalesPersons", "salesPersons")}</td>
                  <td style={{ border: "1px solid #000", padding: 6 }}></td>
                  <td style={{ border: "1px solid #000", padding: 6 }}>{getVal(data, "ShipVia", "shipVia")}</td>
                  <td style={{ border: "1px solid #000", padding: 6 }}>{getVal(data, "Tracking", "tracking")}</td>
                  <td style={{ border: "1px solid #000", padding: 6 }}></td>
                </tr>
              </tbody>
            </table>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ fontSize: 12 }}>
                  <th style={thStyle}>Sr No</th>
                  <th style={thStyle}>Stock #</th>
                  <th style={thStyle}>QTY</th>
                  <th style={thStyle}>WT.</th>
                  <th style={thStyle}>DESCRIPTION</th>
                  <th style={thStyle}>Price/Carat</th>
                  <th style={thStyle}>Amount US $</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => {
                  const currentSr = rowNo++;
                  return (
                    <tr key={idx} style={{ fontSize: 11, textAlign: "center" }}>
                      <td style={cellStyle}>{currentSr}</td>
                      <td style={{ ...cellStyle, textAlign: "left" }}>{getVal(item, "Lotno", "lotNo", "stockNo")}</td>
                      <td style={{ ...cellStyle, textAlign: "right" }}>{getVal(item, "Pcs", "pcs", "Qty", "qty")}</td>
                      <td style={{ ...cellStyle, textAlign: "right" }}>{fmt(getVal(item, "Carats", "carats", "weight"), 2)}</td>
                      <td style={{ ...cellStyle, textAlign: "left" }}>{getVal(item, "ItemName", "itemName", "description")}</td>
                      <td style={{ ...cellStyle, textAlign: "right" }}>{fmt(getVal(item, "Rate", "rate"), 2)}</td>
                      <td style={{ ...cellStyle, textAlign: "right" }}>{fmt(getVal(item, "Amount", "amount"), 2)}</td>
                    </tr>
                  );
                })}

                {Array.from({ length: emptyRowsCount }).map((_, idx) => (
                  <tr key={`empty-${idx}`} style={{ height: 24 }}>
                    <td style={{ borderLeft: "1px solid #000", borderRight: "1px solid #000" }}>&nbsp;</td>
                    <td style={{ borderRight: "1px solid #000" }}>&nbsp;</td>
                    <td style={{ borderRight: "1px solid #000" }}>&nbsp;</td>
                    <td style={{ borderRight: "1px solid #000" }}>&nbsp;</td>
                    <td style={{ borderRight: "1px solid #000" }}>&nbsp;</td>
                    <td style={{ borderRight: "1px solid #000" }}>&nbsp;</td>
                    <td style={{ borderRight: "1px solid #000" }}>&nbsp;</td>
                  </tr>
                ))}

                {!isLastPage && (
                  <tr>
                    <td colSpan="7" style={{ borderTop: "1px solid #000" }}></td>
                  </tr>
                )}

                {isLastPage && (
                  <tr style={{ border: "1px solid #000", fontWeight: "bold" }}>
                    <td style={cellStyle}></td>
                    <td style={cellStyle}></td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>{totals.qty}</td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>{fmt(totals.wt, 2)}</td>
                    <td style={cellStyle}></td>
                    <td style={{ ...cellStyle, paddingLeft: 10, fontSize: 12, lineHeight: 1.8, textAlign: "left" }}>
                      Sub Total<br />
                      Charges<br />
                      Discount<br />
                      <b style={{ fontSize: 14 }}>TOTAL</b>
                    </td>
                    <td style={{ ...cellStyle, textAlign: "right", fontSize: 12, lineHeight: 1.8 }}>
                      {fmt(totals.amount, 2)}<br />
                      0.00<br />
                      0.00<br />
                      {fmt(totals.amount, 2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {isLastPage && (
              <div style={{ marginTop: 12 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: "bold" }}>Signature:</span>
                  <span style={{ display: "inline-block", borderBottom: "1px solid #000", width: 280, marginLeft: 8 }} />
                </div>
                <div style={{ fontSize: 9.5, marginTop: 10, textAlign: "justify", whiteSpace: "pre-line", border: "1px solid #ddd", padding: 8, borderRadius: 6 }}>
                  {company.memoConditions || FALLBACK_MEMO_CONDITIONS}
                </div>
              </div>
            )}

            <div style={{ borderTop: "1px solid #ccc", marginTop: 20, paddingTop: 6, fontSize: 11, display: "flex", justifyContent: "space-between" }}>
              <span>{company.companyFooter || "Powered by SoftOnCloud"}</span>
              <span>{pageIdx + 1}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UsaSingleFormat;
