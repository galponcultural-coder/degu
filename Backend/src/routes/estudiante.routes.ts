import { Router } from 'express';
import * as ctrl from '../controllers/estudiante.controller';  
import { middlewareVerificarAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as schema from '../schemes/estudiante.scheme';

const router = Router();

router.post('/', middlewareVerificarAdmin, validate(schema.crearEstudianteSchema), ctrl.crearEstudiante);
router.post('/batch', middlewareVerificarAdmin, ctrl.crearEstudiantesBatch);
//router.get('/', validate(schema.buscarEstudianteSchema), ctrl.listarEstudiantes);
router.get('/buscar', middlewareVerificarAdmin, ctrl.buscarEstudiantesController);
router.patch(
  '/:rut',
  middlewareVerificarAdmin,
  validate(schema.actualizarEstudianteSchema),
  ctrl.modificarDatos
);
//router.get('/:rut', validate(schema.rutParamSchema), ctrl.obtenerPerfil);
//router.get('/:rut/historial', validate(schema.rutParamSchema), ctrl.obtenerHistorial);
//router.patch('/:rut', validate(schema.actualizarEstudianteSchema), ctrl.modificarDatos);
//router.patch('/:rut/rol', validate(schema.cambioRolSchema), ctrl.cambiarRol);

export default router;