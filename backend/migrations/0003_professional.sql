-- Professional portfolio: richer profile, experience / education / certifications, skills, PDF uploads (CV).

-- Uploads: images plus PDF (the CV).
alter table project_images drop constraint project_images_mime_check;
alter table project_images add constraint project_images_mime_check
  check (mime in ('image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'));

alter table profile drop constraint profile_bio_check;
alter table profile add constraint profile_bio_check check (length(bio) <= 4000);
alter table profile
  add column title        text not null default '' check (length(title) <= 80),
  add column location     text not null default '' check (length(location) <= 80),
  add column availability text not null default '' check (length(availability) <= 160),
  add column languages    text[] not null default '{}',
  add column photo_url    text check (photo_url ~ '^(https?://|/)'),
  add column cv_url       text check (cv_url ~ '^(https?://|/)');

-- Work experience, education and certifications share one shape.
create table experiences (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('work', 'education', 'certification')),
  title        text not null check (length(title) between 1 and 160),
  organization text not null default '' check (length(organization) <= 160),
  location     text not null default '' check (length(location) <= 80),
  start_label  text not null default '' check (length(start_label) <= 40),
  end_label    text not null default '' check (length(end_label) <= 40),
  summary      text not null default '' check (length(summary) <= 1000),
  highlights   text[] not null default '{}',
  tags         text[] not null default '{}',
  url          text check (url ~ '^https?://'),
  published    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index experiences_listing on experiences (kind, published, sort_order);

create table skill_groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(name) between 1 and 60),
  items      text[] not null default '{}',
  sort_order integer not null default 0
);

-- Content from the CV.
update profile set
  name = 'Mohamed Abderrahmane Heouaine',
  title = 'AI & Data Engineer',
  headline = 'I build computer-vision systems and data pipelines that turn messy, real-world data into reliable products.',
  bio = 'I''m an AI and data engineer based in Paris, finishing a dual State Engineer and Master''s degree in Artificial Intelligence and Data Science. My work sits where machine learning meets data engineering: computer-vision models that read license plates and container codes in noisy port environments, OCR systems that turn documents into structured data, and the pipelines, warehouses and APIs that carry that data into production.

As co-founder and Head of AI at SnapTextAI, I take models from research to real-time document processing integrated with CRM and ERP systems. I also build end-to-end data platforms with Airflow, Spark, Kafka, dbt and Delta Lake, tested and shipped with CI.

I work as a freelancer across France, in French or English.',
  location = 'Paris, France',
  availability = 'Available for freelance missions in France, remote or on-site',
  languages = '{"French: fluent (C2)","English: fluent (C2)","Arabic: native"}',
  contact_email = 'mohamedabderrahmaneheouaine7@gmail.com',
  photo_url = '/photo.png',
  updated_at = now()
where id = 1;

insert into experiences (kind, title, organization, location, start_label, end_label, summary, highlights, tags, sort_order) values
('work', 'Computer Vision & Data Engineering Researcher', 'BMT (final-year engineering project)', '', 'Jan 2026', 'Present',
 'Automated pipeline that detects and recognizes license plates and container codes in real-world port environments.',
 '{"Designed the system architecture, from image acquisition to validated predictions","Hybrid approach combining YOLO detection with CNN/CRNN character classification for noisy, multi-oriented text","Sequence reconstruction with structural constraints to improve recognition accuracy","Training and evaluation pipeline for deep learning models, with data management and test automation"}',
 '{Python,PyTorch,YOLOv8/v9,OpenCV,TensorFlow,Pandas}', 1),
('work', 'Software & Data Engineering Intern', 'Institut Portuaire BMT', 'Béjaïa, Algeria', 'Jun 2025', 'Aug 2025',
 'Web platform that digitizes and secures port access authorizations for people and vehicles.',
 '{"Designed the data flows for users, vehicles and access events, with validation and tracking","Built the interfaces for requests, authorizations and real-time access tracking","Integrated access control and role management"}',
 '{Python,Django,JavaScript,"REST APIs",PostgreSQL}', 2),
('work', 'Co-Founder & Head of AI', 'SnapTextAI', '', '', 'Present',
 'Startup in intelligent OCR and automated document processing.',
 '{"Designed and supervised OCR and contextual document-analysis models","Structured unstructured data from images and integrated it into CRM/ERP systems","Set up the API and cloud architecture for real-time processing of document flows","Defined the technology roadmap and applied AI research directions"}',
 '{OCR,"Deep learning",APIs,Cloud}', 3),
