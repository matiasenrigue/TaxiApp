/**
 * withAuth is a higher-order component (HOC) that checks if the user is authenticated.
 * If not, it redirects them to the sign-in page.
 */

"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "./token";

export function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function AuthComponent(props: P) {
    const router = useRouter();

    useEffect(() => {
      const token = getToken();
      if (!token) {
        router.replace("/signin");
      }
    }, [router]);

    
    const token = getToken();
    if (!token) return null;

    return <WrappedComponent {...props} />;
  };
}