describe("auth", () => {
  it("See all routes for admin", () => {
    cy.loginAs("admin_1@example.local", "Password123!");
    cy.contains("Welcome").should("be.visible");
    cy.visit("/studentDirectory");
    cy.contains("Leo Brown").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
    cy.visit("/student/4");
    cy.contains("03/04/2011").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
    cy.visit("/classes");
    cy.contains("Email").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
    cy.visit("/classes/7");
    cy.contains("Eva Wilkins").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
    cy.visit("/classes/new");
    cy.contains("Assign teacher").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
    cy.visit("/guardians");
    cy.contains("Search guardians").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
    cy.visit("/register-student");
    cy.contains("Status").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
    cy.visit("/import-students");
    cy.contains(
      "Download a ready-made CSV template with valid column names and sample rows.",
    ).should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
    cy.visit("/register-user");
    cy.contains("Create User").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
    cy.visit("/register-guardian");
    cy.contains("Create Guardian").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
  });

  it("See all routes for viewer", () => {
    cy.loginAs("viewer_1@example.local", "Password123!");
    cy.visit("/studentDirectory");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
  });

  it("See all routes for teacher", () => {
    cy.loginAs("teacher_1@example.local", "Password123!");
    cy.visit("/studentDirectory");
    cy.contains("Leo Brown").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
    cy.visit("/student/4");
    cy.contains("03/04/2011").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
    cy.visit("/classes");
    cy.contains("Email").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
    cy.visit("/classes/7");
    cy.contains("Eva Wilkins").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
    cy.visit("/guardians");
    cy.contains("Search guardians").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
  });

  it("See all routes for parent", () => {
    cy.loginAs("parent_1@example.local", "Password123!");
    cy.visit("/studentDirectory");
    cy.contains("Ava Smith").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
    cy.visit("/student/1");
    cy.contains("24/01/2011").should("be.visible");
    cy.contains("You do not have permission to access this page.").should(
      "not.exist",
    );
  });
});
