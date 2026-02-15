"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Mic, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MicrophoneButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  onTranscript,
  className,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Check if MediaRecorder is supported
    if (typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      setIsSupported(true);
    }

    return () => {
      // Cleanup on unmount
      stopRecording();
    };
  }, []);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  };

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Determine the best MIME type for the browser
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm;codecs=opus";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/ogg;codecs=opus";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ""; // Let browser choose
          }
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Process the audio
        if (audioChunksRef.current.length > 0) {
          await processAudio();
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("Recording error occurred");
        stopRecording();
      };

      // Start recording
      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      if (error instanceof Error) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          toast.error("Microphone access denied. Please allow microphone access.");
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          toast.error("No microphone found. Please connect a microphone.");
        } else {
          toast.error("Failed to start recording: " + error.message);
        }
      } else {
        toast.error("Failed to start recording");
      }
      setIsListening(false);
    }
  };

  const processAudio = async () => {
    setIsProcessing(true);
    try {
      // Combine audio chunks into a single blob
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || "audio/webm",
      });

      // Check if audio is too short (less than 0.5 seconds)
      if (audioBlob.size < 1000) {
        toast.error("Recording too short. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Create FormData to send to API
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      // Send to API
      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to transcribe audio");
      }

      const data = await response.json();

      if (data.transcript && data.transcript.trim()) {
        onTranscript(data.transcript.trim());
        toast.success("Voice input transcribed successfully");
      } else {
        toast.error("No speech detected. Please try again.");
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      if (error instanceof Error) {
        toast.error("Transcription failed: " + error.message);
      } else {
        toast.error("Failed to transcribe audio");
      }
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  const toggleListening = () => {
    if (!isSupported) {
      toast.error(
        "Voice recording is not supported in your browser. Please use a modern browser.",
      );
      return;
    }

    if (isListening || isProcessing) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={isListening || isProcessing ? "default" : "ghost"}
      onClick={toggleListening}
      disabled={isProcessing}
      className={cn(
        "relative h-8 w-8 rounded-full p-0 transition-all",
        (isListening || isProcessing) &&
          "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200",
        className,
      )}
      title={
        isProcessing
          ? "Processing..."
          : isListening
            ? "Stop recording"
            : "Start voice input"
      }
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isListening ? (
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
  );
};

export default MicrophoneButton;
