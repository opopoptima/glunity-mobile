import React, { useRef, useState, useEffect, memo, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	TouchableWithoutFeedback,
	Modal,
	TextInput,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Alert,
	Keyboard,
	Clipboard,
	AppState
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	withSequence,
	withTiming,
	withDelay,
	runOnJS
} from 'react-native-reanimated';
import { Reel, ReelComment, ReelsService } from '../../services/reels.service';
import { useReelComments } from '../../hooks/useReelComments';
import { useAuth } from '../../../auth/state/auth.context';
import { useTheme } from '@/shared/context/theme.context';

function formatRelativeTime(dateString: string): string {
	const now = new Date();
	const date = new Date(dateString);
	const diffMs = now.getTime() - date.getTime();
	if (isNaN(diffMs) || diffMs < 0) return '1s';
	
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);

	if (diffSec < 60) return `${diffSec || 1}s`;
	if (diffMin < 60) return `${diffMin}m`;
	if (diffHour < 24) return `${diffHour}h`;
	return `${diffDay}d`;
}

// Screen aspect ratio used to classify video orientation at runtime.
// Videos wider than the screen ratio are "landscape" and get the blurred
// background treatment; everything else uses ResizeMode.COVER.
const SCREEN_RATIO = Dimensions.get('window').width / Dimensions.get('window').height;

const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop';

const COOLDOWN_KEY = 'reel_view_cooldowns';
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const OFFLINE_QUEUE_KEY = 'offline_reel_analytics';

const viewCooldownCache: Record<string, number> = {};

const queueOfflineAnalytics = async (reelId: string, payload: any) => {
	try {
		const existing = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
		const queue = existing ? JSON.parse(existing) : [];
		queue.push({ reelId, payload, timestamp: Date.now() });
		await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
	} catch (e) {}
};

const syncOfflineAnalytics = async () => {
	try {
		const existing = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
		if (!existing) return;
		const queue = JSON.parse(existing);
		if (queue.length === 0) return;

		const remaining = [];
		for (const item of queue) {
			try {
				const response = await ReelsService.recordAnalytics(item.reelId, item.payload);
				if (!response.success) {
					remaining.push(item);
				}
			} catch (err) {
				remaining.push(item);
			}
		}

		if (remaining.length > 0) {
			await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
		} else {
			await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
		}
	} catch (e) {}
};

const sendAnalytics = async (reelId: string, payload: any) => {
	try {
		const response = await ReelsService.recordAnalytics(reelId, payload);
		if (!response.success) {
			await queueOfflineAnalytics(reelId, payload);
		}
	} catch (error) {
		await queueOfflineAnalytics(reelId, payload);
	}
};

interface ReplyItemProps {
	reply: ReelComment;
	user: any;
	T: any;
	replyIsOwner: boolean;
	replyIsLikedByMe: boolean;
	replyRelativeTime: string;
	highlightedReplyId: string | null;
	replyHighlightStyle: any;
	onCommentPress: (comment: ReelComment) => void;
	onStartEdit: (comment: ReelComment) => void;
	onDeleteComment: (commentId: string) => void;
	onToggleCommentLike: (commentId: string) => void;
	parentComment: ReelComment;
	onReplyPress: (comment: ReelComment) => void;
}

const ReplyItem = memo(({
	reply,
	user,
	T,
	replyIsOwner,
	replyIsLikedByMe,
	replyRelativeTime,
	highlightedReplyId,
	replyHighlightStyle,
	onCommentPress,
	onStartEdit,
	onDeleteComment,
	onToggleCommentLike,
	parentComment,
	onReplyPress,
}: ReplyItemProps) => {
	return (
		<Animated.View
			style={[
				highlightedReplyId === reply.id && styles.highlightedItemBase,
				highlightedReplyId === reply.id ? replyHighlightStyle : null,
			]}
		>
			<TouchableOpacity
				activeOpacity={0.9}
				onPress={() => onCommentPress(reply)}
				style={styles.replyItem}
			>
				<Image
					source={{ uri: reply.authorAvatar || reply.author.avatarUrl || DEFAULT_AVATAR_URL }}
					style={styles.replyAvatar}
				/>
				<View style={styles.commentTextContainer}>
					<View style={styles.commentAuthorHeader}>
						<Text style={[styles.commentAuthor, { color: T.text }]}>
							{reply.authorUsername}
						</Text>
						<Text style={[styles.commentTime, { color: T.textMuted }]}>
							{replyRelativeTime}{reply.edited ? ' • Edited' : ''}
						</Text>
					</View>
					<Text style={[styles.commentText, { color: T.text }]}>{reply.text}</Text>
					
					<View style={styles.commentActionsRow}>
						{!replyIsOwner && (
							<TouchableOpacity style={styles.commentActionButton} onPress={() => onReplyPress(parentComment)}>
								<Text style={[styles.commentActionText, { color: T.textMuted }]}>Reply</Text>
							</TouchableOpacity>
						)}
						{replyIsOwner && (
							<>
								<TouchableOpacity style={styles.commentActionButton} onPress={() => onStartEdit(reply)}>
									<Text style={[styles.commentActionText, { color: T.textMuted }]}>Edit</Text>
								</TouchableOpacity>
								<TouchableOpacity style={styles.commentActionButton} onPress={() => onDeleteComment(reply.id)}>
									<Text style={[styles.commentActionText, { color: T.textMuted }]}>Delete</Text>
								</TouchableOpacity>
							</>
						)}
					</View>
				</View>

				{/* Reply Like */}
				<View style={styles.likeIconContainer}>
					<TouchableOpacity onPress={() => onToggleCommentLike(reply.id)}>
						<Ionicons
							name={replyIsLikedByMe ? "heart" : "heart-outline"}
							size={14}
							color={replyIsLikedByMe ? "#FF2D55" : T.textMuted}
						/>
					</TouchableOpacity>
					{reply.likeCount > 0 && (
						<Text style={[styles.replyLikeCount, { color: T.textMuted }]}>
							{reply.likeCount.toLocaleString()}
						</Text>
					)}
				</View>
			</TouchableOpacity>
		</Animated.View>
	);
});

interface CommentItemProps {
	item: ReelComment;
	user: any;
	T: any;
	isDark: boolean;
	relativeTime: string;
	isLikedByMe: boolean;
	isExpanded: boolean;
	commentReplies: ReelComment[];
	loadingRepliesForComment: boolean;
	highlightedCommentId: string | null;
	highlightedReplyId: string | null;
	commentHighlightStyle: any;
	replyHighlightStyle: any;
	onCommentPress: (comment: ReelComment) => void;
	onToggleReplies: (commentId: string) => void;
	onStartEdit: (comment: ReelComment) => void;
	onDeleteComment: (commentId: string) => void;
	onToggleCommentLike: (commentId: string) => void;
	onReplyPress: (comment: ReelComment) => void;
}

