import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getSolitaireSalePrintView } from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";
import { getVal } from "../../../../printFormats/shared/printUtils";
import { isLandscapePrintFormat, resolvePrintComponent } from "../../../../printFormats/registry";

/** Sale print preview — half-screen centered sheet (like Purchase). */
const SolitaireSalePrintView = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const invNo = searchParams.get("InvNo") || searchParams.get("invNo") || "";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [company, setCompany] = useState(() => getCachedReportCompany());

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
        const res = await getSolitaireSalePrintView(invNo);
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
  const saleFormat = company?.salePrintFormat || "Solitaire Sale Invoice USA_Format1";
  const FormatComponent = resolvePrintComponent("solitaireSale", saleFormat);
  const isLandscape = isLandscapePrintFormat(saleFormat);

  const saleNo = getVal(data, "InvNo", "invNo") || invNo;
  const partyName = String(getVal(data, "PartyName", "partyName") || "")
    .replace(/\s+/g, "_")
    .replace(/[\\/]/g, "");
  const printFileName = partyName
    ? `Sale_${saleNo || invNo}_${partyName}`
    : `Sale_${saleNo || invNo}`;

  const handlePrint = () => {
    document.title = printFileName;
    window.print();
  };

  document.title = printFileName;

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
            <Link to="/sale/sale-list" className="btn btn-soft-secondary btn-sm">
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
      <div className="page-content sale-print-page">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <Link to="/sale/sale-list" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={handlePrint}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div
            id="sale-print-area"
            className="sale-print-sheet"
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

        <style>{`
          .page-break { page-break-after: always; break-after: page; }
          .sale-usa-f1-root,
          .sale-usa-f1-root *,
          .sale-usa-f2-root,
          .sale-usa-f2-root *,
          .sale-usa-root,
          .sale-usa-root * {
            font-family: Verdana, Arial, Helvetica, sans-serif !important;
            color: #000 !important;
          }
          @media print {
            @page { size: ${isLandscape ? "Letter landscape" : "Letter portrait"}; margin: 6mm; }
            html, body {
              background: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body * { visibility: hidden !important; }
            #sale-print-area,
            #sale-print-area * {
              visibility: visible !important;
            }
            #sale-print-area {
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
            .sale-usa-root {
              zoom: 0.9 !important;
            }
            .sale-usa-f1-root {
              zoom: 0.82 !important;
            }
            .sale-usa-f2-root {
              zoom: 0.88 !important;
            }
            .sale-dubai-local-root {
              zoom: 0.82 !important;
            }
            .sale-dubai-export-root {
              zoom: 0.78 !important;
            }
            .sale-india-root {
              zoom: 0.95 !important;
            }
            .sale-usa-f2-page {
              display: flex !important;
              flex-direction: column !important;
              min-height: 10.4in !important;
              box-sizing: border-box !important;
            }
            .sale-dubai-local-page {
              display: flex !important;
              flex-direction: column !important;
              min-height: 10.4in !important;
              box-sizing: border-box !important;
            }
            .sale-dubai-export-page {
              min-height: 0 !important;
              height: auto !important;
              box-sizing: border-box !important;
            }
            .sale-usa-f2-footer-block,
            .sale-dubai-local-footer {
              margin-top: auto !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .sale-dubai-export-footer {
              margin-top: 0 !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-before: avoid !important;
              break-before: avoid !important;
            }
            .sale-usa-f1-page.page-break,
            .sale-usa-f2-page.page-break,
            .sale-usa-page.page-break,
            .sale-dubai-local-page.page-break,
            .sale-dubai-export-page.page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
            .sale-usa-f1-header {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            #sale-print-area thead {
              display: table-header-group !important;
            }
            #sale-print-area .sale-usa-f1-item-table,
            #sale-print-area .sale-usa-f2-item-table {
              page-break-inside: auto;
            }
            #sale-print-area .sale-usa-f1-footer,
            #sale-print-area .sale-usa-f1-sign,
            #sale-print-area .sale-usa-f1-totals-row,
            #sale-print-area .sale-usa-f1-totals-row td {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-before: avoid !important;
              break-before: avoid !important;
            }
            #sale-print-area .sale-usa-f2-payment,
            #sale-print-area .sale-usa-f2-sign,
            #sale-print-area .sale-usa-f2-totals-row,
            #sale-print-area .sale-usa-f2-totals-row td {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            #sale-print-area .sale-usa-footer {
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
            .page-title-box {
              display: none !important;
            }
          }
          @media (max-width: 767px) {
            .sale-print-sheet {
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

export default SolitaireSalePrintView;
