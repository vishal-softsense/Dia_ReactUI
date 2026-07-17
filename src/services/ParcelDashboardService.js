import { APIClient } from "../helpers/api_helper";

const api = new APIClient();

export const getBestSeller = (month = "", year = "", tdate = "") => 
    api.get(`/api/ParcelDashboard/GetBestSeller?month=${month}&year=${year}&tdate=${tdate}`);

export const getTopBrokers = (month = "", year = "", tdate = "") => 
    api.get(`/api/ParcelDashboard/GetTopBrokers?month=${month}&year=${year}&tdate=${tdate}`);

export const getAllBrokers = (month = "", year = "", tdate = "") => 
    api.get(`/api/ParcelDashboard/GetAllBrokers?month=${month}&year=${year}&tdate=${tdate}`);

export const getTopCustomers = (month = "", year = "", tdate = "") => 
    api.get(`/api/ParcelDashboard/GetTopCustomers?month=${month}&year=${year}&tdate=${tdate}`);

export const getAllCustomers = (month = "", year = "", tdate = "") => 
    api.get(`/api/ParcelDashboard/GetAllCustomers?month=${month}&year=${year}&tdate=${tdate}`);

export const getOverDueSaleCount = () => 
    api.get(`/api/ParcelDashboard/GetOverDueSaleCount`);

export const getOverDuePurCount = () => 
    api.get(`/api/ParcelDashboard/GetOverDuePurCount`);

export const getSalesByCountry = (month = "", year = "", tdate = "") => 
    api.get(`/api/ParcelDashboard/GetSalesByCountry?month=${month}&year=${year}&tdate=${tdate}`);

export const getTopPayable = (month = "", year = "", tdate = "") => 
    api.get(`/api/ParcelDashboard/GetTopPayable?month=${month}&year=${year}&tdate=${tdate}`);

export const getAllPayables = (month = "", year = "", tdate = "") => 
    api.get(`/api/ParcelDashboard/GetAllPayables?month=${month}&year=${year}&tdate=${tdate}`);

export const getTopOutstanding = (month = "", year = "", tdate = "") => 
    api.get(`/api/ParcelDashboard/GetTopOutstanding?month=${month}&year=${year}&tdate=${tdate}`);

export const getAllOutstandings = (month = "", year = "", tdate = "") => 
    api.get(`/api/ParcelDashboard/GetAllOutstandings?month=${month}&year=${year}&tdate=${tdate}`);

export const getTopOpenMemo = (month = "", year = "", tdate = "") => 
    api.get(`/api/ParcelDashboard/GetTopOpenMemo?month=${month}&year=${year}&tdate=${tdate}`);

export const getAllOpenMemos = (month = "", year = "", tdate = "") => 
    api.get(`/api/ParcelDashboard/GetAllOpenMemos?month=${month}&year=${year}&tdate=${tdate}`);

export const getTopOverdueSales = (month = "", year = "", tdate = "") => 
    api.get(`/api/ParcelDashboard/GetTopOverdueSales?month=${month}&year=${year}&tdate=${tdate}`);

export const getAllOverdueSales = (month = "", year = "", tdate = "") => 
    api.get(`/api/ParcelDashboard/GetAllOverdueSales?month=${month}&year=${year}&tdate=${tdate}`);