const CommentItem = memo(({
	item,
	user,
	T,
	isDark,
	relativeTime,
	isLikedByMe,
	isExpanded,
	commentReplies,
	loadingRepliesForComment,
	highlightedCommentId,
	highlightedReplyId,
	commentHighlightStyle,
	replyHighlightStyle,
	onCommentPress,
	onToggleReplies,
	onStartEdit,
	onDeleteComment,
	onToggleCommentLike,
	onReplyPress,
}: CommentItemProps) => {
	const isOwner = item.authorId === user?._id;

	return (
		<View style={styles.commentRowContainer}>
			{/* Parent Comment */}
			<Animated.View
				style={[
					highlightedCommentId === item.id && styles.highlightedItemBase,
					highlightedCommentId === item.id ? commentHighlightStyle : null,
				]}
			>
				<TouchableOpacity
					activeOpacity={0.9}
					onPress={() => onCommentPress(item)}
					style={styles.commentItem}
				>
					<Image
						source={{ uri: item.authorAvatar || item.author.avatarUrl || DEFAULT_AVATAR_URL }}
						style={styles.commentAvatar}
					/>
					<View style={styles.commentTextContainer}>
						<View style={styles.commentAuthorHeader}>
							<Text style={[styles.commentAuthor, { color: T.text }]}>
								{item.authorUsername}
							</Text>
							<Text style={[styles.commentTime, { color: T.textMuted }]}>
								{relativeTime}{item.edited ? ' • Edited' : ''}
							</Text>
						</View>
						<Text style={[styles.commentText, { color: T.text }]}>{item.text}</Text>
						
						<View style={styles.commentActionsRow}>
							{!isOwner && (
								<TouchableOpacity style={styles.commentActionButton} onPress={() => onReplyPress(item)}>
									<Text style={[styles.commentActionText, { color: T.textMuted }]}>Reply</Text>
								</TouchableOpacity>
							)}
							{isOwner && (
								<>
									<TouchableOpacity style={styles.commentActionButton} onPress={() => onStartEdit(item)}>
										<Text style={[styles.commentActionText, { color: T.textMuted }]}>Edit</Text>
									</TouchableOpacity>
									<TouchableOpacity style={styles.commentActionButton} onPress={() => onDeleteComment(item.id)}>
										<Text style={[styles.commentActionText, { color: T.textMuted }]}>Delete</Text>
									</TouchableOpacity>
								</>
							)}
						</View>
					</View>

					{/* Heart Like icon & count */}
					<View style={styles.likeIconContainer}>
						<TouchableOpacity onPress={() => onToggleCommentLike(item.id)}>
							<Ionicons
								name={isLikedByMe ? "heart" : "heart-outline"}
								size={16}
								color={isLikedByMe ? "#FF2D55" : T.textMuted}
							/>
						</TouchableOpacity>
						{item.likeCount > 0 && (
							<Text style={[styles.commentLikeCount, { color: T.textMuted }]}>
								{item.likeCount.toLocaleString()}
							</Text>
						)}
					</View>
				</TouchableOpacity>
			</Animated.View>

			{/* Collapsible Nested Replies */}
			{(item.replyCount > 0 || commentReplies.length > 0) && (
				<View style={styles.repliesWrapper}>
					<TouchableOpacity
						style={styles.viewRepliesButton}
						onPress={() => onToggleReplies(item.id)}
					>
						<View style={[styles.viewRepliesLine, { backgroundColor: T.textMuted }]} />
						<Text style={[styles.viewRepliesText, { color: T.textMuted }]}>
							{isExpanded ? 'Hide replies' : `View ${item.replyCount} more repl${item.replyCount > 1 ? 'ies' : 'y'}`}
						</Text>
					</TouchableOpacity>

					{isExpanded && (
						<View style={styles.repliesList}>
							{loadingRepliesForComment && commentReplies.length === 0 ? (
								<ActivityIndicator size="small" color={T.green} style={{ marginVertical: 8, alignSelf: 'flex-start' }} />
							) : (
								commentReplies.map((reply) => {
									const replyIsOwner = reply.authorId === user?._id;
									const replyIsLikedByMe = user?._id ? reply.likedBy.includes(user._id) : false;
									const replyRelativeTime = formatRelativeTime(reply.createdAt);

									return (
										<ReplyItem
											key={reply.id}
											reply={reply}
											user={user}
											T={T}
											replyIsOwner={replyIsOwner}
											replyIsLikedByMe={replyIsLikedByMe}
											replyRelativeTime={replyRelativeTime}
											highlightedReplyId={highlightedReplyId}
											replyHighlightStyle={replyHighlightStyle}
											onCommentPress={onCommentPress}
											onStartEdit={onStartEdit}
											onDeleteComment={onDeleteComment}
											onToggleCommentLike={onToggleCommentLike}
											parentComment={item}
											onReplyPress={onReplyPress}
										/>
									);
								})
							)}
						</View>
					)}
				</View>
			)}
		</View>
	);
});

export interface ReelPlayerItemProps {
	reel: Reel;
	isActive: boolean;
	/** True for the item immediately before or after the active one.
	 *  The Video component stays mounted and buffers in the background
	 *  so the user sees no black gap when they swipe to it. */
	isPreloading?: boolean;
	onToggleLike: (reelId: string) => void;
	onRecordView: (reelId: string) => void;
	onRecordShare: (reelId: string) => void;
	onIncrementCommentsCount: (reelId: string) => void;
	onOpenShareSheet?: (reel: Reel) => void;
	containerHeight: number;
	containerWidth: number;
	initialCommentId?: string;
	initialReplyId?: string;
}

/**
 * Custom comparator for React.memo — only re-render when props that
 * affect the visual output actually change.
 */
function arePropsEqual(prev: ReelPlayerItemProps, next: ReelPlayerItemProps): boolean {
	return (
		prev.reel.id === next.reel.id &&
		prev.reel.isLiked === next.reel.isLiked &&
		prev.reel.likesCount === next.reel.likesCount &&
		prev.reel.commentsCount === next.reel.commentsCount &&
		prev.reel.sharesCount === next.reel.sharesCount &&
		prev.reel.viewsCount === next.reel.viewsCount &&
		prev.isActive === next.isActive &&
		prev.isPreloading === next.isPreloading &&
		prev.containerHeight === next.containerHeight &&
		prev.containerWidth === next.containerWidth &&
		prev.initialCommentId === next.initialCommentId &&
		prev.initialReplyId === next.initialReplyId
	);
}

