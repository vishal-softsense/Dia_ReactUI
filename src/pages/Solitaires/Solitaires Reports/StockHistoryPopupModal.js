import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Modal, ModalBody, ModalHeader, Spinner, Table } from "reactstrap";
import { toast } from "react-toastify";

import { exportToExcel } from "../../../helpers/excel_helper";
import { getSolitaireStockSearchHistory } from "../../../helpers/fakebackend_helper";

const fmtFixed = (value, decimals) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return num.toFixed(decimals);
};

const HISTORY_FROM_DATE = "2020-01-01";
const HISTORY_TO_DATE = "2026-12-31";

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
    "particulars",
    "Particulars",
    "partyName",
    "PartyName",
    "accName",
    "AccName",
    "relatedRemark",
    "RelatedRemark",
    "perticulors",
    "Perticulors"
  );
  if (value) return value;
  const trnType = getRowVal(row, "trnType", "TrnType");
  return trnType === "OpStk" ? "OpStk" : "";
};

const StockHistoryPopupModal = ({ isOpen, toggle, stockId }) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !stockId) {
      setRows([]);
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      setRows([]);

      try {
        const payload = {
          FromDate: HISTORY_FROM_DATE,
          ToDate: HISTORY_TO_DATE,
          LotNo: stockId,
          SelectedTypes: ["ALL"],
          StkEff: true
        };

        const response = await getSolitaireStockSearchHistory(payload);
        const ok = response?.Success || response?.success;

        if (cancelled) return;

        if (ok) {
          const data = response.Data || response.data || [];
          setRows(Array.isArray(data) ? data : []);
        } else {
          toast.warning(response?.Message || response?.message || t("No history found."));
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
  }, [isOpen, stockId, t]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, item) => {
        acc.stockIn += getNumVal(item, "stockIn", "StockIn");
        acc.stockInAmount += getNumVal(item, "stockInAmount", "StockInAmount");
        acc.stockOut += getNumVal(item, "stockOut", "StockOut");
        acc.stockOutAmount += getNumVal(item, "stockOutAmount", "StockOutAmount");
        return acc;
      },
      { stockIn: 0, stockInAmount: 0, stockOut: 0, stockOutAmount: 0 }
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
      const trnType = getRowVal(item, "trnType", "TrnType");
      const trnDate = trnType === "OpStk" ? HISTORY_FROM_DATE : getRowVal(item, "trnDate", "TrnDate");
      excelRows.push([
        trnDate,
        trnType,
        getParticulars(item),
        fmtFixed(getNumVal(item, "stockIn", "StockIn"), 2),
        fmtFixed(getNumVal(item, "stockInPrice", "StockInPrice"), 2),
        fmtFixed(getNumVal(item, "stockInAmount", "StockInAmount"), 2),
        fmtFixed(getNumVal(item, "stockOut", "StockOut"), 2),
        fmtFixed(getNumVal(item, "stockOutPrice", "StockOutPrice"), 2),
        fmtFixed(getNumVal(item, "stockOutAmount", "StockOutAmount"), 2),
        fmtFixed(getNumVal(item, "balanceStock", "BalanceStock"), 2),
        fmtFixed(getNumVal(item, "balancePrice", "BalancePrice"), 2),
        fmtFixed(getNumVal(item, "balanceAmount", "BalanceAmount"), 2)
      ]);
    });

    excelRows.push([
      "Grand Total :",
      "",
      "",
      totals.stockIn.toFixed(2),
      "",
      totals.stockInAmount.toFixed(2),
      totals.stockOut.toFixed(2),
      "",
      totals.stockOutAmount.toFixed(2),
      "",
      "",
      ""
    ]);

    await exportToExcel(columns, excelRows, "StockHistoryList", "Stock-History");
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
            <Table bordered striped size="sm" className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="text-center">{t("TrnDate")}</th>
                  <th className="text-center">{t("TrnType")}</th>
                  <th className="text-center">{t("Particulars")}</th>
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
                {rows.map((item, idx) => {
                  const trnType = getRowVal(item, "trnType", "TrnType");
                  const trnDate =
                    trnType === "OpStk" ? HISTORY_FROM_DATE : getRowVal(item, "trnDate", "TrnDate");

                  return (
                    <tr key={idx}>
                      <td className="text-center">{trnDate}</td>
                      <td className="text-center">{trnType}</td>
                      <td className="text-center">{getParticulars(item)}</td>
                      <td className="text-end">{fmtFixed(getNumVal(item, "stockIn", "StockIn"), 2)}</td>
                      <td className="text-end">{fmtFixed(getNumVal(item, "stockInPrice", "StockInPrice"), 2)}</td>
                      <td className="text-end">{fmtFixed(getNumVal(item, "stockInAmount", "StockInAmount"), 2)}</td>
                      <td className="text-end">{fmtFixed(getNumVal(item, "stockOut", "StockOut"), 2)}</td>
                      <td className="text-end">{fmtFixed(getNumVal(item, "stockOutPrice", "StockOutPrice"), 2)}</td>
                      <td className="text-end">{fmtFixed(getNumVal(item, "stockOutAmount", "StockOutAmount"), 2)}</td>
                      <td className="text-end">{fmtFixed(getNumVal(item, "balanceStock", "BalanceStock"), 2)}</td>
                      <td className="text-end">{fmtFixed(getNumVal(item, "balancePrice", "BalancePrice"), 2)}</td>
                      <td className="text-end">{fmtFixed(getNumVal(item, "balanceAmount", "BalanceAmount"), 2)}</td>
                    </tr>
                  );
                })}
                <tr className="fw-bold table-active">
                  <td colSpan={3} className="text-end">
                    {t("Grand Total")} :
                  </td>
                  <td className="text-end">{totals.stockIn.toFixed(2)}</td>
                  <td />
                  <td className="text-end">{totals.stockInAmount.toFixed(2)}</td>
                  <td className="text-end">{totals.stockOut.toFixed(2)}</td>
                  <td />
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
