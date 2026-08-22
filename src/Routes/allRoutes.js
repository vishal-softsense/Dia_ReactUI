import React from "react";
import { Navigate } from "react-router-dom";

//Dashboard
import DashboardAnalytics from "../pages/DashboardAnalytics";
import DashboardCrm from "../pages/DashboardCrm";
import DashboardEcommerce from "../pages/DashboardEcommerce";
import Dashboard from "../pages/Dashboard/Dashboard";
import ParcelDashboard from "../pages/ParcelDashboard/ParcelDashboard";
import MonthAnalysisReport from "../pages/Dashboard/MonthAnalysisReport";
import PurchaseAnalysisReport from "../pages/Dashboard/PurchaseAnalysisReport";
import SaleAnalysisReport from "../pages/Dashboard/SaleAnalysisReport";
import StockAnalysisReport from "../pages/Dashboard/StockAnalysisReport";

import ParcelStockAnalysis from "../pages/ParcelDashboard/ParcelStockAnalysisReport";
import ParcelSaleAnalysisReport from "../pages/ParcelDashboard/ParcelSaleAnalysisReport";
import ParcelPurchaseAnalysis from "../pages/ParcelDashboard/ParcelPurchaseAnalysisReport";

import DashboardCrypto from "../pages/DashboardCrypto";
import DashboardProject from "../pages/DashboardProject";
import DashboardNFT from "../pages/DashboardNFT";
import DashboardJob from "../pages/DashboardJob/";

//Calendar
import Calendar from "../pages/Calendar/Maincalender";
import MonthGrid from "../pages/Calendar/MonthGrid";


// Email box
import MailInbox from "../pages/EmailInbox";
import BasicAction from "../pages/Email/EmailTemplates/BasicAction";
import EcommerceAction from "../pages/Email/EmailTemplates/EcommerceAction";

//Chat
import Chat from "../pages/Chat";

// Project
import ProjectList from "../pages/Projects/ProjectList";
import ProjectOverview from "../pages/Projects/ProjectOverview";
import CreateProject from "../pages/Projects/CreateProject";

//Task
import TaskDetails from "../pages/Tasks/TaskDetails";
import TaskList from "../pages/Tasks/TaskList";
import Kanbanboard from "../pages/Tasks/KanbanBoard";

//Transactions
import Transactions from '../pages/Crypto/Transactions';
import BuySell from '../pages/Crypto/BuySell';
import CryproOrder from '../pages/Crypto/CryptoOrder';
import MyWallet from '../pages/Crypto/MyWallet';
import ICOList from '../pages/Crypto/ICOList';
import KYCVerification from '../pages/Crypto/KYCVerification';

//Crm Pages
import CrmCompanies from "../pages/Crm/CrmCompanies";
import CrmContacts from "../pages/Crm/CrmContacts";
import CrmDeals from "../pages/Crm/CrmDeals/index";
import CrmLeads from "../pages/Crm/CrmLeads/index";

//Invoices
import InvoiceList from "../pages/Invoices/InvoiceList";
import InvoiceCreate from "../pages/Invoices/InvoiceCreate";
import InvoiceDetails from "../pages/Invoices/InvoiceDetails";

// Support Tickets
import ListView from '../pages/SupportTickets/ListView';
import TicketsDetails from '../pages/SupportTickets/TicketsDetails';

// //Ecommerce Pages
import EcommerceProducts from "../pages/Ecommerce/EcommerceProducts/index";
import EcommerceProductDetail from "../pages/Ecommerce/EcommerceProducts/EcommerceProductDetail";
import EcommerceAddProduct from "../pages/Ecommerce/EcommerceProducts/EcommerceAddProduct";
import EcommerceOrders from "../pages/Ecommerce/EcommerceOrders/index";
import EcommerceOrderDetail from "../pages/Ecommerce/EcommerceOrders/EcommerceOrderDetail";
import EcommerceCustomers from "../pages/Ecommerce/EcommerceCustomers/index";
import EcommerceCart from "../pages/Ecommerce/EcommerceCart";
import EcommerceCheckout from "../pages/Ecommerce/EcommerceCheckout";
import EcommerceSellers from "../pages/Ecommerce/EcommerceSellers/index";
import EcommerceSellerDetail from "../pages/Ecommerce/EcommerceSellers/EcommerceSellerDetail";

// NFT Marketplace Pages
import Marketplace from "../pages/NFTMarketplace/Marketplace";
import Collections from "../pages/NFTMarketplace/Collections";
import CreateNFT from "../pages/NFTMarketplace/CreateNFT";
import Creators from "../pages/NFTMarketplace/Creators";
import ExploreNow from "../pages/NFTMarketplace/ExploreNow";
import ItemDetails from "../pages/NFTMarketplace/Itemdetails";
import LiveAuction from "../pages/NFTMarketplace/LiveAuction";
import Ranking from "../pages/NFTMarketplace/Ranking";
import WalletConnect from "../pages/NFTMarketplace/WalletConnect";

// Base Ui
import UiAlerts from "../pages/BaseUi/UiAlerts/UiAlerts";
import UiBadges from "../pages/BaseUi/UiBadges/UiBadges";
import UiButtons from "../pages/BaseUi/UiButtons/UiButtons";
import UiColors from "../pages/BaseUi/UiColors/UiColors";
import UiCards from "../pages/BaseUi/UiCards/UiCards";
import UiCarousel from "../pages/BaseUi/UiCarousel/UiCarousel";
import UiDropdowns from "../pages/BaseUi/UiDropdowns/UiDropdowns";
import UiGrid from "../pages/BaseUi/UiGrid/UiGrid";
import UiImages from "../pages/BaseUi/UiImages/UiImages";
import UiTabs from "../pages/BaseUi/UiTabs/UiTabs";
import UiAccordions from "../pages/BaseUi/UiAccordion&Collapse/UiAccordion&Collapse";
import UiModals from "../pages/BaseUi/UiModals/UiModals";
import UiOffcanvas from "../pages/BaseUi/UiOffcanvas/UiOffcanvas";
import UiPlaceholders from "../pages/BaseUi/UiPlaceholders/UiPlaceholders";
import UiProgress from "../pages/BaseUi/UiProgress/UiProgress";
import UiNotifications from "../pages/BaseUi/UiNotifications/UiNotifications";
import UiMediaobject from "../pages/BaseUi/UiMediaobject/UiMediaobject";
import UiEmbedVideo from "../pages/BaseUi/UiEmbedVideo/UiEmbedVideo";
import UiTypography from "../pages/BaseUi/UiTypography/UiTypography";
import UiList from "../pages/BaseUi/UiLists/UiLists";
import UiGeneral from "../pages/BaseUi/UiGeneral/UiGeneral";
import UiRibbons from "../pages/BaseUi/UiRibbons/UiRibbons";
import UiUtilities from "../pages/BaseUi/UiUtilities/UiUtilities";

// Advance Ui
import UiNestableList from "../pages/AdvanceUi/UiNestableList/UiNestableList";
import UiScrollbar from "../pages/AdvanceUi/UiScrollbar/UiScrollbar";
import UiAnimation from "../pages/AdvanceUi/UiAnimation/UiAnimation";
import UiSwiperSlider from "../pages/AdvanceUi/UiSwiperSlider/UiSwiperSlider";
import UiRatings from "../pages/AdvanceUi/UiRatings/UiRatings";
import UiHighlight from "../pages/AdvanceUi/UiHighlight/UiHighlight";

// Widgets
import Widgets from '../pages/Widgets/Index';

//Forms
import BasicElements from "../pages/Forms/BasicElements/BasicElements";
import FormSelect from "../pages/Forms/FormSelect/FormSelect";
import FormEditor from "../pages/Forms/FormEditor/FormEditor";
import CheckBoxAndRadio from "../pages/Forms/CheckboxAndRadio/CheckBoxAndRadio";
import Masks from "../pages/Forms/Masks/Masks";
import FileUpload from "../pages/Forms/FileUpload/FileUpload";
import FormPickers from "../pages/Forms/FormPickers/FormPickers";
import FormRangeSlider from "../pages/Forms/FormRangeSlider/FormRangeSlider";
import Formlayouts from "../pages/Forms/FormLayouts/Formlayouts";
import FormValidation from "../pages/Forms/FormValidation/FormValidation";
import FormWizard from "../pages/Forms/FormWizard/FormWizard";
import FormAdvanced from "../pages/Forms/FormAdvanced/FormAdvanced";
import Select2 from "../pages/Forms/Select2/Select2";

