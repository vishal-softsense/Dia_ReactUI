import { APIClient } from "./api_helper";

import * as url from "./url_helper";

const api = new APIClient();

// Gets the logged in user data from local session
export const getLoggedInUser = () => {
  const user = localStorage.getItem("user");
  if (user) return JSON.parse(user);
  return null;
};

// //is user is logged in
export const isUserAuthenticated = () => {
  return getLoggedInUser() !== null;
};

// Register Method
export const postFakeRegister = data => api.create(url.POST_FAKE_REGISTER, data);

// Login Method
export const postFakeLogin = data => api.create(url.POST_FAKE_LOGIN, data);

// postForgetPwd
export const postFakeForgetPwd = data => api.create(url.POST_FAKE_PASSWORD_FORGET, data);

// Edit profile
export const postJwtProfile = data => api.create(url.POST_EDIT_JWT_PROFILE, data);

export const postFakeProfile = (data) => api.update(url.POST_EDIT_PROFILE + '/' + data.idx, data);

// User Master
export const getUserMasters = () => api.get(url.GET_USER_MASTER_LIST);
export const getUserMasterDetail = id => api.get(`${url.GET_USER_MASTER_DETAIL}/${id}`);
export const addNewUserMaster = data => api.create(url.ADD_USER_MASTER, data);
export const updateUserMaster = data => api.put(`${url.UPDATE_USER_MASTER}/${data.userID}`, data);
export const deleteUserMaster = id => api.delete(`${url.DELETE_USER_MASTER}/${id}`);

// UserRole
export const getUserRoles = () => api.get(url.GET_USER_ROLE_LIST);
export const getUserRoleDetail = id => api.get(`${url.GET_USER_ROLE_DETAIL}/${id}`);
export const addNewUserRole = data => api.create(url.ADD_USER_ROLE, data);
export const updateUserRole = data => api.create(url.UPDATE_USER_ROLE, data); // Uses HttpPost
export const deleteUserRole = id => api.create(`${url.DELETE_USER_ROLE}?id=${id}`); // Uses HttpPost
export const getUserRoleDropdown = () => api.get(url.GET_USER_ROLE_DROPDOWN);

// All Master
export const getAllMasterList = () => api.get(url.GET_ALL_MASTER_LIST);

// Shape Master
export const getShapeMasters = () => api.get(url.GET_SHAPE_MASTER_LIST);
export const getShapeMasterDetail = id => api.get(`${url.GET_SHAPE_MASTER_DETAIL}/${id}`);
export const saveShapeMaster = data => api.create(url.SAVE_SHAPE_MASTER, data);
export const deleteShapeMaster = id => api.create(`${url.DELETE_SHAPE_MASTER}/${id}`);

// Color Master
export const getColorMasters = () => api.get(url.GET_COLOR_MASTER_LIST);
export const getColorMasterDetail = id => api.get(`${url.GET_COLOR_MASTER_DETAIL}/${id}`);
export const saveColorMaster = data => api.create(url.SAVE_COLOR_MASTER, data);
export const deleteColorMaster = id => api.create(`${url.DELETE_COLOR_MASTER}/${id}`);

// Size Master
export const getSizeMasters = () => api.get(url.GET_SIZE_MASTER_LIST);
export const getSizeMasterDetail = id => api.get(`${url.GET_SIZE_MASTER_DETAIL}/${id}`);
export const saveSizeMaster = data => api.create(url.SAVE_SIZE_MASTER, data);
export const deleteSizeMaster = id => api.create(`${url.DELETE_SIZE_MASTER}/${id}`);

// Clarity Master
export const getClarityMasters = () => api.get(url.GET_CLARITY_MASTER_LIST);
export const getClarityMasterDetail = id => api.get(`${url.GET_CLARITY_MASTER_DETAIL}/${id}`);
export const saveClarityMaster = data => api.create(url.SAVE_CLARITY_MASTER, data);
export const deleteClarityMaster = id => api.create(`${url.DELETE_CLARITY_MASTER}/${id}`);

// Sieve Master
export const getSieveMasters = () => api.get(url.GET_SIEVE_MASTER_LIST);
export const getSieveMasterDetail = id => api.get(`${url.GET_SIEVE_MASTER_DETAIL}/${id}`);
export const saveSieveMaster = data => api.create(url.SAVE_SIEVE_MASTER, data);
export const deleteSieveMaster = id => api.create(`${url.DELETE_SIEVE_MASTER}/${id}`);

// Lab Master
export const getLabMasters = () => api.get(url.GET_LAB_MASTER_LIST);
export const getLabMasterDetail = id => api.get(`${url.GET_LAB_MASTER_DETAIL}/${id}`);
export const saveLabMaster = data => api.create(url.SAVE_LAB_MASTER, data);
export const deleteLabMaster = id => api.create(`${url.DELETE_LAB_MASTER}/${id}`);

// Prop Master
export const getPropMasters = () => api.get(url.GET_PROP_MASTER_LIST);
export const getPropMasterDetail = id => api.get(`${url.GET_PROP_MASTER_DETAIL}/${id}`);
export const savePropMaster = data => api.create(url.SAVE_PROP_MASTER, data);
export const deletePropMaster = id => api.create(`${url.DELETE_PROP_MASTER}/${id}`);

// Polish Master
export const getPolishMasters = () => api.get(url.GET_POLISH_MASTER_LIST);
export const getPolishMasterDetail = id => api.get(`${url.GET_POLISH_MASTER_DETAIL}/${id}`);
export const savePolishMaster = data => api.create(url.SAVE_POLISH_MASTER, data);
export const deletePolishMaster = id => api.create(`${url.DELETE_POLISH_MASTER}/${id}`);

// Sym Master
export const getSymMasters = () => api.get(url.GET_SYM_MASTER_LIST);
export const getSymMasterDetail = id => api.get(`${url.GET_SYM_MASTER_DETAIL}/${id}`);
export const saveSymMaster = data => api.create(url.SAVE_SYM_MASTER, data);
export const deleteSymMaster = id => api.create(`${url.DELETE_SYM_MASTER}/${id}`);

// FL Master
export const getFLMasters = () => api.get(url.GET_FL_MASTER_LIST);
export const getFLMasterDetail = id => api.get(`${url.GET_FL_MASTER_DETAIL}/${id}`);
export const saveFLMaster = data => api.create(url.SAVE_FL_MASTER, data);
export const deleteFLMaster = id => api.create(`${url.DELETE_FL_MASTER}/${id}`);

// FLColor Master
export const getFLColorMasters = () => api.get(url.GET_FLCOLOR_MASTER_LIST);
export const getFLColorMasterDetail = id => api.get(`${url.GET_FLCOLOR_MASTER_DETAIL}/${id}`);
export const saveFLColorMaster = data => api.create(url.SAVE_FLCOLOR_MASTER, data);
export const deleteFLColorMaster = id => api.create(`${url.DELETE_FLCOLOR_MASTER}/${id}`);

// Area Master
export const getAreaMasters = () => api.get(url.GET_AREA_MASTER_LIST);
export const getAreaMasterDetail = id => api.get(`${url.GET_AREA_MASTER_DETAIL}/${id}`);
export const saveAreaMaster = data => api.create(url.SAVE_AREA_MASTER, data);
export const deleteAreaMaster = id => api.create(`${url.DELETE_AREA_MASTER}/${id}`);

