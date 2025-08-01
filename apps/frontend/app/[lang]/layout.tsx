import type { Metadata, Viewport } from "next";
import "./globals.css";
import styles from "./layout.module.css";
import {Header} from "../../components/Header/Header";
import { Roboto, Roboto_Mono } from "next/font/google";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {routing} from "../../i18n/routing";
import {notFound} from "next/navigation";
import { ThemeProvider } from "../../components/ThemeProvider/ThemeProvider";
import {ShiftContextProvider} from "../../contexts/ShiftContext/ShiftContext";
import clsx from "clsx";
import {RideContextProvider} from "../../contexts/RideContext/RideContext";
import React from "react";
import {BreakModalHandler} from "../../components/modals/BreakModalHandler/BreakModalHandler";
import {ShiftEndModalHandler} from "../../components/modals/ShiftEndModalHandler/ShiftEndModalHandler";
import { UserContextProvider } from "../../contexts/UserContext/UserContext";
import {UserLocationContextProvider} from "../../contexts/UserLocationContext/UserLocationContext";
import { PreferencesLoader } from "../../components/PreferencesLoader/PreferencesLoader";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto"
});

const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  fallback: ["roboto"]
});

export const metadata: Metadata = {
  title: "Taximize",
  description: "Maximize your profit by getting recommended routes to quickly find passengers!",
  keywords: "taxi, passenger, routing",

  generator: "Next.js",
  referrer: "no-referrer",

  openGraph: {
    title: "Taximize",
    type: "website",
    description: "Maximize your profit by getting recommended routes to quickly find passengers!"
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "cyan" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export default async function RootLayout({
    children,
    params
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{lang: string}>;
}>) {
    const {lang} = await params;
    if (!hasLocale(routing.locales, lang))
      notFound();

    return (
        <html
            lang={lang}
            prefix="og: https://ogp.me/ns#"
            // suppress the warning that occurs because the theme changes html's class
            suppressHydrationWarning>
            <body className={clsx(roboto.variable, roboto_mono.variable)}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <NextIntlClientProvider>
                        <UserContextProvider>
                              <UserLocationContextProvider>
                                  <ShiftContextProvider>
                                      <RideContextProvider>

                                          <PreferencesLoader />
                                          <BreakModalHandler/>
                                          <ShiftEndModalHandler/>

                                          <div className={styles.container}>
                                              <Header/>
                                              <main className={styles.main}>
                                                  {children}
                                              </main>
                                          </div>

                                      </RideContextProvider>
                                  </ShiftContextProvider>
                              </UserLocationContextProvider>
                          </UserContextProvider>
                    </NextIntlClientProvider>
                </ThemeProvider>
            </body>
      </html>
    );
}
