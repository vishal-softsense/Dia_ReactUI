//REGISTER
export const POST_FAKE_REGISTER = "/auth/signup";

//LOGIN
export const POST_FAKE_LOGIN = "/auth/signin";
export const POST_FAKE_JWT_LOGIN = "/post-jwt-login";
export const POST_API_LOGIN = "/api/Login/login";
export const POST_FAKE_PASSWORD_FORGET = "/auth/forgot-password";
export const POST_FAKE_JWT_PASSWORD_FORGET = "/jwt-forget-pwd";
export const SOCIAL_LOGIN = "/social-login";

//PROFILE
export const POST_EDIT_JWT_PROFILE = "/post-jwt-profile";
export const POST_EDIT_PROFILE = "/user";

// User Master
export const GET_USER_MASTER_LIST = "/api/Masters/UserMaster/list";
export const GET_USER_MASTER_DETAIL = "/api/Masters/UserMaster"; // append /{id}
export const ADD_USER_MASTER = "/api/Masters/UserMaster/add";
export const UPDATE_USER_MASTER = "/api/Masters/UserMaster/edit"; // append /{id}
export const DELETE_USER_MASTER = "/api/Masters/UserMaster/delete"; // append /{id}
export const GET_USER_MASTER_DROPDOWN = "/api/Masters/UserMaster/dropdown";

// All Master
export const GET_ALL_MASTER_LIST = "/api/AllMaster/all-master-list";

// Shape Master
export const GET_SHAPE_MASTER_LIST = "/api/AllMaster/list-shape";
export const GET_SHAPE_MASTER_DETAIL = "/api/AllMaster/get-shape"; // append /{id}
export const SAVE_SHAPE_MASTER = "/api/AllMaster/save-shape";
export const DELETE_SHAPE_MASTER = "/api/AllMaster/delete-shape"; // append /{id}

// Color Master
export const GET_COLOR_MASTER_LIST = "/api/AllMaster/list-color";
export const GET_COLOR_MASTER_DETAIL = "/api/AllMaster/get-color"; // append /{id}
export const SAVE_COLOR_MASTER = "/api/AllMaster/save-color";
export const DELETE_COLOR_MASTER = "/api/AllMaster/delete-color"; // append /{id}

// Size Master
export const GET_SIZE_MASTER_LIST = "/api/AllMaster/list-Size";
export const GET_SIZE_MASTER_DETAIL = "/api/AllMaster/get-Size"; // append /{id}
export const SAVE_SIZE_MASTER = "/api/AllMaster/save-Size";
export const DELETE_SIZE_MASTER = "/api/AllMaster/delete-Size"; // append /{id}

// Clarity Master
export const GET_CLARITY_MASTER_LIST = "/api/AllMaster/list-clarity";
export const GET_CLARITY_MASTER_DETAIL = "/api/AllMaster/get-clarity"; // append /{id}
export const SAVE_CLARITY_MASTER = "/api/AllMaster/save-clarity";
export const DELETE_CLARITY_MASTER = "/api/AllMaster/delete-clarity"; // append /{id}

// Sieve Master
export const GET_SIEVE_MASTER_LIST = "/api/AllMaster/list-sieve";
export const GET_SIEVE_MASTER_DETAIL = "/api/AllMaster/get-sieve"; // append /{id}
export const SAVE_SIEVE_MASTER = "/api/AllMaster/save-sieve";
export const DELETE_SIEVE_MASTER = "/api/AllMaster/delete-sieve"; // append /{id}

// Lab Master
export const GET_LAB_MASTER_LIST = "/api/AllMaster/list-lab";
export const GET_LAB_MASTER_DETAIL = "/api/AllMaster/get-lab"; // append /{id}
export const SAVE_LAB_MASTER = "/api/AllMaster/save-lab";
export const DELETE_LAB_MASTER = "/api/AllMaster/delete-lab"; // append /{id}

// Prop Master
export const GET_PROP_MASTER_LIST = "/api/AllMaster/list-prop";
export const GET_PROP_MASTER_DETAIL = "/api/AllMaster/get-prop"; // append /{id}
export const SAVE_PROP_MASTER = "/api/AllMaster/save-prop";
export const DELETE_PROP_MASTER = "/api/AllMaster/delete-prop"; // append /{id}

