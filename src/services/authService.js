// Servicio de autenticación para interactuar con la API
const API_BASE_URL = "http://127.0.0.1:8000";

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} True si el usuario tiene un token válido
 */
export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
}

/**
 * Obtiene el token de acceso actual
 * @returns {string|null} Token de acceso o null si no hay
 */
export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/**
 * Obtiene el ID de sesión actual
 * @returns {string|null} ID de sesión o null si no hay
 */
export function getSessionId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('session_id');
}

/**
 * Verifica si el token actual es válido consultando la API
 * @returns {Promise<boolean>} Promesa que resuelve a true si el token es válido
 */
export async function validateToken() {
  try {
    const token = getToken();
    if (!token) return false;
    
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error("Error validando token:", error);
    return false;
  }
}

/**
 * Inicia sesión en la API
 * @param {string} identifier - Email o nombre de usuario
 * @param {string} password - Contraseña
 * @returns {Promise<object>} Datos del usuario y token
 */
export async function login(identifier, password) {
  const formData = new URLSearchParams();
  formData.append("username", identifier);
  formData.append("password", password);
  
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail?.message || "Error de autenticación");
  }
  
  const data = await response.json();
  
  // Guardar token y session_id
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("session_id", data.session_id);
  
  return data;
}

/**
 * Registra un nuevo usuario
 * @param {object} userData - Datos del usuario
 * @returns {Promise<object>} Datos del usuario creado
 */
export async function register(userData) {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail?.message || "Error al registrar usuario");
  }
  
  return response.json();
}

/**
 * Cierra la sesión actual
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    const token = getToken();
    if (!token) return;
    
    await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  } finally {
    // Siempre limpiar el almacenamiento local
    localStorage.removeItem("access_token");
    localStorage.removeItem("session_id");
  }
}

/**
 * Cierra todas las sesiones del usuario
 * @returns {Promise<void>}
 */
export async function logoutAll() {
  try {
    const token = getToken();
    if (!token) return;
    
    await fetch(`${API_BASE_URL}/logout-all`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error("Error al cerrar todas las sesiones:", error);
  } finally {
    // Siempre limpiar el almacenamiento local
    localStorage.removeItem("access_token");
    localStorage.removeItem("session_id");
  }
}

/**
 * Cambia la contraseña del usuario
 * @param {string} oldPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<object>} Resultado de la operación
 */
export async function changePassword(oldPassword, newPassword) {
  const token = getToken();
  if (!token) throw new Error("No autenticado");
  
  const response = await fetch(`${API_BASE_URL}/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail?.message || "Error al cambiar contraseña");
  }
  
  return response.json();
}

/**
 * Solicita un token para restablecer la contraseña
 * @param {string} email - Email del usuario
 * @returns {Promise<object>} Resultado de la operación
 */
export async function requestPasswordReset(email) {
  const response = await fetch(`${API_BASE_URL}/request-password-reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail?.message || "Error al solicitar restablecimiento");
  }
  
  return response.json();
}

/**
 * Restablece la contraseña con un token
 * @param {string} token - Token de restablecimiento
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<object>} Resultado de la operación
 */
export async function resetPassword(token, newPassword) {
  const response = await fetch(`${API_BASE_URL}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token,
      new_password: newPassword
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail?.message || "Error al restablecer contraseña");
  }
  
  return response.json();
}

/**
 * Obtiene la información del usuario actual
 * @returns {Promise<object>} Datos del usuario
 */
export async function getCurrentUser() {
  const token = getToken();
  if (!token) throw new Error("No autenticado");
  
  const response = await fetch(`${API_BASE_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error("Error al obtener información del usuario");
  }
  
  return response.json();
}