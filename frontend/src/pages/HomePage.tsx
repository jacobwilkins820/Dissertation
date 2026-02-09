// Blank landing page for authenticated users.
import { PageHeader } from "../components/PageHeader";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        label="Home"
        title="Welcome"
        subtitle="Select a section from the navigation to get started."
      />
    </div>
  );
}
