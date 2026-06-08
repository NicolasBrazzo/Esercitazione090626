import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Truck, Users, UserCog, MapPin, ArrowRight } from "lucide-react";

import { fetchClients } from "../services/clientsService";
import { fetchDeliveries } from "../services/deliveriesService";
import { fetchUsers } from "../services/userService";
import { Button } from "@/components/ui/button";

export const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const {
    data: clients,
    isLoading: loadingClients,
    error: clientsError,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: () => fetchClients(),
  });

  const {
    data: deliveries,
    isLoading: loadingDeliveries,
    error: deliveriesError,
  } = useQuery({
    queryKey: ["deliveries", { status: "", id_client: "" }],
    queryFn: () => fetchDeliveries(),
  });

  const {
    data: users,
    isLoading: loadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers(),
    enabled: !!user?.isAdmin,
  });

  if (loading) return <p>loading...</p>;
  if (!user) return <p>Accesso negato</p>;

  const totalClients = clients?.length ?? 0;
  const totalDeliveries = deliveries?.length ?? 0;
  const totalUsers = users?.length ?? 0;

  const inDeliveryCount =
    deliveries?.filter((d) => d.status === "in_consegna").length ?? 0;
  const toPickupCount =
    deliveries?.filter((d) => d.status === "da_ritirare").length ?? 0;
  const deliveredCount =
    deliveries?.filter((d) => d.status === "consegnato").length ?? 0;

  const hasAnyError = clientsError || deliveriesError || usersError;

  return (
    <div className="px-6 py-6 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Panoramica generale delle attività del gestionale.
          </p>
          <p className="mt-1 text-sm">
            Utente:{" "}
            <span className="font-medium">{user.email}</span>
            {user.isAdmin && (
              <span className="ml-2 inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/20">
                Admin
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => logout()}>
          Logout
        </Button>
      </div>

      {hasAnyError && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive ring-1 ring-inset ring-destructive/20">
          Si è verificato un errore nel caricamento dei dati della dashboard.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div
          className="cursor-pointer rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-border/80 group"
          onClick={() => navigate("/deliveries")}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Truck className="h-4 w-4 text-muted-foreground" />
            </div>
            {loadingDeliveries ? (
              <span className="text-xs text-muted-foreground">Caricamento...</span>
            ) : (
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          <p className="text-2xl font-semibold">{totalDeliveries}</p>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Consegne</p>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>In consegna</span>
              <span className="font-semibold text-foreground">{inDeliveryCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Da ritirare</span>
              <span className="font-semibold text-foreground">{toPickupCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Consegnate</span>
              <span className="font-semibold text-foreground">{deliveredCount}</span>
            </div>
          </div>
        </div>

        <div
          className="cursor-pointer rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-border/80 group"
          onClick={() => navigate("/clients")}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            {loadingClients ? (
              <span className="text-xs text-muted-foreground">Caricamento...</span>
            ) : (
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          <p className="text-2xl font-semibold">{totalClients}</p>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Clienti</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Elenco completo dei clienti registrati nel sistema.
          </p>
        </div>

        {user?.isAdmin && (
          <div
            className="cursor-pointer rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-border/80 group"
            onClick={() => navigate("/users")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <UserCog className="h-4 w-4 text-muted-foreground" />
              </div>
              {loadingUsers ? (
                <span className="text-xs text-muted-foreground">Caricamento...</span>
              ) : (
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            <p className="text-2xl font-semibold">{totalUsers}</p>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">Utenti</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Gestione degli account con accesso alla piattaforma.
            </p>
          </div>
        )}

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Tracking rapido</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Cerca lo stato di una consegna tramite codice spedizione.
          </p>
          <div className="mt-4">
            <Button size="sm" onClick={() => navigate("/delivery-track")}>
              Vai al tracking
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
