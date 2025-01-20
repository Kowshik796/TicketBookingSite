"use client";
import { createContext, useContext, useState, useEffect } from "react";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("theaterAdminSession");
        if (stored) {
            setAdmin(JSON.parse(stored));
        }
        setLoading(false);
    }, []);

    const loginAdmin = (sessionData) => {
        localStorage.setItem("theaterAdminSession", JSON.stringify(sessionData));
        setAdmin(sessionData);
    };

    const logoutAdmin = () => {
        localStorage.removeItem("theaterAdminSession");
        setAdmin(null);
    };

    return (
        <AdminAuthContext.Provider value={{ admin, loading, loginAdmin, logoutAdmin }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    return useContext(AdminAuthContext);
}