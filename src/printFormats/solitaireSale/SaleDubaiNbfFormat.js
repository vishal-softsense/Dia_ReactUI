import React from "react";
import { FALLBACK_MEMO_CONDITIONS, fmt, fmtDateMMM, getVal, paginateVariable } from "../shared/printUtils";

const th = { border: "2px solid #454545", padding: 4, background: "#c0c0c0", textAlign: "center" };
const td = { border: "2px solid #454545", textAlign: "center" };
/** Last content column — no border-right; Edge cell paints the outer right line. */
const tdAmt = {
  borderTop: "2px solid #454545",
  borderBottom: "2px solid #454545",
  borderLeft: "2px solid #454545",
  borderRight: "none",
  textAlign: "right",
  paddingRight: 3
};
const thAmt = {
  ...th,
  padding: 2,
  borderRight: "none"
};
/**
 * Chrome print clips CSS border-right on full-width tables.
 * A 2px solid edge cell always paints (background), matching MVC right border.
 */
const edgeCol = {
  width: 2,
  minWidth: 2,
  maxWidth: 2,
  padding: 0,
  background: "#454545",
  border: "none",
  fontSize: 0,
  lineHeight: 0,
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact"
};

const Edge = () => <td className="sale-dubai-nbf-edge" style={edgeCol}>&nbsp;</td>;
const EdgeTh = () => <th className="sale-dubai-nbf-edge" style={edgeCol}>&nbsp;</th>;

