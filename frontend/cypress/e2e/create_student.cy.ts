describe("auth", () => {
  it("logs in as admin", () => {
    const uniqueUpn = `UPN${Date.now()}`;

    cy.loginAs("admin_1@example.local", "Password123!");
    cy.contains("Welcome").should("be.visible");
    cy.visit("/register-student");

    cy.contains("label", "UPN").find("input").type(uniqueUpn);
    cy.contains("label", "First name").find("input").type("Test");
    cy.contains("label", "Last name").find("input").type("Askin");
    cy.contains("label", "Gender").find("input").type("Male");

    cy.contains('button[aria-haspopup="listbox"]', "Default (ACTIVE)").click();
    cy.contains('[role="option"]', /^ACTIVE$/).click();

    cy.contains("label", "Date of birth").find("input").click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains("button", "1").click();
      cy.contains("button", "Apply").click();
    });

    cy.contains("button", "Create student").click();
    cy.contains("Student created successfully.").should("be.visible");

    cy.visit("/studentDirectory");
    cy.contains("label", "Search").find("input").type("Test Askin");
    cy.contains("tr", "Test Askin")
      .should("be.visible")
      .within(() => {
        cy.contains("td", /^Male$/).should("be.visible");
        cy.get('button[aria-label="Select Test Askin"]').click({ force: true });
      });
  });
});
