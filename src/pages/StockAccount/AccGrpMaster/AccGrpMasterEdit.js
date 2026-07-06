import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, FormGroup, Label, Input, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import Select from "react-select";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { getAccGrpMasterDropdowns, getAccGrpMasterDetail, checkAccGrpNameExists, getCurrencyRates, getAccEffCode, getAccEffSide, updateAccGrpMaster } from "../../../helpers/fakebackend_helper";
import { toast, ToastContainer } from 'react-toastify';

const AccGrpMasterEdit = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("1");
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [nameExists, setNameExists] = useState(false);
    const [nameError, setNameError] = useState("");

    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get("id");

    const [dropdowns, setDropdowns] = useState({
        underGroup: [],
        accType: [],
        currency: [],
        area: [],
        city: [],
        state: [],
        country: [],
        term: [],
        through: [],
        broker: [],
        agent: []
    });

    const [form, setForm] = useState({
        accGrpCode: 0,
        ag: "A",
        accGrpName: "",
        sName: "",
        underGroup: "",
        accType: "",
        accEffCode: "",
        accEffSide: "",
        currency: "",
        baseRate: 0,
        sBaseRate: 0,
        oBalance: 0,
        oDrCr: "C",
        interest: 0,
        discount: 0,
        creditLimit: 0,
        dueDays: 0,
        gracePeriod: 0,
        term: "",
        termPer: 0,
        markup: "",
        localLangName: "",
        localLangContactPerson: "",
        localLangAddress: "",
        webUser: "",
        
        // KYC
        address1: "",
        address2: "",
        address3: "",
        zipcode: "",
        city: "",
        state: "",
        country: "",
        area: "",
        mobile: "",
        officePhone: "",
        homePhone: "",
        fax: "",
        qqid: "",
        email: "",
        website: "",
        skype: "",
        broker: "",
        brokerPer: 0,
        through: "",
        contactPerson: "",
        agent: "",
        refPartyName1: "",
        refPhone1: "",
        refComments1: "",
        refPartyName2: "",
        refPhone2: "",
        refComments2: "",
        
        // Financial
        bankACNO: "",
        bankACDetail: "",
        bankRouting: "",
        bankSwift: "",
        panNO: "",
        tinNO: "",
        cinNO: "",
        grno: "",
        cstno: "",
        remarks: "",
        compliance: false,
        active: true,
        emailInventory: false,
        
        // Shipping
        shippingName: "",
        shippingAddress1: "",
        shippingZipcode: "",
        shippingCity: "",
        shippingState: "",
        shippingCountry: "",
        shippingArea: "",
        shippingPhone: "",
        shippingFax: ""
    });

    useEffect(() => {
        if (!id) {
            toast.error("Account Group ID is missing.");
            navigate("/account/list-accountgroup");
            return;
        }
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load dropdowns first
            const dropResponse = await getAccGrpMasterDropdowns();
            let loadedDropdowns = {};
            if (dropResponse.success || dropResponse.Success) {
                const data = dropResponse.data || dropResponse.Data || {};
                loadedDropdowns = {
                    underGroup: data.underGroup || data.UnderGroup || [],
                    accType: data.accType || data.AccType || [],
                    currency: data.currency || data.Currency || [],
                    area: data.area || data.Area || [],
                    city: data.city || data.City || [],
                    state: data.state || data.State || [],
                    country: data.country || data.Country || [],
                    term: data.term || data.Term || [],
                    through: data.through || data.Through || [],
                    broker: data.broker || data.Broker || [],
                    agent: data.agent || data.Agent || []
                };
                setDropdowns(loadedDropdowns);
            }

            // Load details
            const detailResponse = await getAccGrpMasterDetail(id);
            if (detailResponse.success || detailResponse.Success) {
                const detail = detailResponse.data || detailResponse.Data || {};
                setForm({
                    accGrpCode: detail.accGrpCode || detail.AccGrpCode || 0,
                    ag: detail.ag || detail.AG || "A",
                    accGrpName: detail.accGrpName || detail.AccGrpName || "",
                    sName: detail.sName || detail.SName || "",
                    // Under Group: DB returns UGrCode as number, UnderGroup as int
                    underGroup: detail.underGroup || detail.UnderGroup || detail.uGrCode || detail.UGrCode || "",
                    // Account Type: DB returns AccTypeCode as number, AccType as int
                    accType: detail.accType || detail.AccType || detail.accTypeCode || detail.AccTypeCode || "",
                    accEffCode: detail.accEffCode || detail.AccEffCode || "",
                    accEffSide: detail.accEffSide || detail.AccEffSide || "",
                    currency: detail.currency || detail.Currency || detail.curCode || detail.CurCode || "",
                    baseRate: detail.baseRate || detail.BaseRate || detail.masterCurrencyRate || detail.MasterCurrencyRate || 0,
                    sBaseRate: detail.sBaseRate || detail.SBaseRate || detail.stockCurrencyRate || detail.StockCurrencyRate || 0,
                    oBalance: detail.oBalance || detail.OBalance || 0,
                    oDrCr: detail.oDrCr || detail.ODrCr || "C",
                    // Interest: DB returns InterestPer
                    interest: detail.interest || detail.Interest || detail.interestPer || detail.InterestPer || 0,
                    // Discount: DB returns DiscountPer
                    discount: detail.discount || detail.Discount || detail.discountPer || detail.DiscountPer || 0,
                    creditLimit: detail.creditLimit || detail.CreditLimit || 0,
                    dueDays: detail.dueDays || detail.DueDays || 0,
                    gracePeriod: detail.gracePeriod || detail.GracePeriod || 0,
                    term: detail.term || detail.Term || detail.termName || detail.TermName || "",
                    termPer: detail.termPer || detail.TermPer || 0,
                    markup: detail.markup || detail.Markup || "",
                    localLangName: detail.localLangName || detail.LocalLangName || "",
                    localLangContactPerson: detail.localLangContactPerson || detail.LocalLangContactPerson || "",
                    localLangAddress: detail.localLangAddress || detail.LocalLangAddress || "",
                    // WebUser: DB returns WebsiteUserID
                    webUser: detail.webUser || detail.WebUser || detail.websiteUserID || detail.WebsiteUserID || "",
                    
                    // KYC - DB columns: AddressLine1, AddressLine2, AddressLine3
                    address1: detail.AddressLine1 || detail.addressLine1 || detail.address1 || detail.Address1 || "",
                    address2: detail.AddressLine2 || detail.addressLine2 || detail.address2 || detail.Address2 || "",
                    address3: detail.AddressLine3 || detail.addressLine3 || detail.address3 || detail.Address3 || "",
                    zipcode: detail.zipcode || detail.Zipcode || detail.zipCode || detail.ZipCode || "",
                    city: detail.city || detail.City || detail.cityCode || detail.CityCode || "",
                    state: detail.state || detail.State || detail.stateCode || detail.StateCode || "",
                    country: detail.country || detail.Country || detail.countryCode || detail.CountryCode || "",
                    area: detail.area || detail.Area || detail.areaCode || detail.AreaCode || "",
                    mobile: detail.mobile || detail.Mobile || "",
                    officePhone: detail.officePhone || detail.OfficePhone || "",
                    homePhone: detail.homePhone || detail.HomePhone || "",
                    fax: detail.fax || detail.Fax || "",
                    qqid: detail.qqid || detail.QQID || "",
                    email: detail.email || detail.Email || "",
                    website: detail.website || detail.Website || "",
                    // Skype: DB returns SkypeId
                    skype: detail.skype || detail.Skype || detail.skypeId || detail.SkypeId || "",
                    broker: detail.broker || detail.Broker || detail.brokerCode || detail.BrokerCode || "",
                    brokerPer: detail.brokerPer || detail.BrokerPer || 0,
                    through: detail.through || detail.Through || "",
                    contactPerson: detail.contactPerson || detail.ContactPerson || "",
                    agent: detail.agent || detail.Agent || "",
                    // RefPartyName1: DB returns RefParty1
                    refPartyName1: detail.refPartyName1 || detail.RefPartyName1 || detail.refParty1 || detail.RefParty1 || "",
                    refPhone1: detail.refPhone1 || detail.RefPhone1 || "",
                    refComments1: detail.refComments1 || detail.RefComments1 || "",
                    // RefPartyName2: DB returns RefParty2
                    refPartyName2: detail.refPartyName2 || detail.RefPartyName2 || detail.refParty2 || detail.RefParty2 || "",
                    refPhone2: detail.refPhone2 || detail.RefPhone2 || "",
                    refComments2: detail.refComments2 || detail.RefComments2 || "",
                    
                    // Financial
                    // DB columns: BankAccNo, BankAccDetail, PAN, TINNo, CINNO, GrNo, CSTNo
                    bankACNO: detail.BankAccNo || detail.bankAccNo || detail.BankACNO || detail.bankACNO || "",
                    bankACDetail: detail.BankAccDetail || detail.bankAccDetail || detail.BankACDetail || detail.bankACDetail || "",
                    bankRouting: detail.bankRouting || detail.BankRouting || "",
                    bankSwift: detail.BankSwiftCode || detail.bankSwiftCode || detail.BankSwift || detail.bankSwift || "",
                    // PanNO: DB column is PAN
                    panNO: detail.PAN || detail.pan || detail.PanNO || detail.panNO || detail.panno || "",
                    // TINNo: DB column is TINNo
                    tinNO: detail.TINNo || detail.TINNO || detail.tinNo || detail.tinNO || detail.tinno || "",
                    // CINNO: DB column is CINNO
                    cinNO: detail.CINNO || detail.cinNO || detail.cinno || "",
                    // GrNo: DB column is GrNo
                    grno: detail.GrNo || detail.GRNO || detail.grNo || detail.grno || "",
                    // CSTNo: DB column is CSTNo
                    cstno: detail.CSTNo || detail.CSTNO || detail.cstNo || detail.cstno || "",
                    remarks: detail.remarks || detail.Remarks || "",
                    compliance: detail.compliance || detail.Compliance || detail.compilance || detail.Compilance || false,
                    active: detail.inactive !== undefined ? !detail.inactive : (detail.Inactive !== undefined ? !detail.Inactive : (detail.active !== undefined ? detail.active : (detail.Active !== undefined ? detail.Active : true))),
                    emailInventory: detail.emailInventory || detail.EmailInventory || false,
                    
                    // Shipping: DB returns ShipName, ShipStreet, ShipCityCode, etc.
                    shippingName: detail.shippingName || detail.ShippingName || detail.shipName || detail.ShipName || "",
                    shippingAddress1: detail.shippingAddress1 || detail.ShippingAddress1 || detail.shipStreet || detail.ShipStreet || "",
                    shippingZipcode: detail.shippingZipcode || detail.ShippingZipcode || detail.shipZipCode || detail.ShipZipCode || "",
                    shippingCity: detail.shippingCity || detail.ShippingCity || detail.shipCityCode || detail.ShipCityCode || "",
                    shippingState: detail.shippingState || detail.ShippingState || detail.shipStateCode || detail.ShipStateCode || "",
                    shippingCountry: detail.shippingCountry || detail.ShippingCountry || detail.shipCountryCode || detail.ShipCountryCode || "",
                    shippingArea: detail.shippingArea || detail.ShippingArea || detail.shipAreaCode || detail.ShipAreaCode || "",
                    shippingPhone: detail.shippingPhone || detail.ShippingPhone || "",
                    shippingFax: detail.shippingFax || detail.ShippingFax || ""
                });
            } else {
                toast.error(detailResponse.message || detailResponse.Message || "Failed to load account group details");
                navigate("/account/list-accountgroup");
            }
        } catch (e) {
            toast.error("Failed to load details");
            navigate("/account/list-accountgroup");
        }
        setLoading(false);
    };

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
        const val = parseFloat(value) || 0;
        setForm(prev => ({
            ...prev,
            [field]: val
        }));
    };

    const handleNameChange = (val) => {
        const regex = /^[A-Za-z0-9 &()'._|\-]*$/;
        if (!regex.test(val)) {
            setNameError(t("Account/Group Name may contain only alphanumeric characters and & ( ) ' . _ | -"));
            val = val.replace(/[^A-Za-z0-9 &()'._|\-]/g, '');
        } else {
            setNameError("");
        }
        setForm(prev => ({ ...prev, accGrpName: val }));
    };

    const handleNameBlur = async () => {
        if (!form.accGrpName.trim()) return;
        try {
            const response = await checkAccGrpNameExists(form.accGrpName.trim(), id);
            if (response.success || response.Success) {
                const exists = response.exists || response.Exists || false;
                setNameExists(exists);
                if (exists) {
                    toast.warning(t("Account/Group Name Already Exists"));
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAccTypeChange = async (accTypeId) => {
        setForm(prev => ({ ...prev, accType: accTypeId }));
        if (accTypeId) {
            try {
                const codeRes = await getAccEffCode(accTypeId);
                const sideRes = await getAccEffSide(accTypeId);
                setForm(prev => ({
                    ...prev,
                    accEffCode: codeRes.data || codeRes.Data || "",
                    accEffSide: sideRes.data || sideRes.Data || ""
                }));
            } catch (error) {
                console.error("Error fetching acc efficiency code/side", error);
            }
        } else {
            setForm(prev => ({ ...prev, accEffCode: "", accEffSide: "" }));
        }
    };

    const handleCurrencyChange = async (currencyVal) => {
        setForm(prev => ({ ...prev, currency: currencyVal }));
        if (currencyVal) {
            try {
                const response = await getCurrencyRates(currencyVal);
                if (response.success || response.Success) {
                    setForm(prev => ({
                        ...prev,
                        baseRate: response.baseRate || response.BaseRate || 0,
                        sBaseRate: response.sBaseRate || response.SBaseRate || 0
                    }));
                }
            } catch (e) {
                console.error("Error fetching currency rates", e);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.accGrpName.trim()) {
            toast.error("Please enter Account/Group Name");
            toggleTab("1");
            return;
        }
        if (nameExists) {
            toast.error(t("Account/Group Name Already Exists"));
            toggleTab("1");
            return;
        }
        if (!form.underGroup) {
            toast.error("Please select Under Group");
            toggleTab("1");
            return;
        }
        if (!form.accType) {
            toast.error("Please select Account Type");
            toggleTab("1");
            return;
        }

        setSubmitting(true);
        try {
            const response = await updateAccGrpMaster(id, form);
            if (response.success || response.Success) {
                navigate("/account/list-accountgroup", { state: { successMessage: response.message || response.Message || "Account Group updated successfully." } });
            } else {
                toast.error(response.message || response.Message || "Failed to update Account Group");
            }
        } catch (error) {
            const errMsg = typeof error === 'string' ? error : (error.response?.data?.message || error.response?.data?.Message || "An error occurred");
            toast.error(errMsg);
        }
        setSubmitting(false);
    };

    // Mapping dropdown options
    const selectOptions = (list) => list.map(item => ({
        value: item.id || item.ID || item.name || item.Name,
        label: item.name || item.Name || item.textName || item.text || item.id || item.ID
    }));

    document.title = `${t("Edit Account Group Master")} | ${t("Admin")}`;

    if (loading) {
        return (
            <div className="page-content text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Edit Account Group Master")} pageTitle={t("Stock & Account")} />

                    <form onSubmit={handleSubmit}>
                        <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                            <CardHeader className="bg-transparent border-bottom d-flex align-items-center py-3">
                                <h5 className="card-title mb-0 flex-grow-1 fw-bold text-primary">{t("Edit Account Group")}</h5>
                                <div className="d-flex gap-2">
                                    <Button color="light" type="button" onClick={() => navigate("/account/list-accountgroup")}>{t("Cancel")}</Button>
                                    <Button color="primary" type="submit" disabled={submitting}>
                                        {submitting ? t("Updating...") : t("Update")}
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
                                            <i className="ri-user-line me-1"></i> {t("Account Details")}
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === "2" })}
                                            onClick={() => toggleTab("2")}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <i className="ri-government-line me-1"></i> {t("KYC Details")}
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === "3" })}
                                            onClick={() => toggleTab("3")}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <i className="ri-wallet-3-line me-1"></i> {t("Financial Details")}
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === "4" })}
                                            onClick={() => toggleTab("4")}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <i className="ri-truck-line me-1"></i> {t("Shipping Details")}
                                        </NavLink>
                                    </NavItem>
                                </Nav>

                                <TabContent activeTab={activeTab}>
                                    {/* TAB 1: Account Details */}
                                    <TabPane tabId="1">
                                        <Row className="g-3">
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Account/Group")} <span className="text-danger">*</span></Label>
                                                    <select className="form-select" value={form.ag} onChange={(e) => handleTextChange("ag", e.target.value)}>
                                                        <option value="A">{t("Account")}</option>
                                                        <option value="G">{t("Group")}</option>
                                                    </select>
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Account/Group Name")} <span className="text-danger">*</span></Label>
                                                    <Input
                                                        type="text"
                                                        className={`form-control ${nameExists || nameError ? 'is-invalid' : ''}`}
                                                        placeholder={t("Enter Account/Group Name")}
                                                        value={form.accGrpName}
                                                        onChange={(e) => handleNameChange(e.target.value)}
                                                        onBlur={handleNameBlur}
                                                        required
                                                    />
                                                    {nameError && <div className="invalid-feedback">{nameError}</div>}
                                                    {nameExists && <div className="invalid-feedback">{t("Account/Group Name Already Exists")}</div>}
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Short Name")}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("Enter Short Name")}
                                                        value={form.sName}
                                                        onChange={(e) => handleTextChange("sName", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Under Group")} <span className="text-danger">*</span></Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.underGroup).find(opt => opt.value == form.underGroup) || null}
                                                        onChange={(selected) => handleTextChange("underGroup", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.underGroup)}
                                                        placeholder={t("Select Under Group")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Account Type")} <span className="text-danger">*</span></Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.accType).find(opt => opt.value == form.accType) || null}
                                                        onChange={(selected) => handleAccTypeChange(selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.accType)}
                                                        placeholder={t("Select Account Type")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={2}>
                                                <FormGroup>
                                                    <Label>{t("Eff Code")}</Label>
                                                    <Input type="text" value={form.accEffCode} readOnly className="bg-light" />
                                                </FormGroup>
                                            </Col>
                                            <Col md={2}>
                                                <FormGroup>
                                                    <Label>{t("Eff Side")}</Label>
                                                    <Input type="text" value={form.accEffSide} readOnly className="bg-light" />
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-3 text-muted" />

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Currency")}</Label>
                                                    <select className="form-select" value={form.currency} onChange={(e) => handleCurrencyChange(e.target.value)}>
                                                        <option value="">{t("Select Currency")}</option>
                                                        {dropdowns.currency.map((item, idx) => (
                                                            <option key={idx} value={item.id || item.ID}>
                                                                {item.name || item.Name || item.id || item.ID}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Local Currency BaseRate")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        className="text-end"
                                                        value={form.baseRate === 0 ? "" : form.baseRate}
                                                        onChange={(e) => handleValueChange("baseRate", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("USD BaseRate")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        className="text-end"
                                                        value={form.sBaseRate === 0 ? "" : form.sBaseRate}
                                                        onChange={(e) => handleValueChange("sBaseRate", e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Opening Balance")}</Label>
                                                    <div className="input-group">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            className="text-end"
                                                            value={form.oBalance}
                                                            onChange={(e) => handleValueChange("oBalance", e.target.value)}
                                                        />
                                                        <select
                                                            className="form-select"
                                                            style={{ maxWidth: "80px" }}
                                                            value={form.oDrCr}
                                                            onChange={(e) => handleTextChange("oDrCr", e.target.value)}
                                                        >
                                                            <option value="C">{t("Cr")}</option>
                                                            <option value="D">{t("Dr")}</option>
                                                        </select>
                                                    </div>
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-3 text-muted" />

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Interest %")}</Label>
                                                    <Input type="number" step="any" className="text-end" value={form.interest === 0 ? "" : form.interest} onChange={(e) => handleValueChange("interest", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Discount %")}</Label>
                                                    <Input type="number" step="any" className="text-end" value={form.discount === 0 ? "" : form.discount} onChange={(e) => handleValueChange("discount", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Credit Limit")}</Label>
                                                    <Input type="number" step="any" className="text-end" value={form.creditLimit === 0 ? "" : form.creditLimit} onChange={(e) => handleValueChange("creditLimit", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Due Days")}</Label>
                                                    <Input type="number" className="text-end" value={form.dueDays === 0 ? "" : form.dueDays} onChange={(e) => handleValueChange("dueDays", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Grace Period")}</Label>
                                                    <Input type="number" className="text-end" value={form.gracePeriod === 0 ? "" : form.gracePeriod} onChange={(e) => handleValueChange("gracePeriod", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Term")}</Label>
                                                    <select className="form-select" value={form.term} onChange={(e) => handleTextChange("term", e.target.value)}>
                                                        <option value="">{t("Select Term")}</option>
                                                        {dropdowns.term.map((item, idx) => (
                                                            <option key={idx} value={item.id || item.ID}>
                                                                {item.name || item.Name || item.id || item.ID}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Term %")}</Label>
                                                    <Input type="number" step="any" className="text-end" value={form.termPer === 0 ? "" : form.termPer} onChange={(e) => handleValueChange("termPer", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Markup")}</Label>
                                                    <Input type="text" placeholder={t("Markup")} value={form.markup} onChange={(e) => handleTextChange("markup", e.target.value)} />
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-3 text-muted" />

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Local Language Name")}</Label>
                                                    <Input type="text" placeholder={t("Local Language Name")} value={form.localLangName} onChange={(e) => handleTextChange("localLangName", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Local Language Contact Person")}</Label>
                                                    <Input type="text" placeholder={t("Local Contact Person")} value={form.localLangContactPerson} onChange={(e) => handleTextChange("localLangContactPerson", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Local Language Address")}</Label>
                                                    <Input type="text" placeholder={t("Local Address")} value={form.localLangAddress} onChange={(e) => handleTextChange("localLangAddress", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Website User")}</Label>
                                                    <Input type="text" placeholder={t("Website Username")} value={form.webUser} onChange={(e) => handleTextChange("webUser", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    {/* TAB 2: KYC Details */}
                                    <TabPane tabId="2">
                                        <Row className="g-3">
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Address 1")}</Label>
                                                    <Input type="text" placeholder={t("Address Line 1")} value={form.address1} onChange={(e) => handleTextChange("address1", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Address 2")}</Label>
                                                    <Input type="text" placeholder={t("Address Line 2")} value={form.address2} onChange={(e) => handleTextChange("address2", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Address 3")}</Label>
                                                    <Input type="text" placeholder={t("Address Line 3")} value={form.address3} onChange={(e) => handleTextChange("address3", e.target.value)} />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("City")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.city).find(opt => opt.value == form.city) || null}
                                                        onChange={(selected) => handleTextChange("city", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.city)}
                                                        placeholder={t("Select City")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("State")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.state).find(opt => opt.value == form.state) || null}
                                                        onChange={(selected) => handleTextChange("state", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.state)}
                                                        placeholder={t("Select State")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Country")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.country).find(opt => opt.value == form.country) || null}
                                                        onChange={(selected) => handleTextChange("country", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.country)}
                                                        placeholder={t("Select Country")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Area")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.area).find(opt => opt.value == form.area) || null}
                                                        onChange={(selected) => handleTextChange("area", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.area)}
                                                        placeholder={t("Select Area")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Zipcode")}</Label>
                                                    <Input type="text" placeholder={t("Zipcode")} value={form.zipcode} onChange={(e) => handleTextChange("zipcode", e.target.value)} />
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-3 text-muted" />

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Mobile No")}</Label>
                                                    <Input type="text" placeholder={t("Mobile No")} value={form.mobile} onChange={(e) => handleTextChange("mobile", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Office Phone")}</Label>
                                                    <Input type="text" placeholder={t("Office Phone")} value={form.officePhone} onChange={(e) => handleTextChange("officePhone", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Home Phone")}</Label>
                                                    <Input type="text" placeholder={t("Home Phone")} value={form.homePhone} onChange={(e) => handleTextChange("homePhone", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Fax")}</Label>
                                                    <Input type="text" placeholder={t("Fax")} value={form.fax} onChange={(e) => handleTextChange("fax", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("QQID")}</Label>
                                                    <Input type="text" placeholder={t("QQID")} value={form.qqid} onChange={(e) => handleTextChange("qqid", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Email")}</Label>
                                                    <Input type="email" placeholder={t("Email Address")} value={form.email} onChange={(e) => handleTextChange("email", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Website")}</Label>
                                                    <Input type="text" placeholder={t("Website")} value={form.website} onChange={(e) => handleTextChange("website", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Skype")}</Label>
                                                    <Input type="text" placeholder={t("Skype ID")} value={form.skype} onChange={(e) => handleTextChange("skype", e.target.value)} />
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-3 text-muted" />

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Broker")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.broker).find(opt => opt.value == form.broker) || null}
                                                        onChange={(selected) => handleTextChange("broker", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.broker)}
                                                        placeholder={t("Select Broker")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={2}>
                                                <FormGroup>
                                                    <Label>{t("Broker %")}</Label>
                                                    <Input type="number" step="any" className="text-end" value={form.brokerPer === 0 ? "" : form.brokerPer} onChange={(e) => handleValueChange("brokerPer", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Through")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.through).find(opt => opt.value == form.through) || null}
                                                        onChange={(selected) => handleTextChange("through", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.through)}
                                                        placeholder={t("Select Through")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Contact Person")}</Label>
                                                    <Input type="text" placeholder={t("Contact Person")} value={form.contactPerson} onChange={(e) => handleTextChange("contactPerson", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Agent")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.agent).find(opt => opt.value == form.agent) || null}
                                                        onChange={(selected) => handleTextChange("agent", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.agent)}
                                                        placeholder={t("Select Agent")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-3 text-muted" />

                                            {/* Reference 1 */}
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Reference Party Name 1")}</Label>
                                                    <Input type="text" placeholder={t("Reference Party Name 1")} value={form.refPartyName1} onChange={(e) => handleTextChange("refPartyName1", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Reference Phone 1")}</Label>
                                                    <Input type="text" placeholder={t("Reference Phone 1")} value={form.refPhone1} onChange={(e) => handleTextChange("refPhone1", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Reference Comments 1")}</Label>
                                                    <Input type="textarea" rows="1" placeholder={t("Reference Comments 1")} value={form.refComments1} onChange={(e) => handleTextChange("refComments1", e.target.value)} />
                                                </FormGroup>
                                            </Col>

                                            {/* Reference 2 */}
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Reference Party Name 2")}</Label>
                                                    <Input type="text" placeholder={t("Reference Party Name 2")} value={form.refPartyName2} onChange={(e) => handleTextChange("refPartyName2", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Reference Phone 2")}</Label>
                                                    <Input type="text" placeholder={t("Reference Phone 2")} value={form.refPhone2} onChange={(e) => handleTextChange("refPhone2", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>{t("Reference Comments 2")}</Label>
                                                    <Input type="textarea" rows="1" placeholder={t("Reference Comments 2")} value={form.refComments2} onChange={(e) => handleTextChange("refComments2", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    {/* TAB 3: Financial Details */}
                                    <TabPane tabId="3">
                                        <Row className="g-3">
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Bank Account No")}</Label>
                                                    <Input type="text" placeholder={t("Bank Account No")} value={form.bankACNO} onChange={(e) => handleTextChange("bankACNO", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Bank Routing")}</Label>
                                                    <Input type="text" placeholder={t("Bank Routing")} value={form.bankRouting} onChange={(e) => handleTextChange("bankRouting", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Bank Swift Code")}</Label>
                                                    <Input type="text" placeholder={t("Bank Swift Code")} value={form.bankSwift} onChange={(e) => handleTextChange("bankSwift", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Bank Account Details")}</Label>
                                                    <Input type="text" placeholder={t("Bank Account Details")} value={form.bankACDetail} onChange={(e) => handleTextChange("bankACDetail", e.target.value)} />
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-3 text-muted" />

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Pan No")}</Label>
                                                    <Input type="text" placeholder={t("Pan Card No")} value={form.panNO} onChange={(e) => handleTextChange("panNO", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("GST No")}</Label>
                                                    <Input type="text" placeholder={t("GST / CST No")} value={form.cstno} onChange={(e) => handleTextChange("cstno", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("TIN No")}</Label>
                                                    <Input type="text" placeholder={t("TIN No")} value={form.tinNO} onChange={(e) => handleTextChange("tinNO", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("CIN No")}</Label>
                                                    <Input type="text" placeholder={t("CIN No")} value={form.cinNO} onChange={(e) => handleTextChange("cinNO", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("GR No")}</Label>
                                                    <Input type="text" placeholder={t("GR No")} value={form.grno} onChange={(e) => handleTextChange("grno", e.target.value)} />
                                                </FormGroup>
                                            </Col>

                                            <hr className="my-3 text-muted" />

                                            <Col md={12}>
                                                <FormGroup>
                                                    <Label>{t("Remarks")}</Label>
                                                    <Input type="textarea" rows="2" placeholder={t("Enter Remarks")} value={form.remarks} onChange={(e) => handleTextChange("remarks", e.target.value)} />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3} className="d-flex align-items-center mt-4">
                                                <div className="form-check form-switch form-switch-success">
                                                    <Input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id="complianceSwitch"
                                                        checked={form.compliance}
                                                        onChange={(e) => handleCheckboxChange("compliance", e.target.checked)}
                                                    />
                                                    <Label className="form-check-label" htmlFor="complianceSwitch">{t("Compliance")}</Label>
                                                </div>
                                            </Col>
                                            <Col md={3} className="d-flex align-items-center mt-4">
                                                <div className="form-check form-switch form-switch-success">
                                                    <Input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id="activeSwitch"
                                                        checked={form.active}
                                                        onChange={(e) => handleCheckboxChange("active", e.target.checked)}
                                                    />
                                                    <Label className="form-check-label" htmlFor="activeSwitch">{t("Active")}</Label>
                                                </div>
                                            </Col>
                                            <Col md={3} className="d-flex align-items-center mt-4">
                                                <div className="form-check form-switch form-switch-success">
                                                    <Input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id="emailInvSwitch"
                                                        checked={form.emailInventory}
                                                        onChange={(e) => handleCheckboxChange("emailInventory", e.target.checked)}
                                                    />
                                                    <Label className="form-check-label" htmlFor="emailInvSwitch">{t("Email Inventory")}</Label>
                                                </div>
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    {/* TAB 4: Shipping Details */}
                                    <TabPane tabId="4">
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Shipping Name")}</Label>
                                                    <Input type="text" placeholder={t("Shipping Name")} value={form.shippingName} onChange={(e) => handleTextChange("shippingName", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>{t("Shipping Address 1")}</Label>
                                                    <Input type="text" placeholder={t("Shipping Address 1")} value={form.shippingAddress1} onChange={(e) => handleTextChange("shippingAddress1", e.target.value)} />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("City")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.city).find(opt => opt.value == form.shippingCity) || null}
                                                        onChange={(selected) => handleTextChange("shippingCity", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.city)}
                                                        placeholder={t("Select Shipping City")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("State")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.state).find(opt => opt.value == form.shippingState) || null}
                                                        onChange={(selected) => handleTextChange("shippingState", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.state)}
                                                        placeholder={t("Select Shipping State")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Country")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.country).find(opt => opt.value == form.shippingCountry) || null}
                                                        onChange={(selected) => handleTextChange("shippingCountry", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.country)}
                                                        placeholder={t("Select Shipping Country")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Area")}</Label>
                                                    <Select
                                                        value={selectOptions(dropdowns.area).find(opt => opt.value == form.shippingArea) || null}
                                                        onChange={(selected) => handleTextChange("shippingArea", selected ? selected.value : "")}
                                                        options={selectOptions(dropdowns.area)}
                                                        placeholder={t("Select Shipping Area")}
                                                        isSearchable={true}
                                                        isClearable={true}
                                                        classNamePrefix="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Zipcode")}</Label>
                                                    <Input type="text" placeholder={t("Shipping Zipcode")} value={form.shippingZipcode} onChange={(e) => handleTextChange("shippingZipcode", e.target.value)} />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Shipping Phone")}</Label>
                                                    <Input type="text" placeholder={t("Shipping Phone")} value={form.shippingPhone} onChange={(e) => handleTextChange("shippingPhone", e.target.value)} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>{t("Shipping Fax")}</Label>
                                                    <Input type="text" placeholder={t("Shipping Fax")} value={form.shippingFax} onChange={(e) => handleTextChange("shippingFax", e.target.value)} />
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

export default AccGrpMasterEdit;
