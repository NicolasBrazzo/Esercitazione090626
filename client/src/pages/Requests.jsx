import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Edit,
  Trash,
  Check,
  X,
  Wallet,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { sortByField } from "../utils/sortHelpers";

import Loader from "../components/Loader";
import Modal from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "../context/AuthContext";
import { showSuccess, showError } from "../utils/toast";
import { REQUEST_COLUMN_LABELS } from "../constants/columnLabels";
import {
  fetchRequests,
  createRequest,
  updateRequest,
  deleteRequest,
  approveRequest,
  rejectRequest,
  settleRequest,
} from "../services/requestsService";
import { fetchCategories } from "../services/categoriesService";

// Mappatura stati -> etichetta + variante badge
const STATUS_META = {
  in_attesa: { label: "In attesa", variant: "warning" },
  approvata: { label: "Approvata", variant: "info" },
  rifiutata: { label: "Rifiutata", variant: "destructive" },
  liquidata: { label: "Liquidata", variant: "success" },
};

const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

// Etichetta leggibile di una categoria (colonna non nota a priori)
const categoryLabel = (cat) =>
  cat?.description ?? cat?.descrizione ?? cat?.name ?? cat?.nome ?? `#${cat?.id}`;

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("it-IT");
};

const formatAmount = (value) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
    Number(value) || 0,
  );

const SortIcon = ({ field, sortField, sortDirection }) => {
  if (sortField !== field) return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
  return sortDirection === "asc"
    ? <ChevronUp className="h-3.5 w-3.5 text-foreground" />
    : <ChevronDown className="h-3.5 w-3.5 text-foreground" />;
};

// --- Form di creazione / modifica richiesta -------------------------------
const RequestForm = ({ initialData, categories, onSubmit, error }) => {
  const [formState, setFormState] = useState({
    expense_date: initialData?.expense_date
      ? String(initialData.expense_date).slice(0, 10)
      : "",
    category_id: initialData?.category_id ?? "",
    amount: initialData?.amount ?? "",
    description: initialData?.description ?? "",
    receipt_reference: initialData?.receipt_reference ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formState);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="expense_date">Data spesa</Label>
        <Input
          id="expense_date"
          type="date"
          name="expense_date"
          value={formState.expense_date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category_id">Categoria</Label>
        <Select
          id="category_id"
          name="category_id"
          value={formState.category_id}
          onChange={handleChange}
          required
        >
          <option value="" disabled>
            Seleziona una categoria
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {categoryLabel(cat)}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">Importo (€)</Label>
        <Input
          id="amount"
          type="number"
          name="amount"
          min="0.01"
          step="0.01"
          value={formState.amount}
          onChange={handleChange}
          placeholder="0,00"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descrizione</Label>
        <Textarea
          id="description"
          name="description"
          value={formState.description}
          onChange={handleChange}
          placeholder="Descrizione della spesa sostenuta"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="receipt_reference">Riferimento giustificativo (opzionale)</Label>
        <Input
          id="receipt_reference"
          name="receipt_reference"
          value={formState.receipt_reference}
          onChange={handleChange}
          placeholder="Es. n. ricevuta / fattura"
        />
      </div>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <div className="flex justify-end space-x-2 pt-1">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Salvataggio..." : "Salva"}
        </Button>
      </div>
    </form>
  );
};

// --- Form di rifiuto (motivazione) ----------------------------------------
const RejectForm = ({ onSubmit, error }) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(reason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="rejection_reason">Motivazione (opzionale)</Label>
        <Textarea
          id="rejection_reason"
          name="rejection_reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Indica il motivo del rifiuto"
        />
      </div>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <div className="flex justify-end space-x-2 pt-1">
        <Button type="submit" size="sm" variant="destructive" disabled={submitting}>
          {submitting ? "Rifiuto..." : "Rifiuta richiesta"}
        </Button>
      </div>
    </form>
  );
};

// --- Dettaglio richiesta (sola lettura) -----------------------------------
const DetailRow = ({ label, children }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
    <span className="text-sm">{children ?? "—"}</span>
  </div>
);

