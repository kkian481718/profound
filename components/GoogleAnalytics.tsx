"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

import { GA_TRACKING_ID, pageview } from "@/lib/gtag";

// 將 useSearchParams 的邏輯分離到單獨的組件
const PageTracker = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_TRACKING_ID) return;

    const url = pathname + searchParams.toString();

    pageview(url);
  }, [pathname, searchParams]);

  return null;
};

const GoogleAnalytics = () => {
  if (!GA_TRACKING_ID) {
    return null;
  }

  return (
    <>
      <Suspense fallback={null}>
        <PageTracker />
      </Suspense>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
        id="gtag-init"
        strategy="afterInteractive"
      />
    </>
  );
};

export default GoogleAnalytics;
