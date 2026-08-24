import React from "react";
import ParcelUsaCopy from "./ParcelUsaCopy";

const UsaUpAndDownDualFormat = ({ data, items, totals, company, logoUrl }) => {
  const pageSize = 11;
  const totalPages = Math.ceil(items.length / pageSize) || 1;

  return (
    <div style={{ width: "100%" }}>
      {Array.from({ length: totalPages }).map((_, pageIdx) => {
        const pageItems = items.slice(pageIdx * pageSize, (pageIdx + 1) * pageSize);
        const startRow = pageIdx * pageSize + 1;
        const isLastPage = pageIdx === totalPages - 1;
        return (
          <div key={pageIdx} className={isLastPage ? "" : "page-break"} style={{ marginBottom: 24 }}>
            <ParcelUsaCopy
              data={data}
              items={pageItems}
              totals={totals}
              company={company}
              logoUrl={logoUrl}
              copyTitle="OFFICE COPY"
              startRow={startRow}
              padTo={pageSize}
              showAttendee
              isLastPage={isLastPage}
            />
            <div style={{ borderTop: "1px dashed #888", margin: "20px 0" }} />
            <ParcelUsaCopy
              data={data}
              items={pageItems}
              totals={totals}
              company={company}
              logoUrl={logoUrl}
              copyTitle="CUSTOMER COPY"
              startRow={startRow}
              padTo={pageSize}
              showAttendee
              isLastPage={isLastPage}
            />
          </div>
        );
      })}
    </div>
  );
};

export default UsaUpAndDownDualFormat;
