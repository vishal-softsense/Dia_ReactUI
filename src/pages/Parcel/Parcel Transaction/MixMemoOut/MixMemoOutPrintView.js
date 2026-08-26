import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getMixMemoOutDetail, getMixMemoOutPrintView } from "../../../../helpers/fakebackend_helper";
import {
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";
import { getVal } from "../../../../printFormats/shared/printUtils";
import PrintDocumentStyles from "../../../../printFormats/shared/PrintDocumentStyles";
import { isLandscapePrintFormat, resolvePrintComponent } from "../../../../printFormats/registry";

const num = (...vals) => {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

const MixMemoOutPrintView = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const memoId =
    searchParams.get("ID") ||
    searchParams.get("Id") ||
    "";
  const invNo =
    searchParams.get("InvNo") ||
    searchParams.get("invNo") ||
    memoId;
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
      if (!invNo && !memoId) {
        setLoading(false);
        toast.warning(t("Invoice number is required."));
        return;
      }
      setLoading(true);
      try {
        const res = await getMixMemoOutPrintView(memoId || invNo);
        if (!(res?.success || res?.Success)) {
          toast.error(res?.Data || res?.data || t("Failed to load print view."));
          return;
        }
        setData(res.Data || res.data || null);
      } catch (err) {
        console.error(err);
        toast.error(t("Failed to load print view."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [invNo, memoId, t]);

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
  const memoFormat = company?.mixMemoPrintFormat || "MixMemoUSA";
  const FormatComponent = resolvePrintComponent("mixMemo", memoFormat, { itemCount: items.length });
  const isLandscape = isLandscapePrintFormat(memoFormat);

  const handlePrint = () => {
    window.print();
  };

  document.title = `MixMemoOut_${invNo} | Admin`;

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

          <div ref={printRef} id="mix-memo-out-print-area">
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

        <PrintDocumentStyles printAreaId="mix-memo-out-print-area" landscape={isLandscape} />
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default MixMemoOutPrintView;
