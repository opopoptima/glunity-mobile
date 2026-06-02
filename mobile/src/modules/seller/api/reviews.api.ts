import http from '../../../core/network/http.client';

export interface ReviewUser {
  fullName: string;
  avatarUrl: string | null;
}

export interface Review {
  id: string;
  userId: string;
  user: ReviewUser | null;
  productId?: string;
  recipeId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewDto {
  productId?: string;
  recipeId?: string;
  rating: number;
  comment: string;
}

const reviewsApi = {
  async list(params: { productId?: string; recipeId?: string; limit?: number; skip?: number }): Promise<Review[]> {
    const { data } = await http.get<{ success: boolean; data: Review[] }>('/reviews', { params });
    return data.data;
  },

  async create(dto: CreateReviewDto): Promise<Review> {
    const { data } = await http.post<{ success: boolean; data: Review }>('/reviews', dto);
    return data.data;
  },
};

export default reviewsApi;
