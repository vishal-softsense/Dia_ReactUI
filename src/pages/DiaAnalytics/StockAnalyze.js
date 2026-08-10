import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container, Card, CardBody, Spinner } from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { getStockAnalyzeConfig } from "../../helpers/fakebackend_helper";

const StockAnalyze = () => {
  const { t } = useTranslation();
  const [iframeUrl, setIframeUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `${t("DiaAnalytics")} | SoftOnCloud`;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setIframeLoading(true);
      setError("");
      try {
        const response = await getStockAnalyzeConfig();
        const success =
          response?.Success ?? response?.success ?? response?.data?.Success ?? response?.data?.success;
        const data = response?.Data ?? response?.data?.Data ?? response?.data ?? null;
        const url = data?.iframeUrl || data?.IframeUrl || "";

        if (!cancelled) {
          if (success && url) {
            setIframeUrl(url);
          } else {
            setError(
              response?.Message ||
                response?.message ||
                "Diasense Stock Analyze is not configured."
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            typeof err === "string"
              ? err
              : err?.message || "Failed to load Stock Analyze."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title={t("DiaAnalytics")} pageTitle={t("DiaAnalytics")} />
        <Card className="shadow-none border-0 mb-0">
          <CardBody className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner color="primary" />
              </div>
            ) : error ? (
              <div className="text-center text-danger py-5 px-3">{error}</div>
            ) : (
              <>
                {iframeLoading && (
                  <div className="text-center py-5">
                    <Spinner color="primary" />
                  </div>
                )}
                <iframe
                  title="Stock Analyze"
                  src={iframeUrl}
                  height="830"
                  frameBorder="0"
                  className="w-100"
                  onLoad={() => setIframeLoading(false)}
                  style={{ minHeight: 830, border: 0, display: iframeLoading ? "none" : "block" }}
                />
              </>
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default StockAnalyze;
