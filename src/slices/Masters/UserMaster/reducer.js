import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
  users: [],
  userDetail: {},
  userDropdown: [],
  error: "",
  loading: false,
};

const UserManagementSlice = createSlice({
  name: "UserManagement",
  initialState,
  reducers: {
    getUsersStart(state) {
      state.loading = true;
      state.error = "";
    },
    getUsersSuccess(state, action) {
      state.loading = false;
      state.users = action.payload;
    },
    getUsersFail(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    
    getUserDropdownStart(state) {
      state.loading = true;
      state.error = "";
    },
    getUserDropdownSuccess(state, action) {
      state.loading = false;
      state.userDropdown = action.payload;
    },
    getUserDropdownFail(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    
    getUserDetailStart(state) {
      state.loading = true;
      state.error = "";
    },
    getUserDetailSuccess(state, action) {
      state.loading = false;
      state.userDetail = action.payload;
    },
    getUserDetailFail(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    addUserStart(state) {
      state.loading = true;
      state.error = "";
    },
    addUserSuccess(state, action) {
      state.loading = false;
      // You can append the new user or just wait for the list to refresh
    },
    addUserFail(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    updateUserStart(state) {
      state.loading = true;
      state.error = "";
    },
    updateUserSuccess(state, action) {
      state.loading = false;
    },
    updateUserFail(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    deleteUserStart(state) {
      state.loading = true;
      state.error = "";
    },
    deleteUserSuccess(state, action) {
      state.loading = false;
      state.users = state.users.filter(
        user => user.userID.toString() !== action.payload.toString()
      );
    },
    deleteUserFail(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  getUsersStart,
  getUsersSuccess,
  getUsersFail,
  getUserDropdownStart,
  getUserDropdownSuccess,
  getUserDropdownFail,
  getUserDetailStart,
  getUserDetailSuccess,
  getUserDetailFail,
  addUserStart,
  addUserSuccess,
  addUserFail,
  updateUserStart,
  updateUserSuccess,
  updateUserFail,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFail,
} = UserManagementSlice.actions;

export default UserManagementSlice.reducer;
