import { APIClient } from "../helpers/api_helper";

const api = new APIClient();

export const getBestSeller = (month = "", year = "", tdate = "") => 
    api.get(`/api/Dashboard/GetBestSeller?month=${month}&year=${year}&tdate=${tdate}`);

export const getTopBrokers = (month = "", year = "", tdate = "") => 
    api.get(`/api/Dashboard/GetTopBrokers?month=${month}&year=${year}&tdate=${tdate}`);

export const getTopCustomers = (month = "", year = "", tdate = "") => 
    api.get(`/api/Dashboard/GetTopCustomers?month=${month}&year=${year}&tdate=${tdate}`);

export const getOverDueSale = () => 
    api.get(`/api/Dashboard/GetOverDueSale`);

export const getOverDuePur = () => 
    api.get(`/api/Dashboard/GetOverDuePur`);

export const getSalesByCountry = (month = "", year = "", tdate = "") => 
    api.get(`/api/Dashboard/GetSalesByCountry?month=${month}&year=${year}&tdate=${tdate}`);

export const getSalePLPerLegend = () => 
    api.get(`/api/Dashboard/GetSalePLPerLegend`);

export const getStoneAge = () => 
    api.get(`/api/Dashboard/GetStoneAge`);

export const getRevisedAge = () => 
    api.get(`/api/Dashboard/GetRevisedAge`);
