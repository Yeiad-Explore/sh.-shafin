-- Starting content from the website plan and Shafin's CV.
-- Everything here is editable from /admin. No invented results or testimonials.

insert into public.site_settings (id, bio, payment_methods)
values (
  1,
  'I''m Samiul Haque Shafin, a science teacher in Dhaka. I studied Botany at Dhaka College and have been teaching SSC and HSC students since 2022 — mostly Biology, alongside Physics, Chemistry and Math. My classes follow the national curriculum, and every topic ends with practice questions and regular tests, so students and parents can see progress, not just hope for it.',
  '{}'
)
on conflict (id) do nothing;

insert into public.education (degree, institution, year, concentration, notes, sort_order) values
  ('Bachelor of Science', 'Dhaka College', '2020–2025', 'Botany', 'Affiliated with the University of Dhaka (Seven College)', 0),
  ('Higher Secondary Certificate', 'Ideal College, Dhanmondi', '2019', 'Science', null, 1),
  ('Secondary School Certificate', 'Mohammadpur Government High School', '2017', 'Science', null, 2);

insert into public.experience (role, institution, start_year, end_year, description, sort_order) values
  ('Academic Instructor', null, 2022, null,
   'Teaches science (mainly Biology) to SSC and HSC students on the national curriculum; designs and marks practice exams and assignments; gives one-on-one support and mentoring before board exams.', 0);

insert into public.specialties (label, subject, sort_order) values
  ('SSC & HSC Biology', 'biology', 0),
  ('Board-exam preparation', null, 1),
  ('Practice-test design', null, 2),
  ('One-on-one mentoring', null, 3),
  ('Doubt solving', null, 4),
  ('Complex ideas, explained simply', null, 5);

insert into public.subjects (slug, name, colour, tagline, topics_ssc, topics_hsc, is_specialty, sort_order) values
  ('biology', 'Biology', '#3C7A2E', 'From a single cell to a whole living system — drawn, labelled and understood.',
   array['Cell and tissues','Cell division','Bioenergetics & photosynthesis','Food, nutrition & digestion','Transport in organisms','Exchange of gases','Excretion','Coordination','Reproduction','Heredity & evolution'],
   array['Cell structure & cell chemistry','Cell division','Microorganisms, algae & fungi','Bryophytes to angiosperms','Plant tissues & physiology','Plant reproduction','Biotechnology','Human physiology','Continuity of life & immunity','Genetics & evolution'],
   true, 0),
  ('chemistry', 'Chemistry', '#C2771B', 'Bonds, reactions and the counting behind them, one mechanism at a time.',
   array['States of matter','Structure of matter','Periodic table','Chemical bonds','Mole concept','Chemical reactions','Chemistry & energy','Acids, bases & salts','Metals & non-metals','Fossil fuels'],
   array['Qualitative chemistry','Periodic properties & bonding','Chemical changes & equilibrium','Environmental chemistry','Organic chemistry','Quantitative chemistry','Electrochemistry','Economic chemistry'],
   false, 1),
  ('physics', 'Physics', '#2747E0', 'Motion you can feel, laws you can test, and problems worked step by step.',
   array['Physical quantities & measurement','Motion','Force','Work, power & energy','Pressure','Heat','Waves & sound','Reflection & refraction','Static & current electricity','Magnetic effect of current','Modern physics & electronics'],
   array['Vectors','Newtonian mechanics','Work, energy & power','Gravitation','Properties of matter','Periodic motion & waves','Thermodynamics','Electricity & magnetism','Optics','Modern & nuclear physics','Semiconductors'],
   false, 2),
  ('math', 'Math', '#D9401F', 'General and Higher Math, built from the definitions up.',
   array['Sets & functions','Algebraic expressions','Indices & logarithms','Equations','Geometry & constructions','Trigonometry','Mensuration','Statistics','Coordinate geometry','Vectors','Probability'],
   array['Matrices & determinants','Straight lines & circles','Permutations & combinations','Trigonometry','Functions & graphs','Differentiation','Integration','Complex numbers','Conics','Statics & dynamics','Probability'],
   false, 3);

