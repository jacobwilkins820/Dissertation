import { lazy, Suspense, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/UseAuth";
import { hasPermission, Permissions } from "../../utils/permissions";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { StateMessage } from "../../components/ui/StateMessage";
import { useGuardianAccess } from "../../hooks/useGuardianAccess";
import { useStudentRecord } from "../../hooks/useStudentRecord";
import { useStudentGuardians } from "../../hooks/useStudentGuardians";
import { useAttendanceSummary } from "../../hooks/useAttendanceSummary";
import { StudentOverviewSection } from "./sections/StudentOverviewSection";
import { GuardianSection } from "./sections/GuardianSection";
import { AttendanceSection } from "./sections/AttendanceSection";

const AddGuardianModal = lazy(() => import("../../components/guardian/AddGuardianModal"));

export default function StudentPage() {
  const { studentId } = useParams();
  const parsedId = Number(studentId);
  const navigate = useNavigate();
  const { user } = useAuth();

  const permissionLevel = user?.permissionLevel ?? 0;
  const canEditStudent = hasPermission(
    permissionLevel,
    Permissions.EDIT_STUDENT_DETAILS
  );
  const canViewAttendance = hasPermission(
    permissionLevel,
    Permissions.VIEW_STUDENT_DETAILS
  );
  const isAdmin = (user?.roleName ?? "").toUpperCase() === "ADMIN";
  const guardianId = user?.guardianId ?? null;
  const isGuardianUser = !isAdmin && guardianId != null;
  const canEditGuardians = isAdmin;
  const canViewGuardians = hasPermission(
    permissionLevel,
    Permissions.VIEW_GUARDIAN_CONTACT
  );

  const { accessAllowed, accessChecking, accessError } = useGuardianAccess(
    parsedId,
    isGuardianUser,
    guardianId
  );

  const {
    student,
    studentLoading,
    studentError,
    savingStudent,
    editingStudent,
    formValues,
    setFormValues,
    setEditingStudent,
    resetForm,
    handleStudentSave,
  } = useStudentRecord(parsedId, canEditStudent, accessAllowed, isGuardianUser);

  const {
    guardians,
    guardiansLoading,
    guardiansError,
    guardianEdits,
    setGuardianEdits,
    primaryGuardianId,
    guardianSaveState,
    guardianRemoveState,
    guardianSaveError,
    guardianSaveSuccess,
    selectedGuardian,
    setSelectedGuardian,
    linkRelationship,
    setLinkRelationship,
    linkIsPrimary,
    setLinkIsPrimary,
    linking,
    linkError,
    linkSuccess,
    showAddGuardian,
    addResetKey,
    handleGuardianSave,
    handlePrimaryChange,
    handleGuardianLink,
    handleGuardianRemove,
    fetchGuardianMatches,
    openAddGuardian,
    closeAddGuardian,
    clearLinkForm,
  } = useStudentGuardians(parsedId, canViewGuardians, canEditGuardians);

  const {
    attendanceRange,
    setAttendanceRange,
    attendanceSummary,
    attendanceLoading,
    attendanceError,
  } = useAttendanceSummary(
    parsedId,
    canViewAttendance,
    accessAllowed,
    isGuardianUser
  );

  const handleRelationshipChange = useCallback(
    (guardianIdValue: number, value: string) => {
      setGuardianEdits((prev) => ({
        ...prev,
        [guardianIdValue]: {
          relationship: value,
          isPrimary:
            prev[guardianIdValue]?.isPrimary ??
            guardians.find((guardian) => guardian.guardianId === guardianIdValue)
              ?.isPrimary ??
            false,
        },
      }));
    },
    [guardians, setGuardianEdits]
  );

  if (!Number.isFinite(parsedId)) {
    return <AlertBanner variant="error">Invalid student id.</AlertBanner>;
  }

  if (isGuardianUser) {
    if (accessChecking || accessAllowed === null) {
      return <StateMessage inline>Checking student access...</StateMessage>;
    }

    if (accessError) {
      return <AlertBanner variant="error">{accessError}</AlertBanner>;
    }

    if (accessAllowed === false) {
      return (
        <AlertBanner variant="error">
          You do not have permission to access this student.
        </AlertBanner>
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        label="Student Detail"
        title="Profile"
        subtitle="Student record, guardians, and attendance overview."
      />

      <section className="grid gap-4">
        <StudentOverviewSection
          student={student}
          studentLoading={studentLoading}
          studentError={studentError}
          canEditStudent={canEditStudent}
          editingStudent={editingStudent}
          savingStudent={savingStudent}
          formValues={formValues}
          onEdit={() => setEditingStudent(true)}
          onCancel={() => {
            resetForm();
            setEditingStudent(false);
          }}
          onSave={handleStudentSave}
          onFormChange={(patch) =>
            setFormValues((prev) => ({ ...prev, ...patch }))
          }
        />
      </section>

      <GuardianSection
        guardians={guardians}
        guardiansLoading={guardiansLoading}
        guardiansError={guardiansError}
        guardianEdits={guardianEdits}
        primaryGuardianId={primaryGuardianId}
        guardianSaveState={guardianSaveState}
        guardianRemoveState={guardianRemoveState}
        guardianSaveError={guardianSaveError}
        guardianSaveSuccess={guardianSaveSuccess}
        canEditGuardians={canEditGuardians}
        canViewGuardians={canViewGuardians}
        onOpenAddGuardian={openAddGuardian}
        onSaveGuardian={handleGuardianSave}
        onPrimaryChange={handlePrimaryChange}
        onRemoveGuardian={handleGuardianRemove}
        onNavigateGuardian={(guardianIdValue) =>
          navigate(`/guardians/${guardianIdValue}`)
        }
        onRelationshipChange={handleRelationshipChange}
      />

      <AttendanceSection
        canViewAttendance={canViewAttendance}
        attendanceRange={attendanceRange}
        setAttendanceRange={setAttendanceRange}
        attendanceSummary={attendanceSummary}
        attendanceLoading={attendanceLoading}
        attendanceError={attendanceError}
      />

      {canEditGuardians && (
        <Suspense fallback={null}>
          <AddGuardianModal
            open={showAddGuardian}
            selectedGuardian={selectedGuardian}
            onSelectGuardian={setSelectedGuardian}
            fetchGuardianMatches={fetchGuardianMatches}
            linkRelationship={linkRelationship}
            onRelationshipChange={setLinkRelationship}
            linkIsPrimary={linkIsPrimary}
            onIsPrimaryChange={setLinkIsPrimary}
            linkError={linkError}
            linkSuccess={linkSuccess}
            onClear={clearLinkForm}
            onClose={closeAddGuardian}
            onSubmit={handleGuardianLink}
            linking={linking}
            resetKey={addResetKey}
          />
        </Suspense>
      )}
    </div>
  );
}
