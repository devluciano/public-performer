import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Verificar suporte da API nativa
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Web Speech API (SpeechRecognition) não é suportada neste navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Mantém ativo mesmo após pausas na fala
    recognition.interimResults = true; // Retorna resultados preliminares
    recognition.lang = "pt-BR"; // Define o idioma para Português

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      accumulatedRef.current += finalTranscript;
      setTranscript(accumulatedRef.current + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Erro no reconhecimento de fala:", event.error);
    };

    recognition.onend = () => {
      // Se for interrompido involuntariamente, mas deveríamos estar escutando, reinicia
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          /* noop */
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* noop */
        }
      }
    };
  }, [isListening]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    accumulatedRef.current = "";
    setTranscript("");
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Falha ao iniciar reconhecimento:", e);
    }
  }, []);

  const pause = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* noop */
      }
    }
  }, []);

  const resume = useCallback(() => {
    setIsListening(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        /* noop */
      }
    }
  }, []);

  const stop = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* noop */
      }
    }
  }, []);

  const reset = useCallback(() => {
    accumulatedRef.current = "";
    setTranscript("");
  }, []);

  return {
    transcript,
    isListening,
    start,
    pause,
    resume,
    stop,
    reset,
    supported: typeof window !== "undefined" && !(!(window as any).SpeechRecognition && !(window as any).webkitSpeechRecognition),
  };
}
