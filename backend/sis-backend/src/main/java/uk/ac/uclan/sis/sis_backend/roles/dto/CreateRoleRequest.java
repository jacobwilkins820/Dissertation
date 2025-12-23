package uk.ac.uclan.sis.sis_backend.roles.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreateRoleRequest(
        @NotBlank String name,
        @Min(0) int permissionLevel
) {}
