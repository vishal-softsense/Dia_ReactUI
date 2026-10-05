import React from "react";
import { fmt, fmtNum, getVal } from "../shared/printUtils";
import deltaQr from "../../assets/images/print/deltaqr.png";
import deltaInstaQr from "../../assets/images/print/delta.png";

/**
 * Solitaire Memo — dense single-copy when ≥11 items.
 * Layout mirrors MVC SoMemoOutSiglePageFormat.cshtml.
 *
 * Paging (product requirement / reference prints):
 *   Max 30 records per page.
 *   ≤30 → single page (header + rows + totals + footer)
 *   >30 → multiple pages, exactly 30 records each, remainder on last page
 */
const ITEMS_PER_PAGE = 30;

/** MVC: dd-MMMM-yyyy */
const fmtSinglePageDate = (val) => {
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

/** Fixed 30 records per page; remainder on last page. */
export const buildSinglePagePages = (items) => {
  const list = items || [];
  if (!list.length) {
    return [{ pageItems: [], isLastPage: true, skip: 0, padTo: ITEMS_PER_PAGE }];
  }
  const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE));
  const pages = [];
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const isLastPage = pageIndex === totalPages - 1;
    const skip = pageIndex * ITEMS_PER_PAGE;
    const pageItems = list.slice(skip, skip + ITEMS_PER_PAGE);
    pages.push({
      pageItems,
      isLastPage,
      skip,
      padTo: ITEMS_PER_PAGE
    });
  }
  return pages;
};

