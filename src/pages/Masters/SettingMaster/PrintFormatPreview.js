import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { useTranslation } from "react-i18next";

import {
  getCachedReportCompany,
  resolveCompanyLogoUrl
} from "../../../helpers/reportCompanyDefaults";
import PrintDocumentStyles from "../../../printFormats/shared/PrintDocumentStyles";
import { isLandscapePrintFormat, resolvePrintComponent, resolvePrintModule } from "../../../printFormats/registry";
import { getPrintFormatSample } from "../../../printFormats/samplePreviewData";

const PrintFormatPreview = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const settingName = searchParams.get("setting") || "";
  const formatName = searchParams.get("format") || "";

  const company = useMemo(() => {
    const cached = getCachedReportCompany();
    return {
      ...cached,
      companyName: cached.companyName || "Sample Company",
      companyAddress: cached.companyAddress || "Sample Address Line 1",
      companyPhone: cached.companyPhone || "000-000-0000",
      companyEmail: cached.companyEmail || "sample@company.com",
      memoConditions: cached.memoConditions || "Sample memo conditions for preview only.",
      saleConditions: cached.saleConditions || "Sample sale conditions for preview only.",
      information: cached.information || "Sample information text for preview only."
    };
  }, []);

  const moduleKey = resolvePrintModule(settingName);
  const sample = getPrintFormatSample(moduleKey);
  const FormatComponent = resolvePrintComponent(moduleKey, formatName, { itemCount: sample.items.length });
  const isLandscape = isLandscapePrintFormat(formatName);
  const logoUrl = resolveCompanyLogoUrl(company.companyLogo);

  document.title = `Preview | ${formatName || "Print Format"}`;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-3 d-print-none flex-wrap gap-2">
            <div>
              <Link to="/PrintFormat/PrintFormat" className="btn btn-soft-secondary btn-sm me-2">
                {t("Back to Print Format")}
              </Link>
              <span className="text-muted small">
                {settingName} — {formatName} (sample records)
              </span>
            </div>
            <Button color="primary" size="sm" onClick={() => window.print()}>
              <i className="ri-printer-line me-1" />
              {t("Print")}
            </Button>
          </div>

          <div id="print-format-preview-area">
            {FormatComponent ? (
              <FormatComponent
                data={sample.data}
                items={sample.items}
                totals={sample.totals}
                company={company}
                logoUrl={logoUrl}
              />
            ) : (
              <div className="text-center text-muted py-5">
                {t("This print format is not registered yet.")}
              </div>
            )}
          </div>
        </Container>
        <PrintDocumentStyles printAreaId="print-format-preview-area" landscape={isLandscape} />
      </div>
    </React.Fragment>
  );
};

export default PrintFormatPreview;
