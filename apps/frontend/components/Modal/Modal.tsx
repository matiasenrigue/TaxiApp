"use client"

import styles from "./Modal.module.css";
import React, {ForwardedRef, forwardRef, useCallback, useImperativeHandle, useRef} from "react";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Heading} from "../Heading/Heading";

export type ModalHandle = {
    open: () => void;
    close: () => void;
};

interface ModalProps extends React.PropsWithChildren {
    title?: string;
    className?: string;
    onClose?: () => void;
}

export const Modal = forwardRef<ModalHandle, ModalProps>((props: ModalProps, ref: ForwardedRef<ModalHandle>) => {
    const {
        title,
        onClose,
        children,
        className,
    } = props;
    const dialogRef = useRef<HTMLDialogElement>(null!);

    const open = useCallback(() => {
        if (!dialogRef || typeof dialogRef === "function")
            return;
        dialogRef.current.showModal();
    }, []);

    const close = useCallback(() => {
        if (!dialogRef || typeof dialogRef === "function")
            return;
        dialogRef.current.close();
    }, []);

    useImperativeHandle(ref, () => ({
        open,
        close
    }));

    return (
        <dialog
            ref={dialogRef}
            className={`${styles.dialog} ${className || ''}`}
            data-testid={"modal"}>
            <button
                className={styles.button_close}
                onClick={() => {
                    if (onClose)
                        onClose();
                    close();
                }}
                aria-label={"close"}>
                <FontAwesomeIcon icon={faXmark}/>
            </button>
            {title && <Heading>{title}</Heading>}
            {children}
        </dialog>
    );
});

Modal.displayName = "Modal";