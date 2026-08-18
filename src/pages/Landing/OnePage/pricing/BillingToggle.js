import React from "react";

const BillingToggle = ({
  value = "yearly",
  onChange,
  className = "",
  savingsPercent = 15,
}) => {
  const isYearly = value === "yearly";

  return (
    <div className={"billing-toggle-group " + className}>
      <div className="billing-toggle">
        <button
          type="button"
          className={"billing-toggle__option " + (!isYearly ? "active" : "")}
          onClick={() => onChange && onChange("monthly")}
        >
          Billed Monthly
        </button>
        <button
          type="button"
          className={"billing-toggle__option " + (isYearly ? "active" : "")}
          onClick={() => onChange && onChange("yearly")}
        >
          Billed Yearly
        </button>
      </div>

      <div className="billing-toggle-hint">
        <svg
          className="billing-toggle-hint__arrow"
          viewBox="0 0 48 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M40 34C34 22 22 10 8 8"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <path
            d="M16.5 4.2L6.5 7.5L14.2 15.2"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="billing-toggle-hint__text">
          <span className="billing-toggle-hint__save">Save </span>
          <strong className="billing-toggle-hint__percent">{savingsPercent}%</strong>
          <span className="billing-toggle-hint__suffix"> on yearly billing</span>
        </p>
      </div>
    </div>
  );
};

export default BillingToggle;
