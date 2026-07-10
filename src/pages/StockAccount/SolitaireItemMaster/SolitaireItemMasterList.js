import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { getSolitaireItemMasters, deleteSolitaireItemMaster } from "../../../helpers/fakebackend_helper";
import { exportToExcel } from "../../../helpers/excel_helper";
import { toast, ToastContainer } from 'react-toastify';

const customStringFilterFn = (row, columnId, filterValue) => {
  let val = row.getValue(columnId);
  if (val == null) return false;
  if (columnId === "mrp" && typeof val === 'number') {
    val = val.toFixed(2);
  } else if (columnId === "weight" && typeof val === 'number') {
    val = val.toFixed(3);
  }
  return String(val).toLowerCase().includes(String(filterValue).toLowerCase());
};

const SolitaireItemMasterList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [solitaireItems, setSolitaireItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    if (location.state?.successMessage) {
      toast.success(location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
    fetchSolitaireItems();
  }, [location.state]);

  const fetchSolitaireItems = async (filter = "") => {
    setLoading(true);
    try {
      const response = await getSolitaireItemMasters(filter);
      if (response.success || response.Success) {
        setSolitaireItems(response.data || response.Data || []);
      } else {
        toast.error(response.message || response.Message || "Failed to fetch solitaire items");
      }
    } catch (error) {
      toast.error("Failed to fetch solitaire items");
    }
    setLoading(false);
  };

  const handleSearch = () => {
    fetchSolitaireItems(searchText);
  };

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      try {
        const response = await deleteSolitaireItemMaster(itemToDelete);
        if (response.success || response.Success) {
          toast.success(response.message || response.Message || "Solitaire Item deleted successfully");
          fetchSolitaireItems(searchText);
        } else {
          toast.error(response.message || response.Message || "Problem in deleting item");
        }
      } catch (error) {
        const errMsg = typeof error === 'string' ? error : (error.response?.data?.message || error.response?.data?.Message || "Failed to delete solitaire item");
        toast.error(errMsg);
      }
      setDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleExportExcel = async () => {
    if (solitaireItems.length === 0) {
      toast.warning("No data available to export");
      return;
    }

    const headers = ["Lot No", "Item Name", "LAB", "Certificate No", "Shape", "Color", "Size", "Clarity", "Weight", "MRP"];
    const rows = solitaireItems.map((item) => [
      item.lotNo ?? item.LotNo ?? "",
      item.itemName ?? item.ItemName ?? "",
      item.lab ?? item.LAB ?? "",
      item.certificateNo ?? item.CertificateNo ?? "",
      item.shapeId ?? item.ShapeId ?? "",
      item.colorId ?? item.ColorId ?? "",
      item.sizeId ?? item.SizeId ?? "",
      item.clarityId ?? item.ClarityId ?? "",
      item.weight ?? item.Weight ?? 0,
      item.mrp ?? item.MRP ?? 0
    ]);

    const result = await exportToExcel(headers, rows, "SolitaireItems", "SolitaireItemMasterList");
    if (!result.success) {
      toast.error("Failed to generate Excel file.");
    }
  };

  const columns = useMemo(
    () => [
      {
        header: t("Actions"),
        id: "actions",
        enableColumnFilter: false,
        cell: (cellProps) => {
          const id = cellProps.row.original.itemCode || cellProps.row.original.ItemCode;
          return (
            <div className="d-flex gap-2">
              <button
                className="btn btn-soft-primary btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                style={{
                  width: "32px",
                  height: "32px",
                  padding: "0"
                }}
                onClick={() => navigate(`/masters/edit-solitaire-item-master?id=${id}`)}
                title={t("Edit")}
              >
                <i className="ri-pencil-fill" style={{ fontSize: "14px" }}></i>
              </button>
              <button
                className="btn btn-soft-danger btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                style={{
                  width: "32px",
                  height: "32px",
                  padding: "0"
                }}
                onClick={() => handleDeleteClick(id)}
                title={t("Delete")}
              >
                <i className="ri-delete-bin-fill" style={{ fontSize: "14px" }}></i>
              </button>
            </div>
          );
        }
      },
      {
        header: t("Lot No"),
        accessorKey: "lotNo",
        accessorFn: (row) => row.lotNo ?? row.LotNo,
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
      },
      {
        header: t("Item Name"),
        accessorKey: "itemName",
        accessorFn: (row) => row.itemName ?? row.ItemName,
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
      },
      {
        header: t("LAB"),
        accessorKey: "lab",
        accessorFn: (row) => row.lab ?? row.LAB,
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
      },
      {
        header: t("Certificate No"),
        accessorKey: "certificateNo",
        accessorFn: (row) => row.certificateNo ?? row.CertificateNo,
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
      },
      {
        header: t("Shape"),
        accessorKey: "shapeId",
        accessorFn: (row) => row.shapeId ?? row.ShapeId,
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
      },
      {
        header: t("Color"),
        accessorKey: "colorId",
        accessorFn: (row) => row.colorId ?? row.ColorId,
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
      },
      {
        header: t("Size"),
        accessorKey: "sizeId",
        accessorFn: (row) => row.sizeId ?? row.SizeId,
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
      },
      {
        header: t("Clarity"),
        accessorKey: "clarityId",
        accessorFn: (row) => row.clarityId ?? row.ClarityId,
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
      },
      {
        header: t("Weight"),
        accessorKey: "weight",
        accessorFn: (row) => row.weight ?? row.Weight,
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        cell: (cellProps) => {
          const val = cellProps.getValue();
          if (val === 0) return "0";
          return typeof val === 'number' ? val.toFixed(3) : val;
        }
      },
      {
        header: t("MRP"),
        accessorKey: "mrp",
        accessorFn: (row) => row.mrp ?? row.MRP,
        enableColumnFilter: true,
        filterFn: customStringFilterFn,
        cell: (cellProps) => {
          const val = cellProps.getValue();
          if (val === 0) return "0";
          return typeof val === 'number' ? val.toFixed(2) : val;
        }
      }
    ],
    [navigate, t]
  );

  document.title = `${t("Solitaire Item Master")} | ${t("Admin")}`;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Solitaire Item Master")} pageTitle={t("Stock & Account")} />
          <Row>
            <Col lg={12}>
              <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
                  <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary d-flex align-items-center gap-2">
                    <i className="ri-vip-diamond-line fs-20 text-primary"></i>
                    {t("Solitaire Items")}
                  </h5>
                  <div className="d-flex gap-2">
                    <Link to="/masters/add-solitaire-item-master" className="btn btn-primary add-btn rounded-3 d-inline-flex align-items-center gap-1">
                      <i className="ri-add-line align-bottom"></i> {t("Add Solitaire Item")}
                    </Link>
                    <Button className="btn-soft-success rounded-3" onClick={handleExportExcel} title={t("Export to Excel")} style={{ height: "37.5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="ri-file-excel-2-line fs-18"></i>
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="text-center my-3">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <TableContainer
                      columns={columns}
                      data={solitaireItems}
                      isGlobalFilter={true}
                      customPageSize={500}
                      customPageSizes={[500, 1000, 1500]}
                      divClass="table-responsive table-card mb-3"
                      tableClass="align-middle table-nowrap mb-0"
                      theadClass="table-light"
                      SearchPlaceholder={t("Filter items...")}
                    />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} className="modal-dialog-centered">
        <ModalHeader className="bg-danger pb-3 text-white" toggle={() => setDeleteModal(false)}>{t("Confirm Delete")}</ModalHeader>
        <ModalBody>
          <div className="mt-2 text-center">
            <lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style={{ width: "100px", height: "100px" }}></lord-icon>
            <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
              <h4>{t("Are you sure?")}</h4>
              <p className="text-muted mx-4 mb-0">{t("Do you really want to delete this solitaire item? This action cannot be undone.")}</p>
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
            <button type="button" className="btn w-sm btn-light" onClick={() => setDeleteModal(false)}>{t("Cancel")}</button>
            <button type="button" className="btn w-sm btn-danger" id="delete-record" onClick={handleDeleteConfirm}>{t("Yes, Delete It!")}</button>
          </div>
        </ModalBody>
      </Modal>
      <ToastContainer closeButton={false} limit={1} />
    </React.Fragment>
  );
};

export default SolitaireItemMasterList;