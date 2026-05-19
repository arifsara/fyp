"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type AlertOptions = {
  title?: string;
  message: string;
  type?: "alert" | "confirm";
  onConfirm?: () => void;
  onCancel?: () => void;
};

interface AlertContextType {
  showAlert: (message: string, title?: string) => void;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function CustomAlertProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((message: string, title = "Notification") => {
    // Prevent overlapping alerts from queuing, just override
    setOptions({ message, title, type: "alert" });
    setOpen(true);
  }, []);

  const showConfirm = useCallback((message: string, title = "Please Confirm") => {
    return new Promise<boolean>((resolve) => {
      setOptions({
        message,
        title,
        type: "confirm",
        onConfirm: () => {
          setOpen(false);
          resolve(true);
        },
        onCancel: () => {
          setOpen(false);
          resolve(false);
        }
      });
      setOpen(true);
    });
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && options?.type === "confirm" && options.onCancel) {
      options.onCancel();
    }
    setOpen(newOpen);
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md border-none shadow-xl rounded-2xl p-0 overflow-hidden bg-white z-[9999]">
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">{options?.title}</DialogTitle>
              <DialogDescription className="text-slate-600 mt-3 text-base">
                {options?.message}
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="bg-white p-6 pt-4 flex gap-3 justify-end sm:justify-end">
            {options?.type === "confirm" && (
              <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => {
                handleOpenChange(false);
              }}>
                Cancel
              </Button>
            )}
            <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
              if (options?.type === "confirm" && options.onConfirm) {
                options.onConfirm();
              } else {
                setOpen(false);
              }
            }}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AlertContext.Provider>
  );
}

export const useCustomAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useCustomAlert must be used within CustomAlertProvider");
  return context;
};
