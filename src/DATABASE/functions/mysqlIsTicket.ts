module.exports = async (d: any) => {
    const data = d.util.aoiFunc(d);
    const [channelID = d.channel?.id] = data.inside.splits;
    const isTicket = await d.client.mysql.get("__aoijs_vars__", "ticketChannel", channelID);
    data.result = !!isTicket;
    return {
        code: d.util.setCode(data),
    };
};
