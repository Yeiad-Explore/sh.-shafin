export type SubjectSlug = "biology" | "physics" | "chemistry" | "math";
export type ClassLevel = "9-10" | "11-12" | "10" | "12";
export type Mode = "online" | "offline" | "both";
export type SectionKey = "about" | "subjects" | "courses" | "schedule" | "results" | "faq" | "contact";

export interface SiteSettings {
  id: number;
  hero_headline: string;
  hero_subline: string;
  bio: string;
  philosophy: string;
  photo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  teaching_place: string | null;
  facebook: string | null;
  youtube: string | null;
  instagram: string | null;
  payment_methods: string[];
  notice: string | null;
  notice_active: boolean;
  sections: Record<SectionKey, boolean>;
  section_order: SectionKey[];
}

interface Row {
  id: string;
  published: boolean;
  sort_order: number;
}

export interface Education extends Row {
  degree: string;
  institution: string;
  year: string;
  concentration: string | null;
  notes: string | null;
}

export interface Experience extends Row {
  role: string;
  institution: string | null;
  start_year: number;
  end_year: number | null;
  description: string | null;
}

export interface Specialty extends Row {
  label: string;
  subject: SubjectSlug | null;
}

export interface Subject extends Row {
  slug: SubjectSlug;
  name: string;
  colour: string;
  tagline: string | null;
  topics_ssc: string[];
  topics_hsc: string[];
  is_specialty: boolean;
}

export interface SyllabusChapter {
  chapter: string;
  topics: string[];
}

export interface CourseFaq {
  q: string;
  a: string;
}

export interface Course extends Row {
  title: string;
  slug: string;
  class_level: ClassLevel;
  subject_id: string | null;
  mode: Mode;
  duration: string | null;
  fee: number | null;
  fee_note: string | null;
  summary: string | null;
  audience: string | null;
  syllabus: SyllabusChapter[];
  includes: string[];
  faqs: CourseFaq[];
}

export interface Batch extends Row {
  course_id: string;
  name: string;
  days: string[];
  start_time: string;
  end_time: string;
  mode: "online" | "offline";
  seats_total: number;
  seats_taken: number;
  waitlist: boolean;
  start_date: string | null;
}

export interface TrialSlot extends Row {
  day: string;
  start_time: string;
  mode: "online" | "offline";
}

export interface Testimonial extends Row {
  name: string;
  role: "student" | "parent";
  class_label: string | null;
  quote: string;
  photo_url: string | null;
  consent: boolean;
}

export interface Result extends Row {
  year: number;
  exam: string;
  label: string;
  value: number;
  suffix: string | null;
}

export interface Faq extends Row {
  question: string;
  answer: string;
}

export interface Enrollment {
  id: string;
  kind: "enroll" | "trial";
  student_name: string;
  class: string | null;
  institution: string | null;
  subjects: string[];
  mode: "online" | "offline" | null;
  preferred_time: string | null;
  parent_phone: string;
  message: string | null;
  course_id: string | null;
  status: "new" | "contacted" | "enrolled" | "closed";
  created_at: string;
}

export interface SiteData {
  settings: SiteSettings;
  education: Education[];
  experience: Experience[];
  specialties: Specialty[];
  subjects: Subject[];
  courses: Course[];
  batches: Batch[];
  trialSlots: TrialSlot[];
  testimonials: Testimonial[];
  results: Result[];
  faqs: Faq[];
}
