describe("auth", () => {
  it("logs in as admin", () => {
    const uniqueEmail = Date.now();
    cy.loginAs("admin_1@example.local", "Password123!");
    cy.contains("Welcome").should("be.visible");
    cy.visit("/register-user");

    cy.contains("label", "First name").find("input").type("PETER");
    cy.contains("label", "Last name").find("input").type("PARKER");
    cy.contains("label", "Email")
      .find("input")
      .type(`${uniqueEmail}@example.com`);
    cy.contains("label", "Password").find("input").type("Password123!");
    cy.contains("label", "Confirm password").find("input").type("Password123!");

    cy.contains('button[aria-haspopup="listbox"]', "Select a role...").click();
    cy.contains('[role="option"]', /^TEACHER$/).click();

    cy.contains("button", "Create user").click();
    cy.contains("User created successfully.").should("be.visible");

    cy.visit("/register-user");

    cy.contains("label", "First name").find("input").type("PETER");
    cy.contains("label", "Last name").find("input").type("PARKER");
    cy.contains("label", "Email")
      .find("input")
      .type(`${uniqueEmail + 1}@example.com`);
    cy.contains("label", "Password").find("input").type("Password123!");
    cy.contains("label", "Confirm password").find("input").type("Password123!");

    cy.contains('button[aria-haspopup="listbox"]', "Select a role...").click();
    cy.contains('[role="option"]', /^ADMIN$/).click();

    cy.contains("button", "Create user").click();
    cy.contains("User created successfully.").should("be.visible");

    cy.visit("/register-user");

    cy.contains("label", "First name").find("input").type("PETER");
    cy.contains("label", "Last name").find("input").type("PARKER");
    cy.contains("label", "Email")
      .find("input")
      .type(`${uniqueEmail + 2}@example.com`);
    cy.contains("label", "Password").find("input").type("Password123!");
    cy.contains("label", "Confirm password").find("input").type("Password123!");

    cy.contains('button[aria-haspopup="listbox"]', "Select a role...").click();
    cy.contains('[role="option"]', /^VIEWER$/).click();

    cy.contains("button", "Create user").click();
    cy.contains("User created successfully.").should("be.visible");
  });
});
