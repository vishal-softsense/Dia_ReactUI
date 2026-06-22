import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, FormGroup, Label, Input } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { getParcelItemMasterDropdowns, checkLotNoExists, addParcelItemMaster } from "../../../helpers/fakebackend_helper";
import { toast } from 'react-toastify';

const ParcelItemMasterAdd = () => {
    const navigate = useNavigate();
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
        lotNo: "",
        shapeId: "",
        colorId: "",
        clarityId: "",
        sizeId: "",
        sieveId: "",
        itemName: "",
        itemGroupID: "",
        category: "",
        instruction: "Polished", // StockSubType (Polished/Makeble/Rough)
        productType: "", // Grown/Process Type
        weight: 0,
        pcs: 0,
        pDollorRate: 0, // USD to INR Rate / BaseRate
        purchaseRate: 0, // Purchase/Cost Price USD/Carats
        purchaseAmount: 0, // Purchase/Cost USD Amount
        masterCurrencyRate: 0, // Purchase/Cost Price INR/Carats
        masterCurrencyAmount: 0, // Purchase/Cost INR Amount
        askingRate: 0, // Asking Price USD/Carats
        askingAmount: 0, // Asking USD Amount
        askingINR: 0, // Asking Price INR/Carats
        askingINRAmt: 0, // Asking INR Amount
        publicCommnets: "" // Description
    });

    const [submitting, setSubmitting] = useState(false);
    const [lotNoExists, setLotNoExists] = useState(false);

    useEffect(() => {
        loadDropdowns();
    }, []);

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
                // Set defaults if available
                setForm(prev => ({
                    ...prev,
                    category: data.category?.[0]?.id || "",
                    productType: data.productType?.[0]?.id || ""
                }));
            } else {
                toast.error("Failed to load dropdown data");
            }
        } catch (error) {
            toast.error("Error loading dropdown data");
        }
    };

    // Calculate ItemName dynamically based on dropdown values
    useEffect(() => {
        const shapeName = dropdowns.shape.find(x => x.id === form.shapeId)?.name || "";
        const colorName = dropdowns.color.find(x => x.id === form.colorId)?.name || "";
        const sizeName = dropdowns.size.find(x => x.id === form.sizeId)?.name || "";
        const clarityName = dropdowns.clarity.find(x => x.id === form.clarityId)?.name || "";

        const dynamicName = [shapeName, colorName, sizeName, clarityName].filter(Boolean).join(" ");
        setForm(prev => ({
            ...prev,
            itemName: dynamicName
        }));
    }, [form.shapeId, form.colorId, form.sizeId, form.clarityId, dropdowns]);

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

    const handleLotNoBlur = async () => {
        if (!form.lotNo.trim()) return;
        try {
            const response = await checkLotNoExists(form.lotNo.trim());
            if (response.success || response.Success) {
                const exists = response.exists || response.Exists || false;
                setLotNoExists(exists);
                if (exists) {
                    toast.warning("LotNo Already Exists");
                }
            }
        } catch (error) {
            console.error("Error checking LotNo existence", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.lotNo.trim()) {
            toast.error("Please enter Stock ID/LotNo");
            return;
        }
        if (lotNoExists) {
            toast.error("LotNo Already Exists");
            return;
        }

        setSubmitting(true);
        try {
            const response = await addParcelItemMaster(form);
            if (response.success || response.Success) {
                toast.success(response.message || response.Message || "Parcel Item Added successfully");
                navigate("/parcel/list-ParcelItemMaster");
            } else {
                toast.error(response.message || response.Message || "Failed to add parcel item");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.response?.data?.Message || "An error occurred while adding");
        }
        setSubmitting(false);
    };

    document.title = "Add Parcel Item Master | Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Add Parcel Item Master" pageTitle="Stock & Account" />

                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader className="d-flex align-items-center">
                                <h5 className="card-title mb-0 flex-grow-1">Parcel Item Details</h5>
                                <div className="d-flex gap-2">
                                    <Button color="light" type="button" onClick={() => navigate("/parcel/list-ParcelItemMaster")}>
                                        Cancel
                                    </Button>
                                    <Button color="primary" type="submit" disabled={submitting}>
                                        {submitting ? "Submitting..." : "Submit"}
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
                                                className={`form-control ${lotNoExists ? 'is-invalid' : ''}`}
                                                placeholder="Stock ID/ LotNo" 
                                                value={form.lotNo}
                                                onChange={(e) => handleTextChange("lotNo", e.target.value)}
                                                onBlur={handleLotNoBlur}
                                                required
                                            />
                                            {lotNoExists && <div className="invalid-feedback">LotNo Already Exists</div>}
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
                                                    <option key={item.id} value={item.id}>{item.name}</option>
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
                                                    <option key={item.id} value={item.id}>{item.name}</option>
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
                                                    <option key={item.id} value={item.id}>{item.name}</option>
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
                                                    <option key={item.id} value={item.id}>{item.name}</option>
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
                                                    <option key={item.id} value={item.id}>{item.name}</option>
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
                                                    <option key={item.id} value={item.id}>{item.name}</option>
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
                                                    <option key={item.id} value={item.id}>{item.name}</option>
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
                                                    <option key={item.id} value={item.id}>{item.name}</option>
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
                                                value={form.weight === 0 ? "" : form.weight}
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
                                                value={form.pcs === 0 ? "" : form.pcs}
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
                                                value={form.pDollorRate === 0 ? "" : form.pDollorRate}
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
                                                value={form.purchaseRate === 0 ? "" : form.purchaseRate}
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
                                                value={form.askingRate === 0 ? "" : form.askingRate}
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
                </Container>
            </div>
        </React.Fragment>
    );
};

export default ParcelItemMasterAdd;
