import { Suspense } from "react";
import Login from "./Login";

export const metadata = { title: "Sign in | Orbit" };

export default function Page() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
