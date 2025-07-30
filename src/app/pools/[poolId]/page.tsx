"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Star, Users, TrendingUp, Calendar, Settings, Copy, Share2, MoreVertical, ChevronDown } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { toast } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getInforWallet } from "@/services/api/TelegramWalletService"
import { useAuth } from "@/hooks/useAuth"
import { useLang } from '@/lang/useLang'
import {
    getAirdropPoolDetail,
    getAirdropPoolDetailV1,
    stakeAirdropPool,
    type AirdropPool,
    type StakePoolRequest
} from "@/services/api/PoolServices"
import { truncateString } from "@/utils/format"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/ui/alert-dialog"

interface PoolMember {
    memberId: number
    solanaAddress: string
    nickname: string
    isCreator: boolean
    joinDate: string
    totalStaked: number
    stakeCount: number
    status: 'pending' | 'active' | 'withdraw' | 'error'
}

interface PoolTransaction {
    transactionId: number
    memberId: number
    solanaAddress: string
    bittworldUid: string
    nickname: string
    isCreator: boolean
    stakeAmount: number
    transactionDate: string
    status: string
    transactionHash: string | null
}

export default function PoolDetail() {
    const params = useParams()
    const router = useRouter()
    const poolId = params.poolId as string
    const { isAuthenticated } = useAuth()
    const { t } = useLang()
    const queryClient = useQueryClient()

    // State
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'transactions'>('overview')
    const [stakeAmount, setStakeAmount] = useState(1000000)
    const [isStaking, setIsStaking] = useState(false)
    const [isConfirmingStake, setIsConfirmingStake] = useState(false)

    // Query để lấy thông tin wallet
    const { data: walletInfor } = useQuery({
        queryKey: ["wallet-infor"],
        queryFn: getInforWallet,
        enabled: isAuthenticated,
    })

    // Query để lấy chi tiết pool
    const { data: poolDetail, isLoading: isLoadingPool } = useQuery({
        queryKey: ["pool-detail", poolId],
        queryFn: () => getAirdropPoolDetail(parseInt(poolId)),
        enabled: isAuthenticated && !!poolId,
    })

    const { data: poolDetailV1, isLoading: isLoadingPoolV1 } = useQuery({
        queryKey: ["pool-detail-v1", poolId],
        queryFn: () => getAirdropPoolDetailV1(parseInt(poolId)),
        enabled: isAuthenticated && !!poolId,
    })
    const newFormat = {
        "success": true,
        "message": "Get pool detail transactions successfully",
        "data": {
            "poolId": 3,
            "name": "Poll",
            "slug": "pool-2",
            "logo": "",
            "describe": "WhatTheFont uses deep learning to search our collection of over 133,000 font styles and find the best match for the fonts in your photo. It even works with connected scripts and when there’s more than one font in an image. Just upload an image, click the font you want to identify, then check out the results.",
            "memberCount": 3,
            "totalVolume": 10000000,
            "creationDate": "2025-07-28T16:57:01.648Z",
            "endDate": null,
            "status": "active",
            "transactionHash": "5iudi96uW7jotcrxjs7rWq4fphajnfdWvdcG2Yxt9Kzy",
            "creatorAddress": "5iudi96uW7jotcrxjs7rWq4fphajnfdWvdcG2Yxt9Kzy",
            "creatorBittworldUid": "1232132132",
            "transactions": [
                {
                    "transactionId": 3,
                    "memberId": 3255321,
                    "solanaAddress": "5iudi96uW7jotcrxjs7rWq4fphajnfdWvdcG2Yxt9Kzy",
                    "bittworldUid": "1232132132",
                    "nickname": "HoangPool",
                    "isCreator": false,
                    "stakeAmount": 10000000,
                    "transactionDate": "2025-07-28T16:59:01.953Z",
                    "status": "active",
                    "transactionHash": null
                },
                {
                    "transactionId": 0,
                    "memberId": 3255321,
                    "solanaAddress": "5iudi96uW7jotcrxjs7rWq4fphajnfdWvdcG2Yxt9Kzy",
                    "bittworldUid": "1232132132",
                    "nickname": "HoangPool",
                    "isCreator": true,
                    "stakeAmount": 10000000,
                    "transactionDate": "2025-07-28T16:57:01.648Z",
                    "status": "active",
                    "transactionHash": "5iudi96uW7jotcrxjs7rWq4fphajnfdWvdcG2Yxt9Kzy"
                }
            ],
            "userStakeInfo": {
                "isCreator": true,
                "joinStatus": "active",
                "joinDate": "2025-07-28T16:59:01.953Z",
                "totalStaked": 20000000,
                "stakeCount": 1
            }
        }
    }

    console.log("poolDetailV1", poolDetailV1)

    // Lấy dữ liệu members từ API response
    const members = poolDetail?.members || []

    // Lấy dữ liệu transactions từ poolDetailV1
    const transactions = poolDetailV1?.data?.transactions || []

    // Mutation để stake pool
    const stakePoolMutation = useMutation({
        mutationFn: async (data: StakePoolRequest) => {
            return await stakeAirdropPool(data)
        },
        onSuccess: (data) => {
            toast.success(t('pools.detailPage.stakeSuccessful'))
            queryClient.invalidateQueries({ queryKey: ["pool-detail", poolId] })
            setIsStaking(false)
            setIsConfirmingStake(false)
        },
        onError: (error: any) => {
            let message = t('pools.detailPage.stakeFailed')

            // Check if it's an insufficient balance error
            if (error.response?.data?.message?.includes('Insufficient token')) {
                const errorMessage = error.response.data.message
                // Extract current and required values from error message
                const currentMatch = errorMessage.match(/Current: (\d+)/)
                const requiredMatch = errorMessage.match(/Required: (\d+)/)

                if (currentMatch && requiredMatch) {
                    const current = parseInt(currentMatch[1])
                    const required = parseInt(requiredMatch[1])
                    message = t('pools.detailPage.insufficient_token_balance', {
                        current: current.toLocaleString(),
                        required: required.toLocaleString()
                    })
                }
            }

            toast.error(message)
            setIsStaking(false)
            setIsConfirmingStake(false)
        }
    })

    const handleStake = async () => {
        if (stakeAmount < 1000000) {
            toast.error(t('pools.detailPage.minimumStakeAmount'))
            return
        }

        setIsConfirmingStake(true)
    }

    const copyPoolLink = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success(t('pools.detailPage.poolLinkCopied'))
    }

    const sharePool = () => {
        if (navigator.share) {
            navigator.share({
                title: poolDetail?.name || 'Pool',
                url: window.location.href
            })
        } else {
            copyPoolLink()
        }
    }

    // Format functions
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat().format(num)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString()
    }

    if (isLoadingPool) {
        return (
            <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary-500"></div>
                </div>
            </div>
        )
    }

    if (!poolDetail) {
        return (
            <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="text-center">
                        <h2 className="text-xl sm:text-2xl font-semibold mb-4">{t('pools.detailPage.poolNotFound')}</h2>
                        <Button onClick={() => router.push('/pools')} className="text-base px-6 py-3">
                            {t('pools.detailPage.backToPools')}
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    const isCreator = poolDetail.userStakeInfo?.isCreator || false

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
            {/* Header - Responsive */}
            <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mb-4 sm:mb-5">
                <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/pools')}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <img
                                    src={poolDetail.logo || "/logo.png"}
                                    alt={poolDetail.name}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "/logo.png";
                                    }}
                                />
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-lg sm:text-xl font-bold truncate">{poolDetail.name}</h1>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                        #{poolDetail.poolId} • {poolDetail.slug}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyPoolLink}
                                className="hidden sm:flex items-center gap-2 text-xs sm:text-sm"
                            >
                                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">{t('pools.detailPage.copy')}</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={sharePool}
                                className="hidden sm:flex items-center gap-2 text-xs sm:text-sm"
                            >
                                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">{t('pools.detailPage.share')}</span>
                            </Button>
                            {/* Mobile action buttons */}
                            <div className="flex sm:hidden gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={copyPoolLink}
                                    className="p-2"
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={sharePool}
                                    className="p-2"
                                >
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
                <div className="max-w-7xl mx-auto">
                    {/* Pool Stats Cards - Responsive Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                        <div className="bg-white dark:bg-gray-800 rounded-lg px-3 sm:px-4 py-3 sm:py-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{t('pools.detailPage.totalVolume')}</p>
                                    <p className="text-sm sm:text-base font-semibold truncate">{formatNumber(poolDetail.totalVolume)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg px-3 sm:px-4 py-3 sm:py-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <Users className="w-4 h-4 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{t('pools.detailPage.membersCount')}</p>
                                    <p className="text-sm sm:text-base font-semibold">{poolDetail.memberCount}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg px-3 sm:px-4 py-3 sm:py-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                    <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{t('pools.detailPage.created')}</p>
                                    <p className="text-sm sm:text-base font-semibold truncate">{formatDate(poolDetail.creationDate)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg px-3 sm:px-4 py-3 sm:py-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-purple-800 rounded-lg">
                                    <Star className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-300" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 capitalize truncate">{t('pools.detailPage.status')}</p>
                                    <p className="text-sm sm:text-base font-semibold uppercase truncate">{poolDetail.status}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs - Responsive */}
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
                        {/* Desktop Tabs */}
                        <nav className="hidden sm:flex space-x-6 lg:space-x-8">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm lg:text-base ${activeTab === 'overview'
                                    ? 'border-theme-primary-500 text-theme-primary-500'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {t('pools.detailPage.overview')}
                            </button>
                            {poolDetail?.members && (
                                <button
                                    onClick={() => setActiveTab('members')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm lg:text-base ${activeTab === 'members'
                                        ? 'border-theme-primary-500 text-theme-primary-500'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {t('pools.detailPage.members')} ({members.length})
                                </button>
                            )}
                            {poolDetailV1?.data?.transactions && (
                                <button
                                    onClick={() => setActiveTab('transactions')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm lg:text-base ${activeTab === 'transactions'
                                        ? 'border-theme-primary-500 text-theme-primary-500'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {t('pools.detailPage.transactions')} ({poolDetailV1.data.transactions.filter((tx: PoolTransaction) => tx.transactionId !== 0).length})
                                </button>
                            )}
                        </nav>

                        {/* Mobile Tabs - Pill Style */}
                        <div className="sm:hidden">
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${activeTab === 'overview'
                                        ? 'bg-white dark:bg-gray-800 text-theme-primary-500 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    {t('pools.detailPage.overview')}
                                </button>
                                {
                                    poolDetail?.members && (
                                        <button
                                            onClick={() => setActiveTab('members')}
                                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${activeTab === 'members'
                                                ? 'bg-white dark:bg-gray-800 text-theme-primary-500 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                        >
                                            {t('pools.detailPage.members')} ({members.length})
                                        </button>
                                    )
                                }
                                {poolDetailV1?.data?.transactions && (
                                    <button
                                        onClick={() => setActiveTab('transactions')}
                                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${activeTab === 'transactions'
                                            ? 'bg-white dark:bg-gray-800 text-theme-primary-500 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {t('pools.detailPage.transactions')} ({poolDetailV1.data.transactions.filter((tx: PoolTransaction) => tx.transactionId !== 0).length})
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                                {/* Pool Description */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-base sm:text-lg font-semibold mb-4">{t('pools.detailPage.aboutPool')}</h3>
                                        <p className="leading-relaxed text-theme-primary-500 text-sm sm:text-base mb-4">
                                            {t('pools.detailPage.description')} &ensp; <span className="font-mono italic text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{poolDetail.describe || "This is a community-driven liquidity pool focused on providing sustainable returns to its members through strategic token staking and yield farming opportunities."}</span>
                                        </p>

                                        <div className="flex flex-row justify-between sm:items-center gap-2 sm:gap-0 mb-3">
                                            <span className="text-sm sm:text-base text-gray-500 dark:text-gray-400">{t('pools.detailPage.creatorAddress')}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-yellow-500 italic text-sm sm:text-base">{truncateString(poolDetail.creatorAddress, 12)}</span>
                                                <Copy className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer" onClick={() => {
                                                    navigator.clipboard.writeText(poolDetail.creatorAddress)
                                                    toast.success(t('pools.detailPage.copiedToClipboard'))
                                                }} />
                                            </div>
                                        </div>
                                        <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                                            <div className="flex flex-row justify-between sm:items-center gap-1 sm:gap-0">
                                                <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.poolId')}</span>
                                                <span className="font-mono">{poolDetail.poolId}</span>
                                            </div>
                                            <div className="flex flex-row justify-between sm:items-center gap-1 sm:gap-0">
                                                <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.creationDate')}</span>
                                                <span>{formatDate(poolDetail.creationDate)}</span>
                                            </div>
                                            {poolDetail.endDate && (
                                                <div className="flex flex-row justify-between sm:items-center gap-1 sm:gap-0">
                                                    <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.endDate')}</span>
                                                    <span>{formatDate(poolDetail.endDate)}</span>
                                                </div>
                                            )}
                                            <div className="flex flex-row justify-between sm:items-center gap-1 sm:gap-0">
                                                <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.status')}</span>
                                                <span className={`px-2 sm:px-3 py-1 rounded text-xs uppercase font-semibold ${poolDetail.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    poolDetail.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {poolDetail.status}
                                                </span>
                                            </div>
                                            {poolDetail.transactionHash && (
                                                <div className="flex flex-row justify-between sm:items-center gap-1 sm:gap-0">
                                                    <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.transactionHash')}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-yellow-500 italic text-xs">{truncateString(poolDetail.transactionHash, 16)}</span>
                                                        <Copy className="w-3 h-3 cursor-pointer" onClick={() => {
                                                            navigator.clipboard.writeText(poolDetail.transactionHash)
                                                            toast.success(t('pools.detailPage.copiedToClipboard'))
                                                        }} />
                                                    </div>
                                                </div>
                                            )}
                                            {poolDetail.userStakeInfo && (
                                                <>
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                                                        <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.poolStake')}</span>
                                                        <span className="font-mono text-[#53DAE6]">{formatNumber(poolDetail.userStakeInfo.totalStaked)}</span>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                                                        <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.stakeCount')}</span>
                                                        <span>{poolDetail.userStakeInfo.stakeCount}</span>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                                                        <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.joinDate')}</span>
                                                        <span className="text-gray-500 dark:text-gray-400 italic text-xs sm:text-sm">{formatDate(poolDetail.userStakeInfo.joinDate)}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Stake Section */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-base sm:text-lg font-semibold mb-4">{t('pools.detailPage.stakeInPool')}</h3>

                                        {!isCreator ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        {t('pools.detailPage.amountToStake')}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={stakeAmount}
                                                        onChange={(e) => setStakeAmount(Number(e.target.value))}
                                                        min="1000000"
                                                        className="w-full px-3 outline-none py-3 sm:py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-theme-primary-500 focus:border-transparent"
                                                        placeholder={t('pools.detailPage.enterAmount')}
                                                    />
                                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {t('pools.detailPage.minimumAmount')}
                                                    </p>
                                                </div>

                                                <Button
                                                    onClick={handleStake}
                                                    disabled={isStaking || stakePoolMutation.isPending}
                                                    className="w-full bg-theme-primary-500 hover:bg-green-500 text-white py-3 sm:py-2 text-base"
                                                >
                                                    {isStaking || stakePoolMutation.isPending ? t('pools.detailPage.staking') : t('pools.detailPage.stakeNow')}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
                                                    {t('pools.detailPage.youAreCreator')}
                                                </p>
                                                <div className="space-y-2 mb-4 text-sm sm:text-base">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.yourStaked')}</span>
                                                        <span className="font-mono">{formatNumber(poolDetail.userStakeInfo?.totalStaked || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.stakedCount')}</span>
                                                        <span>{poolDetail.userStakeInfo?.stakeCount || 0}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm sm:text-base text-theme-primary-500 mb-2 uppercase font-semibold">
                                                        {t('pools.detailPage.amountToStake')}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={stakeAmount}
                                                        onChange={(e) => setStakeAmount(Number(e.target.value))}
                                                        min="1000000"
                                                        className="w-full px-3 py-3 sm:py-2 text-base outline-none border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-theme-primary-500 focus:border-transparent"
                                                        placeholder={t('pools.detailPage.enterAmount')}
                                                    />
                                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {t('pools.detailPage.minimumAmount')}
                                                    </p>
                                                </div>

                                                <Button
                                                    onClick={handleStake}
                                                    disabled={isStaking || stakePoolMutation.isPending}
                                                    className="w-full bg-theme-primary-500 hover:bg-green-500 text-white mt-4 py-3 sm:py-2 text-base"
                                                >
                                                    {isStaking || stakePoolMutation.isPending ? t('pools.detailPage.staking') : t('pools.detailPage.stakeNow')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Members Tab */}
                        {activeTab === 'members' && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-base sm:text-lg font-semibold">{t('pools.detailPage.poolMembers')}</h3>
                                </div>

                                {/* Desktop Table */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.member')}
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.stakeAmount')}
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.joinDate')}
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.role')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {members.map((member: PoolMember) => (
                                                <tr key={member.memberId}>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <img
                                                                className="h-8 w-8 rounded-full"
                                                                src="/user-icon.png"
                                                                alt={member.nickname}
                                                            />
                                                            <div className="ml-3 sm:ml-4">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {member.nickname}
                                                                </div>
                                                                <div className="text-xs text-yellow-500 italic flex items-center gap-1">
                                                                    {member.solanaAddress.slice(0, 8)}...{member.solanaAddress.slice(-8)}
                                                                    <Copy className="w-3 h-3" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white font-mono">
                                                            {formatNumber(member.totalStaked)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {formatDate(member.joinDate)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${member.isCreator
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {member.isCreator ? t('pools.detailPage.creator') : t('pools.detailPage.member')}
                                                        </span>
                                                        <div className="mt-1">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' :
                                                                member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                    member.status === 'withdraw' ? 'bg-blue-100 text-blue-800' :
                                                                        'bg-red-100 text-red-800'
                                                                }`}>
                                                                {member.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card Layout */}
                                <div className="sm:hidden">
                                    <div className="p-3 space-y-3">
                                        {members.map((member: PoolMember) => (
                                            <div key={member.memberId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        className="h-10 w-10 rounded-full"
                                                        src="/user-icon.png"
                                                        alt={member.nickname}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {member.nickname}
                                                        </div>
                                                        <div className="text-xs text-yellow-500 italic flex items-center gap-1">
                                                            {member.solanaAddress.slice(0, 8)}...{member.solanaAddress.slice(-8)}
                                                            <Copy className="w-3 h-3" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <span className="text-gray-500 dark:text-gray-400">{t('pools.detailPage.stakeAmount')}</span>
                                                        <div className="font-mono text-gray-900 dark:text-white">
                                                            {formatNumber(member.totalStaked)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 dark:text-gray-400">Join Date:</span>
                                                        <div className="text-gray-900 dark:text-white">
                                                            {formatDate(member.joinDate)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${member.isCreator
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {member.isCreator ? t('pools.detailPage.creator') : t('pools.detailPage.member')}
                                                    </span>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            member.status === 'withdraw' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-red-100 text-red-800'
                                                        }`}>
                                                        {member.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Transactions Tab */}
                        {activeTab === 'transactions' && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                {/* Desktop Table */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.user')}
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.amount')}
                                                </th>

                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {t('pools.detailPage.date')}
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {t('pools.detailPage.transactionHash')}
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.type')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {transactions.filter((tx: PoolTransaction) => tx.transactionId !== 0).map((tx: PoolTransaction) => (
                                                <tr key={tx.transactionId}>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white">
                                                            {tx.nickname}
                                                        </div>
                                                        <div className="text-xs text-yellow-500 italic flex items-center gap-1 cursor-pointer" onClick={() => {
                                                            navigator.clipboard.writeText(tx.solanaAddress)
                                                            toast.success(t('pools.detailPage.copiedToClipboard'))
                                                        }}>
                                                            {truncateString(tx.solanaAddress, 12) ?? '-'}
                                                            <Copy className="w-3 h-3" />
                                                        </div>
                                                    </td>

                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white font-mono">
                                                            {formatNumber(tx.stakeAmount)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {formatDateTime(tx.transactionDate)}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {tx.status}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-yellow-500 italic flex items-center gap-1 cursor-pointer" onClick={() => {
                                                            navigator.clipboard.writeText(tx.transactionHash || '')
                                                            toast.success(t('pools.detailPage.copiedToClipboard'))
                                                        }}>
                                                            {truncateString(tx.transactionHash || '', 12) ?? '-'}
                                                            <Copy className="w-3 h-3" />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                                {t('pools.detailPage.stake')}
                                                            </span>
                                                            {tx.isCreator && (
                                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                                    {t('pools.detailPage.creator')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card Layout */}
                                <div className="sm:hidden">
                                    <div className="p-3 space-y-3">
                                        {transactions.filter((tx: PoolTransaction) => tx.transactionId !== 0).map((tx: PoolTransaction) => (
                                            <div key={tx.transactionId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                            Stake
                                                        </span>
                                                        {tx.isCreator && (
                                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                                Creator
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {formatDateTime(tx.transactionDate)}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                                                        <div className="font-mono text-gray-900 dark:text-white">
                                                            {formatNumber(tx.stakeAmount)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 dark:text-gray-400">User:</span>
                                                        <div className="text-gray-900 dark:text-white truncate">
                                                            {tx.nickname}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-yellow-500 italic">
                                                    {truncateString(tx.solanaAddress, 16)}
                                                </div>

                                                <div className="text-xs text-gray-400">
                                                    Status: {tx.status}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={isConfirmingStake} onOpenChange={setIsConfirmingStake}>
                <AlertDialogContent className="bg-white dark:bg-gray-800 max-w-sm sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg">{t('pools.detailPage.confirmStake')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm sm:text-base">
                            {t('pools.detailPage.confirmStakeMessage').replace('{amount}', formatNumber(stakeAmount)).replace('{poolName}', poolDetail.name)}
                            <div className="text-xs text-red-500 dark:text-red-400 italic leading-4 mt-2">{t('pools.lockNote')}</div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel onClick={() => setIsConfirmingStake(false)} className="w-full sm:w-auto">
                            {t('pools.detailPage.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction className="bg-theme-primary-500 hover:bg-green-500 text-white w-full sm:w-auto" onClick={() => {
                            setIsConfirmingStake(false)
                            setIsStaking(true)
                            const stakeData: StakePoolRequest = {
                                poolId: parseInt(poolId),
                                stakeAmount
                            }
                            stakePoolMutation.mutate(stakeData)
                        }}>
                            {isStaking || stakePoolMutation.isPending ? t('pools.detailPage.staking') : t('pools.detailPage.stakeNow')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
} 