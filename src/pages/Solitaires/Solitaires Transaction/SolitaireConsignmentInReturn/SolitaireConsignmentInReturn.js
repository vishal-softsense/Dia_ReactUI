import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  FormGroup,
  Input,
  Label,
  Row,
  Table
} from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import {
  getAccGrpMasters,
  getSolitaireConsignmentInReturnList,
  getSolitaireConsignmentInReturnPageData,
  returnSolitaireConsignmentInReturn
} from "../../../../helpers/fakebackend_helper";

const todayIso = () => new Date().toISOString().substr(0, 10);

/** Case-insensitive row lookup (handles SPCode / spCode / sPCode from API JSON). */
const pickRaw = (row, ...keys) => {
  if (!row) return undefined;
  const map = {};
  Object.keys(row).forEach((k) => {
    map[String(k).toLowerCase()] = row[k];
  });
  for (const key of keys) {
    if (key == null || key === "") continue;
    const val = map[String(key).toLowerCase()];
    if (val !== undefined && val !== null && val !== "") return val;
  }
  return undefined;
};

const getVal = (row, ...keys) => {
  const v = pickRaw(row, ...keys);
  return v == null ? "" : v;
};

const getNumVal = (row, ...keys) => {
  if (!row) return 0;
  const map = {};
  Object.keys(row).forEach((k) => {
    map[String(k).toLowerCase()] = row[k];
  });
  for (const key of keys) {
    if (key == null || key === "") continue;
    const val = map[String(key).toLowerCase()];
    if (val === undefined || val === null || val === "") continue;
    const n = parseFloat(val);
    if (Number.isFinite(n)) return n;
  }
  // Allow explicit 0 when key exists
  for (const key of keys) {
    if (key == null || key === "") continue;
    const val = map[String(key).toLowerCase()];
    if (val === 0 || val === "0") return 0;
  }
  return 0;
};

const toNum = (v, d = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : d;
};

const fmt = (v, decimals = 3) => toNum(v).toFixed(decimals);

const fmtDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "\u00A0");
};

const DEFAULT_TYPE_OPTIONS = [
  { value: "External", label: "External" },
  { value: "Internal", label: "Internal" },
  { value: "Local", label: "Local" }
];

const mapRowFromApi = (row, idx) => {
  const spCode = getNumVal(row, "SPCode", "spCode", "SpCode", "sPCode");
  const sptCode = getNumVal(row, "SPTCode", "sptCode", "SptCode", "sPTCode");
  return {
    key: `${sptCode}-${spCode}-${idx}`,
    checked: true,
    date: getVal(row, "Date"),
    memoNo: getVal(row, "MemoNo", "memoNo"),
    party: getVal(row, "Party"),
    broker: getVal(row, "Broker"),
    item: getVal(row, "Item"),
    carats: getNumVal(row, "carats", "Carats"),
    price: getNumVal(row, "Price"),
    pur: getNumVal(row, "Sale", "Pur", "sale"),
    returnQty: getNumVal(row, "Return", "return", "ReturnCarats"),
    balance: getNumVal(row, "Balance"),
    spCode,
    sptCode,
    itemCode: getNumVal(row, "ItemCode", "itemCode"),
    itemName: getVal(row, "ItemName", "itemName"),
    mNoBillNo: getVal(row, "MNo_BillNo", "mNo_BillNo", "MNoBillNo", "BillNo")
  };
};