// City Master
export const getCityMasters = () => api.get(url.GET_CITY_MASTER_LIST);
export const getCityMasterDetail = id => api.get(`${url.GET_CITY_MASTER_DETAIL}/${id}`);
export const saveCityMaster = data => api.create(url.SAVE_CITY_MASTER, data);
export const deleteCityMaster = id => api.create(`${url.DELETE_CITY_MASTER}/${id}`);

// State Master
export const getStateMasters = () => api.get(url.GET_STATE_MASTER_LIST);
export const getStateMasterDetail = id => api.get(`${url.GET_STATE_MASTER_DETAIL}/${id}`);
export const saveStateMaster = data => api.create(url.SAVE_STATE_MASTER, data);
export const deleteStateMaster = id => api.create(`${url.DELETE_STATE_MASTER}/${id}`);

// Country Master
export const getCountryMasters = () => api.get(url.GET_COUNTRY_MASTER_LIST);
export const getCountryMasterDetail = id => api.get(`${url.GET_COUNTRY_MASTER_DETAIL}/${id}`);
export const saveCountryMaster = data => api.create(url.SAVE_COUNTRY_MASTER, data);
export const deleteCountryMaster = id => api.create(`${url.DELETE_COUNTRY_MASTER}/${id}`);

// Term Master
export const getTermMasters = () => api.get(url.GET_TERM_MASTER_LIST);
export const getTermMasterDetail = id => api.get(`${url.GET_TERM_MASTER_DETAIL}/${id}`);
export const saveTermMaster = data => api.create(url.SAVE_TERM_MASTER, data);
export const deleteTermMaster = id => api.create(`${url.DELETE_TERM_MASTER}/${id}`);

// Type Master
export const getTypeMasters = () => api.get(url.GET_TYPE_MASTER_LIST);
export const getTypeMasterDetail = id => api.get(`${url.GET_TYPE_MASTER_DETAIL}/${id}`);
export const saveTypeMaster = data => api.create(url.SAVE_TYPE_MASTER, data);
export const deleteTypeMaster = id => api.create(`${url.DELETE_TYPE_MASTER}/${id}`);

// SubType Master
export const getSubTypeMasters = () => api.get(url.GET_SUBTYPE_MASTER_LIST);
export const getSubTypeMasterDetail = id => api.get(`${url.GET_SUBTYPE_MASTER_DETAIL}/${id}`);
export const saveSubTypeMaster = data => api.create(url.SAVE_SUBTYPE_MASTER, data);
export const deleteSubTypeMaster = id => api.create(`${url.DELETE_SUBTYPE_MASTER}/${id}`);

// Currency Master
export const getCurrencyMasters = () => api.get(url.GET_CURRENCY_MASTER_LIST);
export const getCurrencyMasterDetail = id => api.get(`${url.GET_CURRENCY_MASTER_DETAIL}/${id}`);

// Mines Master
export const getMinesMasters = () => api.get(url.GET_MINES_MASTER_LIST);
export const getMinesMasterDetail = id => api.get(`${url.GET_MINES_MASTER_DETAIL}/${id}`);
export const saveMinesMaster = data => api.create(url.SAVE_MINES_MASTER, data);
export const deleteMinesMaster = id => api.create(`${url.DELETE_MINES_MASTER}/${id}`);

// Rough Master
export const getRoughMasters = () => api.get(url.GET_ROUGH_MASTER_LIST);
export const getRoughMasterDetail = id => api.get(`${url.GET_ROUGH_MASTER_DETAIL}/${id}`);
export const saveRoughMaster = data => api.create(url.SAVE_ROUGH_MASTER, data);
export const deleteRoughMaster = id => api.create(`${url.DELETE_ROUGH_MASTER}/${id}`);

// Jewellery Category Master
export const getJewCategoryMasters = () => api.get(url.GET_JEW_CATEGORY_MASTER_LIST);
export const getJewCategoryMasterDetail = id => api.get(`${url.GET_JEW_CATEGORY_MASTER_DETAIL}/${id}`);
export const saveJewCategoryMaster = data => api.create(url.SAVE_JEW_CATEGORY_MASTER, data);
export const deleteJewCategoryMaster = id => api.create(`${url.DELETE_JEW_CATEGORY_MASTER}/${id}`);

// Jewellery SubCategory Master
export const getJewSubCategoryMasters = () => api.get(url.GET_JEW_SUBCATEGORY_MASTER_LIST);
export const getJewSubCategoryMasterDetail = id => api.get(`${url.GET_JEW_SUBCATEGORY_MASTER_DETAIL}/${id}`);
export const saveJewSubCategoryMaster = data => api.create(url.SAVE_JEW_SUBCATEGORY_MASTER, data);
export const deleteJewSubCategoryMaster = id => api.create(`${url.DELETE_JEW_SUBCATEGORY_MASTER}/${id}`);

// Jewellery Metal Master
export const getJewMetalMasters = () => api.get(url.GET_JEW_METAL_MASTER_LIST);
export const getJewMetalMasterDetail = id => api.get(`${url.GET_JEW_METAL_MASTER_DETAIL}/${id}`);
export const saveJewMetalMaster = data => api.create(url.SAVE_JEW_METAL_MASTER, data);
export const deleteJewMetalMaster = id => api.create(`${url.DELETE_JEW_METAL_MASTER}/${id}`);
export const getJewMetalMastersPurity = (metalType) => api.get(`${url.GET_JEW_PURITY_BY_METAL}?metalType=${encodeURIComponent(metalType)}`);

// Jewellery Metal Purity Master
export const getJewMetalPurityMasters = () => api.get(url.GET_JEW_METAL_PURITY_MASTER_LIST);
export const getJewMetalPurityMasterDetail = id => api.get(`${url.GET_JEW_METAL_PURITY_MASTER_DETAIL}/${id}`);
export const saveJewMetalPurityMaster = data => api.create(url.SAVE_JEW_METAL_PURITY_MASTER, data);
export const deleteJewMetalPurityMaster = id => api.create(`${url.DELETE_JEW_METAL_PURITY_MASTER}/${id}`);

// Jewellery Color Master
export const getJewColorMasters = () => api.get(url.GET_JEW_COLOR_MASTER_LIST);
export const getJewColorMasterDetail = id => api.get(`${url.GET_JEW_COLOR_MASTER_DETAIL}/${id}`);
export const saveJewColorMaster = data => api.create(url.SAVE_JEW_COLOR_MASTER, data);
export const deleteJewColorMaster = id => api.create(`${url.DELETE_JEW_COLOR_MASTER}/${id}`);


// Brown Master
export const getBrownMasters = () => api.get(url.GET_BROWN_MASTER_LIST);
export const getBrownMasterDetail = id => api.get(`${url.GET_BROWN_MASTER_DETAIL}/${id}`);
export const saveBrownMaster = data => api.create(url.SAVE_BROWN_MASTER, data);
export const deleteBrownMaster = id => api.create(`${url.DELETE_BROWN_MASTER}/${id}`);

// Green Master
export const getGreenMasters = () => api.get(url.GET_GREEN_MASTER_LIST);
export const getGreenMasterDetail = id => api.get(`${url.GET_GREEN_MASTER_DETAIL}/${id}`);
export const saveGreenMaster = data => api.create(url.SAVE_GREEN_MASTER, data);
export const deleteGreenMaster = id => api.create(`${url.DELETE_GREEN_MASTER}/${id}`);

