import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getSolitairePartyHoldPrintView } from "../../../../helpers/fakebackend_helper";
import {
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";
import { getVal } from "../../../../printFormats/shared/printUtils";
import PrintDocumentStyles from "../../../../printFormats/shared/PrintDocumentStyles";
import { isLandscapePrintFormat, resolvePrintComponent } from "../../../../printFormats/registry";

const SolitairePartyHoldPrintView = () => {
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
        const res = await getSolitairePartyHoldPrintView(invNo);
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
  const FormatComponent = resolvePrintComponent("solitaireMemo", memoFormat, {
    itemCount: items.length
  });
  const isLandscape = isLandscapePrintFormat(memoFormat);
  const isLetterMemoFormat =
    memoFormat === "Solitaire Memo India_Single Format" ||
    memoFormat === "Solitaire Memo USA_SiglePage Format" ||
    memoFormat === "Solitaire Memo";
  const printPageSize = isLetterMemoFormat ? "Letter" : "A4";
  const isUsaSingle = memoFormat === "Solitaire Memo USA_SiglePage Format";
  const isIndiaSingle = memoFormat === "Solitaire Memo India_Single Format";
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

  const handlePrint = () => {
    window.print();
  };

  document.title = `PartyHold_${invNo} | Admin`;

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
      <div className="page-content party-hold-print-page">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <Link to="/PartyHold/PartyHold-list" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={handlePrint}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div ref={printRef} id="party-hold-print-area" className={sheetHostClass}>
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
          printAreaId="party-hold-print-area"
          landscape={isLandscape}
          pageSize={printPageSize}
          extraPrintCss={
            isUsaSingle
              ? `
            html, body {
              overflow: visible !important;
              height: auto !important;
            }
            @page {
              size: Letter portrait;
              margin: 10mm;
            }
            #party-hold-print-area.usa-single-print-host {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }
            #party-hold-print-area .usa-single-print-container {
              width: 100% !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              zoom: 0.98 !important;
            }
            #party-hold-print-area .invoice-top-table th,
            #party-hold-print-area .invoice-item-table th {
              background-color: #BFBFBF !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          `
              : isIndiaSingle
                ? `
            #party-hold-print-area.india-single-print-host {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              overflow: visible !important;
            }
          `
              : isClassicDual
                ? `
            @page {
              size: Letter portrait;
              margin: 5mm;
            }
            #party-hold-print-area.classic-print-host {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }
            #party-hold-print-area .classic-print-container {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              zoom: 0.72 !important;
            }
            #party-hold-print-area .classic-copy {
              page-break-inside: auto !important;
              break-inside: auto !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            #party-hold-print-area .classic-cut-gap {
              margin-top: 36px !important;
              height: 0 !important;
            }
            #party-hold-print-area .classic-empty-row {
              height: 14px !important;
            }
            #party-hold-print-area .classic-logo {
              max-height: 72px !important;
              width: 90px !important;
            }
            #party-hold-print-area .classic-qr {
              height: 40px !important;
            }
            #party-hold-print-area th {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
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
            .party-hold-print-page,
            #party-hold-print-area.single-page-print-host {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              overflow: visible !important;
              max-height: none !important;
              height: auto !important;
            }
            #party-hold-print-area .single-page-print-container,
            #party-hold-print-area .single-page-sheet {
              overflow: visible !important;
              max-height: none !important;
              height: auto !important;
            }
            #party-hold-print-area,
            #party-hold-print-area * {
              scrollbar-width: none !important;
            }
            #party-hold-print-area::-webkit-scrollbar,
            #party-hold-print-area *::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
            #party-hold-print-area .sp-data-table th,
            #party-hold-print-area .sp-memo-box th,
            #party-hold-print-area th {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #party-hold-print-area .single-page-sheet {
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
            #party-hold-print-area .single-page-sheet-last {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            #party-hold-print-area .sp-data-table tbody tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            #party-hold-print-area .sp-company-logo {
              max-height: 72px !important;
              width: 88px !important;
            }
            #party-hold-print-area .sp-memo-box td {
              height: 40px !important;
            }
            #party-hold-print-area .sp-data-table th {
              font-size: 9px !important;
            }
            #party-hold-print-area .sp-data-table tbody tr {
              height: 14px !important;
              font-size: 10px !important;
            }
            #party-hold-print-area .sp-footer-wrap {
              margin-top: 100px !important;
              margin-bottom: 48px !important;
              page-break-before: avoid !important;
              break-before: avoid !important;
            }
          `
                  : ""
          }
        />
        {isIndiaSingle || isUsaSingle || isClassic ? (
          <style>{`
            @media screen {
              .party-hold-print-page .india-single-print-host,
              .party-hold-print-page .usa-single-print-host,
              .party-hold-print-page .classic-print-host,
              .party-hold-print-page .single-page-print-host {
                display: flex;
                flex-direction: column;
                align-items: center;
                background: #e9eef2;
                padding: 16px 12px 28px;
                border-radius: 4px;
              }
            }
          `}</style>
        ) : null}
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default SolitairePartyHoldPrintView;
