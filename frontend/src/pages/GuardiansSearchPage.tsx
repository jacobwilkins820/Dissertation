import type { GuardianSearch } from "../utils/responses";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/env";
import { SearchSelect } from "../components/SearchSelect";
import { useAuth } from "../auth/UseAuth";
import { hasPermission, Permissions } from "../utils/permissions";
import {
  extractErrorMessage,
  getAuthHeader,
  safeReadJson,
} from "../utils/utilFuncs";

// Guardian search page with permission-aware access.
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
      const res = await fetch(
        `${API_BASE_URL}/api/guardians/search?query=${encodeURIComponent(
          query
        )}`,
        {
          signal,
          headers: {
            ...getAuthHeader(),
          },
        }
      );

      if (!res.ok) {
        const payload = await safeReadJson(res);
        throw new Error(extractErrorMessage(payload));
      }

      const data = (await safeReadJson(res)) as GuardianSearch[] | null;
      return Array.isArray(data) ? data : [];
    },
    []
  );

  if (!canSearch) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
        You do not have permission to access this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Directory
        </p>
        <h1 className="text-3xl font-semibold text-white">Guardians</h1>
        <p className="text-sm text-slate-300">
          Search for guardians by name. Results show only the fields your role
          can access.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-2xl shadow-black/30">
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
      </div>
    </div>
  );
}
