'use client';

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link';
import { ChevronDown, LogOut, Search, Wallet2, Menu, X, LayoutDashboard, Coins, LineChart, Wallet as WalletIcon, Moon, Sun, EyeOff, ShieldCheck, FileCheck, LinkIcon, Shield, Store, Copy, Divide } from 'lucide-react';
import { useLang } from '@/lang/useLang';
import Display from '@/app/components/Display';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getInforWallet, getMyWallets, useWallet } from '@/services/api/TelegramWalletService';
import { formatNumberWithSuffix3, truncateString } from '@/utils/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import ListWallet from './list-wallet';
import type { Wallet } from './list-wallet';
import notify from './notify'
// Removed NotifyProvider import - using Toaster from ClientLayout
import SearchModal from './search-modal';
import MobileWalletSelector from './mobile-wallet-selector';
import { useWallets } from '@/hooks/useWallets';
import { LangToggle } from './LanguageSelect';
import { useTheme } from 'next-themes';
import PumpFun from './pump-fun';
import ModalSignin from './ModalSignin';
import { toast } from 'react-hot-toast';


const Header = () => {
    const { t, lang } = useLang();
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, logout, updateToken } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isSigninModalOpen, setIsSigninModalOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const [isDark, setIsDark] = useState(theme);
    const [phantomConnected, setPhantomConnected] = useState(false);
    const [phantomPublicKey, setPhantomPublicKey] = useState<string | null>(null);

    useEffect(() => {
        setIsDark(theme);
    }, [theme]);

    // Add wallets query
    const { wallets: myWallets } = useWallets();

    const { data: walletInfor, refetch } = useQuery({
        queryKey: ["wallet-infor"],
        queryFn: getInforWallet,
        refetchInterval: 30000,
        staleTime: 30000,
        enabled: isAuthenticated,
    });
    console.log(walletInfor)

    const handleChangeWallet = async (wallet: Wallet) => {
        try {
            const res = await useWallet({ wallet_id: wallet.wallet_id });
            updateToken(res.token);
            await refetch();
            notify({
                message: t('header.notifications.switchWalletSuccess'),
                type: 'success'
            });
            // Reload the page after successful wallet switch
            window.location.reload();
        } catch (error) {
            console.error('Error changing wallet:', error);
            notify({
                message: t('header.notifications.switchWalletFailed'),
                type: 'error'
            });
        }
    };

    useEffect(() => {
        setMounted(true);
        return () => {
            setMounted(false);
        };
    }, []);

    useEffect(() => {
        if (walletInfor?.status === 403) {
            notify({
                message: t('header.notifications.completeProfile'),
                type: 'error'
            });
            router.push("/complete-profile");
        }
        if (walletInfor?.status === 401) {
            logout();
        }
        if (walletInfor && walletInfor.status === 200) {
            if (!isWalletDialogOpen) {
                notify({
                    message: t('header.notifications.loginSuccess'),
                    type: 'success'
                });
            }
        }
    }, [walletInfor, router, logout, isWalletDialogOpen]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // 1024px is the lg breakpoint
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const handleSelectWallet = useCallback(() => {
        if (isMobile) {
            // For mobile, we'll use the dropdown in MobileWalletSelector
            return;
        }
        // For desktop, open the dialog
        setIsWalletDialogOpen(true);
    }, [isMobile]);

    const [tokens, setTokens] = useState<any[]>([]);

    useEffect(() => {
        if (mounted) {
            const storedTokens = localStorage.getItem('recentTokens');
            const parsedTokens = storedTokens ? JSON.parse(storedTokens) : [];
            setTokens(parsedTokens);
            console.log("tokens", parsedTokens);
        }
    }, [mounted]);

    useEffect(() => {
        if (!isSearchModalOpen) {
            setSearchQuery("");
        }
    }, [isSearchModalOpen]);

    const defaultAddress = tokens.length > 0 ? `/trading?address=${tokens[0].address}` : '/trading?address=6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN';

    const listSidebar = [
        {
            name: t('trading'),
            href: defaultAddress,
            icon: LayoutDashboard,
            logoPump: false,
        },
        {
            name: t("wallet manager"),
            href: '/wallet',
            icon: WalletIcon,
            logoPump: false,
            isPhantomConnected: !phantomConnected,
        }
    ]
    return (
        <>
            {/* NotifyProvider removed - using Toaster from ClientLayout */}
            <header className="sticky top-0 w-full bg-white dark:bg-black border-b dark:border-none border-gray-200 dark:border-gray-800" style={{ zIndex: 50 }}>
                <div className='flex items-center justify-between px-4 2xl:px-10 2xl:py-3 py-1 '>
                    <div className='flex gap-4'>
                        <div className='flex items-center gap-[3vw]'>
                            <Link href={defaultAddress} className="flex items-center">
                                <img
                                    src="/bitworld-logo-light.png"
                                    alt="logo"
                                    className="h-6 md:h-8 block dark:hidden"
                                />
                                <img
                                    src="/bitworld-logo.png"
                                    alt="logo"
                                    className="h-6 md:h-8 hidden dark:block"
                                />
                            </Link>
                            {/* Desktop Navigation */}
                            <nav className='hidden md:flex items-center 2xl:gap-[3vw] md:gap-[1vw]'>
                                {listSidebar.map((item, index) => (
                                    <Link
                                        href={item.href}
                                        key={index}
                                        className={`hover:text-theme-primary-500  2xl:text-sm capitalize transition-colors flex text-xs items-center gap-2 ${pathname === item.href ? 'text-theme-primary-500 font-semibold' : ''}`}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Mobile Search */}
                        <div className="md:hidden relative flex items-center">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                }}
                                onFocus={() => {
                                    setIsSearchModalOpen(true);
                                }}
                                placeholder={t('header.search.placeholder')}
                                className="rounded-full py-1 pl-8 pr-3 w-32 text-xs focus:outline-none bg-gray-100 dark:bg-black text-gray-900 dark:text-neutral-200 focus:ring-1 focus:ring-blue-500 dark:focus:ring-[hsl(var(--ring))] border border-gray-200 dark:border-t-theme-primary-300 dark:border-l-theme-primary-300 dark:border-b-theme-secondary-400 dark:border-r-theme-secondary-400 placeholder:text-gray-500 dark:placeholder:text-neutral-400"
                            />
                            <Search className="absolute left-2 top-4.5 h-3 w-3 text-gray-500 dark:text-muted-foreground" />
                        </div>
                    </div>
                    <SearchModal
                        isOpen={isSearchModalOpen}
                        onClose={() => {
                            setIsSearchModalOpen(false);
                        }}
                        searchQuery={searchQuery}
                    />

                    {/* Mobile Wallet Info */}
                    <div className="lg:hidden flex items-center gap-2">
                        {mounted && (
                            <>
                                {!isAuthenticated && !phantomConnected ? (
                                    <button
                                        onClick={() => setIsSigninModalOpen(true)}
                                        className="bg-theme-primary-500 text-black dark:text-neutral-100 font-medium px-3 py-1 rounded-full text-xs transition-colors whitespace-nowrap"
                                    >
                                        {t('connect')}
                                    </button>
                                ) : walletInfor && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="text-sm bg-theme-primary-500 text-theme-neutral-100 dark:text-neutral-100 font-medium px-3 md:px-4 py-[6px] rounded-full transition-colors whitespace-nowrap flex items-center">
                                                <Wallet2 className="h-3 w-3 mr-1" />
                                                <span className='text-xs md:text-sm'>{truncateString(walletInfor?.solana_address, 12) || truncateString(phantomPublicKey, 12)}</span>
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
                                            <div className="p-2">
                                                <MobileWalletSelector
                                                    selectedWalletId={walletInfor?.solana_address}
                                                    onSelectWallet={(wallet) => {
                                                        handleChangeWallet(wallet);
                                                        setIsMobileMenuOpen(false);
                                                    }}
                                                    currentWalletAddress={walletInfor?.solana_address}
                                                />
                                            </div>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/ref`} className="dropdown-item cursor-pointer text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800">
                                                    <span>{t('header.wallet.ref')}</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="dropdown-item cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={logout}>
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>{t('header.wallet.logout')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <div className='hidden lg:flex items-center gap-2 2xl:gap-6'>
                        {isAuthenticated && walletInfor && (
                            <button className=' dark:bg-theme-primary-500 2xl:text-sm text-xs linear-gradient-blue text-theme-neutral-100 dark:text-neutral-100 font-medium px-3 md:px-4 py-[6px] rounded-full transition-colors whitespace-nowrap flex flex-col'>
                                {walletInfor.solana_balance} SOL &ensp; {'$' + formatNumberWithSuffix3(walletInfor.solana_balance_usd)}
                            </button>
                        )}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsSearchModalOpen(e.target.value.length > 0);
                                }}
                                onFocus={() => {
                                    if (searchQuery.length > 0) {
                                        setIsSearchModalOpen(true);
                                    }
                                }}
                                placeholder={t('searchPlaceholder')}
                                className="rounded-full py-2 pl-10 pr-4 w-[11vw] 2xl:w-[13vw] text-sm focus:outline-none bg-gray-100 dark:bg-black text-gray-900 dark:text-neutral-200 focus:ring-1 focus:ring-blue-500 dark:focus:ring-[hsl(var(--ring))] max-h-[30px] border border-gray-200 dark:border-t-theme-primary-300 dark:border-l-theme-primary-300 dark:border-b-theme-secondary-400 dark:border-r-theme-secondary-400 placeholder:text-gray-500 dark:placeholder:text-neutral-400 placeholder:text-xs"
                            />
                            <Search className="absolute left-3 top-2 h-4 w-4 text-gray-500 dark:text-muted-foreground" />
                        </div>

                        <Display />

                        {mounted ? (
                            <>
                                {!isAuthenticated && !phantomConnected ? (
                                    <button
                                        onClick={() => {
                                            setIsSigninModalOpen(true);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="text-sm bg-theme-primary-500 text-theme-neutral-100 dark:text-neutral-100 font-medium px-3 md:px-4 py-[6px] rounded-full transition-colors whitespace-nowrap flex items-center gap-1"
                                    >
                                        {t('connect')}
                                    </button>
                                ) : (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="text-sm bg-theme-primary-500 text-theme-neutral-100 dark:text-neutral-100 font-medium px-3 md:px-4 py-[6px] rounded-full transition-colors whitespace-nowrap flex items-center gap-1 outline-none">
                                                <Wallet2 className="2xl:h-4 2xl:w-4 h-3 w-3 mr-1" />
                                                <span className="2xl:text-sm text-xs hidden md:inline">{truncateString(walletInfor?.solana_address, 12)}</span>
                                                <ChevronDown size={14} className="ml-1" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
                                            <DropdownMenuItem
                                                className="dropdown-item cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-200"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(walletInfor?.solana_address);
                                                    toast.success(t('universal_account.deposit_wallet.copy_success'));
                                                }}
                                            >
                                                <span className="2xl:text-sm text-xs hidden md:inline">{truncateString(walletInfor?.solana_address, 12)}</span>
                                                <Copy className="h-4 w-4" />
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="dropdown-item cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-200"
                                                onClick={handleSelectWallet}
                                            >
                                                <Wallet2 className="mr-2 h-4 w-4" />
                                                <span>{t('header.wallet.selectWallet')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/security`} className="dropdown-item cursor-pointer text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800">
                                                    <Shield className="mr-2 h-4 w-4" />
                                                    <span>{t('header.wallet.security')}</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="dropdown-item cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={logout}>
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>{t('header.wallet.logout')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </>
                        ) : (
                            <button
                                className="hover:bg-white hover:text-theme-primary-500 bg-theme-primary-500 text-white dark:text-neutral-100 font-medium px-4 md:px-6 py-[6px] rounded-full transition-colors whitespace-nowrap"
                            >
                                {t('header.wallet.connecting')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-black">
                        <div className=" h-full bg-gradient-to-r dark:from-theme-primary-500 dark:to-theme-secondary-400 backdrop-blur-md bg-theme-blue-300">
                            <div className='dark:bg-theme-black-1/2 flex flex-col h-full'>
                                <div className="flex items-center justify-between p-4 ">
                                    <Link href={defaultAddress} onClick={() => setIsMobileMenuOpen(false)}>
                                        <img src={"/bitworld-logo-light.png"} alt="logo" className="h-6 md:h-8" />
                                    </Link>

                                    <button
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Mobile Navigation */}
                                <nav className="flex flex-col p-4 space-y-4">
                                    {listSidebar.map((item, index) => {
                                        const Icon = item.icon;
                                        return <Link
                                            href={item.href}
                                            key={index}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`hover:text-theme-primary-500 dark:text-theme-neutral-100 text-theme-neutral-800 md:dark:text-theme-neutral-300 capitalize transition-colors text-lg py-2 flex items-center gap-3 ${pathname === item.href ? 'gradient-hover font-semibold' : ''}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                            {item.name}
                                        </Link>
                                    })}

                                    {/* Additional Mobile Links */}
                                    <div className="pt-4 border-t border-gray-200 dark:border-neutral-800">
                                        <Link
                                            href="/ref"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="hover:text-theme-primary-500 dark:text-theme-neutral-100 text-theme-neutral-800 md:dark:text-theme-neutral-300 capitalize transition-colors text-base py-2 flex items-center gap-3"
                                        >
                                            <LinkIcon className="h-5 w-5" />
                                            {t('header.wallet.ref')}
                                        </Link>
                                    </div>
                                </nav>
                                <LangToggle className='!bg-transparent border-none !pl-5' showArrow={true} />


                                {/* Mobile Actions */}
                                <div className="mt-auto p-4 space-y-4">
                                    <div className='flex items-center justify-evenly gap-4 mt-1'>
                                        <Moon
                                            className="cursor-pointer transition-colors "
                                            onClick={() => isDark === "light" && setTheme("dark")}
                                            style={isDark === "dark" ? { color: "#fff" } : { color: "#6b7280" }}
                                        />
                                        <Sun
                                            className="cursor-pointer transition-colors"
                                            onClick={() => isDark === "dark" && setTheme("light")}
                                            style={isDark === "light" ? { color: "#f59e0b" } : { color: "#6b7280" }}
                                        />
                                    </div>
                                    {isAuthenticated && walletInfor && (
                                        <div className="flex flex-col space-y-2">
                                            <button className='text-sm bg-theme-primary-500 text-theme-neutral-100 dark:text-neutral-100 font-medium px-3 md:px-4 py-[6px] rounded-full transition-colors whitespace-nowrap'>
                                                {walletInfor.solana_balance} SOL &ensp; {'$' + formatNumberWithSuffix3(walletInfor.solana_balance_usd)}
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-end">
                                        {mounted && (
                                            <>
                                                {!isAuthenticated && !phantomConnected ? (
                                                    <button
                                                        onClick={() => {
                                                            setIsSigninModalOpen(true);
                                                            setIsMobileMenuOpen(false);
                                                        }}
                                                        className="linear-gradient-light bg-theme-primary-500 text-black dark:text-neutral-100 font-medium px-6 py-3 rounded-full transition-colors"
                                                    >
                                                        {t('connect')}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            logout();
                                                            setIsMobileMenuOpen(false);
                                                            refetch();
                                                        }}
                                                        className="text-sm bg-theme-primary-500 text-theme-neutral-100 dark:text-neutral-100 font-medium px-3 md:px-4 py-[6px] rounded-full transition-colors whitespace-nowrap"
                                                    >
                                                        {t('header.wallet.logout')}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop Dialog */}
                <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
                    <DialogContent className="sm:max-w-[425px] bg-white p-0 border-none dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
                        <ListWallet
                            isOpen={isWalletDialogOpen}
                            onClose={() => setIsWalletDialogOpen(false)}
                            onSelectWallet={handleChangeWallet}
                            selectedWalletId={walletInfor?.solana_address || null}
                        />
                    </DialogContent>
                </Dialog>
            </header>
            <ModalSignin isOpen={isSigninModalOpen} onClose={() => setIsSigninModalOpen(false)} />
        </>
    )
}

export default Header
