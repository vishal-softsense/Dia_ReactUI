import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Modal, ModalBody, ModalHeader, Spinner, Table } from "reactstrap";
import { toast } from "react-toastify";

import { exportToExcel } from "../../../helpers/excel_helper";
import {
  getSolitaireStockHistoryReport,
  getParcelStockHistoryReport,
  getSolitaireStockSearchHistory
} from "../../../helpers/fakebackend_helper";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";
import { formatCarat } from "../../../helpers/caratFormatDefaults";
import { useCaratFormat } from "../../../Components/Hooks/useCaratFormat";

const formatDateToDMY = (dateVal) => {
  if (!dateVal) return "";
  const s = String(dateVal).split("T")[0].split(" ")[0].trim();
  const parts = s.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[0]}`;
    }
    return s;
  }
  const slashParts = s.split("/");
  if (slashParts.length === 3) {
    if (slashParts[2].length === 4) {
      return `${slashParts[0].padStart(2, "0")}-${slashParts[1].padStart(2, "0")}-${slashParts[2]}`;
    }
  }
  return s;
};

const fmtFixed = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return num.toFixed(decimals);
};

const getRowVal = (row, ...keys) => {
  for (const key of keys) {
    const val = row?.[key];
    if (val !== undefined && val !== null && val !== "") return val;
  }
  return "";
};

const getNumVal = (row, ...keys) => {
  for (const key of keys) {
    const val = row?.[key];
    if (val !== undefined && val !== null && val !== "") {
      const num = Number(val);
      if (!Number.isNaN(num)) return num;
    }
  }
  return 0;
};

const getParticulars = (row) => {
  const value = getRowVal(
    row,
    "relatedRemark",
    "RelatedRemark",
    "perticulors",
    "Perticulors",
    "particulars",
    "Particulars",
    "partyName",
    "PartyName",
    "accName",
    "AccName"
  );
  if (value) return value;
  const trnType = getRowVal(row, "trntype", "Trntype", "trnType", "TrnType");
  return trnType === "OpStk" ? "OpStk" : "";
};

const StockHistoryPopupModal = ({ isOpen, toggle, stockId, isParcel = false }) => {
  const { t } = useTranslation();
  const { caratFormat } = useCaratFormat(isParcel ? "parcel" : "solitaire");
  const { getDates } = useSettingReportDates();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyFromDate, setHistoryFromDate] = useState("");

  useEffect(() => {
    if (!isOpen || !stockId) {
      setRows([]);
      setHistoryFromDate("");
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      setRows([]);

      try {
        const { fromDate, toDate } = await getDates();
        if (!cancelled) {
          setHistoryFromDate(formatDateToDMY(fromDate));
        }

        const solPayload = {
          FromDate: fromDate,
          ToDate: toDate,
          LotNo: String(stockId).trim(),
          SelectedTypes: ["ALL"],
          SalpurAvg: true
        };

        const parcelPayload = {
          FromDate: fromDate,
          ToDate: toDate,
          LotNo: String(stockId).trim(),
          SelectedTypes: ["ALL"],
          selectedTypes: ["ALL"],
          selectedTypesTrn: ["ALL"],
          SalpurAvg: true,
          RadioValue: "sale-pur-avg-price"
        };

        let data = [];

        if (isParcel) {
          // Parcel first, fallback to Solitaire
          try {
            const res = await getParcelStockHistoryReport(parcelPayload);
            const raw = res?.Data || res?.data || res?.reportData;
            if (Array.isArray(raw) && raw.length > 0) {
              data = raw;
            }
          } catch (e) {
            // fallback
          }

          if (!data || data.length === 0) {
            try {
              const res = await getSolitaireStockHistoryReport(solPayload);
              const raw = res?.Data || res?.data;
              if (Array.isArray(raw) && raw.length > 0) {
                data = raw;
              }
            } catch (e) {
              // fallback
            }
          }
        } else {
          // Solitaire first, fallback to Parcel
          try {
            const res = await getSolitaireStockHistoryReport(solPayload);
            const raw = res?.Data || res?.data;
            if (Array.isArray(raw) && raw.length > 0) {
              data = raw;
            }
          } catch (e) {
            // fallback
          }

          if (!data || data.length === 0) {
            try {
              const res = await getParcelStockHistoryReport(parcelPayload);
              const raw = res?.Data || res?.data || res?.reportData;
              if (Array.isArray(raw) && raw.length > 0) {
                data = raw;
              }
            } catch (e) {
              // fallback
            }
          }
        }

        // Secondary fallback to stock search history if still empty
        if (!data || data.length === 0) {
          try {
            const res = await getSolitaireStockSearchHistory({
              FromDate: fromDate,
              ToDate: toDate,
              LotNo: String(stockId).trim(),
              SelectedTypes: ["ALL"],
              StkEff: true
            });
            const raw = res?.Data || res?.data;
            if (Array.isArray(raw) && raw.length > 0) {
              data = raw;
            }
          } catch (e) {
            // fallback
          }
        }

        if (cancelled) return;

        if (Array.isArray(data) && data.length > 0) {
          setRows(data);
        } else {
          setRows([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          toast.error(t("Error loading stock history."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [isOpen, stockId, isParcel, t, getDates]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, item) => {
        acc.stockIn += getNumVal(item, "inCts", "InCts", "stockIn", "StockIn");
        acc.stockInPrice += getNumVal(item, "inRate", "InRate", "stockInPrice", "StockInPrice");
        acc.stockInAmount += getNumVal(item, "inAmount", "InAmount", "stockInAmount", "StockInAmount");
        acc.stockOut += getNumVal(item, "outCts", "OutCts", "stockOut", "StockOut");
        acc.stockOutPrice += getNumVal(item, "outRate", "OutRate", "stockOutPrice", "StockOutPrice");
        acc.stockOutAmount += getNumVal(item, "outAmount", "OutAmount", "stockOutAmount", "StockOutAmount");
        return acc;
      },
      { stockIn: 0, stockInPrice: 0, stockInAmount: 0, stockOut: 0, stockOutPrice: 0, stockOutAmount: 0 }
    );
  }, [rows]);

  const handleExcel = async () => {
    if (!rows.length) {
      toast.warning(t("No data available to export."));
      return;
    }

    const columns = [
      "TrnDate",
      "TrnType",
      "Particulars",
      "StockIn",
      "StockInPrice",
      "StockInAmount",
      "StockOut",
      "StockOutPrice",
      "StockOutAmount",
      "BalanceStock",
      "BalancePrice",
      "BalanceAmount"
    ];

    const excelRows = [[`StockID:${stockId}`, "", "", "", "", "", "", "", "", "", "", ""]];

    rows.forEach((item) => {
      const trnType = getRowVal(item, "trntype", "Trntype", "trnType", "TrnType");
      let trnDate = getRowVal(item, "trnDate", "TrnDate", "trndate", "Trndate");
      trnDate =
        trnType === "OpStk" && (!trnDate || trnDate.startsWith("01-01-1900") || trnDate.startsWith("1900"))
          ? historyFromDate
          : formatDateToDMY(trnDate);

      const stockIn = getNumVal(item, "inCts", "InCts", "stockIn", "StockIn");
      const stockInPrice = getNumVal(item, "inRate", "InRate", "stockInPrice", "StockInPrice");
      const stockInAmount = getNumVal(item, "inAmount", "InAmount", "stockInAmount", "StockInAmount");

      const stockOut = getNumVal(item, "outCts", "OutCts", "stockOut", "StockOut");
      const stockOutPrice = getNumVal(item, "outRate", "OutRate", "stockOutPrice", "StockOutPrice");
      const stockOutAmount = getNumVal(item, "outAmount", "OutAmount", "stockOutAmount", "StockOutAmount");

      const balanceStock = getNumVal(item, "balCts", "BalCts", "balanceStock", "BalanceStock");
      const balancePrice = getNumVal(item, "balRate", "BalRate", "balancePrice", "BalancePrice");
      const balanceAmount = getNumVal(item, "balAmount", "BalAmount", "balanceAmount", "BalanceAmount");

      excelRows.push([
        trnDate,
        trnType,
        getParticulars(item),
        formatCarat(stockIn, caratFormat),
        fmtFixed(stockInPrice, 2),
        fmtFixed(stockInAmount, 2),
        formatCarat(stockOut, caratFormat),
        fmtFixed(stockOutPrice, 2),
        fmtFixed(stockOutAmount, 2),
        formatCarat(balanceStock, caratFormat),
        fmtFixed(balancePrice, 2),
        fmtFixed(balanceAmount, 2)
      ]);
    });

    excelRows.push([
      "Total:",
      "",
      "",
      formatCarat(totals.stockIn, caratFormat),
      totals.stockInPrice.toFixed(2),
      totals.stockInAmount.toFixed(2),
      formatCarat(totals.stockOut, caratFormat),
      totals.stockOutPrice.toFixed(2),
      totals.stockOutAmount.toFixed(2),
      "",
      "",
      ""
    ]);

    excelRows.push([
      "Grand Total:",
      "",
      "",
      formatCarat(totals.stockIn, caratFormat),
      totals.stockInPrice.toFixed(2),
      totals.stockInAmount.toFixed(2),
      formatCarat(totals.stockOut, caratFormat),
      totals.stockOutPrice.toFixed(2),
      totals.stockOutAmount.toFixed(2),
      "",
      "",
      ""
    ]);

    await exportToExcel(columns, excelRows, `StockHistory_${stockId}`, "Stock-History");
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="xl" backdrop="static">
      <ModalHeader toggle={toggle} className="border-bottom">
        <div className="d-flex align-items-center justify-content-between w-100 pe-4">
          <span className="fw-semibold">{t("Stock History")}</span>
          <span className="fw-bold text-primary mx-3">{stockId}</span>
          <Button
            color="success"
            size="sm"
            className="d-flex align-items-center gap-1"
            onClick={handleExcel}
            disabled={loading || !rows.length}
          >
            <i className="ri-file-excel-2-line" />
            {t("Excel")}
          </Button>
        </div>
      </ModalHeader>
      <ModalBody className="p-3">
        {loading ? (
          <div className="text-center py-5">
            <Spinner color="primary" />
            <p className="text-muted mt-2 mb-0">{t("Loading history...")}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-5 text-muted">{t("No history found.")}</div>
        ) : (
          <div className="table-responsive">
            <Table bordered hover size="sm" className="align-middle mb-0 text-nowrap" style={{ fontSize: "12px" }}>
              <thead className="table-light">
                <tr>
                  <th className="text-start">{t("TrnDate")}</th>
                  <th className="text-start">{t("TrnType")}</th>
                  <th className="text-start">{t("Particulars")}</th>
                  <th className="text-end">{t("StockIn")}</th>
                  <th className="text-end">{t("StockInPrice")}</th>
                  <th className="text-end">{t("StockInAmount")}</th>
                  <th className="text-end">{t("StockOut")}</th>
                  <th className="text-end">{t("StockOutPrice")}</th>
                  <th className="text-end">{t("StockOutAmount")}</th>
                  <th className="text-end">{t("BalanceStock")}</th>
                  <th className="text-end">{t("BalancePrice")}</th>
                  <th className="text-end">{t("BalanceAmount")}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-light-subtle">
                  <td colSpan={12} className="fw-bold py-2 ps-3" style={{ fontSize: "13px" }}>
                    <strong>StockID: {stockId}</strong>
                  </td>
                </tr>
                {rows.map((item, idx) => {
                  const trnType = getRowVal(item, "trntype", "Trntype", "trnType", "TrnType");
                  let trnDate = getRowVal(item, "trnDate", "TrnDate", "trndate", "Trndate");
                  trnDate =
                    trnType === "OpStk" && (!trnDate || trnDate.startsWith("01-01-1900") || trnDate.startsWith("1900"))
                      ? historyFromDate
                      : formatDateToDMY(trnDate);

                  const stockIn = getNumVal(item, "inCts", "InCts", "stockIn", "StockIn");
                  const stockInPrice = getNumVal(item, "inRate", "InRate", "stockInPrice", "StockInPrice");
                  const stockInAmount = getNumVal(item, "inAmount", "InAmount", "stockInAmount", "StockInAmount");

                  const stockOut = getNumVal(item, "outCts", "OutCts", "stockOut", "StockOut");
                  const stockOutPrice = getNumVal(item, "outRate", "OutRate", "stockOutPrice", "StockOutPrice");
                  const stockOutAmount = getNumVal(item, "outAmount", "OutAmount", "stockOutAmount", "StockOutAmount");

                  const balanceStock = getNumVal(item, "balCts", "BalCts", "balanceStock", "BalanceStock");
                  const balancePrice = getNumVal(item, "balRate", "BalRate", "balancePrice", "BalancePrice");
                  const balanceAmount = getNumVal(item, "balAmount", "BalAmount", "balanceAmount", "BalanceAmount");

                  return (
                    <tr key={idx}>
                      <td className="text-start">{trnDate}</td>
                      <td className="text-start">{trnType}</td>
                      <td className="text-start">{getParticulars(item)}</td>
                      <td className="text-end">{formatCarat(stockIn, caratFormat)}</td>
                      <td className="text-end">{fmtFixed(stockInPrice, 2)}</td>
                      <td className="text-end">{fmtFixed(stockInAmount, 2)}</td>
                      <td className="text-end">{formatCarat(stockOut, caratFormat)}</td>
                      <td className="text-end">{fmtFixed(stockOutPrice, 2)}</td>
                      <td className="text-end">{fmtFixed(stockOutAmount, 2)}</td>
                      <td className="text-end">{formatCarat(balanceStock, caratFormat)}</td>
                      <td className="text-end">{fmtFixed(balancePrice, 2)}</td>
                      <td className="text-end">{fmtFixed(balanceAmount, 2)}</td>
                    </tr>
                  );
                })}
                <tr className="fw-bold table-light border-top">
                  <td colSpan={3} className="text-start ps-3">{t("Total:")}</td>
                  <td className="text-end">{formatCarat(totals.stockIn, caratFormat)}</td>
                  <td className="text-end">{totals.stockInPrice.toFixed(2)}</td>
                  <td className="text-end">{totals.stockInAmount.toFixed(2)}</td>
                  <td className="text-end">{formatCarat(totals.stockOut, caratFormat)}</td>
                  <td className="text-end">{totals.stockOutPrice.toFixed(2)}</td>
                  <td className="text-end">{totals.stockOutAmount.toFixed(2)}</td>
                  <td colSpan={3} />
                </tr>
                <tr className="fw-bold table-light border-top">
                  <td colSpan={3} className="text-start ps-3">{t("Grand Total:")}</td>
                  <td className="text-end">{formatCarat(totals.stockIn, caratFormat)}</td>
                  <td className="text-end">{totals.stockInPrice.toFixed(2)}</td>
                  <td className="text-end">{totals.stockInAmount.toFixed(2)}</td>
                  <td className="text-end">{formatCarat(totals.stockOut, caratFormat)}</td>
                  <td className="text-end">{totals.stockOutPrice.toFixed(2)}</td>
                  <td className="text-end">{totals.stockOutAmount.toFixed(2)}</td>
                  <td colSpan={3} />
                </tr>
              </tbody>
            </Table>
            <div className="text-muted small mt-2">
              {t("Showing")} 1 {t("to")} {rows.length} {t("of")} {rows.length} {t("entries")}
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default StockHistoryPopupModal;
