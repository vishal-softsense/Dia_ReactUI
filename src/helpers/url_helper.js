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
export const GET_JEW_PURITY_BY_METAL = "/api/AllMaster/list-jew-purity-by-metal"; // append ?metalType=

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


// Brown Master
export const GET_BROWN_MASTER_LIST = "/api/AllMaster/list-brown";
export const GET_BROWN_MASTER_DETAIL = "/api/AllMaster/get-brown"; // append /{id}
export const SAVE_BROWN_MASTER = "/api/AllMaster/save-brown";
export const DELETE_BROWN_MASTER = "/api/AllMaster/delete-brown"; // append /{id}

// Green Master
export const GET_GREEN_MASTER_LIST = "/api/AllMaster/list-green";
export const GET_GREEN_MASTER_DETAIL = "/api/AllMaster/get-green"; // append /{id}
export const SAVE_GREEN_MASTER = "/api/AllMaster/save-green";
export const DELETE_GREEN_MASTER = "/api/AllMaster/delete-green"; // append /{id}

// Milky Master
export const GET_MILKY_MASTER_LIST = "/api/AllMaster/list-milky";
export const GET_MILKY_MASTER_DETAIL = "/api/AllMaster/get-milky"; // append /{id}
export const SAVE_MILKY_MASTER = "/api/AllMaster/save-milky";
export const DELETE_MILKY_MASTER = "/api/AllMaster/delete-milky"; // append /{id}

// Luster Master
export const GET_LUSTER_MASTER_LIST = "/api/AllMaster/list-luster";
export const GET_LUSTER_MASTER_DETAIL = "/api/AllMaster/get-luster"; // append /{id}
export const SAVE_LUSTER_MASTER = "/api/AllMaster/save-luster";
export const DELETE_LUSTER_MASTER = "/api/AllMaster/delete-luster"; // append /{id}

// Natts Master
export const GET_NATTS_MASTER_LIST = "/api/AllMaster/list-natts";
export const GET_NATTS_MASTER_DETAIL = "/api/AllMaster/get-natts"; // append /{id}
export const SAVE_NATTS_MASTER = "/api/AllMaster/save-natts";
export const DELETE_NATTS_MASTER = "/api/AllMaster/delete-natts"; // append /{id}

// HA Master
export const GET_HA_MASTER_LIST = "/api/AllMaster/list-ha";
export const GET_HA_MASTER_DETAIL = "/api/AllMaster/get-ha"; // append /{id}
export const SAVE_HA_MASTER = "/api/AllMaster/save-ha";
export const DELETE_HA_MASTER = "/api/AllMaster/delete-ha"; // append /{id}

// Shade Master
export const GET_SHADE_MASTER_LIST = "/api/AllMaster/list-shade";
export const GET_SHADE_MASTER_DETAIL = "/api/AllMaster/get-shade"; // append /{id}
export const SAVE_SHADE_MASTER = "/api/AllMaster/save-shade";
export const DELETE_SHADE_MASTER = "/api/AllMaster/delete-shade"; // append /{id}


// Sidebar Menu
export const GET_SIDEBAR_MENU = "/api/Menu/sidebar-menu";

export const GET_SIDEBAR_MENUSearch = "/api/common/get-menu-list";

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

// Solitaire Item Master 
export const GET_SOLITAIRE_ITEM_MASTER_LIST = "/api/SolitaireItemMaster/list";
export const GET_SOLITAIRE_ITEM_MASTER_DROPDOWNS = "/api/SolitaireItemMaster/dropdowns";
export const GET_SOLITAIRE_ITEM_MASTER_DETAIL = "/api/SolitaireItemMaster/detail"; // append /{id}
export const CHECK_SOLITAIRE_LOT_NO_EXISTS = "/api/SolitaireItemMaster/check-lot";
export const ADD_SOLITAIRE_ITEM_MASTER = "/api/SolitaireItemMaster/add";
export const UPDATE_SOLITAIRE_ITEM_MASTER = "/api/SolitaireItemMaster/edit"; // append /{id}
export const DELETE_SOLITAIRE_ITEM_MASTER = "/api/SolitaireItemMaster/delete"; // append /{id}
export const PREVIEW_SOLITAIRE_ITEM = "/api/SolitaireItemMaster/preview-full-item";

// Solitaire Purchase (entry module) — MVC: /purchase/purchase-list
export const SOLITAIRE_PURCHASE_LIST = "/api/SolitairePurchase/list";
export const SOLITAIRE_PURCHASE_PAGE_DATA = "/api/SolitairePurchase/pagedata";
export const SOLITAIRE_PURCHASE_DETAIL = "/api/SolitairePurchase/detail"; // append /{id}
export const SOLITAIRE_PURCHASE_ADD = "/api/SolitairePurchase/add";
export const SOLITAIRE_PURCHASE_EDIT = "/api/SolitairePurchase/edit";
export const SOLITAIRE_PURCHASE_DELETE = "/api/SolitairePurchase/delete";
export const SOLITAIRE_PURCHASE_LOT_DETAIL = "/api/SolitairePurchase/lot-detail";
export const SOLITAIRE_PURCHASE_CONSIGNMENT = "/api/SolitairePurchase/consignment";
export const SOLITAIRE_PURCHASE_ADD_SINGLE_LOT = "/api/SolitairePurchase/add-single-lot";
export const SOLITAIRE_PURCHASE_PRINT_VIEW = "/api/SolitairePurchase/print-view"; // append /{invNo}
export const SOLITAIRE_PURCHASE_CURRENT_STATUS = "/api/SolitairePurchase/current-status"; // append /{invNo}

// Mix Purchase (Parcel Transaction entry) — MVC: /MixPurchase/Mix-PurchaseList
export const MIX_PURCHASE_LIST = "/api/MixPurchase/list";
export const MIX_PURCHASE_PAGE_DATA = "/api/MixPurchase/pagedata";
export const MIX_PURCHASE_DETAIL = "/api/MixPurchase/detail"; // append /{id}
export const MIX_PURCHASE_ADD = "/api/MixPurchase/add";
export const MIX_PURCHASE_EDIT = "/api/MixPurchase/edit";
export const MIX_PURCHASE_DELETE = "/api/MixPurchase/delete";
export const MIX_PURCHASE_LOT_DETAIL = "/api/MixPurchase/lot-detail";
export const MIX_PURCHASE_CONSIGNMENT = "/api/MixPurchase/consignment";
export const MIX_PURCHASE_ADD_SINGLE_LOT = "/api/MixPurchase/add-single-lot";
export const MIX_PURCHASE_PRINT_VIEW = "/api/MixPurchase/print-view"; // append /{id or invNo}
export const MIX_PURCHASE_CURRENT_STATUS = "/api/MixPurchase/current-status"; // append /{id or invNo}
export const MIX_PURCHASE_LOTS = "/api/MixPurchase/lots";

