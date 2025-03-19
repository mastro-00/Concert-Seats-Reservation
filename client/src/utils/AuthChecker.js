import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../utils/API';

// This component checks if the user is authenticated on every location.pathname change and updates the state.
const AuthChecker = ({ setUser, setIsAuthenticated }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const allowedPaths = ['/', '/login', '/seatview']; // Paths that do not require authentication

  const checkAuth = async () => {
    // console.log("DEBUG: checkAuth");
    try {
      const user = await API.getUserInfo();
      setUser(user);
      setIsAuthenticated(!!user);
    } catch (err) {
      setIsAuthenticated(false);
      if (!allowedPaths.includes(location.pathname)) {
          navigate('/');
          setIsAuthenticated(false);
          setUser(null);
      }
    }
  };

  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  return null; // This component does not render anything
};

export default AuthChecker;
