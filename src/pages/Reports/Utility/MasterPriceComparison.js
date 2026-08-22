import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import {
    Button,
    Card,
    CardBody,
    Col,
    Container,
    Label,
    Row,
    Spinner
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import {
    getMasterPriceComparisonPermission,
    getMasterPriceComparisonReport
} from "../../../helpers/fakebackend_helper";

const CLARITIES = ["IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "SI3", "I1", "I2", "I3"];
const COLORS = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];

const ISSUE_COLORS = {
    clarity: "#F8BBD0",
    color: "#67baff",
    size: "#ffea35",
    clarityColor: "#E1BEE7",
    claritySize: "#B3E5FC",
    colorSize: "#ffc978",
    all: "#ebe6bb"
};

const LEGEND_ITEMS = [
    { color: ISSUE_COLORS.size, label: "Size" },
    { color: ISSUE_COLORS.color, label: "Color" },
    { color: ISSUE_COLORS.clarity, label: "Clarity" },
    { color: ISSUE_COLORS.colorSize, label: "Size + Color" },
    { color: ISSUE_COLORS.claritySize, label: "Size + Clarity" },
    { color: ISSUE_COLORS.clarityColor, label: "Color + Clarity" },
    { color: ISSUE_COLORS.all, label: "Size + Color + Clarity" }
];

const mapDropdownOptions = (items = []) =>
    items.map(item => ({
        value: item.ID ?? item.id ?? item.Name ?? item.name,
        label: item.ID ?? item.id ?? item.Name ?? item.name
    }));

const selectedValues = (options = []) => (options || []).map(o => o.value);

const getField = (row, key) => {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
    const lower = key.charAt(0).toLowerCase() + key.slice(1);
    if (row?.[lower] !== undefined && row?.[lower] !== null) return row[lower];
    return undefined;
};

const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

const getIssueBg = (issue) => {
    if (issue === 10) return ISSUE_COLORS.clarity;
    if (issue === 100) return ISSUE_COLORS.color;
    if (issue === 1000) return ISSUE_COLORS.size;
    if (issue === 110) return ISSUE_COLORS.clarityColor;
    if (issue === 1010) return ISSUE_COLORS.claritySize;
    if (issue === 1100) return ISSUE_COLORS.colorSize;
    if (issue === 1110) return ISSUE_COLORS.all;
    return "";
};

const buildMatrixGroups = (data = []) => {
    const groups = {};
    data.forEach(r => {
        const key = `${getField(r, "CertId")}_${getField(r, "Shape")}_${getField(r, "Size")}_${getField(r, "CPSID")}_${getField(r, "Flou")}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
    });

    const groupsByPrefix = {};
    Object.keys(groups).forEach(fullKey => {
        const sampleRow = groups[fullKey][0];
        const sizeStr = String(getField(sampleRow, "Size") ?? "");
        const prefix = `${getField(sampleRow, "CertId")}_${getField(sampleRow, "Shape")}_${getField(sampleRow, "CPSID")}_${getField(sampleRow, "Flou")}`;
        let sizeFrom = 0;
        try {
            const m = sizeStr.match(/[\d.]+/);
            sizeFrom = m ? parseFloat(m[0]) : 0;
        } catch {
            sizeFrom = 0;
        }
        if (!groupsByPrefix[prefix]) groupsByPrefix[prefix] = [];
        groupsByPrefix[prefix].push({ key: fullKey, sizeFrom, sizeStr });
    });

    Object.keys(groupsByPrefix).forEach(prefix => {
        groupsByPrefix[prefix].sort((a, b) => a.sizeFrom - b.sizeFrom);
    });

    return Object.keys(groups).map(fullKey => {
        const sampleRow = groups[fullKey][0];
        const prefix = `${getField(sampleRow, "CertId")}_${getField(sampleRow, "Shape")}_${getField(sampleRow, "CPSID")}_${getField(sampleRow, "Flou")}`;
        const sizeList = groupsByPrefix[prefix] || [];
        const myIndex = sizeList.findIndex(x => x.key === fullKey);
        const prevSizeKey = myIndex > 0 ? sizeList[myIndex - 1].key : null;
        const prevSizeGroup = prevSizeKey ? groups[prevSizeKey] : null;

        const colorMap = {};
        groups[fullKey].forEach(r => {
            colorMap[getField(r, "Color")] = r;
        });

        const prevSizeMap = {};
        if (prevSizeGroup) {
            prevSizeGroup.forEach(r => {
                prevSizeMap[getField(r, "Color")] = r;
            });
        }

        const rows = COLORS.map((color, colorIdx) => {
            const row = colorMap[color];
            const cells = CLARITIES.map((cl, clarityIdx) => {
                if (!row) {
                    return { color, clarity: cl, empty: true };
                }

                const disc = toNumber(getField(row, cl));
                const finalMRP = toNumber(getField(row, `DMRP_${cl}`));
                let issue = 0;

                if (clarityIdx > 0) {
                    const prevMRP = toNumber(getField(row, `DMRP_${CLARITIES[clarityIdx - 1]}`));
                    if (finalMRP > prevMRP && prevMRP !== 0 && finalMRP !== 0) issue += 10;
                }

                if (colorIdx > 0) {
                    const prevColorRow = colorMap[COLORS[colorIdx - 1]];
                    if (prevColorRow) {
                        const prevColorMRP = toNumber(getField(prevColorRow, `DMRP_${cl}`));
                        if (finalMRP > prevColorMRP && prevColorMRP !== 0 && finalMRP !== 0) issue += 100;
                    }
                }

                if (prevSizeMap[color]) {
                    const prevSizeMRP = toNumber(getField(prevSizeMap[color], `DMRP_${cl}`));
                    if (finalMRP < prevSizeMRP && prevSizeMRP !== 0 && finalMRP !== 0) issue += 1000;
                }

                return {
                    color,
                    clarity: cl,
                    disc,
                    finalMRP,
                    bgColor: getIssueBg(issue),
                    empty: false
                };
            });

            return { color, cells };
        });

        return {
            key: fullKey,
            title: fullKey.replaceAll("_", " - "),
            rows
        };
    });
};

const MasterPriceComparison = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(true);
    const [busy, setBusy] = useState(false);
    const [dropdowns, setDropdowns] = useState({
        LAB: [],
        Shape: [],
        Size: [],
        CPS: [],
        Fluorescence: []
    });
    const [lab, setLab] = useState([]);
    const [shape, setShape] = useState([]);
    const [size, setSize] = useState([]);
    const [cps, setCps] = useState([]);
    const [fluorescence, setFluorescence] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [hasRun, setHasRun] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null);

    const selectStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: 38,
            backgroundColor: "var(--vz-input-bg, var(--vz-secondary-bg, #fff))",
            borderColor: state.isFocused ? "#80bdff" : "var(--vz-border-color, #ced4da)",
            color: "var(--vz-body-color, #495057)",
            boxShadow: "none"
        }),
        menu: provided => ({
            ...provided,
            zIndex: 20,
            backgroundColor: "var(--vz-secondary-bg, #fff)",
            color: "var(--vz-body-color, #495057)"
        }),
        multiValue: provided => ({
            ...provided,
            backgroundColor: "rgba(38, 60, 85, 0.08)"
        }),
        multiValueLabel: provided => ({
            ...provided,
            color: "#677788",
            fontSize: "0.8125rem"
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused
                ? "var(--vz-tertiary-bg, #f3f6f9)"
                : "transparent",
            color: "var(--vz-body-color, #495057)"
        })
    };

    const matrixBoxes = useMemo(() => buildMatrixGroups(reportData), [reportData]);

    const loadPermission = useCallback(async () => {
        setLoading(true);
        try {
            const permission = await getMasterPriceComparisonPermission();
            if (permission?.success === false) {
                setAuthorized(false);
                toast.error(permission?.message || t("You are not authorized to perform this task."));
                return;
            }

            const dd = permission?.Dropdowns || permission?.dropdowns || {};
            setDropdowns({
                LAB: dd.LAB || dd.lab || [],
                Shape: dd.Shape || dd.shape || [],
                Size: dd.Size || dd.size || [],
                CPS: dd.CPS || dd.cps || [],
                Fluorescence: dd.Fluorescence || dd.fluorescence || []
            });
            setAuthorized(true);
        } catch (err) {
            const status = err?.response?.status || err?.status;
            if (status === 403) {
                setAuthorized(false);
                toast.error(t("You are not authorized to perform this task."));
            } else {
                toast.error(err?.message || t("Error loading Master Price Comparison."));
            }
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadPermission();
    }, [loadPermission]);

    const handleClear = () => {
        setLab([]);
        setShape([]);
        setSize([]);
        setCps([]);
        setFluorescence([]);
        setReportData([]);
        setHasRun(false);
        setSelectedCell(null);
    };

    const handleReport = async () => {
        setBusy(true);
        setSelectedCell(null);
        try {
            const payload = {
                LAB: selectedValues(lab),
                Shape: selectedValues(shape),
                Size: selectedValues(size),
                CPS: selectedValues(cps),
                Fluorescence: selectedValues(fluorescence)
            };

            const response = await getMasterPriceComparisonReport(payload);
            if (response?.success === true || response?.Success === true) {
                const data = response?.Data || response?.data || [];
                setReportData(Array.isArray(data) ? data : []);
                setHasRun(true);
                if (!data?.length) {
                    toast.info(t("No data available for the selected search criteria."));
                }
            } else {
                setReportData([]);
                setHasRun(true);
                toast.error(t("Unable to fetch data. Please try again."));
            }
        } catch (err) {
            setReportData([]);
            setHasRun(true);
            const status = err?.response?.status || err?.status;
            if (status === 403) {
                toast.error(t("You are not authorized to perform this task."));
            } else {
                toast.error(err?.response?.data?.Data || err?.message || t("Unable to fetch data. Please try again."));
            }
        } finally {
            setBusy(false);
        }
    };

    const handleCellClick = (color, clarity) => {
        if (selectedCell?.color === color && selectedCell?.clarity === clarity) {
            setSelectedCell(null);
            return;
        }
        setSelectedCell({ color, clarity });
    };

    const handleExport = () => {
        if (!matrixBoxes.length) {
            toast.error(t("No table found!"));
            return;
        }

        const legendHtml = `
        <table border="0" style="margin-bottom:10px; font-size:12px; color:#727E8C;">
        <tr>
            <td></td>
            <td style="padding:3px 5px; background:#ffea35;">&nbsp;</td><td>Size Only</td>
            <td style="width:10px;"></td>
            <td style="padding:3px 5px; background:#67baff;">&nbsp;</td><td>Color Only</td>
            <td style="width:10px;"></td>
            <td style="padding:3px 5px; background:#F8BBD0;">&nbsp;</td><td>Clarity Only</td>
            <td style="width:10px;"></td>
            <td style="padding:3px 5px; background:#ffc978;">&nbsp;</td><td>Size + Color</td>
            <td style="width:10px;"></td>
            <td style="padding:3px 5px; background:#B3E5FC;">&nbsp;</td><td>Size + Clarity</td>
            <td style="width:10px;"></td>
            <td style="padding:3px 5px; background:#E1BEE7;">&nbsp;</td><td>Color + Clarity</td>
            <td style="width:10px;"></td>
            <td style="padding:3px 5px; background:#ebe6bb;">&nbsp;</td><td>Size + Color + Clarity</td>
        </tr>
        <tr></tr><tr></tr>
        </table>`;

        let excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8"><!--[if gte mso 9]>
    <xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
    <x:Name>Price Comparison</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
    </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
    <body>${legendHtml}<table border="1"><tr>`;

        matrixBoxes.forEach((box, index) => {
            excelHtml += `<td valign="top" style="padding:10px;">`;
            excelHtml += `<div style="text-align:center;"><b>${box.title}</b></div>`;
            excelHtml += `<table style="border-collapse:collapse;">`;
            excelHtml += `<tr><th style="padding:4px; text-align:center;">Color</th>`;
            CLARITIES.forEach(cl => {
                excelHtml += `<th style="padding:4px; text-align:center;">${cl}</th>`;
            });
            excelHtml += `</tr>`;

            box.rows.forEach(row => {
                excelHtml += `<tr><td style="padding:4px; text-align:center;">${row.color}</td>`;
                row.cells.forEach(cell => {
                    if (cell.empty) {
                        excelHtml += `<td style="padding:4px; text-align:right;">-</td>`;
                    } else {
                        excelHtml += `<td style="padding:4px; text-align:right; background-color:${cell.bgColor || "transparent"};">${cell.disc}%<br>${cell.finalMRP}</td>`;
                    }
                });
                excelHtml += `</tr>`;
            });

            excelHtml += `</table></td>`;
            if ((index + 1) % 5 === 0) excelHtml += `</tr><tr></tr><tr>`;
            else excelHtml += `<td style="width:5px; border:none;"></td>`;
        });

        excelHtml += `</tr></table></body></html>`;

        const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "MasterPriceComparison.xls";
        a.click();
        URL.revokeObjectURL(url);
    };

    document.title = `${t("Master Price Comparison")} | ${t("Utility")}`;

    return (
        <React.Fragment>
            <ToastContainer position="top-right" autoClose={2500} />

            <style>{`
                .mpc-matrix-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
                    gap: 20px;
                    justify-content: center;
                }
                .mpc-matrix-box {
                    border: 1px solid var(--vz-border-color, #ccc);
                    border-radius: 8px;
                    padding: 6px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
                    min-width: 0;
                    min-height: 300px;
                    background: var(--vz-secondary-bg, #fff);
                }
                .mpc-matrix-box h6 {
                    font-size: 13px;
                    margin: 0 0 5px 0;
                    padding: 4px;
                    background: var(--vz-tertiary-bg, #dfdfdf);
                    text-align: center;
                    border-radius: 4px;
                    color: var(--vz-body-color, #495057);
                }
                .mpc-matrix-table {
                    border-collapse: collapse;
                    width: 100%;
                    table-layout: fixed;
                }
                .mpc-matrix-table th,
                .mpc-matrix-table td {
                    border: 1px solid var(--vz-border-color, #ddd);
                    text-align: center;
                    padding: 4px;
                    word-wrap: break-word;
                    font-size: 12px;
                }
                .mpc-matrix-table td {
                    text-align: right;
                }
                .mpc-matrix-cell {
                    cursor: pointer;
                }
                .mpc-matrix-cell.selected {
                    background-color: #1E90FF !important;
                    color: white !important;
                }
            `}</style>

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Master Price Comparison")} pageTitle={t("Utility")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <i className="ri-price-tag-3-line fs-20 text-primary" />
                            {t("Master Price Comparison")}
                        </h5>
                        <div className="d-flex flex-wrap gap-2">
                            <Button color="primary" disabled={busy || !authorized} onClick={handleReport}>
                                {busy ? <Spinner size="sm" /> : t("Save")}
                            </Button>
                            <Button color="primary" outline disabled={busy || !authorized} onClick={handleClear}>
                                {t("Clear")}
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5"><Spinner color="primary" /></div>
                    ) : !authorized ? (
                        <Card className="shadow-sm border-0">
                            <CardBody className="text-center text-danger py-5">
                                {t("You are not authorized to perform this task.")}
                            </CardBody>
                        </Card>
                    ) : (
                        <Card className="shadow-sm border-0">
                            <CardBody>
                                <Row className="g-3 align-items-end mb-3">
                                    <Col lg={2} md={4} sm={6}>
                                        <Label className="form-label fw-semibold">{t("LAB")}</Label>
                                        <Select
                                            isMulti
                                            classNamePrefix="react-select"
                                            placeholder={t("LAB")}
                                            options={mapDropdownOptions(dropdowns.LAB)}
                                            value={lab}
                                            onChange={setLab}
                                            styles={selectStyles}
                                        />
                                    </Col>
                                    <Col lg={2} md={4} sm={6}>
                                        <Label className="form-label fw-semibold">{t("Shape")}</Label>
                                        <Select
                                            isMulti
                                            classNamePrefix="react-select"
                                            placeholder={t("Shape")}
                                            options={mapDropdownOptions(dropdowns.Shape)}
                                            value={shape}
                                            onChange={setShape}
                                            styles={selectStyles}
                                        />
                                    </Col>
                                    <Col lg={2} md={4} sm={6}>
                                        <Label className="form-label fw-semibold">{t("Size")}</Label>
                                        <Select
                                            isMulti
                                            classNamePrefix="react-select"
                                            placeholder={t("Size")}
                                            options={mapDropdownOptions(dropdowns.Size)}
                                            value={size}
                                            onChange={setSize}
                                            styles={selectStyles}
                                        />
                                    </Col>
                                    <Col lg={2} md={4} sm={6}>
                                        <Label className="form-label fw-semibold">{t("CPS")}</Label>
                                        <Select
                                            isMulti
                                            classNamePrefix="react-select"
                                            placeholder={t("CPS")}
                                            options={mapDropdownOptions(dropdowns.CPS)}
                                            value={cps}
                                            onChange={setCps}
                                            styles={selectStyles}
                                        />
                                    </Col>
                                    <Col lg={2} md={4} sm={6}>
                                        <Label className="form-label fw-semibold">{t("Flou.")}</Label>
                                        <Select
                                            isMulti
                                            classNamePrefix="react-select"
                                            placeholder={t("Fluorescence")}
                                            options={mapDropdownOptions(dropdowns.Fluorescence)}
                                            value={fluorescence}
                                            onChange={setFluorescence}
                                            styles={selectStyles}
                                        />
                                    </Col>
                                </Row>

                                {hasRun && matrixBoxes.length > 0 ? (
                                    <>
                                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 mb-3">
                                            <div className="d-flex flex-wrap gap-3 align-items-center" style={{ color: "#727E8C", fontSize: 15 }}>
                                                {LEGEND_ITEMS.map(item => (
                                                    <div key={item.label} className="d-flex align-items-center gap-2">
                                                        <div
                                                            style={{
                                                                width: 46,
                                                                height: 21,
                                                                background: item.color,
                                                                borderRadius: 13
                                                            }}
                                                        />
                                                        <span>{t(item.label)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button color="primary" outline onClick={handleExport}>
                                                {t("Excel")}
                                            </Button>
                                        </div>

                                        <div className="mpc-matrix-grid">
                                            {matrixBoxes.map(box => (
                                                <div key={box.key} className="mpc-matrix-box">
                                                    <h6>{box.title}</h6>
                                                    <div style={{ overflow: "auto" }}>
                                                        <table className="mpc-matrix-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>{t("Color")}</th>
                                                                    {CLARITIES.map(cl => (
                                                                        <th key={cl}>{cl}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {box.rows.map(row => (
                                                                    <tr key={`${box.key}-${row.color}`}>
                                                                        <td style={{ textAlign: "center" }}>{row.color}</td>
                                                                        {row.cells.map(cell => {
                                                                            if (cell.empty) {
                                                                                return <td key={`${row.color}-${cell.clarity}`}>-</td>;
                                                                            }
                                                                            const isSelected =
                                                                                selectedCell?.color === cell.color &&
                                                                                selectedCell?.clarity === cell.clarity;
                                                                            return (
                                                                                <td
                                                                                    key={`${row.color}-${cell.clarity}`}
                                                                                    className={`mpc-matrix-cell${isSelected ? " selected" : ""}`}
                                                                                    style={{
                                                                                        background: isSelected ? undefined : cell.bgColor,
                                                                                        textAlign: "right"
                                                                                    }}
                                                                                    onClick={() => handleCellClick(cell.color, cell.clarity)}
                                                                                >
                                                                                    {cell.disc}%
                                                                                    <br />
                                                                                    {cell.finalMRP}
                                                                                </td>
                                                                            );
                                                                        })}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : hasRun ? (
                                    <div className="text-center text-muted py-5">
                                        {t("No data available for the selected search criteria.")}
                                    </div>
                                ) : null}
                            </CardBody>
                        </Card>
                    )}
                </Container>
            </div>

            {busy ? (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ background: "rgba(255,255,255,0.55)", zIndex: 1055 }}
                >
                    <Spinner color="primary" />
                </div>
            ) : null}
        </React.Fragment>
    );
};

export default MasterPriceComparison;
