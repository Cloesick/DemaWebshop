export const metadata = {
  title: "Page Builder",
  description: "Visual drag-and-drop page editor",
};

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
