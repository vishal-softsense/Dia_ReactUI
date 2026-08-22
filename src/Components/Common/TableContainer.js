import React, { Fragment, useEffect, useState } from "react";
import { CardBody, Col, Row, Table } from "reactstrap";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  // Table as ReactTable,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender
} from '@tanstack/react-table';

import { rankItem } from '@tanstack/match-sorter-utils';

import {
  ProductsGlobalFilter,
  CustomersGlobalFilter,
  OrderGlobalFilter,
  ContactsGlobalFilter,
  CompaniesGlobalFilter,
  LeadsGlobalFilter,
  CryptoOrdersGlobalFilter,
  InvoiceListGlobalSearch,
  TicketsListGlobalFilter,
  NFTRankingGlobalFilter,
  TaskListGlobalFilter,
} from "../../Components/Common/GlobalSearchFilter";

// Column Filter
const Filter = ({
  column,
  // table
}) => {
  const columnFilterValue = column.getFilterValue();
  let placeholder = "";
  const headerDef = column.columnDef.header;
  if (typeof headerDef === "string") {
    placeholder = headerDef;
  } else if (typeof column.id === "string") {
    placeholder = column.id;
  }

  return (
    <>
      <DebouncedInput
        type="text"
        value={(columnFilterValue ?? '')}
        onChange={(value) => column.setFilterValue(value)}
        placeholder={placeholder}
        className="form-control form-control-sm bg-white"
        style={{ height: "26px", fontSize: "11px", padding: "2px 6px", borderRadius: "4px", width: "100%" }}
        debounce={100}
        list={column.id + 'list'}
        id={`filter-${column.id}`}
      />
    </>
  );
};


// Global Filter
const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  className,
  id,
  ...props
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [debounce, value]);

  return (
    <input
      {...props}
      value={value}
      id={id || "search-bar-0"}
      className={className || "form-control search"}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};
