import { APIClient } from "../../../../helpers/api_helper";

const api = new APIClient();

/**
 * Same as SoftOnCloud: product-scoped pricing from fn_get_pricing_plans.
 * GET /api/pricing/plans?productId=&billingCycle=
 */
export const getProductPricing = (productId, billingCycle = "yearly") => {
  return api.get("/api/pricing/plans", { productId, billingCycle });
};

/**
 * Same as SoftOnCloud: GET /api/products/{slug}?billingCycle=
 */
export const getProductDetails = (slug, billingCycle = "yearly") => {
  return api.get(`/api/products/${slug}`, { billingCycle });
};

export default getProductPricing;
