import axiosClient from "@/utils/axiosClient";

// Types theo tài liệu thiết kế
export interface AirdropPool {
  poolId: number;
  name: string;
  slug: string;
  logo: string;
  describe: string;
  memberCount: number;
  totalVolume: number;
  creationDate: string;
  endDate: string;
  creatorAddress: string;
  creatorBittworldUid: string;
  status: 'pending' | 'active' | 'end' | 'error';
  userStakeInfo?: {
    isCreator: boolean;
    joinStatus: 'pending' | 'active' | 'withdraw' | 'error' | 'creator';
    joinDate: string;
    totalStaked: number;
  };
}

export interface PoolMember {
  memberId: number;
  solanaAddress: string;
  nickname: string;
  isCreator: boolean;
  joinDate: string;
  totalStaked: number;
  stakeCount: number;
  status: 'pending' | 'active' | 'withdraw' | 'error';
}

export interface PoolDetail extends AirdropPool {
  transactionHash?: string;
  members?: PoolMember[];
}

export interface CreatePoolRequest {
  name: string;
  logo: File | string;
  describe: string;
  initialAmount: number;
}

export interface StakePoolRequest {
  poolId: number;
  stakeAmount: number;
}

export interface CreatePoolResponse {
  poolId: number;
  name: string;
  slug: string;
  status: string;
  initialAmount: number;
  transactionHash: string;
}

export interface StakePoolResponse {
  joinId: number;
  poolId: number;
  stakeAmount: number;
  status: string;
  transactionHash: string;
}

// API Endpoints theo tài liệu thiết kế

/**
 * Lấy danh sách tất cả các airdrop pools đang hoạt động
 */
export const getAirdropPools = async (sortBy?: string, sortOrder?: string, filterType?: string) => {
  try {
    const params = new URLSearchParams();
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    if (filterType) params.append('filterType', filterType);
    
    const response = await axiosClient.get(`/airdrops/pools?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching airdrop pools:", error);
    return { success: false, data: [] };
  }
};

/**
 * Lấy thông tin chi tiết của một airdrop pool
 */
export const getAirdropPoolDetail = async (poolId: number, sortBy?: string, sortOrder?: string) => {
  try {
    const params = new URLSearchParams();
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    
    const response = await axiosClient.get(`/airdrops/pool/${poolId}?${params.toString()}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching pool detail:", error);
    return { success: false, data: null };
  }
};

/**
 * Tạo một airdrop pool mới
 */
export const createAirdropPool = async (data: CreatePoolRequest) => {
  try {
    let response;
    
    // Nếu logo là File, sử dụng FormData
    if (data.logo instanceof File) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('logo', data.logo);
      formData.append('describe', data.describe);
      formData.append('initialAmount', data.initialAmount.toString());
      
      response = await axiosClient.post('/airdrops/create-pool', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // Nếu logo là string (base64 hoặc URL), gửi JSON
      response = await axiosClient.post('/airdrops/create-pool', data);
    }
    
    return response.data;
  } catch (error) {
    console.error("Error creating airdrop pool:", error);
    throw error;
  }
};

/**
 * Stake token X vào một airdrop pool
 */
export const stakeAirdropPool = async (data: StakePoolRequest) => {
  try {
    const response = await axiosClient.post('/airdrops/stake-pool', data);
    return response.data;
  } catch (error) {
    console.error("Error staking pool:", error);
    throw error;
  }
};

// Legacy API - giữ lại để tương thích
export const getPoolList = async () => {
    try {
        const response = await axiosClient.get(`/pools`);
        return response.data;
    } catch (error) {
        console.error("Error fetching pool list:", error);
        return [];
    }
}