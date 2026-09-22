"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api/client";

const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export function RealtimeProvider() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = io(SOCKET_URL, { withCredentials: true });

        const refreshDashboard = () => {
            void queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
            void queryClient.invalidateQueries({ queryKey: ["admin-shows"] });
            void queryClient.invalidateQueries({ queryKey: ["admin-movies-list"] });
            void queryClient.invalidateQueries({ queryKey: ["admin-theaters"] });
            void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
        };

        socket.on("admin_data_changed", refreshDashboard);

        return () => {
            socket.off("admin_data_changed", refreshDashboard);
            socket.disconnect();
        };
    }, [queryClient]);

    return null;
}