with s as (select slug, id from public.subjects)
insert into public.courses (title, slug, class_level, subject_id, mode, duration, fee_note, summary, audience, syllabus, includes, faqs, sort_order)
select v.title, v.slug, v.class_level, s.id, v.mode, v.duration, 'Ask for the current monthly fee', v.summary, v.audience, v.syllabus::jsonb,
       array['Chapter notes','Practice sheets','Weekly tests','Model tests before the board exam'], v.faqs::jsonb, v.sort_order
from (values
  ('SSC Biology', 'ssc-biology', '9-10', 'biology', 'both', '12 months · full syllabus',
   'The full Class 9–10 Biology syllabus, taught with diagrams drawn in class and a test at the end of every chapter.',
   'Class 9 and 10 science students preparing for SSC.',
   '[{"chapter":"Cell and tissues","topics":["Plant and animal cells","Organelles and their jobs","Tissue types"]},{"chapter":"Cell division","topics":["Mitosis","Meiosis","Why cells divide"]},{"chapter":"Bioenergetics","topics":["ATP","Photosynthesis","Respiration"]},{"chapter":"Food, nutrition & digestion","topics":["Balanced diet","Digestive system","Enzymes"]},{"chapter":"Transport in organisms","topics":["Xylem and phloem","Blood and circulation"]},{"chapter":"Coordination & reproduction","topics":["Nervous system","Hormones","Reproduction in plants and humans"]},{"chapter":"Heredity & evolution","topics":["DNA and genes","Mendel''s laws","Evolution"]}]',
   '[{"q":"Are diagrams practised in class?","a":"Yes. Every chapter includes the board-exam diagrams, drawn step by step and practised until students can draw them from memory."}]',
   0),
  ('SSC Physics', 'ssc-physics', '9-10', 'physics', 'both', '12 months · full syllabus',
   'Class 9–10 Physics with every formula derived once and then practised on board-style problems.',
   'Class 9 and 10 science students preparing for SSC.',
   '[{"chapter":"Measurement & motion","topics":["Units and dimensions","Speed, velocity, acceleration","Equations of motion"]},{"chapter":"Force & energy","topics":["Newton''s laws","Work, power, energy"]},{"chapter":"Pressure & heat","topics":["Pressure in fluids","Expansion","Specific heat"]},{"chapter":"Waves, sound & light","topics":["Wave properties","Reflection","Refraction and lenses"]},{"chapter":"Electricity & magnetism","topics":["Static charge","Current, resistance, Ohm''s law","Magnetic effect of current"]},{"chapter":"Modern physics & electronics","topics":["Radioactivity","Basic electronics"]}]',
   '[]', 1),
  ('SSC Chemistry', 'ssc-chemistry', '9-10', 'chemistry', 'both', '12 months · full syllabus',
   'Class 9–10 Chemistry from atomic structure to mole calculations, with weekly problem sets.',
   'Class 9 and 10 science students preparing for SSC.',
   '[{"chapter":"Structure of matter","topics":["Atomic structure","Electron configuration"]},{"chapter":"Periodic table & bonds","topics":["Periodic trends","Ionic and covalent bonds"]},{"chapter":"Mole concept","topics":["Mole and molar mass","Chemical counting"]},{"chapter":"Chemical reactions","topics":["Types of reactions","Balancing equations","Redox"]},{"chapter":"Acids, bases & salts","topics":["pH","Neutralisation"]},{"chapter":"Mineral resources & fuels","topics":["Metals and non-metals","Fossil fuels"]}]',
   '[]', 2),
  ('SSC General & Higher Math', 'ssc-math', '9-10', 'math', 'both', '12 months · can be split into two courses',
   'General Math and Higher Math for Class 9–10, worked from definitions to board-level problems.',
   'Class 9 and 10 students taking General Math, Higher Math or both.',
   '[{"chapter":"Algebra","topics":["Sets and functions","Algebraic expressions","Indices and logarithms","Equations"]},{"chapter":"Geometry","topics":["Theorems and constructions","Coordinate geometry","Vectors"]},{"chapter":"Trigonometry & mensuration","topics":["Ratios and identities","Heights and distances","Area and volume"]},{"chapter":"Statistics & probability","topics":["Central tendency","Probability"]}]',
   '[]', 3),
  ('HSC Biology 1st & 2nd paper', 'hsc-biology', '11-12', 'biology', 'both', '2 years · both papers',
   'Botany (1st paper) and Zoology (2nd paper) for HSC, taught by a Botany graduate, with diagram practice and regular tests.',
   'Class 11 and 12 science students, including medical admission aspirants who need strong fundamentals.',
   '[{"chapter":"1st paper — Cell & cell chemistry","topics":["Cell structure","Cell division","Biomolecules"]},{"chapter":"1st paper — Plant diversity","topics":["Microorganisms","Algae and fungi","Bryophytes and pteridophytes","Gymnosperms and angiosperms"]},{"chapter":"1st paper — Plant physiology","topics":["Tissues","Photosynthesis and respiration","Plant reproduction","Biotechnology"]},{"chapter":"2nd paper — Animal diversity","topics":["Classification","Hydra","Grasshopper","Rui fish"]},{"chapter":"2nd paper — Human physiology","topics":["Digestion","Blood and circulation","Respiration","Excretion","Coordination"]},{"chapter":"2nd paper — Genetics & evolution","topics":["Continuity of life","Immunity","Genetics","Evolution"]}]',
   '[{"q":"Is this useful for medical admission?","a":"The course follows the HSC syllabus, which is the base for medical admission Biology. Admission-specific practice can be added in one-on-one sessions."}]',
   4),
  ('HSC Physics 1st & 2nd paper', 'hsc-physics', '11-12', 'physics', 'both', '2 years · problem-solving focus',
   'HSC Physics with a problem-solving focus: each chapter ends with a graded set from easy to board-hard.',
   'Class 11 and 12 science students.',
   '[{"chapter":"1st paper — Mechanics","topics":["Vectors","Dynamics","Newtonian mechanics","Work, energy, power","Gravitation"]},{"chapter":"1st paper — Matter & waves","topics":["Properties of matter","Periodic motion","Waves","Ideal gas"]},{"chapter":"2nd paper — Heat & electricity","topics":["Thermodynamics","Static electricity","Current electricity","Magnetism","EM induction"]},{"chapter":"2nd paper — Optics & modern physics","topics":["Geometrical optics","Physical optics","Modern physics","Atomic and nuclear physics","Semiconductors"]}]',
   '[]', 5),
  ('HSC Chemistry 1st & 2nd paper', 'hsc-chemistry', '11-12', 'chemistry', 'both', '2 years · includes organic chemistry',
   'HSC Chemistry including a full organic chemistry block with reaction maps students build themselves.',
   'Class 11 and 12 science students.',
   '[{"chapter":"1st paper","topics":["Lab safety","Qualitative chemistry","Periodic properties and bonding","Chemical changes","Work-oriented chemistry"]},{"chapter":"2nd paper — Organic chemistry","topics":["Nomenclature","Reaction mechanisms","Functional groups","Reaction maps"]},{"chapter":"2nd paper — Quantitative & electrochemistry","topics":["Quantitative chemistry","Electrochemistry"]},{"chapter":"2nd paper — Environment & economy","topics":["Environmental chemistry","Economic chemistry"]}]',
   '[]', 6),
  ('HSC Higher Math 1st & 2nd paper', 'hsc-higher-math', '11-12', 'math', 'both', '2 years · both papers',
   'HSC Higher Math with calculus taught from limits up, and a weekly mixed problem test.',
   'Class 11 and 12 science students.',
   '[{"chapter":"1st paper","topics":["Matrices and determinants","Vectors","Straight lines","Circles","Permutations and combinations","Trigonometry","Functions","Differentiation","Integration"]},{"chapter":"2nd paper","topics":["Real numbers and inequalities","Linear programming","Complex numbers","Polynomials","Binomial theorem","Conics","Inverse trigonometry","Statics","Dynamics","Probability"]}]',
   '[]', 7),
  ('SSC Model Test Crash Course', 'ssc-crash', '10', null, 'both', '6 weeks · before the SSC exam',
   'Short, intensive revision before the SSC board exam: full model tests under exam timing, marked and reviewed in class.',
   'Class 10 students in the final weeks before SSC.',
   '[{"chapter":"Week 1–2","topics":["High-yield chapter revision","Diagram drill"]},{"chapter":"Week 3–6","topics":["Full model tests","Marked scripts with feedback"]}]',
   '[]', 8),
  ('HSC Model Test Crash Course', 'hsc-crash', '12', null, 'both', '6 weeks · before the HSC exam',
   'Full-length model tests under exam timing for HSC, with marked scripts and one-on-one review of weak chapters.',
   'Class 12 students in the final weeks before HSC.',
   '[{"chapter":"Week 1–2","topics":["High-yield revision","Creative-question technique"]},{"chapter":"Week 3–6","topics":["Full model tests","One-on-one review"]}]',
   '[]', 9)
) as v(title, slug, class_level, subject_slug, mode, duration, summary, audience, syllabus, faqs, sort_order)
left join s on s.slug = v.subject_slug;

