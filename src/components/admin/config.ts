export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "bool"
  | "select"
  | "tags"
  | "date"
  | "time"
  | "days"
  | "syllabus"
  | "qa"
  | "image"
  | "course"
  | "subject"
  | "colour";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  help?: string;
  full?: boolean;
}

export interface TableDef {
  table: string;
  title: string;
  singular: string;
  description: string;
  orderable: boolean;
  publishable: boolean;
  /** columns shown in the list */
  columns: { key: string; label: string; render?: "subject" | "course" | "bool" | "days" | "time" | "seats" | "status" }[];
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  canAdd?: boolean;
  canDelete?: boolean;
}

const SUBJECT_OPTS = [
  { value: "", label: "— none —" },
  { value: "biology", label: "Biology" },
  { value: "chemistry", label: "Chemistry" },
  { value: "physics", label: "Physics" },
  { value: "math", label: "Math" },
];

const MODE_OPTS = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

export const TABLES: Record<string, TableDef> = {
  education: {
    table: "education",
    title: "Education",
    singular: "degree",
    description: "Degrees shown in About and on the timeline. A year range like 2020–2025 makes two timeline nodes.",
    orderable: true,
    publishable: true,
    columns: [
      { key: "degree", label: "Degree" },
      { key: "institution", label: "Institution" },
      { key: "year", label: "Year" },
    ],
    fields: [
      { key: "degree", label: "Degree", type: "text", required: true },
      { key: "institution", label: "Institution", type: "text", required: true },
      { key: "year", label: "Year or range", type: "text", required: true, help: "e.g. 2019 or 2020–2025" },
      { key: "concentration", label: "Concentration", type: "text" },
      { key: "notes", label: "Notes", type: "text", full: true },
    ],
    defaults: { degree: "", institution: "", year: "", published: true },
  },
  experience: {
    table: "experience",
    title: "Experience",
    singular: "role",
    description: "Teaching history. Leave the end year empty while it's ongoing — the timeline then ends at 'Now'.",
    orderable: true,
    publishable: true,
    columns: [
      { key: "role", label: "Role" },
      { key: "institution", label: "Where" },
      { key: "start_year", label: "From" },
      { key: "end_year", label: "To" },
    ],
    fields: [
      { key: "role", label: "Role", type: "text", required: true },
      { key: "institution", label: "Institution / coaching centre", type: "text" },
      { key: "start_year", label: "Start year", type: "number", required: true },
      { key: "end_year", label: "End year (empty = now)", type: "number" },
      { key: "description", label: "What you do", type: "textarea", full: true },
    ],
    defaults: { role: "", start_year: new Date().getFullYear(), published: true },
  },
  specialties: {
    table: "specialties",
    title: "Specialties",
    singular: "specialty",
    description: "Pressed tags in the About section. Pick a subject to give the tag its colour.",
    orderable: true,
    publishable: true,
    columns: [
      { key: "label", label: "Label" },
      { key: "subject", label: "Subject", render: "subject" },
    ],
    fields: [
      { key: "label", label: "Label", type: "text", required: true },
      { key: "subject", label: "Subject colour", type: "select", options: SUBJECT_OPTS },
    ],
    defaults: { label: "", subject: null, published: true },
  },
  subjects: {
    table: "subjects",
    title: "Subjects",
    singular: "subject",
    description: "The four subject plates. Topics are listed for Class 9–10 and Class 11–12.",
    orderable: true,
    publishable: true,
    canAdd: false,
    canDelete: false,
    columns: [
      { key: "name", label: "Name" },
      { key: "tagline", label: "Tagline" },
      { key: "is_specialty", label: "Specialty", render: "bool" },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "tagline", label: "Tagline", type: "textarea", full: true },
      { key: "topics_ssc", label: "Class 9–10 topics", type: "tags", full: true },
      { key: "topics_hsc", label: "Class 11–12 topics", type: "tags", full: true },
      { key: "is_specialty", label: "Show the SPECIALTY stamp", type: "bool" },
    ],
    defaults: {},
  },
  courses: {
    table: "courses",
    title: "Courses",
    singular: "course",
    description: "The course catalogue. Fee empty = shows the fee note instead.",
    orderable: true,
    publishable: true,
    columns: [
      { key: "title", label: "Course" },
      { key: "class_level", label: "Class" },
      { key: "subject_id", label: "Subject", render: "subject" },
      { key: "fee", label: "Fee" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "Slug (unique, no spaces)", type: "text", required: true },
      {
        key: "class_level",
        label: "Class",
        type: "select",
        required: true,
        options: [
          { value: "9-10", label: "Class 9–10 (SSC)" },
          { value: "11-12", label: "Class 11–12 (HSC)" },
          { value: "10", label: "Class 10 only" },
          { value: "12", label: "Class 12 only" },
        ],
      },
      { key: "subject_id", label: "Subject", type: "subject" },
      {
        key: "mode",
        label: "Mode",
        type: "select",
        options: [
          { value: "both", label: "Online & offline" },
          { value: "online", label: "Online" },
          { value: "offline", label: "Offline" },
        ],
      },
      { key: "duration", label: "Duration", type: "text", help: "e.g. 12 months · full syllabus" },
      { key: "fee", label: "Monthly fee (৳)", type: "number" },
      { key: "fee_note", label: "Fee note (shown when fee is empty)", type: "text" },
      { key: "summary", label: "Summary", type: "textarea", full: true },
      { key: "audience", label: "Who it's for", type: "textarea", full: true },
      { key: "includes", label: "What's included", type: "tags", full: true },
      { key: "syllabus", label: "Chapter-wise syllabus", type: "syllabus", full: true },
      { key: "faqs", label: "Course FAQ", type: "qa", full: true },
    ],
    defaults: { title: "", slug: "", class_level: "9-10", mode: "both", syllabus: [], includes: ["Chapter notes", "Practice sheets", "Weekly tests", "Model tests before the board exam"], faqs: [], published: true },
  },
  batches: {
    table: "batches",
    title: "Batches",
    singular: "batch",
    description: "Timetable slots. Badges are computed from seats: Open → Few seats (75%+) → Full / Waitlist. Update the seat count only.",
    orderable: true,
    publishable: true,
    columns: [
      { key: "name", label: "Batch" },
      { key: "course_id", label: "Course", render: "course" },
      { key: "days", label: "Days", render: "days" },
      { key: "start_time", label: "Time", render: "time" },
      { key: "seats_taken", label: "Seats", render: "seats" },
    ],
    fields: [
      { key: "name", label: "Batch name", type: "text", required: true, help: "short, e.g. HSC Bio · A" },
      { key: "course_id", label: "Course", type: "course", required: true },
      { key: "days", label: "Days", type: "days", full: true },
      { key: "start_time", label: "Starts", type: "time", required: true },
      { key: "end_time", label: "Ends", type: "time", required: true },
      { key: "mode", label: "Mode", type: "select", options: MODE_OPTS },
      { key: "seats_total", label: "Seats total", type: "number", required: true },
      { key: "seats_taken", label: "Seats taken", type: "number", required: true },
      { key: "waitlist", label: "Allow waitlist when full", type: "bool" },
      { key: "start_date", label: "Start date (for 'Upcoming')", type: "date" },
    ],
    defaults: { name: "", days: [], start_time: "16:00", end_time: "17:30", mode: "offline", seats_total: 12, seats_taken: 0, waitlist: true, published: true },
  },
  trial_slots: {
    table: "trial_slots",
    title: "Trial slots",
    singular: "trial slot",
    description: "Free-trial times visitors can pick in the Schedule section.",
    orderable: true,
    publishable: true,
    columns: [
      { key: "day", label: "Day" },
      { key: "start_time", label: "Time", render: "time" },
      { key: "mode", label: "Mode" },
    ],
    fields: [
      {
        key: "day",
        label: "Day",
        type: "select",
        required: true,
        options: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => ({ value: d, label: d })),
      },
      { key: "start_time", label: "Time", type: "time", required: true },
      { key: "mode", label: "Mode", type: "select", options: MODE_OPTS },
    ],
    defaults: { day: "Sat", start_time: "15:00", mode: "online", published: true },
  },
  testimonials: {
    table: "testimonials",
    title: "Testimonials",
    singular: "testimonial",
    description: "Most students are under 18 — a testimonial can't be published until parent consent is ticked.",
    orderable: true,
    publishable: true,
    columns: [
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "consent", label: "Consent", render: "bool" },
    ],
    fields: [
      { key: "name", label: "First name", type: "text", required: true },
      { key: "role", label: "Role", type: "select", options: [{ value: "student", label: "Student" }, { value: "parent", label: "Parent" }] },
      { key: "class_label", label: "Class / year", type: "text", help: "e.g. HSC 2026" },
      { key: "quote", label: "Quote", type: "textarea", required: true, full: true },
      { key: "photo_url", label: "Photo (optional)", type: "image", full: true },
      { key: "consent", label: "Parent consent received", type: "bool" },
    ],
    defaults: { name: "", role: "student", quote: "", consent: false, published: false },
  },
  results: {
    table: "results",
    title: "Results",
    singular: "result",
    description: "Real result figures only — e.g. 12 A+ in SSC 2026. Shown as rolling numbers.",
    orderable: true,
    publishable: true,
    columns: [
      { key: "value", label: "Value" },
      { key: "label", label: "Label" },
      { key: "exam", label: "Exam" },
      { key: "year", label: "Year" },
    ],
    fields: [
      { key: "value", label: "Number", type: "number", required: true },
      { key: "suffix", label: "Suffix", type: "text", help: "optional, e.g. %" },
      { key: "label", label: "Label", type: "text", required: true, help: "e.g. students got A+" },
      { key: "exam", label: "Exam", type: "text", required: true, help: "SSC or HSC" },
      { key: "year", label: "Year", type: "number", required: true },
    ],
    defaults: { value: 0, label: "", exam: "SSC", year: new Date().getFullYear(), published: true },
  },
  faqs: {
    table: "faqs",
    title: "FAQ",
    singular: "question",
    description: "Questions parents ask. Drag to reorder.",
    orderable: true,
    publishable: true,
    columns: [{ key: "question", label: "Question" }],
    fields: [
      { key: "question", label: "Question", type: "text", required: true, full: true },
      { key: "answer", label: "Answer", type: "textarea", required: true, full: true },
    ],
    defaults: { question: "", answer: "", published: true },
  },
};

export const NAV: { key: string; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "enrollments", label: "Enrollments" },
  { key: "site", label: "Site text" },
  { key: "education", label: "Education" },
  { key: "experience", label: "Experience" },
  { key: "specialties", label: "Specialties" },
  { key: "subjects", label: "Subjects" },
  { key: "courses", label: "Courses" },
  { key: "batches", label: "Batches" },
  { key: "trial_slots", label: "Trial slots" },
  { key: "testimonials", label: "Testimonials" },
  { key: "results", label: "Results" },
  { key: "faqs", label: "FAQ" },
  { key: "account", label: "Account" },
];
