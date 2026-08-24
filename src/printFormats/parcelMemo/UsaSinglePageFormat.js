import React from "react";
import ParcelUsaCopy from "./ParcelUsaCopy";

const UsaSinglePageFormat = ({ data, items, totals, company, logoUrl }) => {
  const pageSize = 45;
  const totalPages = Math.ceil(items.length / pageSize) || 1;

  return (
    <div style={{ width: "100%" }}>
      {Array.from({ length: totalPages }).map((_, pageIdx) => {
        const pageItems = items.slice(pageIdx * pageSize, (pageIdx + 1) * pageSize);
        const startRow = pageIdx * pageSize + 1;
        const isLastPage = pageIdx === totalPages - 1;
        return (
          <div key={pageIdx} className={isLastPage ? "" : "page-break"}>
            <ParcelUsaCopy
              data={data}
              items={pageItems}
              totals={totals}
              company={company}
              logoUrl={logoUrl}
              copyTitle="OFFICE COPY"
              startRow={startRow}
              padTo={pageSize}
              showAttendee={false}
              isLastPage={isLastPage}
            />
          </div>
        );
      })}
    </div>
  );
};

export default UsaSinglePageFormat;
