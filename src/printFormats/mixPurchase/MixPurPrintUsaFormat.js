import React from "react";
import { fmtDateSlash, fmtNum, getPrintAmountHeader, getVal, paginateStella } from "../shared/printUtils";

// MVC Views/MixPurchase/MixPurchasePrint_USA.cshtml — source of truth for Mix Purchase (variant=note)
// MVC layout: 24 on full pages, 20 on single/last page with totals, signature and footer.
const ITEMS_PER_PAGE_DEFAULT = 20;
const LAST_PAGE_ITEMS_DEFAULT = 16;
const ITEMS_PER_PAGE_NOTE = 25;
const LAST_PAGE_ITEMS_NOTE = 25;
const ITEMS_PER_PAGE_CONSIGNMENT = 24;
const LAST_PAGE_ITEMS_CONSIGNMENT = 20;
const COL_COUNT = 7;

/**
 * Mix Purchase Note pagination:
 * - 25 data rows per page
 * - <= 25 items: single page with 25 rows (data + empty) + Totals + Signature + Footer
 * - > 25 items: multi-page with 25 rows on each page.
 */
export const paginateMixPur = (items, fullPageCap = 25, lastPageCap = 25) => {
  const list = items || [];
  if (!list.length) return [[]];
  if (list.length <= lastPageCap) {
    return [list];
  }

  const pages = [];
  let start = 0;
  while (start < list.length) {
    const remaining = list.length - start;
    if (remaining <= lastPageCap) {
      pages.push(list.slice(start));
      break;
    }
    let take = fullPageCap;
    if (remaining - take < 1) {
      take = Math.ceil(remaining / 2);
    }
    pages.push(list.slice(start, start + take));
    start += take;
  }
  return pages;
};

/** MVC body: Verdana — header 13px, item rows 12px (MixPurchasePrint_USA) */
const FONT_BODY = "Verdana, Arial, sans-serif";
const FS = 13; // meta / header chrome
const FS_ITEM_HDR = 13; // MVC thead font-size:13px
const FS_ITEM = 12; // MVC tbody tr font-size:12px
const FS_COMPANY = 14; // MVC company name
const FS_PARTY = 14; // MVC party name in address box
const FS_TITLE_NOTE = 18; // MVC MixPurchasePrint_USA "GENERAL PURCHASE NOTE"
const FS_TITLE_RETURN = 24; // MVC MixPurRtnPrint_USA "GENERAL PUR RETURN"
const FS_ADDR = 12; // MVC .address-box div / company address lines
const FS_TOTALS = 13; // MVC totals row
const ROW_H = 20; // 20px row height for 25 data rows

const th = {
  background: "#c0c0c0",
  border: "1px solid #000",
  padding: "4px 0",
  textAlign: "center",
  fontWeight: "bold",
  fontFamily: FONT_BODY,
  fontSize: FS_ITEM_HDR
};

const topCell = {
  border: "1px solid #000",
  padding: "0 6px",
  textAlign: "center",
  verticalAlign: "middle",
  height: 20,
  fontFamily: FONT_BODY,
  fontSize: FS
};

const itemCell = {
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  borderTop: "none",
  borderBottom: "none",
  padding: "0 6px",
  textAlign: "center",
  verticalAlign: "middle",
  height: ROW_H,
  fontFamily: FONT_BODY,
  fontSize: FS_ITEM
};

/**
 * MVC MixPurchasePrint_USA column proportions:
 * Sr No (5%), Stock # (18%), DESCRIPTION (28%), QTY (5%), WT. (8%), Price/Carat (14%), Amount (22%)
 */
const ITEM_COL_WIDTHS = ["5%", "18%", "28%", "5%", "8%", "14%", "22%"];

/** Keep MM/dd/yyyy from API; otherwise format like MVC ToString("MM/dd/yyyy"). */
const fmtDateSlashOrRaw = (val) => {
  if (!val) return "";
  const raw = String(val).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) return raw;
  return fmtDateSlash(val);
};