// Mix Memo Out (Parcel Transaction) — MVC: /mixmemoform/mixmemoformlist
export const MIX_MEMO_OUT_LIST = "/api/MixMemoOut/list";
export const MIX_MEMO_OUT_PAGE_DATA = "/api/MixMemoOut/pagedata";
export const MIX_MEMO_OUT_DETAIL = "/api/MixMemoOut/detail"; // append /{id}
export const MIX_MEMO_OUT_ADD = "/api/MixMemoOut/add";
export const MIX_MEMO_OUT_EDIT = "/api/MixMemoOut/edit";
export const MIX_MEMO_OUT_DELETE = "/api/MixMemoOut/delete";
export const MIX_MEMO_OUT_LOT_DETAIL = "/api/MixMemoOut/lot-detail";
export const MIX_MEMO_OUT_ADD_SINGLE_LOT = "/api/MixMemoOut/add-single-lot";
export const MIX_MEMO_OUT_GET_ITEM_FROM_LIST = "/api/MixMemoOut/get-item-from-list";
export const MIX_MEMO_OUT_REFRESH_BACK = "/api/MixMemoOut/refresh-back";
export const MIX_MEMO_OUT_PRINT_VIEW = "/api/MixMemoOut/print-view"; // append /{id or invNo}
export const MIX_MEMO_OUT_SHIP_VIA = "/api/MixMemoOut/ship-via"; // ?searchby=
export const MIX_MEMO_OUT_LOTS = "/api/MixMemoOut/lots"; // ?searchby= — MVC: /common/get-Mixno-list

// Mix Memo Out Return (MVC: /mixmemoreturnform/add-mixmemoreturnformlist)
export const MIX_MEMO_OUT_RETURN_PAGE_DATA = "/api/MixMemoOutReturn/pagedata";
export const MIX_MEMO_OUT_RETURN_LIST = "/api/MixMemoOutReturn/list";
export const MIX_MEMO_OUT_RETURN_SAVE = "/api/MixMemoOutReturn/return";

// Mix Purchase Return (Parcel Transaction entry) — MVC: /MixPurchaseReturn/mixpurchasereturnlist
export const MIX_PURCHASE_RETURN_LIST = "/api/MixPurchaseReturn/list";
export const MIX_PURCHASE_RETURN_PAGE_DATA = "/api/MixPurchaseReturn/pagedata";
export const MIX_PURCHASE_RETURN_DETAIL = "/api/MixPurchaseReturn/detail"; // append /{id}
export const MIX_PURCHASE_RETURN_ADD = "/api/MixPurchaseReturn/add";
export const MIX_PURCHASE_RETURN_EDIT = "/api/MixPurchaseReturn/edit";
export const MIX_PURCHASE_RETURN_DELETE = "/api/MixPurchaseReturn/delete";
export const MIX_PURCHASE_RETURN_LOT_DETAIL = "/api/MixPurchaseReturn/lot-detail";
export const MIX_PURCHASE_RETURN_ADD_SINGLE_LOT = "/api/MixPurchaseReturn/add-single-lot";
export const MIX_PURCHASE_RETURN_GET_ITEM_FROM_LIST = "/api/MixPurchaseReturn/get-item-from-list";
export const MIX_PURCHASE_RETURN_PRINT_VIEW = "/api/MixPurchaseReturn/print-view"; // append /{id or invNo}
export const MIX_PURCHASE_RETURN_LOTS = "/api/MixPurchaseReturn/lots";

// Mix Sale Return (Parcel Transaction entry) — MVC: /MixSaleReturn/mixsalereturnlist
export const MIX_SALE_RETURN_LIST = "/api/MixSaleReturn/list";
export const MIX_SALE_RETURN_PAGE_DATA = "/api/MixSaleReturn/pagedata";
export const MIX_SALE_RETURN_DETAIL = "/api/MixSaleReturn/detail"; // append /{id}
export const MIX_SALE_RETURN_ADD = "/api/MixSaleReturn/add";
export const MIX_SALE_RETURN_EDIT = "/api/MixSaleReturn/edit";
export const MIX_SALE_RETURN_DELETE = "/api/MixSaleReturn/delete";
export const MIX_SALE_RETURN_LOT_DETAIL = "/api/MixSaleReturn/lot-detail";
export const MIX_SALE_RETURN_ADD_SINGLE_LOT = "/api/MixSaleReturn/add-single-lot";
export const MIX_SALE_RETURN_GET_ITEM_FROM_LIST = "/api/MixSaleReturn/get-item-from-list";
export const MIX_SALE_RETURN_PRINT_VIEW = "/api/MixSaleReturn/print-view"; // append /{id or invNo}
export const MIX_SALE_RETURN_LOTS = "/api/MixSaleReturn/lots";
export const MIX_SALE_RETURN_CSALE_LOOKUP = "/api/MixSaleReturn/csale-to-csalertn";
export const MIX_SALE_RETURN_CSALE_FILL = "/api/MixSaleReturn/csale-to-csalertn-fill";

export const SOLITAIRE_PURCHASE_RETURN_LIST = "/api/SolitairePurchaseReturn/list";
export const SOLITAIRE_PURCHASE_RETURN_PAGE_DATA = "/api/SolitairePurchaseReturn/pagedata";
export const SOLITAIRE_PURCHASE_RETURN_DETAIL = "/api/SolitairePurchaseReturn/detail"; // append /{id}
export const SOLITAIRE_PURCHASE_RETURN_ADD = "/api/SolitairePurchaseReturn/add";
export const SOLITAIRE_PURCHASE_RETURN_EDIT = "/api/SolitairePurchaseReturn/edit";
export const SOLITAIRE_PURCHASE_RETURN_DELETE = "/api/SolitairePurchaseReturn/delete";
export const SOLITAIRE_PURCHASE_RETURN_LOT_DETAIL = "/api/SolitairePurchaseReturn/lot-detail";
export const SOLITAIRE_PURCHASE_RETURN_ADD_SINGLE_LOT = "/api/SolitairePurchaseReturn/add-single-lot";
export const SOLITAIRE_PURCHASE_RETURN_GET_ITEM_FROM_LIST = "/api/SolitairePurchaseReturn/get-item-from-list";

