/**
 * FinPilot - Google Sheets API Service Layer
 * 
 * Interacts directly with the Google Apps Script Web App.
 */

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

class GoogleSheetsApi {
  constructor() {
    if (!SCRIPT_URL) {
      console.warn("VITE_GOOGLE_SCRIPT_URL is not defined in .env");
    }
  }

  async get(action) {
    if (!SCRIPT_URL) return { data: [] };
    try {
      const response = await fetch(`${SCRIPT_URL}?action=${action}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return { data };
    } catch (error) {
      console.error(`Error fetching ${action}:`, error);
      throw error;
    }
  }

  async post(action, payload, id = null) {
    if (!SCRIPT_URL) return { data: payload };
    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        // mode: "no-cors", // Cannot read response if no-cors, we must use cors and Apps Script handles it via redirect
        body: JSON.stringify({ action, payload, id }),
      });
      // Google Apps Script usually returns 200, but follows redirects.
      // fetch API handles redirects automatically.
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return { data: data.data };
    } catch (error) {
      console.error(`Error posting ${action}:`, error);
      throw error;
    }
  }
}

export const sheetsApi = new GoogleSheetsApi();

// Legacy aliases for Zustand stores (to minimize rewrite)
export default {
  get: async (endpoint) => {
    // Convert REST endpoint to action, supporting query params
    // e.g. "/transactions?startDate=2026-06-01" -> action=getTransactions&startDate=2026-06-01
    const [path, query] = endpoint.split("?");
    const base = path.replace("/", "");
    let action = "get" + base.charAt(0).toUpperCase() + base.slice(1);
    if (path === "/budget") action = "getBudgets";
    
    const finalAction = query ? `${action}&${query}` : action;
    return sheetsApi.get(finalAction);
  },
  post: async (endpoint, payload) => {
    // e.g. "/transactions" -> "addTransaction"
    let action = "add" + endpoint.replace("/", "").charAt(0).toUpperCase() + endpoint.replace("/", "").slice(1);
    // Google Apps Script expects singular names for actions: addTransaction, addCategory
    if (endpoint === "/transactions") action = "addTransaction";
    if (endpoint === "/categories") action = "addCategory";
    if (endpoint === "/goals") action = "addGoal";
    if (endpoint === "/budget") action = "addBudget";
    if (endpoint === "/income") action = "addIncome";
    
    return sheetsApi.post(action, payload);
  },
  put: async (endpoint, payload) => {
    // e.g. "/transactions/id_123" -> "updateTransaction", id = "id_123"
    const parts = endpoint.split("/");
    const base = parts[1];
    const id = parts[2];
    
    let action = "update" + base.charAt(0).toUpperCase() + base.slice(1);
    if (base === "transactions") action = "updateTransaction";
    if (base === "categories") action = "updateCategory";
    if (base === "goals") action = "updateGoal";
    if (base === "budget") action = "updateBudget";
    if (base === "income") action = "updateIncome";
    if (base === "settings") action = "updateSettings";
    
    return sheetsApi.post(action, payload, id);
  },
  delete: async (endpoint) => {
    // e.g. "/transactions/id_123" -> "deleteTransaction"
    const parts = endpoint.split("/");
    const base = parts[1];
    const id = parts[2];
    
    let action = "delete" + base.charAt(0).toUpperCase() + base.slice(1);
    if (base === "transactions") action = "deleteTransaction";
    if (base === "categories") action = "deleteCategory";
    if (base === "goals") action = "deleteGoal";
    if (base === "budget") action = "deleteBudget";
    if (base === "income") action = "deleteIncome";
    
    return sheetsApi.post(action, {}, id);
  }
};