//Tables
import BasicTables from '../pages/Tables/BasicTables/BasicTables';
import ListTables from '../pages/Tables/ListTables/ListTables';
import ReactTable from "../pages/Tables/ReactTables";

//Icon pages
import RemixIcons from "../pages/Icons/RemixIcons/RemixIcons";
import BoxIcons from "../pages/Icons/BoxIcons/BoxIcons";
import MaterialDesign from "../pages/Icons/MaterialDesign/MaterialDesign";
import FeatherIcons from "../pages/Icons/FeatherIcons/FeatherIcons";
import LineAwesomeIcons from "../pages/Icons/LineAwesomeIcons/LineAwesomeIcons";
import CryptoIcons from "../pages/Icons/CryptoIcons/CryptoIcons";

//Maps
import GoogleMaps from "../pages/Maps/GoogleMaps/GoogleMaps";

//AuthenticationInner pages
import BasicSignIn from '../pages/AuthenticationInner/Login/BasicSignIn';
import CoverSignIn from '../pages/AuthenticationInner/Login/CoverSignIn';
import BasicSignUp from '../pages/AuthenticationInner/Register/BasicSignUp';
import CoverSignUp from "../pages/AuthenticationInner/Register/CoverSignUp";
import BasicPasswReset from '../pages/AuthenticationInner/PasswordReset/BasicPasswReset';
//pages
import Starter from '../pages/Pages/Starter/Starter';
import SimplePage from '../pages/Pages/Profile/SimplePage/SimplePage';
import Settings from '../pages/Pages/Profile/Settings/Settings';
import Team from '../pages/Pages/Team/Team';
import Timeline from '../pages/Pages/Timeline/Timeline';
import Faqs from '../pages/Pages/Faqs/Faqs';
import Pricing from '../pages/Pages/Pricing/Pricing';
import Gallery from '../pages/Pages/Gallery/Gallery';
import Maintenance from '../pages/Pages/Maintenance/Maintenance';
import ComingSoon from '../pages/Pages/ComingSoon/ComingSoon';
import SiteMap from '../pages/Pages/SiteMap/SiteMap';
import SearchResults from '../pages/Pages/SearchResults/SearchResults';

import CoverPasswReset from '../pages/AuthenticationInner/PasswordReset/CoverPasswReset';
import BasicLockScreen from '../pages/AuthenticationInner/LockScreen/BasicLockScr';
import CoverLockScreen from '../pages/AuthenticationInner/LockScreen/CoverLockScr';
import BasicLogout from '../pages/AuthenticationInner/Logout/BasicLogout';
import CoverLogout from '../pages/AuthenticationInner/Logout/CoverLogout';
import BasicSuccessMsg from '../pages/AuthenticationInner/SuccessMessage/BasicSuccessMsg';
import CoverSuccessMsg from '../pages/AuthenticationInner/SuccessMessage/CoverSuccessMsg';
import BasicTwosVerify from '../pages/AuthenticationInner/TwoStepVerification/BasicTwosVerify';
import CoverTwosVerify from '../pages/AuthenticationInner/TwoStepVerification/CoverTwosVerify';
import Basic404 from '../pages/AuthenticationInner/Errors/Basic404';
import Cover404 from '../pages/AuthenticationInner/Errors/Cover404';
import Alt404 from '../pages/AuthenticationInner/Errors/Alt404';
import Error500 from '../pages/AuthenticationInner/Errors/Error500';

import BasicPasswCreate from "../pages/AuthenticationInner/PasswordCreate/BasicPasswCreate";
import CoverPasswCreate from "../pages/AuthenticationInner/PasswordCreate/CoverPasswCreate";
import Offlinepage from "../pages/AuthenticationInner/Errors/Offlinepage";

//APi Key
import APIKey from "../pages/APIKey/index";

//login
import Login from "../pages/Authentication/Login";
import ForgetPasswordPage from "../pages/Authentication/ForgetPassword";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";

//Charts
import LineCharts from "../pages/Charts/ApexCharts/LineCharts";
import AreaCharts from "../pages/Charts/ApexCharts/AreaCharts";
import ColumnCharts from "../pages/Charts/ApexCharts/ColumnCharts";
import BarCharts from "../pages/Charts/ApexCharts/BarCharts";
import MixedCharts from "../pages/Charts/ApexCharts/MixedCharts";
import TimelineCharts from "../pages/Charts/ApexCharts/TimelineCharts";
import CandlestickChart from "../pages/Charts/ApexCharts/CandlestickChart";
import BoxplotCharts from "../pages/Charts/ApexCharts/BoxplotCharts";
import BubbleChart from "../pages/Charts/ApexCharts/BubbleChart";
import ScatterCharts from "../pages/Charts/ApexCharts/ScatterCharts";
import HeatmapCharts from "../pages/Charts/ApexCharts/HeatmapCharts";
import TreemapCharts from "../pages/Charts/ApexCharts/TreemapCharts";
import PieCharts from "../pages/Charts/ApexCharts/PieCharts";
import RadialbarCharts from "../pages/Charts/ApexCharts/RadialbarCharts";
import RadarCharts from "../pages/Charts/ApexCharts/RadarCharts";
import PolarCharts from "../pages/Charts/ApexCharts/PolarCharts";
import ChartsJs from "../pages/Charts/ChartsJs/index";
import Echarts from "../pages/Charts/ECharts/index";

//Job pages
import Statistics from "../pages/Jobs/Statistics";
import JobList from "../pages/Jobs/JobList/List";
import JobGrid from "../pages/Jobs/JobList/Grid";
import JobOverview from "../pages/Jobs/JobList/Overview";
import CandidateList from "../pages/Jobs/CandidateList/ListView";
import CandidateGrid from "../pages/Jobs/CandidateList/GridView";
import NewJobs from "../pages/Jobs/NewJob";
import JobCategories from "../pages/Jobs/JobCategories";
import Application from "../pages/Jobs/Application";
import CompaniesList from "../pages/Jobs/CompaniesList";

// Landing Index
import OnePage from "../pages/Landing/OnePage";
import NFTLanding from "../pages/Landing/NFTLanding";

import PrivecyPolicy from '../pages/Pages/PrivacyPolicy';
import TermsCondition from '../pages/Pages/TermsCondition';
import JobLanding from "../pages/Job_Landing/Job";

// User Profile
import UserProfile from "../pages/Authentication/user-profile";

import FileManager from "../pages/FileManager";
import ToDoList from "../pages/ToDo";
import RangeArea from "../pages/Charts/ApexCharts/RangeAreaCharts/Index";
import FunnelChart from "../pages/Charts/ApexCharts/FunnelCharts/Index";
import UiLink from "../pages/BaseUi/UiLinks/UiLinks";
import DashboardBlog from "../pages/DashboardBlog";
import SlopeCharts from "../pages/Charts/ApexCharts/SlopeCharts";
import BlogListView from "../pages/Pages/Blogs/ListView";
import BlogGridView from "../pages/Pages/Blogs/GridView";
import PageBlogOverview from "../pages/Pages/Blogs/Overview";

// User Management
import ListUser from "../pages/Masters/UserMaster/ListUser";
import AddEditUser from "../pages/Masters/UserMaster/AddEditUser";

// User Role Management
import UserRoleList from "../pages/Masters/UserRole/UserRoleList";
import AddEditUserRole from "../pages/Masters/UserRole/AddEditUserRole";
import ManageUserPermission from "../pages/Masters/UserRole/ManageUserPermission";

// All Master
import AllMasterList from "../pages/Masters/ParameterMaster/AllMasterList";

// Shape Master
import ShapeMasterList from "../pages/Masters/ParameterMaster/4cMaster/ShapeMasterList";

// Color Master
import ColorMasterList from "../pages/Masters/ParameterMaster/4cMaster/ColorMasterList";

// Size Master
import SizeMasterList from "../pages/Masters/ParameterMaster/4cMaster/SizeMasterList";

