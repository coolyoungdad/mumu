"use client";

import { useState } from "react";
import { CurrencyDollar, Check, X, Clock } from "@phosphor-icons/react/dist/ssr";

interface WithdrawalRequest {
  id: string;
  user_email: string;
  amount: number;
  paypal_email: string;
  status: "pending" | "processing" | "completed" | "rejected";
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
}

interface Props {
  initialRequests: WithdrawalRequest[];
}

export default function WithdrawalQueue({ initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});

  const pendingRequests = requests.filter(
    (r) => r.status === "pending" || r.status === "processing"
  );
  const completedRequests = requests.filter(
    (r) => r.status === "completed" || r.status === "rejected"
  );

  const handleProcess = async (id: string, status: "completed" | "rejected") => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/admin/withdrawals/${id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_note: noteValues[id] ?? "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                admin_note: noteValues[id] ?? null,
                processed_at: new Date().toISOString(),
              }
            : r
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to process request");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
      <div className="p-6 border-b border-orange-100 flex items-center gap-3">
        <CurrencyDollar weight="fill" className="text-orange-600 text-xl" />
        <h2 className="text-xl font-bold text-orange-950">
          Withdrawal Requests
          {pendingRequests.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
              {pendingRequests.length} pending
            </span>
          )}
        </h2>
      </div>

      {pendingRequests.length === 0 && completedRequests.length === 0 && (
        <div className="p-8 text-center text-orange-400 text-sm">
          No withdrawal requests yet.
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div className="divide-y divide-orange-50">
          {pendingRequests.map((req) => (
            <div key={req.id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock weight="fill" className="text-yellow-500 text-sm flex-shrink-0" />
                    <span className="text-xs font-bold uppercase text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                    <span className="text-xs text-orange-400">
                      {new Date(req.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="font-bold text-orange-950 text-lg">
                    ${parseFloat(req.amount.toString()).toFixed(2)}
                  </div>
                  <div className="text-sm text-orange-600 mt-0.5">
                    <span className="font-medium">User:</span> {req.user_email}
                  </div>
                  <div className="text-sm text-orange-600">
                    <span className="font-medium">PayPal:</span>{" "}
                    <span className="font-mono">{req.paypal_email}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <input
                    type="text"
                    placeholder="Admin note (optional)"
                    value={noteValues[req.id] ?? ""}
                    onChange={(e) =>
                      setNoteValues((prev) => ({ ...prev, [req.id]: e.target.value }))
                    }
                    className="border border-orange-200 rounded-xl px-3 py-2 text-xs text-orange-950 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400 w-full sm:w-48"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleProcess(req.id, "rejected")}
                      disabled={processingId === req.id}
                      className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <X weight="bold" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleProcess(req.id, "completed")}
                      disabled={processingId === req.id}
                      className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Check weight="bold" />
                      {processingId === req.id ? "Processing..." : "Mark Paid"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {completedRequests.length > 0 && (
        <div className="border-t border-orange-100">
          <div className="px-6 py-3 bg-orange-50">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-wider">
              Recently Processed
            </p>
          </div>
          <div className="divide-y divide-orange-50 max-h-64 overflow-y-auto">
            {completedRequests.slice(0, 10).map((req) => (
              <div key={req.id} className="px-6 py-4 flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    req.status === "completed"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-500"
                  }`}
                >
                  {req.status === "completed" ? (
                    <Check weight="bold" className="text-sm" />
                  ) : (
                    <X weight="bold" className="text-sm" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-orange-950">
                    ${parseFloat(req.amount.toString()).toFixed(2)} → {req.paypal_email}
                  </div>
                  <div className="text-xs text-orange-400">
                    {req.user_email} ·{" "}
                    {req.processed_at
                      ? new Date(req.processed_at).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
                <span
                  className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                    req.status === "completed"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
