import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button, Card, CardBody, Container, Modal, ModalBody } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../../helpers/excel_helper";
import { deleteLoanTaken, getLoanTakenList } from "../../../../helpers/fakebackend_helper";

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

const dateCell = ({ getValue }) => (
  <span className="text-nowrap" style={{ display: "inline-block", minWidth: "92px" }}>
    {getValue()}
  </span>
);

const LoanTakenList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (location.state?.successMessage) {
      toast.success(location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await getLoanTakenList();
      if (res?.success || res?.Success) {
        setRows(res.Data || res.data || []);
      } else {
        toast.error(res?.Data || res?.data || t("Failed to load list."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load list."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteLoanTaken(deleteTarget.code);
      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || t("Record Deleted."));
        loadList();
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
    const headers = [t("Date"), t("Party"), t("From/To Account"), t("Cur"), t("Amount")];
    const excelRows = rows.map((r) => [
      fmtDate(getVal(r, "ConDate", "conDate")),
      getVal(r, "Accgrpname", "accgrpname"),
      getVal(r, "FromToAccount", "fromToAccount"),
      getVal(r, "Cur", "cur"),
      fmtNum(getVal(r, "Amount", "amount"))
    ]);
    const result = await exportToExcel(headers, excelRows, "LoanTakenList", "LoanTakenList");
    if (!result?.success) toast.error(t("Failed to generate Excel file."));
  };

  const columns = useMemo(
    () => [
      {
        header: t("Action"),
        id: "actions",
        enableColumnFilter: false,
        cell: ({ row }) => {
          const code = getVal(row.original, "Code", "code");
          return (
            <div className="d-flex gap-1 justify-content-center">
              <button
                type="button"
                className="btn btn-soft-primary btn-sm p-1"
                title={t("Edit")}
                onClick={() => navigate(`/loan/edit-loantaken?Id=${code}`)}
              >
                <i className="ri-pencil-line" />
              </button>
              <button
                type="button"
                className="btn btn-soft-danger btn-sm p-1"
                title={t("Delete")}
                onClick={() => {
                  setDeleteTarget({
                    code,
                    party: getVal(row.original, "Accgrpname", "accgrpname"),
                    date: fmtDate(getVal(row.original, "ConDate", "conDate"))
                  });
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
        header: t("Date"),
        accessorKey: "ConDate",
        accessorFn: (row) => fmtDate(getVal(row, "ConDate", "conDate")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        cell: dateCell
      },
      {
        header: t("Party"),
        accessorKey: "Accgrpname",
        accessorFn: (row) => getVal(row, "Accgrpname", "accgrpname"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("From/To Account"),
        accessorKey: "FromToAccount",
        accessorFn: (row) => getVal(row, "FromToAccount", "fromToAccount"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("Cur"),
        accessorKey: "Cur",
        accessorFn: (row) => getVal(row, "Cur", "cur"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        accessorFn: (row) => fmtNum(getVal(row, "Amount", "amount")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        cell: ({ row }) => fmtNum(getVal(row.original, "Amount", "amount"))
      }
    ],
    [t, navigate]
  );

  document.title = `${t("Loan Taken List")} | ${t("Admin")}`;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Loan Taken List")} pageTitle={t("Loans")} />

          <Card className="shadow-sm border-0 rounded-3 mb-3">
            <CardBody className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
              <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                <i className="ri-file-list-3-line fs-20" />
                {t("Loan Taken List")}
              </h5>
              <div className="d-flex gap-2 flex-wrap">
                <Button color="soft-success" className="btn-sm" onClick={handleExport}>
                  <i className="ri-file-excel-2-line me-1" />
                  {t("Excel")}
                </Button>
                <Link to="/loan/add-loantaken" className="btn btn-primary btn-sm">
                  <i className="ri-add-line me-1" />
                  {t("Add Loan Taken")}
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
                  {deleteTarget?.party && (
                    <>
                      <br />
                      <strong>{t("Party")} :</strong> {deleteTarget.party}
                    </>
                  )}
                  {deleteTarget?.date && (
                    <>
                      <br />
                      <strong>{t("Date")} :</strong> {deleteTarget.date}
                    </>
                  )}
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

export default LoanTakenList;
