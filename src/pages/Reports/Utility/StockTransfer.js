import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
    Button,
    Card,
    CardBody,
    Container,
    Modal,
    ModalBody,
    Spinner
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../helpers/excel_helper";
import {
    deleteStockTransfer,
    getStockTransferList
} from "../../../helpers/fakebackend_helper";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Display as dd-MMM-yyyy (full 4-digit year). Avoids truncating "28-Aug-2026" via slice(0,10). */
const formatLocalDate = (date) => {
    if (!date) return "";
    const text = String(date).trim();
    const mmmMatch = text.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
    if (mmmMatch) {
        const day = mmmMatch[1].padStart(2, "0");
        return `${day}-${mmmMatch[2]}-${mmmMatch[3]}`;
    }
    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00`);
        if (!Number.isNaN(d.getTime())) {
            return `${String(d.getDate()).padStart(2, "0")}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
        }
    }
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return text;
    return `${String(d.getDate()).padStart(2, "0")}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
};

const getField = (row, key) => {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
    const lower = key.charAt(0).toLowerCase() + key.slice(1);
    if (row?.[lower] !== undefined && row?.[lower] !== null) return row[lower];
    const upper = key.charAt(0).toUpperCase() + key.slice(1);
    if (row?.[upper] !== undefined && row?.[upper] !== null) return row[upper];
    return undefined;
};

const MvcSwalConfirm = ({ open, title, text, confirmText, cancelText, onConfirm, onCancel }) => (
    <Modal isOpen={open} toggle={onCancel} centered className="modal-dialog-centered" contentClassName="border-0 shadow" style={{ maxWidth: 440 }}>
        <ModalBody className="p-4 text-center">
            <div
                className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: "4px solid #f7b84b",
                    color: "#f7b84b",
                    fontSize: 48,
                    fontWeight: 600,
                    lineHeight: 1
                }}
                aria-hidden="true"
            >
                !
            </div>
            <h2 className="fw-semibold mb-2" style={{ fontSize: 22, color: "#495057" }}>{title}</h2>
            <p className="text-muted mb-4 fs-16">{text}</p>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
                <button type="button" className="btn btn-primary" onClick={onConfirm}>{confirmText}</button>
                <button type="button" className="btn btn-danger" onClick={onCancel}>{cancelText}</button>
            </div>
        </ModalBody>
    </Modal>
);

const MvcSwalResult = ({ open, type, title, text, confirmText, onClose }) => {
    const isSuccess = type === "success";
    const iconColor = isSuccess ? "#0ab39c" : "#f06548";
    const iconBorder = isSuccess ? "rgba(10, 179, 156, 0.3)" : "#f06548";

    return (
        <Modal isOpen={open} toggle={onClose} centered className="modal-dialog-centered" contentClassName="border-0 shadow" style={{ maxWidth: 440 }}>
            <ModalBody className="p-4 text-center">
                <div
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        border: `4px solid ${iconBorder}`,
                        color: iconColor,
                        fontSize: isSuccess ? 42 : 48,
                        fontWeight: 600,
                        lineHeight: 1
                    }}
                    aria-hidden="true"
                >
                    {isSuccess ? "✓" : "!"}
                </div>
                <h2 className="fw-semibold mb-2" style={{ fontSize: 22, color: "#495057" }}>{title}</h2>
                <p className="text-muted mb-4 fs-16">{text}</p>
                <button type="button" className="btn btn-success" onClick={onClose}>{confirmText}</button>
            </ModalBody>
        </Modal>
    );
};

const StockTransfer = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(true);
    const [busy, setBusy] = useState(false);
    const [rows, setRows] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
    const [resultModal, setResultModal] = useState({ open: false, type: "success", title: "", text: "" });

    const loadList = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getStockTransferList();
            if (response?.success === false) {
                setAuthorized(false);
                toast.error(response?.message || t("You are not authorized to perform this task."));
                return;
            }
            setAuthorized(true);
            const data = response?.Data || response?.data || [];
            const list = Array.isArray(data) ? [...data] : [];
            // Newest saved entry first (highest Code)
            list.sort((a, b) => (Number(getField(b, "Code")) || 0) - (Number(getField(a, "Code")) || 0));
            setRows(list);
        } catch (err) {
            const status = err?.response?.status || err?.status;
            if (status === 403) {
                setAuthorized(false);
                toast.error(t("You are not authorized to perform this task."));
            } else {
                toast.error(err?.message || t("Error loading Stock Transfer list."));
            }
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const handleDelete = async () => {
        const id = confirmDelete.id;
        setConfirmDelete({ open: false, id: null });
        if (!id) return;

        setBusy(true);
        try {
            const response = await deleteStockTransfer(id);
            if (response?.success === true || response?.Success === true) {
                setResultModal({
                    open: true,
                    type: "success",
                    title: t("Success"),
                    text: response?.Data || response?.data || t("Record Deleted.")
                });
                await loadList();
            } else {
                setResultModal({
                    open: true,
                    type: "error",
                    title: t("Warning!"),
                    text: response?.Data || response?.data || t("Delete failed.")
                });
            }
        } catch (err) {
            setResultModal({
                open: true,
                type: "error",
                title: t("Warning!"),
                text: err?.response?.data?.Data || err?.message || t("Error")
            });
        } finally {
            setBusy(false);
        }
    };

    const handleExport = async () => {
        if (!rows.length) {
            toast.error(t("No table found!"));
            return;
        }
        const headers = ["Date", "FLot", "F_LotNo", "FItemRate", "carats", "TLot", "T_LotNo", "TItemRate"];
        const exportRows = rows.map(r => [
            getField(r, "SPdate") ? formatLocalDate(getField(r, "SPdate")) : "",
            getField(r, "FLot") || "",
            getField(r, "Fname") || "",
            getField(r, "FItemRate") ?? "",
            getField(r, "carats") ?? "",
            getField(r, "TLot") || "",
            getField(r, "Tname") || "",
            getField(r, "TItemRate") ?? ""
        ]);
        const result = await exportToExcel(headers, exportRows, "StockTransfer", "StockTransferList");
        if (!result?.success) toast.error(t("Export failed."));
    };

    const columns = useMemo(
        () => [
            {
                header: t("Action"),
                id: "action",
                enableColumnFilter: false,
                enableSorting: false,
                cell: ({ row }) => {
                    const code = getField(row.original, "Code");
                    return (
                        <Button
                            color="soft-danger"
                            size="sm"
                            className="btn-icon"
                            title={t("Delete")}
                            onClick={() => setConfirmDelete({ open: true, id: code })}
                        >
                            <i className="ri-delete-bin-5-line" />
                        </Button>
                    );
                }
            },
            {
                header: t("Date"),
                accessorKey: "SPdate",
                enableColumnFilter: true,
                cell: ({ row }) => formatLocalDate(getField(row.original, "SPdate"))
            },
            {
                header: t("FLot"),
                accessorKey: "FLot",
                enableColumnFilter: true,
                cell: ({ row }) => getField(row.original, "FLot") || ""
            },
            {
                header: t("F_LotNo"),
                accessorKey: "Fname",
                enableColumnFilter: true,
                cell: ({ row }) => getField(row.original, "Fname") || ""
            },
            {
                header: t("FItemRate"),
                accessorKey: "FItemRate",
                enableColumnFilter: true,
                enableSorting: false,
                cell: ({ row }) => getField(row.original, "FItemRate") ?? ""
            },
            {
                header: t("carats"),
                accessorKey: "carats",
                enableColumnFilter: true,
                enableSorting: false,
                cell: ({ row }) => getField(row.original, "carats") ?? ""
            },
            {
                header: t("TLot"),
                accessorKey: "TLot",
                enableColumnFilter: true,
                cell: ({ row }) => getField(row.original, "TLot") || ""
            },
            {
                header: t("T_LotNo"),
                accessorKey: "Tname",
                enableColumnFilter: true,
                cell: ({ row }) => getField(row.original, "Tname") || ""
            },
            {
                header: t("TItemRate"),
                accessorKey: "TItemRate",
                enableColumnFilter: true,
                cell: ({ row }) => getField(row.original, "TItemRate") ?? ""
            }
        ],
        [t]
    );

    document.title = `${t("Stock Transfer List")} | ${t("Utility")}`;

    return (
        <React.Fragment>
            <ToastContainer position="top-right" autoClose={2500} />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Stock Transfer List")} pageTitle={t("Utility")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <i className="ri-arrow-left-right-line fs-20 text-primary" />
                            {t("Stock Transfer List")}
                        </h5>
                        <div className="d-flex flex-wrap gap-2">
                            <Button color="primary" outline disabled={!authorized || !rows.length} onClick={handleExport}>
                                {t("Excel")}
                            </Button>
                            <Link to="/Stock/Stock-transfer" className={`btn btn-primary${!authorized ? " disabled" : ""}`}>
                                {t("Add Stock Transfer")}
                            </Link>
                        </div>
                    </div>

                    {!authorized ? (
                        <Card className="shadow-sm border-0">
                            <CardBody className="text-center text-danger py-5">
                                {t("You are not authorized to perform this task.")}
                            </CardBody>
                        </Card>
                    ) : loading ? (
                        <div className="text-center py-5"><Spinner color="primary" /></div>
                    ) : (
                        <Card className="shadow-sm border-0">
                            <CardBody>
                                {rows.length === 0 ? (
                                    <div className="text-center text-muted py-4">{t("No data available.")}</div>
                                ) : (
                                    <TableContainer
                                        columns={columns}
                                        data={rows}
                                        isGlobalFilter={true}
                                        isShowEntries={true}
                                        customPageSize={500}
                                        customPageSizes={[500, 1000, 1500]}
                                        divClass="table-responsive table-card mb-3"
                                        tableClass="align-middle table-nowrap mb-0 table-hover table-striped table-bordered text-center"
                                        theadClass="table-light"
                                        SearchPlaceholder={t("Filter results...")}
                                    />
                                )}
                            </CardBody>
                        </Card>
                    )}
                </Container>
            </div>

            {busy ? (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ background: "rgba(255,255,255,0.55)", zIndex: 1055 }}
                >
                    <Spinner color="primary" />
                </div>
            ) : null}

            <MvcSwalConfirm
                open={confirmDelete.open}
                title={t("Are You Sure ??")}
                text={t("Selected record will be Removed !!")}
                confirmText={t("Yes, remove it")}
                cancelText={t("Cancel")}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete({ open: false, id: null })}
            />

            <MvcSwalResult
                open={resultModal.open}
                type={resultModal.type}
                title={resultModal.title}
                text={resultModal.text}
                confirmText={t("OK")}
                onClose={() => setResultModal(prev => ({ ...prev, open: false }))}
            />
        </React.Fragment>
    );
};

export default StockTransfer;
