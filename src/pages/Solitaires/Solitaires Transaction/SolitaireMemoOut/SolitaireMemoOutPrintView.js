import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getSolitaireMemoOutPrintView } from "../../../../helpers/fakebackend_helper";
import {
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";
import { getVal } from "../../../../printFormats/shared/printUtils";
import PrintDocumentStyles from "../../../../printFormats/shared/PrintDocumentStyles";
import { isLandscapePrintFormat, resolvePrintComponent } from "../../../../printFormats/registry";

const SolitaireMemoOutPrintView = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const invNo = searchParams.get("InvNo") || searchParams.get("invNo") || "";
  const printRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const c = await getReportCompanySettings({ forceRefresh: true });
        setCompany(c);
      } catch (err) {
        console.error(err);
      }
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
        const res = await getSolitaireMemoOutPrintView(invNo);
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
      qty += Number(getVal(it, "Pcs", "pcs", "Qty", "qty")) || 0;
      wt += Number(getVal(it, "Weight", "weight", "Carats", "carats")) || 0;
      amount += Number(getVal(it, "Amount", "amount")) || 0;
    });
    return { qty, wt, amount };
  }, [items]);

  const logoUrl = resolveCompanyLogoUrl(company?.companyLogo);
  const memoFormat = company?.memoPrintFormat || "Solitaire Memo India_Single Format";
  // MVC: "Solitaire Memo" + itemCount >= 11 → SoMemoOutSiglePageFormat; else SoMemoOutPrintInv
  const FormatComponent = resolvePrintComponent("solitaireMemo", memoFormat, {
    itemCount: items.length
  });
  const isLandscape = isLandscapePrintFormat(memoFormat);
  const isLetterMemo =
    memoFormat === "Solitaire Memo India_Single Format" ||
    memoFormat === "Solitaire Memo USA_SiglePage Format" ||
    memoFormat === "Solitaire Memo";
  const printPageSize = isLetterMemo ? "Letter" : "A4";
  const isIndiaSingle = memoFormat === "Solitaire Memo India_Single Format";
  const isUsaSingle = memoFormat === "Solitaire Memo USA_SiglePage Format";
  const isClassic = memoFormat === "Solitaire Memo";
  const isClassicSinglePage = isClassic && items.length >= 11;
  const isClassicDual = isClassic && !isClassicSinglePage;
  const sheetHostClass = isIndiaSingle
    ? "india-single-print-host"
    : isUsaSingle
      ? "usa-single-print-host"
      : isClassicSinglePage
        ? "single-page-print-host"
        : isClassicDual
          ? "classic-print-host"
          : undefined;

  const invDisplay = getVal(data, "InvNo", "invNo") || invNo;
  const partyDisplay = String(getVal(data, "PartyName", "partyName") || "")
    .replace(/ /g, "_")
    .replace(/\//g, "")
    .replace(/\\/g, "");
  const pdfFileName = partyDisplay
    ? `MemoOut_${invDisplay}_${partyDisplay}`
    : `MemoOut_${invDisplay || "Print"}`;

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

  return (
    <React.Fragment>
      <div className="page-content memo-out-print-page">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <Link to="/memo/memo-list" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={handlePrint}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div
            ref={printRef}
            id="memo-out-print-area"
            className={sheetHostClass}
            style={{
              width: "100%",
              maxWidth: isLandscape ? 1100 : 960,
              margin: "0 auto",
              boxSizing: "border-box"
            }}
          >
            {FormatComponent ? (
              <FormatComponent
                data={data}
                items={items}
                totals={totals}
                company={company}
                logoUrl={logoUrl}
              />
            ) : (
              <div className="text-center text-muted py-5">{t("Print format is not registered.")}</div>
            )}
          </div>
        </Container>

        <PrintDocumentStyles
          printAreaId="memo-out-print-area"
          landscape={isLandscape}
          pageSize={printPageSize}
          extraPrintCss={
            isIndiaSingle
              ? `
            #memo-out-print-area.india-single-print-host {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              overflow: visible !important;
            }
            #memo-out-print-area .india-single-print-container,
            #memo-out-print-area .india-single-page,
            #memo-out-print-area .header-box {
              overflow: visible !important;
            }
            #memo-out-print-area .top-shree {
              background: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              z-index: 10 !important;
            }
          `
              : isUsaSingle
                ? `
            html, body {
              overflow: visible !important;
              height: auto !important;
            }
            @page {
              size: Letter portrait;
              margin: 10mm;
            }
            #memo-out-print-area.usa-single-print-host {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
            }
            #memo-out-print-area .usa-single-print-container {
              width: 100% !important;
              max-width: 100% !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              zoom: 0.90 !important;
            }
            #memo-out-print-area .invoice-top-table th,
            #memo-out-print-area .invoice-item-table th {
              background-color: #BFBFBF !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #memo-out-print-area .usa-single-sheet {
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: auto !important;
              break-inside: auto !important;
              min-height: 0 !important;
              height: auto !important;
              padding-top: 0 !important;
            }
            #memo-out-print-area .usa-single-sheet-last {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
          `
                : isClassicDual
                  ? `
            @page {
              size: Letter portrait;
              margin: 5mm;
            }
            #memo-out-print-area.classic-print-host {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }
            #memo-out-print-area .classic-print-container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              zoom: 0.72 !important;
            }
            #memo-out-print-area .classic-copy {
              width: 100% !important;
            }
            #memo-out-print-area .classic-main-table th,
            #memo-out-print-area th {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #memo-out-print-area .classic-sheet {
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            #memo-out-print-area .classic-sheet-last {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            #memo-out-print-area .classic-copy {
              page-break-inside: auto !important;
              break-inside: auto !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            #memo-out-print-area .classic-cut-gap {
              margin-top: 36px !important;
              height: 0 !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            #memo-out-print-area .classic-empty-row {
              height: 14px !important;
            }
            #memo-out-print-area .classic-logo {
              max-height: 72px !important;
              width: 90px !important;
            }
            #memo-out-print-area .classic-qr {
              height: 40px !important;
            }
          `
                  : isClassicSinglePage
                    ? `
            @page {
              size: Letter portrait;
              margin: 8mm;
            }
            html, body {
              overflow: visible !important;
              height: auto !important;
            }
            .page-content,
            .memo-out-print-page,
            #memo-out-print-area.single-page-print-host {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              overflow: visible !important;
              max-height: none !important;
              height: auto !important;
            }
            #memo-out-print-area .single-page-print-container,
            #memo-out-print-area .single-page-sheet {
              overflow: visible !important;
              max-height: none !important;
              height: auto !important;
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
            }
            #memo-out-print-area,
            #memo-out-print-area * {
              scrollbar-width: none !important;
            }
            #memo-out-print-area::-webkit-scrollbar,
            #memo-out-print-area *::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
            #memo-out-print-area .sp-data-table th,
            #memo-out-print-area .sp-memo-box th,
            #memo-out-print-area th {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #memo-out-print-area .single-page-sheet {
              width: 100% !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: auto !important;
              break-inside: auto !important;
            }
            #memo-out-print-area .single-page-sheet-last {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            #memo-out-print-area .sp-data-table thead {
              display: table-row-group !important;
            }
            #memo-out-print-area .sp-data-table tbody tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            #memo-out-print-area .sp-company-logo {
              max-height: 72px !important;
              width: 88px !important;
            }
            #memo-out-print-area .sp-memo-box td {
              height: 40px !important;
            }
            #memo-out-print-area .sp-data-table th {
              font-size: 9px !important;
            }
            #memo-out-print-area .sp-data-table tbody tr {
              height: 14px !important;
              font-size: 10px !important;
            }
            #memo-out-print-area .sp-footer-wrap {
              margin-top: 100px !important;
              margin-bottom: 48px !important;
              page-break-before: avoid !important;
              break-before: avoid !important;
            }
          `
                    : ""
          }
        />
        <style>{`
          @media screen {
            #memo-out-print-area {
              background: #e9eef2;
              padding: 16px 12px 28px;
              border-radius: 4px;
            }
            #memo-out-print-area .classic-print-container,
            #memo-out-print-area .india-single-print-container,
            #memo-out-print-area .usa-single-print-container,
            #memo-out-print-area .single-page-print-container {
              width: 100% !important;
              max-width: 8.5in !important;
              margin-left: auto !important;
              margin-right: auto !important;
              flex-shrink: 0;
            }
            #memo-out-print-area .single-page-print-container .single-page-sheet {
              width: 100% !important;
              max-width: 8.5in !important;
              margin-left: auto !important;
              margin-right: auto !important;
            }
            #memo-out-print-area .india-dual-print-container {
              width: 100% !important;
              max-width: 100% !important;
            }
          }
        `}</style>
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default SolitaireMemoOutPrintView;
