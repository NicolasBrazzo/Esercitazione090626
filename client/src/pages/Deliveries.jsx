import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import Loader from "../components/Loader";
import {
  fetchDeliveries,
  createDelivery,
  updateDelivery,
  deleteDelivery,
} from "../services/deliveriesService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/Modal";
import { fetchClients } from "../services/clientsService";
import { showSuccess } from "@/utils/toast";
import { DELIVERY_COLUMN_LABELS } from "../constants/columnLabels";
import { Edit, Trash } from "lucide-react";

const STATUS_CONFIG = {
  da_ritirare: { label: "Da ritirare", variant: "warning" },
  in_deposito: { label: "In deposito", variant: "info" },
  in_consegna: { label: "In consegna", variant: "indigo" },
  consegnato: { label: "Consegnato", variant: "success" },
  in_giacenza: { label: "In giacenza", variant: "muted" },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status];
  if (!config) return <span className="text-muted-foreground text-xs">{status}</span>;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const DeliveryForm = ({ initialData, onSubmit, error }) => {
  const [formState, setFormState] = useState({
    client_id: initialData?.client_id || "",
    collection_date: initialData?.collection_date || "",
    delivery_date: initialData?.delivery_date || "",
    status: initialData?.status || "",
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => fetchClients(),
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
        <Label htmlFor="client_id">Cliente</Label>
        <Select
          id="client_id"
          name="client_id"
          value={formState.client_id}
          onChange={handleChange}
          required
        >
          <option value="">Seleziona un cliente</option>
          {clients?.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="collection_date">Data di raccolta</Label>
          <Input
            id="collection_date"
            type="date"
            name="collection_date"
            value={formState.collection_date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="delivery_date">Data di consegna</Label>
          <Input
            id="delivery_date"
            type="date"
            name="delivery_date"
            value={formState.delivery_date}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">Stato</Label>
        <Select
          id="status"
          name="status"
          value={formState.status}
          onChange={handleChange}
          required
        >
          <option value="">Seleziona uno stato</option>
          {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
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

const DeliveryDetails = ({ delivery }) => {
  if (!delivery) return null;

  const fields = [
    { label: "ID", value: delivery.id },
    { label: "Cliente", value: delivery.client_id },
    { label: "Data raccolta", value: delivery.collection_date },
    { label: "Data consegna", value: delivery.delivery_date },
  ];

  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <div key={f.label} className="flex gap-2 text-sm">
          <span className="font-medium text-muted-foreground min-w-24">{f.label}</span>
          <span>{f.value}</span>
        </div>
      ))}
      <div className="flex gap-2 text-sm">
        <span className="font-medium text-muted-foreground min-w-24">Stato</span>
        <StatusBadge status={delivery.status} />
      </div>
    </div>
  );
};

export const Deliveries = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => fetchClients(),
  });

  const handleDelete = async (delivery) => {
    const deliveryId = delivery.id || delivery._id;
    if (!deliveryId) return;

    const confirmDelete = window.confirm(
      `Sei sicuro di voler eliminare la consegna ${delivery.id}?`,
    );
    if (!confirmDelete) return;

    try {
      setFormError(null);
      await deleteDelivery(deliveryId);
      showSuccess("Consegna eliminata con successo");
      await queryClient.invalidateQueries({ queryKey: ["deliveries"] });
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
        await updateDelivery(editingItem.id, formData);
        showSuccess("Consegna aggiornata con successo");
      } else {
        await createDelivery(formData);
        showSuccess("Consegna creata con successo");
      }
      await queryClient.invalidateQueries({ queryKey: ["deliveries"] });
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
    data: deliveries,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["deliveries", { status: statusFilter, id_client: clientFilter }],
    queryFn: () =>
      fetchDeliveries({
        status: statusFilter || undefined,
        id_client: clientFilter || undefined,
      }),
  });

  const hasDeliveries = deliveries && deliveries.length > 0;

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Consegne</h1>
          <p className="text-sm text-muted-foreground">
            Visualizza, filtra, modifica e elimina le consegne
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">Filtro per stato</Label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-40"
            >
              <option value="">Tutti gli stati</option>
              {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Filtro per cliente</Label>
            <Select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="min-w-44"
            >
              <option value="">Tutti i clienti</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.id} - {client.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            onClick={() => {
              setEditingItem(null);
              setFormError(null);
              setIsModalOpen(true);
            }}
          >
            Aggiungi consegna
          </Button>
        </div>
      </div>

      {isLoading && <Loader />}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Errore: {error.message}
        </div>
      )}

      {hasDeliveries && (
        <div className="rounded-lg border bg-card overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {DELIVERY_COLUMN_LABELS.id}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {DELIVERY_COLUMN_LABELS.client_name}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {DELIVERY_COLUMN_LABELS.collection_date}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {DELIVERY_COLUMN_LABELS.delivery_date}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {DELIVERY_COLUMN_LABELS.status}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {DELIVERY_COLUMN_LABELS.delivery_key}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deliveries.map((delivery) => (
                <tr
                  key={delivery.id || delivery._id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td
                    className="px-4 py-3 font-medium text-primary cursor-pointer hover:underline"
                    onClick={() => {
                      setSelectedDelivery(delivery);
                      setIsViewModalOpen(true);
                    }}
                  >
                    {delivery.id}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {clients?.find((c) => c.id === delivery.client_id)?.name ||
                      delivery.client_id}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {delivery.collection_date}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {delivery.delivery_date}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={delivery.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {delivery.delivery_key}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditingItem(delivery);
                          setFormError(null);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => handleDelete(delivery)}
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

      {!isLoading && !error && !hasDeliveries && (
        <p className="text-sm text-muted-foreground">
          Nessuna consegna presente nel database.
        </p>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          setFormError(null);
        }}
        title={editingItem ? "Modifica consegna" : "Nuova consegna"}
      >
        <DeliveryForm
          initialData={editingItem}
          onSubmit={handleSubmit}
          error={formError}
        />
      </Modal>
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedDelivery(null);
        }}
        title="Dettagli consegna"
      >
        <DeliveryDetails delivery={selectedDelivery} />
      </Modal>
    </div>
  );
};
