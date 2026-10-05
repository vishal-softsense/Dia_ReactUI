import React from "react";
import { FALLBACK_MEMO_CONDITIONS, FALLBACK_USA_MEMO_INFORMATION, fmtNum, getVal } from "../shared/printUtils";

/**
 * Solitaire Memo USA_SiglePage Format — mirrors MVC
 * Views/Memo/SoMemoOutPrintInv_USASingle.cshtml (Rotativa Letter).
 * 25 records per page; single page when ≤25 (no empty 2nd page / bottom gap).
 */
const UsaSingleFormat = ({ data, items, totals, company, logoUrl }) => {
  const itemsPerPage = 25;
  const list = items || [];
  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage) || 1);

  // MVC amounts use MasterCurrencyAmount (N2)
  let totalQty = 0;
  let totalWt = 0;
  let totalMasterAmt = 0;
  list.forEach((it) => {
    totalQty += Number(getVal(it, "Pcs", "pcs", "Qty", "qty")) || 0;
    totalWt += Number(getVal(it, "Carats", "carats", "Weight", "weight")) || 0;
    const mAmt = getVal(it, "MasterCurrencyAmount", "masterCurrencyAmount");
    totalMasterAmt +=
      Number(mAmt !== "" && mAmt !== undefined && mAmt !== null ? mAmt : getVal(it, "Amount", "amount")) || 0;
  });
  if (!list.length && totals) {
    totalQty = Number(totals.qty) || 0;
    totalWt = Number(totals.wt) || 0;
    totalMasterAmt = Number(totals.amount) || 0;
  }

  const fmtDateOrZero = (val) => {
    if (!val) return "0.00";
    const s = String(val).trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return "0.00";
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${mm}/${dd}/${d.getFullYear()}`;
    } catch {
      return "0.00";
    }
  };

  const information =
    company?.information ||
    getVal(data, "Information", "information") ||
    FALLBACK_USA_MEMO_INFORMATION;
  const conditions = company?.memoConditions || FALLBACK_MEMO_CONDITIONS;
  const companyFooter = company?.companyFooter || "";

  const lineAmt = (item) => {
    const m = getVal(item, "MasterCurrencyAmount", "masterCurrencyAmount");
    if (m !== "" && m !== undefined && m !== null) return fmtNum(m, 2);
    return fmtNum(getVal(item, "Amount", "amount"), 2);
  };

  return (
    <div className="usa-single-print-container">
      <style>{`
        .usa-single-print-container {
          font-family: Verdana, Arial, sans-serif;
          font-size: 13px;
          color: #000;
          zoom: 0.98;
          background: #fff;
          box-sizing: border-box;
        }
        @media screen {
          .usa-single-print-container {
            width: 8.5in;
            max-width: 100%;
            min-height: 0;
            margin: 0 auto 24px;
            padding: 10mm;
            border: 1px solid #c8c8c8;
            box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
          }
          .usa-single-print-container .usa-single-sheet + .usa-single-sheet {
            margin-top: 20px;
          }
        }
        /* Compact print: 25 rows fit one Letter page; no forced empty gap */
        @media print {
          .usa-single-print-container {
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            zoom: 0.90 !important;
          }
          .usa-single-print-container .usa-single-sheet {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .usa-single-print-container .usa-single-sheet-last {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .usa-single-print-container .usa-logo {
            width: 70px !important;
          }
          .usa-single-print-container .address-box {
            height: 95px !important;
            padding: 4px 10px 6px 8px !important;
          }
          .usa-single-print-container .address-box div {
            line-height: 1.3 !important;
            margin-bottom: 1px !important;
            font-size: 11px !important;
          }
          .usa-single-print-container .usa-info-block {
            font-size: 11px !important;
            text-align: justify !important;
            height: 80px !important;
            min-height: 80px !important;
            max-height: none !important;
            margin: 13px 0 !important;
            line-height: 1.35 !important;
            overflow: visible !important;
            font-family: "Segoe UI", "Segoe UI Historic", sans-serif !important;
            width: 100% !important;
          }
          .usa-single-print-container .usa-meta-wrap {
            margin-bottom: 10px !important;
          }
          .usa-single-print-container .invoice-top-table th,
          .usa-single-print-container .invoice-item-table th {
            padding: 2px 0 !important;
            font-size: 10px !important;
          }
          .usa-single-print-container .invoice-top-table td,
          .usa-single-print-container .invoice-item-table td {
            height: 18px !important;
            padding: 0 3px !important;
            font-size: 10px !important;
            line-height: 1.15 !important;
          }
          .usa-single-print-container .invoice-item-table tbody tr.usa-item-row td {
            height: 19px !important;
            padding-top: 2px !important;
            padding-bottom: 2px !important;
          }
          .usa-single-print-container .invoice-item-table tbody tr.usa-item-row + tr.usa-item-row td {
            border-top: 1px solid #d8d8d8 !important;
          }
          .usa-single-print-container .usa-sign-block {
            margin-top: 15px !important;
            margin-bottom: 0 !important;
          }
          .usa-single-print-container .usa-conditions-block {
            font-size: 11px !important;
            text-align: justify !important;
            height: 80px !important;
            margin: 10px 0 !important;
            line-height: 1.35 !important;
            font-family: "Segoe UI", "Segoe UI Historic", sans-serif !important;
            overflow: visible !important;
          }
          .usa-single-print-container .footer-section {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          .usa-single-print-container .footer-section table {
            width: 100% !important;
            font-size: 12px !important;
          }
          .usa-single-print-container .footer-section td {
            width: 50% !important;
            padding: 0 !important;
            border: none !important;
          }
        }
        /* Information block — MVC between address boxes and meta table */
        .usa-single-print-container .usa-info-block {
          font-size: 11px;
          text-align: justify;
          height: 80px;
          margin: 13px 0;
          line-height: 1.35;
          width: 100%;
          font-family: "Segoe UI", "Segoe UI Historic", sans-serif;
        }
        .usa-single-print-container .usa-meta-wrap {
          margin-bottom: 10px;
        }
        .usa-single-print-container .address-box {
          border: 1px solid #000;
          border-radius: 12px;
          padding: 8px 15px 12px 10px;
          height: 150px;
          margin: 0;
        }
        .usa-single-print-container .address-box legend {
          font-weight: bold;
          font-size: 13px;
          padding: 0 10px;
          width: auto;
          margin-left: 10px;
          margin-bottom: 2px;
          background: #fff;
          border: none;
        }
        .usa-single-print-container .address-box div {
          line-height: 1.6;
          font-size: 12px;
          margin-bottom: 5px;
        }
        .usa-single-print-container .invoice-top-table,
        .usa-single-print-container .invoice-item-table {
          width: 100%;
          border-collapse: collapse;
        }
        .usa-single-print-container .invoice-top-table th,
        .usa-single-print-container .invoice-item-table th {
          background-color: #BFBFBF !important;
          border: 1px solid #000;
          padding: 6px 0;
          text-align: center;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .usa-single-print-container .invoice-top-table td,
        .usa-single-print-container .invoice-item-table td {
          border: 1px solid #000;
          padding: 0 6px;
          text-align: center;
          vertical-align: middle;
          height: 24px;
        }
        .usa-single-print-container .invoice-item-table td {
          border-left: 1px solid #000;
          border-right: 1px solid #000;
          border-top: none;
          border-bottom: none;
        }
        .usa-single-print-container .usa-sign-block {
          margin-top: 15px;
          margin-bottom: 0;
        }
        .usa-single-print-container .usa-sign-block span:first-child {
          font-size: 13px;
        }
        .usa-single-print-container .usa-sign-line {
          display: inline-block;
          border-bottom: 1px solid #000;
          width: 300px;
          margin-left: 10px;
          vertical-align: bottom;
        }
        .usa-single-print-container .usa-conditions-block {
          font-size: 11px;
          text-align: justify;
          height: 80px;
          margin: 10px 0;
          line-height: 1.35;
          font-family: "Segoe UI", "Segoe UI Historic", sans-serif;
        }
        .usa-single-print-container .footer-section {
          margin-top: 0;
        }
        .usa-single-print-container .footer-section table {
          width: 100%;
          border-collapse: collapse;
        }
        .usa-single-print-container .footer-section td {
          width: 50%;
          padding: 0;
          border: none;
          font-size: 12px;
        }
        /* Small vertical gap between data records */
        .usa-single-print-container .invoice-item-table tbody tr.usa-item-row td {
          height: 26px;
          padding-top: 3px;
          padding-bottom: 3px;
        }
        .usa-single-print-container .invoice-item-table tbody tr.usa-item-row + tr.usa-item-row td {
          border-top: 1px solid #e0e0e0;
        }
      `}</style>

      {Array.from({ length: totalPages }).map((_, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;
        const skip = pageIdx * itemsPerPage;
        const pageItems = list.slice(skip, skip + itemsPerPage);
        let srNo = skip + 1;
        // Pad empty rows only on non-last full pages; last page = real rows only (no empty gap)
        const emptyRowsCount = isLastPage
          ? 0
          : Math.max(0, itemsPerPage - pageItems.length);

        return (
          <div
            key={pageIdx}
            className={`usa-single-sheet${isFirstPage ? " usa-single-sheet-first" : ""}${isLastPage ? " usa-single-sheet-last" : ""}`}
          >
            {/* HEADER */}
            <table className="header-table" style={{ width: "100%", paddingBottom: 10 }}>
              <tbody>
                <tr>
                  <td style={{ width: "13%", verticalAlign: "top" }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="usa-logo" style={{ width: 90 }} />
                    ) : null}
                  </td>
                  <td style={{ width: "55%", verticalAlign: "top", fontSize: 12 }}>
                    <div style={{ fontWeight: "bold", fontSize: 14 }}>{company?.companyName}</div>
                    <div style={{ marginTop: 3 }}>{company?.companyAddress}</div>
                    <div>{company?.companyAddress1}</div>
                    <div>{company?.companyAddress2}</div>
                    <div style={{ marginTop: 5 }}>
                      <b>Tel:</b>
                      &nbsp;&nbsp;&nbsp;{company?.companyPhone}
                    </div>
                    <div style={{ marginTop: 5 }}>
                      <b>Email:</b>
                      &nbsp;&nbsp;{company?.companyEmail}
                    </div>
                  </td>
                  <td style={{ width: "32%", verticalAlign: "top" }}>
                    <div
                      style={{
                        textAlign: "left",
                        fontWeight: "bold",
                        fontSize: 24,
                        paddingTop: 5
                      }}
                    >
                      MEMORANDUM
                    </div>
                    <table style={{ width: "100%", fontSize: 13, marginTop: 10 }}>
                      <tbody>
                        <tr>
                          <td style={{ width: "40%" }}>
                            <b>Date :</b>
                          </td>
                          <td style={{ width: "5%" }}></td>
                          <td>{fmtDateOrZero(getVal(data, "TrnDate", "trnDate"))}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "5px 0" }}>
                            <b>Memo # :</b>
                          </td>
                          <td style={{ width: "5%", padding: "5px 0" }}></td>
                          <td style={{ padding: "5px 0" }}>{getVal(data, "InvNo", "invNo")}</td>
                        </tr>
                        <tr>
                          <td>
                            <b>Printed On :</b>
                          </td>
                          <td style={{ width: "5%" }}></td>
                          <td>{fmtDateOrZero(getVal(data, "RoundDate", "roundDate"))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Consigned To / Ship To */}
            <table className="usa-addr-table" style={{ width: "100%", marginTop: 10 }}>
              <tbody>
                <tr>
                  <td style={{ width: "50%", paddingRight: 20 }}>
                    <fieldset className="address-box">
                      <legend>Consigned To:</legend>
                      <div style={{ fontSize: 13 }}>{getVal(data, "PartyName", "partyName")}</div>
                      <div>{getVal(data, "AddressLine1", "addressLine1")}</div>
                      <div>{getVal(data, "AddressLine2", "addressLine2")}</div>
                      <div>{getVal(data, "AddressLine3", "addressLine3")}</div>
                    </fieldset>
                  </td>
                  <td style={{ width: "50%", paddingLeft: 20 }}>
                    <fieldset className="address-box">
                      <legend>Ship To:</legend>
                      <div style={{ fontSize: 13 }}>{getVal(data, "PartyName", "partyName")}</div>
                      <div>{getVal(data, "AddressLine1", "addressLine1")}</div>
                      <div>{getVal(data, "AddressLine2", "addressLine2")}</div>
                      <div>{getVal(data, "AddressLine3", "addressLine3")}</div>
                    </fieldset>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Information — MVC: font 11px, justify, height 80px, margin 13px 0, Segoe UI */}
            <div className="usa-info-block">{information}</div>

            {/* Meta table */}
            <div className="usa-meta-wrap" style={{ marginBottom: 10 }}>
              <table className="invoice-top-table" style={{ fontSize: 11 }}>
                <thead>
                  <tr style={{ fontWeight: "bold" }}>
                    <th>CONTACT</th>
                    <th>SALES PERSON</th>
                    <th>CUST ORDER #</th>
                    <th>SHIP VIA</th>
                    <th>TRACKING #</th>
                    <th>REPORT BY</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td></td>
                    <td>{getVal(data, "SalesPersons", "salesPersons")}</td>
                    <td></td>
                    <td>{getVal(data, "ShipVia", "shipVia")}</td>
                    <td>{getVal(data, "Tracking", "tracking")}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Items */}
            <table className="invoice-item-table">
              <thead>
                <tr style={{ fontSize: 12 }}>
                  <th>Sr No</th>
                  <th>Stock #</th>
                  <th>QTY</th>
                  <th>WT.</th>
                  <th>DESCRIPTION</th>
                  <th>Price/Carat</th>
                  <th>Amount US $</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => {
                  const no = srNo++;
                  return (
                    <tr key={idx} className="usa-item-row" style={{ fontSize: 11 }}>
                      <td>{no}</td>
                      <td style={{ textAlign: "left" }}>
                        {getVal(item, "Lotno", "lotNo", "StockNo", "stockNo")}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {getVal(item, "Pcs", "pcs", "Qty", "qty")}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {fmtNum(getVal(item, "Carats", "carats", "Weight", "weight"), 2)}
                      </td>
                      <td style={{ textAlign: "left" }}>
                        {getVal(item, "ItemName", "itemName", "Description", "description")}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {fmtNum(getVal(item, "Rate", "rate", "PricePerCarat", "pricePerCarat"), 2)}
                      </td>
                      <td style={{ textAlign: "right" }}>{lineAmt(item)}</td>
                    </tr>
                  );
                })}

                {Array.from({ length: emptyRowsCount }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="empty-row" style={{ borderBottom: "none" }}>
                    <td style={{ borderRight: "1px solid black", borderLeft: "1px solid black" }}>
                      &nbsp;
                    </td>
                    <td style={{ borderRight: "1px solid black" }}>&nbsp;</td>
                    <td style={{ borderRight: "1px solid black" }}>&nbsp;</td>
                    <td style={{ borderRight: "1px solid black" }}>&nbsp;</td>
                    <td style={{ borderRight: "1px solid black" }}>&nbsp;</td>
                    <td style={{ borderRight: "1px solid black" }}>&nbsp;</td>
                    <td style={{ borderRight: "1px solid black" }}>&nbsp;</td>
                  </tr>
                ))}

                {!isLastPage && (
                  <tr>
                    <td style={{ borderBottom: "1px solid #000" }}></td>
                    <td style={{ borderBottom: "1px solid #000" }}></td>
                    <td style={{ borderBottom: "1px solid #000" }}></td>
                    <td style={{ borderBottom: "1px solid #000" }}></td>
                    <td style={{ borderBottom: "1px solid #000" }}></td>
                    <td style={{ borderBottom: "1px solid #000" }}></td>
                    <td style={{ borderBottom: "1px solid #000" }}></td>
                  </tr>
                )}

                {isLastPage && (
                  <tr
                    style={{
                      borderTop: "1px solid black",
                      borderBottom: "1px solid black"
                    }}
                  >
                    <td></td>
                    <td></td>
                    <td style={{ textAlign: "right", verticalAlign: "top", fontSize: 13 }}>
                      {totalQty}
                    </td>
                    <td style={{ textAlign: "right", verticalAlign: "top", fontSize: 13 }}>
                      {fmtNum(totalWt, 2)}
                    </td>
                    <td></td>
                    <td style={{ paddingLeft: 10, fontSize: 12, lineHeight: 1.8, textAlign: "left" }}>
                      Sub Total
                      <br />
                      Charges
                      <br />
                      Discount
                      <br />
                      <b style={{ fontSize: 15 }}>TOTAL</b>
                    </td>
                    <td style={{ textAlign: "right", fontSize: 13, lineHeight: 1.8 }}>
                      {fmtNum(totalMasterAmt, 2)}
                      <br />
                      <br />
                      <br />
                      {fmtNum(totalMasterAmt, 2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Signature — MVC margin-top 15px */}
            <div className="usa-sign-block">
              <span>Signature:</span>
              <span className="usa-sign-line" />
            </div>

            {/* MemoConditions — MVC height 80px, margin 10px 0 */}
            <div className="usa-conditions-block">{conditions}</div>

            {/* Footer — MVC: companyFooter left, page no right */}
            <div className="footer-section">
              <table>
                <tbody>
                  <tr>
                    <td style={{ textAlign: "left" }}>{companyFooter}</td>
                    <td style={{ textAlign: "right" }}>{pageIdx + 1}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UsaSingleFormat;
