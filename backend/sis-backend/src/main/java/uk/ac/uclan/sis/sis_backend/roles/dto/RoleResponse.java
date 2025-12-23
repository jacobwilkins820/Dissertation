package uk.ac.uclan.sis.sis_backend.roles.dto;

public record RoleResponse(
        Long id,
        String name,
        int permissionLevel
) {}
