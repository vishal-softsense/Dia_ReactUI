import React from "react";

const PrintDocumentStyles = ({ printAreaId = "print-document-area", landscape = false }) => (
  <style>{`
    @media print {
      @page {
        size: A4 ${landscape ? "landscape" : "portrait"};
        margin: ${landscape ? "5mm" : "10mm"};
      }
      html, body {
        background: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
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
      }
      .d-print-none,
      .navbar-menu,
      .app-menu,
      .navbar-header,
      .footer,
      .vertical-menu,
      #page-topbar,
      .page-title-box {
        display: none !important;
      }
      .page-break {
        page-break-after: always !important;
        break-after: page !important;
      }
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
