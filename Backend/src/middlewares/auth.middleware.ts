import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  usuario?: {
    id?: number;
    rut?: string;
    rol: string;
    correo?: string;
    [key: string]: any; 
  };
}

export const verificarToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Acceso denegado. No se proporcionó un token de sesión.' 
      });
    }

    const token = authHeader.split(' ')[1];
    const secreto = process.env.JWT_SECRET || 'tu_secreto_super_seguro';
    
    const decoded = jwt.verify(token, secreto) as any;

    req.usuario = decoded.user ? decoded.user : decoded;

    next();

  } catch (error) {
    return res.status(401).json({ 
      error: 'Su sesión es inválida o ha expirado. Por favor, inicie sesión nuevamente.' 
    });
  }
};

export const middlewareVerificarAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Acceso denegado. No se proporcionó un token de sesión.' 
      });
    }

    const token = authHeader.split(' ')[1];
    const secreto = process.env.JWT_SECRET || 'tu_secreto_super_seguro';
    
    const decoded = jwt.verify(token, secreto) as any;
    const userData = decoded.user ? decoded.user : decoded;

    if (userData.rol !== 'Administrador') {
      return res.status(403).json({ 
        error: 'Acceso denegado. Esta acción requiere permisos de Administrador.' 
      });
    }

    req.usuario = userData;
    next();

  } catch (error) {
    return res.status(401).json({ 
      error: 'Su sesión es inválida o ha expirado. Por favor, inicie sesión nuevamente.' 
    });
  }
};