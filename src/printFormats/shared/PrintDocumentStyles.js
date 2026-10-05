import React from "react";

const PrintDocumentStyles = ({
  printAreaId = "print-document-area",
  landscape = false,
  pageSize = "A4",
  extraPrintCss = ""
}) => (
  <style>{`
    .page-break { page-break-after: always; break-after: page; }

    /* India Dual — screen preview (side-by-side copies; stacked pages) */
    .india-dual-print-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }
    .india-dual-page {
      width: 100%;
      margin-bottom: 20px;
      padding: 10px 0 4px;
      overflow: visible;
    }
    .india-dual-sheet-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .india-dual-sheet-left,
    .india-dual-sheet-right {
      width: 49%;
      vertical-align: top;
      padding: 0;
    }
    .india-dual-sheet-gap {
      width: 2%;
      position: relative;
      vertical-align: top;
      padding: 0;
    }
    .india-dual-cut-line {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      border-left: 1px dashed #777;
    }
    .india-dual-copy {
      border: 1px solid #4c4c4c;
      padding: 10px 12px 8px;
      display: flex;
      flex-direction: column;
      position: relative;
      background: #fff;
      font-size: 9px;
      font-family: Verdana, Helvetica, sans-serif;
      color: #000;
      min-height: 680px;
      box-sizing: border-box;
      overflow: visible;
    }
    .india-dual-shree {
      position: absolute;
      top: -7px;
      left: 50%;
      transform: translateX(-50%);
      background: #fff;
      padding: 0 5px;
      font-size: 12px;
      font-weight: bold;
      line-height: 1;
      z-index: 2;
      white-space: nowrap;
    }
    .india-dual-shree-stick {
      font-size: 10px;
      position: relative;
      top: -2px;
    }
    .india-dual-header-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
      margin-top: 4px;
    }
    .india-dual-company-name {
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .india-dual-logo {
      height: 48px;
      width: 72px;
      object-fit: contain;
    }
    .india-dual-meta-line {
      line-height: 1.55;
    }
    .india-dual-party-box {
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 6px 4px;
      margin-top: 6px;
    }
    .india-dual-table-section {
      flex: 1 1 auto;
      margin-top: 6px;
      min-height: 360px;
    }
    .india-dual-data-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .india-dual-data-table th {
      border: 1px solid #000;
      padding: 4px 2px;
      font-size: 8px;
      text-align: center;
      background: #e0e0e0;
      font-weight: bold;
    }
    .india-dual-total-row td {
      background: #f5f5f5;
    }
    .india-dual-bottom {
      margin-top: auto;
      padding-top: 8px;
    }
    .india-dual-disclaimer {
      font-size: 7px;
      text-align: justify;
      line-height: 1.3;
      border: 1px solid #ddd;
      padding: 5px;
      border-radius: 4px;
      white-space: pre-line;
      max-height: 52px;
      overflow: hidden;
    }
    .india-dual-sign-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 22px;
      font-size: 9.5px;
    }
    .india-dual-sign-line {
      border-top: 1px solid #000;
      padding-top: 4px;
      margin: 0 10px;
    }

    @media print {
      @page {
        size: ${pageSize} ${landscape ? "landscape" : "portrait"};
        margin: ${landscape ? "4mm" : "10mm"};
      }
      html, body {
        background: #fff !important;
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .page-content,
      .main-content,
      .container-fluid,
      .memo-out-print-page {
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        overflow: visible !important;
        max-height: none !important;
        height: auto !important;
      }
      body * { visibility: hidden !important; }
      #${printAreaId},
      #${printAreaId} * {
        visibility: visible !important;
      }
      #${printAreaId} {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background: #fff !important;
        color: #000 !important;
        box-sizing: border-box !important;
        overflow: visible !important;
        max-height: none !important;
        height: auto !important;
        ${landscape ? "zoom: 0.96;" : ""}
      }
      .d-print-none,
      .navbar-menu,
      .app-menu,
      .navbar-header,
      .footer,
      .vertical-menu,
      #page-topbar,
      .page-title-box,
      .Toastify {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .page-break {
        page-break-after: always !important;
        break-after: page !important;
      }

      /* One landscape sheet = one dual pair only */
      #${printAreaId} .india-dual-print-container {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
      }
      #${printAreaId} .india-dual-page {
        margin: 0 !important;
        padding: 8px 0 0 0 !important;
        height: auto !important;
        overflow: visible !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      #${printAreaId} .india-dual-page-last {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      #${printAreaId} .india-dual-sheet-left,
      #${printAreaId} .india-dual-sheet-right,
      #${printAreaId} .india-dual-sheet-table {
        overflow: visible !important;
      }
      #${printAreaId} .india-dual-copy {
        min-height: 0 !important;
        height: 185mm !important;
        max-height: 185mm !important;
        overflow: visible !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        padding: 8px 8px 4px !important;
      }
      #${printAreaId} .india-dual-shree {
        top: -7px !important;
        z-index: 2 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #${printAreaId} .india-dual-table-section {
        min-height: 0 !important;
        flex: 1 1 auto !important;
        overflow: hidden !important;
      }
      #${printAreaId} .india-dual-data-table th {
        background: #e0e0e0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #${printAreaId} .india-dual-data-table td,
      #${printAreaId} .india-dual-data-table th {
        padding-top: 2px !important;
        padding-bottom: 2px !important;
        line-height: 1.15 !important;
      }
      #${printAreaId} .india-dual-bottom {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      #${printAreaId} .india-dual-sign-table {
        margin-top: 12px !important;
      }
      ${extraPrintCss}
    }
    @media (max-width: 767px) {
      #${printAreaId} {
        overflow-x: auto !important;
        display: block !important;
      }
    }
  `}</style>
);

export default PrintDocumentStyles;
