"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown in the root layout itself. It replaces
 * the whole document, so it can't use the i18n provider — kept deliberately
 * minimal and neutral.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fafafa",
          color: "#0f172a",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 380 }}>
          <h1 style={{ fontSize: "1.25rem", margin: "0 0 .5rem" }}>
            Wally ran into a problem
          </h1>
          <p style={{ fontSize: ".875rem", color: "#64748b", margin: "0 0 1rem" }}>
            An unexpected error occurred.
          </p>
          <button
            onClick={reset}
            style={{
              border: "none",
              borderRadius: 8,
              padding: ".5rem 1rem",
              background: "#4f46e5",
              color: "#fff",
              fontSize: ".875rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
