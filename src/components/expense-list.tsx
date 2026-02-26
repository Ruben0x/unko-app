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

  // Build settlement inputs
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
    <div className="flex flex-col gap-8">
      {/* ── Settlement ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">Liquidación</h3>
          {canEdit && (
            <CreatePaymentForm
              tripId={tripId}
              participants={participants}
              defaultCurrency={defaultCurrency}
            />
          )}
        </div>

        {settlements.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {rawExpenses.length === 0
              ? "Sin gastos registrados aún."
              : "¡Todo al día! No hay transferencias pendientes."}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {settlements.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3"
              >
                <span className="text-sm text-zinc-700">
                  <span className="font-medium">{s.fromName}</span>
                  {" → "}
                  <span className="font-medium">{s.toName}</span>
                </span>
                <span className="text-sm font-semibold text-zinc-900">
                  {sym(s.currency)}{s.amount.toLocaleString("es-CL")} {s.currency}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Balances per currency */}
        {currencies.length > 0 && (
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
              Balances
            </p>
            {currencies.map((currency) => (
              <div key={currency} className="mb-4">
                <p className="mb-2 text-xs font-medium text-zinc-500">{currency}</p>
                <div className="flex flex-col gap-1">
                  {(balances[currency] ?? []).map((b) => (
                    <div key={b.participantId} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600">{b.name}</span>
                      <span
                        className={
                          b.balance > 0.005
                            ? "font-medium text-green-600"
                            : b.balance < -0.005
                              ? "font-medium text-red-600"
                              : "text-zinc-400"
                        }
                      >
                        {b.balance > 0.005 ? "+" : ""}
                        {sym(currency)}{Math.abs(b.balance).toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Expense list ───────────────────────────────────────────────────── */}
      {rawExpenses.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            Gastos ({rawExpenses.length})
          </h3>
          <div className="flex flex-col gap-3">
            {rawExpenses.map((expense) => (
              <div
                key={expense.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-900 text-sm">{expense.description}</p>
                      <span className="text-xs text-zinc-400">{fmtDate(expense.expenseDate)}</span>
                    </div>
                    <p className="mt-0.5 text-base font-semibold text-zinc-900">
                      {sym(expense.currency)}{expense.amount.toLocaleString("es-CL")} {expense.currency}
                    </p>
                    {expense.paidBy && (
                      <p className="mt-1 text-xs text-zinc-500">
                        Pagó: <span className="font-medium">{expense.paidBy.name}</span>
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {expense.participants.map((ep) => (
                        <span
                          key={ep.participant.id}
                          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                        >
                          {ep.participant.name}: {sym(expense.currency)}{ep.amount.toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                        </span>
                      ))}
                    </div>
                  </div>

                  {canEdit && (
                    <DeleteExpenseButton tripId={tripId} expenseId={expense.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Payments list ──────────────────────────────────────────────────── */}
      {rawPayments.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            Pagos registrados ({rawPayments.length})
          </h3>
          <div className="flex flex-col gap-2">
            {rawPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg border border-zinc-100 bg-white px-4 py-3"
              >
                <div className="text-sm text-zinc-700">
                  <span className="font-medium">{payment.fromParticipant.name}</span>
                  {" pagó a "}
                  <span className="font-medium">{payment.toParticipant.name}</span>
                  <span className="ml-2 text-xs text-zinc-400">{fmtDate(payment.paidAt)}</span>
                </div>
                <span className="text-sm font-semibold text-zinc-900">
                  {sym(payment.currency)}{payment.amount.toLocaleString("es-CL")} {payment.currency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