// Clarity Master
import ClarityMaster from "../pages/Masters/ParameterMaster/4cMaster/ClarityMasterList";

// Sieve Master
import SieveMasterList from "../pages/Masters/ParameterMaster/4cMaster/SieveMasterList";

// Lab Master
import LabMasterList from "../pages/Masters/ParameterMaster/4cMaster/LabMasterList";

// Prop Master
import PropMasterList from "../pages/Masters/ParameterMaster/4cMaster/PropMasterList";

// Polish Master
import PolishMasterList from "../pages/Masters/ParameterMaster/4cMaster/PolishMasterList";

// Sym Master
import SymMasterList from "../pages/Masters/ParameterMaster/4cMaster/SymMasterList";

// Fl Master
import FlMasterList from "../pages/Masters/ParameterMaster/4cMaster/FlMasterList";

// FlColor Master
import FlColorMasterList from "../pages/Masters/ParameterMaster/4cMaster/FlColorMasterList";

// Location Masters
import AreaMasterList from "../pages/Masters/ParameterMaster/LocationMaster/AreaMasterList";
import CityMasterList from "../pages/Masters/ParameterMaster/LocationMaster/CityMasterList";
import StateMasterList from "../pages/Masters/ParameterMaster/LocationMaster/StateMasterList";
import CountryMasterList from "../pages/Masters/ParameterMaster/LocationMaster/CountryMasterList";

// Invoice/Invoice Master
import TermMasterList from "../pages/Masters/ParameterMaster/InvoiceMaster/TermMasterList";
import TypeMasterList from "../pages/Masters/ParameterMaster/InvoiceMaster/TypeMasterList";
import SubTypeMasterList from "../pages/Masters/ParameterMaster/InvoiceMaster/SubTypeMasterList";
import CurrencyMasterList from "../pages/Masters/ParameterMaster/InvoiceMaster/CurrencyMasterList";

// Origin Master
import MinesMasterList from "../pages/Masters/ParameterMaster/OriginMaster/MinesMasterList";
import RoughMasterList from "../pages/Masters/ParameterMaster/OriginMaster/RoughMasterList";

// Jewellery Master
import JewCategoryMasterList from "../pages/Masters/ParameterMaster/JewelleryMaster/JewCategoryMasterList";
import JewSubCategoryMasterList from "../pages/Masters/ParameterMaster/JewelleryMaster/JewSubCategoryMasterList";
import JewMetalMasterList from "../pages/Masters/ParameterMaster/JewelleryMaster/JewMetalMasterList";
import JewMetalPurityMasterList from "../pages/Masters/ParameterMaster/JewelleryMaster/JewMetalPurityMasterList";
import JewColorMasterList from "../pages/Masters/ParameterMaster/JewelleryMaster/JewColorMasterList";

// Welcome Page
import Welcome from "../pages/Welcome/Welcome";

// Brown  Master
import BrownMasterList from "../pages/Masters/ParameterMaster/GradingMaster/BrownMasterList";
import GreenMasterList from "../pages/Masters/ParameterMaster/GradingMaster/GreenMasterList";
import MilkyMasterList from "../pages/Masters/ParameterMaster/GradingMaster/MilkyMasterList";
import LusterMasterList from "../pages/Masters/ParameterMaster/GradingMaster/LusterMasterList";
import NattsMasterList from "../pages/Masters/ParameterMaster/GradingMaster/NattsMasterList";
import HAMasterList from "../pages/Masters/ParameterMaster/GradingMaster/HAMasterList";
import ShadeMasterList from "../pages/Masters/ParameterMaster/GradingMaster/ShadeMasterList";

// Settings Master
import SettingMasterList from "../pages/Masters/SettingMaster/SettingMasterList";
import PrintFormatList from "../pages/Masters/SettingMaster/PrintFormatList";
import ColumnAbbreviationsList from "../pages/Masters/SettingMaster/ColumnAbbreviationsList";
import Sync from "../pages/Masters/SyncMaster/Sync";

// Parcel Item Master
import ParcelItemMasterList from "../pages/StockAccount/ParcelItemMaster/ParcelItemMasterList";
import ParcelItemMasterAdd from "../pages/StockAccount/ParcelItemMaster/ParcelItemMasterAdd";
import ParcelItemMasterEdit from "../pages/StockAccount/ParcelItemMaster/ParcelItemMasterEdit";

// Solitaire Item Master
import SolitaireItemMasterList from "../pages/StockAccount/SolitaireItemMaster/SolitaireItemMasterList";
import SolitaireItemMasterAdd from "../pages/StockAccount/SolitaireItemMaster/SolitaireItemMasterAdd";
import SolitaireItemMasterEdit from "../pages/StockAccount/SolitaireItemMaster/SolitaireItemMasterEdit";


// Account Group Master
import AccGrpMasterList from "../pages/StockAccount/AccGrpMaster/AccGrpMasterList";
import AccGrpMasterAdd from "../pages/StockAccount/AccGrpMaster/AccGrpMasterAdd";
import AccGrpMasterEdit from "../pages/StockAccount/AccGrpMaster/AccGrpMasterEdit";

// Jewellery Stock Master
import JewStockMasterList from "../pages/StockAccount/JewStockMaster/JewStockMasterList";
import JewStockMasterAdd from "../pages/StockAccount/JewStockMaster/JewStockMasterAdd";
import JewStockMasterEdit from "../pages/StockAccount/JewStockMaster/JewStockMasterEdit";

// DiaAnalytics / Stock Analyze (MVC: /data/StockAnalyze)
import StockAnalyze from "../pages/DiaAnalytics/StockAnalyze";

// Solitaire Stock Search Report
import SolitairesStockSearchReport from "../pages/Solitaires/Solitaires Reports/SolitairesStockSearchReport";
import SolitaireAdminStockReport from "../pages/Solitaires/Solitaires Reports/SolitaireAdminStockReport";
import SolitaireStockHistoryReport from "../pages/Solitaires/Solitaires Reports/SolitaireStockHistoryReport";
import SolitaireGradingComparisonReport from "../pages/Solitaires/Solitaires Reports/SolitaireGradingComparisonReport";
import SolitaireRateReviseReport from "../pages/Solitaires/Solitaires Reports/SolitaireRateReviseReport";
import SolitairePurchaseReport from "../pages/Solitaires/Solitaires Reports/SolitairePurchaseReport";
import SolitairePurchaseReturnReport from "../pages/Solitaires/Solitaires Reports/SolitairePurchaseReturnReport";
import SolitaireSaleReturnReport from "../pages/Solitaires/Solitaires Reports/SolitaireSaleReturnReport";
import SolitaireConsignmentReturnReport from "../pages/Solitaires/Solitaires Reports/SolitaireConsignmentReturnReport";
import SolitaireMemoReturnReport from "../pages/Solitaires/Solitaires Reports/SolitaireMemoReturnReport";

import SolitaireConsignmentReport from "../pages/Solitaires/Solitaires Reports/SolitaireConsignmentReport";
import SolitaireMemoOutReport from "../pages/Solitaires/Solitaires Reports/SolitaireMemoOutReport";
import SolitaireSaleReport from "../pages/Solitaires/Solitaires Reports/SolitaireSaleReport";
import SolitaireSalePerformanceReport from "../pages/Solitaires/Solitaires Reports/SolitaireSalePerformanceReport";
import SolitaireConsumptionReport from "../pages/Solitaires/Solitaires Reports/SolitaireConsumptionReport";
import SolitairePartyHoldReport from "../pages/Solitaires/Solitaires Reports/SolitairePartyHoldReport";
import SolitaireAgingReport from "../pages/Solitaires/Solitaires Reports/SolitaireAgingReport";

