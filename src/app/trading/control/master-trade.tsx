"use client"

import React, { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import ChatTrading from "./chat"
import ChatAll from "./chatAll"
import { getInforWallet } from "@/services/api/TelegramWalletService"
import { useTradingChatStore } from "@/store/tradingChatStore"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useLang } from "@/lang"
import { useRouter } from "next/navigation"

export default function MasterTradeChat() {
    const searchParams = useSearchParams();
    const tokenAddress = searchParams?.get("address");
    const [activeTab, setActiveTab] = useState("chat");
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

    return (
        <div className="h-full flex flex-col w-full px-1 pt-2 2xl:px-3 2xl:pt-2 relative">
            <div className="flex-none flex h-[30px] bg-gray-300 rounded-md relative dark:bg-theme-neutral-800">
                <button
                    className={`px-[12%] rounded-md text-xs cursor-pointer font-medium uppercase text-center ${activeTab === "chatAll" ? "bg-theme-primary-500" : "text-neutral-400"
                        }`}
                    onClick={() => setActiveTab("chatAll")}
                    data-active-tab={activeTab}
                >
                    {t("masterTrade.tabs.chatAll")}
                </button>
                <button
                    className={`flex-1 rounded-md cursor-pointer text-xs font-medium uppercase text-center ${activeTab === "chat" ? "bg-theme-primary-500" : "text-neutral-400"
                        }`}
                    onClick={() => setActiveTab("chat")}
                    data-active-tab={activeTab}
                >
                    {t("masterTrade.tabs.chatWithToken")}
                </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === "chatAll" ? <ChatAll /> : <ChatTrading />}
            </div>
        </div>
    )
}