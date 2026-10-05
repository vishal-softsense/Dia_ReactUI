import React from "react";
import {
  FALLBACK_MEMO_CONDITIONS,
  fmt,
  fmtDateMMM,
  fmtNum,
  getVal,
  paginateWithLastCap
} from "../shared/printUtils";

/**
 * MVC: SoSale_Dubai_Local.cshtml
 * - ≤30 records → 1 page (header + rows + totals + payment + footer)
 * - Multi-page: full pages 30 rows; last page ≤21 rows + totals + footer
 * Fonts match MVC: Verdana/Arial 13 body, table header 10, data rows 13
 */
const PAGE_SIZE = 30;
const LAST_PAGE_SIZE = 21;
const COL_COUNT = 8;
const FONT = "Verdana, Arial, sans-serif";

const th = {
  border: "2px solid #454545",
  padding: 4,
  background: "#c0c0c0",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: 10,
  fontFamily: FONT,
  color: "#000",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact"
};

const td = {
  border: "2px solid #454545",
  textAlign: "center",
  verticalAlign: "middle",
  height: 18,
  fontSize: 13,
  fontFamily: FONT,
  color: "#000",
  padding: "0 3px"
};

const SaleDubaiLocalFormat = ({ data, items, company, logoUrl }) => {
  const pages = paginateWithLastCap(items, PAGE_SIZE, LAST_PAGE_SIZE);
  const conditions = company.saleConditions || FALLBACK_MEMO_CONDITIONS;
  const list = items || [];

  const rate = Number(getVal(data, "MasterCurrencyRate", "masterCurrencyRate")) || 1;
  const taxAmt =
    (Number(getVal(data, "CGSTAmount")) || 0) +
    (Number(getVal(data, "SGSTAmount")) || 0) +
    (Number(getVal(data, "IGSTAmount")) || 0);
  const finalTax = rate ? taxAmt / rate : 0;

  const totalWt = list.reduce(
    (s, it) => s + (Number(getVal(it, "Weight", "weight", "Carats", "carats")) || 0),
    0
  );
  const totalAmt = list.reduce(
    (s, it) => s + (Number(getVal(it, "Amount", "amount")) || 0),
    0
  );
  const net = Number(getVal(data, "NetAmount", "netAmount")) || totalAmt;
  const usdFinal =
    getVal(data, "StockCurrencyFinalAmount", "stockCurrencyFinalAmount") || fmtNum(net, 2);
  const aedFinal =
    getVal(data, "MasterCurrencyFinalAmount", "masterCurrencyFinalAmount") || fmtNum(net * rate, 2);

  const companyFax = getVal(data, "CompanyFax", "companyFax") || company.companyFax || "";
  const companyMob = getVal(data, "CompanyMob", "companyMob") || company.companyMob || company.companyPhone || "";
  const companyWebsite = getVal(data, "CompanyWebsite", "companyWebsite") || company.companyWebsite || "";
  const taxReg =
    getVal(data, "CompanyTaxRegNumber", "CompnyTaxRegisterNumber", "companyTaxRegNumber") ||
    company.companyTaxRegNumber ||
    "";

  return (
    <div className="sale-dubai-local-root" style={{ fontFamily: FONT, fontSize: 13, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === pages.length - 1;
        const fillTo = isLastPage ? Math.max(pageItems.length, LAST_PAGE_SIZE) : PAGE_SIZE;
        const emptyCount = Math.max(0, fillTo - pageItems.length);

        let srNo = 1;
        if (pageItems.length && items?.length) {
          const idx = items.indexOf(pageItems[0]);
          srNo = idx >= 0 ? idx + 1 : pageIdx * PAGE_SIZE + 1;
        }

        return (
          <div
            key={pageIdx}
            className={`sale-dubai-local-page${isLastPage ? "" : " page-break"}`}
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "10.4in",
              boxSizing: "border-box"
            }}
          >
            <div style={{ flex: "1 1 auto" }}>
              {/* HEADER — every page */}
              <table style={{ width: "100%", marginBottom: 8, borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "20%", verticalAlign: "middle" }}>
                      {logoUrl ? <img src={logoUrl} alt="Logo" width={120} height={100} style={{ objectFit: "contain" }} /> : null}
                    </td>
                    <td style={{ width: "47%", verticalAlign: "top", fontSize: 13 }}>
                      <div style={{ fontWeight: "bold", fontSize: 22 }}>{company.companyName}</div>
                      <div style={{ marginTop: 4, width: 250 }}>{company.companyAddress}</div>
                    </td>
                    <td style={{ width: "33%", verticalAlign: "top", padding: "8px 0 8px 10px", fontSize: 12, fontWeight: "bold" }}>
                      Tel : {company.companyPhone}
                      <br />
                      Fax : {companyFax}
                      <br />
                      Mobile : {companyMob}
                      <br />
                      Email : {company.companyEmail}
                      <br />
                      Website : {companyWebsite}
                    </td>
                  </tr>
                  <tr>
                    <td />
                    <td style={{ paddingTop: 10, fontSize: 12 }}>
                      <b>Tax Registration Number :&nbsp; {taxReg}</b>
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>

              <div
                style={{
                  background: "#000",
                  color: "#fff",
                  margin: "8px 0",
                  textAlign: "center",
                  fontFamily: "Calibri, Verdana, sans-serif",
                  fontSize: 14,
                  fontWeight: "bold",
                  padding: "4px 0",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact"
                }}
              >
                Diamond & Diamond Studded Jewellery Exporters, Importers & Manufacturers
              </div>

              {/* Invoice meta — first page only */}
              {isFirstPage && (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <tbody>
                    <tr>
                      <td colSpan={2} style={{ textAlign: "center", fontWeight: "bold", padding: "5px 0", fontSize: 14 }}>
                        TAX INVOICE
                      </td>
                    </tr>
                    <tr>
                      <td style={{ width: "65%", verticalAlign: "top" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            <tr>
                              <td style={{ width: 140, padding: "3px 0", height: 25 }}>Invoice No :</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "InvNo", "invNo")}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "3px 0", height: 25 }}>To,</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "PartyName", "partyName")}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "3px 0", height: 25 }}>Address :</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "AddressLine1", "addressLine1")}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "3px 0", height: 25 }}>TRN No :</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "TRNNo", "trnNo")}</td>
                              <td style={{ padding: "3px 0", height: 25, whiteSpace: "nowrap" }}>Country of Origin:</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "CountryCode", "countryCode")}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "3px 0", height: 25 }}>Contact No :</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "Mobile", "mobile")}</td>
                              <td style={{ padding: "3px 0", height: 25, whiteSpace: "nowrap" }}>Contact Person :</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "ContactPerson", "contactPerson")}</td>
                            </tr>
                            <tr>
                              <td style={{ paddingTop: 5, height: 25 }}>Description :</td>
                              <td style={{ fontWeight: "bold" }} />
                            </tr>
                          </tbody>
                        </table>
                      </td>
                      <td style={{ width: "35%", verticalAlign: "top" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            <tr>
                              <td style={{ width: 130, padding: "3px 0", height: 25 }}>Invoice Date :</td>
                              <td style={{ fontWeight: "bold" }}>{fmtDateMMM(getVal(data, "TrnDate", "trnDate"))}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "3px 0", height: 25 }}>Terms :</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "DueDays", "dueDays")}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "3px 0", height: 25 }}>Due Date :</td>
                              <td style={{ fontWeight: "bold" }}>{fmtDateMMM(getVal(data, "DueDate", "dueDate"))}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "3px 0", height: 25 }}>Through :</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "Through", "through")}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {!isFirstPage && (
                <div style={{ fontSize: 10, margin: "5px 0", overflow: "hidden" }}>
                  <span style={{ float: "left" }}>
                    Invoice No: <b>{getVal(data, "InvNo", "invNo")}</b>
                  </span>
                  <span style={{ float: "right" }}>
                    Invoice Date:<b> {fmtDateMMM(getVal(data, "TrnDate", "trnDate"))}</b>
                  </span>
                </div>
              )}

              {/* ITEM TABLE */}
              <table className="sale-dubai-local-item-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 12 }}>
                <thead>
                  <tr>
                    {["Sr.No.", "Description", "RapPrice", "Discount", "Pkts", "Carats", "Price/Cts(US $)", "Amount(US $)"].map((h) => (
                      <th key={h} style={th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={td}>{srNo++}</td>
                      <td style={td}>{getVal(item, "Description", "description", "ItemName", "itemName")}</td>
                      <td style={td}>{fmt(getVal(item, "MRP", "mrp", "Rap", "rap"), 2)}</td>
                      <td style={td}>{fmt(getVal(item, "PMRPDown", "pmrpDown", "Back", "back", "Discount"), 2)}</td>
                      <td style={td}>{getVal(item, "Qty", "qty", "Pcs", "pcs")}</td>
                      <td style={td}>{fmt(getVal(item, "Weight", "weight", "Carats", "carats"), 2)}</td>
                      <td style={{ ...td, textAlign: "right", paddingRight: 4 }}>
                        {fmtNum(getVal(item, "Rate", "rate", "PricePerCarat", "pricePerCarat"), 2)}
                      </td>
                      <td style={{ ...td, textAlign: "right", paddingRight: 4 }}>
                        {fmtNum(getVal(item, "Amount", "amount"), 2)}
                      </td>
                    </tr>
                  ))}

                  {Array.from({ length: emptyCount }).map((_, i) => {
                    const lastEmpty = i === emptyCount - 1;
                    return (
                      <tr key={`e-${i}`} style={{ height: 18 }}>
                        {Array.from({ length: COL_COUNT }).map((__, c) => (
                          <td
                            key={c}
                            style={{
                              height: 18,
                              borderTop: "none",
                              borderBottom: lastEmpty ? "2px solid #454545" : "none",
                              borderLeft: "2px solid #454545",
                              borderRight: "2px solid #454545"
                            }}
                          >
                            &nbsp;
                          </td>
                        ))}
                      </tr>
                    );
                  })}

                  {isLastPage && (
                    <>
                      <tr style={{ fontWeight: "bold" }}>
                        <td style={{ borderTop: "2px solid #454545", borderLeft: "2px solid #454545" }} />
                        <td style={{ borderTop: "2px solid #454545" }} />
                        <td style={{ borderTop: "2px solid #454545" }} />
                        <td style={{ borderTop: "2px solid #454545" }} />
                        <td style={{ borderTop: "2px solid #454545" }} />
                        <td style={td}>{fmtNum(totalWt, 2)}</td>
                        <td style={{ ...td, fontSize: 10 }}>Total</td>
                        <td style={{ ...td, textAlign: "right", paddingRight: 4 }}>{fmtNum(totalAmt, 2)}</td>
                      </tr>
                      <tr style={{ fontWeight: "bold", height: 25 }}>
                        <td style={td} />
                        <td style={td} />
                        <td style={td} />
                        <td colSpan={3} style={{ ...td, textAlign: "right", paddingRight: 5 }}>
                          1 USD = {fmt(rate, 2)} AED
                        </td>
                        <td style={{ ...td, fontSize: 10 }}>Total USD</td>
                        <td style={{ ...td, fontSize: 10 }}>Total AED</td>
                      </tr>
                      <tr>
                        <td colSpan={4} style={{ border: "none", fontSize: 10, paddingTop: 6, verticalAlign: "top" }}>
                          Amount in Words : <b style={{ fontSize: 10 }}>AED {getVal(data, "AmountWords", "amountWords")}.</b>
                        </td>
                        <td colSpan={2} style={{ ...td, fontWeight: "bold", whiteSpace: "nowrap" }}>
                          Gross Amount
                        </td>
                        <td style={{ ...td, fontWeight: "bold" }}>{fmtNum(net, 2)}</td>
                        <td style={{ ...td, fontWeight: "bold" }}>{fmtNum(net * rate, 2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={4} style={{ border: "none", fontSize: 10, paddingTop: 6 }}>
                          Payment Details :
                        </td>
                        <td colSpan={2} style={{ ...td, fontWeight: "bold", whiteSpace: "nowrap" }}>
                          Tax Amount
                        </td>
                        <td style={{ ...td, fontWeight: "bold" }}>{fmtNum(finalTax, 2)}</td>
                        <td style={{ ...td, fontWeight: "bold" }}>{fmtNum(finalTax * rate, 2)}</td>
                      </tr>
                      <tr>
                        <td style={{ border: "none", fontSize: 10 }}>
                          <b>Company Name</b>
                        </td>
                        <td style={{ border: "none", fontSize: 10 }}>
                          <b>- {company.companyName}</b>
                        </td>
                        <td />
                        <td />
                        <td colSpan={2} style={{ ...td, fontWeight: "bold", whiteSpace: "nowrap" }}>
                          Total Amount
                        </td>
                        <td style={{ ...td, fontWeight: "bold" }}>{usdFinal}</td>
                        <td style={{ ...td, fontWeight: "bold" }}>{aedFinal}</td>
                      </tr>
                      <tr>
                        <td style={{ border: "none", fontSize: 10 }}>
                          <b>Account Number</b>
                        </td>
                        <td style={{ border: "none", fontSize: 10 }}>
                          <b>- {getVal(data, "BankAccNo", "bankAccNo")}</b>
                        </td>
                        <td colSpan={4} style={{ border: "none" }} />
                      </tr>
                      <tr>
                        <td style={{ border: "none", fontSize: 10 }}>
                          <b>Swift Code</b>
                        </td>
                        <td style={{ border: "none", fontSize: 10 }}>
                          <b>- {getVal(data, "SwiftCode", "swiftCode")}</b>
                        </td>
                        <td colSpan={4} style={{ border: "none" }} />
                      </tr>
                      <tr>
                        <td style={{ border: "none", fontSize: 10 }}>
                          <b>Bank Name</b>
                        </td>
                        <td style={{ border: "none", fontSize: 10 }}>
                          <b>- {getVal(data, "bnm", "BankName", "bankName")}</b>
                        </td>
                        <td colSpan={4} style={{ border: "none" }} />
                      </tr>
                      <tr>
                        <td style={{ border: "none", fontSize: 10 }}>
                          <b>Bank Address</b>
                        </td>
                        <td style={{ border: "none", fontSize: 10 }}>
                          <b>- {getVal(data, "BankAddress1", "bankAddress1")}</b>
                        </td>
                        <td colSpan={4} style={{ border: "none" }} />
                      </tr>
                      <tr>
                        <td style={{ border: "none", fontSize: 10 }}>
                          <b>Iban No</b>
                        </td>
                        <td style={{ border: "none", fontSize: 10 }}>
                          <b>- {getVal(data, "IbanNo", "ibanNo")}</b>
                        </td>
                        <td colSpan={4} style={{ border: "none" }} />
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER — last page, pinned bottom */}
            {isLastPage && (
              <div className="sale-dubai-local-footer" style={{ flex: "0 0 auto", marginTop: "auto", paddingTop: 8 }}>
                <div
                  style={{
                    fontSize: 10,
                    marginTop: 4,
                    textAlign: "justify",
                    marginLeft: 8,
                    fontFamily: "Segoe UI, Verdana, sans-serif",
                    lineHeight: 1.35
                  }}
                >
                  {conditions}
                </div>

                <table style={{ width: "100%", marginTop: 28, marginBottom: 8, fontFamily: "Calibri, Verdana, sans-serif", fontSize: 12 }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "40%", verticalAlign: "top" }}>
                        <div style={{ borderTop: "2px solid #000", width: "94%", marginBottom: 5 }} />
                        <div>
                          <b>
                            Buyer&apos;s signature &amp; Co. Stamp confirming the purchase of above
                            <br />
                            mentioned goods as per terms set out.
                          </b>
                        </div>
                      </td>
                      <td style={{ width: "20%", textAlign: "center", verticalAlign: "top" }}>
                        <div style={{ fontWeight: "bold", fontSize: 16 }}>THANK YOU</div>
                        <div style={{ fontSize: 13, marginTop: 7 }}>FOR DOING BUSINESS WITH US</div>
                      </td>
                      <td style={{ width: "40%", textAlign: "center", verticalAlign: "top", fontSize: 15, fontWeight: "bold" }}>
                        For {company.companyName}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div
                  style={{
                    background: "#000",
                    color: "#fff",
                    margin: "2px 0",
                    textAlign: "center",
                    fontFamily: "Calibri, Verdana, sans-serif",
                    fontSize: 14,
                    fontWeight: "bold",
                    padding: "4px 0",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact"
                  }}
                >
                  The right source for quality & consistency…
                </div>
              </div>
            )}

            <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 12, marginTop: 4 }}>
              Page {pageIdx + 1} of {pages.length}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SaleDubaiLocalFormat;
