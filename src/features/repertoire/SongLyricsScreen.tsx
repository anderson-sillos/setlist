import { Link, useFocusEffect } from 'expo-router';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  ErrorFeedback,
  LoadingFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import {
  getListRefreshControl,
  WebRefreshButton,
} from '@/components/ui/ScreenDataRefresh';
import { useSong } from '@/data/queries';
import type { EntityId, LyricDocument } from '@/domain';
import { getSongHref } from '@/features/navigation/routes';
import type { LyricLineBounds } from '@/features/repertoire/lyricAutoScroll';
import {
  getCenteredLyricScrollOffset,
  getLyricFollowTargetGroup,
  getLyricGroupBounds,
  getLyricScrollBehavior,
  getLyricsEdgeSpacer,
} from '@/features/repertoire/lyricAutoScroll';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import {
  getActiveTimedLyricGroup,
  type TimedLyricsProjection,
} from '@/features/repertoire/timedLyrics';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { blurWebFocus } from '@/utils/focus';
import { SongLyricsContent } from './SongLyricsContent';
import { TimedLyricsControls } from './TimedLyricsControls';
import { useTimedLyricsSession } from './useTimedLyricsSession';

interface SongLyricsScreenProps {
  readonly bandId: EntityId;
  readonly songId: EntityId;
}

const EMPTY_LINE_BOUNDS: ReadonlyMap<string, LyricLineBounds> = new Map();
const FOLLOW_LAYOUT_SETTLE_MS = 80;

function getWebScrollNode(scrollView: ScrollView | null): HTMLElement | null {
  if (typeof HTMLElement === 'undefined' || scrollView === null) {
    return null;
  }

  const candidate = scrollView as unknown as {
    getScrollableNode?: () => unknown;
  };
  const node = candidate.getScrollableNode?.() ?? scrollView;
  return node instanceof HTMLElement ? node : null;
}

function getWebContentTop(
  scrollView: ScrollView | null,
  target: unknown,
): number | null {
  const scrollNode = getWebScrollNode(scrollView);
  if (
    !scrollNode ||
    typeof HTMLElement === 'undefined' ||
    !(target instanceof HTMLElement)
  ) {
    return null;
  }

  const targetTop = target.getBoundingClientRect().top;
  const scrollTop = scrollNode.getBoundingClientRect().top;
  const contentTop =
    targetTop - scrollTop - scrollNode.clientTop + scrollNode.scrollTop;

  return Number.isFinite(contentTop) ? contentTop : null;
}

export function SongLyricsScreen(props: SongLyricsScreenProps) {
  return (
    <SongLyricsScreenSession
      key={`${props.bandId}:${props.songId}`}
      {...props}
    />
  );
}