// Milky Master
export const getMilkyMasters = () => api.get(url.GET_MILKY_MASTER_LIST);
export const getMilkyMasterDetail = id => api.get(`${url.GET_MILKY_MASTER_DETAIL}/${id}`);
export const saveMilkyMaster = data => api.create(url.SAVE_MILKY_MASTER, data);
export const deleteMilkyMaster = id => api.create(`${url.DELETE_MILKY_MASTER}/${id}`);

// Luster Master
export const getLusterMasters = () => api.get(url.GET_LUSTER_MASTER_LIST);
export const getLusterMasterDetail = id => api.get(`${url.GET_LUSTER_MASTER_DETAIL}/${id}`);
export const saveLusterMaster = data => api.create(url.SAVE_LUSTER_MASTER, data);
export const deleteLusterMaster = id => api.create(`${url.DELETE_LUSTER_MASTER}/${id}`);

// Natts Master
export const getNattsMasters = () => api.get(url.GET_NATTS_MASTER_LIST);
export const getNattsMasterDetail = id => api.get(`${url.GET_NATTS_MASTER_DETAIL}/${id}`);
export const saveNattsMaster = data => api.create(url.SAVE_NATTS_MASTER, data);
export const deleteNattsMaster = id => api.create(`${url.DELETE_NATTS_MASTER}/${id}`);

// HA Master
export const getHAMasters = () => api.get(url.GET_HA_MASTER_LIST);
export const getHAMasterDetail = id => api.get(`${url.GET_HA_MASTER_DETAIL}/${id}`);
export const saveHAMaster = data => api.create(url.SAVE_HA_MASTER, data);
export const deleteHAMaster = id => api.create(`${url.DELETE_HA_MASTER}/${id}`);

// Shade Master
export const getShadeMasters = () => api.get(url.GET_SHADE_MASTER_LIST);
export const getShadeMasterDetail = id => api.get(`${url.GET_SHADE_MASTER_DETAIL}/${id}`);
export const saveShadeMaster = data => api.create(url.SAVE_SHADE_MASTER, data);
export const deleteShadeMaster = id => api.create(`${url.DELETE_SHADE_MASTER}/${id}`);

// Sidebar Menu
export const getSidebarMenu = () => api.get(url.GET_SIDEBAR_MENU);

// Role Permissions
export const getRolePermissions = id => api.get(`${url.GET_ROLE_PERMISSIONS}?id=${id}`);
export const saveRolePermissions = (id, data) => api.create(`${url.SAVE_ROLE_PERMISSIONS}?id=${id}`, data);

export const getUserDropdown = () => api.get(url.GET_USER_MASTER_DROPDOWN);

// Register Method
export const postJwtRegister = (url, data) => {
  return api.create(url, data)
    .catch(err => {
      var message;
      if (err.response && err.response.status) {
        switch (err.response.status) {
          case 404:
            message = "Sorry! the page you are looking for could not be found";
            break;
          case 500:
            message = "Sorry! something went wrong, please contact our support team";
            break;
          case 401:
            message = err.response.data?.message || err.response.data?.Message || "Invalid credentials";
            break;
          default:
            message = err[1];
            break;
        }
      }
      throw message;
    });
};

// Login Method
export const postJwtLogin = data => api.create(url.POST_FAKE_JWT_LOGIN, data);
export const postApiLogin = data => api.create(url.POST_API_LOGIN, data);

// postForgetPwd
export const postJwtForgetPwd = data => api.create(url.POST_FAKE_JWT_PASSWORD_FORGET, data);

// postSocialLogin
export const postSocialLogin = data => api.create(url.SOCIAL_LOGIN, data);

// Calendar
// get Events
export const getEvents = () => api.get(url.GET_EVENTS);

// get Events
export const getCategories = () => api.get(url.GET_CATEGORIES);

// get Upcomming Events
export const getUpCommingEvent = () => api.get(url.GET_UPCOMMINGEVENT);

// add Events
export const addNewEvent = event => api.create(url.ADD_NEW_EVENT, event);

// update Event
export const updateEvent = event => api.put(url.UPDATE_EVENT, event);

// delete Event
export const deleteEvent = event => api.delete(url.DELETE_EVENT, { headers: { event } });

// Chat
// get Contact
export const getDirectContact = () => api.get(url.GET_DIRECT_CONTACT);

// get Messages
export const getMessages = roomId => api.get(`${url.GET_MESSAGES}/${roomId}`, { params: { roomId } });

// add Message
export const addMessage = message => api.create(url.ADD_MESSAGE, message);

// add Message
export const deleteMessage = message => api.delete(url.DELETE_MESSAGE, { headers: { message } });

// get Channels
export const getChannels = () => api.get(url.GET_CHANNELS);

// MailBox
//get Mail
export const getMailDetails = () => api.get(url.GET_MAIL_DETAILS);

// delete Mail
export const deleteMail = forId => api.delete(url.DELETE_MAIL, { headers: { forId } });

// Ecommerce
// get Products
export const getProducts = () => api.get(url.GET_PRODUCTS);

// delete Product
export const deleteProducts = product => api.delete(url.DELETE_PRODUCT + '/' + product);

// add Products
export const addNewProduct = product => api.create(url.ADD_NEW_PRODUCT, product);

// update Products
export const updateProduct = product => api.update(url.UPDATE_PRODUCT + '/' + product._id, product);

// get Orders
export const getOrders = () => api.get(url.GET_ORDERS);

// add Order
export const addNewOrder = order => api.create(url.ADD_NEW_ORDER, order);

// update Order
export const updateOrder = order => api.update(url.UPDATE_ORDER + '/' + order._id, order);

// delete Order
export const deleteOrder = order => api.delete(url.DELETE_ORDER + '/' + order);

// get Customers
export const getCustomers = () => api.get(url.GET_CUSTOMERS);

// add Customers
export const addNewCustomer = customer => api.create(url.ADD_NEW_CUSTOMER, customer);

// update Customers
export const updateCustomer = customer => api.update(url.UPDATE_CUSTOMER + '/' + customer._id, customer);

// delete Customers
export const deleteCustomer = customer => api.delete(url.DELETE_CUSTOMER + '/' + customer);

// get Sellers
export const getSellers = () => api.get(url.GET_SELLERS);

// Project
// get Project list 
export const getProjectList = () => api.get(url.GET_PROJECT_LIST);

// Tasks
// get Task
export const getTaskList = () => api.get(url.GET_TASK_LIST);

// add Task
export const addNewTask = task => api.create(url.ADD_NEW_TASK, task);

// update Task
export const updateTask = task => api.update(url.UPDATE_TASK + '/' + task._id, task);

// delete Task
export const deleteTask = task => api.delete(url.DELETE_TASK + '/' + task);

// Kanban Board
export const getTasks = () => api.get(url.GET_TASKS);
export const addNewTasks = (card) => api.create(url.ADD_TASKS, card)
export const updateTasks = (card) => api.put(url.UPDATE_TASKS, card)
export const deleteTasks = (card) => api.delete(url.DELETE_TASKS, { headers: { card } })

// CRM
// get Contacts
export const getContacts = () => api.get(url.GET_CONTACTS);

// add Contact
export const addNewContact = contact => api.create(url.ADD_NEW_CONTACT, contact);

// update Contact
export const updateContact = contact => api.update(url.UPDATE_CONTACT + '/' + contact._id, contact);

// delete Contact
export const deleteContact = contact => api.delete(url.DELETE_CONTACT + '/' + contact);

// get Companies
export const getCompanies = () => api.get(url.GET_COMPANIES);

// add Companies
export const addNewCompanies = company => api.create(url.ADD_NEW_COMPANIES, company);