export const SOLITAIRE_CONSIGNMENT_IN_LIST = "/api/SolitaireConsignmentIn/list";
export const SOLITAIRE_CONSIGNMENT_IN_PAGE_DATA = "/api/SolitaireConsignmentIn/pagedata";
export const SOLITAIRE_CONSIGNMENT_IN_DETAIL = "/api/SolitaireConsignmentIn/detail"; // append /{id}
export const SOLITAIRE_CONSIGNMENT_IN_ADD = "/api/SolitaireConsignmentIn/add";
export const SOLITAIRE_CONSIGNMENT_IN_EDIT = "/api/SolitaireConsignmentIn/edit";
export const SOLITAIRE_CONSIGNMENT_IN_DELETE = "/api/SolitaireConsignmentIn/delete";
export const SOLITAIRE_CONSIGNMENT_IN_LOT_DETAIL = "/api/SolitaireConsignmentIn/lot-detail";
export const SOLITAIRE_CONSIGNMENT_IN_ADD_SINGLE_LOT = "/api/SolitaireConsignmentIn/add-single-lot";
export const SOLITAIRE_CONSIGNMENT_IN_PRINT_VIEW = "/api/SolitaireConsignmentIn/print-view"; // append /{invNo}

export const SOLITAIRE_CONSIGNMENT_IN_RETURN_PAGE_DATA = "/api/SolitaireConsignmentInReturn/pagedata";
export const SOLITAIRE_CONSIGNMENT_IN_RETURN_LIST = "/api/SolitaireConsignmentInReturn/list";
export const SOLITAIRE_CONSIGNMENT_IN_RETURN_SAVE = "/api/SolitaireConsignmentInReturn/return";

export const SOLITAIRE_MEMO_RETURN_PAGE_DATA = "/api/SolitaireMemoReturn/pagedata";
export const SOLITAIRE_MEMO_RETURN_LIST = "/api/SolitaireMemoReturn/list";
export const SOLITAIRE_MEMO_RETURN_SAVE = "/api/SolitaireMemoReturn/return";

export const SOLITAIRE_MEMO_OUT_LIST = "/api/SolitaireMemoOut/list";
export const SOLITAIRE_MEMO_OUT_PAGE_DATA = "/api/SolitaireMemoOut/pagedata";
export const SOLITAIRE_MEMO_OUT_DETAIL = "/api/SolitaireMemoOut/detail"; // append /{id}
export const SOLITAIRE_MEMO_OUT_ADD = "/api/SolitaireMemoOut/add";
export const SOLITAIRE_MEMO_OUT_EDIT = "/api/SolitaireMemoOut/edit";
export const SOLITAIRE_MEMO_OUT_DELETE = "/api/SolitaireMemoOut/delete";
export const SOLITAIRE_MEMO_OUT_LOT_DETAIL = "/api/SolitaireMemoOut/lot-detail";
export const SOLITAIRE_MEMO_OUT_ADD_SINGLE_LOT = "/api/SolitaireMemoOut/add-single-lot";
export const SOLITAIRE_MEMO_OUT_GET_ITEM_FROM_LIST = "/api/SolitaireMemoOut/get-item-from-list";
export const SOLITAIRE_MEMO_OUT_REFRESH_BACK = "/api/SolitaireMemoOut/refresh-back";
export const SOLITAIRE_MEMO_OUT_PRINT_VIEW = "/api/SolitaireMemoOut/print-view"; // append /{invNo}
export const SOLITAIRE_MEMO_OUT_SHIP_VIA = "/api/SolitaireMemoOut/ship-via"; // ?searchby=

export const SOLITAIRE_SALE_LIST = "/api/SolitaireSale/list";
export const SOLITAIRE_SALE_PAGE_DATA = "/api/SolitaireSale/pagedata";
export const SOLITAIRE_SALE_DETAIL = "/api/SolitaireSale/detail"; // append /{id}
export const SOLITAIRE_SALE_ADD = "/api/SolitaireSale/add";
export const SOLITAIRE_SALE_EDIT = "/api/SolitaireSale/edit";
export const SOLITAIRE_SALE_DELETE = "/api/SolitaireSale/delete";
export const SOLITAIRE_SALE_LOT_DETAIL = "/api/SolitaireSale/lot-detail";
export const SOLITAIRE_SALE_ADD_SINGLE_LOT = "/api/SolitaireSale/add-single-lot";
export const SOLITAIRE_SALE_GET_ITEM_FROM_LIST = "/api/SolitaireSale/get-item-from-list";
export const SOLITAIRE_SALE_REFRESH_BACK = "/api/SolitaireSale/refresh-back";
export const SOLITAIRE_SALE_MEMO_TO_SALE = "/api/SolitaireSale/memo-to-sale";
export const SOLITAIRE_SALE_PRINT_VIEW = "/api/SolitaireSale/print-view"; // append /{invNo}
export const SOLITAIRE_SALE_CURRENT_STATUS = "/api/SolitaireSale/current-status"; // append /{invNo}
export const SOLITAIRE_SALE_SHIP_VIA = "/api/SolitaireSale/ship-via"; // ?searchby=

export const SOLITAIRE_SALE_RETURN_LIST = "/api/SolitaireSaleReturn/list";
export const SOLITAIRE_SALE_RETURN_PAGE_DATA = "/api/SolitaireSaleReturn/pagedata";
export const SOLITAIRE_SALE_RETURN_DETAIL = "/api/SolitaireSaleReturn/detail"; // append /{id}
export const SOLITAIRE_SALE_RETURN_ADD = "/api/SolitaireSaleReturn/add";
export const SOLITAIRE_SALE_RETURN_EDIT = "/api/SolitaireSaleReturn/edit";
export const SOLITAIRE_SALE_RETURN_DELETE = "/api/SolitaireSaleReturn/delete";
export const SOLITAIRE_SALE_RETURN_LOT_DETAIL = "/api/SolitaireSaleReturn/lot-detail";
export const SOLITAIRE_SALE_RETURN_ADD_SINGLE_LOT = "/api/SolitaireSaleReturn/add-single-lot";
export const SOLITAIRE_SALE_RETURN_GET_ITEM_FROM_LIST = "/api/SolitaireSaleReturn/get-item-from-list";
export const SOLITAIRE_SALE_RETURN_REFRESH_BACK = "/api/SolitaireSaleReturn/refresh-back";
export const SOLITAIRE_SALE_RETURN_SALE_TO_SALERETURN = "/api/SolitaireSaleReturn/sale-to-salereturn";
export const SOLITAIRE_SALE_RETURN_FILL_SALE_TO_SALERETURN = "/api/SolitaireSaleReturn/fill-sale-to-salereturn";
export const SOLITAIRE_SALE_RETURN_PRINT_VIEW = "/api/SolitaireSaleReturn/print-view"; // append /{invNo}

