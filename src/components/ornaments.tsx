import type { SVGProps } from "react";

export function BakeryMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.45"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M9 27c4-6 7-13 12-22" />
      <path d="M14.2 17.8c-4.6 1.1-7.1-.7-6.9-3.2 3.4-.5 5.8.6 6.9 3.2Z" />
      <path d="M16.6 13.3c-4.5.4-6.5-1.7-5.8-4.1 3.4 0 5.5 1.5 5.8 4.1Z" />
      <path d="M19 9.2c-3.5-.3-4.8-2.3-3.8-4.3 2.7.4 4 2 3.8 4.3Z" />
      <path d="M14.8 17.1c4.4 1.7 7.1.3 7.2-2.2-3.3-1-5.8-.3-7.2 2.2Z" />
      <path d="M17.2 12.6c4.4 1 6.7-.8 6.4-3.3-3.3-.6-5.7.4-6.4 3.3Z" />
      <path d="M19.5 8.2c3.2.2 4.7-1.5 4-3.4-2.5-.1-4 1.1-4 3.4Z" />
      <path d="m7.2 26.8 3.7.3" />
    </svg>
  );
}

export function OvenMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 144 112"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M16 98V50c0-25 20-43 56-43s56 18 56 43v48" />
      <path d="M9 98h126M23 98V53c0-20 16-34 49-34s49 14 49 34v45" />
      <path d="M39 98V61c0-14 12-24 33-24s33 10 33 24v37" />
      <path d="M49 81h46M49 88h46" />
      <path d="M62 56c1.7-4.1 4.7-6.2 9-6.2 4.4 0 7.4 2.1 9 6.2" />
      <path d="M64 63c1.4 2 2.5 3 3.4 3s2-1 3.4-3c1.4 2 2.5 3 3.4 3s2-1 3.4-3" />
      <path d="M27 48h7M110 48h7M72 26v4" />
      <path d="M28 103h88" />
    </svg>
  );
}
