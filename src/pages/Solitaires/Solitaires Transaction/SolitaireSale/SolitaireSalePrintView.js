import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getSolitaireSalePrintView } from "../../../../helpers/fakebackend_helper";
import {
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";
import { getVal } from "../../../../printFormats/shared/printUtils";
import PrintDocumentStyles from "../../../../printFormats/shared/PrintDocumentStyles";
import { isLandscapePrintFormat, resolvePrintComponent } from "../../../../printFormats/registry";

const SolitaireSalePrintView = () => {
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
  const saleFormat = company?.salePrintFormat || "Solitaire Sale Invoice USA";
  const FormatComponent = resolvePrintComponent("solitaireSale", saleFormat);
  const isLandscape = isLandscapePrintFormat(saleFormat);

  const invDisplay = getVal(data, "InvNo", "invNo") || invNo;
  const partyDisplay = String(getVal(data, "PartyName", "partyName", "Party", "party") || "")
    .replace(/ /g, "_")
    .replace(/\//g, "")
    .replace(/\\/g, "");
  // Save as PDF: Sale_{InvNo}_{Party}.pdf (MVC SaleController / Dubai NBF)
  const pdfFileName = partyDisplay
    ? `Sale_${invDisplay}_${partyDisplay}`
    : `Sale_${invDisplay || "Print"}`;

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

          <div ref={printRef} id="sale-print-area">
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
          printAreaId="sale-print-area"
          landscape={isLandscape}
          extraPrintCss={`
            #sale-print-area .sale-dubai-nbf-root {
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              border-radius: 0 !important;
              background: #fff !important;
              overflow: visible !important;
              box-sizing: border-box !important;
            }
            #sale-print-area .sale-dubai-nbf-edge {
              width: 2px !important;
              min-width: 2px !important;
              max-width: 2px !important;
              padding: 0 !important;
              background: #454545 !important;
              border: none !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          `}
        />
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default SolitaireSalePrintView;
