import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';
import { HomePage } from './pages/HomePage';
import { ForumPage } from './pages/ForumPage';
import { TopicDetailPage } from './pages/TopicDetailPage';
import { NewTopicPage } from './pages/NewTopicPage';
import { LoginPage } from './pages/LoginPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { NewListingPage } from './pages/NewListingPage';
import { ChargingPage } from './pages/ChargingPage';
import { NewsPage } from './pages/NewsPage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { MessagesPage } from './pages/MessagesPage';
import { ChatPage } from './pages/ChatPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { SavedTopicsPage } from './pages/SavedTopicsPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/forum/yeni" element={<NewTopicPage />} />
            <Route path="/forum/:topicId" element={<TopicDetailPage />} />
            <Route path="/ilanlar" element={<MarketplacePage />} />
            <Route path="/ilanlar/yeni" element={<NewListingPage />} />
            <Route path="/ilanlar/:listingId" element={<ListingDetailPage />} />
            <Route path="/sarj" element={<ChargingPage />} />
            <Route path="/haberler" element={<NewsPage />} />
            <Route path="/haberler/:newsId" element={<NewsDetailPage />} />
            <Route path="/mesajlar" element={<MessagesPage />} />
            <Route path="/mesajlar/:conversationId" element={<ChatPage />} />
            <Route path="/bildirimler" element={<NotificationsPage />} />
            <Route path="/u/:userId" element={<UserProfilePage />} />
            <Route path="/kaydedilenler" element={<SavedTopicsPage />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="/giris" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
