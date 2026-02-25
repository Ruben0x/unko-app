type SearchParams = Promise<{ error?: string }>;

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  AccessDenied: {
    title: "Acceso denegado",
    description:
      "Tu cuenta no tiene acceso a esta aplicación. Solo se puede ingresar por invitación.",
  },
  Default: {
    title: "Error de autenticación",
    description: "Ocurrió un error durante el inicio de sesión.",
  },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;
  const { title, description } =
    ERROR_MESSAGES[error ?? ""] ?? ERROR_MESSAGES.Default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 text-4xl">🚫</div>
        <h1 className="mb-2 text-xl font-semibold text-zinc-900">{title}</h1>
        <p className="mb-6 text-sm text-zinc-500">{description}</p>
        <a
          href="/api/auth/signin"
          className="text-sm font-medium text-zinc-900 underline underline-offset-4"
        >
          Volver al inicio de sesión
        </a>
      </div>
    </div>
  );
}
