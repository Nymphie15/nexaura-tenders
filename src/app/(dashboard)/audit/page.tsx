"use client";

import * as React from "react";
import { useAuditLogs, useAuditStats } from "@/hooks/use-audit";
import type { AuditLogFilters } from "@/types/audit";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, Shield, Activity, Users, AlertTriangle } from "lucide-react";

const PAGE_SIZE = 20;

const ACTION_OPTIONS = [
  { value: "all", label: "Toutes les actions" },
  { value: "login", label: "Connexion" },
  { value: "logout", label: "Deconnexion" },
  { value: "create", label: "Creation" },
  { value: "update", label: "Modification" },
  { value: "delete", label: "Suppression" },
  { value: "export", label: "Export" },
  { value: "upload", label: "Upload" },
];

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "success":
      return "default";
    case "failure":
      return "secondary";
    case "error":
      return "destructive";
    default:
      return "outline";
  }
}

export default function AuditPage() {
  const [filters, setFilters] = React.useState<AuditLogFilters>({
    limit: PAGE_SIZE,
    offset: 0,
  });
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");

  const currentFilters: AuditLogFilters = {
    ...filters,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
  };

  const { data: logsData, isLoading: logsLoading, isError: logsError, error: logsErrorObj } = useAuditLogs(currentFilters);
  const { data: stats, isLoading: statsLoading, isError: statsError } = useAuditStats();

  const logs = Array.isArray(logsData) ? logsData : logsData?.items ?? logsData?.logs ?? [];
  const totalCount = logsData?.total ?? logs.length;
  const currentPage = Math.floor((filters.offset || 0) / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleActionChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      action: value === "all" ? undefined : value,
      offset: 0,
    }));
  };

  const handlePreviousPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, (prev.offset || 0) - PAGE_SIZE),
    }));
  };

  const handleNextPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + PAGE_SIZE,
    }));
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Journal d&apos;audit</h1>
        <p className="text-muted-foreground">
          Historique des actions et evenements de securite.
        </p>
      </div>

      {(logsError || statsError) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {(logsErrorObj as any)?.response?.status === 403
              ? "Acces refuse — cette page necessite des droits administrateur."
              : "Impossible de charger les donnees d'audit. Verifiez votre connexion ou reessayez."}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total evenements</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "-" : (stats?.total_events ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aujourd&apos;hui</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "-" : (stats?.events_today ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "-" : (stats?.unique_users ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "-" : (stats?.by_status?.error ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-48">
              <label className="mb-1 block text-sm font-medium">Action</label>
              <Select
                value={filters.action || "all"}
                onValueChange={handleActionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les actions" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <label className="mb-1 block text-sm font-medium">Date debut</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setFilters((prev) => ({ ...prev, offset: 0 }));
                }}
              />
            </div>
            <div className="w-44">
              <label className="mb-1 block text-sm font-medium">Date fin</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setFilters((prev) => ({ ...prev, offset: 0 }));
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Horodatage</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Ressource</TableHead>
                <TableHead className="w-[100px]">Statut</TableHead>
                <TableHead className="w-[140px]">Adresse IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun evenement trouve.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.user_email || log.user_id || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.resource}
                      {log.resource_id && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({log.resource_id.slice(0, 8)}...)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(log.status)}>{log.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.ip_address || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
            {totalCount > 0 && ` (${totalCount} resultats)`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={handlePreviousPage}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Precedent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={handleNextPage}
            >
              Suivant
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
