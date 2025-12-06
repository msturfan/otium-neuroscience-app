"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";
import FirefoxVoiceDialog from "./FirefoxVoiceDialog";

interface MicrophoneButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  onTranscript,
  className,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isFirefox, setIsFirefox] = useState(false);
  const [showFirefoxDialog, setShowFirefoxDialog] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Detect Firefox
    const userAgent = navigator.userAgent.toLowerCase();
    const firefoxDetected = userAgent.includes("firefox");
    setIsFirefox(firefoxDetected);

    // Check for native Web Speech API support
    if (
      !firefoxDetected &&
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      setIsSupported(true);

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      // Configure recognition
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);

        if (event.error === "not-allowed") {
          alert(
            "Microphone access denied. Please allow microphone access to use speech recognition.",
          );
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [onTranscript]);

  const showInstructions = () => {
    alert(
      "🎤 Free Voice Input Options for Firefox:\n\n" +
        "1️⃣ WINDOWS DICTATION (Recommended)\n" +
        "   • Click in the text area\n" +
        "   • Press Win + H\n" +
        "   • Start speaking!\n\n" +
        "2️⃣ FIREFOX EXTENSION\n" +
        "   • Search 'Voice Fill' in Firefox Add-ons\n" +
        "   • Install and use\n\n" +
        "3️⃣ USE CHROME/EDGE\n" +
        "   • Switch to Chrome or Edge\n" +
        "   • Enjoy instant voice recognition\n\n" +
        "We're working on native Firefox support! 🚀",
    );
  };

  const toggleListening = () => {
    if (isFirefox) {
      setShowFirefoxDialog(true);
      return;
    }

    if (!isSupported) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.",
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={isListening ? "default" : "ghost"}
        onClick={toggleListening}
        className={cn(
          "relative h-8 w-8 rounded-full p-0 transition-all",
          isListening &&
            "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200",
          className,
        )}
        title={isListening ? "Stop recording" : "Start voice input"}
      >
        {isListening ? (
          <>
            <X className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gray-600 opacity-75 dark:bg-gray-400"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-gray-700 dark:bg-gray-300"></span>
            </span>
          </>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      <FirefoxVoiceDialog
        isOpen={showFirefoxDialog}
        onClose={() => setShowFirefoxDialog(false)}
        onShowInstructions={() => {
          setShowFirefoxDialog(false);
          showInstructions();
        }}
      />
    </>
  );
};

export default MicrophoneButton;
