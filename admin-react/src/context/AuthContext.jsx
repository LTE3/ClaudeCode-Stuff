import { createContext, useState, useEffect, useCallback } from 'react';
import { supabaseRpc } from '../config/supabase';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [password, setPassword] = useState(null);
  const [signups, setSignups] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (pw) => {
    const data = await supabaseRpc('get_signups', {
      admin_password: pw,
      page_offset: 0,
      page_limit: 1000
    });
    sessionStorage.setItem('lacasita_admin_pw', pw);
    setPassword(pw);
    setSignups(data);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('lacasita_admin_pw');
    setPassword(null);
    setSignups([]);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem('lacasita_admin_pw');
    if (!stored) {
      setLoading(false);
      return;
    }
    supabaseRpc('get_signup_count', { admin_password: stored })
      .then(() => {
        setPassword(stored);
        setIsAuthenticated(true);
        return supabaseRpc('get_signups', {
          admin_password: stored,
          page_offset: 0,
          page_limit: 1000
        });
      })
      .then((data) => setSignups(data))
      .catch(() => sessionStorage.removeItem('lacasita_admin_pw'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ password, signups, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
