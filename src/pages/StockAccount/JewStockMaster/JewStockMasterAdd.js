import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import {
  Card, CardBody, CardHeader,
  Button, Col, Row, Spinner, Container
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";

import {
  getMountingStock,
  getJewPurity,
  getPureRatio,
  getJewSettingType,
  saveMountingStock,
  getMountingStockDropdown,
  getAllLotNoList,
  getAddMountingStockData,
  getJewLotNoData,
  getMountingStockDetail,
} from "../../../helpers/fakebackend_helper";
import { exportToExcel } from "../../../helpers/excel_helper";
import TableContainer from "../../../Components/Common/TableContainer";
import JewStockMediaPreview from "./JewStockMediaPreview";

/*
  ─────────────────────────────────────────────────────────────────────────
  NOTE ON THE HELPERS ABOVE
  ─────────────────────────────────────────────────────────────────────────
  These need to be added to helpers/fakebackend_helper.js (they don't exist
  yet) — one function per controller action:

      export const getJewMetalMaster  = () => api.get(url.LIST_JEW_METAL);
      export const getJewColorMaster  = () => api.get(url.LIST_JEW_COLOR);
      export const getJewCategory     = () => api.get(url.LIST_JEW_CATEGORY);
      export const getJewSubCategory  = () => api.get(url.LIST_JEW_SUBCATEGORY);
      export const getJewSettingType  = () => api.get(url.JEW_SETTING_TYPE);

      export const getJewPurity = (metalType) =>
        api.get(`${url.LIST_JEW_PURITY}?metalType=${encodeURIComponent(metalType)}`);

      export const getPureRatio = (metalType, metalPurity) =>
        api.get(`${url.GET_PURE_RATIO}?metalType=${encodeURIComponent(metalType)}&metalPurity=${encodeURIComponent(metalPurity)}`);

  ...and in helpers/url_helper.js:

      export const LIST_JEW_METAL       = "/list-jew-metal";
      export const LIST_JEW_COLOR       = "/list-jew-color";
      export const LIST_JEW_PURITY      = "/list-jew-purity";
      export const GET_PURE_RATIO       = "/get-pure-ratio";
      export const LIST_JEW_CATEGORY    = "/list-jew-category";
      export const LIST_JEW_SUBCATEGORY = "/list-jew-subcategory";
      export const JEW_SETTING_TYPE     = "/jew-setting-type";

  Every one of these controllers returns { Success, Data } where Data is the
  raw array/value from the service call — I don't know the exact field
  names on each row (ID vs Id vs MetalTypeID, Name vs MetalTypeName, etc.),
  so `toOptions()` below checks several common id/label field name patterns.
  Trim it once you've confirmed the real row shape for each endpoint.

  ASSUMPTION: "jew-setting-type" is used here to populate the "Making Type"
  dropdown (Per Gm / Per Pcs / Lumsum / Per% etc.) since that was the last
  hardcoded type-list in the form. If GetJewSettingValueAsync actually
  returns something else (e.g. Setting Charges types, not Making Types),
  just point it at the right field — the wiring is the same either way.
  ─────────────────────────────────────────────────────────────────────────
*/

// ─── Reusable field row ───────────────────────────────────────────────────────
function FieldRow({ label, children, wide = false }) {
  return (
    <div className="row mb-2 align-items-center">
      <div className="col-4 fw-semibold" style={{ fontSize: 13 }}>{label}</div>
      <div className="col-1 px-0">:</div>
      <div className={wide ? "col-7" : "col-6"}>{children}</div>
    </div>
  );
}

// ─── Shared inline styles ─────────────────────────────────────────────────────
const IS = { fontSize: 13, fontWeight: 600 }; // input shared
const RO = { ...IS, background: "#f8f9fa" };  // readonly

// ─── Extract { Success, Data } from any of these API response shapes ────────
function unwrapApiResponse(response) {
  const success =
    response?.Success ?? response?.success ??
    response?.data?.Success ?? response?.data?.success;
  const data =
    response?.Data ?? response?.data?.Data ?? response?.data ?? null;
  const message =
    response?.Message || response?.message ||
    response?.data?.Message || response?.data?.message || null;
  return { success, data, message };
}

// Turn a flat array of master rows into { value, label } options.
// Checks DTO-specific field names first (matched against actual API DTOs),
// then falls back to generic patterns. Supports both camelCase and PascalCase.
function toOptions(arr, { withRatio = false } = {}) {
  return (Array.isArray(arr) ? arr : []).map((item) => {
    if (typeof item === "string") {
      return { value: item, label: item };
    }

    // Value: check DTO-specific ID fields first, then generic fallbacks
    const value =
      item?.MetalID ?? item?.metalID ?? item?.metalId ??
      item?.JewColorID ?? item?.jewColorID ?? item?.jewColorId ??
      item?.CategoryID ?? item?.categoryID ?? item?.categoryId ??
      item?.SubCategoryID ?? item?.subCategoryID ?? item?.subCategoryId ??
      item?.MetalPurityID ?? item?.metalPurityID ?? item?.metalPurityId ??
      item?.ID ?? item?.Id ?? item?.id ??
      item?.Value ?? item?.value ??
      item?.Code ?? item?.code ?? "";

    // Label: check DTO-specific Name fields first, then generic fallbacks
    const label =
      item?.MetalName ?? item?.metalName ??
      item?.JewColorName ?? item?.jewColorName ??
      item?.CategoryName ?? item?.categoryName ??
      item?.SubCategoryName ?? item?.subCategoryName ??
      item?.MetalPurityID ?? item?.metalPurityID ?? item?.metalPurityId ??
      item?.Name ?? item?.name ??
      item?.Label ?? item?.label ??
      item?.Text ?? item?.text ?? String(value);

    const opt = { value, label };
    if (withRatio) {
      opt.ratio =
        item?.Ratio ?? item?.ratio ?? item?.PurityRatio ?? item?.purityRatio ?? item?.PureRatio ?? item?.pureRatio ?? null;
    }
    return opt;
  });
}

// MVC SelectList pattern: same field for value and display (e.g. Shape "RBC", not numeric ID).
function getItemField(item, ...keys) {
  if (!item) return "";
  for (const key of keys) {
    const val = item[key];
    if (val !== undefined && val !== null && val !== "") return val;
  }
  return "";
}

function idOnlyOptions(arr, fieldName) {
  const camel = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
  const lower = fieldName.toLowerCase();
  return (Array.isArray(arr) ? arr : []).map((item) => {
    const id = getItemField(item, fieldName, camel, lower);
    return { value: String(id), label: String(id) };
  }).filter((o) => o.value !== "");
}

// BasicData from ItemMasterDropDown — MVC uses SelectList(..., "ID", "ID")
function basicDataToOptions(arr) {
  return (Array.isArray(arr) ? arr : []).map((item) => {
    const id = getItemField(item, "ID", "id", "Id", "Name", "name");
    return { value: String(id), label: String(id) };
  }).filter((o) => o.value !== "");
}

function dedupeLotOptions(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (const o of arr) {
    const id = String(o.id ?? o.ID ?? o.name ?? o.Name ?? "").trim();
    if (!id || seen.has(id.toLowerCase())) continue;
    seen.add(id.toLowerCase());
    out.push({
      id,
      text: String(o.text ?? o.TextName ?? o.textName ?? id),
    });
  }
  return out;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddMountingMaster() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ── page title ──
  useEffect(() => { document.title = "Add Mounting Stock | DiaJewSoft"; }, []);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION A  –  Mounting Stock LIST  (from MountingStockList)
  // ════════════════════════════════════════════════════════════════════════════
  const [mountingStock, setMountingStock] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [showList, setShowList] = useState(false); // toggle list panel

  const getMountingStockList = async () => {
    setListLoading(true);
    try {
      const response = await getMountingStock();
      const success =
        response?.Success ?? response?.success ??
        response?.data?.Success ?? response?.data?.success;
      const data =
        response?.Data ?? response?.data?.Data ?? response?.data ?? [];

      if (success) {
        setMountingStock(Array.isArray(data) ? [...data].reverse() : []);
      } else {
        toast.error(
          response?.Message || response?.message ||
          response?.data?.Message || response?.data?.message ||
          "Failed to fetch mounting stock."
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch mounting stock.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => { getMountingStockList(); }, []);

  // ── Delete handler (stub) ──
  const handleDelete = (jewCode) => {
    console.log("Delete:", jewCode);
    toast.warning("Delete not implemented yet.");
  };

  // ── Excel export ──
  const handleExportExcel = async () => {
    if (mountingStock.length === 0) {
      toast.warning("No data available to export.");
      return;
    }
    const headers = [
      "Stock ID", "Jewellery Category", "Metal Type", "Purity",
      "Diamond Weight", "Gross Weight", "Net Weight", "Metal Amount"
    ];
    const rows = mountingStock.map((item) => [
      item.stock_ID || item.Stock_ID || "",
      item.mountCategory || item.MountCategory || item.designName || "",
      item.metalType || item.MetalType || "",
      item.purity || item.Purity || "",
      item.totalDiamondCarat || item.TotalDiamondCarat || 0,
      Number(item.grossWeight || item.GrossWeight || 0).toFixed(3),
      Number(item.netWeight || item.NetWeight || 0).toFixed(3),
      Number(item.totalMetalAmount || item.TotalMetalAmount || 0).toFixed(2),
    ]);
    const result = await exportToExcel(headers, rows, "MountingStock", "MountingStockMasterList");
    if (!result.success) toast.error("Failed to generate Excel file.");
  };

  // ── List columns (from MountingStockList) ──
  const listColumns = useMemo(() => [
    {
      header: t("Action"),
      id: "action",
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="d-flex gap-2">
          <Link
            to={`/master/edit-Mounting-stock?id=${row.original.JewCode}`}
            className="btn btn-soft-primary btn-sm"
          >
            <i className="ri-pencil-fill"></i>
          </Link>
          <button
            className="btn btn-soft-danger btn-sm"
            onClick={() => handleDelete(row.original.JewCode)}
          >
            <i className="ri-delete-bin-fill"></i>
          </button>
        </div>
      ),
    },
    { header: t("StockID"), accessorKey: "stock_ID", enableColumnFilter: true },
    { header: t("JewelleryCategory"), accessorKey: "mountCategory", enableColumnFilter: true },
    { header: t("MetalType"), accessorKey: "metalType", enableColumnFilter: true },
    { header: t("Purity"), accessorKey: "purity", enableColumnFilter: true },
    { header: t("DiamondWeight"), accessorKey: "totalDiamondCarat", enableColumnFilter: true },
    {
      header: t("GrossWeight"),
      accessorKey: "grossWeight",
      enableColumnFilter: true,
      cell: ({ getValue }) => Number(getValue() || 0).toFixed(3),
    },
    {
      header: t("NetWeight"),
      accessorKey: "netWeight",
      enableColumnFilter: true,
      cell: ({ getValue }) => Number(getValue() || 0).toFixed(3),
    },
    {
      header: t("MetalAmount"),
      accessorKey: "totalMetalAmount",
      enableColumnFilter: true,
      cell: ({ getValue }) => Number(getValue() || 0).toFixed(2),
    },
  ], [t]);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION B  –  ADD FORM  (from AddMountingMaster)
  // ════════════════════════════════════════════════════════════════════════════

  // ── Tab state ──
  const [leftTab, setLeftTab] = useState("stock");   // "stock" | "image"
  const [midTab, setMidTab] = useState("metal");   // "metal" | "images"

  // ── Dropdown master data (one state per endpoint) ──
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [metalTypeOptions, setMetalTypeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [purityOptions, setPurityOptions] = useState([]);
  const [settingTypeOptions, setSettingTypeOptions] = useState([]);
  const [shapeOptions, setShapeOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [sieveOptions, setSieveOptions] = useState([]);
  const [stoneColorOptions, setStoneColorOptions] = useState([]);
  const [clarityOptions, setClarityOptions] = useState([]);
  const [lotNoHint, setLotNoHint] = useState("");
  const [purityLoading, setPurityLoading] = useState(false);

  // ── Stock Details ──
  const today = new Date().toISOString().slice(0, 10);
  const [trnDate, setTrnDate] = useState(today);
  const [stockID, setStockID] = useState("");
  const [errors, setErrors] = useState({});
  const [jewCategory, setJewCategory] = useState("");
  const [useMounting, setUseMounting] = useState("");
  const [mountOpts, setMountOpts] = useState([]);
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [jewSize, setJewSize] = useState("");
  const [jewCert, setJewCert] = useState("");
  const [certNo, setCertNo] = useState("");
  const [description, setDescription] = useState("");
  const [totalPcs, setTotalPcs] = useState("");

  // ── Metal Details ──
  const [metal, setMetal] = useState("");
  const [color, setColor] = useState("");
  const [metalPurity, setMetalPurity] = useState("");
  const [purityRatio, setPurityRatio] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [netWeight, setNetWeight] = useState("");
  const [metalPricePerGm, setMetalPricePerGm] = useState("");
  const [metalAmount, setMetalAmount] = useState("");
  const [diamondAmount, setDiamondAmount] = useState("");
  const [diamondQty, setDiamondQty] = useState("");
  const [stoneAmount, setStoneAmount] = useState("");
  const [stoneQty, setStoneQty] = useState("");

  // ── Image/Video paths ──
  const [imagePath, setImagePath] = useState("");
  const [videoPath, setVideoPath] = useState("");
  const [certPath, setCertPath] = useState("");

  // ── Charges ──
  const [makingType, setMakingType] = useState("");
  const [makingRate, setMakingRate] = useState("");
  const [makingCharges, setMakingCharges] = useState("");
  const [settingCharges, setSettingCharges] = useState("0.00");
  const [handlingCarat, setHandlingCarat] = useState("");
  const [handlingCharges, setHandlingCharges] = useState("");
  const [handlingAmount, setHandlingAmount] = useState("");
  const [certificateCharges, setCertificateCharges] = useState("");
  const [otherCharges, setOtherCharges] = useState("");
  const [hallmarkCharges, setHallmarkCharges] = useState("");
  const [totalMakingCharges, setTotalMakingCharges] = useState("");
  const [finalAmount, setFinalAmount] = useState("");
  const [askingRate, setAskingRate] = useState("");

  // ── Row entry form ──
  const [elementType, setElementType] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [lotSearch, setLotSearch] = useState("");
  const [lotOptions, setLotOptions] = useState([]);
  const [shape, setShape] = useState("");
  const [size, setSize] = useState("");
  const [sieve, setSieve] = useState("");
  const [stoneColor, setStoneColor] = useState("");
  const [clarity, setClarity] = useState("");
  const [pcs, setPcs] = useState("");
  const [carats, setCarats] = useState("");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [lab, setLab] = useState("");

  // ── Table rows ──
  const [tableRows, setTableRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);

  // ── Form submit loading ──
  const [submitLoading, setSubmitLoading] = useState(false);

  // Category / Sub Category / Metal / Color / Setting Type don't depend on
  // anything else, so load them all once on mount.
  useEffect(() => {
    let cancelled = false;

    // Dedicated loader for Setting Type — fallback if not in add-stock-mounting payload
    const loadSettingType = async () => {
      try {
        const response = await getJewSettingType();
        const { success, data, message } = unwrapApiResponse(response);
        if (cancelled) return;
        if (success && Array.isArray(data)) {
          // data is string[] e.g. ["Per Gm", "Per Pcs", "Lumsum", "Per%"]
          setSettingTypeOptions(data.map((v) => ({ value: v, label: v })));
        } else {
          toast.error(message || "Failed to load Making Type list.");
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          toast.error("Failed to load Making Type list.");
        }
      }
    };

    const loadAddMountingDropdowns = async () => {
      try {
        const response = await getAddMountingStockData();
        const { success, data, message } = unwrapApiResponse(response);
        if (cancelled) return;
        if (!success || !data) {
          toast.error(message || "Failed to load mounting stock dropdowns.");
          return;
        }
        // Same as MVC AddMountingStock ViewBag — ItemMasterDropDown + Jew masters
        setShapeOptions(basicDataToOptions(data.Shape ?? data.shape));
        setStoneColorOptions(basicDataToOptions(data.Color ?? data.color));
        setSizeOptions(basicDataToOptions(data.Size ?? data.size));
        setClarityOptions(basicDataToOptions(data.Clarity ?? data.clarity));
        setSieveOptions(basicDataToOptions(data.Sieve ?? data.sieve));
        setCategoryOptions(idOnlyOptions(data.JewCategories ?? data.jewCategories, "CategoryID"));
        setSubCategoryOptions(
          (Array.isArray(data.JewSubCategories ?? data.jewSubCategories)
            ? (data.JewSubCategories ?? data.jewSubCategories)
            : []
          ).map((item) => {
            const id = getItemField(item, "SubCategoryID", "subCategoryID", "subCategoryId");
            return {
              value: String(id),
              label: String(id),
              categoryId: getItemField(item, "CategoryID", "categoryID", "categoryId"),
            };
          }).filter((o) => o.value !== "")
        );
        setMetalTypeOptions(idOnlyOptions(data.JewMetalType ?? data.jewMetalType, "MetalID"));
        setColorOptions(idOnlyOptions(data.JewColor ?? data.jewColor, "JewColorID"));
        const settingValues = data.JewSettingValue ?? data.jewSettingValue;
        if (Array.isArray(settingValues) && settingValues.length > 0) {
          setSettingTypeOptions(settingValues.map((v) => ({ value: v, label: v })));
        }
        const basis = data.DecimalinInvoiceAmount ?? data.decimalinInvoiceAmount ?? "";
        if (basis) {
          setCalcBasis(String(basis) === "GrossWeight" ? "GrossWeight" : "NetWeight");
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          toast.error("Failed to load mounting stock dropdowns.");
        }
      }
    };

    setDropdownLoading(true);
    Promise.all([
      loadAddMountingDropdowns(),
      loadSettingType(),
    ]).finally(() => { if (!cancelled) setDropdownLoading(false); });

    return () => { cancelled = true; };
  }, []);

  // Purity list depends on the selected Metal Type: GET list-jew-purity?metalType=...
  useEffect(() => {
    if (!metal) {
      setPurityOptions([]);
      setMetalPurity("");
      setPurityRatio("");
      return;
    }
    let cancelled = false;
    setPurityLoading(true);
    getJewPurity(metal)
      .then((response) => {
        if (cancelled) return;
        const { success, data, message } = unwrapApiResponse(response);
        if (success) {
          setPurityOptions(idOnlyOptions(data, "MetalPurityID"));
        } else {
          toast.error(message || "Failed to load Purity list.");
          setPurityOptions([]);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          toast.error("Failed to load Purity list.");
        }
      })
      .finally(() => { if (!cancelled) setPurityLoading(false); });

    // metal type changed → previously selected purity/ratio no longer valid
    setMetalPurity("");
    setPurityRatio("");
    return () => { cancelled = true; };
  }, [metal]);

  // Purity Ratio depends on Metal Type + Purity: GET get-pure-ratio?metalType=&metalPurity=
  useEffect(() => {
    if (!metal || !metalPurity) return;
    let cancelled = false;
    getPureRatio(metal, metalPurity)
      .then((response) => {
        if (cancelled) return;
        const { success, data, message } = unwrapApiResponse(response);
        if (success) {
          // `data` is expected to be the ratio itself (number/string) per
          // GetPureRatioAsync's return type — adjust if it comes back as
          // an object like { Ratio: 91.6 } instead.
          const ratio = (data && typeof data === "object")
            ? (data.Ratio ?? data.ratio ?? data.PureRatio ?? data.purityRatio ?? "")
            : data;
          setPurityRatio(ratio !== null && ratio !== undefined ? String(ratio) : "");
        } else {
          toast.error(message || "Failed to load Purity Ratio.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          toast.error("Failed to load Purity Ratio.");
        }
      });
    return () => { cancelled = true; };
  }, [metal, metalPurity]);

  // ── Derived visibility ──
  const showMountingSection = jewCategory === "Finished Jewellery" || jewCategory === "Semi Jewellery";
  const showDetailsSection = jewCategory !== "Mounting" && jewCategory !== "Metal";


  const [calcBasis, setCalcBasis] = useState("NetWeight"); // "GrossWeight" | "NetWeight"

  // derived: sum of carats across all added rows (diamond + stone)
  const totalCarat = useMemo(
    () => tableRows.reduce((s, r) => s + (parseFloat(r.carats) || 0), 0),
    [tableRows]
  );

  // ─── Date validation ──────────────────────────────────────────────────────
  const handleDateChange = (val) => {
    if (val > today) {
      toast.error("Invoice date cannot be greater than today.");
      setTrnDate(today);
    } else {
      setTrnDate(val);
    }
  };

  // ─── Auto-calcs ──────────────────────────────────────────────────────────
  useEffect(() => {
    const gw = parseFloat(grossWeight) || 0;
    if (gw !== 0) {
      const lessWeight = totalCarat / 5;       // 5 carats = 1 gram
      const nw = gw - lessWeight;
      setNetWeight(nw.toFixed(3));
    } else {
      setNetWeight(gw.toFixed(3));
    }
  }, [grossWeight, totalCarat]);

  useEffect(() => {
    const pp = parseFloat(metalPricePerGm) || 0;
    const gw = parseFloat(grossWeight) || 0;
    const nw = parseFloat(netWeight) || 0;
    const ratio = parseFloat(purityRatio) || 0;

    const ma = calcBasis === "GrossWeight"
      ? pp * gw
      : pp * ratio * nw;

    setMetalAmount(ma.toFixed(2));
  }, [calcBasis, metalPricePerGm, grossWeight, netWeight, purityRatio]);

  useEffect(() => {
    const r = parseFloat(makingRate) || 0;
    const gw = parseFloat(grossWeight) || 0;
    const pc = parseFloat(totalPcs) || 1;
    const ma = parseFloat(metalAmount) || 0;
    let mc = 0;
    if (makingType === "Per Gm") mc = r * gw;
    else if (makingType === "Per Pcs") mc = r * pc;
    else if (makingType === "Lumsum") mc = r;
    else if (makingType === "Per%") mc = (ma * r) / 100;
    setMakingCharges(mc.toFixed(2));
  }, [makingType, makingRate, grossWeight, totalPcs, metalAmount]);

  useEffect(() => {
    const hc = parseFloat(handlingCarat) || 0;
    const hch = parseFloat(handlingCharges) || 0;
    setHandlingAmount((hc * hch).toFixed(2));
  }, [handlingCarat, handlingCharges]);

  useEffect(() => {
    const sum =
      (parseFloat(makingCharges) || 0) +
      (parseFloat(settingCharges) || 0) +
      (parseFloat(handlingAmount) || 0) +
      (parseFloat(certificateCharges) || 0) +
      (parseFloat(otherCharges) || 0) +
      (parseFloat(hallmarkCharges) || 0);
    setTotalMakingCharges(sum.toFixed(2));
    const fa =
      (parseFloat(metalAmount) || 0) +
      (parseFloat(diamondAmount) || 0) +
      (parseFloat(stoneAmount) || 0) + sum;
    setFinalAmount(fa.toFixed(2));
  }, [makingCharges, settingCharges, handlingAmount, certificateCharges,
    otherCharges, hallmarkCharges, metalAmount, diamondAmount, stoneAmount]);

  useEffect(() => {
    const c = parseFloat(carats) || 0;
    const r = parseFloat(rate) || 0;
    setAmount((c * r).toFixed(2));
  }, [carats, rate]);

  // ─── Load Mounting Stock options (dropdown) ───────────────────────────────
  // MVC: option value = ID (JewCode), text = Name; save uses selected text
  useEffect(() => {
    if (!showMountingSection || !jewCategory) {
      setMountOpts([]);
      setUseMounting("");
      return;
    }
    getMountingStockDropdown(jewCategory, "add")
      .then((response) => {
        const { success, data, message } = unwrapApiResponse(response);
        if (success && Array.isArray(data)) {
          setMountOpts(
            data.map((item) => {
              const name = getItemField(item, "Name", "name", "TextName", "textName");
              const id = getItemField(item, "ID", "id", "Id");
              return {
                value: String(id || name),
                label: String(name || id),
              };
            }).filter((o) => o.value !== "")
          );
        } else {
          toast.error(message || "Error loading mounting stock options.");
        }
      })
      .catch(() => toast.error("Error loading mounting stock options."));
  }, [jewCategory]);

  // MVC: $('#UseMounting').on('change') → get-all-Mounting-details and fill form + diamond grid
  const applyMountingDetail = useCallback(async (mountingJewCode) => {
    if (!mountingJewCode) {
      setTableRows([]);
      return;
    }
    try {
      const response = await getMountingStockDetail(mountingJewCode);
      const success = response?.success ?? response?.Success ?? response?.data?.Success ?? response?.data?.success;
      const data =
        response?.Data ??
        response?.data?.Data ??
        response?.data?.StockData ??
        response?.data ??
        null;
      const diamondList =
        response?.DiamondList ??
        response?.diamondList ??
        response?.data?.DiamondList ??
        response?.data?.diamondList ??
        [];

      if (!success && !data) {
        toast.error(response?.message || response?.Message || "Failed to load mounting details.");
        return;
      }
      if (!data) return;

      setCategory(data.category || data.Category || "");
      setSubCategory(data.subCategory || data.SubCategory || "");
      setJewSize(data.jewSize || data.JewSize || "");
      setMetal(data.metalType || data.MetalType || "");
      setColor(data.color || data.Color || "");
      setMetalPurity(data.purity || data.Purity || "");
      setPurityRatio(
        data.pureRatio != null || data.PureRatio != null
          ? Number(data.pureRatio ?? data.PureRatio).toFixed(3)
          : ""
      );
      setGrossWeight(
        data.grossWeight != null || data.GrossWeight != null
          ? Number(data.grossWeight ?? data.GrossWeight).toFixed(3)
          : ""
      );
      setNetWeight(
        data.netWeight != null || data.NetWeight != null
          ? Number(data.netWeight ?? data.NetWeight).toFixed(3)
          : ""
      );
      setMetalPricePerGm(
        data.metalPriceGm != null || data.MetalPriceGm != null
          ? Number(data.metalPriceGm ?? data.MetalPriceGm).toFixed(3)
          : ""
      );
      setMetalAmount(
        data.totalMetalAmount != null || data.TotalMetalAmount != null
          ? Number(data.totalMetalAmount ?? data.TotalMetalAmount).toFixed(2)
          : ""
      );
      setMakingType(data.makingType || data.MakingType || "");
      setMakingRate(data.makingRate ?? data.MakingRate ?? "");
      setMakingCharges(data.makingCharges ?? data.MakingCharges ?? "");
      setSettingCharges(
        data.settingCharges != null || data.SettingCharges != null
          ? Number(data.settingCharges ?? data.SettingCharges).toFixed(2)
          : "0.00"
      );
      setHandlingCarat(data.handlingCarat ?? data.HandlingCarat ?? "");
      setHandlingCharges(data.handlingChargesPerCarat ?? data.HandlingChargesPerCarat ?? "");
      setHandlingAmount(data.totalHandlingCharges ?? data.TotalHandlingCharges ?? "");
      setJewCert(data.jewelleryCertificate || data.JewelleryCertificate || "");
      setCertificateCharges(data.totalCertificateCharges ?? data.TotalCertificateCharges ?? "");
      setOtherCharges(data.otherCharges ?? data.OtherCharges ?? "");
      setHallmarkCharges(data.hallmarkCharges ?? data.HallmarkCharges ?? "");
      setTotalMakingCharges(data.totalMakingCharges ?? data.TotalMakingCharges ?? "");
      setFinalAmount(data.finalAmount ?? data.FinalAmount ?? "");
      setDiamondAmount(data.totalDiamondAmount ?? data.TotalDiamondAmount ?? "");
      setImagePath(data.imagePath || data.ImagePath || "");
      setVideoPath(data.videoPath || data.VideoPath || "");
      setCertPath(data.certPath || data.CertPath || "");
      setDescription(data.description || data.Description || "");
      setCertNo(data.jewelleryCerNo || data.JewelleryCerNo || "");
      setTotalPcs(data.pcs ?? data.Pcs ?? "");
      setAskingRate(data.askingRate ?? data.AskingRate ?? "");
      setDiamondQty(String(data.totalDiamondQty ?? data.TotalDiamondQty ?? ""));
      setStoneAmount(data.totalStoneAmount ?? data.TotalStoneAmount ?? "");
      setStoneQty(String(data.totalStoneQty ?? data.TotalStoneQty ?? ""));

      const rows = (Array.isArray(diamondList) ? diamondList : []).map((item, idx) => ({
        id: idx + 1,
        stockID: item.stockID || item.StockID || item.lotNo || item.LotNo || "",
        stoneType: item.type || item.Type || item.category || item.Category || "Natural Diamond",
        shape: item.shape || item.Shape || "",
        size: item.size || item.Size || "",
        sieve: item.sieve || item.Sieve || "",
        color: item.color || item.Color || "",
        clarity: item.clarity || item.Clarity || "",
        pcs: item.pcs || item.Pcs || 0,
        carats: item.carat || item.Carat || item.issueCarats || item.IssueCarats || 0,
        rate: item.price || item.Price || item.rate || item.Rate || 0,
        amount: item.amount || item.Amount || 0,
        lab: item.lab || item.Lab || item.cert || item.Cert || "",
      }));
      setTableRows(rows);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching mounting details.");
    }
  }, []);

  const handleUseMountingChange = (selectedId) => {
    setUseMounting(selectedId);
    applyMountingDetail(selectedId);
  };

  // ─── Metal Purity change → the get-pure-ratio effect above fetches the
  //     ratio automatically whenever `metal` + `metalPurity` are both set.
  const handlePurityChange = (val) => {
    setMetalPurity(val);
  };

  // ─── Sub Category options, filtered by selected Category when the API
  //     payload ties them together (falls back to full list otherwise) ────
  const subCategoryOptionsForCategory = useMemo(() => {
    if (!category) return subCategoryOptions;
    const filtered = subCategoryOptions.filter((o) => {
      // Adjust this key once the real payload shape is confirmed — common
      // patterns are CategoryID / categoryId / ParentID on each sub-category row.
      const parent = o.categoryId ?? o.CategoryID ?? o.parentId;
      return parent === undefined || String(parent) === String(category);
    });
    return filtered.length ? filtered : subCategoryOptions;
  }, [category, subCategoryOptions]);

  // ─── Lot No autocomplete ──────────────────────────────────────────────────
  const debounceRef = useRef(null);
  const searchLots = useCallback((term) => {
    clearTimeout(debounceRef.current);

    if (!elementType) {
      setLotOptions([]);
      setLotNoHint("Select Element Type first");
      return;
    }

    if (!term || term.trim().length < 1) {
      setLotOptions([]);
      setLotNoHint("Please enter 1 or more characters");
      return;
    }

    setLotNoHint("");
    debounceRef.current = setTimeout(() => {
      getAllLotNoList(term.trim(), elementType)
        .then((response) => {
          const arr = Array.isArray(response)
            ? response
            : (response?.data ?? response?.Data ?? []);
          if (Array.isArray(arr)) {
            setLotOptions(dedupeLotOptions(arr));
          } else {
            setLotOptions([]);
          }
        })
        .catch((err) => {
          setLotOptions([]);
          const msg = typeof err === "string" ? err : (err?.message ?? "Failed to search lot numbers.");
          toast.error(msg);
        });
    }, 250);
  }, [elementType]);

  useEffect(() => {
    setLotNo("");
    setLotSearch("");
    setLotOptions([]);
    setLotNoHint("");
  }, [elementType]);

  const handleLotSelect = async (selectedLotNo, text) => {
    setLotNo(selectedLotNo);
    setLotSearch(text || selectedLotNo);
    setLotOptions([]);
    setLotNoHint("");
    try {
      const response = await getJewLotNoData(selectedLotNo);
      const success = response?.success ?? response?.Success;
      const data = response?.Data ?? response?.data ?? [];
      if (success && Array.isArray(data) && data.length > 0) {
        const item = data[0];
        setShape(item.ShapeId ?? item.shapeId ?? "");
        setSize(item.SizeId ?? item.sizeId ?? "");
        setStoneColor(item.ColorId ?? item.colorId ?? "");
        setClarity(item.ClarityId ?? item.clarityId ?? "");
        setSieve(item.SieveId ?? item.sieveId ?? "");
        setPcs(item.Pcs != null ? String(item.Pcs) : (item.pcs != null ? String(item.pcs) : ""));
        setCarats(
          item.BalanceCarats3Dec != null
            ? String(item.BalanceCarats3Dec)
            : (item.balanceCarats3Dec != null ? String(item.balanceCarats3Dec) : "")
        );
        setRate(item.Rate != null ? String(item.Rate) : (item.rate != null ? String(item.rate) : ""));
        setLab(item.CertId ?? item.certId ?? "");
      } else {
        toast.warning(response?.message || response?.Message || "No details found for the selected lot number.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load lot details.");
    }
  };

  const clearEntryForm = () => {
    setLotNo(""); setLotSearch(""); setLotOptions([]);
    setPcs(""); setCarats(""); setRate(""); setAmount(""); setLab("");
    setEditingRowId(null);
  };

  const addItem = () => {
    if (!elementType || !pcs || !carats) {
      toast.error("Element Type, Pcs and Carat are required.");
      return;
    }
    const row = {
      id: editingRowId ?? Date.now(), stockID: lotNo, stoneType: elementType,
      shape, size, sieve, color: stoneColor, clarity, pcs, carats, rate, amount, lab
    };
    const rowAmt = parseFloat(amount) || 0;
    const rowPcs = parseFloat(pcs) || 0;
    if (editingRowId !== null) {
      const oldRow = tableRows.find((r) => r.id === editingRowId);
      const oldAmt = parseFloat(oldRow?.amount) || 0;
      const oldPcs = parseFloat(oldRow?.pcs) || 0;
      if (oldRow?.stoneType === "Natural Diamond" || oldRow?.stoneType === "Lab Grown Diamond") {
        setDiamondAmount((p) => Math.max(0, (parseFloat(p) || 0) - oldAmt + rowAmt).toFixed(2));
        setDiamondQty((p) => String(Math.max(0, (parseFloat(p) || 0) - oldPcs + rowPcs)));
      } else {
        setStoneAmount((p) => Math.max(0, (parseFloat(p) || 0) - oldAmt + rowAmt).toFixed(2));
        setStoneQty((p) => String(Math.max(0, (parseFloat(p) || 0) - oldPcs + rowPcs)));
      }
      setTableRows((p) => p.map((r) => r.id === editingRowId ? row : r));
    } else {
      setTableRows((p) => [...p, row]);
      if (elementType === "Natural Diamond" || elementType === "Lab Grown Diamond") {
        setDiamondAmount((p) => ((parseFloat(p) || 0) + rowAmt).toFixed(2));
        setDiamondQty((p) => String((parseFloat(p) || 0) + rowPcs));
      } else {
        setStoneAmount((p) => ((parseFloat(p) || 0) + rowAmt).toFixed(2));
        setStoneQty((p) => String((parseFloat(p) || 0) + rowPcs));
      }
    }
    clearEntryForm();
  };

  const removeRow = (id) => {
    const row = tableRows.find((r) => r.id === id);
    if (!row) return;
    const amt = parseFloat(row.amount) || 0;
    const pc = parseFloat(row.pcs) || 0;
    if (row.stoneType === "Natural Diamond" || row.stoneType === "Lab Grown Diamond") {
      setDiamondAmount((p) => Math.max(0, (parseFloat(p) || 0) - amt).toFixed(2));
      setDiamondQty((p) => String(Math.max(0, (parseFloat(p) || 0) - pc)));
    } else {
      setStoneAmount((p) => Math.max(0, (parseFloat(p) || 0) - amt).toFixed(2));
      setStoneQty((p) => String(Math.max(0, (parseFloat(p) || 0) - pc)));
    }
    setTableRows((p) => p.filter((r) => r.id !== id));
    if (editingRowId === id) clearEntryForm();
  };

  const editRow = (row) => {
    setEditingRowId(row.id);
    setElementType(row.stoneType || "");
    setLotNo(row.stockID || "");
    setLotSearch(row.stockID || "");
    setLotOptions([]);
    setShape(row.shape || "");
    setSize(row.size || "");
    setSieve(row.sieve || "");
    setStoneColor(row.color || "");
    setClarity(row.clarity || "");
    setPcs(String(row.pcs || ""));
    setCarats(String(row.carats || ""));
    setRate(String(row.rate || ""));
    setAmount(String(row.amount || ""));
    setLab(row.lab || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    let currentErrors = {};
    if (!stockID.trim()) currentErrors.stockID = true;
    
    setErrors(currentErrors);

    if (Object.keys(currentErrors).length > 0) {
      toast.error(t("Please fill all required fields"));
      return;
    }


    setSubmitLoading(true);
    try {
      // MVC SubmitMountingStockData: all Mounting-diamond-details rows go to DiamondDetails
      const diamond = tableRows.map(row => ({
        StockID: row.stockID,
        Type: row.stoneType,
        Shape: row.shape,
        Size: row.size,
        Sieve: row.sieve,
        Color: row.color,
        Clarity: row.clarity,
        Pcs: parseInt(row.pcs) || 0,
        Carat: parseFloat(row.carats) || 0,
        Price: parseFloat(row.rate) || 0,
        Amount: parseFloat(row.amount) || 0,
        Lab: row.lab
      }));

      const setting = [];

      let totalDiaCarat = 0;
      let totalStnCarat = 0;
      tableRows.forEach(row => {
        const c = parseFloat(row.carats) || 0;
        if (row.stoneType === "Natural Diamond" || row.stoneType === "Lab Grown Diamond") {
          totalDiaCarat += c;
        } else {
          totalStnCarat += c;
        }
      });

      const selectedMount = mountOpts.find((o) => String(o.value) === String(useMounting));
      // MVC: UseMounting = option selected text (Name); value was ID
      const useMountingName = selectedMount?.label || useMounting || "";

      const payload = {
        Model: {
          JewCode: 0,
          Stock_ID: stockID,
          DesignID: "",
          DesignName: "",
          DesignPriority: 0,
          TrnDate: trnDate,
          CreatedBy: "",
          ModifyBy: "",
          Category: category,
          SubCategory: subCategory,
          JewSize: jewSize,
          JewelleryCerNo: certNo,
          MetalType: metal,
          Color: color,
          Purity: metalPurity,
          PureRatio: parseFloat(purityRatio) || 0,
          GrossWeight: parseFloat(grossWeight) || 0,
          NetWeight: parseFloat(netWeight) || 0,
          MetalPriceGm: parseFloat(metalPricePerGm) || 0,
          TotalDiamondAmount: parseFloat(diamondAmount) || 0,
          TotalMetalAmount: parseFloat(metalAmount) || 0,
          ImagePath: imagePath,
          ImageBinary: null,
          VideoPath: videoPath,
          CertPath: certPath,
          UseMounting: useMountingName,
          UseMountingId: useMounting || "",
          MountCategory: jewCategory,
          MakingType: makingType,
          MakingRate: parseFloat(makingRate) || 0,
          MakingCharges: parseFloat(makingCharges) || 0,
          SettingCharges: parseFloat(settingCharges) || 0,
          HandlingChargesPerCarat: parseFloat(handlingCharges) || 0,
          HandlingCarat: parseFloat(handlingCarat) || 0,
          TotalHandlingCharges: parseFloat(handlingAmount) || 0,
          JewelleryCertificate: jewCert,
          TotalCertificateCharges: parseFloat(certificateCharges) || 0,
          OtherCharges: parseFloat(otherCharges) || 0,
          HallmarkCharges: parseFloat(hallmarkCharges) || 0,
          TotalMakingCharges: parseFloat(totalMakingCharges) || 0,
          TotalStoneAmount: parseFloat(stoneAmount) || 0,
          FinalAmount: parseFloat(finalAmount) || 0,
          AskingRate: parseFloat(askingRate) || 0,
          TotalDiamondQty: parseInt(diamondQty) || 0,
          TotalStoneQty: parseInt(stoneQty) || 0,
          Description: description,
          Pcs: parseFloat(totalPcs) || 0,
          TotalDiamondCarat: parseFloat(totalDiaCarat) || 0,
          TotalStoneCarat: parseFloat(totalStnCarat) || 0
        },
        Diamond: diamond,
        Setting: setting,
        ActionType: "insert"
      };

      const response = await saveMountingStock(payload);
      if (response.success || response.Success) {
        toast.success(response.message || response.Message || "Mounting stock saved successfully!");
        navigate("/master/jewelleryM-stock-list", { state: { successMessage: "Mounting stock saved successfully!" } });
      } else {
        toast.error(response.message || response.Message || "Failed to save mounting stock.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      console.error("Response data:", err?.response?.data); // <-- check this in devtools

      const data = err?.response?.data;

      // ASP.NET Core ModelState validation errors come back as { errors: { Field: ["msg"] } }
      let detail = "";
      if (data?.errors && typeof data.errors === "object") {
        detail = Object.entries(data.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join(" | ");
      }

      toast.error(
        detail ||
        data?.message || data?.Message ||
        data?.title || // ProblemDetails responses use "title"
        "Failed to submit mounting stock."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  // shared style helpers (inline, kept local to render)
  const inputStyle = { fontSize: 13, fontWeight: 600, width: "100%", padding: "5px 8px", border: "1px solid #ced4da", borderRadius: 4 };
  const selectStyle = { ...inputStyle };
  const roStyle = { ...inputStyle, background: "#f8f9fa" };
  const tabBtn = (active) => ({
    padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer",
    fontWeight: 600, fontSize: 12, marginRight: 4, transition: "all .2s",
    background: active ? "#5A8DEE" : "#f2f4f7",
    color: active ? "#fff" : "#5A8DEE",
  });

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Add Mounting Stock")} pageTitle={t("Stock & Account")} />

          {/* ══════════════════════════════════════════════════════════════════
              TOP HEADER  –  mirrors MountingStockList CardHeader
          ══════════════════════════════════════════════════════════════════ */}
          <Card className="shadow-lg border-0 rounded-3 overflow-hidden mb-3">
            <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
              <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary d-flex align-items-center gap-2">
                <i className="ri-add-circle-line fs-20 text-primary"></i>
                {t("Add Mounting Stock")}
              </h5>
              <div className="d-flex gap-2">
                <Button
                  color="light"
                  onClick={() => navigate("/master/jewelleryM-stock-list")}
                  className="rounded-3 d-inline-flex align-items-center gap-1"
                >
                  <i className="ri-arrow-left-line align-bottom"></i> {t("Back")}
                </Button>
                <Button
                  color="primary"
                  onClick={handleSubmit}
                  disabled={submitLoading}
                  className="rounded-3 d-inline-flex align-items-center gap-1"
                >
                  {submitLoading ? (
                    <><Spinner size="sm" /> {t("Saving...")}</>
                  ) : (
                    <><i className="ri-save-line align-bottom"></i> {t("Save")}</>
                  )}
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* ══════════════════════════════════════════════════════════════════
            STOCK LIST TABLE  –  collapsible, exact MountingStockList layout
        ══════════════════════════════════════════════════════════════════ */}


          {/* ══════════════════════════════════════════════════════════════════
            STOCK LIST TABLE  –  collapsible, exact MountingStockList layout
        ══════════════════════════════════════════════════════════════════ */}
          {showList && (
            <Row className="mb-3">
              <Col lg={12}>
                <Card>
                  <CardBody>
                    {listLoading ? (
                      <div className="text-center py-4">
                        <Spinner color="primary" />
                      </div>
                    ) : (
                      <TableContainer
                        columns={listColumns}
                        data={mountingStock}
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
          )}

          {/* ══════════════════════════════════════════════════════════════════
            ADD FORM  –  three-column layout
        ══════════════════════════════════════════════════════════════════ */}
          <Row className="mb-3 align-items-stretch">

            {/* ── COL 1 : Stock Details / Image ── */}
            <Col xl={4} lg={4} md={4} className="d-flex flex-column mb-3 mb-md-0">
              <Card className="flex-grow-1 mb-0">
                <CardBody>
                  {/* tabs */}
                  <div className="d-flex justify-content-center mb-3 gap-1">
                    <button style={tabBtn(leftTab === "stock")} onClick={() => setLeftTab("stock")}>
                      <i className="ri-bar-chart-line me-1"></i>Stock Details
                    </button>
                    <button style={tabBtn(leftTab === "image")} onClick={() => setLeftTab("image")}>
                      <i className="ri-image-line me-1"></i>Image
                    </button>
                  </div>

                  {leftTab === "stock" && (
                    <>
                      <FieldRow label="Date">
                        <input type="date" style={inputStyle} value={trnDate}
                          onChange={(e) => handleDateChange(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Stock ID">
                        <>
                          <input type="text" 
                            className={`form-control ${errors.stockID ? 'is-invalid' : ''}`}
                            style={{...inputStyle, padding: "5px 8px"}} placeholder="Stock ID"
                            value={stockID} 
                            onChange={(e) => {
                                setStockID(e.target.value);
                                if (e.target.value.trim()) setErrors(prev => ({ ...prev, stockID: false }));
                            }}
                            onBlur={() => {
                                if (!stockID.trim()) setErrors(prev => ({ ...prev, stockID: true }));
                            }}
                          />
                          {errors.stockID && <div className="invalid-feedback d-block">{t("Please enter Stock ID")}</div>}
                        </>
                      </FieldRow>
                      <FieldRow label="Jewellery Category">
                        <select style={selectStyle} value={jewCategory}
                          onChange={(e) => setJewCategory(e.target.value)}>
                          <option value="">Select JewelleryCategory</option>
                          <option value="Finished Jewellery">Finished Jewellery</option>
                          <option value="Semi Jewellery">Semi Jewellery</option>
                          <option value="Mounting">Mounting</option>
                          <option value="Metal">Metal</option>
                        </select>
                      </FieldRow>

                      {showMountingSection && (
                        <FieldRow label="Use Mounting">
                          <select style={selectStyle} value={useMounting}
                            onChange={(e) => handleUseMountingChange(e.target.value)}>
                            <option value="">Select Lot No</option>
                            {mountOpts.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </FieldRow>
                      )}

                      <FieldRow label="Category">
                        <select style={selectStyle} value={category}
                          onChange={(e) => { setCategory(e.target.value); setSubCategory(""); }}>
                          <option value="">Select Category</option>
                          {categoryOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </FieldRow>
                      <FieldRow label="Sub Category">
                        <select style={selectStyle} value={subCategory}
                          onChange={(e) => setSubCategory(e.target.value)}>
                          <option value="">Select Sub Category</option>
                          {subCategoryOptionsForCategory.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </FieldRow>
                      <FieldRow label="Jewellery Size">
                        <input type="text" style={inputStyle} placeholder="Size"
                          value={jewSize} onChange={(e) => setJewSize(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Certificate">
                        <select style={selectStyle} value={jewCert}
                          onChange={(e) => setJewCert(e.target.value)}>
                          <option value="">Select Certificate</option>
                          <option value="IGI">IGI</option>
                          <option value="GIA">GIA</option>
                        </select>
                      </FieldRow>
                      <FieldRow label="Certificate No">
                        <input type="text" style={inputStyle} placeholder="Certificate No"
                          value={certNo} onChange={(e) => setCertNo(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Description" wide>
                        <input type="text" style={inputStyle} placeholder="Description"
                          value={description} onChange={(e) => setDescription(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Pcs">
                        <input type="text" style={{ ...inputStyle, textAlign: "right" }} placeholder="Pcs"
                          value={totalPcs} onChange={(e) => setTotalPcs(e.target.value)} />
                      </FieldRow>
                    </>
                  )}

                  {leftTab === "image" && (
                    <JewStockMediaPreview
                      imagePath={imagePath}
                      videoPath={videoPath}
                      certPath={certPath}
                    />
                  )}
                </CardBody>
              </Card>
            </Col>

            {/* ── COL 2 : Metal Details / Images Details ── */}
            <Col xl={4} lg={4} md={4} className="d-flex flex-column mb-3 mb-md-0">
              <Card className="flex-grow-1 mb-0">
                <CardBody>
                  <div className="d-flex justify-content-center mb-3 gap-1">
                    <button style={tabBtn(midTab === "metal")} onClick={() => setMidTab("metal")}>
                      <i className="ri-settings-3-line me-1"></i>Metal Details
                    </button>
                    <button style={tabBtn(midTab === "images")} onClick={() => setMidTab("images")}>
                      <i className="ri-folder-image-line me-1"></i>Images Details
                    </button>
                  </div>

                  {midTab === "metal" && (
                    <>
                      <FieldRow label="Metal Type">
                        <select style={selectStyle} value={metal}
                          onChange={(e) => setMetal(e.target.value)}>
                          <option value="">Select MetalType</option>
                          {metalTypeOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </FieldRow>
                      <FieldRow label="Color">
                        <select style={selectStyle} value={color}
                          onChange={(e) => setColor(e.target.value)}>
                          <option value="">Select Color</option>
                          {colorOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </FieldRow>
                      <FieldRow label="Purity">
                        <select style={selectStyle} value={metalPurity} disabled={!metal || purityLoading}
                          onChange={(e) => handlePurityChange(e.target.value)}>
                          <option value="">
                            {!metal ? "Select Metal Type first" : purityLoading ? "Loading…" : "Select Metal Purity"}
                          </option>
                          {purityOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </FieldRow>
                      <FieldRow label="Purity Ratio">
                        <input type="text" style={roStyle} placeholder="Pure Ratio"
                          value={purityRatio} readOnly />
                      </FieldRow>
                      <FieldRow label="Gross Weight">
                        <input type="text" style={{ ...inputStyle, textAlign: "right" }} placeholder="Gross Weight"
                          value={grossWeight} onChange={(e) => setGrossWeight(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Net Weight">
                        <input type="text" style={{ ...roStyle, textAlign: "right" }}
                          placeholder="Net Weight" value={netWeight} readOnly />
                      </FieldRow>
                      <FieldRow label="Metal Price/Gm">
                        <input type="text" style={{ ...inputStyle, textAlign: "right" }} placeholder="Metal Price/Gm"
                          value={metalPricePerGm} onChange={(e) => setMetalPricePerGm(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Metal Amount">
                        <input type="text" style={{ ...roStyle, textAlign: "right" }}
                          placeholder="Metal Amount" value={metalAmount} readOnly />
                      </FieldRow>
                      <FieldRow label="Diamond">
                        <div className="d-flex gap-1">
                          <input type="number" style={{ ...roStyle, textAlign: "right", flex: 1 }}
                            placeholder="Amt" value={diamondAmount} readOnly />
                          <input type="number" style={{ ...roStyle, textAlign: "right", width: 80 }}
                            placeholder="Pcs" value={diamondQty} readOnly />
                        </div>
                      </FieldRow>
                      <FieldRow label="Stone">
                        <div className="d-flex gap-1">
                          <input type="number" style={{ ...roStyle, textAlign: "right", flex: 1 }}
                            placeholder="Amt" value={stoneAmount} readOnly />
                          <input type="number" style={{ ...roStyle, textAlign: "right", width: 80 }}
                            placeholder="Pcs" value={stoneQty} readOnly />
                        </div>
                      </FieldRow>
                    </>
                  )}

                  {midTab === "images" && (
                    <>
                      <FieldRow label="Image Path" wide>
                        <input type="text" style={inputStyle} placeholder="Image Path"
                          value={imagePath} onChange={(e) => setImagePath(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Video Path" wide>
                        <input type="text" style={inputStyle} placeholder="Video Path"
                          value={videoPath} onChange={(e) => setVideoPath(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Cert Path" wide>
                        <input type="text" style={inputStyle} placeholder="Cert Path"
                          value={certPath} onChange={(e) => setCertPath(e.target.value)} />
                      </FieldRow>
                    </>
                  )}
                </CardBody>
              </Card>
            </Col>

            {/* ── COL 3 : Charges Details ── */}
            <Col xl={4} lg={4} md={4} className="d-flex flex-column">
              <Card className="flex-grow-1 mb-0">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span style={{
                      fontWeight: 600, fontSize: 13, color: "#5A8DEE",
                      background: "#f2f4f7", padding: "6px 14px", borderRadius: 6
                    }}>
                      Charges Details
                    </span>

                  </div>

                  <FieldRow label="Making Type">
                    <div className="d-flex gap-1">
                      <select style={{ ...selectStyle, flex: 1 }} value={makingType}
                        onChange={(e) => setMakingType(e.target.value)}>
                        <option value="">Select Making Type</option>
                        {(settingTypeOptions.length > 0
                          ? settingTypeOptions
                          : [
                              { value: "Per Gm", label: "Per Gm" },
                              { value: "Per Pcs", label: "Per Pcs" },
                              { value: "Lumsum", label: "Lumsum" },
                              { value: "Wastage", label: "Wastage" },
                              { value: "Per%", label: "Per%" },
                            ]
                        ).map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <input type="number" style={{ ...inputStyle, width: 80, textAlign: "right" }}
                        placeholder="Making Rate" value={makingRate}
                        onChange={(e) => setMakingRate(e.target.value)} />
                    </div>
                  </FieldRow>
                  <FieldRow label="Making Charges">
                    <input type="number" style={{ ...roStyle, textAlign: "right" }}
                      value={makingCharges} readOnly />
                  </FieldRow>
                  <FieldRow label="Setting Charges">
                    <input type="number" style={{ ...roStyle, textAlign: "right" }}
                      value={settingCharges} readOnly />
                  </FieldRow>
                  <FieldRow label="Handling Carat">
                    <div className="d-flex gap-1">
                      <input type="number" style={{ ...inputStyle, flex: 1, textAlign: "right" }}
                        placeholder="Handling Carat" value={handlingCarat}
                        onChange={(e) => setHandlingCarat(e.target.value)} />
                      <input type="number" style={{ ...inputStyle, width: 80, textAlign: "right" }}
                        placeholder="Handling Charges" value={handlingCharges}
                        onChange={(e) => setHandlingCharges(e.target.value)} />
                    </div>
                  </FieldRow>
                  <FieldRow label="Handling Amount">
                    <input type="number" style={{ ...roStyle, textAlign: "right" }}
                      value={handlingAmount} readOnly />
                  </FieldRow>
                  <FieldRow label="Certificate Charges">
                    <input type="number" style={{ ...inputStyle, textAlign: "right" }}
                      placeholder="Certificate Charges" value={certificateCharges}
                      onChange={(e) => setCertificateCharges(e.target.value)} />
                  </FieldRow>
                  <FieldRow label="Other Charges">
                    <input type="number" style={{ ...inputStyle, textAlign: "right" }}
                      placeholder="Other Charges" value={otherCharges}
                      onChange={(e) => setOtherCharges(e.target.value)} />
                  </FieldRow>
                  <FieldRow label="Hallmark Charges">
                    <input type="number" style={{ ...inputStyle, textAlign: "right" }}
                      placeholder="Hallmark Charges" value={hallmarkCharges}
                      onChange={(e) => setHallmarkCharges(e.target.value)} />
                  </FieldRow>
                  <FieldRow label="Total Making">
                    <input type="number" style={{ ...roStyle, textAlign: "right" }}
                      value={totalMakingCharges} readOnly />
                  </FieldRow>
                  <FieldRow label="Final Cost Amount">
                    <input type="number"
                      style={{ ...roStyle, textAlign: "right", background: "#e5edfc", fontWeight: 700 }}
                      value={finalAmount} readOnly />
                  </FieldRow>
                  <FieldRow label="Asking Rate">
                    <input type="text" style={{ ...inputStyle, textAlign: "right" }}
                      placeholder="Asking Rate" value={askingRate}
                      onChange={(e) => setAskingRate(e.target.value)} />
                  </FieldRow>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* ══════════════════════════════════════════════════════════════════
            MOUNTING DETAIL ENTRY  –  only for Finished / Semi Jewellery
        ══════════════════════════════════════════════════════════════════ */}
          {showDetailsSection && (
            <>
              {/* ── Entry Form ── */}
              <Row className="mb-3">
                <Col lg={12}>
                  <Card>
                    <CardBody>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>

                        {/* Element Type */}
                        <div style={{ flex: "1 1 130px", minWidth: 130 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                            Element Type
                          </label>
                          <select style={selectStyle} value={elementType}
                            onChange={(e) => setElementType(e.target.value)}>
                            <option value="">Element Type</option>
                            <option value="Natural Diamond">Natural Diamond</option>
                            <option value="Lab Grown Diamond">Lab Grown Diamond</option>
                            <option value="Gem Stone">Gem Stone</option>
                          </select>
                        </div>

                        {/* Lot No — MVC select2 ajax: /common/get-alllotno-listall */}
                        <div style={{ flex: "2 1 200px", minWidth: 200, position: "relative" }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                            Lot No
                          </label>
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="Lot No"
                            value={lotSearch}
                            onChange={(e) => {
                              setLotSearch(e.target.value);
                              setLotNo(e.target.value);
                              searchLots(e.target.value);
                            }}
                            onFocus={() => searchLots(lotSearch)}
                          />
                          {lotNoHint && (
                            <small className="text-muted" style={{ fontSize: 11 }}>{lotNoHint}</small>
                          )}
                          {lotOptions.length > 0 && (
                            <div style={{
                              position: "absolute", zIndex: 200, background: "#fff",
                              border: "1px solid #ced4da", borderRadius: 4, width: "100%",
                              maxHeight: 160, overflowY: "auto", boxShadow: "0 2px 8px rgba(0,0,0,.1)"
                            }}>
                              {lotOptions.map((o, idx) => (
                                <div key={`${o.id}-${idx}`}
                                  style={{ padding: "6px 10px", cursor: "pointer", fontSize: 13 }}
                                  onMouseDown={() => handleLotSelect(o.id, o.text)}>
                                  {o.text}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Shape */}
                        <div style={{ flex: "1 1 100px", minWidth: 100 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Shape</label>
                          <select style={selectStyle} value={shape} onChange={(e) => setShape(e.target.value)}>
                            <option value="">Shape</option>
                            {shapeOptions.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Size */}
                        <div style={{ flex: "1 1 100px", minWidth: 100 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Size</label>
                          <select style={selectStyle} value={size} onChange={(e) => setSize(e.target.value)}>
                            <option value="">Size</option>
                            {sizeOptions.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Sieve */}
                        <div style={{ flex: "1 1 100px", minWidth: 100 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Sieve</label>
                          <select style={selectStyle} value={sieve} onChange={(e) => setSieve(e.target.value)}>
                            <option value="">Sieve</option>
                            {sieveOptions.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Color */}
                        <div style={{ flex: "1 1 100px", minWidth: 100 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Color</label>
                          <select style={selectStyle} value={stoneColor} onChange={(e) => setStoneColor(e.target.value)}>
                            <option value="">Color</option>
                            {stoneColorOptions.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Clarity */}
                        <div style={{ flex: "1 1 100px", minWidth: 100 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Clarity</label>
                          <select style={selectStyle} value={clarity} onChange={(e) => setClarity(e.target.value)}>
                            <option value="">Clarity</option>
                            {clarityOptions.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Pcs / Carat / Price / Amount */}
                        {[
                          ["Pcs", pcs, setPcs, false],
                          ["Carat", carats, setCarats, false],
                          ["Price", rate, setRate, false],
                          ["Amount", amount, null, true],
                        ].map(([lbl, val, setter, ro]) => (
                          <div key={lbl} style={{ flex: "1 1 80px", minWidth: 80 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{lbl}</label>
                            <input type="text" style={{ ...(ro ? roStyle : inputStyle), textAlign: "right" }}
                              placeholder={lbl} value={val} readOnly={ro}
                              onChange={ro ? undefined : (e) => setter(e.target.value)} />
                          </div>
                        ))}

                        {/* Lab — MVC: text input #JewLab */}
                        <div style={{ flex: "1 1 80px", minWidth: 80 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Lab</label>
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="Lab"
                            value={lab}
                            onChange={(e) => setLab(e.target.value)}
                          />
                        </div>

                        <div style={{ alignSelf: "end", display: "flex", gap: 6 }}>
                          <button
                            onClick={addItem}
                            style={{
                              background: editingRowId ? "#28a745" : "#5A8DEE",
                              color: "#fff",
                              border: "none",
                              borderRadius: 6,
                              padding: "7px 12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontSize: 13,
                              whiteSpace: "nowrap"
                            }}
                          >
                            <i className={editingRowId ? "ri-save-line" : "ri-add-line"}></i>{" "}
                            {editingRowId ? "Update Item" : "Add Item"}
                          </button>

                          {editingRowId && (
                            <button
                              onClick={clearEntryForm}
                              style={{
                                background: "#6c757d",
                                color: "#fff",
                                border: "none",
                                borderRadius: 6,
                                padding: "7px 12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontSize: 13,
                                whiteSpace: "nowrap"
                              }}
                            >
                              <i className="ri-close-line"></i>{" "}
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* ── Diamond / Stone Details Table ── */}
              <Row>
                <Col lg={12}>
                  <Card>
                    <CardBody>
                      <h5 style={{
                        fontWeight: 600, color: "#5A8DEE", background: "#f2f4f7",
                        padding: "8px 14px", borderRadius: 6, textAlign: "center",
                        marginBottom: 12, fontSize: 13
                      }}>
                        Parcel LotNo / Solitaire LotNo / Mounting LotNo
                      </h5>
                      <div className="table-responsive">
                        <table className="table table-bordered table-sm align-middle mb-0"
                          style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                          <thead className="table-light">
                            <tr>
                              {["", "Stock ID", "Stone Type", "Shape", "Size", "Sieve",
                                "Color", "Clarity", "Pcs", "Carat", "Price", "Amount", "LAB"
                              ].map((h) => (
                                <th key={h} style={{ padding: "7px 10px" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {tableRows.length === 0 ? (
                              <tr>
                                <td colSpan={13} className="text-center text-muted py-4">
                                  No items added yet.
                                </td>
                              </tr>
                            ) : tableRows.map((row) => (
                              <tr key={row.id} style={editingRowId === row.id ? { background: "#fff8e7" } : {}}>
                                <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                                  <button onClick={() => removeRow(row.id)}
                                    className="btn btn-soft-danger btn-sm py-0 px-1 me-1">
                                    <i className="ri-delete-bin-fill"></i>
                                  </button>
                                  <button onClick={() => editRow(row)}
                                    className="btn btn-soft-primary btn-sm py-0 px-1">
                                    <i className="ri-edit-line"></i>
                                  </button>
                                </td>
                                {[row.stockID, row.stoneType, row.shape, row.size, row.sieve,
                                row.color, row.clarity, row.pcs, row.carats, row.rate,
                                row.amount, row.lab
                                ].map((v, i) => (
                                  <td key={i} style={{ padding: "6px 10px" }}>{v !== undefined && v !== "" ? v : "—"}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                          {tableRows.length > 0 && (
                            <tfoot className="table-light fw-bold">
                              <tr>
                                <td colSpan={8} style={{ padding: "6px 10px" }}></td>
                                <td style={{ padding: "6px 10px" }}>
                                  {tableRows.reduce((s, r) => s + (parseFloat(r.pcs) || 0), 0)}
                                </td>
                                <td style={{ padding: "6px 10px" }}>
                                  {tableRows.reduce((s, r) => s + (parseFloat(r.carats) || 0), 0).toFixed(3)}
                                </td>
                                <td style={{ padding: "6px 10px" }}></td>
                                <td style={{ padding: "6px 10px" }}>
                                  {tableRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0).toFixed(2)}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                      {tableRows.length > 0 && (
                        <div style={{ fontSize: 12, color: "#6c757d", marginTop: 8 }}>
                          Showing 1 to {tableRows.length} of {tableRows.length} {tableRows.length === 1 ? "entry" : "entries"}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </>
          )}


        </Container>
      </div>
      <ToastContainer autoClose={2000} />
    </React.Fragment>
  );
}