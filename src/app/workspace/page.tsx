import { Suspense } from "react";
import Workspace from "./Workspace";

export const metadata = { title: "Workspace — Orbit" };

export default function Page() {
  return (
    <Suspense>
      <Workspace />
    </Suspense>
  );
}