// update Companies
export const updateCompanies = company => api.update(url.UPDATE_COMPANIES + '/' + company._id, company);

// delete Companies
export const deleteCompanies = company => api.delete(url.DELETE_COMPANIES + '/' + company);

// get Deals
export const getDeals = () => api.get(url.GET_DEALS);

// get Leads
export const getLeads = () => api.get(url.GET_LEADS);

// add Lead
export const addNewLead = lead => api.create(url.ADD_NEW_LEAD, lead);

// update Lead
export const updateLead = lead => api.update(url.UPDATE_LEAD + '/' + lead._id, lead);

// delete Lead
export const deleteLead = lead => api.delete(url.DELETE_LEAD + '/' + lead);

// Crypto
// Transation
export const getTransationList = () => api.get(url.GET_TRANSACTION_LIST);

// Order List
export const getOrderList = () => api.get(url.GET_ORDRER_LIST);

// Invoice
//get Invoice
export const getInvoices = () => api.get(url.GET_INVOICES);

// add Invoice
export const addNewInvoice = invoice => api.create(url.ADD_NEW_INVOICE, invoice);

// update Invoice
export const updateInvoice = invoice => api.update(url.UPDATE_INVOICE + '/' + invoice._id, invoice);

// delete Invoice
export const deleteInvoice = invoice => api.delete(url.DELETE_INVOICE + '/' + invoice);

// Support Tickets 
// Tickets
export const getTicketsList = () => api.get(url.GET_TICKETS_LIST);

// add Tickets 
export const addNewTicket = ticket => api.create(url.ADD_NEW_TICKET, ticket);

// update Tickets 
export const updateTicket = ticket => api.update(url.UPDATE_TICKET + '/' + ticket._id, ticket);

// delete Tickets 
export const deleteTicket = ticket => api.delete(url.DELETE_TICKET + '/' + ticket);

// Dashboard Analytics

// Sessions by Countries
export const getAllData = () => api.get(url.GET_ALL_DATA);
export const getHalfYearlyData = () => api.get(url.GET_HALFYEARLY_DATA);
export const getMonthlyData = () => api.get(url.GET_MONTHLY_DATA);

// Audiences Metrics
export const getAllAudiencesMetricsData = () => api.get(url.GET_ALLAUDIENCESMETRICS_DATA);
export const getMonthlyAudiencesMetricsData = () => api.get(url.GET_MONTHLYAUDIENCESMETRICS_DATA);
export const getHalfYearlyAudiencesMetricsData = () => api.get(url.GET_HALFYEARLYAUDIENCESMETRICS_DATA);
export const getYearlyAudiencesMetricsData = () => api.get(url.GET_YEARLYAUDIENCESMETRICS_DATA);

// Users by Device
export const getTodayDeviceData = () => api.get(url.GET_TODAYDEVICE_DATA);
export const getLastWeekDeviceData = () => api.get(url.GET_LASTWEEKDEVICE_DATA);
export const getLastMonthDeviceData = () => api.get(url.GET_LASTMONTHDEVICE_DATA);
export const getCurrentYearDeviceData = () => api.get(url.GET_CURRENTYEARDEVICE_DATA);

// Audiences Sessions by Country
export const getTodaySessionData = () => api.get(url.GET_TODAYSESSION_DATA);
export const getLastWeekSessionData = () => api.get(url.GET_LASTWEEKSESSION_DATA);
export const getLastMonthSessionData = () => api.get(url.GET_LASTMONTHSESSION_DATA);
export const getCurrentYearSessionData = () => api.get(url.GET_CURRENTYEARSESSION_DATA);

// Dashboard CRM

// Balance Overview
export const getTodayBalanceData = () => api.get(url.GET_TODAYBALANCE_DATA);
export const getLastWeekBalanceData = () => api.get(url.GET_LASTWEEKBALANCE_DATA);
export const getLastMonthBalanceData = () => api.get(url.GET_LASTMONTHBALANCE_DATA);
export const getCurrentYearBalanceData = () => api.get(url.GET_CURRENTYEARBALANCE_DATA);

// Dial Type
export const getTodayDealData = () => api.get(url.GET_TODAYDEAL_DATA);
export const getWeeklyDealData = () => api.get(url.GET_WEEKLYDEAL_DATA);
export const getMonthlyDealData = () => api.get(url.GET_MONTHLYDEAL_DATA);
export const getYearlyDealData = () => api.get(url.GET_YEARLYDEAL_DATA);

// Sales Forecast
export const getOctSalesData = () => api.get(url.GET_OCTSALES_DATA);
export const getNovSalesData = () => api.get(url.GET_NOVSALES_DATA);
export const getDecSalesData = () => api.get(url.GET_DECSALES_DATA);
export const getJanSalesData = () => api.get(url.GET_JANSALES_DATA);

// Dashboard Ecommerce
// Revenue
export const getAllRevenueData = () => api.get(url.GET_ALLREVENUE_DATA);
export const getMonthRevenueData = () => api.get(url.GET_MONTHREVENUE_DATA);
export const getHalfYearRevenueData = () => api.get(url.GET_HALFYEARREVENUE_DATA);
export const getYearRevenueData = () => api.get(url.GET_YEARREVENUE_DATA);


// Dashboard Crypto
// Portfolio
export const getBtcPortfolioData = () => api.get(url.GET_BTCPORTFOLIO_DATA);
export const getUsdPortfolioData = () => api.get(url.GET_USDPORTFOLIO_DATA);
export const getEuroPortfolioData = () => api.get(url.GET_EUROPORTFOLIO_DATA);

// Market Graph
export const getAllMarketData = () => api.get(url.GET_ALLMARKETDATA_DATA);
export const getYearMarketData = () => api.get(url.GET_YEARMARKET_DATA);
export const getMonthMarketData = () => api.get(url.GET_MONTHMARKET_DATA);
export const getWeekMarketData = () => api.get(url.GET_WEEKMARKET_DATA);
export const getHourMarketData = () => api.get(url.GET_HOURMARKET_DATA);

// Dashboard Project
// Project Overview
export const getAllProjectData = () => api.get(url.GET_ALLPROJECT_DATA);
export const getMonthProjectData = () => api.get(url.GET_MONTHPROJECT_DATA);
export const gethalfYearProjectData = () => api.get(url.GET_HALFYEARPROJECT_DATA);
export const getYearProjectData = () => api.get(url.GET_YEARPROJECT_DATA);

// Project Status
export const getAllProjectStatusData = () => api.get(url.GET_ALLPROJECTSTATUS_DATA);
export const getWeekProjectStatusData = () => api.get(url.GET_WEEKPROJECTSTATUS_DATA);
export const getMonthProjectStatusData = () => api.get(url.GET_MONTHPROJECTSTATUS_DATA);
export const getQuarterProjectStatusData = () => api.get(url.GET_QUARTERPROJECTSTATUS_DATA);

// Dashboard NFT
// Marketplace
export const getAllMarketplaceData = () => api.get(url.GET_ALLMARKETPLACE_DATA);
export const getMonthMarketplaceData = () => api.get(url.GET_MONTHMARKETPLACE_DATA);
export const gethalfYearMarketplaceData = () => api.get(url.GET_HALFYEARMARKETPLACE_DATA);
export const getYearMarketplaceData = () => api.get(url.GET_YEARMARKETPLACE_DATA);

