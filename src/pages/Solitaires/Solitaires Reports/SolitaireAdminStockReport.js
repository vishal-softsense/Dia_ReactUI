import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Label,
  Input,
  FormGroup,
  Table,
  Modal,
  ModalBody,
  ModalHeader,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";
import Select, { components } from "react-select";
import classnames from "classnames";
import { toast, ToastContainer } from "react-toastify";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import {
  getSolitaireAdminStockReport,
  getSolitaireAdminStockDropdowns,
  getSolitaireAdminLots,
  updateSolitaireAdminStockLocation,
  updateSolitaireAdminStockBoxGroup
} from "../../../helpers/fakebackend_helper";
import { exportToExcel } from "../../../helpers/excel_helper";
import StockHistoryPopupModal from "./StockHistoryPopupModal";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const formatLocalDate = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};


const SelectionCell = React.memo(({ index, isSelected, onChange }) => {
  const handleChange = () => {
    onChange(index);
  };

  return (
    <input
      type="checkbox"
      className="form-check-input"
      checked={isSelected}
      onChange={handleChange}
    />
  );
});

const getRowVal = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") return row[key];
  }
  return "";
};

const fmtFixed = (value, decimals) => {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return (0).toFixed(decimals);
  return Number(value).toFixed(decimals);
};

const getAdminStockTableTotals = (table) => {
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);
  let totalCarats = 0;
  let totalAmount = 0;
  let totalCostAmount = 0;
  let totalMRPAmt = 0;
  let totalMrpAmountColumn = 0;

  rows.forEach((r) => {
    const carats = Number(getRowVal(r, "carats", "Carats") || 0);
    const rapa = Number(getRowVal(r, "rapa", "Rapa") || 0);
    const amount = Number(getRowVal(r, "askingAmount", "AskingAmount", "Amount", "amount") || 0);
    const costAmt = Number(getRowVal(r, "purChaseAmount", "purchaseAmount", "PurChaseAmount", "PurchaseAmount") || 0);
    const mrpAmtCol = Number(getRowVal(r, "mrpAmount", "MrpAmount", "MRPAmount") || 0);

    totalCarats += carats;
    totalAmount += amount;
    totalCostAmount += costAmt;
    totalMRPAmt += (rapa * carats);
    totalMrpAmountColumn += mrpAmtCol;
  });

  return { totalCarats, totalAmount, totalCostAmount, totalMRPAmt, totalMrpAmountColumn };
};

const allColumns = [
  { label: "Status", key: "curStatus" },
  { label: "Location", key: "city" },
  { label: "Stock ID", key: "lotNo", fw: "semibold" },
  { label: "LAB", key: "lab" },
  { label: "Certificate", key: "cNo" },
  { label: "Shape", key: "shape" },
  { label: "Color", key: "color" },
  { label: "Clarity", key: "clarity" },
  { label: "Prop", key: "prop" },
  { label: "Pol", key: "pol" },
  { label: "Sym", key: "sym" },
  { label: "FL", key: "fl" },
  { label: "Carats", key: "carats", align: "text-end", type: "carats" },
  { label: "MRP", key: "rapa", align: "text-end", type: "number" },
  { label: "Asking Back", key: "askingBack", align: "text-end", type: "discount" },
  { label: "Asking Rate", key: "askingRate", align: "text-end", type: "number" },
  { label: "Asking Amount", key: "askingAmount", align: "text-end", type: "number", fw: "semibold", color: "text-primary" },
  { label: "Purchase Back", key: "purchaseBack", align: "text-end", type: "discount" },
  { label: "Purchase Rate", key: "purchaseRate", align: "text-end", type: "number" },
  { label: "Purchase Amount", key: "purChaseAmount", align: "text-end", type: "number" },
  { label: "Measurement", key: "diam" },
  { label: "L:W", key: "lw", align: "text-end", type: "number" },
  { label: "Depth %", key: "tDep", align: "text-end", type: "number" },
  { label: "Table %", key: "tabPer", align: "text-end", type: "number" },
  { label: "CH %", key: "ch", align: "text-end", type: "number" },
  { label: "CA", key: "ca", align: "text-end", type: "number" },
  { label: "PH %", key: "ph", align: "text-end", type: "number" },
  { label: "PA", key: "pa", align: "text-end", type: "number" },
  { label: "HA", key: "ha" },
  { label: "Brown", key: "brown" },
  { label: "Milky", key: "milky" },
  { label: "Luster", key: "luster" },
  { label: "Shade", key: "shade" },
  { label: "Nts", key: "nts" },
  { label: "Key To Symbols", key: "keyToSymbols" },
  { label: "Comments", key: "comments" },
  { label: "Remarks", key: "remarks" },
  { label: "Image Path", key: "imagePath" },
  { label: "Video Path", key: "videoPath" },
  { label: "Mfg Series ID", key: "kapan" },
  { label: "Mfg Packet ID", key: "packet" },
  { label: "Tab.Inc.", key: "tinc" },
  { label: "Cr.Inc.", key: "cinc" },
  { label: "IP", key: "ip" },
  { label: "OIT", key: "oit" },
  { label: "OIG", key: "oig" },
  { label: "OIC", key: "oic" },
  { label: "OIP", key: "oip" },
  { label: "Black", key: "black" },
  { label: "Size", key: "size" },
  { label: "FLColor", key: "flColor" },
  { label: "TypeID", key: "typeID" },
  { label: "GirdlePer", key: "girdlePer", align: "text-end", type: "number" },
  { label: "Girdle MM", key: "girdlemm" },
  { label: "Girdle", key: "girdle" },
  { label: "GirdleCondition", key: "girdleCondition" },
  { label: "GrMin", key: "grMin" },
  { label: "GrMax", key: "grMax" },
  { label: "Culet", key: "culet" },
  { label: "PDate", key: "pDate" },
  { label: "RDate", key: "rDate" },
  { label: "New Arrival Date", key: "newArrDate" },
  { label: "Web Revised Date", key: "webRDate" },
  { label: "BoxName", key: "boxName" },
  { label: "NotShow", key: "notShow" },
  { label: "Item Group ID", key: "itemGroupId" },
  { label: "MRP Amount", key: "mrpAmount", align: "text-end", type: "number" },
  { label: "Member Comment", key: "memberComments" },
  { label: "Laser Inscription", key: "laserInscription" },
  { label: "EyeClean", key: "eyeClean" },
  { label: "FancyColor", key: "fancyColor" },
  { label: "Country", key: "country" },
  { label: "Item Name", key: "itemName" },
  { label: "COGS %", key: "actualBack", align: "text-end", type: "discount" },
  { label: "COGS Rate", key: "actualRate", align: "text-end", type: "number" },
  { label: "COGS Amount", key: "actualAmount", align: "text-end", type: "number" },
  { label: "CPAVG", key: "cpavg", align: "text-end", type: "number" },
  { label: "CPAVGAmt", key: "cpavgAmt", align: "text-end", type: "number" },
  { label: "SPAVG", key: "spavg", align: "text-end", type: "number" },
  { label: "SPAVGAmt", key: "spavgAmt", align: "text-end", type: "number" },
  { label: "Partyholdcts", key: "partyholdcts", align: "text-end", type: "carats" },
  { label: "MemoPartyName", key: "memoPartyName" },
  { label: "HoldPartyName", key: "holdPartyName" }
];

const CustomOption = (props) => {
  return (
    <components.Option {...props}>
      <div className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
        <input
          type="checkbox"
          className="form-check-input mt-0"
          checked={props.isSelected}
          onChange={() => null}
          style={{ cursor: "pointer" }}
        />
        <span style={{ fontSize: "13px" }}>
          {props.label}
        </span>
      </div>
    </components.Option>
  );
};

const CustomMenuList = (props) => {
  const { selectProps } = props;
  const { onSelectAll, isAllSelected, t } = selectProps;

  return (
    <components.MenuList {...props}>
      <div
        className="px-3 py-2 border-bottom d-flex align-items-center gap-2 select-all-row"
        style={{
          cursor: "pointer",
          background: "var(--vz-tertiary-bg, #f8f9fa)",
          borderColor: "var(--vz-border-color, #dee2e6)",
        }}
        onClick={onSelectAll}
      >
        <input
          type="checkbox"
          className="form-check-input"
          checked={isAllSelected}
          onChange={() => null}
          style={{ cursor: "pointer" }}
        />
        <span
          className="fw-semibold text-uppercase"
          style={{ fontSize: "12px", color: "var(--vz-body-color, #495057)" }}
        >
          {t("SELECT ALL")}
        </span>
      </div>
      {props.children}
    </components.MenuList>
  );
};

const CustomValueContainer = ({ children, ...props }) => {
  const { selectProps } = props;
  const numSelected = selectProps.value ? selectProps.value.length : 0;
  const showSelectedText = numSelected > 0 && !selectProps.menuIsOpen;

  return (
    <components.ValueContainer {...props}>
      {showSelectedText && (
        <div
          className="position-absolute"
          style={{
            color: "var(--vz-body-color, #495057)",
            fontSize: "13px",
            left: "10px",
            pointerEvents: "none",
          }}
        >
          {numSelected} Selected
        </div>
      )}
      {children}
    </components.ValueContainer>
  );
};

