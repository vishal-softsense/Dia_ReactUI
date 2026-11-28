import { filterSettingData, getSettingData } from "./fakebackend_helper";

export const CARAT_FORMAT_CACHE_KEY = "dia_setting_carat_format_new";
export const SOLITAIRE_CARAT_FORMAT_CACHE_KEY = "dia_setting_carat_format_solitaire";
export const PARCEL_CARAT_FORMAT_CACHE_KEY = "dia_setting_carat_format_parcel";
export const CARAT_FORMAT_EVENT = "dia:carat-format-updated";
export const DEFAULT_CARAT_FORMAT = "0.00";

export const CARAT_FORMAT_OPTIONS = [
    { value: "0.00", label: "0.00 (2 Decimals)" },
    { value: "0.000", label: "0.000 (3 Decimals)" },
];

export const normalizeCaratScope = (scope) => {
    const s = String(scope ?? "").trim().toLowerCase();
    if (s === "solitaire" || s === "single") return "solitaire";
    if (s === "default") return "default";
    return "parcel";
};

const getCacheKeyForScope = (scope) => {
    const normalized = normalizeCaratScope(scope);
    if (normalized === "solitaire") return SOLITAIRE_CARAT_FORMAT_CACHE_KEY;
    if (normalized === "default") return CARAT_FORMAT_CACHE_KEY;
    return PARCEL_CARAT_FORMAT_CACHE_KEY;
};

export const isCaratFormatSettingName = (name) => {
    const clean = String(name ?? "").trim().toLowerCase().replace(/\s+/g, "");
    return (
        clean === "caratformatnew" ||
        clean === "solitairecaratformat" ||
        clean === "parcelcaratformat"
    );
};

export const isCaratScopeKeyword = (value) => {
    const s = String(value ?? "").trim().toLowerCase();
    return s === "solitaire" || s === "single" || s === "parcel" || s === "mix" || s === "default";
};

export const normalizeCaratFormat = (val) => {
    const trimmed = String(val ?? "").trim();
    if (trimmed === "0.000" || trimmed === "3" || trimmed === "3.0" || trimmed === "3.00" || trimmed === "3.000") {
        return "0.000";
    }
    if (trimmed === "0.00" || trimmed === "2" || trimmed === "2.0" || trimmed === "2.00") {
        return "0.00";
    }
    return DEFAULT_CARAT_FORMAT;
};

export const getCaratDecimals = (formatOrScope) => {
    if (isCaratScopeKeyword(formatOrScope)) {
        return normalizeCaratFormat(getCachedCaratFormat(formatOrScope)) === "0.000" ? 3 : 2;
    }
    const resolved = formatOrScope !== undefined && formatOrScope !== null && String(formatOrScope).trim() !== ""
        ? formatOrScope
        : getCachedCaratFormat();
    return normalizeCaratFormat(resolved) === "0.000" ? 3 : 2;
};

export const getCaratStep = (formatOrScope) => (getCaratDecimals(formatOrScope) === 3 ? "0.001" : "0.01");

export const getCaratPlaceholder = (formatOrScope) => {
    if (isCaratScopeKeyword(formatOrScope)) {
        return normalizeCaratFormat(getCachedCaratFormat(formatOrScope));
    }
    return normalizeCaratFormat(formatOrScope ?? getCachedCaratFormat());
};

const getSettingRows = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.Data)) return res.Data;
    return [];
};

const pickSettingValue = (rows, targetName) => {
    const row = rows.find(
        (item) => String(item?.Name ?? item?.name ?? "").trim().toLowerCase() === targetName.toLowerCase()
    );
    return row?.Value ?? row?.value ?? null;
};

export const getCachedCaratFormat = (scope = "parcel") => {
    const normalizedScope = normalizeCaratScope(scope);
    try {
        if (normalizedScope === "solitaire") {
            const sol = localStorage.getItem(SOLITAIRE_CARAT_FORMAT_CACHE_KEY);
            if (sol) return normalizeCaratFormat(sol);
        } else if (normalizedScope === "parcel") {
            const par = localStorage.getItem(PARCEL_CARAT_FORMAT_CACHE_KEY);
            if (par) return normalizeCaratFormat(par);
        }
        const raw = localStorage.getItem(CARAT_FORMAT_CACHE_KEY);
        if (!raw) return DEFAULT_CARAT_FORMAT;
        return normalizeCaratFormat(raw);
    } catch {
        return DEFAULT_CARAT_FORMAT;
    }
};