const SaleDubaiNbfFormat = ({ data, items, totals, company, logoUrl }) => {
  // Single page holds up to 15 line items (same as Dubai Local/Export).
  const pages = paginateVariable(items, { single: 15, first: 30, middle: 40, last: 20 });
  const conditions = company.saleConditions || FALLBACK_MEMO_CONDITIONS;
  const rate = Number(getVal(data, "MasterCurrencyRate")) || 1;
  const taxAmt = (Number(getVal(data, "CGSTAmount")) || 0) + (Number(getVal(data, "SGSTAmount")) || 0) + (Number(getVal(data, "IGSTAmount")) || 0);
  const finalTax = rate ? taxAmt / rate : 0;
  const net = Number(getVal(data, "NetAmount")) || totals.amount;
  const usdFinal = getVal(data, "StockCurrencyFinalAmount") || fmt(net, 2);
  const aedFinal = getVal(data, "MasterCurrencyFinalAmount") || fmt(net * rate, 2);

  return (
    <div
      className="sale-dubai-nbf-root"
      style={{
        fontFamily: "Verdana, Arial, sans-serif",
        fontSize: 13,
        color: "#000",
        width: "100%",
        maxWidth: 960,
        margin: "0 auto",
        background: "#fff",
        padding: 16,
        border: "1px solid #dee2e6",
        borderRadius: 8,
        boxSizing: "border-box"
      }}
    >
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          .sale-dubai-nbf-root {
            zoom: 0.90 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            overflow: visible !important;
          }
          .sale-dubai-nbf-page {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: visible !important;
          }
          .sale-dubai-nbf-items {
            width: 100% !important;
            border-collapse: collapse !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .sale-dubai-nbf-edge {
            width: 2px !important;
            min-width: 2px !important;
            max-width: 2px !important;
            padding: 0 !important;
            background: #454545 !important;
            border: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      {pages.map((pageItems, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === pages.length - 1;
        const itemsPerPage = isFirstPage && isLastPage ? 15 : isFirstPage ? 30 : isLastPage ? 20 : 40;
        let srNo = (items || []).indexOf(pageItems[0]) + 1 || 1;
        return (
          <div key={pageIdx} className={`sale-dubai-nbf-page${isLastPage ? "" : " page-break"}`}>
            <table style={{ width: "100%", marginBottom: 4 }}>
              <tbody>
                <tr>
                  <td style={{ width: "20%", verticalAlign: "middle" }}>
                    {logoUrl ? <img src={logoUrl} alt="Logo" width={100} height={80} /> : null}
                  </td>
                  <td style={{ width: "47%", verticalAlign: "top", fontSize: 13 }}>
                    <div style={{ fontWeight: "bold", fontSize: 20 }}>{company.companyName}</div>
                    <div style={{ marginTop: 2, width: 250 }}>{company.companyAddress}</div>
                  </td>
                  <td style={{ width: "33%", verticalAlign: "top", padding: "4px 0 4px 10px", fontSize: 11, fontWeight: "bold" }}>
                    Tel : {company.companyPhone}<br />
                    Fax : {getVal(data, "CompanyFax")}<br />
                    Mobile : {getVal(data, "CompanyMob")}<br />
                    Email : {company.companyEmail}<br />
                    Website : {getVal(data, "CompanyWebsite")}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td style={{ paddingTop: 6, fontSize: 11 }}><b>Tax Registration Number :&nbsp; {getVal(data, "CompanyTaxRegNumber")}</b></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div style={{ background: "#000", color: "#fff", margin: "6px 0", textAlign: "center", fontFamily: "Calibri", fontSize: 13, fontWeight: "bold" }}>
              Diamond & Diamond Studded Jewellery Exporters, Importers & Manufacturers
            </div>
            {isFirstPage && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <tbody>
                  <tr>
                    <td colSpan={2} style={{ textAlign: "center", fontWeight: "bold", padding: "2px 0", fontSize: 13 }}>TAX INVOICE</td>
                  </tr>
                  <tr>
                    <td style={{ width: "65%", verticalAlign: "top" }}>
                      <table style={{ width: "100%" }}>
                        <tbody>
                          <tr><td style={{ width: 140, padding: "1px 0" }}>Invoice No :</td><td style={{ fontWeight: "bold" }}>{getVal(data, "InvNo")}</td></tr>
                          <tr><td style={{ padding: "1px 0" }}>To,</td><td style={{ fontWeight: "bold" }}>{getVal(data, "PartyName")}</td></tr>
                          <tr><td style={{ padding: "1px 0" }}>Address :</td><td style={{ fontWeight: "bold" }}>{getVal(data, "AddressLine1")}</td></tr>
                          <tr>
                            <td style={{ padding: "1px 0" }}>TRN No :</td><td style={{ fontWeight: "bold" }}>{getVal(data, "TRNNo")}</td>
                            <td style={{ padding: "1px 0" }}>Country of Origin:</td><td style={{ fontWeight: "bold" }}>{getVal(data, "CountryCode")}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: "1px 0" }}>Contact No :</td><td style={{ fontWeight: "bold" }}>{getVal(data, "Mobile")}</td>
                            <td style={{ padding: "1px 0" }}>Contact Person :</td><td style={{ fontWeight: "bold" }}>{getVal(data, "ContactPerson")}</td>
                          </tr>
                          <tr><td style={{ paddingTop: 2 }}>Description :</td><td></td></tr>
                        </tbody>
                      </table>
                    </td>
                    <td style={{ width: "35%", verticalAlign: "top" }}>
                      <table style={{ width: "100%" }}>
                        <tbody>
                          <tr><td style={{ width: 130, padding: "1px 0" }}>Invoice Date :</td><td style={{ fontWeight: "bold" }}>{fmtDateMMM(getVal(data, "TrnDate"))}</td></tr>
                          <tr><td style={{ padding: "1px 0" }}>Terms :</td><td style={{ fontWeight: "bold" }}>{getVal(data, "DueDays")}</td></tr>
                          <tr><td style={{ padding: "1px 0" }}>Due Date :</td><td style={{ fontWeight: "bold" }}>{fmtDateMMM(getVal(data, "DueDate"))}</td></tr>
                          <tr><td style={{ padding: "1px 0" }}>Through :</td><td style={{ fontWeight: "bold" }}>{getVal(data, "Through")}</td></tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
            {!isFirstPage && (
              <div style={{ fontSize: 10, margin: "4px 0" }}>
                <span style={{ float: "left" }}>Invoice No: <b>{getVal(data, "InvNo")}</b></span>
                <span style={{ float: "right" }}>Invoice Date:<b> {fmtDateMMM(getVal(data, "TrnDate"))}</b></span>
              </div>
            )}
            <table className="sale-dubai-nbf-items" style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginTop: 6 }}>
              <thead>
                <tr style={{ fontSize: 10 }}>
                  {["Sr.No.", "Lot No.", "Description", "RapPrice", "Discount", "Pkts", "Carats", "Price/Cts(US $)", "Amount(US $)"].map((h, hi, arr) => (
                    <th key={h} style={hi === arr.length - 1 ? thAmt : { ...th, padding: 2 }}>{h}</th>
                  ))}
                  <EdgeTh />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => (
                  <tr key={idx} style={{ fontSize: 12, height: 18 }}>
                    <td style={td}>{srNo++}</td>
                    <td style={td}>{getVal(item, "Lotno", "lotNo", "StockNo", "stockNo")}</td>
                    <td style={td}>{getVal(item, "Description", "description", "ItemName", "itemName")}</td>
                    <td style={td}>{fmt(getVal(item, "MRP", "Rap", "rap"), 2)}</td>
                    <td style={td}>{fmt(getVal(item, "PMRPDown", "Back", "back"), 2)}</td>
                    <td style={td}>{getVal(item, "Pcs", "pcs", "Qty", "qty")}</td>
                    <td style={td}>{fmt(getVal(item, "Carats", "carats", "Weight", "weight"), 2)}</td>
                    <td style={{ ...td, textAlign: "right", paddingRight: 3 }}>{fmt(getVal(item, "Rate"), 2)}</td>
                    <td style={tdAmt}>{fmt(getVal(item, "Amount"), 2)}</td>
                    <Edge />
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, itemsPerPage - pageItems.length) }).map((_, i) => {
                  const lastEmpty = i === itemsPerPage - pageItems.length - 1;
                  return (
                    <tr key={`e-${i}`} style={{ height: 18 }}>
                      {Array.from({ length: 9 }).map((__, c) => (
                        <td
                          key={c}
                          style={{
                            height: 18,
                            borderTop: "none",
                            borderBottom: lastEmpty ? "2px solid #454545" : "none",
                            borderLeft: "2px solid #454545",
                            borderRight: c === 8 ? "none" : "2px solid #454545"
                          }}
                        >
                          &nbsp;
                        </td>
                      ))}
                      <Edge />
                    </tr>
                  );
                })}
                {isLastPage && (
                  <>
                    <tr style={{ fontWeight: "bold" }}>
                      <td style={{ borderTop: "2px solid #454545", borderLeft: "2px solid #454545", borderRight: "2px solid #454545" }}></td>
                      <td style={{ borderTop: "2px solid #454545", borderLeft: "2px solid #454545", borderRight: "2px solid #454545" }}></td>
                      <td style={{ borderTop: "2px solid #454545", borderLeft: "2px solid #454545", borderRight: "2px solid #454545" }}></td>
                      <td style={{ borderTop: "2px solid #454545", borderLeft: "2px solid #454545", borderRight: "2px solid #454545" }}></td>
                      <td style={{ borderTop: "2px solid #454545", borderLeft: "2px solid #454545", borderRight: "2px solid #454545" }}></td>
                      <td style={{ borderTop: "2px solid #454545", borderLeft: "2px solid #454545", borderRight: "2px solid #454545" }}></td>
                      <td style={td}>{fmt(totals.wt, 2)}</td>
                      <td style={{ ...td, fontSize: 10 }}>Total</td>
                      <td style={tdAmt}>{fmt(totals.amount, 2)}</td>
                      <Edge />
                    </tr>
                    <tr style={{ fontWeight: "bold", height: 25 }}>
                      <td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td>
                      <td colSpan={3} style={{ ...td, textAlign: "right", paddingRight: 5 }}>1 USD = {fmt(rate, 2)} AED</td>
                      <td style={{ ...td, fontSize: 10, textAlign: "center" }}>Total USD</td>
                      <td style={{ ...tdAmt, textAlign: "center", fontSize: 10 }}>Total AED</td>
                      <Edge />
                    </tr>
                    <tr>
                      <td colSpan={5} style={{ border: "none", fontSize: 10, paddingTop: 6 }}>Amount in Words : <b>AED {getVal(data, "AmountWords")}.</b></td>
                      <td colSpan={2} style={{ ...td, fontWeight: "bold", textAlign: "center" }}>Gross Amount</td>
                      <td style={{ ...td, fontWeight: "bold", textAlign: "center" }}>{fmt(net, 2)}</td>
                      <td style={{ ...tdAmt, fontWeight: "bold", textAlign: "center" }}>{fmt(net * rate, 2)}</td>
                      <Edge />
                    </tr>
                    <tr>
                      <td colSpan={5} style={{ border: "none", fontSize: 10 }}>Payment Details :</td>
                      <td colSpan={2} style={{ ...td, fontWeight: "bold", textAlign: "center" }}>Tax Amount</td>
                      <td style={{ ...td, fontWeight: "bold", textAlign: "center" }}>{fmt(finalTax, 2)}</td>
                      <td style={{ ...tdAmt, fontWeight: "bold", textAlign: "center" }}>{fmt(finalTax * rate, 2)}</td>
                      <Edge />
                    </tr>
                    <tr>
                      <td style={{ border: "none", fontSize: 10 }}><b>Company Name</b></td>
                      <td style={{ border: "none", fontSize: 10 }}><b>- {company.companyName}</b></td>
                      <td style={{ border: "none" }}></td><td style={{ border: "none" }}></td><td style={{ border: "none" }}></td>
                      <td colSpan={2} style={{ ...td, fontWeight: "bold", textAlign: "center" }}>Total Amount</td>
                      <td style={{ ...td, fontWeight: "bold", textAlign: "center" }}>{usdFinal}</td>
                      <td style={{ ...tdAmt, fontWeight: "bold", textAlign: "center" }}>{aedFinal}</td>
                      <Edge />
                    </tr>
                    <tr>
                      <td style={{ border: "none", fontSize: 10 }}><b>Account Number</b></td>
                      <td style={{ border: "none", fontSize: 10 }}><b>- {getVal(data, "BankAccNo")}</b></td>
                      <td colSpan={8} style={{ border: "none" }}></td>
                    </tr>
                    <tr>
                      <td style={{ border: "none", fontSize: 10 }}><b>Swift Code</b></td>
                      <td style={{ border: "none", fontSize: 10 }}><b>- {getVal(data, "SwiftCode")}</b></td>
                      <td colSpan={8} style={{ border: "none" }}></td>
                    </tr>
                    <tr>
                      <td style={{ border: "none", fontSize: 10 }}><b>Bank Name</b></td>
                      <td style={{ border: "none", fontSize: 10 }}><b>- {getVal(data, "bnm", "BankName")}</b></td>
                      <td colSpan={8} style={{ border: "none" }}></td>
                    </tr>
                    <tr>
                      <td style={{ border: "none", fontSize: 10 }}><b>Bank Address</b></td>
                      <td style={{ border: "none", fontSize: 10 }}><b>- {getVal(data, "BankAddress1")}</b></td>
                      <td colSpan={8} style={{ border: "none" }}></td>
                    </tr>
                    <tr>
                      <td style={{ border: "none", fontSize: 10 }}><b>Iban No</b></td>
                      <td style={{ border: "none", fontSize: 10 }}><b>- {getVal(data, "IbanNo")}</b></td>
                      <td colSpan={8} style={{ border: "none" }}></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            {isLastPage && (
              <>
                <div style={{ marginBottom: 5 }}>
                  <div style={{ fontSize: 10, marginTop: 5, textAlign: "justify", marginLeft: 12, fontWeight: "bold" }}>Declaration:</div>
                  <div style={{ fontSize: 10, marginTop: 5, textAlign: "justify", marginLeft: 12, fontFamily: "Segoe UI" }}>{conditions}</div>
                </div>
                <table style={{ width: "100%", marginTop: 80, marginBottom: 10, fontFamily: "Calibri", fontSize: 12 }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "40%", verticalAlign: "top" }}>
                        <div style={{ borderTop: "2px solid #000", width: "94%", marginBottom: 5 }} />
                        <div><b>Buyer's signature & Co. Stamp confirming the purchase of above<br />mentioned goods as per terms set out.</b></div>
                      </td>
                      <td style={{ width: "20%", textAlign: "center", verticalAlign: "top" }}>
                        <div style={{ fontWeight: "bold", fontSize: 16 }}>THANK YOU</div>
                        <div style={{ fontSize: 13, marginTop: 7 }}>FOR DOING BUSINESS WITH US</div>
                      </td>
                      <td style={{ width: "40%", textAlign: "center", verticalAlign: "top", fontWeight: "bold", fontSize: 15 }}>For {company.companyName}</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ background: "#000", color: "#fff", margin: "2px 0", textAlign: "center", fontFamily: "Calibri", fontSize: 14, fontWeight: "bold" }}>
                  The right source for quality & consistency…
                </div>
              </>
            )}
            <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 11 }}>Page {pageIdx + 1} of {pages.length}</div>
          </div>
        );
      })}
    </div>
  );
};

export default SaleDubaiNbfFormat;
