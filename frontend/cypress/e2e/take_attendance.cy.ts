describe("auth", () => {
  it("takes attendance for a class", () => {
    cy.loginAs("admin_1@example.local", "Password123!");
    cy.contains("Welcome").should("be.visible");

    cy.visit("/attendance/7");
    cy.contains("Attendance register").should("be.visible");
    cy.contains("Students in class").should("be.visible");

    cy.get("tbody tr").should("exist");
    cy.contains("button", "Mark all present").click();
    cy.contains("button", "Save attendance").click();

    cy.contains("Attendance saved.").should("be.visible");
  });
});
