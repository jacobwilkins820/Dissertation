import { TextField } from "../ui/TextField";

// Shared field-error model for account identity forms.
type IdentityFieldErrors = Partial<
  Record<
    "firstName" | "lastName" | "email" | "password" | "confirmPassword",
    string
  >
>;

type Props = {
  firstName: string;
  onFirstNameChange: (value: string) => void;
  firstNamePlaceholder: string;
  lastName: string;
  onLastNameChange: (value: string) => void;
  lastNamePlaceholder: string;
  email: string;
  onEmailChange: (value: string) => void;
  emailPlaceholder: string;
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  fieldErrors: IdentityFieldErrors;
};

// Shared identity/password field group used by user and guardian creation pages.
export function AccountIdentityFields({
  firstName,
  onFirstNameChange,
  firstNamePlaceholder,
  lastName,
  onLastNameChange,
  lastNamePlaceholder,
  email,
  onEmailChange,
  emailPlaceholder,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  fieldErrors,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
          First name
          <TextField
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder={firstNamePlaceholder}
            autoComplete="given-name"
          />
          {fieldErrors.firstName && (
            <small className="text-rose-200">{fieldErrors.firstName}</small>
          )}
        </label>

        <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
          Last name
          <TextField
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder={lastNamePlaceholder}
            autoComplete="family-name"
          />
          {fieldErrors.lastName && (
            <small className="text-rose-200">{fieldErrors.lastName}</small>
          )}
        </label>
      </div>

      <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
        Email
        <TextField
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder={emailPlaceholder}
          autoComplete="email"
        />
        {fieldErrors.email && (
          <small className="text-rose-200">{fieldErrors.email}</small>
        )}
      </label>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
          Password
          <TextField
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            type="password"
            autoComplete="new-password"
          />
          {fieldErrors.password && (
            <small className="text-rose-200">{fieldErrors.password}</small>
          )}
        </label>

        <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
          Confirm password
          <TextField
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            type="password"
            autoComplete="new-password"
          />
          {fieldErrors.confirmPassword && (
            <small className="text-rose-200">
              {fieldErrors.confirmPassword}
            </small>
          )}
        </label>
      </div>
    </>
  );
}