// Polish Master
export const GET_POLISH_MASTER_LIST = "/api/AllMaster/list-polish";
export const GET_POLISH_MASTER_DETAIL = "/api/AllMaster/get-polish"; // append /{id}
export const SAVE_POLISH_MASTER = "/api/AllMaster/save-polish";
export const DELETE_POLISH_MASTER = "/api/AllMaster/delete-polish"; // append /{id}

// Sym Master
export const GET_SYM_MASTER_LIST = "/api/AllMaster/list-sym";
export const GET_SYM_MASTER_DETAIL = "/api/AllMaster/get-sym"; // append /{id}
export const SAVE_SYM_MASTER = "/api/AllMaster/save-sym";
export const DELETE_SYM_MASTER = "/api/AllMaster/delete-sym"; // append /{id}

// FL Master
export const GET_FL_MASTER_LIST = "/api/AllMaster/list-fl";
export const GET_FL_MASTER_DETAIL = "/api/AllMaster/get-fl"; // append /{id}
export const SAVE_FL_MASTER = "/api/AllMaster/save-fl";
export const DELETE_FL_MASTER = "/api/AllMaster/delete-fl"; // append /{id}

// FLColor Master
export const GET_FLCOLOR_MASTER_LIST = "/api/AllMaster/list-flcolor";
export const GET_FLCOLOR_MASTER_DETAIL = "/api/AllMaster/get-flcolor"; // append /{id}
export const SAVE_FLCOLOR_MASTER = "/api/AllMaster/save-flcolor";
export const DELETE_FLCOLOR_MASTER = "/api/AllMaster/delete-flcolor"; // append /{id}

// Area Master
export const GET_AREA_MASTER_LIST = "/api/AllMaster/list-area";
export const GET_AREA_MASTER_DETAIL = "/api/AllMaster/get-area"; // append /{id}
export const SAVE_AREA_MASTER = "/api/AllMaster/save-area";
export const DELETE_AREA_MASTER = "/api/AllMaster/delete-area"; // append /{id}

// City Master
export const GET_CITY_MASTER_LIST = "/api/AllMaster/list-city";
export const GET_CITY_MASTER_DETAIL = "/api/AllMaster/get-city"; // append /{id}
export const SAVE_CITY_MASTER = "/api/AllMaster/save-city";
export const DELETE_CITY_MASTER = "/api/AllMaster/delete-city"; // append /{id}

// State Master
export const GET_STATE_MASTER_LIST = "/api/AllMaster/list-state";
export const GET_STATE_MASTER_DETAIL = "/api/AllMaster/get-state"; // append /{id}
export const SAVE_STATE_MASTER = "/api/AllMaster/save-state";
export const DELETE_STATE_MASTER = "/api/AllMaster/delete-state"; // append /{id}

// Country Master
export const GET_COUNTRY_MASTER_LIST = "/api/AllMaster/list-country";
export const GET_COUNTRY_MASTER_DETAIL = "/api/AllMaster/get-country"; // append /{id}
export const SAVE_COUNTRY_MASTER = "/api/AllMaster/save-country";
export const DELETE_COUNTRY_MASTER = "/api/AllMaster/delete-country"; // append /{id}

// Term Master
export const GET_TERM_MASTER_LIST = "/api/AllMaster/list-term";
export const GET_TERM_MASTER_DETAIL = "/api/AllMaster/get-term"; // append /{id}
export const SAVE_TERM_MASTER = "/api/AllMaster/submit-term";
export const DELETE_TERM_MASTER = "/api/AllMaster/delete-term"; // append /{id}

// Type Master
export const GET_TYPE_MASTER_LIST = "/api/AllMaster/list-type";
export const GET_TYPE_MASTER_DETAIL = "/api/AllMaster/get-type"; // append /{id}
export const SAVE_TYPE_MASTER = "/api/AllMaster/submit-type";
export const DELETE_TYPE_MASTER = "/api/AllMaster/delete-type"; // append /{id}

