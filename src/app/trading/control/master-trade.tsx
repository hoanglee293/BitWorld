"use client"

import React, { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import ChatTrading from "./chat"
import { getInforWallet } from "@/services/api/TelegramWalletService"
import { useTradingChatStore } from "@/store/tradingChatStore"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useLang } from "@/lang"

export default function MasterTradeChat() {
    const searchParams = useSearchParams();
    const tokenAddress = searchParams?.get("address");
    const { token } = useAuth();
    const { lang } = useLang();
    const { 
        setTokenAddress,
        initializeWebSocket,
        disconnectWebSocket,
    } = useTradingChatStore();

    const [mounted, setMounted] = useState(false);

    // Get translations
    const t = useLang().t;

    // Handle initial mount
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Initialize websocket when token address changes
    useEffect(() => {
        if (!mounted) return;
        
        if (tokenAddress && token) {
            setTokenAddress(tokenAddress);
            initializeWebSocket(token, lang);
        }
        return () => {
            disconnectWebSocket();
        };
    }, [tokenAddress, token, lang, setTokenAddress, initializeWebSocket, disconnectWebSocket, mounted]);

    const { data: walletInfor, isLoading: isLoadingWallet } = useQuery({
        queryKey: ["wallet-infor"],
        queryFn: getInforWallet,
    });
    
    return (
        <div className="h-full flex flex-col w-full px-3 pt-2 relative">
             <button
                    className={`h-8 w-full rounded-2xl cursor-pointer text-sm font-medium uppercase text-center bg-theme-primary-500`}
                    data-active-tab={"chat"}
                >
                    {t("masterTrade.tabs.chat")}
                </button>
            <div className="flex-1 min-h-0 overflow-hidden">
                <ChatTrading />
            </div>
        </div>
    )
}