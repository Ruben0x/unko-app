import { prisma } from "@/lib/prisma";
import { calculateSettlement } from "@/lib/settlement";
import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { CreatePaymentForm } from "@/components/create-payment-form";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import type { Currency } from "@/lib/constants";

type Participant = { id: string; name: string };

export async function ExpenseList({
  tripId,
  participants,
  defaultCurrency,
  canEdit,
}: {
  tripId: string;
  participants: Participant[];
  defaultCurrency: string;
  canEdit: boolean;
}) {
  const [rawExpenses, rawPayments] = await Promise.all([
    prisma.expense.findMany({
      where: { tripId },
      select: {
        id: true,
        description: true,
        amount: true,
        currency: true,
        expenseDate: true,
        splitType: true,
        createdById: true,
        paidBy: { select: { id: true, name: true } },
        participants: {
          select: {
            amount: true,
            participant: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { expenseDate: "desc" },
    }),
    prisma.payment.findMany({
      where: { tripId },
      select: {
        id: true,
        amount: true,
        currency: true,
        paidAt: true,
        fromParticipant: { select: { id: true, name: true } },
        toParticipant: { select: { id: true, name: true } },
      },
      orderBy: { paidAt: "desc" },
    }),
  ]);

  const expensesForSettlement = rawExpenses.map((e) => ({
    id: e.id,
    amount: e.amount,
    currency: e.currency,
    paidByParticipantId: e.paidBy?.id ?? null,
    participants: e.participants.map((ep) => ({
      participantId: ep.participant.id,
      amount: ep.amount,
    })),
  }));

  const paymentsForSettlement = rawPayments.map((p) => ({
    id: p.id,
    fromParticipantId: p.fromParticipant.id,
    toParticipantId: p.toParticipant.id,
    amount: p.amount,
    currency: p.currency,
  }));

  const participantsForSettlement = participants.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  const { settlements, balances, currencies } = calculateSettlement(
    expensesForSettlement,
    participantsForSettlement,
    paymentsForSettlement,
  );

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString("es-CL", { day: "numeric", month: "short" });

  const sym = (currency: string) =>
    CURRENCY_SYMBOLS[currency as Currency] ?? currency;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Settlement card ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm ring-1 ring-black/3 overflow-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:ring-white/5">
        {/* Card header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <span className="text-base">⚖️</span>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Liquidación</h3>
          </div>
          {canEdit && (
            <CreatePaymentForm
              tripId={tripId}
              participants={participants}
              defaultCurrency={defaultCurrency}
            />
          )}
        </div>

        <div className="px-6 py-5">
          {settlements.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              {rawExpenses.length === 0
                ? "Sin gastos registrados aún."
                : "¡Todo al día! No hay transferencias pendientes."}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {settlements.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 dark:bg-amber-950/40 dark:border-amber-900/50"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{s.fromName}</span>
                    <span className="text-amber-400 font-light dark:text-amber-500">→</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{s.toName}</span>
                  </div>
                  <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-sm font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                    {sym(s.currency)}{s.amount.toLocaleString("es-CL")}
                    <span className="ml-1 text-xs font-normal text-amber-600 dark:text-amber-400">
                      {s.currency}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Balances per currency */}
          {currencies.length > 0 && (
            <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-700">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Balances
              </p>
              {currencies.map((currency) => (
                <div key={currency} className="mb-4 last:mb-0">
                  <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{currency}</p>
                  <div className="flex flex-col gap-1.5">
                    {(balances[currency] ?? []).map((b) => (
                      <div
                        key={b.participantId}
                        className="flex items-center justify-between rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-700"
                      >
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">{b.name}</span>
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            b.balance > 0.005
                              ? "text-emerald-600 dark:text-emerald-400"
                              : b.balance < -0.005
                                ? "text-red-500 dark:text-red-400"
                                : "text-zinc-400 dark:text-zinc-500"
                          }`}
                        >
                          {b.balance > 0.005 ? "+" : ""}
                          {sym(currency)}
                          {Math.abs(b.balance).toLocaleString("es-CL", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Expense list ────────────────────────────────────────────────────── */}
      {rawExpenses.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Gastos · {rawExpenses.length}
          </h3>
          <div className="flex flex-col gap-3">
            {rawExpenses.map((expense) => (
              <div
                key={expense.id}
                className="group rounded-2xl border border-zinc-100 bg-white shadow-sm ring-1 ring-black/3 hover:shadow-md hover:border-zinc-200 transition-all overflow-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:ring-white/5 dark:hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    {/* Title + date */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-zinc-900 text-sm leading-snug dark:text-zinc-100">
                        {expense.description}
                      </p>
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                        {fmtDate(expense.expenseDate)}
                      </span>
                    </div>

                    {/* Amount */}
                    <p className="text-xl font-bold tabular-nums text-zinc-900 leading-none mb-2 dark:text-zinc-100">
                      {sym(expense.currency)}
                      {expense.amount.toLocaleString("es-CL")}
                      <span className="ml-1.5 text-xs font-normal text-zinc-400 dark:text-zinc-500">
                        {expense.currency}
                      </span>
                    </p>

                    {/* Paid by */}
                    {expense.paidBy && (
                      <p className="text-xs text-zinc-500 mb-2 dark:text-zinc-400">
                        Pagó{" "}
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {expense.paidBy.name}
                        </span>
                      </p>
                    )}

                    {/* Participant splits */}
                    <div className="flex flex-wrap gap-1.5">
                      {expense.participants.map((ep) => (
                        <span
                          key={ep.participant.id}
                          className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:border-zinc-700 dark:text-zinc-400"
                        >
                          {ep.participant.name}
                          <span className="ml-1 text-zinc-400 dark:text-zinc-500">
                            {sym(expense.currency)}
                            {ep.amount.toLocaleString("es-CL", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DeleteExpenseButton tripId={tripId} expenseId={expense.id} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Payments list ───────────────────────────────────────────────────── */}
      {rawPayments.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Pagos registrados · {rawPayments.length}
          </h3>
          <div className="flex flex-col gap-2">
            {rawPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {payment.fromParticipant.name}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-600">→</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {payment.toParticipant.name}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    · {fmtDate(payment.paidAt)}
                  </span>
                </div>
                <span className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400">
                  {sym(payment.currency)}
                  {payment.amount.toLocaleString("es-CL")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
