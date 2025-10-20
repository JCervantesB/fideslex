# Usa la imagen base oficial de node (puedes ajustarla si nixpack usa otra distinta)
FROM node:18-bullseye

# Instala Python3 y herramientas build necesarias
RUN apt-get update && apt-get install -y python3 build-essential

# Define la variable de entorno para python en node-gyp
ENV PYTHON=python3

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de package.json y pnpm-lock.yaml primero para cachear dependencias
COPY package.json pnpm-lock.yaml ./

# Instala pnpm globalmente
RUN npm install -g pnpm

# Instala las dependencias con pnpm (tú usas pnpm)
RUN pnpm install --frozen-lockfile

# Copia el resto del código fuente al contenedor
COPY . .

# Construye el proyecto Next.js si aplicable
RUN pnpm build

# Puerto expuesto por Next.js por defecto
EXPOSE 3000

# Comando para arrancar la app en producción
CMD ["pnpm", "start"]
