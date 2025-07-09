import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/sidebar/Sidebar';
import ChatPage from './pages/ChatPage';
import GptCreatorPage from './pages/GptCreatorPage';
import NotFoundPage from './pages/NotFoundPage';
import SettingsModal from './components/settings/SettingsModal';
import { useUiStore } from './stores/uiStore';
import { useEffect } from 'react';

function App() {
  const { theme, activeFont, fonts } = useUiStore();

  useEffect(() => {
    const root = window.document.documentElement;

    // Handle theme
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Handle font
    const fontClasses = fonts.map(f => f.value);
    root.classList.remove(...fontClasses);
    root.classList.add(activeFont);

  }, [theme, activeFont, fonts]);

  return (
    <Router>
      <div className="flex h-screen bg-neutral-900 text-white">
        <Sidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/g/:gptId" element={<ChatPage />} />
            <Route path="/g/new" element={<GptCreatorPage />} />
            <Route path="/g/edit/:gptId" element={<GptCreatorPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <SettingsModal />
      </div>
    </Router>
  );
}

export default App;
