import React from "react";
import {
  fmtDateSlash,
  fmtNum,
  getItemImageUrl,
  getVal,
  paginateVariable,
  resolveImageFullPath
} from "../shared/printUtils";

// MVC Views/Mix/MixSalePrint_USA.cshtml + ITEM image column
const COL_COUNT = 10;

const th = {
  background: "#BFBFBF",
  border: "1px solid #000",
  padding: "6px 0",
  textAlign: "center",
  fontWeight: "bold"
};

const topCell = {
  border: "1px solid #000",
  padding: "0 6px",
  textAlign: "center",
  verticalAlign: "middle",
  height: 24,
  fontSize: 11
};

const itemCell = {
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  borderTop: "none",
  borderBottom: "none",
  padding: "0 6px",
  textAlign: "center",
  verticalAlign: "middle",
  height: 24,
  fontSize: 11
};

const getStockNo = (item) => {
  const direct = getVal(
    item,
    "Lotno",
    "lotno",
    "LotNo",
    "lotNo",
    "StockNo",
    "stockNo",
    "Stock_ID",
    "stock_ID",
    "JewItem",
    "jewItem"
  );
  if (direct) return direct;

  const name = String(getVal(item, "ItemName", "itemName", "Description", "description") || "").trim();
  if (!name) return "";

  const stockType = String(getVal(item, "StockType", "stockType") || "").toLowerCase();
  const carats = Number(getVal(item, "Carats", "carats", "Weight", "weight")) || 0;
  const isJewellery =
    stockType === "jewellery" ||
    stockType === "jew" ||
    stockType === "jewelry" ||
    (carats === 0 && /\b\d+\s*KT\b/i.test(name));

  if (!isJewellery) return "";
  return name.split(/\s+/)[0] || "";
};

const renderItemImage = (item) => {
  const src = resolveImageFullPath(item) || getItemImageUrl(item);
  if (!src) return <div style={{ height: 24 }} />;
  return <img src={src} alt="" style={{ width: 48, height: 36, objectFit: "contain" }} />;
};

const formatTdc = (item) => {
  const v = getVal(item, "TotalDiamondCarat", "totalDiamondCarat");
  if (v === "" || v === null || v === undefined) return "";
  return fmtNum(v, 2);
};

