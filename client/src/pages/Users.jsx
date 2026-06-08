import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import Loader from "../components/Loader";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/Modal";
import { showSuccess } from "../utils/toast";
import { USERS_COLUMN_LABELS } from "../constants/columnLabels";
import { Edit, Trash, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { sortByField } from "../utils/sortHelpers";

const UsersForm = ({ initialData, onSubmit, error }) => {
  const [formState, setFormState] = useState({
    email: initialData?.email || "",
    password: initialData?.password || "",
    isAdmin: initialData?.isAdmin ?? false,
  });

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          name="email"
          value={formState.email}
          onChange={handleChange}
          placeholder="nome@esempio.it"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          name="password"
          value={formState.password}
          onChange={handleChange}
          placeholder={initialData ? "Cambia password" : "••••••••"}
          required={!initialData}
        />
        {initialData && (
          <p className="text-xs text-muted-foreground">Lascia vuoto per mantenere la password attuale.</p>
        )}
      </div>
      <div className="flex items-center gap-3 rounded-md border border-input px-3 py-2.5">
        <input
          type="checkbox"
          id="isAdmin"
          name="isAdmin"
          checked={!!formState.isAdmin}
          onChange={handleChange}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <Label htmlFor="isAdmin" className="cursor-pointer">
          Utente amministratore
        </Label>
      </div>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
      <div className="flex justify-end space-x-2 pt-1">
        <Button type="submit" size="sm">
          Salva
        </Button>
      </div>
    </form>
  );
};

const SortIcon = ({ field, sortField, sortDirection }) => {
  if (sortField !== field) return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
  return sortDirection === "asc"
    ? <ChevronUp className="h-3.5 w-3.5 text-foreground" />
    : <ChevronDown className="h-3.5 w-3.5 text-foreground" />;
};

export const Users = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState(null);

  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("desc");

  const queryClient = useQueryClient();

  const SORT_CONFIG = {
    isAdmin: { type: "boolean" },
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

  const handleDelete = async (user) => {
    const userId = user.id || user._id;
    if (!userId) return;

    const confirmDelete = window.confirm(
      `Sei sicuro di voler eliminare l'utente ${user.email}?`,
    );
    if (!confirmDelete) return;

    try {
      setFormError(null);
      await deleteUser(userId);
      showSuccess("Utente eliminato con successo");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Si è verificato un errore durante l'eliminazione";
      setFormError(message);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setFormError(null);
      if (editingItem) {
        await updateUser(editingItem.id, formData);
        showSuccess("Utente aggiornato con successo");
      } else {
        await createUser(formData);
        showSuccess("Utente creato con successo");
      }
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Si è verificato un errore imprevisto";
      setFormError(message);
    }
  };

  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers(),
  });

  const hasUsers = users && users.length > 0;

  const sortedUsers =
    hasUsers && sortField
      ? sortByField(users, sortField, sortDirection, SORT_CONFIG)
      : users || [];

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Utenti</h1>
          <p className="text-sm text-muted-foreground">
            Visualizza, modifica e elimina gli utenti
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setFormError(null);
            setIsModalOpen(true);
          }}
        >
          Aggiungi utente
        </Button>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Azioni
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
                  <td className="px-4 py-3 font-medium">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.isAdmin ? (
                      <Badge variant="indigo">Admin</Badge>
                    ) : (
                      <Badge variant="muted">Utente</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditingItem(user);
                          setFormError(null);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash />
                      </Button>
                    </div>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          setFormError(null);
        }}
        title={editingItem ? "Modifica utente" : "Nuovo utente"}
      >
        <UsersForm
          initialData={editingItem}
          onSubmit={handleSubmit}
          error={formError}
        />
      </Modal>
    </div>
  );
};
