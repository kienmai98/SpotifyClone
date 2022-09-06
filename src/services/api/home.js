import request from "services/request";

export const getBannerSlideApi = async (params) =>
  request({
    url: `/v1/slide`,
    method: "GET",
    params,
    enableFlashMessageError: false,
  });
