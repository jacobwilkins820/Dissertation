describe("auth", () => {
  it("logs in as admin", () => {
    cy.loginAs("admin_1@example.local", "Password123!");
    cy.contains("Welcome").should("be.visible");
    cy.visit("/classes/new");

    cy.contains("label", "Class name").find("input").type("Test Class");
    cy.contains("label", "Class code").find("input").type("Test");
    cy.contains("label", "Assign teacher").find("input").type("teacher");

    cy.contains("button", "User1 Teacher - teacher_1@example.local").click();

    cy.contains("button", "Create class").click();
    cy.contains("Class created successfully.").should("be.visible");

    cy.visit("/classes");
    cy.contains("button", "Test Class").click();
    cy.contains("Active").should("be.visible");
    cy.contains("No students are enrolled in this class.").should("be.visible");
  });
});
