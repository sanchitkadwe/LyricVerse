import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import AuthPage from "./pages/Auth.jsx";
import Navbar from "./components/Navbar.jsx";
import Contribute from "./pages/Contribute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import Explore from "./pages/Explore.jsx";
import LyricWiki from "./pages/LyricWiki.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Annotations from "./pages/Annotations.jsx";
import Annotate from "./pages/Annotate.jsx";
import ManageAnnotations from "./pages/ManageAnnotations.jsx";
import { ToastProvider } from './components/Toast.jsx';
import SongDetail from "./pages/SongDetail.jsx";



function App() {
  return (
    <ToastProvider>
    <BrowserRouter>
    {/* <Navbar /> This will show on all pages, we can move it inside specific pages if needed */}
      <Routes>
        {/* The Home page will load at the root URL */}
        <Route path="/" element={<Home />} />
        {/* The Auth page will load at the /login URL */}
        <Route path="/login" element={<AuthPage />} />
        {/* The Contribute page will load at the /contribute URL */}
        <Route path="/contribute" element={<Contribute />} />
        {/* The Dashboard page will load at the /dashboard URL */}
        <Route path="/dashboard" element={<Dashboard />} />
        {/* The Profile page will load at the /profile URL */}
        <Route path="/profile" element={<Profile />} />
        {/* The Explore page will load at the /explore URL */}
        <Route path="/explore" element={<Explore />} />
        {/* The LyricWiki page will load at the /lyricwiki URL */}
        <Route path="/lyricwiki" element={<LyricWiki />} />
        {/* The annotation page will load at the /annotations URL */}
        <Route path="/annotations" element={<Annotations />} />
        <Route path="/annotate/:id" element={<Annotate />} />
        <Route path="/annotations/:songId/manage" element={<ManageAnnotations />} />
        {/* Admin Dashboard */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />     
        {/* The Song Detail page will load at the /song/:id URL, where :id is a dynamic parameter for the song ID */}
        <Route path="/song/:id" element={<SongDetail />} />
        <Route path="/label-song/:id" element={<SongDetail />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
