export const STATUS_META = {
  RECIBIDO: { label: "Recibido", cls: "is-recibido" },
  EN_REVISION: { label: "En revisión", cls: "is-EN_REVISION" },
  ATENDIDO: { label: "Atendido", cls: "is-atendido" },
  RECHAZADO: { label: "Rechazado", cls: "is-rechazado" },
};

export function statusMeta(status) {
  return (
    STATUS_META[status] || {
      label: status || "Sin estado",
      cls: "is-recibido",
    }
  );
}