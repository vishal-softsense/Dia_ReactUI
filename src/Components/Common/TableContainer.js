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
  const placeholder =
    typeof column.columnDef.header === "string" ? column.columnDef.header : "";

  return (
    <>
      <DebouncedInput
        type="text"
        value={(columnFilterValue ?? '')}
        onChange={(value) => column.setFilterValue(value)}
        placeholder={placeholder}
        className="form-control form-control-sm mt-1"
        style={{ height: "26px", fontSize: "11px", padding: "2px 8px" }}
        debounce={100}
        list={column.id + 'list'}
        id={`filter-${column.id}`}
      />
      <div className="h-1" />
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
      {isGlobalFilter && <Row className="mb-3">
        <CardBody className="border border-dashed border-end-0 border-start-0">
          <form>
            <Row className="align-items-center g-3">
              {isShowEntries && (
                <Col sm={12} md="auto">
                  <div className="d-flex align-items-center">
                    <span className="me-2 text-muted text-uppercase">{t("Show")}</span>
                    <select
                      className="form-select form-select-sm w-auto"
                      value={getState().pagination.pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                    >
                      {(customPageSizes || [10, 25, 50, 100]).map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                          {pageSize}
                        </option>
                      ))}
                      <option value={999999}>{t("All")}</option>
                    </select>
                    <span className="ms-2 text-muted text-uppercase">{t("Entries")}</span>
                  </div>
                </Col>
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

              <Col sm={12} md className="d-flex justify-content-md-end mt-2 mt-md-0">
                <div className="search-box me-2 d-inline-block">
                  <input
                    type="text"
                    className="form-control search"
                    value={globalFilter ?? ''}
                    onChange={e => setGlobalFilter(e.target.value)}
                    placeholder={SearchPlaceholder || "Search..."}
                  />
                  <i className="bx bx-search-alt search-icon"></i>
                </div>
              </Col>
            </Row>
          </form>
        </CardBody>
      </Row>}


      <div className={divClass} style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto", overflowX: "auto" }}>
        <Table hover className={tableClass}>
          <thead className={theadClass} style={{ position: "sticky", top: 0, zIndex: 2 }}>
            {getHeaderGroups().map((headerGroup) => (
              <tr className={trClass} key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className={`${thClass || ""} ${header.column.columnDef.className || ""}`.trim()}>
                    {header.isPlaceholder ? null : (
                      <React.Fragment>
                        <div
                          className={`d-flex align-items-center ${header.column.getCanSort() ? 'cursor-pointer' : ''}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="ms-2">
                              {{
                                asc: <i className="mdi mdi-chevron-up text-muted"></i>,
                                desc: <i className="mdi mdi-chevron-down text-muted"></i>,
                              }[header.column.getIsSorted()] ?? <i className="mdi mdi-unfold-more-horizontal text-muted"></i>}
                            </span>
                          )}
                        </div>
                        {header.column.getCanFilter() ? (
                          <div className="mt-1">
                            <Filter column={header.column} table={table} />
                          </div>
                        ) : null}
                      </React.Fragment>
                    )}
                  </th>
                ))}
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
                      return (
                        <td key={cell.id} className={cell.column.columnDef.className || ""}>
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
            }))}
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
        <div style={{ backgroundColor: "var(--vz-card-bg, #fff)", paddingTop: "8px", paddingBottom: "4px", borderTop: "1px solid var(--vz-border-color, #e9ebec)" }}>
        <Row className="align-items-center mt-0 g-3 text-center text-sm-start">
          <div className="col-sm">
            <div className="text-muted">
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
          <div className="col-sm-auto">
            <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
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