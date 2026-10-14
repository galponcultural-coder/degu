import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import FormularioAsistencia from './components/formularioAsistencia';
import FormularioAsistenciaEvento from './components/formularioAsistenciaEvento';
import Talleres from './pages/Talleres';
import Inicio from './pages/Inicio';
import Horario from './pages/Horario';
import Login from './pages/Login';
import { PublicRoute } from './components/PublicRoute';
import BuscadorEstudiantes from './pages/BuscadorEstudiantes';
import Perfil from './pages/PerfilEstudiante';
import { PerfilAdmin } from './components/perfilAdmin';
import RestaurarContrasena from './pages/RestaurarContraseña';

function App() {
  return (
    <div className="min-h-screen">
      {/* 1. Envolvemos toda la aplicación con el proveedor de autenticación */}
      <AuthProvider>
        <Routes>  
          {/* ======================================= */}
          {/* RUTAS PÚBLICAS (No requieren sesión)    */}
          {/* ======================================= */}
          <Route element={<PublicRoute />}>
            <Route path='/' element={<Login />} />
            <Route path="/restaurar-contrasena" element={<RestaurarContrasena />} />
          </Route>

          <Route path='/formularioAsistencia' element={<FormularioAsistencia />} />
          <Route path='/formularioAsistenciaEvento' element={<FormularioAsistenciaEvento />} />
          
          {/* ======================================= */}
          {/* RUTAS PRIVADAS (Requieren token válido) */}
          {/* ======================================= */}
          <Route element={<ProtectedRoute />}>
            <Route path='/inicio' element={<Inicio />} />
            <Route path='/talleres' element={<Talleres />} />
            <Route path='/horario' element={<Horario />} />
            <Route path='/estudiantes' element={<BuscadorEstudiantes />} />
            <Route path='/admin/perfil' element={<PerfilAdmin />} />
            <Route path='/perfil' element={<Perfil />} />
            <Route path='/perfilAdmin' element={<PerfilAdmin />} />
          </Route>

          {/* ======================================= */}
          {/* CATCH-ALL (Página no encontrada)        */}
          {/* ======================================= */}
          <Route path="*" element={<div className="p-10 text-center text-red-500">Página no encontrada (Error 404)</div>} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;