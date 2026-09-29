import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Modal,
  ModalBody,
  ModalFooter,
  Row
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../../helpers/excel_helper";
import {
  deleteSolitairePurchase,
  getSolitairePurchaseList
} from "../../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  REPORT_COMPANY_SETTINGS_EVENT
} from "../../../../helpers/reportCompanyDefaults";

const getVal = (row, ...keys) => {
  if (!row) return "";
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    if (row[camel] !== undefined && row[camel] !== null && row[camel] !== "") return row[camel];
    if (row[pascal] !== undefined && row[pascal] !== null && row[pascal] !== "") return row[pascal];
  }
  return "";
};

const fmtDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "\u00A0");
};

const dateCell = ({ getValue }) => (
  <span className="text-nowrap" style={{ display: "inline-block", minWidth: "92px" }}>
    {getValue()}
  </span>
);

const fmtNum = (value, decimals = 2) => {
  const n = Number(value);
  if (Number.isNaN(n)) return (0).toFixed(decimals);
  return n.toFixed(decimals);
};

const customStringFilterFn = (row, columnId, filterValue) => {
  const val = row.getValue(columnId);
  if (val == null) return false;
  return String(val).toLowerCase().includes(String(filterValue).toLowerCase());
};

/** SP may return InvNo as HTML anchor — show clean invoice # */
const stripHtml = (value) => {
  if (value == null || value === "") return "";
  let text = String(value).trim();
  if (!text.includes("<")) return text;
  const open = text.indexOf(">");
  const close = text.lastIndexOf("<");
  if (open >= 0 && close > open) text = text.substring(open + 1, close);
  text = text.replace(/<[^>]+>/g, "");
  if (typeof document !== "undefined") {
    const el = document.createElement("textarea");
    el.innerHTML = text;
    return el.value.trim();
  }
  return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
};

const getInvNo = (row) => {
  const raw = getVal(row, "Inv") || getVal(row, "InvNo");
  return stripHtml(raw);
};

