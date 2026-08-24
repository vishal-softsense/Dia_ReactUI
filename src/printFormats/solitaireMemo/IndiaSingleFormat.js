import React from "react";
import { FALLBACK_MEMO_CONDITIONS, fmt, fmtDate, getVal } from "../shared/printUtils";

const IndiaSingleFormat = ({ data, items, totals, company, logoUrl }) => {
  const singlePageItems = 26;
  const firstPageItems = 39;
  const middlePageItems = 42;
  const lastPageItems = 35;
  const totalItems = items.length;

  let pages = [];
  if (totalItems <= singlePageItems) {
    pages.push(items);
  } else {
    pages.push(items.slice(0, firstPageItems));
    let currentIdx = firstPageItems;
    while (currentIdx < totalItems) {
      const remaining = totalItems - currentIdx;
      if (remaining <= lastPageItems) {
        pages.push(items.slice(currentIdx));
        break;
      }
      pages.push(items.slice(currentIdx, currentIdx + middlePageItems));
      currentIdx += middlePageItems;
    }
  }

  let globalSrNo = 1;

  return (
    <div className="india-single-print-container" style={{ color: "#000", fontFamily: '"Segoe UI", Arial, sans-serif' }}>
      {pages.map((pageItems, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === pages.length - 1;

        return (
          <div
            key={pageIdx}
            className={isLastPage ? "" : "page-break"}
            style={{ width: "100%", paddingTop: 5, marginBottom: 30 }}
          >
            {isFirstPage && (
              <div style={{ border: "2px solid #585858", position: "relative", paddingTop: 22, overflow: "visible", padding: "10px 15px" }}>
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#fff", padding: "0 5px", fontSize: 18, fontWeight: "bold" }}>
                  શ્રી૧<span style={{ fontSize: 18, position: "relative", top: -2 }}>।</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "20%", padding: "0 10px 10px 10px", verticalAlign: "middle" }}>
                        {logoUrl ? <img src={logoUrl} alt="Logo" style={{ height: 90, width: 110, objectFit: "contain" }} /> : null}
                      </td>
                      <td style={{ width: "57%", textAlign: "center", padding: "0 0 10px 0" }}>
                        <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: "0.9px" }}>{company.companyName}</div>
                        <div style={{ fontSize: 11, fontWeight: "bold", paddingTop: 3 }}>TRUST AND QUALITY IS OUR IDENTITY</div>
                        <div style={{ fontSize: 11, fontWeight: "bold", paddingTop: 3 }}>{company.companyAddress}</div>
                        <div style={{ fontSize: 11, fontWeight: "bold", paddingTop: 12 }}>
                          Ph : {company.companyPhone}
                          <span style={{ marginLeft: 30 }}>Email : {company.companyEmail}</span>
                        </div>
                      </td>
                      <td style={{ width: "23%", fontSize: 11, verticalAlign: "top", textAlign: "right" }}>
                        <table style={{ width: "100%", fontSize: 11 }}>
                          <tbody>
                            <tr>
                              <td style={{ textAlign: "left" }}>GST No :</td>
                              <td style={{ paddingLeft: 10, fontWeight: "bold", textAlign: "right" }}>{company.companyGSTNo}</td>
                            </tr>
                            <tr>
                              <td style={{ textAlign: "left" }}>HSN CODE :</td>
                              <td style={{ paddingLeft: 10, fontWeight: "bold", textAlign: "right" }}>{company.companyHSNCode}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3" style={{ borderTop: "2px solid #585858", textAlign: "center", fontWeight: "bold", fontSize: 24, paddingTop: 4, lineHeight: 1.2 }}>
                        MEMO OUT
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ border: "2px solid #585858", borderBottom: "none", padding: "12px 15px", marginTop: isFirstPage ? 10 : 5 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <tbody>
                  <tr>
                    <td style={{ width: "10%", fontWeight: "bold", padding: "4px 0" }}>M/S</td>
                    <td style={{ width: "2%" }}>:</td>
                    <td style={{ width: "48%" }}>{getVal(data, "PartyName", "partyName")}</td>
                    <td style={{ width: "12%", fontWeight: "bold", paddingLeft: 20 }}>Issue Date</td>
                    <td style={{ width: "2%" }}>:</td>
                    <td style={{ width: "26%" }}>{fmtDate(getVal(data, "TrnDate", "trnDate"))}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "bold", padding: "4px 0" }}>GST No</td>
                    <td>:</td>
                    <td>{company.companyGSTNo}</td>
                    <td style={{ fontWeight: "bold", paddingLeft: 20 }}>No</td>
                    <td>:</td>
                    <td>{getVal(data, "InvNo", "invNo")}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "bold", padding: "4px 0" }}>Broker</td>
                    <td>:</td>
                    <td>{getVal(data, "BrokerName", "brokerName") || "DIRECT"}</td>
                    <td colSpan="3"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ border: "2px solid #585858", marginTop: 0, padding: 0, width: "100%" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ fontSize: 11, background: "#f2f2f2", borderBottom: "2px solid #585858" }}>
                    <th style={{ borderRight: "1px solid #585858", padding: "6px 4px", textAlign: "center" }}>No</th>
                    <th style={{ borderRight: "1px solid #585858", padding: "6px 4px", textAlign: "center" }}>Stone Id</th>
                    <th style={{ borderRight: "1px solid #585858", padding: "6px 4px", textAlign: "center" }}>Shp</th>
                    <th style={{ borderRight: "1px solid #585858", padding: "6px 4px", textAlign: "right" }}>Cts</th>
                    <th style={{ borderRight: "1px solid #585858", padding: "6px 4px", textAlign: "center" }}>Col</th>
                    <th style={{ borderRight: "1px solid #585858", padding: "6px 4px", textAlign: "center" }}>Cla</th>
                    <th style={{ borderRight: "1px solid #585858", padding: "6px 4px", textAlign: "center" }}>Cu</th>
                    <th style={{ borderRight: "1px solid #585858", padding: "6px 4px", textAlign: "center" }}>Po</th>
                    <th style={{ borderRight: "1px solid #585858", padding: "6px 4px", textAlign: "center" }}>Sy</th>
                    <th style={{ borderRight: "1px solid #585858", padding: "6px 4px", textAlign: "center" }}>Fl</th>
                    <th style={{ borderRight: "1px solid #585858", padding: "6px 4px", textAlign: "center" }}>Lab</th>
                    <th style={{ borderRight: "1px solid #585858", padding: "6px 4px", textAlign: "right" }}>Rate</th>
                    <th style={{ borderRight: "1px solid #585858", padding: "6px 4px", textAlign: "center" }}>Certi No</th>
                    <th style={{ borderRight: "1px solid #585858", padding: "6px 4px", textAlign: "right" }}>Disc</th>
                    <th style={{ padding: "6px 4px", textAlign: "right" }}>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, idx) => {
                    const rowNo = globalSrNo++;
                    return (
                      <tr key={idx} style={{ fontSize: 11, borderBottom: "1px solid #e0e0e0" }}>
                        <td style={{ borderRight: "1px solid #585858", padding: "5px 4px", textAlign: "center" }}>{rowNo}</td>
                        <td style={{ borderRight: "1px solid #585858", padding: "5px 4px", textAlign: "center", fontWeight: "bold" }}>{getVal(item, "Lotno", "lotNo", "stockNo")}</td>
                        <td style={{ borderRight: "1px solid #585858", padding: "5px 4px", textAlign: "center" }}>{getVal(item, "ShapeId", "shapeId", "shape")}</td>
                        <td style={{ borderRight: "1px solid #585858", padding: "5px 4px", textAlign: "right" }}>{fmt(getVal(item, "Carats", "carats", "weight"), 2)}</td>
                        <td style={{ borderRight: "1px solid #585858", padding: "5px 4px", textAlign: "center" }}>{getVal(item, "ColorId", "colorId", "color")}</td>
                        <td style={{ borderRight: "1px solid #585858", padding: "5px 4px", textAlign: "center" }}>{getVal(item, "ClarityId", "clarityId", "clarity")}</td>
                        <td style={{ borderRight: "1px solid #585858", padding: "5px 4px", textAlign: "center" }}>{getVal(item, "PropId", "propId", "cut")}</td>
                        <td style={{ borderRight: "1px solid #585858", padding: "5px 4px", textAlign: "center" }}>{getVal(item, "PolishId", "polishId", "polish")}</td>
                        <td style={{ borderRight: "1px solid #585858", padding: "5px 4px", textAlign: "center" }}>{getVal(item, "SymId", "symId", "symmetry")}</td>
                        <td style={{ borderRight: "1px solid #585858", padding: "5px 4px", textAlign: "center" }}>{getVal(item, "FLId", "flId", "fl")}</td>
                        <td style={{ borderRight: "1px solid #585858", padding: "5px 4px", textAlign: "center" }}>{getVal(item, "CertId", "certId", "lab")}</td>
                        <td style={{ borderRight: "1px solid #585858", padding: "5px 4px", textAlign: "right" }}>{fmt(getVal(item, "Rate", "rate"), 2)}</td>
                        <td style={{ borderRight: "1px solid #585858", padding: "5px 4px", textAlign: "center" }}>{getVal(item, "CertificateNo", "certificateNo")}</td>
                        <td style={{ borderRight: "1px solid #585858", padding: "5px 4px", textAlign: "right" }}>{fmt(getVal(item, "Back", "back", "discount"), 2)}</td>
                        <td style={{ padding: "5px 4px", textAlign: "right", fontWeight: "bold" }}>{fmt(getVal(item, "Amount", "amount"), 2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {isLastPage && (
              <div style={{ marginTop: 10 }}>
                <table style={{ width: "100%", border: "2px solid #585858", borderCollapse: "collapse", fontSize: 14, fontWeight: "bold" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "80px", borderRight: "2px solid #585858", padding: "4px 5px", textAlign: "center" }}>Total :</td>
                      <td></td>
                      <td></td>
                      <td style={{ width: "80px", padding: "4px 5px", paddingLeft: "60px" }}>{fmt(totals.wt, 2)}</td>
                      <td style={{ textAlign: "right", padding: "4px 5px", paddingRight: "15px" }}>{fmt(totals.amount, 2)}</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 10 }}>
                  <div style={{ border: "2px solid #585858", marginTop: 5 }}>
                    <div style={{ height: 50, lineHeight: "50px", paddingLeft: 17 }}>
                      <strong style={{ fontSize: 11, borderBottom: "1px solid #585858" }}>ACKNOWLEDGEMENT OF ENTRUSTMENT</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, textAlign: "justify", marginTop: 15, lineHeight: 1.4, wordSpacing: 5 }}>
                    {company.memoConditions || FALLBACK_MEMO_CONDITIONS}
                  </div>

                  <table style={{ width: "100%", marginTop: 80, borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td style={{ width: "50%", textAlign: "left" }}>
                          <div style={{ width: 200 }}>
                            <div style={{ borderTop: "2px solid #585858" }}></div>
                            <div style={{ fontSize: 12, marginTop: 4, textAlign: "center", fontWeight: "bold" }}>Receiver's Sign</div>
                          </div>
                        </td>
                        <td style={{ width: "50%", textAlign: "right" }}>
                          <div style={{ width: 200, marginLeft: "auto" }}>
                            <div style={{ borderTop: "2px solid #585858" }}></div>
                            <div style={{ fontSize: 12, marginTop: 4, textAlign: "center", fontWeight: "bold" }}>{company.companyName}</div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default IndiaSingleFormat;
