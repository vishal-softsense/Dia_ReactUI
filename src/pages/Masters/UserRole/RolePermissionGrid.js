import React, { useState, useEffect } from 'react';
import { Table, Input } from 'reactstrap';
import { useTranslation } from "react-i18next";

const RolePermissionGrid = ({ permissions, onChange, searchTerm = "" }) => {
    const { t } = useTranslation();
    const [gridData, setGridData] = useState([]);

    useEffect(() => {
        if (permissions) {
            setGridData(permissions);
        }
    }, [permissions]);

    const handleCellChange = (formID, field, checked) => {
        const newData = [...gridData];
        const index = newData.findIndex(r => r.formID === formID);
        if (index === -1) return;

        newData[index][field] = checked;

        // If any cell in the row becomes unchecked, 'all' should be false
        if (!checked && field !== 'all') {
            newData[index].all = false;
        }

        // If all cells in the row become checked, 'all' should be true
        if (
            newData[index].select &&
            newData[index].write &&
            newData[index].edit &&
            newData[index].delete &&
            newData[index].navigate
        ) {
            newData[index].all = true;
        }

        setGridData(newData);
        if (onChange) onChange(newData);
    };

    const handleRowAllChange = (formID, checked) => {
        const newData = [...gridData];
        const index = newData.findIndex(r => r.formID === formID);
        if (index === -1) return;

        newData[index] = {
            ...newData[index],
            all: checked,
            select: checked,
            write: checked,
            edit: checked,
            delete: checked,
            navigate: checked
        };
        setGridData(newData);
        if (onChange) onChange(newData);
    };

    const handleColumnAllChange = (field, checked) => {
        const newData = gridData.map((row) => {
            if (field === 'all') {
                return {
                    ...row,
                    all: checked,
                    select: checked,
                    write: checked,
                    edit: checked,
                    delete: checked,
                    navigate: checked
                };
            }

            const updatedRow = { ...row, [field]: checked };
            // Recalculate row 'all' state
            if (
                updatedRow.select &&
                updatedRow.write &&
                updatedRow.edit &&
                updatedRow.delete &&
                updatedRow.navigate
            ) {
                updatedRow.all = true;
            } else {
                updatedRow.all = false;
            }
            return updatedRow;
        });
        setGridData(newData);
        if (onChange) onChange(newData);
    };

    const isColumnAllChecked = (field) => {
        if (gridData.length === 0) return false;
        return gridData.every((row) => row[field]);
    };

    return (
        <div className="table-responsive">
            <Table className="table-bordered table-striped table-hover align-middle mb-0">
                <thead className="table-light">
                    <tr>
                        <th style={{ width: '30%' }}>{t("Form Name")}</th>
                        <th className="text-center">
                            All<br />
                            <Input
                                type="checkbox"
                                checked={isColumnAllChecked('all')}
                                onChange={(e) => handleColumnAllChange('all', e.target.checked)}
                            />
                        </th>
                        <th className="text-center">
                            Select<br />
                            <Input
                                type="checkbox"
                                checked={isColumnAllChecked('select')}
                                onChange={(e) => handleColumnAllChange('select', e.target.checked)}
                            />
                        </th>
                        <th className="text-center">
                            Insert<br />
                            <Input
                                type="checkbox"
                                checked={isColumnAllChecked('write')}
                                onChange={(e) => handleColumnAllChange('write', e.target.checked)}
                            />
                        </th>
                        <th className="text-center">
                            Edit<br />
                            <Input
                                type="checkbox"
                                checked={isColumnAllChecked('edit')}
                                onChange={(e) => handleColumnAllChange('edit', e.target.checked)}
                            />
                        </th>
                        <th className="text-center">
                            Delete<br />
                            <Input
                                type="checkbox"
                                checked={isColumnAllChecked('delete')}
                                onChange={(e) => handleColumnAllChange('delete', e.target.checked)}
                            />
                        </th>
                        <th className="text-center">
                            Navigate<br />
                            <Input
                                type="checkbox"
                                checked={isColumnAllChecked('navigate')}
                                onChange={(e) => handleColumnAllChange('navigate', e.target.checked)}
                            />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {gridData.filter(row => (row.formName || "").toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                        <tr key={row.formID}>
                            <td>{row.formName}</td>
                            <td className="text-center">
                                <Input
                                    type="checkbox"
                                    checked={row.all || false}
                                    onChange={(e) => handleRowAllChange(row.formID, e.target.checked)}
                                />
                            </td>
                            <td className="text-center">
                                <Input
                                    type="checkbox"
                                    checked={row.select || false}
                                    onChange={(e) => handleCellChange(row.formID, 'select', e.target.checked)}
                                />
                            </td>
                            <td className="text-center">
                                <Input
                                    type="checkbox"
                                    checked={row.write || false}
                                    onChange={(e) => handleCellChange(row.formID, 'write', e.target.checked)}
                                />
                            </td>
                            <td className="text-center">
                                <Input
                                    type="checkbox"
                                    checked={row.edit || false}
                                    onChange={(e) => handleCellChange(row.formID, 'edit', e.target.checked)}
                                />
                            </td>
                            <td className="text-center">
                                <Input
                                    type="checkbox"
                                    checked={row.delete || false}
                                    onChange={(e) => handleCellChange(row.formID, 'delete', e.target.checked)}
                                />
                            </td>
                            <td className="text-center">
                                <Input
                                    type="checkbox"
                                    checked={row.navigate || false}
                                    onChange={(e) => handleCellChange(row.formID, 'navigate', e.target.checked)}
                                />
                            </td>
                        </tr>
                    ))}
                    {gridData.length === 0 && (
                        <tr>
                            <td colSpan="7" className="text-center py-4">{t("No permissions data available")}</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
};

export default RolePermissionGrid;
