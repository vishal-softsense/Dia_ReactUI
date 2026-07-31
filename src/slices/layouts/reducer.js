import { createSlice } from "@reduxjs/toolkit";
//constants
import {
  layoutTypes,
  leftSidebarTypes,
  layoutModeTypes,
  layoutWidthTypes,
  layoutPositionTypes,
  topbarThemeTypes,
  leftsidbarSizeTypes,
  leftSidebarViewTypes,
  leftSidebarImageTypes,
  preloaderTypes,
  sidebarVisibilitytypes
} from "../../Components/constants/layout";

const getLocalStorageValue = (key, defaultValue) => {
  if (typeof window !== "undefined") {
    const val = localStorage.getItem(key);
    if (val !== null) return val;
  }
  return defaultValue;
};

export const initialState = {
  layoutType: getLocalStorageValue("layoutType", layoutTypes.VERTICAL),
  leftSidebarType: getLocalStorageValue("leftSidebarType", leftSidebarTypes.DARK),
  layoutModeType: getLocalStorageValue("layoutModeType", layoutModeTypes.LIGHTMODE), // layoutModeTypes.DARKMODE,
  layoutWidthType: getLocalStorageValue("layoutWidthType", layoutWidthTypes.FLUID),
  layoutPositionType: getLocalStorageValue("layoutPositionType", layoutPositionTypes.FIXED),
  topbarThemeType: getLocalStorageValue("topbarThemeType", topbarThemeTypes.LIGHT),
  leftsidbarSizeType: getLocalStorageValue("leftsidbarSizeType", leftsidbarSizeTypes.DEFAULT),
  leftSidebarViewType: getLocalStorageValue("leftSidebarViewType", leftSidebarViewTypes.DEFAULT),
  leftSidebarImageType: getLocalStorageValue("leftSidebarImageType", leftSidebarImageTypes.NONE),
  preloader: getLocalStorageValue("preloader", preloaderTypes.DISABLE),
  sidebarVisibilitytype: getLocalStorageValue("sidebarVisibilitytype", sidebarVisibilitytypes.SHOW)
};

const LayoutSlice = createSlice({
  name: 'LayoutSlice',
  initialState,
  reducers: {
    changeLayoutAction(state, action) {
      state.layoutType = action.payload;
      if (typeof window !== "undefined") localStorage.setItem("layoutType", action.payload);
    },
    changeLayoutModeAction(state, action) {
      state.layoutModeType = action.payload;
      if (typeof window !== "undefined") localStorage.setItem("layoutModeType", action.payload);
    },
    changeSidebarThemeAction(state, action) {
      state.leftSidebarType = action.payload;
      if (typeof window !== "undefined") localStorage.setItem("leftSidebarType", action.payload);
    },
    changeLayoutWidthAction(state, action) {
      state.layoutWidthType = action.payload;
      if (typeof window !== "undefined") localStorage.setItem("layoutWidthType", action.payload);
    },
    changeLayoutPositionAction(state, action) {
      state.layoutPositionType = action.payload;
      if (typeof window !== "undefined") localStorage.setItem("layoutPositionType", action.payload);
    },
    changeTopbarThemeAction(state, action) {
      state.topbarThemeType = action.payload;
      if (typeof window !== "undefined") localStorage.setItem("topbarThemeType", action.payload);
    },
    changeLeftsidebarSizeTypeAction(state, action) {
      state.leftsidbarSizeType = action.payload;
      if (typeof window !== "undefined") localStorage.setItem("leftsidbarSizeType", action.payload);
    },
    changeLeftsidebarViewTypeAction(state, action) {
      state.leftSidebarViewType = action.payload;
      if (typeof window !== "undefined") localStorage.setItem("leftSidebarViewType", action.payload);
    },
    changeSidebarImageTypeAction(state, action) {
      state.leftSidebarImageType = action.payload;
      if (typeof window !== "undefined") localStorage.setItem("leftSidebarImageType", action.payload);
    },
    changePreLoaderAction(state, action) {
      state.preloader = action.payload;
      if (typeof window !== "undefined") localStorage.setItem("preloader", action.payload);
    },
    changeSidebarVisibilityAction(state, action) {
      state.sidebarVisibilitytype = action.payload;
      if (typeof window !== "undefined") localStorage.setItem("sidebarVisibilitytype", action.payload);
    },
  }
});

export const {
  changeLayoutAction,
  changeLayoutModeAction,
  changeSidebarThemeAction,
  changeLayoutWidthAction,
  changeLayoutPositionAction,
  changeTopbarThemeAction,
  changeLeftsidebarSizeTypeAction,
  changeLeftsidebarViewTypeAction,
  changeSidebarImageTypeAction,
  changePreLoaderAction,
  changeSidebarVisibilityAction
} = LayoutSlice.actions;

export default LayoutSlice.reducer;