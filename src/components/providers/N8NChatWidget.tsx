"use client";

import { useEffect } from "react";
import { createChat } from "@n8n/chat";
import { useSession } from "@/lib/auth-client";

declare global {
  interface Window {
    __n8nChatInitialized?: boolean;
    __n8nChatInitializedFor?: string; // 'guest' o userId
  }
}

type SessionUser = { id: string; email?: string | null; name?: string | null };
type SessionData = { user?: SessionUser } | null | undefined;
type ChatAppointment = {
  userId?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  date?: string | null; // YYYY-MM-DD
  startMin?: number | null; // minutos desde medianoche
  startAt?: string | null; // ISO string
  endAt?: string | null; // ISO string
  status?: string | null; // 'pendiente'
  services?: number[]; // IDs de servicios
};

type ChatAppointmentServicePivot = {
  appointmentId?: number | null;
  serviceId?: number | null;
};
type ChatMetadata = {
  userId?: string;
  email?: string;
  name?: string;
  phone?: string;
  role?: string;
  guest?: boolean;
  cita?: ChatAppointment;
  cita_servicio?: ChatAppointmentServicePivot;
  [key: string]: unknown;
};

type ProfileItem = {
  phone?: string | number | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
};

type ProfileResponse = {
  item?: ProfileItem;
};

export default function N8NChatWidget() {
  const hook = useSession?.();
  const session = (hook?.data ?? undefined) as SessionData;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const webhookUrl = "/api/n8n/chat"; // proxy interno para evitar CORS

    async function init(identity: string) {
      // Eliminar cualquier instancia previa del contenedor del chat
      const existing = document.querySelector("#n8n-chat");
      if (existing) existing.remove();

      // Asegura que el contenedor exista
      const targetEl = document.createElement("div");
      targetEl.id = "n8n-chat";
      document.body.appendChild(targetEl);

      // Construir metadata del usuario
      const user = session?.user as SessionUser | undefined;
      const metadata: ChatMetadata = {};

      if (identity !== "guest" && user) {
        metadata.userId = user.id;
        metadata.email = user.email || "";
        metadata.name = user.name || "";

        // Intentar obtener teléfono y nombre completo desde /api/profile
        const res = await fetch("/api/profile", { method: "GET", credentials: "include" }).catch(() => null);
        if (res?.ok) {
          const json = (await res.json().catch(() => null)) as ProfileResponse | null;
          const item: ProfileItem = json?.item ?? {};
          if (item?.phone != null) {
            metadata.phone = String(item.phone);
          }
          const fullName = [item?.firstName ?? "", item?.lastName ?? ""].filter(Boolean).join(" ");
          if (fullName && !metadata.name) {
            metadata.name = fullName;
          }
          if (item?.role) {
            metadata.role = String(item.role);
          }

          const userRole = metadata.role;
          metadata.cita = {
            userId: userRole === "usuario" || userRole === "administrador" ? user.id : null,
            clientId: userRole === "cliente" ? user.id : null,
            clientName: userRole === "cliente" ? (metadata.name || user.name || null) : null,
            clientEmail: userRole === "cliente" ? (metadata.email || user.email || null) : null,
            date: null,
            startMin: null,
            startAt: null,
            endAt: null,
            status: "pendiente",
            services: [],
          };
          metadata.cita_servicio = { appointmentId: null, serviceId: null };
        } else {
          // Si no se pudo obtener el perfil, aun así inicializamos estructuras
          metadata.cita = {
            userId: null,
            clientId: null,
            clientName: null,
            clientEmail: null,
            date: null,
            startMin: null,
            startAt: null,
            endAt: null,
            status: "pendiente",
            services: [],
          };
          metadata.cita_servicio = { appointmentId: null, serviceId: null };
        }
      } else {
        metadata.guest = true;
        metadata.role = "guest";
        metadata.cita = {
          userId: null,
          clientId: null,
          clientName: null,
          clientEmail: null,
          date: null,
          startMin: null,
          startAt: null,
          endAt: null,
          status: "pendiente",
          services: [],
        };
        metadata.cita_servicio = { appointmentId: null, serviceId: null };
      }

      // Añadir fecha actual a metadata (formato YYYY-MM-DD y ISO)
      const now = new Date();
      const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      metadata.currentDate = local.toISOString().slice(0, 10);
      metadata.currentDateISO = now.toISOString();

      createChat({
        webhookUrl,
        target: "#n8n-chat",
        mode: "window",
        loadPreviousSession: identity === "guest",
        showWelcomeScreen: true,
        defaultLanguage: "en",
        i18n: {
          en: {
            title: "¡Hola! 👋",
            subtitle: "Inicia una conversación. Estamos para ayudarte.",
            footer: "",
            getStarted: "Nueva conversación",
            inputPlaceholder: "Escribe tu pregunta...",
            closeButtonTooltip: "Cerrar chat",
          },
        },
        initialMessages: [
          "¡Hola! 👋",
          "¿En qué puedo ayudarte hoy?",
        ],
        enableStreaming: false,
        webhookConfig: {
          method: "POST",
        },
        metadata,
      });

      window.__n8nChatInitialized = true;
      window.__n8nChatInitializedFor = identity;
    }

    const currentIdentity = session?.user?.id ?? "guest";

    // 1) Inicializa en modo invitado inmediatamente si no hay ninguna instancia
    if (!window.__n8nChatInitialized) {
      init("guest");
      return;
    }

    // 2) Si ya existe y la identidad cambió, reinicia con la nueva identidad
    if (window.__n8nChatInitializedFor !== currentIdentity) {
      init(currentIdentity);
    }
  }, [session]);

  return null;
}