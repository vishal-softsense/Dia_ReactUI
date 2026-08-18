import { useEffect, useRef, useState } from "react";
import { getProductDetails } from "./pricingService";

/**
 * Same as SoftOnCloud useProductDetails — loads fn_get_product_details via API.
 */
export const useProductDetails = (slug, billingCycle = "yearly") => {
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState(null);
  const previousSlugRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    if (!slug) {
      previousSlugRef.current = null;
      setProduct(null);
      setRelatedProducts([]);
      setLoading(false);
      return undefined;
    }

    const isSlugChange = previousSlugRef.current !== slug;

    const load = async () => {
      if (isSlugChange) {
        setLoading(true);
      }
      setError(null);
      try {
        const response = await getProductDetails(slug, billingCycle);
        if (mounted) {
          previousSlugRef.current = slug;
          setProduct(response?.product || null);
          setRelatedProducts(response?.relatedProducts || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err?.message || err || "Failed to load product");
          if (isSlugChange) {
            setProduct(null);
            setRelatedProducts([]);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [slug, billingCycle]);

  return { product, relatedProducts, loading, error };
};

export default useProductDetails;
