import React from "react";
import { FALLBACK_MEMO_CONDITIONS, fmt, fmtDate, getVal } from "../shared/printUtils";

const IndiaDualFormat = ({ data, items, totals, company, logoUrl }) => {
  const pageSize = 30;
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const renderSingleCopy = (currentItems, startRowNumber, isLastPage) => {
    let rowNo = startRowNumber;
    return (
      <div style={{
        border: "1px solid #4c4c4c",
        height: "100%",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: "#fff",
        fontSize: 9
      }}>
        <div style={{
          position: "absolute",
          top: -7,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#fff",
          padding: "0 5px",
          fontSize: 11,
          fontWeight: "bold"
        }}>
          શ્રી૧<span style={{ fontSize: 11, position: "relative", top: -2 }}>।</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", border: "none", fontSize: 8.5 }}>
          <tbody>
            <tr>
              <td style={{ width: "32%", verticalAlign: "bottom", lineHeight: 1.6 }}>
                <div><b>Rapnet Id:</b> {company.rapUsername}</div>
                <div><b>Skype Id:</b> {company.companySkype}</div>
                <div><b>Email:</b> {company.companyEmail}</div>
              </td>
              <td style={{ width: "36%", textAlign: "center", verticalAlign: "top" }}>
                <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4 }}>{company.companyName}</div>
                {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: 45, width: 70, objectFit: "contain" }} />}
              </td>
              <td style={{ width: "32%", verticalAlign: "top", lineHeight: 1.5, textAlign: "right" }}>
                <div><b>Add:</b> {company.companyAddress}</div>
                <div><b>Ph:</b> {company.companyPhone}</div>
                <div><b>GST No:</b> {company.companyGSTNo}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "6px 4px", marginTop: 6 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5, lineHeight: 1.8 }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: "bold", width: "12%" }}>M/S :</td>
                <td style={{ width: "48%" }}>{getVal(data, "PartyName", "partyName")}</td>
                <td style={{ fontWeight: "bold", width: "18%" }}>Issue Date :</td>
                <td style={{ width: "22%" }}>{fmtDate(getVal(data, "TrnDate", "trnDate"))}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold" }}>Broker :</td>
                <td>{getVal(data, "BrokerName", "brokerName") || "DIRECT"}</td>
                <td style={{ fontWeight: "bold" }}>No :</td>
                <td>{getVal(data, "InvNo", "invNo")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ flexGrow: 1, marginTop: 6, minHeight: 320 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e0e0e0", fontSize: 8.5 }}>
                {["No", "Stone Id", "Shp", "Cts", "Col", "Cla", "Cu", "Po", "Sym", "FL", "Lab", "Rate", "Certi No", "Disc", "Amt"].map((h) => (
                  <th key={h} style={{ border: "1px solid #000", padding: "4px 2px", textAlign: "center" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, idx) => {
                const currentNo = rowNo++;
                return (
                  <tr key={idx} style={{ fontSize: 8 }}>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "center" }}>{currentNo}</td>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "center", fontWeight: "bold" }}>{getVal(item, "Lotno", "lotNo", "stockNo")}</td>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "center" }}>{getVal(item, "ShapeId", "shapeId", "shape")}</td>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "right" }}>{fmt(getVal(item, "Carats", "carats", "weight"), 2)}</td>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "center" }}>{getVal(item, "ColorId", "colorId", "color")}</td>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "center" }}>{getVal(item, "ClarityId", "clarityId", "clarity")}</td>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "center" }}>{getVal(item, "PropId", "propId", "cut")}</td>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "center" }}>{getVal(item, "PolishId", "polishId", "polish")}</td>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "center" }}>{getVal(item, "SymId", "symId", "symmetry")}</td>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "center" }}>{getVal(item, "FLId", "flId", "fl")}</td>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "center" }}>{getVal(item, "CertId", "certId", "lab")}</td>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "right" }}>{fmt(getVal(item, "Rate", "rate"), 2)}</td>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "center" }}>{getVal(item, "CertificateNo", "certificateNo")}</td>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "right" }}>{fmt(getVal(item, "Back", "back", "discount"), 2)}</td>
                    <td style={{ border: "1px solid #000", padding: "3px 2px", textAlign: "right", fontWeight: "bold" }}>{fmt(getVal(item, "Amount", "amount"), 2)}</td>
                  </tr>
                );
              })}

              {isLastPage && (
                <tr style={{ fontWeight: "bold", background: "#f5f5f5" }}>
                  <td colSpan="2" style={{ border: "1px solid #000", padding: "5px", fontSize: 9.5 }}>Total:</td>
                  <td colSpan="2" style={{ border: "1px solid #000", padding: "5px", textAlign: "right", fontSize: 9.5 }}>{fmt(totals.wt, 2)}</td>
                  <td colSpan="8" style={{ border: "1px solid #000" }}></td>
                  <td colSpan="3" style={{ border: "1px solid #000", padding: "5px", textAlign: "right", fontSize: 9.5 }}>{fmt(totals.amount, 2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "auto", paddingTop: 10 }}>
          <div style={{ fontSize: 7, textAlign: "justify", lineHeight: 1.3, border: "1px solid #ddd", padding: 5, borderRadius: 4, whiteSpace: "pre-line", maxHeight: 50, overflow: "hidden" }}>
            {company.memoConditions || FALLBACK_MEMO_CONDITIONS}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "none", marginTop: 25, fontSize: 9.5 }}>
            <tbody>
              <tr>
                <td style={{ width: "40%", textAlign: "center", verticalAlign: "bottom" }}>
                  <div style={{ borderTop: "1px solid #000", paddingTop: 4, margin: "0 10px" }}>Receiver's Sign</div>
                </td>
                <td style={{ width: "20%" }}></td>
                <td style={{ width: "40%", textAlign: "center", verticalAlign: "bottom" }}>
                  <div style={{ borderTop: "1px solid #000", paddingTop: 4, margin: "0 10px" }}>For, {company.companyName}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="india-dual-print-container" style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
      {Array.from({ length: totalPages }).map((_, pageIdx) => {
        const currentItems = items.slice(pageIdx * pageSize, (pageIdx + 1) * pageSize);
        const startRowNumber = (pageIdx * pageSize) + 1;
        const isLastPage = pageIdx === totalPages - 1;

        return (
          <div
            key={pageIdx}
            className={isLastPage ? "" : "page-break"}
            style={{ width: "100%", height: "100%", padding: "5px 0", marginBottom: 25 }}
          >
            <table style={{ width: "100%", height: "100%" }}>
              <tbody>
                <tr>
                  <td style={{ width: "49%", verticalAlign: "top" }}>
                    {renderSingleCopy(currentItems, startRowNumber, isLastPage)}
                  </td>
                  <td style={{ width: "2%", position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", borderLeft: "1px dashed #777" }} />
                  </td>
                  <td style={{ width: "49%", verticalAlign: "top" }}>
                    {renderSingleCopy(currentItems, startRowNumber, isLastPage)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default IndiaDualFormat;
