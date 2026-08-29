import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import {
  disconnectRedis,
  redisConnection,
} from "../../src/configs/redis.config.js";
import { prisma } from "../../src/db/db.client.js";
import { generateEmailVerificationToken } from "../../src/modules/auth/auth.tokens.js";
import { ids, definition } from "../fixtures.js";

type Session = { token: string; userId: string };
let owner: Session;
let stranger: Session;
let surveyId = "";
const respondent = request.agent(app);

const auth = (session: Session) => ({
  Authorization: `Bearer ${session.token}`,
});

const createVerifiedUser = async (suffix: string): Promise<Session> => {
  const email = `${suffix}@example.com`;
  const registration = await request(app).post("/api/v1/auth/sign-up").send({
    name: suffix,
    email,
    password: "correct horse battery staple",
  });
  expect(registration.status).toBe(201);
  const userId = registration.body.data.user.id as string;
  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
  });
  const login = await request(app).post("/api/v1/auth/sign-in").send({
    email,
    password: "correct horse battery staple",
  });
  expect(login.status).toBe(200);
  expect(login.headers["set-cookie"]?.[0]).toMatch(/refreshToken=.*HttpOnly/);
  return { token: login.body.data.accessToken as string, userId };
};

describe.sequential("Dynamic Surveys API", () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL?.includes("dynamic_surveys_test")) {
      throw new Error(
        "Integration tests refuse to run outside the dedicated dynamic_surveys_test database",
      );
    }
    await prisma.$connect();
    await prisma.response.deleteMany();
    await prisma.survey.deleteMany();
    await prisma.respondentSession.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.user.deleteMany();
    if (redisConnection.status === "wait") await redisConnection.connect();
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redisConnection.scan(
        cursor,
        "MATCH",
        "rate-limit:survey-submit:*",
        "COUNT",
        100,
      );
      cursor = nextCursor;
      if (keys.length > 0) await redisConnection.del(...keys);
    } while (cursor !== "0");
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await disconnectRedis();
  });

  it("reports health and rejects unauthenticated creator routes", async () => {
    expect((await request(app).get("/health")).status).toBe(200);
    const response = await request(app).get("/api/v1/surveys");
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("registers, protects unverified login, and authenticates verified creators", async () => {
    const pending = await request(app).post("/api/v1/auth/sign-up").send({
      name: "Pending",
      email: "pending@example.com",
      password: "correct horse battery staple",
    });
    expect(pending.status).toBe(201);
    expect(
      (
        await request(app).post("/api/v1/auth/sign-in").send({
          email: "pending@example.com",
          password: "correct horse battery staple",
        })
      ).status,
    ).toBe(401);
    const verification = generateEmailVerificationToken();
    await prisma.user.update({
      where: { email: "pending@example.com" },
      data: {
        emailVerificationTokenHash: verification.tokenHash,
        emailVerificationTokenExpires: verification.expiresAt,
      },
    });
    expect(
      (await request(app).get(`/api/v1/auth/verify/${verification.token}`))
        .status,
    ).toBe(200);
    expect(
      (
        await request(app).post("/api/v1/auth/sign-in").send({
          email: "pending@example.com",
          password: "correct horse battery staple",
        })
      ).status,
    ).toBe(200);
    owner = await createVerifiedUser("Owner");
    stranger = await createVerifiedUser("Stranger");
    const me = await request(app).get("/api/v1/auth/me").set(auth(owner));
    expect(me.body.data.user).toMatchObject({
      id: owner.userId,
      email: "owner@example.com",
    });
    expect(me.body.data.user).not.toHaveProperty("passwordHash");
  });

  it("creates and lists only the owner surveys", async () => {
    const created = await request(app)
      .post("/api/v1/surveys")
      .set(auth(owner))
      .send({
        title: "Developer survey",
        description: "Backend test",
        schema: definition,
      });
    expect(created.status).toBe(201);
    surveyId = created.body.data.survey.id as string;

    const ownerList = await request(app)
      .get("/api/v1/surveys")
      .set(auth(owner));
    expect(ownerList.body.data.surveys).toHaveLength(1);
    const strangerList = await request(app)
      .get("/api/v1/surveys")
      .set(auth(stranger));
    expect(strangerList.body.data.surveys).toHaveLength(0);
  });

  it("enforces ownership for read, update, delete, and analytics", async () => {
    const routes = [
      request(app).get(`/api/v1/surveys/${surveyId}`).set(auth(stranger)),
      request(app)
        .patch(`/api/v1/surveys/${surveyId}/metadata`)
        .set(auth(stranger))
        .send({ title: "Stolen" }),
      request(app)
        .get(`/api/v1/surveys/${surveyId}/analytics`)
        .set(auth(stranger)),
      request(app).delete(`/api/v1/surveys/${surveyId}`).set(auth(stranger)),
    ];
    for (const responsePromise of routes)
      expect((await responsePromise).status).toBe(404);
  });

  it("allows metadata and structural changes before submission", async () => {
    const metadata = await request(app)
      .patch(`/api/v1/surveys/${surveyId}/metadata`)
      .set(auth(owner))
      .send({ title: "Updated developer survey" });
    expect(metadata.status).toBe(200);

    const reordered = structuredClone(definition);
    const notes = reordered.questions.pop();
    if (notes) reordered.questions.splice(3, 0, notes);
    const structure = await request(app)
      .put(`/api/v1/surveys/${surveyId}/schema`)
      .set(auth(owner))
      .send(reordered);
    expect(structure.status).toBe(200);
    expect(structure.body.data.survey.schema.questions[3].id).toBe(ids.text);

    await request(app)
      .put(`/api/v1/surveys/${surveyId}/schema`)
      .set(auth(owner))
      .send(definition)
      .expect(200);
  });

  it("creates and reuses an opaque anonymous respondent cookie", async () => {
    const first = await respondent.get(`/api/v1/public/surveys/${surveyId}`);
    expect(first.status).toBe(200);
    expect(first.body.data.survey).not.toHaveProperty("creatorId");
    const cookie = first.headers["set-cookie"]?.[0] as string;
    expect(cookie).toMatch(/respondentSession=.*HttpOnly/);
    const sessionCount = await prisma.respondentSession.count();
    await respondent
      .get(`/api/v1/public/surveys/${surveyId}/response`)
      .expect(200);
    expect(await prisma.respondentSession.count()).toBe(sessionCount);
  });

  it("upserts and restores a partial draft without duplicate rows", async () => {
    const first = await respondent
      .put(`/api/v1/public/surveys/${surveyId}/response`)
      .send({ answers: { [ids.single]: ids.yes } });
    expect(first.status).toBe(200);
    const second = await respondent
      .put(`/api/v1/public/surveys/${surveyId}/response`)
      .send({ answers: { [ids.single]: ids.no } });
    expect(second.status).toBe(200);
    expect(await prisma.response.count({ where: { surveyId } })).toBe(1);
    const restored = await respondent.get(
      `/api/v1/public/surveys/${surveyId}/response`,
    );
    expect(restored.body.data.response).toMatchObject({
      status: "DRAFT",
      answers: { [ids.single]: ids.no },
    });
  });

  it("validates every draft answer that is present", async () => {
    const unknown = await respondent
      .put(`/api/v1/public/surveys/${surveyId}/response`)
      .send({
        answers: { "99999999-9999-4999-8999-999999999999": "forged" },
      });
    expect(unknown.status).toBe(400);
    const forged = await respondent
      .put(`/api/v1/public/surveys/${surveyId}/response`)
      .send({
        answers: { [ids.single]: ids.red },
      });
    expect(forged.status).toBe(400);
  });

  it("keeps closed surveys viewable and drafts readable but rejects writes and submissions", async () => {
    await request(app)
      .patch(`/api/v1/surveys/${surveyId}/accepting-responses`)
      .set(auth(owner))
      .send({ acceptingResponses: false })
      .expect(200);
    const publicSurvey = await respondent.get(
      `/api/v1/public/surveys/${surveyId}`,
    );
    expect(publicSurvey.status).toBe(200);
    expect(publicSurvey.body.data.survey.acceptingResponses).toBe(false);
    expect(
      (await respondent.get(`/api/v1/public/surveys/${surveyId}/response`))
        .status,
    ).toBe(200);
    expect(
      (
        await respondent
          .put(`/api/v1/public/surveys/${surveyId}/response`)
          .send({ answers: {} })
      ).status,
    ).toBe(403);
    expect(
      (
        await respondent
          .post(`/api/v1/public/surveys/${surveyId}/submissions`)
          .send({ answers: {} })
      ).status,
    ).toBe(403);
  });

  it("continues a draft after reopening and enforces conditional final validation", async () => {
    await request(app)
      .patch(`/api/v1/surveys/${surveyId}/accepting-responses`)
      .set(auth(owner))
      .send({ acceptingResponses: true })
      .expect(200);
    const hiddenForged = {
      [ids.single]: ids.no,
      [ids.conditionalText]: "should be hidden",
      [ids.multi]: [ids.red],
      [ids.rating]: 4,
    };
    expect(
      (
        await respondent
          .post(`/api/v1/public/surveys/${surveyId}/submissions`)
          .send({ answers: hiddenForged })
      ).status,
    ).toBe(400);
    const missingVisibleRequired = {
      [ids.single]: ids.yes,
      [ids.multi]: [ids.red],
      [ids.rating]: 4,
    };
    expect(
      (
        await respondent
          .post(`/api/v1/public/surveys/${surveyId}/submissions`)
          .send({ answers: missingVisibleRequired })
      ).status,
    ).toBe(400);
  });

  it("submits once, rejects duplicate/edit attempts, and locks structure", async () => {
    const answers = {
      [ids.single]: ids.yes,
      [ids.conditionalText]: "Survey APIs",
      [ids.multi]: [ids.red, ids.blue],
      [ids.rating]: 4,
      [ids.text]: "Useful",
    };
    expect(
      (
        await respondent
          .post(`/api/v1/public/surveys/${surveyId}/submissions`)
          .send({ answers })
      ).status,
    ).toBe(201);
    expect(
      (
        await respondent
          .post(`/api/v1/public/surveys/${surveyId}/submissions`)
          .send({ answers })
      ).status,
    ).toBe(409);
    expect(
      (
        await respondent
          .put(`/api/v1/public/surveys/${surveyId}/response`)
          .send({ answers })
      ).status,
    ).toBe(409);
    const locked = await request(app)
      .put(`/api/v1/surveys/${surveyId}/schema`)
      .set(auth(owner))
      .send({ questions: [] });
    expect(locked.status).toBe(409);
    expect(locked.body.message).toMatch(/cannot be changed/);
    expect(
      (
        await request(app)
          .patch(`/api/v1/surveys/${surveyId}/metadata`)
          .set(auth(owner))
          .send({ description: "Still editable" })
      ).status,
    ).toBe(200);
  });

  it("computes analytics from submitted responses only", async () => {
    const draftAgent = request.agent(app);
    await draftAgent.get(`/api/v1/public/surveys/${surveyId}`).expect(200);
    await draftAgent
      .put(`/api/v1/public/surveys/${surveyId}/response`)
      .send({ answers: { [ids.single]: ids.no } })
      .expect(200);
    const response = await request(app)
      .get(`/api/v1/surveys/${surveyId}/analytics`)
      .set(auth(owner));
    expect(response.status).toBe(200);
    const analytics = response.body.data.analytics;
    expect(analytics.totalSubmittedResponses).toBe(1);
    expect(
      analytics.questions.find(
        (question: { id: string }) => question.id === ids.conditionalText,
      ).answers,
    ).toEqual(["Survey APIs"]);
    expect(
      analytics.questions.find(
        (question: { id: string }) => question.id === ids.single,
      ).options,
    ).toEqual([
      { id: ids.yes, label: "Yes", count: 1 },
      { id: ids.no, label: "No", count: 0 },
    ]);
    expect(
      analytics.questions.find(
        (question: { id: string }) => question.id === ids.multi,
      ).options,
    ).toEqual([
      { id: ids.red, label: "Red", count: 1 },
      { id: ids.blue, label: "Blue", count: 1 },
    ]);
    expect(
      analytics.questions.find(
        (question: { id: string }) => question.id === ids.rating,
      ).average,
    ).toBe(4);
  });

  it("uses Redis-backed submission rate limiting", async () => {
    const created = await request(app)
      .post("/api/v1/surveys")
      .set(auth(owner))
      .send({ title: "Rate limit", schema: { questions: [] } });
    const rateSurveyId = created.body.data.survey.id as string;
    const rateAgent = request.agent(app);
    await rateAgent.get(`/api/v1/public/surveys/${rateSurveyId}`).expect(200);
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 11; attempt += 1) {
      const response = await rateAgent
        .post(`/api/v1/public/surveys/${rateSurveyId}/submissions`)
        .set("X-Forwarded-For", "203.0.113.77")
        .send({ answers: {} });
      statuses.push(response.status);
    }
    expect(statuses[0]).toBe(201);
    expect(statuses.at(-1)).toBe(429);
  });

  it("cascades owned survey deletion and denies cross-owner deletion", async () => {
    expect(
      (
        await request(app)
          .delete(`/api/v1/surveys/${surveyId}`)
          .set(auth(stranger))
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .delete(`/api/v1/surveys/${surveyId}`)
          .set(auth(owner))
      ).status,
    ).toBe(200);
    expect(await prisma.response.count({ where: { surveyId } })).toBe(0);
  });
});