const RequestDetail = ({ request }) => {
  const meta = STATUS_META[request.status] || {
    label: request.status,
    variant: "muted",
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <DetailRow label={REQUEST_COLUMN_LABELS.expense_date}>
        {formatDate(request.expense_date)}
      </DetailRow>
      <DetailRow label={REQUEST_COLUMN_LABELS.amount}>
        {formatAmount(request.amount)}
      </DetailRow>
      <DetailRow label={REQUEST_COLUMN_LABELS.category}>
        {request.category_name}
      </DetailRow>
      <DetailRow label={REQUEST_COLUMN_LABELS.employee}>
        {request.employee_name}
      </DetailRow>
      <DetailRow label={REQUEST_COLUMN_LABELS.status}>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </DetailRow>
      <DetailRow label="Riferimento giustificativo">
        {request.receipt_reference}
      </DetailRow>
      <DetailRow label={REQUEST_COLUMN_LABELS.evaluation_date}>
        {formatDate(request.evaluation_date)}
      </DetailRow>
      <DetailRow label={REQUEST_COLUMN_LABELS.settlement_date}>
        {formatDate(request.settlement_date)}
      </DetailRow>
      <div className="col-span-2">
        <DetailRow label={REQUEST_COLUMN_LABELS.description}>
          {request.description}
        </DetailRow>
      </div>
      {request.status === "rifiutata" && request.rejection_reason && (
        <div className="col-span-2">
          <DetailRow label="Motivazione rifiuto">
            {request.rejection_reason}
          </DetailRow>
        </div>
      )}
    </div>
  );
};

