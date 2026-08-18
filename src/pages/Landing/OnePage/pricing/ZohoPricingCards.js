import React, { useState } from "react";
import { Link } from "react-router-dom";

const formatPrice = (amount, currency = "INR") => {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency === "₹" ? "INR" : currency || "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `₹${amount}`;
  }
};

const getPlanPrice = (plan, billingCycle) =>
  billingCycle === "monthly"
    ? plan.monthlyPrice ?? plan.currentPrice
    : plan.yearlyPrice ?? plan.currentPrice;

const featureIdentity = (feature) =>
  `text:${(feature.featureText || "").trim().toLowerCase()}`;

/**
 * Zoho-style plan cards.
 * Each card lists only the features mapped to that plan.
 */
const ZohoPricingCards = ({
  plans = [],
  billingCycle = "yearly",
  productName = "DiaJew",
}) => {
  const [expanded, setExpanded] = useState({});

  const displayPlans = plans || [];

  if (!displayPlans.length) {
    return null;
  }

  return (
    <div className="zoho-pricing">
      <div className="zoho-pricing__grid">
        {displayPlans.map((plan, idx) => {
          const isPopular = plan.isPopular;
          const isCustom = plan.isCustomPricing || plan.isContactSales;
          const price = getPlanPrice(plan, billingCycle);
          const features = (plan.features || []).filter(
            (f) => f.productFeatureId !== 0
          );
          const planKey = plan.planProductId || plan.planId;
          const isExpanded = expanded[planKey];
          const visibleFeatures = isExpanded ? features : features.slice(0, 8);
          const ctaLabel =
            plan.ctaLabel || (isCustom ? "Contact Sales" : "Start my free trial");
          const periodText =
            billingCycle === "monthly"
              ? "Price/Org/Month Billed Monthly"
              : "Price/Org/Year Billed Annually";

          return (
            <div
              key={planKey}
              className={
                "zoho-pricing__card" + (isPopular ? " zoho-pricing__card--popular" : "")
              }
            >
              {isPopular && <div className="zoho-pricing__badge">Most Popular</div>}

              <div className="zoho-pricing__card-top">
                <h3 className="zoho-pricing__name">{plan.planName}</h3>
                <p className="zoho-pricing__tagline">
                  {plan.tagline ||
                    plan.description ||
                    plan.recommendedFor ||
                    `Best for growing teams using ${productName}.`}
                </p>

                <div className="zoho-pricing__price-block">
                  {isCustom ? (
                    <div className="zoho-pricing__price">Custom</div>
                  ) : plan.isIncludedFree || price === 0 ? (
                    <div className="zoho-pricing__price">₹0</div>
                  ) : (
                    <div className="zoho-pricing__price">
                      {formatPrice(price, plan.currency)}
                    </div>
                  )}
                  {!isCustom && <div className="zoho-pricing__period">{periodText}</div>}
                </div>

                <Link
                  to={isCustom ? "/#contact" : "/register"}
                  className={
                    "btn w-100 zoho-pricing__cta" +
                    (isPopular ? " zoho-pricing__cta--primary" : "")
                  }
                >
                  {ctaLabel}
                </Link>
              </div>

              <div className="zoho-pricing__card-body">
                <div className="zoho-pricing__divider"></div>

                <p className="zoho-pricing__includes">
                  Plan includes
                </p>

                <ul className="zoho-pricing__features list-unstyled mb-0">
                  {plan.maxUsers != null && (
                    <li>
                      <i className="ri-check-line"></i>
                      <span>
                        {plan.isUnlimited ? "Unlimited users" : `${plan.maxUsers} Users`}
                      </span>
                    </li>
                  )}
                  {plan.usersLabel && (
                    <li>
                      <i className="ri-check-line"></i>
                      <span>{plan.usersLabel}</span>
                    </li>
                  )}
                  {visibleFeatures.map((feature) => (
                    <li key={featureIdentity(feature)}>
                      <i className="ri-check-line"></i>
                      <span>
                        {feature.featureText}
                        {feature.isHighlighted && (
                          <span className="zoho-pricing__new">NEW</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {features.length > 8 && (
                  <button
                    type="button"
                    className="btn btn-link zoho-pricing__more px-0"
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [planKey]: !prev[planKey],
                      }))
                    }
                  >
                    {isExpanded ? "Show less" : "and a lot more"}
                  </button>
                )}
              </div>

              <div className="zoho-pricing__footer">
                <div>Email Support</div>
              </div>
            </div>
          );
        })}

        <aside className="zoho-pricing__aside">
          <div className="zoho-pricing__aside-head">
            <h4 className="mb-2">{productName}</h4>
            <p className="mb-3">
              Diamond and jewellery ERP — inventory, accounts, and platform sync on one cloud platform.
            </p>
            <Link to="/register" className="btn btn-outline-dark btn-sm w-100">
              Explore all modules
            </Link>
          </div>
          <div className="zoho-pricing__aside-body">
            <h6 className="fw-semibold mb-3">Modules include:</h6>
            <ul className="list-unstyled mb-0 zoho-pricing__aside-list">
              {[
                { icon: "ri-copper-diamond-line", label: "Solitaire inventory" },
                { icon: "ri-archive-line", label: "Parcel management" },
                { icon: "ri-wallet-3-line", label: "Accounts & ledger" },
                { icon: "ri-vip-diamond-line", label: "Jewellery ERP" },
                { icon: "ri-links-line", label: "Platform integration" },
                { icon: "ri-bar-chart-box-line", label: "Reporting and analytics" },
              ].map((item) => (
                <li key={item.label}>
                  <i className={item.icon} aria-hidden="true"></i>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ZohoPricingCards;