const TableContainer = ({
  columns,
  data,
  isGlobalFilter,
  isProductsFilter,
  isCustomerFilter,
  isOrderFilter,
  isContactsFilter,
  isCompaniesFilter,
  isLeadsFilter,
  isCryptoOrdersFilter,
  isInvoiceListFilter,
  isTicketsListFilter,
  isNFTRankingFilter,
  isTaskListFilter,
  customPageSize,
  customPageSizes,
  tableClass,
  theadClass,
  trClass,
  thClass,
  divClass,
  SearchPlaceholder,
  isPagination = true,
  isShowEntries = true,
  getRowClass,
  renderSubRows,
}) => {
  const { t } = useTranslation();
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: customPageSize || 10,
  });

  const table = useReactTable({
    columns,
    data,
    state: {
      columnFilters,
      globalFilter,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  const {
    getHeaderGroups,
    getRowModel,
    getCanPreviousPage,
    getCanNextPage,
    getPageOptions,
    setPageIndex,
    nextPage,
    previousPage,
    setPageSize,
    getState
  } = table;

  const totalPages = getPageOptions().length;
  const currentPage = getState().pagination.pageIndex;
  
  const getVisiblePages = () => {
    if (totalPages <= 3) {
      return getPageOptions();
    }
    if (currentPage === 0) {
      return [0, 1, 2];
    } else if (currentPage === totalPages - 1) {
      return [totalPages - 3, totalPages - 2, totalPages - 1];
    } else {
      return [currentPage - 1, currentPage, currentPage + 1];
    }
  };

  useEffect(() => {
    (customPageSize) && setPageSize((customPageSize));
  }, [customPageSize, setPageSize]);

  // Reset to first page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter, columnFilters]);

  return (
    <Fragment>
      {isGlobalFilter && (
        <div className="table-controls-wrapper border border-dashed border-start-0 border-end-0 py-2 px-3 mb-3 bg-light-subtle rounded-1">
          <form onSubmit={(e) => e.preventDefault()} className="w-100">
            <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
              {isShowEntries && (
                <div className="show-entries-section d-flex align-items-center">
                  <span className="me-2 text-muted text-uppercase small fw-semibold">{t("SHOW")}</span>
                  <select
                    className="form-select form-select-sm w-auto"
                    value={getState().pagination.pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    style={{ height: "34px", minWidth: "75px" }}
                  >
                    {(customPageSizes || [10, 25, 50, 100]).map(pageSize => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                    <option value={999999}>{t("All")}</option>
                  </select>
                  <span className="ms-2 text-muted text-uppercase small fw-semibold">{t("ENTRIES")}</span>
                </div>
              )}

              {isProductsFilter && (
                <ProductsGlobalFilter />
              )}
              {isCustomerFilter && (
                <CustomersGlobalFilter />
              )}
              {isOrderFilter && (
                <OrderGlobalFilter />
              )}
              {isContactsFilter && (
                <ContactsGlobalFilter />
              )}
              {isCompaniesFilter && (
                <CompaniesGlobalFilter />
              )}
              {isLeadsFilter && (
                <LeadsGlobalFilter />
              )}
              {isCryptoOrdersFilter && (
                <CryptoOrdersGlobalFilter />
              )}
              {isInvoiceListFilter && (
                <InvoiceListGlobalSearch />
              )}
              {isTicketsListFilter && (
                <TicketsListGlobalFilter />
              )}
              {isNFTRankingFilter && (
                <NFTRankingGlobalFilter />
              )}
              {isTaskListFilter && (
                <TaskListGlobalFilter />
              )}

              <div className="search-box-section w-100 w-sm-auto ms-sm-auto">
                <div className="search-box me-0 w-100 d-inline-block">
                  <input
                    type="text"
                    className="form-control form-control-sm search"
                    value={globalFilter ?? ''}
                    onChange={e => setGlobalFilter(e.target.value)}
                    placeholder={SearchPlaceholder || t("Search...")}
                    style={{ height: "34px" }}
                  />
                  <i className="bx bx-search-alt search-icon" />
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      <div
        className={divClass}
        style={{
          maxHeight: "calc(100vh - 280px)",
          overflowY: "auto",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          margin: 0,
          width: "100%",
          maxWidth: "100%"
        }}
      >
        <Table hover className={tableClass} style={{ width: "100%", margin: 0 }}>
          <thead className={theadClass} style={{ position: "sticky", top: 0, zIndex: 10 }}>
            {getHeaderGroups().map((headerGroup) => (
              <tr className={trClass} key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const minWidth = header.column.columnDef.minWidth || "auto";
                  const width = header.column.columnDef.width || "auto";
                  const colClass = header.column.columnDef.className || "";
                  const isEnd = colClass.includes("text-end");
                  const isCenter = colClass.includes("text-center");
                  const flexJustify = isEnd ? "justify-content-end" : isCenter ? "justify-content-center" : "justify-content-between";

                  return (
                    <th
                      key={header.id}
                      className={`${thClass || ""} ${colClass}`.trim()}
                      style={{
                        whiteSpace: "nowrap",
                        minWidth: minWidth,
                        width: width,
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        backgroundColor: "#f8f9fa",
                        boxShadow: "inset 0 -1px 0 #eff2f7",
                        padding: "8px 10px",
                        verticalAlign: "middle",
                        ...header.column.columnDef.style
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <React.Fragment>
                          <div
                            className={`d-flex align-items-center ${flexJustify} ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span className="fw-semibold text-dark me-1">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            {header.column.getCanSort() && (
                              <span className="ms-1 flex-shrink-0">
                                {{
                                  asc: <i className="mdi mdi-chevron-up text-primary fw-bold"></i>,
                                  desc: <i className="mdi mdi-chevron-down text-primary fw-bold"></i>,
                                }[header.column.getIsSorted()] ?? <i className="mdi mdi-unfold-more-horizontal text-muted"></i>}
                              </span>
                            )}
                          </div>
                          {header.column.getCanFilter() ? (
                            <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                              <Filter column={header.column} table={table} />
                            </div>
                          ) : null}
                        </React.Fragment>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length} className="text-center py-5 text-muted fw-semibold fs-14">
                  {t("No Data Found")}
                </td>
              </tr>
            ) : (
              getRowModel().rows.map((row) => {
                const customRowClass = getRowClass ? getRowClass(row) : "";
                return (
                  <Fragment key={row.id}>
                    <tr className={`${trClass || ""} ${customRowClass}`.trim()}>
                      {row.getVisibleCells().map((cell) => {
                        const minWidth = cell.column.columnDef.minWidth || "auto";
                        const width = cell.column.columnDef.width || "auto";
                        const colClass = cell.column.columnDef.className || "";

                        return (
                          <td
                            key={cell.id}
                            className={colClass}
                            style={{
                              whiteSpace: "nowrap",
                              minWidth: minWidth,
                              width: width,
                              verticalAlign: "middle",
                              padding: "8px 10px",
                              ...cell.column.columnDef.cellStyle
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {(() => {
                      if (!renderSubRows) return null;
                      const subRows = renderSubRows(row);
                      if (!subRows) return null;
                      
                      return React.Children.map(subRows, (tr) => {
                        if (!React.isValidElement(tr)) return tr;
                        
                        const newChildren = React.Children.map(tr.props.children, (td, idx) => {
                          if (!React.isValidElement(td)) return td;
                          const column = row.getVisibleCells()[idx]?.column;
                          const colClassName = column?.columnDef?.className || "";
                          if (colClassName) {
                            return React.cloneElement(td, {
                              className: `${td.props.className || ""} ${colClassName}`.trim()
                            });
                          }
                          return td;
                        });
                        
                        return React.cloneElement(tr, {}, newChildren);
                      });
                    })()}
                  </Fragment>
                );
              })
            )}
          </tbody>
          {table.getFooterGroups() && table.getFooterGroups().some(group => group.headers.some(h => h.column.columnDef.footer)) && (
            <tfoot className="table-light" style={{ position: "sticky", bottom: 0, backgroundColor: "var(--vz-light, #f2f2f2)", zIndex: 2, borderTop: "2px solid var(--vz-border-color)" }}>
              {table.getFooterGroups().map(footerGroup => (
                <tr key={footerGroup.id}>
                  {footerGroup.headers.map(header => (
                    <th key={header.id} className={header.column.columnDef.className || ""}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.footer,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </tfoot>
          )}
        </Table>
      </div>

      {isPagination && (
        <div className="px-3 py-2 border-top bg-white">
          <Row className="align-items-center mt-0 g-2 text-center text-sm-start me-sm-4">
            <div className="col-sm">
              <div className="text-muted small">
                {t("Showing")} <span className="fw-semibold">
                  {table.getFilteredRowModel().rows.length === 0 ? 0 : (getState().pagination.pageIndex * getState().pagination.pageSize) + 1}
                </span> {t("to")} <span className="fw-semibold">
                  {Math.min((getState().pagination.pageIndex + 1) * getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}
                </span> {t("of")} <span className="fw-semibold">{table.getFilteredRowModel().rows.length}</span> {t("entries")}
                {(() => {
                  const childCount = table.getFilteredRowModel().rows.reduce((acc, row) => {
                    const children = row.original?.childRecords || [];
                    return acc + children.length;
                  }, 0);
                  return childCount > 0 ? ` (${childCount})` : "";
                })()}
              </div>
            </div>
            <div className="col-sm-auto me-4 me-sm-0">
              <ul className="pagination pagination-separated pagination-sm justify-content-center justify-content-sm-start mb-0">
                <li className={!getCanPreviousPage() ? "page-item disabled" : "page-item"}>
                  <Link to="#" className="page-link" onClick={(e) => { e.preventDefault(); previousPage(); }}>{t("Previous")}</Link>
                </li>
                {getVisiblePages().map((item, key) => (
                  <React.Fragment key={key}>
                    <li className={getState().pagination.pageIndex === item ? "page-item active" : "page-item"}>
                      <Link to="#" className="page-link" onClick={(e) => { e.preventDefault(); setPageIndex(item); }}>{item + 1}</Link>
                    </li>
                  </React.Fragment>
                ))}
                <li className={!getCanNextPage() ? "page-item disabled" : "page-item"}>
                  <Link to="#" className="page-link" onClick={(e) => { e.preventDefault(); nextPage(); }}>{t("Next")}</Link>
                </li>
              </ul>
            </div>
          </Row>
        </div>
      )}
    </Fragment>
  );
};

export default TableContainer;