import OutstandingReport from "../pages/Reports/Payable Receivables/OutstandingReport";
import LoanOutstandingReport from "../pages/Reports/Payable Receivables/LoanOutstandingReport";
import BrokerageOutstandingReport from "../pages/Reports/Payable Receivables/BrokerageOutstandingReport";
import CommissionOutstandingReport from "../pages/Reports/Payable Receivables/CommissionOutstandingReport";
import SalePurchaseSummaryReport from "../pages/Reports/Payable Receivables/SalePurchaseSummaryReport";
import SolitairePurchaseList from "../pages/Solitaires/Solitaires Transaction/SolitairePurchase/SolitairePurchaseList";
import SolitairePurchaseAdd from "../pages/Solitaires/Solitaires Transaction/SolitairePurchase/SolitairePurchaseAdd";
import SolitairePurchaseEdit from "../pages/Solitaires/Solitaires Transaction/SolitairePurchase/SolitairePurchaseEdit";
import SolitairePurchasePrintView from "../pages/Solitaires/Solitaires Transaction/SolitairePurchase/SolitairePurchasePrintView";
import SolitairePurchaseCurStatus from "../pages/Solitaires/Solitaires Transaction/SolitairePurchase/SolitairePurchaseCurStatus";
import SolitairePurchaseReturnList from "../pages/Solitaires/Solitaires Transaction/SolitairePurchaseReturn/SolitairePurchaseReturnList";
import SolitairePurchaseReturnAdd from "../pages/Solitaires/Solitaires Transaction/SolitairePurchaseReturn/SolitairePurchaseReturnAdd";
import SolitairePurchaseReturnEdit from "../pages/Solitaires/Solitaires Transaction/SolitairePurchaseReturn/SolitairePurchaseReturnEdit";
import SolitaireConsignmentInList from "../pages/Solitaires/Solitaires Transaction/SolitaireConsignmentIn/SolitaireConsignmentInList";
import SolitaireConsignmentInAdd from "../pages/Solitaires/Solitaires Transaction/SolitaireConsignmentIn/SolitaireConsignmentInAdd";
import SolitaireConsignmentInEdit from "../pages/Solitaires/Solitaires Transaction/SolitaireConsignmentIn/SolitaireConsignmentInEdit";
import SolitaireConsignmentInPrintView from "../pages/Solitaires/Solitaires Transaction/SolitaireConsignmentIn/SolitaireConsignmentInPrintView";
import MixPurchaseList from "../pages/Parcel/Parcel Transaction/MixPurchase/MixPurchaseList";
import MixPurchaseAdd from "../pages/Parcel/Parcel Transaction/MixPurchase/MixPurchaseAdd";
import MixPurchaseEdit from "../pages/Parcel/Parcel Transaction/MixPurchase/MixPurchaseEdit";
import MixPurchasePrintView from "../pages/Parcel/Parcel Transaction/MixPurchase/MixPurchasePrintView";
import MixPurchaseCurStatus from "../pages/Parcel/Parcel Transaction/MixPurchase/MixPurchaseCurStatus";
import JewPurchaseList from "../pages/Jewellery/Jewellery Transaction/JewelleryPurchase/JewPurchaseList";
import JewPurchaseAdd from "../pages/Jewellery/Jewellery Transaction/JewelleryPurchase/JewPurchaseAdd";
import JewPurchaseEdit from "../pages/Jewellery/Jewellery Transaction/JewelleryPurchase/JewPurchaseEdit";
import JewPurchasePrintView from "../pages/Jewellery/Jewellery Transaction/JewelleryPurchase/JewPurchasePrintView";
import JewPurchaseCurStatus from "../pages/Jewellery/Jewellery Transaction/JewelleryPurchase/JewPurchaseCurStatus";
import SolitaireKapanSummaryReport from "../pages/Solitaires/Solitaires Reports/SolitaireKapanSummaryReport";
import SolitaireLotAssortmentReport from "../pages/Solitaires/Solitaires Reports/SolitaireLotAssortmentReport";
import SolitaireFastMovingReport from "../pages/Solitaires/Solitaires Reports/SolitaireFastMovingReport";


// Parcel Stock Search Report
import ParcelStockSearchReport from "../pages/Parcel/Parcel Reports/ParcelStockSearchReport";


// Parcel Stock Register Report
import ParcelStockRegisterReport from "../pages/Parcel/Parcel Reports/ParcelStockRegisterReport";

// Mix Purchase Report
import MixPurchaseReport from "../pages/Parcel/Parcel Reports/MixPurchaseReport";

// Mix Purchase Return Report
import MixPurRtnReport from "../pages/Parcel/Parcel Reports/MixPurRtn";

// Mix Memo Out Report
import MixMemoOutReport from "../pages/Parcel/Parcel Reports/MixMemoOutReport";

// Mix Memo Return Report
import MixMemoOutRtnReport from "../pages/Parcel/Parcel Reports/MixMemoOutRtnReport";

// Mix Sale Report
import MixSaleReport from "../pages/Parcel/Parcel Reports/MixSaleReport";

// Mix Sale Return Report
import MixSaleRtnReport from "../pages/Parcel/Parcel Reports/MixSaleRtnReport";

// Mix Consignment Report
import MixConsignmentReport from "../pages/Parcel/Parcel Reports/MixConsignmentReport";

// Mix Consignment Return Report (MemoIn Return)
import MixConsignmentInRtnReport from "../pages/Parcel/Parcel Reports/MixConsignmentInRtnReport";

// Jewellery Stock Search Report
import JewelleryStockSearchReport from "../pages/Jewellery/Jewellery Reports/JewelleryStockSearchReport";

// Ledger Report (MVC: /Account/LedgerRpt)
import LedgerReport from "../pages/Reports/Financial Reports/LedgerReport";

// Month Expense Report (MVC: /report/month-expense-report)
import MonthExpenseReport from "../pages/Reports/Financial Reports/MonthExpenseReport";

// Cash Flow Report (MVC: /report/cash-flow-report)
import CashFlowReport from "../pages/Reports/Financial Reports/CashFlowReport";
import ProfitLossReport from "../pages/Reports/Financial Reports/ProfitLossReport";
import TrialBalanceSheetReport from "../pages/Reports/Financial Reports/TrialBalanceSheetReport";
import BalanceSheetReport from "../pages/Reports/Financial Reports/BalanceSheetReport";
import InvoiceLedgerReport from "../pages/Reports/Financial Reports/InvoiceLedgerReport";

// Download MRP (MVC: /data/downloadMRP)
import DownloadMRP from "../pages/Reports/Utility/DownloadMRP";
import ImportGrading from "../pages/Reports/Utility/ImportGrading";

// Jewellery Purchase Report
import JewelleryPurchaseReport from "../pages/Jewellery/Jewellery Reports/JewelleryPurchaseReport";

// Jewellery Stock History Report
import JewelleryStockHistoryReport from "../pages/Jewellery/Jewellery Reports/JewelleryStockHistoryReport";

// Jewellery Purchase Return Report
import JewelleryPurchaseRetunReport from "../pages/Jewellery/Jewellery Reports/JewelleryPurchaseRetunReport";

// Jewellery Sale Report
import JewellerySaleReport from "../pages/Jewellery/Jewellery Reports/JewellerySaleReport";

// Jewellery Sale Return Report
import JewSaleReturnReport from "../pages/Jewellery/Jewellery Reports/JewSaleReturnReport";

// Jewellery MemoOut Report
import JewelleryMemooutReport from "../pages/Jewellery/Jewellery Reports/JewelleryMemooutReport";

// Jewellery MemoIn Return Report
import JewelleryMemoInReturnReport from "../pages/Jewellery/Jewellery Reports/JewelleryMemoInReturnReport";

// Jewellery MemoOut Return Report
import JewelleryMemoOutReturnReporte from "../pages/Jewellery/Jewellery Reports/JewelleryMemoOutReturnReporte";

// Jewellery ConsignMent In Report
import JewelleryConsignMentInReport from "../pages/Jewellery/Jewellery Reports/JewelleryConsignMentInReport";

import ImportPricing from "../pages/Reports/Utility/ImportPricing";
import GetLabData from "../pages/Reports/Utility/GetLabData";
import ConvertExcelUtility from "../pages/Reports/Utility/ConvertExcelUtility";
import StockTelly from "../pages/Reports/Utility/StockTelly";
import MasterPriceComparison from "../pages/Reports/Utility/MasterPriceComparison";
import StockPriceComparison from "../pages/Reports/Utility/StockPriceComparison";
import MissingStock from "../pages/Reports/Utility/MissingStock";
import StockTransfer from "../pages/Reports/Utility/StockTransfer";
import AddStockTransfer from "../pages/Reports/Utility/AddStockTransfer";

