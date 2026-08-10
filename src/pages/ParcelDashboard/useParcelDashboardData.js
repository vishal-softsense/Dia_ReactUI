import { useState, useEffect, useCallback } from 'react';
import { 
    getBestSeller, getTopBrokers, getTopCustomers, 
    getOverDueSaleCount, getOverDuePurCount, getSalesByCountry,
    getTopPayable, getTopOutstanding, getTopOpenMemo, getTopOverdueSales
} from '../../services/ParcelDashboardService';

const getResponseData = (res) => {
    if (!res) return null;
    
    const hasSuccess = res.success !== undefined ? res.success : res.Success;
    if (hasSuccess) {
        const payload = res.data !== undefined ? res.data : res.Data;
        if (payload !== undefined) return payload;
    }
    
    if (res.data) {
        const innerSuccess = res.data.success !== undefined ? res.data.success : res.data.Success;
        if (innerSuccess) {
            const innerPayload = res.data.data !== undefined ? res.data.data : res.data.Data;
            if (innerPayload !== undefined) return innerPayload;
        }
        if (Array.isArray(res.data)) {
            return res.data;
        }
    }
    
    if (Array.isArray(res)) {
        return res;
    }
    
    return null;
};

export const useParcelDashboardData = () => {
    const [filterDate, setFilterDate] = useState({ value: 'Year', label: 'Year' });
    const [bestSeller, setBestSeller] = useState(null);
    const [overdueSaleCount, setOverdueSaleCount] = useState(0);
    const [overduePurCount, setOverduePurCount] = useState(0);
    const [topBrokers, setTopBrokers] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [countrySales, setCountrySales] = useState([]);
    const [topOpenMemo, setTopOpenMemo] = useState([]);
    const [topOutstanding, setTopOutstanding] = useState([]);
    const [topPayable, setTopPayable] = useState([]);
    const [topOverdue, setTopOverdue] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            let month = "";
            let year = "";
            let tdate = "";
            const today = new Date();

            if (filterDate.value === 'Today') {
                tdate = today.getDate().toString();
                month = (today.getMonth() + 1).toString();
                year = today.getFullYear().toString();
            } else if (filterDate.value === 'Yesterday') {
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);
                tdate = yesterday.getDate().toString();
                month = (yesterday.getMonth() + 1).toString();
                year = yesterday.getFullYear().toString();
            } else if (filterDate.value === 'Week') {
                let curr = new Date();
                let day = curr.getDay();
                let diffToMonday = day === 0 ? -6 : 1 - day;
                let first = new Date(curr);
                first.setDate(curr.getDate() + diffToMonday);
                let last = new Date(first);
                last.setDate(first.getDate() + 6);

                tdate = JSON.stringify({
                    start: first.toISOString().split('T')[0],
                    end: last.toISOString().split('T')[0]
                });
            } else if (filterDate.value === 'Last Week') {
                let curr = new Date();
                let day = curr.getDay();
                let diffToMonday = day === 0 ? -6 : 1 - day;
                let thisWeekMonday = new Date(curr);
                thisWeekMonday.setDate(curr.getDate() + diffToMonday);

                let lastWeekMonday = new Date(thisWeekMonday);
                lastWeekMonday.setDate(thisWeekMonday.getDate() - 7);

                let lastWeekSunday = new Date(lastWeekMonday);
                lastWeekSunday.setDate(lastWeekMonday.getDate() + 6);

                tdate = JSON.stringify({
                    start: lastWeekMonday.toISOString().split('T')[0],
                    end: lastWeekSunday.toISOString().split('T')[0]
                });
            } else if (filterDate.value === 'Month') {
                month = (today.getMonth() + 1).toString();
                year = today.getFullYear().toString();
            } else if (filterDate.value === 'Last Month') {
                const lastMonth = new Date();
                lastMonth.setMonth(today.getMonth() - 1);
                month = (lastMonth.getMonth() + 1).toString();
                year = lastMonth.getFullYear().toString();
            } else if (filterDate.value === 'Quarter') {
                let curr = new Date();
                let y = curr.getFullYear();
                let m = curr.getMonth() + 1;
                let startDate, endDate;

                if (m >= 1 && m <= 3) {
                    startDate = `${y}-01-01`;
                    endDate = `${y}-03-31`;
                } else if (m >= 4 && m <= 6) {
                    startDate = `${y}-04-01`;
                    endDate = `${y}-06-30`;
                } else if (m >= 7 && m <= 9) {
                    startDate = `${y}-07-01`;
                    endDate = `${y}-09-30`;
                } else {
                    startDate = `${y}-10-01`;
                    endDate = `${y}-12-31`;
                }

                tdate = JSON.stringify({
                    start: startDate,
                    end: endDate
                });
            } else if (filterDate.value === 'Year') {
                year = today.getFullYear().toString();
            }

            const [
                bestSellerRes, overdueSaleRes, overduePurRes, brokersRes, 
                customersRes, countryRes, openMemoRes, outstandingRes, 
                payableRes, overdueRes
            ] = await Promise.all([
                getBestSeller(month, year, tdate),
                getOverDueSaleCount(),
                getOverDuePurCount(),
                getTopBrokers(month, year, tdate),
                getTopCustomers(month, year, tdate),
                getSalesByCountry(month, year, tdate),
                getTopOpenMemo(month, year, tdate),
                getTopOutstanding(month, year, tdate),
                getTopPayable(month, year, tdate),
                getTopOverdueSales(month, year, tdate)
            ]);

            const bestSellerData = getResponseData(bestSellerRes);
            if (bestSellerData && bestSellerData.length > 0) {
                setBestSeller(bestSellerData[0]);
            } else {
                setBestSeller(null);
            }

            const overdueSaleData = getResponseData(overdueSaleRes);
            if (overdueSaleData && overdueSaleData.length > 0) {
                setOverdueSaleCount(Number(overdueSaleData[0].overDueInvoice || overdueSaleData[0].overdueInvoice || overdueSaleData[0].overdueInvoiceCount) || 0);
            } else {
                setOverdueSaleCount(0);
            }

            const overduePurData = getResponseData(overduePurRes);
            if (overduePurData && overduePurData.length > 0) {
                setOverduePurCount(Number(overduePurData[0].overDueInvoice || overduePurData[0].overdueInvoice || overduePurData[0].overdueInvoiceCount) || 0);
            } else {
                setOverduePurCount(0);
            }

            setTopBrokers(getResponseData(brokersRes) || []);
            setTopCustomers(getResponseData(customersRes) || []);
            setCountrySales(getResponseData(countryRes) || []);
            setTopOpenMemo(getResponseData(openMemoRes) || []);
            setTopOutstanding(getResponseData(outstandingRes) || []);
            setTopPayable(getResponseData(payableRes) || []);
            setTopOverdue(getResponseData(overdueRes) || []);
            
        } catch (error) {
            console.error("Error fetching parcel dashboard data", error);
        } finally {
            setLoading(false);
        }
    }, [filterDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (selectedOption) => {
        setFilterDate(selectedOption);
    };

    return {
        filterDate,
        bestSeller,
        overdueSaleCount,
        overduePurCount,
        topBrokers,
        topCustomers,
        countrySales,
        topOpenMemo,
        topOutstanding,
        topPayable,
        topOverdue,
        loading,
        handleFilterChange,
        refreshData: fetchData
    };
};
