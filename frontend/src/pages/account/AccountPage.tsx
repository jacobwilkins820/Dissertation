import { useAuth } from "../../auth/UseAuth";
import GuardianDetailPage from "../guardian/GuardianDetailPage";
import UserAccountPage from "./UserAccountPage";

export default function AccountPage() {
  const { user } = useAuth();

  if (user?.guardianId != null) {
    return <GuardianDetailPage self />;
  }

  return <UserAccountPage />;
}
