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
              padding: 16,
              border: "1px solid #dee2e6",
              borderRadius: 8,
              width: "100%",
              maxWidth: 960,
              margin: "0 auto"
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
          /* Second+ print pages: top spacing after page break */
          .mix-pur-print-page-next {
            margin-top: 24px;
            padding-top: 10px;
          }
          /* MVC MixPurchasePrint_USA — Verdana 13px everywhere (match MVC PDF visual) */
          .mix-pur-print-sheet,
          .mix-pur-print-sheet * {
            font-family: Verdana, Arial, sans-serif !important;
          }
          .mix-pur-print-sheet {
            font-size: 13px;
            color: #000;
          }
          @media print {
            /* margin:0 keeps Chrome Headers/Footers from eating Letter space (MVC Rotativa has no browser chrome) */
            @page { size: Letter portrait; margin: 0; }
            html, body {
              background: #fff !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * { visibility: hidden !important; }
            #mix-pur-print-area,
            #mix-pur-print-area * {
              visibility: visible !important;
            }
            #mix-pur-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              /* Match MVC Rotativa PageMargins(10,10,10,10) without browser header/footer chrome */
              padding: 10mm !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: #fff !important;
              color: #000 !important;
              box-sizing: border-box !important;
              font-family: Verdana, Arial, sans-serif !important;
              font-size: 13px !important;
            }
            #mix-pur-print-area,
            #mix-pur-print-area * {
              font-family: Verdana, Arial, sans-serif !important;
              font-size: 13px !important;
            }
            #mix-pur-print-area .mix-pur-title {
              font-size: 18px !important;
            }
            #mix-pur-print-area .mix-pur-company-name {
              font-size: 14px !important;
            }
            #mix-pur-print-area .mix-pur-company-detail {
              font-size: 12px !important;
            }
            #mix-pur-print-area .mix-pur-addr-line {
              font-size: 12px !important;
            }
            /* Keep table chrome + gray headers identical to on-screen / MVC */
            #mix-pur-print-area table {
              border-collapse: collapse !important;
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
            /* Fit Letter like Rotativa: empty rows must not force a 2nd page for single-invoice prints */
            #mix-pur-print-area .mix-pur-item-row td,
            #mix-pur-print-area .mix-pur-empty-row td {
              height: 18px !important;
              max-height: 18px !important;
              line-height: 18px !important;
              padding-top: 0 !important;
              padding-bottom: 0 !important;
            }
            #mix-pur-print-area .mix-pur-address-box {
              height: 120px !important;
            }
            #mix-pur-print-area .mix-pur-print-page-next {
              margin-top: 0 !important;
              padding-top: 10mm !important;
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
              visibility: hidden !important;
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