// SubType Master
export const GET_SUBTYPE_MASTER_LIST = "/api/AllMaster/list-subtype";
export const GET_SUBTYPE_MASTER_DETAIL = "/api/AllMaster/get-subtype"; // append /{id}
export const SAVE_SUBTYPE_MASTER = "/api/AllMaster/submit-subtype";
export const DELETE_SUBTYPE_MASTER = "/api/AllMaster/delete-subtype"; // append /{id}

// Currency Master
export const GET_CURRENCY_MASTER_LIST = "/api/AllMaster/list-currency";
export const GET_CURRENCY_MASTER_DETAIL = "/api/AllMaster/get-currency"; // append /{id}

// Mines Master
export const GET_MINES_MASTER_LIST = "/api/AllMaster/list-mines";
export const GET_MINES_MASTER_DETAIL = "/api/AllMaster/get-mines"; // append /{id}
export const SAVE_MINES_MASTER = "/api/AllMaster/submit-mines";
export const DELETE_MINES_MASTER = "/api/AllMaster/delete-mines"; // append /{id}

// Rough Master
export const GET_ROUGH_MASTER_LIST = "/api/AllMaster/list-rough";
export const GET_ROUGH_MASTER_DETAIL = "/api/AllMaster/get-rough"; // append /{id}
export const SAVE_ROUGH_MASTER = "/api/AllMaster/submit-rough";
export const DELETE_ROUGH_MASTER = "/api/AllMaster/delete-rough"; // append /{id}

// Jewellery Category Master
export const GET_JEW_CATEGORY_MASTER_LIST = "/api/AllMaster/list-jew-category";
export const GET_JEW_CATEGORY_MASTER_DETAIL = "/api/AllMaster/get-jew-category"; // append /{id}
export const SAVE_JEW_CATEGORY_MASTER = "/api/AllMaster/submit-jew-category";
export const DELETE_JEW_CATEGORY_MASTER = "/api/AllMaster/delete-jew-category"; // append /{id}

// Jewellery SubCategory Master
export const GET_JEW_SUBCATEGORY_MASTER_LIST = "/api/AllMaster/list-jew-subcategory";
export const GET_JEW_SUBCATEGORY_MASTER_DETAIL = "/api/AllMaster/get-jew-subcategory"; // append /{id}
export const SAVE_JEW_SUBCATEGORY_MASTER = "/api/AllMaster/submit-jew-subcategory";
export const DELETE_JEW_SUBCATEGORY_MASTER = "/api/AllMaster/delete-jew-subcategory"; // append /{id}

// Jewellery Metal Master
export const GET_JEW_METAL_MASTER_LIST = "/api/AllMaster/list-jew-metal";
export const GET_JEW_METAL_MASTER_DETAIL = "/api/AllMaster/get-jew-metal"; // append /{id}
export const SAVE_JEW_METAL_MASTER = "/api/AllMaster/submit-jew-metal";
export const DELETE_JEW_METAL_MASTER = "/api/AllMaster/delete-jew-metal"; // append /{id}

// Jewellery Metal Purity Master
export const GET_JEW_METAL_PURITY_MASTER_LIST = "/api/AllMaster/list-jew-metal-purity";
export const GET_JEW_METAL_PURITY_MASTER_DETAIL = "/api/AllMaster/get-jew-metal-purity"; // append /{id}
export const SAVE_JEW_METAL_PURITY_MASTER = "/api/AllMaster/submit-jew-metal-purity";
export const DELETE_JEW_METAL_PURITY_MASTER = "/api/AllMaster/delete-jew-metal-priority"; // append /{id}

// Jewellery Color Master
export const GET_JEW_COLOR_MASTER_LIST = "/api/AllMaster/list-jew-color";
export const GET_JEW_COLOR_MASTER_DETAIL = "/api/AllMaster/get-jew-color"; // append /{id}
export const SAVE_JEW_COLOR_MASTER = "/api/AllMaster/submit-jew-color";
export const DELETE_JEW_COLOR_MASTER = "/api/AllMaster/delete-jew-color"; // append /{id}



