import React from "react";
import { FALLBACK_MEMO_CONDITIONS, fmt, fmtDate, getVal, paginateFixed, paginateStella } from "../shared/printUtils";

const ClassicFormat = ({ data, items, totals, company, logoUrl }) => {
  const isSinglePageLayout = items.length >= 11;
  const pages = isSinglePageLayout ? paginateStella(items, 40, 35) : paginateFixed(items, 10);

  const cell = { border: "1px solid #000", padding: "5px 6px" };
  const th = { ...cell, background: "#c0c0c0", textAlign: "center", fontWeight: "bold" };

  return (
    <div className="classic-print-container" style={{ fontFamily: "Verdana, Arial, sans-serif", fontSize: 12, color: "#000" }}>
      {pages.map((currentItems, pageIdx) => {
        const startRowNo = (items || []).indexOf(currentItems[0]) + 1 || 1;
        const isLastPage = pageIdx === pages.length - 1;

        return (
          <div
            key={pageIdx}
            className={isLastPage ? "" : "page-break"}
            style={{
              background: "#fff",
              padding: 16,
              border: "1px solid #dee2e6",
              borderRadius: 8,
              width: "100%",
              maxWidth: 900,
              margin: "0 auto 30px auto"
            }}
          >
            {pageIdx === 0 && (
              <table style={{ width: "100%", marginBottom: 14, tableLayout: "fixed" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "12%", verticalAlign: "top" }}>
                      {logoUrl ? <img src={logoUrl} alt="logo" style={{ width: 80, maxWidth: "100%" }} /> : null}
                    </td>
                    <td style={{ width: "53%", verticalAlign: "top", fontSize: 11, paddingLeft: 8 }}>
                      <div style={{ fontWeight: "bold", fontSize: 13 }}>{company.companyName}</div>
                      <div style={{ marginTop: 3, lineHeight: 1.4 }}>{company.companyAddress}</div>
                      <div style={{ lineHeight: 1.4 }}>{company.companyAddress1}</div>
                      <div style={{ lineHeight: 1.4 }}>{company.companyAddress2}</div>
                      <div style={{ marginTop: 6 }}>
                        <b>Tel:</b>&nbsp;{company.companyPhone}
                      </div>
                      <div>
                        <b>Email:</b>&nbsp;{company.companyEmail}
                      </div>
                    </td>
                    <td style={{ width: "35%", verticalAlign: "top" }}>
                      <div style={{ fontWeight: "bold", fontSize: 20 }}>MEMO OUT</div>
                      <table style={{ width: "100%", fontSize: 12, marginTop: 8 }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: "4px 0" }}>
                              <b>Date :</b>
                            </td>
                            <td style={{ textAlign: "right" }}>{fmtDate(getVal(data, "TrnDate", "trnDate"))}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: "4px 0" }}>
                              <b>Memo #</b>
                            </td>
                            <td style={{ textAlign: "right" }}>{getVal(data, "InvNo", "invNo")}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {pageIdx === 0 && (
              <div
                style={{
                  border: "1px solid #000",
                  borderRadius: 10,
                  padding: "10px 12px",
                  width: "48%",
                  minWidth: 220,
                  maxWidth: 400,
                  marginBottom: 14
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: 6 }}>Memo To:</div>
                <div style={{ fontSize: 13, marginBottom: 2 }}>{getVal(data, "PartyName", "partyName")}</div>
                <div style={{ lineHeight: 1.45, fontSize: 11 }}>{getVal(data, "AddressLine1", "addressLine1")}</div>
                <div style={{ lineHeight: 1.45, fontSize: 11 }}>{getVal(data, "AddressLine2", "addressLine2")}</div>
                <div style={{ lineHeight: 1.45, fontSize: 11 }}>{getVal(data, "AddressLine3", "addressLine3")}</div>
              </div>
            )}

            {pageIdx === 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    {["BILL NO", "TERMS"].map((h) => (
                      <th key={h} style={{ ...th, width: "50%" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ ...cell, textAlign: "center" }}>{getVal(data, "BillNo", "billNo")}</td>
                    <td style={{ ...cell, textAlign: "center" }}>{getVal(data, "DueDays", "dueDays")}</td>
                  </tr>
                </tbody>
              </table>
            )}

            {pageIdx === 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    {["SHIP VIA", "TRACKING NO"].map((h) => (
                      <th key={h} style={{ ...th, width: "50%" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ ...cell, textAlign: "center" }}>{getVal(data, "ShipVia", "shipVia")}</td>
                    <td style={{ ...cell, textAlign: "center" }}>{getVal(data, "Tracking", "tracking")}</td>
                  </tr>
                </tbody>
              </table>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 11 }}>
              <colgroup>
                <col style={{ width: "7%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "18%" }} />
              </colgroup>
              <thead>
                <tr>
                  {["Sr No", "Stock #", "DESCRIPTION", "QTY", "WT.", "Price/Carat", "Amount US $"].map((h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((it, idx) => (
                  <tr key={idx}>
                    <td style={{ ...cell, textAlign: "center" }}>{startRowNo + idx}</td>
                    <td style={{ ...cell, wordBreak: "break-word" }}>{getVal(it, "Lotno", "lotNo", "stockNo")}</td>
                    <td style={{ ...cell, wordBreak: "break-word" }}>{getVal(it, "ItemName", "itemName", "description")}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{getVal(it, "Pcs", "pcs", "Qty", "qty")}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{fmt(getVal(it, "Carats", "carats", "weight"))}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{fmt(getVal(it, "Rate", "rate"))}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{fmt(getVal(it, "Amount", "amount"))}</td>
                  </tr>
                ))}
                {isLastPage && (
                  <tr style={{ fontWeight: "bold" }}>
                    <td style={cell} colSpan={3} />
                    <td style={{ ...cell, textAlign: "right" }}>{totals.qty}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{fmt(totals.wt)}</td>
                    <td style={{ ...cell, lineHeight: 1.6 }}>
                      <div>Sub Total</div>
                      <div style={{ marginTop: 4 }}>TOTAL</div>
                    </td>
                    <td style={{ ...cell, textAlign: "right", lineHeight: 1.6 }}>
                      <div>{fmt(totals.amount)}</div>
                      <div style={{ marginTop: 4 }}>{fmt(totals.amount)}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {isLastPage && (
              <>
                <div style={{ marginTop: 20 }}>
                  <span>Signature:</span>
                  <span
                    style={{
                      display: "inline-block",
                      borderBottom: "1px solid #000",
                      width: 260,
                      marginLeft: 8
                    }}
                  />
                </div>
                <div style={{ fontSize: 9.5, marginTop: 12, whiteSpace: "pre-line", border: "1px solid #ddd", padding: 8, borderRadius: 6 }}>
                  {company.memoConditions || FALLBACK_MEMO_CONDITIONS}
                </div>
              </>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 18,
                fontSize: 11,
                gap: 12
              }}
            >
              <span>{company.companyFooter || "Powered by SoftOnCloud"}</span>
              <span>{pageIdx + 1}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClassicFormat;
