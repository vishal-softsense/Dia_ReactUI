import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getJewelleryPurchasePrintView } from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";
import { fmtNum, getPrintAmountHeader, getVal } from "../../../../printFormats/shared/printUtils";

// MVC Views/JewelleryPurchase/Jewellery_PurchaseUSA_Print.cshtml
const ITEMS_PER_PAGE = 7;

const th = {
  background: "#c0c0c0",
  border: "2px solid #6e6e6e",
  padding: "6px 0",
  textAlign: "center",
  fontWeight: "bold"
};

const td = {
  border: "2px solid #6e6e6e",
  padding: "0 6px",
  textAlign: "center",
  verticalAlign: "middle"
};

const fmtWt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n.toFixed(3) : "";
};

const JewPurchasePrintView = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const invNo = searchParams.get("InvNo") || searchParams.get("invNo") || "";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [company, setCompany] = useState(() => getCachedReportCompany());

  useEffect(() => {
    const load = async () => {
      const c = await getReportCompanySettings({ forceRefresh: true });
      setCompany(c);
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!invNo) {
        setLoading(false);
        toast.warning(t("Invoice number is required."));
        return;
      }
      setLoading(true);
      try {
        const res = await getJewelleryPurchasePrintView(invNo);
        if (res?.success || res?.Success) {
          setData(res.Data || res.data || null);
        } else {
          toast.error(res?.Data || res?.data || t("Failed to load print view."));
        }
      } catch (err) {
        console.error(err);
        toast.error(t("Failed to load print view."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [invNo, t]);

  const items = useMemo(() => data?.items || data?.Items || [], [data]);

  const totals = useMemo(() => {
    let qty = 0;
    let amount = 0;
    items.forEach((it) => {
      qty += Number(getVal(it, "Qty", "qty", "Pcs", "pcs")) || 0;
      amount += Number(getVal(it, "Amount", "amount")) || 0;
    });
    return { qty, amount };
  }, [items]);

  // MVC pagination: 7/page; if last page has >=5 items → overflow page for totals
  const pagesMeta = useMemo(() => {
    const totalItems = items.length;
    let totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    let itemsOnLastPage = totalItems % ITEMS_PER_PAGE;
    if (itemsOnLastPage === 0 && totalItems > 0) itemsOnLastPage = ITEMS_PER_PAGE;
    const overflowTotals = itemsOnLastPage >= 5;
    const totalRenderPages = overflowTotals ? totalPages + 1 : totalPages;
    return { totalPages, overflowTotals, totalRenderPages };
  }, [items]);

  const logoUrl = resolveCompanyLogoUrl(company?.companyLogo);
  // MVC Jewellery_PurchaseUSA_Print: Amount US {SSymbol} | Amount {MSymbol}
  const amountHeader = getPrintAmountHeader(data, company);

  document.title = `Jewellery Purchase_${invNo} | Admin`;

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center text-muted py-5">{t("Loading...")}</div>
        </Container>
      </div>
    );
  }

  const renderHeader = () => (
    <>
      <table style={{ width: "100%", paddingBottom: 10 }}>
        <tbody>
          <tr>
            <td style={{ width: "13%", verticalAlign: "top" }}>
              {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: 90 }} /> : null}
            </td>
            <td style={{ width: "47%", verticalAlign: "top", fontSize: 12 }}>
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
            <td style={{ width: "40%", verticalAlign: "top" }}>
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: 24,
                  paddingTop: 5,
                  marginBottom: 12
                }}
              >
                JEWELLERY PURCHASE
              </div>
              <table style={{ width: "70%", fontSize: 13, margin: "0 auto" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "40%" }}>
                      <b>Date :</b>
                    </td>
                    <td style={{ width: "5%" }} />
                    <td>{getVal(data, "TrnDate", "trnDate")}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 0" }}>
                      <b>Invoice # :</b>
                    </td>
                    <td style={{ width: "5%", padding: "5px 0" }} />
                    <td style={{ padding: "5px 0" }}>{getVal(data, "InvNo", "invNo") || invNo}</td>
                  </tr>
                  <tr>
                    <td>
                      <b>Printed On :</b>
                    </td>
                    <td style={{ width: "5%" }} />
                    <td>{getVal(data, "RoundDate", "roundDate")}</td>
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
            {["Bill To:", "Ship To:"].map((legend, i) => (
              <td
                key={legend}
                style={{
                  width: "50%",
                  paddingRight: i === 0 ? 20 : 0,
                  paddingLeft: i === 1 ? 20 : 0
                }}
              >
                <fieldset
                  style={{
                    border: "1px solid #000",
                    borderRadius: 12,
                    padding: "8px 15px 12px 10px",
                    height: 130,
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
                    {legend}
                  </legend>
                  <div style={{ fontSize: 13, marginBottom: 5 }}>{getVal(data, "PartyName", "partyName")}</div>
                  <div style={{ lineHeight: 1.5, fontSize: 12, marginBottom: 5 }}>
                    {getVal(data, "AddressLine1", "addressLine1")}
                  </div>
                  <div style={{ lineHeight: 1.5, fontSize: 12, marginBottom: 5 }}>
                    {getVal(data, "AddressLine2", "addressLine2")}
                  </div>
                  <div style={{ lineHeight: 1.5, fontSize: 12, marginBottom: 5 }}>
                    {getVal(data, "AddressLine3", "addressLine3")}
                  </div>
                </fieldset>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div
        style={{
          fontSize: 11,
          textAlign: "justify",
          height: 80,
          margin: "13px 0",
          fontFamily: "Segoe UI",
          overflow: "hidden"
        }}
      >
        {company.information || ""}
      </div>

      <div style={{ marginBottom: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr>
              {["CONTACT", "SALES PERSON", "CUST ORDER #", "SHIP VIA", "TRACKING #"].map((h) => (
                <th key={h} style={{ ...th, height: 22 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...td, height: 22 }} />
              <td style={{ ...td, height: 22 }}>{getVal(data, "SalesPerson", "salesPerson")}</td>
              <td style={{ ...td, height: 22 }} />
              <td style={{ ...td, height: 22 }}>{getVal(data, "ShipVia", "shipVia")}</td>
              <td style={{ ...td, height: 22 }}>{getVal(data, "Tracking", "tracking")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );

  const renderTotals = () => (
    <>
      <tr style={{ borderTop: "1px solid black", borderBottom: "1px solid black", height: 20 }}>
        <td style={td} />
        <td style={td} />
        <td style={{ ...td, textAlign: "right", fontSize: 13, fontWeight: "bold" }}>{totals.qty}</td>
        <td style={{ ...td, textAlign: "right", fontSize: 13 }} />
        <td style={{ ...td, textAlign: "center", fontWeight: "bold", borderRight: "none" }}>
          Terms: Due upon receipt
        </td>
        <td style={{ ...td, textAlign: "right", borderLeft: "none" }}>Sub Total</td>
        <td style={{ ...td, textAlign: "right", fontSize: 13, lineHeight: 1.8, fontWeight: "bold" }}>
          {fmtNum(totals.amount, 2)}
        </td>
      </tr>
      <tr style={{ borderTop: "1px solid black", borderBottom: "1px solid black" }}>
        <td colSpan={6} style={{ ...td, textAlign: "right", paddingLeft: 10, fontSize: 12, lineHeight: 1.8 }}>
          Charges
          <br />
          Discount
          <br />
          <b style={{ fontSize: 15 }}>TOTAL</b>
        </td>
        <td style={{ ...td, textAlign: "right", fontSize: 13, lineHeight: 1.8 }}>
          <br />
          <br />
          <b>{fmtNum(totals.amount, 2)}</b>
        </td>
      </tr>
    </>
  );

  const renderPayment = () => (
    <table style={{ fontSize: 13, borderCollapse: "collapse", marginTop: 10 }}>
      <tbody>
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
          <td style={{ width: 140 }}>Bank Name :</td>
          <td style={{ paddingLeft: 40 }}>{getVal(data, "bnm")}</td>
        </tr>
        <tr>
          <td>Account No :</td>
          <td style={{ paddingLeft: 40 }}>
            <strong>{getVal(data, "BankAccNo", "bankAccNo")}</strong>
          </td>
        </tr>
        <tr>
          <td>Routing Number :</td>
          <td style={{ paddingLeft: 40 }}>
            <strong>{getVal(data, "ABARoutingNumber", "abaRoutingNumber")}</strong>
          </td>
        </tr>
        <tr>
          <td>
            <b>Swift Code :</b>
          </td>
          <td style={{ paddingLeft: 40 }}>
            <strong>{getVal(data, "SwiftCode", "swiftCode")}</strong>
          </td>
        </tr>
        <tr>
          <td>
            <b>ZELLE Id :</b>
          </td>
          <td style={{ paddingLeft: 40 }}>
            <strong>{getVal(data, "ZelleID", "zelleID")}</strong>
          </td>
        </tr>
      </tbody>
    </table>
  );

  if (!data) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <Link to="/jewpurchase/jew-purchase-list" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
          </div>
          <div className="text-center text-muted py-5">{t("No data found for this Invoice.")}</div>
          <ToastContainer autoClose={2000} />
        </Container>
      </div>
    );
  }

  const { totalPages, overflowTotals, totalRenderPages } = pagesMeta;

  return (
    <React.Fragment>
      <div className="page-content purchase-print-page">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <Link to="/jewpurchase/jew-purchase-list" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={() => window.print()}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div
            id="purchase-print-area"
            className="purchase-print-sheet"
            style={{
              fontFamily: "Verdana, Arial, sans-serif",
              fontSize: 13,
              color: "#000",
              background: "#fff",
              padding: 16,
              border: "1px solid #dee2e6",
              borderRadius: 8,
              width: "100%",
              maxWidth: 960,
              margin: "0 auto"
            }}
          >
            {Array.from({ length: totalRenderPages }).map((_, page) => {
              const isOverflowPage = overflowTotals && page === totalRenderPages - 1;
              const isLastDataPage = page === totalPages - 1;
              const showTotals = isOverflowPage || (!overflowTotals && isLastDataPage);
              const skip = isOverflowPage ? items.length : page * ITEMS_PER_PAGE;
              const pageItems = items.slice(skip, skip + ITEMS_PER_PAGE);
              let srNo = skip + 1;
              const isLastRender = page === totalRenderPages - 1;

              return (
                <div
                  key={page}
                  style={
                    !isLastRender
                      ? { pageBreakAfter: "always", breakAfter: "page" }
                      : undefined
                  }
                >
                  {renderHeader()}

                  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: "5%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "6%" }} />
                      <col style={{ width: "11%" }} />
                      <col style={{ width: "37%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "15%" }} />
                    </colgroup>
                    <thead>
                      <tr style={{ fontSize: 12 }}>
                        {["Sr No", "ITEM", "PCS", "WT.", "DESCRIPTION", "Price/Carat", amountHeader].map(
                          (h) => (
                            <th key={h} style={th}>
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((item, idx) => {
                        const img = getVal(item, "ImagePath", "imagePath");
                        return (
                          <tr key={idx} style={{ fontSize: 11, height: 65 }}>
                            <td style={{ ...td, verticalAlign: "top", paddingTop: 5 }}>{srNo++}</td>
                            <td style={{ ...td, padding: "10px 0", height: 65, verticalAlign: "middle" }}>
                              {img ? (
                                <img
                                  src={img}
                                  alt=""
                                  style={{ width: 90, height: 65, objectFit: "contain" }}
                                />
                              ) : (
                                <div style={{ height: 65 }} />
                              )}
                            </td>
                            <td style={{ ...td, textAlign: "right", verticalAlign: "top", paddingTop: 5 }}>
                              {getVal(item, "Qty", "qty", "Pcs", "pcs")}
                            </td>
                            <td style={{ ...td, textAlign: "right", verticalAlign: "top", padding: 0 }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                                <tbody>
                                  <tr style={{ height: 15 }}>
                                    <td style={{ width: "50%", textAlign: "left", padding: 5, border: "none" }}>
                                      {fmtWt(getVal(item, "GrossWeight", "grossWeight"))}
                                    </td>
                                    <td
                                      style={{
                                        width: "50%",
                                        textAlign: "right",
                                        paddingRight: 5,
                                        border: "none"
                                      }}
                                    >
                                      GMS
                                    </td>
                                  </tr>
                                  <tr style={{ height: 15 }}>
                                    <td style={{ width: "50%", textAlign: "left", padding: 5, border: "none" }}>
                                      {fmtWt(getVal(item, "NetWeight", "netWeight"))}
                                    </td>
                                    <td
                                      style={{
                                        width: "50%",
                                        textAlign: "right",
                                        paddingRight: 5,
                                        border: "none"
                                      }}
                                    >
                                      Carat
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                            <td style={{ ...td, textAlign: "left", verticalAlign: "top", paddingTop: 5 }}>
                              {getVal(item, "Description", "description", "ItemName", "itemName")}
                            </td>
                            <td style={{ ...td, textAlign: "right", verticalAlign: "top", paddingTop: 5 }}>
                              {fmtNum(
                                getVal(item, "FinalJewAmount", "finalJewAmount", "PricePerCarat", "pricePerCarat"),
                                2
                              )}
                            </td>
                            <td style={{ ...td, textAlign: "right", verticalAlign: "top", paddingTop: 5 }}>
                              {fmtNum(getVal(item, "Amount", "amount"), 2)}
                            </td>
                          </tr>
                        );
                      })}
                      {showTotals && renderTotals()}
                    </tbody>
                  </table>

                  {showTotals && renderPayment()}

                  <div style={{ marginTop: 15 }}>
                    <span style={{ fontSize: 13 }}>Signature:</span>
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
                    style={{
                      fontSize: 11,
                      textAlign: "justify",
                      minHeight: 57,
                      fontFamily: "Segoe UI",
                      marginTop: 8
                    }}
                  >
                    {company.saleConditions || ""}
                  </div>

                  <div style={{ marginTop: 3 }}>
                    <table style={{ width: "100%" }}>
                      <tbody>
                        <tr>
                          <td style={{ width: "50%", textAlign: "left" }}>{company.companyFooter || ""}</td>
                          <td style={{ width: "50%", textAlign: "right" }}>{page + 1}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>

        <style>{`
          @media print {
            @page { size: Letter portrait; margin: 10mm; }
            html, body {
              background: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * { visibility: hidden !important; }
            #purchase-print-area,
            #purchase-print-area * {
              visibility: visible !important;
            }
            #purchase-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: #fff !important;
              color: #000 !important;
            }
            .d-print-none,
            .navbar-menu,
            .app-menu,
            .navbar-header,
            .footer,
            .vertical-menu,
            #page-topbar,
            .page-title-box {
              display: none !important;
            }
          }
        `}</style>
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default JewPurchasePrintView;
