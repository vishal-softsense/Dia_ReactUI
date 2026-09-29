import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, FormGroup, Label, Input } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { getParcelItemMasterDropdowns, getParcelItemMasterDetail, updateParcelItemMaster } from "../../../helpers/fakebackend_helper";
import { toast, ToastContainer } from 'react-toastify';
import Select from "react-select";

const ParcelItemMasterEdit = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    // Retrieve ID from Query Parameter
    const query = new URLSearchParams(window.location.search);
    const itemCode = query.get("id");

    const [dropdowns, setDropdowns] = useState({
        shape: [],
        color: [],
        size: [],
        clarity: [],
        sieve: [],
        itemGroup: [],
        category: [],
        productType: []
    });

    const [form, setForm] = useState({
        itemCode: 0,
        srNo: "",
        lotNo: "",
        shapeId: "",
        colorId: "",
        clarityId: "",
        sizeId: "",
        sieveId: "",
        itemName: "",
        itemGroupID: "",
        category: "",
        instruction: "Polished", // StockSubType
        productType: "", // Grown/Process Type
        weight: 0,
        pcs: 0,
        pDollorRate: 0, // BaseRate
        purchaseRate: 0, // Pcostusdcarats
        purchaseAmount: 0, // Pcostusdamt
        masterCurrencyRate: 0, // Pcostinrcarats
        masterCurrencyAmount: 0, // Pcostinramt
        askingRate: 0, // askingusdcarats
        askingAmount: 0, // askingusdamt
        askingINR: 0, // askinginrcarats
        askingINRAmt: 0, // askinginramt
        publicCommnets: "" // Description
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!itemCode) {
            toast.error("Invalid Parcel Item ID");
            navigate("/parcel/list-ParcelItemMaster");
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

    const loadDropdowns = async () => {
        try {
            const response = await getParcelItemMasterDropdowns();
            if (response.success || response.Success) {
                const data = response.data || response.Data || {};
                setDropdowns({
                    shape: data.shape || [],
                    color: data.color || [],
                    size: data.size || [],
                    clarity: data.clarity || [],
                    sieve: data.sieve || [],
                    itemGroup: data.itemGroup || [],
                    category: data.category || [],
                    productType: data.productType || []
                });
            }
        } catch (error) {
            console.error("Error loading dropdowns", error);
        }
    };

    const loadDetail = async () => {
        try {
            const response = await getParcelItemMasterDetail(itemCode);
            if (response.success || response.Success) {
                const data = response.data || response.Data || {};
                const weight = parseFloat(data.weight ?? data.Weight) || 0;
                const pDollorRate = parseFloat(data.pDollorRate ?? data.PDollorRate) || 0;
                const askingRate = parseFloat(data.askingRate ?? data.AskingRate) || 0;
                // Same as MVC Parcel-item-master.js document.ready:
                // Asking INR is not persisted by SP_ItemMaster; recalculate on edit load.
                const askingINR = askingRate * pDollorRate;
                const askingINRAmt = askingINR * weight;
                setForm({
                    itemCode: data.itemCode || data.ItemCode || 0,
                    srNo: data.srNo || data.SrNo || "",
                    lotNo: data.lotNo || data.LotNo || "",
                    shapeId: data.shapeId || data.ShapeId || "",
                    colorId: data.colorId || data.ColorId || "",
                    clarityId: data.clarityId || data.ClarityId || "",
                    sizeId: data.sizeId || data.SizeId || "",
                    sieveId: data.sieveId || data.SieveId || "",
                    itemName: data.itemName || data.ItemName || "",
                    itemGroupID: data.itemGroupID || data.ItemGroupID || "",
                    category: data.category || data.Category || "",
                    instruction: data.instruction || data.Instruction || "Polished",
                    productType: data.productType || data.ProductType || "",
                    weight,
                    pcs: parseInt(data.pcs || data.Pcs) || 0,
                    pDollorRate,
                    purchaseRate: parseFloat(data.purchaseRate ?? data.PurchaseRate) || 0,
                    purchaseAmount: parseFloat(data.purchaseAmount ?? data.PurchaseAmount) || 0,
                    masterCurrencyRate: parseFloat(data.masterCurrencyRate ?? data.MasterCurrencyRate) || 0,
                    masterCurrencyAmount: parseFloat(data.masterCurrencyAmount ?? data.MasterCurrencyAmount) || 0,
                    askingRate,
                    askingAmount: parseFloat(data.askingAmount ?? data.AskingAmount) || (weight * askingRate),
                    askingINR,
                    askingINRAmt,
                    publicCommnets: data.publicCommnets || data.PublicCommnets || ""
                });
            } else {
                toast.error("Failed to load parcel item details");
                navigate("/parcel/list-ParcelItemMaster");
            }
        } catch (error) {
            const errMsg = typeof error === 'string' ? error : (error.response?.data?.message || error.response?.data?.Message || "Error loading parcel item details");
            toast.error(errMsg);
            navigate("/parcel/list-ParcelItemMaster");
        }
    };

    // Calculate ItemName dynamically based on dropdown values
    useEffect(() => {
        if (loading) return; // Wait until loaded to avoid overriding prefilled name
        const shapeItem = dropdowns.shape.find(x => x.id == form.shapeId || x.ID == form.shapeId);
        const shapeName = shapeItem?.textName || shapeItem?.name || shapeItem?.id || shapeItem?.ID || "";

        const colorItem = dropdowns.color.find(x => x.id == form.colorId || x.ID == form.colorId);
        const colorName = colorItem?.textName || colorItem?.name || colorItem?.id || colorItem?.ID || "";

        const sizeItem = dropdowns.size.find(x => x.id == form.sizeId || x.ID == form.sizeId);
        const sizeName = sizeItem?.textName || sizeItem?.name || sizeItem?.id || sizeItem?.ID || "";

        const clarityItem = dropdowns.clarity.find(x => x.id == form.clarityId || x.ID == form.clarityId);
        const clarityName = clarityItem?.textName || clarityItem?.name || clarityItem?.id || clarityItem?.ID || "";

        const dynamicName = [shapeName, colorName, sizeName, clarityName].filter(Boolean).join(" ");
        setForm(prev => ({
            ...prev,
            itemName: dynamicName
        }));
    }, [form.shapeId, form.colorId, form.sizeId, form.clarityId, dropdowns, loading]);

    // Perform calculations when weights, rates, or baseRates change
    const handleValueChange = (field, value) => {
        const val = parseFloat(value) || 0;
        setForm(prev => {
            const updated = { ...prev, [field]: val };
            
            // Purchase calculations
            if (field === "weight" || field === "purchaseRate" || field === "pDollorRate") {
                updated.purchaseAmount = updated.weight * updated.purchaseRate;
                updated.masterCurrencyRate = updated.purchaseRate * updated.pDollorRate;
                updated.masterCurrencyAmount = updated.masterCurrencyRate * updated.weight;
            }
            
            // Asking calculations
            if (field === "weight" || field === "askingRate" || field === "pDollorRate") {
                updated.askingAmount = updated.weight * updated.askingRate;
                updated.askingINR = updated.askingRate * updated.pDollorRate;
                updated.askingINRAmt = updated.askingINR * updated.weight;
            }

            return updated;
        });
    };

    const handleTextChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let currentErrors = {};
        if (!form.lotNo.trim()) currentErrors.lotNo = true;
        
        setErrors(currentErrors);

        if (Object.keys(currentErrors).length > 0) {
            toast.error(t("Please fill all required fields"));
            return;
        }

        setSubmitting(true);
        try {
            const response = await updateParcelItemMaster(form.itemCode, form);
            if (response.success || response.Success) {
                navigate("/parcel/list-ParcelItemMaster", { state: { successMessage: response.message || response.Message || "Parcel Item updated successfully." } });
            } else {
                toast.error(response.message || response.Message || "Failed to update parcel item");
            }
        } catch (error) {
            const errMsg = typeof error === 'string' ? error : (error.response?.data?.message || error.response?.data?.Message || "An error occurred while updating");
            toast.error(errMsg);
        }
        setSubmitting(false);
    };

    // Map dropdown arrays to react-select options
    const shapeOptions = dropdowns.shape.map(item => ({
        value: item.id || item.ID,
        label: item.textName || item.name || item.id || item.ID
    }));
    const colorOptions = dropdowns.color.map(item => ({
        value: item.id || item.ID,
        label: item.textName || item.name || item.id || item.ID
    }));
    const clarityOptions = dropdowns.clarity.map(item => ({
        value: item.id || item.ID,
        label: item.textName || item.name || item.id || item.ID
    }));
    const sizeOptions = dropdowns.size.map(item => ({
        value: item.id || item.ID,
        label: item.textName || item.name || item.id || item.ID
    }));
    const sieveOptions = dropdowns.sieve.map(item => ({
        value: item.id || item.ID,
        label: item.textName || item.name || item.id || item.ID
    }));
    const itemGroupOptions = dropdowns.itemGroup.map(item => ({
        value: item.id || item.ID,
        label: item.textName || item.name || item.id || item.ID
    }));

    document.title = `${t("Edit Parcel Item Master")} | ${t("Admin")}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Edit Parcel Item Master")} pageTitle={t("Stock & Account")} />

                    {loading ? (
                        <div className="text-center my-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <Card>
                                <CardHeader className="d-flex align-items-center">
                                    <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary">Parcel Item Details</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="light" type="button" onClick={() => navigate("/parcel/list-ParcelItemMaster")}>{t("Cancel")}</Button>
                                        <Button color="primary" type="submit" disabled={submitting}>
                                            {submitting ? "Saving..." : "Save"}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <Row>
                                        <Col md={3}>
                                            <FormGroup>
                                                <Label>{t("Stock ID / LotNo")} <span className="text-danger">*</span></Label>
                                                <Input 
                                                    type="text"
                                                    className={`form-control ${errors.lotNo ? 'is-invalid' : ''}`}
                                                    placeholder={t("Stock ID/ LotNo")} 
                                                    value={form.lotNo}
                                                    onChange={(e) => {
                                                        handleTextChange("lotNo", e.target.value);
                                                        if (e.target.value.trim()) setErrors(prev => ({ ...prev, lotNo: false }));
                                                    }}
                                                    onBlur={() => {
                                                        if (!form.lotNo.trim()) setErrors(prev => ({ ...prev, lotNo: true }));
                                                    }}
                                                />
                                                {errors.lotNo && <div className="invalid-feedback">{t("Enter Stock ID/LotNo")}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>{t("Shape")}</Label>
                                                <Select
                                                    value={shapeOptions.find(opt => opt.value == form.shapeId) || null}
                                                    onChange={(selected) => handleTextChange("shapeId", selected ? selected.value : "")}
                                                    options={shapeOptions}
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
                                                    value={colorOptions.find(opt => opt.value == form.colorId) || null}
                                                    onChange={(selected) => handleTextChange("colorId", selected ? selected.value : "")}
                                                    options={colorOptions}
                                                    placeholder={t("Select Color")}
                                                    isSearchable={true}
                                                    isClearable={true}
                                                    classNamePrefix="react-select"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>{t("Clarity")}</Label>
                                                <Select
                                                    value={clarityOptions.find(opt => opt.value == form.clarityId) || null}
                                                    onChange={(selected) => handleTextChange("clarityId", selected ? selected.value : "")}
                                                    options={clarityOptions}
                                                    placeholder={t("Select Clarity")}
                                                    isSearchable={true}
                                                    isClearable={true}
                                                    classNamePrefix="react-select"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>{t("Size")}</Label>
                                                <Select
                                                    value={sizeOptions.find(opt => opt.value == form.sizeId) || null}
                                                    onChange={(selected) => handleTextChange("sizeId", selected ? selected.value : "")}
                                                    options={sizeOptions}
                                                    placeholder={t("Select Size")}
                                                    isSearchable={true}
                                                    isClearable={true}
                                                    classNamePrefix="react-select"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>{t("Sieve/MM")}</Label>
                                                <Select
                                                    value={sieveOptions.find(opt => opt.value == form.sieveId) || null}
                                                    onChange={(selected) => handleTextChange("sieveId", selected ? selected.value : "")}
                                                    options={sieveOptions}
                                                    placeholder={t("Select Sieve")}
                                                    isSearchable={true}
                                                    isClearable={true}
                                                    classNamePrefix="react-select"
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label>{t("Stock Name")}</Label>
                                                <Input
                                                    type="text"
                                                    placeholder={t("Stock Name")}
                                                    value={form.itemName}
                                                    onChange={(e) => handleTextChange("itemName", e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={3}>
                                            <FormGroup>
                                                <Label>{t("Stock GroupID")}</Label>
                                                <Select
                                                    value={itemGroupOptions.find(opt => opt.value == form.itemGroupID) || null}
                                                    onChange={(selected) => handleTextChange("itemGroupID", selected ? selected.value : "")}
                                                    options={itemGroupOptions}
                                                    placeholder={t("Select Group")}
                                                    isSearchable={true}
                                                    isClearable={true}
                                                    classNamePrefix="react-select"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={5}>
                                            <FormGroup>
                                                <Label>{t("Description")}</Label>
                                                <Input
                                                    type="textarea"
                                                    rows="2"
                                                    placeholder={t("Description")}
                                                    value={form.publicCommnets}
                                                    onChange={(e) => handleTextChange("publicCommnets", e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <hr className="my-4" />

                                    <Row>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label>{t("Stock Type")}</Label>
                                                <select
                                                    className="form-select"
                                                    value={form.category}
                                                    onChange={(e) => handleTextChange("category", e.target.value)}
                                                >
                                                    {dropdowns.category.map(item => (
                                                        <option key={item.id} value={item.id}>{item.textName || item.name || item.id}</option>
                                                    ))}
                                                </select>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label>{t("Stock SubType")}</Label>
                                                <select
                                                    className="form-select"
                                                    value={form.instruction}
                                                    onChange={(e) => handleTextChange("instruction", e.target.value)}
                                                >
                                                    <option value="Polished">{t("Polished")}</option>
                                                    <option value="Makeble">{t("Makeble")}</option>
                                                    <option value="Rough">{t("Rough")}</option>
                                                </select>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label>{t("Grown / Process Type")}</Label>
                                                <select
                                                    className="form-select"
                                                    value={form.productType}
                                                    onChange={(e) => handleTextChange("productType", e.target.value)}
                                                >
                                                    {dropdowns.productType.map(item => (
                                                        <option key={item.id} value={item.id}>{item.textName || item.name || item.id}</option>
                                                    ))}
                                                </select>
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <hr className="my-4" />

                                    <Row>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label>{t("Opening Weight / Carats")}</Label>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    className="text-end"
                                                    value={form.weight}
                                                    onChange={(e) => handleValueChange("weight", e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label>{t("Opening Pcs")}</Label>
                                                <Input
                                                    type="number"
                                                    className="text-end"
                                                    value={form.pcs}
                                                    onChange={(e) => handleValueChange("pcs", e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label>{t("Base Currency Rate")}</Label>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    className="text-end"
                                                    value={form.pDollorRate}
                                                    onChange={(e) => handleValueChange("pDollorRate", e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row className="mt-3">
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>{t("Purchase / Cost Price (USD / Carat)")}</Label>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    className="text-end"
                                                    value={form.purchaseRate}
                                                    onChange={(e) => handleValueChange("purchaseRate", e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>{t("Purchase / Cost USD Amount")}</Label>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    className="text-end bg-light"
                                                    value={form.purchaseAmount.toFixed(2)}
                                                    readOnly
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row className="mt-3">
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>{t("Purchase / Cost Price (INR / Carat)")}</Label>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    className="text-end bg-light"
                                                    value={form.masterCurrencyRate.toFixed(2)}
                                                    readOnly
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>{t("Purchase / Cost INR Amount")}</Label>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    className="text-end bg-light"
                                                    value={form.masterCurrencyAmount.toFixed(2)}
                                                    readOnly
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <hr className="my-4" />

                                    <Row>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>{t("Asking Price (USD / Carat)")}</Label>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    className="text-end"
                                                    value={form.askingRate}
                                                    onChange={(e) => handleValueChange("askingRate", e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>{t("Asking USD Amount")}</Label>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    className="text-end bg-light"
                                                    value={form.askingAmount.toFixed(2)}
                                                    readOnly
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row className="mt-3">
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>{t("Asking Price (INR / Carat)")}</Label>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    className="text-end bg-light"
                                                    value={form.askingINR.toFixed(2)}
                                                    readOnly
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>{t("Asking INR Amount")}</Label>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    className="text-end bg-light"
                                                    value={form.askingINRAmt.toFixed(2)}
                                                    readOnly
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </form>
                    )}
                </Container>
            </div>
            <ToastContainer autoClose={2000} />
        </React.Fragment>
    );
};

export default ParcelItemMasterEdit;
