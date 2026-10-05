import React from "react";
import { FALLBACK_MEMO_CONDITIONS, FALLBACK_USA_MEMO_INFORMATION, fmtDateSlash, fmtNum, getVal, paginateVariable } from "../shared/printUtils";

// MVC Views/GeneralMemo/MixMemoOutPrint_USA.cshtml — 20 records per Letter page
const PAGE_SIZE = 20;
// Mix Memo In/Out Current Status — default 20; Mix Consignment Cur Status uses 25
const CUR_STATUS_PAGE_SIZE_DEFAULT = 20;
const FONT_BODY = "Verdana, Arial, sans-serif";
const FS = 13;
const FS_COMPANY = 14;
const FS_TITLE = 24;
const FS_COMPANY_ADDR = 12;
const FS_PARTY_ADDR = 11;
const FS_META = 11;
const FS_ITEM_HDR = 12;
const FS_ITEM = 11;
const ROW_H = 24;
const COL_W = ["6%", "12%", "7%", "9%", "28%", "16%", "22%"];
// MVC PMemoCurStatusPrint_USA / MemoRandumPending — Original + Current columns
const CUR_COL_W = ["5%", "12%", "6%", "6%", "25%", "6%", "6%", "12%", "12%"];

const th = {
  background: "#BFBFBF",
  border: "1px solid #000",
  padding: "6px 0",
  textAlign: "center",
  fontFamily: FONT_BODY,
  fontWeight: "bold"
};
const td = {
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  borderTop: "none",
  borderBottom: "none",
  padding: "0 4px",
  textAlign: "center",
  verticalAlign: "middle",
  height: ROW_H,
  fontFamily: FONT_BODY
};
const tdFull = { ...td, border: "1px solid #000" };
const tdRight = { ...td, textAlign: "right", paddingRight: 6, paddingLeft: 2 };

