"use client"

import { useState } from "react"
import { Search, Star, Settings, ChevronDown, Copy, Upload, X } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { toast } from 'react-hot-toast'
import { truncateString } from "@/utils/format"
import { useQuery } from "@tanstack/react-query"
import { getInforWallet } from "@/services/api/TelegramWalletService"
import { useAuth } from "@/hooks/useAuth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/dialog"
import { Input } from "@/ui/input"
import { Textarea } from "@/ui/textarea"
import { Label } from "@/ui/label"
import { useLang } from '@/lang/useLang'

interface Pool {
    id: string
    name: string
    symbol: string
    icon: string
    leader: string
    members: number
    amount: string
    isFavorite: boolean
}

interface CreatePoolForm {
    name: string
    description: string
    image: File | null
    amount: number
}

const mockPools: Pool[] = [
    {
        id: "1",
        name: "SOL-USDC",
        symbol: "AXS",
        icon: "/placeholder.svg?height=32&width=32",
        leader: "8EbySEW8WJHUrNfmSNe85TuWmsVaV6T7Q6MzwkYyGgnZ",
        members: 12,
        amount: "2 567 890",
        isFavorite: false,
    },
    {
        id: "2",
        name: "SOL-USDC",
        symbol: "AXS",
        icon: "/placeholder.svg?height=32&width=32",
        leader: "9B8NF...bgpump",
        members: 12,
        amount: "2 567 890",
        isFavorite: false,
    },
    {
        id: "3",
        name: "SOL-DemonCat",
        symbol: "AXS",
        icon: "/placeholder.svg?height=32&width=32",
        leader: "9B8NF...bgpump",
        members: 12,
        amount: "2 567 890",
        isFavorite: false,
    },
    {
        id: "4",
        name: "SOL-FBOOK",
        symbol: "AXS",
        icon: "/placeholder.svg?height=32&width=32",
        leader: "9B8NF...bgpump",
        members: 12,
        amount: "2 567 890",
        isFavorite: false,
    },
    {
        id: "5",
        name: "SOL-PresElect",
        symbol: "AXS",
        icon: "/placeholder.svg?height=32&width=32",
        leader: "9B8NF...bgpump",
        members: 12,
        amount: "2 567 890",
        isFavorite: false,
    },
]

