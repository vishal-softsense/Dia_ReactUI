import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getSolitaireSaleReturnPrintView } from "../../../../helpers/fakebackend_helper";
import {
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";
import { getVal } from "../../../../printFormats/shared/printUtils";
import PrintDocumentStyles from "../../../../printFormats/shared/PrintDocumentStyles";
import { isLandscapePrintFormat, resolvePrintComponent } from "../../../../printFormats/registry";

const SolitaireSaleReturnPrintView = () => {
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
        const res = await getSolitaireSaleReturnPrintView(invNo);
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

  const handlePrint = () => {
    window.print();
  };

  document.title = `SaleReturn_${invNo} | Admin`;

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
            <Link to="/salereturn/salereturn-list" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={handlePrint}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div ref={printRef} id="salereturn-print-area">
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

        <PrintDocumentStyles printAreaId="salereturn-print-area" landscape={isLandscape} />
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default SolitaireSaleReturnPrintView;
