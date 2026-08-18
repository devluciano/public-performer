import { useCallback, useRef, useState } from "react";

export type RecordingKind = "audio" | "video";
export type RecorderStatus = "idle" | "recording" | "paused" | "stopped" | "error";

export function useMediaRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [kind, setKind] = useState<RecordingKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; kind: RecordingKind } | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const start = useCallback(async (target: RecordingKind) => {
    setError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia(
        target === "video" ? { audio: true, video: { width: 1280, height: 720 } } : { audio: true },
      );
      const recorder = new MediaRecorder(media);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || (target === "video" ? "video/webm" : "audio/webm") });
        media.getTracks().forEach((t) => t.stop());
        setStream(null);
        setResult(blob.size > 0 ? { blob, url: URL.createObjectURL(blob), kind: target } : null);
        setStatus("stopped");
      };
      recorder.start();
      recorderRef.current = recorder;
      setStream(media);
      setKind(target);
      setStatus("recording");
    } catch {
      setError("Não foi possível acessar o microfone/câmera. Verifique as permissões do navegador.");
      setStatus("error");
    }
  }, []);

  const pause = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.pause();
      setStatus("paused");
    }
  }, []);

  const resume = useCallback(() => {
    if (recorderRef.current?.state === "paused") {
      recorderRef.current.resume();
      setStatus("recording");
    }
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
  }, []);

  const discard = useCallback(() => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setStatus("idle");
    setKind(null);
  }, [result]);

  return { status, kind, error, result, stream, start, pause, resume, stop, discard };
}
