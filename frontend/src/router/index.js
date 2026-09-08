import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import RegisterView from "../views/RegisterView.vue";
import LoginView from "../views/LoginView.vue";
import DashboardView from "../views/DashboardView.vue";
import AdminView from "../views/AdminView.vue";
import TrackView from "../views/TrackView.vue";
import DocumentsNewView from "../views/DocumentsNewView.vue";
import DocumentDetailView from "../views/DocumentDetailView.vue";
import AdminDocumentDetailView from "../views/AdminDocumentDetailView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView,
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
  },
  {
    path: "/track",
    name: "track",
    component: TrackView,
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardView,
    meta: { requiresAuth: true, role: "USER" },
  },
  {
    path: "/documents/new",
    name: "documents-new",
    component: DocumentsNewView,
    meta: { requiresAuth: true, role: "USER" },
  },
  {
    path: "/documents/:id",
    name: "document-detail",
    component: DocumentDetailView,
    meta: { requiresAuth: true, role: "USER" },
  },
  {
    path: "/admin",
    name: "admin",
    component: AdminView,
    meta: { requiresAuth: true, role: "ADMIN" },
  },
  {
    path: "/admin/documents/:id",
    name: "admin-document-detail",
    component: AdminDocumentDetailView,
    meta: { requiresAuth: true, role: "ADMIN" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function hasValidToken() {
  const token = localStorage.getItem("token");

  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

router.beforeEach((to) => {
  const requiresAuth = Boolean(to.meta.requiresAuth);
  const authenticated = hasValidToken();

  if (requiresAuth && !authenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (to.meta.role) {
    const user = getStoredUser();

    if (!user) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return { name: "login", query: { redirect: to.fullPath } };
    }

    if (user.role !== to.meta.role) {
      return {
        name: user.role === "ADMIN" ? "admin" : "dashboard",
      };
    }
  }

  return true;
});

export default router;
