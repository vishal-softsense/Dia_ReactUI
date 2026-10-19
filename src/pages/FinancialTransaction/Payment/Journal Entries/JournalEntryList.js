import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button, Card, CardBody, Container, Modal, ModalBody } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../../helpers/excel_helper";
import {
    deleteJournalEntry,
    getCurrencyRates,
    getJournalEntryList,
    getJournalEntryPageData
} from "../../../../helpers/fakebackend_helper";

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

const JournalEntryList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [masterSymbol, setMasterSymbol] = useState("");
    const [stockSymbol, setStockSymbol] = useState("");

    // MVC LoginController: DefaultCurrency → GetStockAndMasterCurrencyRate → Session["MSymbol"] / Session["SSymbol"]
    // MVC list headers: "@(Session["MSymbol"]) Amt" / "@(Session["SSymbol"]) Amt"
    useEffect(() => {
        const loadSymbols = async () => {
            try {
                const pageRes = await getJournalEntryPageData();
                if (!(pageRes?.success || pageRes?.Success)) return;
                const pageData = pageRes.Data || pageRes.data || {};
                const defCode = String(
                    pageData.DefaultCurrencyCode || pageData.defaultCurrencyCode || ""
                );
                if (!defCode) return;

                const rateRes = await getCurrencyRates(defCode);
                if (!(rateRes?.success || rateRes?.Success)) return;

                const mSym = getVal(rateRes, "MasterSymbol", "masterSymbol");
                const sSym = getVal(rateRes, "StockSymbol", "stockSymbol");
                if (mSym) setMasterSymbol(String(mSym));
                if (sSym) setStockSymbol(String(sSym));
            } catch (err) {
                console.error(err);
            }
        };
        loadSymbols();
    }, []);

    useEffect(() => {
        if (location.state?.successMessage) {
            toast.success(location.state.successMessage);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const loadList = async () => {
        setLoading(true);
        try {
            const res = await getJournalEntryList();
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
            const res = await deleteJournalEntry(deleteTarget.gcode);
            if (res?.success || res?.Success) {
                toast.success(res?.Data || res?.data || t("JV/Expence Record Deleted."));
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
        const headers = [
            t("GCode"),
            t("Date"),
            t("Vtype"),
            t("Credit Acc"),
            t("Debit Acc"),
            t("Amount"),
            t("Symbol"),
            `${masterSymbol} Amt`,
            `${stockSymbol} Amt`
        ];
        const excelRows = rows.map((r) => [
            getVal(r, "GCODE", "gcode"),
            fmtDate(getVal(r, "Date", "date")),
            getVal(r, "Vtype", "vtype"),
            getVal(r, "CAccount", "cAccount"),
            getVal(r, "DAccount", "dAccount"),
            fmtNum(getVal(r, "Amount", "amount")),
            getVal(r, "Symbol", "symbol"),
            fmtNum(getVal(r, "MasterCurrencyAmount", "masterCurrencyAmount")),
            fmtNum(getVal(r, "StockCurrencyAmount", "stockCurrencyAmount"))
        ]);
        const result = await exportToExcel(headers, excelRows, "JVList", "JVList");
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
                            <button
                                type="button"
                                className="btn btn-soft-primary btn-sm p-1"
                                title={t("Edit")}
                                onClick={() => navigate(`/payment/edit-journal-entry?Id=${gcode}`)}
                            >
                                <i className="ri-pencil-line" />
                            </button>
                            <button
                                type="button"
                                className="btn btn-soft-danger btn-sm p-1"
                                title={t("Delete")}
                                onClick={() => {
                                    setDeleteTarget({
                                        gcode,
                                        date: fmtDate(getVal(row.original, "Date", "date")),
                                        credit: getVal(row.original, "CAccount", "cAccount"),
                                        debit: getVal(row.original, "DAccount", "dAccount")
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
                header: t("GCode"),
                accessorKey: "GCODE",
                accessorFn: (row) => getVal(row, "GCODE", "gcode"),
                enableColumnFilter: true,
                filterFn: customStringFilterFn
            },
            {
                header: t("Date"),
                accessorKey: "Date",
                accessorFn: (row) => fmtDate(getVal(row, "Date", "date")),
                enableColumnFilter: true,
                filterFn: customStringFilterFn,
                cell: dateCell
            },
            {
                header: t("Vtype"),
                accessorKey: "Vtype",
                accessorFn: (row) => getVal(row, "Vtype", "vtype"),
                enableColumnFilter: true,
                filterFn: customStringFilterFn
            },
            {
                header: t("Credit Acc"),
                accessorKey: "CAccount",
                accessorFn: (row) => getVal(row, "CAccount", "cAccount"),
                enableColumnFilter: true,
                filterFn: customStringFilterFn
            },
            {
                header: t("Debit Acc"),
                accessorKey: "DAccount",
                accessorFn: (row) => getVal(row, "DAccount", "dAccount"),
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
                filterFn: customStringFilterFn,
                cell: ({ row }) => (
                    <span className="text-end d-block">
                        {fmtNum(getVal(row.original, "MasterCurrencyAmount", "masterCurrencyAmount"))}
                    </span>
                )
            },
            {
                header: `${stockSymbol} Amt`,
                accessorKey: "StockCurrencyAmount",
                accessorFn: (row) => fmtNum(getVal(row, "StockCurrencyAmount", "stockCurrencyAmount")),
                enableColumnFilter: true,
                filterFn: customStringFilterFn,
                cell: ({ row }) => (
                    <span className="text-end d-block">
                        {fmtNum(getVal(row.original, "StockCurrencyAmount", "stockCurrencyAmount"))}
                    </span>
                )
            }
        ],
        [t, navigate, masterSymbol, stockSymbol]
    );

    document.title = `${t("Journal Entry List")} | ${t("Admin")}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Journal Entry List")} pageTitle={t("Payment")} />

                    <Card className="shadow-sm border-0 rounded-3 mb-3">
                        <CardBody className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
                            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                                <i className="ri-bank-card-line fs-20" />
                                {t("Journal Entry List")}
                            </h5>
                            <div className="d-flex gap-2 flex-wrap">
                                <Button color="soft-success" className="btn-sm" onClick={handleExport}>
                                    <i className="ri-file-excel-2-line me-1" />
                                    {t("Excel")}
                                </Button>
                                <Link to="/payment/add-journal-entry" className="btn btn-primary btn-sm">
                                    <i className="ri-add-line me-1" />
                                    {t("Add Journal Entry")}
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
                            <lord-icon
                                src="https://cdn.lordicon.com/gsqxdxog.json"
                                trigger="loop"
                                colors="primary:#f7b84b,secondary:#f06548"
                                style={{ width: "100px", height: "100px" }}
                            />
                            <div className="mt-4 pt-2 mx-4 mx-sm-5">
                                <h3 className="fw-bold mb-3" style={{ color: "#495057" }}>
                                    {t("Are You Sure ??")}
                                </h3>
                                <p className="text-muted mb-4 fs-16 lh-base">
                                    {t("Selected JV/Expences Removed !!")}
                                    {deleteTarget?.gcode && (
                                        <>
                                            <br />
                                            <strong>{t("GCode")} :</strong> {deleteTarget.gcode}
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

export default JournalEntryList;
