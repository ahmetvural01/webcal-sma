import React, { useState, useEffect, useMemo } from "react";
import { rolesAPI, usersAPI } from "./api";
import YETKI_KATEGORILERI from "./YetkilerConfig";

// Tema renkleri ve stilleri
const theme = {
  colors: {
    primary: "#156176",
    secondary: "#00b7b7",
    accent: "#e8f7fa",
    error: "#ff4d4d",
    bg: "#f8fafd",
    white: "#fff",
    grey: "#bfbfbf",
    border: "#e0e0e0",
    hover: "#e0f7ff",
    disabled: "#f5f5f5"
  },
  radius: 14,
  shadow: "0 4px 24px #00b7b72a",
  font: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
};

const Modal = ({ open, onClose, children, wide }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(21,97,118,0.14)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: theme.colors.white,
        borderRadius: theme.radius * 1.2,
        minWidth: wide ? 800 : 500,
        maxWidth: "98vw",
        minHeight: 150,
        boxShadow: theme.shadow,
        padding: wide ? 46 : 38,
        position: "relative",
        fontFamily: theme.font,
        border: `2px solid ${theme.colors.accent}`,
        transition: "all .15s"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", right: 24, top: 18, border: "none", background: "none", fontSize: 34,
          color: theme.colors.grey, fontWeight: 800, cursor: "pointer", lineHeight: 1
        }} title="Kapat">&times;</button>
        {children}
      </div>
    </div>
  );
};

const ConfirmModal = ({ open, onClose, onConfirm, text }) => {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ fontWeight: 700, fontSize: 19, marginBottom: 30, color: theme.colors.primary }}>{text}</div>
      <div style={{ display: "flex", gap: 24, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={buttonStyle(theme, { variant: "ghost", color: "secondary", padding: "10px 28px" })}>Vazgeç</button>
        <button onClick={onConfirm} style={buttonStyle(theme, { variant: "filled", color: "error", padding: "10px 28px" })}>Evet, Sil</button>
      </div>
    </Modal>
  );
};

function buttonStyle(theme, { variant = "filled", color = "primary", padding = "12px 32px" } = {}) {
  const base = {
    fontWeight: 800,
    border: "none",
    borderRadius: theme.radius,
    padding,
    fontSize: 17,
    cursor: "pointer",
    fontFamily: theme.font,
    boxShadow: "0 2px 8px #00b7b722",
    transition: "all .11s"
  };
  if (variant === "filled") {
    return {
      ...base,
      background: color === "primary"
        ? `linear-gradient(120deg,${theme.colors.secondary} 0%,${theme.colors.primary} 100%)`
        : color === "error"
          ? theme.colors.error
          : theme.colors.secondary,
      color: "#fff"
    };
  }
  if (variant === "ghost") {
    return {
      ...base,
      background: theme.colors.accent,
      color: color === "secondary" ? theme.colors.secondary : theme.colors.primary,
      boxShadow: "none"
    };
  }
  return base;
}

