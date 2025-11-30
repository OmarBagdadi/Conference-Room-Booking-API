# AI Usage Report

During this assessment I made use of AI‑driven tools as part of my workflow. My goal was not to rely on it for complete solutions, but to use it as a way to explore different approaches, refine code, and speed up documentation. I treated the input as guidance that I could validate, adapt, or reject based on my own expertise. What follows is a reflection on how I applied these tools, which prompts were most effective, what I adjusted, and where I balanced external suggestions with my own technical judgment.

## How I used tools during this assessment
Throughout the assessment I made use of digital tools to accelerate certain parts of the work. It was particularly useful for brainstorming approaches, refining code structure, and checking edge cases in booking logic. I treated it as a sounding board rather than a source of final answers, using it to explore different ways of handling concurrency, transactions, and schema design.

## Prompts and questions that were most effective
The most effective questions were those where I asked for concrete improvements to existing code, such as “adjust my seed script to only seed dates between 9am and 5pm” or “wrap my update flow in a transaction.” These targeted prompts gave me practical suggestions that I could immediately test and integrate.

## Validate or Modifications from AI suggestions
I didn’t take suggestions at face value. I validated them against my own understanding of database constraints, transaction handling, and API design. For example, when transaction blocks were suggested, I checked that they aligned with Prisma’s transaction API and adjusted the code to ensure IDs and dependencies were handled correctly. If it made any schema suggestions I would check that its not introducing any redundancy to the database.

## Challenges solved vs. where I relied on my own expertise
The tools helped me solve repetitive or structural challenges, like ensuring consistency across create/update/delete flows. It also helped me think through concurrency scenarios and promotion logic. However, I relied on my own expertise for deeper architectural decisions, such as the main flow in creating,updating and deleteing of bookings, how to normalize the schema, and how to anticipate scalability needs with Docker. My own judgment was key in verifying correctness and adapting suggestions to fit the project’s requirements.

## Database design and verification of correctness
Yes, the tools provided input on database design, especially around normalization and handling recurrence rules. I verified correctness by cross‑checking against relational database principles (3NF), ensuring foreign keys and unique constraints were properly applied, and testing with seed scripts and migrations. I also used Prisma Studio to inspect seeded data and confirm that relationships and constraints behaved as expected.



