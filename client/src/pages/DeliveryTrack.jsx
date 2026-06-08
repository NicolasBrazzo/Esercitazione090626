import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { trackDelivery } from "../services/deliveriesService";
import { useState } from "react";
import Loader from "../components/Loader";
import { PackageCheck } from "lucide-react";

const STATUS_CONFIG = {
  da_ritirare: { label: "Da ritirare", variant: "warning" },
  in_deposito: { label: "In deposito", variant: "info" },
  in_consegna: { label: "In consegna", variant: "indigo" },
  consegnato: { label: "Consegnato", variant: "success" },
  in_giacenza: { label: "In giacenza", variant: "muted" },
};

export const DeliveryTrack = () => {
  const [delivery_key, setDeliveryKey] = useState("");
  const [collectionDate, setCollectionDate] = useState("");

  const { data: track, refetch, isFetching, error } = useQuery({
    queryKey: ["track", delivery_key, collectionDate],
    queryFn: () => trackDelivery(delivery_key, collectionDate),
    enabled: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!delivery_key || !collectionDate || isFetching) return;
    refetch();
  };

  const statusConfig = track ? STATUS_CONFIG[track.status] : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <PackageCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Tracking spedizione</h1>
          <p className="text-sm text-muted-foreground">
            Inserisci il codice spedizione e la data di ritiro per monitorare lo stato.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="delivery_key">Codice spedizione</Label>
              <Input
                id="delivery_key"
                type="text"
                value={delivery_key}
                onChange={(e) => setDeliveryKey(e.target.value)}
                placeholder="Es. ABC123XYZ"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="collection_date">Data di ritiro</Label>
              <Input
                id="collection_date"
                type="date"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isFetching || !delivery_key || !collectionDate}
            >
              {isFetching ? "Ricerca in corso..." : "Traccia la spedizione"}
            </Button>
          </form>

          {(isFetching || error || track) && (
            <div className="mt-5 pt-5 border-t border-border">
              {isFetching && (
                <div className="flex justify-center">
                  <Loader size="small" />
                </div>
              )}

              {!isFetching && error && (
                <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive ring-1 ring-inset ring-destructive/20">
                  {error.message}
                </div>
              )}

              {!isFetching && !error && track && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-foreground">Stato della spedizione</h2>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground min-w-32">Stato</span>
                      {statusConfig ? (
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      ) : (
                        <span>{track.status}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground min-w-32">Data spedizione</span>
                      <span className="font-medium">{track.collection_date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground min-w-32">Data consegna</span>
                      <span className="font-medium">{track.delivery_date}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
