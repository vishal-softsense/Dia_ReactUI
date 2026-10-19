import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  Row
} from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../../helpers/excel_helper";
import {
  addIncomeExpense,
  deleteIncomeExpense,
  editIncomeExpense,
  getAccGrpMasters,
  getCurrencyRates,
  getIncomeExpenseDetail,
  getIncomeExpenseFilter,
  getIncomeExpensePageData
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

const toNum = (v, d = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : d;
};

const todayIso = () => new Date().toISOString().substr(0, 10);

const toLocalDateStr = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fmtDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const fmtNum = (value, decimals = 2) => {
  const n = Number(value);
  if (Number.isNaN(n)) return (0).toFixed(decimals);
  return n.toFixed(decimals);
};

const mapBasic = (list = []) =>
  (list || []).map((x) => ({
    value: String(getVal(x, "ID", "Id", "id") || getVal(x, "Name")),
    label: getVal(x, "Name", "TextName", "textName") || String(getVal(x, "ID"))
  }));

const customStringFilterFn = (row, columnId, filterValue) => {
  const val = row.getValue(columnId);
  if (val == null) return false;
  return String(val).toLowerCase().includes(String(filterValue).toLowerCase());
};

const fieldH = { height: 31 };

const selectStyles = {
  control: (p, s) => ({
    ...p,
    backgroundColor: s.isDisabled
      ? "var(--vz-input-disabled-bg, var(--vz-secondary-bg, #eff2f7))"
      : "var(--vz-secondary-bg, #fff)",
    borderColor: "var(--vz-border-color, #ced4da)",
    color: s.isDisabled ? "var(--vz-secondary-color, #878a99)" : "var(--vz-body-color, #495057)",
    minHeight: "31px",
    height: "31px",
    opacity: s.isDisabled ? 0.85 : 1
  }),
  valueContainer: (p) => ({ ...p, padding: "0 8px", height: "31px" }),
  indicatorsContainer: (p) => ({ ...p, height: "31px" }),
  input: (p) => ({ ...p, margin: 0, padding: 0, color: "var(--vz-body-color, #495057)" }),
  menu: (p) => ({
    ...p,
    backgroundColor: "var(--vz-secondary-bg, #fff)",
    color: "var(--vz-body-color, #495057)",
    border: "1px solid var(--vz-border-color, #dee2e6)",
    zIndex: 20
  }),
  option: (p, s) => ({
    ...p,
    backgroundColor: s.isFocused ? "#3b5de7" : "transparent",
    color: s.isFocused ? "#fff" : "var(--vz-body-color, #495057)",
    fontSize: "12px",
    cursor: "pointer",
    ":active": { backgroundColor: "#3b5de7" }
  }),
  placeholder: (p) => ({ ...p, color: "var(--vz-secondary-color, #878a99)", fontSize: "11px" }),
  singleValue: (p, s) => ({
    ...p,
    fontSize: "12px",
    color: s.isDisabled ? "var(--vz-secondary-color, #878a99)" : "var(--vz-body-color, #495057)"
  })
};

const IncomeExpenseForm = ({ mode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("Id") || searchParams.get("id");
  const isEdit = mode === "edit" && !!editId;
  const showInlineList = mode === "add" || isEdit;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currencyOpts, setCurrencyOpts] = useState([]);
  const [masterSymbol, setMasterSymbol] = useState("");
  const [stockSymbol, setStockSymbol] = useState("");
  const [mOp, setMOp] = useState("");
  const [sOp, setSOp] = useState("");

  const [mainAccount, setMainAccount] = useState(null);
  const [partyAccount, setPartyAccount] = useState(null);
  const [mainInput, setMainInput] = useState("");
  const [partyInput, setPartyInput] = useState("");
  const [mainOpts, setMainOpts] = useState([]);
  const [partyOpts, setPartyOpts] = useState([]);
  const [mainLoading, setMainLoading] = useState(false);
  const [partyLoading, setPartyLoading] = useState(false);

  const [inlineEdit, setInlineEdit] = useState(false);
  const [rows, setRows] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    gcode: "",
    transDate: todayIso(),
    currency: "",
    baseRate: "",
    sRate: "",
    rec: "0.00",
    paid: "0.00",
    desc: ""
  });

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const recVal = toNum(form.rec);
  const paidVal = toNum(form.paid);
  const showRecStar = !(paidVal > 0 && recVal === 0);
  const showPaidStar = !(recVal > 0 && paidVal === 0);

  useEffect(() => {
    const loadSymbols = async () => {
      const company = await getReportCompanySettings({ forceRefresh: false });
      const cached = getCachedReportCompany();
      setStockSymbol(company?.stockSymbol || cached.stockSymbol || "");
      const auth = JSON.parse(sessionStorage.getItem("authUser") || localStorage.getItem("authUser") || "{}");
      setMasterSymbol(
        auth?.MSymbol ||
          auth?.mSymbol ||
          auth?.data?.MSymbol ||
          company?.masterSymbol ||
          cached.masterSymbol ||
          ""
      );
    };
    loadSymbols();
    const refresh = () => {
      const cached = getCachedReportCompany();
      if (cached.stockSymbol) setStockSymbol(cached.stockSymbol);
      if (cached.masterSymbol) setMasterSymbol(cached.masterSymbol);
    };
    window.addEventListener(REPORT_COMPANY_SETTINGS_EVENT, refresh);
    return () => window.removeEventListener(REPORT_COMPANY_SETTINGS_EVENT, refresh);
  }, []);

  const searchAccounts = useCallback(async (term, setOpts, setLoad) => {
    if (!term || term.length < 2) {
      setOpts([]);
      return;
    }
    setLoad(true);
    try {
      const res = await getAccGrpMasters(term);
      if (res?.success || res?.Success) {
        const d = res.data || res.Data || [];
        setOpts(
          d.map((item) => ({
            value: String(item.accGrpCode || item.AccGrpCode || ""),
            label: item.accGrpName || item.AccGrpName || ""
          }))
        );
      }
    } catch {
      /* ignore */
    } finally {
      setLoad(false);
    }
  }, []);

  useEffect(() => {
    const tmr = setTimeout(() => searchAccounts(mainInput, setMainOpts, setMainLoading), 400);
    return () => clearTimeout(tmr);
  }, [mainInput, searchAccounts]);

  useEffect(() => {
    const tmr = setTimeout(() => searchAccounts(partyInput, setPartyOpts, setPartyLoading), 400);
    return () => clearTimeout(tmr);
  }, [partyInput, searchAccounts]);

  const applyCurrencyRates = async (curCode) => {
    if (!curCode) return;
    try {
      const res = await getCurrencyRates(curCode);
      if (res?.success || res?.Success) {
        setMOp(getVal(res, "MasterCurrencyOperator", "masterCurrencyOperator") || "*");
        setSOp(getVal(res, "StockCurrencyOperator", "stockCurrencyOperator") || "*");
        const mSym = getVal(res, "MasterSymbol", "masterSymbol");
        const sSym = getVal(res, "StockSymbol", "stockSymbol");
        if (mSym) setMasterSymbol(mSym);
        if (sSym) setStockSymbol(sSym);
        setForm((prev) => ({
          ...prev,
          baseRate: toNum(res.baseRate ?? res.BaseRate, prev.baseRate),
          sRate: toNum(res.sBaseRate ?? res.SBaseRate, prev.sRate)
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPageData = async () => {
    const res = await getIncomeExpensePageData();
    if (!(res?.success || res?.Success)) {
      toast.error(res?.Data || res?.data || t("Failed to load page data."));
      return null;
    }
    const d = res.Data || res.data || {};
    const curs = mapBasic(d.CurrencyList || d.currencyList);
    setCurrencyOpts(curs);
    return {
      curs,
      defaultCurrencyCode: d.DefaultCurrencyCode || d.defaultCurrencyCode,
      mBaseRate: toNum(d.MBaseRate ?? d.mBaseRate, 0),
      sBaseRate: toNum(d.SBaseRate ?? d.sBaseRate, 0)
    };
  };

  const loadFilteredList = async (transDate) => {
    if (!showInlineList) return;
    setListLoading(true);
    try {
      const res = await getIncomeExpenseFilter(transDate);
      if (res?.success || res?.Success) {
        setRows(res.Data || res.data || []);
      } else {
        toast.warning(res?.Data || res?.data || t("Failed to load list."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load list."));
    } finally {
      setListLoading(false);
    }
  };

  const loadDetail = async () => {
    if (!editId) return;
    const res = await getIncomeExpenseDetail(editId);
    if (!(res?.success || res?.Success)) {
      toast.error(res?.Data || res?.data || t("Record not found."));
      return;
    }
    const d = res.Data || res.data || {};
    const vtype = String(getVal(d, "Vtype", "vtype") || "").toUpperCase();
    const mainacc = toNum(d.mainacc);
    const trnacc = toNum(d.trnacc);
    const cName = getVal(d, "CAccount", "cAccount");
    const dName = getVal(d, "DAccount", "dAccount");

    // MVC EditIncomeExpense / Add EditIncomeExpense:
    // PAY: Main=CAccount/mainacc, Party=DAccount/trnacc
    // REC: Main=DAccount/trnacc, Party=CAccount/mainacc
    if (vtype === "PAY") {
      setMainAccount(mainacc ? { value: String(mainacc), label: cName || String(mainacc) } : null);
      setPartyAccount(trnacc ? { value: String(trnacc), label: dName || String(trnacc) } : null);
    } else {
      setMainAccount(trnacc ? { value: String(trnacc), label: dName || String(trnacc) } : null);
      setPartyAccount(mainacc ? { value: String(mainacc), label: cName || String(mainacc) } : null);
    }

    const amount = Number(d.Amount ?? d.amount ?? 0);
    const curCode = String(d.CurCode ?? d.curCode ?? "");
    setForm({
      gcode: String(d.GCODE ?? d.gcode ?? editId),
      transDate: toLocalDateStr(d.Date ?? d.date) || todayIso(),
      currency: curCode,
      baseRate: toNum(d.MasterCurrencyRate ?? d.masterCurrencyRate, 0),
      sRate: toNum(d.StockCurrencyRate ?? d.stockCurrencyRate, 0),
      rec: vtype === "REC" ? amount.toFixed(2) : "0.00",
      paid: vtype === "PAY" ? amount.toFixed(2) : "0.00",
      desc: d.disc ?? d.Disc ?? ""
    });
    setInlineEdit(true);

    if (curCode) await applyCurrencyRates(curCode);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const page = await loadPageData();
      if (isEdit) {
        await loadDetail();
      } else if (page?.curs?.length) {
        const defaultCur = page.defaultCurrencyCode
          ? page.curs.find((c) => String(c.value) === String(page.defaultCurrencyCode))
          : page.curs[0];
        if (defaultCur) {
          setForm((prev) => ({
            ...prev,
            currency: defaultCur.value,
            baseRate: page.mBaseRate,
            sRate: page.sBaseRate
          }));
          await applyCurrencyRates(defaultCur.value);
        }
      }
      setLoading(false);
    })();
  }, [editId, isEdit]);

  useEffect(() => {
    if (!loading && showInlineList) {
      loadFilteredList(form.transDate);
    }
  }, [loading, form.transDate, showInlineList]);

  const clearFields = () => {
    setForm((prev) => ({
      ...prev,
      gcode: "",
      rec: "0.00",
      paid: "0.00",
      desc: ""
    }));
    setMainAccount(null);
    setPartyAccount(null);
    setInlineEdit(false);
  };

  const handleAmountChange = (field, value) => {
    const nextRec = field === "rec" ? toNum(value) : toNum(form.rec);
    const nextPaid = field === "paid" ? toNum(value) : toNum(form.paid);
    if ((nextRec > 0 || nextPaid > 0) && nextRec > 0 && nextPaid > 0) {
      toast.warning(t("Income and Expense Both are not allowed"));
      setForm((prev) => ({ ...prev, rec: "0.00", paid: "0.00" }));
      return;
    }
    setField(field, value);
  };

  const buildPayload = () => ({
    GCODE: form.gcode || undefined,
    TransDate: form.transDate,
    mainacc: toNum(mainAccount?.value),
    trnacc: toNum(partyAccount?.value),
    Rec: toNum(form.rec),
    Paid: toNum(form.paid),
    CurCode: toNum(form.currency),
    BaseRate: toNum(form.baseRate),
    SRate: toNum(form.sRate),
    disc: form.desc || "",
    MOp: mOp || "*",
    SOp: sOp || "*"
  });

  const validate = () => {
    if (!mainAccount?.value) {
      toast.warning(t("Please select Main Account"));
      return false;
    }
    if (!partyAccount?.value) {
      toast.warning(t("Please select Transaction Account"));
      return false;
    }
    if (String(mainAccount.value) === String(partyAccount.value)) {
      toast.warning(t("Not Select Same Account."));
      return false;
    }
    const rec = toNum(form.rec);
    const paid = toNum(form.paid);
    if (!(rec > 0 || paid > 0) || (rec > 0 && paid > 0)) {
      toast.warning(t("Income and Expense Both are not allowed"));
      return false;
    }
    if (!form.currency) {
      toast.warning(t("Please select Currency."));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (isEdit || inlineEdit) {
        const res = await editIncomeExpense(payload);
        if (res?.success || res?.Success) {
          if (isEdit) {
            navigate("/payment/income-expense-list", {
              state: { successMessage: res?.Data || res?.data || t("Income Expense Updated successfully.") }
            });
          } else {
            toast.success(res?.Data || res?.data || t("Income Expense Updated successfully."));
            clearFields();
            loadFilteredList(form.transDate);
          }
        } else {
          toast.error(res?.Data || res?.data || t("Save failed."));
        }
      } else {
        const res = await addIncomeExpense(payload);
        if (res?.success || res?.Success) {
          toast.success(res?.Data || res?.data || t("Income Expense Save successfully."));
          setForm((prev) => ({ ...prev, rec: "0.00", paid: "0.00", desc: "" }));
          loadFilteredList(form.transDate);
        } else {
          toast.error(res?.Data || res?.data || t("Save failed."));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Save failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const fillFromRow = async (gcode) => {
    try {
      const res = await getIncomeExpenseDetail(gcode);
      if (!(res?.success || res?.Success)) {
        toast.error(res?.Data || res?.data || t("Could not fetch data"));
        return;
      }
      const d = res.Data || res.data || {};
      const vtype = String(getVal(d, "Vtype", "vtype") || "").toUpperCase();
      const mainacc = toNum(d.mainacc);
      const trnacc = toNum(d.trnacc);
      const cName = getVal(d, "CAccount", "cAccount");
      const dName = getVal(d, "DAccount", "dAccount");
      const amount = Number(d.Amount ?? d.amount ?? 0);
      const curCode = String(d.CurCode ?? d.curCode ?? "");

      if (vtype === "PAY") {
        setMainAccount(mainacc ? { value: String(mainacc), label: cName || String(mainacc) } : null);
        setPartyAccount(trnacc ? { value: String(trnacc), label: dName || String(trnacc) } : null);
      } else {
        setMainAccount(trnacc ? { value: String(trnacc), label: dName || String(trnacc) } : null);
        setPartyAccount(mainacc ? { value: String(mainacc), label: cName || String(mainacc) } : null);
      }

      setForm((prev) => ({
        ...prev,
        gcode: String(d.GCODE ?? d.gcode ?? gcode),
        transDate: toLocalDateStr(d.Date ?? d.date) || prev.transDate,
        currency: curCode || prev.currency,
        baseRate: toNum(d.MasterCurrencyRate ?? d.masterCurrencyRate, prev.baseRate),
        sRate: toNum(d.StockCurrencyRate ?? d.stockCurrencyRate, prev.sRate),
        rec: vtype === "REC" ? amount.toFixed(2) : "0.00",
        paid: vtype === "PAY" ? amount.toFixed(2) : "0.00",
        desc: d.disc ?? d.Disc ?? ""
      }));
      setInlineEdit(true);
      if (curCode) await applyCurrencyRates(curCode);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      toast.error(t("Could not fetch data"));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteIncomeExpense(deleteTarget.gcode);
      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || t("Income & Expense Record Deleted."));
        loadFilteredList(form.transDate);
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
      t("GCode"),
      t("TransDate"),
      t("Vtype"),
      t("MainAccount"),
      t("PartyAccount"),
      t("Amount"),
      t("Symbol"),
      `${masterSymbol} Amt`,
      `${stockSymbol} Amt`,
      t("disc")
    ];
    const excelRows = rows.map((r) => [
      getVal(r, "GCODE", "gcode"),
      fmtDate(getVal(r, "Date", "date")),
      getVal(r, "Vtype", "vtype"),
      getVal(r, "DAccount", "dAccount"),
      getVal(r, "CAccount", "cAccount"),
      fmtNum(getVal(r, "Amount", "amount")),
      getVal(r, "Symbol", "symbol"),
      fmtNum(getVal(r, "MasterCurrencyAmount", "masterCurrencyAmount")),
      fmtNum(getVal(r, "StockCurrencyAmount", "stockCurrencyAmount")),
      getVal(r, "disc", "Disc")
    ]);
    const result = await exportToExcel(headers, excelRows, "IncomeExpenseList", "IncomeExpenseList");
    if (!result?.success) toast.error(t("Failed to generate Excel file."));
  };

  const columns = useMemo(
    () => [
      {
        header: t("Action"),
        id: "actions",
        enableColumnFilter: false,
        cell: ({ row }) => {
          const gcode = getVal(row.original, "GCODE", "gcode");
          return (
            <div className="d-flex gap-1 justify-content-center">
              {!isEdit && (
                <button
                  type="button"
                  className="btn btn-soft-primary btn-sm p-1"
                  title={t("Edit")}
                  onClick={() => fillFromRow(gcode)}
                >
                  <i className="ri-pencil-line" />
                </button>
              )}
              <button
                type="button"
                className="btn btn-soft-danger btn-sm p-1"
                title={t("Delete")}
                onClick={() => {
                  setDeleteTarget({ gcode });
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
        header: t("GCode"),
        accessorKey: "GCODE",
        accessorFn: (row) => getVal(row, "GCODE", "gcode"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("TransDate"),
        accessorKey: "Date",
        accessorFn: (row) => fmtDate(getVal(row, "Date", "date")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("Vtype"),
        accessorKey: "Vtype",
        accessorFn: (row) => getVal(row, "Vtype", "vtype"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("MainAccount"),
        accessorKey: "DAccount",
        accessorFn: (row) => getVal(row, "DAccount", "dAccount"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("PartyAccount"),
        accessorKey: "CAccount",
        accessorFn: (row) => getVal(row, "CAccount", "cAccount"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        accessorFn: (row) => fmtNum(getVal(row, "Amount", "amount")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        cell: ({ row }) => (
          <span className="text-end d-block">{fmtNum(getVal(row.original, "Amount", "amount"))}</span>
        )
      },
      {
        header: t("Symbol"),
        accessorKey: "Symbol",
        accessorFn: (row) => getVal(row, "Symbol", "symbol"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: `${masterSymbol} Amt`,
        accessorKey: "MasterCurrencyAmount",
        accessorFn: (row) => fmtNum(getVal(row, "MasterCurrencyAmount", "masterCurrencyAmount")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: `${stockSymbol} Amt`,
        accessorKey: "StockCurrencyAmount",
        accessorFn: (row) => fmtNum(getVal(row, "StockCurrencyAmount", "stockCurrencyAmount")),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      },
      {
        header: t("disc"),
        accessorKey: "disc",
        accessorFn: (row) => getVal(row, "disc", "Disc"),
        enableColumnFilter: true,
        filterFn: customStringFilterFn
      }
    ],
    [t, isEdit, masterSymbol, stockSymbol]
  );

  const pageTitle = isEdit ? t("Edit Income & Expense") : t("Add Income & Expense");
  document.title = pageTitle;

  const accountSelectProps = (opts, value, onChange, input, setInput, setOpts, loading, placeholder) => ({
    styles: selectStyles,
    options: opts,
    value,
    onChange,
    onInputChange: (v, meta) => {
      if (meta.action === "input-change") setInput(v);
      else if (meta.action === "input-blur" || meta.action === "menu-close") {
        setInput("");
        setOpts([]);
      }
    },
    isLoading: loading,
    placeholder,
    isClearable: true
  });

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center py-5">{t("Loading...")}</div>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <ToastContainer closeButton={false} />
      <Container fluid>
        <BreadCrumb title={pageTitle} pageTitle={t("Payment")} />

        <Card className="shadow-sm border-0 rounded-3 mb-3">
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom-0 bg-transparent">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className="ri-exchange-dollar-line fs-20" />
              {pageTitle}
            </h5>
            <Button color="light" size="sm" onClick={() => navigate("/payment/income-expense-list")}>
              <i className="ri-arrow-left-line me-1" />
              {t("Back to List")}
            </Button>
          </CardHeader>
          <CardBody className="pt-0">
            <Row className="g-2">
              <Col md={4} sm={6}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    <b>{t("Main Account")}</b>
                    <span className="text-danger ms-1">*</span>
                  </Label>
                  <Select
                    {...accountSelectProps(
                      mainOpts,
                      mainAccount,
                      setMainAccount,
                      mainInput,
                      setMainInput,
                      setMainOpts,
                      mainLoading,
                      t("Main Account")
                    )}
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={2} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    <b>{t("Transaction Date")}</b>
                  </Label>
                  <Input
                    type="date"
                    className="form-control-sm"
                    style={fieldH}
                    value={form.transDate}
                    onChange={(e) => setField("transDate", e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md={3} sm={6}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    <b>{t("Transaction Account")}</b>
                    <span className="text-danger ms-1">*</span>
                  </Label>
                  <Select
                    {...accountSelectProps(
                      partyOpts,
                      partyAccount,
                      setPartyAccount,
                      partyInput,
                      setPartyInput,
                      setPartyOpts,
                      partyLoading,
                      t("Transaction Account")
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={2} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    {t("Rec.[Dr.]")}
                    {showRecStar && <span className="text-danger ms-1">*</span>}
                  </Label>
                  <Input
                    type="number"
                    className="form-control-sm text-end"
                    style={fieldH}
                    value={form.rec}
                    onChange={(e) => handleAmountChange("rec", e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md={2} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    {t("Paid.[Cr.]")}
                    {showPaidStar && <span className="text-danger ms-1">*</span>}
                  </Label>
                  <Input
                    type="number"
                    className="form-control-sm text-end"
                    style={fieldH}
                    value={form.paid}
                    onChange={(e) => handleAmountChange("paid", e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md={1} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">{t("Currency")}</Label>
                  <Select
                    styles={selectStyles}
                    options={currencyOpts}
                    value={currencyOpts.find((o) => o.value === String(form.currency)) || null}
                    onChange={async (o) => {
                      const code = o?.value || "";
                      setField("currency", code);
                      await applyCurrencyRates(code);
                    }}
                    placeholder={t("Currency")}
                  />
                </FormGroup>
              </Col>
              <Col md={1} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    <span className="text-primary">{masterSymbol}</span>
                    {mOp && <span className="text-danger ms-1">{mOp}</span>}
                  </Label>
                  <Input type="number" className="form-control-sm" style={fieldH} value={form.baseRate} readOnly />
                </FormGroup>
              </Col>
              <Col md={1} sm={4}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    <span className="text-primary">{stockSymbol}</span>
                    {sOp && <span className="text-danger ms-1">{sOp}</span>}
                  </Label>
                  <Input type="number" className="form-control-sm" style={fieldH} value={form.sRate} readOnly />
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-2 align-items-end">
              <Col md={4} sm={8}>
                <FormGroup className="mb-2">
                  <Label className="form-label mb-1">
                    <b>{t("Description")}</b>
                  </Label>
                  <Input
                    type="textarea"
                    rows={4}
                    value={form.desc}
                    onChange={(e) => setField("desc", e.target.value)}
                    placeholder={t("Description")}
                  />
                </FormGroup>
              </Col>
              <Col md={4} sm={8} className="mb-2 d-flex gap-2 flex-wrap">
                {!isEdit && !inlineEdit && (
                  <Button color="primary" size="sm" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? t("Submitting...") : t("Save")}
                  </Button>
                )}
                {(isEdit || inlineEdit) && (
                  <Button color="primary" size="sm" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? t("Submitting...") : t("Update")}
                  </Button>
                )}
                {!isEdit && inlineEdit && (
                  <Button color="danger" size="sm" onClick={clearFields}>
                    {t("Cancel")}
                  </Button>
                )}
              </Col>
            </Row>
          </CardBody>
        </Card>

        {showInlineList && (
          <Card className="shadow-sm border-0 rounded-3">
            <CardBody>
              <div className="d-flex justify-content-end mb-2">
                <Button color="soft-success" className="btn-sm" onClick={handleExport}>
                  <i className="ri-file-excel-2-line me-1" />
                  {t("Excel")}
                </Button>
              </div>
              {listLoading ? (
                <div className="text-center text-muted py-4">{t("Loading...")}</div>
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
        )}
      </Container>

      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
        <div
          className="modal-header justify-content-between align-items-center py-3 px-4"
          style={{ backgroundColor: "rgb(238, 94, 70)", borderBottom: "none" }}
        >
          <h5 className="modal-title m-0 fw-medium" style={{ color: "#212529" }}>
            {t("Confirm Delete")}
          </h5>
          <button type="button" className="btn-close" onClick={() => setDeleteModal(false)} aria-label="Close" />
        </div>
        <ModalBody className="py-4">
          <div className="text-center">
            <h3 className="fw-bold mb-3" style={{ color: "#495057" }}>
              {t("Are You Sure ??")}
            </h3>
            <p className="text-muted mb-4 fs-16 lh-base">
              {t("Selected Payment/Reciept Removed !!")}
              {deleteTarget?.gcode && (
                <>
                  <br />
                  <strong>{t("GCode")} :</strong> {deleteTarget.gcode}
                </>
              )}
            </p>
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
    </div>
  );
};

export default IncomeExpenseForm;
