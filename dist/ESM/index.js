export { Database } from './classes/Database';
export var Events;
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
})(Events || (Events = {}));