('education', 'Dual degree: State Engineer & Master''s in AI and Data Science',
 'École Supérieure en Sciences et Technologies de l''Informatique et du Numérique (ESTIN)', 'Béjaïa, Algeria', 'Sept 2021', '2026',
 'Specialization in artificial intelligence, data science and computer vision.',
 '{"Ranked 15th out of 171 in 3rd year"}', '{}', 1),
('certification', 'Fundamentals of Reinforcement Learning', 'University of Alberta & Amii (Coursera)', '', '', '',
 'Markov decision processes, policies, value functions and optimization methods, with algorithm implementations.', '{}', '{}', 1),
('certification', 'Data Scientist in Python', 'DataCamp', '', '', '',
 'Machine learning model development, data analysis and predictive modeling.', '{}', '{}', 2),
('certification', 'Associate Data Scientist in Python', 'DataCamp', '', '', '',
 'Data manipulation, cleaning, exploration and machine learning fundamentals.', '{}', '{}', 3),
('certification', 'Data Analyst in Python', 'DataCamp', '', '', '',
 'Extraction, transformation, visualization and interpretation of data.', '{}', '{}', 4);

insert into skill_groups (name, items, sort_order) values
('AI & Machine Learning', '{PyTorch,TensorFlow,Scikit-learn,"CNN / CRNN","RNN / LSTM",GANs,"Transfer learning","Model optimization"}', 1),
('Computer Vision & OCR', '{"YOLOv8 / v9",OpenCV,OCR,"Text recognition","Document AI"}', 2),
('Data Engineering', '{Airflow,Spark,Kafka,dbt,"Delta Lake","ETL / ELT","Data modeling","Data quality"}', 3),
('Data & Databases', '{SQL,PostgreSQL,DuckDB,NoSQL,Pandas,NumPy}', 4),
('Cloud & DevOps', '{Docker,Terraform,"GitHub Actions",S3,"REST APIs"}', 5),
('Software & Web', '{Python,JavaScript,NestJS,Django,Next.js,Angular}', 6);

-- Projects: professional categories, no program-day labels, CV projects first.
update projects set category = 'Data Engineering', period = '2026', featured = slug in ('velib-live-pipeline', 'kafka-streaming', 'delta-medallion')
  where category = 'Data pipelines';
update projects set category = 'SQL & Analytics', period = '2025', featured = false
  where category = 'SQL analytics';

insert into projects (slug, title, summary, description, category, period, tags, highlights, color, featured, sort_order) values
('plate-container-recognition', 'License plate & container code recognition',
 'Detects and reads license plates and shipping-container codes in real port conditions: noisy images, multi-oriented text.',
 'An automated pipeline for a port operator that finds license plates and container codes in camera images and reads them reliably, even when images are noisy and the text is rotated or partly hidden.

Detection (YOLO) and character recognition (CNN/CRNN) are combined in one hybrid system, and sequence reconstruction uses the structure of plate and container-code formats to correct predictions. A training and evaluation pipeline manages the data, retrains the models and runs automated tests.',
 'AI & Computer Vision', '2026', '{Python,PyTorch,"YOLOv8 / v9",OpenCV,TensorFlow}',
 '{"Hybrid detection + recognition architecture","Structural constraints improve accuracy on noisy, multi-oriented text","Automated training, evaluation and testing"}',
 '#a78bfa', true, 1),
('snaptextai', 'SnapTextAI: intelligent OCR',
 'OCR and document-analysis startup: turns images of documents into structured data delivered to CRM and ERP systems in real time.',
 'As co-founder and Head of AI, I designed and supervised the OCR and contextual document-analysis models, and the methods that structure the extracted data so it can flow into business systems.

I set up the API and cloud architecture for real-time processing of document flows, translated customer problems into data-science approaches, and steered the technology roadmap.',
 'AI & Computer Vision', 'Ongoing', '{OCR,"Deep learning",Python,APIs,Cloud}',
 '{"Models from research to production","Real-time document processing","CRM / ERP integration"}',
 '#f472b6', true, 2),
('port-access-platform', 'Port access management platform',
 'Web platform that digitizes and secures entry and exit authorizations for people and vehicles at a port.',
 'Built during an internship at Institut Portuaire BMT. The platform replaces paper processes for port access: requests, approvals and real-time tracking of entries and exits, with data flows for users, vehicles and access events.

Role-based access control and validation rules keep the system reliable and auditable.',
 'Web & Software', '2025', '{Python,Django,JavaScript,"REST APIs",PostgreSQL}',
 '{"Digitized access requests and approvals","Real-time access tracking","Role-based access control"}',
 '#60a5fa', true, 1);
