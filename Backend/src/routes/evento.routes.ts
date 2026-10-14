import { Router } from 'express';
import * as controller from '../controllers/evento.controller';
import { middlewareVerificarAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(middlewareVerificarAdmin);

router.get('/', controller.listar);
router.post('/', controller.crear);

router.put('/:id/participacion', controller.actualizarParticipacion);

router.post('/:id/escanear', controller.escaneoRapido);

router.get('/:id/estadisticas', middlewareVerificarAdmin, controller.obtenerEstadisticas);

export default router;