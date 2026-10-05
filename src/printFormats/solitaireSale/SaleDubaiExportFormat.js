import React from "react";
import {
  FALLBACK_MEMO_CONDITIONS,
  fmt,
  fmtNum,
  getVal,
  paginateWithLastCap
} from "../shared/printUtils";

/**
 * MVC: SoSale_Dubai_Export.cshtml
 * - ≤30 records → 1 page (header + rows + totals + payment + footer)
 * - Multi-page: full pages 30 rows; last page ≤21 rows + totals + footer
 * Fonts: Verdana/Arial — body 13, th 10, data 13 (MVC same)
 */
const PAGE_SIZE = 30;
const LAST_PAGE_SIZE = 21;
const COL_COUNT = 9;
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
  height: 16,
  fontSize: 13,
  fontFamily: FONT,
  color: "#000",
  padding: "0 3px"
};

/** MVC: dd-MMMM-yyyy (e.g. 23-September-2026) */
const fmtDateLong = (val) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}-${d.getFullYear()}`;
  } catch {
    return String(val);
  }
};

const fmtN2 = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
};

const SaleDubaiExportFormat = ({ data, items, company, logoUrl }) => {
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
  const finalAmount = Number(getVal(data, "FinalAmount", "finalAmount")) || 0;
  const totalAmountUsd = rate ? finalAmount / rate : net;

  const companyFax = getVal(data, "CompanyFax", "companyFax") || company.companyFax || "";
  const companyMob = getVal(data, "CompanyMob", "companyMob") || company.companyMob || company.companyPhone || "";
  const companyWebsite = getVal(data, "CompanyWebsite", "companyWebsite") || company.companyWebsite || "";
  const taxReg =
    getVal(data, "CompanyTaxRegNumber", "CompnyTaxRegisterNumber", "companyTaxRegNumber") ||
    company.companyTaxRegNumber ||
    "";

  return (
    <div className="sale-dubai-export-root" style={{ fontFamily: FONT, fontSize: 13, color: "#000" }}>
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
            className={`sale-dubai-export-page${isLastPage ? "" : " page-break"}`}
            style={{ boxSizing: "border-box" }}
          >
            <div>
              <table style={{ width: "100%", marginBottom: 6, borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "20%", verticalAlign: "middle" }}>
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" width={100} height={80} style={{ objectFit: "contain" }} />
                      ) : null}
                    </td>
                    <td style={{ width: "47%", verticalAlign: "top", fontSize: 13 }}>
                      <div style={{ fontWeight: "bold", fontSize: 22 }}>{company.companyName}</div>
                      <div style={{ marginTop: 4, width: 250 }}>{company.companyAddress}</div>
                    </td>
                    <td
                      style={{
                        width: "33%",
                        verticalAlign: "top",
                        padding: "8px 0 8px 10px",
                        fontSize: 12,
                        fontWeight: "bold"
                      }}
                    >
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

              {isFirstPage && (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <tbody>
                    <tr>
                      <td colSpan={2} style={{ textAlign: "center", fontWeight: "bold", padding: "3px 0", fontSize: 13 }}>
                        TAX INVOICE
                      </td>
                    </tr>
                    <tr>
                      <td style={{ width: "65%", verticalAlign: "top" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            <tr>
                              <td style={{ width: 130, padding: "3px 0" }}>Invoice No :</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "InvNo", "invNo")}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "2px 0" }}>To,</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "PartyName", "partyName")}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "2px 0" }}>Address :</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "AddressLine1", "addressLine1")}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "8px 0" }}>TRN No :</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "TRNNo", "trnNo")}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "2px 0" }}>Contact No :</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "Mobile", "mobile")}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "2px 0" }}>Contact Person :</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "ContactPerson", "contactPerson")}</td>
                            </tr>
                            <tr>
                              <td colSpan={2} style={{ paddingTop: 2 }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                  <tbody>
                                    <tr>
                                      <td style={{ width: "33%" }}>Description :</td>
                                      <td style={{ width: "67%", textAlign: "center" }}>
                                        Country of Origin : <b>{fmtN2(getVal(data, "CountryCode", "countryCode"))}</b>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                      <td style={{ width: "35%", verticalAlign: "top" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            <tr>
                              <td style={{ width: 120, padding: "6px 0" }}>Invoice Date :</td>
                              <td style={{ fontWeight: "bold" }}>{fmtDateLong(getVal(data, "TrnDate", "trnDate"))}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "2px 0" }}>Terms :</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "DueDays", "dueDays")}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "2px 0" }}>Due Date :</td>
                              <td style={{ fontWeight: "bold" }}>{fmtDateLong(getVal(data, "DueDate", "dueDate"))}</td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: 14, padding: "5px 0" }}>Shipped By :-</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "ShipVia", "shipVia")}</td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: 14, padding: "3px 0" }}>Insured By :-</td>
                              <td style={{ fontWeight: "bold" }}>{getVal(data, "InsuredBy", "insuredBy")}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "5px 0" }}>Through :</td>
                              <td style={{ fontWeight: "bold" }}>{fmtN2(getVal(data, "Through", "through"))}</td>
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
                    Invoice Date:<b> {fmtDateLong(getVal(data, "TrnDate", "trnDate"))}</b>
                  </span>
                </div>
              )}

              <table
                className="sale-dubai-export-item-table"
                style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 12 }}
              >
                <thead>
                  <tr>
                    {[
                      "Sr.No.",
                      "Lot No.",
                      "Description",
                      "RapPrice",
                      "Discount",
                      "Pkts",
                      "Carats",
                      "Price/Cts(US $)",
                      "Amount(US $)"
                    ].map((h) => (
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
                      <td style={td}>
                        {getVal(item, "StockNo", "stockNo", "Lotno", "LotNo", "lotNo", "lotno")}
                      </td>
                      <td style={td}>
                        {getVal(item, "Description", "description", "ItemName", "itemName")}
                      </td>
                      <td style={td}>{fmt(getVal(item, "MRP", "mrp", "Rap", "rap"), 2)}</td>
                      <td style={td}>
                        {fmt(getVal(item, "PMRPDown", "pmrpDown", "Back", "back", "Discount"), 2)}
                      </td>
                      <td style={td}>{getVal(item, "Qty", "qty", "Pcs", "pcs")}</td>
                      <td style={td}>{fmt(getVal(item, "Weight", "weight", "Carats", "carats"), 2)}</td>
                      <td style={{ ...td, textAlign: "right", paddingRight: 3 }}>
                        {fmtNum(getVal(item, "Rate", "rate", "PricePerCarat", "pricePerCarat"), 2)}
                      </td>
                      <td style={{ ...td, textAlign: "right", paddingRight: 3 }}>
                        {fmtNum(getVal(item, "Amount", "amount"), 2)}
                      </td>
                    </tr>
                  ))}

                  {Array.from({ length: emptyCount }).map((_, i) => {
                    const lastEmpty = i === emptyCount - 1;
                    return (
                      <tr key={`e-${i}`} style={{ height: 16 }}>
                        {Array.from({ length: COL_COUNT }).map((__, c) => (
                          <td
                            key={c}
                            style={{
                              height: 16,
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
                      <tr style={{ height: 24, fontWeight: "bold" }}>
                        <td style={td} />
                        <td style={td} />
                        <td style={td} />
                        <td style={td} />
                        <td style={td} />
                        <td style={td} />
                        <td style={td}>{fmtNum(totalWt, 2)}</td>
                        <td style={{ ...td, textAlign: "center", paddingRight: 3 }}>Total</td>
                        <td style={{ ...td, textAlign: "right", paddingRight: 3 }}>{fmtNum(totalAmt, 2)}</td>
                      </tr>
                      <tr style={{ height: 24 }}>
                        <td style={td} />
                        <td style={td} />
                        <td style={td} />
                        <td style={td} />
                        <td colSpan={3} style={td} />
                        <td style={td} />
                        <td style={td} />
                      </tr>
                      <tr>
                        <td colSpan={4} style={{ border: "none", verticalAlign: "top", paddingTop: 6 }}>
                          <div style={{ fontSize: 9, marginBottom: 8 }}>
                            <span style={{ fontSize: 9 }}>Amount in Words :</span>{" "}
                            <b style={{ fontSize: 10 }}>USD: {getVal(data, "AmountWords", "amountWords")}.</b>
                          </div>
                          <div style={{ fontSize: 10, marginTop: 10 }}>
                            Payment Details :
                            <table
                              style={{
                                fontSize: 10,
                                borderCollapse: "collapse",
                                lineHeight: 1.6,
                                marginTop: 4
                              }}
                            >
                              <tbody>
                                <tr>
                                  <td style={{ width: 140, padding: "2px 0" }}>
                                    <b>Company Name</b>
                                  </td>
                                  <td style={{ width: 10, padding: "2px 0" }}>-</td>
                                  <td style={{ padding: "2px 0" }}>
                                    <b>{company.companyName}</b>
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ padding: "2px 0" }}>
                                    <b>Account Number</b>
                                  </td>
                                  <td style={{ padding: "2px 0" }}>-</td>
                                  <td style={{ padding: "2px 0" }}>
                                    <b>{getVal(data, "BankAccNo", "bankAccNo")}</b>
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ padding: "2px 0" }}>
                                    <b>Swift Code</b>
                                  </td>
                                  <td style={{ padding: "2px 0" }}>-</td>
                                  <td style={{ padding: "2px 0" }}>
                                    <b>{getVal(data, "SwiftCode", "swiftCode")}</b>
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ padding: "2px 0" }}>
                                    <b>Bank Name</b>
                                  </td>
                                  <td style={{ padding: "2px 0" }}>-</td>
                                  <td style={{ padding: "2px 0" }}>
                                    <b>{getVal(data, "bnm", "BankName", "bankName")}</b>
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ padding: "2px 0" }}>
                                    <b>Bank Address</b>
                                  </td>
                                  <td style={{ padding: "2px 0" }}>-</td>
                                  <td style={{ padding: "2px 0" }}>
                                    <b>{getVal(data, "BankAddress1", "bankAddress1")}</b>
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ padding: "2px 0" }}>
                                    <b>Iban No</b>
                                  </td>
                                  <td style={{ padding: "2px 0" }}>-</td>
                                  <td style={{ padding: "2px 0" }}>
                                    <b>{getVal(data, "IbanNo", "ibanNo")}</b>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </td>
                        <td colSpan={4} style={{ border: "none", verticalAlign: "top", paddingLeft: 6 }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                            <tbody>
                              <tr style={{ height: 28 }}>
                                <td
                                  style={{
                                    width: "60%",
                                    textAlign: "center",
                                    border: "2px solid #454545",
                                    borderTop: "none",
                                    fontWeight: "bold"
                                  }}
                                >
                                  Gross Amount
                                </td>
                                <td
                                  style={{
                                    width: "40%",
                                    textAlign: "center",
                                    border: "2px solid #454545",
                                    borderTop: "none",
                                    fontWeight: "bold",
                                    paddingRight: 3
                                  }}
                                >
                                  {fmtNum(net, 2)}
                                </td>
                              </tr>
                              <tr style={{ height: 28 }}>
                                <td style={{ textAlign: "center", border: "2px solid #454545", fontWeight: "bold" }}>
                                  Tax Amount
                                </td>
                                <td
                                  style={{
                                    textAlign: "center",
                                    border: "2px solid #454545",
                                    fontWeight: "bold",
                                    paddingRight: 3
                                  }}
                                >
                                  {finalTax === 0 ? "" : fmtNum(finalTax, 2)}
                                </td>
                              </tr>
                              <tr style={{ height: 28 }}>
                                <td style={{ textAlign: "center", border: "2px solid #454545", fontWeight: "bold" }}>
                                  Total Amount
                                </td>
                                <td
                                  style={{
                                    textAlign: "center",
                                    border: "2px solid #454545",
                                    fontWeight: "bold",
                                    paddingRight: 3
                                  }}
                                >
                                  {fmtNum(totalAmountUsd, 2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                        <td />
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {isLastPage && (
              <div className="sale-dubai-export-footer" style={{ paddingTop: 4 }}>
                <div style={{ fontSize: 9, fontWeight: "bold" }}>Declaration:</div>
                <div
                  style={{
                    fontSize: 10,
                    marginTop: 3,
                    textAlign: "justify",
                    fontFamily: "Segoe UI, Verdana, sans-serif",
                    lineHeight: 1.3
                  }}
                >
                  {conditions}
                </div>

                <table
                  style={{
                    width: "100%",
                    marginTop: 10,
                    marginBottom: 4,
                    fontFamily: "Calibri, Verdana, sans-serif",
                    fontSize: 12
                  }}
                >
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
                      <td
                        style={{
                          width: "40%",
                          textAlign: "center",
                          verticalAlign: "top",
                          fontSize: 15,
                          fontWeight: "bold"
                        }}
                      >
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
                    padding: "3px 0",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact"
                  }}
                >
                  The right source for quality & consistency…
                </div>

                <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 12, marginTop: 2 }}>
                  Page {pageIdx + 1} of {pages.length}
                </div>
              </div>
            )}

            {!isLastPage && (
              <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 12, marginTop: 4 }}>
                Page {pageIdx + 1} of {pages.length}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SaleDubaiExportFormat;