const RootRoute = () => {
  try {
    const raw =
      localStorage.getItem("authUser") || sessionStorage.getItem("authUser");
    const authUser = raw ? JSON.parse(raw) : null;
    const token =
      authUser?.token ||
      authUser?.accessToken ||
      authUser?.data?.accessToken ||
      null;

    if (token) {
      return <Navigate to="/welcome" replace />;
    }
  } catch (_) {
    // Fall back to the public landing page if auth state can't be read.
  }

  return <OnePage />;
};

const authProtectedRoutes = [
  { path: "/user-list", component: <ListUser /> },
  { path: "/user-add", component: <AddEditUser /> },
  { path: "/user-edit/:id", component: <AddEditUser /> },

  { path: "/user-role", component: <UserRoleList /> },
  { path: "/add-user-role", component: <AddEditUserRole /> },
  { path: "/edit-user-role/:id", component: <AddEditUserRole /> },
  { path: "/manage-user-permission/:id", component: <ManageUserPermission /> },

  { path: "/all-master-list", component: <AllMasterList /> },
  { path: "/masters/shape-master", component: <ShapeMasterList /> },
  { path: "/masters/color-master", component: <ColorMasterList /> },
  { path: "/masters/size-master", component: <SizeMasterList /> },
  { path: "/masters/clarity-master", component: <ClarityMaster /> },
  { path: "/masters/sieve-master", component: <SieveMasterList /> },
  { path: "/masters/lab-master", component: <LabMasterList /> },
  { path: "/masters/prop-master", component: <PropMasterList /> },
  { path: "/masters/polish-master", component: <PolishMasterList /> },
  { path: "/masters/sym-master", component: <SymMasterList /> },
  { path: "/masters/fl-master", component: <FlMasterList /> },
  { path: "/masters/flcolor-master", component: <FlColorMasterList /> },
  { path: "/masters/area-master", component: <AreaMasterList /> },
  { path: "/masters/city-master", component: <CityMasterList /> },
  { path: "/masters/state-master", component: <StateMasterList /> },
  { path: "/masters/country-master", component: <CountryMasterList /> },
  { path: "/masters/term-master", component: <TermMasterList /> },
  { path: "/masters/type-master", component: <TypeMasterList /> },
  { path: "/masters/subtype-master", component: <SubTypeMasterList /> },
  { path: "/masters/currency-master", component: <CurrencyMasterList /> },
  { path: "/masters/mines-master", component: <MinesMasterList /> },
  { path: "/masters/rough-master", component: <RoughMasterList /> },

  // Jewellery Master
  { path: "/masters/jewcategory-master", component: <JewCategoryMasterList /> },
  { path: "/masters/jewsubcategory-master", component: <JewSubCategoryMasterList /> },
  { path: "/masters/jewmetal-master", component: <JewMetalMasterList /> },
  { path: "/masters/jewmetalpurity-master", component: <JewMetalPurityMasterList /> },
  { path: "/masters/jewcolor-master", component: <JewColorMasterList /> },
  { path: "/welcome", component: <Welcome /> },
  { path: "/masters/brown-master", component: <BrownMasterList /> },
  { path: "/masters/green-master", component: <GreenMasterList /> },
  { path: "/masters/milky-master", component: <MilkyMasterList /> },
  { path: "/masters/luster-master", component: <LusterMasterList /> },
  { path: "/masters/natts-master", component: <NattsMasterList /> },
  { path: "/masters/ha-master", component: <HAMasterList /> },
  { path: "/masters/shade-master", component: <ShadeMasterList /> },
  { path: "/company-settings", component: <SettingMasterList /> },
  { path: "/Master/SettingMaster", component: <SettingMasterList /> },
  { path: "/PrintFormat/PrintFormat", component: <PrintFormatList /> },
  { path: "/ColumnAbbreviations/ColumnAbbreviations", component: <ColumnAbbreviationsList /> },
  { path: "/masters/sync-master", component: <Sync /> },

  { path: "/parcel/list-ParcelItemMaster", component: <ParcelItemMasterList /> },
  { path: "/parcel/add-ParcelItemMaster", component: <ParcelItemMasterAdd /> },
  { path: "/parcel/Edit-ParcelItemMaster", component: <ParcelItemMasterEdit /> },

   // Solitaire Item Master
  { path: "/item/list-item", component: <SolitaireItemMasterList /> },
  { path: "/masters/add-solitaire-item-master", component: <SolitaireItemMasterAdd /> },
  { path: "/masters/edit-solitaire-item-master", component: <SolitaireItemMasterEdit /> },

  

  { path: "/account/list-accountgroup", component: <AccGrpMasterList /> },
  { path: "/account/add-accountgroup", component: <AccGrpMasterAdd /> },
  { path: "/account/Edit-accountgroup", component: <AccGrpMasterEdit /> },

  // Jewellery Stock Master
  { path: "/master/jewelleryM-stock-list", component: <JewStockMasterList /> },
  { path: "/master/jewellery-stock-list", component: <JewStockMasterList /> },
  { path: "/master/list-Mounting-stock", component: <JewStockMasterList /> },
  { path: "/master/add-stock-Mounting", component: <JewStockMasterAdd /> },
  { path: "/master/edit-Mounting-stock", component: <JewStockMasterEdit /> },

  // DiaAnalytics / Stock Analyze (MVC: /data/StockAnalyze)
  { path: "/data/StockAnalyze", component: <StockAnalyze /> },

  // Solitaire Stock Search Report
  { path: "/solitaire/stock-search", component: <SolitairesStockSearchReport /> },
  { path: "/Stock/stock-search", component: <SolitairesStockSearchReport /> },
  { path: "/stock/stock-search", component: <SolitairesStockSearchReport /> },
  // MVC Stock Price Comparison / Chart drill → Stock/stock-search-result1
  { path: "/Stock/stock-search-result1", component: <SolitairesStockSearchReport /> },
  { path: "/stock/stock-search-result1", component: <SolitairesStockSearchReport /> },
  { path: "/StockSearch/StockSearch", component: <SolitairesStockSearchReport /> },
  { path: "/StockSearch", component: <SolitairesStockSearchReport /> },
  { path: "/stocksearch/stocksearch", component: <SolitairesStockSearchReport /> },
  { path: "/stocksearch", component: <SolitairesStockSearchReport /> },
  { path: "/solitaire/stock-search-report", component: <SolitairesStockSearchReport /> },
  { path: "/stock/stock-search-report", component: <SolitairesStockSearchReport /> },
  
  // Solitaire Admin Stock Report
  { path: "/admin/admin-stock", component: <SolitaireAdminStockReport /> },
  { path: "/admin/admin-stock-report", component: <SolitaireAdminStockReport /> },

  // Solitaire Stock History Report (MVC: /report/Stock-register-report)
  { path: "/report/Stock-register-report", component: <SolitaireStockHistoryReport /> },
  { path: "/report/stock-register-report", component: <SolitaireStockHistoryReport /> },
  { path: "/report/grading-comparision-report", component: <SolitaireGradingComparisonReport /> },
  { path: "/report/purchase-report", component: <SolitairePurchaseReport /> },
  { path: "/report/purchase-return-report", component: <SolitairePurchaseReturnReport /> },
  { path: "/report/sale-return-report", component: <SolitaireSaleReturnReport /> },
  { path: "/report/consignment-return-report", component: <SolitaireConsignmentReturnReport /> },
  { path: "/report/MemoOut-return-report", component: <SolitaireMemoReturnReport /> },

  { path: "/report/consignment-report", component: <SolitaireConsignmentReport /> },
  { path: "/report/memo-report", component: <SolitaireMemoOutReport /> },
  { path: "/report/PartyHold-report", component: <SolitairePartyHoldReport /> },
  { path: "/report/partyhold-report", component: <SolitairePartyHoldReport /> },
  // Solitaire Aging Report (MVC: /report/aging-report)
  { path: "/report/aging-report", component: <SolitaireAgingReport /> },
  { path: "/report/Aging-Report", component: <SolitaireAgingReport /> },

  { path: "/report/outstanding-report", component: <OutstandingReport /> },
  { path: "/report/Outstanding-Report", component: <OutstandingReport /> },

  { path: "/report/loan-outstanding-report", component: <LoanOutstandingReport /> },
  { path: "/report/Loan-Outstanding-Report", component: <LoanOutstandingReport /> },

  { path: "/report/bro-outstanding-report", component: <BrokerageOutstandingReport /> },
  { path: "/report/Bro-Outstanding-Report", component: <BrokerageOutstandingReport /> },

  { path: "/report/adat-outstanding-report", component: <CommissionOutstandingReport /> },
  { path: "/report/Adat-Outstanding-Report", component: <CommissionOutstandingReport /> },

  { path: "/report/sale-pur-summary", component: <SalePurchaseSummaryReport /> },
  { path: "/report/Sale-Pur-Summary", component: <SalePurchaseSummaryReport /> },

  // Solitaire Purchase entry (MVC: /purchase/purchase-list)
  { path: "/purchase/purchase-list", component: <SolitairePurchaseList /> },
  { path: "/purchase/add-purchase", component: <SolitairePurchaseAdd /> },
  { path: "/purchase/edit-purchase", component: <SolitairePurchaseEdit /> },
  { path: "/purchase/printinvview", component: <SolitairePurchasePrintView /> },
  { path: "/purchase/PurCurStatusPrintInv", component: <SolitairePurchaseCurStatus /> },
  { path: "/purchase/purcurstatusprintinv", component: <SolitairePurchaseCurStatus /> },

  // Solitaire Purchase Return entry (MVC: /purchasereturn/*)
  { path: "/purchasereturn/purchasereturn-list", component: <SolitairePurchaseReturnList /> },
  { path: "/purchasereturn/add-purchasereturn", component: <SolitairePurchaseReturnAdd /> },
  { path: "/purchasereturn/edit-purchasereturn", component: <SolitairePurchaseReturnEdit /> },

  // Solitaire Consignment In entry (MVC: /consignment/*)
  { path: "/consignment/consignment-list", component: <SolitaireConsignmentInList /> },
  { path: "/consignment/add-consignment", component: <SolitaireConsignmentInAdd /> },
  { path: "/consignment/edit-consignment", component: <SolitaireConsignmentInEdit /> },
  { path: "/consignment/printinvview", component: <SolitaireConsignmentInPrintView /> },

  // Jewellery Purchase entry (MVC: /jewpurchase/*)
  { path: "/jewpurchase/jew-purchase-list", component: <JewPurchaseList /> },
  { path: "/jewpurchase/add-jew-purchase", component: <JewPurchaseAdd /> },
  { path: "/jewpurchase/edit-jew-purchase", component: <JewPurchaseEdit /> },
  { path: "/jewpurchase/Jewprintinv", component: <JewPurchasePrintView /> },
  { path: "/jewpurchase/jewprintinv", component: <JewPurchasePrintView /> },
  { path: "/jewpurchase/JewPurCurStatusPrintInv", component: <JewPurchaseCurStatus /> },
  { path: "/jewpurchase/jewpurcurstatusprintinv", component: <JewPurchaseCurStatus /> },

  { path: "/report/FastMoving-report", component: <SolitaireFastMovingReport /> },
  { path: "/report/kapan-summary-report", component: <SolitaireKapanSummaryReport /> },
  // Solitaire Lot Assortment Report (MVC: /report/lotAssortment-report)
  { path: "/report/lotAssortment-report", component: <SolitaireLotAssortmentReport /> },
  { path: "/report/lotassortment-report", component: <SolitaireLotAssortmentReport /> },
  { path: "/report/sale-report", component: <SolitaireSaleReport /> },
  { path: "/report/sale-Performance-report", component: <SolitaireSalePerformanceReport /> },
  { path: "/report/sale-performance-report", component: <SolitaireSalePerformanceReport /> },
  { path: "/report/rate-revise-report", component: <SolitaireRateReviseReport /> },

  // Solitaire Stock Consumption Report (MVC: report/stock-consumption-report)
  { path: "/report/stock-consumption-report", component: <SolitaireConsumptionReport /> },
  { path: "/report/Stock-Consumption-Report", component: <SolitaireConsumptionReport /> },

  { path: "/dashboard/parcel-stock-analysis", component: <ParcelStockAnalysis /> },
  { path: "/dashboard/parcel-sale-analysis", component: <ParcelSaleAnalysisReport /> },
  { path: "/dashboard/parcel-purchase-analysis", component: <ParcelPurchaseAnalysis /> },
  { path: "/ParcelChartsReport/ParcelPurchaseChartReports", component: <ParcelPurchaseAnalysis /> },


  // Parcel Stock Search Report
  { path: "/ParcelStock/Pstock-search", component: <ParcelStockSearchReport /> },

  // Jewellery Stock Search Report (MVC: /report/jew-stock-report)
  { path: "/report/jew-stock-report", component: <JewelleryStockSearchReport /> },

  // Ledger Report (MVC: /Account/LedgerRpt)
  { path: "/Account/LedgerRpt", component: <LedgerReport /> },

  // Month Expense Report (MVC: /report/month-expense-report)
  { path: "/report/month-expense-report", component: <MonthExpenseReport /> },

  // Cash Flow Report (MVC: /report/cash-flow-report)
  { path: "/report/cash-flow-report", component: <CashFlowReport /> },

  // Profit and Loss Report (MVC: /Account/TradingAccount)
  { path: "/Account/TradingAccount", component: <ProfitLossReport /> },

  // Trial Balance Sheet Report (MVC: /Account/TrialBalSheet)
  { path: "/Account/TrialBalSheet", component: <TrialBalanceSheetReport /> },

  // Balance Sheet Report (MVC: /Account/BalanceSheet)
  { path: "/Account/BalanceSheet", component: <BalanceSheetReport /> },

  // Invoice Ledger Report (MVC: /report/invoice-ledger-report)
  { path: "/report/invoice-ledger-report", component: <InvoiceLedgerReport /> },

  // Download MRP (MVC: /data/downloadMRP)
  { path: "/data/downloadMRP", component: <DownloadMRP /> },
  { path: "/data/importgrading", component: <ImportGrading /> },

// Parcel Stock Register Report
  { path: "/report/parcelstock-register-report", component: <ParcelStockRegisterReport /> },


  // Mix Purchase Report (MVC: /mixreport/MixPurchase-Report)
  { path: "/mixreport/MixPurchase-Report", component: <MixPurchaseReport /> },

  // Mix Purchase entry (MVC: MixPurchase/Mix-PurchaseList)
  { path: "/MixPurchase/Mix-PurchaseList", component: <MixPurchaseList /> },
  { path: "/mix-purchase/Add-MixPurchase", component: <MixPurchaseAdd /> },
  { path: "/mix-purchase/edit-mixpur", component: <MixPurchaseEdit /> },
  { path: "/Mix_Pur/MixPurPrintInv", component: <MixPurchasePrintView /> },
  { path: "/Mix_Pur/MixPurCurStatusPrintInv", component: <MixPurchaseCurStatus /> },

  // Mix Purchase Return Report (MVC: /mixreport/GeneralPur-Return-report)
  { path: "/mixreport/GeneralPur-Return-report", component: <MixPurRtnReport /> },

  // Mix Memo Out Report (MVC: /mixreport/MixMemoout-Report)
  { path: "/mixreport/mixmemo-report", component: <MixMemoOutReport /> },

  // Mix Memo Return Report (MVC: /mixreport/MixMemo-Return-report)
  { path: "/mixreport/MixMemo-Return-report", component: <MixMemoOutRtnReport /> },

  // Mix Sale Report (MVC: /mixreport/GeneralSale-Report)
  { path: "/mixreport/GeneralSale-Report", component: <MixSaleReport /> },

  // Mix Sale Return Report (MVC: /mixreport/GeneralSale-Return-report)
  { path: "/mixreport/GeneralSale-Return-report", component: <MixSaleRtnReport /> },

  // Mix Consignment Report (MVC: /mixreport/MixConsignment-report)
  { path: "/mixreport/MixConsignment-report", component: <MixConsignmentReport /> },

  // Mix Consignment Return Report (MVC: /mixreport/MixConsignment-Return-report)
  { path: "/mixreport/MixConsignment-Return-report", component: <MixConsignmentInRtnReport /> },

  
// Jewellery Purchase Report
  { path: "/jewreport/Purchase-Report", component: <JewelleryPurchaseReport /> },

  // Jewellery Stock History Report
  { path: "/jewreport/Jewstockhistory-report", component: <JewelleryStockHistoryReport /> },

  // Jewellery Purchase Return Report
  { path: "/jewreport/jewPurchasereturn-report", component: <JewelleryPurchaseRetunReport /> },

  // Jewellery Sale Report
  { path: "/jewreport/jewsale-report", component: <JewellerySaleReport /> },

  // Jewellery Sale Return Report
  { path: "/jewreport/jewsalereturn-report", component: <JewSaleReturnReport /> },

  // Jewellery MemoOut Report
  { path: "/jewreport/jewmemo-report", component: <JewelleryMemooutReport /> },

  // Jewellery MemoIn Return Report
  { path: "/jewreport/JewMemoIn-return-report", component: <JewelleryMemoInReturnReport /> },

  // Jewellery MemoOut Return Report
  { path: "/jewreport/JewMemoOut-return-report", component: <JewelleryMemoOutReturnReporte /> },

  // Jewellery ConsignMent In Report
  { path: "/jewreport/jewcons-in-report", component: <JewelleryConsignMentInReport /> },


  { path: "/data/import-pricing", component: <ImportPricing /> },
  { path: "/data/getlabdata", component: <GetLabData /> },
{ path: "/dashbord/uploadexcel", component: <ConvertExcelUtility /> },
  { path: "/dashbord/UploadExcel", component: <ConvertExcelUtility /> },
  { path: "/dashboard/uploadexcel", component: <ConvertExcelUtility /> },
  { path: "/dashboard/UploadExcel", component: <ConvertExcelUtility /> },
  { path: "/data/convertexcelutility", component: <ConvertExcelUtility /> },


  { path: "/data/stocktellydata", component: <StockTelly /> },

  // Master Price Comparison (MVC: /data/MasterPriceComparison)
  { path: "/data/MasterPriceComparison", component: <MasterPriceComparison /> },

  // Stock Price Comparison (MVC: /data/StockPriceComparison)
  { path: "/data/StockPriceComparison", component: <StockPriceComparison /> },

  // Missing Stock (MVC: /data/MissingStock)
  { path: "/data/MissingStock", component: <MissingStock /> },

  // Stock Transfer (MVC: /Stock/Stock-transfer-list, /Stock/Stock-transfer)
  { path: "/Stock/Stock-transfer-list", component: <StockTransfer /> },
  { path: "/stock/Stock-transfer-list", component: <StockTransfer /> },
  { path: "/Stock/Stock-transfer", component: <AddStockTransfer /> },
  { path: "/stock/Stock-transfer", component: <AddStockTransfer /> },
  { path: "/dashboard-analytics", component: <DashboardAnalytics /> },
  { path: "/dashboard-crm", component: <DashboardCrm /> },
  { path: "/dashboard", component: <Dashboard /> },
  { path: "/data/parceldashboard", component: <ParcelDashboard /> },
  { path: "/dashboard/month-analysis", component: <MonthAnalysisReport /> },
  { path: "/dashboard/purchase-analysis", component: <PurchaseAnalysisReport /> },
  { path: "/dashboard/sale-analysis", component: <SaleAnalysisReport /> },
  { path: "/dashboard/stock-analysis", component: <StockAnalysisReport /> },
  { path: "/index", component: <Dashboard /> },
  { path: "/dashboard-crypto", component: <DashboardCrypto /> },
  { path: "/dashboard-projects", component: <DashboardProject /> },
  { path: "/dashboard-nft", component: <DashboardNFT /> },
  { path: "/dashboard-job", component: <DashboardJob /> },
  { path: "/dashboard-blog", component: <DashboardBlog /> },

  { path: "/apps-calendar", component: <Calendar /> },
  { path: "/apps-calendar-month-grid", component: <MonthGrid /> },
  { path: "/apps-ecommerce-products", component: <EcommerceProducts /> },
  { path: "/apps-ecommerce-product-details/:_id", component: <EcommerceProductDetail /> },
  { path: "/apps-ecommerce-product-details", component: <EcommerceProductDetail /> },
  { path: "/apps-ecommerce-add-product", component: <EcommerceAddProduct /> },
  { path: "/apps-ecommerce-orders", component: <EcommerceOrders /> },
  { path: "/apps-ecommerce-order-details", component: <EcommerceOrderDetail /> },
  { path: "/apps-ecommerce-customers", component: <EcommerceCustomers /> },
  { path: "/apps-ecommerce-cart", component: <EcommerceCart /> },
  { path: "/apps-ecommerce-checkout", component: <EcommerceCheckout /> },
  { path: "/apps-ecommerce-sellers", component: <EcommerceSellers /> },
  { path: "/apps-ecommerce-seller-details", component: <EcommerceSellerDetail /> },

  { path: "/apps-file-manager", component: <FileManager /> },
  { path: "/apps-todo", component: <ToDoList /> },


  //Chat
  { path: "/apps-chat", component: <Chat /> },

  //EMail
  { path: "/apps-mailbox", component: <MailInbox /> },
  { path: "/apps-email-basic", component: <BasicAction /> },
  { path: "/apps-email-ecommerce", component: <EcommerceAction /> },

  //Projects
  { path: "/apps-projects-list", component: <ProjectList /> },
  { path: "/apps-projects-overview", component: <ProjectOverview /> },
  { path: "/apps-projects-create", component: <CreateProject /> },

  //Task
  { path: "/apps-tasks-list-view", component: <TaskList /> },
  { path: "/apps-tasks-details", component: <TaskDetails /> },
  { path: "/apps-tasks-kanban", component: <Kanbanboard /> },

  //Api Key
  { path: "/apps-api-key", component: <APIKey /> },

  //Crm
  { path: "/apps-crm-contacts", component: <CrmContacts /> },
  { path: "/apps-crm-companies", component: <CrmCompanies /> },
  { path: "/apps-crm-deals", component: <CrmDeals /> },
  { path: "/apps-crm-leads", component: <CrmLeads /> },

  //Invoices
  { path: "/apps-invoices-list", component: <InvoiceList /> },
  { path: "/apps-invoices-details", component: <InvoiceDetails /> },
  { path: "/apps-invoices-create", component: <InvoiceCreate /> },

  //Supports Tickets
  { path: "/apps-tickets-list", component: <ListView /> },
  { path: "/apps-tickets-details", component: <TicketsDetails /> },

  //transactions
  { path: "/apps-crypto-transactions", component: <Transactions /> },
  { path: "/apps-crypto-buy-sell", component: <BuySell /> },
  { path: "/apps-crypto-orders", component: <CryproOrder /> },
  { path: "/apps-crypto-wallet", component: <MyWallet /> },
  { path: "/apps-crypto-ico", component: <ICOList /> },
  { path: "/apps-crypto-kyc", component: <KYCVerification /> },

  // NFT Marketplace
  { path: "/apps-nft-marketplace", component: <Marketplace /> },
  { path: "/apps-nft-collections", component: <Collections /> },
  { path: "/apps-nft-create", component: <CreateNFT /> },
  { path: "/apps-nft-creators", component: <Creators /> },
  { path: "/apps-nft-explore", component: <ExploreNow /> },
  { path: "/apps-nft-item-details", component: <ItemDetails /> },
  { path: "/apps-nft-auction", component: <LiveAuction /> },
  { path: "/apps-nft-ranking", component: <Ranking /> },
  { path: "/apps-nft-wallet", component: <WalletConnect /> },

  //charts
  { path: "/charts-apex-line", component: <LineCharts /> },
  { path: "/charts-apex-area", component: <AreaCharts /> },
  { path: "/charts-apex-column", component: <ColumnCharts /> },
  { path: "/charts-apex-bar", component: <BarCharts /> },
  { path: "/charts-apex-mixed", component: <MixedCharts /> },
  { path: "/charts-apex-timeline", component: <TimelineCharts /> },
  { path: "/charts-apex-range-area", component: <RangeArea /> },
  { path: "/charts-apex-funnel", component: <FunnelChart /> },
  { path: "/charts-apex-candlestick", component: <CandlestickChart /> },
  { path: "/charts-apex-boxplot", component: <BoxplotCharts /> },
  { path: "/charts-apex-bubble", component: <BubbleChart /> },
  { path: "/charts-apex-scatter", component: <ScatterCharts /> },
  { path: "/charts-apex-heatmap", component: <HeatmapCharts /> },
  { path: "/charts-apex-treemap", component: <TreemapCharts /> },
  { path: "/charts-apex-pie", component: <PieCharts /> },
  { path: "/charts-apex-radialbar", component: <RadialbarCharts /> },
  { path: "/charts-apex-radar", component: <RadarCharts /> },
  { path: "/charts-apex-polar", component: <PolarCharts /> },
  { path: "/charts-apex-slope", component: <SlopeCharts /> },

  { path: "/charts-chartjs", component: <ChartsJs /> },
  { path: "/charts-echarts", component: <Echarts /> },


  // Base Ui
  { path: "/ui-alerts", component: <UiAlerts /> },
  { path: "/ui-badges", component: <UiBadges /> },
  { path: "/ui-buttons", component: <UiButtons /> },
  { path: "/ui-colors", component: <UiColors /> },
  { path: "/ui-cards", component: <UiCards /> },
  { path: "/ui-carousel", component: <UiCarousel /> },
  { path: "/ui-dropdowns", component: <UiDropdowns /> },
  { path: "/ui-grid", component: <UiGrid /> },
  { path: "/ui-images", component: <UiImages /> },
  { path: "/ui-tabs", component: <UiTabs /> },
  { path: "/ui-accordions", component: <UiAccordions /> },
  { path: "/ui-modals", component: <UiModals /> },
  { path: "/ui-offcanvas", component: <UiOffcanvas /> },
  { path: "/ui-placeholders", component: <UiPlaceholders /> },
  { path: "/ui-progress", component: <UiProgress /> },
  { path: "/ui-notifications", component: <UiNotifications /> },
  { path: "/ui-media", component: <UiMediaobject /> },
  { path: "/ui-embed-video", component: <UiEmbedVideo /> },
  { path: "/ui-typography", component: <UiTypography /> },
  { path: "/ui-lists", component: <UiList /> },
  { path: "/ui-links", component: <UiLink /> },
  { path: "/ui-general", component: <UiGeneral /> },
  { path: "/ui-ribbons", component: <UiRibbons /> },
  { path: "/ui-utilities", component: <UiUtilities /> },

  // Advance Ui
  { path: "/advance-ui-nestable", component: <UiNestableList /> },
  { path: "/advance-ui-scrollbar", component: <UiScrollbar /> },
  { path: "/advance-ui-animation", component: <UiAnimation /> },
  { path: "/advance-ui-swiper", component: <UiSwiperSlider /> },
  { path: "/advance-ui-ratings", component: <UiRatings /> },
  { path: "/advance-ui-highlight", component: <UiHighlight /> },

  // Widgets
  { path: "/widgets", component: <Widgets /> },

  // Forms
  { path: "/forms-elements", component: <BasicElements /> },
  { path: "/forms-select", component: <FormSelect /> },
  { path: "/forms-editors", component: <FormEditor /> },
  { path: "/forms-checkboxes-radios", component: <CheckBoxAndRadio /> },
  { path: "/forms-masks", component: <Masks /> },
  { path: "/forms-file-uploads", component: <FileUpload /> },
  { path: "/forms-pickers", component: <FormPickers /> },
  { path: "/forms-range-sliders", component: <FormRangeSlider /> },
  { path: "/forms-layouts", component: <Formlayouts /> },
  { path: "/forms-validation", component: <FormValidation /> },
  { path: "/forms-wizard", component: <FormWizard /> },
  { path: "/forms-advanced", component: <FormAdvanced /> },
  { path: "/forms-select2", component: <Select2 /> },

  //Tables
  { path: "/tables-basic", component: <BasicTables /> },
  { path: "/tables-listjs", component: <ListTables /> },
  { path: "/tables-react", component: <ReactTable /> },

  //Icons
  { path: "/icons-remix", component: <RemixIcons /> },
  { path: "/icons-boxicons", component: <BoxIcons /> },
  { path: "/icons-materialdesign", component: <MaterialDesign /> },
  { path: "/icons-feather", component: <FeatherIcons /> },
  { path: "/icons-lineawesome", component: <LineAwesomeIcons /> },
  { path: "/icons-crypto", component: <CryptoIcons /> },

  //Maps
  { path: "/maps-google", component: <GoogleMaps /> },

  //Pages
  { path: "/pages-starter", component: <Starter /> },
  { path: "/pages-profile", component: <SimplePage /> },
  { path: "/pages-profile-settings", component: <Settings /> },
  { path: "/pages-team", component: <Team /> },
  { path: "/pages-timeline", component: <Timeline /> },
  { path: "/pages-faqs", component: <Faqs /> },
  { path: "/pages-gallery", component: <Gallery /> },
  { path: "/pages-pricing", component: <Pricing /> },
  { path: "/pages-sitemap", component: <SiteMap /> },
  { path: "/pages-search-results", component: <SearchResults /> },
  { path: "/pages-privacy-policy", component: <PrivecyPolicy /> },
  { path: "/pages-terms-condition", component: <TermsCondition /> },
  { path: "/pages-blog-list", component: <BlogListView /> },
  { path: "/pages-blog-grid", component: <BlogGridView /> },
  { path: "/pages-blog-overview", component: <PageBlogOverview /> },

  //Job pages
  { path: "/apps-job-statistics", component: <Statistics /> },
  { path: "/apps-job-lists", component: <JobList /> },
  { path: "/apps-job-grid-lists", component: <JobGrid /> },
  { path: "/apps-job-details", component: <JobOverview /> },
  { path: "/apps-job-candidate-lists", component: <CandidateList /> },
  { path: "/apps-job-candidate-grid", component: <CandidateGrid /> },
  { path: "/apps-job-application", component: <Application /> },
  { path: "/apps-job-new", component: <NewJobs /> },
  { path: "/apps-job-companies-lists", component: <CompaniesList /> },
  { path: "/apps-job-categories", component: <JobCategories /> },


  


  //User Profile
  { path: "/profile", component: <UserProfile /> },

  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  { path: "*", component: <Navigate to="/welcome" /> },
];

