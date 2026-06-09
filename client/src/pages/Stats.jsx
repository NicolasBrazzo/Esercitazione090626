import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Receipt, CheckCircle2, Wallet } from "lucide-react";

import Loader from "../components/Loader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuth } from "../context/AuthContext";
import { fetchRefundStats } from "../services/statsService";
import { fetchCategories } from "../services/categoriesService";
import { fetchUsers } from "../services/userService";
import { MONTH_NAMES } from "../constants";
import { formatMonth } from "../utils/dates";

// Option dei 12 mesi nel formato richiesto dal backend (MM): il filtro è per mese,
// indipendentemente dall'anno.
const MONTH_OPTIONS = MONTH_NAMES.map((name, i) => {
  const mm = String(i + 1).padStart(2, "0");
  return { value: mm, label: name };
});

const formatAmount = (value) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
    Number(value) || 0,
  );

// --- Card riepilogativa di un totale --------------------------------------
const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm">
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${accent}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  </div>
);

export const Stats = () => {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;

  // Filtri applicati alla query: mese (YYYY-MM), categoria, dipendente
  const [filters, setFilters] = useState({
    mese: "",
    category_id: "",
    employee_id: "",
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    enabled: isAdmin,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    enabled: isAdmin,
  });

  const {
    data: stats = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["refund-stats", filters],
    queryFn: () => fetchRefundStats(filters),
    enabled: isAdmin,
  });

  // Solo i dipendenti (non admin) possono presentare richieste
  const employeeOptions = useMemo(
    () =>
      users
        .filter((u) => !u.isAdmin)
        .map((u) => ({
          value: u.id,
          label: `${u.name ?? ""} ${u.surname ?? ""}`.trim() || u.email,
        })),
    [users],
  );

  // Totali complessivi calcolati sulle righe aggregate restituite dal backend
  const totals = useMemo(
    () =>
      stats.reduce(
        (acc, row) => ({
          numeroRichieste: acc.numeroRichieste + (Number(row.numeroRichieste) || 0),
          totaleRichiesto: acc.totaleRichiesto + (Number(row.totaleRichiesto) || 0),
          totaleApprovato: acc.totaleApprovato + (Number(row.totaleApprovato) || 0),
          totaleLiquidato: acc.totaleLiquidato + (Number(row.totaleLiquidato) || 0),
        }),
        { numeroRichieste: 0, totaleRichiesto: 0, totaleApprovato: 0, totaleLiquidato: 0 },
      ),
    [stats],
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () =>
    setFilters({ mese: "", category_id: "", employee_id: "" });

  const hasStats = stats.length > 0;

  // Le statistiche sono riservate ai responsabili amministrativi.
  // Il controllo definitivo è lato server; questo è solo coerenza dell'interfaccia.
  if (!isAdmin) {
    return (
      <div className="px-6 py-6">
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Accesso non autorizzato: solo i responsabili amministrativi possono
          visualizzare le statistiche.
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Statistiche rimborsi</h1>
        <p className="text-sm text-muted-foreground">
          Riepilogo delle richieste di rimborso aggregate per mese e categoria
        </p>
      </div>

      {/* Barra filtri: mese, categoria, dipendente */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4 shadow-sm">
        <div className="space-y-1.5">
          <Label htmlFor="filter-month">Mese</Label>
          <Select
            id="filter-month"
            name="mese"
            value={filters.mese}
            onChange={handleFilterChange}
            className="w-44"
          >
            <option value="">Tutti</option>
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-category">Categoria</Label>
          <Select
            id="filter-category"
            name="category_id"
            value={filters.category_id}
            onChange={handleFilterChange}
            className="w-44"
          >
            <option value="">Tutte</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-employee">Dipendente</Label>
          <Select
            id="filter-employee"
            name="employee_id"
            value={filters.employee_id}
            onChange={handleFilterChange}
            className="w-48"
          >
            <option value="">Tutti</option>
            {employeeOptions.map((emp) => (
              <option key={emp.value} value={emp.value}>
                {emp.label}
              </option>
            ))}
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={resetFilters}>
          Azzera filtri
        </Button>
      </div>

      {isLoading && <Loader />}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Errore: {error.message}
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Card riepilogative dei totali complessivi */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={FileText}
              label="Richieste presentate"
              value={totals.numeroRichieste}
              accent="bg-muted text-foreground"
            />
            <StatCard
              icon={Receipt}
              label="Totale richiesto"
              value={formatAmount(totals.totaleRichiesto)}
              accent="bg-blue-100 text-blue-700"
            />
            <StatCard
              icon={CheckCircle2}
              label="Totale approvato"
              value={formatAmount(totals.totaleApprovato)}
              accent="bg-amber-100 text-amber-700"
            />
            <StatCard
              icon={Wallet}
              label="Totale liquidato"
              value={formatAmount(totals.totaleLiquidato)}
              accent="bg-green-100 text-green-700"
            />
          </div>

          {/* Tabella di dettaglio per mese e categoria */}
          {hasStats ? (
            <div className="rounded-lg border bg-card overflow-x-auto shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Mese</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3 text-right">N. richieste</th>
                    <th className="px-4 py-3 text-right">Totale richiesto</th>
                    <th className="px-4 py-3 text-right">Totale approvato</th>
                    <th className="px-4 py-3 text-right">Totale liquidato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.map((row) => (
                    <tr
                      key={`${row.mese}__${row.categoriaId}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatMonth(row.mese)}
                      </td>
                      <td className="px-4 py-3">{row.categoria || "—"}</td>
                      <td className="px-4 py-3 text-right">{row.numeroRichieste}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {formatAmount(row.totaleRichiesto)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {formatAmount(row.totaleApprovato)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {formatAmount(row.totaleLiquidato)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/50 font-semibold">
                    <td className="px-4 py-3" colSpan={2}>
                      Totale complessivo
                    </td>
                    <td className="px-4 py-3 text-right">{totals.numeroRichieste}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {formatAmount(totals.totaleRichiesto)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {formatAmount(totals.totaleApprovato)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {formatAmount(totals.totaleLiquidato)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nessun dato disponibile per i filtri selezionati.
            </p>
          )}
        </>
      )}
    </div>
  );
};
