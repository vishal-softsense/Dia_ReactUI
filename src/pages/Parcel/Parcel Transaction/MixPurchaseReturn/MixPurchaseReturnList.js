import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  Container,
  Modal,
  ModalBody
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../../helpers/excel_helper";
import {
  deleteMixPurchaseReturn,
  getMixPurchaseReturnList
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
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

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

const MixPurchaseReturnList = () => {
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
      const res = await getMixPurchaseReturnList();
      if (res?.success || res?.Success) {
        setRows(res.Data || res.data || []);
      } else {
        toast.error(res?.Data || res?.data || t("Failed to load mix purchase return list."));
      }
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : t("Failed to load mix purchase return list."));
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
      const res = await deleteMixPurchaseReturn(deleteTarget.code);
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
      "BillNo",
      "Date",
      "Print Date",
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
      getVal(r, "BillNo"),
      fmtDate(getVal(r, "Date")),
      fmtDate(getVal(r, "RoundDate")),
      getVal(r, "Party"),
      getVal(r, "InvType"),
      getVal(r, "Subtype"),
      getVal(r, "Category"),
      fmtNum(getVal(r, "Weight", "Carats"), 3),
      fmtNum(getVal(r, "Amount")),
      getVal(r, "Symbol"),
      fmtNum(getVal(r, "MasterCurrencyAmount")),
      fmtNum(getVal(r, "StockCurrencyAmount")),
      fmtDate(getVal(r, "DueDate")),
      getVal(r, "Status")
    ]);
    const result = await exportToExcel(headers, excelRows, "MixPurchaseReturnList", "MixPurchaseReturnList");
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
        to={`/MixPurchaseReturn/edit-mixpurchasertndata?Id=${code}&Mode=view`}
        className={`badge rounded-pill ${cls} px-2 py-1 text-decoration-none fw-semibold fs-12`}
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
        enableSorting: false,
        className: "text-center",
        minWidth: "140px",
        cell: ({ row }) => {
          const code = getVal(row.original, "code");
          const inv = getInvNo(row.original);
          return (
            <div className="d-flex gap-1 justify-content-center align-items-center">
              <button
                type="button"
                className="btn btn-soft-primary btn-sm p-1"
                style={{ width: "26px", height: "26px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                title={t("Print")}
                onClick={() => window.open(`/MixPurchaseReturn/MixPurRtnPrintInv?ID=${encodeURIComponent(code)}`, "_blank")}
              >
                <i className="ri-printer-line" />
              </button>
              <button
                type="button"
                className="btn btn-soft-primary btn-sm p-1"
                style={{ width: "26px", height: "26px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                title={t("View PDF")}
                onClick={() => window.open(`/MixPurchaseReturn/MixPurRtnPrintInv?ID=${encodeURIComponent(code)}`, "_blank")}
              >
                <i className="ri-eye-line" />
              </button>
              <button
                type="button"
                className="btn btn-soft-primary btn-sm p-1"
                style={{ width: "26px", height: "26px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                title={t("Edit")}
                onClick={() => navigate(`/MixPurchaseReturn/edit-mixpurchasertndata?Id=${code}`)}
              >
                <i className="ri-pencil-line" />
              </button>
              <button
                type="button"
                className="btn btn-soft-danger btn-sm p-1"
                style={{ width: "26px", height: "26px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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
        minWidth: "130px",
        cell: ({ row }) => invBadge(row.original)
      },
      {
        header: t("BillNo"),
        accessorKey: "BillNo",
        accessorFn: (row) => getVal(row, "BillNo"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        minWidth: "110px"
      },
      {
        header: t("Date"),
        accessorKey: "Date",
        accessorFn: (row) => fmtDate(getVal(row, "Date")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        className: "text-center",
        minWidth: "110px",
        cell: ({ getValue }) => <div className="text-center">{getValue()}</div>
      },
      {
        header: t("Print Date"),
        accessorKey: "RoundDate",
        accessorFn: (row) => fmtDate(getVal(row, "RoundDate")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        className: "text-center",
        minWidth: "110px",
        cell: ({ getValue }) => <div className="text-center">{getValue()}</div>
      },
      {
        header: t("Party"),
        accessorKey: "Party",
        accessorFn: (row) => getVal(row, "Party"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        minWidth: "150px"
      },
      {
        header: t("Type"),
        accessorKey: "InvType",
        accessorFn: (row) => getVal(row, "InvType"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        minWidth: "105px"
      },
      {
        header: t("SubType"),
        accessorKey: "Subtype",
        accessorFn: (row) => getVal(row, "Subtype"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        minWidth: "105px"
      },
      {
        header: t("Category"),
        accessorKey: "Category",
        accessorFn: (row) => getVal(row, "Category"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        minWidth: "110px"
      },
      {
        header: t("Carats"),
        accessorKey: "Carats",
        accessorFn: (row) => fmtNum(getVal(row, "Weight", "Carats"), 3),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        className: "text-end",
        minWidth: "100px",
        cell: ({ getValue }) => <div className="text-end">{getValue()}</div>
      },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        accessorFn: (row) => fmtNum(getVal(row, "Amount")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        className: "text-end",
        minWidth: "110px",
        cell: ({ getValue }) => <div className="text-end">{getValue()}</div>
      },
      {
        header: t("Currency"),
        accessorKey: "Symbol",
        accessorFn: (row) => getVal(row, "Symbol"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        minWidth: "90px"
      },
      {
        header: `${masterSymbol} Amt`,
        accessorKey: "MasterCurrencyAmount",
        accessorFn: (row) => fmtNum(getVal(row, "MasterCurrencyAmount")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        className: "text-end",
        minWidth: "120px",
        cell: ({ getValue }) => <div className="text-end">{getValue()}</div>
      },
      {
        header: `${stockSymbol} Amt`,
        accessorKey: "StockCurrencyAmount",
        accessorFn: (row) => fmtNum(getVal(row, "StockCurrencyAmount")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        className: "text-end",
        minWidth: "120px",
        cell: ({ getValue }) => <div className="text-end">{getValue()}</div>
      },
      {
        header: t("DueDate"),
        accessorKey: "DueDate",
        accessorFn: (row) => fmtDate(getVal(row, "DueDate")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        className: "text-center",
        minWidth: "110px",
        cell: ({ getValue }) => <div className="text-center">{getValue()}</div>
      },
      {
        header: t("Payment Status"),
        accessorKey: "Status",
        accessorFn: (row) => getVal(row, "Status"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        className: "text-center",
        minWidth: "140px",
        cell: ({ row }) => statusBadge(getVal(row.original, "Status"), getVal(row.original, "per"))
      }
    ],
    [t, masterSymbol, stockSymbol, navigate]
  );

  document.title = `${t("Mix Purchase Return List")} | ${t("Admin")}`;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Mix Purchase Return List")} pageTitle={t("Mix Purchase Return")} />

          <Card className="shadow-sm border-0 rounded-3 mb-3">
            <CardBody className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 p-3">
              <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2 text-nowrap" style={{ fontSize: "clamp(16px, 3vw, 18px)" }}>
                <i className="ri-arrow-go-back-line fs-20 flex-shrink-0" />
                <span>{t("Mix Purchase Return List")}</span>
              </h5>
              <div className="d-flex gap-2 flex-wrap align-items-center w-100 w-sm-auto justify-content-start justify-content-sm-end">
                <Button color="soft-success" size="sm" className="btn-sm flex-fill flex-sm-grow-0 text-nowrap" onClick={handleExport}>
                  <i className="ri-file-excel-2-line me-1" />
                  {t("Excel")}
                </Button>
                <Link to="/MixPurchaseReturn/add-MixPurchaseReturnView" className="btn btn-primary btn-sm flex-fill flex-sm-grow-0 text-nowrap text-center">
                  <i className="ri-add-line me-1" />
                  {t("Create Mix Purchase Return")}
                </Link>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-sm border-0 rounded-3">
            <CardBody className="p-2 p-sm-3">
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
                  divClass="table-responsive mb-0"
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

export default MixPurchaseReturnList;
