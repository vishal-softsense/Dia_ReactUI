import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Card, CardBody, CardHeader,
  Button, Col, Row, Spinner
} from "reactstrap";

import {
  getMountingStock,
  getJewMetalMaster,
  getJewColorMaster,
  getJewPurity,
  getPureRatio,
  getJewCategoryDropdown,
  getJewSubCategory,
  getJewSettingType,
} from "../../../helpers/fakebackend_helper";
import { exportToExcel }    from "../../../helpers/excel_helper";
import TableContainer       from "../../../Components/Common/TableContainer";

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
const IS  = { fontSize: 13, fontWeight: 600 }; // input shared
const RO  = { ...IS, background: "#f8f9fa" };  // readonly

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
// Field-name guesses are checked in order — trim this once you've
// confirmed each endpoint's real row shape.
function toOptions(arr, { withRatio = false } = {}) {
  return (Array.isArray(arr) ? arr : []).map((item) => {
    const value =
      item?.ID ?? item?.Id ?? item?.id ?? item?.Value ?? item?.value ?? item?.Code ?? item?.code ?? "";
    const label =
      item?.Name ?? item?.name ?? item?.Label ?? item?.label ?? item?.Text ?? item?.text ?? String(value);
    const opt = { value, label };
    if (withRatio) {
      opt.ratio =
        item?.Ratio ?? item?.ratio ?? item?.PurityRatio ?? item?.purityRatio ?? item?.PureRatio ?? null;
    }
    return opt;
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddMountingMaster() {
  const { t } = useTranslation();

  // ── page title ──
  useEffect(() => { document.title = "Add Mounting Stock | DiaJewSoft"; }, []);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION A  –  Mounting Stock LIST  (from MountingStockList)
  // ════════════════════════════════════════════════════════════════════════════
  const [mountingStock, setMountingStock]   = useState([]);
  const [listLoading,   setListLoading]     = useState(false);
  const [showList,      setShowList]        = useState(false); // toggle list panel

  const getMountingStockList = async () => {
    setListLoading(true);
    try {
      const response = await getMountingStock();
      const success  =
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
      item.stock_ID      || item.Stock_ID      || "",
      item.mountCategory || item.MountCategory || item.designName || "",
      item.metalType     || item.MetalType     || "",
      item.purity        || item.Purity        || "",
      item.totalDiamondCarat || item.TotalDiamondCarat || 0,
      Number(item.grossWeight    || item.GrossWeight    || 0).toFixed(3),
      Number(item.netWeight      || item.NetWeight      || 0).toFixed(3),
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
    { header: t("StockID"),            accessorKey: "stock_ID",           enableColumnFilter: true },
    { header: t("JewelleryCategory"),  accessorKey: "mountCategory",      enableColumnFilter: true },
    { header: t("MetalType"),          accessorKey: "metalType",          enableColumnFilter: true },
    { header: t("Purity"),             accessorKey: "purity",             enableColumnFilter: true },
    { header: t("DiamondWeight"),      accessorKey: "totalDiamondCarat",  enableColumnFilter: true },
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
  const [midTab,  setMidTab]  = useState("metal");   // "metal" | "images"

  // ── Dropdown master data (one state per endpoint) ──
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [categoryOptions,    setCategoryOptions]    = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [metalTypeOptions,   setMetalTypeOptions]   = useState([]);
  const [colorOptions,       setColorOptions]       = useState([]);
  const [purityOptions,      setPurityOptions]      = useState([]);
  const [settingTypeOptions, setSettingTypeOptions] = useState([]);
  const [purityLoading,      setPurityLoading]      = useState(false);

  // Category / Sub Category / Metal / Color / Setting Type don't depend on
  // anything else, so load them all once on mount.
  useEffect(() => {
    let cancelled = false;

    const loadOne = async (fetcher, setter, label) => {
      try {
        const response = await fetcher();
        const { success, data, message } = unwrapApiResponse(response);
        if (cancelled) return;
        if (success) {
          setter(toOptions(data));
        } else {
          toast.error(message || `Failed to load ${label}.`);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          toast.error(`Failed to load ${label}.`);
        }
      }
    };

    setDropdownLoading(true);
    Promise.all([
      loadOne(getJewCategoryDropdown,    setCategoryOptions,    "Jewellery Category list"),
      loadOne(getJewSubCategory, setSubCategoryOptions, "Sub Category list"),
      loadOne(getJewMetalMaster, setMetalTypeOptions,   "Metal Type list"),
      loadOne(getJewColorMaster, setColorOptions,       "Color list"),
      loadOne(getJewSettingType, setSettingTypeOptions, "Making Type list"),
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
          setPurityOptions(toOptions(data));
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

  // ── Stock Details ──
  const today = new Date().toISOString().slice(0, 10);
  const [trnDate,       setTrnDate]       = useState(today);
  const [stockID,       setStockID]       = useState("");
  const [jewCategory,   setJewCategory]   = useState("");
  const [useMounting,   setUseMounting]   = useState("");
  const [mountOpts,     setMountOpts]     = useState([]);
  const [category,      setCategory]      = useState("");
  const [subCategory,   setSubCategory]   = useState("");
  const [jewSize,       setJewSize]       = useState("");
  const [jewCert,       setJewCert]       = useState("");
  const [certNo,        setCertNo]        = useState("");
  const [description,   setDescription]   = useState("");
  const [totalPcs,      setTotalPcs]      = useState("");

  // ── Metal Details ──
  const [metal,            setMetal]            = useState("");
  const [color,            setColor]            = useState("");
  const [metalPurity,      setMetalPurity]      = useState("");
  const [purityRatio,      setPurityRatio]      = useState("");
  const [grossWeight,      setGrossWeight]      = useState("");
  const [netWeight,        setNetWeight]        = useState("");
  const [metalPricePerGm,  setMetalPricePerGm]  = useState("");
  const [metalAmount,      setMetalAmount]      = useState("");
  const [diamondAmount,    setDiamondAmount]    = useState("");
  const [diamondQty,       setDiamondQty]       = useState("");
  const [stoneAmount,      setStoneAmount]      = useState("");
  const [stoneQty,         setStoneQty]         = useState("");

  // ── Image/Video paths ──
  const [imagePath, setImagePath] = useState("");
  const [videoPath, setVideoPath] = useState("");
  const [certPath,  setCertPath]  = useState("");

  // ── Charges ──
  const [makingType,         setMakingType]         = useState("");
  const [makingRate,         setMakingRate]         = useState("");
  const [makingCharges,      setMakingCharges]      = useState("");
  const [settingCharges]                            = useState("0.00");
  const [handlingCarat,      setHandlingCarat]      = useState("");
  const [handlingCharges,    setHandlingCharges]    = useState("");
  const [handlingAmount,     setHandlingAmount]     = useState("");
  const [certificateCharges, setCertificateCharges] = useState("");
  const [otherCharges,       setOtherCharges]       = useState("");
  const [hallmarkCharges,    setHallmarkCharges]    = useState("");
  const [totalMakingCharges, setTotalMakingCharges] = useState("");
  const [finalAmount,        setFinalAmount]        = useState("");
  const [askingRate,         setAskingRate]         = useState("");

  // ── Row entry form ──
  const [elementType, setElementType] = useState("");
  const [lotNo,       setLotNo]       = useState("");
  const [lotSearch,   setLotSearch]   = useState("");
  const [lotOptions,  setLotOptions]  = useState([]);
  const [shape,       setShape]       = useState("");
  const [size,        setSize]        = useState("");
  const [sieve,       setSieve]       = useState("");
  const [stoneColor,  setStoneColor]  = useState("");
  const [clarity,     setClarity]     = useState("");
  const [pcs,         setPcs]         = useState("");
  const [carats,      setCarats]      = useState("");
  const [rate,        setRate]        = useState("");
  const [amount,      setAmount]      = useState("");
  const [lab,         setLab]         = useState("");

  // ── Table rows ──
  const [tableRows, setTableRows] = useState([]);

  // ── Form submit loading ──
  const [submitLoading, setSubmitLoading] = useState(false);

  // ── Derived visibility ──
  const showMountingSection = jewCategory === "Finished Jewellery" || jewCategory === "Semi Jewellery";
  const showDetailsSection  = jewCategory !== "Mounting" && jewCategory !== "Metal";

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
    const ratio = parseFloat(purityRatio) || 0;
    setNetWeight(ratio ? (gw * ratio / 100).toFixed(3) : "");
  }, [grossWeight, purityRatio]);

  useEffect(() => {
    const nw = parseFloat(netWeight) || 0;
    const pp = parseFloat(metalPricePerGm) || 0;
    setMetalAmount((nw * pp).toFixed(2));
  }, [netWeight, metalPricePerGm]);

  useEffect(() => {
    const r  = parseFloat(makingRate) || 0;
    const gw = parseFloat(grossWeight) || 0;
    const pc = parseFloat(totalPcs) || 1;
    const ma = parseFloat(metalAmount) || 0;
    let mc = 0;
    if      (makingType === "Per Gm")  mc = r * gw;
    else if (makingType === "Per Pcs") mc = r * pc;
    else if (makingType === "Lumsum")  mc = r;
    else if (makingType === "Per%")    mc = (ma * r) / 100;
    setMakingCharges(mc.toFixed(2));
  }, [makingType, makingRate, grossWeight, totalPcs, metalAmount]);

  useEffect(() => {
    const hc  = parseFloat(handlingCarat)   || 0;
    const hch = parseFloat(handlingCharges) || 0;
    setHandlingAmount((hc * hch).toFixed(2));
  }, [handlingCarat, handlingCharges]);

  useEffect(() => {
    const sum =
      (parseFloat(makingCharges)      || 0) +
      (parseFloat(settingCharges)     || 0) +
      (parseFloat(handlingAmount)     || 0) +
      (parseFloat(certificateCharges) || 0) +
      (parseFloat(otherCharges)       || 0) +
      (parseFloat(hallmarkCharges)    || 0);
    setTotalMakingCharges(sum.toFixed(2));
    const fa =
      (parseFloat(metalAmount)   || 0) +
      (parseFloat(diamondAmount) || 0) +
      (parseFloat(stoneAmount)   || 0) + sum;
    setFinalAmount(fa.toFixed(2));
  }, [makingCharges, settingCharges, handlingAmount, certificateCharges,
      otherCharges, hallmarkCharges, metalAmount, diamondAmount, stoneAmount]);

  useEffect(() => {
    const c = parseFloat(carats) || 0;
    const r = parseFloat(rate)   || 0;
    setAmount((c * r).toFixed(2));
  }, [carats, rate]);

  // ─── Load Mounting Stock options (dropdown) ───────────────────────────────
  useEffect(() => {
    if (!showMountingSection || !jewCategory) {
      setMountOpts([]);
      setUseMounting("");
      return;
    }
    fetch(`/master/GetMountingStockIds?ddl=${encodeURIComponent(jewCategory)}`)
      .then((r) => r.json())
      .then((data) => setMountOpts(data.map((d) => ({ value: d.ID, label: d.Name }))))
      .catch(() => toast.error("Error loading mounting stock options."));
  }, [jewCategory]);

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
  const searchLots  = useCallback((term) => {
    if (!term) { setLotOptions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`/common/get-alllotno-listall?searchby=${encodeURIComponent(term)}&stoneType=${encodeURIComponent(elementType)}`)
        .then((r) => r.json())
        .then(setLotOptions)
        .catch(() => {});
    }, 250);
  }, [elementType]);

  useEffect(() => { setLotNo(""); setLotOptions([]); }, [elementType]);

  // ─── Add table row ────────────────────────────────────────────────────────
  const addItem = () => {
    if (!elementType || !pcs || !carats) {
      toast.error("Element Type, Pcs and Carat are required.");
      return;
    }
    const row = {
      id: Date.now(), stockID: lotNo, stoneType: elementType,
      shape, size, sieve, color: stoneColor, clarity, pcs, carats, rate, amount, lab
    };
    setTableRows((p) => [...p, row]);
    const rowAmt = parseFloat(amount) || 0;
    const rowPcs = parseFloat(pcs)    || 0;
    if (elementType === "Natural Diamond" || elementType === "Lab Grown Diamond") {
      setDiamondAmount((p) => ((parseFloat(p) || 0) + rowAmt).toFixed(2));
      setDiamondQty((p)    => String((parseFloat(p) || 0) + rowPcs));
    } else {
      setStoneAmount((p) => ((parseFloat(p) || 0) + rowAmt).toFixed(2));
      setStoneQty((p)    => String((parseFloat(p) || 0) + rowPcs));
    }
    setLotNo(""); setLotSearch(""); setLotOptions([]);
    setPcs(""); setCarats(""); setRate(""); setAmount(""); setLab("");
  };

  const removeRow = (id) => {
    const row = tableRows.find((r) => r.id === id);
    if (!row) return;
    const amt = parseFloat(row.amount) || 0;
    const pc  = parseFloat(row.pcs)   || 0;
    if (row.stoneType === "Natural Diamond" || row.stoneType === "Lab Grown Diamond") {
      setDiamondAmount((p) => Math.max(0, (parseFloat(p) || 0) - amt).toFixed(2));
      setDiamondQty((p)    => String(Math.max(0, (parseFloat(p) || 0) - pc)));
    } else {
      setStoneAmount((p) => Math.max(0, (parseFloat(p) || 0) - amt).toFixed(2));
      setStoneQty((p)    => String(Math.max(0, (parseFloat(p) || 0) - pc)));
    }
    setTableRows((p) => p.filter((r) => r.id !== id));
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!trnDate || !stockID || !jewCategory) {
      toast.error("Date, Stock ID and Jewellery Category are required.");
      return;
    }
    setSubmitLoading(true);
    try {
      const payload = {
        TrnDate: trnDate, StockID: stockID, JewCategory: jewCategory,
        UseMounting: useMounting, Category: category, SubCategory: subCategory,
        JewSize: jewSize, Certificate: jewCert, CertNo: certNo,
        Description: description, TotalPcs: totalPcs,
        Metal: metal, Color: color, MetalPurity: metalPurity,
        PurityRatio: purityRatio, GrossWeight: grossWeight, NetWeight: netWeight,
        MetalPricePerGm: metalPricePerGm, MetalAmount: metalAmount,
        DiamondAmount: diamondAmount, DiamondQty: diamondQty,
        StoneAmount: stoneAmount, StoneQty: stoneQty,
        MakingType: makingType, MakingRate: makingRate, MakingCharges: makingCharges,
        SettingCharges: settingCharges, HandlingCarat: handlingCarat,
        HandlingCharges: handlingCharges, HandlingAmount: handlingAmount,
        CertificateCharges: certificateCharges, OtherCharges: otherCharges,
        HallmarkCharges: hallmarkCharges, TotalMakingCharges: totalMakingCharges,
        FinalAmount: finalAmount, AskingRate: askingRate,
        Items: tableRows,
      };
      console.log("Submit payload:", payload);
      // TODO: replace with real API call
      // await addMountingStock(payload);
      toast.success("Mounting stock submitted successfully!");
      await getMountingStockList(); // refresh list after save
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit mounting stock.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  // shared style helpers (inline, kept local to render)
  const inputStyle  = { fontSize: 13, fontWeight: 600, width: "100%", padding: "5px 8px", border: "1px solid #ced4da", borderRadius: 4 };
  const selectStyle = { ...inputStyle };
  const roStyle     = { ...inputStyle, background: "#f8f9fa" };
  const tabBtn      = (active) => ({
    padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer",
    fontWeight: 600, fontSize: 12, marginRight: 4, transition: "all .2s",
    background: active ? "#5A8DEE" : "#f2f4f7",
    color:      active ? "#fff"    : "#5A8DEE",
  });

  return (
    <div className="page-content">
      <div className="container-fluid">

        {/* ══════════════════════════════════════════════════════════════════
            TOP HEADER  –  mirrors MountingStockList CardHeader
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
                      <input type="text" style={inputStyle} placeholder="Stock ID"
                        value={stockID} onChange={(e) => setStockID(e.target.value)} />
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
                          onChange={(e) => setUseMounting(e.target.value)}>
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
                  <div className="text-center">
                    <img src="/Images/jewring1.jpeg" alt="Jewellery"
                      style={{ width: "100%", borderRadius: 6, maxHeight: 240, objectFit: "cover" }}
                      onError={(e) => { e.target.style.display = "none"; }} />
                    <p className="mt-2 text-muted" style={{ fontSize: 12 }}>
                      📷 Camera &nbsp;|&nbsp; 🎬 Video &nbsp;|&nbsp;
                      <a href="https://www.igi.org/verify-your-report/" target="_blank"
                        rel="noreferrer" style={{ color: "#5A8DEE" }}>IGI Verify</a>
                    </p>
                  </div>
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
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#5A8DEE",
                    background: "#f2f4f7", padding: "6px 14px", borderRadius: 6 }}>
                    Charges Details
                  </span>
                  <Button color="primary" size="sm" onClick={handleSubmit} disabled={submitLoading}
                    className="rounded-3 d-inline-flex align-items-center gap-1">
                    {submitLoading
                      ? <><Spinner size="sm" /> Saving…</>
                      : <><i className="ri-save-line"></i> Submit</>}
                  </Button>
                </div>

                <FieldRow label="Making Type">
                  <div className="d-flex gap-1">
                    <select style={{ ...selectStyle, flex: 1 }} value={makingType}
                      onChange={(e) => setMakingType(e.target.value)}>
                      <option value="">Select Making Type</option>
                      {settingTypeOptions.length > 0 ? (
                        settingTypeOptions.map((o) => (
                          <option key={o.value} value={o.label}>{o.label}</option>
                        ))
                      ) : (
                        <>
                          <option value="Per Gm">Per Gm</option>
                          <option value="Per Pcs">Per Pcs</option>
                          <option value="Lumsum">Lumsum</option>
                          <option value="Wastage">Wastage</option>
                          <option value="Per%">Per%</option>
                        </>
                      )}
                    </select>
                    <input type="number" style={{ ...inputStyle, width: 80, textAlign: "right" }}
                      placeholder="Rate" value={makingRate}
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
                      placeholder="Carat" value={handlingCarat}
                      onChange={(e) => setHandlingCarat(e.target.value)} />
                    <input type="number" style={{ ...inputStyle, width: 80, textAlign: "right" }}
                      placeholder="Charges" value={handlingCharges}
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
                    <div style={{ display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                      gap: 12, alignItems: "end" }}>

                      {/* Element Type */}
                      <div>
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

                      {/* Lot No autocomplete */}
                      <div style={{ gridColumn: "span 2", position: "relative" }}>
                        <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                          Lot No
                        </label>
                        <input type="text" style={inputStyle} placeholder="Search Lot No…"
                          value={lotSearch}
                          onChange={(e) => { setLotSearch(e.target.value); searchLots(e.target.value); }} />
                        {lotOptions.length > 0 && (
                          <div style={{ position: "absolute", zIndex: 200, background: "#fff",
                            border: "1px solid #ced4da", borderRadius: 4, width: "100%",
                            maxHeight: 160, overflowY: "auto", boxShadow: "0 2px 8px rgba(0,0,0,.1)" }}>
                            {lotOptions.map((o) => (
                              <div key={o.id}
                                style={{ padding: "6px 10px", cursor: "pointer", fontSize: 13 }}
                                onMouseDown={() => {
                                  setLotNo(o.id);
                                  setLotSearch(o.text);
                                  setLotOptions([]);
                                }}>
                                {o.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Shape / Size / Sieve / Color / Clarity */}
                      {[
                        ["Shape",   shape,      setShape],
                        ["Size",    size,        setSize],
                        ["Sieve",   sieve,       setSieve],
                        ["Color",   stoneColor,  setStoneColor],
                        ["Clarity", clarity,     setClarity],
                      ].map(([lbl, val, setter]) => (
                        <div key={lbl}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{lbl}</label>
                          <input type="text" style={inputStyle} placeholder={lbl}
                            value={val} onChange={(e) => setter(e.target.value)} />
                        </div>
                      ))}

                      {/* Pcs / Carat / Price / Amount / Lab */}
                      {[
                        ["Pcs",    pcs,    setPcs,    false],
                        ["Carat",  carats, setCarats, false],
                        ["Price",  rate,   setRate,   false],
                        ["Amount", amount, null,      true],
                        ["Lab",    lab,    setLab,    false],
                      ].map(([lbl, val, setter, ro]) => (
                        <div key={lbl}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{lbl}</label>
                          <input type="text" style={{ ...(ro ? roStyle : inputStyle), textAlign: "right" }}
                            placeholder={lbl} value={val} readOnly={ro}
                            onChange={ro ? undefined : (e) => setter(e.target.value)} />
                        </div>
                      ))}

                      {/* Add button */}
                      <div style={{ alignSelf: "end" }}>
                        <button onClick={addItem}
                          style={{ background: "#5A8DEE", color: "#fff", border: "none",
                            borderRadius: 6, padding: "7px 12px", fontWeight: 600,
                            cursor: "pointer", fontSize: 13, width: "100%" }}>
                          <i className="ri-add-line"></i> Add Item
                        </button>
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
                    <h5 style={{ fontWeight: 600, color: "#5A8DEE", background: "#f2f4f7",
                      padding: "8px 14px", borderRadius: 6, textAlign: "center",
                      marginBottom: 12, fontSize: 13 }}>
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
                            <tr key={row.id}>
                              <td style={{ padding: "6px 10px" }}>
                                <button onClick={() => removeRow(row.id)}
                                  className="btn btn-soft-danger btn-sm py-0 px-1">
                                  <i className="ri-delete-bin-fill"></i>
                                </button>
                              </td>
                              {[row.stockID, row.stoneType, row.shape, row.size, row.sieve,
                                row.color, row.clarity, row.pcs, row.carats, row.rate,
                                row.amount, row.lab
                              ].map((v, i) => (
                                <td key={i} style={{ padding: "6px 10px" }}>{v || "—"}</td>
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
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </>
        )}

      </div>
    </div>
  );
}