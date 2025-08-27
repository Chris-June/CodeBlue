/*
  App.tsx
  -------
  Application root: initializes theme + font classes, and renders routes within
  the reusable AppShell layout for a cohesive UI structure.
*/
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import GptCreatorPage from './pages/GptCreatorPage';
import NotFoundPage from './pages/NotFoundPage';
import { useUiStore } from './stores/uiStore';
import { useEffect } from 'react';
import AppShell from './components/shell/AppShell';

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
      <AppShell>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/g/:gptId" element={<ChatPage />} />
          <Route path="/g/new" element={<GptCreatorPage />} />
          <Route path="/g/edit/:gptId" element={<GptCreatorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