export default function LiquidityPools() {
    const { isAuthenticated } = useAuth();
    const { data: walletInfor, refetch } = useQuery({
        queryKey: ["wallet-infor"],
        queryFn: getInforWallet,
        enabled: isAuthenticated,
    });

    const { t } = useLang();

    const [pools, setPools] = useState<Pool[]>(() => {
        // Load favorite state from localStorage on initial render
        if (typeof window !== 'undefined') {
            const savedFavorites = localStorage.getItem('favorite_pool')
            if (savedFavorites) {
                const favoriteIds = JSON.parse(savedFavorites)
                return mockPools.map(pool => ({
                    ...pool,
                    isFavorite: favoriteIds.includes(pool.id)
                }))
            }
        }
        return mockPools
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [createForm, setCreateForm] = useState<CreatePoolForm>({
        name: "",
        description: "",
        image: null,
        amount: 10000000
    })
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const toggleFavorite = (poolId: string) => {
        const updatedPools = pools.map((pool) =>
            pool.id === poolId ? { ...pool, isFavorite: !pool.isFavorite } : pool
        )
        setPools(updatedPools)

        // Save to localStorage
        const favoriteIds = updatedPools
            .filter(pool => pool.isFavorite)
            .map(pool => pool.id)
        localStorage.setItem('favorite_pool', JSON.stringify(favoriteIds))
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

        setIsSubmitting(true)

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Create new pool
            const newPool: Pool = {
                id: Date.now().toString(),
                name: createForm.name,
                symbol: createForm.name.split('-')[0] || 'POOL',
                icon: imagePreview || "/placeholder.svg?height=32&width=32",
                leader: walletInfor?.solana_address || "Unknown",
                members: 1,
                amount: "0",
                isFavorite: false,
            }

            setPools(prev => [newPool, ...prev])
            toast.success('Pool created successfully!')

            // Reset form and close modal
            setCreateForm({
                name: "",
                description: "",
                image: null,
                amount: 10000000
            })
            setImagePreview(null)
            setIsCreateModalOpen(false)
        } catch (error) {
            toast.error('Failed to create pool. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCloseModal = () => {
        if (!isSubmitting) {
            setCreateForm({
                name: "",
                description: "",
                image: null,
                amount: 10000000
            })
            setImagePreview(null)
            setIsCreateModalOpen(false)
        }
    }

    const filteredPools = pools.filter(
        (pool) =>
            pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pool.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Main Content */}
            <main className="px-6 py-8">
                <div className="container mx-auto">
                    <h1 className="text-4xl font-bold text-theme-primary-500 mb-10">{t('pools.title')}</h1>

                    {/* Search and Actions */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                }}
                                placeholder={t('pools.searchPlaceholder')}
                                className="rounded-full py-2 pl-10 pr-4 w-[11vw] 2xl:w-[19vw] text-sm focus:outline-none bg-gray-100 dark:bg-black text-gray-900 dark:text-neutral-200 focus:ring-1 focus:ring-blue-500 dark:focus:ring-[hsl(var(--ring))] max-h-[30px] border border-gray-500 placeholder:text-gray-500 dark:placeholder:text-neutral-400 placeholder:text-xs"
                            />
                            <Search className="absolute left-3 top-2 h-4 w-4 text-gray-500 dark:text-muted-foreground" />
                        </div>

                        <div className="flex space-x-4">
                            <Button
                                className="bg-theme-primary-500 text-white max-h-[30px] font-medium hover:bg-green-500"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                {t('pools.createPoolBtn')}
                            </Button>
                        </div>
                    </div>

                    {/* Pools Table */}
                    <div className="hidden sm:block overflow-hidden z-20">
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <table className="min-w-[800px] w-full">
                                <thead className="dark:bg-gray-900">
                                    <tr>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-neutral-800 dark:text-gray-300 w-auto">Pool</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-neutral-800 dark:text-gray-300 w-[20%]">Leader</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-neutral-800 dark:text-gray-300 w-[16%]">Members</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-neutral-800 dark:text-gray-300 w-[16%]">Amount</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-neutral-800 dark:text-gray-300 w-[12%]">Contributed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPools.map((pool, index) => (
                                        <tr key={pool.id} className="border-t border-gray-700">
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-neutral-900 dark:text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleFavorite(pool.id)}
                                                        className="text-gray-500 hover:text-yellow-400 transition-colors"
                                                    >
                                                        <Star className={`w-4 h-4 ${pool.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                                                    </button>
                                                    <img src={"logo.png"} alt={pool.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" />
                                                    <div>
                                                        <div className="font-medium">{pool.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-neutral-900 dark:text-gray-300">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-mono text-sm text-yellow-500">{truncateString(pool.leader, 12)}</span>
                                                    <button
                                                        className="text-gray-500 hover:text-white transition-colors"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(pool.leader);
                                                            toast.success('Address copied to clipboard');
                                                        }}
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-neutral-900 dark:text-gray-300">
                                                {pool.members}
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-neutral-900 dark:text-gray-300">
                                                <span className="font-mono">{pool.amount}</span>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-neutral-900 dark:text-gray-300">
                                                <Button size="sm" className="bg-transparent border border-theme-primary-500 text-white hover:bg-green-500 text-xs px-4 py-1">
                                                    {walletInfor?.solana_address == pool.leader ? t('pools.detail') : t('pools.join')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {filteredPools.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>{t('pools.noResult')}</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Pool Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent className="sm:max-w-[500px] bg-[#121619] border border-gray-700 p-5">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-white">
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
                                <div className="relative w-24 h-24 mx-auto bg-theme-neutral-1000 rounded-md flex items-center justify-center">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-16 h-16 object-cover rounded-full border border-gray-500"
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
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 bg-theme-neutral-1000 rounded-md cursor-pointer" onClick={() => document.getElementById('pool-image')?.click()}>
                                    <Upload className="w-8 h-8 mb-4 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-400">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        PNG, JPG, WEBP up to 2MB
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4">
                        {/* Pool Name */}
                        <div className="space-y-2">
                            <Label htmlFor="pool-name" className="text-white">
                                {t('pools.nameLabel')} *
                            </Label>
                            <Input
                                id="pool-name"
                                value={createForm.name}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={t('pools.namePlaceholder')}
                                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pool-amount" className="text-white">
                                {t('pools.amountLabel')} *
                            </Label>
                            <Input
                                id="pool-amount"
                                value={createForm.amount}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                placeholder={t('pools.amountPlaceholder')}
                                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                            />
                        </div>

                        {/* Pool Description */}
                        <div className="space-y-2">
                            <Label htmlFor="pool-description" className="text-white">
                                {t('pools.descLabel')} *
                            </Label>
                            <Textarea
                                id="pool-description"
                                value={createForm.description}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder={t('pools.descPlaceholder')}
                                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 min-h-[100px]"
                            />
                        </div>
                        <div className="text-xs text-red-500 italic leading-4">{t('pools.lockNote')}</div>
                    </div>

                    <div className="flex justify-center w-full items-center mt-4">
                        <Button
                            onClick={handleCreatePool}
                            disabled={isSubmitting}
                            className="bg-theme-primary-500 text-white font-semibold hover:bg-green-500"
                        >
                            {isSubmitting ? t('pools.creating') : t('pools.createBtn')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