const MixSalePrintUsaFormat = ({ data, items, totals, company, logoUrl }) => {
  const pages = paginateVariable(items, { single: 14, first: 23, middle: 23, last: 13 });
  const totalAmount = totals.amount;
  const finalTotal =
    Number(getVal(data, "FinalAmount", "finalAmount")) > 0
      ? Number(getVal(data, "FinalAmount", "finalAmount"))
      : totalAmount;

  const printedOn =
    fmtDateSlash(getVal(data, "RoundDate", "roundDate")) || fmtDateSlash(new Date().toISOString());

  const getPageCapacity = (pageIdx) => {
    if (pages.length === 1) return 14;
    if (pageIdx === 0) return 23;
    if (pageIdx === pages.length - 1) return 13;
    return 23;
  };

  const renderHeader = () => (
    <>
      <table style={{ width: "100%", paddingBottom: 10 }}>
        <tbody>
          <tr>
            <td style={{ width: "13%", verticalAlign: "top" }}>
              {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: 90 }} /> : null}
            </td>
            <td style={{ width: "55%", verticalAlign: "top", fontSize: 12 }}>
              <div style={{ fontWeight: "bold", fontSize: 14 }}>{company.companyName}</div>
              <div style={{ marginTop: 3 }}>{company.companyAddress}</div>
              <div>{company.companyAddress1}</div>
              <div>{company.companyAddress2}</div>
              <div style={{ marginTop: 5 }}>
                <b>Tel:</b>&nbsp;&nbsp;{company.companyPhone}
              </div>
              <div style={{ marginTop: 5 }}>
                <b>Email:</b>&nbsp;&nbsp;{company.companyEmail}
              </div>
            </td>
            <td style={{ width: "32%", verticalAlign: "top" }}>
              <div style={{ textAlign: "left", fontWeight: "bold", fontSize: 24, paddingTop: 5 }}>
                GENERAL INVOICE
              </div>
              <table style={{ width: "100%", fontSize: 13, marginTop: 10 }}>
                <tbody>
                  <tr>
                    <td style={{ width: "40%" }}>
                      <b>Date :</b>
                    </td>
                    <td style={{ width: "5%" }} />
                    <td>{fmtDateSlash(getVal(data, "TrnDate", "trnDate"))}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px 0" }}>
                      <b>Memo # :</b>
                    </td>
                    <td style={{ width: "5%", padding: "5px 0" }} />
                    <td style={{ padding: "5px 0" }}>{getVal(data, "InvNo", "invNo")}</td>
                  </tr>
                  <tr>
                    <td>
                      <b>Printed On :</b>
                    </td>
                    <td style={{ width: "5%" }} />
                    <td>{printedOn}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", marginTop: 10 }}>
        <tbody>
          <tr>
            {["Bill To:", "Ship To:"].map((label) => (
              <td
                key={label}
                style={{ width: "50%", padding: label === "Bill To:" ? "0 20px 0 0" : "0 0 0 20px" }}
              >
                <fieldset
                  style={{
                    border: "1px solid #000",
                    borderRadius: 12,
                    padding: "8px 15px 12px 10px",
                    height: 150,
                    margin: 0
                  }}
                >
                  <legend
                    style={{
                      fontWeight: "bold",
                      fontSize: 13,
                      padding: "0 10px",
                      width: "auto",
                      marginLeft: 10,
                      marginBottom: 2,
                      background: "#fff",
                      border: "none"
                    }}
                  >
                    {label}
                  </legend>
                  <div style={{ fontSize: 13, marginBottom: 5 }}>{getVal(data, "PartyName", "partyName")}</div>
                  <div style={{ lineHeight: 1.6, fontSize: 12, marginBottom: 5 }}>
                    {getVal(data, "AddressLine1", "addressLine1")}
                  </div>
                  <div style={{ lineHeight: 1.6, fontSize: 12, marginBottom: 5 }}>
                    {getVal(data, "AddressLine2", "addressLine2")}
                  </div>
                  <div style={{ lineHeight: 1.6, fontSize: 12, marginBottom: 5 }}>
                    {getVal(data, "AddressLine3", "addressLine3")}
                  </div>
                </fieldset>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {company.information ? (
        <div style={{ fontSize: 11, textAlign: "justify", margin: "7px 0", fontFamily: "Segoe UI" }}>
          {company.information}
        </div>
      ) : null}

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10, fontSize: 11 }}>
        <thead>
          <tr>
            {["DESC", "SALES PERSON", "CUST ORDER #", "SHIP VIA", "TRACKING #"].map((h) => (
              <th key={h} style={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...topCell, textAlign: "left" }}>
              {getVal(data, "InvDisc", "invDisc", "Description", "description")}
            </td>
            <td style={topCell}>{getVal(data, "SalesPersons", "salesPersons", "SalesPerson", "salesPerson")}</td>
            <td style={topCell} />
            <td style={topCell}>{getVal(data, "ShipVia", "shipVia")}</td>
            <td style={topCell}>{getVal(data, "Tracking", "tracking")}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  return (
    <div style={{ fontFamily: "Verdana, Arial, sans-serif", fontSize: 13, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        const pageCapacity = getPageCapacity(pageIdx);
        let srNo = items.indexOf(pageItems[0]) + 1 || 1;

        return (
          <div key={pageIdx} className={isLastPage ? "" : "page-break"}>
            {renderHeader()}

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ fontSize: 12 }}>
                  {[
                    ["Sr No", "5%"],
                    ["ITEM", "7%"],
                    ["MemoNo", "10%"],
                    ["Stock #", "10%"],
                    ["QTY", "8%"],
                    ["WT.", "9%"],
                    ["TDC", "9%"],
                    ["DESCRIPTION", "22%"],
                    ["Price/Carat", "13%"],
                    ["Amount US $", "13%"]
                  ].map(([h, w]) => (
                    <th key={h} style={{ ...th, width: w }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => (
                  <tr key={idx} style={{ fontSize: 11 }}>
                    <td style={itemCell}>{srNo++}</td>
                    <td style={{ ...itemCell, padding: "2px 0", verticalAlign: "middle" }}>{renderItemImage(item)}</td>
                    <td style={itemCell}>{getVal(item, "MemoNo", "memoNo", "ExportNo", "exportNo")}</td>
                    <td style={{ ...itemCell, textAlign: "left", paddingLeft: 15 }}>{getStockNo(item)}</td>
                    <td style={{ ...itemCell, textAlign: "center" }}>
                      {getVal(item, "Pcs", "pcs", "Qty", "qty")}
                    </td>
                    <td style={{ ...itemCell, textAlign: "right", paddingRight: 20 }}>
                      {fmtNum(getVal(item, "Carats", "carats", "Weight", "weight"), 2)}
                    </td>
                    <td style={{ ...itemCell, textAlign: "right", paddingRight: 20 }}>{formatTdc(item)}</td>
                    <td style={{ ...itemCell, textAlign: "left" }}>
                      {getVal(item, "ItemName", "itemName", "Description", "description")}
                    </td>
                    <td style={{ ...itemCell, textAlign: "right" }}>
                      {fmtNum(getVal(item, "Rate", "rate", "PricePerCarat", "pricePerCarat"), 2)}
                    </td>
                    <td style={{ ...itemCell, textAlign: "right" }}>
                      {fmtNum(getVal(item, "MasterCurrencyAmount", "masterCurrencyAmount", "Amount", "amount"), 2)}
                    </td>
                  </tr>
                ))}

                {Array.from({ length: Math.max(0, pageCapacity - pageItems.length) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    {Array.from({ length: COL_COUNT }).map((__, col) => (
                      <td
                        key={col}
                        style={{
                          ...itemCell,
                          borderLeft: "1px solid #000",
                          borderRight: "1px solid #000",
                          borderTop: "none",
                          borderBottom: "none"
                        }}
                      >
                        &nbsp;
                      </td>
                    ))}
                  </tr>
                ))}

                {!isLastPage && (
                  <tr>
                    {Array.from({ length: COL_COUNT }).map((_, col) => (
                      <td key={col} style={{ borderBottom: "1px solid #000" }} />
                    ))}
                  </tr>
                )}

                {isLastPage && (
                  <tr style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000" }}>
                    <td style={{ borderLeft: "1px solid #000", borderRight: "1px solid #000" }} />
                    <td style={{ borderLeft: "1px solid #000", borderRight: "1px solid #000" }} />
                    <td style={{ borderLeft: "1px solid #000", borderRight: "1px solid #000" }} />
                    <td style={{ borderLeft: "1px solid #000", borderRight: "1px solid #000" }} />
                    <td
                      style={{
                        borderLeft: "1px solid #000",
                        borderRight: "1px solid #000",
                        textAlign: "right",
                        fontSize: 13,
                        verticalAlign: "top",
                        padding: "0 6px"
                      }}
                    >
                      {totals.qty}
                    </td>
                    <td
                      style={{
                        borderLeft: "1px solid #000",
                        borderRight: "1px solid #000",
                        textAlign: "right",
                        fontSize: 13,
                        verticalAlign: "top",
                        padding: "0 6px 0 0",
                        paddingRight: 20
                      }}
                    >
                      {fmtNum(totals.wt, 2)}
                    </td>
                    <td
                      style={{
                        borderLeft: "1px solid #000",
                        borderRight: "1px solid #000",
                        textAlign: "right",
                        fontSize: 13,
                        verticalAlign: "top",
                        padding: "0 6px 0 0",
                        paddingRight: 20
                      }}
                    >
                      {fmtNum(totals.tdc, 2)}
                    </td>
                    <td
                      style={{
                        borderLeft: "1px solid #000",
                        borderRight: "1px solid #000",
                        fontWeight: "bold",
                        verticalAlign: "top",
                        textAlign: "left",
                        padding: "0 6px"
                      }}
                    >
                      Terms: Due upon receipt
                    </td>
                    <td
                      style={{
                        borderLeft: "1px solid #000",
                        borderRight: "1px solid #000",
                        paddingLeft: 10,
                        fontSize: 12,
                        lineHeight: 1.8,
                        textAlign: "right",
                        verticalAlign: "top"
                      }}
                    >
                      Sub Total
                      <br />
                      Charges
                      <br />
                      Discount
                      <br />
                      <b style={{ fontSize: 15 }}>TOTAL</b>
                    </td>
                    <td
                      style={{
                        borderLeft: "1px solid #000",
                        borderRight: "1px solid #000",
                        textAlign: "right",
                        fontSize: 13,
                        lineHeight: 1.8,
                        verticalAlign: "top",
                        padding: "0 6px"
                      }}
                    >
                      {fmtNum(totalAmount, 2)}
                      <br />
                      <br />
                      <br />
                      <b>{fmtNum(finalTotal, 2)}</b>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {isLastPage && (
              <table
                style={{
                  width: "100%",
                  fontFamily: "Verdana",
                  fontSize: 13,
                  borderCollapse: "collapse",
                  marginTop: 10
                }}
              >
                <tbody>
                  <tr>
                    <td colSpan={2} style={{ fontWeight: "bold", color: "red", paddingBottom: 6 }}>
                      {getVal(data, "InvFeesDescription", "invFeesDescription")}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ fontWeight: "bold", paddingBottom: 6 }}>
                      Payment Instruction:
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>{company.companyName}</td>
                  </tr>
                  <tr>
                    <td colSpan={2}>{company.companyAddress}</td>
                  </tr>
                  <tr>
                    <td style={{ width: 140, paddingTop: 6 }}>Bank Name :</td>
                    <td style={{ paddingLeft: 40 }}>{getVal(data, "bnm", "Bnm")}</td>
                  </tr>
                  <tr>
                    <td>Account No :</td>
                    <td style={{ paddingLeft: 40 }}>
                      <b>{getVal(data, "BankAccNo", "bankAccNo")}</b>
                    </td>
                  </tr>
                  <tr>
                    <td>Routing Number :</td>
                    <td style={{ paddingLeft: 40 }}>
                      <b>{getVal(data, "ABARoutingNumber", "abaRoutingNumber")}</b>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>Swift Code :</b>
                    </td>
                    <td style={{ paddingLeft: 40 }}>
                      <b>{getVal(data, "SwiftCode", "swiftCode")}</b>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>ZELLE Id :</b>
                    </td>
                    <td style={{ paddingLeft: 40 }}>
                      <b>{getVal(data, "ZelleID", "zelleID")}</b>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            <div style={{ marginTop: 15 }}>
              <span style={{ fontSize: 13 }}>Signature:</span>
              <span style={{ display: "inline-block", borderBottom: "1px solid #000", width: 300, marginLeft: 10 }} />
            </div>

            {company.saleConditions ? (
              <div style={{ fontSize: 11, textAlign: "justify", margin: "10px 0", fontFamily: "Segoe UI" }}>
                {company.saleConditions}
              </div>
            ) : null}

            <table style={{ width: "100%", marginTop: 10 }}>
              <tbody>
                <tr>
                  <td style={{ width: "50%", textAlign: "left" }}>{company.companyFooter || "Powered by SoftOnCloud"}</td>
                  <td style={{ width: "50%", textAlign: "right" }}>{pageIdx + 1}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default MixSalePrintUsaFormat;
