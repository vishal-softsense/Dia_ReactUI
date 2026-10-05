import React from "react";
import { FALLBACK_MEMO_CONDITIONS, fmt, fmtDate, fmtNum, getVal } from "../shared/printUtils";

// MVC Views/Memo/SoMemoOutPrintInv_IndiaDual.cshtml
// One landscape sheet = left copy + right copy of the SAME page; next sheet = next 30 rows
const PAGE_SIZE = 30;

const cell = {
  border: "1px solid #000",
  padding: "3px 2px",
  fontSize: 8,
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  verticalAlign: "middle"
};

const IndiaDualFormat = ({ data, items, totals, company, logoUrl }) => {
  const list = items || [];
  const totalPages = Math.ceil(list.length / PAGE_SIZE) || 1;
  const conditions = company.memoConditions || FALLBACK_MEMO_CONDITIONS;

  const renderSingleCopy = (currentItems, startRowNumber, isLastPage) => {
    let rowNo = startRowNumber;
    return (
      <div className="india-dual-copy">
        <div className="india-dual-shree">
          શ્રી૧<span className="india-dual-shree-stick">।</span>
        </div>

        <table className="india-dual-header-table">
          <tbody>
            <tr>
              <td style={{ width: "32%", verticalAlign: "bottom" }}>
                <div className="india-dual-meta-line">
                  <b>Rapnet Id:</b> {company.rapUsername || ""}
                </div>
                <div className="india-dual-meta-line">
                  <b>Skype Id:</b> {company.companySkype || ""}
                </div>
                <div className="india-dual-meta-line">
                  <b>Email:</b> {company.companyEmail || ""}
                </div>
              </td>
              <td style={{ width: "36%", textAlign: "center", verticalAlign: "top" }}>
                <div className="india-dual-company-name">{company.companyName}</div>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="india-dual-logo" />
                ) : null}
              </td>
              <td style={{ width: "32%", verticalAlign: "top", textAlign: "left" }}>
                <div className="india-dual-meta-line">
                  <b>Add:</b> {company.companyAddress || ""}
                </div>
                <div className="india-dual-meta-line">
                  <b>Ph:</b> {company.companyPhone || ""}
                </div>
                <div className="india-dual-meta-line">
                  <b>GST No:</b> {company.companyGSTNo || ""}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="india-dual-party-box">
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

        <div className="india-dual-table-section">
          <table className="india-dual-data-table">
            <thead>
              <tr>
                {[
                  "No",
                  "Stone Id",
                  "Shp",
                  "Cts",
                  "Col",
                  "Cla",
                  "Cu",
                  "Po",
                  "Sym",
                  "FL",
                  "Lab",
                  "Rate",
                  "Certi No",
                  "Disc",
                  "Amt"
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, idx) => {
                const n = rowNo++;
                return (
                  <tr key={idx}>
                    <td style={cell}>{n}</td>
                    <td style={{ ...cell, fontWeight: "bold" }}>
                      {getVal(item, "Lotno", "lotNo", "stockNo")}
                    </td>
                    <td style={cell}>{getVal(item, "ShapeId", "shapeId", "shape")}</td>
                    <td style={{ ...cell, textAlign: "right" }}>
                      {fmt(getVal(item, "Carats", "carats", "weight"), 2)}
                    </td>
                    <td style={cell}>{getVal(item, "ColorId", "colorId", "color")}</td>
                    <td style={cell}>{getVal(item, "ClarityId", "clarityId", "clarity")}</td>
                    <td style={cell}>{getVal(item, "PropId", "propId", "cut")}</td>
                    <td style={cell}>{getVal(item, "PolishId", "polishId", "polish")}</td>
                    <td style={cell}>{getVal(item, "SymId", "symId", "symmetry")}</td>
                    <td style={cell}>{getVal(item, "FLId", "flId", "fl")}</td>
                    <td style={cell}>{getVal(item, "CertId", "certId", "lab")}</td>
                    <td style={{ ...cell, textAlign: "right" }}>
                      {fmtNum(getVal(item, "Rate", "rate"), 2)}
                    </td>
                    <td style={cell}>{getVal(item, "CertificateNo", "certificateNo")}</td>
                    <td style={{ ...cell, textAlign: "right" }}>
                      {fmtNum(getVal(item, "Back", "back", "discount") || 0, 2)}
                    </td>
                    <td style={{ ...cell, textAlign: "right", fontWeight: "bold" }}>
                      {fmtNum(getVal(item, "Amount", "amount"), 2)}
                    </td>
                  </tr>
                );
              })}

              {isLastPage ? (
                <tr className="india-dual-total-row">
                  <td colSpan={2} style={{ ...cell, textAlign: "left", fontWeight: "bold", fontSize: 9.5 }}>
                    Total:
                  </td>
                  <td colSpan={2} style={{ ...cell, textAlign: "right", fontWeight: "bold", fontSize: 9.5 }}>
                    {fmt(totals.wt, 2)}
                  </td>
                  <td colSpan={8} style={cell} />
                  <td colSpan={3} style={{ ...cell, textAlign: "right", fontWeight: "bold", fontSize: 9.5 }}>
                    {fmtNum(totals.amount, 2)}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="india-dual-bottom">
          <div className="india-dual-disclaimer">{conditions}</div>
          <table className="india-dual-sign-table">
            <tbody>
              <tr>
                <td style={{ width: "40%", textAlign: "center", verticalAlign: "bottom" }}>
                  <div className="india-dual-sign-line">Receiver&apos;s Sign</div>
                </td>
                <td style={{ width: "20%" }} />
                <td style={{ width: "40%", textAlign: "center", verticalAlign: "bottom" }}>
                  <div className="india-dual-sign-line">For, {company.companyName}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="india-dual-print-container">
      {Array.from({ length: totalPages }).map((_, pageIdx) => {
        const currentItems = list.slice(pageIdx * PAGE_SIZE, (pageIdx + 1) * PAGE_SIZE);
        const startRowNumber = pageIdx * PAGE_SIZE + 1;
        const isLastPage = pageIdx === totalPages - 1;

        return (
          <div
            key={pageIdx}
            className={`india-dual-page${isLastPage ? " india-dual-page-last" : " page-break"}`}
          >
            <table className="india-dual-sheet-table">
              <tbody>
                <tr>
                  <td className="india-dual-sheet-left">
                    {renderSingleCopy(currentItems, startRowNumber, isLastPage)}
                  </td>
                  <td className="india-dual-sheet-gap">
                    <div className="india-dual-cut-line" />
                  </td>
                  <td className="india-dual-sheet-right">
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
