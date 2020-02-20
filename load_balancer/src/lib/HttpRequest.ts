import axios, { Method, AxiosRequestConfig } from 'axios';
import { response } from 'express';

const AUTH_TOKEN =
  'ya29.c.KpQBvQdSXZB00IHJlsnqEFBRvvAPCJmooTBTQ-yk1PQsq0fFGVrD6R6LbsoMq7oFj1OFA3WnSrv9uPbC45Q_jwqZIaSsFQv8W-lTI8O0igHutdXhIGuPqfqKQH08HPi9e24_5pHQ1VxazKAeKe6Hz9lViEzafAjd1Re1WZcxUzynu8p2Og4MPIXwEfKGsMiTG59ur3YM9Q';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

/**
 * Generic Http request method
 * @param method Http Method
 * @param url Url path for the request
 * @param queryParams Query parameters
 * @returns A Request Promise
 */
export function request(
  method: Method,
  url: string,
  data?: any,
  params?: Record<string, string>,
): Promise<any> {
  const options: AxiosRequestConfig = {
    method,
    url,
    params,
    data,
    headers,
  };

  return axios(options)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error(error.response);
      throw new Error(error);
    });
}
