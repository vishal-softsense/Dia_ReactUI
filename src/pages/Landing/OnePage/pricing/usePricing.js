import { useEffect, useRef, useState } from "react";
import { getProductPricing } from "./pricingService";

/**
 * Same as SoftOnCloud usePricing — loads fn_get_pricing_plans via API.
 * Keeps previous plans visible while billing cycle refreshes.
 */
const usePricing = (productId, billingCycle = "yearly") => {
  const [plans, setPlans] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(Boolean(productId));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const previousProductIdRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    if (!productId) {
      previousProductIdRef.current = null;
      setPlans([]);
      setProduct(null);
      setLoading(false);
      setRefreshing(false);
      return undefined;
    }

    const isProductChange = previousProductIdRef.current !== productId;
    const hasExistingPlans = previousProductIdRef.current === productId;

    const load = async () => {
      if (isProductChange || !hasExistingPlans) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      try {
        const response = await getProductPricing(productId, billingCycle);
        if (mounted) {
          previousProductIdRef.current = productId;
          setProduct(response?.product || null);
          setPlans(Array.isArray(response?.pricing) ? response.pricing : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err?.message || err || "Failed to load pricing plans");
          if (isProductChange) {
            setPlans([]);
            setProduct(null);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [productId, billingCycle]);

  return { plans, product, loading, refreshing, error };
};

export default usePricing;
