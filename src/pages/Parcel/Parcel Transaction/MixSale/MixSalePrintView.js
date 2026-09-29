import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getMixSalePrintView } from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";
import { getVal } from "../../../../printFormats/shared/printUtils";
import MixSalePrintUsaFormat from "../../../../printFormats/mixSale/MixSalePrintUsaFormat";

const MixSalePrintView = () => {
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
        const res = await getMixSalePrintView(invNo);
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
    let tdc = 0;
    let amount = 0;
    items.forEach((it) => {
      qty += Number(getVal(it, "Pcs", "pcs", "Qty", "qty")) || 0;
      wt += Number(getVal(it, "Carats", "carats", "Weight", "weight")) || 0;
      tdc += Number(getVal(it, "TotalDiamondCarat", "totalDiamondCarat")) || 0;
      amount +=
        Number(getVal(it, "MasterCurrencyAmount", "masterCurrencyAmount", "Amount", "amount")) || 0;
    });
    return { qty, wt, tdc, amount };
  }, [items]);

  const logoUrl = resolveCompanyLogoUrl(company?.companyLogo);
  const invDisplay = getVal(data, "InvNo", "invNo") || invNo;

  const handlePrint = () => {
    window.print();
  };

  document.title = `MixSale_${invDisplay} | Admin`;

  if (loading) {
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
      <div className="page-content mix-sale-print-page">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <Link to="/mixform/mixformlist" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={handlePrint}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div
            id="mix-sale-print-area"
            className="mix-sale-print-sheet"
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
            <MixSalePrintUsaFormat
              data={data}
              items={items}
              totals={totals}
              company={company}
              logoUrl={logoUrl}
            />
          </div>
        </Container>

        <style>{`
          .page-break { page-break-after: always; }
          @media print {
            @page { size: Letter portrait; margin: 10mm; }
            html, body {
              background: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * { visibility: hidden !important; }
            #mix-sale-print-area,
            #mix-sale-print-area * {
              visibility: visible !important;
            }
            #mix-sale-print-area {
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
            .mix-sale-print-sheet {
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

export default MixSalePrintView;
