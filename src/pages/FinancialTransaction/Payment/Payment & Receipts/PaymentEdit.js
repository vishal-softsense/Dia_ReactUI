import React from "react";
import { useSearchParams } from "react-router-dom";
import PaymentForm from "./PaymentForm";
import PaymentEditForm from "./PaymentEditForm";

/** JV entries use Add-page style form; IPAY/IREC use MVC EditPayment layout. */
const PaymentEdit = () => {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get("mode") || "").toLowerCase();
  if (mode === "jv") return <PaymentForm mode="edit" />;
  return <PaymentEditForm />;
};

export default PaymentEdit;
