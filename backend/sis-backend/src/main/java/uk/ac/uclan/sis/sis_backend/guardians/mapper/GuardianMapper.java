package uk.ac.uclan.sis.sis_backend.guardians.mapper;

import uk.ac.uclan.sis.sis_backend.guardians.dto.*;
import uk.ac.uclan.sis.sis_backend.guardians.entity.Guardian;

/**
 * Mapper keeps controllers/services clean and stops DTO logic spreading everywhere.
 */
public final class GuardianMapper {

    /**
     * Prevents instantiation.
     */
    private GuardianMapper() {}

    /**
     * Maps a create request to a guardian entity.
     *
     * @param req create request
     * @return guardian entity
     */
    public static Guardian toEntity(CreateGuardianRequest req) {
        Guardian g = new Guardian();
        g.setFirstName(req.getFirstName().trim());
        g.setLastName(req.getLastName().trim());
        g.setEmail(normaliseEmail(req.getEmail()));
        g.setPhone(normalisePhone(req.getPhone()));
        g.setAddressLine1(trimOrNull(req.getAddressLine1()));
        g.setAddressLine2(trimOrNull(req.getAddressLine2()));
        g.setCity(trimOrNull(req.getCity()));
        g.setPostcode(trimOrNull(req.getPostcode()));
        return g;
    }

    /**
     * Applies an update request to a guardian entity.
     *
     * @param g guardian entity
     * @param req update request
     */
    public static void applyUpdate(Guardian g, UpdateGuardianRequest req) {
        g.setFirstName(req.getFirstName().trim());
        g.setLastName(req.getLastName().trim());
        g.setEmail(normaliseEmail(req.getEmail()));
        g.setPhone(normalisePhone(req.getPhone()));
        g.setAddressLine1(trimOrNull(req.getAddressLine1()));
        g.setAddressLine2(trimOrNull(req.getAddressLine2()));
        g.setCity(trimOrNull(req.getCity()));
        g.setPostcode(trimOrNull(req.getPostcode()));
    }

    /**
     * Maps a guardian to a full response.
     *
     * @param g guardian entity
     * @return guardian response
     */
    public static GuardianResponse response(Guardian g) {
        return new GuardianResponse(
                g.getId(),
                g.getFirstName(),
                g.getLastName(),
                g.getEmail(),
                g.getPhone(),
                g.getAddressLine1(),
                g.getAddressLine2(),
                g.getCity(),
                g.getPostcode(),
                g.getCreatedAt(),
                g.getUpdatedAt()
        );
    }

    /**
     * Maps a guardian to a contact response.
     *
     * @param g guardian entity
     * @return guardian contact response
     */
    public static GuardianContactResponse contactResponse(Guardian g) {
        return new GuardianContactResponse(
                g.getId(),
                g.getFirstName(),
                g.getLastName(),
                g.getEmail(),
                g.getPhone()
        );
    }

    /**
     * Maps a guardian to a search response.
     *
     * @param g guardian entity
     * @return guardian search response
     */
    public static GuardianSearchResponse searchResponse(Guardian g) {
        return new GuardianSearchResponse(
                g.getId(),
                g.getFirstName(),
                g.getLastName(),
                g.getEmail()
        );
    }


    /**
     * Trims a string or returns null when empty.
     *
     * @param s input string
     * @return trimmed string or null
     */
    private static String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    /**
     * Normalizes an email string.
     *
     * @param email email address
     * @return normalized email
     */
    private static String normaliseEmail(String email) {
        // Lowercase + trim helps avoid mess.
        String t = trimOrNull(email);
        return t == null ? null : t.toLowerCase();
    }

    /**
     * Normalizes a phone string.
     *
     * @param phone phone number
     * @return normalized phone
     */
    private static String normalisePhone(String phone) {
        return trimOrNull(phone);
    }
}
