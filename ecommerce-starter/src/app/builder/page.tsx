"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Globe, GlobeIcon, FileText } from "lucide-react";

interface PageItem {
  id: string;
  title: string;
  slug: string;
  description?: string;
  isPublished: boolean;
  isHomepage: boolean;
  updatedAt: string;
}

export default function PageBuilderDashboard() {
  const router = useRouter();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");

  useEffect(() => {
    fetchPages();
  }, []);

  async function fetchPages() {
    const res = await fetch("/api/pages");
    const data = await res.json();
    setPages(data);
    setLoading(false);
  }

  async function createPage() {
    if (!newTitle || !newSlug) return;

    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, slug: newSlug }),
    });

    if (res.ok) {
      const page = await res.json();
      router.push(`/builder/${page.id}`);
    }
  }

  async function deletePage(id: string) {
    if (!confirm("Are you sure you want to delete this page?")) return;

    await fetch(`/api/pages/${id}`, { method: "DELETE" });
    setPages(pages.filter((p) => p.id !== id));
  }

  // Auto-generate slug from title
  function handleTitleChange(value: string) {
    setNewTitle(value);
    setNewSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading pages...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Page Builder</h1>
            <p className="text-gray-600 mt-1">Create and edit pages with the visual drag-and-drop editor</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            New Page
          </button>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold mb-4">Create New Page</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Page Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. About Us"
                    className="w-full border rounded-lg px-3 py-2"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL Slug</label>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                    <span>yoursite.com/p/</span>
                    <span className="font-mono text-indigo-600">{newSlug || "..."}</span>
                  </div>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="about-us"
                    className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setShowCreate(false); setNewTitle(""); setNewSlug(""); }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={createPage}
                  disabled={!newTitle || !newSlug}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  Create & Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pages List */}
        {pages.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No pages yet</h3>
            <p className="text-gray-500 mt-1">Create your first page to get started with the visual builder</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between bg-white rounded-xl border p-4 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${page.isPublished ? "bg-green-500" : "bg-gray-300"}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{page.title}</h3>
                      {page.isHomepage && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          Homepage
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">/p/{page.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => router.push(`/builder/${page.id}`)}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <a
                    href={`/p/${page.slug}`}
                    target="_blank"
                    className="p-2 text-gray-400 hover:text-green-600 transition"
                    title="View"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => deletePage(page.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
