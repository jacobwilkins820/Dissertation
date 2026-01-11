// Permission bitmask flags + helper.
//TODO: mayeb look into expanding them
//TODO: think about a shared module. DTOS and permissions would be in it
export const Permissions = {
  VIEW_STUDENT_DIRECTORY: 1 << 0, // 1
  VIEW_STUDENT_DETAILS: 1 << 1, // 2
  EDIT_STUDENT_DETAILS: 1 << 2, // 4

  VIEW_GUARDIAN_CONTACT: 1 << 3, // 8
  VIEW_GUARDIAN_ADDRESS: 1 << 4, // 16
  EDIT_GUARDIAN_SELF: 1 << 5, // 32

  VIEW_ATTENDANCE: 1 << 6, // 64
  EDIT_ATTENDANCE: 1 << 7, // 128

  CREATE_GUARDIAN: 1 << 8, // 256
  CREATE_STUDENT: 1 << 9, // 512
  VIEW_CLASSES: 1 << 10, // 1024
  CREATE_USER: 1 << 11, // 2048
};

// Check if a permission bit is set on the mask.
export function hasPermission(mask: number, perm: number) {
  return (mask & perm) === perm;
}
