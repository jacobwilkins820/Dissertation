# Build and Run

There are two options to build/run the project.

## Option 1 (Preferred)

### Prerequisites

- Docker Desktop installed.

### Steps

1. From the project root (same level as `docker-compose.yml`), run:
   - `docker compose up`
2. This builds what is needed and starts the containers.
3. Open `http://localhost:5173` to reach the login page.
4. See the login details in the **Login Options** section below.

## Option 2 (Run Locally Without Docker)

### Prerequisites

- `npm` installed.
- Java 17 (JDK) installed.
- PostgreSQL running locally with:
  - Database: `sis_db`
  - Username: `sis_app`
  - Password: `sis_pass`
  - Port: `5432`

### Steps

1. In a terminal, navigate to `Dissertation\backend\sis-backend`.
2. Run `./mvnw spring-boot:start`.
   - This starts the Spring Boot backend and loads mocked data.
3. In a second terminal, navigate to `Dissertation\frontend`.
4. If needed, install frontend dependencies with `npm install`.
5. Run `npm run dev`.
   - This starts the Vite dev server and serves the frontend.
   - Wait for the backend to finish starting before running the frontend.
6. Open `http://localhost:5173` to reach the login page.

## Login Options

There are 4 kinds of users for this application: Viewer, Parent, Teacher, and Admin. These accounts have differing levels of permissions.

### Viewer

- Username: `viewer_1@example.local`
- Password: `Password123!`

Viewers can only see the student directory page and their account page, and nothing else even if they have direct URLs.

### Parent

- Username: `parent_1@example.local`
- Password: `Password123!`

Parents can see the student directory page (but only their children are shown), the detail page for each of their children, and their own account page.

### Teacher

- Username: `teacher_1@example.local`
- Password: `Password123!`

Teachers can see all students in the school and edit their details. They can see all guardians (but not guardian addresses). They can view all classes they are assigned to teach and, within those, view attendance statistics, take attendance, and send class-wide emails to parents.

For a good example of the statistics page, use the `STATISTICS` class assigned to `teacher_1`.

### Admin

- Username: `admin_1@example.local`
- Password: `Password123!`

Admins can do and see everything. This includes:

- See all students, edit their details, switch primary parents, and view/edit all guardian data.
- View all classes in the school, set it to inactive/active, add/remove students from classes, see class statistics, take attendance, and send class-wide emails.
- Create a class and link an existing teacher to it.
- Search for any guardians.
- Register a new student (ensuring a unique UPN).
- Import a CSV of students (a template is available to download on that page), which creates all students in the file.
- Register users (Viewer, Teacher, or Admin).
- Create a guardian (this creates a parent that can be linked and also creates a user account for that parent in one step).
- View their own account.

All roles have multiple instances. For example, `teacher_2@example.local` also exists, up to 5 accounts per role.

## Email Service Demo

To demo the email service end-to-end:

1. Log in as `admin_1@example.local`.
2. Go to **Register Guardian** and create a guardian using an email address you can access.
   - This creates both the guardian record and linked parent account in one step.
3. Open a student record and note the student's UPN (use UPN to avoid name duplicates that are in seeded data).
4. Link the new guardian to that student as the primary contact, and remove other guardians.
5. Ensure that student is enrolled in the `EMAIL` class by opening the class and clicking add student, then finding the student you want.
6. Open the `EMAIL` class, click **Email parents**, enter a subject and message, then send.
7. Check the target inbox (and spam folder) for the message.

Notes:

- Recipients are all guardian email addresses linked to students currently enrolled in the class.
- Delivery depends on valid SMTP settings (`SPRING_MAIL_*` / `APP_MAIL_FROM`). They should remain valid but if theres an issue this is the first place to look.

Tests:

Backend:

      The backend uses JPA/Hibernate to map database tables to Java entity classes. Unit tests focus on validating the behaviour of these objects and the service logic that uses them.

      Service tests mock repository dependencies to ensure rules, validation, and relationships between objects behave correctly without requiring a running database. This allows logic to be tested in isolation while keeping persistence concerns separate.

      These tests are run when the backend is started up to ensure there are no errors.

Frontend:

      The front end utilises Cypress testing which needs the application to be running to work. It acts as a pretend user essentially, and goes through different pages and different actions to make sure everything appears as it should and users can't access things their permissions dont allow.

      To open the Cypress UI run from Dissertation\frontend root, npm run cy:open

      To just run them run, npm run cy:run
