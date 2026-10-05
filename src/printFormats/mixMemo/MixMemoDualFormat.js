import React from "react";
import { fmt, fmtDate, fmtNum, getVal, paginateFixed } from "../shared/printUtils";
import deltaQr from "../../assets/images/print/deltaqr.png";
import deltaInstaQr from "../../assets/images/print/delta.png";

const PAGE_SIZE = 10;
const border = "1px solid #A2A1A1";
const thGray = {
  background: "#ccc",
  border,
  padding: "1px 2px",
  textAlign: "center",
  fontWeight: "bold",
  fontFamily: "Verdana, Arial, sans-serif",
  fontSize: 9,
  lineHeight: 1.15
};

/**
 * MVC MixMemoDualPrint — OFFICE + CUSTOMER on one Letter page.
 * 10 records per page (both copies share the same 10 lines).
 */
const MixMemoDualFormat = ({ data, items, totals, company, logoUrl, isCurrentStatus }) => {
  const pages = paginateFixed(items, PAGE_SIZE);
  const plusMinus =
    (Number(getVal(data, "PlusMinusAmount", "plusMinusAmount")) || 0) *
    (Number(getVal(data, "BaseRate", "baseRate")) || 0);
  const finalRaw = getVal(data, "FinalAmount", "finalAmount");
  const finalAmount =
    finalRaw === "" || finalRaw == null ? totals.amount : Number(finalRaw) || totals.amount;

  const renderCopy = (copyTitle, pageItems, pageIdx, isLastPage, isOffice) => {
    let srNo = pageIdx * PAGE_SIZE;
    return (
      <div className="mix-memo-dual-copy" style={{ marginBottom: isOffice ? 28 : 0 }}>
        <table style={{ width: "100%", marginBottom: 2, borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "14%", verticalAlign: "top", paddingRight: 0 }}>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="mix-memo-dual-logo"
                    style={{ width: 90, maxHeight: 52, objectFit: "contain" }}
                  />
                ) : null}
              </td>
              <td
                style={{
                  width: "44%",
                  verticalAlign: "top",
                  fontSize: 10,
                  letterSpacing: 0.5,
                  paddingLeft: 4,
                  lineHeight: 1.2
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: 12,
                    fontFamily: "Verdana, Arial, sans-serif",
                    letterSpacing: 0,
                    lineHeight: 1.2
                  }}
                >
                  {company.companyName}
                </div>
                <div>{company.companyAddress}</div>
                <div>{company.companyAddress1}</div>
                <div>{company.companyAddress2}</div>
                <div>{company.companyPhone}</div>
                <div>{company.companyEmail}</div>
              </td>
              <td style={{ width: "42%", verticalAlign: "top", textAlign: "right" }}>
                <div
                  className="mix-memo-dual-copy-title"
                  style={{
                    fontWeight: "bold",
                    fontSize: 18,
                    fontFamily: "Verdana, Arial, sans-serif",
                    marginTop: 2,
                    marginBottom: 0,
                    textAlign: "right",
                    lineHeight: 1.1
                  }}
                >
                  {copyTitle}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 3 }}>
                  <thead>
                    <tr style={{ height: 16 }}>
                      <th style={{ ...thGray, width: "50%" }}>Date</th>
                      <th style={{ ...thGray, width: "50%" }}>Memo #</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border, padding: "1px 2px", textAlign: "center", fontSize: 10 }}>
                        {fmtDate(getVal(data, "TrnDate", "trnDate"))}
                      </td>
                      <td style={{ border, padding: "1px 2px", textAlign: "center", fontSize: 10 }}>
                        {getVal(data, "InvNo", "invNo")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <table
          style={{
            width: "100%",
            marginTop: 1,
            marginBottom: 2,
            borderCollapse: "collapse",
            fontFamily: "Verdana, Arial, sans-serif"
          }}
        >
          <tbody>
            <tr>
              <td style={{ width: "50%", verticalAlign: "top" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", border }}>
                  <thead>
                    <tr>
                      <th
                        style={{
                          background: "#c0c0c0",
                          border,
                          padding: "2px 4px",
                          fontWeight: "bold",
                          textAlign: "center",
                          fontSize: 10
                        }}
                      >
                        Memo To
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border, padding: "3px 6px", textAlign: "left", lineHeight: 1.2 }}>
                        <div style={{ fontSize: 11, fontWeight: "bold", letterSpacing: 0.5 }}>
                          {getVal(data, "PartyName", "partyName")}
                        </div>
                        <div className="mix-memo-dual-addr" style={{ fontSize: 9 }}>
                          {getVal(data, "AddressLine1", "addressLine1")}
                        </div>
                        <div className="mix-memo-dual-addr" style={{ fontSize: 9 }}>
                          {getVal(data, "AddressLine2", "addressLine2")}
                        </div>
                        <div className="mix-memo-dual-addr" style={{ fontSize: 9 }}>
                          {getVal(data, "AddressLine3", "addressLine3")}
                        </div>
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
                      <th style={{ ...thGray, width: "50%" }}>Ship Via</th>
                      <th style={{ ...thGray, width: "50%" }}>Tracking No</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ height: 16 }}>
                      <td style={{ border, padding: "1px 2px", textAlign: "center", fontSize: 10 }}>
                        {getVal(data, "ShipVia", "shipVia")}
                      </td>
                      <td style={{ border, padding: "1px 2px", textAlign: "center", fontSize: 10 }}>
                        {getVal(data, "Tracking", "tracking")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <table
          className="mix-memo-dual-main"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 8,
            tableLayout: "fixed",
            fontFamily: "Verdana, Arial, sans-serif",
            marginTop: 1
          }}
        >
          <colgroup>
            <col style={{ width: "5%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr style={{ background: "#c0c0c0", height: 15 }}>
              {[
                "Sr No",
                "DESCRIPTION",
                "Pcs",
                "Carat / Qty.",
                "Price / Carat",
                "Return Cts",
                "Kept Cts",
                "Amount US $"
              ].map((h) => (
                <th key={h} style={{ ...thGray, background: "#c0c0c0", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, idx) => {
              srNo += 1;
              const ret = Number(getVal(item, "ReturnCarats", "returnCarats")) || 0;
              const kept =
                Number(getVal(item, "IssueCarats", "issueCarats", "SpCarats", "spCarats")) || 0;
              const description =
                getVal(
                  item,
                  "Description",
                  "description",
                  "ItemName",
                  "itemName",
                  "StockNo",
                  "stockNo",
                  "LotNo",
                  "lotNo"
                ) || "";
              const pcs = getVal(item, "Qty", "qty", "Pcs", "pcs");
              const carats = getVal(item, "Weight", "weight", "Carats", "carats");
              const rate = getVal(item, "PricePerCarat", "pricePerCarat", "Rate", "rate");
              const amount = getVal(
                item,
                "MasterCurrencyAmount",
                "masterCurrencyAmount",
                "Amount",
                "amount"
              );
              const cell = {
                border,
                whiteSpace: "nowrap",
                overflow: "hidden",
                padding: "0 2px",
                height: 14,
                lineHeight: "14px",
                fontSize: 9
              };
              return (
                <tr key={idx} className="mix-memo-dual-item-row" style={{ height: 14 }}>
                  <td style={{ ...cell, textAlign: "center" }}>{srNo}</td>
                  <td style={{ ...cell, textAlign: "center" }}>{description}</td>
                  <td style={{ ...cell, textAlign: "center" }}>
                    {pcs === "" || pcs == null ? "" : pcs}
                  </td>
                  <td style={{ ...cell, textAlign: "right", paddingRight: 6 }}>{fmt(carats, 2)}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{fmtNum(rate, 2)}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{ret ? fmt(ret, 2) : ""}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{kept ? fmt(kept, 2) : ""}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{fmtNum(amount, 2)}</td>
                </tr>
              );
            })}

            {Array.from({ length: Math.max(0, PAGE_SIZE - pageItems.length) }).map((_, i) => (
              <tr
                key={`e-${i}`}
                className="mix-memo-dual-empty-row"
                style={{ height: 14, borderLeft: border, borderRight: border }}
              >
                <td style={{ border: "none", height: 14, padding: 0 }} />
                <td style={{ border: "none", height: 14, padding: 0 }} />
                <td style={{ border: "none", height: 14, padding: 0 }} />
                <td style={{ border: "none", height: 14, padding: 0 }} />
                <td style={{ border: "none", height: 14, padding: 0 }} />
                <td style={{ border: "none", height: 14, padding: 0 }} />
                <td style={{ border: "none", height: 14, padding: 0 }} />
                <td style={{ border: "none", borderLeft: border, height: 14, padding: 0 }} />
              </tr>
            ))}

            {isLastPage && (
              <>
                <tr style={{ fontWeight: "bold", height: 16, fontSize: 9 }}>
                  <td colSpan={3} style={{ border: "1px solid #999", textAlign: "left", paddingLeft: 12 }}>
                    Total Carats :
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 4 }}>
                    {fmt(totals.wt, 2)}
                  </td>
                  <td colSpan={3} style={{ border: "1px solid #999", textAlign: "right", paddingRight: 10 }}>
                    US $ :
                  </td>
                  <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 4 }}>
                    {fmtNum(totals.amount, 2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={7} style={{ border: "none", padding: 0 }} />
                  <td style={{ border: "1px solid #999", padding: "1px 3px", fontSize: 9 }}>
                    <div style={{ overflow: "hidden" }}>
                      <span style={{ float: "left" }}>Round Off</span>
                      <span style={{ float: "right", fontWeight: "bold" }}>{fmtNum(plusMinus, 2)}</span>
                    </div>
                  </td>
                </tr>
                <tr style={{ height: 16, fontSize: 9, fontWeight: "bold" }}>
                  <td colSpan={7} style={{ border: "none", padding: 0 }} />
                  <td
                    style={{
                      border: "1px solid #999",
                      textAlign: "right",
                      paddingRight: 4
                    }}
                  >
                    {fmtNum(finalAmount, 2)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        <table style={{ width: "100%", marginTop: isOffice ? 2 : 4 }}>
          <tbody>
            <tr>
              <td style={{ width: "35%", verticalAlign: "bottom", textAlign: "left" }}>
                <img src={deltaQr} alt="QR" className="mix-memo-dual-qr" style={{ height: 36, marginRight: 4 }} />
                <img src={deltaInstaQr} alt="Insta QR" className="mix-memo-dual-qr" style={{ height: 36 }} />
              </td>
              <td
                style={{
                  width: "30%",
                  textAlign: "center",
                  color: "gray",
                  fontSize: 8,
                  verticalAlign: "middle"
                }}
              >
                {company.companyFooter}
              </td>
              <td
                style={{
                  width: "35%",
                  textAlign: "right",
                  fontWeight: "bold",
                  fontSize: 11,
                  verticalAlign: "middle",
                  whiteSpace: "nowrap",
                  fontFamily: "Verdana, Arial, sans-serif"
                }}
              >
                Signature &nbsp;&nbsp; ______________
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      className="mix-memo-dual-root"
      style={{ fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 11, color: "#000" }}
    >
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        const officeTitle = isCurrentStatus ? "OFFICE COPY - CURRENT STATUS" : "OFFICE COPY";
        const customerTitle = isCurrentStatus
          ? "CUSTOMER COPY - CURRENT STATUS"
          : "CUSTOMER COPY";
        return (
          <div
            key={pageIdx}
            className={`mix-memo-dual-page${isLastPage ? "" : " page-break"}`}
          >
            {renderCopy(officeTitle, pageItems, pageIdx, isLastPage, true)}
            {renderCopy(customerTitle, pageItems, pageIdx, isLastPage, false)}
          </div>
        );
      })}
    </div>
  );
};

export default MixMemoDualFormat;
