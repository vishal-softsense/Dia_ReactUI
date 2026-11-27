import { useEffect, useState } from "react";
import {
  getCachedReportCompany,
  getCompanyCurrencySymbols,
  REPORT_COMPANY_SETTINGS_EVENT
} from "../../helpers/reportCompanyDefaults";

/**
 * Dynamically loads and subscribes to the active company's master and stock
 * currency symbols (resolved from Currency Master / company settings) without
 * hardcoded currency fallbacks.
 */
const useCompanyCurrencySymbols = () => {
  const [symbols, setSymbols] = useState(() => {
    const cached = getCachedReportCompany();
    return {
      masterSymbol: cached.masterSymbol || "",
      stockSymbol: cached.stockSymbol || ""
    };
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      const resolved = await getCompanyCurrencySymbols({ forceRefresh: true });
      if (active) {
        setSymbols({
          masterSymbol: resolved.masterSymbol || "",
          stockSymbol: resolved.stockSymbol || ""
        });
      }
    };

    const handleRefresh = () => {
      const cached = getCachedReportCompany();
      if (active) {
        setSymbols((prev) => ({
          masterSymbol: cached.masterSymbol || prev.masterSymbol || "",
          stockSymbol: cached.stockSymbol || prev.stockSymbol || ""
        }));
      }
    };

    load();
    window.addEventListener(REPORT_COMPANY_SETTINGS_EVENT, handleRefresh);
    return () => {
      active = false;
      window.removeEventListener(REPORT_COMPANY_SETTINGS_EVENT, handleRefresh);
    };
  }, []);

  return symbols;
};

export default useCompanyCurrencySymbols;

