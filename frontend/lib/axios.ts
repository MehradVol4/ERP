"use client"
import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { handleApiError } from "./handleApiError";

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_STRAPI_URL,
});

// Guards against firing multiple sign-outs/toasts when several requests
// 401 at once (e.g. a page that fires parallel calls after the token expires).
let isSigningOut = false;

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
        const status = error?.response?.status;

        // The Strapi JWT has expired or is no longer valid: end the NextAuth
        // session and send the user back to the login page.
        if (status === 401 && typeof window !== "undefined") {
            if (!isSigningOut) {
                isSigningOut = true;
                toast.error("Your session has expired. Please log in again.");
                signOut({ callbackUrl: "/login" });
            }
            return Promise.reject(error);
        }

        const errMessage = handleApiError(error);
        toast.error(errMessage);
        return Promise.reject(error);
    }
);

export default axiosInstance;
