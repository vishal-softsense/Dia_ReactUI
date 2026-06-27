import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, FormGroup, Label, Input } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { getParcelItemMasterDropdowns, getParcelItemMasterDetail, updateParcelItemMaster } from "../../../helpers/fakebackend_helper";
import { toast } from 'react-toastify';

const ParcelItemMasterEdit = () => {
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
                    weight: parseFloat(data.weight || data.Weight) || 0,
                    pcs: parseInt(data.pcs || data.Pcs) || 0,
                    pDollorRate: parseFloat(data.pDollorRate || data.PDollorRate) || 0,
                    purchaseRate: parseFloat(data.purchaseRate || data.PurchaseRate) || 0,
                    purchaseAmount: parseFloat(data.purchaseAmount || data.PurchaseAmount) || 0,
                    masterCurrencyRate: parseFloat(data.masterCurrencyRate || data.MasterCurrencyRate) || 0,
                    masterCurrencyAmount: parseFloat(data.masterCurrencyAmount || data.MasterCurrencyAmount) || 0,
                    askingRate: parseFloat(data.askingRate || data.AskingRate) || 0,
                    askingAmount: parseFloat(data.askingAmount || data.AskingAmount) || 0,
                    askingINR: parseFloat(data.askingINR || data.AskingINR) || 0,
                    askingINRAmt: parseFloat(data.askingINRAmt || data.AskingINRAmt) || 0,
                    publicCommnets: data.publicCommnets || data.PublicCommnets || ""
                });
            } else {
                toast.error("Failed to load parcel item details");
                navigate("/parcel/list-ParcelItemMaster");
            }
        } catch (error) {
            toast.error("Error loading parcel item details");
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
        if (!form.lotNo.trim()) {
            toast.error("Please enter Stock ID/LotNo");
            return;
        }

        setSubmitting(true);
        try {
            const response = await updateParcelItemMaster(form.itemCode, form);
            if (response.success || response.Success) {
                toast.success(response.message || response.Message || "Parcel Item updated successfully");
                navigate("/parcel/list-ParcelItemMaster");
            } else {
                toast.error(response.message || response.Message || "Failed to update parcel item");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.response?.data?.Message || "An error occurred while updating");
        }
        setSubmitting(false);
    };

    document.title = "Edit Parcel Item Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Edit Parcel Item Master" pageTitle="Stock & Account" />

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
                                    <h5 className="card-title mb-0 flex-grow-1">Edit Item Code: {form.itemCode}</h5>
                                    <div className="d-flex gap-2">
                                        <Button color="light" type="button" onClick={() => navigate("/parcel/list-ParcelItemMaster")}>
                                            Cancel
                                        </Button>
                                        <Button color="primary" type="submit" disabled={submitting}>
                                            {submitting ? "Saving..." : "Save"}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <Row>
                                        <Col md={3}>
                                            <FormGroup>
                                                <Label>Stock ID / LotNo <span className="text-danger">*</span></Label>
                                                <Input 
                                                    type="text" 
                                                    placeholder="Stock ID/ LotNo" 
                                                    value={form.lotNo}
                                                    onChange={(e) => handleTextChange("lotNo", e.target.value)}
                                                    required
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>Shape</Label>
                                                <select
                                                    className="form-select"
                                                    value={form.shapeId}
                                                    onChange={(e) => handleTextChange("shapeId", e.target.value)}
                                                >
                                                    <option value="">Select Shape</option>
                                                    {dropdowns.shape.map(item => (
                                                        <option key={item.id} value={item.id}>{item.textName || item.name || item.id}</option>
                                                    ))}
                                                </select>
                                            </FormGroup>
                                        </Col>
                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>Color</Label>
                                                <select
                                                    className="form-select"
                                                    value={form.colorId}
                                                    onChange={(e) => handleTextChange("colorId", e.target.value)}
                                                >
                                                    <option value="">Select Color</option>
                                                    {dropdowns.color.map(item => (
                                                        <option key={item.id} value={item.id}>{item.textName || item.name || item.id}</option>
                                                    ))}
                                                </select>
                                            </FormGroup>
                                        </Col>
                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>Clarity</Label>
                                                <select
                                                    className="form-select"
                                                    value={form.clarityId}
                                                    onChange={(e) => handleTextChange("clarityId", e.target.value)}
                                                >
                                                    <option value="">Select Clarity</option>
                                                    {dropdowns.clarity.map(item => (
                                                        <option key={item.id} value={item.id}>{item.textName || item.name || item.id}</option>
                                                    ))}
                                                </select>
                                            </FormGroup>
                                        </Col>
                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>Size</Label>
                                                <select
                                                    className="form-select"
                                                    value={form.sizeId}
                                                    onChange={(e) => handleTextChange("sizeId", e.target.value)}
                                                >
                                                    <option value="">Select Size</option>
                                                    {dropdowns.size.map(item => (
                                                        <option key={item.id} value={item.id}>{item.textName || item.name || item.id}</option>
                                                    ))}
                                                </select>
                                            </FormGroup>
                                        </Col>
                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>Sieve/MM</Label>
                                                <select
                                                    className="form-select"
                                                    value={form.sieveId}
                                                    onChange={(e) => handleTextChange("sieveId", e.target.value)}
                                                >
                                                    <option value="">Select Sieve</option>
                                                    {dropdowns.sieve.map(item => (
                                                        <option key={item.id} value={item.id}>{item.textName || item.name || item.id}</option>
                                                    ))}
                                                </select>
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label>Stock Name</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Stock Name"
                                                    value={form.itemName}
                                                    onChange={(e) => handleTextChange("itemName", e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={3}>
                                            <FormGroup>
                                                <Label>Stock GroupID</Label>
                                                <select
                                                    className="form-select"
                                                    value={form.itemGroupID}
                                                    onChange={(e) => handleTextChange("itemGroupID", e.target.value)}
                                                >
                                                    <option value="">Select GroupID</option>
                                                    {dropdowns.itemGroup.map(item => (
                                                        <option key={item.id} value={item.id}>{item.textName || item.name || item.id}</option>
                                                    ))}
                                                </select>
                                            </FormGroup>
                                        </Col>
                                        <Col md={5}>
                                            <FormGroup>
                                                <Label>Description</Label>
                                                <Input
                                                    type="textarea"
                                                    rows="2"
                                                    placeholder="Description"
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
                                                <Label>Stock Type</Label>
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
                                                <Label>Stock SubType</Label>
                                                <select
                                                    className="form-select"
                                                    value={form.instruction}
                                                    onChange={(e) => handleTextChange("instruction", e.target.value)}
                                                >
                                                    <option value="Polished">Polished</option>
                                                    <option value="Makeble">Makeble</option>
                                                    <option value="Rough">Rough</option>
                                                </select>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label>Grown / Process Type</Label>
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
                                                <Label>Opening Weight / Carats</Label>
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
                                                <Label>Opening Pcs</Label>
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
                                                <Label>Base Currency Rate</Label>
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
                                                <Label>Purchase / Cost Price (USD / Carat)</Label>
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
                                                <Label>Purchase / Cost USD Amount</Label>
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
                                                <Label>Purchase / Cost Price (INR / Carat)</Label>
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
                                                <Label>Purchase / Cost INR Amount</Label>
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
                                                <Label>Asking Price (USD / Carat)</Label>
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
                                                <Label>Asking USD Amount</Label>
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
                                                <Label>Asking Price (INR / Carat)</Label>
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
                                                <Label>Asking INR Amount</Label>
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
        </React.Fragment>
    );
};

export default ParcelItemMasterEdit;