// Project
export const addProjectList = (project) => api.create(url.ADD_NEW_PROJECT, project);
export const updateProjectList = (project) => api.put(url.UPDATE_PROJECT, project);
export const deleteProjectList = (project) => api.delete(url.DELETE_PROJECT, { headers: { project } });

// Pages > Team
export const getTeamData = (team) => api.get(url.GET_TEAMDATA, team);
export const deleteTeamData = (team) => api.delete(url.DELETE_TEAMDATA, { headers: { team } });
export const addTeamData = (team) => api.create(url.ADD_NEW_TEAMDATA, team);
export const updateTeamData = (team) => api.put(url.UPDATE_TEAMDATA, team);

// File Manager

// Folder
export const getFolders = (folder) => api.get(url.GET_FOLDERS, folder);
export const deleteFolder = (folder) => api.delete(url.DELETE_FOLDER, { headers: { folder } });
export const addNewFolder = (folder) => api.create(url.ADD_NEW_FOLDER, folder);
export const updateFolder = (folder) => api.put(url.UPDATE_FOLDER, folder);

// File
export const getFiles = (file) => api.get(url.GET_FILES, file);
export const deleteFile = (file) => api.delete(url.DELETE_FILE, { headers: { file } });
export const addNewFile = (file) => api.create(url.ADD_NEW_FILE, file);
export const updateFile = (file) => api.put(url.UPDATE_FILE, file);

// To Do
export const getTodos = (todo) => api.get(url.GET_TODOS, todo);
export const deleteTodo = (todo) => api.delete(url.DELETE_TODO, { headers: { todo } });
export const addNewTodo = (todo) => api.create(url.ADD_NEW_TODO, todo);
export const updateTodo = (todo) => api.put(url.UPDATE_TODO, todo);

// To do Project
export const getProjects = (project) => api.get(url.GET_PROJECTS, project);
export const addNewProject = (project) => api.create(url.ADD_NEW_TODO_PROJECT, project);

//Job Application
export const getJobApplicationList = () => api.get(url.GET_APPLICATION_LIST);

//API Key
export const getAPIKey = () => api.get(url.GET_API_KEY);

// Parcel Item Master
export const getParcelItemMasters = (filter) => api.get(url.GET_PARCEL_ITEM_MASTER_LIST + (filter ? `?filter=${filter}` : ""));
export const getParcelItemMasterDropdowns = () => api.get(url.GET_PARCEL_ITEM_MASTER_DROPDOWNS);
export const getParcelItemMasterDetail = id => api.get(`${url.GET_PARCEL_ITEM_MASTER_DETAIL}/${id}`);
export const checkLotNoExists = lotNo => api.get(`${url.CHECK_LOT_NO_EXISTS}?lotNo=${lotNo}`);
export const addParcelItemMaster = data => api.create(url.ADD_PARCEL_ITEM_MASTER, data);
export const updateParcelItemMaster = (id, data) => api.put(`${url.UPDATE_PARCEL_ITEM_MASTER}/${id}`, data);
export const deleteParcelItemMaster = id => api.delete(`${url.DELETE_PARCEL_ITEM_MASTER}/${id}`);

// Solitaire Item Master
export const getSolitaireItemMasters = (filter) => api.get(url.GET_SOLITAIRE_ITEM_MASTER_LIST + (filter ? `?filter=${filter}` : ""));

// Solitaire Purchase entry
export const getSolitairePurchaseList = () => api.get(url.SOLITAIRE_PURCHASE_LIST);
export const getSolitairePurchasePageData = () => api.get(url.SOLITAIRE_PURCHASE_PAGE_DATA);
export const getSolitairePurchaseDetail = (id) => api.get(`${url.SOLITAIRE_PURCHASE_DETAIL}/${id}`);
export const addSolitairePurchase = (data) => api.create(url.SOLITAIRE_PURCHASE_ADD, data);
export const editSolitairePurchase = (data) => api.create(url.SOLITAIRE_PURCHASE_EDIT, data);
export const deleteSolitairePurchase = (id) => api.create(url.SOLITAIRE_PURCHASE_DELETE, { id });
export const getSolitairePurchaseLotDetail = (lotNo) => api.create(url.SOLITAIRE_PURCHASE_LOT_DETAIL, { lotNo });
export const getSolitairePurchaseConsignment = (payload) => api.create(url.SOLITAIRE_PURCHASE_CONSIGNMENT, payload);
export const addSolitairePurchaseSingleLot = (payload) => api.create(url.SOLITAIRE_PURCHASE_ADD_SINGLE_LOT, payload);
export const getSolitairePurchasePrintView = (invNo) => api.get(`${url.SOLITAIRE_PURCHASE_PRINT_VIEW}/${invNo}`);
export const getSolitairePurchaseCurrentStatus = (invNo) => api.get(`${url.SOLITAIRE_PURCHASE_CURRENT_STATUS}/${invNo}`);
export const getSolitaireItemMasterDropdowns = () => api.get(url.GET_SOLITAIRE_ITEM_MASTER_DROPDOWNS);
export const getSolitaireItemMasterDetail = id => api.get(`${url.GET_SOLITAIRE_ITEM_MASTER_DETAIL}/${id}`);
export const checkSolitaireLotNoExists = lotNo => api.get(`${url.CHECK_SOLITAIRE_LOT_NO_EXISTS}?lotNo=${lotNo}`);
export const addSolitaireItemMaster = data => api.create(url.ADD_SOLITAIRE_ITEM_MASTER, data);
export const updateSolitaireItemMaster = (id, data) => api.put(`${url.UPDATE_SOLITAIRE_ITEM_MASTER}/${id}`, data);
export const deleteSolitaireItemMaster = id => api.delete(`${url.DELETE_SOLITAIRE_ITEM_MASTER}/${id}`);
export const previewSolitaireItem = data => api.create(url.PREVIEW_SOLITAIRE_ITEM, data);


// Jew Stock Master (Mounting)
export const getMountingStockList = (filter) => api.get(url.GET_MOUNTING_STOCK_LIST + (filter ? `?filter=${filter}` : ""));
export const getMountingStock = () => api.get(url.GET_MOUNTING_STOCK);
export const getMountingStockDetail = id => api.get(`${url.GET_MOUNTING_STOCK_DETAIL}/${id}`);
export const getJewMetalMaster = () => api.get(url.GET_JEW_METAL_MASTER);
export const getJewColorMaster = () => api.get(url.GET_JEW_COLOR_MASTER);
export const getJewPurity = (metalType) => api.get(`${url.GET_JEW_PURITY}?metalType=${encodeURIComponent(metalType)}`);
export const getPureRatio = (metalType, metalPurity) => api.get(`${url.GET_PURE_RATIO}?metalType=${encodeURIComponent(metalType)}&metalPurity=${encodeURIComponent(metalPurity)}`);
export const getJewCategoryDropdown = () => api.get(url.GET_JEW_CATEGORY);
export const getJewSubCategory = () => api.get(url.GET_JEW_SUBCATEGORY);
export const getJewSettingType = () => api.get(url.GET_JEW_SETTING_TYPE);
export const getAddMountingStockData = () => api.get(url.GET_ADD_MOUNTING_STOCK_DATA);
export const saveMountingStock = data => api.create(url.SAVE_MOUNTING_STOCK, data);
export const deleteMountingStock = id => api.delete(`${url.DELETE_MOUNTING_STOCK}/${id}`);
export const addMountingItemInGrid = data => api.create(url.ADD_MOUNTING_ITEM_IN_GRID, data);
export const deleteMountingItemFromGrid = index => api.create(url.DELETE_MOUNTING_ITEM_FROM_GRID, index);
export const getNextMountingStockId = designId => api.get(`${url.GET_NEXT_MOUNTING_STOCK_ID}?designId=${encodeURIComponent(designId)}`);
export const getMountingStockDropdown = (category, actionType = "") => api.get(`${url.GET_MOUNTING_STOCK_DROPDOWN}?category=${encodeURIComponent(category)}&actionType=${encodeURIComponent(actionType)}`);
export const getAllLotNoList = (searchby, stoneType) => api.get(`${url.GET_ALL_LOTNO_LIST}?searchby=${encodeURIComponent(searchby)}&stoneType=${encodeURIComponent(stoneType)}`);
export const getSolitaireLots = (searchby) => api.get(`${url.GET_SOLITAIRE_LOTS}${searchby ? `?searchby=${encodeURIComponent(searchby)}` : ""}`);