const SolitairePurchaseList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [masterSymbol, setMasterSymbol] = useState("INR");
  const [stockSymbol, setStockSymbol] = useState("USD");

  useEffect(() => {
    if (location.state?.successMessage) {
      toast.success(location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const loadSymbols = async () => {
      const company = await getReportCompanySettings({ forceRefresh: false });
      setStockSymbol(company?.stockSymbol || getCachedReportCompany().stockSymbol || "USD");
      const auth = JSON.parse(sessionStorage.getItem("authUser") || localStorage.getItem("authUser") || "{}");
      setMasterSymbol(auth?.MSymbol || auth?.mSymbol || auth?.data?.MSymbol || "INR");
    };
    loadSymbols();
    const refresh = () => setStockSymbol(getCachedReportCompany().stockSymbol || "USD");
    window.addEventListener(REPORT_COMPANY_SETTINGS_EVENT, refresh);
    return () => window.removeEventListener(REPORT_COMPANY_SETTINGS_EVENT, refresh);
  }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getSolitairePurchaseList();
      if (res?.success || res?.Success) {
        setRows(res.Data || res.data || []);
      } else {
        toast.error(res?.Data || res?.data || t("Failed to load purchase list."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load purchase list."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteSolitairePurchase(deleteTarget.code);
      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || t("Record Deleted."));
        fetchList();
      } else {
        toast.warning(res?.Data || res?.data || t("Delete failed."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Delete failed."));
    } finally {
      setDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleExport = async () => {
    if (!rows.length) {
      toast.warning(t("No data available to export"));
      return;
    }
    const headers = [
      "Invoice",
      "Date",
      "Party",
      "Type",
      "SubType",
      "Category",
      "Carats",
      "Amount",
      "Symbol",
      `${masterSymbol} Amt`,
      `${stockSymbol} Amt`,
      "DueDate",
      "Payment Status"
    ];
    const excelRows = rows.map((r) => [
      getInvNo(r),
      fmtDate(getVal(r, "Date")),
      getVal(r, "Party"),
      getVal(r, "InvType"),
      getVal(r, "Subtype"),
      getVal(r, "Category"),
      fmtNum(getVal(r, "Carats"), 3),
      fmtNum(getVal(r, "Amount")),
      getVal(r, "Symbol"),
      fmtNum(getVal(r, "MasterCurrencyAmount")),
      fmtNum(getVal(r, "StockCurrencyAmount")),
      fmtDate(getVal(r, "DueDate")),
      getVal(r, "Status")
    ]);
    const result = await exportToExcel(headers, excelRows, "PurchaseList", "PurchaseList");
    if (!result?.success) toast.error(t("Failed to generate Excel file."));
  };

  const statusBadge = (status, per) => {
    const s = String(status || "").trim().toUpperCase();
    if (s === "PAID") return <span className="badge bg-success-subtle text-success">{t("Fully Paid")}</span>;
    if (s === "UNPAID") return <span className="badge bg-danger-subtle text-danger">{t("UNPAID")}</span>;
    const pct = Math.floor(Number(per) || 0);
    return (
      <div>
        <span className="badge bg-warning-subtle text-warning">
          {t("Partially Paid")} ({pct}%)
        </span>
        <div className="progress progress-sm mt-1" style={{ height: 4 }}>
          <div className="progress-bar bg-info" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  const invBadge = (row) => {
    const inv = getInvNo(row);
    const code = getVal(row, "code");
    const s = String(getVal(row, "Status") || "").trim().toUpperCase();
    const cls =
      s === "PAID"
        ? "bg-success-subtle text-success"
        : s === "UNPAID"
          ? "bg-danger-subtle text-danger"
          : "bg-warning-subtle text-warning";
    return (
      <Link
        to={`/purchase/edit-purchase?Id=${code}&Mode=view`}
        className={`badge rounded-pill ${cls} text-decoration-none`}
        title={t("View")}
      >
        {inv || "-"}
      </Link>
    );
  };

  const columns = useMemo(
    () => [
      {
        header: t("Action"),
        id: "actions",
        enableColumnFilter: false,
        cell: ({ row }) => {
          const code = getVal(row.original, "code");
          const inv = getInvNo(row.original);
          return (
            <div className="d-flex gap-1 justify-content-center">
              <button
                type="button"
                className="btn btn-soft-primary btn-sm p-1"
                title={t("Print")}
                onClick={() => {
                  if (!inv) return;
                  window.open(`/purchase/printinvview?InvNo=${encodeURIComponent(inv)}`, "_blank");
                }}
              >
                <i className="ri-printer-line" />
              </button>
              <button
                type="button"
                className="btn btn-soft-primary btn-sm p-1"
                title={t("Edit")}
                onClick={() => navigate(`/purchase/edit-purchase?Id=${code}`)}
              >
                <i className="ri-pencil-line" />
              </button>
              <button
                type="button"
                className="btn btn-soft-danger btn-sm p-1"
                title={t("Delete")}
                onClick={() => {
                  setDeleteTarget({ code, inv });
                  setDeleteModal(true);
                }}
              >
                <i className="ri-delete-bin-line" />
              </button>
            </div>
          );
        }
      },
      {
        header: t("Invoice"),
        accessorKey: "InvNo",
        accessorFn: (row) => getInvNo(row),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        cell: ({ row }) => invBadge(row.original)
      },
      {
        header: t("Date"),
        accessorKey: "Date",
        accessorFn: (row) => fmtDate(getVal(row, "Date")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        cell: dateCell
      },
      {
        header: t("Party"),
        accessorKey: "Party",
        accessorFn: (row) => getVal(row, "Party"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("Type"),
        accessorKey: "InvType",
        accessorFn: (row) => getVal(row, "InvType"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("SubType"),
        accessorKey: "Subtype",
        accessorFn: (row) => getVal(row, "Subtype"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("Category"),
        accessorKey: "Category",
        accessorFn: (row) => getVal(row, "Category"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("Carats"),
        accessorKey: "Carats",
        accessorFn: (row) => fmtNum(getVal(row, "Carats"), 3),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        cell: ({ getValue }) => <div className="text-end">{getValue()}</div>
      },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        accessorFn: (row) => fmtNum(getVal(row, "Amount")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        cell: ({ getValue }) => <div className="text-end">{getValue()}</div>
      },
      {
        header: t("Symbol"),
        accessorKey: "Symbol",
        accessorFn: (row) => getVal(row, "Symbol"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: `${masterSymbol} Amt`,
        accessorKey: "MasterCurrencyAmount",
        accessorFn: (row) => fmtNum(getVal(row, "MasterCurrencyAmount")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        cell: ({ getValue }) => <div className="text-end">{getValue()}</div>
      },
      {
        header: `${stockSymbol} Amt`,
        accessorKey: "StockCurrencyAmount",
        accessorFn: (row) => fmtNum(getVal(row, "StockCurrencyAmount")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        cell: ({ getValue }) => <div className="text-end">{getValue()}</div>
      },
      {
        header: t("DueDate"),
        accessorKey: "DueDate",
        accessorFn: (row) => fmtDate(getVal(row, "DueDate")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        cell: dateCell
      },
      {
        header: t("Payment Status"),
        accessorKey: "Status",
        accessorFn: (row) => getVal(row, "Status"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        cell: ({ row }) => statusBadge(getVal(row.original, "Status"), getVal(row.original, "per"))
      }
    ],
    [t, masterSymbol, stockSymbol, navigate]
  );

  document.title = `${t("Purchase List")} | ${t("Admin")}`;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Purchase List")} pageTitle={t("Purchases")} />

          <Card className="shadow-sm border-0 rounded-3 mb-3">
            <CardBody className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
              <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                <i className="ri-shopping-bag-3-line fs-20" />
                {t("Purchase List")}
              </h5>
              <div className="d-flex gap-2 flex-wrap">
                <Button color="soft-success" className="btn-sm" onClick={handleExport}>
                  <i className="ri-file-excel-2-line me-1" />
                  {t("Excel")}
                </Button>
                <Link to="/purchase/add-purchase" className="btn btn-primary btn-sm">
                  <i className="ri-add-line me-1" />
                  {t("Create Purchase")}
                </Link>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-sm border-0 rounded-3">
            <CardBody>
              {loading ? (
                <div className="text-center text-muted py-5">{t("Loading...")}</div>
              ) : (
                <TableContainer
                  columns={columns}
                  data={rows}
                  isGlobalFilter
                  isPagination
                  customPageSize={500}
                  customPageSizes={[500, 1000, 1500]}
                  SearchPlaceholder={t("Search...")}
                  divClass="table-responsive table-card mb-0"
                  tableClass="table table-bordered table-hover table-sm align-middle mb-0"
                  theadClass="table-light"
                />
              )}
            </CardBody>
          </Card>
        </Container>

        <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
          <div className="modal-header justify-content-between align-items-center py-3 px-4" style={{ backgroundColor: "rgb(238, 94, 70)", borderBottom: "none" }}>
            <h5 className="modal-title m-0 fw-medium" style={{ color: "#212529" }}>{t("Confirm Delete")}</h5>
            <button type="button" className="btn-close" onClick={() => setDeleteModal(false)} aria-label="Close"></button>
          </div>
          <ModalBody className="py-4">
            <div className="text-center">
              <lord-icon
                src="https://cdn.lordicon.com/gsqxdxog.json"
                trigger="loop"
                colors="primary:#f7b84b,secondary:#f06548"
                style={{ width: "100px", height: "100px" }}
              ></lord-icon>
              <div className="mt-4 pt-2 mx-4 mx-sm-5">
                <h3 className="fw-bold mb-3" style={{ color: "#495057" }}>{t("Are You Sure ??")}</h3>
                <p className="text-muted mb-4 fs-16 lh-base">
                  {t("Selected record will be Removed !!")}
                  <br />
                  <strong>{t("Invoice No")} :</strong> {deleteTarget?.inv}
                </p>
              </div>
            </div>
            <div className="d-flex gap-3 justify-content-center mt-4 mb-2">
              <button
                type="button"
                className="btn text-white px-4 py-2 fw-medium"
                style={{ backgroundColor: "#405189", borderColor: "#405189", minWidth: "130px" }}
                onClick={confirmDelete}
              >
                {t("Yes, remove it")}
              </button>
              <button
                type="button"
                className="btn text-white px-4 py-2 fw-medium"
                style={{ backgroundColor: "rgb(238, 94, 70)", borderColor: "rgb(238, 94, 70)", minWidth: "130px" }}
                onClick={() => setDeleteModal(false)}
              >
                {t("Cancel")}
              </button>
            </div>
          </ModalBody>
        </Modal>

        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default SolitairePurchaseList;
