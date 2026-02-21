"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ItemsClient({ user }) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchItems() {
    try {
      const res = await fetch("/api/items");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load items");
      } else {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error");
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create item");
      } else {
        setTitle("");
        setDescription("");
        setItems((prev) => [data.item, ...prev]);
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editingId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/items/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTitle, description: editingDescription }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update item");
      } else {
        setItems((prev) => prev.map((it) => (it.id === editingId ? data.item : it)));
        setEditingId(null);
        setEditingTitle("");
        setEditingDescription("");
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this item?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete item");
      } else {
        setItems((prev) => prev.filter((it) => it.id !== id));
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-gray-500">Logged in as {user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-200"
          >
            Logout
          </button>
        </header>

        <section className="mb-8 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-3">Create Item</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : "Add Item"}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-3">Your Items</h2>
          {items.length === 0 && (
            <p className="text-sm text-gray-500">No items yet.</p>
          )}
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="border rounded p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                {editingId === item.id ? (
                  <form onSubmit={handleUpdate} className="flex-1 space-y-2">
                    <input
                      className="w-full border rounded px-2 py-1 text-sm mb-1"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      required
                    />
                    <textarea
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="submit"
                        className="text-xs px-3 py-1 rounded bg-green-600 text-white"
                        disabled={loading}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="text-xs px-3 py-1 rounded border border-gray-300"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-gray-600 whitespace-pre-wrap">
                        {item.description}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {editingId !== item.id && (
                  <div className="flex gap-2 justify-end">
                    <button
                      className="text-xs px-3 py-1 rounded border border-gray-300"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingTitle(item.title);
                        setEditingDescription(item.description || "");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-xs px-3 py-1 rounded border border-red-500 text-red-600"
                      onClick={() => handleDelete(item.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