// Account Group Master
export const getAccGrpMasters = (filter) => api.get(url.GET_ACC_GRP_MASTER_LIST + (filter ? `?filter=${filter}` : ""));
export const getAccGrpMasterDropdowns = () => api.get(url.GET_ACC_GRP_MASTER_DROPDOWNS);
export const getAccGrpMasterDetail = id => api.get(`${url.GET_ACC_GRP_MASTER_DETAIL}/${id}`);
export const checkAccGrpNameExists = (name, excludeId) => api.get(`${url.CHECK_ACC_GRP_NAME_EXISTS}?name=${encodeURIComponent(name)}${excludeId ? `&excludeId=${excludeId}` : ""}`);
export const getCurrencyRates = code => api.get(`${url.GET_CURRENCY_RATES}/${code}`);
export const addAccGrpMaster = data => api.create(url.ADD_ACC_GRP_MASTER, data);
export const updateAccGrpMaster = (id, data) => api.put(`${url.UPDATE_ACC_GRP_MASTER}/${id}`, data);
export const deleteAccGrpMaster = id => api.delete(`${url.DELETE_ACC_GRP_MASTER}/${id}`);
export const getAccEffCode = accType => api.get(`${url.GET_ACC_EFF_CODE}/${accType}`);
export const getAccEffSide = accType => api.get(`${url.GET_ACC_EFF_SIDE}/${accType}`);

// Settings
export const getSettingData = () => api.get(url.GET_SETTING_DATA);
export const filterSettingData = (groupId) => api.get(`${url.FILTER_SETTING_DATA}?groupId=${encodeURIComponent(groupId)}`);
export const submitSettingData = (data) => api.create(url.SUBMIT_SETTING_DATA, data);
export const getSettingDetail = (id, name) => api.get(`${url.GET_SETTING_DETAIL}?id=${id}&name=${encodeURIComponent(name)}`);
export const deleteSetting = (id) => api.create(`${url.DELETE_SETTING}?id=${id}`);
export const uploadCompanyLogo = (data) => api.create(url.UPLOAD_COMPANY_LOGO, data, {
  headers: {
    "Content-Type": undefined
  }
});

// Print Format Settings
export const getPrintFormatData = () => api.get(url.GET_PRINT_FORMAT_DATA);
export const updatePrintFormat = (data) => api.create(url.UPDATE_PRINT_FORMAT, data);
export const deletePrintFormat = (id) => api.create(`${url.DELETE_PRINT_FORMAT}?ID=${id}`);
export const getInvoiceFormatSetting = (id, name) => api.get(`${url.GET_INVOICE_FORMAT_SETTING}?Id=${id}&Name=${encodeURIComponent(name)}`);
export const printPreview = (data) => api.create(url.PRINT_PREVIEW, data);

// Column Abbreviations Settings
export const getColumnAbbreviations = () => api.get(url.GET_COLUMN_ABBREVIATIONS);
export const updateColumnAbbreviations = (data) => api.create(url.UPDATE_COLUMN_ABBREVIATIONS, data);

// Sync Settings
export const getSyncSettings = (companyId) => api.get(`${url.GET_SYNC_SETTINGS}?companyId=${companyId}`);
export const saveSyncSettings = (data, enable) => api.create(`${url.SAVE_SYNC_SETTINGS}?enable=${enable ? 1 : 0}`, data);

// Detail Section dropdowns
export const getShapes = () => api.get(url.GET_SHAPE_MASTER_LIST);
export const getColors = () => api.get(url.GET_COLOR_MASTER_LIST);
export const getSizes = () => api.get(url.GET_SIZE_MASTER_LIST);
export const getClarities = () => api.get(url.GET_CLARITY_MASTER_LIST);
export const getSieves = () => api.get(url.GET_SIEVE_MASTER_LIST);
export const getLabs = () => api.get(url.GET_LAB_MASTER_LIST);
export const getJewLotNoData = (lotNo) => api.create(url.GET_JEW_LOTNO_DATA, { LotNo: lotNo });

// Solitaire Stock Search Report
export const getSolitaireStockSearchReport = (filter) => api.create(url.SOLITAIRE_STOCK_SEARCH_REPORT, filter);
export const getSolitaireStockSearchPivot = (filter) => api.create(url.SOLITAIRE_STOCK_SEARCH_PIVOT, filter);
export const getSolitaireStockSearchDropdowns = () => api.get(url.SOLITAIRE_STOCK_SEARCH_DROPDOWNS);
export const updateSolitaireStockLocation = (data) => api.create(url.SOLITAIRE_STOCK_SEARCH_UPDATE_LOCATION, data);
export const updateSolitaireStockBoxGroup = (data) => api.create(url.SOLITAIRE_STOCK_SEARCH_UPDATE_BOX_GROUP, data);
export const getSolitaireStockEmailSettings = () => api.get(url.SOLITAIRE_STOCK_SEARCH_EMAIL_SETTINGS);
export const sendSolitaireStockEmail = (data) => api.create(url.SOLITAIRE_STOCK_SEARCH_EMAIL_STOCK_LIST, data);
export const getSolitaireStockSearchHistory = (filter) => api.create(url.SOLITAIRE_STOCK_SEARCH_HISTORY, filter);

// Solitaire Admin Stock Report
export const getSolitaireAdminStockReport = (filter) => api.create(url.SOLITAIRE_ADMIN_STOCK_REPORT, filter);
export const getSolitaireAdminStockDropdowns = () => api.get(url.SOLITAIRE_ADMIN_STOCK_DROPDOWNS);
export const getSolitaireAdminLots = (search) => api.get(`${url.SOLITAIRE_ADMIN_STOCK_LOTS}?searchby=${search}`);
export const updateSolitaireAdminStockLocation = (data) => api.create(url.SOLITAIRE_ADMIN_STOCK_UPDATE_LOCATION, data);
export const updateSolitaireAdminStockBoxGroup = (data) => api.create(url.SOLITAIRE_ADMIN_STOCK_UPDATE_BOX_GROUP, data);

// Solitaire Stock History Report
export const getSolitaireStockHistoryReport = (filter) => api.create(url.SOLITAIRE_STOCK_HISTORY_REPORT, filter);

// Solitaire Grading Comparison Report
export const getSolitaireGradingComparisonReport = (filter) => api.create(url.SOLITAIRE_GRADING_COMPARISON_REPORT, filter);
export const getSolitaireGradingComparisonDropdowns = () => api.get(url.SOLITAIRE_GRADING_COMPARISON_DROPDOWNS);

