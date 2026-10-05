import React from "react";
import {
  FALLBACK_MEMO_CONDITIONS,
  fmtDate,
  fmtNum,
  getVal
} from "../shared/printUtils";

/**
 * MVC: SoSalePrintInv_USA_F1.cshtml
 * Page 1 / middle: 30 records + FULL header (no footer)
 * Last page: up to 30 records + FULL header + Total + footer
 * ≤30 → 1 page (header + rows + footer)
 */
const PAGE_SIZE = 30;
const LAST_PAGE_SIZE = 30;
const COL_COUNT = 16;

function paginateSaleFormat1(items, pageSize = PAGE_SIZE, lastCap = LAST_PAGE_SIZE) {
  const list = items || [];
  const n = list.length;
  if (!n) return [[]];

  // Fits on 1 sheet with header + Total + footer
  if (n <= lastCap) return [list];

  const pages = [];
  let start = 0;
  while (n - start > lastCap) {
    pages.push(list.slice(start, start + pageSize));
    start += pageSize;
  }
  if (start < n) {
    pages.push(list.slice(start));
  } else if (pages.length > 0 && lastCap < pageSize) {
    pages.push([]);
  }
  return pages;
}

const FONT = "Verdana, Arial, Helvetica, sans-serif";

const box = { border: "2px solid #484848" };
const cell = {
  border: "1px solid #484848",
  padding: "4px 3px",
  textAlign: "center",
  verticalAlign: "middle",
  height: 24,
  fontSize: 9,
  fontFamily: FONT,
  color: "#000",
  lineHeight: 1.35
};
const emptyCell = {
  border: "none",
  height: 22,
  padding: "4px 0",
  fontSize: 9
};

const HEADERS = [
  "Sr No",
  "Item",
  "Shp",
  "Cts",
  "Col",
  "Cla",
  "Cut",
  "pol",
  "sym",
  "FL",
  "Rapa",
  "Back",
  "Rate",
  "Amt",
  "Lab",
  "CertificateNo"
];

