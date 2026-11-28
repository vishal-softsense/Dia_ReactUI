import { useCallback, useRef } from "react";
import { getAccGrpMasterDetail } from "./fakebackend_helper";

/**
 * Add days to a YYYY-MM-DD (or parseable) date string in UTC to avoid
 * local timezone shifts around midnight.
 */
export const computeDueDateIso = (trnDate, dueDays) => {
  if (!trnDate) return "";
  const days = Math.trunc(Number(dueDays) || 0);
  const str = String(trnDate).trim();
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(Date.UTC(year, month, day + days));
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
};

export const extractPartyDueDays = (detail) => {
  if (!detail || typeof detail !== "object") return null;
  const raw = detail.dueDays ?? detail.DueDays;
  if (raw === undefined || raw === null || raw === "") return null;
  const num = Number(raw);
  return Number.isFinite(num) ? Math.trunc(num) : null;
};

export const fetchPartyDueDays = async (partyId) => {
  const numericId = Number(partyId);
  if (!Number.isFinite(numericId) || numericId <= 0) return null;
  const res = await getAccGrpMasterDetail(numericId);
  const detail = res?.Data ?? res?.data ?? res;
  if (!(res?.Success ?? res?.success ?? detail)) return null;
  return extractPartyDueDays(detail);
};

/**
 * Returns a Party react-select onChange handler that updates selected party and
 * dynamically syncs dueDays and dueDate from AccGrpMaster.
 */
export const usePartyDueDays = ({ setParty, setState, dateKey = "trnDate", readOnly = false }) => {
  const requestRef = useRef(0);

  return useCallback(
    async (selectedOption) => {
      setParty(selectedOption);
      if (readOnly) return;

      const applyDueDays = (days) => {
        if (!setState) return;
        setState((prev) => {
          const nextDueDate = computeDueDateIso(prev?.[dateKey], days);
          return {
            ...prev,
            dueDays: days,
            dueDate: nextDueDate || prev.dueDate
          };
        });
      };

      const requestId = ++requestRef.current;
      const partyId = selectedOption?.value;
      if (!partyId) {
        applyDueDays(0);
        return;
      }

      const inlineDueDays = extractPartyDueDays(selectedOption);
      if (inlineDueDays !== null) {
        applyDueDays(inlineDueDays);
        return;
      }

      try {
        const dueDays = await fetchPartyDueDays(partyId);
        if (requestId !== requestRef.current) return;
        if (dueDays !== null) {
          applyDueDays(dueDays);
        }
      } catch {
        // Keep current dueDays on transient lookup error
      }
    },
    [setParty, setState, dateKey, readOnly]
  );
};
