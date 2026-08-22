import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getJewelleryPurchaseCurrentStatus } from "../../../../helpers/fakebackend_helper";
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

const fmtMoney = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
};

const JewPurchaseCurStatus = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const invNo = searchParams.get("InvNo") || searchParams.get("invNo") || "";
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
        const res = await getJewelleryPurchaseCurrentStatus(invNo);
        if (res?.success || res?.Success) {
          setData(res.Data || res.data || null);
        } else {
          toast.error(res?.Data || res?.data || t("Failed to load current status."));
        }
      } catch (err) {
        console.error(err);
        toast.error(t("Failed to load current status."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [invNo, t]);

  const items = useMemo(() => data?.items || data?.Items || [], [data]);
  const balance = useMemo(() => {
    return items.reduce((sum, it) => {
      const amt = Number(getVal(it, "Amount", "amount")) || 0;
      const isPay = Number(getVal(it, "IsPayment", "isPayment")) === 1;
      return sum + (isPay ? -amt : amt);
    }, 0);
  }, [items]);

  const logoUrl = resolveCompanyLogoUrl(company?.companyLogo);

  const handlePrint = () => {
    window.print();
  };

  document.title = `JewPurCurStatus_${invNo} | Admin`;

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center text-muted py-5">{t("Loading...")}</div>
        </Container>
      </div>
    );
  }

  const border = "1px solid #666";
  const thStyle = {
    borderLeft: border,
    borderRight: border,
    borderBottom: "2px solid #666",
    padding: "8px 6px",
    background: "#e6e6e6",
    textAlign: "center",
    fontSize: 11,
    whiteSpace: "nowrap"
  };
  const tdStyle = {
    borderLeft: border,
    borderRight: border,
    padding: "7px 6px",
    fontSize: 11,
    verticalAlign: "top"
  };
  const sectionTitle = {
    fontWeight: "bold",
    borderBottom: "2px solid #9e9e9e",
    color: "#666",
    marginBottom: 8,
    paddingBottom: 5,
    letterSpacing: 0.3,
    fontSize: 11
  };

  return (
    <React.Fragment>
      <div className="page-content purchase-curstatus-page">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <Link to="/jewpurchase/jew-purchase-list" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={handlePrint}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div
            ref={printRef}
            id="purchase-curstatus-print-area"
            className="purchase-curstatus-sheet"
            style={{
              fontFamily: "Verdana, Arial, sans-serif",
              fontSize: 12,
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
            <table style={{ width: "100%", marginBottom: 18, tableLayout: "fixed" }}>
              <tbody>
                <tr>
                  <td style={{ width: "12%", verticalAlign: "top" }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="logo" style={{ width: 80, maxHeight: 95, objectFit: "contain" }} />
                    ) : null}
                  </td>
                  <td style={{ width: "48%", verticalAlign: "top", fontSize: 11, paddingLeft: 8, paddingRight: 10 }}>
                    <div style={{ fontWeight: "bold", fontSize: 13, marginBottom: 4 }}>{company.companyName}</div>
                    <div style={{ lineHeight: 1.45 }}>{company.companyAddress}</div>
                    <div style={{ lineHeight: 1.45 }}>{company.companyAddress1}</div>
                    <div style={{ lineHeight: 1.45 }}>{company.companyAddress2}</div>
                    <div style={{ marginTop: 8, lineHeight: 1.45 }}>
                      <b>Tel:</b>&nbsp;{company.companyPhone}
                    </div>
                    <div style={{ lineHeight: 1.45 }}>
                      <b>Email:</b>&nbsp;{company.companyEmail}
                    </div>
                  </td>
                  <td style={{ width: "40%", verticalAlign: "top" }}>
                    <div style={{ fontWeight: "bold", fontSize: 18, color: "#555", marginBottom: 10 }}>
                      Current Status Invoice
                    </div>
                    <table style={{ width: "100%", fontSize: 12 }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: "4px 0", width: "55%" }}>
                            <b>Invoice #:</b>
                          </td>
                          <td style={{ textAlign: "right" }}>{getVal(data, "InvNo", "invNo")}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "4px 0" }}>
                            <b>Invoice Date:</b>
                          </td>
                          <td style={{ textAlign: "right" }}>{fmtDate(getVal(data, "InvDate", "invDate"))}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "4px 0" }}>
                            <b>Current Status :</b>
                          </td>
                          <td style={{ textAlign: "right" }}>{getVal(data, "Status", "status")}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <table style={{ width: "100%", marginBottom: 18, tableLayout: "fixed" }}>
              <tbody>
                <tr>
                  <td style={{ width: "34%", verticalAlign: "top", paddingRight: 12 }}>
                    <div style={sectionTitle}>BILLING ADDRESS</div>
                    <div style={{ fontSize: 12, lineHeight: 1.55 }}>
                      {getVal(data, "Party", "party")}
                      <br />
                      {getVal(data, "AddLine1", "addLine1")}
                      <br />
                      {getVal(data, "AddLine2", "addLine2")}
                      <br />
                      {getVal(data, "AddLine3", "addLine3")}
                      <br />
                      Tel: {getVal(data, "Mobile", "mobile")}
                    </div>
                  </td>
                  <td style={{ width: "34%", verticalAlign: "top", paddingRight: 12 }}>
                    <div style={sectionTitle}>SHIPPING ADDRESS</div>
                    <div style={{ fontSize: 12, lineHeight: 1.55 }}>
                      {getVal(data, "Party", "party")}
                      <br />
                      {getVal(data, "AddLine1", "addLine1")}
                      <br />
                      {getVal(data, "AddLine2", "addLine2")}
                      <br />
                      {getVal(data, "AddLine3", "addLine3")}
                      <br />
                      Tel: {getVal(data, "Mobile", "mobile")}
                    </div>
                  </td>
                  <td style={{ width: "32%", verticalAlign: "top" }}>
                    <div style={sectionTitle}>REFERENCE INFORMATION</div>
                    <table style={{ width: "100%", fontSize: 11 }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: "4px 0" }}>Contact:</td>
                          <td style={{ textAlign: "right" }}>{getVal(data, "CPerson", "cPerson")}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "4px 0" }}>Salesperson:</td>
                          <td style={{ textAlign: "right" }}>{getVal(data, "SalesPerson", "salesPerson")}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "4px 0" }}>Ship Via:</td>
                          <td style={{ textAlign: "right" }}>{getVal(data, "ShipVia", "shipVia")}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "4px 0" }}>Customer Order #:</td>
                          <td style={{ textAlign: "right" }} />
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
                borderCollapse: "collapse",
                borderTop: "2px solid #000",
                tableLayout: "fixed"
              }}
            >
              <colgroup>
                <col style={{ width: "10%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <thead>
                <tr>
                  {["Type", "Date", "Qty", "Wt.", "Description", "Unit$", "Tax", "Total"].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const isPay = Number(getVal(it, "IsPayment", "isPayment")) === 1;
                  const amt = getVal(it, "Amount", "amount");
                  return (
                    <tr key={idx} style={{ background: idx % 2 === 1 ? "#f3f3f3" : "#fff" }}>
                      <td style={tdStyle}>{getVal(it, "Type", "type")}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>{fmtDate(getVal(it, "Date", "date"))}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{getVal(it, "Qty", "qty")}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        {getVal(it, "Wt", "wt") !== "" ? Number(getVal(it, "Wt", "wt")).toFixed(2) : ""}
                      </td>
                      <td style={{ ...tdStyle, wordBreak: "break-word" }}>
                        {getVal(it, "Description", "description")}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                        {getVal(it, "Rate", "rate") !== "" ? fmtMoney(getVal(it, "Rate", "rate")) : ""}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                        {getVal(it, "Tax", "tax") !== "" ? fmtMoney(getVal(it, "Tax", "tax")) : ""}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                        {amt !== "" ? (isPay ? `(${fmtMoney(amt)})` : fmtMoney(amt)) : ""}
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan={5} style={{ border: "none", paddingTop: 10 }} />
                  <td
                    colSpan={2}
                    style={{
                      borderTop: "2px solid #666",
                      textAlign: "right",
                      padding: "10px 6px",
                      fontWeight: "bold",
                      fontSize: 12
                    }}
                  >
                    Invoice Balance
                  </td>
                  <td
                    style={{
                      borderTop: "2px solid #666",
                      textAlign: "right",
                      padding: "10px 6px",
                      fontWeight: "bold",
                      fontSize: 12,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {fmtMoney(balance)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 22,
                fontSize: 11,
                gap: 16,
                flexWrap: "wrap"
              }}
            >
              <span>{company.companyFooter || "Powered by SoftOnCloud"}</span>
              <span>Page 1 of 1</span>
              <span>Printed on {fmtDate(new Date())}</span>
            </div>
          </div>
        </Container>

        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 8mm; }
            html, body {
              background: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * { visibility: hidden !important; }
            #purchase-curstatus-print-area,
            #purchase-curstatus-print-area * {
              visibility: visible !important;
            }
            #purchase-curstatus-print-area {
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
            .purchase-curstatus-sheet {
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

export default JewPurchaseCurStatus;
