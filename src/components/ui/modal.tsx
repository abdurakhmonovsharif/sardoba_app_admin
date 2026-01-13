"use client";

import { X } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

export function Modal({ title, isOpen, onClose, children, className }: ModalProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!mounted) return null;

    return createPortal(
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
                isOpen ? "pointer-events-auto" : "pointer-events-none"
            )}
        >
            <div
                role="button"
                tabIndex={-1}
                aria-label="Close modal"
                onClick={onClose}
                className={cn(
                    "absolute inset-0 bg-black/50 transition-opacity backdrop-blur-sm",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
            />
            <div
                className={cn(
                    "relative w-full max-w-xl scale-95 transform rounded-2xl bg-white p-6 shadow-2xl transition-all dark:bg-slate-900",
                    isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0",
                    className
                )}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>,
        document.body
    );
}
