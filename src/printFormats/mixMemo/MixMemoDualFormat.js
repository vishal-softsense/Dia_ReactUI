import React from "react";
import { fmt, fmtDate, getVal, paginateFixed } from "../shared/printUtils";
import deltaQr from "../../assets/images/print/deltaqr.png";
import deltaInstaQr from "../../assets/images/print/delta.png";

const border = "1px solid #A2A1A1";
const thGray = { background: "#ccc", border, padding: 3, textAlign: "center", fontWeight: "bold" };

const MixMemoDualFormat = ({ data, items, totals, company, logoUrl, isCurrentStatus }) => {
  const pages = paginateFixed(items, 10);
  const plusMinus = (Number(getVal(data, "PlusMinusAmount", "plusMinusAmount")) || 0) *
    (Number(getVal(data, "BaseRate", "baseRate")) || 0);
  const finalAmount = Number(getVal(data, "FinalAmount", "finalAmount")) || totals.amount;

  const renderCopy = (copyTitle, pageItems, pageIdx, isLastPage) => {
    let srNo = pageIdx * 10 + 1;
    return (
      <div style={{ marginBottom: copyTitle === "OFFICE COPY" || copyTitle === "OFFICE COPY - CURRENT STATUS" ? 70 : 0 }}>
        <table style={{ width: "100%", marginBottom: 8 }}>
          <tbody>
            <tr>
              <td style={{ width: "16%", verticalAlign: "top" }}>
                {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: 120, maxHeight: 95, objectFit: "contain" }} /> : null}
              </td>
              <td style={{ width: "42%", verticalAlign: "top", fontSize: 11, letterSpacing: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: 14, fontFamily: "Verdana", letterSpacing: 0 }}>{company.companyName}</div>
                <div style={{ margin: "1px 0" }}>{company.companyAddress}</div>
                <div>{company.companyAddress1}</div>
                <div style={{ margin: "1px 0" }}>{company.companyAddress2}</div>
                <div>{company.companyPhone}</div>
                <div>{company.companyEmail}</div>
              </td>
              <td style={{ width: "42%", verticalAlign: "top", textAlign: "right" }}>
                <div style={{ fontWeight: "bold", fontSize: 22, fontFamily: "Verdana", marginTop: 10 }}>{copyTitle}</div>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 5 }}>
                  <thead>
                    <tr>
                      <th style={thGray}>Date</th>
                      <th style={thGray}>Memo #</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border, padding: 3, textAlign: "center" }}>{fmtDate(getVal(data, "TrnDate", "trnDate"))}</td>
                      <td style={{ border, padding: 3, textAlign: "center" }}>{getVal(data, "InvNo", "invNo")}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <table style={{ width: "100%", marginBottom: 6 }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", verticalAlign: "top", paddingRight: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr><th style={{ ...thGray, background: "#c0c0c0" }}>Memo To</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border, padding: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: "bold", letterSpacing: 1 }}>{getVal(data, "PartyName", "partyName")}</div>
                        <div style={{ fontSize: 10 }}>{getVal(data, "AddressLine1", "addressLine1")}</div>
                        <div style={{ fontSize: 10 }}>{getVal(data, "AddressLine2", "addressLine2")}</div>
                        <div style={{ fontSize: 10 }}>{getVal(data, "AddressLine3", "addressLine3")}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={{ width: "50%", verticalAlign: "top" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thGray}>Ship Via</th>
                      <th style={thGray}>Tracking No</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border, padding: 3, textAlign: "center" }}>{getVal(data, "ShipVia", "shipVia")}</td>
                      <td style={{ border, padding: 3, textAlign: "center" }}>{getVal(data, "Tracking", "tracking")}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "5%" }} /><col style={{ width: "25%" }} /><col style={{ width: "8%" }} />
            <col style={{ width: "12%" }} /><col style={{ width: "10%" }} /><col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} /><col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr style={{ background: "#c0c0c0", height: 18 }}>
              {["Sr No", "DESCRIPTION", "Pcs", "Carat / Qty.", "Price / Carat", "Return Cts", "Kept Cts", "Amount US $"].map((h) => (
                <th key={h} style={{ ...thGray, background: "#c0c0c0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, idx) => {
              const ret = Number(getVal(item, "ReturnCarats", "returnCarats")) || 0;
              const kept = Number(getVal(item, "IssueCarats", "issueCarats", "SpCarats", "spCarats")) || 0;
              // Print API maps: Description, Qty, Weight (not ItemName/Pcs/Carats)
              const description =
                getVal(item, "Description", "description", "ItemName", "itemName", "StockNo", "stockNo", "LotNo", "lotNo") || "";
              const pcs = getVal(item, "Qty", "qty", "Pcs", "pcs");
              const carats = getVal(item, "Weight", "weight", "Carats", "carats");
              const rate = getVal(item, "PricePerCarat", "pricePerCarat", "Rate", "rate");
              const amount = getVal(item, "MasterCurrencyAmount", "masterCurrencyAmount", "Amount", "amount");
              return (
                <tr key={idx} style={{ height: 18, fontSize: 10 }}>
                  <td style={{ border, textAlign: "center" }}>{srNo++}</td>
                  <td style={{ border, textAlign: "center" }}>{description}</td>
                  <td style={{ border, textAlign: "center" }}>{pcs === "" || pcs == null ? "" : pcs}</td>
                  <td style={{ border, textAlign: "right", paddingRight: 10 }}>{fmt(carats, 2)}</td>
                  <td style={{ border, textAlign: "right", paddingRight: 3 }}>{fmt(rate, 2)}</td>
                  <td style={{ border, textAlign: "right", paddingRight: 3 }}>{ret ? fmt(ret, 2) : ""}</td>
                  <td style={{ border, textAlign: "right", paddingRight: 3 }}>{kept ? fmt(kept, 2) : ""}</td>
                  <td style={{ border, textAlign: "right", paddingRight: 3 }}>{fmt(amount, 2)}</td>
                </tr>
              );
            })}
            {Array.from({ length: Math.max(0, 10 - pageItems.length) }).map((_, i) => (
              <tr key={`e-${i}`} style={{ height: 20 }}>
                {Array.from({ length: 8 }).map((__, c) => <td key={c} style={{ border }}>&nbsp;</td>)}
              </tr>
            ))}
            {isLastPage && (
              <>
                <tr style={{ fontWeight: "bold", height: 24, fontSize: 11 }}>
                  <td colSpan={3} style={{ border: "1px solid #999", textAlign: "left", paddingLeft: 25 }}>Total Carats :</td>
                  <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>{fmt(totals.wt, 2)}</td>
                  <td colSpan={3} style={{ border: "1px solid #999", textAlign: "right", paddingRight: 15 }}>US $ :</td>
                  <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>{fmt(totals.amount, 2)}</td>
                </tr>
                <tr>
                  <td colSpan={7} style={{ border: "none" }}></td>
                  <td style={{ border: "1px solid #999", padding: 4 }}>
                    <span style={{ float: "left" }}>Round Off</span>
                    <span style={{ float: "right", fontWeight: "bold" }}>{fmt(plusMinus, 2)}</span>
                  </td>
                </tr>
                <tr style={{ height: 24, fontSize: 11, fontWeight: "bold" }}>
                  <td colSpan={7} style={{ border: "none" }}></td>
                  <td style={{ border: "1px solid #999", textAlign: "right", paddingRight: 5 }}>{fmt(finalAmount, 2)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
        <table style={{ width: "100%", marginTop: 6 }}>
          <tbody>
            <tr>
              <td style={{ width: "35%", verticalAlign: "bottom", textAlign: "left" }}>
                {/* MVC MixMemoDualPrint: deltaqr.png + delta.png */}
                <img src={deltaQr} alt="QR" style={{ height: 50, marginRight: 5 }} />
                <img src={deltaInstaQr} alt="Insta QR" style={{ height: 50 }} />
              </td>
              <td style={{ width: "30%", textAlign: "center", color: "gray", fontSize: 9, verticalAlign: "middle" }}>{company.companyFooter}</td>
              <td style={{ width: "35%", textAlign: "right", fontWeight: "bold", fontSize: 14, verticalAlign: "middle", whiteSpace: "nowrap" }}>
                Signature &nbsp;&nbsp; ______________________
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 13, color: "#000" }}>
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        return (
          <div key={pageIdx} className={isLastPage ? "" : "page-break"}>
            {renderCopy(isCurrentStatus ? "OFFICE COPY - CURRENT STATUS" : "OFFICE COPY", pageItems, pageIdx, isLastPage)}
            {renderCopy(isCurrentStatus ? "CUSTOMER COPY - CURRENT STATUS" : "CUSTOMER COPY", pageItems, pageIdx, isLastPage)}
          </div>
        );
      })}
    </div>
  );
};

export default MixMemoDualFormat;
