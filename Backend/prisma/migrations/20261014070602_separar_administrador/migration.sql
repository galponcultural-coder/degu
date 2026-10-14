/*
  Warnings:

  - The values [Administrador] on the enum `RolUsuario` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `password` on the `Usuario` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RolUsuario_new" AS ENUM ('Profesor', 'Ayudante', 'Estudiante');
ALTER TABLE "Usuario" ALTER COLUMN "rol" TYPE "RolUsuario_new" USING ("rol"::text::"RolUsuario_new");
ALTER TYPE "RolUsuario" RENAME TO "RolUsuario_old";
ALTER TYPE "RolUsuario_new" RENAME TO "RolUsuario";
DROP TYPE "public"."RolUsuario_old";
COMMIT;

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "password",
ALTER COLUMN "correo" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Administrador" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Administrador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoExterno" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "horario" TEXT NOT NULL,
    "lugar" TEXT NOT NULL DEFAULT 'Galpón Cultural',
    "organizador" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoExterno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Administrador_correo_key" ON "Administrador"("correo");
