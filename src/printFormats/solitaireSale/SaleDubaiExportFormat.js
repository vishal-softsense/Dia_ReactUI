import React from "react";
import { FALLBACK_MEMO_CONDITIONS, fmt, fmtDateMMM, getVal, paginateVariable } from "../shared/printUtils";

const th = { border: "2px solid #454545", padding: 4, background: "#c0c0c0", textAlign: "center" };
const td = { border: "2px solid #454545", textAlign: "center" };

const SaleDubaiExportFormat = ({ data, items, totals, company, logoUrl }) => {
  const pages = paginateVariable(items, { single: 15, first: 30, middle: 40, last: 20 });
  const conditions = company.saleConditions || FALLBACK_MEMO_CONDITIONS;
  const rate = Number(getVal(data, "MasterCurrencyRate")) || 1;
  const taxAmt = (Number(getVal(data, "CGSTAmount")) || 0) + (Number(getVal(data, "SGSTAmount")) || 0) + (Number(getVal(data, "IGSTAmount")) || 0);
  const finalTax = rate ? taxAmt / rate : 0;
  const net = Number(getVal(data, "NetAmount")) || totals.amount;
  const usdFinal = getVal(data, "StockCurrencyFinalAmount") || fmt(net, 2);
  const aedFinal = getVal(data, "MasterCurrencyFinalAmount") || fmt(net * rate, 2);

  return (
    <div style={{ fontFamily: "Verdana, Arial, sans-serif", fontSize: 13, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === pages.length - 1;
        const itemsPerPage = isFirstPage && isLastPage ? 15 : isFirstPage ? 30 : isLastPage ? 20 : 40;
        let srNo = (items || []).indexOf(pageItems[0]) + 1 || 1;
        return (
          <div key={pageIdx} className={isLastPage ? "" : "page-break"}>
            <table style={{ width: "100%", marginBottom: 10 }}>
              <tbody>
                <tr>
                  <td style={{ width: "20%", verticalAlign: "middle" }}>
                    {logoUrl ? <img src={logoUrl} alt="Logo" width={120} height={100} /> : null}
                  </td>
                  <td style={{ width: "47%", verticalAlign: "top", fontSize: 13 }}>
                    <div style={{ fontWeight: "bold", fontSize: 22 }}>{company.companyName}</div>
                    <div style={{ marginTop: 4, width: 250 }}>{company.companyAddress}</div>
                  </td>
                  <td style={{ width: "33%", verticalAlign: "top", padding: "8px 0 8px 10px", fontSize: 12, fontWeight: "bold" }}>
                    Tel : {company.companyPhone}<br />
                    Fax : {getVal(data, "CompanyFax")}<br />
                    Mobile : {getVal(data, "CompanyMob")}<br />
                    Email : {company.companyEmail}<br />
                    Website : {getVal(data, "CompanyWebsite")}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td style={{ paddingTop: 12, fontSize: 12 }}><b>Tax Registration Number :&nbsp; {getVal(data, "CompanyTaxRegNumber")}</b></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div style={{ background: "#000", color: "#fff", margin: "10px 0", textAlign: "center", fontFamily: "Calibri", fontSize: 14, fontWeight: "bold" }}>
              Diamond & Diamond Studded Jewellery Exporters, Importers & Manufacturers
            </div>
            {isFirstPage && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <tbody>
                  <tr>
                    <td colSpan={2} style={{ textAlign: "center", fontWeight: "bold", padding: "3px 0", fontSize: 13 }}>TAX INVOICE</td>
                  </tr>
                  <tr>
                    <td style={{ width: "65%", verticalAlign: "top" }}>
                      <table style={{ width: "100%" }}>
                        <tbody>
                          <tr><td style={{ width: 130, padding: "3px 0" }}>Invoice No :</td><td style={{ fontWeight: "bold" }}>{getVal(data, "InvNo")}</td></tr>
                          <tr><td style={{ padding: "2px 0" }}>To,</td><td style={{ fontWeight: "bold" }}>{getVal(data, "PartyName")}</td></tr>
                          <tr><td style={{ padding: "2px 0" }}>Address :</td><td style={{ fontWeight: "bold" }}>{getVal(data, "AddressLine1")}</td></tr>
                          <tr><td style={{ padding: "8px 0" }}>TRN No :</td><td style={{ fontWeight: "bold" }}>{getVal(data, "TRNNo")}</td></tr>
                          <tr><td style={{ padding: "2px 0" }}>Contact No :</td><td style={{ fontWeight: "bold" }}>{getVal(data, "Mobile")}</td></tr>
                          <tr><td style={{ padding: "2px 0" }}>Contact Person :</td><td style={{ fontWeight: "bold" }}>{getVal(data, "ContactPerson")}</td></tr>
                          <tr>
                            <td colSpan={2} style={{ paddingTop: 2 }}>
                              Description : &nbsp; Country of Origin : <b>{getVal(data, "CountryCode")}</b>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td style={{ width: "35%", verticalAlign: "top" }}>
                      <table style={{ width: "100%" }}>
                        <tbody>
                          <tr><td style={{ width: 130, padding: "3px 0" }}>Invoice Date :</td><td style={{ fontWeight: "bold" }}>{fmtDateMMM(getVal(data, "TrnDate"))}</td></tr>
                          <tr><td style={{ padding: "3px 0" }}>Terms :</td><td style={{ fontWeight: "bold" }}>{getVal(data, "DueDays")}</td></tr>
                          <tr><td style={{ padding: "3px 0" }}>Due Date :</td><td style={{ fontWeight: "bold" }}>{fmtDateMMM(getVal(data, "DueDate"))}</td></tr>
                          <tr><td style={{ padding: "3px 0" }}>Through :</td><td style={{ fontWeight: "bold" }}>{getVal(data, "Through")}</td></tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
            {!isFirstPage && (
              <div style={{ fontSize: 10, margin: "5px 0" }}>
                <span style={{ float: "left" }}>Invoice No: <b>{getVal(data, "InvNo")}</b></span>
                <span style={{ float: "right" }}>Invoice Date:<b> {fmtDateMMM(getVal(data, "TrnDate"))}</b></span>
              </div>
            )}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 15 }}>
              <thead>
                <tr style={{ fontSize: 10 }}>
                  {["Sr.No.", "Lot No.", "Description", "RapPrice", "Discount", "Pkts", "Carats", "Price/Cts(US $)", "Amount(US $)"].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => (
                  <tr key={idx} style={{ fontSize: 13 }}>
                    <td style={td}>{srNo++}</td>
                    <td style={td}>{getVal(item, "Lotno", "lotNo")}</td>
                    <td style={td}>{getVal(item, "ItemName", "itemName")}</td>
                    <td style={td}>{fmt(getVal(item, "MRP", "Rap", "rap"), 2)}</td>
                    <td style={td}>{fmt(getVal(item, "PMRPDown", "Back", "back"), 2)}</td>
                    <td style={td}>{getVal(item, "Pcs", "pcs")}</td>
                    <td style={td}>{fmt(getVal(item, "Carats"), 2)}</td>
                    <td style={{ ...td, textAlign: "right", paddingRight: 3 }}>{fmt(getVal(item, "Rate"), 2)}</td>
                    <td style={{ ...td, textAlign: "right", paddingRight: 3 }}>{fmt(getVal(item, "Amount"), 2)}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, itemsPerPage - pageItems.length) }).map((_, i) => {
                  const lastEmpty = i === itemsPerPage - pageItems.length - 1;
                  return (
                    <tr key={`e-${i}`} style={{ height: 24 }}>
                      {Array.from({ length: 9 }).map((__, c) => (
                        <td key={c} style={{ height: 24, borderTop: "none", borderBottom: lastEmpty ? "2px solid #454545" : "none", borderLeft: "2px solid #454545", borderRight: "2px solid #454545" }}>&nbsp;</td>
                      ))}
                    </tr>
                  );
                })}
                {isLastPage && (
                  <>
                    <tr style={{ fontWeight: "bold" }}>
                      <td style={{ borderTop: "2px solid #454545", borderLeft: "2px solid #454545" }}></td>
                      <td style={{ borderTop: "2px solid #454545" }}></td>
                      <td style={{ borderTop: "2px solid #454545" }}></td>
                      <td style={{ borderTop: "2px solid #454545" }}></td>
                      <td style={{ borderTop: "2px solid #454545" }}></td>
                      <td style={{ borderTop: "2px solid #454545" }}></td>
                      <td style={td}>{fmt(totals.wt, 2)}</td>
                      <td style={{ ...td, fontSize: 10 }}>Total</td>
                      <td style={{ ...td, textAlign: "right", paddingRight: 3 }}>{fmt(totals.amount, 2)}</td>
                    </tr>
                    <tr style={{ fontWeight: "bold", height: 25 }}>
                      <td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td>
                      <td colSpan={3} style={{ ...td, textAlign: "right", paddingRight: 5 }}>1 USD = {fmt(rate, 2)} AED</td>
                      <td style={{ ...td, fontSize: 10 }}>Total USD</td>
                      <td style={{ ...td, fontSize: 10 }}>Total AED</td>
                    </tr>
                    <tr>
                      <td colSpan={5} style={{ border: "none", fontSize: 10, paddingTop: 6 }}>Amount in Words : <b>AED {getVal(data, "AmountWords")}.</b></td>
                      <td colSpan={2} style={{ ...td, fontWeight: "bold" }}>Gross Amount</td>
                      <td style={{ ...td, fontWeight: "bold" }}>{fmt(net, 2)}</td>
                      <td style={{ ...td, fontWeight: "bold" }}>{fmt(net * rate, 2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={5} style={{ border: "none", fontSize: 10 }}>Payment Details :</td>
                      <td colSpan={2} style={{ ...td, fontWeight: "bold" }}>Tax Amount</td>
                      <td style={{ ...td, fontWeight: "bold" }}>{fmt(finalTax, 2)}</td>
                      <td style={{ ...td, fontWeight: "bold" }}>{fmt(finalTax * rate, 2)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: "none", fontSize: 10 }}><b>Company Name</b></td>
                      <td style={{ border: "none", fontSize: 10 }}><b>- {company.companyName}</b></td>
                      <td></td><td></td><td></td>
                      <td colSpan={2} style={{ ...td, fontWeight: "bold" }}>Total Amount</td>
                      <td style={{ ...td, fontWeight: "bold" }}>{usdFinal}</td>
                      <td style={{ ...td, fontWeight: "bold" }}>{aedFinal}</td>
                    </tr>
                    <tr>
                      <td style={{ border: "none", fontSize: 10 }}><b>Account Number</b></td>
                      <td style={{ border: "none", fontSize: 10 }}><b>- {getVal(data, "BankAccNo")}</b></td>
                    </tr>
                    <tr>
                      <td style={{ border: "none", fontSize: 10 }}><b>Swift Code</b></td>
                      <td style={{ border: "none", fontSize: 10 }}><b>- {getVal(data, "SwiftCode")}</b></td>
                    </tr>
                    <tr>
                      <td style={{ border: "none", fontSize: 10 }}><b>Bank Name</b></td>
                      <td style={{ border: "none", fontSize: 10 }}><b>- {getVal(data, "bnm", "BankName")}</b></td>
                    </tr>
                    <tr>
                      <td style={{ border: "none", fontSize: 10 }}><b>Bank Address</b></td>
                      <td style={{ border: "none", fontSize: 10 }}><b>- {getVal(data, "BankAddress1")}</b></td>
                    </tr>
                    <tr>
                      <td style={{ border: "none", fontSize: 10 }}><b>Iban No</b></td>
                      <td style={{ border: "none", fontSize: 10 }}><b>- {getVal(data, "IbanNo")}</b></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            {isLastPage && (
              <>
                <div style={{ fontSize: 10, marginTop: 5, textAlign: "justify", marginLeft: 12, fontFamily: "Segoe UI" }}>{conditions}</div>
                <table style={{ width: "100%", marginTop: 42, marginBottom: 10, fontFamily: "Calibri", fontSize: 12 }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "40%", verticalAlign: "top" }}>
                        <div style={{ borderTop: "2px solid #000", width: "94%", marginBottom: 5 }} />
                        <div><b>Buyer's signature & Co. Stamp confirming the purchase of above<br />mentioned goods as per terms set out.</b></div>
                      </td>
                      <td style={{ width: "20%", textAlign: "center" }}>
                        <div style={{ fontWeight: "bold", fontSize: 16 }}>THANK YOU</div>
                        <div style={{ fontSize: 13, marginTop: 7 }}>FOR DOING BUSINESS WITH US</div>
                      </td>
                      <td style={{ width: "40%", textAlign: "center", fontWeight: "bold", fontSize: 15 }}>For {company.companyName}</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ background: "#000", color: "#fff", margin: "2px 0", textAlign: "center", fontFamily: "Calibri", fontSize: 14, fontWeight: "bold" }}>
                  The right source for quality & consistency…
                </div>
              </>
            )}
            <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 12 }}>Page {pageIdx + 1} of {pages.length}</div>
          </div>
        );
      })}
    </div>
  );
};

export default SaleDubaiExportFormat;