with c as (select slug, id from public.courses)
insert into public.batches (course_id, name, days, start_time, end_time, mode, seats_total, seats_taken, start_date, sort_order)
select c.id, v.name, v.days, v.st::time, v.et::time, v.mode, v.total, v.taken, v.sd::date, v.so
from (values
  ('ssc-biology', 'SSC Bio · A', array['Sat','Mon','Wed'], '16:00', '17:30', 'offline', 12, 7, '2026-11-01', 0),
  ('hsc-biology', 'HSC Bio · A', array['Sun','Tue','Thu'], '18:00', '19:30', 'offline', 15, 13, '2026-11-08', 1),
  ('hsc-biology', 'HSC Bio · Online', array['Sat','Mon'], '20:30', '22:00', 'online', 20, 20, null, 2),
  ('ssc-chemistry', 'SSC Chem · A', array['Sun','Tue'], '16:00', '17:30', 'offline', 12, 4, '2026-11-15', 3),
  ('ssc-physics', 'SSC Phy · A', array['Mon','Wed'], '18:00', '19:30', 'offline', 12, 9, null, 4),
  ('hsc-physics', 'HSC Phy · A', array['Sat','Tue'], '18:00', '19:30', 'offline', 15, 6, '2027-01-03', 5),
  ('ssc-math', 'SSC Math · A', array['Thu'], '16:00', '18:00', 'offline', 12, 11, null, 6),
  ('hsc-chemistry', 'HSC Chem · Online', array['Wed','Thu'], '20:30', '22:00', 'online', 20, 8, '2026-12-01', 7)
) as v(course_slug, name, days, st, et, mode, total, taken, sd, so)
join c on c.slug = v.course_slug;

