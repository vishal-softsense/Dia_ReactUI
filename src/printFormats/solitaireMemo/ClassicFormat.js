import React from "react";
import { fmt, fmtNum, getVal } from "../shared/printUtils";
import deltaQr from "../../assets/images/print/deltaqr.png";
import deltaInstaQr from "../../assets/images/print/delta.png";

/**
 * Solitaire Memo (Classic) — mirrors MVC Views/Memo/SoMemoOutPrintInv.cshtml
 * OFFICE COPY + CUSTOMER COPY stacked on Letter portrait (Rotativa 10mm margins).
 * 10 rows per page; totals only on last page.
 */
const PAGE_SIZE = 10;

/** MVC SoMemoOutPrintInv date: dd-MMMM-yyyy */
const fmtClassicDate = (val) => {
  if (!val) return "0.00";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const dd = String(d.getDate()).padStart(2, "0");
    return `${dd}-${months[d.getMonth()]}-${d.getFullYear()}`;
  } catch {
    return String(val);
  }
};

const lineAmt = (item) => {
  const m = getVal(item, "MasterCurrencyAmount", "masterCurrencyAmount");
  if (m !== "" && m !== undefined && m !== null) return Number(m) || 0;
  return Number(getVal(item, "Amount", "amount")) || 0;
};

