import React from "react";
import { FALLBACK_MEMO_CONDITIONS, fmtDateSlash, fmtNum, getVal, paginateStella } from "../shared/printUtils";

// MVC Views/GeneralMemo/MixMemoOutPrint_Single.cshtml (MixMemoUSA_Stella) — 20 records per page
const ITEMS_PER_PAGE = 20;
const LAST_PAGE_ITEMS = 20;
const FONT_BODY = "Verdana, Arial, sans-serif";
const FS = 13;
const FS_COMPANY = 14;
const FS_TITLE = 24;
const FS_COMPANY_ADDR = 12; // company address — smaller than name
const FS_PARTY_ADDR = 11; // AddressLine 1,2,3 — small
const FS_META = 11;
const FS_ITEM_HDR = 12;
const FS_ITEM = 11;
const ROW_H = 24;
const COL_W = ["6%", "12%", "7%", "9%", "28%", "16%", "22%"];

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
const tdFull = {
  ...td,
  border: "1px solid #000"
};
const tdRight = { ...td, textAlign: "right", paddingRight: 6, paddingLeft: 2 };

const MixMemoStellaFormat = ({ data, items, totals, company, logoUrl, isCurrentStatus }) => {
  const pages = paginateStella(items, ITEMS_PER_PAGE, LAST_PAGE_ITEMS);
  const conditions = company.memoConditions || company.saleConditions || FALLBACK_MEMO_CONDITIONS;
  const information = company.information || getVal(data, "Information") || "";

  const renderAddressBox = (legend) => (
    <fieldset
      className="mix-memo-address-box"
      style={{
        border: "1px solid #000",
        borderRadius: 12,
        padding: "8px 15px 12px 10px",
        height: 150,
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
    <div className="mix-memo-stella-root" style={{ fontFamily: FONT_BODY, fontSize: FS, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        // Always fill to page capacity — print stays a complete set for any record count
        const fillTo = ITEMS_PER_PAGE;
        const srNoStart = pages.slice(0, pageIdx).reduce((sum, p) => sum + p.length, 0) + 1;
        let srNo = srNoStart;

        return (
          <div
            key={pageIdx}
            className={`mix-memo-stella-page mix-memo-print-page-block${isLastPage ? "" : " page-break"}${
              pageIdx > 0 ? " mix-memo-print-page-next" : ""
            }`}
            style={{
              fontFamily: FONT_BODY,
              fontSize: FS,
              color: "#000",
              ...(pageIdx > 0 ? { marginTop: 10 } : {})
            }}
          >
            {/* HEADER — MVC */}
            <table style={{ width: "100%", paddingBottom: 10, fontFamily: FONT_BODY }}>
              <tbody>
                <tr>
                  <td style={{ width: "13%", verticalAlign: "top" }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="mix-memo-stella-logo" style={{ width: 90 }} />
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
                      GENERAL MEMO
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

            {/* Consigned To / Ship To */}
            <table style={{ width: "100%", marginTop: 10 }}>
              <tbody>
                <tr>
                  <td style={{ width: "50%", paddingRight: 20, verticalAlign: "top" }}>
                    {renderAddressBox("Consigned To:")}
                  </td>
                  <td style={{ width: "50%", paddingLeft: 20, verticalAlign: "top" }}>
                    {renderAddressBox("Ship To:")}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Information — MVC margin; auto height (max 80) so print doesn't spill conditions to next page */}
            <div
              className="mix-memo-stella-info"
              style={{
                fontSize: FS_META,
                textAlign: "justify",
                maxHeight: 80,
                margin: "10px 0",
                lineHeight: 1.35,
                overflow: "hidden",
                fontFamily: "Segoe UI, Verdana, Arial, sans-serif"
              }}
            >
              {information}
            </div>

            {/* Meta table */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: 8,
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

            {/* Items */}
            <table
              className="mix-memo-stella-items"
              style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY, tableLayout: "fixed" }}
            >
              <thead>
                <tr style={{ fontSize: FS_ITEM_HDR }}>
                  {["Sr No", "Stock #", "QTY", "WT.", "DESCRIPTION", "Price/Carat", "Amount US $"].map((h, col) => (
                    <th key={h} style={{ ...th, fontSize: FS_ITEM_HDR, border: "1px solid #000", width: COL_W[col] }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => (
                  <tr key={idx} className="mix-memo-item-row" style={{ fontSize: FS_ITEM, fontFamily: FONT_BODY, height: ROW_H }}>
                    <td style={{ ...td, width: COL_W[0], fontSize: FS_ITEM }}>{srNo++}</td>
                    <td style={{ ...td, width: COL_W[1], textAlign: "left", paddingLeft: 8, fontSize: FS_ITEM }}>
                      {getVal(item, "Lotno", "lotNo", "StockNo", "stockNo")}
                    </td>
                    <td style={{ ...tdRight, width: COL_W[2], paddingRight: 5, fontSize: FS_ITEM }}>
                      {getVal(item, "Qty", "qty", "Pcs", "pcs")}
                    </td>
                    <td style={{ ...tdRight, width: COL_W[3], paddingRight: 8, fontSize: FS_ITEM }}>
                      {fmtNum(getVal(item, "Weight", "weight", "Carats", "carats"), 2)}
                    </td>
                    <td style={{ ...td, width: COL_W[4], textAlign: "left", fontSize: FS_ITEM }}>
                      {getVal(item, "Description", "description", "ItemName", "itemName")}
                    </td>
                    <td style={{ ...tdRight, width: COL_W[5], fontSize: FS_ITEM }}>
                      {fmtNum(getVal(item, "PricePerCarat", "pricePerCarat", "Rate", "rate"), 2)}
                    </td>
                    <td style={{ ...tdRight, width: COL_W[6], fontSize: FS_ITEM }}>
                      {fmtNum(getVal(item, "MasterCurrencyAmount", "Amount", "amount"), 2)}
                    </td>
                  </tr>
                ))}
                {/* Fill empty rows to capacity on every page — complete set for any record count */}
                {Array.from({ length: Math.max(0, fillTo - pageItems.length) }).map((_, i) => (
                    <tr key={`e-${i}`} className="mix-memo-empty-row" style={{ height: ROW_H }}>
                      {Array.from({ length: 7 }).map((__, c) => (
                        <td
                          key={c}
                          style={{
                            borderLeft: "1px solid #000",
                            borderRight: "1px solid #000",
                            borderTop: "none",
                            borderBottom: "none",
                            height: ROW_H,
                            width: COL_W[c]
                          }}
                        >
                          &nbsp;
                        </td>
                      ))}
                    </tr>
                  ))}
                {!isLastPage && (
                  <tr>
                    {Array.from({ length: 7 }).map((_, c) => (
                      <td key={c} style={{ borderBottom: "1px solid #000", width: COL_W[c] }} />
                    ))}
                  </tr>
                )}
                {isLastPage && (
                  <tr style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000" }}>
                    <td style={{ ...tdFull, width: COL_W[0] }} />
                    <td style={{ ...tdFull, width: COL_W[1] }} />
                    <td style={{ ...tdFull, width: COL_W[2], textAlign: "right", paddingRight: 5, verticalAlign: "top", fontSize: FS }}>
                      {totals.qty}
                    </td>
                    <td style={{ ...tdFull, width: COL_W[3], textAlign: "right", paddingRight: 8, verticalAlign: "top", fontSize: FS }}>
                      {fmtNum(totals.wt, 2)}
                    </td>
                    <td style={{ ...tdFull, width: COL_W[4] }} />
                    <td
                      style={{
                        ...tdFull,
                        width: COL_W[5],
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
                        ...tdFull,
                        width: COL_W[6],
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
                )}
              </tbody>
            </table>

            <div className="mix-memo-stella-footer-block">
              <div className="mix-memo-stella-signature" style={{ marginTop: 10 }}>
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

              {/* MemoConditions — auto height (max 80) so it stays with signature on print */}
              <div
                className="mix-memo-stella-conditions"
                style={{
                  fontSize: FS_META,
                  textAlign: "justify",
                  maxHeight: 80,
                  margin: "8px 0",
                  lineHeight: 1.35,
                  overflow: "hidden",
                  fontFamily: "Segoe UI, Verdana, Arial, sans-serif"
                }}
              >
                {conditions}
              </div>

              <table className="mix-memo-footer" style={{ width: "100%", fontFamily: FONT_BODY, fontSize: FS }}>
                <tbody>
                  <tr>
                    <td style={{ width: "50%", textAlign: "left", fontSize: FS }}>{company.companyFooter}</td>
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

export default MixMemoStellaFormat;
