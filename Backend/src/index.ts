import express from 'express';
import cors from 'cors';
import sesionRoutes from './routes/sesion.routes';
import asistenciaRoutes from './routes/asistencia.routes';
import authRoutes from './routes/auth.routes';
import profesorRoutes from './routes/profesor.routes';
import eventoRoutes from './routes/evento.routes';

import estudianteRoutes from './routes/estudiante.routes';
import adminRoutes from './routes/admin.routes';
import { middlewareVerificarAdmin } from './middlewares/auth.middleware';
import metricaRoutes from './routes/metrica.routes';
import  talleresRoutes from './routes/talleres.routes';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: function (origin, callback) {
    const dominiosPermitidos = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://degu-hazel.vercel.app',
      'https://degu-orcin.vercel.app'
    ];

    // 1. Permitir peticiones sin origen (Postman) o dominios de la lista estricta
    if (!origin || dominiosPermitidos.includes(origin)) {
      callback(null, true);
    } 
    // 2. EL COMODÍN MAGICO: Permitir cualquier URL dinámica que genere Vercel para las vistas previas
    else if (/\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } 
    // 3. Permitir peticiones desde la red local (para probar con el celular)
    else if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/.test(origin)) {
      callback(null, true);
    } 
    // 4. Si no es ninguna de las anteriores, bloquear por seguridad
    else {
      console.error('Bloqueado por CORS: Origen no permitido ->', origin);
      callback(new Error('Bloqueado por CORS: Origen no permitido'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api/sesion', sesionRoutes);
app.use('/api/asistencia', asistenciaRoutes)
app.use('/api/auth', authRoutes);
app.use("/api/profesores", profesorRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/admin', middlewareVerificarAdmin, adminRoutes);
app.use('/api/metricas', metricaRoutes);
app.use('/api/talleres', talleresRoutes);

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`🚀 Servidor unificado listo en http://localhost:${port}`);
  });
}

export default app;