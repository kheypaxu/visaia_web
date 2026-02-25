import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './screens/auth_screens/Login';
import MainLayout from './screens/MainLayout';
import Overview from './screens/main_screens/Overview';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          {/* Add more routes here like /validation, /risk-map */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;