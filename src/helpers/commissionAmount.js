/**
 * MVC #CommissionAmount.change → reverse-calc Commission % (AdatPer).
 * Source: purchase-form-new.js / sale-form-new.js / MixPurchase.js / etc.
 * Does NOT run FinalSum; only updates %. Amount is recalculated from % elsewhere.
 */
export function calcCommissionPerFromAmount({
  enteredComAmount,
  netAmount,
  baseRate,
  mOp
}) {
  const entered = Number(enteredComAmount) || 0;
  const net = Number(netAmount) || 0;
  const rate = Number(baseRate) || 0;

  if (entered > 0 && net > 0 && rate > 0) {
    const comAmount = mOp === "/" ? entered * rate : entered / rate;
    const comPer = (comAmount / net) * 100;
    return Number(comPer.toFixed(2));
  }
  return 0;
}

/** MVC FinalSum display for CommissionAmount: .toFixed(2) vs Math.round */
export function formatCommissionDisplay(comDisplay, useIntegerRound = false) {
  const n = Number(comDisplay) || 0;
  if (useIntegerRound) return Math.round(n);
  return Math.round(n * 100) / 100;
}