function ReelPlayerItemComponent({
	reel,
	isActive,
	isPreloading = false,
	onToggleLike,
	onRecordView,
	onRecordShare,
	onIncrementCommentsCount,
	onOpenShareSheet,
	containerHeight,
	containerWidth,
	initialCommentId,
	initialReplyId,
}: ReelPlayerItemProps) {
	const videoRef = useRef<Video>(null);
	const isFocused = useIsFocused();
	const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
	const [isMuted, setIsMuted] = useState(false);
	// userPaused: true when the user manually tapped to pause THIS reel.
	// Resets automatically when the reel becomes active (swipe).
	const [userPaused, setUserPaused] = useState(false);
	const lastUpdateRef = useRef<number | null>(null);
	const continuousWatchRef = useRef<number>(0);
	const qualifiedViewSentRef = useRef<boolean>(false);
	const playRecordedRef = useRef<boolean>(false);
	const impressionRecordedRef = useRef<boolean>(false);
	const totalWatchTimeRef = useRef<number>(0);
	const completionsRef = useRef<number>(0);
	const insets = useSafeAreaInsets();

	// Calculate dynamic offsets so layout elements float perfectly above the bottom navigation bar and gesture area.
	const navBarHeight = 60 + Math.max(insets.bottom, 12);
	const bottomInfoBottom = navBarHeight + 12;
	const rightOverlayBottom = navBarHeight + 24;

	// ── Aspect ratio & ResizeMode detection ─────────────────────────────
	// We default to COVER since 95%+ of reels are portrait. If the video
	// is landscape or square, we dynamically switch to CONTAIN when its
	// natural size is loaded to avoid cropping the content.
	const [videoResizeMode, setVideoResizeMode] = useState<ResizeMode>(ResizeMode.COVER);

	// ── First-frame readiness ─────────────────────────────────────────
	// isVideoReady becomes true only when onReadyForDisplay fires, which
	// means the decoder has produced the first pixel — the video is truly
	// visible. We keep a permanent thumbnail overlay with animated opacity
	// underneath the video so there's ALWAYS a visual fallback.
	const [isVideoReady, setIsVideoReady] = useState(false);

	// ── Thumbnail crossfade animation ────────────────────────────────
	// The thumbnail opacity transitions smoothly from 1→0 when the
	// video's first frame is ready, creating a crossfade instead of a
	// hard cut. The thumbnail NEVER unmounts — only becomes transparent.
	const thumbnailOpacity = useSharedValue(1);

	const thumbnailAnimatedStyle = useAnimatedStyle(() => ({
		opacity: thumbnailOpacity.value,
	}));

	// Reset readiness whenever a different video is mounted in this slot.
	useEffect(() => {
		setIsVideoReady(false);
		setVideoResizeMode(ResizeMode.COVER); // default to COVER
		thumbnailOpacity.value = 1;
	}, [reel.id]);

	// When the item becomes active again and the video is already
	// loaded (e.g. scrolling back up to a previously viewed reel),
	// immediately mark it as ready so the thumbnail fades out.
	// Without this, audio plays but the thumbnail stays visible
	// because onReadyForDisplay doesn't re-fire for already-decoded video.
	useEffect(() => {
		if (isActive && status && (status as any).isLoaded) {
			setIsVideoReady(true);
		}
	}, [isActive, status]);

	// Drive crossfade: when video is ready, fade the thumbnail out.
	// When not ready, ensure thumbnail is fully opaque.
	useEffect(() => {
		thumbnailOpacity.value = withTiming(isVideoReady ? 0 : 1, { duration: 200 });
	}, [isVideoReady]);

	// onReadyForDisplay fires when the first frame is decoded.
	const handleReadyForDisplay = useCallback((event: any) => {
		setIsVideoReady(true);
		const ns = event?.naturalSize;
		if (ns && ns.width > 0 && ns.height > 0) {
			const aspectRatio = ns.width / ns.height;
			// Portrait (aspectRatio < 0.85) -> COVER (fill container naturally)
			// Landscape/Square (aspectRatio >= 0.85) -> CONTAIN (avoid cropping)
			const mode = aspectRatio < 0.85 ? ResizeMode.COVER : ResizeMode.CONTAIN;
			setVideoResizeMode(mode);
		}
	}, []);

	// Handle thumbnail loaded dimensions to set resizeMode before video play
	const handleThumbnailLoad = useCallback((event: any) => {
		const source = event?.source;
		if (source && source.width > 0 && source.height > 0) {
			const aspectRatio = source.width / source.height;
			const mode = aspectRatio < 0.85 ? ResizeMode.COVER : ResizeMode.CONTAIN;
			setVideoResizeMode(mode);
		}
	}, []);

	const handlePlaybackStatusUpdate = useCallback((s: AVPlaybackStatus) => {
		setStatus(s);
		
		if (!s.isLoaded) {
			lastUpdateRef.current = null;
			return;
		}

		const now = Date.now();
		const isBuffering = s.isBuffering;
		const isPlaying = s.isPlaying;
		const isFinished = s.didJustFinish;

		// 1. Playback loop completion count
		if (isFinished) {
			completionsRef.current += 1;
		}

		// 2. Play recording (occurs when the video first starts playing)
		if (isPlaying && !playRecordedRef.current && isActive && isFocused) {
			playRecordedRef.current = true;
		}

		// Check if watch time conditions are met
		const watchConditionsMet = 
			isActive &&
			isFocused &&
			isPlaying &&
			!isBuffering &&
			!userPaused;

		if (watchConditionsMet) {
			if (lastUpdateRef.current !== null) {
				const deltaSec = (now - lastUpdateRef.current) / 1000;
				// Avoid double count or crazy jumps (e.g. if tab is suspended)
				if (deltaSec > 0 && deltaSec < 3) {
					continuousWatchRef.current += deltaSec;
					totalWatchTimeRef.current += deltaSec;
				}
			}
			lastUpdateRef.current = now;

			// Check 3 seconds continuous watch gate
			if (continuousWatchRef.current >= 3.0 && !qualifiedViewSentRef.current) {
				const lastViewTime = viewCooldownCache[reel.id] || 0;
				if (Date.now() - lastViewTime >= COOLDOWN_MS) {
					qualifiedViewSentRef.current = true;
				}
			}
		} else {
			// Reset continuous watch timer if conditions are not met
			continuousWatchRef.current = 0;
			lastUpdateRef.current = null;
		}
	}, [isActive, isFocused, userPaused, reel.id]);
	
	// Comments state
	const [commentsVisible, setCommentsVisible] = useState(false);
	const sheetTranslateY = useSharedValue(containerHeight);
	const backdropOpacity = useSharedValue(0);
	const [keyboardHeight, setKeyboardHeight] = useState(0);

	useEffect(() => {
		const showSub = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
			(e) => {
				setKeyboardHeight(e.endCoordinates.height);
			}
		);
		const hideSub = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			() => {
				setKeyboardHeight(0);
			}
		);
		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	const sheetAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: sheetTranslateY.value }],
	}));

	const backdropAnimatedStyle = useAnimatedStyle(() => ({
		opacity: backdropOpacity.value,
	}));

	const openComments = useCallback(() => {
		setCommentsVisible(true);
	}, []);

	const closeComments = useCallback(() => {
		sheetTranslateY.value = withSpring(containerHeight, { damping: 15, stiffness: 120 }, (finished) => {
			if (finished) {
				runOnJS(setCommentsVisible)(false);
			}
		});
		backdropOpacity.value = withTiming(0, { duration: 200 });
	}, [containerHeight]);

	// Open animation trigger
	useEffect(() => {
		if (commentsVisible) {
			sheetTranslateY.value = containerHeight;
			sheetTranslateY.value = withSpring(containerHeight * (1 - 0.75), { damping: 15, stiffness: 120 });
			backdropOpacity.value = withTiming(1, { duration: 250 });
		}
	}, [commentsVisible, containerHeight]);

	const dragStartY = useSharedValue(0);
	const panGesture = Gesture.Pan()
		.onStart(() => {
			dragStartY.value = sheetTranslateY.value;
		})
		.onUpdate((event) => {
			const targetY = dragStartY.value + event.translationY;
			const maxUp = containerHeight * (1 - 0.95);
			const maxDown = containerHeight;
			sheetTranslateY.value = Math.max(maxUp, Math.min(maxDown, targetY));
		})
		.onEnd((event) => {
			const y = sheetTranslateY.value;
			const snapPoints = [
				containerHeight * (1 - 0.95), // 95%
				containerHeight * (1 - 0.75), // 75%
				containerHeight * (1 - 0.45), // 45%
				containerHeight,              // closed
			];
			let closest = snapPoints[0];
			let minDist = Math.abs(y - closest);
			for (let i = 1; i < snapPoints.length; i++) {
				const dist = Math.abs(y - snapPoints[i]);
				if (dist < minDist) {
					minDist = dist;
					closest = snapPoints[i];
				}
			}

			if (event.velocityY > 500) {
				const currentIndex = snapPoints.indexOf(closest);
				const nextIndex = Math.min(snapPoints.length - 1, currentIndex + 1);
				closest = snapPoints[nextIndex];
			} else if (event.velocityY < -500) {
				const currentIndex = snapPoints.indexOf(closest);
				const nextIndex = Math.max(0, currentIndex - 1);
				closest = snapPoints[nextIndex];
			}

			sheetTranslateY.value = withSpring(closest, { damping: 15, stiffness: 120 }, (finished) => {
				if (finished && closest === containerHeight) {
					runOnJS(setCommentsVisible)(false);
				}
			});
			if (closest === containerHeight) {
				backdropOpacity.value = withTiming(0, { duration: 200 });
			} else {
				backdropOpacity.value = withTiming(1, { duration: 200 });
			}
		});

	const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
	const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
	const [highlightedReplyId, setHighlightedReplyId] = useState<string | null>(null);
	const [actionSheetVisible, setActionSheetVisible] = useState(false);
	const [selectedCommentForActions, setSelectedCommentForActions] = useState<ReelComment | null>(null);
	const [text, setText] = useState('');
	const inputRef = useRef<TextInput>(null);
  const activeDeepLinkKeyRef = useRef<string | null>(null);
  const clearCommentHighlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearReplyHighlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const { user } = useAuth();
	const { theme: T, isDark } = useTheme();
	const isOwner = user?._id ? String(reel.author.id) === String(user._id) : false;

	const {
		comments,
		loading: loadingComments,
		loadingMore,
		hasMore,
		replies,
		loadingReplies,
		repliesHasMore,
		replyingTo,
		editingComment,
		toastMessage,
		setReplyingTo,
		setEditingComment,
		loadComments,
		loadReplies,
		postComment,
		updateComment,
		deleteComment,
		toggleCommentLike,
		showToast,
	} = useReelComments(reel.id);

	const commentHighlightOpacity = useSharedValue(0);
	const replyHighlightOpacity = useSharedValue(0);

	const commentHighlightStyle = useAnimatedStyle(() => ({
		backgroundColor: `rgba(109,174,63,${0.22 * commentHighlightOpacity.value})`,
	}));

	const replyHighlightStyle = useAnimatedStyle(() => ({
		backgroundColor: `rgba(109,174,63,${0.22 * replyHighlightOpacity.value})`,
	}));

	useEffect(() => {
		if (commentsVisible) {
			loadComments(true);
		}
	}, [commentsVisible, loadComments]);

	useEffect(() => {
		return () => {
			if (clearCommentHighlightTimerRef.current) {
				clearTimeout(clearCommentHighlightTimerRef.current);
			}
			if (clearReplyHighlightTimerRef.current) {
				clearTimeout(clearReplyHighlightTimerRef.current);
			}
		};
	}, []);

	const triggerCommentHighlight = useCallback((commentId: string) => {
		if (!commentId) return;
		setHighlightedCommentId(commentId);
		commentHighlightOpacity.value = 1;
		commentHighlightOpacity.value = withDelay(4000, withTiming(0, { duration: 700 }));
		if (clearCommentHighlightTimerRef.current) clearTimeout(clearCommentHighlightTimerRef.current);
		clearCommentHighlightTimerRef.current = setTimeout(() => {
			setHighlightedCommentId((prev) => (prev === commentId ? null : prev));
		}, 4700);
	}, [commentHighlightOpacity]);

	const triggerReplyHighlight = useCallback((replyId: string) => {
		if (!replyId) return;
		setHighlightedReplyId(replyId);
		replyHighlightOpacity.value = 1;
		replyHighlightOpacity.value = withDelay(4000, withTiming(0, { duration: 700 }));
		if (clearReplyHighlightTimerRef.current) clearTimeout(clearReplyHighlightTimerRef.current);
		clearReplyHighlightTimerRef.current = setTimeout(() => {
			setHighlightedReplyId((prev) => (prev === replyId ? null : prev));
		}, 4700);
	}, [replyHighlightOpacity]);

	useEffect(() => {
		const targetKey = `${initialCommentId || ''}:${initialReplyId || ''}`;
		if (!isActive || targetKey === ':' || activeDeepLinkKeyRef.current === targetKey) {
			return;
		}
		if (!commentsVisible) {
			setCommentsVisible(true);
		}
	}, [isActive, commentsVisible, initialCommentId, initialReplyId]);

	useEffect(() => {
		const targetKey = `${initialCommentId || ''}:${initialReplyId || ''}`;
		if (!isActive || !commentsVisible || targetKey === ':' || activeDeepLinkKeyRef.current === targetKey) {
			return;
		}

		let cancelled = false;

		const runDeepLinkFocus = async () => {
			if (initialReplyId) {
				const parentId =
					initialCommentId ||
					Object.keys(replies).find((parent) => (replies[parent] || []).some((r) => r.id === initialReplyId));

				if (!parentId) return;

				const hasLoadedReply = (replies[parentId] || []).some((r) => r.id === initialReplyId);
				if (!expandedComments[parentId]) {
					setExpandedComments((prev) => ({ ...prev, [parentId]: true }));
				}
				if (!hasLoadedReply) {
					await loadReplies(parentId, true);
				}

				if (!cancelled) {
					triggerReplyHighlight(initialReplyId);
					activeDeepLinkKeyRef.current = targetKey;
				}
				return;
			}

			if (initialCommentId) {
				const exists = comments.some((c) => c.id === initialCommentId);
				if (!exists) {
					return;
				}

				if (!cancelled) {
					triggerCommentHighlight(initialCommentId);
					activeDeepLinkKeyRef.current = targetKey;
				}
			}
		};

		runDeepLinkFocus().catch(() => {});

		return () => {
			cancelled = true;
		};
	}, [
		isActive,
		commentsVisible,
		comments,
		replies,
		expandedComments,
		loadReplies,
		initialCommentId,
		initialReplyId,
		triggerCommentHighlight,
		triggerReplyHighlight,
	]);

	// Sync editingComment text into input
	useEffect(() => {
		if (editingComment) {
			setText(editingComment.text);
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		} else {
			setText('');
		}
	}, [editingComment]);
	
	// Double tap / Heart animation
	const lastTapRef = useRef<number | null>(null);
	const heartScale = useSharedValue(0);
	const heartOpacity = useSharedValue(0);

	const heartStyle = useAnimatedStyle(() => ({
		transform: [{ scale: heartScale.value }],
		opacity: heartOpacity.value,
	}));

	// ── Video lifecycle ──────────────────────────────────────────────
	// Hybrid approach: `shouldPlay` prop handles initial mount state,
	// while imperative playAsync/pauseAsync ensures reliable toggling
	// when isActive changes during FlatList recycling.
	const shouldPlay = isActive && isFocused && !userPaused;

	// Imperative play/pause — fires when activation state changes.
	// This is necessary because expo-av's `shouldPlay` prop doesn't
	// always re-evaluate reliably during FlatList cell recycling.
	// • Active + playing: playAsync
	// • Active + user paused: pauseAsync (keeps position, no native overlay)
	// • Not active at all: pauseAsync (gentle stop, avoids native play icon)
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		if (shouldPlay) {
			video.playAsync().catch(() => {});
		} else {
			video.pauseAsync().catch(() => {});
		}
	}, [shouldPlay]);

	// Consolidated analytics flush function
	const flushAnalytics = useCallback(() => {
		const impressions = impressionRecordedRef.current ? 1 : 0;
		const plays = playRecordedRef.current ? 1 : 0;
		const watchTime = totalWatchTimeRef.current;
		const completions = completionsRef.current;

		const lastViewTime = viewCooldownCache[reel.id] || 0;
		const now = Date.now();
		const isCooldownElapsed = now - lastViewTime >= COOLDOWN_MS;
		const isQualified = qualifiedViewSentRef.current && isCooldownElapsed;

		if (impressions === 0 && plays === 0 && watchTime === 0 && completions === 0) {
			return; // Nothing to report
		}

		const payload = {
			impressions,
			plays,
			watchTime: parseFloat(watchTime.toFixed(2)),
			completions,
			qualifiedView: isQualified,
		};

		if (isQualified) {
			viewCooldownCache[reel.id] = now;
			AsyncStorage.getItem(COOLDOWN_KEY).then((data) => {
				const cache = data ? JSON.parse(data) : {};
				cache[reel.id] = now;
				AsyncStorage.setItem(COOLDOWN_KEY, JSON.stringify(cache));
			}).catch(() => {});

			// Update UI state
			onRecordView(reel.id);
		}

		// Reset flags so they aren't double reported in next segment
		impressionRecordedRef.current = false;
		playRecordedRef.current = false;
		totalWatchTimeRef.current = 0;
		completionsRef.current = 0;

		sendAnalytics(reel.id, payload);
	}, [reel.id, onRecordView]);

	// AppState Listener to pause timer and flush analytics
	const appStateRef = useRef(AppState.currentState);
	useEffect(() => {
		const subscription = AppState.addEventListener('change', (nextAppState) => {
			if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
				// App going to background: pause watch timer and flush
				lastUpdateRef.current = null;
				continuousWatchRef.current = 0;
				flushAnalytics();
			}
			appStateRef.current = nextAppState;
		});
		return () => subscription.remove();
	}, [flushAnalytics]);

	// Cooldown and visibility active transition
	useEffect(() => {
		if (isActive) {
			setUserPaused(false);
			
			// Sync offline queue
			syncOfflineAnalytics();
			
			// Load cooldown cache from storage if empty
			AsyncStorage.getItem(COOLDOWN_KEY).then((data) => {
				if (data) {
					try {
						const parsed = JSON.parse(data);
						Object.assign(viewCooldownCache, parsed);
					} catch (e) {}
				}
			}).catch(() => {});

			// Impression starts!
			impressionRecordedRef.current = true;
			
			// Check cooldown
			const lastViewTime = viewCooldownCache[reel.id] || 0;
			const now = Date.now();
			if (now - lastViewTime < COOLDOWN_MS) {
				qualifiedViewSentRef.current = true; // Already viewed within cooldown
			} else {
				qualifiedViewSentRef.current = false;
			}
			
			// Start tracking watch time
			continuousWatchRef.current = 0;
			lastUpdateRef.current = Date.now();
		} else {
			// User scrolled away! Flush analytics
			flushAnalytics();
			
			// Reset tracking refs
			lastUpdateRef.current = null;
			continuousWatchRef.current = 0;
			playRecordedRef.current = false;
			impressionRecordedRef.current = false;
			qualifiedViewSentRef.current = false;
			totalWatchTimeRef.current = 0;
			completionsRef.current = 0;
		}

		return () => {
			// Flush on unmount
			flushAnalytics();
		};
	}, [isActive, reel.id, flushAnalytics]);

	// Handle single/double tap on the screen
	const handlePress = () => {
		const now = Date.now();
		const DOUBLE_PRESS_DELAY = 300;
		if (lastTapRef.current && now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
			handleDoubleTap();
		} else {
			lastTapRef.current = now;
			// Single tap: toggle play/pause
			setTimeout(() => {
				if (lastTapRef.current === now) {
					togglePlayPause();
				}
			}, DOUBLE_PRESS_DELAY);
		}
	};

	const togglePlayPause = () => {
		setUserPaused(prev => !prev);
	};

	const handleDoubleTap = () => {
		if (!reel.isLiked) {
			onToggleLike(reel.id);
			try {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			} catch (err) {}
		}
		
		// Animate pop heart
		heartScale.value = 0;
		heartOpacity.value = 1;
		heartScale.value = withSequence(
			withSpring(1.2, { damping: 4, stiffness: 150 }),
			withTiming(0, { duration: 400 })
		);
		heartOpacity.value = withTiming(0, { duration: 700 });
	};



	const handleSubmitComment = async () => {
		if (!text.trim()) return;
		if (editingComment) {
			await updateComment(editingComment.id, text);
		} else {
			await postComment(text);
			onIncrementCommentsCount(reel.id);
		}
		setText('');
		Keyboard.dismiss();
	};

	const handleEmojiPress = async (emoji: string) => {
		await postComment(emoji);
		onIncrementCommentsCount(reel.id);
	};

	const toggleReplies = async (commentId: string) => {
		const isCurrentlyExpanded = !!expandedComments[commentId];
		if (!isCurrentlyExpanded) {
			setExpandedComments(prev => ({ ...prev, [commentId]: true }));
			await loadReplies(commentId, true);
		} else {
			setExpandedComments(prev => ({ ...prev, [commentId]: false }));
		}
	};

	const handleCommentPress = (comment: ReelComment) => {
		const isOwner = comment.authorId === user?._id;
		if (isOwner) {
			setSelectedCommentForActions(comment);
			setActionSheetVisible(true);
		} else {
			setReplyingTo(comment);
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		}
	};

	const handleCopyText = (comment: ReelComment) => {
		Clipboard.setString(comment.text);
		setActionSheetVisible(false);
	};

	const handleStartEdit = (comment: ReelComment) => {
		setEditingComment(comment);
		setActionSheetVisible(false);
	};

	const handleDelete = async (comment: ReelComment) => {
		setActionSheetVisible(false);
		await deleteComment(comment.id);
	};

	// Get navigation
	const navigation = useNavigation<any>();

	return (
		<View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
			<TouchableWithoutFeedback onPress={handlePress}>
				<View style={StyleSheet.absoluteFill}>
					{/*
					 * ── Cinematic video display ────────────────────────
					 *
					 * All videos (portrait, landscape, square) use the
					 * same layout:
					 *
					 *   Layer 1: Blurred thumbnail filling the entire
					 *            screen — eliminates pure black bars and
					 *            gives a rich, immersive background.
					 *
					 *   Layer 2: Video inside a 90%-height centered
					 *            container with ResizeMode.CONTAIN.
					 *            Full width, vertically centered, with
					 *            ~5% padding at top and bottom.
					 *
					 *   Layer 3: Sharp thumbnail overlay (crossfades
					 *            out when the first video frame renders).
					 */}

					{/* Blurred background — always fills entire screen */}
					<Image
						source={{ uri: reel.thumbnailUrl }}
						style={StyleSheet.absoluteFillObject}
						contentFit="cover"
						blurRadius={30}
					/>
					{/* Darken overlay on blurred bg for cinematic look */}
					<View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />

					{/* Video container — 90% height, centered vertically */}
					<View style={styles.videoContainer}>
						<Video
							ref={videoRef}
							source={{ uri: reel.videoUrl }}
							shouldPlay={shouldPlay}
							resizeMode={videoResizeMode}
							isLooping
							isMuted={isMuted}
							style={styles.videoPlayer}
							onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
							onReadyForDisplay={handleReadyForDisplay}
						/>
					</View>

					{/* PERMANENT thumbnail layer — always rendered on top.
					 *  Uses animated opacity to crossfade out when the video's
					 *  first frame is decoded (onReadyForDisplay). NEVER unmounts,
					 *  so there is always a visual fallback — eliminates black
					 *  frames during swipe transitions completely. */}
					<Animated.View style={[StyleSheet.absoluteFillObject, thumbnailAnimatedStyle]} pointerEvents="none">
						<Image
							source={{ uri: reel.thumbnailUrl }}
							style={StyleSheet.absoluteFillObject}
							contentFit={videoResizeMode === ResizeMode.CONTAIN ? 'contain' : 'cover'}
							onLoad={handleThumbnailLoad}
						/>
					</Animated.View>

					{/* Centered Loading Spinner — shown only when active & not yet frame-ready */}
					{isActive && isFocused && !isVideoReady && (
						<View style={styles.loadingOverlay}>
							<ActivityIndicator size="large" color="#FFFFFF" />
						</View>
					)}

					{/* Top gradient */}
					<LinearGradient
						colors={['rgba(0,0,0,0.6)', 'transparent']}
						style={styles.topGradient}
					/>

					{/* Bottom gradient */}
					<LinearGradient
						colors={['transparent', 'rgba(0,0,0,0.8)']}
						style={styles.bottomGradient}
					/>

					{/* Double-tap heart */}
					<View style={styles.heartOverlay}>
						<Animated.View style={heartStyle}>
							<Ionicons name="heart" size={100} color="#FF2D55" />
						</Animated.View>
					</View>

					{/* Play icon HUD — shown when user manually paused */}
					{isActive && userPaused && (
						<View style={styles.hudOverlay}>
							<Ionicons name="play" size={50} color="rgba(255,255,255,0.7)" />
						</View>
					)}
				</View>
			</TouchableWithoutFeedback>

			{/* Bottom info section */}
			<View style={[styles.bottomInfo, { bottom: bottomInfoBottom }]}>
				<View style={styles.authorRow}>
					<Image
						source={{ uri: reel.author.avatarUrl || DEFAULT_AVATAR_URL }}
						style={styles.authorAvatar}
					/>
					<Text style={styles.authorName}>@{reel.author.fullName.replace(/\s+/g, '').toLowerCase()}</Text>
				</View>
				<Text style={styles.caption} numberOfLines={2}>{reel.caption}</Text>
				
				<View style={styles.metaRow}>
					<View style={styles.musicTag}>
						<Ionicons name="musical-notes" size={12} color="#FFF" style={styles.musicIcon} />
						<Text style={styles.musicText} numberOfLines={1}>Original Audio</Text>
					</View>
					{isOwner && reel.viewsCount !== undefined && reel.viewsCount !== null && (
						<View style={styles.userTag}>
							<Ionicons name="people" size={12} color="#FFF" style={styles.userIcon} />
							<Text style={styles.userText}>{reel.viewsCount} users</Text>
						</View>
					)}
				</View>
			</View>

			{/* Right-side button overlay */}
			<View style={[styles.rightOverlay, { bottom: rightOverlayBottom }]}>
				{/* Avatar */}
				<View style={styles.avatarContainer}>
					<Image
						source={{ uri: reel.author.avatarUrl || DEFAULT_AVATAR_URL }}
						style={styles.avatar}
					/>
					<TouchableOpacity style={styles.followButton}>
						<Ionicons name="add-circle" size={18} color="#FF2D55" />
					</TouchableOpacity>
				</View>

				{/* Like Button */}
				<TouchableOpacity style={styles.actionButton} onPress={() => {
					onToggleLike(reel.id);
					try {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
					} catch (err) {}
				}}>
					<Ionicons
						name={reel.isLiked ? "heart" : "heart-outline"}
						size={34}
						color={reel.isLiked ? "#FF2D55" : "#FFF"}
					/>
					<Text style={styles.actionText}>{reel.likesCount}</Text>
				</TouchableOpacity>

				{/* Comment Button */}
				<TouchableOpacity style={styles.actionButton} onPress={openComments}>
					<Ionicons name="chatbubble-outline" size={30} color="#FFF" />
					<Text style={styles.actionText}>{reel.commentsCount}</Text>
				</TouchableOpacity>

				{/* Share/Send Button */}
				<TouchableOpacity style={styles.actionButton} onPress={() => {
					if (onOpenShareSheet) {
						onOpenShareSheet(reel);
					} else {
						onRecordShare(reel.id);
						Alert.alert('Share', 'Link copied to clipboard!');
					}
				}}>
					<Ionicons name="paper-plane-outline" size={30} color="#FFF" />
					<Text style={styles.actionText}>{reel.sharesCount || 0}</Text>
				</TouchableOpacity>

				{/* Plus Camera button */}
				<TouchableOpacity style={styles.plusButtonCircle} onPress={() => navigation.navigate('ReelCapture')}>
					<Ionicons name="add" size={24} color="#FFF" />
				</TouchableOpacity>
			</View>

			{/* Custom Bottom Sheet for Comments */}
			{commentsVisible && (
				<View style={[StyleSheet.absoluteFillObject, { zIndex: 1000 }]}>
					{/* Backdrop */}
					<Animated.View style={[styles.sheetBackdrop, backdropAnimatedStyle]}>
						<TouchableOpacity
							activeOpacity={1}
							style={StyleSheet.absoluteFillObject}
							onPress={closeComments}
						/>
					</Animated.View>

					{/* Sheet container */}
					<Animated.View
						style={[
							styles.sheetContainer,
							sheetAnimatedStyle,
							{
								backgroundColor: T.surface,
								borderColor: T.border,
								// Adjust bottom padding when keyboard is open:
								paddingBottom: keyboardHeight > 0 ? keyboardHeight : Math.max(insets.bottom, 12),
							},
						]}
					>
						{/* Header handle - wrapped with gesture detector for dragging */}
						<GestureDetector gesture={panGesture}>
							<View style={[styles.commentsHeader, { borderBottomColor: T.divider }]}>
								<View style={[styles.commentsHeaderIndicator, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
								<View style={styles.commentsHeaderTitleRow}>
									<Text style={[styles.commentsTitle, { color: T.text }]}>Comments</Text>
									<TouchableOpacity onPress={closeComments} style={styles.commentsCloseBtn}>
										<Ionicons name="close" size={24} color={T.text} />
									</TouchableOpacity>
								</View>
							</View>
						</GestureDetector>

						{/* Toast notification for failures */}
						{toastMessage && (
							<View style={styles.toastContainer}>
								<Text style={styles.toastText}>{toastMessage}</Text>
							</View>
						)}

						{loadingComments && comments.length === 0 ? (
							<View style={styles.centerSpinner}>
								<ActivityIndicator size="large" color={T.green} />
							</View>
						) : (
							<FlatList
								style={{ flex: 1 }}
								data={comments}
								keyExtractor={(item) => item.id}
								keyboardShouldPersistTaps="handled"
								contentContainerStyle={{ paddingBottom: 16 }}
								renderItem={({ item }) => {
									const isLikedByMe = user?._id ? item.likedBy.includes(user._id) : false;
									const isExpanded = !!expandedComments[item.id];
									const commentReplies = replies[item.id] || [];
									const loadingRepliesForComment = !!loadingReplies[item.id];
									const relativeTime = formatRelativeTime(item.createdAt);

									return (
										<CommentItem
											item={item}
											user={user}
											T={T}
											isDark={isDark}
											relativeTime={relativeTime}
											isLikedByMe={isLikedByMe}
											isExpanded={isExpanded}
											commentReplies={commentReplies}
											loadingRepliesForComment={loadingRepliesForComment}
											highlightedCommentId={highlightedCommentId}
											highlightedReplyId={highlightedReplyId}
											commentHighlightStyle={commentHighlightStyle}
											replyHighlightStyle={replyHighlightStyle}
											onCommentPress={handleCommentPress}
											onToggleReplies={toggleReplies}
											onStartEdit={handleStartEdit}
											onDeleteComment={deleteComment}
											onToggleCommentLike={toggleCommentLike}
											onReplyPress={(parent) => {
												setReplyingTo(parent);
												inputRef.current?.focus();
											}}
										/>
									);
								}}
							/>
						)}

						{/* Input section */}
						<View style={{ borderTopWidth: 1, borderTopColor: T.divider, backgroundColor: T.surface }}>
							{replyingTo && (
								<View style={[styles.inputBanner, { backgroundColor: T.surfaceAlt, borderTopWidth: 0 }]}>
									<Text style={[styles.inputBannerText, { color: T.textMuted }]}>
										Replying to @{replyingTo.authorUsername}
									</Text>
									<TouchableOpacity onPress={() => setReplyingTo(null)}>
										<Ionicons name="close-circle" size={16} color={T.textMuted} />
									</TouchableOpacity>
								</View>
							)}
							{editingComment && (
								<View style={[styles.inputBanner, { backgroundColor: T.surfaceAlt, borderTopWidth: 0 }]}>
									<Text style={[styles.inputBannerText, { color: T.textMuted }]}>
										Editing comment
									</Text>
									<TouchableOpacity onPress={() => setEditingComment(null)}>
										<Ionicons name="close-circle" size={16} color={T.textMuted} />
									</TouchableOpacity>
								</View>
							)}
							<View style={[styles.commentInputRow, { borderTopWidth: 0, backgroundColor: T.surface, paddingBottom: Platform.OS === 'ios' ? 16 : 12 }]}>
								<Image
									source={{ uri: user?.avatarUrl || DEFAULT_AVATAR_URL }}
									style={styles.inputAvatar}
								/>
								<View style={[styles.commentInputContainer, { backgroundColor: T.surfaceAlt }]}>
									<TextInput
										ref={inputRef}
										value={text}
										onChangeText={setText}
										placeholder={replyingTo ? `Reply to @${replyingTo.authorUsername}...` : "Join the conversation..."}
										placeholderTextColor={T.textMuted}
										style={[styles.commentInput, { color: T.text }]}
										multiline
									/>
									<TouchableOpacity style={styles.inputIconButton} onPress={() => showToast("Image comments are coming soon!")}>
										<Ionicons name="image-outline" size={20} color={T.textMuted} />
									</TouchableOpacity>
									<TouchableOpacity style={[styles.gifButton, { borderColor: T.textMuted }]} onPress={() => showToast("GIF comments are coming soon!")}>
										<Text style={[styles.gifButtonText, { color: T.textMuted }]}>GIF</Text>
									</TouchableOpacity>
								</View>
								
								{text.trim() ? (
									<TouchableOpacity onPress={handleSubmitComment} style={styles.postButton}>
										<Ionicons name="send" size={22} color="#6DAE3F" />
									</TouchableOpacity>
								) : (
									<TouchableOpacity style={styles.giftButtonIcon} onPress={() => showToast("Reels Gifts are not available in this region.")}>
										<Ionicons name="gift-outline" size={22} color={T.textMuted} />
									</TouchableOpacity>
								)}
							</View>
						</View>
					</Animated.View>
				</View>
			)}

			{/* Custom Owner Action Sheet Modal */}
			<Modal
				visible={actionSheetVisible}
				animationType="fade"
				transparent
				onRequestClose={() => setActionSheetVisible(false)}
			>
				<TouchableOpacity
					style={styles.actionSheetOverlay}
					activeOpacity={1}
					onPress={() => setActionSheetVisible(false)}
				>
					<View style={[styles.actionSheetContainer, { backgroundColor: T.surfaceAlt }]}>
						<View style={[styles.actionSheetHeaderIndicator, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />
						<TouchableOpacity
							style={[styles.actionSheetButton, { borderBottomColor: T.divider }]}
							onPress={() => selectedCommentForActions && handleCopyText(selectedCommentForActions)}
						>
							<Text style={[styles.actionSheetButtonText, { color: T.text }]}>Copy Text</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.actionSheetButton, { borderBottomColor: T.divider }]}
							onPress={() => selectedCommentForActions && handleStartEdit(selectedCommentForActions)}
						>
							<Text style={[styles.actionSheetButtonText, { color: T.text }]}>Edit Comment</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.actionSheetButton, styles.actionSheetDeleteButton, { borderBottomColor: T.divider }]}
							onPress={() => selectedCommentForActions && handleDelete(selectedCommentForActions)}
						>
							<Text style={[styles.actionSheetButtonText, styles.actionSheetDeleteText]}>Delete Comment</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.actionSheetButton, styles.actionSheetCancelButton, { backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.divider }]}
							onPress={() => setActionSheetVisible(false)}
						>
							<Text style={[styles.actionSheetCancelText, { color: T.textMuted }]}>Cancel</Text>
						</TouchableOpacity>
					</View>
				</TouchableOpacity>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#000',
		// Clip any overflow from the native Video wrapper so its black
		// background can never bleed outside the item bounds.
		overflow: 'hidden',
	},
	videoContainer: {
		// Centered video area — accounts for overlapping UI:
		// top: category pills + status bar (~8%)
		// bottom: nav bar + safe area (~8%)
		// Equal padding creates a visually centered video.
		position: 'absolute',
		top: '6%',
		left: 0,
		right: 0,
		bottom: '6%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	videoPlayer: {
		width: '100%',
		height: '100%',
		backgroundColor: 'transparent',
	},
	topGradient: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: 120,
		zIndex: 1,
	},
	bottomGradient: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: 220,
		zIndex: 1,
	},
	heartOverlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	hudOverlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 5,
		backgroundColor: 'rgba(0,0,0,0.1)',
	},
	loadingOverlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 4,
		backgroundColor: 'rgba(0,0,0,0.35)',
	},
	rightOverlay: {
		position: 'absolute',
		right: 12,
		bottom: 100,
		alignItems: 'center',
		zIndex: 2,
	},
	avatarContainer: {
		position: 'relative',
		marginBottom: 20,
	},
	avatar: {
		width: 46,
		height: 46,
		borderRadius: 23,
		borderWidth: 2,
		borderColor: '#FFF',
	},
	followButton: {
		position: 'absolute',
		bottom: -6,
		right: -4,
		backgroundColor: '#FFF',
		borderRadius: 9,
		width: 18,
		height: 18,
		justifyContent: 'center',
		alignItems: 'center',
	},
	actionButton: {
		alignItems: 'center',
		marginBottom: 18,
	},
	actionText: {
		color: '#FFF',
		fontSize: 12,
		marginTop: 4,
		fontWeight: '600',
		textShadowColor: 'rgba(0, 0, 0, 0.75)',
		textShadowOffset: { width: -1, height: 1 },
		textShadowRadius: 10,
	},
	bottomInfo: {
		position: 'absolute',
		left: 16,
		right: 76,
		bottom: 90,
		zIndex: 2,
	},
	authorName: {
		color: '#FFF',
		fontSize: 16,
		fontWeight: '700',
		textShadowColor: 'rgba(0, 0, 0, 0.75)',
		textShadowOffset: { width: -1, height: 1 },
		textShadowRadius: 10,
		marginBottom: 6,
	},
	caption: {
		color: '#FFF',
		fontSize: 14,
		textShadowColor: 'rgba(0, 0, 0, 0.75)',
		textShadowOffset: { width: -1, height: 1 },
		textShadowRadius: 10,
		lineHeight: 18,
		marginBottom: 10,
	},
	musicTag: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.4)',
		alignSelf: 'flex-start',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	musicIcon: {
		marginRight: 6,
	},
	musicText: {
		color: '#FFF',
		fontSize: 12,
	},
	sheetBackdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0,0,0,0.6)',
		zIndex: 999,
	},
	sheetContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		height: '100%',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.08)',
		overflow: 'hidden',
		zIndex: 1000,
	},
	commentsOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.6)',
		justifyContent: 'flex-end',
	},
	commentsCloseArea: {
		flex: 1,
	},
	commentsContainer: {
		backgroundColor: '#1C1C1E',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		maxHeight: '75%',
		paddingBottom: Platform.OS === 'ios' ? 24 : 12,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.08)',
	},
	commentsHeader: {
		alignItems: 'center',
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255,255,255,0.08)',
	},
	commentsHeaderIndicator: {
		width: 40,
		height: 4,
		backgroundColor: 'rgba(255,255,255,0.2)',
		borderRadius: 2,
		marginBottom: 8,
	},
	commentsHeaderTitleRow: {
		flexDirection: 'row',
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 16,
		position: 'relative',
	},
	commentsTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFF',
		textAlign: 'center',
	},
	commentsCloseBtn: {
		position: 'absolute',
		right: 16,
		padding: 4,
	},
	centerSpinner: {
		height: 250,
		justifyContent: 'center',
		alignItems: 'center',
	},
	commentList: {
		paddingHorizontal: 16,
		paddingTop: 16,
	},
	commentRowContainer: {
		marginBottom: 16,
	},
	commentItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		borderRadius: 12,
		paddingHorizontal: 6,
		paddingVertical: 4,
	},
	commentAvatar: {
		width: 38,
		height: 38,
		borderRadius: 19,
		marginRight: 12,
	},
	commentTextContainer: {
		flex: 1,
		paddingRight: 10,
	},
	commentAuthorHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 4,
	},
	commentAuthor: {
		fontSize: 13,
		fontWeight: '600',
		color: '#FFF',
	},
	commentTime: {
		fontSize: 11,
		color: '#8A8A8E',
		marginLeft: 8,
	},
	commentText: {
		fontSize: 14,
		color: '#FFF',
		lineHeight: 18,
	},
	commentActionsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 6,
	},
	commentActionButton: {
		marginRight: 16,
		paddingVertical: 2,
	},
	commentActionText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#8A8A8E',
	},
	likeIconContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: 30,
		marginTop: 4,
	},
	commentLikeCount: {
		color: '#8A8A8E',
		fontSize: 11,
		marginTop: 2,
	},
	repliesWrapper: {
		paddingLeft: 50,
		marginTop: 10,
	},
	viewRepliesButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 6,
	},
	viewRepliesLine: {
		width: 24,
		height: 1,
		backgroundColor: '#8A8A8E',
		marginRight: 12,
	},
	viewRepliesText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#8A8A8E',
	},
	repliesList: {
		marginTop: 8,
	},
	replyItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: 12,
		borderRadius: 10,
		paddingHorizontal: 6,
		paddingVertical: 4,
	},
	highlightedItemBase: {
		borderWidth: 1,
		borderColor: 'rgba(109,174,63,0.45)',
	},
	replyAvatar: {
		width: 24,
		height: 24,
		borderRadius: 12,
		marginRight: 10,
	},
	replyLikeCount: {
		color: '#8A8A8E',
		fontSize: 9,
		marginTop: 2,
	},
	emojiBar: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255,255,255,0.08)',
		backgroundColor: '#1C1C1E',
	},
	emojiText: {
		fontSize: 22,
	},
	inputBanner: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: '#2C2C2E',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255,255,255,0.05)',
	},
	inputBannerText: {
		color: '#8A8A8E',
		fontSize: 12,
	},
	commentInputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderTopWidth: 1,
		borderTopColor: 'rgba(255,255,255,0.08)',
		paddingHorizontal: 16,
		paddingTop: 10,
		backgroundColor: '#1C1C1E',
	},
	inputAvatar: {
		width: 34,
		height: 34,
		borderRadius: 17,
		marginRight: 12,
	},
	commentInputContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#2C2C2E',
		borderRadius: 20,
		paddingHorizontal: 12,
		minHeight: 40,
		maxHeight: 100,
	},
	commentInput: {
		flex: 1,
		color: '#FFF',
		fontSize: 14,
		paddingVertical: 8,
		marginRight: 8,
	},
	inputIconButton: {
		padding: 4,
		marginRight: 6,
	},
	gifButton: {
		borderWidth: 1.5,
		borderColor: '#FFF',
		borderRadius: 4,
		paddingHorizontal: 4,
		paddingVertical: 1,
		marginRight: 4,
	},
	gifButtonText: {
		color: '#FFF',
		fontSize: 9,
		fontWeight: '800',
	},
	postButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	giftButtonIcon: {
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	emptyComments: {
		textAlign: 'center',
		color: '#8A8A8E',
		marginTop: 40,
		fontSize: 14,
	},
	toastContainer: {
		position: 'absolute',
		top: 10,
		left: 20,
		right: 20,
		backgroundColor: 'rgba(255, 45, 85, 0.9)',
		borderRadius: 8,
		paddingVertical: 8,
		paddingHorizontal: 16,
		alignItems: 'center',
		zIndex: 9999,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
	},
	toastText: {
		color: '#FFF',
		fontSize: 13,
		fontWeight: '600',
	},
	actionSheetOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'flex-end',
	},
	actionSheetContainer: {
		backgroundColor: '#2C2C2E',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingTop: 8,
		paddingBottom: Platform.OS === 'ios' ? 24 : 12,
	},
	actionSheetHeaderIndicator: {
		width: 40,
		height: 4,
		backgroundColor: 'rgba(255,255,255,0.15)',
		borderRadius: 2,
		alignSelf: 'center',
		marginBottom: 16,
	},
	actionSheetButton: {
		paddingVertical: 16,
		alignItems: 'center',
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(255,255,255,0.06)',
	},
	actionSheetButtonText: {
		color: '#FFF',
		fontSize: 16,
		fontWeight: '600',
	},
	actionSheetDeleteButton: {
		borderBottomWidth: 0,
	},
	actionSheetDeleteText: {
		color: '#FF2D55',
	},
	actionSheetCancelButton: {
		backgroundColor: '#1C1C1E',
		marginTop: 8,
		borderBottomWidth: 0,
	},
	actionSheetCancelText: {
		color: '#8A8A8E',
		fontSize: 16,
		fontWeight: '600',
	},
	authorRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	authorAvatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		marginRight: 8,
		borderWidth: 1.5,
		borderColor: '#FFF',
	},
	metaRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 6,
	},
	userTag: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.5)',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		marginLeft: 8,
	},
	userIcon: {
		marginRight: 4,
	},
	userText: {
		color: '#FFF',
		fontSize: 12,
		fontWeight: '600',
	},
	plusButtonCircle: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 1.5,
		borderColor: '#FFF',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 12,
		backgroundColor: 'rgba(0,0,0,0.4)',
	},
});

/**
 * Exported as a memoized component. The custom comparator prevents
 * re-renders triggered by parent state changes (share modal, category
 * filter, etc.) that don't affect this item's output.
 */
export const ReelPlayerItem = memo(ReelPlayerItemComponent, arePropsEqual);
