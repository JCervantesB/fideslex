import { createUploadthing, type FileRouter } from "uploadthing/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const fileRouter = {
  caseUploader: f({
    image: { maxFileSize: "8MB" },
    pdf: { maxFileSize: "16MB" },
    text: { maxFileSize: "2MB" },
  })
    .middleware(async () => {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user) throw new Error("No autenticado");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      // La persistencia se hará desde el cliente llamando a /api/casos/[id]/documentos
      console.log("Upload complete:", file.url, "by", metadata.userId);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof fileRouter;