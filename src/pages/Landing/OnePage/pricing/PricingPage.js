import React, { useState } from "react";
import { Container } from "reactstrap";
import BillingToggle from "./BillingToggle";
import ZohoPricingCards from "./ZohoPricingCards";
import PricingComparisonTable from "./PricingComparisonTable";
import { STATIC_PRODUCT, STATIC_PLANS } from "./staticPricingData";

/**
 * Static pricing section — design only; plan data from staticPricingData.js (no DB/API).
 */
const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState("yearly");
  const product = STATIC_PRODUCT;
  const displayPlans = STATIC_PLANS;

  return (
    <>
      <section className="section bg-light pricing-page" id="pricing">
        <Container fluid className="pricing-page-container px-3 px-lg-4 px-xl-5">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pricing-page-header">
            <div>
              <h3 className="mb-0 fw-semibold">Plans for {product.productName}</h3>
            </div>
            <div className="d-flex align-items-end gap-2 flex-wrap pricing-page-toggle">
              <BillingToggle value={billingCycle} onChange={setBillingCycle} />
            </div>
          </div>

          <ZohoPricingCards
            plans={displayPlans}
            billingCycle={billingCycle}
            productName={product.productName}
          />

          <div className="mt-5 pt-2 pricing-compare-section">
            <div className="text-center mb-4">
              <h4 className="fw-semibold mb-1">Plan Comparison</h4>
              <p className="text-muted mb-0 ff-secondary">
                Simple, straightforward pricing — compare features across plans.
              </p>
            </div>
            <PricingComparisonTable
              plans={displayPlans}
              billingCycle={billingCycle}
              onBillingCycleChange={setBillingCycle}
            />
          </div>

        </Container>
      </section>
    </>
  );
};

export default PricingPage;
