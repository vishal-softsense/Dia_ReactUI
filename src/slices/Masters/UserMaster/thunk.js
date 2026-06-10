import {
  getUserMasters,
  getUserMasterDetail,
  addNewUserMaster,
  updateUserMaster,
  deleteUserMaster,
  getUserDropdown,
} from "../../../helpers/fakebackend_helper";

import {
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
} from "./reducer";

import { toast } from 'react-toastify';

export const getUsers = () => async dispatch => {
  try {
    dispatch(getUsersStart());
    const response = await getUserMasters();
    // In our C# API, it returns { success: true, data: [...] }
    if (response.success) {
      dispatch(getUsersSuccess(response.data));
    } else {
      dispatch(getUsersSuccess(response)); // Fallback if format is different
    }
  } catch (error) {
    dispatch(getUsersFail(error?.response?.data?.message || "Failed to fetch users"));
    toast.error("Failed to fetch users");
  }
};

export const fetchUserDropdown = () => async dispatch => {
  try {
    dispatch(getUserDropdownStart());
    const response = await getUserDropdown();
    if (response.success) {
      dispatch(getUserDropdownSuccess(response.data));
    } else {
      dispatch(getUserDropdownSuccess(response));
    }
  } catch (error) {
    dispatch(getUserDropdownFail(error?.response?.data?.message || "Failed to fetch user dropdown"));
  }
};

export const getUserDetail = (userId) => async dispatch => {
  try {
    dispatch(getUserDetailStart());
    const response = await getUserMasterDetail(userId);
    if (response.success) {
      dispatch(getUserDetailSuccess(response.data));
    } else {
      dispatch(getUserDetailSuccess(response));
    }
  } catch (error) {
    dispatch(getUserDetailFail(error?.response?.data?.message || "Failed to fetch user details"));
    toast.error("Failed to fetch user details");
  }
};

export const addNewUser = (user, history) => async dispatch => {
  try {
    dispatch(addUserStart());
    const response = await addNewUserMaster(user);
    if (response.success || response.status === 200) {
      dispatch(addUserSuccess(response));
      toast.success("User Added Successfully");
      history('/user-list'); // Redirect to list
    } else {
      dispatch(addUserFail(response.message || "Failed to add user"));
      toast.error(response.message || "Failed to add user");
    }
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.response?.data?.Message || "Failed to add user";
    dispatch(addUserFail(errorMsg));
    toast.error(errorMsg);
  }
};

export const updateUser = (user, history) => async dispatch => {
  try {
    dispatch(updateUserStart());
    const response = await updateUserMaster(user);
    if (response.success || response.status === 200) {
      dispatch(updateUserSuccess(response));
      toast.success("User Updated Successfully");
      history('/user-list'); // Redirect to list
    } else {
      dispatch(updateUserFail(response.message || "Failed to update user"));
      toast.error(response.message || "Failed to update user");
    }
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.response?.data?.Message || "Failed to update user";
    dispatch(updateUserFail(errorMsg));
    toast.error(errorMsg);
  }
};

export const deleteUser = (userId) => async dispatch => {
  try {
    dispatch(deleteUserStart());
    const response = await deleteUserMaster(userId);
    if (response.success || response.status === 200) {
      dispatch(deleteUserSuccess(userId));
      toast.success("User Deleted Successfully");
    } else {
      dispatch(deleteUserFail(response.message || "Failed to delete user"));
      toast.error(response.message || "Failed to delete user");
    }
  } catch (error) {
    dispatch(deleteUserFail(error?.response?.data?.message || "Failed to delete user"));
    toast.error("Failed to delete user");
  }
};
