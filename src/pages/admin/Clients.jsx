import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import * as clientService from "../../services/clientService";

import PageContainer from "../../components/layout/PageContainer";
import SectionHeader from "../../components/ui/SectionHeader";

import {
  ClientCard,
  ClientTable,
  ClientForm,
  ClientModal,
  ClientSearch,
  EmptyClients,
} from "../../components/clients";

const PAGE_SIZE = 15;

function matchClient(search, client) {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    client.name.toLowerCase().includes(q) ||
    (client.phone || "").includes(q)
  );
}

export default function Clients() {
  const { user } = useAuth();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  async function loadClients() {
    setLoading(true);
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch {
      toast.error("Error al cargar los clientes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  const filtered = useMemo(() => {
    let result = clients.filter((c) => matchClient(search, c));

    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "totalSpent") {
      result.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    } else if (sortBy === "lastPurchaseDate") {
      result.sort((a, b) => {
        const aDate = a.lastPurchaseDate?.toDate?.()?.getTime() || 0;
        const bDate = b.lastPurchaseDate?.toDate?.()?.getTime() || 0;
        return bDate - aDate;
      });
    }

    return result;
  }, [clients, search, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(0, page * PAGE_SIZE);

  function openCreateModal() {
    setEditingClient(null);
    setModalOpen(true);
  }

  function openEditModal(client) {
    setEditingClient(client);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingClient(null);
  }

  async function handleSubmit(formData) {
    setModalLoading(true);
    try {
      if (editingClient) {
        await clientService.updateClient(editingClient.id, formData, user.uid);
        toast.success("Cliente actualizado correctamente");
      } else {
        await clientService.createClient(formData, user.uid);
        toast.success("Cliente registrado correctamente");
      }
      closeModal();
      loadClients();
    } catch (err) {
      if (err instanceof clientService.ValidationError) {
        toast.error("Corregí los errores en el formulario");
      } else {
        toast.error("Ocurrió un error al guardar el cliente");
      }
    } finally {
      setModalLoading(false);
    }
  }

  function handleViewDetail(id) {
    window.location.href = `/admin/clientes/${id}`;
  }

  const needsLoadMore = paginated.length < filtered.length;

  if (loading) {
    return (
      <PageContainer title="Clientes" description="Registro y consulta de clientes">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Clientes" description="Registro y consulta de clientes">
      <div className="space-y-6">
        <SectionHeader
          title=""
          description=""
          action={
            <button
              onClick={openCreateModal}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </button>
          }
        />

        {clients.length === 0 ? (
          <EmptyClients onCreate={openCreateModal} />
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:max-w-xs">
                <ClientSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="name">Ordenar por nombre</option>
                <option value="totalSpent">Ordenar por total gastado</option>
                <option value="lastPurchaseDate">Ordenar por última compra</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-border">
                <p className="text-sm text-gray-500">
                  {search
                    ? "No se encontraron clientes con ese criterio de búsqueda"
                    : "No hay clientes registrados"}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile */}
                <div className="sm:hidden">
                  <div className="grid gap-4">
                    {paginated.map((client) => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        onView={handleViewDetail}
                        onEdit={openEditModal}
                      />
                    ))}
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden sm:block">
                  <ClientTable
                    clients={paginated}
                    onEdit={openEditModal}
                  />
                </div>

                {/* Load more */}
                {needsLoadMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Cargar más ({filtered.length - paginated.length} restantes)
                    </button>
                  </div>
                )}

                {filtered.length > PAGE_SIZE && (
                  <p className="text-center text-xs text-gray-400">
                    Mostrando {paginated.length} de {filtered.length} clientes
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>

      <ClientModal
        open={modalOpen}
        onClose={closeModal}
        title={editingClient ? "Editar cliente" : "Nuevo cliente"}
      >
        <ClientForm
          initialData={editingClient}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          loading={modalLoading}
        />
      </ClientModal>
    </PageContainer>
  );
}
