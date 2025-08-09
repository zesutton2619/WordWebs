// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { DiscordProvider } from "./components/DiscordProvider";
import WordWebs from "./components/WordWebs";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";

function App() {
  return (
    <DiscordProvider>
      <Router>
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<WordWebs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
            </Routes>
          </div>

          {/* Footer with links */}
          <footer className="bg-slate-800 text-slate-400 text-sm p-4 text-center">
            <Link to="/privacy" className="hover:text-white mx-2">
              Privacy Policy
            </Link>
            |
            <Link to="/terms" className="hover:text-white mx-2">
              Terms of Service
            </Link>
          </footer>
        </div>
      </Router>
    </DiscordProvider>
  );
}

export default App;
