import styles from "./TimeInput.module.css";
import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {moveCursorToEnd, removeAllSelections, selectContent} from "../../lib/selectContent";
import {HOUR_IN_MILLISECONDS, MINUTE_IN_MILLISECONDS} from "../../constants/constants";
import {isNumberKey} from "../../lib/isCharacterKey";

interface TimeInputProps {
    onChange?: (value: number) => void; // in milliseconds
    suffix?: string;
    defaultValue?: number;
    invalid?: boolean;
}

export const TimeInput = (props: TimeInputProps) => {
    const {
        onChange,
        suffix = "h",
        defaultValue = 0,
        invalid = false,
    } = props;
    const hourRef = useRef<SegmentHandle>(null!);
    const minuteRef = useRef<SegmentHandle>(null!);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget)
            return;
        hourRef?.current?.focus();
    }

    const handleChange = () => {
        const hour = hourRef.current.value;
        const minute = minuteRef.current.value;
        const totalInMilliseconds = ((hour * 60) + minute) * 60 * 1000;
        if (onChange)
            onChange(totalInMilliseconds);
    };

    return (
        <div
            className={styles.container}
            data-testid={"time-input"}
            data-invalid={invalid}
            onClick={handleClick}>
            <Segment
                ref={hourRef}
                testId={"segment-hour"}
                defaultValue={Math.floor(defaultValue / HOUR_IN_MILLISECONDS)}
                minValue={0}
                maxValue={23}
                onConfirm={() => minuteRef?.current?.focus()}
                onChange={handleChange}/>
            <span className={styles.text}>:</span>
            <Segment
                ref={minuteRef}
                testId={"segment-minute"}
                defaultValue={Math.floor((defaultValue % HOUR_IN_MILLISECONDS) / MINUTE_IN_MILLISECONDS)}
                minValue={0}
                maxValue={59}
                onConfirm={() => minuteRef?.current?.blur()}
                onChange={handleChange}/>
            <span className={styles.text}>{suffix}</span>
        </div>
    );
};

export type SegmentHandle = {
    focus: () => void;
    blur: () => void;
    value: number;
}

interface SegmentProps {
    defaultValue?: number;
    minValue?: number;
    maxValue?: number;
    onChange?: (value: number) => void;
    onConfirm?: () => void;
    onBlur?: () => void;
    testId?: string | undefined;
}

const Segment = forwardRef<SegmentHandle, SegmentProps>((props, ref) => {
    const {
        defaultValue = 0,
        minValue = 0,
        maxValue = 99,
        onChange,
        onConfirm,
        onBlur,
        testId,
    } = props;

    const elementRef = useRef<HTMLSpanElement>(null!);
    const [value, setValue] = useState(defaultValue);

    const focus = () => elementRef.current.focus();
    const blur = () => elementRef.current.blur();

    const handleInput = (e: React.FormEvent<HTMLSpanElement>) => {
        const target = e.target as HTMLSpanElement;
        let newValue = parseInt(target.textContent ?? "") ?? 0;
        newValue = Math.max(Math.min(newValue, maxValue), minValue);
        target.textContent = newValue.toLocaleString([], {minimumIntegerDigits: 2});
        moveCursorToEnd(target);
        setValue(newValue);
        if (newValue.toString().length === maxValue.toString().length)
            if (onConfirm) onConfirm();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
        if (!isNumberKey(e))
            e.preventDefault();
        if (["Enter", ":", " "].includes(e.key))
            if (onConfirm) onConfirm();
    };

    useImperativeHandle(ref, () => ({
        focus,
        blur,
        value
    }));

    useEffect(() => {
        if (onChange)
            onChange(value);
    }, [value, onChange]);

    return (
        <span
            className={styles.segment}
            ref={elementRef}
            role={"spinbutton"}
            aria-valuemin={minValue}
            aria-valuemax={maxValue}
            aria-valuenow={value}
            aria-valuetext={value.toString()}
            aria-label={"Hour"}
            inputMode={"numeric"}
            contentEditable={true}
            suppressContentEditableWarning={true}
            spellCheck={false}
            autoCorrect={"off"}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={(e) => selectContent(e.target)}
            onBlur={() => {
                removeAllSelections();
                if (onBlur) onBlur();
            }}
            data-testid={testId}>
            {defaultValue.toLocaleString([], {minimumIntegerDigits: 2})}
        </span>
    )
});

Segment.displayName = "Segment";