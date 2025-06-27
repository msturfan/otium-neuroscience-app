"use client";

import React from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface FirefoxVoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShowInstructions: () => void;
}

const FirefoxVoiceDialog: React.FC<FirefoxVoiceDialogProps> = ({
  isOpen,
  onClose,
  onShowInstructions,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔊 Voice Input - Coming Soon for Firefox!
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p>Voice recognition works great in Chrome, Edge, and Safari.</p>

            <p>For Firefox users, try these free alternatives:</p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Windows Dictation (Win + H)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Voice Fill Firefox Extension</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Switch to Chrome/Edge for this feature</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FirefoxVoiceDialog;
