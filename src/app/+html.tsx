import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Custom HTML shell for the web build. Adds PWA metadata so the app can be
 * installed to the home screen on Android and iOS.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#046A48" />
        <meta name="description" content="Diganta — money, goals and daily life in one private app." />
        <link rel="manifest" href="manifest.webmanifest" />
        <link rel="apple-touch-icon" href="apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Diganta" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
