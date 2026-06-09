import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle2,
  Wallet,
  Hourglass,
  Receipt,
  BarChart3,
  Plus,
  ArrowRight,
} from "lucide-react";

import Loader from "../components/Loader";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { fetchRequests } from "../services/requestsService";

const formatAmount = (value) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
    Number(value) || 0,
  );

// Iniziali dell'utente per l'avatar (fallback sulla prima lettera dell'email)
const getInitials = (name, email) => {
  const source = (name || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

// --- Card KPI -------------------------------------------------------------
const KpiCard = ({ icon: Icon, label, value, hint, accent }) => (
  <div className="flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm">
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${accent}`}
    >
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-semibold leading-tight">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  </div>
);

// --- Scorciatoia verso una sezione ----------------------------------------
const QuickLink = ({ to, icon: Icon, title, description }) => (
  <Link
    to={to}
    className="group flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
  >
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
  </Link>
);

export const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;

  const {
    data: requests = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["requests", {}],
    queryFn: () => fetchRequests({}),
  });

  // KPI calcolati sulle richieste di competenza dell'utente autenticato:
  // il backend restituisce solo le proprie richieste al dipendente e tutte all'admin.
  const kpi = useMemo(() => {
    const acc = {
      total: requests.length,
      inAttesa: 0,
      approvate: 0,
      rifiutate: 0,
      liquidate: 0,
      totaleRichiesto: 0,
      totaleApprovato: 0,
      totaleLiquidato: 0,
    };
    for (const r of requests) {
      const amount = Number(r.amount) || 0;
      acc.totaleRichiesto += amount;
      switch (r.status) {
        case "in_attesa":
          acc.inAttesa += 1;
          break;
        case "approvata":
          acc.approvate += 1;
          acc.totaleApprovato += amount;
          break;
        case "rifiutata":
          acc.rifiutate += 1;
          break;
        case "liquidata":
          acc.liquidate += 1;
          acc.totaleApprovato += amount;
          acc.totaleLiquidato += amount;
          break;
        default:
          break;
      }
    }
    return acc;
  }, [requests]);

  const displayName = user?.name?.trim() || user?.email || "Utente";

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Intestazione utente: nome, email e ruolo */}
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {getInitials(user?.name, user?.email)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">{displayName}</h1>
            <p className="truncate text-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ruolo:</span>
          <Badge variant={isAdmin ? "info" : "muted"}>
            {isAdmin ? "Responsabile amministrativo" : "Dipendente"}
          </Badge>
        </div>
      </div>

      {isLoading && <Loader />}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Errore nel caricamento dei dati: {error.message}
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Area dedicata al ruolo */}
          {isAdmin ? (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Area amministrativa</h2>
                <p className="text-sm text-muted-foreground">
                  Panoramica di tutte le richieste di rimborso aziendali
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  icon={FileText}
                  label="Richieste totali"
                  value={kpi.total}
                  hint="Tutte le richieste ricevute"
                  accent="bg-muted text-foreground"
                />
                <KpiCard
                  icon={Hourglass}
                  label="Da valutare"
                  value={kpi.inAttesa}
                  hint="In attesa di approvazione"
                  accent="bg-amber-100 text-amber-700"
                />
                <KpiCard
                  icon={CheckCircle2}
                  label="Da liquidare"
                  value={kpi.approvate}
                  hint={`Approvate per ${formatAmount(kpi.totaleApprovato - kpi.totaleLiquidato)}`}
                  accent="bg-blue-100 text-blue-700"
                />
                <KpiCard
                  icon={Wallet}
                  label="Totale liquidato"
                  value={formatAmount(kpi.totaleLiquidato)}
                  hint={`${kpi.liquidate} richieste liquidate`}
                  accent="bg-green-100 text-green-700"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <QuickLink
                  to="/requests"
                  icon={FileText}
                  title="Gestisci le richieste"
                  description="Approva, rifiuta e liquida le richieste di rimborso"
                />
                <QuickLink
                  to="/stats"
                  icon={BarChart3}
                  title="Statistiche e riepiloghi"
                  description="Dati aggregati per mese, categoria e dipendente"
                />
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Le tue richieste</h2>
                <p className="text-sm text-muted-foreground">
                  Riepilogo delle tue richieste di rimborso spese
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  icon={FileText}
                  label="Richieste totali"
                  value={kpi.total}
                  hint={`Totale richiesto ${formatAmount(kpi.totaleRichiesto)}`}
                  accent="bg-muted text-foreground"
                />
                <KpiCard
                  icon={Clock}
                  label="In attesa"
                  value={kpi.inAttesa}
                  hint="In valutazione"
                  accent="bg-amber-100 text-amber-700"
                />
                <KpiCard
                  icon={CheckCircle2}
                  label="Approvate"
                  value={kpi.approvate}
                  hint="In attesa di liquidazione"
                  accent="bg-blue-100 text-blue-700"
                />
                <KpiCard
                  icon={Wallet}
                  label="Rimborsato"
                  value={formatAmount(kpi.totaleLiquidato)}
                  hint={`${kpi.liquidate} richieste liquidate`}
                  accent="bg-green-100 text-green-700"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <QuickLink
                  to="/requests"
                  icon={Plus}
                  title="Nuova richiesta"
                  description="Inserisci una nuova richiesta di rimborso"
                />
                <QuickLink
                  to="/requests"
                  icon={Receipt}
                  title="Le mie richieste"
                  description="Visualizza, modifica ed elimina le tue richieste"
                />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
