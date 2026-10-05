import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Card, CardBody, CardHeader,
  Button, Col, Row, Spinner, Container
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import Select from "react-select";
import {
  getMountingStockDetail,
  getJewPurity,
  getPureRatio,
  saveMountingStock,
  deleteMountingStock,
  getMountingStockDropdown,
  getAllLotNoList,
  getAddMountingStockData,
  getJewLotNoData,
} from "../../../helpers/fakebackend_helper";
import DeleteModal from "../../../Components/Common/DeleteModal";
import JewStockMediaPreview from "./JewStockMediaPreview";
import {
  computeChargeTotals,
  computeMakingCharges,
  floorPurityRatio,
  formatAmount,
  formatCarat,
  formatPrice,
  MAKING_TYPE_OPTIONS,
  mapDiamondListToRows,
  summarizeTableRows,
} from "./jewStockFormUtils";

const FieldRow = ({ label, children, wide = false }) => (
  <div className="row mb-2" style={{ alignItems: "center" }}>
    <div className={`${wide ? "col-md-3" : "col-md-4"} font-weight-bold`} style={{ fontSize: 13, color: "#495057" }}>
      {label}
    </div>
    <div className={`${wide ? "col-md-9" : "col-md-8"}`}>
      {children}
    </div>
  </div>
);

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

