import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type MouseEvent,
} from "react";

import {
    CheckCircle2,
    CircleAlert,
    CircleX,
    Info,
    X,
} from "lucide-react";

import styles from "./Toast.module.css";

export type ToastVariant =
    | "success"
    | "error"
    | "warning"
    | "info";

export interface ToastData {
    id: string;
    variant: ToastVariant;
    message: string;
    title?: string;
    duration?: number;
}

export interface ToastProps extends ToastData {
    onClose: (id: string) => void;
}

const DEFAULT_DURATION = 5_000;

export default function Toast({
    id,
    variant,
    title,
    message,
    duration = DEFAULT_DURATION,
    onClose,
}: ToastProps) {
    const [isPaused, setIsPaused] = useState(false);

    const timerRef = useRef<number | null>(null);
    const remainingTimeRef = useRef(duration);
    const startedAtRef = useRef(0);

    const closeToast = useCallback(() => {
        onClose(id);
    }, [id, onClose]);

    const clearTimer = useCallback(() => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        if (
            duration <= 0 ||
            remainingTimeRef.current <= 0
        ) {
            return;
        }

        clearTimer();

        startedAtRef.current = Date.now();

        timerRef.current = window.setTimeout(() => {
            closeToast();
        }, remainingTimeRef.current);
    }, [
        clearTimer,
        closeToast,
        duration,
    ]);

    useEffect(() => {
        remainingTimeRef.current = duration;

        startTimer();

        return () => {
            clearTimer();
        };
    }, [
        clearTimer,
        duration,
        startTimer,
    ]);

    function handleMouseEnter() {
        if (duration <= 0 || isPaused) {
            return;
        }

        const elapsedTime =
            Date.now() - startedAtRef.current;

        remainingTimeRef.current = Math.max(
            0,
            remainingTimeRef.current - elapsedTime
        );

        clearTimer();
        setIsPaused(true);
    }

    function handleMouseLeave() {
        if (duration <= 0 || !isPaused) {
            return;
        }

        setIsPaused(false);
        startTimer();
    }

    function handleToastClick() {
        closeToast();
    }

    function handleCloseButtonClick(
        event: MouseEvent<HTMLButtonElement>
    ) {
        event.stopPropagation();
        closeToast();
    }

    function renderIcon() {
        const iconProps = {
            size: 22,
            strokeWidth: 2,
            "aria-hidden": true,
        };

        switch (variant) {
            case "success":
                return <CheckCircle2 {...iconProps} />;

            case "error":
                return <CircleX {...iconProps} />;

            case "warning":
                return <CircleAlert {...iconProps} />;

            case "info":
            default:
                return <Info {...iconProps} />;
        }
    }

    const toastClassName = [
        styles.toast,
        styles[variant],
        isPaused ? styles.paused : "",
    ]
        .filter(Boolean)
        .join(" ");

    const role =
        variant === "error"
            ? "alert"
            : "status";

    const ariaLive =
        variant === "error"
            ? "assertive"
            : "polite";

    return (
        <div
            className={toastClassName}
            role={role}
            aria-live={ariaLive}
            aria-atomic="true"
            onClick={handleToastClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onPointerDown={handleMouseEnter}
            onPointerCancel={handleMouseLeave}
            title="Cliquer pour fermer"
        >
            <div
                className={styles.iconContainer}
                aria-hidden="true"
            >
                {renderIcon()}
            </div>

            <div className={styles.content}>
                {title && (
                    <p className={styles.title}>
                        {title}
                    </p>
                )}

                <p className={styles.message}>
                    {message}
                </p>
            </div>

            <button
                type="button"
                className={styles.closeButton}
                onClick={handleCloseButtonClick}
                aria-label="Fermer la notification"
                title="Fermer"
            >
                <X
                    size={18}
                    strokeWidth={2}
                    aria-hidden="true"
                />
            </button>

            {duration > 0 && (
                <span
                    className={styles.progress}
                    style={{
                        animationDuration: `${duration}ms`,
                    }}
                    aria-hidden="true"
                />
            )}
        </div>
    );
}