import { describe, expect, it } from "vitest";
import { TestDriver } from "testdriverai/vitest/hooks";

describe("SkillBridge Platform", () => {
  it("should display the landing page and allow navigating the onboarding and sign-in flows", async (context) => {
    const testdriver = TestDriver(context);

    const targetUrl = process.env.TEST_URL || "https://provide-deals-fundamental-hansen.trycloudflare.com";
    await testdriver.provision.chrome({ url: targetUrl });

    const landingAssert = await testdriver.assert("the headline \"Real work. Real pay. Right from campus.\" is visible");
    expect(landingAssert).toBeTruthy();

    await testdriver.find("\"I'm a student →\" button").click();

    const studentHeaderResult = await testdriver.assert("the header \"Join as a student\" and the badge \"STUDENT ACCOUNT\" are visible");
    expect(studentHeaderResult).toBeTruthy();

    await testdriver.find("\"I'm a business instead\" button").click();

    const businessHeaderResult = await testdriver.assert("the header \"Join as a business\" and the badge \"BUSINESS ACCOUNT\" are visible");
    expect(businessHeaderResult).toBeTruthy();

    await testdriver.scroll("down", { amount: 300 });

    await testdriver.find("\"Sign in\" link below \"Create business account\"").click();

    const signInResult = await testdriver.assert("the header \"Welcome back\" and the \"Sign in\" button are visible");
    expect(signInResult).toBeTruthy();
  });
});