const publicRoutes = [
  // Default public entry
  { path: "/", component: <RootRoute /> },
  { path: "/landing", component: <OnePage /> },

  // Authentication Page
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPasswordPage /> },
  { path: "/register", component: <Register /> },

  //AuthenticationInner pages
  { path: "/auth-signin-basic", component: <BasicSignIn /> },
  { path: "/auth-signin-cover", component: <CoverSignIn /> },
  { path: "/auth-signup-basic", component: <BasicSignUp /> },
  { path: "/auth-signup-cover", component: <CoverSignUp /> },
  { path: "/auth-pass-reset-basic", component: <BasicPasswReset /> },
  { path: "/auth-pass-reset-cover", component: <CoverPasswReset /> },
  { path: "/auth-lockscreen-basic", component: <BasicLockScreen /> },
  { path: "/auth-lockscreen-cover", component: <CoverLockScreen /> },
  { path: "/auth-logout-basic", component: <BasicLogout /> },
  { path: "/auth-logout-cover", component: <CoverLogout /> },
  { path: "/auth-success-msg-basic", component: <BasicSuccessMsg /> },
  { path: "/auth-success-msg-cover", component: <CoverSuccessMsg /> },
  { path: "/auth-twostep-basic", component: <BasicTwosVerify /> },
  { path: "/auth-twostep-cover", component: <CoverTwosVerify /> },
  { path: "/auth-404-basic", component: <Basic404 /> },
  { path: "/auth-404-cover", component: <Cover404 /> },
  { path: "/auth-404-alt", component: <Alt404 /> },
  { path: "/auth-500", component: <Error500 /> },
  { path: "/pages-maintenance", component: <Maintenance /> },
  { path: "/pages-coming-soon", component: <ComingSoon /> },

  { path: "/nft-landing", component: <NFTLanding /> },
  { path: "/job-landing", component: <JobLanding /> },

  { path: "/auth-pass-change-basic", component: <BasicPasswCreate /> },
  { path: "/auth-pass-change-cover", component: <CoverPasswCreate /> },
  { path: "/auth-offline", component: <Offlinepage /> },

];

export { authProtectedRoutes, publicRoutes };