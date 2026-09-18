"use client";

/**
 * Whether this tab has navigated anywhere inside the app since the page last
 * fully loaded — a module-level flag rather than `sessionStorage`, because a
 * hard reload or a link opened straight from outside (a shared chat link,
 * for instance) should reset it: the browser's own history has nothing
 * in-app to land on in either case, only once the script restarts fresh.
 */
let navigated = false;

export function markNavigated() {
  navigated = true;
}

export function hasInAppHistory() {
  return navigated;
}
