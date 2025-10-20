import { pgTable, text, varchar, timestamp, serial, numeric, integer, primaryKey, uniqueIndex, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const profiles = pgTable("profiles", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("cliente"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  descripcion: text("descripcion"),
  precio: numeric("precio", { precision: 10, scale: 2 }).notNull().default("0"),
  estado: varchar("estado", { length: 20 }).notNull().default("activo"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const serviceAssignees = pgTable(
  "service_assignees",
  {
    serviceId: integer("service_id").notNull().references(() => services.id),
    userId: varchar("user_id", { length: 255 }).notNull().references(() => profiles.userId),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.serviceId, table.userId] }),
  })
);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  descripcion: text("descripcion"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const serviceCategories = pgTable(
  "service_categories",
  {
    serviceId: integer("service_id").references(() => services.id).notNull(),
    categoryId: integer("category_id").references(() => categories.id).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.serviceId, table.categoryId] }),
  })
);

// Horarios globales reutilizables: 30m entre 9:00 y 16:00.
export const schedules = pgTable(
  "schedules",
  {
    id: serial("id").primaryKey(),
    startMin: integer("start_min").notNull(), // minutos desde medianoche
    endMin: integer("end_min").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    startEndUnique: uniqueIndex("schedules_start_end_unique").on(table.startMin, table.endMin),
  })
);

export const appointments = pgTable(
  "appointments",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull().references(() => profiles.userId),
    clientId: varchar("client_id", { length: 255 }).references(() => profiles.userId),
    clientName: varchar("client_name", { length: 120 }),
    clientEmail: varchar("client_email", { length: 120 }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pendiente"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userStartUnique: uniqueIndex("appointments_user_start_idx").on(table.userId, table.startAt),
  })
);

export const appointmentServices = pgTable(
  "appointment_services",
  {
    appointmentId: integer("appointment_id").references(() => appointments.id).notNull(),
    serviceId: integer("service_id").references(() => services.id).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.appointmentId, table.serviceId] }),
  })
);

// Casos legales asociados a clientes, referenciables a citas
export const cases = pgTable(
  "cases",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull().references(() => profiles.userId),
    clientId: varchar("client_id", { length: 255 }).notNull().references(() => profiles.userId),
    appointmentId: integer("appointment_id").references(() => appointments.id), // opcional, solo trazabilidad
    nombre: varchar("nombre", { length: 120 }).notNull(),
    asunto: varchar("asunto", { length: 200 }).notNull(),
    descripcion: text("descripcion"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);

export const caseDocuments = pgTable(
  "case_documents",
  {
    id: serial("id").primaryKey(),
    caseId: integer("case_id").notNull().references(() => cases.id),
    fileKey: varchar("file_key", { length: 255 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: text("file_url").notNull(),
    uploadedBy: varchar("uploaded_by", { length: 255 }).notNull().references(() => profiles.userId),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  }
);

export const profilesRelations = relations(profiles, ({ many }) => ({
  services: many(serviceAssignees),
  appointments: many(appointments),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  assignees: many(serviceAssignees),
  appointmentServices: many(appointmentServices),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  serviceCategories: many(serviceCategories),
}));

export const appointmentsRelations = relations(appointments, ({ many }) => ({
  appointmentServices: many(appointmentServices),
}));

export const casesRelations = relations(cases, ({ many }) => ({
  documents: many(caseDocuments),
}));

export const lunchBreaks = pgTable("lunch_breaks", {
  userId: varchar("user_id", { length: 255 }).primaryKey().references(() => profiles.userId),
  startMin: integer("start_min").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const appointmentRequests = pgTable(
  "appointment_requests",
  {
    id: serial("id").primaryKey(),
    serviceName: varchar("service_name", { length: 120 }).notNull(),
    clientId: varchar("client_id", { length: 255 }).references(() => profiles.userId),
    clientName: varchar("client_name", { length: 120 }).notNull(),
    clientEmail: varchar("client_email", { length: 120 }).notNull(),
    clientPhone: varchar("client_phone", { length: 20 }).notNull(),
    desiredDate: date("desired_date").notNull(),
    desiredStartMin: integer("desired_start_min").notNull(),
    message: text("message"),
    status: varchar("status", { length: 20 }).notNull().default("solicitada"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);