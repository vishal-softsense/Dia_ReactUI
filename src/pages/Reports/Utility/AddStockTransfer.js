import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Select from "react-select";
import {
    Button,
    Card,
    CardBody,
    Col,
    Container,
    Input,
    Label,
    Modal,
    ModalBody,
    Row,
    Spinner
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import {
    getAllLotNoList,
    getStockTransferAddPermission,
    getStockTransferLotDetails,
    getStockTransferLotNoList,
    saveStockTransfer
} from "../../../helpers/fakebackend_helper";

const getField = (row, key) => {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
    const lower = key.charAt(0).toLowerCase() + key.slice(1);
    if (row?.[lower] !== undefined && row?.[lower] !== null) return row[lower];
    return undefined;
};

const debounce = (func, delay) => {
    let timer;
    const wrapped = (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
    wrapped.cancel = () => clearTimeout(timer);
    return wrapped;
};

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

const mapLotOptions = (raw) =>
    (Array.isArray(raw) ? raw : [])
        .map(item => {
            const value = String(item?.id ?? item?.ID ?? item?.name ?? item?.Name ?? "").trim();
            const label = String(
                item?.text ?? item?.Text ?? item?.TextName ?? item?.textName ?? item?.name ?? item?.Name ?? value
            )
                .trim()
                .toUpperCase();
            return value ? { value, label: label || value } : null;
        })
        .filter(Boolean);

const AddStockTransfer = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(true);
    const [busy, setBusy] = useState(false);
    const [trnDate, setTrnDate] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    });
    const [fromLot, setFromLot] = useState(null);
    const [toLot, setToLot] = useState(null);
    const [fItemName, setFItemName] = useState("");
    const [fromPrice, setFromPrice] = useState("");
    const [carats, setCarats] = useState("");
    const [tItemName, setTItemName] = useState("");
    const [toPrice, setToPrice] = useState("");
    const [lotOptions, setLotOptions] = useState([]);
    const [loadingLots, setLoadingLots] = useState(false);
    const [fromLotSearch, setFromLotSearch] = useState("");
    const [toLotSearch, setToLotSearch] = useState("");
    const [resultModal, setResultModal] = useState({ open: false, type: "success", title: "", text: "", reload: false });

    const selectStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: 38,
            backgroundColor: "var(--vz-input-bg, var(--vz-secondary-bg, #fff))",
            borderColor: state.isFocused ? "#80bdff" : "var(--vz-border-color, #ced4da)",
            color: "var(--vz-body-color, #495057)",
            boxShadow: "none"
        }),
        menu: provided => ({
            ...provided,
            zIndex: 9999,
            backgroundColor: "var(--vz-secondary-bg, #fff)",
            color: "var(--vz-body-color, #495057)"
        }),
        menuPortal: provided => ({
            ...provided,
            zIndex: 9999
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? "var(--vz-tertiary-bg, #f3f6f9)" : "transparent",
            color: "var(--vz-body-color, #495057)"
        })
    };

    const loadPermission = useCallback(async () => {
        setLoading(true);
        try {
            const permission = await getStockTransferAddPermission();
            if (permission?.success === false) {
                setAuthorized(false);
                toast.error(permission?.message || t("You are not authorized to perform this task."));
                return;
            }
            setAuthorized(true);
        } catch (err) {
            const status = err?.response?.status || err?.status;
            if (status === 403) {
                setAuthorized(false);
                toast.error(t("You are not authorized to perform this task."));
            } else {
                toast.error(err?.message || t("Error loading Add Stock Transfer."));
            }
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadPermission();
    }, [loadPermission]);

    const fetchLotOptions = useCallback(async (searchText = "") => {
        const term = (searchText || "").trim();
        if (term.length < 1) {
            setLotOptions([]);
            return;
        }

        setLoadingLots(true);
        try {
            // Use proven Jewellery endpoint first (LotNo/ItemName search) — works without Stock Transfer API restart
            let options = [];
            try {
                const response = await getAllLotNoList(term, "");
                const raw = Array.isArray(response) ? response : (response?.data || response?.Data || []);
                options = mapLotOptions(raw);
            } catch {
                options = [];
            }

            if (!options.length) {
                try {
                    const response = await getStockTransferLotNoList(term);
                    const raw = Array.isArray(response) ? response : (response?.data || response?.Data || []);
                    options = mapLotOptions(raw);
                } catch {
                    options = [];
                }
            }

            setLotOptions(options);
        } catch (err) {
            setLotOptions([]);
            toast.error(typeof err === "string" ? err : (err?.message || t("Unable to load lot list.")));
        } finally {
            setLoadingLots(false);
        }
    }, [t]);

    const debouncedFetchLots = useMemo(() => debounce(fetchLotOptions, 300), [fetchLotOptions]);

    useEffect(() => () => debouncedFetchLots.cancel?.(), [debouncedFetchLots]);

    const fillLotDetails = async (lotNo, side) => {
        if (!lotNo) {
            if (side === "from") {
                setFItemName("");
                setFromPrice("");
                setCarats("");
            } else {
                setTItemName("");
                setToPrice("");
            }
            return;
        }

        try {
            const response = await getStockTransferLotDetails(lotNo);
            if (response?.success === true || response?.Success === true) {
                const data = response?.Data || response?.data || [];
                const first = Array.isArray(data) ? data[0] : null;
                if (!first) return;

                if (side === "from") {
                    setFItemName(getField(first, "ItemName") || "");
                    setFromPrice(String(getField(first, "PurchaseRate") ?? ""));
                    setCarats(String(getField(first, "BalanceCarats3Dec") ?? ""));
                } else {
                    setTItemName(getField(first, "ItemName") || "");
                    setToPrice(String(getField(first, "PurchaseRate") ?? ""));
                }
            }
        } catch (err) {
            toast.error(err?.message || t("Unable to fetch lot details."));
        }
    };

    const handleFromLotChange = (option) => {
        setFromLot(option);
        fillLotDetails(option?.value, "from");
    };

    const handleToLotChange = (option) => {
        setToLot(option);
        fillLotDetails(option?.value, "to");
    };

    const handleSubmit = async () => {
        const missing = [];
        if (!trnDate) missing.push(t("Date"));
        if (!fromLot?.value) missing.push(t("From Lot No"));
        if (!String(fItemName || "").trim()) missing.push(t("Item Name"));
        if (!String(fromPrice || "").trim()) missing.push(t("Price"));
        if (!String(carats || "").trim()) missing.push(t("Carats"));
        if (!toLot?.value) missing.push(t("To Lot No"));
        if (!String(tItemName || "").trim()) missing.push(t("Item Name"));
        if (!String(toPrice || "").trim()) missing.push(t("Price"));

        if (missing.length) {
            setResultModal({
                open: true,
                type: "error",
                title: t("Warning"),
                text: t("Please fill all required fields."),
                reload: false
            });
            return;
        }

        const fromPriceNum = Number.isFinite(Number(fromPrice)) ? Number(fromPrice) : NaN;
        const toPriceNum = Number.isFinite(Number(toPrice)) ? Number(toPrice) : NaN;
        const caratsNum = Number.isFinite(Number(carats)) ? Number(carats) : NaN;

        if (Number.isNaN(fromPriceNum) || Number.isNaN(toPriceNum) || Number.isNaN(caratsNum)) {
            setResultModal({
                open: true,
                type: "error",
                title: t("Warning"),
                text: t("Please enter valid Price and Carats."),
                reload: false
            });
            return;
        }

        if (fromLot.value === toLot.value) {
            setResultModal({
                open: true,
                type: "error",
                title: t("Warning"),
                text: t("From Lot No and To Lot No must be different."),
                reload: false
            });
            return;
        }

        setBusy(true);
        try {
            const payload = {
                TrnDate: trnDate,
                Fromlotno: fromLot.value,
                FItemName: fItemName,
                FromPrice: fromPriceNum,
                Carats: caratsNum,
                Tolotno: toLot.value,
                TItemName: tItemName,
                ToPrice: toPriceNum
            };

            const response = await saveStockTransfer(payload);
            if (response?.success === true || response?.Success === true) {
                setResultModal({
                    open: true,
                    type: "success",
                    title: t("Success"),
                    text: response?.Data || response?.data || t("Stock Transfer Record Saved."),
                    reload: true
                });
            } else {
                setResultModal({
                    open: true,
                    type: "error",
                    title: t("Warning"),
                    text: response?.Data || response?.data || t("Save failed."),
                    reload: false
                });
            }
        } catch (err) {
            const status = err?.response?.status || err?.status;
            setResultModal({
                open: true,
                type: "error",
                title: t("Warning"),
                text: status === 403
                    ? t("You are not authorized to perform this task.")
                    : (typeof err === "string" ? err : (err?.message || t("Save failed."))),
                reload: false
            });
        } finally {
            setBusy(false);
        }
    };

    const handleResultClose = () => {
        const shouldReload = resultModal.reload;
        setResultModal(prev => ({ ...prev, open: false }));
        if (shouldReload) {
            setFromLot(null);
            setToLot(null);
            setFItemName("");
            setFromPrice("");
            setCarats("");
            setTItemName("");
            setToPrice("");
            setLotOptions([]);
            setTrnDate(() => {
                const d = new Date();
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                return `${year}-${month}-${day}`;
            });
        }
    };

    document.title = t("Add Stock Transfer") + " | DiaJewSoft";

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t("ADD STOCK TRANSFER")} pageTitle={t("Utility")} />
                <ToastContainer />

                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <h5 className="mb-0 d-flex align-items-center gap-2">
                        <i className="ri-add-circle-line text-primary fs-18" />
                        {t("Add Stock Transfer")}
                    </h5>
                    <div className="d-flex gap-2">
                        <Link to="/Stock/Stock-transfer-list" className="btn btn-soft-primary">
                            {t("Back to List")}
                        </Link>
                        <Button color="primary" onClick={handleSubmit} disabled={busy || !authorized || loading}>
                            {busy ? <Spinner size="sm" /> : t("Submit")}
                        </Button>
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
                            <Row className="g-3 mb-3">
                                <Col lg={2} md={4} sm={6}>
                                    <Label className="form-label fw-semibold">{t("Date")}</Label>
                                    <Input type="date" value={trnDate} onChange={e => setTrnDate(e.target.value)} />
                                </Col>
                            </Row>

                            <Row className="g-3 mb-3">
                                <Col lg={2} md={4} sm={6}>
                                    <Label className="form-label fw-semibold">{t("From Lot No")}</Label>
                                    <Select
                                        options={lotOptions}
                                        value={fromLot}
                                        onChange={handleFromLotChange}
                                        inputValue={fromLotSearch}
                                        onInputChange={(newValue, actionMeta) => {
                                            if (actionMeta.action === "input-change") {
                                                setFromLotSearch(newValue);
                                                debouncedFetchLots(newValue);
                                            } else if (actionMeta.action === "menu-close") {
                                                setFromLotSearch("");
                                            }
                                        }}
                                        placeholder={t("Lot No")}
                                        isClearable
                                        isSearchable
                                        isLoading={loadingLots}
                                        styles={selectStyles}
                                        classNamePrefix="react-select"
                                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                        menuPosition="fixed"
                                        filterOption={() => true}
                                        noOptionsMessage={() =>
                                            !fromLotSearch.trim()
                                                ? t("Type to search lot no")
                                                : (loadingLots ? t("Loading...") : t("No options"))
                                        }
                                    />
                                </Col>
                                <Col lg={2} md={4} sm={6}>
                                    <Label className="form-label fw-semibold">{t("Item Name")}</Label>
                                    <Input value={fItemName} onChange={e => setFItemName(e.target.value)} placeholder={t("Name")} />
                                </Col>
                                <Col lg={2} md={4} sm={6}>
                                    <Label className="form-label fw-semibold">{t("Price")}</Label>
                                    <Input value={fromPrice} onChange={e => setFromPrice(e.target.value)} placeholder={t("Price")} />
                                </Col>
                            </Row>

                            <Row className="g-3 mb-3">
                                <Col lg={2} md={4} sm={6}>
                                    <Label className="form-label fw-semibold">{t("Carats")}</Label>
                                    <Input value={carats} onChange={e => setCarats(e.target.value)} placeholder={t("Carats")} />
                                </Col>
                            </Row>

                            <Row className="g-3">
                                <Col lg={2} md={4} sm={6}>
                                    <Label className="form-label fw-semibold">{t("To Lot No")}</Label>
                                    <Select
                                        options={lotOptions}
                                        value={toLot}
                                        onChange={handleToLotChange}
                                        inputValue={toLotSearch}
                                        onInputChange={(newValue, actionMeta) => {
                                            if (actionMeta.action === "input-change") {
                                                setToLotSearch(newValue);
                                                debouncedFetchLots(newValue);
                                            } else if (actionMeta.action === "menu-close") {
                                                setToLotSearch("");
                                            }
                                        }}
                                        placeholder={t("Lot No")}
                                        isClearable
                                        isSearchable
                                        isLoading={loadingLots}
                                        styles={selectStyles}
                                        classNamePrefix="react-select"
                                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                        menuPosition="fixed"
                                        filterOption={() => true}
                                        noOptionsMessage={() =>
                                            !toLotSearch.trim()
                                                ? t("Type to search lot no")
                                                : (loadingLots ? t("Loading...") : t("No options"))
                                        }
                                    />
                                </Col>
                                <Col lg={2} md={4} sm={6}>
                                    <Label className="form-label fw-semibold">{t("Item Name")}</Label>
                                    <Input value={tItemName} onChange={e => setTItemName(e.target.value)} placeholder={t("Name")} />
                                </Col>
                                <Col lg={2} md={4} sm={6}>
                                    <Label className="form-label fw-semibold">{t("Price")}</Label>
                                    <Input value={toPrice} onChange={e => setToPrice(e.target.value)} placeholder={t("Price")} />
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                )}

                <MvcSwalResult
                    open={resultModal.open}
                    type={resultModal.type}
                    title={resultModal.title}
                    text={resultModal.text}
                    confirmText={t("OK")}
                    onClose={handleResultClose}
                />
            </Container>
        </div>
    );
};

export default AddStockTransfer;
