import React, { useState, useEffect } from "react";
import somenLogo from "./somen-logo.png";
import StokTakip from "./StokTakip";
import AyarlarStokRBAC from "./AyarlarStokRBAC";
import PersonelTakip from "./PersonelTakip";
import OlcullerForm from "./OlcullerForm";
import { login as apiLogin, getRoles as apiGetRoles } from "./api";

// SATINALMA MODÜLÜNÜ TEK COMPONENT OLARAK EKLE
import SatinalmaModul from "./sprs/satinalmaModul";

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiLogin(username, password);
      
      // Store token
      localStorage.setItem('AUTH_TOKEN', data.token);

      onLogin({
        username: data.user.username,
        isRootAdmin: data.user.isRootAdmin,
        role: data.user.role,
        userId: data.user.id,
        isBackdoor: false
      });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || "Kullanıcı adı veya şifre hatalı!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(120deg,#e8f3ff 0%,#fafdff 100%)",
      fontFamily: "'Inter', Arial, sans-serif"
    }}>
      <form onSubmit={handleSubmit} style={{
        minWidth: 360, background: "#fff", padding: 48, borderRadius: 24,
        boxShadow: "0 10px 60px #0050b360", display: "flex", flexDirection: "column",
        gap: 22, alignItems: "center", border: "2.5px solid #e6f7ff"
      }}>
        <img src={somenLogo} alt="SOMEN" style={{ height: 62, marginBottom: 10 }} />
        <div style={{
          fontWeight: 900, fontSize: 32, letterSpacing: 1.5, marginBottom: 7,
          background: "linear-gradient(120deg,#00c7c7 0%,#156176 100%)", WebkitBackgroundClip: "text",
          color: "transparent", WebkitTextFillColor: "transparent",
          textShadow: "0 2px 15px #00b7b755"
        }}>
          GİRİŞ YAP
        </div>
        <input
          autoFocus
          placeholder="Kullanıcı adı"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{
            width: "100%", padding: "16px 22px", borderRadius: 10, border: "2px solid #bce0ff",
            fontSize: 18, fontWeight: 700, background: "#fafdff", color: "#156176", outlineColor: "#00b7b7"
          }}
        />
        <input
          placeholder="Şifre"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            width: "100%", padding: "16px 22px", borderRadius: 10, border: "2px solid #bce0ff",
            fontSize: 18, fontWeight: 700, background: "#fafdff", color: "#156176", outlineColor: "#00b7b7"
          }}
        />
        {error && (
          <div style={{
            color: "#f95e6e", fontWeight: 800, fontSize: 16, marginBottom: 4, letterSpacing: 0.6
          }}>
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "16px 0", borderRadius: 10, border: "none",
          background: "linear-gradient(120deg,#00c7c7 0%,#156176 100%)",
          color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: 1, cursor: loading ? "wait" : "pointer",
          marginTop: "8px", boxShadow: "0 4px 24px #00b7b744", transition: "0.2s",
          opacity: loading ? 0.7 : 1
        }}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState({
    username: "",
    isRootAdmin: false,
    role: null,
    userId: null,
    isBackdoor: false
  });
  const [currentMenu, setCurrentMenu] = useState("stok");
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      try {
        // Check if we have a valid token first
        const token = localStorage.getItem('AUTH_TOKEN');
        if (token) {
          const data = await apiGetRoles();
          setRoles(data);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
      } finally {
        setLoadingRoles(false);
      }
    }
    fetchRoles();
  }, []);

  function handleLogin({ username, isRootAdmin, role, userId }) {
    setSession({ username, isRootAdmin, role, userId, isBackdoor: false });
    localStorage.setItem("CURRENT_USER", username);
    if (isRootAdmin) localStorage.setItem("IS_ROOT_ADMIN", "1");
    else localStorage.removeItem("IS_ROOT_ADMIN");
    
    // Fetch roles after login
    apiGetRoles().then(data => setRoles(data)).catch(err => console.error('Error fetching roles:', err));
  }

  function logout() {
    setSession({ username: "", isRootAdmin: false, role: null, userId: null, isBackdoor: false });
    localStorage.removeItem("CURRENT_USER");
    localStorage.removeItem("IS_ROOT_ADMIN");
    localStorage.removeItem("AUTH_TOKEN");
  }

  const menus = [
    { key: "stok", label: "Stok Takip", icon: "📦" },
    { key: "olculler", label: "Ölçüler", icon: "📏" },
    { key: "personel", label: "Personel", icon: "👥" },
    { key: "satinalma", label: "Satın Alma", icon: "🛒" },
    { key: "ayarlar", label: "Ayarlar", icon: "⚙️" }
  ];

  useEffect(() => {
    if (!menus.find(m => m.key === currentMenu)) {
      setCurrentMenu(menus[0].key);
    }
    // eslint-disable-next-line
  }, [session.username, session.isRootAdmin]);

  useEffect(() => {
    logout();
    // eslint-disable-next-line
  }, []);

  if (loadingRoles) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", height: "100vh",
        fontSize: 22, color: "#156176", fontWeight: 700
      }}>
        Roller yükleniyor...
      </div>
    );
  }

  if (!session.username) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fafdff", fontFamily: "'Inter', Arial, sans-serif" }}>
      {/* Sidebar */}
      <div style={{
        width: 240, background: "linear-gradient(180deg,#fff 0%,#e8f3ff 100%)", borderRight: "2px solid #bce0ff",
        padding: "46px 22px 22px 22px", minHeight: "100vh", boxShadow: "4px 0 28px #e6f7ff44"
      }}>
        <img src={somenLogo} alt="SOMEN" style={{ width: 138, marginBottom: 38 }} />
        {menus.map(m => (
          <div key={m.key}
            onClick={() => setCurrentMenu(m.key)}
            style={{
              padding: "15px 16px", marginBottom: 12, borderRadius: 12,
              cursor: "pointer", fontWeight: 900, fontSize: 20, letterSpacing: 0.5,
              background: currentMenu === m.key
                ? "linear-gradient(90deg,#00c7c733 0%,#15617611 100%)"
                : "none",
              color: currentMenu === m.key ? "#00b7b7" : "#156176bb",
              display: "flex", alignItems: "center", gap: 14,
              boxShadow: currentMenu === m.key ? "0 2px 12px #00b7b733" : "none",
              transition: "all 0.13s"
            }}>
            <span style={{ fontSize: 26 }}>{m.icon}</span>
            <span>{m.label}</span>
          </div>
        ))}
        <button
          onClick={logout}
          style={{
            marginTop: 54, width: "100%", padding: "15px 0", borderRadius: 11,
            border: "none", background: "linear-gradient(120deg,#00b7b7 0%,#156176 100%)",
            color: "#fff", fontWeight: 900, fontSize: 19, letterSpacing: 1, cursor: "pointer",
            boxShadow: "0 3px 18px #00b7b733"
          }}>
          Çıkış Yap
        </button>
      </div>
      {/* Main content */}
      <div style={{ flex: 1, minHeight: "100vh", background: "#fafdff" }}>
        {currentMenu === "olculler" && (
          <OlcullerForm
            currentUser={session.username}
            isRootAdmin={session.isRootAdmin}
            currentUserId={session.userId}
            currentRole={session.role}
          />
        )}
        {currentMenu === "stok" && (
          <StokTakip
            currentUser={session.username}
            isRootAdmin={session.isRootAdmin}
            currentUserId={session.userId}
            currentRole={session.role}
          />
        )}
        {currentMenu === "personel" && (
          <PersonelTakip
            currentUser={session.username}
            isRootAdmin={session.isRootAdmin}
            currentUserId={session.userId}
            currentRole={session.role}
          />
        )}
        {currentMenu === "satinalma" && (
          <SatinalmaModul user={{
            id: session.userId,
            kullanici_adi: session.username,
            rol: session.role?.name,
            isRootAdmin: session.isRootAdmin,
            extra_permissions: session.role?.permissions || [],
            removed_permissions: []
          }} />
        )}
        {currentMenu === "ayarlar" && (
          <AyarlarStokRBAC
            currentUser={session.username}
            isRootAdmin={session.isRootAdmin}
            currentUserId={session.userId}
            currentRole={session.role}
            roles={roles}
            onLogout={logout}
          />
        )}
      </div>
    </div>
  );
}