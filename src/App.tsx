import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from '@/context/TournamentContext';
import { Layout } from '@/components/layout';
import { HomePage, CreateTournamentPage, TournamentDetailPage } from '@/pages';

function App() {
  return (
    <TournamentProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/tournaments/new" element={<CreateTournamentPage />} />
            <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TournamentProvider>
  );
}

export default App;
