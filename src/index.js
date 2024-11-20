"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = exports.Database = void 0;
var Database_1 = require("./classes/Database");
Object.defineProperty(exports, "Database", { enumerable: true, get: function () { return Database_1.Database; } });
var Events;
(function (Events) {
    Events["Connect"] = "connect";
    Events["Ready"] = "connect";
    Events["Disconnect"] = "disconnect";
    Events["Close"] = "disconnect";
    Events["Error"] = "error";
    Events["Acquire"] = "acquire";
    Events["Release"] = "release";
    Events["Connection"] = "connection";
    Events["Enqueue"] = "enqueue";
})(Events || (exports.Events = Events = {}));
