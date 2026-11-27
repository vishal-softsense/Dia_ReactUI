import { useCallback, useEffect, useMemo, useState } from "react";
import {
    CARAT_FORMAT_CACHE_KEY,
    CARAT_FORMAT_EVENT,
    PARCEL_CARAT_FORMAT_CACHE_KEY,
    SOLITAIRE_CARAT_FORMAT_CACHE_KEY,
    formatCarat as formatCaratBase,
    formatCaratOrDash as formatCaratOrDashBase,
    getCachedCaratFormat,
    getCaratDecimals,
    getCaratFormatSetting,
    getCaratPlaceholder,
    getCaratStep,
    normalizeCaratScope,
    refreshCaratFormatSetting,
    sanitizeCaratInput as sanitizeCaratInputBase,
    truncateCaratNumber as truncateCaratNumberBase,
} from "../../helpers/caratFormatDefaults";

export const useCaratFormat = (scope = "parcel") => {
    const resolvedScope = normalizeCaratScope(scope);
    const [caratFormat, setCaratFormat] = useState(() => getCachedCaratFormat(resolvedScope));
    const [solitaireCaratFormat, setSolitaireCaratFormat] = useState(() => getCachedCaratFormat("solitaire"));
    const [parcelCaratFormat, setParcelCaratFormat] = useState(() => getCachedCaratFormat("parcel"));

    useEffect(() => {
        let active = true;

        const syncFromCache = () => {
            if (!active) return;
            setCaratFormat(getCachedCaratFormat(resolvedScope));
            setSolitaireCaratFormat(getCachedCaratFormat("solitaire"));
            setParcelCaratFormat(getCachedCaratFormat("parcel"));
        };

        syncFromCache();

        getCaratFormatSetting(resolvedScope).then((resolved) => {
            if (!active) return;
            if (resolved) {
                setCaratFormat(resolved);
            }
            setSolitaireCaratFormat(getCachedCaratFormat("solitaire"));
            setParcelCaratFormat(getCachedCaratFormat("parcel"));
        });

        const handleUpdated = () => {
            syncFromCache();
        };

        const handleStorage = (event) => {
            if (!active) return;
            if (
                !event?.key ||
                event.key === CARAT_FORMAT_CACHE_KEY ||
                event.key === SOLITAIRE_CARAT_FORMAT_CACHE_KEY ||
                event.key === PARCEL_CARAT_FORMAT_CACHE_KEY
            ) {
                syncFromCache();
            }
        };

        window.addEventListener(CARAT_FORMAT_EVENT, handleUpdated);
        window.addEventListener("storage", handleStorage);

        return () => {
            active = false;
            window.removeEventListener(CARAT_FORMAT_EVENT, handleUpdated);
            window.removeEventListener("storage", handleStorage);
        };
    }, [resolvedScope]);

    const caratDecimals = useMemo(() => getCaratDecimals(caratFormat), [caratFormat]);
    const caratStep = useMemo(() => getCaratStep(caratFormat), [caratFormat]);
    const caratPlaceholder = useMemo(() => getCaratPlaceholder(caratFormat), [caratFormat]);

    const formatCarat = useCallback(
        (val, options) => formatCaratBase(val, caratFormat, options),
        [caratFormat]
    );

    const formatCaratOrDash = useCallback(
        (val, dash) => formatCaratOrDashBase(val, caratFormat, dash),
        [caratFormat]
    );

    const truncateCaratNumber = useCallback(
        (val) => truncateCaratNumberBase(val, caratFormat),
        [caratFormat]
    );

    const sanitizeCaratInput = useCallback(
        (raw, options) => sanitizeCaratInputBase(raw, caratFormat, options),
        [caratFormat]
    );

    const refreshCaratFormat = useCallback(async () => {
        const refreshed = await refreshCaratFormatSetting(resolvedScope);
        setCaratFormat(refreshed);
        setSolitaireCaratFormat(getCachedCaratFormat("solitaire"));
        setParcelCaratFormat(getCachedCaratFormat("parcel"));
        return refreshed;
    }, [resolvedScope]);

    return {
        caratFormat,
        solitaireCaratFormat,
        parcelCaratFormat,
        caratDecimals,
        caratStep,
        caratPlaceholder,
        formatCarat,
        formatCaratOrDash,
        truncateCaratNumber,
        sanitizeCaratInput,
        refreshCaratFormat,
    };
};

export default useCaratFormat;
