import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { MapLocation } from '../../domain/location.types';

export interface MapWebViewHandle {
  flyTo(lng: number, lat: number, zoom?: number): void;
}

interface MapWebViewProps {
  locations: MapLocation[];
  initialCenter?: { lng: number; lat: number };
  initialZoom?: number;
  onSelectLocation?: (id: string) => void;
}

const DEFAULT_LNG = 10.181667;
const DEFAULT_LAT = 36.806389;

function buildHtml(lng: number, lat: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
html,body,#map{margin:0;padding:0;height:100%;width:100%;background:#f6f5f3}
.gp{width:34px;height:42px;transform:translate(-50%,-100%)}
.gp .h{width:34px;height:34px;border-radius:50%;background:#8BC34A;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 8px rgba(0,0,0,.2);border:3px solid #fff}
.gp .h svg{width:16px;height:16px}
.gp .t{width:0;height:0;position:absolute;left:50%;bottom:0;transform:translate(-50%,6px);border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid #8BC34A}
.gp.w .h{background:#E53935}.gp.w .t{border-top-color:#E53935}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${lat},${lng}],14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
var ml=L.layerGroup().addTo(map);
function ico(){return'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.8 2c1 5 .5 10.5-5 15a7 7 0 0 1-3.8 3z"/></svg>';}
function send(t,p){var m=JSON.stringify({type:t,payload:p});if(window.ReactNativeWebView&&window.ReactNativeWebView.postMessage){window.ReactNativeWebView.postMessage(m);}else if(window.parent!==window){window.parent.postMessage(m,'*');}}
function render(items){ml.clearLayers();if(!items||!items.length)return;items.forEach(function(loc){var cl='gp'+(loc.contaminationWarning?' w':'');var h='<div class="'+cl+'"><div class="h">'+ico()+'</div><div class="t"></div></div>';var icon=L.divIcon({html:h,className:'',iconSize:[34,42],iconAnchor:[17,42]});var m=L.marker([loc.lat,loc.lng],{icon:icon});m.on('click',function(){send('select',{id:loc.id});});ml.addLayer(m);});}
window.addEventListener('message',function(e){try{var d=typeof e.data==='string'?JSON.parse(e.data):e.data;if(!d)return;if(d.type==='setLocations')render(d.payload||[]);if(d.type==='flyTo')map.flyTo([d.payload.lat,d.payload.lng],d.payload.zoom||16,{duration:0.6});}catch(err){}});
document.addEventListener('message',function(e){window.dispatchEvent(new MessageEvent('message',{data:e.data}));});
setTimeout(function(){send('ready',{});},300);
</script>
</body>
</html>`;
}

// ── Web (iframe + srcDoc — same-origin, no blob) ──────────────────────────────
const WebMapView = forwardRef<MapWebViewHandle, MapWebViewProps>(function WebMapView(
  { locations, initialCenter, initialZoom, onSelectLocation },
  ref,
) {
  const lng = initialCenter?.lng ?? DEFAULT_LNG;
  const lat = initialCenter?.lat ?? DEFAULT_LAT;
  const html = useMemo(() => buildHtml(lng, lat), [lng, lat]);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const readyRef  = useRef(false);
  const locRef    = useRef<MapLocation[]>([]);
  locRef.current  = locations;

  function postMsg(msg: object) {
    try { iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), '*'); } catch {}
  }

  useImperativeHandle(ref, () => ({
    flyTo(lng, lat, zoom = 16) { postMsg({ type: 'flyTo', payload: { lng, lat, zoom } }); },
  }));

  // Push updated locations into an already-ready map
  React.useEffect(() => {
    if (readyRef.current) postMsg({ type: 'setLocations', payload: locations });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  // Listen for messages from the iframe
  React.useEffect(() => {
    function handler(e: MessageEvent) {
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!d) return;
        if (d.type === 'select') onSelectLocation?.(d.payload?.id);
        if (d.type === 'ready') {
          readyRef.current = true;
          postMsg({ type: 'setLocations', payload: locRef.current });
          if (initialCenter) {
            postMsg({ type: 'flyTo', payload: { lng: initialCenter.lng, lat: initialCenter.lat, zoom: initialZoom ?? 14 } });
          }
        }
      } catch {}
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSelectLocation]);

  return (
    <View style={styles.root}>
      {/* @ts-ignore */}
      <iframe ref={iframeRef} srcDoc={html}
        style={{ flex: 1, width: '100%', height: '100%', border: 'none', background: '#F6F5F3' }}
        title="GlUnity Map" allow="geolocation"
      />
    </View>
  );
});

// ── Native (react-native-webview, lazy-required so web build never imports it) ─
let NativeMapView: typeof WebMapView | null = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { WebView } = require('react-native-webview');

  NativeMapView = forwardRef<MapWebViewHandle, MapWebViewProps>(function NativeMapView(
    { locations, initialCenter, initialZoom, onSelectLocation },
    ref,
  ) {
    const lng = initialCenter?.lng ?? DEFAULT_LNG;
    const lat = initialCenter?.lat ?? DEFAULT_LAT;
    const html = useMemo(() => buildHtml(lng, lat), [lng, lat]);
    const webRef = useRef<any>(null);
    const readyRef = useRef(false);
    const locRef = useRef<MapLocation[]>([]);
    locRef.current = locations;

    function inject(msg: object) {
      const s = JSON.stringify(msg);
      webRef.current?.injectJavaScript(
        `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(s)}}));true;`
      );
    }

    useImperativeHandle(ref, () => ({
      flyTo(lng, lat, zoom = 16) { inject({ type: 'flyTo', payload: { lng, lat, zoom } }); },
    }));

    React.useEffect(() => {
      if (readyRef.current) inject({ type: 'setLocations', payload: locations });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locations]);

    function onMessage(e: any) {
      try {
        const d = JSON.parse(e.nativeEvent.data);
        if (d.type === 'select') onSelectLocation?.(d.payload?.id);
        if (d.type === 'ready') {
          readyRef.current = true;
          inject({ type: 'setLocations', payload: locRef.current });
        }
      } catch {}
    }

    return (
      <View style={styles.root}>
        <WebView ref={webRef} originWhitelist={['*']} source={{ html }}
          onMessage={onMessage} javaScriptEnabled domStorageEnabled
          style={styles.web} scrollEnabled={false}
          overScrollMode={Platform.OS === 'android' ? 'never' : undefined}
        />
      </View>
    );
  });
}

export const MapWebView = Platform.OS === 'web'
  ? WebMapView
  : (NativeMapView as typeof WebMapView);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6F5F3' },
  web:  { flex: 1, backgroundColor: '#F6F5F3' },
});
