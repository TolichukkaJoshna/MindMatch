import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

const ProtectedRoute = ({ children, requireOnboarding = false }: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      if (requireOnboarding && user) {
        const hasSkills = user.skills && user.skills.length > 0;
        const hasGoals = user.goals && user.goals.length > 0;

        if (!hasSkills || !hasGoals) {
          navigate('/onboarding');
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, user, requireOnboarding, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireOnboarding && user) {
    const hasSkills = user.skills && user.skills.length > 0;
    const hasGoals = user.goals && user.goals.length > 0;

    if (!hasSkills || !hasGoals) {
      return null;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
