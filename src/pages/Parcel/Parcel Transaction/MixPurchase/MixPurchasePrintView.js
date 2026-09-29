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
      amount += Number(getVal(it, "Amount", "amount", "MasterCurrencyAmount", "masterCurrencyAmount")) || 0;
    });
    return { qty, wt, amount };
  }, [items]);

  const logoUrl = resolveCompanyLogoUrl(company?.companyLogo);
  const invDisplay = getVal(data, "InvNo", "invNo") || invNo;

  const handlePrint = () => {
    window.print();
  };

  document.title = `MixPurPrint_${invDisplay} | Admin`;

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
          .page-break { page-break-after: always; }
          .mix-pur-print-sheet {
            font-family: Verdana, Arial, sans-serif;
          }
          @media print {
            @page { size: Letter portrait; margin: 10mm; }
            html, body {
              background: #fff !important;
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
