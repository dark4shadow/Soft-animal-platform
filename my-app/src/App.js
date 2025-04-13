import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AnimalListings from './pages/AnimalListings';
import SheltersPage from './pages/SheltersPage';
import ShelterDetail from './pages/ShelterDetail';
import ShelterDashboard from './pages/ShelterDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import BlogPage from './pages/BlogPage';
import BlogPostDetail from './pages/BlogPostDetail';
import DonatePage from './pages/DonatePage';
import PrivateRoute from './components/PrivateRoute';
import AddAnimalPage from './pages/AddAnimalPage';
import UserProfile from './pages/UserProfile';
import EditShelterPage from './pages/EditShelterPage';
import CreateAnimalIntakeRequest from './pages/CreateAnimalIntakeRequest';
import VolunteerIntakeRequests from './pages/VolunteerIntakeRequests';
import IntakeRequestDetail from './pages/IntakeRequestDetail';
import ShelterIntakeRequests from './pages/ShelterIntakeRequests';
import EditAnimalPage from './pages/EditAnimalPage';
import AdoptionRequestPage from './pages/AdoptionRequestPage';

// Імпортуємо основний CSS файл замість App.css
import './styles/main.css';

// This component will handle the scroll reset functionality
function ScrollToTop() {
  const location = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
    // Ensure body overflow is not restricted
    document.body.style.overflow = '';
  }, [location.pathname]);

  return null;
}

// Main App component without useLocation
function AppContent() {
  return (
    <div className="App">
      <ScrollToTop />
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/animals" element={<AnimalListings />} />
          <Route path="/animals/:id" element={<AnimalListings />} />
          <Route path="/add-animal" element={<AddAnimalPage />} />
          <Route path="/shelters" element={<SheltersPage />} />
          <Route path="/shelters/:id" element={<ShelterDetail />} />
          
          <Route path="/shelter-dashboard" element={
            <PrivateRoute userType="shelter">
              <ShelterDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/volunteer-dashboard" element={
            <PrivateRoute userType="volunteer">
              <VolunteerDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPostDetail />} />
          <Route path="/donate" element={<DonatePage />} />
          
          {/* Новий захищений маршрут для сторінки профілю */}
          <Route path="/profile" element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          } />

          <Route path="/edit-shelter" element={<EditShelterPage />} />
          {/* Або з параметром ID, якщо потрібно: */}
          {/* <Route path="/edit-shelter/:id" element={<EditShelterPage />} /> */}

          {/* Нові маршрути для запитів на прийом тварин */}
          <Route path="/create-intake-request" element={<CreateAnimalIntakeRequest />} />
          <Route path="/volunteer/intake-requests" element={<VolunteerIntakeRequests />} />
          <Route path="/intake-request/:id" element={<IntakeRequestDetail />} />
          <Route path="/shelter/intake-requests" element={<ShelterIntakeRequests />} />

          {/* Новий маршрут для редагування тварини */}
          <Route path="/edit-animal/:id" element={
            <PrivateRoute userType="shelter">
              <EditAnimalPage />
            </PrivateRoute>
          } />
          
          {/* Новий маршрут для запиту на усиновлення */}
          <Route path="/adoption-request/:id" element={
            <PrivateRoute userType="volunteer">
              <AdoptionRequestPage />
            </PrivateRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

// App wrapper with providers
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
