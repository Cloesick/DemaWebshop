"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Save, Eye, EyeOff, ArrowLeft, Globe } from "lucide-react";

export default function PageBuilderEditor() {
  const params = useParams();
  const router = useRouter();
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    let editor: any = null;

    async function initEditor() {
      // Dynamically import GrapeJS (client-side only)
      const grapesjs = (await import("grapesjs")).default;
      // @ts-ignore - CSS import for GrapeJS styles
      await import("grapesjs/dist/css/grapes.min.css");

      // Load page data
      const res = await fetch(`/api/pages/${params.id}`);
      if (!res.ok) {
        router.push("/builder");
        return;
      }
      const page = await res.json();
      setPageTitle(page.title);
      setIsPublished(page.isPublished);

      const gjsData = page.gjsData ? JSON.parse(page.gjsData) : {};

      // Initialize GrapeJS
      editor = grapesjs.init({
        container: containerRef.current!,
        height: "100%",
        width: "auto",
        storageManager: false, // We handle saving manually
        panels: { defaults: [] },
        deviceManager: {
          devices: [
            { name: "Desktop", width: "" },
            { name: "Tablet", width: "768px", widthMedia: "992px" },
            { name: "Mobile", width: "375px", widthMedia: "480px" },
          ],
        },
        blockManager: {
          appendTo: "#blocks-panel",
          blocks: [
            {
              id: "section",
              label: "Section",
              category: "Layout",
              content:
                '<section class="py-16 px-4"><div class="max-w-6xl mx-auto"></div></section>',
            },
            {
              id: "container",
              label: "Container",
              category: "Layout",
              content: '<div class="max-w-6xl mx-auto px-4"></div>',
            },
            {
              id: "columns-2",
              label: "2 Columns",
              category: "Layout",
              content: '<div class="grid grid-cols-1 md:grid-cols-2 gap-8"></div>',
            },
            {
              id: "columns-3",
              label: "3 Columns",
              category: "Layout",
              content: '<div class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>',
            },
            {
              id: "columns-4",
              label: "4 Columns",
              category: "Layout",
              content: '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"></div>',
            },
            {
              id: "hero",
              label: "Hero",
              category: "Sections",
              content: `
                <section class="relative bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-24 px-4">
                  <div class="max-w-4xl mx-auto text-center">
                    <h1 class="text-5xl font-bold mb-6">Your Amazing Headline</h1>
                    <p class="text-xl opacity-90 mb-8">A compelling subtitle that explains your value proposition and gets visitors excited about your product.</p>
                    <div class="flex gap-4 justify-center">
                      <a href="#" class="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">Get Started</a>
                      <a href="#" class="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition">Learn More</a>
                    </div>
                  </div>
                </section>`,
            },
            {
              id: "features",
              label: "Features",
              category: "Sections",
              content: `
                <section class="py-20 px-4 bg-gray-50">
                  <div class="max-w-6xl mx-auto">
                    <h2 class="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div class="text-center p-6">
                        <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
                        <h3 class="text-xl font-semibold mb-2">Feature One</h3>
                        <p class="text-gray-600">Brief description of this amazing feature and how it benefits the customer.</p>
                      </div>
                      <div class="text-center p-6">
                        <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
                        <h3 class="text-xl font-semibold mb-2">Feature Two</h3>
                        <p class="text-gray-600">Brief description of this amazing feature and how it benefits the customer.</p>
                      </div>
                      <div class="text-center p-6">
                        <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
                        <h3 class="text-xl font-semibold mb-2">Feature Three</h3>
                        <p class="text-gray-600">Brief description of this amazing feature and how it benefits the customer.</p>
                      </div>
                    </div>
                  </div>
                </section>`,
            },
            {
              id: "cta",
              label: "CTA Banner",
              category: "Sections",
              content: `
                <section class="py-16 px-4 bg-indigo-600 text-white">
                  <div class="max-w-4xl mx-auto text-center">
                    <h2 class="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                    <p class="text-lg opacity-90 mb-8">Join thousands of happy customers who already love our product.</p>
                    <a href="#" class="inline-block bg-white text-indigo-600 px-10 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition">Start Free Trial</a>
                  </div>
                </section>`,
            },
            {
              id: "testimonials",
              label: "Testimonials",
              category: "Sections",
              content: `
                <section class="py-20 px-4">
                  <div class="max-w-6xl mx-auto">
                    <h2 class="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div class="bg-white border rounded-xl p-6 shadow-sm">
                        <p class="text-gray-600 mb-4">"This product completely transformed how we do business. Incredible value and amazing support."</p>
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div><p class="font-semibold">Jane Doe</p><p class="text-sm text-gray-500">CEO, Company</p></div>
                        </div>
                      </div>
                      <div class="bg-white border rounded-xl p-6 shadow-sm">
                        <p class="text-gray-600 mb-4">"I've tried many solutions but this is by far the best. Simple, powerful, and reliable."</p>
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div><p class="font-semibold">John Smith</p><p class="text-sm text-gray-500">CTO, Startup</p></div>
                        </div>
                      </div>
                      <div class="bg-white border rounded-xl p-6 shadow-sm">
                        <p class="text-gray-600 mb-4">"Setup was a breeze and the results were immediate. Highly recommend to anyone."</p>
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div><p class="font-semibold">Sarah Johnson</p><p class="text-sm text-gray-500">Founder, Agency</p></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>`,
            },
            {
              id: "pricing",
              label: "Pricing",
              category: "Sections",
              content: `
                <section class="py-20 px-4 bg-gray-50">
                  <div class="max-w-5xl mx-auto">
                    <h2 class="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
                    <p class="text-center text-gray-600 mb-12">No hidden fees. Cancel anytime.</p>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div class="bg-white rounded-xl p-8 border shadow-sm">
                        <h3 class="text-lg font-semibold mb-2">Starter</h3>
                        <p class="text-4xl font-bold mb-6">$9<span class="text-lg font-normal text-gray-500">/mo</span></p>
                        <ul class="space-y-3 text-gray-600 mb-8"><li>✓ 1 User</li><li>✓ 5 Projects</li><li>✓ Basic Support</li></ul>
                        <a href="#" class="block text-center bg-gray-100 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-200 transition">Get Started</a>
                      </div>
                      <div class="bg-indigo-600 text-white rounded-xl p-8 shadow-lg scale-105">
                        <h3 class="text-lg font-semibold mb-2">Pro</h3>
                        <p class="text-4xl font-bold mb-6">$29<span class="text-lg font-normal opacity-75">/mo</span></p>
                        <ul class="space-y-3 opacity-90 mb-8"><li>✓ 5 Users</li><li>✓ Unlimited Projects</li><li>✓ Priority Support</li></ul>
                        <a href="#" class="block text-center bg-white text-indigo-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">Get Started</a>
                      </div>
                      <div class="bg-white rounded-xl p-8 border shadow-sm">
                        <h3 class="text-lg font-semibold mb-2">Enterprise</h3>
                        <p class="text-4xl font-bold mb-6">$99<span class="text-lg font-normal text-gray-500">/mo</span></p>
                        <ul class="space-y-3 text-gray-600 mb-8"><li>✓ Unlimited Users</li><li>✓ Custom Features</li><li>✓ Dedicated Support</li></ul>
                        <a href="#" class="block text-center bg-gray-100 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-200 transition">Contact Us</a>
                      </div>
                    </div>
                  </div>
                </section>`,
            },
            {
              id: "gallery",
              label: "Image Gallery",
              category: "Sections",
              content: `
                <section class="py-16 px-4">
                  <div class="max-w-6xl mx-auto">
                    <h2 class="text-3xl font-bold text-center mb-8">Gallery</h2>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div class="aspect-square bg-gray-200 rounded-lg"></div>
                      <div class="aspect-square bg-gray-300 rounded-lg"></div>
                      <div class="aspect-square bg-gray-200 rounded-lg"></div>
                      <div class="aspect-square bg-gray-300 rounded-lg"></div>
                      <div class="aspect-square bg-gray-200 rounded-lg"></div>
                      <div class="aspect-square bg-gray-300 rounded-lg"></div>
                    </div>
                  </div>
                </section>`,
            },
            {
              id: "faq",
              label: "FAQ",
              category: "Sections",
              content: `
                <section class="py-20 px-4">
                  <div class="max-w-3xl mx-auto">
                    <h2 class="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                    <div class="space-y-6">
                      <div class="border-b pb-6">
                        <h3 class="text-lg font-semibold mb-2">How do I get started?</h3>
                        <p class="text-gray-600">Simply sign up for a free account and you'll be guided through the setup process step by step.</p>
                      </div>
                      <div class="border-b pb-6">
                        <h3 class="text-lg font-semibold mb-2">Can I cancel anytime?</h3>
                        <p class="text-gray-600">Yes! There are no long-term contracts. You can cancel your subscription at any time.</p>
                      </div>
                      <div class="border-b pb-6">
                        <h3 class="text-lg font-semibold mb-2">Do you offer support?</h3>
                        <p class="text-gray-600">Absolutely. We offer email support on all plans and priority support on Pro and Enterprise plans.</p>
                      </div>
                    </div>
                  </div>
                </section>`,
            },
            {
              id: "footer",
              label: "Footer",
              category: "Sections",
              content: `
                <footer class="bg-gray-900 text-gray-300 py-12 px-4">
                  <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                      <h3 class="text-white font-bold text-lg mb-4">Brand</h3>
                      <p class="text-sm">Building amazing digital experiences for businesses worldwide.</p>
                    </div>
                    <div>
                      <h4 class="text-white font-semibold mb-4">Product</h4>
                      <ul class="space-y-2 text-sm"><li><a href="#">Features</a></li><li><a href="#">Pricing</a></li><li><a href="#">Integrations</a></li></ul>
                    </div>
                    <div>
                      <h4 class="text-white font-semibold mb-4">Company</h4>
                      <ul class="space-y-2 text-sm"><li><a href="#">About</a></li><li><a href="#">Blog</a></li><li><a href="#">Careers</a></li></ul>
                    </div>
                    <div>
                      <h4 class="text-white font-semibold mb-4">Legal</h4>
                      <ul class="space-y-2 text-sm"><li><a href="#">Privacy</a></li><li><a href="#">Terms</a></li><li><a href="#">Cookies</a></li></ul>
                    </div>
                  </div>
                  <div class="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-700 text-center text-sm">
                    <p>© 2024 Brand. All rights reserved.</p>
                  </div>
                </footer>`,
            },
            {
              id: "text",
              label: "Text",
              category: "Basic",
              content:
                '<p class="text-gray-700">Insert your text here. You can style it however you like.</p>',
            },
            {
              id: "heading",
              label: "Heading",
              category: "Basic",
              content: '<h2 class="text-3xl font-bold">Your Heading</h2>',
            },
            {
              id: "image",
              label: "Image",
              category: "Basic",
              content:
                '<img src="https://placehold.co/800x400/e2e8f0/64748b?text=Your+Image" class="w-full rounded-lg" />',
            },
            {
              id: "button",
              label: "Button",
              category: "Basic",
              content:
                '<a href="#" class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">Click Me</a>',
            },
            {
              id: "divider",
              label: "Divider",
              category: "Basic",
              content: '<hr class="my-8 border-gray-200" />',
            },
            {
              id: "spacer",
              label: "Spacer",
              category: "Basic",
              content: '<div class="h-16"></div>',
            },
            {
              id: "video",
              label: "Video",
              category: "Media",
              content:
                '<div class="aspect-video bg-black rounded-lg flex items-center justify-center text-white text-lg">Video Placeholder</div>',
            },
            {
              id: "map",
              label: "Map",
              category: "Media",
              content:
                '<div class="aspect-video bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">Map Placeholder</div>',
            },
          ],
        },
        styleManager: {
          appendTo: "#styles-panel",
          sectors: [
            {
              name: "Dimension",
              open: false,
              buildProps: [
                "width",
                "min-width",
                "max-width",
                "height",
                "min-height",
                "max-height",
                "padding",
                "margin",
              ],
            },
            {
              name: "Typography",
              open: false,
              buildProps: [
                "font-family",
                "font-size",
                "font-weight",
                "letter-spacing",
                "color",
                "line-height",
                "text-align",
                "text-decoration",
                "text-transform",
              ],
            },
            {
              name: "Decorations",
              open: false,
              buildProps: [
                "background-color",
                "background",
                "border-radius",
                "border",
                "box-shadow",
                "opacity",
              ],
            },
            {
              name: "Extra",
              open: false,
              buildProps: ["transition", "transform", "cursor", "overflow"],
            },
          ],
        },
        layerManager: {
          appendTo: "#layers-panel",
        },
        canvas: {
          styles: ["https://cdn.jsdelivr.net/npm/tailwindcss@3.4.4/src/css/preflight.css"],
          scripts: ["https://cdn.tailwindcss.com"],
        },
      });

      // Load existing data
      if (gjsData.components || gjsData.pages) {
        editor.loadProjectData(gjsData);
      }

      editorRef.current = editor;
      setLoading(false);
    }

    initEditor();

    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [params.id, router]);

  const handleSave = async () => {
    if (!editorRef.current) return;
    setSaving(true);

    try {
      const editor = editorRef.current;
      const gjsData = editor.getProjectData();
      const gjsHtml = editor.getHtml();
      const gjsCss = editor.getCss();

      await fetch(`/api/pages/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gjsData: JSON.stringify(gjsData),
          gjsHtml,
          gjsCss,
        }),
      });
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    const newState = !isPublished;
    setIsPublished(newState);

    // Also save current state when publishing
    if (editorRef.current) {
      const editor = editorRef.current;
      const gjsData = editor.getProjectData();
      const gjsHtml = editor.getHtml();
      const gjsCss = editor.getCss();

      await fetch(`/api/pages/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gjsData: JSON.stringify(gjsData),
          gjsHtml,
          gjsCss,
          isPublished: newState,
        }),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading Page Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Top Toolbar */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/builder")}
            className="text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-white font-medium">{pageTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Device switcher */}
          <button
            onClick={() => editorRef.current?.setDevice("Desktop")}
            className="px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-700 rounded"
          >
            Desktop
          </button>
          <button
            onClick={() => editorRef.current?.setDevice("Tablet")}
            className="px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-700 rounded"
          >
            Tablet
          </button>
          <button
            onClick={() => editorRef.current?.setDevice("Mobile")}
            className="px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-700 rounded"
          >
            Mobile
          </button>

          <div className="w-px h-6 bg-gray-600 mx-2" />

          {/* Publish toggle */}
          <button
            onClick={handlePublishToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
              isPublished
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-700 text-gray-300 hover:text-white"
            }`}
          >
            {isPublished ? <Globe className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {isPublished ? "Published" : "Draft"}
          </button>

          {/* Preview */}
          <a
            href={`/p/${params.id}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-gray-300 hover:text-white rounded text-xs font-medium transition"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </a>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Blocks */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto shrink-0">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Blocks
            </h3>
          </div>
          <div id="blocks-panel" />
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <div ref={containerRef} className="h-full" />
        </div>

        {/* Right Panel: Styles + Layers */}
        <div className="w-72 bg-gray-800 border-l border-gray-700 overflow-y-auto shrink-0">
          <div className="border-b border-gray-700">
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Styles
              </h3>
            </div>
            <div id="styles-panel" />
          </div>
          <div>
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Layers
              </h3>
            </div>
            <div id="layers-panel" />
          </div>
        </div>
      </div>
    </div>
  );
}