// Jewellery Purchase entry (MVC: /jewpurchase/*)
export const JEWELLERY_PURCHASE_LIST = "/api/JewelleryPurchase/list";
export const JEWELLERY_PURCHASE_PAGE_DATA = "/api/JewelleryPurchase/pagedata";
export const JEWELLERY_PURCHASE_DETAIL = "/api/JewelleryPurchase/detail"; // append /{id}
export const JEWELLERY_PURCHASE_ADD = "/api/JewelleryPurchase/add";
export const JEWELLERY_PURCHASE_EDIT = "/api/JewelleryPurchase/edit";
export const JEWELLERY_PURCHASE_DELETE = "/api/JewelleryPurchase/delete";
export const JEWELLERY_PURCHASE_STOCK_LIST = "/api/JewelleryPurchase/stock-list"; // ?searchby=
export const JEWELLERY_PURCHASE_LOT_DETAIL = "/api/JewelleryPurchase/lot-detail";
export const JEWELLERY_PURCHASE_ADD_SINGLE_LOT = "/api/JewelleryPurchase/add-single-lot";
export const JEWELLERY_PURCHASE_GET_ITEM_FROM_LIST = "/api/JewelleryPurchase/get-item-from-list";
export const JEWELLERY_PURCHASE_CONSIGNMENT = "/api/JewelleryPurchase/consignment";
export const JEWELLERY_PURCHASE_PRINT_VIEW = "/api/JewelleryPurchase/print-view"; // append /{invNo}
export const JEWELLERY_PURCHASE_CURRENT_STATUS = "/api/JewelleryPurchase/current-status"; // append /{invNo}

// Jew Stock Master (Mounting)
export const GET_MOUNTING_STOCK_LIST = "/api/JewelleryStockMaster/mounting-stock";
export const GET_MOUNTING_STOCK = "/api/JewelleryStockMaster/mounting-stock";
export const GET_MOUNTING_STOCK_DETAIL = "/api/JewelleryStockMaster/mounting-detail"; // append /{id}
export const GET_JEW_METAL_MASTER = "/api/JewelleryStockMaster/list-jew-metal";
export const GET_JEW_COLOR_MASTER = "/api/JewelleryStockMaster/list-jew-color";
export const GET_JEW_PURITY = "/api/JewelleryStockMaster/list-jew-purity";
export const GET_PURE_RATIO = "/api/JewelleryStockMaster/get-pure-ratio";
export const GET_JEW_CATEGORY = "/api/JewelleryStockMaster/list-jew-category";
export const GET_JEW_SUBCATEGORY = "/api/JewelleryStockMaster/list-jew-subcategory";
export const GET_JEW_SETTING_TYPE = "/api/JewelleryStockMaster/jew-setting-type";
export const GET_ADD_MOUNTING_STOCK_DATA = "/api/JewelleryStockMaster/add-stock-mounting";
export const SAVE_MOUNTING_STOCK = "/api/JewelleryStockMaster/save-mounting-stock";
export const DELETE_MOUNTING_STOCK = "/api/JewelleryStockMaster/delete-mounting-stock"; // append /{id}
export const ADD_MOUNTING_ITEM_IN_GRID = "/api/JewelleryStockMaster/add-mounting-item";
export const DELETE_MOUNTING_ITEM_FROM_GRID = "/api/JewelleryStockMaster/delete-mounting-item";
export const GET_NEXT_MOUNTING_STOCK_ID = "/api/JewelleryStockMaster/get-next-mountid";
export const GET_MOUNTING_STOCK_DROPDOWN = "/api/JewelleryStockMaster/mounting-stock-dropdown";
export const GET_ALL_LOTNO_LIST = "/api/JewelleryStockMaster/get-alllotno-listall";
export const GET_JEW_LOTNO_DATA = "/api/JewelleryStockMaster/get-jewlotno-data";
export const GET_SOLITAIRE_LOTS = "/api/SolitaireStockSearchReport/get-solitaire-lots";


// Account Group Master
export const GET_ACC_GRP_MASTER_LIST = "/api/AccGrpMaster/list";
export const GET_ACC_GRP_MASTER_DROPDOWNS = "/api/AccGrpMaster/dropdowns";
export const GET_ACC_GRP_MASTER_DETAIL = "/api/AccGrpMaster/detail"; // append /{id}
export const CHECK_ACC_GRP_NAME_EXISTS = "/api/AccGrpMaster/check-name";
export const GET_CURRENCY_RATES = "/api/AccGrpMaster/currency-rates"; // append /{code}
export const ADD_ACC_GRP_MASTER = "/api/AccGrpMaster/add";
export const UPDATE_ACC_GRP_MASTER = "/api/AccGrpMaster/edit"; // append /{id}
export const DELETE_ACC_GRP_MASTER = "/api/AccGrpMaster/delete"; // append /{id}
export const GET_ACC_EFF_CODE = "/api/AccGrpMaster/eff-code"; // append /{accType}
export const GET_ACC_EFF_SIDE = "/api/AccGrpMaster/eff-side"; // append /{accType}

// Settings
export const GET_SETTING_DATA = "/master/get-setting-data";
export const FILTER_SETTING_DATA = "/master/filter-data";
export const SUBMIT_SETTING_DATA = "/master/submit-setting-data";
export const GET_SETTING_DETAIL = "/master/get-setting";
export const DELETE_SETTING = "/master/delete-setting";
export const UPLOAD_COMPANY_LOGO = "/master/upload-logo";

// Print Format Settings
export const GET_PRINT_FORMAT_DATA = "/master/get-print-format-data";
export const UPDATE_PRINT_FORMAT = "/print/update-print";
export const DELETE_PRINT_FORMAT = "/print/delete-print-setting";
export const GET_INVOICE_FORMAT_SETTING = "/print/get-Invoice-format-setting";
export const PRINT_PREVIEW = "/print/printPrev";

// Column Abbreviations Settings
export const GET_COLUMN_ABBREVIATIONS = "/master/get-ColumnAbbreviations-data";
export const UPDATE_COLUMN_ABBREVIATIONS = "/master/update-ColumnAbbr";

// Sync Settings
export const GET_SYNC_SETTINGS = "/api/SyncSetting/list-sync";
export const SAVE_SYNC_SETTINGS = "/api/SyncSetting/save-sync";

