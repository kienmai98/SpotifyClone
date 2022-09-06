import axios from "axios";
import queryString from "query-string";
import { toast } from "react-toastify";
import { API_SERVER, API_SERVER_SSR } from "config/constant";
import ToastMessage from "components/Toast";
import webStorage from "utils/webStorage";

/**
 * Config for client side
 */
const baseApiConfig = {
  baseURL: API_SERVER,
  headers: {
    "content-type": "application/json",
  },
  timeout: 600000,
  paramsSerializer: (params) => queryString.stringify(params),
};
const baseApiClient = axios.create(baseApiConfig);

/**
 * Config for server side
 */
const baseApiConfigSSR = {
  baseURL: API_SERVER_SSR,
  headers: {
    "content-type": "application/json",
  },
  timeout: 600000,
  paramsSerializer: (params) => queryString.stringify(params),
};
const baseApiServer = axios.create(baseApiConfigSSR);

const SESSION_EXPIRED_STATUS_CODE = 401;

const request = ({
  enableFlashMessageError = true,
  enableFlashMessageSuccess = false,
  isAuth = true,
  tokenServerSite = "",
  isSSR = false,
  ...options
}) => {
  if (isAuth) {
    const accessToken = webStorage.getToken();
    /**
     * isSSR <boolean>: used for calling api server side rendering
     */
    (isSSR
      ? baseApiServer
      : baseApiClient
    ).defaults.headers.common.Authorization = `Bearer ${
      tokenServerSite ? tokenServerSite : accessToken
    }`;

    baseApiClient.defaults.headers.common.requestStartedAt =
      new Date().getTime();
  }

  const onSuccess = (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `Execution time for: ${response.config.url} - ${
          new Date().getTime() - response.config.headers.requestStartedAt
        } ms`
      );
    }

    if (enableFlashMessageSuccess && response?.data?.message) {
      const messageList = [];
      messageList.push(response.data.message);
      toast.success(<ToastMessage message={messageList} />);
    }
    return response;
  };

  const onError = (error) => {
    const messageList = [];
    if (error?.response?.status === SESSION_EXPIRED_STATUS_CODE) {
      webStorage.remove();
    }
    if (
      error?.response?.status !== SESSION_EXPIRED_STATUS_CODE &&
      enableFlashMessageError &&
      error?.response?.data?.errors
    ) {
      const errData = error.response.data;
      if (errData.errors) {
        errData?.errors?.map((v) => messageList.push(v.detail));
      } else if (errData?.message) {
        messageList.push(errData.message);
      }
      toast.error(
        <ToastMessage type="error" message={messageList} translation="errors" />
      );
      return Promise.reject();
    }
  };

  return (isSSR ? baseApiServer(options) : baseApiClient(options))
    .then(onSuccess)
    .catch(onError);
};

export default request;
