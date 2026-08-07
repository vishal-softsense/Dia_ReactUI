import React, { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender } from "@tanstack/react-table";
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
  Row
} from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../helpers/excel_helper";

import {
  getSolitaireConsignmentReturnDropdowns,
  getSolitaireConsignmentReturnReport
} from "../../../helpers/fakebackend_helper";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";

const dashText = (value) => (value === null || value === undefined || value === "" ? "-" : String(value));

const fmtFixed = (value, decimals) => {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return (0).toFixed(decimals);
  return Number(value).toFixed(decimals);
};

const getRowVal = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") return row[key];
  }
  return "";
};

const getTableTotals = (table) => {
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);
  let parentReturn = 0;
  let parentAmt = 0;

  rows.forEach((r) => {
    if (r?.isParent) {
      parentReturn += Number(getRowVal(r, "Return", "return") || 0);
      parentAmt += Number(getRowVal(r, "Amount", "amount") || 0);
    }
  });

  return { parentReturn, parentAmt };
};

const SolitaireConsignmentReturnReport = () => {
  const { t } = useTranslation();

  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates();

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [dropdownData, setDropdownData] = useState({});
  const [expandedMemos, setExpandedMemos] = useState(() => new Set());
  const [reportRows, setReportRows] = useState([]);

  const [filters, setFilters] = useState({
    fromDate,
    toDate,
    currency: "",
    invNo: "", // Maps to Memo No
    type: "ALL",
    party: "",
    broker: "",
    lotNo: ""
  });

  const customStyles = useMemo(
    () => ({
      control: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        borderColor: "var(--vz-border-color, #ced4da)",
        color: "var(--vz-body-color, #495057)",
        height: "auto",
        minHeight: "35px"
      }),
      valueContainer: (provided) => ({
        ...provided,
        height: "auto",
        minHeight: "35px",
        padding: "0 6px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center"
      }),
      input: (provided) => ({
        ...provided,
        margin: "0px",
        padding: "0px"
      }),
      indicatorSeparator: () => ({
        display: "none"
      }),
      indicatorsContainer: (provided) => ({
        ...provided,
        height: "33px"
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        color: "var(--vz-body-color, #495057)",
        border: "1px solid var(--vz-border-color, #dee2e6)",
        zIndex: 20
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? "#3b5de7" : "transparent",
        color: state.isFocused ? "#ffffff" : "var(--vz-body-color, #495057)",
        cursor: "pointer",
        padding: "4px 10px",
        fontSize: "11px",
        ":active": { backgroundColor: "#3b5de7" }
      }),
      placeholder: (provided) => ({
        ...provided,
        color: "var(--vz-secondary-color, #878a99)",
        fontSize: "11px"
      }),
      singleValue: (provided) => ({
        ...provided,
        color: "var(--vz-body-color, #495057)",
        fontSize: "11px"
      }),
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-light)",
        fontSize: "10px"
      })
    }),
    []
  );

  const getOptions = useCallback(
    (dropdownKey) => {
      const list = dropdownData?.[dropdownKey] || [];
      return list.map((item) => ({
        value:
          dropdownKey === "type" ||
          dropdownKey === "subType" ||
          dropdownKey === "category" ||
          dropdownKey === "account"
            ? item.name ?? item.Name ?? item.label ?? ""
            : item.id ?? item.ID ?? item.value ?? "",
        label: String(item.name ?? item.Name ?? item.label ?? "").toUpperCase()
      }));
    },
    [dropdownData]
  );

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getSolitaireConsignmentReturnDropdowns();
        if (res?.success || res?.Success) {
          setDropdownData(res.data || res.Data || {});
        }
      } catch (err) {
        console.error(err);
        toast.error(t("Failed to load dropdown data."));
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdowns();
  }, [t]);

  useEffect(() => {
    setFilters((prev) => mergeDates(prev));
  }, [fromDate, toDate, mergeDates]);

  const handleClear = async () => {
    const d = await getDates();
    setHasSearched(false);
    setExpandedMemos(new Set());
    setReportRows([]);
    setFilters(mergeDates({
      currency: "",
      invNo: "",
      type: "ALL",
      party: "",
      broker: "",
      lotNo: ""
    }, d));
  };

  const handleReport = async () => {
    setLoading(true);
    try {
      const payload = {
        FromDate: filters.fromDate,
        ToDate: filters.toDate,
        Currency: filters.currency || null,
        InvNo: filters.invNo || null,
        Type: filters.type || null,
        Party: filters.party || null,
        Broker: filters.broker || null,
        LotNo: filters.lotNo || null
      };

      const response = await getSolitaireConsignmentReturnReport(payload);
      const ok = response?.success || response?.Success;

      if (ok) {
        const data = response.Data || response.data || [];
        setReportRows(data);
        setHasSearched(true);
        toast.success(t("Report loaded successfully."));
        setExpandedMemos(new Set());
      } else {
        toast.warning(response?.Data || response?.data || response?.Message || t("Failed to load report."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Server Connection Problem.."));
    } finally {
      setLoading(false);
    }
  };

  const groupedVisibleRows = useMemo(() => {
    const grouped = {};
    (reportRows || []).forEach((r) => {
      const memoVal = getRowVal(r, "MemoNo", "memoNo", "memono");
      const key = memoVal !== undefined && memoVal !== null && memoVal !== "" ? String(memoVal) : "UNKNOWN";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    const out = [];
    const memos = Object.keys(grouped);
    memos.sort();

    memos.forEach((memoKey) => {
      const rows = grouped[memoKey] || [];
      const first = rows[0];

      const totalReturn = rows.reduce((s, r) => s + Number(getRowVal(r, "Return", "return") || 0), 0);
      const totalAmount = rows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);

      const parentRow = {
        isParent: true,
        MemoNo: memoKey,
        BillNo: getRowVal(first, "BillNo", "billNo", "billno"),
        TrnDate: getRowVal(first, "TrnDate", "trnDate", "trndate", "RoundDate", "roundDate", "rounddate"),
        Party: getRowVal(first, "Party", "party"),
        Lotno: "",
        ItemName: "Total",
        Return: totalReturn,
        Price: totalReturn > 0 ? totalAmount / totalReturn : 0,
        Amount: totalAmount,
        Broker: "",
        invtype: "",
        childRecords: rows
      };

      out.push(parentRow);
    });

    return out;
  }, [reportRows]);

  const renderSubRows = useCallback(
    (row) => {
      const parent = row.original;
      const memoKey = String(parent.MemoNo ?? "");
      if (!expandedMemos.has(memoKey)) return null;

      const children = parent.childRecords || [];
      return children.map((child, index) => {
        const childRow = {
          ...child,
          isParent: false,
          memoKey
        };

        return (
          <tr key={`child-${memoKey}-${index}`} className="child-row">
            {row.getVisibleCells().map((cell) => {
              const column = cell.column;
              return (
                <td key={cell.id}>
                  {column.columnDef.cell
                    ? flexRender(column.columnDef.cell, {
                        ...cell.getContext(),
                        row: {
                          ...row,
                          original: childRow
                        }
                      })
                    : dashText(child[column.columnDef.accessorKey])}
                </td>
              );
            })}
          </tr>
        );
      });
    },
    [expandedMemos]
  );

  const columns = useMemo(
    () => [
      {
        header: " ",
        accessorKey: "isParent",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (!r?.isParent) return "";
          const memoKey = String(r.MemoNo ?? "");
          const expanded = expandedMemos.has(memoKey);
          return (
            <i
              className={expanded ? "bx bx-chevron-down" : "bx bx-chevron-right"}
              style={{
                cursor: "pointer",
                color: "#2c7be5",
                fontSize: "18px",
                verticalAlign: "middle"
              }}
              onClick={() => {
                setExpandedMemos((prev) => {
                  const next = new Set();
                  if (!prev.has(memoKey)) {
                    next.add(memoKey);
                  }
                  return next;
                });
              }}
            />
          );
        }
      },
      {
        header: t("Date"),
        accessorKey: "TrnDate",
        cell: ({ row }) => dashText(getRowVal(row.original, "TrnDate", "trnDate", "trndate", "RoundDate", "roundDate", "rounddate")),
        footer: () => <span className="fw-bold text-center d-block">Total:</span>
      },
      { header: t("MemoNo"), accessorKey: "MemoNo", cell: ({ row }) => dashText(getRowVal(row.original, "MemoNo", "memoNo", "memono")) },
      { header: t("BillNo"), accessorKey: "BillNo", cell: ({ row }) => dashText(getRowVal(row.original, "BillNo", "billNo", "billno")) },
      { header: t("Party"), accessorKey: "Party", cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party")) },
      { header: t("LotNo"), accessorKey: "Lotno", cell: ({ row }) => dashText(getRowVal(row.original, "Lotno", "lotNo", "lotno", "LotNo")) },
      { header: t("ItemName"), accessorKey: "ItemName", cell: ({ row }) => dashText(getRowVal(row.original, "ItemName", "itemName", "itemname")) },
      {
        header: t("Return"),
        accessorKey: "Return",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Return", "return"), 3),
        footer: ({ table }) => {
          const { parentReturn } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentReturn, 3)}</span>;
        }
      },
      {
        header: t("Price"),
        accessorKey: "Price",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Price", "price"), 2),
        footer: ({ table }) => {
          const { parentReturn, parentAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentReturn > 0 ? parentAmt / parentReturn : 0, 2)}</span>;
        }
      },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Amount", "amount"), 2),
        footer: ({ table }) => {
          const { parentAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentAmt, 2)}</span>;
        }
      },
      { header: t("Broker"), accessorKey: "Broker", cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker")) },
      { header: t("invtype"), accessorKey: "invtype", cell: ({ row }) => dashText(getRowVal(row.original, "invtype", "invType")) }

    ],
    [expandedMemos, t]
  );

  const handleExcel = async () => {
    const headers = columns
      .filter((c) => c.accessorKey && c.accessorKey !== "isParent")
      .map((c) => ({
        header: typeof c.header === "string" ? c.header : c.accessorKey,
        field: c.accessorKey
      }));

    const rows = [];
    groupedVisibleRows.forEach((p) => {
      rows.push(p);
      if (expandedMemos.has(String(p.MemoNo))) {
        (p.childRecords || []).forEach((c) => {
          rows.push({
            ...c,
            isParent: false
          });
        });
      }
    });

    const res = await exportToExcel(headers, rows, "ConsignmentReturnReport", "ConsignmentReturnReport");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  document.title = `${t("Consignment Return Report")} | ${t("Reports")}`;

  const typeOptions = [
    { value: "ALL", label: t("ALL") },
    { value: "External", label: t("EXTERNAL") },
    { value: "Internal", label: t("INTERNAL") },
    { value: "Local", label: t("LOCAL") },
    { value: "LAB", label: t("LAB") },
    { value: "Pend Sale", label: t("PEND SALE") }
  ];

  return (
    <React.Fragment>
      <ToastContainer />

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Consignment Return Report")} pageTitle={t("Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Consignment Return Report Results") : t("Consignment Return Report Filters")}
            </h5>

            <div className="d-flex gap-2">
              {!hasSearched ? (
                <>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handleReport} disabled={loading}>
                    {loading ? t("Loading...") : t("Report")}
                  </Button>
                  <Button color="soft-secondary" className="btn-sm rounded-2 px-3 py-1" onClick={handleClear} disabled={loading}>
                    {t("Clear")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    color="primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={() => {
                      setHasSearched(false);
                      setReportRows([]);
                      setExpandedMemos(new Set());
                    }}
                    disabled={loading}
                  >
                    {t("New Search")}
                  </Button>

                  <Button color="success" className="btn-sm rounded-2 px-3 py-1" onClick={handleExcel} disabled={reportRows.length === 0}>
                    {t("Excel")}
                  </Button>
                </>
              )}
            </div>
          </div>

          {!hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody className="bg-light-subtle">
                <Row className="g-3">
                  <Col md={10}>
                    <Row className="g-2 mb-2">
                      <Col sm={3}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Date")}</Label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.fromDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                          />
                        </FormGroup>
                      </Col>

                      <Col sm={3}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("To Date")}</Label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.toDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                          />
                        </FormGroup>
                      </Col>

                      <Col sm={3}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Currency")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isClearable
                            options={getOptions("currency")}
                            value={getOptions("currency").find((o) => o.value === filters.currency) || null}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, currency: sel?.value || "" }))}
                            placeholder={t("Select Currency")}
                          />
                        </FormGroup>
                      </Col>

                      <Col sm={3}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Memo No")}</Label>
                          <Input
                            type="text"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.invNo}
                            placeholder={t("MemoNo")}
                            onChange={(e) => setFilters((prev) => ({ ...prev, invNo: e.target.value }))}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col sm={3}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Type")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            options={typeOptions}
                            value={typeOptions.find((o) => o.value === filters.type) || null}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, type: sel?.value || "ALL" }))}
                            placeholder={t("Select Type")}
                          />
                        </FormGroup>
                      </Col>

                      <Col sm={4}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Party")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isClearable
                            options={getOptions("account")}
                            value={getOptions("account").find((o) => o.value === filters.party) || null}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, party: sel?.value || "" }))}
                            placeholder={t("Search Party")}
                            isLoading={loadingDropdowns}
                          />
                        </FormGroup>
                      </Col>

                      <Col sm={4}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Broker")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isClearable
                            options={getOptions("account")}
                            value={getOptions("account").find((o) => o.value === filters.broker) || null}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, broker: sel?.value || "" }))}
                            placeholder={t("Search Broker")}
                            isLoading={loadingDropdowns}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>

                  <Col md={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Enter Lot No")}</Label>
                      <Input
                        type="textarea"
                        value={filters.lotNo}
                        onChange={(e) => setFilters((prev) => ({ ...prev, lotNo: e.target.value }))}
                        placeholder={t("Search by lot no")}
                        className="form-control-sm"
                        style={{ height: "115px", resize: "none" }}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          )}

          {hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div className="d-flex justify-content-end gap-4 mb-3 small fw-semibold">
                  <span>
                    {t("Showing")}: {groupedVisibleRows.length} {t("rows")}
                  </span>
                </div>

                {groupedVisibleRows.length === 0 ? (
                  <div className="text-center py-4 text-muted">{t("No data available.")}</div>
                ) : (
                  <TableContainer
                    columns={columns}
                    data={groupedVisibleRows}
                    isGlobalFilter={true}
                    customPageSize={500}
                    customPageSizes={[500, 1000, 1500]}
                    divClass="table-responsive table-card mb-3"
                    tableClass="align-middle table-nowrap mb-0 table-hover table-striped"
                    theadClass="table-light"
                    SearchPlaceholder={t("SEARCH:")}
                    getRowClass={(row) => (row.original?.isParent ? "parent-row fw-bold" : "child-row")}
                    renderSubRows={renderSubRows}
                  />
                )}
              </CardBody>
            </Card>
          )}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default SolitaireConsignmentReturnReport;