const SaleUsaFormat1 = ({ data, items, totals, company, logoUrl }) => {
  const pages = paginateSaleFormat1(items, PAGE_SIZE, LAST_PAGE_SIZE);
  const conditions = company.saleConditions || FALLBACK_MEMO_CONDITIONS;

  const renderInvoiceHeader = () => (
    <>
      <table style={{ width: "100%", borderCollapse: "collapse", ...box, fontFamily: FONT }}>
        <tbody>
          <tr style={{ height: 42 }}>
            <td
              rowSpan={2}
              style={{
                width: 100,
                borderRight: "2px solid #484848",
                textAlign: "center",
                verticalAlign: "middle",
                padding: 4
              }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ width: 100, height: 75, objectFit: "contain" }} />
              ) : null}
            </td>
            <td
              style={{
                textAlign: "center",
                verticalAlign: "middle",
                fontSize: 20,
                fontWeight: "bold",
                fontFamily: FONT,
                color: "#000"
              }}
            >
              {company.companyName}
            </td>
          </tr>
          <tr style={{ height: 36 }}>
            <td
              style={{
                textAlign: "center",
                verticalAlign: "middle",
                borderTop: "2px solid #484848",
                fontSize: 15,
                fontWeight: "bold",
                textDecoration: "underline",
                fontFamily: FONT,
                color: "#000"
              }}
            >
              INVOICE
            </td>
          </tr>
        </tbody>
      </table>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "2px solid #484848",
          borderTop: "none",
          fontFamily: FONT,
          fontSize: 12,
          color: "#000"
        }}
      >
        <tbody>
          <tr>
            <td style={{ width: "58%", padding: "2px 8px", verticalAlign: "top" }}>
              <table style={{ borderCollapse: "collapse", fontFamily: FONT, fontSize: 12 }}>
                <tbody>
                  <tr>
                    <td style={{ minWidth: 70, lineHeight: 1.5, padding: "1px 0" }}>Party</td>
                    <td style={{ width: 14, padding: "1px 0" }}>:</td>
                    <td style={{ padding: "1px 0" }}>{getVal(data, "PartyName", "partyName")}</td>
                  </tr>
                  <tr>
                    <td style={{ verticalAlign: "top", lineHeight: 1.5, padding: "1px 0" }}>Address</td>
                    <td style={{ verticalAlign: "top", padding: "1px 0" }}>:</td>
                    <td style={{ padding: "1px 0", lineHeight: 1.5 }}>
                      {company.companyAddress}
                      <br />
                      {company.companyAddress1}
                      <br />
                      {company.companyAddress2}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ lineHeight: 1.5, padding: "1px 0" }}>City</td>
                    <td style={{ padding: "1px 0" }}>:</td>
                    <td style={{ padding: "1px 0" }} />
                  </tr>
                  <tr>
                    <td style={{ lineHeight: 1.5, padding: "1px 0" }}>Country</td>
                    <td style={{ padding: "1px 0" }}>:</td>
                    <td style={{ padding: "1px 0" }} />
                  </tr>
                </tbody>
              </table>
            </td>
            <td style={{ width: "42%", padding: "2px 8px", verticalAlign: "top" }}>
              <table style={{ borderCollapse: "collapse", fontFamily: FONT, fontSize: 12 }}>
                <tbody>
                  <tr>
                    <td style={{ minWidth: 75, lineHeight: 1.5, padding: "1px 0" }}>Date</td>
                    <td style={{ width: 14, padding: "1px 0" }}>:</td>
                    <td style={{ padding: "1px 0", fontSize: 11 }}>
                      {fmtDate(getVal(data, "RoundDate", "roundDate", "TrnDate", "trnDate"))}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ lineHeight: 1.5, padding: "1px 0" }}>Due</td>
                    <td style={{ padding: "1px 0" }}>:</td>
                    <td style={{ padding: "1px 0", fontSize: 11 }}>
                      {fmtDate(getVal(data, "DueDate", "dueDate"))}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ lineHeight: 1.5, padding: "1px 0" }}>Invoice No</td>
                    <td style={{ padding: "1px 0" }}>:</td>
                    <td style={{ padding: "1px 0" }}>{getVal(data, "InvNo", "invNo")}</td>
                  </tr>
                  <tr>
                    <td style={{ lineHeight: 1.5, padding: "1px 0" }}>Tel/Fax</td>
                    <td style={{ padding: "1px 0" }}>:</td>
                    <td style={{ padding: "1px 0" }}>{company.companyFax || ""}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );

  return (
    <div
      className="sale-usa-f1-root"
      style={{ fontFamily: FONT, fontSize: 13, color: "#000", lineHeight: 1.3 }}
    >
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        const isSinglePage = pages.length === 1;

        // Single / last page: fill to 30 so footer sits under table
        let itemsPerPage;
        if (isSinglePage || isLastPage) {
          itemsPerPage = LAST_PAGE_SIZE;
        } else {
          itemsPerPage = PAGE_SIZE;
        }

        let srNo = 1;
        if (pageItems.length && items?.length) {
          const idx = items.indexOf(pageItems[0]);
          srNo = idx >= 0 ? idx + 1 : pageIdx * PAGE_SIZE + 1;
        }

        return (
          <div key={pageIdx} className={`sale-usa-f1-page${isLastPage ? "" : " page-break"}`}>
            {/* FULL invoice header on EVERY page including last page */}
            <div className="sale-usa-f1-header">{renderInvoiceHeader()}</div>

            <table
              className="sale-usa-f1-item-table"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "2px solid #484848",
                fontSize: 9,
                fontFamily: FONT,
                marginTop: 6,
                color: "#000"
              }}
            >
              <thead>
                <tr style={{ fontSize: 9, height: 26 }}>
                  {HEADERS.map((h) => (
                    <th key={h} style={{ ...cell, fontWeight: "bold" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => (
                  <tr key={idx} style={{ fontSize: 9, height: 24 }}>
                    <td style={cell}>{srNo++}</td>
                    <td style={cell}>{getVal(item, "Lotno", "lotNo")}</td>
                    <td style={cell}>{getVal(item, "ShapeId", "shapeId")}</td>
                    <td style={cell}>{fmtNum(getVal(item, "Carats", "carats"), 2)}</td>
                    <td style={cell}>{getVal(item, "ColorId", "colorId")}</td>
                    <td style={cell}>{getVal(item, "ClarityId", "clarityId")}</td>
                    <td style={cell}>{getVal(item, "PropId", "propId")}</td>
                    <td style={cell}>{getVal(item, "PolishId", "polishId")}</td>
                    <td style={cell}>{getVal(item, "SymId", "symId")}</td>
                    <td style={cell}>{getVal(item, "FLId", "flId")}</td>
                    <td style={cell}>{fmtNum(getVal(item, "MRP", "mrp", "Rap", "rap"), 2)}</td>
                    <td style={cell}>{getVal(item, "Back", "back")}</td>
                    <td style={cell}>{fmtNum(getVal(item, "Rate", "rate"), 2)}</td>
                    <td style={cell}>{fmtNum(getVal(item, "Amount", "amount"), 2)}</td>
                    <td style={cell}>{getVal(item, "CertId", "certId")}</td>
                    <td style={cell}>{getVal(item, "CertificateNo", "certificateNo")}</td>
                  </tr>
                ))}

                {Array.from({ length: Math.max(0, itemsPerPage - pageItems.length) }).map((_, i) => (
                  <tr key={`e-${i}`} className="empty-row" style={{ height: 22 }}>
                    {Array.from({ length: COL_COUNT }).map((__, c) => (
                      <td key={c} style={emptyCell}>
                        &nbsp;
                      </td>
                    ))}
                  </tr>
                ))}

                {isLastPage && (
                  <tr
                    className="sale-usa-f1-totals-row"
                    style={{ fontSize: 11, borderTop: "2px solid #484848", height: 24 }}
                  >
                    <td colSpan={3} style={{ ...cell, textAlign: "center", fontSize: 11 }}>
                      <b>Total :</b>
                    </td>
                    <td style={{ ...cell, fontSize: 11 }}>{fmtNum(totals.wt, 2)}</td>
                    <td colSpan={9} style={{ ...cell, textAlign: "center" }} />
                    <td style={{ ...cell, fontSize: 11 }}>{fmtNum(totals.amount, 2)}</td>
                    <td colSpan={2} style={{ ...cell, textAlign: "center" }} />
                  </tr>
                )}
              </tbody>
            </table>

            {isLastPage && (
              <div className="sale-usa-f1-footer">
                <div style={{ borderTop: "2px solid black", marginTop: 6, width: "100%" }} />
                <div
                  style={{
                    marginTop: 4,
                    fontWeight: "bold",
                    fontSize: 11,
                    fontFamily: FONT,
                    color: "#000"
                  }}
                >
                  GOODS SOLD & DELIVERED IN HONG KONG , GOODS ONCE SOLD ARE NOT RETURNABLE
                </div>

                <table
                  style={{
                    fontFamily: FONT,
                    fontSize: 13,
                    borderCollapse: "collapse",
                    marginTop: 6,
                    color: "#000"
                  }}
                >
                  <tbody>
                    <tr>
                      <td colSpan={2} style={{ color: "#000", fontWeight: "bold" }}>
                        PAYMENT INFORMATION:
                      </td>
                    </tr>
                    <tr>
                      <td style={{ color: "#000" }}>Company Name :</td>
                      <td style={{ color: "#000" }}>{company.companyName}</td>
                    </tr>
                    <tr>
                      <td style={{ color: "#000" }}>Account Number :</td>
                      <td style={{ color: "#000" }}>{getVal(data, "BankAccNo")}</td>
                    </tr>
                    <tr>
                      <td style={{ width: 140, color: "#000" }}>Bank Name :</td>
                      <td style={{ color: "#000" }}>{getVal(data, "bnm", "BankName")}</td>
                    </tr>
                    <tr>
                      <td style={{ color: "#000" }}>Bank Address :</td>
                      <td style={{ color: "#000" }}>{getVal(data, "BankAddress1")}</td>
                    </tr>
                  </tbody>
                </table>

                <div
                  style={{
                    fontSize: 9,
                    fontWeight: "bold",
                    marginTop: 10,
                    wordSpacing: 4,
                    fontFamily: FONT,
                    color: "#000"
                  }}
                >
                  {conditions}
                </div>

                <table
                  className="sale-usa-f1-sign"
                  style={{ width: "100%", marginTop: 14, borderCollapse: "collapse", fontFamily: FONT }}
                >
                  <tbody>
                    <tr>
                      <td style={{ width: "50%", textAlign: "center", fontWeight: "bold", fontSize: 13, color: "#000" }}>
                        Buyer's Confirmation
                      </td>
                      <td style={{ width: "50%", textAlign: "center", fontWeight: "bold", fontSize: 13, color: "#000" }}>
                        {company.companyName}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ paddingTop: 22, textAlign: "center", fontWeight: "bold", fontSize: 12, color: "#000" }}>
                        (Chop & Signature)
                      </td>
                      <td style={{ paddingTop: 22, textAlign: "center", fontWeight: "bold", fontSize: 12, color: "#000" }}>
                        Authorized Signature(s)
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ borderTop: "2px solid black", marginTop: 6, width: "100%" }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SaleUsaFormat1;
