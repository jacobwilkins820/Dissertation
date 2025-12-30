import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  // no navbar here
  return (
    <main>
      <Outlet />
    </main>
  );
}
