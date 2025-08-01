"use client";

import styles from "./page.module.css";
import {Button} from "../../../../components/Button/Button";
import {FlexGroup} from "../../../../components/FlexGroup/FlexGroup";
import {useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {useShift} from "../../../../contexts/ShiftContext/ShiftContext";
import {formatDuration} from "../../../../lib/formatDuration/formatDuration";
import {Heading} from "../../../../components/Heading/Heading";
import {useEffect} from "react";

export default function EndShift() {
    const t = useTranslations("end-shift");
    const router = useRouter();
    const {totalEarnings, totalDuration, setIsShiftOver} = useShift();

    useEffect(() => {
        setIsShiftOver(false);
    }, []);

    return (
        <div className={styles.page}>
            <Heading>{t("title")}</Heading>
            <FlexGroup
                direction={"column"}
                align={"start"}>
                <p>Total Earnings: ${(totalEarnings / 100).toFixed(2)}</p>
                <p>Total Duration: {formatDuration(totalDuration)}</p>
                <Button
                    onClick={() => router.push("/start-shift")}>
                    {t("confirmButton")}
                </Button>
            </FlexGroup>
        </div>
    );
}