import type { SiteData } from "./types";

/**
 * Shown only if Supabase is unreachable or not configured, so the page never renders empty.
 * Facts come straight from the CV; the live content lives in Supabase.
 */
export const fallbackData: SiteData = {
  settings: {
    id: 1,
    hero_headline: "Science, taught until it clicks.",
    hero_subline: "Biology, Physics, Chemistry and Math for SSC and HSC students in Dhaka.",
    bio: "I'm Samiul Haque Shafin, a science teacher in Dhaka. I studied Botany at Dhaka College and have been teaching SSC and HSC students since 2022 — mostly Biology, alongside Physics, Chemistry and Math. My classes follow the national curriculum, and every topic ends with practice questions and regular tests, so students and parents can see progress, not just hope for it.",
    philosophy: "",
    photo_url: "/shafin-portrait.webp",
    phone: null,
    whatsapp: null,
    email: null,
    address: null,
    teaching_place: null,
    facebook: null,
    youtube: null,
    instagram: null,
    payment_methods: [],
    notice: null,
    notice_active: false,
    sections: { about: true, subjects: true, courses: true, schedule: true, results: true, faq: true, contact: true },
    section_order: ["about", "subjects", "courses", "schedule", "results", "faq", "contact"],
  },
  education: [
    { id: "e1", degree: "Bachelor of Science", institution: "Dhaka College", year: "2020–2025", concentration: "Botany", notes: "Affiliated with the University of Dhaka (Seven College)", published: true, sort_order: 0 },
    { id: "e2", degree: "Higher Secondary Certificate", institution: "Ideal College, Dhanmondi", year: "2019", concentration: "Science", notes: null, published: true, sort_order: 1 },
    { id: "e3", degree: "Secondary School Certificate", institution: "Mohammadpur Government High School", year: "2017", concentration: "Science", notes: null, published: true, sort_order: 2 },
  ],
  experience: [
    { id: "x1", role: "Academic Instructor", institution: null, start_year: 2022, end_year: null, description: "Teaches science (mainly Biology) to SSC and HSC students on the national curriculum; designs and marks practice exams and assignments; gives one-on-one support and mentoring before board exams.", published: true, sort_order: 0 },
  ],
  specialties: [
    { id: "s1", label: "SSC & HSC Biology", subject: "biology", published: true, sort_order: 0 },
    { id: "s2", label: "Board-exam preparation", subject: null, published: true, sort_order: 1 },
    { id: "s3", label: "Practice-test design", subject: null, published: true, sort_order: 2 },
    { id: "s4", label: "One-on-one mentoring", subject: null, published: true, sort_order: 3 },
  ],
  subjects: [
    { id: "b", slug: "biology", name: "Biology", colour: "#3C7A2E", tagline: "From a single cell to a whole living system — drawn, labelled and understood.", topics_ssc: ["Cell and tissues", "Cell division", "Bioenergetics", "Heredity & evolution"], topics_hsc: ["Cell structure", "Plant physiology", "Human physiology", "Genetics & evolution"], is_specialty: true, published: true, sort_order: 0 },
    { id: "c", slug: "chemistry", name: "Chemistry", colour: "#C2771B", tagline: "Bonds, reactions and the counting behind them.", topics_ssc: ["Structure of matter", "Chemical bonds", "Mole concept"], topics_hsc: ["Organic chemistry", "Electrochemistry", "Quantitative chemistry"], is_specialty: false, published: true, sort_order: 1 },
    { id: "p", slug: "physics", name: "Physics", colour: "#2747E0", tagline: "Motion you can feel, laws you can test.", topics_ssc: ["Motion", "Force", "Electricity"], topics_hsc: ["Mechanics", "Thermodynamics", "Optics"], is_specialty: false, published: true, sort_order: 2 },
    { id: "m", slug: "math", name: "Math", colour: "#D9401F", tagline: "General and Higher Math, built from the definitions up.", topics_ssc: ["Algebra", "Geometry", "Trigonometry"], topics_hsc: ["Calculus", "Conics", "Probability"], is_specialty: false, published: true, sort_order: 3 },
  ],
  courses: [],
  batches: [],
  trialSlots: [],
  testimonials: [],
  results: [],
  faqs: [],
};