// Solitaire Stock Search Report
export const SOLITAIRE_STOCK_SEARCH_REPORT = "/api/SolitaireStockSearchReport/search";
export const SOLITAIRE_STOCK_SEARCH_PIVOT = "/api/SolitaireStockSearchReport/pivot";
export const SOLITAIRE_STOCK_SEARCH_DROPDOWNS = "/api/SolitaireStockSearchReport/dropdowns";
export const SOLITAIRE_STOCK_SEARCH_UPDATE_LOCATION = "/api/SolitaireStockSearchReport/update-location";
export const SOLITAIRE_STOCK_SEARCH_UPDATE_BOX_GROUP = "/api/SolitaireStockSearchReport/update-box-group";
export const SOLITAIRE_STOCK_SEARCH_EMAIL_SETTINGS = "/api/SolitaireStockSearchReport/email-settings";
export const SOLITAIRE_STOCK_SEARCH_EMAIL_STOCK_LIST = "/api/SolitaireStockSearchReport/email-stock-list";
export const SOLITAIRE_STOCK_SEARCH_HISTORY = "/api/SolitaireStockSearchReport/stock-history";

// Solitaire Admin Stock Report
export const SOLITAIRE_ADMIN_STOCK_REPORT = "/api/SolitaireAdminStockReport/search";
export const SOLITAIRE_ADMIN_STOCK_DROPDOWNS = "/api/SolitaireAdminStockReport/dropdowns";
export const SOLITAIRE_ADMIN_STOCK_LOTS = "/api/SolitaireAdminStockReport/get-solitaire-lots";
export const SOLITAIRE_ADMIN_STOCK_UPDATE_LOCATION = "/api/SolitaireAdminStockReport/update-location";
export const SOLITAIRE_ADMIN_STOCK_UPDATE_BOX_GROUP = "/api/SolitaireAdminStockReport/update-box-group";

// Solitaire Stock History Report
export const SOLITAIRE_STOCK_HISTORY_REPORT = "/api/SolitaireStockHistoryReport/search";

// Solitaire Grading Comparison Report
export const SOLITAIRE_GRADING_COMPARISON_REPORT = "/api/SolitaireGradingComparisonReport/search";
export const SOLITAIRE_GRADING_COMPARISON_DROPDOWNS = "/api/SolitaireGradingComparisonReport/dropdowns";

// Solitaire Rate Revise Report
export const SOLITAIRE_RATE_REVISE_REPORT = "/api/SolitaireRateReviseReport/search";
export const SOLITAIRE_RATE_REVISE_DROPDOWNS = "/api/SolitaireRateReviseReport/dropdowns";

// Solitaire Purchase Report
export const SOLITAIRE_PURCHASE_REPORT = "/api/SolitairePurchaseReport/search";
export const SOLITAIRE_PURCHASE_DROPDOWNS = "/api/SolitairePurchaseReport/dropdowns";

// Solitaire Purchase Return Report
export const SOLITAIRE_PURCHASE_RETURN_REPORT = "/api/SolitairePurchaseReturnReport/search";
export const SOLITAIRE_PURCHASE_RETURN_DROPDOWNS = "/api/SolitairePurchaseReturnReport/dropdowns";

// Solitaire Sale Return Report
export const SOLITAIRE_SALE_RETURN_REPORT = "/api/SolitaireSaleReturnReport/search";
export const SOLITAIRE_SALE_RETURN_DROPDOWNS = "/api/SolitaireSaleReturnReport/dropdowns";

// Solitaire Consignment Return Report
export const SOLITAIRE_CONSIGNMENT_RETURN_REPORT = "/api/SolitaireConsignmentReturnReport/search";
export const SOLITAIRE_CONSIGNMENT_RETURN_DROPDOWNS = "/api/SolitaireConsignmentReturnReport/dropdowns";

// Solitaire Memo Return Report
export const SOLITAIRE_MEMO_RETURN_REPORT = "/api/SolitaireMemoReturnReport/search";
export const SOLITAIRE_MEMO_RETURN_DROPDOWNS = "/api/SolitaireMemoReturnReport/dropdowns";


// Solitaire Consignment In Report
export const SOLITAIRE_CONSIGNMENT_IN_REPORT = "/api/SolitaireConsignmentInReport/search";
export const SOLITAIRE_CONSIGNMENT_IN_SUMMARY = "/api/SolitaireConsignmentInReport/summary";
export const SOLITAIRE_CONSIGNMENT_IN_DROPDOWNS = "/api/SolitaireConsignmentInReport/dropdowns";

// Solitaire Memo Out Report
export const SOLITAIRE_MEMO_OUT_REPORT = "/api/SolitaireMemoOutReport/search";
export const SOLITAIRE_MEMO_OUT_DROPDOWNS = "/api/SolitaireMemoOutReport/dropdowns";

// Solitaire Party Hold Report
export const SOLITAIRE_PARTY_HOLD_REPORT = "/api/SolitairePartyHoldReport/search";
export const SOLITAIRE_PARTY_HOLD_DROPDOWNS = "/api/SolitairePartyHoldReport/dropdowns";

// Solitaire Aging Report
export const SOLITAIRE_AGING_REPORT = "/api/SolitaireAgingReport/search";
export const SOLITAIRE_AGING_DROPDOWNS = "/api/SolitaireAgingReport/dropdowns";

export const OUTSTANDING_REPORT_DROPDOWNS = "/api/OutstandingReport/dropdowns";
export const OUTSTANDING_REPORT_LIST = "/api/OutstandingReport/list";

export const LOAN_OUTSTANDING_REPORT_DROPDOWNS = "/api/LoanOutstandingReport/dropdowns";
export const LOAN_OUTSTANDING_REPORT_LIST = "/api/LoanOutstandingReport/list";

export const BROKERAGE_OUTSTANDING_REPORT_DROPDOWNS = "/api/BrokerageOutstandingReport/dropdowns";
export const BROKERAGE_OUTSTANDING_REPORT_LIST = "/api/BrokerageOutstandingReport/list";

export const COMMISSION_OUTSTANDING_REPORT_DROPDOWNS = "/api/CommissionOutstandingReport/dropdowns";
export const COMMISSION_OUTSTANDING_REPORT_LIST = "/api/CommissionOutstandingReport/list";

export const SALE_PURCHASE_SUMMARY_REPORT_DROPDOWNS = "/api/SalePurchaseSummaryReport/dropdowns";
export const SALE_PURCHASE_SUMMARY_REPORT_LIST = "/api/SalePurchaseSummaryReport/list";

// Solitaire Fast Moving Report
export const SOLITAIRE_FAST_MOVING_REPORT = "/api/SolitaireFastMovingReport/search";
export const SOLITAIRE_FAST_MOVING_DISPLAY = "/api/SolitaireFastMovingReport/display";
export const SOLITAIRE_FAST_MOVING_DROPDOWNS = "/api/SolitaireFastMovingReport/dropdowns";

// Solitaire Lot Assortment Report (MVC: /report/lotAssortment-report)
export const SOLITAIRE_LOT_ASSORTMENT_REPORT = "/api/SolitaireLotAssortmentReport/search";

