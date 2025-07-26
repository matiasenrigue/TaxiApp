"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {getToken} from "../../lib/token";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const token = getToken();
        if (token) {
            router.push("/start-shift");
        } else {
            router.push("/signin");
        }
    }, [router]);

    return null;
}