export default function JewStockMasterEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id") || searchParams.get("ID");
  // MVC EditStockMaster / EditMountingStock: Mode=view disables inputs & hides submit
  const isView =
    String(searchParams.get("Mode") || searchParams.get("mode") || "").toLowerCase() === "view";
  const readOnly = isView;

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  // Form state
  const [trnDate, setTrnDate] = useState("");
  const [stockID, setStockID] = useState("");
  const [errors, setErrors] = useState({});
  const [jewCategory, setJewCategory] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [jewSize, setJewSize] = useState("");
  const [jewCert, setJewCert] = useState("");
  const [certNo, setCertNo] = useState("");
  const [description, setDescription] = useState("");
  const [totalPcs, setTotalPcs] = useState("");
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
  const [costAmount, setCostAmount] = useState("");
  const [finalAmount, setFinalAmount] = useState("");
  const [askingRate, setAskingRate] = useState("");
  const [originalMakingCharges, setOriginalMakingCharges] = useState("");
  const [isManualAskingRate, setIsManualAskingRate] = useState(false);
  const [otherPer, setOtherPer] = useState("0");
  const [askingPer, setAskingPer] = useState("0");
  const [imagePath, setImagePath] = useState("");
  const [videoPath, setVideoPath] = useState("");
  const [certPath, setCertPath] = useState("");
  const [imageBinary, setImageBinary] = useState(null);
  const [useMounting, setUseMounting] = useState("");
  const [leftTab, setLeftTab] = useState("stock");   // "stock" | "image"
  const [midTab, setMidTab] = useState("metal");     // "metal" | "images"
  const [calcBasis, setCalcBasis] = useState("NetWeight"); // "GrossWeight" | "NetWeight"

  // Dropdown data
  const [metalTypeOptions, setMetalTypeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [purityOptions, setPurityOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [shapeOptions, setShapeOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [sieveOptions, setSieveOptions] = useState([]);
  const [stoneColorOptions, setStoneColorOptions] = useState([]);
  const [clarityOptions, setClarityOptions] = useState([]);
  const [mountOpts, setMountOpts] = useState([]);

  // ── Row entry form ──
  const [editingRowId, setEditingRowId] = useState(null);
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

  // Table rows for diamonds/stones
  const [tableRows, setTableRows] = useState([]);

  useEffect(() => {
    document.title = "Edit Mounting Stock | DiaJewSoft";
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAddMountingDropdowns = async () => {
      try {
        const response = await getAddMountingStockData();
        const { success, data, message } = unwrapApiResponse(response);
        if (cancelled) return;
        if (!success || !data) {
          toast.error(message || "Failed to load mounting stock dropdowns.");
          return;
        }
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
            const sid = getItemField(item, "SubCategoryID", "subCategoryID", "subCategoryId");
            return {
              value: String(sid),
              label: String(sid),
              categoryId: getItemField(item, "CategoryID", "categoryID", "categoryId"),
            };
          }).filter((o) => o.value !== "")
        );
        setMetalTypeOptions(idOnlyOptions(data.JewMetalType ?? data.jewMetalType, "MetalID"));
        setColorOptions(idOnlyOptions(data.JewColor ?? data.jewColor, "JewColorID"));
        const basis = data.DecimalinInvoiceAmount ?? data.decimalinInvoiceAmount ?? "";
        if (basis) {
          setCalcBasis(String(basis) === "GrossWeight" ? "GrossWeight" : "NetWeight");
        }
        setOtherPer(data.OtherPer ?? data.otherPer ?? "0");
        setAskingPer(data.AskingPer ?? data.askingPer ?? "0");
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          toast.error("Failed to load mounting stock dropdowns.");
        }
      }
    };

    loadAddMountingDropdowns();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (id) {
      loadMountingStockDetail(id);
    }
  }, [id]);

  const [initialMountingLoaded, setInitialMountingLoaded] = useState(false);
  const [savedMountingName, setSavedMountingName] = useState("");
  const showMountingSection = jewCategory === "Finished Jewellery" || jewCategory === "Semi Jewellery";
  const showDetailsSection = jewCategory !== "Mounting" && jewCategory !== "Metal";

  // MVC: option value = ID, text = Name
  useEffect(() => {
    if (!showMountingSection || !jewCategory) {
      setMountOpts([]);
      if (initialMountingLoaded) setUseMounting("");
      return;
    }
    getMountingStockDropdown(jewCategory, "edit")
      .then((response) => {
        const { success, data } = unwrapApiResponse(response);
        const arr = success && Array.isArray(data) ? data : (response?.data ?? response);
        if (Array.isArray(arr)) {
          setMountOpts(
            arr.map((item) => {
              const name = getItemField(item, "Name", "name", "TextName", "textName");
              const mid = getItemField(item, "ID", "id", "Id");
              return {
                value: String(mid || name),
                label: String(name || mid),
              };
            }).filter((o) => o.value !== "")
          );
        }
      })
      .catch(() => { });
  }, [jewCategory, showMountingSection]);

  // Restore Use Mounting selection after options load (MVC LoadMountingStock + SavedMountingId / SavedMounting)
  useEffect(() => {
    if (!mountOpts.length) return;

    // Already bound to a valid option value (JewCode ID)
    if (useMounting && mountOpts.some((o) => String(o.value) === String(useMounting))) {
      return;
    }

    const candidates = [useMounting, savedMountingName].filter(
      (v) => v != null && String(v).trim() !== "" && String(v) !== "Use Mounting"
    );

    for (const candidate of candidates) {
      const match = mountOpts.find(
        (o) =>
          String(o.value) === String(candidate) ||
          o.label === candidate ||
          String(o.label).toLowerCase() === String(candidate).toLowerCase()
      );
      if (match) {
        setUseMounting(String(match.value));
        if (!savedMountingName || savedMountingName === "Use Mounting") {
          setSavedMountingName(match.label);
        }
        return;
      }
    }
  }, [mountOpts, savedMountingName, useMounting]);

  // Options + selected value for react-select (match by ID or saved name like MVC)
  const mountingSelectOptions = useMemo(() => {
    const opts = [...mountOpts];
    const label =
      savedMountingName && savedMountingName !== "Use Mounting" ? savedMountingName : "";
    const val = useMounting || label;
    if (
      val &&
      !opts.some(
        (o) =>
          String(o.value) === String(val) ||
          (label && o.label === label) ||
          o.label === val
      )
    ) {
      opts.unshift({ value: String(val), label: label || String(val) });
    }
    return opts;
  }, [mountOpts, useMounting, savedMountingName]);

  const mountingSelectValue = useMemo(() => {
    if (!useMounting && !(savedMountingName && savedMountingName !== "Use Mounting")) {
      return null;
    }
    return (
      mountingSelectOptions.find((o) => String(o.value) === String(useMounting)) ||
      mountingSelectOptions.find(
        (o) =>
          o.label === savedMountingName ||
          o.label === useMounting ||
          String(o.value) === String(savedMountingName)
      ) ||
      null
    );
  }, [mountingSelectOptions, useMounting, savedMountingName]);

  // MVC: Use Mounting change → get-all-Mounting-details fill
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
          ? floorPurityRatio(data.pureRatio ?? data.PureRatio)
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
      const loadedMaking = data.makingCharges ?? data.MakingCharges ?? "";
      setMakingCharges(loadedMaking);
      setOriginalMakingCharges(String(loadedMaking || "0"));
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
      const loadedFinal = data.finalAmount ?? data.FinalAmount ?? "";
      setFinalAmount(loadedFinal);
      setCostAmount(data.costamount ?? data.CostAmount ?? data.costAmount ?? loadedFinal);
      setDiamondAmount(data.totalDiamondAmount ?? data.TotalDiamondAmount ?? "");
      setImagePath(data.imagePath || data.ImagePath || "");
      setVideoPath(data.videoPath || data.VideoPath || "");
      setCertPath(data.certPath || data.CertPath || "");
      setDescription(data.description || data.Description || "");
      setCertNo(data.jewelleryCerNo || data.JewelleryCerNo || "");
      setTotalPcs(data.pcs ?? data.Pcs ?? "");
      const loadedAsking = data.askingRate ?? data.AskingRate ?? "";
      const askingPct = parseFloat(askingPer) || 0;
      const expectedAsking =
        parseFloat(loadedFinal) +
        Math.round(parseFloat(loadedFinal) * askingPct * 100) / 100;
      if (loadedAsking && parseFloat(loadedAsking).toFixed(2) !== expectedAsking.toFixed(2)) {
        setIsManualAskingRate(true);
        setAskingRate(String(loadedAsking));
      } else {
        setIsManualAskingRate(false);
        setAskingRate(String(loadedAsking || ""));
      }
      setDiamondQty(String(data.totalDiamondQty ?? data.TotalDiamondQty ?? ""));
      setStoneAmount(data.totalStoneAmount ?? data.TotalStoneAmount ?? "");
      setStoneQty(String(data.totalStoneQty ?? data.TotalStoneQty ?? ""));

      if (data.metalType || data.MetalType) {
        loadPurity(data.metalType || data.MetalType);
      }

      const rows = mapDiamondListToRows(diamondList);
      setTableRows((prev) => [...prev, ...rows]);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching mounting details.");
    }
  }, [askingPer]);

  const handleUseMountingChange = (selectedId) => {
    setUseMounting(selectedId);
    const label =
      mountingSelectOptions.find((o) => String(o.value) === String(selectedId))?.label || "";
    setSavedMountingName(label);
    applyMountingDetail(selectedId);
  };

  const subCategoryOptionsForCategory = useMemo(() => {
    if (!category) return subCategoryOptions;
    const filtered = subCategoryOptions.filter((o) => {
      const parent = o.categoryId ?? o.CategoryID ?? o.parentId;
      return parent === undefined || String(parent) === String(category);
    });
    return filtered.length ? filtered : subCategoryOptions;
  }, [category, subCategoryOptions]);

  const loadMountingStockDetail = async (jewCode) => {
    setLoading(true);
    try {
      const response = await getMountingStockDetail(jewCode);
      const success = response?.success ?? response?.Success ?? response?.data?.Success ?? response?.data?.success;
      if (success || response?.Data || response?.data) {
        const data =
          response?.Data ??
          response?.data?.Data ??
          response?.data?.StockData ??
          response?.data ??
          {};
        const diamondList =
          response?.DiamondList ??
          response?.diamondList ??
          response?.data?.DiamondList ??
          response?.data?.diamondList ??
          [];

        // Populate form fields
        setTrnDate(data.trnDate || data.TrnDate || "");
        setStockID(data.stock_ID || data.Stock_ID || "");
        setJewCategory(data.mountCategory || data.MountCategory || "");
        setCategory(data.category || data.Category || "");
        setSubCategory(data.subCategory || data.SubCategory || "");
        setJewSize(data.jewSize || data.JewSize || "");
        setJewCert(data.jewelleryCertificate || data.JewelleryCertificate || "");
        setCertNo(data.jewelleryCerNo || data.JewelleryCerNo || "");
        setDescription(data.description || data.Description || "");
        setTotalPcs(data.pcs || data.Pcs || "");
        setMetal(data.metalType || data.MetalType || "");
        setColor(data.color || data.Color || "");
        setMetalPurity(data.purity || data.Purity || "");
        setPurityRatio(data.pureRatio || data.PureRatio || "");
        setGrossWeight(data.grossWeight || data.GrossWeight || "");
        setNetWeight(data.netWeight || data.NetWeight || "");
        setMetalPricePerGm(data.metalPriceGm || data.MetalPriceGm || "");
        setMetalAmount(data.totalMetalAmount || data.TotalMetalAmount || "");
        setDiamondAmount(data.totalDiamondAmount || data.TotalDiamondAmount || "");
        setMakingType(data.makingType || data.MakingType || "");
        setMakingRate(data.makingRate || data.MakingRate || "");
        const initMaking = data.makingCharges || data.MakingCharges || "";
        setMakingCharges(initMaking);
        setOriginalMakingCharges(String(initMaking || "0"));
        setSettingCharges(data.settingCharges || data.SettingCharges || "0.00");
        setHandlingCarat(data.handlingCarat || data.HandlingCarat || "");
        setHandlingCharges(data.handlingChargesPerCarat || data.HandlingChargesPerCarat || "");
        setHandlingAmount(data.totalHandlingCharges || data.TotalHandlingCharges || "");
        setCertificateCharges(data.totalCertificateCharges || data.TotalCertificateCharges || "");
        setOtherCharges(data.otherCharges || data.OtherCharges || "");
        setHallmarkCharges(data.hallmarkCharges || data.HallmarkCharges || "");
        setTotalMakingCharges(data.totalMakingCharges || data.TotalMakingCharges || "");
        const initFinal = data.finalAmount || data.FinalAmount || "";
        setFinalAmount(initFinal);
        setCostAmount(data.costamount ?? data.CostAmount ?? data.costAmount ?? initFinal);
        const initAsking = data.askingRate || data.AskingRate || "";
        const initAskingPct = parseFloat(askingPer) || 0;
        const initExpectedAsking =
          parseFloat(initFinal) +
          Math.round(parseFloat(initFinal) * initAskingPct * 100) / 100;
        if (initAsking && parseFloat(initAsking).toFixed(2) !== initExpectedAsking.toFixed(2)) {
          setIsManualAskingRate(true);
          setAskingRate(String(initAsking));
        } else {
          setIsManualAskingRate(false);
          setAskingRate(String(initAsking || ""));
        }
        setImagePath(data.imagePath || data.ImagePath || "");
        setVideoPath(data.videoPath || data.VideoPath || "");
        setCertPath(data.certPath || data.CertPath || "");
        setImageBinary(data.imageBinary || data.ImageBinary || null);
        const mountName = data.useMounting || data.UseMounting || "";
        const mountId = data.useMountingId || data.UseMountingId || "";
        // MVC hidden fields: SavedMounting / SavedMountingId — name is what SP stores in UseMounting
        const normalizedName =
          mountName && mountName !== "Use Mounting" ? mountName : "";
        setSavedMountingName(normalizedName);
        setUseMounting(mountId || normalizedName || "");
        setDiamondQty(String(data.totalDiamondQty ?? data.TotalDiamondQty ?? ""));
        setStoneQty(String(data.totalStoneQty ?? data.TotalStoneQty ?? ""));
        setStoneAmount(data.totalStoneAmount ?? data.TotalStoneAmount ?? "");
        setInitialMountingLoaded(true);

        // Populate table rows from diamond list
        setTableRows(mapDiamondListToRows(diamondList));

        // Load purity based on metal type
        if (data.metalType || data.MetalType) {
          loadPurity(data.metalType || data.MetalType);
        }
      } else {
        toast.error(response?.message || response?.Message || response?.data?.Message || "Failed to load mounting stock details");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load mounting stock details");
    } finally {
      setLoading(false);
    }
  };

  const loadPurity = async (metalType) => {
    try {
      const response = await getJewPurity(metalType);
      const { success, data } = unwrapApiResponse(response);
      if (success) {
        setPurityOptions(idOnlyOptions(data, "MetalPurityID"));
      } else {
        setPurityOptions([]);
      }
    } catch (error) {
      console.error("Failed to load purity:", error);
    }
  };

  const loadRatio = async (metalType, metalPurity) => {
    try {
      const response = await getPureRatio(metalType, metalPurity);
      const resVal = response.data ?? response;
      const ratio = (resVal && typeof resVal === "object")
        ? (resVal.ratio ?? resVal.Ratio ?? resVal.PureRatio ?? resVal.pureRatio ?? "")
        : resVal;
      setPurityRatio(floorPurityRatio(ratio));
    } catch (error) {
      console.error("Failed to load ratio:", error);
    }
  };

  const handleMetalChange = (value) => {
    setMetal(value);
    setMetalPurity("");
    setPurityRatio("");
    if (value) loadPurity(value);
  };

  const handlePurityChange = (value) => {
    setMetalPurity(value);
    if (metal && value) loadRatio(metal, value);
  };

  // ─── Auto-calcs (aligned with MVC JewDesign.js + Add page) ───
  const totalCarat = useMemo(
    () => tableRows.reduce((s, r) => s + (parseFloat(r.carats) || 0), 0),
    [tableRows]
  );

  useEffect(() => {
    const gw = parseFloat(grossWeight) || 0;
    if (gw !== 0) {
      const lessWeight = totalCarat / 5; // 5 carats = 1 gram
      setNetWeight((gw - lessWeight).toFixed(3));
    } else {
      setNetWeight(gw.toFixed(3));
    }
  }, [grossWeight, totalCarat]);

  useEffect(() => {
    const pp = parseFloat(metalPricePerGm) || 0;
    const gw = parseFloat(grossWeight) || 0;
    const nw = parseFloat(netWeight) || 0;
    const ratio = parseFloat(purityRatio) || 0;
    const ma = calcBasis === "GrossWeight" ? pp * gw : pp * ratio * nw;
    setMetalAmount(ma.toFixed(2));
  }, [calcBasis, metalPricePerGm, grossWeight, netWeight, purityRatio]);

  useEffect(() => {
    const mc = computeMakingCharges(makingType, makingRate, grossWeight);
    const val = mc.toFixed(2);
    setOriginalMakingCharges(val);
    setMakingCharges(val);
  }, [makingType, makingRate, grossWeight]);

  useEffect(() => {
    const hc = parseFloat(handlingCarat) || 0;
    const hch = parseFloat(handlingCharges) || 0;
    setHandlingAmount((hc * hch).toFixed(2));
  }, [handlingCarat, handlingCharges]);

  useEffect(() => {
    const totals = computeChargeTotals({
      metalAmount,
      originalMakingCharges,
      handlingAmount,
      certificateCharges,
      hallmarkCharges,
      settingCharges,
      diamondAmount,
      stoneAmount,
      otherPer,
      askingPer,
      isManualAskingRate,
      currentAskingRate: askingRate,
    });
    setCostAmount(totals.costAmount);
    setOtherCharges(totals.otherCharges);
    setTotalMakingCharges(totals.totalMakingCharges);
    setFinalAmount(totals.finalAmount);
    if (!isManualAskingRate) {
      setAskingRate(totals.askingRate);
    }
  }, [
    metalAmount, originalMakingCharges, handlingAmount, certificateCharges,
    hallmarkCharges, settingCharges, diamondAmount, stoneAmount, otherPer,
    askingPer, isManualAskingRate,
  ]);

  useEffect(() => {
    const summary = summarizeTableRows(tableRows);
    setDiamondAmount(summary.diamondAmount);
    setDiamondQty(summary.diamondQty);
    setStoneAmount(summary.stoneAmount);
    setStoneQty(summary.stoneQty);
  }, [tableRows]);

  useEffect(() => {
    const c = parseFloat(carats) || 0;
    const r = parseFloat(rate) || 0;
    setAmount((c * r).toFixed(2));
  }, [carats, rate]);

  const handleOtherChargesChange = (value) => {
    setOtherCharges(value);
    const cost = parseFloat(costAmount) || 0;
    const other = parseFloat(value) || 0;
    const finalCost = Math.round((cost + other) * 100) / 100;
    setFinalAmount(finalCost.toFixed(2));
    if (!isManualAskingRate) {
      const askingPct = parseFloat(askingPer) || 0;
      const autoAsking = finalCost + Math.round(finalCost * askingPct * 100) / 100;
      setAskingRate(autoAsking.toFixed(2));
    }
  };

  // ─── Lot No autocomplete ───
  const debounceRef = useRef(null);
  const searchLots = useCallback((term) => {
    clearTimeout(debounceRef.current);

    if (!elementType) {
      setLotOptions([]);
      return;
    }

    if (!term || term.trim().length < 1) {
      setLotOptions([]);
      return;
    }

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

  useEffect(() => { setLotNo(""); setLotOptions([]); }, [elementType]);

  const handleLotSelect = async (selectedLotNo, text) => {
    setLotNo(selectedLotNo);
    setLotSearch(text || selectedLotNo);
    setLotOptions([]);
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
            ? formatCarat(item.BalanceCarats3Dec)
            : (item.balanceCarats3Dec != null ? formatCarat(item.balanceCarats3Dec) : "")
        );
        setRate(
          item.Rate != null
            ? formatPrice(item.Rate)
            : (item.rate != null ? formatPrice(item.rate) : "")
        );
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
    setShape(""); setSize(""); setSieve(""); setStoneColor(""); setClarity("");
    setPcs(""); setCarats(""); setRate(""); setAmount(""); setLab("");
    setEditingRowId(null);
  };

  const addItem = () => {
    if (!elementType || !pcs || !carats) {
      toast.error("Element Type, Pcs and Carat are required.");
      return;
    }
    const row = {
      id: editingRowId ?? Date.now(),
      stockID: lotNo,
      stoneType: elementType,
      shape, size, sieve,
      color: stoneColor, clarity,
      pcs: parseInt(pcs) || 0,
      carats: formatCarat(carats),
      rate: formatPrice(rate),
      amount: formatAmount(amount),
      lab
    };
    if (editingRowId !== null) {
      setTableRows((p) => p.map((r) => r.id === editingRowId ? row : r));
    } else {
      setTableRows((p) => [...p, row]);
    }
    clearEntryForm();
  };

  const removeRow = (id) => {
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
    setCarats(formatCarat(row.carats || 0));
    setRate(formatPrice(row.rate || 0));
    setAmount(formatAmount(row.amount || 0));
    setLab(row.lab || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    let currentErrors = {};
    if (!trnDate) currentErrors.trnDate = true;
    if (!stockID) currentErrors.stockID = true;
    if (!jewCategory) currentErrors.jewCategory = true;
    
    setErrors(currentErrors);

    if (Object.keys(currentErrors).length > 0) {
      toast.error(t("Please fill all required fields"));
      return;
    }
    setSubmitLoading(true);
    try {
      // MVC: all Mounting-diamond-details rows → DiamondDetails
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
      const useMountingName = selectedMount?.label || savedMountingName || useMounting || "";

      const payload = {
        Model: {
          JewCode: parseInt(id) || 0,
          Stock_ID: stockID,
          DesignID: "",
          DesignName: description,
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
          ImageBinary: imageBinary,
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
          TotalStoneCarat: parseFloat(totalStnCarat) || 0,
          costamount: costAmount || finalAmount || "0"
        },
        Diamond: diamond,
        Setting: setting,
        ActionType: "update"
      };

      const response = await saveMountingStock(payload);
      if (response.success || response.Success) {
        toast.success(response.message || response.Message || "Mounting stock updated successfully!");
        navigate("/master/jewelleryM-stock-list", { state: { successMessage: "Mounting stock updated successfully!" } });
      } else {
        toast.error(response.message || response.Message || "Failed to update mounting stock.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.Message || "Failed to update mounting stock.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (id) {
      try {
        const response = await deleteMountingStock(id);
        if (response.success || response.Success) {
          toast.success(response.message || response.Message || "Mounting stock deleted successfully!");
          navigate("/master/jewelleryM-stock-list");
        } else {
          toast.error(response.message || response.Message || "Failed to delete mounting stock.");
        }
      } catch (error) {
        toast.error("Failed to delete mounting stock.");
      }
    }
  };

  const normalizeDropdown = (arr) => {
    return (Array.isArray(arr) ? arr : []).map((item) => {
      if (typeof item === "string") {
        return { value: item, label: item };
      }

      const value =
        item?.MetalID ?? item?.metalID ?? item?.metalId ??
        item?.JewColorID ?? item?.jewColorID ?? item?.jewColorId ??
        item?.CategoryID ?? item?.categoryID ?? item?.categoryId ??
        item?.SubCategoryID ?? item?.subCategoryID ?? item?.subCategoryId ??
        item?.MetalPurityID ?? item?.metalPurityID ?? item?.metalPurityId ??
        item?.id ?? item?.ID ?? item?.Id ??
        item?.value ?? item?.Value ??
        item?.code ?? item?.Code ?? "";

      const label =
        item?.MetalName ?? item?.metalName ??
        item?.JewColorName ?? item?.jewColorName ??
        item?.CategoryName ?? item?.categoryName ??
        item?.SubCategoryName ?? item?.subCategoryName ??
        item?.MetalPurityID ?? item?.metalPurityID ?? item?.metalPurityId ??
        item?.textName ??
        item?.name ?? item?.Name ??
        item?.label ?? item?.Label ??
        item?.text ?? item?.Text ?? String(value);

      const ratio =
        item?.Ratio ?? item?.ratio ?? item?.PurityRatio ?? item?.purityRatio ?? item?.PureRatio ?? item?.pureRatio ?? null;

      return { value, label, ratio };
    });
  };

  const inputCls = "form-control form-control-sm";
  const selectCls = "form-select form-select-sm";
  const roCls = "form-control form-control-sm custom-readonly-input";
  const tabBtnClass = (active) => `btn btn-sm ${active ? "btn-primary" : "btn-light"}`;

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center my-5">
            <Spinner color="primary" />
            <p className="mt-2">Loading...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb
            title={isView ? t("View Jewellery Stock") : t("Edit Mounting Stock")}
            pageTitle={t("Stock & Account")}
          />

          <Card className="shadow-lg border-0 rounded-3 overflow-hidden mb-3">
            <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
              <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary d-flex align-items-center gap-2">
                <i className={`${isView ? "ri-eye-line" : "ri-edit-line"} fs-20 text-primary`}></i>
                {isView ? t("View Jewellery Stock") : t("Edit Mounting Stock")}
              </h5>
              <div className="d-flex gap-2">
                <Button
                  color="light"
                  onClick={() => navigate(-1)}
                  className="rounded-3 d-inline-flex align-items-center gap-1"
                >
                  <i className="ri-arrow-left-line align-bottom"></i> {t("Back")}
                </Button>
                {!readOnly && (
                  <>
                    <Button
                      color="danger"
                      onClick={() => setDeleteModal(true)}
                      className="rounded-3 d-inline-flex align-items-center gap-1"
                    >
                      <i className="ri-delete-bin-line align-bottom"></i> {t("Delete")}
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
                        <><i className="ri-save-line align-bottom"></i> {t("Update")}</>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
          </Card>

          <fieldset disabled={readOnly} className="border-0 m-0 p-0" style={{ minWidth: 0 }}>
          <Row className="mb-3 align-items-stretch">
            {/* ── COL 1 : Stock Details / Image ── */}
            <Col xl={4} lg={4} md={4} className="d-flex flex-column mb-3 mb-md-0">
              <Card className="flex-grow-1 mb-0">
                <CardBody>
                  <div className="d-flex justify-content-center mb-3 gap-1">
                    <button type="button" className={tabBtnClass(leftTab === "stock")} onClick={() => setLeftTab("stock")}>
                      <i className="ri-bar-chart-line me-1"></i>Stock Details
                    </button>
                    <button type="button" className={tabBtnClass(leftTab === "image")} onClick={() => setLeftTab("image")}>
                      <i className="ri-image-line me-1"></i>Image
                    </button>
                  </div>

                  {leftTab === "stock" && (
                    <>
                      <FieldRow label="Date">
                        <>
                          <input type="date"
                            className={`${inputCls} ${errors.trnDate ? "is-invalid" : ""}`}
                            value={trnDate}
                            onChange={(e) => {
                              setTrnDate(e.target.value);
                              if (e.target.value) setErrors((prev) => ({ ...prev, trnDate: false }));
                            }}
                            onBlur={() => {
                              if (!trnDate) setErrors((prev) => ({ ...prev, trnDate: true }));
                            }}
                          />
                          {errors.trnDate && <div className="invalid-feedback d-block">{t("Date is required")}</div>}
                        </>
                      </FieldRow>
                      <FieldRow label="Stock ID">
                        <>
                          <input type="text"
                            className={`${roCls} text-end ${errors.stockID ? "is-invalid" : ""}`}
                            value={stockID}
                            readOnly
                          />
                          {errors.stockID && <div className="invalid-feedback d-block">{t("Stock ID is required")}</div>}
                        </>
                      </FieldRow>
                      <FieldRow label="Jewellery Category">
                        <>
                          <select
                            className={`${selectCls} ${errors.jewCategory ? "is-invalid" : ""}`}
                            value={jewCategory}
                            onChange={(e) => {
                              setJewCategory(e.target.value);
                              if (e.target.value) setErrors((prev) => ({ ...prev, jewCategory: false }));
                            }}
                            onBlur={() => {
                              if (!jewCategory) setErrors((prev) => ({ ...prev, jewCategory: true }));
                            }}
                          >
                            <option value="">Select Jewellery Category</option>
                            <option value="Finished Jewellery">Finished Jewellery</option>
                            <option value="Semi Jewellery">Semi Jewellery</option>
                            <option value="Mounting">Mounting</option>
                            <option value="Metal">Metal</option>
                          </select>
                          {errors.jewCategory && <div className="invalid-feedback d-block">{t("Jewellery Category is required")}</div>}
                        </>
                      </FieldRow>
                      {showMountingSection && (
                        <FieldRow label="Use Mounting">
                          {/* MVC Select2 (#UseMounting): searchable dropdown; show saved name on edit */}
                          <Select
                            classNamePrefix="react-select"
                            placeholder="Select Lot No"
                            isClearable
                            isSearchable
                            options={mountingSelectOptions}
                            value={mountingSelectValue}
                            onChange={(selected) => handleUseMountingChange(selected ? selected.value : "")}
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: 31,
                                fontSize: 13,
                              }),
                              menu: (base) => ({ ...base, zIndex: 20, fontSize: 13 }),
                              option: (base) => ({ ...base, fontSize: 13 }),
                              input: (base) => ({ ...base, margin: 0, padding: 0 }),
                              valueContainer: (base) => ({ ...base, padding: "0 8px" }),
                              indicatorsContainer: (base) => ({ ...base, height: 29 }),
                            }}
                          />
                        </FieldRow>
                      )}
                      <FieldRow label="Category">
                        <select className={selectCls} value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory(""); }}>
                          <option value="">Select Category</option>
                          {categoryOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </FieldRow>
                      <FieldRow label="Sub Category">
                        <select className={selectCls} value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                          <option value="">Select Sub Category</option>
                          {subCategoryOptionsForCategory.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </FieldRow>
                      <FieldRow label="Jewellery Size">
                        <input type="text" className={inputCls} value={jewSize} onChange={(e) => setJewSize(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Certificate">
                        <select className={selectCls} value={jewCert} onChange={(e) => setJewCert(e.target.value)}>
                          <option value="">Select Certificate</option>
                          <option value="IGI">IGI</option>
                          <option value="GIA">GIA</option>
                        </select>
                      </FieldRow>
                      <FieldRow label="Certificate No">
                        <input type="text" className={inputCls} value={certNo} onChange={(e) => setCertNo(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Description">
                        <input type="text" className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Pcs">
                        <input type="text" className={`${inputCls} text-end`} placeholder="Pcs"
                          value={totalPcs} onChange={(e) => setTotalPcs(e.target.value)} />
                      </FieldRow>
                    </>
                  )}

                  {leftTab === "image" && (
                    <JewStockMediaPreview
                      imagePath={imagePath}
                      videoPath={videoPath}
                      certPath={certPath}
                      imageBinary={imageBinary}
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
                    <button type="button" className={tabBtnClass(midTab === "metal")} onClick={() => setMidTab("metal")}>
                      <i className="ri-settings-3-line me-1"></i>Metal Details
                    </button>
                    <button type="button" className={tabBtnClass(midTab === "images")} onClick={() => setMidTab("images")}>
                      <i className="ri-folder-image-line me-1"></i>Images Details
                    </button>
                  </div>

                  {midTab === "metal" && (
                    <>
                      <FieldRow label="Metal Type">
                        <select className={selectCls} value={metal} onChange={(e) => handleMetalChange(e.target.value)}>
                          <option value="">Select Metal Type</option>
                          {metalTypeOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </FieldRow>
                      <FieldRow label="Color">
                        <select className={selectCls} value={color} onChange={(e) => setColor(e.target.value)}>
                          <option value="">Select Color</option>
                          {colorOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </FieldRow>
                      <FieldRow label="Purity">
                        <select className={selectCls} value={metalPurity} onChange={(e) => handlePurityChange(e.target.value)}>
                          <option value="">Select Metal Purity</option>
                          {purityOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </FieldRow>
                      <FieldRow label="Purity Ratio">
                        <input type="text" className={roCls} value={purityRatio} readOnly />
                      </FieldRow>
                      <FieldRow label="Gross Weight">
                        <input type="text" className={`${inputCls} text-end`} value={grossWeight} onChange={(e) => setGrossWeight(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Net Weight">
                        <input type="text" className={`${roCls} text-end`} value={netWeight} readOnly />
                      </FieldRow>
                      <FieldRow label="Metal Price/Gm">
                        <input type="text" className={`${inputCls} text-end`} value={metalPricePerGm} onChange={(e) => setMetalPricePerGm(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Metal Amount">
                        <input type="text" className={`${roCls} text-end`} value={metalAmount} readOnly />
                      </FieldRow>
                      <FieldRow label="Diamond">
                        <div className="d-flex gap-1">
                          <input type="text" className={`${roCls} text-end`} style={{ flex: 1 }} value={diamondAmount} readOnly />
                          <input type="text" className={`${roCls} text-end`} style={{ width: 60 }} value={diamondQty} readOnly />
                        </div>
                      </FieldRow>
                      <FieldRow label="Stone">
                        <div className="d-flex gap-1">
                          <input type="text" className={`${roCls} text-end`} style={{ flex: 1 }} value={stoneAmount} readOnly />
                          <input type="text" className={`${roCls} text-end`} style={{ width: 60 }} value={stoneQty} readOnly />
                        </div>
                      </FieldRow>
                    </>
                  )}

                  {midTab === "images" && (
                    <>
                      <FieldRow label="Image Path" wide>
                        <input type="text" className={inputCls} placeholder="Image Path"
                          value={imagePath} onChange={(e) => setImagePath(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Video Path" wide>
                        <input type="text" className={inputCls} placeholder="Video Path"
                          value={videoPath} onChange={(e) => setVideoPath(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Cert Path" wide>
                        <input type="text" className={inputCls} placeholder="Cert Path"
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
                  <h6 className="fw-semibold text-primary mb-3">Charges Details</h6>
                  <FieldRow label="Making Type">
                    <div className="d-flex gap-1">
                      <select className={selectCls} style={{ flex: 1 }} value={makingType} onChange={(e) => setMakingType(e.target.value)}>
                        <option value="">Select Making Type</option>
                        {MAKING_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <input type="number" className={`${inputCls} text-end`} style={{ width: 80 }} value={makingRate} onChange={(e) => setMakingRate(e.target.value)} />
                    </div>
                  </FieldRow>
                  <FieldRow label="Making Charges">
                    <input type="number" className={`${roCls} text-end`} value={makingCharges} readOnly />
                  </FieldRow>
                  <FieldRow label="Setting Charges">
                    <input type="number" className={`${roCls} text-end`} value={settingCharges} readOnly />
                  </FieldRow>
                  <FieldRow label="Handling Carat">
                    <div className="d-flex gap-1">
                      <input type="number" className={`${inputCls} text-end`} style={{ flex: 1 }} value={handlingCarat} onChange={(e) => setHandlingCarat(e.target.value)} />
                      <input type="number" className={`${inputCls} text-end`} style={{ width: 80 }} value={handlingCharges} onChange={(e) => setHandlingCharges(e.target.value)} />
                    </div>
                  </FieldRow>
                  <FieldRow label="Handling Amount">
                    <input type="number" className={`${roCls} text-end`} value={handlingAmount} readOnly />
                  </FieldRow>
                  <FieldRow label="Certificate Charges">
                    <input type="number" className={`${inputCls} text-end`} value={certificateCharges} onChange={(e) => setCertificateCharges(e.target.value)} />
                  </FieldRow>
                  <FieldRow label="Hallmark Charges">
                    <input type="number" className={`${inputCls} text-end`} value={hallmarkCharges} onChange={(e) => setHallmarkCharges(e.target.value)} />
                  </FieldRow>
                  <FieldRow label="Total Making Charges">
                    <input type="number" className={`${roCls} text-end`} value={totalMakingCharges} readOnly />
                  </FieldRow>
                  <FieldRow label="Cost Amount">
                    <input type="number" className={`${roCls} text-end`} value={costAmount} readOnly />
                  </FieldRow>
                  <FieldRow label="Other Charges">
                    <input type="number" className={`${inputCls} text-end`} value={otherCharges}
                      onChange={(e) => handleOtherChargesChange(e.target.value)} />
                  </FieldRow>
                  <FieldRow label="Final Cost Amount">
                    <input type="number" className={`${roCls} text-end`} value={finalAmount} readOnly />
                  </FieldRow>
                  <FieldRow label="Asking Rate">
                    <input type="text" className={`${inputCls} text-end`} value={askingRate}
                      onChange={(e) => { setIsManualAskingRate(true); setAskingRate(e.target.value); }} />
                  </FieldRow>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {showDetailsSection && (
            <>
              {/* ── Entry Form Row ── */}
              <Row className="mb-3">
                <Col lg={12}>
                  <Card className="border shadow-none mb-0">
                    <CardBody className="p-3">
                      <h6 style={{ fontWeight: 600, color: "#5A8DEE", marginBottom: 12, fontSize: 13 }}>
                        Add Diamond / Gem Stone Detail
                      </h6>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
                        {/* Element Type */}
                        <div style={{ flex: "1 1 130px", minWidth: 130 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Element Type</label>
                          <select className={selectCls} value={elementType} onChange={(e) => setElementType(e.target.value)}>
                            <option value="">Select Type</option>
                            <option value="Natural Diamond">Natural Diamond</option>
                            <option value="Lab Grown Diamond">Lab Grown Diamond</option>
                            <option value="Gem Stone">Gem Stone</option>
                          </select>
                        </div>

                        {/* Lot No autocomplete */}
                        <div style={{ flex: "2 1 200px", minWidth: 200, position: "relative" }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                            Lot No
                          </label>
                          <input type="text" className={inputCls} placeholder="Search Lot No…"
                            value={lotSearch}
                            onChange={(e) => { setLotSearch(e.target.value); searchLots(e.target.value); }} />
                          {lotOptions.length > 0 && (
                            <div
                              className="dropdown-menu show position-absolute w-100 shadow-sm"
                              style={{ zIndex: 200, maxHeight: 160, overflowY: "auto" }}
                            >
                              {lotOptions.map((o, idx) => (
                                <div
                                  key={`${o.id}-${idx}`}
                                  className="dropdown-item"
                                  role="button"
                                  onMouseDown={() => handleLotSelect(o.id, o.text)}
                                >
                                  {o.text}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Shape */}
                        <div style={{ flex: "1 1 100px", minWidth: 100 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Shape</label>
                          <select className={selectCls} value={shape} onChange={(e) => setShape(e.target.value)}>
                            <option value="">Shape</option>
                            {shapeOptions.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Size */}
                        <div style={{ flex: "1 1 100px", minWidth: 100 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Size</label>
                          <select className={selectCls} value={size} onChange={(e) => setSize(e.target.value)}>
                            <option value="">Size</option>
                            {sizeOptions.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Sieve */}
                        <div style={{ flex: "1 1 100px", minWidth: 100 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Sieve</label>
                          <select className={selectCls} value={sieve} onChange={(e) => setSieve(e.target.value)}>
                            <option value="">Sieve</option>
                            {sieveOptions.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Color */}
                        <div style={{ flex: "1 1 100px", minWidth: 100 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Color</label>
                          <select className={selectCls} value={stoneColor} onChange={(e) => setStoneColor(e.target.value)}>
                            <option value="">Color</option>
                            {stoneColorOptions.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Clarity */}
                        <div style={{ flex: "1 1 100px", minWidth: 100 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Clarity</label>
                          <select className={selectCls} value={clarity} onChange={(e) => setClarity(e.target.value)}>
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
                            <input type="text"
                              className={`${ro ? roCls : inputCls} text-end`}
                              placeholder={lbl} value={val} readOnly={ro}
                              onChange={ro ? undefined : (e) => setter(e.target.value)} />
                          </div>
                        ))}

                        {/* Lab — MVC: text input #JewLab */}
                        <div style={{ flex: "1 1 80px", minWidth: 80 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Lab</label>
                          <input type="text" className={inputCls} placeholder="Lab"
                            value={lab} onChange={(e) => setLab(e.target.value)} />
                        </div>

                        {/* Add button */}
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
                                row.color, row.clarity, row.pcs,
                                formatCarat(row.carats), formatPrice(row.rate),
                                formatAmount(row.amount), row.lab
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
          </fieldset>
        </Container>
      </div>
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)}
      />
    </React.Fragment>
  );
}

