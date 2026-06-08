import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import Loader from "../components/Loader";
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
} from "../services/clientsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Modal from "@/components/Modal";
import { showSuccess } from "@/utils/toast";
import { CLIENT_COLUMN_LABELS } from "../constants/columnLabels";
import { Edit, Trash, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { sortByField } from "../utils/sortHelpers";

const ClientForm = ({ initialData, onSubmit, error }) => {
  const [formState, setFormState] = useState({
    name: initialData?.name || "",
    via: initialData?.via || "",
    comune: initialData?.comune || "",
    provincia: initialData?.provincia || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    note: initialData?.note || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          value={formState.name}
          onChange={handleChange}
          placeholder="Inserisci il nome..."
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="via">Via</Label>
        <Input
          id="via"
          name="via"
          value={formState.via}
          onChange={handleChange}
          placeholder="Inserisci la via..."
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="comune">Comune</Label>
          <Input
            id="comune"
            name="comune"
            value={formState.comune}
            onChange={handleChange}
            placeholder="Comune..."
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="provincia">Provincia</Label>
          <Input
            id="provincia"
            name="provincia"
            value={formState.provincia}
            onChange={handleChange}
            placeholder="Es. MI"
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Telefono</Label>
        <Input
          id="phone"
          name="phone"
          value={formState.phone}
          onChange={handleChange}
          placeholder="Inserisci il numero di telefono..."
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          name="email"
          value={formState.email}
          onChange={handleChange}
          placeholder="Inserisci la email..."
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">Note</Label>
        <Textarea
          id="note"
          name="note"
          value={formState.note}
          onChange={handleChange}
          placeholder="Note aggiuntive..."
          rows={3}
        />
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

const ClientDetails = ({ client }) => {
  if (!client) return null;

  const fields = [
    { label: "Nome", value: client.name },
    { label: "Via", value: client.via },
    { label: "Comune", value: client.comune },
    { label: "Provincia", value: client.provincia },
    { label: "Telefono", value: client.phone },
    { label: "Email", value: client.email },
    { label: "Note", value: client.note },
  ];

  return (
    <div className="space-y-3">
      {fields.filter((f) => f.value).map((f) => (
        <div key={f.label} className="flex gap-2 text-sm">
          <span className="font-medium text-muted-foreground min-w-20">{f.label}</span>
          <span>{f.value}</span>
        </div>
      ))}
    </div>
  );
};

const SortIcon = ({ field, sortField, sortDirection }) => {
  if (sortField !== field) return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
  return sortDirection === "asc"
    ? <ChevronUp className="h-3.5 w-3.5 text-foreground" />
    : <ChevronDown className="h-3.5 w-3.5 text-foreground" />;
};

export const Clients = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("desc");
  const queryClient = useQueryClient();

  const SORT_CONFIG = {
    name: { type: "string" },
    via: { type: "string" },
    comune: { type: "string" },
    provincia: { type: "string" },
  };

  const handleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection("desc");
      return;
    }
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleDelete = async (client) => {
    const clientId = client.id || client._id;
    if (!clientId) return;

    const confirmDelete = window.confirm(
      `Sei sicuro di voler eliminare il cliente ${client.name}?`,
    );
    if (!confirmDelete) return;

    try {
      setFormError(null);
      await deleteClient(clientId);
      showSuccess("Cliente eliminato con successo");
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
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
        await updateClient(editingItem.id, formData);
        showSuccess("Cliente aggiornato con successo");
      } else {
        await createClient(formData);
        showSuccess("Cliente creato con successo");
      }
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
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
    data: clients,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: () => fetchClients(),
  });

  const hasClients = clients && clients.length > 0;

  const sortedClients =
    hasClients && sortField
      ? sortByField(clients, sortField, sortDirection, SORT_CONFIG)
      : clients || [];

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clienti</h1>
          <p className="text-sm text-muted-foreground">
            Visualizza, modifica e elimina i clienti
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setFormError(null);
            setIsModalOpen(true);
          }}
        >
          Aggiungi cliente
        </Button>
      </div>

      {isLoading && <Loader />}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Errore: {error.message}
        </div>
      )}

      {hasClients && (
        <div className="rounded-lg border bg-card overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {CLIENT_COLUMN_LABELS.id}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort("name")}
                  title="Clicca per ordinare per nome"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {CLIENT_COLUMN_LABELS.name}
                    <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort("via")}
                  title="Clicca per ordinare per via"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {CLIENT_COLUMN_LABELS.via}
                    <SortIcon field="via" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort("comune")}
                  title="Clicca per ordinare per comune"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {CLIENT_COLUMN_LABELS.comune}
                    <SortIcon field="comune" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort("provincia")}
                  title="Clicca per ordinare per provincia"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {CLIENT_COLUMN_LABELS.provincia}
                    <SortIcon field="provincia" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {CLIENT_COLUMN_LABELS.phone}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {CLIENT_COLUMN_LABELS.email}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {CLIENT_COLUMN_LABELS.note}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedClients.map((client) => (
                <tr
                  key={client.id || client._id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td
                    className="px-4 py-3 font-medium text-primary cursor-pointer hover:underline"
                    onClick={() => {
                      setSelectedClient(client);
                      setIsViewModalOpen(true);
                    }}
                  >
                    {client.id}
                  </td>
                  <td className="px-4 py-3 font-medium">{client.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.via}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.comune}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.provincia}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.email}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-37.5 truncate">{client.note}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditingItem(client);
                          setFormError(null);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => handleDelete(client)}
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

      {!isLoading && !error && !hasClients && (
        <p className="text-sm text-muted-foreground">
          Nessun cliente presente nel database.
        </p>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          setFormError(null);
        }}
        title={editingItem ? "Modifica cliente" : "Nuovo cliente"}
      >
        <ClientForm
          initialData={editingItem}
          onSubmit={handleSubmit}
          error={formError}
        />
      </Modal>
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedClient(null);
        }}
        title="Dettagli cliente"
      >
        <ClientDetails client={selectedClient} />
      </Modal>
    </div>
  );
};