const SolitaireAdminStockReport = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("1");
  const [masterDropdowns, setMasterDropdowns] = useState({});
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const [lotOptions, setLotOptions] = useState([]);
  const [loadingLots, setLoadingLots] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedRows, setSelectedRows] = useState({});

  const [detailModal, setDetailModal] = useState(false);
  const [selectedRowDetail, setSelectedRowDetail] = useState(null);
  const [historyModal, setHistoryModal] = useState(false);
  const [detailMediaTab, setDetailMediaTab] = useState("image");

  const [moreModal, setMoreModal] = useState(false);
  const [locationModal, setLocationModal] = useState(false);
  const [boxNameUpdate, setBoxNameUpdate] = useState("");
  const [groupNameUpdate, setGroupNameUpdate] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locationCountry, setLocationCountry] = useState("");

  const [printFormat, setPrintFormat] = useState("Print");
  const [printDropdownOpen, setPrintDropdownOpen] = useState(false);

  const initialFilters = {
    date: formatLocalDate(new Date()),
    shapeGroup: [],
    shape: [],
    colorGroup: [],
    color: [],
    clarity: [],
    size: [],
    rough: [],
    prop: [],
    pol: [],
    sym: [],
    lab: [],
    fl: [],
    milky: [],
    luster: [],
    nts: [],
    shade: [],
    flColor: [],
    ha: [],
    location: [],
    itemGroup: [],
    pair: [],
    boxNm: [],
    status: "All",
    show: "Unsold",
    holdUnHold: "Unhold",
    stoneTypes: "All",
    ctsFrm: "",
    ctsTo: "",
    backFrm: "",
    backTo: "",
    priceFrm: "",
    priceTo: "",
    lotFrm: "",
    lotTo: "",
    tDepthFrm: "",
    tDepthTo: "",
    tablePerFrm: "",
    tablePerTo: "",
    caFrm: "",
    caTo: "",
    chFrm: "",
    chTo: "",
    phFrm: "",
    phTo: "",
    paFrm: "",
    paTo: "",
    purCheck: false,
    frmPurchaseDate: "",
    toPurchaseDate: "",
    revCheck: false,
    frmReviseDate: "",
    toReviseDate: "",
    newArrCheck: false,
    frmNewArrivalDate: "",
    toNewArrivalDate: "",
    webRevCheck: false,
    frmWebRevisedDate: "",
    toWebRevisedDate: "",
    unholdCheck: false,
    frmUnholdDate: "",
    toUnholdDate: "",
    labCheck: false,
    frmLabDate: "",
    toLabDate: "",
    lotNo: "",
    filters: "LotNo",
    backPer: "",
    backPlusMinus: "",
    ratePer: "",
    ratePlusMinus: ""
  };

  const [filters, setFilters] = useState(initialFilters);

  const fetchLotsList = useCallback(async (search = "") => {
    setLoadingLots(true);
    try {
      const response = await getSolitaireAdminLots(search);
      const rawLots = Array.isArray(response) ? response : (response?.data || response?.Data || []);
      const formatted = rawLots.map((item) => ({
        value: item.name || item.Name || item.id || item.ID || "",
        label: (item.text || item.TextName || item.name || item.Name || item.id || item.ID || "").toUpperCase()
      }));
      setLotOptions(formatted);
    } catch (err) {
      console.error("Error loading lots list:", err);
    }
    setLoadingLots(false);
  }, []);

  const debouncedFetchLotsList = useMemo(() => {
    return debounce(fetchLotsList, 300);
  }, [fetchLotsList]);

  useEffect(() => {
    fetchLotsList("");
  }, [fetchLotsList]);

  const selectedLotValues = useMemo(() => {
    return filters.lotNo
      ? filters.lotNo.split("\n").map(v => v.trim()).filter(Boolean)
      : [];
  }, [filters.lotNo]);

  const [lotSearchValue, setLotSearchValue] = useState("");

  const isAllSelected = useMemo(() => {
    if (lotOptions.length === 0) return false;
    return lotOptions.every(option => selectedLotValues.includes(option.value));
  }, [lotOptions, selectedLotValues]);

  const handleSelectAllLots = () => {
    if (isAllSelected) {
      const currentOptionValues = lotOptions.map(o => o.value);
      const updated = selectedLotValues.filter(v => !currentOptionValues.includes(v));
      setFilters(prev => ({ ...prev, lotNo: updated.join("\n") }));
    } else {
      const currentOptionValues = lotOptions.map(o => o.value);
      const union = Array.from(new Set([...selectedLotValues, ...currentOptionValues]));
      setFilters(prev => ({ ...prev, lotNo: union.join("\n") }));
    }
  };

  useEffect(() => {
    const fetchDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const response = await getSolitaireAdminStockDropdowns();
        if (response.success || response.Success) {
          const rawData = response.data || response.Data || [];
          const dict = {};
          rawData.forEach((item) => {
            const rawType = item.type || item.Type || "";
            const type = rawType.toUpperCase();
            if (!dict[type]) dict[type] = [];
            dict[type].push({
              value: item.name || item.Name || item.id || item.ID,
              label: item.textName || item.TextName || item.name || item.Name || item.id || item.ID
            });
          });
          setMasterDropdowns(dict);
        } else {
          toast.error("Failed to load search dropdowns data.");
        }
      } catch (err) {
        console.error("Error loading dropdown data:", err);
        toast.error("Failed to load search dropdown filters.");
      }
      setLoadingDropdowns(false);
    };
    fetchDropdowns();
  }, []);

  const getOptions = (typeKey) => {
    return masterDropdowns[typeKey.toUpperCase()] || [];
  };

  const handleSelectChange = (name, selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    setFilters((prev) => ({
      ...prev,
      [name]: values
    }));
  };

  const customStyles = useMemo(() => ({
    control: (provided) => ({
      ...provided,
      backgroundColor: "var(--vz-secondary-bg, #fff)",
      borderColor: "var(--vz-border-color, #ced4da)",
      color: "var(--vz-body-color, #495057)",
      minHeight: "31px",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "var(--vz-secondary-bg, #fff)",
      color: "var(--vz-body-color, #495057)",
      border: "1px solid var(--vz-border-color, #dee2e6)",
      zIndex: 20,
    }),
    menuList: (provided) => ({
      ...provided,
      backgroundColor: "var(--vz-secondary-bg, #fff)",
      color: "var(--vz-body-color, #495057)",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#3b5de7" : "transparent",
      color: state.isFocused ? "#ffffff" : "var(--vz-body-color, #495057)",
      cursor: "pointer",
      ":active": {
        backgroundColor: "#3b5de7",
      },
    }),
    input: (provided) => ({
      ...provided,
      color: "var(--vz-body-color, #495057)",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "var(--vz-secondary-color, #878a99)",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "var(--vz-body-color, #495057)",
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "transparent",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      color: "var(--vz-body-color, #495057)",
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: "var(--vz-secondary-color, #878a99)",
      ":hover": {
        color: "var(--vz-body-color, #495057)",
      },
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "var(--vz-secondary-color, #878a99)",
      ":hover": {
        color: "var(--vz-body-color, #495057)",
      },
    }),
  }), []);

  const selectValue = useMemo(() => {
    return selectedLotValues.map((val) => {
      const match = lotOptions.find((o) => o.value === val);
      return match || { value: val, label: String(val).toUpperCase() };
    });
  }, [lotOptions, selectedLotValues]);

  const handleLotDropdownChange = (selectedOptions) => {
    const selectedValues = selectedOptions ? selectedOptions.map((o) => o.value) : [];
    setFilters((prev) => ({
      ...prev,
      lotNo: selectedValues.join("\n")
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setSelectedRows({});
    setSearchResults([]);
    setHasSearched(false);
    toast.success("Filters cleared successfully.");
  };

  const buildPayload = () => {
    const payload = { ...filters };
    if (Array.isArray(payload.date)) {
      payload.date = payload.date[0] ? formatLocalDate(new Date(payload.date[0])) : "";
    }
    const numericFields = [
      "ctsFrm", "ctsTo", "backFrm", "backTo", "priceFrm", "priceTo",
      "lotFrm", "lotTo", "tDepthFrm", "tDepthTo", "tablePerFrm", "tablePerTo",
      "caFrm", "caTo", "chFrm", "chTo", "phFrm", "phTo", "paFrm", "paTo",
      "backPer", "ratePer", "backPlusMinus", "ratePlusMinus"
    ];
    numericFields.forEach((field) => {
      if (payload[field] === "" || payload[field] === null || payload[field] === undefined) {
        payload[field] = 0;
      } else {
        const val = parseFloat(payload[field]);
        payload[field] = isNaN(val) ? 0 : val;
      }
    });

    payload.proportion = payload.prop;
    payload.polish = payload.pol;
    payload.symmetry = payload.sym;
    payload.fluorescence = payload.fl;
    payload.natts = payload.nts;

    payload.purchaseChkBox = payload.purCheck;
    payload.reviseCheckBox = payload.revCheck;
    payload.newArrivalChkBox = payload.newArrCheck;
    payload.webRevisedChkBox = payload.webRevCheck;
    payload.unholdDateChkBox = payload.unholdCheck;
    payload.labDateChkBox = payload.labCheck;

    delete payload.prop;
    delete payload.pol;
    delete payload.sym;
    delete payload.fl;
    delete payload.nts;
    delete payload.purCheck;
    delete payload.revCheck;
    delete payload.newArrCheck;
    delete payload.webRevCheck;
    delete payload.unholdCheck;
    delete payload.labCheck;

    return payload;
  };

  const handleSearch = async () => {
    setLoading(true);
    setSelectedRows({});
    setHasSearched(true);
    try {
      const payload = buildPayload();
      const response = await getSolitaireAdminStockReport(payload);
      if (response.success || response.Success) {
        const data = response.data || response.Data || [];
        setSearchResults(data);
        toast.success(`${data.length} records found.`);
      } else {
        toast.error(response.message || response.Message || "Failed to retrieve stock search data.");
      }
    } catch (err) {
      const apiErrorMessage = err.response?.data?.Message || err.response?.data?.message || err.message || "Error retrieving stock search report.";
      toast.error(apiErrorMessage);
    }
    setLoading(false);
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    React.startTransition(() => {
      const newSelected = {};
      if (checked) {
        searchResults.forEach((item, index) => {
          newSelected[index] = true;
        });
      }
      setSelectedRows(newSelected);
    });
  };

  const handleRowSelect = (index) => {
    React.startTransition(() => {
      setSelectedRows((prev) => ({
        ...prev,
        [index]: !prev[index]
      }));
    });
  };

  const columns = useMemo(() => {
    const cols = [
      {
        id: "selection",
        header: () => (
          <input
            type="checkbox"
            className="form-check-input"
            onChange={handleSelectAll}
            checked={
              searchResults.length > 0 &&
              Object.keys(selectedRows).length === searchResults.length
            }
          />
        ),
        cell: (cellProps) => {
          const absoluteIdx = cellProps.row.index;
          return (
            <SelectionCell
              index={absoluteIdx}
              isSelected={!!selectedRows[absoluteIdx]}
              onChange={handleRowSelect}
            />
          );
        },
        enableColumnFilter: false,
        footer: () => <span className="fw-bold text-center d-block">{t("Total")}</span>
      },
      {
        id: "actions",
        header: t("Actions"),
        enableColumnFilter: false,
        cell: (cellProps) => {
          const row = cellProps.row.original;
          return (
            <div className="d-flex gap-1 align-items-center">
              {(row.certPath || row.CertPath) && (
                <a
                  href={row.certPath || row.CertPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-icon btn-ghost-primary p-0"
                  style={{ width: "22px", height: "22px" }}
                >
                  <i className="ri-file-text-line fs-14" title="Verify Certificate"></i>
                </a>
              )}
              {(row.imagePath || row.ImagePath) && (
                <a
                  href={row.imagePath || row.ImagePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-icon btn-ghost-info p-0"
                  style={{ width: "22px", height: "22px" }}
                >
                  <i className="ri-camera-lens-line fs-14" title="View Image"></i>
                </a>
              )}
              {(row.videoPath || row.VideoPath) && (
                <a
                  href={row.videoPath || row.VideoPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-icon btn-ghost-success p-0"
                  style={{ width: "22px", height: "22px" }}
                >
                  <i className="ri-video-line fs-14" title="View Video"></i>
                </a>
              )}
              {(row.pagePath || row.PagePath) && (
                <a
                  href={row.pagePath || row.PagePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-icon btn-ghost-warning p-0"
                  style={{ width: "22px", height: "22px" }}
                >
                  <i className="ri-eye-line fs-14" title="DNA Report"></i>
                </a>
              )}
              <span className="text-secondary ms-1">
                <i className="ri-earth-line fs-14" title={row.country || row.Country || "Location"}></i>
              </span>
            </div>
          );
        },
        footer: ({ table }) => {
          const { totalAmount, totalCostAmount } = getAdminStockTableTotals(table);
          const plPer = totalCostAmount > 0 ? ((totalAmount / totalCostAmount) - 1) * 100 : 0;
          return <span className="fw-bold text-start d-block" style={{ whiteSpace: "nowrap" }}>{t("PL %")} : {fmtFixed(plPer, 2)}</span>;
        }
      },
      ...allColumns.map((col) => {
        let footerCallback = undefined;
        if (col.key === "carats") {
          footerCallback = ({ table }) => {
            const { totalCarats } = getAdminStockTableTotals(table);
            return <span className="fw-bold text-end d-block">{fmtFixed(totalCarats, 3)}</span>;
          };
        } else if (col.key === "rapa") {
          footerCallback = ({ table }) => {
            const { totalCarats, totalMRPAmt } = getAdminStockTableTotals(table);
            const avgMrp = totalCarats > 0 ? totalMRPAmt / totalCarats : 0;
            return <span className="fw-bold text-end d-block">{fmtFixed(avgMrp, 2)}</span>;
          };
        } else if (col.key === "askingBack") {
          footerCallback = ({ table }) => {
            const { totalAmount, totalMRPAmt } = getAdminStockTableTotals(table);
            const avgBack = totalMRPAmt > 0 ? (totalAmount / totalMRPAmt) * 100 - 100 : 0;
            return <span className="fw-bold text-end d-block">{fmtFixed(avgBack, 2)}</span>;
          };
        } else if (col.key === "askingRate") {
          footerCallback = ({ table }) => {
            const { totalCarats, totalAmount } = getAdminStockTableTotals(table);
            const avgRate = totalCarats > 0 ? totalAmount / totalCarats : 0;
            return <span className="fw-bold text-end d-block">{fmtFixed(avgRate, 2)}</span>;
          };
        } else if (col.key === "askingAmount") {
          footerCallback = ({ table }) => {
            const { totalAmount } = getAdminStockTableTotals(table);
            return <span className="fw-bold text-end d-block">{fmtFixed(totalAmount, 2)}</span>;
          };
        } else if (col.key === "purchaseBack") {
          footerCallback = ({ table }) => {
            const { totalCostAmount, totalMRPAmt } = getAdminStockTableTotals(table);
            const avgCostBack = totalMRPAmt > 0 ? (totalCostAmount / totalMRPAmt) * 100 - 100 : 0;
            return <span className="fw-bold text-end d-block">{fmtFixed(avgCostBack, 2)}</span>;
          };
        } else if (col.key === "purchaseRate") {
          footerCallback = ({ table }) => {
            const { totalCarats, totalCostAmount } = getAdminStockTableTotals(table);
            const avgCostRate = totalCarats > 0 ? totalCostAmount / totalCarats : 0;
            return <span className="fw-bold text-end d-block">{fmtFixed(avgCostRate, 2)}</span>;
          };
        } else if (col.key === "purChaseAmount") {
          footerCallback = ({ table }) => {
            const { totalCostAmount } = getAdminStockTableTotals(table);
            return <span className="fw-bold text-end d-block">{fmtFixed(totalCostAmount, 2)}</span>;
          };
        } else if (col.key === "mrpAmount") {
          footerCallback = ({ table }) => {
            const { totalMrpAmountColumn } = getAdminStockTableTotals(table);
            return <span className="fw-bold text-end d-block">{fmtFixed(totalMrpAmountColumn, 2)}</span>;
          };
        }

        return {
          header: t(col.label),
          accessorKey: col.key,
          accessorFn: (row) => {
            if (row[col.key] !== undefined && row[col.key] !== null) return row[col.key];
            const pascal = col.key.charAt(0).toUpperCase() + col.key.slice(1);
            if (row[pascal] !== undefined && row[pascal] !== null) return row[pascal];
            if (col.key === "cpavg") return row.CPAVG ?? row.cPAVG;
            if (col.key === "cpavgAmt") return row.CPAVGAmt ?? row.cPAVGAmt;
            if (col.key === "spavg") return row.SPAVG ?? row.sPAVG;
            if (col.key === "spavgAmt") return row.SPAVGAmt ?? row.sPAVGAmt;
            if (col.key === "purChaseAmount") return row.PurChaseAmount ?? row.PurchaseAmount;
            return row[col.key];
          },
          enableColumnFilter: true,
          filterFn: "includesString",
          className: col.align || "",
          cell: (cellProps) => {
            const row = cellProps.row.original;
            const val = cellProps.getValue();
            const status = row.curStatus || row.CurStatus || "";

            let displayVal = val;
            if (col.type === "carats") {
              displayVal = parseFloat(val || 0).toFixed(3);
            } else if (col.type === "discount") {
              displayVal = parseFloat(val || 0).toFixed(2);
            } else if (col.type === "number") {
              displayVal = parseFloat(val || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
            }

            let statusColor = "";
            if (status === "M") statusColor = "text-danger fw-semibold";
            else if (status === "LAB") statusColor = "text-info fw-semibold";
            else if (status === "I") statusColor = "text-primary fw-semibold";
            else if (status === "L") statusColor = "text-success fw-semibold";
            else if (status === "PS") statusColor = "text-success fw-bold";
            else if (status === "Sold") statusColor = "text-purple fw-bold";
            else if (status === "PH") statusColor = "text-warning fw-semibold";
            else if (status === "MI") statusColor = "text-success fw-semibold";

            if (col.key === "lotNo") {
              return (
                <span
                  className="text-primary text-decoration-underline fw-semibold"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setSelectedRowDetail(row);
                    setDetailMediaTab("image");
                    setDetailModal(true);
                  }}
                >
                  {val}
                </span>
              );
            }

            if (col.key === "cNo") {
              const certUrl = row.certPath || row.CertPath;
              if (certUrl) {
                return (
                  <a
                    href={certUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-decoration-underline"
                  >
                    {displayVal !== null && displayVal !== undefined ? String(displayVal) : ""}
                  </a>
                );
              }
            }

            return (
              <span
                className={classnames(
                  col.align || "",
                  col.fw ? `fw-${col.fw}` : "",
                  col.color || "",
                  col.key === "curStatus" ? statusColor : ""
                )}
              >
                {displayVal !== null && displayVal !== undefined ? String(displayVal) : ""}
              </span>
            );
          },
          footer: footerCallback
        };
      })
    ];
    return cols;
  }, [searchResults, selectedRows, t]);

  const selectedLotNos = useMemo(() => {
    return searchResults
      .filter((_, idx) => selectedRows[idx])
      .map((item) => item.lotNo || item.LotNo || "");
  }, [searchResults, selectedRows]);

  const totals = useMemo(() => {
    const selectedKeys = Object.keys(selectedRows).filter(k => selectedRows[k]);
    const currentList = selectedKeys.map(idx => searchResults[idx]).filter(Boolean);

    let pcs = currentList.length;
    let carats = 0;
    let amount = 0;
    let mrpAmt = 0;
    let purAmt = 0;
    let actualAmt = 0;

    currentList.forEach((item) => {
      carats += parseFloat(item.carats || item.Carats || 0);
      amount += parseFloat(item.askingAmount || item.AskingAmount || 0);
      mrpAmt += parseFloat(item.mrpAmount || item.MRPAmount || 0);
      purAmt += parseFloat(item.purChaseAmount || item.PurChaseAmount || 0);
      actualAmt += parseFloat(item.actualAmount || item.ActualAmount || 0);
    });

    const avgMRP = carats > 0 ? (mrpAmt / carats).toFixed(2) : "0.00";
    const avgRate = carats > 0 ? (amount / carats).toFixed(2) : "0.00";
    const avgPurRate = carats > 0 ? (purAmt / carats).toFixed(2) : "0.00";
    const avgActualRate = carats > 0 ? (actualAmt / carats).toFixed(2) : "0.00";

    const avgDis = mrpAmt > 0 ? (((purAmt / mrpAmt) * 100) - 100).toFixed(2) : "0.00";
    const avgAskingDis = mrpAmt > 0 ? (((amount / mrpAmt) * 100) - 100).toFixed(2) : "0.00";

    const plPer = purAmt > 0 ? (((amount / purAmt) - 1) * 100).toFixed(2) : "0.00";

    return {
      pcs,
      carats: carats.toFixed(3),
      amount: amount.toFixed(2),
      avgRate,
      avgDis,
      avgAskingDis,
      avgMRP,
      avgPurRate,
      purAmt: purAmt.toFixed(2),
      avgActualRate,
      actualAmt: actualAmt.toFixed(2),
      plPer
    };
  }, [searchResults, selectedRows]);

  const handleUpdateLocation = async () => {
    if (selectedLotNos.length === 0) {
      toast.warning("Please select at least one row.");
      return;
    }
    try {
      const payload = {
        city: locationCity,
        state: locationState,
        country: locationCountry,
        lotNumbers: selectedLotNos
      };
      const response = await updateSolitaireAdminStockLocation(payload);
      if (response.success || response.Success) {
        toast.success(response.data || response.Data || "Location updated successfully.");
        setLocationModal(false);
        setMoreModal(false);
        handleSearch();
      } else {
        toast.error(response.message || response.Message || "Failed to update location.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update location.");
    }
  };

  const handleUpdateBoxAndGroup = async () => {
    if (selectedLotNos.length === 0) {
      toast.warning("Please select at least one row.");
      return;
    }
    if (!boxNameUpdate && !groupNameUpdate) {
      toast.warning("Please enter a value for either Box Name or Group.");
      return;
    }
    try {
      const payload = {
        boxName: boxNameUpdate,
        group: groupNameUpdate,
        lotNumbers: selectedLotNos
      };
      const response = await updateSolitaireAdminStockBoxGroup(payload);
      if (response.success || response.Success) {
        toast.success(response.data || response.Data || "Box/Group updated successfully.");
        setMoreModal(false);
        setBoxNameUpdate("");
        setGroupNameUpdate("");
        handleSearch();
      } else {
        toast.error(response.message || response.Message || "Failed to update box/group.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update box/group.");
    }
  };

  const handleExport = async (format) => {
    const activeFormat = format || printFormat || "Print";
    let exportCols = [...allColumns];

    if (activeFormat === "CustomerPrint") {
      const excludeKeys = [
        "purchaseBack", "purchaseRate", "purChaseAmount",
        "actualBack", "actualRate", "actualAmount",
        "cpavg", "cpavgAmt", "spavg", "spavgAmt",
        "memoPartyName", "holdPartyName"
      ];
      exportCols = exportCols.filter(c => !excludeKeys.includes(c.key));
    } else if (["Rapnet", "Nivoda", "VDB", "DiaSense"].includes(activeFormat)) {
      const rapnetKeys = [
        "lotNo", "shape", "carats", "color", "clarity", "prop", "pol", "sym", "fl", "lab", "cNo",
        "askingRate", "askingBack", "askingAmount", "imagePath", "videoPath"
      ];
      exportCols = exportCols.filter(c => rapnetKeys.includes(c.key));
    }

    const headers = exportCols.map(c => t(c.label));
    const exportData = Object.keys(selectedRows).length > 0
      ? searchResults.filter((_, idx) => selectedRows[idx])
      : searchResults;

    if (exportData.length === 0) {
      toast.warning("No records to export.");
      return;
    }

    const rows = exportData.map(row => {
      return exportCols.map(col => {
        const val = row[col.key] !== undefined ? row[col.key] : row[col.key.charAt(0).toUpperCase() + col.key.slice(1)];
        if (col.type === "carats") return parseFloat(val || 0).toFixed(3);
        if (col.type === "discount") return parseFloat(val || 0).toFixed(2);
        if (col.type === "number") return parseFloat(val || 0).toFixed(2);
        return val !== null && val !== undefined ? String(val) : "";
      });
    });

    await exportToExcel(headers, rows, activeFormat, `Admin_Stock_${activeFormat}`);
    toast.success("Excel exported successfully.");
  };

  document.title = `${t("Admin Stock Search")} | ${t("Admin")}`;

  return (
    <React.Fragment>
      <style>{`
        .text-danger-row td {
          color: #FF4444 !important;
        }
        .text-info-row td {
          color: #00CED1 !important;
        }
        .text-primary-row td {
          color: #0000FF !important;
        }
        .text-success-row td {
          color: #008000 !important;
        }
        .text-purple-row td {
          color: #9400D3 !important;
        }
        .text-warning-row td {
          color: #D2691E !important;
        }
      `}</style>

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Admin Stock Search")} pageTitle={t("Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Admin Stock Search Results") : t("Admin Stock Search Filters")}
            </h5>
            <div className="d-flex gap-2">
              {!hasSearched ? (
                <>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handleSearch} disabled={loading}>
                    {loading ? t("Searching...") : t("Report")}
                  </Button>
                  <Button color="soft-secondary" className="btn-sm rounded-2 px-3 py-1" onClick={clearFilters}>
                    {t("Clear")}
                  </Button>
                  <Button color="soft-info" className="btn-sm rounded-2 px-3 py-1" onClick={() => setHasSearched(true)} disabled={searchResults.length === 0}>
                    {t("Previous Record")}
                  </Button>
                </>
              ) : (
                <>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={() => setHasSearched(false)}>
                    {t("New Search")}
                  </Button>
                  {searchResults.length > 0 && (
                    <div className="d-flex align-items-center gap-1">
                      <UncontrolledDropdown>
                        <DropdownToggle
                          color="success"
                          className="btn-sm rounded-2 px-3 py-1"
                          caret
                        >
                          <i className="ri-file-excel-2-line align-middle me-1"></i>
                          {t("Excel")} / {t("Print")}
                        </DropdownToggle>
                        <DropdownMenu style={{ minWidth: "160px", zIndex: 1050 }}>
                          {[
                            { key: "Print", label: t("Direct Print") },
                            { key: "StockPrint", label: t("Admin Print") },
                            { key: "CustomerPrint", label: t("Customer Print") },
                            { key: "DiaSense", label: t("DiaSense") },
                            { key: "Rapnet", label: t("Rapnet") },
                            { key: "Nivoda", label: t("Nivoda") },
                            { key: "VDB", label: t("VDB") },
                          ].map((fmt) => (
                            <DropdownItem
                              key={fmt.key}
                              onClick={() => handleExport(fmt.key)}
                            >
                              {fmt.label}
                            </DropdownItem>
                          ))}
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {!hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody className="bg-light-subtle">
                <Row className="g-3 mb-3">
                  <Col lg={10} md={9}>
                    <Row className="g-3 mb-3">
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Stock Till Date")}</Label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          style={{ height: "35px" }}
                          value={filters.date}
                          onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
                        />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Show")}</Label>
                        <Input type="select" name="show" value={filters.show} onChange={handleInputChange}>
                          <option value="All">{t("All")}</option>
                          <option value="Sold">{t("Sold")}</option>
                          <option value="Unsold">{t("Unsold")}</option>
                        </Input>
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Hold/UnHold")}</Label>
                        <Input type="select" name="holdUnHold" value={filters.holdUnHold} onChange={handleInputChange}>
                          <option value="All">{t("All")}</option>
                          <option value="Hold">{t("Hold")}</option>
                          <option value="Unhold">{t("Unhold")}</option>
                        </Input>
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Single/Parcel")}</Label>
                        <Input type="select" name="stoneTypes" value={filters.stoneTypes} onChange={handleInputChange}>
                          <option value="Single">{t("Single")}</option>
                          <option value="Parcel">{t("Parcel")}</option>
                          <option value="All">{t("All")}</option>
                        </Input>
                      </Col>
                      <Col lg={4} md={8}>
                        <Label className="fw-medium">{t("Status")}</Label>
                        <Input type="select" name="status" value={filters.status} onChange={handleInputChange}>
                          <option value="All">{t("All")}</option>
                          <option value="OnHand">{t("OnHand")}</option>
                          <option value="OnMemo">{t("OnMemo")}</option>
                          <option value="OnHand&Int.Memo">{t("OnHand & Int.Memo")}</option>
                          <option value="OnHand + Memo In">{t("OnHand + Memo In")}</option>
                          <option value="OnHand + Party Hold">{t("OnHand + Party Hold")}</option>
                          <option value="Memo In">{t("Memo In")}</option>
                          <option value="Party Hold">{t("Party Hold")}</option>
                          <option value="All - Party Hold">{t("All - Party Hold")}</option>
                        </Input>
                      </Col>
                    </Row>

                    <Row className="g-3">
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Back %")}</Label>
                        <Input type="number" step="0.01" name="backPer" value={filters.backPer} onChange={handleInputChange} placeholder={t("Back %")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Back +-")}</Label>
                        <Input type="number" step="0.01" name="backPlusMinus" value={filters.backPlusMinus} onChange={handleInputChange} placeholder={t("Back +-")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Rate %")}</Label>
                        <Input type="number" step="0.01" name="ratePer" value={filters.ratePer} onChange={handleInputChange} placeholder={t("Rate %")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Rate +-")}</Label>
                        <Input type="number" step="0.01" name="ratePlusMinus" value={filters.ratePlusMinus} onChange={handleInputChange} placeholder={t("Rate +-")} />
                      </Col>
                    </Row>
                  </Col>

                  <Col lg={2} md={3} className="d-flex flex-column">
                    <FormGroup className="mb-0 h-100 d-flex flex-column">
                      <Label className="fw-medium mb-1">{t("Enter Lot No")}</Label>
                      <Input
                        type="select"
                        name="filters"
                        value={filters.filters}
                        onChange={handleInputChange}
                        className="mb-2"
                      >
                        <option value="LotNo">{t("LotNo")}</option>
                        <option value="LotNoNot">{t("LotNo Not")}</option>
                        <option value="LotNoLike">{t("LotNo Like")}</option>
                        <option value="CertNo">{t("CertNo")}</option>
                        <option value="CertNoNot">{t("CertNo Not")}</option>
                        <option value="SrNo">{t("SrNo")}</option>
                        <option value="SrNoNot">{t("SrNo Not")}</option>
                        <option value="KapanNo">{t("KapanNo")}</option>
                        <option value="KapanNoNot">{t("KapanNo Not")}</option>
                        <option value="PacketNo">{t("PacketNo")}</option>
                        <option value="PacketNoNot">{t("PacketNo Not")}</option>
                      </Input>
                      <Input
                        type="textarea"
                        name="lotNo"
                        rows="4"
                        value={filters.lotNo}
                        onChange={handleInputChange}
                        placeholder={t("Search by lot no")}
                        className="mb-2"
                        style={{ minHeight: "108px", resize: "none" }}
                      />
                      <Label className="fw-medium mb-1 mt-1">{t("Show Lot No")}</Label>
                      <Select
                        isMulti
                        name="showLotNo"
                        options={lotOptions}
                        value={selectValue}
                        onChange={handleLotDropdownChange}
                        inputValue={lotSearchValue}
                        onInputChange={(newValue, actionMeta) => {
                          if (actionMeta.action === "input-change") {
                            setLotSearchValue(newValue);
                            debouncedFetchLotsList(newValue);
                          } else if (actionMeta.action === "menu-close") {
                            setLotSearchValue("");
                            debouncedFetchLotsList("");
                          }
                        }}
                        placeholder={t("Select Lot No")}
                        isLoading={loadingLots}
                        classNamePrefix="react-select"
                        closeMenuOnSelect={false}
                        components={{
                          Option: CustomOption,
                          MenuList: CustomMenuList,
                          MultiValue: () => null,
                          ValueContainer: CustomValueContainer
                        }}
                        isAllSelected={isAllSelected}
                        onSelectAll={handleSelectAllLots}
                        t={t}
                        isSearchable={true}
                        hideSelectedOptions={false}
                        styles={customStyles}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Nav pills className="nav-pills-custom nav-success mb-3 bg-light p-1 rounded-3" style={{ border: "none" }}>
                  <NavItem style={{ flex: 1, textAlign: "center" }}>
                    <NavLink
                      className={classnames({ active: activeTab === "1" })}
                      onClick={() => setActiveTab("1")}
                      style={{ cursor: "pointer", borderRadius: "6px" }}
                    >
                      <i className="ri-settings-4-line align-middle me-1"></i>
                      {t("Basic & Grading Search")}
                    </NavLink>
                  </NavItem>
                  <NavItem style={{ flex: 1, textAlign: "center" }}>
                    <NavLink
                      className={classnames({ active: activeTab === "2" })}
                      onClick={() => setActiveTab("2")}
                      style={{ cursor: "pointer", borderRadius: "6px" }}
                    >
                      <i className="ri-numbers-line align-middle me-1"></i>
                      {t("Numeric Search")}
                    </NavLink>
                  </NavItem>
                  <NavItem style={{ flex: 1, textAlign: "center" }}>
                    <NavLink
                      className={classnames({ active: activeTab === "3" })}
                      onClick={() => setActiveTab("3")}
                      style={{ cursor: "pointer", borderRadius: "6px" }}
                    >
                      <i className="ri-calendar-line align-middle me-1"></i>
                      {t("Date Search")}
                    </NavLink>
                  </NavItem>
                </Nav>

                <TabContent activeTab={activeTab}>
                  <TabPane tabId="1">
                    <Row className="g-3 mb-3">
                      <div className="col-lg col-md-4 col-sm-6">
                        <Label className="fw-medium">{t("Shape Group")}</Label>
                        <Select isMulti name="shapeGroup" options={getOptions("SHAPEGROUP")} value={getOptions("SHAPEGROUP").filter((o) => filters.shapeGroup.includes(o.value))} onChange={(sel) => handleSelectChange("shapeGroup", sel)} placeholder={t("Shape Group")} isLoading={loadingDropdowns} />
                      </div>
                      <div className="col-lg col-md-4 col-sm-6">
                        <Label className="fw-medium">{t("Shape")}</Label>
                        <Select isMulti name="shape" options={getOptions("SHAPE")} value={getOptions("SHAPE").filter((o) => filters.shape.includes(o.value))} onChange={(sel) => handleSelectChange("shape", sel)} placeholder={t("Shape")} isLoading={loadingDropdowns} />
                      </div>
                      <div className="col-lg col-md-4 col-sm-6">
                        <Label className="fw-medium">{t("Color Group")}</Label>
                        <Select isMulti name="colorGroup" options={getOptions("COLORGROUP")} value={getOptions("COLORGROUP").filter((o) => filters.colorGroup.includes(o.value))} onChange={(sel) => handleSelectChange("colorGroup", sel)} placeholder={t("Color Group")} isLoading={loadingDropdowns} />
                      </div>
                      <div className="col-lg col-md-4 col-sm-6">
                        <Label className="fw-medium">{t("Color")}</Label>
                        <Select isMulti name="color" options={getOptions("COLOR")} value={getOptions("COLOR").filter((o) => filters.color.includes(o.value))} onChange={(sel) => handleSelectChange("color", sel)} placeholder={t("Color")} isLoading={loadingDropdowns} />
                      </div>
                      <div className="col-lg col-md-4 col-sm-6">
                        <Label className="fw-medium">{t("Size")}</Label>
                        <Select isMulti name="size" options={getOptions("SIZE")} value={getOptions("SIZE").filter((o) => filters.size.includes(o.value))} onChange={(sel) => handleSelectChange("size", sel)} placeholder={t("Size")} isLoading={loadingDropdowns} />
                      </div>
                      <div className="col-lg col-md-4 col-sm-6">
                        <Label className="fw-medium">{t("Clarity")}</Label>
                        <Select isMulti name="clarity" options={getOptions("CLARITY")} value={getOptions("CLARITY").filter((o) => filters.clarity.includes(o.value))} onChange={(sel) => handleSelectChange("clarity", sel)} placeholder={t("Clarity")} isLoading={loadingDropdowns} />
                      </div>
                    </Row>

                    <Row className="g-3 mb-3">
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Prop.")}</Label>
                        <Select isMulti name="prop" options={getOptions("Proportion")} value={getOptions("Proportion").filter((o) => filters.prop.includes(o.value))} onChange={(sel) => handleSelectChange("prop", sel)} placeholder={t("Proportion")} isLoading={loadingDropdowns} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Polish")}</Label>
                        <Select isMulti name="pol" options={getOptions("POLISH")} value={getOptions("POLISH").filter((o) => filters.pol.includes(o.value))} onChange={(sel) => handleSelectChange("pol", sel)} placeholder={t("Polish")} isLoading={loadingDropdowns} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Sym.")}</Label>
                        <Select isMulti name="sym" options={getOptions("Symmetry")} value={getOptions("Symmetry").filter((o) => filters.sym.includes(o.value))} onChange={(sel) => handleSelectChange("sym", sel)} placeholder={t("Symmetry")} isLoading={loadingDropdowns} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Lab")}</Label>
                        <Select isMulti name="lab" options={getOptions("LAB")} value={getOptions("LAB").filter((o) => filters.lab.includes(o.value))} onChange={(sel) => handleSelectChange("lab", sel)} placeholder={t("LAB")} isLoading={loadingDropdowns} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Rough")}</Label>
                        <Select isMulti name="rough" options={getOptions("ROUGH")} value={getOptions("ROUGH").filter((o) => filters.rough.includes(o.value))} onChange={(sel) => handleSelectChange("rough", sel)} placeholder={t("Rough")} isLoading={loadingDropdowns} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("HA")}</Label>
                        <Select isMulti name="ha" options={getOptions("HA")} value={getOptions("HA").filter((o) => filters.ha.includes(o.value))} onChange={(sel) => handleSelectChange("ha", sel)} placeholder={t("HA")} isLoading={loadingDropdowns} />
                      </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Location")}</Label>
                        <Select isMulti name="location" options={getOptions("LOCATION")} value={getOptions("LOCATION").filter((o) => filters.location.includes(o.value))} onChange={(sel) => handleSelectChange("location", sel)} placeholder={t("Location")} isLoading={loadingDropdowns} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Flou.")}</Label>
                        <Select isMulti name="fl" options={getOptions("Fluorescence")} value={getOptions("Fluorescence").filter((o) => filters.fl.includes(o.value))} onChange={(sel) => handleSelectChange("fl", sel)} placeholder={t("Fluorescence")} isLoading={loadingDropdowns} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Milky")}</Label>
                        <Select isMulti name="milky" options={getOptions("MILKY")} value={getOptions("MILKY").filter((o) => filters.milky.includes(o.value))} onChange={(sel) => handleSelectChange("milky", sel)} placeholder={t("Milky")} isLoading={loadingDropdowns} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Luster")}</Label>
                        <Select isMulti name="luster" options={getOptions("LUSTER")} value={getOptions("LUSTER").filter((o) => filters.luster.includes(o.value))} onChange={(sel) => handleSelectChange("luster", sel)} placeholder={t("Luster")} isLoading={loadingDropdowns} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Natts")}</Label>
                        <Select isMulti name="nts" options={getOptions("Natts")} value={getOptions("Natts").filter((o) => filters.nts.includes(o.value))} onChange={(sel) => handleSelectChange("nts", sel)} placeholder={t("Natts")} isLoading={loadingDropdowns} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Shade")}</Label>
                        <Select isMulti name="shade" options={getOptions("SHADE")} value={getOptions("SHADE").filter((o) => filters.shade.includes(o.value))} onChange={(sel) => handleSelectChange("shade", sel)} placeholder={t("Shade")} isLoading={loadingDropdowns} />
                      </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                      <Col lg={3} md={6}>
                        <Label className="fw-medium">{t("FL Color")}</Label>
                        <Select isMulti name="flColor" options={getOptions("FLCOLOR")} value={getOptions("FLCOLOR").filter((o) => filters.flColor.includes(o.value))} onChange={(sel) => handleSelectChange("flColor", sel)} placeholder={t("FL Color")} isLoading={loadingDropdowns} />
                      </Col>
                      <Col lg={3} md={6}>
                        <Label className="fw-medium">{t("Group")}</Label>
                        <Select isMulti name="itemGroup" options={getOptions("ITEMGROUP")} value={getOptions("ITEMGROUP").filter((o) => filters.itemGroup.includes(o.value))} onChange={(sel) => handleSelectChange("itemGroup", sel)} placeholder={t("Group")} isLoading={loadingDropdowns} />
                      </Col>
                      <Col lg={3} md={6}>
                        <Label className="fw-medium">{t("Pair")}</Label>
                        <Select isMulti name="pair" options={getOptions("PAIR")} value={getOptions("PAIR").filter((o) => filters.pair.includes(o.value))} onChange={(sel) => handleSelectChange("pair", sel)} placeholder={t("Pair")} isLoading={loadingDropdowns} />
                      </Col>
                      <Col lg={3} md={6}>
                        <Label className="fw-medium">{t("Box Name")}</Label>
                        <Select isMulti name="boxNm" options={getOptions("BoxName")} value={getOptions("BoxName").filter((o) => filters.boxNm.includes(o.value))} onChange={(sel) => handleSelectChange("boxNm", sel)} placeholder={t("Box Name")} isLoading={loadingDropdowns} />
                      </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Carats From")}</Label>
                        <Input type="number" step="0.001" name="ctsFrm" value={filters.ctsFrm} onChange={handleInputChange} placeholder={t("Carats From")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Carats To")}</Label>
                        <Input type="number" step="0.001" name="ctsTo" value={filters.ctsTo} onChange={handleInputChange} placeholder={t("Carats To")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Back From")}</Label>
                        <Input type="number" step="0.01" name="backFrm" value={filters.backFrm} onChange={handleInputChange} placeholder={t("Back From")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Back To")}</Label>
                        <Input type="number" step="0.01" name="backTo" value={filters.backTo} onChange={handleInputChange} placeholder={t("Back To")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Price From")}</Label>
                        <Input type="number" step="0.01" name="priceFrm" value={filters.priceFrm} onChange={handleInputChange} placeholder={t("Price From")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Price To")}</Label>
                        <Input type="number" step="0.01" name="priceTo" value={filters.priceTo} onChange={handleInputChange} placeholder={t("Price To")} />
                      </Col>
                    </Row>
                    <Row className="g-3">
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Lotno From")}</Label>
                        <Input type="number" name="lotFrm" value={filters.lotFrm} onChange={handleInputChange} placeholder={t("Lotno From")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Lotno To")}</Label>
                        <Input type="number" name="lotTo" value={filters.lotTo} onChange={handleInputChange} placeholder={t("Lotno To")} />
                      </Col>
                    </Row>
                  </TabPane>

                  <TabPane tabId="2">
                    <Row className="g-3">
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Table Depth % From")}</Label>
                        <Input type="number" step="0.01" name="tDepthFrm" value={filters.tDepthFrm} onChange={handleInputChange} placeholder={t("Table Depth % From")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Table Depth % To")}</Label>
                        <Input type="number" step="0.01" name="tDepthTo" value={filters.tDepthTo} onChange={handleInputChange} placeholder={t("Table Depth % To")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Table % From")}</Label>
                        <Input type="number" step="0.01" name="tablePerFrm" value={filters.tablePerFrm} onChange={handleInputChange} placeholder={t("Table % From")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("Table % To")}</Label>
                        <Input type="number" step="0.01" name="tablePerTo" value={filters.tablePerTo} onChange={handleInputChange} placeholder={t("Table % To")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("CA From")}</Label>
                        <Input type="number" step="0.01" name="caFrm" value={filters.caFrm} onChange={handleInputChange} placeholder={t("CA From")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("CA To")}</Label>
                        <Input type="number" step="0.01" name="caTo" value={filters.caTo} onChange={handleInputChange} placeholder={t("CA To")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("CH From")}</Label>
                        <Input type="number" step="0.01" name="chFrm" value={filters.chFrm} onChange={handleInputChange} placeholder={t("CH From")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("CH To")}</Label>
                        <Input type="number" step="0.01" name="chTo" value={filters.chTo} onChange={handleInputChange} placeholder={t("CH To")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("PH From")}</Label>
                        <Input type="number" step="0.01" name="phFrm" value={filters.phFrm} onChange={handleInputChange} placeholder={t("PH From")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("PH To")}</Label>
                        <Input type="number" step="0.01" name="phTo" value={filters.phTo} onChange={handleInputChange} placeholder={t("PH To")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("PA From")}</Label>
                        <Input type="number" step="0.01" name="paFrm" value={filters.paFrm} onChange={handleInputChange} placeholder={t("PA From")} />
                      </Col>
                      <Col lg={2} md={4}>
                        <Label className="fw-medium">{t("PA To")}</Label>
                        <Input type="number" step="0.01" name="paTo" value={filters.paTo} onChange={handleInputChange} placeholder={t("PA To")} />
                      </Col>
                    </Row>
                  </TabPane>

                  <TabPane tabId="3">
                    <Row className="g-3">
                      <Col lg={4} md={6}>
                        <div className="form-check mb-2">
                          <Input type="checkbox" className="form-check-input" id="purCheck" name="purCheck" checked={filters.purCheck} onChange={handleInputChange} />
                          <Label className="form-check-label fw-bold" htmlFor="purCheck">{t("Filter Purchase Date")}</Label>
                        </div>
                        {filters.purCheck && (
                          <Row className="g-2">
                            <Col sm={6}>
                              <Label className="fw-medium fs-12">{t("Purchase Date From")}</Label>
                              <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.frmPurchaseDate} onChange={(e) => setFilters((prev) => ({ ...prev, frmPurchaseDate: e.target.value }))} />
                            </Col>
                            <Col sm={6}>
                              <Label className="fw-medium fs-12">{t("Purchase Date To")}</Label>
                              <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.toPurchaseDate} onChange={(e) => setFilters((prev) => ({ ...prev, toPurchaseDate: e.target.value }))} />
                            </Col>
                          </Row>
                        )}
                      </Col>
                      <Col lg={4} md={6}>
                        <div className="form-check mb-2">
                          <Input type="checkbox" className="form-check-input" id="revCheck" name="revCheck" checked={filters.revCheck} onChange={handleInputChange} />
                          <Label className="form-check-label fw-bold" htmlFor="revCheck">{t("Filter Revise Date")}</Label>
                        </div>
                        {filters.revCheck && (
                          <Row className="g-2">
                            <Col sm={6}>
                              <Label className="fw-medium fs-12">{t("Revise Date From")}</Label>
                              <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.frmReviseDate} onChange={(e) => setFilters((prev) => ({ ...prev, frmReviseDate: e.target.value }))} />
                            </Col>
                            <Col sm={6}>
                              <Label className="fw-medium fs-12">{t("Revise Date To")}</Label>
                              <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.toReviseDate} onChange={(e) => setFilters((prev) => ({ ...prev, toReviseDate: e.target.value }))} />
                            </Col>
                          </Row>
                        )}
                      </Col>
                      <Col lg={4} md={6}>
                        <div className="form-check mb-2">
                          <Input type="checkbox" className="form-check-input" id="newArrCheck" name="newArrCheck" checked={filters.newArrCheck} onChange={handleInputChange} />
                          <Label className="form-check-label fw-bold" htmlFor="newArrCheck">{t("Filter New Arrival Date")}</Label>
                        </div>
                        {filters.newArrCheck && (
                          <Row className="g-2">
                            <Col sm={6}>
                              <Label className="fw-medium fs-12">{t("New Arrival From")}</Label>
                              <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.frmNewArrivalDate} onChange={(e) => setFilters((prev) => ({ ...prev, frmNewArrivalDate: e.target.value }))} />
                            </Col>
                            <Col sm={6}>
                              <Label className="fw-medium fs-12">{t("New Arrival To")}</Label>
                              <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.toNewArrivalDate} onChange={(e) => setFilters((prev) => ({ ...prev, toNewArrivalDate: e.target.value }))} />
                            </Col>
                          </Row>
                        )}
                      </Col>
                      <Col lg={4} md={6}>
                        <div className="form-check mb-2">
                          <Input type="checkbox" className="form-check-input" id="webRevCheck" name="webRevCheck" checked={filters.webRevCheck} onChange={handleInputChange} />
                          <Label className="form-check-label fw-bold" htmlFor="webRevCheck">{t("Filter Web Revised Date")}</Label>
                        </div>
                        {filters.webRevCheck && (
                          <Row className="g-2">
                            <Col sm={6}>
                              <Label className="fw-medium fs-12">{t("Web Revised From")}</Label>
                              <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.frmWebRevisedDate} onChange={(e) => setFilters((prev) => ({ ...prev, frmWebRevisedDate: e.target.value }))} />
                            </Col>
                            <Col sm={6}>
                              <Label className="fw-medium fs-12">{t("Web Revised To")}</Label>
                              <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.toWebRevisedDate} onChange={(e) => setFilters((prev) => ({ ...prev, toWebRevisedDate: e.target.value }))} />
                            </Col>
                          </Row>
                        )}
                      </Col>
                      <Col lg={4} md={6}>
                        <div className="form-check mb-2">
                          <Input type="checkbox" className="form-check-input" id="unholdCheck" name="unholdCheck" checked={filters.unholdCheck} onChange={handleInputChange} />
                          <Label className="form-check-label fw-bold" htmlFor="unholdCheck">{t("Filter Unhold Date")}</Label>
                        </div>
                        {filters.unholdCheck && (
                          <Row className="g-2">
                            <Col sm={6}>
                              <Label className="fw-medium fs-12">{t("Unhold Date From")}</Label>
                              <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.frmUnholdDate} onChange={(e) => setFilters((prev) => ({ ...prev, frmUnholdDate: e.target.value }))} />
                            </Col>
                            <Col sm={6}>
                              <Label className="fw-medium fs-12">{t("Unhold Date To")}</Label>
                              <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.toUnholdDate} onChange={(e) => setFilters((prev) => ({ ...prev, toUnholdDate: e.target.value }))} />
                            </Col>
                          </Row>
                        )}
                      </Col>
                      <Col lg={4} md={6}>
                        <div className="form-check mb-2">
                          <Input type="checkbox" className="form-check-input" id="labCheck" name="labCheck" checked={filters.labCheck} onChange={handleInputChange} />
                          <Label className="form-check-label fw-bold" htmlFor="labCheck">{t("Filter Lab Date")}</Label>
                        </div>
                        {filters.labCheck && (
                          <Row className="g-2">
                            <Col sm={6}>
                              <Label className="fw-medium fs-12">{t("Lab Date From")}</Label>
                              <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.frmLabDate} onChange={(e) => setFilters((prev) => ({ ...prev, frmLabDate: e.target.value }))} />
                            </Col>
                            <Col sm={6}>
                              <Label className="fw-medium fs-12">{t("Lab Date To")}</Label>
                              <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.toLabDate} onChange={(e) => setFilters((prev) => ({ ...prev, toLabDate: e.target.value }))} />
                            </Col>
                          </Row>
                        )}
                      </Col>
                    </Row>
                  </TabPane>
                </TabContent>
              </CardBody>
            </Card>
          )}

          {hasSearched && (
            <Card className="shadow-lg border-0 rounded-3">
              <CardBody>
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <React.Fragment>
                    {searchResults.length > 0 && (
                      <Card className="border shadow-sm mb-3">
                        <CardBody className="p-3 bg-light-subtle">
                          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">

                            <div className="d-flex flex-wrap align-items-center gap-3">
                              <div className="pe-3 border-end">
                                <span className="text-muted fw-semibold d-block mb-1" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>{t("SELECTED")}</span>
                                <span className="badge bg-primary-subtle text-primary fs-12 fw-semibold px-2 py-1">{totals.pcs} {t("Pcs")}</span>
                              </div>
                              <div className="pe-3 border-end">
                                <span className="text-muted fw-semibold d-block mb-1" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>{t("TOTAL CARATS")}</span>
                                <span className="text-dark fw-bold fs-13">{totals.carats}</span>
                              </div>
                              <div className="pe-3 border-end">
                                <span className="text-muted fw-semibold d-block mb-1" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>{t("TOTAL AMOUNT")}</span>
                                <span className="text-primary fw-bold fs-13">${parseFloat(totals.amount).toLocaleString()}</span>
                              </div>
                              <div className="pe-3 border-end">
                                <span className="text-muted fw-semibold d-block mb-1" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>{t("AVG RATE")}</span>
                                <span className="text-dark fw-bold fs-13">${parseFloat(totals.avgRate).toLocaleString()}</span>
                              </div>
                              <div className="pe-3 border-end">
                                <span className="text-muted fw-semibold d-block mb-1" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>{t("AVG DISC %")}</span>
                                <span className="text-danger fw-bold fs-13">{totals.avgAskingDis}%</span>
                              </div>
                              <div className="pe-3 border-end">
                                <span className="text-muted fw-semibold d-block mb-1" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>{t("AVG MRP")}</span>
                                <span className="text-dark fw-bold fs-13">${parseFloat(totals.avgMRP).toLocaleString()}</span>
                              </div>

                              <div className="bg-light px-2 rounded border border-light-subtle d-flex flex-column justify-content-center">
                                <span className="text-muted fw-semibold d-block mb-1" style={{ fontSize: "10px", letterSpacing: "0.5px", color: "#6f42c1" }}>{t("TOTAL COST AMT")}</span>
                                <span className="text-purple fw-bold fs-13">${parseFloat(totals.purAmt).toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="d-flex flex-wrap align-items-center gap-2">
                              {selectedLotNos.length > 0 && (
                                <div className="d-flex align-items-center gap-1 me-2 bg-light p-1 rounded border">
                                  <span className="text-muted fs-11 fw-bold ps-1 me-1 text-nowrap">{t("Selected")}:</span>
                                  <textarea
                                    className="form-control form-control-sm p-1 bg-white border"
                                    style={{ width: "120px", height: "28px", fontSize: "11px", fontWeight: "600", resize: "none", lineHeight: "1.2", fontFamily: "monospace" }}
                                    readOnly
                                    value={selectedLotNos.join("\n")}
                                    onClick={(e) => e.target.select()}
                                  />
                                  <Button
                                    color="ghost-primary"
                                    size="sm"
                                    className="btn-icon p-0 d-flex align-items-center justify-content-center"
                                    style={{ width: "24px", height: "24px" }}
                                    onClick={() => {
                                      navigator.clipboard.writeText(selectedLotNos.join("\n"));
                                      toast.success("Lot numbers copied to clipboard.");
                                    }}
                                  >
                                    <i className="ri-file-copy-2-line fs-14" />
                                  </Button>
                                </div>
                              )}

                              <Button
                                color="primary"
                                size="sm"
                                className="px-3 fw-medium"
                                disabled={selectedLotNos.length === 0}
                                onClick={() => toast.info("Memo action triggered.")}
                              >
                                <i className="ri-file-text-line me-1 align-bottom" />
                                {t("Memo")}
                              </Button>
                              <Button
                                color="success"
                                size="sm"
                                className="px-3 fw-medium"
                                disabled={selectedLotNos.length === 0}
                                onClick={() => toast.info("Sale action triggered.")}
                              >
                                <i className="ri-shopping-cart-2-line me-1 align-bottom" />
                                {t("Sale")}
                              </Button>
                              <Button
                                color="warning"
                                size="sm"
                                className="px-3 fw-medium"
                                disabled={selectedLotNos.length === 0}
                                onClick={() => toast.info("Hold/Unhold action triggered.")}
                              >
                                <i className="ri-lock-2-line me-1 align-bottom" />
                                {t("Hold/UnHold")}
                              </Button>
                              <Button
                                color="info"
                                size="sm"
                                className="px-3 fw-medium"
                                disabled={selectedLotNos.length === 0}
                                onClick={() => setMoreModal(true)}
                              >
                                <i className="ri-more-fill me-1 align-bottom" />
                                {t("More")}
                              </Button>
                            </div>

                          </div>
                        </CardBody>
                      </Card>
                    )}

                    {searchResults.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        {t("No stock report data loaded. Set filters and click Search.")}
                      </div>
                    ) : (
                      <TableContainer
                        columns={columns}
                        data={searchResults}
                        isGlobalFilter={true}
                        customPageSize={500}
                        customPageSizes={[500, 1000, 1500]}
                        divClass="table-responsive table-card mb-3"
                        tableClass="align-middle table-nowrap mb-0 table-hover table-striped"
                        theadClass="table-light"
                        SearchPlaceholder={t("Filter results...")}
                        getRowClass={(row) => {
                          const status = row.original?.curStatus || row.original?.CurStatus || "";
                          let colorStyle = "";
                          if (status === "M") colorStyle = "text-danger-row";
                          else if (status === "LAB") colorStyle = "text-info-row";
                          else if (status === "I") colorStyle = "text-primary-row";
                          else if (status === "L" || status === "S") colorStyle = "text-success-row";
                          else if (status === "PS") colorStyle = "text-success-row fw-bold";
                          else if (status === "Sold") colorStyle = "text-purple-row";
                          else if (status === "PH") colorStyle = "text-warning-row";
                          else if (status === "MI") colorStyle = "text-success-row";

                          return selectedRows[row.index]
                            ? "table-selected-row highlight"
                            : colorStyle;
                        }}
                      />
                    )}
                  </React.Fragment>
                )}
              </CardBody>
            </Card>
          )}
        </Container>
      </div>

      <Modal isOpen={detailModal} toggle={() => setDetailModal(!detailModal)} centered size="xl">
        <ModalHeader toggle={() => setDetailModal(!detailModal)}>
          {t("Stock ID Detail View")}: <span className="text-primary">{selectedRowDetail?.lotNo || selectedRowDetail?.LotNo}</span>
        </ModalHeader>
        <ModalBody className="AdminDetailModal p-4">
          {selectedRowDetail && (() => {
            const d = selectedRowDetail;
            const get = (...keys) => {
              for (const k of keys) {
                if (d[k] !== undefined && d[k] !== null && d[k] !== "") return d[k];
              }
              return "";
            };
            const num = (...keys) => parseFloat(get(...keys) || 0);
            const imagePath = get("imagePath", "ImagePath");
            const videoPath = get("videoPath", "VideoPath");
            const heartsPath = get("heartsImagePath", "HeartsImagePath");
            const arrowsPath = get("arrowsImagePath", "ArrowsImagePath");
            const assetPath = get("assetImagePath", "AssetImagePath");
            const certPath = get("certPath", "CertPath");
            const mediaTabs = [
              imagePath && { id: "image", label: t("Image"), src: imagePath, type: "image" },
              videoPath && { id: "video", label: t("Video"), src: videoPath, type: "video" },
              heartsPath && { id: "hearts", label: t("Hearts"), src: heartsPath, type: "image" },
              arrowsPath && { id: "arrows", label: t("Arrows"), src: arrowsPath, type: "image" },
              assetPath && { id: "asset", label: t("Asset"), src: assetPath, type: "image" },
            ].filter(Boolean);
            const activeTab = mediaTabs.find((tab) => tab.id === detailMediaTab) || mediaTabs[0];

            return (
            <Row className="g-4">
              <Col lg={7}>
                <h6 className="fw-semibold text-primary border-bottom pb-2 mb-3">{t("Diamond Specifications")}</h6>
                <Table bordered responsive size="sm" className="align-middle mb-4">
                  <tbody>
                    <tr>
                      <td className="fw-bold bg-light" style={{ width: "20%" }}>{t("Shape")}</td>
                      <td style={{ width: "30%" }}>{get("shape", "Shape")}</td>
                      <td className="fw-bold bg-light" style={{ width: "20%" }}>{t("Color")}</td>
                      <td style={{ width: "30%" }}>{get("color", "Color")}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Clarity")}</td>
                      <td>{get("clarity", "Clarity")}</td>
                      <td className="fw-bold bg-light">{t("Carats")}</td>
                      <td className="fw-bold text-success">{num("carats", "Carats").toFixed(3)}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("LAB")}</td>
                      <td>{get("lab", "LAB")}</td>
                      <td className="fw-bold bg-light">{t("Certificate No")}</td>
                      <td>
                        {certPath ? (
                          <a href={certPath} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-underline">
                            {get("cNo", "CNo")}
                          </a>
                        ) : (
                          get("cNo", "CNo")
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Cut Proportion")}</td>
                      <td>{get("prop", "Prop")}</td>
                      <td className="fw-bold bg-light">{t("Polish")}</td>
                      <td>{get("pol", "Pol")}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Symmetry")}</td>
                      <td>{get("sym", "Sym")}</td>
                      <td className="fw-bold bg-light">{t("Fluorescence")}</td>
                      <td>{get("fl", "FL")}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Measurement")}</td>
                      <td>{get("diam", "Diam")}</td>
                      <td className="fw-bold bg-light">{t("L:W Ratio")}</td>
                      <td>{num("lw", "LW").toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Depth %")}</td>
                      <td>{get("tDep", "TDep")}</td>
                      <td className="fw-bold bg-light">{t("Table %")}</td>
                      <td>{get("tabPer", "TabPer")}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Crown Angle")}</td>
                      <td>{get("ca", "CA")}</td>
                      <td className="fw-bold bg-light">{t("Crown Height")}</td>
                      <td>{get("ch", "CH")}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Pavilion Angle")}</td>
                      <td>{get("pa", "PA")}</td>
                      <td className="fw-bold bg-light">{t("Pavilion Height")}</td>
                      <td>{get("ph", "PH")}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Brown Shade")}</td>
                      <td>{get("brown", "Brown")}</td>
                      <td className="fw-bold bg-light">{t("Milky")}</td>
                      <td>{get("milky", "Milky")}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Luster")}</td>
                      <td>{get("luster", "Luster")}</td>
                      <td className="fw-bold bg-light">{t("Shade")}</td>
                      <td>{get("shade", "Shade")}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Natts")}</td>
                      <td>{get("nts", "Nts")}</td>
                      <td className="fw-bold bg-light">{t("Key to Symbols")}</td>
                      <td>{get("keyToSymbols", "KeyToSymbols")}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Girdle %")}</td>
                      <td>{get("girdlePer", "GirdlePer")}</td>
                      <td className="fw-bold bg-light">{t("Girdle Condition")}</td>
                      <td>{get("girdleCondition", "GirdleCondition")}</td>
                    </tr>
                  </tbody>
                </Table>

                <h6 className="fw-semibold text-primary border-bottom pb-2 mb-3 mt-4">{t("Cost & Pricing Information")}</h6>
                <Table bordered responsive size="sm" className="align-middle">
                  <tbody>
                    <tr>
                      <td className="fw-bold bg-light" style={{ width: "20%" }}>{t("Rapa MRP")}</td>
                      <td style={{ width: "30%" }}>${num("rapa", "Rapa").toLocaleString()}</td>
                      <td className="fw-bold bg-light" style={{ width: "20%" }}>{t("MRP Amount")}</td>
                      <td style={{ width: "30%" }}>${num("mrpAmount", "MRPAmount").toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Asking Back %")}</td>
                      <td className="text-danger fw-semibold">{num("askingBack", "AskingBack").toFixed(2)}%</td>
                      <td className="fw-bold bg-light">{t("Asking Rate")}</td>
                      <td>${num("askingRate", "AskingRate").toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Asking Amount")}</td>
                      <td className="fw-bold text-primary">${num("askingAmount", "AskingAmount").toLocaleString()}</td>
                      <td className="fw-bold bg-light">{t("Cost Back %")}</td>
                      <td className="text-danger fw-semibold">{num("purchaseBack", "PurchaseBack").toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Cost Rate")}</td>
                      <td>${num("purchaseRate", "PurchaseRate").toLocaleString()}</td>
                      <td className="fw-bold bg-light">{t("Cost Amount")}</td>
                      <td className="fw-bold">${num("purChaseAmount", "PurChaseAmount", "purchaseAmount", "PurchaseAmount").toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Actual Back %")}</td>
                      <td>{num("actualBack", "ActualBack").toFixed(2)}%</td>
                      <td className="fw-bold bg-light">{t("Actual Rate")}</td>
                      <td>${num("actualRate", "ActualRate").toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Actual Amount")}</td>
                      <td className="fw-bold">${num("actualAmount", "ActualAmount").toLocaleString()}</td>
                      <td className="fw-bold bg-light">{t("CP AVG Rate")}</td>
                      <td>${num("cpavg", "CPAVG", "cPAVG").toLocaleString()}</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>

              <Col lg={5}>
                <h6 className="fw-semibold text-primary border-bottom pb-2 mb-3">{t("Assets & Visual Media")}</h6>

                {mediaTabs.length > 1 && (
                  <Nav tabs className="mb-3 nav-tabs-custom">
                    {mediaTabs.map((tab) => (
                      <NavItem key={tab.id}>
                        <NavLink
                          className={classnames({ active: (activeTab?.id || detailMediaTab) === tab.id })}
                          style={{ cursor: "pointer" }}
                          onClick={() => setDetailMediaTab(tab.id)}
                        >
                          {tab.label}
                        </NavLink>
                      </NavItem>
                    ))}
                  </Nav>
                )}

                {activeTab?.type === "video" && activeTab?.src ? (
                  <div className="border rounded p-1 bg-light text-center mb-3">
                    <iframe
                      src={activeTab.src}
                      title="Stone video viewer"
                      className="w-100 rounded"
                      style={{ height: "260px", border: "0" }}
                      allowFullScreen
                    />
                  </div>
                ) : activeTab?.src ? (
                  <div className="mb-3 border rounded p-1 text-center bg-light">
                    <img
                      src={activeTab.src}
                      alt="Stone visual"
                      className="img-fluid rounded"
                      style={{ maxHeight: "280px", objectFit: "contain" }}
                    />
                  </div>
                ) : (
                  <div className="mb-3 border rounded py-4 text-center text-muted bg-light">
                    <i className="ri-image-line fs-24 mb-1 d-block" />
                    {t("No visual media available")}
                  </div>
                )}

                <h6 className="fw-semibold text-primary border-bottom pb-2 mb-3 mt-4">{t("Administrative Details")}</h6>
                <Table bordered size="sm" className="align-middle">
                  <tbody>
                    <tr>
                      <td className="fw-bold bg-light" style={{ width: "35%" }}>{t("Current Status")}</td>
                      <td>
                        <span className="badge bg-info-subtle text-info fw-semibold">{get("curStatus", "CurStatus")}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Mfg Kapan ID")}</td>
                      <td>{get("kapan", "Kapan")}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Mfg Packet ID")}</td>
                      <td>{get("packet", "Packet")}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Box Name")}</td>
                      <td>{get("boxName", "BoxName")}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Location")}</td>
                      <td>{[get("city", "City"), get("country", "Country")].filter(Boolean).join(" - ")}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Remarks")}</td>
                      <td>{get("remarks", "Remarks")}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold bg-light">{t("Comments")}</td>
                      <td>{get("comments", "Comments")}</td>
                    </tr>
                    {get("holdPartyName", "HoldPartyName") && (
                      <tr>
                        <td className="fw-bold bg-light text-warning">{t("Hold Party Name")}</td>
                        <td className="fw-semibold">{get("holdPartyName", "HoldPartyName")}</td>
                      </tr>
                    )}
                    {get("memoPartyName", "MemoPartyName") && (
                      <tr>
                        <td className="fw-bold bg-light">{t("Memo Party Name")}</td>
                        <td className="fw-semibold">{get("memoPartyName", "MemoPartyName")}</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Col>
            </Row>
            );
          })()}
          {selectedRowDetail && (
            <div className="d-flex justify-content-end mt-3 pt-2 border-top">
              <Button color="primary" onClick={() => setHistoryModal(true)}>
                {t("Show History")}
              </Button>
            </div>
          )}
        </ModalBody>
      </Modal>

      <StockHistoryPopupModal
        isOpen={historyModal}
        toggle={() => setHistoryModal(false)}
        stockId={selectedRowDetail?.lotNo || selectedRowDetail?.LotNo || ""}
      />

      <Modal isOpen={moreModal} toggle={() => setMoreModal(!moreModal)} centered>
        <ModalHeader toggle={() => setMoreModal(!moreModal)}>
          {t("Bulk Actions")}
        </ModalHeader>
        <ModalBody className="p-4">
          <div className="mb-4">
            <Button color="primary" className="w-100 d-flex align-items-center justify-content-center gap-2" onClick={() => setLocationModal(true)}>
              <i className="ri-map-pin-line fs-16" />
              {t("Update Locations")}
            </Button>
          </div>
          <hr />
          <div className="mb-3">
            <Label className="form-label fw-bold">{t("Mix To Box")}</Label>
            <div className="d-flex gap-2">
              <Input
                type="text"
                placeholder={t("Box Name")}
                value={boxNameUpdate}
                onChange={(e) => setBoxNameUpdate(e.target.value)}
              />
              <Button color="success" onClick={handleUpdateBoxAndGroup}>
                {t("Mix")}
              </Button>
            </div>
          </div>
          <div className="mb-2">
            <Label className="form-label fw-bold">{t("Mix To Group")}</Label>
            <div className="d-flex gap-2">
              <Input
                type="text"
                placeholder={t("Group Name")}
                value={groupNameUpdate}
                onChange={(e) => setGroupNameUpdate(e.target.value)}
              />
              <Button color="success" onClick={handleUpdateBoxAndGroup}>
                {t("Mix")}
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>

      <Modal isOpen={locationModal} toggle={() => setLocationModal(!locationModal)} centered size="lg">
        <ModalHeader toggle={() => setLocationModal(!locationModal)}>
          {t("Bulk Update Location")}
        </ModalHeader>
        <ModalBody className="p-4">
          <Row className="g-3">
            <Col md={4}>
              <Label className="form-label fw-bold">{t("City")}</Label>
              <Input
                type="select"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
              >
                <option value="">{t("Select City")}</option>
                {getOptions("CITY").map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Input>
            </Col>
            <Col md={4}>
              <Label className="form-label fw-bold">{t("State")}</Label>
              <Input
                type="select"
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
              >
                <option value="">{t("Select State")}</option>
                {getOptions("STATE").map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Input>
            </Col>
            <Col md={4}>
              <Label className="form-label fw-bold">{t("Country")}</Label>
              <Input
                type="select"
                value={locationCountry}
                onChange={(e) => setLocationCountry(e.target.value)}
              >
                <option value="">{t("Select Country")}</option>
                {getOptions("COUNTRY").map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Input>
            </Col>
          </Row>
        </ModalBody>
        <div className="modal-footer px-4 py-3">
          <Button color="secondary" onClick={() => setLocationModal(false)}>
            {t("Close")}
          </Button>
          <Button color="primary" onClick={handleUpdateLocation}>
            {t("Update Location")}
          </Button>
        </div>
      </Modal>

      <ToastContainer autoClose={2000} />
    </React.Fragment>
  );
};

export default SolitaireAdminStockReport;