// Sidebar Menu
export const GET_SIDEBAR_MENU = "/api/Menu/sidebar-menu";

// UserRole Master
export const GET_USER_ROLE_LIST = "/api/UserRole/list-user-role";
export const GET_USER_ROLE_DETAIL = "/api/UserRole/edit-user-role"; // append /{id}
export const ADD_USER_ROLE = "/api/UserRole/add-user-role-save";
export const UPDATE_USER_ROLE = "/api/UserRole/edit-user-role-save";
export const DELETE_USER_ROLE = "/api/UserRole/delete-user-role"; // append ?id=
export const GET_ROLE_PERMISSIONS = "/api/UserRole/fill-role-permission"; // append ?id=
export const SAVE_ROLE_PERMISSIONS = "/api/UserRole/save-role-permission"; // append ?id=
export const GET_USER_ROLE_DROPDOWN = "/api/UserRole/dropdown";

// Calendar
export const GET_EVENTS = "/events";
export const GET_CATEGORIES = "/categories";
export const GET_UPCOMMINGEVENT = "/upcommingevents";
export const ADD_NEW_EVENT = "/add/event";
export const UPDATE_EVENT = "/update/event";
export const DELETE_EVENT = "/delete/event";

// Chat
export const GET_DIRECT_CONTACT = "/chat";
export const GET_MESSAGES = "/messages";
export const ADD_MESSAGE = "add/message";
export const GET_CHANNELS = "/channels";
export const DELETE_MESSAGE = "delete/message";

//Mailbox
export const GET_MAIL_DETAILS = "/mail";
export const DELETE_MAIL = "/delete/mail";

// Ecommerce
// Product
export const GET_PRODUCTS = "/apps/product";
export const DELETE_PRODUCT = "/apps/product";
export const ADD_NEW_PRODUCT = "/apps/product";
export const UPDATE_PRODUCT = "/apps/product";

// Orders
export const GET_ORDERS = "/apps/order";
export const ADD_NEW_ORDER = "/apps/order";
export const UPDATE_ORDER = "/apps/order";
export const DELETE_ORDER = "/apps/order";

// Customers
export const GET_CUSTOMERS = "/apps/customer";
export const ADD_NEW_CUSTOMER = "/apps/customer";
export const UPDATE_CUSTOMER = "/apps/customer";
export const DELETE_CUSTOMER = "/apps/customer";

// Sellers
export const GET_SELLERS = "/sellers";

// Project list
export const GET_PROJECT_LIST = "/project/list";

// Task
export const GET_TASK_LIST = "/apps/task";
export const ADD_NEW_TASK = "/apps/task";
export const UPDATE_TASK = "/apps/task";
export const DELETE_TASK = "/apps/task";

// CRM
// Conatct
export const GET_CONTACTS = "/apps/contact";
export const ADD_NEW_CONTACT = "/apps/contact";
export const UPDATE_CONTACT = "/apps/contact";
export const DELETE_CONTACT = "/apps/contact";

// Companies
export const GET_COMPANIES = "/apps/company";
export const ADD_NEW_COMPANIES = "/apps/company";
export const UPDATE_COMPANIES = "/apps/company";
export const DELETE_COMPANIES = "/apps/company";

// Lead
export const GET_LEADS = "/apps/lead";
export const ADD_NEW_LEAD = "/apps/lead";
export const UPDATE_LEAD = "/apps/lead";
export const DELETE_LEAD = "/apps/lead";

// Deals
export const GET_DEALS = "/deals";

// Crypto
export const GET_TRANSACTION_LIST = "/transaction-list";
export const GET_ORDRER_LIST = "/order-list";

// Invoice
export const GET_INVOICES = "/apps/invoice";
export const ADD_NEW_INVOICE = "/apps/invoice";
export const UPDATE_INVOICE = "/apps/invoice";
export const DELETE_INVOICE = "/apps/invoice";

// TicketsList
export const GET_TICKETS_LIST = "/apps/ticket";
export const ADD_NEW_TICKET = "/apps/ticket";
export const UPDATE_TICKET = "/apps/ticket";
export const DELETE_TICKET = "/apps/ticket";

