import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getMixMemoOutPrintView, getMixMemoOutCurrentStatus } from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";
import { getVal, normalizeFormatName } from "../../../../printFormats/shared/printUtils";
import { isLandscapePrintFormat, resolvePrintComponent } from "../../../../printFormats/registry";
import MixMemoDualFormat from "../../../../printFormats/mixMemo/MixMemoDualFormat";
import MixMemoUsaFormat from "../../../../printFormats/mixMemo/MixMemoUsaFormat";
import MixMemoStellaFormat from "../../../../printFormats/mixMemo/MixMemoStellaFormat";

// MVC mix-memo/MixMemoOutPrintInv → MixMemoOutPrint_USA / Single / Dual
const MixMemoOutPrintView = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const memoId = searchParams.get("ID") || searchParams.get("Id") || "";
  const invNo = searchParams.get("InvNo") || searchParams.get("invNo") || memoId;
  // MVC: mixmemoform/parcelmixprintinvcurrent → Current Status print
  const isCurrentStatus =
    searchParams.get("currentStatus") === "1" ||
    searchParams.get("CurrentStatus") === "1" ||
    (typeof window !== "undefined" &&
      String(window.location?.pathname || "")
        .toLowerCase()
        .includes("parcelmixprintinvcurrent"));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [company, setCompany] = useState(() => getCachedReportCompany());

  useEffect(() => {
    const load = async () => {
      try {
        const c = await getReportCompanySettings({ forceRefresh: true, persist: false });
        setCompany(c);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!invNo && !memoId) {
        setLoading(false);
        toast.warning(t("Invoice number is required."));
        return;
      }
      setLoading(true);
      try {
        const res = isCurrentStatus
          ? await getMixMemoOutCurrentStatus(memoId || invNo)
          : await getMixMemoOutPrintView(memoId || invNo);
        if (!(res?.success || res?.Success)) {
          toast.error(res?.Data || res?.data || t("No data found for this Invoice."));
          return;
        }
        setData(res.Data || res.data || null);
      } catch (err) {
        console.error(err);
        toast.error(err?.response?.data?.Data || err?.message || t("No data found for this Invoice."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [invNo, memoId, isCurrentStatus, t]);

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
        ? Number(getVal(it, "BalanceAmt", "balanceAmt", "MasterCurrencyAmount", "masterCurrencyAmount", "Amount", "amount")) || 0
        : Number(getVal(it, "MasterCurrencyAmount", "masterCurrencyAmount", "Amount", "amount")) || 0;
    });
    return { qty, wt, balanceWt, amount };
  }, [items, isCurrentStatus]);

  const logoUrl = resolveCompanyLogoUrl(company?.companyLogo);
  const memoFormat = company?.mixMemoPrintFormat || "MixMemoUSA";
  // MVC Current Status always uses MemoRandumPending (USA-style Memorandum layout) — not Dual
  const FormatComponent = isCurrentStatus
    ? MixMemoUsaFormat
    : resolvePrintComponent("mixMemo", memoFormat, { itemCount: items.length });
  const isLandscape = !isCurrentStatus && isLandscapePrintFormat(memoFormat);
  // MixMemoUSA with <11 lines resolves to Dual; keep both copies on one Letter page
  const isDualFormat =
    !isCurrentStatus &&
    (FormatComponent === MixMemoDualFormat ||
      normalizeFormatName(memoFormat) === "MixMemoDual");
  const isUsaFormat = FormatComponent === MixMemoUsaFormat;
  const isStellaFormat = FormatComponent === MixMemoStellaFormat;
  const isFullMemoFormat = isUsaFormat || isStellaFormat;

  const invDisplay = getVal(data, "InvNo", "invNo") || invNo;
  const partyDisplay = String(getVal(data, "PartyName", "partyName") || "")
    .replace(/ /g, "_")
    .replace(/\//g, "")
    .replace(/\\/g, "");
  // Save as PDF: MixMemoCurrentStatus_* (MVC) or MixMemoOut_*
  const pdfFileName = isCurrentStatus
    ? partyDisplay
      ? `MixMemoCurrentStatus_${invDisplay}_${partyDisplay}`
      : `MixMemoCurrentStatus_${invDisplay || "Print"}`
    : partyDisplay
      ? `MixMemoOut_${invDisplay}_${partyDisplay}`
      : `MixMemoOut_${invDisplay || "Print"}`;

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = pdfFileName;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 500);
  };

  document.title = pdfFileName;

  if (loading || !company) {
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
            <Link to="/mixmemoform/mixmemoformlist" className="btn btn-soft-secondary btn-sm">
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
      <div className="page-content mix-memo-out-print-page">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <Link to="/mixmemoform/mixmemoformlist" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={handlePrint}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div
            id="mix-memo-out-print-area"
            className="mix-memo-out-print-sheet"
            style={{
              background: "#fff",
              padding: 16,
              border: "1px solid #dee2e6",
              borderRadius: 8,
              width: "100%",
              maxWidth: isLandscape ? 1100 : 960,
              margin: "0 auto"
            }}
          >
            {FormatComponent ? (
              <FormatComponent
                data={data}
                items={items}
                totals={totals}
                company={company}
                logoUrl={logoUrl}
                isCurrentStatus={isCurrentStatus}
              />
            ) : (
              <div className="text-center text-muted py-5">{t("Print format is not registered.")}</div>
            )}
          </div>
        </Container>

        <style>{`
          .page-break { page-break-after: always; break-after: page; }
          /* Screen: gap between page 1 and page 2 preview */
          .mix-memo-print-page-next {
            margin-top: 10px;
            padding-top: 0;
          }
          .mix-memo-out-print-sheet,
          .mix-memo-out-print-sheet * {
            font-family: Verdana, Arial, sans-serif !important;
          }
          .mix-memo-out-print-sheet {
            font-size: 13px;
            color: #000;
          }
          @media print {
            @page {
              size: ${isLandscape ? "A4 landscape" : "Letter portrait"};
              margin: 0;
            }
            html, body {
              background: #fff !important;
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Kill Velzon / layout chrome spacing that shows up as blank print bands */
            .page-content,
            .mix-memo-out-print-page,
            .main-content,
            .container-fluid {
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
            }
            body * { visibility: hidden !important; }
            #mix-memo-out-print-area,
            #mix-memo-out-print-area * {
              visibility: visible !important;
            }
            #mix-memo-out-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: ${
                isLandscape
                  ? "5mm"
                  : isDualFormat
                    ? "4mm 6mm"
                    : isFullMemoFormat
                      ? "5mm 8mm"
                      : "8mm"
              } !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: #fff !important;
              color: #000 !important;
              box-sizing: border-box !important;
              font-family: Verdana, Arial, sans-serif !important;
              font-size: 13px !important;
              ${isStellaFormat ? "zoom: 0.90;" : isUsaFormat ? "zoom: 0.88;" : ""}
            }
            #mix-memo-out-print-area,
            #mix-memo-out-print-area * {
              font-family: Verdana, Arial, sans-serif !important;
            }
            #mix-memo-out-print-area .mix-memo-title {
              font-size: 24px !important;
            }
            #mix-memo-out-print-area .mix-memo-company-name {
              font-size: 14px !important;
            }
            #mix-memo-out-print-area .mix-memo-company-detail {
              font-size: 12px !important;
            }
            #mix-memo-out-print-area .mix-memo-addr-line {
              font-size: 10px !important;
              line-height: 1.25 !important;
              margin-bottom: 2px !important;
            }
            #mix-memo-out-print-area .mix-memo-usa-page,
            #mix-memo-out-print-area .mix-memo-stella-page {
              page-break-inside: auto !important;
              break-inside: auto !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            #mix-memo-out-print-area .mix-memo-usa-logo,
            #mix-memo-out-print-area .mix-memo-stella-logo {
              width: 80px !important;
              max-height: 70px !important;
            }
            #mix-memo-out-print-area .mix-memo-address-box {
              margin: 0 !important;
              padding: ${isFullMemoFormat ? "4px 10px 6px 8px" : isDualFormat ? "2px 8px 3px 6px" : "8px 15px 12px 10px"} !important;
              height: ${isDualFormat ? "68px" : isFullMemoFormat ? "115px" : "150px"} !important;
              max-height: ${isDualFormat ? "68px" : isFullMemoFormat ? "115px" : "none"} !important;
              border-radius: 12px !important;
            }
            #mix-memo-out-print-area .mix-memo-address-box legend {
              margin-left: 10px !important;
              margin-bottom: 2px !important;
              padding: 0 10px !important;
              font-size: 13px !important;
              font-weight: bold !important;
              background: #fff !important;
              border: none !important;
            }
            /* Stop thead repeating onto a nearly-blank sheet when table slightly overflows */
            #mix-memo-out-print-area .mix-memo-usa-items thead,
            #mix-memo-out-print-area .mix-memo-stella-items thead {
              display: table-row-group !important;
            }
            #mix-memo-out-print-area .mix-memo-usa-addr-row {
              margin-top: 4px !important;
            }
            #mix-memo-out-print-area .mix-memo-usa-items .mix-memo-item-row td,
            #mix-memo-out-print-area .mix-memo-usa-items .mix-memo-empty-row td {
              height: 18px !important;
              max-height: 18px !important;
              line-height: 18px !important;
              padding-top: 0 !important;
              padding-bottom: 0 !important;
            }
            #mix-memo-out-print-area .mix-memo-stella-items .mix-memo-item-row td,
            #mix-memo-out-print-area .mix-memo-stella-items .mix-memo-empty-row td {
              height: 18px !important;
              max-height: 18px !important;
              line-height: 18px !important;
              padding-top: 0 !important;
              padding-bottom: 0 !important;
            }
            #mix-memo-out-print-area .mix-memo-usa-items thead th,
            #mix-memo-out-print-area .mix-memo-stella-items thead th {
              padding: 3px 0 !important;
            }
            #mix-memo-out-print-area .mix-memo-usa-signature,
            #mix-memo-out-print-area .mix-memo-stella-signature {
              margin-top: 10px !important;
            }
            #mix-memo-out-print-area .mix-memo-usa-conditions {
              margin: 10px 0 !important;
              font-size: 11px !important;
              line-height: 1.45 !important;
              max-height: none !important;
              height: auto !important;
              overflow: visible !important;
            }
            #mix-memo-out-print-area .mix-memo-usa-info {
              margin: 7px 0 !important;
              font-size: 11px !important;
              line-height: 1.45 !important;
            }
            /* Stella info/conditions — auto height so signature+conditions stay on same print page */
            #mix-memo-out-print-area .mix-memo-stella-info {
              height: auto !important;
              max-height: 64px !important;
              margin: 6px 0 !important;
              font-size: 10px !important;
              line-height: 1.3 !important;
              overflow: hidden !important;
            }
            #mix-memo-out-print-area .mix-memo-stella-conditions {
              margin: 6px 0 !important;
              font-size: 10px !important;
              line-height: 1.3 !important;
              height: auto !important;
              max-height: 56px !important;
              overflow: hidden !important;
            }
            #mix-memo-out-print-area .mix-memo-stella-footer-block {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            #mix-memo-out-print-area .mix-memo-usa-footer-block {
              page-break-inside: auto !important;
              break-inside: auto !important;
              margin-bottom: 0 !important;
            }
            #mix-memo-out-print-area .mix-memo-print-page-next {
              margin-top: 10px !important;
              margin-bottom: 0 !important;
              padding-top: 0 !important;
              padding-bottom: 0 !important;
            }
            /* Do NOT force signature/footer to next page — that creates blank sheets */
            #mix-memo-out-print-area .mix-memo-dual-addr {
              font-size: 9px !important;
              line-height: 1.15 !important;
            }
            #mix-memo-out-print-area .mix-memo-dual-page {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            #mix-memo-out-print-area .mix-memo-dual-logo {
              width: 90px !important;
              max-height: 52px !important;
            }
            #mix-memo-out-print-area .mix-memo-dual-qr {
              height: 36px !important;
            }
            #mix-memo-out-print-area .mix-memo-dual-copy-title {
              font-size: 18px !important;
            }
            #mix-memo-out-print-area .mix-memo-dual-main th,
            #mix-memo-out-print-area .mix-memo-dual-main td {
              padding-top: 0 !important;
              padding-bottom: 0 !important;
            }
            #mix-memo-out-print-area .mix-memo-dual-item-row td,
            #mix-memo-out-print-area .mix-memo-dual-empty-row td {
              height: 14px !important;
              max-height: 14px !important;
              line-height: 14px !important;
              padding-top: 0 !important;
              padding-bottom: 0 !important;
            }
            #mix-memo-out-print-area th {
              background-color: #BFBFBF !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #mix-memo-out-print-area .mix-memo-footer {
              margin-top: 0 !important;
            }
            .page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
            /* Never leave a trailing blank sheet after the last memo page */
            #mix-memo-out-print-area .mix-memo-usa-page:last-child,
            #mix-memo-out-print-area .mix-memo-stella-page:last-child,
            #mix-memo-out-print-area .mix-memo-dual-page:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
            }
            #mix-memo-out-print-area .mix-memo-usa-root,
            #mix-memo-out-print-area .mix-memo-stella-root {
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
              height: auto !important;
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
            .mix-memo-out-print-sheet {
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

export default MixMemoOutPrintView;