const SolitaireConsignmentInReturn = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const [typeOptions, setTypeOptions] = useState(DEFAULT_TYPE_OPTIONS);
  const [invNo, setInvNo] = useState("");
  const [billNo, setBillNo] = useState("");
  const [type, setType] = useState("External");
  const [party, setParty] = useState(null);
  const [partyInput, setPartyInput] = useState("");
  const [partyOpts, setPartyOpts] = useState([]);
  const [partyLoading, setPartyLoading] = useState(false);
  const [clearMemo, setClearMemo] = useState(false);
  const [lotNo, setLotNo] = useState("");
  const [rtnDate, setRtnDate] = useState(todayIso());
  const [rows, setRows] = useState([]);

  const fieldH = { height: 31 };

  const selectStyles = useMemo(
    () => ({
      control: (p, s) => ({
        ...p,
        backgroundColor: s.isDisabled
          ? "var(--vz-input-disabled-bg, var(--vz-secondary-bg, #eff2f7))"
          : "var(--vz-secondary-bg, #fff)",
        borderColor: s.isFocused ? "#3b5de7" : "var(--vz-border-color, #ced4da)",
        boxShadow: s.isFocused ? "0 0 0 1px #3b5de7" : "none",
        color: "var(--vz-body-color, #495057)",
        minHeight: "31px",
        height: "31px",
        fontSize: "12px"
      }),
      valueContainer: (p) => ({ ...p, padding: "0 8px", height: "31px" }),
      indicatorsContainer: (p) => ({ ...p, height: "31px" }),
      input: (p) => ({
        ...p,
        margin: 0,
        padding: 0,
        color: "var(--vz-body-color, #495057)"
      }),
      menu: (p) => ({
        ...p,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        color: "var(--vz-body-color, #495057)",
        border: "1px solid var(--vz-border-color, #dee2e6)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        zIndex: 9999
      }),
      menuPortal: (p) => ({
        ...p,
        zIndex: 9999
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
        color: s.isDisabled
          ? "var(--vz-secondary-color, #878a99)"
          : "var(--vz-body-color, #495057)"
      })
    }),
    []
  );

  const mapAccountOpts = (d) =>
    (Array.isArray(d) ? d : []).map((item) => ({
      value: String(item.accGrpCode || item.AccGrpCode || ""),
      label: item.accGrpName || item.AccGrpName || ""
    })).filter((o) => o.value || o.label);

  // MVC FillList (#Party select2 allowClear): after clear, Party is empty and searching again
  // returns accounts from /common/get-account. Empty filter on Core API returns all parties.
  // Do not wipe options to [] on short/empty input — that left the dropdown empty after X.
  const searchAccounts = useCallback(async (term, setOpts, setLoad, { allowEmpty = false } = {}) => {
    const q = (term || "").trim();
    if (!allowEmpty && q.length < 2) {
      return;
    }
    setLoad(true);
    try {
      const res = await getAccGrpMasters(q);
      if (res?.success || res?.Success) {
        setOpts(mapAccountOpts(res.data || res.Data || []));
      }
    } catch {
      /* ignore */
    } finally {
      setLoad(false);
    }
  }, []);

  const loadAllParties = useCallback(() => {
    searchAccounts("", setPartyOpts, setPartyLoading, { allowEmpty: true });
  }, [searchAccounts]);

  const handlePartyChange = useCallback(
    (sel) => {
      setParty(sel || null);
      if (!sel) {
        // X / clear: empty selection and show all parties again (MVC allowClear behavior)
        setPartyInput("");
        loadAllParties();
      } else {
        setPartyOpts((prev) => {
          if (prev.some((o) => String(o.value) === String(sel.value))) return prev;
          return [sel, ...prev];
        });
      }
    },
    [loadAllParties]
  );

  useEffect(() => {
    const tmr = setTimeout(() => searchAccounts(partyInput, setPartyOpts, setPartyLoading), 400);
    return () => clearTimeout(tmr);
  }, [partyInput, searchAccounts]);

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true);
      try {
        // MVC: Type dropdown is hardcoded (External / Internal / Local).
        // Master Type list from API is NOT used (commented out in AddConsignmentReturn.cshtml).
        const res = await getSolitaireConsignmentInReturnPageData();
        if (!(res?.success || res?.Success)) {
          toast.warning(res?.Data || res?.data || t("You are not authorized to perform this task."));
        }
        setTypeOptions(DEFAULT_TYPE_OPTIONS);
      } catch (err) {
        console.error(err);
        toast.error(t("Failed to load page data."));
        setTypeOptions(DEFAULT_TYPE_OPTIONS);
      } finally {
        setLoading(false);
      }
    };
    loadPageData();
  }, [t]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          carats: acc.carats + toNum(r.carats),
          pur: acc.pur + toNum(r.pur),
          returnQty: acc.returnQty + toNum(r.returnQty),
          balance: acc.balance + toNum(r.balance)
        }),
        { carats: 0, pur: 0, returnQty: 0, balance: 0 }
      ),
    [rows]
  );

  const allChecked = rows.length > 0 && rows.every((r) => r.checked);
  const someChecked = rows.some((r) => r.checked);

  const handleCheckAll = (checked) => {
    setRows((prev) => prev.map((r) => ({ ...r, checked })));
  };

  const handleCheckRow = (key, checked) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, checked } : r)));
  };

  const handleShowConsignment = async () => {
    setListLoading(true);
    setRows([]);
    try {
      const partyName = (party?.label || "").trim();
      const payload = {
        InvNo: invNo.trim() || null,
        BillNo: billNo.trim() || null,
        Type: type || null,
        Party: partyName || null,
        LotNo: lotNo.trim() || null,
        ClearMemo: !!clearMemo
      };
      const res = await getSolitaireConsignmentInReturnList(payload);
      if (res?.success || res?.Success) {
        const raw = res.data || res.Data || [];
        const data = Array.isArray(raw) ? raw : [];
        setRows(data.map((row, idx) => mapRowFromApi(row, idx)));
        setShowTable(true);
        if (!data.length) toast.info(t("No consignment records found."));
      } else {
        setShowTable(true);
        toast.warning(res?.Data || res?.data || t("Failed to load consignment list."));
      }
    } catch (err) {
      console.error(err);
      setShowTable(true);
      toast.error(t("Failed to load consignment list."));
    } finally {
      setListLoading(false);
    }
  };

  const handleReturnSelected = async () => {
    const selectedRows = rows.filter((r) => r.checked);
    if (!selectedRows.length) {
      toast.warning(t("Please select at least one stone to return."));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        RtnDate: rtnDate,
        Items: rows.map((r) => ({
          Chk: r.checked,
          Sale: toNum(r.pur),
          Return: toNum(r.returnQty),
          Balance: toNum(r.balance),
          SPCode: toNum(r.spCode),
          SPTCode: toNum(r.sptCode),
          LotNo: r.item || ""
        }))
      };
      const res = await returnSolitaireConsignmentInReturn(payload);
      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || t("Consignment Return Sucessfull"));
        setShowTable(false);
        setRows([]);
        setInvNo("");
        setBillNo("");
        setParty(null);
        setPartyInput("");
        loadAllParties();
        setLotNo("");
        setClearMemo(false);
        setType("External");
        setRtnDate(todayIso());
      } else {
        toast.warning(res?.Data || res?.data || t("Return failed."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Return failed."));
    } finally {
      setSaving(false);
    }
  };

  const title = t("Consignment Return");
  document.title = `${title} | ${t("Memo & Consignment")}`;

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center text-muted py-5">{t("Loading...")}</div>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={title} pageTitle={t("Memo & Consignment")} />

          {/* Title + actions — same pattern as Purchase Return List */}
          <Card className="shadow-sm border-0 rounded-3 mb-3">
            <CardBody className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 py-3">
              <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                <i className="ri-arrow-go-back-line fs-20" />
                {title}
              </h5>
              <div className="d-flex gap-2 flex-wrap align-items-center">
                <Button color="primary" size="sm" disabled={listLoading} onClick={handleShowConsignment}>
                  {listLoading ? t("Loading...") : t("Show Consignment")}
                </Button>
                <Button
                  color="soft-secondary"
                  size="sm"
                  disabled={saving || !rows.length}
                  onClick={handleReturnSelected}
                >
                  {saving ? t("Saving...") : t("Return Selected Stone")}
                </Button>
                <Input
                  type="date"
                  className="form-control form-control-sm"
                  style={{ ...fieldH, width: 150 }}
                  value={rtnDate}
                  onChange={(e) => setRtnDate(e.target.value)}
                />
              </div>
            </CardBody>
          </Card>

          {/* Filters */}
          <Card className="shadow-sm border-0 rounded-3 mb-3" style={{ overflow: "visible", position: "relative", zIndex: 5 }}>
            <CardBody className="pb-2" style={{ overflow: "visible" }}>
              <Row className="g-3 align-items-start">
                <Col lg={9}>
                  <Row className="g-2">
                    <Col xl={2} md={4} sm={6}>
                      <FormGroup className="mb-2">
                        <Label className="form-label mb-1">{t("Consignment No")}</Label>
                        <Input className="form-control-sm" style={fieldH} value={invNo} onChange={(e) => setInvNo(e.target.value)} />
                      </FormGroup>
                    </Col>
                    <Col xl={2} md={4} sm={6}>
                      <FormGroup className="mb-2">
                        <Label className="form-label mb-1">{t("Bill No")}</Label>
                        <Input className="form-control-sm" style={fieldH} value={billNo} onChange={(e) => setBillNo(e.target.value)} />
                      </FormGroup>
                    </Col>
                    <Col xl={2} md={4} sm={6}>
                      <FormGroup className="mb-2">
                        <Label className="form-label mb-1">{t("Type")}</Label>
                        <Input type="select" className="form-select form-select-sm" style={fieldH} value={type} onChange={(e) => setType(e.target.value)}>
                          {typeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col xl={3} md={6} sm={6}>
                      <FormGroup className="mb-2">
                        <Label className="form-label mb-1">{t("Party")}</Label>
                        <Select
                          isClearable
                          isSearchable
                          placeholder={t("Search Party")}
                          options={partyOpts}
                          value={party}
                          onChange={handlePartyChange}
                          onInputChange={(val, meta) => {
                            if (meta.action === "input-change") setPartyInput(val);
                            if (meta.action === "set-value" || meta.action === "menu-close") {
                              // keep partyInput in sync after select/clear so next search is not stuck
                              if (!val) setPartyInput("");
                            }
                          }}
                          onMenuOpen={() => {
                            // If options were never loaded / emptied, load full party list on open
                            if (!partyOpts.length) loadAllParties();
                          }}
                          isLoading={partyLoading}
                          styles={selectStyles}
                          classNamePrefix="select2"
                          menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                          menuPosition="fixed"
                        />
                      </FormGroup>
                    </Col>
                    <Col xl={3} md={6} sm={6}>
                      <FormGroup className="mb-2">
                        <Label className="form-label mb-1 d-block" style={{ visibility: "hidden" }}>
                          &nbsp;
                        </Label>
                        <div className="d-flex align-items-center gap-2" style={{ minHeight: 31 }}>
                          <Input
                            type="checkbox"
                            id="chkClearMemo"
                            className="mt-0 flex-shrink-0"
                            style={{ width: 16, height: 16 }}
                            checked={clearMemo}
                            onChange={(e) => setClearMemo(e.target.checked)}
                          />
                          <Label for="chkClearMemo" className="mb-0 form-label" style={{ lineHeight: "16px", cursor: "pointer" }}>
                            {t("Show Clear Consignment")}
                          </Label>
                        </div>
                      </FormGroup>
                    </Col>
                  </Row>
                </Col>
                <Col lg={3}>
                  <FormGroup className="mb-2">
                    <Label className="form-label mb-1">{t("Enter Lot No")}</Label>
                    <Input
                      type="textarea"
                      rows={3}
                      className="form-control-sm"
                      placeholder={t("Add by lot no")}
                      value={lotNo}
                      onChange={(e) => setLotNo(e.target.value)}
                      style={{ minHeight: 78, resize: "vertical" }}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* Results table — same table-card look as Purchase Return */}
          {showTable && (
            <Card className="shadow-sm border-0 rounded-3 mb-3" style={{ position: "relative", zIndex: 1 }}>
              <CardBody>
                {listLoading ? (
                  <div className="text-center text-muted py-5">{t("Loading...")}</div>
                ) : (
                  <>
                    <div className="table-responsive table-card mb-0" style={{ maxHeight: "460px", overflow: "auto" }}>
                      <Table className="table table-bordered table-hover table-sm align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="text-center" style={{ minWidth: 42, width: 42, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>
                              <Input
                                type="checkbox"
                                checked={allChecked}
                                ref={(el) => {
                                  if (el) el.indeterminate = someChecked && !allChecked;
                                }}
                                onChange={(e) => handleCheckAll(e.target.checked)}
                              />
                            </th>
                            <th style={{ minWidth: 100, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("Date")}</th>
                            <th style={{ minWidth: 80, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("MemoNo")}</th>
                            <th style={{ minWidth: 140, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("Party")}</th>
                            <th style={{ minWidth: 100, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("Broker")}</th>
                            <th style={{ minWidth: 100, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("Item")}</th>
                            <th className="text-end" style={{ minWidth: 90, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("carats")}</th>
                            <th className="text-end" style={{ minWidth: 90, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("Price")}</th>
                            <th className="text-end" style={{ minWidth: 80, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("Pur")}</th>
                            <th className="text-end" style={{ minWidth: 90, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("Return")}</th>
                            <th className="text-end" style={{ minWidth: 90, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("Balance")}</th>
                            <th style={{ minWidth: 90, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("SPCode")}</th>
                            <th style={{ minWidth: 90, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("SPTCode")}</th>
                            <th style={{ minWidth: 90, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("ItemCode")}</th>
                            <th style={{ minWidth: 160, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("ItemName")}</th>
                            <th style={{ minWidth: 110, position: "sticky", top: 0, zIndex: 3, background: "var(--vz-secondary-bg, #f3f6f9)" }}>{t("MNo_BillNo")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.length === 0 ? (
                            <tr>
                              <td colSpan={16} className="text-center text-muted py-4">
                                {t("No records found.")}
                              </td>
                            </tr>
                          ) : (
                            rows.map((r) => (
                              <tr key={r.key}>
                                <td className="text-center">
                                  <Input type="checkbox" checked={r.checked} onChange={(e) => handleCheckRow(r.key, e.target.checked)} />
                                </td>
                                <td className="text-nowrap">{fmtDate(r.date)}</td>
                                <td>
                                  <span className="badge border border-danger text-danger bg-transparent" style={{ fontWeight: 600 }}>
                                    {r.memoNo || "-"}
                                  </span>
                                </td>
                                <td>{r.party || "-"}</td>
                                <td>{r.broker || "-"}</td>
                                <td>{r.item || "-"}</td>
                                <td className="text-end">{fmt(r.carats, 3)}</td>
                                <td className="text-end">{fmt(r.price, 3)}</td>
                                <td className="text-end">{fmt(r.pur, 3)}</td>
                                <td className="text-end">{fmt(r.returnQty, 3)}</td>
                                <td className="text-end">{fmt(r.balance, 3)}</td>
                                <td>{r.spCode}</td>
                                <td>{r.sptCode}</td>
                                <td>{r.itemCode}</td>
                                <td>{r.itemName || "-"}</td>
                                <td>{r.mNoBillNo || "-"}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {rows.length > 0 && (
                          <tfoot className="fw-semibold">
                            <tr>
                              <td
                                colSpan={6}
                                className="text-end"
                                style={{ position: "sticky", bottom: 0, zIndex: 2, background: "var(--vz-secondary-bg, #f3f6f9)", borderTop: "2px solid var(--vz-border-color, #dee2e6)" }}
                              >
                                {t("TOTAL")}
                              </td>
                              <td className="text-end" style={{ position: "sticky", bottom: 0, zIndex: 2, background: "var(--vz-secondary-bg, #f3f6f9)", borderTop: "2px solid var(--vz-border-color, #dee2e6)" }}>
                                {fmt(totals.carats, 3)}
                              </td>
                              <td style={{ position: "sticky", bottom: 0, zIndex: 2, background: "var(--vz-secondary-bg, #f3f6f9)", borderTop: "2px solid var(--vz-border-color, #dee2e6)" }} />
                              <td className="text-end" style={{ position: "sticky", bottom: 0, zIndex: 2, background: "var(--vz-secondary-bg, #f3f6f9)", borderTop: "2px solid var(--vz-border-color, #dee2e6)" }}>
                                {fmt(totals.pur, 3)}
                              </td>
                              <td className="text-end" style={{ position: "sticky", bottom: 0, zIndex: 2, background: "var(--vz-secondary-bg, #f3f6f9)", borderTop: "2px solid var(--vz-border-color, #dee2e6)" }}>
                                {fmt(totals.returnQty, 3)}
                              </td>
                              <td className="text-end" style={{ position: "sticky", bottom: 0, zIndex: 2, background: "var(--vz-secondary-bg, #f3f6f9)", borderTop: "2px solid var(--vz-border-color, #dee2e6)" }}>
                                {fmt(totals.balance, 3)}
                              </td>
                              <td colSpan={5} style={{ position: "sticky", bottom: 0, zIndex: 2, background: "var(--vz-secondary-bg, #f3f6f9)", borderTop: "2px solid var(--vz-border-color, #dee2e6)" }} />
                            </tr>
                          </tfoot>
                        )}
                      </Table>
                    </div>
                    {rows.length > 0 && (
                      <div className="mt-2 text-muted small">
                        {t("Showing")} 1 {t("to")} {rows.length} {t("of")} {rows.length} {t("entries")}
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          )}
        </Container>
        <ToastContainer autoClose={2000} />
      </div>
    </React.Fragment>
  );
};

export default SolitaireConsignmentInReturn;