export const setCachedCaratFormat = (caratFormat, { scope = "default", dispatchEvent = true } = {}) => {
    const normalized = normalizeCaratFormat(caratFormat);
    const cacheKey = getCacheKeyForScope(scope);
    try {
        localStorage.setItem(cacheKey, normalized);
    } catch {
        // Ignore storage write errors
    }

    if (dispatchEvent && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(CARAT_FORMAT_EVENT, {
            detail: {
                solitaire: getCachedCaratFormat("solitaire"),
                parcel: getCachedCaratFormat("parcel"),
                defaultFormat: getCachedCaratFormat("default"),
            },
        }));
    }

    return normalized;
};

export const setCachedCaratFormats = ({ solitaire, parcel, defaultFormat } = {}, { dispatchEvent = true } = {}) => {
    try {
        if (defaultFormat) {
            localStorage.setItem(CARAT_FORMAT_CACHE_KEY, normalizeCaratFormat(defaultFormat));
        }
        if (solitaire) {
            localStorage.setItem(SOLITAIRE_CARAT_FORMAT_CACHE_KEY, normalizeCaratFormat(solitaire));
        }
        if (parcel) {
            localStorage.setItem(PARCEL_CARAT_FORMAT_CACHE_KEY, normalizeCaratFormat(parcel));
        }
    } catch {
        // Ignore storage write errors
    }

    if (dispatchEvent && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(CARAT_FORMAT_EVENT, {
            detail: {
                solitaire: getCachedCaratFormat("solitaire"),
                parcel: getCachedCaratFormat("parcel"),
                defaultFormat: getCachedCaratFormat("default"),
            },
        }));
    }
};

export const clearCachedCaratFormat = ({ dispatchEvent = false } = {}) => {
    try {
        localStorage.removeItem(CARAT_FORMAT_CACHE_KEY);
        localStorage.removeItem(SOLITAIRE_CARAT_FORMAT_CACHE_KEY);
        localStorage.removeItem(PARCEL_CARAT_FORMAT_CACHE_KEY);
    } catch {
        // Ignore storage remove errors
    }

    if (dispatchEvent && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(CARAT_FORMAT_EVENT, {
            detail: {
                solitaire: DEFAULT_CARAT_FORMAT,
                parcel: DEFAULT_CARAT_FORMAT,
                defaultFormat: DEFAULT_CARAT_FORMAT,
            },
        }));
    }
};

let inFlightPromise = null;

export const getCaratFormatSetting = async (scopeOrOptions = "parcel", maybeOptions = {}) => {
    const scope = typeof scopeOrOptions === "string" ? scopeOrOptions : "parcel";
    const { forceRefresh = false } = (typeof scopeOrOptions === "object" && scopeOrOptions !== null)
        ? scopeOrOptions
        : (maybeOptions || {});

    const cacheKey = getCacheKeyForScope(scope);
    if (!forceRefresh) {
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                return normalizeCaratFormat(cached);
            }
        } catch {
            // Fall through to API fetch
        }
    }

    if (!inFlightPromise || forceRefresh) {
        inFlightPromise = (async () => {
            try {
                let rows = [];
                try {
                    const res = await filterSettingData("DEFAULT STOCK SETTING");
                    rows = getSettingRows(res);
                } catch {
                    // Fallback to full list below
                }

                if (rows.length === 0) {
                    const allRes = await getSettingData();
                    rows = getSettingRows(allRes);
                }

                const legacyFallback =
                    pickSettingValue(rows, "CaratFormatNew") ??
                    pickSettingValue(rows, "CaratFormat");

                const rawSolitaire = pickSettingValue(rows, "SolitaireCaratFormat") ?? legacyFallback;
                const rawParcel = pickSettingValue(rows, "ParcelCaratFormat") ?? legacyFallback;
                const rawDefault = legacyFallback ?? rawParcel ?? rawSolitaire;

                setCachedCaratFormats({
                    defaultFormat: rawDefault || DEFAULT_CARAT_FORMAT,
                    solitaire: rawSolitaire || DEFAULT_CARAT_FORMAT,
                    parcel: rawParcel || DEFAULT_CARAT_FORMAT,
                });
            } catch {
                // Keep cached or default value if API fails
            } finally {
                inFlightPromise = null;
            }
        })();
    }

    await inFlightPromise;
    return getCachedCaratFormat(scope);
};

export const refreshCaratFormatSetting = (scope = "parcel") =>
    getCaratFormatSetting(scope, { forceRefresh: true });

/**
 * Resolve carat format argument: accepts format string ("0.00"|"0.000") or decimal count (2|3).
 */
