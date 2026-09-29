import { useCallback, useEffect, useState } from "react";
import {
  getCachedSettingReportDates,
  getSettingReportDates,
  REPORT_DATE_SETTINGS_EVENT
} from "../../helpers/reportDateDefaults";

/**
 * Central MinDate/MaxDate hook — React equivalent of MVC `_MasterLayout.cshtml`
 * `#sessiondate-values` + global FromDate/ToDate fill.
 *
 * ============================================================
 * USE THIS IN EVERY NEW REPORT (do not re-copy date logic)
 * ============================================================
 *
 * Filters-object reports (Party Hold, Memo, Purchase, Sale, …):
 *
 *   import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";
 *
 *   const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates({
 *     includeReturnDates: true, // optional: also sets fromRtnDate / toRtnDate
 *     includeDueDates: true,    // optional: also sets fromDateDue / toDateDue
 *     includePrintDates: true,  // optional: also sets rDate / rToDate (Print Date filters)
 *   });
 *
 *   const [filters, setFilters] = useState({
 *     fromDate,
 *     toDate,
 *     fromRtnDate: fromDate,
 *     toRtnDate: toDate,
 *     // ...other fields
 *   });
 *
 *   useEffect(() => {
 *     setFilters((prev) => mergeDates(prev));
 *   }, [fromDate, toDate, mergeDates]);
 *
 *   const handleClear = async () => {
 *     const d = await getDates();
 *     setFilters(mergeDates({ currency: "", type: "ALL" }, d));
 *   };
 *
 * Separate fromDate/toDate useState (Dashboard analysis reports):
 *
 *   const { fromDate: settingFrom, toDate: settingTo, getDates } = useSettingReportDates();
 *   const [fromDate, setFromDate] = useState(settingFrom);
 *   const [toDate, setToDate] = useState(settingTo);
 *
 *   useEffect(() => {
 *     setFromDate(settingFrom);
 *     setToDate(settingTo);
 *   }, [settingFrom, settingTo]);
 *
 *   const handleClear = async () => {
 *     const d = await getDates();
 *     setFromDate(d.fromDate);
 *     setToDate(d.toDate);
 *   };
 */
export function useSettingReportDates(options = {}) {
  const {
    includeReturnDates = false,
    includeDueDates = false,
    includePrintDates = false
  } = options;

  const [dates, setDates] = useState(() => getCachedSettingReportDates());

  useEffect(() => {
    let alive = true;

    // Always reload from System Settings so MaxDate -> To Date stays current
    getSettingReportDates({ forceRefresh: true }).then((d) => {
      if (alive) setDates(d);
    });

    const onSettingsUpdated = () => {
      getSettingReportDates({ forceRefresh: true }).then((d) => {
        if (alive) setDates(d);
      });
    };

    window.addEventListener(REPORT_DATE_SETTINGS_EVENT, onSettingsUpdated);
    return () => {
      alive = false;
      window.removeEventListener(REPORT_DATE_SETTINGS_EVENT, onSettingsUpdated);
    };
  }, []);

  const mergeDates = useCallback(
    (base = {}, override = dates) => {
      const next = {
        ...base,
        fromDate: override.fromDate,
        toDate: override.toDate
      };

      if (includeReturnDates) {
        next.fromRtnDate = override.fromDate;
        next.toRtnDate = override.toDate;
      }

      if (includeDueDates) {
        next.fromDateDue = override.fromDate;
        next.toDateDue = override.toDate;
      }

      // MVC RFromDate / RToDate (Print Date filters) — same session Min/Max defaults
      if (includePrintDates) {
        next.rDate = override.fromDate;
        next.rToDate = override.toDate;
      }

      return next;
    },
    [dates, includeReturnDates, includeDueDates, includePrintDates]
  );

  const getDates = useCallback(async () => {
    const d = await getSettingReportDates({ forceRefresh: true });
    setDates(d);
    return d;
  }, []);

  return {
    dates,
    fromDate: dates.fromDate,
    toDate: dates.toDate,
    getDates,
    mergeDates
  };
}

export default useSettingReportDates;
