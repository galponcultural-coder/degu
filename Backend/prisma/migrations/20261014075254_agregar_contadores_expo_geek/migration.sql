-- AlterTable
ALTER TABLE "EventoExterno" ADD COLUMN     "asistentesEstudiantes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "asistentesExternos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "asistentesFuncionarios" INTEGER NOT NULL DEFAULT 0;
