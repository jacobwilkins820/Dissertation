package uk.ac.uclan.sis.sis_backend.roles;

public final class Permissions {
    /**
     * Prevents instantiation.
     */
    private Permissions() {}

    public static final int VIEW_STUDENT_DIRECTORY = 1 << 0; // 1
    public static final int VIEW_STUDENT_DETAILS   = 1 << 1; // 2
    public static final int EDIT_STUDENT_DETAILS   = 1 << 2; // 4

    public static final int VIEW_GUARDIAN_CONTACT  = 1 << 3; // 8
    public static final int VIEW_GUARDIAN_ADDRESS  = 1 << 4; // 16
    public static final int EDIT_GUARDIAN_SELF     = 1 << 5; // 32

    public static final int VIEW_ATTENDANCE        = 1 << 6; // 64
    public static final int EDIT_ATTENDANCE        = 1 << 7; // 128

    public static final int CREATE_GUARDIAN        = 1 << 8; // 256
    public static final int CREATE_STUDENT         = 1 << 9; // 512
    public static final int VIEW_CLASSES           = 1 << 10; // 1024
    public static final int CREATE_USER            = 1 << 11; // 2048

    /**
     * Returns true when the permission bit is set in the mask.
     *
     * @param mask permission mask
     * @param permission permission bit
     * @return true when permission is present
     */
    public static boolean has(int mask, int permission) {
        return (mask & permission) == permission;
    }
}
