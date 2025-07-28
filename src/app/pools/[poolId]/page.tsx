"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Star, Users, TrendingUp, Calendar, Settings, Copy, Share2, MoreVertical } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { toast } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getInforWallet } from "@/services/api/TelegramWalletService"
import { useAuth } from "@/hooks/useAuth"
import { useLang } from '@/lang/useLang'
import { 
    getAirdropPoolDetail,
    stakeAirdropPool,
    type AirdropPool,
    type StakePoolRequest
} from "@/services/api/PoolServices"
import { truncateString } from "@/utils/format"

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
    id: number
    type: 'stake' | 'unstake' | 'claim'
    amount: number
    timestamp: string
    user: string
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

    console.log(poolDetail)
    // Lấy dữ liệu members từ API response
    const members = poolDetail?.members || []
    
    // Mock data cho transactions (trong thực tế sẽ lấy từ API riêng)
    const [transactions] = useState<PoolTransaction[]>([
        {
            id: 1,
            type: 'stake',
            amount: poolDetail?.userStakeInfo?.totalStaked || 0,
            timestamp: poolDetail?.userStakeInfo?.joinDate || "",
            user: members[0]?.nickname || "Unknown"
        }
    ])

    // Mutation để stake pool
    const stakePoolMutation = useMutation({
        mutationFn: async (data: StakePoolRequest) => {
            return await stakeAirdropPool(data)
        },
        onSuccess: (data) => {
            toast.success('Stake successful!')
            queryClient.invalidateQueries({ queryKey: ["pool-detail", poolId] })
            setIsStaking(false)
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to stake pool. Please try again.'
            toast.error(message)
            setIsStaking(false)
        }
    })

    const handleStake = async () => {
        if (stakeAmount < 1000000) {
            toast.error('Minimum stake amount is 1,000,000 tokens')
            return
        }

        setIsStaking(true)
        try {
            const stakeData: StakePoolRequest = {
                poolId: parseInt(poolId),
                stakeAmount
            }
            await stakePoolMutation.mutateAsync(stakeData)
        } catch (error) {
            console.error('Stake pool error:', error)
        }
    }

    const copyPoolLink = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Pool link copied to clipboard!')
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
                <div className="flex items-center justify-center min-h-screen">
                                            <div className="text-center">
                            <h2 className="text-xl font-semibold mb-2">{t('pools.detailPage.poolNotFound')}</h2>
                            <Button onClick={() => router.push('/pools')}>
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
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mb-5">
                <div className="px-4 sm:px-6 lg:px-8 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/pools')}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                                                                    <div className="flex items-center gap-3">
                                            <img 
                                                src={poolDetail.logo || "/logo.png"} 
                                                alt={poolDetail.name} 
                                                className="w-10 h-10 rounded-full"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = "/logo.png";
                                                }}
                                            />
                                            <div>
                                                <h1 className="text-xl font-bold">{poolDetail.name}</h1>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">#{poolDetail.poolId} • {poolDetail.slug}</p>
                                            </div>
                                        </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyPoolLink}
                                className="flex items-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                {t('pools.detailPage.copy')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={sharePool}
                                className="flex items-center gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                {t('pools.detailPage.share')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    {/* Pool Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('pools.detailPage.totalVolume')}</p>
                                    <p className="text-base font-semibold">{formatNumber(poolDetail.totalVolume)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('pools.detailPage.membersCount')}</p>
                                    <p className="text-base font-semibold">{poolDetail.memberCount}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                    <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('pools.detailPage.created')}</p>
                                    <p className="text-base font-semibold">{formatDate(poolDetail.creationDate)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-800 rounded-lg">
                                    <Star className="w-6 h-6 text-yellow-300"/>
                                </div>
                                <div className="text-base font-semibold uppercase">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{t('pools.detailPage.status')}</p>
                                    {poolDetail.status}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'overview'
                                        ? 'border-theme-primary-500 text-theme-primary-500'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {t('pools.detailPage.overview')}
                            </button>
                            <button
                                onClick={() => setActiveTab('members')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'members'
                                        ? 'border-theme-primary-500 text-theme-primary-500'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {t('pools.detailPage.members')} ({members.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('transactions')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'transactions'
                                        ? 'border-theme-primary-500 text-theme-primary-500'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {t('pools.detailPage.transactions')} ({transactions.length})
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Pool Description */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold mb-4">{t('pools.detailPage.aboutPool')}</h3>
                                        <p className="leading-relaxed text-theme-primary-500 text-base">
                                            Description: &ensp; <span className="font-mono italic text-gray-500 dark:text-gray-400 text-sm">{poolDetail.describe || "This is a community-driven liquidity pool focused on providing sustainable returns to its members through strategic token staking and yield farming opportunities."}</span>
                                        </p>
                                        
                                        <div className="mt-6 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 dark:text-gray-400">Pool ID:</span>
                                                <span className="font-mono">{poolDetail.poolId}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 dark:text-gray-400">Creation Date:</span>
                                                <span>{formatDate(poolDetail.creationDate)}</span>
                                            </div>
                                            {poolDetail.endDate && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500 dark:text-gray-400">End Date:</span>
                                                    <span>{formatDate(poolDetail.endDate)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                                <span className={`px-3 py-1 rounded text-xs uppercase font-semibold ${
                                                    poolDetail.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    poolDetail.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {poolDetail.status}
                                                </span>
                                            </div>
                                            {poolDetail.transactionHash && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500 dark:text-gray-400">Transaction Hash:</span>
                                                    <span className="font-mono text-yellow-500 italic text-xs">{truncateString(poolDetail.transactionHash, 16)}</span>
                                                </div>
                                            )}
                                            {poolDetail.userStakeInfo && (
                                                <>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-500 dark:text-gray-400">Pool Stake:</span>
                                                        <span className="font-mono text-[#53DAE6]">{formatNumber(poolDetail.userStakeInfo.totalStaked)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-500 dark:text-gray-400">Stake Count:</span>
                                                        <span>{poolDetail.userStakeInfo.stakeCount}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-500 dark:text-gray-400">Join Date:</span>
                                                        <span className="text-gray-500 dark:text-gray-400 italic text-sm">{formatDate(poolDetail.userStakeInfo.joinDate)}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Stake Section */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold mb-4">{t('pools.detailPage.stakeInPool')}</h3>
                                        
                                        {!isCreator ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        {t('pools.detailPage.amountToStake')}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={stakeAmount}
                                                        onChange={(e) => setStakeAmount(Number(e.target.value))}
                                                        min="1000000"
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-theme-primary-500 focus:border-transparent"
                                                        placeholder="Enter amount"
                                                    />
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {t('pools.detailPage.minimumAmount')}
                                                    </p>
                                                </div>
                                                
                                                <Button
                                                    onClick={handleStake}
                                                    disabled={isStaking || stakePoolMutation.isPending}
                                                    className="w-full bg-theme-primary-500 hover:bg-green-500 text-white"
                                                >
                                                    {isStaking || stakePoolMutation.isPending ? t('pools.detailPage.staking') : t('pools.detailPage.stakeNow')}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                                    {t('pools.detailPage.youAreCreator')}
                                                </p>
                                                <div className="space-y-2 mb-4 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">Your Staked:</span>
                                                        <span className="font-mono">{formatNumber(poolDetail.userStakeInfo?.totalStaked || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">Staked Count:</span>
                                                        <span>{poolDetail.userStakeInfo?.stakeCount || 0}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="default"
                                                    className="w-full bg-theme-primary-500 hover:bg-green-500 text-white"
                                                >
                                                   Stake
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
                                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold">{t('pools.detailPage.poolMembers')}</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.member')}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.stakeAmount')}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.joinDate')}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.role')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {members.map((member: PoolMember) => (
                                                <tr key={member.memberId}>
                                                                                                <td className="px-6 py-2 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img
                                                        className="h-8 w-8 rounded-full"
                                                        src="/user-icon.png"
                                                        alt={member.nickname}
                                                    />
                                                    <div className="ml-4">
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
                                            <td className="px-6 py-2 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white font-mono">
                                                    {formatNumber(member.totalStaked)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-2 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(member.joinDate)}
                                                </div>
                                            </td>
                                                    <td className="px-6 py-2 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            member.isCreator
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {member.isCreator ? t('pools.detailPage.creator') : t('pools.detailPage.member')}
                                                        </span>
                                                        <div className="mt-1">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                member.status === 'active' ? 'bg-green-100 text-green-800' :
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
                            </div>
                        )}

                        {/* Transactions Tab */}
                        {activeTab === 'transactions' && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="py-3 px-6 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold">{t('pools.detailPage.transactionHistory')}</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.type')}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.amount')}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.user')}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                                    {t('pools.detailPage.date')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {transactions.map((tx) => (
                                                <tr key={tx.id}>
                                                    <td className="px-6 py-2 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            tx.type === 'stake' ? 'bg-green-100 text-green-800' :
                                                            tx.type === 'unstake' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-2 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white font-mono">
                                                            {formatNumber(tx.amount)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-2 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white">
                                                            {tx.user}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-2 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {formatDateTime(tx.timestamp)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
} 