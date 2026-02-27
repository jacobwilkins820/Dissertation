import type { GuardianSearch } from "../../utils/responses";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchSelect } from "../../components/ui/SearchSelect";
import { useAuth } from "../../auth/UseAuth";
import { hasPermission, Permissions } from "../../utils/permissions";
import { searchGuardians } from "../../services/backend";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";

// Guardian search page with permission-based access.
export default function GuardiansSearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissionLevel = user?.permissionLevel ?? 0;
  const isAdmin = (user?.roleName ?? "").toUpperCase() === "ADMIN";
  const canViewContact =
    isAdmin ||
    hasPermission(permissionLevel, Permissions.VIEW_GUARDIAN_CONTACT);
  const isGuardianUser = user?.guardianId != null;
  const canSearch = isAdmin || (canViewContact && !isGuardianUser);

  const [selectedGuardian, setSelectedGuardian] =
    useState<GuardianSearch | null>(null);

  const fetchGuardians = useCallback(
    async (query: string, signal: AbortSignal) => {
      return searchGuardians<GuardianSearch>(query, signal);
    },
    [],
  );

  if (!canSearch) {
    return (
      <AlertBanner variant="error">
        You do not have permission to access this page.
      </AlertBanner>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        label="Directory"
        title="Guardians"
        subtitle="Search for guardians by name."
      />

      <SectionCard padding="md">
        <div className="grid gap-4 md:grid-cols-[1.4fr_auto] md:items-end">
          <SearchSelect
            label="Search guardians"
            placeholder="Search by guardian name"
            selected={selectedGuardian}
            onSelect={(guardianOption) => {
              setSelectedGuardian(guardianOption);
              if (guardianOption) {
                navigate(`/guardians/${guardianOption.id}`);
              }
            }}
            fetchOptions={fetchGuardians}
            getOptionKey={(guardianOption) => guardianOption.id}
            getOptionLabel={(guardianOption) =>
              `${guardianOption.firstName} ${guardianOption.lastName}${
                guardianOption.email ? ` - ${guardianOption.email}` : ""
              }`
            }
            idleLabel="Type at least 2 characters."
            loadingLabel="Searching..."
            resultsLabel="Matches"
            emptyLabel="No guardians found."
            showSelectedSummary={false}
          />

          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
            {selectedGuardian ? "Guardian selected" : "Select a guardian"}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
