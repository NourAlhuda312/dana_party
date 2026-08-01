"use client";

import {
  useEffect,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";

interface MusicPlayerProps {
  src?: string;
}

export default function MusicPlayer({
  src
}: MusicPlayerProps) {
  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const [mounted, setMounted] =
    useState(false);

  const [playing, setPlaying] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [failed, setFailed] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !src) {
      return;
    }

    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    function handleLoadedMetadata(
      event: Event
    ) {
      const audio =
        event.currentTarget as HTMLAudioElement;

      setDuration(
        Number.isFinite(audio.duration)
          ? audio.duration
          : 0
      );

      setFailed(false);
      setLoading(false);
    }

    function handleCanPlay() {
      setLoading(false);
      setFailed(false);
    }

    function handleWaiting() {
      /*
       * لا نوقف playing هون.
       * الأغنية ما زالت بحالة تشغيل لكنها تنتظر تحميلًا.
       */
      setLoading(true);
    }

    function handleTimeUpdate(
      event: Event
    ) {
      const audio =
        event.currentTarget as HTMLAudioElement;

      setCurrentTime(audio.currentTime);
    }

    function handlePlay() {
      setPlaying(true);
      setLoading(false);
    }

    function handlePause() {
      setPlaying(false);
      setLoading(false);
    }

    function handleEnded() {
      setPlaying(false);
      setLoading(false);
      setCurrentTime(0);
    }

    function handleError() {
      setPlaying(false);
      setLoading(false);
      setFailed(true);
    }

    audioElement.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    audioElement.addEventListener(
      "canplay",
      handleCanPlay
    );

    audioElement.addEventListener(
      "waiting",
      handleWaiting
    );

    audioElement.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );

    audioElement.addEventListener(
      "play",
      handlePlay
    );

    audioElement.addEventListener(
      "pause",
      handlePause
    );

    audioElement.addEventListener(
      "ended",
      handleEnded
    );

    audioElement.addEventListener(
      "error",
      handleError
    );

    audioElement.load();

    return () => {
      audioElement.pause();

      audioElement.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

      audioElement.removeEventListener(
        "canplay",
        handleCanPlay
      );

      audioElement.removeEventListener(
        "waiting",
        handleWaiting
      );

      audioElement.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );

      audioElement.removeEventListener(
        "play",
        handlePlay
      );

      audioElement.removeEventListener(
        "pause",
        handlePause
      );

      audioElement.removeEventListener(
        "ended",
        handleEnded
      );

      audioElement.removeEventListener(
        "error",
        handleError
      );
    };
  }, [mounted, src]);

  if (!src || !mounted) {
    return null;
  }

  async function toggleMusic() {
    const audioElement =
      audioRef.current;

    if (!audioElement || failed) {
      return;
    }

    try {
      /*
       * لا نمنع الضغط أثناء loading.
       * المستخدم لازم يقدر يوقف الأغنية بأي لحظة.
       */
      if (audioElement.paused) {
        setLoading(true);
        await audioElement.play();
      } else {
        audioElement.pause();
        setLoading(false);
      }
    } catch (error) {
      console.error(
        "Could not play audio:",
        error
      );

      setPlaying(false);
      setLoading(false);
      setFailed(true);
    }
  }

  const safeDuration =
    Number.isFinite(duration) &&
    duration > 0
      ? duration
      : 0;

  const progress =
    safeDuration > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (currentTime /
              safeDuration) *
              100
          )
        )
      : 0;

  return createPortal(
    <aside
      className={[
        "floating-gramophone-player",
        playing ? "is-playing" : "",
        loading ? "is-loading" : "",
        failed ? "has-error" : ""
      ].join(" ")}
      aria-label="مشغل موسيقى البطاقة"
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        loop
      />

      <button
        className="gramophone-toggle-button"
        type="button"
        onClick={toggleMusic}
        disabled={failed}
        aria-pressed={playing}
        aria-busy={loading}
        aria-label={
          failed
            ? "الأغنية غير متوفرة"
            : playing
              ? "إيقاف موسيقى البطاقة"
              : "تشغيل موسيقى البطاقة"
        }
        title={
          playing
            ? "إيقاف الأغنية"
            : "تشغيل الأغنية"
        }
      >
        <span
          className="gramophone-button-frame"
          aria-hidden="true"
        >
          <GramophoneIcon />

          <span className="gramophone-action-icon">
            {playing
              ? "Ⅱ"
              : loading
                ? "✦"
                : "▶"}
          </span>
        </span>
      </button>

      <div
        className="gramophone-status-card"
        aria-live="polite"
      >
        <span className="gramophone-status-title">
          موسيقى البطاقة
        </span>

        <strong>
          {failed
            ? "الأغنية مش متوفرة"
            : playing && loading
              ? "الأغنية بتحمّل… اضغط للإيقاف"
              : playing
                ? "الأغنية شغّالة"
                : loading
                  ? "بنجهّز الأغنية…"
                  : "اضغطوا للتشغيل"}
        </strong>

        {!failed &&
          safeDuration > 0 && (
            <>
              <span className="gramophone-time">
                {formatTime(currentTime)}
                {" / "}
                {formatTime(safeDuration)}
              </span>

              <span
                className="gramophone-progress-track"
                aria-hidden="true"
              >
                <span
                  className="gramophone-progress-value"
                  style={{
                    width: `${progress}%`
                  }}
                />
              </span>
            </>
          )}
      </div>

      {failed && (
        <p
          className="gramophone-error"
          role="alert"
        >
          ملف الأغنية مش متوفر. راجعوا
          المسار داخل
          {" "}
          <code>public/audio</code>.
        </p>
      )}
    </aside>,
    document.body
  );
}

function GramophoneIcon() {
  return (
    <svg
      className="gramophone-icon"
      viewBox="0 0 120 120"
      role="presentation"
      focusable="false"
    >
      <rect
        className="gramophone-base"
        x="9"
        y="9"
        width="102"
        height="102"
        rx="23"
      />

      <g className="gramophone-record">
        <circle
          className="record-outer"
          cx="56"
          cy="60"
          r="35"
        />

        <circle
          className="record-groove"
          cx="56"
          cy="60"
          r="27"
        />

        <circle
          className="record-groove"
          cx="56"
          cy="60"
          r="20"
        />

        <circle
          className="record-label"
          cx="56"
          cy="60"
          r="12"
        />

        <circle
          className="record-hole"
          cx="56"
          cy="60"
          r="3"
        />

        <path
          className="record-highlight"
          d="M38 37C47 31 58 29 69 33"
        />
      </g>

      <g className="gramophone-arm">
        <circle
          className="arm-joint"
          cx="91"
          cy="31"
          r="7"
        />

        <path
          className="arm-line"
          d="M91 37C92 50 86 61 72 72"
        />

        <rect
          className="arm-head"
          x="66"
          y="68"
          width="13"
          height="8"
          rx="3"
          transform="rotate(-39 72.5 72)"
        />
      </g>

      <circle
        className="gramophone-control"
        cx="94"
        cy="91"
        r="6"
      />
    </svg>
  );
}

function formatTime(
  seconds: number
) {
  if (
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return "0:00";
  }

  const minutes = Math.floor(
    seconds / 60
  );

  const remainingSeconds =
    Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}