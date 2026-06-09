import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import { fetchUsers } from "../services/userService";
import { Badge } from "@/components/ui/badge";
import { USERS_COLUMN_LABELS } from "../constants/columnLabels";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { sortByField } from "../utils/sortHelpers";

const SortIcon = ({ field, sortField, sortDirection }) => {
  if (sortField !== field) return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
  return sortDirection === "asc"
    ? <ChevronUp className="h-3.5 w-3.5 text-foreground" />
    : <ChevronDown className="h-3.5 w-3.5 text-foreground" />;
};

export const Users = () => {
  const { user: currentUser, loading: authLoading } = useAuth();

  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("desc");

  const SORT_CONFIG = {
    isAdmin: { type: "boolean" },
    name: { type: "string" },
    surname: { type: "string" },
    email: { type: "string" },
  };

  const handleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection("desc");
      return;
    }
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const isAdmin = !!currentUser?.isAdmin;

  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers(),
    enabled: isAdmin,
  });

  // Pagina riservata agli amministratori: gli altri utenti vengono reindirizzati
  if (authLoading) return <Loader />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const hasUsers = users && users.length > 0;

  const sortedUsers =
    hasUsers && sortField
      ? sortByField(users, sortField, sortDirection, SORT_CONFIG)
      : users || [];

  return (
    <div className="px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Utenti</h1>
        <p className="text-sm text-muted-foreground">
          Visualizza tutti gli utenti registrati
        </p>
      </div>

      {isLoading && <Loader />}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Errore: {error.message}
        </div>
      )}

      {hasUsers && (
        <div className="rounded-lg border bg-card overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {USERS_COLUMN_LABELS.id}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort("name")}
                  title="Clicca per ordinare per nome"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {USERS_COLUMN_LABELS.name}
                    <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort("surname")}
                  title="Clicca per ordinare per cognome"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {USERS_COLUMN_LABELS.surname}
                    <SortIcon field="surname" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort("email")}
                  title="Clicca per ordinare per email"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {USERS_COLUMN_LABELS.email}
                    <SortIcon field="email" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort("isAdmin")}
                  title="Clicca per ordinare per tipo utente"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {USERS_COLUMN_LABELS.isAdmin}
                    <SortIcon field="isAdmin" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedUsers.map((user) => (
                <tr
                  key={user.id || user._id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 text-muted-foreground">{user.id}</td>
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 font-medium">{user.surname}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.isAdmin ? (
                      <Badge variant="indigo">Admin</Badge>
                    ) : (
                      <Badge variant="muted">Utente</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !error && !hasUsers && (
        <p className="text-sm text-muted-foreground">
          Nessuno utente presente nel database.
        </p>
      )}
    </div>
  );
};
