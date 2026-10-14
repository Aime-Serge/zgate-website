"use client";

import { useEffect } from "react";
import { captureAttribution } from "./attribution";

/** Renders nothing; records first-touch attribution once per visit. */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
