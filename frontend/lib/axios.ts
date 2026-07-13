import axios from "axios";
import { getSession } from "next-auth/react";
import { toast } from "sonner";
import { handleApiError } from "./handleApiError";

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_STRAPI_URL,
});

axiosInstance.interceptors.request.use(async (config) => {
    const session = await getSession();
    if (session?.user.jwt) {
        config.headers.Authorization = `Bearer ${session.user.jwt}`;
    }
    return config ;
});