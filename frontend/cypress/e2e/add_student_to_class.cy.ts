describe("auth", () => {
  it("takes attendance for a class", () => {
    cy.loginAs("admin_1@example.local", "Password123!");
    cy.contains("Welcome").should("be.visible");

    cy.visit("/classes/1");
    cy.contains("Add student").should("be.visible");
    cy.contains("Status").should("be.visible");

    cy.contains("button", "Add student").click();

    cy.contains("label", "Find student").find("input").type("test");
    cy.contains("button", "Test Mcgee · UPN123456789123").click();
    cy.contains("button", "Add to class").click();

    cy.contains("Test Mcgee").should("be.visible");
  });
});
