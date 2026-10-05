import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import {
  getMixConsignmentPrintView,
  getMixConsignmentCurrentStatusPrint
} from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";
import MixPurPrintUsaFormat from "../../../../printFormats/mixPurchase/MixPurPrintUsaFormat";
import MixMemoUsaFormat from "../../../../printFormats/mixMemo/MixMemoUsaFormat";
import { getVal } from "../../../../printFormats/shared/printUtils";

// MVC MixConsignment/MixConsignmentPrintInv → MixConsignmentPrint_USA
// MVC MixConsignment/parmixconsignmentcurrent → ParcelConsignmentPending (Cur Status)
const MixConsignmentPrintView = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const invNo =
    searchParams.get("ID") ||
    searchParams.get("Id") ||
    searchParams.get("InvNo") ||
    searchParams.get("invNo") ||
    "";
  const isCurrentStatus =
    searchParams.get("currentStatus") === "1" ||
    searchParams.get("CurrentStatus") === "1" ||
    (typeof window !== "undefined" &&
      String(window.location?.pathname || "")
        .toLowerCase()
        .includes("parmixconsignmentcurrent"));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [company, setCompany] = useState(() => getCachedReportCompany());

  useEffect(() => {
    const load = async () => {
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
        const res = isCurrentStatus
          ? await getMixConsignmentCurrentStatusPrint(invNo)
          : await getMixConsignmentPrintView(invNo);
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
  }, [invNo, isCurrentStatus, t]);

  const items = useMemo(() => data?.items || data?.Items || [], [data]);
  const totals = useMemo(() => {
    let qty = 0;
    let wt = 0;
    let balanceWt = 0;
    let amount = 0;
    items.forEach((it) => {
      qty += Number(getVal(it, "Qty", "qty", "Pcs", "pcs")) || 0;
      wt += Number(getVal(it, "Weight", "weight", "Carats", "carats")) || 0;
      balanceWt += Number(getVal(it, "Balance", "balance")) || 0;
      amount += isCurrentStatus
        ? Number(getVal(it, "BalanceAmt", "balanceAmt", "Amount", "amount")) || 0
        : Number(getVal(it, "Amount", "amount")) || 0;
    });
    return { qty, wt, balanceWt, amount };
  }, [items, isCurrentStatus]);

  const logoUrl = resolveCompanyLogoUrl(company?.companyLogo);
  const invDisplay = String(
    getVal(data, "InvNo", "invNo", "ID", "Id", "Inv") || invNo || ""
  ).trim();
  const partyDisplay = String(
    getVal(data, "PartyName", "partyName", "Party", "party", "AccGrpName") || ""
  )
    .trim()
    .replace(/ /g, "_")
    .replace(/\//g, "")
    .replace(/\\/g, "");
  // MVC Crystal PDF: MixMemoIn_{InvNo}_{Party}.pdf
  const pdfFileName = isCurrentStatus
    ? partyDisplay
      ? `MixMemoInCurrentStatus_${invDisplay}_${partyDisplay}`
      : `MixMemoInCurrentStatus_${invDisplay || "Print"}`
    : partyDisplay
      ? `MixMemoIn_${invDisplay}_${partyDisplay}`
      : `MixMemoIn_${invDisplay || "Print"}`;

  const handlePrint = () => {
    // Keep title as PDF name for Chrome "Save as PDF" (do not restore early)
    document.title = pdfFileName;
    window.print();
  };

  useEffect(() => {
    if (!loading && data) {
      document.title = pdfFileName;
    }
  }, [loading, data, pdfFileName]);

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
            <Link to="/mixconsignmentform/mixconsignmentformlist" className="btn btn-soft-secondary btn-sm">
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
      <div className="page-content mix-cons-print-page">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <Link to="/mixconsignmentform/mixconsignmentformlist" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={handlePrint}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div
            id="mix-cons-print-area"
            className="mix-cons-print-sheet"
            style={{
              background: "#fff",
              padding: 16,
              border: "1px solid #dee2e6",
              borderRadius: 8,
              width: "100%",
              maxWidth: 960,
              margin: "0 auto"
            }}
          >
            {isCurrentStatus ? (
              <MixMemoUsaFormat
                data={data}
                items={items}
                totals={totals}
                company={company}
                logoUrl={logoUrl}
                isCurrentStatus
                title="MEMO IN"
                curStatusPageSize={25}
              />
            ) : (
              <MixPurPrintUsaFormat
                data={data}
                items={items}
                totals={totals}
                company={company}
                logoUrl={logoUrl}
                heading="GENERAL MEMO IN"
                variant="consignment"
              />
            )}
          </div>
        </Container>

        <style>{`
          .page-break { page-break-after: always; break-after: page; }
          .mix-pur-print-page-next {
            margin-top: 24px;
            padding-top: 10px;
          }
          .mix-memo-print-page-next {
            margin-top: 16px;
            padding-top: 8px;
          }
          .mix-cons-print-sheet,
          .mix-cons-print-sheet * {
            font-family: Verdana, Arial, sans-serif !important;
          }
          .mix-cons-print-sheet {
            font-size: 13px;
            color: #000;
          }
          #mix-cons-print-area .mix-memo-footer.footer-section {
            margin-bottom: 16px;
            padding-bottom: 12px;
          }
          #mix-cons-print-area .footer-powered {
            padding-top: 4px;
            padding-bottom: 8px;
          }
          @media print {
            @page { size: Letter portrait; margin: 0; }
            html, body {
              background: #fff !important;
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Hide app chrome — avoid visibility:hidden (leaves blank UI after print) */
            .d-print-none,
            .Toastify,
            .navbar-header,
            .app-menu,
            .navbar-menu,
            .vertical-menu,
            .footer,
            #page-topbar,
            .topnav {
              display: none !important;
            }
            .page-content,
            .mix-cons-print-page,
            .main-content,
            .container-fluid {
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
              background: #fff !important;
            }
            #mix-cons-print-area {
              position: relative !important;
              left: auto !important;
              top: auto !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: ${isCurrentStatus ? "4mm 6mm" : "6mm 8mm"} !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: #fff !important;
              color: #000 !important;
              box-sizing: border-box !important;
              font-family: Verdana, Arial, sans-serif !important;
              font-size: 13px !important;
              ${isCurrentStatus ? "zoom: 0.86;" : "zoom: 0.92;"}
            }
            /* GENERAL MEMO IN — keep single page (MVC MixConsignmentPrint_USA) */
            #mix-cons-print-area .mix-pur-print-page-block {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            #mix-cons-print-area .mix-pur-print-page-next {
              margin: 0 !important;
              padding: 8mm 0 0 0 !important;
            }
            #mix-cons-print-area .mix-pur-item-row td,
            #mix-cons-print-area .mix-pur-empty-row td {
              height: 18px !important;
              max-height: 18px !important;
              line-height: 18px !important;
              padding-top: 0 !important;
              padding-bottom: 0 !important;
              font-size: 12px !important;
            }
            #mix-cons-print-area .mix-pur-footer {
              margin-top: 12px !important;
            }
            #mix-cons-print-area .mix-pur-title {
              font-size: 22px !important;
            }
            #mix-cons-print-area .mix-pur-company-name {
              font-size: 13px !important;
            }
            #mix-cons-print-area .mix-pur-title,
            #mix-cons-print-area .mix-memo-title {
              font-size: 22px !important;
            }
            #mix-cons-print-area .mix-pur-company-name,
            #mix-cons-print-area .mix-memo-company-name {
              font-size: 13px !important;
            }
            #mix-cons-print-area .mix-memo-usa-page {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            #mix-cons-print-area .mix-memo-usa-page:not(.mix-memo-print-page-next) {
              margin: 0 !important;
              padding: 0 !important;
            }
            /* Page 2+ — top gap like MVC @page margin (10mm) */
            #mix-cons-print-area .mix-memo-print-page-next {
              margin: 0 !important;
              padding: 8mm 0 0 0 !important;
            }
            #mix-cons-print-area .mix-memo-usa-logo {
              width: 70px !important;
              max-height: 60px !important;
            }
            #mix-cons-print-area .mix-memo-address-box {
              height: 88px !important;
              max-height: 88px !important;
              padding: 3px 8px 4px 6px !important;
              margin: 0 !important;
            }
            #mix-cons-print-area .mix-memo-usa-info {
              margin: 3px 0 !important;
              font-size: 9px !important;
              line-height: 1.25 !important;
              text-align: justify !important;
              max-height: none !important;
              height: auto !important;
              overflow: visible !important;
              white-space: normal !important;
            }
            #mix-cons-print-area .mix-memo-usa-items thead {
              display: table-row-group !important;
            }
            #mix-cons-print-area .mix-memo-usa-items .mix-memo-item-row td,
            #mix-cons-print-area .mix-memo-usa-items .mix-memo-empty-row td {
              height: 14px !important;
              max-height: 14px !important;
              line-height: 14px !important;
              padding-top: 0 !important;
              padding-bottom: 0 !important;
              font-size: 9px !important;
            }
            #mix-cons-print-area .mix-memo-usa-items thead th {
              padding: 1px 0 !important;
              font-size: 9px !important;
            }
            #mix-cons-print-area .mix-memo-usa-footer-block {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin-top: 22px !important;
            }
            #mix-cons-print-area .mix-memo-footer.footer-section {
              margin-top: 8px !important;
              margin-bottom: 24px !important;
              padding: 6px 4px 16px 4px !important;
            }
            #mix-cons-print-area .mix-memo-footer.footer-section td {
              padding: 4px 6px !important;
            }
            #mix-cons-print-area .footer-powered {
              padding-left: 4px !important;
              padding-top: 4px !important;
              padding-bottom: 8px !important;
            }
            #mix-cons-print-area .mix-memo-usa-signature {
              margin-top: 18px !important;
            }
            #mix-cons-print-area .mix-memo-usa-conditions {
              margin: 6px 0 !important;
              font-size: 10px !important;
              line-height: 1.35 !important;
              text-align: justify !important;
              max-height: none !important;
              height: auto !important;
              overflow: visible !important;
              white-space: normal !important;
            }
          }
        `}</style>
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default MixConsignmentPrintView;
