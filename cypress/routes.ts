// Every route the build emits, in one place so the accessibility and weight
// specs cannot disagree about what the site is. A unit assertion in
// src/build-output.test.ts compares this to dist/ and fails on drift, because
// the first accessibility pass listed eight of eighteen routes and missed a
// real defect on a promoted post.
//
// It is a module rather than derived at run time because `allowCypressEnv` is
// deliberately false here, and a spec cannot generate its tests from a promise.
//
// Docs-mount routes are the exception: they derive from the manifests, so a
// synced page cannot be missing from the accessibility and weight sweeps.
import { DOCS_ROUTES, GUIDES_ROUTES } from "../src/data/docs-mount-routes.js"

export const ROUTES = [
  ...DOCS_ROUTES,
  ...GUIDES_ROUTES,
  "/",
  "/404.html",
  "/about/",
  "/coilysiren-personal-gmail-privacy/",
  "/cool-people/",
  "/hiring/",
  "/posts/3-cloud-standoff/",
  "/posts/azure-openai-terraform/",
  "/posts/code-janitor/",
  "/posts/deleting-the-mechanical-scorer/",
  "/posts/golang-pr-notes-1/",
  "/posts/golang-pr-notes-2/",
  "/posts/golang-pr-notes-3/",
  "/posts/heroku-django-sass/",
  "/posts/on-permissions-models-for-cloud-platform-providers/",
  "/posts/stochastic-design-iteration/",
  "/projects/agent-compose/",
  "/projects/housecast/",
  "/projects/mcp-beaver/",
  "/projects/umbra/",
  "/resume/",
  // The vanity twins are real routes with their own chrome, so they carry the
  // same accessibility and weight floor as the pages they mirror.
  "/vanity/agent-compose/",
  "/vanity/housecast/",
  "/vanity/mcp-beaver/",
  "/vanity/umbra/",
  "/writing/",
]
