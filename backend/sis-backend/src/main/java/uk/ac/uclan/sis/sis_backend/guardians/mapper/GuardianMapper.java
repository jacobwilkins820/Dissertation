package uk.ac.uclan.sis.sis_backend.guardians.mapper;

import uk.ac.uclan.sis.sis_backend.guardians.dto.*;
import uk.ac.uclan.sis.sis_backend.guardians.entity.Guardian;

/**
 * Mapper keeps controllers/services clean and stops DTO logic spreading everywhere.
 */
public final class GuardianMapper {

    private GuardianMapper() {}

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

    public static GuardianContactResponse contactResponse(Guardian g) {
        return new GuardianContactResponse(
                g.getId(),
                g.getFirstName(),
                g.getLastName(),
                g.getEmail(),
                g.getPhone()
        );
    }

    public static GuardianSearchResponse searchResponse(Guardian g) {
        return new GuardianSearchResponse(
                g.getId(),
                g.getFirstName(),
                g.getLastName(),
                g.getEmail()
        );
    }


    private static String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String normaliseEmail(String email) {
        // Lowercase + trim helps avoid mess.
        String t = trimOrNull(email);
        return t == null ? null : t.toLowerCase();
    }

    private static String normalisePhone(String phone) {
        return trimOrNull(phone);
    }
}
