import { Suspense } from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { ItemList } from "@/components/item-list";
import { CreateItemForm } from "@/components/create-item-form";
import { InviteUserForm } from "@/components/invite-user-form";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-zinc-900">
            Planificador de viaje
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{session.user.email}</span>
            <InviteUserForm />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/api/auth/signin" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Lista global</h2>
          <CreateItemForm />
        </div>

        <Suspense
          fallback={
            <div className="text-sm text-zinc-400">Cargando items...</div>
          }
        >
          <ItemList currentUserId={session.user.id} />
        </Suspense>
      </main>
    </div>
  );
}
