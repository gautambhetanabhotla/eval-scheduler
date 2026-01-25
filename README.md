# Eval scheduler

## Problem statement

We do a lot of manual evaluations for course assignments/projects. And to agree upon slots, we either release the time slots through an excel sheet or have students book their preferred slot through calendly or google calendar.

In spite of that, there are some inconveniences that still arise for TAs and students.

1. Rescheduling/swapping: Oftentimes none of the alloted slots work for the student or they might have some emergency come up. In some cases, TAs accept 2 people swapping time slots, but then they would need confirmation from both the students. It's a lot of bookkeepign for them to do.
2. Evals running behind schedule: Sometimes an eval might take longer than expected and hence the TA will have to inform on, say, Whatsapp, so that the students know to come a little later.

## Solution

This web app aims to mitigate both of those problems by:

1. Automating swap requests: A student who wishes to swap slots may simply put a request on the website to another person, and the other person can approve/deny it all without involvement of the TA.
2. Live schedule calculation: It automatically calculates how far behind schedule evaluations are based on when the TA marks the eval as "started".

Apart from the main features, this app also allows one to

- Create a course. This automatically makes them a TA for that course and they can manually make others TAs.
- Browse all upcoming evaluations. This is supported by filtering where you can see what evals you have to take and what you have to give.

## Tech stack
NextJS + Supabase + Lucide + Shadcn

## Instructions to run code

Supabase runs locally on a docker image.

```shell
bun i
bunx supabase start
bun dev
```

## Previous work referred to

None.

## AI tools used

This project has been built with the help of GitHub copilot. The chat history can be shared on request.
