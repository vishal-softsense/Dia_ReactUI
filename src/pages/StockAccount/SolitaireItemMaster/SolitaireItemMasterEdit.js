import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, FormGroup, Label, Input, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import Select from "react-select";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { getSolitaireItemMasterDropdowns, checkSolitaireLotNoExists, getSolitaireItemMasterDetail, updateSolitaireItemMaster } from "../../../helpers/fakebackend_helper";
import { toast, ToastContainer } from 'react-toastify';

const SolitaireItemMasterEdit = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const query = new URLSearchParams(window.location.search);
    const itemCode = query.get("id");

    const [activeTab, setActiveTab] = useState("1");
    const [submitting, setSubmitting] = useState(false);
    const [lotNoExists, setLotNoExists] = useState(false);
    const [loading, setLoading] = useState(true);

    const [dropdowns, setDropdowns] = useState({
        shape: [],
        color: [],
        size: [],
        clarity: [],
        sieve: [],
        category: [],
        productType: [],
        lab: [],
        cps: [],
        ha: [],
        proportion: [],
        polish: [],
        symmetry: [],
        fluorescence: [],
        flColor: [],
        brown: [],
        green: [],
        milky: [],
        luster: [],
        natts: [],
        shade: [],
        rough: [],
        mines: []
    });

    const [form, setForm] = useState({
        singlePcs: 1,
        stoneTypes: "Single",
        itemCode: 0,
        lotNo: "",
        itemName: "",
        itemGroupID: "",
        category: "",
        productType: "",
        pcs: 1,
        weight: "",
        sieveId: "",
        shapeId: "",
        colorId: "",
        fancyColor: "",
        fancyColorIntensity: "",
        fancyColorOvertone: "",
        sizeId: "",
        clarityId: "",
        mrp: "",
        back: "",
        askingRate: "",
        askingAmount: "",
        boxName: "",
        boxRate: "",
        lab: "",
        certificateNo: "",
        ha: "",
        haId: "",
        proportion: "",
        propId: "",
        polish: "",
        polishId: "",
        symmetry: "",
        symId: "",
        cut: "",
        fluorescence: "",
        flId: "",
        flColor: "",
        length: "",
        width: "",
        depth: "",
        diameter: "",
        measurement: "",
        lwRatio: "",
        totalDepthPer: "",
        tablePer: "",
        crownHeight: "",
        crownAngle: "",
        pavilionHeight: "",
        pavilionDepth: "",
        pavilionPer: "",
        girdlePer: "",
        girdleCondition: "",
        girdleMinPer: "",
        girdleMaxPer: "",
        girdleMinMM: "",
        girdleMaxMM: "",
        culet: "",
        culetCondition: "",
        strLn: "",
        starLn: "",
        lrHalf: "",
        laserInscribed: false,
        laserInscriptionText: "",
        instruction: "",
        keyToSymbols: "",
        labComments: "",
        memberComments: "",
        brown: "",
        brownId: "",
        green: "",
        greenId: "",
        milky: "",
        milkyId: "",
        luster: "",
        lusterId: "",
        buth: "",
        buthId: "",
        natts: "",
        nattsId: "",
        eyeClean: "",
        shade: "",
        shadeId: "",
        bit: "",
        bis: "",
        oit: "",
        ois: "",
        oip: "",
        oig: "",
        polishFeatures: "",
        symmetryFeatures: "",
        colorDescription: "",
        clarityDescription: "",
        clarityStatus: "",
        graining: "",
        painting: "",
        idealImagePath: "",
        assetImagePath: "",
        heartsImagePath: "",
        arrowsImagePath: "",
        imagePath: "",
        videoPath: "",
        b2bDnaPage: "",
        b2cDnaPage: "",
        certificatePath: "",
        plottingImagePath: "",
        purchaseDate: new Date().toISOString().substr(0, 10),
        rateReviseDate: new Date().toISOString().substr(0, 10),
        newArrivalDate: new Date().toISOString().substr(0, 10),
        stoneLastUnholdDate: new Date().toISOString().substr(0, 10),
        publicCommnets: "",
        privateCommnets: "",
        adminCommnets: "",
        purchaseBack: "",
        purchaseRate: "",
        purchaseAmount: "",
        sellerBack: "",
        sellerRate: "",
        sellerAmount: "",
        bottomBack: "",
        bottomRate: "",
        b2bBack: "",
        b2bRate: "",
        b2cBack: "",
        b2cRate: "",
        mfgSeriesID: "",
        mfgPacketID: "",
        roughID: "",
        minesID: "",
        inStatus: "",
        currrentStatus: "",
        hold: "",
        city: "",
        state: "",
        country: ""
    });

    useEffect(() => {
        if (!itemCode) {
            toast.error("Invalid Solitaire Item ID");
            navigate("/item/list-item");
            return;
        }
        initPage();
    }, [itemCode]);

    const initPage = async () => {
        setLoading(true);
        await loadDropdowns();
        await loadDetail();
        setLoading(false);
    };

    const loadDetail = async () => {
        try {
            const response = await getSolitaireItemMasterDetail(itemCode);
            if (response.success || response.Success) {
                const data = response.data || response.Data || {};
                setForm({
                    singlePcs: data.singlePcs ?? data.SinglePcs ?? 1,
                    stoneTypes: data.stoneTypes ?? data.StoneTypes ?? "Single",
                    itemCode: data.itemCode ?? data.ItemCode ?? 0,
                    lotNo: data.lotNo ?? data.LotNo ?? "",
                    itemName: data.itemName ?? data.ItemName ?? "",
                    itemGroupID: data.itemGroupID ?? data.ItemGroupID ?? "",
                    category: data.category ?? data.Category ?? "",
                    productType: data.productType ?? data.ProductType ?? "",
                    pcs: data.pcs ?? data.Pcs ?? 1,
                    weight: data.weight ?? data.Weight ?? "",
                    sieveId: data.sieveId ?? data.SieveId ?? "",
                    shapeId: data.shapeId ?? data.ShapeId ?? "",
                    colorId: data.colorId ?? data.ColorId ?? "",
                    fancyColor: data.fancyColor ?? data.FancyColor ?? "",
                    fancyColorIntensity: data.fancyColorIntensity ?? data.FancyColorIntensity ?? "",
                    fancyColorOvertone: data.fancyColorOvertone ?? data.FancyColorOvertone ?? "",
                    sizeId: data.sizeId ?? data.SizeId ?? "",
                    clarityId: data.clarityId ?? data.ClarityId ?? "",
                    mrp: data.mrp ?? data.MRP ?? "",
                    back: data.back ?? data.Back ?? "",
                    askingRate: data.askingRate ?? data.AskingRate ?? "",
                    askingAmount: data.askingAmount ?? data.AskingAmount ?? "",
                    boxName: data.boxName ?? data.BoxName ?? "",
                    boxRate: data.boxRate ?? data.BoxRate ?? "",
                    lab: data.certId ?? data.CertId ?? data.lab ?? data.LAB ?? "",
                    certificateNo: data.certificateNo ?? data.CertificateNo ?? "",
                    ha: data.haId ?? data.HAID ?? data.ha ?? data.HA ?? "",
                    haId: data.haId ?? data.HAID ?? "",
                    proportion: data.propId ?? data.PropId ?? data.proportion ?? data.Proportion ?? "",
                    propId: data.propId ?? data.PropId ?? "",
                    polish: data.polishId ?? data.PolishId ?? data.polish ?? data.Polish ?? "",
                    polishId: data.polishId ?? data.PolishId ?? "",
                    symmetry: data.symId ?? data.SymId ?? data.symmetry ?? data.Symmetry ?? "",
                    symId: data.symId ?? data.SymId ?? "",
                    cut: data.cut ?? data.Cut ?? "",
                    fluorescence: data.flId ?? data.FLId ?? data.fluorescence ?? data.Fluorescence ?? "",
                    flId: data.flId ?? data.FLId ?? "",
                    flColor: data.flColor ?? data.FlColor ?? "",
                    length: data.length ?? data.Length ?? "",
                    width: data.width ?? data.Width ?? "",
                    depth: data.depth ?? data.Depth ?? "",
                    diameter: data.diameter ?? data.Diameter ?? "",
                    measurement: data.measurement ?? data.Measurement ?? "",
                    lwRatio: data.lwRatio ?? data.LWRatio ?? "",
                    totalDepthPer: data.totalDepthPer ?? data.TotalDepthPer ?? "",
                    tablePer: data.tablePer ?? data.TablePer ?? "",
                    crownHeight: data.crownHeight ?? data.CrownHeight ?? "",
                    crownAngle: data.crownAngle ?? data.CrownAngle ?? "",
                    pavilionHeight: data.pavilionHeight ?? data.PavilionHeight ?? "",
                    pavilionDepth: data.pavilionDepth ?? data.PavilionDepth ?? "",
                    pavilionPer: data.pavilionPer ?? data.PavilionPer ?? "",
                    girdlePer: data.girdlePer ?? data.GirdlePer ?? "",
                    girdleCondition: data.girdleCondition ?? data.GirdleCondition ?? "",
                    girdleMinPer: data.girdleMin ?? data.GirdleMin ?? data.girdleMinPer ?? data.GirdleMinPer ?? "",
                    girdleMaxPer: data.girdleMax ?? data.GirdleMax ?? data.girdleMaxPer ?? data.GirdleMaxPer ?? "",
                    girdleMinMM: data.girdleMinMS ?? data.GirdleMinMS ?? data.girdleMinMM ?? data.GirdleMinMM ?? "",
                    girdleMaxMM: data.girdleMaxMS ?? data.GirdleMaxMS ?? data.girdleMaxMM ?? data.GirdleMaxMM ?? "",
                    culet: data.culetId ?? data.CuletId ?? data.culet ?? data.Culet ?? "",
                    culetCondition: data.culetCondition ?? data.CuletCondition ?? "",
                    strLn: data.strLn ?? data.StrLn ?? "",
                    starLn: data.strLn ?? data.StrLn ?? "",
                    lrHalf: data.lrHalf ?? data.LrHalf ?? "",
                    laserInscribed: data.laserInscribed ?? data.LaserInscribed ?? false,
                    laserInscriptionText: data.laserInscriptionText ?? data.LaserInscriptionText ?? "",
                    instruction: data.instruction ?? data.Instruction ?? "",
                    keyToSymbols: data.keyToSymbols ?? data.KeyToSymbols ?? "",
                    labComments: data.labComments ?? data.LABComments ?? "",
                    memberComments: data.memberComments ?? data.MemberComments ?? "",
                    brown: data.brownId ?? data.BrownId ?? data.brown ?? data.Brown ?? "",
                    brownId: data.brownId ?? data.BrownId ?? "",
                    green: data.greenId ?? data.GreenId ?? data.green ?? data.Green ?? "",
                    greenId: data.greenId ?? data.GreenId ?? "",
                    milky: data.milkyId ?? data.MilkyId ?? data.milky ?? data.Milky ?? "",
                    milkyId: data.milkyId ?? data.MilkyId ?? "",
                    luster: data.lusterId ?? data.LusterId ?? data.luster ?? data.Luster ?? "",
                    lusterId: data.lusterId ?? data.LusterId ?? "",
                    buth: data.buthId ?? data.ButhId ?? data.buth ?? data.Buth ?? "",
                    buthId: data.buthId ?? data.ButhId ?? "",
                    natts: data.nattsId ?? data.NattsId ?? data.natts ?? data.Natts ?? "",
                    nattsId: data.nattsId ?? data.NattsId ?? "",
                    eyeClean: data.eyeClean ?? data.EyeClean ?? "",
                    shade: data.shadeId ?? data.ShadeId ?? data.shade ?? data.Shade ?? "",
                    shadeId: data.shadeId ?? data.ShadeId ?? "",
                    bit: data.tableInclusion ?? data.TableInclusion ?? data.bit ?? data.BIT ?? "",
                    bis: data.crownInclusion ?? data.CrownInclusion ?? data.bis ?? data.BIS ?? "",
                    oit: data.oit ?? data.OIT ?? "",
                    ois: data.oic ?? data.OIC ?? data.ois ?? data.OIS ?? "",
                    oip: data.oip ?? data.OIP ?? "",
                    oig: data.oig ?? data.OIG ?? "",
                    polishFeatures: data.polishFeatures ?? data.PolishFeatures ?? "",
                    symmetryFeatures: data.symmetryFeatures ?? data.SymmetryFeatures ?? "",
                    colorDescription: data.colorDescription ?? data.ColorDescription ?? "",
                    clarityDescription: data.clarityDescription ?? data.ClarityDescription ?? "",
                    clarityStatus: data.clarityStatus ?? data.ClarityStatus ?? "",
                    graining: data.graining ?? data.Graining ?? "",
                    painting: data.painting ?? data.Painting ?? "",
                    idealImagePath: data.idealImagePath ?? data.IdealImagePath ?? "",
                    assetImagePath: data.assetImagePath ?? data.AssetImagePath ?? "",
                    heartsImagePath: data.heartsImagePath ?? data.HeartsImagePath ?? "",
                    arrowsImagePath: data.arrowsImagePath ?? data.ArrowsImagePath ?? "",
                    imagePath: data.imagePath ?? data.ImagePath ?? "",
                    videoPath: data.videoPath ?? data.VideoPath ?? "",
                    b2bDnaPage: data.b2bDnaPage ?? data.B2BDNAPage ?? "",
                    b2cDnaPage: data.b2cDnaPage ?? data.B2CDNAPage ?? "",
                    certificatePath: data.certificatePath ?? data.CertificatePath ?? "",
                    plottingImagePath: data.plottingImagePath ?? data.PlottingImagePath ?? "",
                    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString().substr(0, 10) : new Date().toISOString().substr(0, 10),
                    rateReviseDate: data.rateReviseDate ? new Date(data.rateReviseDate).toISOString().substr(0, 10) : new Date().toISOString().substr(0, 10),
                    newArrivalDate: data.newArrivalDate ? new Date(data.newArrivalDate).toISOString().substr(0, 10) : new Date().toISOString().substr(0, 10),
                    stoneLastUnholdDate: data.stoneLastUnholdDate ? new Date(data.stoneLastUnholdDate).toISOString().substr(0, 10) : new Date().toISOString().substr(0, 10),
                    publicCommnets: data.publicCommnets ?? data.PublicCommnets ?? "",
                    privateCommnets: data.privateCommnets ?? data.PrivateCommnets ?? "",
                    adminCommnets: data.adminCommnets ?? data.AdminCommnets ?? "",
                    purchaseBack: data.purchaseBack ?? data.PurchaseBack ?? "",
                    purchaseRate: data.purchaseRate ?? data.PurchaseRate ?? "",
                    purchaseAmount: data.purchaseAmount ?? data.PurchaseAmount ?? "",
                    sellerBack: data.actualBack ?? data.ActualBack ?? data.sellerBack ?? data.SellerBack ?? "",
                    sellerRate: data.actualRate ?? data.ActualRate ?? data.sellerRate ?? data.SellerRate ?? "",
                    sellerAmount: data.actualAmount ?? data.ActualAmount ?? data.sellerAmount ?? data.SellerAmount ?? "",
                    bottomBack: data.bottomBack ?? data.BottomBack ?? "",
                    bottomRate: data.bottomRate ?? data.BottomRate ?? "",
                    b2bBack: data.b2bBack ?? data.B2BBack ?? "",
                    b2bRate: data.b2bRate ?? data.B2BRate ?? "",
                    b2cBack: data.b2cBack ?? data.B2CBack ?? "",
                    b2cRate: data.b2cRate ?? data.B2CRate ?? "",
                    mfgSeriesID: data.mfgSeriesID ?? data.MfgSeriesID ?? "",
                    mfgPacketID: data.mfgPacketID ?? data.MfgPacketID ?? "",
                    roughID: data.roughID ?? data.RoughID ?? "",
                    minesID: data.minesID ?? data.MinesID ?? "",
                    inStatus: data.inStatus ?? data.InStatus ?? "",
                    currrentStatus: data.currrentStatus ?? data.CurrrentStatus ?? "",
                    hold: data.hold ?? data.Hold ?? "",
                    city: data.city ?? data.City ?? "",
                    state: data.state ?? data.State ?? "",
                    country: data.country ?? data.Country ?? ""
                });
            } else {
                toast.error("Failed to load solitaire item details");
                navigate("/item/list-item");
            }
        } catch (error) {
            const errMsg = typeof error === 'string' ? error : (error.response?.data?.message || error.response?.data?.Message || "Error loading details");
            toast.error(errMsg);
            navigate("/item/list-item");
        }
    };

    const loadDropdowns = async () => {
        try {
            const response = await getSolitaireItemMasterDropdowns();
            if (response.success || response.Success) {
                const data = response.data || response.Data || {};
                setDropdowns({
                    shape: data.Shape || data.shape || [],
                    color: data.Color || data.color || [],
                    size: data.Size || data.size || [],
                    clarity: data.Clarity || data.clarity || [],
                    sieve: data.Sieve || data.sieve || [],
                    category: data.Category || data.category || [],
                    productType: data.ProductType || data.productType || [],
                    lab: data.LAB || data.lab || [],
                    cps: data.CPS || data.cps || [],
                    ha: data.HA || data.ha || [],
                    proportion: data.Proportion || data.proportion || [],
                    polish: data.Polish || data.polish || [],
                    symmetry: data.Symmetry || data.symmetry || [],
                    fluorescence: data.Fluorescence || data.fluorescence || [],
                    flColor: data.FlColor || data.flColor || [],
                    brown: data.Brown || data.brown || [],
                    green: data.Green || data.green || [],
                    milky: data.Milky || data.milky || [],
                    luster: data.Luster || data.luster || [],
                    natts: data.Natts || data.natts || [],
                    shade: data.Shade || data.shade || [],
                    rough: data.Rough || data.rough || [],
                    mines: data.Mines || data.mines || []
                });
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load dropdowns");
        }
    };

    // Auto-generate ItemName when shape, color, size, clarity change
    useEffect(() => {
        const shapeItem = dropdowns.shape.find(x => x.id === form.shapeId || x.ID === form.shapeId);
        const shapeName = shapeItem?.textName || shapeItem?.name || shapeItem?.id || shapeItem?.ID || "";

        const colorItem = dropdowns.color.find(x => x.id === form.colorId || x.ID === form.colorId);
        const colorName = colorItem?.textName || colorItem?.name || colorItem?.id || colorItem?.ID || "";

        const sizeItem = dropdowns.size.find(x => x.id === form.sizeId || x.ID === form.sizeId);
        const sizeName = sizeItem?.textName || sizeItem?.name || sizeItem?.id || sizeItem?.ID || "";

        const clarityItem = dropdowns.clarity.find(x => x.id === form.clarityId || x.ID === form.clarityId);
        const clarityName = clarityItem?.textName || clarityItem?.name || clarityItem?.id || clarityItem?.ID || "";

        const dynamicName = [shapeName, colorName, sizeName, clarityName].filter(Boolean).join(" ");
        setForm(prev => ({
            ...prev,
            itemName: dynamicName
        }));
    }, [form.shapeId, form.colorId, form.sizeId, form.clarityId, dropdowns]);

    const toggleTab = (tab) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const handleTextChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCheckboxChange = (field, checked) => {
        setForm(prev => ({
            ...prev,
            [field]: checked
        }));
    };

    const handleValueChange = (field, value) => {
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            const getNum = (val) => parseFloat(val) || 0;

            const weightVal = getNum(updated.weight);
            const mrpVal = getNum(updated.mrp);

            // When weight changes, recalculate all amounts based on their current rates.
            // Rates are not automatically recalculated when MRP changes to avoid populating fields automatically.
            if (field === "weight") {
                updated.askingAmount = getNum(updated.askingRate) * weightVal;
                updated.purchaseAmount = getNum(updated.purchaseRate) * weightVal;
                updated.sellerAmount = getNum(updated.sellerRate) * weightVal;
            }

            // Calculations based on type change: back vs rate
            // Asking Rate / Back / Amount
            if (field === "back") {
                const typedBack = getNum(value);
                updated.askingRate = mrpVal + ((mrpVal * typedBack) / 100);
                updated.askingAmount = updated.askingRate * weightVal;
            }
            if (field === "askingRate") {
                const typedRate = getNum(value);
                updated.back = mrpVal ? ((typedRate - mrpVal) / mrpVal) * 100 : 0;
                updated.askingAmount = typedRate * weightVal;
            }
            if (field === "askingAmount") {
                const typedAA = getNum(value);
                updated.askingRate = weightVal ? (typedAA / weightVal) : 0;
                updated.back = mrpVal ? ((updated.askingRate - mrpVal) / mrpVal) * 100 : 0;
            }

            // Purchase Rate / Back / Amount
            if (field === "purchaseBack") {
                const typedPB = getNum(value);
                updated.purchaseRate = mrpVal + ((mrpVal * typedPB) / 100);
                updated.purchaseAmount = updated.purchaseRate * weightVal;
            }
            if (field === "purchaseRate") {
                const typedPR = getNum(value);
                updated.purchaseBack = mrpVal ? ((typedPR - mrpVal) / mrpVal) * 100 : 0;
                updated.purchaseAmount = typedPR * weightVal;
            }
            if (field === "purchaseAmount") {
                const typedPA = getNum(value);
                updated.purchaseRate = weightVal ? (typedPA / weightVal) : 0;
                updated.purchaseBack = mrpVal ? ((updated.purchaseRate - mrpVal) / mrpVal) * 100 : 0;
            }

            // Seller Rate / Back / Amount
            if (field === "sellerBack") {
                const typedSB = getNum(value);
                updated.sellerRate = mrpVal + ((mrpVal * typedSB) / 100);
                updated.sellerAmount = updated.sellerRate * weightVal;
            }
            if (field === "sellerRate") {
                const typedSR = getNum(value);
                updated.sellerBack = mrpVal ? ((typedSR - mrpVal) / mrpVal) * 100 : 0;
                updated.sellerAmount = typedSR * weightVal;
            }
            if (field === "sellerAmount") {
                const typedSA = getNum(value);
                updated.sellerRate = weightVal ? (typedSA / weightVal) : 0;
                updated.sellerBack = mrpVal ? ((updated.sellerRate - mrpVal) / mrpVal) * 100 : 0;
            }

            // B2B Rate / Back
            if (field === "b2bBack") {
                const typedB2BB = getNum(value);
                updated.b2bRate = mrpVal + ((mrpVal * typedB2BB) / 100);
            }
            if (field === "b2bRate") {
                const typedB2BR = getNum(value);
                updated.b2bBack = mrpVal ? ((typedB2BR - mrpVal) / mrpVal) * 100 : 0;
            }

            // B2C Rate / Back
            if (field === "b2cBack") {
                const typedB2CB = getNum(value);
                updated.b2cRate = mrpVal + ((mrpVal * typedB2CB) / 100);
            }
            if (field === "b2cRate") {
                const typedB2CR = getNum(value);
                updated.b2cBack = mrpVal ? ((typedB2CR - mrpVal) / mrpVal) * 100 : 0;
            }

            // Bottom Rate / Back
            if (field === "bottomBack") {
                const typedBottomB = getNum(value);
                updated.bottomRate = mrpVal + ((mrpVal * typedBottomB) / 100);
            }
            if (field === "bottomRate") {
                const typedBottomR = getNum(value);
                updated.bottomBack = mrpVal ? ((typedBottomR - mrpVal) / mrpVal) * 100 : 0;
            }

            return updated;
        });
    };

    const handleLotNoBlur = async () => {
        if (!form.lotNo.trim()) return;
        try {
            const response = await checkSolitaireLotNoExists(form.lotNo.trim());
            if (response.success || response.Success) {
                const exists = response.exists || response.Exists || false;
                setLotNoExists(exists);
                if (exists) {
                    toast.warning(t("LotNo Already Exists"));
                }
            }
        } catch (error) {
            console.error("Error checking LotNo existence", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.lotNo.trim()) {
            toast.error("Please enter Item ID/LotNo");
            toggleTab("1");
            return;
        }
        if (!form.category) {
            toast.error("Please select Category");
            toggleTab("1");
            return;
        }
        if (!form.productType) {
            toast.error("Please select Product Type");
            toggleTab("1");
            return;
        }

        setSubmitting(true);
        try {
            const getNum = (val) => parseFloat(val) || 0;
            const payload = {
                ...form,
                weight: getNum(form.weight),
                mrp: getNum(form.mrp),
                back: getNum(form.back),
                askingRate: getNum(form.askingRate),
                askingAmount: getNum(form.askingAmount),
                boxRate: getNum(form.boxRate),
                length: getNum(form.length),
                width: getNum(form.width),
                depth: getNum(form.depth),
                totalDepthPer: getNum(form.totalDepthPer),
                tablePer: getNum(form.tablePer),
                crownHeight: getNum(form.crownHeight),
                crownAngle: getNum(form.crownAngle),
                pavilionHeight: getNum(form.pavilionHeight),
                pavilionDepth: getNum(form.pavilionDepth),
                pavilionPer: getNum(form.pavilionPer),
                girdlePer: getNum(form.girdlePer),
                girdleMinPer: getNum(form.girdleMinPer),
                girdleMaxPer: getNum(form.girdleMaxPer),
                girdleMinMM: getNum(form.girdleMinMM),
                girdleMaxMM: getNum(form.girdleMaxMM),
                strLn: getNum(form.starLn),
                lrHalf: getNum(form.lrHalf),
                purchaseBack: getNum(form.purchaseBack),
                purchaseRate: getNum(form.purchaseRate),
                purchaseAmount: getNum(form.purchaseAmount),
                sellerBack: getNum(form.sellerBack),
                sellerRate: getNum(form.sellerRate),
                sellerAmount: getNum(form.sellerAmount),
                actualBack: getNum(form.sellerBack),
                actualRate: getNum(form.sellerRate),
                actualAmount: getNum(form.sellerAmount),
                bottomBack: getNum(form.bottomBack),
                bottomRate: getNum(form.bottomRate),
                b2bBack: getNum(form.b2bBack),
                b2bRate: getNum(form.b2bRate),
                b2cBack: getNum(form.b2cBack),
                b2cRate: getNum(form.b2cRate),
                tableInclusion: form.bit,
                crownInclusion: form.bis,
                oic: form.ois,
                culetId: form.culet,
                girdleMin: form.girdleMinPer,
                girdleMax: form.girdleMaxPer,
                girdleMinMS: form.girdleMinMM,
                girdleMaxMS: form.girdleMaxMM
            };
            const response = await updateSolitaireItemMaster(itemCode, payload);
            if (response.success || response.Success) {
                navigate("/item/list-item", { state: { successMessage: response.message || response.Message || "Solitaire Item updated successfully." } });
            } else {
                toast.error(response.message || response.Message || "Failed to update Solitaire Item");
            }
        } catch (error) {
            const errMsg = typeof error === 'string' ? error : (error.response?.data?.message || error.response?.data?.Message || "An error occurred while updating");
            toast.error(errMsg);
        }
        setSubmitting(false);
    };

    const selectOptions = (list) => (list || []).map(item => ({
        value: item.id || item.ID || item.name || item.Name,
        label: item.name || item.Name || item.textName || item.text || item.id || item.ID
    }));

    document.title = `${t("Edit Solitaire Item Master")} | ${t("Admin")}`;

    if (loading) {
        return (
            <div className="page-content">
                <Container fluid>
                    <div className="text-center my-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Edit Solitaire Item Master")} pageTitle={t("Stock & Account")} />

                    <form onSubmit={handleSubmit}>
                        <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                            <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
                                <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary">{t("Solitaire Item Details")}</h5>
                                <div className="d-flex gap-2">
                                    <Button color="light" type="button" onClick={() => navigate("/item/list-item")}>{t("Cancel")}</Button>
                                    <Button color="primary" type="submit" disabled={submitting}>
                                        {submitting ? t("Saving...") : t("Save")}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardBody className="p-4">
                                <Nav tabs className="nav-tabs-custom nav-success mb-4" role="tablist">
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === "1" })}
                                            onClick={() => toggleTab("1")}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <i className="ri-grid-fill me-1"></i> {t("Item Details")}
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === "2" })}
                                            onClick={() => toggleTab("2")}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <i className="ri-medal-line me-1"></i> {t("Grading Details")}
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === "3" })}
                                            onClick={() => toggleTab("3")}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <i className="ri-list-settings-line me-1"></i> {t("Extra Parameters")}
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === "4" })}
                                            onClick={() => toggleTab("4")}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <i className="ri-image-line me-1"></i> {t("Media Paths")}
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === "5" })}
                                            onClick={() => toggleTab("5")}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <i className="ri-admin-line me-1"></i> {t("Admin Details")}
                                        </NavLink>
                                    </NavItem>
                                </Nav>

                                <TabContent activeTab={activeTab}>
                                    {/* TAB 1: Item Details */}
                                    <TabPane tabId="1">
                                        <Row className="g-3">
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Item ID/LotNo")} <span className="text-danger">*</span></Label>
                                                    <Input
                                                        type="text"
                                                        className={`form-control ${lotNoExists ? 'is-invalid' : ''}`}
                                                        placeholder={t("Enter Item ID/LotNo")}
                                                        value={form.lotNo}
                                                        onChange={(e) => handleTextChange("lotNo", e.target.value)}
                                                        onBlur={handleLotNoBlur}
                                                        required
                                                    />
                                                    {lotNoExists && <div className="invalid-feedback">{t("LotNo Already Exists")}</div>}
                                                </FormGroup>
                                            </Col>

                                            <Col md={2}>
                                                <FormGroup>
                                                    <Label>{t("Single/Parcel")}</Label>
                                                    <Input type="text" value={form.stoneTypes} disabled className="bg-light" />
                                                </FormGroup>
                                            </Col>

                                            <Col md={2}>
                                                <FormGroup>
                                                    <Label>{t("Shape")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.shape).find(opt => opt.value == form.shapeId) || null}
                                                        onChange={(selected) => handleTextChange("shapeId", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.shape)}
                                                        placeholder={t("Select Shape")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={2}>
                                                <FormGroup>
                                                    <Label>{t("Color")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.color).find(opt => opt.value == form.colorId) || null}
                                                        onChange={(selected) => handleTextChange("colorId", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.color)}
                                                        placeholder={t("Select Color")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Clarity")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.clarity).find(opt => opt.value == form.clarityId) || null}
                                                        onChange={(selected) => handleTextChange("clarityId", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.clarity)}
                                                        placeholder={t("Select Clarity")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Fancy Color")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Fancy Color")}
                                                        value={form.fancyColor}
                                                        onChange={(e) => handleTextChange("fancyColor", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Fancy Color Intensity")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Fancy Color Intensity")}
                                                        value={form.fancyColorIntensity}
                                                        onChange={(e) => handleTextChange("fancyColorIntensity", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Fancy Color Overtone")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Fancy Color Overtone")}
                                                        value={form.fancyColorOvertone}
                                                        onChange={(e) => handleTextChange("fancyColorOvertone", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Size")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.size).find(opt => opt.value == form.sizeId) || null}
                                                        onChange={(selected) => handleTextChange("sizeId", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.size)}
                                                        placeholder={t("Select Size")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Item Name")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Item Name")}
                                                        value={form.itemName}
                                                        onChange={(e) => handleTextChange("itemName", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Item GroupID")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Item GroupID")}
                                                        value={form.itemGroupID}
                                                        onChange={(e) => handleTextChange("itemGroupID", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Sieve")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.sieve).find(opt => opt.value == form.sieveId) || null}
                                                        onChange={(selected) => handleTextChange("sieveId", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.sieve)}
                                                        placeholder={t("Select Sieve")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Stone Type")} <span className="text-danger">*</span></Label>
                                                    <select
                                                        className="form-select"
                                                        value={form.category}
                                                        onChange={(e) => handleTextChange("category", e.target.value)}
                                                        required
                                                    >
                                                        <option value="">{t("Select Category")}</option>
                                                        {dropdowns.category.map((item, idx) => (
                                                            <option key={idx} value={item.id || item.ID}>
                                                                {item.name || item.Name || item.textName || item.id}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Grown/Process Type")} <span className="text-danger">*</span></Label>
                                                    <select
                                                        className="form-select"
                                                        value={form.productType}
                                                        onChange={(e) => handleTextChange("productType", e.target.value)}
                                                        required
                                                    >
                                                        <option value="">{t("Select Product Type")}</option>
                                                        {dropdowns.productType.map((item, idx) => (
                                                            <option key={idx} value={item.id || item.ID}>
                                                                {item.name || item.Name || item.textName || item.id}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Pcs")}</Label>
                                                    <Input
                                                        type="number"
                                                        value={form.pcs}
                                                        onChange={(e) => handleValueChange("pcs", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Opening Weight")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.weight}
                                                        onChange={(e) => handleValueChange("weight", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("MRP")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.mrp}
                                                        onChange={(e) => handleValueChange("mrp", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Back %")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.back}
                                                        onChange={(e) => handleValueChange("back", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Asking Rate")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.askingRate}
                                                        onChange={(e) => handleValueChange("askingRate", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Asking Amount")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.askingAmount}
                                                        onChange={(e) => handleValueChange("askingAmount", e.target.value)}
                                                        className="text-end"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Box ID")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Box ID")}
                                                        value={form.boxName}
                                                        onChange={(e) => handleTextChange("boxName", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Box Rate")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.boxRate}
                                                        onChange={(e) => handleValueChange("boxRate", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    {/* TAB 2: Grading Details */}
                                    <TabPane tabId="2">
                                        <Row className="g-3">
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("LAB")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.lab).find(opt => opt.value == form.lab) || null}
                                                        onChange={(selected) => handleTextChange("lab", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.lab)}
                                                        placeholder={t("Select LAB")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Certificate No")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Certificate No")}
                                                        value={form.certificateNo}
                                                        onChange={(e) => handleTextChange("certificateNo", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Proportion")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.proportion).find(opt => opt.value == form.proportion) || null}
                                                        onChange={(selected) => {
                                                            const val = selected ? selected.value : "";
                                                            setForm(prev => ({ ...prev, proportion: val, propId: val }));
                                                        }}
                                                        options={selectOptions(dropdowns.proportion)}
                                                        placeholder={t("Select Proportion")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Polish")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.polish).find(opt => opt.value == form.polish) || null}
                                                        onChange={(selected) => {
                                                            const val = selected ? selected.value : "";
                                                            setForm(prev => ({ ...prev, polish: val, polishId: val }));
                                                        }}
                                                        options={selectOptions(dropdowns.polish)}
                                                        placeholder={t("Select Polish")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Symmetry")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.symmetry).find(opt => opt.value == form.symmetry) || null}
                                                        onChange={(selected) => {
                                                            const val = selected ? selected.value : "";
                                                            setForm(prev => ({ ...prev, symmetry: val, symId: val }));
                                                        }}
                                                        options={selectOptions(dropdowns.symmetry)}
                                                        placeholder={t("Select Symmetry")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("CPS")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.cps).find(opt => opt.value == form.cut) || null}
                                                        onChange={(selected) => handleTextChange("cut", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.cps)}
                                                        placeholder={t("Select CPS")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Hearts & Arrows")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.ha).find(opt => opt.value == form.ha) || null}
                                                        onChange={(selected) => {
                                                            const val = selected ? selected.value : "";
                                                            setForm(prev => ({ ...prev, ha: val, haId: val }));
                                                        }}
                                                        options={selectOptions(dropdowns.ha)}
                                                        placeholder={t("Select Hearts & Arrows")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Fluorescence")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.fluorescence).find(opt => opt.value == form.fluorescence) || null}
                                                        onChange={(selected) => {
                                                            const val = selected ? selected.value : "";
                                                            setForm(prev => ({ ...prev, fluorescence: val, flId: val }));
                                                        }}
                                                        options={selectOptions(dropdowns.fluorescence)}
                                                        placeholder={t("Select Fluorescence")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Fluo. Color")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.flColor).find(opt => opt.value == form.flColor) || null}
                                                        onChange={(selected) => handleTextChange("flColor", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.flColor)}
                                                        placeholder={t("Select Fluo. Color")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Length")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.length}
                                                        onChange={(e) => handleValueChange("length", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Width")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.width}
                                                        onChange={(e) => handleValueChange("width", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Depth")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.depth}
                                                        onChange={(e) => handleValueChange("depth", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Diameter")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Diameter")}
                                                        value={form.diameter}
                                                        onChange={(e) => handleTextChange("diameter", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Measurement")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Measurement")}
                                                        value={form.measurement}
                                                        onChange={(e) => handleTextChange("measurement", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("L:W Ratio")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("L:W Ratio")}
                                                        value={form.lwRatio}
                                                        onChange={(e) => handleTextChange("lwRatio", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Total Depth %")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.totalDepthPer}
                                                        onChange={(e) => handleValueChange("totalDepthPer", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Table %")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.tablePer}
                                                        onChange={(e) => handleValueChange("tablePer", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Crown Height %")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.crownHeight}
                                                        onChange={(e) => handleValueChange("crownHeight", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Crown Angle")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.crownAngle}
                                                        onChange={(e) => handleValueChange("crownAngle", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Pavilion Depth %")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.pavilionDepth}
                                                        onChange={(e) => handleValueChange("pavilionDepth", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Pavilion Height")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.pavilionHeight}
                                                        onChange={(e) => handleValueChange("pavilionHeight", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Pavilion Angle")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.pavilionPer}
                                                        onChange={(e) => handleValueChange("pavilionPer", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Girdle %")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.girdlePer}
                                                        onChange={(e) => handleValueChange("girdlePer", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Girdle Condition")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Girdle Condition")}
                                                        value={form.girdleCondition}
                                                        onChange={(e) => handleTextChange("girdleCondition", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Girdle Minimum %")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.girdleMinPer}
                                                        onChange={(e) => handleValueChange("girdleMinPer", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Girdle Maximum %")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.girdleMaxPer}
                                                        onChange={(e) => handleValueChange("girdleMaxPer", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Girdle Minimum mm")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.girdleMinMM}
                                                        onChange={(e) => handleValueChange("girdleMinMM", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Girdle Maximum mm")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.girdleMaxMM}
                                                        onChange={(e) => handleValueChange("girdleMaxMM", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Culet")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Culet")}
                                                        value={form.culet}
                                                        onChange={(e) => handleTextChange("culet", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Culet Condition")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Culet Condition")}
                                                        value={form.culetCondition}
                                                        onChange={(e) => handleTextChange("culetCondition", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("StarLn")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.starLn}
                                                        onChange={(e) => handleValueChange("starLn", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("LrHalf")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.lrHalf}
                                                        onChange={(e) => handleValueChange("lrHalf", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup className="d-flex align-items-center mt-4">
                                                    <div className="form-check form-switch">
                                                        <Input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            id="laserInscribed"
                                                            checked={form.laserInscribed}
                                                            onChange={(e) => handleCheckboxChange("laserInscribed", e.target.checked)}
                                                        />
                                                        <Label className="form-check-label" htmlFor="laserInscribed">
                                                            {t("Laser Inscribed")}
                                                        </Label>
                                                    </div>
                                                </FormGroup>
                                            </Col>

                                            {form.laserInscribed && (
                                                <Col md={9}>
                                                    <FormGroup>
                                                        <Label>{t("Laser Inscription Text")}</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder={t("Laser Inscription Text")}
                                                            value={form.laserInscriptionText}
                                                            onChange={(e) => handleTextChange("laserInscriptionText", e.target.value)}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                            )}

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Instruction")}</Label>
                                                    <Input
                                                        type="textarea"
                                                        rows="2"
                                                        placeholder={t("Instruction")}
                                                        value={form.instruction}
                                                        onChange={(e) => handleTextChange("instruction", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Key To Symbols")}</Label>
                                                    <Input
                                                        type="textarea"
                                                        rows="2"
                                                        placeholder={t("Key To Symbols")}
                                                        value={form.keyToSymbols}
                                                        onChange={(e) => handleTextChange("keyToSymbols", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("LAB Comments")}</Label>
                                                    <Input
                                                        type="textarea"
                                                        rows="2"
                                                        placeholder={t("LAB Comments")}
                                                        value={form.labComments}
                                                        onChange={(e) => handleTextChange("labComments", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Member Comments")}</Label>
                                                    <Input
                                                        type="textarea"
                                                        rows="2"
                                                        placeholder={t("Member Comments")}
                                                        value={form.memberComments}
                                                        onChange={(e) => handleTextChange("memberComments", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    {/* TAB 3: Extra Parameters */}
                                    <TabPane tabId="3">
                                        <Row className="g-3">
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Brown")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.brown).find(opt => opt.value == form.brown) || null}
                                                        onChange={(selected) => {
                                                            const val = selected ? selected.value : "";
                                                            setForm(prev => ({ ...prev, brown: val, brownId: val }));
                                                        }}
                                                        options={selectOptions(dropdowns.brown)}
                                                        placeholder={t("Select Brown")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Green")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.green).find(opt => opt.value == form.green) || null}
                                                        onChange={(selected) => {
                                                            const val = selected ? selected.value : "";
                                                            setForm(prev => ({ ...prev, green: val, greenId: val }));
                                                        }}
                                                        options={selectOptions(dropdowns.green)}
                                                        placeholder={t("Select Green")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Milky")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.milky).find(opt => opt.value == form.milky) || null}
                                                        onChange={(selected) => {
                                                            const val = selected ? selected.value : "";
                                                            setForm(prev => ({ ...prev, milky: val, milkyId: val }));
                                                        }}
                                                        options={selectOptions(dropdowns.milky)}
                                                        placeholder={t("Select Milky")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Luster")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.luster).find(opt => opt.value == form.luster) || null}
                                                        onChange={(selected) => {
                                                            const val = selected ? selected.value : "";
                                                            setForm(prev => ({ ...prev, luster: val, lusterId: val }));
                                                        }}
                                                        options={selectOptions(dropdowns.luster)}
                                                        placeholder={t("Select Luster")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Buth")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Buth")}
                                                        value={form.buth}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setForm(prev => ({ ...prev, buth: val, buthId: val }));
                                                        }}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Natts")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.natts).find(opt => opt.value == form.natts) || null}
                                                        onChange={(selected) => {
                                                            const val = selected ? selected.value : "";
                                                            setForm(prev => ({ ...prev, natts: val, nattsId: val }));
                                                        }}
                                                        options={selectOptions(dropdowns.natts)}
                                                        placeholder={t("Select Natts")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Eye Clean")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Eye Clean")}
                                                        value={form.eyeClean}
                                                        onChange={(e) => handleTextChange("eyeClean", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Shade")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.shade).find(opt => opt.value == form.shade) || null}
                                                        onChange={(selected) => {
                                                            const val = selected ? selected.value : "";
                                                            setForm(prev => ({ ...prev, shade: val, shadeId: val }));
                                                        }}
                                                        options={selectOptions(dropdowns.shade)}
                                                        placeholder={t("Select Shade")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Black In Table")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Black In Table")}
                                                        value={form.bit}
                                                        onChange={(e) => handleTextChange("bit", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Black In Side")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Black In Side")}
                                                        value={form.bis}
                                                        onChange={(e) => handleTextChange("bis", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Open In Table")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Open In Table")}
                                                        value={form.oit}
                                                        onChange={(e) => handleTextChange("oit", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Open In Side")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Open In Side")}
                                                        value={form.ois}
                                                        onChange={(e) => handleTextChange("ois", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Open In Pavilion")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Open In Pavilion")}
                                                        value={form.oip}
                                                        onChange={(e) => handleTextChange("oip", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Open In Girdle")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Open In Girdle")}
                                                        value={form.oig}
                                                        onChange={(e) => handleTextChange("oig", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Polish Features")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Polish Features")}
                                                        value={form.polishFeatures}
                                                        onChange={(e) => handleTextChange("polishFeatures", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Symmetry Features")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Symmetry Features")}
                                                        value={form.symmetryFeatures}
                                                        onChange={(e) => handleTextChange("symmetryFeatures", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Color Description")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Color Description")}
                                                        value={form.colorDescription}
                                                        onChange={(e) => handleTextChange("colorDescription", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Clarity Description")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Clarity Description")}
                                                        value={form.clarityDescription}
                                                        onChange={(e) => handleTextChange("clarityDescription", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Clarity Status")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Clarity Status")}
                                                        value={form.clarityStatus}
                                                        onChange={(e) => handleTextChange("clarityStatus", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Graining")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Graining")}
                                                        value={form.graining}
                                                        onChange={(e) => handleTextChange("graining", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Painting")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Painting")}
                                                        value={form.painting}
                                                        onChange={(e) => handleTextChange("painting", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    {/* TAB 4: Media Paths */}
                                    <TabPane tabId="4">
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Ideal Image Path")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Ideal Image Path")}
                                                        value={form.idealImagePath}
                                                        onChange={(e) => handleTextChange("idealImagePath", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Asset Image Path")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Asset Image Path")}
                                                        value={form.assetImagePath}
                                                        onChange={(e) => handleTextChange("assetImagePath", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Hearts Image Path")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Hearts Image Path")}
                                                        value={form.heartsImagePath}
                                                        onChange={(e) => handleTextChange("heartsImagePath", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Arrows Image Path")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Arrows Image Path")}
                                                        value={form.arrowsImagePath}
                                                        onChange={(e) => handleTextChange("arrowsImagePath", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Image Path")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Image Path")}
                                                        value={form.imagePath}
                                                        onChange={(e) => handleTextChange("imagePath", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Video Path")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Video Path")}
                                                        value={form.videoPath}
                                                        onChange={(e) => handleTextChange("videoPath", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("B2B DNA Page")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("B2B DNA Page")}
                                                        value={form.b2bDnaPage}
                                                        onChange={(e) => handleTextChange("b2bDnaPage", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("B2C DNA Page")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("B2C DNA Page")}
                                                        value={form.b2cDnaPage}
                                                        onChange={(e) => handleTextChange("b2cDnaPage", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Certificate Path")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Certificate Path")}
                                                        value={form.certificatePath}
                                                        onChange={(e) => handleTextChange("certificatePath", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Plotting Image Path")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Plotting Image Path")}
                                                        value={form.plottingImagePath}
                                                        onChange={(e) => handleTextChange("plottingImagePath", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    {/* TAB 5: Admin Details */}
                                    <TabPane tabId="5">
                                        <Row className="g-3">
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Purchase Date")}</Label>
                                                    <Input
                                                        type="date"
                                                        value={form.purchaseDate}
                                                        onChange={(e) => handleTextChange("purchaseDate", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Rate Revise Date")}</Label>
                                                    <Input
                                                        type="date"
                                                        value={form.rateReviseDate}
                                                        onChange={(e) => handleTextChange("rateReviseDate", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("New Arrival Date")}</Label>
                                                    <Input
                                                        type="date"
                                                        value={form.newArrivalDate}
                                                        onChange={(e) => handleTextChange("newArrivalDate", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Stone Last Unhold Date")}</Label>
                                                    <Input
                                                        type="date"
                                                        value={form.stoneLastUnholdDate}
                                                        onChange={(e) => handleTextChange("stoneLastUnholdDate", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Public Comments")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Public Comments")}
                                                        value={form.publicCommnets}
                                                        onChange={(e) => handleTextChange("publicCommnets", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Private Comments")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Private Comments")}
                                                        value={form.privateCommnets}
                                                        onChange={(e) => handleTextChange("privateCommnets", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Admin Comments")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Admin Comments")}
                                                        value={form.adminCommnets}
                                                        onChange={(e) => handleTextChange("adminCommnets", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-3 text-muted" />

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Purchase Back %")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.purchaseBack}
                                                        onChange={(e) => handleValueChange("purchaseBack", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Purchase Rate")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.purchaseRate}
                                                        onChange={(e) => handleValueChange("purchaseRate", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Purchase Amount")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.purchaseAmount}
                                                        onChange={(e) => handleValueChange("purchaseAmount", e.target.value)}
                                                        className="text-start"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-2 text-muted" />

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Seller Back %")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.sellerBack}
                                                        onChange={(e) => handleValueChange("sellerBack", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Seller Rate")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.sellerRate}
                                                        onChange={(e) => handleValueChange("sellerRate", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Seller Amount")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.sellerAmount}
                                                        onChange={(e) => handleValueChange("sellerAmount", e.target.value)}
                                                        className="text-start"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-2 text-muted" />

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Bottom Back %")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.bottomBack}
                                                        onChange={(e) => handleValueChange("bottomBack", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Bottom Rate")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.bottomRate}
                                                        onChange={(e) => handleValueChange("bottomRate", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-2 text-muted" />

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("B2B Back %")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.b2bBack}
                                                        onChange={(e) => handleValueChange("b2bBack", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("B2B Rate")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.b2bRate}
                                                        onChange={(e) => handleValueChange("b2bRate", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-2 text-muted" />

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("B2C Back %")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.b2cBack}
                                                        onChange={(e) => handleValueChange("b2cBack", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("B2C Rate")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={form.b2cRate}
                                                        onChange={(e) => handleValueChange("b2cRate", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-3 text-muted" />

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Mfg Series ID")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Mfg Series ID")}
                                                        value={form.mfgSeriesID}
                                                        onChange={(e) => handleTextChange("mfgSeriesID", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Mfg Packet ID")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Mfg Packet ID")}
                                                        value={form.mfgPacketID}
                                                        onChange={(e) => handleTextChange("mfgPacketID", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Rough ID")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.rough).find(opt => opt.value == form.roughID) || null}
                                                        onChange={(selected) => handleTextChange("roughID", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.rough)}
                                                        placeholder={t("Select Rough")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Mines ID")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.mines).find(opt => opt.value == form.minesID) || null}
                                                        onChange={(selected) => handleTextChange("minesID", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.mines)}
                                                        placeholder={t("Select Mines")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("InStatus")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("InStatus")}
                                                        value={form.inStatus}
                                                        onChange={(e) => handleTextChange("inStatus", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Current Status")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Current Status")}
                                                        value={form.currrentStatus}
                                                        onChange={(e) => handleTextChange("currrentStatus", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Hold")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Hold")}
                                                        value={form.hold}
                                                        onChange={(e) => handleTextChange("hold", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-3 text-muted" />

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("City")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Enter City")}
                                                        value={form.city}
                                                        onChange={(e) => handleTextChange("city", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("State")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Enter State")}
                                                        value={form.state}
                                                        onChange={(e) => handleTextChange("state", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Country")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Enter Country")}
                                                        value={form.country}
                                                        onChange={(e) => handleTextChange("country", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </TabPane>
                                </TabContent>
                            </CardBody>
                        </Card>
                    </form>
                </Container>
            </div>
            <ToastContainer closeButton={false} limit={1} />
        </React.Fragment>
    );
};

export default SolitaireItemMasterEdit;