describe("auth", () => {
  it("logs in as admin", () => {
    cy.loginAs("admin_1@example.local", "Password123!");
    cy.contains("Welcome").should("be.visible");
  });

  it("blocks unauthorized route for viewer", () => {
    cy.loginAs("viewer_1@example.local", "Password123!");
    cy.visit("/register-student");
    cy.contains("You do not have permission to access this page.").should(
      "be.visible",
    );
  });

  it("blocks unauthorized route for teacher", () => {
    cy.loginAs("teacher_1@example.local", "Password123!");
    cy.visit("/register-student");
    cy.contains("You do not have permission to access this page.").should(
      "be.visible",
    );
  });

  it("blocks unauthorized route for parent", () => {
    cy.loginAs("parent_1@example.local", "Password123!");
    cy.visit("/classes");
    cy.contains("You do not have permission to access this page.").should(
      "be.visible",
    );
  });
});
