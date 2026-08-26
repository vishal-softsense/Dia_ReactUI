import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GROUP_ORDER, IMPLEMENTATION_GROUP } from "./staticPricingData";

const GROUP_ICONS = {
  General: "ri-settings-3-line",
  Parcel: "ri-archive-line",
  Solitaire: "ri-copper-diamond-line",
  Accounts: "ri-wallet-3-line",
  Jewellery: "ri-vip-diamond-line",
  Additional: "ri-add-box-line",
  [IMPLEMENTATION_GROUP]: "ri-tools-line",
};

const PLAN_ICONS = {
  "solitaire-synch": "ri-links-line",
  "parcel-accounts": "ri-archive-line",
  "solitaire-inventory": "ri-copper-diamond-line",
  "inventory-accounts": "ri-stack-line",
  "jewellery": "ri-vip-diamond-line",
};

const formatPrice = (amount, currency = "INR") => {
  if (amount == null) return "—";
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

const getDisplayPrice = (plan, billingCycle) => {
  if (plan.isCustomPricing || plan.isContactSales) return "Custom";
  const price =
    billingCycle === "monthly"
      ? plan.monthlyPrice ?? plan.currentPrice
      : plan.yearlyPrice ?? plan.currentPrice;
  if (plan.isIncludedFree || price === 0) return "₹0";
  return formatPrice(price, plan.currency);
};

const getFeatureKey = (feature) => {
  if (feature.productFeatureId != null && feature.productFeatureId > 0) {
    return `id:${feature.productFeatureId}`;
  }
  const text = (feature.featureText || "").trim().toLowerCase();
  const group = (feature.featureGroup || "Plan features").trim().toLowerCase();
  return `text:${group}::${text}`;
};

const PricingComparisonTable = ({
  plans = [],
  billingCycle = "yearly",
  onBillingCycleChange,
}) => {
  const [expandAll, setExpandAll] = useState(true);
  const [hideCommon, setHideCommon] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const groupNames = useMemo(() => {
    const featureMap = new Map();

    (plans || []).forEach((plan) => {
      const planKey = plan.planProductId || plan.planId;
      (plan.features || []).forEach((feature) => {
        const text = (feature.featureText || "").trim();
        if (!text) return;

        const group = feature.featureGroup || "Plan features";
        const key = getFeatureKey(feature);
        const label = (feature.comparisonLabel || text).trim();
        const cellValue =
          feature.cellValue != null && feature.cellValue !== ""
            ? feature.cellValue
            : true;

        if (!featureMap.has(key)) {
          featureMap.set(key, {
            key,
            group,
            text: label,
            sortOrder: feature.sortOrder ?? 9999,
            byPlan: {},
          });
        }

        featureMap.get(key).byPlan[planKey] = cellValue;
      });
    });

    const grouped = {};
    Array.from(featureMap.values())
      .sort(
        (a, b) =>
          (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) ||
          a.text.localeCompare(b.text)
      )
      .forEach((row) => {
        if (!grouped[row.group]) grouped[row.group] = [];
        grouped[row.group].push(row);
      });

    const ordered = GROUP_ORDER.filter((name) => grouped[name]?.length).map(
      (name) => ({
        name,
        rows: grouped[name],
      })
    );

    Object.keys(grouped).forEach((name) => {
      if (!GROUP_ORDER.includes(name)) {
        ordered.push({ name, rows: grouped[name] });
      }
    });

    const implementationRows = (plans || [])
      .map((plan) => {
        const amount = plan.implementationCost;
        if (amount == null) return null;
        return {
          planKey: plan.planProductId || plan.planId,
          value: formatPrice(amount, plan.currency),
        };
      })
      .filter(Boolean);

    if (implementationRows.length) {
      const withoutImpl = ordered.filter(
        (group) => group.name !== IMPLEMENTATION_GROUP
      );
      withoutImpl.push({
        name: IMPLEMENTATION_GROUP,
        hideCommonExempt: true,
        rows: [
          {
            key: "implementation-cost",
            group: IMPLEMENTATION_GROUP,
            text: IMPLEMENTATION_GROUP,
            sortOrder: 99999,
            isPriceRow: true,
            byPlan: implementationRows.reduce((acc, row) => {
              acc[row.planKey] = row.value;
              return acc;
            }, {}),
          },
        ],
      });
      return withoutImpl;
    }

    return ordered;
  }, [plans]);

  if (!plans.length) {
    return null;
  }

  const planKeyOf = (plan) => plan.planProductId || plan.planId;
  const allGroupNames = groupNames.map((group) => group.name);

  const isGroupExpanded = (group) => {
    if (expandAll) return true;
    return !collapsedGroups[group];
  };

  const toggleGroup = (group) => {
    if (expandAll) {
      const next = {};
      allGroupNames.forEach((name) => {
        next[name] = name === group;
      });
      setExpandAll(false);
      setCollapsedGroups(next);
      return;
    }

    setCollapsedGroups((prev) => {
      const next = { ...prev, [group]: !prev[group] };
      const allExpanded = allGroupNames.every((name) => !next[name]);
      if (allExpanded) {
        setExpandAll(true);
        return {};
      }
      return next;
    });
  };

  const handleExpandAllChange = (checked) => {
    setExpandAll(checked);
    if (checked) {
      setCollapsedGroups({});
      return;
    }

    const next = {};
    allGroupNames.forEach((name) => {
      next[name] = true;
    });
    setCollapsedGroups(next);
  };

  const isCommonFeature = (row) =>
    plans.every((plan) => row.byPlan[planKeyOf(plan)]);

  const isYearly = billingCycle === "yearly";

  return (
    <div className="pricing-compare">
      <div className="pricing-compare__controls d-flex flex-wrap align-items-center gap-3 mb-3">
        <label className="pricing-compare__check mb-0">
          <input
            type="checkbox"
            checked={expandAll}
            onChange={(e) => handleExpandAllChange(e.target.checked)}
          />
          Expand all
        </label>
        <label className="pricing-compare__check mb-0">
          <input
            type="checkbox"
            checked={hideCommon}
            onChange={(e) => setHideCommon(e.target.checked)}
          />
          Hide Common Features
        </label>
      </div>

      <div className="pricing-compare__scroll">
        <table className="pricing-compare__table">
          <thead>
            <tr>
              <th className="pricing-compare__feature-col">
                <div className="pricing-compare__all-plans">All Plans</div>
                {typeof onBillingCycleChange === "function" && (
                  <div className="pricing-compare__cycle">
                    <button
                      type="button"
                      className={
                        "pricing-compare__cycle-btn" + (!isYearly ? " is-active" : "")
                      }
                      onClick={() => onBillingCycleChange("monthly")}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      className={
                        "pricing-compare__cycle-btn" + (isYearly ? " is-active" : "")
                      }
                      onClick={() => onBillingCycleChange("yearly")}
                    >
                      Yearly
                    </button>
                  </div>
                )}
                <div className="text-muted fs-12">
                  {isYearly
                    ? "Price/Org/Year Billed Annually"
                    : "Price/Org/Month Billed Monthly"}
                </div>
              </th>
              {plans.map((plan) => (
                <th
                  key={planKeyOf(plan)}
                  className={
                    "pricing-compare__plan-col" +
                    (plan.isPopular ? " is-popular" : "")
                  }
                >
                  <div className="pricing-compare__plan-name">
                    {PLAN_ICONS[plan.planCode] && (
                      <i
                        className={
                          PLAN_ICONS[plan.planCode] + " pricing-compare__plan-icon"
                        }
                        aria-hidden="true"
                      ></i>
                    )}
                    <span>{plan.planName}</span>
                  </div>
                  <Link
                    to={plan.isContactSales || plan.isCustomPricing ? "/#contact" : "/register"}
                    className="btn btn-sm btn-outline-dark pricing-compare__signup"
                  >
                    {plan.ctaLabel || "Sign Up Now"}
                  </Link>
                  <div className="pricing-compare__plan-price">
                    {getDisplayPrice(plan, billingCycle)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupNames.map(({ name: groupName, rows, hideCommonExempt }) => {
              const filtered =
                hideCommon && !hideCommonExempt
                  ? rows.filter((row) => !isCommonFeature(row))
                  : rows;
              if (!filtered.length) return null;
              const expanded = isGroupExpanded(groupName);

              return (
                <React.Fragment key={groupName}>
                  <tr className="pricing-compare__group-row">
                    <td colSpan={plans.length + 1}>
                      <button
                        type="button"
                        className="pricing-compare__group-toggle"
                        onClick={() => toggleGroup(groupName)}
                      >
                        <i
                          className={
                            expanded ? "ri-subtract-line" : "ri-add-line"
                          }
                          aria-hidden="true"
                        ></i>
                        {GROUP_ICONS[groupName] && (
                          <i
                            className={
                              GROUP_ICONS[groupName] +
                              " pricing-compare__group-icon"
                            }
                            aria-hidden="true"
                          ></i>
                        )}
                        <span>{groupName}</span>
                      </button>
                    </td>
                  </tr>
                  {expanded &&
                    filtered.map((row) => (
                      <tr key={row.key}>
                        <td>{row.text}</td>
                        {plans.map((plan) => {
                          const value = row.byPlan[planKeyOf(plan)];
                          return (
                            <td key={planKeyOf(plan)} className="text-center">
                              {value == null || value === false ? (
                                <i className="ri-close-line pricing-compare__no"></i>
                              ) : value === true ? (
                                <i className="ri-checkbox-circle-fill pricing-compare__yes"></i>
                              ) : (
                                <span
                                  className={
                                    row.isPriceRow
                                      ? "pricing-compare__plan-price"
                                      : "pricing-compare__cell-text"
                                  }
                                >
                                  {value}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PricingComparisonTable;
