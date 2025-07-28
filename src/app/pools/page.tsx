"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Star, Settings, ChevronDown, Copy, Upload, X } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { toast } from 'react-hot-toast'
import { truncateString } from "@/utils/format"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getInforWallet } from "@/services/api/TelegramWalletService"
import { useAuth } from "@/hooks/useAuth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/dialog"
import { Input } from "@/ui/input"
import { Textarea } from "@/ui/textarea"
import { Label } from "@/ui/label"
import { useLang } from '@/lang/useLang'
import {
    getAirdropPools,
    createAirdropPool,
    stakeAirdropPool,
    type AirdropPool,
    type CreatePoolRequest,
    type StakePoolRequest
} from "@/services/api/PoolServices"

interface CreatePoolForm {
    name: string
    description: string
    image: File | null
    amount: number
}

type PoolFilterType = 'all' | 'created' | 'joined'

export default function LiquidityPools() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { data: walletInfor, refetch } = useQuery({
        queryKey: ["wallet-infor"],
        queryFn: getInforWallet,
        enabled: isAuthenticated,
    });

    const queryClient = useQueryClient();

    // State cho filter type
    const [activeFilter, setActiveFilter] = useState<PoolFilterType>('all');

    // Query để lấy danh sách airdrop pools với filter
    const { data: poolsResponse, isLoading: isLoadingPools } = useQuery({
        queryKey: ["airdrop-pools", activeFilter],
        queryFn: () => getAirdropPools('creationDate', 'desc', activeFilter === 'all' ? undefined : activeFilter),
        enabled: isAuthenticated,
    });

    const { t } = useLang();

    // State cho favorite pools
    const [favoritePools, setFavoritePools] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('favorite_pool')
            return saved ? JSON.parse(saved) : []
        }
        return []
    })

    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [createForm, setCreateForm] = useState<CreatePoolForm>({
        name: "",
        description: "",
        image: null,
        amount: 1000000 // Minimum amount theo tài liệu
    })
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Mutation để tạo pool
    const createPoolMutation = useMutation({
        mutationFn: async (data: CreatePoolRequest) => {
            return await createAirdropPool(data);
        },
        onSuccess: (data) => {
            toast.success('Pool created successfully!');
            queryClient.invalidateQueries({ queryKey: ["airdrop-pools"] });
            handleCloseModal();
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to create pool. Please try again.';
            toast.error(message);
        }
    });

    // Mutation để stake pool
    const stakePoolMutation = useMutation({
        mutationFn: async (data: StakePoolRequest) => {
            return await stakeAirdropPool(data);
        },
        onSuccess: (data) => {
            toast.success('Stake successful!');
            queryClient.invalidateQueries({ queryKey: ["airdrop-pools"] });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to stake pool. Please try again.';
            toast.error(message);
        }
    });

    const toggleFavorite = (poolId: string) => {
        const newFavorites = favoritePools.includes(poolId)
            ? favoritePools.filter(id => id !== poolId)
            : [...favoritePools, poolId];

        setFavoritePools(newFavorites);
        localStorage.setItem('favorite_pool', JSON.stringify(newFavorites));
    }

    const handleFilterChange = (filter: PoolFilterType) => {
        setActiveFilter(filter);
    }

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file')
                return
            }

            // Validate file size (2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size should be less than 2MB')
                return
            }

            setCreateForm(prev => ({ ...prev, image: file }))

            // Create preview
            const reader = new FileReader()
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCreatePool = async () => {
        if (!createForm.name.trim()) {
            toast.error('Pool name is required')
            return
        }

        if (!createForm.description.trim()) {
            toast.error('Pool description is required')
            return
        }

        if (!createForm.image) {
            toast.error('Pool image is required')
            return
        }

        if (createForm.amount < 1000000) {
            toast.error('Minimum amount is 1,000,000 tokens')
            return
        }

        setIsSubmitting(true)

        try {
            const poolData: CreatePoolRequest = {
                name: createForm.name,
                logo: imagePreview || "",
                describe: createForm.description,
                initialAmount: createForm.amount
            };

            await createPoolMutation.mutateAsync(poolData);
        } catch (error) {
            console.error('Create pool error:', error);
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleStakePool = async (poolId: number, stakeAmount: number) => {
        if (stakeAmount < 1) {
            toast.error('Minimum stake amount is 1 token')
            return
        }

        try {
            const stakeData: StakePoolRequest = {
                poolId,
                stakeAmount
            };

            await stakePoolMutation.mutateAsync(stakeData);
        } catch (error) {
            console.error('Stake pool error:', error);
        }
    }

    const handleCloseModal = () => {
        if (!isSubmitting) {
            setCreateForm({
                name: "",
                description: "",
                image: null,
                amount: 1000000
            })
            setImagePreview(null)
            setIsCreateModalOpen(false)
        }
    }

    // Lấy danh sách pools từ API response
    const pools = poolsResponse?.data || [];

    // Filter pools theo search query
    const filteredPools = pools.filter((pool: AirdropPool) =>
        pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Tính số lượng pools cho mỗi tab (sẽ được cập nhật khi có API riêng cho từng tab)
    const getPoolCount = (filterType: PoolFilterType) => {
        if (filterType === 'all') return pools.length;
        if (filterType === 'created') return pools.filter((pool: AirdropPool) => pool.userStakeInfo?.isCreator).length;
        if (filterType === 'joined') return pools.filter((pool: AirdropPool) => pool.userStakeInfo && !pool.userStakeInfo.isCreator).length;
        return 0;
    };

    // Format số lượng
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat().format(num);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
            {/* Main Content */}
            <main className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
                <div className="container mx-auto max-w-7xl">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-theme-primary-500 mb-6 sm:mb-8 lg:mb-12">{t('pools.title')}</h1>

                    {/* Search and Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6">
                        <div className="flex items-center gap-3">
                            <Button
                                className={`text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2 h-auto sm:max-h-[30px] w-full sm:w-auto transition-colors ${activeFilter === 'all'
                                        ? 'text-theme-primary-500 underline underline-offset-8'
                                        : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                onClick={() => handleFilterChange('all')}
                            >
                                All ({getPoolCount('all')})
                            </Button>
                            <Button
                                className={`text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2 h-auto sm:max-h-[30px] w-full sm:w-auto transition-colors ${activeFilter === 'created'
                                        ? 'text-theme-primary-500 underline underline-offset-8'
                                        : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                onClick={() => handleFilterChange('created')}
                            >
                                Created ({getPoolCount('created')})
                            </Button>
                            <Button
                                className={`text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2 h-auto sm:max-h-[30px] w-full sm:w-auto transition-colors ${activeFilter === 'joined'
                                        ? 'text-theme-primary-500 underline underline-offset-8'
                                        : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                onClick={() => handleFilterChange('joined')}
                            >
                                Joined ({getPoolCount('joined')})
                            </Button>
                            <div className="relative w-full sm:w-auto">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                    }}
                                    placeholder={t('pools.searchPlaceholder')}
                                    className="w-full sm:w-[11vw] 2xl:w-[19vw] rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 border border-gray-300 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400 placeholder:text-xs"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </div>
                        </div>


                        <div className="flex space-x-4 w-full sm:w-auto">
                            <Button
                                className="bg-theme-primary-500 text-white text-xs sm:text-sm font-medium hover:bg-green-500 px-3 sm:px-4 py-2 sm:py-2 h-auto sm:max-h-[30px] w-full sm:w-auto"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                {t('pools.createPoolBtn')}
                            </Button>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoadingPools && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary-500 mx-auto"></div>
                            <p className="mt-2 text-gray-500">Loading pools...</p>
                        </div>
                    )}

                    {/* Mobile Card Layout */}
                    <div className="sm:hidden space-y-3">
                        {filteredPools.map((pool: AirdropPool) => (
                            <div key={pool.poolId} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={pool.logo || "/logo.png"}
                                            alt={pool.name}
                                            className="w-8 h-8 rounded-full"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = "/logo.png";
                                            }}
                                        />
                                        <div>
                                            <div className="font-medium text-sm text-gray-900 dark:text-white">{pool.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{pool.memberCount} members</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleFavorite(pool.poolId.toString())}
                                        className="text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400 transition-colors p-1"
                                    >
                                        <Star className={`w-5 h-5 ${favoritePools.includes(pool.poolId.toString()) ? "fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400" : ""}`} />
                                    </button>
                                </div>

                                <div className="space-y-2 text-xs mb-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Volume:</span>
                                        <span className="font-mono text-gray-900 dark:text-white">{formatNumber(pool.totalVolume)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Created:</span>
                                        <span className="text-gray-900 dark:text-white">{formatDate(pool.creationDate)}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        size="sm"
                                        className="w-full bg-transparent border border-theme-primary-500 text-theme-primary-500 dark:text-white hover:bg-theme-primary-500 hover:text-white text-xs py-2"
                                        onClick={() => {
                                            if (pool.userStakeInfo?.isCreator) {
                                                // Navigate to pool detail
                                                router.push(`/pools/${pool.poolId}`);
                                            } else {
                                                // Show stake modal or navigate to stake page
                                                handleStakePool(pool.poolId, 1000000);
                                            }
                                        }}
                                    >
                                        {pool.userStakeInfo?.isCreator ? t('pools.detail') : t('pools.join')}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tablet Optimized Table */}
                    <div className="hidden sm:block lg:hidden overflow-hidden z-20 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-[5%]">&ensp;</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-[30%]">Pool</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-[20%]">Members</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-[20%]">Volume</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-[10%]">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPools.map((pool: AirdropPool, index: number) => (
                                        <tr key={pool.poolId} className={`border-t border-gray-200 dark:border-gray-700 ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}`}>
                                            <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleFavorite(pool.poolId.toString())}
                                                        className="text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400 transition-colors p-1"
                                                    >
                                                        <Star className={`w-4 h-4 ${favoritePools.includes(pool.poolId.toString()) ? "fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400" : ""}`} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={pool.logo || "/logo.png"}
                                                        alt={pool.name}
                                                        className="w-5 h-5 rounded-full"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "/logo.png";
                                                        }}
                                                    />
                                                    <div className="flex flex-col">
                                                        <div className="font-medium">{pool.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{pool.memberCount} members</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-300">
                                                {pool.memberCount}
                                            </td>
                                            <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-300">
                                                <span className="font-mono">{formatNumber(pool.totalVolume)}</span>
                                            </td>
                                            <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-300">
                                                <Button
                                                    size="sm"
                                                    className="bg-transparent border border-theme-primary-500 text-theme-primary-500 dark:text-white hover:bg-theme-primary-500 hover:text-white text-xs px-2 py-1"
                                                    onClick={() => {
                                                        if (pool.userStakeInfo?.isCreator) {
                                                            router.push(`/pools/${pool.poolId}`);
                                                        } else {
                                                            handleStakePool(pool.poolId, 1000000);
                                                        }
                                                    }}
                                                >
                                                    {pool.userStakeInfo?.isCreator ? t('pools.detail') : t('pools.join')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Desktop Full Table */}
                    <div className="hidden lg:block overflow-hidden z-20 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900">
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <table className="min-w-[800px] w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-[2%]">&ensp;</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-auto">Pool Name</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-auto">UID Leader</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-auto">Leader Address</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-[16%]">Members</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-[16%]">Volume</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-[12%]">Created</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-[12%]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPools.map((pool: AirdropPool, index: number) => (
                                        <tr key={pool.poolId} className={`border-t border-gray-200 dark:border-gray-700 ${index % 2 === 0 ? "bg-white dark:bg-[#171717]" : "bg-gray-50 dark:bg-[#525252]/60"}`}>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-300">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleFavorite(pool.poolId.toString())}
                                                        className="text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400 transition-colors"
                                                    >
                                                        <Star className={`w-4 h-4 ${favoritePools.includes(pool.poolId.toString()) ? "fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400" : ""}`} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-300">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={pool.logo || "/logo.png"}
                                                        alt={pool.name}
                                                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "/logo.png";
                                                        }}
                                                    />
                                                    <div className="flex flex-col ml-1">
                                                        <div className="font-medium">{pool.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-300">
                                                {index % 2 === 0 ? "0x12345" : "7890x23"}
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-yellow-500 italic flex items-center min-h-12 gap-2">
                                                {index % 2 === 0 ? truncateString("5iudi96uW7jotcrxjs7rWq4fphajnfdWvdcG2Yxt9Kzy", 12) : truncateString("i96uW7jotcrxjs7rWq4fphajnfdWvt9Kzy5iuddcG2Yx", 12)}
                                                <Copy className="w-3 h-3" />
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-300">
                                                {pool.memberCount}
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[#53DAE6]">
                                                <span className="font-mono">{formatNumber(pool.totalVolume)}</span>
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm italic text-gray-900 dark:text-gray-300">
                                                {formatDate(pool.creationDate)}
                                            </td>
                                            <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-300">
                                                <Button
                                                    size="sm"
                                                    className="bg-transparent border border-theme-primary-500 text-theme-primary-500 dark:text-white hover:bg-theme-primary-500 hover:text-white text-xs px-4 py-1"
                                                    onClick={() => {
                                                        if (pool.userStakeInfo?.isCreator) {
                                                            router.push(`/pools/${pool.poolId}`);
                                                        } else {
                                                            handleStakePool(pool.poolId, 1000000);
                                                        }
                                                    }}
                                                >
                                                    {pool.userStakeInfo?.isCreator ? t('pools.detail') : t('pools.join')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {filteredPools.length === 0 && !isLoadingPools && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <p className="text-sm sm:text-base">
                                {activeFilter === 'all'
                                    ? t('pools.noResult')
                                    : activeFilter === 'created'
                                        ? 'No pools created yet'
                                        : 'No pools joined yet'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Pool Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent className="w-[95vw] sm:max-w-[500px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 sm:p-5 mx-2">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                            {t('pools.createTitle')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Image Upload Area */}
                        <div className="relative">
                            <input
                                type="file"
                                id="pool-image"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            {imagePreview ? (
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-full border border-gray-300 dark:border-gray-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            setImagePreview(null)
                                            setCreateForm(prev => ({ ...prev, image: null }))
                                        }}
                                        className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                                    >
                                        <X className="w-2 h-2" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-4 sm:pt-5 pb-5 sm:pb-6 bg-gray-100 dark:bg-gray-800 rounded-md cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors" onClick={() => document.getElementById('pool-image')?.click()}>
                                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4 text-gray-400 dark:text-gray-500" />
                                    <p className="mb-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                                        PNG, JPG, WEBP up to 2MB
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4">
                        {/* Pool Name */}
                        <div className="space-y-2">
                            <Label htmlFor="pool-name" className="text-gray-900 dark:text-white text-sm sm:text-base">
                                {t('pools.nameLabel')} *
                            </Label>
                            <Input
                                id="pool-name"
                                value={createForm.name}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={t('pools.namePlaceholder')}
                                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pool-amount" className="text-gray-900 dark:text-white text-sm sm:text-base">
                                {t('pools.amountLabel')} * (Min: 1,000,000)
                            </Label>
                            <Input
                                id="pool-amount"
                                type="number"
                                value={createForm.amount}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                placeholder={t('pools.amountPlaceholder')}
                                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                        </div>

                        {/* Pool Description */}
                        <div className="space-y-2">
                            <Label htmlFor="pool-description" className="text-gray-900 dark:text-white text-sm sm:text-base">
                                {t('pools.descLabel')} *
                            </Label>
                            <Textarea
                                id="pool-description"
                                value={createForm.description}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder={t('pools.descPlaceholder')}
                                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 min-h-[80px] sm:min-h-[100px] text-sm sm:text-base focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                        </div>
                        <div className="text-xs text-red-500 dark:text-red-400 italic leading-4">{t('pools.lockNote')}</div>
                    </div>

                    <div className="flex justify-center w-full items-center mt-4">
                        <Button
                            onClick={handleCreatePool}
                            disabled={isSubmitting || createPoolMutation.isPending}
                            className="bg-theme-primary-500 text-white font-semibold hover:bg-green-500 text-sm sm:text-base px-6 py-2"
                        >
                            {(isSubmitting || createPoolMutation.isPending) ? t('pools.creating') : t('pools.createBtn')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