const MixMemoUsaFormat = ({
  data,
  items,
  totals,
  company,
  logoUrl,
  isCurrentStatus,
  title = "GENERAL MEMO",
  curStatusPageSize = CUR_STATUS_PAGE_SIZE_DEFAULT
}) => {
  // Current Status page size (Mix Memo In Cur Status = 25; Mix Memo Out = 20)
  const curPageSize = isCurrentStatus ? curStatusPageSize : PAGE_SIZE;
  const pages = paginateVariable(
    items,
    isCurrentStatus
      ? { single: curPageSize, first: curPageSize, middle: curPageSize, last: curPageSize }
      : { single: PAGE_SIZE, first: PAGE_SIZE, middle: PAGE_SIZE, last: PAGE_SIZE }
  );
  const colW = isCurrentStatus ? CUR_COL_W : COL_W;
  const colCount = colW.length;
  const rowH = isCurrentStatus ? 16 : ROW_H;
  const addrH = isCurrentStatus ? 100 : 150;
  // MVC memo / Cur Status: Information mid-page; MemoConditions footer (Crystal Conditions param)
  const conditions =
    company.memoConditions || company.saleConditions || FALLBACK_MEMO_CONDITIONS;
  const information =
    company.information || getVal(data, "Information") || FALLBACK_USA_MEMO_INFORMATION;

  const cellBase = { ...td, height: rowH };
  const cellFull = { ...tdFull, height: rowH };
  const cellRight = { ...tdRight, height: rowH };

  const renderAddressBox = (legend) => (
    <fieldset
      className="mix-memo-address-box"
      style={{
        border: "1px solid #000",
        borderRadius: 12,
        padding: isCurrentStatus ? "4px 10px 6px 8px" : "8px 15px 12px 10px",
        height: addrH,
        margin: 0,
        fontFamily: FONT_BODY,
        boxSizing: "border-box"
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
        {legend}
      </legend>
      <div style={{ fontSize: FS, lineHeight: 1.6, marginBottom: 5, fontFamily: FONT_BODY }}>
        {getVal(data, "PartyName", "partyName")}
      </div>
      <div className="mix-memo-addr-line" style={{ lineHeight: 1.6, fontSize: FS_PARTY_ADDR, marginBottom: 5, fontFamily: FONT_BODY }}>
        {getVal(data, "AddressLine1", "addressLine1")}
      </div>
      <div className="mix-memo-addr-line" style={{ lineHeight: 1.6, fontSize: FS_PARTY_ADDR, marginBottom: 5, fontFamily: FONT_BODY }}>
        {getVal(data, "AddressLine2", "addressLine2")}
      </div>
      <div className="mix-memo-addr-line" style={{ lineHeight: 1.6, fontSize: FS_PARTY_ADDR, marginBottom: 5, fontFamily: FONT_BODY }}>
        {getVal(data, "AddressLine3", "addressLine3")}
      </div>
    </fieldset>
  );

  return (
    <div
      className={`mix-memo-usa-root${isCurrentStatus ? " mix-memo-curstatus-root" : ""}`}
      style={{ fontFamily: FONT_BODY, fontSize: FS, color: "#000" }}
    >
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        const pageCap = isCurrentStatus ? curPageSize : PAGE_SIZE;
        // Current Status: do not pad empty rows (avoids Letter overflow / blank sheets)
        const fillTo = isCurrentStatus
          ? pageItems.length
          : isLastPage
            ? Math.max(pageItems.length, pageCap - 4)
            : pageCap;
        const srNoStart = pages.slice(0, pageIdx).reduce((sum, p) => sum + p.length, 0) + 1;
        let srNo = srNoStart;

        return (
          <div
            key={pageIdx}
            className={`mix-memo-usa-page mix-memo-print-page-block${isLastPage ? "" : " page-break"}${
              pageIdx > 0 ? " mix-memo-print-page-next" : ""
            }`}
            style={{
              fontFamily: FONT_BODY,
              fontSize: FS,
              color: "#000",
              ...(pageIdx > 0 ? { marginTop: 10 } : {})
            }}
          >
            <table style={{ width: "100%", paddingBottom: 10, fontFamily: FONT_BODY }}>
              <tbody>
                <tr>
                  <td style={{ width: "13%", verticalAlign: "top" }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="mix-memo-usa-logo" style={{ width: 90 }} />
                    ) : null}
                  </td>
                  <td style={{ width: "55%", verticalAlign: "top", fontSize: FS_COMPANY_ADDR, fontFamily: FONT_BODY }}>
                    <div className="mix-memo-company-name" style={{ fontWeight: "bold", fontSize: FS_COMPANY, fontFamily: FONT_BODY }}>
                      {company.companyName}
                    </div>
                    <div className="mix-memo-company-detail" style={{ marginTop: 3, fontSize: FS_COMPANY_ADDR, fontFamily: FONT_BODY }}>
                      {company.companyAddress}
                    </div>
                    <div className="mix-memo-company-detail" style={{ fontSize: FS_COMPANY_ADDR, fontFamily: FONT_BODY }}>
                      {company.companyAddress1}
                    </div>
                    <div className="mix-memo-company-detail" style={{ fontSize: FS_COMPANY_ADDR, fontFamily: FONT_BODY }}>
                      {company.companyAddress2}
                    </div>
                    <div className="mix-memo-company-detail" style={{ marginTop: 5, fontSize: FS_COMPANY_ADDR, fontFamily: FONT_BODY }}>
                      <b>Tel:</b>&nbsp;&nbsp;{company.companyPhone}
                    </div>
                    <div className="mix-memo-company-detail" style={{ marginTop: 5, fontSize: FS_COMPANY_ADDR, fontFamily: FONT_BODY }}>
                      <b>Email:</b>&nbsp;&nbsp;{company.companyEmail}
                    </div>
                  </td>
                  <td style={{ width: "32%", verticalAlign: "top", fontFamily: FONT_BODY }}>
                    <div
                      className="mix-memo-title"
                      style={{
                        textAlign: "left",
                        fontWeight: "bold",
                        fontSize: FS_TITLE,
                        paddingTop: 5,
                        fontFamily: FONT_BODY,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {title}
                    </div>
                    {isCurrentStatus ? (
                      <div style={{ fontWeight: "bold", fontSize: FS, color: "#555", marginTop: 2 }}>CURRENT STATUS</div>
                    ) : null}
                    <table style={{ width: "100%", fontSize: FS, marginTop: 10, fontFamily: FONT_BODY }}>
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
                          <td>{fmtDateSlash(getVal(data, "RoundDate", "roundDate") || new Date())}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="mix-memo-usa-addr-row" style={{ width: "100%", marginTop: 6 }}>
              <tbody>
                <tr>
                  <td style={{ width: "50%", paddingRight: 12, verticalAlign: "top" }}>
                    {renderAddressBox("Consigned To:")}
                  </td>
                  <td style={{ width: "50%", paddingLeft: 12, verticalAlign: "top" }}>
                    {renderAddressBox("Ship To:")}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Information — MVC margin 7px 0, font 11px */}
            <div
              className="mix-memo-usa-info"
              style={{
                fontSize: FS_META,
                textAlign: "justify",
                margin: "7px 0",
                fontFamily: "Segoe UI, Verdana, Arial, sans-serif"
              }}
            >
              {information}
            </div>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: 6,
                fontSize: FS_META,
                fontFamily: FONT_BODY
              }}
            >
              <thead>
                <tr style={{ fontWeight: "bold" }}>
                  {["CONTACT", "SALES PERSON", "CUST ORDER #", "SHIP VIA", "TRACKING #", "REPORT BY"].map((h) => (
                    <th key={h} style={{ ...th, fontSize: FS_META }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdFull} />
                  <td style={tdFull}>{getVal(data, "SalesPersons", "salesPersons")}</td>
                  <td style={tdFull} />
                  <td style={tdFull}>{getVal(data, "ShipVia", "shipVia")}</td>
                  <td style={tdFull}>{getVal(data, "Tracking", "tracking")}</td>
                  <td style={tdFull} />
                </tr>
              </tbody>
            </table>

            <table className="mix-memo-usa-items" style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY, tableLayout: "fixed" }}>
              <thead>
                {isCurrentStatus ? (
                  <>
                    <tr style={{ fontSize: FS_ITEM_HDR }}>
                      <th rowSpan={2} style={{ ...th, fontSize: FS_ITEM_HDR, width: colW[0] }}>
                        Sr No
                      </th>
                      <th rowSpan={2} style={{ ...th, fontSize: FS_ITEM_HDR, width: colW[1] }}>
                        Stock #
                      </th>
                      <th colSpan={2} style={{ ...th, fontSize: FS_ITEM_HDR }}>
                        Original
                      </th>
                      <th rowSpan={2} style={{ ...th, fontSize: FS_ITEM_HDR, width: colW[4] }}>
                        Description
                      </th>
                      <th colSpan={2} style={{ ...th, fontSize: FS_ITEM_HDR }}>
                        Current
                      </th>
                      <th rowSpan={2} style={{ ...th, fontSize: FS_ITEM_HDR, width: colW[7] }}>
                        Price/Carat
                      </th>
                      <th rowSpan={2} style={{ ...th, fontSize: FS_ITEM_HDR, width: colW[8] }}>
                        Amount US $
                      </th>
                    </tr>
                    <tr style={{ fontSize: FS_ITEM_HDR }}>
                      <th style={{ ...th, fontSize: FS_ITEM_HDR, width: colW[2] }}>Qty</th>
                      <th style={{ ...th, fontSize: FS_ITEM_HDR, width: colW[3] }}>Wt.</th>
                      <th style={{ ...th, fontSize: FS_ITEM_HDR, width: colW[5] }}>Qty</th>
                      <th style={{ ...th, fontSize: FS_ITEM_HDR, width: colW[6] }}>Wt.</th>
                    </tr>
                  </>
                ) : (
                  <tr style={{ fontSize: FS_ITEM_HDR }}>
                    {["Sr No", "Stock #", "QTY", "WT.", "DESCRIPTION", "Price/Carat", "Amount US $"].map((h, col) => (
                      <th key={h} style={{ ...th, fontSize: FS_ITEM_HDR, border: "1px solid #000", width: colW[col] }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {pageItems.map((item, idx) =>
                  isCurrentStatus ? (
                    <tr key={idx} className="mix-memo-item-row" style={{ fontSize: FS_ITEM, fontFamily: FONT_BODY, height: rowH }}>
                      <td style={{ ...cellBase, width: colW[0], fontSize: FS_ITEM }}>{srNo++}</td>
                      <td style={{ ...cellBase, width: colW[1], textAlign: "left", paddingLeft: 8, fontSize: FS_ITEM }}>
                        {getVal(item, "Lotno", "lotNo", "StockNo", "stockNo")}
                      </td>
                      <td style={{ ...cellRight, width: colW[2], paddingRight: 5, fontSize: FS_ITEM }}>
                        {getVal(item, "Qty", "qty", "Pcs", "pcs")}
                      </td>
                      <td style={{ ...cellRight, width: colW[3], paddingRight: 8, fontSize: FS_ITEM }}>
                        {fmtNum(getVal(item, "Weight", "weight", "Carats", "carats"), 2)}
                      </td>
                      <td style={{ ...cellBase, width: colW[4], textAlign: "left", fontSize: FS_ITEM }}>
                        {getVal(item, "Description", "description", "ItemName", "itemName")}
                      </td>
                      <td style={{ ...cellRight, width: colW[5], paddingRight: 5, fontSize: FS_ITEM }} />
                      <td style={{ ...cellRight, width: colW[6], paddingRight: 8, fontSize: FS_ITEM }}>
                        {fmtNum(getVal(item, "Balance", "balance"), 2)}
                      </td>
                      <td style={{ ...cellRight, width: colW[7], fontSize: FS_ITEM }}>
                        {fmtNum(getVal(item, "PricePerCarat", "pricePerCarat", "Rate", "rate"), 2)}
                      </td>
                      <td style={{ ...cellRight, width: colW[8], fontSize: FS_ITEM }}>
                        {fmtNum(getVal(item, "BalanceAmt", "balanceAmt", "MasterCurrencyAmount", "Amount", "amount"), 2)}
                      </td>
                    </tr>
                  ) : (
                    <tr key={idx} className="mix-memo-item-row" style={{ fontSize: FS_ITEM, fontFamily: FONT_BODY, height: rowH }}>
                      <td style={{ ...cellBase, width: colW[0], fontSize: FS_ITEM }}>{srNo++}</td>
                      <td style={{ ...cellBase, width: colW[1], textAlign: "left", paddingLeft: 8, fontSize: FS_ITEM }}>
                        {getVal(item, "Lotno", "lotNo", "StockNo", "stockNo")}
                      </td>
                      <td style={{ ...cellRight, width: colW[2], paddingRight: 5, fontSize: FS_ITEM }}>
                        {getVal(item, "Qty", "qty", "Pcs", "pcs")}
                      </td>
                      <td style={{ ...cellRight, width: colW[3], paddingRight: 8, fontSize: FS_ITEM }}>
                        {fmtNum(getVal(item, "Weight", "weight", "Carats", "carats"), 2)}
                      </td>
                      <td style={{ ...cellBase, width: colW[4], textAlign: "left", fontSize: FS_ITEM }}>
                        {getVal(item, "Description", "description", "ItemName", "itemName")}
                      </td>
                      <td style={{ ...cellRight, width: colW[5], fontSize: FS_ITEM }}>
                        {fmtNum(getVal(item, "PricePerCarat", "pricePerCarat", "Rate", "rate"), 2)}
                      </td>
                      <td style={{ ...cellRight, width: colW[6], fontSize: FS_ITEM }}>
                        {fmtNum(getVal(item, "MasterCurrencyAmount", "Amount", "amount"), 2)}
                      </td>
                    </tr>
                  )
                )}
                {/* Fill empty rows — complete set for any record count */}
                {Array.from({ length: Math.max(0, fillTo - pageItems.length) }).map((_, i) => (
                  <tr key={`e-${i}`} className="mix-memo-empty-row" style={{ height: rowH }}>
                    {Array.from({ length: colCount }).map((__, c) => (
                      <td
                        key={c}
                        style={{
                          borderLeft: "1px solid #000",
                          borderRight: "1px solid #000",
                          borderTop: "none",
                          borderBottom: "none",
                          height: rowH,
                          width: colW[c]
                        }}
                      >
                        &nbsp;
                      </td>
                    ))}
                  </tr>
                ))}
                {!isLastPage && (
                  <tr>
                    {Array.from({ length: colCount }).map((_, c) => (
                      <td key={c} style={{ borderBottom: "1px solid #000", width: colW[c] }} />
                    ))}
                  </tr>
                )}
                {isLastPage &&
                  (isCurrentStatus ? (
                    <tr style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000" }}>
                      <td style={{ ...cellFull, width: colW[0] }} />
                      <td style={{ ...cellFull, width: colW[1] }} />
                      <td style={{ ...cellFull, width: colW[2], textAlign: "right", paddingRight: 5, verticalAlign: "top", fontSize: FS }}>
                        {totals.qty}
                      </td>
                      <td style={{ ...cellFull, width: colW[3], textAlign: "right", paddingRight: 8, verticalAlign: "top", fontSize: FS }}>
                        {fmtNum(totals.wt, 2)}
                      </td>
                      <td style={{ ...cellFull, width: colW[4] }} />
                      <td style={{ ...cellFull, width: colW[5] }} />
                      <td style={{ ...cellFull, width: colW[6], textAlign: "right", paddingRight: 8, verticalAlign: "top", fontSize: FS }}>
                        {fmtNum(totals.balanceWt, 2)}
                      </td>
                      <td
                        style={{
                          ...cellFull,
                          width: colW[7],
                          paddingLeft: 4,
                          paddingRight: 6,
                          fontSize: FS_ITEM_HDR,
                          lineHeight: 1.8,
                          textAlign: "right",
                          height: "auto",
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
                          ...cellFull,
                          width: colW[8],
                          textAlign: "right",
                          paddingRight: 6,
                          paddingLeft: 2,
                          fontSize: FS,
                          lineHeight: 1.8,
                          height: "auto",
                          verticalAlign: "top",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {fmtNum(totals.amount, 2)}
                        <br />
                        <br />
                        <br />
                        {fmtNum(totals.amount, 2)}
                      </td>
                    </tr>
                  ) : (
                    <tr style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000" }}>
                      <td style={{ ...cellFull, width: colW[0] }} />
                      <td style={{ ...cellFull, width: colW[1] }} />
                      <td style={{ ...cellFull, width: colW[2], textAlign: "right", paddingRight: 5, verticalAlign: "top", fontSize: FS }}>
                        {totals.qty}
                      </td>
                      <td style={{ ...cellFull, width: colW[3], textAlign: "right", paddingRight: 8, verticalAlign: "top", fontSize: FS }}>
                        {fmtNum(totals.wt, 2)}
                      </td>
                      <td style={{ ...cellFull, width: colW[4], fontWeight: "bold", verticalAlign: "top" }} />
                      <td
                        style={{
                          ...cellFull,
                          width: colW[5],
                          paddingLeft: 4,
                          paddingRight: 6,
                          fontSize: FS_ITEM_HDR,
                          lineHeight: 1.8,
                          textAlign: "right",
                          height: "auto",
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
                          ...cellFull,
                          width: colW[6],
                          textAlign: "right",
                          paddingRight: 6,
                          paddingLeft: 2,
                          fontSize: FS,
                          lineHeight: 1.8,
                          height: "auto",
                          verticalAlign: "top",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {fmtNum(totals.amount, 2)}
                        <br />
                        <br />
                        <br />
                        {fmtNum(totals.amount, 2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Signature + conditions + footer — keep together; avoid trailing blank print page */}
            <div className="mix-memo-usa-footer-block">
              <div className="mix-memo-usa-signature" style={{ marginTop: 15 }}>
                <span style={{ fontSize: FS, fontFamily: FONT_BODY }}>Signature:</span>
                <span
                  style={{
                    display: "inline-block",
                    borderBottom: "1px solid #000",
                    width: 300,
                    marginLeft: 10
                  }}
                />
              </div>

              <div
                className="mix-memo-usa-conditions"
                style={{
                  fontSize: FS_META,
                  textAlign: "justify",
                  margin: "10px 0",
                  lineHeight: 1.45,
                  fontFamily: "Segoe UI, Verdana, Arial, sans-serif"
                }}
              >
                {conditions}
              </div>

              <table className="mix-memo-footer footer-section" style={{ width: "100%", fontFamily: FONT_BODY, fontSize: FS }}>
                <tbody>
                  <tr>
                    <td
                      className="footer-powered"
                      style={{ width: "50%", textAlign: "left", fontSize: FS, paddingTop: 4, paddingBottom: 8 }}
                    >
                      {company.companyFooter}
                    </td>
                    <td style={{ width: "50%", textAlign: "right", fontSize: FS }}>{pageIdx + 1}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MixMemoUsaFormat;