const MixPurPrintUsaFormat = ({
  data,
  items,
  totals,
  company,
  logoUrl,
  heading = "GENERAL PURCHASE",
  /**
   * "note" = MixPurchasePrint_USA (GENERAL PURCHASE NOTE)
   * "usa" = MixPurRtnPrint_USA (GENERAL PUR RETURN)
   * "consignment" = MixConsignmentPrint_USA (GENERAL MEMO IN)
   */
  variant = "usa"
}) => {
  const isNote = variant === "note";
  const isConsignment = variant === "consignment";
  const itemsPerPage = isNote
    ? ITEMS_PER_PAGE_NOTE
    : isConsignment
      ? ITEMS_PER_PAGE_CONSIGNMENT
      : ITEMS_PER_PAGE_DEFAULT;
  const lastPageItems = isNote
    ? LAST_PAGE_ITEMS_NOTE
    : isConsignment
      ? LAST_PAGE_ITEMS_CONSIGNMENT
      : LAST_PAGE_ITEMS_DEFAULT;
  const pages = isNote
    ? paginateMixPur(items, itemsPerPage, lastPageItems)
    : paginateStella(items, itemsPerPage, lastPageItems);
  const trnDate = getVal(data, "TrnDate", "trnDate");
  const dueDays = getVal(data, "DueDays", "dueDays");
  const dueDateDisplay = fmtDateSlashOrRaw(getVal(data, "DueDate", "dueDate"));
  const customerInvoiceNo = getVal(data, "BillNo", "billNo");
  // MVC: note → InvNo; return/consignment → BillNo as Purchase #
  const purchaseNo = isNote
    ? getVal(data, "InvNo", "invNo")
    : getVal(data, "BillNo", "billNo");
  // MVC: RECEIVED VIA blank for note + consignment; return also blank in view
  const receivedVia = "";
  const amountHeader = isNote ? getPrintAmountHeader(data, company) : "Amount US $";
  const titleSize = isNote ? FS_TITLE_NOTE : FS_TITLE_RETURN;
  const companyColWidth = isNote || isConsignment ? "55%" : "53%";
  const titleColWidth = isNote || isConsignment ? "32%" : "34%";
  const companyDetailSize = FS_ADDR;
  // MVC consignment: "Consigned To:"; purchase/return: "Purchase From:"
  const addressLegend = isConsignment ? "Consigned To:" : "Purchase From:";
  // MVC consignment label has no colon after #
  const purchaseLabel = isConsignment ? "Purchase #" : "Purchase #:";
  const useNoteMeta = isNote;

  const getPageCapacity = (pageIdx) => {
    const isLastPage = pageIdx === pages.length - 1;
    return isLastPage ? lastPageItems : itemsPerPage;
  };

  const renderMetaTable = () => {
    // MVC MixPurchasePrint_USA: Calibri 16px meta table
    if (useNoteMeta) {
      const metaFont = { fontSize: 15, fontFamily: "Calibri, Verdana, Arial, sans-serif" };
      return (
        <div style={{ margin: "15px 0" }}>
          <table
            className="mix-pur-meta-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #000",
              ...metaFont
            }}
          >
            <thead>
              <tr style={{ fontWeight: "bold", ...metaFont }}>
                {[
                  { label: "RECEIVED VIA", width: "27%" },
                  { label: "CUSTOMER INVOICE NO", width: "27%" },
                  { label: "TERMS", width: "18%" },
                  { label: "DUE DATE", width: "28%" }
                ].map((h, i) => (
                  <th
                    key={h.label}
                    style={{
                      ...th,
                      padding: "3px 0",
                      width: h.width,
                      border: "1px solid #000",
                      ...(i === 3 ? { borderRight: "1px solid #000" } : {}),
                      ...metaFont
                    }}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...topCell, ...metaFont }}>{receivedVia || ""}</td>
                <td style={{ ...topCell, ...metaFont }}>{customerInvoiceNo}</td>
                <td style={{ ...topCell, ...metaFont }}>{dueDays ?? ""}</td>
                <td style={{ ...topCell, borderRight: "1px solid #000", ...metaFont }}>{dueDateDisplay}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div style={{ margin: "12px 0" }}>
        <table
          className="mix-pur-meta-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #000",
            fontSize: FS,
            fontFamily: FONT_BODY
          }}
        >
          <thead>
            <tr style={{ fontWeight: "bold", fontFamily: FONT_BODY, fontSize: FS }}>
              {["RECEIVED VIA", "INVOICE #", "TERMS"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    ...th,
                    width: i === 2 ? "34%" : "33%",
                    border: "1px solid #000",
                    ...(i === 2 ? { borderRight: "1px solid #000" } : {})
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={topCell} />
              <td style={topCell}>{getVal(data, "InvNo", "invNo")}</td>
              <td style={{ ...topCell, borderRight: "1px solid #000" }}>{getVal(data, "DueDays", "dueDays")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderTotals = () => {
    const totalCell = {
      borderLeft: "1px solid #000",
      borderRight: "1px solid #000",
      borderTop: "1px solid #000",
      borderBottom: "1px solid #000",
      fontFamily: FONT_BODY,
      fontSize: FS_TOTALS,
      padding: "2px 6px"
    };

    return (
      <tr
        className="mix-pur-total-row"
        style={{
          borderTop: "1px solid #000",
          borderBottom: "1px solid #000",
          fontSize: FS_TOTALS,
          fontFamily: FONT_BODY
        }}
      >
        <td style={{ ...totalCell, width: ITEM_COL_WIDTHS[0] }} />
        <td style={{ ...totalCell, width: ITEM_COL_WIDTHS[1] }} />
        <td style={{ ...totalCell, width: ITEM_COL_WIDTHS[2] }} />
        <td style={{ ...totalCell, width: ITEM_COL_WIDTHS[3], textAlign: "right", verticalAlign: "top" }}>{totals.qty}</td>
        <td style={{ ...totalCell, width: ITEM_COL_WIDTHS[4], textAlign: "right", verticalAlign: "top" }}>
          {fmtNum(totals.wt, 2)}
        </td>
        <td style={{ ...totalCell, width: ITEM_COL_WIDTHS[5], paddingLeft: 8, verticalAlign: "top" }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: FS_TOTALS, lineHeight: 1.25 }}>Sub Total</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: FS_TOTALS, lineHeight: 1.25 }}>Charges</div>
          <div style={{ fontWeight: "bold", fontSize: FS_TOTALS, fontFamily: FONT_BODY, marginTop: 4, lineHeight: 1.25 }}>TOTAL</div>
        </td>
        <td style={{ ...totalCell, width: ITEM_COL_WIDTHS[6], textAlign: "right", verticalAlign: "top", paddingRight: 6 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: FS_TOTALS, lineHeight: 1.25 }}>{fmtNum(totals.amount, 2)}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: FS_TOTALS, lineHeight: 1.25 }}>&nbsp;</div>
          <div style={{ fontWeight: "bold", fontSize: FS_TOTALS, fontFamily: FONT_BODY, marginTop: 4, lineHeight: 1.25 }}>{fmtNum(totals.amount, 2)}</div>
        </td>
      </tr>
    );
  };

  const renderHeader = () => (
    <>
      <table style={{ width: "100%", paddingBottom: 10, fontFamily: FONT_BODY, fontSize: FS }}>
        <tbody>
          <tr>
            <td style={{ width: "13%", verticalAlign: "top" }}>
              {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: 90 }} /> : null}
            </td>
            <td style={{ width: companyColWidth, verticalAlign: "top", fontSize: companyDetailSize, fontFamily: FONT_BODY }}>
              <div
                className="mix-pur-company-name"
                style={{ fontWeight: "bold", fontSize: FS_COMPANY, fontFamily: FONT_BODY }}
              >
                {company.companyName}
              </div>
              <div className="mix-pur-company-detail" style={{ marginTop: 3, fontSize: companyDetailSize, fontFamily: FONT_BODY }}>
                {company.companyAddress}
              </div>
              <div className="mix-pur-company-detail" style={{ fontSize: companyDetailSize, fontFamily: FONT_BODY }}>
                {company.companyAddress1}
              </div>
              <div className="mix-pur-company-detail" style={{ fontSize: companyDetailSize, fontFamily: FONT_BODY }}>
                {company.companyAddress2}
              </div>
              <div className="mix-pur-company-detail" style={{ marginTop: 5, fontSize: companyDetailSize, fontFamily: FONT_BODY }}>
                <b>Tel:</b>&nbsp;&nbsp;{company.companyPhone}
              </div>
              <div className="mix-pur-company-detail" style={{ marginTop: 5, fontSize: companyDetailSize, fontFamily: FONT_BODY }}>
                <b>Email:</b>&nbsp;&nbsp;{company.companyEmail}
              </div>
            </td>
            <td style={{ width: titleColWidth, verticalAlign: "top", fontFamily: FONT_BODY }}>
              <div
                className="mix-pur-title"
                style={{
                  textAlign: "left",
                  fontWeight: "bold",
                  fontSize: titleSize,
                  paddingTop: 5,
                  lineHeight: 1.15,
                  fontFamily: FONT_BODY,
                  whiteSpace: "nowrap"
                }}
              >
                {heading}
              </div>
              <table style={{ width: "100%", fontSize: FS, marginTop: 10, fontFamily: FONT_BODY }}>
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: "5px 0",
                        fontFamily: FONT_BODY,
                        fontSize: FS,
                        whiteSpace: "nowrap",
                        verticalAlign: "top"
                      }}
                    >
                      <b>Date :</b>
                    </td>
                    <td
                      style={{
                        padding: "5px 0 5px 8px",
                        fontFamily: FONT_BODY,
                        fontSize: FS,
                        whiteSpace: "nowrap",
                        verticalAlign: "top"
                      }}
                    >
                      {fmtDateSlashOrRaw(trnDate)}
                    </td>
                    <td style={{ width: "100%" }} />
                  </tr>
                  <tr>
                    <td
                      style={{
                        fontFamily: FONT_BODY,
                        fontSize: FS,
                        whiteSpace: "nowrap",
                        verticalAlign: "top"
                      }}
                    >
                      <b>{purchaseLabel}</b>
                    </td>
                    <td
                      style={{
                        paddingLeft: 8,
                        fontFamily: FONT_BODY,
                        fontSize: FS,
                        whiteSpace: "nowrap",
                        verticalAlign: "top"
                      }}
                    >
                      {purchaseNo}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", marginTop: 10, fontFamily: FONT_BODY, fontSize: FS }}>
        <tbody>
          <tr>
            <td style={{ width: "50%", paddingRight: 20 }}>
              <fieldset
                className="mix-pur-address-box"
                style={{
                  border: "1px solid #000",
                  borderRadius: 12,
                  padding: "8px 15px 12px 10px",
                  height: 135,
                  boxSizing: "border-box",
                  margin: 0,
                  fontFamily: FONT_BODY,
                  fontSize: FS
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
                    border: "none",
                    fontFamily: FONT_BODY
                  }}
                >
                  {addressLegend}
                </legend>
                <div
                  className="mix-pur-party-name"
                  style={{
                    fontSize: isNote ? FS_PARTY : FS,
                    letterSpacing: "0.9px",
                    marginBottom: 5,
                    fontFamily: FONT_BODY
                  }}
                >
                  {getVal(data, "PartyName", "partyName")}
                </div>
                {/* MVC .address-box div: line-height: 1.6; font-size: 12px; margin-bottom: 5px; */}
                <div className="mix-pur-addr-line" style={{ lineHeight: 1.6, fontSize: FS_ADDR, marginBottom: 5, fontFamily: FONT_BODY }}>
                  {getVal(data, "AddressLine1", "addressLine1")}
                </div>
                <div className="mix-pur-addr-line" style={{ lineHeight: 1.6, fontSize: FS_ADDR, marginBottom: 5, fontFamily: FONT_BODY }}>
                  {getVal(data, "AddressLine2", "addressLine2")}
                </div>
                <div className="mix-pur-addr-line" style={{ lineHeight: 1.6, fontSize: FS_ADDR, marginBottom: 5, fontFamily: FONT_BODY }}>
                  {getVal(data, "AddressLine3", "addressLine3")}
                </div>
              </fieldset>
            </td>
            <td style={{ width: "50%", paddingLeft: 20 }} />
          </tr>
        </tbody>
      </table>

      {renderMetaTable()}
    </>
  );

  return (
    <div style={{ fontFamily: FONT_BODY, fontSize: FS, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        const pageCapacity = getPageCapacity(pageIdx);
        const srNoStart = pages.slice(0, pageIdx).reduce((sum, page) => sum + page.length, 0) + 1;
        let srNo = srNoStart;

        return (
          <div
            key={pageIdx}
            className={`mix-pur-print-page-block${isLastPage ? "" : " page-break"}${
              pageIdx > 0 ? " mix-pur-print-page-next" : ""
            }`}
            style={{
              fontFamily: FONT_BODY,
              fontSize: FS,
              color: "#000",
              ...(pageIdx > 0 ? { marginTop: 24, paddingTop: 10 } : {})
            }}
          >
            {renderHeader()}

            <table
              className="mix-pur-item-table"
              style={{
                width: "calc(100% - 2px)",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                borderLeft: "1px solid #000",
                borderRight: "1px solid #000",
                borderBottom: "1px solid #000",
                fontFamily: FONT_BODY,
                fontSize: FS_ITEM
              }}
            >
              <colgroup>
                {ITEM_COL_WIDTHS.map((w, i) => (
                  <col key={i} style={{ width: w }} />
                ))}
              </colgroup>
              <thead>
                <tr style={{ fontSize: FS_ITEM_HDR, fontFamily: FONT_BODY }}>
                  {["Sr No", "Stock #", "DESCRIPTION", "QTY", "WT.", "Price/Carat", amountHeader].map(
                    (h, col) => (
                      <th
                        key={`${h}-${col}`}
                        style={{
                          ...th,
                          width: ITEM_COL_WIDTHS[col],
                          ...(col === COL_COUNT - 1 ? { borderRight: "1px solid #000" } : {})
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => (
                  <tr
                    key={idx}
                    className="mix-pur-item-row"
                    style={{ fontSize: FS_ITEM, fontFamily: FONT_BODY }}
                  >
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[0], textAlign: "center" }}>
                      {srNo++}
                    </td>
                    <td
                      style={{
                        ...itemCell,
                        width: ITEM_COL_WIDTHS[1],
                        textAlign: "left",
                        whiteSpace: "nowrap",
                        overflow: "hidden"
                      }}
                    >
                      {getVal(item, "StockNo", "stockNo", "Lotno", "lotno", "LotNo", "lotNo")}
                    </td>
                    <td
                      style={{
                        ...itemCell,
                        width: ITEM_COL_WIDTHS[2],
                        textAlign: "left",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {getVal(item, "Description", "description", "ItemName", "itemName")}
                    </td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[3], textAlign: "right" }}>
                      {getVal(item, "Qty", "qty", "Pcs", "pcs")}
                    </td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[4], textAlign: "right" }}>
                      {fmtNum(getVal(item, "Weight", "weight", "Carats", "carats"), 2)}
                    </td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[5], textAlign: "right" }}>
                      {fmtNum(getVal(item, "PricePerCarat", "pricePerCarat", "Rate", "rate"), 2)}
                    </td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[6], textAlign: "right", borderRight: "1px solid #000" }}>
                      {fmtNum(getVal(item, "Amount", "amount"), 2)}
                    </td>
                  </tr>
                ))}

                {Array.from({ length: Math.max(0, pageCapacity - pageItems.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="mix-pur-empty-row" style={{ fontFamily: FONT_BODY }}>
                    {Array.from({ length: COL_COUNT }).map((__, col) => (
                      <td
                        key={col}
                        style={{
                          ...itemCell,
                          width: ITEM_COL_WIDTHS[col],
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
                  <tr style={{ height: 0 }}>
                    {Array.from({ length: COL_COUNT }).map((_, col) => (
                      <td
                        key={col}
                        style={{
                          borderBottom: "1px solid #000",
                          borderLeft: "1px solid #000",
                          borderRight: "1px solid #000",
                          width: ITEM_COL_WIDTHS[col],
                          padding: 0,
                          height: 0,
                          lineHeight: 0
                        }}
                      />
                    ))}
                  </tr>
                )}

                {isLastPage && renderTotals()}
              </tbody>
            </table>

            <div style={{ marginTop: 6, fontFamily: FONT_BODY }}>
              <span style={{ fontSize: FS, fontFamily: FONT_BODY }}>Signature:</span>
              <span
                style={{
                  display: "inline-block",
                  borderBottom: "1px solid #000",
                  width: 300,
                  marginLeft: 10,
                  verticalAlign: "baseline"
                }}
              />
            </div>

            <table
              className="mix-pur-footer"
              style={{
                width: "100%",
                marginTop: 8,
                fontFamily: FONT_BODY,
                fontSize: FS
              }}
            >
              <tbody>
                <tr>
                  <td style={{ width: "50%", textAlign: "left", fontSize: FS, fontFamily: FONT_BODY }}>
                    {company.companyFooter || "Powered by SoftOnCloud"}
                  </td>
                  <td style={{ width: "50%", textAlign: "right", fontSize: FS, fontFamily: FONT_BODY }}>
                    {pageIdx + 1}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default MixPurPrintUsaFormat;
