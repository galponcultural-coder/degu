import { Request, Response } from 'express';
import { autenticarAdministrador, registrarUsuario, validarToken, autenticarConGoogle, restablecerContrasena, solicitarRecuperacion } from '../services/auth.service';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      res.status(400).json({ error: 'El correo y la contraseña son obligatorios' });
      return;
    }

    const token = await autenticarAdministrador(correo, password);

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      token
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const loginGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'El token de Google es obligatorio' });
      return;
    }

    const tokenApp = await autenticarConGoogle(token);

    res.status(200).json({
      mensaje: 'Inicio de sesión con Google exitoso',
      token: tokenApp
    });
  } catch (error: any) {
    res.status(error.status || 401).json({ error: error.message });
  }
};

export const registro = async (req: Request, res: Response): Promise<void> => {
  try {
    const nuevoUsuario = await registrarUsuario(req.body);
    res.status(201).json({
      mensaje: 'Usuario registrado con éxito',
      usuario: nuevoUsuario
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const verificarSesion = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ error: 'No hay token de seguridad' });
      return;
    }

    const usuario = await validarToken(token);
    res.status(200).json(usuario);
  } catch (error: any) {
    res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
};
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { correo } = req.body;

    const token = await solicitarRecuperacion(correo);

    res.status(200).json({
      mensaje:
        "Si el correo es válido, se generó un enlace de recuperación.",
      token // Temporal para desarrollo
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, nuevaPassword } = req.body;

    await restablecerContrasena(token, nuevaPassword);

    res.status(200).json({
      mensaje: "Contraseña actualizada correctamente"
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message
    });
  }
};