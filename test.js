import {
  assert,
  assertEquals,
  assertMatch,
} from "https://deno.land/std/testing/asserts.ts";

import * as errs from "./errs.js";

function assertTransparentStack(err) {
  assert(typeof err.stack === "string");
  err.stack.split("\n").forEach(function (line) {
    assert(!/errs\.js\:/.test(line));
  });
}

const opts = [{
  foo: "bar",
  status: 404,
  whatever: "some other property",
}, {
  testing: true,
  "some-string": "is-a-value",
  message: "This is an error. There are many like it.",
}, {
  "a-function": "that returns an object",
  should: true,
  have: 4,
  properties: "yes",
}];

const macros = {
  create: {
    string: (msg) => {
      let err = errs.create(msg);
      assert(err instanceof Error);
      assertEquals(msg, err.message);
      assertTransparentStack(err);
    },
    object: (obj) => {
      let err = errs.create(obj);
      assert(err instanceof Error);
      assertEquals(err.message, obj.message || "Unspecified error");
      assertTransparentStack(err);
      Object.keys(obj).forEach(function (key) {
        assertEquals(err[key], obj[key]);
      });
    },
    err: (inst) => {
      let err = errs.create(inst);
      assert(err == inst);
      assertTransparentStack(err);
    },
    registered: (type, proto, obj) => {
      let err = errs.create(type, obj);
      assert(err instanceof (proto || Error));
      assertEquals(err.message, obj.message || "Unspecified error");
      assertTransparentStack(err);
      Object.keys(obj).forEach(function (key) {
        assertEquals(err[key], obj[key]);
      });
    },
  },
};

class NamedError extends Error {
  constructor() {
    super();
    this.named = true;
  }
}

class AnError extends Error {
  constructor() {
    super();
    this.named = true;
  }
}

Deno.test("register() should register the prototype", () => {
  errs.register("named", NamedError);
  assertEquals(errs.registered["named"], NamedError);
});

Deno.test("register() register an error without providing its name", () => {
  errs.register(AnError);
  assertEquals(errs.registered["anerror"], AnError);
});

Deno.test("create() with a string", () =>
  macros.create.string("An error as a string"));

Deno.test("create() with an object that has no message", () =>
  macros.create.object(opts[0]));

Deno.test("create() with an object that has a message", () =>
  macros.create.object(opts[1]));

Deno.test("create() with an object that has a name", () => {
  let err = errs.create({ name: "OverflowError" });
  assertMatch(err.stack, /^OverflowError/);
});

Deno.test("create() with an error", () =>
  macros.create.err(new Error("An existing error")));

Deno.test("create() with a registered type that exists", () =>
  macros.create.registered("named", NamedError, opts[1]));

Deno.test("create() with a registered type that doesn't exist", () =>
  macros.create.registered("bad", null, opts[1]));

Deno.test("merge() supports an undefined error", () => {
  let err = errs.merge(undefined, { message: "oh noes!" });
  assertEquals(err.message, "oh noes!");
  assert(err instanceof Error);
});

Deno.test("merge() supports a null error", () => {
  let err = errs.merge(null, { message: "oh noes!" });
  assertEquals(err.message, "oh noes!");
  assert(err instanceof Error);
});

Deno.test("merge() supports a false error", () => {
  let err = errs.merge(false, { message: "oh noes!" });
  assertEquals(err.message, "oh noes!");
  assert(err instanceof Error);
});

Deno.test("merge() supports a string error", () => {
  let err = errs.merge("wat", { message: "oh noes!" });
  assertEquals(err.message, "oh noes!");
  assert(err instanceof Error);
});

Deno.test("merge() should preserve custom properties", () => {
  let err = new Error("Msg!");
  err.foo = "bar";
  err = errs.merge(err, { message: "Override!", ns: "test" });
  assertEquals(err.foo, "bar");
});

Deno.test("merge() should have a stack trace", () => {
  let err = new Error("Msg!");
  err = errs.merge(err, {});
  assert(Array.isArray(err.stacktrace));
});

Deno.test("should preserve message specified in create", () => {
  let err = new Error("Msg!");
  err = errs.merge(err, { message: "Override!" });
  assertEquals(err.message, "Override!");
});

Deno.test("should preserve properties specified", () => {
  let err = new Error("Msg!");
  err = errs.merge(err, { ns: "test" });
  assertEquals(err.ns, "test");
});

Deno.test("with a truthy value", () => {
  let err = errs.merge(true, {
    message: "Override!",
    ns: "lolwut",
  });
  assertEquals(err.message, "Override!");
  assertEquals(err.ns, "lolwut");
});

Deno.test("with a truthy stack", () => {
  let err = errs.merge({ stack: true }, {
    message: "Override!",
    ns: "lolwut",
  });
  assertEquals(err.message, "Override!");
  assertEquals(err.ns, "lolwut");
});

Deno.test("with an Array stack", () => {
  let err = errs.merge({ stack: [] }, {
    message: "Override!",
    ns: "lolwut",
  });
  assertEquals(err.message, "Override!");
  assertEquals(err.ns, "lolwut");
});

Deno.test("Error.prototype.toJSON should exist", () => {
  assert(Error.prototype.toJSON);

  let json = (new Error("Testing 12345")).toJSON();

  ["message", "stack", "arguments", "type"].forEach(function (prop) {
    assert(Object.getOwnPropertyDescriptor(json, prop));
  });
});

Deno.test("Error.prototype.toJSON should be writable", () => {
  let orig = Error.prototype.toJSON;
  Error.prototype.toJSON = function () {
    return "foo";
  };
  let json = (new Error("Testing 12345")).toJSON();

  assertEquals(json, "foo");
  Error.prototype.toJSON = orig;
});