const SinglePageFormat = ({ data, items, totals, company, logoUrl }) => {
  const list = items || [];
  const pages = buildSinglePagePages(list);
  const companyFooter = company?.companyFooter || "Powered by SoftOnCloud";

  let totalWt = 0;
  let totalAmt = 0;
  list.forEach((it) => {
    totalWt += Number(getVal(it, "Carats", "carats", "Weight", "weight")) || 0;
    totalAmt += lineAmt(it);
  });
  if (!list.length && totals) {
    totalWt = Number(totals.wt) || 0;
    totalAmt = Number(totals.amount) || 0;
  }

  const plusMinus =
    (Number(getVal(data, "PlusMinusAmount", "plusMinusAmount", "PlusMinAmount", "plusMinAmount")) || 0) *
    (Number(getVal(data, "BaseRate", "baseRate")) || 0);
  const finalAmt =
    Number(getVal(data, "FinalAmount", "finalAmount", "FinalMAmount", "finalMAmount")) ||
    totalAmt ||
    0;

  return (
    <div className="single-page-print-container">
      <style>{`
        .single-page-print-container {
          font-family: "Segoe UI", Arial, sans-serif;
          font-size: 13px;
          color: #000;
          background: transparent;
          box-sizing: border-box;
        }
        @media screen {
          .single-page-print-container {
            width: 100%;
            margin: 0 auto;
            padding: 0;
            border: none;
            box-shadow: none;
          }
          .single-page-print-container .single-page-sheet {
            width: 8.5in;
            min-height: 11in;
            max-width: 100%;
            margin: 0 auto 28px;
            padding: 10mm;
            border: 1px solid #888;
            box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
            box-sizing: border-box;
            background: #fff;
          }
        }
        @media print {
          .single-page-print-container {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            overflow: visible !important;
            max-height: none !important;
          }
          .single-page-print-container .single-page-sheet {
            width: 100% !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          .single-page-print-container .single-page-sheet-last {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .single-page-print-container .sp-data-table thead {
            display: table-row-group !important;
          }
          .single-page-print-container .sp-data-table tbody tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Fit header + 30 rows (+ totals) + footer on one Letter page */
          .single-page-print-container .sp-header-section {
            margin-bottom: 6px !important;
          }
          .single-page-print-container .sp-company-logo {
            max-height: 72px !important;
            width: 88px !important;
          }
          .single-page-print-container .sp-office-title {
            font-size: 18px !important;
          }
          .single-page-print-container .sp-memo-box td {
            height: 40px !important;
            padding: 4px 6px !important;
          }
          .single-page-print-container .sp-data-table th {
            font-size: 9px !important;
            padding: 3px 2px !important;
          }
          .single-page-print-container .sp-data-table tbody tr {
            height: 14px !important;
            font-size: 10px !important;
          }
          .single-page-print-container .sp-empty-row {
            height: 12px !important;
          }
          .single-page-print-container .sp-footer-wrap {
            margin-top: 32px !important;
            margin-bottom: 48px !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
          }
          .single-page-print-container .sp-footer-wrap img {
            height: 40px !important;
          }
          .single-page-print-container th {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        .single-page-print-container .sp-header-section {
          margin-bottom: 10px;
          width: 100%;
          border-collapse: collapse;
        }
        .single-page-print-container .sp-company-logo {
          max-height: 100px;
          width: 120px;
        }
        .single-page-print-container .sp-company-name {
          font-size: 14px;
        }
        .single-page-print-container .sp-office-title {
          font-weight: bold;
          font-size: 22px;
          text-align: right;
          margin: 0;
        }
        .single-page-print-container .sp-memo-box {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .single-page-print-container .sp-memo-box th {
          background-color: #BFBFBF;
          border: 2px solid #A2A1A1;
          padding: 4px;
          font-weight: bold;
          text-align: center;
          font-size: 14px;
        }
        .single-page-print-container .sp-memo-box td {
          border: 2px solid #A2A1A1;
          padding: 6px;
          text-align: left;
          height: 55px;
          vertical-align: top;
        }
        .single-page-print-container .sp-data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          table-layout: fixed;
        }
        .single-page-print-container .sp-data-table th {
          border: 2px solid #A2A1A1;
          background-color: #BFBFBF;
          white-space: nowrap;
          text-align: center;
          vertical-align: middle;
          padding: 4px;
          font-weight: bold;
          font-size: 9px;
        }
        .single-page-print-container .sp-data-table td {
          border: 2px solid #A2A1A1;
          padding: 1px 4px;
          white-space: nowrap;
          overflow: hidden;
        }
        .single-page-print-container .sp-data-table tbody tr {
          height: 18px;
          font-size: 12px;
        }
        .single-page-print-container .sp-empty-row td {
          border: none !important;
        }
        .single-page-print-container .sp-empty-row td:first-child {
          border-left: 2px solid #A2A1A1 !important;
        }
        .single-page-print-container .sp-empty-row td:last-child {
          border-right: 2px solid #A2A1A1 !important;
        }
      `}</style>

      {pages.map((page, pageIndex) => {
        const { pageItems, isLastPage, skip, padTo } = page;
        let srNo = skip + 1;
        /* Pad only when page is sparse; full 30-row pages need no filler */
        const emptyCount =
          pageItems.length >= padTo
            ? 0
            : isLastPage && pageItems.length >= 20
              ? 0
              : Math.max(0, padTo - pageItems.length);

        return (
          <div
            key={pageIndex}
            className={`single-page-sheet${isLastPage ? " single-page-sheet-last" : ""}`}
          >
            {/* Header */}
            <table className="sp-header-section">
              <tbody>
                <tr>
                  <td style={{ width: "16%", verticalAlign: "top", paddingRight: 0 }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="sp-company-logo" />
                    ) : null}
                  </td>
                  <td style={{ width: "42%", verticalAlign: "top", lineHeight: 1.3, paddingLeft: 5 }}>
                    <div className="sp-company-name">{company?.companyName}</div>
                    <div>{company?.companyAddress}</div>
                    <div>{company?.companyAddress1}</div>
                    <div>{company?.companyAddress2}</div>
                    <div style={{ margin: "2px 0" }}>{company?.companyPhone}</div>
                    <div>{company?.companyEmail}</div>
                  </td>
                  <td style={{ width: "42%", verticalAlign: "top" }}>
                    <div className="sp-office-title">OFFICE COPY</div>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginTop: 5
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              border: "2px solid #A2A1A1",
                              background: "#ccc",
                              padding: 4,
                              width: "50%",
                              textAlign: "center"
                            }}
                          >
                            Date
                          </th>
                          <th
                            style={{
                              border: "2px solid #A2A1A1",
                              background: "#ccc",
                              padding: 4,
                              width: "50%",
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
                              border: "2px solid #A2A1A1",
                              padding: 4,
                              textAlign: "center"
                            }}
                          >
                            {fmtSinglePageDate(getVal(data, "TrnDate", "trnDate"))}
                          </td>
                          <td
                            style={{
                              border: "2px solid #A2A1A1",
                              padding: 4,
                              textAlign: "center"
                            }}
                          >
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
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ width: "50%", verticalAlign: "top", paddingRight: 8 }}>
                    <table className="sp-memo-box">
                      <thead>
                        <tr>
                          <th>Memo To</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <strong style={{ fontSize: 13 }}>
                              {getVal(data, "PartyName", "partyName")}
                            </strong>
                            <br />
                            {getVal(data, "AddressLine1", "addressLine1")}
                            <br />
                            {getVal(data, "AddressLine2", "addressLine2")}
                            <br />
                            {getVal(data, "AddressLine3", "addressLine3")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ width: "8%" }} />
                  <td style={{ width: "42%", verticalAlign: "top", textAlign: "center" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th
                            style={{
                              border: "2px solid #A2A1A1",
                              background: "#ccc",
                              padding: 4,
                              width: "50%",
                              textAlign: "center"
                            }}
                          >
                            Ship Via
                          </th>
                          <th
                            style={{
                              border: "2px solid #A2A1A1",
                              background: "#ccc",
                              padding: 4,
                              width: "50%",
                              textAlign: "center"
                            }}
                          >
                            Tracking No
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ border: "2px solid #A2A1A1", padding: 11 }}>
                            {getVal(data, "ShipVia", "shipVia")}
                          </td>
                          <td style={{ border: "2px solid #A2A1A1", padding: 4 }}>
                            {getVal(data, "Tracking", "tracking")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: 8 }} />

            {/* Items */}
            <table className="sp-data-table">
              <thead>
                <tr>
                  <th style={{ width: "4%" }}>Sr No</th>
                  <th style={{ width: "9%" }}>StoneID</th>
                  <th style={{ width: "6%" }}>Lab</th>
                  <th style={{ width: "10%", textAlign: "left" }}>CertNo</th>
                  <th style={{ width: "5%" }}>Shp</th>
                  <th style={{ width: "5%" }}>Col</th>
                  <th style={{ width: "5%" }}>Cla</th>
                  <th style={{ width: "5%" }}>Cut</th>
                  <th style={{ width: "5%" }}>Pol</th>
                  <th style={{ width: "5%" }}>Sym</th>
                  <th style={{ width: "4%" }}>FL</th>
                  <th style={{ width: "6%" }}>Cts</th>
                  <th style={{ width: "7%" }}>Rate</th>
                  <th style={{ width: "6%" }}>Back</th>
                  <th style={{ width: "12%" }}>Amt</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => {
                  const no = srNo++;
                  const backRaw = getVal(item, "Back", "back", "discount");
                  const back =
                    backRaw === "" || backRaw === null || backRaw === undefined
                      ? "0.00"
                      : fmt(backRaw, 2);
                  return (
                    <tr key={idx} style={{ height: 18, fontSize: 12 }}>
                      <td style={{ textAlign: "center" }}>{no}</td>
                      <td style={{ textAlign: "left", paddingLeft: 4 }}>
                        {getVal(item, "Lotno", "lotNo", "StockNo", "stockNo")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {getVal(item, "CertId", "certId", "lab")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {getVal(item, "CertificateNo", "certificateNo")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {getVal(item, "ShapeId", "shapeId", "shape")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {getVal(item, "ColorId", "colorId", "color")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {getVal(item, "ClarityId", "clarityId", "clarity")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {getVal(item, "PropId", "propId", "cut")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {getVal(item, "PolishId", "polishId", "polish")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {getVal(item, "SymId", "symId", "symmetry")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {getVal(item, "FLId", "flId", "fl")}
                      </td>
                      <td style={{ textAlign: "right", paddingRight: 10 }}>
                        {fmt(getVal(item, "Carats", "carats", "Weight", "weight"), 2)}
                      </td>
                      <td style={{ textAlign: "right", paddingRight: 10 }}>
                        {fmtNum(getVal(item, "Rate", "rate"), 2)}
                      </td>
                      <td style={{ textAlign: "right", paddingRight: 10 }}>{back}</td>
                      <td style={{ textAlign: "right", paddingRight: 10 }}>
                        {fmtNum(lineAmt(item), 2)}
                      </td>
                    </tr>
                  );
                })}

                {Array.from({ length: emptyCount }).map((_, i) => (
                  <tr key={`empty-${i}`} className="sp-empty-row">
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                ))}

                {isLastPage && (
                  <>
                    <tr style={{ fontWeight: "bold", fontSize: 12 }}>
                      <td colSpan={11} style={{ border: "1px solid #999", textAlign: "left", paddingLeft: 15 }}>
                        Total Carats :
                      </td>
                      <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>
                        {fmt(totalWt, 2)}
                      </td>
                      <td colSpan={2} style={{ border: "1px solid #999", textAlign: "right", paddingRight: 15 }}>
                        US $ :
                      </td>
                      <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>
                        {fmtNum(totalAmt, 2)}
                      </td>
                    </tr>
                    <tr style={{ fontSize: 12 }}>
                      <td colSpan={14} style={{ border: "none" }} />
                      <td style={{ border: "1px solid #999", padding: 3 }}>
                        <div style={{ overflow: "hidden" }}>
                          <span style={{ fontSize: 10, float: "left" }}>+/- Amt</span>
                          <span style={{ float: "right", fontWeight: "bold" }}>{fmtNum(plusMinus, 2)}</span>
                        </div>
                      </td>
                    </tr>
                    <tr style={{ fontWeight: "bold", fontSize: 12 }}>
                      <td colSpan={14} style={{ border: "none" }} />
                      <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>
                        {fmtNum(finalAmt, 2)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {/* Footer */}
            <table
              className="sp-footer-wrap"
              style={{
                width: "100%",
                marginTop: 100,
                marginBottom: 48,
                borderCollapse: "collapse"
              }}
            >
              <tbody>
                <tr>
                  <td style={{ width: "35%", verticalAlign: "bottom", textAlign: "left" }}>
                    <img src={deltaQr} alt="QR" style={{ height: 50, marginRight: 5 }} />
                    <img src={deltaInstaQr} alt="Insta QR" style={{ height: 50 }} />
                  </td>
                  <td
                    style={{
                      width: "30%",
                      verticalAlign: "bottom",
                      textAlign: "center",
                      color: "gray",
                      fontSize: 9,
                      paddingBottom: 5
                    }}
                  >
                    {companyFooter}
                  </td>
                  <td
                    style={{
                      width: "35%",
                      verticalAlign: "bottom",
                      textAlign: "right",
                      fontWeight: "bold",
                      fontSize: 13,
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
      })}
    </div>
  );
};

export default SinglePageFormat;
