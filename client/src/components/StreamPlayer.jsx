import { useEffect, useRef } from "react";
import dashjs from "dashjs";
import Hls from "hls.js";
import { API_BASE } from "../api";
import {
  buildLicenseProxyUrl,
  buildPlayUrl,
  isDrmServer,
  isPlayBlocked,
  parseStreamUrl,
} from "../streams";

export default function StreamPlayer({ source, onFatalError, className = "" }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const dashRef = useRef(null);

  useEffect(() => {
    if (!source?.url) return;
    const video = videoRef.current;
    if (!video) return;

    const token = localStorage.getItem("wc_token") || "";
    const src = buildPlayUrl(source, API_BASE, token);
    const drm = isDrmServer(source);
    const { drmScheme, drmLicense } = parseStreamUrl(source);

    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (dashRef.current) {
        dashRef.current.reset();
        dashRef.current = null;
      }
    };

    cleanup();

    let cancelled = false;

    async function start() {
      // IP-locked CDN (sla.homes auth_key, etc.) — skip network call, failover immediately.
      if (isPlayBlocked(source)) {
        if (!cancelled) onFatalError?.();
        return;
      }

      // Preflight only RapidAPI proxy streams (stale sign / 403). IPTV plays direct — no preflight (CORS).
      const viaProxy = src.includes("/stream/proxy");
      if (viaProxy) {
        try {
          const check = await fetch(src, { method: "GET", signal: AbortSignal.timeout(8000) });
          if (!check.ok) {
            if (!cancelled) onFatalError?.();
            return;
          }
        } catch {
          if (!cancelled) onFatalError?.();
          return;
        }
      }

      if (cancelled) return;

      if (drm && dashjs.supportsMediaSource()) {
        const player = dashjs.MediaPlayer().create();
        dashRef.current = player;

        player.updateSettings({
          streaming: {
            abr: { autoSwitchBitrate: { video: true } },
            retryAttempts: { MPD: 2, MediaSegment: 3 },
          },
        });

        if (drmScheme === "clearkey" && drmLicense) {
          const protection = { "org.w3.clearkey": {} };
          if (/^https?:\/\//i.test(drmLicense)) {
            protection["org.w3.clearkey"].serverURL = buildLicenseProxyUrl(
              drmLicense,
              source,
              API_BASE,
              token
            );
          } else {
            try {
              const parsed = JSON.parse(drmLicense);
              protection["org.w3.clearkey"].clearKeys = parsed.clearKeys || parsed;
            } catch {
              protection["org.w3.clearkey"].serverURL = drmLicense;
            }
          }
          player.setProtectionData(protection);
        }

        player.initialize(video, src, true);
        player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
          video.play().catch(() => {});
        });
        player.on(dashjs.MediaPlayer.events.ERROR, (e) => {
          if (e.error?.code) onFatalError?.();
        });
        return;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          xhrSetup: (xhr, url) => {
            if (!url.includes("/stream/proxy")) return;
            xhr.withCredentials = false;
          },
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) onFatalError?.();
        });
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.addEventListener("loadedmetadata", () => video.play().catch(() => {}), { once: true });
        video.addEventListener("error", () => onFatalError?.(), { once: true });
        return;
      }

      onFatalError?.("unsupported");
    }

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [source, onFatalError]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      className={className || "w-full h-full object-contain bg-black"}
    />
  );
}
