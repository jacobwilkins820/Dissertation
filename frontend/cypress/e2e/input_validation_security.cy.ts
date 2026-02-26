describe("input hardening and validation", () => {
  const selectStudentDob = () => {
    cy.contains("label", "Date of birth").find("input").click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains("button", "1").click();
      cy.contains("button", "Apply").click();
    });
  };

  const fillStudentForm = (upn: string, firstName: string, lastName: string) => {
    cy.contains("label", "UPN").find("input").clear().type(upn);
    cy.contains("label", "First name").find("input").clear().type(firstName);
    cy.contains("label", "Last name").find("input").clear().type(lastName);
    cy.contains("label", "Gender").find("input").clear().type("Female");
    selectStudentDob();
  };

  it("rejects a SQL injection-style login attempt", () => {
    cy.intercept("POST", "**/api/auth/login").as("loginAttempt");

    cy.visit("/login");
    cy.get('input[type="email"]').type("admin_1@example.local");
    cy.get('input[type="password"]').type("' OR '1'='1", { log: false });
    cy.contains("button", "Sign in").click();

    cy.wait("@loginAttempt").its("response.statusCode").should("eq", 401);
    cy.url().should("include", "/login");
    cy.contains("Invalid Credentials").should("be.visible");
  });

  it("rejects duplicate student UPN values", () => {
    const uniqueUpn = `UPN${Date.now()}`;

    cy.intercept("POST", "**/api/students").as("createStudent");

    cy.loginAs("admin_1@example.local", "Password123!");
    cy.contains("Welcome").should("be.visible");
    cy.visit("/register-student");

    fillStudentForm(uniqueUpn, "Dup", "StudentOne");
    cy.contains("button", "Create student").click();
    cy.wait("@createStudent").its("response.statusCode").should("eq", 201);
    cy.contains("Student created successfully.").should("be.visible");

    cy.visit("/register-student");
    fillStudentForm(uniqueUpn, "Dup", "StudentTwo");
    cy.contains("button", "Create student").click();

    cy.wait("@createStudent").its("response.statusCode").should("eq", 409);
    cy.contains("UPN already exists").should("be.visible");
  });

  it("rejects duplicate user emails (case-insensitive)", () => {
    cy.intercept("POST", "**/api/users").as("createUser");

    cy.loginAs("admin_1@example.local", "Password123!");
    cy.contains("Welcome").should("be.visible");
    cy.visit("/register-user");

    cy.contains("label", "First name").find("input").type("Existing");
    cy.contains("label", "Last name").find("input").type("Admin");
    cy.contains("label", "Email").find("input").type("ADMIN_1@EXAMPLE.LOCAL");
    cy.contains("label", "Password").find("input").type("Password123!");
    cy.contains("label", "Confirm password").find("input").type("Password123!");

    cy.contains('button[aria-haspopup="listbox"]', "Select a role...").click();
    cy.contains('[role="option"]', /^TEACHER$/).click();

    cy.contains("button", "Create user").click();

    cy.wait("@createUser").its("response.statusCode").should("eq", 400);
    cy.contains("Email already in use").should("be.visible");
  });

  it("shows a database constraint error for overlong guardian postcode input", () => {
    const uniqueEmail = `${Date.now()}@example.com`;
    const overlongPostcode = "X".repeat(30);

    cy.intercept("POST", "**/api/users/guardian-account").as("createGuardian");

    cy.loginAs("admin_1@example.local", "Password123!");
    cy.contains("Welcome").should("be.visible");
    cy.visit("/register-guardian");

    cy.contains("label", "First name").find("input").type("Constraint");
    cy.contains("label", "Last name").find("input").type("Guardian");
    cy.contains("label", "Email").find("input").type(uniqueEmail);
    cy.contains("label", "Password").find("input").type("Password123!");
    cy.contains("label", "Confirm password").find("input").type("Password123!");
    cy.contains("label", "Postcode (optional)")
      .find("input")
      .type(overlongPostcode);

    cy.contains("button", "Create guardian").click();

    cy.wait("@createGuardian").its("response.statusCode").should("eq", 409);
    cy.contains("Request violates a database constraint").should("be.visible");
  });
});
