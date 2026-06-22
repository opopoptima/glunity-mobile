import { useState, useEffect, useCallback } from 'react';
import { ReelsService, Reel } from '../services/reels.service';

export function useReelsFeed(initialCategory = 'all') {
	const [reels, setReels] = useState<Reel[]>([]);
	const [category, setCategory] = useState<string>(initialCategory);
	const [loading, setLoading] = useState<boolean>(false);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState<number>(0);
	const [hasMore, setHasMore] = useState<boolean>(true);

	const loadFeed = useCallback(async (pageNum: number, isRefresh = false, cat = category) => {
		if (loading && !isRefresh) return;
		
		if (isRefresh) {
			setRefreshing(true);
		} else {
			setLoading(true);
		}
		setError(null);

		try {
			const response = await ReelsService.getFeed(pageNum, 10, cat);
			if (response.success) {
				const newReels = response.data;
				if (isRefresh) {
					setReels(newReels);
					setHasMore(newReels.length > 0);
					setPage(0);
				} else {
					setReels(prev => {
						const existingIds = new Set(prev.map(r => r.id));
						const filteredNew = newReels.filter(r => !existingIds.has(r.id));
						return [...prev, ...filteredNew];
					});
					setHasMore(newReels.length > 0);
					setPage(pageNum);
				}
			} else {
				setError('Failed to fetch reels feed');
			}
		} catch (err: any) {
			setError(err.message || 'An error occurred while loading feed');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [loading, category]);

	const refresh = useCallback(() => {
		setHasMore(true);
		loadFeed(0, true);
	}, [loadFeed]);

	const loadMore = useCallback(() => {
		if (!loading && hasMore) {
			loadFeed(page + 1);
		}
	}, [loading, hasMore, page, loadFeed]);

	const changeCategory = useCallback((newCat: string) => {
		setCategory(newCat);
		setHasMore(true);
		loadFeed(0, true, newCat);
	}, [loadFeed]);

	const toggleLike = useCallback(async (reelId: string) => {
		// Store snapshot of original reel in case of rollback
		let originalReel: Reel | undefined;
		
		setReels(prev => prev.map(r => {
			if (r.id === reelId) {
				originalReel = { ...r };
				const isLiked = !r.isLiked;
				const likesCount = isLiked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1);
				return { ...r, isLiked, likesCount };
			}
			return r;
		}));

		try {
			const res = await ReelsService.toggleLike(reelId);
			if (!res.success) {
				// Rollback
				if (originalReel) {
					setReels(prev => prev.map(r => r.id === reelId ? originalReel! : r));
				}
			} else {
				// Match exact server state
				setReels(prev => prev.map(r => r.id === reelId ? {
					...r,
					isLiked: res.data.liked,
					likesCount: res.data.likesCount
				} : r));
			}
		} catch (err) {
			// Rollback on error
			if (originalReel) {
				setReels(prev => prev.map(r => r.id === reelId ? originalReel! : r));
			}
		}
	}, []);

	const recordView = useCallback(async (reelId: string) => {
		try {
			await ReelsService.recordView(reelId);
			setReels(prev => prev.map(r => r.id === reelId ? { ...r, viewsCount: r.viewsCount + 1 } : r));
		} catch (err) {
			console.warn('Failed to record view for reel:', reelId, err);
		}
	}, []);

	const recordShare = useCallback(async (reelId: string) => {
		try {
			const res = await ReelsService.recordShare(reelId);
			if (res.success) {
				setReels(prev => prev.map(r => r.id === reelId ? { ...r, sharesCount: res.data.sharesCount } : r));
			}
		} catch (err) {
			console.warn('Failed to record share for reel:', reelId, err);
		}
	}, []);

	const incrementCommentsCount = useCallback((reelId: string) => {
		setReels(prev => prev.map(r => r.id === reelId ? { ...r, commentsCount: r.commentsCount + 1 } : r));
	}, []);

	useEffect(() => {
		loadFeed(0, true);
	}, []);

	return {
		reels,
		category,
		loading,
		refreshing,
		error,
		refresh,
		loadMore,
		changeCategory,
		toggleLike,
		recordView,
		recordShare,
		incrementCommentsCount,
	};
}
