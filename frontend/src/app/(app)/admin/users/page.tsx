"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { StaffUser, Department, PaginatedResponse, Role } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/nav";

const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600";

const selectClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600";

const ROLE_OPTIONS: Role[] = [
  "INTAKE_OFFICER","ADMIN_OFFICER","SCHEDULE_OFFICER","ASSISTANT_DIRECTOR",
  "DEPUTY_DIRECTOR","DIRECTOR","PERMANENT_SECRETARY","COMMISSIONER","AUDITOR",
];

/**
 * Super Admin — user management. Lists staff users with role/department/active
 * filters; create/edit modals with native select elements.
 */
export default function UsersAdminPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  // Modal state.
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields.
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("SCHEDULE_OFFICER");
  const [departmentId, setDepartmentId] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "100" });
      if (roleFilter) params.set("role", roleFilter);
      if (deptFilter) params.set("departmentId", deptFilter);
      if (activeFilter) params.set("isActive", activeFilter);
      const data = await api.get<PaginatedResponse<StaffUser>>(`/users?${params}`);
      setUsers(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, deptFilter, activeFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    api.get<Department[]>("/departments").then(setDepartments).catch(() => {});
  }, []);

  function openCreate() {
    setEditing(null);
    setEmail(""); setFullName(""); setRole("SCHEDULE_OFFICER"); setDepartmentId("");
    setDesignation(""); setPhone(""); setPassword(""); setIsActive(true);
    setShowModal(true);
  }

  function openEdit(u: StaffUser) {
    setEditing(u);
    setEmail(u.email); setFullName(u.fullName); setRole(u.role);
    setDepartmentId(u.departmentId ?? ""); setDesignation(u.designation ?? "");
    setPhone(u.phone ?? ""); setPassword(""); setIsActive(u.isActive);
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!email || !fullName) return;
    if (!editing && !password) {
      setError("Password is required when creating a user.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        email, fullName, role, designation, phone,
        departmentId: departmentId || undefined,
        isActive,
      };
      if (password) body.password = password;
      if (editing) {
        await api.patch(`/users/${editing.id}`, body);
      } else {
        await api.post("/users", body);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(u: StaffUser) {
    if (!confirm(`Deactivate ${u.fullName}? They will lose access immediately.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      fetchUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Deactivation failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800">User Management</h1>
          <p className="text-sm text-neutral-500">{users.length} staff user(s)</p>
        </div>
        <button className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700" onClick={openCreate}>+ Add User</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Role</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={selectClass}>
            <option value="">— All —</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Department</label>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className={selectClass}>
            <option value="">— All —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Status</label>
          <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className={selectClass}>
            <option value="">— All —</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed" onClick={fetchUsers} disabled={loading}>
          {loading ? "Loading…" : "Apply"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && !loading ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-400">No users.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-800">{u.fullName}</td>
                      <td className="px-4 py-3 text-neutral-600">{u.email}</td>
                      <td className="px-4 py-3 text-neutral-600">{ROLE_LABELS[u.role]}</td>
                      <td className="px-4 py-3 text-neutral-600">{u.department?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                        }`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100" onClick={() => openEdit(u)}>Edit</button>
                          {u.isActive && (
                            <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100" onClick={() => handleDeactivate(u)}>
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">{editing ? "Edit User" : "Add User"}</h2>
                <button onClick={() => setShowModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100">
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[70vh] space-y-4 overflow-y-auto">
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">Full name *</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">Role *</label>
                    <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={selectClass}>
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">Department</label>
                    <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={selectClass}>
                      <option value="">— None —</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">Designation</label>
                    <input value={designation} onChange={(e) => setDesignation(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">Phone</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Password {!editing && "*"} {editing && <span className="text-neutral-400">(leave blank to keep)</span>}
                  </label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
                </div>
                {editing && (
                  <label className="flex items-center gap-2 text-sm text-neutral-700">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-neutral-300" />
                    Active (can sign in)
                  </label>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                <button className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Saving…" : editing ? "Save changes" : "Create user"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
