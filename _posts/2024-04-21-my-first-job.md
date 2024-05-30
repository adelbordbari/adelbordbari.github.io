---
title: "My First Job"
layout: "post"
---

## Table of Contents
- [Introduction](#introduction)
- [Front-End](#front-end)
- [Back-End](#back-end)
- [Footnotes](#footnotes)

---

## Introduction
Back in 2022 by the end of summer, I was sure of the university entrance exam result. I got the results on the website one evening, and apparently, I was accepted to study for an M.S. in AI, as an online coursework. turning the threat into an opportunity, I decided that the only way to make this 2 years count, is to have a clear set of goals: first was to work; second was to get the best grades possible; and third was to publish at least one research paper. I started looking for jobs right away.

I had some experience in Python, and I was fairly familiar with Django as well. I had only done student projects by then, so I wasn't familiar with landing an actual job: writing a resume, job interviews, and all that jazz.

After 4 months of rejection and frustration (but growing gradually alongside), I finished the first semester (out of four). after coming back to my hometown I felt more than ever determined to find a job. in the winter, I was approached by a company that was looking for a backend developer. we had two sessions, and I went through several psychology tests (Holland, NEO, etc.) too but they suddenly stopped contacting me, I never found out why.

Among my many applications on various job boards, I finally got a call on my phone. the job was an internship for a server maintenance 1000 kilometers away. I knew the company, they're a large hosting service provider. the internship was three months long without payments. I had to make a decision, this was the only place that wanted me, and they said that they needed an answer by the next day! so I started consulting with everyone I knew.

I called several people that same day, to see if it was worth it. it wasn't a small decision after all, literally and metaphorically. I called a friend of mine who worked and studied to see if it's a doable option. while we talked, they told me that the company they work at needs a front-end developer and that I should apply.

My plan for the next two months was to retouch my front-end skills and put up some sample projects on my Github. I learned React and created an admin dashboard to _show off_. I felt lucky and told them that I'd contact the company tomorrow. I emailed them, I had an interview, and I got the job. I found Maximilian Schwarzmüller's extensive course on Udemy specifically informative.

## Front End
I started off as a front-end developer, creating a monitoring panel for the operators (who would be the users of the dashboard responsible for preparing the content and not the end users). the panel would be:

1. responsive(in five width ranges)
2. in dark and light color modes
3. in both English and Farsi (RTL direction)
4. any menu would fold in small screens: a kebab menu and a hamburger menu that had their own routing
5. users could log in using an external provider (google log in)

This was a crucial time because it was my first committed job. I practiced teamwork, honesty, and communication. I most importantly learned to not under/overestimate my abilities.
promising to do a small task in two days and _actually doing it_ is way better than promising that you'd do it in 5 hours but failing to do so.

We adopted the mobile-first approach, also implementing the English (LTR), dark mode. then process to English light mode, and finally seal the deal by implementing the Farsi, RTL mode. both theme and language would change with a button. we also had our own color palette that included over 80 colors.

We held sessions every day. I reported my work on Notion, checking tasks and reporting work hours. 

This took almost three months. I worked the first two months under a "project-based" contract. later moving on to being hired long-term.

I used these for creating the panel:
- Javascript (ES6)
- JQuery: in a few use cases
- HTML & CSS
- React: as the main framework
- TailwindCSS (& TailwindUI): styles. [link](https://tailwindcss.com/)
- `react-router-dom`: the sidebar and other routings. [link](https://reactrouter.com/en/main)
- `styled-components`: extra styling. [link](https://www.styled-components.com/)
- `amcharts`: charting library, especially maps. [link](https://www.amcharts.com/)

I would receive the designs from Figma, and implement them using the tech stack mentioned above.

I used the atomic system, where I had `atoms` as my indivisible UI elements, and went up to `templates` that would be full pages.

### challenges
My biggest challenge at first routing. I couldn't get around the ideas but the tutorial from [ui.dev](ui.dev) finally helped me get the idea. I also watched many hours of courses and tutorials, most significantly [React - The Complete Guide 2024 (incl. Next.js, Redux) by Maximilian Schwarzmüller](https://www.udemy.com/course/react-the-complete-guide-incl-redux/?couponCode=24T3MT53024). the course is pervasive. However, I still feel guilty to have skipped the last few chapters.

other than that, most of the challenges were minor. to name some:
- CSS transition/animations: every click was animated and there were many moving parts.
- Google login: finally made easy by using [react-oauth/google](https://www.npmjs.com/package/@react-oauth/google)
- the breadcrumb
- clickable overlays

this is what the result looked like[^1]:

![image](https://github.com/adelbordbari/adelbordbari.github.io/assets/13819151/3dadb67a-bcb7-4973-832f-2dc0675fe8ec)

mobile view:

![image](https://github.com/adelbordbari/adelbordbari.github.io/assets/13819151/0f59baba-8443-44c1-aa3c-dd6b10fee6ca)

## Back End
Four months later, I started developing the backend for the same panel. I started using [FastAPI](https://fastapi.tiangolo.com/). I loved it since I the GitHub repository. it's very fresh, fast, and interesting but despite all this I felt like developing with FastAPI is a lonely process and the framework is not mature engouh for a novice. I didn't give Flast a try yet because the obvious choice was already on the table. I ditched FastAPI and switched to Django Rest Framework (drf). most of the work includes basic CRUDs and database design.

Although there have been several exceptions that happened to be rather challenging. here's a list:
1. which constraints should be handled in database level and which in serializer level
2. setting up Postman, examples, error codes and messages, tests, etc.
3. JWT auth
4. OTP login via SMS (generation, validation, refresh. this was where I gave up on FastAPI earlier)
5. an endpoint that works with `geopy` and user's location
6. nested serializers
7. customizing drf's Browsable API
8. custom user model (an unordinary one, e.g., it had an optional password field)
9. drf settings, `.env`s and deployment (on [Liara](https://liara.ir/) for test)
10. protected endpoints (e.g., endpoints that require login)
11. [race conditions](/code-race-condition-drf/)
12. multiple scenarios (attempting to be as exclusive as possible)

## Footnotes
[^1]: in this screenshot, I've logged in using my Google account, and a navbar item is clicked, the overlay is expanded