export const Requests = () => {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;
  const queryClient = useQueryClient();

  // Filtri applicati immediatamente (select) che pilotano la query
  const [filters, setFilters] = useState({
    status: "",
    category_id: "",
    employee_id: "",
    from: "",
    to: "",
  });

  // Bozza dell'intervallo date: applicata solo premendo "Cerca"
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState(null);

  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectError, setRejectError] = useState(null);

  const [detailItem, setDetailItem] = useState(null);

  // Ordinamento tabella (escluse colonne Stato e Azioni)
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("desc");

  const SORT_CONFIG = {
    expense_date: { type: "date" },
    category_name: { type: "string" },
    amount: { type: "number" },
    description: { type: "string" },
    employee_name: { type: "string" },
    evaluation_date: { type: "date" },
    settlement_date: { type: "date" },
  };

  const handleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection("desc");
      return;
    }
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const {
    data: requests = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["requests", filters],
    queryFn: () => fetchRequests(filters),
  });

  const hasRequests = requests.length > 0;

  const sortedRequests = sortField
    ? sortByField(requests, sortField, sortDirection, SORT_CONFIG)
    : requests;

  // Opzioni dipendente per il filtro admin, derivate dalle richieste caricate
  const employeeOptions = useMemo(() => {
    if (!isAdmin) return [];
    const map = new Map();
    requests.forEach((r) => {
      if (r.employee_id && !map.has(r.employee_id)) {
        map.set(r.employee_id, r.employee_name || r.employee_id);
      }
    });
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [isAdmin, requests]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  // Intervallo non valido: data iniziale successiva alla finale
  const invalidDateRange =
    dateRange.from && dateRange.to && dateRange.from > dateRange.to;

  const applyDateRange = () => {
    if (invalidDateRange) return;
    setFilters((prev) => ({ ...prev, from: dateRange.from, to: dateRange.to }));
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      category_id: "",
      employee_id: "",
      from: "",
      to: "",
    });
    setDateRange({ from: "", to: "" });
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["requests"] });

  const errMsg = (err, fallback) =>
    err?.response?.data?.error || err?.message || fallback;

  const handleSubmit = async (formData) => {
    try {
      setFormError(null);
      if (editingItem) {
        await updateRequest(editingItem.id, formData);
        showSuccess("Richiesta aggiornata con successo");
      } else {
        await createRequest(formData);
        showSuccess("Richiesta creata con successo");
      }
      await invalidate();
      setIsFormOpen(false);
      setEditingItem(null);
    } catch (err) {
      setFormError(errMsg(err, "Si è verificato un errore imprevisto"));
    }
  };

  const handleDelete = async (request) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa richiesta?")) return;
    try {
      await deleteRequest(request.id);
      showSuccess("Richiesta eliminata con successo");
      await invalidate();
    } catch (err) {
      showError(errMsg(err, "Errore durante l'eliminazione"));
    }
  };

  const handleApprove = async (request) => {
    try {
      await approveRequest(request.id);
      showSuccess("Richiesta approvata");
      await invalidate();
    } catch (err) {
      showError(errMsg(err, "Errore durante l'approvazione"));
    }
  };

  const handleSettle = async (request) => {
    try {
      await settleRequest(request.id);
      showSuccess("Richiesta liquidata");
      await invalidate();
    } catch (err) {
      showError(errMsg(err, "Errore durante la liquidazione"));
    }
  };

  const handleReject = async (reason) => {
    try {
      setRejectError(null);
      await rejectRequest(rejectingItem.id, reason);
      showSuccess("Richiesta rifiutata");
      await invalidate();
      setRejectingItem(null);
    } catch (err) {
      setRejectError(errMsg(err, "Errore durante il rifiuto"));
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (request) => {
    setEditingItem(request);
    setFormError(null);
    setIsFormOpen(true);
  };
  const openRequestDetail = (request) => {
    setDetailItem(request);
  };

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Richieste di rimborso</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Visualizza, approva, rifiuta e liquida le richieste di rimborso"
              : "Crea e gestisci le tue richieste di rimborso spese"}
          </p>
        </div>
        {!isAdmin && <Button onClick={openCreate}>Nuova richiesta</Button>}
      </div>

      {/* Barra filtri */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4 shadow-sm">
        <div className="space-y-1.5">
          <Label htmlFor="filter-status">Stato</Label>
          <Select
            id="filter-status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-44"
          >
            <option value="">Tutti</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
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
                {categoryLabel(cat)}
              </option>
            ))}
          </Select>
        </div>

        {isAdmin && (
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
        )}

        <Button variant="outline" size="sm" onClick={resetFilters}>
          Azzera filtri
        </Button>
      </div>

      {/* Filtro per intervallo di date (applicato con "Cerca") */}
      <div className="space-y-2 rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium">Filtra per periodo</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="filter-from">Dal</Label>
            <Input
              id="filter-from"
              type="date"
              name="from"
              value={dateRange.from}
              max={dateRange.to || undefined}
              onChange={handleDateRangeChange}
              className="w-44"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-to">Al</Label>
            <Input
              id="filter-to"
              type="date"
              name="to"
              value={dateRange.to}
              min={dateRange.from || undefined}
              onChange={handleDateRangeChange}
              className="w-44"
            />
          </div>

          <Button size="sm" onClick={applyDateRange} disabled={invalidDateRange}>
            Cerca
          </Button>
        </div>
        {invalidDateRange && (
          <p className="text-sm text-destructive">
            La data iniziale non può essere successiva alla data finale.
          </p>
        )}
      </div>

      {isLoading && <Loader />}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Errore: {error.message}
        </div>
      )}

      {hasRequests && (
        <div className="rounded-lg border bg-card overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th
                  className="px-4 py-3 cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort("expense_date")}
                  title="Clicca per ordinare per data spesa"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {REQUEST_COLUMN_LABELS.expense_date}
                    <SortIcon field="expense_date" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort("category_name")}
                  title="Clicca per ordinare per categoria"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {REQUEST_COLUMN_LABELS.category}
                    <SortIcon field="category_name" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort("amount")}
                  title="Clicca per ordinare per importo"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {REQUEST_COLUMN_LABELS.amount}
                    <SortIcon field="amount" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort("description")}
                  title="Clicca per ordinare per descrizione"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {REQUEST_COLUMN_LABELS.description}
                    <SortIcon field="description" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </th>
                {isAdmin && (
                  <th
                    className="px-4 py-3 cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("employee_name")}
                    title="Clicca per ordinare per dipendente"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {REQUEST_COLUMN_LABELS.employee}
                      <SortIcon field="employee_name" sortField={sortField} sortDirection={sortDirection} />
                    </span>
                  </th>
                )}
                <th className="px-4 py-3">{REQUEST_COLUMN_LABELS.status}</th>
                <th
                  className="px-4 py-3 cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort("evaluation_date")}
                  title="Clicca per ordinare per data valutazione"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {REQUEST_COLUMN_LABELS.evaluation_date}
                    <SortIcon field="evaluation_date" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort("settlement_date")}
                  title="Clicca per ordinare per data liquidazione"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {REQUEST_COLUMN_LABELS.settlement_date}
                    <SortIcon field="settlement_date" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </th>
                <th className="px-4 py-3">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedRequests.map((request) => {
                const meta = STATUS_META[request.status] || {
                  label: request.status,
                  variant: "muted",
                };
                return (
                  <tr key={request.id} className="hover:bg-muted/30 transition-colors">
                    <td
                      className={`px-4 py-3 whitespace-nowrap${
                        isAdmin
                          ? " cursor-pointer text-blue-600 underline"
                          : ""
                      }`}
                      onClick={
                        isAdmin ? () => openRequestDetail(request) : undefined
                      }
                    >
                      {formatDate(request.expense_date)}
                    </td>
                    <td className="px-4 py-3">{request.category_name || "—"}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {formatAmount(request.amount)}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate" title={request.description}>
                      {request.description}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        {request.employee_name || "—"}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {request.status === "rifiutata" && request.rejection_reason && (
                        <p
                          className="mt-1 max-w-48 truncate text-xs text-muted-foreground"
                          title={request.rejection_reason}
                        >
                          {request.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(request.evaluation_date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(request.settlement_date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Azioni dipendente: solo sulle proprie richieste in attesa */}
                        {!isAdmin && request.status === "in_attesa" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Modifica"
                              onClick={() => openEdit(request)}
                            >
                              <Edit />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon-sm"
                              title="Elimina"
                              onClick={() => handleDelete(request)}
                            >
                              <Trash />
                            </Button>
                          </>
                        )}

                        {/* Azioni admin */}
                        {isAdmin && request.status === "in_attesa" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Approva"
                              onClick={() => handleApprove(request)}
                            >
                              <Check className="text-green-600" /> Approva
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Rifiuta"
                              onClick={() => {
                                setRejectError(null);
                                setRejectingItem(request);
                              }}
                            >
                              <X className="text-destructive" /> Rifiuta
                            </Button>
                          </>
                        )}

                        {isAdmin && request.status === "approvata" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Liquida"
                            onClick={() => handleSettle(request)}
                          >
                            <Wallet className="text-blue-600" /> Liquida
                          </Button>
                        )}

                        {/* Nessuna azione disponibile */}
                        {((!isAdmin && request.status !== "in_attesa") ||
                          (isAdmin &&
                            (request.status === "rifiutata" ||
                              request.status === "liquidata"))) && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !error && !hasRequests && (
        <p className="text-sm text-muted-foreground">
          Nessuna richiesta di rimborso trovata.
        </p>
      )}

      {/* Modale creazione / modifica */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
          setFormError(null);
        }}
        title={editingItem ? "Modifica richiesta" : "Nuova richiesta"}
      >
        <RequestForm
          initialData={editingItem}
          categories={categories}
          onSubmit={handleSubmit}
          error={formError}
        />
      </Modal>

      {/* Modale rifiuto */}
      <Modal
        isOpen={!!rejectingItem}
        onClose={() => {
          setRejectingItem(null);
          setRejectError(null);
        }}
        title="Rifiuta richiesta"
      >
        <RejectForm onSubmit={handleReject} error={rejectError} />
      </Modal>

      {/* Modale dettaglio richiesta (sola lettura) */}
      <Modal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        title="Dettaglio richiesta"
      >
        {detailItem && <RequestDetail request={detailItem} />}
      </Modal>
    </div>
  );
};
