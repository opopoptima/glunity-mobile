import React from 'react';
import { Image, ImageProps } from 'react-native';

// Lightweight wrapper that uses `expo-image` when available, otherwise falls back to RN `Image`.
let ExpoImage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('expo-image');
  ExpoImage = mod && (mod.Image || mod.default || mod.ExpoImage) ? (mod.Image || mod.default || mod.ExpoImage) : null;
} catch (e) {
  ExpoImage = null;
}

type FastImageProps = {
  source: any;
  style?: any;
  contentFit?: any;
  transition?: number;
  cachePolicy?: any;
  priority?: any;
  onLoad?: () => void;
  onError?: (e: any) => void;
} & Partial<ImageProps>;

export default function FastImage(props: FastImageProps) {
  const { source, style, contentFit, transition, cachePolicy, priority, onLoad, onError } = props;

  // Normalize source and guard against empty uri which causes RN warning: "source.uri should not be an empty string"
  function normalize(s: any) {
    if (!s) return null;
    // local asset (number) is fine
    if (typeof s === 'number') return s;
    // arrays: pick first
    if (Array.isArray(s) && s.length > 0) return normalize(s[0]);
    if (typeof s === 'object') {
      if ('uri' in s) {
        const u = s.uri;
        if (!u) return null;
        if (typeof u === 'string' && u.trim().length === 0) return null;
        return { uri: u };
      }
      return s;
    }
    return null;
  }

  const src = normalize(source);
  if (!src) return null;

  if (ExpoImage) {
    // If the uri is a data URI, use React Native Image which reliably handles data URIs.
    const uri = typeof src === 'object' && src.uri ? String(src.uri) : '';
    if (uri && uri.startsWith('data:')) {
      return <Image source={src} style={style} onLoad={onLoad} onError={onError} />;
    }

    // @ts-ignore - forward props to expo-image
    return (
      // @ts-ignore
      <ExpoImage
        source={src}
        style={style}
        contentFit={contentFit}
        transition={transition}
        cachePolicy={cachePolicy}
        priority={priority}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  return <Image source={src} style={style} onLoad={onLoad} onError={onError} />;
}