// Solitaire Kapan Summary Report
export const SOLITAIRE_KAPAN_SUMMARY_REPORT = "/api/SolitaireKapanSummaryReport/search";

// Solitaire Sale Report
export const SOLITAIRE_SALE_REPORT = "/api/SolitaireSaleReport/search";
export const SOLITAIRE_SALE_DROPDOWNS = "/api/SolitaireSaleReport/dropdowns";

// Solitaire Sale Performance Report
export const SOLITAIRE_SALE_PERFORMANCE_REPORT = "/api/SolitaireSalePerformanceReport/search";
export const SOLITAIRE_SALE_PERFORMANCE_DROPDOWNS = "/api/SolitaireSalePerformanceReport/dropdowns";

// Solitaire Stock Consumption Report (MVC: report/stock-consumption-report)
export const SOLITAIRE_CONSUMPTION_REPORT = "/api/SolitaireConsumptionReport/search";
export const SOLITAIRE_CONSUMPTION_DROPDOWNS = "/api/SolitaireConsumptionReport/dropdowns";

// Month Analysis Report
export const MONTH_ANALYSIS_REPORT_DATA = "/api/MonthAnalysisReport/report";
export const MONTH_ANALYSIS_REPORT_DROPDOWNS = "/api/MonthAnalysisReport/dropdowns";

// Purchase Analysis Report
export const PURCHASE_ANALYSIS_REPORT_DATA = "/api/PurchaseAnalysisReport/report";
export const PURCHASE_ANALYSIS_REPORT_DROPDOWNS = "/api/PurchaseAnalysisReport/dropdowns";

// Sale Analysis Report
export const SALE_ANALYSIS_REPORT_DATA = "/api/SaleAnalysisReport/report";
export const SALE_ANALYSIS_REPORT_PIVOT_DATA = "/api/SaleAnalysisReport/pivotdata";
export const SALE_ANALYSIS_REPORT_DROPDOWNS = "/api/SaleAnalysisReport/dropdowns";

// Stock Analysis Report
export const STOCK_ANALYSIS_REPORT_DATA = "/api/StockAnalysisReport/report";
export const STOCK_ANALYSIS_PIVOT_BY_FILTER = "/api/StockAnalysisReport/pivotbyfilter";
export const STOCK_ANALYSIS_PIVOT_FIXED = "/api/StockAnalysisReport/pivotfixed";
export const STOCK_ANALYSIS_REPORT_DROPDOWNS = "/api/StockAnalysisReport/dropdowns";

// Parcel Stock Analysis Report
export const PARCEL_STOCK_ANALYSIS_REPORT_DATA = "/api/ParcelStockAnalysis/parcelstockchart-data";
export const PARCEL_STOCK_ANALYSIS_PIVOT_DATA = "/api/ParcelStockAnalysis/parcelstock-pivotdata";
export const PARCEL_STOCK_ANALYSIS_REPORT_DROPDOWNS = "/api/ParcelStockAnalysis/dropdowns";

// Parcel Sale Analysis Report
export const PARCEL_SALE_ANALYSIS_REPORT_DATA = "/api/ParcelSaleAnalysis/parcelsale-data";
export const PARCEL_SALE_ANALYSIS_PIVOT_DATA = "/api/ParcelSaleAnalysis/parcelsale-pivotdata";
export const PARCEL_SALE_ANALYSIS_REPORT_DROPDOWNS = "/api/ParcelSaleAnalysis/dropdowns";

// Parcel Purchase Analysis Report
export const PARCEL_PURCHASE_ANALYSIS_REPORT_DATA = "/api/ParcelPurchaseAnalysis/parcelpur-data";
export const PARCEL_PURCHASE_ANALYSIS_REPORT_DROPDOWNS = "/api/ParcelPurchaseAnalysis/dropdowns";



// Parcel Stock Search Report
export const Parcel_STOCK_SEARCH_REPORT = "/api/ParcelStockSearchReport/load";
export const Parcel_STOCK_SEARCH_List = "/api/ParcelStockSearchReport/list";
export const Parcel_STOCK_SEARCH_DROPDOWNS = "/api/ParcelStockSearchReport/dropdowns";
export const GET_Parcel_LOTS = "/api/ParcelStockSearchReport/get-parcel-lots";
export const Parcel_STOCK_SEARCH_UPDATE_LOCATION = "/api/ParcelStockSearchReport/update-location";
export const Parcel_STOCK_SEARCH_UPDATE_BOX_GROUP = "/api/ParcelStockSearchReport/update-box-group";


// Parcel Stock Register Report
export const Parcel_STOCK_REGISTER_REPORT = "/api/ParcelStockRegisterReport/datatable";
// export const Parcel_STOCK_REGISTER_List = "/api/ParcelStockRegisterReport/datatable";
export const Parcel_STOCK_REGISTER_DROPDOWNS = "/api/ParcelStockRegisterReport/dropdowns";
export const GET_ParcelStockRegister_LOTS = "/api/ParcelStockRegisterReport/get-parcel-lots";

// Jewellery Stock Search Report
export const JEWELLERY_STOCK_SEARCH_REPORT = "/api/JewelleryStockReport/search";
export const JEWELLERY_STOCK_SEARCH_DROPDOWNS = "/api/JewelleryStockReport/dropdowns";
export const JEWELLERY_STOCK_SEARCH_STOCK_IDS = "/api/JewelleryStockReport/stock-ids";

// DiaAnalytics / Stock Analyze (MVC: /data/StockAnalyze)
export const GET_STOCK_ANALYZE_CONFIG = "/api/StockAnalyze/config";


// Mix Purchase Report
export const MIX_PURCHASE_REPORT_DROPDOWNS = "/api/mixreport/dropdowns";
export const MIX_PURCHASE_REPORT_LIST = "/api/mixreport/generalpurchase-report-list";

// Mix Purchase Return Report (MVC: /mixreport/GeneralPur-Return-report)
export const MIX_PUR_RTN_REPORT_DROPDOWNS = "/api/GeneralPur-Return-report/mixpur-return-report-dropdowns";
export const MIX_PUR_RTN_REPORT_LIST = "/api/GeneralPur-Return-report/mixpur-return-report-list";

// Mix Memo Out Report
export const MIX_MEMO_OUT_REPORT_DROPDOWNS = "/api/mixreport/mixmemo-report-dropdowns";
export const MIX_MEMO_OUT_REPORT_LIST = "/api/mixreport/mixmemo-report-list";