// Solitaire Rate Revise Report
export const getSolitaireRateReviseReport = (filter) => api.create(url.SOLITAIRE_RATE_REVISE_REPORT, filter);
export const getSolitaireRateReviseDropdowns = () => api.get(url.SOLITAIRE_RATE_REVISE_DROPDOWNS);

// Solitaire Purchase Report
export const getSolitairePurchaseReport = (filter) => api.create(url.SOLITAIRE_PURCHASE_REPORT, filter);
export const getSolitairePurchaseDropdowns = () => api.get(url.SOLITAIRE_PURCHASE_DROPDOWNS);

// Solitaire Purchase Return Report
export const getSolitairePurchaseReturnReport = (filter) => api.create(url.SOLITAIRE_PURCHASE_RETURN_REPORT, filter);
export const getSolitairePurchaseReturnDropdowns = () => api.get(url.SOLITAIRE_PURCHASE_RETURN_DROPDOWNS);

// Solitaire Sale Return Report
export const getSolitaireSaleReturnReport = (filter) => api.create(url.SOLITAIRE_SALE_RETURN_REPORT, filter);
export const getSolitaireSaleReturnDropdowns = () => api.get(url.SOLITAIRE_SALE_RETURN_DROPDOWNS);

// Solitaire Consignment Return Report
export const getSolitaireConsignmentReturnReport = (filter) => api.create(url.SOLITAIRE_CONSIGNMENT_RETURN_REPORT, filter);
export const getSolitaireConsignmentReturnDropdowns = () => api.get(url.SOLITAIRE_CONSIGNMENT_RETURN_DROPDOWNS);

// Solitaire Memo Return Report
export const getSolitaireMemoReturnReport = (filter) => api.create(url.SOLITAIRE_MEMO_RETURN_REPORT, filter);
export const getSolitaireMemoReturnDropdowns = () => api.get(url.SOLITAIRE_MEMO_RETURN_DROPDOWNS);


// Solitaire Consignment In Report
export const getSolitaireConsignmentInReport = (filter) => api.create(url.SOLITAIRE_CONSIGNMENT_IN_REPORT, filter);
export const getSolitaireConsignmentInSummary = (filter) => api.create(url.SOLITAIRE_CONSIGNMENT_IN_SUMMARY, filter);
export const getSolitaireConsignmentInDropdowns = () => api.get(url.SOLITAIRE_CONSIGNMENT_IN_DROPDOWNS);

// Solitaire Memo Out Report
export const getSolitaireMemoOutReport = (filter) => api.create(url.SOLITAIRE_MEMO_OUT_REPORT, filter);
export const getSolitaireMemoOutDropdowns = () => api.get(url.SOLITAIRE_MEMO_OUT_DROPDOWNS);

// Solitaire Party Hold Report
export const getSolitairePartyHoldReport = (filter) => api.create(url.SOLITAIRE_PARTY_HOLD_REPORT, filter);
export const getSolitairePartyHoldDropdowns = () => api.get(url.SOLITAIRE_PARTY_HOLD_DROPDOWNS);

// Solitaire Aging Report
export const getSolitaireAgingReport = (filter) => api.create(url.SOLITAIRE_AGING_REPORT, filter);
export const getSolitaireAgingDropdowns = () => api.get(url.SOLITAIRE_AGING_DROPDOWNS);

export const getOutstandingReportDropdowns = () => api.get(url.OUTSTANDING_REPORT_DROPDOWNS);
export const getOutstandingReport = (filter) => api.create(url.OUTSTANDING_REPORT_LIST, filter);

export const getLoanOutstandingReportDropdowns = () => api.get(url.LOAN_OUTSTANDING_REPORT_DROPDOWNS);
export const getLoanOutstandingReport = (filter) => api.create(url.LOAN_OUTSTANDING_REPORT_LIST, filter);

export const getBrokerageOutstandingReportDropdowns = () => api.get(url.BROKERAGE_OUTSTANDING_REPORT_DROPDOWNS);
export const getBrokerageOutstandingReport = (filter) => api.create(url.BROKERAGE_OUTSTANDING_REPORT_LIST, filter);

export const getCommissionOutstandingReportDropdowns = () => api.get(url.COMMISSION_OUTSTANDING_REPORT_DROPDOWNS);
export const getCommissionOutstandingReport = (filter) => api.create(url.COMMISSION_OUTSTANDING_REPORT_LIST, filter);

export const getSalePurchaseSummaryReportDropdowns = () => api.get(url.SALE_PURCHASE_SUMMARY_REPORT_DROPDOWNS);
export const getSalePurchaseSummaryReport = (filter) => api.create(url.SALE_PURCHASE_SUMMARY_REPORT_LIST, filter);

// Solitaire Fast Moving Report
export const getSolitaireFastMovingReport = (filter) => api.create(url.SOLITAIRE_FAST_MOVING_REPORT, filter);
export const getSolitaireFastMovingDisplay = (filter) => api.create(url.SOLITAIRE_FAST_MOVING_DISPLAY, filter);
export const getSolitaireFastMovingDropdowns = () => api.get(url.SOLITAIRE_FAST_MOVING_DROPDOWNS);

// Solitaire Lot Assortment Report
export const getSolitaireLotAssortmentReport = (filter) =>
  api.create(url.SOLITAIRE_LOT_ASSORTMENT_REPORT, filter);

// Solitaire Kapan Summary Report
export const getSolitaireKapanSummaryReport = (filter) => api.create(url.SOLITAIRE_KAPAN_SUMMARY_REPORT, filter);

// Solitaire Sale Report
export const getSolitaireSaleReport = (filter) => api.create(url.SOLITAIRE_SALE_REPORT, filter);
export const getSolitaireSaleDropdowns = () => api.get(url.SOLITAIRE_SALE_DROPDOWNS);

// Solitaire Sale Performance Report
export const getSolitaireSalePerformanceReport = (filter) => api.create(url.SOLITAIRE_SALE_PERFORMANCE_REPORT, filter);
export const getSolitaireSalePerformanceDropdowns = () => api.get(url.SOLITAIRE_SALE_PERFORMANCE_DROPDOWNS);

// Solitaire Stock Consumption Report
export const getSolitaireConsumptionReport = (filter) => api.create(url.SOLITAIRE_CONSUMPTION_REPORT, filter);
export const getSolitaireConsumptionDropdowns = () => api.get(url.SOLITAIRE_CONSUMPTION_DROPDOWNS);

// Month Analysis Report
export const getMonthAnalysisReport = (filter) => api.create(url.MONTH_ANALYSIS_REPORT_DATA, filter);
export const getMonthAnalysisDropdowns = () => api.get(url.MONTH_ANALYSIS_REPORT_DROPDOWNS);

// Purchase Analysis Report
export const getPurchaseAnalysisReport = (filter) => api.create(url.PURCHASE_ANALYSIS_REPORT_DATA, filter);
export const getPurchaseAnalysisDropdowns = () => api.get(url.PURCHASE_ANALYSIS_REPORT_DROPDOWNS);

// Sale Analysis Report
export const getSaleAnalysisReport = (filter) => api.create(url.SALE_ANALYSIS_REPORT_DATA, filter);
export const getSaleAnalysisPivotData = (filter) => api.create(url.SALE_ANALYSIS_REPORT_PIVOT_DATA, filter);
export const getSaleAnalysisDropdowns = () => api.get(url.SALE_ANALYSIS_REPORT_DROPDOWNS);

