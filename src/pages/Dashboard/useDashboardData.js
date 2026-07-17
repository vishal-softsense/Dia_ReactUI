import { useState, useEffect, useCallback } from 'react';
import { 
    getBestSeller, getTopBrokers, getTopCustomers, 
    getOverDueSale, getOverDuePur, getSalesByCountry,
    getStoneAge, getRevisedAge, getSalePLPerLegend
} from '../../services/DashboardService';

export const useDashboardData = () => {
    const [filterDate, setFilterDate] = useState({ value: 'Year', label: 'Year' });
    const [bestSeller, setBestSeller] = useState(null);
    const [overdueSale, setOverdueSale] = useState(0);
    const [overduePur, setOverduePur] = useState(0);
    const [topBrokers, setTopBrokers] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [countrySales, setCountrySales] = useState([]);
    const [stoneAge, setStoneAge] = useState([]);
    const [revisedAge, setRevisedAge] = useState([]);
    const [plLegend, setPlLegend] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            let month = "";
            let year = "";
            let tdate = "";
            const today = new Date();

            if (filterDate.value === 'Today') {
                tdate = today.getDate();
                month = today.getMonth() + 1;
                year = today.getFullYear();
            } else if (filterDate.value === 'Yesterday') {
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);
                tdate = yesterday.getDate();
                month = yesterday.getMonth() + 1;
                year = yesterday.getFullYear();
            } else if (filterDate.value === 'Month') {
                month = today.getMonth() + 1;
                year = today.getFullYear();
            } else if (filterDate.value === 'Last Month') {
                const lastMonth = new Date();
                lastMonth.setMonth(today.getMonth() - 1);
                month = lastMonth.getMonth() + 1;
                year = lastMonth.getFullYear();
            } else if (filterDate.value === 'Year') {
                year = today.getFullYear();
            }

            const [bestSellerRes, overdueSaleRes, overduePurRes, brokersRes, customersRes, countryRes, stoneAgeRes, revisedAgeRes, plLegendRes] = await Promise.all([
                getBestSeller(month, year, tdate),
                getOverDueSale(),
                getOverDuePur(),
                getTopBrokers(month, year, tdate),
                getTopCustomers(month, year, tdate),
                getSalesByCountry(month, year, tdate),
                getStoneAge(),
                getRevisedAge(),
                getSalePLPerLegend()
            ]);

            if (bestSellerRes && bestSellerRes.data && bestSellerRes.data.length > 0) {
                setBestSeller(bestSellerRes.data[0]);
            } else {
                setBestSeller(null);
            }

            if (overdueSaleRes && overdueSaleRes.data && overdueSaleRes.data.length > 0) {
                setOverdueSale(Number(overdueSaleRes.data[0].overDueInvoice) || 0);
            } else {
                setOverdueSale(0);
            }

            if (overduePurRes && overduePurRes.data && overduePurRes.data.length > 0) {
                setOverduePur(Number(overduePurRes.data[0].overDueInvoice) || 0);
            } else {
                setOverduePur(0);
            }
            if (brokersRes && brokersRes.data) {
                setTopBrokers(brokersRes.data);
            }
            if (customersRes && customersRes.data) {
                setTopCustomers(customersRes.data);
            }
            if (countryRes && countryRes.data) {
                setCountrySales(countryRes.data);
            }
            if (stoneAgeRes && stoneAgeRes.data) {
                setStoneAge(stoneAgeRes.data);
            }
            if (revisedAgeRes && revisedAgeRes.data) {
                setRevisedAge(revisedAgeRes.data);
            }
            if (plLegendRes && plLegendRes.data) {
                setPlLegend(plLegendRes.data);
            }
            
        } catch (error) {
            console.error("Error fetching dashboard data", error);
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
        overdueSale,
        overduePur,
        topBrokers,
        topCustomers,
        countrySales,
        stoneAge,
        revisedAge,
        plLegend,
        loading,
        handleFilterChange,
        refreshData: fetchData
    };
};