function SongLyricsScreenSession({ bandId, songId }: SongLyricsScreenProps) {
  const insets = useSafeAreaInsets();
  const footerBottomInset = insets.bottom;
  const songQuery = useSong(bandId, songId);
  const { onRefresh, refreshing } = useScreenDataRefresh([songQuery]);
  const [retainedSong, setRetainedSong] = useState(songQuery.data);
  if (songQuery.data !== undefined && retainedSong !== songQuery.data) {
    setRetainedSong(songQuery.data);
  } else if (songQuery.isError && retainedSong !== undefined) {
    setRetainedSong(undefined);
  }
  const song =
    songQuery.data !== undefined
      ? songQuery.data
      : songQuery.isPending
        ? retainedSong
        : undefined;
  const showInitialLoading = songQuery.isPending && !retainedSong;
  const timedLyrics = useTimedLyricsSession(song);
  const resetTimer = timedLyrics.reset;
  const reducedMotion = useReducedMotionPreference();
  const [scrubPreview, setScrubPreview] = useState<{
    readonly positionMs: number;
    readonly projection: TimedLyricsProjection;
  } | null>(null);
  const routeFocusedRef = useRef(true);
  const [followMode, setFollowMode] = useState<'automatic' | 'manual'>(
    'automatic',
  );
  const [viewportHeight, setViewportHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const usableViewportHeight = Math.max(
    0,
    viewportHeight - footerHeight - footerBottomInset,
  );
  const [measuredLineBounds, setMeasuredLineBounds] = useState<{
    readonly bounds: ReadonlyMap<string, LyricLineBounds>;
    readonly document: LyricDocument | undefined;
  }>(() => ({ bounds: new Map(), document: song?.lyrics }));
  const lineBoundsById =
    measuredLineBounds.document === song?.lyrics
      ? measuredLineBounds.bounds
      : EMPTY_LINE_BOUNDS;
  const scrollViewRef = useRef<ScrollView>(null);
  const followModeRef = useRef(followMode);
  const scrollOffsetRef = useRef(0);
  const lyricsTopRef = useRef(0);
  const documentTopRef = useRef(0);
  const measurementDocumentRef = useRef(song?.lyrics);
  const blockTopsRef = useRef(new Map<string, number>());
  const localLineBoundsRef = useRef(
    new Map<string, { blockId: string; height: number; top: number }>(),
  );
  const scheduledFollowRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectiveScrubPreviewMs =
    timedLyrics.isEligible &&
    scrubPreview?.projection === timedLyrics.projection
      ? scrubPreview.positionMs
      : null;
  const activeGroup = useMemo(
    () =>
      timedLyrics.isEligible
        ? getActiveTimedLyricGroup(
            timedLyrics.projection?.groups ?? [],
            effectiveScrubPreviewMs ?? timedLyrics.elapsedMs,
            timedLyrics.durationMs,
          )
        : null,
    [
      effectiveScrubPreviewMs,
      timedLyrics.durationMs,
      timedLyrics.elapsedMs,
      timedLyrics.isEligible,
      timedLyrics.projection,
    ],
  );
  const activeLineIds = useMemo(
    () => new Set(activeGroup?.lines.map(({ id }) => id) ?? []),
    [activeGroup],
  );

  const followTargetGroup = useMemo(
    () =>
      timedLyrics.isEligible
        ? getLyricFollowTargetGroup(
            timedLyrics.projection?.groups ?? [],
            effectiveScrubPreviewMs ?? timedLyrics.elapsedMs,
            timedLyrics.durationMs,
          )
        : null,
    [
      effectiveScrubPreviewMs,
      timedLyrics.durationMs,
      timedLyrics.elapsedMs,
      timedLyrics.isEligible,
      timedLyrics.projection,
    ],
  );
  const followTargetBounds = useMemo(
    () =>
      followTargetGroup
        ? getLyricGroupBounds(followTargetGroup, lineBoundsById)
        : null,
    [followTargetGroup, lineBoundsById],
  );

  const recalculateLineBounds = useCallback(() => {
    const next = new Map<string, LyricLineBounds>();
    for (const [lineId, line] of localLineBoundsRef.current) {
      let top = line.top;
      if (Platform.OS !== 'web') {
        const blockTop = blockTopsRef.current.get(line.blockId);
        if (blockTop === undefined) {
          continue;
        }
        top += lyricsTopRef.current + documentTopRef.current + blockTop;
      }
      next.set(lineId, {
        height: line.height,
        top,
      });
    }

    const document = measurementDocumentRef.current;
    setMeasuredLineBounds((current) => {
      if (current.document === document && current.bounds.size === next.size) {
        let unchanged = true;
        for (const [lineId, bounds] of next) {
          const previous = current.bounds.get(lineId);
          if (
            !previous ||
            Math.abs(previous.top - bounds.top) > 0.5 ||
            Math.abs(previous.height - bounds.height) > 0.5
          ) {
            unchanged = false;
            break;
          }
        }
        if (unchanged) {
          return current;
        }
      }
      return { bounds: next, document };
    });
  }, []);

  const reportLyricsTop = useCallback(
    (event: LayoutChangeEvent) => {
      const top = event.nativeEvent.layout.y;
      if (Math.abs(lyricsTopRef.current - top) <= 0.5) {
        return;
      }
      lyricsTopRef.current = top;
      recalculateLineBounds();
    },
    [recalculateLineBounds],
  );

  const reportDocumentTop = useCallback(
    (top: number) => {
      if (Math.abs(documentTopRef.current - top) <= 0.5) {
        return;
      }
      documentTopRef.current = top;
      recalculateLineBounds();
    },
    [recalculateLineBounds],
  );

  const reportBlockTop = useCallback(
    (blockId: string, top: number) => {
      const previous = blockTopsRef.current.get(blockId);
      if (previous !== undefined && Math.abs(previous - top) <= 0.5) {
        return;
      }
      blockTopsRef.current.set(blockId, top);
      recalculateLineBounds();
    },
    [recalculateLineBounds],
  );

  const reportLineBounds = useCallback(
    (
      lineId: string,
      blockId: string,
      top: number,
      height: number,
      target?: unknown,
    ) => {
      const contentTop =
        Platform.OS === 'web'
          ? getWebContentTop(scrollViewRef.current, target)
          : top;
      if (contentTop === null) {
        return;
      }

      const previous = localLineBoundsRef.current.get(lineId);
      if (
        previous?.blockId === blockId &&
        Math.abs(previous.top - contentTop) <= 0.5 &&
        Math.abs(previous.height - height) <= 0.5
      ) {
        return;
      }
      localLineBoundsRef.current.set(lineId, {
        blockId,
        height,
        top: contentTop,
      });
      recalculateLineBounds();
    },
    [recalculateLineBounds],
  );

  useLayoutEffect(() => {
    measurementDocumentRef.current = song?.lyrics;
    lyricsTopRef.current = 0;
    documentTopRef.current = 0;
    blockTopsRef.current.clear();
    localLineBoundsRef.current.clear();
  }, [song?.lyrics]);

  const stopScheduledFollow = useCallback(() => {
    if (scheduledFollowRef.current !== null) {
      clearTimeout(scheduledFollowRef.current);
      scheduledFollowRef.current = null;
    }
  }, []);

  const pauseAutoFollow = useCallback(() => {
    stopScheduledFollow();
    if (
      !routeFocusedRef.current ||
      !timedLyrics.isEligible ||
      followModeRef.current === 'manual'
    ) {
      return;
    }
    followModeRef.current = 'manual';
    setFollowMode('manual');

    if (Platform.OS === 'web') {
      const node = getWebScrollNode(scrollViewRef.current);
      // React Native Web replaces HTMLElement.scrollTo with its own API,
      // which accepts { y, animated }, not the browser's { top, behavior }.
      scrollViewRef.current?.scrollTo({
        animated: false,
        y: node?.scrollTop ?? scrollOffsetRef.current,
      });
    } else {
      scrollViewRef.current?.scrollTo({
        animated: false,
        y: scrollOffsetRef.current,
      });
    }
  }, [stopScheduledFollow, timedLyrics.isEligible]);

  const resumeAutoFollow = useCallback(() => {
    followModeRef.current = 'automatic';
    setFollowMode('automatic');
  }, []);

  useFocusEffect(
    useCallback(() => {
      routeFocusedRef.current = true;

      return () => {
        routeFocusedRef.current = false;
        followModeRef.current = 'automatic';
        stopScheduledFollow();
        // Leaving this route ends the local timer and resets its view state.
        setFollowMode('automatic');
        setScrubPreview(null);
        resetTimer();
      };
    }, [resetTimer, stopScheduledFollow]),
  );

  useEffect(() => {
    if (!timedLyrics.isEligible || Platform.OS !== 'web') {
      return;
    }

    const node = getWebScrollNode(scrollViewRef.current);
    if (!node) {
      return;
    }

    const onWheel = () => pauseAutoFollow();
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        [
          'ArrowDown',
          'ArrowUp',
          'PageDown',
          'PageUp',
          'Home',
          'End',
          ' ',
        ].includes(event.key)
      ) {
        pauseAutoFollow();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const bounds = node.getBoundingClientRect();
      if (event.target === node && event.clientX >= bounds.right - 16) {
        pauseAutoFollow();
      }
    };
    const onTouchMove = (event: TouchEvent) => {
      if (event.changedTouches.length > 0) {
        pauseAutoFollow();
      }
    };

    node.addEventListener('wheel', onWheel, { passive: true });
    node.addEventListener('keydown', onKeyDown);
    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      node.removeEventListener('wheel', onWheel);
      node.removeEventListener('keydown', onKeyDown);
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('touchmove', onTouchMove);
    };
  }, [pauseAutoFollow, timedLyrics.isEligible]);

  useEffect(() => {
    if (
      !timedLyrics.isEligible ||
      !routeFocusedRef.current ||
      followMode !== 'automatic' ||
      followTargetBounds === null ||
      usableViewportHeight <= 0
    ) {
      return;
    }

    stopScheduledFollow();
    scheduledFollowRef.current = setTimeout(() => {
      scheduledFollowRef.current = null;
      const y = getCenteredLyricScrollOffset(
        followTargetBounds,
        usableViewportHeight,
      );
      if (y !== null) {
        const scrollBehavior = getLyricScrollBehavior(reducedMotion);
        scrollViewRef.current?.scrollTo({
          animated: scrollBehavior === 'smooth',
          y,
        });
      }
    }, FOLLOW_LAYOUT_SETTLE_MS);

    return stopScheduledFollow;
  }, [
    followMode,
    followTargetBounds,
    reducedMotion,
    stopScheduledFollow,
    timedLyrics.isEligible,
    usableViewportHeight,
  ]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.safeArea}
      testID="song-lyrics-screen"
    >
      <View style={styles.header}>
        <Link
          dismissTo
          href={getSongHref(bandId, songId)}
          onPress={blurWebFocus}
          asChild
        >
          <Pressable
            accessibilityLabel="Voltar para detalhes da música"
            accessibilityRole="link"
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon color={colors.text.primary} name="back" />
          </Pressable>
        </Link>
        <View style={styles.headerCopy}>
          <AppText
            accessibilityRole="header"
            style={styles.title}
            tone="inverse"
            variant="heading"
          >
            {song?.title ?? 'Carregando música…'}
          </AppText>
          {song?.originalArtist ? (
            <AppText tone="muted" variant="caption">
              {song.originalArtist}
            </AppText>
          ) : null}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
        onScroll={(event) => {
          scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        onScrollBeginDrag={pauseAutoFollow}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={getListRefreshControl({ onRefresh, refreshing })}
        scrollEventThrottle={16}
        testID="lyrics-scroll-view"
      >
        <WebRefreshButton onRefresh={onRefresh} refreshing={refreshing} />
        {showInitialLoading ? <LoadingFeedback /> : null}
        {songQuery.isError ? (
          <ErrorFeedback
            onRetry={() => {
              void songQuery.refetch();
            }}
            title="Letra indisponível"
          />
        ) : null}
        {!songQuery.isPending && !songQuery.isError && !song ? (
          <UnavailableFeedback title="Música indisponível" />
        ) : null}
        {song ? (
          <View
            onLayout={reportLyricsTop}
            style={styles.lyrics}
            testID={timedLyrics.isEligible ? 'timed-lyrics-session' : undefined}
          >
            {timedLyrics.isEligible ? (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[
                  styles.edgeSpacer,
                  { height: getLyricsEdgeSpacer(usableViewportHeight) },
                ]}
              />
            ) : null}
            <SongLyricsContent
              activeLineIds={timedLyrics.isEligible ? activeLineIds : undefined}
              lyrics={song.lyrics}
              onBlockLayout={
                timedLyrics.isEligible ? reportBlockTop : undefined
              }
              onDocumentLayout={
                timedLyrics.isEligible ? reportDocumentTop : undefined
              }
              onLineLayout={
                timedLyrics.isEligible ? reportLineBounds : undefined
              }
              onTimedLinePress={
                timedLyrics.isEligible
                  ? (positionMs) => {
                      setScrubPreview(null);
                      resumeAutoFollow();
                      timedLyrics.seekTo(positionMs);
                    }
                  : undefined
              }
              variant="fullscreen"
            />
            {timedLyrics.isEligible ? (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[
                  styles.edgeSpacer,
                  {
                    height:
                      getLyricsEdgeSpacer(usableViewportHeight) +
                      footerHeight +
                      footerBottomInset,
                  },
                ]}
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      {timedLyrics.isEligible ? (
        <View
          onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
          style={[
            styles.footer,
            { bottom: footerBottomInset, pointerEvents: 'box-none' },
          ]}
          testID="timed-lyrics-footer"
        >
          <TimedLyricsControls
            durationMs={timedLyrics.durationMs}
            elapsedMs={timedLyrics.elapsedMs}
            onResumeFollow={resumeAutoFollow}
            onReset={() => {
              resumeAutoFollow();
              timedLyrics.reset();
            }}
            showResumeFollow={followMode === 'manual'}
            onCancelScrub={() => setScrubPreview(null)}
            onCommitPosition={(positionMs) => {
              setScrubPreview(null);
              resumeAutoFollow();
              timedLyrics.seekTo(positionMs);
            }}
            onPause={timedLyrics.pause}
            onPreviewPositionChange={(positionMs) => {
              setScrubPreview(
                positionMs === null || !timedLyrics.projection
                  ? null
                  : {
                      positionMs,
                      projection: timedLyrics.projection,
                    },
              );
            }}
            onSeekBy={(deltaMs) => {
              resumeAutoFollow();
              timedLyrics.seekBy(deltaMs);
            }}
            onStart={timedLyrics.start}
            previewPositionMs={effectiveScrubPreviewMs}
            status={timedLyrics.status}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background.canvas,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.background.raised,
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text.primary,
  },
  content: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: spacing.xl,
    maxWidth: layout.contentMaxWidth,
    padding: spacing.xl,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  lyrics: {
    alignSelf: 'center',
    maxWidth: 840,
    paddingBottom: spacing.xxxl,
    width: '100%',
  },
  edgeSpacer: {
    flexShrink: 0,
  },
  footer: {
    backgroundColor: colors.background.lyricsFooter,
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
