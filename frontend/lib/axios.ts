"use client"
import axios from "axios";
import { getSession } from "next-auth/react";
import { toast } from "sonner";
import { handleApiError } from "./handleApiError";

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_STRAPI_URL,
});

axiosInstance.interceptors.request.use(async (config) => {
    const session = await getSession();
    if (session?.jwt) {
        config.headers.Authorization = `Bearer ${session.jwt}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const errMessage = handleApiError(error);
        toast.error(errMessage);
        return Promise.reject(error);
    }
);

export default axiosInstance;
