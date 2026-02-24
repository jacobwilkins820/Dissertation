describe("auth", () => {
  it("logs in as admin", () => {
    const uniqueEmail = Date.now();
    cy.loginAs("admin_1@example.local", "Password123!");
    cy.contains("Welcome").should("be.visible");
    cy.visit("/register-guardian");

    cy.contains("label", "First name").find("input").type("PETER");
    cy.contains("label", "Last name").find("input").type("PARKER");
    cy.contains("label", "Email")
      .find("input")
      .type(`${uniqueEmail}@example.com`);
    cy.contains("label", "Password").find("input").type("Password123!");
    cy.contains("label", "Confirm password").find("input").type("Password123!");

    cy.contains("button", "Create guardian").click();
    cy.contains(
      "Guardian and parent user account created successfully.",
    ).should("be.visible");
  });
});
