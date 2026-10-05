import React from "react";
import { fmtDateSlash, fmtNum, getPrintAmountHeader, getVal, paginateStella } from "../shared/printUtils";

// MVC Views/MixPurchase/MixPurchasePrint_USA.cshtml — match MVC PDF visual font sizes
// Purchase/return: 20 per page. Mix Consignment (GENERAL MEMO IN): MVC 29 / last+single 27.
const ITEMS_PER_PAGE_DEFAULT = 20;
const LAST_PAGE_ITEMS_DEFAULT = 20;
const ITEMS_PER_PAGE_CONSIGNMENT = 29;
const LAST_PAGE_ITEMS_CONSIGNMENT = 27;
const COL_COUNT = 7;

/** MVC body: Verdana — one size for tables/body so React matches MVC PDF look */
const FONT_BODY = "Verdana, Arial, sans-serif";
const FS = 13; // unified body/table size (MVC PDF visual)
const FS_COMPANY = 14; // MVC company name
const FS_TITLE_NOTE = 18; // MVC MixPurchasePrint_USA "GENERAL PURCHASE NOTE"
const FS_TITLE_RETURN = 24; // MVC MixPurRtnPrint_USA "GENERAL PUR RETURN"
const FS_ADDR = 12; // MVC .address-box div / company address lines

const th = {
  background: "#c0c0c0",
  border: "1px solid #000",
  padding: "6px 0",
  textAlign: "center",
  fontWeight: "bold",
  fontFamily: FONT_BODY,
  fontSize: FS
};

const topCell = {
  border: "1px solid #000",
  padding: "0 6px",
  textAlign: "center",
  verticalAlign: "middle",
  height: 24,
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
  height: 24,
  fontFamily: FONT_BODY,
  fontSize: FS
};

const ITEM_COL_WIDTHS = ["6%", "12%", "34%", "8%", "10%", "14%", "16%"];

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
  const itemsPerPage = isConsignment ? ITEMS_PER_PAGE_CONSIGNMENT : ITEMS_PER_PAGE_DEFAULT;
  const lastPageItems = isConsignment ? LAST_PAGE_ITEMS_CONSIGNMENT : LAST_PAGE_ITEMS_DEFAULT;
  const pages = paginateStella(items, itemsPerPage, lastPageItems);
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
    // Same font size as item table (MVC PDF look — not oversized Calibri 16)
    if (useNoteMeta) {
      return (
        <div style={{ margin: "15px 0" }}>
          <table
            className="mix-pur-meta-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: FS,
              fontFamily: FONT_BODY
            }}
          >
            <thead>
              <tr style={{ fontWeight: "bold", fontFamily: FONT_BODY, fontSize: FS }}>
                {[
                  { label: "RECEIVED VIA", width: "30%" },
                  { label: "CUSTOMER INVOICE NO", width: "30%" },
                  { label: "TERMS", width: "20%" },
                  { label: "DUE DATE", width: "30%" }
                ].map((h) => (
                  <th key={h.label} style={{ ...th, width: h.width }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={topCell}>{receivedVia || ""}</td>
                <td style={topCell}>{customerInvoiceNo}</td>
                <td style={topCell}>{dueDays ?? ""}</td>
                <td style={topCell}>{dueDateDisplay}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div style={{ margin: "15px 0" }}>
        <table
          className="mix-pur-meta-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: FS,
            fontFamily: FONT_BODY
          }}
        >
          <thead>
            <tr style={{ fontWeight: "bold", fontFamily: FONT_BODY, fontSize: FS }}>
              {["RECEIVED VIA", "INVOICE #", "TERMS"].map((h, i) => (
                <th key={h} style={{ ...th, width: i === 2 ? "34%" : "33%" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={topCell} />
              <td style={topCell}>{getVal(data, "InvNo", "invNo")}</td>
              <td style={topCell}>{getVal(data, "DueDays", "dueDays")}</td>
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
      fontFamily: FONT_BODY,
      fontSize: FS
    };

    return (
      <tr
        style={{
          borderTop: "1px solid #000",
          borderBottom: "1px solid #000",
          fontSize: FS,
          fontFamily: FONT_BODY
        }}
      >
        <td style={totalCell} />
        <td style={totalCell} />
        <td style={totalCell} />
        <td style={{ ...totalCell, textAlign: "right", verticalAlign: "top" }}>{totals.qty}</td>
        <td style={{ ...totalCell, textAlign: "right", verticalAlign: "top" }}>
          {fmtNum(totals.wt, 2)}
        </td>
        <td style={{ ...totalCell, paddingLeft: 10, verticalAlign: "top" }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: FS }}>Sub Total</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: FS }}>Charges</div>
          <br />
          <div style={{ fontWeight: "bold", fontSize: FS, fontFamily: FONT_BODY }}>TOTAL</div>
        </td>
        <td style={{ ...totalCell, textAlign: "right", verticalAlign: "top" }}>
          {fmtNum(totals.amount, 2)}
          <br />
          <br />
          <br />
          {fmtNum(totals.amount, 2)}
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
                  height: 150,
                  margin: 0,
                  fontFamily: FONT_BODY,
                  fontSize: FS
                }}
              >
                <legend
                  style={{
                    fontWeight: "bold",
                    fontSize: FS,
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
                    fontSize: FS,
                    letterSpacing: "0.9px",
                    marginBottom: 5,
                    fontFamily: FONT_BODY
                  }}
                >
                  {getVal(data, "PartyName", "partyName")}
                </div>
                {/* MVC .address-box div: font-size:12px */}
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

            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: FS }}>
              <thead>
                <tr style={{ fontSize: FS, fontFamily: FONT_BODY }}>
                  {["Sr No", "Stock #", "DESCRIPTION", "QTY", "WT.", "Price/Carat", amountHeader].map(
                    (h, col) => (
                      <th key={`${h}-${col}`} style={{ ...th, width: ITEM_COL_WIDTHS[col] }}>
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
                    style={{ fontSize: FS, fontFamily: FONT_BODY }}
                  >
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[0] }}>{srNo++}</td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[1], textAlign: "left" }}>
                      {getVal(item, "StockNo", "stockNo", "Lotno", "lotno", "LotNo", "lotNo")}
                    </td>
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[2], textAlign: "left" }}>
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
                    <td style={{ ...itemCell, width: ITEM_COL_WIDTHS[6], textAlign: "right" }}>
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
                  <tr>
                    {Array.from({ length: COL_COUNT }).map((_, col) => (
                      <td key={col} style={{ borderBottom: "1px solid #000" }} />
                    ))}
                  </tr>
                )}

                {isLastPage && renderTotals()}
              </tbody>
            </table>

            <div style={{ marginTop: isConsignment ? 10 : 15, fontFamily: FONT_BODY }}>
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
                marginTop: isConsignment ? 18 : 50,
                fontFamily: FONT_BODY,
                fontSize: FS
              }}
            >
              <tbody>
                <tr>
                  <td style={{ width: "50%", textAlign: "left", fontSize: FS, fontFamily: FONT_BODY }}>
                    {company.companyFooter || ""}
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
