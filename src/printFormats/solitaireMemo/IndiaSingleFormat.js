import React from "react";
import { FALLBACK_MEMO_CONDITIONS, fmt, fmtDate, fmtNum, getVal } from "../shared/printUtils";

/**
 * Solitaire Memo India_Single Format — mirrors MVC
 * Views/Memo/SoMemoOutPrintInv_IndiaSingle.cshtml (Rotativa Letter, 10mm margins).
 * Screen preview is a Letter sheet (not full-width); print uses Letter @page.
 * Pagination: 25 records per page.
 */
const IndiaSingleFormat = ({ data, items, totals, company, logoUrl }) => {
  const itemsPerPage = 25;
  const list = items || [];
  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const pages = [];
  for (let page = 0; page < totalPages; page++) {
    const skip = page * itemsPerPage;
    pages.push({
      pageItems: list.slice(skip, skip + itemsPerPage),
      srNoStart: skip + 1,
      isFirstPage: page === 0,
      isLastPage: page === totalPages - 1
    });
  }

  const totalCts = fmt(totals?.wt, 2);
  const totalAmt = fmtNum(totals?.amount, 2);
  const conditions = company?.memoConditions || FALLBACK_MEMO_CONDITIONS;
  const companyName = company?.companyName || "";

  return (
    <div className="india-single-print-container">
      <style>{`
        /* Screen: Letter paper sheet — not full browser width (match MVC PDF look) */
        .india-single-print-container {
          font-family: "Segoe UI", Arial, sans-serif;
          font-size: 13px;
          color: #000;
          background: #fff;
          box-sizing: border-box;
        }
        @media screen {
          .india-single-print-container {
            width: 8.5in;
            max-width: 100%;
            min-height: 11in;
            margin: 0 auto 24px;
            padding: 10mm;
            border: 1px solid #c8c8c8;
            box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
          }
        }
        @media print {
          .india-single-print-container {
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
        .india-single-print-container .memo-table {
          width: 100%;
          border-collapse: collapse;
        }
        .india-single-print-container .memo-table thead th {
          border-bottom: 2px solid #585858;
          padding: 2px 5px;
          font-weight: bold;
        }
        .india-single-print-container .memo-table th {
          border-left: 2px solid #585858;
          border-right: 2px solid #585858;
          text-align: center;
        }
        .india-single-print-container .memo-table td {
          border-left: 2px solid #585858;
          border-right: 2px solid #585858;
          border-top: none;
          border-bottom: none;
          padding: 2px 4px;
        }
        .india-single-print-container .india-single-page {
          width: 100%;
          padding-top: 5px;
          box-sizing: border-box;
          overflow: visible;
        }
        .india-single-print-container .india-single-page-first {
          padding-top: 16px;
        }
        .india-single-print-container .header-box {
          border: 2px solid #585858;
          position: relative;
          padding-top: 22px;
          overflow: visible;
        }
        .india-single-print-container .top-shree {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: #fff !important;
          padding: 0 8px;
          line-height: 1.2;
          font-size: 18px;
          font-weight: normal;
          white-space: nowrap;
          z-index: 5;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .india-single-print-container .top-shree .stick {
          font-size: 18px;
          position: relative;
          top: -3px;
        }
        @media print {
          .india-single-print-container,
          .india-single-print-container .india-single-page,
          .india-single-print-container .header-box {
            overflow: visible !important;
          }
        }
      `}</style>

      {pages.map((page, pageIdx) => {
        const { pageItems, srNoStart, isFirstPage, isLastPage } = page;
        let rowNumber = srNoStart;

        return (
          <div
            key={pageIdx}
            className={`india-single-page${isFirstPage ? " india-single-page-first" : ""}${isLastPage ? "" : " page-break"}`}
          >
            {isFirstPage && (
              <>
                <div className="header-box">
                  <div className="top-shree">
                    શ્રી૧<span className="stick">।</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td style={{ width: "20%", padding: "0px 10px 10px 10px", verticalAlign: "middle" }}>
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt="Logo"
                              style={{ height: 100, width: 120, objectFit: "contain" }}
                            />
                          ) : null}
                        </td>
                        <td style={{ width: "57%", textAlign: "center", padding: "0px 0px 10px 0px" }}>
                          <div style={{ fontSize: 22, letterSpacing: "0.9px" }}>{companyName}</div>
                          <div style={{ fontSize: 12, fontWeight: "bold", paddingTop: 3 }}>
                            TRUST AND QUALITY IS OUR IDENTITY
                          </div>
                          <div style={{ fontSize: 12, fontWeight: "bold", paddingTop: 3 }}>
                            {company?.companyAddress}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: "bold", paddingTop: 15 }}>
                            Ph : {company?.companyPhone}
                            <span style={{ marginLeft: 50 }}>Email : {company?.companyEmail}</span>
                          </div>
                        </td>
                        <td style={{ width: "23%", fontSize: 12, verticalAlign: "top", paddingTop: 4 }}>
                          <table style={{ borderCollapse: "collapse" }}>
                            <tbody>
                              <tr>
                                <td>GST No :</td>
                                <td style={{ paddingLeft: 10 }}>
                                  <b>{company?.companyGSTNo}</b>
                                </td>
                              </tr>
                              <tr>
                                <td>HSN CODE :</td>
                                <td style={{ paddingLeft: 10 }}>
                                  <b>{company?.companyHSNCode}</b>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan={3}
                          style={{
                            borderTop: "2px solid #585858",
                            textAlign: "center",
                            fontWeight: "bold",
                            fontSize: 26,
                            paddingTop: 0,
                            lineHeight: 1.2
                          }}
                        >
                          MEMO OUT
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <br />
              </>
            )}

            <div
              style={{
                border: "2px solid #585858",
                borderBottom: "none",
                padding: "15px 15px 25px 15px",
                marginTop: isFirstPage ? -10 : 5
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "8%", fontWeight: "bold", padding: "9px 0", fontSize: 14 }}>
                      M/S
                    </td>
                    <td style={{ width: "2%" }}>:</td>
                    <td style={{ width: "45%", fontSize: 14 }}>
                      {getVal(data, "PartyName", "partyName")}
                    </td>
                    <td
                      style={{
                        width: "11%",
                        fontWeight: "bold",
                        fontSize: 14,
                        paddingLeft: 20
                      }}
                    >
                      Issue Date
                    </td>
                    <td style={{ width: "2%" }}>:</td>
                    <td style={{ width: "16%", fontSize: 14 }}>
                      {fmtDate(getVal(data, "TrnDate", "trnDate"))}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "bold", fontSize: 14 }}>GST No</td>
                    <td>:</td>
                    <td style={{ fontSize: 14 }}>{company?.companyGSTNo}</td>
                    <td style={{ fontWeight: "bold", fontSize: 14, paddingLeft: 20 }}>No</td>
                    <td>:</td>
                    <td style={{ fontSize: 14 }}>{getVal(data, "InvNo", "invNo")}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "bold", padding: "9px 0", fontSize: 14 }}>Broker</td>
                    <td>:</td>
                    <td style={{ fontSize: 14 }}>{getVal(data, "BrokerName", "brokerName")}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              style={{
                border: "2px solid #585858",
                marginTop: isFirstPage ? 0 : 5,
                padding: 0,
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <table className="memo-table">
                <thead>
                  <tr style={{ fontSize: 14 }}>
                    <th style={{ borderLeft: "none" }}>No</th>
                    <th>Stone Id</th>
                    <th>Shp</th>
                    <th style={{ textAlign: "left" }}>Cts</th>
                    <th>Col</th>
                    <th>Cla</th>
                    <th>Cu</th>
                    <th>Po</th>
                    <th>Sy</th>
                    <th>Fl</th>
                    <th>Lab</th>
                    <th>Rate</th>
                    <th>Certi No</th>
                    <th style={{ textAlign: "left" }}>Disc</th>
                    <th style={{ borderRight: "none" }}>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, idx) => {
                    const no = rowNumber++;
                    const backRaw = getVal(item, "Back", "back", "discount");
                    const disc =
                      backRaw === "" || backRaw === null || backRaw === undefined
                        ? "0.00"
                        : fmtNum(backRaw, 2);
                    return (
                      <tr key={idx} style={{ fontSize: 13 }}>
                        <td style={{ borderLeft: "none", textAlign: "center" }}>{no}</td>
                        <td style={{ textAlign: "center" }}>
                          {getVal(item, "Lotno", "lotNo", "stockNo")}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {getVal(item, "ShapeId", "shapeId", "shape")}
                        </td>
                        <td style={{ textAlign: "left" }}>
                          {fmt(getVal(item, "Carats", "carats", "weight"), 2)}
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
                        <td style={{ textAlign: "center" }}>
                          {getVal(item, "CertId", "certId", "lab")}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {fmtNum(getVal(item, "Rate", "rate"), 2)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {getVal(item, "CertificateNo", "certificateNo")}
                        </td>
                        <td style={{ textAlign: "center" }}>{disc}</td>
                        <td style={{ borderRight: "none", textAlign: "center" }}>
                          {fmtNum(getVal(item, "Amount", "amount"), 2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {isLastPage && (
              <>
                <div style={{ marginTop: 10 }} />

                {/* Total row — double horizontal borders like MVC print */}
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    borderTop: "2px solid #585858",
                    borderLeft: "2px solid #585858",
                    borderRight: "2px solid #585858",
                    borderBottom: "none"
                  }}
                >
                  <tbody>
                    <tr style={{ fontSize: 14 }}>
                      <td
                        style={{
                          width: 80,
                          borderRight: "2px solid #585858",
                          borderBottom: "2px solid #585858",
                          fontWeight: "bold",
                          padding: "4px 5px",
                          textAlign: "center"
                        }}
                      >
                        Total :
                      </td>
                      <td
                        style={{
                          borderBottom: "2px solid #585858",
                          padding: "4px 5px",
                          paddingLeft: 12,
                          fontWeight: "bold"
                        }}
                      >
                        {totalCts}
                      </td>
                      <td
                        style={{
                          borderBottom: "2px solid #585858",
                          textAlign: "right",
                          padding: "4px 5px",
                          paddingRight: 15,
                          fontWeight: "bold"
                        }}
                      >
                        {totalAmt}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {/* Second line under Total (double-border look) */}
                <div style={{ borderTop: "2px solid #585858", marginTop: 2 }} />

                {/* Acknowledgement box */}
                <div style={{ border: "2px solid #585858", marginTop: 0 }}>
                  <div style={{ height: 50, lineHeight: "50px", paddingLeft: 17 }}>
                    <strong
                      style={{
                        fontSize: 11,
                        borderBottom: "1px solid #585858",
                        fontWeight: "bold",
                        letterSpacing: "0.3px"
                      }}
                    >
                      ACKNOWLEDGEMENT OF ENTRUSTMENT
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    textAlign: "justify",
                    marginTop: 15,
                    lineHeight: 1.4,
                    wordSpacing: 5
                  }}
                >
                  {conditions}
                </div>

                <table style={{ width: "100%", marginTop: 80, borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "50%", textAlign: "left", verticalAlign: "top" }}>
                        <div style={{ width: 200 }}>
                          <div style={{ borderTop: "2px solid #585858" }} />
                          <div style={{ fontSize: 12, marginTop: 4, textAlign: "center" }}>
                            Receiver&apos;s Sign
                          </div>
                        </div>
                      </td>
                      <td style={{ width: "50%", textAlign: "right", verticalAlign: "top" }}>
                        <div style={{ width: 200, marginLeft: "auto" }}>
                          <div style={{ borderTop: "2px solid #585858" }} />
                          <div style={{ fontSize: 12, marginTop: 4, textAlign: "center" }}>
                            {companyName}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default IndiaSingleFormat;
