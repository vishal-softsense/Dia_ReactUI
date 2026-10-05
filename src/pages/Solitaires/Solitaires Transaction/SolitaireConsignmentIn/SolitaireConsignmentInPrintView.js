import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import { getSolitaireConsignmentInPrintView } from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  resolveCompanyLogoUrl
} from "../../../../helpers/reportCompanyDefaults";
import MemoInFormat from "../../../../printFormats/solitaireConsignmentIn/MemoInFormat";
import {
  applyPrintDocumentTitle,
  buildPrintFileName,
  getVal,
  printElementWithFileName
} from "../../../../printFormats/shared/printUtils";

const SolitaireConsignmentInPrintView = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const invNo = searchParams.get("InvNo") || searchParams.get("invNo") || searchParams.get("ID") || "";
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
        const res = await getSolitaireConsignmentInPrintView(invNo);
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
      qty += Number(getVal(it, "Qty", "qty", "Pcs", "pcs")) || 0;
      wt += Number(getVal(it, "Weight", "weight", "Carats", "carats")) || 0;
      amount +=
        Number(getVal(it, "Amount", "amount", "MasterCurrencyAmount", "masterCurrencyAmount")) || 0;
    });
    return { qty, wt, amount };
  }, [items]);

  const logoUrl = resolveCompanyLogoUrl(company?.companyLogo);
  // MVC: MemoIn_{InvNo}_{PartyName}.pdf — InvNo = INVOICE # (not URL id)
  const invoiceNo = getVal(data, "InvNo", "invNo") || invNo;
  const partyName = getVal(data, "PartyName", "partyName");
  const printFileName = buildPrintFileName("MemoIn", invoiceNo, partyName);

  useEffect(() => {
    if (!printFileName || printFileName === "MemoIn") return undefined;
    applyPrintDocumentTitle(printFileName);
    const onBeforePrint = () => applyPrintDocumentTitle(printFileName);
    window.addEventListener("beforeprint", onBeforePrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
    };
  }, [printFileName]);

  const handlePrint = () => {
    printElementWithFileName("consignment-print-area", printFileName);
  };

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
            <Link to="/consignment/consignment-list" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
          </div>
          <div className="text-center text-muted py-5">{t("Failed to load print view.")}</div>
          <ToastContainer autoClose={2000} />
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content consignment-print-page">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <Link to="/consignment/consignment-list" className="btn btn-soft-secondary btn-sm">
              {t("Back to List")}
            </Link>
            <Button color="primary" size="sm" onClick={handlePrint}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div
            id="consignment-print-area"
            className="consignment-print-sheet"
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
            <MemoInFormat
              data={data}
              items={items}
              totals={totals}
              company={company}
              logoUrl={logoUrl}
            />
          </div>
        </Container>

        <style>{`
          .page-break { page-break-after: always; break-after: page; }
          .memo-in-root { zoom: 0.97; }
          @media print {
            @page { size: Letter portrait; margin: 8mm; }
            html, body {
              background: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body * { visibility: hidden !important; }
            #consignment-print-area,
            #consignment-print-area * {
              visibility: visible !important;
            }
            #consignment-print-area {
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
            .memo-in-root {
              zoom: 0.80 !important;
            }
            .memo-in-sign-block {
              margin-top: 16px !important;
            }
            .memo-in-footer-block {
              margin-top: 24px !important;
            }
            #consignment-print-area thead {
              display: table-row-group !important;
            }
            #consignment-print-area .memo-in-item-table {
              page-break-inside: auto;
            }
            #consignment-print-area .memo-in-totals-row,
            #consignment-print-area .memo-in-totals-row td,
            #consignment-print-area .memo-in-sign-block,
            #consignment-print-area .memo-in-footer-block {
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
            .consignment-print-sheet {
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

export default SolitaireConsignmentInPrintView;
