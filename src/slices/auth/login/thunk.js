//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  postFakeLogin,
  postJwtLogin,
  postApiLogin,
  postSocialLogin,
} from "../../../helpers/fakebackend_helper";

import { loginSuccess, logoutUserSuccess, apiError, reset_login_flag } from './reducer';

export const loginUser = (user, history, rememberMe) => async (dispatch) => {
  try {
    let response = postApiLogin({
      CompanyId: user.companyid,
      Username: user.username,
      Password: user.password
    });

    var data = await response;

    if (data) {
      data = {
          ...data,
          token: data.token || data.Token,
          user: data.user || data.User
      };
      if (rememberMe) {
        localStorage.setItem("authUser", JSON.stringify(data));
        localStorage.setItem("rememberedUser", JSON.stringify({
          companyid: user.companyid,
          username: user.username
        }));
      } else {
        sessionStorage.setItem("authUser", JSON.stringify(data));
        localStorage.setItem("authUser", JSON.stringify(data));
        localStorage.removeItem("rememberedUser");
      }
      dispatch(loginSuccess(data));
      history('/welcome')
    }
  } catch (error) {
    dispatch(apiError(error));
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    sessionStorage.removeItem("authUser");
    localStorage.removeItem("authUser");
    let fireBaseBackend = getFirebaseBackend();
    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const response = fireBaseBackend.logout;
      dispatch(logoutUserSuccess(response));
    } else {
      dispatch(logoutUserSuccess(true));
    }

  } catch (error) {
    dispatch(apiError(error));
  }
};

export const socialLogin = (type, history) => async (dispatch) => {
  try {
    let response;

    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const fireBaseBackend = getFirebaseBackend();
      response = fireBaseBackend.socialLoginUser(type);
    }
    //  else {
      //   response = postSocialLogin(data);
      // }
      
      const socialdata = await response;
    if (socialdata) {
      sessionStorage.setItem("authUser", JSON.stringify(response));
      localStorage.setItem("authUser", JSON.stringify(response));
      dispatch(loginSuccess(response));
      history('/welcome')
    }

  } catch (error) {
    dispatch(apiError(error));
  }
};

export const resetLoginFlag = () => async (dispatch) => {
  try {
    const response = dispatch(reset_login_flag());
    return response;
  } catch (error) {
    dispatch(apiError(error));
  }
};
