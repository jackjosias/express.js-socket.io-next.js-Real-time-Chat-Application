"use client";

import { useSyncExternalStore } from "react";

const subscribeClientSnapshot = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeClientSnapshot,
    getClientSnapshot,
    getServerSnapshot
  );
}
