import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './screens/auth_screens/Login';
import MainLayout from './screens/MainLayout';
import Overview from './screens/main_screens/Overview';
import Validation from './screens/main_screens/Validation';
import ValidationReview from './screens/main_screens/ValidationReview';
import Farmers from './screens/main_screens/Farmers';
import FarmersProfile from './screens/main_screens/FarmersProfile';
import Settings from './screens/main_screens/Settings';
import Analytics from './screens/main_screens/Analytics';
import RiskMap from './screens/main_screens/RiskMap';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />

          <Route path="validation">
            <Route index element={<Validation />} />
            <Route path=":id" element={<ValidationReview />} />
          </Route>

          <Route path="risk-map">
            <Route index element={<RiskMap />} />
            <Route path=":id" element={<RiskMap />} />
          </Route>

          <Route path="farmers">
            <Route index element={<Farmers />} />
            <Route path=":id" element={<FarmersProfile />} />
          </Route>
          
          <Route path="analytics">
            <Route index element={<Analytics />} />
            <Route path=":id" element={<Analytics />} />
          </Route>
          
          <Route path="settings">
            <Route index element={<Settings />} />
            <Route path=":id" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="overview" replace />} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;