insert into public.trial_slots (day, start_time, mode, sort_order) values
  ('Sat', '15:00', 'online', 0),
  ('Sun', '15:00', 'offline', 1),
  ('Tue', '15:00', 'online', 2),
  ('Thu', '19:00', 'online', 3);

insert into public.faqs (question, answer, sort_order) values
  ('How are fees paid?', 'Fees are paid monthly, at the start of each month. The current fee for each course is on its card — or ask on WhatsApp. Accepted payment methods are listed in the Contact section.', 0),
  ('Online or offline — which is better?', 'Most courses run both ways with the same notes, practice sheets and tests. Offline batches meet in Dhaka; online batches are live classes, not recordings.', 1),
  ('How big is a batch?', 'Batches are kept small so every student gets checked work and questions answered. The timetable shows the exact number of seats left in each batch.', 2),
  ('What if my child misses a class?', 'Notes and practice sheets from that class are shared with the batch, and the missed topic can be covered in a short doubt-solving session.', 3),
  ('What study materials are included?', 'Chapter notes, practice sheets, weekly tests and full model tests before the board exam. Marked scripts are returned with comments.', 4),
  ('Can we try a class before enrolling?', 'Yes. The first class is free. Pick a trial slot in the Schedule section or send a request from the Contact form.', 5);