const resolveDecimals = (formatOrDecimals) => {
    if (typeof formatOrDecimals === "number" && Number.isFinite(formatOrDecimals)) {
        return formatOrDecimals >= 3 ? 3 : 2;
    }
    if (isCaratScopeKeyword(formatOrDecimals)) {
        return getCaratDecimals(getCachedCaratFormat(formatOrDecimals));
    }
    return getCaratDecimals(formatOrDecimals);
};

/**
 * Convert numeric or string input into an exact decimal string truncated (NEVER rounded)
 * to 2 or 3 decimal places, immune to IEEE-754 float drift (e.g. 1.14 -> 1.13).
 */
export const formatCarat = (val, formatOrDecimals, { blankOnEmpty = false } = {}) => {
    const decimals = resolveDecimals(formatOrDecimals);
    const zeroStr = decimals === 3 ? "0.000" : "0.00";

    if (val === null || val === undefined || val === "") {
        return blankOnEmpty ? "" : zeroStr;
    }

    let strVal = "";
    if (typeof val === "number") {
        if (!Number.isFinite(val)) return blankOnEmpty ? "" : zeroStr;
        if (val === 0) return zeroStr;
        // Normalize binary float noise (e.g. 1.1399999999999999 -> 1.14) without rounding 2nd/3rd decimal
        const cleanNum = Number(val.toPrecision(12));
        if (!Number.isFinite(cleanNum)) return blankOnEmpty ? "" : zeroStr;
        strVal = Math.abs(cleanNum) < 1e12 ? cleanNum.toFixed(10) : String(cleanNum);
    } else {
        const trimmed = String(val).trim().replace(/,/g, "");
        if (trimmed === "" || trimmed === "-") return blankOnEmpty ? "" : zeroStr;

        // If string is plain decimal with <= 9 fractional digits, slice directly without float conversion
        const plainMatch = trimmed.match(/^(-?)(\d*)(?:\.(\d*))?$/);
        if (plainMatch && (plainMatch[3] || "").length <= 9) {
            const sign = plainMatch[1];
            const intPart = plainMatch[2] || "0";
            const fracPart = (plainMatch[3] || "").slice(0, decimals).padEnd(decimals, "0");
            const combined = `${intPart}.${fracPart}`;
            const isAllZero = /^0\.0+$/.test(combined);
            return isAllZero ? combined : `${sign}${combined}`;
        }

        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed)) return blankOnEmpty ? "" : zeroStr;
        if (parsed === 0) return zeroStr;
        const cleanNum = Number(parsed.toPrecision(12));
        strVal = Math.abs(cleanNum) < 1e12 ? cleanNum.toFixed(10) : String(cleanNum);
    }

    const neg = strVal.startsWith("-");
    const unsigned = neg ? strVal.slice(1) : strVal;
    const dotIdx = unsigned.indexOf(".");
    let intPart = dotIdx === -1 ? unsigned : unsigned.slice(0, dotIdx);
    let fracPart = dotIdx === -1 ? "" : unsigned.slice(dotIdx + 1);
    if (!intPart) intPart = "0";
    fracPart = fracPart.slice(0, decimals).padEnd(decimals, "0");

    const combined = `${intPart}.${fracPart}`;
    const isAllZero = /^0\.0+$/.test(combined);
    return isAllZero ? combined : `${neg ? "-" : ""}${combined}`;
};

export const truncateCaratNumber = (val, formatOrDecimals) => {
    const formatted = formatCarat(val, formatOrDecimals);
    const num = Number(formatted);
    return Number.isFinite(num) ? num : 0;
};

/**
 * Option A input guard: prevents typing beyond 2 or 3 decimal places without rounding.
 */
export const sanitizeCaratInput = (raw, formatOrDecimals, { allowNegative = false } = {}) => {
    if (raw === null || raw === undefined) return "";
    const decimals = resolveDecimals(formatOrDecimals);

    let str = String(raw).replace(/,/g, "");
    const hasNeg = allowNegative && str.startsWith("-");
    str = str.replace(/-/g, "").replace(/[^0-9.]/g, "");

    const firstDot = str.indexOf(".");
    if (firstDot !== -1) {
        const beforeDot = str.slice(0, firstDot);
        const afterDot = str.slice(firstDot + 1).replace(/\./g, "").slice(0, decimals);
        str = `${beforeDot}.${afterDot}`;
    }

    return hasNeg ? `-${str}` : str;
};

export const formatCaratOrDash = (val, formatOrDecimals, dash = "-") => {
    if (val === null || val === undefined || val === "") return dash;
    const res = formatCarat(val, formatOrDecimals, { blankOnEmpty: true });
    return res === "" ? dash : res;
};
