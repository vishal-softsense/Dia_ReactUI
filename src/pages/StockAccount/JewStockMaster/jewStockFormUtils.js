/** Shared helpers — parity with MVC JewDesign.js */

/** MVC AddStockMaster.cshtml #Making-Type — fixed options, not SettingMaster. */
export const MAKING_TYPE_OPTIONS = [
  { value: "Per Gm", label: "Per Gm" },
  { value: "Per Pcs", label: "Per Pcs" },
  { value: "Lumsum", label: "Lumsum" },
  { value: "Wastage", label: "Wastage" },
  { value: "Per%", label: "Per%" },
];

export function isDiamondStoneType(type) {
  const t = (type || "").toLowerCase();
  return t === "natural diamond" || t === "lab grown diamond";
}

export function isGemStoneType(type) {
  const t = (type || "").toLowerCase();
  return t === "gem stone" || t === "pearl";
}

export function floorPurityRatio(ratio) {
  const n = parseFloat(ratio);
  if (Number.isNaN(n)) return "";
  return (Math.floor(n * 1000) / 1000).toFixed(3);
}

/** MVC JewDesign.js #making-rate input: Lumsum = rate, else rate × grossWeight. */
export function computeMakingCharges(makingType, makingRate, grossWeight) {
  const r = parseFloat(makingRate) || 0;
  const gw = parseFloat(grossWeight) || 0;
  if (!r) return 0;
  if (makingType === "Lumsum") return r;
  return r * gw;
}

/** MVC updateTotalMakingCharges() */
export function computeChargeTotals({
  metalAmount,
  originalMakingCharges,
  handlingAmount,
  certificateCharges,
  hallmarkCharges,
  settingCharges,
  diamondAmount,
  stoneAmount,
  otherPer,
  askingPer,
  isManualAskingRate,
  currentAskingRate,
}) {
  const metal = parseFloat(metalAmount) || 0;
  const making = parseFloat(originalMakingCharges) || 0;
  const handling = parseFloat(handlingAmount) || 0;
  const certificate = parseFloat(certificateCharges) || 0;
  const hallmark = parseFloat(hallmarkCharges) || 0;
  const setting = parseFloat(settingCharges) || 0;
  const diamond = parseFloat(diamondAmount) || 0;
  const stone = parseFloat(stoneAmount) || 0;
  const otherPct = parseFloat(otherPer) || 0;
  const askingPct = parseFloat(askingPer) || 0;

  const baseFinalAmount =
    metal + making + handling + certificate + hallmark + diamond + stone + setting;

  const other = Math.round(baseFinalAmount * otherPct * 100) / 100;

  let totalMaking = 0;
  if (making > 0) {
    totalMaking = making + handling + certificate + hallmark + setting;
  }

  const finalCostAmount = Math.round((baseFinalAmount + other) * 100) / 100;
  const autoAsking =
    finalCostAmount + Math.round(finalCostAmount * askingPct * 100) / 100;

  return {
    costAmount: baseFinalAmount.toFixed(2),
    otherCharges: other.toFixed(2),
    totalMakingCharges: totalMaking.toFixed(2),
    finalAmount: finalCostAmount.toFixed(2),
    askingRate: isManualAskingRate
      ? String(currentAskingRate ?? "")
      : autoAsking.toFixed(2),
  };
}

export function summarizeTableRows(rows) {
  let diaAmt = 0;
  let diaQty = 0;
  let stnAmt = 0;
  let stnQty = 0;

  (rows || []).forEach((row) => {
    const amt = parseFloat(row.amount) || 0;
    const pc = parseInt(row.pcs, 10) || 0;
    if (isDiamondStoneType(row.stoneType)) {
      diaAmt += amt;
      diaQty += pc;
    } else if (isGemStoneType(row.stoneType)) {
      stnAmt += amt;
      stnQty += pc;
    }
  });

  return {
    diamondAmount: diaAmt.toFixed(2),
    diamondQty: String(diaQty),
    stoneAmount: stnAmt.toFixed(2),
    stoneQty: String(stnQty),
  };
}

export function mapDiamondListToRows(diamondList, idOffset = 0) {
  return (Array.isArray(diamondList) ? diamondList : []).map((item, idx) => ({
    id: idOffset + idx + 1,
    stockID: item.stockID || item.StockID || item.lotNo || item.LotNo || "",
    stoneType: item.type || item.Type || item.category || item.Category || "Natural Diamond",
    shape: item.shape || item.Shape || "",
    size: item.size || item.Size || "",
    sieve: item.sieve || item.Sieve || "",
    color: item.color || item.Color || "",
    clarity: item.clarity || item.Clarity || "",
    pcs: item.pcs || item.Pcs || 0,
    carats: item.carat || item.Carat || item.issueCarats || item.IssueCarats || 0,
    rate: item.price || item.Price || item.rate || item.Rate || 0,
    amount: item.amount || item.Amount || 0,
    lab: item.lab || item.Lab || item.cert || item.Cert || "",
  }));
}