// kanban
export const GET_TASKS = "/apps/tasks";
export const ADD_TASKS = "/add/tasks";
export const UPDATE_TASKS = "/update/tasks";
export const DELETE_TASKS = "/delete/tasks";

// Dashboard Analytics

// Sessions by Countries
export const GET_ALL_DATA = "/all-data";
export const GET_HALFYEARLY_DATA = "/halfyearly-data";
export const GET_MONTHLY_DATA = "/monthly-data";

// Audiences Metrics
export const GET_ALLAUDIENCESMETRICS_DATA = "/allAudiencesMetrics-data";
export const GET_MONTHLYAUDIENCESMETRICS_DATA = "/monthlyAudiencesMetrics-data";
export const GET_HALFYEARLYAUDIENCESMETRICS_DATA = "/halfyearlyAudiencesMetrics-data";
export const GET_YEARLYAUDIENCESMETRICS_DATA = "/yearlyAudiencesMetrics-data";

// Users by Device
export const GET_TODAYDEVICE_DATA = "/todayDevice-data";
export const GET_LASTWEEKDEVICE_DATA = "/lastWeekDevice-data";
export const GET_LASTMONTHDEVICE_DATA = "/lastMonthDevice-data";
export const GET_CURRENTYEARDEVICE_DATA = "/currentYearDevice-data";

// Audiences Sessions by Country
export const GET_TODAYSESSION_DATA = "/todaySession-data";
export const GET_LASTWEEKSESSION_DATA = "/lastWeekSession-data";
export const GET_LASTMONTHSESSION_DATA = "/lastMonthSession-data";
export const GET_CURRENTYEARSESSION_DATA = "/currentYearSession-data";

// Dashboard CRM

// Balance Overview
export const GET_TODAYBALANCE_DATA = "/todayBalance-data";
export const GET_LASTWEEKBALANCE_DATA = "/lastWeekBalance-data";
export const GET_LASTMONTHBALANCE_DATA = "/lastMonthBalance-data";
export const GET_CURRENTYEARBALANCE_DATA = "/currentYearBalance-data";

// Deal type
export const GET_TODAYDEAL_DATA = "/todayDeal-data";
export const GET_WEEKLYDEAL_DATA = "/weeklyDeal-data";
export const GET_MONTHLYDEAL_DATA = "/monthlyDeal-data";
export const GET_YEARLYDEAL_DATA = "/yearlyDeal-data";

// Sales Forecast

export const GET_OCTSALES_DATA = "/octSales-data";
export const GET_NOVSALES_DATA = "/novSales-data";
export const GET_DECSALES_DATA = "/decSales-data";
export const GET_JANSALES_DATA = "/janSales-data";

// Dashboard Ecommerce
// Revenue
export const GET_ALLREVENUE_DATA = "/allRevenue-data";
export const GET_MONTHREVENUE_DATA = "/monthRevenue-data";
export const GET_HALFYEARREVENUE_DATA = "/halfYearRevenue-data";
export const GET_YEARREVENUE_DATA = "/yearRevenue-data";

// Dashboard Crypto
// Portfolio
export const GET_BTCPORTFOLIO_DATA = "/btcPortfolio-data";
export const GET_USDPORTFOLIO_DATA = "/usdPortfolio-data";
export const GET_EUROPORTFOLIO_DATA = "/euroPortfolio-data";

// Market Graph
export const GET_ALLMARKETDATA_DATA = "/allMarket-data";
export const GET_YEARMARKET_DATA = "/yearMarket-data";
export const GET_MONTHMARKET_DATA = "/monthMarket-data";
export const GET_WEEKMARKET_DATA = "/weekMarket-data";
export const GET_HOURMARKET_DATA = "/hourMarket-data";

// Dashboard Crypto
// Project Overview
export const GET_ALLPROJECT_DATA = "/allProject-data";
export const GET_MONTHPROJECT_DATA = "/monthProject-data";
export const GET_HALFYEARPROJECT_DATA = "/halfYearProject-data";
export const GET_YEARPROJECT_DATA = "/yearProject-data";

