import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getMixPurchasePrintView } from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";
import MixPurPrintUsaFormat from "../../../../printFormats/mixPurchase/MixPurPrintUsaFormat";
import { getVal } from "../../../../printFormats/shared/printUtils";

const MixPurchasePrintView = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const invNo =
    searchParams.get("ID") ||
    searchParams.get("Id") ||
    searchParams.get("InvNo") ||
    searchParams.get("invNo") ||
    "";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [company, setCompany] = useState(() => getCachedReportCompany());

  useEffect(() => {
    const load = async () => {
      // persist:false — print must not overwrite shared company/report settings cache
      const c = await getReportCompanySettings({ forceRefresh: true, persist: false });
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
        const res = await getMixPurchasePrintView(invNo);
        if (res?.success || res?.Success) {
          setData(res.Data || res.data || null);
        } else {
          toast.error(res?.Data || res?.data || t("No data found for this Invoice."));
        }
      } catch (err) {
        console.error(err);
        toast.error(err?.response?.data?.Data || err?.message || t("No data found for this Invoice."));
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
      qty += Number(getVal(it, "Qty", "qty", "Pcs", "pcs")) || 0;
      wt += Number(getVal(it, "Weight", "weight", "Carats", "carats")) || 0;
      amount += Number(getVal(it, "Amount", "amount")) || 0;
    });
    return { qty, wt, amount };
  }, [items]);

  const logoUrl = resolveCompanyLogoUrl(company?.companyLogo);
  const invDisplay = getVal(data, "InvNo", "invNo") || invNo;
  const partyDisplay = String(getVal(data, "PartyName", "partyName") || "")
    .replace(/ /g, "_")
    .replace(/\//g, "")
    .replace(/\\/g, "");
  // Save as PDF: MixPur_{InvNo}_{Party}.pdf
  const pdfFileName = partyDisplay
    ? `MixPur_${invDisplay}_${partyDisplay}`
    : `MixPur_${invDisplay || "Print"}`;

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = pdfFileName;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 500);
  };

  document.title = pdfFileName;

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center text-muted py-5">{t("Loading...")}</div>
        </Container>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <Link to="/MixPurchase/Mix-PurchaseList" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
          </div>
          <div className="text-center text-muted py-5">{t("No data found for this Invoice.")}</div>
          <ToastContainer autoClose={2000} />
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content mix-pur-print-page">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <Link to="/MixPurchase/Mix-PurchaseList" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={handlePrint}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div
            id="mix-pur-print-area"
            className="mix-pur-print-sheet"
            style={{
              background: "#fff",
              padding: "20px 24px",
              border: "1px solid #dee2e6",
              borderRadius: 8,
              width: "100%",
              maxWidth: 860,
              margin: "0 auto",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}
          >
            <MixPurPrintUsaFormat
              data={data}
              items={items}
              totals={totals}
              company={company}
              logoUrl={logoUrl}
              heading="GENERAL PURCHASE NOTE"
              variant="note"
            />
          </div>
        </Container>

        <style>{`
          .page-break { page-break-after: always; break-after: page; }
          .mix-pur-print-page-next {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 2px dashed #e0e0e0;
          }
          /* MVC MixPurchasePrint_USA — Verdana body */
          .mix-pur-print-sheet {
            font-family: Verdana, Arial, sans-serif;
            font-size: 13px;
            color: #000;
          }
          .mix-pur-print-sheet .mix-pur-meta-table {
            table-layout: fixed !important;
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1px solid #000 !important;
            box-sizing: border-box !important;
          }
          .mix-pur-print-sheet .mix-pur-meta-table th,
          .mix-pur-print-sheet .mix-pur-meta-table td {
            border: 1px solid #000 !important;
            box-sizing: border-box !important;
          }
          .mix-pur-print-sheet .mix-pur-meta-table th:last-child,
          .mix-pur-print-sheet .mix-pur-meta-table td:last-child {
            border-right: 1px solid #000 !important;
          }
          .mix-pur-print-sheet .mix-pur-item-table {
            table-layout: fixed !important;
            width: 100% !important;
            border-collapse: collapse !important;
            border-left: 1px solid #000 !important;
            border-right: 1px solid #000 !important;
            border-bottom: 1px solid #000 !important;
            box-sizing: border-box !important;
          }
          .mix-pur-print-sheet .mix-pur-item-table thead th {
            border: 1px solid #000 !important;
            box-sizing: border-box !important;
          }
          .mix-pur-print-sheet .mix-pur-item-table thead th:last-child,
          .mix-pur-print-sheet .mix-pur-item-row td:last-child,
          .mix-pur-print-sheet .mix-pur-empty-row td:last-child,
          .mix-pur-print-sheet .mix-pur-total-row td:last-child {
            border-right: 1px solid #000 !important;
          }
          .mix-pur-print-sheet .mix-pur-item-row td,
          .mix-pur-print-sheet .mix-pur-empty-row td {
            height: 20px;
            vertical-align: middle;
            border-left: 1px solid #000 !important;
            border-right: 1px solid #000 !important;
            border-top: none !important;
            border-bottom: none !important;
            box-sizing: border-box !important;
          }
          .mix-pur-print-sheet .mix-pur-total-row td {
            border-top: 1px solid #000 !important;
            border-bottom: 1px solid #000 !important;
            border-left: 1px solid #000 !important;
            border-right: 1px solid #000 !important;
            box-sizing: border-box !important;
          }
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 6mm 10mm;
            }
            html, body {
              background: #fff !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .layout-wrapper,
            .main-content,
            .page-content,
            .container-fluid,
            .mix-pur-print-page {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              overflow: visible !important;
              min-height: 0 !important;
              height: auto !important;
            }
            body * {
              visibility: hidden !important;
            }
            #mix-pur-print-area,
            #mix-pur-print-area * {
              visibility: visible !important;
            }
            #mix-pur-print-area {
              position: static !important;
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 2px 0 0 !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: #fff !important;
              color: #000 !important;
              box-sizing: border-box !important;
              font-family: Verdana, Arial, sans-serif !important;
              font-size: 13px !important;
              overflow: visible !important;
            }
            .mix-pur-print-page-block {
              box-sizing: border-box !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
            }
            .mix-pur-print-page-block.page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
            .mix-pur-print-page-next {
              margin-top: 0 !important;
              padding-top: 0 !important;
              border-top: none !important;
            }
            #mix-pur-print-area .mix-pur-title {
              font-size: 18px !important;
            }
            #mix-pur-print-area .mix-pur-company-name,
            #mix-pur-print-area .mix-pur-party-name {
              font-size: 14px !important;
            }
            #mix-pur-print-area .mix-pur-company-detail,
            #mix-pur-print-area .mix-pur-addr-line {
              font-size: 12px !important;
            }
            /* MVC meta table: Calibri 16px */
            #mix-pur-print-area .mix-pur-meta-table {
              table-layout: fixed !important;
              width: 100% !important;
              border-collapse: collapse !important;
              border: 1px solid #000 !important;
              box-sizing: border-box !important;
              font-family: Calibri, Verdana, Arial, sans-serif !important;
              font-size: 16px !important;
            }
            #mix-pur-print-area .mix-pur-meta-table th,
            #mix-pur-print-area .mix-pur-meta-table td {
              font-family: Calibri, Verdana, Arial, sans-serif !important;
              font-size: 16px !important;
              border: 1px solid #000 !important;
              box-sizing: border-box !important;
            }
            #mix-pur-print-area .mix-pur-meta-table th:last-child,
            #mix-pur-print-area .mix-pur-meta-table td:last-child {
              border-right: 1px solid #000 !important;
            }
            /* MVC item thead 13px / tbody 12px */
            #mix-pur-print-area .mix-pur-item-table thead th {
              font-family: Verdana, Arial, sans-serif !important;
              font-size: 13px !important;
              border: 1px solid #000 !important;
              background-color: #c0c0c0 !important;
              box-sizing: border-box !important;
            }
            #mix-pur-print-area .mix-pur-item-table thead th:last-child {
              border-right: 1px solid #000 !important;
            }
            #mix-pur-print-area .mix-pur-item-row td,
            #mix-pur-print-area .mix-pur-empty-row td {
              font-family: Verdana, Arial, sans-serif !important;
              font-size: 12px !important;
              height: 20px !important;
              line-height: 1.2 !important;
              padding-top: 0 !important;
              padding-bottom: 0 !important;
              padding-left: 6px !important;
              padding-right: 6px !important;
              border-left: 1px solid #000 !important;
              border-right: 1px solid #000 !important;
              border-top: none !important;
              border-bottom: none !important;
              box-sizing: border-box !important;
            }
            #mix-pur-print-area .mix-pur-item-row td:last-child,
            #mix-pur-print-area .mix-pur-empty-row td:last-child {
              border-right: 1px solid #000 !important;
            }
            #mix-pur-print-area .mix-pur-total-row td {
              border-top: 1px solid #000 !important;
              border-bottom: 1px solid #000 !important;
              border-left: 1px solid #000 !important;
              border-right: 1px solid #000 !important;
              box-sizing: border-box !important;
            }
            #mix-pur-print-area .mix-pur-total-row td:last-child {
              border-right: 1px solid #000 !important;
            }
            #mix-pur-print-area .mix-pur-item-table {
              table-layout: fixed !important;
              width: 100% !important;
              border-collapse: collapse !important;
              border-left: 1px solid #000 !important;
              border-right: 1px solid #000 !important;
              border-bottom: 1px solid #000 !important;
              page-break-inside: auto !important;
              break-inside: auto !important;
              box-sizing: border-box !important;
            }
            #mix-pur-print-area .mix-pur-item-table thead {
              display: table-header-group !important;
            }
            #mix-pur-print-area .mix-pur-item-table tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            #mix-pur-print-area th {
              background-color: #c0c0c0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #mix-pur-print-area td,
            #mix-pur-print-area th {
              box-sizing: border-box !important;
            }
            /* MVC address-box styling */
            #mix-pur-print-area .mix-pur-address-box,
            .mix-pur-print-sheet .mix-pur-address-box {
              height: 135px !important;
              border: 1px solid #000 !important;
              border-radius: 12px !important;
              padding: 8px 15px 12px 10px !important;
              box-sizing: border-box !important;
            }
            #mix-pur-print-area .mix-pur-address-box legend,
            .mix-pur-print-sheet .mix-pur-address-box legend {
              float: none !important;
              font-weight: bold !important;
              font-size: 13px !important;
              padding: 0 10px !important;
              width: auto !important;
              margin-left: 10px !important;
              margin-bottom: 2px !important;
              background: #fff !important;
              border: none !important;
            }
            #mix-pur-print-area .mix-pur-address-box div,
            .mix-pur-print-sheet .mix-pur-address-box div {
              font-size: 12px !important;
              line-height: 1.6 !important;
              margin-bottom: 5px !important;
            }
            #mix-pur-print-area .mix-pur-party-name,
            .mix-pur-print-sheet .mix-pur-party-name {
              font-size: 14px !important;
              letter-spacing: 0.9px !important;
            }
            #mix-pur-print-area .mix-pur-footer {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-before: avoid !important;
              break-before: avoid !important;
            }
            .d-print-none,
            .navbar-menu,
            .app-menu,
            .navbar-header,
            .footer,
            .vertical-menu,
            #page-topbar,
            .page-title-box,
            .Toastify {
              display: none !important;
              visibility: hidden !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
          @media (max-width: 767px) {
            .mix-pur-print-sheet {
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

export default MixPurchasePrintView;