// Yetki Akordiyon
function PermissionAccordion({ permCategories, permState, onPermToggle, onSelectAll, editable }) {
  const [openAcc, setOpenAcc] = useState({});
  useEffect(() => { setOpenAcc({}); }, [permCategories]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {permCategories.map(cat => {
        const allPermsSelected = cat.permissions.every(perm => permState.includes(perm.key));
        const somePermsSelected = cat.permissions.some(perm => permState.includes(perm.key));
        return (
          <div key={cat.key} style={{
            border: `1.5px solid ${theme.colors.accent}`,
            borderRadius: theme.radius * 0.8,
            marginBottom: 3,
            background: theme.colors.bg
          }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                color: theme.colors.secondary,
                padding: "18px 26px 15px 22px",
                background: theme.colors.accent,
                borderRadius: theme.radius * 0.8,
                borderBottom: openAcc[cat.key] ? `2.5px solid ${theme.colors.secondary}33` : "none",
                userSelect: "none",
                letterSpacing: 0.2
              }}
              onClick={() => setOpenAcc(o => ({ ...o, [cat.key]: !o[cat.key] }))}
              tabIndex={0}
              role="button"
              aria-expanded={!!openAcc[cat.key]}
              aria-controls={`permcat-${cat.key}`}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setOpenAcc(o => ({ ...o, [cat.key]: !o[cat.key] })); }}
            >
              <span style={{
                marginRight: 13,
                fontSize: 22,
                transition: "transform .14s",
                display: "inline-block",
                transform: openAcc[cat.key] ? "rotate(90deg)" : "rotate(0deg)"
              }}>▶</span>
              <span>{cat.label}</span>
              <div style={{ flex: 1 }} />
              {editable && (
                <button
                  title={allPermsSelected ? "Tümünü Kaldır" : "Tümünü Seç"}
                  onClick={e => {
                    e.stopPropagation();
                    onSelectAll(
                      cat.key,
                      cat.permissions.map(p => p.key),
                      !allPermsSelected
                    );
                  }}
                  style={{
                    background: allPermsSelected ? "#fbeaea" : theme.colors.accent,
                    color: allPermsSelected ? theme.colors.error : theme.colors.secondary,
                    border: "none",
                    borderRadius: theme.radius * 0.45,
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "7px 21px",
                    marginLeft: 10,
                    cursor: "pointer",
                    boxShadow: somePermsSelected && !allPermsSelected ? "0 0 0 2px #ffe58f" : undefined,
                    transition: "all .12s"
                  }}
                >
                  {allPermsSelected ? "Tümünü Kaldır" : "Tümünü Seç"}
                </button>
              )}
            </div>
            {openAcc[cat.key] && (
              <div id={`permcat-${cat.key}`} style={{
                padding: "18px 18px 13px 36px", display: "flex", flexDirection: "column", gap: 11, background: theme.colors.white,
                borderBottomLeftRadius: theme.radius * 0.8, borderBottomRightRadius: theme.radius * 0.8
              }}>
                {cat.permissions.map(perm => (
                  <label key={perm.key} style={{
                    background: permState.includes(perm.key) ? theme.colors.accent : "#fff",
                    border: permState.includes(perm.key) ? `2px solid ${theme.colors.secondary}` : `1.2px solid ${theme.colors.border}`,
                    borderRadius: 7,
                    padding: "6px 17px",
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    fontWeight: permState.includes(perm.key) ? 700 : 500,
                    color: theme.colors.primary,
                    boxShadow: permState.includes(perm.key) ? "0 2px 8px #00b7b733" : undefined,
                    transition: "all .12s"
                  }}>
                    <input
                      type="checkbox"
                      style={{ marginRight: 11, accentColor: theme.colors.secondary, width: 20, height: 20 }}
                      checked={permState.includes(perm.key)}
                      disabled={!editable}
                      onChange={() => editable && onPermToggle(perm.key)}
                      aria-checked={permState.includes(perm.key)}
                    />
                    <span style={{ marginRight: 7 }}>{perm.icon}</span>
                    <span>{perm.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getUserEffectivePermissions(user, roles, isRootAdmin) {
  if (!user) return [];
  if (isRootAdmin) {
    return YETKI_KATEGORILERI.flatMap(cat => cat.permissions.map(p => p.key));
  }
  const roleObj = roles.find(r => r.name === user.rol);
  const permsFromRole = roleObj ? roleObj.permissions : [];
  return Array.from(new Set([
    ...permsFromRole,
    ...(user.extra_permissions || [])
  ])).filter(p => !(user.removed_permissions || []).includes(p));
}

export default function AyarlarStokRBAC({ currentUser, isRootAdmin = false, isBackdoor = false }) {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState(false);
  const [userModal, setUserModal] = useState({ open: false, idx: null, user: null, addMode: false, formError: "" });
  const [roleModal, setRoleModal] = useState({ open: false, idx: null, role: null, addMode: false });
  const [permState, setPermState] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [userPermDrafts, setUserPermDrafts] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const dbRoles = await rolesAPI.getAll();
        setRoles(dbRoles || []);
        const dbUsers = await usersAPI.getAll();
        setUsers(dbUsers || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
    setUserPermDrafts({});
  }, [pending]);

  const activeUser = useMemo(
    () => (isRootAdmin || isBackdoor)
      ? { kullanici_adi: "admin", rol: "admin", extra_permissions: [], removed_permissions: [], sifre: "" }
      : users.find(u => u.kullanici_adi === currentUser) || null,
    [isRootAdmin, isBackdoor, users, currentUser]
  );

  let filteredUsers = [];
  if (isRootAdmin || isBackdoor) {
    filteredUsers = users;
  } else if (activeUser) {
    filteredUsers = users.filter(u => u.kullanici_adi !== "admin");
    if (activeUser.rol === "admin") {
      filteredUsers = filteredUsers.filter(u =>
        u.rol !== "admin" || u.kullanici_adi === activeUser.kullanici_adi
      );
    } else {
      filteredUsers = filteredUsers.filter(u => u.kullanici_adi === activeUser.kullanici_adi);
    }
  }

  const canSeeRolesPanel = isRootAdmin || isBackdoor;
  const isAdminOrRoot = isRootAdmin || isBackdoor || (activeUser && activeUser.rol === "admin");

  function getAllowedRolesForUserAddEdit(targetUser) {
    if (isRootAdmin || isBackdoor) return roles.map(r => r.name);
    if (activeUser && activeUser.rol === "admin") {
      if (targetUser?.rol === "admin" && targetUser?.kullanici_adi !== activeUser.kullanici_adi) {
        return ["admin"];
      }
      return roles.filter(r => r.name !== "admin").map(r => r.name);
    }
    return [activeUser?.rol].filter(Boolean);
  }

  function canEditUser(u) {
    if (isRootAdmin || isBackdoor) return true;
    if (activeUser && activeUser.rol === "admin") {
      if (u.rol === "admin" && u.kullanici_adi !== activeUser.kullanici_adi) return false;
      if (u.rol === "admin" && u.kullanici_adi === activeUser.kullanici_adi) return true;
      return true;
    }
    return u.kullanici_adi === activeUser?.kullanici_adi;
  }

  function canDeleteUser(u) {
    if (isRootAdmin || isBackdoor) return u.kullanici_adi !== "admin";
    if (activeUser && activeUser.rol === "admin") {
      if (u.rol === "admin") return false;
      return true;
    }
    return false;
  }

  function getNextRoleCode() {
    const nums = roles.map(r =>
      /^role-(\d+)$/.test(r.name) ? parseInt(r.name.replace("role-", "")) : 0
    );
    const max = Math.max(...nums, 0);
    return `role-${max + 1}`;
  }

  // Kullanıcı ekle/düzenle
  function openUserAddModal() {
    const defaultRole = roles.find(r => r.name === getAllowedRolesForUserAddEdit()[0]);
    setUserModal({
      open: true,
      idx: null,
      user: {
        kullanici_adi: "",
        sifre: "",
        rol: defaultRole ? defaultRole.name : "",
        extra_permissions: [],
        removed_permissions: []
      },
      addMode: true,
      formError: ""
    });
  }
  function openUserEditModal(idx) {
    const user = { ...filteredUsers[idx], sifre: "" };
    setUserModal({
      open: true,
      idx,
      user,
      addMode: false,
      formError: ""
    });
    setUserPermDrafts(drafts => ({
      ...drafts,
      [user.id]: {
        extra_permissions: Array.isArray(user.extra_permissions) ? [...user.extra_permissions] : [],
        removed_permissions: Array.isArray(user.removed_permissions) ? [...user.removed_permissions] : []
      }
    }));
  }

  async function saveUserModal() {
    const { kullanici_adi, sifre, rol } = userModal.user;
    const draftPerm = userPermDrafts[userModal.user.id] || { extra_permissions: [], removed_permissions: [] };
    if (!kullanici_adi.trim() || (!sifre.trim() && userModal.addMode) || !rol) {
      setUserModal(m => ({ ...m, formError: "Kullanıcı adı, şifre ve rol zorunludur." }));
      return;
    }
    
    try {
      if (userModal.addMode) {
        if (users.some(u => u.kullanici_adi === kullanici_adi)) {
          setUserModal(m => ({ ...m, formError: "Bu kullanıcı adı zaten var!" }));
          return;
        }
        await usersAPI.create({
          kullanici_adi,
          sifre, // API will hash it server-side
          rol,
          extra_permissions: draftPerm.extra_permissions,
          removed_permissions: draftPerm.removed_permissions
        });
      } else {
        const updateObj = {
          rol,
          extra_permissions: draftPerm.extra_permissions,
          removed_permissions: draftPerm.removed_permissions
        };
        if (sifre.trim()) updateObj.sifre = sifre; // API will hash it server-side
        await usersAPI.update(filteredUsers[userModal.idx].id, updateObj);
      }
      setUserModal({ open: false, idx: null, user: null, addMode: false, formError: "" });
      setUserPermDrafts(drafts => {
        const copy = { ...drafts };
        delete copy[userModal.user.id];
        return copy;
      });
      setPending(p => !p);
    } catch (error) {
      setUserModal(m => ({ ...m, formError: error.response?.data?.error || error.message }));
    }
  }

  function askDeleteUser(idx) {
    setConfirmModal({ open: true, id: filteredUsers[idx].id });
  }

  async function confirmDeleteUser() {
    const id = confirmModal.id;
    const user = users.find(u => u.id === id);
    if (user.kullanici_adi === "admin") return;
    try {
      await usersAPI.delete(id);
      setConfirmModal({ open: false, id: null });
      setPending(p => !p);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  // Rol düzenleme
  function openRoleModal(idx) {
    setRoleModal({ open: true, idx, role: { ...roles[idx] }, addMode: false });
    setPermState([...roles[idx].permissions]);
  }
  function openRoleAddModal() {
    setRoleModal({ open: true, idx: null, role: { name: getNextRoleCode(), label: "", color: theme.colors.secondary, permissions: [], fixed: false }, addMode: true });
    setPermState([]);
  }
  function handlePermToggle(key) {
    setPermState(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  }
  function handlePermSelectAll(_, permKeys, checked) {
    setPermState(prev => {
      if (checked) {
        return Array.from(new Set([...prev, ...permKeys]));
      } else {
        return prev.filter(p => !permKeys.includes(p));
      }
    });
  }
  async function saveRoleModal() {
    let { name, label, color, fixed } = roleModal.role;
    if (!label.trim()) return;
    
    try {
      if (roleModal.addMode) {
        if (roles.some(r => r.name === name)) return;
        await rolesAPI.create({ name, label, color, permissions: permState, fixed: !!fixed });
      } else {
        await rolesAPI.update(roles[roleModal.idx].id, { name, label, color, permissions: permState, fixed: !!fixed });
      }
      setRoleModal({ open: false, idx: null, role: null, addMode: false });
      setPermState([]);
      setPending(p => !p);
    } catch (error) {
      console.error('Error saving role:', error);
    }
  }
  async function deleteRole(idx) {
    if (roles[idx].fixed) return;
    const id = roles[idx].id;
    try {
      await rolesAPI.delete(id);
      setPending(p => !p);
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  }

  function handleUserPermDraftChange(user, permKey) {
    const rolePerms = roles.find(r => r.name === user.rol)?.permissions || [];
    const isRolePerm = rolePerms.includes(permKey);
    const drafts = userPermDrafts[user.id] || {
      extra_permissions: Array.isArray(user.extra_permissions) ? [...user.extra_permissions] : [],
      removed_permissions: Array.isArray(user.removed_permissions) ? [...user.removed_permissions] : []
    };
    const effectivePerms = Array.from(new Set([
      ...rolePerms.filter(p => !drafts.removed_permissions.includes(p)),
      ...drafts.extra_permissions
    ]));
    if (effectivePerms.includes(permKey)) {
      if (isRolePerm) {
        drafts.removed_permissions = Array.from(new Set([...drafts.removed_permissions, permKey]));
        drafts.extra_permissions = drafts.extra_permissions.filter(p => p !== permKey);
      } else {
        drafts.extra_permissions = drafts.extra_permissions.filter(p => p !== permKey);
      }
    } else {
      if (isRolePerm) {
        drafts.removed_permissions = drafts.removed_permissions.filter(p => p !== permKey);
      } else {
        drafts.extra_permissions = Array.from(new Set([...drafts.extra_permissions, permKey]));
      }
    }
    setUserPermDrafts(prev => ({
      ...prev,
      [user.id]: { ...drafts }
    }));
  }
  function handleUserPermDraftSelectAll(user, permKeys, checked) {
    const rolePerms = roles.find(r => r.name === user.rol)?.permissions || [];
    const drafts = userPermDrafts[user.id] || {
      extra_permissions: Array.isArray(user.extra_permissions) ? [...user.extra_permissions] : [],
      removed_permissions: Array.isArray(user.removed_permissions) ? [...user.removed_permissions] : []
    };
    if (checked) {
      const newExtras = [
        ...drafts.extra_permissions,
        ...permKeys.filter(k => !rolePerms.includes(k))
      ];
      const newRemoved = drafts.removed_permissions.filter(k => !permKeys.includes(k));
      setUserPermDrafts(prev => ({
        ...prev,
        [user.id]: {
          extra_permissions: Array.from(new Set(newExtras)),
          removed_permissions: newRemoved
        }
      }));
    } else {
      const newRemoved = [
        ...drafts.removed_permissions,
        ...permKeys.filter(k => rolePerms.includes(k))
      ];
      const newExtras = drafts.extra_permissions.filter(k => !permKeys.includes(k));
      setUserPermDrafts(prev => ({
        ...prev,
        [user.id]: {
          extra_permissions: newExtras,
          removed_permissions: Array.from(new Set(newRemoved))
        }
      }));
    }
  }
  function getDraftUserEffectivePermissions(user) {
    const drafts = userPermDrafts[user.id] || {
      extra_permissions: Array.isArray(user.extra_permissions) ? [...user.extra_permissions] : [],
      removed_permissions: Array.isArray(user.removed_permissions) ? [...user.removed_permissions] : []
    };
    const rolePerms = roles.find(r => r.name === user.rol)?.permissions || [];
    return Array.from(new Set([
      ...rolePerms.filter(p => !drafts.removed_permissions.includes(p)),
      ...drafts.extra_permissions
    ]));
  }

  return (
    <div style={{
      maxWidth: 1340, margin: "38px auto",
      background: `linear-gradient(108deg,${theme.colors.bg} 0%,#e6f8ff 100%)`,
      borderRadius: theme.radius * 1.2, padding: "38px 2vw 32px 2vw",
      fontFamily: theme.font,
      boxShadow: theme.shadow
    }}>
      <h2 style={{
        color: theme.colors.primary, textAlign: "center", marginBottom: 38, fontWeight: 900,
        letterSpacing: 1, fontSize: 34, textShadow: "0 2px 8px #00b7b711"
      }}>
        Kullanıcılar ve Yetkiler
      </h2>
      <div style={{
        display: "flex", gap: 38, alignItems: "flex-start",
        flexWrap: "wrap", justifyContent: "center"
      }}>
        {canSeeRolesPanel && (
          <div style={{
            flex: 1, minWidth: 300, maxWidth: 430, background: theme.colors.white, borderRadius: theme.radius,
            boxShadow: "0 2px 12px #e6f7ff", marginBottom: 10, padding: "18px 22px"
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
              <span style={{
                color: theme.colors.primary, fontWeight: 900, fontSize: 22, margin: "0 0 13px 0", letterSpacing: 0.6
              }}>Roller</span>
              <span style={{ marginLeft: 14, color: theme.colors.grey, fontSize: 16 }}>({roles.length})</span>
            </div>
            <button style={buttonStyle(theme, { variant: "filled", color: "secondary", padding: "13px 0", width: "100%" })} onClick={openRoleAddModal}>+ Yeni Rol</button>
            <div style={{
              border: `1.5px solid ${theme.colors.accent}`, borderRadius: theme.radius, maxHeight: 270, overflowY: "auto", background: theme.colors.bg, marginTop: 13
            }}>
              {roles.map((r, i) => (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center",
                  borderBottom: "1px solid #f0f0f0", padding: "12px 16px"
                }}>
                  <span style={{
                    minWidth: 22, minHeight: 22, display: "inline-block", background: r.color || "#eee",
                    borderRadius: "50%", marginRight: 13, border: "2.2px solid #fff", boxShadow: "0 1px 4px #ddd"
                  }}></span>
                  <span style={{ minWidth: 70, color: theme.colors.primary, fontWeight: 700, fontSize: 17 }}>{r.name}</span>
                  <b style={{ minWidth: 85, color: r.color || theme.colors.primary, fontWeight: 900, fontSize: 18 }}>{r.label}</b>
                  {r.fixed && <span style={{ fontSize: 13, background: theme.colors.primary, color: "#fff", borderRadius: 6, padding: "3px 10px", marginLeft: 9 }}>Admin</span>}
                  <span style={{ flex: 1 }} />
                  {!r.fixed && (
                    <button onClick={() => deleteRole(i)} style={buttonStyle(theme, { variant: "filled", color: "error", padding: "6px 21px", fontSize: 14 })}>Sil</button>
                  )}
                  {!r.fixed && (
                    <button onClick={() => openRoleModal(i)}
                      style={buttonStyle(theme, { variant: "ghost", color: "secondary", padding: "6px 21px", fontSize: 14, marginLeft: 10 })}
                    >Düzenle</button>
                  )}
                  {r.fixed && <span style={{ width: 30 }} />}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{
          flex: 2.5, minWidth: 420, maxWidth: 940,
          boxShadow: theme.shadow, marginBottom: 10, padding: "18px 16px",
          background: theme.colors.white, borderRadius: theme.radius
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{
              color: theme.colors.primary, fontWeight: 900, fontSize: 22, margin: "0 0 13px 0", letterSpacing: 0.6
            }}>Kullanıcılar</span>
            {isAdminOrRoot && (
              <button style={buttonStyle(theme, { variant: "filled", color: "secondary", padding: "11px 30px", fontSize: 17, borderRadius: 11 })}
                onClick={openUserAddModal}
                disabled={getAllowedRolesForUserAddEdit().length === 0}
              >+ Yeni Kullanıcı</button>
            )}
          </div>
          <div style={{overflowX: "auto", width: "100%"}}>
            <table style={{
              width: "100%", background: theme.colors.bg, borderRadius: 9, margin: "10px 0 0 0",
              boxShadow: "0 1.5px 16px #bfbfbf22", minWidth: 500, borderCollapse: "collapse"
            }}>
              <thead>
                <tr style={{ background: theme.colors.accent }}>
                  <th style={{ padding: "15px 11px", fontWeight: 800, color: theme.colors.primary, fontSize: 17, width: 140, textAlign: "left" }}>Kullanıcı Adı</th>
                  <th style={{ padding: "15px 11px", fontWeight: 800, color: theme.colors.primary, fontSize: 17, width: 85 }}>Şifre</th>
                  {isAdminOrRoot && <th style={{ padding: "15px 11px", fontWeight: 800, color: theme.colors.primary, fontSize: 17, width: 120 }}>Rol</th>}
                  <th style={{ padding: "15px 11px", width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => {
                  const isMe = activeUser && u.kullanici_adi === activeUser.kullanici_adi;
                  return (
                  <tr key={u.id} style={{
                    background: isMe ? theme.colors.accent : (i % 2 ? "#f7fafc" : "#fff"),
                    verticalAlign: "top"
                  }}>
                    <td style={{ fontWeight: 800, fontSize: 16, textAlign: "left", maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.kullanici_adi} {isMe && <span style={{
                        color: theme.colors.secondary, background: theme.colors.accent, borderRadius: 8, fontSize: 13, padding: "3px 11px", fontWeight: 900, marginLeft: 7
                      }}>(Siz)</span>}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 19, letterSpacing: 2, fontFamily: "monospace"
                      }}>•••••••</span>
                    </td>
                    {isAdminOrRoot ? (
                      <>
                        <td>
                          <select
                            value={u.rol}
                            disabled={
                              (!(isRootAdmin || isBackdoor) && (activeUser && activeUser.rol === "admin" && u.rol === "admin" && u.kullanici_adi !== activeUser.kullanici_adi))
                            }
                            onChange={async e => {
                              try {
                                await usersAPI.update(u.id, { rol: e.target.value, extra_permissions: [], removed_permissions: [] });
                                setPending(p => !p);
                              } catch (error) {
                                console.error('Error updating user role:', error);
                              }
                            }}
                            style={{
                              borderRadius: 8,
                              border: `1.5px solid ${theme.colors.border}`,
                              padding: "7px 14px",
                              fontSize: 16,
                              background: theme.colors.accent,
                              fontWeight: 800,
                              minWidth: 100
                            }}
                          >
                            {roles
                              .filter(r =>
                                (isRootAdmin || isBackdoor) || (activeUser && activeUser.rol === "admin"
                                  ? r.name !== "admin"
                                  : true)
                                || ((isRootAdmin || isBackdoor) && r.name === "admin")
                              )
                              .map(r => (
                                <option key={r.name} value={r.name}>{r.label}</option>
                              ))}
                          </select>
                        </td>
                        <td>
                          {canEditUser(u) && (
                            <button
                              style={buttonStyle(theme, { variant: "ghost", color: "secondary", padding: "7px 22px", fontSize: 15 })}
                              onClick={() => openUserEditModal(i)}
                            >Düzenle</button>
                          )}
                        </td>
                      </>
                    ) : (
                      <td>
                        {u.kullanici_adi === activeUser.kullanici_adi && (
                          <button style={buttonStyle(theme, { variant: "ghost", color: "secondary", padding: "7px 22px", fontSize: 15 })}
                            onClick={() => {
                              openUserEditModal(i);
                            }}
                          >Düzenle</button>
                        )}
                      </td>
                    )}
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          <div style={{ color: theme.colors.grey, fontSize: 15, marginTop: 22 }}>
            <b>Not:</b> <br />
            - Roller paneli sadece yeni kullanıcıların başlangıç yetkilerini belirler, mevcut kullanıcıların yetkisi etkilenmez.<br />
            - Kullanıcılar için yetkiler sadece kullanıcılar panelinden değiştirilebilir.<br />
            - Adminler birbirinin bilgilerine ve yetkilerine erişemez.<br />
            - Adminler başka admin ekleyemez, silemez, değiştiremez.<br />
            - Adminler sadece mevcut rollere göre yetki tanımlayabilir, yeni rol ekleyemez.<br />
            - Kullanıcılar yalnızca kendi bilgilerini görüp değiştirebilir.<br />
            - Tüm panel fonksiyonları yetkilere göre sınırlandırılmıştır.
          </div>
        </div>
      </div>
      {pending && (
        <div style={{
          position: "fixed", top: 24, right: 38, background: theme.colors.secondary, color: "#fff",
          padding: "12px 28px", borderRadius: 13, fontSize: 18, fontWeight: 900, zIndex: 9999,
          boxShadow: "0 4px 24px #00b7b744"
        }}>
          ✔️ Kaydedildi!
        </div>
      )}
      {/* Modal: Rol Düzenle/Ekle */}
      {canSeeRolesPanel && (
        <Modal open={roleModal.open} onClose={() => { setRoleModal({ open: false, idx: null, role: null, addMode: false }); setPermState([]); }} wide>
          <h3 style={{
            fontWeight: 900, color: theme.colors.primary, marginTop: 0, fontSize: 23, marginBottom: 24, letterSpacing: 0.1
          }}>
            {roleModal.addMode ? "Yeni Rol Ekle" : "Rolü Düzenle"}
          </h3>
          {roleModal.role && (
            <>
              <div style={{ margin: "12px 0 19px 0", display: "flex", gap: 37, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <label style={{ fontWeight: 800, fontSize: 16, color: theme.colors.secondary }}>Rol Adı</label><br />
                  <input
                    placeholder="Rol adı"
                    value={roleModal.role.label}
                    onChange={e => {
                      const label = e.target.value;
                      let name = roleModal.role.name;
                      if (roleModal.addMode) name = getNextRoleCode();
                      setRoleModal(m => ({ ...m, role: { ...m.role, label, name } }));
                    }}
                    style={{
                      borderRadius: 9, border: `1.5px solid ${theme.colors.border}`, padding: "8px 15px", fontSize: 19, background: "#fff",
                      outline: "none", margin: "3px 0", fontWeight: 800, width: 180
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 800, fontSize: 16, color: theme.colors.secondary }}>Rol Kodu (Otomatik)</label><br />
                  <input
                    placeholder="Rol kodu"
                    value={roleModal.role.name}
                    readOnly
                    style={{
                      borderRadius: 9, border: `1.5px solid ${theme.colors.border}`, padding: "8px 15px", fontSize: 19, background: theme.colors.bg,
                      outline: "none", margin: "3px 0", fontWeight: 800, width: 145
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 800, fontSize: 16, color: theme.colors.secondary }}>Renk</label><br />
                  <input type="color" value={roleModal.role.color}
                    onChange={e => setRoleModal(m => ({ ...m, role: { ...m.role, color: e.target.value } }))}
                    style={{ width: 40, height: 40, border: "none", background: "none", cursor: "pointer" }} />
                </div>
              </div>
              <PermissionAccordion
                permCategories={YETKI_KATEGORILERI}
                permState={permState}
                onPermToggle={handlePermToggle}
                onSelectAll={handlePermSelectAll}
                editable={true}
              />
              <button style={buttonStyle(theme, { variant: "filled", color: "secondary", padding: "13px 0", fontSize: 18, width: 140, float: "right", marginTop: 26 })} onClick={saveRoleModal}>
                {roleModal.addMode ? "Ekle" : "Kaydet"}
              </button>
            </>
          )}
        </Modal>
      )}
      {/* Modal: Kullanıcı Ekle/Düzenle */}
      <Modal open={userModal.open} onClose={() => {
        setUserModal({ open: false, idx: null, user: null, addMode: false, formError: "" });
        if(userModal.user) setUserPermDrafts(drafts => {
          const copy = { ...drafts };
          delete copy[userModal.user.id];
          return copy;
        });
      }} wide>
        <h3 style={{
          fontWeight: 900, color: theme.colors.primary, marginTop: 0, fontSize: 23, marginBottom: 24, letterSpacing: 0.1
        }}>
          {userModal.addMode ? "Yeni Kullanıcı Ekle" : "Kullanıcıyı Düzenle"}
        </h3>
        {userModal.user && (
          <>
            <div style={{ margin: "10px 0 0 0", display: "flex", flexDirection: "row", gap: 52, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 800, fontSize: 15, color: theme.colors.secondary }}>Kullanıcı Adı</label>
                <input placeholder="Kullanıcı adı" value={userModal.user.kullanici_adi}
                  onChange={e => setUserModal(m => ({ ...m, user: { ...m.user, kullanici_adi: e.target.value } }))}
                  style={{
                    borderRadius: 8, border: `1.5px solid ${theme.colors.border}`, padding: "8px 14px", fontSize: 18, background: "#fff",
                    outline: "none", margin: "6px 0", fontWeight: 800, width: 180
                  }}
                  disabled={!userModal.addMode}
                  maxLength={32}
                />
                <label style={{ fontWeight: 800, fontSize: 15, color: theme.colors.secondary, marginTop: 20, display: "block" }}>Şifre (değiştirmek için doldurun, boşsa değişmez)</label>
                <input
                  placeholder="Yeni şifre"
                  value={userModal.user.sifre ?? ""}
                  type="text"
                  autoComplete="new-password"
                  onChange={e =>
                    setUserModal(m => ({
                      ...m,
                      user: { ...m.user, sifre: e.target.value }
                    }))
                  }
                  style={{
                    borderRadius: 8, border: `1.5px solid ${theme.colors.border}`, padding: "8px 14px", fontSize: 18, background: "#fff",
                    outline: "none", margin: "6px 0", fontWeight: 800, width: 180
                  }}
                />
                {(isAdminOrRoot && userModal.addMode) && (
                  <>
                    <label style={{ fontWeight: 800, fontSize: 15, color: theme.colors.secondary, marginTop: 20, display: "block" }}>Rol</label>
                    <select
                      value={userModal.user.rol}
                      onChange={e => setUserModal(m => ({ ...m, user: { ...m.user, rol: e.target.value, extra_permissions: [], removed_permissions: [] } }))}
                      style={{
                        borderRadius: 8, border: `1.5px solid ${theme.colors.border}`, padding: "8px 14px", fontSize: 17, background: theme.colors.accent, fontWeight: 800, width: 180, marginTop: 5
                      }}
                    >
                      {roles
                        .filter(r =>
                          getAllowedRolesForUserAddEdit(userModal.user).includes(r.name)
                        )
                        .map(r => (
                          <option key={r.name} value={r.name}>{r.label}</option>
                        ))}
                    </select>
                  </>
                )}
                {(isAdminOrRoot && !userModal.addMode) && (
                  <>
                    <label style={{ fontWeight: 800, fontSize: 15, color: theme.colors.secondary, marginTop: 20, display: "block" }}>Rol</label>
                    <select
                      value={userModal.user.rol}
                      disabled={
                        (!(isRootAdmin || isBackdoor) && (activeUser && activeUser.rol === "admin" && userModal.user.rol === "admin" && userModal.user.kullanici_adi !== activeUser.kullanici_adi))
                      }
                      onChange={e => setUserModal(m => ({ ...m, user: { ...m.user, rol: e.target.value, extra_permissions: [], removed_permissions: [] } }))}
                      style={{
                        borderRadius: 8, border: `1.5px solid ${theme.colors.border}`, padding: "8px 14px", fontSize: 17, background: theme.colors.accent, fontWeight: 800, width: 180, marginTop: 5
                      }}
                    >
                      {roles
                        .filter(r =>
                          getAllowedRolesForUserAddEdit(userModal.user).includes(r.name)
                        )
                        .map(r => (
                          <option key={r.name} value={r.name}>{r.label}</option>
                        ))}
                    </select>
                  </>
                )}
              </div>
              <div style={{ flex: 2, minWidth: 340 }}>
                <label style={{ fontWeight: 800, fontSize: 16, color: theme.colors.secondary }}>Yetkiler</label>
                <PermissionAccordion
                  permCategories={YETKI_KATEGORILERI}
                  permState={getDraftUserEffectivePermissions(userModal.user)}
                  onPermToggle={permKey => handleUserPermDraftChange(userModal.user, permKey)}
                  onSelectAll={(catKey, permKeys, checked) => handleUserPermDraftSelectAll(userModal.user, permKeys, checked)}
                  editable={true}
                />
              </div>
            </div>
            {userModal.formError && <div style={{ color: theme.colors.error, fontWeight: 900, marginTop: 20, fontSize: 17 }}>{userModal.formError}</div>}
            <div style={{ display: "flex", gap: 22, alignItems: "center", marginTop: 38, justifyContent: "flex-end" }}>
              {!userModal.addMode && canDeleteUser(userModal.user) && (
                <button style={buttonStyle(theme, { variant: "filled", color: "error", padding: "12px 0", fontSize: 16, width: 120 })} onClick={() => setConfirmModal({ open: true, id: userModal.user.id })}>Sil</button>
              )}
              <button style={buttonStyle(theme, { variant: "filled", color: "secondary", padding: "12px 0", fontSize: 16, width: 130 })} onClick={saveUserModal}>{userModal.addMode ? "Ekle" : "Kaydet"}</button>
            </div>
          </>
        )}
      </Modal>
      {/* Kullanıcı silme onay */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, id: null })}
        onConfirm={confirmDeleteUser}
        text="Kullanıcıyı silmek istediğinize emin misiniz?"
      />
    </div>
  );
}