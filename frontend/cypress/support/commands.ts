Cypress.Commands.add("loginAs", (email: string, password: string) => {
  cy.visit("/login");
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password, { log: false });
  cy.contains("button", "Sign in").click();
  cy.url().should("include", "/home");
});
