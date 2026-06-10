import React, { Fragment, useEffect, useState } from "react";
import { CardBody, Col, Row, Table } from "reactstrap";
import { Link } from "react-router-dom";

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

  return (
    <>
      <DebouncedInput
        type="text"
        value={(columnFilterValue ?? '')}
        onChange={(value) => column.setFilterValue(value)}
        placeholder="Search..."
        className="form-control form-control-sm mt-1"
        debounce={100}
        list={column.id + 'list'}
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
      id="search-bar-0"
      className="form-control search"
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
  tableClass,
  theadClass,
  trClass,
  thClass,
  divClass,
  SearchPlaceholder,

}) => {
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
              <Col sm={12} md="auto">
                <div className="d-flex align-items-center">
                  <span className="me-2 text-muted text-uppercase">Show</span>
                  <select
                    className="form-select form-select-sm w-auto"
                    value={getState().pagination.pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    {[...new Set([10, 25, 50, 100, data.length > 0 ? data.length : 1])].sort((a, b) => a - b).map(pageSize => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize === (data.length > 0 ? data.length : 1) ? 'All' : pageSize}
                      </option>
                    ))}
                  </select>
                  <span className="ms-2 text-muted text-uppercase">Entries</span>
                </div>
              </Col>
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


      <div className={divClass}>
        <Table hover className={tableClass}>
          <thead className={theadClass}>
            {getHeaderGroups().map((headerGroup) => (
              <tr className={trClass} key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className={thClass}>
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
            {getRowModel().rows.map((row) => {
              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
        <div className="col-sm">
          <div className="text-muted">
            Showing <span className="fw-semibold">
              {table.getFilteredRowModel().rows.length === 0 ? 0 : (getState().pagination.pageIndex * getState().pagination.pageSize) + 1}
            </span> to <span className="fw-semibold">
              {Math.min((getState().pagination.pageIndex + 1) * getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}
            </span> of <span className="fw-semibold">{table.getFilteredRowModel().rows.length}</span> entries
          </div>
        </div>
        <div className="col-sm-auto">
          <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
            <li className={!getCanPreviousPage() ? "page-item disabled" : "page-item"}>
              <Link to="#" className="page-link" onClick={(e) => { e.preventDefault(); previousPage(); }}>Previous</Link>
            </li>
            {getPageOptions().map((item, key) => (
              <React.Fragment key={key}>
                <li className={getState().pagination.pageIndex === item ? "page-item active" : "page-item"}>
                  <Link to="#" className="page-link" onClick={(e) => { e.preventDefault(); setPageIndex(item); }}>{item + 1}</Link>
                </li>
              </React.Fragment>
            ))}
            <li className={!getCanNextPage() ? "page-item disabled" : "page-item"}>
              <Link to="#" className="page-link" onClick={(e) => { e.preventDefault(); nextPage(); }}>Next</Link>
            </li>
          </ul>
        </div>
      </Row>
    </Fragment>
  );
};

export default TableContainer;