// Mix Memo Return Report (MVC: /mixreport/MixMemo-Return-report)
export const MIX_MEMO_OUT_RTN_REPORT_DROPDOWNS = "/api/MixMemo-Return-report/mixmemoreturn-report-dropdowns";
export const MIX_MEMO_OUT_RTN_REPORT_LIST = "/api/MixMemo-Return-report/mixmemoreturn-report-list";

// Mix Sale Report (MVC: /mixreport/GeneralSale-Report)
export const MIX_SALE_REPORT_DROPDOWNS = "/api/GeneralSale-Report/dropdowns";
export const MIX_SALE_REPORT_LIST = "/api/GeneralSale-Report/generalsale-report-list";

// Mix Sale Return Report (MVC: /mixreport/GeneralSale-Return-report)
export const MIX_SALE_RTN_REPORT_DROPDOWNS = "/api/GeneralSale-Return-report/dropdowns";
export const MIX_SALE_RTN_REPORT_LIST = "/api/GeneralSale-Return-report/Generalsale-rtnreport-list";

// Mix Consignment Report (MVC: /mixreport/MixConsignment-report)
export const MIX_CONSIGNMENT_REPORT_DROPDOWNS = "/api/MixConsignment-report/mixconsignment-report-dropdowns";
export const MIX_CONSIGNMENT_REPORT_LIST = "/api/MixConsignment-report/mixconsignment-report-list";
export const MIX_CONSIGNMENT_REPORT_SUMMARY = "/api/MixConsignment-report/mixconsignment-summary";

// Mix Consignment Return Report (MVC: /mixreport/MixConsignment-Return-report)
export const MIX_CONSIGNMENT_IN_RTN_REPORT_DROPDOWNS = "/api/MixConsignment-Return-report/MixConsignment-Return-report-dropdown";
export const MIX_CONSIGNMENT_IN_RTN_REPORT_LIST = "/api/MixConsignment-Return-report/MixConsignment-report-Returnlist";
// Ledger Report (MVC: /Account/LedgerRpt)
export const LEDGER_REPORT_DROPDOWNS = "/api/LedgerReport/LedgerRpt";
export const LEDGER_REPORT_LISTS = "/api/LedgerReport/GetLedgerReportLists";
export const LEDGER_REPORT_LIST1 = "/api/LedgerReport/GetLedgerReporList1";
export const LEDGER_REPORT_PRINT_JS = "/api/LedgerReport/LedgerReportPrintJS";

// Month Expense Report (MVC: /report/month-expense-report)
export const MONTH_EXPENSE_REPORT_PERMISSION = "/api/MonthExpenseReport/month-expense-report";
export const MONTH_EXPENSE_REPORT_DATA = "/api/MonthExpenseReport/month-expense-report";

// Cash Flow Report (MVC: /report/cash-flow-report)
export const CASH_FLOW_REPORT_PERMISSION = "/api/CashFlowReport/cash-flow-report";
export const CASH_FLOW_REPORT_DATA = "/api/CashFlowReport/cash-flow-report";

// Profit and Loss Report (MVC: /Account/TradingAccount)
export const PROFIT_LOSS_REPORT_PERMISSION = "/api/ProfitLossReport/TradingAccount";
export const PROFIT_LOSS_REPORT_DATA = "/api/ProfitLossReport/Getprofitandlossdata";

// Trial Balance Sheet Report (MVC: /Account/TrialBalSheet)
export const TRIAL_BALANCE_SHEET_REPORT_PERMISSION = "/api/TrialBalanceSheetReport/TrialBalSheet";
export const TRIAL_BALANCE_SHEET_REPORT_DATA = "/api/TrialBalanceSheetReport/GetData";

// Balance Sheet Report (MVC: /Account/BalanceSheet)
export const BALANCE_SHEET_REPORT_PERMISSION = "/api/BalanceSheetReport/BalanceSheet";
export const BALANCE_SHEET_REPORT_DATA = "/api/BalanceSheetReport/GetbalsheetReportListNew";

// Invoice Ledger Report (MVC: /report/invoice-ledger-report)
export const INVOICE_LEDGER_REPORT_PERMISSION = "/api/InvoiceLedgerReport/invoice-ledger-report";
export const INVOICE_LEDGER_REPORT_DATA = "/api/InvoiceLedgerReport/invoice-ledger-report";

// Download MRP (MVC: /data/downloadMRP)
export const DOWNLOAD_MRP_PERMISSION = "/api/DownloadMRP/downloadMRP";
//export const DOWNLOAD_MRP = "/api/DownloadMRP/downloadMRP";
export const UPDATE_MRP = "/api/DownloadMRP/updateMRP";

export const DOWNLOAD_MRP = "/api/DownloadMRP/downloadsMRP";

// Convert Excel Utility (MVC: /dashbord/uploadexcel)
export const CONVERT_EXCEL_UTILITY_PERMISSION = "/api/ConvertExcelUtility/uploadexcel";
export const CONVERT_EXCEL_UTILITY_UPLOAD = "/api/ConvertExcelUtility/Upload";

// Stock Telly (MVC: /data/stocktellydata)
export const STOCK_TELLY_PERMISSION = "/api/StockTelly/stocktellydata";
export const STOCK_TELLY_FILTER = "/api/StockTelly/stocktellyfilter";
export const STOCK_TELLY_IMPORT = "/api/StockTelly/import-stelly";
export const STOCK_TELLY_SAVE = "/api/StockTelly/Save-StockTelly";

// Master Price Comparison (MVC: /data/MasterPriceComparison)
export const MASTER_PRICE_COMPARISON_PERMISSION = "/api/MasterPriceComparison/MasterPriceComparison";
export const MASTER_PRICE_COMPARISON_LIST = "/api/MasterPriceComparison/MasterPriceComparison-List";

// Stock Price Comparison (MVC: /data/StockPriceComparison)
export const STOCK_PRICE_COMPARISON_PERMISSION = "/api/StockPriceComparison/StockPriceComparison";
export const STOCK_PRICE_COMPARISON_LIST = "/api/StockPriceComparison/StockPriceComparison-List";

// Missing Stock (MVC: /data/MissingStock)
export const MISSING_STOCK_PERMISSION = "/api/MissingStock/MissingStock";
export const MISSING_STOCK_SEARCH = "/api/MissingStock/Missing-stock-search";

// Stock Transfer (MVC: /Stock/Stock-transfer-list)
export const STOCK_TRANSFER_LIST = "/api/StockTransfer/Stock-transfer-list";
export const STOCK_TRANSFER_ADD_PERMISSION = "/api/StockTransfer/Stock-transfer";
export const STOCK_TRANSFER_SAVE = "/api/StockTransfer/Save-Stock-transfer";
export const STOCK_TRANSFER_DELETE = "/api/StockTransfer/Stock-transfer-delete";
export const STOCK_TRANSFER_LOT_DETAILS = "/api/StockTransfer/Stock-transfer-stonedetails";
export const STOCK_TRANSFER_LOTNO_LIST = "/api/StockTransfer/get-alllotno-list";

