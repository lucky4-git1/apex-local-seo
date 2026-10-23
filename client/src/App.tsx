import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Shell } from './components/layout/Shell';
import { OverviewModule } from './components/modules/OverviewModule';
import { ProfileModule } from './components/modules/ProfileModule';
import { AuditModule } from './components/modules/AuditModule';
import { RankingExplorerModule } from './components/modules/RankingExplorerModule';
import { ReviewsModule } from './components/modules/ReviewsModule';
import { PostsModule } from './components/modules/PostsModule';
import { QnaModule } from './components/modules/QnaModule';
import { CompetitorsModule } from './components/modules/CompetitorsModule';
import { AnalyticsModule } from './components/modules/AnalyticsModule';
import { TasksModule } from './components/modules/TasksModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { IntegrationsModule } from './components/modules/IntegrationsModule';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Shell />}>
            <Route index element={<OverviewModule />} />
            <Route path="profile" element={<ProfileModule />} />
            <Route path="audit" element={<AuditModule />} />
            <Route path="rankings" element={<RankingExplorerModule />} />
            <Route path="reviews" element={<ReviewsModule />} />
            <Route path="posts" element={<PostsModule />} />
            <Route path="qna" element={<QnaModule />} />
            <Route path="competitors" element={<CompetitorsModule />} />
            <Route path="analytics" element={<AnalyticsModule />} />
            <Route path="tasks" element={<TasksModule />} />
            <Route path="reports" element={<ReportsModule />} />
            <Route path="integrations" element={<IntegrationsModule />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
