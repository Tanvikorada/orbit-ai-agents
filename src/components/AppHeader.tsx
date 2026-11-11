import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Logo } from "@/components/ui";
import { UserMenu } from "@/components/UserMenu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Orbit home">
          <Logo />
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-[#14110a] transition hover:brightness-110 active:scale-[0.98]"
          >
            <Plus size={14} weight="bold" /> New run
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
