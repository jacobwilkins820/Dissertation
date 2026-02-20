import { useAuth } from "../../auth/UseAuth";
import GuardianDetailPage from "../guardian/GuardianDetailPage";
import UserAccountPage from "./UserAccountPage";

// Routes the account view to the appropriate profile screen.
// Guardian users reuse the guardian-detail page as before, other users see new user account page.
export default function AccountPage() {
  const { user } = useAuth();

  if (user?.guardianId != null) {
    return <GuardianDetailPage self />;
  }

  return <UserAccountPage />;
}
