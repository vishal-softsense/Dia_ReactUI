import React from "react";
import { fmt, fmtDateMMM, getVal, paginateVariable } from "../shared/printUtils";

// Matches MVC Views/MixSaleReturnPartial/MixSaleRtnPrint_USA.cshtml
const th = { background: "#BFBFBF", border: "2px solid #909090", padding: "6px 0", textAlign: "center" };
const td = { border: "2px solid #A2A1A1", padding: "0 6px", textAlign: "center", height: 24 };
const itemTh = { background: "#BFBFBF", border: "2px solid #909090", padding: "6px 0", textAlign: "center" };
const itemTd = { border: "2px solid #A2A1A1", padding: "0 6px", textAlign: "center", height: 24 };

const MixSaleRtnPrintUsaFormat = ({ data, items, totals, company, logoUrl }) => {
  const pages = paginateVariable(items, { single: 18, first: 26, middle: 24, last: 16 });
  const plusMinus =
    (Number(getVal(data, "PlusMinusAmount", "plusMinusAmount")) || 0) *
    (Number(getVal(data, "BaseRate", "baseRate")) || 0);
  const finalAmount = Number(getVal(data, "FinalAmount", "finalAmount")) || totals.amount;

  const renderHeader = () => (
    <>
      <table style={{ width: "100%" }}>
        <tbody>
          <tr>
            <td style={{ width: "55%", verticalAlign: "top" }}>
              {logoUrl ? <img src={logoUrl} alt="Logo" style={{ height: 90, width: 110 }} /> : null}
              <div style={{ fontFamily: "Verdana", fontSize: 11, fontWeight: "bold" }}>
                <div style={{ fontSize: 14 }}>{company.companyName}</div>
                <div>{company.companyAddress}</div>
                <div>{company.companyAddress1}</div>
                <div>{company.companyAddress2}</div>
                <table style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: "bold" }}>Phone :</td>
                      <td style={{ paddingRight: 40 }}>&nbsp;{company.companyPhone}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold" }}>E-Mail :</td>
                      <td style={{ paddingRight: 40 }}>&nbsp;{company.companyEmail}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
            <td style={{ width: "45%", verticalAlign: "top", textAlign: "right" }}>
              <div style={{ fontWeight: "bold", fontSize: 18, marginBottom: 5, textAlign: "right" }}>
                MIX SALE RETURN INVOICE
              </div>
              <table
                style={{
                  width: 350,
                  borderCollapse: "collapse",
                  fontSize: 14,
                  marginLeft: "auto",
                  marginTop: 5
                }}
              >
                <tbody>
                  <tr style={{ height: 30 }}>
                    <td
                      style={{
                        border: "2px solid #A2A1A1",
                        fontWeight: "bold",
                        textAlign: "center",
                        background: "#c0c0c0"
                      }}
                    >
                      Date
                    </td>
                    <td
                      style={{
                        border: "2px solid #A2A1A1",
                        fontWeight: "bold",
                        textAlign: "center",
                        background: "#c0c0c0"
                      }}
                    >
                      Invoice #
                    </td>
                  </tr>
                  <tr style={{ height: 30 }}>
                    <td style={{ border: "2px solid #A2A1A1", textAlign: "center" }}>
                      {fmtDateMMM(getVal(data, "TrnDate", "trnDate"))}
                    </td>
                    <td style={{ border: "2px solid #A2A1A1", textAlign: "center" }}>
                      {getVal(data, "InvNo", "invNo")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12, marginTop: 8 }}>
        <tbody>
          <tr>
            {["Bill To", "Ship To"].map((label, i) => (
              <React.Fragment key={label}>
                {i === 1 && <td style={{ width: "12%" }} />}
                <td style={{ width: "44%", border: "2px solid #A2A1A1", verticalAlign: "top" }}>
                  <div
                    style={{
                      fontSize: 14,
                      background: "#BFBFBF",
                      textAlign: "center",
                      fontWeight: "bold",
                      padding: 4,
                      borderBottom: "2px solid #8f8f8f"
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ padding: 5, minHeight: 120, fontSize: 14 }}>
                    <div style={{ fontSize: 15, fontWeight: "bold", paddingBottom: 5 }}>
                      {getVal(data, "PartyName", "partyName")}
                    </div>
                    <div style={{ padding: "2px 0" }}>{getVal(data, "AddressLine1", "addressLine1")}</div>
                    <div>{getVal(data, "AddressLine2", "addressLine2")}</div>
                    <div style={{ padding: "4px 0" }}>{getVal(data, "AddressLine3", "addressLine3")}</div>
                  </div>
                </td>
              </React.Fragment>
            ))}
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8, fontSize: 10 }}>
        <thead>
          <tr>
            {["Sales Person", "Terms", "Due Date", "Ship Via", "Ship Date", "Tracking No"].map((h) => (
              <th key={h} style={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: 35 }}>
            <td style={td}>{getVal(data, "SalesPersons", "salesPersons", "SalesPerson")}</td>
            <td style={td}>{getVal(data, "DueDays", "dueDays")}</td>
            <td style={td}>{fmtDateMMM(getVal(data, "DueDate", "dueDate"))}</td>
            <td style={td}>{getVal(data, "ShipVia", "shipVia")}</td>
            <td style={td} />
            <td style={td}>{getVal(data, "Tracking", "tracking")}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  return (
    <div style={{ fontFamily: "Verdana, Arial, sans-serif", fontSize: 13, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        let srNo = (items || []).indexOf(pageItems[0]) + 1 || 1;
        return (
          <div
            key={pageIdx}
            className={isLastPage ? "" : "page-break"}
            style={{ position: "relative", minHeight: 1050, paddingTop: 5 }}
          >
            {renderHeader()}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, border: "2px solid #A2A1A1" }}>
              <thead>
                <tr style={{ height: 29 }}>
                  {[
                    ["Sr No", "6%"],
                    ["InvNo", "9%"],
                    ["Stock Id", "11%"],
                    ["ItemName", "25%"],
                    ["Pcs", "6%"],
                    ["Carats/Qty", "14%"],
                    ["Price/Carat", "14%"],
                    ["Amount US $", "14%"]
                  ].map(([h, w]) => (
                    <th key={h} style={{ ...itemTh, width: w }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => (
                  <tr key={idx}>
                    <td style={itemTd}>{srNo++}</td>
                    <td style={itemTd}>{getVal(item, "InvNo", "invNo") || getVal(data, "InvNo")}</td>
                    <td style={{ ...itemTd, textAlign: "center" }}>
                      {getVal(item, "Lotno", "lotno", "StockNo", "stockNo")}
                    </td>
                    <td style={{ ...itemTd, textAlign: "center" }}>
                      {getVal(item, "ItemName", "itemName", "Description", "description")}
                    </td>
                    <td style={itemTd}>{getVal(item, "Pcs", "pcs", "Qty", "qty")}</td>
                    <td style={{ ...itemTd, textAlign: "right" }}>
                      {fmt(getVal(item, "Carats", "carats", "Weight", "weight"), 2)}
                    </td>
                    <td style={{ ...itemTd, textAlign: "right" }}>
                      {fmt(getVal(item, "Rate", "rate", "PricePerCarat", "pricePerCarat"), 2)}
                    </td>
                    <td style={{ ...itemTd, textAlign: "right" }}>
                      {fmt(getVal(item, "MasterCurrencyAmount", "Amount", "amount"), 2)}
                    </td>
                  </tr>
                ))}
                {isLastPage && (
                  <>
                    <tr style={{ fontWeight: "bold", background: "#f0f0f0" }}>
                      <td colSpan={5} style={{ ...itemTd, textAlign: "left", paddingLeft: 6, borderRight: "none" }}>
                        Total Carats:
                      </td>
                      <td style={{ ...itemTd, textAlign: "right", borderLeft: "none", fontSize: 13 }}>
                        {fmt(totals.wt, 2)}
                      </td>
                      <td style={{ ...itemTd, textAlign: "center", fontSize: 13 }}>US $ :</td>
                      <td style={{ ...itemTd, textAlign: "right", fontSize: 13 }}>{fmt(totals.amount, 2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={7} style={{ border: "none" }} />
                      <td style={{ ...itemTd, fontWeight: "bold" }}>
                        <div style={{ overflow: "hidden" }}>
                          <span style={{ float: "left" }}>+/- Amt</span>
                          <span style={{ float: "right" }}>{fmt(plusMinus, 2)}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={7} style={{ border: "none", background: "#fff" }} />
                      <td
                        style={{
                          ...itemTd,
                          textAlign: "right",
                          fontWeight: "bold",
                          fontSize: 13,
                          borderTop: "2px solid #000"
                        }}
                      >
                        {fmt(finalAmount, 2)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {isLastPage && (
              <>
                <table style={{ width: "100%", marginTop: 10 }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "60%", verticalAlign: "top" }}>
                        <table style={{ fontSize: 12, borderCollapse: "collapse" }}>
                          <tbody>
                            <tr>
                              <td colSpan={2} style={{ fontWeight: "bold", fontSize: 15 }}>
                                Payment Instruction:
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={2} style={{ fontWeight: "bold", padding: "3px 0" }}>
                                {company.companyAddress}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>Account :</td>
                              <td style={{ paddingLeft: 40 }}>{getVal(data, "BankAccNo", "bankAccNo")}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>ABA Routing Number :</td>
                              <td style={{ paddingLeft: 40 }}>
                                {getVal(data, "ABARoutingNumber", "abaRoutingNumber")}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>Swift Code :</td>
                              <td style={{ paddingLeft: 40 }}>{getVal(data, "SwiftCode", "swiftCode")}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                      <td style={{ width: "40%", textAlign: "right", paddingBottom: 10 }}>
                        <div style={{ marginTop: 60, fontWeight: "bold" }}>
                          <span style={{ fontSize: 15 }}>Signature</span>
                          &nbsp;
                          <span
                            style={{
                              display: "inline-block",
                              textAlign: "right",
                              width: "40%",
                              borderBottom: "1px solid #000"
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {company.saleConditions ? (
                  <div
                    style={{
                      fontSize: 12,
                      textAlign: "justify",
                      margin: "13px 0",
                      fontFamily: "Segoe UI",
                      wordSpacing: 5
                    }}
                  >
                    {company.saleConditions}
                  </div>
                ) : null}
              </>
            )}

            <div style={{ position: "relative", fontSize: 12, marginTop: 20, fontWeight: "bold", textAlign: "center" }}>
              <span>Thank you for your business. It&apos;s been a pleasure working with you!</span>
              <span style={{ position: "absolute", right: 0 }}>{pageIdx + 1}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MixSaleRtnPrintUsaFormat;