// Import Grading (MVC: /data/importgrading)
export const IMPORT_GRADING_PERMISSION = "/api/ImportGrading/importgrading";
export const IMPORT_GRADING_UPDATE_GIA = "/api/ImportGrading/update-gia-data";
export const IMPORT_GRADING_UPDATE_IGI = "/api/ImportGrading/update-igi-data";
export const IMPORT_GRADING_UPDATE_HRD = "/api/ImportGrading/update-hrd-data";
export const IMPORT_GRADING_UPDATE_GRADER = "/api/ImportGrading/update-grader-data";
export const IMPORT_GRADING_UPDATE_PURCHASE = "/api/ImportGrading/update-purchase-data";
export const IMPORT_GRADING_UPDATE_IMAGE_VIDEO = "/api/ImportGrading/update-image-video-data";
export const IMPORT_GRADING_UPDATE_PARCEL = "/api/ImportGrading/update-parcelitem-data";
export const IMPORT_GRADING_UPDATE_SOLITAIRE = "/api/ImportGrading/update-solitaireitem-data";
export const IMPORT_GRADING_UPDATE_ACCOUNT = "/api/ImportGrading/update-accountdata";
export const IMPORT_GRADING_UPLOAD_PURCHASE = "/api/ImportGrading/upload-purchasedata";
export const IMPORT_GRADING_UPLOAD_PURCHASE_DETAILS = "/api/ImportGrading/upload-purchasedetails";
// Disabled: Import Sale commented in MVC UI
// export const IMPORT_GRADING_IMPORT_SALE = "/api/ImportGrading/import-sale-data";
// Disabled: legacy UploadJewData() commented in MVC UI
// export const IMPORT_GRADING_UPLOAD_JEW_STOCK = "/api/ImportGrading/upload-jewstockdata";
export const IMPORT_GRADING_UPLOAD_JEW_DIAMOND = "/api/ImportGrading/upload-jewstockdiamonddetailsdata";
export const IMPORT_GRADING_UPDATE_SIZE_ID = "/api/ImportGrading/update-SizeId";
export const IMPORT_GRADING_DELETE_RECORDS = "/api/ImportGrading/delete-deletedrecords";
export const IMPORT_GRADING_UPLOAD_LOGO = "/api/ImportGrading/UploadLogo";
export const IMPORT_GRADING_UPLOAD_JEWELLERY_FULL = "/api/ImportGrading/upload-jewellery-full";
export const IMPORT_GRADING_IMPORT_ASKING_RATE = "/api/ImportGrading/Inventory/ImportAskingRate";


// Jewellery Purchase Report
export const JEWELLERY_PURCHASE_REPORT = "/api/JewelleryPurchaseReport/search";
export const JEWELLERY_PURCHASE_DROPDOWNS = "/api/JewelleryPurchaseReport/dropdowns";

// Jewellery Purchase Return Report
export const JEWELLERY_PURCHASE_RETURN_REPORT = "/api/JewelleryPurchaseRetunReport/search";
export const JEWELLERY_PURCHASE_RETURN_DROPDOWNS = "/api/JewelleryPurchaseRetunReport/dropdowns";

// Jewellery Sale Report
export const JEWELLERY_SALE_REPORT = "/api/JewellerySaleReport/search";
export const JEWELLERY_SALE_DROPDOWNS = "/api/JewellerySaleReport/dropdowns";

// Jewellery Sale Return Report
export const JEWELLERY_SALE_RETURN_REPORT = "/api/JewSaleReturnReport/search";
export const JEWELLERY_SALE_RETURN_DROPDOWNS = "/api/JewSaleReturnReport/dropdowns";

// Jewellery MemoOut Report
export const JEWELLERY_MEMO_OUT_REPORT = "/api/JewelleryMemoOutReport/search";
export const JEWELLERY_MEMO_OUT_DROPDOWNS = "/api/JewelleryMemoOutReport/dropdowns";

// Jewellery MemoIn Return Report
export const JEWELLERY_MEMO_IN_RETURN_REPORT = "/api/JewelleryMemoInReturnReport/search";
export const JEWELLERY_MEMO_IN_RETURN_DROPDOWNS = "/api/JewelleryMemoInReturnReport/dropdowns";

// Jewellery MemoOut Return Report
export const JEWELLERY_MEMO_OUT_RETURN_REPORT = "/api/JewelleryMemoOutReturnReporte/search";
export const JEWELLERY_MEMO_OUT_RETURN_DROPDOWNS = "/api/JewelleryMemoOutReturnReporte/dropdowns";

// Jewellery ConsignMent In Report
export const JEWELLERY_CONSIGN_IN_REPORT = "/api/JewelleryConsignMentInReport/search";
export const JEWELLERY_CONSIGN_IN_SUMMARY = "/api/JewelleryConsignMentInReport/summary";
export const JEWELLERY_CONSIGN_IN_DROPDOWNS = "/api/JewelleryConsignMentInReport/dropdowns";

// Jewellery Stock History Report
export const JEWELLERY_STOCK_HISTORY_REPORT = "/api/JewelleryStockHistoryReport/jewstock-register-report-datatable";
export const JEWELLERY_STOCK_HISTORY_DROPDOWNS = "/api/JewelleryStockHistoryReport/dropdowns";
export const JEWELLERY_STOCK_HISTORY_STOCK_IDS = "/api/JewelleryStockHistoryReport/stock-ids";

// Import Pricing (MVC: /data/import-pricing)
export const IMPORT_PRICING_PERMISSION = "/api/ImportPricing/import-pricing";
export const IMPORT_PRICING_UPLOAD = "/api/ImportPricing/imports-pricing";
export const IMPORT_PRICING_SAVE = "/api/ImportPricing/save-price";

// Get Lab Data (MVC: /data/getlabdata)
export const GET_LAB_DATA_PERMISSION = "/api/GetLabData/getlabdata";
export const GET_LAB_DATA_FROM_LIST = "/api/GetLabData/get-item-from-list";
export const GET_LAB_DATA_IMPORT_CERT = "/api/GetLabData/import-cert";
export const GET_LAB_DATA_GIA = "/api/GetLabData/get-gia-data";
export const GET_LAB_DATA_IGI = "/api/GetLabData/get-igi-data";
export const GET_LAB_DATA_PRINT = "/api/GetLabData/getlabdataprint";
