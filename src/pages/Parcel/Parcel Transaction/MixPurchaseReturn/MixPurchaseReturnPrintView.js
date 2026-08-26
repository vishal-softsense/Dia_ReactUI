import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import {
  getMixPurchaseReturnPrintView
} from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";

const getVal = (row, ...keys) => {
  if (!row) return "";
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    if (row[camel] !== undefined && row[camel] !== null && row[camel] !== "") return row[camel];
    if (row[pascal] !== undefined && row[pascal] !== null && row[pascal] !== "") return row[pascal];
  }
  return "";
};

const fmt = (v, d = 2) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(d) : (0).toFixed(d);
};

const MixPurchaseReturnPrintView = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const invNo = searchParams.get("ID") || searchParams.get("Id") || searchParams.get("InvNo") || searchParams.get("invNo") || "";
  const printRef = useRef(null);
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
        const res = await getMixPurchaseReturnPrintView(invNo);
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
    let wt = 0;
    let amount = 0;
    items.forEach((it) => {
      qty += Number(getVal(it, "Qty", "qty")) || 0;
      wt += Number(getVal(it, "Weight", "weight")) || 0;
      amount += Number(getVal(it, "Amount", "amount")) || 0;
    });
    return { qty, wt, amount };
  }, [items]);

  const logoUrl = resolveCompanyLogoUrl(company?.companyLogo);

  const handlePrint = () => {
    // Print current page so layout matches what user sees
    window.print();
  };

  document.title = `GPurRtn_${invNo} | Admin`;

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center text-muted py-5">{t("Loading...")}</div>
        </Container>
      </div>
    );
  }

  const cell = { border: "1px solid #000", padding: "5px 6px" };
  const th = { ...cell, background: "#c0c0c0", textAlign: "center", fontWeight: "bold" };

  return (
    <React.Fragment>
      <div className="page-content purchase-print-page">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <Link to="/MixPurchaseReturn/mixpurchasereturnlist" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={handlePrint}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div
            ref={printRef}
            id="purchase-print-area"
            className="purchase-print-sheet"
            style={{
              fontFamily: "Verdana, Arial, sans-serif",
              fontSize: 12,
              color: "#000",
              background: "#fff",
              padding: 16,
              border: "1px solid #dee2e6",
              borderRadius: 8,
              width: "100%",
              maxWidth: 900,
              margin: "0 auto"
            }}
          >
            <table style={{ width: "100%", marginBottom: 14, tableLayout: "fixed" }}>
              <tbody>
                <tr>
                  <td style={{ width: "12%", verticalAlign: "top" }}>
                    {logoUrl ? <img src={logoUrl} alt="logo" style={{ width: 80, maxWidth: "100%" }} /> : null}
                  </td>
                  <td style={{ width: "53%", verticalAlign: "top", fontSize: 11, paddingLeft: 8 }}>
                    <div style={{ fontWeight: "bold", fontSize: 13 }}>{company.companyName}</div>
                    <div style={{ marginTop: 3, lineHeight: 1.4 }}>{company.companyAddress}</div>
                    <div style={{ lineHeight: 1.4 }}>{company.companyAddress1}</div>
                    <div style={{ lineHeight: 1.4 }}>{company.companyAddress2}</div>
                    <div style={{ marginTop: 6 }}>
                      <b>Tel:</b>&nbsp;{company.companyPhone}
                    </div>
                    <div>
                      <b>Email:</b>&nbsp;{company.companyEmail}
                    </div>
                  </td>
                  <td style={{ width: "35%", verticalAlign: "top" }}>
                    <div style={{ fontWeight: "bold", fontSize: 20 }}>MEMO IN</div>
                    <table style={{ width: "100%", fontSize: 12, marginTop: 8 }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: "4px 0" }}>
                            <b>Date :</b>
                          </td>
                          <td style={{ textAlign: "right" }}>{getVal(data, "TrnDate", "trnDate")}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "4px 0" }}>
                            <b>Purchase #</b>
                          </td>
                          <td style={{ textAlign: "right" }}>{getVal(data, "BillNo", "billNo")}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              style={{
                border: "1px solid #000",
                borderRadius: 10,
                padding: "10px 12px",
                width: "48%",
                minWidth: 220,
                maxWidth: 400,
                marginBottom: 14
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: 6 }}>Consigned To:</div>
              <div style={{ fontSize: 13, marginBottom: 2 }}>{getVal(data, "PartyName", "partyName")}</div>
              <div style={{ lineHeight: 1.45, fontSize: 11 }}>{getVal(data, "AddressLine1", "addressLine1")}</div>
              <div style={{ lineHeight: 1.45, fontSize: 11 }}>{getVal(data, "AddressLine2", "addressLine2")}</div>
              <div style={{ lineHeight: 1.45, fontSize: 11 }}>{getVal(data, "AddressLine3", "addressLine3")}</div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, tableLayout: "fixed" }}>
              <thead>
                <tr>
                  {["RECEIVED VIA", "INVOICE #", "TERMS"].map((h) => (
                    <th key={h} style={{ ...th, width: "33.33%" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...cell, height: 28 }} />
                  <td style={{ ...cell, textAlign: "center" }}>{getVal(data, "InvNo", "invNo")}</td>
                  <td style={{ ...cell, textAlign: "center" }}>{getVal(data, "DueDays", "dueDays")}</td>
                </tr>
              </tbody>
            </table>

            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 11 }}>
              <colgroup>
                <col style={{ width: "7%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "18%" }} />
              </colgroup>
              <thead>
                <tr>
                  {["Sr No", "Stock #", "DESCRIPTION", "QTY", "WT.", "Price/Carat", "Amount US $"].map((h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td style={{ ...cell, textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ ...cell, wordBreak: "break-word" }}>{getVal(it, "StockNo", "stockNo")}</td>
                    <td style={{ ...cell, wordBreak: "break-word" }}>{getVal(it, "Description", "description")}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{getVal(it, "Qty", "qty")}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{fmt(getVal(it, "Weight", "weight"))}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{fmt(getVal(it, "PricePerCarat", "pricePerCarat"))}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{fmt(getVal(it, "Amount", "amount"))}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: "bold" }}>
                  <td style={cell} colSpan={3} />
                  <td style={{ ...cell, textAlign: "right" }}>{totals.qty}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{fmt(totals.wt)}</td>
                  <td style={{ ...cell, lineHeight: 1.6 }}>
                    <div>Sub Total</div>
                    <div>Charges</div>
                    <div style={{ marginTop: 4 }}>TOTAL</div>
                  </td>
                  <td style={{ ...cell, textAlign: "right", lineHeight: 1.6 }}>
                    <div>{fmt(totals.amount)}</div>
                    <div>&nbsp;</div>
                    <div style={{ marginTop: 4 }}>{fmt(totals.amount)}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: 20 }}>
              <span>Signature:</span>
              <span
                style={{
                  display: "inline-block",
                  borderBottom: "1px solid #000",
                  width: 260,
                  marginLeft: 8
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 18,
                fontSize: 11,
                gap: 12
              }}
            >
              <span>{company.companyFooter || "Powered by SoftOnCloud"}</span>
              <span>1</span>
            </div>
          </div>
        </Container>

        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
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
          @media (max-width: 767px) {
            .purchase-print-sheet {
              overflow-x: auto !important;
              display: block !important;
            }
          }
        `}</style>
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default MixPurchaseReturnPrintView;