// Project Status
export const GET_ALLPROJECTSTATUS_DATA = "/allProjectStatus-data";
export const GET_WEEKPROJECTSTATUS_DATA = "/weekProjectStatus-data";
export const GET_MONTHPROJECTSTATUS_DATA = "/monthProjectStatus-data";
export const GET_QUARTERPROJECTSTATUS_DATA = "/quarterProjectStatus-data";

// Dashboard NFT
// Marketplace
export const GET_ALLMARKETPLACE_DATA = "/allMarketplace-data";
export const GET_MONTHMARKETPLACE_DATA = "/monthMarketplace-data";
export const GET_HALFYEARMARKETPLACE_DATA = "/halfYearMarketplace-data";
export const GET_YEARMARKETPLACE_DATA = "/yearMarketplace-data";

// Project
export const ADD_NEW_PROJECT = "/add/project";
export const UPDATE_PROJECT = "/update/project";
export const DELETE_PROJECT = "/delete/project";

// Pages > Team
export const GET_TEAMDATA = "/teamData";
export const DELETE_TEAMDATA = "/delete/teamData";
export const ADD_NEW_TEAMDATA = "/add/teamData";
export const UPDATE_TEAMDATA = "/update/teamData";

// File Manager
// Folder
export const GET_FOLDERS = "/folder";
export const DELETE_FOLDER = "/delete/folder";
export const ADD_NEW_FOLDER = "/add/folder";
export const UPDATE_FOLDER = "/update/folder";

// File
export const GET_FILES = "/file";
export const DELETE_FILE = "/delete/file";
export const ADD_NEW_FILE = "/add/file";
export const UPDATE_FILE = "/update/file";

// To do
export const GET_TODOS = "/todo";
export const DELETE_TODO = "/delete/todo";
export const ADD_NEW_TODO = "/add/todo";
export const UPDATE_TODO = "/update/todo";

// To do Project
export const GET_PROJECTS = "/projects";
export const ADD_NEW_TODO_PROJECT = "/add/project";

//JOB APPLICATION
export const GET_APPLICATION_LIST = "/application-list";

//JOB APPLICATION
export const GET_API_KEY = "/api-key";

// Parcel Item Master
export const GET_PARCEL_ITEM_MASTER_LIST = "/api/ParcelItemMaster/list";
export const GET_PARCEL_ITEM_MASTER_DROPDOWNS = "/api/ParcelItemMaster/dropdowns";
export const GET_PARCEL_ITEM_MASTER_DETAIL = "/api/ParcelItemMaster/detail"; // append /{id}
export const CHECK_LOT_NO_EXISTS = "/api/ParcelItemMaster/check-lot";
export const ADD_PARCEL_ITEM_MASTER = "/api/ParcelItemMaster/add";
export const UPDATE_PARCEL_ITEM_MASTER = "/api/ParcelItemMaster/edit"; // append /{id}
export const DELETE_PARCEL_ITEM_MASTER = "/api/ParcelItemMaster/delete"; // append /{id}

// Settings
export const GET_SETTING_DATA = "/master/get-setting-data";
export const FILTER_SETTING_DATA = "/master/filter-data";
export const SUBMIT_SETTING_DATA = "/master/submit-setting-data";
export const GET_SETTING_DETAIL = "/master/get-setting";
export const DELETE_SETTING = "/master/delete-setting";

// Print Format Settings
export const GET_PRINT_FORMAT_DATA = "/master/get-print-format-data";
export const UPDATE_PRINT_FORMAT = "/print/update-print";
export const DELETE_PRINT_FORMAT = "/print/delete-print-setting";
export const GET_INVOICE_FORMAT_SETTING = "/print/get-Invoice-format-setting";
export const PRINT_PREVIEW = "/print/printPrev";

// Column Abbreviations Settings
export const GET_COLUMN_ABBREVIATIONS = "/master/get-ColumnAbbreviations-data";
export const UPDATE_COLUMN_ABBREVIATIONS = "/master/update-ColumnAbbr";