const MemoCopy = ({
  copyTitle,
  data,
  pageItems,
  srNoStart,
  isLastPage,
  company,
  logoUrl,
  totals,
  footerMarginTop
}) => {
  let srNo = srNoStart;
  const emptyCount = Math.max(0, PAGE_SIZE - pageItems.length);
  const companyFooter = company?.companyFooter || "Powered by SoftOnCloud";
  const plusMinus =
    (Number(getVal(data, "PlusMinusAmount", "plusMinusAmount", "PlusMinAmount", "plusMinAmount")) || 0) *
    (Number(getVal(data, "BaseRate", "baseRate")) || 0);
  const finalAmt =
    Number(getVal(data, "FinalAmount", "finalAmount", "FinalMAmount", "finalMAmount")) ||
    totals.amount ||
    0;

  return (
    <div className="classic-copy">
      {/* Header */}
      <table className="classic-header" style={{ width: "100%", marginBottom: 10, borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ width: "16%", verticalAlign: "top", paddingRight: 0 }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="classic-logo" style={{ maxHeight: 95, width: 120 }} />
              ) : null}
            </td>
            <td style={{ width: "42%", verticalAlign: "top", letterSpacing: 1, fontSize: 11, paddingLeft: 5 }}>
              <div>{company?.companyName}</div>
              <div style={{ margin: "1px 0" }}>{company?.companyAddress}</div>
              <div>{company?.companyAddress1}</div>
              <div style={{ margin: "1px 0" }}>{company?.companyAddress2}</div>
              <div>{company?.companyPhone}</div>
              <div>{company?.companyEmail}</div>
            </td>
            <td style={{ width: "42%", verticalAlign: "top" }}>
              <div
                className="classic-copy-title"
                style={{
                  fontWeight: "bold",
                  fontSize: 22,
                  fontFamily: "Verdana, Arial, sans-serif",
                  textAlign: "right",
                  marginTop: 10,
                  marginBottom: 0
                }}
              >
                {copyTitle}
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: 5,
                  border: "1px solid #A2A1A1"
                }}
              >
                <thead>
                  <tr style={{ height: 20 }}>
                    <th
                      style={{
                        width: "50%",
                        border: "1px solid #A2A1A1",
                        background: "#ccc",
                        padding: 3,
                        fontFamily: "Verdana, Arial, sans-serif",
                        textAlign: "center"
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        width: "50%",
                        border: "1px solid #A2A1A1",
                        background: "#ccc",
                        padding: 3,
                        fontFamily: "Verdana, Arial, sans-serif",
                        textAlign: "center"
                      }}
                    >
                      Memo #
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style={{
                        border: "1px solid #A2A1A1",
                        padding: 3,
                        textAlign: "center",
                        letterSpacing: 1
                      }}
                    >
                      {fmtClassicDate(getVal(data, "TrnDate", "trnDate"))}
                    </td>
                    <td style={{ border: "1px solid #A2A1A1", padding: 3, textAlign: "center" }}>
                      {getVal(data, "InvNo", "invNo")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Memo To + Ship */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Verdana, Arial, sans-serif", marginTop: 2 }}>
        <tbody>
          <tr>
            <td style={{ width: "50%", verticalAlign: "top", paddingRight: 8 }}>
              <table className="classic-memo-to" style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #A2A1A1" }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        background: "#c0c0c0",
                        padding: 6,
                        fontWeight: "bold",
                        textAlign: "center"
                      }}
                    >
                      Memo To
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #A2A1A1", padding: 8, textAlign: "left", fontSize: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: "bold", letterSpacing: 1 }}>
                        {getVal(data, "PartyName", "partyName")}
                      </span>
                      <br />
                      <span style={{ fontSize: 10 }}>{getVal(data, "AddressLine1", "addressLine1")}</span>
                      <br />
                      <span style={{ fontSize: 10 }}>{getVal(data, "AddressLine2", "addressLine2")}</span>
                      <br />
                      <span style={{ fontSize: 10 }}>{getVal(data, "AddressLine3", "addressLine3")}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td style={{ width: "8%" }} />
            <td style={{ width: "42%", verticalAlign: "top", textAlign: "center" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #A2A1A1" }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        width: "50%",
                        border: "1px solid #A2A1A1",
                        background: "#ccc",
                        padding: 3,
                        fontSize: 12,
                        textAlign: "center"
                      }}
                    >
                      Ship Via
                    </th>
                    <th
                      style={{
                        width: "50%",
                        border: "1px solid #A2A1A1",
                        background: "#ccc",
                        padding: 3,
                        fontSize: 12,
                        textAlign: "center"
                      }}
                    >
                      Tracking No
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ height: 20 }}>
                    <td style={{ border: "1px solid #A2A1A1", padding: 3 }}>{getVal(data, "ShipVia", "shipVia")}</td>
                    <td style={{ border: "1px solid #A2A1A1", padding: 3 }}>{getVal(data, "Tracking", "tracking")}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items table */}
      <div style={{ marginTop: 3 }}>
        <table
          className="classic-main-table"
          style={{
            fontFamily: "Verdana, Arial, sans-serif",
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 9,
            tableLayout: "fixed"
          }}
        >
          <thead>
            <tr style={{ background: "#c0c0c0", height: 18 }}>
              <th style={{ border: "1px solid #999", width: "4%", textAlign: "center" }}>Sr No</th>
              <th style={{ border: "1px solid #999", width: "9%", textAlign: "center" }}>StoneID</th>
              <th style={{ border: "1px solid #999", width: "6%", textAlign: "center" }}>Lab</th>
              <th style={{ border: "1px solid #999", width: "10%", textAlign: "left" }}>CertNo</th>
              <th style={{ border: "1px solid #999", width: "5%", textAlign: "center" }}>Shp</th>
              <th style={{ border: "1px solid #999", width: "5%", textAlign: "center" }}>Col</th>
              <th style={{ border: "1px solid #999", width: "5%", textAlign: "center" }}>Cla</th>
              <th style={{ border: "1px solid #999", width: "5%", textAlign: "center" }}>Cut</th>
              <th style={{ border: "1px solid #999", width: "5%", textAlign: "center" }}>Pol</th>
              <th style={{ border: "1px solid #999", width: "5%", textAlign: "center" }}>Sym</th>
              <th style={{ border: "1px solid #999", width: "4%", textAlign: "center" }}>FL</th>
              <th style={{ border: "1px solid #999", width: "6%", textAlign: "center" }}>Cts</th>
              <th style={{ border: "1px solid #999", width: "7%", textAlign: "center" }}>Rate</th>
              <th style={{ border: "1px solid #999", width: "6%", textAlign: "center" }}>Back</th>
              <th style={{ border: "1px solid #999", width: "12%", textAlign: "center" }}>Amt</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, idx) => {
              const no = ++srNo;
              const backRaw = getVal(item, "Back", "back", "discount");
              const back =
                backRaw === "" || backRaw === null || backRaw === undefined
                  ? "0.00"
                  : fmt(backRaw, 2);
              return (
                <tr key={idx} style={{ height: 18, fontSize: 10 }}>
                  <td style={{ border: "1px solid #999", textAlign: "center" }}>{no}</td>
                  <td style={{ border: "1px solid #999", textAlign: "left", paddingLeft: 4 }}>
                    {getVal(item, "Lotno", "lotNo", "StockNo", "stockNo")}
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "center" }}>
                    {getVal(item, "CertId", "certId", "lab")}
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "center" }}>
                    {getVal(item, "CertificateNo", "certificateNo")}
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "center" }}>
                    {getVal(item, "ShapeId", "shapeId", "shape")}
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "center" }}>
                    {getVal(item, "ColorId", "colorId", "color")}
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "center" }}>
                    {getVal(item, "ClarityId", "clarityId", "clarity")}
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "center" }}>
                    {getVal(item, "PropId", "propId", "cut")}
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "center" }}>
                    {getVal(item, "PolishId", "polishId", "polish")}
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "center" }}>
                    {getVal(item, "SymId", "symId", "symmetry")}
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "center" }}>
                    {getVal(item, "FLId", "flId", "fl")}
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>
                    {fmt(getVal(item, "Carats", "carats", "Weight", "weight"), 2)}
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>
                    {fmtNum(getVal(item, "Rate", "rate"), 2)}
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>{back}</td>
                  <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>
                    {fmtNum(lineAmt(item), 2)}
                  </td>
                </tr>
              );
            })}

            {Array.from({ length: emptyCount }).map((_, i) => (
              <tr
                key={`empty-${i}`}
                className="classic-empty-row"
                style={{ height: 20, borderLeft: "1px solid #A2A1A1", borderRight: "1px solid #A2A1A1" }}
              >
                {Array.from({ length: 14 }).map((__, j) => (
                  <td key={j} style={{ border: "none" }} />
                ))}
                <td style={{ border: "none", borderLeft: "1px solid #A2A1A1" }} />
              </tr>
            ))}

            {isLastPage && (
              <>
                <tr
                  style={{
                    fontWeight: "bold",
                    height: 24,
                    fontSize: 11,
                    borderTop: "2px solid #A2A1A1"
                  }}
                >
                  <td colSpan={11} style={{ border: "1px solid #999", textAlign: "left", paddingLeft: 25 }}>
                    Total Carats :
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>
                    {fmt(totals.wt, 2)}
                  </td>
                  <td colSpan={2} style={{ border: "1px solid #999", textAlign: "right", paddingRight: 15 }}>
                    US $ :
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>
                    {fmtNum(totals.amount, 2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={14} style={{ border: "none" }} />
                  <td style={{ border: "1px solid #999", padding: 4 }}>
                    <div style={{ overflow: "hidden" }}>
                      <span style={{ float: "left" }}>+/- Amt</span>
                      <span style={{ fontWeight: "bold", float: "right" }}>{fmtNum(plusMinus, 2)}</span>
                    </div>
                  </td>
                </tr>
                <tr style={{ height: 24, fontSize: 11, fontWeight: "bold" }}>
                  <td colSpan={14} style={{ border: "none" }} />
                  <td
                    style={{
                      borderLeft: "1px solid #999",
                      borderRight: "1px solid #999",
                      borderTop: "1px solid #999",
                      borderBottom: "1px solid #A2A1A1",
                      textAlign: "right",
                      paddingRight: 5
                    }}
                  >
                    {fmtNum(finalAmt, 2)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: QR | Powered by | Signature */}
      <table
        className={`classic-footer-wrap${footerMarginTop > 0 ? " classic-footer-customer" : ""}`}
        style={{ width: "100%", marginTop: footerMarginTop, borderCollapse: "collapse" }}
      >
        <tbody>
          <tr>
            <td style={{ width: "35%", verticalAlign: "bottom", textAlign: "left" }}>
              <img src={deltaQr} alt="QR" className="classic-qr" style={{ height: 50, marginRight: 5 }} />
              <img src={deltaInstaQr} alt="Insta QR" className="classic-qr" style={{ height: 50 }} />
            </td>
            <td
              style={{
                width: "30%",
                verticalAlign: "middle",
                textAlign: "center",
                color: "gray",
                fontSize: 9
              }}
            >
              {companyFooter}
            </td>
            <td
              style={{
                width: "35%",
                verticalAlign: "middle",
                fontFamily: "Verdana, Arial, sans-serif",
                textAlign: "right",
                fontWeight: "bold",
                fontSize: 14,
                whiteSpace: "nowrap"
              }}
            >
              Signature&nbsp;&nbsp;&nbsp;______________________
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const ClassicFormat = ({ data, items, totals, company, logoUrl }) => {
  const list = items || [];
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE) || 1);

  // Prefer MasterCurrencyAmount for totals (MVC)
  let totalWt = 0;
  let totalAmt = 0;
  list.forEach((it) => {
    totalWt += Number(getVal(it, "Carats", "carats", "Weight", "weight")) || 0;
    totalAmt += lineAmt(it);
  });
  const pageTotals = {
    wt: totalWt || totals?.wt || 0,
    amount: totalAmt || totals?.amount || 0,
    qty: totals?.qty || 0
  };

  return (
    <div className="classic-print-container">
      <style>{`
        .classic-print-container {
          font-family: "Segoe UI", Arial, sans-serif;
          font-size: 13px;
          color: #000;
          background: #fff;
          box-sizing: border-box;
        }
        @media screen {
          .classic-print-container {
            width: 100%;
            max-width: 8.5in;
            min-width: min(8.5in, 100%);
            margin: 0 auto 24px;
            padding: 10mm;
            border: 1px solid #c8c8c8;
            box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
            box-sizing: border-box;
          }
          .classic-print-container .classic-copy,
          .classic-print-container .classic-main-table,
          .classic-print-container .classic-header {
            width: 100%;
          }
        }
        @media print {
          .classic-print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            /* Scale whole sheet so OFFICE + CUSTOMER fit one Letter page */
            zoom: 0.72 !important;
          }
          .classic-print-container .classic-sheet {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .classic-print-container .classic-sheet-last {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          /* Do NOT avoid-break on each copy — that forces 2 pages */
          .classic-print-container .classic-copy {
            page-break-inside: auto !important;
            break-inside: auto !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .classic-print-container .classic-cut-gap {
            margin-top: 36px !important;
            height: 0 !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .classic-print-container .classic-empty-row {
            height: 14px !important;
          }
          .classic-print-container .classic-logo {
            max-height: 72px !important;
            width: 90px !important;
          }
          .classic-print-container .classic-qr {
            height: 40px !important;
          }
          .classic-print-container th {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        /* MVC SoMemoOutPrintInv cut gap (screen preview) */
        .classic-print-container .classic-cut-gap {
          margin-top: 70px;
          height: 0;
        }
      `}</style>

      {Array.from({ length: totalPages }).map((_, pageIdx) => {
        const isLastPage = pageIdx === totalPages - 1;
        const skip = pageIdx * PAGE_SIZE;
        const pageItems = list.slice(skip, skip + PAGE_SIZE);
        const srNoStart = skip;

        return (
          <div
            key={pageIdx}
            className={`classic-sheet${isLastPage ? " classic-sheet-last" : ""}`}
          >
            <MemoCopy
              copyTitle="OFFICE COPY"
              data={data}
              pageItems={pageItems}
              srNoStart={srNoStart}
              isLastPage={isLastPage}
              company={company}
              logoUrl={logoUrl}
              totals={pageTotals}
              footerMarginTop={0}
            />

            <div className="classic-cut-gap" />

            <MemoCopy
              copyTitle="CUSTOMER COPY"
              data={data}
              pageItems={pageItems}
              srNoStart={srNoStart}
              isLastPage={isLastPage}
              company={company}
              logoUrl={logoUrl}
              totals={pageTotals}
              footerMarginTop={15}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ClassicFormat;
