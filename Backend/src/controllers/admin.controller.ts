import { Request, Response } from 'express';
import * as service from '../services/admin.service';

// 1. Actualizamos la interfaz: El token del Admin ahora trae 'id' y 'correo' en lugar de 'rut'
export interface AuthRequest extends Request {
  usuario?: {
    id: number;   
    nombre: string;
    correo: string;
    rol: string;
  };
}

export const transferirAdministracion = async (req: AuthRequest, res: Response) => {
  try {
    const { rutNuevoAdmin, palabraConfirmacion } = req.body;
    
    // 2. Verificamos que exista el ID en la sesión
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ error: 'No autorizado. Token de sesión inválido.' });
    }

    const idAdminActual = req.usuario.id;

    // Nota: Eliminamos la validación de "rutAdminActual === rutNuevoAdmin" 
    // porque ahora no podemos comparar el ID de administrador con el RUT de un estudiante.
    // Además, el servicio ya se encarga de validar si el nuevo candidato ya es administrador.

    // 3. Pasamos el idAdminActual (number) al servicio en lugar del rut
    await service.transferirMando(idAdminActual, rutNuevoAdmin, palabraConfirmacion);

    res.json({ 
      mensaje: 'Traspaso de administración exitoso. Su sesión expirará ahora.' 
    });

  } catch (error: any) {
    console.error("=== ERROR AL TRANSFERIR MANDO ===", error);
    
    res.status(400).json({ 
      error: 'Error al procesar la transferencia de administración', 
      detalle: error.message 
    });
  }
};