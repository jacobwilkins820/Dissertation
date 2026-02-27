// Blank landing page for authenticated users.
import { PageHeader } from "../../components/ui/PageHeader";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        label="Home"
        title="Welcome"
        subtitle="Select a button from the nav bar to get started."
      />
    </div>
  );
}