// Stock Analysis Report
export const getStockAnalysisReport = (filter) => api.create(url.STOCK_ANALYSIS_REPORT_DATA, filter);
export const getStockAnalysisPivotByFilter = (filter) => api.create(url.STOCK_ANALYSIS_PIVOT_BY_FILTER, filter);
export const getStockAnalysisPivotFixed = (filter) => api.create(url.STOCK_ANALYSIS_PIVOT_FIXED, filter);
export const getStockAnalysisDropdowns = () => api.get(url.STOCK_ANALYSIS_REPORT_DROPDOWNS);

// Parcel Stock Analysis Report
export const getParcelStockAnalysisReport = (filter) => api.create(url.PARCEL_STOCK_ANALYSIS_REPORT_DATA, filter);
export const getParcelStockAnalysisPivotData = (filter) =>
  api.create(url.PARCEL_STOCK_ANALYSIS_PIVOT_DATA, filter, { timeout: 180000 });
export const getParcelStockAnalysisDropdowns = () => api.get(url.PARCEL_STOCK_ANALYSIS_REPORT_DROPDOWNS);

// Parcel Sale Analysis Report
export const getParcelSaleAnalysisReport = (filter) => api.create(url.PARCEL_SALE_ANALYSIS_REPORT_DATA, filter);
export const getParcelSaleAnalysisPivotData = (filter) =>
  api.create(url.PARCEL_SALE_ANALYSIS_PIVOT_DATA, filter, { timeout: 180000 });
export const getParcelSaleAnalysisDropdowns = () => api.get(url.PARCEL_SALE_ANALYSIS_REPORT_DROPDOWNS);

// Parcel Purchase Analysis Report
export const getParcelPurchaseAnalysisReport = (filter) => api.create(url.PARCEL_PURCHASE_ANALYSIS_REPORT_DATA, filter);
export const getParcelPurchaseAnalysisDropdowns = () => api.get(url.PARCEL_PURCHASE_ANALYSIS_REPORT_DROPDOWNS);


// Parcel Stock Search Report
export const getParcelStockSearchReport = (filter) => api.create(url.Parcel_STOCK_SEARCH_REPORT, filter);
export const getParcelStockSearchList = (filter) => api.create(url.Parcel_STOCK_SEARCH_List, filter);
export const getParcelStockSearchDropdowns = () => api.get(url.Parcel_STOCK_SEARCH_DROPDOWNS);

// Jewellery Stock Search Report
export const getJewelleryStockSearchReport = (filter) => api.create(url.JEWELLERY_STOCK_SEARCH_REPORT, filter);
export const getJewelleryStockSearchDropdowns = () => api.get(url.JEWELLERY_STOCK_SEARCH_DROPDOWNS);
export const getJewelleryStockIds = (searchText) => api.create(url.JEWELLERY_STOCK_SEARCH_STOCK_IDS, { searchText });
export const getParcelLots = (searchby) => api.get(`${url.GET_Parcel_LOTS}${searchby ? `?searchby=${encodeURIComponent(searchby)}` : ""}`);
export const updateParcelStockLocation = (data) => api.create(url.Parcel_STOCK_SEARCH_UPDATE_LOCATION, data);
export const updateParcelStockBoxGroup = (data) => api.create(url.Parcel_STOCK_SEARCH_UPDATE_BOX_GROUP, data);


// Parcel Stock Register / History Report
export const getParcelStockHistoryReport = (filter) => api.create(url.Parcel_STOCK_REGISTER_REPORT, filter);
export const getParcelStockRegisterDropdowns = () => api.get(url.Parcel_STOCK_REGISTER_DROPDOWNS);
export const getParcelStockRegisterLots = (searchby) =>
  api.get(`${url.GET_ParcelStockRegister_LOTS}${searchby ? `?searchby=${encodeURIComponent(searchby)}` : ""}`);


// Mix Purchase Report
export const getMixPurchaseReportDropdowns = () => api.get(url.MIX_PURCHASE_REPORT_DROPDOWNS);
export const getMixPurchaseReport = (filter) => api.create(url.MIX_PURCHASE_REPORT_LIST, filter);

// Mix Purchase Return Report
export const getMixPurRtnReportDropdowns = () => api.get(url.MIX_PUR_RTN_REPORT_DROPDOWNS);
export const getMixPurRtnReport = (filter) => api.create(url.MIX_PUR_RTN_REPORT_LIST, filter);

// Mix Memo Out Report
export const getMixMemoOutReportDropdowns = () => api.get(url.MIX_MEMO_OUT_REPORT_DROPDOWNS);
export const getMixMemoOutReport = (filter) => api.create(url.MIX_MEMO_OUT_REPORT_LIST, filter);

// Mix Memo Return Report
export const getMixMemoOutRtnReportDropdowns = () => api.get(url.MIX_MEMO_OUT_RTN_REPORT_DROPDOWNS);
export const getMixMemoOutRtnReport = (filter) => api.create(url.MIX_MEMO_OUT_RTN_REPORT_LIST, filter);

// Mix Sale Report
export const getMixSaleReportDropdowns = () => api.get(url.MIX_SALE_REPORT_DROPDOWNS);
export const getMixSaleReport = (filter) => api.create(url.MIX_SALE_REPORT_LIST, filter);

// Mix Sale Return Report
export const getMixSaleRtnReportDropdowns = () => api.get(url.MIX_SALE_RTN_REPORT_DROPDOWNS);
export const getMixSaleRtnReport = (filter) => api.create(url.MIX_SALE_RTN_REPORT_LIST, filter);

// Mix Consignment Report
export const getMixConsignmentReportDropdowns = () => api.get(url.MIX_CONSIGNMENT_REPORT_DROPDOWNS);
export const getMixConsignmentReport = (filter) => api.create(url.MIX_CONSIGNMENT_REPORT_LIST, filter);
export const getMixConsignmentSummaryReport = (filter) => api.create(url.MIX_CONSIGNMENT_REPORT_SUMMARY, filter);

// DiaAnalytics / Stock Analyze (MVC: /data/StockAnalyze)
export const getStockAnalyzeConfig = () => api.get(url.GET_STOCK_ANALYZE_CONFIG);

// Mix Consignment Return Report (MemoIn Return)
export const getMixConsignmentInRtnReportDropdowns = () => api.get(url.MIX_CONSIGNMENT_IN_RTN_REPORT_DROPDOWNS);
export const getMixConsignmentInRtnReport = (filter) => api.create(url.MIX_CONSIGNMENT_IN_RTN_REPORT_LIST, filter);
// Ledger Report (MVC: /Account/LedgerRpt)
export const getLedgerReportDropdowns = () => api.get(url.LEDGER_REPORT_DROPDOWNS);
export const getLedgerReportLists = (filter) => api.create(url.LEDGER_REPORT_LISTS, filter);
export const getLedgerReportList1 = (filter) => api.create(url.LEDGER_REPORT_LIST1, filter);
export const getLedgerReportPrintJS = (filter) => api.create(url.LEDGER_REPORT_PRINT_JS, filter);

// Month Expense Report (MVC: /report/month-expense-report)
export const getMonthExpenseReportPermission = () => api.get(url.MONTH_EXPENSE_REPORT_PERMISSION);
export const getMonthExpenseReport = () => api.create(url.MONTH_EXPENSE_REPORT_DATA, {});

// Cash Flow Report (MVC: /report/cash-flow-report)
export const getCashFlowReportPermission = () => api.get(url.CASH_FLOW_REPORT_PERMISSION);
export const getCashFlowReport = () => api.create(url.CASH_FLOW_REPORT_DATA, {});
