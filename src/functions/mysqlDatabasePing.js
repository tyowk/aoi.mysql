"use strict";
module.exports = async (d) => {
    const data = d.util.aoiFunc(d);
    data.result = await d.client.mysql.db.avgPing();
    return {
        code: d.util.setCode(data)
    };
};
