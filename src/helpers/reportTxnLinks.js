/** MVC Ledger.js / outstanding-report.js / bro-adat-report.js transaction view routes */
export const VTYPE_URL_MAP = {
  PPUR: "/purchaseparcel/edit-purchaseparcel",
  PUR: "/purchase/edit-purchase",
  SALE: "/sale/edit-sale",
  PSALE: "/saleParcel/edit-saleParcel",
  CPUR: "/mix-purchase/edit-mixpur",
  CSALE: "/mix/edit-mixdata",
  PJEW: "/jewpurchase/edit-jew-purchase",
  SJEW: "/jewsale/edit-jew-sale",
  PPurRtn: "/PurchaseParcelReturn/edit-ppurchasertnview",
  PSaleRtn: "/SaleReturnPartial/edit-salereturnParcel",
  PurRtn: "/purchasereturn/edit-purchasereturn",
  SaleRtn: "/salereturn/edit-salereturn",
  CPurrtn: "/MixPurchaseReturn/edit-mixpurchasertndata",
  CSaleRtn: "/MixSaleReturn/edit-mixsalereturnParcel",
  SJEWRtn: "/jewsalertn/edit-jew-salereturn",
  MJEW: "/jewMemo/edit-jew-Memo"
};

/** MVC OutstandingReport.cshtml #TrnType dropdown values */
export const PRODUCT_TYPE_TO_TRN_TYPE = {
  Parcel: "PSale,PPur",
  General: "CSale,CPur",
  Solitaries: "PurRtn,Sale,Pur,SaleRtn",
  Jewellery: "SJEW,PJEW"
};

const OUTSTANDING_PAYABLE_TYPES = new Set(["PPUR", "PUR", "SALERTN", "PJEW", "CPUR"]);
const OUTSTANDING_RECEIVABLE_TYPES = new Set(["SALE", "PSALE", "PURRTN", "SJEW", "CSALE"]);
const BROADAT_TXN_TYPES = new Set(["PPUR", "PUR", "SALE", "PSALE", "CPUR", "CSALE"]);

export const productTypeToTrnType = (productType) => {
  if (!productType) return null;
  return PRODUCT_TYPE_TO_TRN_TYPE[productType] || null;
};

export const resolveVTypePath = (vtype) => {
  if (!vtype) return null;
  const text = String(vtype).trim();
  if (VTYPE_URL_MAP[text]) return VTYPE_URL_MAP[text];
  const key = Object.keys(VTYPE_URL_MAP).find((k) => k.toLowerCase() === text.toLowerCase());
  return key ? VTYPE_URL_MAP[key] : null;
};

/** Open transaction in view mode (React routes, MVC query: Id + Mode=view). */
export const openReportTxnView = (id, vtype) => {
  if (id === null || id === undefined || id === "") return;
  const path = resolveVTypePath(vtype);
  if (!path) return;
  window.open(`${path}?Id=${encodeURIComponent(id)}&Mode=view`, "_blank")?.focus();
};

/** MVC outstanding-report.js setlink — payable vs receivable type gate. */
export const openOutstandingTxnLink = (code, trnType, payable) => {
  const typeUpper = String(trnType || "").toUpperCase();
  const allowed = payable ? OUTSTANDING_PAYABLE_TYPES : OUTSTANDING_RECEIVABLE_TYPES;
  if (!allowed.has(typeUpper)) return;
  openReportTxnView(code, trnType);
};

/** MVC bro-adat-report.js setlink — brokerage / commission outstanding. */
export const openBroAdatTxnLink = (code, trnType) => {
  const typeUpper = String(trnType || "").toUpperCase();
  if (!BROADAT_TXN_TYPES.has(typeUpper)) return;
  openReportTxnView(code, trnType);
};
